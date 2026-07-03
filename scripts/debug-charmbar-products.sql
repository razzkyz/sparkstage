-- Debug: Check products and their categorySlug mapping
-- This will show why products are not displaying on CharmBar page

-- 1. Check total products with old category assignments
SELECT 
  COUNT(*) as total_products,
  COUNT(DISTINCT p.category_id) as distinct_old_categories
FROM product_retail p
WHERE p.is_active = true 
  AND p.deleted_at IS NULL;

-- 2. Check products grouped by old category slug
SELECT 
  c.slug as category_slug,
  c.name as category_name,
  c.is_active,
  COUNT(p.id) as product_count
FROM categories c
LEFT JOIN product_retail p ON p.category_id = c.id
  AND p.is_active = true 
  AND p.deleted_at IS NULL
GROUP BY c.id, c.slug, c.name, c.is_active
HAVING COUNT(p.id) > 0
ORDER BY product_count DESC;

-- 3. Check specific charm bar category slugs
SELECT 
  c.slug as category_slug,
  c.name as category_name,
  c.is_active,
  COUNT(p.id) as product_count
FROM categories c
LEFT JOIN product_retail p ON p.category_id = c.id
  AND p.is_active = true 
  AND p.deleted_at IS NULL
WHERE c.slug IN (
  'charm', 'holiday', 'hobby', 'italian-bracket', 'pendant-charm', 
  'welded-charm', 'edgy-soul', 'foodie', 'island-vibes', 'love', 
  'pets', 'pop-icon', 'sky-dream', 'soft-muse', 'the-icon', 'zodiac'
)
GROUP BY c.id, c.slug, c.name, c.is_active
ORDER BY product_count DESC;

-- 4. Sample products with their category details
SELECT 
  p.id,
  p.name,
  p.retail_category_id,
  p.category_id as old_category_id,
  c.slug as old_category_slug,
  c.name as old_category_name,
  c.is_active as category_is_active,
  rc.department as retail_department,
  rc.name as retail_category_name
FROM product_retail p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN retail_categories rc ON p.retail_category_id = rc.id
WHERE p.is_active = true 
  AND p.deleted_at IS NULL
ORDER BY p.id
LIMIT 20;
