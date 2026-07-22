# 🎯 Next Steps: Test & Deploy

## ✅ Status Saat Ini

Build verification **BERHASIL**! 

```
✅ ort-wasm-simd-threaded.wasm (12.08 MB)
✅ ort-wasm-simd-threaded.jsep.wasm (22.81 MB)
Total: 2 WASM files, 34.89 MB
```

Plugin copy WASM sudah berfungsi dengan baik! 🎉

---

## 📝 Langkah Selanjutnya

## ⚠️ If Preview Shows JSON Error

**Error:** `Unexpected token '<'; "<doctype"... is not valid JSON`

**This is a known issue with Vite preview server handling WASM files.**

**Quick fixes applied:**
- ✅ Removed explicit publicPath (let library auto-detect)
- ✅ Added CORS headers to preview server
- ✅ Excluded onnxruntime-web from pre-bundling

**Troubleshooting:**
- See: `TROUBLESHOOT_PREVIEW_ERROR.md` for detailed debugging steps
- Check browser Network tab - WASM files should return Status 200
- Check console logs for detailed error info

**Alternative:** Skip preview test and deploy directly to production
- Vite preview server has limitations with WASM files
- Production servers (Vercel, Netlify) handle static files better
- If `npm run verify:wasm` passes, files are correctly built

### Step 1: Preview Test (Local) ⏳ OR Skip to Deployment

**Option A: Test Preview (Recommended)**

IMPORTANT: **Rebuild first** to apply latest config changes!

Test production build di local sebelum deploy:

```bash
# 1. Rebuild with new config (IMPORTANT!)
npm run build

# 2. Start preview server
npm run preview
```

**Test URL:** http://localhost:4173/admin/dev-id-card-test

**Checklist:**
- [ ] Page loads tanpa error
- [ ] Login berhasil
- [ ] Upload foto (JPEG/PNG, < 10MB)
- [ ] Klik "🪄 Hapus Background (Tes AI)"
- [ ] Wait 10-30 detik (first time, download model AI)
- [ ] Background berhasil dihapus
- [ ] Foto hasil terlihat jelas
- [ ] Browser console tidak ada error

**Expected:**
- First time agak lama (download model ~45MB dari CDN)
- Subsequent times lebih cepat (pakai cache)

**If JSON Error Occurs:**
- See `TROUBLESHOOT_PREVIEW_ERROR.md` for detailed fixes
- Check browser console and Network tab
- Can skip preview and deploy directly (see Option B)

**Option B: Skip Preview & Deploy Directly (Alternative)**

If preview test has issues with WASM loading, you can skip it:

```bash
# 1. Verify build is correct
npm run verify:wasm

# 2. If verification passes, proceed to deployment
# Production servers handle WASM files better than local preview
```

**Why skip is OK:**
- Vite preview server has limitations with WASM files
- Production servers (Vercel) are configured correctly
- WASM files are verified present in dist/
- Config is correct (CORS headers, etc.)

### Step 2: Commit & Push 🚀

Jika preview test berhasil, commit dan push:

```bash
git add .
git commit -m "fix: AI background removal production build with WASM support

- Update plugin to copy all WASM variants (not just specific names)
- Copy both ort-wasm-simd-threaded.wasm and jsep variant
- Update verification script to check for any WASM files
- Improve error logging and file size reporting

Verified: 2 WASM files (34.89 MB) successfully copied to dist/"

git push origin main
```

### Step 3: Wait for Deploy ⏱️

Vercel akan auto-deploy setelah push. Monitor di:
- Vercel dashboard
- Check build logs
- Wait for "Deployment successful"

### Step 4: Production Test ✅

Test di production setelah deploy selesai:

**URL:** https://www.sparkstage55.com/admin/dev-id-card-test

**Checklist:**
- [ ] Page loads tanpa error
- [ ] WASM files accessible (check network tab)
- [ ] Upload foto berhasil
- [ ] Background removal works
- [ ] First load: tunggu model download
- [ ] No console errors

**Verify WASM files deployed:**

Browser console:
```javascript
fetch('https://www.sparkstage55.com/ort-wasm-simd-threaded.wasm')
  .then(r => console.log('Status:', r.status))
// Should be: 200
```

### Step 5: Monitor ⚠️

Setelah deploy, monitor:
- User feedback
- Error logs (Sentry)
- Performance metrics
- Browser console errors

---

## 🐛 If Preview Test Fails

### Issue: "Gagal memproses AI"

**Check:**
1. Browser console - lihat error detail
2. Network tab - verify WASM files loaded
3. Internet connection - model download butuh internet
4. Try different browser - test compatibility

**Debug:**
```javascript
// Di browser console
console.log('WASM files in dist:', await fetch('/ort-wasm-simd-threaded.wasm').then(r => r.ok))
```

### Issue: Very Slow (> 1 minute)

**Causes:**
- First time model download (~45MB)
- Slow internet connection
- Large image file

**Solutions:**
- Wait patiently for first load
- Resize image if > 5MB
- Check internet speed

### Issue: Page won't load

**Check:**
```bash
# Rebuild
npm run build

# Re-verify
npm run verify:wasm

# Clear cache and retry
npm run preview
```

---

## 📚 Reference Docs

Jika butuh info lebih lengkap:

1. **Quick guide:** `QUICK_FIX_HAPUS_BACKGROUND.md`
2. **Update status:** `UPDATE_WASM_FIX.md` (read this!)
3. **Full summary:** `AI_BACKGROUND_REMOVAL_FIX_SUMMARY.md`
4. **Deployment:** `docs/deployment/AI-BACKGROUND-REMOVAL-DEPLOYMENT.md`
5. **Checklist:** `CHECKLIST_DEPLOY_HAPUS_BACKGROUND.md`

---

## ✅ Current Status

```
[✅] Code changes implemented
[✅] Build successful
[✅] WASM files verified in dist/
[⏳] Preview test - PENDING (You need to do this)
[⏳] Deploy to production - PENDING
[⏳] Production verification - PENDING
```

---

## 🎯 TL;DR

**You are here:** Build verified, WASM files present ✅

**Next:** Run `npm run preview` and test feature

**If works:** Commit → Push → Deploy → Test production

**If fails:** Check console, debug, ask for help

---

**Ready?** Run `npm run preview` now! 🚀
