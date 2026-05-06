-- 20260914_vola_stadium_construction.sql
--
-- Sports Minister "Expand Stadium Infrastructure" action.
-- Posts a Construction-sector contract that all Construction Corps can
-- bid on. The minister sees the bids, picks one to accept (others auto-
-- reject), or rejects/cancels. On completion, the host nation gets +1
-- vola_stadiums and a permanent floor on national_vola_culture (decay
-- can never bring culture below sum-of-stadium-floors).
--
-- ── New column ──
--   nations.vola_culture_floor NUMERIC(5,1) — sum of every completed
--   stadium's floor contribution. processVolaCultureDecay clamps next
--   value at MAX(floor, decayed) instead of MAX(0, decayed).
--
-- ── New RPCs ──
--   award_stadium_bid_to_corp(p_bid_id)       — minister accepts a bid
--   reject_stadium_bid(p_bid_id)              — minister rejects one bid
--   cancel_stadium_contract(p_contract_id)    — minister cancels open
--                                                contract + refund
--
-- All three SECURITY DEFINER, gate on caller = active sports minister
-- party owner of the issuing nation. Government-issued contracts have
-- issuer_faction_id IS NULL so they bypass the existing "issuer can
-- update bid status" RLS — these RPCs are the sole accept/reject path.
--
-- Refund discretionary cost on cancel: derived from spec_category since
-- we don't keep a separate refund-amount column. Mapping mirrors the
-- frontend constants (Light=$3M, Heavy=$7M, Megaproject=$10M).

BEGIN;

-- 1. Floor column
ALTER TABLE public.nations
    ADD COLUMN IF NOT EXISTS vola_culture_floor NUMERIC(5,1) NOT NULL DEFAULT 0
        CHECK (vola_culture_floor BETWEEN 0 AND 100);

COMMENT ON COLUMN public.nations.vola_culture_floor IS
    'Sum of completed Vola stadium floor contributions. national_vola_culture decay is clamped at this value (cannot drop below).';

-- 2. Helper: confirm caller owns the active sports minister seat for a nation.
CREATE OR REPLACE FUNCTION _is_active_sports_minister(p_nation_id UUID, p_user UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (
        SELECT 1
        FROM ministries m
        JOIN factions  f ON f.id = m.party_id
        WHERE m.nation_id    = p_nation_id
          AND m.ministry_key = 'sports'
          AND m.is_active    = true
          AND (f.id = p_user OR f.linked_user_id = p_user)
    );
$$;

-- 3. Award a specific bid to a corp.
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

    -- Caller must be the active sports minister of the issuing nation
    -- (or service_role with NULL caller — tick processor convenience).
    IF v_caller IS NOT NULL AND NOT _is_active_sports_minister(v_contract.issuer_nation_id, v_caller) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only the Sports Minister can accept this bid');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    -- Snapshot bid budget + timeline onto the contract (matches
    -- award_construction_contract behaviour).
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

-- 4. Reject a single bid (others stay pending, contract stays open).
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

-- 5. Cancel an open stadium contract + refund the discretionary cost.
CREATE OR REPLACE FUNCTION cancel_stadium_contract(p_contract_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_caller         UUID := auth.uid();
    v_contract       corp_contracts%ROWTYPE;
    v_refund_amount  BIGINT := 0;
BEGIN
    SELECT * INTO v_contract FROM corp_contracts WHERE id = p_contract_id FOR UPDATE;
    IF v_contract.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Contract not found');
    END IF;
    IF v_contract.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Contract is no longer open');
    END IF;
    IF v_contract.project_subtype <> 'Vola Stadium' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not a stadium contract');
    END IF;
    IF v_caller IS NOT NULL AND NOT _is_active_sports_minister(v_contract.issuer_nation_id, v_caller) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only the Sports Minister can cancel this contract');
    END IF;

    -- Refund mapping: spec_category → discretionary cost paid at posting.
    -- Mirrors VOLA_STADIUM_TIERS in js/game/political-actions.js.
    v_refund_amount := CASE v_contract.spec_category
        WHEN 'Light Infrastructure' THEN 3000000
        WHEN 'Heavy Infrastructure' THEN 7000000
        WHEN 'Megaproject'          THEN 10000000
        ELSE 0
    END;

    -- Cancel contract.
    UPDATE corp_contracts SET status = 'cancelled' WHERE id = p_contract_id;

    -- Reject any pending bids on this contract.
    UPDATE corp_contract_bids
       SET status = 'rejected'
     WHERE contract_id = p_contract_id AND status = 'pending';

    -- Refund discretionary balance to the active sports ministry row.
    IF v_refund_amount > 0 THEN
        UPDATE ministries
           SET discretionary_balance = COALESCE(discretionary_balance, 0) + v_refund_amount
         WHERE nation_id    = v_contract.issuer_nation_id
           AND ministry_key = 'sports'
           AND is_active    = true;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'refund_amount', v_refund_amount
    );
END;
$$;

GRANT EXECUTE ON FUNCTION cancel_stadium_contract(UUID) TO authenticated;

COMMENT ON FUNCTION award_stadium_bid_to_corp(UUID) IS
  'Sports Minister picks a specific bid as the winner. Sets contract status=active, marks bid accepted, others rejected. SECURITY DEFINER bypasses the issuer_faction_id RLS gate for government contracts.';
COMMENT ON FUNCTION reject_stadium_bid(UUID) IS
  'Sports Minister rejects a single bid; contract stays open for other corps to bid.';
COMMENT ON FUNCTION cancel_stadium_contract(UUID) IS
  'Sports Minister cancels an open stadium contract. Refunds the discretionary cost ($3M/$7M/$10M by spec_category) to the active sports ministry row and rejects any pending bids.';

NOTIFY pgrst, 'reload schema';

COMMIT;
