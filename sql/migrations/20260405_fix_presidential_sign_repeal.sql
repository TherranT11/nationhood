-- Fix: sign_presidential_bill RPC was doing full enactment in SQL, which:
-- 1. Deleted repealed active_laws but never created reversal stat effects
-- 2. Re-inserted repealed policies as new active_laws (repeal article has policy_id)
-- 3. Bypassed JS-only logic: reversePolicy, opposed policy handling, approval effects
--
-- New approach: RPC only validates authorization + sets bill status.
-- Actual enactment (active_laws, reversals, stat effects) handled by
-- signPresidentialBill() calling enactBill() in JS after the RPC returns.

CREATE OR REPLACE FUNCTION sign_presidential_bill(
    p_bill_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_bill               bills%ROWTYPE;
    v_current_tick       INT := 0;
    v_actor_faction_id   UUID;
    v_president_faction  UUID;
BEGIN
    v_actor_faction_id := auth.uid();
    IF v_actor_faction_id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'code', 'UNAUTHENTICATED', 'message', 'Authentication is required.');
    END IF;

    SELECT *
    INTO v_bill
    FROM bills
    WHERE id = p_bill_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'code', 'BILL_NOT_FOUND', 'message', 'Bill not found.');
    END IF;

    IF v_bill.status <> 'president_desk' THEN
        RETURN jsonb_build_object('ok', false, 'code', 'INVALID_STATUS', 'message', 'Bill is not on the president''s desk.');
    END IF;

    SELECT p.faction_id
    INTO v_president_faction
    FROM presidents p
    WHERE p.nation_id = v_bill.nation_id
      AND p.is_active = true
    ORDER BY p.elected_tick DESC NULLS LAST
    LIMIT 1;

    IF v_president_faction IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'code', 'NO_ACTIVE_PRESIDENT', 'message', 'No active president found for this nation.');
    END IF;

    IF v_actor_faction_id <> v_president_faction THEN
        RETURN jsonb_build_object('ok', false, 'code', 'UNAUTHORIZED', 'message', 'Only the president faction may sign this bill.');
    END IF;

    SELECT s.current_tick
    INTO v_current_tick
    FROM shard s
    WHERE s.name = 'Alpha Shard'
    LIMIT 1;

    v_current_tick := COALESCE(v_current_tick, 0);

    -- Only update bill status — enactment is handled by JS caller
    UPDATE bills b
    SET status = 'passed',
        passed_tick = COALESCE(b.passed_tick, v_current_tick),
        president_action = 'signed',
        president_action_tick = v_current_tick
    WHERE b.id = p_bill_id;

    RETURN jsonb_build_object(
        'ok', true,
        'code', 'SIGNED',
        'message', 'Bill signed. Enactment will follow.',
        'bill_id', p_bill_id,
        'tick', v_current_tick
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'ok', false,
            'code', 'EXCEPTION',
            'message', SQLERRM
        );
END;
$$;
