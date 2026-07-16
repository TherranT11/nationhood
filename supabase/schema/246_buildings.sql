-- ===========================================================================
-- 246 · FDI Phase 2A — the buildings / asset system. Growth binds to the ASSET.
--
-- Phase 1 hung FDI Growth on the deal. Phase 2A makes "Growth is asset-bound" literal: activation
-- places a PLANT (a buildings row) on a host hex, and the host's Growth is summed over its buildings —
-- so nationalization can KEEP the plant (state-owned) at half Growth by editing the building, and every
-- other end removes it. The owner nation's "profits flow home" share stays relationship-bound (on the
-- ACTIVE deal), since no plant sits in the owner's territory.
--
-- buildings is a general object-on-a-hex table (modeled on military_units, schema/199): (nation_id,
-- q, r, kind, owner_nation_id, source, source_id, growth). owner_nation_id set = FOREIGN OWNED;
-- null = domestic / state-owned. source+source_id key the single-delete cleanup, so nothing leaks.
--
-- Depends on: 243-245 (fdi_deals + Growth term + resolve/end), 101 (world_hexes), 47 (corporations),
-- 10 (nations). Idempotent. Apply after 245.
-- ===========================================================================

set check_function_bodies = off;

create table if not exists public.buildings (
  id              uuid primary key default gen_random_uuid(),
  nation_id       text not null references public.nations (id) on delete cascade,   -- where the plant sits (host)
  q               int,
  r               int,
  kind            text not null default 'plant',
  owner_nation_id text references public.nations (id) on delete set null,           -- null = state-owned; set = FOREIGN OWNED
  source          text not null default 'fdi',
  source_id       uuid,                                                             -- the fdi_deals.id (single-delete key)
  growth          numeric not null default 0,                                       -- Growth this asset adds to its host
  label           text,
  created_at      timestamptz not null default now()
);
create index if not exists buildings_nation_idx on public.buildings (nation_id);
create index if not exists buildings_source_idx on public.buildings (source, source_id);

-- Public read — plants are visible map objects (like cities / units). Writes via the security-definer
-- helpers only (the FDI lifecycle is the sole writer in Phase 2A); no client write policy.
alter table public.buildings enable row level security;
drop policy if exists "buildings_select_all" on public.buildings;
create policy "buildings_select_all" on public.buildings for select using (true);

-- Place a building. If no hex is given, fall back to the host's most-populous land hex so the plant
-- always lands somewhere real. ONE source for the insert shape.
create or replace function public._place_building(p_nation text, p_q int, p_r int, p_kind text, p_owner text,
                                                  p_source text, p_source_id uuid, p_growth numeric, p_label text)
returns void language plpgsql security definer set search_path = public as $$
declare v_q int := p_q; v_r int := p_r;
begin
  if v_q is null or v_r is null then
    select q, r into v_q, v_r from public.world_hexes
     where nation_id = p_nation and terrain = 'land' order by coalesce(population, 0) desc, q, r limit 1;
  end if;
  insert into public.buildings (nation_id, q, r, kind, owner_nation_id, source, source_id, growth, label)
    values (p_nation, v_q, v_r, coalesce(p_kind, 'plant'), p_owner, coalesce(p_source, 'fdi'), p_source_id,
            coalesce(p_growth, 0), p_label);
end $$;
revoke all on function public._place_building(text, int, int, text, text, text, uuid, numeric, text) from public, anon, authenticated;

create or replace function public._remove_building(p_source text, p_source_id uuid)
returns void language sql security definer set search_path = public as $$
  delete from public.buildings where source = p_source and source_id = p_source_id;
$$;
revoke all on function public._remove_building(text, uuid) from public, anon, authenticated;

-- FDI Growth a nation feels, now ASSET-bound: sum of building.growth for plants sitting in it (foreign
-- OR nationalized-and-retained), plus its corps' owner_growth over ACTIVE deals abroad (profits home).
-- Reads buildings + fdi_deals only (never Growth) → no recursion in _nation_live_stat. This IS the
-- invariant — the sum is over the assets/relationships that exist, by definition.
create or replace function public._nation_fdi_growth(p_nation text)
returns numeric language sql stable security definer set search_path = public as $$
  select coalesce(sum(g), 0) from (
    select growth       as g from public.buildings  where source = 'fdi' and nation_id = p_nation
    union all
    select owner_growth as g from public.fdi_deals  where state = 'ACTIVE' and owner_nation_id = p_nation
  ) x;
$$;
revoke all on function public._nation_fdi_growth(text) from public, anon, authenticated;

-- Redefine the tick resolver (body from schema/245) to PLACE the plant on activation.
create or replace function public._resolve_fdi_deals(p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare v_d record; v_tier int; v_base numeric; v_p numeric; v_roll numeric; v_rel int; v_clim numeric;
begin
  for v_d in
    select d.*, c.size as corp_size, c.name as corp_name from public.fdi_deals d
      join public.corporations c on c.id = d.corp_id
     where d.state = 'PENDING' and coalesce(d.decision_tick, 0) <= p_tick
  loop
    v_tier := public._corp_fdi_tier(v_d.corp_size);
    v_base := case v_tier when 1 then 0.85 when 3 then 0.35 else 0.60 end;
    select value into v_rel from public.nation_relations
     where nation_a = least(v_d.host_nation_id, v_d.owner_nation_id)
       and nation_b = greatest(v_d.host_nation_id, v_d.owner_nation_id);
    v_clim := public._fdi_climate(v_d.host_nation_id);
    v_p := v_base + 0.05 * coalesce(v_d.temperature, 0)
         + 0.02 * (coalesce(v_rel, 5) - 5)
         + greatest(-0.15, least(0.15, (coalesce(v_clim, 50) - 50) / 100.0 * 0.3));
    v_p := greatest(0.02, least(0.98, v_p));
    v_roll := (('x' || substr(md5(v_d.id::text || p_tick::text), 1, 4))::bit(16)::int)::numeric / 65535.0;
    if v_roll < v_p then
      update public.fdi_deals set state = 'ACTIVE', signed_tick = p_tick where id = v_d.id;
      perform public._place_building(v_d.host_nation_id, v_d.hex_q, v_d.hex_r, 'plant',
                                     v_d.owner_nation_id, 'fdi', v_d.id, v_d.host_growth, v_d.corp_name);
      perform public._fdi_event(v_d.id, 'SIGNED');
    else
      perform public._end_fdi_deal(v_d.id, 'REJECTED');
    end if;
  end loop;

  for v_d in select id from public.fdi_deals
              where state = 'ACTIVE' and ends_tick is not null and ends_tick <= p_tick loop
    perform public._end_fdi_deal(v_d.id, 'EXPIRED');
  end loop;
end $$;
revoke all on function public._resolve_fdi_deals(int) from public, anon, authenticated;

-- Redefine the end path (body from schema/245) to handle the plant: NATIONALIZED keeps it as a
-- state-owned asset at half Growth (expertise leaves); every other end removes it.
create or replace function public._end_fdi_deal(p_deal uuid, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare v_state text;
begin
  select state into v_state from public.fdi_deals where id = p_deal;
  if v_state is null or v_state = 'ENDED' then return; end if;
  update public.fdi_deals set state = 'ENDED', end_reason = p_reason where id = p_deal;
  if p_reason = 'NATIONALIZED' then
    update public.buildings set owner_nation_id = null, growth = round(growth / 2.0)
     where source = 'fdi' and source_id = p_deal;   -- kept, state-owned, half Growth
  else
    perform public._remove_building('fdi', p_deal);
  end if;
  perform public._fdi_event(p_deal, p_reason);
end $$;
revoke all on function public._end_fdi_deal(uuid, text) from public, anon, authenticated;

notify pgrst, 'reload schema';
