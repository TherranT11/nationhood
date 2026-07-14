-- ===========================================================================
-- 210 · Tax collection efficiency — Corruption + Unemployment shave collected revenue.
--
-- A nation's Corruption and Unemployment reduce how much of its % of GDP tax revenue it actually
-- collects. Only the POSITIVE % of GDP Budget Balance effects are shaved (taxes that scale with the
-- economy) — flat-$ effects and spending (negative effects) are untouched, per design:
--
--     collection efficiency = (1 − Corruption/100 × MAX_LEAKAGE)      -- graft / evasion
--     employment fraction   = (1 − Unemployment/100 × UNEMP_SENS)     -- fewer earners to tax
--     collected             = revenue × collection efficiency × employment fraction
--
-- TWO KNOBS: MAX_LEAKAGE (0.5) — up to 50% lost to graft at Corruption 100; UNEMP_SENS (1.0) — full
-- (100 − Unemployment)/100, so 20% unemployment loses 20% of the tax base. Tune each to taste.
--
-- Corruption is read via _nation_live_stat (its ministry-stat home); Unemployment from
-- economy.unemployment — the live economic value cards / crises / corp-climate / malaise all use (NOT
-- the separate, admin-authored ministry_stats.Unemployment the Government page displays; see the note
-- at the end of this file — those two stores are unsynced today).
--
-- ONE SOURCE: the shave lives in _nation_budget_balance, which drives BOTH the actual debt movement
-- (_apply_budget_balance) AND the displayed total (nation_stat_values → the Government page), so they
-- can never diverge. _nation_policy_stat gains an optional flag to return just the positive % of GDP
-- portion of a stat, so the policy-walk logic stays in exactly one function.
--
-- Depends on: 152 (_nation_policy_stat / _nation_budget_balance), 175 (_nation_live_stat), 92
-- (_nation_policy_option), 10 (nations). Idempotent. Apply in the Supabase SQL Editor.
-- ===========================================================================

set check_function_bodies = off;

-- The policy-effect summer, now with an optional "positive % of GDP only" mode (the corruptible tax
-- revenue). Replaces the 2-arg form — 2-arg calls resolve here via the default, so nothing else changes.
drop function if exists public._nation_policy_stat(text, text);
create or replace function public._nation_policy_stat(p_nation text, p_stat text, p_gdp_revenue_only boolean default false)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare
  v_gdp numeric; v_sum numeric := 0; r record; v_type text; v_opts jsonb;
  v_idx int; v_from int; i int; v_eff jsonb; v_v numeric; v_c numeric;
begin
  select gdp into v_gdp from public.nations where id = p_nation;
  for r in select id, definition from public.policies
             where coalesce(definition->>'special', '') <> 'trade' loop
    v_type := coalesce(r.definition->>'type', 'spectrum');
    v_opts := r.definition->v_type;                            -- the 'spectrum' or 'binary' array
    if v_opts is null or jsonb_typeof(v_opts) <> 'array' then continue; end if;
    v_idx  := public._nation_policy_option(p_nation, r.id);    -- the in-force option index
    v_from := case when v_type = 'spectrum' then 1 else v_idx end;   -- spectrum accumulates 1..idx
    for i in v_from .. v_idx loop                             -- no iterations when idx < from (e.g. base level)
      if v_opts->i is null then continue; end if;
      for v_eff in select value from jsonb_array_elements(coalesce(v_opts->i->'effects', '[]'::jsonb)) loop
        if v_eff->>'t' <> p_stat then continue; end if;
        v_v := coalesce((v_eff->>'v')::numeric, 0);
        if p_gdp_revenue_only then
          -- Only the POSITIVE % of GDP contributions — the tax revenue Corruption can eat into.
          if v_eff->>'unit' = 'gdp' then
            v_c := v_v / 100.0 * coalesce(v_gdp, 0);
            if v_c > 0 then v_sum := v_sum + v_c; end if;
          end if;
        else
          v_sum := v_sum + case when v_eff->>'unit' = 'gdp' then v_v / 100.0 * coalesce(v_gdp, 0) else v_v end;
        end if;
      end loop;
    end loop;
  end loop;
  return v_sum;
end $$;
revoke all on function public._nation_policy_stat(text, text, boolean) from public, anon, authenticated;

-- Budget Balance = every policy's Budget Balance effect, LESS the corruption collection-loss on the
-- positive % of GDP revenue, LESS each running initiative's standing share (unchanged).
create or replace function public._nation_budget_balance(p_nation text)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare
  v_sum numeric; v_rev numeric; v_corr numeric; v_unemp numeric; v_eff numeric; r record; v_yc numeric;
  v_max_leakage constant numeric := 0.5;   -- KNOB 1: up to 50% of % of GDP revenue lost to graft at Corruption 100
  v_unemp_sens  constant numeric := 1.0;   -- KNOB 2: employment fraction = (100 − Unemployment)/100 in full
begin
  v_sum := public._nation_policy_stat(p_nation, 'Budget Balance');            -- gross of every Budget Balance effect
  -- Collected fraction of the corruptible tax revenue (positive % of GDP effects) = collection efficiency
  -- (Corruption) × employment fraction (Unemployment). Subtract the uncollected remainder.
  v_rev  := public._nation_policy_stat(p_nation, 'Budget Balance', true);     -- that positive % of GDP revenue
  v_corr := least(100, greatest(0, coalesce(public._nation_live_stat(p_nation, 'Corruption'), 0)));
  select least(100, greatest(0, coalesce(public._to_num(economy->>'unemployment'), 0)))
    into v_unemp from public.nations where id = p_nation;
  v_eff  := (1 - v_corr / 100.0 * v_max_leakage) * (1 - v_unemp / 100.0 * v_unemp_sens);
  v_sum  := v_sum - v_rev * (1 - v_eff);                                      -- shave the uncollected portion
  -- Running initiatives: this nation's standing share of each active programme's $bn/yr (as the
  -- enacting nation, (100 − share)%; as a joint partner, share%). Flat $bn or % of the ENACTING nation's GDP.
  for r in
    select coalesce((i.definition->>'budgetPerYear')::numeric, 0) as byear,
           i.definition->>'budgetUnit' as bunit, coalesce(nn.gdp, 0) as owner_gdp,
           coalesce(ni.partner_share, 0) as share, (ni.nation_id = p_nation) as is_owner
      from public.nation_initiatives ni
      join public.national_initiatives i  on i.id  = ni.initiative_id
      join public.nations             nn on nn.id = ni.nation_id
     where ni.status = 'active' and (ni.nation_id = p_nation or ni.partner_nation = p_nation)
  loop
    v_yc := case when r.bunit = 'gdp' then r.byear / 100.0 * r.owner_gdp else r.byear end;
    v_sum := v_sum - case when r.is_owner then v_yc * (100 - r.share) / 100.0
                          else v_yc * r.share / 100.0 end;
  end loop;
  return v_sum;
end $$;
revoke all on function public._nation_budget_balance(text) from public, anon, authenticated;

-- KNOWN, PRE-EXISTING ONE-SOURCE ISSUE (not introduced here, flagged for a follow-up decision):
-- Unemployment lives in TWO unsynced places — economy.unemployment (the live economic value cards,
-- events, crises, corp-climate and the malaise pass all move + read) and ministry_stats.Unemployment
-- (admin-authored, what the Government page displays via _nation_live_stat / nation_stat_values). They
-- can drift (e.g. a card that raises Unemployment moves only economy.*). This function reads the
-- economic value — correct for an economic mechanic — but it may differ from the number shown on the
-- Government page. Reconciling the two (make the display read economy.unemployment, or sync them) is a
-- separate change worth making so the mechanic reads exactly what the player sees.

notify pgrst, 'reload schema';
