# Optimisasi Egress

## Tujuan

Dokumen ini merangkum analisis awal terhadap lonjakan egress pada project Supabase `hogzjapnkvsihvvbgcdb`, lalu menerjemahkannya menjadi daftar optimisasi yang realistis untuk kondisi project saat ini.

Fokus dokumen ini:

- memahami sumber egress yang paling mungkin
- membedakan mana yang layak dioptimisasi dulu
- menghindari keputusan yang terlalu mahal seperti upgrade plan sebelum akar masalahnya jelas

## Kondisi Saat Ini

Berdasarkan screenshot usage yang dianalisis:

- organisasi berada pada `Free Plan`
- billing cycle yang aktif adalah `28 Mar 2026 - 28 Apr 2026`
- project mengalami grace period karena `Cached Egress Exceeded`
- cached egress berada di sekitar `6.72 GB / 5 GB`
- uncached egress hanya sekitar `0.82 GB / 5 GB`
- ada spike harian cached egress yang mencapai sekitar `487 MB`

Implikasi awal:

- masalah utama bukan compute, MAU, database size, atau realtime
- masalah utama ada pada data yang dilayani berulang melalui CDN/cache
- upgrade ke Pro tanpa optimisasi lebih dulu kemungkinan tidak efisien

## Apa Arti Metrik Ini

Menurut dokumentasi resmi Supabase:

- `Cached Egress` adalah traffic yang served dari cache CDN
- cached egress biasanya paling banyak datang dari `Storage` melalui Smart CDN
- `Egress` biasa mencakup Database, Auth, Storage, Edge Functions, Realtime, dan lain-lain

Referensi:

- https://supabase.com/docs/guides/platform/manage-your-usage/egress
- https://supabase.com/docs/guides/storage/serving/bandwidth
- https://supabase.com/docs/guides/storage/cdn/metrics

## Temuan Utama

### 1. Dugaan bahwa penyebab utama adalah UptimeRobot kemungkinan salah

Awalnya UptimeRobot dipakai untuk "menghangatkan" Midtrans lewat request ke edge function.

Namun dari data yang ada:

- overage justru datang dari `Cached Egress`
- kalau sumber utamanya hanya ping monitor ke edge function, pola yang lebih masuk akal adalah kenaikan kecil di uncached edge egress
- spike harian hingga sekitar `487 MB` terlalu besar untuk dijelaskan oleh health check sederhana, kecuali endpoint yang dipanggil mengembalikan payload besar secara sangat sering

Kesimpulan:

- UptimeRobot tetap layak dihentikan setelah Midtrans dipensiunkan
- tetapi kemungkinan besar itu bukan sumber utama pemborosan egress saat ini

### 2. Sumber paling mungkin adalah asset publik yang masih served dari Supabase Storage

Produk sudah dipindahkan ke ImageKit, tetapi bucket publik lain masih aktif di codebase.

Temuan di repo:

- upload CMS generik masih ke Supabase Storage di `frontend/src/lib/cmsAssetUpload.ts`
- banner manager masih upload ke bucket `banners`
- beauty poster masih upload ke bucket `beauty-images`
- dressing room masih upload ke bucket `dressing-room-images`
- events schedule masih upload ke bucket `events-schedule`

Referensi file:

- [frontend/src/lib/cmsAssetUpload.ts](/C:/Users/prada/Documents/sparkstage/frontend/src/lib/cmsAssetUpload.ts:35)
- [frontend/src/pages/admin/banner-manager/useBannerManagerController.ts](/C:/Users/prada/Documents/sparkstage/frontend/src/pages/admin/banner-manager/useBannerManagerController.ts:113)
- [frontend/src/pages/admin/beauty-poster-manager/beautyPosterData.ts](/C:/Users/prada/Documents/sparkstage/frontend/src/pages/admin/beauty-poster-manager/beautyPosterData.ts:142)
- [frontend/src/utils/uploadDressingRoomImage.ts](/C:/Users/prada/Documents/sparkstage/frontend/src/utils/uploadDressingRoomImage.ts:32)
- [frontend/src/pages/admin/events-schedule-manager/useEventsScheduleManagerController.ts](/C:/Users/prada/Documents/sparkstage/frontend/src/pages/admin/events-schedule-manager/useEventsScheduleManagerController.ts:119)

Tambahan penting:

runbook migrasi ImageKit memang secara eksplisit tidak memigrasikan bucket non-produk seperti:

- `banners`
- `beauty-images`
- `dressing-room-images`
- aset non-produk lain

Referensi:

- [docs/runbooks/imagekit-migration.md](/C:/Users/prada/Documents/sparkstage/docs/runbooks/imagekit-migration.md:18)

### 3. Dressing room kemungkinan kandidat besar

`dressing-room-images` patut dicurigai karena:

- gambar tetap dilayani dari Supabase Storage
- util frontend masih membentuk URL `storage/v1/render/image/...`
- artinya selain object public biasa, ada penggunaan image render endpoint Supabase

Referensi:

- [frontend/src/utils/dressingRoomImageUrl.ts](/C:/Users/prada/Documents/sparkstage/frontend/src/utils/dressingRoomImageUrl.ts:1)

Jika halaman publik atau bot sering membuka page yang menampilkan gambar dressing room, egress cached dapat cepat naik.

### 4. Banner/CMS assets juga sangat mungkin menyumbang besar

Banner dan CMS image biasanya:

- public
- dipakai di halaman landing/public
- mudah di-hit oleh crawler, bot, preview unfurl, atau kunjungan manual

Karena banner manager masih menyimpan file di bucket `banners`, bucket ini adalah kandidat prioritas tinggi untuk dievaluasi dan dipindahkan.

### 5. Hijau PostgREST tinggi berarti fetch API publik juga perlu dioptimalkan

Chart usage menunjukkan PostgREST egress juga cukup besar.

Dari codebase, beberapa singleton CMS/public settings masih fetch langsung ke Supabase setiap mount dan belum memakai React Query dengan cache panjang.

Contoh:

- `useCmsSingletonSettings`
- `useBookingPageSettings`
- `useGlamPageSettings`

Referensi:

- [frontend/src/hooks/useCmsSingletonSettings.ts](/C:/Users/prada/Documents/sparkstage/frontend/src/hooks/useCmsSingletonSettings.ts:13)
- [frontend/src/hooks/useBookingPageSettings.ts](/C:/Users/prada/Documents/sparkstage/frontend/src/hooks/useBookingPageSettings.ts:122)
- [frontend/src/hooks/useGlamPageSettings.ts](/C:/Users/prada/Documents/sparkstage/frontend/src/hooks/useGlamPageSettings.ts:80)

Sementara default cache global QueryClient hanya `30 detik`.

Referensi:

- [frontend/src/lib/queryClient.ts](/C:/Users/prada/Documents/sparkstage/frontend/src/lib/queryClient.ts:3)

Implikasi:

- setiap mount route publik bisa menghasilkan GET PostgREST baru
- jika bot atau crawler sering mengunjungi route, response settings/CMS akan ikut memperbesar egress

## Hipotesis Sumber Egress

Urutan hipotesis dari yang paling mungkin:

1. asset publik Supabase Storage non-produk
2. image render endpoint Supabase untuk dressing room atau asset visual lain
3. banner publik yang sering diakses
4. singleton page settings yang di-fetch berulang lewat PostgREST
5. crawler/bot yang memukul halaman publik dan memicu load image + API
6. UptimeRobot Midtrans warm-up

Catatan:

- poin 6 tetap ada, tetapi dari pola metrik kemungkinan bukan penyumbang utama

## Implikasi Terhadap Migrasi DOKU

Jika payment gateway pindah dari Midtrans ke DOKU:

- edge function Midtrans yang dipakai untuk flow lama kemungkinan akan dipensiunkan
- monitor UptimeRobot yang khusus memukul flow Midtrans juga sebaiknya dihentikan
- namun penghapusan Midtrans warm-up saja kemungkinan tidak akan cukup menyelesaikan masalah cached egress

Artinya:

- migrasi DOKU tetap layak dilakukan
- tetapi optimisasi egress perlu berjalan sebagai inisiatif terpisah

## Cara Mengetahui Akar Masalah Dengan Lebih Pasti

Supabase CLI biasa tidak memberi breakdown egress yang cukup untuk investigasi ini.

Jalur yang paling disarankan oleh dokumentasi resmi Supabase:

1. buka Usage page dan filter ke project `hogzjapnkvsihvvbgcdb`
2. temukan hari spike tertinggi
3. buka Observability / Logs Explorer
4. query request ke:
   - `storage/v1/object`
   - `storage/v1/render`
   - path PostgREST yang sering dipanggil
5. kelompokkan berdasarkan path
6. kalikan jumlah request dengan ukuran file / estimasi payload

Referensi:

- https://supabase.com/docs/guides/platform/manage-your-usage/egress
- https://supabase.com/docs/guides/storage/serving/bandwidth
- https://supabase.com/docs/guides/storage/cdn/metrics

## Strategi Optimisasi yang Direkomendasikan

### Strategi A - Hentikan sumber yang tidak lagi diperlukan

Lakukan untuk hal-hal yang nilainya rendah:

- hentikan warm-up Midtrans saat flow Midtrans sudah benar-benar tidak dipakai
- hapus monitor yang memukul endpoint payment lama
- pastikan tidak ada cron atau script eksternal yang hit endpoint publik tanpa kebutuhan jelas

### Strategi B - Kurangi asset publik di Supabase Storage

Ini adalah optimisasi paling bernilai tinggi.

Prioritas migrasi yang disarankan:

1. `banners`
2. `dressing-room-images`
3. `beauty-images`
4. `events-schedule`
5. bucket publik lain yang ternyata muncul dominan di logs

Tujuan:

- memindahkan delivery image dari Supabase ke CDN/image service lain
- mengurangi cached egress di organisasi Supabase

### Strategi C - Naikkan cache browser untuk bucket yang belum dipindah

Tidak semua upload flow saat ini mengatur `cacheControl` yang tinggi.

Temuan:

- `dressing-room-images` sudah memakai `cacheControl: '31536000'`
- flow lain seperti CMS generic, banners, beauty, dan events schedule belum terlihat mengatur cacheControl panjang

Referensi:

- [frontend/src/utils/uploadDressingRoomImage.ts](/C:/Users/prada/Documents/sparkstage/frontend/src/utils/uploadDressingRoomImage.ts:36)

Ini tidak menghapus egress dari first load, tetapi bisa menurunkan redownload berulang dari browser.

### Strategi D - Kurangi GET PostgREST publik yang terlalu sering

Arah optimisasinya:

- pindahkan singleton CMS/public settings ke React Query
- gunakan `staleTime` yang lebih panjang untuk data yang jarang berubah
- nonaktifkan refetch agresif bila tidak perlu
- jika cocok, preload atau cache payload public settings di layer lain

### Strategi E - Audit bot dan crawler

Jika halaman publik dibuka oleh:

- social preview bots
- SEO crawler
- bot lain yang hit image dan API

maka egress tetap bisa tinggi walau user manusia sedikit.

Karena itu, langkah observability wajib dilakukan sebelum keputusan final.

## Rekomendasi Keputusan

Untuk kondisi project ini, keputusan yang paling masuk akal:

1. jangan buru-buru upgrade Supabase Pro hanya karena cached egress
2. anggap masalah ini sebagai masalah delivery asset + public fetch pattern
3. lakukan observability dulu
4. hentikan Midtrans warm-up saat DOKU siap
5. migrasikan bucket publik Supabase yang paling sering diakses
6. optimalkan caching frontend untuk query publik

## Todo List

## Phase 0 - Verifikasi observability

- [ ] Filter Usage page ke project `hogzjapnkvsihvvbgcdb`
- [ ] Identifikasi tanggal spike tertinggi cached egress
- [ ] Buka Observability / Logs Explorer
- [ ] Query top path untuk `storage/v1/object`
- [ ] Query top path untuk `storage/v1/render`
- [ ] Query top path untuk PostgREST
- [ ] Catat bucket/path mana yang paling sering diakses

Checkpoint:

- ada daftar top 10 path storage
- ada daftar top endpoint PostgREST
- ada kandidat utama penyumbang egress

## Phase 1 - Bersihkan traffic yang tidak lagi perlu

- [ ] Inventaris semua monitor UptimeRobot yang memukul endpoint Midtrans
- [ ] Setelah DOKU live, nonaktifkan monitor Midtrans warm-up
- [ ] Pastikan tidak ada cron eksternal yang menembak payment endpoint lama
- [ ] Pastikan tidak ada script internal yang melakukan polling publik tanpa kebutuhan jelas

Checkpoint:

- tidak ada lagi warm-up untuk flow Midtrans
- endpoint payment lama tidak dipukul pihak internal

## Phase 2 - Optimisasi storage publik

- [ ] Audit bucket publik yang masih aktif
- [ ] Validasi bucket prioritas: `banners`, `dressing-room-images`, `beauty-images`, `events-schedule`
- [ ] Tentukan bucket mana yang paling sering muncul di logs
- [ ] Migrasikan bucket prioritas tertinggi lebih dulu ke CDN/image service eksternal
- [ ] Ubah helper upload yang masih menulis ke Supabase Storage
- [ ] Ubah delete flow jika provider file dipindahkan

Checkpoint:

- minimal satu bucket publik terbesar sudah keluar dari Supabase
- URL public asset terbesar tidak lagi lewat `supabase.co/storage/...`

## Phase 3 - Cache policy

- [ ] Audit semua upload flow yang belum menetapkan `cacheControl`
- [ ] Tambahkan `cacheControl` tinggi untuk bucket yang masih harus tinggal sementara di Supabase
- [ ] Pastikan nama file asset immutable atau cukup unik sehingga cache panjang aman

Checkpoint:

- asset public bucket yang tersisa punya cache policy panjang

## Phase 4 - Optimisasi PostgREST publik

- [ ] Audit hook public yang fetch settings langsung dari Supabase
- [ ] Migrasikan singleton hooks ke React Query bila belum
- [ ] Naikkan `staleTime` untuk settings publik yang jarang berubah
- [ ] Kurangi refetch on focus / reconnect untuk data public static-like
- [ ] Pertimbangkan payload minim agar tidak select `*` bila tidak perlu

Checkpoint:

- route publik tidak fetch settings berulang tanpa alasan
- traffic PostgREST hijau turun pada hari-hari berikutnya

## Phase 5 - Validasi setelah deploy

- [ ] Pantau Usage page 2-3 hari setelah perubahan
- [ ] Bandingkan cached egress harian sebelum dan sesudah optimisasi
- [ ] Bandingkan PostgREST egress harian sebelum dan sesudah optimisasi
- [ ] Jika spike tetap besar, lanjutkan investigasi bot/crawler

Checkpoint:

- ada penurunan nyata pada cached egress
- ada data yang cukup untuk memutuskan apakah masih perlu upgrade plan

## Kandidat Perubahan Kode

File yang kemungkinan disentuh pada fase optimisasi:

- `frontend/src/lib/cmsAssetUpload.ts`
- `frontend/src/pages/admin/banner-manager/useBannerManagerController.ts`
- `frontend/src/pages/admin/beauty-poster-manager/beautyPosterData.ts`
- `frontend/src/utils/uploadDressingRoomImage.ts`
- `frontend/src/pages/admin/events-schedule-manager/useEventsScheduleManagerController.ts`
- `frontend/src/hooks/useCmsSingletonSettings.ts`
- `frontend/src/hooks/useBookingPageSettings.ts`
- `frontend/src/hooks/useGlamPageSettings.ts`
- `frontend/src/lib/queryClient.ts`

## Penutup

Masalah egress di project ini lebih masuk akal diperlakukan sebagai masalah:

- asset delivery
- fetch pattern publik
- observability yang belum cukup detail

bukan semata-mata masalah bahwa Supabase Free terlalu kecil.

Optimisasi yang benar kemungkinan akan lebih murah dan lebih sehat secara arsitektur dibanding langsung menaikkan plan tanpa audit sumber trafik.
