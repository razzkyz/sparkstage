# ✅ Retail Categories UPDATE Fix - Resolved

## Problem (RESOLVED 2026-06-18)
Error saat update retail category di admin CMS:
```
record "new" has no field "updated_at"
Status: 400 (Bad Request)
```

## Root Cause
Kolom `updated_at` **tidak ada** di tabel `retail_categories` database.

## Solution Applied

### 1. Database Fix (Via Supabase SQL Editor)
```sql
-- Add missing updated_at column
ALTER TABLE public.retail_categories
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Drop and recreate all RLS policies
DROP POLICY IF EXISTS "Public can view active retail categories" ON public.retail_categories;
DROP POLICY IF EXISTS "Admins can view all retail categories" ON public.retail_categories;
DROP POLICY IF EXISTS "Admins can create retail categories" ON public.retail_categories;
DROP POLICY IF EXISTS "Admins can update retail categories" ON public.retail_categories;
DROP POLICY IF EXISTS "Admins can delete retail categories" ON public.retail_categories;

-- Recreate policies with correct configuration
CREATE POLICY "Public can view active retail categories"
  ON public.retail_categories FOR SELECT TO public
  USING (is_active = true);

CREATE POLICY "Admins can view all retail categories"
  ON public.retail_categories FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can create retail categories"
  ON public.retail_categories FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update retail categories"
  ON public.retail_categories FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (true);  -- Changed from public.is_admin() to true

CREATE POLICY "Admins can delete retail categories"
  ON public.retail_categories FOR DELETE TO authenticated
  USING (public.is_admin());

-- Ensure trigger exists
DROP TRIGGER IF EXISTS set_retail_categories_updated_at ON public.retail_categories;
CREATE TRIGGER set_retail_categories_updated_at
  BEFORE UPDATE ON public.retail_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

### 2. Frontend Fix (Code Changes)

**File: `frontend/src/hooks/useRetailCategories.ts`**

Added `updated_at` field to interface:
```typescript
export interface RetailCategory {
  id: number;
  department: 'glam' | 'charmbar' | 'sparkclub';
  name: string;
  slug: string;
  parent_id: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;  // ← Added this
}
```

Fixed `createCategory` function type:
```typescript
const createCategory = useMutation({
  mutationFn: async (newCategory: Omit<RetailCategory, 'id' | 'created_at' | 'updated_at'>) => {
    // ← Excluded updated_at since it's auto-generated
    // ...
  }
});
```

## Status
✅ **RESOLVED** - 2026-06-18

## Changes Committed
- Updated: `frontend/src/hooks/useRetailCategories.ts`
- Database: Manual SQL fix applied via Supabase Dashboard

## Testing
✅ Admin can now update retail categories without errors
✅ Category name/slug updates working
✅ Active/inactive status toggle working

---

**Created:** 2026-06-18  
**Resolved:** 2026-06-18  
**Type:** Bug Fix (Database Schema + TypeScript)

