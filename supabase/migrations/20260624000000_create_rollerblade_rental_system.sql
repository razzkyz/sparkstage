-- =====================================================
-- Rollerblade Rental System with DOKU QRIS Payment
-- Created: 2026-06-24 | Fixed: 2026-06-24 (role_name + rollerblade role)
-- =====================================================

-- Create rentals table
CREATE TABLE IF NOT EXISTS public.rentals (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  invoice_number text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  customer_phone text,
  rental_date date NOT NULL,
  shoe_size text NOT NULL,
  duration_hours int NOT NULL CHECK (duration_hours > 0),
  price_per_hour numeric(10, 2) NOT NULL DEFAULT 20000,
  total_price numeric(10, 2) NOT NULL,
  
  -- Payment fields
  payment_status text NOT NULL DEFAULT 'pending' 
    CHECK (payment_status IN ('pending', 'paid', 'expired', 'failed')),
  payment_id text,
  payment_url text,
  payment_data jsonb DEFAULT '{}'::jsonb,
  payment_expired_at timestamptz,
  paid_at timestamptz,
  doku_invoice_id text,
  doku_payment_reference text,
  
  -- Rental status
  rental_status text NOT NULL DEFAULT 'waiting_payment'
    CHECK (rental_status IN ('waiting_payment', 'rental_active', 'completed')),
  started_at timestamptz,
  completed_at timestamptz,
  
  -- Audit fields
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_rentals_invoice_number ON public.rentals(invoice_number);
CREATE INDEX IF NOT EXISTS idx_rentals_payment_status ON public.rentals(payment_status);
CREATE INDEX IF NOT EXISTS idx_rentals_rental_status ON public.rentals(rental_status);
CREATE INDEX IF NOT EXISTS idx_rentals_created_by ON public.rentals(created_by);
CREATE INDEX IF NOT EXISTS idx_rentals_rental_date ON public.rentals(rental_date);
CREATE INDEX IF NOT EXISTS idx_rentals_created_at ON public.rentals(created_at);
CREATE INDEX IF NOT EXISTS idx_rentals_payment_expired_at ON public.rentals(payment_expired_at) 
  WHERE payment_status = 'pending';

-- Enable RLS
ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS Policies (using correct column: role_name)
-- Includes rollerblade role for rental-only access
-- =====================================================

DROP POLICY IF EXISTS "Admin and Kasir can view all rentals" ON public.rentals;
DROP POLICY IF EXISTS "Admin and Kasir can insert rentals" ON public.rentals;
DROP POLICY IF EXISTS "Admin and Kasir can update rentals" ON public.rentals;
DROP POLICY IF EXISTS "Admin and Rollerblade can view all rentals" ON public.rentals;
DROP POLICY IF EXISTS "Admin and Rollerblade can insert rentals" ON public.rentals;
DROP POLICY IF EXISTS "Admin and Rollerblade can update rentals" ON public.rentals;

CREATE POLICY "Admin and Rollerblade can view all rentals"
  ON public.rentals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_role_assignments ura
      WHERE ura.user_id = auth.uid()
        AND ura.role_name IN ('admin', 'super_admin', 'kasir', 'rollerblade')
    )
  );

CREATE POLICY "Admin and Rollerblade can insert rentals"
  ON public.rentals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_role_assignments ura
      WHERE ura.user_id = auth.uid()
        AND ura.role_name IN ('admin', 'super_admin', 'kasir', 'rollerblade')
    )
  );

CREATE POLICY "Admin and Rollerblade can update rentals"
  ON public.rentals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_role_assignments ura
      WHERE ura.user_id = auth.uid()
        AND ura.role_name IN ('admin', 'super_admin', 'kasir', 'rollerblade')
    )
  );

-- =====================================================
-- Updated_at trigger
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_rentals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_rentals_updated_at ON public.rentals;
CREATE TRIGGER set_rentals_updated_at
  BEFORE UPDATE ON public.rentals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_rentals_updated_at();

-- =====================================================
-- RPC: Get today's rental stats
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_rental_stats_today()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date;
  v_total_revenue numeric;
  v_total_transactions int;
  v_active_rentals int;
  v_pending_payments int;
BEGIN
  -- Check if user has access (admin, kasir, or rollerblade)
  IF NOT EXISTS (
    SELECT 1 FROM public.user_role_assignments
    WHERE user_id = auth.uid()
      AND role_name IN ('admin', 'super_admin', 'kasir', 'rollerblade')
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Get today in WIB
  v_today := (now() AT TIME ZONE 'Asia/Jakarta')::date;

  -- Calculate stats
  SELECT 
    COALESCE(SUM(total_price), 0),
    COUNT(*),
    COUNT(*) FILTER (WHERE rental_status = 'rental_active'),
    COUNT(*) FILTER (WHERE payment_status = 'pending')
  INTO v_total_revenue, v_total_transactions, v_active_rentals, v_pending_payments
  FROM public.rentals
  WHERE created_at::date = v_today;

  RETURN jsonb_build_object(
    'total_revenue', v_total_revenue,
    'total_transactions', v_total_transactions,
    'active_rentals', v_active_rentals,
    'pending_payments', v_pending_payments,
    'date', v_today
  );
END;
$$;

-- =====================================================
-- RPC: List rentals with filters
-- =====================================================

CREATE OR REPLACE FUNCTION public.list_rentals(
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0,
  p_payment_status text DEFAULT NULL,
  p_rental_status text DEFAULT NULL,
  p_date date DEFAULT NULL
)
RETURNS TABLE (
  id bigint,
  invoice_number text,
  customer_name text,
  rental_date date,
  shoe_size text,
  duration_hours int,
  price_per_hour numeric,
  total_price numeric,
  payment_status text,
  rental_status text,
  paid_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user has access (admin, kasir, or rollerblade)
  IF NOT EXISTS (
    SELECT 1 FROM public.user_role_assignments
    WHERE user_id = auth.uid()
      AND role_name IN ('admin', 'super_admin', 'kasir', 'rollerblade')
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    r.id,
    r.invoice_number,
    r.customer_name,
    r.rental_date,
    r.shoe_size,
    r.duration_hours,
    r.price_per_hour,
    r.total_price,
    r.payment_status,
    r.rental_status,
    r.paid_at,
    r.started_at,
    r.completed_at,
    r.created_at
  FROM public.rentals r
  WHERE 
    (p_payment_status IS NULL OR r.payment_status = p_payment_status)
    AND (p_rental_status IS NULL OR r.rental_status = p_rental_status)
    AND (p_date IS NULL OR r.rental_date = p_date)
  ORDER BY r.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- =====================================================
-- RPC: Start rental (change status to rental_active)
-- =====================================================

CREATE OR REPLACE FUNCTION public.start_rental(p_rental_id bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rental record;
BEGIN
  -- Check if user has access (admin, kasir, or rollerblade)
  IF NOT EXISTS (
    SELECT 1 FROM public.user_role_assignments
    WHERE user_id = auth.uid()
      AND role_name IN ('admin', 'super_admin', 'kasir', 'rollerblade')
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Get rental
  SELECT * INTO v_rental FROM public.rentals WHERE id = p_rental_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Rental not found';
  END IF;

  -- Validate payment is paid
  IF v_rental.payment_status != 'paid' THEN
    RAISE EXCEPTION 'Payment must be completed before starting rental';
  END IF;

  -- Validate status
  IF v_rental.rental_status != 'waiting_payment' THEN
    RAISE EXCEPTION 'Rental cannot be started from current status: %', v_rental.rental_status;
  END IF;

  -- Update to rental_active
  UPDATE public.rentals
  SET 
    rental_status = 'rental_active',
    started_at = now(),
    updated_at = now()
  WHERE id = p_rental_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Rental started successfully',
    'rental_id', p_rental_id
  );
END;
$$;

-- =====================================================
-- RPC: Complete rental
-- =====================================================

CREATE OR REPLACE FUNCTION public.complete_rental(p_rental_id bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rental record;
BEGIN
  -- Check if user has access (admin, kasir, or rollerblade)
  IF NOT EXISTS (
    SELECT 1 FROM public.user_role_assignments
    WHERE user_id = auth.uid()
      AND role_name IN ('admin', 'super_admin', 'kasir', 'rollerblade')
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Get rental
  SELECT * INTO v_rental FROM public.rentals WHERE id = p_rental_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Rental not found';
  END IF;

  -- Validate status
  IF v_rental.rental_status != 'rental_active' THEN
    RAISE EXCEPTION 'Only active rentals can be completed';
  END IF;

  -- Update to completed
  UPDATE public.rentals
  SET 
    rental_status = 'completed',
    completed_at = now(),
    updated_at = now()
  WHERE id = p_rental_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Rental completed successfully',
    'rental_id', p_rental_id
  );
END;
$$;

-- =====================================================
-- Update is_admin() function to include rollerblade role
-- =====================================================

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

-- =====================================================
-- Grant permissions
-- =====================================================

GRANT SELECT, INSERT, UPDATE ON public.rentals TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_rental_stats_today() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_rentals(int, int, text, text, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_rental(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_rental(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- =====================================================
-- Assign rollerblade role to rollerblade@gmail.com
-- (safe: only runs if user exists in auth.users)
-- =====================================================

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Find the user
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'rollerblade@gmail.com'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'User rollerblade@gmail.com not found in auth.users. Create the user first via Supabase Auth dashboard, then run: INSERT INTO public.user_role_assignments (user_id, role_name) VALUES (''<user-uuid>'', ''rollerblade'') ON CONFLICT (user_id, role_name) DO NOTHING;';
  ELSE
    -- Insert role assignment (safe: no duplicate)
    INSERT INTO public.user_role_assignments (user_id, role_name)
    VALUES (v_user_id, 'rollerblade')
    ON CONFLICT (user_id, role_name) DO NOTHING;

    RAISE NOTICE 'Role rollerblade assigned to user % (rollerblade@gmail.com)', v_user_id;
  END IF;
END;
$$;

COMMENT ON TABLE public.rentals IS 'Rollerblade rental orders with DOKU QRIS payment integration';
COMMENT ON FUNCTION public.get_rental_stats_today() IS 'Stats today for rollerblade rental (admin/kasir/rollerblade only)';
COMMENT ON FUNCTION public.list_rentals(int, int, text, text, date) IS 'List rentals with filters (admin/kasir/rollerblade only)';
COMMENT ON FUNCTION public.start_rental(bigint) IS 'Start rental after payment confirmed (admin/kasir/rollerblade only)';
COMMENT ON FUNCTION public.complete_rental(bigint) IS 'Complete rental when returned (admin/kasir/rollerblade only)';
