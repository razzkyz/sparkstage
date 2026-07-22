-- Migration: Add borderRadius support to ID card templates photo config
-- Date: 2026-07-22
-- Description: Menambahkan field borderRadius pada config_front.photo untuk mengatur rounded corner foto customer

-- Update existing templates to add borderRadius field with default value '0px' (sharp corner)
UPDATE id_card_templates
SET config_front = jsonb_set(
  config_front,
  '{photo,borderRadius}',
  '"0px"'::jsonb,
  true
)
WHERE config_front->'photo'->>'borderRadius' IS NULL;

-- Add comment to document the new field
COMMENT ON COLUMN id_card_templates.config_front IS 'Front side configuration including photo area with borderRadius support (0px=sharp, 10px=slightly rounded, 50%=fully circular)';
