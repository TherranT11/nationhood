-- ===========================================================================
-- 47 · Corporations — firms that ride each nation's business climate.
--
-- Admin-authored via /adminsetup (is_admin RLS, same pattern as nations/modifiers).
-- The climate math lives in corporations.js (client) for display; Phase 2 will mirror it
-- in SQL for the tick automation (generation-list release, per-firm growth, sector bonuses)
-- so the formula has ONE server-side source the tick reads. Every nation starts empty.
--
-- status:
--   'placed' — live in the nation's register now.
--   'queued' — on the Growing Economy Generation List; enters as a Startup (seeded with
--              roll_m) once the nation's climate is healthy (Phase 2 auto-release).
-- ===========================================================================
create table if not exists public.corporations (
  id          uuid primary key default gen_random_uuid(),
  nation_id   text not null references public.nations (id) on delete cascade,
  name        text not null,
  category    text not null,                    -- sector (Energy, Finance, …) — drives the sector bonus
  type        text not null default 'pr',       -- 'pr' private | 'so' state-owned
  size        text not null default 'Moderate', -- Startup | Moderate | Enterprise | National Corporation | International Conglomerate
  cash        numeric not null default 0,       -- $B
  debt        numeric not null default 0,       -- $B  (>= 0)
  drift       int     not null default 0,       -- the firm's own trajectory; corpGrowth() in corporations.js reads this. Phase 2 applies it per tick
  status      text    not null default 'placed',-- 'placed' | 'queued'
  roll_m      int,                              -- queued: rolled startup cash in $M (1D60+20); null once placed
  created_at  timestamptz not null default now()
);
create index if not exists corporations_nation_idx on public.corporations (nation_id);

-- RLS: everyone reads (the World/Corporations register is public); only admins write
-- directly. The Phase 2 tick functions run security definer, so they bypass these.
alter table public.corporations enable row level security;
drop policy if exists "corp_select_all"   on public.corporations;
create policy "corp_select_all"   on public.corporations for select using (true);
drop policy if exists "corp_insert_admin" on public.corporations;
create policy "corp_insert_admin" on public.corporations for insert with check (public.is_admin());
drop policy if exists "corp_update_admin" on public.corporations;
create policy "corp_update_admin" on public.corporations for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "corp_delete_admin" on public.corporations;
create policy "corp_delete_admin" on public.corporations for delete using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Phase 2 · ONE server-side source for the business climate. The tick AND the client both
-- read these; the JS copies (businessClimate/corpGrowth in corporations.js, nationTaxBurden
-- in policies.js) are retired in favour of the corp_register / nation_tax_burden RPCs below.
-- The climate depends on the DERIVED tax burden, so that ports too.
-- ---------------------------------------------------------------------------

-- Nation Tax Burden % — base economy.tax + each policy's in-force option 'taxBurden'
-- contribution, clamped 0..100. Mirrors nationTaxBurden (policies.js), now the one source.
create or replace function public._nation_tax_burden(p_nation text)
returns numeric language sql stable security definer set search_path = public as $$
  select greatest(0, least(100,
      coalesce((n.economy->>'tax')::numeric, 0)
    + coalesce((
        select sum(coalesce((public._policy_options(pol.definition)
              -> public._nation_policy_option(p_nation, pol.id) ->> 'taxBurden')::numeric, 0))
        from public.policies pol
      ), 0)
  ))
  from public.nations n where n.id = p_nation;
$$;

-- Business climate — how far the nation's economy sits above/below the world baseline
-- (CLIMATE_BASE: tax 25, growth 10, prosperity 12, unemployment 7, inflation 10). Mirrors
-- businessClimate (corporations.js); its tax input is the DERIVED burden above.
create or replace function public._business_climate(p_nation text)
returns numeric language sql stable security definer set search_path = public as $$
  select round((
      (coalesce((n.stats->>'growth')::numeric, 0)         - 10)
    + (coalesce((n.stats->>'prosperity')::numeric, 0)     - 12) * 0.3
    - (public._nation_tax_burden(p_nation)                - 25) * 0.04
    - (coalesce((n.economy->>'inflation')::numeric, 0)    - 10) * 0.3
    - (coalesce((n.economy->>'unemployment')::numeric, 0) -  7) * 0.3
  )::numeric, 1)
  from public.nations n where n.id = p_nation;
$$;

-- A firm's growth = climate + its drift, minus a hard debt drag, clamped ±9. Mirrors
-- corpGrowth (corporations.js).
create or replace function public._corp_growth(p_drift numeric, p_debt numeric, p_climate numeric)
returns numeric language sql immutable as $$
  select greatest(-9, least(9, round(
    (p_climate + coalesce(p_drift, 0) - (case when coalesce(p_debt, 0) > 0 then coalesce(p_debt, 0) * 3 else 0 end))::numeric, 1)));
$$;

-- RPC: the public register for a nation — climate, derived tax burden, and each placed firm
-- with its derived growth. ONE source the corporations page renders directly (no JS formula).
create or replace function public.corp_register(p_nation text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'climate',   public._business_climate(p_nation),
    'taxBurden', public._nation_tax_burden(p_nation),
    'firms', coalesce((
      select jsonb_agg(jsonb_build_object(
          'name', c.name, 'type', c.type, 'size', c.size, 'category', c.category,
          'cash', c.cash, 'debt', c.debt,
          'growth', public._corp_growth(c.drift, c.debt, public._business_climate(p_nation))
        ) order by c.created_at)
      from public.corporations c
      where c.nation_id = p_nation and c.status = 'placed'
    ), '[]'::jsonb)
  );
$$;

-- RPC: a nation's derived Tax Burden % (the home glance reads this).
create or replace function public.nation_tax_burden(p_nation text)
returns numeric language sql stable security definer set search_path = public as $$
  select public._nation_tax_burden(p_nation);
$$;

revoke all on function public._nation_tax_burden(text) from public, anon, authenticated;
revoke all on function public._business_climate(text)  from public, anon, authenticated;
grant execute on function public.corp_register(text)     to anon, authenticated;
grant execute on function public.nation_tax_burden(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Phase 2b · Sector bonus — a ONE-TIME amount a placed firm adds to its nation, by SIZE
-- (Startup +0.1 … International +0.5), to the production resource or stat its sector maps to.
-- Applied on placement, reversed if the firm folds/is removed (the addition is lost). Firms
-- never shrink, so a bonus is only ever added once and removed once. Finance/Construction/
-- Logistics are rule-modifiers with no production/stat target (no-op). ONE source for the
-- amount+target: the tick (release/fold) and the admin create/delete RPCs all call this.
-- ---------------------------------------------------------------------------
create or replace function public._corp_bonus_amount(p_size text)
returns numeric language sql immutable as $$
  select case lower(p_size)
    when 'startup' then 0.1 when 'moderate' then 0.2 when 'enterprise' then 0.3
    when 'national corporation' then 0.4 when 'international conglomerate' then 0.5 else 0 end;
$$;

create or replace function public._corp_apply_bonus(p_corp public.corporations, p_sign int)
returns void language plpgsql security definer set search_path = public as $$
declare v_amt numeric; v_col text; v_key text; v_lo numeric; v_hi numeric;
begin
  v_amt := p_sign * public._corp_bonus_amount(p_corp.size);
  if v_amt = 0 then return; end if;
  case p_corp.category
    when 'Energy','Nuclear'                          then v_col:='production'; v_key:='energy';     v_lo:=0; v_hi:=null;
    when 'Agriculture'                               then v_col:='production'; v_key:='food';       v_lo:=0; v_hi:=null;
    when 'Mining'                                    then v_col:='production'; v_key:='minerals';   v_lo:=0; v_hi:=null;
    when 'Heavy Industry','Shipping','Manufacturing' then v_col:='production'; v_key:='goods';      v_lo:=0; v_hi:=null;
    when 'Telecom','Services'                        then v_col:='production'; v_key:='services';   v_lo:=0; v_hi:=null;
    when 'Airline'                                   then v_col:='production'; v_key:='diplomacy';  v_lo:=0; v_hi:=null;
    when 'Aerospace'                                 then v_col:='stats';      v_key:='image';      v_lo:=1; v_hi:=20;
    when 'Pharma'                                    then v_col:='stats';      v_key:='welfare';    v_lo:=1; v_hi:=20;
    when 'Retail'                                    then v_col:='stats';      v_key:='prosperity'; v_lo:=1; v_hi:=20;
    when 'Rail'                                      then v_col:='stats';      v_key:='growth';     v_lo:=1; v_hi:=20;
    else return;  -- Finance / Construction / Logistics: rule-modifiers, no production/stat target
  end case;
  perform public._nation_stat_add(p_corp.nation_id, v_col, v_key, v_amt, v_lo, v_hi);
end $$;

-- RPC: admin creates a firm and, if it's placed now, applies its sector bonus atomically.
create or replace function public.corp_create(p_nation text, p_name text, p_category text, p_type text,
  p_size text, p_cash numeric, p_debt numeric, p_drift int, p_status text, p_roll_m int)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_corp public.corporations;
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  insert into public.corporations (nation_id, name, category, type, size, cash, debt, drift, status, roll_m)
  values (p_nation, p_name, p_category, p_type, p_size, p_cash, p_debt, p_drift, coalesce(p_status,'placed'), p_roll_m)
  returning * into v_corp;
  if v_corp.status = 'placed' then perform public._corp_apply_bonus(v_corp, 1); end if;
  return v_corp.id;
end $$;

-- RPC: admin deletes a firm; reverse its sector bonus first if it was placed (the addition is lost).
create or replace function public.corp_delete(p_corp uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_corp public.corporations;
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  select * into v_corp from public.corporations where id = p_corp;
  if not found then return; end if;
  if v_corp.status = 'placed' then perform public._corp_apply_bonus(v_corp, -1); end if;
  delete from public.corporations where id = p_corp;
end $$;

revoke all on function public._corp_apply_bonus(public.corporations, int) from public, anon, authenticated;
grant execute on function public.corp_create(text, text, text, text, text, numeric, numeric, int, text, int) to authenticated;
grant execute on function public.corp_delete(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Phase 2c · The corporations tick (called by advance_tick, schema/60):
--   1. Generation-list release — a queued firm enters (placed) when its nation's climate is
--      healthy (>= 0.5, the climateWord 'Healthy' band), applying its sector bonus.
--   2. Cash growth — each placed firm's cash compounds by its growth (_corp_growth: climate +
--      drift − debt drag, ±9%).
--   3. Fold — a PRIVATE firm whose cash falls to <= 0 goes under: reverse its sector bonus and
--      remove it. State-owned firms never fold (government-backed).
-- Climate is snapshotted once per nation up front, so releases are deterministic (a release's
-- own +prosperity/+growth bonus can't cascade into another release the same tick) and the
-- expensive climate isn't recomputed per firm.
-- ---------------------------------------------------------------------------
create or replace function public._apply_corp_tick()
returns void language plpgsql security definer set search_path = public as $$
declare r record; v_clim numeric; v_growth numeric; v_newcash numeric;
begin
  drop table if exists _corp_clim;
  create temp table _corp_clim on commit drop as
    select id as nation_id, public._business_climate(id) as climate from public.nations;

  for r in select c.* from public.corporations c where c.status = 'queued' loop
    select climate into v_clim from _corp_clim where nation_id = r.nation_id;
    if coalesce(v_clim, 0) >= 0.5 then
      update public.corporations set status = 'placed', roll_m = null where id = r.id;
      perform public._corp_apply_bonus(r, 1);   -- r still carries size/category/nation_id
    end if;
  end loop;

  for r in select c.* from public.corporations c where c.status = 'placed' loop
    select climate into v_clim from _corp_clim where nation_id = r.nation_id;
    v_growth  := public._corp_growth(r.drift, r.debt, coalesce(v_clim, 0));
    v_newcash := round(r.cash * (1 + v_growth / 100.0), 4);
    if r.type = 'pr' and v_newcash <= 0 then
      perform public._corp_apply_bonus(r, -1);
      delete from public.corporations where id = r.id;
    else
      update public.corporations set cash = v_newcash where id = r.id;
    end if;
  end loop;
end $$;
revoke all on function public._apply_corp_tick() from public, anon, authenticated;
