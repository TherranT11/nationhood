-- ===========================================================================
-- 244 · FDI Phase 1 — Court Foreign Investment (the Ministry of Finance action) + the suitor pool.
--
-- The Minister of Finance courts a foreign corporation for 3 Action Points: pick a suitor, set the
-- incentive package, extend the invitation. The deal is created PENDING and the corp's board decides
-- two ticks later (schema/245) — courtship is real, rejection is possible.
--
--   • climate = 0.4·Rule of Law + 0.3·Infrastructure + 0.2·Energy Availability + 0.1·(100 − Corruption)
--   • temperature = sweeteners − protections (incentives raise/lower tier access + board odds)
--   • tier ceiling: tier 3 needs climate ≥ 60 OR temp ≥ 2; tier 2 needs climate ≥ 40 OR temp ≥ 1
--   • growth by tier: t1 → 3, t2 → 4, t3 → 6 (host); owner gets a flat +2 (Phase 1; the value-transfer
--     refinement is a later phase)
--
-- All stat reads go through _nation_live_stat (one source). Depends on: 243 (fdi_deals, _corp_fdi_tier),
-- 47 (corporations), 40 (_begin_action / _spend_action_point / events), 174 (_party_holds_ministry),
-- 05 (game_state), sanctions table. Idempotent.
-- ===========================================================================

set check_function_bodies = off;

-- Investment climate 0..100-ish — the same four levers the suitor pool and the board both read.
create or replace function public._fdi_climate(p_nation text)
returns numeric language sql stable security definer set search_path = public as $$
  select round(0.4 * coalesce(public._nation_live_stat(p_nation, 'Rule of Law'), 0)
             + 0.3 * coalesce(public._nation_live_stat(p_nation, 'Infrastructure'), 0)
             + 0.2 * coalesce(public._nation_live_stat(p_nation, 'Energy Availability'), 0)
             + 0.1 * (100 - coalesce(public._nation_live_stat(p_nation, 'Corruption'), 0)), 1);
$$;
revoke all on function public._fdi_climate(text) from public, anon, authenticated;

-- Highest corp tier a nation can attract at a given incentive temperature.
create or replace function public._fdi_tier_ceiling(p_climate numeric, p_temp int)
returns int language sql immutable as $$
  select case when coalesce(p_climate, 0) >= 60 or coalesce(p_temp, 0) >= 2 then 3
              when coalesce(p_climate, 0) >= 40 or coalesce(p_temp, 0) >= 1 then 2
              else 1 end;
$$;

-- Host Growth a tier delivers.
create or replace function public._fdi_growth_for(p_tier int)
returns numeric language sql immutable as $$
  select case p_tier when 1 then 3 when 3 then 6 else 4 end;
$$;

-- Incentive temperature = sweeteners − protections. One source for the classification.
create or replace function public._fdi_temperature(p_incentives text[])
returns int language sql immutable as $$
  select coalesce(sum(case
           when i = any (array['holiday', 'sez', 'grant']) then 1
           when i = any (array['local_hire', 'profit_cap', 'tech_transfer']) then -1
           else 0 end), 0)::int
  from unnest(coalesce(p_incentives, '{}')) i;
$$;

-- Does the viewer hold the Treasury (Minister of Finance)? Gates the Court button in the UI; the RPC
-- re-checks server-side regardless. Mirrors is_trade_minister (schema/114).
create or replace function public.is_finance_minister()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select public._party_holds_ministry(id, 'Treasury') from public.parties where user_id = auth.uid()), false);
$$;
grant execute on function public.is_finance_minister() to authenticated;

-- The suitor pool for a host: foreign 'placed' corps not sanctioned against the host, with their tier,
-- the Growth they'd bring, and whether the host's CURRENT climate already clears their tier (temp 0) —
-- higher-tier suitors need sweeteners, which the Court action re-validates. Deterministic order.
create or replace function public.fdi_suitor_pool(p_nation text)
returns jsonb language sql stable security definer set search_path = public as $$
  with clim as (select public._fdi_climate(p_nation) as c)
  select coalesce(jsonb_agg(s order by s->>'tier' desc, s->>'name'), '[]'::jsonb) from (
    select jsonb_build_object(
             'corp_id', c.id, 'name', c.name, 'sector', c.category,
             'home_nation', c.nation_id, 'home_name', n.name,
             'tier', public._corp_fdi_tier(c.size),
             'growth', public._fdi_growth_for(public._corp_fdi_tier(c.size)),
             'available_now', public._corp_fdi_tier(c.size) <= public._fdi_tier_ceiling((select c from clim), 0)
           ) as s
      from public.corporations c
      join public.nations n on n.id = c.nation_id
     where c.status = 'placed'
       and c.nation_id <> p_nation
       and not coalesce(n.dormant, false)
       and not exists (
         select 1 from public.sanctions sa where coalesce(sa.active, false)
          and ((sa.by_nation = c.nation_id and sa.target_nation = p_nation)
            or (sa.by_nation = p_nation and sa.target_nation = c.nation_id)))
       and not exists (
         select 1 from public.fdi_deals d
          where d.corp_id = c.id and d.host_nation_id = p_nation and d.state in ('PENDING', 'ACTIVE'))
     order by public._corp_fdi_tier(c.size) desc, c.name
     limit 12
  ) pool;
$$;
grant execute on function public.fdi_suitor_pool(text) to authenticated;

-- Court Foreign Investment — Minister of Finance, 3 AP. Validates the suitor and package, then creates
-- a PENDING deal the board resolves in two ticks.
create or replace function public.court_foreign_investment(p_corp uuid, p_incentives text[], p_hex_q int default null, p_hex_r int default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; v_host text; v_corp public.corporations%rowtype;
        v_temp int; v_clim numeric; v_tier int; v_ceil int; v_tick int; v_deal uuid; v_oname text;
begin
  v_p := public._begin_action(0);                                  -- 1 AP
  perform public._spend_action_point(v_p.id);                      -- +1
  perform public._spend_action_point(v_p.id);                      -- +1  → 3 AP total
  if not public._party_holds_ministry(v_p.id, 'Treasury') then
    raise exception 'Only the Minister of Finance can court foreign investment.'; end if;
  v_host := v_p.nation_id;

  select * into v_corp from public.corporations where id = p_corp;
  if not found or v_corp.status <> 'placed' then raise exception 'That firm is not open for expansion.'; end if;
  if v_corp.nation_id = v_host then raise exception 'That is a domestic firm — foreign investment comes from abroad.'; end if;
  if exists (select 1 from public.sanctions sa where coalesce(sa.active, false)
       and ((sa.by_nation = v_corp.nation_id and sa.target_nation = v_host)
         or (sa.by_nation = v_host and sa.target_nation = v_corp.nation_id))) then
    raise exception 'Sanctions bar investment between your nation and the firm''s home.'; end if;
  if exists (select 1 from public.fdi_deals d
       where d.corp_id = p_corp and d.host_nation_id = v_host and d.state in ('PENDING', 'ACTIVE')) then
    raise exception 'That firm already has a live deal in your nation.'; end if;

  v_temp := public._fdi_temperature(p_incentives);
  v_clim := public._fdi_climate(v_host);
  v_tier := public._corp_fdi_tier(v_corp.size);
  v_ceil := public._fdi_tier_ceiling(v_clim, v_temp);
  if v_tier > v_ceil then
    raise exception 'Your climate (%) and package can''t attract a tier-% suitor — sweeten the incentives.', round(v_clim), v_tier; end if;

  select current_tick into v_tick from public.game_state where id;
  insert into public.fdi_deals (state, corp_id, host_nation_id, owner_nation_id, incentives, temperature,
                                host_growth, owner_growth, hex_q, hex_r, decision_tick)
    values ('PENDING', p_corp, v_host, v_corp.nation_id, coalesce(p_incentives, '{}'), v_temp,
            public._fdi_growth_for(v_tier), 2, p_hex_q, p_hex_r, v_tick + 2)
    returning id into v_deal;

  select name into v_oname from public.nations where id = v_corp.nation_id;
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_host, v_p.id, 'economy',
            v_p.name || ' extended an investment invitation to ' || v_corp.name || ' of ' ||
            coalesce(v_oname, v_corp.nation_id) || '. The board decides within two ticks.',
            public.current_game_date());
  return jsonb_build_object('ok', true, 'deal', v_deal, 'tier', v_tier, 'decides_tick', v_tick + 2);
end $$;
grant execute on function public.court_foreign_investment(uuid, text[], int, int) to authenticated;

notify pgrst, 'reload schema';
