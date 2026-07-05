-- ===========================================================================
-- 145 · Teardown 2b — drop the Direct field actions.
-- Direct (run for Parliament, raise a Paramilitary wing, appoint a Deputy
-- Leader, announce a Mayoral run, raise a Youth Wing) was removed from the
-- client. These five are the only authenticated RPCs in their subsystems and
-- have no internal callers, so dropping them just closes the entry points.
--
-- The subsystems they seeded (parliamentary_run 111, mayoral_candidacy 110,
-- youth_wing 112, paramilitary/deputy 109) keep their tables and per-tick
-- resolvers, which now run over empty input — dormant, not removed, exactly as
-- the coalition tables are. An existing Deputy Leader keeps its +1-action bonus;
-- no new ones can be appointed.
--
-- Depends on: 109/110/112. Apply in the Supabase SQL Editor.
-- ===========================================================================
drop function if exists public.direct_parliament(uuid, int);
drop function if exists public.direct_paramilitary(uuid);
drop function if exists public.direct_appoint_deputy(uuid, boolean);
drop function if exists public.direct_mayor_announce(uuid, uuid, int);
drop function if exists public.direct_youth_wing(uuid);

notify pgrst, 'reload schema';
