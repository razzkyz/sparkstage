-- EMERGENCY CHECK: Verify products still exist

-- 1. Total product count
SELECT COUNT(*) as total_products FROM product_retail;

-- 2. Sample products with all data
SELECT 
  id,
  name,
  price,
  image,
  category_id,
  is_active
FROM product_retail
WHERE category_id = 21  -- LUCKY-CHARM category
LIMIT 20;

-- 3. Check for deleted products (should be 0)
SELECT COUNT(*) as deleted_products 
FROM product_retail 
WHERE is_active = false;

-- 4. Products with images
SELECT COUNT(*) as products_with_images
FROM product_retail
WHERE image IS NOT NULL;

-- 5. Products with prices
SELECT COUNT(*) as products_with_prices
FROM product_retail
WHERE price > 0;
