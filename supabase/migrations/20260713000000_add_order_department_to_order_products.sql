-- Add order_department column to order_products table
-- Values: 'shop', 'dressing', 'service'
-- Used to tag which product area/division the confirmed order belongs to

ALTER TABLE order_products
  ADD COLUMN IF NOT EXISTS order_department TEXT
  CHECK (order_department IS NULL OR order_department IN ('shop', 'dressing', 'service'));

-- Allow admin/kasir to update the new column
-- (existing RLS policies already cover UPDATE for admins and kasir roles)

COMMENT ON COLUMN order_products.order_department IS
  'Department/division the order belongs to: shop, dressing, or service. Set by admin at confirmation time.';
