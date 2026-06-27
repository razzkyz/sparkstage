-- Migration: Remove session time enforcement from QR scan validation
-- Description: All tickets (old session-based and new all-day) can now enter at any time on their valid date.
-- The time_slot field on purchased_tickets is preserved for record-keeping, but no longer enforced at the gate.

CREATE OR REPLACE FUNCTION public.validate_entrance_ticket_scan(
  p_ticket_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticket_code TEXT := upper(btrim(coalesce(p_ticket_code, '')));
  v_now TIMESTAMPTZ := now();
  v_today_jakarta DATE := (v_now AT TIME ZONE 'Asia/Jakarta')::DATE;
  v_ticket RECORD;
BEGIN
  IF v_ticket_code = '' THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'missing_ticket_code',
      'message', 'Kode tiket kosong'
    );
  END IF;

  SELECT
    pt.id,
    pt.ticket_code,
    pt.status,
    pt.valid_date,
    pt.time_slot,
    pt.used_at,
    pt.user_id,
    t.name AS ticket_name
  INTO v_ticket
  FROM public.purchased_tickets pt
  LEFT JOIN public.tickets t ON t.id = pt.ticket_id
  WHERE upper(pt.ticket_code) = v_ticket_code
  FOR UPDATE OF pt;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'ticket_not_found',
      'message', 'Kode tiket tidak ditemukan di sistem.'
    );
  END IF;

  IF lower(coalesce(v_ticket.status, '')) = 'used' THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'ticket_used',
      'message', format(
        'Tiket sudah digunakan pada %s',
        coalesce(to_char(v_ticket.used_at AT TIME ZONE 'Asia/Jakarta', 'DD Mon YYYY HH24:MI'), 'waktu tidak diketahui')
      )
    );
  END IF;

  IF lower(coalesce(v_ticket.status, '')) <> 'active' THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'invalid_status',
      'message', format('Status tiket: %s.', coalesce(v_ticket.status, 'unknown'))
    );
  END IF;

  IF v_ticket.valid_date < v_today_jakarta THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'ticket_expired',
      'message', format(
        'Tiket kadaluarsa. Tanggal valid adalah %s.',
        to_char(v_ticket.valid_date, 'DD Mon YYYY')
      )
    );
  END IF;

  IF v_ticket.valid_date > v_today_jakarta THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'ticket_not_yet_valid',
      'message', format(
        'Tiket belum valid. Berlaku mulai %s.',
        to_char(v_ticket.valid_date, 'DD Mon YYYY')
      )
    );
  END IF;

  -- NOTE: Time slot check intentionally removed.
  -- All tickets (old session-based or new all-day) are now free to enter at any time on their valid date.

  UPDATE public.purchased_tickets
  SET status = 'used',
      used_at = v_now
  WHERE id = v_ticket.id;

  RETURN jsonb_build_object(
    'ok', true,
    'ticketId', v_ticket.id,
    'ticketCode', v_ticket.ticket_code,
    'ticketName', coalesce(v_ticket.ticket_name, '-'),
    'userId', v_ticket.user_id,
    'validDate', v_ticket.valid_date,
    'usedAt', v_now
  );
END;
$$;
