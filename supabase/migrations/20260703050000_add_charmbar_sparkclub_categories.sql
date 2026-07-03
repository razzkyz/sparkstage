-- =====================================================
-- Migration: Add proper categories for Charmbar and Sparkclub
-- Created: 2026-07-03
-- Purpose: Add SPARK MY CHARMS and SPARK MY STYLE categories
-- =====================================================

-- =========================================
-- CHARMBAR: Add SPARK MY CHARMS structure
-- =========================================

-- Check if SPARK MY CHARMS already exists
DO $$
DECLARE
  charms_id INTEGER;
BEGIN
  -- Insert main category if not exists
  INSERT INTO retail_categories (department, name, slug, parent_id, is_active)
  VALUES ('charmbar', 'SPARK MY CHARMS', 'charmbar-spark-my-charms', NULL, true)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO charms_id;

  -- If new record, add subcategories
  IF charms_id IS NOT NULL THEN
    INSERT INTO retail_categories (department, name, slug, parent_id, is_active)
    VALUES
      ('charmbar', 'CHARMS BASE', 'charmbar-charms-base', charms_id, true),
      ('charmbar', 'WELDED CHARMS', 'charmbar-welded-charms', charms_id, true),
      ('charmbar', 'PENDANT CHARMS', 'charmbar-pendant-charms', charms_id, true),
      ('charmbar', 'KEYCHAINS', 'charmbar-keychains', charms_id, true),
      ('charmbar', 'NECKLACES', 'charmbar-necklaces', charms_id, true),
      ('charmbar', 'RINGS', 'charmbar-rings', charms_id, true),
      ('charmbar', 'BRACELET', 'charmbar-bracelet', charms_id, true),
      ('charmbar', 'BANGLES', 'charmbar-bangles', charms_id, true)
    ON CONFLICT (slug) DO NOTHING;
  END IF;
END $$;

-- =========================================
-- SPARKCLUB: Add SPARK MY categories
-- =========================================

-- 1. SPARK MY NAILS (no subcategories)
INSERT INTO retail_categories (department, name, slug, parent_id, is_active)
VALUES ('sparkclub', 'SPARK MY NAILS', 'sparkclub-spark-my-nails', NULL, true)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

-- 2. SPARK MY HAIR with subcategories
DO $$
DECLARE
  hair_id INTEGER;
BEGIN
  INSERT INTO retail_categories (department, name, slug, parent_id, is_active)
  VALUES ('sparkclub', 'SPARK MY HAIR', 'sparkclub-spark-my-hair', NULL, true)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO hair_id;

  IF hair_id IS NOT NULL THEN
    INSERT INTO retail_categories (department, name, slug, parent_id, is_active)
    VALUES
      ('sparkclub', 'SPARKLE HAIR TINSEL', 'sparkclub-sparkle-hair-tinsel', hair_id, true),
      ('sparkclub', 'HAIR ACCESSORIES', 'sparkclub-hair-accessories', hair_id, true)
    ON CONFLICT (slug) DO NOTHING;
  END IF;
END $$;

-- 3. SPARK MY STYLE with subcategories
DO $$
DECLARE
  style_id INTEGER;
BEGIN
  INSERT INTO retail_categories (department, name, slug, parent_id, is_active)
  VALUES ('sparkclub', 'SPARK MY STYLE', 'sparkclub-spark-my-style', NULL, true)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO style_id;

  IF style_id IS NOT NULL THEN
    INSERT INTO retail_categories (department, name, slug, parent_id, is_active)
    VALUES
      ('sparkclub', 'FASHION', 'sparkclub-fashion', style_id, true),
      ('sparkclub', 'BAG', 'sparkclub-bag', style_id, true),
      ('sparkclub', 'EYEWEAR', 'sparkclub-eyewear', style_id, true),
      ('sparkclub', 'SCARVES', 'sparkclub-scarves', style_id, true),
      ('sparkclub', 'BELTS', 'sparkclub-belts', style_id, true),
      ('sparkclub', 'ARM SLEEVES', 'sparkclub-arm-sleeves', style_id, true)
    ON CONFLICT (slug) DO NOTHING;
  END IF;
END $$;

-- =========================================
-- Verification
-- =========================================

-- Show all categories by department
SELECT 
  department,
  COUNT(*) as total_categories,
  COUNT(CASE WHEN parent_id IS NULL THEN 1 END) as main_categories,
  COUNT(CASE WHEN parent_id IS NOT NULL THEN 1 END) as subcategories
FROM retail_categories
WHERE department IN ('glam', 'charmbar', 'sparkclub')
GROUP BY department
ORDER BY department;
