-- ════════════════════════════════════════════════════════════════════
-- CENTRAL BANK LOANS — corp borrows from its home nation's Central Bank
-- ════════════════════════════════════════════════════════════════════
-- Alternative to the bank-negotiation flow in the corp Request Loan modal
-- (corp_loan_requests → banks make corp_loan_offers). A corp can instead
-- borrow directly from its HOME nation's Central Bank: AUTO-ISSUED at the
-- posted rate (nations.central_bank_interest_rate), no negotiation, as long
-- as it's within the bank's lending capacity.
--
-- Borrower is the CORP (entrepreneur_corps); money is disbursed to / repaid
-- from treasury_cash, consistent with the corp loan system this sits beside.
-- The Central Bank is the lender (not a faction), so loans live in their own
-- table.
--
-- Capacity model (locked design):
--   • lending capacity = central_bank_discretionary × $100M.
--     central_bank_discretionary is RAW dollars (displayed as raw/$1M, e.g.
--     "$50"), so capacity_raw = central_bank_discretionary × 100.
--   • Active-loan `outstanding` draws capacity down; available = capacity −
--     Σ(outstanding). Repaying principal frees it back up.
--   • Repayments flow back into the pool (handled per-tick in
--     advance-corp-tick, NOT here): principal restores capacity (outstanding↓),
--     interest grows central_bank_discretionary by interest/100 so capacity
--     grows by the interest amount 1:1 (capacity = discretionary × 100).
--
-- v1: a seated Governor is NOT required to borrow (the facility lends at the
-- posted rate; the Governor only sets the rate). SECURITY DEFINER —
-- treasury_cash and central_bank_* are client-write-revoked.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS public.central_bank_loans (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id         UUID NOT NULL REFERENCES nations(id),                          -- lending Central Bank's nation
    borrower_corp_id  UUID NOT NULL REFERENCES entrepreneur_corps(id) ON DELETE CASCADE,
    principal         BIGINT NOT NULL CHECK (principal > 0),                          -- raw dollars
    outstanding       BIGINT NOT NULL,                                               -- remaining principal (raw)
    interest_rate     NUMERIC(5,2) NOT NULL,                                         -- annual %, posted rate at issue
    term_ticks        INTEGER NOT NULL CHECK (term_ticks >= 1),
    status            TEXT NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active','repaid','defaulted')),
    started_tick      INTEGER NOT NULL,
    last_payment_tick INTEGER,
    payments_missed   INTEGER NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cb_loans_nation   ON central_bank_loans (nation_id)        WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_cb_loans_borrower ON central_bank_loans (borrower_corp_id);

ALTER TABLE public.central_bank_loans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS central_bank_loans_read ON public.central_bank_loans;
CREATE POLICY central_bank_loans_read ON public.central_bank_loans FOR SELECT TO authenticated USING (true);

COMMENT ON TABLE public.central_bank_loans IS
    'Loans from a nation''s Central Bank to a borrower corp, auto-issued at the posted rate. outstanding draws down lending capacity (central_bank_discretionary × 100). Disbursed to / repaid from entrepreneur_corps.treasury_cash; repayment runs per-tick in advance-corp-tick.';

-- ── request_central_bank_loan ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.request_central_bank_loan(
    p_corp_id UUID, p_principal BIGINT, p_term_ticks INT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_uid         UUID := auth.uid();
    v_fac         factions%ROWTYPE;
    v_corp        entrepreneur_corps%ROWTYPE;
    v_nation      nations%ROWTYPE;
    v_capacity    BIGINT;
    v_outstanding BIGINT;
    v_available   BIGINT;
    v_tick        INT;
    v_id          UUID;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;
    IF p_corp_id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;
    IF p_principal IS NULL OR p_principal < 1 THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_amount'); END IF;
    IF p_term_ticks IS NULL OR p_term_ticks < 12 OR p_term_ticks > 240 THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_term'); END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;

    -- Caller must own the borrowing corp (VERBATIM the entrepreneur prelude).
    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1 FOR UPDATE;
    IF v_fac.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur'); END IF;
    IF v_corp.owner_faction_id <> v_fac.id THEN RETURN jsonb_build_object('success', false, 'reason', 'not_owner'); END IF;

    -- The corp's home-nation Central Bank.
    SELECT * INTO v_nation FROM nations WHERE id = v_corp.hq_nation_id FOR UPDATE;
    IF v_nation.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'no_nation'); END IF;
    IF v_nation.central_bank_interest_rate IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_central_bank');
    END IF;

    -- Capacity = discretionary × 100 (raw $); active outstanding draws it down.
    v_capacity := COALESCE(v_nation.central_bank_discretionary, 0) * 100;
    SELECT COALESCE(SUM(outstanding), 0) INTO v_outstanding
      FROM central_bank_loans WHERE nation_id = v_nation.id AND status = 'active';
    v_available := v_capacity - v_outstanding;
    IF p_principal > v_available THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_capacity',
            'available', GREATEST(v_available, 0), 'requested', p_principal);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Disburse to the corp treasury; record the loan (outstanding = principal).
    UPDATE entrepreneur_corps SET treasury_cash = COALESCE(treasury_cash, 0) + p_principal
     WHERE id = v_corp.id;
    -- Keep the corp cash ledger in sync (SSoT helper, 20260712).
    PERFORM emit_corp_cash_event(v_corp.id, 'capital_in', 'Central Bank loan', p_principal, v_tick);

    INSERT INTO central_bank_loans
        (nation_id, borrower_corp_id, principal, outstanding, interest_rate, term_ticks, status, started_tick)
    VALUES (v_nation.id, v_corp.id, p_principal, p_principal, v_nation.central_bank_interest_rate, p_term_ticks, 'active', v_tick)
    RETURNING id INTO v_id;

    INSERT INTO event_log (nation_id, faction_id, event_name, description_used, category, trigger_key, effects_applied, fired_at_tick)
    VALUES (v_nation.id, v_fac.id, 'Central Bank Loan Issued',
            format('%s borrowed $%s from the Central Bank at %s%% over %s ticks.',
                   v_corp.name, p_principal, to_char(v_nation.central_bank_interest_rate, 'FM999990.00'), p_term_ticks),
            'corporate', 'central_bank_loan_issued',
            jsonb_build_object('loan_id', v_id, 'corp_id', v_corp.id, 'principal', p_principal,
                               'rate', v_nation.central_bank_interest_rate, 'term_ticks', p_term_ticks),
            v_tick);

    RETURN jsonb_build_object('success', true, 'loan_id', v_id, 'principal', p_principal,
                              'rate', v_nation.central_bank_interest_rate, 'term_ticks', p_term_ticks,
                              'available_after', v_available - p_principal);
END; $$;

GRANT EXECUTE ON FUNCTION public.request_central_bank_loan(UUID, BIGINT, INT) TO authenticated;

COMMENT ON FUNCTION public.request_central_bank_loan(UUID, BIGINT, INT) IS
    'Auto-issues a loan from the corp''s home-nation Central Bank at the posted rate, if within lending capacity (central_bank_discretionary × 100 − outstanding). Disburses to treasury_cash. Owner-only; repaid per-tick in advance-corp-tick. SECURITY DEFINER.';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.request_central_bank_loan(UUID, BIGINT, INT);
-- DROP TABLE IF EXISTS public.central_bank_loans;
-- COMMIT;
