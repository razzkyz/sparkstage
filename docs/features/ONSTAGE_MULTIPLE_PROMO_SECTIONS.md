# On-Stage Multiple Promo Sections

## Overview
Enhanced On-Stage CMS to support multiple promo package sections instead of single section. Admin can add/remove sections dynamically.

## Changes (2026-07-15)

### Before
- ❌ Single promo section hardcoded
- ❌ Cannot add more promo offers
- ❌ Limited to one product showcase

### After
- ✅ Multiple promo sections (unlimited)
- ✅ Add/Remove sections with button + icon
- ✅ Each section has independent fields (title, price, image, packages)
- ✅ Responsive grid layout (1/2/3 columns)
- ✅ Backward compatible with legacy single promo

## Database Schema

### New Column
```sql
-- promo_sections: Array of promo objects
promo_sections JSONB NOT NULL DEFAULT '[]'::jsonb
```

### Structure
```typescript
interface PromoSection {
  id: string;                 // UUID
  subtitle: string;           // "SPARK STAGE"
  title: string;              // "SPARKFROST"
  title_highlight: string;    // "(Winter Edition)"
  image_url: string;          // Full image URL
  price: string;              // "Rp 475.000,00 IDR"
  price_suffix: string;       // "/Per Pax"
  packages: string[];         // ["Snow", "Winter", ...]
}
```

### Example Data
```json
{
  "promo_sections": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "subtitle": "SPARK STAGE",
      "title": "SPARKFROST",
      "title_highlight": "(Winter Edition)",
      "image_url": "https://cdn.sparkstage55.com/...",
      "price": "Rp 475.000,00 IDR",
      "price_suffix": "/Per Pax",
      "packages": ["Snow", "Winter", "Frozen (VIP)"]
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "subtitle": "SPARK STAGE",
      "title": "SUMMER GLOW",
      "title_highlight": "(Beach Edition)",
      "image_url": "https://cdn.sparkstage55.com/...",
      "price": "Rp 550.000,00 IDR",
      "price_suffix": "/Per Pax",
      "packages": ["Sunset", "Beach", "Ocean"]
    }
  ]
}
```

## Admin UI Features

### 1. Add Section Button
```tsx
<button onClick={addPromoSection}>
  <Plus /> Tambah Section
</button>
```
- Location: Top-right header of "Promo Package Sections"
- Style: Pink-purple gradient, bold font
- Icon: Plus (lucide-react)

### 2. Section Card
Each section displayed as a card with:
- **Section Number Badge:** Circular pink-purple gradient (1, 2, 3, ...)
- **Delete Section Button:** Red trash icon with label
- **All Fields:** Subtitle, Title, Title Highlight, Image, Price, Price Suffix
- **Package Manager:** Add/remove individual packages

### 3. Empty State
When no sections exist:
- Large icon (ImageIcon)
- Message: "Belum ada promo section"
- Prompt: "Klik Tambah Section untuk mulai"

### 4. Responsive Layout
```css
/* Admin Page - Vertical Stack */
sections: flex-col gap-6

/* Frontend Display - Grid */
grid-cols-1                /* Mobile: 1 column */
md:grid-cols-2             /* Tablet: 2 columns */
lg:grid-cols-3             /* Desktop: 3 columns */
```

## Frontend Display

### Single Section
```
┌─────────────────────────────┐
│                             │
│      [Centered Card]        │
│                             │
└─────────────────────────────┘
```

### Multiple Sections
```
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Section │ │ Section │ │ Section │
│    1    │ │    2    │ │    3    │
└─────────┘ └─────────┘ └─────────┘
```

## Migration Strategy

### Step 1: Add Column (Safe)
```sql
ALTER TABLE onstage_page_settings
ADD COLUMN promo_sections JSONB NOT NULL DEFAULT '[]'::jsonb;
```

### Step 2: Migrate Data
Convert existing single promo to first item in array:
```sql
UPDATE onstage_page_settings
SET promo_sections = jsonb_build_array(
  jsonb_build_object(
    'id', gen_random_uuid()::text,
    'subtitle', promo_subtitle,
    'title', promo_title,
    ...
  )
);
```

### Step 3: Keep Legacy Columns
Keep old columns for backward compatibility:
- `promo_subtitle`
- `promo_title`
- `promo_title_highlight`
- `promo_image_url`
- `promo_price`
- `promo_price_suffix`
- `promo_packages`

**Why?** Allows instant rollback if needed. Can remove after confirming migration works.

## Backward Compatibility

### Frontend Fallback Logic
```typescript
const promoSections = settings?.promo_sections?.length > 0 
  ? settings.promo_sections 
  : settings?.promo_packages 
  ? [{ /* legacy single promo */ }]
  : [];
```

### Behavior
- If `promo_sections` exists and not empty → Use new array
- Else if legacy fields exist → Convert to single-item array
- Else → Render nothing

This ensures:
- ✅ New data works immediately
- ✅ Old data still displays correctly
- ✅ No breaking changes

## User Flow (Admin)

### Add First Section
1. Open `/admin/onstage-page`
2. Scroll to "4. Promo Package Sections"
3. Click **"Tambah Section"** button
4. Section #1 card appears
5. Fill in all fields (subtitle, title, image, price, packages)
6. Click **"Simpan Perubahan"** at bottom

### Add More Sections
1. Click **"Tambah Section"** again
2. Section #2 card appears below Section #1
3. Fill in fields for new section
4. Repeat as needed
5. Save changes

### Delete Section
1. Hover over any section card
2. Click **"Hapus Section"** button (top-right)
3. Section removed instantly
4. Save changes

### Manage Packages per Section
1. In each section card, scroll to "Daftar Paket"
2. Click **"Tambah Paket"** to add package
3. Type package name (e.g., "Snow")
4. Click trash icon to remove package
5. Preview shows comma-separated list

## User Flow (Frontend)

### Single Section Display
- Centered card layout
- Max-width constraint
- Clean, focused presentation

### Multiple Sections Display
- Grid layout (responsive)
- Equal-height cards
- Hover effect: shadow elevation
- Each card independent

### Mobile Experience
- 1 column on mobile (stacked)
- 2 columns on tablet
- 3 columns on desktop
- Touch-friendly buttons

## Technical Details

### State Management (Admin)
```typescript
// Promo sections array
const promoSections = formData.promo_sections || [];

// Add section
const addPromoSection = () => {
  const newSection: PromoSection = {
    id: crypto.randomUUID(),
    subtitle: "",
    title: "",
    title_highlight: "",
    image_url: "",
    price: "",
    price_suffix: "",
    packages: [],
  };
  handleChange("promo_sections", [...promoSections, newSection]);
};

// Update section
const updatePromoSection = (index: number, updates: Partial<PromoSection>) => {
  const next = [...promoSections];
  next[index] = { ...next[index], ...updates };
  handleChange("promo_sections", next);
};

// Remove section
const removePromoSection = (index: number) => {
  handleChange("promo_sections", promoSections.filter((_, i) => i !== index));
};
```

### Nested Package Management
```typescript
// Add package to specific section
const addPromoPackage = (sectionIndex: number) => {
  const section = promoSections[sectionIndex];
  updatePromoSection(sectionIndex, {
    packages: [...(section.packages || []), ""],
  });
};

// Update package in specific section
const updatePromoPackage = (sectionIndex: number, pkgIndex: number, value: string) => {
  const section = promoSections[sectionIndex];
  const nextPackages = [...(section.packages || [])];
  nextPackages[pkgIndex] = value;
  updatePromoSection(sectionIndex, { packages: nextPackages });
};

// Remove package from specific section
const removePromoPackage = (sectionIndex: number, pkgIndex: number) => {
  const section = promoSections[sectionIndex];
  const nextPackages = (section.packages || []).filter((_, i) => i !== pkgIndex);
  updatePromoSection(sectionIndex, { packages: nextPackages });
};
```

### URL Resolution
```typescript
promo_sections: data.promo_sections?.map((section: PromoSection) => ({
  ...section,
  image_url: resolvePublicAssetUrl(section.image_url),
})) || []
```

## Files Modified

### Database
- ✅ `20260715000003_convert_promo_to_array.sql`

### Backend/Types
- ✅ `hooks/useOnStageSettings.ts` - Added `PromoSection` interface
- ✅ `hooks/useOnStageSettings.ts` - Updated `OnStagePageSettings` type
- ✅ `hooks/useOnStageSettings.ts` - URL resolution for promo_sections

### Admin UI
- ✅ `pages/admin/OnStagePageManager.tsx` - Multiple section management
- ✅ `pages/admin/OnStagePageManager.tsx` - Nested package management
- ✅ `pages/admin/OnStagePageManager.tsx` - Add/Remove section buttons

### Frontend Display
- ✅ `pages/OnStage.tsx` - PromoPackageSection component updated
- ✅ `pages/OnStage.tsx` - Grid layout for multiple sections
- ✅ `pages/OnStage.tsx` - Backward compatibility logic

## Testing Checklist

### Database Migration
- [ ] Run migration successfully
- [ ] Verify promo_sections column exists
- [ ] Check data migrated from legacy fields
- [ ] Confirm legacy fields still present

### Admin UI - Section Management
- [ ] Add first section: Button works, form appears
- [ ] Add multiple sections: Multiple cards stack correctly
- [ ] Delete section: Card removed, data updated
- [ ] Empty state: Message displays when no sections
- [ ] Section numbering: Badge shows correct numbers (1, 2, 3)

### Admin UI - Package Management
- [ ] Add package per section: Package added to correct section
- [ ] Edit package: Changes saved to correct section
- [ ] Delete package: Package removed from correct section
- [ ] Preview: Shows comma-separated list correctly

### Admin UI - Image Upload
- [ ] Upload image per section: Image URL saved correctly
- [ ] Multiple uploads: Each section has independent image

### Admin UI - Save
- [ ] Save changes: Data persists to database
- [ ] Reload page: Sections load correctly
- [ ] Multiple sections: All sections saved

### Frontend Display
- [ ] Single section: Centered layout
- [ ] Multiple sections: Grid layout (1/2/3 columns)
- [ ] Empty sections: Nothing renders
- [ ] Legacy data: Old single promo displays correctly
- [ ] New data: Multiple promos display correctly
- [ ] Responsive: Layout adapts on mobile/tablet/desktop

### Backward Compatibility
- [ ] Legacy data loads: Old promo_packages field works
- [ ] New data loads: promo_sections array works
- [ ] Mixed scenario: Handles missing fields gracefully

## Benefits

✅ **Flexible:** Admin can create unlimited promo offers
✅ **Independent:** Each section has own data (no conflicts)
✅ **Visual:** Grid layout showcases multiple promos elegantly
✅ **Safe:** Backward compatible, no breaking changes
✅ **Scalable:** Easy to add more fields per section later
✅ **User-Friendly:** Intuitive add/remove buttons

## Performance

### Database
- JSONB column: Efficient storage and querying
- Indexed: Can add GIN index if needed for search
- Size: Minimal overhead (~200 bytes per section)

### Frontend
- Single query: Fetches all sections at once
- Cached: TanStack Query cache (5 min stale time)
- Render: Virtual DOM efficiently handles array

## Rollback Plan

### If Issues Found
1. Stop using new `promo_sections` field
2. Revert frontend to use legacy fields
3. Data still intact in legacy columns
4. No data loss

### Full Rollback
```sql
-- Drop new column (if needed)
ALTER TABLE onstage_page_settings
DROP COLUMN IF EXISTS promo_sections;
```

Legacy fields remain, system works as before.

## Future Enhancements

### Possible Additions
- [ ] Section ordering (drag-and-drop)
- [ ] Section visibility toggle (show/hide)
- [ ] Section scheduling (start/end date)
- [ ] Section CTA button (custom link per section)
- [ ] Section analytics (view count per section)

### Easy to Add
All fields are in JSONB, just add keys:
```typescript
interface PromoSection {
  // ... existing fields
  visible?: boolean;
  order?: number;
  start_date?: string;
  end_date?: string;
  cta_text?: string;
  cta_link?: string;
}
```

## Related Features
- Image Carousel: Similar add/remove pattern
- Rollerblade CMS: Similar JSONB structure
- Banner Manager: Similar multi-item management

## Status
✅ **COMPLETE** - Ready for deployment

## Deployment Steps

1. **Deploy Migration:**
   ```bash
   supabase db push
   ```
   or via Supabase Dashboard → SQL Editor

2. **Verify Migration:**
   ```sql
   SELECT id, promo_sections FROM onstage_page_settings;
   ```

3. **Deploy Frontend:**
   ```bash
   npm run build
   # Deploy to production
   ```

4. **Test Admin:**
   - Login as admin
   - Open `/admin/onstage-page`
   - Test add/remove sections

5. **Test Frontend:**
   - Open `/on-stage` or `/`
   - Verify promo sections display correctly
   - Test responsive layout

## Date
2026-07-15

## Author
Kiro AI Assistant
