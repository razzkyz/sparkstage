-- =====================================================
-- Migration: Assign CharmBar products to retail_categories
-- Created: 2026-07-03
-- Purpose: Assign products to retail_category_id based on product names
-- This is a workaround because products.category_id points to old categories table
-- and categorySlug is coming back as NULL in the frontend
-- =====================================================

-- First, let's see what we have
DO $$
DECLARE
  charmbar_category_count INT;
  products_with_null_retail_cat INT;
BEGIN
  SELECT COUNT(*) INTO charmbar_category_count
  FROM retail_categories
  WHERE department = 'charmbar';
  
  SELECT COUNT(*) INTO products_with_null_retail_cat
  FROM products
  WHERE retail_category_id IS NULL
    AND is_active = true
    AND deleted_at IS NULL;
  
  RAISE NOTICE 'CharmBar categories in retail_categories: %', charmbar_category_count;
  RAISE NOTICE 'Products with NULL retail_category_id: %', products_with_null_retail_cat;
END $$;

-- Get the retail_category IDs for charm bar categories
DO $$
DECLARE
  cat_base_id BIGINT;
  cat_edgy_soul_id BIGINT;
  cat_foodie_id BIGINT;
  cat_hobby_id BIGINT;
  cat_holiday_id BIGINT;
  cat_island_vibes_id BIGINT;
  cat_love_id BIGINT;
  cat_pets_id BIGINT;
  cat_pop_icon_id BIGINT;
  cat_sky_dream_id BIGINT;
  cat_soft_muse_id BIGINT;
  cat_the_icon_id BIGINT;
  cat_zodiac_id BIGINT;
  cat_lucky_charm_id BIGINT;
  cat_pendants_id BIGINT;
  cat_welded_id BIGINT;
  cat_spark_my_charms_id BIGINT;
BEGIN
  -- Get category IDs
  SELECT id INTO cat_base_id FROM retail_categories WHERE slug = 'base' AND department = 'charmbar';
  SELECT id INTO cat_edgy_soul_id FROM retail_categories WHERE slug = 'edgy-soul' AND department = 'charmbar';
  SELECT id INTO cat_foodie_id FROM retail_categories WHERE slug = 'foodie' AND department = 'charmbar';
  SELECT id INTO cat_hobby_id FROM retail_categories WHERE slug = 'hobby' AND department = 'charmbar';
  SELECT id INTO cat_holiday_id FROM retail_categories WHERE slug = 'holiday' AND department = 'charmbar';
  SELECT id INTO cat_island_vibes_id FROM retail_categories WHERE slug = 'island-vibes' AND department = 'charmbar';
  SELECT id INTO cat_love_id FROM retail_categories WHERE slug = 'love' AND department = 'charmbar';
  SELECT id INTO cat_pets_id FROM retail_categories WHERE slug = 'pets' AND department = 'charmbar';
  SELECT id INTO cat_pop_icon_id FROM retail_categories WHERE slug = 'pop-icon' AND department = 'charmbar';
  SELECT id INTO cat_sky_dream_id FROM retail_categories WHERE slug = 'sky-dream' AND department = 'charmbar';
  SELECT id INTO cat_soft_muse_id FROM retail_categories WHERE slug = 'soft-muse' AND department = 'charmbar';
  SELECT id INTO cat_the_icon_id FROM retail_categories WHERE slug = 'the-icon' AND department = 'charmbar';
  SELECT id INTO cat_zodiac_id FROM retail_categories WHERE slug = 'zodiac' AND department = 'charmbar';
  SELECT id INTO cat_lucky_charm_id FROM retail_categories WHERE slug = 'lucky-charm' AND department = 'charmbar';
  SELECT id INTO cat_pendants_id FROM retail_categories WHERE slug = 'pendants' AND department = 'charmbar';
  SELECT id INTO cat_welded_id FROM retail_categories WHERE slug = 'welded' AND department = 'charmbar';
  SELECT id INTO cat_spark_my_charms_id FROM retail_categories WHERE slug = 'spark-my-charms' AND department = 'charmbar' AND parent_id IS NULL;

  -- Assign products based on keywords in name
  -- Base / Charm Base
  UPDATE products
  SET retail_category_id = cat_base_id
  WHERE is_active = true
    AND deleted_at IS NULL
    AND retail_category_id IS NULL
    AND (
      name ILIKE '%base%charm%'
      OR name ILIKE '%charm%base%'
      OR name ILIKE '%bracket%'
    );

  -- Welded Charm
  UPDATE products
  SET retail_category_id = cat_welded_id
  WHERE is_active = true
    AND deleted_at IS NULL
    AND retail_category_id IS NULL
    AND name ILIKE '%welded%';

  -- Pendant Charm
  UPDATE products
  SET retail_category_id = cat_pendants_id
  WHERE is_active = true
    AND deleted_at IS NULL
    AND retail_category_id IS NULL
    AND (
      name ILIKE '%pendant%'
      OR name ILIKE '%necklace%'
    );

  -- Edgy Soul
  UPDATE products
  SET retail_category_id = cat_edgy_soul_id
  WHERE is_active = true
    AND deleted_at IS NULL
    AND retail_category_id IS NULL
    AND (
      name ILIKE '%skull%'
      OR name ILIKE '%gothic%'
      OR name ILIKE '%rock%'
      OR name ILIKE '%metal%'
    );

  -- Foodie
  UPDATE products
  SET retail_category_id = cat_foodie_id
  WHERE is_active = true
    AND deleted_at IS NULL
    AND retail_category_id IS NULL
    AND (
      name ILIKE '%food%'
      OR name ILIKE '%cake%'
      OR name ILIKE '%pizza%'
      OR name ILIKE '%burger%'
      OR name ILIKE '%coffee%'
      OR name ILIKE '%drink%'
    );

  -- Love / Heart
  UPDATE products
  SET retail_category_id = cat_love_id
  WHERE is_active = true
    AND deleted_at IS NULL
    AND retail_category_id IS NULL
    AND (
      name ILIKE '%heart%'
      OR name ILIKE '%love%'
      OR name ILIKE '%cupid%'
      OR name ILIKE '%valentine%'
    );

  -- Pets / Animals
  UPDATE products
  SET retail_category_id = cat_pets_id
  WHERE is_active = true
    AND deleted_at IS NULL
    AND retail_category_id IS NULL
    AND (
      name ILIKE '%dog%'
      OR name ILIKE '%cat%'
      OR name ILIKE '%pet%'
      OR name ILIKE '%animal%'
      OR name ILIKE '%paw%'
      OR name ILIKE '%puppy%'
      OR name ILIKE '%kitty%'
    );

  -- Zodiac
  UPDATE products
  SET retail_category_id = cat_zodiac_id
  WHERE is_active = true
    AND deleted_at IS NULL
    AND retail_category_id IS NULL
    AND (
      name ILIKE '%zodiac%'
      OR name ILIKE '%aries%'
      OR name ILIKE '%taurus%'
      OR name ILIKE '%gemini%'
      OR name ILIKE '%cancer%'
      OR name ILIKE '%leo%'
      OR name ILIKE '%virgo%'
      OR name ILIKE '%libra%'
      OR name ILIKE '%scorpio%'
      OR name ILIKE '%sagittarius%'
      OR name ILIKE '%capricorn%'
      OR name ILIKE '%aquarius%'
      OR name ILIKE '%pisces%'
    );

  -- Holiday
  UPDATE products
  SET retail_category_id = cat_holiday_id
  WHERE is_active = true
    AND deleted_at IS NULL
    AND retail_category_id IS NULL
    AND (
      name ILIKE '%christmas%'
      OR name ILIKE '%halloween%'
      OR name ILIKE '%easter%'
      OR name ILIKE '%holiday%'
      OR name ILIKE '%santa%'
      OR name ILIKE '%snowman%'
    );

  -- Island Vibes
  UPDATE products
  SET retail_category_id = cat_island_vibes_id
  WHERE is_active = true
    AND deleted_at IS NULL
    AND retail_category_id IS NULL
    AND (
      name ILIKE '%beach%'
      OR name ILIKE '%sea%'
      OR name ILIKE '%ocean%'
      OR name ILIKE '%tropical%'
      OR name ILIKE '%summer%'
      OR name ILIKE '%sun%'
    );

  -- Remaining charm products go to SPARK MY CHARMS (generic)
  UPDATE products
  SET retail_category_id = cat_spark_my_charms_id
  WHERE is_active = true
    AND deleted_at IS NULL
    AND retail_category_id IS NULL
    AND (
      name ILIKE '%charm%'
      OR name ILIKE '%bangle%'
      OR name ILIKE '%bracelet%'
      OR name ILIKE '%ring%'
      OR name ILIKE '%keychain%'
    );

  RAISE NOTICE 'Assigned charm bar products to retail_categories';
END $$;

-- Verify assignments
SELECT 
  rc.name as category_name,
  rc.slug as category_slug,
  COUNT(p.id) as product_count
FROM retail_categories rc
LEFT JOIN products p ON p.retail_category_id = rc.id
  AND p.is_active = true
  AND p.deleted_at IS NULL
WHERE rc.department = 'charmbar'
GROUP BY rc.id, rc.name, rc.slug
ORDER BY product_count DESC, rc.name;
