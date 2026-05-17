-- ════════════════════════════════════════════════════════════════
-- Corp construction contract payout fix.
--
-- BUG: a contract whose accepted corp_contract_bids.bid_amount is
-- NULL/0 completes in processCorpContracts but the payout is
-- if (totalBid>0)-skipped while status still flips to 'completed' —
-- it leaves the active pool forever, never paid, no retry. The corp
-- silently loses the contract value.
--
-- Three-part fix (per product decision: payout is always bid_amount;
-- the award path must guarantee it; backfill + retro-pay existing
-- affected contracts):
--
--   1. award_construction_contract: refuse to award (stay 'open')
--      if the winning bid's bid_amount is NULL/<=0 — no contract can
--      ever go 'active' unpayable. CREATE OR REPLACE, byte-for-byte
--      the 20260506 body with only the guard added (same signature).
--   2. Retro-pay every status='completed' contract whose accepted
--      bid had NULL/0 bid_amount (definitively never paid — the only
--      payout path skips totalBid<=0): credit its budget to the
--      winner corp via the emit_corp_cash_event SSoT helper (atomic
--      ledger + corp_cash_reserves).
--   3. Backfill those broken accepted bids' bid_amount = the
--      contract budget (what the UI shows as VALUE and what a normal
--      award would have set), so active/awarded ones pay + cost
--      correctly going forward and re-running this migration is a
--      no-op (idempotent: the broken-set filter no longer matches).
--
-- (The matching tick-side safeguard — never finalize a contract
-- unless the corp was actually credited; otherwise stay active and
-- retry — ships in advance-corp-tick/index.ts processCorpContracts.)
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION award_construction_contract(p_contract_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_contract       corp_contracts%ROWTYPE;
    v_caller         UUID := auth.uid();
    v_caller_owns    BOOLEAN;
    v_tick           INT;

    v_winning_bid    corp_contract_bids%ROWTYPE;
    v_winning_bid_id UUID;
    v_winning_score  NUMERIC;
    v_winner_faction factions%ROWTYPE;
    v_bid_count      INT;
BEGIN
    SELECT * INTO v_contract FROM corp_contracts WHERE id = p_contract_id FOR UPDATE;
    IF v_contract.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Contract not found');
    END IF;
    IF v_contract.status <> 'open' THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Contract is not open (status: %s)', v_contract.status));
    END IF;

    IF v_contract.issuer_faction_id IS NOT NULL THEN
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
        IF v_caller IS NOT NULL THEN
            RETURN jsonb_build_object('success', false,
                'error', 'AI/government contracts auto-resolve via the tick processor');
        END IF;
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No active shard');
    END IF;

    SELECT COUNT(*) INTO v_bid_count FROM corp_contract_bids WHERE contract_id = p_contract_id;
    IF v_bid_count = 0 THEN
        UPDATE corp_contracts SET status = 'cancelled' WHERE id = p_contract_id;
        RETURN jsonb_build_object(
            'success', true,
            'winner', NULL,
            'note', 'No bids — contract cancelled'
        );
    END IF;

    WITH ranked AS (
        SELECT b.id,
               b.bid_amount,
               b.created_at_tick,
               ((
                  GREATEST(0, LEAST(1, 1 - (b.bid_amount::numeric / GREATEST(v_contract.budget, 1))))
                + GREATEST(0, LEAST(1,
                    (v_contract.timeline_months - COALESCE(b.quoted_timeline_months, v_contract.timeline_months))::numeric
                    / GREATEST(v_contract.timeline_months * 0.30, 0.01)))
                + GREATEST(0, LEAST(1, COALESCE(f.corp_reputation, 0)::numeric / 10))
               ) / 3.0) AS score
        FROM corp_contract_bids b
        JOIN factions f ON f.id = b.faction_id
        WHERE b.contract_id = p_contract_id
    )
    SELECT id, score
    INTO v_winning_bid_id, v_winning_score
    FROM ranked
    ORDER BY score DESC, bid_amount ASC, created_at_tick ASC
    LIMIT 1;

    SELECT * INTO v_winning_bid   FROM corp_contract_bids WHERE id = v_winning_bid_id;
    SELECT * INTO v_winner_faction FROM factions          WHERE id = v_winning_bid.faction_id;

    -- Guard: never award an unpayable contract. processCorpContracts
    -- pays bid_amount on completion; a NULL/<=0 amount would complete
    -- the contract for free. Refuse — the contract stays 'open'.
    IF v_winning_bid.bid_amount IS NULL OR v_winning_bid.bid_amount <= 0 THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Winning bid has no amount — award refused (would create an unpayable contract)');
    END IF;

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
  'Picks and applies the winning bid for a construction contract (1/3 cost + 1/3 time + 1/3 reputation composite). Player-issued: issuer only. AI/government: service_role only. Refuses to award if the winning bid has no amount (would be unpayable).';

-- ── 2. Retro-pay completed-but-unpaid contracts ──────────────────
-- Completed + accepted bid bid_amount NULL/0 ⟹ the only payout path
-- (processCorpContracts, gated if totalBid>0) was skipped ⟹ the corp
-- was definitively never paid. Credit budget via the SSoT helper.
-- Run BEFORE the backfill so the broken set is still identifiable;
-- after backfill the filter no longer matches → idempotent.
DO $$
DECLARE
    r      RECORD;
    v_tick INT;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    FOR r IN
        SELECT cc.id,
               cc.name,
               cc.budget,
               COALESCE(cc.winner_faction_id, b.faction_id) AS corp
        FROM corp_contracts cc
        JOIN corp_contract_bids b
          ON b.contract_id = cc.id AND b.status = 'accepted'
        WHERE cc.status = 'completed'
          AND (b.bid_amount IS NULL OR b.bid_amount <= 0)
          AND cc.budget IS NOT NULL AND cc.budget > 0
          AND COALESCE(cc.winner_faction_id, b.faction_id) IS NOT NULL
    LOOP
        PERFORM emit_corp_cash_event(
            r.corp,
            'capital_in',
            COALESCE(r.name, 'Project') || ' · final payment (corrected)',
            r.budget::numeric,
            v_tick
        );
        RAISE NOTICE 'Retro-paid corp % for completed contract % ($%)', r.corp, r.name, r.budget;
    END LOOP;
END $$;

-- ── 3. Backfill broken accepted bids (idempotency + future ticks) ──
UPDATE corp_contract_bids b
   SET bid_amount = cc.budget
  FROM corp_contracts cc
 WHERE b.contract_id = cc.id
   AND b.status = 'accepted'
   AND (b.bid_amount IS NULL OR b.bid_amount <= 0)
   AND cc.budget IS NOT NULL AND cc.budget > 0
   AND cc.status IN ('active', 'awarded', 'completed');

NOTIFY pgrst, 'reload schema';
