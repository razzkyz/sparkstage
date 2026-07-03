-- Check product counts

-- 1. Total products
SELECT COUNT(*) as total_products FROM product_retail;

-- 2. Products with retail_category_id
SELECT COUNT(*) as with_retail_category FROM product_retail WHERE retail_category_id IS NOT NULL;

-- 3. Products without retail_category_id  
SELECT COUNT(*) as without_retail_category FROM product_retail WHERE retail_category_id IS NULL;

-- 4. Sample products with their categories
SELECT 
  id,
  name,
  category_id,
  retail_category_id,
  retail_subcategory_id
FROM product_retail
LIMIT 10;
