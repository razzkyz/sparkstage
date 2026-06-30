-- =====================================================
-- Migration: Auto-Backfill Product Categories
-- Created: 2026-06-30
-- Purpose: Mengisi otomatis kolom retail_category_id di tabel products
--          berdasarkan kategori lama, agar admin tidak perlu input manual.
--          Aman dieksekusi tanpa mengganggu production.
-- =====================================================

DO $$
DECLARE
    fashion_dept_id BIGINT;
    beauty_dept_id BIGINT;
    other_dept_id BIGINT;
BEGIN
    -- Pastikan ada kategori basic di retail_categories untuk menampung data lama
    -- 1. Fashion -> masuk ke department sparkclub
    INSERT INTO public.retail_categories (department, name, slug, is_active)
    VALUES ('sparkclub', 'Apparel / Fashion', 'sparkclub-apparel-auto', true)
    ON CONFLICT (slug) DO NOTHING;
    
    SELECT id INTO fashion_dept_id FROM public.retail_categories WHERE slug = 'sparkclub-apparel-auto' LIMIT 1;
    
    -- 2. Beauty -> masuk ke department glam
    INSERT INTO public.retail_categories (department, name, slug, is_active)
    VALUES ('glam', 'Beauty / Makeup', 'glam-beauty-auto', true)
    ON CONFLICT (slug) DO NOTHING;
    
    SELECT id INTO beauty_dept_id FROM public.retail_categories WHERE slug = 'glam-beauty-auto' LIMIT 1;
    
    -- 3. Other -> masuk ke department charmbar (sebagai general)
    INSERT INTO public.retail_categories (department, name, slug, is_active)
    VALUES ('charmbar', 'General / Other', 'charmbar-general-auto', true)
    ON CONFLICT (slug) DO NOTHING;
    
    SELECT id INTO other_dept_id FROM public.retail_categories WHERE slug = 'charmbar-general-auto' LIMIT 1;

    -- ==========================================
    -- AUTO BACKFILL PRODUCTS
    -- ==========================================
    
    -- Update produk Fashion (Kategori ID 1) yang belum punya retail_category
    UPDATE public.products p
    SET retail_category_id = fashion_dept_id
    FROM public.categories c
    WHERE p.category_id = c.id 
      AND c.slug = 'fashion'
      AND p.retail_category_id IS NULL;

    -- Update produk Beauty (Kategori ID 2) yang belum punya retail_category
    UPDATE public.products p
    SET retail_category_id = beauty_dept_id
    FROM public.categories c
    WHERE p.category_id = c.id 
      AND c.slug = 'beauty'
      AND p.retail_category_id IS NULL;

    -- Update produk Other (Kategori ID 3) yang belum punya retail_category
    UPDATE public.products p
    SET retail_category_id = other_dept_id
    FROM public.categories c
    WHERE p.category_id = c.id 
      AND c.slug = 'other'
      AND p.retail_category_id IS NULL;

    RAISE NOTICE 'Auto-backfill kategori produk selesai.';
END $$;
