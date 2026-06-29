-- Migration: Force clean All-Day availability for all dates from 2026-06-27 onwards
-- Description: Some dates (e.g. June 29, 30) still have session slots remaining.
-- This migration does a clean sweep: delete ALL session slots >= 2026-06-27,
-- then insert All-Day slots for any date missing them.
-- purchased_tickets are NOT touched.

DO $$
DECLARE
  v_ticket_id BIGINT;
  v_sweep_from DATE := '2026-06-27';
  v_sweep_to   DATE;
  v_capacity   INTEGER;
  v_deleted    INTEGER;
  v_inserted   INTEGER;
BEGIN
  -- 1. Get the entrance ticket ID
  SELECT id INTO v_ticket_id
  FROM public.tickets
  WHERE type = 'entrance'
  LIMIT 1;

  IF v_ticket_id IS NULL THEN
    RAISE EXCEPTION 'No entrance ticket found';
  END IF;

  -- 2. Get capacity
  SELECT COALESCE(default_slot_capacity, 100) INTO v_capacity
  FROM public.ticket_booking_settings
  WHERE ticket_id = v_ticket_id;

  IF v_capacity IS NULL OR v_capacity <= 0 THEN
    v_capacity := 100;
  END IF;

  -- 3. Find max date in system
  SELECT MAX(date) INTO v_sweep_to
  FROM public.ticket_availabilities
  WHERE ticket_id = v_ticket_id;

  IF v_sweep_to IS NULL OR v_sweep_to < v_sweep_from THEN
    v_sweep_to := '2026-12-31';
  END IF;

  RAISE NOTICE 'Sweeping ALL session slots from % to % for ticket ID: %', v_sweep_from, v_sweep_to, v_ticket_id;

  -- 4. Delete ALL remaining session slots (time_slot IS NOT NULL) from cutoff onwards
  DELETE FROM public.ticket_availabilities
  WHERE ticket_id = v_ticket_id
    AND date >= v_sweep_from
    AND time_slot IS NOT NULL;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RAISE NOTICE 'Deleted % session slot rows', v_deleted;

  -- 5. Insert All-Day slot for every date that doesn't already have one
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
    NULL,         -- All Day
    v_capacity,
    0,
    0,
    0,
    NOW(),
    NOW()
  FROM generate_series(v_sweep_from, v_sweep_to, INTERVAL '1 day') AS d
  WHERE NOT EXISTS (
    SELECT 1 FROM public.ticket_availabilities ta
    WHERE ta.ticket_id = v_ticket_id
      AND ta.date = d::DATE
      AND ta.time_slot IS NULL
  );

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RAISE NOTICE 'Inserted % All-Day slots', v_inserted;

  RAISE NOTICE 'Done. All dates from % to % are now All-Day only.', v_sweep_from, v_sweep_to;
END $$;
