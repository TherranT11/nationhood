-- ════════════════════════════════════════════════════════════════════
-- Politician office tracking — first surface
--
-- Adds factions.politician_office so a politician's current elected
-- post is queryable from the schema (today every politician-career.html
-- rung's held() returns false because there's no column to read).
-- Scope is intentionally small: only the two First-Office tiers that
-- already have election-resolve hooks land here.
--
--   Win a community-tier election  → politician_office =
--                                     'community_organizer'
--   Win a parliament-tier election → politician_office =
--                                     'member_of_parliament'
--
-- Three connected effects:
--
--   1. The career page's Government & State Tier 1 (Community
--      Organizer) and Party Office Tier 1 (Member of Parliament)
--      rungs now flip held() from () => false to a real check against
--      this column. Every higher tier still reads false until its
--      mechanics land (Mayor election, Cabinet appointment, etc.) —
--      the CHECK constraint will need to be extended at that point.
--
--   2. The "Stand for Election" CTA on politician-career.html now
--      hard-rejects when an office is held. The RPC also rejects
--      server-side with reason='already_in_office' so a stale tab
--      can't bypass the gate.
--
--   3. Affiliation strings on politician-home + politician-career
--      now read "Community Organizer · {Party Name}" (or "Member of
--      Parliament · …") in place of "Party Member of {Party Name}".
--      Membership is implicit in holding the office, so the surface
--      collapses to office + party.
--
-- Also drops the party-popularity bump on a community-tier win from
-- +2 → +1 (per spec). Parliament-tier party seats bump is unchanged
-- (+1 seat). Personal stat bumps unchanged (+1 credibility / +1
-- charisma).
--
-- Drive-by fix: 20270409 re-built politician_stand_for_election from
-- 20270402's body and lost the party_id INSERT column that 20270400
-- had added. Effect on master: every race stood after 20270409 ships
-- with politician_active_election.party_id = NULL, which makes
-- politician_resolve_due_elections' "IF v_won AND v_race.party_id IS
-- NOT NULL" branch skip the party-reward step entirely. The body
-- below re-includes party_id in the INSERT. Not flagging it as a
-- separate migration because this one already touches both functions
-- — splitting would just diverge them again.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS, CHECK is dropped + re-created,
-- both functions are CREATE OR REPLACE.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema ───────────────────────────────────────────────────────
ALTER TABLE factions
    ADD COLUMN IF NOT EXISTS politician_office text;

ALTER TABLE factions
    DROP CONSTRAINT IF EXISTS factions_politician_office_chk;

ALTER TABLE factions
    ADD CONSTRAINT factions_politician_office_chk
    CHECK (politician_office IS NULL
           OR politician_office IN ('community_organizer', 'member_of_parliament'));

COMMENT ON COLUMN factions.politician_office IS
    'Office held by this politician (NULL = none). Today only the two First-Office tiers are tracked: ''community_organizer'' (Govt & State Tier 1) and ''member_of_parliament'' (Party Office Tier 1). Set by politician_resolve_due_elections on a win; read by politician-career.html rung held() + by politician_stand_for_election to gate re-entry. Extend the CHECK when higher tiers land.';

-- Real economic value (locks the player out of further elections and
-- flips a ladder rung). The "Factions update own" RLS policy (20260302)
-- otherwise grants authenticated table-level UPDATE on factions, which
-- without this revoke would let a client self-assign politician_office
-- directly and skip the entire election system. Writes must go through
-- politician_resolve_due_elections (SECURITY DEFINER → bypasses revoke).
-- Same posture as the airline/treasury security-sensitive columns.
REVOKE UPDATE (politician_office) ON factions FROM PUBLIC, anon, authenticated;

-- ── 2. politician_resolve_due_elections ─────────────────────────────
-- Body = 20270401 + two patches:
--   • Community-tier party popularity bump: +2 → +1 (delta in jsonb
--     drops to match).
--   • New v_office_set block: stamps factions.politician_office on a
--     win, keyed on race_tier. Loss is a no-op (no office gained).
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

    -- Party reward on win. abandoned_at guard means a collapsed party
    -- silently no-ops; IF FOUND distinguishes "applied" from "skipped".
    -- Community popularity bump: +1 (was +2 pre-20270418 — spec'd down
    -- when the win-locks-the-office gate landed; a single community
    -- race is a smaller party-level signal than the prior model).
    IF v_won AND v_race.party_id IS NOT NULL THEN
        IF v_race.race_tier = 'parliament' THEN
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

    -- Personal stat reward on win — independent of party state.
    IF v_won THEN
        IF v_race.race_tier = 'parliament' THEN
            UPDATE factions
               SET politician_charisma = COALESCE(politician_charisma, 1) + 1
             WHERE id = v_pol.id
            RETURNING politician_charisma INTO v_new_cha;
            v_stat_reward := jsonb_build_object(
                'kind',      'charisma',
                'delta',     1,
                'new_value', v_new_cha
            );
        ELSIF v_race.race_tier = 'community' THEN
            UPDATE factions
               SET politician_credibility = COALESCE(politician_credibility, 1) + 1
             WHERE id = v_pol.id
            RETURNING politician_credibility INTO v_new_cred;
            v_stat_reward := jsonb_build_object(
                'kind',      'credibility',
                'delta',     1,
                'new_value', v_new_cred
            );
        END IF;

        -- Office stamp — 20270418's new effect. Only First-Office tiers
        -- map today; higher tiers stay NULL until their own resolve
        -- hooks (Mayor election, Cabinet appointment, …) land. CHECK
        -- constraint on the column rejects any unknown value.
        v_office := CASE v_race.race_tier
                        WHEN 'community'  THEN 'community_organizer'
                        WHEN 'parliament' THEN 'member_of_parliament'
                    END;
        IF v_office IS NOT NULL THEN
            UPDATE factions
               SET politician_office = v_office
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

-- ── 3. politician_stand_for_election ────────────────────────────────
-- Body = 20270409 + one early-reject for office-held. Server-side gate
-- so a stale tab / replayed request can't bypass the client check.
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

    -- 20270418: a politician who has already won an office is locked
    -- out of standing for a new race. The Tier 1 wins (Community
    -- Organizer / Member of Parliament) are terminal in this surface;
    -- higher-tier advancement will come through other mechanics when
    -- they land. Client also gates this, but the RPC is the source of
    -- truth.
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
            'win_odds_pct',   v_odds
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
        'polling_undecided_pct', v_poll_und
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_stand_for_election(uuid, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
