# Rencana Sistem Template ID Card Dinamis (Supabase + R2)

Dokumen ini berisi rencana arsitektur dan langkah-langkah implementasi untuk sistem manajemen template ID Card dinamis, di mana Admin dapat menambahkan template baru dan mengatur posisi layout (koordinat) secara mandiri.

## 1. Skema Database (Supabase)
Kita akan membuat tabel baru bernama `id_card_templates` untuk menyimpan informasi template dan konfigurasi koordinatnya dalam format `JSONB`.

**Tabel: `id_card_templates`**
- `id` (uuid, primary key)
- `name` (text, not null) - *Contoh: "VIP Pink Star"*
- `front_image_url` (text, not null) - *URL gambar dari R2*
- `back_image_url` (text, not null) - *URL gambar dari R2*
- `config_front` (jsonb, not null) - *Menyimpan koordinat X, Y, Width, Height, Font Size, dan Color untuk elemen di sisi depan (Foto, Nama, Zodiak, Hobby).*
- `config_back` (jsonb, not null) - *Menyimpan koordinat untuk elemen di sisi belakang (Barcode, Serial).*
- `is_active` (boolean, default: true)
- `created_at` (timestamp)

## 2. Infrastruktur Storage (Cloudflare R2)
- Memanfaatkan arsitektur R2 yang sudah aktif (`sparkstage-public-assets` / `cdn.sparkstage55.com`).
- Admin akan mengunggah file PNG (front & back) melalui sistem upload yang sudah ada.
- Sangat disarankan file PNG memiliki lubang transparan di area bingkai foto.

## 3. Frontend - Halaman Manajemen Template (Admin)
**Route: `/admin/id-card-templates`**
Halaman baru untuk mengelola template:
1. **List Template:** Menampilkan daftar template yang ada di database.
2. **Form Tambah/Edit:**
   - Input nama template.
   - Tombol Upload gambar (Depan & Belakang) ke R2.
   - **Coordinate Editor:** Kolom input angka (dalam satuan `px`) untuk mengatur posisi (Top, Left, Width, Height) bagi tiap elemen.
   - **Live Preview:** Layar pratinjau langsung yang bergeser seketika saat Admin mengetikkan angka koordinat, sehingga Admin tidak perlu menebak-nebak posisi.

## 4. Frontend - Integrasi di Halaman Cetak (Print Test)
**Route: `/admin/dev-id-card-test` (atau halaman operasional final)**
- Menambahkan **Dropdown / Select Box** untuk memilih template yang aktif.
- Mengubah *state* `TEMPLATE_FRONT` dan `TEMPLATE_BACK` yang sebelumnya *hardcoded* menjadi data reaktif yang di-fetch dari Supabase (`useQuery`).
- Saat template diganti, gambar background dan posisi teks akan bergeser otomatis menyesuaikan konfigurasi `JSONB` dari database.

---

## Langkah Eksekusi (Fase Implementasi)

- [ ] **Fase 1: Database Migration.** Membuat file SQL migration untuk tabel `id_card_templates`.
- [ ] **Fase 2: Frontend Data Fetching.** Menyesuaikan halaman ID Card Print saat ini untuk bisa memuat data dari database (sebagai purwarupa/Mockup awal).
- [ ] **Fase 3: Halaman Admin Manager.** Membuat halaman `/admin/id-card-templates` untuk CRUD dan upload gambar ke R2.
- [ ] **Fase 4: Visual Editor.** Membuat *Live Preview* untuk mempermudah Admin memasukkan angka koordinat.
