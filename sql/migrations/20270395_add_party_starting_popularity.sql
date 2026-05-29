-- ════════════════════════════════════════════════════════════════════
-- ADD PARTY — Starting Popularity input on the admin form
-- ════════════════════════════════════════════════════════════════════
-- User-requested addition to the Add Party admin form (sibling of
-- Starting Seats). Sets factions.popularity_pct at creation time.
--
-- The column itself was added by 20270375 with a CHECK pinning the
-- range to 0..100 (or NULL). This migration:
--
--   1. CREATE OR REPLACE admin_create_party to read popularity_pct
--      from the payload, range-validate it (the CHECK at column level
--      already enforces this; the RPC guard turns a constraint
--      violation into a clean 'invalid_popularity' reason instead
--      of a Postgres error string the admin form would render as
--      "Create failed: <23514>").
--   2. UPDATE system_config.admin_panel_html to inject the new
--      <input id="ap-popularity"> immediately after Starting Seats.
--
-- Body of admin_create_party is otherwise verbatim from 20270394:
-- one new DECLARE'd var, one validation block, one INSERT column +
-- VALUES row, one extra field in the return JSON. Idempotent.
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
    -- Popularity guard. CHECK constraint factions_popularity_pct_range
    -- (20270375) enforces the same range; this turns a raw constraint
    -- violation into a clean reason the form's REASON map can render.
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
        NULLIF(btrim(p_payload->>'deputy_first_name'), ''),
        NULLIF(btrim(p_payload->>'deputy_last_name'), ''),
        NULLIF(p_payload->>'deputy_age', '')::int,
        NULLIF(btrim(p_payload->>'whip_first_name'), ''),
        NULLIF(btrim(p_payload->>'whip_last_name'), ''),
        NULLIF(p_payload->>'whip_age', '')::int,
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

-- HTML — inject the Starting Popularity input directly after Starting
-- Seats. Anchor on the full seats input string so the splice is
-- unambiguous and the guard catches re-runs.
UPDATE system_config
SET value = REPLACE(
    value,
    '                <div class="input-group"><label>Starting Seats</label><input type="number" id="ap-seats" min="0" max="1000" value="0"></div>',
    '                <div class="input-group"><label>Starting Seats</label><input type="number" id="ap-seats" min="0" max="1000" value="0"></div>
                <div class="input-group"><label>Starting Popularity (%)</label><input type="number" id="ap-popularity" min="0" max="100" step="0.1" placeholder="e.g. 35"></div>'
),
    updated_at = now()
WHERE key = 'admin_panel_html'
  AND value LIKE '%id="ap-seats"%'
  AND value NOT LIKE '%id="ap-popularity"%';

NOTIFY pgrst, 'reload schema';

COMMIT;
