-- ════════════════════════════════════════════════════════════════════
-- 20270588 — Campaign actions: Run Political Ads + simplified Speech
--
-- Design change. The two campaign-phase member actions are simplified
-- and rebalanced. Same RPC names kept (politician_door_knock /
-- politician_give_speech) so the JS callers don't have to chase the
-- rename — only the bodies + UI labels change.
--
-- Run Political Ads (politician_door_knock):
--   • Costs 1 Influence (political_capital) up front.
--   • Roll 1d10 + politician_skill.
--   • Increases polling_you_pct by the roll total (drawn from
--     polling_undecided_pct first, then polling_opp_pct).
--   • No popularity / reputation deltas. No party-side effects.
--   • Treats the "no active race" case as a no-op on polling
--     (Influence still spent — running ads outside a campaign is
--     a waste, by design).
--
-- Give a Speech (politician_give_speech):
--   • No cost.
--   • Roll 1d6.
--   • Increases polling_you_pct by the roll (same draw rule).
--   • No popularity / reputation deltas. No bracket / no fail path.
--
-- Cooldowns:
--   • Only the shared next_member_action_tick gate applies (one
--     action per tick). The legacy per-action cooldowns
--     (door_knock_cooldown_until_tick, speech_cooldown_until_tick)
--     are no longer read or stamped — columns stay on the table for
--     backwards-compat with any cached topbar SELECT but the values
--     freeze in place. Safe to DROP COLUMN later if no surface
--     surfaces them.
--
-- Stat dependency: politician_skill (post-20270583 rename of
-- politician_credibility). Apply 20270583 first.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. politician_door_knock → Run Political Ads ────────────────────
CREATE OR REPLACE FUNCTION public.politician_door_knock(p_party_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    AD_COST  CONSTANT numeric := 1;

    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_roll      int;
    v_total     int;
    v_new_cap   numeric;
    v_race      politician_active_election%ROWTYPE;
    v_und_take  int;
    v_opp_take  int;
    v_next      int;
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

    -- Shared one-action-per-turn gate.
    IF v_pol.next_member_action_tick IS NOT NULL
       AND v_pol.next_member_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_member_action_tick);
    END IF;

    -- Influence cost: 1.
    IF COALESCE(v_pol.political_capital, 0) < AD_COST THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_capital',
            'required', AD_COST,
            'have',     COALESCE(v_pol.political_capital, 0));
    END IF;

    v_roll  := 1 + floor(random() * 10)::int;   -- 1d10
    v_total := v_roll + COALESCE(v_pol.politician_skill, 0);
    v_next  := v_tick + 1;

    UPDATE factions
       SET political_capital       = GREATEST(0, COALESCE(political_capital, 0) - AD_COST),
           next_member_action_tick = v_next
     WHERE id = v_pol.id
    RETURNING political_capital INTO v_new_cap;

    -- Polling bump on the active race. No-op if the politician has no
    -- open race — Influence is still spent (campaigning ads outside a
    -- campaign is a waste, by design).
    SELECT * INTO v_race FROM politician_active_election WHERE politician_id = v_pol.id;
    IF v_race.politician_id IS NOT NULL THEN
        v_und_take := LEAST(v_total, v_race.polling_undecided_pct);
        v_opp_take := v_total - v_und_take;
        UPDATE politician_active_election
           SET polling_you_pct       = LEAST(100, polling_you_pct + v_total),
               polling_undecided_pct = polling_undecided_pct - v_und_take,
               polling_opp_pct       = GREATEST(0, polling_opp_pct - v_opp_take)
         WHERE politician_id = v_pol.id;
    END IF;

    RETURN jsonb_build_object(
        'success',                 true,
        'action',                  'run_ads',
        'roll',                    v_roll,
        'skill',                   COALESCE(v_pol.politician_skill, 0),
        'polling_delta',           v_total,
        'cost',                    AD_COST,
        'political_capital',       v_new_cap,
        'next_member_action_tick', v_next,
        'has_active_race',         v_race.politician_id IS NOT NULL
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_door_knock(uuid) TO authenticated;

-- ── 2. politician_give_speech → pure +1d6 polling ──────────────────
CREATE OR REPLACE FUNCTION public.politician_give_speech(p_party_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_roll      int;
    v_race      politician_active_election%ROWTYPE;
    v_und_take  int;
    v_opp_take  int;
    v_next      int;
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

    -- Shared one-action-per-turn gate.
    IF v_pol.next_member_action_tick IS NOT NULL
       AND v_pol.next_member_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_member_action_tick);
    END IF;

    v_roll := 1 + floor(random() * 6)::int;   -- 1d6
    v_next := v_tick + 1;

    UPDATE factions
       SET next_member_action_tick = v_next
     WHERE id = v_pol.id;

    SELECT * INTO v_race FROM politician_active_election WHERE politician_id = v_pol.id;
    IF v_race.politician_id IS NOT NULL THEN
        v_und_take := LEAST(v_roll, v_race.polling_undecided_pct);
        v_opp_take := v_roll - v_und_take;
        UPDATE politician_active_election
           SET polling_you_pct       = LEAST(100, polling_you_pct + v_roll),
               polling_undecided_pct = polling_undecided_pct - v_und_take,
               polling_opp_pct       = GREATEST(0, polling_opp_pct - v_opp_take)
         WHERE politician_id = v_pol.id;
    END IF;

    RETURN jsonb_build_object(
        'success',                 true,
        'action',                  'speech',
        'roll',                    v_roll,
        'polling_delta',           v_roll,
        'next_member_action_tick', v_next,
        'has_active_race',         v_race.politician_id IS NOT NULL
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_give_speech(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
