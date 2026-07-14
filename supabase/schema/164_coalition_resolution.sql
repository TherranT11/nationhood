-- ===========================================================================
-- 164 · Coalition resolution — seat the winning coalition at the tick.
-- Stage 2 of the coalition-voting feature (persistence + voting UI shipped in
-- 163). Each tick, every multiparty nation has its governing coalition re-derived
-- from the assembly's live votes — including a nation where one party holds a
-- majority, which may now opt into a coalition instead of governing alone:
--
--   score  = Σ  (Yes 1, Yes-but 1.5, No 0)   -- the schema/163 weights, one source
--   winner = highest score → most votes cast (Yes + Yes-but) → most seats
--
-- The winner is (re)seated through the existing _seat_government (schema/60) via a
-- committed negotiation — the reuse path the negotiations tables were deliberately
-- kept for (schema/45/146). Seating only happens when the winning MEMBER SET
-- differs from the sitting government's, so a stable coalition doesn't churn its
-- Confidence or agenda every tick. When no coalition has been voted on, the
-- sitting government is left in place — resolve_election already guarantees one
-- (its minority fallback), so there is never a hung assembly.
--
-- Called from _advance_tick (schema/60), right after the election loop, as an
-- isolated step (a failure warns; it never aborts the tick).
--
-- Depends on: 10 (nations), 20 (parties), 45 (_majority + negotiations tables),
-- 60 (_seat_government), 163 (coalition_votes). Run after 163.
-- Apply in the Supabase SQL Editor, then re-apply schema/60 so _advance_tick
-- picks up the new step.
-- ===========================================================================

create or replace function public._resolve_coalitions(p_tick int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_n record; v_maj int;
  v_win_key text; v_win_members uuid[]; v_formateur uuid; v_cur_members uuid[]; v_neg uuid;
begin
  for v_n in
    select id, coalesce(legislature_seats, 0) as seats
      from public.nations
     where not coalesce(dormant, false)
       and ruling_party is null            -- multiparty only; a one-party state has no coalition
  loop
    v_maj := public._majority(v_n.seats);

    -- A single-party majority governs ALONE BY DEFAULT (seated by resolve_election), but may now
    -- OPT INTO a coalition (schema/164 update): if partners have been voted onto a winning set below,
    -- that coalition seats instead. No short-circuit here anymore. With a majority party in play every
    -- winning coalition necessarily includes it (no set excluding it can reach the line), so normal
    -- vote resolution is safe; when nothing is voted (v_win_key null) the solo government simply stands.

    -- The winning coalition among those this nation has voted on. A coalition_key
    -- is only a candidate when every id in it is still one of the nation's parties
    -- (stale/foreign keys are dropped) and the member seats reach a majority.
    v_win_key := null;
    select cv.coalition_key into v_win_key
    from (
      select coalition_key,
             sum(case vote when 'yes' then 1.0 when 'yesbut' then 1.5 else 0 end) as score,
             count(*) filter (where vote in ('yes', 'yesbut')) as votes
        from public.coalition_votes
       where nation_id = v_n.id
       group by coalition_key
    ) cv
    cross join lateral (
      select string_to_array(cv.coalition_key, ',')::uuid[] as ids
    ) k
    cross join lateral (
      select coalesce(count(*), 0) as n_valid, coalesce(sum(seats), 0) as coal_seats
        from public.parties
       where nation_id = v_n.id and id = any(k.ids)
    ) m
    where m.n_valid = cardinality(k.ids)     -- no stale/foreign member ids
      and m.coal_seats >= v_maj              -- still a winning coalition on the current seats
    order by cv.score desc, cv.votes desc, m.coal_seats desc, cv.coalition_key
    limit 1;

    if v_win_key is null then
      continue;   -- nothing voted on that reaches a majority → the sitting government stands
    end if;

    v_win_members := string_to_array(v_win_key, ',')::uuid[];

    -- Already governing with exactly these members? Leave the government intact —
    -- a stable coalition keeps its Confidence and agenda.
    select coalesce(array_agg(id order by id), '{}') into v_cur_members
      from public.parties where nation_id = v_n.id and in_government;
    if v_cur_members = (select array(select unnest(v_win_members) order by 1)) then
      continue;
    end if;

    -- Formateur (head of government) = the largest member: seats, then popularity, then id.
    select id into v_formateur from public.parties
     where id = any(v_win_members)
     order by seats desc, popularity desc, id
     limit 1;

    -- Reuse _seat_government via a committed negotiation carrying the winning
    -- members — the dormant negotiations tables exist for exactly this. Close any
    -- prior open/committed negotiation for the nation first so they don't pile up.
    update public.negotiations set status = 'closed'
     where nation_id = v_n.id and status in ('active', 'committed');
    insert into public.negotiations (nation_id, host_party_id, status)
      values (v_n.id, v_formateur, 'committed') returning id into v_neg;
    insert into public.negotiation_parties (negotiation_id, party_id, status)
      select v_neg, id, 'accepted' from public.parties
       where id = any(v_win_members) and id <> v_formateur;

    perform public._seat_government(v_n.id, v_formateur, 'coalition', v_neg, 0);

    insert into public.events (nation_id, party_id, kind, body, game_date)
      values (v_n.id, v_formateur, 'government',
              'A new governing coalition has formed from the assembly''s votes: ' ||
              (select string_agg(name, ' + ' order by seats desc) from public.parties where id = any(v_win_members)) || '.',
              public.current_game_date());
  end loop;
end $$;
revoke all on function public._resolve_coalitions(int) from public, anon, authenticated;

notify pgrst, 'reload schema';
