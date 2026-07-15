# On-Stage Promo Package UI Enhancement

## Overview
Enhanced UI untuk mengelola promo packages di halaman CMS On-Stage dengan fitur add/remove individual items.

## Changes (2026-07-15)

### Before
- Textarea dengan input manual (pisahkan dengan koma)
- Tidak ada visual feedback untuk setiap item
- Sulit untuk edit/hapus item tertentu

### After
- ✅ Individual input box untuk setiap paket
- ✅ Button "Tambah Paket" dengan icon Plus
- ✅ Button delete per item dengan icon Trash (muncul on hover)
- ✅ Grid layout responsive (1 kolom mobile, 2 kolom tablet, 3 kolom desktop)
- ✅ Preview section menampilkan hasil final
- ✅ Empty state message jika belum ada paket

## Features

### 1. Add Package Button
```tsx
<button onClick={addPromoPackage}>
  <Plus className="w-4 h-4" />
  Tambah Paket
</button>
```
- Location: Top right of "Daftar Paket" section
- Style: Gray background with hover effect
- Icon: Plus icon dari Lucide React

### 2. Individual Package Input
- Rounded box with border
- Placeholder: "Paket 1 (contoh: Snow, Winter)"
- Focus: Pink border (brand color)
- Auto-numbered placeholder

### 3. Delete Button (Per Item)
```tsx
<button onClick={() => removePromoPackage(idx)}>
  <Trash2 className="w-3.5 h-3.5" />
</button>
```
- Location: Top-right corner of each package box
- Visibility: Hidden by default, muncul on hover
- Style: White background, red text, rounded full
- Icon: Trash2 icon dari Lucide React

### 4. Preview Section
- Blue background dengan border
- Menampilkan hasil join packages dengan koma
- Format: "Preview: Snow, Winter, Frozen (VIP)"
- Only visible jika ada packages

### 5. Empty State
- Centered message ketika belum ada paket
- Text hint: "Klik Tambah Paket untuk mulai menambahkan"

## UI Layout

```
┌─────────────────────────────────────────────────────────┐
│ DAFTAR PAKET                      [+ Tambah Paket]      │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │    [×]       │  │    [×]       │  │    [×]       │  │
│  │ Snow         │  │ Winter       │  │ Frozen (VIP) │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │    [×]       │  │    [×]       │                    │
│  │ Snow (2 Pax) │  │ Winter (2)   │                    │
│  └──────────────┘  └──────────────┘                    │
├─────────────────────────────────────────────────────────┤
│ 📘 Preview: Snow, Winter, Frozen (VIP), Snow (2 Pax)... │
└─────────────────────────────────────────────────────────┘
```

## Technical Details

### State Management
```typescript
// Promo package helpers
const promoPackages = (formData.promo_packages as string[]) || [];

const addPromoPackage = () => {
  handleChange("promo_packages", [...promoPackages, ""]);
};

const updatePromoPackage = (index: number, value: string) => {
  const next = [...promoPackages];
  next[index] = value;
  handleChange("promo_packages", next);
  setPackagesText(next.filter(Boolean).join(", "));
};

const removePromoPackage = (index: number) => {
  const next = promoPackages.filter((_, i) => i !== index);
  handleChange("promo_packages", next);
  setPackagesText(next.filter(Boolean).join(", "));
};
```

### Data Sync
- Individual inputs ↔ `promo_packages` array (bidirectional)
- Legacy `packagesText` textarea removed dari UI (kept in state for backward compatibility)
- Preview automatically updates on any change

### Responsive Grid
```css
grid-cols-1          /* Mobile: 1 column */
md:grid-cols-2       /* Tablet: 2 columns */
lg:grid-cols-3       /* Desktop: 3 columns */
```

## User Flow

1. **Add Package:**
   - Click "Tambah Paket" button
   - New empty input box muncul
   - Type package name (contoh: "Snow")
   - Preview updates automatically

2. **Edit Package:**
   - Click input box untuk edit
   - Type or modify text
   - Preview updates real-time

3. **Delete Package:**
   - Hover over package box
   - Delete button (×) muncul di top-right
   - Click delete button
   - Package removed instantly
   - Preview updates automatically

## Benefits

✅ **Intuitive:** Visual per item, lebih mudah dipahami
✅ **Efficient:** Quick add/remove tanpa edit seluruh text
✅ **Safe:** Less error-prone dibanding manual comma-separated input
✅ **Consistent:** Sama dengan Carousel Images UI pattern
✅ **Responsive:** Works well di semua screen sizes
✅ **Accessible:** Clear labels and hover states

## Files Modified
- `frontend/src/pages/admin/OnStagePageManager.tsx`

## Icons Used
- `Plus` (lucide-react): Add package button
- `Trash2` (lucide-react): Delete package button

## Testing Checklist

- [ ] Add package: Button berfungsi, input box baru muncul
- [ ] Remove package: Hover menampilkan delete button, click menghapus item
- [ ] Edit package: Input changes real-time, preview updates
- [ ] Empty state: Message muncul jika tidak ada packages
- [ ] Preview: Shows comma-separated list correctly
- [ ] Responsive: Layout adapts pada mobile, tablet, desktop
- [ ] Save: Data tersimpan ke database dengan format array
- [ ] Load: Existing packages dimuat dengan benar

## Related
- Similar pattern: Image Carousel section (`carousel_images`)
- Database field: `onstage_page_settings.promo_packages` (text[] array)

## Status
✅ **COMPLETE** - Ready for testing

## Date
2026-07-15
