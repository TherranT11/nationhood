-- ===========================================================================
-- 268 · FDI court event — frame it as the NATION, and say "two months" not "two ticks".
--
-- The invitation event read "The {party} extended an investment invitation to {corp} of {owner}. The
-- board decides within two ticks." Reword to "The nation of {host} extended an investment invitation to
-- {corp} of {owner}. The board decides within two months." (a tick is a month). Redefine of
-- court_foreign_investment (body verbatim from schema/244) with ONLY the event line changed.
-- Depends on: 244 (court_foreign_investment). Apply after 244. Idempotent.
-- ===========================================================================

set check_function_bodies = off;

create or replace function public.court_foreign_investment(p_corp uuid, p_incentives text[], p_hex_q int default null, p_hex_r int default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; v_host text; v_corp public.corporations%rowtype;
        v_temp int; v_clim numeric; v_tier int; v_ceil int; v_tick int; v_deal uuid; v_oname text; v_hname text;
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
  select name into v_hname from public.nations where id = v_host;
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_host, v_p.id, 'economy',
            'The nation of ' || coalesce(v_hname, v_host) || ' extended an investment invitation to ' || v_corp.name || ' of ' ||
            coalesce(v_oname, v_corp.nation_id) || '. The board decides within two months.',
            public.current_game_date());
  return jsonb_build_object('ok', true, 'deal', v_deal, 'tier', v_tier, 'decides_tick', v_tick + 2);
end $$;
grant execute on function public.court_foreign_investment(uuid, text[], int, int) to authenticated;

notify pgrst, 'reload schema';
