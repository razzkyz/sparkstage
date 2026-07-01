-- =====================================================
-- Fix Missing Charm Products in Indo Database
-- =====================================================
-- Purpose: Move all charm products to retail_category_id = 21 (LUCKY-CHARM)
-- Date: 2026-07-01
-- Issue: Some charm products not showing on web because wrong category
-- =====================================================

-- STEP 1: Backup current state
-- =====================================================
CREATE TEMP TABLE charm_backup AS
SELECT 
    pv.id,
    pv.product_id,
    p.name,
    pv.variant_name,
    p.retail_category_id,
    rc.name as retail_category_name
FROM product_variants pv
JOIN products p ON p.id = pv.product_id
LEFT JOIN retail_categories rc ON rc.id = p.retail_category_id
WHERE p.name ILIKE '%charm%' 
   OR pv.variant_name ILIKE '%charm%'
   OR rc.name ILIKE '%charm%';

-- Show current state
SELECT 
    retail_category_id,
    retail_category_name,
    COUNT(*) as product_count
FROM charm_backup
GROUP BY retail_category_id, retail_category_name
ORDER BY product_count DESC;

-- STEP 2: Find products that should be in Lucky Charm but aren't
-- =====================================================
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
AND p.retail_category_id != 21  -- Not already in Lucky Charm
GROUP BY p.id, p.name, p.retail_category_id, rc.name
ORDER BY variant_count DESC;

-- STEP 3: Move all charm products to Lucky Charm (retail_category_id = 21)
-- =====================================================
-- DRY RUN: See what will be updated
SELECT 
    p.id,
    p.name,
    p.retail_category_id as old_category_id,
    rc.name as old_category_name,
    21 as new_category_id,
    'LUCKY-CHARM' as new_category_name,
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
ORDER BY variant_count DESC;

-- UNCOMMENT BELOW TO EXECUTE THE UPDATE
-- =====================================================
/*
UPDATE products p
SET retail_category_id = 21
WHERE (
    p.name ILIKE '%charm%'
    OR EXISTS (
        SELECT 1 FROM product_variants pv2 
        WHERE pv2.product_id = p.id 
        AND pv2.variant_name ILIKE '%charm%'
    )
)
AND p.retail_category_id != 21;
*/

-- STEP 4: Verify final count
-- =====================================================
SELECT 
    rc.id,
    rc.name,
    COUNT(DISTINCT p.id) as product_count,
    COUNT(pv.id) as variant_count
FROM retail_categories rc
LEFT JOIN products p ON p.retail_category_id = rc.id
LEFT JOIN product_variants pv ON pv.product_id = p.id
WHERE rc.id = 21  -- Lucky Charm
GROUP BY rc.id, rc.name;

-- STEP 5: Find products with 'charm' in name but NOT in any charm category
-- =====================================================
SELECT 
    p.id,
    p.name,
    p.retail_category_id,
    rc.name as category_name,
    COUNT(pv.id) as variant_count,
    STRING_AGG(DISTINCT pv.variant_name, ', ') as variants
FROM products p
LEFT JOIN retail_categories rc ON rc.id = p.retail_category_id
LEFT JOIN product_variants pv ON pv.product_id = p.id
WHERE p.name ILIKE '%charm%'
AND (
    rc.name NOT ILIKE '%charm%' 
    OR rc.name IS NULL
)
GROUP BY p.id, p.name, p.retail_category_id, rc.name
ORDER BY variant_count DESC
LIMIT 50;

-- STEP 6: Summary report
-- =====================================================
WITH charm_stats AS (
    SELECT 
        CASE 
            WHEN p.retail_category_id = 21 THEN 'In Lucky Charm (21)'
            WHEN rc.name ILIKE '%charm%' THEN 'In Other Charm Category'
            ELSE 'Not in Charm Category'
        END as status,
        COUNT(DISTINCT p.id) as product_count,
        COUNT(pv.id) as variant_count
    FROM products p
    LEFT JOIN retail_categories rc ON rc.id = p.retail_category_id
    LEFT JOIN product_variants pv ON pv.product_id = p.id
    WHERE p.name ILIKE '%charm%'
       OR pv.variant_name ILIKE '%charm%'
    GROUP BY status
)
SELECT * FROM charm_stats
ORDER BY variant_count DESC;
