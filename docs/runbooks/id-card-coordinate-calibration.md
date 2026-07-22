# Panduan Kalibrasi Koordinat ID Card

## Masalah Umum

Saat PDF ID Card di-download dan dicetak, text (Name, Zodiac, Hobby) tidak tepat sesuai posisi di template - biasanya **turun** dari yang seharusnya.

## Penyebab

1. **Line-height default browser** - Browser menambahkan spacing vertical otomatis
2. **Font rendering berbeda** - Saat convert HTML → Canvas → PDF, font bisa render dengan ukuran sedikit berbeda
3. **html2canvas quirks** - Library html2canvas punya behavior rendering sendiri

## Solusi yang Diterapkan

### 1. Penyesuaian Koordinat Default

Koordinat di `DevIDCardTest.tsx` sudah disesuaikan:

```typescript
const TEMPLATE_FRONT = {
  name: {
    top: "85px",  // Disesuaikan: naik 7px dari 92px
  },
  zodiac: {
    top: "116px",  // Disesuaikan: naik 8px dari 124px
  },
  hobby: {
    top: "146px",  // Disesuaikan: naik 9px dari 155px
  },
};
```

### 2. CSS yang Lebih Ketat

Semua text element sekarang menggunakan:
- `lineHeight: '1'` (tidak ada extra spacing)
- `padding: 0` dan `margin: 0` (tidak ada offset tersembunyi)

### 3. Fine-Tuning UI (NEW)

Halaman dev test sekarang punya **slider adjustment** untuk real-time tuning:
- Range: -20px sampai +20px untuk setiap field
- Live preview langsung update
- Tombol "Copy Koordinat Final" untuk simpan hasil adjustment

## Cara Kalibrasi Manual

1. Buka `/admin/dev-id-card-test`
2. Input data test: Name, Zodiac, Hobby
3. Upload foto sample
4. Lihat preview
5. **Gunakan slider "Fine-Tuning Posisi Text"**:
   - Jika text terlalu tinggi → geser slider ke kanan (+)
   - Jika text terlalu rendah → geser slider ke kiri (-)
6. Download PDF dan test print
7. Ulangi sampai posisi pas
8. Klik **"Copy Koordinat Final"** untuk lihat angka final di console
9. Update koordinat di `TEMPLATE_FRONT`

## Update Koordinat Permanen

Setelah dapat koordinat yang pas dari slider, update file:

```typescript
// File: frontend/src/pages/admin/DevIDCardTest.tsx

const TEMPLATE_FRONT = {
  name: {
    top: "XXpx",  // Ganti dengan angka final dari slider
  },
  zodiac: {
    top: "YYpx",  // Ganti dengan angka final dari slider
  },
  hobby: {
    top: "ZZpx",  // Ganti dengan angka final dari slider
  },
};
```

## Catatan Printer

- **Printer:** Epson L8050
- **Media:** PVC Card Tray
- **Ukuran PDF:** 85.6mm × 54mm (landscape)
- **DPI Canvas:** 4x scale untuk hasil tajam

## Tips

- Test dengan **nama panjang** dan **nama pendek** untuk memastikan alignment konsisten
- Print beberapa kali untuk verifikasi consistency
- Koordinat yang cocok di screen preview belum tentu cocok di print - **selalu test print**
- Jika masih meleset, kemungkinan printer driver atau paper handling issue

## Troubleshooting Lanjutan

Jika masih ada masalah setelah adjustment:

1. **Cek printer settings:**
   - Paper size harus exact 85.6 × 54mm
   - No scaling/fit-to-page
   - Orientation: Landscape

2. **Cek PDF viewer:**
   - Buka dengan Adobe Reader (bukan browser)
   - Print dengan "Actual size" (100%)
   - No auto-rotate

3. **Cek template image:**
   - Resolusi harus 324px × 204px
   - Format PNG dengan transparency
   - Tidak ada distorsi/stretch

## Referensi

- Rencana fitur: `docs/decisions/ID_CARD_PRINTING_PLAN.md`
- Template dinamis: `docs/decisions/DYNAMIC_ID_CARD_TEMPLATES.md`
