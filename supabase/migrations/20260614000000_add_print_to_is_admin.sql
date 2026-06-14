-- Migration: Add print role to is_admin() function
-- Date: 2026-06-14
-- Description: Allow print role to access admin data like print_orders

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
      AND ura.role_name IN ('admin', 'super_admin', 'super-admin', 'starguide', 'kasir', 'dressing_room_admin', 'ticket_admin', 'retail_admin', 'devops', 'dress', 'owner', 'print')
  )
$$;
