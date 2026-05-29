-- ════════════════════════════════════════════════════════════════════
-- ONE-OFF: cancel every active trade agreement (admin reset).
-- ════════════════════════════════════════════════════════════════════
-- Purpose: clear the existing trade-agreement state so the new Minister
-- of Trade / entrepreneur shipping system (20270238 + 20270388 + 20270389
-- + 20270390) takes over without legacy in-flight agreements + their
-- spawned shipping contracts polluting the new flow.
--
-- WHY NOT cancel_trade_agreement RPC FOR EACH ROW
-- ───────────────────────────────────────────────
-- That RPC inserts one event_log row per signatory nation per agreement
-- (Politics | Nation + World dispatch — see 20270118). With N active
-- agreements that's 2N "X has canceled Y" entries flooding everyone's
-- Politics feed at once. For an admin reset, we want a silent wipe: the
-- agreements end, the shipping contracts cascade-cancel, but no in-game
-- narrative pretends a nation specifically withdrew.
--
-- WHAT THIS DOES
-- ──────────────
-- One UPDATE on trade_agreements WHERE status = 'active':
--
--   • status              → 'withdrawn'
--   • withdrawn_at_tick   → shard.current_tick
--   • withdrawn_by_nation → NULL   (sentinel for "admin reset, no
--                                   specific nation initiated this")
--
-- The status change fires trg_cancel_shipping_on_agreement_end
-- (20260621), which for every spawned shipping_contracts row under each
-- agreement:
--
--   • Reverts route_risk_delta on the winning corp (awarded contracts).
--   • Sets shipping_contracts.status = 'cancelled' (open + awarded).
--   • Auto-rejects pending bids (status = 'auto_rejected').
--
-- All atomic in a single transaction. Idempotent — re-running finds no
-- active agreements and updates zero rows.
--
-- WHAT THIS DOES NOT TOUCH
-- ────────────────────────
-- • In-progress trade NEGOTIATIONS (separate concept from signed
--   agreements). If you also want those cleared, that's its own script.
-- • Historical/withdrawn agreements (already-terminal rows stay as-is).
-- • Per-nation trade stats, tariffs, or other state derived from past
--   agreements — those are part of the audit history.
--
-- USAGE
-- ─────
-- Run as a privileged role (the trigger is SECURITY DEFINER, but the
-- UPDATE itself requires write access on trade_agreements). Recommend
-- a quick preview before running:
--
--     SELECT COUNT(*) FROM trade_agreements WHERE status = 'active';
--
-- to know how many agreements will be affected.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DO $$
DECLARE
    v_tick    INT;
    v_count   INT;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE trade_agreements
       SET status              = 'withdrawn',
           withdrawn_at_tick   = v_tick,
           withdrawn_by_nation = NULL,
           updated_at          = now()
     WHERE status = 'active';

    GET DIAGNOSTICS v_count = ROW_COUNT;

    RAISE NOTICE
        '[cancel_all_trade_agreements] withdrew % active agreement(s) at tick %. trg_cancel_shipping_on_agreement_end has cascaded the shipping cleanup for each.',
        v_count, v_tick;
END $$;

COMMIT;
