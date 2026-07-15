-- Set ticket available_until to end of July 2026
-- Booking window is capped at 2026-07-31 for all ticket types
UPDATE public.tickets
SET available_until = '2026-07-31 23:59:59'
WHERE available_until > '2026-07-31 23:59:59';
