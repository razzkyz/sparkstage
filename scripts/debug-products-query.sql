-- Debug: Check if products exist and their category assignments

-- 1. Total products
SELECT COUNT(*) as total FROM products WHERE is_active = true AND deleted_at IS NULL;

-- 2. Products with category_id (old system)
SELECT 
  COUNT(*) as count,
  c.slug,
  c.name
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE p.is_active = true 
  AND p.deleted_at IS NULL
  AND c.slug IN ('edgy-soul', 'foodie', 'hobby', 'holiday', 'love', 'pets', 'pop-icon', 'sky-dream', 'soft-muse', 'the-icon', 'zodiac', 'lucky-charm')
GROUP BY c.id, c.slug, c.name
ORDER BY count DESC;

-- 3. Sample products from edgy-soul
SELECT 
  p.id,
  p.name,
  p.category_id,
  c.slug as category_slug,
  c.is_active as category_is_active
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE c.slug = 'edgy-soul'
  AND p.is_active = true
  AND p.deleted_at IS NULL
LIMIT 5;

-- 4. Check if categories table exists and has data
SELECT slug, name, is_active FROM categories WHERE slug IN ('edgy-soul', 'foodie', 'lucky-charm') ORDER BY slug;
