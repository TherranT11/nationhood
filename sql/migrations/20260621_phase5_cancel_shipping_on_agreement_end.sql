-- ══════════════════════════════════════════════════════════════
-- Phase 5: Cancel spawned shipping_contracts when the parent
-- trade_agreement leaves 'active'.
--
-- Design:
--   Trigger on UPDATE OF status. If a row transitions from 'active'
--   to any terminal/suspended state (withdrawn / terminated / expired
--   / breached / suspended / failed), find all spawned
--   shipping_contracts and:
--     - Revert route_risk_delta on the winning corp for awarded
--       contracts (mirrors the Phase 4 maturity sweep).
--     - Flip status to 'cancelled' on open + awarded rows.
--     - Resolve any pending bids to 'auto_rejected' so they don't
--       linger as zombie offers.
--
--   This is the canonical cleanup path. The Phase 4 tick processor
--   will not pick up cancelled contracts since both Pass A and Pass C
--   filter by status. ON DELETE CASCADE on shipping_contracts
--   handles the harder case where a trade_agreements row is deleted
--   outright (rare — admin only).
-- ══════════════════════════════════════════════════════════════


CREATE OR REPLACE FUNCTION cancel_shipping_contracts_for_agreement(
    p_agreement_id UUID,
    p_tick         INT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $func$
DECLARE
    v_contract   RECORD;
    v_delta      NUMERIC;
BEGIN
    FOR v_contract IN
        SELECT id, status, winner_faction_id
          FROM shipping_contracts
         WHERE trade_agreement_id = p_agreement_id
           AND status IN ('open', 'awarded')
    LOOP
        -- Awarded contracts: revert the winning bid's route_risk_delta
        -- on the corp (clamped 0..10) before marking cancelled. Skip
        -- silently when the winner faction is gone or the bid row
        -- can't be found — the contract still cancels.
        IF v_contract.status = 'awarded' AND v_contract.winner_faction_id IS NOT NULL THEN
            SELECT route_risk_delta INTO v_delta
              FROM shipping_contract_bids
             WHERE contract_id = v_contract.id AND status = 'accepted'
             LIMIT 1;
            v_delta := COALESCE(v_delta, 0);
            IF v_delta <> 0 THEN
                UPDATE factions
                   SET corp_route_risk = LEAST(GREATEST(
                       COALESCE(corp_route_risk, 0) - v_delta,
                       0::numeric), 10::numeric)
                 WHERE id = v_contract.winner_faction_id;
            END IF;
        END IF;

        UPDATE shipping_contracts
           SET status     = 'cancelled',
               updated_at = now()
         WHERE id = v_contract.id;

        -- Resolve dangling bids — pending offers become 'auto_rejected'
        -- so the corp's UI removes them. Already-resolved bids
        -- (accepted / auto_rejected) stay as-is.
        UPDATE shipping_contract_bids
           SET status            = 'auto_rejected',
               resolved_at_tick  = COALESCE(resolved_at_tick, p_tick),
               updated_at        = now()
         WHERE contract_id = v_contract.id
           AND status      = 'pending';
    END LOOP;
END;
$func$;

COMMENT ON FUNCTION cancel_shipping_contracts_for_agreement(UUID, INT) IS
    'Phase 5 cleanup helper. Cancels every open / awarded shipping_contracts row spawned by the given trade_agreement; reverts the winning bid''s route_risk_delta on the corp for awarded contracts; resolves any pending bids to auto_rejected. Idempotent — re-running on an already-cancelled agreement is a no-op.';


CREATE OR REPLACE FUNCTION on_trade_agreement_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $func$
DECLARE
    v_tick INT;
BEGIN
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;
    -- Fire only when leaving 'active'. The terminal-status set is
    -- broad to cover every signal the codebase uses (withdrawn from
    -- diplomacy.html, terminated/expired/failed from advance-tick aid
    -- processors, breached/suspended from future enforcement work).
    IF OLD.status = 'active'
       AND NEW.status IN ('withdrawn', 'terminated', 'expired',
                          'breached', 'suspended', 'failed') THEN
        SELECT current_tick INTO v_tick
          FROM shard
         WHERE name = 'Alpha Shard'
         LIMIT 1;
        PERFORM cancel_shipping_contracts_for_agreement(NEW.id, COALESCE(v_tick, 0));
    END IF;
    RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS trg_cancel_shipping_on_agreement_end ON trade_agreements;
CREATE TRIGGER trg_cancel_shipping_on_agreement_end
    AFTER UPDATE OF status ON trade_agreements
    FOR EACH ROW
    EXECUTE FUNCTION on_trade_agreement_status_change();

NOTIFY pgrst, 'reload schema';
