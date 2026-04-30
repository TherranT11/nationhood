-- =========================================================================
-- Add royal_assent_deadline to bills.
--
-- Bills passed under absolute monarchy enter status='awaiting_royal_assent'
-- and wait for the Monarch to ENACT or VETO via the Royal Assent panel on
-- government.html. Until now there was no deadline column and no auto-
-- action on timeout — if the Monarch went inactive, every passed
-- ordinary bill hung indefinitely.
--
-- This adds the column, mirroring president_desk_deadline. The companion
-- code change (advance-tick processRoyalAssent + bills.js
-- awaiting_royal_assent write) populates and consumes it. Bills already
-- in awaiting_royal_assent at the time this migration runs get a deadline
-- of (current_tick + ROYAL_ASSENT_TICKS) so they auto-resolve on the next
-- few ticks rather than hanging forever.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS + the backfill is conditional.
-- =========================================================================

ALTER TABLE bills ADD COLUMN IF NOT EXISTS royal_assent_deadline INT;

-- Backfill any bills already stuck in awaiting_royal_assent so they
-- auto-enact within ROYAL_ASSENT_TICKS (6) of the next corp tick.
DO $$
DECLARE
    v_current_tick INT;
BEGIN
    SELECT current_tick INTO v_current_tick
    FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_current_tick := COALESCE(v_current_tick, 0);

    UPDATE bills
    SET royal_assent_deadline = v_current_tick + 6
    WHERE status = 'awaiting_royal_assent'
      AND royal_assent_deadline IS NULL;
END $$;

-- Verify: every awaiting_royal_assent row now has a deadline.
SELECT id, bill_name, status, royal_assent_deadline
FROM bills
WHERE status = 'awaiting_royal_assent'
  AND royal_assent_deadline IS NULL;
