import { useEffect, useState } from 'react';
import { getPurchaseOrders, createPurchaseOrder, updatePurchaseOrderStatus, deletePurchaseOrder } from '../services/purchaseOrderService';
import { getSuppliers } from '../services/supplierService';
import { getProducts } from '../services/productService';
import type { PurchaseOrder, Supplier, Product } from '../types';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus, Trash2, Check, ClipboardList, Package } from 'lucide-react';

interface OrderItem {
  product_id: string;
  quantity: number;
  unit_price: number;
}

export default function PurchaseOrders() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    supplier_id: '',
    expected_delivery: '',
  });
  const [items, setItems] = useState<OrderItem[]>([{ product_id: '', quantity: 1, unit_price: 0 }]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [ordersData, suppliersData, productsData] = await Promise.all([
        getPurchaseOrders(),
        getSuppliers(),
        getProducts(),
      ]);
      setOrders(ordersData);
      setSuppliers(suppliersData);
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  function addItem() {
    setItems([...items, { product_id: '', quantity: 1, unit_price: 0 }]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof OrderItem, value: string | number) {
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
      await createPurchaseOrder(
        {
          supplier_id: formData.supplier_id,
          expected_delivery: formData.expected_delivery,
        },
        items
      );
      setModalOpen(false);
      setFormData({ supplier_id: '', expected_delivery: '' });
      setItems([{ product_id: '', quantity: 1, unit_price: 0 }]);
      loadData();
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error creating order. Please try again.');
    }
  }

  async function handleStatusChange(id: string, status: string) {
    try {
      await updatePurchaseOrderStatus(id, status);
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this order?')) return;
    try {
      await deletePurchaseOrder(id);
      loadData();
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ORDERED': return 'bg-amber-100 text-amber-700';
      case 'RECEIVED': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const columns = [
    { key: 'supplier', header: 'Supplier', render: (row: PurchaseOrder) => row.supplier?.name || 'N/A' },
    { key: 'order_date', header: 'Order Date', render: (row: PurchaseOrder) => new Date(row.order_date).toLocaleDateString() },
    { key: 'expected_delivery', header: 'Expected Delivery', render: (row: PurchaseOrder) => row.expected_delivery ? new Date(row.expected_delivery).toLocaleDateString() : 'N/A' },
    {
      key: 'status',
      header: 'Status',
      render: (row: PurchaseOrder) => (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(row.status)}`}>
          {row.status}
        </span>
      ),
    },
    { key: 'total_amount', header: 'Total', render: (row: PurchaseOrder) => `$${row.total_amount.toLocaleString()}` },
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
          <h1 className="text-2xl font-bold text-slate-900">Purchase Orders</h1>
          <p className="text-slate-500 mt-1">Manage purchase orders and track deliveries</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
        >
          <Plus size={18} />
          New Order
        </button>
      </div>

      <DataTable
        columns={columns}
        data={orders}
        actions={(row: PurchaseOrder) => (
          <div className="flex items-center gap-1">
            {row.status === 'ORDERED' && (
              <button
                onClick={() => handleStatusChange(row.id, 'RECEIVED')}
                className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"
                title="Mark as Received"
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

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Purchase Order"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Supplier</label>
              <select
                value={formData.supplier_id}
                onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                required
              >
                <option value="">Select Supplier</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Expected Delivery</label>
              <input
                type="date"
                value={formData.expected_delivery}
                onChange={(e) => setFormData({ ...formData, expected_delivery: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">Order Items</label>
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
                  <label className="block text-xs text-slate-500 mb-1">Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
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

          <div className="bg-slate-50 p-3 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Total Amount:</span>
              <span className="font-bold text-slate-900">
                ${items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0).toLocaleString()}
              </span>
            </div>
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
              Create Order
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
