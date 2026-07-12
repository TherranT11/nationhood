-- ===========================================================================
-- 191 · International Organizations — cancel a charter still in founding.
--
-- The host's Foreign Affairs minister may abandon an organization that hasn't been ratified yet: the
-- org row is deleted and its invitations, charter votes, floor messages (and any laws) cascade away
-- with it. Only the HOST nation, only while status = 'founding' (a ratified org is a real body — it is
-- not torn down from this page). Free (it's an abort, not a productive action). The $0.2bn/invite
-- outreach already spent is NOT refunded — the couriers rode regardless.
--
-- Depends on: 186 (organizations + cascading children), 40 (_party_holds_ministry via 114, events,
-- current_game_date), 20 (parties). Idempotent.
-- ===========================================================================

create or replace function public.cancel_organization(p_org uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid; v_pid uuid; v_nation text; v_host text; v_status text; v_name text; v_pname text;
begin
  v_uid := auth.uid(); if v_uid is null then raise exception 'Not signed in.'; end if;
  select id, nation_id, name into v_pid, v_nation, v_pname from public.parties where user_id = v_uid;
  if v_pid is null then raise exception 'You have no party.'; end if;

  select status, host_nation, name into v_status, v_host, v_name from public.organizations where id = p_org;
  if not found then raise exception 'No such organization.'; end if;
  if v_host is distinct from v_nation then raise exception 'Only the host nation can cancel this charter.'; end if;
  if not public._party_holds_ministry(v_pid, 'Foreign Affairs') then
    raise exception 'Only the Minister of Foreign Affairs can cancel the charter.'; end if;
  if v_status <> 'founding' then raise exception 'A ratified organization cannot be cancelled.'; end if;

  delete from public.organizations where id = p_org;   -- cascades members, invitations, charter votes, floor messages, laws

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_nation, v_pid, 'party', v_pname || ' abandoned the charter of ' || left(v_name, 48) || ' before it was founded.',
            public.current_game_date());
end $$;
grant execute on function public.cancel_organization(uuid) to authenticated;

notify pgrst, 'reload schema';
