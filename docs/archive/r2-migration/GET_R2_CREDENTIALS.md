# 🔑 Cara Mendapatkan R2 Access Keys (Bukan API Token!)

## ⚠️ PENTING: R2 Access Keys ≠ API Token

Yang kamu berikan adalah **API Token** (`cfat_...`), tapi R2 butuh **R2 Access Keys** (format berbeda).

---

## 📋 Step-by-Step: Dapatkan R2 Access Keys

### Step 1: Login Cloudflare Dashboard

1. Buka: https://dash.cloudflare.com
2. Login dengan account kamu

### Step 2: Navigasi ke R2

1. Di sidebar kiri, klik **R2 Object Storage**
2. Atau langsung: https://dash.cloudflare.com/?to=/:account/r2

### Step 3: Manage R2 API Tokens (Bukan Cloudflare API Token!)

1. Di R2 dashboard, klik **Manage R2 API Tokens**
2. Atau: https://dash.cloudflare.com/?to=/:account/r2/api-tokens

### Step 4: Create API Token

1. Click button **Create API Token**

**Form isian**:
```
Token name: sparkstage-r2-migration

Permissions:
  ☑️ Object Read & Write

TTL (Time to Live):
  ○ 1 hour
  ○ 1 day
  ○ 30 days
  ⦿ Forever (recommended)

Apply to buckets:
  ⦿ Apply to specific buckets only
  
  Select buckets:
    ☑️ sparkstage-public-assets
```

2. Click **Create API Token**

### Step 5: COPY Credentials (PENTING!)

**⚠️ Muncul popup dengan 3 values - COPY SEMUA sekarang, tidak bisa dilihat lagi!**

```
┌─────────────────────────────────────────────────────────┐
│ Your R2 API Token is ready                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Token ID:                                                │
│   1234567890abcdef1234567890abcdef                       │
│                                                          │
│ Access Key ID: (32 characters)                           │
│   a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6                       │
│                                                          │
│ Secret Access Key: (43 characters)                       │
│   a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w         │
│                                                          │
│ ⚠️  Keep your Secret Access Key safe!                    │
│    You won't be able to view it again.                   │
│                                                          │
│ [Copy All] [Done]                                        │
└─────────────────────────────────────────────────────────┘
```

**COPY 3 hal ini**:
1. **Access Key ID**: 32 characters (contoh: `a1b2c3d4e5f6...`)
2. **Secret Access Key**: 43 characters (contoh: `a1b2c3d4e5f6...w`)
3. **Account ID**: Sudah ada dari dashboard (58103a6169fd3011a58d558c15adb7c6)

### Step 6: Click "Done"

⚠️ **WARNING**: Setelah click "Done", Secret Access Key tidak bisa dilihat lagi!

---

## ✅ Update .env.r2-migration

Setelah dapat credentials, update file:

```env
R2_ACCOUNT_ID=58103a6169fd3011a58d558c15adb7c6
R2_ACCESS_KEY_ID=<paste 32-char Access Key ID>
R2_SECRET_ACCESS_KEY=<paste 43-char Secret Access Key>
R2_BUCKET_NAME=sparkstage-public-assets
R2_BASE_PATH=products
R2_PUBLIC_BASE_URL=https://58103a6169fd3011a58d558c15adb7c6.r2.cloudflarestorage.com
```

---

## 🔍 Cara Bedakan API Token vs Access Keys

| Type | Format | Length | Usage |
|------|--------|--------|-------|
| **Cloudflare API Token** | `cfat_...` | ~53 chars | Workers, CDN, DNS |
| **R2 Access Key ID** | Random alphanumeric | 32 chars | R2 Storage (S3-compatible) |
| **R2 Secret Access Key** | Random alphanumeric | 43 chars | R2 Storage (S3-compatible) |

**Yang kamu berikan**: `cfat_LYGy5lGCXJgLoziVV0Zj6czyWRBOObKasGUBwOv35a07b0b4` → **Cloudflare API Token** ❌

**Yang dibutuhkan**: 32-char Access Key ID + 43-char Secret Key → **R2 Access Keys** ✅

---

## 🚨 Troubleshooting

### Error: "Credential access key has length 53, should be 32"

**Penyebab**: Kamu pakai API Token (`cfat_...`), bukan R2 Access Key

**Solusi**: Follow step 1-6 di atas untuk create R2 API Token

### Error: "Bucket does not exist"

**Penyebab**: Bucket `sparkstage-public-assets` belum dibuat

**Solusi**:
1. R2 Dashboard → **Create bucket**
2. Bucket name: `sparkstage-public-assets`
3. Click **Create bucket**

### Error: "Access Denied"

**Penyebab**: Token tidak punya permission atau bucket scope salah

**Solusi**:
1. Delete token lama
2. Create token baru dengan:
   - Permission: **Object Read & Write**
   - Scope: **Apply to specific buckets** → `sparkstage-public-assets`

---

## ✅ Setelah Dapat Credentials Baru

1. Update `.env.r2-migration` dengan credentials yang benar
2. Test connection:
   ```powershell
   node scripts/test-r2-connection.mjs
   ```
3. Expected output:
   ```
   ✅ All tests passed! R2 is ready for migration.
   ```

---

**Next**: Setelah test connection OK, lanjut ke `R2_MIGRATION_CHECKLIST.md` untuk migrasi! 🚀
