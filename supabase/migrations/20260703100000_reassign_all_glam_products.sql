-- =====================================================
-- Migration: Reassign ALL Glam products from Beauty page
-- Created: 2026-07-03
-- Purpose: OVERRIDE and assign all products shown on /beauty page to glam department
-- This will reassign products that may have been assigned to other departments
-- =====================================================

DO $$
DECLARE
  products_assigned INT := 0;
  total_assigned INT := 0;
  cat_glam_id BIGINT;
BEGIN
  -- Get any main Glam category
  SELECT id INTO cat_glam_id 
  FROM retail_categories 
  WHERE department = 'glam' AND parent_id IS NULL
  ORDER BY id
  LIMIT 1;

  IF cat_glam_id IS NULL THEN
    RAISE EXCEPTION 'No glam category found in retail_categories';
  END IF;

  RAISE NOTICE 'Using category ID % for Glam products', cat_glam_id;

  -- OVERRIDE: Assign products with old category slugs (REMOVE retail_category_id IS NULL check)
  -- OLD GLAM SLUGS: makeup, eyewear, glitter, headliner, popsocket, pop-socket, popsockets, body-glitter
  UPDATE products p
  SET retail_category_id = cat_glam_id
  FROM categories c
  WHERE p.category_id = c.id
    AND p.is_active = true
    AND p.deleted_at IS NULL
    AND c.slug IN (
      'makeup', 
      'eyewear', 
      'glitter', 
      'headliner', 
      'popsocket', 
      'pop-socket', 
      'popsockets', 
      'body-glitter',
      'starglitter',
      'star-glitter'
    );
  
  GET DIAGNOSTICS products_assigned = ROW_COUNT;
  total_assigned := total_assigned + products_assigned;
  RAISE NOTICE 'Assigned % products via old category slugs (OVERRIDE)', products_assigned;

  -- Also assign products with name containing glitter/makeup keywords
  UPDATE products
  SET retail_category_id = cat_glam_id
  WHERE is_active = true
    AND deleted_at IS NULL
    AND (
      name ILIKE '%glitter%'
      OR name ILIKE '%headliner%'
      OR name ILIKE '%popsocket%'
      OR name ILIKE '%pop socket%'
      OR name ILIKE '%speckle%'
      OR name ILIKE '%patch%'
      OR name ILIKE '%makeup%'
      OR name ILIKE '%tattoo%' 
    );
  
  GET DIAGNOSTICS products_assigned = ROW_COUNT;
  total_assigned := total_assigned + products_assigned;
  RAISE NOTICE 'Assigned % products with glam keywords in name (OVERRIDE)', products_assigned;

  RAISE NOTICE 'Total products assigned to Glam: %', total_assigned;
END $$;

-- Verify Glam products
SELECT 
  'Glam Products Total' as label,
  COUNT(*) as count
FROM products p
JOIN retail_categories rc ON p.retail_category_id = rc.id
WHERE rc.department = 'glam'
  AND p.is_active = true
  AND p.deleted_at IS NULL;

-- Show sample products
SELECT 
  p.id,
  p.name,
  rc.name as category_name,
  rc.slug as category_slug
FROM products p
JOIN retail_categories rc ON p.retail_category_id = rc.id
WHERE rc.department = 'glam'
  AND p.is_active = true
  AND p.deleted_at IS NULL
ORDER BY p.name
LIMIT 20;
