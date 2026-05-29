-- ═══════════════════════════════════════════════════════════════════════════════
-- SHIPPING — bids ALWAYS require Minister of Trade acceptance (no auto-fill)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Behavior change: every bid on a trade-agreement shipping contract now
-- requires explicit Minister of Trade acceptance via accept_shipping_bid
-- before it can fill slots. The 3-tick auto-fill (BIDDING_WINDOW_TICKS) is
-- retired — contracts with no accepted bid stay unfilled indefinitely,
-- until the minister acts.
--
-- This inverts the 20270389 design (which auto-filled after 3 ticks unless
-- any bid was manually_accepted). The minister is now the *only* path to
-- filling a contract — auto-fill no longer exists.
--
-- Two functions move in lockstep:
--
--   1. shipping_contract_winners — drops the dual-mode CTE; the WHERE now
--      always requires p.manually_accepted. The helper returns winners
--      *only* from the accepted set; if nothing is accepted, the helper
--      returns nothing and the allocator no-ops on the contract.
--   2. process_trade_agreement_shipping_multiwinner — drops the
--      BIDDING_WINDOW_TICKS guard. Contracts with no accepted bids are
--      skipped early; contracts with accepted bids fill from them
--      cheapest-first (rank logic unchanged, lives in the helper).
--
-- IMPORTANT — operational note: this is a real behavior change. ANY
-- existing trade-agreement contract whose minister hasn't accepted a
-- specific bid will stop filling the moment this migration lands. The
-- minister has to log in and Accept each bid through the diplomacy UI
-- (renders inline on the agreement view via _renderMinisterBidReview).
-- No bid backfill is done — that would silently "accept" bids the
-- minister never explicitly approved, defeating the design.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

COMMENT ON COLUMN public.shipping_contract_bids.manually_accepted IS
    'TRUE when the importing nation''s Minister of Trade has explicitly accepted this bid via accept_shipping_bid. The allocator fills ONLY from accepted bids — contracts with no accepted bid stay unfilled indefinitely. Mutex with vetoed: accept_shipping_bid clears vetoed, veto_shipping_bid clears manually_accepted. (Was dual-mode in 20270389; 20270390 made acceptance always required.)';

-- ── 1. shipping_contract_winners — always-manual filter ──────────────
-- Drops the `mode` CTE entirely. The valid CTE now requires
-- p.manually_accepted in every case. Output shape, ordering, and
-- 3-units-per-freighter math are all unchanged.
CREATE OR REPLACE FUNCTION public.shipping_contract_winners(p_contract_ids uuid[])
RETURNS TABLE (
    contract_id     uuid,
    bid_id          uuid,
    bidder_corp_id  uuid,
    corp_name       text,
    freighters      int,
    bid_rate        numeric,
    units_won       int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    WITH pend AS (
        SELECT b.contract_id, b.id AS bid_id, b.bidder_corp_id,
               COALESCE(b.freighters_allocated, 0) AS freighters,
               b.bid_rate, b.applied_at_tick,
               COALESCE(b.vetoed, false)            AS vetoed,
               COALESCE(b.manually_accepted, false) AS manually_accepted,
               CASE WHEN b.bid_rate IS NOT NULL THEN b.bid_rate::numeric
                    WHEN COALESCE(b.freighters_allocated, 0) > 0
                         THEN b.offered_revenue_per_tick::numeric / b.freighters_allocated::numeric
                    ELSE 1e18 END AS eff_rate
          FROM shipping_contract_bids b
         WHERE b.contract_id = ANY(p_contract_ids) AND b.status = 'pending'
    ),
    valid AS (
        SELECT p.contract_id, p.bid_id,
               COALESCE(SUM(p.freighters * 3) OVER (
                   PARTITION BY p.contract_id
                   ORDER BY p.eff_rate ASC, p.applied_at_tick ASC, p.bid_id ASC
                   ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING), 0) AS units_ahead
          FROM pend p
         WHERE p.eff_rate > 0 AND p.eff_rate < 1e18 AND p.freighters > 0
           AND NOT p.vetoed
           AND p.manually_accepted          -- ← 20270390: always-manual filter
    )
    SELECT p.contract_id, p.bid_id, p.bidder_corp_id,
           ec.name AS corp_name,
           p.freighters, p.bid_rate,
           COALESCE(LEAST(p.freighters * 3,
                          GREATEST(0, sc.volume_required - v.units_ahead)), 0)::int AS units_won
      FROM pend p
      JOIN entrepreneur_corps ec ON ec.id = p.bidder_corp_id
      JOIN shipping_contracts sc ON sc.id = p.contract_id
      LEFT JOIN valid v ON v.bid_id = p.bid_id;
$$;

REVOKE EXECUTE ON FUNCTION public.shipping_contract_winners(uuid[]) FROM PUBLIC, anon, authenticated;
-- Outer SECURITY DEFINER RPCs invoke it as the function owner.

-- ── 2. process_trade_agreement_shipping_multiwinner — drop the window ──
-- Body verbatim from 20270389 except the BIDDING_WINDOW_TICKS guard is
-- replaced with an unconditional "no accepted bid → skip this contract"
-- early-out. The 3-tick auto-fill grace period is gone; if the minister
-- hasn't acted, the contract sits idle until they do.
CREATE OR REPLACE FUNCTION public.process_trade_agreement_shipping_multiwinner(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    RAW_PER_ABSTRACT      constant numeric := 1000000;
    v_tick                int;
    v_contract            RECORD;
    v_bid                 RECORD;
    v_demand              int;
    v_remaining           int;
    v_rate                numeric;
    v_units               int;
    v_payout              bigint;
    v_total_payout        bigint;
    v_buyer_budget_a      numeric;
    v_buyer_budget_r      numeric;
    v_routes_active       int := 0;
    v_routes_missed       int := 0;
    v_total_paid          bigint := 0;
    v_slots_filled        int := 0;
    v_slots_demanded      int := 0;
    v_payouts             jsonb;
    v_has_manual          boolean;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, p_tick, 0);

    FOR v_contract IN
        SELECT id, nation_id, created_tick,
               COALESCE(volume_required, 0) AS demand,
               COALESCE(total_paid, 0)      AS total_paid_so_far,
               COALESCE(consecutive_missed_payments, 0) AS prior_misses,
               last_payment_tick
          FROM shipping_contracts
         WHERE status = 'open'
           AND trade_agreement_id IS NOT NULL
         FOR UPDATE
    LOOP
        v_demand := v_contract.demand;
        v_slots_demanded := v_slots_demanded + v_demand;
        IF v_demand <= 0 THEN CONTINUE; END IF;

        IF v_contract.last_payment_tick IS NOT NULL
           AND v_contract.last_payment_tick = v_tick THEN
            CONTINUE;
        END IF;

        -- 20270390: minister must explicitly accept at least one bid. No
        -- auto-fill after the bidding window — that's the whole point of
        -- this migration. If nothing is accepted, skip the contract.
        SELECT EXISTS(
            SELECT 1 FROM shipping_contract_bids
             WHERE contract_id = v_contract.id
               AND status = 'pending'
               AND COALESCE(manually_accepted, false) = true
        ) INTO v_has_manual;
        IF NOT v_has_manual THEN
            UPDATE shipping_contracts
               SET last_tick_units_filled = 0, last_filled_tick = v_tick, updated_at = now()
             WHERE id = v_contract.id;
            CONTINUE;
        END IF;

        v_remaining    := v_demand;
        v_total_payout := 0;
        v_payouts      := '[]'::jsonb;

        -- Rank-and-fill from the helper. The helper now requires
        -- manually_accepted on every winner (see 20270390 §1) — same
        -- ordering, same 3-unit capacity math as the view RPCs.
        WITH winners AS (
            SELECT bid_id, bidder_corp_id, units_won, bid_rate,
                   (bid_rate * units_won)::bigint AS payout
              FROM shipping_contract_winners(ARRAY[v_contract.id])
             WHERE units_won > 0
        ),
        bidders AS (
            SELECT w.bid_id, w.bidder_corp_id, w.units_won, w.payout,
                   b.bidder_faction_id
              FROM winners w
              JOIN shipping_contract_bids b ON b.id = w.bid_id
        )
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
                   'bid_id',            bid_id,
                   'bidder_faction_id', bidder_faction_id,
                   'bidder_corp_id',    bidder_corp_id,
                   'units',             units_won,
                   'payout',            payout
               )), '[]'::jsonb),
               COALESCE(SUM(payout), 0)::bigint,
               COALESCE(SUM(units_won), 0)::int
          INTO v_payouts, v_total_payout, v_units
          FROM bidders;
        v_remaining := v_demand - v_units;

        IF v_total_payout <= 0 THEN
            UPDATE shipping_contracts
               SET last_tick_units_filled = 0, last_filled_tick = v_tick, updated_at = now()
             WHERE id = v_contract.id;
            CONTINUE;
        END IF;

        SELECT COALESCE(budget, 0) INTO v_buyer_budget_a
          FROM nations WHERE id = v_contract.nation_id;
        v_buyer_budget_r := v_buyer_budget_a * RAW_PER_ABSTRACT;
        IF v_buyer_budget_r < v_total_payout THEN
            UPDATE shipping_contracts
               SET consecutive_missed_payments = v_contract.prior_misses + 1,
                   last_tick_units_filled = 0, last_filled_tick = v_tick, updated_at = now()
             WHERE id = v_contract.id;
            v_routes_missed := v_routes_missed + 1;
            CONTINUE;
        END IF;

        UPDATE nations
           SET budget = (v_buyer_budget_r - v_total_payout) / RAW_PER_ABSTRACT
         WHERE id = v_contract.nation_id;

        FOR v_bid IN
            SELECT (e->>'bid_id')::uuid              AS bid_id,
                   NULLIF(e->>'bidder_faction_id','')::uuid AS bidder_faction_id,
                   NULLIF(e->>'bidder_corp_id','')::uuid    AS bidder_corp_id,
                   (e->>'units')::int                AS units,
                   (e->>'payout')::bigint            AS payout
              FROM jsonb_array_elements(v_payouts) e
        LOOP
            IF v_bid.bidder_corp_id IS NOT NULL THEN
                UPDATE entrepreneur_corps
                   SET treasury_cash = COALESCE(treasury_cash, 0) + v_bid.payout, updated_at = now()
                 WHERE id = v_bid.bidder_corp_id;
            ELSIF v_bid.bidder_faction_id IS NOT NULL THEN
                UPDATE factions
                   SET corp_cash_reserves = COALESCE(corp_cash_reserves, 0) + v_bid.payout
                 WHERE id = v_bid.bidder_faction_id;
            END IF;
            v_slots_filled := v_slots_filled + v_bid.units;
        END LOOP;

        UPDATE shipping_contracts
           SET last_payment_tick = v_tick,
               total_paid = v_contract.total_paid_so_far + v_total_payout,
               consecutive_missed_payments = 0,
               last_tick_units_filled = v_demand - v_remaining,
               last_filled_tick = v_tick, updated_at = now()
         WHERE id = v_contract.id;

        v_routes_active := v_routes_active + 1;
        v_total_paid    := v_total_paid + v_total_payout;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'tick', v_tick,
        'routes_active', v_routes_active, 'routes_missed', v_routes_missed,
        'slots_filled', v_slots_filled, 'slots_demanded', v_slots_demanded,
        'total_paid', v_total_paid);
END;
$$;
GRANT EXECUTE ON FUNCTION public.process_trade_agreement_shipping_multiwinner(int) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
