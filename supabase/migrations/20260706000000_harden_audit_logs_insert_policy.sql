-- ============================================
-- Migration: Harden Audit Logs Insert Policy
-- Description: 
--   Restricts the insert policy on audit_logs so that
--   only system roles (postgres, service_role, supabase_admin)
--   can insert, preventing arbitrary inserts from authenticated users.
-- ============================================

DROP POLICY IF EXISTS "service_can_insert_audit_logs" ON public.audit_logs;

CREATE POLICY "service_can_insert_audit_logs" ON public.audit_logs
  FOR INSERT
  WITH CHECK (current_user IN ('postgres', 'service_role', 'supabase_admin'));
