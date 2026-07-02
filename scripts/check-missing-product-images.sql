-- Check products without images
SELECT 
  p.id,
  p.name,
  p.sku,
  p.image_url,
  p.category_id,
  c.name as category_name
FROM products p
LEFT JOIN product_categories c ON c.id = p.category_id
WHERE p.is_active = true
  AND (p.image_url IS NULL OR p.image_url = '')
ORDER BY c.name, p.name
LIMIT 50;

-- Count by category
SELECT 
  c.name as category,
  COUNT(*) as products_without_images
FROM products p
LEFT JOIN product_categories c ON c.id = p.category_id
WHERE p.is_active = true
  AND (p.image_url IS NULL OR p.image_url = '')
GROUP BY c.name
ORDER BY products_without_images DESC;
