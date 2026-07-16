-- ===========================================================================
-- 250 · EMERGENCY: restore stats by reverting _nation_live_stat to its pre-FDI body.
--
-- Migration 249 redefined _nation_live_stat (the hot path EVERY stat reads through)
-- to add an FDI breadth term. If any FDI helper/table it now touches is missing or
-- partial, every stat read throws and the whole app shows "--".
--
-- This reverts _nation_live_stat to the EXACT schema/221 body, which predates all
-- FDI work and depends only on _nation_stock_growth / _nation_policy_stat /
-- _regime_reform_stat / _to_num — functions that were healthy long before FDI. It
-- therefore CANNOT fail on anything FDI-related. Displayed Growth temporarily loses
-- its FDI contribution; the deals/plants data is untouched and the FDI Growth +
-- breadth terms are re-layered cleanly once stats are confirmed healthy.
--
-- The trailing DO block prints STATS OK / STATS ERROR so you can see the result in
-- the SQL editor immediately. Idempotent. Apply after 249.
-- ===========================================================================

set check_function_bodies = off;

create or replace function public._nation_live_stat(p_nation text, p_stat text)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare v_base numeric; v_delta numeric; v_leg text;
begin
  select coalesce(public._to_num(stat_deltas->>p_stat), 0) into v_delta from public.nations where id = p_nation;
  if p_stat = 'Growth' then
    v_base := coalesce(public._nation_stock_growth(p_nation), 0);
  else
    v_leg := case p_stat when 'Prosperity' then 'prosperity' when 'Rule of Law' then 'order' end;
    select coalesce(public._to_num(ministry_stats->>p_stat),
                    case when v_leg is not null then public._to_num(stats->>v_leg) end, 0)
      into v_base from public.nations where id = p_nation;
  end if;
  return coalesce(v_base, 0)
       + coalesce(public._nation_policy_stat(p_nation, p_stat), 0)
       + coalesce(v_delta, 0)
       + coalesce(public._regime_reform_stat(p_nation, p_stat), 0);
end $$;
revoke all on function public._nation_live_stat(text, text) from public, anon, authenticated;

notify pgrst, 'reload schema';

-- Health check — printed right in the SQL editor.
do $$ declare v jsonb;
begin
  select public.nation_stat_values(id, array['Growth','Crime','Budget Balance','Prosperity','Rule of Law'])
    into v from public.nations where not coalesce(dormant, false) limit 1;
  raise notice 'STATS OK: %', v;
exception when others then
  raise notice 'STATS ERROR: %', sqlerrm;
end $$;
