-- ===========================================================================
-- 225 · Interest Rates — a derived central-bank policy rate (%).
--
-- "Interest Rates" is a declared derived stat (POLICY_STATS, but NON_MINISTRY — not admin-authored), so
-- it had no value and showed "--". Derive it like a real policy rate: a neutral base, moved by INFLATION
-- (the central bank's core lever), plus any explicit policy/card "Interest Rates" contributions, clamped
-- to a sane 0–25% band. ONE source: nation_stat_values('Interest Rates') → _nation_interest_rate, read
-- everywhere the stat renders (the Government Finance tile today).
--
--   rate% = clamp(0, 25, NEUTRAL + SLOPE·(inflation − TARGET) + Σ policy 'Interest Rates')
--
-- KNOBS (tune freely): NEUTRAL 3%, inflation TARGET 2%, SLOPE 0.5 (rate move per point of inflation off
-- target). Inflation is economy.inflation (schema/91). Also surfaces Inflation itself in nation_stat_values
-- (it was returning "--" — stored in economy.inflation but never resolved, like Public Debt). Depends on:
-- 217 (nation_stat_values), 47/152 (_nation_policy_stat, _to_num). Idempotent. Apply after 221.
-- ===========================================================================

set check_function_bodies = off;

create or replace function public._nation_interest_rate(p_nation text)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare v_infl numeric; v_pol numeric;
  v_neutral constant numeric := 3;    -- neutral policy rate (%)
  v_target  constant numeric := 2;    -- inflation target (%)
  v_slope   constant numeric := 0.5;  -- rate move per point of inflation above/below target
begin
  select coalesce(public._to_num(economy->>'inflation'), v_target) into v_infl from public.nations where id = p_nation;
  v_pol := coalesce(public._nation_policy_stat(p_nation, 'Interest Rates'), 0);
  return greatest(0, least(25, v_neutral + v_slope * (v_infl - v_target) + v_pol));
end $$;
revoke all on function public._nation_interest_rate(text) from public, anon, authenticated;

-- nation_stat_values gains an Interest Rates branch (a derived %, like Budget Balance / Tax Burden are
-- their own derived figures). Only change from schema/217 is that added branch.
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
    elsif s = 'Interest Rates' then
      v := public._nation_interest_rate(p_nation);
    elsif s = 'Inflation' then
      v := public._to_num(n.economy->>'inflation');   -- economy.inflation (like Public Debt → economy.debt); was showing "--"
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
