-- ════════════════════════════════════════════════════════════════════
-- Restore polling bump + universal action gate on Door Knock / Speech
--
-- Bug report (CO race in Coronado Central, Avelia): pressing Door
-- Knocking and Give a Speech "didn't do anything" — polling line in
-- the active campaign card never moved — AND the buttons didn't grey
-- out after use, so the player could mash them.
--
-- Regression history. The action RPCs had both pieces in 20270399
-- (politician_election_polling): every successful action bumped
-- politician_active_election.polling_you_pct (drawing from undecided
-- first, then opp), AND stamped factions.next_member_action_tick =
-- current_tick + 1 to enforce the 1-per-turn shared gate.
--
-- 20270450 (party_member_actions_redesign) rebuilt the function
-- bodies for the asymmetric-roll redesign and inadvertently DROPPED
-- both. Its header even claimed the shared gate would stay in place —
-- "The shared per-turn next_member_action_tick gate stays in place"
-- — but the implementation never reapplied it, and the polling block
-- was deleted too. 20270463 (rename to political_capital) and
-- 20270468 (rename politician_charisma to politician_standing) both
-- carried 20270450's body forward verbatim, so the regression has
-- shipped through three migrations.
--
-- politician-home.html's Your Next Move panel gates the Knock button
-- on factions.next_member_action_tick > current_tick (universalLocked)
-- and the Speech button on the same flag OR
-- speech_cooldown_until_tick. With next_member_action_tick never
-- being set by the RPC, universalLocked is permanently false → buttons
-- always look clickable even immediately after a successful action.
-- The Speech button DID grey out (its own cooldown column is set
-- correctly), which is why the user observed knock-but-not-speech
-- staying clickable.
--
-- This migration re-author both RPCs with the current-prod body
-- (rolls / brackets / popularity / political_capital / reputation /
-- action-specific cooldowns) and adds back the two missing pieces:
--   1. Stamp next_member_action_tick = v_tick + 1 on success
--   2. Bump politician_active_election polling when the politician
--      has an open race — +2 to polling_you on knock; bracket-based
--      ±2 / +5 on speech (matching the UI's "+2 polling" and
--      "-2 to +5 polling" labels).
--
-- The action-specific cooldowns (door_knock_cooldown_until_tick = +2,
-- speech_cooldown_until_tick = +3) stay as 20270450 set them. The
-- universal gate is the only thing the UI currently reads for knock,
-- so this restores its working behavior.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. politician_door_knock ────────────────────────────────────────
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
    v_next      int;
    v_race      politician_active_election%ROWTYPE;
    v_gain      constant int := 2;
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
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    -- Universal 1-per-turn gate (regression-restored). Same field the UI
    -- reads in renderCampaignActions to grey out both buttons.
    IF v_pol.next_member_action_tick IS NOT NULL
       AND v_pol.next_member_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_member_action_tick);
    END IF;
    -- Action-specific cooldown (20270450).
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
    v_next     := v_tick + 1;
    UPDATE factions
       SET political_capital               = GREATEST(0, COALESCE(political_capital, 0) + v_cap_delta),
           door_knock_cooldown_until_tick  = v_cooldown,
           next_member_action_tick         = v_next
     WHERE id = v_pol.id
    RETURNING political_capital INTO v_new_cap;

    -- Polling bump on active race (regression-restored from 20270399).
    -- +2 polling_you, drawn from undecided first then opp. No-op if
    -- the politician has no open race.
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
        'roll',                    v_roll,
        'reputation',              COALESCE(v_pol.politician_reputation, 0),
        'total',                   v_total,
        'bracket',                 v_bracket,
        'popularity_delta',        v_pop_delta,
        'political_capital_delta', v_cap_delta,
        'popularity_pct',          v_new_pop,
        'political_capital',       v_new_cap,
        'cooldown_until_tick',     v_cooldown,
        'next_member_action_tick', v_next
    );
END;
$$;

-- ── 2. politician_give_speech ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.politician_give_speech(p_party_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_cooldown  int;
    v_next      int;
    v_roll      int;
    v_total     int;
    v_bracket   text;
    v_pop_delta numeric := 0;
    v_rep_delta int     := 0;
    v_new_pop   numeric;
    v_new_rep   int;
    v_race      politician_active_election%ROWTYPE;
    v_poll_you  int := 0;       -- signed delta on polling_you
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
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    -- Universal 1-per-turn gate (regression-restored).
    IF v_pol.next_member_action_tick IS NOT NULL
       AND v_pol.next_member_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_member_action_tick);
    END IF;
    -- Action-specific cooldown.
    IF v_pol.speech_cooldown_until_tick IS NOT NULL
       AND v_pol.speech_cooldown_until_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.speech_cooldown_until_tick);
    END IF;

    v_roll  := 1 + floor(random() * 6)::int;
    v_total := v_roll + COALESCE(v_pol.politician_standing, 0);

    IF v_roll = 1 THEN
        v_bracket   := 'crit_fail';
        v_rep_delta := -3;
        v_poll_you  := -2;     -- bad bracket → swing AGAINST you
    ELSIF v_roll = 6 THEN
        v_bracket   := 'crit';
        v_pop_delta := 0.4;
        v_poll_you  := 5;      -- crit → +5 polling
    ELSIF v_total >= 5 THEN
        v_bracket   := 'hit';
        v_pop_delta := 0.2;
        v_poll_you  := 2;      -- standard hit → +2 polling
    ELSE
        v_bracket   := 'fail';
        v_rep_delta := -2;
        v_poll_you  := -2;     -- fail → swing AGAINST you
    END IF;

    UPDATE factions
       SET popularity_pct = LEAST(100, GREATEST(0, COALESCE(popularity_pct, 0) + v_pop_delta))
     WHERE id = p_party_id
       AND faction_type = 'movement_party'
    RETURNING popularity_pct INTO v_new_pop;
    IF v_new_pop IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'party_not_found');
    END IF;

    v_cooldown := v_tick + 3;
    v_next     := v_tick + 1;
    UPDATE factions
       SET politician_reputation       = GREATEST(0, COALESCE(politician_reputation, 0) + v_rep_delta),
           speech_cooldown_until_tick  = v_cooldown,
           next_member_action_tick     = v_next
     WHERE id = v_pol.id
    RETURNING politician_reputation INTO v_new_rep;

    -- Polling bump on active race (regression-restored from 20270399,
    -- generalised for positive AND negative deltas). Positive →
    -- pulls from undecided first then opp; negative → opp gets the
    -- absolute value, you lose it. No-op if no active race.
    SELECT * INTO v_race FROM politician_active_election WHERE politician_id = v_pol.id;
    IF v_race.politician_id IS NOT NULL AND v_poll_you <> 0 THEN
        IF v_poll_you > 0 THEN
            v_und_take := LEAST(v_poll_you, v_race.polling_undecided_pct);
            v_opp_take := v_poll_you - v_und_take;
            UPDATE politician_active_election
               SET polling_you_pct       = LEAST(100, polling_you_pct + v_poll_you),
                   polling_undecided_pct = polling_undecided_pct - v_und_take,
                   polling_opp_pct       = GREATEST(0, polling_opp_pct - v_opp_take)
             WHERE politician_id = v_pol.id;
        ELSE
            -- Negative: opp gains exactly |v_poll_you|, you lose it.
            UPDATE politician_active_election
               SET polling_you_pct = GREATEST(0, polling_you_pct + v_poll_you),
                   polling_opp_pct = LEAST(100, polling_opp_pct + (-v_poll_you))
             WHERE politician_id = v_pol.id;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success',              true,
        'roll',                 v_roll,
        'standing',             COALESCE(v_pol.politician_standing, 0),
        'total',                v_total,
        'bracket',              v_bracket,
        'popularity_delta',     v_pop_delta,
        'reputation_delta',     v_rep_delta,
        'polling_delta',        v_poll_you,
        'popularity_pct',       v_new_pop,
        'politician_reputation', v_new_rep,
        'cooldown_until_tick',  v_cooldown,
        'next_member_action_tick', v_next
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_door_knock(uuid)  TO authenticated;
GRANT EXECUTE ON FUNCTION public.politician_give_speech(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
