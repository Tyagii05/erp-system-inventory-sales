/*
# ERP System Initial Schema

This migration creates the core database schema for an ERP System for Inventory and Sales Management.

1. New Tables
- `products` - Product catalog with stock tracking
- `customers` - Customer records  
- `suppliers` - Supplier records
- `sales_orders` - Sales order header
- `sales_order_items` - Sales order line items
- `purchase_orders` - Purchase order header
- `purchase_order_items` - Purchase order line items
- `grns` - Goods Receipt Notes
- `grn_items` - GRN line items
- `invoices` - Invoice records
- `erp_users` - Extended user profiles with roles

2. Security
- Enable RLS on all tables
- Add policies for authenticated users to access all data (ERP is multi-user but data is shared across roles)
*/

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    sku text UNIQUE NOT NULL,
    category text,
    unit_price decimal(10,2) NOT NULL DEFAULT 0,
    current_stock integer NOT NULL DEFAULT 0,
    reorder_level integer NOT NULL DEFAULT 10,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text,
    phone text,
    address text,
    gstin text,
    created_at timestamptz DEFAULT now()
);

-- Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text,
    phone text,
    address text,
    gstin text,
    created_at timestamptz DEFAULT now()
);

-- Sales Orders Table
CREATE TABLE IF NOT EXISTS sales_orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id uuid NOT NULL REFERENCES customers(id),
    order_date timestamptz DEFAULT now(),
    status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'DISPATCHED')),
    total_amount decimal(12,2) NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- Sales Order Items Table
CREATE TABLE IF NOT EXISTS sales_order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES products(id),
    quantity integer NOT NULL,
    unit_price decimal(10,2) NOT NULL,
    line_total decimal(12,2) NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Purchase Orders Table
CREATE TABLE IF NOT EXISTS purchase_orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id uuid NOT NULL REFERENCES suppliers(id),
    order_date timestamptz DEFAULT now(),
    expected_delivery timestamptz,
    status text NOT NULL DEFAULT 'ORDERED' CHECK (status IN ('ORDERED', 'RECEIVED')),
    total_amount decimal(12,2) NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- Purchase Order Items Table
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES products(id),
    quantity integer NOT NULL,
    unit_price decimal(10,2) NOT NULL,
    line_total decimal(12,2) NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- GRNs Table
CREATE TABLE IF NOT EXISTS grns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id uuid REFERENCES purchase_orders(id),
    grn_number text UNIQUE NOT NULL,
    received_date timestamptz DEFAULT now(),
    notes text,
    created_at timestamptz DEFAULT now()
);

-- GRN Items Table
CREATE TABLE IF NOT EXISTS grn_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    grn_id uuid NOT NULL REFERENCES grns(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES products(id),
    quantity_received integer NOT NULL,
    unit_price decimal(10,2) NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number text UNIQUE NOT NULL,
    sales_order_id uuid REFERENCES sales_orders(id),
    customer_id uuid NOT NULL REFERENCES customers(id),
    invoice_date timestamptz DEFAULT now(),
    subtotal decimal(12,2) NOT NULL DEFAULT 0,
    tax_amount decimal(12,2) NOT NULL DEFAULT 0,
    total_amount decimal(12,2) NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'UNPAID' CHECK (status IN ('PAID', 'UNPAID', 'OVERDUE')),
    created_at timestamptz DEFAULT now()
);

-- ERP Users (extended profiles)
CREATE TABLE IF NOT EXISTS erp_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    full_name text,
    role text NOT NULL DEFAULT 'INVENTORY_MGR' CHECK (role IN ('ADMIN', 'SALES_EXEC', 'PURCHASE_MGR', 'INVENTORY_MGR', 'ACCOUNTANT')),
    created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE grns ENABLE ROW LEVEL SECURITY;
ALTER TABLE grn_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_users ENABLE ROW LEVEL SECURITY;

-- Create policies for all tables (shared data, all authenticated users can access)
DROP POLICY IF EXISTS "select_products" ON products;
CREATE POLICY "select_products" ON products FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_products" ON products;
CREATE POLICY "insert_products" ON products FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_products" ON products;
CREATE POLICY "update_products" ON products FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_products" ON products;
CREATE POLICY "delete_products" ON products FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "select_customers" ON customers;
CREATE POLICY "select_customers" ON customers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_customers" ON customers;
CREATE POLICY "insert_customers" ON customers FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_customers" ON customers;
CREATE POLICY "update_customers" ON customers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_customers" ON customers;
CREATE POLICY "delete_customers" ON customers FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "select_suppliers" ON suppliers;
CREATE POLICY "select_suppliers" ON suppliers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_suppliers" ON suppliers;
CREATE POLICY "insert_suppliers" ON suppliers FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_suppliers" ON suppliers;
CREATE POLICY "update_suppliers" ON suppliers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_suppliers" ON suppliers;
CREATE POLICY "delete_suppliers" ON suppliers FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "select_sales_orders" ON sales_orders;
CREATE POLICY "select_sales_orders" ON sales_orders FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_sales_orders" ON sales_orders;
CREATE POLICY "insert_sales_orders" ON sales_orders FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_sales_orders" ON sales_orders;
CREATE POLICY "update_sales_orders" ON sales_orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_sales_orders" ON sales_orders;
CREATE POLICY "delete_sales_orders" ON sales_orders FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "select_sales_order_items" ON sales_order_items;
CREATE POLICY "select_sales_order_items" ON sales_order_items FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_sales_order_items" ON sales_order_items;
CREATE POLICY "insert_sales_order_items" ON sales_order_items FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_sales_order_items" ON sales_order_items;
CREATE POLICY "update_sales_order_items" ON sales_order_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_sales_order_items" ON sales_order_items;
CREATE POLICY "delete_sales_order_items" ON sales_order_items FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "select_purchase_orders" ON purchase_orders;
CREATE POLICY "select_purchase_orders" ON purchase_orders FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_purchase_orders" ON purchase_orders;
CREATE POLICY "insert_purchase_orders" ON purchase_orders FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_purchase_orders" ON purchase_orders;
CREATE POLICY "update_purchase_orders" ON purchase_orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_purchase_orders" ON purchase_orders;
CREATE POLICY "delete_purchase_orders" ON purchase_orders FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "select_purchase_order_items" ON purchase_order_items;
CREATE POLICY "select_purchase_order_items" ON purchase_order_items FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_purchase_order_items" ON purchase_order_items;
CREATE POLICY "insert_purchase_order_items" ON purchase_order_items FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_purchase_order_items" ON purchase_order_items;
CREATE POLICY "update_purchase_order_items" ON purchase_order_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_purchase_order_items" ON purchase_order_items;
CREATE POLICY "delete_purchase_order_items" ON purchase_order_items FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "select_grns" ON grns;
CREATE POLICY "select_grns" ON grns FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_grns" ON grns;
CREATE POLICY "insert_grns" ON grns FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_grns" ON grns;
CREATE POLICY "update_grns" ON grns FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_grns" ON grns;
CREATE POLICY "delete_grns" ON grns FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "select_grn_items" ON grn_items;
CREATE POLICY "select_grn_items" ON grn_items FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_grn_items" ON grn_items;
CREATE POLICY "insert_grn_items" ON grn_items FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_grn_items" ON grn_items;
CREATE POLICY "update_grn_items" ON grn_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_grn_items" ON grn_items;
CREATE POLICY "delete_grn_items" ON grn_items FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "select_invoices" ON invoices;
CREATE POLICY "select_invoices" ON invoices FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_invoices" ON invoices;
CREATE POLICY "insert_invoices" ON invoices FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_invoices" ON invoices;
CREATE POLICY "update_invoices" ON invoices FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_invoices" ON invoices;
CREATE POLICY "delete_invoices" ON invoices FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "select_erp_users" ON erp_users;
CREATE POLICY "select_erp_users" ON erp_users FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_erp_users" ON erp_users;
CREATE POLICY "insert_erp_users" ON erp_users FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_erp_users" ON erp_users;
CREATE POLICY "update_erp_users" ON erp_users FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_erp_users" ON erp_users;
CREATE POLICY "delete_erp_users" ON erp_users FOR DELETE TO anon, authenticated USING (true);
