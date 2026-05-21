-- ════════════════════════════════════════════════════════════════════
-- REAL-ESTATE BROKERAGE — single-broker lock + 10%-of-profit commission
-- ════════════════════════════════════════════════════════════════════
-- Lets Real Estate corps broker UNOWNED buildings (the
-- nation-seeded inventory from 20270183, or any future abandoned
-- holdings) without acquiring them. Single broker locks at a time;
-- the fee + commission model is:
--
--   • LOCK FEE: 2% of corp_buildings.cost_paid, paid upfront by the
--     broker from treasury_cash → credited to the building's host
--     nation budget. Non-refundable. Creates the skin-in-the-game
--     that single-broker locks need.
--
--   • COMMISSION: on sale, broker receives 10% of NET PROFIT
--     (sale_price − cost_paid). Floored at $0 — selling at or below
--     cost yields no commission AND a reputation hit (see below).
--
--   • CEO REPUTATION on sale (applied to broker.owner_faction_id):
--       sale > cost × 1.20   →  +2 ent_reputation
--       sale > cost × 1.10   →  +1
--       sale  ≥ cost (up to +10%) → 0  (break-even band)
--       sale  < cost          →  −3
--     Tiers are exclusive (band model). No clamp; reputation can go
--     negative — bad brokers earn real deficit and have to recover.
--
--   • NATION'S TAKE: sale_price − commission (full sale price when
--     commission is $0). Always credited to nation.budget in
--     abstract units (raw $/1_000_000 since 20261206).
--
-- ── Why single-broker, not multi ─────────────────────────────────
-- Earlier draft considered N brokers competing on price for the
-- same building. Switched to single-broker-with-lock-fee because:
--   (a) one row per building on the Markets "Properties" surface is
--       cleaner UX,
--   (b) the upfront fee creates real commitment — brokers can't
--       spam-list inventory,
--   (c) the 10%-of-profit + rep penalties already cap broker greed,
--       so within-building competition isn't needed for healthy
--       dynamics.
--
-- ── buy_building / accept_offer money source migration ───────────
-- Pre-20270182, those RPCs debited buyer's owner_faction.party_funds
-- and credited the seller's. Post-treasury (begin_construction +
-- shipping freighters + this brokerage flow), all corp-to-corp money
-- moves via entrepreneur_corps.treasury_cash. This migration ports
-- both to treasury_cash so there's no split source of truth on
-- "where does corp money live".
--
-- ── Schema ───────────────────────────────────────────────────────
-- Three columns on corp_buildings (NO new table — one broker per
-- building means a column-on-row model is the smallest representation):
--   broker_corp_id        REFERENCES entrepreneur_corps(id)
--                         ON DELETE SET NULL
--   broker_fee_paid       bigint   -- audit / display only
--   broker_listed_at_tick int
--
-- Invariant: broker_corp_id IS NOT NULL implies owner_corp_id IS
-- NULL (a broker can only list unowned buildings; on sale the
-- broker columns clear and owner_corp_id sets). Enforced by RPC
-- gates, not a DB CHECK (cheaper).
--
-- ── Edge cases handled ───────────────────────────────────────────
-- • Broker dissolves → ON DELETE SET NULL clears broker_corp_id;
--   building lapses to "lock paid, no broker" state. Future RPC
--   gates treat it as broker_corp_id IS NULL → relistable by anyone.
--   (Cleanup of broker_fee_paid / broker_listed_at_tick on this
--   path is non-critical; columns become orphaned data, not bugs.)
-- • Pending building_offers on a brokered building → broker_buy_listing
--   auto-rejects them on sale (the building is no longer for any
--   other buyer).
-- • Broker tries to broker their own owned building → blocked by
--   the "owner_corp_id IS NULL" gate.
--
-- Idempotent. ADD COLUMN IF NOT EXISTS; CREATE OR REPLACE on RPCs.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema: brokerage columns on corp_buildings ────────────────

ALTER TABLE corp_buildings
    ADD COLUMN IF NOT EXISTS broker_corp_id        uuid REFERENCES entrepreneur_corps(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS broker_fee_paid       bigint,
    ADD COLUMN IF NOT EXISTS broker_listed_at_tick int;

COMMENT ON COLUMN corp_buildings.broker_corp_id IS
    'Real Estate corp currently brokering this UNOWNED building (single broker, exclusive). NULL when the building is not brokered. Mutually exclusive with owner_corp_id: a brokered building has owner_corp_id IS NULL. ON DELETE SET NULL — if the broker dissolves, the lock lapses and the building becomes relistable by another broker.';
COMMENT ON COLUMN corp_buildings.broker_fee_paid IS
    'Lock fee the broker paid to acquire the listing (2%% of cost_paid at lock time). Audit / display only; refunds on withdraw are not issued.';
COMMENT ON COLUMN corp_buildings.broker_listed_at_tick IS
    'Tick the current broker locked the listing. Cleared on sale or withdraw.';

CREATE INDEX IF NOT EXISTS idx_corp_buildings_broker
    ON corp_buildings (broker_corp_id) WHERE broker_corp_id IS NOT NULL;

-- ── 2. broker_list_building ──────────────────────────────────────
-- Real Estate corp pays 2% lock fee + sets the asking price. Same
-- call binds the broker to the building and opens it on the market.

CREATE OR REPLACE FUNCTION public.broker_list_building(
    p_broker_corp_id uuid,
    p_building_id    uuid,
    p_list_price     bigint
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_broker_corp  entrepreneur_corps%ROWTYPE;
    v_fac          factions%ROWTYPE;
    v_building     corp_buildings%ROWTYPE;
    v_fee          bigint;
    v_treas        numeric;
    v_has_office   boolean;
    v_tick         int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_broker_corp_id IS NULL OR p_building_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_list_price IS NULL OR p_list_price <= 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_list_price');
    END IF;

    SELECT * INTO v_broker_corp FROM entrepreneur_corps
     WHERE id = p_broker_corp_id FOR UPDATE;
    IF v_broker_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'broker_corp_not_found');
    END IF;
    IF v_broker_corp.industry <> 'real_estate' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'broker_not_real_estate');
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
    IF v_broker_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_broker_corp_owner');
    END IF;

    SELECT * INTO v_building FROM corp_buildings
     WHERE id = p_building_id FOR UPDATE;
    IF v_building.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'building_not_found');
    END IF;
    IF v_building.status <> 'completed' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_completed');
    END IF;
    IF v_building.owner_corp_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_owned');
    END IF;
    IF v_building.broker_corp_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_brokered',
            'broker_corp_id', v_building.broker_corp_id);
    END IF;

    -- Office gate: broker must have a completed Real Estate Office
    -- in the building's host nation.
    SELECT EXISTS (
        SELECT 1 FROM corp_buildings
         WHERE owner_corp_id  = p_broker_corp_id
           AND nation_id      = v_building.nation_id
           AND building_type  = 'real_estate_office'
           AND status         = 'completed'
    ) INTO v_has_office;
    IF NOT v_has_office THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_real_estate_office_in_nation');
    END IF;

    -- Lock fee: 2% of cost_paid. Floor at $1 so a $0-cost edge case
    -- still costs something (none exist today, defensive).
    v_fee := GREATEST(1, (v_building.cost_paid * 2) / 100);

    v_treas := COALESCE(v_broker_corp.treasury_cash, 0);
    IF v_treas < v_fee THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', v_treas::bigint, 'need', v_fee, 'payer', 'corp');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Atomic: debit broker treasury, credit nation budget (raw → abstract),
    -- lock the building + set asking price.
    UPDATE entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) - v_fee,
           updated_at    = now()
     WHERE id = p_broker_corp_id;

    UPDATE nations
       SET budget = COALESCE(budget, 0) + v_fee::numeric / 1000000
     WHERE id = v_building.nation_id;

    UPDATE corp_buildings
       SET broker_corp_id        = p_broker_corp_id,
           broker_fee_paid       = v_fee,
           broker_listed_at_tick = v_tick,
           list_price            = p_list_price
     WHERE id = p_building_id;

    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_building.nation_id, v_fac.id,
        'Property Listed',
        format('%s lists %s for sale at $%s (lock fee $%s paid to nation).',
               v_broker_corp.name, v_building.name,
               to_char(p_list_price, 'FM999,999,999,999'),
               to_char(v_fee, 'FM999,999,999,999')),
        'corporate', 'broker_listed',
        jsonb_build_object(
            'building_id',     p_building_id,
            'building_name',   v_building.name,
            'broker_corp_id',  p_broker_corp_id,
            'broker_corp_name', v_broker_corp.name,
            'list_price',      p_list_price,
            'lock_fee',        v_fee,
            'cost_paid',       v_building.cost_paid
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',           true,
        'building_id',       p_building_id,
        'broker_corp_id',    p_broker_corp_id,
        'list_price',        p_list_price,
        'lock_fee',          v_fee,
        'broker_cash_after', (v_treas - v_fee)::bigint
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.broker_list_building(uuid, uuid, bigint) TO authenticated;

COMMENT ON FUNCTION public.broker_list_building(uuid, uuid, bigint) IS
    'Real Estate corp locks an unowned building as broker, pays 2%% of cost_paid lock fee from treasury_cash (credited to host nation budget), sets the asking price. Office-gated (must own a completed Real Estate Office in the host nation). Single broker — fails if already brokered. Fee is non-refundable on withdraw.';

-- ── 3. broker_set_price ──────────────────────────────────────────
-- Re-price without re-paying the lock fee. Free as long as the
-- broker still holds the lock.

CREATE OR REPLACE FUNCTION public.broker_set_price(
    p_broker_corp_id uuid,
    p_building_id    uuid,
    p_list_price     bigint
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_broker_corp  entrepreneur_corps%ROWTYPE;
    v_fac          factions%ROWTYPE;
    v_building     corp_buildings%ROWTYPE;
    v_old_price    bigint;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_broker_corp_id IS NULL OR p_building_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_list_price IS NULL OR p_list_price <= 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_list_price');
    END IF;

    SELECT * INTO v_broker_corp FROM entrepreneur_corps
     WHERE id = p_broker_corp_id FOR UPDATE;
    IF v_broker_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'broker_corp_not_found');
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
    IF v_broker_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_broker_corp_owner');
    END IF;

    SELECT * INTO v_building FROM corp_buildings
     WHERE id = p_building_id FOR UPDATE;
    IF v_building.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'building_not_found');
    END IF;
    IF v_building.broker_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_brokered');
    END IF;
    IF v_building.broker_corp_id <> p_broker_corp_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_your_listing');
    END IF;

    v_old_price := v_building.list_price;

    UPDATE corp_buildings
       SET list_price = p_list_price
     WHERE id = p_building_id;

    RETURN jsonb_build_object(
        'success',     true,
        'building_id', p_building_id,
        'old_price',   v_old_price,
        'new_price',   p_list_price
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.broker_set_price(uuid, uuid, bigint) TO authenticated;

COMMENT ON FUNCTION public.broker_set_price(uuid, uuid, bigint) IS
    'Active broker re-prices their listing. Free (no additional fee). Caller must currently hold the broker lock on the building.';

-- ── 4. broker_withdraw_listing ───────────────────────────────────
-- Broker pulls their listing. Fee is sunk; no refund. Building
-- becomes relistable by any RE corp.

CREATE OR REPLACE FUNCTION public.broker_withdraw_listing(
    p_broker_corp_id uuid,
    p_building_id    uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_broker_corp  entrepreneur_corps%ROWTYPE;
    v_fac          factions%ROWTYPE;
    v_building     corp_buildings%ROWTYPE;
    v_tick         int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_broker_corp_id IS NULL OR p_building_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_broker_corp FROM entrepreneur_corps
     WHERE id = p_broker_corp_id FOR UPDATE;
    IF v_broker_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'broker_corp_not_found');
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
    IF v_broker_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_broker_corp_owner');
    END IF;

    SELECT * INTO v_building FROM corp_buildings
     WHERE id = p_building_id FOR UPDATE;
    IF v_building.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'building_not_found');
    END IF;
    IF v_building.broker_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_brokered');
    END IF;
    IF v_building.broker_corp_id <> p_broker_corp_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_your_listing');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE corp_buildings
       SET broker_corp_id        = NULL,
           broker_fee_paid       = NULL,
           broker_listed_at_tick = NULL,
           list_price            = NULL
     WHERE id = p_building_id;

    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_building.nation_id, v_fac.id,
        'Listing Withdrawn',
        format('%s withdraws %s from sale (lock fee forfeit).',
               v_broker_corp.name, v_building.name),
        'corporate', 'broker_withdrew',
        jsonb_build_object(
            'building_id',     p_building_id,
            'building_name',   v_building.name,
            'broker_corp_id',  p_broker_corp_id,
            'fee_forfeit',     v_building.broker_fee_paid
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',     true,
        'building_id', p_building_id,
        'fee_forfeit', v_building.broker_fee_paid
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.broker_withdraw_listing(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION public.broker_withdraw_listing(uuid, uuid) IS
    'Broker drops their listing. Lock fee is forfeit (non-refundable). Building returns to unowned/unlocked state, any RE corp can relist.';

-- ── 5. broker_buy_listing ────────────────────────────────────────
-- Buyer corp purchases a broker-listed building. Splits the sale
-- price: broker gets 10% of net profit, nation gets the rest.
-- Applies CEO reputation delta on the broker.

CREATE OR REPLACE FUNCTION public.broker_buy_listing(
    p_buyer_corp_id uuid,
    p_building_id   uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid              uuid := auth.uid();
    v_fac              factions%ROWTYPE;
    v_buyer_corp       entrepreneur_corps%ROWTYPE;
    v_broker_corp      entrepreneur_corps%ROWTYPE;
    v_building         corp_buildings%ROWTYPE;
    v_price            bigint;
    v_cost             bigint;
    v_profit           bigint;
    v_commission       bigint;
    v_nation_take      bigint;
    v_rep_delta        smallint;
    v_required_sector  text;
    v_buyer_treas      numeric;
    v_tick             int;
    v_nation_name      text;
    v_rejected_offers  int := 0;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_buyer_corp_id IS NULL OR p_building_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_building FROM corp_buildings
     WHERE id = p_building_id FOR UPDATE;
    IF v_building.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'building_not_found');
    END IF;
    IF v_building.status <> 'completed' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_completed');
    END IF;
    IF v_building.broker_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_brokered');
    END IF;
    IF v_building.owner_corp_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_owned');
    END IF;
    IF v_building.list_price IS NULL OR v_building.list_price <= 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_list_price');
    END IF;
    IF p_buyer_corp_id = v_building.broker_corp_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'broker_cannot_buy_own_listing');
    END IF;
    v_price := v_building.list_price;
    v_cost  := v_building.cost_paid;

    -- Lock both corps in a stable order to avoid deadlocks.
    PERFORM id FROM entrepreneur_corps
     WHERE id IN (p_buyer_corp_id, v_building.broker_corp_id)
     ORDER BY id FOR UPDATE;

    SELECT * INTO v_buyer_corp  FROM entrepreneur_corps WHERE id = p_buyer_corp_id;
    SELECT * INTO v_broker_corp FROM entrepreneur_corps WHERE id = v_building.broker_corp_id;
    IF v_buyer_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'buyer_corp_not_found');
    END IF;
    IF v_broker_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'broker_corp_not_found');
    END IF;

    -- Sector lock: matches buy_building's rule. RHQ + real_estate_office
    -- have no sector restriction (any industry can own an RHQ;
    -- broker-listed real_estate_offices technically buyable by any
    -- industry but exposure is moot — seeds exclude RE offices).
    v_required_sector := CASE v_building.building_type
        WHEN 'construction_yard' THEN 'construction'
        WHEN 'port'              THEN 'shipping'
        WHEN 'banking_office'    THEN 'banking'
        ELSE NULL
    END;
    IF v_required_sector IS NOT NULL AND v_buyer_corp.industry <> v_required_sector THEN
        RETURN jsonb_build_object('success', false, 'reason', 'wrong_sector',
            'required', v_required_sector, 'have', v_buyer_corp.industry);
    END IF;

    -- Caller must own the buyer corp.
    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;
    IF v_buyer_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_buyer_corp_owner');
    END IF;

    -- Buyer corp treasury check.
    v_buyer_treas := COALESCE(v_buyer_corp.treasury_cash, 0);
    IF v_buyer_treas < v_price THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', v_buyer_treas::bigint, 'need', v_price, 'payer', 'corp');
    END IF;

    -- Money split. Commission = 10% of net profit, floored at $0.
    -- Nation gets the rest (full price when commission is 0).
    v_profit      := v_price - v_cost;
    v_commission  := GREATEST(0, (v_profit * 10) / 100)::bigint;
    v_nation_take := v_price - v_commission;

    -- CEO reputation delta. Bands are exclusive: a sale at +25% gives
    -- +2 only (not +1 then +2). No clamp on ent_reputation.
    v_rep_delta := CASE
        WHEN v_price > (v_cost * 120) / 100 THEN 2::smallint
        WHEN v_price > (v_cost * 110) / 100 THEN 1::smallint
        WHEN v_price < v_cost                THEN -3::smallint
        ELSE 0::smallint
    END;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Atomic settlement.
    UPDATE entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) - v_price,
           updated_at    = now()
     WHERE id = p_buyer_corp_id;

    IF v_commission > 0 THEN
        UPDATE entrepreneur_corps
           SET treasury_cash = COALESCE(treasury_cash, 0) + v_commission,
               updated_at    = now()
         WHERE id = v_broker_corp.id;
    END IF;

    UPDATE nations
       SET budget = COALESCE(budget, 0) + v_nation_take::numeric / 1000000
     WHERE id = v_building.nation_id;

    IF v_rep_delta <> 0 AND v_broker_corp.owner_faction_id IS NOT NULL THEN
        UPDATE factions
           SET ent_reputation = COALESCE(ent_reputation, 0) + v_rep_delta
         WHERE id = v_broker_corp.owner_faction_id;
    END IF;

    -- Building changes hands; broker columns + list_price clear.
    UPDATE corp_buildings
       SET owner_corp_id         = p_buyer_corp_id,
           broker_corp_id        = NULL,
           broker_fee_paid       = NULL,
           broker_listed_at_tick = NULL,
           list_price            = NULL
     WHERE id = p_building_id;

    -- Auto-reject any pending offers on this building (the building
    -- has a new owner; existing offers are stale).
    UPDATE building_offers
       SET status = 'rejected', finalized_at_tick = v_tick
     WHERE building_id = p_building_id
       AND status = 'pending';
    GET DIAGNOSTICS v_rejected_offers = ROW_COUNT;

    SELECT name INTO v_nation_name FROM nations WHERE id = v_building.nation_id;
    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_building.nation_id, v_fac.id,
        'Property Sold',
        format('%s buys %s in %s for $%s (brokered by %s — commission $%s, nation $%s, CEO rep %s%s).',
               v_buyer_corp.name, v_building.name, v_nation_name,
               to_char(v_price, 'FM999,999,999,999'),
               v_broker_corp.name,
               to_char(v_commission, 'FM999,999,999,999'),
               to_char(v_nation_take, 'FM999,999,999,999'),
               CASE WHEN v_rep_delta > 0 THEN '+' ELSE '' END,
               v_rep_delta),
        'corporate', 'broker_sold',
        jsonb_build_object(
            'building_id',       p_building_id,
            'building_name',     v_building.name,
            'building_type',     v_building.building_type,
            'buyer_corp_id',     p_buyer_corp_id,
            'buyer_corp_name',   v_buyer_corp.name,
            'broker_corp_id',    v_broker_corp.id,
            'broker_corp_name',  v_broker_corp.name,
            'price',             v_price,
            'cost_paid',         v_cost,
            'commission',        v_commission,
            'nation_take',       v_nation_take,
            'ceo_rep_delta',     v_rep_delta,
            'rejected_offers',   v_rejected_offers
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',           true,
        'building_id',       p_building_id,
        'price',             v_price,
        'commission',        v_commission,
        'nation_take',       v_nation_take,
        'ceo_rep_delta',     v_rep_delta,
        'new_owner_corp_id', p_buyer_corp_id,
        'buyer_cash_after',  (v_buyer_treas - v_price)::bigint,
        'rejected_offers',   v_rejected_offers
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.broker_buy_listing(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION public.broker_buy_listing(uuid, uuid) IS
    'Buyer corp purchases a broker-listed building. Pays list_price from treasury_cash. Broker receives 10%% of net profit (floored at $0); host nation receives the rest. CEO reputation delta applied to broker owner_faction: +2 (>+20%% over cost), +1 (>+10%%), 0 (break-even band), −3 (<cost). Sector-locked by building_type → buyer industry. Auto-rejects pending offers on the building.';

-- ── 6. buy_building — migrate to treasury_cash ──────────────────
-- Body verbatim from 20270170 (sector-lock + RHQ rep grant), with
-- the money path swapped from buyer/seller party_funds to buyer/
-- seller treasury_cash. Caller still gates on owning the buyer corp.

CREATE OR REPLACE FUNCTION public.buy_building(
    p_building_id   uuid,
    p_buyer_corp_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid              uuid := auth.uid();
    v_fac              factions%ROWTYPE;
    v_building         corp_buildings%ROWTYPE;
    v_buyer_corp       entrepreneur_corps%ROWTYPE;
    v_seller_corp      entrepreneur_corps%ROWTYPE;
    v_price            bigint;
    v_buyer_treas      numeric;
    v_tick             int;
    v_nation_name      text;
    v_required_sector  text;
    v_rep_bonus        int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_building_id IS NULL OR p_buyer_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_building FROM corp_buildings
     WHERE id = p_building_id FOR UPDATE;
    IF v_building.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'building_not_found');
    END IF;
    IF v_building.list_price IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_for_sale');
    END IF;
    IF v_building.status <> 'completed' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_completed');
    END IF;
    IF v_building.owner_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_seller');
    END IF;
    IF p_buyer_corp_id = v_building.owner_corp_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cannot_buy_own_building');
    END IF;
    v_price := v_building.list_price;

    PERFORM id FROM entrepreneur_corps
     WHERE id IN (p_buyer_corp_id, v_building.owner_corp_id)
     ORDER BY id FOR UPDATE;

    SELECT * INTO v_buyer_corp FROM entrepreneur_corps WHERE id = p_buyer_corp_id;
    IF v_buyer_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'buyer_corp_not_found');
    END IF;
    IF v_buyer_corp.industry <> 'real_estate' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'buyer_not_real_estate');
    END IF;

    SELECT * INTO v_seller_corp FROM entrepreneur_corps WHERE id = v_building.owner_corp_id;
    IF v_seller_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'seller_corp_not_found');
    END IF;
    IF v_seller_corp.industry = 'real_estate' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'use_offer_system');
    END IF;

    v_required_sector := CASE v_building.building_type
        WHEN 'construction_yard' THEN 'construction'
        WHEN 'port'              THEN 'shipping'
        WHEN 'banking_office'    THEN 'banking'
        ELSE NULL
    END;
    IF v_required_sector IS NOT NULL AND v_buyer_corp.industry <> v_required_sector THEN
        RETURN jsonb_build_object('success', false, 'reason', 'wrong_sector',
            'required', v_required_sector, 'have', v_buyer_corp.industry);
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
    IF v_buyer_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_buyer_corp_owner');
    END IF;

    -- Treasury-cash check (migrated from party_funds).
    v_buyer_treas := COALESCE(v_buyer_corp.treasury_cash, 0);
    IF v_buyer_treas < v_price THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', v_buyer_treas::bigint, 'need', v_price, 'payer', 'corp');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Atomic corp-to-corp transfer via treasury_cash.
    UPDATE entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) - v_price,
           updated_at    = now()
     WHERE id = p_buyer_corp_id;
    UPDATE entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) + v_price,
           updated_at    = now()
     WHERE id = v_seller_corp.id;

    UPDATE corp_buildings
       SET owner_corp_id = p_buyer_corp_id,
           list_price    = NULL
     WHERE id = p_building_id;

    -- RHQ acquisition Rep grant kept (no-op on this wholesale path
    -- since buyer is gated to real_estate above, but symmetric with
    -- accept_offer).
    IF v_building.building_type = 'regional_hq' AND v_buyer_corp.industry <> 'real_estate' THEN
        v_rep_bonus := CASE v_building.tier
            WHEN 'small'  THEN 0
            WHEN 'medium' THEN 1
            WHEN 'large'  THEN 2
            ELSE 0
        END;
        IF v_rep_bonus > 0 THEN
            UPDATE factions
               SET ent_reputation = COALESCE(ent_reputation, 0) + v_rep_bonus
             WHERE id = v_buyer_corp.owner_faction_id;
        END IF;
    END IF;

    SELECT name INTO v_nation_name FROM nations WHERE id = v_building.nation_id;
    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_building.nation_id, v_fac.id,
        'Building Acquired',
        format('%s acquires %s in %s from %s for $%s.',
               v_buyer_corp.name, v_building.name, v_nation_name,
               v_seller_corp.name, to_char(v_price, 'FM999,999,999,999')),
        'corporate', 'building_purchased',
        jsonb_build_object(
            'building_id',      p_building_id,
            'building_name',    v_building.name,
            'building_type',    v_building.building_type,
            'buyer_corp_id',    p_buyer_corp_id,
            'buyer_corp_name',  v_buyer_corp.name,
            'seller_corp_id',   v_seller_corp.id,
            'seller_corp_name', v_seller_corp.name,
            'price',            v_price,
            'tier',             v_building.tier,
            'payer',            'corp_treasury'
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',           true,
        'building_id',       p_building_id,
        'price',             v_price,
        'new_owner_corp_id', p_buyer_corp_id,
        'seller_corp_id',    v_seller_corp.id,
        'buyer_cash_after',  (v_buyer_treas - v_price)::bigint
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.buy_building(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION public.buy_building(uuid, uuid) IS
    'Wholesale path: Real Estate corp acquires a non-RE seller''s listed building. Money moves corp-to-corp via treasury_cash (migrated from party_funds post-20270182). Sector-lock + RHQ Rep grant unchanged.';

-- ── 7. accept_offer — migrate to treasury_cash ───────────────────
-- Body verbatim from 20270170, money path swapped. The atomic
-- conditional UPDATE pattern is preserved (debit + affordability
-- check in one row-level lock).

CREATE OR REPLACE FUNCTION public.accept_offer(p_offer_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid              uuid := auth.uid();
    v_fac              factions%ROWTYPE;
    v_offer            building_offers%ROWTYPE;
    v_building         corp_buildings%ROWTYPE;
    v_seller_corp      entrepreneur_corps%ROWTYPE;
    v_buyer_corp       entrepreneur_corps%ROWTYPE;
    v_amount           bigint;
    v_tick             int;
    v_nation_name      text;
    v_rejected_count   int := 0;
    v_buyer_treas      numeric;
    v_required_sector  text;
    v_rep_bonus        int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_offer_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_offer FROM building_offers
     WHERE id = p_offer_id FOR UPDATE;
    IF v_offer.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'offer_not_found');
    END IF;
    IF v_offer.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'offer_not_pending');
    END IF;
    v_amount := v_offer.amount;

    SELECT * INTO v_building FROM corp_buildings
     WHERE id = v_offer.building_id FOR UPDATE;
    IF v_building.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'building_not_found');
    END IF;
    IF v_building.list_price IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_for_sale');
    END IF;
    IF v_building.status <> 'completed' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_completed');
    END IF;
    IF v_building.owner_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_seller');
    END IF;

    PERFORM id FROM entrepreneur_corps
     WHERE id IN (v_offer.buyer_corp_id, v_building.owner_corp_id)
     ORDER BY id FOR UPDATE;

    SELECT * INTO v_seller_corp FROM entrepreneur_corps WHERE id = v_building.owner_corp_id;
    IF v_seller_corp.industry <> 'real_estate' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'seller_not_real_estate');
    END IF;

    SELECT * INTO v_buyer_corp FROM entrepreneur_corps WHERE id = v_offer.buyer_corp_id;
    IF v_buyer_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'buyer_corp_not_found');
    END IF;

    v_required_sector := CASE v_building.building_type
        WHEN 'construction_yard' THEN 'construction'
        WHEN 'port'              THEN 'shipping'
        WHEN 'banking_office'    THEN 'banking'
        ELSE NULL
    END;
    IF v_required_sector IS NOT NULL AND v_buyer_corp.industry <> v_required_sector THEN
        RETURN jsonb_build_object('success', false, 'reason', 'wrong_sector',
            'required', v_required_sector, 'have', v_buyer_corp.industry);
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
    IF v_seller_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_seller_corp_owner');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Atomic affordability + debit on buyer corp's treasury_cash
    -- (migrated from party_funds). Same conditional-UPDATE pattern
    -- the 20270169 audit established — debit only if balance covers.
    UPDATE entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) - v_amount,
           updated_at    = now()
     WHERE id = v_buyer_corp.id
       AND COALESCE(treasury_cash, 0) >= v_amount;
    IF NOT FOUND THEN
        SELECT COALESCE(treasury_cash, 0) INTO v_buyer_treas
          FROM entrepreneur_corps WHERE id = v_buyer_corp.id;
        RETURN jsonb_build_object('success', false, 'reason', 'buyer_insufficient_funds',
            'have', COALESCE(v_buyer_treas, 0)::bigint, 'need', v_amount, 'payer', 'corp');
    END IF;

    UPDATE entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) + v_amount,
           updated_at    = now()
     WHERE id = v_seller_corp.id;

    UPDATE corp_buildings
       SET owner_corp_id = v_offer.buyer_corp_id,
           list_price    = NULL
     WHERE id = v_offer.building_id;

    IF v_building.building_type = 'regional_hq' AND v_buyer_corp.industry <> 'real_estate' THEN
        v_rep_bonus := CASE v_building.tier
            WHEN 'small'  THEN 0
            WHEN 'medium' THEN 1
            WHEN 'large'  THEN 2
            ELSE 0
        END;
        IF v_rep_bonus > 0 THEN
            UPDATE factions
               SET ent_reputation = COALESCE(ent_reputation, 0) + v_rep_bonus
             WHERE id = v_buyer_corp.owner_faction_id;
        END IF;
    END IF;

    UPDATE building_offers
       SET status = 'accepted', finalized_at_tick = v_tick
     WHERE id = p_offer_id;
    UPDATE building_offers
       SET status = 'rejected', finalized_at_tick = v_tick
     WHERE building_id = v_offer.building_id
       AND status = 'pending'
       AND id <> p_offer_id;
    GET DIAGNOSTICS v_rejected_count = ROW_COUNT;

    SELECT name INTO v_nation_name FROM nations WHERE id = v_building.nation_id;
    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_building.nation_id, v_fac.id,
        'Offer Accepted',
        format('%s accepts $%s offer from %s for %s.',
               v_seller_corp.name, to_char(v_amount, 'FM999,999,999,999'),
               v_buyer_corp.name, v_building.name),
        'corporate', 'building_offer_accepted',
        jsonb_build_object(
            'offer_id',         p_offer_id,
            'building_id',      v_offer.building_id,
            'building_name',    v_building.name,
            'building_type',    v_building.building_type,
            'buyer_corp_id',    v_offer.buyer_corp_id,
            'buyer_corp_name',  v_buyer_corp.name,
            'seller_corp_id',   v_seller_corp.id,
            'seller_corp_name', v_seller_corp.name,
            'amount',           v_amount,
            'auto_rejected',    v_rejected_count,
            'payer',            'corp_treasury'
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',           true,
        'offer_id',          p_offer_id,
        'building_id',       v_offer.building_id,
        'amount',            v_amount,
        'auto_rejected',     v_rejected_count,
        'new_owner_corp_id', v_offer.buyer_corp_id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_offer(uuid) TO authenticated;

COMMENT ON FUNCTION public.accept_offer(uuid) IS
    'Retail path: RE seller accepts a non-RE buyer offer. Money moves corp-to-corp via treasury_cash (migrated from party_funds post-20270182). Sector-lock + RHQ Rep grant unchanged. Atomic conditional-UPDATE preserves the 20270169 affordability/debit pattern.';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.broker_buy_listing(uuid, uuid);
-- DROP FUNCTION IF EXISTS public.broker_withdraw_listing(uuid, uuid);
-- DROP FUNCTION IF EXISTS public.broker_set_price(uuid, uuid, bigint);
-- DROP FUNCTION IF EXISTS public.broker_list_building(uuid, uuid, bigint);
-- -- buy_building / accept_offer revert by re-running 20270170 bodies.
-- DROP INDEX IF EXISTS idx_corp_buildings_broker;
-- ALTER TABLE corp_buildings
--     DROP COLUMN IF EXISTS broker_listed_at_tick,
--     DROP COLUMN IF EXISTS broker_fee_paid,
--     DROP COLUMN IF EXISTS broker_corp_id;
-- COMMIT;
