-- ════════════════════════════════════════════════════════════════════
-- SHIPPING BID VETO — Minister of Trade can ban a carrier from a route
-- ════════════════════════════════════════════════════════════════════
-- Manual control without the stall: the per-tick auction keeps auto-filling
-- cheapest-first, but the importing nation's Minister of Trade can VETO any
-- carrier's bid on one of their trade-agreement routes. Vetoed bids are
-- excluded from the fill; the cheapest of the rest still wins. Routes never
-- stall (no acceptance required) — vetoing is optional agency, used to drop a
-- carrier the minister distrusts (judged on name + ent_reputation, surfaced
-- by get_route_bids_for_minister).
--
--   1. shipping_contract_bids.vetoed — minister flag; default false.
--   2. process_trade_agreement_shipping_multiwinner — skips vetoed bids
--      (verbatim copy of the 20270209 allocator + one WHERE clause).
--   3. get_shipping_routes_for_corp — carrier preview excludes vetoed bids
--      from the allocation and surfaces my_bid.vetoed so a banned carrier
--      sees it was dropped.
--   4. veto_shipping_bid(bid, on) — MoT-of-the-route's-nation only.
--   5. get_route_bids_for_minister(nation) — MoT-only review of every
--      pending bid on the nation's routes (carrier, rate, freighters,
--      ent_reputation, vetoed). Bypasses the sealed-bid RLS (the buyer's
--      minister is entitled to see the offers; rivals still can't).
--
-- Idempotent (ADD COLUMN IF NOT EXISTS / CREATE OR REPLACE).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.shipping_contract_bids
    ADD COLUMN IF NOT EXISTS vetoed boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.shipping_contract_bids.vetoed IS
    'TRUE when the importing nation''s Minister of Trade has banned this carrier from the route. Set via veto_shipping_bid. Vetoed bids are excluded from the per-tick fill but stay pending (the minister can un-veto). Persists across re-bids.';

-- ── 1. Allocator — exclude vetoed bids (copy of 20270209 + one clause) ──
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

        v_remaining    := v_demand;
        v_total_payout := 0;
        v_payouts      := '[]'::jsonb;

        FOR v_bid IN
            SELECT id, bidder_faction_id, bidder_corp_id,
                   COALESCE(freighters_allocated, 0) AS freighters,
                   bid_rate, offered_revenue_per_tick, applied_at_tick
              FROM shipping_contract_bids
             WHERE contract_id = v_contract.id
               AND status = 'pending'
               AND NOT COALESCE(vetoed, false)   -- ← veto: minister-banned carriers can't fill
             ORDER BY
                 CASE
                     WHEN bid_rate IS NOT NULL THEN bid_rate::numeric
                     WHEN COALESCE(freighters_allocated, 0) > 0 THEN
                         offered_revenue_per_tick::numeric / freighters_allocated::numeric
                     ELSE 1e18
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

-- ── 2. Carrier preview — exclude vetoed bids, surface my own veto ───
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
    pend AS (
        SELECT b.contract_id, b.id AS bid_id, b.bidder_corp_id,
               COALESCE(b.freighters_allocated, 0) AS freighters, b.bid_rate, b.applied_at_tick,
               COALESCE(b.vetoed, false) AS vetoed,
               CASE WHEN b.bid_rate IS NOT NULL THEN b.bid_rate::numeric
                    WHEN COALESCE(b.freighters_allocated, 0) > 0
                         THEN b.offered_revenue_per_tick::numeric / b.freighters_allocated::numeric
                    ELSE 1e18 END AS eff_rate
          FROM shipping_contract_bids b
          JOIN open_routes r ON r.id = b.contract_id
         WHERE b.status = 'pending'
    ),
    counts AS (  -- competition signal = non-vetoed pending bids
        SELECT contract_id, COUNT(*) AS bidder_count FROM pend WHERE NOT vetoed GROUP BY contract_id
    ),
    ranked AS (  -- valid, non-vetoed bids only
        SELECT contract_id, bidder_corp_id, freighters,
               COALESCE(SUM(freighters) OVER (
                   PARTITION BY contract_id
                   ORDER BY eff_rate ASC, applied_at_tick ASC, bid_id ASC
                   ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING), 0) AS units_ahead
          FROM pend
         WHERE eff_rate > 0 AND eff_rate < 1e18 AND freighters > 0 AND NOT vetoed
    ),
    mine AS (
        SELECT rk.contract_id,
               LEAST(rk.freighters, GREATEST(0, o.demand - rk.units_ahead)) AS won_units
          FROM ranked rk JOIN open_routes o ON o.id = rk.contract_id
         WHERE rk.bidder_corp_id = p_corp_id
    ),
    my_bid AS (
        SELECT contract_id, bid_id, freighters, bid_rate, vetoed FROM pend WHERE bidder_corp_id = p_corp_id
    )
    SELECT jsonb_agg(jsonb_build_object(
               'id', o.id, 'name', o.name, 'commodity', o.commodity,
               'volume_required', o.demand,
               'origin_port', o.origin_port, 'destination_port', o.destination_port,
               'last_tick_units_filled', o.last_tick_units_filled, 'last_filled_tick', o.last_filled_tick,
               'bidder_count', COALESCE(c.bidder_count, 0),
               'my_bid', CASE WHEN mb.bid_id IS NOT NULL
                              THEN jsonb_build_object('id', mb.bid_id, 'freighters', mb.freighters,
                                                      'bid_rate', mb.bid_rate, 'vetoed', mb.vetoed)
                              ELSE NULL END,
               'my_winning_units', COALESCE(m.won_units, 0)
             ) ORDER BY o.created_at_tick DESC NULLS LAST, o.id)
      INTO v_result
      FROM open_routes o
      LEFT JOIN counts c   ON c.contract_id = o.id
      LEFT JOIN mine m     ON m.contract_id = o.id
      LEFT JOIN my_bid mb  ON mb.contract_id = o.id;

    RETURN jsonb_build_object('success', true, 'routes', COALESCE(v_result, '[]'::jsonb));
END; $$;
GRANT EXECUTE ON FUNCTION public.get_shipping_routes_for_corp(uuid) TO authenticated;

-- ── 3. veto_shipping_bid — Minister of Trade of the route's nation ──
CREATE OR REPLACE FUNCTION public.veto_shipping_bid(p_bid_id uuid, p_vetoed boolean)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_nation uuid;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;

    SELECT c.nation_id INTO v_nation
      FROM shipping_contract_bids b
      JOIN shipping_contracts c ON c.id = b.contract_id
     WHERE b.id = p_bid_id AND c.trade_agreement_id IS NOT NULL;
    IF v_nation IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'bid_not_found'); END IF;

    IF NOT EXISTS (
        SELECT 1 FROM ministries m JOIN factions f ON f.id = m.party_id
         WHERE m.nation_id = v_nation AND m.ministry_key = 'trade' AND m.is_active = TRUE
           AND (f.id = v_uid OR f.linked_user_id = v_uid)
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_trade_minister');
    END IF;

    UPDATE shipping_contract_bids SET vetoed = COALESCE(p_vetoed, true), updated_at = now()
     WHERE id = p_bid_id;
    RETURN jsonb_build_object('success', true, 'bid_id', p_bid_id, 'vetoed', COALESCE(p_vetoed, true));
END; $$;
GRANT EXECUTE ON FUNCTION public.veto_shipping_bid(uuid, boolean) TO authenticated;

-- ── 4. get_route_bids_for_minister — MoT review of all bids on the nation's routes ──
CREATE OR REPLACE FUNCTION public.get_route_bids_for_minister(p_nation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_result jsonb;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;
    IF NOT EXISTS (
        SELECT 1 FROM ministries m JOIN factions f ON f.id = m.party_id
         WHERE m.nation_id = p_nation_id AND m.ministry_key = 'trade' AND m.is_active = TRUE
           AND (f.id = v_uid OR f.linked_user_id = v_uid)
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_trade_minister');
    END IF;

    SELECT jsonb_agg(route ORDER BY (route->>'created_at_tick')::int DESC NULLS LAST)
      INTO v_result
      FROM (
        SELECT jsonb_build_object(
                 'id', c.id, 'name', c.name, 'commodity', c.commodity,
                 'volume_required', COALESCE(c.volume_required, 0),
                 'origin_port', c.origin_port, 'destination_port', c.destination_port,
                 'created_at_tick', c.created_at_tick,
                 'bids', COALESCE((
                     SELECT jsonb_agg(jsonb_build_object(
                                'bid_id', b.id,
                                'carrier', COALESCE(ec.name, bf.faction_name, 'Carrier'),
                                'rate', CASE WHEN b.bid_rate IS NOT NULL THEN b.bid_rate
                                             WHEN COALESCE(b.freighters_allocated,0) > 0
                                                  THEN (b.offered_revenue_per_tick / b.freighters_allocated)
                                             ELSE NULL END,
                                'freighters', COALESCE(b.freighters_allocated, 0),
                                'reputation', COALESCE(bf.ent_reputation, 0),
                                'vetoed', COALESCE(b.vetoed, false))
                            ORDER BY b.bid_rate ASC NULLS LAST, b.applied_at_tick ASC)
                       FROM shipping_contract_bids b
                       LEFT JOIN entrepreneur_corps ec ON ec.id = b.bidder_corp_id
                       LEFT JOIN factions bf           ON bf.id = b.bidder_faction_id
                      WHERE b.contract_id = c.id AND b.status = 'pending'
                 ), '[]'::jsonb)
               ) AS route
          FROM shipping_contracts c
         WHERE c.nation_id = p_nation_id AND c.status = 'open' AND c.trade_agreement_id IS NOT NULL
      ) sub;

    RETURN jsonb_build_object('success', true, 'routes', COALESCE(v_result, '[]'::jsonb));
END; $$;
GRANT EXECUTE ON FUNCTION public.get_route_bids_for_minister(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- Re-apply 20270209 (allocator) + 20270237 (carrier preview) to drop the veto
-- clause, then:
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.get_route_bids_for_minister(uuid);
-- DROP FUNCTION IF EXISTS public.veto_shipping_bid(uuid, boolean);
-- ALTER TABLE public.shipping_contract_bids DROP COLUMN IF EXISTS vetoed;
-- COMMIT;
