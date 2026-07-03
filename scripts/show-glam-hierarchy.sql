-- Show GLAM category hierarchy in a readable format
SELECT 
  c.id,
  CASE 
    WHEN c.parent_id IS NULL THEN '📁 ' || c.name
    ELSE '  └─ ' || c.name
  END AS category_tree,
  c.slug,
  c.is_active
FROM public.retail_categories c
WHERE c.department = 'glam'
ORDER BY 
  COALESCE(c.parent_id, c.id),
  c.parent_id NULLS FIRST,
  c.name;
