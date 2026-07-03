-- Check Pop Socket product and Shop categories
SELECT 
  p.id,
  p.name,
  p.retail_category_id,
  p.retail_subcategory_id,
  rc.name as category_name,
  rc.department as category_department,
  rsc.name as subcategory_name
FROM products p
LEFT JOIN retail_categories rc ON p.retail_category_id = rc.id
LEFT JOIN retail_categories rsc ON p.retail_subcategory_id = rsc.id
WHERE p.name ILIKE '%pop socket%' AND p.deleted_at IS NULL;

-- Check all Shop department categories
SELECT * FROM retail_categories WHERE department = 'shop' ORDER BY name;

-- Count products per department
SELECT 
  rc.department,
  COUNT(p.id) as product_count
FROM retail_categories rc
LEFT JOIN products p ON p.retail_category_id = rc.id AND p.deleted_at IS NULL
GROUP BY rc.department
ORDER BY rc.department;
