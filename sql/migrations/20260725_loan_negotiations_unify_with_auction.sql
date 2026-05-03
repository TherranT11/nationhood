-- 20260725_loan_negotiations_unify_with_auction.sql
--
-- Unify the auction (bank_loan_requests) flow with the bilateral
-- negotiation flow. After this migration:
--
--   1. Borrower submits Request Loan as before (principal, target
--      banks, collateral) — submit_loan_request now persists collateral
--      onto the request row.
--   2. Each targeted bank can respond via bank_respond_to_loan_request,
--      which CREATES a loan_negotiation tied to the request. The bank's
--      proposed APR + term ride into the negotiation; the request's
--      principal + collateral are inherited. UNIQUE INDEX on
--      (borrower, lender) WHERE status='open' prevents double-respond
--      from the same bank to the same borrower.
--   3. Borrower's Pressing Issues feed renders these negotiations
--      directly (replacing the bank_loan_offers feed).
--   4. Both parties refine + chat via the existing Phase 1-5b modal.
--   5. Mutual Agree fires the loan; sibling negotiations on the same
--      request_id auto-abandon (escrow refunded).
--
-- The bank_loan_offers / accept_loan_offer pipeline stays in the DB
-- as legacy — no UI references it after this commit. Vestigial but
-- harmless; can be dropped in a future cleanup.

BEGIN;

-- ── 1. bank_loan_requests.collateral ─────────────────────────────
ALTER TABLE public.bank_loan_requests
    ADD COLUMN IF NOT EXISTS collateral JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.bank_loan_requests.collateral IS
    'Borrower-pledged assets at request time. Inherited by every loan_negotiation spawned from this request. Same JSONB shape as loan_negotiations.collateral: [{kind, id, name, value}].';


-- ── 2. loan_negotiations.request_id link ─────────────────────────
ALTER TABLE public.loan_negotiations
    ADD COLUMN IF NOT EXISTS request_id UUID
        REFERENCES public.bank_loan_requests(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_loan_negotiations_request
    ON public.loan_negotiations (request_id)
    WHERE status = 'open';

COMMENT ON COLUMN public.loan_negotiations.request_id IS
    'Parent auction request that spawned this negotiation. NULL for orphan negotiations (legacy or future bilateral-only flows). Used by _fire_negotiation to abandon sibling negotiations on the same request when one fires.';


-- ── 3. submit_loan_request: add p_collateral ─────────────────────
-- Backward-compatible — new param has a default. Older callers still
-- work; collateral defaults to empty array.
CREATE OR REPLACE FUNCTION submit_loan_request(
    p_requesting_faction_id UUID,
    p_target_bank_ids       UUID[],
    p_principal             BIGINT,
    p_term_ticks            INT,
    p_requested_apr         NUMERIC,
    p_risk_grade            TEXT  DEFAULT 'B',
    p_purpose               TEXT  DEFAULT NULL,
    p_expiry_ticks          INT   DEFAULT 6,
    p_collateral            JSONB DEFAULT '[]'::jsonb
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
    v_user       UUID := auth.uid();
    v_borrower   factions%ROWTYPE;
    v_tick       INT;
    v_loop_bank_id UUID;
    v_bank       factions%ROWTYPE;
    v_request_id UUID;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT * INTO v_borrower FROM factions WHERE id = p_requesting_faction_id;
    IF v_borrower.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Requesting faction not found');
    END IF;
    IF v_borrower.id <> v_user AND v_borrower.linked_user_id IS DISTINCT FROM v_user THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this faction');
    END IF;
    IF v_borrower.faction_type <> 'corporation' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only corporations can request loans');
    END IF;

    IF p_principal <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Principal must be > 0');
    END IF;
    IF p_term_ticks <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Term must be > 0 ticks');
    END IF;
    IF p_target_bank_ids IS NULL OR array_length(p_target_bank_ids, 1) IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Pick at least one bank');
    END IF;

    -- Sanity-check each target bank exists + is Finance.
    FOREACH v_loop_bank_id IN ARRAY p_target_bank_ids LOOP
        SELECT * INTO v_bank FROM factions WHERE id = v_loop_bank_id;
        IF v_bank.id IS NULL OR v_bank.faction_type <> 'corporation' OR v_bank.corp_sector <> 'Finance' THEN
            RETURN jsonb_build_object('success', false,
                'error', 'Target bank invalid: ' || COALESCE(v_bank.faction_name, v_loop_bank_id::TEXT));
        END IF;
    END LOOP;

    SELECT COALESCE(current_tick, 0) INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    INSERT INTO bank_loan_requests (
        requesting_faction_id, requesting_nation_id,
        target_bank_ids, principal, term_ticks, requested_apr,
        risk_grade, purpose, status,
        expires_at_tick, created_at_tick,
        collateral
    ) VALUES (
        p_requesting_faction_id, v_borrower.nation_id,
        p_target_bank_ids, p_principal, p_term_ticks, p_requested_apr,
        COALESCE(p_risk_grade, 'B'), p_purpose, 'pending',
        v_tick + COALESCE(p_expiry_ticks, 6), v_tick,
        COALESCE(p_collateral, '[]'::jsonb)
    ) RETURNING id INTO v_request_id;

    RETURN jsonb_build_object('success', true, 'request_id', v_request_id);
END;
$func$;

GRANT EXECUTE ON FUNCTION submit_loan_request(UUID, UUID[], BIGINT, INT, NUMERIC, TEXT, TEXT, INT, JSONB) TO authenticated;


-- ── 4. bank_respond_to_loan_request ──────────────────────────────
-- Bank's "submit offer" replacement. Creates a loan_negotiation tied
-- to the request and pre-populated with the bank's proposed terms.
-- Borrower's Pressing Issues feed picks it up via the request_id
-- linkage.
CREATE OR REPLACE FUNCTION bank_respond_to_loan_request(
    p_request_id          UUID,
    p_bank_faction_id     UUID,
    p_proposed_apr        NUMERIC,
    p_proposed_term_ticks INT,
    p_notes               TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user      UUID := auth.uid();
    v_request   bank_loan_requests%ROWTYPE;
    v_bank      factions%ROWTYPE;
    v_tick      INT  := _current_tick();
    v_neg_id    UUID;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;
    IF p_proposed_apr IS NULL OR p_proposed_apr < 0 OR p_proposed_apr > 100 THEN
        RETURN jsonb_build_object('success', false, 'error', 'APR must be between 0 and 100');
    END IF;
    IF p_proposed_term_ticks IS NULL OR p_proposed_term_ticks <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Term must be greater than 0 ticks');
    END IF;
    IF p_bank_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Bank faction id required');
    END IF;

    SELECT * INTO v_request FROM bank_loan_requests
     WHERE id = p_request_id
     FOR UPDATE;
    IF v_request.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Request not found');
    END IF;
    IF v_request.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Request is no longer pending');
    END IF;

    -- Caller must own the specified bank, it must be a Finance corp, and
    -- it must be in target_bank_ids of the request. Multi-corp owners
    -- pass their active corp explicitly to disambiguate.
    SELECT * INTO v_bank FROM factions
     WHERE id = p_bank_faction_id
       AND (id = v_user OR linked_user_id = v_user)
       AND faction_type = 'corporation'
       AND corp_sector  = 'Finance'
       AND abandoned_at IS NULL;
    IF v_bank.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this bank');
    END IF;
    IF NOT (p_bank_faction_id = ANY(COALESCE(v_request.target_bank_ids, ARRAY[]::UUID[]))) THEN
        RETURN jsonb_build_object('success', false, 'error', 'This bank is not a target of the request');
    END IF;

    -- One-open-per-pair: existing UNIQUE INDEX would error noisily.
    -- Pre-check for a clean message.
    IF EXISTS (
        SELECT 1 FROM loan_negotiations
         WHERE borrower_faction_id = v_request.requesting_faction_id
           AND lender_faction_id   = p_bank_faction_id
           AND status              = 'open'
    ) THEN
        RETURN jsonb_build_object('success', false,
            'error', 'You already have an open negotiation with this borrower');
    END IF;

    INSERT INTO loan_negotiations (
        borrower_faction_id, lender_faction_id, nation_id,
        principal, apr, term_ticks, purpose, notes,
        collateral,
        last_modified_by_faction_id, last_modified_at_tick,
        created_at_tick, request_id
    ) VALUES (
        v_request.requesting_faction_id, p_bank_faction_id, v_request.requesting_nation_id,
        v_request.principal, p_proposed_apr, p_proposed_term_ticks,
        v_request.purpose, NULLIF(trim(COALESCE(p_notes, '')), ''),
        v_request.collateral,
        p_bank_faction_id, v_tick,
        v_tick, v_request.id
    ) RETURNING id INTO v_neg_id;

    INSERT INTO loan_negotiation_messages
        (negotiation_id, author_faction_id, body, system_msg, posted_at_tick)
    VALUES
        (v_neg_id, NULL,
         COALESCE(v_bank.faction_name, 'Bank') || ' responded: $'
            || to_char(v_request.principal, 'FM999,999,999,999')
            || ' at ' || p_proposed_apr || '% for ' || p_proposed_term_ticks || ' ticks',
         true, v_tick);

    RETURN jsonb_build_object('success', true, 'negotiation_id', v_neg_id);
END;
$$;

GRANT EXECUTE ON FUNCTION bank_respond_to_loan_request(UUID, UUID, NUMERIC, INT, TEXT) TO authenticated;


-- ── 5. _fire_negotiation: sibling-abandon on fire ────────────────
-- After firing the chosen negotiation, sweep every other open
-- negotiation tied to the same request and abandon them. Refund any
-- escrow held by those banks. The request itself moves to 'won' (or
-- equivalent terminal state — using 'expired' here since
-- bank_loan_requests.status doesn't have a 'won' value yet; can refine
-- later) so siblings can't be created post-fire.
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
    v_sibling      RECORD;
    v_siblings_abandoned INTEGER := 0;
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

    -- ── Sibling auto-abandon (Phase 6 unification) ──
    -- Every other open negotiation on the same parent request gets
    -- abandoned. Lender escrow refunded. System message logged.
    -- NULL request_id (orphan negotiations) skip this loop entirely.
    IF v_neg.request_id IS NOT NULL THEN
        FOR v_sibling IN
            SELECT id, lender_faction_id, escrowed_lender_cash
              FROM loan_negotiations
             WHERE request_id = v_neg.request_id
               AND id <> p_neg_id
               AND status = 'open'
             FOR UPDATE
        LOOP
            IF v_sibling.escrowed_lender_cash > 0
               AND EXISTS (SELECT 1 FROM factions WHERE id = v_sibling.lender_faction_id) THEN
                PERFORM emit_corp_cash_event(
                    v_sibling.lender_faction_id,
                    'capital_in',
                    'Escrow refund · borrower closed with another bank',
                    v_sibling.escrowed_lender_cash,
                    p_tick
                );
            END IF;

            UPDATE loan_negotiations
               SET status               = 'abandoned',
                   escrowed_lender_cash = 0,
                   last_activity_at     = NOW()
             WHERE id = v_sibling.id;

            INSERT INTO loan_negotiation_messages
                (negotiation_id, author_faction_id, body, system_msg, posted_at_tick)
            VALUES
                (v_sibling.id, NULL,
                 'Auto-abandoned: borrower closed the loan request with another bank. Escrow refunded.',
                 true, p_tick);

            v_siblings_abandoned := v_siblings_abandoned + 1;
        END LOOP;

        -- Move the parent request out of 'pending' so no late
        -- responders can spawn new siblings.
        UPDATE bank_loan_requests
           SET status           = 'approved',
               winning_bank_id  = v_neg.lender_faction_id,
               resolved_at_tick = p_tick
         WHERE id               = v_neg.request_id
           AND status           = 'pending';
    END IF;

    INSERT INTO loan_negotiation_messages (negotiation_id, author_faction_id, body, system_msg, posted_at_tick)
    VALUES (p_neg_id, NULL,
            'Loan disbursed: $' || to_char(v_neg.principal, 'FM999,999,999,999')
                || ' for ' || v_neg.term_ticks || ' ticks at ' || v_neg.apr || '%'
                || CASE WHEN jsonb_array_length(v_neg.collateral) > 0
                        THEN ' · ' || jsonb_array_length(v_neg.collateral) || ' collateral item'
                          || CASE WHEN jsonb_array_length(v_neg.collateral) = 1 THEN '' ELSE 's' END
                          || ' pledged'
                        ELSE ''
                   END
                || CASE WHEN v_siblings_abandoned > 0
                        THEN ' · ' || v_siblings_abandoned || ' sibling negotiation'
                          || CASE WHEN v_siblings_abandoned = 1 THEN '' ELSE 's' END
                          || ' auto-abandoned'
                        ELSE ''
                   END,
            true, p_tick);

    PERFORM recompute_finance_stats(v_neg.lender_faction_id);

    RETURN jsonb_build_object(
        'success', true,
        'loan_id', v_loan_id,
        'negotiation_id', p_neg_id,
        'siblings_abandoned', v_siblings_abandoned
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION _fire_negotiation(UUID, INTEGER) FROM PUBLIC;


COMMIT;

NOTIFY pgrst, 'reload schema';
