-- ════════════════════════════════════════════════════════════════════
-- 20270539 — Lock down internal trial helpers from public RPC surface
--
-- Pre-commit audit on 20270538 surfaced that SECURITY DEFINER
-- functions in the public schema default to GRANT EXECUTE TO PUBLIC.
-- For internal-only helpers, that's an exploitable hole: any
-- authenticated user can call them via the Supabase RPC API even
-- though they were never meant to be exposed.
--
-- Specifically:
--   • _close_trial_at_round_four(p_trial_id) — 20270538 helper.
--     Forces either an immediate _apply_verdict or sets
--     awaiting_verdict=true on any in-progress trial.
--   • _apply_verdict(p_trial_id, p_tick) — pre-existing since
--     20270517, never explicitly locked down. Force-resolves any
--     in-progress trial with strength tally + rep/standing changes
--     against actual advocates without their action.
--
-- Both functions are called ONLY by other SECURITY DEFINER RPCs
-- (send_trial_message, end_turn, call_witness_qa,
-- judge_rule_objection, judge_enter_verdict, send_objection). Those
-- internal calls run as the function owner (postgres role), not the
-- authenticated user, so REVOKE on PUBLIC doesn't break the
-- internal call graph — only blocks direct RPC reach.
--
-- This migration REVOKEs EXECUTE on both from PUBLIC. No GRANT to
-- authenticated because nothing legitimate calls them directly.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

REVOKE EXECUTE ON FUNCTION public._close_trial_at_round_four(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public._apply_verdict(uuid, int)        FROM PUBLIC;

-- Also lock down sibling helpers added in earlier migrations that
-- have the same defaulted-public exposure shape. Spot-audit confirmed
-- these are only called from other SECURITY DEFINER RPCs.
REVOKE EXECUTE ON FUNCTION public._begin_trial_arguments(uuid)         FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public._assign_magistrate_to_trial(uuid, uuid) FROM PUBLIC;

NOTIFY pgrst, 'reload schema';

COMMIT;
