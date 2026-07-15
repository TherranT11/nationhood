-- ===========================================================================
-- 217 · Reform effects — standing stat effects, derived from the enacted reform level.
--
-- A reform is a named bundle of standing stat effects that apply WHILE it's enacted. A nation's total
-- reform effect on a stat = the sum over reforms 1..current level (for its regime type). Advancing adds
-- the next reform's effects; repealing removes the top one — automatically, because it's all derived
-- from economy.regime_reform, never stored. This is the same shape as policy effects (schema/152), and
-- it's folded into _nation_live_stat (schema/175) — the ONE source every screen reads via
-- nation_stat_values — so a reform's contribution shows wherever the stat renders.
--
-- Reforms are authored one at a time. So far: MONARCHY reform 1 · Great Charter (+8 Rule of Law,
-- +4 Civil Liberties). Every other reform returns no effect until we design it.
--
-- Depends on: 166 (_regime_type / _regime_reform), 175 (_nation_live_stat), 177 (nation_stat_values),
-- 47/152 (_nation_policy_stat, _nation_tax_burden, _to_num). Idempotent. Apply after 177.
-- ===========================================================================

set check_function_bodies = off;

-- The standing stat effects one reform (type, n) carries while enacted — a jsonb array of
-- {t: stat, v: signed}, mirroring a policy option's effects. Empty for reforms not yet given a
-- mechanic. ONE server source (a client mirror lives in reforms.js for the reform-track display).
create or replace function public._reform_effects(p_type text, p_n int)
returns jsonb language sql immutable set search_path = public as $$
  select case
    when p_type = 'monarchy' and p_n = 1
      then '[{"t":"Rule of Law","v":8},{"t":"Civil Liberties","v":4}]'::jsonb   -- Great Charter
    else '[]'::jsonb
  end;
$$;

-- The sum of every ENACTED reform's effect on p_stat: reforms 1..current level for the nation's type.
-- ONE source for the reform contribution to a stat; layered into _nation_live_stat below.
create or replace function public._regime_reform_stat(p_nation text, p_stat text)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare v_eco jsonb; v_type text; v_reform int; v_sum numeric := 0; i int; e jsonb;
begin
  select economy into v_eco from public.nations where id = p_nation;
  v_type := public._regime_type(v_eco);
  if v_type is null then return 0; end if;
  v_reform := public._regime_reform(v_eco);
  for i in 1 .. greatest(0, v_reform) loop
    for e in select value from jsonb_array_elements(public._reform_effects(v_type, i)) loop
      if e->>'t' = p_stat then v_sum := v_sum + coalesce((e->>'v')::numeric, 0); end if;
    end loop;
  end loop;
  return v_sum;
end $$;
revoke all on function public._regime_reform_stat(text, text) from public, anon, authenticated;

-- _nation_live_stat, now layering the reform contribution on top: base + policy + delta + reforms.
-- (Only change from schema/175 is the final + _regime_reform_stat term.)
create or replace function public._nation_live_stat(p_nation text, p_stat text)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare v_base numeric; v_delta numeric; v_leg text;
begin
  v_leg := case p_stat when 'Growth' then 'growth' when 'Prosperity' then 'prosperity' when 'Rule of Law' then 'order' end;
  select coalesce(public._to_num(ministry_stats->>p_stat),
                  case when v_leg is not null then public._to_num(stats->>v_leg) end, 0),
         coalesce(public._to_num(stat_deltas->>p_stat), 0)
    into v_base, v_delta
    from public.nations where id = p_nation;
  return coalesce(v_base, 0)
       + coalesce(public._nation_policy_stat(p_nation, p_stat), 0)
       + coalesce(v_delta, 0)
       + coalesce(public._regime_reform_stat(p_nation, p_stat), 0);
end $$;
revoke all on function public._nation_live_stat(text, text) from public, anon, authenticated;

-- nation_stat_values: also resolve a stat that has ONLY a reform contribution (no base/policy/delta),
-- so a reform-granted stat still shows instead of "--". (Only change from 177 is the added OR clause.)
create or replace function public.nation_stat_values(p_nation text, p_stats text[])
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_out jsonb := '{}'::jsonb; s text; v numeric; n public.nations%rowtype;
begin
  select * into n from public.nations where id = p_nation;
  if not found then return v_out; end if;
  foreach s in array coalesce(p_stats, array[]::text[]) loop
    if s = 'Budget Balance' then
      v := public._nation_budget_balance(p_nation);
    elsif s = 'Tax Burden' then
      v := public._nation_tax_burden(p_nation);
    elsif s = 'Public Debt' then
      v := public._to_num(n.economy->>'debt');
    elsif public._to_num(n.ministry_stats->>s) is not null
       or public._to_num(n.stat_deltas->>s) is not null
       or coalesce(public._nation_policy_stat(p_nation, s), 0) <> 0
       or coalesce(public._regime_reform_stat(p_nation, s), 0) <> 0
       or s in ('Growth', 'Prosperity', 'Rule of Law') then
      v := public._nation_live_stat(p_nation, s);
    else
      v := null;
    end if;
    if v is not null then v_out := jsonb_set(v_out, array[s], to_jsonb(round(v, 2))); end if;
  end loop;
  return v_out;
end $$;
grant execute on function public.nation_stat_values(text, text[]) to authenticated;

notify pgrst, 'reload schema';
