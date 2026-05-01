-- ══════════════════════════════════════════════════════════════
-- Equity Counter-Offer Pipeline E2: SECURITY DEFINER RPCs
--
-- Direct mirror of the loan counter-offer RPCs (L2 / 20260530)
-- adapted to equity shape:
--
--   submit_equity_raise   — borrower posts. Auto-classifies series.
--   submit_equity_offer   — Finance corp counters with offered
--                           amount + equity_pct.
--   accept_equity_offer   — borrower picks one (others auto-reject).
--   reject_equity_offer   — borrower turns down individually.
--   pay_out_equity        — investor disburses cash; position flips
--                           pending_payout → active.
--
-- Lifecycle:
--   equity_raises:    pending → accepted (when offer is accepted)
--                            → expired / cancelled / rejected
--   equity_offers:    pending → accepted | rejected | auto_rejected
--                            | expired | withdrawn
--   equity_positions: pending_payout (minted on accept) → active
--                            (pay_out_equity disburses) → closed
--
-- All five RPCs are SECURITY DEFINER + GRANT TO authenticated. RLS
-- on equity_raises / equity_offers / equity_positions is read-all
-- only; these RPCs are the only sanctioned writers (besides the
-- service-role tick processor in E5).
-- ══════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────
-- submit_equity_raise: borrower posts a raise targeting Finance corps
-- ─────────────────────────────────────────────────────────────
-- Caller passes p_requesting_faction_id explicitly (matches the
-- L2 submit_loan_request pattern). The RPC verifies the caller
-- owns that faction and that it's a non-Finance corp.
--
-- Auto-classifies series from the count of prior funded raises by
-- this borrower (every equity_positions row counts, regardless of
-- pending_payout / active / closed). Clamped at 'Z' for late-stage
-- catch-all; series is free-form TEXT so a future migration can
-- replace 'Z' with 'LATE' / 'PRE-IPO' / etc. without churning a
-- CHECK constraint.
-- ─────────────────────────────────────────────────────────────

-- Drop any pre-audit version of submit_equity_raise. Audit pass
-- found the original signature was missing p_requesting_faction_id
-- and picked the first owned corp non-deterministically, which
-- misattributed raises for users with multiple corps. The DROP is
-- idempotent (IF EXISTS) and runs before the CREATE OR REPLACE so
-- both pre-audit and re-applied versions converge on the same
-- corrected signature.
DROP FUNCTION IF EXISTS submit_equity_raise(UUID[], BIGINT, NUMERIC, TEXT, INT);

CREATE OR REPLACE FUNCTION submit_equity_raise(
    p_requesting_faction_id UUID,
    p_target_finance_ids    UUID[],
    p_amount                BIGINT,
    p_equity_pct            NUMERIC,
    p_purpose               TEXT,
    p_expires_in_ticks      INT DEFAULT 12
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
    v_user        UUID := auth.uid();
    v_borrower    factions%ROWTYPE;
    v_tick        INT;
    v_prior_count INT;
    v_series      TEXT;
    v_raise_id    UUID;
    v_purpose     TEXT;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    -- Caller owns the requesting faction.
    SELECT * INTO v_borrower FROM factions WHERE id = p_requesting_faction_id;
    IF v_borrower.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Requesting faction not found');
    END IF;
    IF v_borrower.id <> v_user AND v_borrower.linked_user_id IS DISTINCT FROM v_user THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this faction');
    END IF;
    IF v_borrower.faction_type <> 'corporation' THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Only corporations can raise equity');
    END IF;

    -- Hard sector gate: Finance corps fund equity, they do not raise it.
    -- Mirrors the early-return guard in equity-apply.js for the legacy
    -- direct-insert path.
    IF v_borrower.corp_sector = 'Finance' THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Finance-sector corps fund equity; they do not raise it');
    END IF;

    -- Term + amount validation.
    IF p_amount IS NULL OR p_amount <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Amount must be > 0');
    END IF;
    IF p_amount < 1000000 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Minimum raise is $1M');
    END IF;
    IF p_amount > 10000000000 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Maximum raise is $10B');
    END IF;

    IF p_equity_pct IS NULL OR p_equity_pct < 1 OR p_equity_pct > 50 THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Equity stake must be between 1% and 50%');
    END IF;

    IF p_target_finance_ids IS NULL OR array_length(p_target_finance_ids, 1) IS NULL THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Pick at least one Finance corp to send the raise to');
    END IF;

    IF p_expires_in_ticks IS NULL OR p_expires_in_ticks <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Expiry must be > 0 ticks');
    END IF;

    -- Auto-classify series from the count of prior funded raises.
    SELECT COUNT(*) INTO v_prior_count
      FROM equity_positions
     WHERE borrower_faction_id = v_borrower.id;
    -- 65 = 'A' in ASCII; chr(65+25) = 'Z'.
    v_series := chr(LEAST(65 + v_prior_count, 90));

    -- Purpose default if blank — keeps the request rendered with a
    -- stable label in Pressing Issues even when the borrower skipped
    -- the field.
    v_purpose := NULLIF(TRIM(COALESCE(p_purpose, '')), '');
    IF v_purpose IS NULL THEN
        v_purpose := 'Equity capital raise';
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    INSERT INTO equity_raises (
        requesting_faction_id, requesting_nation_id, target_finance_ids,
        requested_amount, requested_equity_pct, series, purpose,
        status, expires_at_tick, created_at_tick
    ) VALUES (
        v_borrower.id, v_borrower.nation_id, p_target_finance_ids,
        p_amount, p_equity_pct, v_series, v_purpose,
        'pending', v_tick + p_expires_in_ticks, v_tick
    ) RETURNING id INTO v_raise_id;

    RETURN jsonb_build_object(
        'success',  true,
        'raise_id', v_raise_id,
        'series',   v_series,
        'expires_at_tick', v_tick + p_expires_in_ticks
    );
END;
$func$;

GRANT EXECUTE ON FUNCTION submit_equity_raise(UUID, UUID[], BIGINT, NUMERIC, TEXT, INT) TO authenticated;

COMMENT ON FUNCTION submit_equity_raise(UUID, UUID[], BIGINT, NUMERIC, TEXT, INT) IS
    'Borrower posts an equity raise targeting Finance corps. Caller passes p_requesting_faction_id explicitly (matches submit_loan_request). Auto-classifies series A/B/C from prior funded raise count. Returns raise_id + assigned series.';


-- ─────────────────────────────────────────────────────────────
-- submit_equity_offer: Finance corp counters on a raise
-- ─────────────────────────────────────────────────────────────
-- Strict one-shot per (raise, finance corp) — UNIQUE constraint
-- matches on all statuses. Offer terms can deviate from the asking
-- terms in either direction (per design fork C); only the global
-- 0–50% equity cap and amount > 0 are enforced server-side.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION submit_equity_offer(
    p_raise_id           UUID,
    p_finance_faction_id UUID,
    p_offered_amount     BIGINT,
    p_offered_equity_pct NUMERIC
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
    v_user         UUID := auth.uid();
    v_finance      factions%ROWTYPE;
    v_raise        equity_raises%ROWTYPE;
    v_existing_id  UUID;
    v_tick         INT;
    v_offer_id     UUID;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    -- Caller owns the Finance corp.
    SELECT * INTO v_finance FROM factions WHERE id = p_finance_faction_id;
    IF v_finance.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Finance corp not found');
    END IF;
    IF v_finance.id <> v_user AND v_finance.linked_user_id IS DISTINCT FROM v_user THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this corp');
    END IF;
    IF v_finance.faction_type <> 'corporation' OR v_finance.corp_sector <> 'Finance' THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Only Finance corporations can submit equity offers');
    END IF;

    -- Raise must exist, be pending, and target this Finance corp.
    SELECT * INTO v_raise FROM equity_raises WHERE id = p_raise_id;
    IF v_raise.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Equity raise not found');
    END IF;
    IF v_raise.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Raise is %s, no longer accepting offers', v_raise.status));
    END IF;
    IF NOT (p_finance_faction_id = ANY(v_raise.target_finance_ids)) THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Your corp was not invited to this raise');
    END IF;

    -- Amount + equity validation. Offer terms can deviate from the
    -- raise's asking terms in either direction — only the global
    -- bounds matter (per design fork C).
    IF p_offered_amount IS NULL OR p_offered_amount <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Offered amount must be > 0');
    END IF;
    IF p_offered_equity_pct IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Offered equity pct is required');
    END IF;
    IF p_offered_equity_pct < 0 OR p_offered_equity_pct > 50 THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Offered equity %s%% must be between 0%% and 50%%', p_offered_equity_pct));
    END IF;

    -- One-shot guard. UNIQUE(raise_id, finance_faction_id) on the
    -- table catches this too, but the explicit check produces a
    -- friendlier error message.
    SELECT id INTO v_existing_id FROM equity_offers
     WHERE raise_id = p_raise_id AND finance_faction_id = p_finance_faction_id;
    IF v_existing_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false,
            'error', 'You already submitted an offer on this raise — one offer per Finance corp per raise');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    INSERT INTO equity_offers (
        raise_id, finance_faction_id, offered_amount, offered_equity_pct,
        status, expires_at_tick, created_at_tick
    ) VALUES (
        p_raise_id, p_finance_faction_id, p_offered_amount, p_offered_equity_pct,
        'pending', v_raise.expires_at_tick, v_tick
    ) RETURNING id INTO v_offer_id;

    RETURN jsonb_build_object(
        'success',  true,
        'offer_id', v_offer_id,
        'expires_at_tick', v_raise.expires_at_tick
    );
END;
$func$;

GRANT EXECUTE ON FUNCTION submit_equity_offer(UUID, UUID, BIGINT, NUMERIC) TO authenticated;

COMMENT ON FUNCTION submit_equity_offer(UUID, UUID, BIGINT, NUMERIC) IS
    'Finance corp counters on an equity raise with their own offered_amount + offered_equity_pct. Strict one-shot per (raise, finance corp) — UNIQUE constraint matches on all statuses.';


-- ─────────────────────────────────────────────────────────────
-- accept_equity_offer: borrower picks one offer
-- ─────────────────────────────────────────────────────────────
-- Atomic 4-step:
--   1. Flip the chosen offer to 'accepted' (optimistic lock).
--   2. Auto-reject every other pending offer on this raise.
--   3. Flip the raise to 'accepted' (optimistic lock + RAISE
--      EXCEPTION rollback on race — see L2 audit fix for context).
--   4. Mint equity_positions in 'pending_payout'.
--
-- Mirrors accept_loan_offer (20260530) including the race-recovery
-- pattern: if step 3 races against another path that's already
-- moved the raise out of 'pending', RAISE EXCEPTION rolls back
-- steps 1 + 2 so we don't end up with orphan auto_rejected siblings.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION accept_equity_offer(
    p_offer_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
    v_user           UUID := auth.uid();
    v_offer          equity_offers%ROWTYPE;
    v_raise          equity_raises%ROWTYPE;
    v_borrower       factions%ROWTYPE;
    v_tick           INT;
    v_position_id    UUID;
    v_updated_count  INT;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT * INTO v_offer FROM equity_offers WHERE id = p_offer_id;
    IF v_offer.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Offer not found');
    END IF;
    IF v_offer.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Offer is %s; cannot accept', v_offer.status));
    END IF;

    SELECT * INTO v_raise FROM equity_raises WHERE id = v_offer.raise_id;
    IF v_raise.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Equity raise not found');
    END IF;
    IF v_raise.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Raise is %s; cannot accept offers', v_raise.status));
    END IF;

    -- Caller owns the borrower (raise's requesting_faction_id).
    SELECT * INTO v_borrower FROM factions WHERE id = v_raise.requesting_faction_id;
    IF v_borrower.id IS NULL OR
       (v_borrower.id <> v_user AND v_borrower.linked_user_id IS DISTINCT FROM v_user) THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this faction');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    -- 1. Flip chosen offer → 'accepted'.
    UPDATE equity_offers
       SET status            = 'accepted',
           resolved_at_tick  = v_tick,
           updated_at        = now()
     WHERE id     = p_offer_id
       AND status = 'pending';
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    IF v_updated_count = 0 THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Offer changed state before accept (accepted or expired by another path)');
    END IF;

    -- 2. Auto-reject every other pending offer on this raise.
    UPDATE equity_offers
       SET status            = 'auto_rejected',
           resolved_at_tick  = v_tick,
           updated_at        = now()
     WHERE raise_id = v_offer.raise_id
       AND id      <> p_offer_id
       AND status   = 'pending';

    -- 3. Flip raise to 'accepted' with the winning Finance corp.
    -- Optimistic lock on status='pending' so a concurrent cancel /
    -- expire path can't collide silently. RAISE EXCEPTION on race
    -- rolls back steps 1 + 2 (whole transaction).
    UPDATE equity_raises
       SET status             = 'accepted',
           winning_finance_id = v_offer.finance_faction_id,
           resolved_at_tick   = v_tick,
           updated_at         = now()
     WHERE id     = v_offer.raise_id
       AND status = 'pending';
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    IF v_updated_count = 0 THEN
        RAISE EXCEPTION 'Raise resolved by another action just now; try refresh';
    END IF;

    -- 4. Mint the position in 'pending_payout'. Terms snapshot from
    -- the accepted offer (NOT the raise's asking terms — the offer
    -- is what the borrower agreed to).
    INSERT INTO equity_positions (
        raise_id, offer_id, investor_faction_id, borrower_faction_id, nation_id,
        principal, equity_pct, series, status, issued_at_tick
    ) VALUES (
        v_offer.raise_id,
        p_offer_id,
        v_offer.finance_faction_id,
        v_raise.requesting_faction_id,
        v_raise.requesting_nation_id,
        v_offer.offered_amount,
        v_offer.offered_equity_pct,
        v_raise.series,
        'pending_payout',
        v_tick
    ) RETURNING id INTO v_position_id;

    RETURN jsonb_build_object(
        'success',     true,
        'position_id', v_position_id,
        'status',      'pending_payout',
        'message',     'Offer accepted. Investor uses Pay Out Equity to disburse.'
    );
END;
$func$;

GRANT EXECUTE ON FUNCTION accept_equity_offer(UUID) TO authenticated;

COMMENT ON FUNCTION accept_equity_offer(UUID) IS
    'Borrower accepts one equity offer. Atomic: flips this offer to accepted, auto-rejects every other pending offer on the raise, flips the raise to accepted, mints an equity_positions row in pending_payout state.';


-- ─────────────────────────────────────────────────────────────
-- reject_equity_offer: borrower turns down one offer individually
-- ─────────────────────────────────────────────────────────────
-- Doesn't affect the parent raise — other offers remain in play.
-- Borrower can reject one and still accept another from the same
-- raise. The Finance corp whose offer was rejected can't re-bid
-- (UNIQUE constraint), per the one-shot rule.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION reject_equity_offer(
    p_offer_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
    v_user           UUID := auth.uid();
    v_offer          equity_offers%ROWTYPE;
    v_raise          equity_raises%ROWTYPE;
    v_borrower       factions%ROWTYPE;
    v_tick           INT;
    v_updated_count  INT;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT * INTO v_offer FROM equity_offers WHERE id = p_offer_id;
    IF v_offer.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Offer not found');
    END IF;
    IF v_offer.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Offer is %s; cannot reject', v_offer.status));
    END IF;

    SELECT * INTO v_raise FROM equity_raises WHERE id = v_offer.raise_id;
    IF v_raise.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Equity raise not found');
    END IF;

    SELECT * INTO v_borrower FROM factions WHERE id = v_raise.requesting_faction_id;
    IF v_borrower.id IS NULL OR
       (v_borrower.id <> v_user AND v_borrower.linked_user_id IS DISTINCT FROM v_user) THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this faction');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    UPDATE equity_offers
       SET status            = 'rejected',
           resolved_at_tick  = v_tick,
           updated_at        = now()
     WHERE id     = p_offer_id
       AND status = 'pending';
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    IF v_updated_count = 0 THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Offer changed state before reject');
    END IF;

    RETURN jsonb_build_object('success', true, 'offer_id', p_offer_id);
END;
$func$;

GRANT EXECUTE ON FUNCTION reject_equity_offer(UUID) TO authenticated;

COMMENT ON FUNCTION reject_equity_offer(UUID) IS
    'Borrower rejects one equity offer individually. Sibling offers on the same raise are unaffected.';


-- ─────────────────────────────────────────────────────────────
-- pay_out_equity: investor disburses cash, position activates
-- ─────────────────────────────────────────────────────────────
-- Two-step like pay_out_loan: accept mints the position in
-- 'pending_payout'; this RPC moves the cash and flips to 'active'.
-- After this, the per-tick processor (E5) starts paying out
-- equity_pct × borrower.monthly_profit on each tick.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION pay_out_equity(
    p_position_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
    v_user           UUID := auth.uid();
    v_position       equity_positions%ROWTYPE;
    v_investor       factions%ROWTYPE;
    v_borrower       factions%ROWTYPE;
    v_tick           INT;
    v_updated_count  INT;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT * INTO v_position FROM equity_positions WHERE id = p_position_id;
    IF v_position.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Equity position not found');
    END IF;
    IF v_position.status <> 'pending_payout' THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Position is %s; cannot pay out', v_position.status));
    END IF;

    SELECT * INTO v_investor FROM factions WHERE id = v_position.investor_faction_id;
    IF v_investor.id IS NULL OR
       (v_investor.id <> v_user AND v_investor.linked_user_id IS DISTINCT FROM v_user) THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own the investor faction');
    END IF;

    SELECT * INTO v_borrower FROM factions WHERE id = v_position.borrower_faction_id;
    IF v_borrower.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Borrower no longer exists');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    -- Atomic investor debit. Same pattern as pay_out_loan — single
    -- UPDATE with a sufficient-cash WHERE clause; ROW_COUNT=0
    -- means the investor's cash dropped below the principal between
    -- the read and the write.
    UPDATE factions
       SET corp_cash_reserves = COALESCE(corp_cash_reserves, 0) - v_position.principal
     WHERE id = v_investor.id
       AND COALESCE(corp_cash_reserves, 0) >= v_position.principal;
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    IF v_updated_count = 0 THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Insufficient cash — investor cash dropped below $%s before payout',
                            to_char(v_position.principal, 'FM999,999,999,999')));
    END IF;

    UPDATE factions
       SET corp_cash_reserves = COALESCE(corp_cash_reserves, 0) + v_position.principal
     WHERE id = v_borrower.id;

    UPDATE equity_positions
       SET status            = 'active',
           paid_out_at_tick  = v_tick,
           updated_at        = now()
     WHERE id     = p_position_id
       AND status = 'pending_payout';
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    IF v_updated_count = 0 THEN
        -- Race recovery: refund the cash transfer.
        UPDATE factions SET corp_cash_reserves = corp_cash_reserves + v_position.principal WHERE id = v_investor.id;
        UPDATE factions SET corp_cash_reserves = corp_cash_reserves - v_position.principal WHERE id = v_borrower.id;
        RETURN jsonb_build_object('success', false, 'error', 'Position was already paid out');
    END IF;

    RETURN jsonb_build_object(
        'success',             true,
        'position_id',         p_position_id,
        'principal_disbursed', v_position.principal,
        'equity_pct',          v_position.equity_pct
    );
END;
$func$;

GRANT EXECUTE ON FUNCTION pay_out_equity(UUID) TO authenticated;

COMMENT ON FUNCTION pay_out_equity(UUID) IS
    'Investor disburses the principal of a pending_payout equity position. Cash transfers from investor to borrower; position flips to active. Per-tick profit share (E5) starts on the next tick.';


NOTIFY pgrst, 'reload schema';
