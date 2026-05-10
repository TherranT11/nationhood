-- ════════════════════════════════════════════════════════════════
-- Manual finalize for the alliance interest rate vote
--
-- Today, when a vote crosses the >50% threshold on both Floor and
-- Ceiling, sweep_alliance_interest_votes (20260942) sets
-- pending_resolve_at_tick on this tick, posts a "Majority reached.
-- Band updates next tick." chat message, and finalizes on the NEXT
-- tick. The 1-tick delay is intentional (gives stragglers a chance
-- to react before the band locks in) but leaves players watching
-- the modal with no way to push it through earlier.
--
-- This RPC lets any alliance member force the finalization once
-- majority is already locked in (pending_resolve_at_tick IS NOT
-- NULL). Same side effects as the sweep's Pass A:
--   - strategic_alliances.aligned_interest_floor_apr / _ceiling_apr
--     get the pending values
--   - alliance_interest_votes.status flips to 'resolved'
--   - winning_floor_apr / winning_ceiling_apr / resolved_at_tick
--     written
--   - System chat row posted
--
-- Won't fire if majority hasn't been reached — the caller would
-- need to wait for the sweep to set pending_resolve_at_tick first
-- (one tick after majority).
-- ════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION finalize_alliance_interest_vote(p_vote_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_vote   alliance_interest_votes%ROWTYPE;
    v_tick   INT;
    v_caller UUID := auth.uid();
BEGIN
    IF v_caller IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_vote FROM alliance_interest_votes WHERE id = p_vote_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'reason', 'vote_not_found');
    END IF;

    IF v_vote.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'vote_not_open');
    END IF;

    IF v_vote.pending_resolve_at_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'majority_not_reached');
    END IF;

    -- Caller must be a member of the alliance. Reuses the helper
    -- installed by 20260942 (alliance_interest_vote_runtime).
    IF NOT _alliance_caller_is_member(v_vote.alliance_id) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_a_member');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE strategic_alliances
    SET aligned_interest_floor_apr   = v_vote.pending_floor_apr,
        aligned_interest_ceiling_apr = v_vote.pending_ceiling_apr
    WHERE id = v_vote.alliance_id;

    UPDATE alliance_interest_votes
    SET status              = 'resolved',
        resolved_at_tick    = v_tick,
        winning_floor_apr   = v_vote.pending_floor_apr,
        winning_ceiling_apr = v_vote.pending_ceiling_apr
    WHERE id = v_vote.id;

    INSERT INTO alliance_interest_vote_chat (
        alliance_id, author_faction_id, is_observer, is_system,
        body, posted_at_tick
    ) VALUES (
        v_vote.alliance_id, v_vote.initiator_faction_id, false, true,
        format('Interest Rate vote finalized early. Band: Floor %s%%, Ceiling %s%%.',
            v_vote.pending_floor_apr, v_vote.pending_ceiling_apr),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',          true,
        'floor_apr',        v_vote.pending_floor_apr,
        'ceiling_apr',      v_vote.pending_ceiling_apr,
        'resolved_at_tick', v_tick
    );
END;
$$;

GRANT EXECUTE ON FUNCTION finalize_alliance_interest_vote(UUID) TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
