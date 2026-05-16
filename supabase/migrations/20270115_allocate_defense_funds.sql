-- Minister of Defense "Allocate Funds" action.
--
-- Moves cash from the Defense Ministry discretionary budget into a
-- military branch faction's treasury (factions.party_funds), 1:1:
--   ministries.discretionary_balance -= p_amount * $1M
--   <branch faction>.party_funds      += p_amount * $1M
--
-- p_amount is an INT in the unified $1 = $1M abstract scale (same
-- convention as pay_down_national_debt and fmtDiscretionaryBalance):
-- the player types "17" meaning $17 → $17M raw moved between the two.
--
-- Only the Army branch is wired up; Navy / Air Force are greyed out
-- client-side and rejected here ('branch_unavailable') until those
-- faction branches exist. No cooldown (it's the ministry moving money
-- it already holds). Atomic: the ministry row and the army faction
-- row are both locked FOR UPDATE so concurrent allocations can't
-- over-draw the discretionary balance.

CREATE OR REPLACE FUNCTION allocate_defense_funds(p_branch TEXT, p_amount INT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_caller      UUID := auth.uid();
    v_ministry    ministries%ROWTYPE;
    v_nation_id   UUID;
    v_amount_raw  BIGINT;
    v_balance     NUMERIC;
    v_army_id     UUID;
    v_army_funds  BIGINT;
    v_new_balance NUMERIC;
    v_new_funds   BIGINT;
BEGIN
    IF v_caller IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    -- Army only for now; Navy / Air Force have no faction branch yet.
    IF p_branch IS DISTINCT FROM 'army' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'branch_unavailable');
    END IF;
    IF p_amount IS NULL OR p_amount < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_amount');
    END IF;
    v_amount_raw := p_amount::BIGINT * 1000000;

    -- Caller must hold the Defense ministry seat. Lock the row so the
    -- balance check + debit is atomic against a concurrent allocation.
    SELECT * INTO v_ministry FROM ministries
        WHERE ministry_key = 'defense' AND is_active = true
          AND EXISTS (
              SELECT 1 FROM factions f
              WHERE f.id = ministries.party_id
                AND (f.id = v_caller OR f.linked_user_id = v_caller)
          )
        ORDER BY created_at DESC LIMIT 1
        FOR UPDATE;
    IF v_ministry.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_minister');
    END IF;
    v_nation_id := v_ministry.nation_id;

    v_balance := COALESCE(v_ministry.discretionary_balance, 0);
    IF v_balance < v_amount_raw THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'balance', v_balance, 'requested', v_amount_raw);
    END IF;

    -- The receiving Army faction for this nation. Lock it so the credit
    -- is atomic too.
    SELECT id, COALESCE(party_funds, 0) INTO v_army_id, v_army_funds
      FROM factions
     WHERE nation_id = v_nation_id
       AND faction_type = 'military'
       AND branch = 'army'
       AND abandoned_at IS NULL
       AND COALESCE(is_banned, false) = false
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_army_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_army_faction');
    END IF;

    v_new_balance := v_balance - v_amount_raw;
    v_new_funds   := v_army_funds + v_amount_raw;

    UPDATE ministries SET discretionary_balance = v_new_balance
        WHERE id = v_ministry.id;
    UPDATE factions SET party_funds = v_new_funds
        WHERE id = v_army_id;

    RETURN jsonb_build_object(
        'success',         true,
        'branch',          'army',
        'allocated',       p_amount,
        'newBalance',      v_new_balance,
        'armyFactionId',   v_army_id,
        'newArmyFunds',    v_new_funds
    );
END;
$$;

GRANT EXECUTE ON FUNCTION allocate_defense_funds(TEXT, INT) TO authenticated;
NOTIFY pgrst, 'reload schema';
