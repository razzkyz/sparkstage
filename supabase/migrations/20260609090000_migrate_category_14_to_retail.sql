-- =====================================================
-- ULTRA-SAFE MIGRATION: Category ID 14 → product_retail
-- Date: 2026-06-09
-- Description: Migrate products with category_id = 14 to product_retail
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '╔════════════════════════════════════════════════════╗';
  RAISE NOTICE '║   CATEGORY 14 PRODUCTS MIGRATION (ULTRA-SAFE)      ║';
  RAISE NOTICE '║   This script ONLY reads from products table       ║';
  RAISE NOTICE '║   and writes to product_retail (new table)         ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- PART 1: PRE-FLIGHT SAFETY CHECKS
-- =====================================================

-- Check 1: Verify product_retail table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'product_retail'
  ) THEN
    RAISE EXCEPTION '❌ ABORT: Table product_retail does not exist!';
  END IF;
  RAISE NOTICE '✅ Check 1/5: Table product_retail exists';
END $$;

-- Check 2: Verify category 14 exists and show details
DO $$
DECLARE
  category_exists BOOLEAN;
  category_info RECORD;
BEGIN
  SELECT EXISTS (SELECT 1 FROM categories WHERE id = 14) INTO category_exists;
  
  IF NOT category_exists THEN
    RAISE EXCEPTION '❌ ABORT: Category ID 14 not found!';
  END IF;
  
  -- Show category details
  SELECT id, name, slug INTO category_info FROM categories WHERE id = 14;
  RAISE NOTICE '✅ Check 2/5: Found category - ID: %, Name: %, Slug: %', 
    category_info.id, category_info.name, category_info.slug;
END $$;

-- Check 3: Count products to migrate (including inactive)
DO $$
DECLARE
  product_count INT;
  variant_count INT;
BEGIN
  -- Count ALL products in category 14
  SELECT COUNT(DISTINCT p.id) INTO product_count
  FROM products p
  WHERE p.category_id = 14;
  
  -- Count ALL variants (active or inactive)
  SELECT COUNT(*) INTO variant_count
  FROM products p
  INNER JOIN product_variants pv ON pv.product_id = p.id
  WHERE p.category_id = 14;
  
  IF product_count = 0 THEN
    RAISE EXCEPTION '❌ ABORT: No products found in category 14!';
  END IF;
  
  IF variant_count = 0 THEN
    RAISE EXCEPTION '❌ ABORT: Found % products but NO variants!', product_count;
  END IF;
  
  RAISE NOTICE '✅ Check 3/5: Found % products with % variants to migrate (including inactive)', 
    product_count, variant_count;
END $$;

-- Check 4: Detect potential slug conflicts
DO $$
DECLARE
  conflict_count INT;
BEGIN
  SELECT COUNT(*) INTO conflict_count
  FROM (
    SELECT 
      CASE 
        WHEN pv.sku IS NOT NULL AND pv.sku != ''
        THEN p.slug || '-' || LOWER(REPLACE(REPLACE(pv.sku, ' ', '-'), '/', '-')) || '-retail'
        ELSE p.slug || '-var-' || pv.id || '-retail'
      END as new_slug
    FROM products p
    INNER JOIN product_variants pv ON pv.product_id = p.id
    WHERE p.category_id = 14
  ) potential_slugs
  WHERE EXISTS (
    SELECT 1 FROM product_retail pr 
    WHERE pr.slug = potential_slugs.new_slug
  );
  
  IF conflict_count > 0 THEN
    RAISE WARNING '⚠️  Check 4/5: Found % slug conflicts - will be skipped (ON CONFLICT DO NOTHING)', 
      conflict_count;
  ELSE
    RAISE NOTICE '✅ Check 4/5: No slug conflicts detected';
  END IF;
END $$;

-- Check 5: Estimate migration size
DO $$
DECLARE
  total_rows INT;
  estimated_size TEXT;
BEGIN
  SELECT COUNT(*) INTO total_rows
  FROM products p
  INNER JOIN product_variants pv ON pv.product_id = p.id
  WHERE p.category_id = 14;
  
  estimated_size := pg_size_pretty((total_rows * 1024)::bigint);
  
  RAISE NOTICE '✅ Check 5/5: Will insert ~% rows (~% data)', total_rows, estimated_size;
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════';
  RAISE NOTICE '   ALL PRE-FLIGHT CHECKS PASSED ✅';
  RAISE NOTICE '   Safe to proceed with migration';
  RAISE NOTICE '════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- PART 2: BACKUP EXISTING DATA (if any)
-- =====================================================

DO $$
DECLARE
  existing_count INT;
BEGIN
  SELECT COUNT(*) INTO existing_count FROM product_retail;
  
  IF existing_count > 0 THEN
    RAISE NOTICE '📦 Creating backup: product_retail_backup_%', TO_CHAR(NOW(), 'YYYYMMDD_HH24MISS');
    
    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS product_retail_backup_%s AS SELECT * FROM product_retail',
      TO_CHAR(NOW(), 'YYYYMMDD_HH24MISS')
    );
    
    RAISE NOTICE '✅ Backup created with % existing rows', existing_count;
  ELSE
    RAISE NOTICE '✅ No existing data in product_retail - backup not needed';
  END IF;
END $$;

-- =====================================================
-- PART 3: MIGRATION (SAFE INSERT with SKIP DUPLICATES)
-- =====================================================

DO $$
DECLARE
  inserted_count INT;
  skipped_count INT;
  start_time TIMESTAMP;
  end_time TIMESTAMP;
BEGIN
  start_time := clock_timestamp();
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Starting migration...';
  RAISE NOTICE '';
  
  -- Execute migration
  WITH inserted AS (
    INSERT INTO product_retail (
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
      -- Name: Product + Variant
      CASE 
        WHEN pv.name IS NOT NULL AND pv.name != '' 
        THEN p.name || ' - ' || pv.name
        ELSE p.name
      END as name,
      
      -- Slug: unique with SKU or variant ID
      CASE 
        WHEN pv.sku IS NOT NULL AND pv.sku != ''
        THEN p.slug || '-' || LOWER(REPLACE(REPLACE(pv.sku, ' ', '-'), '/', '-')) || '-retail'
        ELSE p.slug || '-var-' || pv.id || '-retail'
      END as slug,
      
      -- Description: with attributes if available
      CASE 
        WHEN pv.attributes IS NOT NULL AND pv.attributes::text != '{}' 
        THEN COALESCE(p.description, '') || E'\n\n📋 Spesifikasi:\n' || 
             (SELECT string_agg(key || ': ' || value, E'\n') 
              FROM json_each_text(pv.attributes))
        ELSE p.description
      END as description,
      
      p.category_id,
      COALESCE(pv.price, 0) as price,
      COALESCE(pv.stock, 0) as stock,
      0 as weight, -- product_variants doesn't have weight column
      NULL as length,
      NULL as width,
      NULL as height,
      
      -- Image: prefer primary from product_images
      COALESCE(
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1),
        p.image_url
      ) as image,
      
      (p.is_active AND pv.is_active) as is_active,
      p.created_at,
      GREATEST(p.updated_at, pv.updated_at) as updated_at
      
    FROM products p
    INNER JOIN product_variants pv ON pv.product_id = p.id
    WHERE p.category_id = 14
    ORDER BY p.id, pv.id
    
    -- SKIP DUPLICATES (safety feature)
    ON CONFLICT (slug) DO NOTHING
    
    RETURNING id
  )
  SELECT COUNT(*) INTO inserted_count FROM inserted;
  
  -- Calculate skipped count
  SELECT 
    COUNT(*) - inserted_count INTO skipped_count
  FROM products p
  INNER JOIN product_variants pv ON pv.product_id = p.id
  WHERE p.category_id = 14;
  
  end_time := clock_timestamp();
  
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE '   Rows inserted: %', inserted_count;
  RAISE NOTICE '   Rows skipped (duplicates): %', GREATEST(skipped_count, 0);
  RAISE NOTICE '   Duration: % ms', EXTRACT(MILLISECONDS FROM (end_time - start_time));
  RAISE NOTICE '';
END $$;

-- =====================================================
-- PART 4: POST-MIGRATION VERIFICATION
-- =====================================================

DO $$
DECLARE
  total_migrated INT;
  active_count INT;
  inactive_count INT;
  avg_price NUMERIC;
  total_stock BIGINT;
  zero_price_count INT;
  zero_stock_count INT;
  no_image_count INT;
BEGIN
  RAISE NOTICE '📊 POST-MIGRATION VERIFICATION:';
  RAISE NOTICE '════════════════════════════════════════════════════';
  
  -- Summary stats
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE is_active = true),
    COUNT(*) FILTER (WHERE is_active = false),
    ROUND(AVG(price), 2),
    SUM(stock),
    COUNT(*) FILTER (WHERE price = 0),
    COUNT(*) FILTER (WHERE stock = 0),
    COUNT(*) FILTER (WHERE image IS NULL OR image = '')
  INTO 
    total_migrated,
    active_count,
    inactive_count,
    avg_price,
    total_stock,
    zero_price_count,
    zero_stock_count,
    no_image_count
  FROM product_retail
  WHERE slug LIKE '%-retail';
  
  RAISE NOTICE '✅ Total products migrated: %', total_migrated;
  RAISE NOTICE '   Active: % | Inactive: %', active_count, inactive_count;
  RAISE NOTICE '   Average price: Rp %', avg_price;
  RAISE NOTICE '   Total stock: % units', total_stock;
  RAISE NOTICE '';
  
  -- Data quality warnings
  IF zero_price_count > 0 THEN
    RAISE WARNING '⚠️  Found % products with zero price', zero_price_count;
  END IF;
  
  IF zero_stock_count > 0 THEN
    RAISE NOTICE 'ℹ️  Found % products with zero stock (may be intentional)', zero_stock_count;
  END IF;
  
  IF no_image_count > 0 THEN
    RAISE WARNING '⚠️  Found % products without images', no_image_count;
  END IF;
  
  RAISE NOTICE '════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- PART 5: SAMPLE DATA PREVIEW
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '📋 SAMPLE MIGRATED DATA (First 5 rows):';
  RAISE NOTICE '════════════════════════════════════════════════════';
END $$;

SELECT 
  id,
  LEFT(name, 40) as name,
  LEFT(slug, 50) as slug,
  price,
  stock,
  weight,
  is_active
FROM product_retail
WHERE slug LIKE '%-retail'
ORDER BY id DESC
LIMIT 5;

-- =====================================================
-- PART 6: PRICE DISTRIBUTION ANALYSIS
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '💰 PRICE DISTRIBUTION:';
  RAISE NOTICE '════════════════════════════════════════════════════';
END $$;

SELECT 
  CASE 
    WHEN price < 50000 THEN '< 50k'
    WHEN price >= 50000 AND price < 100000 THEN '50k - 100k'
    WHEN price >= 100000 AND price < 200000 THEN '100k - 200k'
    WHEN price >= 200000 AND price < 500000 THEN '200k - 500k'
    ELSE '≥ 500k'
  END as price_range,
  COUNT(*) as products,
  SUM(stock) as total_stock,
  TO_CHAR(ROUND(AVG(price), 0), 'FM999,999,999') || ' IDR' as avg_price
FROM product_retail
WHERE slug LIKE '%-retail'
GROUP BY 
  CASE 
    WHEN price < 50000 THEN '< 50k'
    WHEN price >= 50000 AND price < 100000 THEN '50k - 100k'
    WHEN price >= 100000 AND price < 200000 THEN '100k - 200k'
    WHEN price >= 200000 AND price < 500000 THEN '200k - 500k'
    ELSE '≥ 500k'
  END
ORDER BY MIN(price);

-- =====================================================
-- PART 7: FINAL SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════╗';
  RAISE NOTICE '║         ✅ MIGRATION COMPLETED SUCCESSFULLY        ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Next Steps:';
  RAISE NOTICE '   1. Review the sample data above';
  RAISE NOTICE '   2. Check data quality warnings (if any)';
  RAISE NOTICE '   3. Test query: SELECT * FROM product_retail WHERE slug LIKE ''%-retail''';
  RAISE NOTICE '   4. Update frontend to consume product_retail table';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Rollback (if needed):';
  RAISE NOTICE '   DELETE FROM product_retail WHERE slug LIKE ''%-retail'';';
  RAISE NOTICE '';
END $$;
