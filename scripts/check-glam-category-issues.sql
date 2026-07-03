-- =====================================================
-- Check GLAM Category Issues
-- Purpose: Find categories that might be incorrectly placed
-- =====================================================

-- 1. Show ALL glam categories with their parent relationship
SELECT 
  c.id,
  c.name,
  CASE 
    WHEN c.parent_id IS NULL THEN '🔵 MAIN CATEGORY'
    ELSE '🟢 SUBCATEGORY'
  END AS type,
  COALESCE(p.name, '-') AS parent_name,
  c.slug,
  c.is_active
FROM public.retail_categories c
LEFT JOIN public.retail_categories p ON c.parent_id = p.id
WHERE c.department = 'glam'
ORDER BY 
  COALESCE(c.parent_id, c.id),
  c.parent_id NULLS FIRST,
  c.name;

-- 2. Count subcategories per main category
SELECT 
  p.id,
  p.name AS main_category,
  COUNT(c.id) AS subcategory_count,
  STRING_AGG(c.name, ', ' ORDER BY c.name) AS subcategories
FROM public.retail_categories p
LEFT JOIN public.retail_categories c ON c.parent_id = p.id
WHERE p.department = 'glam' AND p.parent_id IS NULL
GROUP BY p.id, p.name
ORDER BY p.name;

-- 3. Find main categories without subcategories (might need subcategories)
SELECT 
  id,
  name AS main_category_without_subs,
  slug,
  '⚠️ This main category has NO subcategories' AS note
FROM public.retail_categories
WHERE department = 'glam' 
  AND parent_id IS NULL
  AND id NOT IN (
    SELECT DISTINCT parent_id 
    FROM public.retail_categories 
    WHERE parent_id IS NOT NULL
  );

-- 4. Check if any categories have wrong parent_id (parent doesn't exist)
SELECT 
  c.id,
  c.name,
  c.parent_id,
  '❌ ORPHANED - parent_id does not exist!' AS error
FROM public.retail_categories c
WHERE c.department = 'glam' 
  AND c.parent_id IS NOT NULL
  AND c.parent_id NOT IN (
    SELECT id FROM public.retail_categories WHERE department = 'glam'
  );

-- 5. List all main categories (should be 5)
SELECT 
  id,
  name,
  slug,
  (SELECT COUNT(*) FROM retail_categories WHERE parent_id = p.id) as sub_count
FROM public.retail_categories p
WHERE department = 'glam' 
  AND parent_id IS NULL
ORDER BY name;

-- 6. List all subcategories grouped by parent
SELECT 
  p.name AS main_category,
  c.name AS subcategory,
  c.id AS subcategory_id,
  c.slug AS subcategory_slug
FROM public.retail_categories c
JOIN public.retail_categories p ON c.parent_id = p.id
WHERE c.department = 'glam'
ORDER BY p.name, c.name;
