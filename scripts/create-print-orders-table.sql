-- ============================================
-- Migration: Create print_orders table
-- Date: 2026-06-13
-- Description: Tabel untuk menyimpan transaksi print foto
-- ============================================

-- Create print_orders table
CREATE TABLE IF NOT EXISTS public.print_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doku_order_id text UNIQUE,
  customer_name text,
  customer_email text,
  customer_phone text,
  queue_number text,
  qty integer DEFAULT 0,
  amount numeric(10,2) DEFAULT 0,
  status text DEFAULT 'pending',
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_print_orders_status ON public.print_orders(status);
CREATE INDEX IF NOT EXISTS idx_print_orders_paid_at ON public.print_orders(paid_at);
CREATE INDEX IF NOT EXISTS idx_print_orders_created_at ON public.print_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_print_orders_doku_order_id ON public.print_orders(doku_order_id);

-- Enable RLS
ALTER TABLE public.print_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public can view paid print orders
CREATE POLICY "Public can view paid print orders"
  ON public.print_orders
  FOR SELECT
  USING (status = 'paid');

-- RLS Policy: Admin roles can view all print orders
CREATE POLICY "Admin roles can view all print orders"
  ON public.print_orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_role_assignments
      WHERE user_id = auth.uid()
      AND role_name IN ('admin', 'super_admin', 'print', 'devops')
    )
  );

-- RLS Policy: Admin roles can insert print orders
CREATE POLICY "Admin roles can insert print orders"
  ON public.print_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_role_assignments
      WHERE user_id = auth.uid()
      AND role_name IN ('admin', 'super_admin', 'print', 'devops')
    )
  );

-- RLS Policy: Admin roles can update print orders
CREATE POLICY "Admin roles can update print orders"
  ON public.print_orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_role_assignments
      WHERE user_id = auth.uid()
      AND role_name IN ('admin', 'super_admin', 'print', 'devops')
    )
  );

-- Insert sample data untuk testing (OPTIONAL - hapus di production)
INSERT INTO public.print_orders (
  doku_order_id,
  customer_name,
  customer_email,
  customer_phone,
  queue_number,
  qty,
  amount,
  status,
  paid_at,
  created_at
) VALUES
  ('PRINT-001', 'John Doe', 'john@example.com', '081234567890', 'A001', 5, 50000, 'paid', now() - interval '1 day', now() - interval '1 day'),
  ('PRINT-002', 'Jane Smith', 'jane@example.com', '081234567891', 'A002', 10, 100000, 'paid', now() - interval '2 days', now() - interval '2 days'),
  ('PRINT-003', 'Bob Wilson', 'bob@example.com', '081234567892', 'A003', 3, 30000, 'paid', now() - interval '3 days', now() - interval '3 days'),
  ('PRINT-004', 'Alice Brown', 'alice@example.com', '081234567893', 'A004', 7, 70000, 'paid', now() - interval '5 days', now() - interval '5 days'),
  ('PRINT-005', 'Charlie Davis', 'charlie@example.com', '081234567894', 'A005', 15, 150000, 'paid', now() - interval '7 days', now() - interval '7 days')
ON CONFLICT (doku_order_id) DO NOTHING;

-- Success message
SELECT 'Table print_orders created successfully with ' || COUNT(*) || ' sample records' as message
FROM public.print_orders;
