-- ════════════════════════════════════════════════════════════════════
-- CONSTRUCTION v3 — typed buildings (RHQ / CY / Port / BO)
-- ════════════════════════════════════════════════════════════════════
-- Adds the four-type catalog to corp_buildings, with type-specific
-- gating, capacity rules, sector-locked ownership, and a Reputation
-- bonus on RHQ acquisition by sector corps.
--
-- ── Building catalog ────────────────────────────────────────────
--   regional_hq        — admin presence in a nation. Required for
--                        the corp to do anything else in that
--                        nation. Tier limited to small/medium/large.
--                        Acquisition by a non-RE corp grants the
--                        buyer faction +0/+1/+2 Reputation (per
--                        tier). RE-to-RE pass-throughs grant no
--                        Reputation (middleman not setting up shop).
--   construction_yard  — capacity infrastructure. Each completed
--                        CY a Construction corp owns in a nation
--                        contributes +2 concurrent project slots
--                        for Port/Banking-Office builds in that
--                        nation. Sector-locked: must be owned by
--                        industry='construction'.
--   port               — Shipping operational building. Sector-
--                        locked: must be owned by industry=
--                        'shipping'. Operational unlocks (route
--                        claims) deferred to v4 — v3 only tracks
--                        ownership.
--   banking_office     — Banking operational building. Sector-
--                        locked: must be owned by industry=
--                        'banking'. Loan-issuance unlock deferred
--                        to v4.
--
-- ── Build-time gates ────────────────────────────────────────────
-- begin_construction(p_corp_id, p_nation_id, p_name, p_tier,
--                    p_building_type):
--
--   1. type='regional_hq': any nation allowed (RHQ is the bootstrap).
--      Tier must be small/medium/large.
--   2. type='construction_yard' | 'port' | 'banking_office':
--      Requires RHQ-in-nation: corp must own a completed RHQ in
--      the target nation, OR target nation = HQ (implicit RHQ at
--      corp founding — corp is BORN there, no need to build one).
--   3. type IN ('port', 'banking_office'): capacity check —
--      in-progress P/BO count in nation by this corp must be <
--      (owned completed CYs in nation) * 2. HQ nation gets NO
--      implicit CY (per locked decision) — corp must build CYs
--      to unlock Port/BO capacity. RHQ and CY builds bypass the
--      capacity check (they're infrastructure, not commercial).
--
-- ── Acquisition rules ───────────────────────────────────────────
-- buy_building (wholesale) and accept_offer (retail) both:
--   - Sector-lock check: operational buildings must match buyer
--     sector. CY → construction, Port → shipping, BO → banking.
--     RHQ has no sector lock.
--   - Reputation grant: when an RHQ moves to a non-RE buyer,
--     credit the buyer faction's ent_reputation by the tier
--     bonus (+0 small, +1 medium, +2 large). RE-to-RE transfers
--     grant nothing.
--
-- place_offer also pre-validates the sector lock so the buyer gets
-- immediate feedback rather than discovering at accept time.
--
-- ── One-time cleanup ────────────────────────────────────────────
-- Per locked decision, every pre-v3 corp_buildings row is deleted
-- on migration apply (column ADD nullable → DELETE WHERE NULL →
-- ALTER NOT NULL). Idempotent: re-running finds zero NULL-type
-- rows and the wipe is a no-op. building_offers cascades via the
-- existing FK ON DELETE CASCADE. Money spent on v0-v2 buildings is
-- a sunk cost (no refund); event_log entries persist as history.
--
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema: add building_type, wipe legacy rows ──────────────

ALTER TABLE corp_buildings
    ADD COLUMN IF NOT EXISTS building_type text;

-- One-time wipe of pre-v3 rows. Idempotent: on re-run, every row
-- has a non-NULL type so this is a no-op. building_offers rows
-- CASCADE via the existing FK.
DELETE FROM corp_buildings WHERE building_type IS NULL;

-- Now safe to enforce NOT NULL + CHECK (table is empty of bad rows).
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
         WHERE conrelid = 'public.corp_buildings'::regclass
           AND conname  = 'corp_buildings_building_type_check'
    ) THEN
        ALTER TABLE corp_buildings
            ADD CONSTRAINT corp_buildings_building_type_check
            CHECK (building_type IN ('regional_hq','construction_yard','port','banking_office'));
    END IF;
END$$;

ALTER TABLE corp_buildings
    ALTER COLUMN building_type SET NOT NULL;

COMMENT ON COLUMN corp_buildings.building_type IS
    'Typed catalog (v3). regional_hq = admin presence (S/M/L only; grants buyer Rep on non-RE acquisition). construction_yard = +2 P/BO capacity per CY in nation (sector-locked: construction). port = Shipping operational (sector-locked: shipping). banking_office = Banking operational (sector-locked: banking).';

-- Index for the RHQ-in-nation prereq check and the CY capacity
-- count — both lookups are by (corp, nation, type, status).
CREATE INDEX IF NOT EXISTS idx_corp_buildings_owner_nation_type
    ON corp_buildings (owner_corp_id, nation_id, building_type, status);

-- ── 2. begin_construction — type-aware ──────────────────────────
-- Adds p_building_type. Signature change → DROP old + CREATE new
-- (PostgREST routes by argument names). The body keeps the v2 lock
-- order (corp first), then adds RHQ-prereq + CY-capacity gates.

DROP FUNCTION IF EXISTS public.begin_construction(uuid, uuid, text, text);

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
    v_cost         bigint;
    v_duration     int;
    v_ambition     smallint;
    v_tick         int;
    v_nation_name  text;
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
    IF p_building_type NOT IN ('regional_hq','construction_yard','port','banking_office') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_building_type');
    END IF;
    -- RHQ profile is S/M/L only (per locked design: variable profile,
    -- 3 levels mapped to the existing tier table's bottom three slots).
    IF p_building_type = 'regional_hq' AND p_tier NOT IN ('small','medium','large') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_rhq_tier');
    END IF;

    -- Tier table — server-authoritative (matches the JS TIER_TABLE
    -- on entrepreneur-corp.html for the client display).
    CASE p_tier
        WHEN 'small'      THEN v_cost := 1000000;   v_duration := 24; v_ambition := 1;
        WHEN 'medium'     THEN v_cost := 5000000;   v_duration := 27; v_ambition := 2;
        WHEN 'large'      THEN v_cost := 20000000;  v_duration := 30; v_ambition := 3;
        WHEN 'major'      THEN v_cost := 50000000;  v_duration := 33; v_ambition := 4;
        WHEN 'monumental' THEN v_cost := 100000000; v_duration := 36; v_ambition := 5;
    END CASE;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'construction' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_construction_corp');
    END IF;

    SELECT name INTO v_nation_name FROM nations WHERE id = p_nation_id;
    IF v_nation_name IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_found');
    END IF;

    -- Type-dependent nation gate. RHQs bootstrap (any nation OK).
    -- Other types need an RHQ in the target nation, or the corp's
    -- HQ nation (implicit RHQ at founding).
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

    -- Capacity gate for Port/Banking-Office: CYs owned in nation x 2.
    -- RHQ and CY builds are infrastructure and bypass this check
    -- (locked design: HQ has no implicit CY → CYs must be earned).
    IF p_building_type IN ('port','banking_office') THEN
        SELECT COUNT(*) INTO v_cy_count FROM corp_buildings
         WHERE owner_corp_id = p_corp_id
           AND nation_id = p_nation_id
           AND building_type = 'construction_yard'
           AND status = 'completed';
        SELECT COUNT(*) INTO v_in_progress FROM corp_buildings
         WHERE builder_corp_id = p_corp_id
           AND nation_id = p_nation_id
           AND building_type IN ('port','banking_office')
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
                   WHEN 'regional_hq'       THEN 'Regional HQ'
                   WHEN 'construction_yard' THEN 'Construction Yard'
                   WHEN 'port'              THEN 'Port'
                   WHEN 'banking_office'    THEN 'Banking Office'
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
            'ambition_bump',     v_ambition
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
        'new_funds',         COALESCE(v_fac.party_funds, 0) - v_cost
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.begin_construction(uuid, uuid, text, text, text) TO authenticated;

COMMENT ON FUNCTION public.begin_construction(uuid, uuid, text, text, text) IS
    'Construction-corp owner-only. v3 adds p_building_type. RHQ tier limited to S/M/L. Non-RHQ builds require RHQ-in-nation (HQ nation implicit). Port/BO builds capacity-gated by owned CY count × 2. RHQ + CY bypass capacity (infrastructure).';

-- ── 3. buy_building — sector-lock + RHQ Rep grant ───────────────
-- Body verbatim from 20270167, plus two new IF blocks: sector-lock
-- on operational building types, and Reputation grant on RHQ
-- acquisition by a non-RE buyer.

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

    -- v3: sector-lock for operational buildings. Only RHQ has no
    -- sector restriction (any industry can own one). RE corps are
    -- the only buyers via the wholesale path though (gate above);
    -- the lock here exists so the same RPC body is used by future
    -- non-RE wholesale paths if we ever open them up.
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

    -- v3: Reputation grant on RHQ acquisition by non-RE buyer.
    -- Wholesale path's buyer is always RE (gate above), so this is
    -- always a no-op here — kept for symmetry with accept_offer.
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

-- ── 4. accept_offer — sector-lock + RHQ Rep grant ───────────────
-- Body verbatim from 20270169 (the audit-fixed atomic-affordability
-- version), plus the same sector-lock + Rep grant blocks as
-- buy_building.

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

    SELECT * INTO v_buyer_corp FROM entrepreneur_corps WHERE id = v_offer.buyer_corp_id;
    IF v_buyer_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'buyer_corp_not_found');
    END IF;
    IF v_buyer_corp.owner_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'buyer_orphan');
    END IF;
    v_buyer_fac_id := v_buyer_corp.owner_faction_id;

    -- v3: sector-lock for operational buildings.
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

    -- Atomic affordability + debit (audit-fix from 20270169 preserved).
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

    -- v3: Reputation grant on RHQ acquisition by non-RE buyer.
    -- Seller is always RE (gate above), so the grant fires whenever
    -- the buyer is non-RE — i.e., the end-of-chain "setting up shop"
    -- moment. RE-to-RE pass-throughs grant nothing.
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

-- ── 5. place_offer — pre-validate sector lock ───────────────────
-- Body verbatim from 20270168 plus the sector-lock check (fail
-- fast at place time instead of at accept time, so the buyer
-- gets immediate feedback).

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

    -- v3: sector-lock pre-validation. RHQ has no lock; operational
    -- buildings require matching industry.
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
-- -- Reverse the wipe + column add (NOTE: this does not restore the
-- -- deleted v0-v2 rows; they are gone).
-- ALTER TABLE corp_buildings DROP COLUMN IF EXISTS building_type;
-- -- Re-apply 20270169 to restore the un-typed accept_offer + 20270167
-- -- for the un-typed buy_building / place_offer / begin_construction.
-- COMMIT;
