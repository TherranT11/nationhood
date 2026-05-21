-- ════════════════════════════════════════════════════════════════════
-- CORP LOANS v2 — deferred disbursement (bank CEO issues the loan)
-- ════════════════════════════════════════════════════════════════════
-- Splits the v1 (20270177) accept step into two:
--
--   accept_loan_offer (borrower)  — picks a bank's offer. NO money
--       moves. Spawns a corp_loans row in the NEW 'approved' state
--       (term not started, started_at_tick NULL). Other pending offers
--       auto-decline and the request locks, exactly as before — the
--       deal is reserved for this bank.
--
--   issue_corp_loan (bank CEO)    — the [Issue Loan] action in the
--       bank's Active Projects / Corporate Finance panel. Atomically
--       debits the bank's owner faction, credits the borrower's, flips
--       the loan to 'active', and stamps started_at_tick = now (the
--       term starts here). The per-tick processor only ever serviced
--       'active' loans, so 'approved' loans are untouched until issued.
--
-- Locked design decisions:
--   • [Issue Loan] is what moves the money (loan inert until issued).
--   • If the bank's treasury can't cover the principal at issue time,
--     issue_corp_loan fails (loan stays 'approved') — the bank tops up
--     and retries. No borrower rescind.
--   • No auto-expiry: an approved-but-unissued loan sits until issued.
--     process_corp_loans is unchanged — no new tick automation.
--
-- Money is still conserved: the only debit/credit pair now lives in
-- issue_corp_loan instead of accept_loan_offer.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- 'approved' = accepted by borrower, not yet disbursed by the bank.
ALTER TABLE corp_loans DROP CONSTRAINT IF EXISTS corp_loans_status_check;
ALTER TABLE corp_loans
    ADD CONSTRAINT corp_loans_status_check
    CHECK (status IN ('approved','active','repaid','defaulted'));

-- Approved loans haven't started their term yet.
ALTER TABLE corp_loans ALTER COLUMN started_at_tick DROP NOT NULL;

COMMENT ON COLUMN corp_loans.started_at_tick IS
    'Tick the loan was DISBURSED (issue_corp_loan) and the term began. NULL while status=''approved'' (accepted but not yet issued).';

-- ── accept_loan_offer — now parks the loan 'approved' (no money) ──
CREATE OR REPLACE FUNCTION public.accept_loan_offer(p_offer_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid              uuid := auth.uid();
    v_fac              factions%ROWTYPE;
    v_offer            corp_loan_offers%ROWTYPE;
    v_request          corp_loan_requests%ROWTYPE;
    v_borrower_corp    entrepreneur_corps%ROWTYPE;
    v_bank_corp        entrepreneur_corps%ROWTYPE;
    v_tick             int;
    v_per_tick         bigint;
    v_loan_id          uuid;
    v_auto_declined    int := 0;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_offer_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_offer FROM corp_loan_offers WHERE id = p_offer_id FOR UPDATE;
    IF v_offer.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'offer_not_found');
    END IF;
    IF v_offer.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'offer_not_pending');
    END IF;

    SELECT * INTO v_request FROM corp_loan_requests WHERE id = v_offer.request_id FOR UPDATE;
    IF v_request.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_not_found');
    END IF;
    IF v_request.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_not_pending');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF v_request.expires_at_tick <= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_expired');
    END IF;

    SELECT * INTO v_borrower_corp FROM entrepreneur_corps WHERE id = v_request.borrower_corp_id;
    IF v_borrower_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'borrower_corp_not_found');
    END IF;
    SELECT * INTO v_bank_corp FROM entrepreneur_corps WHERE id = v_offer.bank_corp_id;
    IF v_bank_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bank_corp_not_found');
    END IF;

    -- Caller = borrower-corp owner faction.
    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;
    IF v_borrower_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_borrower_corp_owner');
    END IF;

    -- Per-tick payment from THIS offer's APR. Stored now; the term only
    -- starts when the bank issues. NO money moves here.
    v_per_tick := GREATEST(1, ROUND(
        v_request.principal::numeric / v_request.term_ticks
        + v_request.principal::numeric * v_offer.apr / 12
    )::bigint);

    INSERT INTO corp_loans
        (request_id, borrower_corp_id, lender_corp_id, principal, apr, term_ticks,
         per_tick_payment, payments_remaining, status, started_at_tick)
    VALUES
        (v_offer.request_id, v_request.borrower_corp_id, v_offer.bank_corp_id,
         v_request.principal, v_offer.apr, v_request.term_ticks,
         v_per_tick, v_request.term_ticks, 'approved', NULL)
    RETURNING id INTO v_loan_id;

    UPDATE corp_loan_offers
       SET status = 'accepted', finalized_at_tick = v_tick
     WHERE id = p_offer_id;
    UPDATE corp_loan_offers
       SET status = 'auto_declined', finalized_at_tick = v_tick
     WHERE request_id = v_offer.request_id
       AND status = 'pending'
       AND id <> p_offer_id;
    GET DIAGNOSTICS v_auto_declined = ROW_COUNT;

    UPDATE corp_loan_requests
       SET status = 'accepted', accepted_by_corp_id = v_offer.bank_corp_id,
           finalized_at_tick = v_tick
     WHERE id = v_offer.request_id;

    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_borrower_corp.hq_nation_id, v_fac.id,
        'Loan Approved',
        format('%s accepts %s%% APR from %s — awaiting disbursement. $%s over %s ticks.',
               v_borrower_corp.name,
               to_char(v_offer.apr * 100, 'FM99.99'),
               v_bank_corp.name,
               to_char(v_request.principal, 'FM999,999,999,999'),
               v_request.term_ticks),
        'corporate', 'corp_loan_approved',
        jsonb_build_object(
            'loan_id',            v_loan_id,
            'offer_id',           p_offer_id,
            'request_id',         v_offer.request_id,
            'borrower_corp_id',   v_request.borrower_corp_id,
            'borrower_corp_name', v_borrower_corp.name,
            'lender_corp_id',     v_offer.bank_corp_id,
            'lender_corp_name',   v_bank_corp.name,
            'principal',          v_request.principal,
            'apr',                v_offer.apr,
            'term_ticks',         v_request.term_ticks,
            'per_tick_payment',   v_per_tick,
            'auto_declined',      v_auto_declined
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',          true,
        'status',           'approved',
        'loan_id',          v_loan_id,
        'offer_id',         p_offer_id,
        'request_id',       v_offer.request_id,
        'principal',        v_request.principal,
        'apr',              v_offer.apr,
        'per_tick_payment', v_per_tick,
        'term_ticks',       v_request.term_ticks,
        'auto_declined',    v_auto_declined
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_loan_offer(uuid) TO authenticated;

COMMENT ON FUNCTION public.accept_loan_offer(uuid) IS
    'Borrower picks a bank''s offer. NO money moves — spawns a corp_loans row in ''approved'' (term not started). Other pending offers auto-decline and the request locks. The bank then calls issue_corp_loan to disburse.';

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
    v_borrower_fac_id uuid;
    v_bank_fac_id     uuid;
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

    -- Lock both corp owner factions in a stable order (deadlock-safe).
    PERFORM id FROM entrepreneur_corps
     WHERE id IN (v_loan.lender_corp_id, v_loan.borrower_corp_id)
     ORDER BY id FOR UPDATE;

    SELECT * INTO v_bank_corp FROM entrepreneur_corps WHERE id = v_loan.lender_corp_id;
    IF v_bank_corp.id IS NULL OR v_bank_corp.owner_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bank_corp_not_found');
    END IF;
    v_bank_fac_id := v_bank_corp.owner_faction_id;

    SELECT * INTO v_borrower_corp FROM entrepreneur_corps WHERE id = v_loan.borrower_corp_id;
    IF v_borrower_corp.id IS NULL OR v_borrower_corp.owner_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'borrower_corp_not_found');
    END IF;
    v_borrower_fac_id := v_borrower_corp.owner_faction_id;

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

    -- Atomic affordability + debit on the bank's owner faction. On
    -- failure the loan stays 'approved' — the bank tops up and retries.
    UPDATE factions
       SET party_funds = COALESCE(party_funds, 0) - v_loan.principal
     WHERE id = v_bank_fac_id
       AND COALESCE(party_funds, 0) >= v_loan.principal;
    IF NOT FOUND THEN
        SELECT COALESCE(party_funds, 0) INTO v_bank_funds FROM factions WHERE id = v_bank_fac_id;
        RETURN jsonb_build_object('success', false, 'reason', 'bank_insufficient_funds',
            'have', COALESCE(v_bank_funds, 0), 'need', v_loan.principal);
    END IF;

    UPDATE factions SET party_funds = COALESCE(party_funds, 0) + v_loan.principal
     WHERE id = v_borrower_fac_id;

    -- Disburse: term starts now. Guard on status so a double-click /
    -- concurrent issue can't disburse twice.
    UPDATE corp_loans
       SET status = 'active', started_at_tick = v_tick
     WHERE id = p_loan_id AND status = 'approved';
    IF NOT FOUND THEN
        -- Lost the race; refund the debit we just made and bail.
        UPDATE factions SET party_funds = COALESCE(party_funds, 0) + v_loan.principal
         WHERE id = v_bank_fac_id;
        UPDATE factions SET party_funds = COALESCE(party_funds, 0) - v_loan.principal
         WHERE id = v_borrower_fac_id;
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

COMMENT ON FUNCTION public.issue_corp_loan(uuid) IS
    'Bank-corp owner (CEO) disburses an ''approved'' corp loan: atomic debit of the bank''s owner faction → credit the borrower''s, loan → ''active'', started_at_tick = now (term begins). Fails (loan stays approved) if the bank can''t cover the principal.';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- Re-running 20270177 restores accept_loan_offer (disburse-at-accept).
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.issue_corp_loan(uuid);
-- ALTER TABLE corp_loans DROP CONSTRAINT IF EXISTS corp_loans_status_check;
-- ALTER TABLE corp_loans ADD CONSTRAINT corp_loans_status_check
--     CHECK (status IN ('active','repaid','defaulted'));
-- -- (No approved rows must remain before re-adding the NOT NULL.)
-- ALTER TABLE corp_loans ALTER COLUMN started_at_tick SET NOT NULL;
-- COMMIT;
