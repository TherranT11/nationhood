-- ════════════════════════════════════════════════════════════════════
-- ADD PARTY — also auto-fill Party Leader (design change)
-- ════════════════════════════════════════════════════════════════════
-- 20270396 carved Leader out of the auto-fill set: "A faceless party
-- leader is the admin's choice to make (HoG flag depends on a real
-- leader name)." Design change supersedes that — every new movement
-- party should ship with a Leader, Deputy, and Whip auto-generated
-- from the nation's pools when the admin leaves the corresponding
-- fields empty. The admin can still type any of them by hand; the
-- auto-fill is per-field via COALESCE so half-edits are preserved.
--
-- ── Structural change vs 20270396 ──────────────────────────────────
-- The HoG check used to evaluate (v_leader_f IS NULL OR v_leader_l
-- IS NULL) against the TYPED values, before any auto-fill ran. With
-- this change, an empty Leader is no longer a blocker — the auto
-- pick supplies one. The check now evaluates the FINAL leader values
-- (typed-or-auto) so the only way an HoG party hits the error is the
-- pathological "nation has empty name pool AND admin typed nothing"
-- case. The pool fetch + auto-generation therefore moves above the
-- HoG check; the name-uniqueness + tick lookups stay where they were.
--
-- ── Backfill ───────────────────────────────────────────────────────
-- One-time UPDATE at the bottom: for every existing movement_party
-- with NULL leader_*, fill from the nation pools using the same
-- formula. Per-field COALESCE preserves any half-set values. Does
-- NOT touch nations.head_of_state_* — that's the nation's own
-- denormalised pointer; if a backfilled party happens to be that
-- nation's governing party, the admin can re-sync via the admin UI
-- (or a future RPC). The backfill stays scope-limited to faction
-- columns.
--
-- Idempotent on both fronts: the RPC's COALESCE no-ops when admin
-- typed values are present; the UPDATE's IS-NULL filter no-ops on
-- re-run because every touched row ends up fully populated.
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
    v_leader_age   int  := NULLIF(p_payload->>'leader_age', '')::int;
    v_nation_name  text;
    v_shard_id     uuid;
    v_cur_tick     int;
    v_faction_id   uuid := gen_random_uuid();
    -- Auto-fill pools + generated slots. Leader joins Deputy + Whip
    -- in the auto-fill set per the 20270413 design change.
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
    -- Final leader values (typed-or-auto) — computed once, used by
    -- both the HoG validation and the nation head_of_state update.
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

    -- Auto-fill Leader + Deputy + Whip independently. Falls through to
    -- NULL when a pool is missing/empty (shouldn't happen for shipped
    -- nations but better than inserting nonsense). Ages 35..65 inclusive,
    -- separate rolls so the three officers don't end up identical.
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

    -- Final leader values used by HoG validation, the INSERT, and the
    -- nation head_of_state update — one source for all three sites.
    v_final_lead_f := COALESCE(v_leader_f, v_auto_lead_f);
    v_final_lead_l := COALESCE(v_leader_l, v_auto_lead_l);

    -- HoG validation now evaluates the final leader values rather than
    -- the typed ones, so an empty admin Leader field is satisfied by
    -- the auto pick. Only fires on the pathological "empty pool AND
    -- nothing typed" case.
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
        -- Leader: typed-or-auto via the precomputed finals; age uses
        -- the auto roll when typed is absent.
        v_final_lead_f,
        v_final_lead_l,
        COALESCE(v_leader_age, v_auto_lead_age),
        -- Deputy + Whip: per-field fallback to the auto pick. If the
        -- admin typed only a first name, the last name still
        -- auto-fills (the two columns are independent so an admin
        -- half-edit gets the best of both inputs).
        COALESCE(NULLIF(btrim(p_payload->>'deputy_first_name'), ''), v_auto_dep_f),
        COALESCE(NULLIF(btrim(p_payload->>'deputy_last_name'),  ''), v_auto_dep_l),
        COALESCE(NULLIF(p_payload->>'deputy_age', '')::int,          v_auto_dep_age),
        COALESCE(NULLIF(btrim(p_payload->>'whip_first_name'),   ''), v_auto_whp_f),
        COALESCE(NULLIF(btrim(p_payload->>'whip_last_name'),    ''), v_auto_whp_l),
        COALESCE(NULLIF(p_payload->>'whip_age', '')::int,            v_auto_whp_age),
        COALESCE(v_cur_tick, 0), 0, false, NULL
    );

    IF v_is_hog THEN
        -- Reads the final leader name (typed-or-auto) so an HoG party
        -- created with an empty admin Leader still wires the auto
        -- name onto the nation's head_of_state pointer rather than
        -- writing NULL there.
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

-- ── Backfill Leader on existing movement parties ────────────────────
-- Mirror of 20270412's Deputy backfill, scoped to leader_*. Same
-- formula, same guards (movement_party only, abandoned_at IS NULL,
-- nation has non-empty pools, party has at least one NULL leader
-- field). Per-field COALESCE preserves typed values; idempotent on
-- re-run because every touched row ends up fully populated.
--
-- Does NOT touch nations.head_of_state_* — that pointer is the
-- nation's own denormalised data. If a backfilled party happens to
-- be its nation's governing party, the head_of_state may need a
-- separate sync (admin UI today).
UPDATE factions AS f
   SET leader_first_name = COALESCE(
           f.leader_first_name,
           n.first_name_pool[1 + floor(random() * array_length(n.first_name_pool, 1))::int]
       ),
       leader_last_name  = COALESCE(
           f.leader_last_name,
           n.last_name_pool[1 + floor(random() * array_length(n.last_name_pool, 1))::int]
       ),
       leader_age        = COALESCE(
           f.leader_age,
           35 + floor(random() * 31)::int
       )
  FROM nations AS n
 WHERE f.nation_id = n.id
   AND f.faction_type = 'movement_party'
   AND f.abandoned_at IS NULL
   AND (
         f.leader_first_name IS NULL
      OR f.leader_last_name  IS NULL
      OR f.leader_age        IS NULL
       )
   AND n.first_name_pool IS NOT NULL
   AND array_length(n.first_name_pool, 1) > 0
   AND n.last_name_pool  IS NOT NULL
   AND array_length(n.last_name_pool, 1)  > 0;

NOTIFY pgrst, 'reload schema';

COMMIT;
