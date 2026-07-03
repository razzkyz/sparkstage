-- =====================================================
-- Migration: Assign Products to SHOP Department
-- Created: 2026-07-03
-- Purpose: Assign Pop Socket and other products to shop department categories
-- =====================================================

-- Step 1: Assign Pop Socket to SPARK ME UP category
UPDATE products
SET 
  retail_category_id = (
    SELECT id FROM retail_categories 
    WHERE department = 'shop' AND slug = 'spark-me-up'
    LIMIT 1
  ),
  updated_at = NOW()
WHERE name ILIKE '%pop socket%' 
  AND deleted_at IS NULL;

-- Step 2: Add comment
COMMENT ON TABLE products IS 'Products table - Pop Socket assigned to SHOP department 2026-07-03';

-- =====================================================
-- Verification Query
-- =====================================================

-- Show all products in shop department
SELECT 
  p.id,
  p.name,
  p.sku,
  rc.name as category_name,
  rc.slug as category_slug,
  rc.department
FROM products p
INNER JOIN retail_categories rc ON p.retail_category_id = rc.id
WHERE rc.department = 'shop' 
  AND p.deleted_at IS NULL
ORDER BY p.name;

-- Show product count per shop category
SELECT 
  rc.name as category_name,
  rc.slug as category_slug,
  COUNT(p.id) as product_count
FROM retail_categories rc
LEFT JOIN products p ON p.retail_category_id = rc.id AND p.deleted_at IS NULL
WHERE rc.department = 'shop'
GROUP BY rc.id, rc.name, rc.slug
ORDER BY rc.name;

-- =====================================================
-- Summary
-- =====================================================

-- Assigned products to SHOP department:
-- - Pop Socket → SPARK ME UP

-- To assign more products later, use:
-- UPDATE products SET retail_category_id = (SELECT id FROM retail_categories WHERE slug = 'category-slug') WHERE name = 'Product Name';
