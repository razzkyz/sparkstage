-- =============================================================================
-- STAGING ONLY: Fix order_product_items NOT NULL constraints for retail checkout
-- Run this in: Supabase Dashboard > SQL Editor (STAGING project only)
-- DO NOT run on production!
-- =============================================================================

-- 1. Make product_variant_id nullable (retail orders don't have legacy variants)
ALTER TABLE public.order_product_items 
  ALTER COLUMN product_variant_id DROP NOT NULL;

-- 2. Make stock_type nullable (retail uses different stock tracking)  
ALTER TABLE public.order_product_items 
  ALTER COLUMN stock_type DROP NOT NULL;

-- 3. Insert a dummy product_variant so FK references still work if needed
-- (No action needed since retail_product_id FK is separate)

-- Verify changes
SELECT 
  column_name, 
  is_nullable,
  data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'order_product_items'
  AND column_name IN ('product_variant_id', 'stock_type')
ORDER BY column_name;
