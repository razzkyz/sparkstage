-- =====================================================
-- Migration: Add "service" department
-- Created: 2026-07-12
-- Purpose:
--   1. Tambah 'service' ke CHECK constraint pada retail_categories
--   2. Buat kategori default di department service
-- SAFE: Tidak menghapus data apapun, hanya menambah
-- =====================================================

-- STEP 1: Drop old CHECK constraint dan buat yang baru termasuk 'service'
ALTER TABLE public.retail_categories 
  DROP CONSTRAINT IF EXISTS retail_categories_department_check;

ALTER TABLE public.retail_categories 
  ADD CONSTRAINT retail_categories_department_check 
  CHECK (department IN ('glam', 'charmbar', 'sparkclub', 'dressing', 'shop', 'service'));

-- STEP 2: Buat kategori-kategori default untuk department service
INSERT INTO public.retail_categories (department, name, slug, parent_id, is_active)
VALUES
  ('service', 'Hair Service', 'service-hair-service', NULL, true),
  ('service', 'Nail Service', 'service-nail-service', NULL, true),
  ('service', 'Makeup Service', 'service-makeup-service', NULL, true),
  ('service', 'Lash & Brow', 'service-lash-brow', NULL, true),
  ('service', 'Other Service', 'service-other', NULL, true)
ON CONFLICT (slug) DO NOTHING;

-- Update comment
COMMENT ON TABLE public.retail_categories IS 'Retail product categories organized by department (glam, charmbar, sparkclub, dressing, shop, service)';

-- Force PostgREST schema reload
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- Verification Query (run after migration)
-- =====================================================

-- Show all departments and their category counts
-- SELECT 
--   department,
--   COUNT(*) as category_count,
--   COUNT(CASE WHEN parent_id IS NULL THEN 1 END) as main_categories,
--   COUNT(CASE WHEN parent_id IS NOT NULL THEN 1 END) as subcategories
-- FROM retail_categories
-- GROUP BY department
-- ORDER BY department;
