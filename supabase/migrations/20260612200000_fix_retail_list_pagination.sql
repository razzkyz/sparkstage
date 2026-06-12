-- ============================================
-- Migration: Fix Retail List RPCs Pagination
-- Date: 2026-06-12
-- ============================================

CREATE OR REPLACE FUNCTION public.get_retail_stock_opening_list(p_limit INTEGER DEFAULT 50, p_offset INTEGER DEFAULT 0)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_result JSONB; v_total_count INTEGER;
BEGIN
  IF NOT (public.is_admin() OR auth.role() = 'service_role') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT COUNT(*) INTO v_total_count FROM public.retail_stock_openings;

  WITH paginated AS (
    SELECT so.*, u.email as created_by_email
    FROM public.retail_stock_openings so
    LEFT JOIN auth.users u ON so.created_by = u.id
    ORDER BY so.opening_date DESC, so.id DESC
    LIMIT p_limit OFFSET p_offset
  )
  SELECT jsonb_build_object(
    'data', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'opening_number', p.opening_number,
          'opening_date', p.opening_date,
          'location', p.location,
          'notes', p.notes,
          'status', p.status,
          'created_by', p.created_by,
          'created_by_email', p.created_by_email,
          'created_at', p.created_at,
          'updated_at', p.updated_at,
          'items_count', (SELECT COUNT(*) FROM public.retail_stock_opening_items soi WHERE soi.retail_stock_opening_id = p.id)
        ) ORDER BY p.opening_date DESC, p.id DESC
      ) FROM paginated p
    ), '[]'::jsonb),
    'total_count', v_total_count,
    'limit', p_limit,
    'offset', p_offset
  ) INTO v_result;

  RETURN v_result;
END; $$;

CREATE OR REPLACE FUNCTION public.get_retail_stock_adjustment_list(p_limit INTEGER DEFAULT 50, p_offset INTEGER DEFAULT 0)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_result JSONB; v_total_count INTEGER;
BEGIN
  IF NOT (public.is_admin() OR auth.role() = 'service_role') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT COUNT(*) INTO v_total_count FROM public.retail_stock_adjustments;

  WITH paginated AS (
    SELECT sa.*, u.email as created_by_email
    FROM public.retail_stock_adjustments sa
    LEFT JOIN auth.users u ON sa.created_by = u.id
    ORDER BY sa.adjustment_date DESC, sa.id DESC
    LIMIT p_limit OFFSET p_offset
  )
  SELECT jsonb_build_object(
    'data', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'adjustment_number', p.adjustment_number,
          'adjustment_date', p.adjustment_date,
          'adjustment_type', p.adjustment_type,
          'reason', p.reason,
          'notes', p.notes,
          'location', p.location,
          'created_by', p.created_by,
          'created_by_email', p.created_by_email,
          'created_at', p.created_at,
          'updated_at', p.updated_at,
          'items_count', (SELECT COUNT(*) FROM public.retail_stock_adjustment_items sai WHERE sai.retail_stock_adjustment_id = p.id)
        ) ORDER BY p.adjustment_date DESC, p.id DESC
      ) FROM paginated p
    ), '[]'::jsonb),
    'total_count', v_total_count,
    'limit', p_limit,
    'offset', p_offset
  ) INTO v_result;

  RETURN v_result;
END; $$;

CREATE OR REPLACE FUNCTION public.get_retail_stock_opname_list(p_limit INTEGER DEFAULT 50, p_offset INTEGER DEFAULT 0)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_result JSONB; v_total_count INTEGER;
BEGIN
  IF NOT (public.is_admin() OR auth.role() = 'service_role') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT COUNT(*) INTO v_total_count FROM public.retail_stock_opnames;

  WITH paginated AS (
    SELECT so.*, u.email as created_by_email
    FROM public.retail_stock_opnames so
    LEFT JOIN auth.users u ON so.created_by = u.id
    ORDER BY so.opname_date DESC, so.id DESC
    LIMIT p_limit OFFSET p_offset
  )
  SELECT jsonb_build_object(
    'data', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'opname_number', p.opname_number,
          'opname_date', p.opname_date,
          'location', p.location,
          'notes', p.notes,
          'status', p.status,
          'created_by', p.created_by,
          'created_by_email', p.created_by_email,
          'created_at', p.created_at,
          'updated_at', p.updated_at,
          'items_count', (SELECT COUNT(*) FROM public.retail_stock_opname_items soi WHERE soi.retail_stock_opname_id = p.id),
          'variance_count', (SELECT COUNT(*) FROM public.retail_stock_opname_items soi WHERE soi.retail_stock_opname_id = p.id AND soi.variance != 0)
        ) ORDER BY p.opname_date DESC, p.id DESC
      ) FROM paginated p
    ), '[]'::jsonb),
    'total_count', v_total_count,
    'limit', p_limit,
    'offset', p_offset
  ) INTO v_result;

  RETURN v_result;
END; $$;

GRANT EXECUTE ON FUNCTION public.get_retail_stock_opening_list(INTEGER, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_retail_stock_adjustment_list(INTEGER, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_retail_stock_opname_list(INTEGER, INTEGER) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
