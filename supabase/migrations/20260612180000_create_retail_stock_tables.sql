-- ============================================
-- Migration: Add Retail Stock System
-- Date: 2026-06-12
-- Description: Parallel stock management system for product_retail
-- ============================================

-- 1. Retail Stock Openings
CREATE TABLE IF NOT EXISTS public.retail_stock_openings (
  id BIGSERIAL PRIMARY KEY,
  opening_number TEXT NOT NULL UNIQUE,
  opening_date DATE NOT NULL,
  location TEXT NOT NULL DEFAULT 'SparkStage55',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(opening_date, location)
);

CREATE TABLE IF NOT EXISTS public.retail_stock_opening_items (
  id BIGSERIAL PRIMARY KEY,
  retail_stock_opening_id BIGINT NOT NULL REFERENCES public.retail_stock_openings(id) ON DELETE CASCADE,
  retail_product_id BIGINT NOT NULL REFERENCES public.product_retail(id) ON DELETE RESTRICT,
  opening_quantity INTEGER NOT NULL CHECK (opening_quantity >= 0),
  unit TEXT NOT NULL DEFAULT 'pcs',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(retail_stock_opening_id, retail_product_id)
);

-- 2. Retail Stock Adjustments
CREATE TABLE IF NOT EXISTS public.retail_stock_adjustments (
  id BIGSERIAL PRIMARY KEY,
  adjustment_number TEXT NOT NULL UNIQUE,
  adjustment_date DATE NOT NULL,
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('gift', 'kol', 'loss', 'gain', 'other')),
  reason TEXT NOT NULL,
  notes TEXT,
  location TEXT NOT NULL DEFAULT 'SparkStage55',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.retail_stock_adjustment_items (
  id BIGSERIAL PRIMARY KEY,
  retail_stock_adjustment_id BIGINT NOT NULL REFERENCES public.retail_stock_adjustments(id) ON DELETE CASCADE,
  retail_product_id BIGINT NOT NULL REFERENCES public.product_retail(id) ON DELETE RESTRICT,
  quantity_change INTEGER NOT NULL,
  unit TEXT NOT NULL DEFAULT 'pcs',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Retail Stock Opnames
CREATE TABLE IF NOT EXISTS public.retail_stock_opnames (
  id BIGSERIAL PRIMARY KEY,
  opname_number TEXT NOT NULL UNIQUE,
  opname_date DATE NOT NULL,
  location TEXT NOT NULL DEFAULT 'SparkStage55',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'finalized')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(opname_date, location)
);

CREATE TABLE IF NOT EXISTS public.retail_stock_opname_items (
  id BIGSERIAL PRIMARY KEY,
  retail_stock_opname_id BIGINT NOT NULL REFERENCES public.retail_stock_opnames(id) ON DELETE CASCADE,
  retail_product_id BIGINT NOT NULL REFERENCES public.product_retail(id) ON DELETE RESTRICT,
  opening_stock INTEGER NOT NULL DEFAULT 0,
  sold_quantity INTEGER NOT NULL DEFAULT 0,
  adjustment_quantity INTEGER NOT NULL DEFAULT 0,
  system_stock INTEGER NOT NULL DEFAULT 0,
  physical_count INTEGER NOT NULL,
  variance INTEGER NOT NULL DEFAULT 0,
  variance_reason TEXT,
  unit TEXT NOT NULL DEFAULT 'pcs',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(retail_stock_opname_id, retail_product_id)
);

-- ============================================
-- Auto Generate Numbers
-- ============================================

CREATE OR REPLACE FUNCTION public.generate_retail_stock_opening_number() RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_last_number INTEGER; v_new_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CASE WHEN opening_number ~ '^#ropen-[0-9]+$' THEN SUBSTRING(opening_number FROM 8)::INTEGER ELSE 0 END), 0) INTO v_last_number FROM public.retail_stock_openings;
  v_new_number := '#ropen-' || LPAD((v_last_number + 1)::TEXT, 5, '0');
  RETURN v_new_number;
END; $$;

CREATE OR REPLACE FUNCTION public.set_retail_stock_opening_number() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.opening_number IS NULL OR NEW.opening_number = '' THEN NEW.opening_number := public.generate_retail_stock_opening_number(); END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trigger_set_retail_stock_opening_number BEFORE INSERT ON public.retail_stock_openings FOR EACH ROW EXECUTE FUNCTION public.set_retail_stock_opening_number();

CREATE OR REPLACE FUNCTION public.generate_retail_stock_adjustment_number() RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_last_number INTEGER; v_new_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CASE WHEN adjustment_number ~ '^#radj-[0-9]+$' THEN SUBSTRING(adjustment_number FROM 7)::INTEGER ELSE 0 END), 0) INTO v_last_number FROM public.retail_stock_adjustments;
  v_new_number := '#radj-' || LPAD((v_last_number + 1)::TEXT, 5, '0');
  RETURN v_new_number;
END; $$;

CREATE OR REPLACE FUNCTION public.set_retail_stock_adjustment_number() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.adjustment_number IS NULL OR NEW.adjustment_number = '' THEN NEW.adjustment_number := public.generate_retail_stock_adjustment_number(); END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trigger_set_retail_stock_adjustment_number BEFORE INSERT ON public.retail_stock_adjustments FOR EACH ROW EXECUTE FUNCTION public.set_retail_stock_adjustment_number();

CREATE OR REPLACE FUNCTION public.generate_retail_stock_opname_number() RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_last_number INTEGER; v_new_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CASE WHEN opname_number ~ '^#ropname-[0-9]+$' THEN SUBSTRING(opname_number FROM 10)::INTEGER ELSE 0 END), 0) INTO v_last_number FROM public.retail_stock_opnames;
  v_new_number := '#ropname-' || LPAD((v_last_number + 1)::TEXT, 5, '0');
  RETURN v_new_number;
END; $$;

CREATE OR REPLACE FUNCTION public.set_retail_stock_opname_number() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.opname_number IS NULL OR NEW.opname_number = '' THEN NEW.opname_number := public.generate_retail_stock_opname_number(); END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trigger_set_retail_stock_opname_number BEFORE INSERT ON public.retail_stock_opnames FOR EACH ROW EXECUTE FUNCTION public.set_retail_stock_opname_number();

-- ============================================
-- Updated At Triggers
-- ============================================
CREATE TRIGGER trigger_update_rso_updated_at BEFORE UPDATE ON public.retail_stock_openings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trigger_update_rsa_updated_at BEFORE UPDATE ON public.retail_stock_adjustments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trigger_update_rso2_updated_at BEFORE UPDATE ON public.retail_stock_opnames FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trigger_update_rsoi2_updated_at BEFORE UPDATE ON public.retail_stock_opname_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- RLS
-- ============================================
ALTER TABLE public.retail_stock_openings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retail_stock_opening_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retail_stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retail_stock_adjustment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retail_stock_opnames ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retail_stock_opname_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage retail stock openings" ON public.retail_stock_openings FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin can manage retail stock opening items" ON public.retail_stock_opening_items FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.retail_stock_openings WHERE id = retail_stock_opening_items.retail_stock_opening_id AND public.is_admin()));
CREATE POLICY "Admin can manage retail stock adjustments" ON public.retail_stock_adjustments FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin can manage retail stock adjustment items" ON public.retail_stock_adjustment_items FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.retail_stock_adjustments WHERE id = retail_stock_adjustment_items.retail_stock_adjustment_id AND public.is_admin()));
CREATE POLICY "Admin can manage retail stock opnames" ON public.retail_stock_opnames FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin can manage retail stock opname items" ON public.retail_stock_opname_items FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.retail_stock_opnames WHERE id = retail_stock_opname_items.retail_stock_opname_id AND public.is_admin()));

-- ============================================
-- Enable Realtime
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.retail_stock_openings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.retail_stock_opening_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.retail_stock_adjustments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.retail_stock_adjustment_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.retail_stock_opnames;
ALTER PUBLICATION supabase_realtime ADD TABLE public.retail_stock_opname_items;

-- Reload schema
NOTIFY pgrst, 'reload schema';
