-- ════════════════════════════════════════════════════════════════════
-- BROKERAGE ON OWNED BUILDINGS — Real Estate corps broker any building
-- ════════════════════════════════════════════════════════════════════
-- Design change. Previously a construction corp could only off-load a
-- finished building by SELLING it wholesale to a Real Estate corp
-- (buy_building), which the RE corp then re-flipped. That path is broken
-- for the specialised building types: buy_building requires the buyer to
-- be `real_estate` AND enforces a sector lock (construction_yard→
-- construction, port→shipping, banking_office→banking), which a
-- real_estate buyer can never satisfy. So only regional_hq / real_estate_
-- office were ever sellable.
--
-- New model (brokerage, agreed with design owner):
--   1. Construction corp builds a building → owns it (begin_construction,
--      unchanged: owner_corp_id = builder_corp_id = the construction corp).
--   2. OWNER OPTS IN — the construction corp flags the building
--      "available for brokerage" (offer_building_for_brokerage). This is
--      consent: a RE corp can't list a building the owner wants to keep
--      and operate (e.g. its own construction yards).
--   3. A RE corp TAKES THE LISTING and SETS THE PRICE itself
--      (broker_list_building) — must own a completed Real Estate Office in
--      the building's nation, pays the 2% lock fee (skin-in-the-game,
--      credited to the host nation). The RE corp is the AGENT — it never
--      owns the building.
--   4. A BUYER CORP, sector-matched to the building type, purchases it
--      (broker_buy_listing). Money splits:
--        • RE broker  → 10% of NET PROFIT (sale_price − cost_paid), floor $0
--        • OWNER (construction corp) → THE REST (sale_price − commission)
--      Ownership transfers straight to the buyer. The construction corp is
--      paid ONCE, here; no downstream royalty on later resales.
--
-- The sector-lock contradiction is gone because the RE corp is the broker,
-- not the buyer — so the buyer can be the operator industry (port→shipping)
-- while the RE corp just earns commission.
--
-- ── What changes vs 20270184 ─────────────────────────────────────────
-- 20270184 already brokers UNOWNED (nation-seeded) buildings with the
-- exact 10%-of-profit commission + CEO-rep model; the remainder went to
-- the NATION. This migration:
--   • adds corp_buildings.brokerage_offered (owner opt-in flag);
--   • adds offer_building_for_brokerage (owner sets/clears the flag);
--   • broker_list_building: allow OWNED+offered buildings (was unowned-only);
--   • broker_buy_listing: route the remainder to the OWNER corp's
--     treasury_cash when the building is owned (nation still gets it for
--     the unowned nation-seeded case);
--   • buy_building / list_building_for_sale: guard against acting on a
--     building that is in brokerage (prevents double-sale / bypassing the
--     broker).
-- broker_withdraw_listing is unchanged: it clears the broker columns +
-- list_price but leaves brokerage_offered set, so an owner-offered building
-- becomes relistable by another RE corp after a broker drops it.
--
-- Idempotent. ADD COLUMN IF NOT EXISTS; CREATE OR REPLACE on RPCs.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 0. Shared sector lookup (one source of truth) ─────────────────
-- building_type → the industry a BUYER must be to own/operate it.
-- Previously an inline CASE duplicated in broker_buy_listing,
-- buy_building, and accept_offer. Centralised here; all three call it.
-- (The frontend keeps a small advisory mirror — SECTOR_FOR_TYPE — only
-- to grey out ineligible Buy buttons; the DB stays authoritative.)
CREATE OR REPLACE FUNCTION public.corp_building_required_sector(p_building_type text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE p_building_type
        WHEN 'construction_yard' THEN 'construction'
        WHEN 'port'              THEN 'shipping'
        WHEN 'banking_office'    THEN 'banking'
        ELSE NULL
    END;
$$;

GRANT EXECUTE ON FUNCTION public.corp_building_required_sector(text) TO authenticated;

COMMENT ON FUNCTION public.corp_building_required_sector(text) IS
    'Single source of truth for the building_type → required buyer industry sector-lock. NULL = no restriction (regional_hq, real_estate_office). Called by broker_buy_listing, buy_building, accept_offer.';

-- ── 1. Schema: owner opt-in flag ──────────────────────────────────
ALTER TABLE corp_buildings
    ADD COLUMN IF NOT EXISTS brokerage_offered boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN corp_buildings.brokerage_offered IS
    'Owner opt-in: the owning corp has made this (owned) building available for a Real Estate corp to broker. Required before broker_list_building can lock an owned building. Cleared on sale; left set on broker withdrawal so another RE corp can relist. Irrelevant for unowned (nation-seeded) buildings, which are brokerable without it.';

-- ── 2. offer_building_for_brokerage ──────────────────────────────
-- Owner toggles the opt-in flag. Turning it ON cancels any wholesale
-- listing (list_price) — a building is either wholesale-listed OR
-- offered for brokerage, never both. Cannot toggle while a broker
-- already holds the lock (withdraw must come from the broker side).

CREATE OR REPLACE FUNCTION public.offer_building_for_brokerage(
    p_corp_id     uuid,
    p_building_id uuid,
    p_offer       boolean
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid         uuid := auth.uid();
    v_corp        entrepreneur_corps%ROWTYPE;
    v_fac         factions%ROWTYPE;
    v_building    corp_buildings%ROWTYPE;
    v_had_broker  boolean;
    v_tick        int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_building_id IS NULL OR p_offer IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
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

    -- Brokerage opt-in is for NON-RE owners (e.g. construction) who lack
    -- an in-nation RE office to list directly. Real Estate corps sell
    -- their own inventory via the retail offer path. Restricting it here
    -- also closes a double-sale path: a brokered RE-owned building could
    -- otherwise still be sold through accept_offer (which only checks
    -- seller=real_estate), leaving a stale broker_corp_id behind.
    IF p_offer AND v_corp.industry = 'real_estate' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'real_estate_owner_uses_retail');
    END IF;

    SELECT * INTO v_building FROM corp_buildings WHERE id = p_building_id FOR UPDATE;
    IF v_building.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'building_not_found');
    END IF;
    IF v_building.status <> 'completed' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_completed');
    END IF;
    IF v_building.owner_corp_id IS NULL OR v_building.owner_corp_id <> p_corp_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_building_owner');
    END IF;
    -- p_offer = true on an already-brokered building is a no-op (it is
    -- already offered). p_offer = false REVOKES from any state, so it is
    -- never a no-op while a broker still holds the lock.
    IF p_offer AND v_building.broker_corp_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', true, 'building_id', p_building_id,
            'brokerage_offered', true, 'noop', true);
    END IF;
    IF COALESCE(v_building.brokerage_offered, false) = p_offer
       AND v_building.broker_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', true, 'building_id', p_building_id,
            'brokerage_offered', p_offer, 'noop', true);
    END IF;

    v_had_broker := v_building.broker_corp_id IS NOT NULL;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF p_offer THEN
        -- Offer for brokerage: set the flag, cancel any wholesale listing.
        UPDATE corp_buildings
           SET brokerage_offered = true,
               list_price        = NULL
         WHERE id = p_building_id;
    ELSE
        -- Revoke at any stage: clear the flag AND any active broker lock +
        -- asking price. A broker holding the lock forfeits its
        -- (non-refundable) lock fee, consistent with broker_withdraw_listing.
        UPDATE corp_buildings
           SET brokerage_offered     = false,
               broker_corp_id        = NULL,
               broker_fee_paid       = NULL,
               broker_listed_at_tick = NULL,
               list_price            = NULL
         WHERE id = p_building_id;
    END IF;

    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_building.nation_id, v_fac.id,
        CASE WHEN p_offer THEN 'Building Offered for Brokerage'
                          ELSE 'Brokerage Offer Withdrawn' END,
        format('%s %s %s for brokerage.%s',
               v_corp.name,
               CASE WHEN p_offer THEN 'makes' ELSE 'pulls' END,
               v_building.name,
               CASE WHEN (NOT p_offer) AND v_had_broker
                    THEN ' Broker lock revoked (fee forfeit).' ELSE '' END),
        'corporate',
        CASE WHEN p_offer THEN 'brokerage_offered' ELSE 'brokerage_offer_withdrawn' END,
        jsonb_build_object(
            'building_id',    p_building_id,
            'building_name',  v_building.name,
            'corp_id',        p_corp_id,
            'corp_name',      v_corp.name,
            'offered',        p_offer,
            'broker_revoked', (NOT p_offer) AND v_had_broker,
            'broker_corp_id', v_building.broker_corp_id
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',           true,
        'building_id',       p_building_id,
        'brokerage_offered', p_offer,
        'broker_revoked',    (NOT p_offer) AND v_had_broker
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.offer_building_for_brokerage(uuid, uuid, boolean) TO authenticated;

COMMENT ON FUNCTION public.offer_building_for_brokerage(uuid, uuid, boolean) IS
    'Owner opt-in/out for brokerage. p_offer=true flags a completed building the caller''s (non-RE) corp owns as available for a Real Estate corp to broker, cancelling any wholesale list_price. p_offer=false REVOKES at any stage — including clearing an active broker lock (the broker forfeits its non-refundable lock fee). Owner-gated.';

-- ── 3. broker_list_building — allow OWNED, owner-offered buildings ─
-- Body from 20270184 with the unowned-only gate replaced by:
--   owned  → require brokerage_offered AND broker <> owner
--   unowned→ nation-seeded, allowed as before.

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
    IF v_building.broker_corp_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_brokered',
            'broker_corp_id', v_building.broker_corp_id);
    END IF;

    -- OWNED buildings need owner opt-in; the broker can't be the owner.
    -- UNOWNED (nation-seeded) buildings stay brokerable without a flag.
    IF v_building.owner_corp_id IS NOT NULL THEN
        IF NOT COALESCE(v_building.brokerage_offered, false) THEN
            RETURN jsonb_build_object('success', false, 'reason', 'not_offered_for_brokerage');
        END IF;
        IF v_building.owner_corp_id = p_broker_corp_id THEN
            RETURN jsonb_build_object('success', false, 'reason', 'cannot_broker_own_building');
        END IF;
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

    -- Lock fee: 2% of cost_paid (floor $1). Credited to host nation.
    v_fee := GREATEST(1, (v_building.cost_paid * 2) / 100);

    v_treas := COALESCE(v_broker_corp.treasury_cash, 0);
    IF v_treas < v_fee THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', v_treas::bigint, 'need', v_fee, 'payer', 'corp');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

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
            'building_id',      p_building_id,
            'building_name',    v_building.name,
            'broker_corp_id',   p_broker_corp_id,
            'broker_corp_name', v_broker_corp.name,
            'owner_corp_id',    v_building.owner_corp_id,
            'list_price',       p_list_price,
            'lock_fee',         v_fee,
            'cost_paid',        v_building.cost_paid
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
    'Real Estate corp locks a building as broker and sets the asking price. Brokerable buildings: UNOWNED nation-seeded inventory, OR an OWNED building whose owner has opted in (brokerage_offered) — broker cannot be the owner. Pays 2%% of cost_paid lock fee from treasury_cash (to host nation). Office-gated. Single broker.';

-- ── 4. broker_buy_listing — pay the OWNER (or nation) the remainder ─
-- Body from 20270184. Change: the building may now be OWNED. On sale
-- the commission still goes to the broker; the REMAINDER goes to the
-- owning corp's treasury_cash when owned, or to the nation budget when
-- unowned (nation-seeded). Buyer can't be the owner.

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
    v_owner_corp       entrepreneur_corps%ROWTYPE;
    v_building         corp_buildings%ROWTYPE;
    v_price            bigint;
    v_cost             bigint;
    v_profit           bigint;
    v_commission       bigint;
    v_proceeds         bigint;
    v_rep_delta        smallint;
    v_required_sector  text;
    v_buyer_treas      numeric;
    v_tick             int;
    v_nation_name      text;
    v_is_owned         boolean;
    v_proceeds_to      text;
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
    IF v_building.list_price IS NULL OR v_building.list_price <= 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_list_price');
    END IF;
    IF p_buyer_corp_id = v_building.broker_corp_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'broker_cannot_buy_own_listing');
    END IF;
    IF p_buyer_corp_id = v_building.owner_corp_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cannot_buy_own_building');
    END IF;

    v_is_owned := v_building.owner_corp_id IS NOT NULL;
    v_price    := v_building.list_price;
    v_cost     := v_building.cost_paid;

    -- Lock buyer, broker, and (if owned) owner in a stable order.
    PERFORM id FROM entrepreneur_corps
     WHERE id IN (p_buyer_corp_id, v_building.broker_corp_id, v_building.owner_corp_id)
     ORDER BY id FOR UPDATE;

    SELECT * INTO v_buyer_corp  FROM entrepreneur_corps WHERE id = p_buyer_corp_id;
    SELECT * INTO v_broker_corp FROM entrepreneur_corps WHERE id = v_building.broker_corp_id;
    IF v_buyer_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'buyer_corp_not_found');
    END IF;
    IF v_broker_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'broker_corp_not_found');
    END IF;
    IF v_is_owned THEN
        SELECT * INTO v_owner_corp FROM entrepreneur_corps WHERE id = v_building.owner_corp_id;
        IF v_owner_corp.id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'owner_corp_not_found');
        END IF;
    END IF;

    -- Sector lock: the BUYER (operator) must match the building type.
    -- regional_hq / real_estate_office have no restriction.
    v_required_sector := corp_building_required_sector(v_building.building_type);
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

    v_buyer_treas := COALESCE(v_buyer_corp.treasury_cash, 0);
    IF v_buyer_treas < v_price THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', v_buyer_treas::bigint, 'need', v_price, 'payer', 'corp');
    END IF;

    -- Commission = 10% of net profit (floor $0). Remainder = the rest.
    v_profit     := v_price - v_cost;
    v_commission := GREATEST(0, (v_profit * 10) / 100)::bigint;
    v_proceeds   := v_price - v_commission;

    -- CEO reputation delta on the broker (the selling agent).
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

    -- Remainder → owner corp (owned) or host nation (nation-seeded).
    IF v_is_owned THEN
        v_proceeds_to := 'owner_corp';
        UPDATE entrepreneur_corps
           SET treasury_cash = COALESCE(treasury_cash, 0) + v_proceeds,
               updated_at    = now()
         WHERE id = v_owner_corp.id;
    ELSE
        v_proceeds_to := 'nation';
        UPDATE nations
           SET budget = COALESCE(budget, 0) + v_proceeds::numeric / 1000000
         WHERE id = v_building.nation_id;
    END IF;

    IF v_rep_delta <> 0 AND v_broker_corp.owner_faction_id IS NOT NULL THEN
        UPDATE factions
           SET ent_reputation = COALESCE(ent_reputation, 0) + v_rep_delta
         WHERE id = v_broker_corp.owner_faction_id;
    END IF;

    -- Building changes hands; broker columns + offer flag + price clear.
    UPDATE corp_buildings
       SET owner_corp_id         = p_buyer_corp_id,
           broker_corp_id        = NULL,
           broker_fee_paid       = NULL,
           broker_listed_at_tick = NULL,
           brokerage_offered     = false,
           list_price            = NULL
     WHERE id = p_building_id;

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
        format('%s buys %s in %s for $%s (brokered by %s — commission $%s, %s $%s, CEO rep %s%s).',
               v_buyer_corp.name, v_building.name, v_nation_name,
               to_char(v_price, 'FM999,999,999,999'),
               v_broker_corp.name,
               to_char(v_commission, 'FM999,999,999,999'),
               CASE WHEN v_is_owned THEN COALESCE(v_owner_corp.name, 'owner') ELSE 'nation' END,
               to_char(v_proceeds, 'FM999,999,999,999'),
               CASE WHEN v_rep_delta > 0 THEN '+' ELSE '' END,
               v_rep_delta),
        'corporate', 'broker_sold',
        jsonb_build_object(
            'building_id',      p_building_id,
            'building_name',    v_building.name,
            'building_type',    v_building.building_type,
            'buyer_corp_id',    p_buyer_corp_id,
            'buyer_corp_name',  v_buyer_corp.name,
            'broker_corp_id',   v_broker_corp.id,
            'broker_corp_name', v_broker_corp.name,
            'owner_corp_id',    v_building.owner_corp_id,
            'price',            v_price,
            'cost_paid',        v_cost,
            'commission',       v_commission,
            'proceeds',         v_proceeds,
            'proceeds_to',      v_proceeds_to,
            'ceo_rep_delta',    v_rep_delta,
            'rejected_offers',  v_rejected_offers
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',           true,
        'building_id',       p_building_id,
        'price',             v_price,
        'commission',        v_commission,
        'proceeds',          v_proceeds,
        'proceeds_to',       v_proceeds_to,
        'ceo_rep_delta',     v_rep_delta,
        'new_owner_corp_id', p_buyer_corp_id,
        'buyer_cash_after',  (v_buyer_treas - v_price)::bigint,
        'rejected_offers',   v_rejected_offers
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.broker_buy_listing(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION public.broker_buy_listing(uuid, uuid) IS
    'Buyer corp purchases a broker-listed building. Pays list_price from treasury_cash. Broker receives 10%% of net profit (floored at $0). The REMAINDER goes to the OWNING corp''s treasury_cash if the building is owned (e.g. the construction corp that built it), or to the host nation budget if unowned (nation-seeded). CEO reputation delta applied to the broker. Buyer is sector-locked by building_type; cannot be the broker or the owner. Auto-rejects pending offers.';

-- ── 5. buy_building — guard against brokered buildings ────────────
-- Body from 20270184 with one added gate: a building currently held by
-- a broker can't be bought wholesale (it sells through broker_buy_listing).

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
    IF v_building.broker_corp_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'in_brokerage');
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

    v_required_sector := corp_building_required_sector(v_building.building_type);
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

    v_buyer_treas := COALESCE(v_buyer_corp.treasury_cash, 0);
    IF v_buyer_treas < v_price THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', v_buyer_treas::bigint, 'need', v_price, 'payer', 'corp');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

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
    'Wholesale path: Real Estate corp acquires a non-RE seller''s listed building. Rejects buildings currently in brokerage (in_brokerage). Money moves corp-to-corp via treasury_cash. Sector-lock + RHQ Rep grant unchanged. NOTE: the sector lock makes this reachable only for regional_hq / real_estate_office (a real_estate buyer can''t satisfy construction/shipping/banking) — specialised buildings sell via the brokerage path instead.';

-- ── 6. list_building_for_sale — guard against brokerage state ─────
-- Body from 20270176 with two added gates: can't wholesale-list a
-- building that is currently brokered or offered for brokerage.

CREATE OR REPLACE FUNCTION public.list_building_for_sale(
    p_building_id uuid,
    p_price       bigint
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid           uuid := auth.uid();
    v_fac           factions%ROWTYPE;
    v_building      corp_buildings%ROWTYPE;
    v_owner_corp    entrepreneur_corps%ROWTYPE;
    v_nation_name   text;
    v_tick          int;
    v_has_re_office boolean;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_building_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_price IS NULL OR p_price < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_price');
    END IF;

    SELECT * INTO v_building FROM corp_buildings
     WHERE id = p_building_id FOR UPDATE;
    IF v_building.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'building_not_found');
    END IF;
    IF v_building.status <> 'completed' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_completed');
    END IF;
    IF v_building.owner_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_owner');
    END IF;
    IF v_building.broker_corp_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'in_brokerage');
    END IF;
    IF COALESCE(v_building.brokerage_offered, false) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'offered_for_brokerage');
    END IF;

    SELECT * INTO v_owner_corp FROM entrepreneur_corps
     WHERE id = v_building.owner_corp_id FOR UPDATE;
    IF v_owner_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'owner_corp_not_found');
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
    IF v_owner_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    IF v_owner_corp.industry = 'real_estate' THEN
        SELECT EXISTS (
            SELECT 1 FROM corp_buildings
             WHERE owner_corp_id = v_owner_corp.id
               AND nation_id = v_building.nation_id
               AND building_type = 'real_estate_office'
               AND status = 'completed'
        ) INTO v_has_re_office;
        IF NOT v_has_re_office THEN
            RETURN jsonb_build_object('success', false, 'reason', 'no_real_estate_office_in_nation');
        END IF;
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE corp_buildings SET list_price = p_price WHERE id = p_building_id;

    SELECT name INTO v_nation_name FROM nations WHERE id = v_building.nation_id;
    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_building.nation_id, v_fac.id,
        'Building Listed for Sale',
        format('%s lists %s in %s for sale at $%s.',
               v_owner_corp.name, v_building.name, v_nation_name,
               to_char(p_price, 'FM999,999,999,999')),
        'corporate', 'building_listed',
        jsonb_build_object(
            'building_id',   p_building_id,
            'building_name', v_building.name,
            'corp_id',       v_owner_corp.id,
            'corp_name',     v_owner_corp.name,
            'list_price',    p_price,
            'tier',          v_building.tier
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',     true,
        'building_id', p_building_id,
        'list_price',  p_price
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_building_for_sale(uuid, bigint) TO authenticated;

COMMENT ON FUNCTION public.list_building_for_sale(uuid, bigint) IS
    'Owner-direct (wholesale) listing. Sets list_price on a completed building the caller''s corp owns. Rejects buildings that are brokered (in_brokerage) or offered for brokerage (offered_for_brokerage) — those sell via the broker path. RE-office gate applies only to real_estate owners; non-RE owners (construction wholesale) bypass it.';

-- ── 7. accept_offer — route through the shared sector helper ──────
-- Body verbatim from 20270184 with the inline sector-lock CASE replaced
-- by corp_building_required_sector() (one source of truth). No other
-- behaviour change.

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

    v_required_sector := corp_building_required_sector(v_building.building_type);
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
    'Retail path: RE seller accepts a non-RE buyer offer. Money moves corp-to-corp via treasury_cash. Sector-lock now via corp_building_required_sector() (shared with broker_buy_listing / buy_building). Atomic conditional-UPDATE preserves the 20270169 affordability/debit pattern.';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.offer_building_for_brokerage(uuid, uuid, boolean);
-- DROP FUNCTION IF EXISTS public.corp_building_required_sector(text);
-- -- broker_list_building / broker_buy_listing / buy_building /
-- -- list_building_for_sale / accept_offer revert by re-running the
-- -- 20270184 + 20270176 bodies.
-- ALTER TABLE corp_buildings DROP COLUMN IF EXISTS brokerage_offered;
-- COMMIT;
