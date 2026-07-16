-- ===========================================================================
-- 240 · Remap the June demand-shortfall penalties onto current, displayed stats.
--
-- The annual accounts (_resolve_economy_demands, live body schema/223) docked LEGACY stats when a
-- consumption demand went unmet: Food → stats.order (shown now as "Rule of Law", but chip-labeled the
-- stale "Order"), Services → stats.welfare (Welfare is no longer a displayed stat — the drop was
-- invisible). Remap to real, displayed, actionable stats (confirmed with the designer):
--
--   • Food unmet     → Standard of Living −1   (was Order/Rule of Law)
--   • Goods unmet     → Prosperity −1          (unchanged)
--   • Services unmet → Health −1              (was the invisible Welfare)
--   • Military unpaid → forces shrink          (unchanged)
--
-- All three stat drops now route through _apply_card_stat (schema/176) — the ONE stat primitive cards
-- use: Prosperity lands on stats.prosperity exactly as before, while Standard of Living / Health land
-- on the display delta layer (schema/175). Every other line is reproduced verbatim from schema/223
-- (Growth still read DERIVED via _nation_live_stat, schema/221/222).
--
-- NOT changed here (flagged, needs a separate call): the SERVICES *need* is still sized as Welfare ÷ 10
-- in _economy_need — the demand quantity, distinct from the penalty. Left as-is pending a decision on
-- what services-need should scale with now that Welfare isn't displayed.
--
-- Depends on: 223 (prior body), 176 (_apply_card_stat), 175 (_nation_ministry_stat_add), 91
-- (_nation_stat_add / _apply_policy_effect), 221/222 (_nation_live_stat). Idempotent. Apply after 239.
-- ===========================================================================

set check_function_bodies = off;

create or replace function public._resolve_economy_demands(p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare v_n record; v_year int; v_d jsonb; v_food boolean; v_goods boolean; v_serv boolean; v_mil boolean; v_msg text; v_unmet int;
begin
  if ((p_tick - 1) % 12) + 1 <> 6 then return; end if;   -- June only
  v_year := 1980 + (p_tick - 1) / 12;
  for v_n in select id, demands, coalesce(public._nation_live_stat(id, 'Growth'), 0) as growth from public.nations where not coalesce(dormant, false) loop
    v_d := v_n.demands;
    if v_d is null or (v_d->>'year') is null or (v_d->>'year')::int is distinct from v_year then
      v_food := false; v_goods := false; v_serv := false; v_mil := false;
    else
      v_food  := coalesce((v_d->>'food')::boolean, false);
      v_goods := coalesce((v_d->>'goods')::boolean, false);
      v_serv  := coalesce((v_d->>'services')::boolean, false);
      v_mil   := coalesce((v_d->>'military')::boolean, false);
    end if;

    -- Food: a fed nation grows +1M — but only while Growth holds at 45+. A stalling economy
    -- (Growth < 45) freezes population growth even in a well-fed year. Unmet food docks Standard of
    -- Living (subsistence); either way there's no population growth otherwise.
    if v_food then
      if v_n.growth >= 45 then
        update public.nations set population = coalesce(population, 0) + 1 where id = v_n.id;
      end if;
    else
      perform public._apply_card_stat(v_n.id, 'Standard of Living', -1);
    end if;
    if not v_goods then perform public._apply_card_stat(v_n.id, 'Prosperity', -1); end if;   -- material goods → Prosperity
    if not v_serv  then perform public._apply_card_stat(v_n.id, 'Health', -1); end if;        -- public services → Health
    if not v_mil   then perform public._nation_stat_add(v_n.id, 'on_hand', 'military', -1, 0, null); end if;

    -- The government answers for the shortfall: for EACH of the four demands it missed, every
    -- coalition party loses 1% popularity — through _apply_policy_effect (schema/91), which scopes
    -- Party Popularity to the in-government parties (floored). No government / no coalition → no-op.
    v_unmet := (case when v_food then 0 else 1 end) + (case when v_goods then 0 else 1 end)
             + (case when v_serv then 0 else 1 end) + (case when v_mil then 0 else 1 end);
    if v_unmet > 0 then
      perform public._apply_policy_effect(v_n.id, jsonb_build_object('t', 'Party Popularity', 'v', -v_unmet));
    end if;

    -- Reset for the next cycle (next June).
    update public.nations
       set demands = jsonb_build_object('year', v_year + 1, 'food', false, 'goods', false, 'services', false, 'military', false)
     where id = v_n.id;

    v_msg := 'The ' || v_year || ' annual accounts are in. '
          || (case when v_food and v_n.growth >= 45 then 'The nation was fed — population +1M. '
                    when v_food then 'The nation was fed, but a stalling economy held the population flat. '
                    else 'Food ran short — Standard of Living −1. ' end)
          || (case when v_goods then '' else 'Goods ran short — Prosperity −1. ' end)
          || (case when v_serv  then '' else 'Services ran short — Health −1. ' end)
          || (case when v_mil   then '' else 'Military upkeep went unpaid — the forces shrank. ' end)
          || (case when v_unmet > 0 then 'The coalition answered for it — Party Popularity −' || v_unmet || '%. ' else '' end);
    insert into public.events (nation_id, party_id, kind, body, game_date)
      values (v_n.id, null, 'economy', btrim(v_msg), public.current_game_date());
  end loop;
end $$;
revoke all on function public._resolve_economy_demands(int) from public, anon, authenticated;

notify pgrst, 'reload schema';
