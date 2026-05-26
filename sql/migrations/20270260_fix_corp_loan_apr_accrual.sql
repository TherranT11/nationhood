-- ============================================================================
-- Fix corp-loan interest accrual: APR is a FRACTION, not a percentage.
--
-- corp_loans.apr is stored as a fraction (0.03 = 3%; CHECK apr <= 0.5, and the
-- UI's fmtPct multiplies by 100). The monthly rate is therefore apr/12.
--
-- The manual-servicing processor (20270257) accrued with `apr / 100.0 / 12`,
-- treating apr as if it were a percentage number — an extra ÷100 that made
-- interest ~100× too small (effectively zero). accept_loan_offer /
-- issue_corp_loan already use apr/12 for per_tick_payment, so this aligns
-- accrual with the rest of the system.
--
-- (Central-bank loans are unaffected: central_bank_loans.interest_rate IS an
-- annual percentage, and advance-corp-tick correctly uses interest_rate/100.)
--
-- Only the accrual line changes from 20270257; the rest of the body is identical.
-- ============================================================================

BEGIN;

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
        -- apr is a FRACTION (0.03 = 3%), so the per-tick (monthly) rate is apr/12.
        IF r.started_at_tick < v_tick AND (r.last_payment_tick IS NULL OR r.last_payment_tick < v_tick) THEN
            UPDATE corp_loans
               SET balance = ROUND(r.bal * (1 + r.apr / 12)),
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

NOTIFY pgrst, 'reload schema';

COMMIT;
