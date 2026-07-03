-- =====================================================
-- Migration: Complete GLAM subcategories structure
-- Created: 2026-07-03
-- Purpose: Ensure all GLAM subcategories match the specification
-- =====================================================

DO $$
DECLARE
  cat_face_id BIGINT;
  cat_hair_id BIGINT;
  cat_charms_id BIGINT;
  cat_nails_id BIGINT;
  cat_style_id BIGINT;
BEGIN
  -- Get main category IDs
  SELECT id INTO cat_face_id FROM retail_categories WHERE department = 'glam' AND slug = 'spark-my-face' AND parent_id IS NULL;
  SELECT id INTO cat_hair_id FROM retail_categories WHERE department = 'glam' AND slug = 'spark-my-hair' AND parent_id IS NULL;
  SELECT id INTO cat_charms_id FROM retail_categories WHERE department = 'glam' AND slug = 'spark-my-charms' AND parent_id IS NULL;
  SELECT id INTO cat_nails_id FROM retail_categories WHERE department = 'glam' AND slug = 'spark-my-nails' AND parent_id IS NULL;
  SELECT id INTO cat_style_id FROM retail_categories WHERE department = 'glam' AND slug = 'spark-my-style' AND parent_id IS NULL;

  -- =====================================================
  -- SPARK MY FACE subcategories
  -- =====================================================
  IF cat_face_id IS NOT NULL THEN
    -- STAR GLITTER
    INSERT INTO retail_categories (name, slug, department, parent_id, is_active)
    VALUES ('STAR GLITTER', 'star-glitter', 'glam', cat_face_id, true)
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name,
      parent_id = EXCLUDED.parent_id,
      is_active = EXCLUDED.is_active;

    -- GLITTER TATTOO
    INSERT INTO retail_categories (name, slug, department, parent_id, is_active)
    VALUES ('GLITTER TATTOO', 'glitter-tattoo', 'glam', cat_face_id, true)
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name,
      parent_id = EXCLUDED.parent_id,
      is_active = EXCLUDED.is_active;

    RAISE NOTICE 'Added SPARK MY FACE subcategories';
  END IF;

  -- =====================================================
  -- SPARK MY HAIR subcategories
  -- =====================================================
  IF cat_hair_id IS NOT NULL THEN
    -- SPARKLE HAIR TINSEL
    INSERT INTO retail_categories (name, slug, department, parent_id, is_active)
    VALUES ('SPARKLE HAIR TINSEL', 'sparkle-hair-tinsel', 'glam', cat_hair_id, true)
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name,
      parent_id = EXCLUDED.parent_id,
      is_active = EXCLUDED.is_active;

    -- HAIR ACCESSORIES
    INSERT INTO retail_categories (name, slug, department, parent_id, is_active)
    VALUES ('HAIR ACCESSORIES', 'hair-accessories', 'glam', cat_hair_id, true)
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name,
      parent_id = EXCLUDED.parent_id,
      is_active = EXCLUDED.is_active;

    RAISE NOTICE 'Added SPARK MY HAIR subcategories';
  END IF;

  -- =====================================================
  -- SPARK MY CHARMS subcategories
  -- =====================================================
  IF cat_charms_id IS NOT NULL THEN
    INSERT INTO retail_categories (name, slug, department, parent_id, is_active)
    VALUES 
      ('CHARMS BASE', 'charms-base', 'glam', cat_charms_id, true),
      ('WELDED CHARMS', 'welded-charms', 'glam', cat_charms_id, true),
      ('PENDANT CHARMS', 'pendant-charms', 'glam', cat_charms_id, true),
      ('KEYCHAINS', 'keychains', 'glam', cat_charms_id, true),
      ('NECKLACES', 'necklaces', 'glam', cat_charms_id, true),
      ('RINGS', 'rings', 'glam', cat_charms_id, true),
      ('BRACELET', 'bracelet', 'glam', cat_charms_id, true),
      ('BANGLES', 'bangles', 'glam', cat_charms_id, true)
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name,
      parent_id = EXCLUDED.parent_id,
      is_active = EXCLUDED.is_active;

    RAISE NOTICE 'Added SPARK MY CHARMS subcategories';
  END IF;

  -- =====================================================
  -- SPARK MY NAILS - no subcategories
  -- =====================================================
  -- SPARK MY NAILS doesn't need subcategories per spec

  -- =====================================================
  -- SPARK MY STYLE subcategories
  -- =====================================================
  IF cat_style_id IS NOT NULL THEN
    INSERT INTO retail_categories (name, slug, department, parent_id, is_active)
    VALUES 
      ('FASHION', 'fashion', 'glam', cat_style_id, true),
      ('BAG', 'bag', 'glam', cat_style_id, true),
      ('EYEWEAR', 'eyewear', 'glam', cat_style_id, true),
      ('SCARVES', 'scarves', 'glam', cat_style_id, true),
      ('BELTS', 'belts', 'glam', cat_style_id, true),
      ('ARM SLEEVES', 'arm-sleeves', 'glam', cat_style_id, true)
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name,
      parent_id = EXCLUDED.parent_id,
      is_active = EXCLUDED.is_active;

    RAISE NOTICE 'Added SPARK MY STYLE subcategories';
  END IF;

END $$;

-- Verify final structure
SELECT 
  CASE 
    WHEN parent_id IS NULL THEN '🔷 ' || name
    ELSE '  └─ ' || name
  END as category_tree,
  slug,
  is_active
FROM retail_categories
WHERE department = 'glam'
ORDER BY 
  COALESCE(parent_id, id),
  CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END,
  name;
