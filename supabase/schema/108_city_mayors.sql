-- ===========================================================================
-- 108 · City mayors (display-only).
-- Depends on: 107 (cities), 50 (nation_names), game_state.current_tick.
--
-- Each city has an NPC mayor (a name drawn from the nation's own name pool) and a
-- next-election tick. This is FLAVOUR + a countdown only — nothing in the tick
-- resolves a mayoral election yet. Terms are meant to run 12 ticks; the first
-- election is rolled 1D6 ticks out so cities stagger. When the election is later
-- automated, the resolver will re-decide the mayor and set the next tick +12.
-- ===========================================================================

alter table public.cities add column if not exists mayor_name text;
alter table public.cities add column if not exists mayor_election_tick int;

-- The NPC name draw is the shared _random_name (schema/50) now — drop the city-specific copy.
drop function if exists public._random_person_name(text);

-- Create a city with an auto-generated NPC mayor and a first election rolled 1D6 ticks out.
-- Admin only (mirrors the cities RLS) — runs SECURITY DEFINER, so it checks is_admin() itself.
-- Editing a city stays a plain update (the mayor + election persist; they aren't re-rolled).
create or replace function public.city_create(p_nation text, p_name text, p_pct numeric, p_description text)
returns public.cities language plpgsql security definer set search_path = public as $$
declare v_tick int; v_row public.cities; v_first text; v_last text;
begin
  if not public.is_admin() then raise exception 'Admins only.'; end if;
  if coalesce(btrim(p_name), '') = '' then raise exception 'A city needs a name.'; end if;
  select current_tick into v_tick from public.game_state where id;
  select first_name, last_name into v_first, v_last from public._random_name(p_nation);   -- shared draw (schema/50)
  insert into public.cities (nation_id, name, pop_pct, description, mayor_name, mayor_election_tick)
    values (p_nation, btrim(p_name), p_pct, nullif(btrim(coalesce(p_description, '')), ''),
            nullif(btrim(concat_ws(' ', v_first, v_last)), ''),
            coalesce(v_tick, 0) + 1 + floor(random() * 6)::int)   -- +1..6 ticks (1D6)
    returning * into v_row;
  return v_row;
end $$;
grant execute on function public.city_create(text, text, numeric, text) to authenticated;

-- Backfill any cities created before mayors existed, so the roster is never half-populated.
-- Idempotent: only fills the nulls. The correlated subquery re-draws per row (VOLATILE _random_name).
update public.cities c
   set mayor_name = (select nullif(btrim(concat_ws(' ', first_name, last_name)), '') from public._random_name(c.nation_id))
 where c.mayor_name is null;
update public.cities
   set mayor_election_tick = coalesce((select current_tick from public.game_state where id), 0) + 1 + floor(random() * 6)::int
 where mayor_election_tick is null;

notify pgrst, 'reload schema';
