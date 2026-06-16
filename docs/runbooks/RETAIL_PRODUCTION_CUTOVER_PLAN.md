# Rencana Transisi Retail Phase 6: Production Cutover Plan

Dokumen ini menjabarkan langkah-langkah untuk mendeploy sistem `product_retail` ke Production tanpa mengganggu transaksi user yang sedang berjalan, dengan catatan bahwa fitur baru ini akan menimpa/menggantikan (override) UI dan URL lama di `/shop`.

## Fase 0: Integrasi Codebase (Di Branch `second`)
*Fokus: Memastikan branch staging up-to-date dengan production sebelum modifikasi UI.*

1. **Sinkronisasi dari Main:** Lakukan `git checkout second` lalu `git merge main`. 
2. **Selesaikan Konflik:** Jika ada *merge conflict*, selesaikan di branch `second`.
3. **Refactor Frontend (In-Place Replacement):** 
   - Ubah komponen di halaman `/shop` agar mengambil data (fetching) dari tabel `product_retail` (bukan lagi `products`), dan petakan (mapping) datanya sesuai dengan kategori/departemen yang ada (Glam, Charm Bar, Spark Club).
   - Ubah halaman detail produk (misal `/shop/:id` atau `/shop/detail`) agar menampilkan detail dari tabel `product_retail`.
4. **Testing Terakhir di Sandbox:** Lakukan test checkout menggunakan UI `/shop` yang baru direfactor ini dengan DOKU Sandbox dan DB Staging.

## Fase 1: Persiapan Database Production (H-1)
*Fokus: Memastikan infrastruktur siap tanpa mengubah flow user saat ini.*

1. **Deploy Database Migrations ke Production:**
   - Pastikan semua tabel (`product_retail`, `retail_categories`, dll), RLS policies, dan RPC functions sudah ter-deploy di Supabase Production.
   - *Aman karena tabel baru tidak mengganggu tabel `products` lama yang sedang aktif melayani user.*
2. **Deploy Edge Functions Baru:**
   - Deploy function checkout dan webhook baru (misal: `create-doku-retail-checkout`, `doku-retail-webhook`).
   - Jangan ubah URL webhook DOKU di dashboard production DOKU dulu. Biarkan berjalan paralel dengan function lama.

## Fase 2: Sinkronisasi Data Final (Hari H - Jam Sepi)
*Fokus: Menyamakan data stok antara sistem lama dan baru tepat sebelum switch frontend.*
*Waktu Rekomendasi: 01:00 - 04:00 AM*

1. **Freeze Admin Updates:** Minta tim Admin untuk tidak melakukan update produk atau stock opname selama 1-2 jam.
2. **Jalankan Script Sinkronisasi (Delta Sync):**
   - Salin perubahan data (stok, harga, dll) yang terjadi di tabel `products` lama sejak migrasi Phase 1 ke tabel `product_retail` baru.

## Fase 3: Frontend Deployment & Webhook Switch (Momen Cutover)
*Fokus: Mengganti mesin (backend) halaman `/shop` lama dengan sistem `product_retail` baru.*

1. **Ubah URL Webhook di DOKU Production:**
   - Masuk ke DOKU Dashboard (Production). Update URL Notifikasi (Webhook) untuk menunjuk ke Edge Function retail yang baru.
2. **Merge & Deploy ke Production (`main`):**
   - Buat Pull Request dan Merge branch `second` ke `main`. 
   - Deployment (Vercel/Cloudflare) akan berjalan. Begitu selesai, halaman `/shop` yang diakses pembeli sudah otomatis menggunakan sistem database dan flow checkout yang baru.
3. **Siapkan Rollback (Plan B):**
   - Jika terjadi error fatal (P0), kita bisa lakukan **Instant Rollback** ke frontend versi lama melalui dashboard Vercel/Cloudflare dalam hitungan detik (karena URL tidak berubah, UX user akan kembali normal tanpa mereka sadari).

## Fase 4: Smoke Testing (Post-Deployment)
*Fokus: Verifikasi di environment Production secara real.*

1. Buat "Produk Testing" seharga Rp 1.000. Lakukan pembelian sungguhan via QRIS/e-Wallet di halaman `/shop`.
2. **Cek:** Checkout berhasil? Status order jadi `PAID`? Stok di tabel `product_retail` berkurang otomatis? WhatsApp Invoice terkirim?

## Fase 5: Monitor & Cleanup (H+3 hingga H+7)
*Fokus: Membersihkan sisa migrasi setelah stabil.*

1. Pantau error logs. Jika selama seminggu stabil, tabel `products` lama dan Edge Functions lama bisa di-archive/dihapus.
