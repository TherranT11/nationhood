-- ════════════════════════════════════════════════════════════════════
-- Officer auto-fill helpers — one source of truth for the formula
-- ════════════════════════════════════════════════════════════════════
-- The pick-a-name-from-pool and roll-an-officer-age formulas had been
-- inlined at every site that needed them: admin_create_party (last
-- rewritten in 20270413) plus the three one-shot backfills
-- (20270412 deputy, 20270413 leader, 20270414 whip) plus a JS
-- mirror in admin.html's Add Party form pre-fill. Five sites, same
-- formula. A design tweak (different age range, weighted pick,
-- pool-tier preference, etc.) would have to land in all five.
--
-- This migration consolidates the SQL side into two pure helpers
-- and rewrites admin_create_party to use them. The three historical
-- backfills are not re-run — they already ran and seeded their rows
-- with the same formula values; touching them would just rewrite
-- migration history. From here forward, any new SQL caller (future
-- backfills, new RPCs that auto-fill officers, scripted seeds) goes
-- through pick_random_pool_name + roll_officer_age.
--
-- The JS mirror in admin.html stays as a per-form local helper —
-- there's no shared SQL/JS runtime — but it now carries an inline
-- pointer to this migration as the canonical formula source so a
-- future formula change has a paper trail to update both halves.
--
-- ── Helper contracts ───────────────────────────────────────────────
--   pick_random_pool_name(text[]) → text
--     Returns a uniformly random element from the array, or NULL if
--     the array is NULL or empty. Downstream callers wrap in COALESCE
--     to fall through to typed/default values.
--
--   roll_officer_age() → int
--     Returns a uniformly random integer in [35, 65] inclusive. Same
--     range the JS pre-fill uses; wide enough to vary across
--     regenerations, tight enough that picks read like senior
--     party officers.
--
-- Both functions are LANGUAGE sql VOLATILE — pure functions in the
-- sense of no side effects, but random()-driven so PG's caller can't
-- cache the result.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.pick_random_pool_name(p_pool text[])
RETURNS text
LANGUAGE sql
VOLATILE
AS $$
    SELECT CASE
        WHEN p_pool IS NULL OR array_length(p_pool, 1) IS NULL THEN NULL
        ELSE p_pool[1 + floor(random() * array_length(p_pool, 1))::int]
    END;
$$;

COMMENT ON FUNCTION public.pick_random_pool_name(text[]) IS
    'Canonical "pick a random name from a nation pool" formula. Used by '
    'admin_create_party (officer auto-fill) and any future code that '
    'needs to draw a culture-appropriate name from nations.first_name_pool '
    '/ last_name_pool. Returns NULL when pool is NULL or empty; callers '
    'wrap in COALESCE to fall through.';

CREATE OR REPLACE FUNCTION public.roll_officer_age()
RETURNS int
LANGUAGE sql
VOLATILE
AS $$
    SELECT 35 + floor(random() * 31)::int;
$$;

COMMENT ON FUNCTION public.roll_officer_age() IS
    'Canonical "roll a party-officer age" formula — uniformly random in '
    '[35, 65] inclusive. Mirrored by the JS pre-fill in admin.html; any '
    'change to this range needs the JS site updated too (a comment at '
    'that site points back to 20270415 as this canonical source).';

-- ── Rewrite admin_create_party to use the helpers ───────────────────
-- Body otherwise verbatim from 20270413 (the auto-Leader landing
-- migration). The only diff: the auto-fill block is now nine clean
-- helper calls instead of two IF/THEN/END IF arrays of inline
-- random() expressions. Same input → same output (statistically);
-- semantics unchanged.
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
    -- Pool buffers + auto-generated officer slots.
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
    -- Final leader values (typed-or-auto) — one source for the HoG
    -- validation, the INSERT, and the nation head_of_state update.
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

    -- Auto-fill Leader + Deputy + Whip independently via the canonical
    -- pick_random_pool_name + roll_officer_age helpers (20270415).
    -- Helpers return NULL for missing pools, so downstream COALESCEs
    -- still gate the INSERT correctly.
    v_auto_lead_f   := pick_random_pool_name(v_first_pool);
    v_auto_lead_l   := pick_random_pool_name(v_last_pool);
    v_auto_lead_age := roll_officer_age();
    v_auto_dep_f    := pick_random_pool_name(v_first_pool);
    v_auto_dep_l    := pick_random_pool_name(v_last_pool);
    v_auto_dep_age  := roll_officer_age();
    v_auto_whp_f    := pick_random_pool_name(v_first_pool);
    v_auto_whp_l    := pick_random_pool_name(v_last_pool);
    v_auto_whp_age  := roll_officer_age();

    -- Final leader values used by HoG validation, the INSERT, and the
    -- nation head_of_state update — one source for all three sites.
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
        v_final_lead_f,
        v_final_lead_l,
        COALESCE(v_leader_age, v_auto_lead_age),
        -- Deputy + Whip: per-field fallback to the auto pick. If the
        -- admin typed only a first name, the last name still
        -- auto-fills (the columns are independent so an admin half-
        -- edit gets the best of both inputs).
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
