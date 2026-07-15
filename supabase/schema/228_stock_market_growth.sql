-- ===========================================================================
-- 228 · Stock-market Growth now TRACKS its corporations' performance (pooled, can go negative).
--
-- Until now the stock market added a flat +8 Growth while a nation HOSTED an exchange (schema/221),
-- and members got nothing — a static number that never reflected how the listed firms actually did.
-- Now the exchange's Growth contribution IS its corporate performance:
--
--   • Each corporations tick (_apply_corp_tick, schema/47) already computes every firm's _corp_growth
--     (climate + drift + director Acumen − debt drag, ±9%). We aggregate it PER EXCHANGE — the
--     cash-weighted average firm growth across ALL the exchange's listed nations — and store it on a new
--     stock_exchanges.market_growth column. Bigger firms move the index more; a booming corporate sector
--     lifts it, a shrinking one drags it below zero.
--   • _nation_stock_growth(nation) now returns that stored value for the nation's exchange (host OR
--     member — POOLED: everyone listed shares the same market performance), 0 when unlisted. It can be
--     NEGATIVE, so a collapsing market actively subtracts from Growth (national Growth still floors at 0
--     overall via schema/222). The old flat +8 / founder-only reward is gone.
--
-- WHY MATERIALIZED (not live): national Growth → business climate → _corp_growth → this term → Growth is
-- a cycle; computed live it would recurse forever in SQL. Storing the index in the tick breaks the loop —
-- Growth reads last tick's stored performance (a deliberate one-tick lag, like a market pricing in last
-- period's earnings) and it's the SAME _corp_growth the firms' cash compounds by (one source).
--
-- Depends on: 47 (_apply_corp_tick, _corp_growth, _business_climate), 214 (stock_exchanges), 221
-- (_nation_stock_growth). Idempotent. Apply after 227.
-- ===========================================================================

set check_function_bodies = off;

-- The exchange's current corporate-performance index (cash-weighted avg firm growth of its listed
-- nations), refreshed every corp tick. Additive so existing exchanges pick it up on re-apply.
alter table public.stock_exchanges add column if not exists market_growth numeric not null default 0;

-- Growth from the stock market = the nation's exchange's stored market_growth (host or member alike —
-- pooled). 0 when the nation lists nowhere. May be negative (a failing market drags Growth down).
create or replace function public._nation_stock_growth(p_nation text)
returns numeric language sql stable security definer set search_path = public as $$
  select coalesce((
    select se.market_growth from public.stock_exchanges se
    where se.id::text = (select n.economy->'stock_market'->>'exchange_id'
                         from public.nations n where n.id = p_nation)
  ), 0);
$$;
revoke all on function public._nation_stock_growth(text) from public, anon, authenticated;

-- ONE source for an exchange's corporate-performance index: the cash-weighted average firm growth across
-- every one of its listed nations' placed firms (bigger firms move it more). No firms / all-zero cash →
-- the simple average; no firms at all → 0. The tick and the on-apply seed both call this, so the formula
-- lives in exactly one place. Safe from the Growth↔climate recursion: _nation_stock_growth reads the
-- STORED column, never this — this is only called to WRITE that column (tick + seed), never on a Growth read.
create or replace function public._exchange_market_growth(p_exchange uuid)
returns numeric language sql stable security definer set search_path = public as $$
  select coalesce((
    select round(coalesce(
        sum(public._corp_growth(c.drift, c.debt, public._business_climate(c.nation_id), c.acumen) * greatest(c.cash, 0))
          / nullif(sum(greatest(c.cash, 0)), 0),
        avg(public._corp_growth(c.drift, c.debt, public._business_climate(c.nation_id), c.acumen))
      ), 2)
    from public.corporations c
    join public.nations n on n.id = c.nation_id
    where c.status = 'placed'
      and (n.economy->'stock_market'->>'exchange_id') = p_exchange::text
  ), 0);
$$;
revoke all on function public._exchange_market_growth(uuid) from public, anon, authenticated;

-- The corporations tick — unchanged from schema/47 except the final step, which materializes each
-- exchange's market performance from its firms' current growth.
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
      perform public._corp_apply_bonus(r, 1);   -- r still carries size/category/nation_id
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

  -- Materialize each exchange's corporate performance (one source: _exchange_market_growth).
  -- _nation_stock_growth reads this stored value → national Growth tracks the market with no live
  -- recursion. Runs after the fold/growth loops so it reflects the surviving firms' current standing.
  update public.stock_exchanges se set market_growth = public._exchange_market_growth(se.id);
end $$;
revoke all on function public._apply_corp_tick() from public, anon, authenticated;

-- Seed the index now so the Growth term is live the moment this lands (don't wait a tick).
update public.stock_exchanges se set market_growth = public._exchange_market_growth(se.id);

notify pgrst, 'reload schema';
