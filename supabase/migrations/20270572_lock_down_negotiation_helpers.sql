-- ════════════════════════════════════════════════════════════════════
-- 20270572 — Lock down corp_negotiation internal helpers
--
-- Audit follow-up on 20270571. The three helpers added there
-- (_corp_negotiation_caller_faction, _corp_negotiation_validate
-- _caller, _recalc_corp_negotiation_status) inherit PostgreSQL's
-- default PUBLIC EXECUTE grant, which means PostgREST surfaces them
-- as callable RPCs to any authenticated user. None of them leak
-- sensitive data — caller_faction returns the caller's own faction
-- id, validate_caller returns ok/reason, recalc is idempotent — but
-- the codebase convention for internal helpers (see 20270539's
-- lock_down_trial_helpers on _apply_verdict / _begin_trial
-- _arguments / _assign_magistrate_to_trial) is explicit REVOKE.
-- Same hygiene shape applied here.
--
-- These helpers continue to be callable from other SECURITY DEFINER
-- RPCs (their owner is postgres, who has EXECUTE regardless), so
-- no functional change to the negotiation mechanic.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

REVOKE EXECUTE ON FUNCTION public._corp_negotiation_caller_faction()
    FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public._corp_negotiation_validate_caller(uuid, uuid)
    FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public._recalc_corp_negotiation_status(uuid)
    FROM PUBLIC;

NOTIFY pgrst, 'reload schema';

COMMIT;
