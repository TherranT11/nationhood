-- Petition for Reform — strip the authenticated grant on
-- process_expired_petitions(INT).
--
-- Audit finding: the previous migration granted EXECUTE on
-- process_expired_petitions to both authenticated and service_role.
-- The function uses its p_tick parameter directly to gate which
-- petitions are auto-accepted:
--
--     WHERE status = 'pending' AND auto_accept_at_tick <= p_tick
--
-- That means any authenticated client could call
--   process_expired_petitions(99999999)
-- and force-resolve every pending petition in the database to
-- 'auto_accepted', bypassing the 3-tick deadline and short-circuiting
-- whichever monarch's response was on the way.
--
-- The intended caller is the advance-tick Edge Function (service_role).
-- Revoke the authenticated grant; service_role keeps execute. Clients
-- have no business invoking this RPC directly.

REVOKE EXECUTE ON FUNCTION public.process_expired_petitions(INT) FROM authenticated;

NOTIFY pgrst, 'reload schema';
