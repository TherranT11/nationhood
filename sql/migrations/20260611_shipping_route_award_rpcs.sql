-- ══════════════════════════════════════════════════════════════
-- Shipping Operations SOP2: award columns + place_shipping_bid
--
-- Two parts:
--   1. ALTER columns to support criterion-based auto-award:
--      * shipping_contracts.award_criterion       — issuer's pick rule
--      * shipping_contract_bids.offered_revenue   — undercut bid price
--      * shipping_contract_bids.offered_term_ticks — faster-delivery bid
--      * shipping_contract_bids.bidder_route_risk_snapshot
--          — frozen stat at bid time so a Strategic Action between
--            bid and award can't game the lowest_risk criterion.
--
--   2. place_shipping_bid SECURITY DEFINER RPC. Validates ownership
--      + Shipping sector + contract is open + stat gates + offered
--      bounds (≤ contract ceilings), snapshots the bidder's
--      route_risk, INSERTs the bid. UNIQUE(contract_id,
--      bidder_faction_id) enforces strict one-shot per carrier per
--      contract — same one-shot rule as bank_loan_offers.
--
-- The auto-award itself runs in advance-corp-tick (service role).
-- After the bid window elapses, the per-tick processor finds
-- contracts whose expires_at_tick has passed and picks the winner
-- by award_criterion:
--   lowest_price     → MIN(offered_revenue_per_tick)
--   fastest_delivery → MIN(offered_term_ticks)
--   lowest_risk      → MIN(bidder_route_risk_snapshot)
-- Tiebreaker: earliest created_at_tick (first bid wins).
-- ══════════════════════════════════════════════════════════════


-- ══════════════════════════════════════════════════════════════
-- 1. Schema additions
-- ══════════════════════════════════════════════════════════════

ALTER TABLE shipping_contracts
  ADD COLUMN IF NOT EXISTS award_criterion TEXT NOT NULL DEFAULT 'lowest_price';

DO $$ BEGIN
  ALTER TABLE shipping_contracts
    ADD CONSTRAINT shc_award_criterion_check
    CHECK (award_criterion IN ('lowest_price', 'fastest_delivery', 'lowest_risk'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON COLUMN shipping_contracts.award_criterion IS
  'Issuer-set rule for auto-award after the bid window closes. lowest_price = pick min offered_revenue_per_tick; fastest_delivery = pick min offered_term_ticks; lowest_risk = pick min bidder_route_risk_snapshot. Tiebreaker is earliest created_at_tick.';

ALTER TABLE shipping_contract_bids
  ADD COLUMN IF NOT EXISTS offered_revenue_per_tick    BIGINT,
  ADD COLUMN IF NOT EXISTS offered_term_ticks          INT,
  ADD COLUMN IF NOT EXISTS bidder_route_risk_snapshot  NUMERIC(4,2);

DO $$ BEGIN
  ALTER TABLE shipping_contract_bids
    ADD CONSTRAINT scb_offered_revenue_check
    CHECK (offered_revenue_per_tick IS NULL OR offered_revenue_per_tick > 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE shipping_contract_bids
    ADD CONSTRAINT scb_offered_term_check
    CHECK (offered_term_ticks IS NULL OR offered_term_ticks > 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE shipping_contract_bids
    ADD CONSTRAINT scb_risk_snapshot_check
    CHECK (bidder_route_risk_snapshot IS NULL OR bidder_route_risk_snapshot BETWEEN 0 AND 10);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON COLUMN shipping_contract_bids.offered_revenue_per_tick IS
  'Bidder''s offered per-tick price. Must be > 0 and ≤ contract.revenue_per_tick (undercut allowed; can''t bid above the issuer''s ceiling). Drives the lowest_price auto-award criterion.';
COMMENT ON COLUMN shipping_contract_bids.offered_term_ticks IS
  'Bidder''s offered delivery commitment. Must be > 0 and ≤ contract.term_ticks (faster-than-asked allowed; can''t commit longer than the issuer''s ceiling). Drives the fastest_delivery auto-award criterion.';
COMMENT ON COLUMN shipping_contract_bids.bidder_route_risk_snapshot IS
  'Bidder''s corp_route_risk frozen at bid time. Drives the lowest_risk auto-award criterion. Snapshotted to prevent a Strategic Action play between bid and award from gaming the criterion.';


-- ══════════════════════════════════════════════════════════════
-- 2. place_shipping_bid RPC
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION place_shipping_bid(
    p_contract_id              UUID,
    p_bidder_faction_id        UUID,
    p_offered_revenue_per_tick BIGINT,
    p_offered_term_ticks       INT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
    v_user        UUID := auth.uid();
    v_bidder      factions%ROWTYPE;
    v_contract    shipping_contracts%ROWTYPE;
    v_tick        INT;
    v_existing    UUID;
    v_bid_id      UUID;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    -- Caller owns the bidder corp.
    SELECT * INTO v_bidder FROM factions WHERE id = p_bidder_faction_id;
    IF v_bidder.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Carrier not found');
    END IF;
    IF v_bidder.id <> v_user AND v_bidder.linked_user_id IS DISTINCT FROM v_user THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this corp');
    END IF;
    IF v_bidder.faction_type <> 'corporation' OR v_bidder.corp_sector <> 'Shipping' THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Only Shipping corporations can bid on contracts');
    END IF;

    -- Contract exists, open, and bid window not yet closed.
    SELECT * INTO v_contract FROM shipping_contracts WHERE id = p_contract_id;
    IF v_contract.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Contract not found');
    END IF;
    IF v_contract.status <> 'open' THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Contract is %s, no longer accepting bids', v_contract.status));
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No active shard');
    END IF;
    IF v_contract.expires_at_tick <= v_tick THEN
        RETURN jsonb_build_object('success', false, 'error', 'Bid window has closed');
    END IF;

    -- Stat gates. corp_freighters / corp_fleet_health / corp_route_risk
    -- come from 20260609_shipping_operations_seed.
    IF COALESCE(v_bidder.corp_freighters, 0) < v_contract.freighters_required THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Insufficient freighters: contract requires %s, you have %s',
                v_contract.freighters_required, v_bidder.corp_freighters));
    END IF;
    IF v_contract.min_fleet_health IS NOT NULL
       AND COALESCE(v_bidder.corp_fleet_health, 0) < v_contract.min_fleet_health THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Fleet Health below minimum: contract requires ≥ %s, you are at %s',
                v_contract.min_fleet_health, v_bidder.corp_fleet_health));
    END IF;
    IF v_contract.max_route_risk IS NOT NULL
       AND COALESCE(v_bidder.corp_route_risk, 0) > v_contract.max_route_risk THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Route Risk too high: contract requires ≤ %s, you are at %s',
                v_contract.max_route_risk, v_bidder.corp_route_risk));
    END IF;

    -- Offered terms must be positive and ≤ contract's posted ceilings
    -- (undercut allowed in either dimension; can't bid worse-than-asked).
    IF p_offered_revenue_per_tick IS NULL OR p_offered_revenue_per_tick <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Offered revenue/tick must be > 0');
    END IF;
    IF p_offered_revenue_per_tick > v_contract.revenue_per_tick THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Offered revenue/tick exceeds contract ceiling of $%s',
                to_char(v_contract.revenue_per_tick, 'FM999,999,999,999')));
    END IF;
    IF p_offered_term_ticks IS NULL OR p_offered_term_ticks <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Offered term must be > 0 ticks');
    END IF;
    IF p_offered_term_ticks > v_contract.term_ticks THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Offered term exceeds contract ceiling of %s ticks', v_contract.term_ticks));
    END IF;

    -- One-shot guard. UNIQUE(contract_id, bidder_faction_id) on the
    -- table catches this too; the explicit check produces a friendlier
    -- error message.
    SELECT id INTO v_existing FROM shipping_contract_bids
     WHERE contract_id = p_contract_id AND bidder_faction_id = p_bidder_faction_id;
    IF v_existing IS NOT NULL THEN
        RETURN jsonb_build_object('success', false,
            'error', 'You already bid on this contract — one bid per carrier per contract');
    END IF;

    INSERT INTO shipping_contract_bids (
        contract_id, bidder_faction_id,
        offered_revenue_per_tick, offered_term_ticks, bidder_route_risk_snapshot,
        status, expires_at_tick, created_at_tick
    ) VALUES (
        p_contract_id, p_bidder_faction_id,
        p_offered_revenue_per_tick, p_offered_term_ticks,
        ROUND(COALESCE(v_bidder.corp_route_risk, 0)::numeric, 2),
        'pending', v_contract.expires_at_tick, v_tick
    ) RETURNING id INTO v_bid_id;

    RETURN jsonb_build_object(
        'success',          true,
        'bid_id',           v_bid_id,
        'contract_id',      p_contract_id,
        'expires_at_tick',  v_contract.expires_at_tick
    );
END;
$func$;

GRANT EXECUTE ON FUNCTION place_shipping_bid(UUID, UUID, BIGINT, INT) TO authenticated;

COMMENT ON FUNCTION place_shipping_bid(UUID, UUID, BIGINT, INT) IS
    'Carrier corp bids on a shipping_contracts row. Validates ownership, Shipping sector, contract open + within bid window, freighters/fleet_health/route_risk stat gates, offered_revenue ≤ contract ceiling, offered_term ≤ contract ceiling. Snapshots bidder''s corp_route_risk so a later Strategic Action can''t game the lowest_risk auto-award. Strict one-shot per (contract, carrier) via UNIQUE.';


NOTIFY pgrst, 'reload schema';
