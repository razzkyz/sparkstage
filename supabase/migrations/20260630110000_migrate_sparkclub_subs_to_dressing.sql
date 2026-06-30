-- =====================================================
-- Migration: Migrate subcategories of 'Spark club' to 'dressing' department
-- Created: 2026-06-30
-- Purpose: 
--   1. Cari Kategori Utama bernama "Spark club"
--   2. Ambil semua sub-kategorinya (Bag, belt, Boots, dll)
--   3. Ubah sub-kategori tersebut menjadi Kategori Utama (parent_id = NULL) di department 'dressing'
--   4. Update produk yang terkait
-- =====================================================

DO $$
DECLARE
  spark_club_cat_id BIGINT;
  sub_record RECORD;
  updated_count INT;
  total_updated INT := 0;
BEGIN
  -- 1. Cari ID dari kategori utama "Spark club"
  SELECT id INTO spark_club_cat_id FROM public.retail_categories 
  WHERE lower(name) = 'spark club' OR slug = 'spark-club' 
  LIMIT 1;

  IF spark_club_cat_id IS NULL THEN
    RAISE EXCEPTION 'Kategori "Spark club" tidak ditemukan di database!';
  END IF;

  -- 2. Ambil semua subkategori yang berada di bawah "Spark club"
  FOR sub_record IN 
    SELECT id, name FROM public.retail_categories WHERE parent_id = spark_club_cat_id
  LOOP
    -- 3. Ubah subkategori ini menjadi Kategori Utama di department 'dressing'
    UPDATE public.retail_categories
    SET 
      department = 'dressing',
      parent_id = NULL
    WHERE id = sub_record.id;

    -- 4. Update semua produk yang tadinya menunjuk ke subkategori ini
    -- (Ubah retail_category_id menjadi sub_record.id, dan kosongkan retail_subcategory_id)
    UPDATE public.products
    SET 
      retail_category_id = sub_record.id,
      retail_subcategory_id = NULL
    WHERE retail_subcategory_id = sub_record.id;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    total_updated := total_updated + updated_count;
    
    RAISE NOTICE 'Memindahkan "%" menjadi Kategori Utama di Dressing beserta % produknya', sub_record.name, updated_count;
  END LOOP;

  -- (Opsional) Jika ada produk di "Spark club" yang tidak punya subkategori
  -- Kita bisa pindahkan ke kategori "Other" di dressing, atau biarkan saja.
  -- Saat ini kita hanya memproses produk yang ada di sub-kategori.

  RAISE NOTICE 'PROSES SELESAI: Total % produk berhasil dipindahkan.', total_updated;
END $$;

-- Force PostgREST schema reload
NOTIFY pgrst, 'reload schema';
