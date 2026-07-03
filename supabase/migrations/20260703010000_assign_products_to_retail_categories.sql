-- =====================================================
-- Migration: Assign products to retail_categories
-- Created: 2026-07-03
-- Purpose: Update products to use new retail_categories instead of old categories
-- =====================================================

-- Step 1: Check current state (for logging)
DO $$
DECLARE
  products_without_retail_cat INTEGER;
  products_with_old_cat INTEGER;
BEGIN
  SELECT COUNT(*) INTO products_without_retail_cat
  FROM product_retail
  WHERE retail_category_id IS NULL;
  
  SELECT COUNT(*) INTO products_with_old_cat
  FROM product_retail
  WHERE category_id IS NOT NULL;
  
  RAISE NOTICE 'Products without retail_category_id: %', products_without_retail_cat;
  RAISE NOTICE 'Products with old category_id: %', products_with_old_cat;
END $$;

-- Step 2: Assign Charm Bar products to SPARK MY CHARMS
-- Based on old category slugs from categories table

UPDATE product_retail p
SET 
  retail_category_id = (SELECT id FROM retail_categories WHERE slug = 'glam-spark-my-charms' AND department = 'glam' LIMIT 1),
  retail_subcategory_id = CASE
    -- Map old slugs to new subcategories
    WHEN EXISTS (SELECT 1 FROM categories WHERE id = p.category_id AND slug IN ('pendant-charm', 'pendant')) THEN
      (SELECT id FROM retail_categories WHERE slug = 'glam-pendant-charms')
    WHEN EXISTS (SELECT 1 FROM categories WHERE id = p.category_id AND slug IN ('welded-charm', 'welded')) THEN
      (SELECT id FROM retail_categories WHERE slug = 'glam-welded-charms')
    WHEN EXISTS (SELECT 1 FROM categories WHERE id = p.category_id AND slug IN ('charm', 'lucky-charm', 'base')) THEN
      (SELECT id FROM retail_categories WHERE slug = 'glam-charms-base')
    ELSE
      NULL  -- Will need manual assignment
  END
WHERE p.category_id IN (
  SELECT id FROM categories 
  WHERE slug IN (
    'charm', 'holiday', 'hobby', 'italian-bracket', 'pendant-charm', 'pendant',
    'welded-charm', 'welded', 'edgy-soul', 'foodie', 'island-vibes', 'love', 
    'pets', 'pop-icon', 'sky-dream', 'soft-muse', 'the-icon', 'zodiac',
    'lucky-charm', 'base'
  )
);

-- Step 3: Products with "bangle", "bracelet", "necklace", "ring", "keychain" in name
-- Assign to appropriate subcategories if not already assigned

UPDATE product_retail
SET 
  retail_category_id = (SELECT id FROM retail_categories WHERE slug = 'glam-spark-my-charms'),
  retail_subcategory_id = (SELECT id FROM retail_categories WHERE slug = 'glam-bangles')
WHERE retail_category_id IS NULL
  AND LOWER(name) LIKE '%bangle%';

UPDATE product_retail
SET 
  retail_category_id = (SELECT id FROM retail_categories WHERE slug = 'glam-spark-my-charms'),
  retail_subcategory_id = (SELECT id FROM retail_categories WHERE slug = 'glam-bracelet')
WHERE retail_category_id IS NULL
  AND LOWER(name) LIKE '%bracelet%';

UPDATE product_retail
SET 
  retail_category_id = (SELECT id FROM retail_categories WHERE slug = 'glam-spark-my-charms'),
  retail_subcategory_id = (SELECT id FROM retail_categories WHERE slug = 'glam-necklaces')
WHERE retail_category_id IS NULL
  AND LOWER(name) LIKE '%necklace%';

UPDATE product_retail
SET 
  retail_category_id = (SELECT id FROM retail_categories WHERE slug = 'glam-spark-my-charms'),
  retail_subcategory_id = (SELECT id FROM retail_categories WHERE slug = 'glam-rings')
WHERE retail_category_id IS NULL
  AND LOWER(name) LIKE '%ring%'
  AND LOWER(name) NOT LIKE '%earring%';

UPDATE product_retail
SET 
  retail_category_id = (SELECT id FROM retail_categories WHERE slug = 'glam-spark-my-charms'),
  retail_subcategory_id = (SELECT id FROM retail_categories WHERE slug = 'glam-keychains')
WHERE retail_category_id IS NULL
  AND LOWER(name) LIKE '%keychain%';

-- Step 4: Verification
SELECT 
  'After migration:' as status,
  COUNT(*) as total_products,
  COUNT(retail_category_id) as with_retail_category,
  COUNT(*) - COUNT(retail_category_id) as without_retail_category
FROM product_retail;

-- Show products that still need manual assignment
SELECT 
  id,
  name,
  category_id,
  retail_category_id,
  retail_subcategory_id
FROM product_retail
WHERE retail_category_id IS NULL
  AND category_id IN (
    SELECT id FROM categories 
    WHERE slug IN (
      'charm', 'holiday', 'hobby', 'italian-bracket', 'pendant-charm', 
      'welded-charm', 'edgy-soul', 'foodie', 'island-vibes', 'love', 
      'pets', 'pop-icon', 'sky-dream', 'soft-muse', 'the-icon', 'zodiac',
      'lucky-charm', 'base'
    )
  )
LIMIT 10;

-- =====================================================
-- Summary
-- =====================================================

COMMENT ON TABLE product_retail IS 'Product retail table - migrated to retail_categories 2026-07-03';
