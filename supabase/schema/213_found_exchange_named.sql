-- ===========================================================================
-- 213 · Found a stock exchange — named, Rule-of-Law-gated, 2 AP, with the "opened" event.
--
-- Extends the Found action (211/212): it now takes a NAME + ticker ABBREVIATION (stored on
-- economy.stock_market so the market has an identity), gates on Rule of Law ≥ 60 (a listed market
-- needs functioning courts — the mock's founding requirement), costs 2 Action Points, and posts the
-- "opened" event. Still Finance-minister-gated, still +8 Growth, still the 1%-of-GDP upkeep (212).
--
-- Supersedes the no-arg found_stock_exchange() from 211/212 (dropped). Depends on: 40 (_begin_action /
-- _spend_action_point / events / current_game_date), 91 (_nation_stat_add), 114 (_party_holds_ministry),
-- 175 (_nation_live_stat), 10 (nations). Idempotent. Apply in the Supabase SQL Editor AFTER 212.
-- ===========================================================================

set check_function_bodies = off;

drop function if exists public.found_stock_exchange();   -- superseded: now takes a name + abbreviation

create or replace function public.found_stock_exchange(p_name text, p_abbr text)
returns void language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; v_nation text; v_active boolean; v_rol numeric;
        v_name text; v_abbr text; v_nname text;
begin
  v_name := btrim(coalesce(p_name, ''));
  v_abbr := upper(btrim(coalesce(p_abbr, '')));
  if v_name = '' then raise exception 'Name the stock exchange.'; end if;
  if v_abbr = '' then raise exception 'The exchange needs a ticker abbreviation.'; end if;

  v_p := public._begin_action(0);               -- lock caller's party + spend 1 Action Point
  perform public._spend_action_point(v_p.id);   -- + a second → founding costs 2 AP total (rolls back on any raise below)
  v_nation := v_p.nation_id;
  if not public._party_holds_ministry(v_p.id, 'Treasury') then
    raise exception 'Only the Minister of Finance can found a stock exchange.'; end if;

  -- Rule of Law gate: a listed market needs functioning courts to protect investors.
  v_rol := coalesce(public._nation_live_stat(v_nation, 'Rule of Law'), 0);
  if v_rol < 60 then
    raise exception 'Founding a stock exchange requires Rule of Law 60 — yours is %.', round(v_rol); end if;

  -- Founding is once per nation. FOR UPDATE serialises concurrent founders in the same nation.
  select coalesce((economy->'stock_market'->>'active')::boolean, false)
    into v_active from public.nations where id = v_nation for update;
  if v_active then raise exception 'Your nation already has a stock exchange.'; end if;

  -- Open the market with its identity, and grant the founding bonus: +8 Growth (clamped 1–100).
  update public.nations
     set economy = jsonb_set(coalesce(economy, '{}'::jsonb), '{stock_market}',
           jsonb_build_object('active', true, 'name', left(v_name, 60), 'abbr', left(v_abbr, 6)), true)
   where id = v_nation;
  perform public._nation_stat_add(v_nation, 'stats', 'growth', 8, 1, 100);

  select name into v_nname from public.nations where id = v_nation;
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_nation, v_p.id, 'party',
      'The nation of ' || coalesce(v_nname, v_nation) || ' has officially opened the ' || left(v_name, 60) ||
      ', officially listing as the ' || left(v_abbr, 6) || '.',
      public.current_game_date());
end $$;
revoke all on function public.found_stock_exchange(text, text) from public, anon, authenticated;
grant execute on function public.found_stock_exchange(text, text) to authenticated;

notify pgrst, 'reload schema';
