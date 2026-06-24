-- 45 · Coalition negotiations (cross-player deal-making) + RPCs
-- Depends on: 10 (nations), 20 (parties), 40 (action helpers + current_game_date).
-- Run after 40.

-- ---------------------------------------------------------------------------
-- A negotiation is opened by a HOST party and brings one or more other parties
-- (in the same nation) to the table. The host authors the deal term by term;
-- each side independently marks its OWN agreement on every term. All writes go
-- through the security-definer RPCs below (no client insert/update grants), so
-- action costs and the host-only / agree-only rules can't be bypassed.
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

-- One promise in the deal between the host and a specific invited party. side is
-- from the HOST's view (offering = host gives; requesting = host wants). A term is
-- fully agreed only when host_agreed AND party_agreed.
create table if not exists public.negotiation_terms (
  id             uuid primary key default gen_random_uuid(),
  negotiation_id uuid not null references public.negotiations (id) on delete cascade,
  party_id       uuid not null references public.parties (id) on delete cascade,
  side           text not null,                    -- offering | requesting
  type           text not null default 'legislation',
  params         jsonb not null default '{}'::jsonb,
  redline        boolean not null default false,
  host_agreed    boolean not null default false,
  party_agreed   boolean not null default false,
  created_at     timestamptz not null default now()
);

create index if not exists negotiation_parties_neg_idx   on public.negotiation_parties (negotiation_id);
create index if not exists negotiation_parties_party_idx on public.negotiation_parties (party_id);
create index if not exists negotiation_terms_neg_idx     on public.negotiation_terms (negotiation_id);

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

-- Reads: participants only. No insert/update/delete policies — writes are RPC-only.
alter table public.negotiations       enable row level security;
alter table public.negotiation_parties enable row level security;
alter table public.negotiation_terms   enable row level security;

drop policy if exists "negotiations_select_part" on public.negotiations;
create policy "negotiations_select_part" on public.negotiations for select using (public.is_negotiation_participant(id));

-- The host sees every party + term at their table; an invited player sees only
-- their OWN seat row and only the terms of their bilateral deal (not other
-- parties' negotiations with the host).
drop policy if exists "neg_parties_select_part" on public.negotiation_parties;
create policy "neg_parties_select_part" on public.negotiation_parties for select using (
  exists (select 1 from public.negotiations n join public.parties hp on hp.id = n.host_party_id
          where n.id = negotiation_id and hp.user_id = auth.uid())
  or exists (select 1 from public.parties p where p.id = party_id and p.user_id = auth.uid())
);

drop policy if exists "neg_terms_select_part" on public.negotiation_terms;
create policy "neg_terms_select_part" on public.negotiation_terms for select using (
  exists (select 1 from public.negotiations n join public.parties hp on hp.id = n.host_party_id
          where n.id = negotiation_id and hp.user_id = auth.uid())
  or exists (select 1 from public.parties p where p.id = party_id and p.user_id = auth.uid())
);

-- ---------------------------------------------------------------------------
-- RPCs. The host's are gated by "you own the host party"; invited actions by
-- "you own an invited party at this table". open + invite each cost 1 action.
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
  return jsonb_build_object('id', v_neg, 'actions', v_host.actions_remaining);
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
  update public.parties set actions_remaining = actions_remaining - 1 where id = v_host.id;
  return jsonb_build_object('actions', v_host.actions_remaining - 1);
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
end $$;
grant execute on function public.coalition_respond(uuid, boolean) to authenticated;

-- Host adds a blank term to the deal with one invited party. No action cost.
create or replace function public.coalition_add_term(p_neg uuid, p_party uuid, p_side text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid;
begin
  if p_side not in ('offering', 'requesting') then raise exception 'Unknown term side.'; end if;
  if not exists (select 1 from public.negotiations n join public.parties hp on hp.id = n.host_party_id
                 where n.id = p_neg and hp.user_id = auth.uid()) then
    raise exception 'Only the host can add terms.';
  end if;
  if not exists (select 1 from public.negotiation_parties where negotiation_id = p_neg and party_id = p_party) then
    raise exception 'That party is not at the table.';
  end if;
  perform public._assert_negotiation_open(p_neg);
  insert into public.negotiation_terms (negotiation_id, party_id, side)
    values (p_neg, p_party, p_side) returning id into v_id;
  return v_id;
end $$;
grant execute on function public.coalition_add_term(uuid, uuid, text) to authenticated;

-- Host edits a term. Changing its substance (type or params) resets BOTH
-- agreement flags — the deal changed, so prior agreement no longer holds.
-- Flipping only the redline keeps the flags. No action cost.
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
    join public.negotiations n on n.id = t.negotiation_id
    join public.parties hp on hp.id = n.host_party_id
   where t.id = p_term and hp.user_id = auth.uid()
   for update;
  if not found then raise exception 'Only the host can edit terms.'; end if;
  perform public._assert_negotiation_open(v_t.negotiation_id);

  v_reset := (v_t.type is distinct from p_type) or (v_t.params is distinct from p_params);
  update public.negotiation_terms
     set type = p_type, params = p_params, redline = p_redline,
         host_agreed  = case when v_reset then false else host_agreed  end,
         party_agreed = case when v_reset then false else party_agreed end
   where id = p_term;
end $$;
grant execute on function public.coalition_update_term(uuid, text, jsonb, boolean) to authenticated;

-- Host removes a term. No action cost.
create or replace function public.coalition_remove_term(p_term uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_neg uuid;
begin
  select t.negotiation_id into v_neg
    from public.negotiation_terms t
    join public.negotiations n on n.id = t.negotiation_id
    join public.parties hp on hp.id = n.host_party_id
   where t.id = p_term and hp.user_id = auth.uid();
  if not found then raise exception 'Only the host can remove terms.'; end if;
  perform public._assert_negotiation_open(v_neg);
  delete from public.negotiation_terms where id = p_term;
end $$;
grant execute on function public.coalition_remove_term(uuid) to authenticated;

-- Set agreement on a term. The caller's role decides which flag moves: the host
-- sets host_agreed; the invited party this term concerns sets party_agreed.
create or replace function public.coalition_set_agree(p_term uuid, p_agreed boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_t public.negotiation_terms%rowtype; v_is_host boolean; v_is_party boolean;
begin
  if auth.uid() is null then raise exception 'Not signed in.'; end if;
  select * into v_t from public.negotiation_terms where id = p_term for update;
  if not found then raise exception 'That term is gone.'; end if;
  perform public._assert_negotiation_open(v_t.negotiation_id);

  select exists (select 1 from public.negotiations n join public.parties hp on hp.id = n.host_party_id
                 where n.id = v_t.negotiation_id and hp.user_id = auth.uid()) into v_is_host;
  select exists (select 1 from public.parties p where p.id = v_t.party_id and p.user_id = auth.uid()) into v_is_party;

  if v_is_host then
    update public.negotiation_terms set host_agreed = p_agreed where id = p_term;
  elsif v_is_party then
    update public.negotiation_terms set party_agreed = p_agreed where id = p_term;
  else
    raise exception 'You''re not part of this term.';
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
  delete from public.negotiation_terms where negotiation_id = p_neg and party_id = p_party;
  delete from public.negotiation_parties where negotiation_id = p_neg and party_id = p_party;
end $$;
grant execute on function public.coalition_remove_party(uuid, uuid) to authenticated;

-- Host commits the deal into a saved, locked agreement. Requires every invited
-- party accepted, at least one term, every term agreed by BOTH sides, and the
-- members (host + accepted partners) reaching a majority of the legislature. A
-- host may hold only one committed agreement at a time. Costs the host 1 action —
-- opening talks is free, so the action lands here, when the deal is locked in (the
-- charge happens only after every check passes, so a rejected commit is never billed).
-- This is the artifact the election resolver will read later; it does NOT form a
-- government yet.
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
  if v_host.actions_remaining < 1 then raise exception 'You need an action to lock in the agreement.'; end if;

  if not exists (select 1 from public.negotiation_parties where negotiation_id = p_neg and status = 'accepted') then
    raise exception 'At least one party must be at the table and have accepted.';
  end if;
  if exists (select 1 from public.negotiation_parties where negotiation_id = p_neg and status <> 'accepted') then
    raise exception 'Every invited party must accept before you can form the agreement.';
  end if;
  if not exists (select 1 from public.negotiation_terms where negotiation_id = p_neg) then
    raise exception 'Add the coalition terms before forming the agreement.';
  end if;
  if exists (select 1 from public.negotiation_terms where negotiation_id = p_neg and not (host_agreed and party_agreed)) then
    raise exception 'Every term must be agreed by both sides.';
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
  update public.parties set actions_remaining = actions_remaining - 1 where id = v_host.id;   -- the action lands here, on a clean commit
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
-- Home invite banner. RLS lets an invited player see only their OWN seat row,
-- so they can't enumerate their co-invitees for the banner. This security-
-- definer RPC returns, for each still-pending invite, the host and the full
-- roster of invited parties (name + archetype) — the ONE source the Home
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
