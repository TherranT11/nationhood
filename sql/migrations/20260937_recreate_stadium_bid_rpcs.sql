-- 20260937_recreate_stadium_bid_rpcs.sql
--
-- Bug: trying to ACCEPT a stadium bid in the Sports Ministry modal
-- raises "Could not find the function
-- public.award_stadium_bid_to_corp(p_bid_id) in the schema cache."
--
-- Cause: same drift class as the _is_active_sports_minister miss
-- earlier in the project. Migration 20260914_vola_stadium_construction.sql
-- created award_stadium_bid_to_corp + reject_stadium_bid +
-- _is_active_sports_minister + cancel_stadium_contract; the live DB
-- has the cancel/helper functions (we recreated them in earlier
-- migrations) but never picked up these two.
--
-- Fix: re-CREATE both RPCs with their canonical bodies (byte-for-byte
-- copies from 20260914 lines 56-147). Idempotent
-- (CREATE OR REPLACE FUNCTION). No data backfill, no schema change.
--
-- After this lands, the ACCEPT and REJECT buttons in the Sports
-- Ministry modal both work; pending stadium bids can be awarded
-- and the construction phase actually starts.

BEGIN;

-- award_stadium_bid_to_corp ─ minister accepts a pending bid.
-- Snapshots the bid budget+timeline onto the contract row, marks
-- the contract active, accepts the chosen bid, rejects the rest.
CREATE OR REPLACE FUNCTION award_stadium_bid_to_corp(p_bid_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_caller    UUID := auth.uid();
    v_bid       corp_contract_bids%ROWTYPE;
    v_contract  corp_contracts%ROWTYPE;
    v_tick      INT;
BEGIN
    SELECT * INTO v_bid FROM corp_contract_bids WHERE id = p_bid_id;
    IF v_bid.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Bid not found');
    END IF;
    IF v_bid.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Bid is not pending');
    END IF;

    SELECT * INTO v_contract FROM corp_contracts WHERE id = v_bid.contract_id FOR UPDATE;
    IF v_contract.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Contract not found');
    END IF;
    IF v_contract.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Contract is not open');
    END IF;
    IF v_contract.project_subtype <> 'Vola Stadium' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not a stadium contract');
    END IF;

    IF v_caller IS NOT NULL AND NOT _is_active_sports_minister(v_contract.issuer_nation_id, v_caller) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only the Sports Minister can accept this bid');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    UPDATE corp_contracts
       SET winner_faction_id    = v_bid.faction_id,
           status               = 'active',
           awarded_at           = NOW(),
           started_at_tick      = v_tick,
           budget               = COALESCE(v_bid.bid_amount, v_contract.budget),
           timeline_months      = COALESCE(v_bid.quoted_timeline_months, v_contract.timeline_months),
           deadline_tick        = v_tick + COALESCE(v_bid.quoted_timeline_months, v_contract.timeline_months),
           expected_finish_tick = v_tick + COALESCE(v_bid.quoted_timeline_months, v_contract.timeline_months)
     WHERE id = v_contract.id;

    UPDATE corp_contract_bids
       SET status = CASE WHEN id = v_bid.id THEN 'accepted' ELSE 'rejected' END
     WHERE contract_id = v_contract.id;

    RETURN jsonb_build_object(
        'success', true,
        'contract_id', v_contract.id,
        'winner_faction_id', v_bid.faction_id,
        'budget', COALESCE(v_bid.bid_amount, v_contract.budget),
        'finish_tick', v_tick + COALESCE(v_bid.quoted_timeline_months, v_contract.timeline_months)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION award_stadium_bid_to_corp(UUID) TO authenticated;

-- reject_stadium_bid ─ minister rejects a single bid; others stay
-- pending, contract stays open.
CREATE OR REPLACE FUNCTION reject_stadium_bid(p_bid_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_caller   UUID := auth.uid();
    v_bid      corp_contract_bids%ROWTYPE;
    v_contract corp_contracts%ROWTYPE;
BEGIN
    SELECT * INTO v_bid FROM corp_contract_bids WHERE id = p_bid_id;
    IF v_bid.id IS NULL OR v_bid.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Bid not found or not pending');
    END IF;
    SELECT * INTO v_contract FROM corp_contracts WHERE id = v_bid.contract_id;
    IF v_contract.project_subtype <> 'Vola Stadium' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not a stadium contract');
    END IF;
    IF v_caller IS NOT NULL AND NOT _is_active_sports_minister(v_contract.issuer_nation_id, v_caller) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only the Sports Minister can reject this bid');
    END IF;

    UPDATE corp_contract_bids SET status = 'rejected' WHERE id = p_bid_id;
    RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION reject_stadium_bid(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
