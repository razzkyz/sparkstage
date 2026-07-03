-- Update product departments based on their category_id or category slug
-- This migrates products from legacy categories to new department-based system

-- 1. Check current product department distribution
SELECT 
  department,
  COUNT(*) as product_count
FROM product_retail
GROUP BY department
ORDER BY product_count DESC;

-- 2. Update products to have correct department
-- Charm Bar products (legacy categorySlug-based)
UPDATE product_retail
SET department = 'charmbar'
WHERE department IS NULL
  AND category_id IN (
    SELECT id FROM categories 
    WHERE slug IN (
      'charm', 'holiday', 'hobby', 'italian-bracket', 'pendant-charm', 
      'welded-charm', 'edgy-soul', 'foodie', 'island-vibes', 'love', 
      'pets', 'pop-icon', 'sky-dream', 'soft-muse', 'the-icon', 'zodiac',
      'lucky-charm', 'base'
    )
  );

-- Alternative: Update based on product name patterns (if category_id is NULL)
UPDATE product_retail
SET department = 'charmbar'
WHERE department IS NULL
  AND category_id IS NULL
  AND (
    LOWER(name) LIKE '%charm%' OR
    LOWER(name) LIKE '%bracelet%' OR
    LOWER(name) LIKE '%bangle%' OR
    LOWER(name) LIKE '%necklace%' OR
    LOWER(name) LIKE '%keychain%' OR
    LOWER(name) LIKE '%ring%' OR
    LOWER(name) LIKE '%pendant%'
  );

-- 3. Verify the update
SELECT 
  department,
  COUNT(*) as product_count
FROM product_retail
GROUP BY department
ORDER BY product_count DESC;

-- 4. Check if any products still have old category_id
SELECT 
  p.id,
  p.name,
  p.department,
  p.category_id,
  c.slug as category_slug
FROM product_retail p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.category_id IN (
  SELECT id FROM categories 
  WHERE slug IN (
    'charm', 'holiday', 'hobby', 'italian-bracket', 'pendant-charm', 
    'welded-charm', 'edgy-soul', 'foodie', 'island-vibes', 'love', 
    'pets', 'pop-icon', 'sky-dream', 'soft-muse', 'the-icon', 'zodiac',
    'lucky-charm', 'base'
  )
)
LIMIT 10;
