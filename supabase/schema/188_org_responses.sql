-- ===========================================================================
-- 188 · International Organizations — the RESPONSE + RATIFICATION half.
--
-- Schema/186 laid the founding step: a host charters an org (status 'founding') and sends pending
-- invitations. This migration adds the two PLAYER-DRIVEN steps that carry it to 'active' — no timers,
-- no tick automation, every transition is a deliberate click:
--   • respond_invitation(org, accept) — the INVITED nation's Foreign Affairs minister accepts or
--     declines its pending invitation. Accepting seats the nation as a 'member'. Costs 1 AP.
--   • ratify_organization(org)        — the HOST nation's Foreign Affairs minister ratifies once at
--     least MIN_ACCEPT invitees have accepted, flipping the org to 'active' (founded). Costs 1 AP.
--
-- The Charter Convention (basic + first laws, the vote) is deliberately NOT built here — ratification
-- is a host decision gated only on acceptances, and the Convention is a later design pass.
--
-- Depends on: 186 (organizations/_members/_invitations, is_foreign_affairs_minister), 40
-- (_begin_action, events, current_game_date, _party_holds_ministry via 114), 05 (game_state). Idempotent.
-- ===========================================================================

-- respond_invitation: the invited nation answers. Its Foreign Affairs minister accepts (→ member) or
-- declines its own pending invitation. 1 AP. Security definer (sole writer of the response + membership).
create or replace function public.respond_invitation(p_org uuid, p_accept boolean)
returns void language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; v_nation text; v_tick int; v_status text; v_name text; v_have boolean;
begin
  -- Cheap content check first (no Action Point burned on a bad org id / already-settled org).
  select status, name into v_status, v_name from public.organizations where id = p_org;
  if not found then raise exception 'No such organization.'; end if;
  if v_status <> 'founding' then raise exception 'That organization is no longer taking responses.'; end if;

  v_p := public._begin_action(0);   -- lock caller's party + spend 1 Action Point
  v_nation := v_p.nation_id;
  if not public._party_holds_ministry(v_p.id, 'Foreign Affairs') then
    raise exception 'Only the Minister of Foreign Affairs can answer an invitation.'; end if;

  -- Must hold a still-pending invitation for this nation (lock it against a double answer).
  select true into v_have from public.organization_invitations
   where org_id = p_org and nation_id = v_nation and status = 'pending' for update;
  if not found then raise exception 'Your nation has no open invitation to this organization.'; end if;

  select current_tick into v_tick from public.game_state where id;
  if p_accept then
    update public.organization_invitations set status = 'accepted' where org_id = p_org and nation_id = v_nation;
    insert into public.organization_members (org_id, nation_id, role, joined_tick)
      values (p_org, v_nation, 'member', v_tick) on conflict (org_id, nation_id) do nothing;
  else
    update public.organization_invitations set status = 'declined' where org_id = p_org and nation_id = v_nation;
  end if;

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_nation, v_p.id, 'party',
      v_p.name || ' ' || (case when p_accept then 'accepted the invitation to join '
                                else 'declined the invitation to join ' end) || left(v_name, 48) || '.',
      public.current_game_date());
end $$;
grant execute on function public.respond_invitation(uuid, boolean) to authenticated;

-- ratify_organization: the host closes the founding. Its Foreign Affairs minister ratifies once at least
-- MIN_ACCEPT invitees have accepted; the org flips to 'active' and is dated to this tick (founded on
-- ratification). Members are already seated (founder + accepted). 1 AP. Security definer.
create or replace function public.ratify_organization(p_org uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; v_nation text; v_tick int; v_status text; v_host text; v_name text; v_acc int;
  c_min_accept constant int := 2;   -- at least this many invitees must accept before the host can ratify
begin
  select status, host_nation, name into v_status, v_host, v_name from public.organizations where id = p_org;
  if not found then raise exception 'No such organization.'; end if;
  if v_status <> 'founding' then raise exception 'That organization is already ratified.'; end if;

  v_p := public._begin_action(0);   -- lock caller's party + spend 1 Action Point
  v_nation := v_p.nation_id;
  if v_host is distinct from v_nation then raise exception 'Only the host nation can ratify this organization.'; end if;
  if not public._party_holds_ministry(v_p.id, 'Foreign Affairs') then
    raise exception 'Only the Minister of Foreign Affairs can ratify.'; end if;

  select count(*) into v_acc from public.organization_invitations where org_id = p_org and status = 'accepted';
  if v_acc < c_min_accept then
    raise exception 'At least % nations must accept before ratification (currently %).', c_min_accept, v_acc; end if;

  select current_tick into v_tick from public.game_state where id;
  update public.organizations set status = 'active', founded_tick = v_tick where id = p_org;

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_nation, v_p.id, 'party',
      left(v_name, 48) || ' is founded — ratified with ' || v_acc || ' founding member' ||
        (case when v_acc = 1 then '' else 's' end) || '.',
      public.current_game_date());
end $$;
grant execute on function public.ratify_organization(uuid) to authenticated;

notify pgrst, 'reload schema';
