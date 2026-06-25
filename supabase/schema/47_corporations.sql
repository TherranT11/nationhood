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
