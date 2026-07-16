-- ===========================================================================
-- 239 · Drop two malaise penalties: "low Growth" and "low Global Image".
--
-- Redefines _resolve_national_malaise (live body is schema/223's — the growth-mirror sweep) to
-- remove, ENTIRELY, two January penalties and their feed lines:
--
--   • "Due to low Growth, prosperity has suffered (−1) and GDP shrank …%." — the whole Growth < 45
--     branch (Prosperity −1, the GDP shrink, and the event). The Growth ≥ 55 GDP DIVIDEND is KEPT
--     (it becomes a standalone `if`), so the healthy-growth expansion still fires.
--   • "Due to low Global Image, the budget and income have suffered (−5% each)." — the whole
--     Image < 45 branch (Budget −5%, Income −5%, and the event).
--
-- Everything else in the pass is reproduced verbatim from schema/223: the low-Prosperity and
-- low-Order political penalties, and the full debt-to-GDP crisis block (100% / 200%). The Growth
-- reads stay on the DERIVED value (public._nation_live_stat(nation, 'Growth'), schema/221/222).
--
-- Also tidies dead locals carried since 125: v_wel (low-Welfare penalty was retired in schema/165,
-- never read) and v_img / v_bud / v_inc (only used by the removed Image branch).
--
-- Depends on: 223 (prior body), 221/222 (_nation_live_stat derived Growth), 91 (_apply_policy_effect),
-- 166 (_regime_is_authoritarian), 165 (_coalition_health_drop), 40 (current_game_date). Idempotent.
-- Apply after 238.
-- ===========================================================================

set check_function_bodies = off;

create or replace function public._resolve_national_malaise(p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare
  n record;
  v_pro numeric; v_gro numeric; v_ord numeric;
  v_open boolean; v_gdp_delta numeric; v_debt numeric; v_pct numeric;
begin
  if (p_tick - 1) % 12 <> 0 then return; end if;   -- January only (tick 1, 13, 25, …)
  for n in select id, stats, economy, gdp from public.nations where not coalesce(dormant, false) loop
    v_pro := coalesce((n.stats->>'prosperity')::numeric, 0);
    v_gro := coalesce(public._nation_live_stat(n.id, 'Growth'), 0);   -- derived (schema/221/222), not the raw mirror
    v_ord := coalesce((n.stats->>'order')::numeric, 0);
    -- An authoritarian regime (autocracy at the reform floor) suppresses the POLITICAL fallout —
    -- the Prosperity and Order penalties only bite an OPEN regime. The debt-crisis economic pain
    -- still lands on everyone. _regime_is_authoritarian (schema/166) is the ONE test; a null/unset
    -- type reads as open.
    v_open := not public._regime_is_authoritarian(n.economy);

    if v_pro < 45 and v_open then
      perform public._apply_policy_effect(n.id, jsonb_build_object('t', 'Party Popularity', 'v', -3));
      perform public._malaise_event(n.id, 'Due to low Prosperity, party popularity has suffered (−3%).');
    end if;

    if v_ord < 45 and v_open then
      perform public._apply_policy_effect(n.id, jsonb_build_object('t', 'Party Popularity', 'v', -3));
      perform public._apply_policy_effect(n.id, jsonb_build_object('t', 'Growth', 'v', -1));
      perform public._malaise_event(n.id, 'Due to low Order, party popularity has suffered (−3%) and growth has stalled (−1).');
    end if;

    -- Healthy-growth dividend (the low-Growth stall + its event were removed in schema/239). At 55+ a
    -- strong economy grows GDP by (Growth − 55)/5 % (Growth 60 → +1%, Growth 80 → +5%). Economic, so it
    -- rewards every regime. This is the one place GDP moves UP from Growth.
    if v_gro >= 55 then
      v_pct := round((v_gro - 55) / 5.0, 1);
      v_gdp_delta := round(coalesce(n.gdp, 0) * v_pct / 100.0);
      if v_gdp_delta > 0 then
        update public.nations set gdp = gdp + v_gdp_delta where id = n.id;
        perform public._malaise_event(n.id, 'Strong Growth expanded GDP by ' || v_pct || '% (+$' || v_gdp_delta || 'B).');
      end if;
    end if;

    -- (The low-Global-Image budget/income penalty and its event were removed in schema/239.)

    -- Debt-to-GDP crisis. Past 100% of GDP the nation's credit is downgraded; past 200% it tips into a
    -- sovereign debt spiral. The interest RATE escalates in _apply_debt_interest (schema/152, run just
    -- before this pass); here is the one-off pain. Austerity stalls Growth and (at 200%) capital flight
    -- shrinks GDP — economic, so every regime pays it. The political fallout (Prosperity) is suppressed
    -- under an authoritarian regime (v_open), like the other malaise penalties.
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
