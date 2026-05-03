-- 20260724_loan_negotiation_collateral.sql
--
-- Loan Negotiations — Collateral support.
--
-- Adds a JSONB collateral field to loan_negotiations and bank_loans
-- so the borrower can pledge specific assets (corp_properties,
-- corp_aircraft, corp_vessels) as security on a negotiated loan.
--
-- Schema for the JSONB array:
--   [
--     { "kind": "property", "id": "<uuid>", "name": "Calveth HQ",
--       "value": 5000000 },
--     { "kind": "aircraft", "id": "<uuid>", "name": "Regional · AVE-001",
--       "value": 5000000 },
--     { "kind": "vessel",   "id": "<uuid>", "name": "MV Pride",
--       "value": 800000 }
--   ]
--
-- name + value are SNAPSHOTS at pledge time so the deal record is
-- self-contained even if the underlying asset changes (renamed,
-- repaired, sold). Future bankruptcy-recovery automation reads
-- bank_loans.collateral to drive seizure logic.
--
-- The borrower owns collateral; the lender just reviews. Server
-- doesn't role-restrict the UPDATE (UI enforces) — kept lean for
-- consistency with the rest of update_negotiation_terms.

BEGIN;

-- ── 1. Schema columns ────────────────────────────────────────────
ALTER TABLE public.loan_negotiations
    ADD COLUMN IF NOT EXISTS collateral JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.bank_loans
    ADD COLUMN IF NOT EXISTS collateral JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.loan_negotiations.collateral IS
    'Borrower-pledged assets as a JSONB array. Each entry: {kind, id, name, value}. name + value are snapshots at pledge time. Resets both Agree flags + refunds escrow when changed (same as other terms). Copied to bank_loans on fire.';
COMMENT ON COLUMN public.bank_loans.collateral IS
    'Snapshot of pledged collateral at loan-fire time. Read by future bankruptcy-recovery logic to drive seizure on default.';


-- ── 2. Aircraft value helper ─────────────────────────────────────
-- Per-class purchase-equivalent value for collateral pledging. Mirror
-- in JS (AIRCRAFT_VALUE constant) — KNOWN-DUPLICATION same as the
-- ops/seats/maint constants from Phase 5/6.
CREATE OR REPLACE FUNCTION airline_aircraft_value(p_class TEXT)
RETURNS BIGINT
LANGUAGE sql IMMUTABLE
AS $$
    SELECT CASE p_class
        WHEN 'regional'   THEN 5000000
        WHEN 'narrowbody' THEN 25000000
        WHEN 'widebody'   THEN 100000000
        ELSE 0
    END;
$$;


-- ── 3. update_negotiation_terms: accept p_collateral ────────────
-- Adds a 7th parameter with default. Backward-compatible — older 6-
-- param callers still work via the parameter default.
CREATE OR REPLACE FUNCTION update_negotiation_terms(
    p_neg_id     UUID,
    p_principal  BIGINT,
    p_apr        NUMERIC,
    p_term_ticks INTEGER,
    p_purpose    TEXT,
    p_notes      TEXT,
    p_collateral JSONB DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user       UUID := auth.uid();
    v_role       TEXT;
    v_neg        loan_negotiations%ROWTYPE;
    v_tick       INTEGER := _current_tick();
    v_caller_id  UUID;
    v_role_label TEXT;
    v_changes    TEXT := '';
    v_new_collat JSONB;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;
    IF p_principal IS NULL OR p_principal <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Principal must be greater than 0');
    END IF;
    IF p_apr IS NULL OR p_apr < 0 OR p_apr > 100 THEN
        RETURN jsonb_build_object('success', false, 'error', 'APR must be between 0 and 100');
    END IF;
    IF p_term_ticks IS NULL OR p_term_ticks <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Term must be greater than 0 ticks');
    END IF;

    SELECT * INTO v_neg FROM loan_negotiations WHERE id = p_neg_id FOR UPDATE;
    IF v_neg.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Negotiation not found');
    END IF;
    IF v_neg.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Negotiation is not open');
    END IF;

    v_role := _negotiation_caller_role(p_neg_id, v_user);
    IF v_role IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not a party to this negotiation');
    END IF;

    v_caller_id  := CASE WHEN v_role = 'borrower' THEN v_neg.borrower_faction_id ELSE v_neg.lender_faction_id END;
    v_role_label := CASE WHEN v_role = 'borrower' THEN 'Borrower' ELSE 'Lender' END;

    -- Default p_collateral to current value (no-op for callers who
    -- don't send it; keeps backward compat).
    v_new_collat := COALESCE(p_collateral, v_neg.collateral);

    IF v_neg.principal <> p_principal THEN
        v_changes := v_changes || CASE WHEN v_changes = '' THEN '' ELSE '; ' END
                    || 'Principal $' || to_char(v_neg.principal, 'FM999,999,999,999')
                    || ' → $' || to_char(p_principal, 'FM999,999,999,999');
    END IF;
    IF v_neg.apr <> p_apr THEN
        v_changes := v_changes || CASE WHEN v_changes = '' THEN '' ELSE '; ' END
                    || 'APR ' || v_neg.apr || '% → ' || p_apr || '%';
    END IF;
    IF v_neg.term_ticks <> p_term_ticks THEN
        v_changes := v_changes || CASE WHEN v_changes = '' THEN '' ELSE '; ' END
                    || 'Term ' || v_neg.term_ticks || ' → ' || p_term_ticks || ' ticks';
    END IF;
    IF COALESCE(v_neg.purpose, '') <> COALESCE(NULLIF(trim(COALESCE(p_purpose, '')), ''), '') THEN
        v_changes := v_changes || CASE WHEN v_changes = '' THEN '' ELSE '; ' END || 'Purpose updated';
    END IF;
    IF COALESCE(v_neg.notes, '') <> COALESCE(NULLIF(trim(COALESCE(p_notes, '')), ''), '') THEN
        v_changes := v_changes || CASE WHEN v_changes = '' THEN '' ELSE '; ' END || 'Notes updated';
    END IF;
    IF v_neg.collateral <> v_new_collat THEN
        v_changes := v_changes || CASE WHEN v_changes = '' THEN '' ELSE '; ' END
                    || 'Collateral updated (' || jsonb_array_length(v_new_collat) || ' item'
                    || CASE WHEN jsonb_array_length(v_new_collat) = 1 THEN '' ELSE 's' END
                    || ' pledged)';
    END IF;

    IF v_changes = '' THEN
        RETURN jsonb_build_object('success', true, 'noop', true);
    END IF;

    IF v_neg.escrowed_lender_cash > 0 THEN
        PERFORM emit_corp_cash_event(
            v_neg.lender_faction_id,
            'capital_in',
            'Escrow refund · terms changed',
            v_neg.escrowed_lender_cash,
            v_tick
        );
    END IF;

    UPDATE loan_negotiations
       SET principal                   = p_principal,
           apr                         = p_apr,
           term_ticks                  = p_term_ticks,
           purpose                     = NULLIF(trim(COALESCE(p_purpose, '')), ''),
           notes                       = NULLIF(trim(COALESCE(p_notes, '')), ''),
           collateral                  = v_new_collat,
           borrower_agreed             = false,
           lender_agreed               = false,
           escrowed_lender_cash        = 0,
           last_modified_by_faction_id = v_caller_id,
           last_modified_at_tick       = v_tick,
           last_activity_at            = NOW()
     WHERE id = p_neg_id;

    INSERT INTO loan_negotiation_messages (negotiation_id, author_faction_id, body, system_msg, posted_at_tick)
    VALUES (p_neg_id, NULL, '[' || v_role_label || '] changed: ' || v_changes, true, v_tick);

    RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION update_negotiation_terms(UUID, BIGINT, NUMERIC, INTEGER, TEXT, TEXT, JSONB) TO authenticated;


-- ── 4. _fire_negotiation: copy collateral to bank_loans ─────────
-- Same body as Phase 1 but adds collateral to the bank_loans INSERT
-- so the snapshot rides with the loan into terminal state.
CREATE OR REPLACE FUNCTION _fire_negotiation(p_neg_id UUID, p_tick INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_neg          loan_negotiations%ROWTYPE;
    v_borrower     factions%ROWTYPE;
    v_lender       factions%ROWTYPE;
    v_request_id   UUID;
    v_loan_id      UUID;
BEGIN
    SELECT * INTO v_neg FROM loan_negotiations WHERE id = p_neg_id FOR UPDATE;

    IF v_neg.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Negotiation not found');
    END IF;
    IF v_neg.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Negotiation is not open');
    END IF;
    IF NOT v_neg.borrower_agreed OR NOT v_neg.lender_agreed THEN
        RETURN jsonb_build_object('success', false, 'error', 'Both parties must agree first');
    END IF;
    IF v_neg.escrowed_lender_cash <> v_neg.principal THEN
        RETURN jsonb_build_object('success', false, 'error', 'Escrow does not match principal');
    END IF;

    SELECT * INTO v_borrower FROM factions WHERE id = v_neg.borrower_faction_id;
    SELECT * INTO v_lender   FROM factions WHERE id = v_neg.lender_faction_id;
    IF v_borrower.id IS NULL OR v_lender.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Borrower or lender no longer exists');
    END IF;

    INSERT INTO bank_loan_requests (
        requesting_faction_id, requesting_nation_id,
        target_bank_ids, principal, term_ticks, requested_apr,
        risk_grade, purpose, status,
        expires_at_tick, winning_bank_id,
        created_at_tick, resolved_at_tick
    ) VALUES (
        v_neg.borrower_faction_id, v_neg.nation_id,
        ARRAY[v_neg.lender_faction_id]::UUID[],
        v_neg.principal, v_neg.term_ticks, v_neg.apr,
        'B', COALESCE(NULLIF(v_neg.purpose, ''), 'Negotiated loan'), 'approved',
        p_tick + v_neg.term_ticks, v_neg.lender_faction_id,
        p_tick, p_tick
    ) RETURNING id INTO v_request_id;

    INSERT INTO bank_loans (
        request_id, lender_faction_id, borrower_faction_id, nation_id,
        principal, apr, term_ticks, outstanding, payments_missed,
        status, issued_at_tick, matures_at_tick, last_payment_tick,
        collateral
    ) VALUES (
        v_request_id, v_neg.lender_faction_id, v_neg.borrower_faction_id, v_neg.nation_id,
        v_neg.principal, v_neg.apr, v_neg.term_ticks, v_neg.principal, 0,
        'active', p_tick, p_tick + v_neg.term_ticks, NULL,
        v_neg.collateral
    ) RETURNING id INTO v_loan_id;

    PERFORM emit_corp_cash_event(
        v_neg.borrower_faction_id,
        'capital_in',
        'Loan principal · negotiated with ' || COALESCE(v_lender.faction_name, 'lender'),
        v_neg.principal,
        p_tick
    );

    UPDATE factions
       SET corp_debt = COALESCE(corp_debt, 0) + v_neg.principal
     WHERE id = v_neg.borrower_faction_id;

    UPDATE loan_negotiations
       SET status               = 'fired',
           fired_to_loan_id     = v_loan_id,
           escrowed_lender_cash = 0,
           last_activity_at     = NOW()
     WHERE id = p_neg_id;

    INSERT INTO loan_negotiation_messages (negotiation_id, author_faction_id, body, system_msg, posted_at_tick)
    VALUES (p_neg_id, NULL,
            'Loan disbursed: $' || to_char(v_neg.principal, 'FM999,999,999,999')
                || ' for ' || v_neg.term_ticks || ' ticks at ' || v_neg.apr || '%'
                || CASE WHEN jsonb_array_length(v_neg.collateral) > 0
                        THEN ' · ' || jsonb_array_length(v_neg.collateral) || ' collateral item'
                          || CASE WHEN jsonb_array_length(v_neg.collateral) = 1 THEN '' ELSE 's' END
                          || ' pledged'
                        ELSE ''
                   END,
            true, p_tick);

    PERFORM recompute_finance_stats(v_neg.lender_faction_id);

    RETURN jsonb_build_object('success', true, 'loan_id', v_loan_id, 'negotiation_id', p_neg_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION _fire_negotiation(UUID, INTEGER) FROM PUBLIC;


COMMIT;

NOTIFY pgrst, 'reload schema';
