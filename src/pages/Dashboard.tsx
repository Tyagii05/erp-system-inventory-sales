import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDashboardSummary, getTopSellingProducts } from '../services/dashboardService';
import { getLowStockProducts } from '../services/productService';
import { getInvoices } from '../services/invoiceService';
import type { DashboardSummary, Product, Invoice } from '../types';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Receipt,
  Package,
  DollarSign,
  ShoppingBag,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary>({
    totalSales: 0,
    totalPurchases: 0,
    lowStockCount: 0,
    pendingInvoices: 0,
  });
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      const [summaryData, lowStockData, invoicesData, topProductsData] = await Promise.all([
        getDashboardSummary(),
        getLowStockProducts(),
        getInvoices(),
        getTopSellingProducts(),
      ]);

      setSummary(summaryData);
      setLowStock(lowStockData);
      setPendingInvoices(invoicesData.filter(i => i.status === 'UNPAID').slice(0, 5));
      setTopProducts(topProductsData);
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  }

  const chartData = topProducts.map((p, i) => ({
    name: p.product?.name || `Product ${i + 1}`,
    quantity: p.quantity || 0,
  }));

  const statCards = [
    { title: 'Total Sales (Month)', value: `$${summary.totalSales.toLocaleString()}`, icon: <TrendingUp size={20} />, color: 'bg-emerald-50 text-emerald-600', trend: '+12%' },
    { title: 'Total Purchases', value: `$${summary.totalPurchases.toLocaleString()}`, icon: <TrendingDown size={20} />, color: 'bg-blue-50 text-blue-600', trend: '+8%' },
    { title: 'Low Stock Items', value: summary.lowStockCount.toString(), icon: <AlertTriangle size={20} />, color: 'bg-amber-50 text-amber-600', trend: 'Alert' },
    { title: 'Pending Invoices', value: summary.pendingInvoices.toString(), icon: <Receipt size={20} />, color: 'bg-rose-50 text-rose-600', trend: 'Action' },
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
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome back, {user?.full_name}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-2 rounded-lg ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
            <div className="mt-3">
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${stat.color}`}>
                {stat.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Top Selling Products</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="quantity" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-400">
              No sales data available
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            Low Stock Alerts
          </h3>
          <div className="space-y-3">
            {lowStock.length > 0 ? (
              lowStock.slice(0, 5).map(product => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <div className="flex items-center gap-3">
                    <Package size={16} className="text-amber-600" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{product.name}</p>
                      <p className="text-xs text-slate-500">SKU: {product.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-amber-600">{product.current_stock} left</p>
                    <p className="text-xs text-slate-500">Reorder: {product.reorder_level}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400">
                All stock levels are healthy
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pending Invoices */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <DollarSign size={18} className="text-rose-500" />
          Pending Invoices
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Invoice #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Customer</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Amount</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingInvoices.length > 0 ? (
                pendingInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{inv.invoice_number}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{inv.customer?.name || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-slate-900">${inv.total_amount?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
                        Unpaid
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                    No pending invoices
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
