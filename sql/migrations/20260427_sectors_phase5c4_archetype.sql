-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTORS PHASE 5C-4 — Party archetypes
-- ═══════════════════════════════════════════════════════════════════════════════
-- Replaces the deleted ideology selection at party creation. Each new party
-- picks ONE archetype on the createparty screen. The archetype seeds initial
-- sector popularity: 3.0 (= 30 stored tenths) on three aligned sectors,
-- 0.0 on every other sector (the existing trg_backfill_faction_popularity
-- trigger has already inserted the 0-rows by the time the player calls this).
--
-- Schema:
--   * factions.archetype text — display label, e.g. "Labor / Social Democratic"
--
-- RPC:
--   * apply_party_archetype(p_faction_id, p_archetype_name, p_sector_keys[],
--                            p_popularity = 30)
--     SECURITY DEFINER. One-shot — fails if the archetype is already set on
--     this faction. Caller must own the faction (auth.uid() = factions.id OR
--     factions.linked_user_id).
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE factions
    ADD COLUMN IF NOT EXISTS archetype text;

COMMENT ON COLUMN factions.archetype IS
    'Party archetype label chosen at creation (Phase 5C-4). NULL for corporations and pre-archetype parties. Display-only — the actual mechanical effect is the initial sector_popularity seeding done by apply_party_archetype.';

CREATE OR REPLACE FUNCTION apply_party_archetype(
    p_faction_id    uuid,
    p_archetype_name text,
    p_sector_keys   text[],
    p_popularity    smallint DEFAULT 30
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

    -- One-shot: set archetype only if not yet set, and only by the owner.
    -- Returns the nation so we can scope the popularity update.
    UPDATE factions
       SET archetype = p_archetype_name
     WHERE id = p_faction_id
       AND (id = v_caller OR linked_user_id = v_caller)
       AND archetype IS NULL
    RETURNING nation_id INTO v_nation_id;

    IF v_nation_id IS NULL THEN
        RAISE EXCEPTION 'apply_party_archetype: faction not found, not owned by caller, or archetype already set';
    END IF;

    -- Apply stronghold popularity to the matched sectors. Rows already exist
    -- at popularity = 0 from trg_backfill_faction_popularity.
    UPDATE faction_sector_popularity fsp
       SET popularity = p_popularity
      FROM sectors s
     WHERE fsp.faction_id = p_faction_id
       AND fsp.sector_id  = s.id
       AND s.nation_id    = v_nation_id
       AND s.sector_key   = ANY(p_sector_keys);
END;
$$;

GRANT EXECUTE ON FUNCTION apply_party_archetype(uuid, text, text[], smallint) TO authenticated;

COMMENT ON FUNCTION apply_party_archetype(uuid, text, text[], smallint) IS
    'Phase 5C-4: one-shot archetype application called from createparty.html after the new faction row is inserted. Sets factions.archetype and bumps the listed sectors to p_popularity (default 30 = 3.0 displayed). Refuses if the archetype is already set or the caller does not own the faction.';

COMMIT;
