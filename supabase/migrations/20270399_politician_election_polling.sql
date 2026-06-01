-- ════════════════════════════════════════════════════════════════════
-- ELECTION POLLING — promote polling to a real game variable
-- ════════════════════════════════════════════════════════════════════
-- 20270398 shipped active elections that resolved by rolling random vs
-- win_odds_pct. The Pressing Issues mock-up asks for polling that the
-- player can actually move with campaign actions, with resolution
-- driven by the polling line itself instead of an independent roll.
--
-- ── Polling model ──
-- Three columns on politician_active_election (sum ≈ 100):
--   polling_you_pct, polling_opp_pct, polling_undecided_pct
--
-- Seeded at commit time off win_odds_pct, with a small launch deficit
-- (per the mock-up's "initial poll had you eight points behind" flavor):
--   polling_undecided = 15  (constant)
--   polling_you       = win_odds_pct - 8
--   polling_opp       = 100 - polling_you - polling_undecided
-- All three clamped to [0, 100].
--
-- ── Action effects on polling (in addition to existing party / influence
--    effects — the RPCs are extended, not replaced) ──
--
--   Door knock:        +2 polling_you, taken from undecided
--                      (falls through to opp if undecided depleted)
--   Speech (bracket):
--     bad   (≤3):      -2 polling_you, +2 polling_opp
--     ok    (4-6):     +2 polling_you, taken from undecided / opp
--     good  (≥7):      +5 polling_you, taken from undecided / opp
--
-- ── Resolution ──
-- politician_resolve_due_elections compares polling_you vs polling_opp.
-- Higher wins; ties broken at random. The undecided bucket is irrelevant
-- to the resolution math (it's only there so actions don't feel zero-sum
-- — you can convert undecideds without taking from the opponent).
--
-- The "wait one extra tick after resolve_tick" rule (resolve_tick < v_tick
-- instead of <=) gives the player the FULL resolve_tick window to take
-- their last campaign action without the page-load resolve racing them.
-- That changes the real wall-clock cycle slightly:
--   Community  · 1 act window  · resolves visit after resolve_tick
--   Parliament · 2 act windows · resolves visit after resolve_tick
-- The "N ticks remaining" UI label = MAX(0, resolve_tick - current_tick)
-- still represents act windows remaining honestly.
--
-- ── One source of truth ──
-- The polling-bump logic lives inline in each action RPC (door_knock +
-- give_speech). Extracting to a SQL helper would be over-engineering for
-- two callers; documented here so the duplication is intentional and
-- bounded — if a third action ever lands, we promote to a helper.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE politician_active_election
    ADD COLUMN IF NOT EXISTS polling_you_pct       INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS polling_opp_pct       INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS polling_undecided_pct INT NOT NULL DEFAULT 0;

-- ── politician_stand_for_election — seed polling at commit ──
--
-- Body otherwise verbatim from 20270398; only the INSERT into
-- politician_active_election grows three more columns + their seed
-- computation.
CREATE OR REPLACE FUNCTION public.politician_stand_for_election(p_party_id uuid, p_tier text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_shard_id  uuid;
    v_offer     politician_election_offers%ROWTYPE;
    v_next      int;
    v_resolve   int;
    v_district  text;
    v_opp_first text;
    v_opp_last  text;
    v_opp_blurb text;
    v_opp_pname text;
    v_your      int;
    v_opp       int;
    v_odds      int;
    v_win       int;
    v_lose      int;
    v_poll_you  int;
    v_poll_opp  int;
    v_poll_und  int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_tier NOT IN ('community','parliament') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_tier');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND politician_party_id = p_party_id
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;

    SELECT current_tick, id INTO v_tick, v_shard_id FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    IF EXISTS (SELECT 1 FROM politician_active_election WHERE politician_id = v_pol.id) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'race_in_progress');
    END IF;

    IF v_pol.next_member_action_tick IS NOT NULL
       AND v_pol.next_member_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_member_action_tick);
    END IF;

    SELECT * INTO v_offer FROM politician_election_offers WHERE politician_id = v_pol.id;
    IF v_offer.politician_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_offer');
    END IF;

    IF p_tier = 'community' THEN
        v_district  := v_offer.com_district;
        v_opp_first := v_offer.com_opp_first;
        v_opp_last  := v_offer.com_opp_last;
        v_opp_blurb := v_offer.com_opp_blurb;
        v_opp_pname := NULL;
        v_your      := v_offer.com_your_stat;
        v_opp       := v_offer.com_opp_stat;
        v_odds      := v_offer.com_odds_pct;
        v_win       := v_offer.com_stake_win;
        v_lose      := v_offer.com_stake_lose;
        v_resolve   := v_tick + 1;
    ELSE
        v_district  := v_offer.parl_district;
        v_opp_first := v_offer.parl_opp_first;
        v_opp_last  := v_offer.parl_opp_last;
        v_opp_blurb := v_offer.parl_opp_blurb;
        v_opp_pname := v_offer.parl_opp_party_name;
        v_your      := v_offer.parl_your_stat;
        v_opp       := v_offer.parl_opp_stat;
        v_odds      := v_offer.parl_odds_pct;
        v_win       := v_offer.parl_stake_win;
        v_lose      := v_offer.parl_stake_lose;
        v_resolve   := v_tick + 2;
    END IF;

    -- Polling seed: you = win_odds - 8, undecided = 15, opp absorbs rest.
    -- Clamp each at [0, 100]; the rounding only matters at the edges
    -- (win_odds clamps to [15, 85] by construction, so min you = 7 and
    -- max you = 77 — far from the clamp boundaries in practice).
    v_poll_you := GREATEST(0, LEAST(100, v_odds - 8));
    v_poll_und := 15;
    v_poll_opp := GREATEST(0, 100 - v_poll_you - v_poll_und);

    INSERT INTO politician_active_election (
        politician_id, shard_id, race_tier, district,
        opp_first, opp_last, opp_blurb, opp_party_name,
        your_stat, opp_stat, win_odds_pct, stake_win, stake_lose,
        resolve_tick,
        polling_you_pct, polling_opp_pct, polling_undecided_pct
    ) VALUES (
        v_pol.id, v_shard_id, p_tier, v_district,
        v_opp_first, v_opp_last, v_opp_blurb, v_opp_pname,
        v_your, v_opp, v_odds, v_win, v_lose,
        v_resolve,
        v_poll_you, v_poll_opp, v_poll_und
    );

    DELETE FROM politician_election_offers WHERE politician_id = v_pol.id;

    v_next := v_tick + 1;
    UPDATE factions
       SET next_member_action_tick = v_next
     WHERE id = v_pol.id;

    RETURN jsonb_build_object(
        'success', true,
        'race_tier', p_tier,
        'district', v_district,
        'opp_full_name', v_opp_first || ' ' || v_opp_last,
        'win_odds_pct', v_odds,
        'resolve_tick', v_resolve,
        'next_member_action_tick', v_next,
        'polling_you_pct', v_poll_you,
        'polling_opp_pct', v_poll_opp,
        'polling_undecided_pct', v_poll_und
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_stand_for_election(uuid, text) TO authenticated;

-- ── politician_door_knock — now bumps race polling when in a race ──
--
-- Body verbatim from 20270382 plus a single conditional polling block
-- after the party/influence updates. No effect when not in a race;
-- existing party.html callers see no behavior change.
CREATE OR REPLACE FUNCTION public.politician_door_knock(p_party_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_pol     factions%ROWTYPE;
    v_tick    int;
    v_next    int;
    v_new_pop numeric;
    v_new_inf numeric;
    v_race    politician_active_election%ROWTYPE;
    v_gain    constant int := 2;
    v_und_take int;
    v_opp_take int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND politician_party_id = p_party_id
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1;
    IF v_pol.id IS NULL THEN
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

    UPDATE factions
       SET popularity_pct = LEAST(100, GREATEST(0, COALESCE(popularity_pct, 0) + 0.1))
     WHERE id = p_party_id
       AND faction_type = 'movement_party'
    RETURNING popularity_pct INTO v_new_pop;
    IF v_new_pop IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'party_not_found');
    END IF;

    v_next := v_tick + 1;
    UPDATE factions
       SET politician_influence    = COALESCE(politician_influence, 0) + 0.1,
           next_member_action_tick = v_next
     WHERE id = v_pol.id
    RETURNING politician_influence INTO v_new_inf;

    -- Polling bump (race-only). +2 to polling_you, drawn from undecided
    -- first then opp. No-op when not in a race.
    SELECT * INTO v_race FROM politician_active_election WHERE politician_id = v_pol.id;
    IF v_race.politician_id IS NOT NULL THEN
        v_und_take := LEAST(v_gain, v_race.polling_undecided_pct);
        v_opp_take := v_gain - v_und_take;
        UPDATE politician_active_election
           SET polling_you_pct       = LEAST(100, polling_you_pct + v_gain),
               polling_undecided_pct = polling_undecided_pct - v_und_take,
               polling_opp_pct       = GREATEST(0, polling_opp_pct - v_opp_take)
         WHERE politician_id = v_pol.id;
    END IF;

    RETURN jsonb_build_object(
        'success',                 true,
        'popularity_pct',          v_new_pop,
        'politician_influence',    v_new_inf,
        'next_member_action_tick', v_next
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.politician_door_knock(uuid) TO authenticated;

-- ── politician_give_speech — now bumps race polling per bracket ──
--
-- Body verbatim from 20270382 plus a bracket-keyed polling block after
-- the party/influence updates. Polling deltas:
--   bad  → -2 to you, +2 to opp           (you got booed; opp benefited)
--   ok   → +2 to you (from und → opp)     (modest gain)
--   good → +5 to you (from und → opp)     (real momentum)
CREATE OR REPLACE FUNCTION public.politician_give_speech(p_party_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_speech_cd int;
    v_next      int;
    v_roll      int;
    v_total     int;
    v_bracket   text;
    v_pop_delta numeric := 0;
    v_inf_delta numeric := 0;
    v_new_pop   numeric;
    v_new_inf   numeric;
    v_race      politician_active_election%ROWTYPE;
    v_poll_gain int := 0;
    v_und_take  int;
    v_opp_take  int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND politician_party_id = p_party_id
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1;
    IF v_pol.id IS NULL THEN
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
    IF v_pol.speech_cooldown_until_tick IS NOT NULL
       AND v_pol.speech_cooldown_until_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.speech_cooldown_until_tick);
    END IF;

    v_roll  := 1 + floor(random() * 6)::int;
    v_total := v_roll + COALESCE(v_pol.politician_charisma, 0);

    IF v_total <= 3 THEN
        v_bracket   := 'bad';
        v_pop_delta := -2;
        v_inf_delta := -1;
    ELSIF v_total <= 6 THEN
        v_bracket   := 'ok';
        v_pop_delta := 1;
    ELSE
        v_bracket   := 'good';
        v_pop_delta := 1;
        v_inf_delta := 1;
    END IF;

    UPDATE factions
       SET popularity_pct = LEAST(100, GREATEST(0, COALESCE(popularity_pct, 0) + v_pop_delta))
     WHERE id = p_party_id
       AND faction_type = 'movement_party'
    RETURNING popularity_pct INTO v_new_pop;
    IF v_new_pop IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'party_not_found');
    END IF;

    v_speech_cd := v_tick + 3;
    v_next      := v_tick + 1;
    UPDATE factions
       SET politician_influence       = GREATEST(0, COALESCE(politician_influence, 0) + v_inf_delta),
           speech_cooldown_until_tick = v_speech_cd,
           next_member_action_tick    = v_next
     WHERE id = v_pol.id
    RETURNING politician_influence INTO v_new_inf;

    -- Polling bump (race-only). Bracket-driven; bad gives the boost to
    -- opp, ok / good pull from undecided first then opp.
    SELECT * INTO v_race FROM politician_active_election WHERE politician_id = v_pol.id;
    IF v_race.politician_id IS NOT NULL THEN
        IF v_bracket = 'bad' THEN
            UPDATE politician_active_election
               SET polling_you_pct = GREATEST(0, polling_you_pct - 2),
                   polling_opp_pct = LEAST(100, polling_opp_pct + 2)
             WHERE politician_id = v_pol.id;
        ELSE
            v_poll_gain := CASE WHEN v_bracket = 'good' THEN 5 ELSE 2 END;
            v_und_take  := LEAST(v_poll_gain, v_race.polling_undecided_pct);
            v_opp_take  := v_poll_gain - v_und_take;
            UPDATE politician_active_election
               SET polling_you_pct       = LEAST(100, polling_you_pct + v_poll_gain),
                   polling_undecided_pct = polling_undecided_pct - v_und_take,
                   polling_opp_pct       = GREATEST(0, polling_opp_pct - v_opp_take)
             WHERE politician_id = v_pol.id;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success',                 true,
        'roll',                    v_roll,
        'charisma',                COALESCE(v_pol.politician_charisma, 0),
        'total',                   v_total,
        'bracket',                 v_bracket,
        'popularity_delta',        v_pop_delta,
        'influence_delta',         v_inf_delta,
        'popularity_pct',          v_new_pop,
        'politician_influence',    v_new_inf,
        'cooldown_until_tick',     v_speech_cd,
        'next_member_action_tick', v_next
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.politician_give_speech(uuid) TO authenticated;

-- ── politician_resolve_due_elections — polling-driven outcome ──
--
-- Polling drives resolution. Higher polling_you vs polling_opp = win;
-- exact tie breaks at random. Undecided doesn't enter the math (it
-- only exists so actions don't feel zero-sum).
--
-- The "don't resolve yet" guard now uses >= instead of > so the player
-- gets the full resolve_tick window to take their last campaign action
-- without the page-load resolve racing them.
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
    -- Resolve only when STRICTLY past the resolve_tick — the resolve_tick
    -- itself is the player's last act window. Without this, page-load
    -- auto-resolve would steal their final campaign action.
    IF v_race.resolve_tick >= v_tick THEN
        RETURN jsonb_build_object(
            'success', true, 'resolved', false,
            'race_tier', v_race.race_tier,
            'resolve_tick', v_race.resolve_tick,
            'current_tick', v_tick
        );
    END IF;

    -- Winner = whoever polled higher. Exact ties broken at random — at
    -- the seed odds clamp [15, 85] a true tie at resolution is rare but
    -- not impossible.
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

    INSERT INTO politician_career_events (
        faction_id, event_tick, event_type, target_name, metadata
    ) VALUES (
        v_pol.id, v_tick, v_event, v_race.district,
        jsonb_build_object(
            'race_tier',      v_race.race_tier,
            'district',       v_race.district,
            'opponent',       v_opp_full,
            'opp_party_name', v_race.opp_party_name,
            'polling_you',    v_race.polling_you_pct,
            'polling_opp',    v_race.polling_opp_pct,
            'influence_delta', v_actual_delta
        )
    );

    DELETE FROM politician_active_election WHERE politician_id = v_pol.id;

    RETURN jsonb_build_object(
        'success',       true,
        'resolved',      true,
        'won',           v_won,
        'race_tier',     v_race.race_tier,
        'district',      v_race.district,
        'opponent',      v_opp_full,
        'opp_party_name', v_race.opp_party_name,
        'polling_you',   v_race.polling_you_pct,
        'polling_opp',   v_race.polling_opp_pct,
        'influence_delta', v_actual_delta,
        'politician_influence', v_new_inf
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_resolve_due_elections() TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
