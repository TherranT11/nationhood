-- ════════════════════════════════════════════════════════════════════
-- Tier 2 office races: City Council Member + Senior MP
--
-- Per-rung registration that replaces the "global Stand for Election
-- locks you out at Tier 1" UX. Office-holders get a [Register to Run]
-- (Government & State ladder) or [Register] (Party Office ladder)
-- button on the next-up rung instead. Eligibility windows tie the
-- new races to a meaningful moment:
--
--   community_organizer → city_council_member
--       Eligible 9 ticks after winning the CO seat. Resolves 1 tick
--       after registration (community-style cadence).
--
--   member_of_parliament → senior_mp
--       Eligible within 3 ticks of the nation's next general election.
--       Resolves AT the general-election tick — assembly seat
--       reallocation and the Senior MP advancement land together.
--
-- ── Opponent generation ─────────────────────────────────────────────
-- 1D6 roll on the relevant stat: credibility for City Council, charisma
-- for Senior MP. Name pulled from the nation's first/last pools (same
-- helper officer auto-fill uses). Polling derived as a stat-share split
-- with 15% undecided so the resolver's polling_you > polling_opp logic
-- decides the winner deterministically per registration.
--   polling_you = ROUND(your_stat / (your_stat + opp_stat) × 85)
--   polling_opp = 85 − polling_you
--   undecided   = 15
-- A credibility-5 challenger against a 1D6=3 opponent polls 53/32/15;
-- a credibility-1 challenger against 1D6=6 polls 12/73/15.
--
-- ── Rewards on win (mirrors Tier 1 cadence) ────────────────────────
--   City Council: +1 credibility, party +1 popularity, office advances
--   Senior MP:    +1 charisma,    party +1 seat,       office advances
-- Loss: no stat change, office stays at Tier 1, no party reward.
--
-- ── Office stamping ─────────────────────────────────────────────────
-- factions.politician_office moves to the new value on win.
-- factions.politician_office_won_at_tick (new column) records when —
-- the City Council eligibility window reads from it; future tiers
-- can extend the same pattern.
--
-- ── Pipeline integration ────────────────────────────────────────────
-- New races land as politician_active_election rows with race_tier
-- in {'city_council', 'senior_mp'}. The existing door_knock /
-- give_speech campaign actions already operate on whichever row
-- they find for the politician, so campaigning works on Tier 2 races
-- for free. politician_resolve_due_elections grows new branches to
-- handle the new race_tier values; existing 'community' / 'parliament'
-- paths unchanged.
--
-- ── Deferred ────────────────────────────────────────────────────────
-- * Tier 3 rungs (City Council President, High Ranking Party Member).
--   Frontend renders them inert; this migration doesn't add their
--   resolve hooks.
-- * politician_stand_for_election's already_in_office gate (20270418)
--   stays in place as a safety net — the UI hides the global Stand
--   for Election button when an office is held, so the RPC shouldn't
--   normally see the case.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema ───────────────────────────────────────────────────────
ALTER TABLE factions
    ADD COLUMN IF NOT EXISTS politician_office_won_at_tick int;

COMMENT ON COLUMN factions.politician_office_won_at_tick IS
    'Tick at which factions.politician_office was last set. Read by Tier 2 eligibility windows (City Council opens 9 ticks after CO win). Set by politician_resolve_due_elections on every winning office advance.';

-- REVOKE so clients can't direct-clear the timestamp and shortcut the
-- eligibility window — same posture as politician_office itself.
REVOKE UPDATE (politician_office_won_at_tick) ON factions FROM PUBLIC, anon, authenticated;

-- Expand the CHECK constraint to cover the new offices.
ALTER TABLE factions DROP CONSTRAINT IF EXISTS factions_politician_office_chk;
ALTER TABLE factions
    ADD CONSTRAINT factions_politician_office_chk
    CHECK (politician_office IS NULL
           OR politician_office IN (
               'community_organizer', 'member_of_parliament',
               'city_council_member', 'senior_mp'
           ));

-- politician_active_election.race_tier needs to accept the new values.
-- If there's a CHECK on that column it'd be in a 20270398-ish file;
-- defensive DROP/RE-ADD handles either case (constraint absent → DROP
-- IF EXISTS is a no-op).
ALTER TABLE politician_active_election DROP CONSTRAINT IF EXISTS politician_active_election_race_tier_check;
ALTER TABLE politician_active_election
    ADD CONSTRAINT politician_active_election_race_tier_check
    CHECK (race_tier IN ('community', 'parliament', 'city_council', 'senior_mp'));

-- ── 2. politician_register_for_office ───────────────────────────────
-- The new per-rung registration RPC. Single entry-point for both Tier 2
-- races — branches on p_target_office for the eligibility check and
-- the opponent-stat formula.
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
    IF p_target_office NOT IN ('city_council_member', 'senior_mp') THEN
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

    -- One active race per politician (same gate as politician_stand_for_election).
    IF EXISTS (SELECT 1 FROM politician_active_election WHERE politician_id = v_pol.id) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'race_in_progress');
    END IF;

    -- Per-target eligibility + target-specific parameters.
    IF p_target_office = 'city_council_member' THEN
        IF v_pol.politician_office <> 'community_organizer' THEN
            RETURN jsonb_build_object('success', false, 'reason', 'wrong_current_office',
                'have', v_pol.politician_office, 'expected', 'community_organizer');
        END IF;
        v_won_at := COALESCE(v_pol.politician_office_won_at_tick, v_tick);
        IF v_tick < v_won_at + 9 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'too_early',
                'opens_at_tick', v_won_at + 9, 'current_tick', v_tick);
        END IF;
        v_race_tier := 'city_council';
        v_your_stat := COALESCE(v_pol.politician_credibility, 1);
        v_opp_stat  := 1 + floor(random() * 6)::int;  -- 1D6
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
        v_your_stat := COALESCE(v_pol.politician_charisma, 1);
        v_opp_stat  := 1 + floor(random() * 6)::int;  -- 1D6
        v_resolve   := v_next_elect;
    END IF;

    -- Roll opponent name from the nation's pool (same helper as
    -- 20270415's officer auto-fill).
    SELECT first_name_pool, last_name_pool INTO v_first_pool, v_last_pool
      FROM nations WHERE id = v_pol.nation_id;
    v_opp_first := COALESCE(pick_random_pool_name(v_first_pool), 'Opponent');
    v_opp_last  := COALESCE(pick_random_pool_name(v_last_pool),  'Smith');

    -- Polling: stat-share split with 15 undecided.
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
        -- District string is the race label the UI surfaces; opponent
        -- generation doesn't bother with a specific district name today.
        CASE v_race_tier
            WHEN 'city_council' THEN 'City Council seat'
            WHEN 'senior_mp'    THEN 'Senior MP slot'
        END,
        v_opp_first, v_opp_last, NULL, NULL,
        v_your_stat, v_opp_stat,
        -- win_odds_pct historical column: store the polling lead as
        -- a rough proxy so the existing UI surfaces something sensible.
        GREATEST(1, LEAST(99, v_poll_you)),
        -- Stakes on win/loss influence: small +/- so Tier 2 doesn't
        -- swing personal influence harder than Tier 1.
        CASE v_race_tier WHEN 'city_council' THEN 2 ELSE 4 END,
        CASE v_race_tier WHEN 'city_council' THEN 0 ELSE -3 END,
        v_resolve,
        v_poll_you, v_poll_opp, v_poll_und,
        v_pol.politician_party_id
    );

    -- 1-per-tick member-action gate (same as politician_stand_for_election).
    v_next_action := v_tick + 1;
    UPDATE factions SET next_member_action_tick = v_next_action WHERE id = v_pol.id;

    -- Log the stand for the career page's event feed.
    INSERT INTO politician_career_events (
        faction_id, event_tick, event_type, target_name, metadata
    ) VALUES (
        v_pol.id, v_tick, 'stood_for_election',
        CASE v_race_tier WHEN 'city_council' THEN 'City Council seat' ELSE 'Senior MP slot' END,
        jsonb_build_object(
            'race_tier',      v_race_tier,
            'opponent',       v_opp_first || ' ' || v_opp_last,
            'opp_party_name', NULL,
            'win_odds_pct',   v_poll_you,
            'opp_stat',       v_opp_stat,
            'your_stat',      v_your_stat
        )
    );

    RETURN jsonb_build_object(
        'success',                true,
        'race_tier',              v_race_tier,
        'target_office',          p_target_office,
        'opponent',               v_opp_first || ' ' || v_opp_last,
        'opp_stat',               v_opp_stat,
        'your_stat',              v_your_stat,
        'resolve_tick',           v_resolve,
        'polling_you_pct',        v_poll_you,
        'polling_opp_pct',        v_poll_opp,
        'polling_undecided_pct',  v_poll_und,
        'next_member_action_tick', v_next_action
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_register_for_office(text) TO authenticated;

-- ── 3. politician_resolve_due_elections — handle new race tiers ─────
-- Body = 20270418 + branches for city_council / senior_mp. The Tier 1
-- (community / parliament) paths are byte-for-byte the same. New: the
-- politician_office_won_at_tick column is stamped on every winning
-- office advance.
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
    v_new_cha      int;
    v_new_cred     int;
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

    -- Party reward on win. Tier 1 (community/parliament): +1 popularity
    -- or +1 seat (per 20270418). Tier 2 mirrors the same rewards on
    -- the same axes — City Council = popularity, Senior MP = seat.
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
               SET popularity_pct = LEAST(100, COALESCE(popularity_pct, 0) + 1)
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

    -- Personal stat reward on win. Tier 2 hugs the same axis as Tier 1.
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
        'stat_reward',          v_stat_reward,
        'office_gained',        v_office
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_resolve_due_elections() TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
