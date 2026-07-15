-- ===========================================================================
-- 216 · Reforms can only be taken every 24 ticks/months.
--
-- The digestion lock (constitutional fatigue) already gates how soon the chamber can take up the
-- next reform after one passes — _reform_digestion_ticks() (schema/167) was the ONE source at 3
-- ticks. Raise it to 24 so a nation enacts at most one constitutional reform every two years.
-- The lock itself (economy.reform_lock_tick = pass_tick + this) and its enforcement in
-- _reform_precheck are unchanged — only the interval. Idempotent. Apply after 167.
-- ===========================================================================

create or replace function public._reform_digestion_ticks()
returns int language sql immutable as $$ select 24; $$;

notify pgrst, 'reload schema';
