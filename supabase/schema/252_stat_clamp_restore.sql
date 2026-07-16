-- ===========================================================================
-- 252 · Restore the stat clamp and remove the resurrected dead function.
--
-- Lineage bug: migration 229 dropped _nation_stock_growth and set Growth's base
-- to 0 (stock market stopped feeding Growth), keeping the greatest(0,…) floor
-- from 222. But FDI migration 243 rebuilt _nation_live_stat from the OLD 221 body
-- — which calls _nation_stock_growth and has NO floor. So since 243 the floor was
-- gone (negatives possible) and the function called a dropped helper (the outage).
-- Hotfix 251 papered over it by recreating the dead helper (wrongly re-adding +8
-- Growth for stock hosts).
--
-- This restores the CORRECT body (from 229): Growth base 0, no _nation_stock_growth,
-- and clamps every _nation_live_stat value to [0, 100] — floor restored (222) plus a
-- ceiling so no qualitative stat exceeds 100. Budget Balance / Public Debt / Interest
-- Rates / Inflation are unaffected: they never flow through _nation_live_stat (they
-- have their own signed/percent paths in nation_stat_values). The FDI Growth term is
-- intentionally NOT re-added here — it is layered back once the production migration
-- set is confirmed whole (avoiding another missing-dependency throw).
--
-- Idempotent. Apply after 251.
-- ===========================================================================

set check_function_bodies = off;

create or replace function public._nation_live_stat(p_nation text, p_stat text)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare v_base numeric; v_delta numeric; v_leg text;
begin
  select coalesce(public._to_num(stat_deltas->>p_stat), 0) into v_delta from public.nations where id = p_nation;
  if p_stat = 'Growth' then
    v_base := 0;   -- derived, no authored base (schema/229: stock market no longer contributes)
  else
    v_leg := case p_stat when 'Prosperity' then 'prosperity' when 'Rule of Law' then 'order' end;
    select coalesce(public._to_num(ministry_stats->>p_stat),
                    case when v_leg is not null then public._to_num(stats->>v_leg) end, 0)
      into v_base from public.nations where id = p_nation;
  end if;
  -- Clamp to [0, 100]: a qualitative stat can never be negative (222) nor exceed 100.
  return greatest(0, least(100,
         coalesce(v_base, 0)
       + coalesce(public._nation_policy_stat(p_nation, p_stat), 0)
       + coalesce(v_delta, 0)
       + coalesce(public._regime_reform_stat(p_nation, p_stat), 0)));
end $$;
revoke all on function public._nation_live_stat(text, text) from public, anon, authenticated;

-- _nation_stock_growth is dead again (229 dropped it; 251 wrongly resurrected it). Nothing calls it now.
drop function if exists public._nation_stock_growth(text);

notify pgrst, 'reload schema';

-- Confirmation — every value should sit in [0, 100].
select public.nation_stat_values(
  (select id from public.nations where not coalesce(dormant, false) limit 1),
  array['Growth','Crime','Prosperity','Rule of Law','Social Integration','Poverty']) as stats_sample;
