-- ════════════════════════════════════════════════════════════════════
-- Personal loans — entrepreneur faction borrows from a banking corp
--
-- Replaces the "Standing & Influence" placeholder on
-- entrepreneur-dashboard.html with a real debt mechanic.
-- Entrepreneurs can request personal cash from a player-owned banking
-- corp in their home nation. The loan auto-accepts against the first
-- qualifying bank, the bank's owner.party_funds debits the principal,
-- the borrower's party_funds credits the principal. Interest accrues
-- lazily (on read + on payment) so we don't need a tick handler.
--
-- ── Pricing / terms ─────────────────────────────────────────────────
--   Principal range:  $100,000 .. $25,000,000
--   APR:              fixed 8% (column carries it for future flexibility)
--   One active loan per entrepreneur (unique partial index).
--   No fixed term — loan stays open until borrower pays it off.
--
-- ── Bank eligibility (mirrors corp_loans 20270174) ──────────────────
--   • industry = 'banking'
--   • hq_nation_id = borrower's nation
--   • owns a completed building_type='banking_office' in borrower's nation
--   • owner_faction.party_funds >= principal
-- First match wins (ORDER BY corp.id for determinism). If none, the
-- request is rejected with reason='no_bank_available' — borrower has
-- to wait for a banking corp to exist + capitalise.
--
-- ── Money flow ──────────────────────────────────────────────────────
-- At request (auto-accept):
--   bank_owner.party_funds  -= principal
--   borrower.party_funds    += principal
-- At payment:
--   borrower.party_funds    -= payment_amount
--   bank_owner.party_funds  += payment_amount
-- If the bank corp is deleted between accept and payoff, the
-- lender_corp_id FK ON DELETE SET NULL preserves the loan and
-- payments become a money sink (no one receives them). Flagged as
-- a soft carry-over — preserves the loan's existence but the cash
-- vanishes.
--
-- ── Interest accrual (lazy / simple interest on remaining principal) ─
--   each accrual_tick:
--     new_interest = principal_remaining × apr/100 / TICKS_PER_YEAR × ticks_passed
--   accrued_interest_unpaid += new_interest
--   last_accrual_tick = current_tick
-- Payments apply to accrued_interest first, then to principal_remaining.
-- When both = 0 the loan moves to status='paid'.
-- TICKS_PER_YEAR = 144 (matches the politician aging formula).
--
-- ── Tables + RPCs ───────────────────────────────────────────────────
--   personal_loans (table)
--   get_my_personal_loan()         — read-side helper for the UI
--   request_personal_loan(bigint)  — borrower request + auto-accept
--   make_personal_loan_payment(uuid, bigint)
-- All RPCs are SECURITY DEFINER. No client writes allowed on the
-- table (RLS SELECT-only for authenticated, no INSERT/UPDATE policy).
--
-- ── Deferred ────────────────────────────────────────────────────────
-- * Bank-side approval UI (loans auto-accept today).
-- * Borrower-set APR (fixed 8% today).
-- * Default mechanic / payment due dates (loan just grows if unpaid).
-- * Block found_entrepreneur_corp while in personal debt — pairs with
--   the existing ent_unpaid_debt gate; same pattern, separate commit.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.personal_loans (
    id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    borrower_faction_id      uuid NOT NULL REFERENCES factions(id)            ON DELETE CASCADE,
    lender_corp_id           uuid          REFERENCES entrepreneur_corps(id)  ON DELETE SET NULL,
    principal                bigint  NOT NULL CHECK (principal > 0),
    apr_pct                  numeric NOT NULL CHECK (apr_pct >= 0 AND apr_pct <= 50),
    status                   text    NOT NULL DEFAULT 'active'
                                  CHECK (status IN ('active', 'paid')),
    principal_remaining      bigint  NOT NULL CHECK (principal_remaining >= 0),
    accrued_interest_unpaid  numeric NOT NULL DEFAULT 0
                                  CHECK (accrued_interest_unpaid >= 0),
    last_accrual_tick        int     NOT NULL,
    requested_at_tick        int     NOT NULL,
    closed_at_tick           int,
    created_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_personal_loans_borrower_status
    ON personal_loans (borrower_faction_id, status);

-- One active loan per borrower. Partial index so paid loans can stack
-- (history) but only one active at a time.
CREATE UNIQUE INDEX IF NOT EXISTS personal_loans_one_active_per_borrower
    ON personal_loans (borrower_faction_id) WHERE status = 'active';

ALTER TABLE personal_loans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated read personal_loans" ON personal_loans;
CREATE POLICY "Authenticated read personal_loans" ON personal_loans
    FOR SELECT TO authenticated USING (true);

-- ── 2. Constants ────────────────────────────────────────────────────
-- Inlined in the RPCs below; named here for the migration's
-- documentation only.
--   PERSONAL_LOAN_APR_PCT = 8.0
--   MIN_PRINCIPAL         = 100_000
--   MAX_PRINCIPAL         = 25_000_000
--   TICKS_PER_YEAR        = 144

-- ── 3. get_my_personal_loan ─────────────────────────────────────────
-- Returns the caller's active loan with computed current-owed (lazy
-- accrual baked in — UI never re-implements the math).
--   { has_loan: false }
--   { has_loan: true, loan_id, principal, principal_remaining,
--     apr_pct, accrued_interest, total_owed, lender_corp_name,
--     requested_at_tick, current_tick }
CREATE OR REPLACE FUNCTION public.get_my_personal_loan()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid              uuid := auth.uid();
    v_fac              factions%ROWTYPE;
    v_loan             personal_loans%ROWTYPE;
    v_tick             int;
    v_ticks_passed     int;
    v_new_interest     numeric;
    v_total_interest   numeric;
    v_lender_name      text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('has_loan', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('has_loan', false, 'reason', 'no_entrepreneur');
    END IF;

    SELECT * INTO v_loan FROM personal_loans
     WHERE borrower_faction_id = v_fac.id AND status = 'active'
     LIMIT 1;
    IF v_loan.id IS NULL THEN
        RETURN jsonb_build_object('has_loan', false);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, v_loan.last_accrual_tick);
    v_ticks_passed := GREATEST(0, v_tick - v_loan.last_accrual_tick);
    v_new_interest := v_loan.principal_remaining
                    * v_loan.apr_pct / 100.0
                    / 144.0
                    * v_ticks_passed;
    v_total_interest := v_loan.accrued_interest_unpaid + v_new_interest;

    SELECT name INTO v_lender_name FROM entrepreneur_corps WHERE id = v_loan.lender_corp_id;

    RETURN jsonb_build_object(
        'has_loan',             true,
        'loan_id',              v_loan.id,
        'principal',            v_loan.principal,
        'principal_remaining',  v_loan.principal_remaining,
        'apr_pct',              v_loan.apr_pct,
        'accrued_interest',     ROUND(v_total_interest)::bigint,
        'total_owed',           v_loan.principal_remaining + ROUND(v_total_interest)::bigint,
        'lender_corp_name',     v_lender_name,
        'requested_at_tick',    v_loan.requested_at_tick,
        'current_tick',         v_tick
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_personal_loan() TO authenticated;

-- ── 4. request_personal_loan ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.request_personal_loan(p_principal bigint)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_fac          factions%ROWTYPE;
    v_tick         int;
    v_bank_corp_id uuid;
    v_bank_fac_id  uuid;
    v_loan_id      uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_principal IS NULL OR p_principal < 100000 OR p_principal > 25000000 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_principal');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;
    IF v_fac.nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_nation');
    END IF;

    -- Block if active loan exists. Belt-and-braces with the unique
    -- partial index — friendlier reason than catching unique_violation.
    IF EXISTS (
        SELECT 1 FROM personal_loans
         WHERE borrower_faction_id = v_fac.id AND status = 'active'
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'loan_already_active');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Find the first qualifying bank: banking corp in borrower's
    -- nation with a completed banking_office AND owner has the cash.
    -- ORDER BY id for determinism (first banking corp founded wins
    -- the loan; deterministic across reruns).
    SELECT c.id, c.owner_faction_id
      INTO v_bank_corp_id, v_bank_fac_id
      FROM entrepreneur_corps c
     WHERE c.industry     = 'banking'
       AND c.hq_nation_id = v_fac.nation_id
       AND EXISTS (
            SELECT 1 FROM corp_buildings b
             WHERE b.owner_corp_id  = c.id
               AND b.nation_id      = v_fac.nation_id
               AND b.building_type  = 'banking_office'
               AND b.status         = 'completed'
       )
       AND EXISTS (
            SELECT 1 FROM factions bf
             WHERE bf.id = c.owner_faction_id
               AND COALESCE(bf.party_funds, 0) >= p_principal
       )
     ORDER BY c.id ASC
     LIMIT 1;

    IF v_bank_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_bank_available',
            'principal', p_principal);
    END IF;

    -- Atomic debit on bank owner. The WHERE guard re-checks funds
    -- post-lock — handles the race where the bank's cash changed
    -- between SELECT and UPDATE.
    UPDATE factions
       SET party_funds = COALESCE(party_funds, 0) - p_principal
     WHERE id = v_bank_fac_id
       AND COALESCE(party_funds, 0) >= p_principal;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bank_funds_changed');
    END IF;

    -- Credit borrower.
    UPDATE factions
       SET party_funds = COALESCE(party_funds, 0) + p_principal
     WHERE id = v_fac.id;

    INSERT INTO personal_loans (
        borrower_faction_id, lender_corp_id,
        principal, apr_pct, status,
        principal_remaining, accrued_interest_unpaid, last_accrual_tick,
        requested_at_tick
    ) VALUES (
        v_fac.id, v_bank_corp_id,
        p_principal, 8.0, 'active',
        p_principal, 0, v_tick,
        v_tick
    ) RETURNING id INTO v_loan_id;

    RETURN jsonb_build_object(
        'success',        true,
        'loan_id',        v_loan_id,
        'principal',      p_principal,
        'apr_pct',        8.0,
        'lender_corp_id', v_bank_corp_id
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.request_personal_loan(bigint) TO authenticated;

-- ── 5. make_personal_loan_payment ───────────────────────────────────
-- Applies a payment: lazy-accrues interest, splits payment
-- interest-first then principal, transfers cash borrower→bank,
-- closes the loan if fully paid off. Overpayment is capped — only
-- the actual outstanding is taken from party_funds, not the
-- requested amount.
CREATE OR REPLACE FUNCTION public.make_personal_loan_payment(
    p_loan_id uuid,
    p_amount  bigint
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid              uuid := auth.uid();
    v_fac              factions%ROWTYPE;
    v_loan             personal_loans%ROWTYPE;
    v_tick             int;
    v_ticks_passed     int;
    v_new_interest     numeric;
    v_total_interest   numeric;
    v_int_due_bigint   bigint;
    v_interest_paid    bigint;
    v_principal_paid   bigint;
    v_actual           bigint;
    v_remaining_amount bigint;
    v_bank_fac_id      uuid;
    v_new_status       text;
    v_new_closed       int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_amount IS NULL OR p_amount <= 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_amount');
    END IF;

    -- Lock the loan + the borrower in lock-order (loan first, then
    -- faction) — same order in both RPCs to avoid deadlocks.
    SELECT * INTO v_loan FROM personal_loans WHERE id = p_loan_id FOR UPDATE;
    IF v_loan.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'loan_not_found');
    END IF;
    IF v_loan.status <> 'active' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'loan_not_active');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;
    IF v_fac.id <> v_loan.borrower_faction_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_borrower');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, v_loan.last_accrual_tick);
    v_ticks_passed := GREATEST(0, v_tick - v_loan.last_accrual_tick);

    -- Lazy interest accrual on remaining principal.
    v_new_interest := v_loan.principal_remaining
                    * v_loan.apr_pct / 100.0
                    / 144.0
                    * v_ticks_passed;
    v_total_interest := v_loan.accrued_interest_unpaid + v_new_interest;
    v_int_due_bigint := ROUND(v_total_interest)::bigint;

    -- Payment split: interest first, then principal. Cap at actual owed.
    v_remaining_amount := p_amount;
    v_interest_paid    := LEAST(v_remaining_amount, v_int_due_bigint);
    v_remaining_amount := v_remaining_amount - v_interest_paid;
    v_principal_paid   := LEAST(v_remaining_amount, v_loan.principal_remaining);
    v_actual           := v_interest_paid + v_principal_paid;

    IF COALESCE(v_fac.party_funds, 0) < v_actual THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', COALESCE(v_fac.party_funds, 0), 'need', v_actual);
    END IF;

    -- Move cash.
    UPDATE factions
       SET party_funds = COALESCE(party_funds, 0) - v_actual
     WHERE id = v_fac.id;
    SELECT owner_faction_id INTO v_bank_fac_id FROM entrepreneur_corps WHERE id = v_loan.lender_corp_id;
    IF v_bank_fac_id IS NOT NULL THEN
        UPDATE factions
           SET party_funds = COALESCE(party_funds, 0) + v_actual
         WHERE id = v_bank_fac_id;
    END IF;
    -- If lender_corp_id is NULL (bank deleted) or its owner is gone,
    -- the payment is sunk. Documented in the header.

    -- Apply to loan: store remaining interest (numeric, not the
    -- rounded bigint) so fractional-tick accrual remains precise
    -- across many partial payments.
    v_new_status := CASE
        WHEN (v_loan.principal_remaining - v_principal_paid) = 0
         AND (v_total_interest - v_interest_paid)            <= 0.5
        THEN 'paid'
        ELSE 'active'
    END;
    v_new_closed := CASE WHEN v_new_status = 'paid' THEN v_tick ELSE NULL END;

    UPDATE personal_loans
       SET principal_remaining     = principal_remaining - v_principal_paid,
           accrued_interest_unpaid = GREATEST(0, v_total_interest - v_interest_paid),
           last_accrual_tick       = v_tick,
           status                  = v_new_status,
           closed_at_tick          = v_new_closed
     WHERE id = p_loan_id;

    RETURN jsonb_build_object(
        'success',           true,
        'loan_id',           p_loan_id,
        'paid',              v_actual,
        'interest_paid',     v_interest_paid,
        'principal_paid',    v_principal_paid,
        'principal_remaining', v_loan.principal_remaining - v_principal_paid,
        'accrued_interest',  GREATEST(0, ROUND(v_total_interest - v_interest_paid)::bigint),
        'status',            v_new_status
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.make_personal_loan_payment(uuid, bigint) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
