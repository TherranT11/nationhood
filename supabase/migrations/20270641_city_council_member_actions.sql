-- ════════════════════════════════════════════════════════════════════
-- 20270641 — City Council Member: three role-card actions
--
-- Locks in the City Council Member's three slots — busy-work / craft /
-- risk — distinct from the Community Organizer set the rung was
-- inheriting before:
--
--   1. politician_mobilize_volunteers
--      Costs 1 Capital. +0.1 Party Popularity × your volunteer count,
--      capped at popularity_cap_pct. The party-grow slot — every
--      volunteer recruited via Civic Meeting makes this stronger.
--      Client-gates on volunteers >= 1; server re-validates.
--
--   2. politician_build_the_base
--      Free. Roll 1d6: 1 → no gain, 2–5 → +1 Capital, 6 → +2 Capital.
--      The craft slot — reliable upside, small risk of nothing.
--
--   3. politician_lobby_minister
--      Costs 1 Influence. Server picks a random target ministry from
--      the four in MINISTRY_NAMES (kept in sync with js/utils.js
--      + 20270471's CHECK constraint). Roll 1d6:
--        1   → -1 Reputation (publicly rebuffed)
--        2-4 → null (Influence consumed, no reward)
--        5-6 → +1 Capital, +1 Reputation
--      8-tick cooldown via the new next_lobby_minister_tick column on
--      top of the shared per-tick lock.
--
-- Display labels vs columns (from 20270632): "Capital" = politician_
-- influence, "Influence" = political_capital. The three RPCs read
-- and write through that swap and surface both rolling vs static
-- values in the response so the client format functions don't have
-- to know about the rename.
--
-- All three require politician_office = 'city_council_member' and a
-- valid party membership; they share next_local_action_tick with the
-- Community Organizer actions (you can't take a CC action AND a
-- Tier-1 action in the same tick — same "one each tick" rule).
--
-- Apply after 20270640.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema ─────────────────────────────────────────────────────
ALTER TABLE public.factions
    ADD COLUMN IF NOT EXISTS next_lobby_minister_tick int;

COMMENT ON COLUMN public.factions.next_lobby_minister_tick IS
    'Per-action 8-tick cooldown for politician_lobby_minister (20270641). Stamped to current_tick + 8 on every successful lobby, regardless of roll. Stacks with the shared next_local_action_tick — the per-tick lock blocks intermediate ticks, this gate blocks re-rolls within the cooldown window.';

REVOKE UPDATE (next_lobby_minister_tick) ON public.factions
    FROM PUBLIC, anon, authenticated;

-- ── 2. politician_mobilize_volunteers ─────────────────────────────
CREATE OR REPLACE FUNCTION public.politician_mobilize_volunteers(p_party_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid           uuid := auth.uid();
    v_pol           factions%ROWTYPE;
    v_tick          int;
    v_volunteers    int;
    v_pop_delta     numeric;
    v_new_capital   numeric;
    v_new_pop       numeric;
    v_party_name    text;
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
    IF v_pol.politician_office IS DISTINCT FROM 'city_council_member' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_city_council');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;
    IF v_pol.next_local_action_tick IS NOT NULL
       AND v_pol.next_local_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_local_action_tick);
    END IF;

    v_volunteers := COALESCE(v_pol.volunteers, 0);
    IF v_volunteers < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_volunteers');
    END IF;
    -- 1 Capital == 1 politician_influence (display-label swap from 20270632).
    IF COALESCE(v_pol.politician_influence, 0) < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_capital',
            'have', COALESCE(v_pol.politician_influence, 0), 'need', 1);
    END IF;

    v_pop_delta := 0.1 * v_volunteers;

    UPDATE factions
       SET politician_influence       = GREATEST(0, COALESCE(politician_influence, 0) - 1),
           next_local_action_tick     = v_tick + 1
     WHERE id = v_pol.id
    RETURNING politician_influence INTO v_new_capital;

    UPDATE factions
       SET popularity_pct = LEAST(popularity_cap_pct,
                                  GREATEST(0, COALESCE(popularity_pct, 0) + v_pop_delta))
     WHERE id = p_party_id
       AND faction_type = 'movement_party'
       AND abandoned_at IS NULL
    RETURNING popularity_pct, faction_name INTO v_new_pop, v_party_name;

    RETURN jsonb_build_object(
        'success',         true,
        'action',          'mobilize_volunteers',
        'volunteers',      v_volunteers,
        'popularity_delta', v_pop_delta,
        'new_popularity',  v_new_pop,
        'new_capital',     v_new_capital,
        'party_name',      v_party_name,
        'next_action_tick', v_tick + 1
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.politician_mobilize_volunteers(uuid) TO authenticated;

-- ── 3. politician_build_the_base ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.politician_build_the_base(p_party_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid           uuid := auth.uid();
    v_pol           factions%ROWTYPE;
    v_tick          int;
    v_roll          int;
    v_cap_delta     int := 0;
    v_new_capital   numeric;
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
    IF v_pol.politician_office IS DISTINCT FROM 'city_council_member' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_city_council');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;
    IF v_pol.next_local_action_tick IS NOT NULL
       AND v_pol.next_local_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_local_action_tick);
    END IF;

    v_roll := 1 + floor(random() * 6)::int;
    IF v_roll = 6 THEN
        v_cap_delta := 2;
    ELSIF v_roll >= 2 THEN
        v_cap_delta := 1;
    END IF;
    -- v_roll = 1: no gain. Tick still burns (the action's cost is the
    -- opportunity, not the resource).

    UPDATE factions
       SET politician_influence       = COALESCE(politician_influence, 0) + v_cap_delta,
           next_local_action_tick     = v_tick + 1
     WHERE id = v_pol.id
    RETURNING politician_influence INTO v_new_capital;

    RETURN jsonb_build_object(
        'success',         true,
        'action',          'build_the_base',
        'roll',            v_roll,
        'capital_delta',   v_cap_delta,
        'new_capital',     v_new_capital,
        'next_action_tick', v_tick + 1
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.politician_build_the_base(uuid) TO authenticated;

-- ── 4. politician_lobby_minister ──────────────────────────────────
-- Random ministry pick mirrors the politician_sit_the_exam slug list
-- (20270471) — keep the four-slot CASE in lockstep when ministries
-- are added or renamed. Ministry display name comes back in the
-- response so the client doesn't need a slug→label map for this
-- single surface (the existing utils.js MINISTRY_NAMES is the SoT
-- it could use later if more clients need this mapping).
CREATE OR REPLACE FUNCTION public.politician_lobby_minister(p_party_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid             uuid := auth.uid();
    v_pol             factions%ROWTYPE;
    v_tick            int;
    v_roll            int;
    v_ministry_roll   int;
    v_ministry_slug   text;
    v_ministry_name   text;
    v_capital_delta   int := 0;
    v_rep_delta       numeric := 0;
    v_inf_delta       int := -1;   -- Influence cost; column = political_capital.
    v_bracket         text;
    v_new_capital     numeric;
    v_new_influence   numeric;
    v_new_rep         numeric;
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
    IF v_pol.politician_office IS DISTINCT FROM 'city_council_member' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_city_council');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;
    IF v_pol.next_local_action_tick IS NOT NULL
       AND v_pol.next_local_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_local_action_tick);
    END IF;
    IF v_pol.next_lobby_minister_tick IS NOT NULL
       AND v_pol.next_lobby_minister_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'lobby_cooldown',
            'ready_at_tick', v_pol.next_lobby_minister_tick);
    END IF;
    -- 1 Influence == 1 political_capital (display-label swap, 20270632).
    IF COALESCE(v_pol.political_capital, 0) < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_influence',
            'have', COALESCE(v_pol.political_capital, 0), 'need', 1);
    END IF;

    v_ministry_roll := 1 + floor(random() * 4)::int;
    v_ministry_slug := CASE v_ministry_roll
        WHEN 1 THEN 'defense'
        WHEN 2 THEN 'foreign_affairs'
        WHEN 3 THEN 'economic_development'
        WHEN 4 THEN 'interior'
    END;
    v_ministry_name := CASE v_ministry_roll
        WHEN 1 THEN 'Defense'
        WHEN 2 THEN 'Foreign Affairs & Trade'
        WHEN 3 THEN 'Economic Development'
        WHEN 4 THEN 'Interior'
    END;

    v_roll := 1 + floor(random() * 6)::int;
    IF v_roll = 1 THEN
        v_bracket := 'rebuffed';
        v_rep_delta := -1;
    ELSIF v_roll >= 5 THEN
        v_bracket := 'delivered';
        v_capital_delta := 1;
        v_rep_delta := 1;
    ELSE
        v_bracket := 'null_result';
    END IF;

    UPDATE factions
       SET political_capital            = GREATEST(0, COALESCE(political_capital, 0) + v_inf_delta),
           politician_influence         = COALESCE(politician_influence, 0)         + v_capital_delta,
           politician_reputation        = GREATEST(0, COALESCE(politician_reputation, 0) + v_rep_delta),
           next_local_action_tick       = v_tick + 1,
           next_lobby_minister_tick     = v_tick + 8
     WHERE id = v_pol.id
    RETURNING politician_influence, political_capital, politician_reputation
        INTO v_new_capital, v_new_influence, v_new_rep;

    RETURN jsonb_build_object(
        'success',           true,
        'action',            'lobby_minister',
        'roll',              v_roll,
        'bracket',           v_bracket,
        'ministry',          v_ministry_slug,
        'ministry_name',     v_ministry_name,
        'capital_delta',     v_capital_delta,
        'reputation_delta',  v_rep_delta,
        'influence_delta',   v_inf_delta,
        'new_capital',       v_new_capital,
        'new_influence',     v_new_influence,
        'new_reputation',    v_new_rep,
        'next_action_tick',      v_tick + 1,
        'next_lobby_minister_tick', v_tick + 8
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.politician_lobby_minister(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
