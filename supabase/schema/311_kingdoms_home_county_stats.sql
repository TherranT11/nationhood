-- ===========================================================================
-- 311 · Kingdoms — the home county's Available Land + Population mirror the house's starting stats.
--
-- A new house's single starting county is its home seat, so its numbers should read the same as the house's
-- starting Treasury: Available Land = the Land-priority Plots stat, Population = the People-priority
-- Population stat (both live on kingdoms_leaders.resources). This replaces the per-county random rolls (310)
-- for the founding county — future counties acquired later can still carry their own values. Redefines
-- kingdoms_found_house (309) to set the granted county's stats from the house's resources, and backfills
-- every existing house's held county to match. Depends on: 305, 309, 310. Idempotent. Apply after 310.
-- ===========================================================================

create or replace function public.kingdoms_found_house(p_heritage text, p_house_name text, p_priorities jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid; v_name text; v_prio text[]; v_county uuid; v_res jsonb;
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

  v_res := public.kingdoms_starting_resources(p_priorities);

  insert into public.kingdoms_leaders
    (user_id, heritage, house_name, priorities, resources, leader_name, leader_age, leader_gender)
  values
    (auth.uid(), 'Aldren', v_name, p_priorities, v_res,
     public.kingdoms_random_male_name(), 30 + floor(random() * 21)::int, 'male')
  returning id into v_id;

  -- Grant one unheld county (finite pool; a name is never used twice). Its Available Land + Population
  -- mirror the house's starting stats so the home seat reads the same numbers as the Treasury.
  select id into v_county from public.kingdoms_counties
    where held_by is null order by random() limit 1 for update skip locked;
  if v_county is not null then
    update public.kingdoms_counties
       set held_by        = v_id,
           available_land = coalesce((v_res->>'plots')::int, available_land),
           population     = coalesce((v_res->>'population')::int, population)
     where id = v_county;
  end if;

  return v_id;
end;
$$;
revoke all on function public.kingdoms_found_house(text, text, jsonb) from public, anon;
grant execute on function public.kingdoms_found_house(text, text, jsonb) to authenticated;

-- Backfill: every existing house holds exactly its one home county — align it with that house's stats.
update public.kingdoms_counties c
   set available_land = coalesce((l.resources->>'plots')::int, c.available_land),
       population     = coalesce((l.resources->>'population')::int, c.population)
  from public.kingdoms_leaders l
 where c.held_by = l.id;

notify pgrst, 'reload schema';
