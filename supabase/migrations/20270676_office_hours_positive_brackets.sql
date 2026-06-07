-- ════════════════════════════════════════════════════════════════════
-- 20270676 — Office Hours: all-positive bracket redesign
--
-- User design change. Removes the Reputation-modifier dice math and
-- flips every outcome bracket positive (or neutral). The $5K party-
-- fund cost and the 1-tick local-action cooldown stay.
--
-- Old (per 20270667 body): 1d6 + Reputation modifier
--   roll 1            → -1 Reputation
--   total < 5         → -0.5 Party Popularity
--   roll 6            → +1 Reputation
--   else              → +0.5 Skill (Experience after the 8d3bd59
--                       display rename)
--
-- New: flat 1d6, no modifier
--   roll 1            → +1 Reputation
--   rolls 2-4         → +0.5 Party Popularity
--   roll 5            → no stat effect (the $5K and the cooldown
--                       still apply — a quiet day at the storefront)
--   roll 6            → +0.5 Party Popularity AND +0.5 Reputation
--
-- Roll 5's "no effect" treatment is a judgment call — the user's
-- spec listed outcomes for 1 / 2-4 / 6 and left 5 unspecified.
-- Easy to retune: change the v_bracket = 'null' branch.
--
-- Response shape changes (client fmtLocalResult was updated in
-- lockstep):
--   • skill_delta / new_skill / total / reputation fields dropped —
--     no Experience gain and no modifier math left to surface.
--   • reputation_delta now numeric (was int) to carry the 0.5
--     bumps on roll 6.
--
-- Signature unchanged ((uuid, uuid) → jsonb) so CREATE OR REPLACE
-- replaces in place, reapply-safe.
--
-- Apply after 20270675.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.politician_office_hours(
    p_party_id   uuid,
    p_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid               uuid := auth.uid();
    v_pol               factions%ROWTYPE;
    v_party_funds       bigint;
    v_tick              int;
    v_cost              bigint := 5000;
    v_roll              int;
    v_bracket           text;
    v_rep_delta         numeric := 0;
    v_pop_delta         numeric := 0;
    v_new_funds         bigint;
    v_new_rep           numeric;
    v_new_pop           numeric;
    v_cooldown          int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_party_id IS DISTINCT FROM p_party_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
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

    SELECT party_funds INTO v_party_funds
      FROM factions
     WHERE id = p_party_id
       AND faction_type = 'movement_party'
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_party_funds IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'party_not_found');
    END IF;
    IF v_party_funds < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_party_funds',
            'have', v_party_funds, 'need', v_cost);
    END IF;

    UPDATE factions
       SET party_funds = party_funds - v_cost
     WHERE id = p_party_id
    RETURNING party_funds INTO v_new_funds;

    v_roll := 1 + floor(random() * 6)::int;

    -- All-positive bracket redesign per the user spec. Roll 5 is the
    -- only neutral outcome — no stat changes, the action still costs
    -- $5K and burns the 1-tick local cooldown.
    IF v_roll = 1 THEN
        v_bracket   := 'rep_bump';
        v_rep_delta := 1;
    ELSIF v_roll BETWEEN 2 AND 4 THEN
        v_bracket   := 'pop_bump';
        v_pop_delta := 0.5;
    ELSIF v_roll = 5 THEN
        v_bracket   := 'null';
        -- no deltas
    ELSE  -- roll = 6
        v_bracket   := 'crit';
        v_rep_delta := 0.5;
        v_pop_delta := 0.5;
    END IF;

    IF v_rep_delta <> 0 THEN
        UPDATE factions
           SET politician_reputation = GREATEST(0, COALESCE(politician_reputation, 0) + v_rep_delta)
         WHERE id = v_pol.id
        RETURNING politician_reputation INTO v_new_rep;
    END IF;
    IF v_pop_delta <> 0 THEN
        UPDATE factions
           SET popularity_pct = LEAST(popularity_cap_pct, GREATEST(0, COALESCE(popularity_pct, 0) + v_pop_delta))
         WHERE id = p_party_id
           AND faction_type = 'movement_party'
        RETURNING popularity_pct INTO v_new_pop;
    END IF;

    v_cooldown := v_tick + 1;
    UPDATE factions SET next_local_action_tick = v_cooldown WHERE id = v_pol.id;

    RETURN jsonb_build_object(
        'success',           true,
        'action',            'office_hours',
        'roll',              v_roll,
        'bracket',           v_bracket,
        'cost',              v_cost,
        'reputation_delta',  v_rep_delta,
        'popularity_delta',  v_pop_delta,
        'party_funds_after', v_new_funds,
        'new_reputation',    v_new_rep,
        'new_popularity',    v_new_pop,
        'next_action_tick',  v_cooldown
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.politician_office_hours(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_office_hours(uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
