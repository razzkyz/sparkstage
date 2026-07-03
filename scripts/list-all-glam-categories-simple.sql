-- Simple list of all GLAM categories
-- Shows which are main and which are subcategories

-- Main Categories (5 total)
SELECT 
  '📁 MAIN CATEGORY' AS type,
  id,
  name,
  slug,
  (SELECT COUNT(*) FROM retail_categories WHERE parent_id = p.id) as has_subs
FROM public.retail_categories p
WHERE department = 'glam' 
  AND parent_id IS NULL
ORDER BY name;

-- Subcategories (18 total)
SELECT 
  '  └─ SUBCATEGORY OF: ' || p.name AS type,
  c.id,
  c.name,
  c.slug,
  NULL::bigint as has_subs
FROM public.retail_categories c
JOIN public.retail_categories p ON c.parent_id = p.id
WHERE c.department = 'glam'
ORDER BY p.name, c.name;
