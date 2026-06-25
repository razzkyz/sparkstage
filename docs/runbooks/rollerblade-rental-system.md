# Rollerblade Rental System

## Overview

Sistem rental rollerblade terintegrasi dengan pembayaran QRIS DOKU untuk SparkStage.

## Features

- ✅ Pembayaran QRIS via DOKU
- ✅ Real-time payment status tracking
- ✅ Dashboard untuk kasir
- ✅ Status management: Pending → Paid → Active → Completed
- ✅ Invoice auto-generated
- ✅ Payment expiry 15 menit
- ✅ Stats dashboard (pendapatan, transaksi, rental aktif)

## User Flow

### 1. Kasir Membuat Transaksi

1. Login dengan role `kasir` (email: rollerblade@gmail.com)
2. Buka menu **Rental Rollerblade** → **Transaksi Rental**
3. Klik tombol **"+ Buat Transaksi Baru"**
4. Isi form:
   - Nama Customer *
   - No. Telepon (opsional)
   - Tanggal Rental *
   - Ukuran Sepatu *
   - Durasi Sewa (jam) *
5. Sistem otomatis menghitung total: `Rp 20.000 × durasi jam`
6. Klik **"Buat Transaksi"**

### 2. Payment QRIS

1. Modal pembayaran muncul dengan QRIS code
2. Customer scan QRIS dengan mobile banking/e-wallet
3. Countdown 15 menit ditampilkan
4. Sistem auto-check status pembayaran
5. Kasir bisa klik **"🔄 Cek Status"** untuk manual refresh

### 3. Start Rental

1. Setelah payment status berubah **PAID**
2. Kasir klik tombol **"Mulai Rental"**
3. Status berubah: `waiting_payment` → `rental_active`
4. Timer rental dimulai

### 4. Complete Rental

1. Customer selesai dan kembalikan rollerblade
2. Kasir klik tombol **"Selesai"**
3. Status berubah: `rental_active` → `completed`

## Database Schema

### Table: `rentals`

```sql
create table public.rentals (
  id bigint primary key generated always as identity,
  invoice_number text unique not null,
  customer_name text not null,
  rental_date date not null,
  shoe_size text not null,
  duration_hours int not null check (duration_hours > 0),
  price_per_hour numeric(10, 2) not null default 20000,
  total_price numeric(10, 2) not null,
  
  -- Payment fields
  payment_status text not null default 'pending' 
    check (payment_status in ('pending', 'paid', 'expired', 'failed')),
  payment_id text,
  payment_url text,
  payment_data jsonb default '{}'::jsonb,
  payment_expired_at timestamptz,
  paid_at timestamptz,
  doku_invoice_id text,
  doku_payment_reference text,
  
  -- Rental status
  rental_status text not null default 'waiting_payment'
    check (rental_status in ('waiting_payment', 'rental_active', 'completed')),
  started_at timestamptz,
  completed_at timestamptz,
  
  -- Audit
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## RPC Functions

### 1. `get_rental_stats_today()`

Returns today's rental statistics:

```json
{
  "total_revenue": 120000,
  "total_transactions": 6,
  "active_rentals": 2,
  "pending_payments": 1,
  "date": "2026-06-24"
}
```

### 2. `list_rentals(p_limit, p_offset, p_payment_status, p_rental_status, p_date)`

List rentals with filters. Returns rental records.

### 3. `start_rental(p_rental_id)`

Start rental after payment confirmed:

```json
{
  "success": true,
  "message": "Rental started successfully",
  "rental_id": 123
}
```

**Validations:**
- Payment status must be `paid`
- Rental status must be `waiting_payment`

### 4. `complete_rental(p_rental_id)`

Complete rental when customer returns rollerblade:

```json
{
  "success": true,
  "message": "Rental completed successfully",
  "rental_id": 123
}
```

**Validations:**
- Rental status must be `rental_active`

## Edge Functions

### 1. `create-doku-rental-checkout`

**Endpoint:** `POST /functions/v1/create-doku-rental-checkout`

**Request:**
```json
{
  "customerName": "John Doe",
  "customerPhone": "08123456789",
  "rentalDate": "2026-06-24",
  "shoeSize": "42",
  "durationHours": 2
}
```

**Response:**
```json
{
  "success": true,
  "rentalId": 1,
  "invoiceNumber": "RBL-1719244800000-ABC12",
  "totalPrice": 40000,
  "paymentUrl": "https://sandbox.doku.com/...",
  "paymentId": "token-xyz",
  "checkoutSdkUrl": "https://sandbox.doku.com/jokul-checkout-js/...",
  "expiresAt": "2026-06-24T10:15:00Z"
}
```

**Flow:**
1. Validate request
2. Calculate total: `price_per_hour × duration_hours`
3. Generate invoice number: `RBL-{timestamp}-{random}`
4. Create rental record in DB
5. Call DOKU Checkout API with QRIS
6. Return payment URL and checkout SDK URL

### 2. `doku-rental-webhook`

**Endpoint:** `POST /api/webhooks/doku-rental`

Webhook dari DOKU untuk update payment status.

**DOKU Payload:**
```json
{
  "order": {
    "invoice_number": "RBL-1719244800000-ABC12",
    "status": "ORDER_GENERATED"
  },
  "transaction": {
    "status": "SUCCESS"
  },
  "payment": {
    "token_id": "payment-ref-xyz"
  }
}
```

**Signature Verification:**
- Client-Id
- Request-Id
- Request-Timestamp
- Signature (HMAC SHA256)

**Status Mapping:**
- `SUCCESS` → `paid`
- `PENDING` → `pending`
- `EXPIRED` → `expired`
- `FAILED` → `failed`

### 3. `sync-doku-rental-status`

**Endpoint:** `POST /functions/v1/sync-doku-rental-status`

Manual sync payment status dari DOKU.

**Request:**
```json
{
  "rentalId": 123
}
```

**Use Cases:**
- Payment stuck di `pending`
- Webhook gagal
- Manual verification

## Frontend Components

### RentalTransactions.tsx

Location: `frontend/src/pages/admin/RentalTransactions.tsx`

**Features:**
- Dashboard stats (revenue, transactions, active, pending)
- Create rental form
- QRIS payment modal
- Rentals table with actions
- Real-time status sync
- Auto-refresh every 5 seconds

**Actions:**
- 🔄 Cek Status - Manual payment status check
- Mulai Rental - Start rental after payment
- Selesai - Complete rental

## Configuration

### Environment Variables

**Supabase Secrets:**
```bash
DOKU_CLIENT_ID=your-client-id
DOKU_SECRET_KEY=your-secret-key
DOKU_IS_PRODUCTION=false
DOKU_PAYMENT_METHOD_TYPES=QRIS
PUBLIC_APP_URL=https://your-domain.com
APP_ALLOWED_ORIGINS=https://your-domain.com
```

**Frontend (.env):**
```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_DOKU_IS_PRODUCTION=false
```

### DOKU Dashboard Setup

1. Login ke DOKU Dashboard
2. Buat merchant baru atau gunakan yang ada
3. Aktifkan payment method: **QRIS**
4. Set webhook URL: `https://your-domain.com/api/webhooks/doku-rental`
5. Copy Client ID dan Secret Key
6. Test di Sandbox dulu sebelum production

## Pricing

Default: **Rp 20.000 per jam**

Contoh perhitungan:
- 1 jam = Rp 20.000
- 2 jam = Rp 40.000
- 3 jam = Rp 60.000
- 5 jam = Rp 100.000

## Role Access

Role yang dapat akses rental system:

- ✅ `admin` - Full access
- ✅ `super_admin` - Full access
- ✅ `kasir` - Full access (target role)

Login kasir:
```
Email: rollerblade@gmail.com
Password: (set saat create user)
```

## Deployment

### 1. Deploy Migration

```bash
npm run supabase:db:push
```

Migration file: `20260624000000_create_rollerblade_rental_system.sql`

### 2. Deploy Edge Functions

```bash
# Deploy create checkout
npx supabase functions deploy create-doku-rental-checkout

# Deploy webhook
npx supabase functions deploy doku-rental-webhook

# Deploy sync status
npx supabase functions deploy sync-doku-rental-status
```

### 3. Create Kasir User

```sql
-- 1. Create auth user
insert into auth.users (email, encrypted_password, email_confirmed_at)
values ('rollerblade@gmail.com', crypt('your-password', gen_salt('bf')), now());

-- 2. Get user ID
select id from auth.users where email = 'rollerblade@gmail.com';

-- 3. Assign kasir role
insert into public.user_role_assignments (user_id, role)
values ('user-id-from-step-2', 'kasir');
```

### 4. Deploy Frontend

```bash
npm run build
# Deploy to Vercel or your hosting
```

### 5. Configure DOKU Webhook

Set webhook URL di DOKU Dashboard:
```
https://your-domain.com/api/webhooks/doku-rental
```

## Testing

### Local Testing

1. Start Supabase local:
```bash
npx supabase start
```

2. Deploy functions locally:
```bash
npx supabase functions serve
```

3. Run frontend:
```bash
npm run dev
```

4. Test with DOKU Sandbox credentials

### Production Testing

1. Deploy to production
2. Use small amount first (Rp 20.000)
3. Test full flow: Create → Pay → Start → Complete
4. Verify webhook receives callbacks
5. Check stats dashboard accuracy

## Monitoring

### Check Stats
```sql
select * from get_rental_stats_today();
```

### Check Pending Payments
```sql
select * from rentals
where payment_status = 'pending'
  and payment_expired_at < now()
order by created_at desc;
```

### Check Active Rentals
```sql
select * from rentals
where rental_status = 'rental_active'
order by started_at desc;
```

### Check Today's Revenue
```sql
select 
  count(*) as total_transactions,
  sum(total_price) as total_revenue
from rentals
where created_at::date = current_date
  and payment_status = 'paid';
```

## Troubleshooting

### Payment Stuck Pending

1. Klik tombol **"🔄 Cek Status"**
2. Atau manual query:
```sql
select * from rentals where invoice_number = 'RBL-xxx';
```
3. Call sync function via API atau Postman

### Webhook Not Receiving

1. Check DOKU Dashboard → Webhooks → Logs
2. Check Supabase Edge Function logs
3. Verify webhook URL correct
4. Check signature verification

### QRIS Not Showing

1. Check browser console for errors
2. Verify DOKU SDK loaded correctly
3. Check payment URL valid
4. Try different browser

## Future Enhancements

- [ ] Late fees for overtime
- [ ] Deposit/security system
- [ ] Equipment damage tracking
- [ ] Customer history & loyalty
- [ ] SMS/WhatsApp notifications
- [ ] Multiple locations support
- [ ] Equipment tracking (barcode/RFID)
- [ ] Automated reminders
- [ ] Analytics dashboard

## Support

For issues or questions:
1. Check Supabase logs
2. Check DOKU Dashboard logs
3. Check browser console
4. Review this documentation
5. Contact tech team
