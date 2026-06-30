export type UserRole = 'ADMIN' | 'SALES_EXEC' | 'PURCHASE_MGR' | 'INVENTORY_MGR' | 'ACCOUNTANT';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit_price: number;
  current_stock: number;
  reorder_level: number;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  gstin: string;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  gstin: string;
  created_at: string;
}

export type SalesOrderStatus = 'PENDING' | 'APPROVED' | 'DISPATCHED';
export type PurchaseOrderStatus = 'ORDERED' | 'RECEIVED';
export type InvoiceStatus = 'PAID' | 'UNPAID' | 'OVERDUE';

export interface SalesOrder {
  id: string;
  customer_id: string;
  customer?: Customer;
  order_date: string;
  status: SalesOrderStatus;
  total_amount: number;
  created_at: string;
  items?: SalesOrderItem[];
}

export interface SalesOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product?: Product;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface PurchaseOrder {
  id: string;
  supplier_id: string;
  supplier?: Supplier;
  order_date: string;
  expected_delivery: string;
  status: PurchaseOrderStatus;
  total_amount: number;
  created_at: string;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product?: Product;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface GRN {
  id: string;
  purchase_order_id: string;
  purchase_order?: PurchaseOrder;
  grn_number: string;
  received_date: string;
  notes: string;
  created_at: string;
  items?: GRNItem[];
}

export interface GRNItem {
  id: string;
  grn_id: string;
  product_id: string;
  product?: Product;
  quantity_received: number;
  unit_price: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  sales_order_id: string;
  sales_order?: SalesOrder;
  customer_id: string;
  customer?: Customer;
  invoice_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: InvoiceStatus;
  created_at: string;
}

export interface DashboardSummary {
  totalSales: number;
  totalPurchases: number;
  lowStockCount: number;
  pendingInvoices: number;
}

export interface ERPUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}
