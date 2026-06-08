-- ════════════════════════════════════════════════════════════════════
-- 20270719 — Mayor 48-tick term + auto re-election
--
-- Player mayors now hold a 48-tick term (48 months @ 12 ticks/year =
-- 4 years; canonical conversion from js/utils.js:tickToYear). When
-- the term expires, the system files a fresh Mayor race against a
-- new NPC opponent on the same city — no manual action from the
-- player. Win extends the term; lose evicts them and the city gets
-- a freshly-rolled NPC mayor back in the chair.
--
-- Three changes:
--
-- 1. ADD COLUMN cities.mayor_term_end_tick int. NULL means "no term"
--    (NPC mayors and pre-mechanic legacy rows); a value means the
--    sitting mayor's term ends at that tick. Only the resolver sets
--    it — on Mayor win it stamps v_tick + 48, on incumbent loss it
--    clears back to NULL.
--
-- 2. Re-emit politician_resolve_due_elections to:
--    a) stamp mayor_term_end_tick = v_tick + 48 on Mayor WIN
--       (alongside the 20270712 first/last/age/party_id stamps and
--       the 20270718 archetype-clear);
--    b) handle INCUMBENT LOSS — if the player was the current mayor
--       of the contested city and lost re-election, evict them:
--       cities row gets a fresh NPC mayor (random name from the
--       nation pools), party_id NULLed, term_end_tick cleared,
--       AND clear the player's politician_office / won_at_tick so
--       the career ladder reads truthfully. A non-incumbent loss
--       (player ran for a city they didn't already hold) leaves
--       both the cities row and the player's office alone — the
--       20270713 "already_holds_office" guard usually prevents that
--       case anyway, but the resolver shouldn't assume.
--
-- 3. New RPC politician_resolve_expired_mayor_term — called from
--    politician-home.html and politician-career.html alongside the
--    existing resolve_due_elections + resolve_expired_terms. Checks
--    the caller's politician_office='mayor', finds their city via
--    name+party match (V2 cleanup: factions.politician_office_city
--    _id would let us skip the join — punted, single-mayor-per
--    -player makes the match unambiguous today), and if the term
--    has expired files a fresh Mayor race against a 45+1d10 NPC
--    opponent (same dice as the manual register path from 20270713).
--    Career event written with metadata.auto_reelection=true so the
--    timeline distinguishes auto from manual entries.
--
-- Defensive backfill: any city whose sitting mayor matches a real
-- politician faction with politician_office='mayor' (party_id +
-- leader name) gets mayor_term_end_tick = current_tick + 48 so
-- their term doesn't fire instantly on the next page load. NPC
-- mayors keep mayor_term_end_tick = NULL.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema: mayor_term_end_tick on cities ──────────────────────
ALTER TABLE public.cities
    ADD COLUMN IF NOT EXISTS mayor_term_end_tick int;

COMMENT ON COLUMN public.cities.mayor_term_end_tick IS
    '20270719: tick at which the sitting Mayor''s 48-tick term expires. NULL = no term (NPC mayor, or pre-mechanic legacy row). Set on Mayor WIN to v_tick + 48; cleared on incumbent LOSS (player evicted). Drives politician_resolve_expired_mayor_term''s auto-re-election trigger.';

-- ── 2. Backfill any existing player-held mayoralty ────────────────
-- Match on nation + party + leader name so NPC seeds stay at NULL
-- and only actual player mayors (politician faction row with
-- politician_office='mayor' present) get a fresh 48-tick window.
-- Idempotent on re-run via the term_end_tick IS NULL guard.
UPDATE public.cities c
   SET mayor_term_end_tick = (
       SELECT current_tick + 48 FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1
   )
 WHERE c.mayor_term_end_tick IS NULL
   AND c.mayor_party_id IS NOT NULL
   AND EXISTS (
       SELECT 1 FROM public.factions f
        WHERE f.faction_type = 'politician'
          AND f.abandoned_at IS NULL
          AND f.politician_office = 'mayor'
          AND f.politician_party_id = c.mayor_party_id
          AND f.leader_first_name  = c.mayor_first_name
          AND f.leader_last_name   = c.mayor_last_name
   );


-- ── 3. Re-emit politician_resolve_due_elections ───────────────────
-- Body byte-faithful to 20270718 except:
--   • Mayor WIN UPDATE adds mayor_term_end_tick = v_tick + 48.
--   • Mayor LOSS now handles incumbent eviction: re-roll a fresh
--     NPC mayor on the cities row, clear party_id + term_end_tick,
--     clear the player's politician_office + won_at_tick. Guarded on
--     race_tier='mayor' + v_race.city_id NOT NULL + incumbent match
--     (cities row's current mayor IS the player) so a non-incumbent
--     loss leaves both rows untouched.
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
    v_city_stamp   jsonb;
    v_city_row     cities%ROWTYPE;
    v_first_pool   text[];
    v_last_pool    text[];
    v_evict_first  text;
    v_evict_last   text;
    v_was_incumbent boolean;
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

    -- Party rewards — unchanged from 20270712.
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
        ELSIF v_race.race_tier = 'mayor' THEN
            UPDATE factions
               SET popularity_pct = LEAST(
                       COALESCE(popularity_cap_pct, 100),
                       COALESCE(popularity_pct, 0) + 2
                   ),
                   party_funds    = COALESCE(party_funds, 0) + 200000
             WHERE id = v_race.party_id
               AND faction_type = 'movement_party'
               AND abandoned_at IS NULL
            RETURNING popularity_pct, party_funds, faction_name
                 INTO v_party_pop, v_party_funds, v_party_name;
            IF FOUND THEN
                v_party_reward := jsonb_build_object(
                    'kind',             'mayor',
                    'popularity_delta', 2,
                    'popularity_new',   v_party_pop,
                    'funds_delta',      200000,
                    'funds_new',        v_party_funds,
                    'party_name',       v_party_name
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

    -- Player stat reward — unchanged from 20270709.
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

        -- Mayor WIN city stamp. 20270719: also writes mayor_term_end
        -- _tick = v_tick + 48 so the 48-tick term clock starts on win
        -- (or restart on successful re-election).
        IF v_race.race_tier = 'mayor' AND v_race.city_id IS NOT NULL THEN
            UPDATE cities
               SET mayor_first_name    = v_pol.leader_first_name,
                   mayor_last_name     = v_pol.leader_last_name,
                   mayor_age           = COALESCE(v_pol.leader_age, mayor_age),
                   mayor_archetype     = NULL,
                   mayor_party_id      = v_pol.politician_party_id,
                   mayor_term_end_tick = v_tick + 48
             WHERE id = v_race.city_id;
            IF FOUND THEN
                v_city_stamp := jsonb_build_object(
                    'city_id',             v_race.city_id,
                    'mayor_first',         v_pol.leader_first_name,
                    'mayor_last',          v_pol.leader_last_name,
                    'mayor_party_id',      v_pol.politician_party_id,
                    'mayor_term_end_tick', v_tick + 48
                );
            END IF;
        END IF;
    END IF;

    -- 20270719: Mayor LOSS — incumbent eviction. If the player was
    -- the sitting mayor of the contested city and they just lost
    -- re-election, replace them with a fresh NPC mayor and clear
    -- their politician_office. A non-incumbent mayor loss (player
    -- ran for a city they didn't already hold) is left alone —
    -- the contested city's NPC just stays put. Match the incumbent
    -- by party + leader name (same shape as the backfill above).
    IF NOT v_won AND v_race.race_tier = 'mayor' AND v_race.city_id IS NOT NULL THEN
        SELECT * INTO v_city_row FROM cities WHERE id = v_race.city_id;
        v_was_incumbent :=
            v_city_row.id IS NOT NULL
            AND v_city_row.mayor_party_id   = v_pol.politician_party_id
            AND v_city_row.mayor_first_name = v_pol.leader_first_name
            AND v_city_row.mayor_last_name  = v_pol.leader_last_name;
        IF v_was_incumbent THEN
            SELECT first_name_pool, last_name_pool INTO v_first_pool, v_last_pool
              FROM nations WHERE id = v_pol.nation_id;
            v_evict_first := COALESCE(pick_random_pool_name(v_first_pool), 'Mayor');
            v_evict_last  := COALESCE(pick_random_pool_name(v_last_pool),  'Smith');
            UPDATE cities
               SET mayor_first_name    = v_evict_first,
                   mayor_last_name     = v_evict_last,
                   mayor_age           = 35 + floor(random() * 31)::int,
                   mayor_archetype     = NULL,
                   mayor_party_id      = NULL,
                   mayor_term_end_tick = NULL
             WHERE id = v_race.city_id;
            UPDATE factions
               SET politician_office             = NULL,
                   politician_office_won_at_tick = NULL
             WHERE id = v_pol.id;
            v_city_stamp := jsonb_build_object(
                'city_id',    v_race.city_id,
                'evicted',    true,
                'new_mayor',  v_evict_first || ' ' || v_evict_last
            );
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
            'office_gained',          v_office,
            'city_id',                v_race.city_id,
            'city_stamp',             v_city_stamp
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
        'office_gained',          v_office,
        'city_stamp',             v_city_stamp
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_resolve_due_elections() TO authenticated;


-- ── 4. New RPC: politician_resolve_expired_mayor_term ─────────────
-- Called from the politician pages on load (after the existing
-- resolve_due_elections + resolve_expired_terms calls). For the
-- caller's politician faction, if politician_office='mayor' AND
-- the city they mayor has hit its term_end_tick AND there's no
-- race already in flight, files a fresh Mayor race against a
-- 45+1d10 NPC opponent (same dice as the manual register path).
--
-- City match is by nation + party + leader name. That tuple is
-- unambiguous today (one mayor per player, one player per
-- politician faction). A V2 cleanup would add factions.politician
-- _office_city_id and skip the join — punted to keep this commit
-- narrow.
CREATE OR REPLACE FUNCTION public.politician_resolve_expired_mayor_term()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_pol          factions%ROWTYPE;
    v_tick         int;
    v_shard_id     uuid;
    v_city         cities%ROWTYPE;
    v_first_pool   text[];
    v_last_pool    text[];
    v_opp_first    text;
    v_opp_last     text;
    v_opp_stat     int;
    v_your_stat    int;
    v_player_share numeric;
    v_poll_you     int;
    v_poll_opp     int;
    v_poll_und     int;
    v_resolve      int;
    v_district     text;
    v_opp_blurb    text;
    v_next_action  int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', true, 'resolved', false, 'reason', 'not_authenticated');
    END IF;

    SELECT current_tick, id INTO v_tick, v_shard_id
      FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', true, 'resolved', false, 'reason', 'no_shard');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     LIMIT 1;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', true, 'resolved', false);
    END IF;

    -- Cheap exit lanes. Order matters: mayor check first (most
    -- callers won't be), then party check (auto-re-election needs
    -- a party_id stamped on the race row), then active-race check
    -- (don't double-file).
    IF v_pol.politician_office <> 'mayor' THEN
        RETURN jsonb_build_object('success', true, 'resolved', false);
    END IF;
    IF v_pol.politician_party_id IS NULL THEN
        RETURN jsonb_build_object('success', true, 'resolved', false, 'reason', 'no_party');
    END IF;
    IF EXISTS (SELECT 1 FROM politician_active_election WHERE politician_id = v_pol.id) THEN
        RETURN jsonb_build_object('success', true, 'resolved', false, 'reason', 'race_in_progress');
    END IF;

    SELECT * INTO v_city FROM cities
     WHERE nation_id         = v_pol.nation_id
       AND mayor_party_id    = v_pol.politician_party_id
       AND mayor_first_name  = v_pol.leader_first_name
       AND mayor_last_name   = v_pol.leader_last_name
     LIMIT 1;
    IF v_city.id IS NULL THEN
        RETURN jsonb_build_object('success', true, 'resolved', false, 'reason', 'city_not_found');
    END IF;
    IF v_city.mayor_term_end_tick IS NULL THEN
        RETURN jsonb_build_object('success', true, 'resolved', false, 'reason', 'no_term_set');
    END IF;
    IF v_tick < v_city.mayor_term_end_tick THEN
        RETURN jsonb_build_object('success', true, 'resolved', false,
            'remaining_ticks',     v_city.mayor_term_end_tick - v_tick,
            'mayor_term_end_tick', v_city.mayor_term_end_tick);
    END IF;

    -- Term expired. File a fresh Mayor race — same shape as the
    -- politician_register_for_office mayor branch (20270713 dice).
    SELECT first_name_pool, last_name_pool INTO v_first_pool, v_last_pool
      FROM nations WHERE id = v_pol.nation_id;
    v_opp_first := COALESCE(pick_random_pool_name(v_first_pool), 'Opponent');
    v_opp_last  := COALESCE(pick_random_pool_name(v_last_pool),  'Smith');

    v_your_stat := COALESCE(v_pol.politician_skill, 1);
    v_opp_stat  := 46 + floor(random() * 10)::int;          -- 45 + 1d10
    v_resolve   := v_tick + 1;
    v_district  := COALESCE(v_city.city_name, 'a city');
    v_opp_blurb := 'Term-end challenger for the ' || COALESCE(v_city.city_name, 'city') || ' mayoralty';

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
        party_id, city_id
    ) VALUES (
        v_pol.id, v_shard_id, 'mayor', v_district,
        v_opp_first, v_opp_last, v_opp_blurb, NULL,
        v_your_stat, v_opp_stat,
        GREATEST(1, LEAST(99, v_poll_you)),
        0, 0,
        v_resolve,
        v_poll_you, v_poll_opp, v_poll_und,
        v_pol.politician_party_id, v_city.id
    );

    v_next_action := v_tick + 1;
    UPDATE factions SET next_member_action_tick = v_next_action WHERE id = v_pol.id;

    INSERT INTO politician_career_events (
        faction_id, event_tick, event_type, target_name, metadata
    ) VALUES (
        v_pol.id, v_tick, 'stood_for_election', v_district,
        jsonb_build_object(
            'race_tier',       'mayor',
            'your_stat',       v_your_stat,
            'opp_stat',        v_opp_stat,
            'opponent',        v_opp_first || ' ' || v_opp_last,
            'resolve_tick',    v_resolve,
            'polling_you',     v_poll_you,
            'polling_opp',     v_poll_opp,
            'polling_und',     v_poll_und,
            'city_id',         v_city.id,
            'auto_reelection', true
        )
    );

    RETURN jsonb_build_object(
        'success',         true,
        'resolved',        true,
        'auto_reelection', true,
        'city_name',       v_city.city_name,
        'city_id',         v_city.id,
        'opponent',        v_opp_first || ' ' || v_opp_last,
        'resolve_tick',    v_resolve,
        'your_stat',       v_your_stat,
        'opp_stat',        v_opp_stat,
        'win_odds_pct',    GREATEST(1, LEAST(99, v_poll_you))
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_resolve_expired_mayor_term() TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
