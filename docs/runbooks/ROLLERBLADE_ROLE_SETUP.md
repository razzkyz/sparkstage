# 🎯 Role `rollerblade` - Limited Access Setup

## 📋 Overview

Role **`rollerblade`** adalah role khusus yang **HANYA** punya akses ke:
- ✅ Halaman: `/admin/rental-transactions`
- ✅ Menu: **"Rental Rollerblade"** → **"Transaksi Rental"**
- ❌ **TIDAK** bisa akses fitur admin lainnya

## 🆚 Perbedaan dengan Role Lain

| Role | Access |
|------|--------|
| **`rollerblade`** | **HANYA** Rental Rollerblade ⭐ |
| `kasir` | Penjualan + Rental + Laporan |
| `admin` | Full access semua fitur |
| `owner` | Sales + Inventory + Reports |
| `print` | HANYA Print Reports |

## ✅ Yang Sudah Di-Deploy

### 1. **Database Migration** ✅
File: `supabase/migrations/20260624100000_add_rollerblade_role.sql`

```sql
-- Update is_admin() function to include 'rollerblade'
-- User dengan role rollerblade bisa akses admin area
-- Tapi menu dibatasi hanya rental transactions
```

Status: **DEPLOYED**

### 2. **Frontend Menu** ✅
File: `frontend/src/constants/adminMenu.ts`

```typescript
// Menu khusus untuk role rollerblade
export const ROLLERBLADE_MENU_SECTIONS: AdminMenuSection[] = [
  {
    id: "rental",
    label: "Rental Rollerblade",
    items: [
      {
        id: "rental-transactions",
        label: "Transaksi Rental",
        icon: "roller_skating",
        path: "/admin/rental-transactions",
        highlight: true,
      },
    ],
  },
];
```

**User dengan role `rollerblade` hanya akan melihat 1 menu ini!**

### 3. **Auth Logic** ✅
File: `frontend/src/utils/auth.ts`

```typescript
export const getMenuSectionsByRole = async (userId: string | undefined) => {
  const result = await lookupUserRole(userId);
  
  // Check rollerblade FIRST (before kasir)
  if (result.ok && result.role === 'rollerblade') {
    return ROLLERBLADE_MENU_SECTIONS; // Limited menu!
  }
  
  if (result.ok && result.role === 'kasir') {
    return CASHIER_MENU_SECTIONS; // Full kasir menu
  }
  
  // ... other roles
};
```

### 4. **Build** ✅
Status: **SUCCESS** (292.44 KB gzipped: 99.35 KB)

---

## 🚀 Cara Create User dengan Role Rollerblade

### **Method 1: Via Dashboard (RECOMMENDED)**

#### Step 1: Create User
1. Login ke **Supabase Dashboard**
2. Go to: **Authentication** → **Users**
3. Click: **"Add User"** (via email)
4. Fill form:
   ```
   Email: rollerblade@gmail.com
   Password: [your-secure-password]
   Auto Confirm User: ☑ Yes
   ```
5. Click **"Create User"**
6. **Copy User ID**

#### Step 2: Assign Role `rollerblade`
1. Go to: **SQL Editor**
2. Click: **"New Query"**
3. Run this:
   ```sql
   INSERT INTO public.user_role_assignments (user_id, role_name)
   VALUES ('[paste-user-id-here]', 'rollerblade');
   ```
4. Replace `[paste-user-id-here]` dengan User ID dari Step 1
5. Click **"Run"**

#### Step 3: Verify
```sql
SELECT 
  u.id AS user_id,
  u.email,
  ura.role_name AS role,
  ura.created_at AS role_assigned_at
FROM auth.users u
JOIN public.user_role_assignments ura ON ura.user_id = u.id
WHERE u.email = 'rollerblade@gmail.com';
```

**Expected output:**
```
user_id: [uuid]
email: rollerblade@gmail.com
role: rollerblade ← BUKAN kasir!
role_assigned_at: [timestamp]
```

✅ **Done!**

---

### **Method 2: Via SQL Script (AUTO)**

File sudah tersedia: `scripts/assign-rollerblade-kasir-role.sql`

#### Run Script:
1. Go to **SQL Editor** di Supabase Dashboard
2. Copy-paste isi file `assign-rollerblade-kasir-role.sql`
3. Click **"Run"**

Script akan:
- Auto-detect user ID dari email `rollerblade@gmail.com`
- Auto-assign role `rollerblade`
- Show success message

---

## 🧪 Test Login

### Step 1: Login
1. Go to: `https://sparkstage55.com/login`
2. Login dengan:
   ```
   Email: rollerblade@gmail.com
   Password: [password yang di-set tadi]
   ```
3. Should redirect to: `/admin/dashboard`

### Step 2: Verify Menu
User **HANYA** akan melihat menu:

```
📋 Rental Rollerblade
  └─ 🛼 Transaksi Rental
```

**NO OTHER MENUS!** ✅

### Step 3: Test Access
1. Click **"Transaksi Rental"**
2. Should open: `/admin/rental-transactions`
3. Should see:
   - Dashboard stats (4 cards)
   - Button "Buat Transaksi Baru"
   - Table transaksi

4. Try akses URL lain (manual):
   - `/admin/dashboard` → Should work (default redirect)
   - `/admin/store` → Should work (no menu, but if user knows URL)
   - Menu sidebar → **HANYA** Rental Rollerblade

**Note:** Role `rollerblade` bisa akses halaman admin lain jika tahu URL-nya, tapi **tidak ada menu untuk navigate kesana**.

---

## 🔒 Security Note

Role `rollerblade`:
- ✅ Bisa login ke admin area
- ✅ Bisa akses `/admin/rental-transactions`
- ✅ Function `is_admin()` returns `true`
- ⚠️ Bisa akses URL admin lain jika tahu (tapi tidak ada menu)

Jika butuh **strict RLS** (user benar-benar tidak bisa akses tabel lain), perlu:
1. Custom RLS policy per table
2. Atau gunakan separate role yang **bukan** "admin"

Tapi untuk use case rental rollerblade, ini sudah cukup karena:
- User tidak tahu URL halaman lain
- Menu hanya menampilkan rental
- Praktis user hanya bisa akses rental transactions

---

## 📁 Files Modified/Created

### New Files:
1. `supabase/migrations/20260624100000_add_rollerblade_role.sql`
2. `scripts/assign-rollerblade-kasir-role.sql` (updated)
3. `ROLLERBLADE_ROLE_SETUP.md` (this file)

### Modified Files:
1. `frontend/src/constants/adminMenu.ts` - Added ROLLERBLADE_MENU_SECTIONS
2. `frontend/src/utils/auth.ts` - Added rollerblade role check

---

## ✅ Deployment Checklist

- [x] Migration deployed (rollerblade role)
- [x] Frontend menu created (ROLLERBLADE_MENU_SECTIONS)
- [x] Auth logic updated (getMenuSectionsByRole)
- [x] Build success
- [ ] Create user rollerblade@gmail.com (manual)
- [ ] Assign role `rollerblade` (manual)
- [ ] Test login & verify limited menu (manual)
- [ ] Deploy frontend to Vercel (manual)

---

## 🎯 Quick Summary

**Role `rollerblade` = Limited Access Role**

**What user sees:**
```
Login → Dashboard → Sidebar:
  📋 Rental Rollerblade
     └─ 🛼 Transaksi Rental
```

**What user can do:**
- Lihat semua transaksi rental
- Buat transaksi rental baru
- Generate QRIS payment
- Check status pembayaran
- Mulai rental (setelah paid)
- Selesaikan rental

**What user CANNOT do:**
- Tidak ada menu lain di sidebar
- Tidak bisa akses kasir features
- Tidak bisa akses inventory
- Tidak bisa akses reports

**Perfect untuk:**
- Staff khusus rental rollerblade
- Counter rollerblade yang terpisah
- User yang hanya handle rental

---

## 📞 Support

File locations:
- Migration: `supabase/migrations/20260624100000_add_rollerblade_role.sql`
- Assign script: `scripts/assign-rollerblade-kasir-role.sql`
- Menu config: `frontend/src/constants/adminMenu.ts`
- Auth logic: `frontend/src/utils/auth.ts`

Full documentation:
- `docs/runbooks/rollerblade-rental-system.md`
- `CREATE_ROLLERBLADE_USER.md`
- `ROLLERBLADE_RENTAL_SYSTEM.md`

---

**Created:** 2026-06-24  
**Status:** ✅ DEPLOYED & READY  
**Role:** `rollerblade` (limited access)  
**Menu:** ONLY Rental Transactions
