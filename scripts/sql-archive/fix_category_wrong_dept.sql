-- Fix: Category "one set" tersimpan salah di dept='glam', harusnya 'dressing'
-- Jalankan di Supabase SQL Editor sebagai service_role

UPDATE public.retail_categories
SET 
  department = 'dressing',
  slug = 'dressing-one-set'
WHERE id = 82
  AND name = 'one set'
  AND department = 'glam';

-- Verifikasi
SELECT id, department, name, slug FROM public.retail_categories WHERE id = 82;
