-- ════════════════════════════════════════════════════════════════════
-- REAL ESTATE OFFICE — fifth building type
-- ════════════════════════════════════════════════════════════════════
-- Adds 'real_estate_office' to corp_buildings.building_type.
-- Construction corps build it; Real Estate corps own it (sector-
-- locked, same pattern as Port/BO/CY); a Real Estate corp must own
-- a completed RE Office in a nation to LIST properties (any
-- building type) located there. Bidders / buyers are NOT gated by
-- RE Office ownership — only the selling side of retail. The
-- chicken-and-egg this avoids: an RE corp without any RE Offices
-- still needs to be able to ACQUIRE its first one (via wholesale
-- buy_building of Construction's spec build, or via retail offer
-- accepted by another RE corp).
--
-- ── Five RPC bodies CREATE OR REPLACEd ──────────────────────────
-- Each is verbatim from its latest published version plus the
-- narrow additions for the new type:
--
--   begin_construction (20270172):
--       p_building_type IN-list extended.
--       Same cost-of-living × infrastructure scaling applies.
--
--   list_building_for_sale (20270167):
--       NEW gate — if owner_corp.industry = 'real_estate', the
--       owner must own a completed real_estate_office in the
--       building's nation. Returns no_real_estate_office_in_nation.
--       Construction / Banking / Shipping owners that somehow ended
--       up owning a non-RE-Office building (via the legacy
--       industry-agnostic ownership before sector locks) bypass
--       this gate — only RE owners are checked.
--
--   buy_building (20270170):
--       Sector-lock CASE adds real_estate_office → real_estate.
--       Body otherwise verbatim including the wholesale-only
--       (seller_not_real_estate / use_offer_system) gate.
--
--   accept_offer (20270170 + 20270169 atomic-affordability):
--       Sector-lock CASE adds real_estate_office → real_estate.
--       NEW gate (defence-in-depth) — same RE-Office-in-nation
--       check as list_building_for_sale, since the office could
--       have been sold during the 6-tick listing window.
--
--   place_offer (20270170):
--       Sector-lock CASE adds real_estate_office → real_estate.
--       Bidder still gets the fail-fast check at place time so
--       a Banking corp can't bid on an RE Office.
--
-- The corp_buildings CHECK constraint is dropped + re-added with
-- the five-value enum. Idempotent (re-running is a no-op since
-- the dropped constraint has the same name and is re-created).
--
-- ── Cost ────────────────────────────────────────────────────────
-- Real Estate Offices use the same tier × nation-multiplier scale
-- as every other typed building (begin_construction's existing
-- CASE on tier). No special pricing.
--
-- Idempotent. Re-runnable.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Relax the building_type CHECK to allow the 5th value ────

ALTER TABLE corp_buildings DROP CONSTRAINT IF EXISTS corp_buildings_building_type_check;
ALTER TABLE corp_buildings ADD CONSTRAINT corp_buildings_building_type_check
    CHECK (building_type IN ('regional_hq','construction_yard','port','banking_office','real_estate_office'));

-- ── 2. begin_construction — accept the new building_type ───────
-- Verbatim from 20270172 (nation cost scaling) plus the IN-list
-- extension. Tier table unchanged; cost / duration / ambition all
-- scale by the host nation's cost_of_living + physical_infrastructure
-- exactly as before.

CREATE OR REPLACE FUNCTION public.begin_construction(
    p_corp_id        uuid,
    p_nation_id      uuid,
    p_name           text,
    p_tier           text,
    p_building_type  text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_corp         entrepreneur_corps%ROWTYPE;
    v_fac          factions%ROWTYPE;
    v_cost_base    bigint;
    v_dur_base     int;
    v_cost         bigint;
    v_duration     int;
    v_ambition     smallint;
    v_tick         int;
    v_nation_name  text;
    v_col          numeric;
    v_inf          numeric;
    v_col_factor   numeric;
    v_inf_factor   numeric;
    v_mult         numeric;
    v_id           uuid;
    v_has_rhq      boolean;
    v_cy_count     int;
    v_in_progress  int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_name IS NULL OR length(btrim(p_name)) < 2 OR length(btrim(p_name)) > 80 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;
    IF p_tier NOT IN ('small','medium','large','major','monumental') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_tier');
    END IF;
    -- v5: real_estate_office added to the valid set.
    IF p_building_type NOT IN ('regional_hq','construction_yard','port','banking_office','real_estate_office') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_building_type');
    END IF;
    IF p_building_type = 'regional_hq' AND p_tier NOT IN ('small','medium','large') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_rhq_tier');
    END IF;

    CASE p_tier
        WHEN 'small'      THEN v_cost_base := 20000000;   v_dur_base := 24; v_ambition := 1;
        WHEN 'medium'     THEN v_cost_base := 50000000;   v_dur_base := 27; v_ambition := 2;
        WHEN 'large'      THEN v_cost_base := 100000000;  v_dur_base := 30; v_ambition := 3;
        WHEN 'major'      THEN v_cost_base := 200000000;  v_dur_base := 33; v_ambition := 4;
        WHEN 'monumental' THEN v_cost_base := 400000000;  v_dur_base := 36; v_ambition := 5;
    END CASE;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'construction' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_construction_corp');
    END IF;

    SELECT name, COALESCE(cost_of_living, 50), COALESCE(physical_infrastructure, 50)
      INTO v_nation_name, v_col, v_inf
      FROM nations WHERE id = p_nation_id;
    IF v_nation_name IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_found');
    END IF;

    v_col_factor := 0.5 + v_col / 100.0;
    v_inf_factor := 0.5 + (100 - v_inf) / 100.0;
    v_mult       := v_col_factor * v_inf_factor;
    v_cost       := ROUND(v_cost_base::numeric * v_mult)::bigint;
    v_duration   := GREATEST(1, ROUND(v_dur_base::numeric * v_mult)::int);

    IF p_building_type <> 'regional_hq' THEN
        IF p_nation_id <> v_corp.hq_nation_id THEN
            SELECT EXISTS (
                SELECT 1 FROM corp_buildings
                 WHERE owner_corp_id = p_corp_id
                   AND nation_id = p_nation_id
                   AND building_type = 'regional_hq'
                   AND status = 'completed'
            ) INTO v_has_rhq;
            IF NOT v_has_rhq THEN
                RETURN jsonb_build_object('success', false, 'reason', 'no_rhq_in_nation');
            END IF;
        END IF;
    END IF;

    IF p_building_type IN ('port','banking_office','real_estate_office') THEN
        -- v5 design: Real Estate Office is also a 'commercial' build
        -- and goes through the CY capacity gate, same as Port/BO.
        -- Construction corps need CYs to spin up these for-sale
        -- assets at volume.
        SELECT COUNT(*) INTO v_cy_count FROM corp_buildings
         WHERE owner_corp_id = p_corp_id
           AND nation_id = p_nation_id
           AND building_type = 'construction_yard'
           AND status = 'completed';
        SELECT COUNT(*) INTO v_in_progress FROM corp_buildings
         WHERE builder_corp_id = p_corp_id
           AND nation_id = p_nation_id
           AND building_type IN ('port','banking_office','real_estate_office')
           AND status = 'in_progress';
        IF v_in_progress >= v_cy_count * 2 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'capacity_exceeded',
                'cy_count', v_cy_count, 'max', v_cy_count * 2, 'in_progress', v_in_progress);
        END IF;
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

    IF COALESCE(v_fac.party_funds, 0) < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', COALESCE(v_fac.party_funds, 0), 'need', v_cost);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE factions
       SET party_funds  = COALESCE(party_funds, 0) - v_cost,
           ent_ambition = COALESCE(ent_ambition, 0) + v_ambition
     WHERE id = v_fac.id;

    INSERT INTO corp_buildings
        (builder_corp_id, owner_corp_id, nation_id, name, tier, building_type,
         cost_paid, ambition_granted,
         status, started_at_tick, completes_at_tick)
    VALUES
        (p_corp_id, p_corp_id, p_nation_id, btrim(p_name), p_tier, p_building_type,
         v_cost, v_ambition,
         'in_progress', v_tick, v_tick + v_duration)
    RETURNING id INTO v_id;

    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        p_nation_id, v_fac.id,
        'Construction Begins',
        format('%s breaks ground on %s (%s) in %s.',
               v_corp.name, btrim(p_name),
               CASE p_building_type
                   WHEN 'regional_hq'        THEN 'Regional HQ'
                   WHEN 'construction_yard'  THEN 'Construction Yard'
                   WHEN 'port'               THEN 'Port'
                   WHEN 'banking_office'     THEN 'Banking Office'
                   WHEN 'real_estate_office' THEN 'Real Estate Office'
               END,
               v_nation_name),
        'corporate', 'begin_construction',
        jsonb_build_object(
            'building_id',       v_id,
            'corp_id',           p_corp_id,
            'corp_name',         v_corp.name,
            'tier',              p_tier,
            'building_type',     p_building_type,
            'cost',              v_cost,
            'duration',          v_duration,
            'completes_at_tick', v_tick + v_duration,
            'ambition_bump',     v_ambition,
            'cost_multiplier',   ROUND(v_mult, 3),
            'cost_of_living',    v_col,
            'infrastructure',    v_inf
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',           true,
        'building_id',       v_id,
        'tier',              p_tier,
        'building_type',     p_building_type,
        'cost',              v_cost,
        'duration',          v_duration,
        'ambition_bump',     v_ambition,
        'started_at_tick',   v_tick,
        'completes_at_tick', v_tick + v_duration,
        'new_funds',         COALESCE(v_fac.party_funds, 0) - v_cost,
        'cost_multiplier',   ROUND(v_mult, 3)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.begin_construction(uuid, uuid, text, text, text) TO authenticated;

-- ── 3. list_building_for_sale — add RE-Office-in-nation gate ──
-- Verbatim from 20270167 (v1 marketplace) plus the new gate. The
-- gate only fires for RE owners (industry='real_estate'); a non-RE
-- owner listing on the wholesale path is untouched.

CREATE OR REPLACE FUNCTION public.list_building_for_sale(
    p_building_id uuid,
    p_price       bigint
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid         uuid := auth.uid();
    v_fac         factions%ROWTYPE;
    v_building    corp_buildings%ROWTYPE;
    v_owner_corp  entrepreneur_corps%ROWTYPE;
    v_nation_name text;
    v_tick        int;
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

    -- v5 gate: Real Estate sellers need a completed RE Office in
    -- the building's nation. Non-RE owners (Construction listing
    -- wholesale, or non-RE owners who acquired a building before
    -- this gate existed) bypass the check.
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

-- ── 4. buy_building — sector-lock CASE adds real_estate_office ──
-- Verbatim from 20270170 plus one CASE branch.

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
    v_seller_fac_id    uuid;
    v_price            bigint;
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
    IF v_seller_corp.owner_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'seller_orphan');
    END IF;
    v_seller_fac_id := v_seller_corp.owner_faction_id;

    -- Sector-lock — operational buildings can only be owned by
    -- their respective industry. RHQ has no sector lock.
    v_required_sector := CASE v_building.building_type
        WHEN 'construction_yard'  THEN 'construction'
        WHEN 'port'               THEN 'shipping'
        WHEN 'banking_office'     THEN 'banking'
        WHEN 'real_estate_office' THEN 'real_estate'
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

    IF COALESCE(v_fac.party_funds, 0) < v_price THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', COALESCE(v_fac.party_funds, 0), 'need', v_price);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE factions SET party_funds = COALESCE(party_funds, 0) - v_price
     WHERE id = v_fac.id;
    UPDATE factions SET party_funds = COALESCE(party_funds, 0) + v_price
     WHERE id = v_seller_fac_id;

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
            'tier',             v_building.tier
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',           true,
        'building_id',       p_building_id,
        'price',             v_price,
        'new_owner_corp_id', p_buyer_corp_id,
        'seller_corp_id',    v_seller_corp.id,
        'new_funds',         COALESCE(v_fac.party_funds, 0) - v_price
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.buy_building(uuid, uuid) TO authenticated;

-- ── 5. accept_offer — sector-lock + RE-Office-in-nation gate ───
-- Verbatim from 20270170 (which already includes the atomic-
-- affordability audit fix from 20270169) plus the sector-lock CASE
-- branch and the new defence-in-depth RE-Office gate.

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
    v_buyer_fac_id     uuid;
    v_seller_fac_id    uuid;
    v_amount           bigint;
    v_tick             int;
    v_nation_name      text;
    v_rejected_count   int := 0;
    v_buyer_funds      bigint;
    v_required_sector  text;
    v_rep_bonus        int;
    v_has_re_office    boolean;
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
    IF v_seller_corp.owner_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'seller_orphan');
    END IF;
    v_seller_fac_id := v_seller_corp.owner_faction_id;

    -- v5: defence-in-depth on the seller side. list_building_for_sale
    -- already enforces RE-Office-in-nation at list time, but the
    -- office could have been sold during the 6-tick listing window —
    -- re-check at accept time so the listing self-cancels if the
    -- seller has lost their footprint in the nation.
    SELECT EXISTS (
        SELECT 1 FROM corp_buildings
         WHERE owner_corp_id = v_seller_corp.id
           AND nation_id = v_building.nation_id
           AND building_type = 'real_estate_office'
           AND status = 'completed'
    ) INTO v_has_re_office;
    IF NOT v_has_re_office THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_real_estate_office_in_nation');
    END IF;

    SELECT * INTO v_buyer_corp FROM entrepreneur_corps WHERE id = v_offer.buyer_corp_id;
    IF v_buyer_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'buyer_corp_not_found');
    END IF;
    IF v_buyer_corp.owner_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'buyer_orphan');
    END IF;
    v_buyer_fac_id := v_buyer_corp.owner_faction_id;

    v_required_sector := CASE v_building.building_type
        WHEN 'construction_yard'  THEN 'construction'
        WHEN 'port'               THEN 'shipping'
        WHEN 'banking_office'     THEN 'banking'
        WHEN 'real_estate_office' THEN 'real_estate'
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

    UPDATE factions
       SET party_funds = COALESCE(party_funds, 0) - v_amount
     WHERE id = v_buyer_fac_id
       AND COALESCE(party_funds, 0) >= v_amount;
    IF NOT FOUND THEN
        SELECT COALESCE(party_funds, 0) INTO v_buyer_funds
          FROM factions WHERE id = v_buyer_fac_id;
        RETURN jsonb_build_object('success', false, 'reason', 'buyer_insufficient_funds',
            'have', COALESCE(v_buyer_funds, 0), 'need', v_amount);
    END IF;

    UPDATE factions SET party_funds = COALESCE(party_funds, 0) + v_amount
     WHERE id = v_seller_fac_id;

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
            'auto_rejected',    v_rejected_count
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

-- ── 6. place_offer — sector-lock CASE adds real_estate_office ──
-- Verbatim from 20270170 plus one CASE branch. Bidder still gets
-- fail-fast at place time.

CREATE OR REPLACE FUNCTION public.place_offer(
    p_building_id   uuid,
    p_buyer_corp_id uuid,
    p_amount        bigint
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid             uuid := auth.uid();
    v_fac             factions%ROWTYPE;
    v_building        corp_buildings%ROWTYPE;
    v_seller_corp     entrepreneur_corps%ROWTYPE;
    v_buyer_corp      entrepreneur_corps%ROWTYPE;
    v_offer_id        uuid;
    v_tick            int;
    v_nation_name     text;
    v_required_sector text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_building_id IS NULL OR p_buyer_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_amount IS NULL OR p_amount < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_amount');
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
        RETURN jsonb_build_object('success', false, 'reason', 'cannot_offer_on_own_building');
    END IF;

    PERFORM id FROM entrepreneur_corps
     WHERE id IN (p_buyer_corp_id, v_building.owner_corp_id)
     ORDER BY id FOR UPDATE;

    SELECT * INTO v_seller_corp FROM entrepreneur_corps WHERE id = v_building.owner_corp_id;
    IF v_seller_corp.industry <> 'real_estate' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'seller_not_real_estate');
    END IF;

    SELECT * INTO v_buyer_corp FROM entrepreneur_corps WHERE id = p_buyer_corp_id;
    IF v_buyer_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'buyer_corp_not_found');
    END IF;

    v_required_sector := CASE v_building.building_type
        WHEN 'construction_yard'  THEN 'construction'
        WHEN 'port'               THEN 'shipping'
        WHEN 'banking_office'     THEN 'banking'
        WHEN 'real_estate_office' THEN 'real_estate'
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

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO building_offers
        (building_id, buyer_corp_id, amount, status, placed_at_tick)
    VALUES
        (p_building_id, p_buyer_corp_id, p_amount, 'pending', v_tick)
    ON CONFLICT (building_id, buyer_corp_id) WHERE status = 'pending'
    DO UPDATE SET amount = EXCLUDED.amount, placed_at_tick = EXCLUDED.placed_at_tick
    RETURNING id INTO v_offer_id;

    SELECT name INTO v_nation_name FROM nations WHERE id = v_building.nation_id;
    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_building.nation_id, v_fac.id,
        'Offer Placed',
        format('%s offers $%s for %s in %s.',
               v_buyer_corp.name, to_char(p_amount, 'FM999,999,999,999'),
               v_building.name, v_nation_name),
        'corporate', 'building_offer_placed',
        jsonb_build_object(
            'offer_id',         v_offer_id,
            'building_id',      p_building_id,
            'building_name',    v_building.name,
            'building_type',    v_building.building_type,
            'buyer_corp_id',    p_buyer_corp_id,
            'buyer_corp_name',  v_buyer_corp.name,
            'seller_corp_id',   v_seller_corp.id,
            'seller_corp_name', v_seller_corp.name,
            'amount',           p_amount
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',     true,
        'offer_id',    v_offer_id,
        'building_id', p_building_id,
        'amount',      p_amount
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.place_offer(uuid, uuid, bigint) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- BEGIN;
-- ALTER TABLE corp_buildings DROP CONSTRAINT IF EXISTS corp_buildings_building_type_check;
-- ALTER TABLE corp_buildings ADD CONSTRAINT corp_buildings_building_type_check
--     CHECK (building_type IN ('regional_hq','construction_yard','port','banking_office'));
-- -- Re-apply 20270172 (begin_construction), 20270170 (buy/accept/place
-- -- with the 3-branch CASE), 20270167 (list_building_for_sale without
-- -- the RE-Office gate). NOTE: any existing 'real_estate_office' rows
-- -- would violate the narrowed CHECK; delete those first.
-- COMMIT;
