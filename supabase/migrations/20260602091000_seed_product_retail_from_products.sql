-- Migration: Seed product_retail from products (exclude Dressing Room)
-- Date: 2026-06-02
-- Description:
--   Copy data from public.products (and related tables) to public.product_retail,
--   excluding any product whose category slug is 'dressing-room'.
--
--   Column mapping:
--     product_retail.name        ← products.name
--     product_retail.slug        ← products.slug
--     product_retail.description ← products.description
--     product_retail.category_id ← products.category_id
--     product_retail.price       ← MIN active variant price (product_variants.price)
--     product_retail.stock       ← SUM of (stock - reserved_stock) across active variants
--     product_retail.weight      ← DEFAULT 0  (tidak ada di products, harus diisi manual)
--     product_retail.image       ← URL gambar primary dari product_images
--     product_retail.is_active   ← products.is_active
--     product_retail.created_at  ← products.created_at
--     product_retail.updated_at  ← products.updated_at
--
-- CATATAN PENTING:
--   - Kolom `weight`, `length`, `width`, `height` di product_retail TIDAK ADA
--     di tabel products. Semua akan di-default ke 0 / NULL.
--   - Anda harus mengisi kolom weight secara manual setelah migrasi ini berjalan.
--   - Query ini bersifat idempotent: menggunakan ON CONFLICT (slug) DO NOTHING
--     sehingga aman dijalankan berulang kali.

INSERT INTO public.product_retail (
  name,
  slug,
  description,
  category_id,
  price,
  stock,
  weight,
  length,
  width,
  height,
  image,
  is_active,
  created_at,
  updated_at
)
SELECT
  p.name,
  p.slug,
  p.description,

  -- category_id: gunakan langsung dari products (FK ke public.categories)
  p.category_id,

  -- price: ambil harga terendah dari varian aktif yang belum dihapus
  COALESCE(
    (
      SELECT MIN(pv.price)
      FROM public.product_variants pv
      WHERE pv.product_id = p.id
        AND pv.is_active = true
        AND pv.price IS NOT NULL
        AND pv.price >= 0
    ),
    0
  )::NUMERIC(12, 2),

  -- stock: total stok tersedia dari semua varian aktif (stock - reserved_stock)
  COALESCE(
    (
      SELECT SUM(GREATEST(pv.stock - COALESCE(pv.reserved_stock, 0), 0))
      FROM public.product_variants pv
      WHERE pv.product_id = p.id
        AND pv.is_active = true
    ),
    0
  )::INTEGER,

  -- weight: tidak tersedia di tabel products, default ke 0 (harus diisi manual!)
  0,

  -- Dimensi: tidak tersedia, di-set NULL
  NULL, -- length
  NULL, -- width
  NULL, -- height

  -- image: ambil URL gambar primary; jika tidak ada, ambil yang display_order paling kecil
  (
    SELECT pi.image_url
    FROM public.product_images pi
    WHERE pi.product_id = p.id
    ORDER BY
      (pi.is_primary = true) DESC,
      pi.display_order ASC
    LIMIT 1
  ),

  p.is_active,
  p.created_at,
  p.updated_at

FROM public.products p
INNER JOIN public.categories c ON c.id = p.category_id

WHERE
  -- Hanya produk yang belum dihapus (soft delete)
  p.deleted_at IS NULL
  -- Kecualikan kategori Dressing Room dan semua sub-kategorinya di tabel categories
  AND c.slug != 'dressing-room'
  -- Juga kecualikan berdasarkan parent category slug (jika ada hierarki kategori)
  AND NOT EXISTS (
    SELECT 1
    FROM public.categories parent_c
    WHERE parent_c.id = c.parent_id
      AND parent_c.slug = 'dressing-room'
  )

-- Idempotent: jika slug sudah ada di product_retail, lewati
ON CONFLICT (slug) DO NOTHING;

-- Verifikasi hasil seeding
DO $$
DECLARE
  v_inserted_count  INT;
  v_skipped_dr      INT;
  v_total_products  INT;
BEGIN
  SELECT COUNT(*) INTO v_inserted_count FROM public.product_retail;

  SELECT COUNT(*) INTO v_skipped_dr
  FROM public.products p
  INNER JOIN public.categories c ON c.id = p.category_id
  WHERE p.deleted_at IS NULL
    AND c.slug = 'dressing-room';

  SELECT COUNT(*) INTO v_total_products
  FROM public.products p
  WHERE p.deleted_at IS NULL;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Seeding product_retail SELESAI';
  RAISE NOTICE '- Total products (aktif): %', v_total_products;
  RAISE NOTICE '- Dilewati (Dressing Room): %', v_skipped_dr;
  RAISE NOTICE '- Total data di product_retail: %', v_inserted_count;
  RAISE NOTICE '';
  RAISE NOTICE 'PERHATIAN: Kolom weight masih 0 untuk semua produk.';
  RAISE NOTICE '           Harap isi kolom weight secara manual sesuai berat produk (gram).';
  RAISE NOTICE '========================================';
END $$;
