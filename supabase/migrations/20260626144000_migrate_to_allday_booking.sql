-- Migration: Migrate to All-Day Booking from 2026-07-26
-- Description: Deletes empty session slots from 26 July 2026 onwards and replaces them with a single All-Day slot.
-- This does NOT affect any existing tickets in purchased_tickets. Old tickets with sessions will still be strictly validated.

DO $$
DECLARE
  v_ticket_id BIGINT;
  v_start_date DATE := '2026-07-26';
  v_end_date   DATE;
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

  -- 3. Delete existing session-based availabilities from 26 July 2026 onwards
  -- Only safe because there are no sold tickets on or after this date.
  DELETE FROM public.ticket_availabilities
  WHERE ticket_id = v_ticket_id
    AND date >= v_start_date
    AND time_slot IS NOT NULL;
    
  -- 4. Find the max date currently in the system to populate up to that date
  SELECT MAX(date) INTO v_end_date
  FROM public.ticket_availabilities
  WHERE ticket_id = v_ticket_id;
  
  -- Fallback if something is weird
  IF v_end_date IS NULL OR v_end_date < v_start_date THEN
     v_end_date := '2026-12-31';
  END IF;

  RAISE NOTICE 'Generating ALL-DAY availability (time_slot = NULL) from % to %', v_start_date, v_end_date;

  -- 5. Insert ONE availability per day with time_slot = NULL
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
    NULL, -- THIS MAKES IT ALL DAY
    v_capacity,
    0,
    0,
    0,
    NOW(),
    NOW()
  FROM generate_series(v_start_date, v_end_date, INTERVAL '1 day') AS d
  WHERE NOT EXISTS (
    SELECT 1 FROM public.ticket_availabilities ta 
    WHERE ta.ticket_id = v_ticket_id AND ta.date = d::DATE AND ta.time_slot IS NULL
  );

END $$;
