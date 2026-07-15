-- ===========================================================================
-- 224 · Resource-sector org laws require the org to govern a resource.
--
-- The Resource sector's laws (Emergency Reserves / Joint Pricing / Survey Sharing) price or pool the
-- organization's GOVERNED resource. propose_org_law (schema/190) only enforced that for Joint Pricing,
-- so Emergency Reserves and Survey Sharing could be moved (and enacted) on an org that governs no
-- resource — e.g. a Security/Military treaty like NMTO showing an enacted "Emergency Reserves".
--
--   • Gate the WHOLE 'res' sector: any Resource law needs organizations.resource set.
--   • One-time cleanup: repeal every Resource-sector law (and its votes) already on an org that governs
--     no resource — removes the errant NMTO Emergency Reserves and any similar leftovers.
--
-- The frontend already greys the Resource sector for a resourceless org (play/organization); this makes
-- the SERVER authoritative to match. Only change from 190 is the sector-wide gate. Depends on: 190
-- (propose_org_law, organization_laws, organization_law_votes), 186 (organizations.resource). Idempotent.
-- ===========================================================================

set check_function_bodies = off;

create or replace function public.propose_org_law(p_org uuid, p_sector text, p_law text, p_param jsonb default '{}')
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid; v_pid uuid; v_nation text; v_status text; v_cat jsonb; v_tick int; v_cur text;
  v_cohesion numeric; v_cost numeric; v_param jsonb := '{}'; v_price int;
begin
  v_uid := auth.uid(); if v_uid is null then raise exception 'Not signed in.'; end if;
  select id, nation_id into v_pid, v_nation from public.parties where user_id = v_uid;
  if v_pid is null then raise exception 'You have no party.'; end if;
  if not public._party_holds_ministry(v_pid, 'Foreign Affairs') then
    raise exception 'Only the Minister of Foreign Affairs may move a law.'; end if;

  select status, cohesion into v_status, v_cohesion from public.organizations where id = p_org;
  if not found then raise exception 'No such organization.'; end if;
  if v_status <> 'active' then raise exception 'Only a founded organization legislates.'; end if;
  if not exists (select 1 from public.organization_members where org_id = p_org and nation_id = v_nation and coalesce(role, 'member') <> 'observer') then
    raise exception 'Only a voting member may move a law.'; end if;

  v_cat := public._org_law_catalog();
  if not (v_cat ? p_sector) or not (v_cat->p_sector @> to_jsonb(p_law)) then
    raise exception 'No such law.'; end if;

  -- Every Resource-sector law prices/pools the org's governed resource — an org that governs none can't
  -- move ANY of them (was only enforced for Joint Pricing before).
  if p_sector = 'res' and not exists (select 1 from public.organizations where id = p_org and resource is not null) then
    raise exception 'This organization governs no resource — its Resource-sector laws don''t apply.'; end if;

  -- Affordability: the pool must already cover the cost (spent on enact). Guard here so a doomed law
  -- never reaches the floor.
  v_cost := public._org_law_cost(p_sector, p_law);
  if coalesce(v_cohesion, 0) < v_cost then
    raise exception 'The organization needs % Cohesion to move this law (it has %).', v_cost, round(coalesce(v_cohesion, 0), 1); end if;

  -- Joint Pricing carries an agreed unit price ($1–$30). Other laws take no parameter.
  if p_sector = 'res' and p_law = 'pricing' then
    v_price := round(coalesce((p_param->>'price')::numeric, 0));
    if v_price < 1 or v_price > 30 then raise exception 'Set a joint price between $1 and $30.'; end if;
    v_param := jsonb_build_object('price', v_price);
  end if;

  select status into v_cur from public.organization_laws where org_id = p_org and sector = p_sector and law_id = p_law for update;   -- lock any existing row (serialise with concurrent votes/re-proposes)
  if v_cur = 'proposed' then raise exception 'That law is already on the Agenda.'; end if;
  if v_cur = 'enacted' then raise exception 'That law is already enacted.'; end if;

  select current_tick into v_tick from public.game_state where id;
  insert into public.organization_laws (org_id, sector, law_id, status, proposed_by, proposed_tick, param)
    values (p_org, p_sector, p_law, 'proposed', v_nation, v_tick, v_param)
    on conflict (org_id, sector, law_id) do update set status = 'proposed', proposed_by = v_nation, proposed_tick = v_tick, resolved_tick = null, param = v_param;
  delete from public.organization_law_votes where org_id = p_org and sector = p_sector and law_id = p_law;   -- fresh Agenda item
  insert into public.organization_law_votes (org_id, sector, law_id, nation_id, vote) values (p_org, p_sector, p_law, v_nation, 'aye')
    on conflict (org_id, sector, law_id, nation_id) do update set vote = 'aye', created_at = now();

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_nation, v_pid, 'party',
      (select name from public.parties where id = v_pid) || ' moved a resolution before ' ||
      coalesce((select name from public.organizations where id = p_org), 'an organization') || '.',
      public.current_game_date());

  perform public._org_resolve_law(p_org, p_sector, p_law);   -- (a lone Aye can't carry a ≥3-member org)
end $$;
grant execute on function public.propose_org_law(uuid, text, text, jsonb) to authenticated;

-- One-time cleanup: repeal Resource-sector laws (and their votes) on any org that governs no resource.
delete from public.organization_law_votes v using public.organizations o
 where v.org_id = o.id and v.sector = 'res' and o.resource is null;
delete from public.organization_laws l using public.organizations o
 where l.org_id = o.id and l.sector = 'res' and o.resource is null;

notify pgrst, 'reload schema';
