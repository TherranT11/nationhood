-- ════════════════════════════════════════════════════════════════════
-- UNIFY CORP M&A — one transfer path: the corp changes hands, it survives
-- ════════════════════════════════════════════════════════════════════
-- Previously two divergent settlements:
--   • accept_corp_sale_offer (20270198) — transfers owner_faction_id, corp
--     survives. CORRECT.
--   • agree_acquisition (20270201) — folded the target's assets into the
--     buyer's same-sector corp and DELETED the target. This silently
--     destroyed everything the reassignment list missed (airline fleet,
--     routes, terminals, aviation designs/inventory/production — all
--     ON DELETE CASCADE), so buyers lost what they paid for.
--
-- Both entry points now settle through ONE function, _settle_corp_transfer:
-- the buyer's chosen corp pays the agreed price into the seller's personal
-- funds, ownership (owner_faction_id) moves to the buyer, the listing clears,
-- and the corp keeps ALL of its own assets (treasury, buildings, loans,
-- aircraft, routes, terminals, designs). Nothing is absorbed or dissolved —
-- the company simply changes hands and continues to exist as a standalone
-- corp the buyer now owns.
--
-- [Put Up for Sale] (seller lists → buyers offer → seller accepts) and
-- [Acquire] (buyer proposes → both CEOs agree) are just the seller-side and
-- buyer-side ways to reach the same transfer. The same-sector constraint on
-- acquisitions is dropped — it only existed for the (now removed) fold-in.
--
-- Idempotent (CREATE OR REPLACE).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── _settle_corp_transfer — the single transfer settlement ──────────
-- Pure settlement: caller must have already validated ownership, the offer
-- state, and buyer-corp funds (with the corp rows locked FOR UPDATE).
CREATE OR REPLACE FUNCTION public._settle_corp_transfer(
    p_corp_id          uuid,
    p_buyer_faction_id uuid,
    p_buyer_corp_id    uuid,
    p_seller_faction_id uuid,
    p_amount           bigint,
    p_tick             int
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_corp entrepreneur_corps%ROWTYPE; v_buyer_name text;
BEGIN
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id;
    SELECT faction_name INTO v_buyer_name FROM factions WHERE id = p_buyer_faction_id;

    -- Buyer corp pays the price into the seller's personal funds.
    UPDATE entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) - p_amount, updated_at = now()
     WHERE id = p_buyer_corp_id;
    UPDATE factions
       SET party_funds = COALESCE(party_funds, 0) + p_amount
     WHERE id = p_seller_faction_id;

    -- Ownership moves to the buyer; the corp keeps everything it owns and
    -- stops being listed.
    UPDATE entrepreneur_corps
       SET owner_faction_id = p_buyer_faction_id, for_sale = false, sale_price = NULL, updated_at = now()
     WHERE id = p_corp_id;

    INSERT INTO event_log (nation_id, faction_id, event_name, description_used, category, trigger_key, effects_applied, fired_at_tick)
    VALUES (v_corp.hq_nation_id, p_buyer_faction_id, 'Corporation Acquired',
            format('%s changed hands for $%s — now operating under %s.',
                   v_corp.name, p_amount, COALESCE(v_buyer_name, 'new ownership')),
            'corporate', 'corp_changed_hands',
            jsonb_build_object('corp_id', p_corp_id, 'corp_name', v_corp.name, 'amount', p_amount,
                               'buyer_faction_id', p_buyer_faction_id, 'seller_faction_id', p_seller_faction_id),
            p_tick);
END; $$;
REVOKE EXECUTE ON FUNCTION public._settle_corp_transfer(uuid, uuid, uuid, uuid, bigint, int) FROM PUBLIC;

-- ── accept_corp_sale_offer — seller-side entry, now via the shared fn ─
CREATE OR REPLACE FUNCTION public.accept_corp_sale_offer(p_offer_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid UUID := auth.uid(); v_seller factions%ROWTYPE; v_offer corp_sale_offers%ROWTYPE;
        v_target entrepreneur_corps%ROWTYPE; v_buyer_corp entrepreneur_corps%ROWTYPE; v_tick INT; v_avail BIGINT;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;
    IF p_offer_id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'offer_not_found'); END IF;

    SELECT * INTO v_offer FROM corp_sale_offers WHERE id = p_offer_id FOR UPDATE;
    IF v_offer.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'offer_not_found'); END IF;
    IF v_offer.status <> 'pending' THEN RETURN jsonb_build_object('success', false, 'reason', 'offer_not_pending'); END IF;

    PERFORM id FROM entrepreneur_corps WHERE id IN (v_offer.corp_id, v_offer.buyer_corp_id) ORDER BY id FOR UPDATE;
    SELECT * INTO v_target     FROM entrepreneur_corps WHERE id = v_offer.corp_id;
    SELECT * INTO v_buyer_corp FROM entrepreneur_corps WHERE id = v_offer.buyer_corp_id;
    IF v_target.id IS NULL OR v_buyer_corp.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;
    IF NOT v_target.for_sale THEN RETURN jsonb_build_object('success', false, 'reason', 'not_for_sale'); END IF;
    IF v_target.listing = 'public' THEN RETURN jsonb_build_object('success', false, 'reason', 'public_not_supported'); END IF;

    SELECT * INTO v_seller FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1 FOR UPDATE;
    IF v_seller.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur'); END IF;
    IF v_target.owner_faction_id <> v_seller.id THEN RETURN jsonb_build_object('success', false, 'reason', 'not_owner'); END IF;
    IF v_buyer_corp.owner_faction_id = v_seller.id THEN RETURN jsonb_build_object('success', false, 'reason', 'buyer_is_seller'); END IF;
    IF v_buyer_corp.owner_faction_id <> v_offer.buyer_faction_id THEN RETURN jsonb_build_object('success', false, 'reason', 'buyer_changed'); END IF;

    v_avail := floor(COALESCE(v_buyer_corp.treasury_cash, 0))::bigint;
    IF v_offer.amount > v_avail THEN
        RETURN jsonb_build_object('success', false, 'reason', 'buyer_insufficient_funds', 'have', v_avail, 'need', v_offer.amount);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    PERFORM _settle_corp_transfer(v_offer.corp_id, v_offer.buyer_faction_id, v_offer.buyer_corp_id, v_seller.id, v_offer.amount, v_tick);

    UPDATE corp_sale_offers SET status = 'accepted', finalized_at_tick = v_tick WHERE id = p_offer_id;
    UPDATE corp_sale_offers SET status = 'rejected', finalized_at_tick = v_tick
     WHERE corp_id = v_offer.corp_id AND status = 'pending' AND id <> p_offer_id;

    RETURN jsonb_build_object('success', true, 'corp_id', v_offer.corp_id, 'amount', v_offer.amount,
                              'new_owner_faction_id', v_offer.buyer_faction_id);
END; $$;
GRANT EXECUTE ON FUNCTION public.accept_corp_sale_offer(UUID) TO authenticated;

-- ── propose_acquisition — drop the (now pointless) same-sector gate ──
CREATE OR REPLACE FUNCTION public.propose_acquisition(
    p_target_corp_id UUID, p_buyer_corp_id UUID, p_price BIGINT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_uid UUID := auth.uid(); v_fac factions%ROWTYPE;
    v_target entrepreneur_corps%ROWTYPE; v_buyer entrepreneur_corps%ROWTYPE; v_tick INT; v_id UUID;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;
    IF p_target_corp_id IS NULL OR p_buyer_corp_id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments'); END IF;
    IF p_target_corp_id = p_buyer_corp_id THEN RETURN jsonb_build_object('success', false, 'reason', 'cannot_acquire_self'); END IF;
    IF p_price IS NULL OR p_price < 0 THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_price'); END IF;

    SELECT * INTO v_target FROM entrepreneur_corps WHERE id = p_target_corp_id;
    IF v_target.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;
    IF v_target.listing = 'public' THEN RETURN jsonb_build_object('success', false, 'reason', 'public_not_supported'); END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur'); END IF;
    IF v_target.owner_faction_id = v_fac.id THEN RETURN jsonb_build_object('success', false, 'reason', 'cannot_buy_own_corp'); END IF;

    -- Buyer must own the paying corp (any sector — the corp changes hands, it
    -- isn't folded into the payer).
    SELECT * INTO v_buyer FROM entrepreneur_corps WHERE id = p_buyer_corp_id;
    IF v_buyer.id IS NULL OR v_buyer.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_buyer_corp_owner');
    END IF;

    IF EXISTS (SELECT 1 FROM corp_acquisitions
                WHERE target_corp_id = p_target_corp_id AND buyer_corp_id = p_buyer_corp_id
                  AND status = 'negotiating') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_negotiating');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO corp_acquisitions (target_corp_id, seller_faction_id, buyer_faction_id, buyer_corp_id, price, created_tick)
    VALUES (p_target_corp_id, v_target.owner_faction_id, v_fac.id, p_buyer_corp_id, p_price, v_tick)
    RETURNING id INTO v_id;

    INSERT INTO acquisition_messages (acquisition_id, sender_faction_id, sender_display_name, message_text, is_system, sent_at_tick)
    VALUES (v_id, v_fac.id, COALESCE(v_fac.faction_name, 'Buyer'),
            format('%s proposes to acquire %s for $%s.', v_buyer.name, v_target.name, p_price), true, v_tick);

    RETURN jsonb_build_object('success', true, 'acquisition_id', v_id, 'price', p_price);
END; $$;
GRANT EXECUTE ON FUNCTION public.propose_acquisition(UUID, UUID, BIGINT) TO authenticated;

-- ── agree_acquisition — buyer-side entry, now via the shared fn ──────
-- (was: fold assets into buyer corp + DELETE target). Now: on both-agree,
-- transfer ownership via _settle_corp_transfer. The corp survives.
CREATE OR REPLACE FUNCTION public.agree_acquisition(p_acq_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_uid UUID := auth.uid(); v_fac factions%ROWTYPE; v_acq corp_acquisitions%ROWTYPE;
    v_target entrepreneur_corps%ROWTYPE; v_buyer entrepreneur_corps%ROWTYPE;
    v_is_buyer BOOLEAN; v_both BOOLEAN; v_avail BIGINT; v_tick INT;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;
    SELECT * INTO v_acq FROM corp_acquisitions WHERE id = p_acq_id FOR UPDATE;
    IF v_acq.id IS NULL OR v_acq.status <> 'negotiating' THEN RETURN jsonb_build_object('success', false, 'reason', 'not_open'); END IF;

    SELECT * INTO v_fac FROM factions
     WHERE abandoned_at IS NULL AND (id = v_uid OR linked_user_id = v_uid)
       AND id IN (v_acq.buyer_faction_id, v_acq.seller_faction_id) LIMIT 1;
    IF v_fac.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_a_party'); END IF;
    v_is_buyer := (v_fac.id = v_acq.buyer_faction_id);

    IF v_is_buyer THEN UPDATE corp_acquisitions SET buyer_agreed = true WHERE id = p_acq_id;
    ELSE                UPDATE corp_acquisitions SET seller_agreed = true WHERE id = p_acq_id; END IF;
    SELECT (buyer_agreed AND seller_agreed) INTO v_both FROM corp_acquisitions WHERE id = p_acq_id;
    IF NOT v_both THEN
        RETURN jsonb_build_object('success', true, 'agreed', true, 'both_agreed', false,
            'awaiting', CASE WHEN v_is_buyer THEN 'seller' ELSE 'buyer' END);
    END IF;

    -- ── Both agreed → transfer (lock the two corps in id order) ──
    PERFORM id FROM entrepreneur_corps WHERE id IN (v_acq.target_corp_id, v_acq.buyer_corp_id) ORDER BY id FOR UPDATE;
    SELECT * INTO v_target FROM entrepreneur_corps WHERE id = v_acq.target_corp_id;
    SELECT * INTO v_buyer  FROM entrepreneur_corps WHERE id = v_acq.buyer_corp_id;
    IF v_target.id IS NULL OR v_buyer.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;
    IF v_target.listing = 'public' THEN RETURN jsonb_build_object('success', false, 'reason', 'public_not_supported'); END IF;
    IF v_target.owner_faction_id <> v_acq.seller_faction_id THEN RETURN jsonb_build_object('success', false, 'reason', 'seller_changed'); END IF;
    IF v_buyer.owner_faction_id <> v_acq.buyer_faction_id THEN RETURN jsonb_build_object('success', false, 'reason', 'buyer_changed'); END IF;

    v_avail := floor(COALESCE(v_buyer.treasury_cash, 0))::bigint;
    IF v_acq.price > v_avail THEN
        RETURN jsonb_build_object('success', false, 'reason', 'buyer_insufficient_funds', 'have', v_avail, 'need', v_acq.price);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    PERFORM _settle_corp_transfer(v_acq.target_corp_id, v_acq.buyer_faction_id, v_acq.buyer_corp_id, v_acq.seller_faction_id, v_acq.price, v_tick);

    UPDATE corp_acquisitions SET status = 'completed', finalized_at_tick = v_tick WHERE id = p_acq_id;
    -- Cancel any other open negotiations on this corp (it just changed hands).
    UPDATE corp_acquisitions SET status = 'cancelled', finalized_at_tick = v_tick
     WHERE target_corp_id = v_acq.target_corp_id AND status = 'negotiating' AND id <> p_acq_id;

    RETURN jsonb_build_object('success', true, 'both_agreed', true, 'completed', true,
                              'price', v_acq.price, 'new_owner_faction_id', v_acq.buyer_faction_id);
END; $$;
GRANT EXECUTE ON FUNCTION public.agree_acquisition(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- Re-apply 20270198 + 20270201 to restore the split settlements, then:
-- BEGIN; DROP FUNCTION IF EXISTS public._settle_corp_transfer(uuid,uuid,uuid,uuid,bigint,int); COMMIT;
