-- ════════════════════════════════════════════════════════════════════
-- 20270635 — City Council [Run for Election]: is-or-was Community Organizer
--
-- Three changes lined up behind the user spec:
--
--  1. Loosen the eligibility gate. Today politician_register_for_
--     office('city_council_member') (last touched 20270619) demands
--     v_pol.politician_office = 'community_organizer'. That blocks
--     anyone whose CO term has expired (politician_resolve_expired_
--     terms 20270625 clears the office back to NULL after 12 ticks).
--     New rule: caller must hold OR have held the Community
--     Organizer office. A boolean flag —
--     politician_former_community_organizer — is the cheap, durable
--     marker so the gate is one column read, not a career-events
--     scan on every page load.
--
--  2. Weaken the opponent. Was opp_stat = 1+1d6 (1-6). User spec
--     calls for "1D3 + 1 Skill" — 2-4 — so the City Council race
--     sits between Community (player-anchored ±2) and Senior MP
--     (1+1d6 untouched).
--
--  3. Different win rewards. Currently community + city_council
--     share a reward block in politician_resolve_due_elections
--     (popularity_pct +1, politician_skill +1). Spec splits city_
--     council out: +1 Reputation, +1 popularity_pct (kept), +1
--     popularity_cap_pct (NEW), +100k party_funds (NEW). Community
--     stays on the old reward shape — only city_council changes.
--
-- The 9-tick post-CO-win wait is preserved for the CURRENT-CO branch
-- (mirrors the original "you just won, give it a tick before
-- climbing" cadence) but skipped for the FORMER-CO branch (their
-- term has already elapsed, so the wait would gate them on a clock
-- already run).
--
-- politician_resolve_due_elections is the also the right hook for
-- stamping politician_former_community_organizer when a community
-- win is recorded — keeps "won CO at least once" → "former CO is
-- TRUE" in lockstep with the only path that grants the office.
--
-- Backfill covers both legacy cases:
--   • politicians who currently hold CO (politician_office =
--     'community_organizer'), and
--   • politicians whose career history shows a 'won_election' event
--     with metadata->>'race_tier' = 'community' (term may have
--     expired since).
--
-- Apply after 20270634.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema ─────────────────────────────────────────────────────
ALTER TABLE public.factions
    ADD COLUMN IF NOT EXISTS politician_former_community_organizer boolean
        NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.factions.politician_former_community_organizer IS
    'Sticky flag — TRUE if this politician has ever held the Community Organizer office (currently holding or held in the past). Set by politician_resolve_due_elections on a community win and never cleared. Used by politician_register_for_office to gate city_council eligibility ("must be or have been a Community Organizer") so the action survives the 12-tick CO term ending via politician_resolve_expired_terms. Read on the client (politician-career.html) as politicianFormerCommunityOrganizer.';

REVOKE UPDATE (politician_former_community_organizer) ON public.factions
    FROM PUBLIC, anon, authenticated;

-- ── 2. Backfill ───────────────────────────────────────────────────
-- Current CO holders.
UPDATE public.factions
   SET politician_former_community_organizer = TRUE
 WHERE faction_type = 'politician'
   AND politician_office = 'community_organizer'
   AND politician_former_community_organizer IS DISTINCT FROM TRUE;

-- Past CO winners (term may have expired).
UPDATE public.factions f
   SET politician_former_community_organizer = TRUE
 WHERE f.faction_type = 'politician'
   AND f.politician_former_community_organizer IS DISTINCT FROM TRUE
   AND EXISTS (
       SELECT 1
         FROM politician_career_events e
        WHERE e.faction_id = f.id
          AND e.event_type = 'won_election'
          AND e.metadata->>'race_tier' = 'community'
   );

-- ── 3. politician_register_for_office ─────────────────────────────
-- Body byte-identical to 20270619 except the city_council branch:
-- (a) gate widened to current-OR-former CO, (b) the 9-tick wait
-- only applies to current CO, (c) opp_stat re-rolled as 1d3+1.
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

    IF EXISTS (SELECT 1 FROM politician_active_election WHERE politician_id = v_pol.id) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'race_in_progress');
    END IF;

    IF p_target_office = 'city_council_member' THEN
        -- 20270635: gate widened. The reason code stays
        -- 'wrong_current_office' so existing client handlers fall
        -- through; the 'expected' label below now reads
        -- 'community_organizer_now_or_past' to differentiate the
        -- copy from the old strict-current-CO message.
        IF v_pol.politician_office <> 'community_organizer'
           AND COALESCE(v_pol.politician_former_community_organizer, FALSE) IS NOT TRUE THEN
            RETURN jsonb_build_object('success', false, 'reason', 'wrong_current_office',
                'have', v_pol.politician_office, 'expected', 'community_organizer_now_or_past');
        END IF;
        -- 9-tick wait only applies to caller's CURRENT CO term —
        -- once the term has expired and the flag carries the
        -- eligibility, the cooldown is moot (the clock already ran).
        IF v_pol.politician_office = 'community_organizer' THEN
            v_won_at := COALESCE(v_pol.politician_office_won_at_tick, v_tick);
            IF v_tick < v_won_at + 9 THEN
                RETURN jsonb_build_object('success', false, 'reason', 'too_early',
                    'opens_at_tick', v_won_at + 9, 'current_tick', v_tick);
            END IF;
        END IF;
        v_race_tier := 'city_council';
        v_your_stat := COALESCE(v_pol.politician_skill, 1);
        -- 20270635: opp_stat is now 1d3 + 1 (= 2-4). Was 1+1d6 (1-6).
        v_opp_stat  := 2 + floor(random() * 3)::int;
        v_resolve   := v_tick + 1;
    ELSE
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
            WHEN 'city_council' THEN 'City Council seat'
            WHEN 'senior_mp'    THEN 'Senior MP slot'
        END,
        v_opp_first, v_opp_last, NULL, NULL,
        v_your_stat, v_opp_stat,
        GREATEST(1, LEAST(99, v_poll_you)),
        CASE v_race_tier WHEN 'city_council' THEN 2 ELSE 4 END,
        CASE v_race_tier WHEN 'city_council' THEN 0 ELSE -3 END,
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

-- ── 4. politician_resolve_due_elections ───────────────────────────
-- Body forks the (community, city_council) reward branch so the
-- two tiers can carry different payouts. Community keeps its
-- legacy +1 popularity_pct / +1 skill. City Council swaps to:
--   • +1 politician_reputation
--   • +1 popularity_pct        (was already given here)
--   • +1 popularity_cap_pct    (NEW — raises the party's pop ceiling)
--   • +100_000 party_funds     (NEW — cash injection)
-- Reputation is numeric since 20270631, so the +1 lands cleanly.
-- popularity_cap_pct UPDATE is REVOKE'd from authenticated
-- (20270457); SECURITY DEFINER bypasses that for this stamp.
-- Sets politician_former_community_organizer=TRUE on every community
-- win — keeps the eligibility flag in lockstep with the office grant.
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
        ELSIF v_race.race_tier = 'community' THEN
            -- Legacy reward shape — popularity bump only.
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
            -- 20270635: City Council reward bundle — popularity +1,
            -- ceiling +1, funds +100K. The triple-update returns the
            -- three new values in one round trip and packs them into
            -- v_party_reward as a single block so the client can
            -- surface the full payout in one toast/banner.
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
               SET politician_influence = COALESCE(politician_influence, 1) + 1
             WHERE id = v_pol.id
            RETURNING politician_influence INTO v_new_cha;
            v_stat_reward := jsonb_build_object('kind', 'influence', 'delta', 1, 'new_value', v_new_cha);
        ELSIF v_race.race_tier = 'community' THEN
            UPDATE factions
               SET politician_skill = COALESCE(politician_skill, 1) + 1
             WHERE id = v_pol.id
            RETURNING politician_skill INTO v_new_cred;
            v_stat_reward := jsonb_build_object('kind', 'skill', 'delta', 1, 'new_value', v_new_cred);
        ELSIF v_race.race_tier = 'city_council' THEN
            -- 20270635: City Council win bumps Reputation (numeric
            -- since 20270631), not Skill. Different lane than the
            -- community-organizer hit.
            UPDATE factions
               SET politician_reputation = COALESCE(politician_reputation, 0) + 1
             WHERE id = v_pol.id
            RETURNING politician_reputation INTO v_new_rep;
            v_stat_reward := jsonb_build_object('kind', 'reputation', 'delta', 1, 'new_value', v_new_rep);
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
        -- 20270635: community win stamps the former-CO flag so the
        -- City Council [Run for Election] gate keeps eligibility
        -- after the 12-tick term elapses.
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
        'political_capital',      v_new_cap,
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
