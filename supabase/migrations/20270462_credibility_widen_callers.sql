-- ════════════════════════════════════════════════════════════════════
-- Audit follow-up on 20270461 — widen credibility callers
--
-- 20270461 widened factions.politician_credibility from INT to numeric
-- so Civic Meeting (-0.5) and Office Hours (+0.5) can land their
-- fractional effects. Two pre-existing callers still declared their
-- credibility locals as INT and got silently truncated by the
-- post-widen reads:
--
-- 1. politician_resolve_due_elections (20270457)
--    Declares v_new_cred INT. Community/city_council win path does
--    UPDATE … politician_credibility + 1 RETURNING INTO v_new_cred.
--    After widening the column, RETURNING numeric INTO INT truncates,
--    so the resolver's stat_reward.new_value reports e.g. "3" when
--    credibility is actually 3.5. The client banner shows the wrong
--    number even though the column stored the correct one.
--
-- 2. politician_mp_floor_speech (20270460)
--    Reads credibility out of the _mp_action_check JSONB via
--    (v_ctx->>'credibility')::int. After widening, _mp_action_check
--    puts a numeric value in the JSONB; the ::int cast truncates the
--    fractional part, so Floor Speech rolls with the integer floor of
--    credibility (2 instead of 2.5). The Roll math itself is wrong,
--    not just the display.
--
-- Both are full CREATE OR REPLACE re-pastes of their latest bodies
-- (20270457 and 20270460 respectively) with v_new_cred / v_stat /
-- v_total widened to numeric. Behaviour unchanged at integer values.
--
-- Out of scope (deliberate, flagged): politician_get_election_offer
-- (20270398) snapshots credibility into politician_election_offers
-- .com_your_stat which is declared INT. The community race odds will
-- continue to compute against the integer floor of credibility. Cost:
-- a small balance loss for fractional credibility (max 0.99 stat
-- points). Not worth widening the offer table for v1; flag for the
-- next Election balance pass.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. politician_resolve_due_elections — v_new_cred numeric ────────
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
    v_inf_before   numeric;
    v_new_inf      numeric;
    v_actual_delta numeric;
    v_event        text;
    v_opp_full     text;
    v_party_seats  int;
    v_party_pop    numeric;
    v_party_name   text;
    v_party_reward jsonb;
    v_party_penalty jsonb;
    v_new_cha      int;
    v_new_cred     numeric;
    v_stat_reward  jsonb;
    v_office       text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', true, 'resolved', false, 'reason', 'no_politician');
    END IF;
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', true, 'resolved', false, 'reason', 'no_shard');
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
    v_inf_before := COALESCE(v_pol.politician_influence, 0);
    UPDATE factions
       SET politician_influence = GREATEST(0, v_inf_before + v_stake)
     WHERE id = v_pol.id
    RETURNING politician_influence INTO v_new_inf;
    v_actual_delta := v_new_inf - v_inf_before;
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
        ELSIF v_race.race_tier IN ('community', 'city_council') THEN
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
        END IF;
    END IF;
    IF NOT v_won AND v_race.party_id IS NOT NULL
       AND v_race.race_tier = 'parliament' THEN
        UPDATE factions
           SET popularity_pct = GREATEST(0, COALESCE(popularity_pct, 0) - 0.5)
         WHERE id = v_race.party_id
           AND faction_type = 'movement_party'
           AND abandoned_at IS NULL
        RETURNING popularity_pct, faction_name INTO v_party_pop, v_party_name;
        IF FOUND THEN
            v_party_penalty := jsonb_build_object(
                'kind',       'popularity',
                'delta',      -0.5,
                'new_value',  v_party_pop,
                'party_name', v_party_name
            );
        END IF;
    END IF;
    IF v_won THEN
        IF v_race.race_tier IN ('parliament', 'senior_mp') THEN
            UPDATE factions
               SET politician_charisma = COALESCE(politician_charisma, 1) + 1
             WHERE id = v_pol.id
            RETURNING politician_charisma INTO v_new_cha;
            v_stat_reward := jsonb_build_object('kind', 'charisma', 'delta', 1, 'new_value', v_new_cha);
        ELSIF v_race.race_tier IN ('community', 'city_council') THEN
            UPDATE factions
               SET politician_credibility = COALESCE(politician_credibility, 1) + 1
             WHERE id = v_pol.id
            RETURNING politician_credibility INTO v_new_cred;
            v_stat_reward := jsonb_build_object('kind', 'credibility', 'delta', 1, 'new_value', v_new_cred);
        END IF;
        v_office := CASE v_race.race_tier
                        WHEN 'community'    THEN 'community_organizer'
                        WHEN 'parliament'   THEN 'member_of_parliament'
                        WHEN 'city_council' THEN 'city_council_member'
                        WHEN 'senior_mp'    THEN 'senior_mp'
                    END;
        IF v_office IS NOT NULL THEN
            UPDATE factions
               SET politician_office             = v_office,
                   politician_office_won_at_tick = v_tick
             WHERE id = v_pol.id;
        END IF;
    END IF;
    INSERT INTO politician_career_events (
        faction_id, event_tick, event_type, target_name, metadata
    ) VALUES (
        v_pol.id, v_tick, v_event, v_race.district,
        jsonb_build_object(
            'race_tier',       v_race.race_tier,
            'district',        v_race.district,
            'opponent',        v_opp_full,
            'opp_party_name',  v_race.opp_party_name,
            'polling_you',     v_race.polling_you_pct,
            'polling_opp',     v_race.polling_opp_pct,
            'influence_delta', v_actual_delta,
            'party_reward',    v_party_reward,
            'party_penalty',   v_party_penalty,
            'stat_reward',     v_stat_reward,
            'office_gained',   v_office
        )
    );
    DELETE FROM politician_active_election WHERE politician_id = v_pol.id;
    RETURN jsonb_build_object(
        'success',              true,
        'resolved',             true,
        'won',                  v_won,
        'race_tier',            v_race.race_tier,
        'district',             v_race.district,
        'opponent',             v_opp_full,
        'opp_party_name',       v_race.opp_party_name,
        'polling_you',          v_race.polling_you_pct,
        'polling_opp',          v_race.polling_opp_pct,
        'influence_delta',      v_actual_delta,
        'politician_influence', v_new_inf,
        'party_reward',         v_party_reward,
        'party_penalty',        v_party_penalty,
        'stat_reward',          v_stat_reward,
        'office_gained',        v_office
    );
END;
$$;

-- ── 2. politician_mp_floor_speech — v_stat / v_total numeric ────────
CREATE OR REPLACE FUNCTION public.politician_mp_floor_speech()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_ctx        jsonb;
    v_pol_id     uuid;
    v_party_id   uuid;
    v_tick       int;
    v_roll       int;
    v_stat       numeric;
    v_total      numeric;
    v_passed     boolean;
    v_new_rep    int;
    v_new_pop    numeric;
    v_party_name text;
BEGIN
    v_ctx := _mp_action_check();
    IF NOT (v_ctx->>'ok')::bool THEN
        RETURN (v_ctx - 'ok') || jsonb_build_object('success', false);
    END IF;

    v_pol_id     := (v_ctx->>'politician_id')::uuid;
    v_party_id   := (v_ctx->>'party_id')::uuid;
    v_party_name := v_ctx->>'party_name';
    v_tick       := (v_ctx->>'current_tick')::int;
    v_stat       := (v_ctx->>'credibility')::numeric;

    v_roll  := 1 + floor(random() * 6)::int;
    v_total := v_roll + v_stat;
    v_passed := v_total >= 5;

    IF v_passed THEN
        UPDATE factions
           SET politician_reputation = COALESCE(politician_reputation, 0) + 1
         WHERE id = v_pol_id
        RETURNING politician_reputation INTO v_new_rep;
    ELSE
        UPDATE factions
           SET popularity_pct = GREATEST(0, COALESCE(popularity_pct, 0) - 1)
         WHERE id = v_party_id
        RETURNING popularity_pct INTO v_new_pop;
    END IF;

    UPDATE factions SET next_mp_action_tick = v_tick + 1 WHERE id = v_pol_id;

    RETURN jsonb_build_object(
        'success',              true,
        'action',               'floor_speech',
        'roll',                 v_roll,
        'stat',                 v_stat,
        'total',                v_total,
        'passed',               v_passed,
        'new_reputation',       v_new_rep,
        'new_party_popularity', v_new_pop,
        'party_name',           v_party_name,
        'next_action_tick',     v_tick + 1
    );
END;
$$;

NOTIFY pgrst, 'reload schema';

COMMIT;
