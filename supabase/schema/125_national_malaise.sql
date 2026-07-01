-- ===========================================================================
-- 125 · National malaise — the yearly cost of letting a headline stat slip below 9.
-- Each January (called from _advance_tick, schema/60), for every live nation, any of the
-- five glance stats under 9 fires a tangible penalty and a feed line. The five stats are
-- read up front (a snapshot), so one year's penalty can't cascade into another the same
-- pass (Order's −1 Growth / Growth's −1 Prosperity are judged against the year-start values).
-- Effects ride _apply_policy_effect (schema/91) — the one clamp source; Party Popularity /
-- Government Confidence land on the sitting government. An AUTHORITARIAN regime (1–4) is spared
-- the political penalties (Prosperity / Welfare / Order) — it suppresses that fallout — but still
-- takes the economic + international ones (Growth, Global Image).
-- Growth also drives GDP directly here — the ONE place GDP moves: it shrinks GDP by (10 − Growth)%
-- when Growth < 9, and grows it by (Growth − 12)% when Growth ≥ 12 (a healthy-growth dividend, the
-- one positive effect in this pass). A stalling Growth (< 9) additionally freezes the +1M
-- population gain in schema/113's June food settle (the sole source of population growth).
-- Depends on: 10 (nations: stats/economy/gdp), 70 (_to_num), 91 (_apply_policy_effect), 40 (current_game_date). After 91.
-- ===========================================================================

-- One malaise line into a nation's feed. ONE place for the insert shape the five checks share.
create or replace function public._malaise_event(p_nation text, p_body text)
returns void language sql security definer set search_path = public as $$
  insert into public.events (nation_id, kind, body, game_date)
    values (p_nation, 'economy', p_body, public.current_game_date());
$$;
revoke all on function public._malaise_event(text, text) from public, anon, authenticated;

create or replace function public._resolve_national_malaise(p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare
  n record;
  v_pro numeric; v_wel numeric; v_gro numeric; v_ord numeric; v_img numeric; v_bud numeric; v_inc numeric;
  v_regime numeric; v_open boolean; v_gdp_delta numeric;
begin
  if (p_tick - 1) % 12 <> 0 then return; end if;   -- January only (tick 1, 13, 25, …)
  for n in select id, stats, economy, gdp from public.nations where not coalesce(dormant, false) loop
    v_pro := coalesce((n.stats->>'prosperity')::numeric, 0);
    v_wel := coalesce((n.stats->>'welfare')::numeric, 0);
    v_gro := coalesce((n.stats->>'growth')::numeric, 0);
    v_ord := coalesce((n.stats->>'order')::numeric, 0);
    v_img := coalesce((n.stats->>'image')::numeric, 0);
    -- An authoritarian regime (1–4) suppresses the POLITICAL fallout — the Prosperity, Welfare
    -- and Order penalties (popularity / confidence) only bite an open regime (5+). Growth and
    -- Global Image (economic / international) still land on everyone. (_to_num mirrors sanctions.)
    v_regime := public._to_num(n.economy->>'regime');
    v_open := (v_regime is null or v_regime >= 5);

    if v_pro < 9 and v_open then
      perform public._apply_policy_effect(n.id, jsonb_build_object('t', 'Party Popularity', 'v', -3));
      perform public._malaise_event(n.id, 'Due to low Prosperity, party popularity has suffered (−3%).');
    end if;

    if v_wel < 9 and v_open then
      perform public._apply_policy_effect(n.id, jsonb_build_object('t', 'Government Confidence', 'v', -5));
      perform public._malaise_event(n.id, 'Due to low Welfare, government confidence has suffered (−5%).');
    end if;

    if v_ord < 9 and v_open then
      perform public._apply_policy_effect(n.id, jsonb_build_object('t', 'Party Popularity', 'v', -3));
      perform public._apply_policy_effect(n.id, jsonb_build_object('t', 'Growth', 'v', -1));
      perform public._malaise_event(n.id, 'Due to low Order, party popularity has suffered (−3%) and growth has stalled (−1).');
    end if;

    -- Growth's pull on GDP + prosperity. Below 9 the economy stalls: Prosperity slips 1 and GDP
    -- shrinks by (10 − Growth)% (Growth 7 → −3%). At 12+ a healthy economy pays a dividend — GDP
    -- grows by (Growth − 12)% (Growth 12 → +0%, 13 → +1%). Between 9 and 11 GDP holds flat. This is
    -- economic, not political, so it bites/rewards every regime (not gated by v_open). GDP floors at
    -- 0, and this is the ONE place GDP moves. (Growth < 9 also freezes population — schema/113.)
    if v_gro < 9 then
      perform public._apply_policy_effect(n.id, jsonb_build_object('t', 'Prosperity', 'v', -1));
      v_gdp_delta := round(coalesce(n.gdp, 0) * (10 - v_gro) / 100.0);
      if v_gdp_delta > 0 then update public.nations set gdp = greatest(0, gdp - v_gdp_delta) where id = n.id; end if;
      perform public._malaise_event(n.id,
        'Due to low Growth, prosperity has suffered (−1)'
        || (case when v_gdp_delta > 0 then ' and GDP shrank ' || (10 - v_gro) || '% (−$' || v_gdp_delta || 'B)' else '' end) || '.');
    elsif v_gro >= 12 then
      v_gdp_delta := round(coalesce(n.gdp, 0) * (v_gro - 12) / 100.0);
      if v_gdp_delta > 0 then
        update public.nations set gdp = gdp + v_gdp_delta where id = n.id;
        perform public._malaise_event(n.id, 'Strong Growth expanded GDP by ' || (v_gro - 12) || '% (+$' || v_gdp_delta || 'B).');
      end if;
    end if;

    if v_img < 9 then
      v_bud := coalesce((n.economy->>'budget')::numeric, 0);
      v_inc := coalesce((n.economy->>'income')::numeric, 0);
      perform public._apply_policy_effect(n.id, jsonb_build_object('t', 'Budget', 'v', -round(v_bud * 0.05, 1)));   -- −5% of the treasury
      perform public._apply_policy_effect(n.id, jsonb_build_object('t', 'Income', 'v', -round(v_inc * 0.05, 1)));   -- −5% of annual income
      perform public._malaise_event(n.id, 'Due to low Global Image, the budget and income have suffered (−5% each).');
    end if;
  end loop;
end $$;
revoke all on function public._resolve_national_malaise(int) from public, anon, authenticated;

notify pgrst, 'reload schema';
