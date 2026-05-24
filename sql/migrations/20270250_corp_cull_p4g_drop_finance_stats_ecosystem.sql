-- ════════════════════════════════════════════════════════════════════
-- Corp-cull Phase 4g — drop the legacy finance-stats ecosystem
-- ════════════════════════════════════════════════════════════════════
-- recompute_finance_stats recomputed a faction's legacy finance stats. Every
-- caller is now gone: close_bank_loan / pay_out_loan / pay_down_debt (4e),
-- declare_corp_bankruptcy (4g), _fire_negotiation (4g loan-negotiation), and
-- the syndicated-lending helpers dropped here. With those gone, the whole
-- finance-stats cluster is dead:
--   • fire_finance_action                — legacy corp finance-action RPC
--                                           (no client/edge/SQL caller)
--   • process_syndicated_lending_rescues  — per-tick alliance rescue sweep;
--                                           its advance-tick call was removed in
--                                           this commit (handler template)
--   • _apply_syndicated_lending_rescue    — rescue helper (only caller ^)
--   • _deduct_peer_lending_capital        — peer-capital helper (only caller ^)
--   • _apply_bad_debt_mutual_aid          — mutual-aid helper (only caller was
--                                           declare_corp_bankruptcy, dropped 4g)
--   • recompute_finance_stats             — callerless once the above go
--
-- Verified zero remaining callers for each (client/edge/SQL/trigger).
--
-- DEPLOY ORDER: deploy advance-tick (regenerated, no process_syndicated_lending_rescues
-- call) BEFORE applying this migration.
--
-- NOT dropped here (deferred): the tangential equity/alliance dead code
-- (_apply_joint_equity_split / _apply_aligned_interest_penalty + their
-- callerless entry points accept_equity_offer / ratify_strategic_alliance — they
-- touch equity_positions / strategic_alliances, a separate cleanup) and the
-- set_finance_active_loans_original_principal trigger (drops with
-- finance_active_loans in Phase 5).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DROP FUNCTION IF EXISTS public.process_syndicated_lending_rescues(int);
DROP FUNCTION IF EXISTS public._apply_syndicated_lending_rescue(uuid, int);
DROP FUNCTION IF EXISTS public._deduct_peer_lending_capital(uuid, uuid, numeric);
DROP FUNCTION IF EXISTS public._apply_bad_debt_mutual_aid(uuid, numeric);
DROP FUNCTION IF EXISTS public.fire_finance_action(uuid, text, text);
DROP FUNCTION IF EXISTS public.recompute_finance_stats(uuid);

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ── Re-apply from git history: 20260606 (recompute_finance_stats),
-- 20260714 (fire_finance_action), 20260816 (_apply_bad_debt_mutual_aid),
-- 20260817 (process_syndicated_lending_rescues / _apply_syndicated_lending_rescue),
-- 20260819 (_deduct_peer_lending_capital), and restore the syndicated-lending
-- rescue call in the advance-tick handler template.
