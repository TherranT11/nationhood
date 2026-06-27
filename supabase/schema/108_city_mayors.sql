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

-- A random "First Surname" from a nation's name pool — the same male/female + surname
-- draw the game uses for generated politicians (schema/40, /47). Null-safe: returns
-- whatever parts exist, or null if the nation has no seeded names.
create or replace function public._random_person_name(p_nation text)
returns text language sql stable security definer set search_path = public as $$
  select nullif(btrim(
    coalesce((select name from public.nation_names where nation_id = p_nation and kind in ('male','female') order by random() limit 1), '')
    || ' ' ||
    coalesce((select name from public.nation_names where nation_id = p_nation and kind = 'surname'         order by random() limit 1), '')
  ), '');
$$;
revoke all on function public._random_person_name(text) from public, anon, authenticated;

-- Create a city with an auto-generated NPC mayor and a first election rolled 1D6 ticks out.
-- Admin only (mirrors the cities RLS) — runs SECURITY DEFINER, so it checks is_admin() itself.
-- Editing a city stays a plain update (the mayor + election persist; they aren't re-rolled).
create or replace function public.city_create(p_nation text, p_name text, p_pct numeric, p_description text)
returns public.cities language plpgsql security definer set search_path = public as $$
declare v_tick int; v_row public.cities;
begin
  if not public.is_admin() then raise exception 'Admins only.'; end if;
  if coalesce(btrim(p_name), '') = '' then raise exception 'A city needs a name.'; end if;
  select current_tick into v_tick from public.game_state where id;
  insert into public.cities (nation_id, name, pop_pct, description, mayor_name, mayor_election_tick)
    values (p_nation, btrim(p_name), p_pct, nullif(btrim(coalesce(p_description, '')), ''),
            public._random_person_name(p_nation),
            coalesce(v_tick, 0) + 1 + floor(random() * 6)::int)   -- +1..6 ticks (1D6)
    returning * into v_row;
  return v_row;
end $$;
grant execute on function public.city_create(text, text, numeric, text) to authenticated;

-- Backfill any cities created before mayors existed, so the roster is never half-populated.
-- Idempotent: only fills the nulls.
update public.cities set mayor_name = public._random_person_name(nation_id) where mayor_name is null;
update public.cities
   set mayor_election_tick = coalesce((select current_tick from public.game_state where id), 0) + 1 + floor(random() * 6)::int
 where mayor_election_tick is null;

notify pgrst, 'reload schema';
