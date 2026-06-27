-- Migration: Extend All-Day Booking to start from 2026-06-27 (moved up from 2026-07-26)
-- Description:
--   The gap between 2026-06-27 and 2026-07-25 still has session-based availabilities.
--   This migration deletes those empty session slots and replaces them with All-Day (time_slot = NULL).
--   Purchased tickets (purchased_tickets table) are NOT touched.
--   Old session-based tickets remain valid — holders can still enter on their valid date.

DO $$
DECLARE
  v_ticket_id BIGINT;
  v_start_date DATE := '2026-06-27';
  v_end_date   DATE := '2026-07-25'; -- covers the gap left by previous migration
  v_capacity   INTEGER;
BEGIN
  -- 1. Get the entrance ticket ID
  SELECT id INTO v_ticket_id
  FROM public.tickets
  WHERE type = 'entrance'
  LIMIT 1;

  IF v_ticket_id IS NULL THEN
    RAISE EXCEPTION 'No entrance ticket found';
  END IF;

  -- 2. Use default_slot_capacity from settings
  SELECT COALESCE(default_slot_capacity, 100) INTO v_capacity
  FROM public.ticket_booking_settings
  WHERE ticket_id = v_ticket_id;

  IF v_capacity IS NULL OR v_capacity <= 0 THEN
    v_capacity := 100;
  END IF;

  RAISE NOTICE 'Processing gap dates % to % for ticket ID: %', v_start_date, v_end_date, v_ticket_id;

  -- 3. Delete remaining session-based slots in the gap (27 Jun - 25 Jul)
  --    These are safe to delete because no tickets have been sold for these future dates.
  DELETE FROM public.ticket_availabilities
  WHERE ticket_id = v_ticket_id
    AND date >= v_start_date
    AND date <= v_end_date
    AND time_slot IS NOT NULL;

  RAISE NOTICE 'Deleted session slots for % to %', v_start_date, v_end_date;

  -- 4. Insert ONE All-Day slot per day for the gap period
  INSERT INTO public.ticket_availabilities (
    ticket_id,
    date,
    time_slot,
    total_capacity,
    reserved_capacity,
    sold_capacity,
    version,
    created_at,
    updated_at
  )
  SELECT
    v_ticket_id,
    d::DATE,
    NULL, -- All Day (no time restriction)
    v_capacity,
    0,
    0,
    0,
    NOW(),
    NOW()
  FROM generate_series(v_start_date, v_end_date, INTERVAL '1 day') AS d
  WHERE NOT EXISTS (
    SELECT 1 FROM public.ticket_availabilities ta
    WHERE ta.ticket_id = v_ticket_id
      AND ta.date = d::DATE
      AND ta.time_slot IS NULL
  );

  RAISE NOTICE 'All-Day availability inserted for % to %', v_start_date, v_end_date;
END $$;
