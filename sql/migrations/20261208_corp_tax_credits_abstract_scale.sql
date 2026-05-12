-- Corp tax credits → nation.budget on the new unified abstract integer
-- scale. After migration 20261206 rescaled nation.budget by /1M, the
-- /1_000_000_000 divisor inside pay_corporate_tax_full +
-- cook_corporate_tax_books was 1000× too aggressive: a $5M paid bill
-- credited 0.005 abstract instead of 5. Drop the divisor to 1_000_000.
--
-- These CREATE OR REPLACE statements are faithful copies of the bodies
-- from 20261017_corp_tax_rpcs.sql with the v_budget_credit divisor as
-- the only behavioural change. No signature changes, so CREATE OR
-- REPLACE is safe.

-- ── pay_corporate_tax_full ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION pay_corporate_tax_full(p_bill_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user      UUID := auth.uid();
    v_bill      corp_tax_bills%ROWTYPE;
    v_corp      factions%ROWTYPE;
    v_cash      NUMERIC;
    v_tick      INT;
    v_paid      BIGINT;
    v_residual  BIGINT;
    v_late_fee  BIGINT;
    v_new_status TEXT;
    v_budget_credit NUMERIC;
BEGIN
    SELECT * INTO v_bill FROM corp_tax_bills WHERE id = p_bill_id FOR UPDATE;
    IF v_bill.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bill_not_found');
    END IF;
    IF v_bill.status NOT IN ('due', 'partial', 'delinquent') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bill_already_resolved',
            'status', v_bill.status);
    END IF;

    SELECT * INTO v_corp FROM factions WHERE id = v_bill.corp_id;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF NOT is_admin()
       AND v_corp.id <> v_user
       AND v_corp.linked_user_id IS DISTINCT FROM v_user THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authorized');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    PERFORM 1 FROM factions WHERE id = v_corp.id FOR UPDATE;
    SELECT COALESCE(corp_cash_reserves, 0) INTO v_cash FROM factions WHERE id = v_corp.id;

    IF v_cash >= v_bill.amount_due THEN
        v_paid       := v_bill.amount_due;
        v_residual   := 0;
        v_late_fee   := 0;
        v_new_status := 'paid';
    ELSE
        v_paid       := v_cash::BIGINT;
        v_residual   := v_bill.amount_due - v_paid;
        v_late_fee   := FLOOR(v_residual * 0.10)::BIGINT;
        v_new_status := 'delinquent';
    END IF;

    IF v_paid > 0 THEN
        PERFORM emit_corp_cash_event(
            v_corp.id, 'tax',
            format('Corporate tax %s', v_bill.year),
            -v_paid, v_tick, v_bill.nation_id
        );
    END IF;

    UPDATE corp_tax_bills SET
        amount_due   = v_residual + v_late_fee,
        status       = v_new_status,
        paid_at_tick = CASE WHEN v_new_status = 'paid' THEN v_tick ELSE paid_at_tick END,
        updated_at   = now()
    WHERE id = v_bill.id;

    -- v_paid is raw corp-cash dollars; nation.budget is abstract integers
    -- (post-20261206, 1 = $1M raw). /1_000_000 puts the credit on the
    -- same scale as the rest of the column.
    v_budget_credit := v_paid::NUMERIC / 1000000;
    IF v_budget_credit > 0 THEN
        UPDATE nations SET budget = COALESCE(budget, 0) + v_budget_credit
        WHERE id = v_bill.nation_id;
    END IF;

    RETURN jsonb_build_object(
        'success',         true,
        'amount_paid',     v_paid,
        'residual',        v_residual + v_late_fee,
        'status',          v_new_status,
        'budget_credited', v_budget_credit
    );
END;
$$;

GRANT EXECUTE ON FUNCTION pay_corporate_tax_full(UUID) TO authenticated;


-- ── cook_corporate_tax_books ───────────────────────────────────────
CREATE OR REPLACE FUNCTION cook_corporate_tax_books(p_bill_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user        UUID := auth.uid();
    v_bill        corp_tax_bills%ROWTYPE;
    v_corp        factions%ROWTYPE;
    v_nation      nations%ROWTYPE;
    v_cash        NUMERIC;
    v_tick        INT;
    v_half        BIGINT;
    v_paid        BIGINT;
    v_unpaid      BIGINT;
    v_late_fee    BIGINT;
    v_corruption  NUMERIC;
    v_roll        INT;
    v_total_roll  NUMERIC;
    v_success     BOOLEAN;
    v_budget_credit NUMERIC;
BEGIN
    SELECT * INTO v_bill FROM corp_tax_bills WHERE id = p_bill_id FOR UPDATE;
    IF v_bill.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bill_not_found');
    END IF;
    IF v_bill.status <> 'due' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cook_blocked',
            'status', v_bill.status);
    END IF;

    SELECT * INTO v_corp FROM factions WHERE id = v_bill.corp_id;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF NOT is_admin()
       AND v_corp.id <> v_user
       AND v_corp.linked_user_id IS DISTINCT FROM v_user THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authorized');
    END IF;

    SELECT * INTO v_nation FROM nations WHERE id = v_bill.nation_id;
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    PERFORM 1 FROM factions WHERE id = v_corp.id FOR UPDATE;
    SELECT COALESCE(corp_cash_reserves, 0) INTO v_cash FROM factions WHERE id = v_corp.id;

    v_half := FLOOR(v_bill.amount_due * 0.5)::BIGINT;
    v_paid := LEAST(v_half, v_cash::BIGINT);

    IF v_paid > 0 THEN
        PERFORM emit_corp_cash_event(
            v_corp.id, 'tax',
            format('Corporate tax %s (cook the books, 50%%)', v_bill.year),
            -v_paid, v_tick, v_bill.nation_id
        );
    END IF;

    -- v_paid raw → nation.budget abstract integers (1 = $1M raw post-20261206).
    v_budget_credit := v_paid::NUMERIC / 1000000;
    IF v_budget_credit > 0 THEN
        UPDATE nations SET budget = COALESCE(budget, 0) + v_budget_credit
        WHERE id = v_bill.nation_id;
    END IF;

    v_corruption := GREATEST(0, LEAST(100, COALESCE(v_nation.corruption, 0)));
    v_roll       := 1 + FLOOR(random() * 100)::INT;
    v_total_roll := v_roll + v_corruption;
    v_success    := v_total_roll > 75;

    v_unpaid := v_bill.amount_due - v_paid;

    IF v_success THEN
        UPDATE factions
           SET corp_fraud_total = COALESCE(corp_fraud_total, 0) + v_unpaid
         WHERE id = v_corp.id;
        UPDATE corp_tax_bills SET
            amount_due   = 0,
            status       = 'paid_with_fraud',
            paid_at_tick = v_tick,
            updated_at   = now()
        WHERE id = v_bill.id;
    ELSE
        v_late_fee := FLOOR(v_unpaid * 0.10)::BIGINT;
        UPDATE corp_tax_bills SET
            amount_due = v_unpaid + v_late_fee,
            status     = 'delinquent',
            updated_at = now()
        WHERE id = v_bill.id;
        UPDATE factions
           SET corp_reputation = GREATEST(0, COALESCE(corp_reputation, 0) - 1)
         WHERE id = v_corp.id;
    END IF;

    RETURN jsonb_build_object(
        'success',            true,
        'roll',               v_roll,
        'corruption',         v_corruption,
        'total',              v_total_roll,
        'fraud_succeeded',    v_success,
        'amount_paid',        v_paid,
        'amount_saved',       CASE WHEN v_success THEN v_unpaid ELSE 0 END,
        'amount_delinquent',  CASE WHEN v_success THEN 0 ELSE v_unpaid + v_late_fee END,
        'budget_credited',    v_budget_credit
    );
END;
$$;

GRANT EXECUTE ON FUNCTION cook_corporate_tax_books(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
