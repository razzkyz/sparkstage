-- ============================================
-- Migration: Retail Stock Openings & Adjustments RPCs
-- Date: 2026-06-12
-- ============================================

-- ============================================
-- 1. Create Retail Stock Opening
-- ============================================
CREATE OR REPLACE FUNCTION public.create_retail_stock_opening(
  p_opening_date DATE,
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
  v_opening_id BIGINT;
  v_opening_number TEXT;
  v_item JSONB;
  v_items_processed INTEGER := 0;
BEGIN
  IF NOT (public.is_admin() OR auth.role() = 'service_role') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Must have at least one item';
  END IF;

  IF EXISTS (SELECT 1 FROM public.retail_stock_openings WHERE opening_date = p_opening_date AND location = COALESCE(p_location, 'SparkStage55')) THEN
    RAISE EXCEPTION 'Stock opening already exists for date % at location %', p_opening_date, COALESCE(p_location, 'SparkStage55');
  END IF;

  INSERT INTO public.retail_stock_openings (opening_date, location, notes, status, created_by)
  VALUES (p_opening_date, COALESCE(p_location, 'SparkStage55'), p_notes, 'draft', auth.uid())
  RETURNING id, opening_number INTO v_opening_id, v_opening_number;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.retail_stock_opening_items (retail_stock_opening_id, retail_product_id, opening_quantity, unit, notes)
    VALUES (v_opening_id, (v_item->>'retail_product_id')::BIGINT, (v_item->>'opening_quantity')::INTEGER, COALESCE(v_item->>'unit', 'pcs'), v_item->>'notes');
    v_items_processed := v_items_processed + 1;
  END LOOP;

  RETURN jsonb_build_object('opening_id', v_opening_id, 'opening_number', v_opening_number, 'items_processed', v_items_processed);
END;
$$;

-- ============================================
-- 2. Update Retail Stock Opening
-- ============================================
CREATE OR REPLACE FUNCTION public.update_retail_stock_opening(
  p_opening_id BIGINT,
  p_opening_date DATE,
  p_location TEXT,
  p_notes TEXT DEFAULT NULL,
  p_items JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_opening record;
  v_item jsonb;
BEGIN
  IF NOT (public.is_admin() OR auth.role() = 'service_role') THEN RAISE EXCEPTION 'Not authorized'; END IF;

  SELECT * INTO v_opening FROM public.retail_stock_openings WHERE id = p_opening_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Stock opening not found'; END IF;
  IF v_opening.status = 'confirmed' THEN RAISE EXCEPTION 'Cannot edit confirmed stock opening'; END IF;

  UPDATE public.retail_stock_openings SET opening_date = p_opening_date, location = p_location, notes = p_notes, updated_at = now() WHERE id = p_opening_id;

  DELETE FROM public.retail_stock_opening_items WHERE retail_stock_opening_id = p_opening_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    INSERT INTO public.retail_stock_opening_items (retail_stock_opening_id, retail_product_id, opening_quantity, unit, notes)
    VALUES (p_opening_id, (v_item->>'retail_product_id')::BIGINT, (v_item->>'opening_quantity')::INTEGER, COALESCE(v_item->>'unit', 'pcs'), v_item->>'notes');
  END LOOP;

  RETURN jsonb_build_object('success', true, 'opening_id', p_opening_id, 'opening_number', v_opening.opening_number);
END;
$$;

-- ============================================
-- 3. Delete Retail Stock Opening
-- ============================================
CREATE OR REPLACE FUNCTION public.delete_retail_stock_opening(p_opening_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_opening record;
BEGIN
  IF NOT (public.is_admin() OR auth.role() = 'service_role') THEN RAISE EXCEPTION 'Not authorized'; END IF;

  SELECT * INTO v_opening FROM public.retail_stock_openings WHERE id = p_opening_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Stock opening not found'; END IF;

  IF EXISTS (
    SELECT 1 FROM public.retail_stock_opname_items soi
    JOIN public.retail_stock_opnames so ON so.id = soi.retail_stock_opname_id
    WHERE so.opname_date = v_opening.opening_date AND so.location = v_opening.location
  ) THEN
    RAISE EXCEPTION 'Cannot delete: Stock opening is used in stock opname';
  END IF;

  DELETE FROM public.retail_stock_opening_items WHERE retail_stock_opening_id = p_opening_id;
  DELETE FROM public.retail_stock_openings WHERE id = p_opening_id;

  RETURN jsonb_build_object('success', true, 'deleted_id', p_opening_id, 'opening_number', v_opening.opening_number);
END;
$$;

-- ============================================
-- 4. Confirm Retail Stock Opening
-- ============================================
CREATE OR REPLACE FUNCTION public.confirm_retail_stock_opening(p_opening_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_opening record;
BEGIN
  IF NOT (public.is_admin() OR auth.role() = 'service_role') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT * INTO v_opening FROM public.retail_stock_openings WHERE id = p_opening_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Not found'; END IF;
  
  UPDATE public.retail_stock_openings SET status = 'confirmed', updated_at = NOW() WHERE id = p_opening_id;
  RETURN jsonb_build_object('success', true);
END;
$$;


-- ============================================
-- 5. Create Retail Stock Adjustment
-- ============================================
CREATE OR REPLACE FUNCTION public.create_retail_stock_adjustment(
  p_adjustment_date DATE,
  p_adjustment_type TEXT,
  p_reason TEXT,
  p_notes TEXT,
  p_location TEXT,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_adjustment_id BIGINT;
  v_adjustment_number TEXT;
  v_item JSONB;
  v_items_processed INTEGER := 0;
  v_retail_product_id BIGINT;
  v_quantity_change INTEGER;
  v_current_stock INTEGER;
BEGIN
  IF NOT (public.is_admin() OR auth.role() = 'service_role') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF p_adjustment_type NOT IN ('gift', 'kol', 'loss', 'gain', 'other') THEN RAISE EXCEPTION 'Invalid adjustment type: %', p_adjustment_type; END IF;
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN RAISE EXCEPTION 'Must have at least one item'; END IF;

  INSERT INTO public.retail_stock_adjustments (adjustment_date, adjustment_type, reason, notes, location, created_by)
  VALUES (p_adjustment_date, p_adjustment_type, p_reason, p_notes, COALESCE(p_location, 'SparkStage55'), auth.uid())
  RETURNING id, adjustment_number INTO v_adjustment_id, v_adjustment_number;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_retail_product_id := (v_item->>'retail_product_id')::BIGINT;
    v_quantity_change := (v_item->>'quantity_change')::INTEGER;

    SELECT stock INTO v_current_stock FROM public.product_retail WHERE id = v_retail_product_id;
    IF (v_current_stock + v_quantity_change) < 0 THEN
      RAISE EXCEPTION 'Adjustment would make stock negative. Current: %, Change: %', v_current_stock, v_quantity_change;
    END IF;

    INSERT INTO public.retail_stock_adjustment_items (retail_stock_adjustment_id, retail_product_id, quantity_change, unit, notes)
    VALUES (v_adjustment_id, v_retail_product_id, v_quantity_change, COALESCE(v_item->>'unit', 'pcs'), v_item->>'notes');

    UPDATE public.product_retail SET stock = stock + v_quantity_change, updated_at = NOW() WHERE id = v_retail_product_id;
    v_items_processed := v_items_processed + 1;
  END LOOP;

  RETURN jsonb_build_object('adjustment_id', v_adjustment_id, 'adjustment_number', v_adjustment_number, 'items_processed', v_items_processed);
END;
$$;

-- ============================================
-- 6. Update Retail Stock Adjustment
-- ============================================
CREATE OR REPLACE FUNCTION public.update_retail_stock_adjustment(
  p_adjustment_id BIGINT,
  p_adjustment_date DATE,
  p_adjustment_type TEXT,
  p_reason TEXT,
  p_notes TEXT DEFAULT NULL,
  p_location TEXT DEFAULT 'SparkStage55',
  p_items JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_adjustment record;
  v_item jsonb;
  v_old_item record;
BEGIN
  IF NOT (public.is_admin() OR auth.role() = 'service_role') THEN RAISE EXCEPTION 'Not authorized'; END IF;

  SELECT * INTO v_adjustment FROM public.retail_stock_adjustments WHERE id = p_adjustment_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Stock adjustment not found'; END IF;

  FOR v_old_item IN SELECT * FROM public.retail_stock_adjustment_items WHERE retail_stock_adjustment_id = p_adjustment_id LOOP
    UPDATE public.product_retail SET stock = stock - v_old_item.quantity_change WHERE id = v_old_item.retail_product_id;
  END LOOP;

  UPDATE public.retail_stock_adjustments SET adjustment_date = p_adjustment_date, adjustment_type = p_adjustment_type, reason = p_reason, notes = p_notes, location = p_location, updated_at = now() WHERE id = p_adjustment_id;

  DELETE FROM public.retail_stock_adjustment_items WHERE retail_stock_adjustment_id = p_adjustment_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    INSERT INTO public.retail_stock_adjustment_items (retail_stock_adjustment_id, retail_product_id, quantity_change, unit, notes)
    VALUES (p_adjustment_id, (v_item->>'retail_product_id')::BIGINT, (v_item->>'quantity_change')::INTEGER, COALESCE(v_item->>'unit', 'pcs'), v_item->>'notes');

    UPDATE public.product_retail SET stock = stock + (v_item->>'quantity_change')::integer WHERE id = (v_item->>'retail_product_id')::bigint;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'adjustment_id', p_adjustment_id, 'adjustment_number', v_adjustment.adjustment_number);
END;
$$;

-- ============================================
-- 7. Delete Retail Stock Adjustment
-- ============================================
CREATE OR REPLACE FUNCTION public.delete_retail_stock_adjustment(p_adjustment_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_adjustment record;
  v_item record;
BEGIN
  IF NOT (public.is_admin() OR auth.role() = 'service_role') THEN RAISE EXCEPTION 'Not authorized'; END IF;

  SELECT * INTO v_adjustment FROM public.retail_stock_adjustments WHERE id = p_adjustment_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Stock adjustment not found'; END IF;

  FOR v_item IN SELECT * FROM public.retail_stock_adjustment_items WHERE retail_stock_adjustment_id = p_adjustment_id LOOP
    UPDATE public.product_retail SET stock = stock - v_item.quantity_change WHERE id = v_item.retail_product_id;
  END LOOP;

  DELETE FROM public.retail_stock_adjustment_items WHERE retail_stock_adjustment_id = p_adjustment_id;
  DELETE FROM public.retail_stock_adjustments WHERE id = p_adjustment_id;

  RETURN jsonb_build_object('success', true, 'deleted_id', p_adjustment_id, 'adjustment_number', v_adjustment.adjustment_number);
END;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION public.create_retail_stock_opening(DATE, TEXT, TEXT, JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_retail_stock_opening(BIGINT, DATE, TEXT, TEXT, JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.delete_retail_stock_opening(BIGINT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.confirm_retail_stock_opening(BIGINT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_retail_stock_adjustment(DATE, TEXT, TEXT, TEXT, TEXT, JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_retail_stock_adjustment(BIGINT, DATE, TEXT, TEXT, TEXT, TEXT, JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.delete_retail_stock_adjustment(BIGINT) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
