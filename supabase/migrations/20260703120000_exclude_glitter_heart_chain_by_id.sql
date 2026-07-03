-- =====================================================
-- Migration: Exclude Glitter Heart Chain from Glam by ID
-- Created: 2026-07-03
-- Purpose: Remove retail_category_id from product ID 195
-- =====================================================

-- Remove retail_category_id from product ID 195
UPDATE products
SET retail_category_id = NULL
WHERE id = 195
AND is_active = true
AND deleted_at IS NULL;

-- Verify removal
SELECT 
  id,
  name,
  retail_category_id
FROM products
WHERE id = 195;
