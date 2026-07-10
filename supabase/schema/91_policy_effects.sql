-- ===========================================================================
-- 91 · Policy effects engine.
-- Depends on: 10 (nations: stats/economy/production jsonb, population), 20
-- (parties.popularity/archetype), 60 (governments, status='active'),
-- 70 (_mod_cap_raise/_mod_floor_drop popularity clamps, _to_num safe parse), 90 (policies). Run after 90.
--
-- ONE place a policy option's effects are applied. _apply_policy_effect maps a
-- single authored effect {t,v,cad,dur,scale} onto the right field and clamps it;
-- _apply_policy_option_effects applies an option's effects of a given cadence.
-- Law enactment (schema/92) calls this with 'once'; the per-tick pass will reuse
-- the same core with 'tick' later — so the mapping/clamping lives in one spot.
--
-- Clamp ranges: stats 1..20; the regime is no longer an automated-effect target at all (the
-- reform level is owned by the reform bills, schema/167 — the 'Regime' branch is a retired
-- no-op); unemployment/inflation 0..100; budget & income unbounded (deficits
-- allowed); debt >= 0; production resources >= 0; party popularity 0..100
-- (through the modifier ceiling/floor). Government Confidence is retired (schema/168),
-- so an authored 'Government Confidence' target is now an accepted no-op.
-- ===========================================================================

-- Money scaling for Budget/Debt/Income — MUST mirror polMoney() in adminsetup's authoring
-- preview (one is the admin's worked-amount preview, this is the live application):
--   flat → v · perm → v×pop(millions) · pop → v×pop×(prosperity/10)
create or replace function public._policy_money(p_v numeric, p_scale text, p_pop numeric, p_pros numeric)
returns numeric language sql immutable as $$
  select case p_scale
           when 'perm' then p_v * p_pop
           when 'pop'  then p_v * p_pop * (p_pros / 50.0)
           else p_v
         end;
$$;

-- Add a delta to one key inside a nation's stats/economy/production jsonb and
-- clamp into [lo, hi] (null bound = unbounded on that side). The column name is
-- always one of our own literals, so the %I interpolation is safe.
create or replace function public._nation_stat_add(p_nation text, p_col text, p_key text,
  p_delta numeric, p_lo numeric, p_hi numeric)
returns void language plpgsql security definer set search_path = public as $$
declare v_raw text; v_old numeric; v_new numeric;
begin
  execute format('select (%I->>$1) from public.nations where id = $2', p_col)
    into v_raw using p_key, p_nation;
  -- Null (absent key, or no such nation) counts as 0 — a missing nation just makes
  -- the update below a no-op. A non-numeric legacy value (e.g. a text regime label
  -- on an un-migrated nation) is skipped rather than thrown on, so it can't abort
  -- the enclosing law/tick transaction.
  if v_raw is null then v_old := 0;
  elsif v_raw ~ '^-?[0-9]+(\.[0-9]+)?$' then v_old := v_raw::numeric;
  else return; end if;
  v_new := v_old + p_delta;
  if p_lo is not null then v_new := greatest(p_lo, v_new); end if;
  if p_hi is not null then v_new := least(p_hi, v_new); end if;
  execute format('update public.nations set %I = jsonb_set(coalesce(%I, ''{}''::jsonb), array[$1], to_jsonb($2::numeric), true) where id = $3', p_col, p_col)
    using p_key, v_new, p_nation;
end $$;

-- Budget is a STOCK that can never go below 0: any shortfall past zero rolls into Debt
-- (e.g. a −1 income against a $0 budget leaves budget at 0 and adds 1 to debt). ONE source
-- for that rule — every automatic budget drain (annual income, policy/crisis money effects,
-- admin events) routes through here so the floor + debt overflow apply identically.
-- Discretionary spends (settle/import) gate on affordability instead, so they don't pass here.
create or replace function public._nation_budget_add(p_nation text, p_delta numeric)
returns void language plpgsql security definer set search_path = public as $$
declare v_raw numeric;
begin
  select coalesce((economy->>'budget')::numeric, 0) + coalesce(p_delta, 0) into v_raw
    from public.nations where id = p_nation;
  if not found then return; end if;
  if v_raw >= 0 then
    update public.nations
       set economy = jsonb_set(coalesce(economy, '{}'::jsonb), '{budget}', to_jsonb(round(v_raw, 1)))
     where id = p_nation;
  else
    update public.nations
       set economy = jsonb_set(
             jsonb_set(coalesce(economy, '{}'::jsonb), '{budget}', to_jsonb(0::numeric)),
             '{debt}', to_jsonb(round(coalesce((economy->>'debt')::numeric, 0) + (-v_raw), 1)))
     where id = p_nation;
  end if;
end $$;
revoke all on function public._nation_budget_add(text, numeric) from public, anon, authenticated;

-- Move ONE party's popularity floor by p_delta — the single source for a floor change. A DROP
-- (delta < 0) drags standing popularity down with it by the same amount (never below the new floor
-- or 0); a RISE lifts popularity up to at least the new floor. The floor stays within [0, ceiling].
-- Read by the Popularity Floor effect below (per in-government party) and the mayoral prize / loss
-- (schema/110), so every party-floor change obeys one rule.
-- The popularity floor was retired, so a "floor grant" (a mayoral prize/loss in schema/110, a
-- Popularity Floor policy effect below) no longer confers a standing floor — it simply moves the
-- party's popularity by the delta, bounded to 0..100. Keeps those effects meaningful (a won city
-- still lifts popularity; a lost one still costs it) without a binding floor.
create or replace function public._pop_floor_add(p_party uuid, p_delta numeric)
returns void language plpgsql security definer set search_path = public as $$
begin
  if coalesce(p_delta, 0) = 0 then return; end if;
  update public.parties
     set popularity = public._clamp_pop(coalesce(popularity, 0) + p_delta)
   where id = p_party;
end $$;
revoke all on function public._pop_floor_add(uuid, numeric) from public, anon, authenticated;

-- Apply ONE authored effect to a nation. Unknown targets are ignored (forward-
-- compatible with the authoring tool's target list).
create or replace function public._apply_policy_effect(p_nation text, p_eff jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_t     text    := p_eff->>'t';
  v_v     numeric := coalesce((p_eff->>'v')::numeric, 0);
  v_scale text    := coalesce(p_eff->>'scale', 'flat');
  v_pop numeric; v_pros numeric; v_amt numeric; v_old numeric; v_new numeric; r record;
begin
  if v_t is null or v_v = 0 then return; end if;

  case v_t
    -- National stats (1..100)
    when 'Prosperity' then perform public._nation_stat_add(p_nation, 'stats', 'prosperity', v_v, 1, 100);
    when 'Welfare'    then perform public._nation_stat_add(p_nation, 'stats', 'welfare',    v_v, 1, 100);
    when 'Growth'     then perform public._nation_stat_add(p_nation, 'stats', 'growth',     v_v, 1, 100);
    when 'Order'      then perform public._nation_stat_add(p_nation, 'stats', 'order',      v_v, 1, 100);
    when 'Image'      then perform public._nation_stat_add(p_nation, 'stats', 'image',      v_v, 1, 100);
    -- Economy
    when 'Unemployment %' then perform public._nation_stat_add(p_nation, 'economy', 'unemployment', v_v, 0, 100);
    when 'Inflation %'    then perform public._nation_stat_add(p_nation, 'economy', 'inflation',    v_v, 0, 100);
    -- Tax Burden % is DERIVED (base economy.tax + each policy's in-force option contribution;
    -- see nationTaxBurden in policies.js, _option_axis_level in schema/92), so it is never
    -- mutated as a delta here. A legacy effect that still targets it is simply ignored.
    -- 'Regime' RETIRED as a policy effect — the reform level is moved only by the parliamentary
    -- reform bills (schema/167), so an authored 'Regime' effect is now ignored. Left as an
    -- explicit no-op (like Government Confidence / Popularity Ceiling above) so a legacy policy
    -- carrying it doesn't drift the reform level or fall through to the '<X> on hand' catch-all.
    when 'Regime' then
      null;
    when 'Budget', 'Debt', 'Income' then
      -- Money targets: scale the authored amount by nation size/wealth, then apply to the
      -- matching economy key. Budget can never go below 0 — a shortfall rolls into Debt
      -- (_nation_budget_add). Debt floors at 0; Income is a rate and stays unbounded.
      select population, (stats->>'prosperity')::numeric into v_pop, v_pros from public.nations where id = p_nation;
      v_amt := public._policy_money(v_v, v_scale, coalesce(v_pop, 0), coalesce(v_pros, 50));
      if v_t = 'Budget' then
        perform public._nation_budget_add(p_nation, v_amt);
      else
        perform public._nation_stat_add(p_nation, 'economy', lower(v_t), v_amt,
                                        case when v_t = 'Debt' then 0 else null end, null);
      end if;
    -- Resource production (>= 0)
    when 'Energy'    then perform public._nation_stat_add(p_nation, 'production', 'energy',    v_v, 0, null);
    when 'Food'      then perform public._nation_stat_add(p_nation, 'production', 'food',      v_v, 0, null);
    when 'Minerals'  then perform public._nation_stat_add(p_nation, 'production', 'minerals',  v_v, 0, null);
    when 'Goods'     then perform public._nation_stat_add(p_nation, 'production', 'goods',     v_v, 0, null);
    when 'Services'  then perform public._nation_stat_add(p_nation, 'production', 'services',  v_v, 0, null);
    when 'Diplomacy' then perform public._nation_stat_add(p_nation, 'production', 'diplomacy', v_v, 0, null);
    -- Government Confidence RETIRED — an authored 'Government Confidence' effect is now ignored
    -- (falls through to the no-op below); Coalition Health is the government gauge (schema/165).
    -- Party Popularity → every party currently IN GOVERNMENT (parties.in_government, set
    -- when the government forms, schema/60), through the canonical archetype ceiling/floor
    -- helpers (same path party actions use), then clamp 0..100. A policy is the government's
    -- own instrument, so its popularity swing lands on the governing parties, not the opposition.
    when 'Party Popularity' then
      for r in select id, archetype, popularity from public.parties where nation_id = p_nation and in_government loop
        v_old := r.popularity;
        if v_v >= 0 then v_new := public._mod_cap_raise(p_nation, r.archetype, v_old, v_old + v_v);
        else             v_new := public._mod_floor_drop(p_nation, r.archetype, v_old, v_old + v_v); end if;
        v_new := public._clamp_pop(v_new);
        update public.parties set popularity = v_new where id = r.id;
        -- Spread the move that actually landed across the party's regions, weighted by population,
        -- so a policy win shows a bigger jump in population centres than in small hexes. Zero-sum
        -- tilt (national already moved above), late-bound to _distribute_regional_popularity (163).
        perform public._distribute_regional_popularity(r.id, p_nation, v_new - v_old);
      end loop;
    -- Popularity Ceiling → RETIRED. Party popularity no longer has a reach ceiling (it floats freely
    -- in 0..100), so this effect no longer does anything. Left as an explicit no-op so an authored
    -- policy carrying it doesn't silently drift the inert pop_ceiling column.
    when 'Popularity Ceiling' then
      null;
    -- Popularity Floor → the support floor of every party currently IN GOVERNMENT (same scope).
    -- A DROP drags the standing popularity down with it by the SAME amount (the base that never
    -- abandons you shrank), never below the new floor / 0; a RISE lifts popularity up to at least
    -- the new floor. The floor itself stays within [0, that party's ceiling].
    when 'Popularity Floor' then
      for r in select id from public.parties where nation_id = p_nation and in_government loop
        perform public._pop_floor_add(r.id, v_v);   -- one floor rule (see _pop_floor_add)
      end loop;
    else
      -- "<Resource> on hand" → the spendable stockpile (Military / Energy / Food / Minerals /
      -- Services / Goods), floored at 0 by _nation_onhand_add (schema/99, late-bound). Distinct
      -- from the bare production targets above. Any other target is an unknown → ignored.
      if v_t like '%on hand' then
        perform public._nation_onhand_add(p_nation, lower(btrim(replace(v_t, 'on hand', ''))), v_v);
      end if;
  end case;
end $$;

-- Apply an option's effects of a given cadence ('once' on enactment, 'tick' every
-- month, 'year' every January — see _apply_policy_tick_effects). Reads the option array
-- straight from the stored policy definition. p_age is how many ticks the option has
-- been in force (current_tick − enactment tick), or null when there's no active clock;
-- it gates finite-duration tick effects. 'year' effects apply every January while the
-- option is in force (the dur window is a per-tick nicety only).
drop function if exists public._apply_policy_option_effects(text, uuid, int, text);
create or replace function public._apply_policy_option_effects(p_nation text, p_policy uuid, p_option int, p_cadence text, p_age int default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_def jsonb; v_opts jsonb; v_eff jsonb; v_dur numeric;
begin
  select definition into v_def from public.policies where id = p_policy;
  if v_def is null then return; end if;
  v_opts := public._policy_options(v_def);
  if v_opts is null or jsonb_typeof(v_opts) <> 'array'
     or p_option < 0 or p_option >= jsonb_array_length(v_opts) then return; end if;
  for v_eff in select value from jsonb_array_elements(coalesce(v_opts->p_option->'effects', '[]'::jsonb)) loop
    if coalesce(v_eff->>'cad', 'tick') <> p_cadence then continue; end if;
    -- A plain per-level stat effect (no explicit cadence) is a ONE-TIME rung-change shift, applied by
    -- _apply_law's transition walk (schema/92) — so the recurring sweep must NOT also drain it. Only
    -- money targets (standing per-year fiscal) and effects with an explicit cadence recur here.
    if p_cadence in ('tick', 'year') and (v_eff->>'cad') is null
       and (v_eff->>'t') not in ('Budget', 'Debt', 'Income') then continue; end if;
    -- Once-effects ignore duration. A per-tick effect applies every month while
    -- enacted (dur 0/blank — the authoring default); a finite one (dur > 0) applies
    -- only for its first dur months after an active enactment (p_age in 1..dur). A
    -- timed effect on a default/baseline option (no clock, p_age null) never fires.
    v_dur := coalesce((v_eff->>'dur')::numeric, 0);
    if p_cadence = 'tick' and v_dur > 0 and (p_age is null or p_age < 1 or p_age > v_dur) then continue; end if;
    perform public._apply_policy_effect(p_nation, v_eff);
  end loop;
end $$;

-- The monthly sweep (called once per tick by advance_tick, schema/60): every nation
-- applies the per-tick effects of whichever option is in force for each policy — its
-- stored override or the policy default (_nation_policy_option). Standing economics:
-- a policy that's in force keeps pushing its stats each month. 'Per year' effects ride
-- this same sweep but only land in January (tick 1 = Jan 1980, so (tick−1) mod 12 = 0).
-- p_tick is the current tick, used with nations.policy_since to age each enactment for
-- finite durations.
drop function if exists public._apply_policy_tick_effects();
create or replace function public._apply_policy_tick_effects(p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare r record; v_jan boolean := (p_tick - 1) % 12 = 0;
begin
  for r in
    select n.id as nation_id, p.id as policy_id,
           public._nation_policy_option(n.id, p.id) as opt,
           case when n.policy_since ? (p.id)::text
                then p_tick - (n.policy_since->>(p.id)::text)::int else null end as age
    from public.nations n
    cross join public.policies p
  loop
    perform public._apply_policy_option_effects(r.nation_id, r.policy_id, r.opt, 'tick', r.age);
    if v_jan then
      perform public._apply_policy_option_effects(r.nation_id, r.policy_id, r.opt, 'year', r.age);
    end if;
  end loop;
end $$;

notify pgrst, 'reload schema';
