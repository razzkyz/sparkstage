# 🚀 AI Background Removal - Deployment Guide

## 📦 Pre-Deployment Checklist

### 1. Verify Build Configuration

✅ **Files Modified:**
- `vite.config.ts` - Plugin to copy WASM files
- `package.json` - Added `onnxruntime-web` dependency
- `frontend/src/pages/admin/DevIDCardTest.tsx` - publicPath configuration

### 2. Local Build Test

```bash
# Clean previous build
rm -rf dist

# Install dependencies (if not done)
npm install

# Build for production
npm run build
```

**Expected Console Output:**
```
vite v6.0.5 building for production...
✓ 2347 modules transformed.
...
✅ Copied ort-wasm-simd-threaded.wasm to dist/
✅ Copied ort-wasm-simd.wasm to dist/
✅ Copied ort-wasm.wasm to dist/
✓ built in 45s
```

### 3. Verify WASM Files in Dist

```bash
# Windows
dir dist\*.wasm

# Output should show:
# ort-wasm-simd-threaded.wasm
# ort-wasm-simd.wasm
# ort-wasm.wasm
```

### 4. Local Preview Test

```bash
npm run preview
```

Navigate to: `http://localhost:4173/admin/dev-id-card-test`

**Test Steps:**
1. ✅ Login as admin
2. ✅ Navigate to "DevOps: ID Card Print Test"
3. ✅ Upload foto (JPEG/PNG, < 10MB)
4. ✅ Click "🪄 Hapus Background (Tes AI)"
5. ✅ Wait for processing (5-30 seconds first time)
6. ✅ Verify background removed successfully

## 🌐 Production Deployment

### Option 1: Vercel (Recommended)

```bash
# Push to main branch
git add .
git commit -m "fix: AI background removal production build with WASM support"
git push origin main
```

**Vercel Auto-Deploy:**
- Vercel will automatically build and deploy
- Build command: `npm run build`
- Output directory: `dist`
- Node version: 18.x or higher

**Post-Deploy Verification:**
1. Wait for deployment to complete
2. Navigate to: `https://your-domain.com/admin/dev-id-card-test`
3. Test background removal feature
4. Check browser console for errors

### Option 2: Manual Deploy (Static Hosting)

```bash
# 1. Build locally
npm run build

# 2. Verify WASM files
ls dist/*.wasm

# 3. Upload entire dist/ folder to hosting
# Include ALL files: HTML, JS, CSS, WASM, images, etc.
```

**Important:** Ensure your static hosting serves `.wasm` files with correct MIME type:
```
Content-Type: application/wasm
```

## 🔍 Post-Deployment Checks

### 1. Verify WASM Files Accessible

Open browser dev tools → Network tab:

```bash
# These should load successfully (Status: 200)
https://your-domain.com/ort-wasm-simd-threaded.wasm
https://your-domain.com/ort-wasm-simd.wasm
https://your-domain.com/ort-wasm.wasm
```

### 2. Test Background Removal

**First Load (Cold Start):**
- May take 10-30 seconds to download AI model (~45MB) from CDN
- Model cached in browser for subsequent uses
- Check network tab for `model.onnx` download

**Subsequent Uses:**
- Should process in 2-5 seconds
- Uses cached model from browser

### 3. Monitor Errors

Watch browser console for:
- ❌ "Failed to load WASM" → Check WASM files deployed
- ❌ "Network error" → Check internet connection, CDN accessible
- ❌ "CORS error" → Check server headers

## 🐛 Troubleshooting

### Issue: "Gagal memproses AI" in Production

**Symptoms:**
- Works in localhost
- Fails in production with generic error

**Diagnosis:**

1. **Check WASM files deployed:**
   ```bash
   # Browser console
   fetch('https://your-domain.com/ort-wasm-simd.wasm')
     .then(r => console.log('WASM OK:', r.status))
     .catch(e => console.error('WASM Missing:', e))
   ```

2. **Check build output:**
   - Look for "✅ Copied *.wasm to dist/" messages
   - If missing, plugin didn't run

3. **Check file size:**
   - WASM files should be 1-10 MB each
   - If 0 bytes, file copy failed

**Solution:**
```bash
# Rebuild with verbose output
npm run build 2>&1 | tee build.log

# Check log for WASM copy messages
grep "Copied.*wasm" build.log
```

### Issue: First Load Very Slow

**Cause:** AI model downloading from CDN (normal behavior)

**Optimization:**
- Consider self-hosting model files (advanced)
- Show loading indicator with progress
- Inform user to wait on first use

### Issue: CORS Errors

**Cause:** WASM or model files blocked by CORS

**Fix (Vercel):**
Add to `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cross-Origin-Embedder-Policy",
          "value": "require-corp"
        },
        {
          "key": "Cross-Origin-Opener-Policy",
          "value": "same-origin"
        }
      ]
    }
  ]
}
```

**Fix (Other Hosting):**
Configure server to send proper CORS headers.

## 📊 Performance Expectations

### First Load (Cold Start)
- Model download: 45 MB from CDN
- Time: 10-30 seconds (depends on connection)
- Cached in browser (IndexedDB)

### Subsequent Loads
- Model from cache: instant
- Processing time: 2-5 seconds per image
- Depends on: image size, device CPU

### Browser Requirements
- Modern browser with WebAssembly support
- Chrome 90+, Firefox 89+, Safari 15+, Edge 90+
- WebGL support for GPU acceleration

## 📝 Rollback Plan

If deployment fails, rollback steps:

```bash
# 1. Revert commits
git revert HEAD~1

# 2. Push rollback
git push origin main

# 3. Or restore previous working version
git reset --hard <previous-commit-hash>
git push origin main --force
```

## ✅ Success Criteria

- [x] Build completes without errors
- [x] WASM files present in dist/
- [x] Preview test passes locally
- [ ] Production deployment successful
- [ ] WASM files accessible in production
- [ ] Background removal works in production
- [ ] No console errors
- [ ] Performance acceptable (< 30s first load)

## 📚 Additional Resources

- [Vite Production Build](https://vite.dev/guide/build.html)
- [ONNX Runtime Web](https://onnxruntime.ai/docs/tutorials/web/)
- [@imgly/background-removal](https://img.ly/showcases/background-removal-js)
- [WebAssembly Deployment](https://webassembly.org/docs/web/)

---

**Last Updated:** 2026-07-22
**Status:** Ready for deployment
