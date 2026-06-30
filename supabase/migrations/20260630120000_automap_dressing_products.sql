-- =====================================================
-- Migration: Pindahkan Kategori ke Dressing & Auto-Map Produk
-- =====================================================

DO $$
DECLARE
  cat_name TEXT;
  new_slug TEXT;
  target_cat_id BIGINT;
  updated_count INT;
  total_updated INT := 0;
  
  -- Daftar kategori yang akan dipindahkan ke dressing
  target_cats TEXT[] := ARRAY[
    'Bag', 'belt', 'Boots', 'Headwear', 'Heels', 'Hoodie', 
    'Jeans', 'Maxi Dress', 'Maxi skirt', 'Mini dress', 
    'Mini skirt', 'Tie', 'Top'
  ];
BEGIN
  -- Loop melalui setiap kategori
  FOREACH cat_name IN ARRAY target_cats
  LOOP
    new_slug := 'dressing-' || replace(lower(cat_name), ' ', '-');
    
    -- 1. Cari apakah kategori ini sudah ada (mungkin di department sparkclub)
    SELECT id INTO target_cat_id FROM public.retail_categories 
    WHERE lower(name) = lower(cat_name) LIMIT 1;
    
    -- Jika sudah ada, update department-nya jadi dressing dan parent_id jadi NULL
    IF target_cat_id IS NOT NULL THEN
      UPDATE public.retail_categories
      SET department = 'dressing', parent_id = NULL, slug = new_slug
      WHERE id = target_cat_id;
    ELSE
      -- Jika belum ada, buat baru
      INSERT INTO public.retail_categories (department, name, slug, parent_id, is_active)
      VALUES ('dressing', cat_name, new_slug, NULL, true)
      RETURNING id INTO target_cat_id;
    END IF;

    -- 2. Auto-Map Produk yang TIDAK PUNYA kategori berdasarkan NAMA produk
    -- Misalnya: Produk bernama "Baggy Jeans" akan masuk ke kategori "Jeans"
    UPDATE public.products
    SET retail_category_id = target_cat_id
    WHERE retail_category_id IS NULL 
      AND name ILIKE '%' || cat_name || '%';
      
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    total_updated := total_updated + updated_count;
    
    IF updated_count > 0 THEN
      RAISE NOTICE 'Mapping % produk ke kategori %', updated_count, cat_name;
    END IF;
  END LOOP;

  RAISE NOTICE 'PROSES SELESAI: % produk tanpa kategori berhasil dipetakan ke department dressing.', total_updated;
END $$;

NOTIFY pgrst, 'reload schema';
