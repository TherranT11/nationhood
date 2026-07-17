-- ===========================================================================
-- 269 · War system, Slice 1 — war state + Declare/Peace bills (the diplomatic/legislative shell).
--
-- War is a parliamentary act. The Head of Government tables a floor bill; on a simple majority it
-- enacts. No combat here — just the state and the two bills.
--
--   • wars — one ACTIVE row per nation pair (canonical least/greatest); its existence IS "at war".
--   • propose_war(target)  → floor bill "An act to Declare War on {Nation}". On pass: a wars row is
--       created, relations drop to 1, and a world-timeline declaration fires.
--   • propose_peace(target) → floor bill "An act for Peace with {Nation}". MUTUAL: each side's pass sets
--       its own peace flag; the war ends only once BOTH have agreed (white peace).
--   • Enactment rides _resolve_proposal (schema/236) via new kind='war'/'peace' branches — the same
--       dispatch the threshold/loyalty/reform bills use.
--
-- Depends on: 10 (nations), 20 (parties), 40 (_begin_action/events/current_game_date), 60 (governments),
-- 81/236 (proposals/_resolve_proposal/proposal_votes/_party_seats), 137 (_relation_set), 05 (game_state).
-- Apply after 236. Idempotent.
-- ===========================================================================

set check_function_bodies = off;

-- One row per war. nation_a < nation_b (canonical). A partial unique index allows a fresh war after an
-- old one ended, but never two ACTIVE wars between the same pair. Public read — wars are common knowledge.
create table if not exists public.wars (
  id          uuid primary key default gen_random_uuid(),
  nation_a    text not null references public.nations (id) on delete cascade,
  nation_b    text not null references public.nations (id) on delete cascade,
  aggressor   text not null references public.nations (id),   -- who declared it
  status      text not null default 'active',                 -- 'active' | 'ended'
  peace_a     boolean not null default false,                 -- nation_a's parliament has voted for peace
  peace_b     boolean not null default false,                 -- nation_b's parliament has voted for peace
  started_tick int,
  ended_tick   int,
  end_reason   text,                                           -- 'peace' (Slice 4 adds 'capitulation')
  created_at   timestamptz not null default now(),
  check (nation_a < nation_b)
);
create unique index if not exists wars_one_active on public.wars (nation_a, nation_b) where status = 'active';
alter table public.wars enable row level security;
drop policy if exists "wars_select_all" on public.wars;
create policy "wars_select_all" on public.wars for select using (true);

-- Is there an ACTIVE war between two nations? ONE source for "at war" (used by bills now, orders/CP later).
create or replace function public._nations_at_war(p_a text, p_b text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.wars
                  where status = 'active' and nation_a = least(p_a, p_b) and nation_b = greatest(p_a, p_b));
$$;
grant execute on function public._nations_at_war(text, text) to authenticated;

-- Enact a passed war bill: open the war, crater relations to 1, announce it to the world.
create or replace function public._enact_war(p_p public.proposals)
returns void language plpgsql security definer set search_path = public as $$
declare v_host text := p_p.nation_id; v_target text := p_p.payload->>'target'; v_tick int; v_hn text; v_tn text;
begin
  if v_target is null then return; end if;
  if public._nations_at_war(v_host, v_target) then return; end if;   -- already at war (e.g. reciprocal bill) — no-op
  select current_tick into v_tick from public.game_state where id;
  insert into public.wars (nation_a, nation_b, aggressor, started_tick)
    values (least(v_host, v_target), greatest(v_host, v_target), v_host, v_tick);
  perform public._relation_set(v_host, v_target, 1);
  select name into v_hn from public.nations where id = v_host;
  select name into v_tn from public.nations where id = v_target;
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_host, null, 'declaration',
            'The Parliament of ' || coalesce(v_hn, v_host) || ' has declared war on ' || coalesce(v_tn, v_target) || '.',
            public.current_game_date());
end $$;
revoke all on function public._enact_war(public.proposals) from public, anon, authenticated;

-- Enact a passed peace bill: set the passing nation's peace flag; the war ends only when BOTH sides have.
create or replace function public._enact_peace(p_p public.proposals)
returns void language plpgsql security definer set search_path = public as $$
declare v_host text := p_p.nation_id; v_target text := p_p.payload->>'target';
        v_w public.wars%rowtype; v_both boolean; v_tick int; v_hn text; v_tn text;
begin
  if v_target is null then return; end if;
  select * into v_w from public.wars
    where status = 'active' and nation_a = least(v_host, v_target) and nation_b = greatest(v_host, v_target) for update;
  if not found then return; end if;   -- no active war to end
  if v_host = v_w.nation_a then update public.wars set peace_a = true where id = v_w.id;
  else                            update public.wars set peace_b = true where id = v_w.id; end if;
  select (peace_a and peace_b) into v_both from public.wars where id = v_w.id;
  select current_tick into v_tick from public.game_state where id;
  select name into v_hn from public.nations where id = v_host;
  select name into v_tn from public.nations where id = v_target;
  if v_both then
    update public.wars set status = 'ended', ended_tick = v_tick, end_reason = 'peace' where id = v_w.id;
    insert into public.events (nation_id, party_id, kind, body, game_date)
      values (v_host, null, 'declaration',
              'Peace has been concluded between ' || coalesce(v_hn, v_host) || ' and ' || coalesce(v_tn, v_target) || '.',
              public.current_game_date());
  else
    insert into public.events (nation_id, party_id, kind, body, game_date)
      values (v_host, null, 'declaration',
              'The Parliament of ' || coalesce(v_hn, v_host) || ' has voted for peace with ' || coalesce(v_tn, v_target)
                || ' — the war continues until they agree.',
              public.current_game_date());
  end if;
end $$;
revoke all on function public._enact_peace(public.proposals) from public, anon, authenticated;

-- Redefine _resolve_proposal (body verbatim from schema/236) with kind='war'/'peace' enactment branches.
create or replace function public._resolve_proposal(p_proposal uuid, p_final boolean default false, p_penalize boolean default true)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_p public.proposals%rowtype; v_maj int; v_aye int; v_nay int; v_pass boolean; v_absent text;
begin
  select * into v_p from public.proposals where id = p_proposal for update;
  if not found then return 'gone'; end if;
  if v_p.status <> 'voting' then return v_p.status; end if;

  if v_p.kind = 'no_confidence' then
    if not p_final then return 'voting'; end if;
    return public._resolve_no_confidence(v_p);
  end if;

  select public._majority(coalesce(legislature_seats, 0)) into v_maj from public.nations where id = v_p.nation_id;
  select aye, nay into v_aye, v_nay from public._proposal_seat_tally(p_proposal);

  v_pass := (v_aye >= v_maj) or (p_final and v_aye > v_nay and v_aye > 0);

  if p_final and p_penalize then
    with hit as (
      update public.parties pp
         set popularity = public._mod_floor_drop(pp.nation_id, pp.archetype, pp.popularity, pp.popularity - 1)
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

  if p_final and v_p.kind = 'law' then
    begin perform public._coalition_vote_discipline(v_p);
    exception when others then raise warning 'coalition discipline failed (%): %', p_proposal, sqlerrm; end;
  end if;

  if v_pass then
    update public.proposals set status = 'passed', resolved_tick = (select current_tick from public.game_state where id) where id = p_proposal;
    if v_p.kind = 'declaration' then
      perform public._apply_declaration(v_p.nation_id, v_p.payload->>'slug', v_p.payload->>'value');
    elsif v_p.kind = 'law' then
      perform public._queue_law_implementation(v_p.nation_id, (v_p.payload->>'policy_id')::uuid, (v_p.payload->>'option_idx')::int, v_p.title);
      perform public._apply_party_effect(v_p.party_id, v_p.nation_id, jsonb_build_object('t', 'Party Popularity', 'v', 2));
    elsif v_p.kind = 'regime' then
      perform public._apply_regime_change(v_p.nation_id, (v_p.payload->>'target')::int);
    elsif v_p.kind = 'threshold' then
      perform public._apply_threshold(v_p.nation_id, (v_p.payload->>'pct')::int);
    elsif v_p.kind = 'reform' then
      perform public._apply_reform(v_p.nation_id, v_p.payload->>'dir');
    elsif v_p.kind = 'card_bill' then
      perform public._apply_bill_effects(v_p.nation_id, v_p.party_id, v_p.payload->'pass');
    elsif v_p.kind = 'loyalty' then
      perform public._apply_loyalty(v_p, true);
    elsif v_p.kind = 'war' then
      perform public._enact_war(v_p);                                  -- open the war (schema/269)
    elsif v_p.kind = 'peace' then
      perform public._enact_peace(v_p);                                -- one side agrees; ends when both do
    end if;
    insert into public.events (nation_id, party_id, kind, body, game_date)
      values (v_p.nation_id, v_p.party_id, 'declaration',
              'The ' || public._legislature_of(v_p.nation_id) || ' passed a measure: ' || v_p.title || '.', public.current_game_date());
    return 'passed';
  end if;

  if p_final then
    update public.proposals set status = 'failed', resolved_tick = (select current_tick from public.game_state where id) where id = p_proposal;
    if v_p.kind = 'card_bill' then
      perform public._apply_bill_effects(v_p.nation_id, v_p.party_id, v_p.payload->'fail');
    elsif v_p.kind = 'loyalty' then
      perform public._apply_loyalty(v_p, false);
    end if;
    insert into public.events (nation_id, party_id, kind, body, game_date)
      values (v_p.nation_id, v_p.party_id, 'declaration',
              'A measure failed for want of a majority in the ' || public._legislature_of(v_p.nation_id) || ': ' || v_p.title || '.', public.current_game_date());
    return 'failed';
  end if;
  return 'voting';
end $$;

-- Declare War — Head of Government tables a floor bill on the target. 1 Action Point.
create or replace function public.propose_war(p_target text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_party public.parties%rowtype; v_tick int; v_pid uuid; v_res text; v_tn text;
begin
  v_party := public._begin_action(0);   -- 1 AP
  if p_target is null or p_target = v_party.nation_id then raise exception 'Choose another nation.'; end if;
  if not exists (select 1 from public.nations where id = p_target and not coalesce(dormant, false)) then
    raise exception 'No such nation.'; end if;
  if not exists (select 1 from public.governments where nation_id = v_party.nation_id and status = 'active' and formateur_party_id = v_party.id) then
    raise exception 'Only the Head of Government can move to declare war.'; end if;
  if public._party_seats(v_party.nation_id) = 0 then
    raise exception 'The assembly is vacant — hold an election before bringing measures to the floor.'; end if;
  if public._nations_at_war(v_party.nation_id, p_target) then raise exception 'You are already at war with that nation.'; end if;
  if exists (select 1 from public.proposals where nation_id = v_party.nation_id and kind = 'war' and status = 'voting' and payload->>'target' = p_target) then
    raise exception 'A declaration of war on that nation is already before the chamber.'; end if;

  select current_tick into v_tick from public.game_state where id;
  select name into v_tn from public.nations where id = p_target;
  insert into public.proposals (nation_id, party_id, kind, title, payload, status, opened_tick)
    values (v_party.nation_id, v_party.id, 'war',
            'An act to Declare War on ' || coalesce(v_tn, p_target),
            jsonb_build_object('target', p_target), 'voting', v_tick)
    returning id into v_pid;
  insert into public.proposal_votes (proposal_id, party_id, aye) values (v_pid, v_party.id, true);   -- proposer auto-Aye
  v_res := public._resolve_proposal(v_pid);
  return jsonb_build_object('id', v_pid, 'status', v_res, 'actions', v_party.influence);
end $$;
grant execute on function public.propose_war(text) to authenticated;

-- Sue for Peace — Head of Government tables a peace bill. Mutual: the war ends when both sides pass one.
create or replace function public.propose_peace(p_target text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_party public.parties%rowtype; v_tick int; v_pid uuid; v_res text; v_tn text;
begin
  v_party := public._begin_action(0);   -- 1 AP
  if p_target is null then raise exception 'Choose a nation.'; end if;
  if not exists (select 1 from public.governments where nation_id = v_party.nation_id and status = 'active' and formateur_party_id = v_party.id) then
    raise exception 'Only the Head of Government can sue for peace.'; end if;
  if public._party_seats(v_party.nation_id) = 0 then
    raise exception 'The assembly is vacant — hold an election before bringing measures to the floor.'; end if;
  if not public._nations_at_war(v_party.nation_id, p_target) then raise exception 'You are not at war with that nation.'; end if;
  if exists (select 1 from public.proposals where nation_id = v_party.nation_id and kind = 'peace' and status = 'voting' and payload->>'target' = p_target) then
    raise exception 'A peace act with that nation is already before the chamber.'; end if;

  select current_tick into v_tick from public.game_state where id;
  select name into v_tn from public.nations where id = p_target;
  insert into public.proposals (nation_id, party_id, kind, title, payload, status, opened_tick)
    values (v_party.nation_id, v_party.id, 'peace',
            'An act for Peace with ' || coalesce(v_tn, p_target),
            jsonb_build_object('target', p_target), 'voting', v_tick)
    returning id into v_pid;
  insert into public.proposal_votes (proposal_id, party_id, aye) values (v_pid, v_party.id, true);   -- proposer auto-Aye
  v_res := public._resolve_proposal(v_pid);
  return jsonb_build_object('id', v_pid, 'status', v_res, 'actions', v_party.influence);
end $$;
grant execute on function public.propose_peace(text) to authenticated;

notify pgrst, 'reload schema';
