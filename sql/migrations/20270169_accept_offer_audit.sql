-- ════════════════════════════════════════════════════════════════════
-- CONSTRUCTION v2 — audit fix: accept_offer two-faction deadlock
-- ════════════════════════════════════════════════════════════════════
-- Second-pass audit on the cdd2859 marketplace push.
--
-- accept_offer (20270168) locked the SELLER faction first via the
-- verbatim prelude, then locked the BUYER faction with an explicit
-- FOR UPDATE. Lock order was caller-first, not uuid-ordered, so
-- two concurrent accept_offers whose seller/buyer factions are
-- swapped (Tx X: seller A, buyer B · Tx Y: seller B, buyer A) hit
-- a classic A→B / B→A deadlock. Postgres's deadlock detector
-- aborts one txn after ~1s — recoverable but ugly.
--
-- Fix: drop the explicit buyer-faction FOR UPDATE. Replace the
-- read-then-write affordability check with an ATOMIC conditional
-- UPDATE:
--
--   UPDATE factions
--      SET party_funds = COALESCE(party_funds, 0) - v_amount
--    WHERE id = v_buyer_fac_id
--      AND COALESCE(party_funds, 0) >= v_amount;
--   IF NOT FOUND THEN ... insufficient_funds, with a follow-up
--   SELECT for the 'have' value ...;
--
-- Only ONE faction is locked per RPC now (the caller's, via the
-- prelude — needed to verify seller-corp ownership). The buyer
-- faction is mutated by the atomic UPDATE; concurrent updates
-- to the same row serialise under MVCC without explicit locks.
-- Deadlock class eliminated.
--
-- Intra-faction (buyer faction = seller faction) still works:
-- the prelude already locked that row; the atomic UPDATE
-- proceeds; net party_funds change after debit + credit is zero,
-- as designed.
--
-- Body otherwise verbatim from 20270168. Idempotent.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

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

    -- Caller = seller faction (verbatim prelude + lock). This is the
    -- ONLY explicit faction lock in this RPC; the buyer faction is
    -- mutated by an atomic conditional UPDATE below (no FOR UPDATE,
    -- no deadlock class).
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

    -- Atomic affordability + debit on buyer faction. WHERE condition
    -- gates the UPDATE — if buyer no longer has the funds, no row
    -- matches and FOUND is false. This serialises under MVCC without
    -- needing an explicit FOR UPDATE on the buyer faction, which
    -- eliminates the previous deadlock class (caller-first lock
    -- order + two-faction lock).
    --
    -- Intra-faction (buyer = seller) is safe: the seller row is
    -- already locked above; this UPDATE proceeds on the same locked
    -- row; the credit UPDATE below reads the post-debit value (X -
    -- amount) and adds amount back → net zero, as designed.
    UPDATE factions
       SET party_funds = COALESCE(party_funds, 0) - v_amount
     WHERE id = v_buyer_fac_id
       AND COALESCE(party_funds, 0) >= v_amount;
    IF NOT FOUND THEN
        -- Read after the failed UPDATE for the user-facing have/need.
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

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- Re-apply 20270168 to restore the two-faction-lock version. NOT
-- recommended — the prior behaviour is deadlock-prone under
-- concurrent accept_offers on swap-pair faction pairs.
