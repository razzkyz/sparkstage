-- Check product image_url status
SELECT 
  COUNT(*) as total_products,
  COUNT(image_url) FILTER (WHERE image_url IS NOT NULL AND image_url != '') as has_image,
  COUNT(*) FILTER (WHERE image_url IS NULL OR image_url = '') as no_image
FROM products
WHERE is_active = true;

-- Show sample products with and without images
SELECT 
  id,
  name,
  CASE 
    WHEN image_url IS NULL OR image_url = '' THEN '❌ No Image'
    ELSE '✅ Has Image'
  END as image_status,
  LEFT(image_url, 80) as image_url_preview
FROM products
WHERE is_active = true
ORDER BY 
  CASE WHEN image_url IS NULL OR image_url = '' THEN 1 ELSE 0 END,
  name
LIMIT 20;
