-- ════════════════════════════════════════════════════════════════════
-- 20270664 — Senior MP: full-term requirement + 6-tick window
--
-- User direction (Reading B): Senior MP is a promotion, not an
-- instant Tier-2 jump available the moment the first general
-- election window opens. The player must have *served* at least one
-- full parliamentary term as MP before becoming eligible. The
-- window for registration is also widened from 3 → 6 ticks before
-- the next general election — players have a longer runway.
--
-- Re-emits politician_register_for_office (last in 20270661, the
-- faction_id sweep). Only the senior_mp branch changes:
--
--   • New gate after the wrong_current_office check: read
--     parliamentary_term_ticks from nations (default 24, matching
--     GAME_CONFIG.PARLIAMENTARY_TERM_TICKS in js/game/config.js).
--     Reject with reason 'term_too_short' when current_tick <
--     politician_office_won_at_tick + parliamentary_term_ticks.
--
--   • Window widens: 3 → 6 ticks before next_election_tick.
--
-- politician_office_won_at_tick is the timestamp politician_resolve_
-- due_elections sets on every parliament win (re-verified — that
-- RPC writes v_tick into politician_office_won_at_tick whenever
-- race_tier IN ('parliament', 'senior_mp') resolves a win). Party-
-- allocated MP re-seating at general elections does NOT touch this
-- column (general-election bookkeeping runs through a separate path
-- that leaves politician_office_won_at_tick at the original Stand-
-- for-Election tick), so "served a full term" reads back as
-- "current_tick - won_at_tick >= parliamentary_term_ticks" — exactly
-- the user's spec.
--
-- Client wrappers updated in lockstep — politician-topbar.js fetches
-- parliamentary_term_ticks; politician-career.html's buildLadderState
-- exposes it as parliamentaryTermTicks; the senior_mp rung's
-- actionIfNot mirrors the new server gate; the register-senior-mp
-- click handler's reason map gets a 'term_too_short' line.
--
-- Body otherwise byte-identical to 20270661.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

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
    v_term_ticks   int;
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
        -- 20270664: Senior MP is a promotion. Read the nation's
        -- parliamentary_term_ticks (default 24 per GAME_CONFIG) along
        -- with next_election_tick in one round trip.
        SELECT next_election_tick, COALESCE(parliamentary_term_ticks, 24)
          INTO v_next_elect, v_term_ticks
          FROM nations WHERE id = v_pol.nation_id;
        IF v_next_elect IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'no_general_election');
        END IF;
        -- Full-term requirement: must have served at least one full
        -- parliamentary term as MP. politician_office_won_at_tick
        -- carries the original Stand-for-Election win tick (general-
        -- election re-seating doesn't reset it).
        IF v_pol.politician_office_won_at_tick IS NULL
           OR v_tick < v_pol.politician_office_won_at_tick + v_term_ticks THEN
            RETURN jsonb_build_object('success', false, 'reason', 'term_too_short',
                'won_at',           v_pol.politician_office_won_at_tick,
                'term_ticks',       v_term_ticks,
                'eligible_at_tick', COALESCE(v_pol.politician_office_won_at_tick, 0) + v_term_ticks,
                'current_tick',     v_tick);
        END IF;
        -- 20270664: window widened 3 → 6 ticks before next election.
        IF v_tick < v_next_elect - 6 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'too_early',
                'opens_at_tick', v_next_elect - 6, 'current_tick', v_tick);
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

NOTIFY pgrst, 'reload schema';

COMMIT;
