import { useEffect, useState } from 'react';
import { getGRNs, createGRN } from '../services/grnService';
import { getPurchaseOrders } from '../services/purchaseOrderService';
import { getProducts } from '../services/productService';
import type { GRN, PurchaseOrder, Product } from '../types';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus, FileText, Package } from 'lucide-react';

interface GRNItem {
  product_id: string;
  quantity_received: number;
  unit_price: number;
}

export default function GRNs() {
  const [grns, setGRNs] = useState<GRN[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    purchase_order_id: '',
    grn_number: '',
    notes: '',
  });
  const [items, setItems] = useState<GRNItem[]>([{ product_id: '', quantity_received: 1, unit_price: 0 }]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [grnsData, poData, productsData] = await Promise.all([
        getGRNs(),
        getPurchaseOrders(),
        getProducts(),
      ]);
      setGRNs(grnsData);
      setPurchaseOrders(poData.filter(po => po.status === 'ORDERED'));
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  function addItem() {
    setItems([...items, { product_id: '', quantity_received: 1, unit_price: 0 }]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof GRNItem, value: string | number) {
    const newItems = [...items];
    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      newItems[index] = {
        ...newItems[index],
        product_id: value as string,
        unit_price: product?.unit_price || 0,
      };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    setItems(newItems);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createGRN(
        {
          purchase_order_id: formData.purchase_order_id || null as any,
          grn_number: formData.grn_number || `GRN-${Date.now()}`,
          notes: formData.notes,
        },
        items
      );
      setModalOpen(false);
      setFormData({ purchase_order_id: '', grn_number: '', notes: '' });
      setItems([{ product_id: '', quantity_received: 1, unit_price: 0 }]);
      loadData();
    } catch (error) {
      console.error('Error creating GRN:', error);
      alert('Error creating GRN. Please try again.');
    }
  }

  const columns = [
    { key: 'grn_number', header: 'GRN Number' },
    { key: 'purchase_order', header: 'PO Reference', render: (row: GRN) => row.purchase_order ? `#${row.purchase_order.id.slice(0, 8)}` : 'Direct' },
    { key: 'received_date', header: 'Received Date', render: (row: GRN) => new Date(row.received_date).toLocaleDateString() },
    { key: 'notes', header: 'Notes' },
    {
      key: 'items',
      header: 'Items',
      render: (row: GRN) => (
        <span className="text-sm text-slate-600">
          {row.items?.length || 0} items
        </span>
      ),
    },
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
          <h1 className="text-2xl font-bold text-slate-900">Goods Receipt Notes</h1>
          <p className="text-slate-500 mt-1">Record incoming stock and update inventory</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
        >
          <Plus size={18} />
          New GRN
        </button>
      </div>

      <DataTable columns={columns} data={grns} />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Goods Receipt Note"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Purchase Order (Optional)</label>
              <select
                value={formData.purchase_order_id}
                onChange={(e) => setFormData({ ...formData, purchase_order_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
              >
                <option value="">Direct Receipt</option>
                {purchaseOrders.map(po => (
                  <option key={po.id} value={po.id}>PO from {po.supplier?.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">GRN Number</label>
              <input
                type="text"
                value={formData.grn_number}
                onChange={(e) => setFormData({ ...formData, grn_number: e.target.value })}
                placeholder={`GRN-${Date.now()}`}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              placeholder="Any additional notes..."
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">Received Items</label>
              <button
                type="button"
                onClick={addItem}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add Item
              </button>
            </div>

            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 bg-slate-50 rounded-lg">
                <div className="col-span-5">
                  <label className="block text-xs text-slate-500 mb-1">Product</label>
                  <select
                    value={item.product_id}
                    onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white"
                    required
                  >
                    <option value="">Select</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-slate-500 mb-1">Qty Received</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity_received}
                    onChange={(e) => updateItem(index, 'quantity_received', parseInt(e.target.value))}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm"
                    required
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs text-slate-500 mb-1">Unit Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={item.unit_price}
                    readOnly
                    className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-slate-100"
                  />
                </div>
                <div className="col-span-2">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Create GRN
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
