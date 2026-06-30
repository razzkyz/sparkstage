# Product Categorization Refactor Plan

## 1. Latar Belakang & Tujuan
Sistem pengkategorian produk saat ini memiliki keterbatasan, di mana pengelompokannya terbagi menjadi Kategori Utama dan Kategori Retail yang terkadang kurang hierarkis. Tujuan dari rencana ini adalah:
1. Merapikan struktur pengkategorian menjadi hierarki yang jelas: **Department -> Category -> Sub-Category**.
2. Memperbarui fitur **Export dan Import Excel** agar mencerminkan 4 pilar utama: `Department`, `Category`, `Sub-Category`, dan `Variants`.
3. Memastikan di dalam file Excel **semuanya tetap berupa Teks/Nama String** (bukan ID angka), agar admin toko tetap mudah membacanya.
4. **Zero Downtime & Zero Disruption**: Memastikan proses migrasi ini tidak mengganggu berjalannya production, khususnya alur transaksi, kasir, dan integrasi inventory.

---

## 2. Struktur Database (Non-Destructive Strategy)
Untuk menjaga keamanan production, kita tidak akan melakukan `DROP COLUMN` pada struktur yang sedang dipakai (seperti `category_id` atau `retail_category_id`). Kita akan menggunakan pendekatan penambahan bertahap (additive changes).

### Tabel yang Direncanakan (Atau disesuaikan dari yang sudah ada)
*   **`departments`** (id, name, slug, is_active) - *Contoh: Fashion, Beauty, F&B*
*   **`categories`** (id, department_id, name, slug, is_active) - *Contoh: Menswear, Womenswear*
*   **`sub_categories`** (id, category_id, name, slug, is_active) - *Contoh: T-Shirts, Pants, Outerwear*

### Perubahan pada Tabel `products`
Kita akan menambahkan kolom baru sebagai Nullable (opsional) agar insert produk dari fitur lama tidak error:
```sql
ALTER TABLE public.products 
ADD COLUMN department_id INT REFERENCES departments(id),
ADD COLUMN sub_category_id INT REFERENCES sub_categories(id);
```
*(Catatan: Kolom `category_id` sudah ada, nanti kita hanya perlu menyesuaikan foreign key-nya atau mereferensikannya ke struktur baru).*

---

## 3. Logika Import / Export Excel

Sesuai permintaan, **semua data pengkategorian di Excel harus berupa teks**.

### A. Export & Template Excel
File Excel (Template dan Stock Report) akan men-generate header berikut:
- `Product Name`
- `SKU`
- `Description`
- `Department` *(Teks)*
- `Category` *(Teks)*
- `Sub-Category` *(Teks)*
- `Variant Name`, `Variant SKU`, `Size`, `Color`, `Price`, `Stock`

Script akan otomatis melakukan `JOIN` dari DB untuk mendapatkan *nama* departemen dan kategori, lalu menampilkannya sebagai teks di Excel.

### B. Import Excel
Di `frontend/src/utils/storeExcelUtils.ts`, kita akan mengubah logika parsing:
1. Sistem membaca cell teks `Department` (misal: "Fashion").
2. Sistem mencari ID dari "Fashion" di database. Jika tidak ada, bisa memunculkan peringatan atau auto-create (tergantung aturan bisnis yang akan kita sepakati).
3. Melakukan hal yang sama untuk `Category` dan `Sub-Category` secara berurutan.
4. Data yang dikirim ke Supabase untuk di-insert tetap berupa `department_id`, `category_id`, dan `sub_category_id`, namun bagi *User/Admin*, mereka hanya berurusan dengan teks di Excel.

---

## 4. Fase Eksekusi

### Fase 1: Database Migration (SQL)
- Membuat file migrasi baru di `supabase/migrations/`.
- Membuat tabel hierarki baru (jika belum ada) dan menambahkan kolom relasi ke `products` tanpa menghapus yang lama.
- Membuat RLS (Row Level Security) untuk tabel-tabel kategori yang baru.

### Fase 2: Auto-Backfill Migrasi Data (Otomatis tanpa isi manual)
- Di dalam script SQL yang sama (atau terpisah), kita akan menyisipkan perintah untuk **menyalin dan memetakan data lama secara otomatis** ke kolom baru.
- **Contoh:** Produk yang tadinya punya Kategori Utama "Fashion" akan otomatis diset `Department = Fashion`.
- Ini memastikan bahwa saat Anda pertama kali meng-export Excel dengan sistem baru, kolom Department dan Category **sudah terisi penuh oleh sistem**, sehingga Anda tidak perlu mengetik ulang secara manual dari awal.

### Fase 3: Backend Types & Helpers
- Menjalankan sinkronisasi tipe TS (`database.types.ts`).
- Mengupdate hooks (seperti `useCategories.ts`) untuk mengambil data dari struktur hierarki yang baru.

### Fase 4: Update Fitur Excel (Frontend)
- Mengubah `ProductCSVImportModal.tsx` untuk menampilkan instruksi format kolom yang baru.
- Mengubah fungsi `downloadStoreProductTemplateExcel` dan `parseStoreProductsFromFile` di `storeExcelUtils.ts` untuk mengakomodasi teks `Department`, `Category`, dan `Sub-Category`.
- Setelah ini selesai, saat Anda menekan tombol Export, data yang keluar sudah terisi lengkap dengan struktur baru.

