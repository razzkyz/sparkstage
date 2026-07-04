# Category Display Order Feature - Ready to Deploy ✅

**Created:** 2026-07-04  
**Status:** ✅ Code Complete - Ready for Deployment

## Summary

Fitur untuk mengatur urutan tampilan kategori di halaman Shop dengan kolom `display_order` di database.

## What's Done

### ✅ 1. Database Migration
**File:** `supabase/migrations/20260704000000_add_display_order_to_retail_categories.sql`

- Menambahkan kolom `display_order` (INTEGER, DEFAULT 999)
- Index untuk performance
- Auto-backfill dengan nilai berurutan untuk data existing

### ✅ 2. TypeScript Type Update
**File:** `frontend/src/hooks/useRetailCategories.ts`

- Menambahkan `display_order?: number` ke interface `RetailCategory`
- Update query untuk sort by display_order

### ✅ 3. Frontend Implementation
**File:** `frontend/src/pages/Shop.tsx`

- Main categories diurutkan berdasarkan `display_order`
- Subcategories juga diurutkan berdasarkan `display_order`
- Fallback ke 999 jika display_order tidak ada

### ✅ 4. Documentation
**File:** `docs/runbooks/category-display-order.md`

- Complete guide untuk mengatur urutan kategori
- SQL examples untuk common scenarios
- Best practices untuk numbering convention

## UI Improvements (Done Previously)

### ✅ Grid Layout
- Maximum 4 columns on desktop (removed `xl:grid-cols-5`)
- Responsive gaps: 16px mobile, 20px tablet, 24px desktop

### ✅ Card Spacing
- Better padding: 14px mobile, 16px desktop
- Larger text on desktop
- Title: 2 lines (was 1 line)
- Description: 2 lines (was 1 line)

### ✅ Category Spacing
- Main category margin: `mt-3 mb-3` (reduced from `mt-4 mb-5`)
- Subcategory margin: `-mt-1 mb-3` (reduced from `mt-2 mb-3`)
- Total gap between category and subcategory: **8px** (was 28px)

## How to Deploy

### Step 1: Deploy Database Migration

**Option A: Via Command Line**
```bash
# In PowerShell with execution policy enabled
npm run supabase:db:push

# Or directly
npx supabase db push
```

**Option B: Via Supabase Dashboard**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy content from `supabase/migrations/20260704000000_add_display_order_to_retail_categories.sql`
4. Paste and run

**Option C: Manual SQL**
```sql
-- Add column
ALTER TABLE public.retail_categories 
ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 999;

-- Create index
CREATE INDEX IF NOT EXISTS idx_retail_categories_display_order 
ON public.retail_categories(display_order);

-- Backfill data
WITH ordered_categories AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY department, parent_id ORDER BY id) as row_num
  FROM public.retail_categories
)
UPDATE public.retail_categories rc
SET display_order = oc.row_num * 10
FROM ordered_categories oc
WHERE rc.id = oc.id;
```

### Step 2: Build & Deploy Frontend

```bash
# Build frontend
npm run build

# Deploy to production
# (your deployment command here)
```

### Step 3: Verify

1. Visit `/shop` page
2. Check category order in main tabs
3. Check subcategory order in pills
4. Test on mobile and desktop

## How to Use (After Deployment)

### Change Category Order

**Example 1: Make "SPARK MY CHARMS" appear first**
```sql
UPDATE retail_categories 
SET display_order = 5 
WHERE slug = 'spark-my-charms';
```

**Example 2: Reorder all shop categories**
```sql
UPDATE retail_categories 
SET display_order = CASE 
  WHEN slug = 'spark-my-charms' THEN 10
  WHEN slug = 'spark-my-face' THEN 20
  WHEN slug = 'spark-my-hair' THEN 30
  WHEN slug = 'spark-my-nails' THEN 40
  WHEN slug = 'spark-my-style' THEN 50
  ELSE display_order
END
WHERE department = 'shop';
```

**Example 3: Via Supabase Dashboard**
1. Go to Table Editor → `retail_categories`
2. Edit `display_order` column
3. Save

### Numbering Convention

Use increments of 10:
- First: 10
- Second: 20
- Third: 30
- etc.

This allows insertion between positions:
- Insert between 20 and 30: use 25

## Files Changed

### New Files
- ✅ `supabase/migrations/20260704000000_add_display_order_to_retail_categories.sql`
- ✅ `docs/runbooks/category-display-order.md`
- ✅ `CATEGORY_DISPLAY_ORDER_READY.md` (this file)

### Modified Files
- ✅ `frontend/src/hooks/useRetailCategories.ts`
- ✅ `frontend/src/pages/Shop.tsx`

## Testing Checklist

After deployment:

- [ ] Database migration applied successfully
- [ ] No database errors in Supabase logs
- [ ] Frontend builds without errors
- [ ] Categories display in correct order on `/shop`
- [ ] Subcategories display in correct order
- [ ] Mobile responsive works
- [ ] Desktop layout shows max 4 columns
- [ ] Card spacing looks good
- [ ] Category spacing is tighter

## Rollback Plan

If issues occur:

### Rollback Database
```sql
-- Remove column
ALTER TABLE public.retail_categories 
DROP COLUMN IF EXISTS display_order;

-- Remove index
DROP INDEX IF EXISTS idx_retail_categories_display_order;
```

### Rollback Frontend
```bash
git revert <commit-hash>
npm run build
# redeploy
```

## Benefits

1. ✅ **Flexible ordering** - Admin dapat mengatur urutan kategori tanpa code changes
2. ✅ **Easy management** - Simple SQL update atau via Supabase Dashboard
3. ✅ **Better UX** - Grid maksimal 4 kolom, spacing lebih baik
4. ✅ **Performance** - Indexed untuk query cepat
5. ✅ **Documentation** - Complete guide di runbook

## Next Steps

1. Deploy migration ke database
2. Build dan deploy frontend
3. Test di production
4. Update AGENTS.md jika perlu
5. Atur urutan kategori sesuai kebutuhan bisnis

---

**Ready to Deploy!** 🚀

Semua code sudah siap, tinggal jalankan deployment steps di atas.
