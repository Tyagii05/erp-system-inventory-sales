import { useEffect, useState } from 'react';
import { getSalesOrders, createSalesOrder, updateSalesOrderStatus, deleteSalesOrder } from '../services/salesOrderService';
import { getCustomers } from '../services/customerService';
import { getProducts } from '../services/productService';
import type { SalesOrder, Customer, Product } from '../types';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus, Pencil, Trash2, ShoppingCart, Check, Truck, Clock } from 'lucide-react';

interface OrderItem {
  product_id: string;
  quantity: number;
  unit_price: number;
}

export default function SalesOrders() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '',
  });
  const [items, setItems] = useState<OrderItem[]>([{ product_id: '', quantity: 1, unit_price: 0 }]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [ordersData, customersData, productsData] = await Promise.all([
        getSalesOrders(),
        getCustomers(),
        getProducts(),
      ]);
      setOrders(ordersData);
      setCustomers(customersData);
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
      await createSalesOrder(
        { customer_id: formData.customer_id },
        items
      );
      setModalOpen(false);
      setFormData({ customer_id: '' });
      setItems([{ product_id: '', quantity: 1, unit_price: 0 }]);
      loadData();
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error creating order. Please try again.');
    }
  }

  async function handleStatusChange(id: string, status: string) {
    try {
      await updateSalesOrderStatus(id, status);
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this order?')) return;
    try {
      await deleteSalesOrder(id);
      loadData();
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock size={14} />;
      case 'APPROVED': return <Check size={14} />;
      case 'DISPATCHED': return <Truck size={14} />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-700';
      case 'APPROVED': return 'bg-emerald-100 text-emerald-700';
      case 'DISPATCHED': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const columns = [
    { key: 'customer', header: 'Customer', render: (row: SalesOrder) => row.customer?.name || 'N/A' },
    { key: 'order_date', header: 'Order Date', render: (row: SalesOrder) => new Date(row.order_date).toLocaleDateString() },
    {
      key: 'status',
      header: 'Status',
      render: (row: SalesOrder) => (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(row.status)}`}>
          {getStatusIcon(row.status)}
          {row.status}
        </span>
      ),
    },
    { key: 'total_amount', header: 'Total', render: (row: SalesOrder) => `$${row.total_amount.toLocaleString()}` },
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
          <h1 className="text-2xl font-bold text-slate-900">Sales Orders</h1>
          <p className="text-slate-500 mt-1">Manage sales orders and track status</p>
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
        actions={(row: SalesOrder) => (
          <div className="flex items-center gap-1">
            {row.status === 'PENDING' && (
              <button
                onClick={() => handleStatusChange(row.id, 'APPROVED')}
                className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"
                title="Approve"
              >
                <Check size={16} />
              </button>
            )}
            {row.status === 'APPROVED' && (
              <button
                onClick={() => handleStatusChange(row.id, 'DISPATCHED')}
                className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                title="Dispatch"
              >
                <Truck size={16} />
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
        title="Create Sales Order"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Customer</label>
            <select
              value={formData.customer_id}
              onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
              required
            >
              <option value="">Select Customer</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
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
