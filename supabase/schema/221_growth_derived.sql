-- ===========================================================================
-- 221 · Growth is fully DERIVED — no authored base. + stock exchange founding → World Timeline.
--
-- Growth no longer carries an authored base (ministry_stats.Growth / stats.growth). It is the sum of
-- its live contributors only: policies + stock market + reforms + writable-stats deltas. So the number
-- a player sees equals the sum of the rows on the Growth page — no hidden base.
--
--   • _nation_stock_growth(nation): the stock-market contribution — a flat +8 Growth while the nation
--     HOSTS an exchange (0 otherwise). This REPLACES the old approach of baking +8 into the base
--     (schema/214/219), so there is nothing to keep in sync and nothing to shadow.
--   • _nation_live_stat: for 'Growth', base := _nation_stock_growth (no ministry/mirror term); every
--     OTHER stat keeps its ministry_stats / mirror base exactly as before. policy + delta + reform
--     terms are unchanged. Any value still sitting in ministry_stats.Growth / stats.growth is now
--     simply ignored for Growth.
--   • found_stock_exchange: stop baking the +8 (hosting now derives it), and post the founding event
--     as kind 'declaration' so it shows in the global World Timeline (kind 'party' was filtered out).
--
-- KNOWN FOLLOW-UP (flagged, NOT done here): the raw-mirror readers that still read stats.growth
-- directly — business climate (schema/113), crises (99), national malaise (125), headline thresholds
-- (158) — are not yet rewired to _nation_live_stat('Growth'). Until they are, those systems still see
-- the old mirror value, not the derived one. The stock Price Rating already reads the derived value
-- (it feeds off nation_stat_values), so it is consistent.
--
-- Depends on: 217 (_nation_live_stat, _regime_reform_stat), 219/214 (found_stock_exchange,
-- stock_exchanges), 47/152 (_nation_policy_stat), 40 (events). Idempotent. Apply after 219.
-- ===========================================================================

set check_function_bodies = off;

-- The stock market's contribution to Growth: +8 while the nation HOSTS an exchange, else 0.
-- (Members list on someone else's exchange and get no Growth — only the founder/host does.)
create or replace function public._nation_stock_growth(p_nation text)
returns numeric language sql stable security definer set search_path = public as $$
  select case when (select economy->'stock_market'->>'role' from public.nations where id = p_nation) = 'host'
              then 8 else 0 end;
$$;
revoke all on function public._nation_stock_growth(text) from public, anon, authenticated;

-- Growth is base-less: its "base" is purely the stock-market term. Every other stat keeps its
-- ministry_stats / mirror base. policy + delta + reform layers are identical to schema/217.
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
  return coalesce(v_base, 0)
       + coalesce(public._nation_policy_stat(p_nation, p_stat), 0)
       + coalesce(v_delta, 0)
       + coalesce(public._regime_reform_stat(p_nation, p_stat), 0);
end $$;
revoke all on function public._nation_live_stat(text, text) from public, anon, authenticated;

-- FOUND — no longer bakes +8 Growth (hosting derives it via _nation_stock_growth), and posts the
-- opening as kind 'declaration' so it reaches the World Timeline.
create or replace function public.found_stock_exchange(p_name text, p_abbr text)
returns void language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; v_nation text; v_rol numeric; v_name text; v_abbr text; v_nname text;
        v_ex uuid; v_tick int; v_listed boolean;
begin
  v_name := btrim(coalesce(p_name, '')); v_abbr := upper(btrim(coalesce(p_abbr, '')));
  if v_name = '' then raise exception 'Name the stock exchange.'; end if;
  if v_abbr = '' then raise exception 'The exchange needs a ticker abbreviation.'; end if;

  v_p := public._begin_action(0); perform public._spend_action_point(v_p.id);   -- 2 AP total
  v_nation := v_p.nation_id;
  if not public._party_holds_ministry(v_p.id, 'Treasury') then
    raise exception 'Only the Minister of Finance can found a stock exchange.'; end if;
  v_rol := coalesce(public._nation_live_stat(v_nation, 'Rule of Law'), 0);
  if v_rol < 60 then raise exception 'Founding a stock exchange requires Rule of Law 60 — yours is %.', round(v_rol); end if;

  select (economy->'stock_market'->>'exchange_id') is not null into v_listed
    from public.nations where id = v_nation for update;
  if coalesce(v_listed, false) then raise exception 'Your nation already lists on a stock exchange.'; end if;

  select current_tick into v_tick from public.game_state where id;
  insert into public.stock_exchanges (host_nation, name, abbr, founded_tick)
    values (v_nation, left(v_name, 60), left(v_abbr, 6), v_tick) returning id into v_ex;
  update public.nations set economy = jsonb_set(coalesce(economy, '{}'::jsonb), '{stock_market}',
    jsonb_build_object('exchange_id', v_ex, 'role', 'host'), true) where id = v_nation;
  -- (+8 Growth is now DERIVED from hosting — see _nation_stock_growth — so nothing is baked here.)

  select name into v_nname from public.nations where id = v_nation;
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_nation, v_p.id, 'declaration',
      'The nation of ' || coalesce(v_nname, v_nation) || ' has officially opened the ' || left(v_name, 60) ||
      ', officially listing as the ' || left(v_abbr, 6) || '.', public.current_game_date());
end $$;
revoke all on function public.found_stock_exchange(text, text) from public, anon, authenticated;
grant execute on function public.found_stock_exchange(text, text) to authenticated;

notify pgrst, 'reload schema';
