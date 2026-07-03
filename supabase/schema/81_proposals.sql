-- ===========================================================================
-- 81 · Floor proposals + assembly voting.
-- Depends on: 10 (nations), 20 (parties), 40 (events + action helpers), 45
-- (_majority), 70 (_to_num safe parse), 80 (declarations). Run after 80.
--
-- A party proposes a measure (a Declaration for now; Laws reuse this later). It
-- can be queued on the upcoming agenda (free) or sent straight to the floor
-- (1 action), where every party votes with its SEATS. Resolution is LIVE — no
-- cron/tick: a measure passes the instant Aye-seats reach a chamber majority and
-- fails the instant Aye can no longer get there. Declarations are cosmetic; a
-- passed one writes the nation's chosen name into nations.declarations.
-- ===========================================================================

-- Each nation's current declaration values, keyed by slug (the player picks/sets
-- these via passed proposals). Pick-list slots derive a default on the client from
-- each slot's ★; the free-text IDENTITY slots (official name, capital, demonym, …)
-- do not — those are per-nation, so each nation carries its own here.
alter table public.nations add column if not exists declarations jsonb not null default '{}'::jsonb;

-- Seed Sessau's own identity values. Without this, Sessau would read '—' for these
-- (the client no longer inherits the shared ★ default for free-text identity slots,
-- precisely so one nation's name/capital can't show on another). Existing per-nation
-- values win (merge puts them on the right), so this never clobbers a later edit and
-- is safe to re-run.
update public.nations
   set declarations = jsonb_build_object(
     'formal_state_name',  'The Republic of Sessau',
     'capital_name',       'Seyonne',
     'demonym',            'Sessauan',
     'currency_name',      'Franc',
     'national_motto',     'Liberty, Order, Prosperity',
     'national_day',       '14 July',
     'official_language',  'Sessauan'
   ) || declarations
 where id = 'sessau';

create table if not exists public.proposals (
  id          uuid primary key default gen_random_uuid(),
  nation_id   text not null references public.nations (id) on delete cascade,
  party_id    uuid not null references public.parties (id) on delete cascade,  -- proposer
  kind        text not null default 'declaration',   -- declaration | law | regime | threshold | no_confidence
  title       text not null,                          -- e.g. "Capital Name → Seyonne"
  payload     jsonb not null default '{}'::jsonb,     -- declaration: {slug, label, value}
  status      text not null default 'voting',         -- agenda | voting | passed | failed
  created_at  timestamptz not null default now()
);
create index if not exists proposals_nation_idx on public.proposals (nation_id, status);

-- A floor measure resolves the instant Aye-seats reach a majority, or fails after
-- it has stood on the floor this many ticks without one. opened_tick records when
-- it reached the floor (null while still on the agenda); the deadline is enforced
-- in advance_tick (schema/60). Give any pre-migration floor measure a fresh window.
alter table public.proposals add column if not exists opened_tick int;
update public.proposals set opened_tick = (select current_tick from public.game_state where id)
 where status = 'voting' and opened_tick is null;

-- Agenda items carry the tick they're due to reach the floor — one slot per month,
-- per nation. advance_tick (schema/60) promotes them to the floor automatically when
-- the shared clock reaches that tick. Null once a measure leaves the agenda.
alter table public.proposals add column if not exists scheduled_tick int;

-- The game tick a measure was resolved (passed/failed), stamped by _resolve_proposal.
-- Drives the "Date Passed" line in Legislative History (rendered via tickToDate). Null
-- on still-open measures and on any resolved before this column existed.
alter table public.proposals add column if not exists resolved_tick int;

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

-- Apply a passed monarchy special law — the only measure that crosses the republic/monarchy
-- line on the regime scale (which automated effects can't cross; see schema/91). It moves the
-- regime between 20 (Full Democracy — a republic) and 21 (Constitutional Monarchy) only. The
-- band above (22–25) is admin-set, and an Absolute monarchy (24–25) is one-party, so the floor
-- never reaches there. p_target was validated against the current regime in propose_regime_change;
-- it's re-checked here so a stale measure (regime moved by admin since) can't apply an illegal
-- jump — an out-of-range crossing is silently dropped (the generic "measure passed" line still
-- fires, but the regime is left as-is). Announces the change as a government event.
create or replace function public._apply_regime_change(p_nation text, p_target int)
returns void language plpgsql security definer set search_path = public as $$
declare v_raw text; v_cur numeric; v_nname text;
begin
  if p_target not in (20, 21) then return; end if;
  select economy->>'regime', name into v_raw, v_nname from public.nations where id = p_nation;
  if not found then return; end if;
  v_cur := public._to_num(v_raw);
  if v_cur is null then return; end if;
  -- Proclaim (→21) only from a republic (≤20); abolish (→20) only from a Constitutional
  -- monarchy (21–23). Anything else (already there, or an Absolute monarchy) is a no-op.
  if p_target = 21 and v_cur > 20 then return; end if;
  if p_target = 20 and (v_cur < 21 or v_cur > 23) then return; end if;

  -- One clamp source: _nation_stat_add applies the delta that lands exactly on p_target.
  perform public._nation_stat_add(p_nation, 'economy', 'regime', p_target - v_cur, 1, 25);
  insert into public.events (nation_id, kind, body, game_date)
    values (p_nation, 'government',
            case when p_target = 21
                 then v_nname || ' has proclaimed a constitutional monarchy.'
                 else v_nname || ' has abolished the monarchy and restored the republic.' end,
            public.current_game_date());
end $$;
-- Internal: only _resolve_proposal calls it (the floor vote is the gate).
revoke all on function public._apply_regime_change(text, int) from public, anon, authenticated;

-- Seats currently held by parties in a nation — ONE source for the floor's tally
-- and the vacant-chamber guard (a vote needs an elected, seated assembly).
create or replace function public._party_seats(p_nation text)
returns int language sql stable security definer set search_path = public as $$
  select coalesce(sum(seats), 0)::int from public.parties where nation_id = p_nation;
$$;

-- The next free agenda month for a nation — one measure reaches the floor per tick, filling
-- from the tick after now. ONE source for every propose_* path that queues on the agenda.
create or replace function public._next_agenda_slot(p_nation text, p_cur int)
returns int language sql stable security definer set search_path = public as $$
  select greatest(p_cur + 1, coalesce(max(scheduled_tick), p_cur) + 1)
    from public.proposals where nation_id = p_nation and status = 'agenda';
$$;
revoke all on function public._next_agenda_slot(text, int) from public, anon, authenticated;

-- A measure on the floor PASSES the moment Aye-seats reach a chamber majority.
-- It does NOT fail here — a measure stands for its full window (6 ticks) and only
-- fails for want of a majority at tick advance (advance_tick, schema/60). ONE place
-- the pass rule lives (propose + cast_vote call it). Returns the status.
-- Drop earlier overloads so re-running the schema doesn't leave an ambiguous set of
-- signatures beside the (uuid, boolean, boolean) one below.
drop function if exists public._resolve_proposal(uuid);
drop function if exists public._resolve_proposal(uuid, boolean);

-- The seat-weighted Aye/Nay tally for a measure's votes (each party's vote × its seats).
-- ONE source for the seat sums — read by _resolve_proposal (the pass rule) and _proposal_locked
-- (the early-resolution gate). MIRRORED client-side by tallyVotes (proposals.js).
create or replace function public._proposal_seat_tally(p_proposal uuid, out aye int, out nay int)
language sql stable security definer set search_path = public as $$
  select coalesce(sum(p.seats) filter (where pv.aye), 0)::int,
         coalesce(sum(p.seats) filter (where not pv.aye), 0)::int
    from public.proposal_votes pv join public.parties p on p.id = pv.party_id
   where pv.proposal_id = p_proposal;
$$;
revoke all on function public._proposal_seat_tally(uuid) from public, anon, authenticated;

-- Tally a floor measure. Called after every vote (p_final=false) and once more at
-- the close of voting (p_final=true, from advance_tick). The pass rule is a simple
-- majority of the seats actually cast — Aye-seats > Nay-seats — decided at the
-- close. Before the close we still pass early the moment an outright majority of
-- the whole chamber backs it, since that result can no longer be overturned and so
-- never contradicts the simple-majority rule. A measure only fails at the close.
-- p_penalize gates the absent-from-the-floor popularity hit: true for a natural close,
-- false when the window was cut short (an outright-majority lock resolving early — the
-- non-voters were denied their full window, so they aren't punished).
create or replace function public._resolve_proposal(p_proposal uuid, p_final boolean default false, p_penalize boolean default true)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_p public.proposals%rowtype; v_maj int; v_aye int; v_nay int; v_pass boolean; v_absent text;
begin
  select * into v_p from public.proposals where id = p_proposal for update;
  if not found then return 'gone'; end if;
  if v_p.status <> 'voting' then return v_p.status; end if;

  -- A no-confidence motion resolves by its own rule (it carries UNLESS the head-of-government
  -- party votes No) and only at the close of voting — never on the seat-majority path below.
  if v_p.kind = 'no_confidence' then
    if not p_final then return 'voting'; end if;
    return public._resolve_no_confidence(v_p);
  end if;

  select public._majority(coalesce(legislature_seats, 0)) into v_maj from public.nations where id = v_p.nation_id;
  select aye, nay into v_aye, v_nay from public._proposal_seat_tally(p_proposal);

  -- early: outright chamber majority (v_maj >= 1, so this implies real seated Ayes);
  -- at close: simple majority of the seats cast.
  v_pass := (v_aye >= v_maj) or (p_final and v_aye > v_nay and v_aye > 0);

  -- Abstention has a cost: at the CLOSE of voting, every SEATED party that never cast a
  -- vote on this measure loses 1% popularity (floored like any drop — _mod_floor_drop,
  -- schema/70). Gated on p_final AND p_penalize, so a measure whose window was cut short —
  -- passing EARLY on an outright majority, or an outright-lock resolving on the next tick —
  -- never penalises non-voters. The proposer auto-voted, so it is never caught here. One
  -- summary event names the absentees so the drop is visible.
  if p_final and p_penalize then
    with hit as (
      update public.parties pp
         set popularity = public._mod_floor_drop(pp.nation_id, pp.archetype, pp.popularity, greatest(pp.popularity - 1, pp.pop_floor))
       where pp.nation_id = v_p.nation_id and pp.seats > 0
         and not exists (select 1 from public.proposal_votes pv where pv.proposal_id = p_proposal and pv.party_id = pp.id)
      returning pp.name
    )
    select string_agg(name, ', ' order by name) into v_absent from hit;
    if v_absent is not null then
      insert into public.events (nation_id, party_id, kind, body, game_date)
        values (v_p.nation_id, null, 'declaration',
                'Absent from the floor vote on ' || v_p.title || ' — popularity −1%: ' || v_absent || '.',
                public.current_game_date());
    end if;
  end if;

  if v_pass then
    update public.proposals set status = 'passed', resolved_tick = (select current_tick from public.game_state where id) where id = p_proposal;
    if v_p.kind = 'declaration' then
      perform public._apply_declaration(v_p.nation_id, v_p.payload->>'slug', v_p.payload->>'value');
    elsif v_p.kind = 'law' then
      perform public._apply_law(v_p.nation_id, (v_p.payload->>'policy_id')::uuid, (v_p.payload->>'option_idx')::int);
      -- The party that authored a passed law is rewarded +2% Party Popularity, capped like any
      -- popularity gain — _apply_conviction_effect (schema/94, resolved at runtime) is the one
      -- source for that two-step ceiling clamp. Passes once (status flips to 'passed' above).
      perform public._apply_conviction_effect(v_p.party_id, v_p.nation_id, jsonb_build_object('t', 'Party Popularity', 'v', 2));
    elsif v_p.kind = 'regime' then
      perform public._apply_regime_change(v_p.nation_id, (v_p.payload->>'target')::int);
    elsif v_p.kind = 'threshold' then
      perform public._apply_threshold(v_p.nation_id, (v_p.payload->>'pct')::int);   -- writer lives in schema/106
    end if;
    insert into public.events (nation_id, party_id, kind, body, game_date)
      values (v_p.nation_id, v_p.party_id, 'declaration',
              'The assembly passed a measure: ' || v_p.title || '.', public.current_game_date());
    return 'passed';
  end if;

  if p_final then   -- voting closed without a simple majority
    update public.proposals set status = 'failed', resolved_tick = (select current_tick from public.game_state where id) where id = p_proposal;
    insert into public.events (nation_id, party_id, kind, body, game_date)
      values (v_p.nation_id, v_p.party_id, 'declaration',
              'A measure failed for want of a majority: ' || v_p.title || '.', public.current_game_date());
    return 'failed';
  end if;
  return 'voting';
end $$;

-- True when a floor measure's outcome is already locked by an outright chamber majority, so it
-- can resolve on the NEXT tick instead of waiting out its window (advance_tick, schema/60). An
-- outright Aye majority on ANY measure (it passes / a no-confidence motion carries — neither can
-- be overturned), or an outright Nay majority on a non-no-confidence measure (it can no longer
-- reach the Aye majority it needs, so it will fail). ONE source for the early-resolution gate;
-- the client mirrors it in proposalLocked (proposals.js) only to label the card.
create or replace function public._proposal_locked(p_proposal uuid)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare v_p public.proposals%rowtype; v_maj int; v_aye int; v_nay int;
begin
  select * into v_p from public.proposals where id = p_proposal;
  if not found or v_p.status <> 'voting' then return false; end if;
  select public._majority(coalesce(legislature_seats, 0)) into v_maj from public.nations where id = v_p.nation_id;
  if coalesce(v_maj, 0) < 1 then return false; end if;
  select aye, nay into v_aye, v_nay from public._proposal_seat_tally(p_proposal);
  return v_aye >= v_maj or (v_p.kind <> 'no_confidence' and v_nay >= v_maj);
end $$;
revoke all on function public._proposal_locked(uuid) from public, anon, authenticated;

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

-- Resolve a nation's CURRENT value for a declaration slug: its chosen value if it
-- has declared one, else the slot's default option. One source for "what is this
-- nation's title/name right now", read by the feed/events (e.g. the head-of-government
-- title in a confidence collapse). Returns null only if the slug itself is undefined.
create or replace function public.nation_declaration(p_nation text, p_slug text)
returns text language sql stable security definer set search_path = public as $$
  select coalesce(
    nullif((select declarations->>p_slug from public.nations where id = p_nation), ''),
    (select options->>default_index from public.declarations where slug = p_slug order by sort_order limit 1)
  );
$$;
grant execute on function public.nation_declaration(text, text) to authenticated;

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
  v_value text; v_pid uuid; v_res text; v_cur int; v_sched int;
begin
  v_decl  := public._check_declaration(p_slug, p_value);
  v_value := btrim(p_value);
  select current_tick into v_cur from public.game_state where id;

  if p_to_floor then
    v_party := public._begin_action(0);          -- requires >= 1 action
    if public._party_seats(v_party.nation_id) = 0 then raise exception 'The assembly is vacant — hold an election before bringing measures to the floor.'; end if;
  else
    v_party := public._lock_party();
    -- Queue on the next free month: one agenda slot per tick, filling from the tick
    -- after now. advance_tick carries it to the floor when the clock reaches it.
    v_sched := public._next_agenda_slot(v_party.nation_id, v_cur);
  end if;

  insert into public.proposals (nation_id, party_id, kind, title, payload, status, opened_tick, scheduled_tick)
    values (v_party.nation_id, v_party.id, 'declaration',
            v_decl.label || ' → ' || v_value,
            jsonb_build_object('slug', v_decl.slug, 'label', v_decl.label, 'value', v_value),
            case when p_to_floor then 'voting' else 'agenda' end,
            case when p_to_floor then v_cur else null end,
            case when p_to_floor then null else v_sched end)
    returning id into v_pid;

  if not p_to_floor then
    return jsonb_build_object('id', v_pid, 'status', 'agenda', 'scheduled_tick', v_sched, 'actions', v_party.actions_remaining);
  end if;

  update public.parties set actions_remaining = actions_remaining - 1 where id = v_party.id;
  insert into public.proposal_votes (proposal_id, party_id, aye) values (v_pid, v_party.id, true);
  v_res := public._resolve_proposal(v_pid);
  return jsonb_build_object('id', v_pid, 'status', v_res, 'actions', v_party.actions_remaining - 1);
end $$;
grant execute on function public.propose_declaration(text, text, boolean) to authenticated;

-- Propose the monarchy special law — the only measure that crosses the republic/monarchy
-- line on the regime scale. p_target is 21 (proclaim a Constitutional Monarchy, legal from a
-- republic ≤20) or 20 (abolish it, legal from a Constitutional Monarchy 21–23). Absolute
-- monarchies (24–25) are admin/one-party territory and have no floor measure. Mirrors
-- propose_declaration: queue on the agenda (free) or open a floor vote now (1 action),
-- proposer auto-votes Aye, then tally.
create or replace function public.propose_regime_change(p_target int, p_to_floor boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_party public.parties%rowtype; v_cur numeric; v_title text;
  v_pid uuid; v_res text; v_curtick int; v_sched int;
begin
  if p_target not in (20, 21) then raise exception 'Unknown regime measure.'; end if;
  select current_tick into v_curtick from public.game_state where id;

  -- Lock the proposer's party first (resolving their nation), then check the crossing is
  -- legal from the nation's CURRENT regime. A floor measure also needs a seated chamber.
  if p_to_floor then
    v_party := public._begin_action(0);          -- requires >= 1 action
    if public._party_seats(v_party.nation_id) = 0 then raise exception 'The assembly is vacant — hold an election before bringing measures to the floor.'; end if;
  else
    v_party := public._lock_party();
  end if;

  v_cur := public._to_num((select economy->>'regime' from public.nations where id = v_party.nation_id));
  if v_cur is null then raise exception 'This nation''s regime is not a numeric rank — an admin must set it first.'; end if;
  if p_target = 21 then
    if v_cur > 20 then raise exception 'This nation is already a monarchy.'; end if;
    v_title := 'Proclaim a Constitutional Monarchy';
  else
    if v_cur < 21 or v_cur > 23 then raise exception 'Only a constitutional monarchy can be abolished on the floor.'; end if;
    v_title := 'Abolish the Monarchy';
  end if;

  if not p_to_floor then
    v_sched := public._next_agenda_slot(v_party.nation_id, v_curtick);
  end if;

  insert into public.proposals (nation_id, party_id, kind, title, payload, status, opened_tick, scheduled_tick)
    values (v_party.nation_id, v_party.id, 'regime', v_title,
            jsonb_build_object('target', p_target),
            case when p_to_floor then 'voting' else 'agenda' end,
            case when p_to_floor then v_curtick else null end,
            case when p_to_floor then null else v_sched end)
    returning id into v_pid;

  if not p_to_floor then
    return jsonb_build_object('id', v_pid, 'status', 'agenda', 'scheduled_tick', v_sched, 'actions', v_party.actions_remaining);
  end if;

  update public.parties set actions_remaining = actions_remaining - 1 where id = v_party.id;
  insert into public.proposal_votes (proposal_id, party_id, aye) values (v_pid, v_party.id, true);
  v_res := public._resolve_proposal(v_pid);
  return jsonb_build_object('id', v_pid, 'status', v_res, 'actions', v_party.actions_remaining - 1);
end $$;
grant execute on function public.propose_regime_change(int, boolean) to authenticated;

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

  update public.proposals set status = 'voting', opened_tick = (select current_tick from public.game_state where id), scheduled_tick = null where id = p_proposal;
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

-- ---------------------------------------------------------------------------
-- Vote of No Confidence. A party spends 1 action to table a motion against the sitting
-- government; it goes onto the agenda, reaches the floor like any measure, and at the close
-- of voting resolves by ONE rule: it CARRIES unless the head-of-government party cast a No
-- vote to defend itself (so an absent/inactive government falls automatically). Carrying
-- punishes the government party (−5% popularity, −3% floor) and calls a fresh election;
-- failing punishes the proposer instead. A 12-tick NATION-WIDE cooldown caps the spam (so the
-- action greys out for every player in the nation while it's active).
-- ---------------------------------------------------------------------------
-- Per-NATION cooldown: the tick before which NO party in the nation can table another motion.
-- Nation-scoped (not per-party) so the action greys out for every player in the nation while
-- it's on cooldown. World-readable (it rides nations) — the dashboard reads it to gate the button.
alter table public.nations add column if not exists no_confidence_until_tick int;
alter table public.parties drop column if exists no_confidence_until_tick;   -- moved to nations

-- The no-confidence penalty: −3% support floor (not below 0) and −5% popularity (not below
-- the new floor, nor below the archetype modifier floor — the canonical drop clamp). ONE place
-- both the carried (hits the government) and failed (hits the proposer) outcomes apply it.
create or replace function public._no_confidence_punish(p_party uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_arch text; v_nation text; v_pop numeric; v_floor numeric;
begin
  select archetype, nation_id, popularity, pop_floor into v_arch, v_nation, v_pop, v_floor
    from public.parties where id = p_party;
  if not found then return; end if;
  v_floor := greatest(0, coalesce(v_floor, 0) - 3);
  update public.parties
     set pop_floor   = v_floor,
         popularity  = greatest(v_floor, public._mod_floor_drop(v_nation, v_arch, v_pop, coalesce(v_pop, 0) - 5))
   where id = p_party;
end $$;
revoke all on function public._no_confidence_punish(uuid) from public, anon, authenticated;

-- Resolve a no-confidence motion at the close of voting. Carries unless the CURRENT head-of-
-- government party voted No; a carry punishes the government and calls an election, a failure
-- punishes the proposer. If no government sits any more (an election intervened), it lapses.
create or replace function public._resolve_no_confidence(p_p public.proposals)
returns text language plpgsql security definer set search_path = public as $$
declare v_hog uuid; v_defended boolean; v_tick int; v_hogname text;
begin
  select current_tick into v_tick from public.game_state where id;
  select formateur_party_id into v_hog from public.governments where nation_id = p_p.nation_id and status = 'active';
  if v_hog is null then
    update public.proposals set status = 'failed', resolved_tick = v_tick where id = p_p.id;
    insert into public.events (nation_id, party_id, kind, body, game_date)
      values (p_p.nation_id, p_p.party_id, 'declaration', 'The no-confidence motion lapsed — no government sits.', public.current_game_date());
    return 'failed';
  end if;
  select name into v_hogname from public.parties where id = v_hog;
  -- Defended iff the government party explicitly cast a No vote.
  v_defended := exists (select 1 from public.proposal_votes pv where pv.proposal_id = p_p.id and pv.party_id = v_hog and pv.aye = false);

  if v_defended then
    update public.proposals set status = 'failed', resolved_tick = v_tick where id = p_p.id;
    perform public._no_confidence_punish(p_p.party_id);
    insert into public.events (nation_id, party_id, kind, body, game_date)
      values (p_p.nation_id, p_p.party_id, 'declaration',
              'The vote of no confidence failed — ' || coalesce(v_hogname, 'the government') || ' holds, and the proposer loses standing.', public.current_game_date());
    return 'failed';
  end if;

  update public.proposals set status = 'passed', resolved_tick = v_tick where id = p_p.id;
  perform public._no_confidence_punish(v_hog);   -- punish the government BEFORE the election, so it carries the loss in
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (p_p.nation_id, p_p.party_id, 'declaration',
            'The vote of no confidence carried — ' || coalesce(v_hogname, 'the government') || ' falls. Fresh elections are called.', public.current_game_date());
  perform public.resolve_election(p_p.nation_id, 'a successful vote of no confidence');
  return 'passed';
end $$;
revoke all on function public._resolve_no_confidence(public.proposals) from public, anon, authenticated;

-- Table a vote of no confidence (1 action). Goes onto the agenda; advance_tick carries it to
-- the floor and resolves it at close (_resolve_no_confidence). Needs a sitting government and
-- a seated chamber; gated by the 12-tick per-party cooldown.
create or replace function public.propose_no_confidence()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_party public.parties%rowtype; v_hog uuid; v_hogname text; v_tick int; v_sched int; v_pid uuid; v_until int;
begin
  v_party := public._begin_action(0);   -- requires >= 1 action
  select current_tick into v_tick from public.game_state where id;
  -- Lock the nation row: the cooldown is nation-wide, so two parties in the same nation must
  -- be serialized here (_lock_party only locks the proposer's own row). The second waits, then
  -- sees the cooldown the first just set, instead of both slipping a motion past at once.
  select no_confidence_until_tick into v_until from public.nations where id = v_party.nation_id for update;
  if coalesce(v_until, 0) > v_tick then
    raise exception 'This nation can''t table another no-confidence motion yet (12-tick cooldown).';
  end if;
  select formateur_party_id into v_hog from public.governments where nation_id = v_party.nation_id and status = 'active';
  if v_hog is null then raise exception 'There is no sitting government to challenge.'; end if;
  if public._party_seats(v_party.nation_id) = 0 then raise exception 'The assembly is vacant — hold an election first.'; end if;
  select name into v_hogname from public.parties where id = v_hog;

  -- Queue on the next free agenda month (one slot per tick), same as other agenda measures.
  v_sched := public._next_agenda_slot(v_party.nation_id, v_tick);

  insert into public.proposals (nation_id, party_id, kind, title, payload, status, scheduled_tick)
    values (v_party.nation_id, v_party.id, 'no_confidence',
            'Vote of No Confidence in ' || coalesce(v_hogname, 'the government'),
            '{}'::jsonb, 'agenda', v_sched)
    returning id into v_pid;

  update public.parties set actions_remaining = actions_remaining - 1 where id = v_party.id;
  update public.nations set no_confidence_until_tick = v_tick + 12 where id = v_party.nation_id;   -- nation-wide cooldown
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_party.nation_id, v_party.id, 'declaration',
            v_party.name || ' tabled a vote of no confidence in ' || coalesce(v_hogname, 'the government') || '.', public.current_game_date());

  return jsonb_build_object('id', v_pid, 'scheduled_tick', v_sched, 'actions', v_party.actions_remaining - 1, 'until', v_tick + 12);
end $$;
grant execute on function public.propose_no_confidence() to authenticated;

notify pgrst, 'reload schema';
