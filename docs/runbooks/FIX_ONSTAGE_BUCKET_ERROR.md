# Fix: On-Stage CMS Bucket Error

## Problem
Error "Bucket not found" ketika upload foto di halaman CMS On-Stage.

## Root Cause
Supabase Storage bucket `onstage-assets` tidak pernah dibuat. Halaman On-Stage CMS mencoba upload ke bucket yang tidak ada.

## Solution

### Step 1: Deploy Migration
Migration file sudah dibuat: `20260715000002_create_onstage_assets_bucket.sql`

**Cara deploy:**

#### Option A: Via Supabase CLI (PowerShell dengan Execution Policy)
```powershell
# Jika execution policy error, jalankan sebagai administrator:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Lalu deploy migration:
supabase db push
```

#### Option B: Via Supabase Dashboard (Manual)
1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project **sparkstage**
3. Buka **SQL Editor**
4. Copy-paste isi file `supabase/migrations/20260715000002_create_onstage_assets_bucket.sql`
5. Klik **Run** untuk execute

#### Option C: Via npm script (Alternative)
```bash
# Gunakan cmd.exe (bukan PowerShell)
cd "d:\Project-job\Spark Projects\sparkstage"
npm run supabase:db:push
```

### Step 2: Verify Bucket Creation
Setelah migration berhasil, verify dengan:

1. **Via Supabase Dashboard:**
   - Buka **Storage** di sidebar
   - Cek apakah bucket `onstage-assets` muncul
   - Pastikan bucket berstatus **Public**

2. **Via SQL Query:**
```sql
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'onstage-assets';
```

Expected result:
```
id               | name            | public | file_size_limit | allowed_mime_types
-----------------|-----------------|--------|-----------------|-------------------
onstage-assets   | onstage-assets  | true   | 5242880         | {image/jpeg,...}
```

### Step 3: Test Upload
1. Login sebagai admin
2. Buka `/admin/onstage-page`
3. Coba upload gambar di salah satu section
4. Harus berhasil tanpa error "Bucket not found"

## Technical Details

### Bucket Configuration
- **Bucket ID:** `onstage-assets`
- **Public Access:** Yes
- **File Size Limit:** 5MB (5,242,880 bytes)
- **Allowed MIME Types:** 
  - `image/jpeg`
  - `image/png`
  - `image/webp`
  - `image/gif`

### RLS Policies
1. **Public Read:** Anyone can view images
2. **Authenticated Upload:** Authenticated users can upload
3. **Authenticated Update:** Authenticated users can update
4. **Admin Delete:** Only admin/super_admin can delete

### Upload Flow
```
Frontend (OnStagePageManager.tsx)
    ↓
cmsAssetUpload.ts
    ↓
Check if R2 enabled (VITE_USE_R2_UPLOAD)
    ↓ (No)
Fallback to Supabase Storage
    ↓
Upload to `onstage-assets` bucket
    ↓
Return public URL
```

## Prevention
Setiap kali membuat CMS page baru yang membutuhkan upload:

1. **Create storage bucket migration** terlebih dahulu
2. **Test upload** sebelum deployment
3. **Document bucket name** di code constant

### Template Migration
```sql
-- Migration: Create {name}-assets storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  '{name}-assets',
  '{name}-assets',
  true,
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Add RLS policies here...
```

## Related Files
- Migration: `supabase/migrations/20260715000002_create_onstage_assets_bucket.sql`
- CMS Page: `frontend/src/pages/admin/OnStagePageManager.tsx`
- Upload Helper: `frontend/src/lib/cmsAssetUpload.ts`
- Similar Migration: `20260626113000_create_rollerblade_assets_bucket.sql`

## Status
✅ Migration file created
⏳ Waiting for deployment
❌ Not yet tested

## Date
2026-07-15
