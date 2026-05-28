-- ═══════════════════════════════════════════════════════════════════════════════
-- POLITICIAN STARTING INFLUENCE — bump from 0 to 10
-- ═══════════════════════════════════════════════════════════════════════════════
-- Design change: every politician starts their career with 10 Influence,
-- not 0. Move that rule into the DB DEFAULT so future inserts from
-- first-steps.html's createPolitician (which doesn't explicitly set the
-- column) pick it up automatically — one source of truth on the schema.
--
-- Backfill catches every existing politician still sitting at the old default
-- of 0 (created before this change) — including Nasser Al-Qahtani — and lifts
-- them to the new starting line. Politicians who have already earned non-zero
-- influence keep their value untouched.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE factions
    ALTER COLUMN politician_influence SET DEFAULT 10;

UPDATE factions
   SET politician_influence = 10
 WHERE faction_type = 'politician'
   AND politician_influence = 0;

COMMIT;
