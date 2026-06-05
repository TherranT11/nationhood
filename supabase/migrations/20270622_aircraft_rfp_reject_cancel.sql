-- ════════════════════════════════════════════════════════════════════
-- 20270622 — Aircraft RFPs: reject single bid + cancel empty RFP
--
-- Airline-side: post-20270587's manual-award model leaves the airline
-- two terminal actions on an open RFP — accept_aircraft_rfp_bid
-- (pick a winner) and waiting for bidding_closes_tick to pass.
-- Missing: rejecting a single bid you don't like (e.g. price too
-- high, design wrong) without picking it, and cancelling an RFP that
-- has no more pending bids so you can post a fresh one with different
-- specs.
--
-- Mirrors the construction-bid pattern (ent_reject_construction_bid +
-- ent_cancel_construction_request, 20270245 + 20270366):
--
--   reject_ent_aircraft_rfp_bid(p_bid_id) — owner of the RFP flips
--     a pending bid to 'rejected'. RFP stays open. Bidder is locked
--     out of re-bidding on this RFP (the UNIQUE(rfp_id, bidder_corp_id)
--     row stays; bid_aircraft_rfp now checks the existing status and
--     returns 'already_rejected' instead of letting the INSERT raise
--     a constraint violation).
--
--   cancel_ent_aircraft_rfp(p_rfp_id) — owner cancels an open RFP.
--     Hard precondition: zero PENDING bids. Rejected bids don't
--     block. The FOR UPDATE on the RFP row serialises against
--     concurrent place-bid calls so a bid landing mid-cancel either
--     wins the race (and the cancel returns has_bids) or sees the
--     cancelled status (and bid_aircraft_rfp returns 'not_open').
--
-- Adds 'rejected' to the bid status CHECK constraint. Existing
-- statuses ('pending','won','lost','withdrawn') stay valid.
--
-- Apply after 20270621.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Widen the bid status CHECK to include 'rejected' ───────────
ALTER TABLE public.ent_aircraft_rfp_bids
    DROP CONSTRAINT IF EXISTS ent_aircraft_rfp_bids_status_check;
ALTER TABLE public.ent_aircraft_rfp_bids
    ADD CONSTRAINT ent_aircraft_rfp_bids_status_check
    CHECK (status IN ('pending','won','lost','withdrawn','rejected'));

-- ── 2. reject_ent_aircraft_rfp_bid ────────────────────────────────
CREATE OR REPLACE FUNCTION public.reject_ent_aircraft_rfp_bid(
    p_bid_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_fac     factions%ROWTYPE;
    v_airline entrepreneur_corps%ROWTYPE;
    v_bid     ent_aircraft_rfp_bids%ROWTYPE;
    v_rfp     ent_aircraft_rfps%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_bid FROM ent_aircraft_rfp_bids WHERE id = p_bid_id FOR UPDATE;
    IF v_bid.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bid_not_found');
    END IF;
    IF v_bid.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bid_not_pending');
    END IF;

    SELECT * INTO v_rfp FROM ent_aircraft_rfps WHERE id = v_bid.rfp_id FOR UPDATE;
    IF v_rfp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'rfp_not_found');
    END IF;
    IF v_rfp.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'rfp_not_open');
    END IF;

    SELECT * INTO v_airline FROM entrepreneur_corps WHERE id = v_rfp.airline_corp_id;
    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL OR v_airline.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_airline_owner');
    END IF;

    UPDATE ent_aircraft_rfp_bids SET status = 'rejected' WHERE id = p_bid_id;

    RETURN jsonb_build_object('success', true, 'bid_id', p_bid_id);
END;
$$;
GRANT EXECUTE ON FUNCTION public.reject_ent_aircraft_rfp_bid(uuid) TO authenticated;

-- ── 3. cancel_ent_aircraft_rfp ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cancel_ent_aircraft_rfp(
    p_rfp_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_fac     factions%ROWTYPE;
    v_airline entrepreneur_corps%ROWTYPE;
    v_rfp     ent_aircraft_rfps%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_rfp FROM ent_aircraft_rfps WHERE id = p_rfp_id FOR UPDATE;
    IF v_rfp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'rfp_not_found');
    END IF;
    IF v_rfp.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'rfp_not_open');
    END IF;

    SELECT * INTO v_airline FROM entrepreneur_corps WHERE id = v_rfp.airline_corp_id;
    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL OR v_airline.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_airline_owner');
    END IF;

    IF EXISTS (SELECT 1 FROM ent_aircraft_rfp_bids
                WHERE rfp_id = p_rfp_id AND status = 'pending') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'has_bids');
    END IF;

    UPDATE ent_aircraft_rfps SET status = 'cancelled' WHERE id = p_rfp_id;

    RETURN jsonb_build_object('success', true, 'rfp_id', p_rfp_id);
END;
$$;
GRANT EXECUTE ON FUNCTION public.cancel_ent_aircraft_rfp(uuid) TO authenticated;

-- ── 4. bid_aircraft_rfp — friendly error on rejected re-bid ────────
-- Body lifted verbatim from 20270587 with a single pre-check added:
-- if the bidder already has a 'rejected' row for this RFP, return
-- 'already_rejected' instead of letting the UNIQUE(rfp_id,
-- bidder_corp_id) INSERT raise a constraint violation. The other
-- terminal states ('won','lost','withdrawn') are unreachable while
-- RFP.status='open' (the existing not_open check above blocks them).
CREATE OR REPLACE FUNCTION public.bid_aircraft_rfp(
    p_corp_id        uuid,
    p_rfp_id         uuid,
    p_design_id      uuid,
    p_price_per_unit bigint
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_fac     factions%ROWTYPE;
    v_corp    entrepreneur_corps%ROWTYPE;
    v_rfp     ent_aircraft_rfps%ROWTYPE;
    v_design  ent_aircraft_designs%ROWTYPE;
    v_prior   ent_aircraft_rfp_bids%ROWTYPE;
    v_tick    int;
    v_id      uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_price_per_unit IS NULL OR p_price_per_unit < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_price');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'aviation_manufacturing' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_manufacturer');
    END IF;
    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL OR v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    SELECT * INTO v_rfp FROM ent_aircraft_rfps WHERE id = p_rfp_id FOR UPDATE;
    IF v_rfp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'rfp_not_found');
    END IF;
    IF v_rfp.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_open');
    END IF;
    IF v_rfp.airline_corp_id = p_corp_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'own_rfp');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF v_tick >= v_rfp.bidding_closes_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_open');
    END IF;

    -- 20270622: lockout check. A rejected bidder can't re-bid on the
    -- same RFP. Returns a clean reason instead of letting the UNIQUE
    -- (rfp_id, bidder_corp_id) constraint raise on the INSERT below.
    SELECT * INTO v_prior FROM ent_aircraft_rfp_bids
     WHERE rfp_id = p_rfp_id AND bidder_corp_id = p_corp_id;
    IF v_prior.id IS NOT NULL AND v_prior.status = 'rejected' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_rejected');
    END IF;

    SELECT * INTO v_design FROM ent_aircraft_designs WHERE id = p_design_id;
    IF v_design.id IS NULL OR v_design.entrepreneur_corp_id <> p_corp_id
       OR v_design.design_type <> 'aircraft' OR v_design.status <> 'available' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'design_unavailable');
    END IF;
    IF v_design.airframe_class IS DISTINCT FROM v_rfp.aircraft_class THEN
        RETURN jsonb_build_object('success', false, 'reason', 'class_mismatch');
    END IF;
    IF p_price_per_unit < COALESCE(v_design.cost_per_unit, 0) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bid_below_cost',
            'floor', COALESCE(v_design.cost_per_unit, 0));
    END IF;

    INSERT INTO ent_aircraft_rfp_bids
        (rfp_id, bidder_corp_id, design_id, price_per_unit, created_tick)
    VALUES (p_rfp_id, p_corp_id, p_design_id, p_price_per_unit, v_tick)
    RETURNING id INTO v_id;

    RETURN jsonb_build_object('success', true, 'bid_id', v_id, 'price_per_unit', p_price_per_unit);
END;
$$;
GRANT EXECUTE ON FUNCTION public.bid_aircraft_rfp(uuid, uuid, uuid, bigint) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
