-- ===========================================================================
-- 198 · International Organizations — accession by application (post-founding).
--
-- Once an org is ACTIVE and its charter sets Accession = 'open', any non-member nation's Foreign Affairs
-- minister may APPLY for membership. The application goes to a vote of the current voting members (the
-- same body that legislates): each member's FA minister casts one of three votes — admit as MEMBER, admit
-- as OBSERVER, or REJECT. The moment one option reaches a strict majority of voting members it resolves;
-- an admit seats the applicant (role 'member' or 'observer'), a reject closes it. If no option carries
-- within 6 ticks the application AUTO-FAILS (expires) — the only tick automation here, wired into
-- _advance_tick (schema/60). Observers hold no vote and get none of the economic law benefits (schema/197).
--
-- Modeled on the law-vote lifecycle (schema/190) and the invitation flow (schema/188). Depends on: 186
-- (organizations/_members), 189 (charter_articles.accession), 40 (_begin_action, is/holds ministry,
-- events, current_game_date), 05 (game_state). Idempotent.
-- ===========================================================================

-- One application per (org, applicant). status: pending | member | observer | rejected | expired.
create table if not exists public.organization_applications (
  org_id        uuid not null references public.organizations (id) on delete cascade,
  nation_id     text not null references public.nations (id)       on delete cascade,
  status        text not null default 'pending',
  created_tick  int,
  resolved_tick int,
  created_at    timestamptz not null default now(),
  primary key (org_id, nation_id)
);
create index if not exists organization_applications_org_idx on public.organization_applications (org_id, status);

-- One vote per (org, applicant, voter). choice: member | observer | reject. Cleared when the app resolves.
create table if not exists public.organization_application_votes (
  org_id           uuid not null,
  applicant_nation text not null,
  voter_nation     text not null references public.nations (id) on delete cascade,
  choice           text not null,
  created_at       timestamptz not null default now(),
  primary key (org_id, applicant_nation, voter_nation),
  foreign key (org_id, applicant_nation) references public.organization_applications (org_id, nation_id) on delete cascade
);

-- The application register is public (like the invitation/law register); the running vote tally is
-- member-only (internal deliberation), mirroring law votes.
alter table public.organization_applications      enable row level security;
alter table public.organization_application_votes enable row level security;
drop policy if exists "org_apps_select_all" on public.organization_applications;
create policy "org_apps_select_all" on public.organization_applications for select using (true);
drop policy if exists "org_app_votes_select_member" on public.organization_application_votes;
create policy "org_app_votes_select_member" on public.organization_application_votes for select using (
  exists (select 1 from public.organization_members m join public.parties p on p.nation_id = m.nation_id
           where m.org_id = organization_application_votes.org_id and p.user_id = auth.uid()));

-- Resolve an application: the moment MEMBER, OBSERVER, or REJECT reaches a strict majority of the org's
-- voting members it carries. An admit seats the applicant with that role; a reject closes it. Clears the
-- tally on resolution. Internal — called after each vote (and re-entrant: a resolved app is a no-op).
create or replace function public._org_resolve_application(p_org uuid, p_applicant text)
returns void language plpgsql security definer set search_path = public as $$
declare v_voters int; v_need int; v_tick int; v_win text; v_role text; v_aname text;
begin
  if (select status from public.organization_applications where org_id = p_org and nation_id = p_applicant) <> 'pending' then
    return; end if;   -- already resolved
  -- Voting members only (observers don't vote).
  select count(*) into v_voters from public.organization_members where org_id = p_org and coalesce(role, 'member') <> 'observer';
  v_need := (v_voters / 2) + 1;
  select choice into v_win
    from public.organization_application_votes
   where org_id = p_org and applicant_nation = p_applicant
   group by choice having count(*) >= v_need
   order by count(*) desc limit 1;
  if v_win is null then return; end if;   -- no option carries yet

  select current_tick into v_tick from public.game_state where id;
  update public.organization_applications
     set status = case v_win when 'member' then 'member' when 'observer' then 'observer' else 'rejected' end,
         resolved_tick = v_tick
   where org_id = p_org and nation_id = p_applicant;
  delete from public.organization_application_votes where org_id = p_org and applicant_nation = p_applicant;

  if v_win in ('member', 'observer') then
    insert into public.organization_members (org_id, nation_id, role, joined_tick)
      values (p_org, p_applicant, v_win, v_tick) on conflict (org_id, nation_id) do update set role = excluded.role;
  end if;

  v_aname := coalesce((select name from public.nations where id = p_applicant), p_applicant);
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (p_applicant, null, 'party',
      case v_win when 'member'   then v_aname || ' was admitted to ' || coalesce((select name from public.organizations where id = p_org), 'an organization') || ' as a full member.'
                 when 'observer' then v_aname || ' was admitted to ' || coalesce((select name from public.organizations where id = p_org), 'an organization') || ' as an observer.'
                 else v_aname || '’s application to ' || coalesce((select name from public.organizations where id = p_org), 'an organization') || ' was rejected.' end,
      public.current_game_date());
end $$;
revoke all on function public._org_resolve_application(uuid, text) from public, anon, authenticated;

-- apply_for_membership: a non-member nation's Foreign Affairs minister applies to an ACTIVE, OPEN org.
-- Opens a pending application (6-tick clock). 1 AP. Re-applying after a past reject/expiry is allowed.
create or replace function public.apply_for_membership(p_org uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; v_nation text; v_tick int; v_status text; v_acc text; v_name text; v_cur text;
begin
  select status, charter_articles->>'accession', name into v_status, v_acc, v_name from public.organizations where id = p_org;
  if not found then raise exception 'No such organization.'; end if;
  if v_status <> 'active' then raise exception 'That organization is not yet open to applications.'; end if;
  if coalesce(v_acc, 'closed') <> 'open' then raise exception 'This is a closed organization — membership is by invitation only.'; end if;

  v_p := public._begin_action(0);   -- lock caller's party + spend 1 Action Point
  v_nation := v_p.nation_id;
  if not public._party_holds_ministry(v_p.id, 'Foreign Affairs') then
    raise exception 'Only the Minister of Foreign Affairs can apply for membership.'; end if;
  if exists (select 1 from public.organization_members where org_id = p_org and nation_id = v_nation) then
    raise exception 'Your nation already belongs to this organization.'; end if;

  select status into v_cur from public.organization_applications where org_id = p_org and nation_id = v_nation for update;
  if v_cur = 'pending' then raise exception 'Your application is already before the Assembly.'; end if;

  select current_tick into v_tick from public.game_state where id;
  insert into public.organization_applications (org_id, nation_id, status, created_tick)
    values (p_org, v_nation, 'pending', v_tick)
    on conflict (org_id, nation_id) do update set status = 'pending', created_tick = v_tick, resolved_tick = null;
  delete from public.organization_application_votes where org_id = p_org and applicant_nation = v_nation;

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_nation, v_p.id, 'party',
      coalesce((select name from public.nations where id = v_nation), v_nation) || ' applied to join ' || left(v_name, 48) || '.',
      public.current_game_date());
end $$;
grant execute on function public.apply_for_membership(uuid) to authenticated;

-- vote_application: a voting member's Foreign Affairs minister votes on an applicant — 'member',
-- 'observer' or 'reject'. Resolves the moment an option carries a majority. Free (like a law vote).
create or replace function public.vote_application(p_org uuid, p_applicant text, p_choice text)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid; v_pid uuid; v_nation text; v_status text;
begin
  v_uid := auth.uid(); if v_uid is null then raise exception 'Not signed in.'; end if;
  if p_choice not in ('member', 'observer', 'reject') then raise exception 'Invalid choice.'; end if;
  select id, nation_id into v_pid, v_nation from public.parties where user_id = v_uid;
  if v_pid is null then raise exception 'You have no party.'; end if;
  if not public._party_holds_ministry(v_pid, 'Foreign Affairs') then
    raise exception 'Only the Minister of Foreign Affairs casts your nation''s vote.'; end if;
  -- Must be a VOTING member (observers don't vote).
  if not exists (select 1 from public.organization_members where org_id = p_org and nation_id = v_nation and coalesce(role, 'member') <> 'observer') then
    raise exception 'Only a voting member may decide applications.'; end if;

  -- Lock the application row: serialise concurrent votes so each tally sees every committed vote.
  select status into v_status from public.organization_applications where org_id = p_org and nation_id = p_applicant for update;
  if v_status is null then raise exception 'No such application.'; end if;
  if v_status <> 'pending' then raise exception 'That application has already been decided.'; end if;

  insert into public.organization_application_votes (org_id, applicant_nation, voter_nation, choice)
    values (p_org, p_applicant, v_nation, p_choice)
    on conflict (org_id, applicant_nation, voter_nation) do update set choice = excluded.choice, created_at = now();

  perform public._org_resolve_application(p_org, p_applicant);
end $$;
grant execute on function public.vote_application(uuid, text, text) to authenticated;

-- Auto-fail: a pending application older than 6 ticks expires. Called once per tick from _advance_tick
-- (schema/60). A plain UPDATE — isolated and side-effect-free, so it can never abort the tick.
create or replace function public._org_expire_applications()
returns void language plpgsql security definer set search_path = public as $$
declare v_tick int;
begin
  select current_tick into v_tick from public.game_state where id;
  update public.organization_applications
     set status = 'expired', resolved_tick = v_tick
   where status = 'pending' and v_tick - coalesce(created_tick, v_tick) >= 6;
end $$;
revoke all on function public._org_expire_applications() from public, anon, authenticated;

notify pgrst, 'reload schema';
