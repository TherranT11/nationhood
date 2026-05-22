-- ════════════════════════════════════════════════════════════════════
-- SHIPPING — persist per-tick coverage on trade-agreement contracts
-- ════════════════════════════════════════════════════════════════════
-- The multi-winner allocator (process_trade_agreement_shipping_multiwinner,
-- 20270181) computes how many of a contract's volume_required units got
-- delivered each tick — but only in-memory (v_demand − v_remaining); it
-- persists only total_paid + consecutive_missed_payments. So nothing can
-- tell the IMPORTING nation "5 of 7 units/tick are being delivered" without
-- re-deriving the cheapest-first fill, which would duplicate the allocator
-- in the importer UI and the notification feed (the carrier page already
-- has one client-side mirror).
--
-- This makes coverage the one stored truth: the allocator writes
-- last_tick_units_filled (+ last_filled_tick) every tick; UI + the
-- shortfall notification just read it. No behavioural change to who wins
-- or gets paid — purely additive bookkeeping.
--
-- Coverage value by branch:
--   • delivered+paid  → last_tick_units_filled = demand − remaining
--   • no winning bids → 0 (nobody is carrying the route)
--   • payment missed  → 0 (budget gate is all-or-nothing; nothing moved)
-- last_filled_tick stamps when it was last evaluated, so a freshly-spawned
-- contract that hasn't been processed yet reads NULL (no false shortfall).
--
-- Idempotent. ADD COLUMN IF NOT EXISTS; CREATE OR REPLACE on the allocator
-- (body verbatim from 20270181 + the coverage writes).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE shipping_contracts
    ADD COLUMN IF NOT EXISTS last_tick_units_filled int,
    ADD COLUMN IF NOT EXISTS last_filled_tick       int;

COMMENT ON COLUMN shipping_contracts.last_tick_units_filled IS
    'Units/tick actually delivered on the most recent allocator run (demand − unmet). 0 when no bids covered the route or the importing nation missed payment. NULL until first processed. Read by the importer coverage notification + carrier route UI; written only by process_trade_agreement_shipping_multiwinner.';
COMMENT ON COLUMN shipping_contracts.last_filled_tick IS
    'Tick last_tick_units_filled was last evaluated. NULL = never processed (suppresses false shortfall alerts on freshly-spawned contracts).';

CREATE OR REPLACE FUNCTION public.process_trade_agreement_shipping_multiwinner(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    RAW_PER_ABSTRACT  constant numeric := 1000000;
    v_tick            int;
    v_contract        RECORD;
    v_bid             RECORD;
    v_demand          int;
    v_remaining       int;
    v_rate            numeric;
    v_units           int;
    v_payout          bigint;
    v_total_payout    bigint;
    v_buyer_budget_a  numeric;
    v_buyer_budget_r  numeric;
    v_routes_active   int := 0;
    v_routes_missed   int := 0;
    v_total_paid      bigint := 0;
    v_slots_filled    int := 0;
    v_slots_demanded  int := 0;
    v_payouts         jsonb;          -- per-route accumulator
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, p_tick, 0);

    FOR v_contract IN
        SELECT id, nation_id,
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

        -- Idempotency guard: if this contract already got paid this
        -- tick (manual rerun), skip.
        IF v_contract.last_payment_tick IS NOT NULL
           AND v_contract.last_payment_tick = v_tick THEN
            CONTINUE;
        END IF;

        v_remaining    := v_demand;
        v_total_payout := 0;
        v_payouts      := '[]'::jsonb;

        -- Walk pending bids, cheapest first.
        FOR v_bid IN
            SELECT id, bidder_faction_id, bidder_corp_id,
                   COALESCE(freighters_allocated, 0) AS freighters,
                   bid_rate, offered_revenue_per_tick, applied_at_tick
              FROM shipping_contract_bids
             WHERE contract_id = v_contract.id
               AND status = 'pending'
             ORDER BY
                 -- effective per-unit rate (NULL bid_rate → derive)
                 CASE
                     WHEN bid_rate IS NOT NULL THEN bid_rate::numeric
                     WHEN COALESCE(freighters_allocated, 0) > 0 THEN
                         offered_revenue_per_tick::numeric / freighters_allocated::numeric
                     ELSE 1e18                              -- park invalid bids at the end
                 END ASC,
                 applied_at_tick ASC, id ASC
            FOR UPDATE
        LOOP
            EXIT WHEN v_remaining <= 0;
            IF v_bid.freighters <= 0 THEN CONTINUE; END IF;

            v_rate := CASE
                WHEN v_bid.bid_rate IS NOT NULL THEN v_bid.bid_rate::numeric
                WHEN v_bid.freighters > 0 THEN
                    COALESCE(v_bid.offered_revenue_per_tick, 0)::numeric / v_bid.freighters::numeric
                ELSE NULL
            END;
            IF v_rate IS NULL OR v_rate <= 0 THEN CONTINUE; END IF;

            v_units  := LEAST(v_bid.freighters, v_remaining);
            v_payout := (v_rate * v_units)::bigint;
            IF v_payout <= 0 THEN CONTINUE; END IF;

            v_payouts := v_payouts || jsonb_build_object(
                'bid_id',            v_bid.id,
                'bidder_faction_id', v_bid.bidder_faction_id,
                'bidder_corp_id',    v_bid.bidder_corp_id,
                'units',             v_units,
                'payout',            v_payout
            );
            v_total_payout := v_total_payout + v_payout;
            v_remaining    := v_remaining - v_units;
        END LOOP;

        -- No winning bids → nobody is carrying this route this tick.
        IF v_total_payout <= 0 THEN
            UPDATE shipping_contracts
               SET last_tick_units_filled = 0,
                   last_filled_tick       = v_tick,
                   updated_at             = now()
             WHERE id = v_contract.id;
            CONTINUE;
        END IF;

        -- Importing nation's budget gate.
        SELECT COALESCE(budget, 0) INTO v_buyer_budget_a
          FROM nations WHERE id = v_contract.nation_id;
        v_buyer_budget_r := v_buyer_budget_a * RAW_PER_ABSTRACT;
        IF v_buyer_budget_r < v_total_payout THEN
            -- All-or-nothing: payment missed → nothing delivered this tick.
            UPDATE shipping_contracts
               SET consecutive_missed_payments = v_contract.prior_misses + 1,
                   last_tick_units_filled      = 0,
                   last_filled_tick            = v_tick,
                   updated_at                  = now()
             WHERE id = v_contract.id;
            v_routes_missed := v_routes_missed + 1;
            CONTINUE;
        END IF;

        -- Debit nation budget.
        UPDATE nations
           SET budget = (v_buyer_budget_r - v_total_payout) / RAW_PER_ABSTRACT
         WHERE id = v_contract.nation_id;

        -- Credit each winning bidder. JSONB array of payouts walked
        -- in insertion order; no double-credit because each entry
        -- corresponds to a distinct bid_id.
        FOR v_bid IN
            SELECT (e->>'bid_id')::uuid              AS bid_id,
                   NULLIF(e->>'bidder_faction_id','')::uuid AS bidder_faction_id,
                   NULLIF(e->>'bidder_corp_id','')::uuid    AS bidder_corp_id,
                   (e->>'units')::int                AS units,
                   (e->>'payout')::bigint            AS payout
              FROM jsonb_array_elements(v_payouts) e
        LOOP
            IF v_bid.bidder_corp_id IS NOT NULL THEN
                -- Entrepreneur winner — credit the corp's treasury,
                -- NOT the owner's party_funds. Owner extracts via
                -- dividend (when public) or go_private. Mirrors the
                -- corp-pays-for-construction rule from 20270182.
                UPDATE entrepreneur_corps
                   SET treasury_cash = COALESCE(treasury_cash, 0) + v_bid.payout,
                       updated_at    = now()
                 WHERE id = v_bid.bidder_corp_id;
            ELSIF v_bid.bidder_faction_id IS NOT NULL THEN
                UPDATE factions
                   SET corp_cash_reserves = COALESCE(corp_cash_reserves, 0) + v_bid.payout
                 WHERE id = v_bid.bidder_faction_id;
            END IF;
            v_slots_filled := v_slots_filled + v_bid.units;
        END LOOP;

        UPDATE shipping_contracts
           SET last_payment_tick           = v_tick,
               total_paid                  = v_contract.total_paid_so_far + v_total_payout,
               consecutive_missed_payments = 0,
               last_tick_units_filled      = v_demand - v_remaining,
               last_filled_tick            = v_tick,
               updated_at                  = now()
         WHERE id = v_contract.id;

        v_routes_active := v_routes_active + 1;
        v_total_paid    := v_total_paid + v_total_payout;
    END LOOP;

    RETURN jsonb_build_object(
        'success',         true,
        'tick',            v_tick,
        'routes_active',   v_routes_active,
        'routes_missed',   v_routes_missed,
        'slots_filled',    v_slots_filled,
        'slots_demanded',  v_slots_demanded,
        'total_paid',      v_total_paid
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_trade_agreement_shipping_multiwinner(int) TO authenticated;

COMMENT ON FUNCTION public.process_trade_agreement_shipping_multiwinner(int) IS
    'Per-tick multi-winner allocator for trade-agreement shipping contracts. Sorts pending bids by effective per-unit rate ASC, fills volume_required slots cheapest-first across all bids (entrepreneur + legacy). Importing nation budget pays; entrepreneur winners credited to entrepreneur_corps.treasury_cash, legacy winners to corp_cash_reserves. Now also persists last_tick_units_filled (+ last_filled_tick) every tick — delivered units on success, 0 on no-bid or missed-payment — so coverage is readable without re-deriving the fill. Bids stay pending across ticks. Idempotent within a tick via last_payment_tick.';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- Re-run the 20270181 allocator body (no coverage writes) to revert the
-- function; columns can stay (harmless) or:
-- ALTER TABLE shipping_contracts
--   DROP COLUMN IF EXISTS last_filled_tick,
--   DROP COLUMN IF EXISTS last_tick_units_filled;
