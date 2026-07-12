-- 154 · Legislative committee — the stage a policy bill sits in before the floor.
-- Depends on: 05 (game_state), 20 (parties), 40 (_begin_action/_lock_party/current_game_date),
-- 81 (proposals + _resolve_proposal), 92 (_nation_policy_option / propose_law), 153
-- (_apply_party_effect). Run after 92 and 153.
--
-- When a party proposes a policy change (propose_law, schema/92) the bill lands in COMMITTEE with
-- status 'committee' — it is NOT sent straight to the floor. In committee it has a public page
-- (any nation can read it) with a chat and an [Endorse] button for the other parties in its nation,
-- and a [Push to the Floor] button for the proposer. It sits for 6 ticks; if it isn't pushed it
-- expires (_expire_committee, called from _advance_tick, schema/60). Pushing with at least one
-- endorsement (or a floor majority) is free; pushing UNENDORSED costs an Action Point AND −2 Party
-- Popularity.

-- Proposing a bill no longer costs Influence — it costs Action Points (1 per rung moved; propose_law,
-- schema/92). The old Influence-scaling cost helper + the game-wide base column are retired here.
drop function if exists public._proposal_cost(int, int);        -- retired: cost is Action Points now
drop function if exists public.set_proposal_cost_base(int);
alter table public.game_state drop column if exists proposal_cost_base;

-- ── Committee state ─────────────────────────────────────────────────────────────
-- One row per party that has endorsed a committee bill (co-signs it, and clears the push penalty).
create table if not exists public.committee_endorsements (
  proposal_id uuid not null references public.proposals (id) on delete cascade,
  party_id    uuid not null references public.parties (id)   on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (proposal_id, party_id)
);
-- The committee chat — one thread per bill.
create table if not exists public.committee_messages (
  id          uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals (id) on delete cascade,
  party_id    uuid not null references public.parties (id)   on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists committee_messages_prop_idx on public.committee_messages (proposal_id, created_at);

-- World-readable (the committee page is public); every write goes through the RPCs below, so the
-- costs and the one-endorsement-per-party / same-nation rules can't be bypassed from the client.
alter table public.committee_endorsements enable row level security;
alter table public.committee_messages     enable row level security;
drop policy if exists "committee_endorsements_select_all" on public.committee_endorsements;
create policy "committee_endorsements_select_all" on public.committee_endorsements for select using (true);
drop policy if exists "committee_messages_select_all" on public.committee_messages;
create policy "committee_messages_select_all" on public.committee_messages for select using (true);

-- ── Actions ─────────────────────────────────────────────────────────────────────

-- Endorse a committee bill. Any party in the bill's nation EXCEPT the proposer, once, for 1 Action
-- Point. A single endorsement clears the proposer's push penalty (committee_push).
create or replace function public.committee_endorse(p_proposal uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_party public.parties%rowtype; v_prop public.proposals%rowtype; v_cost int := 5;
begin
  v_party := public._lock_party();      -- lock the caller's party (stamps activity)
  select * into v_prop from public.proposals where id = p_proposal for update;
  if not found or v_prop.status <> 'committee' then raise exception 'That bill is not in committee.'; end if;
  if v_prop.nation_id <> v_party.nation_id then raise exception 'You can only endorse a bill in your own nation.'; end if;
  if v_prop.party_id = v_party.id then raise exception 'You cannot endorse your own bill.'; end if;
  if exists (select 1 from public.committee_endorsements where proposal_id = p_proposal and party_id = v_party.id) then
    raise exception 'Your party has already endorsed this bill.';
  end if;
  perform public._spend_action_point(v_party.id);   -- endorsing costs 1 Action Point

  insert into public.committee_endorsements (proposal_id, party_id) values (p_proposal, v_party.id);

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_prop.nation_id, v_party.id, 'declaration',
            v_party.name || ' endorsed the bill "' || v_prop.title || '" in committee.', public.current_game_date());
  return jsonb_build_object('ok', true, 'actions', v_party.influence);
end $$;
grant execute on function public.committee_endorse(uuid) to authenticated;

-- Push a committee bill to the floor. Proposer only. The push is FREE (no cost, no popularity hit)
-- when the bill has ≥1 endorsement OR the proposing party already commands a majority of the
-- chamber — a majority can carry the bill alone, so it needs no cross-party endorsement. Otherwise
-- pushing unendorsed costs an Action Point AND −2 Party Popularity. Opens the floor vote (window resets),
-- the proposer auto-votes Aye, and the standard tally runs (_resolve_proposal, schema/81).
create or replace function public.committee_push(p_proposal uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_party public.parties%rowtype; v_prop public.proposals%rowtype; v_tick int;
  v_endorsed boolean; v_total int; v_has_majority boolean; v_free boolean; v_cost int := 0; v_res text;
begin
  v_party := public._lock_party();      -- lock the caller's party (an endorsed / majority push is free)
  select * into v_prop from public.proposals where id = p_proposal for update;
  if not found or v_prop.status <> 'committee' then raise exception 'That bill is not in committee.'; end if;
  if v_prop.party_id <> v_party.id then raise exception 'Only the proposing party can push its bill to the floor.'; end if;

  select exists (select 1 from public.committee_endorsements where proposal_id = p_proposal) into v_endorsed;
  -- A party holding a majority of the seats (≥ _majority, i.e. >50%) can pass the bill on its own,
  -- so it's exempt from the unendorsed-push penalty — same one-source majority rule as elections/votes.
  select legislature_seats into v_total from public.nations where id = v_prop.nation_id;
  v_has_majority := coalesce(v_total, 0) > 0 and coalesce(v_party.seats, 0) >= public._majority(v_total);
  v_free := v_endorsed or v_has_majority;
  -- An unendorsed push (no committee backing, no majority) still costs an Action Point + Popularity;
  -- an endorsed or majority push is free, as before.

  select current_tick into v_tick from public.game_state where id;
  update public.proposals set status = 'voting', opened_tick = v_tick where id = p_proposal;

  if not v_free then
    perform public._spend_action_point(v_party.id);   -- 1 Action Point …
    perform public._apply_party_effect(v_party.id, v_party.nation_id, jsonb_build_object('t', 'Party Popularity', 'v', -2));  -- … and −2 Popularity
  end if;

  insert into public.proposal_votes (proposal_id, party_id, aye) values (p_proposal, v_party.id, true)
    on conflict (proposal_id, party_id) do update set aye = true;
  v_res := public._resolve_proposal(p_proposal);
  -- {id, status, actions} — the same shape the other proposal RPCs return (actions feeds the topbar
  -- pill). The endorsed/majority flags were dropped: nothing reads them, so they were dead payload.
  return jsonb_build_object('id', p_proposal, 'status', v_res, 'actions', v_party.influence);
end $$;
grant execute on function public.committee_push(uuid) to authenticated;

-- Post a message to a committee bill's chat. Any party in the bill's nation; free (posting stamps
-- activity via _lock_party). Body length-capped server-side.
create or replace function public.committee_post(p_proposal uuid, p_body text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_party public.parties%rowtype; v_prop public.proposals%rowtype; v_body text; v_id uuid;
begin
  v_party := public._lock_party();
  v_body := left(btrim(coalesce(p_body, '')), 1000);
  if v_body = '' then raise exception 'Write a message first.'; end if;
  select * into v_prop from public.proposals where id = p_proposal;
  if not found or v_prop.status <> 'committee' then raise exception 'That bill is not in committee.'; end if;
  if v_prop.nation_id <> v_party.nation_id then raise exception 'Only parties in this nation can post here.'; end if;
  insert into public.committee_messages (proposal_id, party_id, body) values (p_proposal, v_party.id, v_body) returning id into v_id;
  return jsonb_build_object('id', v_id);
end $$;
grant execute on function public.committee_post(uuid, text) to authenticated;

-- Per-tick: a committee bill that has sat 6 ticks without being pushed expires (its page stays
-- readable for the record). Called from _advance_tick (schema/60). Isolated so one row can't
-- abort the pass.
create or replace function public._expire_committee(p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in
    select id, nation_id, title from public.proposals
     where status = 'committee' and opened_tick is not null and (p_tick - opened_tick) >= 6
  loop
    begin
      update public.proposals set status = 'expired', resolved_tick = p_tick where id = r.id;
      insert into public.events (nation_id, party_id, kind, body, game_date)
        values (r.nation_id, null, 'declaration',
                'The bill "' || r.title || '" expired in committee without reaching the floor.',
                public.current_game_date());
    exception when others then
      raise warning 'tick %: committee expiry % failed — %', p_tick, r.id, sqlerrm;
    end;
  end loop;
end $$;
revoke all on function public._expire_committee(int) from public, anon, authenticated;

notify pgrst, 'reload schema';
