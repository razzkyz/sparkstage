-- Migration: Add onstage_page_settings table for CMS
-- Phase 1: Database & Backend Setup for On-Stage CMS

-- Create table for onstage page settings
CREATE TABLE IF NOT EXISTS public.onstage_page_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ticket Banner Section
  ticket_banner_image_url TEXT NOT NULL DEFAULT '/images/landing/TICKET BOARD ENTRANCE website.webp',
  ticket_banner_title TEXT NOT NULL DEFAULT 'GET YOUR TIKET NOW',
  
  -- Promo Package Section
  promo_image_url TEXT NOT NULL DEFAULT '/images/landing/POP UP WEB VIP STAR 1.jpg.webp',
  promo_subtitle TEXT NOT NULL DEFAULT 'SPARK STAGE',
  promo_title TEXT NOT NULL DEFAULT 'SPARKFROST',
  promo_title_highlight TEXT NOT NULL DEFAULT '(Winter Edition)',
  promo_price TEXT NOT NULL DEFAULT 'Rp 475.000,00 IDR',
  promo_price_suffix TEXT NOT NULL DEFAULT '/Per Pax',
  promo_packages JSONB NOT NULL DEFAULT '["Snow", "Winter", "Frozen (VIP)", "Snow (2 Pax)", "Winter (2 Pax)", "Frozen (VIP) (2 Pax)", "Snow (3 Pax)"]'::jsonb,
  
  -- News Section
  news_background_url TEXT NOT NULL DEFAULT '/images/glam page assets/VISUAL 5.webp',
  news_title TEXT NOT NULL DEFAULT 'LATEST NEWS',
  news_subtitle TEXT NOT NULL DEFAULT 'Stay up to date with exciting events, backstage passes and exclusive charm releases.',
  news_button_text TEXT NOT NULL DEFAULT 'READ UPDATES',
  news_button_link TEXT NOT NULL DEFAULT '/news',
  
  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default row (singleton pattern - only 1 row)
INSERT INTO public.onstage_page_settings (id)
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM public.onstage_page_settings);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_onstage_page_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if exists (for idempotency)
DROP TRIGGER IF EXISTS trigger_onstage_page_settings_updated_at ON public.onstage_page_settings;

-- Create trigger
CREATE TRIGGER trigger_onstage_page_settings_updated_at
  BEFORE UPDATE ON public.onstage_page_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_onstage_page_settings_updated_at();

-- Enable Row Level Security
ALTER TABLE public.onstage_page_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if exists (for idempotency)
DROP POLICY IF EXISTS "Public read onstage page settings" ON public.onstage_page_settings;
DROP POLICY IF EXISTS "Admin full access for onstage page settings" ON public.onstage_page_settings;

-- Policy: Public read access
CREATE POLICY "Public read onstage page settings"
  ON public.onstage_page_settings
  FOR SELECT
  TO public
  USING (true);

-- Policy: Admin write access
CREATE POLICY "Admin full access for onstage page settings"
  ON public.onstage_page_settings
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
COMMENT ON TABLE public.onstage_page_settings IS 'CMS settings for On-Stage page - singleton table (1 row only)';
