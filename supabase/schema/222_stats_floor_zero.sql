-- ===========================================================================
-- 222 · Stats can never go negative — floor every _nation_live_stat value at 0.
--
-- The ministry / regime / interior stats (Control, Crime, Poverty, Oppression, Revolt Risk, …) and the
-- consolidated ones (Growth, Prosperity, Rule of Law) are all computed by _nation_live_stat as
-- base + policy + delta + reform. That sum could go negative when policy/reform contributions outweigh
-- the base (e.g. Control −1, Crime −12, Poverty −9). Clamp the result at 0 so no stat ever displays or
-- is read as negative — the ONE computation source, so the floor applies everywhere at once (display,
-- gates, connectors, the stock Price Rating).
--
-- NOT affected (correctly): Budget Balance and Public Debt are signed money flows on their own paths
-- (_nation_budget_balance / economy.debt in nation_stat_values), never through _nation_live_stat — they
-- stay able to go negative.
--
-- Only change from schema/221 is wrapping the return in greatest(0, …). Depends on: 221
-- (_nation_live_stat, _nation_stock_growth), 47/152/217 (policy/reform terms). Idempotent. Apply after 221.
-- ===========================================================================

set check_function_bodies = off;

create or replace function public._nation_live_stat(p_nation text, p_stat text)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare v_base numeric; v_delta numeric; v_leg text;
begin
  select coalesce(public._to_num(stat_deltas->>p_stat), 0) into v_delta from public.nations where id = p_nation;
  if p_stat = 'Growth' then
    v_base := coalesce(public._nation_stock_growth(p_nation), 0);   -- fully derived: no authored base
  else
    v_leg := case p_stat when 'Prosperity' then 'prosperity' when 'Rule of Law' then 'order' end;
    select coalesce(public._to_num(ministry_stats->>p_stat),
                    case when v_leg is not null then public._to_num(stats->>v_leg) end, 0)
      into v_base from public.nations where id = p_nation;
  end if;
  -- Floor at 0: a stat can never be negative.
  return greatest(0,
         coalesce(v_base, 0)
       + coalesce(public._nation_policy_stat(p_nation, p_stat), 0)
       + coalesce(v_delta, 0)
       + coalesce(public._regime_reform_stat(p_nation, p_stat), 0));
end $$;
revoke all on function public._nation_live_stat(text, text) from public, anon, authenticated;

notify pgrst, 'reload schema';
