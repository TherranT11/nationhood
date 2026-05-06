-- 20260920_vola_host_bid_rls.sql
--
-- Audit follow-up: explicit SELECT policies on vola_host_bids and
-- vola_cup_hosts so the modal's read paths survive any project-wide
-- RLS-default-deny posture. Writes are intentionally restricted to
-- service_role / SECURITY DEFINER RPCs (bid_to_host_vwc and the
-- tick-processor resolveVolaCupBids), so no INSERT/UPDATE policies
-- here.

BEGIN;

ALTER TABLE public.vola_host_bids  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vola_cup_hosts  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Bids viewable by all authenticated"  ON public.vola_host_bids;
DROP POLICY IF EXISTS "Hosts viewable by all authenticated" ON public.vola_cup_hosts;

CREATE POLICY "Bids viewable by all authenticated"
    ON public.vola_host_bids
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Hosts viewable by all authenticated"
    ON public.vola_cup_hosts
    FOR SELECT
    TO authenticated
    USING (true);

-- No INSERT/UPDATE/DELETE policies for authenticated. service_role
-- (the tick processor + RPC SECURITY DEFINER) bypasses RLS, so the
-- write paths still work without explicit policies.

COMMIT;
