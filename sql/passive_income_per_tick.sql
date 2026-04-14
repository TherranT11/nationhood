-- ══════════════════════════════════════════════════════════════
-- Passive Income: $1k per seat per tick for all parties
-- Also enforces momentum floor of 1
--
-- Run this each tick (add to advance-tick edge function or run via pg_cron)
-- Can also be run manually to grant one tick's worth of income.
-- ══════════════════════════════════════════════════════════════

-- Grant passive income: $1,000 per seat held
UPDATE factions
SET party_funds = COALESCE(party_funds, 0) + (COALESCE(seats, 0) * 1000)
WHERE faction_type = 'party'
  AND abandoned_at IS NULL
  AND COALESCE(seats, 0) > 0;

-- Enforce momentum floor of 1 (prevent death spiral)
UPDATE factions
SET momentum = 1
WHERE faction_type = 'party'
  AND abandoned_at IS NULL
  AND COALESCE(momentum, 0) < 1;
