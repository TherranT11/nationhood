-- ════════════════════════════════════════════════════════════════
-- Trade negotiation: lock articles + name once both parties approve.
--
-- Reported bug: after both parties hit "Agreement" on a trade
-- negotiation, the agreement is supposed to be locked — bills are
-- created in both parliaments, ratification is in motion, no further
-- edits should be possible. But the JS handlers for adding /
-- deleting / striking articles weren't gated on the locked state, so
-- a player could keep modifying draft_articles after the bills had
-- already been filed. The bills snapshot the negotiation_id (not the
-- articles), so when resolveTradeRatificationBill (bills.js) runs it
-- reads the LATEST draft_articles — players were effectively voting
-- on one set of articles and getting a different set ratified.
--
-- This trigger is the server-side enforcement: once a negotiation is
-- locked (both parties approved, OR status='ratification'), reject
-- any UPDATE that mutates draft_articles or agreement_name. Players
-- can still un-approve to unlock IF they're not yet at ratification
-- (un-approval clears approved_by_X = NULL, exiting the lock).
--
-- Approval / status / bill_id columns can still be mutated — those
-- carry the agreement THROUGH ratification, not back into edit mode.
-- ════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION trade_negotiations_lock_articles()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
    -- Locked when:
    --   • status has moved to 'ratification' (parliament has the bills), OR
    --   • both parties have approved (window between second-approval
    --     and the status flip — atomic in current code, but defense
    --     in depth against any future code path that races them).
    IF (OLD.status = 'ratification'
        OR (OLD.approved_by_a IS NOT NULL AND OLD.approved_by_b IS NOT NULL))
    THEN
        IF NEW.draft_articles IS DISTINCT FROM OLD.draft_articles THEN
            RAISE EXCEPTION 'trade_negotiation_locked: articles cannot be modified after both parties have approved'
                USING ERRCODE = 'check_violation';
        END IF;
        IF NEW.agreement_name IS DISTINCT FROM OLD.agreement_name THEN
            RAISE EXCEPTION 'trade_negotiation_locked: agreement name cannot be changed after both parties have approved'
                USING ERRCODE = 'check_violation';
        END IF;
        IF NEW.agreement_type IS DISTINCT FROM OLD.agreement_type THEN
            RAISE EXCEPTION 'trade_negotiation_locked: agreement type cannot be changed after both parties have approved'
                USING ERRCODE = 'check_violation';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_trade_negotiations_lock_articles ON trade_negotiations;
CREATE TRIGGER trg_trade_negotiations_lock_articles
    BEFORE UPDATE ON trade_negotiations
    FOR EACH ROW
    EXECUTE FUNCTION trade_negotiations_lock_articles();

COMMENT ON FUNCTION trade_negotiations_lock_articles() IS
    'Server-side enforcement of the negotiation-lock invariant: once both parties approve (approved_by_a + approved_by_b both set) OR the row reaches status=ratification, draft_articles / agreement_name / agreement_type are immutable. Approval / status / bill_id columns remain mutable so the row can carry through ratification.';

NOTIFY pgrst, 'reload schema';

COMMIT;
