# 👤 Create Rollerblade Kasir User - Step by Step

## 📋 Prerequisites

✅ Database migration sudah deployed  
✅ Edge functions sudah deployed  
✅ Frontend sudah build  

## 🎯 Goal

Membuat user kasir dengan email `rollerblade@gmail.com` yang bisa akses sistem rental rollerblade.

---

## 🚀 Method 1: Via Supabase Dashboard (RECOMMENDED)

### **Step 1: Create User**

1. **Login ke Supabase Dashboard**
   ```
   https://supabase.com/dashboard
   ```

2. **Pilih project:** `sparkstage` (hogzjapnkvsihvvbgcdb)

3. **Go to Authentication → Users**
   - Click menu sidebar: **Authentication**
   - Click tab: **Users**

4. **Click "Add User"**
   - Select: **"Add user via email"**

5. **Fill form:**
   ```
   Email: rollerblade@gmail.com
   Password: [your-secure-password]
   Auto Confirm User: ☑ Yes (check this!)
   ```

6. **Click "Create User"**

7. **Copy User ID**
   - User akan muncul di list
   - Copy **User ID** (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
   - Save di notepad untuk step berikutnya

### **Step 2: Assign Kasir Role**

1. **Go to SQL Editor**
   - Click menu sidebar: **SQL Editor**
   - Click: **New Query**

2. **Run this SQL:**
   ```sql
   insert into public.user_role_assignments (user_id, role)
   values (
     'PASTE_USER_ID_HERE', -- Ganti dengan User ID dari Step 1
     'kasir'
   );
   ```

3. **Replace `PASTE_USER_ID_HERE`** dengan User ID yang di-copy tadi

4. **Click "Run"** atau tekan **Ctrl+Enter**

5. **Verify:** Should see "Success. No rows returned"

### **Step 3: Verify**

Run query ini untuk verify:

```sql
select 
  u.id as user_id,
  u.email,
  ura.role,
  ura.created_at as role_assigned_at
from auth.users u
join public.user_role_assignments ura on ura.user_id = u.id
where u.email = 'rollerblade@gmail.com';
```

**Expected output:**
```
user_id: [uuid]
email: rollerblade@gmail.com
role: kasir
role_assigned_at: [timestamp]
```

✅ **Done!** User rollerblade kasir sudah siap!

---

## 🚀 Method 2: Via SQL Script (AUTOMATIC)

Jika user sudah dibuat di Dashboard, jalankan script ini untuk auto-assign role:

### **Step 1: Run SQL Script**

File: `scripts/assign-rollerblade-kasir-role.sql`

1. **Go to SQL Editor** di Supabase Dashboard

2. **Copy-paste isi file:**
   ```sql
   -- Full content dari assign-rollerblade-kasir-role.sql
   ```

3. **Click "Run"**

4. **Check output:**
   ```
   NOTICE: SUCCESS: Kasir role assigned to user [uuid]
   ```

✅ **Done!** Auto-assigned!

---

## 🧪 Test Login

### **Step 1: Login ke App**

1. **Go to:** `https://sparkstage55.com/login`

2. **Login dengan:**
   ```
   Email: rollerblade@gmail.com
   Password: [password yang di-set tadi]
   ```

3. **Should redirect to:** `/admin/dashboard`

### **Step 2: Check Menu**

1. **Look for menu:** **Rental Rollerblade**

2. **Submenu should show:**
   ```
   🛼 Transaksi Rental
   ```

3. **Click "Transaksi Rental"**

4. **Should see:**
   - Dashboard dengan 4 stat cards
   - Button "Buat Transaksi Baru"
   - Table (kosong jika belum ada transaksi)

✅ **Success!** User kasir berfungsi dengan baik!

---

## 📁 SQL Scripts Available

**File locations:**

1. **Manual guide:**
   ```
   scripts/create-rollerblade-kasir.sql
   ```
   - Full step-by-step dengan comments
   - Option create user via SQL (advanced)

2. **Auto-assign script:**
   ```
   scripts/assign-rollerblade-kasir-role.sql
   ```
   - Auto-detect user ID
   - Auto-assign kasir role
   - Simple & quick

---

## 🔍 Troubleshooting

### ❌ "User not found"

**Solution:**
1. Check user exists:
   ```sql
   select * from auth.users where email = 'rollerblade@gmail.com';
   ```
2. If empty, create user di Dashboard dulu

### ❌ "Cannot login"

**Check:**
1. Email confirmed?
   ```sql
   select email, email_confirmed_at from auth.users 
   where email = 'rollerblade@gmail.com';
   ```
   - If `email_confirmed_at` is NULL, set **Auto Confirm** = Yes saat create

2. Password correct?
   - Try reset password di Dashboard

### ❌ "Menu Rental tidak muncul"

**Check role:**
```sql
select u.email, ura.role
from auth.users u
left join public.user_role_assignments ura on ura.user_id = u.id
where u.email = 'rollerblade@gmail.com';
```

If role is NULL or not 'kasir', run assign script lagi.

### ❌ "Access denied ke /admin/rental-transactions"

**Check RLS:**
```sql
-- Test as the user
set local role authenticated;
set local request.jwt.claims.sub to '[USER_ID]';

select count(*) from public.rentals;

reset role;
```

Should return a number (even 0), not error.

---

## 📊 Verification Checklist

- [ ] User created di Supabase Dashboard
- [ ] Email: rollerblade@gmail.com
- [ ] Email confirmed (Auto Confirm checked)
- [ ] User ID copied
- [ ] Kasir role assigned via SQL
- [ ] Verification query shows role = 'kasir'
- [ ] Login successful
- [ ] Menu "Rental Rollerblade" visible
- [ ] Can access /admin/rental-transactions
- [ ] Dashboard stats loading

---

## 🎉 Quick Summary

**3 Simple Steps:**

1. **Create user** di Supabase Dashboard
   - Email: rollerblade@gmail.com
   - Auto Confirm: Yes

2. **Assign role** via SQL:
   ```sql
   insert into public.user_role_assignments (user_id, role)
   values ('[USER_ID]', 'kasir');
   ```

3. **Test login** di app
   - Should see menu "Rental Rollerblade"

**That's it!** 🚀

---

## 📞 Need Help?

Check files:
- `scripts/create-rollerblade-kasir.sql` - Manual guide
- `scripts/assign-rollerblade-kasir-role.sql` - Auto script
- `docs/runbooks/rollerblade-rental-system.md` - Full documentation
