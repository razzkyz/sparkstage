# 🔧 Troubleshooting: Preview Error "Unexpected token"

## 🐛 Error Yang Muncul

```
Gagal memproses AI. Pastikan file bukan format HEIC atau terlalu besar.
Detail: Unexpected token '<'; "<doctype"... is not valid JSON
```

## 🔍 Root Cause

Error ini terjadi karena library `@imgly/background-removal` mencoba fetch config/WASM files tapi malah dapat HTML response (kemungkinan 404 page atau redirect).

**Possible causes:**
1. WASM files tidak accessible di URL yang benar
2. Vite preview server me-redirect requests ke index.html (SPA fallback)
3. CORS headers tidak diset dengan benar untuk WASM files
4. Library mencoba load config dari URL yang salah

## ✅ Fixes Applied

### 1. Updated DevIDCardTest.tsx

**Change:** Remove explicit `publicPath` config, let library auto-detect

**Before:**
```typescript
const config = {
  publicPath: window.location.origin + '/',
  debug: true,
};
const imageBlob = await removeBackground(imageSrc, config);
```

**After:**
```typescript
// Let library auto-detect WASM file locations
const imageBlob = await removeBackground(imageSrc);
```

**Why:** Explicit publicPath might cause library to look in wrong location. Auto-detection works better.

### 2. Updated vite.config.ts

**Added CORS headers:**
```typescript
server: {
  headers: {
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
  },
},
preview: {
  headers: {
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
  },
},
```

**Why:** WASM and SharedArrayBuffer require these headers for security.

**Added optimizeDeps:**
```typescript
optimizeDeps: {
  exclude: ['onnxruntime-web'],
},
```

**Why:** Prevent Vite from pre-bundling onnxruntime-web (needs WASM files intact).

## 🧪 Testing Steps

### Step 1: Rebuild

```bash
# Clean previous build
rm -rf dist

# Rebuild with new config
npm run build
```

**Expected:**
```
✅ Copied ort-wasm-simd-threaded.wasm (12.08 MB)
✅ Copied ort-wasm-simd-threaded.jsep.wasm (22.81 MB)
📦 Total ONNX files copied: 2
```

### Step 2: Verify WASM Files

```bash
npm run verify:wasm
```

**Expected:**
```
✅ SUCCESS: WASM files present in dist/
```

### Step 3: Restart Preview Server

**IMPORTANT:** Preview server needs restart to pick up new config!

```bash
# Stop current preview (Ctrl+C)
# Then restart:
npm run preview
```

### Step 4: Test Again

Navigate to: http://localhost:4173/admin/dev-id-card-test

1. Upload foto
2. Click "🪄 Hapus Background"
3. Check browser console for logs:
   ```
   🎨 Starting background removal...
   📍 Current location: http://localhost:4173/admin/dev-id-card-test
   🔍 Base URL: http://localhost:4173/
   ```

### Step 5: Check Network Tab

Open browser DevTools → Network tab

**Look for:**
- `ort-wasm-simd-threaded.wasm` - Should be Status 200
- If 404 or redirect → WASM files not accessible

**Check response:**
- If you see HTML in response → Vite SPA fallback kicking in (BAD)
- If you see binary WASM data → Good!

## 🔍 Advanced Debugging

### Check if WASM Files Accessible

Open browser console:

```javascript
// Test 1: Check if file exists
fetch('/ort-wasm-simd-threaded.wasm')
  .then(r => console.log('WASM Status:', r.status, r.headers.get('content-type')))
  .catch(e => console.error('WASM Error:', e))

// Expected: Status 200, content-type: application/wasm

// Test 2: Check file size
fetch('/ort-wasm-simd-threaded.wasm')
  .then(r => r.blob())
  .then(blob => console.log('WASM Size:', blob.size, 'bytes'))

// Expected: ~12 million bytes (12 MB)
```

### Check Actual Files in Dist

```bash
# Windows
dir dist\*.wasm /s

# Should show:
# dist\ort-wasm-simd-threaded.wasm
# dist\ort-wasm-simd-threaded.jsep.wasm
```

## 🚨 If Still Failing

### Option 1: Manual WASM Path Test

Update DevIDCardTest.tsx temporarily:

```typescript
// Test explicit path
const config = {
  publicPath: 'http://localhost:4173/',
  debug: true,
};

console.log('Testing with explicit publicPath:', config.publicPath);
const imageBlob = await removeBackground(imageSrc, config);
```

### Option 2: Check Vite Preview Config

Verify preview server is serving from correct directory:

```bash
# Check Vite config
cat vite.config.ts | grep "outDir"

# Should be: outDir: path.resolve(__dirname, './dist')
```

### Option 3: Try Development Mode

If preview still fails, test in dev mode:

```bash
npm run dev
```

Navigate to: http://localhost:5173/admin/dev-id-card-test

**Note:** Dev mode might work because Vite serves from node_modules directly.

### Option 4: Disable SPA Fallback for WASM

Add to vite.config.ts preview section:

```typescript
preview: {
  headers: {
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
  },
  // Prevent SPA fallback for static assets
  proxy: {
    '^/.*\\.wasm$': {
      bypass: (req) => {
        console.log('WASM request:', req.url);
        return req.url; // Serve directly, don't fallback to index.html
      }
    }
  }
},
```

## 📊 Success Criteria

Preview test is successful when:

- [ ] WASM files return Status 200 in Network tab
- [ ] WASM files have `content-type: application/wasm`
- [ ] File size is correct (~12 MB)
- [ ] No HTML in WASM response
- [ ] Background removal works without JSON error
- [ ] Console shows: "✅ Background removal successful!"

## 📝 Next Steps

**If preview works:**
→ Proceed to deployment

**If preview still fails:**
→ Test in development mode (`npm run dev`)
→ If dev mode works but preview doesn't, it's a Vite preview server issue
→ Can skip preview test and deploy directly (production server handles static files better)

## 💡 Alternative: Skip Preview Test

If you're confident WASM files are in dist/, you can:

1. ✅ Verify: `npm run verify:wasm` passes
2. ✅ Check: WASM files exist in dist/
3. 🚀 Deploy directly to production
4. ✅ Test on production URL (production servers handle static files better than Vite preview)

**Production environments (Vercel, Netlify, etc.) have better static file handling than local preview server.**

---

**Last Updated:** 2026-07-22  
**Status:** Fixes applied, awaiting test results
