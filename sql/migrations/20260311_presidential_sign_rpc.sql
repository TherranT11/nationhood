-- Sign a bill on the president's desk atomically.
-- Validates bill state + signer authorization, applies enactment effects,
-- and transitions bill state in one transaction.

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
    v_income_tax         NUMERIC;
    v_sales_tax          NUMERIC;
    v_corporate_tax      NUMERIC;
    v_row                RECORD;
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

    -- Whole-bill repeal support.
    IF v_bill.bill_type = 'repeal' AND v_bill.repeal_active_law_id IS NOT NULL THEN
        UPDATE bills
        SET repeal_active_law_id = NULL
        WHERE repeal_active_law_id = v_bill.repeal_active_law_id;

        UPDATE bill_articles
        SET repeal_active_law_id = NULL
        WHERE repeal_active_law_id = v_bill.repeal_active_law_id;

        DELETE FROM active_laws
        WHERE id = v_bill.repeal_active_law_id
          AND nation_id = v_bill.nation_id;
    END IF;

    -- Article-level repeals.
    FOR v_row IN
        SELECT ba.repeal_active_law_id
        FROM bill_articles ba
        WHERE ba.bill_id = p_bill_id
          AND ba.repeal_active_law_id IS NOT NULL
    LOOP
        UPDATE bills
        SET repeal_active_law_id = NULL
        WHERE repeal_active_law_id = v_row.repeal_active_law_id;

        UPDATE bill_articles
        SET repeal_active_law_id = NULL
        WHERE repeal_active_law_id = v_row.repeal_active_law_id;

        DELETE FROM active_laws
        WHERE id = v_row.repeal_active_law_id
          AND nation_id = v_bill.nation_id;
    END LOOP;

    -- Activate all policy-backed articles.
    INSERT INTO active_laws (
        nation_id,
        policy_id,
        passed_tick,
        proposed_by,
        effects_applied_through_tick
    )
    SELECT
        v_bill.nation_id,
        ba.policy_id,
        v_current_tick,
        v_bill.proposed_by,
        v_current_tick - 1
    FROM bill_articles ba
    WHERE ba.bill_id = p_bill_id
      AND ba.policy_id IS NOT NULL
    ON CONFLICT (nation_id, policy_id)
    DO UPDATE SET
        passed_tick = EXCLUDED.passed_tick,
        proposed_by = EXCLUDED.proposed_by,
        effects_applied_through_tick = EXCLUDED.effects_applied_through_tick;

    -- Apply tax-rate effect_data payloads.
    FOR v_row IN
        SELECT
            ba.effect_data->>'tax_key' AS tax_key,
            LEAST(50, GREATEST(0, (ba.effect_data->>'new_rate')::NUMERIC)) AS new_rate
        FROM bill_articles ba
        WHERE ba.bill_id = p_bill_id
          AND ba.effect_data IS NOT NULL
          AND ba.effect_data->>'type' = 'TAX_RATE_CHANGE'
          AND ba.effect_data->>'tax_key' IN ('income_tax', 'sales_tax', 'corporate_tax')
    LOOP
        IF v_row.tax_key = 'income_tax' THEN
            v_income_tax := v_row.new_rate;
        ELSIF v_row.tax_key = 'sales_tax' THEN
            v_sales_tax := v_row.new_rate;
        ELSIF v_row.tax_key = 'corporate_tax' THEN
            v_corporate_tax := v_row.new_rate;
        END IF;
    END LOOP;

    UPDATE nations n
    SET income_tax = COALESCE(v_income_tax, n.income_tax),
        sales_tax = COALESCE(v_sales_tax, n.sales_tax),
        corporate_tax = COALESCE(v_corporate_tax, n.corporate_tax)
    WHERE n.id = v_bill.nation_id;

    UPDATE bills b
    SET status = 'passed',
        passed_tick = COALESCE(b.passed_tick, v_current_tick),
        president_action = 'signed',
        president_action_tick = v_current_tick
    WHERE b.id = p_bill_id;

    RETURN jsonb_build_object(
        'ok', true,
        'code', 'SIGNED',
        'message', 'Bill signed and enacted.',
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

ALTER FUNCTION sign_presidential_bill(UUID) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION sign_presidential_bill(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION sign_presidential_bill(UUID) TO service_role;
