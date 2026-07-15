-- ===========================================================================
-- 211 · Found a national stock exchange — the first slice of the Stock Market system.
--
-- A nation opens its own market by founding a stock exchange. This is the minimal FOUND action:
-- it flips the nation's market active (economy.stock_market.active = true — the flag the Stock
-- Market page + Government tile already read) and grants a one-time +8 Growth founding bonus. No
-- resource cost (the earlier 5-Diplomacy idea is dropped); like every player action it spends 1
-- Action Point via _begin_action. Founding is once — a nation that already has a market is refused,
-- which also makes a double-clicked button safe.
--
-- The Price Rating itself stays COMPUTED from live stats (ladders.js / nation_stat_values) — nothing
-- is stored here but the active flag. The +8 Growth also lifts that rating, since Growth is one of
-- its four levers.
--
-- DEFERRED (not built here — awaiting design confirmation): the multi-nation exchange the mock shows
-- — joining another nation's exchange (relations gate), a Rule-of-Law founding gate, %-of-GDP upkeep,
-- rating letters (AAA…UNRATED), listing fees, and inviting members. This slice is just "found → your
-- market goes live + a Growth kick."
--
-- Depends on: 40 (_begin_action / events / current_game_date), 91 (_nation_stat_add), 10 (nations),
-- 20 (parties). Idempotent. Apply in the Supabase SQL Editor.
-- ===========================================================================

set check_function_bodies = off;

create or replace function public.found_stock_exchange()
returns void language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; v_nation text; v_active boolean;
begin
  v_p := public._begin_action(0);   -- lock caller's party + spend 1 Action Point; no funds/Diplomacy cost
  v_nation := v_p.nation_id;

  -- Founding is once per nation. Lock the nation row FOR UPDATE so two DIFFERENT parties in the same
  -- nation can't both pass this check and each apply the +8 Growth (a cross-party double-found race —
  -- _begin_action only locks the caller's own party row, not the nation). The second founder waits
  -- here, then reads active = true and is refused. Also makes a double-fired button harmless.
  select coalesce((economy->'stock_market'->>'active')::boolean, false)
    into v_active from public.nations where id = v_nation for update;
  if v_active then raise exception 'Your nation already has a stock exchange.'; end if;

  -- Open the market (the active flag the client reads) and grant the founding bonus: +8 Growth,
  -- one-time, clamped 1–100 through the ONE stat mover so it lands where every surface reads Growth.
  update public.nations
     set economy = jsonb_set(coalesce(economy, '{}'::jsonb), '{stock_market}', '{"active": true}'::jsonb, true)
   where id = v_nation;
  perform public._nation_stat_add(v_nation, 'stats', 'growth', 8, 1, 100);

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_nation, v_p.id, 'party',
      (select name from public.parties where id = v_p.id) || ' founded a national stock exchange (+8 Growth).',
      public.current_game_date());
end $$;
revoke all on function public.found_stock_exchange() from public, anon, authenticated;
grant execute on function public.found_stock_exchange() to authenticated;

notify pgrst, 'reload schema';
