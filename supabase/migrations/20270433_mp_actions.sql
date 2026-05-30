-- ════════════════════════════════════════════════════════════════════
-- Member of Parliament repeatable actions
--
-- Three actions the MP / Senior MP affiliation panel on
-- politician-home.html now wires up. Shared 6-tick cooldown across
-- all three (one column: factions.next_mp_action_tick), so the player
-- chooses ONE action every six ticks.
--
-- ── FLOOR SPEECH ─────────────────────────────────────────────────────
--   Cost: nothing (just the risk).
--   Roll: 1D6 + politician_credibility.
--   Total >= 5 → +1 politician_reputation.
--   Total <  5 → party.popularity_pct −1 (the politician's bad speech
--                 splashes back on the party).
--
-- ── HOLD A RALLY ─────────────────────────────────────────────────────
--   Cost: −$10k from the PARTY's party_funds (rejected with
--         insufficient_party_funds if the party can't cover it; the
--         cooldown is NOT burned on rejection — only on execution).
--   Roll: 1D6 + politician_charisma.
--   Total >= 5 → party.popularity_pct +1.
--   Total <  5 → politician_reputation −1.
--
-- ── FUNDRAISING DINNER ───────────────────────────────────────────────
--   Cost: nothing (you're income-generating).
--   Roll: 1D30 + politician_reputation.
--   PARTY funds += total × $1,000  (always — even tiny rolls bring
--                                   in something).
--   Total <= 10 → politician_influence −1  (you embarrassed yourself).
--   Total >= 25 → politician_charisma +1   (you owned the room).
--   In between: just the money.
--
-- ── Office gate ──────────────────────────────────────────────────────
-- politician_office IN ('member_of_parliament', 'senior_mp') — Senior
-- MP keeps the same action set when they advance from Tier 1.
--
-- ── Stat clamping ───────────────────────────────────────────────────
-- All stat decrements use GREATEST(0, ...) so values can't go
-- negative. popularity_pct also clamps at LEAST(100, ...) on
-- increments, matching the existing election-reward pattern.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Cooldown column ──────────────────────────────────────────────
ALTER TABLE factions
    ADD COLUMN IF NOT EXISTS next_mp_action_tick int;

COMMENT ON COLUMN factions.next_mp_action_tick IS
    'Earliest tick at which this politician may fire another MP action (floor speech / hold rally / fundraising dinner). Stamped to current_tick + 6 by any of the three RPCs on successful execution. NULL = no cooldown.';

-- Same security posture as the other cooldown columns: SECURITY DEFINER
-- RPCs are the only writer; clients can't direct-clear via the
-- "Factions update own" policy.
REVOKE UPDATE (next_mp_action_tick) ON factions FROM PUBLIC, anon, authenticated;

-- ── 2. politician_mp_floor_speech ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.politician_mp_floor_speech()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_pol          factions%ROWTYPE;
    v_party_id     uuid;
    v_party_name   text;
    v_tick         int;
    v_roll         int;
    v_stat         int;
    v_total        int;
    v_passed       boolean;
    v_new_rep      int;
    v_new_pop      numeric;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_office NOT IN ('member_of_parliament', 'senior_mp') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'wrong_office',
            'have', v_pol.politician_office);
    END IF;
    IF v_pol.politician_party_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_in_party');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF v_pol.next_mp_action_tick IS NOT NULL AND v_pol.next_mp_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_mp_action_tick, 'current_tick', v_tick);
    END IF;

    v_party_id := v_pol.politician_party_id;
    v_roll     := 1 + floor(random() * 6)::int;
    v_stat     := COALESCE(v_pol.politician_credibility, 0);
    v_total    := v_roll + v_stat;
    v_passed   := v_total >= 5;

    IF v_passed THEN
        UPDATE factions
           SET politician_reputation = COALESCE(politician_reputation, 0) + 1
         WHERE id = v_pol.id
        RETURNING politician_reputation INTO v_new_rep;
    ELSE
        UPDATE factions
           SET popularity_pct = GREATEST(0, COALESCE(popularity_pct, 0) - 1)
         WHERE id = v_party_id
        RETURNING popularity_pct, faction_name INTO v_new_pop, v_party_name;
    END IF;

    UPDATE factions SET next_mp_action_tick = v_tick + 6 WHERE id = v_pol.id;

    RETURN jsonb_build_object(
        'success',          true,
        'action',           'floor_speech',
        'roll',             v_roll,
        'stat',             v_stat,
        'total',            v_total,
        'passed',           v_passed,
        'new_reputation',   v_new_rep,
        'new_party_popularity', v_new_pop,
        'party_name',       v_party_name,
        'next_action_tick', v_tick + 6
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.politician_mp_floor_speech() TO authenticated;

-- ── 3. politician_mp_hold_rally ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.politician_mp_hold_rally()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_pol          factions%ROWTYPE;
    v_party        factions%ROWTYPE;
    v_tick         int;
    v_roll         int;
    v_stat         int;
    v_total        int;
    v_passed       boolean;
    v_new_pop      numeric;
    v_new_rep      int;
    v_new_funds    numeric;
    v_cost         bigint := 10000;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_office NOT IN ('member_of_parliament', 'senior_mp') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'wrong_office',
            'have', v_pol.politician_office);
    END IF;
    IF v_pol.politician_party_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_in_party');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF v_pol.next_mp_action_tick IS NOT NULL AND v_pol.next_mp_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_mp_action_tick, 'current_tick', v_tick);
    END IF;

    SELECT * INTO v_party FROM factions WHERE id = v_pol.politician_party_id FOR UPDATE;
    IF v_party.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'party_not_found');
    END IF;
    IF COALESCE(v_party.party_funds, 0) < v_cost THEN
        -- Cooldown intentionally NOT burned on this rejection — player
        -- couldn't pay, so the action didn't happen.
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_party_funds',
            'have', COALESCE(v_party.party_funds, 0), 'need', v_cost);
    END IF;

    -- Debit party first; the roll fires regardless of success/failure.
    UPDATE factions SET party_funds = COALESCE(party_funds, 0) - v_cost
     WHERE id = v_party.id
    RETURNING party_funds INTO v_new_funds;

    v_roll   := 1 + floor(random() * 6)::int;
    v_stat   := COALESCE(v_pol.politician_charisma, 0);
    v_total  := v_roll + v_stat;
    v_passed := v_total >= 5;

    IF v_passed THEN
        UPDATE factions
           SET popularity_pct = LEAST(100, COALESCE(popularity_pct, 0) + 1)
         WHERE id = v_party.id
        RETURNING popularity_pct INTO v_new_pop;
    ELSE
        UPDATE factions
           SET politician_reputation = GREATEST(0, COALESCE(politician_reputation, 0) - 1)
         WHERE id = v_pol.id
        RETURNING politician_reputation INTO v_new_rep;
    END IF;

    UPDATE factions SET next_mp_action_tick = v_tick + 6 WHERE id = v_pol.id;

    RETURN jsonb_build_object(
        'success',              true,
        'action',               'hold_rally',
        'roll',                 v_roll,
        'stat',                 v_stat,
        'total',                v_total,
        'passed',               v_passed,
        'cost',                 v_cost,
        'party_funds_after',    v_new_funds,
        'new_party_popularity', v_new_pop,
        'new_reputation',       v_new_rep,
        'party_name',           v_party.faction_name,
        'next_action_tick',     v_tick + 6
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.politician_mp_hold_rally() TO authenticated;

-- ── 4. politician_mp_fundraising_dinner ─────────────────────────────
CREATE OR REPLACE FUNCTION public.politician_mp_fundraising_dinner()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_pol          factions%ROWTYPE;
    v_party        factions%ROWTYPE;
    v_tick         int;
    v_roll         int;
    v_stat         int;
    v_total        int;
    v_money        bigint;
    v_new_funds    numeric;
    v_new_inf      numeric;
    v_new_cha      int;
    v_stat_delta   text := NULL;  -- 'influence' / 'charisma' / NULL
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_office NOT IN ('member_of_parliament', 'senior_mp') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'wrong_office',
            'have', v_pol.politician_office);
    END IF;
    IF v_pol.politician_party_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_in_party');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF v_pol.next_mp_action_tick IS NOT NULL AND v_pol.next_mp_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_mp_action_tick, 'current_tick', v_tick);
    END IF;

    SELECT * INTO v_party FROM factions WHERE id = v_pol.politician_party_id FOR UPDATE;
    IF v_party.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'party_not_found');
    END IF;

    v_roll  := 1 + floor(random() * 30)::int;  -- 1D30
    v_stat  := COALESCE(v_pol.politician_reputation, 0);
    v_total := v_roll + v_stat;
    v_money := (v_total * 1000)::bigint;

    -- Party gets the money regardless of outcome.
    UPDATE factions SET party_funds = COALESCE(party_funds, 0) + v_money
     WHERE id = v_party.id
    RETURNING party_funds INTO v_new_funds;

    -- Stat side-effects at the extremes.
    IF v_total <= 10 THEN
        UPDATE factions
           SET politician_influence = GREATEST(0, COALESCE(politician_influence, 0) - 1)
         WHERE id = v_pol.id
        RETURNING politician_influence INTO v_new_inf;
        v_stat_delta := 'influence';
    ELSIF v_total >= 25 THEN
        UPDATE factions
           SET politician_charisma = COALESCE(politician_charisma, 0) + 1
         WHERE id = v_pol.id
        RETURNING politician_charisma INTO v_new_cha;
        v_stat_delta := 'charisma';
    END IF;

    UPDATE factions SET next_mp_action_tick = v_tick + 6 WHERE id = v_pol.id;

    RETURN jsonb_build_object(
        'success',          true,
        'action',           'fundraising_dinner',
        'roll',             v_roll,
        'stat',             v_stat,
        'total',            v_total,
        'money_raised',     v_money,
        'party_funds_after', v_new_funds,
        'party_name',       v_party.faction_name,
        'stat_delta',       v_stat_delta,
        'new_influence',    v_new_inf,
        'new_charisma',     v_new_cha,
        'next_action_tick', v_tick + 6
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.politician_mp_fundraising_dinner() TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
