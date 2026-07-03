-- =====================================================
-- Assign Pop Socket to SHOP Department
-- Created: 2026-07-03
-- Purpose: Assign Pop Socket product to SPARK ME UP category (shop department)
-- =====================================================

-- Step 1: Get the category ID for SPARK ME UP (shop department)
SELECT id, name, slug, department 
FROM retail_categories 
WHERE department = 'shop' AND slug = 'spark-me-up';

-- Step 2: Assign Pop Socket to SPARK ME UP category
UPDATE products
SET retail_category_id = (
  SELECT id FROM retail_categories 
  WHERE department = 'shop' AND slug = 'spark-me-up'
  LIMIT 1
)
WHERE name ILIKE '%pop socket%' 
  AND deleted_at IS NULL
  AND retail_category_id IS NULL;

-- Step 3: Verify the assignment
SELECT 
  p.id,
  p.name,
  p.retail_category_id,
  rc.name as category_name,
  rc.department,
  rc.slug as category_slug
FROM products p
LEFT JOIN retail_categories rc ON p.retail_category_id = rc.id
WHERE p.name ILIKE '%pop socket%' AND p.deleted_at IS NULL;

-- =====================================================
-- Summary
-- =====================================================
-- This assigns Pop Socket to SPARK ME UP category in shop department
-- Product should now appear when filtering by 'shop' department
