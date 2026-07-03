-- =====================================================
-- Migration: Add SHOP Department to Allowed Departments
-- Created: 2026-07-03
-- Purpose: Add 'shop' to department constraint (no categories yet)
-- =====================================================

-- Step 1: Drop old CHECK constraint and create new one with 'shop'
ALTER TABLE public.retail_categories 
  DROP CONSTRAINT IF EXISTS retail_categories_department_check;

ALTER TABLE public.retail_categories 
  ADD CONSTRAINT retail_categories_department_check 
  CHECK (department IN ('glam', 'charmbar', 'sparkclub', 'dressing', 'shop'));

-- Step 2: Add comment
COMMENT ON TABLE public.retail_categories IS 'Retail categories - SHOP department constraint added 2026-07-03';

-- =====================================================
-- Verification Query
-- =====================================================

-- Show all departments and their category counts
SELECT 
  department,
  COUNT(*) as category_count,
  COUNT(CASE WHEN parent_id IS NULL THEN 1 END) as main_categories,
  COUNT(CASE WHEN parent_id IS NOT NULL THEN 1 END) as subcategories
FROM retail_categories
GROUP BY department
ORDER BY department;

-- Show constraint
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'retail_categories_department_check';

-- =====================================================
-- Summary
-- =====================================================

-- Added 'shop' to allowed departments
-- No categories created yet - will be added in future migration
-- Total allowed departments: 5 (glam, charmbar, sparkclub, dressing, shop)
