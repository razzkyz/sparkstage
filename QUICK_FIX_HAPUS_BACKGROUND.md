# 🚀 Quick Fix: Hapus Background di Production

## ⚡ TL;DR

Fitur hapus background tidak jalan di production karena **file WASM tidak ter-copy ke build**. Sudah diperbaiki dengan auto-copy plugin.

## 🔧 Yang Sudah Diperbaiki

1. ✅ Tambah dependency `onnxruntime-web` 
2. ✅ Plugin auto-copy WASM files ke `dist/`
3. ✅ Konfigurasi `publicPath` untuk production
4. ✅ Better error messages
5. ✅ Script verifikasi build

## 🎯 Cara Test & Deploy

### 1. Build & Verify

```bash
npm run build
npm run verify:wasm
```

**Harus muncul:**
```
✅ Copied ort-wasm-simd-threaded.wasm to dist/
✅ Copied ort-wasm-simd.wasm to dist/
✅ Copied ort-wasm.wasm to dist/
```

### 2. Test Local

```bash
npm run preview
```

Buka: http://localhost:4173/admin/dev-id-card-test

Test:
1. Upload foto
2. Klik "🪄 Hapus Background"
3. Tunggu 10-30 detik (first time download model AI)
4. Harusnya background kehapus

### 3. Deploy

```bash
git add .
git commit -m "fix: AI background removal production"
git push origin main
```

### 4. Test Production

Buka: https://www.sparkstage55.com/admin/dev-id-card-test

Test lagi seperti step 2.

## ⚠️ Kalau Masih Error

### Check 1: WASM Files Ada?

Buka browser console:
```javascript
fetch('https://www.sparkstage55.com/ort-wasm-simd.wasm')
  .then(r => console.log('Status:', r.status))
```

Harus 200. Kalau 404, berarti file tidak ke-deploy.

### Check 2: Build Log

```bash
npm run build | grep "Copied.*wasm"
```

Harus ada 3 baris "✅ Copied".

### Check 3: Dist Folder

```bash
dir dist\*.wasm
```

Harus ada 3 file WASM.

## 📁 File yang Berubah

- `package.json` - tambah dependency
- `vite.config.ts` - plugin copy WASM
- `DevIDCardTest.tsx` - config publicPath

## 📚 Dokumentasi Lengkap

- **Summary:** `AI_BACKGROUND_REMOVAL_FIX_SUMMARY.md`
- **Technical:** `docs/runbooks/AI-BACKGROUND-REMOVAL-FIX.md`
- **Deployment:** `docs/deployment/AI-BACKGROUND-REMOVAL-DEPLOYMENT.md`

## ❓ FAQ

**Q: Kenapa lama pas pertama kali?**  
A: Normal, download model AI (45 MB) dari internet. Setelah itu di-cache browser, jadi cepat.

**Q: Kenapa bisa jalan di localhost tapi ga di production?**  
A: Localhost serve dari `node_modules/` langsung. Production harus copy file ke `dist/` dulu.

**Q: Apa aman pakai AI di browser?**  
A: Aman, semua proses client-side. Foto tidak di-upload ke server manapun.

**Q: Ukuran build nambah berapa?**  
A: +9.4 MB (WASM files). Tapi users cuma download sekali, terus di-cache.

---

**Butuh bantuan?** Lihat troubleshooting di `AI_BACKGROUND_REMOVAL_FIX_SUMMARY.md`
