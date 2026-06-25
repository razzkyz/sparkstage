# Rollerblade CMS Integration Guide

## Overview

Halaman Rollerblade (`/rollerblade`) dirancang sebagai **dashboard promosi** yang dapat dikelola melalui CMS. Halaman ini tidak memiliki sistem booking - pembayaran sesi dilakukan **on-site** (di lokasi) oleh admin yang menjaga.

## Current Status

✅ **Frontend Layout:** Complete - 5 section CMS-ready
⏳ **CMS Backend:** Pending implementation
⏳ **Admin Interface:** Pending implementation

## Page Structure

### Layout Sections (CMS-Ready)

Halaman terdiri dari **5 section utama** yang dapat dikelola melalui CMS:

#### 1. Hero Banner (Main)
- **Konten:** Banner utama dengan gambar, title, subtitle
- **Current Data:** `HERO_BANNER` object
- **Fields:**
  - `image`: URL gambar background (string)
  - `title`: Judul besar (string)
  - `subtitle`: Deskripsi singkat (string)
- **Styling:** Full-width, 70vh height, text overlay with gradient

#### 2. Promo Cards Grid
- **Konten:** 3 kartu promosi dengan gambar dan badge
- **Current Data:** `PROMO_CARDS` array
- **Fields per card:**
  - `id`: Unique identifier (number)
  - `image`: URL gambar (string)
  - `title`: Judul promo (string)
  - `description`: Deskripsi promo (string)
  - `badge`: Label badge (string, e.g. "PROMO", "NEW", "GRUP")
  - `badgeColor`: Tailwind class untuk warna badge (string)
- **Layout:** 3-column grid on desktop, stacked on mobile
- **Features:** Hover effects, image zoom, card lift animation

#### 3. Info Banner (Full-Width)
- **Konten:** Informasi tentang rollerblade + 4 feature cards
- **Current Data:** Static content in JSX
- **Fields:**
  - Main text: Title + 2 paragraphs (string)
  - Feature cards: Icon emoji, title, description (4 cards)
- **Styling:** Pink gradient background, white text overlay

#### 4. Gallery Grid
- **Konten:** Grid foto-foto rollerblade
- **Current Data:** `GALLERY_ITEMS` array
- **Fields per item:**
  - `id`: Unique identifier (number)
  - `image`: URL gambar (string)
  - `caption`: Keterangan foto (string)
- **Layout:** 4-column grid, aspect-square images
- **Features:** Hover overlay with caption, image zoom effect

#### 5. Bottom CTA Banner
- **Konten:** Call-to-action dengan info pembayaran
- **Current Data:** Static content in JSX
- **Fields:**
  - `title`: Judul CTA (string)
  - `subtitle`: Deskripsi (string)
  - `backgroundImage`: URL gambar background (string)
- **Styling:** Full-width, image overlay, centered text

## Database Schema (Proposal)

### Table: `rollerblade_content`
```sql
CREATE TABLE rollerblade_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_type TEXT NOT NULL, -- 'hero', 'promo', 'info', 'gallery', 'cta'
  section_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  content JSONB NOT NULL, -- Flexible JSON structure per section
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rollerblade_content_type ON rollerblade_content(section_type);
CREATE INDEX idx_rollerblade_content_active ON rollerblade_content(is_active);
```

### Example Content (JSONB)

**Hero Section:**
```json
{
  "image": "/images/rollerblade-hero.jpg",
  "title": "ROLLERBLADE ARENA",
  "subtitle": "Nikmati pengalaman bermain rollerblade yang seru"
}
```

**Promo Card:**
```json
{
  "image": "/images/promo-1.jpg",
  "title": "Weekend Special",
  "description": "Diskon 20% setiap akhir pekan!",
  "badge": "PROMO",
  "badgeColor": "bg-red-500"
}
```

## Frontend Integration

### Current Implementation (Static)
```typescript
// Location: frontend/src/pages/RollerbladePage.tsx

const HERO_BANNER = {
  image: "/images/rollerblade-hero.jpg",
  title: "ROLLERBLADE ARENA",
  subtitle: "Nikmati pengalaman bermain rollerblade yang seru"
};

const PROMO_CARDS = [
  { id: 1, image: "...", title: "...", ... }
];
```

### Future Implementation (Dynamic)
```typescript
// Create new hook: frontend/src/hooks/useRollerbladeContent.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useRollerbladeContent(sectionType: string) {
  return useQuery({
    queryKey: ['rollerblade-content', sectionType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rollerblade_content')
        .select('*')
        .eq('section_type', sectionType)
        .eq('is_active', true)
        .order('section_order');
      
      if (error) throw error;
      return data;
    }
  });
}

// Usage in RollerbladePage.tsx
const { data: heroData } = useRollerbladeContent('hero');
const { data: promoCards } = useRollerbladeContent('promo');
const { data: galleryItems } = useRollerbladeContent('gallery');
```

## Admin CMS Interface (Proposal)

### Required Pages

#### 1. Content List Page
**Route:** `/admin/rollerblade-content`

**Features:**
- Table view of all sections
- Filter by section type
- Quick enable/disable toggle
- Reorder sections (drag & drop)
- Edit/Delete actions

#### 2. Content Editor Modal
**Features per section type:**

**Hero Editor:**
- Image upload/URL input
- Title text input
- Subtitle textarea
- Preview pane

**Promo Card Editor:**
- Image upload
- Title & description inputs
- Badge text & color picker
- Display order
- Active/inactive toggle

**Gallery Editor:**
- Bulk image upload
- Caption per image
- Reorder images (drag & drop)
- Delete individual images

## Image Management

### Recommended Storage

**Option 1: Cloudflare R2 (Current)**
- Upload to: `sparkstage-public-assets` bucket
- Folder: `/rollerblade/`
- CDN URL: `https://cdn.sparkstage55.com/rollerblade/`
- Cost: Zero egress fees ✅

**Option 2: Supabase Storage**
- Bucket: `rollerblade-content`
- Public access
- Automatic image optimization

### Image Guidelines

**Hero Banner:**
- Dimensions: 1920x1080px (16:9)
- Format: JPG/WebP
- Max size: 500KB
- Aspect ratio: Landscape

**Promo Cards:**
- Dimensions: 800x800px (1:1 or 4:3)
- Format: JPG/WebP
- Max size: 300KB

**Gallery:**
- Dimensions: 600x600px (1:1 square)
- Format: JPG/WebP
- Max size: 200KB

## Implementation Checklist

### Phase 1: Database Setup
- [ ] Create `rollerblade_content` table
- [ ] Add RLS policies (admin write, public read)
- [ ] Seed initial data from current static content
- [ ] Create Edge Function for content CRUD (optional)

### Phase 2: Frontend Dynamic Loading
- [ ] Create `useRollerbladeContent` hook
- [ ] Update RollerbladePage to use dynamic data
- [ ] Add loading states
- [ ] Add error fallback (show static content)
- [ ] Test with Supabase realtime (optional)

### Phase 3: Admin Interface
- [ ] Create admin content list page
- [ ] Create content editor modal
- [ ] Add image upload component (R2/Supabase)
- [ ] Implement drag & drop reordering
- [ ] Add preview functionality
- [ ] Add publish/unpublish toggle

### Phase 4: Testing & Polish
- [ ] Test all CRUD operations
- [ ] Test image upload & display
- [ ] Mobile responsive check
- [ ] Performance optimization (image lazy loading)
- [ ] Add validation & error handling
- [ ] Documentation for content team

## Developer Notes

### Current State
Halaman sudah siap dengan layout lengkap dan placeholder data. Developer note ditampilkan di bottom halaman (dapat dihapus setelah CMS aktif).

### To Remove
Hapus developer notice di bottom page setelah CMS aktif:
```tsx
{/* CMS Integration Notice (Temporary - untuk developer) */}
<div className="bg-yellow-50 border-t-4 border-yellow-400 p-4">
  ...
</div>
```

### Migration Strategy
1. Buat table dan seed data
2. Test dynamic loading dengan existing content
3. Deploy admin interface
4. Train content team
5. Remove static data from code
6. Remove developer notice

## Content Team Guide (Future)

### Adding New Promo
1. Login ke admin panel
2. Navigate to "Rollerblade Content"
3. Click "Add Promo Card"
4. Upload image (800x800px, <300KB)
5. Fill title & description
6. Choose badge type & color
7. Preview & publish

### Updating Hero Banner
1. Navigate to "Rollerblade Content"
2. Click "Edit Hero"
3. Upload new banner image (1920x1080px)
4. Update title/subtitle if needed
5. Preview & save

### Managing Gallery
1. Navigate to "Rollerblade Content" > Gallery
2. Upload multiple images
3. Add captions
4. Drag to reorder
5. Publish changes

## Related Files

**Frontend:**
- `frontend/src/pages/RollerbladePage.tsx` - Main page component
- `frontend/src/app/routes/publicRoutes.ts` - Route definition
- `frontend/src/components/Navbar.tsx` - Navigation link

**Future:**
- `frontend/src/hooks/useRollerbladeContent.ts` - Data fetching hook
- `frontend/src/pages/admin/RollerbladeContentList.tsx` - Admin list page
- `frontend/src/pages/admin/RollerbladeContentEditor.tsx` - Admin editor
- `supabase/migrations/YYYYMMDDHHMMSS_create_rollerblade_content.sql` - DB schema

## Questions?

Contact: Development Team
Last Updated: 2026-06-24
