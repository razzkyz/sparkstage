-- Verify categories table has charm bar categories

-- 1. Check if categories table exists and has data
SELECT 'categories table count' as check_name, COUNT(*) as count
FROM categories;

-- 2. Check for charm bar related categories
SELECT 
  id,
  name,
  slug,
  parent_id,
  is_active
FROM categories
WHERE slug IN (
  'charm', 'holiday', 'hobby', 'italian-bracket', 'pendant-charm', 
  'welded-charm', 'edgy-soul', 'foodie', 'island-vibes', 'love', 
  'pets', 'pop-icon', 'sky-dream', 'soft-muse', 'the-icon', 'zodiac',
  'base', 'lucky-charm', 'pendants', 'welded', 'bangles', 'bracelet'
)
ORDER BY slug;

-- 3. Check products with NULL category_id
SELECT 'Products with NULL category_id' as check_name, COUNT(*) as count
FROM products
WHERE category_id IS NULL
  AND is_active = true
  AND deleted_at IS NULL;

-- 4. Sample products with their category info
SELECT 
  p.id,
  p.name,
  p.category_id,
  c.slug as category_slug,
  c.name as category_name,
  c.is_active as category_is_active
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.is_active = true
  AND p.deleted_at IS NULL
LIMIT 20;
