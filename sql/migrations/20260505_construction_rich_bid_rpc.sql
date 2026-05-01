-- ══════════════════════════════════════════════════════════════
-- Construction Operations: Rich Bid (Phase A of bid-modal redesign)
--
-- Replaces place_construction_bid with a richer signature that takes
-- the player's crew commitment + markup choice. Server computes the
-- final cost and timeline using the locked formulas:
--
--   base_cost     = contract.budget × 0.70
--   supply_mult   = 1.30 − (corp_supply_chain × 0.06)        [1.30..0.70]
--   crew_mult     = {1.00, 1.05, 1.10}[crews − 1]
--   crew_time_mult= {1.00, 0.80, 0.70}[crews − 1]
--
--   bid_amount         = round(base_cost × supply_mult × crew_mult × (1 + markup_pct/100))
--   quoted_timeline_mo = round(contract.timeline_months × crew_time_mult)
--
-- Schema additions on corp_contract_bids:
--   crews_committed         SMALLINT (1..3)
--   markup_pct              SMALLINT (10..50, multiples of 10)
--   quoted_timeline_months  INT
-- ══════════════════════════════════════════════════════════════

ALTER TABLE corp_contract_bids
  ADD COLUMN IF NOT EXISTS crews_committed         SMALLINT,
  ADD COLUMN IF NOT EXISTS markup_pct              SMALLINT,
  ADD COLUMN IF NOT EXISTS quoted_timeline_months  INT;

DO $$ BEGIN
  ALTER TABLE corp_contract_bids
    ADD CONSTRAINT corp_contract_bids_crews_committed_range
      CHECK (crews_committed IS NULL OR crews_committed BETWEEN 1 AND 3);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE corp_contract_bids
    ADD CONSTRAINT corp_contract_bids_markup_pct_range
      CHECK (markup_pct IS NULL OR (markup_pct BETWEEN 10 AND 50 AND markup_pct % 10 = 0));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON COLUMN corp_contract_bids.crews_committed IS
  'Crews the bidder commits to this project (1, 2, or 3). Drives timeline reduction (×1.00/0.80/0.70) and a small cost premium (×1.00/1.05/1.10).';
COMMENT ON COLUMN corp_contract_bids.markup_pct IS
  'Player''s chosen markup over computed cost (10/20/30/40/50). Applied AFTER supply-chain and crew multipliers.';
COMMENT ON COLUMN corp_contract_bids.quoted_timeline_months IS
  'Final quoted timeline shown to the issuer. Computed from contract.timeline_months × crew_time_mult.';

-- ─────────────────────────────────────────────────────────────
-- Drop the Phase 3 signature so the new (richer) one replaces it cleanly.
-- ─────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS place_construction_bid(UUID, UUID, TEXT);

CREATE OR REPLACE FUNCTION place_construction_bid(
    p_contract_id        UUID,
    p_bidder_faction_id  UUID,
    p_crews_committed    INT,
    p_markup_pct         INT,
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

    v_supply_mult    NUMERIC;
    v_crew_mult      NUMERIC;
    v_crew_time_mult NUMERIC;
    v_base_cost      NUMERIC;
    v_bid_amount     BIGINT;
    v_quoted_months  INT;
BEGIN
    -- ── Auth ──
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

    -- ── Contract + status ──
    SELECT * INTO v_contract FROM corp_contracts WHERE id = p_contract_id;
    IF v_contract.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Contract not found');
    END IF;
    IF v_contract.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Contract is not accepting bids');
    END IF;
    IF v_contract.required_sector IS NOT NULL
       AND v_contract.required_sector <> v_bidder.corp_sector THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Requires %s sector', v_contract.required_sector));
    END IF;

    -- ── Argument validation ──
    IF p_crews_committed IS NULL OR p_crews_committed NOT IN (1, 2, 3) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Crews committed must be 1, 2, or 3');
    END IF;
    IF p_markup_pct IS NULL OR p_markup_pct NOT IN (10, 20, 30, 40, 50) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Markup must be 10, 20, 30, 40, or 50');
    END IF;
    IF COALESCE(v_bidder.corp_work_crews, 0) < p_crews_committed THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Cannot commit %s crews — your Work Crews stat is %s',
                p_crews_committed, COALESCE(v_bidder.corp_work_crews, 0)));
    END IF;

    -- ── Requirement gates (regulatory standing, supply chain, etc.) ──
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

    -- ── AP gate (cost is fixed at 2 AP per bid) ──
    IF COALESCE(v_bidder.action_points, 0) < 2 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Need 2 AP to place a bid');
    END IF;

    -- ── Compute bid using the locked formulas ──
    v_supply_mult := 1.30 - (COALESCE(v_bidder.corp_supply_chain, 0) * 0.06);
    v_crew_mult := CASE p_crews_committed WHEN 1 THEN 1.00 WHEN 2 THEN 1.05 WHEN 3 THEN 1.10 END;
    v_crew_time_mult := CASE p_crews_committed WHEN 1 THEN 1.00 WHEN 2 THEN 0.80 WHEN 3 THEN 0.70 END;

    v_base_cost := v_contract.budget * 0.70;
    v_bid_amount := ROUND(v_base_cost * v_supply_mult * v_crew_mult * (1 + p_markup_pct::numeric / 100))::BIGINT;
    v_quoted_months := ROUND(v_contract.timeline_months * v_crew_time_mult)::INT;

    -- ── Apply: deduct AP, upsert bid ──
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    UPDATE factions
    SET action_points = COALESCE(action_points, 0) - 2
    WHERE id = p_bidder_faction_id;

    INSERT INTO corp_contract_bids (
        contract_id, faction_id, nation_id, ap_spent,
        bid_amount, bid_message, created_at_tick,
        crews_committed, markup_pct, quoted_timeline_months
    ) VALUES (
        p_contract_id, p_bidder_faction_id, v_bidder.nation_id, 2,
        v_bid_amount, p_bid_message, v_tick,
        p_crews_committed, p_markup_pct, v_quoted_months
    )
    ON CONFLICT (contract_id, faction_id) DO UPDATE SET
        bid_amount             = EXCLUDED.bid_amount,
        bid_message            = EXCLUDED.bid_message,
        created_at_tick        = EXCLUDED.created_at_tick,
        crews_committed        = EXCLUDED.crews_committed,
        markup_pct             = EXCLUDED.markup_pct,
        quoted_timeline_months = EXCLUDED.quoted_timeline_months;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Bid placed',
        'bid_amount', v_bid_amount,
        'quoted_timeline_months', v_quoted_months,
        'crews_committed', p_crews_committed,
        'markup_pct', p_markup_pct
    );
END;
$$;

GRANT EXECUTE ON FUNCTION place_construction_bid(UUID, UUID, INT, INT, TEXT) TO authenticated;
