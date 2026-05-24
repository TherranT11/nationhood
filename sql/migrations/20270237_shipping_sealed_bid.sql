-- ════════════════════════════════════════════════════════════════════
-- SEALED-BID SHIPPING — rivals' pending rates never reach the client
-- ════════════════════════════════════════════════════════════════════
-- The UI hid the "lowest $X/unit/tick" figure (20270236-era client change),
-- but shipping_contract_bids was world-readable (RLS SELECT true), so a
-- pending rival's bid_rate was still in the network response — readable in
-- devtools. This closes that:
--
--   1. get_shipping_routes_for_corp(corp) — a SECURITY DEFINER read that
--      returns, per open trade-agreement route: metadata, the pending
--      bidder COUNT, the caller's OWN bid (if any), and the caller's
--      provisional winning units. The winning-units allocation mirrors
--      process_trade_agreement_shipping_multiwinner exactly (effective rate
--      = bid_rate, else offered_revenue_per_tick/freighters; sort rate ASC,
--      applied_at_tick ASC, id ASC; fill volume_required cheapest-first).
--      It never returns a rival's rate.
--
--   2. RLS on shipping_contract_bids is tightened: a client may read a bid
--      only if it is 'accepted' (the public winner — diplomacy, political
--      actions, and won-contract views need this) OR it belongs to one of
--      the caller's own factions. PENDING rivals' bids are no longer
--      client-readable from any path. SECURITY DEFINER RPCs (this one, the
--      allocator, place/withdraw bid) and service-role tick jobs bypass RLS,
--      so server logic is unaffected.
--
-- Idempotent (CREATE OR REPLACE / DROP POLICY IF EXISTS).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. get_shipping_routes_for_corp ─────────────────────────────────
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
    pend AS (  -- all pending bids on those routes (effective per-unit rate)
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
    ranked AS (  -- valid bids only; running freighters AHEAD of each bid
        SELECT contract_id, bidder_corp_id, freighters,
               COALESCE(SUM(freighters) OVER (
                   PARTITION BY contract_id
                   ORDER BY eff_rate ASC, applied_at_tick ASC, bid_id ASC
                   ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING), 0) AS units_ahead
          FROM pend
         WHERE eff_rate > 0 AND eff_rate < 1e18 AND freighters > 0
    ),
    mine AS (  -- the caller's winning units on each route
        SELECT rk.contract_id,
               LEAST(rk.freighters, GREATEST(0, o.demand - rk.units_ahead)) AS won_units
          FROM ranked rk JOIN open_routes o ON o.id = rk.contract_id
         WHERE rk.bidder_corp_id = p_corp_id
    ),
    my_bid AS (  -- the caller's pending bid (own data — fine to return)
        SELECT contract_id, bid_id, freighters, bid_rate FROM pend WHERE bidder_corp_id = p_corp_id
    )
    SELECT jsonb_agg(jsonb_build_object(
               'id', o.id, 'name', o.name, 'commodity', o.commodity,
               'volume_required', o.demand,
               'origin_port', o.origin_port, 'destination_port', o.destination_port,
               'last_tick_units_filled', o.last_tick_units_filled, 'last_filled_tick', o.last_filled_tick,
               'bidder_count', COALESCE(c.bidder_count, 0),
               'my_bid', CASE WHEN mb.bid_id IS NOT NULL
                              THEN jsonb_build_object('id', mb.bid_id, 'freighters', mb.freighters, 'bid_rate', mb.bid_rate)
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

-- ── 2. Seal the table: pending rivals' bids are no longer client-readable ──
DROP POLICY IF EXISTS "shipping_contract_bids_read_all" ON shipping_contract_bids;
DROP POLICY IF EXISTS "shipping_contract_bids_read_sealed" ON shipping_contract_bids;
CREATE POLICY "shipping_contract_bids_read_sealed"
    ON shipping_contract_bids FOR SELECT TO authenticated
    USING (
        status = 'accepted'   -- the public winner: diplomacy, political actions, won-contract views
        OR EXISTS (
            SELECT 1 FROM factions f
             WHERE f.id = shipping_contract_bids.bidder_faction_id
               AND (f.id = auth.uid() OR f.linked_user_id = auth.uid())
        )
    );

COMMENT ON POLICY "shipping_contract_bids_read_sealed" ON shipping_contract_bids IS
    'Sealed-bid: a client may read a bid only if it is accepted (public winner) or belongs to one of the caller''s own factions. Pending rivals'' rates stay hidden; SECURITY DEFINER RPCs / service-role tick jobs bypass this and still see all bids.';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- BEGIN;
-- DROP POLICY IF EXISTS "shipping_contract_bids_read_sealed" ON shipping_contract_bids;
-- CREATE POLICY "shipping_contract_bids_read_all" ON shipping_contract_bids FOR SELECT TO authenticated USING (true);
-- DROP FUNCTION IF EXISTS public.get_shipping_routes_for_corp(uuid);
-- COMMIT;
