-- =====================================================
-- STEP 2: Move All Charm Products to Lucky Charm (WRITE)
-- =====================================================
-- Run this AFTER reviewing analyze-missing-charms.sql results
-- This will UPDATE the database

-- Update all products with 'charm' in name to retail_category_id = 21
UPDATE products p
SET 
    retail_category_id = 21,
    updated_at = NOW()
WHERE (
    p.name ILIKE '%charm%'
    OR EXISTS (
        SELECT 1 FROM product_variants pv2 
        WHERE pv2.product_id = p.id 
        AND pv2.variant_name ILIKE '%charm%'
    )
)
AND p.retail_category_id != 21;

-- Verify the update
SELECT 
    'After Update - Lucky Charm Products' as info,
    COUNT(DISTINCT p.id) as product_count,
    COUNT(pv.id) as variant_count
FROM products p
LEFT JOIN product_variants pv ON pv.product_id = p.id
WHERE p.retail_category_id = 21;
