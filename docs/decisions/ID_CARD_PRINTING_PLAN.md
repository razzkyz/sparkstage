# Rencana Pengembangan Fitur Cetak ID Card (Epson L8050)

## Deskripsi Singkat
Fitur ini memungkinkan staff/admin untuk mencetak ID Card (PVC) customer lengkap dengan foto (auto-remove background), nama, serial number, dan barcode, ditujukan untuk printer Epson L8050 (menggunakan tray PVC).

## Fase 1: Proof of Concept & Eksperimen (DevOps Only)
**Fokus:** Membangun *sandbox* atau halaman *playground* yang aman agar tim developer bisa melakukan *trial & error* integrasi AI Hapus Background dan Kalibrasi posisi cetak PDF tanpa mengganggu halaman operasional produksi.

### 1. Halaman Khusus Eksperimen
- **Route / Path:** `/admin/dev-id-card-test`
- **Akses/Role:** Hanya dibatasi untuk user dengan role `super_admin`. Halaman ini **tidak** akan dimunculkan di menu navigasi utama kasir/admin reguler.
- **Komponen UI:**
  - Form input manual sederhana (Nama, Serial Number) untuk testing.
  - Area unggah foto / drag & drop.
  - *Canvas Preview* (menampilkan visualisasi ID card secara real-time).
  - Tombol aksi: "Proses Hapus BG", "Generate Barcode", "Unduh PDF Tes Cetak".

### 2. Implementasi Hapus Background (Versi Gratis)
Sesuai arahan, kita akan mencoba menggunakan opsi gratis untuk uji coba awal. Ada dua opsi yang bisa dipakai di fase ini:
- **Opsi A (Lokal/Browser):** Menggunakan library Javascript seperti `@imgly/background-removal` agar proses hapus background berjalan langsung di laptop tanpa biaya sepeser pun.
- **Opsi B (API Tier Gratis):** Menggunakan API Remove.bg (akun gratis untuk 50 credit/bulan) murni untuk melihat kualitas pemotongan tertinggi.

### 3. Engine Cetak & Kalibrasi Template (PDF)
- **Tujuan:** Menemukan *sweet spot* (koordinat presisi) agar saat file diprint, tintanya jatuh tepat di lubang Tray PVC Epson L8050, bukan meleset ke tray plastiknya.
- **Teknis (Frontend):** Menggunakan library `jspdf` atau `html-to-image` untuk merender tampilan HTML/React (Nama + Barcode + Foto Transparan) menjadi file cetak beresolusi tinggi (300 DPI) seukuran kertas standar Epson, dengan desain ID Card ditempatkan pada titik koordinat tray.

## Fase 2: Penyempurnaan & Kontrol Manual (Jika Fase 1 Berhasil)
- **Manual Adjustment:** Menambahkan kontrol (slider/drag) agar foto wajah bisa di-zoom atau digeser (Pan) secara manual jika hasil AI kurang presisi di tengah template.
- **Locking Coordinates:** Mengunci parameter (margin, padding) untuk cetakan PDF berdasarkan hasil tes cetak kertas kosong pada Fase 1.

## Fase 3: Integrasi Alur Bisnis Penuh (TBD - Menunggu Arahan Lanjutan)
- Mengganti form input manual dengan *Dropdown / Search* yang menarik data langsung dari database Supabase (`orders` atau `users`).
- Memindahkan halaman eksperimen ini ke menu resmi (misal: `/admin/print-id-card`).
- Membuka akses halaman ini untuk role operasional toko seperti `kasir` atau `admin`.

---
*Dokumen ini adalah rencana awal dan dapat diubah seiring dengan proses iterasi dan percobaan pencetakan ke printer asli.*
