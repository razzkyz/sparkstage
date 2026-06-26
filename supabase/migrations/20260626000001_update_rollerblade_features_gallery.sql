-- Migration: Update Rollerblade Features & Gallery Schema
-- Date: 2026-06-26
-- Changes:
--   1. Add "image" field to features (for background image)
--   2. Remove "category" field from gallery_items (not needed)

-- Step 1: Update features structure - add "image" field
UPDATE public.rollerblade_page_settings
SET features = jsonb_set(
  features,
  '{}',
  (
    SELECT jsonb_agg(
      feature || jsonb_build_object('image', '/images/rollerblade-feature-' || (feature->>'id') || '.jpg')
    )
    FROM jsonb_array_elements(features) AS feature
  )
)
WHERE NOT EXISTS (
  SELECT 1 
  FROM jsonb_array_elements(features) AS feature
  WHERE feature ? 'image'
);

-- Step 2: Update gallery_items structure - remove "category" field
UPDATE public.rollerblade_page_settings
SET gallery_items = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', item->>'id',
      'image', item->>'image',
      'caption', item->>'caption'
    )
  )
  FROM jsonb_array_elements(gallery_items) AS item
)
WHERE EXISTS (
  SELECT 1 
  FROM jsonb_array_elements(gallery_items) AS item
  WHERE item ? 'category'
);

-- Update comments for documentation
COMMENT ON COLUMN public.rollerblade_page_settings.features IS 'Array of feature objects with image (background), icon, title, description, and details array';
COMMENT ON COLUMN public.rollerblade_page_settings.gallery_items IS 'Array of gallery items with image and caption (category removed)';
