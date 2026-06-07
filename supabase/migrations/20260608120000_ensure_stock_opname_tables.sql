-- Ensure stock opname tables exist
-- This migration creates the stock_opname system tables if they don't exist

-- ============================================
-- 1. Stock Opname Table (Header)
-- ============================================
CREATE TABLE IF NOT EXISTS public.stock_opname (
  id BIGSERIAL PRIMARY KEY,
  opname_number TEXT NOT NULL UNIQUE,
  location TEXT NOT NULL DEFAULT 'SparkStage55',
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('stock_in', 'stock_out', 'adjustment')),
  reason TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_stock_opname_created_by ON public.stock_opname(created_by);
CREATE INDEX IF NOT EXISTS idx_stock_opname_transaction_date ON public.stock_opname(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_stock_opname_transaction_type ON public.stock_opname(transaction_type);

-- ============================================
-- 2. Stock Opname Items Table (Detail)
-- ============================================
CREATE TABLE IF NOT EXISTS public.stock_opname_items (
  id BIGSERIAL PRIMARY KEY,
  stock_opname_id BIGINT NOT NULL REFERENCES public.stock_opname(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  variant_id BIGINT NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
  quantity_before INTEGER NOT NULL DEFAULT 0,
  quantity_change INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  unit TEXT NOT NULL DEFAULT 'pcs',
  cost_per_unit NUMERIC(10, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_stock_opname_items_opname_id ON public.stock_opname_items(stock_opname_id);
CREATE INDEX IF NOT EXISTS idx_stock_opname_items_product_id ON public.stock_opname_items(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_opname_items_variant_id ON public.stock_opname_items(variant_id);

-- ============================================
-- 3. Auto-generate Stock Opname Number
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_stock_opname_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_number INTEGER;
  v_new_number TEXT;
BEGIN
  -- Get the last number from existing opname records
  SELECT COALESCE(
    MAX(
      CASE 
        WHEN opname_number ~ '^#sop-[0-9]+$' 
        THEN SUBSTRING(opname_number FROM 6)::INTEGER
        ELSE 0
      END
    ),
    0
  )
  INTO v_last_number
  FROM public.stock_opname;

  -- Generate new number with padding
  v_new_number := '#sop-' || LPAD((v_last_number + 1)::TEXT, 5, '0');
  
  RETURN v_new_number;
END;
$$;

-- ============================================
-- 4. Trigger to auto-generate opname_number
-- ============================================
CREATE OR REPLACE FUNCTION public.set_stock_opname_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.opname_number IS NULL OR NEW.opname_number = '' THEN
    NEW.opname_number := public.generate_stock_opname_number();
  END IF;
  RETURN NEW;
END;
$$;

-- Drop trigger if exists (can't use IF NOT EXISTS for triggers in older PG versions)
DROP TRIGGER IF EXISTS trigger_set_stock_opname_number ON public.stock_opname;

CREATE TRIGGER trigger_set_stock_opname_number
  BEFORE INSERT ON public.stock_opname
  FOR EACH ROW
  EXECUTE FUNCTION public.set_stock_opname_number();

-- Enable RLS on stock_opname tables (safe to run multiple times)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'stock_opname' AND schemaname = 'public') THEN
    RAISE NOTICE 'stock_opname table does not exist yet, skipping RLS setup';
  ELSE
    ALTER TABLE public.stock_opname ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.stock_opname_items ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin can view all stock opname" ON public.stock_opname;
DROP POLICY IF EXISTS "Admin can insert stock opname" ON public.stock_opname;
DROP POLICY IF EXISTS "Admin can update stock opname" ON public.stock_opname;
DROP POLICY IF EXISTS "Owner can view stock opname" ON public.stock_opname;
DROP POLICY IF EXISTS "Admin can view all stock opname items" ON public.stock_opname_items;
DROP POLICY IF EXISTS "Admin can insert stock opname items" ON public.stock_opname_items;

-- RLS Policies for stock_opname
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'stock_opname' AND schemaname = 'public') THEN
    -- Admin policies
    CREATE POLICY "Admin can view all stock opname" ON public.stock_opname
      FOR SELECT
      USING (public.is_admin() OR auth.role() = 'service_role');

    CREATE POLICY "Admin can insert stock opname" ON public.stock_opname
      FOR INSERT
      WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

    CREATE POLICY "Admin can update stock opname" ON public.stock_opname
      FOR UPDATE
      USING (public.is_admin() OR auth.role() = 'service_role')
      WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

    -- Owner policy (view only)
    CREATE POLICY "Owner can view stock opname" ON public.stock_opname
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.user_role_assignments
          WHERE user_id = auth.uid()
          AND role IN ('owner', 'admin', 'super_admin')
        )
      );

    -- RLS Policies for stock_opname_items
    CREATE POLICY "Admin can view all stock opname items" ON public.stock_opname_items
      FOR SELECT
      USING (public.is_admin() OR auth.role() = 'service_role');

    CREATE POLICY "Admin can insert stock opname items" ON public.stock_opname_items
      FOR INSERT
      WITH CHECK (public.is_admin() OR auth.role() = 'service_role');
  END IF;
END $$;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
