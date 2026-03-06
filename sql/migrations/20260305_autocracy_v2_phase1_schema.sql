-- Autocratic Faction System v2.0 — Phase 1: Schema & Stat Foundation
-- Adds faction-level standing, embezzled funds, regime health, and unaligned seat pool.

-- ═══════════════════════════════════════════════════════════════
-- FACTIONS TABLE: New columns for v2 autocracy stats
-- ═══════════════════════════════════════════════════════════════

-- Standing: faction-level public reputation (migrated from stewards)
ALTER TABLE factions ADD COLUMN IF NOT EXISTS standing INTEGER NOT NULL DEFAULT 30;

-- Embezzled funds: hidden war chest in $M
ALTER TABLE factions ADD COLUMN IF NOT EXISTS embezzled_funds NUMERIC NOT NULL DEFAULT 0;

-- Consecutive embezzle counter: for detection escalation
ALTER TABLE factions ADD COLUMN IF NOT EXISTS consecutive_embezzle_ticks INTEGER NOT NULL DEFAULT 0;

-- Last tick a standing-building action was taken (for relevance decay)
ALTER TABLE factions ADD COLUMN IF NOT EXISTS last_standing_action_tick INTEGER;

-- Last faction action type (for vulnerability window checks)
ALTER TABLE factions ADD COLUMN IF NOT EXISTS last_action_type TEXT;

-- Coup lockout: tick after which coups are allowed again (post-purge)
ALTER TABLE factions ADD COLUMN IF NOT EXISTS coup_lockout_until_tick INTEGER;

-- ═══════════════════════════════════════════════════════════════
-- NATIONS TABLE: Regime health and unaligned seats
-- ═══════════════════════════════════════════════════════════════

-- Regime Health: 0-100, starts at 80, decays over time
ALTER TABLE nations ADD COLUMN IF NOT EXISTS regime_health NUMERIC NOT NULL DEFAULT 80;

-- Unaligned seat pool: unclaimed legislature seats
ALTER TABLE nations ADD COLUMN IF NOT EXISTS unaligned_seats INTEGER NOT NULL DEFAULT 0;

-- Redistribute Seats cooldown tracker
ALTER TABLE nations ADD COLUMN IF NOT EXISTS last_redistribute_tick INTEGER;

-- ═══════════════════════════════════════════════════════════════
-- DATA MIGRATION: Copy steward standing → faction standing
-- ═══════════════════════════════════════════════════════════════

-- For each living steward, copy their standing to their faction.
-- Only updates factions that still have the default standing (30).
UPDATE factions f
SET standing = s.standing
FROM stewards s
WHERE s.faction_id = f.id
  AND s.is_alive = true
  AND f.standing = 30
  AND s.standing != 30;

-- ═══════════════════════════════════════════════════════════════
-- INITIALIZE: Regime health for existing autocracy nations
-- ═══════════════════════════════════════════════════════════════

UPDATE nations
SET regime_health = 80
WHERE regime_health = 80  -- no-op if already 80 (default)
  AND (government_type ILIKE '%autocra%'
    OR government_type ILIKE '%authoritarian%'
    OR government_type ILIKE '%dictat%'
    OR government_type ILIKE '%junta%');

-- ═══════════════════════════════════════════════════════════════
-- INITIALIZE: Unaligned seat pool (10% of legislature, drawn from largest factions)
-- This is handled in application code during tick processing,
-- but we set initial values for existing nations.
-- ═══════════════════════════════════════════════════════════════

-- Set unaligned_seats to 0 initially; the tick processor will
-- gradually build the pool via the +1/4-ticks regeneration mechanic.
-- No need to forcibly redistribute seats from existing factions in migration.
