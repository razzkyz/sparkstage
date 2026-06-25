-- =====================================================
-- Create Rollerblade Kasir User
-- Created: 2026-06-24
-- =====================================================

-- Step 1: Create user di Supabase Auth
-- Email: rollerblade@gmail.com
-- Password: (akan di-set manual di Supabase Dashboard atau bisa pakai crypt di bawah)

-- Option A: Via Supabase Dashboard (RECOMMENDED)
-- 1. Login ke Supabase Dashboard
-- 2. Go to Authentication → Users
-- 3. Click "Add User" (via email)
-- 4. Email: rollerblade@gmail.com
-- 5. Password: [your-secure-password]
-- 6. Auto Confirm: Yes
-- 7. Copy user ID yang di-generate
-- 8. Jalankan SQL di bawah dengan user ID tersebut

-- Option B: Via SQL (jika sudah punya user ID)
-- Ganti 'USER_ID_HERE' dengan ID user yang sudah dibuat

-- Step 2: Assign kasir role
-- Jalankan query ini setelah user dibuat:

insert into public.user_role_assignments (user_id, role)
values (
  -- Ganti dengan user ID dari step 1
  'USER_ID_HERE', -- <-- GANTI INI
  'kasir'
)
on conflict (user_id, role) do nothing;

-- Step 3: Verify assignment
select 
  u.id as user_id,
  u.email,
  ura.role,
  ura.created_at
from auth.users u
join public.user_role_assignments ura on ura.user_id = u.id
where u.email = 'rollerblade@gmail.com';

-- Expected output:
-- user_id | email                    | role  | created_at
-- --------|--------------------------|-------|------------
-- xxx-xxx | rollerblade@gmail.com    | kasir | 2026-06-24...

-- =====================================================
-- Alternative: Create user dengan SQL (Advanced)
-- =====================================================
-- HANYA gunakan ini jika tidak bisa pakai Dashboard

-- Uncomment dan edit password di bawah:

-- insert into auth.users (
--   instance_id,
--   id,
--   aud,
--   role,
--   email,
--   encrypted_password,
--   email_confirmed_at,
--   created_at,
--   updated_at,
--   raw_app_meta_data,
--   raw_user_meta_data,
--   is_super_admin,
--   confirmation_token,
--   email_change,
--   email_change_token_new,
--   recovery_token
-- ) values (
--   '00000000-0000-0000-0000-000000000000',
--   gen_random_uuid(),
--   'authenticated',
--   'authenticated',
--   'rollerblade@gmail.com',
--   crypt('GANTI_PASSWORD_INI', gen_salt('bf')), -- <-- GANTI PASSWORD
--   now(),
--   now(),
--   now(),
--   '{"provider":"email","providers":["email"]}'::jsonb,
--   '{}'::jsonb,
--   false,
--   '',
--   '',
--   '',
--   ''
-- )
-- returning id;

-- Kemudian gunakan ID yang dikembalikan untuk insert role assignment di atas

-- =====================================================
-- Verification Queries
-- =====================================================

-- Check if user exists
select id, email, email_confirmed_at, created_at 
from auth.users 
where email = 'rollerblade@gmail.com';

-- Check role assignment
select 
  ura.*,
  u.email
from public.user_role_assignments ura
join auth.users u on u.id = ura.user_id
where u.email = 'rollerblade@gmail.com';

-- Check if kasir can access rentals table (should return true)
set local role authenticated;
set local request.jwt.claims.sub to 'USER_ID_HERE'; -- Ganti dengan user ID

select exists (
  select 1 from public.rentals limit 1
) as can_access_rentals;

-- Reset role
reset role;

-- =====================================================
-- Quick Command Reference
-- =====================================================

-- Create user via Dashboard:
-- Dashboard → Authentication → Users → Add User (via email)
-- Email: rollerblade@gmail.com
-- Password: [your-password]
-- Auto Confirm: Yes

-- Get user ID:
-- select id from auth.users where email = 'rollerblade@gmail.com';

-- Assign role:
-- insert into public.user_role_assignments (user_id, role)
-- values ('[user-id]', 'kasir');

-- Test login:
-- Login ke app dengan email: rollerblade@gmail.com
-- Check menu: Should see "Rental Rollerblade"
