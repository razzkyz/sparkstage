-- =====================================================
-- Migration: Update shop.GLAM Category Structure
-- Created: 2026-07-03
-- Purpose: Replace old glam categories with new SPARK MY structure
-- =====================================================

-- Step 1: Backup existing glam categories (for reference)
-- You can query this if you need to restore: SELECT * FROM retail_categories_backup;

-- Step 2: Delete old glam sample categories
-- (Makeup, Skincare, Haircare)
DELETE FROM public.retail_categories 
WHERE department = 'glam';

-- Step 3: Insert new GLAM category structure
-- Main Categories First (parent_id = NULL)

-- 1. SPARK MY FACE
INSERT INTO public.retail_categories (department, name, slug, parent_id, is_active)
VALUES ('glam', 'SPARK MY FACE', 'glam-spark-my-face', NULL, true);

-- 2. SPARK MY HAIR
INSERT INTO public.retail_categories (department, name, slug, parent_id, is_active)
VALUES ('glam', 'SPARK MY HAIR', 'glam-spark-my-hair', NULL, true);

-- 3. SPARK MY CHARMS
INSERT INTO public.retail_categories (department, name, slug, parent_id, is_active)
VALUES ('glam', 'SPARK MY CHARMS', 'glam-spark-my-charms', NULL, true);

-- 4. SPARK MY NAILS (no subcategories)
INSERT INTO public.retail_categories (department, name, slug, parent_id, is_active)
VALUES ('glam', 'SPARK MY NAILS', 'glam-spark-my-nails', NULL, true);

-- 5. SPARK MY STYLE
INSERT INTO public.retail_categories (department, name, slug, parent_id, is_active)
VALUES ('glam', 'SPARK MY STYLE', 'glam-spark-my-style', NULL, true);

-- Step 4: Insert Subcategories (with parent_id)

-- SPARK MY FACE Subcategories
INSERT INTO public.retail_categories (department, name, slug, parent_id, is_active)
SELECT 
  'glam',
  'STAR GLITTER',
  'glam-star-glitter',
  id,
  true
FROM public.retail_categories
WHERE department = 'glam' AND slug = 'glam-spark-my-face';

INSERT INTO public.retail_categories (department, name, slug, parent_id, is_active)
SELECT 
  'glam',
  'GLITTER TATTO',
  'glam-glitter-tatto',
  id,
  true
FROM public.retail_categories
WHERE department = 'glam' AND slug = 'glam-spark-my-face';

-- SPARK MY HAIR Subcategories
INSERT INTO public.retail_categories (department, name, slug, parent_id, is_active)
SELECT 
  'glam',
  'SPARKLE HAIR TINSEL',
  'glam-sparkle-hair-tinsel',
  id,
  true
FROM public.retail_categories
WHERE department = 'glam' AND slug = 'glam-spark-my-hair';

INSERT INTO public.retail_categories (department, name, slug, parent_id, is_active)
SELECT 
  'glam',
  'HAIR ACCESSORIES',
  'glam-hair-accessories',
  id,
  true
FROM public.retail_categories
WHERE department = 'glam' AND slug = 'glam-spark-my-hair';

-- SPARK MY CHARMS Subcategories
INSERT INTO public.retail_categories (department, name, slug, parent_id, is_active)
SELECT 
  'glam',
  name,
  slug,
  (SELECT id FROM public.retail_categories WHERE department = 'glam' AND slug = 'glam-spark-my-charms'),
  true
FROM (
  VALUES 
    ('CHARMS BASE', 'glam-charms-base'),
    ('WELDED CHARMS', 'glam-welded-charms'),
    ('PENDANT CHARMS', 'glam-pendant-charms'),
    ('KEYCHAINS', 'glam-keychains'),
    ('NECKLACES', 'glam-necklaces'),
    ('RINGS', 'glam-rings'),
    ('BRACELET', 'glam-bracelet'),
    ('BANGLES', 'glam-bangles')
) AS subcats(name, slug);

-- SPARK MY STYLE Subcategories
INSERT INTO public.retail_categories (department, name, slug, parent_id, is_active)
SELECT 
  'glam',
  name,
  slug,
  (SELECT id FROM public.retail_categories WHERE department = 'glam' AND slug = 'glam-spark-my-style'),
  true
FROM (
  VALUES 
    ('FASHION', 'glam-fashion'),
    ('BAG', 'glam-bag'),
    ('EYEWEAR', 'glam-eyewear'),
    ('SCARVES', 'glam-scarves'),
    ('BELTS', 'glam-belts'),
    ('ARM SLEEVES', 'glam-arm-sleeves')
) AS subcats(name, slug);

-- =====================================================
-- Verification Query
-- =====================================================

-- Uncomment to run verification after migration:
-- SELECT 
--   c.id,
--   c.name AS category,
--   COALESCE(p.name, '-') AS parent_category,
--   c.slug,
--   c.is_active
-- FROM public.retail_categories c
-- LEFT JOIN public.retail_categories p ON c.parent_id = p.id
-- WHERE c.department = 'glam'
-- ORDER BY 
--   COALESCE(c.parent_id, c.id),
--   c.parent_id NULLS FIRST,
--   c.name;

-- =====================================================
-- Summary
-- =====================================================

-- Total categories created:
-- - 5 main categories
-- - 18 subcategories
-- = 23 total categories for glam department

COMMENT ON TABLE public.retail_categories IS 'Retail categories - GLAM structure updated 2026-07-03';
