-- ════════════════════════════════════════════════════════════════════
-- SHIPPING — one ranking, two views: helper + nation-side RPC
-- ════════════════════════════════════════════════════════════════════
-- The multi-winner ranking (rank pending bids by effective rate ASC,
-- applied_at_tick ASC, bid_id ASC; fill until volume_required cheapest-
-- first) was implemented in TWO places: the per-tick allocator (20270181)
-- and get_shipping_routes_for_corp (20270237 + 20270358). Adding a third
-- copy for the nation-side view would have meant three places to keep in
-- step. The nation view was reading the legacy shipping_contracts.status
-- = 'awarded' / winner_faction_id snapshot, which the multi-winner
-- allocator never writes, so a route a corp is FILLING 1/1 on the
-- entrepreneur dashboard showed as "Awaiting offers" to the Minister of
-- Trade.
--
-- Fix in three steps:
--
--   1. shipping_contract_winners(contract_ids[]) — ONE SQL helper that
--      ranks all pending bids on the given contracts and returns
--      (contract_id, bid_id, bidder_corp_id, corp_name, freighters,
--      bid_rate, units_won). Owner-only (REVOKE FROM PUBLIC); the
--      outer SECURITY DEFINER RPCs invoke it. bid_rate is in the output
--      so the entrepreneur RPC can expose the caller's OWN rate via
--      my_bid; the nation RPC does NOT surface it (sealed).
--
--   2. get_shipping_routes_for_corp — refactored to delegate ranking to
--      the helper. Its inline pend / ranked / bidders / mine CTEs (the
--      copies) are dropped. The output JSON shape is byte-identical to
--      20270358 so the client doesn't move.
--
--   3. get_trade_agreement_shipping(agreement_ids[]) — NEW thin RPC the
--      nation view calls. Uses the helper, plus the legacy winner_
--      faction_name + revenue_per_tick from shipping_contracts so any
--      old single-winner 'awarded' contract (e.g. the GardenofEden food
--      article) keeps rendering.
--
-- The per-tick allocator process_trade_agreement_shipping_multiwinner
-- still has its own ranking + payment loop. KNOWN duplication, flagged
-- here for a follow-up — refactoring the allocator is bigger surgery
-- because it has payment side effects. Both read paths are now in
-- lockstep via the helper.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. One-source ranking helper ────────────────────────────────────
-- Returns every pending bid on the given contracts WITH its current
-- units_won under the multi-winner allocator's rules. units_won = 0 for
-- bids that haven't won any slot or were ineligible (zero freighters,
-- invalid rate). bid_rate is exposed; sealed posture is enforced by the
-- outer RPCs choosing what to surface.
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
         WHERE b.contract_id = ANY(p_contract_ids) AND b.status = 'pending'
    ),
    -- Running freighters AHEAD of each valid bid (ineligible bids excluded
    -- from the rank but still returned by the outer SELECT with units_won 0).
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
-- Outer SECURITY DEFINER RPCs (below) invoke it as the function owner.


-- ── 2. Entrepreneur view: refactor to delegate ranking to the helper ──
-- Output JSON shape unchanged (20270358 + 20270237 fields preserved); the
-- inline pend/ranked/bidders/mine CTEs are dropped — that's the duplicate
-- ranking. Same sealed posture: rivals' bid_rate is never surfaced
-- (winning_bids omits it; bidders omits it; only my_bid carries it).
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
    my_bid AS (
        SELECT contract_id, bid_id, freighters, bid_rate
          FROM winners
         WHERE bidder_corp_id = p_corp_id
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
      LEFT JOIN counts        c  ON c.contract_id  = o.id
      LEFT JOIN bidders_list  bd ON bd.contract_id = o.id
      LEFT JOIN mine          m  ON m.contract_id  = o.id
      LEFT JOIN my_bid        mb ON mb.contract_id = o.id;

    RETURN jsonb_build_object('success', true, 'routes', COALESCE(v_result, '[]'::jsonb));
END; $$;

GRANT EXECUTE ON FUNCTION public.get_shipping_routes_for_corp(uuid) TO authenticated;


-- ── 3. Nation-side view: new RPC for the trade-agreement card ─────────
-- Returns, per shipping_contract under the given agreements, the current
-- winning bids (corp_name + units_won, no rate). Also returns the legacy
-- winner_faction_name + revenue_per_tick so any old single-winner
-- 'awarded' contract still renders. diplomacy.html replaces its direct
-- shipping_contracts query with this RPC.
CREATE OR REPLACE FUNCTION public.get_trade_agreement_shipping(p_agreement_ids uuid[])
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_result jsonb;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    WITH contracts AS (
        SELECT sc.id, sc.trade_agreement_id, sc.status,
               COALESCE(sc.volume_required, 0) AS demand,
               sc.commodity, sc.expires_at_tick, sc.delivery_priority,
               sc.consecutive_missed_payments, sc.last_tick_units_filled,
               sc.winner_faction_id, sc.revenue_per_tick,
               f.faction_name AS winner_faction_name
          FROM shipping_contracts sc
          LEFT JOIN factions f ON f.id = sc.winner_faction_id
         WHERE sc.trade_agreement_id = ANY(p_agreement_ids)
    ),
    winners AS (
        SELECT * FROM shipping_contract_winners(ARRAY(SELECT id FROM contracts))
    ),
    winner_list AS (
        SELECT contract_id,
               jsonb_agg(
                   jsonb_build_object('corp_name', corp_name, 'units_won', units_won)
                   ORDER BY units_won DESC, bid_id
               ) FILTER (WHERE units_won > 0) AS winning_bids,
               COALESCE(SUM(units_won), 0)::int AS total_units_won
          FROM winners
         GROUP BY contract_id
    )
    SELECT jsonb_agg(jsonb_build_object(
               'id',                          c.id,
               'trade_agreement_id',          c.trade_agreement_id,
               'status',                      c.status,
               'volume_required',             c.demand,
               'commodity',                   c.commodity,
               'expires_at_tick',             c.expires_at_tick,
               'delivery_priority',           c.delivery_priority,
               'consecutive_missed_payments', c.consecutive_missed_payments,
               'last_tick_units_filled',      c.last_tick_units_filled,
               'winner_faction_id',           c.winner_faction_id,
               'winner_faction_name',         c.winner_faction_name,
               'revenue_per_tick',            c.revenue_per_tick,
               'winning_bids',                COALESCE(wl.winning_bids, '[]'::jsonb),
               'total_units_won',             COALESCE(wl.total_units_won, 0)
             ))
      INTO v_result
      FROM contracts c
      LEFT JOIN winner_list wl ON wl.contract_id = c.id;

    RETURN jsonb_build_object('success', true, 'contracts', COALESCE(v_result, '[]'::jsonb));
END; $$;

GRANT EXECUTE ON FUNCTION public.get_trade_agreement_shipping(uuid[]) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
