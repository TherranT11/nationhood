-- ════════════════════════════════════════════════════════════════════
-- ENTREPRENEUR SHIPPING — v1 (multi-winner bidding + freighter market)
-- ════════════════════════════════════════════════════════════════════
-- Wires entrepreneur shipping corps (entrepreneur_corps.industry =
-- 'shipping') into the existing shipping_contracts pipeline that
-- already spawns one contract per `trade_flow` article on a bilateral
-- trade agreement (trigger spawn_shipping_contracts_for_agreement,
-- migration 20261018).
--
-- ── Design recap (locked) ────────────────────────────────────────
--   1 freighter = 1 cargo unit / tick.
--   Each trade-agreement contract has `volume_required` units/tick
--   the importing nation wants delivered. Multiple corps bid; per
--   tick the allocator sorts pending bids by `bid_rate` ($/unit/tick)
--   ASC and fills `volume_required` slots from the cheapest up.
--   Bids stay 'pending' across ticks — they keep competing until the
--   corp withdraws or the agreement ends.
--
-- ── Schema changes (additive; legacy paths preserved) ────────────
--   entrepreneur_corps.freighters_owned     fleet counter per corp.
--   shipping_contract_bids.bidder_corp_id   entrepreneur bidder ID.
--   shipping_contract_bids.bid_rate         per-unit-per-tick $.
--   shipping_contract_bids.bidder_faction_id  now nullable (legacy).
--   CHECK: exactly one of (bidder_faction_id, bidder_corp_id) set.
--   Old UNIQUE (contract_id, bidder_faction_id) dropped; replaced by
--   two partial uniques, one per bidder-id path.
--
-- ── Fleet cap ────────────────────────────────────────────────────
--   freighters_owned ≤ (Σ completed Ports the corp owns × 4).
--   No starter freighters; corps buy at $2M each via the new RPC.
--
-- ── New RPCs ─────────────────────────────────────────────────────
--   entrepreneur_buy_freighter(corp_id, quantity)
--   entrepreneur_place_shipping_bid(corp_id, contract_id, freighters,
--                                   bid_rate)
--   entrepreneur_withdraw_shipping_bid(corp_id, contract_id)
--
-- ── Out of scope for this migration ──────────────────────────────
--   Multi-winner per-tick allocation (processTradeAgreementShipping
--   rewrite) — that's the edge-function change in the same commit.
--   UI on entrepreneur-corp.html — follow-up commit.
--
-- Idempotent. CREATE OR REPLACE on RPCs; ADD COLUMN IF NOT EXISTS on
-- schema; CHECK constraints guarded with NOT EXISTS lookups.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. entrepreneur_corps.freighters_owned ───────────────────────

ALTER TABLE entrepreneur_corps
    ADD COLUMN IF NOT EXISTS freighters_owned int NOT NULL DEFAULT 0;

COMMENT ON COLUMN entrepreneur_corps.freighters_owned IS
    'Fleet size for shipping corps. Bought via entrepreneur_buy_freighter, capped at (Σ completed Ports the corp owns × 4). Non-shipping corps stay at 0. Mutable only via SECURITY DEFINER RPCs — same write-revoke model as treasury_cash so an owner cannot self-grant freighters via the client.';

-- The 20270139 "Owner writes" RLS policy on entrepreneur_corps grants
-- direct UPDATE to the owner. freighters_owned drives real economic
-- value (per-tick shipping revenue) so client writes must be revoked
-- the same way treasury_cash / shares_outstanding / share_price are
-- in 20270144.
REVOKE UPDATE (freighters_owned) ON entrepreneur_corps FROM PUBLIC, anon, authenticated;

-- ── 2. shipping_contract_bids — entrepreneur bidder + free rate ──

ALTER TABLE shipping_contract_bids
    ADD COLUMN IF NOT EXISTS bidder_corp_id uuid REFERENCES entrepreneur_corps(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS bid_rate       bigint;

-- Make legacy bidder_faction_id nullable so entrepreneur bids can
-- leave it NULL. (No data change — existing bids still have it set.)
ALTER TABLE shipping_contract_bids
    ALTER COLUMN bidder_faction_id DROP NOT NULL;

-- Exactly one bidder identity must be set on every row.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
         WHERE table_name = 'shipping_contract_bids'
           AND constraint_name = 'shipping_contract_bids_one_bidder_chk'
    ) THEN
        ALTER TABLE shipping_contract_bids
            ADD CONSTRAINT shipping_contract_bids_one_bidder_chk
            CHECK ((bidder_faction_id IS NULL) <> (bidder_corp_id IS NULL));
    END IF;
END $$;

-- Drop the old legacy UNIQUE that required bidder_faction_id NOT
-- NULL implicit semantics, replace with two partial uniques (one per
-- bidder-id path) so each (contract, bidder) is still one row each.
ALTER TABLE shipping_contract_bids
    DROP CONSTRAINT IF EXISTS shipping_contract_bids_contract_id_bidder_faction_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_scb_one_legacy
    ON shipping_contract_bids (contract_id, bidder_faction_id)
    WHERE bidder_faction_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_scb_one_entrepreneur
    ON shipping_contract_bids (contract_id, bidder_corp_id)
    WHERE bidder_corp_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_scb_bidder_corp
    ON shipping_contract_bids (bidder_corp_id) WHERE bidder_corp_id IS NOT NULL;

COMMENT ON COLUMN shipping_contract_bids.bidder_corp_id IS
    'Entrepreneur-corp bidder. Mutually exclusive with bidder_faction_id (legacy corporation faction). Enforced via shipping_contract_bids_one_bidder_chk.';
COMMENT ON COLUMN shipping_contract_bids.bid_rate IS
    'Per-unit-per-tick rate ($) the bidder offers. Entrepreneur bids set this directly; legacy bids leave it NULL and the allocator falls back to offered_revenue_per_tick / freighters_allocated.';

-- ── 3. entrepreneur_buy_freighter ────────────────────────────────

CREATE OR REPLACE FUNCTION public.entrepreneur_buy_freighter(
    p_corp_id  uuid,
    p_quantity int
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_corp      entrepreneur_corps%ROWTYPE;
    v_fac       factions%ROWTYPE;
    v_unit_cost bigint := 2000000;          -- $2M per freighter
    v_cost      bigint;
    v_port_cap  int;
    v_treas     numeric;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 200 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_quantity');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps
     WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'shipping' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_shipping_corp');
    END IF;

    -- Owner gate. No money debit from party_funds — the corp pays.
    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;
    IF v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    -- Fleet cap: 4 freighters per completed Port the corp owns.
    SELECT COUNT(*) * 4 INTO v_port_cap
      FROM corp_buildings
     WHERE owner_corp_id  = p_corp_id
       AND building_type  = 'port'
       AND status         = 'completed';

    IF (v_corp.freighters_owned + p_quantity) > v_port_cap THEN
        RETURN jsonb_build_object('success', false, 'reason', 'fleet_cap_exceeded',
            'have', v_corp.freighters_owned, 'requested', p_quantity, 'cap', v_port_cap);
    END IF;

    v_cost  := v_unit_cost::bigint * p_quantity::bigint;
    v_treas := COALESCE(v_corp.treasury_cash, 0);
    IF v_treas < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', v_treas::bigint, 'need', v_cost, 'payer', 'corp');
    END IF;

    UPDATE entrepreneur_corps
       SET treasury_cash    = COALESCE(treasury_cash, 0) - v_cost,
           freighters_owned = freighters_owned + p_quantity,
           updated_at       = now()
     WHERE id = p_corp_id;

    RETURN jsonb_build_object(
        'success', true,
        'corp_id', p_corp_id,
        'quantity_bought',  p_quantity,
        'unit_cost',        v_unit_cost,
        'total_cost',       v_cost,
        'freighters_owned', v_corp.freighters_owned + p_quantity,
        'fleet_cap',        v_port_cap,
        'corp_cash_after',  (v_treas - v_cost)::bigint
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.entrepreneur_buy_freighter(uuid, int) TO authenticated;

COMMENT ON FUNCTION public.entrepreneur_buy_freighter(uuid, int) IS
    'Shipping-corp owner buys N freighters at $2M each. Cost paid from entrepreneur_corps.treasury_cash (corp''s own books — same source as begin_construction post-20270182). Caps fleet at (Σ completed Ports × 4). Owner verified but party_funds untouched.';

-- ── 4. entrepreneur_place_shipping_bid ───────────────────────────

CREATE OR REPLACE FUNCTION public.entrepreneur_place_shipping_bid(
    p_corp_id     uuid,
    p_contract_id uuid,
    p_freighters  int,
    p_bid_rate    bigint
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid           uuid := auth.uid();
    v_corp          entrepreneur_corps%ROWTYPE;
    v_fac           factions%ROWTYPE;
    v_contract      shipping_contracts%ROWTYPE;
    v_tick          int;
    v_committed     int;
    v_available     int;
    v_existing_id   uuid;
    -- The legacy bid columns we still must populate for the existing
    -- per-tick handler to read uniformly. Derived from bid_rate.
    v_offered_rev   bigint;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_contract_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_freighters IS NULL OR p_freighters < 1 OR p_freighters > 1000 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_freighters');
    END IF;
    -- 1¢ floor (no zero bids), $1M/unit/tick ceiling — generous but
    -- prevents 64-bit overflow on payout math at extreme rates.
    IF p_bid_rate IS NULL OR p_bid_rate < 1 OR p_bid_rate > 1000000 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_bid_rate');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps
     WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'shipping' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_shipping_corp');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;
    IF v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    SELECT * INTO v_contract FROM shipping_contracts
     WHERE id = p_contract_id FOR UPDATE;
    IF v_contract.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'contract_not_found');
    END IF;
    IF v_contract.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'contract_not_open',
            'status', v_contract.status);
    END IF;
    IF v_contract.trade_agreement_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_trade_agreement');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Available fleet = owned − committed to other pending bids
    -- (excluding the one we may be updating).
    SELECT COALESCE(SUM(freighters_allocated), 0) INTO v_committed
      FROM shipping_contract_bids
     WHERE bidder_corp_id = p_corp_id
       AND status = 'pending'
       AND contract_id <> p_contract_id;
    v_available := v_corp.freighters_owned - v_committed;

    IF p_freighters > v_available THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_available_freighters',
            'available', v_available, 'requested', p_freighters,
            'owned', v_corp.freighters_owned, 'committed_elsewhere', v_committed);
    END IF;

    -- Legacy column: keep populated so the handler can read either
    -- bid_rate (entrepreneur) or offered_revenue_per_tick (legacy)
    -- uniformly via COALESCE.
    v_offered_rev := p_bid_rate::bigint * p_freighters::bigint;

    SELECT id INTO v_existing_id FROM shipping_contract_bids
     WHERE contract_id = p_contract_id
       AND bidder_corp_id = p_corp_id;

    IF v_existing_id IS NOT NULL THEN
        UPDATE shipping_contract_bids
           SET freighters_allocated     = p_freighters,
               bid_rate                 = p_bid_rate,
               offered_revenue_per_tick = v_offered_rev,
               offered_term_ticks       = v_contract.term_ticks,
               status                   = 'pending',
               applied_at_tick          = v_tick,
               updated_at               = now()
         WHERE id = v_existing_id;
    ELSE
        INSERT INTO shipping_contract_bids
            (contract_id, bidder_corp_id,
             freighters_allocated, bid_rate, offered_revenue_per_tick, offered_term_ticks,
             status, applied_at_tick, expires_at_tick, created_at_tick)
        VALUES
            (p_contract_id, p_corp_id,
             p_freighters, p_bid_rate, v_offered_rev, v_contract.term_ticks,
             'pending', v_tick, v_contract.expires_at_tick, v_tick);
    END IF;

    RETURN jsonb_build_object(
        'success',           true,
        'corp_id',           p_corp_id,
        'contract_id',       p_contract_id,
        'freighters',        p_freighters,
        'bid_rate',          p_bid_rate,
        'committed_elsewhere', v_committed,
        'available_after',   v_available - p_freighters
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.entrepreneur_place_shipping_bid(uuid, uuid, int, bigint) TO authenticated;

COMMENT ON FUNCTION public.entrepreneur_place_shipping_bid(uuid, uuid, int, bigint) IS
    'Shipping-corp owner places (or updates) a per-unit rate bid on an open trade-agreement contract. Verifies available fleet = owned − committed-elsewhere. Bid stays ''pending'' across ticks; per-tick allocator awards slots cheapest-first.';

-- ── 5. entrepreneur_withdraw_shipping_bid ────────────────────────

CREATE OR REPLACE FUNCTION public.entrepreneur_withdraw_shipping_bid(
    p_corp_id     uuid,
    p_contract_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_corp    entrepreneur_corps%ROWTYPE;
    v_fac     factions%ROWTYPE;
    v_tick    int;
    v_bid_id  uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_contract_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps
     WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;
    IF v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    SELECT id INTO v_bid_id FROM shipping_contract_bids
     WHERE contract_id = p_contract_id
       AND bidder_corp_id = p_corp_id
       AND status = 'pending';
    IF v_bid_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_pending_bid');
    END IF;

    UPDATE shipping_contract_bids
       SET status = 'withdrawn',
           resolved_at_tick = v_tick,
           updated_at = now()
     WHERE id = v_bid_id;

    RETURN jsonb_build_object('success', true,
        'corp_id', p_corp_id, 'contract_id', p_contract_id, 'bid_id', v_bid_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.entrepreneur_withdraw_shipping_bid(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION public.entrepreneur_withdraw_shipping_bid(uuid, uuid) IS
    'Shipping-corp owner withdraws their pending bid on a trade-agreement contract. Frees the freighters back to the corp''s available pool starting next allocator pass.';

-- ── 6. process_trade_agreement_shipping_multiwinner ──────────────
-- Per-tick allocator. Replaces Pass A of the JS handler in
-- advance-corp-tick (which was single-winner). For each
-- status='open' trade-agreement contract:
--   1. Pull pending bids. Effective rate = bid_rate (entrepreneur)
--      OR offered_revenue_per_tick / freighters_allocated (legacy).
--   2. Sort by rate ASC, applied_at_tick ASC (tiebreaker).
--   3. Fill volume_required slots cheapest-first; partial fill of
--      the last bid if the bid carries more freighters than the
--      remaining slot count.
--   4. Total payout = Σ units × rate.
--   5. Importing nation's budget must cover payout. If short →
--      pause route (no one paid; missed counter increments). If
--      covered → debit budget, credit each winning bidder.
--      Entrepreneur → entrepreneur_corps.treasury_cash (same
--      treasury construction debits from in 20270182). Legacy →
--      faction.corp_cash_reserves.
--
-- Bids stay 'pending' across ticks; the auction recomputes every
-- tick from current bid state. Corps update / withdraw their bids
-- via the place / withdraw RPCs.
--
-- nation.budget is in abstract units (1 = $1M raw, post-20261206);
-- payout math is raw dollars. RAW_PER_ABSTRACT bridges both ways.
--
-- Idempotent within a tick by the last_payment_tick guard (skip
-- contracts already paid this tick).

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

        IF v_total_payout <= 0 THEN CONTINUE; END IF;

        -- Importing nation's budget gate.
        SELECT COALESCE(budget, 0) INTO v_buyer_budget_a
          FROM nations WHERE id = v_contract.nation_id;
        v_buyer_budget_r := v_buyer_budget_a * RAW_PER_ABSTRACT;
        IF v_buyer_budget_r < v_total_payout THEN
            UPDATE shipping_contracts
               SET consecutive_missed_payments = v_contract.prior_misses + 1,
                   updated_at = now()
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
    'Per-tick multi-winner allocator for trade-agreement shipping contracts. Sorts pending bids by effective per-unit rate ASC, fills volume_required slots cheapest-first across all bids (entrepreneur + legacy). Importing nation budget pays; entrepreneur winners credited to entrepreneur_corps.treasury_cash (corp''s own books), legacy winners to corp_cash_reserves. Bids stay pending across ticks. Idempotent within a tick via last_payment_tick.';

-- ── 7. One-shot: rewind legacy single-winner contracts ───────────
-- Before this migration, processTradeAgreementShipping ran a Pass A
-- that snapped a single winner per contract (status flips to
-- 'awarded', winner_faction_id captured, accepted bid kept paying
-- every tick via Pass C). The new multi-winner model replaces all
-- of that. Any 'awarded' rows left over from the old flow would be
-- ignored by the new allocator (it only reads 'open' contracts) and
-- their 'accepted' bids likewise (the new allocator only reads
-- 'pending' bids). Rewind them so the multi-winner allocator picks
-- them up next tick.
--
-- Scope: only trade-agreement contracts (trade_agreement_id NOT
-- NULL). One-time foreign / domestic SOP contracts kept the same
-- single-winner semantics and are out of scope for this rewind —
-- they continue through the existing JS handler path until that
-- code is rewritten separately.

UPDATE shipping_contract_bids
   SET status           = 'pending',
       resolved_at_tick = NULL,
       updated_at       = now()
 WHERE status = 'accepted'
   AND contract_id IN (
       SELECT id FROM shipping_contracts
        WHERE trade_agreement_id IS NOT NULL
          AND status = 'awarded'
   );

UPDATE shipping_contracts
   SET status            = 'open',
       winner_faction_id = NULL,
       last_payment_tick = NULL,
       updated_at        = now()
 WHERE status              = 'awarded'
   AND trade_agreement_id IS NOT NULL;

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.process_trade_agreement_shipping_multiwinner(int);
-- DROP FUNCTION IF EXISTS public.entrepreneur_withdraw_shipping_bid(uuid, uuid);
-- DROP FUNCTION IF EXISTS public.entrepreneur_place_shipping_bid(uuid, uuid, int, bigint);
-- DROP FUNCTION IF EXISTS public.entrepreneur_buy_freighter(uuid, int);
-- DROP INDEX IF EXISTS idx_scb_one_entrepreneur;
-- DROP INDEX IF EXISTS idx_scb_one_legacy;
-- DROP INDEX IF EXISTS idx_scb_bidder_corp;
-- ALTER TABLE shipping_contract_bids
--     DROP CONSTRAINT IF EXISTS shipping_contract_bids_one_bidder_chk,
--     DROP COLUMN IF EXISTS bid_rate,
--     DROP COLUMN IF EXISTS bidder_corp_id;
-- -- bidder_faction_id stays nullable (no data loss); re-add NOT NULL
-- -- only if all rows have it set.
-- ALTER TABLE entrepreneur_corps DROP COLUMN IF EXISTS freighters_owned;
-- COMMIT;
