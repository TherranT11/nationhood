-- Fix Palvera budget: stuck bills from 2000/2001, stale last_budget_tick,
-- and stale bill_support seat_counts on open budget bills across all nations.
--
-- Problem:
--   1. Palvera's last_budget_tick is 0/null, so budget preview/submit dates
--      show October 2000 / January 2001 instead of the current cycle.
--   2. Old budget bills stuck in committee/floor never resolved because
--      bill_support.seat_count values were stale (didn't sum to total_seats),
--      preventing checkEarlyMajority from detecting a math-lock.
--
-- Fix:
--   Step 1: Backfill bill_support.seat_count from factions.seats for ALL
--           open budget bills (any nation). This ensures vote tallies use
--           current seat counts so checkEarlyMajority can detect majorities.
--   Step 2: Fail Palvera's stuck budget bills so the cycle can restart.
--   Step 3: Reset Palvera's last_budget_tick to the current shard tick
--           so budget dates show the correct upcoming cycle.

-- STEP 1: Backfill stale seat_counts on bill_support for all open budget bills.
-- Uses factions.seats (always reflects the latest election results) instead of
-- the snapshot taken at vote time, which may be from an older parliament.
UPDATE bill_support bs
SET seat_count = f.seats
FROM factions f
JOIN bills b ON bs.bill_id = b.id
WHERE bs.faction_id = f.id
  AND b.bill_type = 'budget'
  AND b.status IN ('committee', 'floor')
  AND f.seats > 0
  AND bs.seat_count != f.seats;

-- STEP 2: Fail all stuck Palvera budget bills (committee or floor).
UPDATE bills
SET status = 'failed'
WHERE nation_id = (SELECT id FROM nations WHERE name = 'Palvera')
  AND bill_type = 'budget'
  AND status IN ('committee', 'floor');

-- STEP 3: Reset Palvera's budget cycle to the current tick.
UPDATE nations
SET last_budget_tick = (SELECT current_tick FROM shard WHERE name = 'Alpha Shard'),
    last_budget_bill_id = NULL
WHERE name = 'Palvera';
