-- ════════════════════════════════════════════════════════════════════
-- Rename politician_influence → political_capital
--
-- Per design decision: Influence was the right MECHANIC but the wrong
-- NAME. "Political Capital" is the real-world term for the earned
-- goodwill politicians spend on big plays — bills, motions, leadership
-- challenges. The mechanic stays identical; the name + label change.
--
-- ── Atomic rename ───────────────────────────────────────────────────
-- ALTER COLUMN RENAME updates only the catalog. plpgsql function
-- bodies are stored as text and re-parse column references at exec
-- time, so any function still referencing politician_influence after
-- rename throws at the next call. All 7 currently-live RPCs that read
-- or write the column are re-pasted in this same transaction:
--   - _mp_action_check
--   - politician_door_knock
--   - politician_join_party
--   - politician_leave_party
--   - politician_mp_fundraising_dinner
--   - politician_resolve_due_elections
--   - process_annual_january
--
-- JSONB return keys also rename for consistency. The _mp_action_check
-- helper now exposes 'political_capital' (was 'influence'); the
-- fundraising_dinner result envelope returns 'new_political_capital'
-- (was 'new_influence') and 'stat_delta' uses 'political_capital'
-- (was 'influence'). UI callers updated in lockstep.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Rename the column ────────────────────────────────────────────
ALTER TABLE factions
    RENAME COLUMN politician_influence TO political_capital;

COMMENT ON COLUMN factions.political_capital IS
    'Career-climbing currency for politicians (was politician_influence — renamed 20270463). Accumulates from MP/Local actions, election wins, party rewards. Spent or gatekeeps rung advancement, party founding, leadership challenges. Numeric to support fractional gains (+0.1 January, +0.2/+0.4 door knock).';

-- ── 2. _mp_action_check — JSONB key + column read ───────────────────
CREATE OR REPLACE FUNCTION public._mp_action_check()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid   uuid := auth.uid();
    v_pol   factions%ROWTYPE;
    v_party factions%ROWTYPE;
    v_tick  int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_office NOT IN ('member_of_parliament', 'senior_mp') THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'wrong_office',
            'have', v_pol.politician_office);
    END IF;
    IF v_pol.politician_party_id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'not_in_party');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF v_pol.next_mp_action_tick IS NOT NULL AND v_pol.next_mp_action_tick > v_tick THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_mp_action_tick, 'current_tick', v_tick);
    END IF;

    SELECT * INTO v_party FROM factions WHERE id = v_pol.politician_party_id FOR UPDATE;
    IF v_party.id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'party_not_found');
    END IF;

    RETURN jsonb_build_object(
        'ok',                true,
        'politician_id',     v_pol.id,
        'credibility',       COALESCE(v_pol.politician_credibility, 0),
        'charisma',          COALESCE(v_pol.politician_charisma, 0),
        'reputation',        COALESCE(v_pol.politician_reputation, 0),
        'political_capital', COALESCE(v_pol.political_capital, 0),
        'party_id',          v_party.id,
        'party_name',        v_party.faction_name,
        'party_funds',       COALESCE(v_party.party_funds, 0),
        'current_tick',      v_tick
    );
END;
$$;
REVOKE EXECUTE ON FUNCTION public._mp_action_check() FROM PUBLIC;

-- ── 3. politician_door_knock ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.politician_door_knock(p_party_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_roll      int;
    v_total     int;
    v_bracket   text;
    v_pop_delta numeric := 0;
    v_cap_delta numeric := 0;
    v_new_pop   numeric;
    v_new_cap   numeric;
    v_cooldown  int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND politician_party_id = p_party_id
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;
    IF v_pol.door_knock_cooldown_until_tick IS NOT NULL
       AND v_pol.door_knock_cooldown_until_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.door_knock_cooldown_until_tick);
    END IF;
    v_roll  := 1 + floor(random() * 6)::int;
    v_total := v_roll + COALESCE(v_pol.politician_reputation, 0);
    IF v_roll = 1 THEN
        v_bracket := 'crit_fail'; v_pop_delta := -1;
    ELSIF v_roll = 6 THEN
        v_bracket := 'crit';      v_cap_delta := 0.4;
    ELSIF v_total >= 5 THEN
        v_bracket := 'hit';       v_cap_delta := 0.2;
    ELSE
        v_bracket := 'fail';      v_pop_delta := -0.5;
    END IF;
    UPDATE factions
       SET popularity_pct = LEAST(popularity_cap_pct, GREATEST(0, COALESCE(popularity_pct, 0) + v_pop_delta))
     WHERE id = p_party_id
       AND faction_type = 'movement_party'
    RETURNING popularity_pct INTO v_new_pop;
    IF v_new_pop IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'party_not_found');
    END IF;
    v_cooldown := v_tick + 2;
    UPDATE factions
       SET political_capital               = GREATEST(0, COALESCE(political_capital, 0) + v_cap_delta),
           door_knock_cooldown_until_tick  = v_cooldown
     WHERE id = v_pol.id
    RETURNING political_capital INTO v_new_cap;
    RETURN jsonb_build_object(
        'success',                 true,
        'roll',                    v_roll,
        'reputation',              COALESCE(v_pol.politician_reputation, 0),
        'total',                   v_total,
        'bracket',                 v_bracket,
        'popularity_delta',        v_pop_delta,
        'political_capital_delta', v_cap_delta,
        'popularity_pct',          v_new_pop,
        'political_capital',       v_new_cap,
        'cooldown_until_tick',     v_cooldown
    );
END;
$$;

-- ── 4. politician_join_party ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.politician_join_party(
    p_politician_id uuid,
    p_party_id      uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_party     factions%ROWTYPE;
    v_tick      int;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;

    SELECT * INTO v_pol FROM factions WHERE id = p_politician_id FOR UPDATE;
    IF v_pol.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'politician_not_found'); END IF;
    IF v_pol.faction_type <> 'politician' THEN RETURN jsonb_build_object('success', false, 'reason', 'not_a_politician'); END IF;
    IF v_pol.id <> v_uid AND v_pol.linked_user_id IS DISTINCT FROM v_uid THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF v_pol.abandoned_at IS NOT NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'politician_inactive'); END IF;

    SELECT * INTO v_party FROM factions WHERE id = p_party_id;
    IF v_party.id IS NULL OR v_party.faction_type <> 'movement_party' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'party_not_found');
    END IF;
    IF v_party.abandoned_at IS NOT NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'party_inactive'); END IF;
    IF v_party.nation_id IS DISTINCT FROM v_pol.nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'different_nation');
    END IF;

    IF v_pol.politician_party_id = p_party_id THEN
        RETURN jsonb_build_object('success', true, 'party_name', v_party.faction_name, 'already_member', true);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    DECLARE
        v_first_join boolean := NOT EXISTS (
            SELECT 1 FROM politician_career_events
             WHERE faction_id = p_politician_id AND event_type = 'joined_party'
        );
    BEGIN
        UPDATE factions
           SET politician_party_id = p_party_id,
               political_capital   = COALESCE(political_capital, 0)
                                   + CASE WHEN v_first_join THEN 3 ELSE 0 END
         WHERE id = p_politician_id;

        INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name)
        VALUES (p_politician_id, v_tick, 'joined_party', v_party.faction_name);

        RETURN jsonb_build_object('success', true,
            'party_id', p_party_id, 'party_name', v_party.faction_name,
            'political_capital_delta', CASE WHEN v_first_join THEN 3 ELSE 0 END);
    END;
END;
$$;

-- ── 5. politician_leave_party — -5 Political Capital cost preserved ─
-- Re-paste of the 20270372 body with the column + return-key renamed.
-- The -5 cost is intact (clamp at 0). First-join +3 is in
-- politician_join_party; the combination makes leave + rejoin a net
-- loss, killing affiliation-churn farming.
CREATE OR REPLACE FUNCTION public.politician_leave_party(
    p_politician_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_party     factions%ROWTYPE;
    v_tick      int;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;

    SELECT * INTO v_pol FROM factions WHERE id = p_politician_id FOR UPDATE;
    IF v_pol.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'politician_not_found'); END IF;
    IF v_pol.faction_type <> 'politician' THEN RETURN jsonb_build_object('success', false, 'reason', 'not_a_politician'); END IF;
    IF v_pol.id <> v_uid AND v_pol.linked_user_id IS DISTINCT FROM v_uid THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF v_pol.abandoned_at IS NOT NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'politician_inactive'); END IF;

    IF v_pol.politician_party_id IS NULL THEN
        RETURN jsonb_build_object('success', true, 'already_independent', true);
    END IF;

    SELECT * INTO v_party FROM factions WHERE id = v_pol.politician_party_id;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE factions
       SET politician_party_id = NULL,
           political_capital   = GREATEST(0, COALESCE(political_capital, 0) - 5)
     WHERE id = p_politician_id;

    INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name)
    VALUES (p_politician_id, v_tick, 'left_party', COALESCE(v_party.faction_name, 'a political party'));

    RETURN jsonb_build_object('success', true,
        'party_name', v_party.faction_name,
        'political_capital_delta', -5);
END;
$$;

-- ── 6. politician_mp_fundraising_dinner ─────────────────────────────
CREATE OR REPLACE FUNCTION public.politician_mp_fundraising_dinner()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_ctx        jsonb;
    v_pol_id     uuid;
    v_party_id   uuid;
    v_party_name text;
    v_tick       int;
    v_roll       int;
    v_stat       int;
    v_total      int;
    v_money      bigint;
    v_new_funds  numeric;
    v_new_cap    numeric;
    v_new_cha    int;
    v_stat_delta text := NULL;
BEGIN
    v_ctx := _mp_action_check();
    IF NOT (v_ctx->>'ok')::bool THEN
        RETURN (v_ctx - 'ok') || jsonb_build_object('success', false);
    END IF;

    v_pol_id     := (v_ctx->>'politician_id')::uuid;
    v_party_id   := (v_ctx->>'party_id')::uuid;
    v_party_name := v_ctx->>'party_name';
    v_tick       := (v_ctx->>'current_tick')::int;
    v_stat       := (v_ctx->>'reputation')::int;

    v_roll  := 1 + floor(random() * 30)::int;
    v_total := v_roll + v_stat;
    v_money := (v_total * 1000)::bigint;

    UPDATE factions SET party_funds = COALESCE(party_funds, 0) + v_money
     WHERE id = v_party_id
    RETURNING party_funds INTO v_new_funds;

    IF v_total <= 10 THEN
        UPDATE factions
           SET political_capital = GREATEST(0, COALESCE(political_capital, 0) - 1)
         WHERE id = v_pol_id
        RETURNING political_capital INTO v_new_cap;
        v_stat_delta := 'political_capital';
    ELSIF v_total >= 25 THEN
        UPDATE factions
           SET politician_charisma = COALESCE(politician_charisma, 0) + 1
         WHERE id = v_pol_id
        RETURNING politician_charisma INTO v_new_cha;
        v_stat_delta := 'charisma';
    END IF;

    UPDATE factions SET next_mp_action_tick = v_tick + 1 WHERE id = v_pol_id;

    RETURN jsonb_build_object(
        'success',                true,
        'action',                 'fundraising_dinner',
        'roll',                   v_roll,
        'stat',                   v_stat,
        'total',                  v_total,
        'money_raised',           v_money,
        'party_funds_after',      v_new_funds,
        'party_name',             v_party_name,
        'stat_delta',             v_stat_delta,
        'new_political_capital',  v_new_cap,
        'new_charisma',           v_new_cha,
        'next_action_tick',       v_tick + 1
    );
END;
$$;

-- ── 7. politician_resolve_due_elections ─────────────────────────────
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
    v_cap_before := COALESCE(v_pol.political_capital, 0);
    UPDATE factions
       SET political_capital = GREATEST(0, v_cap_before + v_stake)
     WHERE id = v_pol.id
    RETURNING political_capital INTO v_new_cap;
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
        'political_capital',      v_new_cap,
        'party_reward',           v_party_reward,
        'party_penalty',          v_party_penalty,
        'stat_reward',            v_stat_reward,
        'office_gained',          v_office
    );
END;
$$;

-- ── 8. process_annual_january ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.process_annual_january(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_month         int := (p_tick % 12);
    v_year          int := 2000 + (p_tick / 12);
    v_last_year     int;
    v_ages_bumped   int := 0;
    v_caps_bumped   int := 0;
    v_pops_decayed  int := 0;
BEGIN
    IF p_tick IS NULL THEN
        RETURN jsonb_build_object('ran', false, 'reason', 'null_tick');
    END IF;
    IF v_month <> 0 THEN
        RETURN jsonb_build_object('ran', false, 'reason', 'not_january', 'tick', p_tick);
    END IF;

    SELECT last_annual_processed_year INTO v_last_year
      FROM shard WHERE name = 'Alpha Shard' FOR UPDATE;
    IF v_last_year IS NOT NULL AND v_last_year >= v_year THEN
        RETURN jsonb_build_object('ran', false, 'reason', 'already_processed',
            'year', v_year, 'last_processed', v_last_year);
    END IF;

    UPDATE factions
       SET leader_age = COALESCE(leader_age, 0) + 1
     WHERE faction_type IN ('entrepreneur', 'politician')
       AND abandoned_at IS NULL;
    GET DIAGNOSTICS v_ages_bumped = ROW_COUNT;

    UPDATE factions
       SET political_capital = COALESCE(political_capital, 0) + 0.1,
           volunteers        = GREATEST(0, COALESCE(volunteers, 0) - 1)
     WHERE faction_type = 'politician'
       AND abandoned_at IS NULL;
    GET DIAGNOSTICS v_caps_bumped = ROW_COUNT;

    UPDATE factions
       SET popularity_pct = LEAST(popularity_cap_pct, GREATEST(0, COALESCE(popularity_pct, 0) - 2))
     WHERE faction_type = 'movement_party'
       AND abandoned_at IS NULL;
    GET DIAGNOSTICS v_pops_decayed = ROW_COUNT;

    UPDATE shard SET last_annual_processed_year = v_year WHERE name = 'Alpha Shard';

    RETURN jsonb_build_object(
        'ran',                     true,
        'tick',                    p_tick,
        'year',                    v_year,
        'ages_bumped',             v_ages_bumped,
        'political_capital_bumped', v_caps_bumped,
        'parties_decayed',         v_pops_decayed
    );
END;
$$;

NOTIFY pgrst, 'reload schema';

COMMIT;
