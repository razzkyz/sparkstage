-- Migration: Add category_id column to product_retail
-- Date: 2026-06-02
-- Description:
--   Kolom category_id tidak ikut terbuat saat CREATE TABLE karena migration awal
--   sudah di-push sebelum kolom ini ditambahkan secara lokal.
--   Migration ini menambahkan kolom tersebut ke tabel yang sudah ada di remote.

ALTER TABLE public.product_retail
ADD COLUMN IF NOT EXISTS category_id BIGINT REFERENCES public.categories(id) ON DELETE SET NULL;

-- Index untuk mempercepat filter/join berdasarkan kategori
CREATE INDEX IF NOT EXISTS idx_product_retail_category_id ON public.product_retail(category_id);
