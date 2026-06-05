-- ============================================
-- Migration: Create Retail Categories Hierarchy
-- Description: Creates the new retail_categories table to cleanly separate 
--              Glam, Charm Bar, and Spark Club sub-categories, without breaking legacy categories.
-- ============================================

CREATE TABLE public.retail_categories (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  department VARCHAR(50) NOT NULL CHECK (department IN ('glam', 'charmbar', 'sparkclub')),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  parent_id BIGINT REFERENCES public.retail_categories(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries on department and parent
CREATE INDEX idx_retail_categories_dept ON public.retail_categories(department);
CREATE INDEX idx_retail_categories_parent ON public.retail_categories(parent_id);

-- Add the new column to product_retail
ALTER TABLE public.product_retail
ADD COLUMN retail_subcategory_id BIGINT REFERENCES public.retail_categories(id) ON DELETE SET NULL;
