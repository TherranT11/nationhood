-- ════════════════════════════════════════════════════════════════════
-- CORP LOANS v0 — global broadcast + per-tick simple-interest repay
-- ════════════════════════════════════════════════════════════════════
-- New corporate-finance action for entrepreneur corps. Borrower
-- submits a loan request; the request becomes visible in EVERY
-- Banking corp's Active Projects panel. Only banks that own a
-- completed Banking Office in the borrower's HQ nation can act
-- on it — other banks see it greyed-out (UI is the visibility
-- audience; eligibility is enforced server-side at accept-time).
-- First eligible bank to accept funds the loan immediately;
-- request flips to 'accepted' and disappears from every other
-- bank's view. Per-tick simple-interest repayment by the tick
-- processor. A single missed payment defaults the loan (locked
-- v0; harsher than reality but keeps the model small).
--
-- ── Eligibility (enforced in accept_corp_loan_request) ──────────
-- A bank can accept iff:
--   • industry = 'banking', AND
--   • owns a completed building_type='banking_office' in the
--     borrower's HQ nation (per 20270170 banking-office sector lock).
-- Borrower can be ANY entrepreneur corp (any sector).
--
-- ── Money flow ──────────────────────────────────────────────────
-- At accept: lender-corp's owner_faction.party_funds debits the
-- principal; borrower-corp's owner_faction.party_funds credits.
-- Per-tick: borrower's owner_faction debits per_tick_payment;
-- lender's credits the same amount. Money is conserved across
-- every transition.
--
-- ── Math ────────────────────────────────────────────────────────
-- Simple interest amortised across the term in equal ticks:
--   total_owed     = principal × (1 + apr × term_ticks / 12)
--   per_tick_pmt   = ROUND(principal / term_ticks
--                          + principal × apr / 12)
-- TICKS_PER_YEAR = 12 (matches GAME_CONFIG.TICKS_PER_YEAR).
-- Small rounding drift per tick (∼cents); accepted in v0.
--
-- ── Constraints ─────────────────────────────────────────────────
--   principal   : $1,000,000 – $1,000,000,000  (CHECK)
--   term_ticks  : 12 – 240                     (CHECK)
--   apr         : 0.00 – 0.50                  (CHECK)
--   expiry      : 6 ticks (matches board votes + listing offers)
--   one pending request per borrower at a time (server enforces)
--
-- ── Schema ──────────────────────────────────────────────────────
-- corp_loan_requests  — request lifecycle. No per-bank join table:
--                       the broadcast audience is "every Banking
--                       corp"; eligibility is computed at accept
--                       time from corp_buildings, not stored.
-- corp_loans          — active / repaid / defaulted loans.
-- Both RLS SELECT-all, no write policy (RPC-only).
--
-- ── RPCs ────────────────────────────────────────────────────────
--   submit_corp_loan_request(borrower_corp_id, principal, term_ticks, apr)
--       Caller is borrower-corp owner. No bank list — request is
--       broadcast. Validates constraints + one-pending-only rule.
--
--   accept_corp_loan_request(request_id, bank_corp_id)
--       Caller owns bank corp. Validates bank is industry='banking'
--       AND owns a completed banking_office in borrower's HQ
--       nation (live eligibility check). Request must be 'pending'
--       and not expired. Atomic debit on bank-faction (same
--       conditional-UPDATE pattern as accept_offer audit). On
--       success: money flows, request → 'accepted', corp_loans
--       row created with computed per_tick_payment.
--
--   cancel_corp_loan_request(request_id)
--       Caller owns borrower corp. Pending only. Marks 'cancelled'.
--
--   process_corp_loans(p_tick) — tick handler
--       1. Expire requests where expires_at_tick <= shard.current_tick
--          AND status='pending'.
--       2. Service active loans: atomic conditional UPDATE debits
--          borrower; if WHERE fails (insufficient funds) → mark
--          defaulted. Else credit lender + decrement payments_remaining
--          + update last_payment_tick. Same shard-tick-ignore-p_tick
--          pattern as 20270166 (defence-in-depth against an
--          authenticated caller passing a future tick).
--
-- ── Tick processor hook ─────────────────────────────────────────
-- scripts/advance-tick-handler-template.ts gets a 3.6f block
-- calling process_corp_loans(newTick). Regenerate index.ts with
-- node scripts/sync-edge-function.js after applying this migration.
--
-- Idempotent. Re-runnable.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Tables ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS corp_loan_requests (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    borrower_corp_id    uuid NOT NULL REFERENCES entrepreneur_corps(id) ON DELETE CASCADE,
    principal           bigint NOT NULL CHECK (principal BETWEEN 1000000 AND 1000000000),
    term_ticks          int    NOT NULL CHECK (term_ticks BETWEEN 12 AND 240),
    apr                 numeric NOT NULL CHECK (apr >= 0 AND apr <= 0.5),
    status              text   NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','accepted','cancelled','expired')),
    placed_at_tick      int    NOT NULL,
    expires_at_tick     int    NOT NULL,
    accepted_by_corp_id uuid   REFERENCES entrepreneur_corps(id) ON DELETE SET NULL,
    finalized_at_tick   int,
    created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS corp_loans (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id          uuid REFERENCES corp_loan_requests(id) ON DELETE SET NULL,
    borrower_corp_id    uuid NOT NULL REFERENCES entrepreneur_corps(id) ON DELETE CASCADE,
    lender_corp_id      uuid NOT NULL REFERENCES entrepreneur_corps(id) ON DELETE CASCADE,
    principal           bigint NOT NULL,
    apr                 numeric NOT NULL,
    term_ticks          int    NOT NULL,
    per_tick_payment    bigint NOT NULL,
    payments_remaining  int    NOT NULL,
    total_paid          bigint NOT NULL DEFAULT 0,
    status              text   NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active','repaid','defaulted')),
    started_at_tick     int    NOT NULL,
    last_payment_tick   int,
    defaulted_at_tick   int,
    created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_corp_loan_requests_borrower
    ON corp_loan_requests (borrower_corp_id, status);
CREATE INDEX IF NOT EXISTS idx_corp_loan_requests_status
    ON corp_loan_requests (status, expires_at_tick) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_corp_loans_borrower
    ON corp_loans (borrower_corp_id, status);
CREATE INDEX IF NOT EXISTS idx_corp_loans_lender
    ON corp_loans (lender_corp_id, status);
CREATE INDEX IF NOT EXISTS idx_corp_loans_active
    ON corp_loans (status, payments_remaining) WHERE status = 'active';

ALTER TABLE corp_loan_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE corp_loans         ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for all" ON corp_loan_requests;
CREATE POLICY "Allow select for all" ON corp_loan_requests FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow select for all" ON corp_loans;
CREATE POLICY "Allow select for all" ON corp_loans FOR SELECT USING (true);

COMMENT ON TABLE corp_loan_requests IS
    'Borrower→all-banks loan request (global broadcast). Eligible banks (industry=banking + Banking Office in borrower HQ nation) act on it; first acceptance wins. Expiry 6 ticks. RPC-write-only.';
COMMENT ON TABLE corp_loans IS
    'Active / repaid / defaulted loans. per_tick_payment is computed at acceptance and stored — the tick processor reads it without recomputing.';

-- ── 2. submit_corp_loan_request ─────────────────────────────────

CREATE OR REPLACE FUNCTION public.submit_corp_loan_request(
    p_borrower_corp_id uuid,
    p_principal        bigint,
    p_term_ticks       int,
    p_apr              numeric
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid           uuid := auth.uid();
    v_fac           factions%ROWTYPE;
    v_corp          entrepreneur_corps%ROWTYPE;
    v_request_id    uuid;
    v_tick          int;
    v_expires_tick  int;
    v_nation_name   text;
    v_ceo_name      text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_borrower_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_principal IS NULL OR p_principal < 1000000 OR p_principal > 1000000000 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_principal');
    END IF;
    IF p_term_ticks IS NULL OR p_term_ticks < 12 OR p_term_ticks > 240 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_term');
    END IF;
    IF p_apr IS NULL OR p_apr < 0 OR p_apr > 0.5 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_apr');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps
     WHERE id = p_borrower_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.hq_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_hq_nation');
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
    IF v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    -- One pending request per borrower. Forces cancel-or-wait
    -- before re-submitting.
    IF EXISTS (
        SELECT 1 FROM corp_loan_requests
         WHERE borrower_corp_id = p_borrower_corp_id
           AND status = 'pending'
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_pending');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    v_expires_tick := v_tick + 6;

    INSERT INTO corp_loan_requests
        (borrower_corp_id, principal, term_ticks, apr,
         status, placed_at_tick, expires_at_tick)
    VALUES
        (p_borrower_corp_id, p_principal, p_term_ticks, p_apr,
         'pending', v_tick, v_expires_tick)
    RETURNING id INTO v_request_id;

    SELECT name INTO v_nation_name FROM nations WHERE id = v_corp.hq_nation_id;
    v_ceo_name := COALESCE(
        NULLIF(btrim(COALESCE(v_fac.leader_first_name, '') || ' ' || COALESCE(v_fac.leader_last_name, '')), ''),
        v_fac.faction_name, 'The CEO');

    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_corp.hq_nation_id, v_fac.id,
        'Loan Request Submitted',
        format('%s of %s requests a $%s loan over %s ticks at %s%% APR.',
               v_ceo_name, v_corp.name,
               to_char(p_principal, 'FM999,999,999,999'),
               p_term_ticks,
               to_char(p_apr * 100, 'FM99.99')),
        'corporate', 'corp_loan_request_submitted',
        jsonb_build_object(
            'request_id',       v_request_id,
            'borrower_corp_id', p_borrower_corp_id,
            'corp_name',        v_corp.name,
            'ceo_name',         v_ceo_name,
            'principal',        p_principal,
            'term_ticks',       p_term_ticks,
            'apr',              p_apr,
            'expires_at_tick',  v_expires_tick
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',         true,
        'request_id',      v_request_id,
        'principal',       p_principal,
        'term_ticks',      p_term_ticks,
        'apr',             p_apr,
        'expires_at_tick', v_expires_tick
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_corp_loan_request(uuid, bigint, int, numeric) TO authenticated;

COMMENT ON FUNCTION public.submit_corp_loan_request(uuid, bigint, int, numeric) IS
    'Borrower-corp owner submits a loan request. No bank targeting — broadcast model. Every Banking corp sees the pending request in their Active Projects; eligibility (Banking Office in borrower HQ nation) is enforced at accept time. One pending request per borrower.';

-- ── 3. accept_corp_loan_request ─────────────────────────────────

CREATE OR REPLACE FUNCTION public.accept_corp_loan_request(
    p_request_id   uuid,
    p_bank_corp_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid              uuid := auth.uid();
    v_fac              factions%ROWTYPE;
    v_request          corp_loan_requests%ROWTYPE;
    v_borrower_corp    entrepreneur_corps%ROWTYPE;
    v_bank_corp        entrepreneur_corps%ROWTYPE;
    v_borrower_fac_id  uuid;
    v_bank_fac_id      uuid;
    v_tick             int;
    v_per_tick         bigint;
    v_loan_id          uuid;
    v_bank_funds       bigint;
    v_has_bo           boolean;
    v_nation_name      text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_request_id IS NULL OR p_bank_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_request FROM corp_loan_requests
     WHERE id = p_request_id FOR UPDATE;
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

    -- Lock both corps in uuid order.
    PERFORM id FROM entrepreneur_corps
     WHERE id IN (p_bank_corp_id, v_request.borrower_corp_id)
     ORDER BY id FOR UPDATE;

    SELECT * INTO v_borrower_corp FROM entrepreneur_corps WHERE id = v_request.borrower_corp_id;
    IF v_borrower_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'borrower_corp_not_found');
    END IF;
    IF v_borrower_corp.owner_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'borrower_orphan');
    END IF;
    v_borrower_fac_id := v_borrower_corp.owner_faction_id;

    SELECT * INTO v_bank_corp FROM entrepreneur_corps WHERE id = p_bank_corp_id;
    IF v_bank_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bank_corp_not_found');
    END IF;
    IF v_bank_corp.industry <> 'banking' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_banking_corp');
    END IF;
    IF v_bank_corp.owner_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bank_orphan');
    END IF;
    v_bank_fac_id := v_bank_corp.owner_faction_id;

    -- Eligibility: this bank must own a completed Banking Office in
    -- the borrower's HQ nation. Computed live (no per-bank join table).
    SELECT EXISTS (
        SELECT 1 FROM corp_buildings
         WHERE owner_corp_id = p_bank_corp_id
           AND nation_id     = v_borrower_corp.hq_nation_id
           AND building_type = 'banking_office'
           AND status        = 'completed'
    ) INTO v_has_bo;
    IF NOT v_has_bo THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_banking_office_in_nation');
    END IF;

    -- Caller = bank corp's owner faction.
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

    -- Atomic affordability + debit (same pattern as accept_offer audit
    -- fix in 20270169). No second explicit FOR UPDATE = no deadlock
    -- class on the faction-lock side.
    UPDATE factions
       SET party_funds = COALESCE(party_funds, 0) - v_request.principal
     WHERE id = v_bank_fac_id
       AND COALESCE(party_funds, 0) >= v_request.principal;
    IF NOT FOUND THEN
        SELECT COALESCE(party_funds, 0) INTO v_bank_funds
          FROM factions WHERE id = v_bank_fac_id;
        RETURN jsonb_build_object('success', false, 'reason', 'bank_insufficient_funds',
            'have', COALESCE(v_bank_funds, 0), 'need', v_request.principal);
    END IF;

    UPDATE factions SET party_funds = COALESCE(party_funds, 0) + v_request.principal
     WHERE id = v_borrower_fac_id;

    -- Per-tick simple-interest payment, computed at acceptance and
    -- stored on corp_loans. Server is the one source for this number
    -- (the client mirrors the same math for the modal preview).
    v_per_tick := GREATEST(1, ROUND(
        v_request.principal::numeric / v_request.term_ticks
        + v_request.principal::numeric * v_request.apr / 12
    )::bigint);

    INSERT INTO corp_loans
        (request_id, borrower_corp_id, lender_corp_id, principal, apr, term_ticks,
         per_tick_payment, payments_remaining, started_at_tick)
    VALUES
        (p_request_id, v_request.borrower_corp_id, p_bank_corp_id,
         v_request.principal, v_request.apr, v_request.term_ticks,
         v_per_tick, v_request.term_ticks, v_tick)
    RETURNING id INTO v_loan_id;

    -- Mark request accepted — first-acceptance-wins. Other Banking
    -- corps that were viewing the request lose it from their feed
    -- on next refresh (status filter is 'pending').
    UPDATE corp_loan_requests
       SET status = 'accepted', accepted_by_corp_id = p_bank_corp_id,
           finalized_at_tick = v_tick
     WHERE id = p_request_id;

    SELECT name INTO v_nation_name FROM nations WHERE id = v_borrower_corp.hq_nation_id;
    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_borrower_corp.hq_nation_id, v_fac.id,
        'Loan Funded',
        format('%s funds $%s loan to %s in %s. %s ticks × $%s per tick.',
               v_bank_corp.name,
               to_char(v_request.principal, 'FM999,999,999,999'),
               v_borrower_corp.name, v_nation_name,
               v_request.term_ticks,
               to_char(v_per_tick, 'FM999,999,999,999')),
        'corporate', 'corp_loan_funded',
        jsonb_build_object(
            'loan_id',            v_loan_id,
            'request_id',         p_request_id,
            'borrower_corp_id',   v_request.borrower_corp_id,
            'borrower_corp_name', v_borrower_corp.name,
            'lender_corp_id',     p_bank_corp_id,
            'lender_corp_name',   v_bank_corp.name,
            'principal',          v_request.principal,
            'apr',                v_request.apr,
            'term_ticks',         v_request.term_ticks,
            'per_tick_payment',   v_per_tick
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',          true,
        'loan_id',          v_loan_id,
        'request_id',       p_request_id,
        'principal',        v_request.principal,
        'per_tick_payment', v_per_tick,
        'term_ticks',       v_request.term_ticks
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_corp_loan_request(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION public.accept_corp_loan_request(uuid, uuid) IS
    'Bank-corp owner accepts a pending loan request. Eligibility (Banking Office in borrower HQ nation) verified live. First-acceptance-wins via the corp_loan_requests row lock + status check. Atomic affordability + debit on bank''s owner faction. Money: bank-faction → borrower-faction. Spawns corp_loans row with computed per_tick_payment.';

-- ── 4. cancel_corp_loan_request ─────────────────────────────────

CREATE OR REPLACE FUNCTION public.cancel_corp_loan_request(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid             uuid := auth.uid();
    v_fac             factions%ROWTYPE;
    v_request         corp_loan_requests%ROWTYPE;
    v_borrower_corp   entrepreneur_corps%ROWTYPE;
    v_tick            int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_request_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_request FROM corp_loan_requests
     WHERE id = p_request_id FOR UPDATE;
    IF v_request.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_not_found');
    END IF;
    IF v_request.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_not_pending');
    END IF;

    SELECT * INTO v_borrower_corp FROM entrepreneur_corps
     WHERE id = v_request.borrower_corp_id FOR UPDATE;
    IF v_borrower_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'borrower_corp_not_found');
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
    IF v_borrower_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_borrower_corp_owner');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE corp_loan_requests
       SET status = 'cancelled', finalized_at_tick = v_tick
     WHERE id = p_request_id;

    RETURN jsonb_build_object('success', true, 'request_id', p_request_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_corp_loan_request(uuid) TO authenticated;

-- ── 5. process_corp_loans (tick processor) ──────────────────────
-- Idempotent. Called once per tick from the advance-tick handler
-- (3.6f block in scripts/advance-tick-handler-template). Reads
-- current_tick from shard internally and ignores p_tick for the
-- gates (defence-in-depth — same pattern as 20270166).

CREATE OR REPLACE FUNCTION public.process_corp_loans(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    r                  RECORD;
    v_tick             int;
    v_borrower_fac_id  uuid;
    v_lender_fac_id    uuid;
    v_expired          int := 0;
    v_paid             int := 0;
    v_defaulted        int := 0;
    v_repaid           int := 0;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Phase 1: expire pending requests whose deadline has passed.
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

    -- Phase 2: service active loans. One payment per tick per loan;
    -- last_payment_tick gate prevents double-billing if this handler
    -- runs twice in the same shard-tick. Atomic conditional UPDATE
    -- on the borrower's funds — defaults if insufficient.
    FOR r IN
        SELECT id, borrower_corp_id, lender_corp_id, per_tick_payment,
               payments_remaining, total_paid
          FROM corp_loans
         WHERE status = 'active'
           AND payments_remaining > 0
           AND (last_payment_tick IS NULL OR last_payment_tick < v_tick)
         FOR UPDATE
    LOOP
        SELECT owner_faction_id INTO v_borrower_fac_id
          FROM entrepreneur_corps WHERE id = r.borrower_corp_id;
        SELECT owner_faction_id INTO v_lender_fac_id
          FROM entrepreneur_corps WHERE id = r.lender_corp_id;

        IF v_borrower_fac_id IS NULL OR v_lender_fac_id IS NULL THEN
            -- Orphaned corp(s). Default; no automatic refund.
            UPDATE corp_loans
               SET status = 'defaulted', defaulted_at_tick = v_tick
             WHERE id = r.id;
            v_defaulted := v_defaulted + 1;
            CONTINUE;
        END IF;

        UPDATE factions
           SET party_funds = COALESCE(party_funds, 0) - r.per_tick_payment
         WHERE id = v_borrower_fac_id
           AND COALESCE(party_funds, 0) >= r.per_tick_payment;
        IF NOT FOUND THEN
            UPDATE corp_loans
               SET status = 'defaulted', defaulted_at_tick = v_tick
             WHERE id = r.id;
            v_defaulted := v_defaulted + 1;
            CONTINUE;
        END IF;

        UPDATE factions
           SET party_funds = COALESCE(party_funds, 0) + r.per_tick_payment
         WHERE id = v_lender_fac_id;

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

COMMENT ON FUNCTION public.process_corp_loans(int) IS
    'Idempotent tick handler — expires pending loan requests past their deadline; services active loans (atomic per-tick debit/credit; single failed payment defaults the loan). Reads current_tick from shard internally; p_tick accepted for caller ergonomics but not trusted for the gate (defence-in-depth, same as 20270166).';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.process_corp_loans(int);
-- DROP FUNCTION IF EXISTS public.cancel_corp_loan_request(uuid);
-- DROP FUNCTION IF EXISTS public.accept_corp_loan_request(uuid, uuid);
-- DROP FUNCTION IF EXISTS public.submit_corp_loan_request(uuid, bigint, int, numeric);
-- DROP TABLE IF EXISTS corp_loans;
-- DROP TABLE IF EXISTS corp_loan_requests;
-- COMMIT;
