-- Prevent double AP accumulation from appearing in the ledger.
-- If the tick processor runs twice for the same tick (e.g., manual + cron overlap),
-- the second insert for tick_gain will be silently skipped.

-- First, clean up any existing duplicates (keep the first one inserted)
DELETE FROM ap_ledger a
USING ap_ledger b
WHERE a.faction_id = b.faction_id
  AND a.tick = b.tick
  AND a.reason = b.reason
  AND a.reason = 'tick_gain'
  AND a.id > b.id;

-- Add unique constraint: one tick_gain entry per faction per tick
CREATE UNIQUE INDEX IF NOT EXISTS uq_ap_ledger_tick_gain
    ON ap_ledger (faction_id, tick) WHERE reason = 'tick_gain';
