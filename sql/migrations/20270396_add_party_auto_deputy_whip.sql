-- ════════════════════════════════════════════════════════════════════
-- ADD PARTY — server-side auto-fill of Deputy + Whip when left empty
-- ════════════════════════════════════════════════════════════════════
-- User-confirmed behaviour: empty Deputy Leader and Party Whip fields
-- at submit should produce culture-appropriate names (not Vacant
-- slots on the party detail card). The admin form already had a JS
-- pre-fill (loadAddPartyInit → onAddPartyNationChange) that runs on
-- nation change, but it doesn't fire on initial form load and the
-- admin can clear the fields manually. Moving the fallback into the
-- RPC means no path can produce an empty deputy/whip slot.
--
-- The leader fields are intentionally NOT auto-filled — the user
-- explicitly asked for whip + deputy. A faceless party leader is the
-- admin's choice to make (HoG flag depends on a real leader name).
--
-- Source of name pools: nations.first_name_pool / last_name_pool,
-- seeded by 20260927 from the JS constants in
-- js/game/political-actions.js. Empty/NULL pool falls through to NULL
-- (no placeholder garbage) — every shipped nation has 30+ entries so
-- this is a defensive guard, not a real path.
--
-- Age range mirrors the JS pre-fill: 35..65 inclusive, randomised
-- independently per slot so deputy and whip don't end up the same age.
--
-- Body otherwise verbatim from 20270395 — six new DECLAREd vars, one
-- nation-pool SELECT, six COALESCE wrappers at INSERT time.
-- Idempotent.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.admin_create_party(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_nation_id    uuid := NULLIF(p_payload->>'nation_id', '')::uuid;
    v_name         text := btrim(COALESCE(p_payload->>'faction_name', ''));
    v_abbr         text := btrim(COALESCE(p_payload->>'abbreviation', ''));
    v_seats        int  := COALESCE(NULLIF(p_payload->>'seats', '')::int, 0);
    v_popularity   numeric := NULLIF(p_payload->>'popularity_pct', '')::numeric;
    v_archetype    text := NULLIF(btrim(p_payload->>'archetype'), '');
    v_status       text := NULLIF(btrim(p_payload->>'party_status'), '');
    v_is_hog       bool := COALESCE((p_payload->>'is_head_of_government')::bool, false);
    v_leader_f     text := NULLIF(btrim(p_payload->>'leader_first_name'), '');
    v_leader_l     text := NULLIF(btrim(p_payload->>'leader_last_name'), '');
    v_nation_name  text;
    v_shard_id     uuid;
    v_cur_tick     int;
    v_faction_id   uuid := gen_random_uuid();
    -- Auto-fill pools + generated slots.
    v_first_pool   text[];
    v_last_pool    text[];
    v_auto_dep_f   text;
    v_auto_dep_l   text;
    v_auto_dep_age int;
    v_auto_whp_f   text;
    v_auto_whp_l   text;
    v_auto_whp_age int;
    v_archetype_ok constant text[] := ARRAY[
        'Reform', 'Social Democratic', 'Traditional Conservative',
        'Liberal', 'Libertarian', 'Communist / Leftist',
        'Green', 'Nationalist', 'Populist', 'Centrist'
    ];
BEGIN
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    IF v_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_required');
    END IF;
    SELECT name, shard_id, first_name_pool, last_name_pool
      INTO v_nation_name, v_shard_id, v_first_pool, v_last_pool
      FROM nations
     WHERE id = v_nation_id;
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
    IF v_popularity IS NOT NULL AND (v_popularity < 0 OR v_popularity > 100) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_popularity');
    END IF;
    IF v_archetype IS NOT NULL AND NOT (v_archetype = ANY (v_archetype_ok)) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_archetype');
    END IF;
    IF v_status IS NOT NULL AND v_status NOT IN ('Governing', 'Coalition', 'Opposition') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_status');
    END IF;
    IF v_is_hog AND (v_leader_f IS NULL OR v_leader_l IS NULL) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'hog_requires_leader');
    END IF;
    IF EXISTS (
        SELECT 1 FROM factions
         WHERE nation_id = v_nation_id AND faction_type = 'movement_party'
           AND LOWER(faction_name) = LOWER(v_name) AND abandoned_at IS NULL
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'name_exists');
    END IF;

    SELECT current_tick INTO v_cur_tick FROM shard WHERE id = v_shard_id;

    -- Auto-fill Deputy + Whip slots independently. Falls through to
    -- NULL when a pool is missing/empty (shouldn't happen for shipped
    -- nations but better than inserting nonsense). Ages 35..65 inclusive,
    -- separate rolls so the two officers don't end up identical.
    IF v_first_pool IS NOT NULL AND array_length(v_first_pool, 1) > 0 THEN
        v_auto_dep_f := v_first_pool[1 + floor(random() * array_length(v_first_pool, 1))::int];
        v_auto_whp_f := v_first_pool[1 + floor(random() * array_length(v_first_pool, 1))::int];
    END IF;
    IF v_last_pool IS NOT NULL AND array_length(v_last_pool, 1) > 0 THEN
        v_auto_dep_l := v_last_pool[1 + floor(random() * array_length(v_last_pool, 1))::int];
        v_auto_whp_l := v_last_pool[1 + floor(random() * array_length(v_last_pool, 1))::int];
    END IF;
    v_auto_dep_age := 35 + floor(random() * 31)::int;
    v_auto_whp_age := 35 + floor(random() * 31)::int;

    INSERT INTO factions (
        id,
        faction_type, faction_name, nation_id, nation, shard_id,
        abbreviation, seats, popularity_pct, party_color, party_logo, custom_logo_url,
        archetype, party_status,
        party_description, leader_first_name, leader_last_name, leader_age,
        deputy_first_name, deputy_last_name, deputy_age,
        whip_first_name, whip_last_name, whip_age,
        founded_tick, action_points, needs_rebuild, abandoned_at
    ) VALUES (
        v_faction_id,
        'movement_party', v_name, v_nation_id, v_nation_name, v_shard_id,
        v_abbr, v_seats, v_popularity,
        NULLIF(btrim(p_payload->>'party_color'), ''),
        COALESCE(NULLIF(btrim(p_payload->>'party_logo'), ''), 'star'),
        NULLIF(btrim(p_payload->>'custom_logo_url'), ''),
        v_archetype, v_status,
        NULLIF(btrim(p_payload->>'party_description'), ''),
        v_leader_f,
        v_leader_l,
        NULLIF(p_payload->>'leader_age', '')::int,
        -- Deputy: per-field fallback to the auto pick. If the admin
        -- typed only a first name, the last name still auto-fills (the
        -- two columns are independent so an admin half-edit gets the
        -- best of both inputs).
        COALESCE(NULLIF(btrim(p_payload->>'deputy_first_name'), ''), v_auto_dep_f),
        COALESCE(NULLIF(btrim(p_payload->>'deputy_last_name'),  ''), v_auto_dep_l),
        COALESCE(NULLIF(p_payload->>'deputy_age', '')::int,          v_auto_dep_age),
        COALESCE(NULLIF(btrim(p_payload->>'whip_first_name'),   ''), v_auto_whp_f),
        COALESCE(NULLIF(btrim(p_payload->>'whip_last_name'),    ''), v_auto_whp_l),
        COALESCE(NULLIF(p_payload->>'whip_age', '')::int,            v_auto_whp_age),
        COALESCE(v_cur_tick, 0), 0, false, NULL
    );

    IF v_is_hog THEN
        UPDATE nations
           SET head_of_state_first_name = v_leader_f,
               head_of_state_last_name  = v_leader_l
         WHERE id = v_nation_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'faction_id', v_faction_id,
        'faction_name', v_name,
        'abbreviation', v_abbr,
        'seats', v_seats,
        'popularity_pct', v_popularity,
        'faction_type', 'movement_party',
        'archetype', v_archetype,
        'party_status', v_status,
        'head_of_government_set', v_is_hog
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_create_party(jsonb) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
