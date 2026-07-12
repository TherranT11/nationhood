-- ===========================================================================
-- 192 · International Organizations — an invited nation leaves the charter talks.
--
-- A nation that was invited to a FOUNDING organization (still pending, or already accepted) may withdraw
-- from the convention: it's removed from the membership and its charter votes are dropped, and its
-- invitation is marked 'declined'. The organization itself carries on — this only pulls the one nation
-- out (unlike the host's cancel_organization, schema/191, which deletes the whole thing). The host can't
-- leave its own charter (it cancels instead). Only the invited nation's Foreign Affairs minister, only
-- while the org is 'founding'. Free.
--
-- Depends on: 186 (organizations/_members/_invitations), 189 (charter votes), 40 (_party_holds_ministry
-- via 114, events, current_game_date), 20 (parties). Idempotent.
-- ===========================================================================

create or replace function public.leave_charter(p_org uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid; v_pid uuid; v_nation text; v_host text; v_status text; v_name text; v_pname text; v_inv text;
begin
  v_uid := auth.uid(); if v_uid is null then raise exception 'Not signed in.'; end if;
  select id, nation_id, name into v_pid, v_nation, v_pname from public.parties where user_id = v_uid;
  if v_pid is null then raise exception 'You have no party.'; end if;
  if not public._party_holds_ministry(v_pid, 'Foreign Affairs') then
    raise exception 'Only the Minister of Foreign Affairs can leave the charter talks.'; end if;

  select status, host_nation, name into v_status, v_host, v_name from public.organizations where id = p_org;
  if not found then raise exception 'No such organization.'; end if;
  if v_status <> 'founding' then raise exception 'This organization is no longer in its charter convention.'; end if;
  if v_host = v_nation then raise exception 'The host cannot leave its own charter — cancel it instead.'; end if;

  -- Must actually be part of the talks: a seated member, or holding an unsettled invitation.
  select status into v_inv from public.organization_invitations where org_id = p_org and nation_id = v_nation;
  if not exists (select 1 from public.organization_members where org_id = p_org and nation_id = v_nation)
     and coalesce(v_inv, 'declined') not in ('pending', 'accepted') then
    raise exception 'Your nation is not part of these charter talks.'; end if;

  delete from public.organization_members       where org_id = p_org and nation_id = v_nation;
  delete from public.organization_charter_votes where org_id = p_org and nation_id = v_nation;
  update public.organization_invitations set status = 'declined' where org_id = p_org and nation_id = v_nation;

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_nation, v_pid, 'party', v_pname || ' withdrew from the ' || left(v_name, 48) || ' charter talks.',
            public.current_game_date());
end $$;
grant execute on function public.leave_charter(uuid) to authenticated;

notify pgrst, 'reload schema';
