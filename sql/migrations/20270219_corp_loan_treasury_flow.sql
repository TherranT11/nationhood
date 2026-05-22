-- ════════════════════════════════════════════════════════════════════
-- CORP LOANS — route money through corp TREASURY, not founder funds
-- ════════════════════════════════════════════════════════════════════
-- Corp-to-corp loans previously disbursed (issue_corp_loan, 20270189) and
-- repaid (process_corp_loans, 20270175) by moving the OWNERS' personal
-- factions.party_funds. That never capitalized the borrowing corp — the
-- whole point of a corp loan — and for a same-owner loan it was a no-op.
--
-- declare_bankruptcy (20270202) already settles corp loans against
-- entrepreneur_corps.treasury_cash, so this aligns disbursement +
-- repayment to that one model:
--   • issue_corp_loan:    lender_corp.treasury_cash → borrower_corp.treasury_cash
--   • process_corp_loans: borrower_corp.treasury_cash → lender_corp.treasury_cash
--
-- Behaviour, guards, event logs and the [Issue Loan] UI flow
-- (entrepreneur-corp.html shows the button on 'approved' loans for the
-- lender CEO) are unchanged — only the debited/credited account moves.
--
-- Apply AFTER 20270174 / 20270175 / 20270177 / 20270189 (this CREATE OR
-- REPLACE assumes their schema: corp_loans.status 'approved', started_at_tick).
-- Idempotent.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── issue_corp_loan — bank CEO disburses an approved loan ─────────
CREATE OR REPLACE FUNCTION public.issue_corp_loan(p_loan_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid             uuid := auth.uid();
    v_fac             factions%ROWTYPE;
    v_loan            corp_loans%ROWTYPE;
    v_borrower_corp   entrepreneur_corps%ROWTYPE;
    v_bank_corp       entrepreneur_corps%ROWTYPE;
    v_bank_funds      bigint;
    v_tick            int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_loan_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_loan FROM corp_loans WHERE id = p_loan_id FOR UPDATE;
    IF v_loan.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'loan_not_found');
    END IF;
    IF v_loan.status <> 'approved' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'loan_not_approved');
    END IF;

    -- Lock both corps in a stable order (deadlock-safe).
    PERFORM id FROM entrepreneur_corps
     WHERE id IN (v_loan.lender_corp_id, v_loan.borrower_corp_id)
     ORDER BY id FOR UPDATE;

    SELECT * INTO v_bank_corp FROM entrepreneur_corps WHERE id = v_loan.lender_corp_id;
    IF v_bank_corp.id IS NULL OR v_bank_corp.owner_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bank_corp_not_found');
    END IF;

    SELECT * INTO v_borrower_corp FROM entrepreneur_corps WHERE id = v_loan.borrower_corp_id;
    IF v_borrower_corp.id IS NULL OR v_borrower_corp.owner_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'borrower_corp_not_found');
    END IF;

    -- Caller must own (command) the LENDER bank corp — the CEO issues.
    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;
    IF v_bank_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_bank_corp_owner');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Atomic affordability + debit on the LENDER corp treasury. On
    -- failure the loan stays 'approved' — the bank tops up and retries.
    UPDATE entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) - v_loan.principal
     WHERE id = v_loan.lender_corp_id
       AND COALESCE(treasury_cash, 0) >= v_loan.principal;
    IF NOT FOUND THEN
        SELECT floor(COALESCE(treasury_cash, 0))::bigint INTO v_bank_funds
          FROM entrepreneur_corps WHERE id = v_loan.lender_corp_id;
        RETURN jsonb_build_object('success', false, 'reason', 'bank_insufficient_funds',
            'have', COALESCE(v_bank_funds, 0), 'need', v_loan.principal);
    END IF;

    UPDATE entrepreneur_corps SET treasury_cash = COALESCE(treasury_cash, 0) + v_loan.principal
     WHERE id = v_loan.borrower_corp_id;

    -- Disburse: term starts now. Guard on status so a double-click /
    -- concurrent issue can't disburse twice.
    UPDATE corp_loans
       SET status = 'active', started_at_tick = v_tick
     WHERE id = p_loan_id AND status = 'approved';
    IF NOT FOUND THEN
        -- Lost the race; refund the treasury moves we just made and bail.
        UPDATE entrepreneur_corps SET treasury_cash = COALESCE(treasury_cash, 0) + v_loan.principal
         WHERE id = v_loan.lender_corp_id;
        UPDATE entrepreneur_corps SET treasury_cash = COALESCE(treasury_cash, 0) - v_loan.principal
         WHERE id = v_loan.borrower_corp_id;
        RETURN jsonb_build_object('success', false, 'reason', 'loan_not_approved');
    END IF;

    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_borrower_corp.hq_nation_id, v_fac.id,
        'Loan Issued',
        format('%s disburses $%s to %s — %s%% APR, %s ticks × $%s per tick.',
               v_bank_corp.name,
               to_char(v_loan.principal, 'FM999,999,999,999'),
               v_borrower_corp.name,
               to_char(v_loan.apr * 100, 'FM99.99'),
               v_loan.term_ticks,
               to_char(v_loan.per_tick_payment, 'FM999,999,999,999')),
        'corporate', 'corp_loan_issued',
        jsonb_build_object(
            'loan_id',          p_loan_id,
            'borrower_corp_id', v_loan.borrower_corp_id,
            'lender_corp_id',   v_loan.lender_corp_id,
            'principal',        v_loan.principal,
            'apr',              v_loan.apr,
            'term_ticks',       v_loan.term_ticks,
            'per_tick_payment', v_loan.per_tick_payment
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',   true,
        'loan_id',   p_loan_id,
        'principal', v_loan.principal
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.issue_corp_loan(uuid) TO authenticated;

-- ── process_corp_loans — per-tick repayment from corp treasuries ──
CREATE OR REPLACE FUNCTION public.process_corp_loans(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    r            RECORD;
    v_tick       int;
    v_expired    int := 0;
    v_paid       int := 0;
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

    -- Per-tick repayment: borrower CORP treasury → lender CORP treasury.
    -- started_at_tick < v_tick gives the borrower one full tick with the
    -- principal before the first charge; last_payment_tick gate prevents
    -- double-billing if this runs twice in a tick.
    FOR r IN
        SELECT id, borrower_corp_id, lender_corp_id, per_tick_payment,
               payments_remaining, total_paid
          FROM corp_loans
         WHERE status = 'active'
           AND payments_remaining > 0
           AND started_at_tick < v_tick
           AND (last_payment_tick IS NULL OR last_payment_tick < v_tick)
         FOR UPDATE
    LOOP
        -- Debit the borrower corp treasury; default if it can't cover
        -- (also covers a missing/dissolved borrower corp → no row updated).
        UPDATE entrepreneur_corps
           SET treasury_cash = COALESCE(treasury_cash, 0) - r.per_tick_payment
         WHERE id = r.borrower_corp_id
           AND COALESCE(treasury_cash, 0) >= r.per_tick_payment;
        IF NOT FOUND THEN
            UPDATE corp_loans
               SET status = 'defaulted', defaulted_at_tick = v_tick
             WHERE id = r.id;
            v_defaulted := v_defaulted + 1;
            CONTINUE;
        END IF;

        -- Credit the lender corp treasury.
        UPDATE entrepreneur_corps
           SET treasury_cash = COALESCE(treasury_cash, 0) + r.per_tick_payment
         WHERE id = r.lender_corp_id;

        UPDATE corp_loans
           SET payments_remaining = payments_remaining - 1,
               total_paid         = total_paid + r.per_tick_payment,
               last_payment_tick  = v_tick,
               status             = CASE WHEN payments_remaining - 1 = 0 THEN 'repaid' ELSE 'active' END
         WHERE id = r.id;

        IF r.payments_remaining - 1 = 0 THEN
            v_repaid := v_repaid + 1;
        ELSE
            v_paid := v_paid + 1;
        END IF;
    END LOOP;

    RETURN jsonb_build_object('success', true,
        'expired',    v_expired,
        'paid',       v_paid,
        'repaid',     v_repaid,
        'defaulted',  v_defaulted,
        'tick',       v_tick);
END;
$$;
GRANT EXECUTE ON FUNCTION public.process_corp_loans(int) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
