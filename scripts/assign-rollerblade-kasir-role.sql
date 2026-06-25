-- =====================================================
-- Assign Rollerblade Role to User (AUTO)
-- Created: 2026-06-24
-- =====================================================

-- This script automatically gets the user ID and assigns rollerblade role
-- Prerequisites: User rollerblade@gmail.com must already exist in auth.users

-- ROLE: rollerblade
-- Access: HANYA halaman /admin/rental-transactions
-- Menu: HANYA "Transaksi Rental"
-- Tidak bisa akses menu/fitur admin lainnya

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get user ID for rollerblade@gmail.com
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'rollerblade@gmail.com';

  -- Check if user exists
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User rollerblade@gmail.com not found. Please create user first in Supabase Dashboard.';
  END IF;

  -- Assign rollerblade role (NOT kasir!)
  INSERT INTO public.user_role_assignments (user_id, role_name)
  VALUES (v_user_id, 'rollerblade')
  ON CONFLICT (user_id, role_name) DO NOTHING;

  -- Log success
  RAISE NOTICE 'SUCCESS: Rollerblade role assigned to user %', v_user_id;
  RAISE NOTICE 'User will ONLY have access to Rental Transactions page';
END $$;

-- Verify assignment
SELECT 
  u.id AS user_id,
  u.email,
  ura.role_name AS role,
  ura.created_at AS role_assigned_at
FROM auth.users u
JOIN public.user_role_assignments ura ON ura.user_id = u.id
WHERE u.email = 'rollerblade@gmail.com';

-- Expected output:
-- ✓ user_id: [uuid]
-- ✓ email: rollerblade@gmail.com
-- ✓ role: rollerblade (NOT kasir!)
-- ✓ role_assigned_at: [timestamp]

-- If you see the output above, user is ready to login! ✅
-- User akan HANYA melihat menu "Rental Rollerblade" → "Transaksi Rental"
