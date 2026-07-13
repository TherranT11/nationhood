-- ===========================================================================
-- 199 · Military units — named, individual land units placed on the world map (Stage 1).
--
-- Supersedes the count-based model (armies/fleets/air_wings on a base) for LAND forces: a unit is now its
-- own row with a NAME ("1st Infantry Division"), a type (infantry | armor), a strength, and a hex it sits
-- on. The Minister of Defence builds one at a base (build_unit): Infantry costs 1 Military; Armor is
-- Infantry converted with heavy industry — 1 Military + 1 Energy + 1 Mineral. A unit matures after 1 tick
-- (ready_tick) and then stands on the map. New units spawn on the nation's capital-ish hex.
--
-- Stage 1 is build + placement + display only. Hex-to-hex MOVEMENT (replacing deploy) and COMBAT are later
-- stages; the old military_bases count columns / deploy stay in place until Stage 2 retires them.
--
-- TUNABLES (flagged for balancing): spawn hex, costs, 1-tick build, strengths (infantry 3 / armor 5),
-- and the per-nation cap (bases × 5). Depends on: 40 (_begin_action, events, current_game_date),
-- 114 (_party_holds_ministry), 05 (game_state), 127 (military_bases), 99 (_nation_onhand_add),
-- 101 (world_hexes), 107 (cities). Idempotent.
-- ===========================================================================

create table if not exists public.military_units (
  id         uuid primary key default gen_random_uuid(),
  nation_id  text not null references public.nations (id) on delete cascade,
  name       text not null,
  unit_type  text not null default 'infantry',   -- infantry | armor
  strength   int  not null default 3,
  q          int,                                 -- hex the unit stands on (null only mid-creation)
  r          int,
  base_id    uuid references public.military_bases (id) on delete set null,   -- where it was raised
  ready_tick int  not null,                       -- active once the game tick reaches this
  created_at timestamptz not null default now()
);
create index if not exists military_units_nation_idx on public.military_units (nation_id);
create index if not exists military_units_hex_idx on public.military_units (q, r);

-- Units standing on the map are public knowledge (you can see foreign forces — like the mock's hostile
-- counters). Writes only through the security-definer RPCs below.
alter table public.military_units enable row level security;
drop policy if exists "military_units_select_all" on public.military_units;
create policy "military_units_select_all" on public.military_units for select using (true);

-- A sensible spawn hex for a new unit: a city of the nation that has map coordinates, else any owned land
-- hex. Null only if the nation holds no placed territory at all.
create or replace function public._nation_spawn_hex(p_nation text)
returns table(q int, r int) language sql stable security definer set search_path = public as $$
  select h.q, h.r from (
    (select c.q as q, c.r as r, 0 as pri from public.cities c
      where c.nation_id = p_nation and c.q is not null and c.r is not null order by c.created_at limit 1)
    union all
    (select w.q as q, w.r as r, 1 as pri from public.world_hexes w
      where w.nation_id = p_nation and w.terrain = 'land' order by w.r, w.q limit 1)
  ) h order by h.pri limit 1;   -- a placed city first, else any owned land hex
$$;
revoke all on function public._nation_spawn_hex(text) from public, anon, authenticated;

-- Base strength by type (ONE source, read by build_unit + shared with the client's UNIT_DEFS).
create or replace function public._unit_strength(p_type text)
returns int language sql immutable as $$ select case when p_type = 'armor' then 5 else 3 end; $$;

-- build_unit: the Minister of Defence raises one named land unit at a base (1 AP). Infantry costs 1
-- Military; Armor additionally converts 1 Energy + 1 Mineral. Capped at (bases × 5) units per nation.
create or replace function public.build_unit(p_base_id uuid, p_name text, p_type text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; v_nation text; v_tick int; v_type text; v_name text;
        v_bases int; v_units int; v_mil numeric; v_en numeric; v_min numeric; v_hex record;
begin
  v_p := public._begin_action(0);   -- requires >= 1 action; the 1 AP is spent below
  v_nation := v_p.nation_id;
  if not public._party_holds_ministry(v_p.id, 'Defence') then
    raise exception 'Only the Minister of Defence can raise a unit.'; end if;
  v_type := lower(coalesce(p_type, ''));
  if v_type not in ('infantry', 'armor') then raise exception 'Choose Infantry or Armor.'; end if;
  v_name := btrim(coalesce(p_name, ''));
  if v_name = '' then raise exception 'Name the unit.'; end if;
  if not exists (select 1 from public.military_bases where id = p_base_id and nation_id = v_nation) then
    raise exception 'That base is not one of yours.'; end if;

  -- Capacity: bases × 5 across the whole nation (built or building). KNOWN TRANSITIONAL GAP: this counts
  -- only the new named units, not the legacy armies/fleets/air_wings still stationed under the old model —
  -- so during the Stage-1/Stage-2 overlap a nation can briefly exceed the intended cap. Reconciled when
  -- Stage 2 retires the count columns (there'll be one unit model, one count).
  select count(*) into v_bases from public.military_bases where nation_id = v_nation;
  select count(*) into v_units from public.military_units where nation_id = v_nation;
  if v_units >= v_bases * 5 then
    raise exception 'Your forces are at capacity (% units for % base(s)).', v_bases * 5, v_bases; end if;

  -- Costs: 1 Military always; Armor also 1 Energy + 1 Mineral (the conversion).
  select coalesce((on_hand->>'military')::numeric, 0), coalesce((on_hand->>'energy')::numeric, 0),
         coalesce((on_hand->>'minerals')::numeric, 0)
    into v_mil, v_en, v_min from public.nations where id = v_nation;
  if v_mil < 1 then raise exception 'Not enough Military (need 1).'; end if;
  if v_type = 'armor' and (v_en < 1 or v_min < 1) then
    raise exception 'Armor needs 1 Energy + 1 Mineral to convert.'; end if;

  perform public._nation_onhand_add(v_nation, 'military', -1);
  if v_type = 'armor' then
    perform public._nation_onhand_add(v_nation, 'energy', -1);
    perform public._nation_onhand_add(v_nation, 'minerals', -1);
  end if;

  select * into v_hex from public._nation_spawn_hex(v_nation);
  if v_hex.q is null then raise exception 'Your nation holds no placed territory to raise a unit on.'; end if;
  select current_tick into v_tick from public.game_state where id;
  insert into public.military_units (nation_id, name, unit_type, strength, q, r, base_id, ready_tick)
    values (v_nation, left(v_name, 48), v_type, public._unit_strength(v_type), v_hex.q, v_hex.r, p_base_id, v_tick + 1);

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_nation, v_p.id, 'declaration',
            'The nation of ' || (select name from public.nations where id = v_nation) ||
            ' has raised ' || left(v_name, 48) || ', a new ' || v_type || ' unit.',
            public.current_game_date());
  return jsonb_build_object('name', left(v_name, 48), 'type', v_type, 'actions', v_p.influence);
end $$;
grant execute on function public.build_unit(uuid, text, text) to authenticated;

notify pgrst, 'reload schema';
