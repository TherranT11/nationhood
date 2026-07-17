-- ===========================================================================
-- 263 · FDI Phase 2 — Renegotiate the incentive package on a standing deal.
--
-- The host's Minister of Finance re-opens the incentive package on an ACTIVE deal (1 AP). The new
-- package's temperature is recomputed against the CURRENT investment climate and the board re-decides
-- deterministically:
--   • New package still supports the corp's tier (ceiling >= tier) → the corp accepts. The deal's
--     incentives + temperature update in place. Relations with the owner nation shift by the direction
--     of the change: sweetened (temp up) → +1, clawed back (temp down) → −1, unchanged → none.
--   • Host clawed back too far (ceiling drops below the corp's tier) → the corp DEPARTS: the one end
--     path (_end_fdi_deal 'DEPARTED', schema/245) fires — Growth stops the same tick (it's derived) and
--     the host/owner/world feeds are notified — plus a −2 relations hit for driving the firm out.
--
-- The corp's tier is fixed by its size, so host_growth never moves here — renegotiation trades in
-- terms + relations + departure risk, not Growth. Reuses every existing helper (no new mechanics).
-- Depends on: 243 (fdi_deals), 244 (_fdi_temperature/_fdi_climate/_fdi_tier_ceiling/_corp_fdi_tier),
-- 245 (_end_fdi_deal), 137 (_relation_adjust), 40 (_begin_action/events), 114 (_party_holds_ministry).
-- Idempotent.
-- ===========================================================================

set check_function_bodies = off;

create or replace function public.renegotiate_fdi_deal(p_deal uuid, p_incentives text[])
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_p public.parties%rowtype; v_d public.fdi_deals%rowtype; v_corp public.corporations%rowtype;
  v_new text[]; v_newtemp int; v_clim numeric; v_tier int; v_ceil int; v_cname text; v_oname text;
begin
  v_p := public._begin_action(0);   -- lock caller's party + spend 1 Action Point
  if not public._party_holds_ministry(v_p.id, 'Treasury') then
    raise exception 'Only the Minister of Finance can renegotiate a foreign investment.'; end if;

  select * into v_d from public.fdi_deals where id = p_deal for update;
  if not found or v_d.state <> 'ACTIVE' then
    raise exception 'There is no active deal to renegotiate.'; end if;
  if v_d.host_nation_id <> v_p.nation_id then
    raise exception 'You can only renegotiate deals inside your own nation.'; end if;

  v_new := coalesce(p_incentives, '{}');
  -- No-op guard: reject an unchanged package so the action isn't spent for nothing (set equality).
  if v_new <@ v_d.incentives and v_d.incentives <@ v_new then
    raise exception 'Those are already the terms in force — change the package to renegotiate.'; end if;

  select * into v_corp from public.corporations where id = v_d.corp_id;
  v_tier    := public._corp_fdi_tier(v_corp.size);
  v_newtemp := public._fdi_temperature(v_new);
  v_clim    := public._fdi_climate(v_d.host_nation_id);
  v_ceil    := public._fdi_tier_ceiling(v_clim, v_newtemp);
  v_cname   := coalesce(v_corp.name, 'The investor');
  select name into v_oname from public.nations where id = v_d.owner_nation_id;

  if v_tier > v_ceil then
    -- Clawed back below what a tier-N firm will tolerate → it walks.
    perform public._relation_adjust(v_d.host_nation_id, v_d.owner_nation_id, -2);
    perform public._end_fdi_deal(p_deal, 'DEPARTED');   -- emits host/owner/world feeds; Growth stops (derived)
    return jsonb_build_object('ok', true, 'departed', true);
  end if;

  -- The corp accepts the new terms. Update in place; relations follow the direction of the change.
  update public.fdi_deals set incentives = v_new, temperature = v_newtemp where id = p_deal;
  if v_newtemp > v_d.temperature then
    perform public._relation_adjust(v_d.host_nation_id, v_d.owner_nation_id, 1);
  elsif v_newtemp < v_d.temperature then
    perform public._relation_adjust(v_d.host_nation_id, v_d.owner_nation_id, -1);
  end if;

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_d.host_nation_id, v_p.id, 'economy',
            v_p.name || ' renegotiated the terms with ' || v_cname
              || (case when v_newtemp > v_d.temperature then ' — a sweeter package keeps ' || coalesce(v_oname, v_d.owner_nation_id) || ' onside.'
                       when v_newtemp < v_d.temperature then ' — concessions clawed back; the firm stays, grudgingly.'
                       else ' — the package was reshuffled at the same terms.' end),
            public.current_game_date());
  return jsonb_build_object('ok', true, 'departed', false, 'temperature', v_newtemp);
end $$;
grant execute on function public.renegotiate_fdi_deal(uuid, text[]) to authenticated;

notify pgrst, 'reload schema';
