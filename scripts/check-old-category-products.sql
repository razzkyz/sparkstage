-- Check products that still reference old categories

-- 1. Check what categories products are currently using
SELECT DISTINCT
  COALESCE(p.category_slug, 'NULL') as category_slug,
  COALESCE(p.retail_category_slug, 'NULL') as retail_category_slug,
  COUNT(*) as product_count
FROM product_retail p
WHERE p.department = 'charmbar' OR p.category_slug IN ('base', 'edgy-soul', 'foodie', 'hobby', 'holiday', 'island-vibes', 'love', 'pets', 'pop-icon', 'sky-dream', 'soft-muse', 'the-icon', 'zodiac', 'italian-bracket', 'pendant-charm', 'welded-charm', 'charm', 'lucky-charm')
GROUP BY p.category_slug, p.retail_category_slug
ORDER BY product_count DESC;

-- 2. List products with old category slugs
SELECT 
  p.id,
  p.title,
  p.category_slug,
  p.retail_category_slug,
  p.retail_category_id,
  p.department
FROM product_retail p
WHERE p.category_slug IN ('base', 'edgy-soul', 'foodie', 'hobby', 'holiday', 'island-vibes', 'love', 'pets', 'pop-icon', 'sky-dream', 'soft-muse', 'the-icon', 'zodiac', 'italian-bracket', 'pendant-charm', 'welded-charm', 'charm', 'lucky-charm')
LIMIT 20;

-- 3. Check if any retail_categories table has these old slugs
SELECT id, name, slug, department, parent_id
FROM retail_categories
WHERE slug IN ('base', 'edgy-soul', 'foodie', 'hobby', 'holiday', 'island-vibes', 'love', 'pets', 'pop-icon', 'sky-dream', 'soft-muse', 'the-icon', 'zodiac', 'italian-bracket', 'pendant-charm', 'welded-charm', 'charm', 'lucky-charm')
ORDER BY department, name;
