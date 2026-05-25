-- ============================================================================
-- Corp loans → manual servicing (corp-to-corp loans only).
--
-- Replaces per-tick auto-amortization with:
--   • interest COMPOUNDS on the outstanding balance each tick (APR/12, monthly),
--   • NO automatic payment from treasury,
--   • the borrower pays only via the new pay_corp_debt action (cash → lender),
--   • a loan that's still owed when its term (started_at_tick + term_ticks)
--     runs out DEFAULTS (status='defaulted' + CEO ent_reputation −3, parity with
--     bankruptcy / the old miss-default).
--
-- New column corp_loans.balance carries the compounding outstanding (init from
-- principal − total_paid for existing loans; new loans lazily fall back to
-- principal via COALESCE until their first accrual sets it).
--
-- NOTE: central_bank_loans still auto-amortize in advance-corp-tick — converting
-- them is a separate pass (their interest feeds nation CB capacity/discretionary,
-- which needs its own decision).
-- ============================================================================

BEGIN;

ALTER TABLE corp_loans ADD COLUMN IF NOT EXISTS balance NUMERIC;
UPDATE corp_loans
   SET balance = GREATEST(0, principal - COALESCE(total_paid, 0))
 WHERE balance IS NULL AND status = 'active';

-- ── Outstanding-debt helper now reads the compounding balance (corp loans) ──
CREATE OR REPLACE FUNCTION public.entrepreneur_corp_outstanding_debt(p_corp_id uuid)
RETURNS numeric
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT
        COALESCE((SELECT SUM(GREATEST(0, COALESCE(balance, principal - COALESCE(total_paid, 0))))
                    FROM corp_loans
                   WHERE borrower_corp_id = p_corp_id
                     AND status = 'active'), 0)
      + COALESCE((SELECT SUM(GREATEST(0, outstanding))
                    FROM central_bank_loans
                   WHERE borrower_corp_id = p_corp_id
                     AND status = 'active'), 0);
$$;
GRANT EXECUTE ON FUNCTION public.entrepreneur_corp_outstanding_debt(uuid) TO authenticated;

-- ── Tick: accrue interest + default at term (no auto-payment) ──
CREATE OR REPLACE FUNCTION public.process_corp_loans(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    r            RECORD;
    v_tick       int;
    v_expired    int := 0;
    v_accrued    int := 0;
    v_defaulted  int := 0;
    v_repaid     int := 0;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Expire stale pending loan requests.
    FOR r IN
        SELECT id FROM corp_loan_requests
         WHERE status = 'pending' AND expires_at_tick <= v_tick
         FOR UPDATE
    LOOP
        UPDATE corp_loan_requests
           SET status = 'expired', finalized_at_tick = v_tick
         WHERE id = r.id;
        v_expired := v_expired + 1;
    END LOOP;

    -- Manual servicing: no auto-payment. Accrue compound interest (APR/12 per
    -- tick); default at term end if still owed; mark paid-off loans repaid.
    FOR r IN
        SELECT id, borrower_corp_id, apr, term_ticks, started_at_tick, last_payment_tick,
               GREATEST(0, COALESCE(balance, principal - COALESCE(total_paid, 0))) AS bal
          FROM corp_loans
         WHERE status = 'active'
         FOR UPDATE
    LOOP
        IF r.bal < 1 THEN
            UPDATE corp_loans SET status = 'repaid', balance = 0 WHERE id = r.id;
            v_repaid := v_repaid + 1;
            CONTINUE;
        END IF;
        IF v_tick >= r.started_at_tick + r.term_ticks THEN
            -- Term reached, still owed → default (parity with declare_bankruptcy).
            UPDATE corp_loans SET status = 'defaulted', defaulted_at_tick = v_tick, balance = r.bal WHERE id = r.id;
            UPDATE factions SET ent_reputation = COALESCE(ent_reputation, 0) - 3
             WHERE id = (SELECT owner_faction_id FROM entrepreneur_corps WHERE id = r.borrower_corp_id);
            v_defaulted := v_defaulted + 1;
            CONTINUE;
        END IF;
        -- Accrue compound interest at most once per tick (last_payment_tick guard
        -- makes a re-run idempotent; no accrual on the disbursement tick).
        IF r.started_at_tick < v_tick AND (r.last_payment_tick IS NULL OR r.last_payment_tick < v_tick) THEN
            UPDATE corp_loans
               SET balance = ROUND(r.bal * (1 + r.apr / 100.0 / 12)),
                   last_payment_tick = v_tick
             WHERE id = r.id;
            v_accrued := v_accrued + 1;
        END IF;
    END LOOP;

    RETURN jsonb_build_object('success', true,
        'expired',   v_expired,
        'accrued',   v_accrued,
        'repaid',    v_repaid,
        'defaulted', v_defaulted,
        'tick',      v_tick);
END;
$$;
GRANT EXECUTE ON FUNCTION public.process_corp_loans(int) TO authenticated;

-- ── pay_corp_debt: owner pays a chosen amount toward a loan, cash → lender ──
CREATE OR REPLACE FUNCTION public.pay_corp_debt(p_loan_id uuid, p_amount bigint)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_fac  factions%ROWTYPE;
    v_loan corp_loans%ROWTYPE;
    v_corp entrepreneur_corps%ROWTYPE;
    v_bal  numeric;
    v_pay  bigint;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;
    IF p_amount IS NULL OR p_amount < 1 THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_amount'); END IF;

    SELECT * INTO v_loan FROM corp_loans WHERE id = p_loan_id AND status = 'active' FOR UPDATE;
    IF v_loan.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'loan_not_found'); END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = v_loan.borrower_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL OR v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    v_bal := GREATEST(0, COALESCE(v_loan.balance, v_loan.principal - COALESCE(v_loan.total_paid, 0)));
    v_pay := LEAST(p_amount, CEIL(v_bal)::bigint, GREATEST(0, floor(COALESCE(v_corp.treasury_cash, 0))::bigint));
    IF v_pay < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'have', floor(COALESCE(v_corp.treasury_cash, 0))::bigint, 'balance', CEIL(v_bal)::bigint);
    END IF;

    UPDATE entrepreneur_corps SET treasury_cash = COALESCE(treasury_cash, 0) - v_pay WHERE id = v_corp.id;
    UPDATE entrepreneur_corps SET treasury_cash = COALESCE(treasury_cash, 0) + v_pay WHERE id = v_loan.lender_corp_id;
    UPDATE corp_loans
       SET balance     = GREATEST(0, v_bal - v_pay),
           total_paid  = COALESCE(total_paid, 0) + v_pay,
           last_payment_tick = (SELECT current_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1),
           status      = CASE WHEN (v_bal - v_pay) < 1 THEN 'repaid' ELSE 'active' END
     WHERE id = p_loan_id;

    RETURN jsonb_build_object('success', true, 'paid', v_pay,
        'remaining', GREATEST(0, CEIL(v_bal - v_pay))::bigint);
END;
$$;
GRANT EXECUTE ON FUNCTION public.pay_corp_debt(uuid, bigint) TO authenticated;

COMMENT ON FUNCTION public.pay_corp_debt(uuid, bigint) IS
    'Borrower CEO pays an amount toward an active corp loan from treasury_cash (cash → lender corp); reduces corp_loans.balance, marks repaid at <1. Owner-only, SECURITY DEFINER.';

NOTIFY pgrst, 'reload schema';

COMMIT;
