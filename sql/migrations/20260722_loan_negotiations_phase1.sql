-- 20260722_loan_negotiations_phase1.sql
--
-- Loan Negotiations — Phase 1 (server foundation, no UI yet).
--
-- A targeted bilateral alternative to the existing broadcast-auction
-- loan path (bank_loan_requests → bid → pay_out_loan). Borrower picks
-- one specific bank, opens a negotiation modal, both parties hash out
-- terms in a chat-backed UI, and when both click Agree the loan fires.
--
-- Core design decisions (locked with the user):
--   • Borrower-only initiator. Banks cannot pitch unsolicited deals.
--   • One open negotiation per (borrower, lender) pair at a time.
--   • Lender's cash is HELD IN ESCROW the moment they Agree —
--     the cash actually leaves their balance via emit_corp_cash_event.
--     Rescinding agreement, term changes, abandonment, and
--     counterparty deletion all refund the escrow. On fire, the
--     escrow becomes the disbursement (no second debit).
--   • Any change to terms (principal/apr/term/purpose/notes) by
--     either party RESETS both Agree flags to false. Otherwise
--     lender agrees, borrower silently bumps amount, lender's stale
--     agreement fires the deal at terms they never saw.
--
-- Asymmetry note vs. existing auction flow: the auction path keeps
-- its no-lender-debit design (deliberately, per 20260614). This
-- negotiated path takes the realistic-bank-side approach. They
-- coexist; they're conceptually different products.
--
-- Phase 1 contents:
--   tables       loan_negotiations, loan_negotiation_messages
--   helpers      _negotiation_caller_role, _current_tick
--   RPCs         create_loan_negotiation, update_negotiation_terms,
--                set_negotiation_agreement, abandon_negotiation,
--                post_negotiation_message
--   internal     _fire_negotiation (called only when both Agreed)
--   trigger      refund_escrow_on_faction_delete
--   RLS          parties-only SELECT on both tables; all writes via
--                RPCs (REVOKE on direct UPDATE/INSERT/DELETE)

BEGIN;


-- ── 1. loan_negotiations ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.loan_negotiations (
    id                          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    borrower_faction_id         UUID         NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    lender_faction_id           UUID         NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    nation_id                   UUID         REFERENCES public.nations(id) ON DELETE SET NULL,

    status                      TEXT         NOT NULL DEFAULT 'open'
                                CHECK (status IN ('open', 'fired', 'abandoned')),

    -- Live terms (any UPDATE resets both Agree flags + escrow)
    principal                   BIGINT       NOT NULL CHECK (principal > 0),
    apr                         NUMERIC(6,3) NOT NULL CHECK (apr >= 0 AND apr <= 100),
    term_ticks                  INTEGER      NOT NULL CHECK (term_ticks > 0),
    purpose                     TEXT,
    notes                       TEXT,

    borrower_agreed             BOOLEAN      NOT NULL DEFAULT false,
    lender_agreed               BOOLEAN      NOT NULL DEFAULT false,
    escrowed_lender_cash        BIGINT       NOT NULL DEFAULT 0
                                CHECK (escrowed_lender_cash >= 0),

    last_modified_by_faction_id UUID         REFERENCES public.factions(id) ON DELETE SET NULL,
    last_modified_at_tick       INTEGER,
    last_activity_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    abandoned_by_faction_id     UUID         REFERENCES public.factions(id) ON DELETE SET NULL,
    fired_to_loan_id            UUID         REFERENCES public.bank_loans(id)    ON DELETE SET NULL,

    created_at_tick             INTEGER      NOT NULL,
    created_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    -- Invariants:
    --   borrower != lender
    --   fired iff loan row attached
    --   escrow only valid in 'open' state (terminal states zero it)
    --   escrow > 0 implies lender_agreed = true (escrow rides the agreement)
    CONSTRAINT loan_negotiations_distinct_parties        CHECK (borrower_faction_id <> lender_faction_id),
    CONSTRAINT loan_negotiations_fired_has_loan          CHECK ((status = 'fired') = (fired_to_loan_id IS NOT NULL)),
    CONSTRAINT loan_negotiations_escrow_open_only        CHECK (status = 'open' OR escrowed_lender_cash = 0),
    CONSTRAINT loan_negotiations_escrow_lender_agreed    CHECK (escrowed_lender_cash = 0 OR lender_agreed = true)
);

-- One open negotiation per pair. If a player tries to open a second
-- one with the same bank while one is still alive, the unique index
-- raises — caught by the create RPC for a clean error.
CREATE UNIQUE INDEX IF NOT EXISTS idx_loan_negotiations_one_open_per_pair
    ON public.loan_negotiations (borrower_faction_id, lender_faction_id)
    WHERE status = 'open';

-- Inbox queries: lender-side ("show me everything pointed at me")
-- and borrower-side ("show my open requests")
CREATE INDEX IF NOT EXISTS idx_loan_negotiations_lender_status
    ON public.loan_negotiations (lender_faction_id, status);
CREATE INDEX IF NOT EXISTS idx_loan_negotiations_borrower_status
    ON public.loan_negotiations (borrower_faction_id, status);

COMMENT ON TABLE public.loan_negotiations IS
    'Bilateral targeted loan negotiation between one borrower corp and one lender (Finance) corp. Lives alongside the existing auction flow (bank_loan_requests). Both parties must Agree to fire; any term change resets both flags. Lender cash is held in escrow on Agree.';
COMMENT ON COLUMN public.loan_negotiations.escrowed_lender_cash IS
    'Lender cash actually debited via emit_corp_cash_event when they hit Agree. Refunded on rescind/term-change/abandon/counterparty-delete. On fire, becomes the disbursed principal (no second debit).';


-- ── 2. loan_negotiation_messages ──────────────────────────────────
-- Chat firehose. system_msg=true rows are auto-emitted by the RPCs
-- (term changes, agreements, fire, abandon) and have author_faction_id
-- NULL. system_msg=false rows are player-typed.
CREATE TABLE IF NOT EXISTS public.loan_negotiation_messages (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    negotiation_id      UUID        NOT NULL REFERENCES public.loan_negotiations(id) ON DELETE CASCADE,
    author_faction_id   UUID        REFERENCES public.factions(id) ON DELETE SET NULL,
    body                TEXT        NOT NULL CHECK (length(body) > 0 AND length(body) <= 500),
    system_msg          BOOLEAN     NOT NULL DEFAULT false,
    posted_at_tick      INTEGER,
    posted_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT loan_neg_msg_user_or_system
        CHECK (system_msg = true OR author_faction_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_loan_neg_msg_negotiation_posted
    ON public.loan_negotiation_messages (negotiation_id, posted_at);


-- ── 3. RLS ────────────────────────────────────────────────────────
ALTER TABLE public.loan_negotiations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_negotiation_messages  ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- loan_negotiations: borrower OR lender can read (matched via id or
    -- linked_user_id like every other corp-owned table).
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
         WHERE schemaname = 'public'
           AND tablename  = 'loan_negotiations'
           AND policyname = 'Parties read own negotiations'
    ) THEN
        CREATE POLICY "Parties read own negotiations"
            ON public.loan_negotiations
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.factions f
                     WHERE f.id IN (loan_negotiations.borrower_faction_id, loan_negotiations.lender_faction_id)
                       AND (f.id = auth.uid() OR f.linked_user_id = auth.uid())
                )
            );
    END IF;

    -- loan_negotiation_messages: same check via parent row
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
         WHERE schemaname = 'public'
           AND tablename  = 'loan_negotiation_messages'
           AND policyname = 'Parties read negotiation messages'
    ) THEN
        CREATE POLICY "Parties read negotiation messages"
            ON public.loan_negotiation_messages
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1
                      FROM public.loan_negotiations n
                      JOIN public.factions f
                        ON f.id IN (n.borrower_faction_id, n.lender_faction_id)
                     WHERE n.id = loan_negotiation_messages.negotiation_id
                       AND (f.id = auth.uid() OR f.linked_user_id = auth.uid())
                )
            );
    END IF;
END $$;

-- All writes go through RPCs. No INSERT/UPDATE/DELETE policy = blocked
-- for authenticated; SECURITY DEFINER RPCs bypass and own all writes.


-- ── 4. Helpers ────────────────────────────────────────────────────

-- Resolve which side of a negotiation a user belongs to. Returns
-- 'borrower', 'lender', or NULL (not a party). STABLE so the planner
-- can cache within a query.
CREATE OR REPLACE FUNCTION _negotiation_caller_role(p_neg_id UUID, p_user_id UUID)
RETURNS TEXT
LANGUAGE sql STABLE
AS $$
    SELECT CASE
        WHEN EXISTS (
            SELECT 1
              FROM public.loan_negotiations n
              JOIN public.factions f ON f.id = n.borrower_faction_id
             WHERE n.id = p_neg_id
               AND (f.id = p_user_id OR f.linked_user_id = p_user_id)
        ) THEN 'borrower'
        WHEN EXISTS (
            SELECT 1
              FROM public.loan_negotiations n
              JOIN public.factions f ON f.id = n.lender_faction_id
             WHERE n.id = p_neg_id
               AND (f.id = p_user_id OR f.linked_user_id = p_user_id)
        ) THEN 'lender'
        ELSE NULL
    END;
$$;

REVOKE EXECUTE ON FUNCTION _negotiation_caller_role(UUID, UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION _negotiation_caller_role(UUID, UUID) TO authenticated;


-- Small util — read current tick from shard. Used by every RPC + the
-- faction-delete trigger.
CREATE OR REPLACE FUNCTION _current_tick()
RETURNS INTEGER
LANGUAGE sql STABLE
AS $$
    SELECT COALESCE(current_tick, 0) FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
$$;


-- ── 5. _fire_negotiation (internal) ───────────────────────────────
-- Called only from set_negotiation_agreement when both Agree flags
-- are true. Defensive re-check + atomic loan creation. Borrower gets
-- principal as capital_in; lender was already debited via escrow at
-- Agree-time, so escrow becomes the disbursement (no second debit).
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

    -- Stub bank_loan_requests row to satisfy bank_loans.request_id FK.
    -- status='approved' so the auction flow doesn't accidentally pick
    -- it up. Same shape as the 20260713 backfill stubs.
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
        status, issued_at_tick, matures_at_tick, last_payment_tick
    ) VALUES (
        v_request_id, v_neg.lender_faction_id, v_neg.borrower_faction_id, v_neg.nation_id,
        v_neg.principal, v_neg.apr, v_neg.term_ticks, v_neg.principal, 0,
        'active', p_tick, p_tick + v_neg.term_ticks, NULL
    ) RETURNING id INTO v_loan_id;

    -- Borrower receives principal. Lender debit already happened via
    -- escrow at Agree-time.
    PERFORM emit_corp_cash_event(
        v_neg.borrower_faction_id,
        'capital_in',
        'Loan principal · negotiated with ' || COALESCE(v_lender.faction_name, 'lender'),
        v_neg.principal,
        p_tick
    );

    -- Bump borrower's debt tracker (mirrors pay_out_loan behavior).
    UPDATE factions
       SET corp_debt = COALESCE(corp_debt, 0) + v_neg.principal
     WHERE id = v_neg.borrower_faction_id;

    -- Negotiation: terminal state, escrow zeroed (now lives in the loan).
    UPDATE loan_negotiations
       SET status               = 'fired',
           fired_to_loan_id     = v_loan_id,
           escrowed_lender_cash = 0,
           last_activity_at     = NOW()
     WHERE id = p_neg_id;

    INSERT INTO loan_negotiation_messages (negotiation_id, author_faction_id, body, system_msg, posted_at_tick)
    VALUES (p_neg_id, NULL,
            'Loan disbursed: $' || to_char(v_neg.principal, 'FM999,999,999,999')
                || ' for ' || v_neg.term_ticks || ' ticks at ' || v_neg.apr || '%',
            true, p_tick);

    -- Lender finance stats refresh (lending capital, overleverage).
    PERFORM recompute_finance_stats(v_neg.lender_faction_id);

    RETURN jsonb_build_object('success', true, 'loan_id', v_loan_id, 'negotiation_id', p_neg_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION _fire_negotiation(UUID, INTEGER) FROM PUBLIC;
-- Not granted to authenticated — only callable from other SECURITY
-- DEFINER RPCs in this file via PERFORM. The function-owner privilege
-- chain handles the grant for those callers.


-- ── 6. RPC: create_loan_negotiation (borrower-only) ──────────────
CREATE OR REPLACE FUNCTION create_loan_negotiation(
    p_lender_id  UUID,
    p_principal  BIGINT,
    p_apr        NUMERIC,
    p_term_ticks INTEGER,
    p_purpose    TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user      UUID := auth.uid();
    v_borrower  factions%ROWTYPE;
    v_lender    factions%ROWTYPE;
    v_tick      INTEGER := _current_tick();
    v_neg_id    UUID;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    -- Caller must own a corporation. Resolve the corp the caller owns
    -- (either their own row or a linked corp).
    SELECT * INTO v_borrower
      FROM factions
     WHERE faction_type = 'corporation'
       AND abandoned_at IS NULL
       AND (id = v_user OR linked_user_id = v_user)
     LIMIT 1;
    IF v_borrower.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own a corporation');
    END IF;

    -- Lender must be a Finance corp.
    SELECT * INTO v_lender
      FROM factions
     WHERE id = p_lender_id
       AND faction_type = 'corporation'
       AND corp_sector  = 'Finance'
       AND abandoned_at IS NULL;
    IF v_lender.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Lender not found or not a Finance corporation');
    END IF;
    IF v_lender.id = v_borrower.id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot negotiate with yourself');
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

    -- One-open-per-pair pre-check (UNIQUE INDEX is the safety net).
    IF EXISTS (
        SELECT 1 FROM loan_negotiations
         WHERE borrower_faction_id = v_borrower.id
           AND lender_faction_id   = v_lender.id
           AND status = 'open'
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'You already have an open negotiation with this bank');
    END IF;

    INSERT INTO loan_negotiations (
        borrower_faction_id, lender_faction_id, nation_id,
        principal, apr, term_ticks, purpose,
        last_modified_by_faction_id, last_modified_at_tick,
        created_at_tick
    ) VALUES (
        v_borrower.id, v_lender.id, v_borrower.nation_id,
        p_principal, p_apr, p_term_ticks, NULLIF(trim(COALESCE(p_purpose, '')), ''),
        v_borrower.id, v_tick,
        v_tick
    ) RETURNING id INTO v_neg_id;

    INSERT INTO loan_negotiation_messages (negotiation_id, author_faction_id, body, system_msg, posted_at_tick)
    VALUES (v_neg_id, NULL,
            COALESCE(v_borrower.faction_name, 'Borrower')
                || ' opened a loan negotiation: $'
                || to_char(p_principal, 'FM999,999,999,999')
                || ' at ' || p_apr || '% for ' || p_term_ticks || ' ticks',
            true, v_tick);

    RETURN jsonb_build_object('success', true, 'negotiation_id', v_neg_id);
END;
$$;

GRANT EXECUTE ON FUNCTION create_loan_negotiation(UUID, BIGINT, NUMERIC, INTEGER, TEXT) TO authenticated;


-- ── 7. RPC: update_negotiation_terms ─────────────────────────────
-- Either party. Resets both Agree flags + refunds escrow if held.
-- Auto-emits a system message summarizing what changed.
CREATE OR REPLACE FUNCTION update_negotiation_terms(
    p_neg_id     UUID,
    p_principal  BIGINT,
    p_apr        NUMERIC,
    p_term_ticks INTEGER,
    p_purpose    TEXT,
    p_notes      TEXT
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

    -- Build the human-readable change diff for the system message.
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

    -- No-op guard: if nothing actually changed, don't touch escrow or
    -- agreement flags. Without this, a UI that submits Apply Changes
    -- on an unchanged form would silently refund the lender's escrow
    -- and reset both Agree flags — destroying state on a phantom edit.
    IF v_changes = '' THEN
        RETURN jsonb_build_object('success', true, 'noop', true);
    END IF;

    -- Refund escrow before writing the new terms (escrow rides the
    -- prior agreement which we're about to clear).
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
           borrower_agreed             = false,
           lender_agreed               = false,
           escrowed_lender_cash        = 0,
           last_modified_by_faction_id = v_caller_id,
           last_modified_at_tick       = v_tick,
           last_activity_at            = NOW()
     WHERE id = p_neg_id;

    IF v_changes <> '' THEN
        INSERT INTO loan_negotiation_messages (negotiation_id, author_faction_id, body, system_msg, posted_at_tick)
        VALUES (p_neg_id, NULL, '[' || v_role_label || '] changed: ' || v_changes, true, v_tick);
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION update_negotiation_terms(UUID, BIGINT, NUMERIC, INTEGER, TEXT, TEXT) TO authenticated;


-- ── 8. RPC: set_negotiation_agreement ────────────────────────────
-- Caller's flag only. Lender-side agreement holds escrow; rescind
-- refunds. If both flags = true after this write, atomically fires
-- the negotiation via _fire_negotiation.
CREATE OR REPLACE FUNCTION set_negotiation_agreement(
    p_neg_id  UUID,
    p_agreed  BOOLEAN
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user        UUID := auth.uid();
    v_role        TEXT;
    v_neg         loan_negotiations%ROWTYPE;
    v_tick        INTEGER := _current_tick();
    v_lender_cash NUMERIC;
    v_fire_result JSONB;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
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

    IF v_role = 'borrower' THEN
        -- Idempotent: same value, no-op.
        IF v_neg.borrower_agreed = p_agreed THEN
            RETURN jsonb_build_object('success', true, 'noop', true,
                                      'borrower_agreed', v_neg.borrower_agreed,
                                      'lender_agreed',   v_neg.lender_agreed);
        END IF;

        UPDATE loan_negotiations
           SET borrower_agreed = p_agreed,
               last_activity_at = NOW()
         WHERE id = p_neg_id;

        INSERT INTO loan_negotiation_messages (negotiation_id, author_faction_id, body, system_msg, posted_at_tick)
        VALUES (p_neg_id, NULL,
                '[Borrower] ' || CASE WHEN p_agreed THEN 'agreed' ELSE 'rescinded agreement' END,
                true, v_tick);
    ELSE
        -- Lender path: escrow rides the agreement.
        IF v_neg.lender_agreed = p_agreed THEN
            RETURN jsonb_build_object('success', true, 'noop', true,
                                      'borrower_agreed', v_neg.borrower_agreed,
                                      'lender_agreed',   v_neg.lender_agreed);
        END IF;

        IF p_agreed THEN
            -- Cash check before debiting.
            SELECT COALESCE(corp_cash_reserves, 0) INTO v_lender_cash
              FROM factions WHERE id = v_neg.lender_faction_id;
            IF v_lender_cash < v_neg.principal THEN
                RETURN jsonb_build_object('success', false,
                    'error', 'Insufficient cash for escrow ($'
                        || to_char(v_neg.principal, 'FM999,999,999,999')
                        || ' required, $' || to_char(v_lender_cash, 'FM999,999,999,999')
                        || ' available)');
            END IF;

            -- Escrow the cash via the SSoT helper. emit_corp_cash_event
            -- already floors cash at 0; the cash check above prevents
            -- underflow against legitimate intent.
            PERFORM emit_corp_cash_event(
                v_neg.lender_faction_id,
                'capital_out',
                'Loan escrow · negotiation pending',
                -v_neg.principal,
                v_tick
            );

            UPDATE loan_negotiations
               SET lender_agreed        = true,
                   escrowed_lender_cash = v_neg.principal,
                   last_activity_at     = NOW()
             WHERE id = p_neg_id;

            INSERT INTO loan_negotiation_messages (negotiation_id, author_faction_id, body, system_msg, posted_at_tick)
            VALUES (p_neg_id, NULL,
                    '[Lender] agreed (escrowed $'
                        || to_char(v_neg.principal, 'FM999,999,999,999') || ')',
                    true, v_tick);
        ELSE
            -- Rescinding: refund any held escrow.
            IF v_neg.escrowed_lender_cash > 0 THEN
                PERFORM emit_corp_cash_event(
                    v_neg.lender_faction_id,
                    'capital_in',
                    'Escrow refund · agreement rescinded',
                    v_neg.escrowed_lender_cash,
                    v_tick
                );
            END IF;

            UPDATE loan_negotiations
               SET lender_agreed        = false,
                   escrowed_lender_cash = 0,
                   last_activity_at     = NOW()
             WHERE id = p_neg_id;

            INSERT INTO loan_negotiation_messages (negotiation_id, author_faction_id, body, system_msg, posted_at_tick)
            VALUES (p_neg_id, NULL, '[Lender] rescinded agreement', true, v_tick);
        END IF;
    END IF;

    -- Check fire condition. Re-fetch since the UPDATE above may have
    -- changed flags. Guard against the (unlikely) race where another
    -- concurrent call already fired by checking status='open'.
    SELECT * INTO v_neg FROM loan_negotiations WHERE id = p_neg_id;
    IF v_neg.borrower_agreed AND v_neg.lender_agreed AND v_neg.status = 'open' THEN
        v_fire_result := _fire_negotiation(p_neg_id, v_tick);
        RETURN jsonb_build_object('success', true, 'fired', true, 'fire', v_fire_result);
    END IF;

    RETURN jsonb_build_object('success', true,
                              'borrower_agreed', v_neg.borrower_agreed,
                              'lender_agreed',   v_neg.lender_agreed);
END;
$$;

GRANT EXECUTE ON FUNCTION set_negotiation_agreement(UUID, BOOLEAN) TO authenticated;


-- ── 9. RPC: abandon_negotiation ──────────────────────────────────
CREATE OR REPLACE FUNCTION abandon_negotiation(
    p_neg_id  UUID,
    p_reason  TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user        UUID := auth.uid();
    v_role        TEXT;
    v_neg         loan_negotiations%ROWTYPE;
    v_tick        INTEGER := _current_tick();
    v_role_label  TEXT;
    v_caller_id   UUID;
    v_msg         TEXT;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
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

    v_role_label := CASE WHEN v_role = 'borrower' THEN 'Borrower' ELSE 'Lender' END;
    v_caller_id  := CASE WHEN v_role = 'borrower' THEN v_neg.borrower_faction_id ELSE v_neg.lender_faction_id END;

    IF v_neg.escrowed_lender_cash > 0 THEN
        PERFORM emit_corp_cash_event(
            v_neg.lender_faction_id,
            'capital_in',
            'Escrow refund · negotiation abandoned',
            v_neg.escrowed_lender_cash,
            v_tick
        );
    END IF;

    UPDATE loan_negotiations
       SET status                  = 'abandoned',
           abandoned_by_faction_id = v_caller_id,
           escrowed_lender_cash    = 0,
           last_activity_at        = NOW()
     WHERE id = p_neg_id;

    v_msg := '[' || v_role_label || '] walked away';
    IF p_reason IS NOT NULL AND length(trim(p_reason)) > 0 THEN
        v_msg := v_msg || ' (' || trim(substring(p_reason, 1, 200)) || ')';
    END IF;

    INSERT INTO loan_negotiation_messages (negotiation_id, author_faction_id, body, system_msg, posted_at_tick)
    VALUES (p_neg_id, NULL, v_msg, true, v_tick);

    RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION abandon_negotiation(UUID, TEXT) TO authenticated;


-- ── 10. RPC: post_negotiation_message ────────────────────────────
-- Player chat. Trim, length-cap, rate-limit (1/sec/author).
CREATE OR REPLACE FUNCTION post_negotiation_message(
    p_neg_id  UUID,
    p_body    TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user        UUID := auth.uid();
    v_role        TEXT;
    v_neg         loan_negotiations%ROWTYPE;
    v_tick        INTEGER := _current_tick();
    v_caller_id   UUID;
    v_clean       TEXT;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    v_clean := trim(COALESCE(p_body, ''));
    IF length(v_clean) = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Message cannot be empty');
    END IF;
    IF length(v_clean) > 500 THEN
        v_clean := substring(v_clean, 1, 500);
    END IF;

    SELECT * INTO v_neg FROM loan_negotiations WHERE id = p_neg_id;
    IF v_neg.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Negotiation not found');
    END IF;
    IF v_neg.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot post to a closed negotiation');
    END IF;

    v_role := _negotiation_caller_role(p_neg_id, v_user);
    IF v_role IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not a party to this negotiation');
    END IF;

    v_caller_id := CASE WHEN v_role = 'borrower' THEN v_neg.borrower_faction_id ELSE v_neg.lender_faction_id END;

    -- Rate limit: 1 message per second per author per negotiation.
    -- Sufficient for typical chat; abusive players hit a polite refusal.
    IF EXISTS (
        SELECT 1 FROM loan_negotiation_messages
         WHERE negotiation_id    = p_neg_id
           AND author_faction_id = v_caller_id
           AND posted_at         > NOW() - INTERVAL '1 second'
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Please wait a moment between messages');
    END IF;

    INSERT INTO loan_negotiation_messages (negotiation_id, author_faction_id, body, system_msg, posted_at_tick)
    VALUES (p_neg_id, v_caller_id, v_clean, false, v_tick);

    -- Bump activity but DON'T reset agreement — chat doesn't change terms.
    UPDATE loan_negotiations
       SET last_activity_at = NOW()
     WHERE id = p_neg_id;

    RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION post_negotiation_message(UUID, TEXT) TO authenticated;


-- ── 11. Faction-delete trigger ───────────────────────────────────
-- If a faction with open negotiations gets deleted (bankruptcy etc.),
-- the FK CASCADE would silently wipe loan_negotiations rows including
-- the escrowed_lender_cash. Refund the lender BEFORE the cascade fires
-- so the cash makes it back. The status='abandoned' UPDATE is mostly
-- bookkeeping (CASCADE clears the row a moment later) but keeps the
-- intent visible in any audit selector that catches the moment.
CREATE OR REPLACE FUNCTION refund_escrow_on_faction_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_neg  RECORD;
    v_tick INTEGER := _current_tick();
BEGIN
    -- Refund only when the deleted faction is the BORROWER (lender
    -- still exists; escrow goes home). If the LENDER is the one being
    -- deleted, there's no one to refund — escrow effectively
    -- evaporates, which is consistent with how every other lender
    -- asset behaves on faction deletion.
    FOR v_neg IN
        SELECT id, lender_faction_id, escrowed_lender_cash
          FROM loan_negotiations
         WHERE status = 'open'
           AND borrower_faction_id = OLD.id
           AND escrowed_lender_cash > 0
    LOOP
        PERFORM emit_corp_cash_event(
            v_neg.lender_faction_id,
            'capital_in',
            'Escrow refund · counterparty deleted',
            v_neg.escrowed_lender_cash,
            v_tick
        );
    END LOOP;

    UPDATE loan_negotiations
       SET status                  = 'abandoned',
           abandoned_by_faction_id = OLD.id,
           escrowed_lender_cash    = 0,
           last_activity_at        = NOW()
     WHERE status = 'open'
       AND (borrower_faction_id = OLD.id OR lender_faction_id = OLD.id);

    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_refund_escrow_on_faction_delete ON public.factions;
CREATE TRIGGER trg_refund_escrow_on_faction_delete
    BEFORE DELETE ON public.factions
    FOR EACH ROW
    EXECUTE FUNCTION refund_escrow_on_faction_delete();


COMMIT;

NOTIFY pgrst, 'reload schema';


-- ── Acceptance test (run manually after applying) ─────────────────
-- 1. SELECT create_loan_negotiation('<lender_finance_corp_id>', 50000, 7.5, 24, 'Fleet expansion');
--    → expect {success: true, negotiation_id: <new uuid>}
-- 2. SELECT update_negotiation_terms('<neg>', 75000, 8.0, 36, 'Fleet expansion', 'Aircraft as collateral');
--    → expect both Agree flags = false, system message logged
-- 3. As borrower:  SELECT set_negotiation_agreement('<neg>', true);
-- 4. As lender:    SELECT set_negotiation_agreement('<neg>', true);
--    → expect {success: true, fired: true, fire: {success: true, loan_id: ...}}
-- 5. Verify:
--      SELECT * FROM loan_negotiations WHERE id = '<neg>';        -- status='fired'
--      SELECT * FROM bank_loans WHERE id = (above.fired_to_loan_id);
--      SELECT label, delta FROM corp_cash_events WHERE corp_id IN (borrower, lender)
--             ORDER BY id DESC LIMIT 6;                            -- escrow + disbursement chain
