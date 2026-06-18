# 🚀 Quick Fix: Retail Categories Update Error - RESOLVED

## Problem (RESOLVED)
❌ Error saat update category: `record "new" has no field "updated_at"`

## Root Cause
Kolom `updated_at` tidak ada di tabel `retail_categories` database.

## Fix Applied (2026-06-18)

### 1. Database (via Supabase SQL Editor)
```sql
-- Add missing column
ALTER TABLE public.retail_categories
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Fix RLS policy
DROP POLICY IF EXISTS "Admins can update retail categories" ON public.retail_categories;
CREATE POLICY "Admins can update retail categories"
  ON public.retail_categories FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (true);

-- Ensure trigger exists
DROP TRIGGER IF EXISTS set_retail_categories_updated_at ON public.retail_categories;
CREATE TRIGGER set_retail_categories_updated_at
  BEFORE UPDATE ON public.retail_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

### 2. Frontend (Code Changes)
**File:** `frontend/src/hooks/useRetailCategories.ts`
- Added `updated_at: string` to `RetailCategory` interface
- Excluded `updated_at` from `createCategory` function type

## Status
✅ **RESOLVED** - Category update now works correctly

## Testing
1. Login as admin → `/admin/retail-products`
2. Edit any category name → Click Update
3. ✅ Should see "Berhasil diperbarui"

## Files Changed
- `frontend/src/hooks/useRetailCategories.ts` ← Code change
- Database: Manual SQL executed ← Schema fix

---
**Resolved:** 2026-06-18 | **Type:** Bug Fix | **Risk:** Low

