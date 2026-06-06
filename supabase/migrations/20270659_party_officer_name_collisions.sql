-- ════════════════════════════════════════════════════════════════════
-- 20270659 — Party officer name collisions: prevent + backfill
--
-- Bug report: two Melizean parties both had a leader named "Hernán
-- Castellanos-Vega" (different ages — different people generated to
-- the same name). pick_random_pool_name draws uniformly from the
-- nation pool with NO uniqueness check, so birthday-paradox
-- collisions happen at small pool sizes × multiple parties.
--
-- This migration:
--   1. Adds pick_unique_pool_name_pair — wraps the random pick in a
--      uniqueness retry against every officer slot (leader / deputy /
--      whip) on every non-abandoned movement party in the nation,
--      plus a caller-supplied "already used this batch" list so
--      consecutive picks within the same party can avoid each other.
--      Loops up to p_max_tries; falls through with whatever it has on
--      exhaustion (acceptable degraded behavior — pools should be
--      large enough that 8 tries always succeeds in practice).
--   2. Re-emits admin_create_party to use the new helper for all
--      three officer slots, chaining the extra-avoid array so deputy
--      avoids leader and whip avoids leader + deputy.
--   3. Backfills existing duplicates. For each movement party, oldest
--      first, checks each officer name against earlier parties' three
--      officer slots in the same nation AND against earlier-typed
--      slots within the same party. Regenerates colliders via the
--      same helper. Logs the touched count.
--
-- Scope: leader + deputy + whip (user opted into the wider scope).
-- Older-wins ordering: backfill keeps the oldest party's officer
-- untouched and regenerates newer colliders.
--
-- Out of scope: nations.head_of_state_* denormalised pointer (mirrors
-- 20270413's policy — admin re-syncs via the admin UI if a backfilled
-- party happens to be the head of government). Player-founded
-- politicians (faction_type = 'politician') aren't covered — that's
-- the next bug if name collisions surface there.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Helper: pick_unique_pool_name_pair ───────────────────────────
-- Random first+last draw from the supplied pools, with a uniqueness
-- check against the nation's existing movement-party officers + a
-- caller-supplied extra list (parallel arrays so consecutive picks in
-- the same party can avoid each other).
--
-- Returns NULL/NULL when either pool is NULL or empty — mirrors
-- pick_random_pool_name's behavior so callers can keep their existing
-- COALESCE chains as the final fallback.
CREATE OR REPLACE FUNCTION public.pick_unique_pool_name_pair(
    p_first_pool   text[],
    p_last_pool    text[],
    p_nation_id    uuid,
    p_extra_firsts text[] DEFAULT '{}'::text[],
    p_extra_lasts  text[] DEFAULT '{}'::text[],
    p_max_tries    int    DEFAULT 8
) RETURNS TABLE(first_name text, last_name text)
LANGUAGE plpgsql VOLATILE AS $$
DECLARE
    v_first    text;
    v_last     text;
    v_try      int := 0;
    v_collides boolean;
BEGIN
    IF p_first_pool IS NULL OR array_length(p_first_pool, 1) IS NULL
       OR p_last_pool  IS NULL OR array_length(p_last_pool, 1)  IS NULL THEN
        first_name := NULL;
        last_name  := NULL;
        RETURN NEXT;
        RETURN;
    END IF;

    LOOP
        v_try := v_try + 1;
        v_first := p_first_pool[1 + floor(random() * array_length(p_first_pool, 1))::int];
        v_last  := p_last_pool[1  + floor(random() * array_length(p_last_pool,  1))::int];

        SELECT
            EXISTS (
                SELECT 1 FROM factions
                 WHERE nation_id = p_nation_id
                   AND faction_type = 'movement_party'
                   AND abandoned_at IS NULL
                   AND (
                       (leader_first_name = v_first AND leader_last_name = v_last)
                    OR (deputy_first_name = v_first AND deputy_last_name = v_last)
                    OR (whip_first_name   = v_first AND whip_last_name   = v_last)
                   )
            )
            OR EXISTS (
                SELECT 1 FROM unnest(p_extra_firsts, p_extra_lasts) AS t(ef, el)
                 WHERE ef = v_first AND el = v_last
            )
            INTO v_collides;

        IF NOT v_collides OR v_try >= p_max_tries THEN
            first_name := v_first;
            last_name  := v_last;
            RETURN NEXT;
            RETURN;
        END IF;
    END LOOP;
END;
$$;

COMMENT ON FUNCTION public.pick_unique_pool_name_pair(text[], text[], uuid, text[], text[], int) IS
    'Collision-safe version of pick_random_pool_name (20270415). Returns a (first, last) pair that doesn''t match any leader/deputy/whip on a non-abandoned movement_party in p_nation_id, nor any pair in the caller-supplied p_extra_firsts/p_extra_lasts batch list. Loops up to p_max_tries (default 8) then falls through with whatever it has — pool size × party count should make 8 tries a sufficient buffer in practice.';

-- ── 2. admin_create_party — wire the collision-safe helper ─────────
-- Body verbatim from 20270420 (party_seed_funds = $2M) except the
-- three officer-name auto-fill blocks now call pick_unique_pool_
-- name_pair with the extra-avoid array chained from the previously-
-- generated officers in the same party.
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

    -- 20270659: auto-fill Leader → Deputy → Whip using the collision-
    -- safe helper. Each subsequent call passes the previously-picked
    -- pairs so within-party officer collisions are avoided too.
    SELECT first_name, last_name INTO v_auto_lead_f, v_auto_lead_l
      FROM pick_unique_pool_name_pair(v_first_pool, v_last_pool, v_nation_id);
    v_auto_lead_age := roll_officer_age();

    SELECT first_name, last_name INTO v_auto_dep_f, v_auto_dep_l
      FROM pick_unique_pool_name_pair(
           v_first_pool, v_last_pool, v_nation_id,
           ARRAY[v_auto_lead_f]::text[],
           ARRAY[v_auto_lead_l]::text[]
      );
    v_auto_dep_age := roll_officer_age();

    SELECT first_name, last_name INTO v_auto_whp_f, v_auto_whp_l
      FROM pick_unique_pool_name_pair(
           v_first_pool, v_last_pool, v_nation_id,
           ARRAY[v_auto_lead_f, v_auto_dep_f]::text[],
           ARRAY[v_auto_lead_l, v_auto_dep_l]::text[]
      );
    v_auto_whp_age := roll_officer_age();

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
        party_funds
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
        2000000
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

-- ── 3. Backfill existing duplicates ────────────────────────────────
-- Per-party sweep, oldest first. For each of leader / deputy / whip,
-- check collision against (a) earlier parties' officer slots in the
-- same nation and (b) earlier-typed slots in the SAME party. If
-- collision, regenerate via pick_unique_pool_name_pair using the
-- party's nation pools and the already-confirmed siblings as the
-- extra-avoid list.
--
-- Older-wins ordering means the longer-tenured party keeps its
-- officer and the newer one is the side that gets rolled. Within a
-- party: leader > deputy > whip (whip yields if it collides with
-- either, deputy yields if it collides with leader).
--
-- nations.head_of_state_* NOT touched — same policy as 20270413's
-- leader backfill.
DO $$
DECLARE
    v_party        RECORD;
    v_first_pool   text[];
    v_last_pool    text[];
    v_new_first    text;
    v_new_last     text;
    v_collides     boolean;
    v_lead_f       text;
    v_lead_l       text;
    v_dep_f        text;
    v_dep_l        text;
    v_count        int := 0;
BEGIN
    FOR v_party IN
        SELECT id, nation_id, created_at,
               leader_first_name, leader_last_name,
               deputy_first_name, deputy_last_name,
               whip_first_name,   whip_last_name
          FROM factions
         WHERE faction_type = 'movement_party'
           AND abandoned_at IS NULL
         ORDER BY nation_id, created_at ASC
    LOOP
        SELECT first_name_pool, last_name_pool
          INTO v_first_pool, v_last_pool
          FROM nations WHERE id = v_party.nation_id;
        IF v_first_pool IS NULL OR array_length(v_first_pool, 1) IS NULL
           OR v_last_pool IS NULL OR array_length(v_last_pool, 1) IS NULL THEN
            CONTINUE;
        END IF;

        -- Working copies of this party's officers — updated locally as
        -- we regenerate, so deputy collision check sees the (possibly
        -- regenerated) leader, and whip sees both.
        v_lead_f := v_party.leader_first_name;
        v_lead_l := v_party.leader_last_name;
        v_dep_f  := v_party.deputy_first_name;
        v_dep_l  := v_party.deputy_last_name;

        -- ─ Leader ─
        IF v_lead_f IS NOT NULL AND v_lead_l IS NOT NULL THEN
            SELECT EXISTS (
                SELECT 1 FROM factions f2
                 WHERE f2.nation_id   = v_party.nation_id
                   AND f2.faction_type = 'movement_party'
                   AND f2.abandoned_at IS NULL
                   AND f2.id          <> v_party.id
                   AND f2.created_at  <  v_party.created_at
                   AND (
                       (f2.leader_first_name = v_lead_f AND f2.leader_last_name = v_lead_l)
                    OR (f2.deputy_first_name = v_lead_f AND f2.deputy_last_name = v_lead_l)
                    OR (f2.whip_first_name   = v_lead_f AND f2.whip_last_name   = v_lead_l)
                   )
            ) INTO v_collides;
            IF v_collides THEN
                SELECT first_name, last_name INTO v_new_first, v_new_last
                  FROM pick_unique_pool_name_pair(v_first_pool, v_last_pool, v_party.nation_id);
                IF v_new_first IS NOT NULL THEN
                    UPDATE factions
                       SET leader_first_name = v_new_first,
                           leader_last_name  = v_new_last
                     WHERE id = v_party.id;
                    v_lead_f := v_new_first;
                    v_lead_l := v_new_last;
                    v_count  := v_count + 1;
                END IF;
            END IF;
        END IF;

        -- ─ Deputy ─ (vs older parties + this party's leader)
        IF v_dep_f IS NOT NULL AND v_dep_l IS NOT NULL THEN
            SELECT
                EXISTS (
                    SELECT 1 FROM factions f2
                     WHERE f2.nation_id   = v_party.nation_id
                       AND f2.faction_type = 'movement_party'
                       AND f2.abandoned_at IS NULL
                       AND f2.id          <> v_party.id
                       AND f2.created_at  <  v_party.created_at
                       AND (
                           (f2.leader_first_name = v_dep_f AND f2.leader_last_name = v_dep_l)
                        OR (f2.deputy_first_name = v_dep_f AND f2.deputy_last_name = v_dep_l)
                        OR (f2.whip_first_name   = v_dep_f AND f2.whip_last_name   = v_dep_l)
                       )
                )
                OR (v_lead_f = v_dep_f AND v_lead_l = v_dep_l)
                INTO v_collides;
            IF v_collides THEN
                SELECT first_name, last_name INTO v_new_first, v_new_last
                  FROM pick_unique_pool_name_pair(
                       v_first_pool, v_last_pool, v_party.nation_id,
                       ARRAY[v_lead_f]::text[],
                       ARRAY[v_lead_l]::text[]
                  );
                IF v_new_first IS NOT NULL THEN
                    UPDATE factions
                       SET deputy_first_name = v_new_first,
                           deputy_last_name  = v_new_last
                     WHERE id = v_party.id;
                    v_dep_f := v_new_first;
                    v_dep_l := v_new_last;
                    v_count := v_count + 1;
                END IF;
            END IF;
        END IF;

        -- ─ Whip ─ (vs older parties + this party's leader + deputy)
        IF v_party.whip_first_name IS NOT NULL AND v_party.whip_last_name IS NOT NULL THEN
            SELECT
                EXISTS (
                    SELECT 1 FROM factions f2
                     WHERE f2.nation_id   = v_party.nation_id
                       AND f2.faction_type = 'movement_party'
                       AND f2.abandoned_at IS NULL
                       AND f2.id          <> v_party.id
                       AND f2.created_at  <  v_party.created_at
                       AND (
                           (f2.leader_first_name = v_party.whip_first_name AND f2.leader_last_name = v_party.whip_last_name)
                        OR (f2.deputy_first_name = v_party.whip_first_name AND f2.deputy_last_name = v_party.whip_last_name)
                        OR (f2.whip_first_name   = v_party.whip_first_name AND f2.whip_last_name   = v_party.whip_last_name)
                       )
                )
                OR (v_lead_f = v_party.whip_first_name AND v_lead_l = v_party.whip_last_name)
                OR (v_dep_f  = v_party.whip_first_name AND v_dep_l  = v_party.whip_last_name)
                INTO v_collides;
            IF v_collides THEN
                SELECT first_name, last_name INTO v_new_first, v_new_last
                  FROM pick_unique_pool_name_pair(
                       v_first_pool, v_last_pool, v_party.nation_id,
                       ARRAY[v_lead_f, v_dep_f]::text[],
                       ARRAY[v_lead_l, v_dep_l]::text[]
                  );
                IF v_new_first IS NOT NULL THEN
                    UPDATE factions
                       SET whip_first_name = v_new_first,
                           whip_last_name  = v_new_last
                     WHERE id = v_party.id;
                    v_count := v_count + 1;
                END IF;
            END IF;
        END IF;
    END LOOP;
    RAISE NOTICE '20270659 backfill: regenerated % colliding officer name(s)', v_count;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
