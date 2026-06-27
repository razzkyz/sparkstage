-- Migration: Create rollerblade-assets storage bucket
-- Date: 2026-06-26
-- Description: Create Supabase Storage bucket as fallback for CMS image uploads

-- Step 1: Create storage bucket for rollerblade CMS assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'rollerblade-assets',
  'rollerblade-assets',
  true,  -- Public bucket for direct access
  5242880,  -- 5MB limit (5 * 1024 * 1024)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Drop existing policies if exists (for idempotency)
DROP POLICY IF EXISTS "Public read rollerblade assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload rollerblade assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update rollerblade assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete rollerblade assets" ON storage.objects;

-- Step 3: (RLS already enabled by default on storage.objects in Supabase - no action needed)

-- Step 4: Policy - Public read access for rollerblade assets
CREATE POLICY "Public read rollerblade assets"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'rollerblade-assets');

-- Step 5: Policy - Authenticated users can upload to rollerblade assets
CREATE POLICY "Authenticated upload rollerblade assets"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'rollerblade-assets');

-- Step 6: Policy - Authenticated users can update rollerblade assets
CREATE POLICY "Authenticated update rollerblade assets"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'rollerblade-assets')
  WITH CHECK (bucket_id = 'rollerblade-assets');

-- Step 7: Policy - Admin can delete rollerblade assets
CREATE POLICY "Authenticated delete rollerblade assets"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'rollerblade-assets' AND
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      WHERE ura.user_id = auth.uid()
      AND ura.role_name IN ('admin', 'super_admin')
    )
  );

-- Step 8: (Cannot add comment on storage.buckets - not owned by migration role)

-- Migration complete: Storage bucket ready for CMS uploads
