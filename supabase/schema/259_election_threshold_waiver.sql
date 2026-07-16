-- ===========================================================================
-- 259 · Election threshold waiver — a nation must always have a government.
--
-- Problem: nations.electoral_threshold sets a minimum popularity a party must clear
-- to win seats. If NO party clears it (e.g. a fractured field under a 10% threshold),
-- the eligibility set is empty → no seats are allocated → v_formateur_id is null →
-- resolve_election returns early and the nation goes ungoverned.
--
-- Fix: before seat allocation, if no ACTIVE party clears the threshold, waive it for
-- THIS election (drop it to the popularity floor so every active party is eligible).
-- The largest party by popularity then seats as normal. No per-nation fiddling — the
-- threshold still bites whenever at least one party clears it; it only steps aside when
-- it would otherwise seat nobody.
--
-- ⚠ SUPERSEDED BY 260 (adds the equal-split fallback + floors seat weight at 0).
--
-- Redefine of resolve_election (body verbatim from schema/60) with the one waiver block
-- added between the incumbents snapshot and the SEAT ALLOCATION step.
-- Depends on: 60 (resolve_election), 40 (_pop_min). Apply after 60. Idempotent.
-- ===========================================================================

create or replace function public.resolve_election(p_nation text, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seats int; v_threshold numeric; v_freq int; v_tick int; v_majority int;
  v_incumbents uuid[];
  v_formateur_id uuid; v_form_seats int; v_coal_host uuid;
  v_type text; v_source uuid; v_health int;
  v_nname text; v_year int; v_results text := ''; v_idx int := 0; v_cnt int; rec record;
  v_ruling text; v_fname text;
begin
  select legislature_seats, coalesce(electoral_threshold, 0), coalesce(election_frequency_months, 60)
    into v_seats, v_threshold, v_freq from public.nations where id = p_nation;
  if v_seats is null then raise exception 'Unknown nation %.', p_nation; end if;
  select current_tick into v_tick from public.game_state where id;
  v_majority := public._majority(v_seats);  -- one source (schema/45)

  -- Outgoing government's incumbents — used only to break formateur ties toward the sitting government.
  select coalesce(array_agg(id), '{}') into v_incumbents from public.parties where nation_id = p_nation and in_government;

  -- ---- THRESHOLD WAIVER ---------------------------------------------------
  -- A nation must have a government. If the threshold would seat nobody — no ACTIVE
  -- party clears it — waive it for this election (drop to the popularity floor) so
  -- the largest party still seats. The threshold otherwise applies unchanged.
  if v_threshold > 0 and not exists (
       select 1 from public.parties
        where nation_id = p_nation
          and popularity >= v_threshold
          and last_active_at >= now() - interval '7 days'
     ) then
    v_threshold := public._pop_min();   -- effectively no floor; every active party is eligible
  end if;

  -- ---- SEAT ALLOCATION ----------------------------------------------------
  -- Reset, then allocate to parties at/above the threshold by popularity × a
  -- ±15% jitter. Largest-remainder fills exactly the legislature, so seats
  -- always sum to v_seats.
  update public.parties set seats = 0 where nation_id = p_nation;
  with elig as materialized (   -- materialized so each party's random() jitter is computed once
    select id,
      popularity::numeric * (0.85 + random() * 0.30) as w   -- Government Confidence retired: no incumbency seat modifier
    from public.parties
    where nation_id = p_nation and popularity >= v_threshold
      and last_active_at >= now() - interval '7 days'   -- inactive parties sit out the election (mirrors INACTIVE_DAYS, util.js)
  ),
  tot as (select nullif(sum(w), 0) as tw from elig),
  ex as (select e.id, (e.w / t.tw) * v_seats as exact from elig e, tot t where t.tw is not null),
  b as (
    select id, floor(exact)::int as bs,
           row_number() over (order by (exact - floor(exact)) desc, random()) as rk
    from ex
  ),
  lo as (select v_seats - coalesce(sum(bs), 0) as n from b)
  update public.parties p
     set seats = b.bs + (case when b.rk <= (select n from lo) then 1 else 0 end)
    from b where p.id = b.id;

  -- ---- FORMATION CASCADE --------------------------------------------------
  -- Largest party (seats, then popularity, then incumbency).
  select id, seats into v_formateur_id, v_form_seats
    from public.parties where nation_id = p_nation
    order by seats desc, popularity desc, (id = any(v_incumbents)) desc
    limit 1;
  if v_formateur_id is null then
    -- No parties at all: nothing to form. Just reschedule and stop.
    update public.nations set next_election_tick = v_tick + v_freq where id = p_nation;
    return;
  end if;

  if v_form_seats >= v_majority then
    v_type := 'majority'; v_source := null;            -- largest party governs alone
  else
    -- First party in cascade order that hosts a committed agreement reaching a
    -- majority with the POST-election seats (best-ranked qualifier = first one hit).
    select q.neg_id, q.host_id into v_source, v_coal_host
    from (
      select n.id as neg_id, hp.id as host_id,
             hp.seats as hseats, hp.popularity as hpop,
             hp.seats + coalesce((select sum(pp.seats) from public.negotiation_parties np
                                    join public.parties pp on pp.id = np.party_id
                                   where np.negotiation_id = n.id and np.status = 'accepted'), 0) as coal_seats
        from public.negotiations n join public.parties hp on hp.id = n.host_party_id
       where n.nation_id = p_nation and n.status = 'committed'
    ) q
    where q.coal_seats >= v_majority
    order by q.hseats desc, q.hpop desc, (q.host_id = any(v_incumbents)) desc
    limit 1;

    if v_source is not null then
      v_type := 'coalition'; v_formateur_id := v_coal_host;
    else
      v_type := 'minority';                            -- largest party governs alone, sans majority
    end if;
  end if;

  -- ---- SEAT THE GOVERNMENT -----------------------------------------------
  -- Members, Coalition Health, the government row + its inherited agenda all
  -- happen in the single seating helper the renege/install path also calls.
  v_health := public._seat_government(p_nation, v_formateur_id, v_type, v_source, 0);

  -- ---- POST-ELECTION STANDINGS --------------------------------------------
  -- Every party sheds 30% of its standing popularity (never below its floor) — a
  -- fresh mandate resets the field. Runs after seat allocation, so it doesn't skew
  -- the result that was just computed from the pre-election popularity.
  update public.parties
     set popularity = greatest(public._pop_min(), round(popularity * 0.7, 1))
   where nation_id = p_nation;

  -- ---- RESCHEDULE + DISSOLVE SAVED AGREEMENTS -----------------------------
  update public.nations set next_election_tick = v_tick + v_freq where id = p_nation;
  update public.negotiations set status = 'closed'
   where nation_id = p_nation and status in ('active', 'committed');

  -- ---- FEED: results, then who leads the government ----------------------
  -- A multiparty nation holds an election; a one-party state holds a Party
  -- Congress where factions of the ruling party vie for standing. The seat
  -- breakdown is identical; only the framing differs.
  select name, ruling_party into v_nname, v_ruling from public.nations where id = p_nation;
  select name into v_fname from public.parties where id = v_formateur_id;
  v_year := 1980 + (v_tick - 1) / 12;   -- tick 1 = January 1980 (mirrors util.js/current_game_date)

  -- Persist the seat result for the Elections-page history (one row per seated
  -- party; the breakdown accrues forward from this election on).
  insert into public.election_results (nation_id, tick, year, party_id, party_name, seats)
  select p_nation, v_tick, v_year, id, name, seats
    from public.parties
   where nation_id = p_nation and seats > 0;

  select count(*) into v_cnt from public.parties where nation_id = p_nation and seats > 0;
  for rec in
    select name, seats from public.parties
     where nation_id = p_nation and seats > 0
     order by seats desc, popularity desc, name
  loop
    v_idx := v_idx + 1;
    v_results := v_results || (case
      when v_idx = 1     then 'The ' || rec.name || ' won ' || rec.seats || ' seats'
      when v_idx = v_cnt then ' and ' || rec.name || ' winning ' || rec.seats
      when v_idx = 2     then ', followed by ' || rec.name || ' with ' || rec.seats
      when v_idx = 3     then ', as well as ' || rec.name || ' with ' || rec.seats
      else                    ', ' || rec.name || ' with ' || rec.seats
    end);
  end loop;
  if v_cnt = 0 then v_results := 'No ' || (case when v_ruling is not null then 'faction took a seat' else 'party cleared the threshold to win a seat' end); end if;

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (p_nation, v_formateur_id, 'election',
            coalesce(p_reason,
              (case when v_ruling is not null
                    then 'The results of the ' || v_year || ' Party Congress for ' || v_nname || ' are in. '
                    else 'Election results are in for the election of ' || v_year || ' for ' || v_nname || '. ' end))
            || v_results || '.',
            public.current_game_date());
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (p_nation, v_formateur_id, 'government',
            (case when v_ruling is not null
                  then 'The ' || v_fname || ' now leads ' || v_ruling || ' (Coalition Health ' || v_health || ' heart' || (case when v_health = 1 then '' else 's' end) || ').'
                  else 'The ' || v_fname || ' forms a ' || v_type || ' government (Coalition Health ' || v_health || ' heart' || (case when v_health = 1 then '' else 's' end) || ').' end),
            public.current_game_date());
end $$;
revoke all on function public.resolve_election(text, text) from public, anon, authenticated;

notify pgrst, 'reload schema';
