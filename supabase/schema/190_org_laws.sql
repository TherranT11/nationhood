-- ===========================================================================
-- 190 · International Organizations — the Laws of the Assembly (Level I).
--
-- An ACTIVE org legislates. A member's Foreign Affairs minister PROPOSES a Level I law from one of six
-- sectors; it goes on the Agenda as an open vote; members vote Aye/Nay; the law is ENACTED the moment a
-- STRICT MAJORITY of current members have voted Aye (and REJECTED once a majority vote Nay). All
-- player-driven — no ticks, no "session" clock, no Cohesion cost yet (proposing is free for now; the
-- deferred Cohesion pass will gate it). A passed law is an ENACTED RECORD for now — its mechanical effect
-- on member nations is a later per-law pass (the charter articles are display-only in the same way).
--
-- Levels II–V and their age-gated unlocks are deferred (they need the org-age timer) — only Level I is
-- proposable here. Depends on: 186 (organizations/_members), 188/189 (org RPC patterns), 40
-- (_party_holds_ministry via 114, events, current_game_date), 05 (game_state), 20 (parties). Idempotent.
-- ===========================================================================

-- The valid sectors and their Level I law ids — the ONE source, read by proposal validation (labels +
-- descriptions live on the client, which the server never trusts). Mirrors the mockup's six branches.
create or replace function public._org_law_catalog()
returns jsonb language sql immutable set search_path = public as $$
  select jsonb_build_object(
    'gov', jsonb_build_array('secretariat', 'sessions', 'chapters'),
    'eco', jsonb_build_array('tariff', 'fair', 'ports'),
    'dip', jsonb_build_array('recognition', 'legations', 'bloc'),
    'mil', jsonb_build_array('nonaggression', 'officer', 'exercises'),
    'fin', jsonb_build_array('settlement', 'devpool', 'debt'),
    'res', jsonb_build_array('survey', 'reserves', 'pricing')
  );
$$;

-- The Cohesion a Level I law spends from its org's pool when enacted (schema/197). Only the Resource
-- sector is costed for now (its laws have live mechanical effects); every other sector is free until its
-- effects land. ONE source — read by the propose-time affordability gate and the enact-time spend below.
create or replace function public._org_law_cost(p_sector text, p_law text)
returns numeric language sql immutable set search_path = public as $$
  select case when p_sector = 'res' then
    case p_law when 'pricing' then 20 when 'survey' then 40 when 'reserves' then 10 else 0 end
  else 0 end;
$$;

-- One law per (org, sector, law) — its life is proposed → enacted | rejected. A rejected law may be
-- proposed afresh (the row is reset). proposed_by is the nation that moved it.
create table if not exists public.organization_laws (
  org_id        uuid not null references public.organizations (id) on delete cascade,
  sector        text not null,
  law_id        text not null,
  status        text not null default 'proposed',   -- 'proposed' | 'enacted' | 'rejected'
  proposed_by   text references public.nations (id) on delete set null,
  proposed_tick int,
  resolved_tick int,
  created_at    timestamptz not null default now(),
  primary key (org_id, sector, law_id)
);
create index if not exists organization_laws_org_idx on public.organization_laws (org_id);
-- Per-law parameters set at propose time (schema/197) — currently just Joint Pricing's agreed unit price
-- ({"price": N}, $1–$30). Empty for laws that carry no parameter.
alter table public.organization_laws add column if not exists param jsonb not null default '{}';

-- Aye/Nay votes on a law that's on the Agenda. Cleared when the law resolves (or is re-proposed).
create table if not exists public.organization_law_votes (
  org_id     uuid not null,
  sector     text not null,
  law_id     text not null,
  nation_id  text not null references public.nations (id) on delete cascade,
  vote       text not null,   -- 'aye' | 'nay'
  created_at timestamptz not null default now(),
  primary key (org_id, sector, law_id, nation_id),
  foreign key (org_id, sector, law_id) references public.organization_laws (org_id, sector, law_id) on delete cascade
);

-- The law register is public (an org's laws are public knowledge); the running Aye/Nay tally is
-- member-only (internal deliberation), mirroring charter articles vs charter votes.
alter table public.organization_laws      enable row level security;
alter table public.organization_law_votes enable row level security;
drop policy if exists "org_laws_select_all" on public.organization_laws;
create policy "org_laws_select_all" on public.organization_laws for select using (true);
drop policy if exists "org_law_votes_select_member" on public.organization_law_votes;
create policy "org_law_votes_select_member" on public.organization_law_votes for select using (
  exists (select 1 from public.organization_members m join public.parties p on p.nation_id = m.nation_id
           where m.org_id = organization_law_votes.org_id and p.user_id = auth.uid()));

-- Resolve a law on the Agenda: enact it once a STRICT MAJORITY of current members have voted Aye, reject
-- it once a majority have voted Nay, else leave it open. Clears the vote tally on resolution. Internal —
-- called by propose (after the mover's auto-Aye) and by every vote.
create or replace function public._org_resolve_law(p_org uuid, p_sector text, p_law text)
returns void language plpgsql security definer set search_path = public as $$
declare v_members int; v_need int; v_aye int; v_nay int; v_tick int; v_enact boolean;
begin
  select count(*) into v_members from public.organization_members where org_id = p_org;
  v_need := (v_members / 2) + 1;   -- strict majority of current members
  select count(*) filter (where vote = 'aye'), count(*) filter (where vote = 'nay')
    into v_aye, v_nay from public.organization_law_votes where org_id = p_org and sector = p_sector and law_id = p_law;
  if v_aye >= v_need or v_nay >= v_need then
    select current_tick into v_tick from public.game_state where id;
    v_enact := v_aye >= v_need;
    update public.organization_laws
       set status = case when v_enact then 'enacted' else 'rejected' end, resolved_tick = v_tick
     where org_id = p_org and sector = p_sector and law_id = p_law;
    delete from public.organization_law_votes where org_id = p_org and sector = p_sector and law_id = p_law;
    -- Enacting spends the law's Cohesion from the org pool (floored at 0). The propose-time gate already
    -- required the pool to cover it; a member leaving mid-vote (−5) is the only way it can fall short.
    if v_enact then
      update public.organizations
         set cohesion = greatest(0, cohesion - public._org_law_cost(p_sector, p_law))
       where id = p_org;
    end if;
  end if;
end $$;
revoke all on function public._org_resolve_law(uuid, text, text) from public, anon, authenticated;

-- propose_org_law: a member's Foreign Affairs minister moves a Level I law onto the Agenda. The mover is
-- recorded Aye (proposing is supporting). Rejects a law already proposed or enacted. The org's Cohesion
-- pool must already cover the law's cost (it's spent on ENACT, not here). p_param carries a law's
-- parameters — for Joint Pricing ('res'/'pricing') the agreed unit price, validated to $1–$30.
drop function if exists public.propose_org_law(uuid, text, text);   -- superseded: adds p_param
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
  if not exists (select 1 from public.organization_members where org_id = p_org and nation_id = v_nation) then
    raise exception 'Only a member may move a law.'; end if;

  v_cat := public._org_law_catalog();
  if not (v_cat ? p_sector) or not (v_cat->p_sector @> to_jsonb(p_law)) then
    raise exception 'No such law.'; end if;

  -- Affordability: the pool must already cover the cost (spent on enact). Guard here so a doomed law
  -- never reaches the floor.
  v_cost := public._org_law_cost(p_sector, p_law);
  if coalesce(v_cohesion, 0) < v_cost then
    raise exception 'The organization needs % Cohesion to move this law (it has %).', v_cost, round(coalesce(v_cohesion, 0), 1); end if;

  -- Joint Pricing carries an agreed unit price ($1–$30); a Resource org must have named a commodity for it
  -- to price. Other laws take no parameter.
  if p_sector = 'res' and p_law = 'pricing' then
    if not exists (select 1 from public.organizations where id = p_org and resource is not null) then
      raise exception 'This organization governs no resource — it has nothing to price.'; end if;
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

-- vote_org_law: a member's Foreign Affairs minister votes Aye/Nay on an Agenda item; the law resolves
-- the moment a majority is reached. Free.
create or replace function public.vote_org_law(p_org uuid, p_sector text, p_law text, p_aye boolean)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid; v_pid uuid; v_nation text; v_status text;
begin
  v_uid := auth.uid(); if v_uid is null then raise exception 'Not signed in.'; end if;
  select id, nation_id into v_pid, v_nation from public.parties where user_id = v_uid;
  if v_pid is null then raise exception 'You have no party.'; end if;
  if not public._party_holds_ministry(v_pid, 'Foreign Affairs') then
    raise exception 'Only the Minister of Foreign Affairs casts your nation''s vote.'; end if;
  if not exists (select 1 from public.organization_members where org_id = p_org and nation_id = v_nation) then
    raise exception 'Only a member may vote.'; end if;

  -- Lock the law row: serialises concurrent votes on the SAME law, so each vote's tally (in
  -- _org_resolve_law) sees every earlier committed vote — otherwise two simultaneous Ayes could each
  -- count before the other commits and a law with a majority could stall at 'proposed'.
  select status into v_status from public.organization_laws where org_id = p_org and sector = p_sector and law_id = p_law for update;
  if v_status is null then raise exception 'That law is not on the Agenda.'; end if;
  if v_status <> 'proposed' then raise exception 'That vote has already closed.'; end if;

  insert into public.organization_law_votes (org_id, sector, law_id, nation_id, vote)
    values (p_org, p_sector, p_law, v_nation, case when p_aye then 'aye' else 'nay' end)
    on conflict (org_id, sector, law_id, nation_id) do update set vote = excluded.vote, created_at = now();

  perform public._org_resolve_law(p_org, p_sector, p_law);
end $$;
grant execute on function public.vote_org_law(uuid, text, text, boolean) to authenticated;

notify pgrst, 'reload schema';
