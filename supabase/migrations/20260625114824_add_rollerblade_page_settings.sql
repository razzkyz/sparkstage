-- Migration: Add rollerblade_page_settings table for CMS
-- Phase 1: Database & Backend Setup for Rollerblade CMS

-- Create table for rollerblade page settings
CREATE TABLE IF NOT EXISTS public.rollerblade_page_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Hero Section
  hero_image_url TEXT NOT NULL DEFAULT '/images/rollerblade-hero.jpg',
  hero_title TEXT NOT NULL DEFAULT 'ROLLERBLADE ARENA',
  hero_subtitle TEXT NOT NULL DEFAULT 'Nikmati pengalaman bermain rollerblade yang seru bersama teman dan keluarga',
  
  -- Features Section (4 features with expandable details)
  features JSONB NOT NULL DEFAULT '[
    {
      "id": 1,
      "icon": "🛼",
      "title": "Peralatan Berkualitas",
      "description": "Peralatan lengkap dari sepatu rollerblade hingga alat keselamatan untuk semua usia",
      "details": [
        "Sepatu rollerblade berbagai ukuran (Kids, Teens, Adult)",
        "Helm keselamatan disesuaikan dengan ukuran kepala",
        "Pelindung lengkap (knee pad, elbow pad, wrist guard)",
        "Peralatan terawat dan dibersihkan secara rutin"
      ]
    },
    {
      "id": 2,
      "icon": "🏢",
      "title": "Arena Indoor Nyaman",
      "description": "Ruang bermain dalam gedung yang luas, aman, dan nyaman untuk segala cuaca",
      "details": [
        "Area indoor dengan AC untuk kenyamanan maksimal",
        "Lantai khusus anti-slip berkualitas tinggi",
        "Bebas cuaca - main kapan saja tanpa khawatir hujan",
        "Pencahayaan optimal dan sirkulasi udara baik"
      ]
    },
    {
      "id": 3,
      "icon": "⏰",
      "title": "Jam Operasional Fleksibel",
      "description": "Sesi bermain yang fleksibel setiap hari, cocok untuk jadwal sibuk Anda",
      "details": [
        "Senin - Jumat: 10.00 - 21.00 WIB",
        "Sabtu - Minggu: 09.00 - 22.00 WIB",
        "Sistem booking mudah untuk reservasi sesi",
        "Paket sesi khusus untuk acara grup & keluarga"
      ]
    },
    {
      "id": 4,
      "icon": "☕",
      "title": "Cafe & Ruang Tunggu",
      "description": "Area istirahat yang nyaman dengan cafe untuk menikmati makanan dan minuman",
      "details": [
        "Cafe dengan menu makanan dan minuman lengkap",
        "Ruang tunggu nyaman untuk keluarga dan teman",
        "Free WiFi untuk yang ingin bekerja sambil menunggu",
        "Area duduk luas dengan view arena rollerblade"
      ]
    }
  ]'::jsonb,
  
  -- Gallery Section (6 photos with categories)
  gallery_items JSONB NOT NULL DEFAULT '[
    {
      "id": 1,
      "image": "/images/rollerblade-gallery-1.jpg",
      "caption": "Arena Luas & Aman",
      "category": "venue"
    },
    {
      "id": 2,
      "image": "/images/rollerblade-gallery-2.jpg",
      "caption": "Peralatan Berkualitas",
      "category": "equipment"
    },
    {
      "id": 3,
      "image": "/images/rollerblade-gallery-3.jpg",
      "caption": "Seru Bersama Teman",
      "category": "activity"
    },
    {
      "id": 4,
      "image": "/images/rollerblade-gallery-4.jpg",
      "caption": "Pengalaman Tak Terlupakan",
      "category": "activity"
    },
    {
      "id": 5,
      "image": "/images/rollerblade-gallery-5.jpg",
      "caption": "Fasilitas Lengkap",
      "category": "venue"
    },
    {
      "id": 6,
      "image": "/images/rollerblade-gallery-6.jpg",
      "caption": "Momen Kebersamaan",
      "category": "activity"
    }
  ]'::jsonb,
  
  -- CTA Section
  cta_image_url TEXT NOT NULL DEFAULT '/images/rollerblade-cta.jpg',
  cta_title TEXT NOT NULL DEFAULT 'Siap untuk Pengalaman Rollerblade Seru?',
  cta_subtitle TEXT NOT NULL DEFAULT 'Datang langsung ke SparkStage Arena dan nikmati keseruan bermain rollerblade!',
  
  -- Section Fonts (for future enhancement)
  section_fonts JSONB NOT NULL DEFAULT '{
    "hero": { "heading": "cardo", "body": "nunito_sans" },
    "features": { "heading": "cardo", "body": "nunito_sans" },
    "gallery": { "heading": "cardo", "body": "nunito_sans" },
    "cta": { "heading": "cardo", "body": "nunito_sans" }
  }'::jsonb,
  
  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default row (singleton pattern - only 1 row)
INSERT INTO public.rollerblade_page_settings (id)
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM public.rollerblade_page_settings);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_rollerblade_page_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if exists (for idempotency)
DROP TRIGGER IF EXISTS trigger_rollerblade_page_settings_updated_at ON public.rollerblade_page_settings;

-- Create trigger
CREATE TRIGGER trigger_rollerblade_page_settings_updated_at
  BEFORE UPDATE ON public.rollerblade_page_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_rollerblade_page_settings_updated_at();

-- Enable Row Level Security
ALTER TABLE public.rollerblade_page_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if exists (for idempotency)
DROP POLICY IF EXISTS "Public read rollerblade page settings" ON public.rollerblade_page_settings;
DROP POLICY IF EXISTS "Admin full access for rollerblade page settings" ON public.rollerblade_page_settings;

-- Policy: Public read access
CREATE POLICY "Public read rollerblade page settings"
  ON public.rollerblade_page_settings
  FOR SELECT
  TO public
  USING (true);

-- Policy: Admin write access
CREATE POLICY "Admin full access for rollerblade page settings"
  ON public.rollerblade_page_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_role_assignments
      WHERE user_id = auth.uid()
      AND role_name IN ('admin', 'super_admin')
    )
  );

-- Add comment for documentation
COMMENT ON TABLE public.rollerblade_page_settings IS 'CMS settings for Rollerblade page - singleton table (1 row only)';
COMMENT ON COLUMN public.rollerblade_page_settings.features IS 'Array of feature objects with icon, title, description, and details array';
COMMENT ON COLUMN public.rollerblade_page_settings.gallery_items IS 'Array of gallery items with image, caption, and category (venue|equipment|activity)';
COMMENT ON COLUMN public.rollerblade_page_settings.section_fonts IS 'Font settings for each section (hero, features, gallery, cta)';
