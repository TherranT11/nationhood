-- ===========================================================================
-- 125 · National malaise — the yearly cost of letting a headline stat slip below 9.
-- Each January (called from _advance_tick, schema/60), for every live nation, any of the
-- five glance stats under 9 fires a tangible penalty and a feed line. The five stats are
-- read up front (a snapshot), so one year's penalty can't cascade into another the same
-- pass (Order's −1 Growth / Growth's −1 Prosperity are judged against the year-start values).
-- Effects ride _apply_policy_effect (schema/91) — the one clamp source; Party Popularity /
-- Government Confidence land on the sitting government.
-- Depends on: 10 (nations), 91 (_apply_policy_effect), 40 (current_game_date). Run after 91.
-- ===========================================================================

create or replace function public._resolve_national_malaise(p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare
  n record;
  v_pro numeric; v_wel numeric; v_gro numeric; v_ord numeric; v_img numeric; v_bud numeric; v_inc numeric;
begin
  if (p_tick - 1) % 12 <> 0 then return; end if;   -- January only (tick 1, 13, 25, …)
  for n in select id, stats, economy from public.nations where not coalesce(dormant, false) loop
    v_pro := coalesce((n.stats->>'prosperity')::numeric, 0);
    v_wel := coalesce((n.stats->>'welfare')::numeric, 0);
    v_gro := coalesce((n.stats->>'growth')::numeric, 0);
    v_ord := coalesce((n.stats->>'order')::numeric, 0);
    v_img := coalesce((n.stats->>'image')::numeric, 0);

    if v_pro < 9 then
      perform public._apply_policy_effect(n.id, jsonb_build_object('t', 'Party Popularity', 'v', -3));
      insert into public.events (nation_id, kind, body, game_date)
        values (n.id, 'economy', 'Due to low Prosperity, party popularity has suffered (−3%).', public.current_game_date());
    end if;

    if v_wel < 9 then
      perform public._apply_policy_effect(n.id, jsonb_build_object('t', 'Government Confidence', 'v', -5));
      insert into public.events (nation_id, kind, body, game_date)
        values (n.id, 'economy', 'Due to low Welfare, government confidence has suffered (−5%).', public.current_game_date());
    end if;

    if v_ord < 9 then
      perform public._apply_policy_effect(n.id, jsonb_build_object('t', 'Party Popularity', 'v', -3));
      perform public._apply_policy_effect(n.id, jsonb_build_object('t', 'Growth', 'v', -1));
      insert into public.events (nation_id, kind, body, game_date)
        values (n.id, 'economy', 'Due to low Order, party popularity has suffered (−3%) and growth has stalled (−1).', public.current_game_date());
    end if;

    if v_gro < 9 then
      perform public._apply_policy_effect(n.id, jsonb_build_object('t', 'Prosperity', 'v', -1));
      insert into public.events (nation_id, kind, body, game_date)
        values (n.id, 'economy', 'Due to low Growth, prosperity has suffered (−1).', public.current_game_date());
    end if;

    if v_img < 9 then
      v_bud := coalesce((n.economy->>'budget')::numeric, 0);
      v_inc := coalesce((n.economy->>'income')::numeric, 0);
      perform public._apply_policy_effect(n.id, jsonb_build_object('t', 'Budget', 'v', -round(v_bud * 0.05, 1)));   -- −5% of the treasury
      perform public._apply_policy_effect(n.id, jsonb_build_object('t', 'Income', 'v', -round(v_inc * 0.05, 1)));   -- −5% of annual income
      insert into public.events (nation_id, kind, body, game_date)
        values (n.id, 'economy', 'Due to low Global Image, the budget and income have suffered (−5% each).', public.current_game_date());
    end if;
  end loop;
end $$;
revoke all on function public._resolve_national_malaise(int) from public, anon, authenticated;

notify pgrst, 'reload schema';
