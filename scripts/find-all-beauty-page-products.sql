-- =====================================================
-- Find ALL products that show on /beauty page
-- Based on BeautyPage.tsx filter logic
-- =====================================================

-- BASE_MAKEUP_SLUGS from BeautyPage.tsx:
-- makeup, eyewear, glitter, headliner, popsocket, pop-socket, popsockets, body-glitter

-- Products that match BeautyPage filter:
-- 1. department = 'glam' (new system)
-- 2. categorySlug in BASE_MAKEUP_SLUGS
-- 3. name contains 'speckles' or 'patch'

SELECT 
  p.id,
  p.name,
  p.department,
  c.slug as category_slug,
  rc.name as retail_category_name,
  rc.department as retail_department,
  CASE 
    WHEN p.department = 'glam' THEN 'New: department=glam'
    WHEN c.slug IN ('makeup', 'eyewear', 'glitter', 'headliner', 'popsocket', 'pop-socket', 'popsockets', 'body-glitter') THEN 'Old: category slug match'
    WHEN LOWER(p.name) LIKE '%speckles%' OR LOWER(p.name) LIKE '%patch%' THEN 'Name: speckles/patch'
    ELSE 'Unknown match'
  END as match_reason
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN retail_categories rc ON p.retail_category_id = rc.id
WHERE p.is_active = true
  AND p.deleted_at IS NULL
  AND (
    -- Match 1: New department system
    p.department = 'glam'
    -- Match 2: Old category slugs
    OR c.slug IN (
      'makeup', 
      'eyewear', 
      'glitter', 
      'headliner', 
      'popsocket', 
      'pop-socket', 
      'popsockets', 
      'body-glitter'
    )
    -- Match 3: Name contains speckles or patch
    OR LOWER(p.name) LIKE '%speckles%'
    OR LOWER(p.name) LIKE '%patch%'
  )
ORDER BY match_reason, p.name;

-- Count by match reason
SELECT 
  CASE 
    WHEN p.department = 'glam' THEN 'New: department=glam'
    WHEN c.slug IN ('makeup', 'eyewear', 'glitter', 'headliner', 'popsocket', 'pop-socket', 'popsockets', 'body-glitter') THEN 'Old: category slug match'
    WHEN LOWER(p.name) LIKE '%speckles%' OR LOWER(p.name) LIKE '%patch%' THEN 'Name: speckles/patch'
    ELSE 'Unknown match'
  END as match_reason,
  COUNT(*) as product_count
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.is_active = true
  AND p.deleted_at IS NULL
  AND (
    p.department = 'glam'
    OR c.slug IN (
      'makeup', 
      'eyewear', 
      'glitter', 
      'headliner', 
      'popsocket', 
      'pop-socket', 
      'popsockets', 
      'body-glitter'
    )
    OR LOWER(p.name) LIKE '%speckles%'
    OR LOWER(p.name) LIKE '%patch%'
  )
GROUP BY match_reason
ORDER BY product_count DESC;

-- Total count
SELECT 
  'Total Beauty Page Products' as label,
  COUNT(*) as total
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.is_active = true
  AND p.deleted_at IS NULL
  AND (
    p.department = 'glam'
    OR c.slug IN (
      'makeup', 
      'eyewear', 
      'glitter', 
      'headliner', 
      'popsocket', 
      'pop-socket', 
      'popsockets', 
      'body-glitter'
    )
    OR LOWER(p.name) LIKE '%speckles%'
    OR LOWER(p.name) LIKE '%patch%'
  );
