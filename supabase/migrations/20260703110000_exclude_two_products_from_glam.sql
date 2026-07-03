-- =====================================================
-- Migration: Exclude 2 products from Glam department
-- Created: 2026-07-03
-- Purpose: Remove retail_category_id from Glitter Heart Chain and Glitter Pink Channel Logo
--          so they don't appear in /admin/store?dept=glam
-- =====================================================

-- Remove retail_category_id from these 2 products
UPDATE products
SET retail_category_id = NULL
WHERE name IN (
  'Glitter Heart Chain Pendants (Set 2 Pcs)',
  'Glitter Pink Channel Logo Welded Charm'
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
  'Glitter Heart Chain Pendants (Set 2 Pcs)',
  'Glitter Pink Channel Logo Welded Charm'
)
AND is_active = true
AND deleted_at IS NULL;
