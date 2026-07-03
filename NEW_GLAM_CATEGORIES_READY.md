# New Shop.GLAM Category Structure - Ready to Deploy

## Status: ✅ Ready to Deploy

Migration sudah siap untuk mengubah struktur kategori shop.GLAM sesuai permintaan atasan.

## Struktur Baru

### 1. SPARK MY FACE
- STAR GLITTER (untuk headliner, glitter, pop socket)
- GLITTER TATTO

### 2. SPARK MY HAIR
- SPARKLE HAIR TINSEL
- HAIR ACCESSORIES

### 3. SPARK MY CHARMS
- CHARMS BASE
- WELDED CHARMS
- PENDANT CHARMS
- KEYCHAINS
- NECKLACES
- RINGS
- BRACELET
- BANGLES

### 4. SPARK MY NAILS
(Tidak ada subcategory)

### 5. SPARK MY STYLE
- FASHION
- BAG
- EYEWEAR
- SCARVES
- BELTS
- ARM SLEEVES

## Total
- **5 main categories**
- **18 subcategories**
- **23 total categories**

---

## Files Created

### 1. Migration File
**File:** `supabase/migrations/20260703000000_update_glam_categories_structure.sql`
- Menghapus kategori lama (Makeup, Skincare, Haircare)
- Menambahkan 5 main categories
- Menambahkan 18 subcategories dengan parent relationship yang benar

### 2. Verification Script
**File:** `scripts/verify-new-glam-categories.sql`
- Menampilkan hierarchy kategori
- Menghitung jumlah per main category
- Checklist validation (harus 23 total categories)
- Cek orphaned subcategories

### 3. Check Current Data
**File:** `scripts/check-current-retail-categories.sql`
- Melihat struktur kategori yang ada sekarang
- Count by department

### 4. Migration Plan
**File:** `scripts/migration-plan-new-glam-categories.md`
- Dokumentasi lengkap perubahan

---

## How to Deploy

### Step 1: Check Current Data (Optional)
```bash
# Lihat kategori yang ada sekarang
npx supabase db execute -f scripts/check-current-retail-categories.sql
```

### Step 2: Run Migration
```bash
# Deploy migration ke database
npm run supabase:db:push
```

Atau manual:
```bash
npx supabase db push
```

### Step 3: Verify Results
```bash
# Verifikasi bahwa struktur baru sudah benar
npx supabase db execute -f scripts/verify-new-glam-categories.sql
```

Expected output dari verification:
- ✅ 23 total categories
- ✅ 5 main categories
- ✅ 18 subcategories
- No orphaned subcategories

---

## Database Impact

### What Gets Deleted
Kategori glam lama:
- Makeup
- Skincare  
- Haircare

### What Gets Added
23 kategori baru sesuai struktur SPARK MY di atas.

### What Stays Untouched
- Department 'charmbar' categories (tidak berubah)
- Department 'sparkclub' categories (tidak berubah)
- Table structure dan RLS policies (tetap sama)

---

## Rollback Plan

Jika ada masalah, migration bisa di-rollback:

```bash
# Lihat migration history
npx supabase migration list

# Rollback ke migration sebelumnya
npx supabase db reset
```

**Note:** Karena kita DELETE old data, rollback akan menghilangkan kategori baru. Jika ada produk yang sudah di-assign ke kategori baru, mereka akan kehilangan category assignment.

**Recommendation:** Jalankan migration saat tidak ada user yang sedang input produk, atau pastikan tidak ada produk yang ter-assign ke kategori lama (Makeup, Skincare, Haircare).

---

## Next Steps After Migration

1. ✅ Deploy migration
2. ✅ Verify dengan script verification
3. 🔜 Update frontend product form untuk menggunakan kategori baru
4. 🔜 Re-assign existing products ke kategori yang sesuai
5. 🔜 Update admin UI untuk show hierarchy (parent → child)

---

## Questions?

- **Q: Apakah produk yang sudah ada akan hilang?**
  - A: Tidak. Hanya kategori yang berubah. Produk tetap ada, tapi mungkin category assignment-nya perlu di-update.

- **Q: Apakah migration ini aman?**
  - A: Ya, tapi sebaiknya:
    1. Backup database dulu (optional)
    2. Run di local environment dulu untuk testing
    3. Verifikasi hasil dengan script verification
    4. Baru deploy ke production saat yakin

- **Q: Berapa lama migration ini?**
  - A: Sangat cepat, < 1 detik. Hanya INSERT/DELETE beberapa rows.

---

## Ready? 🚀

Tinggal jalankan:
```bash
npm run supabase:db:push
```

Then verify:
```bash
npx supabase db execute -f scripts/verify-new-glam-categories.sql
```

Done! ✨
