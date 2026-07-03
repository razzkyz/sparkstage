# 🧪 Quick Test - Kategori Baru

## Start Testing

```bash
npm run dev
```

---

## ✅ Test 1: Charm Bar Page
**URL:** http://localhost:5173/charm-bar

**Expected:** Category tabs show SPARK MY CHARMS subcategories
- BANGLES
- BRACELET  
- CHARMS BASE
- WELDED CHARMS
- PENDANT CHARMS
- KEYCHAINS
- NECKLACES
- RINGS

**Should NOT show:** Main category "SPARK MY CHARMS"

---

## ✅ Test 2: Glam (Beauty) Page
**URL:** http://localhost:5173/beauty

**Expected:** Category tabs show SPARK MY FACE subcategories (if any products exist)

**Should NOT show:** 
- ❌ Makeup
- ❌ Skincare
- ❌ Haircare

---

## ✅ Test 3: Shop Page
**URL:** http://localhost:5173/shop

**Expected:** Category tabs show:
- SPARK MY NAILS
- SPARK MY HAIR
- SPARK MY STYLE

**Should NOT show:**
- ❌ SPARK MY FACE
- ❌ SPARK MY CHARMS
- ❌ BANGLES, BRACELET, NECKLACE (those are in Charm Bar)
- ❌ Glitter, Makeup (those are in Glam)

---

## ✅ Test 4: Database Check

```bash
Get-Content scripts\show-glam-tree.sql | npx supabase db query --linked
```

**Expected:**
- 23 total categories
- 5 main categories
- 18 subcategories

---

## ✅ Pass Criteria

✅ **PASS** if:
- All 3 pages load without errors
- Correct categories show on each page
- Old categories (Makeup, Skincare, Haircare) do NOT appear
- Navigation between pages works

❌ **FAIL** if:
- Old categories still appear
- Category tabs are empty/missing
- Wrong products on wrong pages
- JavaScript errors in console

---

## 🆘 If Test Fails

1. Check browser console (F12)
2. Check network tab for API errors
3. Verify database: `Get-Content scripts\show-glam-tree.sql | npx supabase db query --linked`
4. Check `LAPORAN_FINAL_KATEGORI_GLAM.md` for details
