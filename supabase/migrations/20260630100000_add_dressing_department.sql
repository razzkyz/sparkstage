-- =====================================================
-- Migration: Add "dressing" department
-- Created: 2026-06-30
-- Purpose: 
--   1. Tambah 'dressing' ke CHECK constraint pada retail_categories
--   2. Buat kategori default di department dressing
--   3. Pindahkan semua produk dari categories lama (Fashion/Beauty/Other) 
--      ke department dressing
-- SAFE: Tidak menghapus data apapun, hanya menambah & mengupdate
-- =====================================================

-- STEP 1: Drop old CHECK constraint dan buat yang baru termasuk 'dressing'
ALTER TABLE public.retail_categories 
  DROP CONSTRAINT IF EXISTS retail_categories_department_check;

ALTER TABLE public.retail_categories 
  ADD CONSTRAINT retail_categories_department_check 
  CHECK (department IN ('glam', 'charmbar', 'sparkclub', 'dressing'));

-- STEP 2: Buat kategori-kategori default untuk department dressing
-- Sesuaikan nama kategori ini dengan kebutuhan Anda
INSERT INTO public.retail_categories (department, name, slug, parent_id, is_active)
VALUES
  ('dressing', 'Fashion', 'dressing-fashion', NULL, true),
  ('dressing', 'Beauty', 'dressing-beauty', NULL, true),
  ('dressing', 'Other', 'dressing-other', NULL, true)
ON CONFLICT (slug) DO NOTHING;

-- STEP 3: Auto-backfill - pindahkan produk dari categories lama ke dressing
-- Produk yang category_id-nya menunjuk ke "fashion" → dressing-fashion
DO $$
DECLARE
  dressing_fashion_id BIGINT;
  dressing_beauty_id BIGINT;
  dressing_other_id BIGINT;
  updated_fashion INT;
  updated_beauty INT;
  updated_other INT;
BEGIN
  SELECT id INTO dressing_fashion_id FROM public.retail_categories WHERE slug = 'dressing-fashion' LIMIT 1;
  SELECT id INTO dressing_beauty_id FROM public.retail_categories WHERE slug = 'dressing-beauty' LIMIT 1;
  SELECT id INTO dressing_other_id FROM public.retail_categories WHERE slug = 'dressing-other' LIMIT 1;

  -- Update produk Fashion → dressing
  UPDATE public.products p
  SET retail_category_id = dressing_fashion_id
  FROM public.categories c
  WHERE p.category_id = c.id 
    AND c.slug = 'fashion'
    AND (p.retail_category_id IS NULL OR p.retail_category_id = dressing_fashion_id);
  GET DIAGNOSTICS updated_fashion = ROW_COUNT;

  -- Update produk Beauty → dressing
  UPDATE public.products p
  SET retail_category_id = dressing_beauty_id
  FROM public.categories c
  WHERE p.category_id = c.id 
    AND c.slug = 'beauty'
    AND (p.retail_category_id IS NULL OR p.retail_category_id = dressing_beauty_id);
  GET DIAGNOSTICS updated_beauty = ROW_COUNT;

  -- Update produk Other → dressing
  UPDATE public.products p
  SET retail_category_id = dressing_other_id
  FROM public.categories c
  WHERE p.category_id = c.id 
    AND c.slug = 'other'
    AND (p.retail_category_id IS NULL OR p.retail_category_id = dressing_other_id);
  GET DIAGNOSTICS updated_other = ROW_COUNT;

  RAISE NOTICE 'Backfill selesai: Fashion=%, Beauty=%, Other=%', updated_fashion, updated_beauty, updated_other;
END $$;

-- Update comment
COMMENT ON TABLE public.retail_categories IS 'Retail product categories organized by department (glam, charmbar, sparkclub, dressing)';

-- Force PostgREST schema reload
NOTIFY pgrst, 'reload schema';
