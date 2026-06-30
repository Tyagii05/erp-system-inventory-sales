import { supabase } from '../lib/supabase';

export async function getDashboardSummary() {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  
  // Total sales this month
  const { data: salesData } = await supabase
    .from('sales_orders')
    .select('total_amount')
    .gte('order_date', firstDayOfMonth)
    .eq('status', 'APPROVED');
  
  // Total purchases this month
  const { data: purchaseData } = await supabase
    .from('purchase_orders')
    .select('total_amount')
    .gte('order_date', firstDayOfMonth);
  
  // Low stock count
  const { data: lowStockData } = await supabase
    .from('products')
    .select('id')
    .lte('current_stock', 10);
  
  // Pending invoices
  const { data: pendingInvoices } = await supabase
    .from('invoices')
    .select('id')
    .eq('status', 'UNPAID');
  
  return {
    totalSales: salesData?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0,
    totalPurchases: purchaseData?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0,
    lowStockCount: lowStockData?.length || 0,
    pendingInvoices: pendingInvoices?.length || 0,
  };
}

export async function getTopSellingProducts() {
  const { data, error } = await supabase
    .from('sales_order_items')
    .select('product_id, quantity, product:products(name)')
    .order('quantity', { ascending: false })
    .limit(5);
  
  if (error) throw error;
  return data || [];
}

export async function getMonthlySalesData() {
  const { data, error } = await supabase
    .from('sales_orders')
    .select('order_date, total_amount')
    .eq('status', 'APPROVED')
    .order('order_date');
  
  if (error) throw error;
  return data || [];
}
