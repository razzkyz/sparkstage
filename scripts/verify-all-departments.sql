-- Verify all departments have correct categories

SELECT 
  department,
  COUNT(*) as total,
  COUNT(CASE WHEN parent_id IS NULL THEN 1 END) as main,
  COUNT(CASE WHEN parent_id IS NOT NULL THEN 1 END) as subs
FROM retail_categories
WHERE is_active = true
GROUP BY department
ORDER BY department;

-- Show tree for each department
SELECT 
  department,
  CASE 
    WHEN parent_id IS NULL THEN '📁 ' || name
    ELSE '  └─ ' || name
  END as category_display,
  slug
FROM retail_categories
WHERE is_active = true
ORDER BY department, parent_id NULLS FIRST, name;
