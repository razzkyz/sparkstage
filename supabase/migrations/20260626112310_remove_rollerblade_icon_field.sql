-- Migration: Remove icon field from rollerblade features
-- Date: 2026-06-26
-- Description: Remove unused "icon" field from features array in rollerblade_page_settings

-- Step 1: Remove "icon" field from all feature objects in the features array
UPDATE public.rollerblade_page_settings
SET features = (
  SELECT jsonb_agg(
    feature - 'icon'  -- Remove the "icon" key from each feature object
  )
  FROM jsonb_array_elements(features) AS feature
)
WHERE features IS NOT NULL;

-- Step 2: Update documentation comments
COMMENT ON COLUMN public.rollerblade_page_settings.features IS 'Array of feature objects with image (background), title, description, and details array';

-- Migration complete: icon field removed from features
