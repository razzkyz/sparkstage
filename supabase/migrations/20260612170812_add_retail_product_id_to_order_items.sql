-- Migration Phase 1: Add retail_product_id to order_product_items
-- Safely add without affecting existing operations

ALTER TABLE public.order_product_items 
ADD COLUMN IF NOT EXISTS retail_product_id BIGINT REFERENCES public.product_retail(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_order_product_items_retail_product_id 
ON public.order_product_items(retail_product_id);

-- ============================================================================
-- reserve_retail_stock: Atomically reserve/deduct stock for a retail product
-- Returns TRUE if successful, FALSE if insufficient stock
-- ============================================================================
CREATE OR REPLACE FUNCTION public.reserve_retail_stock(
  p_retail_id BIGINT,
  p_quantity INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RETURN FALSE;
  END IF;

  -- Atomic: UPDATE only succeeds if available stock >= requested
  UPDATE public.product_retail
  SET 
    stock = stock - p_quantity,
    updated_at = now()
  WHERE id = p_retail_id
    AND is_active = TRUE
    AND stock >= p_quantity;

  RETURN FOUND;
END;
$$;

-- ============================================================================
-- release_retail_stock: Release previously deducted stock
-- Used for rollback when order creation fails or order expires
-- ============================================================================
CREATE OR REPLACE FUNCTION public.release_retail_stock(
  p_retail_id BIGINT,
  p_quantity INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RETURN FALSE;
  END IF;

  UPDATE public.product_retail
  SET 
    stock = stock + p_quantity,
    updated_at = now()
  WHERE id = p_retail_id;

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reserve_retail_stock(BIGINT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_retail_stock(BIGINT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_retail_stock(BIGINT, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_retail_stock(BIGINT, INTEGER) TO service_role;
