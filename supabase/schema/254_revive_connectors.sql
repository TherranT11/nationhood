-- ===========================================================================
-- 254 · Revive the STAT-FROM-STAT connectors in nation_stat_values, with a [0,100] clamp.
--
-- Migration 200 made Poverty/Crime/Demographic Pressure/Standard of Living/Equity DERIVED — each tracks
-- its source stats through admin-tunable stat_connectors (Poverty ← Wages/Unemployment, Crime ← Rule of
-- Law/Poverty/Unemployment/Corruption, …). But migration 217 reproduced nation_stat_values from a
-- pre-connector ancestor and silently dropped the connector term (and the _nation_stat_raw formula
-- routing); 225 inherited that. So since 217 those couplings have been dead — the stats only showed what
-- was authored + deltas.
--
-- This restores the connector-inclusive value (_nation_stat_raw + connectors) AND folds a [0,100] clamp
-- around the qualitative result so Poverty/Crime can never go out of range (the fix requested). Signed /
-- unbounded stats (Budget Balance, Public Debt, Tax Burden, Interest Rates, Inflation, Armed Forces
-- Funding, CO₂ Emissions, Global Warming, Energy Availability) keep their natural range.
--
-- SELF-CONTAINED: given the partial production deploy, this re-creates every dependency it needs —
-- stat_connectors table + RLS, _nation_stat_connectors, the four formula functions, _nation_stat_raw
-- (with Inflation added), and the connector seed — all idempotent (create-or-replace / if-not-exists /
-- seed guarded by NOT EXISTS so admin edits are preserved). It does NOT strip authored bases (200's
-- optional ministry_stats cleanup): a connector-target stat reads as authored baseline + live coupling.
--
-- Verbatim from 194 (table, _nation_stat_connectors) and 200 (formula fns, _nation_stat_raw, seed) —
-- their only/latest definitions, so no drift. Built on 252/253's clamped _nation_live_stat. Idempotent.
-- ===========================================================================

set check_function_bodies = off;

-- Connector table (schema/194) ------------------------------------------------------------------------
create table if not exists public.stat_connectors (
  id         uuid primary key default gen_random_uuid(),
  source     text not null,
  target     text not null,
  per        numeric not null default 1,
  amount     numeric not null default 1,
  reference  numeric not null default 0,
  created_at timestamptz not null default now()
);
alter table public.stat_connectors drop column if exists note;
alter table public.stat_connectors drop constraint if exists stat_connectors_per_nonzero;
alter table public.stat_connectors drop constraint if exists stat_connectors_per_positive;
alter table public.stat_connectors add  constraint stat_connectors_per_positive check (per > 0);

alter table public.stat_connectors enable row level security;
drop policy if exists "stat_connectors_select_all" on public.stat_connectors;
create policy "stat_connectors_select_all" on public.stat_connectors for select using (true);
drop policy if exists "stat_connectors_admin_write" on public.stat_connectors;
create policy "stat_connectors_admin_write" on public.stat_connectors for all
  using (public.is_admin()) with check (public.is_admin());

-- Connector resolver (schema/194): sum the couplings targeting p_stat. Each source is read via
-- _nation_stat_raw (never through a connector, so no connector-of-connector recursion).
create or replace function public._nation_stat_connectors(p_nation text, p_stat text)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare v_sum numeric := 0; r record; v_src numeric; v_steps numeric; v_c numeric;
begin
  for r in select source, per, amount, reference from public.stat_connectors where target = p_stat loop
    if r.per = 0 then continue; end if;
    v_src   := public._nation_stat_raw(p_nation, r.source);
    v_steps := trunc((coalesce(v_src, 0) - coalesce(r.reference, 0)) / r.per);
    v_c     := coalesce(r.amount, 0) * v_steps;
    v_sum   := v_sum + greatest(-500, least(500, v_c));
  end loop;
  return v_sum;
end $$;
revoke all on function public._nation_stat_connectors(text, text) from public, anon, authenticated;

-- Formula functions (schema/200) ----------------------------------------------------------------------
create or replace function public._nation_armed_forces_funding(p_nation text)
returns numeric language sql stable security definer set search_path = public as $$
  select coalesce(sum(armies * 1 + fleets * 3 + air_wings * 2), 0)::numeric
    from public.military_bases where nation_id = p_nation;
$$;
revoke all on function public._nation_armed_forces_funding(text) from public, anon, authenticated;

create or replace function public._nation_co2_emissions(p_nation text)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare v_prod jsonb; v numeric;
begin
  select production into v_prod from public.nations where id = p_nation;
  v := coalesce(public._to_num(v_prod->>'energy'), 0) + coalesce(public._to_num(v_prod->>'goods'), 0)
     + coalesce(public._to_num(v_prod->>'minerals'), 0)
     + coalesce(public._nation_policy_stat(p_nation, 'CO₂ Emissions'), 0);
  return greatest(0, round(v, 1));
end $$;
revoke all on function public._nation_co2_emissions(text) from public, anon, authenticated;

create or replace function public._nation_global_warming()
returns numeric language sql stable security definer set search_path = public as $$
  select coalesce(round(sum(public._nation_co2_emissions(id)), 1), 0)
    from public.nations where not coalesce(dormant, false);
$$;
revoke all on function public._nation_global_warming() from public, anon, authenticated;

create or replace function public._nation_energy_availability(p_nation text)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare v_prod jsonb; v_pop numeric; v numeric;
begin
  select production, coalesce(population, 0) into v_prod, v_pop from public.nations where id = p_nation;
  v := coalesce(public._to_num(v_prod->>'energy'), 0) * 10
     - coalesce(public._to_num(v_prod->>'goods'), 0) - coalesce(public._to_num(v_prod->>'services'), 0)
     - v_pop
     + coalesce(public._nation_policy_stat(p_nation, 'Energy Availability'), 0);
  return round(v, 1);
end $$;
revoke all on function public._nation_energy_availability(text) from public, anon, authenticated;

-- Raw router (schema/200) + Inflation (economy.inflation, like Public Debt → economy.debt). This is the
-- value connectors read from their sources; everything not routed here resolves as base+policy+delta+
-- reform via _nation_live_stat (already clamped [0,100] by 252/253).
create or replace function public._nation_stat_raw(p_nation text, p_stat text)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare v numeric;
begin
  if p_stat = 'Budget Balance' then return coalesce(public._nation_budget_balance(p_nation), 0);
  elsif p_stat = 'Tax Burden' then return coalesce(public._nation_tax_burden(p_nation), 0);
  elsif p_stat = 'Public Debt' then
    select coalesce(public._to_num(economy->>'debt'), 0) into v from public.nations where id = p_nation;
    return coalesce(v, 0);
  elsif p_stat = 'Inflation' then
    select coalesce(public._to_num(economy->>'inflation'), 0) into v from public.nations where id = p_nation;
    return coalesce(v, 0);
  elsif p_stat = 'Armed Forces Funding' then return public._nation_armed_forces_funding(p_nation);
  elsif p_stat = 'CO₂ Emissions' then return public._nation_co2_emissions(p_nation);
  elsif p_stat = 'Global Warming' then return public._nation_global_warming();
  elsif p_stat = 'Energy Availability' then return public._nation_energy_availability(p_nation);
  elsif p_stat = 'Interest Rates' then return public._nation_interest_rate(p_nation);
  else return coalesce(public._nation_live_stat(p_nation, p_stat), 0);
  end if;
end $$;
revoke all on function public._nation_stat_raw(text, text) from public, anon, authenticated;

-- Seed the couplings (schema/200) — TUNABLE starters. Guarded by NOT EXISTS so re-runs don't duplicate
-- and admin edits/deletions are preserved.
insert into public.stat_connectors (source, target, per, amount, reference)
select v.source, v.target, v.per::numeric, v.amount::numeric, v.reference::numeric
from (values
  ('Rule of Law', 'Crime', 5, -1, 50), ('Poverty', 'Crime', 5, 1, 0),
  ('Unemployment', 'Crime', 5, 1, 0), ('Corruption', 'Crime', 5, 1, 0),
  ('Wages', 'Poverty', 5, -1, 50), ('Unemployment', 'Poverty', 5, 1, 0),
  ('Birth Rate', 'Demographic Pressure', 5, 1, 0), ('Immigration', 'Demographic Pressure', 5, 1, 0),
  ('Housing Affordability', 'Demographic Pressure', 5, -1, 50),
  ('Wages', 'Standard of Living', 5, 1, 50), ('Poverty', 'Standard of Living', 5, -1, 0),
  ('Housing Affordability', 'Standard of Living', 5, 1, 50), ('Health', 'Standard of Living', 5, 1, 50),
  ('Housing Affordability', 'Equity Between Generations', 5, 1, 50),
  ('Pension Quality', 'Equity Between Generations', 5, 1, 50),
  ('Unemployment', 'Equity Between Generations', 5, -1, 0),
  ('Public Debt', 'Equity Between Generations', 20, -1, 0)
) as v(source, target, per, amount, reference)
where not exists (select 1 from public.stat_connectors sc where sc.source = v.source and sc.target = v.target);

-- nation_stat_values — the ONE display source. Value = _nation_stat_raw + connectors, with the
-- qualitative result clamped [0,100]; financial/formula stats keep their natural (signed/unbounded)
-- range. v_has only decides the "--" case (a stat with no backing and no connector stays "--").
create or replace function public.nation_stat_values(p_nation text, p_stats text[])
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_out jsonb := '{}'::jsonb; s text; c numeric; v numeric; n public.nations%rowtype; v_has boolean;
begin
  select * into n from public.nations where id = p_nation;
  if not found then return v_out; end if;
  foreach s in array coalesce(p_stats, array[]::text[]) loop
    -- Real backing? (derived stats always resolve; connector targets always resolve; else needs a base,
    -- delta, policy, reform, or mirror.)
    v_has := s in ('Budget Balance', 'Tax Burden', 'Bureaucracy', 'Armed Forces Funding', 'CO₂ Emissions',
                   'Global Warming', 'Energy Availability', 'Interest Rates', 'Military Research',
                   'Civil Liberties', 'Crime', 'Poverty', 'Demographic Pressure', 'Standard of Living',
                   'Equity Between Generations')
          or (s = 'Public Debt' and public._to_num(n.economy->>'debt') is not null)
          or (s = 'Inflation'   and public._to_num(n.economy->>'inflation') is not null)
          or public._to_num(n.ministry_stats->>s) is not null
          or public._to_num(n.stat_deltas->>s) is not null
          or coalesce(public._nation_policy_stat(p_nation, s), 0) <> 0
          or coalesce(public._regime_reform_stat(p_nation, s), 0) <> 0
          or s in ('Growth', 'Prosperity', 'Rule of Law');
    c := public._nation_stat_connectors(p_nation, s);
    if not v_has and coalesce(c, 0) = 0 then continue; end if;   -- no base, no connector → "--"
    v := public._nation_stat_raw(p_nation, s) + coalesce(c, 0);
    -- Clamp qualitative stats to [0,100]; signed / formula stats keep their natural range.
    if s not in ('Budget Balance', 'Tax Burden', 'Public Debt', 'Interest Rates', 'Inflation',
                 'Armed Forces Funding', 'CO₂ Emissions', 'Global Warming', 'Energy Availability') then
      v := greatest(0, least(100, v));
    end if;
    v_out := jsonb_set(v_out, array[s], to_jsonb(round(v, 2)));
  end loop;
  return v_out;
end $$;
grant execute on function public.nation_stat_values(text, text[]) to authenticated;

notify pgrst, 'reload schema';
