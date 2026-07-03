-- =====================================================
-- Migration: Assign Glam and SparkClub products to retail_categories
-- Created: 2026-07-03
-- Purpose: Assign products to retail_category_id for Glam and SparkClub departments
-- =====================================================

DO $$
DECLARE
  products_assigned INT := 0;
  cat_spark_my_nails_id BIGINT;
  cat_spark_my_hair_sc_id BIGINT;
  cat_spark_my_style_id BIGINT;
  cat_spark_my_face_id BIGINT;
  cat_spark_my_hair_glam_id BIGINT;
BEGIN
  -- Get category IDs
  SELECT id INTO cat_spark_my_nails_id FROM retail_categories WHERE slug = 'spark-my-nails' AND department = 'sparkclub';
  SELECT id INTO cat_spark_my_hair_sc_id FROM retail_categories WHERE slug = 'spark-my-hair' AND department = 'sparkclub';
  SELECT id INTO cat_spark_my_style_id FROM retail_categories WHERE slug = 'spark-my-style' AND department = 'sparkclub';
  SELECT id INTO cat_spark_my_face_id FROM retail_categories WHERE slug = 'spark-my-face' AND department = 'glam';
  SELECT id INTO cat_spark_my_hair_glam_id FROM retail_categories WHERE slug = 'spark-my-hair' AND department = 'glam';

  -- SPARK MY NAILS
  UPDATE products SET retail_category_id = cat_spark_my_nails_id
  WHERE is_active = true
    AND deleted_at IS NULL
    AND retail_category_id IS NULL
    AND (
      name ILIKE '%nail%'
      OR name ILIKE '%manicure%'
      OR name ILIKE '%pedicure%'
      OR description ILIKE '%nail%'
    );
  
  GET DIAGNOSTICS products_assigned = ROW_COUNT;
  RAISE NOTICE 'Assigned % products to SPARK MY NAILS', products_assigned;

  -- SPARK MY HAIR (in sparkclub)
  UPDATE products SET retail_category_id = cat_spark_my_hair_sc_id
  WHERE is_active = true
    AND deleted_at IS NULL
    AND retail_category_id IS NULL
    AND (
      name ILIKE '%hair%'
      OR name ILIKE '%tinsel%'
      OR name ILIKE '%hair accessory%'
      OR name ILIKE '%headband%'
      OR name ILIKE '%scrunchie%'
      OR description ILIKE '%hair%'
    );
  
  GET DIAGNOSTICS products_assigned = ROW_COUNT;
  RAISE NOTICE 'Assigned % products to SPARK MY HAIR (sparkclub)', products_assigned;

  -- SPARK MY STYLE
  UPDATE products SET retail_category_id = cat_spark_my_style_id
  WHERE is_active = true
    AND deleted_at IS NULL
    AND retail_category_id IS NULL
    AND (
      name ILIKE '%fashion%'
      OR name ILIKE '%bag%'
      OR name ILIKE '%eyewear%'
      OR name ILIKE '%sunglasses%'
      OR name ILIKE '%glasses%'
      OR name ILIKE '%scarf%'
      OR name ILIKE '%belt%'
      OR name ILIKE '%sleeve%'
      OR name ILIKE '%arm sleeve%'
      OR description ILIKE '%fashion%'
      OR description ILIKE '%accessory%'
    );
  
  GET DIAGNOSTICS products_assigned = ROW_COUNT;
  RAISE NOTICE 'Assigned % products to SPARK MY STYLE', products_assigned;

  -- SPARK MY FACE (glam)
  UPDATE products SET retail_category_id = cat_spark_my_face_id
  WHERE is_active = true
    AND deleted_at IS NULL
    AND retail_category_id IS NULL
    AND (
      name ILIKE '%makeup%'
      OR name ILIKE '%glitter%'
      OR name ILIKE '%headliner%'
      OR name ILIKE '%star glitter%'
      OR name ILIKE '%starglitter%'
      OR name ILIKE '%popsocket%'
      OR name ILIKE '%pop socket%'
      OR name ILIKE '%face%'
      OR name ILIKE '%tattoo%'
      OR description ILIKE '%makeup%'
      OR description ILIKE '%glitter%'
    );
  
  GET DIAGNOSTICS products_assigned = ROW_COUNT;
  RAISE NOTICE 'Assigned % products to SPARK MY FACE', products_assigned;

  -- SPARK MY HAIR (glam)
  UPDATE products SET retail_category_id = cat_spark_my_hair_glam_id
  WHERE is_active = true
    AND deleted_at IS NULL
    AND retail_category_id IS NULL
    AND (
      name ILIKE '%hair tinsel%'
      OR name ILIKE '%hair sparkle%'
      OR description ILIKE '%hair tinsel%'
    );
  
  GET DIAGNOSTICS products_assigned = ROW_COUNT;
  RAISE NOTICE 'Assigned % products to SPARK MY HAIR (glam)', products_assigned;

  RAISE NOTICE 'Completed Glam and SparkClub product assignments';
END $$;

-- Verify assignments by department
SELECT 
  COALESCE(rc.department, 'NO DEPARTMENT') as department,
  COUNT(p.id) as product_count
FROM products p
LEFT JOIN retail_categories rc ON p.retail_category_id = rc.id
WHERE p.is_active = true
  AND p.deleted_at IS NULL
GROUP BY rc.department
ORDER BY product_count DESC;

-- Show distribution across categories
SELECT 
  rc.department,
  rc.name as category_name,
  rc.slug as category_slug,
  COUNT(p.id) as product_count
FROM retail_categories rc
LEFT JOIN products p ON p.retail_category_id = rc.id
  AND p.is_active = true
  AND p.deleted_at IS NULL
WHERE rc.parent_id IS NULL  -- Only main categories
GROUP BY rc.id, rc.department, rc.name, rc.slug
HAVING COUNT(p.id) > 0
ORDER BY rc.department, product_count DESC;
