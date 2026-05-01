-- ══════════════════════════════════════════════════════════════
-- Construction Operations: Award Contract (Phase B of bid-modal redesign)
--
-- Picks the winning bid for a contract using the composite-score
-- formula:
--
--   cost_score = clamp(1 − (bid_amount / contract.budget), 0, 1)
--                lower bid → higher score, capped at budget
--
--   time_score = clamp(
--       (contract.timeline_months − bid_quoted_timeline_months) /
--       (contract.timeline_months × 0.30), 0, 1)
--                fastest-possible (0.7×) maps to 1.0; original timeline
--                (1 crew, no reduction) maps to 0.0; full spread.
--
--   rep_score  = clamp(bidder.corp_reputation / 10, 0, 1)
--
--   total = (cost_score + time_score + rep_score) / 3
--
-- The bid with the highest total wins. Ties broken by the lowest
-- bid_amount, then earliest created_at_tick.
--
-- Authorization:
--   - Player-issued contracts (issuer_faction_id IS NOT NULL): only the
--     issuer (faction id match or linked_user_id match) can award.
--   - AI/government contracts (issuer_faction_id IS NULL): only the
--     service_role / tick processor can award (auth.uid() must be NULL).
--     Phase C wires this into the tick cron.
--
-- Side effects on success:
--   corp_contracts.winner_faction_id    = winning bid's faction
--   corp_contracts.status               = 'active'
--   corp_contracts.awarded_at           = NOW()
--   corp_contracts.started_at_tick      = current tick
--   corp_contracts.budget               = winning bid's bid_amount
--   corp_contracts.timeline_months      = winning bid's quoted_timeline
--   corp_contracts.deadline_tick        = current_tick + quoted_timeline
--   corp_contracts.expected_finish_tick = same as deadline initially
--   winning bid          → status = 'accepted'
--   all other bids       → status = 'rejected'
--
-- If there are zero bids when called: contract is set to 'cancelled'
-- so it stops showing up as an open opportunity. Returns success=true
-- with winner=null and a note.
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION award_construction_contract(p_contract_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_contract     corp_contracts%ROWTYPE;
    v_caller       UUID := auth.uid();
    v_caller_owns  BOOLEAN;
    v_tick         INT;

    v_winning_bid  corp_contract_bids%ROWTYPE;
    v_winning_score NUMERIC;
    v_winner_faction factions%ROWTYPE;
    v_bid_count    INT;
BEGIN
    -- ── Contract lookup + status guard ──
    SELECT * INTO v_contract FROM corp_contracts WHERE id = p_contract_id;
    IF v_contract.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Contract not found');
    END IF;
    IF v_contract.status <> 'open' THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Contract is not open (status: %s)', v_contract.status));
    END IF;

    -- ── Authorization ──
    IF v_contract.issuer_faction_id IS NOT NULL THEN
        -- Player-issued: caller must own the issuer corp.
        IF v_caller IS NULL THEN
            RETURN jsonb_build_object('success', false,
                'error', 'Authentication required to award player-issued contract');
        END IF;
        SELECT (id = v_caller OR linked_user_id = v_caller) INTO v_caller_owns
        FROM factions WHERE id = v_contract.issuer_faction_id;
        IF NOT COALESCE(v_caller_owns, false) THEN
            RETURN jsonb_build_object('success', false,
                'error', 'Only the issuer can award this contract');
        END IF;
    ELSE
        -- AI/government-issued: only service_role (auth.uid() IS NULL).
        IF v_caller IS NOT NULL THEN
            RETURN jsonb_build_object('success', false,
                'error', 'AI/government contracts auto-resolve via the tick processor');
        END IF;
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No active shard');
    END IF;

    -- ── No bids: cancel ──
    SELECT COUNT(*) INTO v_bid_count FROM corp_contract_bids WHERE contract_id = p_contract_id;
    IF v_bid_count = 0 THEN
        UPDATE corp_contracts SET status = 'cancelled' WHERE id = p_contract_id;
        RETURN jsonb_build_object(
            'success', true,
            'winner', NULL,
            'note', 'No bids — contract cancelled'
        );
    END IF;

    -- ── Pick the winning bid via composite score ──
    -- Budget / timeline guard against div-by-zero (default to 1 so a
    -- malformed contract row doesn't crash the function).
    SELECT b.*,
           ((
              GREATEST(0, LEAST(1, 1 - (b.bid_amount::numeric / GREATEST(v_contract.budget, 1))))
            + GREATEST(0, LEAST(1,
                (v_contract.timeline_months - COALESCE(b.quoted_timeline_months, v_contract.timeline_months))::numeric
                / GREATEST(v_contract.timeline_months * 0.30, 0.01)))
            + GREATEST(0, LEAST(1, COALESCE(f.corp_reputation, 0)::numeric / 10))
           ) / 3.0) AS composite_score
    INTO v_winning_bid
    FROM corp_contract_bids b
    JOIN factions f ON f.id = b.faction_id
    WHERE b.contract_id = p_contract_id
    ORDER BY composite_score DESC, b.bid_amount ASC, b.created_at_tick ASC
    LIMIT 1;

    -- Recompute the score on the winner so we can return it (we discarded
    -- it from the row by virtue of selecting INTO a typed rowtype).
    SELECT (
              GREATEST(0, LEAST(1, 1 - (v_winning_bid.bid_amount::numeric / GREATEST(v_contract.budget, 1))))
            + GREATEST(0, LEAST(1,
                (v_contract.timeline_months - COALESCE(v_winning_bid.quoted_timeline_months, v_contract.timeline_months))::numeric
                / GREATEST(v_contract.timeline_months * 0.30, 0.01)))
            + GREATEST(0, LEAST(1, COALESCE(f.corp_reputation, 0)::numeric / 10))
           ) / 3.0
    INTO v_winning_score
    FROM factions f
    WHERE f.id = v_winning_bid.faction_id;

    SELECT * INTO v_winner_faction FROM factions WHERE id = v_winning_bid.faction_id;

    -- ── Apply award ──
    UPDATE corp_contracts
    SET winner_faction_id    = v_winning_bid.faction_id,
        status               = 'active',
        awarded_at           = NOW(),
        started_at_tick      = v_tick,
        budget               = v_winning_bid.bid_amount,
        timeline_months      = COALESCE(v_winning_bid.quoted_timeline_months, v_contract.timeline_months),
        deadline_tick        = v_tick + COALESCE(v_winning_bid.quoted_timeline_months, v_contract.timeline_months),
        expected_finish_tick = v_tick + COALESCE(v_winning_bid.quoted_timeline_months, v_contract.timeline_months)
    WHERE id = p_contract_id;

    -- Mark winning bid accepted, all others rejected.
    UPDATE corp_contract_bids
    SET status = CASE
        WHEN id = v_winning_bid.id THEN 'accepted'
        ELSE 'rejected'
    END
    WHERE contract_id = p_contract_id;

    RETURN jsonb_build_object(
        'success', true,
        'winner', jsonb_build_object(
            'faction_id',   v_winning_bid.faction_id,
            'faction_name', v_winner_faction.faction_name,
            'bid_amount',   v_winning_bid.bid_amount,
            'quoted_timeline_months', v_winning_bid.quoted_timeline_months,
            'crews_committed', v_winning_bid.crews_committed,
            'markup_pct',   v_winning_bid.markup_pct,
            'composite_score', ROUND(v_winning_score, 4)
        ),
        'bids_evaluated', v_bid_count
    );
END;
$$;

GRANT EXECUTE ON FUNCTION award_construction_contract(UUID) TO authenticated;

COMMENT ON FUNCTION award_construction_contract(UUID) IS
  'Picks and applies the winning bid for a construction contract using a 1/3 cost + 1/3 time + 1/3 reputation composite score. Player-issued contracts: callable only by the issuer. AI/government contracts: callable only by service_role (the Phase C tick processor). Returns the winner row + score.';
