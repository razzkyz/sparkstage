-- Show GLAM category tree structure
-- Clear visualization of main categories and their subcategories

WITH category_tree AS (
  SELECT 
    c.id,
    c.name,
    c.slug,
    c.parent_id,
    p.name as parent_name,
    CASE 
      WHEN c.parent_id IS NULL THEN 1  -- Main category
      ELSE 2  -- Subcategory
    END AS level,
    CASE 
      WHEN c.parent_id IS NULL THEN c.id
      ELSE c.parent_id
    END AS sort_key
  FROM public.retail_categories c
  LEFT JOIN public.retail_categories p ON c.parent_id = p.id
  WHERE c.department = 'glam'
)
SELECT 
  id,
  CASE 
    WHEN level = 1 THEN '📁 ' || name
    ELSE '   └─ ' || name
  END AS category_display,
  CASE 
    WHEN level = 1 THEN 'MAIN CATEGORY'
    ELSE 'SUBCATEGORY'
  END AS type,
  COALESCE(parent_name, '-') AS parent,
  slug
FROM category_tree
ORDER BY sort_key, level, name;
