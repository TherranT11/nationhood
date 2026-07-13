-- ===========================================================================
-- 201 · Regime-stability stats — Control, Revolt Risk, Terrorism, Cult of Personality, Inflation,
-- Government Default. All DERIVED (no hand-set input; policies.js drops them from the grid), routed
-- through nation_stat_values (schema/200, the one display source). Oppression is added as a hand-set
-- CORE stat (in policies.js) that Control + Terrorism read.
--
-- Five are pure formulas. Cult of Personality is a STOCK: propaganda/state-media spending accumulates it
-- (only in an autocracy with low Press Freedom) and it decays 0.2/tick — stored in nations.stats.cult,
-- driven by _nation_cult_tick wired into _advance_tick (schema/60). [Decay automation is authorized.]
--
-- Coefficients are TUNABLE starters. Chained note: Revolt Risk reads Inflation/Control at their true
-- (formula) value, but the connector-derived Poverty/Standard of Living at their pre-connector base
-- (the connector engine is single-pass) — documented, tune via the core drivers if needed.
--
-- Depends on: 200 (_nation_stat_raw / nation_stat_values), 152 (_nation_budget_balance,
-- _nation_policy_stat), 166 (_regime_is_authoritarian), 70 (_to_num), 10 (nations). Idempotent.
-- ===========================================================================

-- Control: the regime's grip. Oppression counts triple, Rule of Law once; Corruption and Civil Liberties
-- erode it. Scaled to 0–100. [TUNABLE weights/divisor.]
create or replace function public._nation_control(p_nation text)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare v numeric;
begin
  v := (3 * public._nation_stat_raw(p_nation, 'Oppression')
        + public._nation_stat_raw(p_nation, 'Rule of Law')
        - public._nation_stat_raw(p_nation, 'Corruption')
        - public._nation_stat_raw(p_nation, 'Civil Liberties')) / 4.0;
  return round(greatest(0, least(100, v)), 1);
end $$;
revoke all on function public._nation_control(text) from public, anon, authenticated;

-- Government Default: 0–100 risk from the debt-to-GDP ratio (150% → 50, 300% → 100 = index debt%/3), plus
-- any policy contribution. [Secondary factors — budget trend, debt service, relations — deferred.]
create or replace function public._nation_govt_default(p_nation text)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare v_debt numeric; v_gdp numeric; v numeric;
begin
  select coalesce(public._to_num(economy->>'debt'), 0), coalesce(gdp, 0) into v_debt, v_gdp
    from public.nations where id = p_nation;
  v := case when v_gdp > 0 then (v_debt / v_gdp) * 100 / 3 else 0 end
     + coalesce(public._nation_policy_stat(p_nation, 'Government Default'), 0);
  return round(greatest(0, least(100, v)), 1);
end $$;
revoke all on function public._nation_govt_default(text) from public, anon, authenticated;

-- Inflation: driven by a monetized deficit — the share of GDP a negative Budget Balance represents —
-- plus policy. [TUNABLE; energy shocks / currency confidence deferred.]
create or replace function public._nation_inflation(p_nation text)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare v_bb numeric; v_gdp numeric; v numeric;
begin
  v_bb := coalesce(public._nation_budget_balance(p_nation), 0);
  select coalesce(gdp, 0) into v_gdp from public.nations where id = p_nation;
  v := case when v_gdp > 0 then greatest(0, -v_bb) / v_gdp * 100 / 2 else 0 end
     + coalesce(public._nation_policy_stat(p_nation, 'Inflation'), 0);
  return round(greatest(0, least(100, v)), 1);
end $$;
revoke all on function public._nation_inflation(text) from public, anon, authenticated;

-- Revolt Risk: popular grievance measured against Control. Grievance = Poverty + Unemployment + Inflation
-- + Extremism − Minority Rights − Standard of Living; Control (−) holds it down. [TUNABLE divisor.]
create or replace function public._nation_revolt_risk(p_nation text)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare v numeric;
begin
  v := ( public._nation_stat_raw(p_nation, 'Poverty') + public._nation_stat_raw(p_nation, 'Unemployment')
       + public._nation_stat_raw(p_nation, 'Inflation') + public._nation_stat_raw(p_nation, 'Extremism')
       - public._nation_stat_raw(p_nation, 'Minority Rights') - public._nation_stat_raw(p_nation, 'Standard of Living')
       ) / 3.0
       - public._nation_stat_raw(p_nation, 'Control') / 2.0;
  return round(greatest(0, least(100, v)), 1);
end $$;
revoke all on function public._nation_revolt_risk(text) from public, anon, authenticated;

-- Terrorism [hidden]: underground violence pressure. Extremism + Corruption + Oppression, less Social
-- Integration and intelligence spending (policy, −). [TUNABLE; foreign sponsorship / Oppression lag deferred.]
create or replace function public._nation_terrorism(p_nation text)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare v numeric;
begin
  v := ( public._nation_stat_raw(p_nation, 'Extremism') + public._nation_stat_raw(p_nation, 'Corruption')
       + public._nation_stat_raw(p_nation, 'Oppression') - public._nation_stat_raw(p_nation, 'Social Integration')
       ) / 3.0
       + coalesce(public._nation_policy_stat(p_nation, 'Terrorism'), 0);   -- intel spending signs negative
  return round(greatest(0, least(100, v)), 1);
end $$;
revoke all on function public._nation_terrorism(text) from public, anon, authenticated;

-- Cult of Personality: a STOCK (nations.stats.cult). Displayed only in an autocracy; 0 elsewhere.
create or replace function public._nation_cult(p_nation text)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare v_stats jsonb; v_eco jsonb;
begin
  select stats, economy into v_stats, v_eco from public.nations where id = p_nation;
  if not public._regime_is_authoritarian(v_eco) then return 0; end if;
  return round(greatest(0, least(100, coalesce(public._to_num(v_stats->>'cult'), 0))), 1);
end $$;
revoke all on function public._nation_cult(text) from public, anon, authenticated;

-- Per-tick Cult stock update (autocracies only): add this tick's propaganda spending IF Press Freedom is
-- low (< 40), then decay 0.2. Called once per tick from _advance_tick (schema/60). Set-based, side-effect
-- free, so it can never abort the tick.
create or replace function public._nation_cult_tick()
returns void language sql security definer set search_path = public as $$
  update public.nations n set stats = jsonb_set(coalesce(n.stats, '{}'::jsonb), '{cult}',
    to_jsonb(round(greatest(0, least(100,
      coalesce(public._to_num(n.stats->>'cult'), 0)
      + (case when public._nation_stat_raw(n.id, 'Press Freedom') < 40
              then coalesce(public._nation_policy_stat(n.id, 'Cult of Personality'), 0) else 0 end)
      - 0.2)), 1)))
   where public._regime_is_authoritarian(n.economy);
$$;
revoke all on function public._nation_cult_tick() from public, anon, authenticated;

-- Route the six new stats through the raw-value router (supersedes schema/200). Unchanged otherwise.
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
  elsif p_stat = 'Control' then return public._nation_control(p_nation);
  elsif p_stat = 'Government Default' then return public._nation_govt_default(p_nation);
  elsif p_stat = 'Inflation' then return public._nation_inflation(p_nation);
  elsif p_stat = 'Revolt Risk' then return public._nation_revolt_risk(p_nation);
  elsif p_stat = 'Terrorism' then return public._nation_terrorism(p_nation);
  elsif p_stat = 'Cult of Personality' then return public._nation_cult(p_nation);
  else return coalesce(public._nation_live_stat(p_nation, p_stat), 0);
  end if;
end $$;
revoke all on function public._nation_stat_raw(text, text) from public, anon, authenticated;

-- nation_stat_values (supersedes schema/200): the six new derived stats always resolve to a value.
create or replace function public.nation_stat_values(p_nation text, p_stats text[])
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_out jsonb := '{}'::jsonb; s text; c numeric; n public.nations%rowtype; v_has boolean;
begin
  select * into n from public.nations where id = p_nation;
  if not found then return v_out; end if;
  foreach s in array coalesce(p_stats, array[]::text[]) loop
    v_has := s in ('Budget Balance', 'Tax Burden', 'Bureaucracy', 'Armed Forces Funding', 'CO₂ Emissions',
                   'Global Warming', 'Energy Availability', 'Interest Rates', 'Military Research',
                   'Civil Liberties', 'Crime', 'Poverty', 'Demographic Pressure', 'Standard of Living',
                   'Equity Between Generations', 'Control', 'Revolt Risk', 'Terrorism',
                   'Cult of Personality', 'Inflation', 'Government Default')
          or (s = 'Public Debt' and public._to_num(n.economy->>'debt') is not null)
          or public._to_num(n.ministry_stats->>s) is not null
          or public._to_num(n.stat_deltas->>s) is not null
          or coalesce(public._nation_policy_stat(p_nation, s), 0) <> 0
          or s in ('Growth', 'Prosperity', 'Rule of Law');
    c := public._nation_stat_connectors(p_nation, s);
    if not v_has and coalesce(c, 0) = 0 then continue; end if;
    v_out := jsonb_set(v_out, array[s],
      to_jsonb(round(public._nation_stat_raw(p_nation, s) + coalesce(c, 0), 2)));
  end loop;
  return v_out;
end $$;
grant execute on function public.nation_stat_values(text, text[]) to authenticated;

notify pgrst, 'reload schema';
