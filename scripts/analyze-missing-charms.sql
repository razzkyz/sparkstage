-- =====================================================
-- STEP 1: Analyze Missing Charm Products (READ ONLY)
-- =====================================================
-- Run this in Supabase Dashboard SQL Editor first
-- https://supabase.com/dashboard/project/hogzjapnkvsihvvbgcdb/sql

-- Current Lucky Charm count
SELECT 
    'Current Lucky Charm Products' as info,
    COUNT(DISTINCT p.id) as product_count,
    COUNT(pv.id) as variant_count
FROM products p
LEFT JOIN product_variants pv ON pv.product_id = p.id
WHERE p.retail_category_id = 21;

-- Find products with 'charm' in name but NOT in Lucky Charm category
SELECT 
    p.id,
    p.name,
    p.retail_category_id,
    rc.name as current_category,
    COUNT(pv.id) as variant_count
FROM products p
LEFT JOIN retail_categories rc ON rc.id = p.retail_category_id
LEFT JOIN product_variants pv ON pv.product_id = p.id
WHERE (
    p.name ILIKE '%charm%'
    OR EXISTS (
        SELECT 1 FROM product_variants pv2 
        WHERE pv2.product_id = p.id 
        AND pv2.variant_name ILIKE '%charm%'
    )
)
AND p.retail_category_id != 21
GROUP BY p.id, p.name, p.retail_category_id, rc.name
ORDER BY variant_count DESC
LIMIT 100;

-- Summary by category
SELECT 
    p.retail_category_id,
    rc.name as category_name,
    COUNT(DISTINCT p.id) as product_count,
    COUNT(pv.id) as variant_count
FROM products p
LEFT JOIN retail_categories rc ON rc.id = p.retail_category_id
LEFT JOIN product_variants pv ON pv.product_id = p.id
WHERE (
    p.name ILIKE '%charm%'
    OR EXISTS (
        SELECT 1 FROM product_variants pv2 
        WHERE pv2.product_id = p.id 
        AND pv2.variant_name ILIKE '%charm%'
    )
)
GROUP BY p.retail_category_id, rc.name
ORDER BY variant_count DESC;
