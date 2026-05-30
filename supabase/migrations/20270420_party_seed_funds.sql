-- ════════════════════════════════════════════════════════════════════
-- Party seed funds — every movement_party starts at $2M
--
-- Two-part change:
--   1. Backfill: every existing non-abandoned movement_party with
--      party_funds < $2M gets bumped to $2M. Parties already above
--      $2M (if any) keep their balance — GREATEST() floors the move,
--      it doesn't reset.
--   2. admin_create_party (20270413) now seeds new parties at
--      $2,000,000 instead of relying on the column default (which
--      was effectively 0 — the column wasn't named in the INSERT).
--
-- The party-page stats-strip in the same commit renames "Founded" to
-- "Party Funds" so this number has a visible home.
--
-- The CREATE OR REPLACE below is byte-for-byte identical to 20270413
-- EXCEPT for the two-line addition in the INSERT (party_funds column
-- in the column list, 2000000 in the VALUES tuple). If you change
-- admin_create_party again, copy 20270413's body forward, not this
-- one — that's the canonical version with its full design comments.
--
-- Idempotent: backfill UPDATE uses GREATEST so re-running is a no-op
-- on parties already at $2M; the RPC is CREATE OR REPLACE.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Backfill existing parties ────────────────────────────────────
UPDATE factions
   SET party_funds = GREATEST(COALESCE(party_funds, 0), 2000000)
 WHERE faction_type = 'movement_party'
   AND abandoned_at IS NULL;

-- ── 2. admin_create_party — seed at $2M ─────────────────────────────
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
    v_leader_age   int  := NULLIF(p_payload->>'leader_age', '')::int;
    v_nation_name  text;
    v_shard_id     uuid;
    v_cur_tick     int;
    v_faction_id   uuid := gen_random_uuid();
    v_first_pool   text[];
    v_last_pool    text[];
    v_auto_lead_f  text;
    v_auto_lead_l  text;
    v_auto_lead_age int;
    v_auto_dep_f   text;
    v_auto_dep_l   text;
    v_auto_dep_age int;
    v_auto_whp_f   text;
    v_auto_whp_l   text;
    v_auto_whp_age int;
    v_final_lead_f text;
    v_final_lead_l text;
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

    IF v_first_pool IS NOT NULL AND array_length(v_first_pool, 1) > 0 THEN
        v_auto_lead_f := v_first_pool[1 + floor(random() * array_length(v_first_pool, 1))::int];
        v_auto_dep_f  := v_first_pool[1 + floor(random() * array_length(v_first_pool, 1))::int];
        v_auto_whp_f  := v_first_pool[1 + floor(random() * array_length(v_first_pool, 1))::int];
    END IF;
    IF v_last_pool IS NOT NULL AND array_length(v_last_pool, 1) > 0 THEN
        v_auto_lead_l := v_last_pool[1 + floor(random() * array_length(v_last_pool, 1))::int];
        v_auto_dep_l  := v_last_pool[1 + floor(random() * array_length(v_last_pool, 1))::int];
        v_auto_whp_l  := v_last_pool[1 + floor(random() * array_length(v_last_pool, 1))::int];
    END IF;
    v_auto_lead_age := 35 + floor(random() * 31)::int;
    v_auto_dep_age  := 35 + floor(random() * 31)::int;
    v_auto_whp_age  := 35 + floor(random() * 31)::int;

    v_final_lead_f := COALESCE(v_leader_f, v_auto_lead_f);
    v_final_lead_l := COALESCE(v_leader_l, v_auto_lead_l);

    IF v_is_hog AND (v_final_lead_f IS NULL OR v_final_lead_l IS NULL) THEN
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
        founded_tick, action_points, needs_rebuild, abandoned_at,
        party_funds                                          -- 20270420
    ) VALUES (
        v_faction_id,
        'movement_party', v_name, v_nation_id, v_nation_name, v_shard_id,
        v_abbr, v_seats, v_popularity,
        NULLIF(btrim(p_payload->>'party_color'), ''),
        COALESCE(NULLIF(btrim(p_payload->>'party_logo'), ''), 'star'),
        NULLIF(btrim(p_payload->>'custom_logo_url'), ''),
        v_archetype, v_status,
        NULLIF(btrim(p_payload->>'party_description'), ''),
        v_final_lead_f,
        v_final_lead_l,
        COALESCE(v_leader_age, v_auto_lead_age),
        COALESCE(NULLIF(btrim(p_payload->>'deputy_first_name'), ''), v_auto_dep_f),
        COALESCE(NULLIF(btrim(p_payload->>'deputy_last_name'),  ''), v_auto_dep_l),
        COALESCE(NULLIF(p_payload->>'deputy_age', '')::int,          v_auto_dep_age),
        COALESCE(NULLIF(btrim(p_payload->>'whip_first_name'),   ''), v_auto_whp_f),
        COALESCE(NULLIF(btrim(p_payload->>'whip_last_name'),    ''), v_auto_whp_l),
        COALESCE(NULLIF(p_payload->>'whip_age', '')::int,            v_auto_whp_age),
        COALESCE(v_cur_tick, 0), 0, false, NULL,
        2000000                                              -- 20270420
    );

    IF v_is_hog THEN
        UPDATE nations
           SET head_of_state_first_name = v_final_lead_f,
               head_of_state_last_name  = v_final_lead_l
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
