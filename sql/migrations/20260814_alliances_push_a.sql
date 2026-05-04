-- 20260814_alliances_push_a.sql
--
-- Strategic Alliances — Push A (foundation gap-fills + helpers).
--
-- Three pieces:
--   1. _alliance_member_has_article(faction, article_id) → uuid
--      Helper that every per-article runtime hook will call to ask
--      "is this corp in an active alliance with this article ratified?"
--      Returns the alliance id (so the caller can update its cohesion /
--      antitrust_heat etc.) or NULL.
--
--   2. dissolve_failed_alliance_negotiations(current_tick)
--      Tick-driven sweep: every `negotiating` alliance whose
--      proposed_at_tick is more than NEGOTIATION_TIMEOUT ticks ago
--      auto-dissolves with reason='consensus_failed'. Refunds the
--      founding fee to the founder and applies −1 Reputation to every
--      invited member (the founder included).
--
--   3. Reputation clamp: matches the existing convention used elsewhere
--      (corp_reputation in [0, 10]).
--
-- The advance-tick edge function calls dissolve_failed_alliance_negotiations
-- once per tick after the per-nation loop and before the shard commit.

BEGIN;

-- Constant: keep in sync with NEGOTIATION_DURATION_TICKS in alliances.html.
-- Hardcoded here (not a settings row) because the tick processor is the
-- only consumer; if the design number changes we touch both sides anyway.
-- Currently: 6 ticks.

CREATE OR REPLACE FUNCTION _alliance_member_has_article(
    p_faction_id UUID,
    p_article_id TEXT
) RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT a.id
    FROM strategic_alliances a
    JOIN alliance_members  m  ON m.alliance_id = a.id AND m.left_at_tick IS NULL
    JOIN alliance_articles ar ON ar.alliance_id = a.id AND ar.status = 'active'
    WHERE m.faction_id = p_faction_id
      AND a.status = 'active'
      AND ar.article_id = p_article_id
    LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION _alliance_member_has_article(UUID, TEXT) TO authenticated, service_role;

COMMENT ON FUNCTION _alliance_member_has_article(UUID, TEXT) IS
    'Returns the alliance id if the given faction is in an active alliance with the named article ratified; NULL otherwise. Gate for every per-article runtime effect.';

-- ── Auto-dissolve stale negotiations ─────────────────────────────
CREATE OR REPLACE FUNCTION dissolve_failed_alliance_negotiations(
    p_current_tick INT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_timeout       CONSTANT INT := 6;
    v_rep_penalty   CONSTANT NUMERIC := -1;
    v_alliance      RECORD;
    v_dissolved     INT := 0;
    v_total_refund  BIGINT := 0;
BEGIN
    -- One pass per stale negotiation. Per-row work is small (refund +
    -- N reputation hits + N member rows) so an explicit loop is fine.
    FOR v_alliance IN
        SELECT id, founder_faction_id, founding_fee_paid
        FROM strategic_alliances
        WHERE status = 'negotiating'
          AND p_current_tick - proposed_at_tick >= v_timeout
        FOR UPDATE
    LOOP
        -- Refund founding fee. The founder may have abandoned the corp
        -- since proposing — UPDATE matches 0 rows in that case and the
        -- refund is silently lost (acceptable: same edge case as the
        -- existing withdraw RPC).
        UPDATE factions
        SET corp_cash_reserves = COALESCE(corp_cash_reserves, 0) + v_alliance.founding_fee_paid
        WHERE id = v_alliance.founder_faction_id;

        -- −1 Reputation to every still-active member (founder included).
        -- Floored at 0 so a corp at reputation 0 can't go negative.
        UPDATE factions
        SET corp_reputation = GREATEST(0::numeric,
                                       COALESCE(corp_reputation, 0) + v_rep_penalty)
        WHERE id IN (
            SELECT faction_id FROM alliance_members
            WHERE alliance_id = v_alliance.id AND left_at_tick IS NULL
        );

        -- Mark members departed so the active-membership unique index
        -- frees up if any of them re-joins a future alliance.
        UPDATE alliance_members
        SET left_at_tick = p_current_tick
        WHERE alliance_id = v_alliance.id AND left_at_tick IS NULL;

        -- Clear negotiation votes (won't be needed; alliance is dead).
        DELETE FROM alliance_negotiation_votes
        WHERE alliance_id = v_alliance.id;

        UPDATE strategic_alliances
        SET status = 'dissolved',
            dissolved_at_tick = p_current_tick,
            dissolved_reason = 'consensus_failed'
        WHERE id = v_alliance.id;

        v_dissolved := v_dissolved + 1;
        v_total_refund := v_total_refund + v_alliance.founding_fee_paid;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'dissolved_count', v_dissolved,
        'total_refunded', v_total_refund
    );
END;
$$;

GRANT EXECUTE ON FUNCTION dissolve_failed_alliance_negotiations(INT) TO service_role;

COMMENT ON FUNCTION dissolve_failed_alliance_negotiations(INT) IS
    'Tick-driven sweep. Dissolves every negotiating alliance whose proposed_at_tick is more than 6 ticks ago, refunds the founding fee, and applies −1 Reputation (floored at 0) to every invited member including the founder. Called once per tick from the advance-tick edge function.';

COMMIT;

NOTIFY pgrst, 'reload schema';
