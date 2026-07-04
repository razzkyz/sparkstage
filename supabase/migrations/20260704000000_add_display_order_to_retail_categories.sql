-- =====================================================
-- Migration: Add display_order to retail_categories
-- Created: 2026-07-04
-- Purpose: Add display_order column to allow custom sorting of categories
-- =====================================================

-- Add display_order column
ALTER TABLE public.retail_categories 
ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 999;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_retail_categories_display_order 
ON public.retail_categories(display_order);

-- Add comment
COMMENT ON COLUMN public.retail_categories.display_order IS 'Display order for sorting categories (lower numbers appear first)';

-- Update existing categories with sequential display_order based on current ID
-- This preserves current order while allowing future customization
WITH ordered_categories AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY department, parent_id ORDER BY id) as row_num
  FROM public.retail_categories
)
UPDATE public.retail_categories rc
SET display_order = oc.row_num * 10
FROM ordered_categories oc
WHERE rc.id = oc.id;

-- Verification query
-- SELECT department, name, parent_id, display_order, is_active
-- FROM public.retail_categories
-- ORDER BY department, parent_id NULLS FIRST, display_order;
