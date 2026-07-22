# ✅ Checklist Deploy: Fix Hapus Background

## 📋 Pre-Deploy (Local Testing)

### Step 1: Verify Code Changes
- [ ] `package.json` - dependency `onnxruntime-web` ada
- [ ] `vite.config.ts` - plugin `copy-onnx-wasm` ada
- [ ] `DevIDCardTest.tsx` - config `publicPath` ada

### Step 2: Build Test
```bash
npm run build
```

**Expected output:**
- [ ] ✅ Build selesai tanpa error
- [ ] ✅ Muncul pesan: "Copied ort-wasm-simd-threaded.wasm to dist/"
- [ ] ✅ Muncul pesan: "Copied ort-wasm-simd.wasm to dist/"
- [ ] ✅ Muncul pesan: "Copied ort-wasm.wasm to dist/"

### Step 3: Verify WASM Files
```bash
npm run verify:wasm
```

**Expected output:**
- [ ] ✅ Status: SUCCESS
- [ ] ✅ 3 WASM files found
- [ ] ✅ Total size: ~9.44 MB

### Step 4: Preview Test
```bash
npm run preview
```

**Test di: http://localhost:4173/admin/dev-id-card-test**

- [ ] ✅ Page loads tanpa error
- [ ] ✅ Login berhasil
- [ ] ✅ Upload foto berhasil (JPEG/PNG)
- [ ] ✅ Klik "🪄 Hapus Background" - tidak error
- [ ] ✅ Loading indicator muncul
- [ ] ✅ Background terhapus (tunggu 10-30 detik first time)
- [ ] ✅ Foto hasil bisa di-preview
- [ ] ✅ Browser console tidak ada error merah

---

## 🚀 Deploy

### Step 5: Commit & Push
```bash
git add .
git commit -m "fix: AI background removal production build with WASM support"
git push origin main
```

- [ ] ✅ Commit berhasil
- [ ] ✅ Push ke GitHub berhasil
- [ ] ✅ Vercel auto-deploy triggered

### Step 6: Wait for Deployment
- [ ] ✅ Vercel build status: SUCCESS
- [ ] ✅ Deployment complete
- [ ] ✅ Production URL ready

---

## 🧪 Post-Deploy (Production Testing)

### Step 7: Verify WASM Files Deployed

**Open browser console di production:**
```javascript
fetch('https://www.sparkstage55.com/ort-wasm-simd.wasm')
  .then(r => console.log('WASM Status:', r.status))
```

- [ ] ✅ Status: 200 (bukan 404)
- [ ] ✅ Content-Type: application/wasm

**Test manual:**
- [ ] ✅ Buka: https://www.sparkstage55.com/ort-wasm-simd.wasm
- [ ] ✅ File download (bukan 404 page)
- [ ] ✅ File size: ~3 MB

### Step 8: Test Background Removal Feature

**URL: https://www.sparkstage55.com/admin/dev-id-card-test**

- [ ] ✅ Login berhasil
- [ ] ✅ Page loads tanpa error
- [ ] ✅ Upload foto berhasil
- [ ] ✅ Klik "🪄 Hapus Background"
- [ ] ✅ Loading indicator muncul
- [ ] ✅ First time: tunggu 10-30 detik (download model AI)
- [ ] ✅ Background terhapus successfully
- [ ] ✅ Foto hasil terlihat jelas tanpa background

### Step 9: Browser Console Check
- [ ] ✅ Tidak ada error merah di console
- [ ] ✅ Network tab: WASM files loaded (200 status)
- [ ] ✅ Network tab: model.onnx downloaded (first time)

### Step 10: Repeat Test (Cached Model)
- [ ] ✅ Refresh page
- [ ] ✅ Upload foto baru
- [ ] ✅ Klik "🪄 Hapus Background"
- [ ] ✅ Processing cepat (3-7 detik, pakai cache)
- [ ] ✅ Background terhapus successfully

---

## 🎯 Success Criteria

All items below must be ✅:

### Build Phase
- [x] Code changes implemented
- [ ] Local build successful
- [ ] WASM files in dist/
- [ ] Preview test passed

### Deploy Phase
- [ ] Git push successful
- [ ] Vercel build successful
- [ ] WASM files deployed
- [ ] Production URL accessible

### Runtime Phase
- [ ] Feature works in production
- [ ] First load acceptable (< 40s)
- [ ] Cached load fast (< 10s)
- [ ] No console errors
- [ ] Background removal quality good

---

## ⚠️ If Any Step Fails

### Build Fails
```bash
# Clean and retry
rm -rf node_modules dist
npm install
npm run build
```

### WASM Not Copied
```bash
# Check plugin
cat vite.config.ts | grep "copy-onnx-wasm"

# Check source files
ls node_modules/onnxruntime-web/dist/*.wasm
```

### Preview Test Fails
- Check browser console for errors
- Verify internet connection (for model download)
- Try different browser
- Clear browser cache

### Production Test Fails
- Verify WASM files deployed (Step 7)
- Check Vercel build logs
- Verify no deploy errors
- Check browser console for specific error

---

## 📞 Need Help?

**Check documentation:**
1. **Quick guide:** `QUICK_FIX_HAPUS_BACKGROUND.md`
2. **Full summary:** `AI_BACKGROUND_REMOVAL_FIX_SUMMARY.md`
3. **Technical:** `docs/runbooks/AI-BACKGROUND-REMOVAL-FIX.md`
4. **Deployment:** `docs/deployment/AI-BACKGROUND-REMOVAL-DEPLOYMENT.md`
5. **Architecture:** `docs/architecture/ai-background-removal-flow.md`

**Common issues:**
- WASM 404 → Files not deployed, redeploy
- Very slow → Normal first time, model downloading
- CORS error → Check server headers
- Network error → Check internet connection

---

**Date:** 2026-07-22  
**Version:** 1.0  
**Status:** Ready for deployment testing
