-- Mirror of sql/migrations/20261114_party_archetype_tiered_seeding.sql.
-- See that file's header for full context. New parties: 1.0 baseline +
-- 4.0/3.5/3.0 tiered strongholds. Existing parties untouched.

BEGIN;

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

    UPDATE factions
       SET archetype = p_archetype_name
     WHERE id = p_faction_id
       AND (id = v_caller OR linked_user_id = v_caller)
       AND archetype IS NULL
    RETURNING nation_id INTO v_nation_id;

    IF v_nation_id IS NULL THEN
        RAISE EXCEPTION 'apply_party_archetype: faction not found, not owned by caller, or archetype already set';
    END IF;

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
