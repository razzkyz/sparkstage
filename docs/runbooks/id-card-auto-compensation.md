# ID Card - Auto Compensation System

## Overview

Sistem ID Card sekarang memiliki **automatic offset compensation** yang memastikan hasil PDF sesuai dengan preview yang terlihat di layar.

## Cara Kerja

### 1. Template Manager (`/admin/id-card-templates`)

Admin mengatur koordinat posisi text di template:

```
Name: top 87px, left 175px
Zodiac: top 115px, left 175px
Hobby: top 143px, left 175px
```

### 2. Print Test (`/admin/dev-id-card-test`)

- **Preview**: Menampilkan ID Card dengan koordinat **asli** dari template
- **PDF Generation**: Otomatis menambahkan **offset kompensasi** di belakang layar

### 3. Hasil

✅ **Preview = PDF Result**  
Tidak ada perbedaan antara yang terlihat di layar dengan hasil PDF

## Untuk Admin

### Mengatur Koordinat Template

1. Buka `/admin/id-card-templates`
2. Pilih template atau buat baru
3. Atur koordinat berdasarkan **visual preview**
4. Koordinat yang Anda atur adalah koordinat yang akan terlihat di preview
5. Simpan

### Generate PDF

1. Buka `/admin/dev-id-card-test`
2. Pilih template dari dropdown
3. Input data customer
4. Upload foto
5. Cek preview - apakah posisi text sudah sesuai?
6. Klik "Unduh PDF Depan + Belakang"
7. PDF akan otomatis disesuaikan agar sesuai dengan preview

## Catatan Penting

- **Jangan edit** koordinat untuk kompensasi PDF - sistem akan handle otomatis
- Koordinat di template adalah koordinat "ideal" untuk preview
- System akan otomatis adjust saat generate PDF
- Jika hasil PDF tidak sesuai preview, hubungi developer (bukan masalah koordinat template)

## Technical Notes (For Developers)

### PDF Offset Compensation

```typescript
const PDF_OFFSET = {
  name: -7,    // Preview 87px → PDF 80px
  zodiac: -8,  // Preview 115px → PDF 107px
  hobby: -9,   // Preview 143px → PDF 134px
};
```

### Dual Rendering Architecture

- **Preview Render**: Visible, menggunakan koordinat template asli
- **PDF Render**: Hidden, menggunakan koordinat + offset kompensasi
- `html2canvas` hanya render element PDF (dengan offset)

### Adjust Offset

Jika hasil PDF masih tidak match preview, edit constant `PDF_OFFSET` di:
```
frontend/src/pages/admin/DevIDCardTest.tsx
```

## Troubleshooting

### Preview OK tapi PDF meleset

→ Adjust nilai di `PDF_OFFSET` constant

### Preview meleset

→ Edit koordinat di Template Manager (`/admin/id-card-templates`)

### PDF dan Preview sama-sama meleset

→ Koordinat template salah, perbaiki di Template Manager

## Benefits

✅ Admin tidak perlu mikir tentang kompensasi PDF  
✅ Koordinat di database tetap clean (nilai asli)  
✅ Preview reliable - apa yang dilihat = apa yang didapat  
✅ Maintainable - offset terpusat di satu tempat  
✅ Flexible - bisa adjust per-field  

---

**Last Updated:** 2026-07-22  
**System:** Automatic PDF Offset Compensation v1.0
