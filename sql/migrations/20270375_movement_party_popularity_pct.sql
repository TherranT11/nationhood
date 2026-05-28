-- ════════════════════════════════════════════════════════════════════
-- Political movements get a nation-level Popularity rating.
--
-- Movements (faction_type='movement_party', introduced in 20270365) are
-- non-elected entities. Per 20270365:22 they deliberately skip the
-- faction_sector_popularity seeding that regular parties use — there's
-- no election surface that would consume per-sector data for them, so
-- a movement's "support" lives at the nation level instead.
--
-- Adds factions.popularity_pct (numeric, 0..100, nullable). Movements
-- get a value; every other faction_type stays NULL because:
--   • party / regular  → faction_sector_popularity already drives this
--     for elections. A second nation-level field on the same row would
--     drift from the sector-rollup truth.
--   • corp / military / entrepreneur / politician → no popularity
--     concept; column stays NULL.
--
-- Default of 35 (matches the seed value the user picked for HRF) is
-- applied via a BEFORE INSERT trigger so:
--   • Every insertion path (admin_create_party, any future RPC, manual
--     admin INSERTs) gets the default for free without re-copying the
--     full function body of 20270370.
--   • Callers that DO supply a value (admin override at creation, later
--     game-event RPCs that mutate popularity) flow through untouched.
--   • Non-movement faction types are unaffected — the trigger no-ops.
--
-- One existing movement row (HRF, per the screenshot) gets backfilled
-- to 35 by the UPDATE below.
--
-- Idempotent.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE factions
    ADD COLUMN IF NOT EXISTS popularity_pct numeric;

-- Constraint added separately so re-running the migration doesn't fail
-- if the column existed already without the check.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
         WHERE table_name = 'factions'
           AND constraint_name = 'factions_popularity_pct_range'
    ) THEN
        ALTER TABLE factions
            ADD CONSTRAINT factions_popularity_pct_range
            CHECK (popularity_pct IS NULL OR (popularity_pct >= 0 AND popularity_pct <= 100));
    END IF;
END $$;

-- Backfill existing movements. NULL → 35.
UPDATE factions
   SET popularity_pct = 35
 WHERE faction_type = 'movement_party'
   AND popularity_pct IS NULL;

-- BEFORE INSERT default — only fires for movement_party rows that
-- didn't supply a value. Doesn't touch updates; later game events
-- mutate via UPDATE and bypass this entirely.
CREATE OR REPLACE FUNCTION public.set_movement_party_popularity_default()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.faction_type = 'movement_party' AND NEW.popularity_pct IS NULL THEN
        NEW.popularity_pct := 35;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_movement_party_popularity_default ON factions;
CREATE TRIGGER trg_set_movement_party_popularity_default
    BEFORE INSERT ON factions
    FOR EACH ROW
    EXECUTE FUNCTION public.set_movement_party_popularity_default();

COMMENT ON COLUMN factions.popularity_pct IS
    'Nation-level popularity rating for political movements (faction_type=movement_party). 0..100 numeric. NULL for every other faction_type — regular parties read elections from faction_sector_popularity, corps/military/etc. have no popularity concept. New movements default to 35 via trg_set_movement_party_popularity_default; later game events mutate via UPDATE.';

COMMIT;

-- ── ROLLBACK ──
-- BEGIN;
-- DROP TRIGGER IF EXISTS trg_set_movement_party_popularity_default ON factions;
-- DROP FUNCTION IF EXISTS public.set_movement_party_popularity_default();
-- ALTER TABLE factions DROP CONSTRAINT IF EXISTS factions_popularity_pct_range;
-- ALTER TABLE factions DROP COLUMN IF EXISTS popularity_pct;
-- COMMIT;
