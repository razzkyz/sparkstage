-- Migration: Convert promo package to array of sections
-- Date: 2026-07-15
-- Description: Allow multiple promo sections instead of single section

-- Step 1: Add new promo_sections column (array of promo objects)
ALTER TABLE public.onstage_page_settings
ADD COLUMN IF NOT EXISTS promo_sections JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Step 2: Migrate existing data to new structure
-- Convert current single promo to first item in promo_sections array
UPDATE public.onstage_page_settings
SET promo_sections = jsonb_build_array(
  jsonb_build_object(
    'id', gen_random_uuid()::text,
    'subtitle', promo_subtitle,
    'title', promo_title,
    'title_highlight', promo_title_highlight,
    'image_url', promo_image_url,
    'price', promo_price,
    'price_suffix', promo_price_suffix,
    'packages', promo_packages
  )
)
WHERE promo_sections = '[]'::jsonb;

-- Step 3: Drop old columns (optional - keep for backward compatibility for now)
-- We'll keep the old columns for now in case rollback is needed
-- Uncomment below to remove old columns after confirming migration works:
-- ALTER TABLE public.onstage_page_settings DROP COLUMN IF EXISTS promo_subtitle;
-- ALTER TABLE public.onstage_page_settings DROP COLUMN IF EXISTS promo_title;
-- ALTER TABLE public.onstage_page_settings DROP COLUMN IF EXISTS promo_title_highlight;
-- ALTER TABLE public.onstage_page_settings DROP COLUMN IF EXISTS promo_image_url;
-- ALTER TABLE public.onstage_page_settings DROP COLUMN IF EXISTS promo_price;
-- ALTER TABLE public.onstage_page_settings DROP COLUMN IF EXISTS promo_price_suffix;
-- ALTER TABLE public.onstage_page_settings DROP COLUMN IF EXISTS promo_packages;

-- Add comment
COMMENT ON COLUMN public.onstage_page_settings.promo_sections IS 'Array of promo sections - each section has subtitle, title, image, price, packages';

-- Migration complete
