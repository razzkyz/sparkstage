-- Check current retail categories structure
-- Run this to see what categories exist now

SELECT 
  id,
  department,
  name,
  slug,
  parent_id,
  is_active,
  (SELECT name FROM retail_categories p WHERE p.id = c.parent_id) as parent_name
FROM retail_categories c
ORDER BY department, parent_id NULLS FIRST, name;

-- Count by department
SELECT 
  department,
  COUNT(*) as total,
  COUNT(CASE WHEN parent_id IS NULL THEN 1 END) as main_categories,
  COUNT(CASE WHEN parent_id IS NOT NULL THEN 1 END) as sub_categories
FROM retail_categories
GROUP BY department
ORDER BY department;
