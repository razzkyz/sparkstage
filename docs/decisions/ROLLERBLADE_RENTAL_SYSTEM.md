# 🛼 Rollerblade Rental System - Quick Guide

## ✨ Fitur Utama

✅ Pembayaran QRIS via DOKU  
✅ Real-time payment tracking  
✅ Dashboard kasir  
✅ Auto-calculate pricing  
✅ Invoice auto-generated  
✅ Payment expiry 15 menit  

## 🚀 Quick Start

### 1. Deploy Database

```bash
npm run supabase:db:push
```

File: `supabase/migrations/20260624000000_create_rollerblade_rental_system.sql`

### 2. Deploy Edge Functions

```bash
npx supabase functions deploy create-doku-rental-checkout
npx supabase functions deploy doku-rental-webhook
npx supabase functions deploy sync-doku-rental-status
```

### 3. Create Kasir User

Login ke Supabase Dashboard → Authentication → Add User:

- Email: `rollerblade@gmail.com`
- Password: (your choice)
- Role: Assign `kasir` via `user_role_assignments` table

### 4. Configure DOKU

Set di DOKU Dashboard:
- Webhook URL: `https://your-domain.com/api/webhooks/doku-rental`
- Enable QRIS payment method

### 5. Deploy Frontend

```bash
npm run build
# Deploy ke Vercel
```

## 📱 User Flow

1. **Kasir login** → Buka menu **Rental Rollerblade** → **Transaksi Rental**
2. **Klik "Buat Transaksi Baru"**
3. **Isi form**: Nama, Tanggal, Ukuran Sepatu, Durasi (jam)
4. **Sistem generate QRIS** → Customer scan & bayar
5. **Payment confirmed** → Kasir klik **"Mulai Rental"**
6. **Customer selesai** → Kasir klik **"Selesai"**

## 💰 Pricing

**Rp 20.000 per jam**

Contoh:
- 1 jam = Rp 20.000
- 2 jam = Rp 40.000
- 3 jam = Rp 60.000

## 📊 Dashboard Stats

Dashboard menampilkan:
- 💵 Pendapatan Hari Ini
- 📝 Total Transaksi
- 🟢 Rental Aktif
- 🟡 Pembayaran Pending

Auto-refresh setiap 30 detik.

## 🔧 Files Created

### Database
- `supabase/migrations/20260624000000_create_rollerblade_rental_system.sql`

### Edge Functions
- `supabase/functions/create-doku-rental-checkout/index.ts`
- `supabase/functions/doku-rental-webhook/index.ts`
- `supabase/functions/sync-doku-rental-status/index.ts`

### Frontend
- `frontend/src/pages/admin/RentalTransactions.tsx`
- `frontend/src/app/routes/adminRoutes.ts` (updated)
- `frontend/src/constants/adminMenu.ts` (updated)

### Documentation
- `docs/runbooks/rollerblade-rental-system.md`

## 📋 Status Flow

```
[pending] → [paid] → [rental_active] → [completed]
    ↓
[expired/failed]
```

## 🎯 Access

Role yang bisa akses:
- ✅ `admin`
- ✅ `super_admin`
- ✅ `kasir` ← Target role

## 🧪 Testing

### Local
```bash
npx supabase start
npx supabase functions serve
npm run dev
```

### Production
1. Test dengan transaksi kecil (Rp 20.000)
2. Verify webhook callbacks
3. Check dashboard stats

## 📞 Kasir Account

```
Email: rollerblade@gmail.com
Password: (set during user creation)
```

## 🔍 Quick Checks

### Check Today's Stats
```sql
select * from get_rental_stats_today();
```

### Check Pending Payments
```sql
select * from rentals
where payment_status = 'pending'
order by created_at desc;
```

### Check Active Rentals
```sql
select * from rentals
where rental_status = 'rental_active'
order by started_at desc;
```

## 📚 Full Documentation

Lihat: `docs/runbooks/rollerblade-rental-system.md`

## ✅ Production Ready

Semua kode sudah production-ready:
- ✅ Security: RLS policies, auth checks, signature verification
- ✅ Error handling: Rollback on failure
- ✅ Validation: Input validation, status guards
- ✅ Monitoring: Stats dashboard, real-time updates
- ✅ Audit: created_by, timestamps

## 🎉 Done!

Deploy dan sistem siap digunakan! 🚀
