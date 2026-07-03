-- =====================================================
-- Migration: Exclude 3 more products from Glam
-- Created: 2026-07-03
-- Purpose: Remove retail_category_id from:
--          - Leopard & Glitter Split Welded Charm
--          - Midnight Onyx Oval- GLS016
--          - Pink Butterfly Glitter Bow Welded Charm
-- =====================================================

-- Remove retail_category_id from these 3 products by name
UPDATE products
SET retail_category_id = NULL
WHERE name IN (
  'Leopard & Glitter Split Welded Charm',
  'Midnight Onyx Oval- GLS016',
  'Pink Butterfly Glitter Bow Welded Charm'
)
AND is_active = true
AND deleted_at IS NULL;

-- Verify removal
SELECT 
  id,
  name,
  retail_category_id
FROM products
WHERE name IN (
  'Leopard & Glitter Split Welded Charm',
  'Midnight Onyx Oval- GLS016',
  'Pink Butterfly Glitter Bow Welded Charm'
);
