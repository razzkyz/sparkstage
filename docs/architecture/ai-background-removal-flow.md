# 🎨 AI Background Removal Architecture Flow

## 📊 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    SPARK STAGE - ID CARD SYSTEM                  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   DevIDCardTest.tsx                         │ │
│  │                                                              │ │
│  │  1. User uploads photo                                      │ │
│  │  2. Click "🪄 Hapus Background"                            │ │
│  │  3. Call: removeBackground(imageSrc, config)                │ │
│  └────────────────┬───────────────────────────────────────────┘ │
│                   │                                               │
│                   v                                               │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │         @imgly/background-removal (v1.7.0)                  │ │
│  │                                                              │ │
│  │  - Client-side AI processing                                │ │
│  │  - Uses ONNX Runtime Web                                    │ │
│  │  - No server upload needed                                  │ │
│  └────────────────┬───────────────────────────────────────────┘ │
│                   │                                               │
│                   v                                               │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │           onnxruntime-web (v1.21.0)                         │ │
│  │                                                              │ │
│  │  - WebAssembly Runtime                                      │ │
│  │  - Requires: *.wasm files                                   │ │
│  │  - Requires: *.mjs modules                                  │ │
│  └────────────────┬───────────────────────────────────────────┘ │
│                   │                                               │
└───────────────────┼───────────────────────────────────────────────┘
                    │
                    v
      ┌─────────────────────────────┐
      │   Browser WebAssembly VM     │
      │   - Loads WASM files         │
      │   - Executes AI model        │
      │   - Returns processed image  │
      └─────────────────────────────┘
```

## 🔄 Development vs Production Flow

### 🟢 Development (Localhost) - WORKING

```
User Action
    │
    v
┌───────────────────┐
│ Upload Photo      │
│ Click "Hapus BG"  │
└────────┬──────────┘
         │
         v
┌───────────────────┐
│ removeBackground()│
└────────┬──────────┘
         │
         v
┌───────────────────────────────────┐
│ ONNX Runtime Web                  │
│                                   │
│ Needs: *.wasm files               │
│ Location: node_modules/           │
│         onnxruntime-web/dist/     │
└────────┬──────────────────────────┘
         │
         v
┌───────────────────────────────────┐
│ Vite Dev Server                   │
│ ✅ Serves files from node_modules│
│ ✅ WASM files accessible          │
└────────┬──────────────────────────┘
         │
         v
    ✅ SUCCESS
    Background removed!
```

### 🔴 Production (Original) - BROKEN

```
User Action
    │
    v
┌───────────────────┐
│ Upload Photo      │
│ Click "Hapus BG"  │
└────────┬──────────┘
         │
         v
┌───────────────────┐
│ removeBackground()│
└────────┬──────────┘
         │
         v
┌───────────────────────────────────┐
│ ONNX Runtime Web                  │
│                                   │
│ Needs: *.wasm files               │
│ Looking for: /ort-wasm-simd.wasm  │
└────────┬──────────────────────────┘
         │
         v
┌───────────────────────────────────┐
│ Production Build (dist/)          │
│ ❌ WASM files NOT FOUND           │
│ ❌ Only JS/CSS/HTML bundled       │
└────────┬──────────────────────────┘
         │
         v
    ❌ FAILURE
    "Gagal memproses AI"
```

### 🟢 Production (Fixed) - WORKING

```
Build Process
    │
    v
┌───────────────────────────────────┐
│ npm run build                     │
│                                   │
│ 1. TypeScript compilation         │
│ 2. Vite bundle (JS/CSS/HTML)      │
│ 3. Copy assets to dist/           │
└────────┬──────────────────────────┘
         │
         v
┌───────────────────────────────────┐
│ 🆕 copy-onnx-wasm plugin         │
│                                   │
│ Source: node_modules/onnx.../dist/│
│ Target: dist/                     │
│                                   │
│ ✅ Copy *.wasm files              │
│ ✅ Copy *.mjs files               │
└────────┬──────────────────────────┘
         │
         v
┌───────────────────────────────────┐
│ dist/ folder                      │
│                                   │
│ ├── index.html                    │
│ ├── assets/                       │
│ │   ├── index-abc123.js           │
│ │   └── index-def456.css          │
│ ├── ort-wasm-simd-threaded.wasm ✅│
│ ├── ort-wasm-simd.wasm          ✅│
│ └── ort-wasm.wasm               ✅│
└────────┬──────────────────────────┘
         │
         v
    Deploy to Production
         │
         v
┌───────────────────────────────────┐
│ User Action                       │
│ Upload Photo → Hapus Background   │
└────────┬──────────────────────────┘
         │
         v
┌───────────────────────────────────┐
│ removeBackground(src, {           │
│   publicPath: domain.com/         │
│ })                                │
└────────┬──────────────────────────┘
         │
         v
┌───────────────────────────────────┐
│ ONNX Runtime Web                  │
│ Loads: domain.com/ort-wasm-*.wasm │
│ ✅ Files found at root            │
└────────┬──────────────────────────┘
         │
         v
    ✅ SUCCESS
    Background removed!
```

## 📦 File Structure Comparison

### Before Fix (Production Failed)

```
dist/
├── index.html
├── assets/
│   ├── index-abc123.js
│   ├── index-def456.css
│   └── ...
└── images/
    └── ...

❌ Missing: *.wasm files
❌ Result: Background removal fails
```

### After Fix (Production Works)

```
dist/
├── index.html
├── assets/
│   ├── index-abc123.js
│   ├── index-def456.css
│   └── ...
├── images/
│   └── ...
├── ort-wasm-simd-threaded.wasm ✅ (3.85 MB)
├── ort-wasm-simd.wasm          ✅ (3.12 MB)
└── ort-wasm.wasm               ✅ (2.47 MB)

✅ WASM files present
✅ Result: Background removal works
```

## 🔧 Technical Implementation

### vite.config.ts Plugin

```typescript
{
  name: 'copy-onnx-wasm',
  writeBundle() {
    // Hook: After Vite completes bundling
    
    const source = 'node_modules/onnxruntime-web/dist'
    const target = 'dist/'
    
    // Find all WASM and module files
    const files = [
      'ort-wasm-simd-threaded.wasm',
      'ort-wasm-simd.wasm', 
      'ort-wasm.wasm',
      // ... and *.mjs files
    ]
    
    // Copy each file to dist/
    files.forEach(file => {
      fs.copyFileSync(source + file, target + file)
      console.log(`✅ Copied ${file}`)
    })
  }
}
```

### DevIDCardTest.tsx Configuration

```typescript
const config = {
  // Tell library where to find WASM files
  publicPath: import.meta.env.PROD 
    ? window.location.origin + '/'  // Production: https://domain.com/
    : undefined,                     // Dev: use default (node_modules)
  
  debug: !import.meta.env.PROD      // Enable debug logs in dev
}

const imageBlob = await removeBackground(imageSrc, config)
```

## 📊 Performance Characteristics

### First Load (Cold Start)

```
User clicks "Hapus Background"
         │
         v
[Check browser cache]
         │
         v
    No cache found
         │
         v
Download AI Model (45 MB)
From: CDN (img.ly)
Time: 10-30 seconds
         │
         v
Store in IndexedDB
         │
         v
Load WASM Runtime
Time: 2-3 seconds
         │
         v
Process Image
Time: 2-5 seconds
         │
         v
✅ Result: Background removed
Total: 15-40 seconds
```

### Subsequent Loads (Warm)

```
User clicks "Hapus Background"
         │
         v
[Check browser cache]
         │
         v
✅ Model in cache (IndexedDB)
         │
         v
Load from cache (instant)
         │
         v
Load WASM Runtime
Time: 1-2 seconds
         │
         v
Process Image
Time: 2-5 seconds
         │
         v
✅ Result: Background removed
Total: 3-7 seconds
```

## 🌐 Network Flow

### WASM Files (from our server)

```
Browser Request:
GET https://www.sparkstage55.com/ort-wasm-simd.wasm

Server Response:
HTTP/1.1 200 OK
Content-Type: application/wasm
Content-Length: 3273416
Cache-Control: public, max-age=31536000

[Binary WASM data]
```

### AI Model (from CDN, first time only)

```
Browser Request:
GET https://cdn.img.ly/models/background-removal/model.onnx

CDN Response:
HTTP/1.1 200 OK
Content-Type: application/octet-stream
Content-Length: 47185920
Cache-Control: public, max-age=31536000

[Binary model data]

Stored in: IndexedDB
Key: imgly-background-removal-model
```

## 🔐 Security & Privacy

```
┌─────────────┐
│ User Photo  │
└──────┬──────┘
       │
       v
┌──────────────────────────────────┐
│ ❌ NOT uploaded to any server    │
│ ❌ NOT sent to external API      │
│ ✅ Processed 100% in browser     │
│ ✅ Uses local WebAssembly        │
│ ✅ Data never leaves device      │
└──────┬───────────────────────────┘
       │
       v
┌──────────────────┐
│ Processed Image  │
│ (background      │
│  removed)        │
└──────────────────┘
```

**Privacy Benefits:**
- No server upload needed
- No external API calls
- No data retention
- Works offline (after first model download)
- GDPR compliant (no data transfer)

## 📋 Troubleshooting Decision Tree

```
Background Removal Fails?
         │
         ├─→ [Check 1] WASM files in dist/?
         │   ├─→ Yes → Go to Check 2
         │   └─→ No  → Run: npm run build
         │            → Verify plugin runs
         │
         ├─→ [Check 2] WASM files deployed?
         │   ├─→ Yes → Go to Check 3
         │   └─→ No  → Redeploy with all files
         │
         ├─→ [Check 3] Files accessible?
         │   ├─→ Yes → Go to Check 4
         │   └─→ No  → Check server CORS/headers
         │
         ├─→ [Check 4] Internet connection?
         │   ├─→ Yes → Check browser console
         │   └─→ No  → Need connection for first load
         │
         └─→ [Check 5] Browser console errors?
             ├─→ CORS → Configure server headers
             ├─→ 404  → WASM files not deployed
             └─→ Network → Check firewall/proxy
```

## 🎯 Success Criteria

```
✅ Build Phase
   ├─→ npm run build succeeds
   ├─→ See "✅ Copied *.wasm" messages
   └─→ WASM files in dist/ folder

✅ Deployment Phase
   ├─→ All files uploaded to server
   ├─→ WASM files at root domain
   └─→ Accessible via HTTP/HTTPS

✅ Runtime Phase
   ├─→ Page loads without errors
   ├─→ Upload photo works
   ├─→ Background removal works
   ├─→ First load: 15-40s (model download)
   └─→ Subsequent: 3-7s (cached)
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-07-22  
**Related Docs:** 
- `AI_BACKGROUND_REMOVAL_FIX_SUMMARY.md`
- `docs/runbooks/AI-BACKGROUND-REMOVAL-FIX.md`
- `docs/deployment/AI-BACKGROUND-REMOVAL-DEPLOYMENT.md`
