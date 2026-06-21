-- ===========================================================================
-- 91 · Policy effects engine.
-- Depends on: 10 (nations: stats/economy/production jsonb, population), 20
-- (parties.popularity/archetype), 60 (governments.confidence, status='active'),
-- 70 (_mod_cap_raise/_mod_floor_drop popularity clamps), 90 (policies). Run after 90.
--
-- ONE place a policy option's effects are applied. _apply_policy_effect maps a
-- single authored effect {t,v,cad,dur,scale} onto the right field and clamps it;
-- _apply_policy_option_effects applies an option's effects of a given cadence.
-- Law enactment (schema/92) calls this with 'once'; the per-tick pass will reuse
-- the same core with 'tick' later — so the mapping/clamping lives in one spot.
--
-- Clamp ranges: stats & regime 1..20; unemployment/inflation 0..100; budget
-- unbounded (deficits allowed); debt >= 0; production resources >= 0; government
-- confidence 0..100; party popularity 0..100 (through the modifier ceiling/floor).
-- ===========================================================================

-- Money scaling for Budget/Debt — MUST mirror polMoney() in adminsetup's authoring
-- preview (one is the admin's worked-amount preview, this is the live application):
--   flat → v · perm → v×pop(millions) · pop → v×pop×(prosperity/10)
create or replace function public._policy_money(p_v numeric, p_scale text, p_pop numeric, p_pros numeric)
returns numeric language sql immutable as $$
  select case p_scale
           when 'perm' then p_v * p_pop
           when 'pop'  then p_v * p_pop * (p_pros / 10.0)
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
    -- National stats (1..20)
    when 'Prosperity' then perform public._nation_stat_add(p_nation, 'stats', 'prosperity', v_v, 1, 20);
    when 'Welfare'    then perform public._nation_stat_add(p_nation, 'stats', 'welfare',    v_v, 1, 20);
    when 'Growth'     then perform public._nation_stat_add(p_nation, 'stats', 'growth',     v_v, 1, 20);
    when 'Order'      then perform public._nation_stat_add(p_nation, 'stats', 'order',      v_v, 1, 20);
    when 'Image'      then perform public._nation_stat_add(p_nation, 'stats', 'image',      v_v, 1, 20);
    -- Economy
    when 'Unemployment %' then perform public._nation_stat_add(p_nation, 'economy', 'unemployment', v_v, 0, 100);
    when 'Inflation %'    then perform public._nation_stat_add(p_nation, 'economy', 'inflation',    v_v, 0, 100);
    when 'Regime'         then perform public._nation_stat_add(p_nation, 'economy', 'regime',       v_v, 1, 20);
    when 'Budget' then
      select population, (stats->>'prosperity')::numeric into v_pop, v_pros from public.nations where id = p_nation;
      v_amt := public._policy_money(v_v, v_scale, coalesce(v_pop, 0), coalesce(v_pros, 10));
      perform public._nation_stat_add(p_nation, 'economy', 'budget', v_amt, null, null);
    when 'Debt' then
      select population, (stats->>'prosperity')::numeric into v_pop, v_pros from public.nations where id = p_nation;
      v_amt := public._policy_money(v_v, v_scale, coalesce(v_pop, 0), coalesce(v_pros, 10));
      perform public._nation_stat_add(p_nation, 'economy', 'debt', v_amt, 0, null);
    -- Resource production (>= 0)
    when 'Energy'    then perform public._nation_stat_add(p_nation, 'production', 'energy',    v_v, 0, null);
    when 'Food'      then perform public._nation_stat_add(p_nation, 'production', 'food',      v_v, 0, null);
    when 'Minerals'  then perform public._nation_stat_add(p_nation, 'production', 'minerals',  v_v, 0, null);
    when 'Goods'     then perform public._nation_stat_add(p_nation, 'production', 'goods',     v_v, 0, null);
    when 'Services'  then perform public._nation_stat_add(p_nation, 'production', 'services',  v_v, 0, null);
    when 'Diplomacy' then perform public._nation_stat_add(p_nation, 'production', 'diplomacy', v_v, 0, null);
    -- Government Confidence → the active government row (0..100)
    when 'Government Confidence' then
      update public.governments
         set confidence = greatest(0, least(100, confidence + v_v))
       where nation_id = p_nation and status = 'active';
    -- Party Popularity → every party in the nation, through the canonical archetype
    -- ceiling/floor helpers (same path party actions use), then clamp 0..100.
    when 'Party Popularity' then
      for r in select id, archetype, popularity from public.parties where nation_id = p_nation loop
        v_old := r.popularity;
        if v_v >= 0 then v_new := public._mod_cap_raise(p_nation, r.archetype, v_old, v_old + v_v);
        else             v_new := public._mod_floor_drop(p_nation, r.archetype, v_old, v_old + v_v); end if;
        update public.parties set popularity = greatest(0, least(100, v_new)) where id = r.id;
      end loop;
    else
      null;  -- unknown target
  end case;
end $$;

-- Apply an option's effects of a given cadence ('once' on enactment, 'tick' per
-- month). Reads the option array straight from the stored policy definition.
create or replace function public._apply_policy_option_effects(p_nation text, p_policy uuid, p_option int, p_cadence text)
returns void language plpgsql security definer set search_path = public as $$
declare v_def jsonb; v_opts jsonb; v_eff jsonb;
begin
  select definition into v_def from public.policies where id = p_policy;
  if v_def is null then return; end if;
  v_opts := public._policy_options(v_def);
  if v_opts is null or jsonb_typeof(v_opts) <> 'array'
     or p_option < 0 or p_option >= jsonb_array_length(v_opts) then return; end if;
  for v_eff in select value from jsonb_array_elements(coalesce(v_opts->p_option->'effects', '[]'::jsonb)) loop
    if coalesce(v_eff->>'cad', 'tick') = p_cadence then
      perform public._apply_policy_effect(p_nation, v_eff);
    end if;
  end loop;
end $$;

notify pgrst, 'reload schema';
