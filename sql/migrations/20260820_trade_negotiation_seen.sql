-- 20260820_trade_negotiation_seen.sql
--
-- Per-side "last seen" timestamps on trade_negotiations so the
-- AGREEMENTS panel can render a red unread dot next to each row
-- where the OTHER nation has posted a non-system message since the
-- caller's nation last opened the modal.
--
-- Mirrors the loan-negotiations pattern (20260723) — same shape:
-- two TIMESTAMPTZ columns + an RPC that figures out which side the
-- caller is on and stamps NOW() on the right column. Trade negs are
-- nation-level (multiple ministers can chat as "the nation"), so
-- "seen" is per-nation, not per-faction. Marking seen on the PM's
-- device also clears the dot for the FM. Acceptable simplification.

BEGIN;

-- ── 1. Schema columns ───────────────────────────────────────────
ALTER TABLE public.trade_negotiations
    ADD COLUMN IF NOT EXISTS last_seen_at_a TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_seen_at_b TIMESTAMPTZ;

COMMENT ON COLUMN public.trade_negotiations.last_seen_at_a IS
    'Wall-clock timestamp of the last time any official from nation_a opened the trade negotiation modal. Compared to negotiation_messages.created_at (sender_nation_id = nation_b) to render the unread dot in the AGREEMENTS panel.';
COMMENT ON COLUMN public.trade_negotiations.last_seen_at_b IS
    'Same as last_seen_at_a, nation_b side.';


-- ── 2. mark_trade_negotiation_seen RPC ──────────────────────────
-- Called by openTradeNegModal on the client. Determines the
-- caller's nation by checking faction membership against the
-- negotiation's two sides directly (rather than a LIMIT 1 lookup,
-- which is wrong for players holding factions in multiple nations
-- — the LIMIT could pick an unrelated nation and the RPC would
-- return "Not a party" even though the player has another faction
-- in one of the negotiation's nations).
CREATE OR REPLACE FUNCTION mark_trade_negotiation_seen(p_neg_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user         UUID := auth.uid();
    v_neg          trade_negotiations%ROWTYPE;
    v_caller_in_a  BOOLEAN;
    v_caller_in_b  BOOLEAN;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT * INTO v_neg FROM trade_negotiations WHERE id = p_neg_id;
    IF v_neg.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Negotiation not found');
    END IF;

    -- Direct membership check against each side. Handles multi-nation
    -- players cleanly: EXISTS picks any matching faction without
    -- LIMIT-arbitrarily collapsing to one. If the player happens to
    -- hold factions on BOTH sides (rare double-agent case), nation_a
    -- wins by convention.
    SELECT EXISTS (
        SELECT 1 FROM factions
        WHERE (id = v_user OR linked_user_id = v_user)
          AND nation_id = v_neg.nation_a_id
    ) INTO v_caller_in_a;

    SELECT EXISTS (
        SELECT 1 FROM factions
        WHERE (id = v_user OR linked_user_id = v_user)
          AND nation_id = v_neg.nation_b_id
    ) INTO v_caller_in_b;

    IF v_caller_in_a THEN
        UPDATE trade_negotiations SET last_seen_at_a = NOW() WHERE id = p_neg_id;
    ELSIF v_caller_in_b THEN
        UPDATE trade_negotiations SET last_seen_at_b = NOW() WHERE id = p_neg_id;
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Not a party to this negotiation');
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION mark_trade_negotiation_seen(UUID) TO authenticated;

COMMENT ON FUNCTION mark_trade_negotiation_seen(UUID) IS
    'Stamps NOW() on trade_negotiations.last_seen_at_a/b for the caller''s nation side. Called from openTradeNegModal when the player opens a trade negotiation, so the unread dot in the AGREEMENTS panel clears once they''ve seen the chat.';

COMMIT;

NOTIFY pgrst, 'reload schema';
