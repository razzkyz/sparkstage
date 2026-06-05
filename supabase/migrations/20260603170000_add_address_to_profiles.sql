-- Migration to add address fields to profiles
-- This is necessary for e-commerce expansion to support RajaOngkir.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS province_id text,
ADD COLUMN IF NOT EXISTS city_id text,
ADD COLUMN IF NOT EXISTS subdistrict_id text,
ADD COLUMN IF NOT EXISTS postal_code text;
