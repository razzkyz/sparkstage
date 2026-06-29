# Panduan Lengkap Integrasi Shopee API (Multi-Store)

Dokumen ini adalah cetak biru (blueprint) teknis untuk menghubungkan sistem Spark Stage (Supabase + React) dengan banyak akun toko Shopee sekaligus menggunakan satu akun Developer Induk (In-House Application).

## Fase 1: Setup di Shopee Open Platform (Developer Portal)

Karena Anda sudah login di akun developer, lakukan langkah berikut:
1. Masuk ke tab **Console** -> **Custom App** (atau *ERP System*).
2. Klik **Create App**. Pilih jenis **Custom App / Self-Provisioned App** (Bukan Public App yang dijual bebas).
3. Isi detail aplikasi (Nama: `Spark Stage Omnichannel`, dll).
4. **Catat 2 Data Penting:** Setelah aplikasi dibuat/disetujui, Anda akan mendapatkan `App Key` (atau `Partner ID`) dan `App Secret`. Ini adalah kunci utama server kita.
5. **Set Redirect URL / Callback URL:** Di pengaturan otorisasi Aplikasi, Anda harus mengisi URL kembalian (Redirect URL). URL ini nantinya akan diarahkan ke server Supabase Edge Function kita (contoh: `https://[project-ref].supabase.co/functions/v1/shopee-auth-callback`).

## Fase 2: Penyesuaian Database (Supabase)

Kita perlu membuat file migrasi SQL baru untuk menampung arsitektur multi-toko ini. Sistem kita akan menjadi "Otak" yang memegang kunci dari semua cabang toko.

```sql
-- 1. Tabel Platform E-Commerce
CREATE TABLE ecommerce_platforms (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL -- Contoh isi: 'shopee', 'tiktok'
);

-- 2. Tabel Toko yang Terhubung (Multi-Store Account)
CREATE TABLE ecommerce_connected_stores (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  platform_id BIGINT REFERENCES ecommerce_platforms(id),
  store_name VARCHAR(255) NOT NULL, -- Label internal: 'Shopee Fashion'
  shop_id BIGINT NOT NULL UNIQUE, -- ID resmi dari Shopee (Penting untuk webhook)
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabel Mapping Produk (Perjodohan Data)
CREATE TABLE product_ecommerce_mappings (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  internal_variant_id BIGINT REFERENCES product_variants(id) ON DELETE CASCADE,
  store_id BIGINT REFERENCES ecommerce_connected_stores(id) ON DELETE CASCADE,
  external_item_id BIGINT NOT NULL, -- ID Induk Produk di Shopee
  external_model_id BIGINT, -- ID Varian di Shopee (Ukuran/Warna)
  UNIQUE(internal_variant_id, store_id) -- 1 varian kita hanya bisa dipasangkan 1x per toko
);
```

## Fase 3: Pembuatan Alur Otorisasi (Menghubungkan 3 Toko)

Ini adalah proses agar Aplikasi (Developer) mendapatkan izin membaca/menulis ke Akun Toko (Seller).
1. **Frontend UI:** Kita buat halaman `/admin/integrations`. Di sana ada tombol **"Hubungkan Toko Shopee"**.
2. **Action:** Saat ditekan, tombol ini mengarahkan admin ke halaman Login resmi Shopee.
3. **Login Seller:** Admin login menggunakan kredensial toko pertama (misal: akun *Spark Fashion*), lalu menekan "Setujui/Authorize".
4. **Edge Function (`shopee-auth-callback`):** Shopee akan melempar admin kembali ke sistem kita sambil membawa kode izin dan `shop_id`. Sistem kita akan menukar kode itu menjadi `access_token` permanen dan menyimpannya ke tabel `ecommerce_connected_stores`.
5. **Ulangi:** Admin cukup mengulang klik tombol tadi 2 kali lagi untuk login menggunakan akun *Spark Charm* dan *Spark Makeup*.

## Fase 4: Mapping Produk (Perjodohan Varian)

Sebelum sinkronisasi otomatis berjalan, sistem harus tahu produk mana di Spark Stage yang sama dengan produk di Shopee.
1. **Tarik Data:** Buat Edge Function `shopee-fetch-products` yang menarik daftar produk langsung dari etalase Shopee Anda.
2. **UI Mapping:** Di dashboard admin, kita buat tabel berdampingan. Sebelah kiri adalah daftar produk Spark Stage, sebelah kanan adalah *dropdown* berisi daftar produk Shopee dari ketiga toko tersebut.
3. Admin memilih pasangan yang tepat secara manual (Cukup dilakukan satu kali seumur hidup per produk). Data ini akan masuk ke tabel `product_ecommerce_mappings`.

## Fase 5: Push Stok Realtime (Offline -> Online)

Jika terjadi penjualan kasir offline, penyesuaian (*Stock Adjustment*), atau *Stock Opname* selesai:
1. **Database Trigger:** Perubahan di tabel `product_variants.stock` akan memicu Webhook internal Supabase.
2. **Edge Function (`shopee-push-stock`):**
   - Cari produk yang berubah di tabel `product_ecommerce_mappings`.
   - Jika ditemukan, baca `store_id` (Toko mana?) dan `external_model_id`.
   - Ambil `access_token` milik toko tersebut.
   - Kirim *Request* API ke Shopee: `v2/product/update_stock`.
   - Stok di Shopee Fashion/Charm/Makeup (sesuai tokonya) akan langsung ter-update di detik yang sama.

## Fase 6: Pull Pesanan & Cetak Resi (Online -> Offline)

1. **Shopee Webhook:** Kita sediakan URL Edge Function (misal `shopee-webhook`) dan daftarkan di portal Developer Shopee (Push Mechanism).
2. Saat ada pembeli membayar pesanan di Shopee (dari toko manapun), Shopee akan mengirim sinyal otomatis ke URL webhook kita. Di sinyal itu terlampir `shop_id` toko yang laku.
3. **Proses Sistem:**
   - Sistem membaca `shop_id` untuk mengetahui pesanan ini milik toko mana.
   - Sistem menarik detail barang apa yang dibeli.
   - Sistem **mengurangi stok** di database Spark Stage secara *realtime* (sehingga kasir offline tahu barang itu sudah habis).
4. **Cetak Resi (AWB):** Admin membuka halaman pesanan di Spark Stage, menekan tombol **"Cetak Resi"**. Sistem kita menembak API Shopee `v2/logistics/get_shipping_document` lalu PDF resi otomatis terbuka untuk langsung di-print.

---
**Status Dokumen:** PERSIAPAN TAHAP 1
**Langkah Selanjutnya bagi Owner/Admin:** Selesaikan verifikasi aplikasi di portal Developer Shopee sampai Anda mendapatkan **App Key** dan **App Secret**. Setelah 2 data itu didapat, pekerjaan *coding* backend bisa segera dimulai.
