-- ════════════════════════════════════════════════════════════════════
-- ENTREPRENEUR CORPS — Put Up for Sale (M&A: offer → seller accepts)
-- ════════════════════════════════════════════════════════════════════
-- A founder lists their PRIVATE corp for sale at an asking price. Other
-- entrepreneurs make offers paid from one of THEIR corps' treasury_cash;
-- the seller accepts one. On accept, ownership (owner_faction_id) transfers
-- to the buyer, the buyer corp's treasury pays the agreed amount into the
-- seller's personal Cash on Hand (party_funds), and the acquired corp keeps
-- everything it owns (treasury, buildings, loans) — the whole company changes
-- hands. Private corps only in v1 (public corps have shareholders → separate
-- problem).
--
-- Mirrors the building_offers M&A pattern: an offers table + an accept RPC
-- that settles atomically and auto-rejects the losing offers. Money RPCs
-- reuse the entrepreneur faction-guard prelude (corp_dividend / corp_trade /
-- withdraw_corp_treasury). SECURITY DEFINER — treasury_cash / owner_faction_id
-- are client-write-revoked.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Schema ──────────────────────────────────────────────────────────
ALTER TABLE public.entrepreneur_corps
    ADD COLUMN IF NOT EXISTS for_sale   BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS sale_price BIGINT;

COMMENT ON COLUMN public.entrepreneur_corps.for_sale IS
    'TRUE when the founder has listed this (private) corp for sale. Drives the [FOR SALE] tag on the Market page. Cleared on sale or unlist.';
COMMENT ON COLUMN public.entrepreneur_corps.sale_price IS
    'Asking price the founder set when listing (display / recommended figure). Buyers may offer different amounts; the accepted offer amount is what actually transfers.';

-- Offers to acquire a for-sale corp. Mirrors building_offers.
CREATE TABLE IF NOT EXISTS public.corp_sale_offers (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corp_id           UUID NOT NULL REFERENCES entrepreneur_corps(id) ON DELETE CASCADE,  -- the for-sale corp
    buyer_faction_id  UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,            -- acquiring entrepreneur
    buyer_corp_id     UUID NOT NULL REFERENCES entrepreneur_corps(id) ON DELETE CASCADE,  -- corp whose treasury pays
    amount            BIGINT NOT NULL CHECK (amount > 0),
    status            TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','accepted','rejected','withdrawn')),
    created_tick      INTEGER,
    finalized_at_tick INTEGER,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_corp_sale_offers_corp  ON corp_sale_offers (corp_id)  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_corp_sale_offers_buyer ON corp_sale_offers (buyer_faction_id);

ALTER TABLE public.corp_sale_offers ENABLE ROW LEVEL SECURITY;
-- Offers are visible to all authenticated users (the seller needs to see
-- incoming offers; buyers see their own). Writes go through the SECURITY
-- DEFINER RPCs only — no direct client INSERT/UPDATE.
DROP POLICY IF EXISTS corp_sale_offers_read ON public.corp_sale_offers;
CREATE POLICY corp_sale_offers_read ON public.corp_sale_offers FOR SELECT TO authenticated USING (true);

-- ── list_corp_for_sale ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.list_corp_for_sale(p_corp_id UUID, p_price BIGINT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid UUID := auth.uid(); v_fac factions%ROWTYPE; v_corp entrepreneur_corps%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;
    IF p_corp_id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;
    IF p_price IS NULL OR p_price < 1 THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_price'); END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;
    IF v_corp.listing = 'public' THEN RETURN jsonb_build_object('success', false, 'reason', 'public_not_supported'); END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1 FOR UPDATE;
    IF v_fac.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur'); END IF;
    IF v_corp.owner_faction_id <> v_fac.id THEN RETURN jsonb_build_object('success', false, 'reason', 'not_owner'); END IF;

    UPDATE entrepreneur_corps SET for_sale = true, sale_price = p_price WHERE id = p_corp_id;
    RETURN jsonb_build_object('success', true, 'corp_id', p_corp_id, 'sale_price', p_price);
END; $$;
GRANT EXECUTE ON FUNCTION public.list_corp_for_sale(UUID, BIGINT) TO authenticated;

-- ── unlist_corp_for_sale ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.unlist_corp_for_sale(p_corp_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid UUID := auth.uid(); v_fac factions%ROWTYPE; v_corp entrepreneur_corps%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1 FOR UPDATE;
    IF v_fac.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur'); END IF;
    IF v_corp.owner_faction_id <> v_fac.id THEN RETURN jsonb_build_object('success', false, 'reason', 'not_owner'); END IF;

    UPDATE entrepreneur_corps SET for_sale = false, sale_price = NULL WHERE id = p_corp_id;
    -- Pending offers lapse when the listing is pulled.
    UPDATE corp_sale_offers SET status = 'rejected', finalized_at_tick = (SELECT current_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1)
     WHERE corp_id = p_corp_id AND status = 'pending';
    RETURN jsonb_build_object('success', true, 'corp_id', p_corp_id);
END; $$;
GRANT EXECUTE ON FUNCTION public.unlist_corp_for_sale(UUID) TO authenticated;

-- ── make_corp_sale_offer ────────────────────────────────────────────
-- Caller (entrepreneur) offers to buy a for-sale corp, funded from one of
-- their own corps' treasury. Treasury cover is re-checked at accept time.
CREATE OR REPLACE FUNCTION public.make_corp_sale_offer(p_corp_id UUID, p_buyer_corp_id UUID, p_amount BIGINT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid UUID := auth.uid(); v_fac factions%ROWTYPE; v_target entrepreneur_corps%ROWTYPE;
        v_buyer entrepreneur_corps%ROWTYPE; v_tick INT; v_id UUID;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;
    IF p_corp_id IS NULL OR p_buyer_corp_id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments'); END IF;
    IF p_amount IS NULL OR p_amount < 1 THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_amount'); END IF;
    IF p_corp_id = p_buyer_corp_id THEN RETURN jsonb_build_object('success', false, 'reason', 'cannot_pay_with_target'); END IF;

    SELECT * INTO v_target FROM entrepreneur_corps WHERE id = p_corp_id;
    IF v_target.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;
    IF NOT v_target.for_sale THEN RETURN jsonb_build_object('success', false, 'reason', 'not_for_sale'); END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur'); END IF;
    IF v_target.owner_faction_id = v_fac.id THEN RETURN jsonb_build_object('success', false, 'reason', 'cannot_buy_own_corp'); END IF;

    -- Buyer must own the paying corp.
    SELECT * INTO v_buyer FROM entrepreneur_corps WHERE id = p_buyer_corp_id;
    IF v_buyer.id IS NULL OR v_buyer.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_buyer_corp_owner');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    INSERT INTO corp_sale_offers (corp_id, buyer_faction_id, buyer_corp_id, amount, status, created_tick)
    VALUES (p_corp_id, v_fac.id, p_buyer_corp_id, p_amount, 'pending', COALESCE(v_tick, 0))
    RETURNING id INTO v_id;
    RETURN jsonb_build_object('success', true, 'offer_id', v_id, 'amount', p_amount);
END; $$;
GRANT EXECUTE ON FUNCTION public.make_corp_sale_offer(UUID, UUID, BIGINT) TO authenticated;

-- ── accept_corp_sale_offer ──────────────────────────────────────────
-- Seller (owner of the for-sale corp) accepts an offer. Atomic settlement:
-- debit buyer corp treasury, credit seller's party_funds, transfer the
-- acquired corp's ownership to the buyer, clear the listing, auto-reject the
-- other pending offers. The acquired corp retains its treasury / buildings /
-- loans (the whole company transfers).
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

    -- Lock the two corps in a stable order (by id) to avoid deadlocks.
    PERFORM id FROM entrepreneur_corps WHERE id IN (v_offer.corp_id, v_offer.buyer_corp_id) ORDER BY id FOR UPDATE;
    SELECT * INTO v_target     FROM entrepreneur_corps WHERE id = v_offer.corp_id;
    SELECT * INTO v_buyer_corp FROM entrepreneur_corps WHERE id = v_offer.buyer_corp_id;
    IF v_target.id IS NULL OR v_buyer_corp.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;
    IF NOT v_target.for_sale THEN RETURN jsonb_build_object('success', false, 'reason', 'not_for_sale'); END IF;
    -- Defensive: never sell a public (shareholder-owned) corp wholesale, even
    -- if it somehow went public while listed. for_sale is only set on private
    -- corps by list_corp_for_sale, so this should never trip — belt-and-suspenders.
    IF v_target.listing = 'public' THEN RETURN jsonb_build_object('success', false, 'reason', 'public_not_supported'); END IF;

    -- Caller must own the for-sale corp (the seller).
    SELECT * INTO v_seller FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1 FOR UPDATE;
    IF v_seller.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur'); END IF;
    IF v_target.owner_faction_id <> v_seller.id THEN RETURN jsonb_build_object('success', false, 'reason', 'not_owner'); END IF;
    -- Buyer must still own the paying corp, and not be the seller.
    IF v_buyer_corp.owner_faction_id = v_seller.id THEN RETURN jsonb_build_object('success', false, 'reason', 'buyer_is_seller'); END IF;
    IF v_buyer_corp.owner_faction_id <> v_offer.buyer_faction_id THEN RETURN jsonb_build_object('success', false, 'reason', 'buyer_changed'); END IF;

    -- Treasury cover (floor so a fractional treasury never rounds up).
    v_avail := floor(COALESCE(v_buyer_corp.treasury_cash, 0))::bigint;
    IF v_offer.amount > v_avail THEN
        RETURN jsonb_build_object('success', false, 'reason', 'buyer_insufficient_funds', 'have', v_avail, 'need', v_offer.amount);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Settle: buyer corp treasury → seller's personal funds; transfer ownership.
    UPDATE entrepreneur_corps SET treasury_cash = treasury_cash - v_offer.amount WHERE id = v_offer.buyer_corp_id;
    UPDATE factions SET party_funds = COALESCE(party_funds, 0) + v_offer.amount WHERE id = v_seller.id;
    UPDATE entrepreneur_corps
       SET owner_faction_id = v_offer.buyer_faction_id, for_sale = false, sale_price = NULL
     WHERE id = v_offer.corp_id;

    -- Finalize offers: this one accepted, the rest rejected.
    UPDATE corp_sale_offers SET status = 'accepted', finalized_at_tick = v_tick WHERE id = p_offer_id;
    UPDATE corp_sale_offers SET status = 'rejected', finalized_at_tick = v_tick
     WHERE corp_id = v_offer.corp_id AND status = 'pending' AND id <> p_offer_id;

    INSERT INTO event_log (nation_id, faction_id, event_name, description_used, category, trigger_key, effects_applied, fired_at_tick)
    VALUES (v_target.hq_nation_id, v_offer.buyer_faction_id, 'Corporation Acquired',
            format('%s was acquired for $%s.', v_target.name, v_offer.amount),
            'corporate', 'corp_acquired',
            jsonb_build_object('corp_id', v_offer.corp_id, 'corp_name', v_target.name,
                               'amount', v_offer.amount, 'buyer_faction_id', v_offer.buyer_faction_id,
                               'seller_faction_id', v_seller.id),
            v_tick);

    RETURN jsonb_build_object('success', true, 'corp_id', v_offer.corp_id, 'amount', v_offer.amount,
                              'new_owner_faction_id', v_offer.buyer_faction_id);
END; $$;
GRANT EXECUTE ON FUNCTION public.accept_corp_sale_offer(UUID) TO authenticated;

-- ── withdraw_corp_sale_offer ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.withdraw_corp_sale_offer(p_offer_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid UUID := auth.uid(); v_fac factions%ROWTYPE; v_offer corp_sale_offers%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;
    SELECT * INTO v_offer FROM corp_sale_offers WHERE id = p_offer_id FOR UPDATE;
    IF v_offer.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'offer_not_found'); END IF;
    IF v_offer.status <> 'pending' THEN RETURN jsonb_build_object('success', false, 'reason', 'offer_not_pending'); END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL OR v_offer.buyer_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_your_offer');
    END IF;

    UPDATE corp_sale_offers SET status = 'withdrawn',
           finalized_at_tick = (SELECT current_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1)
     WHERE id = p_offer_id;
    RETURN jsonb_build_object('success', true, 'offer_id', p_offer_id);
END; $$;
GRANT EXECUTE ON FUNCTION public.withdraw_corp_sale_offer(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.withdraw_corp_sale_offer(UUID);
-- DROP FUNCTION IF EXISTS public.accept_corp_sale_offer(UUID);
-- DROP FUNCTION IF EXISTS public.make_corp_sale_offer(UUID, UUID, BIGINT);
-- DROP FUNCTION IF EXISTS public.unlist_corp_for_sale(UUID);
-- DROP FUNCTION IF EXISTS public.list_corp_for_sale(UUID, BIGINT);
-- DROP TABLE IF EXISTS public.corp_sale_offers;
-- ALTER TABLE public.entrepreneur_corps DROP COLUMN IF EXISTS sale_price, DROP COLUMN IF EXISTS for_sale;
-- COMMIT;
