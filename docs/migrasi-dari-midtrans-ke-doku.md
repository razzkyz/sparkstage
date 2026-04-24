# Migrasi Dari Midtrans ke DOKU

## Tujuan

Dokumen ini merangkum hasil riset awal untuk migrasi payment gateway dari Midtrans ke DOKU pada repo Spark Stage, lalu menerjemahkannya menjadi checklist kerja bertahap.

Asumsi dokumen ini:

- Akun DOKU sudah terverifikasi dan siap dipakai
- Merchant sudah memiliki credential sandbox dan production
- Target migrasi adalah mengganti flow Midtrans yang ada sekarang dengan flow DOKU yang paling dekat secara arsitektur

## Rangkuman Hasil Belajar

### Rekomendasi jalur integrasi

Untuk codebase ini, jalur integrasi yang paling cocok adalah **DOKU Checkout**, bukan **DOKU Direct API SNAP**.

Alasannya:

- Flow repo saat ini memakai pola hosted payment page ala Midtrans Snap
- DOKU Checkout juga memakai pola backend membuat payment session lalu frontend membuka halaman pembayaran DOKU
- Perubahan frontend akan lebih kecil karena kita cukup mengganti Snap token menjadi `payment.url`
- Kompleksitas autentikasi dan signature lebih rendah dibanding SNAP Direct API

### Perbedaan inti Midtrans vs DOKU

Midtrans saat ini di repo:

- Backend membuat token Snap
- Frontend memanggil popup Snap
- Webhook Midtrans mengubah status order

DOKU Checkout:

- Backend membuat checkout payment ke endpoint DOKU
- DOKU mengembalikan `payment.url`
- Frontend bisa redirect ke URL itu atau membuka popup via JS SDK DOKU
- DOKU mengirim HTTP Notification ke endpoint merchant

### Endpoint utama DOKU Checkout

- Sandbox: `https://api-sandbox.doku.com/checkout/v1/payment`
- Production: `https://api.doku.com/checkout/v1/payment`

### Header autentikasi DOKU Checkout

Untuk request payment checkout, backend merchant mengirim header:

- `Client-Id`
- `Request-Id`
- `Request-Timestamp`
- `Signature`

`Signature` untuk DOKU Checkout memakai pola **HMAC-SHA256** pada skema non-SNAP.

### Idempotency

DOKU memakai `Request-Id` sebagai idempotency key.

Implikasinya:

- Setiap request baru harus punya `Request-Id` unik
- Jika merchant retry request yang sama dengan body yang sama, DOKU dapat membalas `409 Conflict`
- Kita perlu menyimpan `request_id` per order payment attempt agar retry aman dan terkontrol

### Bentuk request payment

Minimal request DOKU Checkout berisi:

- `order.amount`
- `order.invoice_number`
- `payment.payment_due_date` opsional

Untuk repo ini, secara praktis kita hampir pasti juga akan mengirim:

- `order.line_items`
- `payment.payment_method_types`
- `customer`
- `order.callback_url` atau `order.callback_url_result`
- `additional_info.override_notification_url` bila diperlukan

Catatan penting:

- `order.amount` dalam IDR tanpa desimal
- `order.invoice_number` harus unik
- Untuk beberapa payment method, `line_items`, `customer`, `shipping_address`, dan `billing_address` bisa menjadi mandatory

### Frontend DOKU Checkout

Setelah backend mendapat `payment.url`, frontend punya dua opsi:

1. Redirect langsung ke `payment.url`
2. Membuka popup/modal dengan JS DOKU

Lokasi script:

- Sandbox: `https://sandbox.doku.com/jokul-checkout-js/v1/jokul-checkout-1.0.0.js`
- Production: `https://jokul.doku.com/jokul-checkout-js/v1/jokul-checkout-1.0.0.js`

Kesimpulan praktis:

- Untuk migrasi cepat dan stabil, redirect lebih sederhana
- Jika ingin UX mirip Midtrans Snap, popup DOKU JS bisa dipakai

### Notification / webhook

DOKU sangat bergantung pada HTTP Notification untuk finalisasi status.

Aturan penting:

- Notification URL harus publik
- Disarankan `https://`
- Tidak bisa localhost
- Tidak bisa URL di balik auth, VPN, atau port aneh
- `ngrok` tidak didukung
- Endpoint merchant harus membalas HTTP `2xx`

Jika endpoint tidak membalas `2xx`, DOKU akan retry:

1. 30 menit setelah percobaan awal
2. 6 jam dari percobaan awal
3. 12 jam dari percobaan awal

Ada juga manual retry dari dashboard DOKU.

### Validasi notification

Notification dari DOKU harus diverifikasi signature-nya.

Ini penting karena:

- Status payment tidak boleh dipercaya hanya dari redirect frontend
- Sumber kebenaran final tetap notification server-to-server

Selain itu, DOKU menyarankan payload notification diparse **non-strict**, karena field baru bisa ditambahkan sewaktu-waktu.

### Status order

Status dasar pada DOKU Checkout:

- `Pending`
- `Success`
- `Expired`

Ada juga dokumentasi baru bahwa Check Status API dapat mengembalikan status order-level lebih awal, tetapi untuk merchant lama fitur itu bisa memerlukan aktivasi dari support DOKU.

Implikasi untuk repo ini:

- Jangan membangun flow yang sepenuhnya bergantung pada polling
- Notification tetap harus jadi jalur utama update status
- Polling/status sync hanya fallback

### Expiry dan recovery

DOKU Checkout mendukung:

- `payment.payment_due_date` per request
- expired notification
- beberapa fitur recovery order untuk channel tertentu

Untuk migrasi awal, yang paling aman:

- gunakan `payment_due_date` eksplisit dari backend
- implementasikan status `expired`
- jangan mengandalkan fitur recovery dulu sebelum flow dasar stabil

### DOKU SNAP Direct API

Riset ini juga menunjukkan bahwa DOKU SNAP Direct API memang ada, tetapi lebih kompleks:

- ada Get Token API
- ada asymmetric signature untuk token / request tertentu
- ada symmetric signature untuk request transaksional dan notification
- lebih cocok jika kita butuh integrasi channel-level yang lebih dalam

Untuk fase migrasi dari Midtrans saat ini, jalur ini tidak menjadi prioritas pertama.

## Dampak ke Arsitektur Repo

Area yang kemungkinan besar harus disentuh:

- `supabase/functions/create-midtrans-token/`
- `supabase/functions/create-midtrans-product-token/`
- `supabase/functions/midtrans-webhook/`
- `supabase/functions/sync-midtrans-status/`
- `supabase/functions/sync-midtrans-product-status/`
- `supabase/functions/reconcile-midtrans-payments/`
- `supabase/functions/_shared/midtrans.ts`
- `supabase/functions/_shared/payment-processors.ts`
- `supabase/functions/_shared/payment-effects.ts`
- frontend payment pages dan helper Midtrans

Pendekatan migrasi yang disarankan:

- tambahkan flow DOKU terlebih dahulu
- buat adapter status baru
- setelah stabil, baru matikan jalur Midtrans

Ini lebih aman daripada langsung mengganti semua fungsi Midtrans sekaligus dalam satu langkah.

## Todo List Migrasi

## Phase 0 - Audit dan desain

- [ ] Inventaris semua titik integrasi Midtrans di frontend, edge functions, dan docs
- [ ] Pisahkan flow tiket vs flow produk agar migrasi bisa dilakukan tanpa saling mengganggu
- [ ] Tentukan strategi UX DOKU: redirect atau popup
- [ ] Tetapkan mapping status internal app terhadap status DOKU
- [ ] Tetapkan strategi invoice number dan request id yang idempotent
- [ ] Tetapkan source of truth final status: notification dulu, polling fallback

Checkpoint:

- ada peta file Midtrans lama
- ada keputusan integrasi DOKU Checkout
- ada desain status mapping tertulis

## Phase 1 - Credential dan konfigurasi

- [ ] Tambahkan env sandbox dan production untuk DOKU:
- [ ] `DOKU_CLIENT_ID`
- [ ] `DOKU_SECRET_KEY`
- [ ] `DOKU_BASE_URL`
- [ ] `DOKU_CHECKOUT_JS_URL`
- [ ] `DOKU_NOTIFICATION_URL`
- [ ] `DOKU_CALLBACK_URL`
- [ ] Buat helper shared untuk generate signature DOKU Checkout
- [ ] Buat helper shared untuk request timestamp dan request id
- [ ] Simpan pemisahan sandbox vs production dengan jelas

Checkpoint:

- helper signing DOKU tersedia
- env validation untuk DOKU lulus
- sandbox request bisa dibangun secara lokal

## Phase 2 - Model data dan persistence

- [ ] Tentukan field tambahan yang perlu disimpan di order tiket dan order produk
- [ ] Minimal simpan:
- [ ] `provider = doku`
- [ ] `provider_order_ref` atau `invoice_number`
- [ ] `provider_request_id`
- [ ] `payment_url`
- [ ] `payment_due_at`
- [ ] `provider_payload`
- [ ] `provider_status`
- [ ] Tambahkan migration bila schema sekarang belum cukup
- [ ] Pastikan idempotency payment attempt bisa dilacak

Checkpoint:

- schema siap menyimpan metadata DOKU
- retry request tidak menghasilkan order ganda

## Phase 3 - Backend create payment

- [ ] Buat function baru untuk create checkout payment tiket via DOKU
- [ ] Buat function baru untuk create checkout payment produk via DOKU
- [ ] Bentuk request body DOKU dari data order internal
- [ ] Isi `order.amount`, `invoice_number`, `line_items`, `customer`, callback URL, due date
- [ ] Kirim header `Client-Id`, `Request-Id`, `Request-Timestamp`, `Signature`
- [ ] Simpan `payment.url` dan metadata respons
- [ ] Tangani `409 Conflict` idempotency dengan baik
- [ ] Pastikan rollback stok / kapasitas tetap aman bila create payment gagal

Checkpoint:

- order tiket bisa menghasilkan `payment.url`
- order produk bisa menghasilkan `payment.url`
- error DOKU tidak membocorkan reservasi stok atau kapasitas

## Phase 4 - Frontend checkout

- [ ] Ganti pemanggilan Midtrans Snap token menjadi pemanggilan create payment DOKU
- [ ] Pilih strategi presentasi:
- [ ] redirect ke `payment.url`, atau
- [ ] popup memakai `loadJokulCheckout()`
- [ ] Sesuaikan loading, timeout, dan error state di halaman payment
- [ ] Pastikan user tetap bisa kembali ke success/pending page setelah redirect
- [ ] Pastikan state booking / checkout tetap aman bila auth refresh terjadi

Checkpoint:

- user bisa memulai pembayaran tiket ke halaman DOKU
- user bisa memulai pembayaran produk ke halaman DOKU
- redirect balik ke app tidak merusak flow status

## Phase 5 - Notification / webhook DOKU

- [ ] Buat endpoint notification DOKU baru
- [ ] Verifikasi signature notification sebelum memproses payload
- [ ] Parse payload secara non-strict
- [ ] Mapping status notification ke status internal:
- [ ] `SUCCESS`
- [ ] `PENDING`
- [ ] `FAILED`
- [ ] `EXPIRED`
- [ ] Pastikan side effect tetap idempotent:
- [ ] issue ticket
- [ ] release capacity
- [ ] finalize pickup
- [ ] release stock
- [ ] voucher usage / release
- [ ] Balas HTTP `2xx` hanya bila notification sudah diterima dan diproses aman
- [ ] Simpan log notification mentah untuk audit

Checkpoint:

- notification sukses mengubah order tiket
- notification sukses mengubah order produk
- replay notification tidak menghasilkan side effect ganda

## Phase 6 - Status sync dan fallback recovery

- [ ] Tentukan apakah Check Status API DOKU akan dipakai pada fase awal
- [ ] Jika dipakai, buat endpoint sync status terpisah untuk tiket dan produk
- [ ] Gunakan sync hanya sebagai fallback, bukan jalur utama
- [ ] Sesuaikan success page dan pending page agar membaca status DOKU
- [ ] Tangani kasus payment pending, success, failed, expired

Checkpoint:

- success page tidak bergantung pada redirect frontend semata
- pending page bisa pulih meski notification datang terlambat

## Phase 7 - Testing sandbox

- [ ] Uji create payment tiket di sandbox
- [ ] Uji create payment produk di sandbox
- [ ] Uji success notification
- [ ] Uji expired flow
- [ ] Uji failed / cancelled flow
- [ ] Uji retry notification
- [ ] Uji idempotency create payment dengan `Request-Id` yang sama
- [ ] Uji polling fallback bila notification terlambat
- [ ] Uji stok produk dan kapasitas tiket pada semua hasil status

Checkpoint:

- semua status utama sudah lolos sandbox
- tidak ada kebocoran stok atau kapasitas
- success page dan pending page konsisten

## Phase 8 - Go-live preparation

- [ ] Isi credential production
- [ ] Konfigurasi Notification URL production di dashboard DOKU
- [ ] Verifikasi domain URL publik dan HTTPS
- [ ] Konfigurasi payment method yang ingin diaktifkan
- [ ] Atur payment due date default
- [ ] Siapkan manual runbook untuk retry notification dan pengecekan dashboard
- [ ] Tentukan feature flag atau cutover switch Midtrans ke DOKU

Checkpoint:

- production env lengkap
- notification production tervalidasi
- cutover plan jelas dan bisa di-revert

## Phase 9 - Cleanup pasca cutover

- [ ] Hapus tombol, util, dan flow frontend khusus Midtrans yang tidak dipakai lagi
- [ ] Arsipkan atau hapus edge function Midtrans yang sudah obsolete
- [ ] Rapikan docs dan runbook payment agar DOKU jadi source of truth baru
- [ ] Tambahkan troubleshooting doc untuk tim client / programmer internal

Checkpoint:

- codebase tidak menyisakan flow payment ganda yang membingungkan
- dokumentasi operasional sudah pindah ke DOKU

## Risiko yang Harus Dijaga

- Jangan percaya redirect frontend sebagai bukti pembayaran final
- Jangan memproses notification tanpa verifikasi signature
- Jangan membuat side effect payment tanpa idempotency
- Jangan membiarkan create payment gagal tetapi stok / kapasitas tetap tertahan
- Jangan membuat parser notification strict terhadap field-field DOKU
- Jangan mengandalkan check status sebagai pengganti webhook

## Referensi Resmi DOKU

- DOKU API home: https://developers.doku.com/
- Retrieve payment credential: https://developers.doku.com/getting-started-with-doku-api/retrieve-payment-credential
- DOKU Checkout overview: https://developers.doku.com/accept-payments/doku-checkout
- DOKU Checkout integration guide: https://developers.doku.com/accept-payments/doku-checkout/integration-guide
- Backend integration: https://developers.doku.com/accept-payments/doku-checkout/integration-guide/backend-integration
- Frontend integration: https://developers.doku.com/accept-payments/doku-checkout/integration-guide/frontend-integration
- Supported payment methods: https://developers.doku.com/accept-payments/doku-checkout/supported-payment-methods
- Order status for checkout page: https://developers.doku.com/accept-payments/doku-checkout/order-status-for-checkout-page
- Idempotency request: https://developers.doku.com/get-started-with-doku-api/idempotency-request
- Notification overview: https://developers.doku.com/get-started-with-doku-api/notification
- Setup notification URL: https://developers.doku.com/get-started-with-doku-api/notification/setup-notification-url
- Retry notification: https://developers.doku.com/get-started-with-doku-api/notification/retry-notification
- Override notification URL: https://developers.doku.com/get-started-with-doku-api/notification/override-notification-url
- HTTP notification sample for SNAP: https://developers.doku.com/get-started-with-doku-api/notification/http-notification-sample-for-snap
- HTTP notification sample non-SNAP: https://developers.doku.com/get-started-with-doku-api/notification/http-notification-sample-non-snap
- Signature component non-SNAP request header: https://developers.doku.com/get-started-with-doku-api/signature-component/non-snap/signature-component-from-request-header
- SNAP signature overview: https://developers.doku.com/get-started-with-doku-api/signature-component/snap
- SNAP asymmetric signature: https://developers.doku.com/get-started-with-doku-api/signature-component/snap/asymmetric-signature
- SNAP symmetric signature: https://developers.doku.com/get-started-with-doku-api/signature-component/snap/symmetric-signature
