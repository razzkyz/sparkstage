-- ============================================
-- Migration: Retail Stock Opname RPCs
-- Date: 2026-06-12
-- ============================================

-- ============================================
-- 1. Calculate Retail System Stock
-- ============================================
CREATE OR REPLACE FUNCTION public.calculate_retail_system_stock_for_opname(
  p_opname_date DATE,
  p_location TEXT DEFAULT 'SparkStage55'
)
RETURNS TABLE (
  retail_product_id BIGINT,
  name VARCHAR(255),
  slug VARCHAR(255),
  variant VARCHAR(255),
  opening_stock INTEGER,
  sold_quantity INTEGER,
  adjustment_quantity INTEGER,
  system_stock INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH opening_stocks AS (
    SELECT 
      soi.retail_product_id,
      soi.opening_quantity
    FROM public.retail_stock_opening_items soi
    JOIN public.retail_stock_openings so ON so.id = soi.retail_stock_opening_id
    WHERE so.opening_date = p_opname_date
      AND so.location = p_location
      AND so.status = 'confirmed'
  ),
  sales AS (
    SELECT 
      opi.retail_product_id,
      SUM(opi.quantity) AS sold_qty
    FROM public.order_product_items opi
    JOIN public.order_products op ON op.id = opi.order_product_id
    WHERE DATE(op.created_at) = p_opname_date
      AND op.payment_status = 'paid'
      AND op.pickup_status IN ('pending', 'ready', 'completed')
      AND opi.retail_product_id IS NOT NULL
    GROUP BY opi.retail_product_id
  ),
  adjustments AS (
    SELECT 
      sai.retail_product_id,
      SUM(sai.quantity_change) AS adj_qty
    FROM public.retail_stock_adjustment_items sai
    JOIN public.retail_stock_adjustments sa ON sa.id = sai.retail_stock_adjustment_id
    WHERE sa.adjustment_date = p_opname_date
      AND sa.location = p_location
    GROUP BY sai.retail_product_id
  )
  SELECT 
    pr.id AS retail_product_id,
    pr.name AS name,
    pr.slug AS slug,
    pr.variant AS variant,
    COALESCE(os.opening_quantity, 0) AS opening_stock,
    COALESCE(s.sold_qty, 0)::INTEGER AS sold_quantity,
    COALESCE(a.adj_qty, 0)::INTEGER AS adjustment_quantity,
    (COALESCE(os.opening_quantity, 0) - COALESCE(s.sold_qty, 0) + COALESCE(a.adj_qty, 0))::INTEGER AS system_stock
  FROM public.product_retail pr
  LEFT JOIN opening_stocks os ON os.retail_product_id = pr.id
  LEFT JOIN sales s ON s.retail_product_id = pr.id
  LEFT JOIN adjustments a ON a.retail_product_id = pr.id
  WHERE pr.is_active = true
  ORDER BY pr.name, pr.variant;
END;
$$;

-- ============================================
-- 2. Create Retail Stock Opname
-- ============================================
CREATE OR REPLACE FUNCTION public.create_retail_stock_opname(
  p_opname_date DATE,
  p_location TEXT,
  p_notes TEXT,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_opname_id BIGINT;
  v_opname_number TEXT;
  v_item JSONB;
  v_items_processed INTEGER := 0;
  v_variance INTEGER;
BEGIN
  IF NOT (public.is_admin() OR auth.role() = 'service_role') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN RAISE EXCEPTION 'Must have at least one item'; END IF;
  IF EXISTS (SELECT 1 FROM public.retail_stock_opnames WHERE opname_date = p_opname_date AND location = COALESCE(p_location, 'SparkStage55')) THEN
    RAISE EXCEPTION 'Stock opname already exists for date % at location %', p_opname_date, COALESCE(p_location, 'SparkStage55');
  END IF;

  INSERT INTO public.retail_stock_opnames (opname_date, location, notes, status, created_by)
  VALUES (p_opname_date, COALESCE(p_location, 'SparkStage55'), p_notes, 'draft', auth.uid())
  RETURNING id, opname_number INTO v_opname_id, v_opname_number;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_variance := (v_item->>'physical_count')::INTEGER - (v_item->>'system_stock')::INTEGER;

    INSERT INTO public.retail_stock_opname_items (
      retail_stock_opname_id, retail_product_id, opening_stock, sold_quantity, adjustment_quantity, system_stock, physical_count, variance, variance_reason, unit, notes
    ) VALUES (
      v_opname_id, (v_item->>'retail_product_id')::BIGINT, (v_item->>'opening_stock')::INTEGER, (v_item->>'sold_quantity')::INTEGER, (v_item->>'adjustment_quantity')::INTEGER, (v_item->>'system_stock')::INTEGER, (v_item->>'physical_count')::INTEGER, v_variance, v_item->>'variance_reason', COALESCE(v_item->>'unit', 'pcs'), v_item->>'notes'
    );
    v_items_processed := v_items_processed + 1;
  END LOOP;

  RETURN jsonb_build_object('opname_id', v_opname_id, 'opname_number', v_opname_number, 'items_processed', v_items_processed);
END;
$$;

-- ============================================
-- 3. Delete Retail Stock Opname
-- ============================================
CREATE OR REPLACE FUNCTION public.delete_retail_stock_opname(p_opname_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_opname record;
BEGIN
  IF NOT (public.is_admin() OR auth.role() = 'service_role') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT * INTO v_opname FROM public.retail_stock_opnames WHERE id = p_opname_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Stock opname not found'; END IF;

  DELETE FROM public.retail_stock_opname_items WHERE retail_stock_opname_id = p_opname_id;
  DELETE FROM public.retail_stock_opnames WHERE id = p_opname_id;

  RETURN jsonb_build_object('success', true, 'deleted_id', p_opname_id, 'opname_number', v_opname.opname_number);
END;
$$;

-- ============================================
-- 4. Finalize Retail Stock Opname
-- ============================================
CREATE OR REPLACE FUNCTION public.finalize_retail_stock_opname(p_opname_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_opname record;
BEGIN
  IF NOT (public.is_admin() OR auth.role() = 'service_role') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT * INTO v_opname FROM public.retail_stock_opnames WHERE id = p_opname_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Stock opname not found'; END IF;
  IF v_opname.status = 'finalized' THEN RAISE EXCEPTION 'Stock opname already finalized'; END IF;

  IF NOT EXISTS (SELECT 1 FROM public.retail_stock_opname_items WHERE retail_stock_opname_id = p_opname_id) THEN RAISE EXCEPTION 'Cannot finalize opname without items'; END IF;
  IF EXISTS (SELECT 1 FROM public.retail_stock_opname_items WHERE retail_stock_opname_id = p_opname_id AND variance != 0 AND (variance_reason IS NULL OR variance_reason = '')) THEN
    RAISE EXCEPTION 'Semua item dengan variance harus memiliki alasan';
  END IF;

  UPDATE public.retail_stock_opnames SET status = 'finalized', updated_at = NOW() WHERE id = p_opname_id;

  UPDATE public.product_retail pr
  SET stock = stock + soi.variance
  FROM public.retail_stock_opname_items soi
  WHERE soi.retail_stock_opname_id = p_opname_id
    AND soi.retail_product_id = pr.id
    AND soi.variance != 0;

  RETURN jsonb_build_object('success', true, 'opname_id', p_opname_id, 'opname_number', v_opname.opname_number, 'status', 'finalized');
END;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION public.calculate_retail_system_stock_for_opname(DATE, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_retail_stock_opname(DATE, TEXT, TEXT, JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.delete_retail_stock_opname(BIGINT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.finalize_retail_stock_opname(BIGINT) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
