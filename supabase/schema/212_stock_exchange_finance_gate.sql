-- ===========================================================================
-- 212 · Stock exchange — gate founding to the Ministry of Finance + 1%-of-GDP upkeep.
--
-- Two changes to the Found action (schema/211):
--   1. Only the Treasury minister (the game's Ministry of Finance) may found a national exchange —
--      the same ministry-gate pattern as found_organization (Foreign Affairs). Adds is_treasury_minister()
--      for the client to gate its button, mirroring is_trade_minister() (schema/114 pattern).
--   2. Running an exchange costs 1% of GDP a year — a STANDING drain on Budget Balance while the market
--      is active. It lives in _nation_budget_balance (the ONE source that drives both the debt movement
--      and the displayed figure), so the cost shows on the Budget page and eats into debt identically.
--
-- Redefines _nation_budget_balance (last set in 210) — this is the authoritative version now; the only
-- change from 210 is the upkeep tail. Depends on: 114 (_party_holds_ministry), 210 (_nation_budget_balance),
-- 211 (found_stock_exchange), 10 (nations). Idempotent. Apply in the Supabase SQL Editor.
-- ===========================================================================

set check_function_bodies = off;

-- Does the caller's party hold the Treasury (Finance) portfolio? Client-side button gate.
create or replace function public.is_treasury_minister()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select public._party_holds_ministry(id, 'Treasury') from public.parties where user_id = auth.uid()), false);
$$;
grant execute on function public.is_treasury_minister() to authenticated;

-- Found action — now gated to the Treasury minister (defence-in-depth behind the client gate).
create or replace function public.found_stock_exchange()
returns void language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; v_nation text; v_active boolean;
begin
  v_p := public._begin_action(0);   -- lock caller's party + spend 1 Action Point; no funds/Diplomacy cost
  v_nation := v_p.nation_id;
  if not public._party_holds_ministry(v_p.id, 'Treasury') then
    raise exception 'Only the Minister of Finance can found a stock exchange.'; end if;

  -- Founding is once per nation. Lock the nation row FOR UPDATE so two DIFFERENT parties in the same
  -- nation can't both pass this check and each apply the +8 Growth (a cross-party double-found race).
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

-- Budget Balance = policy effects − corruption/unemployment collection loss − running initiatives −
-- stock-exchange upkeep. The ONLY change from schema/210 is the 1%-of-GDP upkeep tail.
create or replace function public._nation_budget_balance(p_nation text)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare
  v_sum numeric; v_rev numeric; v_corr numeric; v_unemp numeric; v_eff numeric; r record; v_yc numeric;
  v_gdp numeric; v_sx boolean;
  v_max_leakage constant numeric := 0.5;   -- KNOB 1: up to 50% of % of GDP revenue lost to graft at Corruption 100
  v_unemp_sens  constant numeric := 1.0;   -- KNOB 2: employment fraction = (100 − Unemployment)/100 in full
begin
  v_sum := public._nation_policy_stat(p_nation, 'Budget Balance');            -- gross of every Budget Balance effect
  v_rev  := public._nation_policy_stat(p_nation, 'Budget Balance', true);     -- that positive % of GDP revenue
  v_corr := least(100, greatest(0, coalesce(public._nation_live_stat(p_nation, 'Corruption'), 0)));
  select least(100, greatest(0, coalesce(public._to_num(economy->>'unemployment'), 0))),
         coalesce(gdp, 0),
         coalesce((economy->'stock_market'->>'active')::boolean, false)
    into v_unemp, v_gdp, v_sx from public.nations where id = p_nation;
  v_eff  := (1 - v_corr / 100.0 * v_max_leakage) * (1 - v_unemp / 100.0 * v_unemp_sens);
  v_sum  := v_sum - v_rev * (1 - v_eff);                                      -- shave the uncollected portion
  -- Running initiatives: this nation's standing share of each active programme's $bn/yr.
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
  -- Stock-exchange upkeep: a nation running its own exchange spends 1% of GDP a year on it (standing).
  if v_sx then v_sum := v_sum - 0.01 * coalesce(v_gdp, 0); end if;
  return v_sum;
end $$;
revoke all on function public._nation_budget_balance(text) from public, anon, authenticated;

notify pgrst, 'reload schema';
