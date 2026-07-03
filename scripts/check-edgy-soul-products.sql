-- Check products that should appear in edgy-soul category

-- 1. Check via old categories table
SELECT 
  p.id,
  p.name,
  p.price,
  p.image,
  p.category_id,
  c.slug as category_slug,
  c.name as category_name
FROM product_retail p
JOIN categories c ON p.category_id = c.id
WHERE c.slug = 'edgy-soul'
LIMIT 10;

-- 2. Count products per old category
SELECT 
  c.slug,
  c.name,
  COUNT(p.id) as product_count
FROM categories c
LEFT JOIN product_retail p ON p.category_id = c.id
WHERE c.slug IN ('edgy-soul', 'foodie', 'hobby', 'holiday', 'love', 'pets', 'pop-icon')
GROUP BY c.id, c.slug, c.name
ORDER BY product_count DESC;
