-- ===========================================================================
-- 230 · Stock exchanges earn their keep — listed firms pay dividends into the nation's Budget Balance.
--
-- The stock market went display-only (schema/229), leaving no reason to found or join one. This is its
-- economic payoff (Model A — capital market → treasury income), reusing the corporations + budget systems
-- with NO new stat:
--
--   • A LISTED nation's placed firms pay an annual dividend into its Budget Balance = DIV_RATE × Σ firm
--     cash. Unlisted nations earn nothing (their firms aren't publicly traded) — that's the incentive to
--     found or join an exchange.
--   • The HOST skims a listing fee: FEE_RATE of every MEMBER's dividend goes to the host (and is netted
--     off that member). So founding earns your own firms' dividends PLUS fees from everyone listed on your
--     exchange; joining monetises your firms for the small host cut (no Rule-of-Law-60 bar, lower upkeep).
--
-- This is layered on the existing stock-exchange UPKEEP (host 1% of GDP/yr, member 0.2%, schema/214) — the
-- net of dividends − upkeep is what makes an exchange pay off, so a thin corporate sector may not break
-- even. KNOBS: DIV_RATE 2%/yr of listed firm cash, FEE_RATE 10% of a member's dividend.
--
-- ONE source: _nation_stock_dividend is added into _nation_budget_balance (the single budget figure the
-- topbar, Budget page and Government tile all read) and exposed read-only via nation_stock_dividend for
-- the Stock Market page. No recursion: it reads only corporations.cash + nations.economy, never the budget
-- or any derived stat. Depends on: 47 (corporations), 214 (_nation_budget_balance, stock_market pointer).
-- Idempotent. Apply after 229.
-- ===========================================================================

set check_function_bodies = off;

-- Gross annual dividend a nation's placed firms throw off = DIV_RATE × Σ (firm cash). Pure gross (the
-- listed/fee logic lives in _nation_stock_dividend); 0 when the nation has no placed firms.
create or replace function public._firm_dividend_gross(p_nation text)
returns numeric language sql stable security definer set search_path = public as $$
  select 0.02 * coalesce((                                   -- KNOB: DIV_RATE 2%/yr of listed firm cash
    select sum(greatest(c.cash, 0)) from public.corporations c
    where c.nation_id = p_nation and c.status = 'placed'), 0);
$$;
revoke all on function public._firm_dividend_gross(text) from public, anon, authenticated;

-- The stock market's net dividend contribution to a nation's Budget Balance (₣B/yr):
--   not listed → 0 · member → its own gross minus the host's fee · host → its own gross in full PLUS
--   FEE_RATE of every member's gross (the listing fee it skims). Fees are a pure transfer member→host.
create or replace function public._nation_stock_dividend(p_nation text)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare v_ex uuid; v_role text; v_own numeric; v_member_gross numeric;
  v_fee constant numeric := 0.10;   -- KNOB: host's cut of each member's dividend
begin
  select nullif(economy->'stock_market'->>'exchange_id', '')::uuid, economy->'stock_market'->>'role'
    into v_ex, v_role from public.nations where id = p_nation;
  if v_ex is null then return 0; end if;                      -- unlisted → no market dividend
  v_own := public._firm_dividend_gross(p_nation);
  if v_role = 'host' then
    select coalesce(sum(public._firm_dividend_gross(n.id)), 0) into v_member_gross
      from public.nations n
      where n.id <> p_nation
        and nullif(n.economy->'stock_market'->>'exchange_id', '')::uuid = v_ex;
    return v_own + v_fee * v_member_gross;                    -- own dividends + fees skimmed from members
  end if;
  return v_own * (1 - v_fee);                                 -- member keeps its dividend less the host fee
end $$;
revoke all on function public._nation_stock_dividend(text) from public, anon, authenticated;

-- Read-only RPC for the Stock Market page (one source — never recompute the rate/fee client-side).
create or replace function public.nation_stock_dividend(p_nation text)
returns numeric language sql stable security definer set search_path = public as $$
  select public._nation_stock_dividend(p_nation);
$$;
grant execute on function public.nation_stock_dividend(text) to anon, authenticated;

-- Budget Balance gains the dividend income, alongside the existing upkeep. Only change from schema/214 is
-- the single v_sum += _nation_stock_dividend line by the upkeep block.
create or replace function public._nation_budget_balance(p_nation text)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare
  v_sum numeric; v_rev numeric; v_corr numeric; v_unemp numeric; v_eff numeric; r record; v_yc numeric;
  v_gdp numeric; v_sx_role text;
  v_max_leakage constant numeric := 0.5;
  v_unemp_sens  constant numeric := 1.0;
begin
  v_sum := public._nation_policy_stat(p_nation, 'Budget Balance');
  v_rev  := public._nation_policy_stat(p_nation, 'Budget Balance', true);
  v_corr := least(100, greatest(0, coalesce(public._nation_live_stat(p_nation, 'Corruption'), 0)));
  select least(100, greatest(0, coalesce(public._to_num(economy->>'unemployment'), 0))),
         coalesce(gdp, 0),
         economy->'stock_market'->>'role'
    into v_unemp, v_gdp, v_sx_role from public.nations where id = p_nation;
  v_eff  := (1 - v_corr / 100.0 * v_max_leakage) * (1 - v_unemp / 100.0 * v_unemp_sens);
  v_sum  := v_sum - v_rev * (1 - v_eff);
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
  -- Stock market: upkeep (cost) + corporate dividends (income) — the net is the market's budget effect.
  if v_sx_role = 'host' then v_sum := v_sum - 0.01 * coalesce(v_gdp, 0);
  elsif v_sx_role = 'member' then v_sum := v_sum - 0.002 * coalesce(v_gdp, 0); end if;
  v_sum := v_sum + public._nation_stock_dividend(p_nation);
  return v_sum;
end $$;
revoke all on function public._nation_budget_balance(text) from public, anon, authenticated;

notify pgrst, 'reload schema';
