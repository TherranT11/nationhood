-- ════════════════════════════════════════════════════════════════════
-- 20270653 — Audit fix: Door Knock bracket boundary on fractional totals
--
-- Pre-commit audit on 20270651 caught a fractional-edge gap. The
-- bracket was written as:
--
--   v_total < 2 → −0.2   (intended: total ≤ 1 → −0.2)
--   v_total < 6 → +0.2
--   else        → +0.3
--
-- For integer totals the brackets match the user spec exactly
-- (1 → −0.2, 2–5 → +0.2, 6+ → +0.3). The bug surfaces for
-- non-integer totals — which CAN occur because politician_influence
-- is numeric (20270381 widened it from int) and at least one current
-- writer adds +0.2 to the column (20270646 line 674, court-case
-- acceptance). A politician with Influence 0.5 who rolls a 1 has
-- total 1.5 — by the user's stated rule that is NOT in the ≤1
-- penalty bracket, but the original code put it there.
--
-- Fix is a one-operator flip: `< 2` → `<= 1`. Bracket coverage now:
--
--   v_total <= 1 → −0.2  (catches exactly total 1 — the spec case)
--   v_total <  6 → +0.2  (catches 1.5, 2, ..., 5.99)
--   else         → +0.3  (catches 6 and above)
--
-- Design property preserved: any non-zero Influence makes you immune
-- to the penalty bracket (min roll 1 + any Influence > 0 → total > 1).
-- A brand-new politician at Influence 0 is the only profile that can
-- hurt the party, and only on a natural 1.
--
-- No data migration needed. RPC body otherwise identical to 20270651;
-- only the CASE expression in v_pop_delta changes.
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

    -- 20270653: <= 1 (not < 2) so fractional totals like 1.5 land in
    -- the +0.2 bracket. Any non-zero Influence is now immunity.
    v_pop_delta := CASE
        WHEN v_total <= 1 THEN -0.2
        WHEN v_total <  6 THEN  0.2
        ELSE                    0.3
    END;

    UPDATE factions
       SET popularity_pct = LEAST(COALESCE(popularity_cap_pct, 100),
                                  GREATEST(0, COALESCE(popularity_pct, 0) + v_pop_delta))
     WHERE id = p_party_id
       AND faction_type = 'movement_party'
       AND abandoned_at IS NULL
    RETURNING popularity_pct INTO v_new_pop;

    IF v_new_pop IS NULL THEN
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
