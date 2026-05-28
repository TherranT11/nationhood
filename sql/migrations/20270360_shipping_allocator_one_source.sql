-- ════════════════════════════════════════════════════════════════════
-- SHIPPING — allocator delegates ranking to the helper (one source)
-- ════════════════════════════════════════════════════════════════════
-- Follow-up to 20270359. That migration consolidated the two READ paths
-- (entrepreneur dashboard + nation trade-agreement card) onto the
-- shipping_contract_winners helper, but left process_trade_agreement_
-- shipping_multiwinner with its own inline ranking loop. Three issues to
-- fix in lockstep:
--
--   1. The helper was missing the allocator's vetoed-bid exclusion.
--      Result: get_shipping_routes_for_corp and get_trade_agreement_
--      shipping were giving fill credit to vetoed bids — a different
--      desync of the same flavour the helper was supposed to eliminate.
--   2. The 20270359 refactor of get_shipping_routes_for_corp dropped
--      'vetoed' from the my_bid payload because the helper doesn't
--      surface it. The carrier UI lost the "you got vetoed" breadcrumb.
--   3. The allocator's own ranking loop was the last in-tree copy of
--      the rank-and-fill algorithm. With every payment dispatched
--      through the helper, the algorithm now lives in exactly one place.
--
-- Fix:
--
--   1. Helper: pend CTE adds AND NOT COALESCE(b.vetoed, false). Vetoed
--      bids never appear in helper output — they are excluded from
--      ranking, counts, and units_won everywhere.
--
--   2. get_shipping_routes_for_corp: my_bid_raw CTE fetches the caller's
--      OWN bid directly (so the vetoed flag is visible even when the
--      helper excludes it from winners). Output JSON shape restored to
--      20270238 (vetoed back on my_bid). Bidders_list / counts / mine
--      continue to read through the helper.
--
--   3. process_trade_agreement_shipping_multiwinner: drops the inline
--      ORDER BY eff_rate ASC bid loop and the rate-derivation that fed
--      it; replaces them with a single set-based SELECT against
--      shipping_contract_winners. The payment-dispatch loop is
--      unchanged: same-tick guard, buyer-budget check, bankruptcy
--      counter, entrepreneur_corps treasury credit, contract
--      bookkeeping. The pre-corp-cull faction-direct fallback
--      (ELSIF v_bid.bidder_faction_id IS NOT NULL) is removed —
--      entrepreneur_place_shipping_bid is the only live creation path
--      and writes bidder_corp_id only (20270242 dropped the faction-
--      direct creator).
--
-- After this, the rank-and-fill algorithm exists in exactly ONE place:
-- shipping_contract_winners. Allocator and both views all agree by
-- construction.
--
-- Idempotent (CREATE OR REPLACE).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Helper — exclude vetoed bids ──────────────────────────────────
-- Output signature and ranking unchanged from 20270359 apart from the
-- new vetoed exclusion in the pend CTE.
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
               CASE WHEN b.bid_rate IS NOT NULL THEN b.bid_rate::numeric
                    WHEN COALESCE(b.freighters_allocated, 0) > 0
                         THEN b.offered_revenue_per_tick::numeric / b.freighters_allocated::numeric
                    ELSE 1e18 END AS eff_rate
          FROM shipping_contract_bids b
         WHERE b.contract_id = ANY(p_contract_ids)
           AND b.status = 'pending'
           AND NOT COALESCE(b.vetoed, false)
    ),
    valid AS (
        SELECT contract_id, bid_id,
               COALESCE(SUM(freighters) OVER (
                   PARTITION BY contract_id
                   ORDER BY eff_rate ASC, applied_at_tick ASC, bid_id ASC
                   ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING), 0) AS units_ahead
          FROM pend
         WHERE eff_rate > 0 AND eff_rate < 1e18 AND freighters > 0
    )
    SELECT p.contract_id, p.bid_id, p.bidder_corp_id,
           ec.name AS corp_name,
           p.freighters, p.bid_rate,
           COALESCE(LEAST(p.freighters,
                          GREATEST(0, sc.volume_required - v.units_ahead)), 0)::int AS units_won
      FROM pend p
      JOIN entrepreneur_corps ec ON ec.id = p.bidder_corp_id
      JOIN shipping_contracts sc ON sc.id = p.contract_id
      LEFT JOIN valid v ON v.bid_id = p.bid_id;
$$;

REVOKE EXECUTE ON FUNCTION public.shipping_contract_winners(uuid[]) FROM PUBLIC, anon, authenticated;


-- ── 2. Entrepreneur view — restore my_bid.vetoed via separate fetch ──
-- The helper now excludes vetoed bids, but a vetoed carrier still wants
-- to see they were dropped. my_bid_raw reads the caller's bid directly
-- and supplies the vetoed flag.
CREATE OR REPLACE FUNCTION public.get_shipping_routes_for_corp(p_corp_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_fac    factions%ROWTYPE;
    v_corp   entrepreneur_corps%ROWTYPE;
    v_result jsonb;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id;
    IF v_corp.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;
    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL OR v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    WITH open_routes AS (
        SELECT id, name, commodity, COALESCE(volume_required, 0) AS demand,
               origin_port, destination_port, last_tick_units_filled, last_filled_tick, created_at_tick
          FROM shipping_contracts
         WHERE status = 'open' AND trade_agreement_id IS NOT NULL
    ),
    winners AS (
        SELECT * FROM shipping_contract_winners(ARRAY(SELECT id FROM open_routes))
    ),
    counts AS (
        SELECT contract_id, COUNT(*) AS bidder_count FROM winners GROUP BY contract_id
    ),
    bidders_list AS (
        SELECT contract_id,
               jsonb_agg(
                   jsonb_build_object('corp_name', corp_name, 'freighters', freighters)
                   ORDER BY freighters DESC, bid_id
               ) AS bidder_list
          FROM winners
         WHERE freighters > 0
         GROUP BY contract_id
    ),
    mine AS (
        SELECT contract_id, SUM(units_won)::int AS won_units
          FROM winners
         WHERE bidder_corp_id = p_corp_id
         GROUP BY contract_id
    ),
    -- Caller's own bid pulled directly so the vetoed flag is preserved
    -- (the helper excludes vetoed bids from its output).
    my_bid_raw AS (
        SELECT b.contract_id, b.id AS bid_id,
               COALESCE(b.freighters_allocated, 0) AS freighters,
               b.bid_rate, COALESCE(b.vetoed, false) AS vetoed
          FROM shipping_contract_bids b
          JOIN open_routes r ON r.id = b.contract_id
         WHERE b.status = 'pending' AND b.bidder_corp_id = p_corp_id
    )
    SELECT jsonb_agg(jsonb_build_object(
               'id', o.id, 'name', o.name, 'commodity', o.commodity,
               'volume_required', o.demand,
               'origin_port', o.origin_port, 'destination_port', o.destination_port,
               'last_tick_units_filled', o.last_tick_units_filled, 'last_filled_tick', o.last_filled_tick,
               'bidder_count', COALESCE(c.bidder_count, 0),
               'bidders', COALESCE(bd.bidder_list, '[]'::jsonb),
               'my_bid', CASE WHEN mb.bid_id IS NOT NULL
                              THEN jsonb_build_object('id', mb.bid_id, 'freighters', mb.freighters,
                                                      'bid_rate', mb.bid_rate, 'vetoed', mb.vetoed)
                              ELSE NULL END,
               'my_winning_units', COALESCE(m.won_units, 0)
             ) ORDER BY o.created_at_tick DESC NULLS LAST, o.id)
      INTO v_result
      FROM open_routes o
      LEFT JOIN counts        c  ON c.contract_id  = o.id
      LEFT JOIN bidders_list  bd ON bd.contract_id = o.id
      LEFT JOIN mine          m  ON m.contract_id  = o.id
      LEFT JOIN my_bid_raw    mb ON mb.contract_id = o.id;

    RETURN jsonb_build_object('success', true, 'routes', COALESCE(v_result, '[]'::jsonb));
END; $$;

GRANT EXECUTE ON FUNCTION public.get_shipping_routes_for_corp(uuid) TO authenticated;


-- ── 3. Allocator — payment loop only, ranking delegated to helper ────
-- Same per-contract outer loop, same payment side effects (same-tick
-- guard, buyer-budget check, bankruptcy counter, entrepreneur_corps
-- treasury credit, contract bookkeeping). The inline rank-and-fill loop
-- is replaced by one set-based SELECT against the helper.
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
    v_units_taken     int;
    v_total_payout    bigint;
    v_buyer_budget_a  numeric;
    v_buyer_budget_r  numeric;
    v_routes_active   int := 0;
    v_routes_missed   int := 0;
    v_total_paid      bigint := 0;
    v_slots_filled    int := 0;
    v_slots_demanded  int := 0;
    v_payouts         jsonb;
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

        IF v_contract.last_payment_tick IS NOT NULL
           AND v_contract.last_payment_tick = v_tick THEN
            CONTINUE;
        END IF;

        -- Single source: rank-and-fill comes from the helper. Same
        -- ordering (eff_rate ASC, applied_at_tick ASC, bid_id ASC),
        -- same veto exclusion, same units_won math as both view RPCs.
        WITH winners AS (
            SELECT bid_id, bidder_corp_id, units_won, bid_rate,
                   (bid_rate * units_won)::bigint AS payout
              FROM shipping_contract_winners(ARRAY[v_contract.id])
             WHERE units_won > 0 AND bid_rate IS NOT NULL AND bid_rate > 0
        )
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
                   'bid_id',         bid_id,
                   'bidder_corp_id', bidder_corp_id,
                   'units',          units_won,
                   'payout',         payout
               )), '[]'::jsonb),
               COALESCE(SUM(payout), 0)::bigint,
               COALESCE(SUM(units_won), 0)::int
          INTO v_payouts, v_total_payout, v_units_taken
          FROM winners
         WHERE payout > 0;

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

        -- Payment dispatch. entrepreneur_place_shipping_bid is the only
        -- live creator and writes bidder_corp_id only, so this no longer
        -- branches on bidder_faction_id (legacy creator dropped by 20270242).
        FOR v_bid IN
            SELECT NULLIF(e->>'bidder_corp_id','')::uuid AS bidder_corp_id,
                   (e->>'units')::int                AS units,
                   (e->>'payout')::bigint            AS payout
              FROM jsonb_array_elements(v_payouts) e
        LOOP
            IF v_bid.bidder_corp_id IS NULL THEN CONTINUE; END IF;
            UPDATE entrepreneur_corps
               SET treasury_cash = COALESCE(treasury_cash, 0) + v_bid.payout, updated_at = now()
             WHERE id = v_bid.bidder_corp_id;
            v_slots_filled := v_slots_filled + v_bid.units;
        END LOOP;

        UPDATE shipping_contracts
           SET last_payment_tick = v_tick,
               total_paid = v_contract.total_paid_so_far + v_total_payout,
               consecutive_missed_payments = 0,
               last_tick_units_filled = v_units_taken,
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

-- ── ROLLBACK ──
-- Re-apply 20270359 (helper without veto exclusion + my_bid without vetoed)
-- and 20270238 (allocator with inline ranking + faction-direct fallback):
-- they together restore the pre-20270360 state.
