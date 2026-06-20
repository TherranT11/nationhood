-- ===========================================================================
-- 81 · Floor proposals + assembly voting.
-- Depends on: 10 (nations), 20 (parties), 40 (events + action helpers), 45
-- (_majority), 80 (declarations). Run after 80.
--
-- A party proposes a measure (a Declaration for now; Laws reuse this later). It
-- can be queued on the upcoming agenda (free) or sent straight to the floor
-- (1 action), where every party votes with its SEATS. Resolution is LIVE — no
-- cron/tick: a measure passes the instant Aye-seats reach a chamber majority and
-- fails the instant Aye can no longer get there. Declarations are cosmetic; a
-- passed one writes the nation's chosen name into nations.declarations.
-- ===========================================================================

-- Each nation's current declaration values, keyed by slug (the player picks/sets
-- these via passed proposals; defaults derive on the client from each slot's ★).
alter table public.nations add column if not exists declarations jsonb not null default '{}'::jsonb;

create table if not exists public.proposals (
  id          uuid primary key default gen_random_uuid(),
  nation_id   text not null references public.nations (id) on delete cascade,
  party_id    uuid not null references public.parties (id) on delete cascade,  -- proposer
  kind        text not null default 'declaration',   -- declaration | law (later)
  title       text not null,                          -- e.g. "Capital Name → Seyonne"
  payload     jsonb not null default '{}'::jsonb,     -- declaration: {slug, label, value}
  status      text not null default 'voting',         -- agenda | voting | passed | failed
  created_at  timestamptz not null default now()
);
create index if not exists proposals_nation_idx on public.proposals (nation_id, status);

-- One vote per party per proposal (changeable while voting is open).
create table if not exists public.proposal_votes (
  proposal_id uuid not null references public.proposals (id) on delete cascade,
  party_id    uuid not null references public.parties (id) on delete cascade,
  aye         boolean not null,
  created_at  timestamptz not null default now(),
  primary key (proposal_id, party_id)
);

-- Reads: world-readable (the chamber is public). Writes are RPC-only — no client
-- insert/update/delete policies, so action costs and the vote rules can't be bypassed.
alter table public.proposals      enable row level security;
alter table public.proposal_votes enable row level security;
drop policy if exists "proposals_select_all" on public.proposals;
create policy "proposals_select_all" on public.proposals for select using (true);
drop policy if exists "proposal_votes_select_all" on public.proposal_votes;
create policy "proposal_votes_select_all" on public.proposal_votes for select using (true);

-- ---------------------------------------------------------------------------
-- Internal helpers.
-- ---------------------------------------------------------------------------

-- Write a passed declaration's chosen name onto the nation. Cosmetic only.
create or replace function public._apply_declaration(p_nation text, p_slug text, p_value text)
returns void language sql security definer set search_path = public as $$
  update public.nations
     set declarations = jsonb_set(coalesce(declarations, '{}'::jsonb), array[p_slug], to_jsonb(p_value), true)
   where id = p_nation;
$$;

-- Seats currently held by parties in a nation — ONE source for the floor's tally
-- and the vacant-chamber guard (a vote needs an elected, seated assembly).
create or replace function public._party_seats(p_nation text)
returns int language sql stable security definer set search_path = public as $$
  select coalesce(sum(seats), 0)::int from public.parties where nation_id = p_nation;
$$;

-- Tally an open proposal by seats and resolve it if the math is decided. ONE place
-- the pass/fail rule lives (propose + cast_vote both call it). Returns the status.
create or replace function public._resolve_proposal(p_proposal uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_p public.proposals%rowtype; v_chamber int; v_maj int;
  v_party_seats int; v_aye int; v_nay int; v_max_aye int;
begin
  select * into v_p from public.proposals where id = p_proposal for update;
  if not found then return 'gone'; end if;
  if v_p.status <> 'voting' then return v_p.status; end if;

  select coalesce(legislature_seats, 0) into v_chamber from public.nations where id = v_p.nation_id;
  v_maj := public._majority(v_chamber);                                  -- majority of the whole chamber
  v_party_seats := public._party_seats(v_p.nation_id);
  select coalesce(sum(p.seats) filter (where pv.aye), 0),
         coalesce(sum(p.seats) filter (where not pv.aye), 0)
    into v_aye, v_nay
    from public.proposal_votes pv join public.parties p on p.id = pv.party_id
   where pv.proposal_id = p_proposal;
  v_max_aye := v_aye + greatest(v_party_seats - v_aye - v_nay, 0);       -- undecided seats could still go Aye

  if v_party_seats > 0 and v_aye >= v_maj then
    update public.proposals set status = 'passed' where id = p_proposal;
    if v_p.kind = 'declaration' then
      perform public._apply_declaration(v_p.nation_id, v_p.payload->>'slug', v_p.payload->>'value');
    end if;
    insert into public.events (nation_id, party_id, kind, body, game_date)
      values (v_p.nation_id, v_p.party_id, 'declaration',
              'The assembly passed a measure: ' || v_p.title || '.', public.current_game_date());
    return 'passed';
  elsif v_max_aye < v_maj then
    update public.proposals set status = 'failed' where id = p_proposal;
    insert into public.events (nation_id, party_id, kind, body, game_date)
      values (v_p.nation_id, v_p.party_id, 'declaration',
              'The assembly rejected a measure: ' || v_p.title || '.', public.current_game_date());
    return 'failed';
  end if;
  return 'voting';
end $$;

-- ---------------------------------------------------------------------------
-- RPCs (server-authoritative). The proposer's action cost is charged here so it
-- can't be skipped from the client.
-- ---------------------------------------------------------------------------

-- Validate a declaration slot + value, used by propose. Returns the slot row.
create or replace function public._check_declaration(p_slug text, p_value text)
returns public.declarations
language plpgsql security definer set search_path = public as $$
declare v_decl public.declarations%rowtype;
begin
  select * into v_decl from public.declarations where slug = p_slug order by sort_order limit 1;
  if not found then raise exception 'No such declaration.'; end if;
  if btrim(coalesce(p_value, '')) = '' then raise exception 'Choose or enter a name.'; end if;
  if not v_decl.custom_allowed and not (v_decl.options ? btrim(p_value)) then
    raise exception 'That name is not one of the options.';
  end if;
  return v_decl;
end $$;

-- Propose a declaration. p_to_floor=false → queue on the agenda (free); true →
-- open a floor vote now (1 action), proposer auto-votes Aye, then tally.
create or replace function public.propose_declaration(p_slug text, p_value text, p_to_floor boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_party public.parties%rowtype; v_decl public.declarations%rowtype;
  v_value text; v_pid uuid; v_res text;
begin
  v_decl  := public._check_declaration(p_slug, p_value);
  v_value := btrim(p_value);

  if p_to_floor then
    v_party := public._begin_action(0);          -- requires >= 1 action
    if public._party_seats(v_party.nation_id) = 0 then raise exception 'The assembly is vacant — hold an election before bringing measures to the floor.'; end if;
  else
    v_party := public._lock_party();
  end if;

  insert into public.proposals (nation_id, party_id, kind, title, payload, status)
    values (v_party.nation_id, v_party.id, 'declaration',
            v_decl.label || ' → ' || v_value,
            jsonb_build_object('slug', v_decl.slug, 'label', v_decl.label, 'value', v_value),
            case when p_to_floor then 'voting' else 'agenda' end)
    returning id into v_pid;

  if not p_to_floor then
    return jsonb_build_object('id', v_pid, 'status', 'agenda', 'actions', v_party.actions_remaining);
  end if;

  update public.parties set actions_remaining = actions_remaining - 1 where id = v_party.id;
  insert into public.proposal_votes (proposal_id, party_id, aye) values (v_pid, v_party.id, true);
  v_res := public._resolve_proposal(v_pid);
  return jsonb_build_object('id', v_pid, 'status', v_res, 'actions', v_party.actions_remaining - 1);
end $$;
grant execute on function public.propose_declaration(text, text, boolean) to authenticated;

-- Bring an agenda item to the floor (1 action). Proposer only; auto-votes Aye.
create or replace function public.proposal_to_floor(p_proposal uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_party public.parties%rowtype; v_p public.proposals%rowtype; v_res text;
begin
  v_party := public._begin_action(0);
  select * into v_p from public.proposals where id = p_proposal for update;
  if not found then raise exception 'That measure is gone.'; end if;
  if v_p.party_id <> v_party.id then raise exception 'Only the proposer can bring it to the floor.'; end if;
  if v_p.status <> 'agenda' then raise exception 'That measure is not on the agenda.'; end if;
  if public._party_seats(v_party.nation_id) = 0 then raise exception 'The assembly is vacant — hold an election first.'; end if;

  update public.proposals set status = 'voting' where id = p_proposal;
  update public.parties  set actions_remaining = actions_remaining - 1 where id = v_party.id;
  insert into public.proposal_votes (proposal_id, party_id, aye) values (p_proposal, v_party.id, true)
    on conflict (proposal_id, party_id) do update set aye = excluded.aye;
  v_res := public._resolve_proposal(p_proposal);
  return jsonb_build_object('status', v_res, 'actions', v_party.actions_remaining - 1);
end $$;
grant execute on function public.proposal_to_floor(uuid) to authenticated;

-- Cast (or change) this party's vote on an open floor measure. No action cost —
-- voting is the chamber's job, not a leader action. Tallies live afterward.
create or replace function public.cast_floor_vote(p_proposal uuid, p_aye boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_party public.parties%rowtype; v_p public.proposals%rowtype; v_res text;
begin
  v_party := public._lock_party();
  select * into v_p from public.proposals where id = p_proposal;
  if not found then raise exception 'That measure is gone.'; end if;
  if v_p.nation_id <> v_party.nation_id then raise exception 'That measure is in another nation.'; end if;
  if v_p.status <> 'voting' then raise exception 'Voting on that measure has closed.'; end if;

  insert into public.proposal_votes (proposal_id, party_id, aye) values (p_proposal, v_party.id, p_aye)
    on conflict (proposal_id, party_id) do update set aye = excluded.aye;
  v_res := public._resolve_proposal(p_proposal);
  return jsonb_build_object('status', v_res);
end $$;
grant execute on function public.cast_floor_vote(uuid, boolean) to authenticated;

notify pgrst, 'reload schema';
