-- ══════════════════════════════════════════════════════════════
-- Construction Operations Phase 3: contract bidding + crew assignment
--
-- Adds:
--   1. corp_contracts.crews_assigned — replaces the dropped
--      assigned_workforce INTEGER with a NUMERIC(4,2) tied to the new
--      0-10 corp_work_crews scale.
--   2. place_construction_bid RPC — server-side validation of
--      requirements + AP, then INSERTs into corp_contract_bids. AP cost
--      is the existing 2 AP per the corp_contract_bids default.
--   3. assign_construction_crews RPC — lets the winning corp set
--      crews_assigned on their active contract (corp_contracts is
--      otherwise read-only for clients).
-- ══════════════════════════════════════════════════════════════

-- ── crews_assigned column on corp_contracts ──
ALTER TABLE corp_contracts
  ADD COLUMN IF NOT EXISTS crews_assigned NUMERIC(4,2) NOT NULL DEFAULT 0;

DO $$ BEGIN
  ALTER TABLE corp_contracts
    ADD CONSTRAINT corp_contracts_crews_assigned_range
      CHECK (crews_assigned BETWEEN 0 AND 10);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON COLUMN corp_contracts.crews_assigned IS
  '0-10 crews assigned to the contract. Bounded by the winning corp''s corp_work_crews. Replaces the dropped assigned_workforce INTEGER.';

-- ─────────────────────────────────────────────────────────────
-- place_construction_bid: validate then insert one bid
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION place_construction_bid(
    p_contract_id        UUID,
    p_bidder_faction_id  UUID,
    p_bid_message        TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id   UUID := auth.uid();
    v_contract  corp_contracts%ROWTYPE;
    v_bidder    factions%ROWTYPE;
    v_req       JSONB;
    v_key       TEXT;
    v_threshold NUMERIC;
    v_value     NUMERIC;
    v_tick      INT;
BEGIN
    -- ── Auth: caller must own the bidder corp ──
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;
    SELECT * INTO v_bidder FROM factions WHERE id = p_bidder_faction_id;
    IF v_bidder.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Bidder corporation not found');
    END IF;
    IF v_bidder.id <> v_user_id AND v_bidder.linked_user_id <> v_user_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this corporation');
    END IF;
    IF v_bidder.faction_type <> 'corporation' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only corporations can bid');
    END IF;

    -- ── Contract validation ──
    SELECT * INTO v_contract FROM corp_contracts WHERE id = p_contract_id;
    IF v_contract.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Contract not found');
    END IF;
    IF v_contract.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Contract is not accepting bids');
    END IF;

    -- ── Sector match ──
    IF v_contract.required_sector IS NOT NULL
       AND v_contract.required_sector <> v_bidder.corp_sector THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Requires %s sector', v_contract.required_sector));
    END IF;

    -- ── Requirement check (each key in the JSONB compared against the
    --    bidder's matching column on factions). ──
    v_req := COALESCE(v_contract.requirements, '{}'::jsonb);
    IF jsonb_typeof(v_req) = 'object' THEN
        FOR v_key IN SELECT jsonb_object_keys(v_req) LOOP
            v_threshold := (v_req ->> v_key)::numeric;
            v_value := CASE v_key
                WHEN 'work_crews'          THEN v_bidder.corp_work_crews
                WHEN 'regulatory_standing' THEN v_bidder.corp_regulatory_standing
                WHEN 'supply_chain'        THEN v_bidder.corp_supply_chain
                ELSE NULL
            END;
            IF v_value IS NULL OR v_value < v_threshold THEN
                RETURN jsonb_build_object('success', false,
                    'error', format('Requirement not met: %s ≥ %s', v_key, v_threshold));
            END IF;
        END LOOP;
    END IF;

    -- ── AP check + deduct (the bid table's default ap_spent is 2). ──
    IF COALESCE(v_bidder.action_points, 0) < 2 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Need 2 AP to place a bid');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    UPDATE factions
    SET action_points = COALESCE(action_points, 0) - 2
    WHERE id = p_bidder_faction_id;

    -- ── Insert bid (UNIQUE constraint keeps one bid per corp per contract;
    --    upsert so a rebid simply refreshes the message + tick). ──
    INSERT INTO corp_contract_bids (
        contract_id, faction_id, nation_id, ap_spent, bid_amount,
        bid_message, created_at_tick
    ) VALUES (
        p_contract_id, p_bidder_faction_id, v_bidder.nation_id, 2, v_contract.budget,
        p_bid_message, v_tick
    )
    ON CONFLICT (contract_id, faction_id) DO UPDATE SET
        bid_message     = EXCLUDED.bid_message,
        created_at_tick = EXCLUDED.created_at_tick;

    RETURN jsonb_build_object('success', true, 'message', 'Bid placed');
END;
$$;

GRANT EXECUTE ON FUNCTION place_construction_bid(UUID, UUID, TEXT) TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- assign_construction_crews: winning corp sets crews_assigned
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION assign_construction_crews(
    p_contract_id UUID,
    p_crews       NUMERIC
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id  UUID := auth.uid();
    v_contract corp_contracts%ROWTYPE;
    v_corp     factions%ROWTYPE;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT * INTO v_contract FROM corp_contracts WHERE id = p_contract_id;
    IF v_contract.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Contract not found');
    END IF;
    IF v_contract.winner_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Contract has no winner');
    END IF;

    SELECT * INTO v_corp FROM factions WHERE id = v_contract.winner_faction_id;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Winning corp missing');
    END IF;
    IF v_corp.id <> v_user_id AND v_corp.linked_user_id <> v_user_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not your contract');
    END IF;

    IF p_crews IS NULL OR p_crews < 0 OR p_crews > 10 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Crews must be between 0 and 10');
    END IF;
    IF p_crews > COALESCE(v_corp.corp_work_crews, 0) THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Cannot assign %s crews — your corp has %s', p_crews, COALESCE(v_corp.corp_work_crews, 0)));
    END IF;

    UPDATE corp_contracts SET crews_assigned = p_crews WHERE id = p_contract_id;

    RETURN jsonb_build_object('success', true, 'crews_assigned', p_crews);
END;
$$;

GRANT EXECUTE ON FUNCTION assign_construction_crews(UUID, NUMERIC) TO authenticated;
