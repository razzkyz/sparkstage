# Category Display Order Management

**Status:** ✅ Active  
**Created:** 2026-07-04  
**Updated:** 2026-07-04

## Overview

Retail categories (shop, glam, charmbar, sparkclub, dressing) dapat diatur urutannya menggunakan kolom `display_order`.

## Database Structure

**Table:** `retail_categories`

**New Column:** `display_order` (INTEGER, DEFAULT 999)
- Lower numbers appear first
- Default value: 999 (appears at the end)
- Indexed for performance

## How to Change Display Order

### Option 1: Direct SQL Update (Recommended)

```sql
-- Update single category
UPDATE retail_categories 
SET display_order = 10 
WHERE slug = 'spark-my-face';

-- Reorder multiple categories at once
UPDATE retail_categories 
SET display_order = CASE 
  WHEN slug = 'spark-my-face' THEN 10
  WHEN slug = 'spark-my-hair' THEN 20
  WHEN slug = 'spark-my-charms' THEN 30
  WHEN slug = 'spark-my-nails' THEN 40
  WHEN slug = 'spark-my-style' THEN 50
  ELSE display_order
END
WHERE department = 'shop';

-- Verify the new order
SELECT department, name, slug, display_order, parent_id
FROM retail_categories
WHERE department = 'shop' AND is_active = true
ORDER BY display_order, name;
```

### Option 2: Via Supabase Dashboard

1. Open Supabase Dashboard
2. Go to Table Editor → `retail_categories`
3. Find the category you want to reorder
4. Edit the `display_order` value
5. Save changes

## Best Practices

### Numbering Convention

Use increments of 10 to allow easy insertion:
- First category: 10
- Second category: 20
- Third category: 30
- etc.

This allows you to insert a new category between positions without renumbering all categories:
- Insert between 20 and 30: use 25

### Department-Specific Ordering

Each department has its own ordering:
```
department='shop', display_order=10  → First in shop
department='glam', display_order=10  → First in glam
```

### Parent/Child Ordering

- **Parent categories** (parent_id = NULL): Ordered by display_order
- **Subcategories** (parent_id != NULL): Also ordered by display_order within their parent

Example:
```sql
-- Parent categories (main menu)
'SPARK MY FACE'    display_order=10
'SPARK MY HAIR'    display_order=20
'SPARK MY CHARMS'  display_order=30

-- Subcategories under 'SPARK MY FACE'
'Foundation'       display_order=10  parent_id=(SPARK MY FACE id)
'Lipstick'         display_order=20  parent_id=(SPARK MY FACE id)
'Eyeshadow'        display_order=30  parent_id=(SPARK MY FACE id)
```

## Frontend Implementation

**File:** `frontend/src/pages/Shop.tsx`

Categories are automatically sorted by `display_order`:

```typescript
const shopCategoriesFlat = useMemo(() => {
  return retailCategories
    .filter((c) => c.department === "shop" && c.is_active && c.parent_id === null)
    .sort((a, b) => (a.display_order || 999) - (b.display_order || 999));
}, [retailCategories]);

const activeSubcategories = useMemo(() => {
  // ... filter logic
  return filteredCategories
    .sort((a, b) => (a.display_order || 999) - (b.display_order || 999));
}, [activeCategory, shopCategoriesFlat, retailCategories]);
```

**Hook:** `frontend/src/hooks/useRetailCategories.ts`

Database query orders by display_order:
```typescript
.order('department', { ascending: true })
.order('display_order', { ascending: true })
.order('name', { ascending: true })
```

## Common Scenarios

### Scenario 1: Move a category to first position
```sql
UPDATE retail_categories 
SET display_order = 5  -- Lower than current first position
WHERE slug = 'my-category';
```

### Scenario 2: Move a category to last position
```sql
UPDATE retail_categories 
SET display_order = 999  -- Default value for last
WHERE slug = 'my-category';
```

### Scenario 3: Swap two categories
```sql
BEGIN;
  -- Temporarily set first category to a high number
  UPDATE retail_categories SET display_order = 1000 WHERE slug = 'category-a';
  -- Move second to first's position
  UPDATE retail_categories SET display_order = 10 WHERE slug = 'category-b';
  -- Move first to second's position
  UPDATE retail_categories SET display_order = 20 WHERE slug = 'category-a';
COMMIT;
```

### Scenario 4: Reset all ordering (clean slate)
```sql
-- Renumber all shop categories sequentially
WITH numbered AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY name) * 10 as new_order
  FROM retail_categories
  WHERE department = 'shop' AND parent_id IS NULL
)
UPDATE retail_categories rc
SET display_order = n.new_order
FROM numbered n
WHERE rc.id = n.id;
```

## Testing

After updating display_order:

1. **Clear browser cache** or hard refresh (Ctrl+Shift+R)
2. Check category order on:
   - `/shop` page
   - Category tabs
   - Subcategory pills
3. Verify sorting is correct on mobile and desktop

## Migration

**File:** `supabase/migrations/20260704000000_add_display_order_to_retail_categories.sql`

To deploy:
```bash
npm run supabase:db:push
```

## Notes

- Changes take effect immediately
- No code deployment needed
- Frontend caches for 5 minutes (TanStack Query default)
- Force refresh to see changes instantly

## Related Files

- Migration: `supabase/migrations/20260704000000_add_display_order_to_retail_categories.sql`
- Hook: `frontend/src/hooks/useRetailCategories.ts`
- Shop Page: `frontend/src/pages/Shop.tsx`
- Glam Page: `frontend/src/pages/Shop.tsx` (beauty route)
- CharmBar Page: `frontend/src/pages/Shop.tsx` (charm-bar route)
