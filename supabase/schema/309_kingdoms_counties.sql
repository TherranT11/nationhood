-- ===========================================================================
-- 309 · Kingdoms — Aldric counties, one granted to each new house.
--
-- The 30 Aldric counties are a fixed, finite pool: each is held by at most one house (name unique,
-- held_by = the holding house or null). Founding a house claims one unheld county for it — concurrency-safe
-- (SELECT … FOR UPDATE SKIP LOCKED) so two simultaneous foundings never grab the same one, and a county name
-- is never used twice. Reads are public (holdings are shared game data); the only writer is the founder RPC.
-- Redefines kingdoms_found_house (307) to claim the county; existing houses are backfilled one each.
-- Depends on: 304, 307. Idempotent. Apply after 308.
-- ===========================================================================

create table if not exists public.kingdoms_counties (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  held_by    uuid references public.kingdoms_leaders(id) on delete set null,   -- holding house (null = unheld)
  created_at timestamptz not null default now()
);
create index if not exists kingdoms_counties_held_idx on public.kingdoms_counties(held_by);

alter table public.kingdoms_counties enable row level security;
grant select on public.kingdoms_counties to anon, authenticated;   -- writes go through the founder RPC only
drop policy if exists "kingdoms_counties_select_all" on public.kingdoms_counties;
create policy "kingdoms_counties_select_all" on public.kingdoms_counties for select using (true);

-- Seed the pool (idempotent).
insert into public.kingdoms_counties (name) values
  ('County of Ashvale'), ('County of Stoneford'), ('County of Highmere'), ('County of Ravenshire'),
  ('County of Westmarch'), ('County of Greyhaven'), ('County of Oakridge'), ('County of Blackmoor'),
  ('County of Whitefield'), ('County of Dunmere'), ('County of Thornwall'), ('County of Kingsbridge'),
  ('County of Redbrook'), ('County of Eldermere'), ('County of Goldcrest'), ('County of Greenhollow'),
  ('County of Wolfden'), ('County of Fairhaven'), ('County of Ironhill'), ('County of Northwatch'),
  ('County of Briarwood'), ('County of Eastwick'), ('County of Silverbrook'), ('County of Amberfield'),
  ('County of Coldharbor'), ('County of Hartwell'), ('County of Willowdale'), ('County of Dragon''s Rest'),
  ('County of Whitecliff'), ('County of Foxmoor')
on conflict (name) do nothing;

-- Redefine the founder RPC (from 307) to also grant one unheld county.
create or replace function public.kingdoms_found_house(p_heritage text, p_house_name text, p_priorities jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid; v_name text; v_prio text[]; v_county uuid;
  v_valid text[] := array['Wealth', 'Land', 'People', 'Ambition', 'Administration', 'Prowess'];
begin
  if auth.uid() is null then raise exception 'unauthenticated'; end if;
  if p_heritage is distinct from 'Aldren' then raise exception 'heritage_unavailable'; end if;
  v_name := btrim(coalesce(p_house_name, ''));
  if v_name = '' then raise exception 'house_name_required'; end if;

  select array_agg(value) into v_prio from jsonb_array_elements_text(coalesce(p_priorities, '[]'::jsonb));
  if v_prio is null
     or array_length(v_prio, 1) <> 6
     or exists (select 1 from unnest(v_prio) x where x <> all(v_valid))
     or (select count(distinct x) from unnest(v_prio) x) <> 6 then
    raise exception 'invalid_priorities';
  end if;

  insert into public.kingdoms_leaders
    (user_id, heritage, house_name, priorities, resources, leader_name, leader_age, leader_gender)
  values
    (auth.uid(), 'Aldren', v_name, p_priorities, public.kingdoms_starting_resources(p_priorities),
     public.kingdoms_random_male_name(), 30 + floor(random() * 21)::int, 'male')
  returning id into v_id;

  -- Grant one unheld county (finite pool; a name is never used twice).
  select id into v_county from public.kingdoms_counties
    where held_by is null order by random() limit 1 for update skip locked;
  if v_county is not null then
    update public.kingdoms_counties set held_by = v_id where id = v_county;
  end if;

  return v_id;
end;
$$;
revoke all on function public.kingdoms_found_house(text, text, jsonb) from public, anon;
grant execute on function public.kingdoms_found_house(text, text, jsonb) to authenticated;

-- Backfill: give every existing house that holds no county one from the pool.
do $$
declare h uuid; c uuid;
begin
  for h in select l.id from public.kingdoms_leaders l
           where not exists (select 1 from public.kingdoms_counties k where k.held_by = l.id) loop
    select id into c from public.kingdoms_counties where held_by is null order by random() limit 1;
    exit when c is null;
    update public.kingdoms_counties set held_by = h where id = c;
  end loop;
end $$;

notify pgrst, 'reload schema';
