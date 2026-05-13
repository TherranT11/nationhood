-- Prettify the Minister of Finance "Debt Payment" timeline event.
--
-- The original RPC fired the generic fire_system_event() which only sets
-- event_name (mapped from trigger_key) and leaves description_chosen NULL.
-- That produced timeline rows like:
--   "minister debt payment"
--   "minister debt payment in Dravka"
--
-- This migration replaces the fire_system_event() call with a direct
-- INSERT INTO event_log that writes:
--   event_name        = 'Debt Payment'
--   description_chosen = 'In <nation>, the Minister of Finance made a
--                         payment of $<payment>, bringing the national
--                         debt down to $<remaining>.'
--
-- Only the event-emit block changes. Auth, cooldown, balance check,
-- debit logic, and ministry_action_log are unchanged.

CREATE OR REPLACE FUNCTION pay_down_national_debt(p_payment INT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_caller       UUID := auth.uid();
    v_ministry     ministries%ROWTYPE;
    v_nation_id    UUID;
    v_nation_name  TEXT;
    v_tick         INT;
    v_debt         NUMERIC;
    v_balance      NUMERIC;
    v_payment_raw  BIGINT;
    v_fee_raw      BIGINT := 2000000;
    v_total_raw    BIGINT;
    v_new_balance  NUMERIC;
    v_new_debt     NUMERIC;
    v_last_log     RECORD;
BEGIN
    IF p_payment IS NULL OR p_payment < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_payment');
    END IF;

    v_payment_raw := p_payment::BIGINT * 1000000;
    v_total_raw   := v_payment_raw + v_fee_raw;

    SELECT * INTO v_ministry FROM ministries
        WHERE ministry_key = 'finance' AND is_active = true
          AND EXISTS (
              SELECT 1 FROM factions f
              WHERE f.id = ministries.party_id
                AND (f.id = v_caller OR f.linked_user_id = v_caller)
          )
        ORDER BY created_at DESC LIMIT 1;
    IF v_ministry.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_minister');
    END IF;
    v_nation_id := v_ministry.nation_id;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    SELECT cooldown_until_tick INTO v_last_log
      FROM ministry_action_log
     WHERE nation_id    = v_nation_id
       AND ministry_key = 'finance'
       AND action_key   = 'pay_down_national_debt'
     ORDER BY applied_at_tick DESC LIMIT 1;
    IF v_last_log.cooldown_until_tick IS NOT NULL
       AND v_last_log.cooldown_until_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_last_log.cooldown_until_tick);
    END IF;

    v_balance := COALESCE(v_ministry.discretionary_balance, 0);
    IF v_balance < v_total_raw THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_balance',
            'balance', v_balance, 'cost', v_total_raw);
    END IF;

    SELECT debt, name INTO v_debt, v_nation_name
      FROM nations WHERE id = v_nation_id FOR UPDATE;
    IF COALESCE(v_debt, 0) <= 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_debt');
    END IF;

    v_new_balance := v_balance - v_total_raw;
    v_new_debt    := GREATEST(0, v_debt - v_payment_raw);

    UPDATE ministries SET discretionary_balance = v_new_balance
        WHERE id = v_ministry.id;
    UPDATE nations SET debt = v_new_debt
        WHERE id = v_nation_id;

    INSERT INTO ministry_action_log (
        nation_id, ministry_key, action_key, faction_id,
        ap_cost, money_cost, applied_at_tick, cooldown_until_tick, action_data
    ) VALUES (
        v_nation_id, 'finance', 'pay_down_national_debt', v_ministry.party_id,
        0, v_total_raw, v_tick, v_tick + 1,
        jsonb_build_object(
            'payment',     p_payment,
            'fee',         2,
            'prevBalance', v_balance,
            'newBalance',  v_new_balance,
            'prevDebt',    v_debt,
            'newDebt',     v_new_debt
        )
    );

    INSERT INTO event_log (
        nation_id, event_name, trigger_key, category,
        description_chosen, effects_applied, fired_at_tick
    ) VALUES (
        v_nation_id,
        'Debt Payment',
        'minister_debt_payment',
        'ECONOMY',
        format(
            'In %s, the Minister of Finance made a payment of $%s, bringing the national debt down to $%s.',
            v_nation_name, p_payment, v_new_debt
        ),
        jsonb_build_object(
            'payment',     p_payment,
            'fee',         2,
            'newDebt',     v_new_debt,
            'newBalance',  v_new_balance,
            'minister_first', v_ministry.minister_first_name,
            'minister_last',  v_ministry.minister_last_name
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',     true,
        'payment',     p_payment,
        'fee',         2,
        'newBalance',  v_new_balance,
        'newDebt',     v_new_debt
    );
END;
$$;

GRANT EXECUTE ON FUNCTION pay_down_national_debt(INT) TO authenticated;
NOTIFY pgrst, 'reload schema';
