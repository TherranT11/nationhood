-- ══════════════════════════════════════════════════════════════
-- Fix: signing ANY bill fails with "column n.sales_tax does not exist"
--
-- 20260430_alpha_stats_phase9_drop_legacy_columns.sql dropped
-- nations.sales_tax (and nations_history.sales_tax). The
-- sign_presidential_bill RPC from 20260429 still references
-- n.sales_tax in its post-activation UPDATE:
--
--     UPDATE nations n
--     SET income_tax = COALESCE(v_income_tax, n.income_tax),
--         sales_tax = COALESCE(v_sales_tax, n.sales_tax),
--         corporate_tax = COALESCE(v_corporate_tax, n.corporate_tax)
--     WHERE n.id = v_bill.nation_id;
--
-- The COALESCE pattern means the UPDATE references n.sales_tax
-- unconditionally, so EVERY signed bill (Press Freedom Act,
-- Education Act, anything) errors with "column n.sales_tax does
-- not exist" before reaching the JS enactBill follow-up.
--
-- Fix: re-CREATE sign_presidential_bill without the sales_tax
-- branch. income_tax + corporate_tax are still live columns and
-- still applied. Bills with stale sales_tax effect_data payloads
-- silently no-op (the filter on tax_key IN ('income_tax',
-- 'corporate_tax') drops them).
-- ══════════════════════════════════════════════════════════════

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

    INSERT INTO active_laws (
        nation_id,
        policy_id,
        passed_tick,
        proposed_by,
        effects_applied_through_tick,
        selected_option_id
    )
    SELECT DISTINCT ON (ba.policy_id)
        v_bill.nation_id,
        ba.policy_id,
        v_current_tick,
        v_bill.proposed_by,
        v_current_tick - 1,
        ba.selected_option_id
    FROM bill_articles ba
    WHERE ba.bill_id = p_bill_id
      AND ba.policy_id IS NOT NULL
    ORDER BY ba.policy_id, ba.created_at DESC
    ON CONFLICT (nation_id, policy_id)
    DO UPDATE SET
        passed_tick = EXCLUDED.passed_tick,
        proposed_by = EXCLUDED.proposed_by,
        effects_applied_through_tick = EXCLUDED.effects_applied_through_tick,
        selected_option_id = EXCLUDED.selected_option_id;

    -- Tax-rate effect_data payloads. sales_tax was dropped from
    -- nations in 20260430_alpha_stats_phase9; the IN-list now matches
    -- what the schema actually carries. Stale sales_tax payloads on
    -- existing bill_articles are silently filtered out.
    FOR v_row IN
        SELECT
            ba.effect_data->>'tax_key' AS tax_key,
            LEAST(50, GREATEST(0, (ba.effect_data->>'new_rate')::NUMERIC)) AS new_rate
        FROM bill_articles ba
        WHERE ba.bill_id = p_bill_id
          AND ba.effect_data IS NOT NULL
          AND ba.effect_data->>'type' = 'TAX_RATE_CHANGE'
          AND ba.effect_data->>'tax_key' IN ('income_tax', 'corporate_tax')
    LOOP
        IF v_row.tax_key = 'income_tax' THEN
            v_income_tax := v_row.new_rate;
        ELSIF v_row.tax_key = 'corporate_tax' THEN
            v_corporate_tax := v_row.new_rate;
        END IF;
    END LOOP;

    UPDATE nations n
    SET income_tax    = COALESCE(v_income_tax, n.income_tax),
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

NOTIFY pgrst, 'reload schema';
