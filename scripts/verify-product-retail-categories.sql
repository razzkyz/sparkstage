-- Verify product retail category assignments

-- 1. Count products by retail_category (through join to get department)
SELECT 
  rc.department,
  rc.name as category_name,
  COUNT(p.id) as product_count
FROM product_retail p
JOIN retail_categories rc ON p.retail_category_id = rc.id
WHERE rc.is_active = true
GROUP BY rc.department, rc.name, rc.id
ORDER BY rc.department, product_count DESC;

-- 2. Check SPARK MY CHARMS products
SELECT 
  main.name as main_category,
  sub.name as subcategory,
  COUNT(p.id) as product_count
FROM product_retail p
JOIN retail_categories main ON p.retail_category_id = main.id
LEFT JOIN retail_categories sub ON p.retail_subcategory_id = sub.id
WHERE main.slug = 'glam-spark-my-charms'
GROUP BY main.name, sub.name
ORDER BY product_count DESC;

-- 3. Sample products with their new categories
SELECT 
  p.id,
  p.name as product_name,
  main.name as main_category,
  main.department,
  sub.name as subcategory
FROM product_retail p
JOIN retail_categories main ON p.retail_category_id = main.id
LEFT JOIN retail_categories sub ON p.retail_subcategory_id = sub.id
WHERE main.department = 'glam'
LIMIT 15;

-- 4. Products still without retail_category_id
SELECT 
  COUNT(*) as products_without_retail_category
FROM product_retail
WHERE retail_category_id IS NULL;
