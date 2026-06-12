# Retail Product Migration Roadmap & Golden Rules

## 🎯 Tujuan Utama
Menyelesaikan migrasi dari tabel lama (`products` & `product_variants`) ke tabel baru (`product_retail` & `retail_categories`) tanpa menyebabkan sedikitpun gangguan (downtime/error) pada website utama yang sedang berjalan di Production.

---

## 🌟 THE GOLDEN RULES: PARALLEL DEVELOPMENT
Aturan mutlak yang **TIDAK BOLEH DILANGGAR** oleh AI maupun Developer selama proses migrasi ini:

1. **HANYA MENAMBAH (ADDITIVE ONLY) PADA DATABASE**
   - ✅ **Boleh:** Menambahkan tabel baru, kolom baru (yang mengizinkan NULL), atau RPC baru.
   - ❌ **Dilarang Keras:** Menghapus (`DROP`), mengubah nama (`RENAME`), atau mengubah tipe data kolom/tabel yang masih digunakan oleh sistem lama (`products`, `product_variants`, `order_product_items.product_variant_id`).
   - *Tujuan:* Website utama tetap bisa beroperasi membaca skema database yang lama tanpa sadar ada perubahan.

2. **DUPLIKASI EDGE FUNCTIONS (JANGAN EDIT YANG LAMA)**
   - ✅ **Boleh:** Membuat folder Edge Function baru (contoh: `create-doku-retail-checkout`) untuk menangani proses checkout dan pembayaran dari tabel baru.
   - ❌ **Dilarang Keras:** Memodifikasi `create-doku-product-checkout` yang sedang aktif dipakai Production.
   - *Tujuan:* Transaksi pelanggan di live website tidak terganggu eksperimen kita.

3. **PERTahankan DATA HISTORIS PENJUALAN**
   - Transaksi masa lalu harus tetap utuh. Jangan hapus referensi `product_variant_id` dari pesanan-pesanan sebelumnya agar Sales Report tetap bisa diakses.

---

## 🗺️ Tahapan Eksekusi (Roadmap)

### Phase 1: Persiapan Database (Aman untuk Production)
- [x] Buat migrasi SQL untuk menambahkan kolom `retail_product_id` (NULLABLE) pada tabel `order_product_items`.
- [x] Buat/sesuaikan fungsi RPC untuk pengurangan & pengembalian stok (misal: `reserve_retail_stock` dan `release_retail_stock`) yang menargetkan kolom `stock` di `product_retail`.

### Phase 2: Persiapan Edge Functions (Backend)
- [x] Duplikasi Edge Function `create-doku-product-checkout` menjadi `create-doku-retail-checkout`.
- [x] Modifikasi `create-doku-retail-checkout` agar mengambil harga, stok, dan berat langsung dari `product_retail`.
- [x] Modifikasi webhook handler (atau buat penyesuaian yang aman di `doku-webhook`) agar pesanan yang memiliki `retail_product_id` memotong stok dari tabel `product_retail`.

### Phase 3: Refactor Frontend (Dikerjakan di Branch Khusus)
- [x] **Keranjang (Cart):** Ubah state keranjang belanja (Zustand/Context) agar menyimpan `product_retail.id` bukan `product_variants.id`.
- [x] **Halaman Checkout:** Arahkan pemanggilan API checkout ke Edge Function baru (`create-doku-retail-checkout`).
- [x] **Halaman Toko (Shop):** Pastikan halaman `/shop` dan `/product/:slug` 100% menggunakan data dari `product_retail` dan `retail_categories`.

### Phase 4: Pembaruan Sistem Stok Internal (Admin)
- [x] Refactor fitur **Stock Opening**, **Stock Adjustments**, dan **Stock Opname** di `/admin/stock-*` agar semuanya membaca dan melakukan mutasi data pada tabel `product_retail`.
- [x] Pastikan sistem *Realtime Auto-Refresh* diarahkan ke tabel `product_retail`.

### Phase 5: Final Review & Go-Live
- [ ] Uji coba transaksi *end-to-end* (Cart -> Checkout -> DOKU Webhook -> Stok Berkurang) di Local/Staging menggunakan Sandbox.
- [ ] Jika semua sudah sempurna, _Merge_ branch migrasi ini ke main dan _Deploy_ ke Production.
- [ ] (Opsional/Masa Depan) Setelah beberapa bulan dan pesanan lama sudah selesai, buat skrip untuk mematikan akses ke tabel `products` lama secara permanen (Arsip).

---
*Catatan untuk AI: Setiap kali membuka sesi baru untuk mengerjakan tugas retail, **selalu** baca dokumen ini dan pastikan setiap perintah sesuai dengan Golden Rules di atas.*
