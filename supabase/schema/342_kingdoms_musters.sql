-- ===========================================================================
-- 342 · Kingdoms — levy service terms: musters serve their raising season + 2 more, then disband.
--
-- Raising levies (schema/328) is no longer permanent. Each muster is recorded in kingdoms_musters with the
-- tick it was raised on (the world clock, schema/341). A levy serves the season it was raised in and the two
-- seasons following — three seasons in all — and at the end of the third it disbands: the men GO HOME, so the
-- Population they were drawn from is restored (the Unrest their raising stirred remains). In clock terms a
-- muster raised at tick R is in service while current_tick <= R+2 and is released when current_tick reaches R+3.
--
-- The release is a per-tick step of _kingdoms_tick (every 8 hours, any season — service can end mid-year), so
-- this migration redefines _kingdoms_tick (from 341) to add it. The Conflict page reads kingdoms_musters to
-- draw the Season's Muster calendar. resources.levies stays the live count of men in service (raise adds,
-- release subtracts, floored at 0). Depends on: 328 (muster), 341 (clock + tick). Idempotent. Apply after 341.
-- ===========================================================================

create table if not exists public.kingdoms_musters (
  id          uuid primary key default gen_random_uuid(),
  house_id    uuid not null references public.kingdoms_leaders(id) on delete cascade,
  county_id   uuid references public.kingdoms_counties(id) on delete set null,
  count       int  not null,
  raised_tick int  not null,
  created_at  timestamptz not null default now()
);
create index if not exists kingdoms_musters_house_idx on public.kingdoms_musters (house_id);
alter table public.kingdoms_musters enable row level security;
grant select on public.kingdoms_musters to anon, authenticated;   -- musters are public game state; writes go through RPCs
drop policy if exists "kingdoms_musters_select_all" on public.kingdoms_musters;
create policy "kingdoms_musters_select_all" on public.kingdoms_musters for select using (true);

-- Muster levies: unchanged effects (−Population, +Unrest, +levies, spend the card) plus a service record.
create or replace function public.kingdoms_muster_levies(p_county uuid, p_count int)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_house uuid; v_played int; v_seat text; v_pop int; v_barr int; v_cap int; v_card uuid; v_msg text; v_tick int;
begin
  if auth.uid() is null then raise exception 'unauthenticated'; end if;

  -- The county must be held by a house the caller owns.
  select l.id, coalesce(l.cards_played, 0), c.name, coalesce(c.population, 0)
    into v_house, v_played, v_seat, v_pop
  from public.kingdoms_counties c
  join public.kingdoms_leaders l on l.id = c.held_by
  where c.id = p_county and l.user_id = auth.uid()
  for update of l;
  if v_house is null then raise exception 'not_your_holding'; end if;

  if v_played >= 2 then raise exception 'turn_limit'; end if;
  select id into v_card from public.kingdoms_hand
    where house_id = v_house and card_key = 'levies' order by created_at limit 1;
  if v_card is null then raise exception 'no_muster_card'; end if;

  select count(*) into v_barr from public.kingdoms_holding_buildings where county_id = p_county and building_num = 9;
  v_cap := 1 + 2 * v_barr;                                  -- Levy Capacity = base 1 + 2 per Barracks
  if p_count < 1 or p_count > v_cap then raise exception 'bad_count'; end if;
  if p_count > v_pop then raise exception 'not_enough_people'; end if;

  -- Each levy costs 1 Population (holding + house total); the holding gains 1 Unrest per 2 levies.
  update public.kingdoms_counties
     set population = population - p_count,
         unrest = unrest + (p_count / 2)
   where id = p_county;
  update public.kingdoms_leaders
     set resources = jsonb_set(
           jsonb_set(resources, '{population}', to_jsonb(greatest(0, coalesce((resources->>'population')::int, 0) - p_count))),
           '{levies}', to_jsonb(coalesce((resources->>'levies')::int, 0) + p_count)),
         cards_played = cards_played + 1
   where id = v_house;
  delete from public.kingdoms_hand where id = v_card;

  -- Record the service term: raised this tick, disbands after two more seasons.
  select tick into v_tick from public.kingdoms_clock where id;
  insert into public.kingdoms_musters (house_id, county_id, count, raised_tick)
    values (v_house, p_county, p_count, coalesce(v_tick, 0));

  v_msg := 'You muster ' || p_count || ' ' || (case when p_count = 1 then 'levy' else 'levies' end)
           || ' in ' || v_seat || '. −' || p_count || ' Population'
           || case when (p_count / 2) > 0 then ', +' || (p_count / 2) || ' Unrest' else '' end
           || '. They serve two more seasons, then disband.';
  return v_msg;
end;
$$;
revoke all on function public.kingdoms_muster_levies(uuid, int) from public, anon;
grant execute on function public.kingdoms_muster_levies(uuid, int) to authenticated;

-- Release every muster that has served its term (raised + 2 seasons). The men go home: Population restored
-- (house + holding), levies subtracted, the record removed, and the release chronicled.
create or replace function public._kingdoms_release_musters(p_tick int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare r record; v_seat text;
begin
  for r in
    select id, house_id, county_id, count from public.kingdoms_musters where p_tick - raised_tick >= 3
  loop
    update public.kingdoms_leaders
       set resources = jsonb_set(
             jsonb_set(resources, '{population}', to_jsonb(coalesce((resources->>'population')::int, 0) + r.count)),
             '{levies}', to_jsonb(greatest(0, coalesce((resources->>'levies')::int, 0) - r.count)))
     where id = r.house_id;
    if r.county_id is not null then
      update public.kingdoms_counties set population = population + r.count where id = r.county_id;
    end if;
    select name into v_seat from public.kingdoms_counties where id = r.county_id;
    perform public._kingdoms_log(r.house_id, 'Muster', v_seat,
      'The ' || coalesce(regexp_replace(v_seat, '^\s*County of\s+', ''), 'levy') || ' levy is released — '
      || r.count || ' return home.');
    delete from public.kingdoms_musters where id = r.id;
  end loop;
end;
$$;
revoke all on function public._kingdoms_release_musters(int) from public, anon, authenticated;

-- Redefine the tick (from 341) to release due musters every tick, then run the new year when Spring rolls over.
create or replace function public._kingdoms_tick()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_tick int;
begin
  update public.kingdoms_clock set tick = tick + 1, last_tick = now() where id returning tick into v_tick;
  if v_tick is null then                                              -- clock not seeded yet
    insert into public.kingdoms_clock (id) values (true) on conflict (id) do nothing;
    return;
  end if;
  perform public._kingdoms_release_musters(v_tick);                  -- disband any that have served their term
  if v_tick % 6 = 0 then                                             -- back to Spring → a new year begins
    perform public._kingdoms_new_year();
  end if;
end;
$$;
revoke all on function public._kingdoms_tick() from public, anon, authenticated;

notify pgrst, 'reload schema';
