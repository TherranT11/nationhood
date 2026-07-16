-- ===========================================================================
-- 251 · HOTFIX: create the missing _nation_stock_growth function.
--
-- Diagnosis: production is missing _nation_stock_growth (migration 221 never
-- fully applied there). _nation_live_stat computes Growth via this function, and
-- nation_stat_values evaluates Growth near the top of its loop — so the missing
-- function made the whole RPC throw and EVERY stat blanked to "--". Reverting
-- _nation_live_stat couldn't help because every version of it (pre-FDI included)
-- calls _nation_stock_growth; the missing piece was underneath it.
--
-- This creates exactly that function (verbatim from schema/221). It reads only
-- nations.economy — no other dependency — so it cannot fail. Stats return the
-- moment it exists. The trailing SELECT shows a live sample so you can confirm.
--
-- Idempotent. Apply after 250.
-- ===========================================================================

set check_function_bodies = off;

create or replace function public._nation_stock_growth(p_nation text)
returns numeric language sql stable security definer set search_path = public as $$
  select case when (select economy->'stock_market'->>'role' from public.nations where id = p_nation) = 'host'
              then 8 else 0 end;
$$;
revoke all on function public._nation_stock_growth(text) from public, anon, authenticated;

notify pgrst, 'reload schema';

-- Confirmation — returns a row of real stat values if the fix worked.
select public.nation_stat_values(
  (select id from public.nations where not coalesce(dormant, false) limit 1),
  array['Growth','Crime','Budget Balance','Prosperity','Rule of Law']) as stats_sample;
