-- ===========================================================================
-- 200 · Derived stats — compute the stats that used to be hand-typed.
--
-- Three kinds of derivation, all folded into nation_stat_values (schema/194, the ONE display source):
--   • POLICY-DERIVED (already handled by _nation_live_stat's policy-contribution term): Bureaucracy,
--     Tax Burden, Military Research, Civil Liberties — just removed from the admin grid (policies.js).
--   • FORMULA-DERIVED (this file): Armed Forces Funding, CO₂ Emissions, Global Warming, Energy
--     Availability, Interest Rates — dedicated functions routed through _nation_stat_raw.
--   • STAT-FROM-STAT (admin-authored stat_connectors, schema/194): Crime, Poverty, Demographic Pressure,
--     Standard of Living, Equity Between Generations — seeded below with tunable starter couplings.
--
-- The formula coefficients + seed connectors are STARTING POINTS, meant to be tuned live in adminsetup
-- (connectors) — they are flagged, not sacred. The real-backed mirrors (Growth / Prosperity / Rule of
-- Law) are deliberately untouched. Depends on: 194 (_nation_stat_raw, nation_stat_values, stat_connectors),
-- 152 (_nation_policy_stat), 70 (_to_num), 127 (military_bases), 10 (nations). Idempotent.
-- ===========================================================================

-- Armed Forces Funding: the standing military's upkeep — Armies ×1, Fleets ×3, Air Wings ×2 across the
-- nation's bases (schema/127). [TUNABLE weights.]
create or replace function public._nation_armed_forces_funding(p_nation text)
returns numeric language sql stable security definer set search_path = public as $$
  select coalesce(sum(armies * 1 + fleets * 3 + air_wings * 2), 0)::numeric
    from public.military_bases where nation_id = p_nation;
$$;
revoke all on function public._nation_armed_forces_funding(text) from public, anon, authenticated;

-- CO₂ Emissions: carbon from the dirty producers — energy + goods + minerals output — plus any green
-- policy contribution (negative), floored at 0. [TUNABLE mix.]
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

-- Global Warming: worldwide — the sum of every non-dormant nation's CO₂ Emissions (a global layer, the
-- same figure for every nation).
create or replace function public._nation_global_warming()
returns numeric language sql stable security definer set search_path = public as $$
  select coalesce(round(sum(public._nation_co2_emissions(id)), 1), 0)
    from public.nations where not coalesce(dormant, false);
$$;
revoke all on function public._nation_global_warming() from public, anon, authenticated;

-- Energy Availability: net power — energy production (×10) minus what industry (goods + services output)
-- and the population draw. Positive = surplus, negative = shortfall. [TUNABLE divisors.]
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

-- Interest Rates: a base borrowing rate plus a risk premium that climbs with the debt-to-GDP ratio,
-- plus any policy contribution. base 3 + (debt / gdp) × 5. [TUNABLE base + premium factor.]
create or replace function public._nation_interest_rate(p_nation text)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare v_debt numeric; v_gdp numeric; v numeric;
begin
  select coalesce(public._to_num(economy->>'debt'), 0), coalesce(gdp, 0) into v_debt, v_gdp
    from public.nations where id = p_nation;
  v := 3 + (case when v_gdp > 0 then (v_debt / v_gdp) * 5 else 0 end)
     + coalesce(public._nation_policy_stat(p_nation, 'Interest Rates'), 0);
  return round(v, 2);
end $$;
revoke all on function public._nation_interest_rate(text) from public, anon, authenticated;

-- Route the five formula stats through the raw-value router (supersedes schema/194). Everything else is
-- unchanged: derived-financial, Public Debt, else the ministry base + policy + delta live stat.
create or replace function public._nation_stat_raw(p_nation text, p_stat text)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare v numeric;
begin
  if p_stat = 'Budget Balance' then return coalesce(public._nation_budget_balance(p_nation), 0);
  elsif p_stat = 'Tax Burden' then return coalesce(public._nation_tax_burden(p_nation), 0);
  elsif p_stat = 'Public Debt' then
    select coalesce(public._to_num(economy->>'debt'), 0) into v from public.nations where id = p_nation;
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

-- nation_stat_values (supersedes schema/194): the five formula stats now always resolve to a value (add
-- them to the "has real backing" set so they never show "--").
create or replace function public.nation_stat_values(p_nation text, p_stats text[])
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_out jsonb := '{}'::jsonb; s text; c numeric; n public.nations%rowtype; v_has boolean;
begin
  select * into n from public.nations where id = p_nation;
  if not found then return v_out; end if;
  foreach s in array coalesce(p_stats, array[]::text[]) loop
    -- Every DERIVED stat always resolves to a value (even 0) rather than "--": the five formula stats,
    -- the policy-derived ones, and the connector-driven ones (which can legitimately net to 0).
    v_has := s in ('Budget Balance', 'Tax Burden', 'Bureaucracy', 'Armed Forces Funding', 'CO₂ Emissions',
                   'Global Warming', 'Energy Availability', 'Interest Rates', 'Military Research',
                   'Civil Liberties', 'Crime', 'Poverty', 'Demographic Pressure', 'Standard of Living',
                   'Equity Between Generations')
          or (s = 'Public Debt' and public._to_num(n.economy->>'debt') is not null)
          or public._to_num(n.ministry_stats->>s) is not null
          or public._to_num(n.stat_deltas->>s) is not null
          or coalesce(public._nation_policy_stat(p_nation, s), 0) <> 0
          or s in ('Growth', 'Prosperity', 'Rule of Law');
    c := public._nation_stat_connectors(p_nation, s);
    if not v_has and coalesce(c, 0) = 0 then continue; end if;   -- no base, no connector → "--"
    v_out := jsonb_set(v_out, array[s],
      to_jsonb(round(public._nation_stat_raw(p_nation, s) + coalesce(c, 0), 2)));
  end loop;
  return v_out;
end $$;
grant execute on function public.nation_stat_values(text, text[]) to authenticated;

-- Seed the stat-from-stat couplings (schema/194 stat_connectors) — TUNABLE starters. Idempotent: a
-- (source,target) pair is only added if it isn't already present, so re-runs don't duplicate and admin
-- edits/deletions are preserved. "good" 0–100 stats are measured from a 50 midpoint; "bad" ones from 0.
insert into public.stat_connectors (source, target, per, amount, reference)
select v.source, v.target, v.per::numeric, v.amount::numeric, v.reference::numeric
from (values
  -- Crime ← Rule of Law (−), Poverty (+), Unemployment (+), Corruption (+)
  ('Rule of Law', 'Crime', 5, -1, 50), ('Poverty', 'Crime', 5, 1, 0),
  ('Unemployment', 'Crime', 5, 1, 0), ('Corruption', 'Crime', 5, 1, 0),
  -- Poverty ← Wages (−), Unemployment (+)
  ('Wages', 'Poverty', 5, -1, 50), ('Unemployment', 'Poverty', 5, 1, 0),
  -- Demographic Pressure ← Birth Rate (+), Immigration (+), Housing Affordability (−)
  ('Birth Rate', 'Demographic Pressure', 5, 1, 0), ('Immigration', 'Demographic Pressure', 5, 1, 0),
  ('Housing Affordability', 'Demographic Pressure', 5, -1, 50),
  -- Standard of Living ← Wages (+), Poverty (−), Housing Affordability (+), Health (+)
  ('Wages', 'Standard of Living', 5, 1, 50), ('Poverty', 'Standard of Living', 5, -1, 0),
  ('Housing Affordability', 'Standard of Living', 5, 1, 50), ('Health', 'Standard of Living', 5, 1, 50),
  -- Equity Between Generations ← Housing Affordability (+), Pension Quality (+), Unemployment (−), Public Debt (−)
  ('Housing Affordability', 'Equity Between Generations', 5, 1, 50),
  ('Pension Quality', 'Equity Between Generations', 5, 1, 50),
  ('Unemployment', 'Equity Between Generations', 5, -1, 0),
  ('Public Debt', 'Equity Between Generations', 20, -1, 0)
) as v(source, target, per, amount, reference)
where not exists (select 1 from public.stat_connectors sc where sc.source = v.source and sc.target = v.target);

-- One-time cleanup: a stat is DERIVED now, so any old hand-typed value still sitting in ministry_stats
-- would leak in as a base term (the policy/connector-derived ones route through _nation_live_stat, which
-- reads that base). Strip the derived keys so their value is purely computed. Idempotent — removing an
-- absent key is a no-op — so this is safe on every re-run and for nations that never had the value.
update public.nations set ministry_stats = ministry_stats
    - 'Tax Burden' - 'Bureaucracy' - 'Military Research' - 'Civil Liberties'
    - 'Armed Forces Funding' - 'CO₂ Emissions' - 'Global Warming' - 'Energy Availability' - 'Interest Rates'
    - 'Crime' - 'Poverty' - 'Demographic Pressure' - 'Standard of Living' - 'Equity Between Generations'
  where ministry_stats ?| array['Tax Burden','Bureaucracy','Military Research','Civil Liberties',
    'Armed Forces Funding','CO₂ Emissions','Global Warming','Energy Availability','Interest Rates',
    'Crime','Poverty','Demographic Pressure','Standard of Living','Equity Between Generations'];

notify pgrst, 'reload schema';
