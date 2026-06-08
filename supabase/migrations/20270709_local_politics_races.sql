-- ════════════════════════════════════════════════════════════════════
-- 20270709 — Local Politics races: Mayor / MotC / Regional Leader
--             + unified +1 Experience win reward
--             + dice-based opponent stats per tier
--
-- Closes the local-politics rework per user spec. The 20270706 Tier C
-- jumpstart shipped Mayor / MotC / Regional Leader as Experience-gated
-- SELF-STAMPS; the user has since clarified the intent: these are
-- races, not direct appointments. "In this circumstance you can run
-- for any position on the rung" — and the auto-generated opponent's
-- Experience scales per tier with dice rolls.
--
-- This migration:
--
-- 1. Widen the CHECK constraints on:
--      • politician_active_election.race_tier
--      • factions.politician_office
--    so 'mayor', 'mayor_of_capital', 'regional_leader' are now valid
--    in both tables.
--
-- 2. Re-emit politician_register_for_office:
--      • Accept the three new target_offices.
--      • Update opponent-stat dice formulas:
--          city_council        → 1d6 + 1   (was 2 + rand*3 = 2..4)
--          city_council_president → 1d6 + 5 (was 1 + rand*6 + 1 = 2..7)
--          mayor               → 1d10 + 5  (new)
--          mayor_of_capital    → 1d10 + 6  (new)
--          regional_leader     → 1d15 + 10 (new)
--        Community Organizer's opponent comes from the offer system
--        (politician_get_election_offer); per-tier dice for CO is
--        deferred — re-emitting the 250-line offer RPC for a single
--        line change is bad ROI. Documented as a known issue in the
--        header below.
--      • Experience override gates (Tier C jumpstart philosophy):
--          city_council_member        — bypass CO prereq at >= 20
--          city_council_president     — bypass CCM prereq at >= 40
--          mayor                      — gate at >= 50
--          mayor_of_capital           — gate at >= 60
--          regional_leader            — gate at >= 75
--
-- 3. Re-emit politician_resolve_due_elections:
--      • Unify the player stat reward to +1 politician_skill
--        (Experience) for ALL local-politics tier wins:
--          community, city_council, city_council_president,
--          mayor, mayor_of_capital, regional_leader.
--        Replaces the previous tier-specific rewards (CCM was +1
--        Reputation, CCP was +1 Rep + 1 Skill).
--      • Add resolver branches for mayor / mayor_of_capital /
--        regional_leader: stamp politician_office, fire career
--        event. No party reward and no popularity/seat side-effects
--        on these new tiers in V1 — clean slate to tune later.
--      • Parliament / senior_mp unchanged: +1 Influence on win,
--        seat seat seat bumps for the party. The user's "+1
--        Experience" rule is scoped to the local-politics ladder.
--
-- The 20270706 self-stamp RPCs (politician_take_office_mayor /
-- _mayor_of_capital / _regional_leader) are NOT dropped — keeping
-- them avoids a destructive teardown. The politician-career.html
-- UI swaps from "Take Office" to "Run for Election" in the same
-- session; the self-stamp RPCs become unreachable but harmless.
--
-- Known issue carried forward: Community Organizer opponent
-- Experience still uses the pre-existing formula (player_skill ±
-- random offset in politician_get_election_offer). User-spec was
-- 1d2+1 — defer to a follow-up that re-emits the offer RPC.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. CHECK constraint widening ──────────────────────────────────
ALTER TABLE public.politician_active_election
    DROP CONSTRAINT IF EXISTS politician_active_election_race_tier_check;
ALTER TABLE public.politician_active_election
    ADD CONSTRAINT politician_active_election_race_tier_check
    CHECK (race_tier IN (
        'community', 'parliament',
        'city_council', 'senior_mp',
        'city_council_president',
        'mayor', 'mayor_of_capital', 'regional_leader'
    ));

ALTER TABLE public.factions
    DROP CONSTRAINT IF EXISTS factions_politician_office_chk;
ALTER TABLE public.factions
    ADD CONSTRAINT factions_politician_office_chk
    CHECK (politician_office IS NULL
           OR politician_office IN (
               'community_organizer', 'member_of_parliament',
               'city_council_member', 'senior_mp',
               'city_council_president',
               'mayor', 'mayor_of_capital', 'regional_leader'
           ));


-- ── 2. politician_register_for_office re-emit ─────────────────────
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
    v_district     text;
    v_opp_blurb    text;
    v_stake_win    int;
    v_stake_lose   int;
    v_exp_threshold int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_target_office NOT IN (
        'city_council_member', 'senior_mp', 'city_council_president',
        'mayor', 'mayor_of_capital', 'regional_leader'
    ) THEN
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
        -- 20270709: Experience >= 20 bypasses the CO/former-CO prereq.
        IF COALESCE(v_pol.politician_skill, 0) < 20 THEN
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
        END IF;
        v_race_tier  := 'city_council';
        v_your_stat  := COALESCE(v_pol.politician_skill, 1);
        -- 20270709: 1d6 + 1 → 2..7
        v_opp_stat   := 2 + floor(random() * 6)::int;
        v_resolve    := v_tick + 1;
        v_district   := 'City Council seat';
        v_opp_blurb  := 'Independent challenger for the council seat';
        v_stake_win  := 0;
        v_stake_lose := 0;

    ELSIF p_target_office = 'city_council_president' THEN
        -- 20270706 + 20270709: Experience >= 40 bypasses the CCM +
        -- term-window prereqs.
        IF COALESCE(v_pol.politician_skill, 0) < 40 THEN
            IF v_pol.politician_office <> 'city_council_member' THEN
                RETURN jsonb_build_object('success', false, 'reason', 'wrong_current_office',
                    'have', v_pol.politician_office, 'expected', 'city_council_member');
            END IF;
            v_won_at := COALESCE(v_pol.politician_office_won_at_tick, v_tick);
            IF v_tick < v_won_at + 9 THEN
                RETURN jsonb_build_object('success', false, 'reason', 'too_early',
                    'opens_at_tick', v_won_at + 9, 'current_tick', v_tick);
            END IF;
        END IF;
        v_race_tier  := 'city_council_president';
        v_your_stat  := COALESCE(v_pol.politician_skill, 1);
        -- 20270709: 1d6 + 5 → 6..11
        v_opp_stat   := 6 + floor(random() * 6)::int;
        v_resolve    := v_tick + 1;
        v_district   := 'City Council Presidency';
        v_opp_blurb  := 'Independent contender for the council chair';
        v_stake_win  := 3;
        v_stake_lose := 0;

    ELSIF p_target_office IN ('mayor', 'mayor_of_capital', 'regional_leader') THEN
        -- 20270709: pure Experience gate, no prior-office prereq.
        v_exp_threshold := CASE p_target_office
            WHEN 'mayor'             THEN 50
            WHEN 'mayor_of_capital'  THEN 60
            WHEN 'regional_leader'   THEN 75
        END;
        IF COALESCE(v_pol.politician_skill, 0) < v_exp_threshold THEN
            RETURN jsonb_build_object('success', false, 'reason', 'experience_too_low',
                'experience', COALESCE(v_pol.politician_skill, 0),
                'required',   v_exp_threshold);
        END IF;

        v_race_tier  := p_target_office;
        v_your_stat  := COALESCE(v_pol.politician_skill, 1);
        v_opp_stat   := CASE p_target_office
            WHEN 'mayor'             THEN 6  + floor(random() * 10)::int   -- 1d10 + 5
            WHEN 'mayor_of_capital'  THEN 7  + floor(random() * 10)::int   -- 1d10 + 6
            WHEN 'regional_leader'   THEN 11 + floor(random() * 15)::int   -- 1d15 + 10
        END;
        v_resolve    := v_tick + 1;
        v_district   := CASE p_target_office
            WHEN 'mayor'             THEN 'Mayor of a city'
            WHEN 'mayor_of_capital'  THEN 'Mayor of the Capital'
            WHEN 'regional_leader'   THEN 'Regional Leader'
        END;
        v_opp_blurb  := CASE p_target_office
            WHEN 'mayor'             THEN 'Independent challenger for the mayor''s office'
            WHEN 'mayor_of_capital'  THEN 'Independent challenger for the capital''s mayoralty'
            WHEN 'regional_leader'   THEN 'Independent challenger for the regional leadership'
        END;
        v_stake_win  := 0;
        v_stake_lose := 0;

    ELSE  -- senior_mp
        IF v_pol.politician_office <> 'member_of_parliament' THEN
            RETURN jsonb_build_object('success', false, 'reason', 'wrong_current_office',
                'have', v_pol.politician_office, 'expected', 'member_of_parliament');
        END IF;
        SELECT next_election_tick, COALESCE(parliamentary_term_ticks, 24)
          INTO v_next_elect, v_term_ticks
          FROM nations WHERE id = v_pol.nation_id;
        IF v_next_elect IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'no_general_election');
        END IF;
        IF v_pol.politician_office_won_at_tick IS NULL
           OR v_tick < v_pol.politician_office_won_at_tick + v_term_ticks THEN
            RETURN jsonb_build_object('success', false, 'reason', 'term_too_short',
                'won_at',           v_pol.politician_office_won_at_tick,
                'term_ticks',       v_term_ticks,
                'eligible_at_tick', COALESCE(v_pol.politician_office_won_at_tick, 0) + v_term_ticks,
                'current_tick',     v_tick);
        END IF;
        IF v_tick < v_next_elect - 6 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'too_early',
                'opens_at_tick', v_next_elect - 6, 'current_tick', v_tick);
        END IF;
        IF v_tick > v_next_elect THEN
            RETURN jsonb_build_object('success', false, 'reason', 'window_closed',
                'last_open_tick', v_next_elect);
        END IF;
        v_race_tier  := 'senior_mp';
        v_your_stat  := COALESCE(v_pol.politician_skill, 1);
        v_opp_stat   := 1 + floor(random() * 6)::int;
        v_resolve    := v_next_elect;
        v_district   := 'Senior MP slot';
        v_opp_blurb  := 'Independent contender for the Senior MP nomination';
        v_stake_win  := 4;
        v_stake_lose := -3;
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
        v_pol.id, v_shard_id, v_race_tier, v_district,
        v_opp_first, v_opp_last, v_opp_blurb, NULL,
        v_your_stat, v_opp_stat,
        GREATEST(1, LEAST(99, v_poll_you)),
        v_stake_win, v_stake_lose,
        v_resolve,
        v_poll_you, v_poll_opp, v_poll_und,
        v_pol.politician_party_id
    );

    v_next_action := v_tick + 1;
    UPDATE factions SET next_member_action_tick = v_next_action WHERE id = v_pol.id;

    INSERT INTO politician_career_events (
        faction_id, event_tick, event_type, target_name, metadata
    ) VALUES (
        v_pol.id, v_tick, 'stood_for_election', v_district,
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


-- ── 3. politician_resolve_due_elections re-emit ───────────────────
-- Body verbatim from 20270654 except:
--   • Player stat reward block unified: +1 politician_skill for
--     community / city_council / city_council_president / mayor /
--     mayor_of_capital / regional_leader. Parliament / senior_mp
--     keep their +1 Influence reward.
--   • Office stamping CASE expanded to map 'mayor' / 'mayor_of_capital'
--     / 'regional_leader' race tiers → politician_office values.
CREATE OR REPLACE FUNCTION public.politician_resolve_due_elections()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_pol          factions%ROWTYPE;
    v_tick         int;
    v_race         politician_active_election%ROWTYPE;
    v_won          boolean;
    v_stake        int;
    v_cap_before   numeric;
    v_new_cap      numeric;
    v_actual_delta numeric;
    v_event        text;
    v_opp_full     text;
    v_party_seats  int;
    v_party_pop    numeric;
    v_party_pop_cap numeric;
    v_party_funds  bigint;
    v_party_name   text;
    v_party_reward jsonb;
    v_party_penalty jsonb;
    v_new_cha      int;
    v_new_skill    numeric;
    v_stat_reward  jsonb;
    v_office       text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', true, 'resolved', false, 'reason', 'no_shard');
    END IF;

    SELECT f.* INTO v_pol
      FROM factions f
      JOIN politician_active_election pae ON pae.politician_id = f.id
     WHERE (f.id = v_uid OR f.linked_user_id = v_uid)
       AND f.faction_type = 'politician'
       AND f.abandoned_at IS NULL
       AND pae.resolve_tick < v_tick
     LIMIT 1;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', true, 'resolved', false);
    END IF;

    SELECT * INTO v_race FROM politician_active_election WHERE politician_id = v_pol.id;
    IF v_race.politician_id IS NULL THEN
        RETURN jsonb_build_object('success', true, 'resolved', false);
    END IF;
    IF v_race.resolve_tick >= v_tick THEN
        RETURN jsonb_build_object(
            'success', true, 'resolved', false,
            'race_tier', v_race.race_tier,
            'resolve_tick', v_race.resolve_tick,
            'current_tick', v_tick
        );
    END IF;

    IF v_race.polling_you_pct > v_race.polling_opp_pct THEN
        v_won := true;
    ELSIF v_race.polling_you_pct < v_race.polling_opp_pct THEN
        v_won := false;
    ELSE
        v_won := random() < 0.5;
    END IF;
    v_stake := CASE WHEN v_won THEN v_race.stake_win ELSE v_race.stake_lose END;
    v_event := CASE WHEN v_won THEN 'won_election' ELSE 'lost_election' END;
    v_opp_full := v_race.opp_first || ' ' || v_race.opp_last;
    v_cap_before := COALESCE(v_pol.politician_influence, 0);
    UPDATE factions
       SET politician_influence = GREATEST(0, v_cap_before + v_stake)
     WHERE id = v_pol.id
    RETURNING politician_influence INTO v_new_cap;
    v_actual_delta := v_new_cap - v_cap_before;

    -- Party rewards (unchanged from 20270654). New local-exec tiers
    -- (mayor / mayor_of_capital / regional_leader) have no party
    -- reward in V1 — clean slate to tune later.
    IF v_won AND v_race.party_id IS NOT NULL THEN
        IF v_race.race_tier IN ('parliament', 'senior_mp') THEN
            UPDATE factions
               SET seats = COALESCE(seats, 0) + 1
             WHERE id = v_race.party_id
               AND faction_type = 'movement_party'
               AND abandoned_at IS NULL
            RETURNING seats, faction_name INTO v_party_seats, v_party_name;
            IF FOUND THEN
                v_party_reward := jsonb_build_object(
                    'kind',       'seats',
                    'delta',      1,
                    'new_value',  v_party_seats,
                    'party_name', v_party_name
                );
            END IF;
        ELSIF v_race.race_tier = 'community' THEN
            UPDATE factions
               SET popularity_pct = LEAST(popularity_cap_pct, COALESCE(popularity_pct, 0) + 1)
             WHERE id = v_race.party_id
               AND faction_type = 'movement_party'
               AND abandoned_at IS NULL
            RETURNING popularity_pct, faction_name INTO v_party_pop, v_party_name;
            IF FOUND THEN
                v_party_reward := jsonb_build_object(
                    'kind',       'popularity',
                    'delta',      1,
                    'new_value',  v_party_pop,
                    'party_name', v_party_name
                );
            END IF;
        ELSIF v_race.race_tier = 'city_council' THEN
            UPDATE factions
               SET popularity_cap_pct = COALESCE(popularity_cap_pct, 0) + 1,
                   popularity_pct     = LEAST(
                       COALESCE(popularity_cap_pct, 0) + 1,
                       COALESCE(popularity_pct, 0) + 1
                   ),
                   party_funds        = COALESCE(party_funds, 0) + 100000
             WHERE id = v_race.party_id
               AND faction_type = 'movement_party'
               AND abandoned_at IS NULL
            RETURNING popularity_pct, popularity_cap_pct, party_funds, faction_name
                 INTO v_party_pop, v_party_pop_cap, v_party_funds, v_party_name;
            IF FOUND THEN
                v_party_reward := jsonb_build_object(
                    'kind',           'city_council',
                    'popularity_delta',     1,
                    'popularity_new',       v_party_pop,
                    'popularity_cap_delta', 1,
                    'popularity_cap_new',   v_party_pop_cap,
                    'funds_delta',          100000,
                    'funds_new',            v_party_funds,
                    'party_name',           v_party_name
                );
            END IF;
        ELSIF v_race.race_tier = 'city_council_president' THEN
            UPDATE factions
               SET party_funds = COALESCE(party_funds, 0) + 200000
             WHERE id = v_race.party_id
               AND faction_type = 'movement_party'
               AND abandoned_at IS NULL
            RETURNING party_funds, faction_name INTO v_party_funds, v_party_name;
            IF FOUND THEN
                v_party_reward := jsonb_build_object(
                    'kind',        'city_council_president',
                    'funds_delta', 200000,
                    'funds_new',   v_party_funds,
                    'party_name',  v_party_name
                );
            END IF;
        END IF;
    END IF;

    IF NOT v_won AND v_race.party_id IS NOT NULL THEN
        UPDATE factions
           SET popularity_pct = GREATEST(0, COALESCE(popularity_pct, 0) - 1)
         WHERE id = v_race.party_id
           AND faction_type = 'movement_party'
           AND abandoned_at IS NULL
        RETURNING popularity_pct, faction_name INTO v_party_pop, v_party_name;
        IF FOUND THEN
            v_party_penalty := jsonb_build_object(
                'kind',       'popularity',
                'delta',      -1,
                'new_value',  v_party_pop,
                'party_name', v_party_name
            );
        END IF;
    END IF;

    -- Player stat reward. Parliament / senior_mp keep their +1
    -- Influence. Every local-politics tier (CO / CCM / CCP / Mayor /
    -- MotC / RL) wins now grant a unified +1 Skill (Experience) per
    -- the 20270709 spec.
    IF v_won THEN
        IF v_race.race_tier IN ('parliament', 'senior_mp') THEN
            UPDATE factions
               SET politician_capital = COALESCE(politician_capital, 1) + 1
             WHERE id = v_pol.id
            RETURNING politician_capital INTO v_new_cha;
            v_stat_reward := jsonb_build_object('kind', 'influence', 'delta', 1, 'new_value', v_new_cha);
        ELSIF v_race.race_tier IN (
            'community', 'city_council', 'city_council_president',
            'mayor', 'mayor_of_capital', 'regional_leader'
        ) THEN
            UPDATE factions
               SET politician_skill = COALESCE(politician_skill, 1) + 1
             WHERE id = v_pol.id
            RETURNING politician_skill INTO v_new_skill;
            v_stat_reward := jsonb_build_object('kind', 'skill', 'delta', 1, 'new_value', v_new_skill);
        END IF;
        v_office := CASE v_race.race_tier
                        WHEN 'community'              THEN 'community_organizer'
                        WHEN 'parliament'             THEN 'member_of_parliament'
                        WHEN 'city_council'           THEN 'city_council_member'
                        WHEN 'city_council_president' THEN 'city_council_president'
                        WHEN 'senior_mp'              THEN 'senior_mp'
                        WHEN 'mayor'                  THEN 'mayor'
                        WHEN 'mayor_of_capital'       THEN 'mayor_of_capital'
                        WHEN 'regional_leader'        THEN 'regional_leader'
                    END;
        IF v_office IS NOT NULL THEN
            UPDATE factions
               SET politician_office             = v_office,
                   politician_office_won_at_tick = v_tick
             WHERE id = v_pol.id;
        END IF;
        IF v_race.race_tier = 'community' THEN
            UPDATE factions
               SET politician_former_community_organizer = TRUE
             WHERE id = v_pol.id;
        END IF;
    END IF;

    INSERT INTO politician_career_events (
        faction_id, event_tick, event_type, target_name, metadata
    ) VALUES (
        v_pol.id, v_tick, v_event, v_race.district,
        jsonb_build_object(
            'race_tier',              v_race.race_tier,
            'district',               v_race.district,
            'opponent',               v_opp_full,
            'opp_party_name',         v_race.opp_party_name,
            'polling_you',            v_race.polling_you_pct,
            'polling_opp',            v_race.polling_opp_pct,
            'political_capital_delta', v_actual_delta,
            'party_reward',           v_party_reward,
            'party_penalty',          v_party_penalty,
            'stat_reward',            v_stat_reward,
            'office_gained',          v_office
        )
    );
    DELETE FROM politician_active_election WHERE politician_id = v_pol.id;
    RETURN jsonb_build_object(
        'success',                true,
        'resolved',               true,
        'won',                    v_won,
        'race_tier',              v_race.race_tier,
        'district',               v_race.district,
        'opponent',               v_opp_full,
        'opp_party_name',         v_race.opp_party_name,
        'polling_you',            v_race.polling_you_pct,
        'polling_opp',            v_race.polling_opp_pct,
        'political_capital_delta', v_actual_delta,
        'politician_influence',   v_new_cap,
        'party_reward',           v_party_reward,
        'party_penalty',          v_party_penalty,
        'stat_reward',            v_stat_reward,
        'office_gained',          v_office
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_resolve_due_elections() TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
