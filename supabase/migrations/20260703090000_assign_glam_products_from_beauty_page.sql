-- =====================================================
-- Migration: Assign Glam products matching Beauty page filter
-- Created: 2026-07-03
-- Purpose: Assign products to glam department that are shown on /beauty page
-- Reference: BeautyPage.tsx filter logic
-- =====================================================

DO $$
DECLARE
  products_assigned INT := 0;
  total_assigned INT := 0;
  cat_glam_id BIGINT;
BEGIN
  -- Get any main Glam category (try SPARK MY FACE first, fallback to any glam category)
  SELECT id INTO cat_glam_id 
  FROM retail_categories 
  WHERE department = 'glam' AND parent_id IS NULL
  ORDER BY 
    CASE WHEN slug = 'spark-my-face' THEN 1 ELSE 2 END,
    id
  LIMIT 1;

  IF cat_glam_id IS NULL THEN
    RAISE EXCEPTION 'No glam category found in retail_categories';
  END IF;

  RAISE NOTICE 'Using category ID % for Glam products', cat_glam_id;

  -- Assign products with old category slugs that are shown on Beauty page
  -- OLD GLAM SLUGS: makeup, eyewear, glitter, headliner, popsocket, pop-socket, popsockets, body-glitter
  UPDATE products p
  SET retail_category_id = cat_glam_id
  FROM categories c
  WHERE p.category_id = c.id
    AND p.is_active = true
    AND p.deleted_at IS NULL
    AND p.retail_category_id IS NULL
    AND c.slug IN (
      'makeup', 
      'eyewear', 
      'glitter', 
      'headliner', 
      'popsocket', 
      'pop-socket', 
      'popsockets', 
      'body-glitter'
    );
  
  GET DIAGNOSTICS products_assigned = ROW_COUNT;
  total_assigned := total_assigned + products_assigned;
  RAISE NOTICE 'Assigned % products via old category slugs', products_assigned;

  -- Assign products with name containing 'speckles'
  UPDATE products
  SET retail_category_id = cat_glam_id
  WHERE is_active = true
    AND deleted_at IS NULL
    AND retail_category_id IS NULL
    AND name ILIKE '%speckle%';
  
  GET DIAGNOSTICS products_assigned = ROW_COUNT;
  total_assigned := total_assigned + products_assigned;
  RAISE NOTICE 'Assigned % products with "speckles" in name', products_assigned;

  -- Assign products with name containing 'patch'
  UPDATE products
  SET retail_category_id = cat_glam_id
  WHERE is_active = true
    AND deleted_at IS NULL
    AND retail_category_id IS NULL
    AND name ILIKE '%patch%';
  
  GET DIAGNOSTICS products_assigned = ROW_COUNT;
  total_assigned := total_assigned + products_assigned;
  RAISE NOTICE 'Assigned % products with "patch" in name', products_assigned;

  RAISE NOTICE 'Total products assigned to Glam: %', total_assigned;
END $$;

-- Verify Glam products
SELECT 
  'Glam Products' as label,
  COUNT(*) as count
FROM products p
JOIN retail_categories rc ON p.retail_category_id = rc.id
WHERE rc.department = 'glam'
  AND p.is_active = true
  AND p.deleted_at IS NULL;

-- Show breakdown by category
SELECT 
  rc.name as category_name,
  rc.slug as category_slug,
  COUNT(p.id) as product_count
FROM retail_categories rc
LEFT JOIN products p ON p.retail_category_id = rc.id
  AND p.is_active = true
  AND p.deleted_at IS NULL
WHERE rc.department = 'glam'
GROUP BY rc.id, rc.name, rc.slug
ORDER BY product_count DESC;
