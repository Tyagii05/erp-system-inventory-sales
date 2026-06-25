import { supabase } from '../lib/supabase';
import type { GRN, GRNItem } from '../types';

export async function getGRNs(): Promise<GRN[]> {
  const { data, error } = await supabase
    .from('grns')
    .select(`
      *,
      purchase_order:purchase_orders(*),
      items:grn_items(*, product:products(*))
    `)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function createGRN(
  grn: Omit<GRN, 'id' | 'created_at'>,
  items: { product_id: string; quantity_received: number; unit_price: number }[]
): Promise<GRN> {
  const { data: grnData, error: grnError } = await supabase
    .from('grns')
    .insert(grn)
    .select()
    .single();
  
  if (grnError) throw grnError;
  
  const grnItems = items.map(item => ({
    grn_id: grnData.id,
    product_id: item.product_id,
    quantity_received: item.quantity_received,
    unit_price: item.unit_price,
  }));
  
  const { error: itemsError } = await supabase
    .from('grn_items')
    .insert(grnItems);
  
  if (itemsError) throw itemsError;
  
  // Update stock levels
  for (const item of items) {
    const { data: product } = await supabase
      .from('products')
      .select('current_stock')
      .eq('id', item.product_id)
      .single();
    
    if (product) {
      await supabase
        .from('products')
        .update({ current_stock: product.current_stock + item.quantity_received })
        .eq('id', item.product_id);
    }
  }
  
  return grnData;
}

export async function deleteGRN(id: string): Promise<void> {
  const { error } = await supabase
    .from('grns')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}
