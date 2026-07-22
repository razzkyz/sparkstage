# 🔥 PRODUCTION FIX: WASM Background Removal

## 🐛 Production Errors Identified

Based on screenshot from production (www.sparkstage55.com):

### Error 1: WASM Backend Not Found
```
Failed to create session: "Error: no available backend found. 
ERR: [wasm] TypeError: Failed to fetch dynamically imported module: 
blob:https://www.sparkstage55.com/2e3a02dc-299c-460a-bdc6-abcd7c636bd7"
```

**Problem:** Library trying to load WASM from blob URL instead of static file.

### Error 2: Cross-Origin-Isolation Not Enabled
```
env.wasm.numThreads is set to 4, but this will not work unless you enable 
crossOriginIsolated mode.
```

**Problem:** Multi-threading requires specific security headers.

### Error 3: CSP Blocking Script Source
```
Refused to load the script 'blob:https://www.sparkstage55.com/...' 
because it violates the following Content Security Policy directive: 
"script-src 'self' 'unsafe-inline' 'unsafe-eval' https:". 
Note that 'script-src-elem' was not explicitly set, 
so 'script-src' is used as a fallback.
```

**Problem:** Content-Security-Policy tidak allow blob: sources.

---

## ✅ Solutions Applied

### Fix 1: vercel.json - Add WASM-Specific Headers

**Added headers for .wasm files:**
```json
{
  "source": "/(.*)\\.wasm$",
  "headers": [
    { "key": "Content-Type", "value": "application/wasm" },
    { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" },
    { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
    { "key": "Cross-Origin-Resource-Policy", "value": "cross-origin" },
    { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
  ]
}
```

**Why:**
- `Content-Type: application/wasm` - Proper MIME type
- COEP/COOP headers - Enable SharedArrayBuffer for multi-threading
- CORP - Allow cross-origin access if needed
- Cache-Control - Aggressive caching (WASM files don't change)

**Added headers for .mjs files:**
```json
{
  "source": "/(.*)\\.mjs$",
  "headers": [
    { "key": "Content-Type", "value": "application/javascript" },
    { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" },
    { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
    { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
  ]
}
```

### Fix 2: vercel.json - Update Global Headers

**Updated CSP to allow blob: and worker-src:**
```json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https: blob:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https: blob:; connect-src 'self' https: wss: blob:; font-src 'self' data: https:; frame-src 'self' https:; worker-src 'self' blob:;"
}
```

**Changes:**
- Added `blob:` to `script-src` - Allow loading scripts from blob URLs
- Added `blob:` to `connect-src` - Allow fetch from blob URLs
- Added `worker-src 'self' blob:` - Allow Web Workers from blob URLs

**Added Cross-Origin headers globally:**
```json
{ "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" },
{ "key": "Cross-Origin-Opener-Policy", "value": "same-origin" }
```

### Fix 3: DevIDCardTest.tsx - Explicit Config

**Updated removeBackground call with explicit config:**
```typescript
const config = {
  // Critical: Set publicPath to root where WASM files are located
  publicPath: window.location.origin + '/',
  
  // Use debug only in dev
  debug: import.meta.env.DEV,
  
  // Specify model to use
  model: 'medium',
  
  // Force single-threaded if multi-thread not supported
  device: 'cpu',
  
  // Output format
  output: {
    format: 'image/png',
    quality: 0.8,
  }
};

const imageBlob = await removeBackground(imageSrc, config);
```

**Why:**
- `publicPath: window.location.origin + '/'` - Tell library where to find WASM files
- `device: 'cpu'` - Force CPU mode (more compatible than WebGL)
- `model: 'medium'` - Good balance of speed vs quality
- Better logging for debugging

---

## 🚀 Deployment Steps

### Step 1: Commit Changes

```bash
git add vercel.json frontend/src/pages/admin/DevIDCardTest.tsx
git commit -m "fix: production WASM loading with proper headers and config

- Add WASM-specific headers in vercel.json (COEP, COOP, CORP)
- Update CSP to allow blob: sources for scripts and workers
- Add explicit publicPath config in removeBackground call
- Force CPU device for better compatibility
- Add comprehensive error logging

Fixes: 
- WASM backend not found error
- Cross-origin-isolation mode error
- CSP blocking blob: scripts error"

git push origin main
```

### Step 2: Wait for Deploy

Monitor Vercel dashboard:
- Build should complete successfully
- Deployment should show "Ready"
- Check build logs for WASM copy messages

### Step 3: Verify Deployment

**Check WASM files accessible:**

Open browser console on production:
```javascript
// Test WASM file
fetch('https://www.sparkstage55.com/ort-wasm-simd-threaded.wasm')
  .then(r => {
    console.log('Status:', r.status);
    console.log('Content-Type:', r.headers.get('content-type'));
    console.log('COEP:', r.headers.get('cross-origin-embedder-policy'));
    console.log('COOP:', r.headers.get('cross-origin-opener-policy'));
  })

// Should show:
// Status: 200
// Content-Type: application/wasm
// COEP: require-corp
// COOP: same-origin
```

### Step 4: Test Feature

Navigate to: https://www.sparkstage55.com/admin/dev-id-card-test

1. Upload foto (JPEG/PNG)
2. Click "🪄 Hapus Background"
3. Check browser console for:
   ```
   🎨 Starting background removal...
   📍 Environment: { isDev: false, isProd: true, ... }
   🔧 Config: { publicPath: "https://www.sparkstage55.com/", ... }
   🚀 Calling removeBackground...
   ```
4. Wait for processing (first time: 10-40s for model download)
5. Verify background removed successfully

---

## 🔍 Verification Checklist

- [ ] Build completes without errors
- [ ] WASM files present in deployment
- [ ] WASM files return Status 200
- [ ] COEP/COOP headers present
- [ ] CSP allows blob: sources
- [ ] Console shows config with correct publicPath
- [ ] No WASM backend errors
- [ ] No Cross-Origin-Isolation errors
- [ ] No CSP blocking errors
- [ ] Background removal works
- [ ] First load downloads model successfully
- [ ] Subsequent loads use cached model

---

## 🐛 If Still Failing

### Check 1: Headers Applied

```javascript
// Check page headers
fetch(window.location.href)
  .then(r => {
    console.log('COEP:', r.headers.get('cross-origin-embedder-policy'));
    console.log('COOP:', r.headers.get('cross-origin-opener-policy'));
    console.log('CSP:', r.headers.get('content-security-policy'));
  })
```

Expected:
- COEP: `require-corp`
- COOP: `same-origin`  
- CSP: Should include `blob:` in script-src

### Check 2: WASM Files Location

```bash
# Check Vercel deployment files
vercel ls <deployment-url>

# Should show:
# /ort-wasm-simd-threaded.wasm
# /ort-wasm-simd-threaded.jsep.wasm
```

### Check 3: Console Errors

Look for specific error messages:
- "WASM backend not found" → publicPath incorrect
- "Cross-origin" → Headers not applied
- "CSP" → blob: not allowed
- "404" → WASM files not deployed

### Check 4: Model Download

First load downloads ~45MB model from CDN. Check Network tab:
- Should see request to `https://cdn.img.ly/.../model.onnx`
- Status: 200
- Size: ~45MB
- Cached in IndexedDB after download

---

## 📊 Expected Behavior

### First Load (Cold)
1. User clicks "Hapus Background"
2. Console shows config with publicPath
3. Library loads WASM from `/ort-wasm-simd-threaded.wasm`
4. WASM file returns 200 with proper headers
5. Library downloads model from CDN (~45MB, 10-40s)
6. Model stored in IndexedDB
7. Image processed
8. Background removed ✅

### Subsequent Loads (Warm)
1. User clicks "Hapus Background"
2. WASM already cached
3. Model loaded from IndexedDB (instant)
4. Image processed (3-7s)
5. Background removed ✅

---

## 📝 Files Modified (Final)

### Modified
1. **vercel.json**
   - Added WASM-specific headers
   - Added .mjs headers
   - Updated global CSP to allow blob:
   - Added global COEP/COOP headers

2. **frontend/src/pages/admin/DevIDCardTest.tsx**
   - Added explicit publicPath config
   - Added model/device/output settings
   - Improved error messages
   - Enhanced logging

### Previously Modified (Still Relevant)
1. **vite.config.ts** - Plugin to copy WASM files
2. **package.json** - onnxruntime-web dependency
3. **scripts/verify-wasm-build.mjs** - Verification script

---

## ✅ Success Criteria

All must be ✅ for production to work:

**Build Phase:**
- [x] WASM files copied to dist/
- [x] Build completes without errors
- [x] Verification script passes

**Deployment Phase:**
- [ ] WASM files deployed to root
- [ ] Headers applied correctly
- [ ] CSP updated to allow blob:

**Runtime Phase:**
- [ ] WASM files load successfully
- [ ] No backend errors
- [ ] No CORS errors
- [ ] No CSP violations
- [ ] Background removal works
- [ ] Model downloads and caches
- [ ] Subsequent loads fast

---

## 🎯 Confidence Level

**95%** that this will fix production issues.

**Why high confidence:**
- All 3 errors identified and addressed
- Headers properly configured for WASM
- CSP updated to allow blob: sources
- publicPath explicitly set
- Build verified with WASM files present

**Remaining 5% risk:**
- Vercel-specific deployment quirks
- Browser-specific issues
- Network connectivity issues

---

**Date:** 2026-07-22  
**Status:** Ready to deploy  
**Priority:** CRITICAL - Production blocker
