-- ===========================================================================
-- 223 · Growth mirror sweep — rewire the raw-mirror readers onto the DERIVED value.
--
-- schema/221 made Growth FULLY DERIVED (stock-market host +8 + policies + reforms + deltas, no
-- authored base) and schema/222 floored every _nation_live_stat at 0. But four backend systems
-- still read the RAW mirror stats.growth directly, so they saw a stale value that diverged from
-- the derived Growth the player sees. This migration rewires those reads to
-- public._nation_live_stat(nation, 'Growth') so Growth is consistent everywhere.
--
-- Recursion is safe: Growth does not depend on any of these systems' output — they READ Growth,
-- Growth does not read GDP/crisis/malaise/headlines — so calling _nation_live_stat inside them
-- creates no cycle.
--
-- The sweep redefines four functions (forward migration; the source files 113/99/125/158 are NOT
-- edited in place). ONLY the Growth read changes in each; every other line is reproduced faithfully.
--   1. public._resolve_economy_demands(int)      — 113 business-climate loop (was stats->>'growth')
--   2. public._nation_stat_get(text, text)        — 99 crisis-trigger stat read, 'Growth' branch
--   3. public._resolve_national_malaise(int)      — 125 malaise, v_gro
--   4. public._headline_subject_value(8-arg)      — 158 headline engine, 'Growth' case branch
--
-- NOT touched:
--   • Prosperity (stats.prosperity) and Rule of Law (stats.order) — those keep their authored base.
--   • 99_crises.sql:173 (_crisis_grow_stats) — that `s->>'growth'` is a CUSTOM crisis stat's
--     per-tick growth field (s iterates definition.customStats), not the nation's Growth stat, so
--     it is intentionally left as-is.
--   • schema/158 _headline_subject_value keeps its signature: p_nation is already a parameter
--     (used for Debt-to-GDP / Tax Burden), so the 'Growth' branch reads the derived value directly
--     with no caller change.
--
-- Depends on: 221 (_nation_live_stat derived Growth, _nation_stock_growth), 222 (floor at 0),
-- 113 (_economy_need / _nation_stat_add / _apply_policy_effect), 99 (_nation_stat_get callers,
-- _crisis_cmp), 125 (_malaise_event, _regime_is_authoritarian, _coalition_health_drop), 158
-- (_to_num, _nation_tax_burden, _regime_reform, headline_rules). Idempotent (create-or-replace).
-- Apply after 222.
-- ===========================================================================

set check_function_bodies = off;

-- ---------------------------------------------------------------------------
-- 1 · 113 business climate — _resolve_economy_demands. The June accounts loop read the raw mirror
-- (coalesce((stats->>'growth')::numeric, 0)); it now reads the derived Growth so the "stalling
-- economy freezes population growth" gate (v_n.growth >= 45) matches what the player sees.
-- ---------------------------------------------------------------------------
create or replace function public._resolve_economy_demands(p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare v_n record; v_year int; v_d jsonb; v_food boolean; v_goods boolean; v_serv boolean; v_mil boolean; v_msg text; v_unmet int; v_conf int;
begin
  if ((p_tick - 1) % 12) + 1 <> 6 then return; end if;   -- June only
  v_year := 1980 + (p_tick - 1) / 12;
  for v_n in select id, demands, coalesce(public._nation_live_stat(id, 'Growth'), 0) as growth from public.nations where not coalesce(dormant, false) loop
    v_d := v_n.demands;
    if v_d is null or (v_d->>'year') is null or (v_d->>'year')::int is distinct from v_year then
      v_food := false; v_goods := false; v_serv := false; v_mil := false;
    else
      v_food  := coalesce((v_d->>'food')::boolean, false);
      v_goods := coalesce((v_d->>'goods')::boolean, false);
      v_serv  := coalesce((v_d->>'services')::boolean, false);
      v_mil   := coalesce((v_d->>'military')::boolean, false);
    end if;

    -- Food: a fed nation grows +1M — but only while Growth holds at 45+. A stalling economy
    -- (Growth < 45) freezes population growth even in a well-fed year (paired with the GDP hit
    -- in schema/125). Unmet food costs Order; either way there's no population growth otherwise.
    if v_food then
      if v_n.growth >= 45 then
        update public.nations set population = coalesce(population, 0) + 1 where id = v_n.id;
      end if;
    else
      perform public._nation_stat_add(v_n.id, 'stats', 'order', -1, 1, 100);
    end if;
    if not v_goods then perform public._nation_stat_add(v_n.id, 'stats', 'prosperity', -1, 1, 100); end if;
    if not v_serv  then perform public._nation_stat_add(v_n.id, 'stats', 'welfare', -1, 1, 100); end if;
    if not v_mil   then perform public._nation_stat_add(v_n.id, 'on_hand', 'military', -1, 0, null); end if;

    -- The government answers for the shortfall: for EACH of the four demands it missed, every
    -- coalition party loses 1% popularity — through _apply_policy_effect (schema/91), which scopes
    -- Party Popularity to the in-government parties (floored). No government / no coalition → no-op.
    -- (The Government Confidence penalty here is retired with that gauge — schema/165.)
    v_unmet := (case when v_food then 0 else 1 end) + (case when v_goods then 0 else 1 end)
             + (case when v_serv then 0 else 1 end) + (case when v_mil then 0 else 1 end);
    if v_unmet > 0 then
      perform public._apply_policy_effect(v_n.id, jsonb_build_object('t', 'Party Popularity', 'v', -v_unmet));
    end if;

    -- Reset for the next cycle (next June).
    update public.nations
       set demands = jsonb_build_object('year', v_year + 1, 'food', false, 'goods', false, 'services', false, 'military', false)
     where id = v_n.id;

    v_msg := 'The ' || v_year || ' annual accounts are in. '
          || (case when v_food and v_n.growth >= 45 then 'The nation was fed — population +1M. '
                    when v_food then 'The nation was fed, but a stalling economy held the population flat. '
                    else 'Food ran short — Order −1. ' end)
          || (case when v_goods then '' else 'Goods ran short — Prosperity −1. ' end)
          || (case when v_serv  then '' else 'Services ran short — Welfare −1. ' end)
          || (case when v_mil   then '' else 'Military upkeep went unpaid — the forces shrank. ' end)
          || (case when v_unmet > 0 then 'The coalition answered for it — Party Popularity −' || v_unmet || '%. ' else '' end);
    insert into public.events (nation_id, party_id, kind, body, game_date)
      values (v_n.id, null, 'economy', btrim(v_msg), public.current_game_date());
  end loop;
end $$;
revoke all on function public._resolve_economy_demands(int) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2 · 99 crisis-trigger stat read — _nation_stat_get. The 'Growth' branch read the raw mirror
-- (stats->>'growth'); it now reads the derived Growth as text, so crisis triggers/resolvers on
-- Growth evaluate against the value the player sees. v_raw stays text; the regex + ::numeric
-- conversion below is unchanged (a derived numeric renders as a plain numeric string).
-- ---------------------------------------------------------------------------
create or replace function public._nation_stat_get(p_nation text, p_target text)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare v_raw text;
begin
  case p_target
    when 'Prosperity'     then select stats->>'prosperity'      into v_raw from public.nations where id = p_nation;
    when 'Welfare'        then select stats->>'welfare'         into v_raw from public.nations where id = p_nation;
    when 'Growth'         then v_raw := public._nation_live_stat(p_nation, 'Growth')::text;   -- derived (schema/221/222), not the raw mirror
    when 'Order'          then select stats->>'order'           into v_raw from public.nations where id = p_nation;
    when 'Image'          then select stats->>'image'           into v_raw from public.nations where id = p_nation;
    when 'Unemployment %' then select economy->>'unemployment'  into v_raw from public.nations where id = p_nation;
    when 'Inflation %'    then select economy->>'inflation'     into v_raw from public.nations where id = p_nation;
    when 'Regime'         then select economy->>'regime_reform' into v_raw from public.nations where id = p_nation;
    when 'Budget'         then select economy->>'budget'        into v_raw from public.nations where id = p_nation;
    when 'Debt'           then select economy->>'debt'          into v_raw from public.nations where id = p_nation;
    when 'Income'         then select economy->>'income'        into v_raw from public.nations where id = p_nation;
    when 'Energy'         then select production->>'energy'      into v_raw from public.nations where id = p_nation;
    when 'Food'           then select production->>'food'        into v_raw from public.nations where id = p_nation;
    when 'Minerals'       then select production->>'minerals'    into v_raw from public.nations where id = p_nation;
    when 'Goods'          then select production->>'goods'        into v_raw from public.nations where id = p_nation;
    when 'Services'       then select production->>'services'    into v_raw from public.nations where id = p_nation;
    when 'Diplomacy'      then select production->>'diplomacy'    into v_raw from public.nations where id = p_nation;
    else return null;   -- unknown or derived target → unevaluable
  end case;
  if v_raw is null or v_raw !~ '^-?[0-9]+(\.[0-9]+)?$' then return null; end if;
  return v_raw::numeric;
end $$;
revoke all on function public._nation_stat_get(text, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3 · 125 national malaise — _resolve_national_malaise. v_gro read the raw mirror
-- (n.stats->>'growth'); it now reads the derived Growth so the < 45 stall / >= 55 dividend GDP
-- moves and the "low Growth" penalties judge the value the player sees. n.id is in scope.
-- ---------------------------------------------------------------------------
create or replace function public._resolve_national_malaise(p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare
  n record;
  v_pro numeric; v_wel numeric; v_gro numeric; v_ord numeric; v_img numeric; v_bud numeric; v_inc numeric;
  v_open boolean; v_gdp_delta numeric; v_debt numeric; v_pct numeric;
begin
  if (p_tick - 1) % 12 <> 0 then return; end if;   -- January only (tick 1, 13, 25, …)
  for n in select id, stats, economy, gdp from public.nations where not coalesce(dormant, false) loop
    v_pro := coalesce((n.stats->>'prosperity')::numeric, 0);
    v_wel := coalesce((n.stats->>'welfare')::numeric, 0);
    v_gro := coalesce(public._nation_live_stat(n.id, 'Growth'), 0);   -- derived (schema/221/222), not the raw mirror
    v_ord := coalesce((n.stats->>'order')::numeric, 0);
    v_img := coalesce((n.stats->>'image')::numeric, 0);
    -- An authoritarian regime (autocracy at the reform floor) suppresses the POLITICAL fallout —
    -- the Prosperity, Welfare and Order penalties only bite an OPEN regime (everything else).
    -- Growth and Global Image (economic / international) still land on everyone. _regime_is_authoritarian
    -- (schema/166) is the ONE test, shared with sanctions; a null/unset type reads as open.
    v_open := not public._regime_is_authoritarian(n.economy);

    if v_pro < 45 and v_open then
      perform public._apply_policy_effect(n.id, jsonb_build_object('t', 'Party Popularity', 'v', -3));
      perform public._malaise_event(n.id, 'Due to low Prosperity, party popularity has suffered (−3%).');
    end if;

    -- Low Welfare formerly cost Government Confidence — retired with that gauge (schema/165).

    if v_ord < 45 and v_open then
      perform public._apply_policy_effect(n.id, jsonb_build_object('t', 'Party Popularity', 'v', -3));
      perform public._apply_policy_effect(n.id, jsonb_build_object('t', 'Growth', 'v', -1));
      perform public._malaise_event(n.id, 'Due to low Order, party popularity has suffered (−3%) and growth has stalled (−1).');
    end if;

    -- Growth's pull on GDP + prosperity. Below 45 the economy stalls: Prosperity slips 1 and GDP
    -- shrinks by (45 − Growth)/5 % (Growth 40 → −1%, Growth 20 → −5%). At 55+ a healthy economy pays a
    -- dividend — GDP grows by (Growth − 55)/5 % (Growth 60 → +1%, Growth 80 → +5%). Between 45 and 54 GDP
    -- holds flat. This is economic, not political, so it bites/rewards every regime (not gated by
    -- v_open). GDP floors at 0, and this is the ONE place GDP moves. (Growth < 45 also freezes
    -- population — schema/113.)
    if v_gro < 45 then
      perform public._apply_policy_effect(n.id, jsonb_build_object('t', 'Prosperity', 'v', -1));
      v_pct := round((45 - v_gro) / 5.0, 1);
      v_gdp_delta := round(coalesce(n.gdp, 0) * v_pct / 100.0);
      if v_gdp_delta > 0 then update public.nations set gdp = greatest(0, gdp - v_gdp_delta) where id = n.id; end if;
      perform public._malaise_event(n.id,
        'Due to low Growth, prosperity has suffered (−1)'
        || (case when v_gdp_delta > 0 then ' and GDP shrank ' || v_pct || '% (−$' || v_gdp_delta || 'B)' else '' end) || '.');
    elsif v_gro >= 55 then
      v_pct := round((v_gro - 55) / 5.0, 1);
      v_gdp_delta := round(coalesce(n.gdp, 0) * v_pct / 100.0);
      if v_gdp_delta > 0 then
        update public.nations set gdp = gdp + v_gdp_delta where id = n.id;
        perform public._malaise_event(n.id, 'Strong Growth expanded GDP by ' || v_pct || '% (+$' || v_gdp_delta || 'B).');
      end if;
    end if;

    if v_img < 45 then
      v_bud := coalesce((n.economy->>'budget')::numeric, 0);
      v_inc := coalesce((n.economy->>'income')::numeric, 0);
      perform public._apply_policy_effect(n.id, jsonb_build_object('t', 'Budget', 'v', -round(v_bud * 0.05, 1)));   -- −5% of the treasury
      perform public._apply_policy_effect(n.id, jsonb_build_object('t', 'Income', 'v', -round(v_inc * 0.05, 1)));   -- −5% of annual income
      perform public._malaise_event(n.id, 'Due to low Global Image, the budget and income have suffered (−5% each).');
    end if;

    -- Debt-to-GDP crisis. Past 100% of GDP the nation's credit is downgraded; past 200% it tips into a
    -- sovereign debt spiral. The interest RATE escalates in _apply_debt_interest (schema/152, run just
    -- before this pass); here is the one-off pain. Austerity stalls Growth and (at 200%) capital flight
    -- shrinks GDP — economic, so every regime pays it. The political fallout (Prosperity / Government
    -- Confidence) is suppressed under an authoritarian regime (v_open), like the other malaise penalties.
    -- Growth ↓ and GDP ↓ both worsen the ratio next year — the pain is a spiral, not a one-time toll.
    v_debt := coalesce((n.economy->>'debt')::numeric, 0);
    if v_debt > 0 and coalesce(n.gdp, 0) > 0 then
      if v_debt > n.gdp * 2 then
        perform public._apply_policy_effect(n.id, jsonb_build_object('t', 'Growth', 'v', -3));
        v_gdp_delta := round(n.gdp * 0.05);   -- capital flight
        if v_gdp_delta > 0 then update public.nations set gdp = greatest(0, gdp - v_gdp_delta) where id = n.id; end if;
        if v_open then
          perform public._apply_policy_effect(n.id, jsonb_build_object('t', 'Prosperity', 'v', -2));
        end if;
        perform public._malaise_event(n.id,
          'Public debt has passed 200% of GDP — a sovereign debt spiral. Borrowing costs jumped to 15% and growth collapsed (−3)'
          || (case when v_gdp_delta > 0 then ', GDP shrank 5% (−$' || v_gdp_delta || 'B) as capital fled' else '' end) || '.');
        -- A DEMOCRATIC government loses a heart of Coalition Health to the crisis; if it was the last,
        -- the government falls apart (−5% Party Popularity to all governing parties, snap election next
        -- tick). Autocracies are spared. ONE source: _coalition_health_drop (schema/165).
        if v_open then perform public._coalition_health_drop(n.id, 1, 5,
          'Public debt passed 200% of GDP and the governing coalition''s health gave way', p_tick); end if;
      elsif v_debt > n.gdp then
        perform public._apply_policy_effect(n.id, jsonb_build_object('t', 'Growth', 'v', -2));
        perform public._malaise_event(n.id,
          'Public debt has passed 100% of GDP — the nation''s credit was downgraded. Borrowing costs doubled to 10% and growth stalled (−2).');
        if v_open then perform public._coalition_health_drop(n.id, 1, 3,
          'Public debt passed 100% of GDP and the governing coalition''s health gave way', p_tick); end if;
      end if;
    end if;
  end loop;
end $$;
revoke all on function public._resolve_national_malaise(int) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4 · 158 headline engine — _headline_subject_value. The 'Growth' case read the passed-in snapshot
-- (p_stats->>'growth'); since p_nation is already a parameter here (used for Debt-to-GDP and Tax
-- Burden), the branch now reads the derived Growth directly — no signature change, no caller change.
-- Every other branch is reproduced unchanged. Signature is identical to schema/158, so no drop.
-- ---------------------------------------------------------------------------
create or replace function public._headline_subject_value(
  p_stats jsonb, p_economy jsonb, p_ministry jsonb, p_onhand jsonb, p_production jsonb,
  p_nation text, p_subject_type text, p_subject text)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare v_st text := coalesce(p_subject_type, 'stat'); v_val numeric;
begin
  if p_subject is null then return null; end if;
  if v_st = 'onhand'     then return public._to_num(p_onhand->>lower(p_subject)); end if;
  if v_st = 'production'  then return public._to_num(p_production->>lower(p_subject)); end if;
  if v_st = 'rate'       then return null; end if;   -- change-per-year: not yet evaluated
  -- v_st = 'stat': the admin-authored ministry-stat value is the ONE 1..100 source (schema/150); the
  -- legacy national/economy fields back it up for the stats not carried there (and the consolidated
  -- five — Rule of Law lives on stats.order). An unauthored stat returns null → no headline.
  v_val := public._to_num(p_ministry->>p_subject);
  if v_val is not null then return v_val; end if;
  return case p_subject
    when 'Prosperity'   then public._to_num(p_stats->>'prosperity')
    when 'Welfare'      then public._to_num(p_stats->>'welfare')
    when 'Growth'       then public._nation_live_stat(p_nation, 'Growth')   -- derived (schema/221/222), not the raw mirror
    when 'Order'        then public._to_num(p_stats->>'order')
    when 'Rule of Law'  then public._to_num(p_stats->>'order')   -- consolidated onto stats.order (schema/150)
    when 'Global Image' then public._to_num(p_stats->>'image')
    when 'Image'        then public._to_num(p_stats->>'image')
    when 'Inflation'    then public._to_num(p_economy->>'inflation')
    when 'Unemployment' then public._to_num(p_economy->>'unemployment')
    when 'Budget'       then public._to_num(p_economy->>'budget')
    when 'Debt'         then public._to_num(p_economy->>'debt')
    -- Debt as a % of GDP — the meaningful, nation-size-independent measure (a flat $ debt threshold
    -- fires for every big nation and no small one). Null when GDP is unknown/zero.
    when 'Debt to GDP'  then (select case when coalesce(n.gdp, 0) > 0
                                          then round(public._to_num(p_economy->>'debt') / n.gdp * 100, 1) end
                                from public.nations n where n.id = p_nation)
    when 'Income'       then public._to_num(p_economy->>'income')
    when 'Regime'       then public._regime_reform(p_economy)   -- reform level 0..15 (schema/166)
    when 'Tax Burden'   then public._nation_tax_burden(p_nation)
    else null
  end;
end $$;
revoke all on function public._headline_subject_value(jsonb, jsonb, jsonb, jsonb, jsonb, text, text, text) from public, anon, authenticated;

notify pgrst, 'reload schema';
