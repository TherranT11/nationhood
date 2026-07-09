-- ===========================================================================
-- 125 · National malaise — the yearly cost of letting a headline stat slip below 45, plus the
-- debt-to-GDP crisis penalties (over 100% / 200% of GDP; see the debt block at the end of the loop).
-- Each January (called from _advance_tick, schema/60), for every live nation, any of the
-- five glance stats under 45 fires a tangible penalty and a feed line. The five stats are
-- read up front (a snapshot), so one year's penalty can't cascade into another the same
-- pass (Order's −1 Growth / Growth's −1 Prosperity are judged against the year-start values).
-- Effects ride _apply_policy_effect (schema/91) — the one clamp source; Party Popularity /
-- Government Confidence land on the sitting government. An AUTHORITARIAN regime (1–4) is spared
-- the political penalties (Prosperity / Welfare / Order) — it suppresses that fallout — but still
-- takes the economic + international ones (Growth, Global Image).
-- Growth also drives GDP directly here — the ONE place GDP moves: it shrinks GDP by (45 − Growth)/5 %
-- when Growth < 45, and grows it by (Growth − 55)/5 % when Growth ≥ 55 (a healthy-growth dividend, the
-- one positive effect in this pass). A stalling Growth (< 45) additionally freezes the +1M
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
  v_regime numeric; v_open boolean; v_gdp_delta numeric; v_debt numeric; v_pct numeric;
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

    if v_pro < 45 and v_open then
      perform public._apply_policy_effect(n.id, jsonb_build_object('t', 'Party Popularity', 'v', -3));
      perform public._malaise_event(n.id, 'Due to low Prosperity, party popularity has suffered (−3%).');
    end if;

    -- Low Welfare formerly cost Government Confidence — retired with that gauge (schema/165).

    if v_ord < 45 and v_open then
      perform public._apply_policy_effect(n.id, jsonb_build_object('t', 'Party Popularity', 'v', -3));
      perform public._apply_policy_effect(n.id, jsonb_build_object('t', 'Growth', 'v', -1));
      perform public._malaise_event(n.id, 'Due to low Order, party popularity has suffered (−3%) and growth has stalled (−1).');
    end if;

    -- Growth's pull on GDP + prosperity. Below 45 the economy stalls: Prosperity slips 1 and GDP
    -- shrinks by (45 − Growth)/5 % (Growth 40 → −1%, Growth 20 → −5%). At 55+ a healthy economy pays a
    -- dividend — GDP grows by (Growth − 55)/5 % (Growth 60 → +1%, Growth 80 → +5%). Between 45 and 54 GDP
    -- holds flat. This is economic, not political, so it bites/rewards every regime (not gated by
    -- v_open). GDP floors at 0, and this is the ONE place GDP moves. (Growth < 45 also freezes
    -- population — schema/113.)
    if v_gro < 45 then
      perform public._apply_policy_effect(n.id, jsonb_build_object('t', 'Prosperity', 'v', -1));
      v_pct := round((45 - v_gro) / 5.0, 1);
      v_gdp_delta := round(coalesce(n.gdp, 0) * v_pct / 100.0);
      if v_gdp_delta > 0 then update public.nations set gdp = greatest(0, gdp - v_gdp_delta) where id = n.id; end if;
      perform public._malaise_event(n.id,
        'Due to low Growth, prosperity has suffered (−1)'
        || (case when v_gdp_delta > 0 then ' and GDP shrank ' || v_pct || '% (−$' || v_gdp_delta || 'B)' else '' end) || '.');
    elsif v_gro >= 55 then
      v_pct := round((v_gro - 55) / 5.0, 1);
      v_gdp_delta := round(coalesce(n.gdp, 0) * v_pct / 100.0);
      if v_gdp_delta > 0 then
        update public.nations set gdp = gdp + v_gdp_delta where id = n.id;
        perform public._malaise_event(n.id, 'Strong Growth expanded GDP by ' || v_pct || '% (+$' || v_gdp_delta || 'B).');
      end if;
    end if;

    if v_img < 45 then
      v_bud := coalesce((n.economy->>'budget')::numeric, 0);
      v_inc := coalesce((n.economy->>'income')::numeric, 0);
      perform public._apply_policy_effect(n.id, jsonb_build_object('t', 'Budget', 'v', -round(v_bud * 0.05, 1)));   -- −5% of the treasury
      perform public._apply_policy_effect(n.id, jsonb_build_object('t', 'Income', 'v', -round(v_inc * 0.05, 1)));   -- −5% of annual income
      perform public._malaise_event(n.id, 'Due to low Global Image, the budget and income have suffered (−5% each).');
    end if;

    -- Debt-to-GDP crisis. Past 100% of GDP the nation's credit is downgraded; past 200% it tips into a
    -- sovereign debt spiral. The interest RATE escalates in _apply_debt_interest (schema/152, run just
    -- before this pass); here is the one-off pain. Austerity stalls Growth and (at 200%) capital flight
    -- shrinks GDP — economic, so every regime pays it. The political fallout (Prosperity / Government
    -- Confidence) is suppressed under an authoritarian regime (v_open), like the other malaise penalties.
    -- Growth ↓ and GDP ↓ both worsen the ratio next year — the pain is a spiral, not a one-time toll.
    v_debt := coalesce((n.economy->>'debt')::numeric, 0);
    if v_debt > 0 and coalesce(n.gdp, 0) > 0 then
      if v_debt > n.gdp * 2 then
        perform public._apply_policy_effect(n.id, jsonb_build_object('t', 'Growth', 'v', -3));
        v_gdp_delta := round(n.gdp * 0.05);   -- capital flight
        if v_gdp_delta > 0 then update public.nations set gdp = greatest(0, gdp - v_gdp_delta) where id = n.id; end if;
        if v_open then
          perform public._apply_policy_effect(n.id, jsonb_build_object('t', 'Prosperity', 'v', -2));
        end if;
        perform public._malaise_event(n.id,
          'Public debt has passed 200% of GDP — a sovereign debt spiral. Borrowing costs jumped to 15% and growth collapsed (−3)'
          || (case when v_gdp_delta > 0 then ', GDP shrank 5% (−$' || v_gdp_delta || 'B) as capital fled' else '' end) || '.');
        -- A DEMOCRATIC government loses a heart of Coalition Health to the crisis; if it was the last,
        -- the government falls apart (−5% Party Popularity to all governing parties, snap election next
        -- tick). Autocracies are spared. ONE source: _coalition_health_drop (schema/165).
        if v_open then perform public._coalition_health_drop(n.id, 1, 5,
          'Public debt passed 200% of GDP and the governing coalition''s health gave way', p_tick); end if;
      elsif v_debt > n.gdp then
        perform public._apply_policy_effect(n.id, jsonb_build_object('t', 'Growth', 'v', -2));
        perform public._malaise_event(n.id,
          'Public debt has passed 100% of GDP — the nation''s credit was downgraded. Borrowing costs doubled to 10% and growth stalled (−2).');
        if v_open then perform public._coalition_health_drop(n.id, 1, 3,
          'Public debt passed 100% of GDP and the governing coalition''s health gave way', p_tick); end if;
      end if;
    end if;
  end loop;
end $$;
revoke all on function public._resolve_national_malaise(int) from public, anon, authenticated;

notify pgrst, 'reload schema';
