-- ============================================
-- Script: Assign role "print" to print@gmail.com
-- Date: 2026-06-12
-- Description: Set role "print" untuk user print@gmail.com
-- ============================================

-- Step 1: Cari user_id dari email print@gmail.com
-- (Jalankan query ini dulu untuk verify user sudah ada)
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'print@gmail.com';

-- Step 2: Insert role "print" ke user_role_assignments
-- Ganti <USER_ID> dengan UUID yang didapat dari query di atas
-- ATAU gunakan subquery langsung:

INSERT INTO public.user_role_assignments (user_id, role_name)
SELECT id, 'print'
FROM auth.users
WHERE email = 'print@gmail.com'
ON CONFLICT (user_id, role_name) DO NOTHING;

-- Step 3: Verify role sudah ter-assign
SELECT 
  u.email,
  ura.role_name,
  ura.created_at
FROM public.user_role_assignments ura
JOIN auth.users u ON u.id = ura.user_id
WHERE u.email = 'print@gmail.com';

-- ============================================
-- Expected Output:
-- email: print@gmail.com
-- role_name: print
-- created_at: [timestamp sekarang]
-- ============================================

-- NOTES:
-- 1. Pastikan user print@gmail.com sudah dibuat di Supabase Auth
-- 2. Role "print" akan membatasi akses hanya ke menu Laporan
-- 3. User bisa login dan akan auto-redirect ke Laporan Staff
