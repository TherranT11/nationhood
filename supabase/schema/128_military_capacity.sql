-- ===========================================================================
-- 128 · Military capacity — RETIRED. The old aggregate rule ("military over bases × 5 stands
-- down each January") no longer fits: military is now a spendable pool (on_hand.military) that
-- funds typed units, and a base's 5-unit limit is enforced at build/deploy time (schema/129).
-- Drop the dead resolver; its tick hook was removed from _advance_tick (schema/60).
-- ===========================================================================

drop function if exists public._resolve_military_capacity(int);

notify pgrst, 'reload schema';
