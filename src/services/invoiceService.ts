import { supabase } from '../lib/supabase';
import type { Invoice } from '../types';

export async function getInvoices(): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      customer:customers(*),
      sales_order:sales_orders(*)
    `)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function createInvoice(invoice: Omit<Invoice, 'id' | 'created_at'>): Promise<Invoice> {
  const { data, error } = await supabase
    .from('invoices')
    .insert(invoice)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateInvoiceStatus(id: string, status: string): Promise<void> {
  const { error } = await supabase
    .from('invoices')
    .update({ status })
    .eq('id', id);
  
  if (error) throw error;
}

export async function generateInvoiceFromSalesOrder(salesOrderId: string): Promise<Invoice> {
  const { data: salesOrder, error: soError } = await supabase
    .from('sales_orders')
    .select('*, customer:customers(*), items:sales_order_items(*)')
    .eq('id', salesOrderId)
    .single();
  
  if (soError) throw soError;
  
  const subtotal = salesOrder.total_amount;
  const taxRate = 0.18; // 18% GST
  const tax_amount = subtotal * taxRate;
  const total_amount = subtotal + tax_amount;
  
  const invoiceNumber = `INV-${Date.now()}`;
  
  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      invoice_number: invoiceNumber,
      sales_order_id: salesOrderId,
      customer_id: salesOrder.customer_id,
      subtotal,
      tax_amount,
      total_amount,
      status: 'UNPAID',
    })
    .select()
    .single();
  
  if (error) throw error;
  return invoice;
}

export async function deleteInvoice(id: string): Promise<void> {
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}
