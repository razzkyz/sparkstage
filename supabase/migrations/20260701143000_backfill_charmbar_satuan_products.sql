-- =====================================================
-- Migration: Backfill Charmbar Products (Satuan / Uncategorized)
-- Created: 2026-07-01
-- Purpose: Assign semua produk yang retail_category_id IS NULL
--          ke kategori charmbar 'Satuan Charm' agar muncul
--          saat filter department = charmbar di Store Inventory.
--
-- AMAN: Hanya menyentuh produk yang retail_category_id IS NULL.
--       Tidak mengubah produk yang sudah punya retail_category_id.
-- =====================================================

DO $$
DECLARE
    charmbar_satuan_id BIGINT;
    charmbar_general_id BIGINT;
    updated_count INT;
BEGIN
    -- -----------------------------------------------
    -- Step 1: Pastikan kategori 'Satuan Charm' ada di charmbar
    -- (untuk produk charm individual / satuan)
    -- -----------------------------------------------
    INSERT INTO public.retail_categories (department, name, slug, is_active)
    VALUES ('charmbar', 'Satuan Charm', 'charmbar-satuan-charm', true)
    ON CONFLICT (slug) DO NOTHING;

    SELECT id INTO charmbar_satuan_id
    FROM public.retail_categories
    WHERE slug = 'charmbar-satuan-charm'
    LIMIT 1;

    -- -----------------------------------------------
    -- Step 2: Pastikan fallback 'General / Other' charmbar juga ada
    -- (untuk produk non-fashion/non-beauty yang bukan charm satuan)
    -- -----------------------------------------------
    INSERT INTO public.retail_categories (department, name, slug, is_active)
    VALUES ('charmbar', 'General / Other', 'charmbar-general-auto', true)
    ON CONFLICT (slug) DO NOTHING;

    SELECT id INTO charmbar_general_id
    FROM public.retail_categories
    WHERE slug = 'charmbar-general-auto'
    LIMIT 1;

    -- -----------------------------------------------
    -- Step 3: PREVIEW — tampilkan berapa produk yang akan diupdate
    -- -----------------------------------------------
    SELECT COUNT(*) INTO updated_count
    FROM public.products
    WHERE deleted_at IS NULL
      AND retail_category_id IS NULL;

    RAISE NOTICE '================================================';
    RAISE NOTICE 'PREVIEW: Jumlah produk dengan retail_category_id NULL: %', updated_count;
    RAISE NOTICE 'Target kategori: charmbar / Satuan Charm (id: %)', charmbar_satuan_id;
    RAISE NOTICE '================================================';

    -- -----------------------------------------------
    -- Step 4: UPDATE — assign semua produk NULL ke Satuan Charm (charmbar)
    -- Ini mencakup produk yang:
    --   a) category_id IS NULL (tidak punya kategori lama sama sekali)
    --   b) category_id ada tapi belum di-backfill (misal category lain)
    -- -----------------------------------------------
    UPDATE public.products
    SET
        retail_category_id = charmbar_satuan_id,
        updated_at = NOW()
    WHERE deleted_at IS NULL
      AND retail_category_id IS NULL;

    GET DIAGNOSTICS updated_count = ROW_COUNT;

    RAISE NOTICE 'Berhasil mengupdate % produk ke charmbar / Satuan Charm', updated_count;
    RAISE NOTICE 'Backfill charmbar satuan selesai.';
END $$;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
