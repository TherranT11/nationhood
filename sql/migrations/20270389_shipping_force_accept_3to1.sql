-- ════════════════════════════════════════════════════════════════════
-- SHIPPING — Minister force-accept + 3-unit freighter capacity
-- ════════════════════════════════════════════════════════════════════
-- Two related changes that ride together because the helper and
-- allocator have to move in lockstep:
--
--   A. MANUAL ACCEPT  (option B from the chat)
--      Adds shipping_contract_bids.manually_accepted. Minister of
--      Trade can [Accept] specific bids; the allocator then fills
--      ONLY from accepted bids on that contract (cheapest first
--      within the accepted set), bypassing the 3-tick window
--      (20270388). Partial fills are intentional — if the accepted
--      set doesn't cover volume_required, the rest stays unfilled
--      until the minister accepts more. Mutex with vetoed: accepting
--      clears veto, vetoing clears accept.
--
--   B. 3-UNIT FREIGHTER CAPACITY
--      Each freighter now carries 3 units/tick — the value the
--      original design (20260620:23) called out and that
--      successive rewrites quietly lost when the helper started
--      treating 1 freighter as 1 unit. The number lives in ONE
--      place (shipping_contract_winners' SELECT) so the allocator,
--      get_shipping_routes_for_corp, get_trade_agreement_shipping
--      and the per-tick payment math all read the same value.
--
-- Also rolls in two audit fixes from the 20270388 post-mortem:
--
--   C. get_route_bids_for_minister returns ticks_until_window_close
--      per contract. The diplomacy client used to mirror the
--      BIDDING_WINDOW_TICKS constant locally; that mirror is
--      retired in the matching client change.
--
--   D. get_route_bids_for_minister returns manually_accepted per
--      bid so the client can render the tri-state
--      (PENDING / ACCEPTED / REJECTED) on each row.
--
-- Idempotent. No existing column / function signatures change shape;
-- shipping_contract_winners' output columns are unchanged so its
-- three callers don't need to move in step.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Per-bid manual-accept column (mutex with vetoed) ───────────────
ALTER TABLE public.shipping_contract_bids
    ADD COLUMN IF NOT EXISTS manually_accepted boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.shipping_contract_bids.manually_accepted IS
    'TRUE when the importing nation''s Minister of Trade has explicitly accepted this bid via accept_shipping_bid. When ANY pending bid on a contract is manually_accepted, the allocator fills from accepted bids ONLY (cheapest first within the accepted set) and bypasses the 3-tick bidding window. Mutex with vetoed: accept_shipping_bid clears vetoed, veto_shipping_bid clears manually_accepted.';

-- ── 2. Helper — 3-unit capacity + manual-mode override ────────────────
-- Each freighter carries 3 units of any commodity per tick. The 3
-- lives ONLY in the LEAST(...) and the units_ahead SUM below; both
-- consumers (allocator + view RPCs) read units_won from this function
-- so the number doesn't get re-derived anywhere else.
--
-- Manual-accept mode: a contract is in "manual mode" iff any of its
-- pending bids has manually_accepted=true. In manual mode, only
-- manually-accepted (and non-vetoed) bids are eligible for fill; in
-- normal mode, all non-vetoed bids are eligible (current behaviour).
-- This is purely a SELECT-side WHERE-clause change — the function's
-- output columns and signature are unchanged.
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
    mode AS (
        SELECT contract_id, BOOL_OR(manually_accepted) AS has_manual
          FROM pend
         GROUP BY contract_id
    ),
    valid AS (
        SELECT p.contract_id, p.bid_id,
               COALESCE(SUM(p.freighters * 3) OVER (
                   PARTITION BY p.contract_id
                   ORDER BY p.eff_rate ASC, p.applied_at_tick ASC, p.bid_id ASC
                   ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING), 0) AS units_ahead
          FROM pend p
          LEFT JOIN mode m ON m.contract_id = p.contract_id
         WHERE p.eff_rate > 0 AND p.eff_rate < 1e18 AND p.freighters > 0
           AND NOT p.vetoed
           AND ((COALESCE(m.has_manual, false) AND p.manually_accepted)
                OR NOT COALESCE(m.has_manual, false))
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
-- Outer SECURITY DEFINER RPCs (below) invoke it as the function owner.

-- ── 3. Allocator — manual accepts bypass the 3-tick bidding window ────
-- Body otherwise verbatim from 20270388. One added EXISTS lookup +
-- one widened skip condition. The manual-mode rank-and-fill is
-- already in the helper above; this just decides WHETHER to call it
-- for this contract this tick.
CREATE OR REPLACE FUNCTION public.process_trade_agreement_shipping_multiwinner(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    RAW_PER_ABSTRACT      constant numeric := 1000000;
    BIDDING_WINDOW_TICKS  constant int     := 3;
    v_tick            int;
    v_contract        RECORD;
    v_bid             RECORD;
    v_demand          int;
    v_units_taken     int;
    v_total_payout    bigint;
    v_buyer_budget_a  numeric;
    v_buyer_budget_r  numeric;
    v_has_manual      boolean;
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
               COALESCE(created_at_tick, 0) AS created_tick,
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

        -- Manual accepts bypass the 3-tick bidding window. The minister
        -- explicitly chose this set; no reason to make them wait. If no
        -- bid on this contract is manually_accepted, the standard
        -- 3-tick window still gates the cheapest-first auto-award.
        SELECT EXISTS(
            SELECT 1 FROM shipping_contract_bids
             WHERE contract_id = v_contract.id
               AND status = 'pending'
               AND COALESCE(manually_accepted, false) = true
        ) INTO v_has_manual;

        IF NOT v_has_manual
           AND v_tick - v_contract.created_tick < BIDDING_WINDOW_TICKS THEN
            CONTINUE;
        END IF;

        -- Single source: rank-and-fill comes from the helper, which
        -- handles the manual-mode WHERE-clause internally. Same
        -- ordering, same veto exclusion, same 3-unit capacity math as
        -- the view RPCs.
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

-- ── 4. veto_shipping_bid — now clears manually_accepted (mutex) ───────
-- Body otherwise verbatim from 20270238. One added column in the
-- UPDATE SET clause; everything else identical.
CREATE OR REPLACE FUNCTION public.veto_shipping_bid(p_bid_id uuid, p_vetoed boolean)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_nation uuid; v_set_vetoed boolean;
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

    v_set_vetoed := COALESCE(p_vetoed, true);
    UPDATE shipping_contract_bids
       SET vetoed            = v_set_vetoed,
           manually_accepted = CASE WHEN v_set_vetoed THEN false ELSE manually_accepted END,
           updated_at        = now()
     WHERE id = p_bid_id;
    RETURN jsonb_build_object('success', true, 'bid_id', p_bid_id, 'vetoed', v_set_vetoed);
END; $$;
GRANT EXECUTE ON FUNCTION public.veto_shipping_bid(uuid, boolean) TO authenticated;

-- ── 5. accept_shipping_bid — new RPC, mirror of veto ──────────────────
-- Sets manually_accepted; clears vetoed when accepting. Same MoT-of-
-- the-route's-nation gate as veto_shipping_bid (verbatim prelude).
CREATE OR REPLACE FUNCTION public.accept_shipping_bid(p_bid_id uuid, p_accepted boolean)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_nation uuid; v_set_accepted boolean;
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

    v_set_accepted := COALESCE(p_accepted, true);
    UPDATE shipping_contract_bids
       SET manually_accepted = v_set_accepted,
           vetoed            = CASE WHEN v_set_accepted THEN false ELSE vetoed END,
           updated_at        = now()
     WHERE id = p_bid_id;
    RETURN jsonb_build_object('success', true, 'bid_id', p_bid_id, 'manually_accepted', v_set_accepted);
END; $$;
GRANT EXECUTE ON FUNCTION public.accept_shipping_bid(uuid, boolean) TO authenticated;

-- ── 6. get_route_bids_for_minister — add tri-state + window countdown ─
-- Adds manually_accepted per bid (so the client renders tri-state
-- PENDING/ACCEPTED/REJECTED) and ticks_until_window_close per contract
-- (so the client doesn't mirror BIDDING_WINDOW_TICKS locally). When
-- any bid on a contract is manually_accepted, ticks_until_window_close
-- is reported as 0 — the window's already moot for that contract.
-- Body otherwise verbatim from 20270238.
CREATE OR REPLACE FUNCTION public.get_route_bids_for_minister(p_nation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    BIDDING_WINDOW_TICKS constant int := 3;
    v_uid    uuid := auth.uid();
    v_tick   int;
    v_result jsonb;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;
    IF NOT EXISTS (
        SELECT 1 FROM ministries m JOIN factions f ON f.id = m.party_id
         WHERE m.nation_id = p_nation_id AND m.ministry_key = 'trade' AND m.is_active = TRUE
           AND (f.id = v_uid OR f.linked_user_id = v_uid)
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_trade_minister');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    SELECT jsonb_agg(route ORDER BY (route->>'created_at_tick')::int DESC NULLS LAST)
      INTO v_result
      FROM (
        SELECT jsonb_build_object(
                 'id', c.id, 'name', c.name, 'commodity', c.commodity,
                 'volume_required', COALESCE(c.volume_required, 0),
                 'origin_port', c.origin_port, 'destination_port', c.destination_port,
                 'created_at_tick', c.created_at_tick,
                 'ticks_until_window_close', CASE
                     WHEN EXISTS (SELECT 1 FROM shipping_contract_bids b
                                   WHERE b.contract_id = c.id
                                     AND b.status = 'pending'
                                     AND COALESCE(b.manually_accepted, false))
                         THEN 0
                     ELSE GREATEST(0, BIDDING_WINDOW_TICKS - (v_tick - COALESCE(c.created_at_tick, 0)))
                 END,
                 'bids', COALESCE((
                     SELECT jsonb_agg(jsonb_build_object(
                                'bid_id', b.id,
                                'carrier', COALESCE(ec.name, bf.faction_name, 'Carrier'),
                                'rate', CASE WHEN b.bid_rate IS NOT NULL THEN b.bid_rate
                                             WHEN COALESCE(b.freighters_allocated,0) > 0
                                                  THEN (b.offered_revenue_per_tick / b.freighters_allocated)
                                             ELSE NULL END,
                                'freighters',        COALESCE(b.freighters_allocated, 0),
                                'reputation',        COALESCE(bf.ent_reputation, 0),
                                'vetoed',            COALESCE(b.vetoed, false),
                                'manually_accepted', COALESCE(b.manually_accepted, false))
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
