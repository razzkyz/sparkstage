-- Migration: Fix print_orders RLS - add 'print' role
-- Date: 2026-06-14
-- Problem: print_orders_read_admin policy hardcodes roles and excludes 'print'

DROP POLICY IF EXISTS "print_orders_read_admin" ON public.print_orders;

CREATE POLICY "print_orders_read_admin"
  ON public.print_orders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM user_role_assignments
      WHERE user_role_assignments.user_id = auth.uid()
        AND user_role_assignments.role_name = ANY (
          ARRAY['admin', 'super_admin', 'kasir', 'owner', 'print']
        )
    )
  );
