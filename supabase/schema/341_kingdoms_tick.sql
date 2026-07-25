-- ===========================================================================
-- 341 · Kingdoms — the Tick: an 8-hour world clock with seasons, annual aging, death, and succession.
--
-- A single world clock (kingdoms_clock) advances one tick every 8 hours via pg_cron, mirroring the nation
-- game's tick pattern (schema/60). Six seasons cycle in order:
--     0 Spring · 1 Early Summer · 2 Late Summer · 3 Fall · 4 Early Winter · 5 Late Winter
-- so season = tick mod 6 (index 0 = Spring) and year = base_year + tick div 6. Six ticks (48 real hours)
-- make a game year.
--
-- When the clock rolls over to a fresh Spring (tick a positive multiple of 6), _kingdoms_new_year runs:
--   * every Personality and knight ages one year;
--   * each then risks death. Death age is uniform in [55, 70] — modelled as a per-year hazard 1/(71-age)
--     with a hard cap at 70, which yields a uniform death age across the window and guarantees nobody
--     outlives it. For a woman who has borne children the whole window slides DOWN 2 years per child
--     (childbirth's toll): cap 70-2c, low 55-2c. The childbearing woman is the male head's wife, or a
--     female head herself; men and knights use the flat 55–70.
--   * the Head of House's death triggers SUCCESSION: the eldest living child takes the seat (same house
--     row, so holdings / hand / knights / crown all pass intact) and the remaining children become the new
--     head's siblings. A head who dies with no child ends the line — holdings are razed and released and the
--     row is deleted (freeing the throne if it was Sovereign), exactly as Delete Dynasty does (schema/325).
--
-- The top bar reads season + year from kingdoms_clock and counts down to the next 8-hour boundary client-side.
-- Depends on: 307/311 (leaders, ages), 321/334 (children + relation), 328/329 (knights + age), 325 (teardown),
-- 337 (_kingdoms_log). Idempotent. Apply after 340.
-- ===========================================================================

-- The world clock — a single row (id is a singleton boolean, always true).
create table if not exists public.kingdoms_clock (
  id        boolean primary key default true,
  tick      int         not null default 0,
  base_year int         not null default 845,
  last_tick timestamptz not null default now(),
  constraint kingdoms_clock_singleton check (id)
);
alter table public.kingdoms_clock enable row level security;
grant select on public.kingdoms_clock to anon, authenticated;   -- the clock is public; only the tick RPC writes it
drop policy if exists "kingdoms_clock_select_all" on public.kingdoms_clock;
create policy "kingdoms_clock_select_all" on public.kingdoms_clock for select using (true);
insert into public.kingdoms_clock (id) values (true) on conflict (id) do nothing;

-- The annual step: age everyone, then resolve deaths (and the head's succession). Called only on a new Spring.
create or replace function public._kingdoms_new_year()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record; v_heir record; v_children int; v_cap int; v_low int; v_female boolean; v_seat text;
begin
  -- Everyone grows a year older.
  update public.kingdoms_leaders set leader_age = coalesce(leader_age, 0) + 1;
  update public.kingdoms_leaders set spouse_age = spouse_age + 1 where spouse_name is not null and spouse_age is not null;
  update public.kingdoms_children  set age = age + 1;
  update public.kingdoms_knights   set age = age + 1;

  -- Children, siblings, and knights bear no children (c = 0) → the flat 55–70 window. Remove the fallen.
  delete from public.kingdoms_children where age >= 70 or (age >= 55 and random() < 1.0 / (71 - age));
  delete from public.kingdoms_knights  where age >= 70 or (age >= 55 and random() < 1.0 / (71 - age));

  -- The Lady of the House (a male head's wife): her window slides down 2 years per child she has borne.
  for r in
    select id, spouse_age from public.kingdoms_leaders where spouse_name is not null and spouse_age is not null
  loop
    select count(*) into v_children from public.kingdoms_children where house_id = r.id and relation = 'child';
    v_low := 55 - 2 * v_children; v_cap := 70 - 2 * v_children;
    if r.spouse_age >= v_cap or (r.spouse_age >= v_low and random() < 1.0 / (v_cap + 1 - r.spouse_age)) then
      update public.kingdoms_leaders set spouse_name = null, spouse_age = null, spouse_infirm = false where id = r.id;
      perform public._kingdoms_log(r.id, 'Death', null, 'The Lady of the House has passed away.');
    end if;
  end loop;

  -- The Head of House. A female head is the childbearing woman (window slides); a male head uses 55–70.
  for r in
    select id, coalesce(leader_age, 0) as age, leader_gender, leader_name from public.kingdoms_leaders
  loop
    v_female := (r.leader_gender = 'female');
    if v_female then
      select count(*) into v_children from public.kingdoms_children where house_id = r.id and relation = 'child';
    else
      v_children := 0;
    end if;
    v_low := 55 - 2 * v_children; v_cap := 70 - 2 * v_children;

    if r.age >= v_cap or (r.age >= v_low and random() < 1.0 / (v_cap + 1 - r.age)) then
      -- The head has died. The eldest living child succeeds.
      select id, name, gender, age into v_heir
        from public.kingdoms_children where house_id = r.id and relation = 'child'
        order by age desc, created_at asc limit 1;

      if v_heir.id is not null then
        update public.kingdoms_leaders
           set leader_name = v_heir.name, leader_age = v_heir.age, leader_gender = v_heir.gender,
               spouse_name = null, spouse_age = null, spouse_infirm = false   -- the new head begins unwed
         where id = r.id;
        delete from public.kingdoms_children where id = v_heir.id;             -- the heir is now the head
        update public.kingdoms_children set relation = 'sibling'              -- the rest become the head's siblings
         where house_id = r.id and relation = 'child';
        select name into v_seat from public.kingdoms_counties where held_by = r.id order by created_at limit 1;
        perform public._kingdoms_log(r.id, 'Death', v_seat,
          r.leader_name || ' has died. ' || v_heir.name || ' succeeds as head of the house.');
      else
        -- No heir: the line ends. Raze and release the holdings; deleting the row frees the throne.
        delete from public.kingdoms_holding_buildings
          where county_id in (select id from public.kingdoms_counties where held_by = r.id);
        update public.kingdoms_counties set held_by = null, unrest = 1 where held_by = r.id;
        delete from public.kingdoms_leaders where id = r.id;   -- cascades hand / children / knights / events
      end if;
    end if;
  end loop;
end;
$$;
revoke all on function public._kingdoms_new_year() from public, anon, authenticated;

-- The tick: advance the clock 8 hours. When it rolls over to a fresh Spring, run the annual step.
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
  if v_tick % 6 = 0 then                                             -- back to Spring → a new year begins
    perform public._kingdoms_new_year();
  end if;
end;
$$;
revoke all on function public._kingdoms_tick() from public, anon, authenticated;

-- The 8-hour clock. Schedule _kingdoms_tick() via pg_cron (00:00 / 08:00 / 16:00 UTC), mirroring the nation
-- tick. Idempotent — cron.schedule upserts by job name — with a graceful notice if pg_cron is unavailable.
do $$ begin
  create extension if not exists pg_cron;
  perform cron.schedule('kingdoms-tick', '0 */8 * * *', 'select public._kingdoms_tick();');
exception when others then
  raise notice 'pg_cron not configured (%): enable it, then run cron.schedule(''kingdoms-tick'', ''0 */8 * * *'', ''select public._kingdoms_tick();'').', sqlerrm;
end $$;

notify pgrst, 'reload schema';
