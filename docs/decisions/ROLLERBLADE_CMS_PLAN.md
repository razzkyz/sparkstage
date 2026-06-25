# Rollerblade CMS Implementation Plan

## Overview
Membuat CMS admin untuk halaman RollerbladePage (`/rollerblade`) dengan 4 section utama yang dapat diedit:
1. Hero Banner
2. Features Section (Expandable Cards)
3. Gallery Grid
4. CTA Banner

**Estimasi Waktu:** 3-4 jam total, dibagi menjadi 3 phase

---

## Database Schema Design

### Table: `rollerblade_page_settings`

```sql
CREATE TABLE IF NOT EXISTS public.rollerblade_page_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Hero Section
  hero_image_url TEXT NOT NULL DEFAULT '',
  hero_title TEXT NOT NULL DEFAULT 'ROLLERBLADE ARENA',
  hero_subtitle TEXT NOT NULL DEFAULT 'Nikmati pengalaman bermain rollerblade yang seru bersama teman dan keluarga',
  
  -- Features Section
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Format: [{ 
  --   icon: "🛼", 
  --   title: "Peralatan Berkualitas", 
  --   description: "...", 
  --   details: ["...", "..."] 
  -- }]
  
  -- Gallery Section
  gallery_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Format: [{ 
  --   image: "/images/...", 
  --   caption: "Arena Luas & Aman", 
  --   category: "venue|equipment|activity" 
  -- }]
  
  -- CTA Section
  cta_image_url TEXT NOT NULL DEFAULT '',
  cta_title TEXT NOT NULL DEFAULT 'Siap untuk Pengalaman Rollerblade Seru?',
  cta_subtitle TEXT NOT NULL DEFAULT 'Datang langsung ke SparkStage Arena dan nikmati keseruan bermain rollerblade!',
  
  -- Section Fonts (optional - untuk future enhancement)
  section_fonts JSONB NOT NULL DEFAULT '{
    "hero": { "heading": "cardo", "body": "nunito_sans" },
    "features": { "heading": "cardo", "body": "nunito_sans" },
    "gallery": { "heading": "cardo", "body": "nunito_sans" },
    "cta": { "heading": "cardo", "body": "nunito_sans" }
  }'::jsonb,
  
  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default row
INSERT INTO public.rollerblade_page_settings (id)
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM public.rollerblade_page_settings);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_rollerblade_page_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_rollerblade_page_settings_updated_at
  BEFORE UPDATE ON public.rollerblade_page_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_rollerblade_page_settings_updated_at();

-- RLS Policies
ALTER TABLE public.rollerblade_page_settings ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Public read rollerblade page settings"
  ON public.rollerblade_page_settings
  FOR SELECT
  TO public
  USING (true);

-- Admin full access
CREATE POLICY "Admin full access for rollerblade page settings"
  ON public.rollerblade_page_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_role_assignments
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );
```

---

## Phase 1: Database & Backend Setup (45-60 menit)

### 1.1 Migration File
**File:** `supabase/migrations/YYYYMMDDHHMMSS_add_rollerblade_page_settings.sql`

**Tasks:**
- ✅ Create table `rollerblade_page_settings` with columns
- ✅ Add default data insert
- ✅ Create trigger function for updated_at
- ✅ Setup RLS policies (public read, admin write)
- ✅ Add audit log tracking if needed

### 1.2 TypeScript Types
**File:** `frontend/src/hooks/useRollerbladeSettings.ts`

```typescript
export interface RollerbladeFeature {
  id: number;
  icon: string;
  title: string;
  description: string;
  details: string[];
}

export interface RollerbladeGalleryItem {
  id: number;
  image: string;
  caption: string;
  category: 'venue' | 'equipment' | 'activity';
}

export interface RollerbladePageSettings {
  id: string;
  hero_image_url: string;
  hero_title: string;
  hero_subtitle: string;
  features: RollerbladeFeature[];
  gallery_items: RollerbladeGalleryItem[];
  cta_image_url: string;
  cta_title: string;
  cta_subtitle: string;
  section_fonts: {
    hero: { heading: string; body: string };
    features: { heading: string; body: string };
    gallery: { heading: string; body: string };
    cta: { heading: string; body: string };
  };
  created_at: string;
  updated_at: string;
}

export const DEFAULT_ROLLERBLADE_PAGE_SETTINGS: Omit<RollerbladePageSettings, 'id' | 'created_at' | 'updated_at'> = {
  hero_image_url: '/images/rollerblade-hero.jpg',
  hero_title: 'ROLLERBLADE ARENA',
  hero_subtitle: 'Nikmati pengalaman bermain rollerblade yang seru bersama teman dan keluarga',
  features: [
    {
      id: 1,
      icon: '🛼',
      title: 'Peralatan Berkualitas',
      description: 'Peralatan lengkap dari sepatu rollerblade hingga alat keselamatan untuk semua usia',
      details: [
        'Sepatu rollerblade berbagai ukuran (Kids, Teens, Adult)',
        'Helm keselamatan disesuaikan dengan ukuran kepala',
        'Pelindung lengkap (knee pad, elbow pad, wrist guard)',
        'Peralatan terawat dan dibersihkan secara rutin',
      ],
    },
    // ... 3 more features
  ],
  gallery_items: [
    { id: 1, image: '/images/rollerblade-gallery-1.jpg', caption: 'Arena Luas & Aman', category: 'venue' },
    // ... 5 more items
  ],
  cta_image_url: '/images/rollerblade-cta.jpg',
  cta_title: 'Siap untuk Pengalaman Rollerblade Seru?',
  cta_subtitle: 'Datang langsung ke SparkStage Arena dan nikmati keseruan bermain rollerblade!',
  section_fonts: {
    hero: { heading: 'cardo', body: 'nunito_sans' },
    features: { heading: 'cardo', body: 'nunito_sans' },
    gallery: { heading: 'cardo', body: 'nunito_sans' },
    cta: { heading: 'cardo', body: 'nunito_sans' },
  },
};
```

### 1.3 Custom Hook
**File:** `frontend/src/hooks/useRollerbladeSettings.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useRollerbladeSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['rollerblade-page-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rollerblade_page_settings')
        .select('*')
        .single();

      if (error) throw error;
      return data as RollerbladePageSettings;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<RollerbladePageSettings>) => {
      const { data, error } = await supabase
        .from('rollerblade_page_settings')
        .update(updates)
        .eq('id', settings?.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rollerblade-page-settings'] });
    },
  });

  return {
    settings,
    isLoading,
    error,
    updateSettings: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}
```

**Test:**
```bash
npm run supabase:db:push
# Verify table created in Supabase dashboard
```

---

## Phase 2: Frontend CMS Admin Page (90-120 menit)

### 2.1 Admin Page Component
**File:** `frontend/src/pages/admin/RollerbladePageManager.tsx`

**Features:**
- ✅ Hero Section editor (image + title + subtitle)
- ✅ Features Section editor (CRUD operations)
  - Add/Remove features
  - Edit icon, title, description
  - Manage detail items array
- ✅ Gallery Section editor (CRUD operations)
  - Add/Remove gallery items (up to 12)
  - Upload image or paste URL
  - Edit caption & category
- ✅ CTA Section editor (image + title + subtitle)
- ✅ Image upload via R2 bucket (reuse `uploadCmsAsset` helper)
- ✅ Loading & error states
- ✅ Save button with confirmation toast

**Layout Structure:**
```
<AdminLayout>
  <Section: Hero>
    - Image upload field
    - Title input
    - Subtitle textarea
  </Section>

  <Section: Features>
    [Add Feature Button]
    <FeatureCard #1>
      - Icon input (emoji)
      - Title input
      - Description textarea
      - Details array (add/remove items)
      [Remove Feature]
    </FeatureCard>
    ... repeat for each feature
  </Section>

  <Section: Gallery>
    [Add Gallery Item Button]
    <Grid: 2 cols mobile, 3 cols tablet/desktop>
      <GalleryCard #1>
        - Image upload/URL
        - Caption input
        - Category select (venue/equipment/activity)
        [Remove Item]
      </GalleryCard>
      ... repeat for each item
    </Grid>
  </Section>

  <Section: CTA>
    - Image upload field
    - Title input
    - Subtitle textarea
  </Section>

  <FixedBottomBar>
    [Save Changes Button]
  </FixedBottomBar>
</AdminLayout>
```

### 2.2 Reusable Components
**Files:**
- `frontend/src/components/admin/CmsAssetField.tsx` (already exists ✅)
- `frontend/src/components/admin/CmsSectionFontFields.tsx` (already exists ✅)

### 2.3 Menu Integration
**File:** `frontend/src/constants/adminMenu.ts`

Add to menu:
```typescript
{
  id: 'rollerblade-cms',
  label: 'Rollerblade CMS',
  path: '/admin/rollerblade-page',
  icon: '🛼',
  section: 'content', // atau 'pages'
  roles: ['admin', 'super_admin'],
}
```

### 2.4 Route Integration
**File:** `frontend/src/App.tsx`

Add route:
```typescript
import RollerbladePageManager from './pages/admin/RollerbladePageManager';

// Inside routes
<Route path="/admin/rollerblade-page" element={<RollerbladePageManager />} />
```

---

## Phase 3: Frontend Page Integration (45-60 menit)

### 3.1 Update RollerbladePage
**File:** `frontend/src/pages/RollerbladePage.tsx`

**Changes:**
1. Remove static data constants (HERO_BANNER, FEATURES, GALLERY_ITEMS, CTA_BANNER)
2. Add `useRollerbladeSettings()` hook
3. Use dynamic data from CMS settings
4. Add loading skeleton
5. Remove developer notice banner

**Before:**
```tsx
const HERO_BANNER = { ... };
const FEATURES = [ ... ];
```

**After:**
```tsx
const { settings, isLoading } = useRollerbladeSettings();

if (isLoading) {
  return <PageTransition><LoadingSkeleton /></PageTransition>;
}

// Use settings.hero_image_url, settings.features, etc.
```

### 3.2 Loading States
Add skeleton loaders for better UX:
- Hero skeleton (gray gradient)
- Features skeleton (4 cards)
- Gallery skeleton (6 boxes)
- CTA skeleton

### 3.3 Error Handling
Add fallback to default data if settings fail to load:
```tsx
const displayData = settings || DEFAULT_ROLLERBLADE_PAGE_SETTINGS;
```

---

## Image Upload Strategy

### R2 Bucket Setup
**Bucket Name:** `rollerblade-assets` (or reuse existing `charm-bar-assets`)

**Folder Structure:**
```
/cms/rollerblade/
  /hero/rollerblade-hero-{timestamp}.jpg
  /features/feature-{index}-{timestamp}.jpg
  /gallery/gallery-{index}-{timestamp}.jpg
  /cta/rollerblade-cta-{timestamp}.jpg
```

**Image Guidelines:**
- Hero & CTA: 1920x1080px (16:9 ratio), max 500KB
- Gallery: 1200x800px (3:2 ratio), max 200KB
- Compress before upload using Sharp or ImageMagick

**Helper Function:**
```typescript
// frontend/src/lib/cmsAssetUpload.ts (already exists)
export async function uploadCmsAsset(params: {
  file: File;
  bucket: 'rollerblade-assets';
  prefix: 'hero' | 'features' | 'gallery' | 'cta';
  kind: 'image';
  folder: 'cms';
  showToast: (type: string, message: string) => void;
  onUploaded: (url: string) => void;
}): Promise<void> {
  // Implementation similar to CharmBarPageManager
}
```

---

## Testing Checklist

### Database Tests
- [ ] Migration runs successfully
- [ ] Default row inserted
- [ ] RLS policies work (public read, admin write)
- [ ] Trigger updates `updated_at`

### Admin Page Tests
- [ ] Page loads without errors
- [ ] Can edit hero section
- [ ] Can add/remove features
- [ ] Can edit feature details
- [ ] Can add/remove gallery items
- [ ] Can upload images to R2
- [ ] Can edit CTA section
- [ ] Save button works
- [ ] Toast notifications appear
- [ ] Loading states work

### Frontend Page Tests
- [ ] Page loads with CMS data
- [ ] Loading skeleton appears
- [ ] All sections render correctly
- [ ] Images load from R2/CDN
- [ ] Fallback to defaults if CMS fails
- [ ] Responsive on mobile/tablet/desktop
- [ ] No console errors

---

## Rollout Plan

### Step 1: Database Setup (10 min)
```bash
# Create migration file
npm run supabase:db:push

# Verify in Supabase dashboard
# - Table exists
# - Default row inserted
# - Policies work
```

### Step 2: Backend Hook (15 min)
```bash
# Create useRollerbladeSettings.ts
# Test with console.log in RollerbladePage
```

### Step 3: Admin Page (90 min)
```bash
# Create RollerbladePageManager.tsx
# Add to menu & routes
# Test all CRUD operations
```

### Step 4: Frontend Integration (45 min)
```bash
# Update RollerbladePage.tsx
# Remove static data
# Add loading states
# Test end-to-end
```

### Step 5: Image Migration (30 min)
```bash
# Upload existing images to R2
# Update URLs in database
# Verify all images load
```

### Step 6: Production Deploy (15 min)
```bash
npm run build
npm run supabase:db:push  # production
# Deploy frontend to Vercel/production
```

---

## Future Enhancements (Optional)

### Phase 4: Advanced Features
1. **Drag & Drop Reordering**
   - Sortable features list
   - Sortable gallery grid
   - Use `@dnd-kit/sortable` library

2. **Image Crop & Resize**
   - Built-in image editor
   - Auto-resize to recommended dimensions
   - Use `react-image-crop` library

3. **Preview Mode**
   - Preview changes before save
   - Side-by-side editor/preview
   - Mobile preview mode

4. **Version History**
   - Track changes with timestamps
   - Revert to previous versions
   - Diff view

5. **Multi-language Support**
   - English & Indonesian content
   - Language switcher in CMS
   - Separate columns: `hero_title_id`, `hero_title_en`

---

## Dependencies

**Already Available:**
- ✅ `@tanstack/react-query` for data fetching
- ✅ `supabase-js` for database access
- ✅ `AdminLayout` component
- ✅ `CmsAssetField` component
- ✅ `Toast` notifications
- ✅ R2 upload helpers

**No New Dependencies Needed!**

---

## Risk Mitigation

### Data Loss Prevention
- Always have default fallback data
- Validate JSON before save
- Add database backups before deploy

### Image Upload Failures
- Show upload progress
- Retry on failure
- Keep old URL if upload fails
- Validate file size/type before upload

### Breaking Changes
- Test in staging first
- Keep old static data as backup
- Easy rollback plan (keep old code in git)

---

## Success Metrics

1. ✅ Admin can edit all 4 sections without developer help
2. ✅ Image upload works reliably
3. ✅ Changes reflect on live page immediately
4. ✅ No performance degradation (page load < 2s)
5. ✅ Mobile responsive (tested on 3 devices)
6. ✅ Zero console errors in production

---

## Timeline Summary

| Phase | Task | Time |
|-------|------|------|
| Phase 1 | Database & Backend | 45-60 min |
| Phase 2 | Admin CMS Page | 90-120 min |
| Phase 3 | Frontend Integration | 45-60 min |
| **Total** | **End-to-End** | **3-4 hours** |

---

## Notes

- Mengikuti pattern CharmBarPageManager yang sudah ada ✅
- Reuse components yang sudah stabil ✅
- Fokus pada CRUD operations yang sederhana ✅
- No over-engineering - simple & functional ✅
- Dokumentasi lengkap untuk future maintenance ✅

---

**Status:** 📋 **PLAN READY - WAITING FOR APPROVAL**

**Next Step:** Review plan dengan user, kemudian execute Phase 1 → Phase 2 → Phase 3
