-- Migration: Create onstage-assets storage bucket
-- Date: 2026-07-15
-- Description: Create Supabase Storage bucket for On-Stage CMS image uploads

-- Step 1: Create storage bucket for onstage CMS assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'onstage-assets',
  'onstage-assets',
  true,  -- Public bucket for direct access
  5242880,  -- 5MB limit (5 * 1024 * 1024)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Drop existing policies if exists (for idempotency)
DROP POLICY IF EXISTS "Public read onstage assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload onstage assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update onstage assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete onstage assets" ON storage.objects;

-- Step 3: (RLS already enabled by default on storage.objects in Supabase - no action needed)

-- Step 4: Policy - Public read access for onstage assets
CREATE POLICY "Public read onstage assets"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'onstage-assets');

-- Step 5: Policy - Authenticated users can upload to onstage assets
CREATE POLICY "Authenticated upload onstage assets"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'onstage-assets');

-- Step 6: Policy - Authenticated users can update onstage assets
CREATE POLICY "Authenticated update onstage assets"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'onstage-assets')
  WITH CHECK (bucket_id = 'onstage-assets');

-- Step 7: Policy - Admin can delete onstage assets
CREATE POLICY "Authenticated delete onstage assets"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'onstage-assets' AND
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      WHERE ura.user_id = auth.uid()
      AND ura.role_name IN ('admin', 'super_admin')
    )
  );

-- Migration complete: On-Stage CMS Storage bucket ready for uploads
