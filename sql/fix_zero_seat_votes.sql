-- Fix for: Presidential system 0-seat bug in loadSeats()
-- Run BOTH steps in Supabase SQL editor.

-- STEP 1 (run BEFORE deploying JS changes):
-- Backfill NULL election_type on old election records.
-- The new loadSeats() filter uses .eq('election_type', 'parliamentary'),
-- which won't match NULL. This ensures all pre-existing elections are tagged.
UPDATE elections
SET election_type = 'parliamentary'
WHERE election_type IS NULL;

-- STEP 2 (run AFTER deploying JS changes, or at the same time):
-- Backfill bill_support rows where seat_count is 0 but the faction has seats.
-- Fixes votes cast while loadSeats() was returning presidential election results.
UPDATE bill_support bs
SET seat_count = f.seats
FROM factions f
WHERE bs.faction_id = f.id
  AND bs.seat_count = 0
  AND f.seats > 0;
