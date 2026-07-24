-- ===========================================================================
-- 313 · Kingdoms — buildings constructed in a county (Holdings: build / raze).
--
-- kingdoms_holding_buildings records each building standing in a county. Writes go only through the RPCs:
--   kingdoms_build(county, building)  — validates the county belongs to the caller's house, the terrain
--                                       requirement, that free land (available_land − occupied plots) and the
--                                       house's gold suffice, then spends the gold and raises the building.
--   kingdoms_raze(building)           — removes one of the caller's buildings (frees its land; no refund).
-- Reads are public (holdings are shared game data). Depends on: 304, 305, 309, 312. Idempotent. Apply after 312.
-- ===========================================================================

create table if not exists public.kingdoms_holding_buildings (
  id           uuid primary key default gen_random_uuid(),
  county_id    uuid not null references public.kingdoms_counties(id) on delete cascade,
  building_num int  not null references public.kingdoms_building_specs(num),
  created_at   timestamptz not null default now()
);
create index if not exists kingdoms_holding_buildings_county_idx on public.kingdoms_holding_buildings(county_id);

alter table public.kingdoms_holding_buildings enable row level security;
grant select on public.kingdoms_holding_buildings to anon, authenticated;   -- writes go through the RPCs only
drop policy if exists "kingdoms_holding_buildings_select_all" on public.kingdoms_holding_buildings;
create policy "kingdoms_holding_buildings_select_all" on public.kingdoms_holding_buildings for select using (true);

-- Build one building in a county the caller holds. Enforces terrain, free land, and gold server-side.
create or replace function public.kingdoms_build(p_county uuid, p_building int)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_house uuid; v_gold int; v_avail int; v_hills boolean;
  v_cost int; v_land int; v_needs text; v_used int; v_id uuid;
begin
  if auth.uid() is null then raise exception 'unauthenticated'; end if;

  -- The county must be held by a house the caller owns.
  select l.id, coalesce((l.resources->>'gold')::int, 0), c.available_land, coalesce(c.hills, false)
    into v_house, v_gold, v_avail, v_hills
  from public.kingdoms_counties c
  join public.kingdoms_leaders l on l.id = c.held_by
  where c.id = p_county and l.user_id = auth.uid()
  for update of l;
  if v_house is null then raise exception 'not_your_holding'; end if;

  select cost, land, needs into v_cost, v_land, v_needs
  from public.kingdoms_building_specs where num = p_building;
  if v_cost is null then raise exception 'unknown_building'; end if;

  if v_needs = 'hills' and not v_hills then raise exception 'terrain_required'; end if;

  select coalesce(sum(bs.land), 0) into v_used
  from public.kingdoms_holding_buildings b
  join public.kingdoms_building_specs bs on bs.num = b.building_num
  where b.county_id = p_county;

  if v_cost > v_gold then raise exception 'not_enough_gold'; end if;
  if v_land > (coalesce(v_avail, 0) - v_used) then raise exception 'no_room'; end if;

  update public.kingdoms_leaders
     set resources = jsonb_set(resources, '{gold}', to_jsonb(v_gold - v_cost))
   where id = v_house;

  insert into public.kingdoms_holding_buildings (county_id, building_num)
    values (p_county, p_building)
  returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.kingdoms_build(uuid, int) from public, anon;
grant execute on function public.kingdoms_build(uuid, int) to authenticated;

-- Raze one of the caller's buildings (frees its land; no gold refund).
create or replace function public.kingdoms_raze(p_building uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'unauthenticated'; end if;
  delete from public.kingdoms_holding_buildings b
   using public.kingdoms_counties c, public.kingdoms_leaders l
   where b.id = p_building and b.county_id = c.id and c.held_by = l.id and l.user_id = auth.uid();
end;
$$;
revoke all on function public.kingdoms_raze(uuid) from public, anon;
grant execute on function public.kingdoms_raze(uuid) to authenticated;

notify pgrst, 'reload schema';
