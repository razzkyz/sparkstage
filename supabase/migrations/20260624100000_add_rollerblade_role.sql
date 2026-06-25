-- =====================================================
-- Add Rollerblade Role (is_admin function update)
-- Created: 2026-06-24
-- NOTE: is_admin() update is already included in 
-- 20260624000000_create_rollerblade_rental_system.sql
-- This migration is a no-op safety net.
-- =====================================================

-- is_admin() already updated in 20260624000000 migration.
-- This ensures it's correct even if applied independently.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_role_assignments ura
    WHERE ura.user_id = auth.uid()
      AND ura.role_name IN ('admin', 'super_admin', 'super-admin', 'starguide', 'kasir', 'dressing_room_admin', 'ticket_admin', 'retail_admin', 'devops', 'dress', 'owner', 'print', 'rollerblade')
  )
$$;

COMMENT ON FUNCTION public.is_admin() IS 'Updated to include rollerblade role for rental-only access';
