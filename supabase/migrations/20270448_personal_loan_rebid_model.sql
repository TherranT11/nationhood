-- ════════════════════════════════════════════════════════════════════
-- Personal loans — multi-bank bidding rebid (matches corp loan pattern)
--
-- Pre-this migration, request_personal_loan (20270426) silently
-- auto-picked the first qualifying bank in the borrower's nation and
-- issued the loan at a fixed 8% APR — no market. Banks couldn't
-- compete; borrowers couldn't shop rates.
--
-- This migration ships the same offer/accept pattern corp loans use
-- (20270174 + 20270177): borrower opens a request, eligible banks
-- post APR offers, borrower picks one. Cash only moves on accept.
--
-- ── Flow ───────────────────────────────────────────────────────────
--   1. Borrower: open_personal_loan_request(principal, term_ticks,
--      bidding_ticks) — creates a pending personal_loan_requests row,
--      expires_at_tick = current + bidding_ticks. One pending request
--      per borrower at a time; no concurrent active loan permitted.
--   2. Eligible bank (industry='banking' + completed banking_office in
--      borrower's nation, bank owner has enough party_funds): calls
--      offer_personal_loan(request, bank, apr) — partial UNIQUE on
--      (request_id, bank_corp_id) WHERE status='pending' lets the
--      bank revise its bid via upsert without a separate withdraw.
--   3. Borrower: accept_personal_loan_offer(offer) — atomic conditional
--      UPDATE debits the bank owner's party_funds → credits borrower's
--      party_funds, spawns a personal_loans row with the accepted APR,
--      flips the offer to 'accepted', auto-declines every OTHER
--      pending offer on the same request, flips the request to
--      'accepted'.
--   4. Bank can withdraw_personal_loan_offer(offer) before accept.
--   5. Borrower can cancel_personal_loan_request(request); all pending
--      offers flip 'auto_declined'.
--   6. expire_stale_personal_loan_requests() is a lazy-expiry RPC
--      (called from the entrepreneur-dashboard before listing) that
--      flips overdue pending requests to 'expired' and their offers
--      to 'auto_declined'. No tick-handler dependency.
--
-- ── What stays as-is ────────────────────────────────────────────────
-- The existing personal_loans table and make_personal_loan_payment
-- RPC are unchanged. New personal_loans rows still write the same
-- columns; they just arrive via accept_personal_loan_offer instead of
-- request_personal_loan. The old request_personal_loan RPC stays
-- registered (not deprecated yet) so any pre-existing in-flight loan
-- and its UI servicing keep working until the dashboard switches
-- callers — but no UI on the new dashboard path calls it anymore.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. personal_loan_requests ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS personal_loan_requests (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    borrower_faction_id uuid NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    principal           bigint NOT NULL CHECK (principal BETWEEN 100000 AND 25000000),
    term_ticks          int    NOT NULL CHECK (term_ticks BETWEEN 12 AND 240),
    status              text   NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','accepted','cancelled','expired')),
    placed_at_tick      int    NOT NULL,
    expires_at_tick     int    NOT NULL,
    accepted_by_corp_id uuid   REFERENCES entrepreneur_corps(id) ON DELETE SET NULL,
    finalized_at_tick   int,
    created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_personal_loan_requests_borrower
    ON personal_loan_requests (borrower_faction_id, status);
CREATE INDEX IF NOT EXISTS idx_personal_loan_requests_pending_expiry
    ON personal_loan_requests (expires_at_tick) WHERE status = 'pending';
-- One pending request per borrower at a time.
CREATE UNIQUE INDEX IF NOT EXISTS idx_personal_loan_requests_one_pending
    ON personal_loan_requests (borrower_faction_id)
    WHERE status = 'pending';

ALTER TABLE personal_loan_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select for all" ON personal_loan_requests;
CREATE POLICY "Allow select for all" ON personal_loan_requests FOR SELECT USING (true);

COMMENT ON TABLE personal_loan_requests IS
    'Borrower-opened personal loan RFPs. Pending → accepted/cancelled/expired. One pending per borrower. RLS SELECT-all (banks need to discover open requests); no client-write policy — RPC-only.';

-- ── 2. personal_loan_offers ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS personal_loan_offers (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id          uuid NOT NULL REFERENCES personal_loan_requests(id) ON DELETE CASCADE,
    bank_corp_id        uuid NOT NULL REFERENCES entrepreneur_corps(id) ON DELETE CASCADE,
    apr                 numeric NOT NULL CHECK (apr >= 0 AND apr <= 0.5),
    status              text   NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','accepted','declined','withdrawn','auto_declined')),
    placed_at_tick      int    NOT NULL,
    finalized_at_tick   int,
    created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_personal_loan_offers_request
    ON personal_loan_offers (request_id, status);
CREATE INDEX IF NOT EXISTS idx_personal_loan_offers_bank
    ON personal_loan_offers (bank_corp_id, status);
-- Partial UNIQUE: one pending offer per (request, bank). Banks upsert
-- via offer_personal_loan to revise their bid without withdrawing first.
CREATE UNIQUE INDEX IF NOT EXISTS idx_personal_loan_offers_one_pending
    ON personal_loan_offers (request_id, bank_corp_id)
    WHERE status = 'pending';

ALTER TABLE personal_loan_offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select for all" ON personal_loan_offers;
CREATE POLICY "Allow select for all" ON personal_loan_offers FOR SELECT USING (true);

COMMENT ON TABLE personal_loan_offers IS
    'Per-bank APR offers on a borrower''s pending personal_loan_request. Partial UNIQUE on (request_id, bank_corp_id) WHERE status=''pending'' lets a bank upsert to revise their bid. RPC-only writes.';

-- ── 3. RPC: open_personal_loan_request ─────────────────────────────
CREATE OR REPLACE FUNCTION public.open_personal_loan_request(
    p_principal     bigint,
    p_term_ticks    int,
    p_bidding_ticks int DEFAULT 6
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_fac    factions%ROWTYPE;
    v_tick   int;
    v_req_id uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_principal IS NULL OR p_principal < 100000 OR p_principal > 25000000 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_principal');
    END IF;
    IF p_term_ticks IS NULL OR p_term_ticks < 12 OR p_term_ticks > 240 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_term');
    END IF;
    IF p_bidding_ticks IS NULL OR p_bidding_ticks < 1 OR p_bidding_ticks > 48 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_bidding_window');
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

    -- Block if active loan exists. Mirrors request_personal_loan.
    IF EXISTS (
        SELECT 1 FROM personal_loans
         WHERE borrower_faction_id = v_fac.id AND status = 'active'
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'loan_already_active');
    END IF;

    -- Block if pending request exists. Partial UNIQUE also enforces.
    IF EXISTS (
        SELECT 1 FROM personal_loan_requests
         WHERE borrower_faction_id = v_fac.id AND status = 'pending'
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_already_pending');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO personal_loan_requests
        (borrower_faction_id, principal, term_ticks, placed_at_tick, expires_at_tick)
    VALUES
        (v_fac.id, p_principal, p_term_ticks, v_tick, v_tick + p_bidding_ticks)
    RETURNING id INTO v_req_id;

    RETURN jsonb_build_object(
        'success',         true,
        'request_id',      v_req_id,
        'principal',       p_principal,
        'term_ticks',      p_term_ticks,
        'expires_at_tick', v_tick + p_bidding_ticks
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.open_personal_loan_request(bigint, int, int) TO authenticated;

COMMENT ON FUNCTION public.open_personal_loan_request(bigint, int, int) IS
    'Borrower opens a personal loan RFP. Single pending request per borrower; no concurrent active loan. Banks discover via personal_loan_requests SELECT and post offers via offer_personal_loan. Principal $100k-$25M; term 12-240 ticks; bidding window 1-48 ticks (default 6).';

-- ── 4. RPC: offer_personal_loan ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.offer_personal_loan(
    p_request_id   uuid,
    p_bank_corp_id uuid,
    p_apr          numeric
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_fac       factions%ROWTYPE;
    v_bank      entrepreneur_corps%ROWTYPE;
    v_bank_fac  factions%ROWTYPE;
    v_req       personal_loan_requests%ROWTYPE;
    v_borrower  factions%ROWTYPE;
    v_tick      int;
    v_offer_id  uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_request_id IS NULL OR p_bank_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_apr IS NULL OR p_apr < 0 OR p_apr > 0.5 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_apr');
    END IF;

    -- Resolve caller's faction (the bank corp's owner).
    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

    -- Bank corp must exist, be banking, and be owned by caller.
    SELECT * INTO v_bank FROM entrepreneur_corps WHERE id = p_bank_corp_id;
    IF v_bank.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bank_corp_not_found');
    END IF;
    IF v_bank.industry <> 'banking' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_banking_corp');
    END IF;
    IF v_bank.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    -- Request must exist and be pending.
    SELECT * INTO v_req FROM personal_loan_requests WHERE id = p_request_id FOR UPDATE;
    IF v_req.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_not_found');
    END IF;
    IF v_req.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_not_pending');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF v_tick > v_req.expires_at_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_expired');
    END IF;

    -- Bank's HQ nation must match borrower's nation AND bank must have
    -- a completed banking_office there. Same gate request_personal_loan
    -- enforces today.
    SELECT * INTO v_borrower FROM factions WHERE id = v_req.borrower_faction_id;
    IF v_borrower.nation_id IS NULL OR v_bank.hq_nation_id <> v_borrower.nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_mismatch');
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM corp_buildings
         WHERE owner_corp_id = v_bank.id
           AND nation_id     = v_borrower.nation_id
           AND building_type = 'banking_office'
           AND status        = 'completed'
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_banking_office');
    END IF;

    -- Bank owner must have enough cash to fund the principal at accept
    -- time (best-effort gate at offer time; final check on accept).
    SELECT * INTO v_bank_fac FROM factions WHERE id = v_bank.owner_faction_id;
    IF COALESCE(v_bank_fac.party_funds, 0) < v_req.principal THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bank_insufficient_funds',
            'have', COALESCE(v_bank_fac.party_funds, 0)::bigint, 'need', v_req.principal);
    END IF;

    -- Upsert: revise the bank's existing pending offer or insert new.
    INSERT INTO personal_loan_offers
        (request_id, bank_corp_id, apr, placed_at_tick)
    VALUES
        (p_request_id, p_bank_corp_id, p_apr, v_tick)
    ON CONFLICT (request_id, bank_corp_id) WHERE status = 'pending'
        DO UPDATE SET apr = EXCLUDED.apr, placed_at_tick = EXCLUDED.placed_at_tick
    RETURNING id INTO v_offer_id;

    RETURN jsonb_build_object(
        'success',    true,
        'offer_id',   v_offer_id,
        'request_id', p_request_id,
        'apr',        p_apr
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.offer_personal_loan(uuid, uuid, numeric) TO authenticated;

COMMENT ON FUNCTION public.offer_personal_loan(uuid, uuid, numeric) IS
    'Banking corp CEO posts an APR offer on a borrower''s pending personal loan request. Bank must own a completed banking_office in borrower''s nation and the owner faction must currently hold enough party_funds to fund the principal. Upserts the bank''s pending offer via the partial UNIQUE — no withdraw needed to revise.';

-- ── 5. RPC: accept_personal_loan_offer ─────────────────────────────
CREATE OR REPLACE FUNCTION public.accept_personal_loan_offer(p_offer_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_fac          factions%ROWTYPE;
    v_offer        personal_loan_offers%ROWTYPE;
    v_req          personal_loan_requests%ROWTYPE;
    v_bank         entrepreneur_corps%ROWTYPE;
    v_bank_fac     factions%ROWTYPE;
    v_tick         int;
    v_loan_id      uuid;
    v_per_tick     bigint;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_offer_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_offer FROM personal_loan_offers WHERE id = p_offer_id FOR UPDATE;
    IF v_offer.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'offer_not_found');
    END IF;
    IF v_offer.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'offer_not_pending');
    END IF;

    SELECT * INTO v_req FROM personal_loan_requests WHERE id = v_offer.request_id FOR UPDATE;
    IF v_req.id IS NULL OR v_req.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_not_pending');
    END IF;

    -- Caller must be the borrower.
    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL OR v_fac.id <> v_req.borrower_faction_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_borrower');
    END IF;

    SELECT * INTO v_bank FROM entrepreneur_corps WHERE id = v_offer.bank_corp_id;
    IF v_bank.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bank_corp_not_found');
    END IF;

    SELECT * INTO v_bank_fac FROM factions WHERE id = v_bank.owner_faction_id FOR UPDATE;
    IF v_bank_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bank_owner_not_found');
    END IF;
    IF COALESCE(v_bank_fac.party_funds, 0) < v_req.principal THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bank_insufficient_funds',
            'have', COALESCE(v_bank_fac.party_funds, 0)::bigint, 'need', v_req.principal);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Lock borrower row too (after bank — stable order: borrower id is
    -- known; bank faction was already locked above).
    PERFORM 1 FROM factions WHERE id = v_fac.id FOR UPDATE;

    -- Cash transfer: bank owner → borrower.
    UPDATE factions SET party_funds = COALESCE(party_funds, 0) - v_req.principal
     WHERE id = v_bank_fac.id;
    UPDATE factions SET party_funds = COALESCE(party_funds, 0) + v_req.principal
     WHERE id = v_fac.id;

    -- Per-tick payment for the new loan, integer-truncated. Matches
    -- the personal_loans schema established in 20270426.
    v_per_tick := GREATEST(1, (v_req.principal + (v_req.term_ticks - 1)) / v_req.term_ticks);

    INSERT INTO personal_loans
        (borrower_faction_id, lender_corp_id, principal, apr, term_ticks,
         per_tick_payment, payments_remaining, started_at_tick, status)
    VALUES
        (v_fac.id, v_bank.id, v_req.principal, v_offer.apr, v_req.term_ticks,
         v_per_tick, v_req.term_ticks, v_tick, 'active')
    RETURNING id INTO v_loan_id;

    -- Flip the accepted offer; auto-decline siblings.
    UPDATE personal_loan_offers
       SET status = 'accepted', finalized_at_tick = v_tick
     WHERE id = p_offer_id;
    UPDATE personal_loan_offers
       SET status = 'auto_declined', finalized_at_tick = v_tick
     WHERE request_id = v_req.id
       AND id <> p_offer_id
       AND status = 'pending';

    -- Flip the request.
    UPDATE personal_loan_requests
       SET status              = 'accepted',
           accepted_by_corp_id = v_bank.id,
           finalized_at_tick   = v_tick
     WHERE id = v_req.id;

    RETURN jsonb_build_object(
        'success',          true,
        'loan_id',          v_loan_id,
        'lender_corp_id',   v_bank.id,
        'principal',        v_req.principal,
        'apr',              v_offer.apr,
        'term_ticks',       v_req.term_ticks,
        'per_tick_payment', v_per_tick
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.accept_personal_loan_offer(uuid) TO authenticated;

COMMENT ON FUNCTION public.accept_personal_loan_offer(uuid) IS
    'Borrower accepts a pending personal_loan_offer. Atomic: debits bank owner party_funds, credits borrower party_funds, spawns personal_loans row, flips accepted/sibling offers + request. Stable lock order (offer → request → bank faction → borrower faction).';

-- ── 6. RPC: withdraw_personal_loan_offer (bank-side) ───────────────
CREATE OR REPLACE FUNCTION public.withdraw_personal_loan_offer(p_offer_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_fac    factions%ROWTYPE;
    v_offer  personal_loan_offers%ROWTYPE;
    v_bank   entrepreneur_corps%ROWTYPE;
    v_tick   int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_offer FROM personal_loan_offers WHERE id = p_offer_id FOR UPDATE;
    IF v_offer.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'offer_not_found');
    END IF;
    IF v_offer.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'offer_not_pending');
    END IF;

    SELECT * INTO v_bank FROM entrepreneur_corps WHERE id = v_offer.bank_corp_id;
    IF v_bank.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bank_corp_not_found');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL OR v_bank.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE personal_loan_offers
       SET status = 'withdrawn', finalized_at_tick = v_tick
     WHERE id = p_offer_id;

    RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.withdraw_personal_loan_offer(uuid) TO authenticated;

-- ── 7. RPC: cancel_personal_loan_request (borrower-side) ───────────
CREATE OR REPLACE FUNCTION public.cancel_personal_loan_request(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_fac  factions%ROWTYPE;
    v_req  personal_loan_requests%ROWTYPE;
    v_tick int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_req FROM personal_loan_requests WHERE id = p_request_id FOR UPDATE;
    IF v_req.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_not_found');
    END IF;
    IF v_req.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_not_pending');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL OR v_fac.id <> v_req.borrower_faction_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_borrower');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE personal_loan_requests
       SET status = 'cancelled', finalized_at_tick = v_tick
     WHERE id = p_request_id;
    UPDATE personal_loan_offers
       SET status = 'auto_declined', finalized_at_tick = v_tick
     WHERE request_id = p_request_id AND status = 'pending';

    RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.cancel_personal_loan_request(uuid) TO authenticated;

-- ── 8. RPC: expire_stale_personal_loan_requests (lazy expiry) ──────
-- Called from the entrepreneur-dashboard before listing requests/offers
-- so expired rows flip to 'expired' without a tick-handler dependency.
-- Safe to call repeatedly; only acts on still-'pending' rows past their
-- expires_at_tick. Open to any authenticated user — no sensitive
-- input, just a state sweep.
CREATE OR REPLACE FUNCTION public.expire_stale_personal_loan_requests()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tick    int;
    v_expired int;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    WITH expired AS (
        UPDATE personal_loan_requests
           SET status            = 'expired',
               finalized_at_tick = v_tick
         WHERE status         = 'pending'
           AND expires_at_tick <= v_tick
        RETURNING id
    ),
    decline AS (
        UPDATE personal_loan_offers o
           SET status            = 'auto_declined',
               finalized_at_tick = v_tick
         WHERE o.status = 'pending'
           AND o.request_id IN (SELECT id FROM expired)
        RETURNING o.id
    )
    SELECT count(*)::int INTO v_expired FROM expired;

    RETURN jsonb_build_object('success', true, 'expired', v_expired);
END;
$$;
GRANT EXECUTE ON FUNCTION public.expire_stale_personal_loan_requests() TO authenticated;

COMMENT ON FUNCTION public.expire_stale_personal_loan_requests() IS
    'Lazy expiry sweep — flips pending personal_loan_requests past expires_at_tick to ''expired'' and auto-declines their pending offers. Called from the entrepreneur dashboard pre-list so no tick-handler dependency.';

NOTIFY pgrst, 'reload schema';

COMMIT;
