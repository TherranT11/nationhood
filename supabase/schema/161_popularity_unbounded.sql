-- ===========================================================================
-- 161 · Popularity unbounded (one-time). Retire the per-party popularity reach CEILING and FLOOR.
-- Depends on: 20 (parties.pop_ceiling/pop_floor), 159 (schema_flags). Run after 159.
--
-- Party popularity now floats freely in 0..100: every gain/loss applies in full, bounded only by that
-- natural range. The reach-ceiling / floor / archetype-crowding / regime-cap system was removed at the
-- helper level (_effective_ceiling → 100, _mod_cap_raise/_mod_floor_drop clamp only to 0..100,
-- _party_ceiling_cap → 100, _pop_floor_add → a plain popularity nudge). Existing rows can still carry a
-- non-zero stored floor or a sub-100 ceiling from the old system, and a few callers still read
-- parties.pop_floor directly (e.g. greatest(popularity − N, pop_floor)); zero the floor and lift the
-- ceiling to 100 once so those reads are inert and no party is silently held off 0..100.
-- ===========================================================================

do $$
begin
  if exists (select 1 from public.schema_flags where key = 'popularity_unbounded_v1') then return; end if;
  update public.parties set pop_floor = 0, pop_ceiling = 100
   where pop_floor is distinct from 0 or pop_ceiling is distinct from 100;
  insert into public.schema_flags (key) values ('popularity_unbounded_v1');
end $$;

notify pgrst, 'reload schema';
