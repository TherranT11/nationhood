-- ════════════════════════════════════════════════════════════════
-- Tiered party archetype seeding for NEW parties
--
-- Two changes, going-forward only (existing rows untouched):
--
--   1. Lower the new-party baseline from 3.0 → 1.0 (30 → 10 stored
--      tenths) in trg_backfill_faction_popularity. NEW factions
--      now start at 1.0 in every sector; existing factions are
--      not retroactively touched. The new-sector trigger
--      (trg_backfill_sector_popularity) is intentionally LEFT at
--      30 so existing parties don't get nerfed when a new sector
--      type spawns later.
--
--   2. Replace the single-popularity apply_party_archetype RPC
--      with a parallel-arrays signature so the createparty UI can
--      seed each stronghold with a different popularity:
--          primary stronghold   → 4.0 (40)
--          secondary stronghold → 3.5 (35)
--          tertiary stronghold  → 3.0 (30)
--      The JS-side STRONGHOLD_POPULARITY_TIERS = [40,35,30] is
--      passed positionally alongside the strongholds array, which
--      js/game/archetypes.js orders primary → secondary → tertiary.
--
-- Affected scope:
--   - All FUTURE party creations: 1.0 baseline + tiered strongholds.
--   - All EXISTING parties: untouched (trigger only fires on INSERT).
--
-- Companion JS edits in this commit:
--   js/game/archetypes.js  STRONGHOLD_POPULARITY → STRONGHOLD_POPULARITY_TIERS
--   createparty.html       passes p_popularities array (was p_popularity scalar)
-- ════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Lower the new-faction baseline to 1.0 ──────────────────
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
    SELECT NEW.id, s.id, 10
    FROM sectors s
    WHERE s.nation_id = NEW.nation_id AND s.is_active = true
    ON CONFLICT (faction_id, sector_id) DO NOTHING;
    RETURN NEW;
END;
$$;


-- ── 2. Replace apply_party_archetype with tiered signature ────
-- Old signature took (uuid, text, text[], smallint) — single popularity
-- applied to every key. Drop it explicitly so the new parallel-arrays
-- function isn't accidentally overloaded onto the old one.
DROP FUNCTION IF EXISTS apply_party_archetype(uuid, text, text[], smallint);

CREATE OR REPLACE FUNCTION apply_party_archetype(
    p_faction_id     uuid,
    p_archetype_name text,
    p_sector_keys    text[],
    p_popularities   smallint[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller    uuid;
    v_nation_id uuid;
BEGIN
    v_caller := auth.uid();
    IF v_caller IS NULL THEN
        RAISE EXCEPTION 'apply_party_archetype: not authenticated';
    END IF;

    IF p_archetype_name IS NULL OR btrim(p_archetype_name) = '' THEN
        RAISE EXCEPTION 'apply_party_archetype: archetype name required';
    END IF;

    IF p_sector_keys IS NULL OR array_length(p_sector_keys, 1) IS NULL THEN
        RAISE EXCEPTION 'apply_party_archetype: at least one stronghold required';
    END IF;

    IF p_popularities IS NULL
       OR array_length(p_popularities, 1) <> array_length(p_sector_keys, 1) THEN
        RAISE EXCEPTION 'apply_party_archetype: popularities array must be parallel to sector_keys (got % vs %)',
            array_length(p_popularities, 1), array_length(p_sector_keys, 1);
    END IF;

    -- One-shot: set archetype only if not yet set, and only by the owner.
    UPDATE factions
       SET archetype = p_archetype_name
     WHERE id = p_faction_id
       AND (id = v_caller OR linked_user_id = v_caller)
       AND archetype IS NULL
    RETURNING nation_id INTO v_nation_id;

    IF v_nation_id IS NULL THEN
        RAISE EXCEPTION 'apply_party_archetype: faction not found, not owned by caller, or archetype already set';
    END IF;

    -- Apply the parallel-arrays popularity per stronghold. Rows already
    -- exist at popularity = 10 (1.0) from trg_backfill_faction_popularity.
    UPDATE faction_sector_popularity fsp
       SET popularity = stronghold.pop
      FROM sectors s,
           unnest(p_sector_keys, p_popularities) AS stronghold(key, pop)
     WHERE fsp.faction_id = p_faction_id
       AND fsp.sector_id  = s.id
       AND s.nation_id    = v_nation_id
       AND s.sector_key   = stronghold.key;
END;
$$;

GRANT EXECUTE ON FUNCTION apply_party_archetype(uuid, text, text[], smallint[]) TO authenticated;

COMMENT ON FUNCTION apply_party_archetype(uuid, text, text[], smallint[]) IS
    'Phase 5C-4 (re-issued 20261114): one-shot archetype application called from createparty.html. Sets factions.archetype and applies parallel popularity values (default tiers 40/35/30 = 4.0/3.5/3.0) to the named sectors. Refuses if the archetype is already set or the caller does not own the faction.';

COMMIT;

NOTIFY pgrst, 'reload schema';
