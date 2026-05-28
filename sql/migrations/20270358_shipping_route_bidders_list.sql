-- ════════════════════════════════════════════════════════════════════
-- SHIPPING — surface bidder list per open route (corp + freighters)
-- ════════════════════════════════════════════════════════════════════
-- get_shipping_routes_for_corp returned just a bidder_count, so a route
-- showed "2 bidders" with no idea who or how many freighters each had
-- committed. Add a per-route `bidders` array of {corp_name, freighters}
-- so the Open Routes UI can show competition at a glance.
--
-- Stays sealed: rivals' bid_rate is NOT included (the whole point of
-- 20270237). Freighter count is the player's commitment level, not their
-- pricing, so it's a fair strategic signal without enabling undercut races.
--
-- Body is reproduced from 20270237 with one new CTE (bidders) and one
-- extra field on the jsonb output. Everything else is verbatim.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

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
               CASE WHEN b.bid_rate IS NOT NULL THEN b.bid_rate::numeric
                    WHEN COALESCE(b.freighters_allocated, 0) > 0
                         THEN b.offered_revenue_per_tick::numeric / b.freighters_allocated::numeric
                    ELSE 1e18 END AS eff_rate
          FROM shipping_contract_bids b
          JOIN open_routes r ON r.id = b.contract_id
         WHERE b.status = 'pending'
    ),
    counts AS (
        SELECT contract_id, COUNT(*) AS bidder_count FROM pend GROUP BY contract_id
    ),
    -- Per-route bidder list: corp name + committed freighters. Rate is
    -- intentionally OMITTED to stay sealed; freighter count is the
    -- commitment signal the player wants visible without leaking pricing.
    bidders AS (
        SELECT p.contract_id,
               jsonb_agg(
                   jsonb_build_object('corp_name', ec.name, 'freighters', p.freighters)
                   ORDER BY p.freighters DESC, p.bid_id
               ) AS bidder_list
          FROM pend p
          JOIN entrepreneur_corps ec ON ec.id = p.bidder_corp_id
         WHERE p.freighters > 0
         GROUP BY p.contract_id
    ),
    ranked AS (
        SELECT contract_id, bidder_corp_id, freighters,
               COALESCE(SUM(freighters) OVER (
                   PARTITION BY contract_id
                   ORDER BY eff_rate ASC, applied_at_tick ASC, bid_id ASC
                   ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING), 0) AS units_ahead
          FROM pend
         WHERE eff_rate > 0 AND eff_rate < 1e18 AND freighters > 0
    ),
    mine AS (
        SELECT rk.contract_id,
               LEAST(rk.freighters, GREATEST(0, o.demand - rk.units_ahead)) AS won_units
          FROM ranked rk JOIN open_routes o ON o.id = rk.contract_id
         WHERE rk.bidder_corp_id = p_corp_id
    ),
    my_bid AS (
        SELECT contract_id, bid_id, freighters, bid_rate FROM pend WHERE bidder_corp_id = p_corp_id
    )
    SELECT jsonb_agg(jsonb_build_object(
               'id', o.id, 'name', o.name, 'commodity', o.commodity,
               'volume_required', o.demand,
               'origin_port', o.origin_port, 'destination_port', o.destination_port,
               'last_tick_units_filled', o.last_tick_units_filled, 'last_filled_tick', o.last_filled_tick,
               'bidder_count', COALESCE(c.bidder_count, 0),
               'bidders', COALESCE(bd.bidder_list, '[]'::jsonb),
               'my_bid', CASE WHEN mb.bid_id IS NOT NULL
                              THEN jsonb_build_object('id', mb.bid_id, 'freighters', mb.freighters, 'bid_rate', mb.bid_rate)
                              ELSE NULL END,
               'my_winning_units', COALESCE(m.won_units, 0)
             ) ORDER BY o.created_at_tick DESC NULLS LAST, o.id)
      INTO v_result
      FROM open_routes o
      LEFT JOIN counts c   ON c.contract_id = o.id
      LEFT JOIN bidders bd ON bd.contract_id = o.id
      LEFT JOIN mine m     ON m.contract_id = o.id
      LEFT JOIN my_bid mb  ON mb.contract_id = o.id;

    RETURN jsonb_build_object('success', true, 'routes', COALESCE(v_result, '[]'::jsonb));
END; $$;
GRANT EXECUTE ON FUNCTION public.get_shipping_routes_for_corp(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
