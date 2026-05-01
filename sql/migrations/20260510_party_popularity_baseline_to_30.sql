-- ══════════════════════════════════════════════════════════════
-- Flip the new-party / new-sector popularity baseline from 50 → 30
--
-- Before: trg_backfill_faction_popularity + trg_backfill_sector_popularity
--         seeded every faction × sector cell at 50 (5.0 displayed),
--         and apply_party_archetype LOWERED strongholds to 30 (3.0).
--         That's the inverse of how players read it — strongholds
--         should be the higher number, not the lower.
--
-- After:  Both triggers seed at 30 (3.0 displayed). The archetype
--         RPC continues to set strongholds, but the JS-side constant
--         STRONGHOLD_POPULARITY flips to 50 (5.0 displayed) so that
--         "stronghold = highest, baseline = lower" is the actual
--         rule on the page.
--
-- NEW parties / NEW sectors only — existing rows are untouched per
-- spec ("make that change for NEW parties"). One-shot backfills from
-- prior migrations are not reissued.
--
-- Idempotent: CREATE OR REPLACE on both trigger functions.
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION trg_backfill_sector_popularity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO faction_sector_popularity (faction_id, sector_id, popularity)
    SELECT f.id, NEW.id, 30
    FROM factions f
    WHERE f.nation_id = NEW.nation_id
    ON CONFLICT (faction_id, sector_id) DO NOTHING;
    RETURN NEW;
END;
$$;

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
    SELECT NEW.id, s.id, 30
    FROM sectors s
    WHERE s.nation_id = NEW.nation_id AND s.is_active = true
    ON CONFLICT (faction_id, sector_id) DO NOTHING;
    RETURN NEW;
END;
$$;
