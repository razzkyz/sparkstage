# Cloudflare R2 Migration Runbook

Runbook ini adalah panduan lengkap untuk memindahkan gambar dari ImageKit ke Cloudflare R2 dengan aman tanpa downtime.

## Tujuan

1. Memindahkan semua product images dari ImageKit ke Cloudflare R2
2. Menghemat biaya bandwidth dengan zero-egress R2
3. Melakukan migrasi tanpa broken images di production
4. Maintain fallback ke ImageKit selama masa transisi

## Latar Belakang

Per May 2026, ImageKit Lite Plan ($9/bulan) dipakai untuk product images dengan:
- ~2117 product images
- ~20 GB bandwidth/5 hari pertama May
- Bandwidth limit Lite: 40 GB/bulan

Cloudflare R2 dipilih karena:
- Zero egress cost (tidak ada biaya bandwidth keluar)
- Free tier: 10 GB storage, 1M Class A operations, 10M Class B operations per bulan
- S3-compatible API
- Bisa pakai custom domain dengan Cloudflare CDN gratis

## Persiapan

### 1. Setup Cloudflare R2

1. Login ke [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Buka **R2** dari sidebar
3. Klik **Create bucket**
   - Nama bucket: `sparkstage-public-assets` (atau sesuai kebutuhan)
   - Location: Automatic
4. Buat **R2 API Token**:
   - Pergi ke **Manage R2 API Tokens**
   - **Create API Token**
   - Permissions: `Object Read & Write` untuk bucket yang dibuat
   - Copy `Access Key ID` dan `Secret Access Key`
5. Catat `Account ID` dari dashboard R2

### 2. Setup Custom Domain (Opsional tapi Direkomendasikan)

**Option A: Custom Domain via Cloudflare (Recommended)**

1. Pindahkan nameserver `sparkstage55.com` ke Cloudflare
2. Di R2 bucket settings, klik **Connect Domain**
3. Masukkan subdomain: `media.sparkstage55.com`
4. Cloudflare akan setup DNS record otomatis
5. Public URL: `https://media.sparkstage55.com`

**Option B: R2.dev Domain (Testing Only)**

1. Di R2 bucket settings, enable **Public Access**
2. Gunakan URL: `https://pub-[random-id].r2.dev`
3. **Note**: R2.dev dibatasi dan tidak direkomendasikan untuk production

### 3. Setup Environment File

```bash
# Copy template
copy .env.r2-migration.example .env.r2-migration

# Edit file dan isi credentials
notepad .env.r2-migration
```

Isi `.env.r2-migration`:

```env
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=sparkstage-public-assets
R2_BASE_PATH=products
R2_PUBLIC_BASE_URL=https://media.sparkstage55.com
```

## Fase Migrasi

### Phase 0: Dry Run & Verification

**Tujuan**: Memastikan script bekerja dengan benar tanpa mengubah apapun

```bash
# Test koneksi dan lihat rencana migrasi
npm run r2:migrate:dry
```

Output yang diharapkan:
- Connection ke Supabase berhasil
- Connection ke R2 berhasil (jika bukan dry-run)
- Menampilkan jumlah row yang akan dimigrasikan
- Menampilkan sample URL lama → URL baru

**Go/No-Go**: 
- ✅ Lanjut jika: Script berjalan tanpa error, sample URL terlihat benar
- ❌ Stop jika: Error koneksi, URL tidak sesuai format yang diharapkan

### Phase 1: Migrasi Batch Kecil (Testing)

**Tujuan**: Migrate 25-50 images untuk test production access

```bash
# Migrate batch pertama (25 images)
npm run r2:migrate -- --batch-size 25 --limit 25

# Check status
npm run r2:migrate:status
```

**Verifikasi Manual**:

1. Buka manifest file: `backups/r2-migration-manifest.jsonl`
2. Copy salah satu `new_image_url`
3. Buka URL di browser → pastikan gambar muncul
4. Test 3-5 URL berbeda

**Troubleshooting**:

| Error | Penyebab | Solusi |
|-------|----------|--------|
| `403 Forbidden` | R2 bucket tidak public | Enable public access di R2 settings |
| `404 Not Found` | File tidak terupload | Cek R2 bucket via dashboard |
| `CORS error` | CORS tidak dikonfigurasi | Tambah CORS policy di R2 bucket |
| `DNS not resolved` | Custom domain belum propagate | Tunggu 5-10 menit atau pakai r2.dev sementara |

**Go/No-Go**:
- ✅ Lanjut jika: Semua test URL accessible, tidak ada broken images
- ❌ Stop jika: URL tidak accessible, perbaiki masalah terlebih dahulu

### Phase 2: Migrasi Full (Production)

**Tujuan**: Migrate semua images ke R2

```bash
# Migrate semua images dengan batch size 50
npm run r2:migrate -- --batch-size 50 --concurrency 3

# Monitor progress (buka terminal baru)
npm run r2:migrate:status
```

**Expected Duration**: ~30-60 menit untuk 2000+ images (tergantung koneksi)

**Resume Support**: 
- Script otomatis skip images yang sudah berhasil
- Jika gagal/terputus, jalankan command yang sama lagi
- Script akan melanjutkan dari yang belum selesai

**Monitor Progress**:

```bash
# Check status setiap 5 menit
npm run r2:migrate:status
```

Output yang diharapkan:
```
R2 Migration Status Report
==================================================

Database Status:
  ImageKit provider: 2117 rows
  R2 provider: 0 rows

Migration Manifest:
  Total entries: 2117
  Success: 2117
  Failed: 0

Progress:
  Migrated: 2117 / 2117 (100.00%)
  Remaining: 0
```

**Go/No-Go**:
- ✅ Lanjut jika: Success rate > 99%, failed < 20 rows
- ❌ Stop jika: Failed rate > 5%, investigate errors

### Phase 3: Soak Period (Dual-Run)

**Tujuan**: Memastikan R2 stabil sebelum cutover database

**Duration**: 24-48 jam minimum

**Checklist**:

1. ✅ Semua images berhasil dimigrasikan ke R2
2. ✅ Test random sample 20-30 URLs dari manifest
3. ✅ Test dari berbagai device (Desktop, Mobile, Wifi, Cellular)
4. ✅ Monitor R2 metrics di Cloudflare dashboard
5. ✅ Pastikan tidak ada alert dari monitoring
6. ✅ ImageKit masih aktif sebagai backup

**Red Flags** (Stop cutover jika terjadi):
- ❌ URL R2 tidak accessible dari Indonesia
- ❌ Load time R2 lebih lambat dari ImageKit
- ❌ R2 bandwidth cost tiba-tiba tinggi (seharusnya $0)
- ❌ Images tidak tampil di mobile network

### Phase 4: Database Cutover (POINT OF NO RETURN)

**WARNING**: Fase ini mengubah database production. Harus dilakukan dengan hati-hati.

**Pre-cutover Checklist**:

- [ ] Backup database sudah ada
- [ ] Soak period 24-48 jam sudah selesai
- [ ] Semua images verified accessible
- [ ] ImageKit subscription masih aktif (safety net)
- [ ] Team siap monitor selama 2-3 jam setelah cutover
- [ ] Prepare rollback script jika diperlukan

**Dry Run Cutover**:

```bash
# Test database update tanpa mengubah apapun
npm run r2:cutover:dry
```

Output yang diharapkan:
- Show sample updates (old URL → new URL)
- Confirm jumlah rows yang akan diupdate
- No errors

**Actual Cutover**:

```bash
# PRODUCTION UPDATE - TIDAK BISA DIBATALKAN OTOMATIS
npm run r2:cutover:confirm
```

**Immediate Verification** (Lakukan dalam 5 menit):

1. Buka website production: https://www.sparkstage55.com
2. Test halaman berikut:
   - Homepage
   - Shop page (product grid)
   - Product detail page
   - Charm Bar page
   - Admin inventory page
3. Buka DevTools → Network → Filter images
4. Pastikan images load dari `media.sparkstage55.com` (bukan `ik.imagekit.io`)
5. Check for 404/broken images

**Rollback Plan** (Jika ada masalah):

```sql
-- Rollback product_images ke ImageKit URLs
UPDATE product_images
SET 
  image_url = provider_original_url,
  image_provider = 'imagekit'
WHERE image_provider = 'r2' 
  AND provider_original_url IS NOT NULL;
```

**Go/No-Go**:
- ✅ Success jika: Semua pages load dengan benar, no broken images
- ❌ Rollback jika: Broken images > 1%, slow load time, error rate tinggi

### Phase 5: Monitoring Period

**Duration**: 7-14 hari

**Daily Checklist**:

- [ ] Check website untuk broken images
- [ ] Monitor Cloudflare R2 metrics:
  - Total requests
  - Bandwidth (should be $0)
  - Storage usage
  - Error rate
- [ ] Monitor ImageKit bandwidth (should drop to ~0)
- [ ] Check user complaints/reports
- [ ] Verify backup manifests masih ada

**Expected Metrics After Cutover**:

| Metric | Before | After |
|--------|--------|-------|
| ImageKit bandwidth | ~20 GB/5 days | < 1 GB/month |
| R2 bandwidth cost | $0 | $0 |
| R2 requests | 0 | ~50-100K/month |
| Page load images | ik.imagekit.io | media.sparkstage55.com |

### Phase 6: Cleanup & Decommission

**ONLY AFTER 14 DAYS STABLE**

1. **Verify Stability**:
   - [ ] No broken images reported
   - [ ] R2 metrics stable
   - [ ] No performance issues
   - [ ] Backup manifests safe

2. **Cancel ImageKit** (Save $9/month):
   - Login ke ImageKit dashboard
   - Cancel subscription/downgrade ke Free
   - **DO NOT DELETE FILES YET**

3. **Optional: Delete ImageKit Files** (After 30 days):
   - Keep as emergency backup for 30 days
   - After 30 days, can delete from ImageKit to free up space

4. **Archive Migration Artifacts**:
   ```bash
   # Create archive
   mkdir backups\r2-migration-archive
   move backups\r2-migration-manifest.jsonl backups\r2-migration-archive\
   move backups\r2-migration-summary.json backups\r2-migration-archive\
   
   # Compress for long-term storage
   # Keep for audit trail
   ```

## Troubleshooting

### Images Not Loading After Cutover

**Symptoms**: 404 errors, broken image icons

**Diagnosis**:
```bash
# Check database
npm run r2:migrate:status

# Verify R2 access
curl https://media.sparkstage55.com/products/1/test.jpg
```

**Solutions**:
1. Check R2 bucket public access enabled
2. Verify DNS for custom domain
3. Check CORS configuration
4. Rollback if critical

### Slow Image Load Times

**Symptoms**: Images load slower than ImageKit

**Diagnosis**:
- Check Cloudflare CDN cache hit rate
- Test from multiple locations
- Compare R2 vs ImageKit load times

**Solutions**:
1. Enable Cloudflare CDN caching (should be automatic)
2. Set proper cache headers in R2
3. Consider Cloudflare Images transform (paid) for thumbnails

### High R2 Costs (Unexpected)

**Symptoms**: R2 shows unexpected charges

**Diagnosis**:
```bash
# Check Cloudflare R2 usage metrics
# Look for:
# - Class A operations (writes) - should be low after migration
# - Class B operations (reads) - expected high
# - Storage - should be ~1-2 GB
```

**Expected Costs**:
- Storage: 1-2 GB → **FREE** (under 10 GB)
- Egress: unlimited → **FREE** ($0 egress)
- Class A operations: ~2000 (migration) → **FREE** (under 1M)
- Class B operations: ~100K/month → **FREE** (under 10M)

## Rollback Matrix

| Phase | Rollback Method | Risk Level | Downtime |
|-------|-----------------|------------|----------|
| Phase 0-1 | No rollback needed | None | None |
| Phase 2 | Stop script, no changes | Low | None |
| Phase 3 | No rollback needed | Low | None |
| Phase 4 | SQL UPDATE to old URLs | **HIGH** | 5-10 min |
| Phase 5+ | Restore from backup | **CRITICAL** | 30-60 min |

## Success Criteria

Migration dianggap sukses jika:

- [x] Semua images accessible dari R2
- [x] Zero broken images di production
- [x] ImageKit bandwidth drop < 1 GB/month
- [x] R2 egress cost = $0
- [x] Page load time sama atau lebih cepat
- [x] 14 hari stable tanpa issue
- [x] ImageKit subscription cancelled

## Reference Commands

```bash
# Status check
npm run r2:migrate:status

# Resume migration
npm run r2:migrate

# Migrate specific product
npm run r2:migrate -- --only-product-id 123

# Migrate with custom batch size
npm run r2:migrate -- --batch-size 100 --concurrency 5

# Skip re-downloading (use cached files)
npm run r2:migrate -- --skip-download

# Cutover database
npm run r2:cutover:dry
npm run r2:cutover:confirm
```

## Contacts & Escalation

| Issue | Contact |
|-------|---------|
| Script errors | Check GitHub issues or agent |
| R2 access issues | Cloudflare support |
| Database issues | Supabase support |
| Production broken images | **ROLLBACK IMMEDIATELY** |

## Appendix A: CORS Configuration

If needed, add CORS policy to R2 bucket:

```json
[
  {
    "AllowedOrigins": ["https://www.sparkstage55.com", "https://sparkstage55.com"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

## Appendix B: Cache Headers

Recommended R2 bucket settings:
- Cache-Control: `public, max-age=31536000, immutable`
- CDN cache: Enabled (automatic with custom domain)

## Document History

| Date | Author | Changes |
|------|--------|---------|
| 2026-06-07 | Agent | Initial runbook created |
