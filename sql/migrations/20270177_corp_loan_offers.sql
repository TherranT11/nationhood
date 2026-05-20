-- ════════════════════════════════════════════════════════════════════
-- CORP LOANS v1 — banks offer rates; borrower picks
-- ════════════════════════════════════════════════════════════════════
-- Rewrites the v0 loan flow (20270174) so the BANK sets the APR
-- on a per-bank offer instead of the borrower fixing it upfront.
-- Borrower submits principal + term only; every eligible Banking
-- corp can respond with their own APR; borrower picks one offer.
-- The corp_loans row stamps the accepted offer's APR — that's what
-- the tick processor amortises against.
--
-- No collateral in this iteration (locked design). Add later as a
-- v2 layer that decorates corp_loan_offers with structured terms.
--
-- ── Flow ───────────────────────────────────────────────────────
--   1. Borrower: submit_corp_loan_request(corp, principal, term)
--      — no APR, single pending request per borrower, 6-tick expiry.
--   2. Eligible bank (industry='banking' + Banking Office in
--      borrower's HQ nation): offer_loan(request, bank, apr)
--      — partial UNIQUE on (request_id, bank_corp_id) WHERE
--      status='pending'; upsert lets the bank revise their bid
--      without a separate withdraw step.
--   3. Borrower: accept_loan_offer(offer)
--      — atomic conditional UPDATE debits the bank's owner faction;
--      money lands in the borrower's faction; corp_loans row spawns
--      with this offer's APR; the accepted offer flips 'accepted',
--      every OTHER pending offer on the same request flips
--      'auto_declined', and the request itself flips 'accepted'.
--   4. Bank can withdraw_loan_offer(offer) anytime before accept.
--   5. Borrower can cancel_corp_loan_request(request); all pending
--      offers flip 'auto_declined'.
--   6. Tick handler expires pending requests past their deadline
--      and auto-declines their offers; per-tick loan servicing is
--      unchanged from v0.
--
-- ── Schema change on corp_loan_requests ────────────────────────
-- DROPs the apr column (and its NOT NULL + CHECK constraint).
-- Old pending requests lose their APR but stay pending; banks can
-- offer a fresh rate. Alpha state, intentional.
--
-- ── New table corp_loan_offers ─────────────────────────────────
-- id, request_id (CASCADE), bank_corp_id (CASCADE), apr,
-- status (pending|accepted|declined|withdrawn|auto_declined),
-- placed_at_tick, finalized_at_tick, created_at.
-- Partial UNIQUE on (request_id, bank_corp_id) WHERE
-- status='pending' enables offer_loan's upsert.
-- RLS SELECT-all + no write policy (RPC-only writes), same class
-- as corp_loan_requests / corp_loans.
--
-- ── Dropped RPC ────────────────────────────────────────────────
-- accept_corp_loan_request is gone — the v0 single-step accept is
-- replaced by the offer-then-accept two-step. Existing callers
-- (the bank-side [Accept]/[Decline] buttons in entrepreneur-corp)
-- are restructured in the same commit's client changes.
--
-- Idempotent (CREATE OR REPLACE everywhere; column drop is
-- IF EXISTS; table add is IF NOT EXISTS).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Drop the apr column from corp_loan_requests ─────────────

ALTER TABLE corp_loan_requests DROP COLUMN IF EXISTS apr CASCADE;

-- ── 2. corp_loan_offers ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS corp_loan_offers (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id          uuid NOT NULL REFERENCES corp_loan_requests(id) ON DELETE CASCADE,
    bank_corp_id        uuid NOT NULL REFERENCES entrepreneur_corps(id) ON DELETE CASCADE,
    apr                 numeric NOT NULL CHECK (apr >= 0 AND apr <= 0.5),
    status              text   NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','accepted','declined','withdrawn','auto_declined')),
    placed_at_tick      int    NOT NULL,
    finalized_at_tick   int,
    created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_corp_loan_offers_request
    ON corp_loan_offers (request_id, status);
CREATE INDEX IF NOT EXISTS idx_corp_loan_offers_bank
    ON corp_loan_offers (bank_corp_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_corp_loan_offers_one_pending
    ON corp_loan_offers (request_id, bank_corp_id)
    WHERE status = 'pending';

ALTER TABLE corp_loan_offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select for all" ON corp_loan_offers;
CREATE POLICY "Allow select for all" ON corp_loan_offers FOR SELECT USING (true);

COMMENT ON TABLE corp_loan_offers IS
    'Per-bank rate offers on a borrower''s pending corp_loan_request. Partial UNIQUE on (request_id, bank_corp_id) WHERE status=''pending'' — banks upsert via offer_loan to revise their bid without withdrawing first.';

-- ── 3. submit_corp_loan_request — drop p_apr ───────────────────

DROP FUNCTION IF EXISTS public.submit_corp_loan_request(uuid, bigint, int, numeric);

CREATE OR REPLACE FUNCTION public.submit_corp_loan_request(
    p_borrower_corp_id uuid,
    p_principal        bigint,
    p_term_ticks       int
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
        (borrower_corp_id, principal, term_ticks,
         status, placed_at_tick, expires_at_tick)
    VALUES
        (p_borrower_corp_id, p_principal, p_term_ticks,
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
        format('%s of %s requests a $%s loan over %s ticks. Banks may respond with offers.',
               v_ceo_name, v_corp.name,
               to_char(p_principal, 'FM999,999,999,999'),
               p_term_ticks),
        'corporate', 'corp_loan_request_submitted',
        jsonb_build_object(
            'request_id',       v_request_id,
            'borrower_corp_id', p_borrower_corp_id,
            'corp_name',        v_corp.name,
            'ceo_name',         v_ceo_name,
            'principal',        p_principal,
            'term_ticks',       p_term_ticks,
            'expires_at_tick',  v_expires_tick
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',         true,
        'request_id',      v_request_id,
        'principal',       p_principal,
        'term_ticks',      p_term_ticks,
        'expires_at_tick', v_expires_tick
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_corp_loan_request(uuid, bigint, int) TO authenticated;

-- ── 4. offer_loan — bank submits / upserts a rate offer ────────

CREATE OR REPLACE FUNCTION public.offer_loan(
    p_request_id   uuid,
    p_bank_corp_id uuid,
    p_apr          numeric
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
    v_offer_id         uuid;
    v_tick             int;
    v_has_bo           boolean;
    v_nation_name      text;
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

    -- No self-offers — same intent as the v0 cannot_self_loan guard.
    IF p_bank_corp_id = v_request.borrower_corp_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cannot_self_loan');
    END IF;

    SELECT * INTO v_borrower_corp FROM entrepreneur_corps WHERE id = v_request.borrower_corp_id;
    IF v_borrower_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'borrower_corp_not_found');
    END IF;

    SELECT * INTO v_bank_corp FROM entrepreneur_corps WHERE id = p_bank_corp_id FOR UPDATE;
    IF v_bank_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bank_corp_not_found');
    END IF;
    IF v_bank_corp.industry <> 'banking' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_banking_corp');
    END IF;

    -- Eligibility: completed Banking Office in borrower HQ nation.
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

    -- Upsert via the partial UNIQUE index. A bank's second offer on
    -- the same request just updates their pending row (revising
    -- APR) without a separate withdraw step.
    INSERT INTO corp_loan_offers
        (request_id, bank_corp_id, apr, status, placed_at_tick)
    VALUES
        (p_request_id, p_bank_corp_id, p_apr, 'pending', v_tick)
    ON CONFLICT (request_id, bank_corp_id) WHERE status = 'pending'
    DO UPDATE SET apr = EXCLUDED.apr, placed_at_tick = EXCLUDED.placed_at_tick
    RETURNING id INTO v_offer_id;

    SELECT name INTO v_nation_name FROM nations WHERE id = v_borrower_corp.hq_nation_id;
    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_borrower_corp.hq_nation_id, v_fac.id,
        'Loan Offer Submitted',
        format('%s offers %s%% APR on %s''s $%s loan request.',
               v_bank_corp.name,
               to_char(p_apr * 100, 'FM99.99'),
               v_borrower_corp.name,
               to_char(v_request.principal, 'FM999,999,999,999')),
        'corporate', 'corp_loan_offer_submitted',
        jsonb_build_object(
            'offer_id',           v_offer_id,
            'request_id',         p_request_id,
            'bank_corp_id',       p_bank_corp_id,
            'bank_corp_name',     v_bank_corp.name,
            'borrower_corp_id',   v_request.borrower_corp_id,
            'borrower_corp_name', v_borrower_corp.name,
            'apr',                p_apr,
            'principal',          v_request.principal,
            'term_ticks',         v_request.term_ticks
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',   true,
        'offer_id',  v_offer_id,
        'apr',       p_apr,
        'request_id', p_request_id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.offer_loan(uuid, uuid, numeric) TO authenticated;

COMMENT ON FUNCTION public.offer_loan(uuid, uuid, numeric) IS
    'Banking corp''s owner submits a rate offer on a pending loan request. Eligibility verified live (industry=banking + Banking Office in borrower HQ nation). Upserts via partial UNIQUE — revising the APR is a single round-trip.';

-- ── 5. accept_loan_offer — borrower picks a specific bank's bid ─

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
    v_borrower_fac_id  uuid;
    v_bank_fac_id      uuid;
    v_tick             int;
    v_per_tick         bigint;
    v_loan_id          uuid;
    v_bank_funds       bigint;
    v_auto_declined    int := 0;
    v_nation_name      text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_offer_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_offer FROM corp_loan_offers
     WHERE id = p_offer_id FOR UPDATE;
    IF v_offer.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'offer_not_found');
    END IF;
    IF v_offer.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'offer_not_pending');
    END IF;

    SELECT * INTO v_request FROM corp_loan_requests
     WHERE id = v_offer.request_id FOR UPDATE;
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

    PERFORM id FROM entrepreneur_corps
     WHERE id IN (v_offer.bank_corp_id, v_request.borrower_corp_id)
     ORDER BY id FOR UPDATE;

    SELECT * INTO v_borrower_corp FROM entrepreneur_corps WHERE id = v_request.borrower_corp_id;
    IF v_borrower_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'borrower_corp_not_found');
    END IF;
    IF v_borrower_corp.owner_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'borrower_orphan');
    END IF;
    v_borrower_fac_id := v_borrower_corp.owner_faction_id;

    SELECT * INTO v_bank_corp FROM entrepreneur_corps WHERE id = v_offer.bank_corp_id;
    IF v_bank_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bank_corp_not_found');
    END IF;
    IF v_bank_corp.owner_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bank_orphan');
    END IF;
    v_bank_fac_id := v_bank_corp.owner_faction_id;

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

    -- Atomic affordability + debit on bank's owner faction (same
    -- pattern as accept_offer / accept_corp_loan_request audit).
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

    -- Per-tick payment computed from THIS offer's APR (the v1
    -- innovation — request no longer carries an APR).
    v_per_tick := GREATEST(1, ROUND(
        v_request.principal::numeric / v_request.term_ticks
        + v_request.principal::numeric * v_offer.apr / 12
    )::bigint);

    INSERT INTO corp_loans
        (request_id, borrower_corp_id, lender_corp_id, principal, apr, term_ticks,
         per_tick_payment, payments_remaining, started_at_tick)
    VALUES
        (v_offer.request_id, v_request.borrower_corp_id, v_offer.bank_corp_id,
         v_request.principal, v_offer.apr, v_request.term_ticks,
         v_per_tick, v_request.term_ticks, v_tick)
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

    SELECT name INTO v_nation_name FROM nations WHERE id = v_borrower_corp.hq_nation_id;
    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_borrower_corp.hq_nation_id, v_fac.id,
        'Loan Funded',
        format('%s accepts %s%% APR offer from %s. $%s funded; %s ticks × $%s per tick.',
               v_borrower_corp.name,
               to_char(v_offer.apr * 100, 'FM99.99'),
               v_bank_corp.name,
               to_char(v_request.principal, 'FM999,999,999,999'),
               v_request.term_ticks,
               to_char(v_per_tick, 'FM999,999,999,999')),
        'corporate', 'corp_loan_funded',
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
    'Borrower picks a specific bank''s offer. Money: bank-faction → borrower-faction via atomic conditional UPDATE. Spawns corp_loans row with the OFFER''s APR (not the request''s — request no longer carries one). Other pending offers on the same request auto-decline.';

-- ── 6. withdraw_loan_offer — bank cancels their own offer ──────

CREATE OR REPLACE FUNCTION public.withdraw_loan_offer(p_offer_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_fac          factions%ROWTYPE;
    v_offer        corp_loan_offers%ROWTYPE;
    v_bank_corp    entrepreneur_corps%ROWTYPE;
    v_tick         int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_offer_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_offer FROM corp_loan_offers
     WHERE id = p_offer_id FOR UPDATE;
    IF v_offer.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'offer_not_found');
    END IF;
    IF v_offer.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'offer_not_pending');
    END IF;

    SELECT * INTO v_bank_corp FROM entrepreneur_corps
     WHERE id = v_offer.bank_corp_id FOR UPDATE;
    IF v_bank_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bank_corp_not_found');
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
    IF v_bank_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_bank_corp_owner');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE corp_loan_offers
       SET status = 'withdrawn', finalized_at_tick = v_tick
     WHERE id = p_offer_id;

    RETURN jsonb_build_object('success', true, 'offer_id', p_offer_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.withdraw_loan_offer(uuid) TO authenticated;

-- ── 7. cancel_corp_loan_request — cascade to pending offers ────
-- v0 just flipped the request status. v1 also auto-declines every
-- still-pending offer on that request so banks get a final state.

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
    v_auto_declined   int := 0;
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

    UPDATE corp_loan_offers
       SET status = 'auto_declined', finalized_at_tick = v_tick
     WHERE request_id = p_request_id AND status = 'pending';
    GET DIAGNOSTICS v_auto_declined = ROW_COUNT;

    RETURN jsonb_build_object('success', true,
        'request_id', p_request_id,
        'auto_declined', v_auto_declined);
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_corp_loan_request(uuid) TO authenticated;

-- ── 8. process_corp_loans — cascade expiry to pending offers ───
-- v0 just expired pending requests. v1 also auto-declines their
-- pending offers in the same sweep. Per-tick servicing of active
-- loans is unchanged from 20270175 (same atomic-affordability
-- pattern; started_at_tick < v_tick gate prevents same-tick
-- double-bill).

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
    v_offers_declined  int := 0;
    v_decl_count       int;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    FOR r IN
        SELECT id FROM corp_loan_requests
         WHERE status = 'pending' AND expires_at_tick <= v_tick
         FOR UPDATE
    LOOP
        UPDATE corp_loan_requests
           SET status = 'expired', finalized_at_tick = v_tick
         WHERE id = r.id;
        UPDATE corp_loan_offers
           SET status = 'auto_declined', finalized_at_tick = v_tick
         WHERE request_id = r.id AND status = 'pending';
        GET DIAGNOSTICS v_decl_count = ROW_COUNT;
        v_offers_declined := v_offers_declined + v_decl_count;
        v_expired := v_expired + 1;
    END LOOP;

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
        SELECT owner_faction_id INTO v_borrower_fac_id
          FROM entrepreneur_corps WHERE id = r.borrower_corp_id;
        SELECT owner_faction_id INTO v_lender_fac_id
          FROM entrepreneur_corps WHERE id = r.lender_corp_id;

        IF v_borrower_fac_id IS NULL OR v_lender_fac_id IS NULL THEN
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
        'expired',         v_expired,
        'offers_declined', v_offers_declined,
        'paid',            v_paid,
        'repaid',          v_repaid,
        'defaulted',       v_defaulted,
        'tick',            v_tick);
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_corp_loans(int) TO authenticated;

-- ── 9. Drop accept_corp_loan_request — replaced by accept_loan_offer

DROP FUNCTION IF EXISTS public.accept_corp_loan_request(uuid, uuid);

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.withdraw_loan_offer(uuid);
-- DROP FUNCTION IF EXISTS public.accept_loan_offer(uuid);
-- DROP FUNCTION IF EXISTS public.offer_loan(uuid, uuid, numeric);
-- DROP FUNCTION IF EXISTS public.submit_corp_loan_request(uuid, bigint, int);
-- -- Re-apply 20270174 + 20270175 to restore the v0 single-step accept
-- -- + the original 4-arg submit_corp_loan_request. NOTE: the apr
-- -- column on corp_loan_requests is gone; the rollback recreates it
-- -- but old data is lost.
-- ALTER TABLE corp_loan_requests
--     ADD COLUMN IF NOT EXISTS apr numeric;
-- DROP TABLE IF EXISTS corp_loan_offers;
-- COMMIT;
