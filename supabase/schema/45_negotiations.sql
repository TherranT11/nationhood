-- 45 · Coalition negotiations (cross-player deal-making) + RPCs
-- Depends on: 10 (nations), 20 (parties), 40 (action helpers + current_game_date).
-- Run after 40.
--
-- DORMANT BUT LOAD-BEARING (post-teardown). The player-facing coalition actions that WROTE to
-- these tables were removed (schema/146), so in normal play the tables stay empty and government
-- formation falls through to the single-party path. Do NOT drop these tables or _majority() /
-- is_negotiation_participant(): _seat_government() and resolve_election() (schema/60) still read
-- negotiations / negotiation_parties / negotiation_terms, and governments.source_negotiation_id is
-- a live FK. Removing them means rewriting the seating + election resolver — deliberately deferred.

-- ---------------------------------------------------------------------------
-- A negotiation is opened by a HOST party and brings one or more other parties
-- (in the same nation) to the table. It is a SHARED, MULTI-DIRECTIONAL table:
-- every accepted party (host included) can put offers and requests on the table,
-- every term is visible to everyone present, and a term only counts once EVERY
-- party at the table has marked it agreed (full consensus). All writes go through
-- the security-definer RPCs below (no client insert/update grants), so action
-- costs and the participant-only rules can't be bypassed.
-- ---------------------------------------------------------------------------
create table if not exists public.negotiations (
  id            uuid primary key default gen_random_uuid(),
  nation_id     text not null references public.nations (id),
  host_party_id uuid not null references public.parties (id) on delete cascade,
  status        text not null default 'active',   -- active | committed | closed ('closed' reserved for the future election resolver)
  created_at    timestamptz not null default now()
);

-- The other parties at the table. status tracks the invite each player sees on
-- their Home screen: invited → accepted | declined.
create table if not exists public.negotiation_parties (
  id             uuid primary key default gen_random_uuid(),
  negotiation_id uuid not null references public.negotiations (id) on delete cascade,
  party_id       uuid not null references public.parties (id) on delete cascade,
  status         text not null default 'invited',  -- invited | accepted | declined
  created_at     timestamptz not null default now(),
  unique (negotiation_id, party_id)
);

-- One promise on the table. party_id is the AUTHOR — the party that proposed it.
-- side is from the author's view (offering = author gives; requesting = author
-- wants). A term is fully agreed only when every party at the table (host + each
-- accepted partner) has a row in negotiation_term_agreements for it.
create table if not exists public.negotiation_terms (
  id             uuid primary key default gen_random_uuid(),
  negotiation_id uuid not null references public.negotiations (id) on delete cascade,
  party_id       uuid not null references public.parties (id) on delete cascade,  -- author / proposer
  side           text not null,                    -- offering | requesting
  type           text not null default 'legislation',
  params         jsonb not null default '{}'::jsonb,
  redline        boolean not null default false,
  created_at     timestamptz not null default now()
);
-- Older deployments carried two-sided host_agreed/party_agreed flags here; the
-- consensus model below replaces them with one agreement row per party per term.
-- The legacy columns (if present) are simply unused — nothing reads them now.

-- One row per (term, party) the party has agreed to. Presence = agreed; deleting
-- the row withdraws agreement. Substance edits to a term clear its rows (prior
-- agreement no longer holds), re-seeding only the author's own agreement.
create table if not exists public.negotiation_term_agreements (
  id         uuid primary key default gen_random_uuid(),
  term_id    uuid not null references public.negotiation_terms (id) on delete cascade,
  party_id   uuid not null references public.parties (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (term_id, party_id)
);

create index if not exists negotiation_parties_neg_idx    on public.negotiation_parties (negotiation_id);
create index if not exists negotiation_parties_party_idx  on public.negotiation_parties (party_id);
create index if not exists negotiation_terms_neg_idx      on public.negotiation_terms (negotiation_id);
create index if not exists negotiation_term_agr_term_idx  on public.negotiation_term_agreements (term_id);
create index if not exists negotiation_term_agr_party_idx on public.negotiation_term_agreements (party_id);

-- A host may hold at most one committed agreement at a time — enforced at the DB
-- level so a concurrent double-commit can't slip two through (coalition_commit's
-- own check handles the normal case with a friendly message).
create unique index if not exists negotiations_one_committed_per_host
  on public.negotiations (host_party_id) where status = 'committed';

-- Is the signed-in user a participant in this negotiation (the host, or one of
-- the invited parties)? The single gate for every read policy below.
create or replace function public.is_negotiation_participant(p_neg uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.negotiations n
    join public.parties hp on hp.id = n.host_party_id
    where n.id = p_neg and hp.user_id = auth.uid()
  ) or exists (
    select 1 from public.negotiation_parties np
    join public.parties p on p.id = np.party_id
    where np.negotiation_id = p_neg and p.user_id = auth.uid()
  );
$$;
grant execute on function public.is_negotiation_participant(uuid) to authenticated;

-- The signed-in user's party that sits at this table (host or an INVITED-AND-
-- ACCEPTED partner), or null. The single source for "may I author / agree here?".
-- Pending and declined invitees are not yet contributors.
create or replace function public._my_seated_party(p_neg uuid)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select p.id from public.parties p
   where p.user_id = auth.uid()
     and ( p.id = (select host_party_id from public.negotiations where id = p_neg)
        or exists (select 1 from public.negotiation_parties np
                    where np.negotiation_id = p_neg and np.party_id = p.id and np.status = 'accepted') )
   limit 1;
$$;
grant execute on function public._my_seated_party(uuid) to authenticated;

-- Every party seated at the table (host + accepted partners) as a set of ids. The
-- ONE definition of "involved in the talks" — drives the consensus check + UI.
create or replace function public._negotiation_seats(p_neg uuid)
returns table (party_id uuid)
language sql
security definer
set search_path = public
stable
as $$
  select host_party_id from public.negotiations where id = p_neg
  union
  select np.party_id from public.negotiation_parties np
   where np.negotiation_id = p_neg and np.status = 'accepted';
$$;
grant execute on function public._negotiation_seats(uuid) to authenticated;

-- Reads: participants only. No insert/update/delete policies — writes are RPC-only.
alter table public.negotiations              enable row level security;
alter table public.negotiation_parties       enable row level security;
alter table public.negotiation_terms         enable row level security;
alter table public.negotiation_term_agreements enable row level security;

drop policy if exists "negotiations_select_part" on public.negotiations;
create policy "negotiations_select_part" on public.negotiations for select using (public.is_negotiation_participant(id));

-- The table is shared: every participant (host or invited) sees every party,
-- every term, and every agreement on it — so the whole table is visible to all.
drop policy if exists "neg_parties_select_part" on public.negotiation_parties;
create policy "neg_parties_select_part" on public.negotiation_parties for select
  using (public.is_negotiation_participant(negotiation_id));

drop policy if exists "neg_terms_select_part" on public.negotiation_terms;
create policy "neg_terms_select_part" on public.negotiation_terms for select
  using (public.is_negotiation_participant(negotiation_id));

drop policy if exists "neg_term_agr_select_part" on public.negotiation_term_agreements;
create policy "neg_term_agr_select_part" on public.negotiation_term_agreements for select using (
  exists (select 1 from public.negotiation_terms t
           where t.id = term_id and public.is_negotiation_participant(t.negotiation_id))
);

-- ---------------------------------------------------------------------------
-- RPCs. Authoring + agreement are open to any seated party (host or accepted
-- partner); inviting + committing stay host-only. open + invite + commit each
-- cost 1 action.
-- ---------------------------------------------------------------------------

-- The majority threshold for a chamber of p_seats: floor(p_seats/2)+1. ONE source
-- for the coalition-commit gate (below) and the election resolver in schema/60.
-- The JS client mirrors this for its live UI gate — an accepted JS↔SQL mirror.
create or replace function public._majority(p_seats int)
returns int
language sql
immutable
set search_path = public
as $$ select coalesce(p_seats, 0) / 2 + 1 $$;
grant execute on function public._majority(int) to authenticated;

-- A committed (or closed) agreement is immutable — the single rule + message for
-- every mutating RPC below, so a locked deal can't be edited from any path.
create or replace function public._assert_negotiation_open(p_neg uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.negotiations where id = p_neg and status = 'active') then
    raise exception 'These talks are locked (committed or closed).';
  end if;
end $$;
grant execute on function public._assert_negotiation_open(uuid) to authenticated;

-- Open talks with a first party (same nation). Free — the action cost is deferred
-- to bringing in more parties (coalition_invite) or locking the deal (coalition_commit),
-- so you can start a conversation and chat without spending an action.
create or replace function public.coalition_open(p_target uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_host public.parties%rowtype; v_target public.parties%rowtype; v_neg uuid;
begin
  v_host := public._lock_party();   -- locks host + stamps activity; no action charged
  select * into v_target from public.parties where id = p_target;
  if not found then raise exception 'That party no longer exists.'; end if;
  if v_target.id = v_host.id then raise exception 'You can''t negotiate with your own party.'; end if;
  if v_target.nation_id is distinct from v_host.nation_id then raise exception 'That party is in another nation.'; end if;

  insert into public.negotiations (nation_id, host_party_id) values (v_host.nation_id, v_host.id) returning id into v_neg;
  insert into public.negotiation_parties (negotiation_id, party_id) values (v_neg, p_target);
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_host.nation_id, v_host.id, 'coalition',
            'The ' || v_host.name || ' has opened coalition talks with the ' || v_target.name || '.',
            public.current_game_date());
  return jsonb_build_object('id', v_neg, 'actions', v_host.influence);
end $$;
grant execute on function public.coalition_open(uuid) to authenticated;

-- Bring another party to an existing table. Host only. Costs the host 1 action.
create or replace function public.coalition_invite(p_neg uuid, p_target uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_host public.parties%rowtype; v_target public.parties%rowtype; v_n public.negotiations%rowtype;
begin
  v_host := public._begin_action(0);
  select * into v_n from public.negotiations where id = p_neg;
  if not found then raise exception 'That negotiation is gone.'; end if;
  if v_n.host_party_id <> v_host.id then raise exception 'Only the host can invite parties.'; end if;
  if v_n.status <> 'active' then raise exception 'These talks are closed.'; end if;
  select * into v_target from public.parties where id = p_target;
  if not found then raise exception 'That party no longer exists.'; end if;
  if v_target.id = v_host.id then raise exception 'You''re already at the table.'; end if;
  if v_target.nation_id is distinct from v_host.nation_id then raise exception 'That party is in another nation.'; end if;
  if exists (select 1 from public.negotiation_parties where negotiation_id = p_neg and party_id = p_target) then
    raise exception 'They''re already at the table.';
  end if;

  insert into public.negotiation_parties (negotiation_id, party_id) values (p_neg, p_target);
  update public.parties set influence = influence - 1 where id = v_host.id;
  return jsonb_build_object('actions', v_host.influence - 1);
end $$;
grant execute on function public.coalition_invite(uuid, uuid) to authenticated;

-- An invited player accepts or declines. No action cost.
create or replace function public.coalition_respond(p_neg uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_np public.negotiation_parties%rowtype;
begin
  if auth.uid() is null then raise exception 'Not signed in.'; end if;
  select np.* into v_np
    from public.negotiation_parties np
    join public.parties p on p.id = np.party_id
   where np.negotiation_id = p_neg and p.user_id = auth.uid()
   for update;
  if not found then raise exception 'You have no invite to these talks.'; end if;
  perform public._assert_negotiation_open(p_neg);
  update public.negotiation_parties
     set status = case when p_accept then 'accepted' else 'declined' end
   where id = v_np.id;
  -- Declining clears anything this party had already put on the table (a no-op for
  -- the usual pending decline) so a now-departed party leaves no orphan terms.
  if not p_accept then
    delete from public.negotiation_term_agreements a
      using public.negotiation_terms t
     where a.term_id = t.id and t.negotiation_id = p_neg and a.party_id = v_np.party_id;
    delete from public.negotiation_terms where negotiation_id = p_neg and party_id = v_np.party_id;
  end if;
end $$;
grant execute on function public.coalition_respond(uuid, boolean) to authenticated;

-- Put a blank term on the table. Any seated party (host or accepted partner) may
-- author one; the caller's party is recorded as its author and auto-agrees to it.
-- No action cost. (Old host-only signature dropped.)
drop function if exists public.coalition_add_term(uuid, uuid, text);
create or replace function public.coalition_add_term(p_neg uuid, p_side text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_party uuid; v_id uuid;
begin
  if p_side not in ('offering', 'requesting') then raise exception 'Unknown term side.'; end if;
  perform public._assert_negotiation_open(p_neg);
  v_party := public._my_seated_party(p_neg);
  if v_party is null then raise exception 'Only a party seated at the table can add terms.'; end if;
  insert into public.negotiation_terms (negotiation_id, party_id, side)
    values (p_neg, v_party, p_side) returning id into v_id;
  insert into public.negotiation_term_agreements (term_id, party_id) values (v_id, v_party)
    on conflict do nothing;   -- you agree to what you propose
  return v_id;
end $$;
grant execute on function public.coalition_add_term(uuid, text) to authenticated;

-- Edit a term. Only its AUTHOR may edit. Changing its substance (type or params)
-- clears every agreement on it — the deal changed, so prior consensus no longer
-- holds — and re-seeds the author's own agreement. Flipping only the redline keeps
-- the agreements. No action cost.
create or replace function public.coalition_update_term(p_term uuid, p_type text, p_params jsonb, p_redline boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_t public.negotiation_terms%rowtype; v_reset boolean;
begin
  select t.* into v_t
    from public.negotiation_terms t
    join public.parties p on p.id = t.party_id
   where t.id = p_term and p.user_id = auth.uid()
   for update;
  if not found then raise exception 'Only the party that proposed a term can edit it.'; end if;
  perform public._assert_negotiation_open(v_t.negotiation_id);

  v_reset := (v_t.type is distinct from p_type) or (v_t.params is distinct from p_params);
  update public.negotiation_terms
     set type = p_type, params = p_params, redline = p_redline
   where id = p_term;
  if v_reset then
    delete from public.negotiation_term_agreements where term_id = p_term;
    insert into public.negotiation_term_agreements (term_id, party_id) values (p_term, v_t.party_id)
      on conflict do nothing;   -- the author still stands behind their re-worded term
  end if;
end $$;
grant execute on function public.coalition_update_term(uuid, text, jsonb, boolean) to authenticated;

-- Remove a term. Its author may remove their own; the host may remove any term
-- (table moderator). No action cost.
create or replace function public.coalition_remove_term(p_term uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_t public.negotiation_terms%rowtype; v_is_author boolean; v_is_host boolean;
begin
  if auth.uid() is null then raise exception 'Not signed in.'; end if;
  select * into v_t from public.negotiation_terms where id = p_term;
  if not found then raise exception 'That term is gone.'; end if;
  perform public._assert_negotiation_open(v_t.negotiation_id);
  select exists (select 1 from public.parties p where p.id = v_t.party_id and p.user_id = auth.uid()) into v_is_author;
  select exists (select 1 from public.negotiations n join public.parties hp on hp.id = n.host_party_id
                 where n.id = v_t.negotiation_id and hp.user_id = auth.uid()) into v_is_host;
  if not (v_is_author or v_is_host) then raise exception 'Only the proposer or the host can remove a term.'; end if;
  delete from public.negotiation_terms where id = p_term;
end $$;
grant execute on function public.coalition_remove_term(uuid) to authenticated;

-- Set the caller's OWN agreement on a term. Any seated party (host or accepted
-- partner) signs for itself — one row per party per term. p_agreed true inserts
-- the row, false withdraws it. No action cost.
create or replace function public.coalition_set_agree(p_term uuid, p_agreed boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_neg uuid; v_party uuid;
begin
  if auth.uid() is null then raise exception 'Not signed in.'; end if;
  select negotiation_id into v_neg from public.negotiation_terms where id = p_term;
  if v_neg is null then raise exception 'That term is gone.'; end if;
  perform public._assert_negotiation_open(v_neg);
  v_party := public._my_seated_party(v_neg);
  if v_party is null then raise exception 'You''re not seated at this table.'; end if;
  if p_agreed then
    insert into public.negotiation_term_agreements (term_id, party_id) values (p_term, v_party)
      on conflict do nothing;
  else
    delete from public.negotiation_term_agreements where term_id = p_term and party_id = v_party;
  end if;
end $$;
grant execute on function public.coalition_set_agree(uuid, boolean) to authenticated;

-- Host removes an invited party from the table (and that party's terms). No cost.
create or replace function public.coalition_remove_party(p_neg uuid, p_party uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.negotiations n join public.parties hp on hp.id = n.host_party_id
                 where n.id = p_neg and hp.user_id = auth.uid()) then
    raise exception 'Only the host can remove a party.';
  end if;
  perform public._assert_negotiation_open(p_neg);
  -- Drop the party's sign-offs on OTHER parties' terms too, so a later re-invite
  -- doesn't resurrect stale agreement (their own terms cascade-delete below).
  delete from public.negotiation_term_agreements a
    using public.negotiation_terms t
   where a.term_id = t.id and t.negotiation_id = p_neg and a.party_id = p_party;
  delete from public.negotiation_terms where negotiation_id = p_neg and party_id = p_party;
  delete from public.negotiation_parties where negotiation_id = p_neg and party_id = p_party;
end $$;
grant execute on function public.coalition_remove_party(uuid, uuid) to authenticated;

-- An invited party walks away from the talks. Leaving signals bad faith to the
-- whole table — every party present (the leaver included) takes −2% Party
-- Popularity. The leaver's seat, terms and agreements are removed; the talks stay
-- open for whoever remains. The host can't "leave" their own talks. No action cost.
create or replace function public.coalition_leave(p_neg uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_party public.parties%rowtype; v_n public.negotiations%rowtype;
begin
  if auth.uid() is null then raise exception 'Not signed in.'; end if;
  select * into v_n from public.negotiations where id = p_neg;
  if not found then raise exception 'That negotiation is gone.'; end if;
  perform public._assert_negotiation_open(p_neg);

  -- The caller's party must be an invited party at this table (not the host).
  select p.* into v_party
    from public.negotiation_parties np
    join public.parties p on p.id = np.party_id
   where np.negotiation_id = p_neg and p.user_id = auth.uid()
   for update;
  if not found then raise exception 'You''re not an invited party at these talks.'; end if;
  if v_party.id = v_n.host_party_id then raise exception 'The host can''t leave their own talks.'; end if;

  -- Reputational hit: −2% to the host and every party still at the table (leaver
  -- included), floored at 0.
  update public.parties set popularity = greatest(0, popularity - 2)
   where id = v_n.host_party_id
      or id in (select party_id from public.negotiation_parties
                 where negotiation_id = p_neg and status in ('invited', 'accepted'));

  -- Remove the leaver's sign-offs on others' terms (their own terms cascade-delete),
  -- so a later re-invite can't resurrect stale agreement.
  delete from public.negotiation_term_agreements a
    using public.negotiation_terms t
   where a.term_id = t.id and t.negotiation_id = p_neg and a.party_id = v_party.id;
  delete from public.negotiation_terms where negotiation_id = p_neg and party_id = v_party.id;
  delete from public.negotiation_parties where negotiation_id = p_neg and party_id = v_party.id;

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_party.nation_id, v_party.id, 'coalition',
            'The ' || v_party.name || ' walked away from coalition talks.',
            public.current_game_date());
end $$;
grant execute on function public.coalition_leave(uuid) to authenticated;

-- Host commits the deal into a saved, locked agreement. Requires every invited
-- party accepted, at least one term, every term agreed by EVERY party at the table
-- (host + accepted partners), and the members reaching a majority of the
-- legislature. A host may hold only one committed agreement at a time. Costs the
-- host 1 action — opening talks is free, so the action lands here, when the deal is
-- locked in (the charge happens only after every check passes, so a rejected commit
-- is never billed). This is the artifact the election resolver will read later; it
-- does NOT form a government yet.
create or replace function public.coalition_commit(p_neg uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_host public.parties%rowtype; v_n public.negotiations%rowtype;
  v_seats int; v_total int; v_majority int;
begin
  if auth.uid() is null then raise exception 'Not signed in.'; end if;
  select * into v_n from public.negotiations where id = p_neg;
  if not found then raise exception 'That negotiation is gone.'; end if;
  select * into v_host from public.parties where id = v_n.host_party_id for update;
  if v_host.user_id is distinct from auth.uid() then raise exception 'Only the host can form the agreement.'; end if;
  -- Re-read status under the host lock (not the local v_n, read before the lock): two
  -- concurrent commits serialize on this row, and the loser must see 'committed' here
  -- so it raises instead of charging a second action for an already-locked deal.
  if (select status from public.negotiations where id = p_neg) <> 'active' then raise exception 'This agreement is already committed.'; end if;
  if v_host.influence < 1 then raise exception 'You need an action to lock in the agreement.'; end if;

  if not exists (select 1 from public.negotiation_parties where negotiation_id = p_neg and status = 'accepted') then
    raise exception 'At least one party must be at the table and have accepted.';
  end if;
  if exists (select 1 from public.negotiation_parties where negotiation_id = p_neg and status <> 'accepted') then
    raise exception 'Every invited party must accept before you can form the agreement.';
  end if;
  if not exists (select 1 from public.negotiation_terms where negotiation_id = p_neg) then
    raise exception 'Add the coalition terms before forming the agreement.';
  end if;
  -- Consensus: no term may be missing any seated party's agreement.
  if exists (
    select 1 from public.negotiation_terms t
     where t.negotiation_id = p_neg
       and exists (
         select 1 from public._negotiation_seats(p_neg) s
          where not exists (
            select 1 from public.negotiation_term_agreements a
             where a.term_id = t.id and a.party_id = s.party_id))
  ) then
    raise exception 'Every term must be agreed by every party at the table.';
  end if;

  -- Majority: host + accepted partners' seats >= floor(legislature_seats/2)+1.
  select coalesce(legislature_seats, 0) into v_total from public.nations where id = v_n.nation_id;
  v_majority := public._majority(v_total);
  select coalesce(v_host.seats, 0) + coalesce(sum(p.seats), 0) into v_seats
    from public.negotiation_parties np join public.parties p on p.id = np.party_id
   where np.negotiation_id = p_neg and np.status = 'accepted';
  if v_seats < v_majority then
    raise exception 'The coalition holds % seats — short of the % needed for a majority.', v_seats, v_majority;
  end if;

  if exists (select 1 from public.negotiations where host_party_id = v_host.id and status = 'committed' and id <> p_neg) then
    raise exception 'You already have a committed coalition agreement.';
  end if;

  update public.negotiations set status = 'committed' where id = p_neg;
  update public.parties set influence = influence - 1 where id = v_host.id;   -- the action lands here, on a clean commit
end $$;
grant execute on function public.coalition_commit(uuid) to authenticated;

-- Host reopens a committed agreement for editing (back to active). Host only.
create or replace function public.coalition_withdraw(p_neg uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.negotiations set status = 'active'
   where id = p_neg and status = 'committed'
     and host_party_id in (select id from public.parties where user_id = auth.uid());
  if not found then raise exception 'Only the host can reopen a committed agreement.'; end if;
end $$;
grant execute on function public.coalition_withdraw(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Home invite banner. Returns, for each still-pending invite, the host and the
-- full roster of invited parties (name + archetype) — the ONE source the Home
-- banner reads. Scoped to the caller's own pending invites only.
-- ---------------------------------------------------------------------------
create or replace function public.coalition_invites_for_me()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(jsonb_agg(x order by x_created desc), '[]'::jsonb)
  from (
    select n.created_at as x_created,
           jsonb_build_object(
             'id', n.id,
             'host', jsonb_build_object('name', hp.name, 'archetype', hp.archetype),
             'parties', (
               select coalesce(jsonb_agg(jsonb_build_object('name', p2.name, 'archetype', p2.archetype) order by p2.name), '[]'::jsonb)
                 from public.negotiation_parties np2
                 join public.parties p2 on p2.id = np2.party_id
                where np2.negotiation_id = n.id
             )
           ) as x
      from public.negotiation_parties np
      join public.parties me on me.id = np.party_id and me.user_id = auth.uid()
      join public.negotiations n on n.id = np.negotiation_id and n.status = 'active'
      join public.parties hp on hp.id = n.host_party_id
     where np.status = 'invited'
  ) s;
$$;
grant execute on function public.coalition_invites_for_me() to authenticated;

-- ---------------------------------------------------------------------------
-- Coalition chat — a running message log per negotiation, visible to everyone
-- at the table (host + invited parties). Reads via RLS (participants only);
-- posting goes through the RPC so the author party can't be spoofed.
-- ---------------------------------------------------------------------------
create table if not exists public.negotiation_messages (
  id             uuid primary key default gen_random_uuid(),
  negotiation_id uuid not null references public.negotiations (id) on delete cascade,
  party_id       uuid not null references public.parties (id) on delete cascade,
  body           text not null,
  created_at     timestamptz not null default now()
);
create index if not exists negotiation_messages_neg_idx on public.negotiation_messages (negotiation_id, created_at);

alter table public.negotiation_messages enable row level security;
drop policy if exists "neg_msg_select_part" on public.negotiation_messages;
create policy "neg_msg_select_part" on public.negotiation_messages for select using (public.is_negotiation_participant(negotiation_id));
-- no insert/update/delete policies — posting is RPC-only.

create or replace function public.coalition_post_message(p_neg uuid, p_body text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_party uuid; v_body text;
begin
  if auth.uid() is null then raise exception 'Not signed in.'; end if;
  v_body := nullif(btrim(p_body), '');
  if v_body is null then raise exception 'Type a message first.'; end if;
  if length(v_body) > 1000 then v_body := left(v_body, 1000); end if;
  -- Which of the caller's parties sits at this table (host or invited).
  select p.id into v_party
    from public.parties p
   where p.user_id = auth.uid()
     and ( exists (select 1 from public.negotiations n where n.id = p_neg and n.host_party_id = p.id)
        or exists (select 1 from public.negotiation_parties np where np.negotiation_id = p_neg and np.party_id = p.id) )
   limit 1;
  if v_party is null then raise exception 'You''re not part of these talks.'; end if;
  insert into public.negotiation_messages (negotiation_id, party_id, body) values (p_neg, v_party, v_body);
end $$;
grant execute on function public.coalition_post_message(uuid, text) to authenticated;

notify pgrst, 'reload schema';
