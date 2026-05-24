-- ============================================================================
-- Director read-only visibility: widen two owner-gated read RPCs to also
-- allow board directors (corp_board_seats), matching the entrepreneur-corp.html
-- director-visibility feature. Both are pure reads that only ever return the
-- VIEWED corp's own data (its bids / positions / received construction bids) —
-- never a rival's — so exposing them to a board member is safe.
--
-- Bodies are copied verbatim from their latest definitions (20270238 /
-- 20270245); the ONLY change is the caller gate: "owner" -> "owner OR director".
-- ============================================================================

BEGIN;

-- ── get_shipping_routes_for_corp (was: owner-only; latest body from 20270238) ──
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
    -- Owner OR a board director (corp_board_seats) may read — directors get
    -- read-only operational visibility (entrepreneur-corp.html). The query
    -- only ever returns this corp's OWN bids/positions, never a rival's.
    IF v_fac.id IS NULL OR (v_corp.owner_faction_id <> v_fac.id
        AND NOT EXISTS (SELECT 1 FROM corp_board_seats b
                        WHERE b.corp_id = v_corp.id AND b.member_faction_id = v_fac.id)) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authorized');
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

-- ── get_my_construction_bids (was: owner-only; latest body from 20270245) ──
CREATE OR REPLACE FUNCTION public.get_my_construction_bids(p_corp_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid uuid := auth.uid();
    v_fac factions%ROWTYPE;
    v_corp entrepreneur_corps%ROWTYPE;
    v_out jsonb;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id;
    IF v_corp.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    -- Owner OR a board director (corp_board_seats) may read — directors get
    -- read-only operational visibility (entrepreneur-corp.html). The query
    -- only ever returns this corp's OWN bids/positions, never a rival's.
    IF v_fac.id IS NULL OR (v_corp.owner_faction_id <> v_fac.id
        AND NOT EXISTS (SELECT 1 FROM corp_board_seats b
                        WHERE b.corp_id = v_corp.id AND b.member_faction_id = v_fac.id)) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authorized');
    END IF;

    SELECT COALESCE(jsonb_agg(bid_obj ORDER BY (bid_obj->>'bid_amount')::bigint ASC), '[]'::jsonb)
      INTO v_out
      FROM (
        SELECT jsonb_build_object(
            'contract_id',    b.contract_id,
            'bid_id',         b.id,
            'bid_amount',     b.bid_amount,
            'corp_id',        ec.id,
            'corp_name',      ec.name,
            'hq',             COALESCE(n.name, '—'),
            'ceo',            COALESCE(NULLIF(btrim(concat_ws(' ', f.leader_first_name, f.leader_last_name)), ''),
                                       f.faction_name, '—'),
            'ceo_reputation', COALESCE(f.ent_reputation, 0),
            'valuation',      CASE
                WHEN ec.listing = 'public' AND ec.share_price IS NOT NULL AND ec.shares_outstanding IS NOT NULL
                    THEN ROUND(ec.share_price * ec.shares_outstanding)::bigint
                ELSE entrepreneur_corp_book_value(ec.id)::bigint
            END
        ) AS bid_obj
        FROM ent_construction_bids b
        JOIN ent_construction_contracts cc ON cc.id = b.contract_id
        JOIN entrepreneur_corps ec ON ec.id = b.bidder_corp_id
        JOIN factions f ON f.id = ec.owner_faction_id
        LEFT JOIN nations n ON n.id = ec.hq_nation_id
        WHERE cc.issuer_corp_id = p_corp_id AND cc.status = 'open' AND b.status = 'pending'
      ) s;

    RETURN jsonb_build_object('success', true, 'bids', v_out);
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_construction_bids(uuid) TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
