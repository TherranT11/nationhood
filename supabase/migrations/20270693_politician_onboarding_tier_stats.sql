-- ════════════════════════════════════════════════════════════════════
-- 20270693 — Tier-based politician onboarding stats
--
-- New mechanic. When a user creates a politician via first-steps,
-- the starting stats depend on which population tier the chosen
-- nation falls into (across all nations on the shard, sorted by
-- active politician headcount):
--
--   Tier A — top third (MOST populated, densest scene):
--     basic starter — skill 1, reputation 1, capital 1, influence 1,
--     age 25. The thinking: a busy nation has lots of established
--     players already, so a fresh joiner climbs naturally without
--     a head start.
--
--   Tier B — middle third:
--     skill 20, reputation 10, capital 15, influence 50, age 45.
--     Skip a couple of career layers to land mid-pack.
--
--   Tier C — bottom third (LEAST populated, empty nation):
--     skill 30, reputation 20, capital 20, influence 80, age 50.
--     Maximum jumpstart to incentivise populating thin nations.
--
-- Algorithm:
--   • Sort every nations row DESC by active-politician count
--     (faction_type='politician' AND abandoned_at IS NULL). Tied
--     counts break by random() so identical headcounts at a tier
--     boundary don't deterministically pin one nation in the
--     lower tier each call.
--   • a_size = c_size = max(1, floor(N/3)). Middle absorbs any slack.
--   • Position 0..a_size-1            → Tier A
--     Position N-c_size..N-1          → Tier C
--     Else                            → Tier B
--   • N ≤ 1 collapses to Tier A. N = 2 splits A (busier) / C (emptier),
--     no B. Honours the user's "minimum 1 per tier" rule for N ≥ 3.
--
-- The function is SECURITY DEFINER and replaces first-steps.html's
-- direct factions.insert(). Moving the stat assignment to the server
-- closes the devtools-tampering surface and keeps tier logic in one
-- place. Existing politicians are not retro-bumped — forward-only
-- per the user's confirmation.
--
-- Apply after 20270692.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.create_politician_with_tier_stats(
    p_nation_id  uuid,
    p_first_name text,
    p_last_name  text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid        uuid := auth.uid();
    v_nation     nations%ROWTYPE;
    v_tick       int;
    v_existing   uuid;
    v_primary    uuid;
    v_is_linked  boolean;
    v_faction_id uuid;
    v_first      text;
    v_last       text;
    v_n          int;     -- total nations
    v_pos        int;     -- our nation's 0-based rank (0 = MOST populated)
    v_a_size     int;
    v_c_size     int;
    v_tier       text;
    v_age        int;
    v_skill      int;
    v_rep        int;
    v_cap        int;
    v_inf        int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    v_first := btrim(COALESCE(p_first_name, ''));
    v_last  := btrim(COALESCE(p_last_name,  ''));
    IF length(v_first) < 1 OR length(v_last) < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;

    SELECT * INTO v_nation FROM nations WHERE id = p_nation_id;
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_found');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- ── Already-owned politician in this nation guard ────────────
    -- Matches the 23505 the client used to surface — one politician
    -- per (owner, nation). Owner is auth.uid() either as the faction
    -- row id (legacy primary) or as linked_user_id (linked secondary).
    SELECT id INTO v_existing
      FROM factions
     WHERE faction_type = 'politician'
       AND nation_id    = p_nation_id
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid);
    IF v_existing IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_in_nation');
    END IF;

    -- ── Tier computation ─────────────────────────────────────────
    -- DESC sort with random tiebreak. Position 0 = most populated.
    WITH counts AS (
        SELECT n.id AS nation_id,
               COUNT(f.id) FILTER (
                   WHERE f.faction_type = 'politician'
                     AND f.abandoned_at IS NULL
               ) AS pol_count
          FROM nations n
          LEFT JOIN factions f ON f.nation_id = n.id
         GROUP BY n.id
    ),
    ranked AS (
        SELECT nation_id,
               ROW_NUMBER() OVER (ORDER BY pol_count DESC, random()) - 1 AS pos,
               COUNT(*)    OVER ()                                      AS total
          FROM counts
    )
    SELECT pos, total INTO v_pos, v_n
      FROM ranked WHERE nation_id = p_nation_id;

    IF v_n IS NULL OR v_n <= 1 THEN
        v_tier := 'A';
    ELSIF v_n = 2 THEN
        v_tier := CASE WHEN v_pos = 0 THEN 'A' ELSE 'C' END;
    ELSE
        v_a_size := GREATEST(1, FLOOR(v_n::numeric / 3.0)::int);
        v_c_size := GREATEST(1, FLOOR(v_n::numeric / 3.0)::int);
        IF v_pos < v_a_size THEN
            v_tier := 'A';
        ELSIF v_pos >= (v_n - v_c_size) THEN
            v_tier := 'C';
        ELSE
            v_tier := 'B';
        END IF;
    END IF;

    -- ── Stat block per tier ──────────────────────────────────────
    IF v_tier = 'A' THEN
        v_age := 25; v_skill := 1;  v_rep := 1;  v_cap := 1;  v_inf := 1;
    ELSIF v_tier = 'B' THEN
        v_age := 45; v_skill := 20; v_rep := 10; v_cap := 15; v_inf := 50;
    ELSE -- 'C'
        v_age := 50; v_skill := 30; v_rep := 20; v_cap := 20; v_inf := 80;
    END IF;

    -- ── Linked vs. primary path ─────────────────────────────────
    -- Mirrors first-steps.html's prior client logic. If auth.uid()
    -- already maps to a non-abandoned faction row id, this is a
    -- secondary politician → fresh UUID + linked_user_id = caller.
    -- Otherwise the new faction takes the legacy primary slot at
    -- id = auth.uid(). The primary slot may already exist as an
    -- abandoned row (user abandoned a previous faction and is now
    -- onboarding again), so the non-linked path uses ON CONFLICT
    -- (id) DO UPDATE to overwrite that row in place — same UPSERT
    -- semantics the old client relied on. Without this, the rejoin
    -- flow would 23505 on the primary key and surface the wrong
    -- error.
    SELECT id INTO v_primary FROM factions
     WHERE id = v_uid AND abandoned_at IS NULL
     LIMIT 1;
    v_is_linked  := v_primary IS NOT NULL;
    v_faction_id := CASE WHEN v_is_linked THEN gen_random_uuid() ELSE v_uid END;

    BEGIN
        IF v_is_linked THEN
            INSERT INTO factions (
                id, faction_type, faction_name,
                nation_id, nation,
                seats, action_points, party_funds,
                abandoned_at,
                leader_first_name, leader_last_name, leader_age,
                founded_tick,
                politician_skill, politician_reputation,
                politician_capital, politician_influence,
                linked_user_id
            ) VALUES (
                v_faction_id, 'politician',
                v_first || ' ' || v_last,
                p_nation_id, v_nation.name,
                0, 0, 0,
                NULL,
                v_first, v_last, v_age,
                v_tick,
                v_skill, v_rep,
                v_cap, v_inf,
                v_uid
            );
        ELSE
            INSERT INTO factions (
                id, faction_type, faction_name,
                nation_id, nation,
                seats, action_points, party_funds,
                abandoned_at,
                leader_first_name, leader_last_name, leader_age,
                founded_tick,
                politician_skill, politician_reputation,
                politician_capital, politician_influence,
                linked_user_id
            ) VALUES (
                v_faction_id, 'politician',
                v_first || ' ' || v_last,
                p_nation_id, v_nation.name,
                0, 0, 0,
                NULL,
                v_first, v_last, v_age,
                v_tick,
                v_skill, v_rep,
                v_cap, v_inf,
                NULL
            )
            ON CONFLICT (id) DO UPDATE SET
                faction_type          = EXCLUDED.faction_type,
                faction_name          = EXCLUDED.faction_name,
                nation_id             = EXCLUDED.nation_id,
                nation                = EXCLUDED.nation,
                seats                 = EXCLUDED.seats,
                action_points         = EXCLUDED.action_points,
                party_funds           = EXCLUDED.party_funds,
                abandoned_at          = NULL,
                leader_first_name     = EXCLUDED.leader_first_name,
                leader_last_name      = EXCLUDED.leader_last_name,
                leader_age            = EXCLUDED.leader_age,
                founded_tick          = EXCLUDED.founded_tick,
                politician_skill      = EXCLUDED.politician_skill,
                politician_reputation = EXCLUDED.politician_reputation,
                politician_capital    = EXCLUDED.politician_capital,
                politician_influence  = EXCLUDED.politician_influence,
                linked_user_id        = NULL;
        END IF;
    EXCEPTION WHEN unique_violation THEN
        -- Concurrent join on the same (owner, nation) by the same
        -- user — re-emit the friendly reason instead of bubbling
        -- a raw 23505. (The legacy-primary path is UPSERT so it
        -- can't hit a PK conflict; only the cross-row uniqueness
        -- constraint can fire here.)
        RETURN jsonb_build_object('success', false, 'reason', 'already_in_nation');
    END;

    RETURN jsonb_build_object(
        'success',    true,
        'faction_id', v_faction_id
    );
END $$;

GRANT EXECUTE ON FUNCTION public.create_politician_with_tier_stats(uuid, text, text) TO authenticated;

COMMENT ON FUNCTION public.create_politician_with_tier_stats(uuid, text, text) IS
    'Onboards a new politician with tier-based starting stats (20270693). Sorts nations DESC by active-politician headcount with random tiebreak: Tier A = top third (busy, basic stats), Tier B = middle, Tier C = bottom third (empty, biggest jumpstart). Replaces first-steps.html''s direct factions.insert() so stat assignment can''t be tampered with from the client.';

NOTIFY pgrst, 'reload schema';

COMMIT;
