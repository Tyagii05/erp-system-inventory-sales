import { useEffect, useState, useRef } from 'react';
import { getInvoices, generateInvoiceFromSalesOrder, updateInvoiceStatus, deleteInvoice } from '../services/invoiceService';
import { getSalesOrders } from '../services/salesOrderService';
import type { Invoice, SalesOrder } from '../types';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus, Trash2, Check, FileText, Download, Eye } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [invoicesData, ordersData] = await Promise.all([
        getInvoices(),
        getSalesOrders(),
      ]);
      setInvoices(invoicesData);
      setSalesOrders(ordersData.filter(o => o.status === 'APPROVED'));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateInvoice() {
    if (!selectedOrderId) return;
    try {
      await generateInvoiceFromSalesOrder(selectedOrderId);
      setModalOpen(false);
      setSelectedOrderId('');
      loadData();
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Error generating invoice. Please try again.');
    }
  }

  async function handleStatusChange(id: string, status: string) {
    try {
      await updateInvoiceStatus(id, status);
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await deleteInvoice(id);
      loadData();
    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
  }

  async function downloadPDF() {
    if (!invoiceRef.current || !selectedInvoice) return;
    
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice-${selectedInvoice.invoice_number}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  }

  function viewInvoice(invoice: Invoice) {
    setSelectedInvoice(invoice);
    setViewModalOpen(true);
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-emerald-100 text-emerald-700';
      case 'UNPAID': return 'bg-rose-100 text-rose-700';
      case 'OVERDUE': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const columns = [
    { key: 'invoice_number', header: 'Invoice #' },
    { key: 'customer', header: 'Customer', render: (row: Invoice) => row.customer?.name || 'N/A' },
    { key: 'invoice_date', header: 'Date', render: (row: Invoice) => new Date(row.invoice_date).toLocaleDateString() },
    {
      key: 'status',
      header: 'Status',
      render: (row: Invoice) => (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(row.status)}`}>
          {row.status}
        </span>
      ),
    },
    { key: 'total_amount', header: 'Total', render: (row: Invoice) => `$${row.total_amount.toLocaleString()}` },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
          <p className="text-slate-500 mt-1">Manage invoices and payments</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
        >
          <Plus size={18} />
          Generate Invoice
        </button>
      </div>

      <DataTable
        columns={columns}
        data={invoices}
        actions={(row: Invoice) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => viewInvoice(row)}
              className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
              title="View"
            >
              <Eye size={16} />
            </button>
            {row.status === 'UNPAID' && (
              <button
                onClick={() => handleStatusChange(row.id, 'PAID')}
                className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"
                title="Mark as Paid"
              >
                <Check size={16} />
              </button>
            )}
            <button
              onClick={() => handleDelete(row.id)}
              className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      />

      {/* Generate Invoice Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Generate Invoice from Sales Order"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Select Approved Sales Order</label>
            <select
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
            >
              <option value="">Select Order</option>
              {salesOrders.map(order => (
                <option key={order.id} value={order.id}>
                  {order.customer?.name} - ${order.total_amount.toLocaleString()}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateInvoice}
              disabled={!selectedOrderId}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              Generate
            </button>
          </div>
        </div>
      </Modal>

      {/* View Invoice Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="Invoice Details"
        size="lg"
      >
        {selectedInvoice && (
          <div className="space-y-4">
            <div ref={invoiceRef} className="bg-white p-6 border border-slate-200 rounded-lg">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">INVOICE</h2>
                  <p className="text-slate-500 mt-1">#{selectedInvoice.invoice_number}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedInvoice.status)}`}>
                    {selectedInvoice.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Bill To:</h3>
                  <p className="text-slate-900 font-medium">{selectedInvoice.customer?.name}</p>
                  <p className="text-slate-500 text-sm">{selectedInvoice.customer?.email}</p>
                  <p className="text-slate-500 text-sm">{selectedInvoice.customer?.phone}</p>
                  <p className="text-slate-500 text-sm">{selectedInvoice.customer?.address}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Invoice Date</p>
                  <p className="font-medium text-slate-900">{new Date(selectedInvoice.invoice_date).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <div className="flex justify-between py-2">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-medium">${selectedInvoice.subtotal?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-600">Tax (GST 18%)</span>
                  <span className="font-medium">${selectedInvoice.tax_amount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-t border-slate-200 mt-2">
                  <span className="text-lg font-bold text-slate-900">Total</span>
                  <span className="text-lg font-bold text-slate-900">${selectedInvoice.total_amount?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={downloadPDF}
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
              >
                <Download size={18} />
                Download PDF
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
