-- ─────────────────────────────────────────────────────────────────────────────
-- Minister-of-Interior manual award for government construction contracts.
--
-- The Interior Infrastructure flow auto-awards the lowest qualifying bid when
-- the 6-tick bid window closes (process_ent_construction_contracts). The
-- Minister had no manual control: no way to accept a non-lowest bid, no way
-- to reject a specific bidder. Two RPCs added below restore that discretion
-- without disturbing the auto-award path:
--
--   • interior_accept_construction_bid(p_bid_id) — caller must be the active
--     Interior Minister of the contract's issuer nation. Awards the chosen
--     bid immediately by calling the shared _ent_award_construction_contract
--     helper (same state-flip as the tick auto-award), so the contract goes
--     'open' → 'active' with the chosen bid as winner and all other pending
--     bids → 'lost'.
--
--   • interior_reject_construction_bid(p_bid_id) — same auth, sets the bid's
--     status to 'rejected'. Auto-award (which filters status='pending') will
--     skip it at window close; the builder is also locked out of re-bidding
--     on this contract by the ent_place_construction_bid rejected-lockout
--     check added in 20270245. If the minister rejects every pending bid,
--     the auto-award finds none at close and cancels the contract per the
--     existing zero-pending branch in process_ent_construction_contracts.
--
-- Lock order: contract row FOR UPDATE first, same as the tick auto-award and
-- the entrepreneur accept/reject in 20270245 — single serialization point,
-- no deadlock between paths.
--
-- These are siblings of ent_accept_construction_bid / ent_reject_construction_bid
-- (20270245), which only handle 'private' (corp-issued) contracts because they
-- gate on issuer_corp_id. Government (nation-issued) contracts have
-- issuer_corp_id NULL and issuer_nation_id set, so a separate RPC is needed
-- with the ministry-row auth check that mirrors post_interior_infrastructure.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.interior_accept_construction_bid(p_bid_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid      uuid := auth.uid();
    v_ministry ministries%ROWTYPE;
    v_contract ent_construction_contracts%ROWTYPE;
    v_bid      ent_construction_bids%ROWTYPE;
    v_tick     int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_bid FROM ent_construction_bids WHERE id = p_bid_id;
    IF v_bid.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bid_not_found');
    END IF;

    -- Lock the contract first — same lock order as the tick auto-award and
    -- the entrepreneur accept/reject, so all three paths serialize cleanly.
    SELECT * INTO v_contract FROM ent_construction_contracts
     WHERE id = v_bid.contract_id FOR UPDATE;
    IF v_contract.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'contract_not_found');
    END IF;
    IF v_contract.contract_type <> 'government' OR v_contract.issuer_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_government');
    END IF;
    IF v_contract.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_open');
    END IF;

    -- Caller must be the active Interior Minister of the issuer nation.
    -- Pattern mirrors post_interior_infrastructure (20261106:129–137).
    SELECT * INTO v_ministry FROM ministries
     WHERE ministry_key = 'interior' AND is_active = true
       AND nation_id = v_contract.issuer_nation_id
       AND EXISTS (
           SELECT 1 FROM factions f
            WHERE f.id = ministries.party_id
              AND (f.id = v_uid OR f.linked_user_id = v_uid)
       )
     ORDER BY created_at DESC LIMIT 1;
    IF v_ministry.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_minister');
    END IF;

    -- Re-read the bid under the contract lock so its status is authoritative.
    SELECT * INTO v_bid FROM ent_construction_bids WHERE id = p_bid_id;
    IF v_bid.contract_id <> v_contract.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bid_not_found');
    END IF;
    IF v_bid.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bid_not_pending');
    END IF;

    -- Capacity gate mirrors the tick auto-award + entrepreneur Accept — manual
    -- Accept can't bypass the construction-yard cap on commercial buildings.
    -- For Interior Infrastructure (building_type NULL) this short-circuits true.
    IF NOT _ent_bid_capacity_ok(v_bid.bidder_corp_id, v_contract.nation_id, v_contract.building_type) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bidder_at_capacity');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    PERFORM _ent_award_construction_contract(v_contract.id, p_bid_id, v_tick);

    RETURN jsonb_build_object('success', true,
        'contract_id', v_contract.id, 'winning_bid', v_bid.bid_amount);
END;
$$;
GRANT EXECUTE ON FUNCTION public.interior_accept_construction_bid(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.interior_reject_construction_bid(p_bid_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid      uuid := auth.uid();
    v_ministry ministries%ROWTYPE;
    v_contract ent_construction_contracts%ROWTYPE;
    v_bid      ent_construction_bids%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_bid FROM ent_construction_bids WHERE id = p_bid_id;
    IF v_bid.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bid_not_found');
    END IF;

    SELECT * INTO v_contract FROM ent_construction_contracts
     WHERE id = v_bid.contract_id FOR UPDATE;
    IF v_contract.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'contract_not_found');
    END IF;
    IF v_contract.contract_type <> 'government' OR v_contract.issuer_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_government');
    END IF;
    IF v_contract.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_open');
    END IF;

    SELECT * INTO v_ministry FROM ministries
     WHERE ministry_key = 'interior' AND is_active = true
       AND nation_id = v_contract.issuer_nation_id
       AND EXISTS (
           SELECT 1 FROM factions f
            WHERE f.id = ministries.party_id
              AND (f.id = v_uid OR f.linked_user_id = v_uid)
       )
     ORDER BY created_at DESC LIMIT 1;
    IF v_ministry.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_minister');
    END IF;

    SELECT * INTO v_bid FROM ent_construction_bids WHERE id = p_bid_id;
    IF v_bid.contract_id <> v_contract.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bid_not_found');
    END IF;
    IF v_bid.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bid_not_pending');
    END IF;

    UPDATE ent_construction_bids SET status = 'rejected' WHERE id = p_bid_id;
    RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.interior_reject_construction_bid(uuid) TO authenticated;
