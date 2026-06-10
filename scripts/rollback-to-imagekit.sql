-- ============================================================================
-- ROLLBACK Script: R2 → ImageKit
-- ============================================================================
-- 
-- This script reverts the cutover and restores ImageKit URLs
-- Use this if something goes wrong after cutover
-- 
-- RESTORES:
--   provider: 'r2' → 'imagekit'
--   image_url: R2 URL → ImageKit URL (from backup column)
-- 
-- ============================================================================

BEGIN;

-- Step 1: Restore URLs from backup column
UPDATE product_images
SET 
  image_url = imagekit_backup_url,
  provider = 'imagekit',
  updated_at = NOW()
WHERE provider = 'r2'
  AND imagekit_backup_url IS NOT NULL;

-- Step 2: Verify rollback results
DO $$
DECLARE
  r2_count INTEGER;
  imagekit_count INTEGER;
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO r2_count FROM product_images WHERE provider = 'r2';
  SELECT COUNT(*) INTO imagekit_count FROM product_images WHERE provider = 'imagekit';
  SELECT COUNT(*) INTO total_count FROM product_images;
  
  RAISE NOTICE '================================================';
  RAISE NOTICE 'ROLLBACK VERIFICATION';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Total product images: %', total_count;
  RAISE NOTICE 'R2 provider: % (%.1%)', r2_count, (r2_count::FLOAT / total_count * 100);
  RAISE NOTICE 'ImageKit provider: % (%.1%)', imagekit_count, (imagekit_count::FLOAT / total_count * 100);
  RAISE NOTICE '================================================';
  
  IF imagekit_count > 2000 THEN
    RAISE NOTICE '✅ Rollback successful!';
  ELSE
    RAISE WARNING 'Rollback might be incomplete: only % ImageKit URLs restored', imagekit_count;
  END IF;
END $$;

-- Step 3: Show sample of restored URLs
SELECT 
  id,
  product_id,
  LEFT(image_url, 80) as restored_imagekit_url,
  provider
FROM product_images
WHERE provider = 'imagekit'
LIMIT 5;

-- ============================================================================
-- COMMIT or ROLLBACK
-- ============================================================================

-- Uncomment after reviewing results:
-- COMMIT;
-- ROLLBACK;
