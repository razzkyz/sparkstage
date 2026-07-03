-- List ALL charmbar categories in detail

SELECT 
  id,
  name,
  slug,
  parent_id,
  is_active,
  created_at,
  CASE 
    WHEN parent_id IS NULL THEN 'MAIN'
    ELSE 'SUB'
  END as category_type
FROM retail_categories
WHERE department = 'charmbar'
ORDER BY parent_id NULLS FIRST, name;
