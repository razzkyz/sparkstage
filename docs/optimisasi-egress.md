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

Status terbaru per `26 April 2026`:

- monitor UptimeRobot untuk warm-up Midtrans sudah dicopot
- tidak ada lagi komponen yang secara sengaja "menghangatkan Midtrans" edge functions

Namun dari data yang ada:

- overage justru datang dari `Cached Egress`
- kalau sumber utamanya hanya ping monitor ke edge function, pola yang lebih masuk akal adalah kenaikan kecil di uncached edge egress
- spike harian hingga sekitar `487 MB` terlalu besar untuk dijelaskan oleh health check sederhana, kecuali endpoint yang dipanggil mengembalikan payload besar secara sangat sering

Kesimpulan:

- warm-up Midtrans sudah tidak lagi menjadi sumber traffic aktif internal
- namun dari pola metrik, UptimeRobot memang kemungkinan besar bukan sumber utama pemborosan cached egress sejak awal

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
6. traffic internal lama yang sudah dinonaktifkan, termasuk warm-up Midtrans

Catatan:

- poin 6 tetap ada, tetapi dari pola metrik kemungkinan bukan penyumbang utama

## Implikasi Terhadap Migrasi DOKU

Jika payment gateway pindah dari Midtrans ke DOKU:

- edge function Midtrans yang dipakai untuk flow lama kemungkinan akan dipensiunkan
- monitor UptimeRobot yang dulu khusus memukul flow Midtrans sudah dihentikan per `26 April 2026`
- namun penghapusan Midtrans warm-up saja memang tidak cukup menyelesaikan masalah cached egress

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

- pertahankan kondisi tanpa warm-up Midtrans karena monitor UptimeRobot terkait sudah dicopot
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

Progress `27 April 2026`:

- asset non-produk berikut sudah selesai di-upload ke ImageKit:
  - `public/banners`
  - `public/beauty/posters`
  - `public/beauty/glam`
  - `public/dressing-room`
- `public/events-schedule/items` tetap disiapkan sebagai target path, tetapi saat ini masih kosong
- tahap yang belum selesai bukan upload asset, melainkan `cutover URL` dari `supabase.co/storage/...` ke `ik.imagekit.io/...`

### Strategi C - Naikkan cache browser untuk bucket yang belum dipindah

Tidak semua upload flow saat ini mengatur `cacheControl` yang tinggi.

Temuan:

- `dressing-room-images` sudah memakai `cacheControl: '31536000'`
- `cmsAssetUpload`, `banners`, `beauty-images`, dan `events-schedule` sudah diperpanjang ke `cacheControl: '31536000'` per `27 April 2026`

Referensi:

- [frontend/src/utils/uploadDressingRoomImage.ts](/C:/Users/prada/Documents/sparkstage/frontend/src/utils/uploadDressingRoomImage.ts:36)
- [frontend/src/lib/cmsAssetUpload.ts](/C:/Users/prada/Documents/sparkstage/frontend/src/lib/cmsAssetUpload.ts:37)
- [frontend/src/pages/admin/banner-manager/useBannerManagerController.ts](/C:/Users/prada/Documents/sparkstage/frontend/src/pages/admin/banner-manager/useBannerManagerController.ts:114)
- [frontend/src/pages/admin/beauty-poster-manager/beautyPosterData.ts](/C:/Users/prada/Documents/sparkstage/frontend/src/pages/admin/beauty-poster-manager/beautyPosterData.ts:142)
- [frontend/src/pages/admin/events-schedule-manager/useEventsScheduleManagerController.ts](/C:/Users/prada/Documents/sparkstage/frontend/src/pages/admin/events-schedule-manager/useEventsScheduleManagerController.ts:120)

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
4. anggap warm-up Midtrans sudah selesai dibersihkan dan jangan hidupkan kembali
5. migrasikan bucket publik Supabase yang paling sering diakses
6. optimalkan caching frontend untuk query publik

## Todo List

### A. Optimisasi Egress Umum

- [ ] Verifikasi ulang billing cycle aktif organisasi dan tanggal reset quota yang benar
- [ ] Filter Usage page ke project `hogzjapnkvsihvvbgcdb`
- [ ] Identifikasi tanggal spike cached egress tertinggi: `31 Maret 2026`, `7 April 2026`, `13 April 2026`, dan `25/26 April 2026`
- [ ] Verifikasi spike `9 April 2026` dan `19 April 2026` beserta breakdown service-nya
- [ ] Buka Observability / Logs Explorer
- [ ] Query top path untuk `storage/v1/object`
- [ ] Query top path untuk `storage/v1/render`
- [ ] Query top path untuk PostgREST
- [ ] Catat bucket/path mana yang paling sering diakses
- [x] UptimeRobot warm-up Midtrans sudah dicopot
- [ ] Inventaris health check lama lain yang masih memukul endpoint publik lama
- [ ] Pastikan tidak ada traffic internal lain yang sudah tidak punya nilai
- [ ] Pastikan tidak ada cron atau polling publik yang tidak perlu
- [ ] Pantau Usage page 2-3 hari setelah tiap perubahan besar

Checkpoint:

- ada daftar top 10 path storage
- ada daftar top endpoint PostgREST
- ada keputusan yang jelas mana masalah utama: storage, PostgREST, auth, atau bot/crawler
- warm-up Midtrans sudah bersih dan traffic internal lain yang tidak perlu ikut dibersihkan

### B. Todo List Migrasi Asset Publik ke ImageKit

Fokus jalur ini adalah menurunkan `Cached Egress` Supabase dengan memindahkan delivery asset publik non-produk ke ImageKit.

- [x] Audit bucket publik non-produk yang masih aktif di runtime
- [x] Validasi prioritas bucket: `banners`, `dressing-room-images`, `beauty-images`, `events-schedule`
- [x] Estimasi total size bucket non-produk yang akan dipindah dan cocokkan dengan `ImageKit Free`:
  - `20 GB bandwidth / bulan`
  - `3 GB DAM storage`
- [x] Pilih urutan migrasi yang paling aman:
  - `banners`
  - `dressing-room-images`
  - `beauty-images`
  - `events-schedule`
- [x] Verifikasi ulang backup bucket non-produk via `supabase` CLI dengan project yang benar
- [x] Rapikan struktur folder target ImageKit agar upload-ready
- [x] Upload batch asset non-produk aktif ke ImageKit
- [x] Generate manifest cutover `old Supabase URL -> new ImageKit URL`
- [x] Siapkan helper upload ImageKit untuk asset non-produk
- [x] Ubah helper upload yang masih menulis ke Supabase Storage
- [x] Ubah URL delivery asset agar keluar lewat `ik.imagekit.io/...`
- [ ] Ubah flow delete asset bila provider file dipindahkan
- [ ] Pastikan fallback lama tidak lagi dipakai oleh route publik setelah cutover
- [ ] Verifikasi bahwa asset publik terbesar tidak lagi keluar lewat `supabase.co/storage/...`
- [x] Pantau bandwidth dan storage ImageKit setelah cutover awal
- [ ] Simpan bucket Supabase lama sebagai rollback buffer sementara sebelum cleanup final

Progress `27 April 2026`:

- backup bucket non-produk sudah diverifikasi ulang via `supabase` CLI, bukan via workaround runtime
- upload ke ImageKit untuk batch berikut sudah selesai:
  - `banners`: `90` file
  - `beauty/posters`: `2` file
  - `beauty/glam`: `9` file
  - `dressing-room`: `11` file
  - `events-schedule/items`: `0` file
- total size upload-ready yang sudah masuk ke ImageKit sekitar `128.7224 MB`
- endpoint default ImageKit yang dipakai tetap `https://ik.imagekit.io/hjnuyzlt3`
- manifest cutover URL sudah digenerate:
  - total URL aktif yang perlu dipindah: `30`
  - `banners`: `14`
  - `beauty_posters`: `1`
  - `glam_page_settings`: `4`
  - `dressing_room_look_photos`: `11`
  - unresolved mapping: `0`
- runtime read-path publik sekarang sudah diremap ke ImageKit pada layer frontend untuk:
  - `banners`
  - `beauty_posters`
  - `glam_page_settings`
  - `dressing_room_look_photos`
  - `events_schedule_items`
- write-path admin sekarang sudah dipindah ke ImageKit untuk:
  - `banners`
  - `beauty/posters`
  - `beauty/glam`
  - `events-schedule/items`
  - `dressing-room/<lookId>`
  - jalur CMS generik yang sebelumnya masih menulis ke bucket `events-schedule`
- next step yang tersisa:
  - tambah cleanup delete ImageKit supaya file orphan tidak menumpuk
  - patch database agar source data ikut bersih dari URL Supabase lama

Checkpoint:

- minimal satu bucket publik terbesar sudah keluar dari Supabase
- URL public asset terbesar tidak lagi lewat `supabase.co/storage/...`
- penggunaan cached egress Supabase turun nyata
- penggunaan bandwidth ImageKit masih aman terhadap free tier
- manifest cutover tidak punya URL aktif yang unresolved
- runtime publik utama tidak lagi bergantung pada URL delivery `supabase.co/storage/...`

### C. Todo List Optimisasi PostgREST Egress

Fokus jalur ini adalah menurunkan chart hijau `PostgREST egress` karena nilainya bukan fixed cost dan bisa ditekan dari desain fetch.

- [ ] Audit hook public yang masih fetch langsung saat mount tanpa cache query yang benar
- [x] Migrasikan singleton hooks ke TanStack Query bila belum:
  - `useCmsSingletonSettings`
  - `useBookingPageSettings`
  - `useGlamPageSettings`
- [ ] Review hook public lain yang mengambil CMS/settings serupa dengan pola fetch terpisah
- [x] Naikkan `staleTime` untuk data publik yang jarang berubah
- [x] Audit `refetchOnWindowFocus` dan `refetchOnReconnect` untuk route publik
- [ ] Ganti `select('*')` dengan field minimal untuk query public yang tidak butuh seluruh row
- [ ] Audit query yang mengambil row terlalu banyak dan tambahkan pagination/filter yang lebih sempit
- [ ] Hilangkan fetch duplikatif antar komponen yang meminta data yang sama
- [ ] Pastikan settings/CMS yang sama memakai query key yang sama
- [ ] Audit beban PostgREST yang dipicu crawler/bot pada route publik
- [ ] Verifikasi ulang hari `19 April 2026` sebagai baseline khusus PostgREST/Auth-heavy
- [ ] Bandingkan chart PostgREST sebelum dan sesudah deploy

Progress `27 April 2026`:

- `useCmsSingletonSettings` sudah dipindahkan ke TanStack Query dengan query key stabil dan mutation invalidation
- `useBookingPageSettings` dan `useGlamPageSettings` sudah diubah menjadi wrapper di atas cache singleton tersebut
- singleton/public settings itu sekarang memakai `staleTime` default `30 menit`
- `refetchOnWindowFocus` dan `refetchOnReconnect` untuk jalur singleton/public settings tersebut sudah dimatikan

Checkpoint:

- route publik tidak fetch settings berulang tanpa alasan
- payload query public lebih kecil
- request query public lebih jarang
- traffic PostgREST hijau turun pada hari-hari berikutnya

### D. Todo List Cache Policy Sementara

Jalur ini berlaku selama sebagian bucket publik masih harus tinggal di Supabase.

- [ ] Audit semua upload flow yang belum menetapkan `cacheControl`
- [x] Tambahkan `cacheControl` tinggi untuk bucket yang belum sempat dipindah
- [ ] Pastikan nama file cukup immutable atau unik agar cache panjang aman
- [ ] Pastikan browser tidak redownload asset yang sama tanpa alasan

Progress `27 April 2026`:

- `cmsAssetUpload`
- `banner manager`
- `beauty poster`
- `events schedule`

semuanya sudah diubah ke `cacheControl: '31536000'`

Checkpoint:

- asset public bucket yang tersisa punya cache policy panjang
- redownload berulang dari browser lebih rendah

### E. Reminder Optimisasi Video Statis

Jalur ini bukan prioritas utama untuk `Supabase egress`, tetapi tetap penting untuk bandwidth total website dan performa halaman publik.

- [x] Audit semua video statis yang masih dilayani dari `frontend/public`
- [x] Verifikasi apakah video besar di halaman publik benar-benar perlu autoplay sekaligus
- [ ] Evaluasi pemindahan video statis publik ke ImageKit atau CDN video/image delivery yang sama
- [ ] Pertimbangkan `preload=\"metadata\"`, lazy render, atau hanya play saat masuk viewport
- [x] Audit khusus halaman `CharmBar` yang saat ini merender beberapa video autoplay pada satu halaman

Temuan `27 April 2026`:

- video statis `Charm Bar` saat ini tidak membebani `Supabase egress`, karena masih dilayani sebagai asset lokal frontend
- tetapi tetap cukup berat untuk bandwidth total website:
  - `DIY CHARM 1.mp4` sekitar `1.776 MB`
  - `DIY CHARM 2.mp4` sekitar `3.34 MB`
  - `DIY CHARM 3.mp4` sekitar `2.446 MB`
- halaman `CharmBar` saat ini merender beberapa elemen `<video>` autoplay sekaligus, jadi ini layak masuk backlog optimisasi tahap berikutnya

## Kandidat Perubahan Kode

File yang kemungkinan disentuh pada fase optimisasi:

- `frontend/src/lib/cmsAssetUpload.ts`
- `frontend/src/lib/imagekit.ts`
- `frontend/src/lib/publicAssetUrl.ts`
- `frontend/src/pages/admin/banner-manager/useBannerManagerController.ts`
- `frontend/src/pages/admin/beauty-poster-manager/beautyPosterData.ts`
- `frontend/src/utils/uploadDressingRoomImage.ts`
- `frontend/src/pages/admin/events-schedule-manager/useEventsScheduleManagerController.ts`
- `frontend/src/hooks/useCmsSingletonSettings.ts`
- `frontend/src/hooks/useBookingPageSettings.ts`
- `frontend/src/hooks/useGlamPageSettings.ts`
- `frontend/src/hooks/useEventSettings.ts`
- `frontend/src/hooks/useCharmBarSettings.ts`
- `frontend/src/hooks/useEventSchedule.ts`
- `frontend/src/hooks/useBanners.ts`
- `frontend/src/lib/queryClient.ts`

## Penutup

Masalah egress di project ini lebih masuk akal diperlakukan sebagai masalah:

- asset delivery
- fetch pattern publik
- observability yang belum cukup detail

bukan semata-mata masalah bahwa Supabase Free terlalu kecil.

Optimisasi yang benar kemungkinan akan lebih murah dan lebih sehat secara arsitektur dibanding langsung menaikkan plan tanpa audit sumber trafik.

## Sesi Brainstroming 26 April

Catatan tambahan dari sesi tanggal `26 April 2026`.

### Pembacaan spike yang sudah dicatat

Dari pembacaan manual chart usage:

- spike `9 April 2026` terlihat dominan di:
  - `Storage egress` sekitar `32.193 MB` atau `63.4%`
  - `PostgREST egress` sekitar `16.175 MB` atau `31.9%`
- spike `19 April 2026` terlihat dominan di:
  - `PostgREST egress` sekitar `36.727 MB` atau `63%`
  - `Auth egress` sekitar `15 MB` atau `26%`
  - `Storage egress` sekitar `1.6 MB` atau `2.7%`

Implikasi:

- ada pola spike yang memang `storage-heavy`
- tetapi ada juga hari yang justru `PostgREST/Auth-heavy`
- jadi masalah project ini kemungkinan bukan satu sumber tunggal

Untuk `Cached Egress per day`, kandidat hari tertinggi yang sudah dicatat:

- `31 Maret 2026` sekitar `478.936 MB`
- `7 April 2026` sekitar `487.342 MB`
- `13 April 2026` sekitar `470.481 MB`
- `25/26 April 2026` sekitar `418.449 MB`

Interpretasi sementara:

- puncak cached egress tetap paling masuk akal berasal dari asset publik Supabase Storage
- kandidat teratas tetap `banners`, `dressing-room-images`, `beauty-images`, dan `events-schedule`
- `19 April 2026` harus diperlakukan sebagai investigasi terpisah karena dominannya bukan storage, melainkan PostgREST dan Auth

### Implikasi untuk target Free Plan

Tujuan utama optimisasi ini adalah menjaga organisasi tetap sehat di `Free Plan` dengan asumsi traffic user nyata masih sangat rendah.

Masalah utamanya:

- meskipun user manusia hampir tidak ada, asset publik dan endpoint publik tetap bisa dikonsumsi oleh:
  - crawler
  - social preview bots
  - health check lama
  - request publik yang tidak dikontrol

Jadi kondisi `zero user` tidak otomatis berarti aman untuk quota egress.

### Klarifikasi billing cycle dan reset quota

Berdasarkan dokumentasi resmi Supabase:

- quota usage berlaku per `billing cycle`, bukan otomatis per tanggal `1` setiap bulan
- grace period diberikan saat organisasi melewati quota pada Free Plan
- restriction karena quota usage akan terangkat saat quota terisi ulang di awal billing cycle berikutnya
- warning grace period dapat tetap tampil walaupun usage sudah turun di bawah limit
- jika organisasi kembali melewati limit sebelum warning itu bersih, tidak ada jaminan mendapat grace period kedua

Jika billing cycle organisasi ini memang `28 Maret 2026 - 28 April 2026`, maka implikasinya:

- pada `26 April 2026`, usage `Cached Egress 7.167 / 5 GB` masih dihitung ke cycle lama
- reset quota seharusnya terjadi di sekitar `28 April 2026`, bukan `1 Mei 2026`
- kelebihan `2.17 GB` tidak dibawa sebagai "utang pemakaian" ke cycle baru
- cycle baru akan mulai lagi dari quota baru, tetapi sumber traffic yang sama bisa langsung menghabiskannya lagi

Kesimpulan operasional:

- jangan mengandalkan `1 Mei 2026` sebagai tanggal reset jika billing cycle organisasi tidak dimulai tanggal `1`
- jangan mengandalkan reset cycle saja sebagai solusi
- fokus utama tetap harus menurunkan sumber cached egress sebelum dan sesudah reset billing cycle berikutnya

### Tambahan prioritas hasil sesi

Prioritas yang makin jelas setelah sesi ini:

1. verifikasi path penyumbang cached egress tertinggi pada hari-hari `31 Maret 2026`, `7 April 2026`, dan `13 April 2026`
2. audit PostgREST/Auth pada `19 April 2026`
3. migrasikan bucket publik non-produk terbesar lebih dulu
4. perpanjang cache policy untuk bucket yang belum sempat dipindah
5. refactor hook public settings agar tidak fetch berulang tanpa alasan

Catatan penting:

- `supabase` CLI biasa tidak memberi breakdown cached egress harian yang cukup detail untuk investigasi ini
- dashboard usage dan observability tetap menjadi sumber verifikasi utama
- UptimeRobot warm-up Midtrans sudah dicopot, jadi investigasi berikutnya tidak boleh lagi menganggap warm-up itu sebagai traffic aktif saat ini

### Konfirmasi arsitektur media: Supabase vs ImageKit

Penegasan dari sesi:

- asset yang masih dilayani lewat URL `supabase.co/storage/...` tetap membebani quota egress Supabase
- jika file itu served dari cache CDN Supabase, ia masuk `Cached Egress`
- jika file itu tidak served dari cache, ia masuk `uncached egress`
- asset yang sudah dilayani lewat URL `ik.imagekit.io/...` tidak lagi membebani egress Supabase untuk file delivery

Artinya:

- `ImageKit` tidak mengubah traffic file menjadi `uncached egress` Supabase
- untuk Supabase, delivery file dari ImageKit secara praktis bernilai `nol`
- pembagian tanggung jawab yang lebih sehat adalah:
  - `Supabase` untuk database, auth, PostgREST, edge functions, dan backend app
  - `ImageKit` untuk media delivery publik

Dengan kata lain, pivot yang masuk akal bukan menjadikan Supabase "auth only", melainkan mengeluarkan pekerjaan `asset delivery` dari Supabase.

### Perbandingan kasar quota free tier Supabase vs ImageKit

Perhitungan kasar dari sesi:

- `Supabase Free` memberi:
  - `5 GB cached egress`
  - `5 GB uncached egress`
  - total bandwidth kasar sekitar `10 GB`, meskipun dibagi dalam dua bucket quota yang berbeda
- `ImageKit Free` memberi:
  - `20 GB bandwidth`
  - `3 GB DAM storage`

Implikasi kasar:

- secara total bandwidth, `ImageKit Free` sekitar `2x` lebih besar dari total bandwidth kasar `Supabase Free`
- jika dibandingkan khusus terhadap `cached egress` Supabase yang sekarang menjadi bottleneck utama, maka `ImageKit Free` terasa sekitar `4x` lebih longgar

Catatan:

- perbandingan ini bersifat operasional, bukan matematis persis per produk
- tetapi cukup akurat untuk pengambilan keputusan arsitektur delivery asset

### Apakah target 1.000 user realistis?

Kesimpulan sesi:

- dengan arsitektur sekarang, target `1.000 user` tidak realistis karena cached egress Supabase sudah jebol saat user nyata masih sangat rendah
- jika asset publik non-produk dipindahkan ke ImageKit dan query publik dirapikan, target `1.000 user` menjadi realistis

Alasannya:

- bottleneck utama saat ini bukan `MAU`, tetapi `asset delivery`
- setelah asset delivery berat keluar dari Supabase, Supabase tinggal menanggung:
  - database queries
  - auth/session
  - edge functions
  - payment flow
  - operasi admin

Namun target `1.000 user` tetap mensyaratkan:

- asset publik terbesar benar-benar keluar dari Supabase Storage
- PostgREST publik ikut dioptimalkan
- bot/crawler dipahami agar tidak membakar bandwidth tanpa user manusia

### PostgREST bukan fixed cost, dan bisa dioptimisasi

Kesimpulan penting dari sesi:

- `PostgREST egress` bukan biaya tetap yang tidak bisa disentuh
- PostgREST egress pada dasarnya adalah ukuran data API database yang dikirim dari Supabase ke client
- jadi nilainya bisa turun jika:
  - request lebih jarang
  - payload lebih kecil
  - row yang diambil lebih sedikit
  - fetch yang duplikatif dihilangkan

Untuk repo ini, area yang paling jelas perlu diaudit:

- `frontend/src/hooks/useCmsSingletonSettings.ts`
- `frontend/src/hooks/useBookingPageSettings.ts`
- `frontend/src/hooks/useGlamPageSettings.ts`
- hook public lain yang mem-fetch settings/CMS langsung dari Supabase
- `frontend/src/lib/queryClient.ts`

## Notes - Langkah-Langkah Realistis Untuk Optimisasi PostgREST Egress

Catatan ini sengaja diletakkan di bagian paling bawah sebagai checklist praktis.

### 1. Audit hook public yang masih fetch langsung saat mount

Target awal:

- `useCmsSingletonSettings`
- `useBookingPageSettings`
- `useGlamPageSettings`
- hook public CMS lain yang belum memakai pola cache yang disiplin

Tujuan:

- mengurangi request berulang dari route publik

### 2. Migrasikan settings publik ke TanStack Query yang benar-benar dipakai sebagai cache

Langkah:

- gunakan `useQuery` untuk singleton settings yang masih memakai `useEffect + useState`
- pakai query key yang stabil
- pastikan komponen yang berbeda memakai cache query yang sama, bukan fetch masing-masing

Tujuan:

- satu payload settings cukup diambil sekali lalu dipakai ulang

### 3. Naikkan `staleTime` untuk data yang jarang berubah

Contoh kandidat:

- booking page settings
- glam page settings
- banner metadata
- CMS text/image settings

Prinsip:

- data yang berubahnya jarang jangan dianggap stale setiap puluhan detik
- `30 detik` sebagai default global terlalu pendek untuk banyak halaman publik static-like

### 4. Kurangi refetch agresif

Yang perlu dievaluasi:

- `refetchOnWindowFocus`
- `refetchOnReconnect`
- route yang melakukan refetch walau user hanya pindah tab atau kembali fokus

Tujuan:

- mencegah request ulang yang tidak memberi nilai nyata bagi user

### 5. Ganti `select('*')` dengan field minimal

Prinsip:

- jangan kirim seluruh row jika UI hanya butuh beberapa field
- review hook public yang memakai `select('*')`

Tujuan:

- mengurangi ukuran payload PostgREST

### 6. Kurangi jumlah row yang diambil

Langkah:

- paginasi katalog atau list besar
- filter lebih sempit
- hindari load seluruh dataset jika halaman hanya menampilkan subset

Tujuan:

- mengurangi total byte yang dikirim ke client

### 7. Hilangkan fetch duplikatif antar komponen

Pola masalah yang perlu dicari:

- halaman yang terdiri dari banyak komponen, tetapi masing-masing melakukan query sendiri ke tabel/settings yang sama

Tujuan:

- satu sumber data dipakai bersama

### 8. Anggap bot/crawler sebagai bagian dari beban PostgREST

Prinsip:

- route publik bukan hanya dibuka user manusia
- crawler juga bisa memicu fetch settings, list, dan image load

Tujuan:

- desain cache dan payload harus tahan terhadap trafik non-human

### 9. Verifikasi hasil setelah deploy

Checklist:

- bandingkan chart hijau PostgREST sebelum dan sesudah deploy
- lihat apakah spike seperti `19 April 2026` menurun
- cek apakah route publik masih melakukan request berulang tanpa alasan

### 10. Prioritas implementasi paling realistis

Urutan paling masuk akal untuk repo ini:

1. ubah singleton settings hooks ke React Query
2. naikkan `staleTime` data publik static-like
3. matikan refetch agresif untuk halaman publik yang tidak butuh live freshness
4. audit `select('*')` pada query public
5. audit list publik yang mengambil terlalu banyak row
