-- ════════════════════════════════════════════════════════════════════
-- MP election entry fee + party-popularity loss-tax
--
-- Stand for Election at the parliamentary tier now charges -$50,000
-- from party_funds immediately on entry (win or lose — the money goes
-- to printing, posters, paid canvassers, the campaign office lease).
-- The Community tier stays free — it's a neighborhood race and party
-- coffers don't fund those.
--
-- On loss, the parliamentary tier additionally costs the party
-- -0.5 Popularity (constituency disappointment, opposition press
-- coverage of the loss, etc.). Wins still pay the existing +1 seat
-- reward. Community-tier losses stay no-op for the party.
--
-- ── Why $50K, why -0.5 ──────────────────────────────────────────────
-- Player picked these. At seed party_funds of $250K (20270420) the
-- entry fee is meaningful but doesn't sink a treasury — you can fund
-- 5 MP runs before going broke. -0.5 Popularity matches the magnitude
-- of one off-message Door Knock failure (20270450), so a lost MP race
-- is roughly equivalent to one bad day on the doors at the party
-- level — a meaningful but not crushing dent.
--
-- ── What it touches ─────────────────────────────────────────────────
-- 1. politician_stand_for_election — adds parliament-tier guard +
--    debit. Locks party row FOR UPDATE before the funds check so two
--    politicians from the same party can't both pass insufficiency
--    check in parallel and double-spend.
-- 2. politician_resolve_due_elections — extends the existing party-
--    reward block with a parallel party-penalty block on parliament
--    loss. Returns the penalty in metadata so the post-race UI can
--    surface "Your party's popularity dropped to X%."
--
-- Both functions get fully re-pasted via CREATE OR REPLACE — they're
-- the current canonical definitions (stand_for_election from 20270418,
-- resolve_due_elections from 20270432).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. politician_stand_for_election — MP entry fee ─────────────────
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
    v_party_funds_before bigint;
    v_party_funds_after  bigint;
    v_entry_fee bigint := 50000;
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

    -- 20270418: a politician who has already won an office is locked
    -- out of standing for a new race.
    IF v_pol.politician_office IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_in_office',
            'office', v_pol.politician_office);
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

    -- ── MP entry fee: -$50K from party funds, parliament tier only ──
    -- Lock the party row before reading party_funds so two members of
    -- the same party racing into a parliament run can't both pass the
    -- insufficient-funds check and double-spend.
    IF p_tier = 'parliament' THEN
        SELECT party_funds INTO v_party_funds_before
          FROM factions
         WHERE id = p_party_id
           AND faction_type = 'movement_party'
           AND abandoned_at IS NULL
         FOR UPDATE;
        IF v_party_funds_before IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'party_not_found');
        END IF;
        IF v_party_funds_before < v_entry_fee THEN
            RETURN jsonb_build_object('success', false,
                'reason', 'insufficient_party_funds',
                'have', v_party_funds_before, 'need', v_entry_fee);
        END IF;
        UPDATE factions
           SET party_funds = party_funds - v_entry_fee
         WHERE id = p_party_id
        RETURNING party_funds INTO v_party_funds_after;
    END IF;

    -- Polling seed (20270399).
    v_poll_you := GREATEST(0, LEAST(100, v_odds - 8));
    v_poll_und := 15;
    v_poll_opp := GREATEST(0, 100 - v_poll_you - v_poll_und);

    INSERT INTO politician_active_election (
        politician_id, shard_id, race_tier, district,
        opp_first, opp_last, opp_blurb, opp_party_name,
        your_stat, opp_stat, win_odds_pct, stake_win, stake_lose,
        resolve_tick,
        polling_you_pct, polling_opp_pct, polling_undecided_pct,
        party_id
    ) VALUES (
        v_pol.id, v_shard_id, p_tier, v_district,
        v_opp_first, v_opp_last, v_opp_blurb, v_opp_pname,
        v_your, v_opp, v_odds, v_win, v_lose,
        v_resolve,
        v_poll_you, v_poll_opp, v_poll_und,
        p_party_id
    );

    DELETE FROM politician_election_offers WHERE politician_id = v_pol.id;

    v_next := v_tick + 1;
    UPDATE factions
       SET next_member_action_tick = v_next
     WHERE id = v_pol.id;

    INSERT INTO politician_career_events (
        faction_id, event_tick, event_type, target_name, metadata
    ) VALUES (
        v_pol.id, v_tick, 'stood_for_election', v_district,
        jsonb_build_object(
            'race_tier',      p_tier,
            'opponent',       v_opp_first || ' ' || v_opp_last,
            'opp_party_name', v_opp_pname,
            'win_odds_pct',   v_odds,
            'entry_fee',      CASE WHEN p_tier = 'parliament' THEN v_entry_fee ELSE 0 END
        )
    );

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
        'polling_undecided_pct', v_poll_und,
        'entry_fee', CASE WHEN p_tier = 'parliament' THEN v_entry_fee ELSE 0 END,
        'party_funds_after', v_party_funds_after
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_stand_for_election(uuid, text) TO authenticated;

COMMENT ON FUNCTION public.politician_stand_for_election(uuid, text) IS
    'Politician commits to a race from a pending offer. Community = free entry. Parliament = -$50K party_funds entry fee debited atomically (FOR UPDATE on party row). Spawns politician_active_election row, deletes the offer, stamps next_member_action_tick + 1. Parliament loss penalty handled in politician_resolve_due_elections (20270452).';

-- ── 2. politician_resolve_due_elections — parliament-loss penalty ───
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

    -- Party reward on win. Tier 1 + Tier 2 mirror axes:
    -- parliament/senior_mp = +1 seat; community/city_council = +1 popularity.
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

    -- ── Party penalty on loss. Parliament tier only (the only race
    -- the party paid an entry fee for); -0.5 popularity. Mirrors the
    -- reward block shape so the UI can render either symmetrically.
    -- Community losses stay no-op for the party.
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

    -- Personal stat reward on win.
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

GRANT EXECUTE ON FUNCTION public.politician_resolve_due_elections() TO authenticated;

COMMENT ON FUNCTION public.politician_resolve_due_elections() IS
    'Resolves the caller''s active race when resolve_tick has passed. Win path: +Influence stake, +1 seat (parliament/senior_mp) or +1 popularity (community/city_council) for party, +1 Charisma/Credibility for self, sets politician_office. Parliament-loss path (20270452): party_penalty = -0.5 popularity. Returns full result envelope with party_reward and party_penalty surfaces for UI.';

NOTIFY pgrst, 'reload schema';

COMMIT;
