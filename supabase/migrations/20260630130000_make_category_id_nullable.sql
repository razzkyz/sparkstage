-- Remove the NOT NULL constraint from category_id in products table
-- This allows products to rely entirely on the new retail_category_id hierarchy
ALTER TABLE public.products ALTER COLUMN category_id DROP NOT NULL;
