import { supabase } from '../lib/supabase';
import type { SalesOrder, SalesOrderItem } from '../types';

export async function getSalesOrders(): Promise<SalesOrder[]> {
  const { data, error } = await supabase
    .from('sales_orders')
    .select(`
      *,
      customer:customers(*),
      items:sales_order_items(*, product:products(*))
    `)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function createSalesOrder(
  order: Omit<SalesOrder, 'id' | 'created_at' | 'total_amount'>,
  items: { product_id: string; quantity: number; unit_price: number }[]
): Promise<SalesOrder> {
  const total_amount = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  
  const { data: orderData, error: orderError } = await supabase
    .from('sales_orders')
    .insert({ ...order, total_amount })
    .select()
    .single();
  
  if (orderError) throw orderError;
  
  const orderItems = items.map(item => ({
    order_id: orderData.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    line_total: item.quantity * item.unit_price,
  }));
  
  const { error: itemsError } = await supabase
    .from('sales_order_items')
    .insert(orderItems);
  
  if (itemsError) throw itemsError;
  
  return orderData;
}

export async function updateSalesOrderStatus(id: string, status: string): Promise<void> {
  const { error } = await supabase
    .from('sales_orders')
    .update({ status })
    .eq('id', id);
  
  if (error) throw error;
}

export async function deleteSalesOrder(id: string): Promise<void> {
  const { error } = await supabase
    .from('sales_orders')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}
