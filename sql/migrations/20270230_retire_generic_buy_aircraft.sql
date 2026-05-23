-- ════════════════════════════════════════════════════════════════════
-- RETIRE entrepreneur_buy_aircraft — RFP replaces generic instant-buy
-- ════════════════════════════════════════════════════════════════════
-- With the aircraft-RFP flow (20270229) airlines acquire aircraft only by
-- commissioning a manufacturer design (request_aircraft_build → bid →
-- delivery). The generic instant-buy of fixed regional/narrowbody/widebody
-- units is retired: revoke client EXECUTE so it can no longer be called.
-- (Kept defined rather than dropped — the 2-plane founding seed and any
-- legacy callers reference its shape; revoking is the minimal, reversible
-- retirement. The UI button is removed in the same commit.)
-- ════════════════════════════════════════════════════════════════════

BEGIN;

REVOKE EXECUTE ON FUNCTION public.entrepreneur_buy_aircraft(uuid, text, int) FROM authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
