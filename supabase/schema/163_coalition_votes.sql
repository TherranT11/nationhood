-- ===========================================================================
-- 163 · Coalition votes — real-time, cross-player voting on the coalitions that
-- could govern a nation. Every party votes on the possible coalitions it belongs
-- to; the running tally is visible to the whole nation. At each tick the
-- highest-scoring coalition forms the government.
--
-- Scoring — ONE source, mirrored by the client's live projection and (in a
-- follow-up migration) the tick resolver: Yes = 1, Yes-but = 1.5, No = 0. The
-- winning coalition has the highest score; ties break to the most votes cast
-- (Yes + Yes-but), then to the coalition offering the most seats.
--
-- This migration is PERSISTENCE ONLY — the table, its RLS, and the cast RPC.
-- Seating the winner at the tick (reusing _seat_government, schema/60) is a
-- separate, explicitly-approved follow-up so the higher-risk engine change ships
-- and gets tested on its own.
--
-- Depends on: 10 (nations), 20 (parties), 45 (_majority). Run after 45.
-- Apply in the Supabase SQL Editor.
-- ===========================================================================

-- A coalition is identified by its MEMBER SET: the member party ids, sorted and
-- comma-joined into coalition_key. The same set always yields the same key, so
-- every member's vote on "this coalition" lands in one row-group no matter who
-- computed the list or in what order.
create table if not exists public.coalition_votes (
  id            uuid primary key default gen_random_uuid(),
  nation_id     text not null references public.nations (id) on delete cascade,
  coalition_key text not null,                        -- sorted, comma-joined member party ids
  party_id      uuid not null references public.parties (id) on delete cascade,  -- the voter (a member)
  vote          text not null check (vote in ('yes', 'yesbut', 'no')),
  demand        jsonb,                                -- {type, ministry|influence|stat|dir} for a Yes-but; null otherwise
  voted_at      timestamptz not null default now(),   -- cast order — backs the "last to vote" rule
  unique (nation_id, coalition_key, party_id)         -- one vote per party per coalition (re-cast upserts)
);
create index if not exists coalition_votes_nation_idx on public.coalition_votes (nation_id);

-- Reads: anyone with a party in the SAME nation sees every vote + demand (the
-- tally is public within the nation). No client insert/update/delete —
-- cast_coalition_vote (security definer) is the sole writer, so the membership
-- and last-voter rules can't be bypassed from a crafted client.
alter table public.coalition_votes enable row level security;
drop policy if exists "coalition_votes_select_nation" on public.coalition_votes;
create policy "coalition_votes_select_nation" on public.coalition_votes for select using (
  exists (select 1 from public.parties p where p.nation_id = coalition_votes.nation_id and p.user_id = auth.uid())
);

-- ---------------------------------------------------------------------------
-- cast_coalition_vote(coalition_key, vote, demand): the signed-in player casts
-- (or changes) their party's vote on one coalition. Server-authoritative:
--   • the caller must be a member of the coalition,
--   • the coalition must actually reach a majority (guards arbitrary keys),
--   • a "Yes, but" is refused if every OTHER member has already voted — the last
--     party to cast can only vote Yes or No (schema mirror of the client gate),
--   • a demand is kept only for a Yes-but; Yes / No store null.
-- The key is re-derived from the validated members (sorted, comma-joined), so the
-- stored key is canonical regardless of the order the client sent.
-- ---------------------------------------------------------------------------
create or replace function public.cast_coalition_vote(p_coalition_key text, p_vote text, p_demand jsonb default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_party public.parties%rowtype;
  v_nation text; v_seats int; v_maj int; v_sum int;
  v_ids uuid[]; v_valid uuid[]; v_key text; v_size int; v_others int; v_demand jsonb;
begin
  if auth.uid() is null then raise exception 'Not signed in.'; end if;
  select * into v_party from public.parties where user_id = auth.uid();
  if not found then raise exception 'You have no party.'; end if;
  if p_vote not in ('yes', 'yesbut', 'no') then raise exception 'Invalid vote.'; end if;
  v_nation := v_party.nation_id;

  -- Members: parse the key → distinct, sorted uuids; keep only real parties in
  -- THIS nation. Any id that isn't one of the nation's parties is rejected.
  v_ids   := (select array(select distinct unnest(string_to_array(p_coalition_key, ','))::uuid order by 1));
  v_valid := (select array(select id from public.parties where nation_id = v_nation and id = any(v_ids) order by id));
  if coalesce(array_length(v_valid, 1), 0) <> coalesce(array_length(v_ids, 1), 0) then
    raise exception 'Coalition includes a party outside your nation.'; end if;
  if not (v_party.id = any(v_valid)) then raise exception 'Your party is not in this coalition.'; end if;
  v_key  := array_to_string(v_valid, ',');
  v_size := coalesce(array_length(v_valid, 1), 0);

  -- Must be a winning coalition — a floor that stops votes on sub-majority sets.
  select coalesce(legislature_seats, 0) into v_seats from public.nations where id = v_nation;
  v_maj := public._majority(v_seats);
  select coalesce(sum(seats), 0) into v_sum from public.parties where id = any(v_valid);
  if v_sum < v_maj then raise exception 'That coalition does not reach a majority.'; end if;

  -- Last-to-vote rule: a Yes-but is only allowed while at least one other member
  -- has NOT yet voted. If every other member already has a row, the caller would
  -- be completing the coalition — the last vote — so Yes / No only.
  if p_vote = 'yesbut' then
    select count(*) into v_others from public.coalition_votes
      where nation_id = v_nation and coalition_key = v_key and party_id <> v_party.id;
    if v_others >= v_size - 1 then
      raise exception 'You are the last party to vote on this coalition — you can only vote Yes or No.'; end if;
  end if;

  v_demand := case when p_vote = 'yesbut' then p_demand else null end;
  insert into public.coalition_votes (nation_id, coalition_key, party_id, vote, demand, voted_at)
    values (v_nation, v_key, v_party.id, p_vote, v_demand, now())
  on conflict (nation_id, coalition_key, party_id)
    do update set vote = excluded.vote, demand = excluded.demand, voted_at = now();

  return jsonb_build_object('coalition_key', v_key, 'vote', p_vote, 'demand', v_demand);
end $$;
grant execute on function public.cast_coalition_vote(text, text, jsonb) to authenticated;

notify pgrst, 'reload schema';
