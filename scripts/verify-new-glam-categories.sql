-- =====================================================
-- Verification: New GLAM Category Structure
-- Purpose: Verify that the new categories are created correctly
-- =====================================================

-- 1. Show all GLAM categories with hierarchy
SELECT 
  c.id,
  CASE 
    WHEN c.parent_id IS NULL THEN '📁 ' || c.name
    ELSE '  └─ ' || c.name
  END AS category_display,
  c.slug,
  COALESCE(p.name, '-') AS parent_name,
  c.is_active
FROM public.retail_categories c
LEFT JOIN public.retail_categories p ON c.parent_id = p.id
WHERE c.department = 'glam'
ORDER BY 
  COALESCE(c.parent_id, c.id),
  c.parent_id NULLS FIRST,
  c.name;

-- 2. Count by main category
SELECT 
  p.name AS main_category,
  COUNT(c.id) AS subcategory_count
FROM public.retail_categories p
LEFT JOIN public.retail_categories c ON c.parent_id = p.id
WHERE p.department = 'glam' AND p.parent_id IS NULL
GROUP BY p.id, p.name
ORDER BY p.name;

-- 3. Summary statistics
SELECT 
  'Total Categories' AS metric,
  COUNT(*) AS count
FROM public.retail_categories
WHERE department = 'glam'

UNION ALL

SELECT 
  'Main Categories' AS metric,
  COUNT(*) AS count
FROM public.retail_categories
WHERE department = 'glam' AND parent_id IS NULL

UNION ALL

SELECT 
  'Subcategories' AS metric,
  COUNT(*) AS count
FROM public.retail_categories
WHERE department = 'glam' AND parent_id IS NOT NULL;

-- 4. Check for any orphaned subcategories (should be empty)
SELECT 
  id,
  name,
  slug,
  parent_id,
  '❌ ORPHANED - parent_id does not exist!' AS warning
FROM public.retail_categories
WHERE department = 'glam' 
  AND parent_id IS NOT NULL
  AND parent_id NOT IN (SELECT id FROM public.retail_categories WHERE department = 'glam');

-- 5. Expected structure checklist
-- Should have exactly:
-- - 5 main categories: SPARK MY FACE, SPARK MY HAIR, SPARK MY CHARMS, SPARK MY NAILS, SPARK MY STYLE
-- - 2 subcategories under SPARK MY FACE
-- - 2 subcategories under SPARK MY HAIR
-- - 8 subcategories under SPARK MY CHARMS
-- - 0 subcategories under SPARK MY NAILS
-- - 6 subcategories under SPARK MY STYLE
-- = 23 total categories

SELECT 
  '✅ Expected: 23 total categories' AS checklist_item,
  CASE WHEN COUNT(*) = 23 THEN '✅ PASS' ELSE '❌ FAIL: ' || COUNT(*) END AS status
FROM public.retail_categories
WHERE department = 'glam'

UNION ALL

SELECT 
  '✅ Expected: 5 main categories' AS checklist_item,
  CASE WHEN COUNT(*) = 5 THEN '✅ PASS' ELSE '❌ FAIL: ' || COUNT(*) END AS status
FROM public.retail_categories
WHERE department = 'glam' AND parent_id IS NULL

UNION ALL

SELECT 
  '✅ Expected: 18 subcategories' AS checklist_item,
  CASE WHEN COUNT(*) = 18 THEN '✅ PASS' ELSE '❌ FAIL: ' || COUNT(*) END AS status
FROM public.retail_categories
WHERE department = 'glam' AND parent_id IS NOT NULL;
