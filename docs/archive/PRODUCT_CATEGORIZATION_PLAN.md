# Product Categorization Refactor Plan

**Tujuan:**
Menerapkan sistem kategori berhirarki (Department ➔ Category ➔ Sub-Category) pada tabel utama `products` yang digunakan oleh toko fisik (Kasir) dan *production*.

**Kriteria Sukses & Batasan:**
1. **Barcode & SKU Fisik AMAN:** Tidak ada perubahan pada ID produk maupun `product_variants.sku` sehingga barcode fisik tetap bisa di-scan.
2. **DOKU Payment AMAN:** Tidak ada perubahan pada alur pembayaran DOKU karena referensi ID dan harga dipertahankan.
3. **Tanpa Tabel Baru:** Memanfaatkan tabel `retail_categories` yang sudah ada (struktur *Department > Category*).
4. **Zero Downtime:** Menerapkan strategi *Expand & Contract* (kolom lama dibiarkan dulu selama masa transisi).

---

## Phase 1: Database Expansion (Non-Breaking Schema Change)

Fase ini bertujuan untuk menyiapkan "wadah" kategori baru di dalam tabel `products` tanpa menghapus atau mengubah tabel yang sudah ada.

- [ ] **Buat File Migrasi Database**: Buat file `supabase/migrations/XXXXXXXX_add_retail_categories_to_products.sql`.
- [ ] **Add Columns**: Tambahkan `retail_category_id` dan `retail_subcategory_id` ke tabel `products`.
  ```sql
  ALTER TABLE public.products 
  ADD COLUMN retail_category_id BIGINT REFERENCES public.retail_categories(id) ON DELETE SET NULL,
  ADD COLUMN retail_subcategory_id BIGINT REFERENCES public.retail_categories(id) ON DELETE SET NULL;
  ```
- [ ] **Add Indexes**: Tambahkan index untuk mempercepat pencarian (contoh: `idx_products_retail_category_id`).
- [ ] **Deploy Migrasi**: Jalankan `npm run supabase:db:push`. *Aman dilakukan kapan saja karena tidak memodifikasi data yang ada.*

---

## Phase 2: Frontend Data Hooks & Types Update

Fase ini bertujuan agar aplikasi *frontend* menyadari keberadaan relasi kategori yang baru.

- [ ] **Update Interface**: Perbarui `ProductSummary`, `ProductRow`, dll di dalam `frontend/src/hooks/useProducts.ts` (dan file type lainnya) untuk menerima data dari `retail_categories`.
- [ ] **Update Query (useProducts.ts)**: Sesuaikan query Supabase untuk melakukan JOIN ke tabel `retail_categories`.
  ```typescript
  // Contoh modifikasi fetcher:
  .select(`
    id, name, description,
    retail_category_id, retail_subcategory_id,
    retail_categories!retail_category_id (department, name, slug),
    retail_subcategories:retail_categories!retail_subcategory_id (name, slug),
    ...
  `)
  ```

---

## Phase 3: CMS Admin Integration (Data Entry)

Memungkinkan tim Admin untuk memetakan produk-produk lama ke dalam kategori baru yang lebih rapi.

- [ ] **Update Halaman Edit Produk**: Di `/admin/products` atau CMS terkait, tambahkan *dropdown* berjenjang (Cascading Dropdown):
  1. Pilih Department (Glam / Charmbar / Sparkclub).
  2. Pilih Category.
  3. Pilih Sub-Category (Opsional).
- [ ] **Gunakan Data dari `useRetailCategories`**: Bind *dropdown* tersebut menggunakan hook `useRetailCategories` yang sudah ada.
- [ ] **Save Logic**: Pastikan saat Admin menekan "Save", data tersimpan ke `retail_category_id` dan `retail_subcategory_id` di tabel `products`. (Kolom kategori lama boleh tetap di-save untuk *fallback*/Dual-Write).

---

## Phase 4: Data Backfill (Mapping Data Lama)

Fase dimana operasional mulai memindahkan data dari sistem lama ke sistem baru.

- [ ] **Manual via CMS / Script Automation**: Admin masuk ke CMS, lalu melakukan "Bulk Update" atau *edit* satu-persatu untuk menetapkan setiap produk (yang tadinya berkategori statis) ke dalam *Department ➔ Category* yang baru.
- [ ] **Validasi**: Pastikan semua produk yang aktif di Kasir sudah memiliki nilai `retail_category_id` yang terisi.

---

## Phase 5: POS (Kasir) & Frontend Display Update

Fase peralihan dimana kita mengubah cara UI membaca filter kategori.

- [ ] **Update Filter Kasir**: Modifikasi UI Kasir (POS) agar filter kategorinya mengambil dari data *Department* dan *Category* yang baru (menggantikan filter kategori *legacy*).
- [ ] **Update UI Halaman Utama (Jika Ada)**: Ubah navigasi atau *Mega Menu* untuk menggunakan hirarki `retail_categories`.
- [ ] **Testing Penuh**: Lakukan testing proses *Checkout* di Kasir, *Scan Barcode*, dan simulasi DOKU. Karena `product_variants` tidak berubah, seharusnya fase ini akan berjalan dengan *smooth*.

---

## Phase 6: Cleanup (Optional Future)

Setelah sistem berjalan 100% menggunakan arsitektur baru selama beberapa minggu/bulan.

- [ ] Hapus logika *fallback* kategori lama dari *frontend*.
- [ ] Buat file migrasi untuk melakukan `DROP COLUMN` pada kolom kategori lama yang sudah usang di tabel `products`.
