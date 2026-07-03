-- Check all GLAM categories - Show Main Categories and their Subcategories

-- Show everything in one query with clear labels
SELECT 
  c.id,
  CASE 
    WHEN c.parent_id IS NULL THEN '📁 MAIN: ' || c.name
    ELSE '   └─ SUB: ' || c.name || ' (parent: ' || p.name || ')'
  END AS category_info,
  CASE 
    WHEN c.parent_id IS NULL THEN 'MAIN'
    ELSE 'SUB'
  END AS category_type,
  c.parent_id,
  c.slug
FROM public.retail_categories c
LEFT JOIN public.retail_categories p ON c.parent_id = p.id
WHERE c.department = 'glam'
ORDER BY 
  COALESCE(c.parent_id, c.id),
  c.parent_id NULLS FIRST,
  c.name;

-- Summary
SELECT 
  '=== SUMMARY ===' as info,
  '' as value
UNION ALL
SELECT 
  'Total Categories:' as info,
  COUNT(*)::text as value
FROM public.retail_categories
WHERE department = 'glam'
UNION ALL
SELECT 
  'Main Categories:' as info,
  COUNT(*)::text as value
FROM public.retail_categories
WHERE department = 'glam' AND parent_id IS NULL
UNION ALL
SELECT 
  'Subcategories:' as info,
  COUNT(*)::text as value
FROM public.retail_categories
WHERE department = 'glam' AND parent_id IS NOT NULL;
