-- ════════════════════════════════════════════════════════════════════
-- CONSTRUCTION v2 — two-tier marketplace (offers/bids on retail listings)
-- ════════════════════════════════════════════════════════════════════
-- Splits the v1 marketplace into two parallel mechanics, gated by
-- the seller's industry:
--
--   Wholesale (Construction → RE, or non-RE → RE buyback per
--   option (i)). Lister: any non-RE owner. Buyer: RE only.
--   Mechanic: fixed-price instant buy. Surface: existing
--   [Browse Market] modal on RE corp pages.
--
--   Retail (RE → any corp). Lister: RE only. Buyer: any corp.
--   Mechanic: offer/bid system — buyer places a custom-amount
--   offer; seller accepts or rejects each one. Surface: new
--   Properties tab on entrepreneur-markets.html (this push) +
--   pending-offers inline on the seller's listed buildings.
--
-- list_building_for_sale stays a single RPC — the seller's
-- industry at query time determines which surface shows the
-- listing. buy_building gets tightened to non-RE sellers only
-- (RE-listed buildings go through offers); place_offer is the
-- new retail entry point.
--
-- ── building_offers table ────────────────────────────────────────
--   id, building_id (CASCADE), buyer_corp_id (CASCADE), amount,
--   status (pending|accepted|rejected|withdrawn), placed_at_tick,
--   finalized_at_tick, created_at.
-- Partial UNIQUE on (building_id, buyer_corp_id) WHERE status =
-- 'pending' → one active offer per (building, buyer) pair;
-- place_offer upserts the pending row (raising your offer is
-- a single round-trip, not withdraw-then-place).
--
-- ── Lifecycle ────────────────────────────────────────────────────
-- place_offer:   inserts/updates 'pending' row.
-- accept_offer:  flips this row to 'accepted', auto-rejects all
--                OTHER pending offers on the same building, moves
--                money, flips owner_corp_id, clears list_price.
-- reject_offer:  flips this row to 'rejected'; listing + other
--                offers untouched.
-- withdraw_offer: bidder-side cancel — flips to 'withdrawn'.
-- delist_building (patched): auto-rejects all pending offers on
--                            the building when the owner withdraws
--                            the listing.
--
-- Affordability is checked at ACCEPT time, not place time
-- (locked design choice — no "locked funds" tracking). If the
-- bidder no longer has funds, the RPC returns
-- buyer_insufficient_funds and the seller can pick a different
-- offer or wait.
--
-- ── RLS ──────────────────────────────────────────────────────────
-- Same class as corp_buildings: SELECT-all (public market data),
-- no write policy → only SECURITY DEFINER RPCs can write.
--
-- Idempotent. Re-runnable.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. building_offers table ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS building_offers (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id        uuid NOT NULL REFERENCES corp_buildings(id) ON DELETE CASCADE,
    buyer_corp_id      uuid NOT NULL REFERENCES entrepreneur_corps(id) ON DELETE CASCADE,
    amount             bigint NOT NULL CHECK (amount > 0),
    status             text   NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','accepted','rejected','withdrawn')),
    placed_at_tick     int    NOT NULL,
    finalized_at_tick  int,
    created_at         timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE building_offers IS
    'Retail-market offers/bids placed by any corp on a Real-Estate-listed building. Status lifecycle: pending → accepted | rejected | withdrawn. One pending offer per (building, buyer) pair (partial UNIQUE index). RPC-write-only.';

CREATE INDEX IF NOT EXISTS idx_building_offers_building
    ON building_offers (building_id, status);
CREATE INDEX IF NOT EXISTS idx_building_offers_buyer
    ON building_offers (buyer_corp_id, status);

-- One active offer per (building, buyer). place_offer upserts onto this.
CREATE UNIQUE INDEX IF NOT EXISTS idx_building_offers_one_pending
    ON building_offers (building_id, buyer_corp_id)
    WHERE status = 'pending';

ALTER TABLE building_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for all" ON building_offers;
CREATE POLICY "Allow select for all" ON building_offers FOR SELECT USING (true);

-- ── 2. buy_building patched — seller MUST NOT be RE ──────────────
-- v1 allowed any seller (including RE→RE secondary). The two-tier
-- model routes RE-listed buildings through the offer system, so
-- wholesale buy_building only handles non-RE sellers now. Body
-- verbatim from 20270167 plus one extra IF block; existing GRANT
-- and COMMENT preserved.

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
    -- v2: wholesale only — RE-listed buildings go through place_offer.
    IF v_seller_corp.industry = 'real_estate' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'use_offer_system');
    END IF;
    IF v_seller_corp.owner_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'seller_orphan');
    END IF;
    v_seller_fac_id := v_seller_corp.owner_faction_id;

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

-- ── 3. delist_building patched — auto-reject pending offers ─────
-- When an RE corp delists, any pending offers on the building are
-- automatically rejected (the listing is gone, the offers are
-- moot). Body otherwise verbatim from 20270167.

CREATE OR REPLACE FUNCTION public.delist_building(p_building_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid             uuid := auth.uid();
    v_fac             factions%ROWTYPE;
    v_building        corp_buildings%ROWTYPE;
    v_owner_corp      entrepreneur_corps%ROWTYPE;
    v_nation_name     text;
    v_tick            int;
    v_rejected_count  int := 0;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_building_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_building FROM corp_buildings
     WHERE id = p_building_id FOR UPDATE;
    IF v_building.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'building_not_found');
    END IF;
    IF v_building.list_price IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_listed');
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

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE corp_buildings SET list_price = NULL WHERE id = p_building_id;

    -- v2: auto-reject every pending offer on this building.
    UPDATE building_offers
       SET status = 'rejected', finalized_at_tick = v_tick
     WHERE building_id = p_building_id AND status = 'pending';
    GET DIAGNOSTICS v_rejected_count = ROW_COUNT;

    SELECT name INTO v_nation_name FROM nations WHERE id = v_building.nation_id;
    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_building.nation_id, v_fac.id,
        'Building Delisted',
        format('%s withdraws %s in %s from the market.',
               v_owner_corp.name, v_building.name, v_nation_name),
        'corporate', 'building_delisted',
        jsonb_build_object(
            'building_id',     p_building_id,
            'building_name',   v_building.name,
            'corp_id',         v_owner_corp.id,
            'corp_name',       v_owner_corp.name,
            'tier',            v_building.tier,
            'offers_rejected', v_rejected_count
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',         true,
        'building_id',     p_building_id,
        'offers_rejected', v_rejected_count
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.delist_building(uuid) TO authenticated;

-- ── 4. place_offer ───────────────────────────────────────────────
-- Any corp owner can place an offer on a Real-Estate-listed
-- building. Upserts onto the partial UNIQUE index — raising your
-- offer is a single round-trip (the existing pending row is
-- updated in place). Affordability is NOT checked here (locked
-- design: at-accept-time only — see migration header).

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
    v_uid          uuid := auth.uid();
    v_fac          factions%ROWTYPE;
    v_building     corp_buildings%ROWTYPE;
    v_seller_corp  entrepreneur_corps%ROWTYPE;
    v_buyer_corp   entrepreneur_corps%ROWTYPE;
    v_offer_id     uuid;
    v_tick         int;
    v_nation_name  text;
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

    -- Both corps in uuid order (deadlock-safe vs concurrent
    -- accept_offer / buy_building on overlapping corps).
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

    -- Upsert via the partial UNIQUE index (status='pending'). A
    -- previous rejected/withdrawn offer is left alone; a previous
    -- pending offer from the same buyer is updated in place.
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

COMMENT ON FUNCTION public.place_offer(uuid, uuid, bigint) IS
    'Place / update an offer on a Real-Estate-listed building. Caller must own the buyer corp. Seller must be RE. Upserts pending row via partial UNIQUE index — raising your offer is a single round-trip. Affordability NOT checked here (at-accept-time only). SECURITY DEFINER.';

-- ── 5. accept_offer ──────────────────────────────────────────────
-- Seller (listing RE corp's owner) accepts a pending offer. Money
-- moves, ownership flips, all OTHER pending offers on the same
-- building are auto-rejected. Affordability is checked HERE — if
-- the bidder no longer has funds, returns
-- buyer_insufficient_funds without side effects (FOR UPDATE on
-- buyer faction makes the read-then-write race-safe).

CREATE OR REPLACE FUNCTION public.accept_offer(p_offer_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid              uuid := auth.uid();
    v_fac              factions%ROWTYPE;
    v_buyer_fac        factions%ROWTYPE;
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

    -- Caller = seller faction (verbatim prelude + lock).
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

    -- Lock buyer faction for read-then-write affordability check. If
    -- buyer faction = seller faction (same player owns both corps),
    -- they're the same row — already locked above.
    IF v_buyer_fac_id <> v_fac.id THEN
        SELECT * INTO v_buyer_fac FROM factions
         WHERE id = v_buyer_fac_id FOR UPDATE;
        IF v_buyer_fac.id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'buyer_faction_not_found');
        END IF;
    ELSE
        v_buyer_fac := v_fac;
    END IF;

    IF COALESCE(v_buyer_fac.party_funds, 0) < v_amount THEN
        RETURN jsonb_build_object('success', false, 'reason', 'buyer_insufficient_funds',
            'have', COALESCE(v_buyer_fac.party_funds, 0), 'need', v_amount);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Money flow. If buyer faction = seller faction, the two updates
    -- net to zero — intra-faction asset reorganisation.
    UPDATE factions SET party_funds = COALESCE(party_funds, 0) - v_amount
     WHERE id = v_buyer_fac_id;
    UPDATE factions SET party_funds = COALESCE(party_funds, 0) + v_amount
     WHERE id = v_seller_fac_id;

    -- Transfer ownership, clear listing.
    UPDATE corp_buildings
       SET owner_corp_id = v_offer.buyer_corp_id,
           list_price    = NULL
     WHERE id = v_offer.building_id;

    -- Mark this offer accepted, auto-reject every other pending
    -- offer on the same building.
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

COMMENT ON FUNCTION public.accept_offer(uuid) IS
    'Listing RE corp accepts a pending offer. Affordability checked here under FOR UPDATE on buyer faction. Debits buyer-faction, credits seller-faction, flips owner_corp_id, clears list_price, auto-rejects all other pending offers on the same building. Money conserved. Lock order: offer → building → both corps (uuid order) → seller faction → buyer faction (only if different).';

-- ── 6. reject_offer ──────────────────────────────────────────────
-- Single state flip; listing + other offers untouched.

CREATE OR REPLACE FUNCTION public.reject_offer(p_offer_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_fac          factions%ROWTYPE;
    v_offer        building_offers%ROWTYPE;
    v_building     corp_buildings%ROWTYPE;
    v_seller_corp  entrepreneur_corps%ROWTYPE;
    v_buyer_corp   entrepreneur_corps%ROWTYPE;
    v_tick         int;
    v_nation_name  text;
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

    SELECT * INTO v_building FROM corp_buildings
     WHERE id = v_offer.building_id FOR UPDATE;
    IF v_building.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'building_not_found');
    END IF;
    IF v_building.owner_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_seller');
    END IF;

    SELECT * INTO v_seller_corp FROM entrepreneur_corps
     WHERE id = v_building.owner_corp_id FOR UPDATE;
    IF v_seller_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'seller_corp_not_found');
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

    UPDATE building_offers
       SET status = 'rejected', finalized_at_tick = v_tick
     WHERE id = p_offer_id;

    SELECT * INTO v_buyer_corp FROM entrepreneur_corps WHERE id = v_offer.buyer_corp_id;
    SELECT name INTO v_nation_name FROM nations WHERE id = v_building.nation_id;
    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_building.nation_id, v_fac.id,
        'Offer Rejected',
        format('%s rejects $%s offer from %s for %s.',
               v_seller_corp.name, to_char(v_offer.amount, 'FM999,999,999,999'),
               COALESCE(v_buyer_corp.name, 'Unknown'), v_building.name),
        'corporate', 'building_offer_rejected',
        jsonb_build_object(
            'offer_id',         p_offer_id,
            'building_id',      v_offer.building_id,
            'building_name',    v_building.name,
            'buyer_corp_id',    v_offer.buyer_corp_id,
            'buyer_corp_name',  v_buyer_corp.name,
            'seller_corp_id',   v_seller_corp.id,
            'seller_corp_name', v_seller_corp.name,
            'amount',           v_offer.amount
        ),
        v_tick
    );

    RETURN jsonb_build_object('success', true, 'offer_id', p_offer_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.reject_offer(uuid) TO authenticated;

-- ── 7. withdraw_offer ────────────────────────────────────────────
-- Bidder-side cancel. Caller must own the buyer corp.

CREATE OR REPLACE FUNCTION public.withdraw_offer(p_offer_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_fac          factions%ROWTYPE;
    v_offer        building_offers%ROWTYPE;
    v_building     corp_buildings%ROWTYPE;
    v_buyer_corp   entrepreneur_corps%ROWTYPE;
    v_seller_corp  entrepreneur_corps%ROWTYPE;
    v_tick         int;
    v_nation_name  text;
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

    SELECT * INTO v_buyer_corp FROM entrepreneur_corps
     WHERE id = v_offer.buyer_corp_id FOR UPDATE;
    IF v_buyer_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'buyer_corp_not_found');
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

    UPDATE building_offers
       SET status = 'withdrawn', finalized_at_tick = v_tick
     WHERE id = p_offer_id;

    SELECT * INTO v_building FROM corp_buildings WHERE id = v_offer.building_id;
    IF v_building.owner_corp_id IS NOT NULL THEN
        SELECT * INTO v_seller_corp FROM entrepreneur_corps WHERE id = v_building.owner_corp_id;
    END IF;
    SELECT name INTO v_nation_name FROM nations WHERE id = v_building.nation_id;

    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_building.nation_id, v_fac.id,
        'Offer Withdrawn',
        format('%s withdraws $%s offer on %s.',
               v_buyer_corp.name, to_char(v_offer.amount, 'FM999,999,999,999'),
               v_building.name),
        'corporate', 'building_offer_withdrawn',
        jsonb_build_object(
            'offer_id',         p_offer_id,
            'building_id',      v_offer.building_id,
            'building_name',    v_building.name,
            'buyer_corp_id',    v_offer.buyer_corp_id,
            'buyer_corp_name',  v_buyer_corp.name,
            'seller_corp_id',   v_seller_corp.id,
            'amount',           v_offer.amount
        ),
        v_tick
    );

    RETURN jsonb_build_object('success', true, 'offer_id', p_offer_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.withdraw_offer(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.withdraw_offer(uuid);
-- DROP FUNCTION IF EXISTS public.reject_offer(uuid);
-- DROP FUNCTION IF EXISTS public.accept_offer(uuid);
-- DROP FUNCTION IF EXISTS public.place_offer(uuid, uuid, bigint);
-- -- Re-apply 20270167 to restore the un-patched buy_building +
-- -- delist_building (without the seller-industry gate and the
-- -- auto-reject on delist).
-- DROP TABLE IF EXISTS building_offers;
-- COMMIT;
