-- ===========================================================================
-- 242 · Coalition scoring — a party holding ≥51% of the chamber votes with 1.5× weight.
--
-- A single-party majority's preference should carry the day: when a party holds 51% or more of the
-- legislature's seats, its backing vote (yes / yes-but) counts 1.5 toward a coalition's score instead
-- of 1.0. So "govern alone" (the majority party's own Yes = 1.5) outscores a larger set the majority
-- party voted against (a junior partner's Yes = 1.0), and the majority party governs unilaterally
-- unless it itself backs a coalition.
--
-- Redefines _resolve_coalitions (schema/164); ONLY the score sum changes — it now joins each vote to
-- its voter to read that party's seats and compares against the nation's chamber size (v_n.seats).
-- Every other line is reproduced verbatim from schema/164. The CLIENT tally (play/coalition) mirrors
-- this same weight so the displayed COALITION SCORE matches what seats the government.
--
-- Depends on: 164 (prior body), 163 (coalition_votes.party_id), 60 (_seat_government), 20 (parties).
-- Idempotent. Apply after 241.
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
      -- score: a backing vote (yes / yes-but) from a party holding ≥51% of the chamber counts 1.5
      -- (schema/242); a plain yes is 1.0, a yes-but 1.5, a no 0. votes = plain count of backers.
      select cv0.coalition_key,
             sum(case
                   when cv0.vote = 'no' then 0
                   when v_n.seats > 0 and pv.seats * 100 >= 51 * v_n.seats then 1.5
                   when cv0.vote = 'yesbut' then 1.5
                   else 1.0
                 end) as score,
             count(*) filter (where cv0.vote in ('yes', 'yesbut')) as votes
        from public.coalition_votes cv0
        join public.parties pv on pv.id = cv0.party_id
       where cv0.nation_id = v_n.id
       group by cv0.coalition_key
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
