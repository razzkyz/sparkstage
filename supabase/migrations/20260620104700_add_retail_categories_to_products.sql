-- =====================================================
-- Migration: Add retail categories to products
-- Created: 2026-06-20
-- Purpose: Enable hierarchical categorization (Department -> Category) 
--          for POS and Shop without breaking existing barcode and DOKU logic.
-- =====================================================

-- Add retail category foreign keys to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS retail_category_id BIGINT REFERENCES public.retail_categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS retail_subcategory_id BIGINT REFERENCES public.retail_categories(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_retail_category_id ON public.products(retail_category_id);
CREATE INDEX IF NOT EXISTS idx_products_retail_subcategory_id ON public.products(retail_subcategory_id);

-- Add comments for documentation
COMMENT ON COLUMN public.products.retail_category_id IS 'Foreign key to retail_categories table (Department -> Category)';
COMMENT ON COLUMN public.products.retail_subcategory_id IS 'Foreign key to retail_categories table (Sub-Category)';

-- Force PostgREST schema reload to make the new columns instantly available via API
NOTIFY pgrst, 'reload schema';
