-- Migration: Add Hero and Carousel fields to onstage_page_settings
-- Phase 2: Distinct fields from Booking Page

ALTER TABLE public.onstage_page_settings
ADD COLUMN IF NOT EXISTS hero_image_url TEXT NOT NULL DEFAULT '/images/heroBanner/LandscapeHeroBanner.webp',
ADD COLUMN IF NOT EXISTS hero_image_mobile_url TEXT NOT NULL DEFAULT '/images/heroBanner/NewHeroBanner.webp',
ADD COLUMN IF NOT EXISTS hero_button_text_1 TEXT NOT NULL DEFAULT 'BECOME THE',
ADD COLUMN IF NOT EXISTS hero_button_text_2 TEXT NOT NULL DEFAULT '★ STAR ★',
ADD COLUMN IF NOT EXISTS hero_button_link TEXT NOT NULL DEFAULT '/booking',
ADD COLUMN IF NOT EXISTS carousel_images JSONB NOT NULL DEFAULT '["/images/glam page assets/STAR GLITTER TRANSPARENT BG/AURA POP.png", "/images/glam page assets/STAR GLITTER TRANSPARENT BG/BRONZE.png", "/images/glam page assets/STAR GLITTER TRANSPARENT BG/GOLD DRIP.png", "/images/glam page assets/STAR GLITTER TRANSPARENT BG/MIDNIGHT FX.png", "/images/glam page assets/STAR GLITTER TRANSPARENT BG/PINK RUSH.png", "/images/glam page assets/STAR GLITTER TRANSPARENT BG/SILVER BLINK.png"]'::jsonb;
