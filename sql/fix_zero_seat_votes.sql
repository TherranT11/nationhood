-- Backfill bill_support rows where seat_count is 0 but the faction has seats.
-- This fixes votes cast during the loadSeats() bug where presidential election
-- results were returned instead of parliamentary ones, causing 0 seat_count.
-- Run in Supabase SQL editor.

UPDATE bill_support bs
SET seat_count = f.seats
FROM factions f
WHERE bs.faction_id = f.id
  AND bs.seat_count = 0
  AND f.seats > 0;
