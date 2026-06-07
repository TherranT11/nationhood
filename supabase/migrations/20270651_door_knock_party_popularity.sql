-- ════════════════════════════════════════════════════════════════════
-- 20270651 — Door Knocking: 1d6 + Influence → Party Popularity
--
-- Design shift. The 20270646 body (latest re-emit) was a self-build
-- action: roll 1d6, +Influence to the politician (1 → −1, 2–5 → +1,
-- 6 → +2, clamped at 0). Made Door Knock the only Influence generator
-- on the Party Member surface and stacked unbounded value over a long
-- horizon (~+0.83 Influence/tick EV, no cap).
--
-- New shape: door-knock now HELPS THE PARTY, not the politician.
-- Politician's Influence stat doesn't move; instead the politician's
-- current Influence acts as a roll modifier (v_total = 1d6 + Influence)
-- and the party's popularity_pct moves on three brackets:
--
--   total ≤ 1 → −0.2 Party Popularity  (only fires at Influence 0 and
--                                       roll 1 — brand-new politicians
--                                       can occasionally hurt the party)
--   total 2–5 → +0.2 Party Popularity
--   total ≥ 6 → +0.3 Party Popularity
--
-- Practical effect: Influence 0 politicians get a mix; Influence ≥ 5
-- always lands the +0.3 bracket (party-help becomes deterministic
-- once you've banked any institutional time). Self-Influence growth
-- moves to other surfaces (join-party bonus, civil-service, in-office
-- chamber time) — Door Knock is no longer a Influence pump.
--
-- Gates preserved: party-member check, shared next_member_action_tick
-- (1-per-tick lock). popularity_pct clamps to [0, popularity_cap_pct]
-- per the standard party-stat pattern in civic_meeting / office_hours.
--
-- JSONB shape switches: 'influence_delta' / 'politician_influence' →
-- 'total' / 'popularity_delta' / 'new_popularity'. Client
-- fmtDoorKnockResult re-rendered to match.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.politician_door_knock(p_party_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid           uuid := auth.uid();
    v_pol           factions%ROWTYPE;
    v_tick          int;
    v_roll          int;
    v_inf           numeric;
    v_total         numeric;
    v_pop_delta     numeric;
    v_new_pop       numeric;
    v_next          int;
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

    IF v_pol.next_member_action_tick IS NOT NULL
       AND v_pol.next_member_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_member_action_tick);
    END IF;

    v_roll  := 1 + floor(random() * 6)::int;
    v_inf   := COALESCE(v_pol.politician_influence, 0);
    v_total := v_roll + v_inf;

    -- Bracket on total. Strict < boundaries so fractional Influence
    -- values (e.g., 0.5) bucket cleanly.
    v_pop_delta := CASE
        WHEN v_total < 2 THEN -0.2
        WHEN v_total < 6 THEN  0.2
        ELSE                   0.3
    END;

    -- Apply to the party — same clamp pattern civic_meeting /
    -- office_hours use for popularity_pct movement.
    UPDATE factions
       SET popularity_pct = LEAST(COALESCE(popularity_cap_pct, 100),
                                  GREATEST(0, COALESCE(popularity_pct, 0) + v_pop_delta))
     WHERE id = p_party_id
       AND faction_type = 'movement_party'
       AND abandoned_at IS NULL
    RETURNING popularity_pct INTO v_new_pop;

    IF v_new_pop IS NULL THEN
        -- Party row missing or abandoned between membership check and
        -- update — rare, but bail without stamping the cooldown so
        -- the player can retry without losing a tick.
        RETURN jsonb_build_object('success', false, 'reason', 'party_not_found');
    END IF;

    v_next := v_tick + 1;
    UPDATE factions
       SET next_member_action_tick = v_next
     WHERE id = v_pol.id;

    RETURN jsonb_build_object(
        'success',                 true,
        'action',                  'door_knock',
        'roll',                    v_roll,
        'influence_used',          v_inf,
        'total',                   v_total,
        'popularity_delta',        v_pop_delta,
        'new_popularity',          v_new_pop,
        'next_member_action_tick', v_next
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_door_knock(uuid) TO authenticated;

COMMIT;
