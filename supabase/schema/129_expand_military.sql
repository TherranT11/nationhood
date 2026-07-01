-- ===========================================================================
-- 129 · Expand Military — the Minister of Defence builds typed units at a base (1 AP). A unit
-- is an Army, a Fleet or an Air Wing. Each is paid for in Military (the on_hand.military pool,
-- drawn from Produce/Trade): Army 1, Fleet 2, Air Wing 1 — the ONLY cost. An order lands in
-- military_builds and matures after the unit's build time — Army 1 tick, Fleet 3, Air Wing 2 —
-- into the base's unit count. A base holds at most 5 units total (built + in-flight, schema/128
-- rule now per base). This replaces the old raw-military model (no more $/Energy/Minerals cost,
-- no 1-tick-for-everything, no aggregate cull).
-- Depends on: 40 (_begin_action, events), 05 (game_state), 99 (_nation_onhand_add),
-- 114 (_party_holds_ministry), 127 (military_bases). Run after 127.
-- ===========================================================================

create table if not exists public.military_builds (
  id         uuid primary key default gen_random_uuid(),
  nation_id  text not null references public.nations (id) on delete cascade,
  base_id    uuid not null references public.military_bases (id) on delete cascade,   -- the base being reinforced
  unit_type  text not null default 'army',                                            -- army | fleet | air_wing
  qty        int  not null check (qty > 0),
  ready_tick int  not null,                                                            -- matures when the tick reaches this
  created_at timestamptz not null default now()
);
create index if not exists military_builds_nation_idx on public.military_builds (nation_id);
alter table public.military_builds add column if not exists unit_type text not null default 'army';   -- existing installs

-- Owner-only: a nation's pending builds are its own concern (the client reads just its own).
alter table public.military_builds enable row level security;
grant select on public.military_builds to authenticated;
drop policy if exists "military_builds_select_own" on public.military_builds;
create policy "military_builds_select_own" on public.military_builds for select
  using (nation_id in (select p.nation_id from public.parties p where p.user_id = auth.uid()));

-- How full is a base, counting both stationed units AND everything still building for it — the
-- ONE source for the 5-unit-per-base cap, shared by Expand and Deploy so a delivery + a deploy
-- can never together overfill a base.
create or replace function public._base_committed_units(p_base uuid)
returns int language sql stable security definer set search_path = public as $$
  select coalesce((select armies + fleets + air_wings from public.military_bases where id = p_base), 0)
       + coalesce((select sum(qty)::int from public.military_builds where base_id = p_base), 0);
$$;
revoke all on function public._base_committed_units(uuid) from public, anon, authenticated;

-- Display label for a count of a unit type: "1 Army" / "3 Armies" / "2 Air Wings". ONE source
-- for the wording, shared by the Expand and Deploy feed lines (mirrors the client's uplur()).
create or replace function public._unit_label(p_type text, p_n int)
returns text language sql immutable as $$
  select case when p_n = 1 then replace(initcap(p_type), '_', ' ')
              when p_type = 'army' then 'Armies'
              else replace(initcap(p_type), '_', ' ') || 's' end;
$$;

-- Order N units of one type at one of your bases (Minister of Defence, 1 AP). Pays Military up
-- front; the units arrive after the type's build time. Capped at 5 units per base (built + building).
create or replace function public.expand_military(p_base_id uuid, p_unit_type text, p_qty int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_p public.parties%rowtype; v_nation text; v_tick int; v_qty int; v_type text;
  v_cost int; v_dur int; v_total int; v_mil numeric;
begin
  v_p := public._begin_action(0);   -- requires >= 1 action; the 1 AP is spent below
  v_nation := v_p.nation_id;
  if not public._party_holds_ministry(v_p.id, 'Defence') then
    raise exception 'Only the Minister of Defence can expand the military.'; end if;
  v_type := lower(coalesce(p_unit_type, ''));
  if v_type not in ('army', 'fleet', 'air_wing') then raise exception 'Unknown unit type.'; end if;
  v_qty := coalesce(p_qty, 0);
  if v_qty < 1 then raise exception 'Build at least 1 unit.'; end if;
  if not exists (select 1 from public.military_bases where id = p_base_id and nation_id = v_nation) then
    raise exception 'That base is not one of yours.'; end if;

  v_cost := case v_type when 'fleet' then 2 else 1 end;   -- Military per unit (Army 1, Fleet 2, Air Wing 1)
  v_dur  := case v_type when 'army' then 1 when 'air_wing' then 2 else 3 end;   -- build time in ticks
  v_total := v_cost * v_qty;

  if public._base_committed_units(p_base_id) + v_qty > 5 then
    raise exception 'A base holds at most 5 units (built or building).'; end if;
  select coalesce((on_hand->>'military')::numeric, 0) into v_mil from public.nations where id = v_nation;
  if v_mil < v_total then raise exception 'Not enough Military (need %, have %).', v_total, floor(v_mil)::int; end if;

  perform public._nation_onhand_add(v_nation, 'military', -v_total);   -- spend the Military pool
  select current_tick into v_tick from public.game_state where id;
  insert into public.military_builds (nation_id, base_id, unit_type, qty, ready_tick)
    values (v_nation, p_base_id, v_type, v_qty, v_tick + v_dur);
  update public.parties set actions_remaining = actions_remaining - 1 where id = v_p.id;

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_nation, v_p.id, 'economy',
            v_qty::text || ' ' || public._unit_label(v_type, v_qty)
              || ' ordered — ready in ' || v_dur || ' tick' || case when v_dur = 1 then '' else 's' end || '.',
            public.current_game_date());
  return jsonb_build_object('ordered', v_qty, 'ticks', v_dur, 'actions', v_p.actions_remaining - 1);
end $$;
grant execute on function public.expand_military(uuid, text, int) to authenticated;
drop function if exists public.expand_military(uuid, int);   -- old raw-military signature

-- Each tick (called from _advance_tick, schema/60): every matured order delivers its units into
-- its base's type count, then clears. One feed line per nation covers a batch.
create or replace function public._resolve_military_builds(p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare r record;
begin
  update public.military_bases b
     set armies    = b.armies    + agg.a,
         fleets    = b.fleets    + agg.f,
         air_wings = b.air_wings + agg.w
    from (select base_id,
                 sum(case when unit_type = 'army'     then qty else 0 end) as a,
                 sum(case when unit_type = 'fleet'    then qty else 0 end) as f,
                 sum(case when unit_type = 'air_wing' then qty else 0 end) as w
            from public.military_builds where ready_tick <= p_tick group by base_id) agg
   where b.id = agg.base_id;

  for r in select nation_id, sum(qty) as qty from public.military_builds
             where ready_tick <= p_tick group by nation_id loop
    insert into public.events (nation_id, kind, body, game_date)
      values (r.nation_id, 'economy', r.qty::text || ' newly built unit' || case when r.qty = 1 then '' else 's' end
              || ' joined the ranks.', public.current_game_date());
  end loop;
  delete from public.military_builds where ready_tick <= p_tick;
end $$;
revoke all on function public._resolve_military_builds(int) from public, anon, authenticated;

notify pgrst, 'reload schema';
