-- Migration: Enable RLS and add policies for product_retail table
-- Date: 2026-06-02
-- Description:
--   Tabel product_retail dibuat tanpa RLS, sehingga frontend tidak bisa
--   membaca data melalui anon key. Migration ini:
--   1. Mengaktifkan RLS pada tabel product_retail
--   2. Menambahkan policy public SELECT untuk produk aktif
--   3. Menambahkan policy admin full access (INSERT, UPDATE, DELETE)

-- 1. Enable Row Level Security
ALTER TABLE public.product_retail ENABLE ROW LEVEL SECURITY;

-- 2. Public: Baca produk yang aktif (anon maupun authenticated)
CREATE POLICY "product_retail_select_public"
  ON public.product_retail
  FOR SELECT
  TO public
  USING (is_active = true);

-- 3. Admin: Full access (SELECT termasuk inactive, INSERT, UPDATE, DELETE)
CREATE POLICY "product_retail_admin_all"
  ON public.product_retail
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
