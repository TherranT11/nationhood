-- ===========================================================================
-- 124 · A nation's continent, derived from the hex map. The world map's Continents
-- layer (world_hexes.continent, schema/101) is the SINGLE source for geography: a
-- nation's continent is simply the continent its land is painted on. This drops the
-- earlier standalone nations.continent column (so there's only one place to set it)
-- and exposes the derivation the Conflict page reads.
-- Depends on: 101 (world_hexes), 10 (nations). Run after 123.
-- ===========================================================================

-- One source for continents now lives on the map — remove the column 123 used to carry.
alter table public.nations drop column if exists continent;

-- Each nation's continent = the continent most of its hexes sit on (ties broken by name, so
-- it's deterministic). Nations with no continent-painted land simply don't appear here. World
-- map data is public, so this read is open to any signed-in player.
create or replace function public.nation_continents()
returns table (nation_id text, continent text)
language sql stable security definer set search_path = public as $$
  select nation_id, continent from (
    select nation_id, continent,
           row_number() over (partition by nation_id order by count(*) desc, continent) as rn
      from public.world_hexes
     where nation_id is not null and continent is not null
     group by nation_id, continent
  ) t where rn = 1;
$$;
revoke all on function public.nation_continents() from public, anon;
grant execute on function public.nation_continents() to authenticated;

notify pgrst, 'reload schema';
