-- ============================================
-- Migration: Retail Stock Get RPCs
-- Date: 2026-06-12
-- ============================================

CREATE OR REPLACE FUNCTION public.get_retail_stock_opening_list(p_limit INTEGER DEFAULT 50, p_offset INTEGER DEFAULT 0)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_result JSONB; v_total_count INTEGER;
BEGIN
  IF NOT (public.is_admin() OR auth.role() = 'service_role') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT COUNT(*) INTO v_total_count FROM public.retail_stock_openings;

  SELECT jsonb_build_object(
    'data', COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', so.id, 'opening_number', so.opening_number, 'opening_date', so.opening_date, 'location', so.location, 'notes', so.notes, 'status', so.status, 'created_by', so.created_by, 'created_by_email', u.email, 'created_at', so.created_at, 'updated_at', so.updated_at,
        'items_count', (SELECT COUNT(*) FROM public.retail_stock_opening_items soi WHERE soi.retail_stock_opening_id = so.id)
      ) ORDER BY so.opening_date DESC, so.id DESC
    ), '[]'::jsonb),
    'total_count', v_total_count, 'limit', p_limit, 'offset', p_offset
  ) INTO v_result
  FROM public.retail_stock_openings so LEFT JOIN auth.users u ON so.created_by = u.id
  ORDER BY so.opening_date DESC, so.id DESC LIMIT p_limit OFFSET p_offset;
  RETURN v_result;
END; $$;

CREATE OR REPLACE FUNCTION public.get_retail_stock_opening_detail(p_opening_id BIGINT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_result JSONB;
BEGIN
  IF NOT (public.is_admin() OR auth.role() = 'service_role') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT jsonb_build_object(
    'id', so.id, 'opening_number', so.opening_number, 'opening_date', so.opening_date, 'location', so.location, 'notes', so.notes, 'status', so.status, 'created_by', so.created_by, 'created_by_email', u.email, 'created_at', so.created_at, 'updated_at', so.updated_at,
    'items', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', soi.id, 'retail_product_id', soi.retail_product_id, 'product_name', p.name, 'product_sku', p.slug, 'variant_id', soi.retail_product_id, 'variant_name', p.variant, 'variant_sku', p.slug, 'opening_quantity', soi.opening_quantity, 'unit', soi.unit, 'notes', soi.notes
        ) ORDER BY soi.id
      ) FROM public.retail_stock_opening_items soi LEFT JOIN public.product_retail p ON soi.retail_product_id = p.id WHERE soi.retail_stock_opening_id = so.id
    ), '[]'::jsonb)
  ) INTO v_result FROM public.retail_stock_openings so LEFT JOIN auth.users u ON so.created_by = u.id WHERE so.id = p_opening_id;
  RETURN v_result;
END; $$;

CREATE OR REPLACE FUNCTION public.get_retail_stock_adjustment_list(p_limit INTEGER DEFAULT 50, p_offset INTEGER DEFAULT 0)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_result JSONB; v_total_count INTEGER;
BEGIN
  IF NOT (public.is_admin() OR auth.role() = 'service_role') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT COUNT(*) INTO v_total_count FROM public.retail_stock_adjustments;

  SELECT jsonb_build_object(
    'data', COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', sa.id, 'adjustment_number', sa.adjustment_number, 'adjustment_date', sa.adjustment_date, 'adjustment_type', sa.adjustment_type, 'reason', sa.reason, 'notes', sa.notes, 'location', sa.location, 'created_by', sa.created_by, 'created_by_email', u.email, 'created_at', sa.created_at, 'updated_at', sa.updated_at,
        'items_count', (SELECT COUNT(*) FROM public.retail_stock_adjustment_items sai WHERE sai.retail_stock_adjustment_id = sa.id)
      ) ORDER BY sa.adjustment_date DESC, sa.id DESC
    ), '[]'::jsonb),
    'total_count', v_total_count, 'limit', p_limit, 'offset', p_offset
  ) INTO v_result
  FROM public.retail_stock_adjustments sa LEFT JOIN auth.users u ON sa.created_by = u.id
  ORDER BY sa.adjustment_date DESC, sa.id DESC LIMIT p_limit OFFSET p_offset;
  RETURN v_result;
END; $$;

CREATE OR REPLACE FUNCTION public.get_retail_stock_opname_list(p_limit INTEGER DEFAULT 50, p_offset INTEGER DEFAULT 0)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_result JSONB; v_total_count INTEGER;
BEGIN
  IF NOT (public.is_admin() OR auth.role() = 'service_role') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT COUNT(*) INTO v_total_count FROM public.retail_stock_opnames;

  SELECT jsonb_build_object(
    'data', COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', so.id, 'opname_number', so.opname_number, 'opname_date', so.opname_date, 'location', so.location, 'notes', so.notes, 'status', so.status, 'created_by', so.created_by, 'created_by_email', u.email, 'created_at', so.created_at, 'updated_at', so.updated_at,
        'items_count', (SELECT COUNT(*) FROM public.retail_stock_opname_items soi WHERE soi.retail_stock_opname_id = so.id),
        'variance_count', (SELECT COUNT(*) FROM public.retail_stock_opname_items soi WHERE soi.retail_stock_opname_id = so.id AND soi.variance != 0)
      ) ORDER BY so.opname_date DESC, so.id DESC
    ), '[]'::jsonb),
    'total_count', v_total_count, 'limit', p_limit, 'offset', p_offset
  ) INTO v_result
  FROM public.retail_stock_opnames so LEFT JOIN auth.users u ON so.created_by = u.id
  ORDER BY so.opname_date DESC, so.id DESC LIMIT p_limit OFFSET p_offset;
  RETURN v_result;
END; $$;

CREATE OR REPLACE FUNCTION public.get_retail_stock_opname_detail(p_opname_id BIGINT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_result JSONB;
BEGIN
  IF NOT (public.is_admin() OR auth.role() = 'service_role') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT jsonb_build_object(
    'id', so.id, 'opname_number', so.opname_number, 'opname_date', so.opname_date, 'location', so.location, 'notes', so.notes, 'status', so.status, 'created_by', so.created_by, 'created_by_email', u.email, 'created_at', so.created_at, 'updated_at', so.updated_at,
    'items', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', soi.id, 'retail_product_id', soi.retail_product_id, 'product_name', p.name, 'product_sku', p.slug, 'variant_id', soi.retail_product_id, 'variant_name', p.variant, 'variant_sku', p.slug,
          'opening_stock', soi.opening_stock, 'sold_quantity', soi.sold_quantity, 'adjustment_quantity', soi.adjustment_quantity, 'system_stock', soi.system_stock, 'physical_count', soi.physical_count, 'variance', soi.variance, 'variance_reason', soi.variance_reason, 'unit', soi.unit, 'notes', soi.notes
        ) ORDER BY soi.id
      ) FROM public.retail_stock_opname_items soi LEFT JOIN public.product_retail p ON soi.retail_product_id = p.id WHERE soi.retail_stock_opname_id = so.id
    ), '[]'::jsonb)
  ) INTO v_result FROM public.retail_stock_opnames so LEFT JOIN auth.users u ON so.created_by = u.id WHERE so.id = p_opname_id;
  RETURN v_result;
END; $$;

GRANT EXECUTE ON FUNCTION public.get_retail_stock_opening_list(INTEGER, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_retail_stock_opening_detail(BIGINT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_retail_stock_adjustment_list(INTEGER, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_retail_stock_opname_list(INTEGER, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_retail_stock_opname_detail(BIGINT) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
