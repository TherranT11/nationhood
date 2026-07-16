-- ===========================================================================
-- 236 · Loyalty Vote — the A1 Hardliner active ability.
--
-- A Hardliner (stance index 2, schema/234) can table a "Loyalty Vote" bill on the floor. It resolves
-- like any proposal; on pass the proposer +3 / Head of Government +2 and every NO voter loses 2
-- Popularity + 3 Action Points, on fail the proposer loses 5 Popularity and all its Action Points.
--
--   • _resolve_proposal: redefined (schema/81 body) with two new kind=loyalty branches that delegate
--     to _apply_loyalty (identical otherwise).
--   • _apply_loyalty: the pass/fail effects, reading proposal_votes to find the NO voters.
--   • loyalty_vote(): the RPC — autocracy + Hardliner gated, 1 AP to table, one live bill per party.
--
-- Depends on: 81 (proposals/_resolve_proposal/_apply_party_effect), 234 (parties.stance),
--   60 (governments.formateur_party_id), 40 (_clamp_pop). Idempotent. Apply after 235.
-- ===========================================================================

set check_function_bodies = off;

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

  -- A no-confidence motion resolves through its own helper (which carries it on the seat-majority
  -- tally, then falls the government + calls an election) and only at the close of voting.
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

  -- Coalition discipline (schema/196): once a governing party's policy closes on the floor, any
  -- coalition partner that didn't vote Aye costs a heart of Coalition Health; a drained meter fragments
  -- the coalition. Isolated so a discipline error can never roll back the vote result.
  if p_final and v_p.kind = 'law' then
    begin perform public._coalition_vote_discipline(v_p);
    exception when others then raise warning 'coalition discipline failed (%): %', p_proposal, sqlerrm; end;
  end if;

  if v_pass then
    update public.proposals set status = 'passed', resolved_tick = (select current_tick from public.game_state where id) where id = p_proposal;
    if v_p.kind = 'declaration' then
      perform public._apply_declaration(v_p.nation_id, v_p.payload->>'slug', v_p.payload->>'value');
    elsif v_p.kind = 'law' then
      -- A passed law does NOT flip the policy now — it's queued for implementation (schema/155) and
      -- takes effect after its implementation time. The proposer still takes the political win here.
      perform public._queue_law_implementation(v_p.nation_id, (v_p.payload->>'policy_id')::uuid, (v_p.payload->>'option_idx')::int, v_p.title);
      -- The party that authored a passed law is rewarded +2% Party Popularity, capped like any
      -- popularity gain — _apply_party_effect (schema/153, resolved at runtime) is the one
      -- source for that two-step ceiling clamp. Passes once (status flips to 'passed' above).
      perform public._apply_party_effect(v_p.party_id, v_p.nation_id, jsonb_build_object('t', 'Party Popularity', 'v', 2));
    elsif v_p.kind = 'regime' then
      perform public._apply_regime_change(v_p.nation_id, (v_p.payload->>'target')::int);
    elsif v_p.kind = 'threshold' then
      perform public._apply_threshold(v_p.nation_id, (v_p.payload->>'pct')::int);   -- writer lives in schema/106
    elsif v_p.kind = 'reform' then
      perform public._apply_reform(v_p.nation_id, v_p.payload->>'dir');              -- writer lives in schema/167
    elsif v_p.kind = 'card_bill' then
      perform public._apply_bill_effects(v_p.nation_id, v_p.party_id, v_p.payload->'pass');   -- card-authored "if passed" effects (schema/183)
    elsif v_p.kind = 'loyalty' then
      perform public._apply_loyalty(v_p, true);    -- Hardliner loyalty bill passed (schema/236)
    end if;
    insert into public.events (nation_id, party_id, kind, body, game_date)
      values (v_p.nation_id, v_p.party_id, 'declaration',
              'The ' || public._legislature_of(v_p.nation_id) || ' passed a measure: ' || v_p.title || '.', public.current_game_date());
    return 'passed';
  end if;

  if p_final then   -- voting closed without a simple majority
    update public.proposals set status = 'failed', resolved_tick = (select current_tick from public.game_state where id) where id = p_proposal;
    if v_p.kind = 'card_bill' then
      perform public._apply_bill_effects(v_p.nation_id, v_p.party_id, v_p.payload->'fail');    -- card-authored "if not passed" effects (schema/183)
    elsif v_p.kind = 'loyalty' then
      perform public._apply_loyalty(v_p, false);    -- Hardliner loyalty bill failed (schema/236)
    end if;
    insert into public.events (nation_id, party_id, kind, body, game_date)
      values (v_p.nation_id, v_p.party_id, 'declaration',
              'A measure failed for want of a majority in the ' || public._legislature_of(v_p.nation_id) || ': ' || v_p.title || '.', public.current_game_date());
    return 'failed';
  end if;
  return 'voting';
end $$;

-- The Hardliner loyalty bill's effects, applied at resolution by _resolve_proposal (schema/81).
-- Pass: the proposer gains +3 Party Popularity and the Head of Government +2; every party that
-- voted NO loses 2 Popularity and 3 Action Points. Fail: the proposer loses 5 Popularity and all
-- its Action Points. (AP is a per-turn budget, so the AP sting is minor — the popularity is the bite.)
create or replace function public._apply_loyalty(p_p public.proposals, p_passed boolean)
returns void language plpgsql security definer set search_path = public as $$
declare v_hog uuid;
begin
  if p_passed then
    perform public._apply_party_effect(p_p.party_id, p_p.nation_id, jsonb_build_object('t', 'Party Popularity', 'v', 3));
    select formateur_party_id into v_hog from public.governments where nation_id = p_p.nation_id and status = 'active';
    if v_hog is not null and v_hog <> p_p.party_id then
      perform public._apply_party_effect(v_hog, p_p.nation_id, jsonb_build_object('t', 'Party Popularity', 'v', 2));
    end if;
    update public.parties pp
       set popularity = public._clamp_pop(pp.popularity - 2),
           action_points = greatest(0, coalesce(pp.action_points, 0) - 3)
     where pp.nation_id = p_p.nation_id
       and exists (select 1 from public.proposal_votes pv
                    where pv.proposal_id = p_p.id and pv.party_id = pp.id and not pv.aye);
  else
    update public.parties pp
       set popularity = public._clamp_pop(pp.popularity - 5), action_points = 0
     where pp.id = p_p.party_id;
  end if;
end $$;
revoke all on function public._apply_loyalty(public.proposals, boolean) from public, anon, authenticated;

-- Call a Loyalty Vote — the A1 Hardliner active. Tables a loyalty bill on the floor for 1 Action
-- Point; it resolves like any bill (early on an outright majority, else at the close of its window),
-- with the effects above. Autocracy + Hardliner (stance 2) gated; one live loyalty bill per party.
create or replace function public.loyalty_vote()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_party public.parties%rowtype; v_tick int; v_pid uuid; v_res text;
begin
  v_party := public._lock_party();
  if public._regime_type((select economy from public.nations where id = v_party.nation_id)) is distinct from 'autocracy' then
    raise exception 'The Loyalty Vote is a Hardliner move, available only under an autocracy.'; end if;
  if coalesce(v_party.stance, 3) <> 2 then raise exception 'Only a Hardliner (A1) can call a Loyalty Vote.'; end if;
  if exists (select 1 from public.proposals where party_id = v_party.id and kind = 'loyalty' and status = 'voting') then
    raise exception 'Your Loyalty Vote is already on the floor.'; end if;
  perform public._spend_action_point(v_party.id);   -- tabling the bill costs 1 Action Point
  select current_tick into v_tick from public.game_state where id;
  insert into public.proposals (nation_id, party_id, kind, title, payload, status, opened_tick)
    values (v_party.nation_id, v_party.id, 'loyalty',
            'Loyalty Vote — ' || v_party.name || '’s commitment to the future', '{}'::jsonb, 'voting', v_tick)
    returning id into v_pid;
  insert into public.proposal_votes (proposal_id, party_id, aye) values (v_pid, v_party.id, true);   -- proposer auto-Aye
  v_res := public._resolve_proposal(v_pid);   -- passes early on an outright majority, else sits until close
  return jsonb_build_object('ok', true, 'proposal', v_pid, 'result', v_res);
end $$;
grant execute on function public.loyalty_vote() to authenticated;

notify pgrst, 'reload schema';
