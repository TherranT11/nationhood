-- ════════════════════════════════════════════════════════════════════
-- 20270654 — City Council President: race, eligibility, term
--
-- New Tier-3 local-government rung. Player must be CURRENTLY a City
-- Council Member with the term expiring within 3 ticks (i.e.,
-- politician_office = 'city_council_member' AND current_tick >=
-- politician_office_won_at_tick + 9). The CCM term is 12 ticks (per
-- 20270625/20270629), so the registration window is the last 3 ticks
-- before automatic expiry — [won_at + 9, won_at + 12). Same shape as
-- the community_organizer → city_council_member transition: campaign
-- announcement happens at the end of the current term, no "former"
-- path. After the CCM term expires the politician returns to Party
-- Member and is no longer eligible.
--
-- Opponent Skill = 1d6 + 1 (range 2..7), spec'd by user.
--
-- Win payout:
--   politician: +3 Influence (via stake_win = 3 — same channel as
--                 city_council's stake_win = 2), +1 Reputation,
--                 +1 Skill
--   party:      +$200K party_funds (no popularity/cap bump)
-- Loss:
--   politician: 0 (stake_lose = 0, mirrors city_council)
--   party:      −1 popularity (existing universal-loss branch)
--
-- Term length on win: 36 ticks (3 years). Sits longer than CCM's 12
-- to give the office room to use Tier-3 actions when those land.
-- politician_resolve_expired_terms gains a per-office term-length
-- CASE so 12/36 coexist in the same sweep.
--
-- ── RPC re-emits ────────────────────────────────────────────────────
-- politician_register_for_office (last in 20270649)
--   + 'city_council_president' branch with the "must be CCM" check
--     and the won_at + 9 wait gate.
-- politician_resolve_due_elections (last in 20270646)
--   + 'city_council_president' party-reward + stat-reward branches.
--   + race_tier → office CASE extended.
-- politician_resolve_expired_terms (last in 20270629)
--   + 'city_council_president' added to the sweep with a per-office
--     term-length CASE (community_organizer + city_council_member:
--     12, city_council_president: 36). NULL-tick orphan teardown
--     path preserved for all three.
--
-- No new column or sticky flag — the eligibility check is pure
-- runtime ("currently CCM AND within 3 ticks of term end"), so the
-- former-CCM analog to politician_former_community_organizer isn't
-- needed. js/utils.js (OFFICE_TITLES, termEndTickFor) and
-- politician-career.html (rung gate + click handler) updated in
-- lockstep.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. politician_register_for_office ─────────────────────────────
CREATE OR REPLACE FUNCTION public.politician_register_for_office(p_target_office text)
RETURNS jsonb
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
    IF p_target_office NOT IN ('city_council_member', 'senior_mp', 'city_council_president') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_target_office');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1;
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
        -- Must be currently sitting CCM. No "former" path: the
        -- registration window is the final 3 ticks of the 12-tick
        -- CCM term. After term expiry (politician_office → NULL)
        -- this check fails — by design, no announcement after the
        -- seat is empty.
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
        -- 1d6 + 1 = 2..7
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
            WHEN 'city_council_president' THEN 3   -- +3 Influence on win
            ELSE                                4  -- senior_mp
        END,
        CASE v_race_tier
            WHEN 'city_council'           THEN 0
            WHEN 'city_council_president' THEN 0
            ELSE                                -3  -- senior_mp
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

GRANT EXECUTE ON FUNCTION public.politician_register_for_office(text) TO authenticated;

-- ── 2. politician_resolve_due_elections ───────────────────────────
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
    v_new_cred     numeric;
    v_new_rep      numeric;
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
            -- 20270654 spec: +$200K party_funds. No popularity bump.
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

    IF v_won THEN
        IF v_race.race_tier IN ('parliament', 'senior_mp') THEN
            UPDATE factions
               SET politician_capital = COALESCE(politician_capital, 1) + 1
             WHERE id = v_pol.id
            RETURNING politician_capital INTO v_new_cha;
            v_stat_reward := jsonb_build_object('kind', 'influence', 'delta', 1, 'new_value', v_new_cha);
        ELSIF v_race.race_tier = 'community' THEN
            UPDATE factions
               SET politician_skill = COALESCE(politician_skill, 1) + 1
             WHERE id = v_pol.id
            RETURNING politician_skill INTO v_new_cred;
            v_stat_reward := jsonb_build_object('kind', 'skill', 'delta', 1, 'new_value', v_new_cred);
        ELSIF v_race.race_tier = 'city_council' THEN
            UPDATE factions
               SET politician_reputation = COALESCE(politician_reputation, 0) + 1
             WHERE id = v_pol.id
            RETURNING politician_reputation INTO v_new_rep;
            v_stat_reward := jsonb_build_object('kind', 'reputation', 'delta', 1, 'new_value', v_new_rep);
        ELSIF v_race.race_tier = 'city_council_president' THEN
            -- 20270654 spec: +1 Reputation, +1 Skill. (+3 Influence
            -- already applied via stake_win above.)
            UPDATE factions
               SET politician_reputation = COALESCE(politician_reputation, 0) + 1,
                   politician_skill      = COALESCE(politician_skill, 0)      + 1
             WHERE id = v_pol.id
            RETURNING politician_reputation, politician_skill INTO v_new_rep, v_new_skill;
            v_stat_reward := jsonb_build_object(
                'kind',             'city_council_president',
                'reputation_delta', 1,
                'reputation_new',   v_new_rep,
                'skill_delta',      1,
                'skill_new',        v_new_skill,
                'influence_delta',  v_actual_delta,
                'influence_new',    v_new_cap
            );
        END IF;
        v_office := CASE v_race.race_tier
                        WHEN 'community'              THEN 'community_organizer'
                        WHEN 'parliament'             THEN 'member_of_parliament'
                        WHEN 'city_council'           THEN 'city_council_member'
                        WHEN 'city_council_president' THEN 'city_council_president'
                        WHEN 'senior_mp'              THEN 'senior_mp'
                    END;
        IF v_office IS NOT NULL THEN
            UPDATE factions
               SET politician_office             = v_office,
                   politician_office_won_at_tick = v_tick
             WHERE id = v_pol.id;
        END IF;
        -- Sticky former-CO flag (20270635) — keeps CCM [Run for
        -- Election] eligibility after the 12-tick CO term elapses.
        -- No parallel flag is needed for the City Council Presidency
        -- race; that gate runs purely on the currently-sitting CCM
        -- check (20270654).
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

-- ── 3. politician_resolve_expired_terms ───────────────────────────
-- Per-office term length via CASE. Community Organizer + CCM stay at
-- 12 ticks (1 year). CC President is 36 ticks (3 years). Orphan
-- NULL-tick teardown path (20270629) preserved for all three.
CREATE OR REPLACE FUNCTION public.politician_resolve_expired_terms()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid           uuid := auth.uid();
    v_tick          int;
    v_pol           RECORD;
    v_office_label  text;
    v_expired_count int := 0;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    FOR v_pol IN
        SELECT id, politician_office, politician_office_won_at_tick
          FROM factions
         WHERE (id = v_uid OR linked_user_id = v_uid)
           AND faction_type = 'politician'
           AND abandoned_at IS NULL
           AND politician_office IN ('community_organizer', 'city_council_member', 'city_council_president')
           AND (
               politician_office_won_at_tick IS NULL
               OR v_tick >= politician_office_won_at_tick + CASE politician_office
                       WHEN 'city_council_president' THEN 36
                       ELSE                                12
                  END
           )
         FOR UPDATE
    LOOP
        v_office_label := CASE v_pol.politician_office
            WHEN 'community_organizer'    THEN 'Community Organizer'
            WHEN 'city_council_member'    THEN 'City Council Member'
            WHEN 'city_council_president' THEN 'City Council President'
            ELSE initcap(replace(v_pol.politician_office, '_', ' '))
        END;

        UPDATE factions
           SET politician_office             = NULL,
               politician_office_won_at_tick = NULL
         WHERE id = v_pol.id;

        INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name)
        VALUES (v_pol.id, v_tick, 'term_ended', v_office_label);

        v_expired_count := v_expired_count + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'success',       true,
        'tick',          v_tick,
        'expired_count', v_expired_count
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_resolve_expired_terms() TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
