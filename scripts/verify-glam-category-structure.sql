-- =====================================================
-- Verify current GLAM category structure
-- =====================================================

-- Show all GLAM categories with hierarchy
SELECT 
  CASE 
    WHEN parent_id IS NULL THEN '🔷 ' || name
    ELSE '  └─ ' || name
  END as category_tree,
  id,
  slug,
  department,
  is_active,
  parent_id
FROM retail_categories
WHERE department = 'glam'
ORDER BY 
  COALESCE(parent_id, id),
  CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END,
  name;

-- Count products per category
SELECT 
  rc.name as category_name,
  rc.slug,
  COUNT(DISTINCT p.id) as product_count
FROM retail_categories rc
LEFT JOIN products p ON p.retail_category_id = rc.id
WHERE rc.department = 'glam'
  AND p.is_active = true
  AND p.deleted_at IS NULL
GROUP BY rc.id, rc.name, rc.slug
ORDER BY product_count DESC;
