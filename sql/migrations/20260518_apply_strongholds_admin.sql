-- ══════════════════════════════════════════════════════════════
-- Admin-callable stronghold reapplication
--
-- Mirrors the JS-side ARCHETYPES catalog in
-- js/game/archetypes.js so service_role / SQL-editor calls can
-- bump archetype stronghold sectors to a given popularity value
-- without needing the auth.uid() that apply_party_archetype
-- enforces.
--
-- ⚠ IMPORTANT — TWO-SOURCE INVARIANT
--    The CASE expression below MUST stay in sync with the
--    ARCHETYPES array in js/game/archetypes.js. If a new
--    archetype is added or strongholds change in JS, edit this
--    function too. Otherwise SQL-side reapplication will silently
--    skip the new archetype.
-- ══════════════════════════════════════════════════════════════

-- Apply strongholds for ONE party. Looks up the archetype's
-- stronghold sectors and sets faction_sector_popularity for those
-- sectors to p_popularity. Existing rows for non-stronghold sectors
-- are untouched.
CREATE OR REPLACE FUNCTION apply_strongholds_for_archetype(
    p_archetype_name TEXT,
    p_faction_id     UUID,
    p_nation_id      UUID,
    p_popularity     SMALLINT DEFAULT 50
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_strongholds TEXT[];
    v_updated     INT := 0;
BEGIN
    -- Mirror of js/game/archetypes.js ARCHETYPES.strongholds.
    v_strongholds := CASE p_archetype_name
        WHEN 'Labor / Social Democratic' THEN ARRAY['SERVICE_GIG_WORKERS','SKILLED_TRADES_MANUFACTURING','URBAN_PROFESSIONALS']
        WHEN 'Traditional Conservative'  THEN ARRAY['RELIGIOUS_CONSERVATIVES','RURAL_AGRICULTURAL','SMALL_BUSINESS_OWNERS']
        WHEN 'Liberal / Progressive'     THEN ARRAY['URBAN_PROFESSIONALS','CULTURAL_PRODUCERS','STUDENTS_YOUNG_PRECARIAT']
        WHEN 'Populist Right'            THEN ARRAY['RURAL_AGRICULTURAL','RELIGIOUS_CONSERVATIVES','SKILLED_TRADES_MANUFACTURING']
        WHEN 'Libertarian'               THEN ARRAY['CAPITAL_OWNERS_EXECUTIVES','TECH_ENGINEERING_CLASS','SMALL_BUSINESS_OWNERS']
        WHEN 'Green'                     THEN ARRAY['STUDENTS_YOUNG_PRECARIAT','URBAN_PROFESSIONALS','CULTURAL_PRODUCERS']
        WHEN 'Nationalist'               THEN ARRAY['RURAL_AGRICULTURAL','RELIGIOUS_CONSERVATIVES','RETIREES_PENSIONERS']
        WHEN 'Technocratic / Centrist'   THEN ARRAY['TECH_ENGINEERING_CLASS','URBAN_PROFESSIONALS','SMALL_BUSINESS_OWNERS']
        ELSE NULL
    END;

    IF v_strongholds IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error',   'Unknown archetype: ' || COALESCE(p_archetype_name, '(null)')
        );
    END IF;

    WITH updated AS (
        UPDATE faction_sector_popularity fsp
           SET popularity = p_popularity
          FROM sectors s
         WHERE fsp.faction_id = p_faction_id
           AND fsp.sector_id  = s.id
           AND s.nation_id    = p_nation_id
           AND s.is_active    = TRUE
           AND s.sector_key   = ANY(v_strongholds)
        RETURNING fsp.id
    )
    SELECT COUNT(*) INTO v_updated FROM updated;

    RETURN jsonb_build_object(
        'success',         true,
        'archetype',       p_archetype_name,
        'strongholds',     v_strongholds,
        'sectors_updated', v_updated
    );
END;
$$;

GRANT EXECUTE ON FUNCTION apply_strongholds_for_archetype(TEXT, UUID, UUID, SMALLINT)
    TO service_role;

COMMENT ON FUNCTION apply_strongholds_for_archetype(TEXT, UUID, UUID, SMALLINT) IS
    'Admin-callable. Sets faction_sector_popularity to p_popularity (default 50 = 5.0 displayed) for the given party''s archetype strongholds. Mirrors js/game/archetypes.js — keep in sync.';

-- ── Bulk: for every archetype-having party in a nation, apply ──
CREATE OR REPLACE FUNCTION apply_strongholds_for_nation(
    p_nation_id  UUID,
    p_popularity SMALLINT DEFAULT 50
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_party   RECORD;
    v_results JSONB := '[]'::JSONB;
BEGIN
    FOR v_party IN
        SELECT id, faction_name, archetype
          FROM factions
         WHERE nation_id    = p_nation_id
           AND faction_type = 'party'
           AND archetype    IS NOT NULL
           AND abandoned_at IS NULL
    LOOP
        v_results := v_results || jsonb_build_object(
            'faction',   v_party.faction_name,
            'archetype', v_party.archetype,
            'result',    apply_strongholds_for_archetype(
                            v_party.archetype, v_party.id, p_nation_id, p_popularity
                         )
        );
    END LOOP;

    RETURN v_results;
END;
$$;

GRANT EXECUTE ON FUNCTION apply_strongholds_for_nation(UUID, SMALLINT) TO service_role;

COMMENT ON FUNCTION apply_strongholds_for_nation(UUID, SMALLINT) IS
    'Admin-callable. Walks every archetype-having party in p_nation_id and bumps their stronghold sectors to p_popularity. Returns a JSONB array of {faction, archetype, result} per party.';
