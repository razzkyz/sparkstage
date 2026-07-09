-- Migration: Add NFC Cashless Payment System
-- Date: 2026-07-09

-- 1. Create nfc_users table
CREATE TABLE IF NOT EXISTS public.nfc_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama TEXT NOT NULL,
    email TEXT,
    uid_nfc TEXT UNIQUE,
    saldo NUMERIC NOT NULL DEFAULT 0 CHECK (saldo >= 0),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'lost')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create nfc_topup_transactions table
CREATE TABLE IF NOT EXISTS public.nfc_topup_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nfc_user_id UUID NOT NULL REFERENCES public.nfc_users(id) ON DELETE CASCADE,
    nominal NUMERIC NOT NULL CHECK (nominal > 0),
    saldo_sebelum NUMERIC NOT NULL,
    saldo_sesudah NUMERIC NOT NULL,
    admin_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create nfc_payment_transactions table
CREATE TABLE IF NOT EXISTS public.nfc_payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nfc_user_id UUID NOT NULL REFERENCES public.nfc_users(id) ON DELETE CASCADE,
    total NUMERIC NOT NULL CHECK (total > 0),
    saldo_sebelum NUMERIC NOT NULL,
    saldo_sesudah NUMERIC NOT NULL,
    status TEXT DEFAULT 'success',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create nfc_payment_items table
CREATE TABLE IF NOT EXISTS public.nfc_payment_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_transaction_id UUID NOT NULL REFERENCES public.nfc_payment_transactions(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES public.products(id),
    qty INT NOT NULL CHECK (qty > 0),
    harga NUMERIC NOT NULL,
    subtotal NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_nfc_users_uid ON public.nfc_users(uid_nfc);
CREATE INDEX IF NOT EXISTS idx_nfc_topup_user_id ON public.nfc_topup_transactions(nfc_user_id);
CREATE INDEX IF NOT EXISTS idx_nfc_payment_user_id ON public.nfc_payment_transactions(nfc_user_id);

-- Enable RLS
ALTER TABLE public.nfc_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfc_topup_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfc_payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfc_payment_items ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin or kasir
CREATE OR REPLACE FUNCTION public.is_nfc_admin_or_kasir()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_role_assignments
        WHERE user_id = auth.uid()
        AND role_name IN ('admin', 'super_admin', 'kasir')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
-- NFC Users: Admins and Kasirs can read all. Admins can write.
CREATE POLICY nfc_users_read ON public.nfc_users
    FOR SELECT TO authenticated USING (public.is_nfc_admin_or_kasir());
CREATE POLICY nfc_users_write ON public.nfc_users
    FOR ALL TO authenticated USING (public.is_admin());

-- Topups: Admins and Kasirs can read. Admins and Kasirs can insert (handled via RPC, but let's allow insert just in case, though usually RPC handles it via security definer).
CREATE POLICY nfc_topup_read ON public.nfc_topup_transactions
    FOR SELECT TO authenticated USING (public.is_nfc_admin_or_kasir());

-- Payments: Admins and Kasirs can read. Kasirs can insert (handled via RPC).
CREATE POLICY nfc_payment_read ON public.nfc_payment_transactions
    FOR SELECT TO authenticated USING (public.is_nfc_admin_or_kasir());
CREATE POLICY nfc_payment_items_read ON public.nfc_payment_items
    FOR SELECT TO authenticated USING (public.is_nfc_admin_or_kasir());

-- 5. RPC Function: nfc_process_topup
-- Safely increments balance and creates a transaction
CREATE OR REPLACE FUNCTION public.nfc_process_topup(
    p_uid_nfc TEXT,
    p_nominal NUMERIC,
    p_admin_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_saldo_sebelum NUMERIC;
    v_saldo_sesudah NUMERIC;
    v_transaction_id UUID;
    v_res JSONB;
BEGIN
    -- Verify admin/kasir role
    IF NOT public.is_nfc_admin_or_kasir() THEN
        RETURN jsonb_build_object('success', false, 'message', 'Unauthorized');
    END IF;

    -- Lock the row for update to prevent race conditions
    SELECT id, saldo INTO v_user_id, v_saldo_sebelum
    FROM public.nfc_users
    WHERE uid_nfc = p_uid_nfc AND status = 'active'
    FOR UPDATE;

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Kartu tidak terdaftar atau tidak aktif');
    END IF;

    IF p_nominal <= 0 THEN
        RETURN jsonb_build_object('success', false, 'message', 'Nominal harus lebih dari 0');
    END IF;

    v_saldo_sesudah := v_saldo_sebelum + p_nominal;

    -- Update balance
    UPDATE public.nfc_users
    SET saldo = v_saldo_sesudah,
        updated_at = NOW()
    WHERE id = v_user_id;

    -- Insert topup transaction
    INSERT INTO public.nfc_topup_transactions (
        nfc_user_id, nominal, saldo_sebelum, saldo_sesudah, admin_id
    ) VALUES (
        v_user_id, p_nominal, v_saldo_sebelum, v_saldo_sesudah, p_admin_id
    ) RETURNING id INTO v_transaction_id;

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Top up berhasil',
        'transaction_id', v_transaction_id,
        'saldo_sekarang', v_saldo_sesudah
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RPC Function: nfc_process_payment
-- Safely decrements balance, creates payment and items
CREATE OR REPLACE FUNCTION public.nfc_process_payment(
    p_uid_nfc TEXT,
    p_items JSONB -- Array of {product_id, qty, harga, subtotal}
) RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_saldo_sebelum NUMERIC;
    v_saldo_sesudah NUMERIC;
    v_total NUMERIC := 0;
    v_transaction_id UUID;
    v_item RECORD;
    v_product_id BIGINT;
    v_qty INT;
    v_harga NUMERIC;
    v_subtotal NUMERIC;
BEGIN
    -- Verify admin/kasir role
    IF NOT public.is_nfc_admin_or_kasir() THEN
        RETURN jsonb_build_object('success', false, 'message', 'Unauthorized');
    END IF;

    -- Calculate total from items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_total := v_total + (v_item.value->>'subtotal')::NUMERIC;
    END LOOP;

    IF v_total <= 0 THEN
         RETURN jsonb_build_object('success', false, 'message', 'Total belanja tidak valid');
    END IF;

    -- Lock the row for update
    SELECT id, saldo INTO v_user_id, v_saldo_sebelum
    FROM public.nfc_users
    WHERE uid_nfc = p_uid_nfc AND status = 'active'
    FOR UPDATE;

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Kartu tidak terdaftar atau tidak aktif');
    END IF;

    IF v_saldo_sebelum < v_total THEN
        RETURN jsonb_build_object('success', false, 'message', 'Saldo tidak mencukupi');
    END IF;

    v_saldo_sesudah := v_saldo_sebelum - v_total;

    -- Update balance
    UPDATE public.nfc_users
    SET saldo = v_saldo_sesudah,
        updated_at = NOW()
    WHERE id = v_user_id;

    -- Insert payment transaction
    INSERT INTO public.nfc_payment_transactions (
        nfc_user_id, total, saldo_sebelum, saldo_sesudah, status
    ) VALUES (
        v_user_id, v_total, v_saldo_sebelum, v_saldo_sesudah, 'success'
    ) RETURNING id INTO v_transaction_id;

    -- Insert payment items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item.value->>'product_id')::BIGINT;
        v_qty := (v_item.value->>'qty')::INT;
        v_harga := (v_item.value->>'harga')::NUMERIC;
        v_subtotal := (v_item.value->>'subtotal')::NUMERIC;

        INSERT INTO public.nfc_payment_items (
            payment_transaction_id, product_id, qty, harga, subtotal
        ) VALUES (
            v_transaction_id, v_product_id, v_qty, v_harga, v_subtotal
        );
    END LOOP;

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Pembayaran berhasil',
        'transaction_id', v_transaction_id,
        'saldo_sekarang', v_saldo_sesudah
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
