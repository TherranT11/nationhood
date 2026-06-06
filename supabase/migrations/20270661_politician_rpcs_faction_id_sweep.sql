-- ════════════════════════════════════════════════════════════════════
-- 20270661 — Politician RPC faction_id sweep
--
-- Closes the bug class flagged in 20270643's header — every arg-less
-- politician RPC that grades the caller via:
--
--   SELECT * INTO v_pol FROM factions
--    WHERE (id = v_uid OR linked_user_id = v_uid)
--      AND faction_type = 'politician' AND abandoned_at IS NULL
--    ORDER BY created_at ASC LIMIT 1;
--
-- breaks on multi-politician accounts (Renata on apply_for_committee →
-- 20270658; Sofia on politician_register_for_office → this sweep).
-- The career page reads politician_office off the active ctx.faction
-- row, but the server grades whichever sibling was created first.
--
-- 20270643 (read_statute_books) and 20270658 (apply_for_committee)
-- did the per-RPC port. This sweep closes the remaining ten
-- user-visible action RPCs in one batch so every CC member /
-- CCP / civil servant / advocate path on a multi-politician account
-- finally agrees with what the page is showing.
--
-- Pattern per function (identical to 20270643 / 20270658):
--   1. DROP the old signature so any stale caller fails loud rather
--      than silently grading the wrong row.
--   2. Add p_faction_id uuid as the FIRST argument.
--   3. Replace the SELECT block with the id-based lookup +
--      ownership guard:
--
--        SELECT * INTO v_pol FROM factions
--         WHERE id = p_faction_id
--           AND faction_type = 'politician'
--           AND abandoned_at IS NULL
--           AND (id = v_uid OR linked_user_id = v_uid)
--         [FOR UPDATE];
--
--   4. Where the old SELECT also constrained politician_party_id or
--      politician_ministry, those checks move INTO the function body
--      as a separate IF after the lookup so the existing 'not_member' /
--      'not_civil_servant' reason codes still fire.
--   5. Everything else byte-identical to the latest emission.
--
-- Functions swept (10 total):
--   politician_door_knock              ← 20270653 body
--   politician_give_speech             ← 20270652 body
--   politician_file_a_memo             ← 20270650 body
--   politician_register_for_office     ← 20270654 body (Sofia's bug)
--   politician_resign_office           ← 20270646 body
--   politician_mobilize_volunteers     ← 20270646 body
--   politician_build_the_base          ← 20270646 body
--   politician_lobby_minister          ← 20270646 body
--   politician_run_political_ads       ← 20270646 body
--   politician_apply_for_promotion     ← 20270634 body
--
-- Still in scope for a future sweep (per the 20270643 flag): every
-- paperwork/committee/hearing/testimony RPC that takes other args
-- but still uses the oldest-first selector internally. They don't
-- block Sofia today; they'll bite when she touches that surface.
--
-- Client wrappers updated in lockstep — politician-home.html
-- dispatcher always passes p_faction_id; politician-career.html
-- callers thread the active politician's id through; the
-- handleResignOffice / handleApplyForPromotion paths read
-- ctx.faction.id.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ════════════════════════════════════════════════════════════════════
-- 1. politician_door_knock(p_party_id, p_faction_id)
-- ════════════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public.politician_door_knock(uuid);

CREATE OR REPLACE FUNCTION public.politician_door_knock(
    p_party_id   uuid,
    p_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid           uuid := auth.uid();
    v_pol           factions%ROWTYPE;
    v_tick          int;
    v_roll          int;
    v_inf           numeric;
    v_total         numeric;
    v_pop_delta     numeric;
    v_new_pop       numeric;
    v_next          int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_party_id IS DISTINCT FROM p_party_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    IF v_pol.next_member_action_tick IS NOT NULL
       AND v_pol.next_member_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_member_action_tick);
    END IF;

    v_roll  := 1 + floor(random() * 6)::int;
    v_inf   := COALESCE(v_pol.politician_influence, 0);
    v_total := v_roll + v_inf;

    -- 20270653: <= 1 (not < 2) so fractional totals like 1.5 land in
    -- the +0.2 bracket. Any non-zero Influence is now immunity.
    v_pop_delta := CASE
        WHEN v_total <= 1 THEN -0.2
        WHEN v_total <  6 THEN  0.2
        ELSE                    0.3
    END;

    UPDATE factions
       SET popularity_pct = LEAST(COALESCE(popularity_cap_pct, 100),
                                  GREATEST(0, COALESCE(popularity_pct, 0) + v_pop_delta))
     WHERE id = p_party_id
       AND faction_type = 'movement_party'
       AND abandoned_at IS NULL
    RETURNING popularity_pct INTO v_new_pop;

    IF v_new_pop IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'party_not_found');
    END IF;

    v_next := v_tick + 1;
    UPDATE factions
       SET next_member_action_tick = v_next
     WHERE id = v_pol.id;

    RETURN jsonb_build_object(
        'success',                 true,
        'action',                  'door_knock',
        'roll',                    v_roll,
        'influence_used',          v_inf,
        'total',                   v_total,
        'popularity_delta',        v_pop_delta,
        'new_popularity',          v_new_pop,
        'next_member_action_tick', v_next
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_door_knock(uuid, uuid) TO authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 2. politician_give_speech(p_party_id, p_faction_id)
-- ════════════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public.politician_give_speech(uuid);

CREATE OR REPLACE FUNCTION public.politician_give_speech(
    p_party_id   uuid,
    p_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    SPEECH_COST CONSTANT numeric := 50000;
    REP_DELTA   CONSTANT numeric := 0.3;
    v_uid        uuid := auth.uid();
    v_pol        factions%ROWTYPE;
    v_party      factions%ROWTYPE;
    v_tick       int;
    v_next       int;
    v_funds_after numeric;
    v_new_rep    numeric;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_party_id IS DISTINCT FROM p_party_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    IF v_pol.next_member_action_tick IS NOT NULL
       AND v_pol.next_member_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_member_action_tick);
    END IF;

    SELECT * INTO v_party FROM factions
     WHERE id = p_party_id
       AND faction_type = 'movement_party'
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_party.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'party_not_found');
    END IF;

    IF COALESCE(v_party.party_funds, 0) < SPEECH_COST THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_party_funds',
            'have', COALESCE(v_party.party_funds, 0), 'need', SPEECH_COST);
    END IF;

    v_next := v_tick + 1;

    UPDATE factions
       SET party_funds = COALESCE(party_funds, 0) - SPEECH_COST
     WHERE id = p_party_id
    RETURNING party_funds INTO v_funds_after;

    UPDATE factions
       SET politician_reputation  = COALESCE(politician_reputation, 0) + REP_DELTA,
           next_member_action_tick = v_next
     WHERE id = v_pol.id
    RETURNING politician_reputation INTO v_new_rep;

    RETURN jsonb_build_object(
        'success',                 true,
        'action',                  'speech',
        'cost',                    SPEECH_COST,
        'party_funds_after',       v_funds_after,
        'reputation_delta',        REP_DELTA,
        'new_reputation',          v_new_rep,
        'next_member_action_tick', v_next
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_give_speech(uuid, uuid) TO authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 3. politician_file_a_memo(p_faction_id)
-- ════════════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public.politician_file_a_memo();

CREATE OR REPLACE FUNCTION public.politician_file_a_memo(
    p_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_new_skill numeric;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_ministry IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_civil_servant');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF v_pol.next_civil_service_action_tick IS NOT NULL
       AND v_pol.next_civil_service_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_civil_service_action_tick);
    END IF;

    UPDATE factions
       SET politician_skill                = COALESCE(politician_skill, 0) + 0.5,
           next_civil_service_action_tick  = v_tick + 1
     WHERE id = v_pol.id
    RETURNING politician_skill INTO v_new_skill;

    RETURN jsonb_build_object(
        'success',           true,
        'action',            'file_a_memo',
        'skill_delta',       0.5,
        'new_skill',         v_new_skill,
        'next_action_tick',  v_tick + 1
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_file_a_memo(uuid) TO authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 4. politician_register_for_office(p_faction_id, p_target_office)
--    — Sofia's bug
-- ════════════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public.politician_register_for_office(text);

CREATE OR REPLACE FUNCTION public.politician_register_for_office(
    p_faction_id    uuid,
    p_target_office text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_pol          factions%ROWTYPE;
    v_tick         int;
    v_shard_id     uuid;
    v_first_pool   text[];
    v_last_pool    text[];
    v_opp_first    text;
    v_opp_last     text;
    v_opp_stat     int;
    v_your_stat    int;
    v_race_tier    text;
    v_resolve      int;
    v_next_elect   int;
    v_won_at       int;
    v_player_share numeric;
    v_poll_you     int;
    v_poll_opp     int;
    v_poll_und     int;
    v_next_action  int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_target_office NOT IN ('city_council_member', 'senior_mp', 'city_council_president') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_target_office');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid);
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_party_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_in_party');
    END IF;
    IF v_pol.nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_nation');
    END IF;

    SELECT current_tick, id INTO v_tick, v_shard_id FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    IF EXISTS (SELECT 1 FROM politician_active_election WHERE politician_id = v_pol.id) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'race_in_progress');
    END IF;

    IF p_target_office = 'city_council_member' THEN
        IF v_pol.politician_office <> 'community_organizer'
           AND COALESCE(v_pol.politician_former_community_organizer, FALSE) IS NOT TRUE THEN
            RETURN jsonb_build_object('success', false, 'reason', 'wrong_current_office',
                'have', v_pol.politician_office, 'expected', 'community_organizer_now_or_past');
        END IF;
        IF v_pol.politician_office = 'community_organizer' THEN
            v_won_at := COALESCE(v_pol.politician_office_won_at_tick, v_tick);
            IF v_tick < v_won_at + 9 THEN
                RETURN jsonb_build_object('success', false, 'reason', 'too_early',
                    'opens_at_tick', v_won_at + 9, 'current_tick', v_tick);
            END IF;
        END IF;
        v_race_tier := 'city_council';
        v_your_stat := COALESCE(v_pol.politician_skill, 1);
        v_opp_stat  := 2 + floor(random() * 3)::int;
        v_resolve   := v_tick + 1;

    ELSIF p_target_office = 'city_council_president' THEN
        IF v_pol.politician_office <> 'city_council_member' THEN
            RETURN jsonb_build_object('success', false, 'reason', 'wrong_current_office',
                'have', v_pol.politician_office, 'expected', 'city_council_member');
        END IF;
        v_won_at := COALESCE(v_pol.politician_office_won_at_tick, v_tick);
        IF v_tick < v_won_at + 9 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'too_early',
                'opens_at_tick', v_won_at + 9, 'current_tick', v_tick);
        END IF;
        v_race_tier := 'city_council_president';
        v_your_stat := COALESCE(v_pol.politician_skill, 1);
        v_opp_stat  := 1 + floor(random() * 6)::int + 1;
        v_resolve   := v_tick + 1;

    ELSE  -- senior_mp
        IF v_pol.politician_office <> 'member_of_parliament' THEN
            RETURN jsonb_build_object('success', false, 'reason', 'wrong_current_office',
                'have', v_pol.politician_office, 'expected', 'member_of_parliament');
        END IF;
        SELECT next_election_tick INTO v_next_elect FROM nations WHERE id = v_pol.nation_id;
        IF v_next_elect IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'no_general_election');
        END IF;
        IF v_tick < v_next_elect - 3 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'too_early',
                'opens_at_tick', v_next_elect - 3, 'current_tick', v_tick);
        END IF;
        IF v_tick > v_next_elect THEN
            RETURN jsonb_build_object('success', false, 'reason', 'window_closed',
                'last_open_tick', v_next_elect);
        END IF;
        v_race_tier := 'senior_mp';
        v_your_stat := COALESCE(v_pol.politician_skill, 1);
        v_opp_stat  := 1 + floor(random() * 6)::int;
        v_resolve   := v_next_elect;
    END IF;

    SELECT first_name_pool, last_name_pool INTO v_first_pool, v_last_pool
      FROM nations WHERE id = v_pol.nation_id;
    v_opp_first := COALESCE(pick_random_pool_name(v_first_pool), 'Opponent');
    v_opp_last  := COALESCE(pick_random_pool_name(v_last_pool),  'Smith');

    v_player_share := v_your_stat::numeric / GREATEST(1, v_your_stat + v_opp_stat);
    v_poll_you     := ROUND(v_player_share * 85)::int;
    v_poll_opp     := 85 - v_poll_you;
    v_poll_und     := 15;

    INSERT INTO politician_active_election (
        politician_id, shard_id, race_tier, district,
        opp_first, opp_last, opp_blurb, opp_party_name,
        your_stat, opp_stat, win_odds_pct, stake_win, stake_lose,
        resolve_tick,
        polling_you_pct, polling_opp_pct, polling_undecided_pct,
        party_id
    ) VALUES (
        v_pol.id, v_shard_id, v_race_tier,
        CASE v_race_tier
            WHEN 'city_council'           THEN 'City Council seat'
            WHEN 'city_council_president' THEN 'City Council Presidency'
            WHEN 'senior_mp'              THEN 'Senior MP slot'
        END,
        v_opp_first, v_opp_last,
        CASE v_race_tier
            WHEN 'city_council'           THEN 'Independent challenger for the council seat'
            WHEN 'city_council_president' THEN 'Independent contender for the council chair'
            WHEN 'senior_mp'              THEN 'Independent contender for the Senior MP nomination'
        END,
        NULL,
        v_your_stat, v_opp_stat,
        GREATEST(1, LEAST(99, v_poll_you)),
        CASE v_race_tier
            WHEN 'city_council'           THEN 2
            WHEN 'city_council_president' THEN 3
            ELSE                                4
        END,
        CASE v_race_tier
            WHEN 'city_council'           THEN 0
            WHEN 'city_council_president' THEN 0
            ELSE                                -3
        END,
        v_resolve,
        v_poll_you, v_poll_opp, v_poll_und,
        v_pol.politician_party_id
    );

    v_next_action := v_tick + 1;
    UPDATE factions SET next_member_action_tick = v_next_action WHERE id = v_pol.id;

    INSERT INTO politician_career_events (
        faction_id, event_tick, event_type, target_name, metadata
    ) VALUES (
        v_pol.id, v_tick, 'stood_for_election',
        CASE v_race_tier
            WHEN 'city_council'           THEN 'City Council seat'
            WHEN 'city_council_president' THEN 'City Council Presidency'
            ELSE                                'Senior MP slot'
        END,
        jsonb_build_object(
            'race_tier',      v_race_tier,
            'your_stat',      v_your_stat,
            'opp_stat',       v_opp_stat,
            'opponent',       v_opp_first || ' ' || v_opp_last,
            'resolve_tick',   v_resolve,
            'polling_you',    v_poll_you,
            'polling_opp',    v_poll_opp,
            'polling_und',    v_poll_und
        )
    );

    RETURN jsonb_build_object(
        'success',                true,
        'target_office',          p_target_office,
        'opponent',               v_opp_first || ' ' || v_opp_last,
        'resolve_tick',           v_resolve,
        'your_stat',              v_your_stat,
        'opp_stat',               v_opp_stat,
        'win_odds_pct',           GREATEST(1, LEAST(99, v_poll_you)),
        'next_member_action_tick',v_next_action
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_register_for_office(uuid, text) TO authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 5. politician_resign_office(p_faction_id)
-- ════════════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public.politician_resign_office();

CREATE OR REPLACE FUNCTION public.politician_resign_office(
    p_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_pol          factions%ROWTYPE;
    v_party        factions%ROWTYPE;
    v_tick         int;
    v_office       text;
    v_office_label text;
    v_new_cap      int;
    v_new_pop      numeric;
    v_new_seats    int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_office IS NULL THEN
        RETURN jsonb_build_object('success', true, 'already_resigned', true);
    END IF;

    v_office       := v_pol.politician_office;
    v_office_label := CASE v_office
        WHEN 'community_organizer'    THEN 'Community Organizer'
        WHEN 'city_council_member'    THEN 'City Council Member'
        WHEN 'city_council_president' THEN 'City Council President'
        WHEN 'member_of_parliament'   THEN 'Member of Parliament'
        WHEN 'senior_mp'              THEN 'Senior MP'
        ELSE initcap(replace(v_office, '_', ' '))
    END;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE factions
       SET politician_influence         = GREATEST(0, COALESCE(politician_influence, 0) - 2),
           politician_office            = NULL,
           politician_office_won_at_tick = NULL
     WHERE id = v_pol.id
    RETURNING politician_influence INTO v_new_cap;

    IF v_pol.politician_party_id IS NOT NULL THEN
        SELECT * INTO v_party FROM factions WHERE id = v_pol.politician_party_id FOR UPDATE;
        IF v_party.id IS NOT NULL THEN
            UPDATE factions
               SET popularity_pct = GREATEST(0, COALESCE(popularity_pct, 0) - 2)
             WHERE id = v_party.id
            RETURNING popularity_pct INTO v_new_pop;

            IF v_office IN ('member_of_parliament', 'senior_mp') THEN
                UPDATE factions
                   SET seats = GREATEST(0, COALESCE(seats, 0) - 1)
                 WHERE id = v_party.id
                   AND faction_type = 'movement_party'
                   AND abandoned_at IS NULL
                RETURNING seats INTO v_new_seats;
            END IF;
        END IF;
    END IF;

    INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name, metadata)
    VALUES (v_pol.id, v_tick, 'resigned_office', v_office_label,
            '{"seats_decremented": true}'::jsonb);

    RETURN jsonb_build_object(
        'success',               true,
        'office',                v_office_label,
        'new_political_capital', v_new_cap,
        'new_party_popularity',  v_new_pop,
        'new_party_seats',       v_new_seats
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_resign_office(uuid) TO authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 6. politician_mobilize_volunteers(p_party_id, p_faction_id)
-- ════════════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public.politician_mobilize_volunteers(uuid);

CREATE OR REPLACE FUNCTION public.politician_mobilize_volunteers(
    p_party_id   uuid,
    p_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid           uuid := auth.uid();
    v_pol           factions%ROWTYPE;
    v_tick          int;
    v_volunteers    int;
    v_pop_delta     numeric;
    v_new_capital   numeric;
    v_new_pop       numeric;
    v_party_name    text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_party_id IS DISTINCT FROM p_party_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;
    IF v_pol.politician_office IS DISTINCT FROM 'city_council_member' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_city_council');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;
    IF v_pol.next_local_action_tick IS NOT NULL
       AND v_pol.next_local_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_local_action_tick);
    END IF;

    v_volunteers := COALESCE(v_pol.volunteers, 0);
    IF v_volunteers < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_volunteers');
    END IF;
    IF COALESCE(v_pol.politician_capital, 0) < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_capital',
            'have', COALESCE(v_pol.politician_capital, 0), 'need', 1);
    END IF;

    v_pop_delta := 0.05 * v_volunteers;

    UPDATE factions
       SET politician_capital       = GREATEST(0, COALESCE(politician_capital, 0) - 1),
           next_local_action_tick   = v_tick + 1
     WHERE id = v_pol.id
    RETURNING politician_capital INTO v_new_capital;

    UPDATE factions
       SET popularity_pct = LEAST(popularity_cap_pct,
                                  GREATEST(0, COALESCE(popularity_pct, 0) + v_pop_delta))
     WHERE id = p_party_id
       AND faction_type = 'movement_party'
       AND abandoned_at IS NULL
    RETURNING popularity_pct, faction_name INTO v_new_pop, v_party_name;

    RETURN jsonb_build_object(
        'success',         true,
        'action',          'mobilize_volunteers',
        'volunteers',      v_volunteers,
        'popularity_delta', v_pop_delta,
        'new_popularity',  v_new_pop,
        'new_capital',     v_new_capital,
        'party_name',      v_party_name,
        'next_action_tick', v_tick + 1
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_mobilize_volunteers(uuid, uuid) TO authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 7. politician_build_the_base(p_party_id, p_faction_id)
-- ════════════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public.politician_build_the_base(uuid);

CREATE OR REPLACE FUNCTION public.politician_build_the_base(
    p_party_id   uuid,
    p_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid           uuid := auth.uid();
    v_pol           factions%ROWTYPE;
    v_tick          int;
    v_roll          int;
    v_cap_delta     int := 0;
    v_new_capital   numeric;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_party_id IS DISTINCT FROM p_party_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;
    IF v_pol.politician_office IS DISTINCT FROM 'city_council_member' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_city_council');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;
    IF v_pol.next_local_action_tick IS NOT NULL
       AND v_pol.next_local_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_local_action_tick);
    END IF;

    v_roll := 1 + floor(random() * 6)::int;
    IF v_roll = 6 THEN
        v_cap_delta := 2;
    ELSIF v_roll >= 2 THEN
        v_cap_delta := 1;
    END IF;

    UPDATE factions
       SET politician_capital       = COALESCE(politician_capital, 0) + v_cap_delta,
           next_local_action_tick   = v_tick + 1
     WHERE id = v_pol.id
    RETURNING politician_capital INTO v_new_capital;

    RETURN jsonb_build_object(
        'success',         true,
        'action',          'build_the_base',
        'roll',            v_roll,
        'capital_delta',   v_cap_delta,
        'new_capital',     v_new_capital,
        'next_action_tick', v_tick + 1
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_build_the_base(uuid, uuid) TO authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 8. politician_lobby_minister(p_party_id, p_faction_id)
-- ════════════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public.politician_lobby_minister(uuid);

CREATE OR REPLACE FUNCTION public.politician_lobby_minister(
    p_party_id   uuid,
    p_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid             uuid := auth.uid();
    v_pol             factions%ROWTYPE;
    v_tick            int;
    v_roll            int;
    v_ministry_roll   int;
    v_ministry_slug   text;
    v_ministry_name   text;
    v_capital_delta   int := 0;
    v_rep_delta       numeric := 0;
    v_vol_delta       int := 0;
    v_inf_delta       int := -1;
    v_bracket         text;
    v_new_capital     numeric;
    v_new_influence   numeric;
    v_new_rep         numeric;
    v_new_volunteers  int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_party_id IS DISTINCT FROM p_party_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;
    IF v_pol.politician_office IS DISTINCT FROM 'city_council_member' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_city_council');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;
    IF v_pol.next_local_action_tick IS NOT NULL
       AND v_pol.next_local_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_local_action_tick);
    END IF;
    IF v_pol.next_lobby_minister_tick IS NOT NULL
       AND v_pol.next_lobby_minister_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'lobby_cooldown',
            'ready_at_tick', v_pol.next_lobby_minister_tick);
    END IF;
    IF COALESCE(v_pol.politician_influence, 0) < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_influence',
            'have', COALESCE(v_pol.politician_influence, 0), 'need', 1);
    END IF;

    v_ministry_roll := 1 + floor(random() * 4)::int;
    v_ministry_slug := CASE v_ministry_roll
        WHEN 1 THEN 'defense'
        WHEN 2 THEN 'foreign_affairs'
        WHEN 3 THEN 'economic_development'
        WHEN 4 THEN 'interior'
    END;
    v_ministry_name := CASE v_ministry_roll
        WHEN 1 THEN 'Defense'
        WHEN 2 THEN 'Foreign Affairs & Trade'
        WHEN 3 THEN 'Economic Development'
        WHEN 4 THEN 'Interior'
    END;

    v_roll := 1 + floor(random() * 6)::int;
    IF v_roll = 1 THEN
        v_bracket := 'rebuffed';
        v_rep_delta := -1;
        v_vol_delta := -1;
    ELSIF v_roll >= 5 THEN
        v_bracket := 'delivered';
        v_capital_delta := 1;
        v_rep_delta := 1;
    ELSE
        v_bracket := 'null_result';
    END IF;

    UPDATE factions
       SET politician_influence         = GREATEST(0, COALESCE(politician_influence, 0) + v_inf_delta),
           politician_capital           = COALESCE(politician_capital, 0)         + v_capital_delta,
           politician_reputation        = GREATEST(0, COALESCE(politician_reputation, 0) + v_rep_delta),
           volunteers                   = GREATEST(0, COALESCE(volunteers, 0) + v_vol_delta),
           next_local_action_tick       = v_tick + 1,
           next_lobby_minister_tick     = v_tick + 3
     WHERE id = v_pol.id
    RETURNING politician_capital, politician_influence, politician_reputation, volunteers
        INTO v_new_capital, v_new_influence, v_new_rep, v_new_volunteers;

    RETURN jsonb_build_object(
        'success',           true,
        'action',            'lobby_minister',
        'roll',              v_roll,
        'bracket',           v_bracket,
        'ministry',          v_ministry_slug,
        'ministry_name',     v_ministry_name,
        'capital_delta',     v_capital_delta,
        'reputation_delta',  v_rep_delta,
        'influence_delta',   v_inf_delta,
        'volunteer_delta',   v_vol_delta,
        'new_capital',       v_new_capital,
        'new_influence',     v_new_influence,
        'new_reputation',    v_new_rep,
        'new_volunteers',    v_new_volunteers,
        'next_action_tick',          v_tick + 1,
        'next_lobby_minister_tick',  v_tick + 3
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_lobby_minister(uuid, uuid) TO authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 9. politician_run_political_ads(p_party_id, p_faction_id)
-- ════════════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public.politician_run_political_ads(uuid);

CREATE OR REPLACE FUNCTION public.politician_run_political_ads(
    p_party_id   uuid,
    p_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    AD_COST    CONSTANT int := 1;
    FLAT_BONUS CONSTANT int := 6;
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_roll      int;
    v_total     int;
    v_race      politician_active_election%ROWTYPE;
    v_und_take  int;
    v_opp_take  int;
    v_new_cap   int;
    v_next      int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_party_id IS DISTINCT FROM p_party_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    IF v_pol.next_member_action_tick IS NOT NULL
       AND v_pol.next_member_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_member_action_tick);
    END IF;

    IF COALESCE(v_pol.politician_capital, 0) < AD_COST THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_capital',
            'required', AD_COST,
            'have',     COALESCE(v_pol.politician_capital, 0));
    END IF;

    v_roll  := 1 + floor(random() * 10)::int;
    v_total := v_roll + FLAT_BONUS;
    v_next  := v_tick + 1;

    UPDATE factions
       SET politician_capital   = GREATEST(0, COALESCE(politician_capital, 0) - AD_COST),
           next_member_action_tick = v_next
     WHERE id = v_pol.id
    RETURNING politician_capital INTO v_new_cap;

    SELECT * INTO v_race FROM politician_active_election WHERE politician_id = v_pol.id;
    IF v_race.politician_id IS NOT NULL THEN
        v_und_take := LEAST(v_total, v_race.polling_undecided_pct);
        v_opp_take := v_total - v_und_take;
        UPDATE politician_active_election
           SET polling_you_pct       = LEAST(100, polling_you_pct + v_total),
               polling_undecided_pct = polling_undecided_pct - v_und_take,
               polling_opp_pct       = GREATEST(0, polling_opp_pct - v_opp_take)
         WHERE politician_id = v_pol.id;
    END IF;

    RETURN jsonb_build_object(
        'success',                 true,
        'action',                  'run_political_ads',
        'roll',                    v_roll,
        'polling_delta',           v_total,
        'cost',                    AD_COST,
        'politician_capital',      v_new_cap,
        'next_member_action_tick', v_next,
        'has_active_race',         v_race.politician_id IS NOT NULL
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_run_political_ads(uuid, uuid) TO authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 10. politician_apply_for_promotion(p_faction_id, p_agency_key)
-- ════════════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public.politician_apply_for_promotion(text);

CREATE OR REPLACE FUNCTION public.politician_apply_for_promotion(
    p_faction_id uuid,
    p_agency_key text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_pol     factions%ROWTYPE;
    v_tick    int;
    v_agency  text := NULLIF(btrim(p_agency_key), '');
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF v_agency IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_agency');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_ministry IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_civil_servant');
    END IF;
    IF v_pol.politician_senior_civil_servant_at_tick IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_senior');
    END IF;

    IF COALESCE(v_pol.politician_skill, 0) < 10 THEN
        RETURN jsonb_build_object(
            'success', false,
            'reason',  'insufficient_skill',
            'have',    COALESCE(v_pol.politician_skill, 0),
            'need',    10
        );
    END IF;

    IF NOT public._paperwork_valid_ministry_agency(v_pol.politician_ministry, v_agency) THEN
        RETURN jsonb_build_object(
            'success',  false,
            'reason',   'invalid_agency',
            'ministry', v_pol.politician_ministry,
            'agency',   v_agency
        );
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE factions
       SET politician_senior_civil_servant_at_tick = v_tick,
           politician_agency_head_of               = v_agency
     WHERE id = v_pol.id;

    INSERT INTO politician_career_events
        (faction_id, event_tick, event_type, target_name)
    VALUES
        (v_pol.id, v_tick, 'promoted_senior_civil_servant',
         'Agency Head · ' || v_agency);

    RETURN jsonb_build_object(
        'success',     true,
        'action',      'apply_for_promotion',
        'promoted_at', v_tick,
        'agency',      v_agency,
        'skill',       v_pol.politician_skill
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_apply_for_promotion(uuid, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
