-- ===========================================================================
-- 219 · Founding a stock exchange: make the +8 Growth actually SHOW.
--
-- Bug: found_stock_exchange (schema/214) granted +8 Growth via _nation_stat_add(..,'stats','growth',..),
-- which writes ONLY the mirror stats.growth. But the Government / Growth pages read Growth through
-- nation_stat_values → _nation_live_stat (schema/175), whose base is coalesce(ministry_stats.Growth,
-- stats.growth). On any nation that carries an authored ministry_stats.Growth key (every set-up nation),
-- ministry_stats wins and the +8 sitting in stats.growth is shadowed — felt by the business climate /
-- crises (which read stats.growth) but invisible on the display. schema/160 only synced the two ONCE;
-- after that the admin save is the only thing that keeps them together.
--
-- Fix: on founding, keep BOTH halves of Growth in sync — bump stats.growth (as before) AND resync the
-- display base ministry_stats.Growth to it, but only when that key already exists (a nation without it
-- correctly falls back to stats.growth on the display, so leave it alone). Then a one-time retroactive
-- resync for every current host, so an exchange founded before this fix shows the +8 it already earned.
--
-- Depends on: 214 (found_stock_exchange, stock_exchanges), 91 (_nation_stat_add), 70 (_to_num),
-- 175/177 (_nation_live_stat, nation_stat_values). Idempotent. Apply AFTER 214.
-- ===========================================================================

set check_function_bodies = off;

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

  -- +8 Growth, kept in sync across BOTH halves of the stat so it is felt AND shown:
  --   • stats.growth          — the mirror the business climate / crises / malaise read.
  --   • ministry_stats.Growth — the display base the Government / Growth pages read FIRST
  --     (_nation_live_stat, schema/175). Resync it to the mirror, but only when it already carries a
  --     Growth key (else the display correctly falls back to stats.growth on its own).
  perform public._nation_stat_add(v_nation, 'stats', 'growth', 8, 1, 100);
  update public.nations
     set ministry_stats = jsonb_set(ministry_stats, '{Growth}', to_jsonb(public._to_num(stats->>'growth')))
   where id = v_nation and ministry_stats ? 'Growth';

  select name into v_nname from public.nations where id = v_nation;
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_nation, v_p.id, 'party',
      'The nation of ' || coalesce(v_nname, v_nation) || ' has officially opened the ' || left(v_name, 60) ||
      ', officially listing as the ' || left(v_abbr, 6) || '.', public.current_game_date());
end $$;
revoke all on function public.found_stock_exchange(text, text) from public, anon, authenticated;
grant execute on function public.found_stock_exchange(text, text) to authenticated;

-- Retroactive: a host that founded before this fix has the +8 in stats.growth but a stale (lower)
-- ministry_stats.Growth on the display. Resync every current host's display base to its live mirror.
update public.nations n
   set ministry_stats = jsonb_set(n.ministry_stats, '{Growth}', to_jsonb(public._to_num(n.stats->>'growth')))
  from public.stock_exchanges se
 where se.host_nation = n.id
   and n.ministry_stats ? 'Growth'
   and public._to_num(n.ministry_stats->>'Growth') is distinct from public._to_num(n.stats->>'growth');

notify pgrst, 'reload schema';
