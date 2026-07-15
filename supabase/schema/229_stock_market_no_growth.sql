-- ===========================================================================
-- 229 · The stock market no longer changes Growth — it simply shows a number (its Price Rating).
--
-- DESIGN CHANGE: reverting schema/228 (and the earlier stock→Growth coupling). The stock market's job is
-- now purely to display its Price Rating (computed client-side from growth/prosperity/rule-of-law/
-- corruption, ladders.js). It contributes NOTHING to national Growth.
--
--   • _nation_live_stat: Growth is still base-less (no authored base), but its base is now simply 0 —
--     the _nation_stock_growth term is gone. Growth = policy effects + writable-stats delta + reform.
--     Every other stat + the floor-at-0 (schema/222) are unchanged.
--   • _apply_corp_tick: reverted to the schema/47 body (grow/fold firms only) — it no longer materializes
--     a per-exchange market index.
--   • Dropped as now-dead: _nation_stock_growth(text), _exchange_market_growth(uuid), and the
--     stock_exchanges.market_growth column. Their only consumer was Growth, which no longer reads them.
--
-- Founding/joining an exchange still works (found_stock_exchange, schema/221) — it just carries no Growth.
-- Depends on: 47 (_apply_corp_tick, _corp_growth, _business_climate, _corp_* helpers), 221/222
-- (_nation_live_stat), 214 (stock_exchanges), 228 (what this reverts). Idempotent. Apply after 228.
-- ===========================================================================

set check_function_bodies = off;

-- Growth loses its stock-market base term (base 0); the floor + all other stats stay exactly as schema/222.
create or replace function public._nation_live_stat(p_nation text, p_stat text)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare v_base numeric; v_delta numeric; v_leg text;
begin
  select coalesce(public._to_num(stat_deltas->>p_stat), 0) into v_delta from public.nations where id = p_nation;
  if p_stat = 'Growth' then
    v_base := 0;   -- derived, no authored base, and the stock market no longer contributes
  else
    v_leg := case p_stat when 'Prosperity' then 'prosperity' when 'Rule of Law' then 'order' end;
    select coalesce(public._to_num(ministry_stats->>p_stat),
                    case when v_leg is not null then public._to_num(stats->>v_leg) end, 0)
      into v_base from public.nations where id = p_nation;
  end if;
  return greatest(0,
         coalesce(v_base, 0)
       + coalesce(public._nation_policy_stat(p_nation, p_stat), 0)
       + coalesce(v_delta, 0)
       + coalesce(public._regime_reform_stat(p_nation, p_stat), 0));
end $$;
revoke all on function public._nation_live_stat(text, text) from public, anon, authenticated;

-- The corporations tick, reverted to the schema/47 body: grow/fold firms only, no market-index step.
create or replace function public._apply_corp_tick()
returns void language plpgsql security definer set search_path = public as $$
declare r record; v_clim numeric; v_growth numeric; v_newcash numeric;
begin
  drop table if exists _corp_clim;
  create temp table _corp_clim on commit drop as
    select id as nation_id, public._business_climate(id) as climate from public.nations;

  for r in select c.* from public.corporations c where c.status = 'queued' loop
    select climate into v_clim from _corp_clim where nation_id = r.nation_id;
    if coalesce(v_clim, 0) >= 0.5 then
      update public.corporations set status = 'placed', roll_m = null where id = r.id;
      perform public._corp_apply_bonus(r, 1);
      perform public._corp_started_event(r.nation_id, r.name, r.category);
    end if;
  end loop;

  for r in select c.* from public.corporations c where c.status = 'placed' loop
    select climate into v_clim from _corp_clim where nation_id = r.nation_id;
    v_growth  := public._corp_growth(r.drift, r.debt, coalesce(v_clim, 0), r.acumen);
    v_newcash := round(r.cash * (1 + v_growth / 100.0), 4);
    if r.type = 'pr' and v_newcash <= 0 then
      perform public._corp_event(r.nation_id,
        'Bad news from ' || coalesce((select name from public.nations where id = r.nation_id), r.nation_id)
        || ' as ' || r.name || ', a ' || r.category || ' titan, has ceased operations, liquidating its assets and defaulting on its debts.');
      perform public._corp_apply_bonus(r, -1);
      delete from public.corporations where id = r.id;
    else
      update public.corporations set cash = v_newcash where id = r.id;
    end if;
  end loop;
end $$;
revoke all on function public._apply_corp_tick() from public, anon, authenticated;

-- Drop the now-dead machinery (nothing reads it once Growth stops using it).
drop function if exists public._nation_stock_growth(text);
drop function if exists public._exchange_market_growth(uuid);
alter table public.stock_exchanges drop column if exists market_growth;

notify pgrst, 'reload schema';
