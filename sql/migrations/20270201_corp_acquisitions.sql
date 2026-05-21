-- ════════════════════════════════════════════════════════════════════
-- CORP ACQUISITIONS (2.6.8.3) — buyer-initiated negotiate + chat + agree
-- ════════════════════════════════════════════════════════════════════
-- A buyer (entrepreneur) opens an acquisition on a PRIVATE corp they don't
-- own. The two CEOs negotiate a price over chat; either side can (re)set the
-- price (which resets both agreements). When BOTH agree, the deal completes:
--   • the seller (founder) receives the agreed cash into personal funds
--     (factions.party_funds),
--   • the buyer's chosen same-sector corp pays the price from its treasury
--     and ABSORBS the target's assets (treasury + buildings + loans),
--   • the target corp is dissolved.
-- Coexists with Put Up for Sale (20270198) — that's seller-listed offers;
-- this is buyer-initiated negotiation.
--
-- v1 = PRIVATE corps only. A private corp is 100% founder-owned, so the
-- "CEO + Directors vote" reduces to the founder agreeing — handled by
-- seller_agreed. The public-corp board vote + per-share payout is a later
-- phase.
--
-- Chat reuses the negotiation_messages PATTERN (realtime + RLS + shape) but
-- in a dedicated table — the original negotiation_messages is FK-locked to
-- trade_negotiations and role-locked to government roles.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Negotiation record ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.corp_acquisitions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_corp_id   UUID NOT NULL REFERENCES entrepreneur_corps(id) ON DELETE CASCADE,  -- corp being acquired
    seller_faction_id UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,           -- target's owner at open
    buyer_faction_id UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,            -- acquiring entrepreneur
    buyer_corp_id    UUID NOT NULL REFERENCES entrepreneur_corps(id) ON DELETE CASCADE,  -- same-sector corp that pays + absorbs
    price            BIGINT NOT NULL CHECK (price >= 0),
    buyer_agreed     BOOLEAN NOT NULL DEFAULT false,
    seller_agreed    BOOLEAN NOT NULL DEFAULT false,
    status           TEXT NOT NULL DEFAULT 'negotiating'
                         CHECK (status IN ('negotiating','completed','cancelled')),
    created_tick     INTEGER,
    finalized_at_tick INTEGER,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- One open negotiation per (target, buyer corp) at a time.
CREATE UNIQUE INDEX IF NOT EXISTS uq_corp_acq_open
    ON corp_acquisitions (target_corp_id, buyer_corp_id) WHERE status = 'negotiating';
CREATE INDEX IF NOT EXISTS idx_corp_acq_target ON corp_acquisitions (target_corp_id) WHERE status = 'negotiating';
CREATE INDEX IF NOT EXISTS idx_corp_acq_buyer  ON corp_acquisitions (buyer_faction_id);
CREATE INDEX IF NOT EXISTS idx_corp_acq_seller ON corp_acquisitions (seller_faction_id);

ALTER TABLE public.corp_acquisitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS corp_acquisitions_read ON public.corp_acquisitions;
CREATE POLICY corp_acquisitions_read ON public.corp_acquisitions FOR SELECT TO authenticated USING (true);

-- ── Chat (mirrors negotiation_messages pattern) ─────────────────────
CREATE TABLE IF NOT EXISTS public.acquisition_messages (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    acquisition_id      UUID NOT NULL REFERENCES corp_acquisitions(id) ON DELETE CASCADE,
    sender_faction_id   UUID NOT NULL REFERENCES factions(id),
    sender_display_name TEXT NOT NULL,
    message_text        TEXT NOT NULL CHECK (char_length(message_text) <= 2000),
    is_system           BOOLEAN NOT NULL DEFAULT false,
    sent_at_tick        INT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_acq_messages_neg ON acquisition_messages (acquisition_id, created_at ASC);

ALTER TABLE public.acquisition_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acq_messages_read ON public.acquisition_messages;
CREATE POLICY acq_messages_read ON public.acquisition_messages FOR SELECT TO authenticated USING (true);
-- Inserts go through send_acquisition_message (SECURITY DEFINER) so the
-- sender identity + party membership are validated; no direct client insert.

-- ── propose_acquisition ─────────────────────────────────────────────
-- Buyer opens a negotiation on a private corp they don't own, naming the
-- same-sector corp of theirs that will pay + absorb. Seeds an opening price.
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

    SELECT * INTO v_buyer FROM entrepreneur_corps WHERE id = p_buyer_corp_id;
    IF v_buyer.id IS NULL OR v_buyer.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_buyer_corp_owner');
    END IF;
    IF v_buyer.industry IS DISTINCT FROM v_target.industry THEN
        RETURN jsonb_build_object('success', false, 'reason', 'sector_mismatch',
            'target_sector', v_target.industry, 'buyer_sector', v_buyer.industry);
    END IF;
    -- One open negotiation per (target, buyer corp) — surface cleanly rather
    -- than letting the partial unique index raise.
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

-- ── set_acquisition_price ───────────────────────────────────────────
-- Either CEO updates the price; resets both agreements (a new number must be
-- re-agreed by both).
CREATE OR REPLACE FUNCTION public.set_acquisition_price(p_acq_id UUID, p_price BIGINT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid UUID := auth.uid(); v_fac factions%ROWTYPE; v_acq corp_acquisitions%ROWTYPE; v_tick INT;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;
    IF p_price IS NULL OR p_price < 0 THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_price'); END IF;
    SELECT * INTO v_acq FROM corp_acquisitions WHERE id = p_acq_id FOR UPDATE;
    IF v_acq.id IS NULL OR v_acq.status <> 'negotiating' THEN RETURN jsonb_build_object('success', false, 'reason', 'not_open'); END IF;

    SELECT * INTO v_fac FROM factions
     WHERE abandoned_at IS NULL AND (id = v_uid OR linked_user_id = v_uid)
       AND id IN (v_acq.buyer_faction_id, v_acq.seller_faction_id) LIMIT 1;
    IF v_fac.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_a_party'); END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    UPDATE corp_acquisitions SET price = p_price, buyer_agreed = false, seller_agreed = false WHERE id = p_acq_id;
    INSERT INTO acquisition_messages (acquisition_id, sender_faction_id, sender_display_name, message_text, is_system, sent_at_tick)
    VALUES (p_acq_id, v_fac.id, COALESCE(v_fac.faction_name, 'A party'),
            format('Price set to $%s — both sides must re-agree.', p_price), true, COALESCE(v_tick, 0));
    RETURN jsonb_build_object('success', true, 'price', p_price);
END; $$;
GRANT EXECUTE ON FUNCTION public.set_acquisition_price(UUID, BIGINT) TO authenticated;

-- ── send_acquisition_message ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.send_acquisition_message(p_acq_id UUID, p_text TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid UUID := auth.uid(); v_fac factions%ROWTYPE; v_acq corp_acquisitions%ROWTYPE; v_tick INT;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;
    IF p_text IS NULL OR char_length(trim(p_text)) = 0 OR char_length(p_text) > 2000 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_message'); END IF;
    SELECT * INTO v_acq FROM corp_acquisitions WHERE id = p_acq_id;
    IF v_acq.id IS NULL OR v_acq.status <> 'negotiating' THEN RETURN jsonb_build_object('success', false, 'reason', 'not_open'); END IF;

    SELECT * INTO v_fac FROM factions
     WHERE abandoned_at IS NULL AND (id = v_uid OR linked_user_id = v_uid)
       AND id IN (v_acq.buyer_faction_id, v_acq.seller_faction_id) LIMIT 1;
    IF v_fac.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_a_party'); END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    INSERT INTO acquisition_messages (acquisition_id, sender_faction_id, sender_display_name, message_text, sent_at_tick)
    VALUES (p_acq_id, v_fac.id, COALESCE(v_fac.faction_name, 'A party'), p_text, COALESCE(v_tick, 0));
    RETURN jsonb_build_object('success', true);
END; $$;
GRANT EXECUTE ON FUNCTION public.send_acquisition_message(UUID, TEXT) TO authenticated;

-- ── cancel_acquisition ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cancel_acquisition(p_acq_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid UUID := auth.uid(); v_fac factions%ROWTYPE; v_acq corp_acquisitions%ROWTYPE; v_tick INT;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;
    SELECT * INTO v_acq FROM corp_acquisitions WHERE id = p_acq_id FOR UPDATE;
    IF v_acq.id IS NULL OR v_acq.status <> 'negotiating' THEN RETURN jsonb_build_object('success', false, 'reason', 'not_open'); END IF;
    SELECT * INTO v_fac FROM factions
     WHERE abandoned_at IS NULL AND (id = v_uid OR linked_user_id = v_uid)
       AND id IN (v_acq.buyer_faction_id, v_acq.seller_faction_id) LIMIT 1;
    IF v_fac.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_a_party'); END IF;
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    UPDATE corp_acquisitions SET status = 'cancelled', finalized_at_tick = COALESCE(v_tick, 0) WHERE id = p_acq_id;
    RETURN jsonb_build_object('success', true);
END; $$;
GRANT EXECUTE ON FUNCTION public.cancel_acquisition(UUID) TO authenticated;

-- ── agree_acquisition ───────────────────────────────────────────────
-- A party records their agreement at the current price. When BOTH have
-- agreed, the deal completes atomically (private v1): pay the seller, fold
-- the target's assets into the buyer's corp, dissolve the target.
CREATE OR REPLACE FUNCTION public.agree_acquisition(p_acq_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_uid UUID := auth.uid(); v_fac factions%ROWTYPE; v_acq corp_acquisitions%ROWTYPE;
    v_target entrepreneur_corps%ROWTYPE; v_buyer entrepreneur_corps%ROWTYPE;
    v_is_buyer BOOLEAN; v_both BOOLEAN; v_avail BIGINT; v_tick INT; v_target_treasury BIGINT;
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

    -- ── Both agreed → complete (lock the two corps in id order) ──
    PERFORM id FROM entrepreneur_corps WHERE id IN (v_acq.target_corp_id, v_acq.buyer_corp_id) ORDER BY id FOR UPDATE;
    SELECT * INTO v_target FROM entrepreneur_corps WHERE id = v_acq.target_corp_id;
    SELECT * INTO v_buyer  FROM entrepreneur_corps WHERE id = v_acq.buyer_corp_id;
    IF v_target.id IS NULL OR v_buyer.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;
    -- Re-validate the invariants that could have drifted during negotiation.
    IF v_target.listing = 'public' THEN RETURN jsonb_build_object('success', false, 'reason', 'public_not_supported'); END IF;
    IF v_target.owner_faction_id <> v_acq.seller_faction_id THEN RETURN jsonb_build_object('success', false, 'reason', 'seller_changed'); END IF;
    IF v_buyer.owner_faction_id <> v_acq.buyer_faction_id THEN RETURN jsonb_build_object('success', false, 'reason', 'buyer_changed'); END IF;
    IF v_buyer.industry IS DISTINCT FROM v_target.industry THEN RETURN jsonb_build_object('success', false, 'reason', 'sector_mismatch'); END IF;

    v_avail := floor(COALESCE(v_buyer.treasury_cash, 0))::bigint;
    IF v_acq.price > v_avail THEN
        RETURN jsonb_build_object('success', false, 'reason', 'buyer_insufficient_funds', 'have', v_avail, 'need', v_acq.price);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    v_target_treasury := floor(COALESCE(v_target.treasury_cash, 0))::bigint;

    -- Pay the seller (founder) personally; buyer corp pays the price and
    -- absorbs the target's treasury. Net buyer treasury = − price + target.
    UPDATE factions SET party_funds = COALESCE(party_funds, 0) + v_acq.price WHERE id = v_acq.seller_faction_id;
    UPDATE entrepreneur_corps SET treasury_cash = COALESCE(treasury_cash, 0) - v_acq.price + v_target_treasury
     WHERE id = v_acq.buyer_corp_id;

    -- Fold the target's assets into the buyer corp, then dissolve the target.
    UPDATE corp_buildings   SET owner_corp_id    = v_acq.buyer_corp_id WHERE owner_corp_id    = v_acq.target_corp_id;
    UPDATE corp_loans       SET borrower_corp_id = v_acq.buyer_corp_id WHERE borrower_corp_id = v_acq.target_corp_id AND status IN ('approved','active');
    UPDATE central_bank_loans SET borrower_corp_id = v_acq.buyer_corp_id WHERE borrower_corp_id = v_acq.target_corp_id AND status = 'active';

    UPDATE corp_acquisitions SET status = 'completed', finalized_at_tick = v_tick WHERE id = p_acq_id;
    -- Cancel any other open negotiations on the now-gone target.
    UPDATE corp_acquisitions SET status = 'cancelled', finalized_at_tick = v_tick
     WHERE target_corp_id = v_acq.target_corp_id AND status = 'negotiating' AND id <> p_acq_id;

    INSERT INTO event_log (nation_id, faction_id, event_name, description_used, category, trigger_key, effects_applied, fired_at_tick)
    VALUES (v_target.hq_nation_id, v_acq.buyer_faction_id, 'Corporation Acquired',
            format('%s acquired %s for $%s — assets folded into %s.', v_buyer.name, v_target.name, v_acq.price, v_buyer.name),
            'corporate', 'corp_acquired_negotiated',
            jsonb_build_object('acquisition_id', p_acq_id, 'target', v_target.name, 'buyer_corp', v_buyer.name,
                               'price', v_acq.price, 'absorbed_treasury', v_target_treasury),
            v_tick);

    -- Dissolve the target. corp_buildings/loans already reassigned above;
    -- the ownership-clear trigger fires on delete.
    DELETE FROM entrepreneur_corps WHERE id = v_acq.target_corp_id;

    RETURN jsonb_build_object('success', true, 'both_agreed', true, 'completed', true,
                              'price', v_acq.price, 'absorbed_into', v_acq.buyer_corp_id);
END; $$;
GRANT EXECUTE ON FUNCTION public.agree_acquisition(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.agree_acquisition(UUID);
-- DROP FUNCTION IF EXISTS public.cancel_acquisition(UUID);
-- DROP FUNCTION IF EXISTS public.send_acquisition_message(UUID, TEXT);
-- DROP FUNCTION IF EXISTS public.set_acquisition_price(UUID, BIGINT);
-- DROP FUNCTION IF EXISTS public.propose_acquisition(UUID, UUID, BIGINT);
-- DROP TABLE IF EXISTS public.acquisition_messages;
-- DROP TABLE IF EXISTS public.corp_acquisitions;
-- COMMIT;
