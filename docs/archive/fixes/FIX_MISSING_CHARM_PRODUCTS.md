# Fix Missing Charm Products - Indo Database

## Problem
Produk charm tidak muncul semua di web Indo karena ada yang masih di kategori lain, bukan di Lucky Charm (retail_category_id = 21).

## Solution
Pindahkan semua produk yang namanya mengandung "charm" ke kategori Lucky Charm.

---

## Step-by-Step Instructions

### STEP 1: Analyze (Read-Only)

1. Buka Supabase Dashboard SQL Editor:
   ```
   https://supabase.com/dashboard/project/hogzjapnkvsihvvbgcdb/sql
   ```

2. Copy & paste isi file `scripts/analyze-missing-charms.sql`

3. Klik **Run** atau tekan **Ctrl+Enter**

4. Review hasil query:
   - Query 1: Jumlah Lucky Charm sekarang (138 produk?)
   - Query 2: Produk dengan 'charm' di nama tapi BUKAN di Lucky Charm
   - Query 3: Summary produk charm per kategori

**Expected Result:**
- Akan muncul list produk charm yang masih di kategori lain
- Misalnya: di kategori "EDGY SOUL", "FOODIE", "HOBBY", etc.

---

### STEP 2: Move to Lucky Charm (Write)

⚠️ **BACKUP FIRST!** (Optional but recommended)

```sql
-- Backup current state (run this first if you want to be safe)
CREATE TABLE products_backup_20260701 AS 
SELECT * FROM products WHERE name ILIKE '%charm%';
```

1. Copy & paste isi file `scripts/move-charms-to-lucky-charm.sql`

2. Klik **Run** atau tekan **Ctrl+Enter**

3. Review hasil:
   - Akan muncul jumlah produk Lucky Charm setelah update
   - Harusnya jadi ~900+ produk (138 existing + sisanya yang dipindahkan)

---

### STEP 3: Verify on Website

1. Buka halaman Charm Bar di web:
   ```
   https://www.sparkstage55.com/charm-bar
   ```

2. Cek apakah semua produk charm sudah muncul

3. Refresh beberapa kali (clear cache jika perlu)

---

## Rollback (if needed)

Jika ada masalah dan ingin rollback:

```sql
-- Restore from backup (if you created backup in STEP 2)
UPDATE products p
SET 
    retail_category_id = b.retail_category_id,
    updated_at = NOW()
FROM products_backup_20260701 b
WHERE p.id = b.id;

-- Drop backup table after restore
DROP TABLE products_backup_20260701;
```

---

## Technical Details

**What it does:**
- Find all products where `name ILIKE '%charm%'` 
- Or products that have variants with `variant_name ILIKE '%charm%'`
- Update `retail_category_id` to 21 (LUCKY-CHARM)

**Database Changes:**
- Table: `products`
- Field: `retail_category_id`
- From: Various categories (EDGY SOUL, FOODIE, etc.)
- To: 21 (LUCKY-CHARM)

**Impact:**
- No data loss
- No price changes
- No image changes
- Only category assignment changes
- All products will now appear in Charm Bar page

---

## Files

1. `scripts/analyze-missing-charms.sql` - Read-only analysis
2. `scripts/move-charms-to-lucky-charm.sql` - Write update
3. `scripts/fix-missing-charm-products.sql` - Combined script (all-in-one)

---

## Questions?

- **Q: Apa yang terjadi dengan produk yang sudah ada di Lucky Charm?**
  - A: Tidak berubah. Script ini hanya update yang belum masuk.

- **Q: Apakah harga atau gambar berubah?**
  - A: Tidak. Hanya kategori yang berubah.

- **Q: Berapa lama prosesnya?**
  - A: ~5-10 detik untuk analisa, ~10-30 detik untuk update (tergantung jumlah produk).

- **Q: Apakah perlu restart server?**
  - A: Tidak. Changes langsung reflected di website.

---

## Status

- [x] Script created
- [ ] Analysis run (STEP 1)
- [ ] Update executed (STEP 2)
- [ ] Website verified (STEP 3)

Date: 2026-07-01
By: Kiro Agent
