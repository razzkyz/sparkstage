-- =====================================================
-- Migration: Reassign 5 products to correct departments
-- Created: 2026-07-03
-- Purpose: Assign 4 charm products to charmbar, 1 eyewear to sparkclub
-- =====================================================

DO $$
DECLARE
  cat_charmbar_id BIGINT;
  cat_sparkclub_id BIGINT;
  rows_affected INT;
BEGIN
  -- Get any charmbar category (any main category)
  SELECT id INTO cat_charmbar_id 
  FROM retail_categories 
  WHERE department = 'charmbar' 
    AND parent_id IS NULL
  ORDER BY id
  LIMIT 1;

  -- Get any sparkclub category (preferably accessories/eyewear related)
  SELECT id INTO cat_sparkclub_id 
  FROM retail_categories 
  WHERE department = 'sparkclub'
    AND parent_id IS NULL
  ORDER BY 
    CASE 
      WHEN slug LIKE '%style%' THEN 1
      WHEN slug LIKE '%spark%' THEN 2
      ELSE 3
    END,
    id
  LIMIT 1;

  IF cat_charmbar_id IS NULL THEN
    RAISE EXCEPTION 'No charmbar category found';
  END IF;

  IF cat_sparkclub_id IS NULL THEN
    RAISE EXCEPTION 'No sparkclub category found';
  END IF;

  RAISE NOTICE 'Using charmbar category ID: %', cat_charmbar_id;
  RAISE NOTICE 'Using sparkclub category ID: %', cat_sparkclub_id;

  -- Assign 4 charm products to charmbar
  UPDATE products
  SET retail_category_id = cat_charmbar_id
  WHERE name IN (
    'Glitter Heart Chain Pendants (Set 2 Pcs)',
    'Glitter Pink Channel Logo Welded Charm',
    'Leopard & Glitter Split Welded Charm',
    'Pink Butterfly Glitter Bow Welded Charm'
  )
  AND is_active = true
  AND deleted_at IS NULL;

  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RAISE NOTICE 'Assigned % charm products to charmbar', rows_affected;

  -- Assign 1 eyewear product to sparkclub
  UPDATE products
  SET retail_category_id = cat_sparkclub_id
  WHERE name = 'Midnight Onyx Oval- GLS016'
  AND is_active = true
  AND deleted_at IS NULL;

  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RAISE NOTICE 'Assigned % eyewear product to sparkclub', rows_affected;

END $$;

-- Verify assignments
SELECT 
  p.id,
  p.name,
  rc.name as retail_category_name,
  rc.department
FROM products p
LEFT JOIN retail_categories rc ON p.retail_category_id = rc.id
WHERE p.name IN (
  'Glitter Heart Chain Pendants (Set 2 Pcs)',
  'Glitter Pink Channel Logo Welded Charm',
  'Leopard & Glitter Split Welded Charm',
  'Pink Butterfly Glitter Bow Welded Charm',
  'Midnight Onyx Oval- GLS016'
)
ORDER BY rc.department, p.name;
