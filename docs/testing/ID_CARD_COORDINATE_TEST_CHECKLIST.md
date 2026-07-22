# ID Card Coordinate Fix - Test Checklist

## Pre-Test Setup

- [ ] Server running: `npm run dev`
- [ ] Login sebagai admin/super_admin
- [ ] Navigate ke `/admin/dev-id-card-test`
- [ ] Siapkan sample foto untuk upload

## Test Case 1: Default Coordinates

**Tujuan:** Verifikasi koordinat default sudah lebih baik

- [ ] Input data:
  - Name: "John Doe"
  - Serial: "SPARK-001"
  - Zodiac: "Aries"
  - Hobby: "Dancing"
- [ ] Upload foto sample
- [ ] Cek preview di browser:
  - [ ] Name sejajar dengan label "Name" di template
  - [ ] Zodiac sejajar dengan label "Zodiac"
  - [ ] Hobby sejajar dengan label "Hobby"
- [ ] Download PDF (Depan + Belakang)
- [ ] Buka PDF dengan Adobe Reader
- [ ] Zoom 100% (Actual Size)
- [ ] **Visual check:** Text position di PDF match dengan preview?
  - [ ] Name: ✅ Pas / ❌ Masih meleset
  - [ ] Zodiac: ✅ Pas / ❌ Masih meleset
  - [ ] Hobby: ✅ Pas / ❌ Masih meleset

## Test Case 2: Fine-Tuning Slider

**Tujuan:** Verifikasi slider adjustment berfungsi

- [ ] **Name slider test:**
  - [ ] Geser ke -10: Text naik 10px?
  - [ ] Geser ke +10: Text turun 10px?
  - [ ] Preview update real-time?
- [ ] **Zodiac slider test:**
  - [ ] Geser ke -5: Text naik 5px?
  - [ ] Geser ke +5: Text turun 5px?
- [ ] **Hobby slider test:**
  - [ ] Geser ke -5: Text naik 5px?
  - [ ] Geser ke +5: Text turun 5px?
- [ ] **Reset button:**
  - [ ] Klik "Reset Semua"
  - [ ] Semua slider kembali ke 0?
  - [ ] Preview kembali ke posisi default?

## Test Case 3: Adjustment → PDF

**Tujuan:** Verifikasi adjustment diterapkan di PDF

- [ ] Adjust koordinat dengan slider sampai pas di preview
- [ ] Catat adjustment values:
  - Name: _____ px
  - Zodiac: _____ px
  - Hobby: _____ px
- [ ] Download PDF
- [ ] Buka PDF dengan Adobe Reader
- [ ] **Verifikasi:** Posisi di PDF match dengan preview yang sudah adjust?

## Test Case 4: Copy Final Coordinates

**Tujuan:** Verifikasi tombol copy koordinat

- [ ] Setelah adjust slider
- [ ] Klik "📋 Copy Koordinat Final (Console)"
- [ ] Alert muncul dengan koordinat?
- [ ] Buka browser console (F12)
- [ ] **Verifikasi:** Console log menunjukkan koordinat final?
- [ ] Format koordinat benar? (e.g., `{ name: { top: "85px" }, ... }`)

## Test Case 5: Various Names (Edge Cases)

**Tujuan:** Test dengan berbagai panjang nama

- [ ] **Nama pendek:** "Jo"
  - [ ] Preview OK?
  - [ ] PDF OK?
- [ ] **Nama panjang:** "Alexander Sebastian"
  - [ ] Preview OK?
  - [ ] PDF OK?
  - [ ] Text terpotong? (jika ya, perlu adjust width)
- [ ] **Nama dengan karakter khusus:** "María José"
  - [ ] Preview OK?
  - [ ] PDF OK?

## Test Case 6: Actual Print (If Printer Available)

**Tujuan:** Verifikasi hasil print fisik

⚠️ **Only if Epson L8050 available**

- [ ] Printer setup:
  - [ ] PVC Card Tray terpasang
  - [ ] Media: PVC Card loaded
- [ ] Print settings:
  - [ ] Paper size: 85.6 × 54mm
  - [ ] Orientation: Landscape
  - [ ] Scale: Actual size (100%)
  - [ ] No fit-to-page
- [ ] Print PDF Depan
- [ ] Print PDF Belakang
- [ ] **Visual check:**
  - [ ] Text pas di template area?
  - [ ] Foto tidak terpotong?
  - [ ] Barcode terbaca?
  - [ ] Warna sesuai?

## Test Case 7: Multiple Templates

**Tujuan:** Test dengan berbagai template (jika ada di database)

- [ ] Pilih template berbeda di dropdown
- [ ] Koordinat berubah sesuai template config?
- [ ] Preview update dengan template image baru?
- [ ] Download PDF dengan template baru OK?

## Issues Found

| Issue | Severity | Description | Status |
|-------|----------|-------------|--------|
| | | | |
| | | | |

## Final Result

- [ ] **PASS** - Koordinat sudah pas, tidak perlu adjustment
- [ ] **PASS with Adjustment** - Perlu adjustment kecil, tapi slider berfungsi
- [ ] **FAIL** - Masih ada masalah koordinat yang tidak bisa diselesaikan

## Notes

Catatan tambahan dari testing:

---

## Koordinat Final Recommended

Setelah testing, koordinat yang paling optimal:

```typescript
const TEMPLATE_FRONT = {
  name: { top: "_____px" },
  zodiac: { top: "_____px" },
  hobby: { top: "_____px" },
};
```

## Sign-off

- **Tester:** _______________
- **Date:** _______________
- **Environment:** Dev / Staging / Production
- **Browser:** Chrome / Firefox / Safari / Edge
- **OS:** Windows / Mac / Linux
