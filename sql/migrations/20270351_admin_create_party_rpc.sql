-- ═══════════════════════════════════════════════════════════════════════════════
-- ADD PARTY — admin_create_party RPC
-- ═══════════════════════════════════════════════════════════════════════════════
-- Creates a seated NPC political party (a factions row, faction_type='party',
-- no linked user) from the Admin Panel "Add Party" tab. Mirrors the player flow
-- in createparty.html: insert the factions row, then apply the archetype's
-- tiered sector-popularity strongholds.
--
-- Why this doesn't call apply_party_archetype:
--   apply_party_archetype (20261114) is OWNER-gated — it only mutates a faction
--   whose id or linked_user_id matches auth.uid(). An NPC party is unowned, so
--   that call would raise 'faction not found, not owned by caller'. We therefore
--   replicate ONLY its popularity-UPDATE step here (under is_admin()).
--   ⚠ DUPLICATION NOTE: the stronghold UPDATE below mirrors the one in
--   apply_party_archetype; if that popularity model changes, update both.
--
-- Sector popularity baseline: the INSERT fires trg_backfill_faction_popularity,
-- which seeds popularity = 10 (1.0) for every active sector in the nation. The
-- archetype step then raises the named strongholds to the passed tiers
-- (JS sends STRONGHOLD_POPULARITY_TIERS = 40/35/30 = 4.0/3.5/3.0).
--
-- Multiple NPC parties per nation are allowed: the per-user uniqueness index
-- (idx_factions_one_nonpolitician_per_user_per_nation post-20270371, renamed
-- from idx_factions_one_per_user_per_nation) keys on COALESCE(linked_user_id,
-- id) — each NPC party has a unique id and null linked_user_id, so they
-- never collide.
--
-- Auth: SECURITY DEFINER, gated by is_admin().
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.admin_create_party(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_nation_id   uuid := NULLIF(p_payload->>'nation_id', '')::uuid;
    v_name        text := btrim(COALESCE(p_payload->>'faction_name', ''));
    v_abbr        text := btrim(COALESCE(p_payload->>'abbreviation', ''));
    v_seats       int  := COALESCE(NULLIF(p_payload->>'seats', '')::int, 0);
    v_archetype   text := NULLIF(btrim(p_payload->>'archetype_name'), '');
    v_nation_name text;
    v_shard_id    uuid;
    v_cur_tick    int;
    v_faction_id  uuid;
    v_sector_keys text[];
    v_pops        smallint[];
BEGIN
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    IF v_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_required');
    END IF;
    SELECT name, shard_id INTO v_nation_name, v_shard_id FROM nations WHERE id = v_nation_id;
    IF v_nation_name IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_found');
    END IF;
    IF length(v_name) < 2 OR length(v_name) > 80 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;
    IF length(v_abbr) < 1 OR length(v_abbr) > 8 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_abbreviation');
    END IF;
    IF v_seats < 0 OR v_seats > 1000 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_seats');
    END IF;
    IF EXISTS (
        SELECT 1 FROM factions
         WHERE nation_id = v_nation_id AND faction_type = 'party'
           AND LOWER(faction_name) = LOWER(v_name) AND abandoned_at IS NULL
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'name_exists');
    END IF;

    SELECT current_tick INTO v_cur_tick FROM shard WHERE id = v_shard_id;

    INSERT INTO factions (
        faction_type, faction_name, nation_id, nation, shard_id,
        abbreviation, seats, party_color, party_logo, custom_logo_url,
        party_description, leader_first_name, leader_last_name, leader_age,
        founded_tick, action_points, needs_rebuild, abandoned_at
    ) VALUES (
        'party', v_name, v_nation_id, v_nation_name, v_shard_id,
        v_abbr, v_seats,
        NULLIF(btrim(p_payload->>'party_color'), ''),
        COALESCE(NULLIF(btrim(p_payload->>'party_logo'), ''), 'star'),
        NULLIF(btrim(p_payload->>'custom_logo_url'), ''),
        NULLIF(btrim(p_payload->>'party_description'), ''),
        NULLIF(btrim(p_payload->>'leader_first_name'), ''),
        NULLIF(btrim(p_payload->>'leader_last_name'), ''),
        NULLIF(p_payload->>'leader_age', '')::int,
        COALESCE(v_cur_tick, 0), 0, false, NULL
    )
    RETURNING id INTO v_faction_id;

    -- Archetype + tiered strongholds (see DUPLICATION NOTE in the header).
    IF v_archetype IS NOT NULL AND jsonb_typeof(p_payload->'sector_keys') = 'array' THEN
        SELECT array_agg(elem ORDER BY ord)
          INTO v_sector_keys
          FROM jsonb_array_elements_text(p_payload->'sector_keys') WITH ORDINALITY AS t(elem, ord);
        SELECT array_agg(elem::smallint ORDER BY ord)
          INTO v_pops
          FROM jsonb_array_elements_text(p_payload->'popularities') WITH ORDINALITY AS t(elem, ord);

        UPDATE factions SET archetype = v_archetype
         WHERE id = v_faction_id AND archetype IS NULL;

        IF v_sector_keys IS NOT NULL AND v_pops IS NOT NULL
           AND array_length(v_sector_keys, 1) = array_length(v_pops, 1) THEN
            UPDATE faction_sector_popularity fsp
               SET popularity = stronghold.pop
              FROM sectors s,
                   unnest(v_sector_keys, v_pops) AS stronghold(key, pop)
             WHERE fsp.faction_id = v_faction_id
               AND fsp.sector_id  = s.id
               AND s.nation_id    = v_nation_id
               AND s.sector_key   = stronghold.key;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'faction_id', v_faction_id,
        'faction_name', v_name,
        'abbreviation', v_abbr,
        'seats', v_seats,
        'archetype', v_archetype
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_create_party(jsonb) TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
