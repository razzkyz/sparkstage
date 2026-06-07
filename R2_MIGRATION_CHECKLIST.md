# 📋 Checklist Migrasi ImageKit → Cloudflare R2

**Tujuan**: Hemat $9/bulan dengan pindah ke R2 (zero egress cost)  
**Durasi Total**: 2-3 jam + 14 hari monitoring  
**Downtime**: ZERO (dual-run strategy)

---

## ✅ Pre-Migration (15-30 menit)

### Setup Cloudflare R2

- [ ] Login [Cloudflare Dashboard](https://dash.cloudflare.com)
- [ ] Buat R2 bucket: `sparkstage-public-assets`
- [ ] Enable **Public Access** pada bucket
- [ ] Buat R2 API Token dengan permission `Object Read & Write`
- [ ] Catat credentials:
  - [ ] Account ID: `_______________`
  - [ ] Access Key ID: `_______________`
  - [ ] Secret Access Key: `_______________`
- [ ] (Optional) Setup custom domain: `media.sparkstage55.com`
  - [ ] Connect domain di R2 bucket settings
  - [ ] Verify DNS record aktif

### Setup Environment

- [ ] Copy template: `copy .env.r2-migration.example .env.r2-migration`
- [ ] Edit `.env.r2-migration` dengan credentials
- [ ] Verify isi file minimal:
  ```
  R2_ACCOUNT_ID=xxx
  R2_ACCESS_KEY_ID=xxx
  R2_SECRET_ACCESS_KEY=xxx
  R2_BUCKET_NAME=sparkstage-public-assets
  R2_PUBLIC_BASE_URL=https://media.sparkstage55.com
  ```

---

## ✅ Phase 1: Testing (30 menit)

### Dry Run

- [ ] Run: `npm run r2:migrate:dry`
- [ ] Verify output:
  - [ ] No connection errors
  - [ ] Shows correct row count (~2117 images)
  - [ ] Sample URLs terlihat benar
  
### Test Migration (25 images)

- [ ] Run: `npm run r2:migrate -- --batch-size 25 --limit 25`
- [ ] Wait until selesai (~2-5 menit)
- [ ] Run: `npm run r2:migrate:status`
- [ ] Verify: `Success: 25`, `Failed: 0`

### Verify URLs Accessible

- [ ] Run: `npm run r2:verify`
- [ ] Verify: All URLs return 200 OK
- [ ] Manual test 3-5 URLs di browser
- [ ] Test dari mobile network (optional)

**✋ STOP jika ada failed URLs. Debug dulu sebelum lanjut.**

---

## ✅ Phase 2: Full Migration (30-60 menit)

### Start Full Migration

- [ ] Run: `npm run r2:migrate`
- [ ] Open terminal baru, run: `npm run r2:migrate:status`
- [ ] Monitor progress setiap 5-10 menit
- [ ] Expected: ~30-60 menit untuk 2000+ images

### Verify Completion

- [ ] Final status check: `npm run r2:migrate:status`
- [ ] Verify:
  - [ ] `Migrated: 2117 / 2117 (100%)`
  - [ ] `Failed: < 20` (dibawah 1%)
  - [ ] Success rate > 99%

### Post-Migration Verification

- [ ] Run: `npm run r2:verify -- --sample-size 50`
- [ ] Verify: 100% URLs accessible
- [ ] Check Cloudflare R2 dashboard:
  - [ ] Total files: ~2117
  - [ ] Storage used: ~1-2 GB
  - [ ] No errors in metrics

**✋ STOP jika success rate < 95%. Investigate failures.**

---

## ✅ Phase 3: Soak Period (24-48 jam)

**⏰ Start Date/Time**: `___ / ___ / _____ at __:__`

### Day 1 Checklist

- [ ] Test 20-30 random URLs: `npm run r2:verify`
- [ ] Browse website:
  - [ ] Homepage loads
  - [ ] Shop page loads (images masih dari ImageKit - normal)
  - [ ] Product detail page
  - [ ] Admin inventory
- [ ] Check R2 dashboard:
  - [ ] Files ada semua
  - [ ] No error metrics
  - [ ] Bandwidth cost = $0
- [ ] ImageKit subscription status: **Masih aktif** ✅

### Day 2 Checklist

- [ ] Test URLs lagi: `npm run r2:verify`
- [ ] Test dari berbagai device:
  - [ ] Desktop Chrome
  - [ ] Mobile Safari/Chrome
  - [ ] Wifi + Cellular data
- [ ] Check tidak ada user complaints
- [ ] R2 metrics stabil

**Go/No-Go Decision**

- [ ] ✅ All URLs accessible 100%
- [ ] ✅ No performance issues
- [ ] ✅ R2 metrics healthy
- [ ] ✅ Team ready untuk cutover
- [ ] ✅ Backup database ready

**Decision**: [ ] GO / [ ] NO-GO

**If NO-GO**: Document reason and retry after fix:  
`_______________________________________________________`

---

## ✅ Phase 4: Database Cutover (30 menit)

**⚠️ POINT OF NO RETURN - Hati-hati!**

**⏰ Cutover Date/Time**: `___ / ___ / _____ at __:__`

### Pre-Cutover

- [ ] Database backup verified ada
- [ ] Soak period 24-48 jam completed
- [ ] Team ready to monitor 2-3 jam
- [ ] ImageKit masih aktif (rollback safety)
- [ ] Low traffic time (ideal: dini hari)

### Cutover Dry Run

- [ ] Run: `npm run r2:cutover:dry`
- [ ] Review output:
  - [ ] Sample updates terlihat benar
  - [ ] Row count correct
  - [ ] No errors

### Production Cutover

- [ ] **DEEP BREATH** 🧘
- [ ] Run: `npm run r2:cutover:confirm`
- [ ] Wait until complete (~5-10 menit)
- [ ] Note completion time: `__:__`

### Immediate Verification (Within 5 Minutes!)

- [ ] Open: https://www.sparkstage55.com
- [ ] Test pages:
  - [ ] Homepage - images load?
  - [ ] Shop page - product grid shows?
  - [ ] Product detail - gallery works?
  - [ ] Admin inventory - thumbnails OK?
- [ ] DevTools → Network:
  - [ ] Filter: `img`
  - [ ] Images load from `media.sparkstage55.com` ✅
  - [ ] NOT from `ik.imagekit.io` ✅
- [ ] Check for broken images: `0` ✅
- [ ] Check console errors: `0` ✅

### Rollback Decision (If needed)

**Issue Detected**: `_____________________________________`

- [ ] Issue severity: [ ] CRITICAL / [ ] MAJOR / [ ] MINOR

**If CRITICAL (>5% broken images)**:

```sql
-- ROLLBACK NOW
UPDATE product_images
SET 
  image_url = provider_original_url,
  image_provider = 'imagekit'
WHERE image_provider = 'r2' 
  AND provider_original_url IS NOT NULL;
```

- [ ] Rollback executed at: `__:__`
- [ ] Verify images back to normal
- [ ] Document incident for review

**If SUCCESS**:

- [ ] ✅ Cutover successful!
- [ ] Screenshot evidence saved
- [ ] Monitoring started

---

## ✅ Phase 5: Post-Cutover Monitoring (7-14 hari)

**⏰ Monitoring Period**: `___ / ___ / _____ to ___ / ___ / _____`

### Daily Checklist

**Day 1-3** (Critical):

- [ ] Morning check: Browse site, check for issues
- [ ] Afternoon check: Review metrics
- [ ] Evening check: Final verification
- [ ] No broken images reported: ✅
- [ ] R2 metrics healthy: ✅
- [ ] ImageKit bandwidth dropping: ✅

**Day 4-7**:

- [ ] Daily site check
- [ ] Review Cloudflare R2 dashboard:
  - [ ] Requests: ~50-100K/week
  - [ ] Bandwidth cost: $0
  - [ ] Error rate: < 0.1%
- [ ] Review ImageKit dashboard:
  - [ ] Bandwidth: < 1 GB/week
  - [ ] Confirms cutover success

**Day 8-14**:

- [ ] Every 2-3 days check
- [ ] Monitor user feedback
- [ ] Prepare for cleanup

### Week 2 Go/No-Go

- [ ] Zero broken images for 7+ days
- [ ] R2 stable and cost = $0
- [ ] ImageKit bandwidth < 1 GB total
- [ ] No performance degradation
- [ ] User satisfaction maintained

**Decision**: [ ] GO to Cleanup / [ ] EXTEND Monitoring

---

## ✅ Phase 6: Cleanup (After 14 days stable)

**⏰ Cleanup Date**: `___ / ___ / _____`

### Cancel ImageKit Subscription

- [ ] Login to ImageKit dashboard
- [ ] Go to Billing/Subscription
- [ ] Cancel or downgrade to Free
- [ ] Confirm cancellation
- [ ] Screenshot confirmation saved
- [ ] **Cost Savings**: $9/month = **$108/year** 🎉

### Archive Migration Files

- [ ] Create archive folder:
  ```
  mkdir backups\r2-migration-archive
  move backups\r2-migration-manifest.jsonl backups\r2-migration-archive\
  move backups\r2-migration-summary.json backups\r2-migration-archive\
  ```
- [ ] Zip archive untuk long-term storage
- [ ] Backup to cloud/external drive
- [ ] Keep for audit trail (1 year minimum)

### Delete ImageKit Files (Optional - After 30 days)

**⏰ Safe to Delete After**: `___ / ___ / _____` (30 days post-cleanup)

- [ ] 30 days passed since cancellation
- [ ] R2 still stable
- [ ] No rollback needed
- [ ] Delete files from ImageKit (frees up space)

---

## 📊 Final Success Metrics

- [ ] **Cost Savings**: $9/month → $0/month ✅
- [ ] **Zero broken images**: 100% ✅
- [ ] **R2 bandwidth cost**: $0 (zero egress) ✅
- [ ] **ImageKit decommissioned**: Yes ✅
- [ ] **Migration manifest archived**: Yes ✅
- [ ] **Page load time**: Same or faster ✅

**🎉 MIGRATION COMPLETE! 🎉**

---

## 📝 Notes & Issues Log

**Date** | **Issue/Note** | **Resolution**
---------|----------------|---------------
         |                |
         |                |
         |                |

---

## 📞 Emergency Contacts

| Issue | Action |
|-------|--------|
| Broken images after cutover | **ROLLBACK IMMEDIATELY** - See Phase 4 |
| R2 URLs not accessible | Check public access + DNS + CORS |
| High R2 costs | Review metrics, should be $0 egress |
| Migration script errors | Check logs, resume with same command |

---

## 📚 Documentation Reference

- Full docs: `docs/runbooks/r2-migration.md`
- Quick start: `docs/runbooks/R2_MIGRATION_QUICKSTART.md`
- Scripts location: `scripts/migrate-imagekit-to-r2.mjs`

---

**Prepared by**: `_______________`  
**Approved by**: `_______________`  
**Started**: `___ / ___ / _____`  
**Completed**: `___ / ___ / _____`

**Status**: [ ] Planning / [ ] In Progress / [ ] Monitoring / [ ] ✅ Complete
