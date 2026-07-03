# Testing Checklist - Kategori Baru shop.GLAM

**Status:** ✅ Ready to Test  
**Date:** 2026-07-03

---

## Pre-Testing Setup

```bash
# 1. Make sure dependencies are up to date
npm install

# 2. Start dev server
npm run dev

# 3. Open browser
# http://localhost:5173
```

---

## Test Scenarios

### ✅ TEST 1: Glam Page (/beauty)

**URL:** http://localhost:5173/beauty

**Expected Category Tabs:**
- [ ] "All Products" button
- [ ] Kategori baru dari database (cek dengan SQL dulu):
  - [ ] Jika ada subcategory dari SPARK MY FACE, harus muncul di tab

**Should NOT Show:**
- [ ] ❌ Makeup (kategori lama yang sudah dihapus)
- [ ] ❌ Skincare (kategori lama yang sudah dihapus)
- [ ] ❌ Haircare (kategori lama yang sudah dihapus)

**Products:**
- [ ] Harus show produk yang punya `department = 'glam'`
- [ ] Atau produk yang `retail_category_id` matches kategori glam

**Query untuk cek kategori yang seharusnya muncul:**
```sql
SELECT id, name, slug, parent_id
FROM retail_categories
WHERE department = 'glam' AND is_active = true
ORDER BY parent_id NULLS FIRST, name;
```

---

### ✅ TEST 2: Charm Bar Page (/charm-bar)

**URL:** http://localhost:5173/charm-bar

**Expected Category Tabs:**
- [ ] "All Products" button
- [ ] SPARK MY CHARMS subcategories:
  - [ ] BANGLES
  - [ ] BRACELET
  - [ ] CHARMS BASE
  - [ ] WELDED CHARMS
  - [ ] PENDANT CHARMS
  - [ ] KEYCHAINS
  - [ ] NECKLACES
  - [ ] RINGS

**Should NOT Show:**
- [ ] ❌ Main category "SPARK MY CHARMS" (hanya subcategories yang muncul)
- [ ] ❌ Kategori dari department lain (glam, sparkclub)

**Products:**
- [ ] Harus show produk yang punya `department = 'charmbar'`
- [ ] Atau produk yang `retail_category_id` matches kategori charmbar

**Test Filter:**
- [ ] Click "BANGLES" → should filter products to show only bangles
- [ ] Click "NECKLACES" → should filter products to show only necklaces
- [ ] Click "All Products" → should show all charm bar products

---

### ✅ TEST 3: Shop Page (/shop)

**URL:** http://localhost:5173/shop

**Expected Category Tabs:**
- [ ] "All Products" button
- [ ] SPARK MY NAILS (jika ada produk)
- [ ] SPARK MY HAIR (jika ada produk)
- [ ] SPARK MY STYLE (jika ada produk)
- [ ] Subcategories dari kategori di atas

**Should NOT Show:**
- [ ] ❌ SPARK MY FACE categories (those go to /beauty)
- [ ] ❌ SPARK MY CHARMS categories (those go to /charm-bar)
- [ ] ❌ Charm Bar products (BANGLES, BRACELET, etc.)
- [ ] ❌ Glam products (makeup, eyewear, glitter)

**Products:**
- [ ] Harus show produk yang punya `department = 'sparkclub'`
- [ ] TIDAK ada produk dengan `department = 'glam'`
- [ ] TIDAK ada produk dengan `department = 'charmbar'`
- [ ] TIDAK ada produk dengan `department = 'dressing'`

**Test Filter:**
- [ ] Click "SPARK MY NAILS" → should show nail products
- [ ] Click "SPARK MY HAIR" → should show hair products
- [ ] Search "glitter" → should NOT show glam glitter products (those are in /beauty)

---

### ✅ TEST 4: Product Assignment

**Check if products are on correct pages:**

```sql
-- Products that should be on GLAM page (/beauty)
SELECT id, title, department, retail_category_id
FROM product_retail
WHERE department = 'glam'
LIMIT 10;

-- Products that should be on CHARM BAR page (/charm-bar)
SELECT id, title, department, retail_category_id
FROM product_retail
WHERE department = 'charmbar'
LIMIT 10;

-- Products that should be on SHOP page (/shop)
SELECT id, title, department, retail_category_id
FROM product_retail
WHERE department = 'sparkclub'
OR (department IS NULL AND retail_category_id IS NULL)
LIMIT 10;
```

**Manual Test:**
- [ ] Pick 1 glam product → check it appears on /beauty
- [ ] Pick 1 charm product → check it appears on /charm-bar
- [ ] Pick 1 spark product → check it appears on /shop

---

### ✅ TEST 5: Navigation Between Pages

**Test navigation buttons:**
- [ ] From /beauty → Click "Charm" button → Goes to /charm-bar ✅
- [ ] From /beauty → Click "Spark" button → Goes to /shop ✅
- [ ] From /charm-bar → Click "Glam" button → Goes to /beauty ✅
- [ ] From /charm-bar → Click "Spark" button → Goes to /shop ✅
- [ ] From /shop → Click "Glam" button → Goes to /beauty ✅
- [ ] From /shop → Click "Charm" button → Goes to /charm-bar ✅

---

### ✅ TEST 6: Search Functionality

**Test search on each page:**

**Glam Page (/beauty):**
- [ ] Search "glitter" → shows glitter products
- [ ] Search "star" → shows star glitter products
- [ ] Search "makeup" → shows makeup products (if any)

**Charm Bar Page (/charm-bar):**
- [ ] Search "necklace" → shows necklace products
- [ ] Search "ring" → shows ring products
- [ ] Search "charm" → shows charm products

**Shop Page (/shop):**
- [ ] Search "hair" → shows hair products
- [ ] Search "bag" → shows bag products
- [ ] Search "glitter" → should NOT show glam glitter (already filtered out)

---

### ✅ TEST 7: Category Filter + Search Combo

**Test filter + search together:**
- [ ] /charm-bar → Select "NECKLACES" → Search "gold" → Shows only gold necklaces
- [ ] /shop → Select "SPARK MY STYLE" → Search "bag" → Shows only bags from style category

---

### ✅ TEST 8: Empty Categories

**Test categories without products:**
- [ ] If a category has 0 products, it should still appear in tabs (unless hidden by config)
- [ ] Clicking empty category should show "No products found" message

---

### ✅ TEST 9: Mobile Responsive

**Test on mobile view (Chrome DevTools):**
- [ ] Category tabs should be scrollable horizontally
- [ ] Navigation buttons (Glam/Charm/Spark) should be readable
- [ ] Products grid should be 2 columns on mobile
- [ ] Search bar should be full width

---

### ✅ TEST 10: Database Verification

**Final database checks:**

```sql
-- 1. Verify 23 glam categories exist
SELECT COUNT(*) as total FROM retail_categories WHERE department = 'glam';
-- Expected: 23

-- 2. Verify 5 main categories
SELECT COUNT(*) as main_categories FROM retail_categories 
WHERE department = 'glam' AND parent_id IS NULL;
-- Expected: 5

-- 3. Verify 18 subcategories
SELECT COUNT(*) as subcategories FROM retail_categories 
WHERE department = 'glam' AND parent_id IS NOT NULL;
-- Expected: 18

-- 4. Check no orphaned subcategories
SELECT * FROM retail_categories 
WHERE department = 'glam' 
  AND parent_id IS NOT NULL
  AND parent_id NOT IN (SELECT id FROM retail_categories WHERE department = 'glam');
-- Expected: 0 rows (empty)
```

---

## Known Issues / Notes

### Issue 1: Products without department
- Produk lama mungkin belum punya `department` field
- Sementara masih fall back ke `categorySlug` atau `retail_category_id`
- **Todo:** Update all products to have proper `department` value

### Issue 2: Category Images
- Kategori baru belum punya image/icon
- Sementara pakai default atau skip image
- **Todo:** Add category images if needed

---

## Success Criteria

✅ **Pass** jika:
- [ ] Semua 23 kategori baru ada di database
- [ ] Glam page show kategori SPARK MY FACE
- [ ] Charm Bar page show kategori SPARK MY CHARMS
- [ ] Shop page show kategori SPARK MY NAILS/HAIR/STYLE
- [ ] Kategori lama (Makeup, Skincare, Haircare) TIDAK muncul
- [ ] Products ter-route ke page yang benar
- [ ] Search & filter berfungsi di semua page
- [ ] Navigation antar page berfungsi

❌ **Fail** jika:
- [ ] Kategori lama masih muncul (Makeup, Skincare, Haircare)
- [ ] Glam products muncul di Shop page
- [ ] Charm products muncul di Glam/Shop page
- [ ] Category tabs tidak muncul
- [ ] Search/filter tidak berfungsi

---

## Testing Commands

```bash
# Run frontend
npm run dev

# Check database
Get-Content scripts\show-glam-tree.sql | npx supabase db query --linked

# Check diagnostics (TypeScript errors)
npm run lint

# Build test
npm run build
```

---

## After Testing

Jika semua test PASS:
1. ✅ Commit changes: `git add . && git commit -m "feat: update GLAM category structure"`
2. ✅ Push to staging/production
3. ✅ Update AGENTS.md jika perlu
4. ✅ Archive docs yang tidak diperlukan

Jika ada test FAIL:
1. ❌ Note down which test failed
2. ❌ Check browser console for errors
3. ❌ Check network tab for API errors
4. ❌ Run SQL queries to verify database state
5. ❌ Fix and re-test

---

**Ready to test!** 🧪✨
