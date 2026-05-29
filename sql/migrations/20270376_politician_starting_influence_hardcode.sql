-- ═══════════════════════════════════════════════════════════════════════════════
-- POLITICIAN STARTING INFLUENCE — hardcode-and-backfill pass
-- ═══════════════════════════════════════════════════════════════════════════════
-- 20270359 set politician_influence DEFAULT 10 and did a backfill, but on at
-- least one deployed shard the default never took (the most recently created
-- politician landed at 0 instead of 10). This migration does the bump again,
-- this time accounting for politicians who've already accumulated activity
-- so they don't get under-credited:
--
--   1. Re-asserts the DEFAULT 10 on the column (idempotent).
--   2. Adds +10 to every politician currently below the new baseline. For
--      the canonical broken case where a politician joined a movement_party
--      (+3 from politician_join_party) without ever having received the
--      starting +10, this lifts them 3 → 13 — the intended state of "10
--      starting + 3 from joining."
--
-- first-steps.html now sets politician_influence: 10 explicitly on the INSERT
-- row, so future politicians no longer rely on the column default — belt +
-- suspenders against the same drift recurring.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE factions
    ALTER COLUMN politician_influence SET DEFAULT 10;

UPDATE factions
   SET politician_influence = politician_influence + 10
 WHERE faction_type = 'politician'
   AND politician_influence < 10;

COMMIT;
