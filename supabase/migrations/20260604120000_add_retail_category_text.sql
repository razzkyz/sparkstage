-- ============================================
-- Migration: Add retail_category to product_retail
-- Description: Adds a simple text-based category column and allows dropping the legacy category_id
-- ============================================

-- Step 1: Add the new text-based category column
ALTER TABLE public.product_retail 
ADD COLUMN IF NOT EXISTS retail_category VARCHAR(50);

-- Step 2: Add a check constraint to ensure only the 3 allowed categories can be inputted
-- If an admin tries to input anything else, the database will reject it, keeping data clean.
ALTER TABLE public.product_retail
ADD CONSTRAINT check_retail_category 
CHECK (retail_category IN ('glam', 'charmbar', 'sparkclub'));

-- Step 3: Migrate existing data based on the old category_id (Best effort)
-- We map old category names/slugs to our new 3 main categories.
UPDATE public.product_retail pr
SET retail_category = 
  CASE 
    WHEN c.slug ILIKE '%charm%' OR c.slug ILIKE '%bracelet%' OR c.slug ILIKE '%necklace%' OR c.slug ILIKE '%bangle%' THEN 'charmbar'
    WHEN c.slug ILIKE '%glam%' OR c.slug ILIKE '%makeup%' OR c.slug ILIKE '%glitter%' THEN 'glam'
    ELSE 'sparkclub' -- Default for the rest
  END
FROM public.categories c
WHERE pr.category_id = c.id;

-- Make it required now that we've populated it (optional, but good for data integrity)
-- ALTER TABLE public.product_retail ALTER COLUMN retail_category SET NOT NULL;
