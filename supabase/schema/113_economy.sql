-- ===========================================================================
-- 113 · Economy — the nation's annual demands, settled before each June.
-- Depends on: 10 (nations: population, stats/economy/on_hand/production jsonb),
-- 20 (parties), 40 (_lock_party, _begin_action, events, current_game_date),
-- 60 (governments, _advance_tick), 91 (_nation_stat_add). Run after 112.
--
-- Each year a nation owes four demands — Food, Goods, Services and Military upkeep.
-- The head of government SETTLES each one by spending the resource (or, for the
-- military, the nation's Budget) during the run-up to June. At the June tick the
-- accounts close (_resolve_economy_demands): a met Food demand grows the population
-- by 1M, and any UNMET demand drops its stat by 1 (Food→Order, Goods→Prosperity,
-- Services→Welfare, Military→the military stockpile). Stocks refill via the manual
-- Produce action (1 party action), which adds one production batch to on-hand.
--
-- ONE source of truth: the demand SIZES live in _economy_need and the settling
-- WINDOW in _economy_period; util.js mirrors both only to render the page.
-- ===========================================================================

-- Per-nation settle flags for the current settling window: {year, food, goods,
-- services, military}. `year` is the year of the NEXT June deadline (see
-- _economy_period), so a stale/absent stamp reads as "nothing settled yet".
alter table public.nations add column if not exists demands jsonb not null default '{}'::jsonb;

-- The size of a single demand for a nation, derived live from its current state.
-- Food/Goods/Services are resource UNITS spent from on-hand; Military is the upkeep
-- COST in Budget ($1B per unit of the Military stockpile). ONE source; mirrored by
-- economyNeed() in util.js for the page only.
create or replace function public._economy_need(p_nation text, p_resource text)
returns numeric language sql stable security definer set search_path = public as $$
  select case p_resource
    when 'food'     then greatest(1, ceil(coalesce(n.population, 0) / 50.0))
    when 'goods'    then ceil(coalesce((n.stats->>'prosperity')::numeric, 0) / 10.0)
    when 'services' then ceil(coalesce((n.stats->>'welfare')::numeric, 0) / 10.0)
    when 'military' then coalesce((n.on_hand->>'military')::numeric, 0)
    else 0 end
  from public.nations n where n.id = p_nation;
$$;
revoke all on function public._economy_need(text, text) from public, anon, authenticated;
grant execute on function public._economy_need(text, text) to authenticated;

-- The year whose June the current tick is settling toward. Jul–Dec settle next
-- year's June; Jan–Jun settle this year's. At the June tick itself (month 6) this
-- equals the calendar year being resolved, so settling and resolution agree on the
-- window. MIRRORS economyPeriod() in util.js.
create or replace function public._economy_period(p_tick int)
returns int language sql immutable as $$
  select (1980 + (p_tick - 1) / 12) + (case when ((p_tick - 1) % 12) + 1 > 6 then 1 else 0 end);
$$;

-- Settle one demand. Only the head of government (formateur of the nation's active
-- government) may act — same gate as crisis_act / agenda_enact. Spends the resource
-- from on-hand (Food/Goods/Services) or the Budget (Military upkeep); a shortfall
-- blocks cleanly with nothing deducted. Idempotent per year: re-settling raises.
create or replace function public.economy_settle(p_resource text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_p public.parties%rowtype; v_gov public.governments%rowtype; v_n public.nations%rowtype;
  v_tick int; v_period int; v_d jsonb; v_need numeric; v_have numeric;
begin
  if p_resource not in ('food', 'goods', 'services', 'military') then
    raise exception 'Unknown demand.'; end if;
  v_p := public._lock_party();   -- caller's party, locked (no action cost to settle)
  select * into v_gov from public.governments where nation_id = v_p.nation_id and status = 'active';
  if not found then raise exception 'There is no sitting government.'; end if;
  if v_gov.formateur_party_id is distinct from v_p.id then
    raise exception 'Only the head of government can manage the economy.'; end if;

  select * into v_n from public.nations where id = v_p.nation_id;
  select current_tick into v_tick from public.game_state where id;
  v_period := public._economy_period(v_tick);

  -- Fresh flags if this window hasn't been opened yet (absent or stale year stamp).
  v_d := v_n.demands;
  if v_d is null or (v_d->>'year') is null or (v_d->>'year')::int is distinct from v_period then
    v_d := jsonb_build_object('year', v_period, 'food', false, 'goods', false, 'services', false, 'military', false);
  end if;
  if coalesce((v_d->>p_resource)::boolean, false) then
    raise exception 'That demand is already settled this year.'; end if;

  v_need := public._economy_need(v_p.nation_id, p_resource);
  if p_resource = 'military' then
    v_have := coalesce((v_n.economy->>'budget')::numeric, 0);
    if v_have < v_need then
      raise exception 'Treasury too low to maintain the military (need %, have %).', v_need, v_have; end if;
    perform public._nation_stat_add(v_p.nation_id, 'economy', 'budget', -v_need, 0, null);
  else
    v_have := coalesce((v_n.on_hand->>p_resource)::numeric, 0);
    if v_have < v_need then
      raise exception 'Not enough % on hand (need %, have %).', initcap(p_resource), v_need, v_have; end if;
    perform public._nation_stat_add(v_p.nation_id, 'on_hand', p_resource, -v_need, 0, null);
  end if;

  v_d := jsonb_set(v_d, array[p_resource], 'true'::jsonb);
  update public.nations set demands = v_d where id = v_p.nation_id;

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_p.nation_id, v_p.id, 'economy',
            'The government settled the nation''s ' || p_resource || ' demand for ' || v_period || '.',
            public.current_game_date());

  return jsonb_build_object('resource', p_resource, 'need', v_need, 'demands', v_d);
end $$;
grant execute on function public.economy_settle(text) to authenticated;

-- Produce: the head of government runs a production cycle — adds one batch of the
-- nation's production to its on-hand stockpiles. Costs 5 party actions and is on a
-- 12-tick cooldown (one cycle a year), so stocks refill in deliberate bursts. Mirror
-- the 5 / 12 in util.js (PRODUCE_COST / PRODUCE_COOLDOWN) when rendering the buttons.
alter table public.nations add column if not exists produce_until_tick int;

create or replace function public.economy_produce()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; v_gov public.governments%rowtype; v_n public.nations%rowtype; v_tick int; v_prod jsonb; v_add jsonb;
begin
  v_p := public._begin_action(0);   -- lock caller's party + spend 1 Action Point
  select * into v_gov from public.governments where nation_id = v_p.nation_id and status = 'active';
  if not found then raise exception 'There is no sitting government.'; end if;
  if v_gov.formateur_party_id is distinct from v_p.id then
    raise exception 'Only the head of government can run production.'; end if;

  select * into v_n from public.nations where id = v_p.nation_id;
  select current_tick into v_tick from public.game_state where id;
  if v_n.produce_until_tick is not null and v_tick < v_n.produce_until_tick then
    raise exception 'Production is on cooldown — % tick(s) left.', (v_n.produce_until_tick - v_tick); end if;
  v_prod := coalesce(v_n.production, '{}'::jsonb);
  -- Each produced resource tops up its own on-hand stockpile; any other on-hand keys are preserved
  -- by the merge. Diplomacy stockpiles like the rest — produced, banked, and spent (e.g. bidding).
  -- A modifier's Rate Multiplier (schema/70) scales the produced amount before it banks.
  v_add := jsonb_build_object(
    'energy',    coalesce((v_n.on_hand->>'energy')::numeric, 0)    + round(coalesce((v_prod->>'energy')::numeric, 0)    * public._mod_rate_multiplier(v_n.id, 'energy')),
    'food',      coalesce((v_n.on_hand->>'food')::numeric, 0)      + round(coalesce((v_prod->>'food')::numeric, 0)      * public._mod_rate_multiplier(v_n.id, 'food')),
    'minerals',  coalesce((v_n.on_hand->>'minerals')::numeric, 0)  + round(coalesce((v_prod->>'minerals')::numeric, 0)  * public._mod_rate_multiplier(v_n.id, 'minerals')),
    'goods',     coalesce((v_n.on_hand->>'goods')::numeric, 0)     + round(coalesce((v_prod->>'goods')::numeric, 0)     * public._mod_rate_multiplier(v_n.id, 'goods')),
    'services',  coalesce((v_n.on_hand->>'services')::numeric, 0)  + round(coalesce((v_prod->>'services')::numeric, 0)  * public._mod_rate_multiplier(v_n.id, 'services')),
    'military',  coalesce((v_n.on_hand->>'military')::numeric, 0)  + round(coalesce((v_prod->>'military')::numeric, 0)  * public._mod_rate_multiplier(v_n.id, 'military')),
    'diplomacy', coalesce((v_n.on_hand->>'diplomacy')::numeric, 0) + round(coalesce((v_prod->>'diplomacy')::numeric, 0) * public._mod_rate_multiplier(v_n.id, 'diplomacy'))
  );
  update public.nations set on_hand = coalesce(on_hand, '{}'::jsonb) || v_add, produce_until_tick = v_tick + 12 where id = v_p.nation_id;

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_p.nation_id, v_p.id, 'economy',
            'The government ran a production cycle — the national stockpiles were topped up.',
            public.current_game_date());

  return jsonb_build_object('on_hand', v_add, 'actions', v_p.influence, 'until', v_tick + 12);
end $$;
grant execute on function public.economy_produce() to authenticated;

-- Close the annual accounts at the June tick (month 6). For every non-dormant nation,
-- read the flags settled for THIS year; a met Food demand grows population +1M, and
-- each unmet demand drops its stat by 1. Then reset the flags for next June. Called
-- from _advance_tick (schema/60); self-filters to June so it's safe to call each tick.
create or replace function public._resolve_economy_demands(p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare v_n record; v_year int; v_d jsonb; v_food boolean; v_goods boolean; v_serv boolean; v_mil boolean; v_msg text; v_unmet int; v_conf int;
begin
  if ((p_tick - 1) % 12) + 1 <> 6 then return; end if;   -- June only
  v_year := 1980 + (p_tick - 1) / 12;
  for v_n in select id, demands, coalesce((stats->>'growth')::numeric, 0) as growth from public.nations where not coalesce(dormant, false) loop
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

-- Per-nation production-rate ceilings (nations.production_ceiling, schema/10): clamp each nation's
-- energy/food/minerals production to at most its authored ceiling. Only rows actually OVER the
-- ceiling are touched (so it writes nothing for the common in-bounds case and never invents a
-- resource key). Runs each tick right after the modifier bounds (schema/60), so it's a final word
-- on output alongside a modifier's resource_ceiling — the tighter cap wins. _to_num guards a
-- non-numeric value from aborting the tick.
create or replace function public._apply_production_ceilings()
returns void language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in
    select n.id, v.res, public._to_num(n.production_ceiling->>v.res) as ceil
      from public.nations n
      cross join lateral (values ('energy'), ('food'), ('minerals')) as v(res)
     where public._to_num(n.production_ceiling->>v.res) is not null
       and public._to_num(n.production->>v.res) > public._to_num(n.production_ceiling->>v.res)
  loop
    perform public._nation_stat_add(r.id, 'production', r.res, 0, null, r.ceil);
  end loop;
end $$;
revoke all on function public._apply_production_ceilings() from public, anon, authenticated;

notify pgrst, 'reload schema';
