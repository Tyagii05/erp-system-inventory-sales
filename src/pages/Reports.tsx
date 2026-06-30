import { useEffect, useState } from 'react';
import { getProducts } from '../services/productService';
import { getSalesOrders } from '../services/salesOrderService';
import { getPurchaseOrders } from '../services/purchaseOrderService';
import { getInvoices } from '../services/invoiceService';
import type { Product, SalesOrder, PurchaseOrder, Invoice } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Download, BarChart3, TrendingUp, Package, DollarSign } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Reports() {
  const [products, setProducts] = useState<Product[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [productsData, salesData, purchaseData, invoicesData] = await Promise.all([
        getProducts(),
        getSalesOrders(),
        getPurchaseOrders(),
        getInvoices(),
      ]);
      setProducts(productsData);
      setSalesOrders(salesData);
      setPurchaseOrders(purchaseData);
      setInvoices(invoicesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Calculate metrics
  const totalSales = salesOrders
    .filter(o => o.status === 'APPROVED' || o.status === 'DISPATCHED')
    .reduce((sum, o) => sum + o.total_amount, 0);
  
  const totalPurchases = purchaseOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const totalRevenue = invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + i.total_amount, 0);
  const totalPending = invoices.filter(i => i.status === 'UNPAID').reduce((sum, i) => sum + i.total_amount, 0);

  // Category breakdown
  const categoryData = products.reduce((acc, product) => {
    const cat = product.category || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryChartData = Object.entries(categoryData).map(([name, value]) => ({ name, value }));

  // Sales by status
  const salesStatusData = [
    { name: 'Pending', value: salesOrders.filter(o => o.status === 'PENDING').length },
    { name: 'Approved', value: salesOrders.filter(o => o.status === 'APPROVED').length },
    { name: 'Dispatched', value: salesOrders.filter(o => o.status === 'DISPATCHED').length },
  ];

  // Monthly sales trend (mock data based on available orders)
  const monthlyData = salesOrders.reduce((acc, order) => {
    const month = new Date(order.order_date).toLocaleString('default', { month: 'short' });
    acc[month] = (acc[month] || 0) + order.total_amount;
    return acc;
  }, {} as Record<string, number>);

  const monthlyChartData = Object.entries(monthlyData).map(([name, value]) => ({ name, value }));

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
          <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-slate-500 mt-1">Financial and operational insights</p>
        </div>
        <button
          onClick={() => alert('Export feature would download CSV/Excel here')}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
        >
          <Download size={18} />
          Export Report
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <DollarSign size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Sales</p>
              <p className="text-xl font-bold text-slate-900">${totalSales.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <TrendingUp size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Purchases</p>
              <p className="text-xl font-bold text-slate-900">${totalPurchases.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <DollarSign size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Revenue Collected</p>
              <p className="text-xl font-bold text-slate-900">${totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-50 rounded-lg">
              <DollarSign size={20} className="text-rose-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Pending Payments</p>
              <p className="text-xl font-bold text-slate-900">${totalPending.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Sales Trend */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Sales Trend</h3>
          {monthlyChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-400">
              No sales data available
            </div>
          )}
        </div>

        {/* Product Categories */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Product Categories</h3>
          {categoryChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-400">
              No category data available
            </div>
          )}
        </div>
      </div>

      {/* Sales Order Status */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Order Status Distribution</h3>
        <div className="grid grid-cols-3 gap-4">
          {salesStatusData.map((status) => (
            <div key={status.name} className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-2xl font-bold text-slate-900">{status.value}</p>
              <p className="text-sm text-slate-500 mt-1">{status.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
