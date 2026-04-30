-- =========================================================================
-- Seed faction_sector_popularity to a neutral baseline
--
-- BUG SIGNAL
-- ----------
-- Calveth's October 2003 general election shipped 6 parties at
-- 23/23/23/23/23/22 seats with `total_votes_cast = 0` and
-- `turnout_pct = 0.0%`. That's the allocateSeatsByTwp zero-fallback
-- (even split across factions) firing because every TWP was 0.
--
-- Root cause: the original sectors phase-0 triggers
-- (sql/migrations/20260426_sectors_phase0.sql:152-197) backfill new
-- (faction, sector) pairs with `popularity = 0`. Nations whose admins
-- never opened the Faction Popularity Editor have every row at 0,
-- so `Σ popularity × weight × base_turnout` = 0, every faction's TWP
-- collapses, and the seat allocator falls through to even-split.
-- Sangreza had the same shape before the GPP popularity rows got
-- manually populated.
--
-- FIX
-- ---
-- Change the seed default from 0 → 50 (5.0 displayed, the midpoint of
-- the 0-10 scale). Two parts:
--
--   1. Reissue both backfill triggers with the new default. New
--      factions and new sectors created from this point forward
--      land at popularity=50.
--
--   2. One-shot backfill: for every party-type faction whose
--      popularity profile is *entirely* zero across every sector,
--      flip those zeros to 50. Bounded narrowly so factions where
--      an admin has set even one non-zero value are left untouched.
--
-- A companion JS guard in elections.js' computeTwpVoteScaling makes
-- the displayed votes / turnout consistent with seat allocation when
-- TWP is still all zero (e.g., during a partial backfill window or in
-- a brand-new nation pre-seed). The two together ensure elections
-- show real numbers regardless of data state.
--
-- Idempotent: re-running the UPDATE only flips already-zero rows on
-- already-zero factions; touched rows from prior runs are no longer
-- candidates because they're now 50.
-- =========================================================================

-- Part 1: reissue the new-sector backfill trigger with default 50.
-- Inserts one popularity row per existing faction in the same nation.
CREATE OR REPLACE FUNCTION trg_backfill_sector_popularity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO faction_sector_popularity (faction_id, sector_id, popularity)
    SELECT f.id, NEW.id, 50
    FROM factions f
    WHERE f.nation_id = NEW.nation_id
    ON CONFLICT (faction_id, sector_id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Part 2: reissue the new-faction backfill trigger with default 50.
-- Inserts one popularity row per active sector in the faction's nation.
CREATE OR REPLACE FUNCTION trg_backfill_faction_popularity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.nation_id IS NULL THEN
        RETURN NEW;
    END IF;

    INSERT INTO faction_sector_popularity (faction_id, sector_id, popularity)
    SELECT NEW.id, s.id, 50
    FROM sectors s
    WHERE s.nation_id = NEW.nation_id AND s.is_active = true
    ON CONFLICT (faction_id, sector_id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Part 3: one-shot backfill. Touch only rows on factions whose entire
-- popularity profile is zero — i.e., never been edited. Factions with
-- at least one non-zero entry stay completely untouched so we don't
-- clobber operator decisions.
UPDATE faction_sector_popularity fsp
SET popularity = 50
WHERE fsp.popularity = 0
  AND fsp.faction_id IN (
    SELECT f.id
    FROM factions f
    WHERE f.faction_type = 'party'
      AND NOT EXISTS (
        SELECT 1 FROM faction_sector_popularity inner_fsp
        WHERE inner_fsp.faction_id = f.id
          AND inner_fsp.popularity > 0
      )
  );

-- Verify: list parties whose entire popularity profile is still zero.
-- Expected to be empty after this migration runs. Anything left has
-- no popularity rows at all — pre-existing data anomaly.
SELECT f.id, f.faction_name, n.name AS nation
FROM factions f
JOIN nations n ON n.id = f.nation_id
WHERE f.faction_type = 'party'
  AND NOT EXISTS (
    SELECT 1 FROM faction_sector_popularity fsp
    WHERE fsp.faction_id = f.id AND fsp.popularity > 0
  )
ORDER BY n.name, f.faction_name;
