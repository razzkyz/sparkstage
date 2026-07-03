-- Check actual product category assignments

-- 1. Sample products with all category fields
SELECT 
  id,
  name as title,
  department,
  category_id,
  retail_category_id,
  retail_subcategory_id
FROM product_retail
LIMIT 20;

-- 2. Check if category_id references old categories table
SELECT 
  p.id,
  p.name,
  p.category_id,
  c.name as old_category_name,
  c.slug as old_category_slug
FROM product_retail p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.category_id IS NOT NULL
LIMIT 10;

-- 3. Check department distribution
SELECT 
  COALESCE(department, 'NULL') as department,
  COUNT(*) as count
FROM product_retail
GROUP BY department
ORDER BY count DESC;

-- 4. Check products without department
SELECT 
  id,
  name,
  department,
  category_id,
  retail_category_id
FROM product_retail
WHERE department IS NULL
LIMIT 10;
