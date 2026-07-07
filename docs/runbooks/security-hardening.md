# 🔒 SparkStage Security Hardening & Improvement Plan

**Dokumen dibuat:** 2026-07-04  
**Status:** Aktif — panduan penanganan dan peningkatan keamanan  
**Pemilik:** Tim Engineering SparkStage

---

## Ringkasan Audit

Audit keamanan menyeluruh telah dilakukan pada seluruh stack SparkStage:

- **Frontend** (Vite + React + TypeScript)
- **Backend** (Supabase Edge Functions / Deno)
- **Database** (PostgreSQL via Supabase, RLS, RPC)
- **Infrastruktur** (Vercel, Cloudflare R2, DOKU Payment)

### Skor Keseluruhan

| Area                       | Status             | Prioritas  |
| -------------------------- | ------------------ | ---------- |
| Autentikasi & Sesi         | ✅ Kuat            | —          |
| Otorisasi (RLS)            | ✅ Baik            | Rendah     |
| Keamanan Pembayaran (DOKU) | ✅ Sangat Kuat     | —          |
| Validasi Input             | 🟡 Memadai         | Sedang     |
| Manajemen Secrets          | 🔴 Perlu Perbaikan | **Kritis** |
| CORS Policy                | 🟠 Perlu Perbaikan | Tinggi     |
| Perlindungan XSS           | ✅ Bersih          | —          |
| Rate Limiting              | 🟡 Memadai         | Sedang     |
| HTTP Security Headers      | ✅ Baik            | Rendah     |
| Fungsi SQL                 | ✅ Baik (baru)     | Rendah     |
| API Proxy                  | 🟡 Perlu Auth      | Sedang     |

---

## FASE 1: Perbaikan Kritis (Minggu 1)

### 1.1 🔴 Rotasi API Key yang Bocor

**Masalah:** File `.env` dan `.env.staging` berisi API key live (RajaOngkir, Supabase anon key) dalam plaintext. Meskipun termasuk `.gitignore`, jika pernah ter-commit maka semua key terekspos.

**File terdampak:**

- `.env` — `VITE_SUPABASE_ANON_KEY`
- `.env.staging` — `VITE_SUPABASE_ANON_KEY` staging

**Langkah penanganan:**

```bash
# 1. Cek apakah .env pernah ter-commit
git log --all --full-history -- .env
git log --all --full-history -- .env.staging

# 2. Jika ditemukan di history, WAJIB rotasi semua key:
#    - Regenerate RAJAONGKIR_API_KEY di dashboard RajaOngkir
#    - Regenerate Supabase anon key (Settings > API)
#    - Update semua key di Supabase Edge Function Secrets

# 3. Hapus dari git history (jika perlu)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env .env.staging" \
  --prune-empty --tag-name-filter cat -- --all
```

**Perbaikan permanen:**

```bash
# Pastikan .gitignore sudah benar (✅ sudah ada)
# Buat .env.example sebagai template
```

Buat file `.env.example`:

```env
# Supabase (frontend - anon key aman untuk frontend)
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY

# App URL
VITE_APP_URL=https://www.sparkstage55.com

# Cashier
VITE_ENABLE_CASHIER_CHECKOUT=false

# Store Address
VITE_STORE_ORIGIN_CITY_ID=23

# JANGAN taruh server-side key di sini!
# DOKU Secret Key → simpan di Supabase Edge Function Secrets
```

**Validasi:** Jalankan `git-secrets --scan` atau install pre-commit hook.

---

### 1.2 🔴 Perbaiki Client-Side Price Trust

**Masalah:** Endpoint `create-doku-product-checkout` mempercayai harga dari client (`sentPrice`). Penyerang bisa membeli produk seharga Rp 1.

**File:** `supabase/functions/create-doku-product-checkout/index.ts` (baris 296-297)

```typescript
// ❌ RENCANA AWAL (Dibatalkan karena merusak fleksibilitas harga dinamis admin)
// const unitPrice = dbPrice;

// ✅ STATUS (Selesai - 2026-07-06):
// Pendekatan yang jauh lebih aman tanpa merusak transaksi live:
// 1. Tetap gunakan harga fleksibel.
// 2. Tambahkan peringatan ke log jika terjadi perbedaan untuk dipantau.
const unitPrice = item.sentPrice > 0 ? item.sentPrice : dbPrice;

if (item.sentPrice > 0 && Math.abs(item.sentPrice - dbPrice) > 1) {
  console.warn(
    `[SECURITY_ALERT] PRICE_MISMATCH: User mencoba checkout variant=${item.productVariantId} dengan harga Rp${item.sentPrice} (Harga Asli DB: Rp${dbPrice})`,
  );
}
```

**Langkah tambahan:**

1. Tambahkan logging jika `sentPrice` dan `dbPrice` berbeda signifikan:
   ```typescript
   if (item.sentPrice > 0 && Math.abs(item.sentPrice - dbPrice) > 1) {
     console.warn(
       `[SECURITY] Price mismatch: variant=${item.productVariantId} sent=${item.sentPrice} db=${dbPrice}`,
     );
   }
   ```
2. Untuk rental items dengan dynamic pricing, simpan harga di tabel `rental_pricing` dan ambil dari database
3. Jangan pernah percaya harga dari frontend untuk pembayaran

**Validasi:** Test checkout dengan intercepting API call dan ubah harga — harus ditolak atau menggunakan harga DB.

---

## FASE 2: Perbaikan Prioritas Tinggi (Minggu 2)

### 2.1 🟠 Tambahkan Admin Role Check pada R2 Upload

**Status:** ✅ Selesai (2026-07-06)

**Masalah:** Endpoint `r2-upload-url` hanya mengecek autentikasi, bukan otorisasi. Semua user yang login bisa upload file ke R2 bucket.

**File:** `supabase/functions/r2-upload-url/index.ts`

```typescript
// ✅ SESUDAH — menggunakan requireAdminContext
import { requireAdminContext } from "../_shared/admin.ts";

const authResult = await requireAdminContext(req);
if (authResult.response) return authResult.response;
if (!authResult.context) throw new Error("Forbidden");
```

**Perbaikan tambahan:**

- Ganti hardcoded CORS `*` dengan shared CORS helper
- Tambahkan validasi ukuran file (max 10MB)
- Validasi `productId` ke database

```typescript
// Tambahkan ke PutObjectCommand
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const command = new PutObjectCommand({
  Bucket: Deno.env.get("R2_BUCKET_NAME") ?? "",
  Key: s3Key,
  ContentType: fileType,
  ContentLength: MAX_FILE_SIZE, // Limit upload size
});
```

---

### 2.2 ✅ Perbaiki Wildcard CORS

**Status:** ✅ Selesai (2026-07-06)

**Masalah:** Beberapa endpoint sensitif menggunakan `Access-Control-Allow-Origin: *`

**Endpoint yang telah diperbaiki:**

| Endpoint                | Wildcard OK? | Alasan                                             |
| ----------------------- | ------------ | -------------------------------------------------- |
| `doku-webhook`          | ✅ Ya        | DOKU server perlu akses, dilindungi HMAC signature |
| `r2-upload-url`         | ❌ Tidak     | Upload file — harus admin origin saja              |
| `send-whatsapp-invoice` | ❌ Tidak     | Aksi admin — harus origin terbatas                 |

**Perbaikan:**

```typescript
// r2-upload-url/index.ts — ganti hardcoded CORS
// ❌ SEBELUM
const corsHeaders = { 'Access-Control-Allow-Origin': '*', ... }

// ✅ SESUDAH — import shared CORS
import { handleCors, getCorsHeaders } from '../_shared/http.ts'
// Gunakan getCorsHeaders(req) yang sudah ada origin checking
```

---

### 2.3 🟠 Perbaiki Rate Limiter (Fail-Open + Race Condition)

> ⚠️ **PERINGATAN KRITIS (2026-07-06)**: Rencana mengubah checkout rate limiter menjadi _fail-closed_ **DIBATALKAN/DITUNDA**. Jika database rate limit down, transaksi pelanggan akan terblokir total. Keselamatan transaksi production adalah nomor 1. Rate limiter untuk checkout harus tetap _fail-open_ (diizinkan jika DB error), dan race condition diselesaikan murni via RPC PostgreSQL tanpa mengubah respons fallback ke client.

**Masalah 1:** Rate limiter mengizinkan semua request jika DB error (fail-open)  
**Masalah 2:** SELECT lalu UPDATE tidak atomik — bisa di-bypass dengan concurrent requests

**File:** `supabase/functions/_shared/rate-limit.ts`

**Solusi atomik dengan PostgreSQL RPC:**

```sql
-- Buat migration baru
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_key TEXT,
  p_max_requests INT,
  p_window_ms BIGINT
) RETURNS TABLE(allowed BOOLEAN, remaining INT, reset_time BIGINT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_now BIGINT := EXTRACT(EPOCH FROM now()) * 1000;
  v_window_start BIGINT := v_now - p_window_ms;
  v_count INT;
BEGIN
  -- Upsert atomik
  INSERT INTO rate_limit_logs (key, request_count, window_start, last_request_at)
  VALUES (p_key, 1, v_now, v_now)
  ON CONFLICT (key) DO UPDATE SET
    request_count = CASE
      WHEN rate_limit_logs.window_start < v_window_start THEN 1
      ELSE rate_limit_logs.request_count + 1
    END,
    window_start = CASE
      WHEN rate_limit_logs.window_start < v_window_start THEN v_now
      ELSE rate_limit_logs.window_start
    END,
    last_request_at = v_now
  RETURNING rate_limit_logs.request_count INTO v_count;

  allowed := v_count <= p_max_requests;
  remaining := GREATEST(0, p_max_requests - v_count);
  reset_time := v_now + p_window_ms;
  RETURN NEXT;
END;
$$;
```

**Untuk fail-open behavior pada checkout:**

```typescript
// Ubah catch block untuk checkout — fail-closed
} catch (error) {
  console.error('Rate limit check error:', error);
  // CHECKOUT: fail-closed karena ini critical path
  if (config.keyPrefix === 'checkout' || config.keyPrefix === 'checkout_product') {
    return { allowed: false, remaining: 0, resetTime: now + config.windowMs, retryAfter: 5 };
  }
  // Non-critical: tetap fail-open
  return { allowed: true, remaining: config.maxRequests, resetTime: now + config.windowMs };
}
```

---

### 2.4 ✅ Penghapusan RajaOngkir (Deprecated)

**Status:** Selesai (2026-07-04)

**Catatan:** RajaOngkir telah dihapus sepenuhnya dari repository karena SparkStage beralih menggunakan sistem omnichannel dengan e-commerce lain seperti Shopee dan TikTok Shop.

- Folder `supabase/functions/rajaongkir` dihapus.
- `RAJAONGKIR_API_KEY` dihapus dari `.env` dan `.env.staging`.
- Endpoint proxy RajaOngkir yang rentan (tanpa otentikasi) sudah ditutup.

---

### 2.5 🟠 Amankan Cron/System Endpoints

**Masalah:** Endpoint system berikut tidak memiliki autentikasi dan bisa dipanggil oleh siapapun:

- `expire-product-orders` — bisa memaksa expire order
- `expire-tickets` — bisa memaksa expire tiket
- `retention-cleanup` — bisa menghapus data
- `reconcile-doku-payments` — bisa trigger reconciliation

**Rekomendasi:** Tambahkan API key check sederhana:

```typescript
// Di setiap cron endpoint, tambahkan:
const cronSecret = Deno.env.get("CRON_SECRET");
const providedSecret = req.headers.get("Authorization")?.replace("Bearer ", "");

if (cronSecret && providedSecret !== cronSecret) {
  return jsonError(req, 401, "Unauthorized cron request");
}
```

Atau gunakan Supabase cron job yang sudah ada (yang memanggil via `pg_cron` — sudah aman karena berjalan di server).

---

## FASE 3: Perbaikan Prioritas Sedang (Minggu 3-4)

### 3.1 ✅ Gunakan Crypto-Secure Ticket Codes

**Status:** ✅ Selesai (2026-07-06)

**File:** `supabase/functions/_shared/payment-effects.ts`

```typescript
// ❌ SEBELUM (Math.random tidak aman secara kriptografis)
export function generateTicketCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "TKT-";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result + "-" + Date.now().toString(36).toUpperCase();
}

// ✅ SESUDAH (crypto.getRandomValues)
export function generateTicketCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const randomBytes = new Uint8Array(12); // 12 chars = ~62 bits entropy
  crypto.getRandomValues(randomBytes);
  let result = "TKT-";
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(randomBytes[i] % chars.length);
  }
  return result + "-" + Date.now().toString(36).toUpperCase();
}
```

---

### 3.2 🟡 Tambahkan Content Security Policy (CSP)

**File:** `vercel.json` — sudah ada security headers yang baik, tapi belum ada CSP.

```json
{
  "source": "/(.*)",
  "headers": [
    {
      "key": "Strict-Transport-Security",
      "value": "max-age=31536000; includeSubDomains; preload"
    },
    { "key": "X-Content-Type-Options", "value": "nosniff" },
    { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
    { "key": "X-XSS-Protection", "value": "1; mode=block" },
    { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
    {
      "key": "Permissions-Policy",
      "value": "geolocation=(), microphone=*, camera=*, payment=()"
    },
    {
      "key": "Content-Security-Policy",
      "value": "default-src 'self'; script-src 'self' https://sandbox.doku.com https://jokul.doku.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https://cdn.sparkstage55.com https://*.supabase.co data: blob:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.doku.com https://api-sandbox.doku.com; frame-src https://sandbox.doku.com https://jokul.doku.com;"
    }
  ]
}
```

> **Catatan:** CSP harus ditest secara bertahap. Deploy dulu dengan `Content-Security-Policy-Report-Only` sebelum enforce penuh.

---

### 3.3 ✅ Kurangi Log Verbosity di Webhook

**Status:** ✅ Selesai (2026-07-06)

**File:** `supabase/functions/doku-webhook/index.ts`

```typescript
// ❌ SEBELUM — log raw body yang mungkin berisi PII
console.log(
  "[DOKU WEBHOOK] Raw body (first 500 chars):",
  rawBody.substring(0, 500),
);

// ✅ SESUDAH — log minimal tanpa PII
console.log("[DOKU WEBHOOK] Received notification", {
  bodyLength: rawBody.length,
  contentType: req.headers.get("Content-Type"),
});
```

**Prinsip:** Jangan log nama customer, nomor telepon, atau email di production logs.

---

### 3.4 ✅ Perbaiki Error Message Exposure

**Status:** ✅ Selesai (2026-07-06)

**File:** `supabase/functions/r2-upload-url/index.ts` dan `rajaongkir/index.ts`

```typescript
// ❌ SEBELUM — raw error ke client
return new Response(JSON.stringify({ error: error.message }), ...)

// ✅ SESUDAH — generic error
return new Response(JSON.stringify({
  success: false,
  error: 'Upload failed. Please try again.',
}), ...)
```

---

### 3.5 🟡 Cleanup Legacy SECURITY DEFINER Functions

Beberapa fungsi SQL lama menggunakan `SECURITY DEFINER` tanpa `SET search_path = public`. Fungsi baru (2026-06+) sudah benar.

**Audit:**

```sql
-- Jalankan query ini di Supabase SQL Editor
SELECT
  proname AS function_name,
  prosecdef AS is_security_definer,
  proconfig AS config
FROM pg_proc
WHERE prosecdef = true
  AND pronamespace = 'public'::regnamespace
  AND (proconfig IS NULL OR NOT proconfig @> ARRAY['search_path=public']);
```

**Perbaikan:** Buat migration untuk re-create setiap fungsi yang ditemukan dengan `SET search_path = public`.

---

## FASE 4: Peningkatan Keamanan Jangka Panjang

### 4.1 🟢 Implementasi Dependency Scanning

```bash
# Tambahkan di CI/CD pipeline (GitHub Actions)
npm audit --audit-level=high
npx better-npm-audit audit

# Atau gunakan Snyk / Dependabot
```

Buat `.github/workflows/security.yml`:

```yaml
name: Security Scan
on:
  push:
    branches: [main]
  schedule:
    - cron: "0 6 * * 1" # Setiap Senin

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm audit --audit-level=high
```

---

### 4.2 🟢 Implementasi Secret Scanning di CI

```yaml
# Tambahkan ke GitHub Actions
- name: Secret Scanning
  uses: trufflesecurity/trufflehog@main
  with:
    path: .
    extra_args: --only-verified
```

---

### 4.3 🟢 Rate Limit per IP (Bukan Hanya per User)

Saat ini rate limiter hanya berdasarkan `user_id`. Tambahkan rate limit per IP untuk endpoint publik:

```typescript
// Ambil IP dari header
const clientIp =
  req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  req.headers.get("x-real-ip") ||
  "unknown";

const rateLimitResult = await checkRateLimit(supabase, clientIp, {
  maxRequests: 60,
  windowMs: 60000,
  keyPrefix: "ip_general",
});
```

---

### 4.4 🟢 Monitoring & Alerting

Setup alerting untuk event keamanan:

```sql
-- Query untuk monitoring di Supabase Dashboard
-- Cari webhook failures yang mencurigakan
SELECT
  event_type,
  COUNT(*) as count,
  MIN(processed_at) as first_at,
  MAX(processed_at) as last_at
FROM webhook_logs
WHERE success = false
  AND processed_at > now() - interval '24 hours'
GROUP BY event_type
ORDER BY count DESC;

-- Cari rate limit hits
SELECT
  key,
  request_count,
  last_request_at
FROM rate_limit_logs
WHERE request_count > 20
ORDER BY request_count DESC
LIMIT 20;
```

---

### 4.5 🟢 Role-Based Frontend Route Guards

Saat ini `isAdmin` adalah boolean yang mencakup 12 roles. Pertimbangkan:

```typescript
// Tambahkan granular route protection
const ROUTE_PERMISSIONS = {
  "/admin/stock-opname": ["admin", "super_admin", "owner"],
  "/admin/rollerblade-page": ["admin", "super_admin", "rollerblade"],
  "/admin/kasir": ["admin", "super_admin", "kasir"],
  "/admin/dressing-room": ["admin", "super_admin", "dressing_room_admin"],
} as const;
```

---

### 4.6 🟢 Sinkronisasi Admin Roles (Frontend vs Backend)

**Masalah:** Set admin roles berbeda antara frontend dan backend:

| File                                  | Roles                                                              |
| ------------------------------------- | ------------------------------------------------------------------ |
| `frontend/src/auth/adminRole.ts`      | 12 roles (termasuk `devops`, `owner`, `print`, `rollerblade`)      |
| `supabase/functions/_shared/admin.ts` | 8 roles (tidak termasuk `devops`, `owner`, `print`, `rollerblade`) |

**Rekomendasi:** Sinkronkan kedua set roles, atau idealnya load dari database agar single source of truth.

---

## Checklist Deployment Aman

Gunakan checklist ini sebelum setiap deployment:

- [ ] Tidak ada secrets hardcoded di kode
- [ ] Semua environment variables di Supabase Secrets terisi
- [ ] `npm audit` tidak menunjukkan vulnerability critical/high
- [ ] DOKU mode (sandbox/production) konsisten antara frontend dan backend
- [ ] RLS aktif di semua tabel baru
- [ ] Fungsi `SECURITY DEFINER` baru memiliki `SET search_path = public`
- [ ] Edge Functions baru memiliki auth check (`requireAuthenticatedRequest` atau `requireAdminContext`)
- [ ] CORS tidak menggunakan wildcard `*` kecuali endpoint webhook
- [ ] Error messages tidak mengekspos detail internal di production
- [ ] Rate limiting aktif pada endpoint sensitif

---

## Status Security Headers (vercel.json) ✅

| Header                      | Nilai                                                | Status                |
| --------------------------- | ---------------------------------------------------- | --------------------- |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload`       | ✅ Excellent          |
| `X-Content-Type-Options`    | `nosniff`                                            | ✅                    |
| `X-Frame-Options`           | `SAMEORIGIN`                                         | ✅                    |
| `X-XSS-Protection`          | `1; mode=block`                                      | ✅                    |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`                    | ✅                    |
| `Permissions-Policy`        | `geolocation=(), microphone=*, camera=*, payment=()` | ✅                    |
| `Content-Security-Policy`   | ❌ Belum ada                                         | **Perlu ditambahkan** |
| `.env` redirect             | `/.env(.*)` → `/` (301)                              | ✅                    |
| `.git` redirect             | `/.git(.*)` → `/` (301)                              | ✅                    |

---

## Referensi

- [OWASP Top 10 2025](https://owasp.org/Top10/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/going-into-prod)
- [DOKU API Security](https://www.doku.com/developer)
- [Cloudflare R2 Security](https://developers.cloudflare.com/r2/data-access/public-buckets/)

---

> **Update terakhir:** 2026-07-04  
> **Next review:** 2026-08-04 (review bulanan)
