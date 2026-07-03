-- =====================================================
-- URGENT: Revert product retail_category_id changes
-- Created: 2026-07-03
-- Purpose: Set all retail_category_id back to NULL to restore original state
-- =====================================================

-- Clear all retail_category_id and retail_subcategory_id assignments
UPDATE product_retail
SET 
  retail_category_id = NULL,
  retail_subcategory_id = NULL
WHERE retail_category_id IS NOT NULL;

-- Verify
SELECT 
  COUNT(*) as total,
  COUNT(retail_category_id) as with_retail_cat,
  COUNT(*) - COUNT(retail_category_id) as without_retail_cat
FROM product_retail;
