-- ===========================================================================
-- 129 · Expand Military — the Minister of Defence builds military at a base. Each unit costs
-- $5B (from the Budget; a shortfall rolls into Debt) + 1 Energy + 1 Minerals (from on_hand),
-- paid up front, and takes 1 tick to build: an order lands in military_builds and matures on
-- the next tick into on_hand.military (the nation's military count — the one source, capped by
-- bases × 5, schema/128). You can't order past that ceiling (current + already-pending), so a
-- delivery never arrives just to be culled. Base selection records which base is being
-- reinforced (it shows the nation it sits in) — load-bearing once bases can sit abroad.
-- Depends on: 40 (_begin_action, events), 05 (game_state), 91 (_apply_policy_effect: Budget),
-- 99 (_nation_onhand_add), 114 (_party_holds_ministry), 127 (military_bases). Run after 127.
-- ===========================================================================

create table if not exists public.military_builds (
  id         uuid primary key default gen_random_uuid(),
  nation_id  text not null references public.nations (id) on delete cascade,
  base_id    uuid not null references public.military_bases (id) on delete cascade,   -- the base being reinforced
  qty        int  not null check (qty > 0),
  ready_tick int  not null,                                                            -- matures when the tick reaches this
  created_at timestamptz not null default now()
);
create index if not exists military_builds_nation_idx on public.military_builds (nation_id);

-- Owner-only: a nation's pending builds are its own concern (the client reads just its own).
alter table public.military_builds enable row level security;
grant select on public.military_builds to authenticated;
drop policy if exists "military_builds_select_own" on public.military_builds;
create policy "military_builds_select_own" on public.military_builds for select
  using (nation_id in (select p.nation_id from public.parties p where p.user_id = auth.uid()));

-- Order N military at one of your bases (Minister of Defence, 1 AP). Pays up front; delivers
-- next tick. Capped so current military + everything already building stays within bases × 5.
create or replace function public.expand_military(p_base_id uuid, p_qty int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_p public.parties%rowtype; v_nation text; v_tick int; v_qty int;
  v_bases int; v_cap int; v_mil numeric; v_pending numeric; v_headroom int;
  v_energy numeric; v_minerals numeric;
begin
  v_p := public._begin_action(0);   -- requires >= 1 action; the 1 AP is spent below
  v_nation := v_p.nation_id;
  if not public._party_holds_ministry(v_p.id, 'Defence') then
    raise exception 'Only the Minister of Defence can expand the military.'; end if;
  v_qty := coalesce(p_qty, 0);
  if v_qty < 1 then raise exception 'Choose at least 1 military to build.'; end if;
  if not exists (select 1 from public.military_bases where id = p_base_id and nation_id = v_nation) then
    raise exception 'That base is not one of yours.'; end if;

  select count(*) into v_bases from public.military_bases where nation_id = v_nation;
  v_cap := v_bases * 5;
  select coalesce((on_hand->>'military')::numeric, 0),
         coalesce((on_hand->>'energy')::numeric, 0),
         coalesce((on_hand->>'minerals')::numeric, 0)
    into v_mil, v_energy, v_minerals
    from public.nations where id = v_nation;
  select coalesce(sum(qty), 0) into v_pending from public.military_builds where nation_id = v_nation;

  v_headroom := v_cap - floor(v_mil + v_pending)::int;
  if v_headroom < 1 then
    raise exception 'Your bases are at capacity (% of %).', floor(v_mil + v_pending)::int, v_cap; end if;
  if v_qty > v_headroom then
    raise exception 'Only % more will fit within your bases'' capacity.', v_headroom; end if;
  if v_energy < v_qty then raise exception 'Not enough Energy (need %, have %).', v_qty, floor(v_energy)::int; end if;
  if v_minerals < v_qty then raise exception 'Not enough Minerals (need %, have %).', v_qty, floor(v_minerals)::int; end if;

  -- Pay up front: $5B/unit (Budget; shortfall → Debt), 1 Energy + 1 Minerals per unit.
  perform public._apply_policy_effect(v_nation, jsonb_build_object('t', 'Budget', 'v', -(5 * v_qty)));
  perform public._nation_onhand_add(v_nation, 'energy', -v_qty);
  perform public._nation_onhand_add(v_nation, 'minerals', -v_qty);

  select current_tick into v_tick from public.game_state where id;
  insert into public.military_builds (nation_id, base_id, qty, ready_tick)
    values (v_nation, p_base_id, v_qty, v_tick + 1);
  update public.parties set actions_remaining = actions_remaining - 1 where id = v_p.id;

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_nation, v_p.id, 'economy',
            v_qty::text || ' military ordered — ready next turn.', public.current_game_date());
  return jsonb_build_object('ordered', v_qty, 'actions', v_p.actions_remaining - 1);
end $$;
grant execute on function public.expand_military(uuid, int) to authenticated;

-- Each tick (called from _advance_tick, schema/60): every matured order delivers into the
-- nation's military count, then clears. Summed per nation so one feed line covers a batch.
create or replace function public._resolve_military_builds(p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in select nation_id, sum(qty) as qty from public.military_builds
             where ready_tick <= p_tick group by nation_id loop
    perform public._nation_onhand_add(r.nation_id, 'military', r.qty);
    insert into public.events (nation_id, kind, body, game_date)
      values (r.nation_id, 'economy', r.qty::text || ' newly built military joined the ranks.',
              public.current_game_date());
  end loop;
  delete from public.military_builds where ready_tick <= p_tick;
end $$;
revoke all on function public._resolve_military_builds(int) from public, anon, authenticated;

notify pgrst, 'reload schema';
