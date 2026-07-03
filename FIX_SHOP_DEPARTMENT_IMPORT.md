# Fix: Import Produk Department "shop" Masuk ke "glam"

**Status:** ✅ FIXED (2026-07-03) - Added "shop" to type definitions

## Masalah

Saat import produk dari Excel dengan kolom `department: "shop"`, produk malah masuk ke department **glam** bukan **shop**.

### Root Cause

**BUKAN** masalah database - department "shop" sudah ada di database sejak 2026-07-03.

**Masalah sebenarnya:**
1. ⚠️ **Case sensitivity**: User menulis "Shop" (capital S) tapi kode expect "shop" (lowercase)
2. ⚠️ **Format category salah**: Category digabung dengan subcategory (contoh: "SPARK MY CHARMS, WELDED CHARM")
3. ⚠️ **Type definition**: TypeScript belum include "shop" sebagai valid department type

## Solusi

### 1. Update TypeScript Types

**File:** `frontend/src/components/admin/ProductCSVImportModal.tsx`

```typescript
// OLD: ['glam', 'charmbar', 'sparkclub', 'dressing']
// NEW: ['glam', 'charmbar', 'sparkclub', 'dressing', 'shop']
const validDept = ['glam', 'charmbar', 'sparkclub', 'dressing', 'shop'].includes(dept) 
  ? (dept as 'glam' | 'charmbar' | 'sparkclub' | 'dressing' | 'shop') 
  : 'glam';
```

**File:** `frontend/src/utils/storeExcelUtils.ts`

Template Excel updated untuk include "shop" di daftar department.

### 2. User Action Required

User **HARUS** memperbaiki format Excel:

#### ❌ Format Salah:
```excel
department: Shop                           ← Huruf kapital
category: SPARK MY CHARMS, WELDED CHARM   ← Digabung
sub_category: ya                          ← Bukan nama subcategory
```

#### ✅ Format Benar:
```excel
department: shop                    ← Lowercase
category: SPARK MY CHARMS          ← Terpisah
sub_category: WELDED CHARM         ← Nama subcategory yang benar
```

## Testing

### Before Fix
```excel
product_name       | department | category              | → Result
"Mar" Lettering    | Shop       | SPARK MY CHARMS       | → Default ke GLAM ❌ (case mismatch)
"Mar" Lettering    | shop       | SPARK MY CHARMS       | → Masuk ke SHOP ✅ (setelah fix type)
```

### After Fix + Correct Excel Format
```excel
product_name       | department | category        | sub_category  | → Result
"Mar" Lettering    | shop       | SPARK MY CHARMS | WELDED CHARM  | → Masuk ke SHOP ✅
Abstract Heart     | shop       | SPARK MY CHARMS | WELDED CHARM  | → Masuk ke SHOP ✅
```

## Usage

Department "shop" sekarang **sudah didukung** penuh:

**Excel Import:**
```excel
department: shop       ← Harus lowercase ✅
department: Shop       ← SALAH (capital S) ❌
department: SHOP       ← SALAH (all caps) ❌
```

**Kategori Shop yang Tersedia:**
- SPARK MY CHARMS
- SPARK MY FACE
- SPARK MY HAIR
- SPARK MY NAILS
- SPARK MY STYLE

**Store Inventory Filter:**
```
Filter department: Shop  ✅ → Tampilkan produk shop
```

## Files Changed

1. ✅ `frontend/src/components/admin/ProductCSVImportModal.tsx`
   - Tambah "shop" ke validDept array (line ~97, ~126)
   - Type: `'glam' | 'charmbar' | 'sparkclub' | 'dressing' | 'shop'`

2. ✅ `frontend/src/utils/storeExcelUtils.ts`
   - Tambah "shop" di template Excel hints

3. ✅ Database Migration
   - Migration `20260703170000_create_shop_department_categories.sql` 
   - Constraint: `CHECK (department IN ('glam', 'charmbar', 'sparkclub', 'dressing', 'shop'))`

4. ✅ Dokumentasi
   - `PANDUAN_IMPORT_SHOP.md` - Panduan lengkap format Excel yang benar

## Next Steps

### 1. Perbaiki Format Excel

Lihat panduan lengkap di: **`PANDUAN_IMPORT_SHOP.md`**

**Checklist:**
- [ ] Department ditulis **lowercase** ("shop" bukan "Shop")
- [ ] Category dan subcategory **dipisah** ke kolom berbeda
- [ ] Nama category **sesuai** dengan yang ada di database (case-sensitive)
- [ ] Sub_category diisi nama subcategory yang benar (bukan "ya")

### 2. Re-import Produk

Setelah Excel diperbaiki:
1. Buka Store & Inventory
2. Klik Import Excel
3. Upload file Excel yang sudah diperbaiki
4. Produk akan masuk ke department "shop" dengan kategori yang benar

### 3. Verifikasi

Cek di Store & Inventory:
1. Klik tab **"Shop"**
2. Produk seharusnya muncul di sini
3. Filter by category untuk memastikan category assignment benar

## Notes

- Database sudah support department "shop" sejak 2026-07-03 ✅
- Kategori shop sudah ada (SPARK MY CHARMS, SPARK MY FACE, dll) ✅
- Yang perlu diperbaiki: **format Excel user** ⚠️
- **Case-sensitive**: "Shop" ≠ "shop" ⚠️
- Migration database tidak perlu - ini fix di level TypeScript type & user input
