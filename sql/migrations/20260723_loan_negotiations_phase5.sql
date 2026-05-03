-- 20260723_loan_negotiations_phase5.sql
--
-- Loan Negotiations — Phase 5 (entry points + notifications + stale cleanup).
--
-- Adds the data + RPCs the inbox / unread badges / sweep need:
--   1. loan_negotiations.last_seen_at_borrower / last_seen_at_lender
--      — bumped by mark_negotiation_seen() when each party opens the
--      modal or receives a realtime update. Inbox rows where
--      last_activity_at > last_seen_at_<role> render as "unread".
--   2. mark_negotiation_seen(neg_id) — bumps the caller's seen-at.
--   3. auto_abandon_stale_negotiations(p_tick) — service-role sweep
--      called from advance-corp-tick once per tick. Abandons every
--      open negotiation idle > 24 hours, refunds escrow, system-
--      messages the row. Real wall-clock interval (not ticks) since
--      negotiation activity is human-pace.

BEGIN;

-- ── 1. last-seen columns ──────────────────────────────────────────
ALTER TABLE public.loan_negotiations
    ADD COLUMN IF NOT EXISTS last_seen_at_borrower TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_seen_at_lender   TIMESTAMPTZ;

COMMENT ON COLUMN public.loan_negotiations.last_seen_at_borrower IS
    'Wall-clock timestamp of the last time the borrower opened the negotiation modal or received a realtime update. Inbox rows where last_activity_at > last_seen_at_borrower render as unread.';
COMMENT ON COLUMN public.loan_negotiations.last_seen_at_lender IS
    'Same as last_seen_at_borrower, lender side.';


-- ── 2. mark_negotiation_seen ─────────────────────────────────────
-- Caller's role determines which seen-at column to bump. Cheap; safe
-- to call frequently (modal open, every realtime push).
CREATE OR REPLACE FUNCTION mark_negotiation_seen(p_neg_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user UUID := auth.uid();
    v_role TEXT;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    v_role := _negotiation_caller_role(p_neg_id, v_user);
    IF v_role IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not a party to this negotiation');
    END IF;

    IF v_role = 'borrower' THEN
        UPDATE loan_negotiations SET last_seen_at_borrower = NOW() WHERE id = p_neg_id;
    ELSE
        UPDATE loan_negotiations SET last_seen_at_lender   = NOW() WHERE id = p_neg_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'role', v_role);
END;
$$;

GRANT EXECUTE ON FUNCTION mark_negotiation_seen(UUID) TO authenticated;


-- ── 3. auto_abandon_stale_negotiations ───────────────────────────
-- Sweep open negotiations idle > 24 hours. Refund any held escrow,
-- mark abandoned, log a system message. Returns a count for the
-- tick processor's logging.
CREATE OR REPLACE FUNCTION auto_abandon_stale_negotiations(p_tick INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_neg       RECORD;
    v_swept     INTEGER := 0;
    v_threshold INTERVAL := INTERVAL '24 hours';
BEGIN
    FOR v_neg IN
        SELECT id, lender_faction_id, escrowed_lender_cash
          FROM loan_negotiations
         WHERE status = 'open'
           AND last_activity_at < NOW() - v_threshold
         FOR UPDATE
    LOOP
        -- Refund escrow if the lender held cash. Counterparty-deleted
        -- cases were already handled by the faction-delete trigger.
        IF v_neg.escrowed_lender_cash > 0
           AND EXISTS (SELECT 1 FROM factions WHERE id = v_neg.lender_faction_id) THEN
            PERFORM emit_corp_cash_event(
                v_neg.lender_faction_id,
                'capital_in',
                'Escrow refund · negotiation auto-abandoned (inactivity)',
                v_neg.escrowed_lender_cash,
                p_tick
            );
        END IF;

        UPDATE loan_negotiations
           SET status               = 'abandoned',
               escrowed_lender_cash = 0,
               last_activity_at     = NOW()
         WHERE id = v_neg.id;

        INSERT INTO loan_negotiation_messages
            (negotiation_id, author_faction_id, body, system_msg, posted_at_tick)
        VALUES
            (v_neg.id, NULL,
             'Negotiation auto-abandoned after 24 hours of inactivity. Any escrow refunded.',
             true, p_tick);

        v_swept := v_swept + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'swept', v_swept);
END;
$$;

REVOKE EXECUTE ON FUNCTION auto_abandon_stale_negotiations(INTEGER) FROM PUBLIC;
-- Service-role only; called from advance-corp-tick.

COMMIT;

NOTIFY pgrst, 'reload schema';
