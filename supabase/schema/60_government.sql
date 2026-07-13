-- 60 · Government formation + the election resolver
-- Depends on: 05 (game_state), 10 (nations), 20 (parties), 40 (events,
-- current_game_date), 45 (negotiations). Run after 45.
--
-- This is the turn/election engine. It is driven MANUALLY by the admin via
-- public.advance_tick() — there is NO cron job or trigger. advance_tick() bumps
-- the shared clock by one tick and resolves any nation whose election is due.
-- resolve_election() does the work: allocate seats from popularity, run the
-- formation cascade, write the government + its inherited agenda, set its
-- Coalition Health, reschedule the next election, and dissolve the nation's
-- saved coalition agreements.

-- ---------------------------------------------------------------------------
-- Ideological oppositions, server side. MIRRORS archetypes.js (OPPOSED_PAIRS /
-- opposes()) — keep the two in sync. Seeded in BOTH directions so the lookup
-- "does the formateur's archetype oppose this partner's?" is a simple join.
-- RLS-on with no policy: only the security-definer resolver (which bypasses RLS)
-- reads it; clients use the JS mirror.
-- ---------------------------------------------------------------------------
create table if not exists public.archetype_oppositions (
  archetype text not null,
  opposes   text not null,
  primary key (archetype, opposes)
);
alter table public.archetype_oppositions enable row level security;

insert into public.archetype_oppositions (archetype, opposes) values
  ('Communist','Libertarian'),        ('Libertarian','Communist'),
  ('Communist','Liberal'),            ('Liberal','Communist'),
  ('Communist','Conservative'),       ('Conservative','Communist'),
  ('Communist','Nationalist'),        ('Nationalist','Communist'),
  ('Communist','Faith / Religious'),  ('Faith / Religious','Communist'),
  ('Libertarian','Faith / Religious'),('Faith / Religious','Libertarian'),
  ('Libertarian','Green'),            ('Green','Libertarian'),
  ('Progressive','Conservative'),     ('Conservative','Progressive'),
  ('Progressive','Faith / Religious'),('Faith / Religious','Progressive'),
  ('Progressive','Nationalist'),      ('Nationalist','Progressive')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- The government object: one active government per nation. Members are the
-- parties with parties.in_government = true; this row records who leads, the
-- kind of government, and its stability (Coalition Health — see below).
-- Public read; written only through _seat_government (one seating path).
-- ---------------------------------------------------------------------------
create table if not exists public.governments (
  id                    uuid primary key default gen_random_uuid(),
  nation_id             text not null references public.nations (id),
  formateur_party_id    uuid references public.parties (id) on delete set null,  -- the party that formed + leads it
  type                  text not null,                 -- majority | coalition | minority
  formed_tick           int  not null,                 -- the tick it formed; the formation window (renege) reads this
  source_negotiation_id uuid references public.negotiations (id) on delete set null, -- the committed agreement, if a coalition
  status                text not null default 'active', -- active | replaced
  created_at            timestamptz not null default now()
);
create unique index if not exists governments_one_active_per_nation
  on public.governments (nation_id) where status = 'active';
-- Coalition Health — the government's stability gauge (hearts), set at formation to
-- 2 + 1 per 2 coalition parties. Debt-to-GDP crises, a vacant cabinet and a neglected
-- agenda deplete it (schema/125/138/139); delivering an agenda item restores it; at
-- zero the government falls apart and a snap election is called (schema/165). This is
-- the sole stability gauge — it replaced Government Confidence, which is fully retired
-- (its confidence/conf_breakdown columns are dropped in schema/168).
alter table public.governments add column if not exists coalition_health     int;
alter table public.governments add column if not exists coalition_health_max int;

-- The governing agenda: the agreed coalition terms a government has promised to
-- enact. Inherited from the committed agreement at formation; NOT applied
-- automatically — each item starts 'pending' and is carried out later in play.
create table if not exists public.government_agenda (
  id            uuid primary key default gen_random_uuid(),
  government_id uuid not null references public.governments (id) on delete cascade,
  type          text not null,
  params        jsonb not null default '{}'::jsonb,
  status        text not null default 'pending',  -- pending | done
  created_at    timestamptz not null default now()
);
create index if not exists government_agenda_gov_idx on public.government_agenda (government_id);

alter table public.governments      enable row level security;
alter table public.government_agenda enable row level security;
drop policy if exists "governments_select_all" on public.governments;
create policy "governments_select_all" on public.governments for select using (true);
drop policy if exists "government_agenda_select_all" on public.government_agenda;
create policy "government_agenda_select_all" on public.government_agenda for select using (true);

-- ---------------------------------------------------------------------------
-- The nation's Head-of-Government title (declared per nation in schema/80, default 'Prime Minister').
-- ONE source — read by _head_of_government_label and the "new HoG" announcement in _seat_government.
create or replace function public._head_of_government_title(p_nation text)
returns text language sql stable security definer set search_path = public as $$
  select coalesce(nullif(public.nation_declaration(p_nation, 'head_of_government_title'), ''), 'Prime Minister');
$$;
revoke all on function public._head_of_government_title(text) from public, anon, authenticated;

-- _seat_government(...): the ONE place a government is seated. Works out the
-- membership (a coalition = host + accepted partners; otherwise the formateur
-- alone), sets Coalition Health at formation (2 hearts + 1 per 2 governing
-- parties), retires the sitting government, inserts the new one stamped with the
-- current tick, and inherits the source coalition's agreed terms as a pending
-- agenda. Returns the starting heart count. INTERNAL — called by resolve_election
-- (a fresh election), the renege/install RPCs, and coalition_form_government
-- (p_midterm: a minority PM building a majority mid-term). p_conf_penalty/p_midterm
-- are retained on the signature (callers still pass them) but no longer do anything.
-- ---------------------------------------------------------------------------
drop function if exists public._seat_government(text, uuid, text, uuid, int);
create or replace function public._seat_government(
  p_nation text, p_formateur uuid, p_type text, p_source uuid, p_conf_penalty int default 0,
  p_midterm boolean default false)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_members uuid[];
  v_gid uuid; v_obj uuid;
  v_health int;   -- Coalition Health (hearts) at formation — the government's stability gauge
  v_prev_form uuid;               -- the outgoing government's formateur, to detect a genuinely NEW HoG
  v_hog_name text; v_party text;  -- the incoming HoG's leader name + party name, for the announcement
begin
  -- Members: a coalition is the host + its accepted partners; otherwise just the formateur.
  if p_type = 'coalition' then
    select array_agg(pid) into v_members from (
      select p_formateur as pid
      union
      select party_id from public.negotiation_parties where negotiation_id = p_source and status = 'accepted'
    ) m;
  else
    v_members := array[p_formateur];
  end if;
  update public.parties set in_government = (id = any(v_members)) where nation_id = p_nation;

  -- Coalition Health at formation: 2 hearts + 1 per 2 governing parties (rounded down) —
  -- the same figure the Government page shows, now stored so debt / a vacant cabinet
  -- can deplete it and delivering an agenda item can restore it.
  -- p_conf_penalty / p_midterm are retained on the signature (callers still pass them)
  -- but no longer alter the starting hearts.
  v_health := 2 + coalesce(array_length(v_members, 1), 1) / 2;

  -- Retire the sitting government, seat the new one (stamped with the tick it formed).
  select formateur_party_id into v_prev_form from public.governments where nation_id = p_nation and status = 'active';
  update public.governments set status = 'replaced' where nation_id = p_nation and status = 'active';
  insert into public.governments (nation_id, formateur_party_id, type, coalition_health, coalition_health_max, formed_tick, source_negotiation_id)
    values (p_nation, p_formateur, p_type, v_health, v_health, (select current_tick from public.game_state where id), p_source)
    returning id into v_gid;
  -- A coalition inherits its agreed terms as a pending agenda (not auto-applied).
  if p_source is not null then
    insert into public.government_agenda (government_id, type, params, status)
      select v_gid, type, params, 'pending' from public.negotiation_terms where negotiation_id = p_source;
    -- …and takes on the national objective the host queued for it, if any (schema/139).
    select objective_id into v_obj from public.negotiations where id = p_source;
    if v_obj is not null then perform public._agenda_add(v_gid, v_obj); end if;
  end if;

  -- Announce a genuinely NEW Head of Government: fires only when the incoming formateur differs from the
  -- outgoing one (a reshuffle that keeps the same party in power isn't a new HoG). Names the person, the
  -- party (article-stripped so "The …" parties don't read "the The …"), and the nation's HoG title.
  if p_formateur is distinct from v_prev_form then
    v_hog_name := public._party_leader_name(p_formateur);
    select name into v_party from public.parties where id = p_formateur;
    if coalesce(v_hog_name, '') <> '' and coalesce(v_party, '') <> '' then
      insert into public.events (nation_id, party_id, kind, body, game_date)
        values (p_nation, p_formateur, 'government',
                v_hog_name || ' of the ' || public._bare_party(v_party) || ' is now ' ||
                  public._head_of_government_title(p_nation) || '.',
                public.current_game_date());
    end if;
  end if;

  return v_health;
end $$;
revoke all on function public._seat_government(text, uuid, text, uuid, int, boolean) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Election history: one row per party that took a seat in each resolved election
-- (scheduled or snap — both go through resolve_election below, the sole writer).
-- The Elections page reads the most recent few per nation to chart how each
-- party's seats moved election to election. Public read; no client writes.
-- ---------------------------------------------------------------------------
create table if not exists public.election_results (
  id          uuid primary key default gen_random_uuid(),
  nation_id   text not null references public.nations (id) on delete cascade,
  tick        int  not null,                 -- game tick the election resolved on
  year        int  not null,                 -- in-game year (denormalised for display)
  party_id    uuid references public.parties (id) on delete set null,  -- null once a party is deleted
  party_name  text not null,                 -- name snapshot (a party may rename or dissolve)
  seats       int  not null,
  created_at  timestamptz not null default now()
);
create index if not exists election_results_nation_tick_idx on public.election_results (nation_id, tick);

alter table public.election_results enable row level security;
drop policy if exists "election_results_select_all" on public.election_results;
create policy "election_results_select_all" on public.election_results for select using (true);
-- No insert/update/delete policies — resolve_election (security definer) is the sole author.

-- ---------------------------------------------------------------------------
-- resolve_election(nation): the full pipeline for ONE nation. INTERNAL — execute
-- is revoked from clients; only advance_tick() (admin-gated, same owner) calls it.
-- ---------------------------------------------------------------------------
-- p_reason (optional): when set, it replaces the standard "Election results are in…"
-- lead-in on the results event — a forced-resignation snap election (e.g. a premier
-- walking out) passes its own framing so it still reuses this one seat-allocation source.
drop function if exists public.resolve_election(text);
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
-- Internal only: clients can never call the resolver directly (advance_tick,
-- owned by the same role, still can). Revoke the default PUBLIC grant explicitly.
revoke all on function public.resolve_election(text, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- _head_of_government_label(nation, party): the sitting premier as a display
-- string — "<head-of-government title> <party leader>", e.g. "Prime Minister Jane
-- Doe". Falls back to the party name, then "the incumbent". ONE source for naming
-- the head of government in resignation / snap-election notices. INTERNAL.
-- ---------------------------------------------------------------------------
create or replace function public._head_of_government_label(p_nation text, p_party uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select public._head_of_government_title(p_nation)
         || ' '
         || coalesce(
              nullif(public._party_leader_name(p_party), ''),
              (select name from public.parties where id = p_party),
              'the incumbent');
$$;
revoke all on function public._head_of_government_label(text, uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- RETIRED with Government Confidence. The forced-resignation-on-low-confidence path is
-- gone; Coalition Health (schema/165) is now the stability gauge — a government falls when
-- its hearts hit zero (debt / vacant cabinet), not on a confidence figure.
-- ---------------------------------------------------------------------------
drop function if exists public._confidence_collapse(text);

-- ---------------------------------------------------------------------------
-- The tick. _advance_tick() is the BODY with NO admin gate, so the pg_cron job
-- (every 6h, scheduled at the foot of this file) can run it as the function owner;
-- the manual admin button calls advance_tick() — the gated wrapper below. Every
-- per-nation / per-item step runs in its own sub-block: a single failure is logged
-- (raise warning) and skipped, so one bad nation can never freeze the world clock.
-- Bumps the clock, banks +3 Influence per party and floors Action Points at 2, applies monthly
-- policy economics + January income,
-- reconciles one-party regimes, resolves due elections, lifts expired modifiers, and
-- promotes/tallies floor measures.
-- ---------------------------------------------------------------------------
create or replace function public._advance_tick()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_tick int; v_n text; v_count int := 0; v_rec record;
begin
  update public.game_state set current_tick = current_tick + 1 where id returning current_tick into v_tick;
  -- Influence banks each tick: +3, capped at 100 (schema/20), plus 1 for the largest party in each
  -- nation — the one holding the most legislature seats (ties share the bonus). Replaces the old
  -- reset-to-12 Action-Point budget, so unspent Influence now carries forward. Touches every row
  -- (still satisfies the require-a-WHERE-clause guard via id is not null).
  -- Action Points: a fixed baseline of 2 every tick. At or below 2 it tops the party up to 2 (the pure
  -- baseline doesn't stack with itself — sitting on 2 unspent stays 2). Above 2 — i.e. AP banked from
  -- played event cards — the baseline lands ON TOP (7 → 9). So a card player always gains 2 a tick; a
  -- non-player is refilled to 2.
  update public.parties p set influence = least(100, influence + 3 + (
           case when p.seats > 0 and p.seats = (
             select max(p2.seats) from public.parties p2 where p2.nation_id = p.nation_id
           ) then 1 else 0 end)),
         action_points = case when coalesce(p.action_points, 0) <= 2 then 2 else p.action_points + 2 end
   where p.id is not null;
  -- Debt→inflation backlog: snapshot each nation's debt BEFORE this tick's economics, so the
  -- close-out step (end of tick) can measure how much debt was ADDED across the whole tick.
  -- Isolated like every other tick step — if the snapshot fails, the backlog simply no-ops
  -- (its close-out catches the missing table) instead of aborting the whole tick.
  begin
    drop table if exists _tick_debt0;
    create temp table _tick_debt0 on commit drop as
      select id, coalesce((economy->>'debt')::numeric, 0) as debt0 from public.nations;
  exception when others then raise warning 'tick %: debt snapshot failed — %', v_tick, sqlerrm; end;
  -- Standing monthly economics: every nation's in-force policy options apply their
  -- per-tick effects for this month (schema/91). Runs before the floor close below,
  -- so a law enacted this tick starts contributing next tick, not the month it passed.
  begin perform public._apply_policy_tick_effects(v_tick);
  exception when others then raise warning 'tick %: policy economics failed — %', v_tick, sqlerrm; end;
  -- Passive per-tick modifier effects (schema/70): each active modifier's signed stat delta.
  begin perform public._apply_modifier_tick_effects();
  exception when others then raise warning 'tick %: modifier per-tick effects failed — %', v_tick, sqlerrm; end;
  -- Mayoral elections that have come due (schema/110): declared candidates contest the sitting
  -- NPC mayor; a winner takes the chair and lifts their party's popularity floor by the city prize.
  begin perform public._resolve_mayoral_elections(v_tick);
  exception when others then raise warning 'tick %: mayoral elections failed — %', v_tick, sqlerrm; end;
  -- Parliamentary runs that have come due (schema/111): the scheduled 1D6 + Image + spend contest
  -- vs the locked rival; a win steals a seat and the candidate goes on a 12-tick MP cooldown.
  begin perform public._resolve_parliamentary_runs(v_tick);
  exception when others then raise warning 'tick %: parliamentary runs failed — %', v_tick, sqlerrm; end;
  -- Youth-wing drives that have come due (schema/112): raise the party's popularity floor by
  -- 0.1% × (1D3 + the organiser's Image).
  begin perform public._resolve_youth_wings(v_tick);
  exception when others then raise warning 'tick %: youth wings failed — %', v_tick, sqlerrm; end;
  -- Economy demands (schema/113): self-filters to the June tick, where the annual accounts
  -- close — a fed nation grows +1M, each unmet demand drops its stat, then the flags reset.
  begin perform public._resolve_economy_demands(v_tick);
  exception when others then raise warning 'tick %: economy demands failed — %', v_tick, sqlerrm; end;
  -- Card auctions (schema/172): every tick, each nation's sealed-bid auctions resolve — the top bid on
  -- each on-block card wins it into that party's hand, losing bids are refunded — then the block is
  -- topped back up to (parties + 1) from the deck.
  begin perform public._resolve_card_auctions(v_tick);
  exception when others then raise warning 'tick %: card auctions failed — %', v_tick, sqlerrm; end;
  -- Turn rotation (schema/173): after the auction hands out cards, advance each nation's turn cursor
  -- by one party (the next slot by turn_seq, wrapping). This is the new month's active party — whose
  -- turn it now is, and the only party that may play a card until the next tick.
  begin perform public._advance_turns();
  exception when others then raise warning 'tick %: turn rotation failed — %', v_tick, sqlerrm; end;
  -- Every tick: the nation's Budget Balance moves Public Debt by the annual balance / 12 — a surplus
  -- pays it down, a deficit adds to it (symmetric) — _apply_budget_balance (schema/152).
  begin perform public._apply_budget_balance(v_tick);
  exception when others then raise warning 'tick %: budget balance debt move failed — %', v_tick, sqlerrm; end;
  -- Every January (self-gated): party leaders and corp directors age a year, and those who reach the
  -- retirement/death window (70–78, sliding down with a poor Standard of Living) leave and are replaced
  -- by a fresh figure from the nation's name pool — _age_leaders (schema/195).
  begin perform public._age_leaders(v_tick);
  exception when others then raise warning 'tick %: leader aging failed — %', v_tick, sqlerrm; end;
  -- Every January: Public Debt accrues interest — 5%, escalating to 10% over 100% of GDP and 15%
  -- over 200% (_apply_debt_interest, schema/152); the matching stat pain lands in malaise (125).
  begin perform public._apply_debt_interest(v_tick);
  exception when others then raise warning 'tick %: debt interest failed — %', v_tick, sqlerrm; end;
  -- January (the new month is January when (tick − 1) is a multiple of 12): apply
  -- each nation's annual income to its budget. A surplus fills the bank; a deficit
  -- (negative income) drains a positive budget, and any shortfall past zero rolls
  -- into the debt:  budget' = max(0, budget+income);  debt' = debt + max(0,
  -- -(budget+income)). Flat admin-set figure; only non-zero incomes. Event surfaces it.
  begin
  if (v_tick - 1) % 12 = 0 then
    -- Add each nation's income to its budget through the one budget rule (_nation_budget_add,
    -- schema/91): budget floors at 0, the shortfall overflows to debt. A modifier's income Rate
    -- Multiplier (schema/70) scales the take before it lands.
    for v_rec in
      select id, coalesce((economy->>'income')::numeric, 0) as inc
        from public.nations
       where coalesce((economy->>'income')::numeric, 0) <> 0 and not coalesce(dormant, false)
    loop
      perform public._nation_budget_add(v_rec.id, round(v_rec.inc * public._mod_rate_multiplier(v_rec.id, 'income')));
    end loop;
    insert into public.events (nation_id, party_id, kind, body, game_date)
    select n.id, null, 'income',
           'Annual income of ' || (case when x.eff < 0 then '−' else '+' end) || x.cur || abs(x.eff)::text ||
           'B applied — budget ' || x.cur || (n.economy->>'budget') || 'B, debt ' || x.cur || (n.economy->>'debt') || 'B.',
           public.current_game_date()
      from public.nations n
      cross join lateral (select round((n.economy->>'income')::numeric * public._mod_rate_multiplier(n.id, 'income')) as eff,
                                 coalesce(n.economy->>'currency', '$') as cur) x
     where coalesce((n.economy->>'income')::numeric, 0) <> 0 and not coalesce(n.dormant, false);
  end if;
  exception when others then raise warning 'tick %: annual income failed — %', v_tick, sqlerrm; end;
  -- World Trade ledger (schema/116): wipe the accumulated bilateral flows at the January tick
  -- so the ledger resets each year (year-to-date totals start fresh).
  begin
  if (v_tick - 1) % 12 = 0 then
    delete from public.trade_flows where exporter_id is not null;
  end if;
  exception when others then raise warning 'tick %: trade-ledger reset failed — %', v_tick, sqlerrm; end;
  -- National malaise (schema/125): each January, any headline stat under 9 costs the nation.
  -- Self-filters to January, so it's a no-op the other eleven months.
  begin perform public._resolve_national_malaise(v_tick);
  exception when others then raise warning 'tick %: national malaise failed — %', v_tick, sqlerrm; end;
  -- Vacant cabinet (schema/138): each January, a cabinet left with any empty seat costs the
  -- government a heart of Coalition Health. Self-filters to January, a no-op the other eleven months.
  begin perform public._resolve_vacant_cabinet(v_tick);
  exception when others then raise warning 'tick %: vacant-cabinet penalty failed — %', v_tick, sqlerrm; end;
  -- (An empty national-objectives agenda used to cost Party Popularity + Coalition Health here;
  -- that penalty was retired — setting no objectives now carries no yearly cost.)
  -- Passive Per-Year modifier effects (schema/70): each January, a modifier's yearly stat nudges
  -- land. Self-filters to January.
  begin perform public._apply_modifier_year_effects(v_tick);
  exception when others then raise warning 'tick %: per-year modifier effects failed — %', v_tick, sqlerrm; end;
  -- Military builds (schema/129): every tick, matured Expand orders deliver typed units to bases.
  begin perform public._resolve_military_builds(v_tick);
  exception when others then raise warning 'tick %: military builds failed — %', v_tick, sqlerrm; end;
  -- Regime is the sole switch between one-party and multiparty. This tick's economics
  -- may have eroded a nation's regime to 1–4 or lifted it back to 5+, so reconcile every
  -- nation's ruling_party with its regime (schema/98) BEFORE elections read it — a nation
  -- that just turned one-party then holds a Party Congress instead of an election.
  for v_n in select id from public.nations loop
    begin perform public._sync_one_party_state(v_n);
    exception when others then raise warning 'tick %: party-state sync failed for nation % — %', v_tick, v_n, sqlerrm; end;
  end loop;
  for v_n in
    select id from public.nations
     where next_election_tick is not null and next_election_tick <= v_tick
       and not coalesce(dormant, false)   -- dormant nations don't hold elections until activated
  loop
    begin perform public.resolve_election(v_n); v_count := v_count + 1;
    exception when others then raise warning 'tick %: election failed for nation % — %', v_tick, v_n, sqlerrm; end;
  end loop;
  -- Coalition governments (schema/164): re-derive each multiparty nation's governing
  -- coalition from the assembly's live votes and (re)seat the winner when its
  -- membership changes. Runs right after elections so it reads this tick's freshly
  -- allocated seats. Isolated — a failure warns and never aborts the tick.
  begin perform public._resolve_coalitions(v_tick);
  exception when others then raise warning 'tick %: coalition resolution failed — %', v_tick, sqlerrm; end;
  -- Auto-apply any triggered National Modifier: a modifier with start conditions "fires off"
  -- on every non-dormant nation that now meets them all (schema/70). Runs before the lift so a
  -- nation that both qualifies and has met the end conditions ends up without it.
  begin perform public._apply_modifier_triggers(v_tick);
  exception when others then raise warning 'tick %: modifier triggers failed — %', v_tick, sqlerrm; end;
  -- Fire any dormant-card activation whose delay has elapsed (schema/184) — the card enters its deck now.
  begin perform public._process_card_activations(v_tick);
  exception when others then raise warning 'tick %: card activations failed — %', v_tick, sqlerrm; end;
  -- Lift any assigned National Modifier whose end conditions are all met (schema/70).
  delete from public.nation_modifiers nm
   where public._modifier_end_met(nm.modifier_id, nm.nation_id, nm.since_tick, v_tick);
  -- Purge card-minted modifier DEFINITIONS (schema/176 timed boosts) once they carry no assignment —
  -- their nation_modifiers row was just lifted above. Admin-authored modifiers (source is null) are
  -- never touched. Keeps the modifier list from growing every time a production card is played.
  delete from public.national_modifiers m
   where m.source = 'card'
     and not exists (select 1 from public.nation_modifiers nm where nm.modifier_id = m.id);
  -- Agenda items whose scheduled month has arrived reach the floor automatically
  -- (schema/81). opened_tick starts their 6-tick window; scheduled_tick is cleared.
  -- Isolated like every other tick step — the event text must NEVER be able to abort the whole tick.
  begin
    with promoted as (
      update public.proposals set status = 'voting', opened_tick = v_tick, scheduled_tick = null
       where status = 'agenda' and scheduled_tick is not null and scheduled_tick <= v_tick
      returning nation_id, party_id, title
    )
    insert into public.events (nation_id, party_id, kind, body, game_date)
      select nation_id, party_id, 'declaration',
             'A measure has reached the floor in the ' || public._legislature_of(nation_id) || ': ' || title || '.', public.current_game_date()
      from promoted;
  exception when others then raise warning 'tick %: floor promotion failed — %', v_tick, sqlerrm; end;
  -- Floor measures resolve now if they have stood their full 6-tick window OR their outcome is
  -- already locked by an outright chamber majority (_proposal_locked, schema/81) — the latter
  -- resolves on this next tick instead of lingering. A simple majority of the seats cast (Aye >
  -- Nay) carries a window-closed measure, otherwise it falls (schema/81); each is resolved
  -- individually so a passing measure applies its effects. A measure whose window was cut short
  -- by the lock skips the absent-from-the-floor penalty (p_penalize=false).
  for v_rec in
    select id, ((v_tick - opened_tick) >= 6) as window_closed from public.proposals
     where status = 'voting' and opened_tick is not null
       and ((v_tick - opened_tick) >= 6 or public._proposal_locked(id))
  loop
    begin perform public._resolve_proposal(v_rec.id, true, v_rec.window_closed);
    exception when others then raise warning 'tick %: proposal % failed — %', v_tick, v_rec.id, sqlerrm; end;
  end loop;
  -- Committee bills (schema/154) that have sat 6 ticks without being pushed to the floor expire.
  begin perform public._expire_committee(v_tick);
  exception when others then raise warning 'tick %: committee expiry failed — %', v_tick, sqlerrm; end;
  -- Passed laws whose implementation time has come now flip the policy + land their effects (schema/155).
  begin perform public._implement_laws(v_tick);
  exception when others then raise warning 'tick %: law implementation failed — %', v_tick, sqlerrm; end;
  -- Crises (schema/99): fire any whose triggers are now all true, then climb each active
  -- crisis's meter and escalate stages. Runs last, on this tick's settled stats; its own
  -- per-nation / per-crisis isolation lives inside _apply_crisis_tick.
  begin perform public._apply_crisis_tick(v_tick);
  exception when others then raise warning 'tick %: crises failed — %', v_tick, sqlerrm; end;
  -- Minority-government confidence decay (schema/104) is RETIRED with Government Confidence.
  -- Coalition Health (schema/125/138/139/165) is now the sole government-stability gauge.
  -- World Events (schema/100): resolve any Competitive contest whose 3-tick sealed-bid window
  -- has closed (those where everyone bid early already resolved on the final bid). Isolated.
  begin perform public._resolve_overdue_world_events(v_tick);
  exception when others then raise warning 'tick %: world events failed — %', v_tick, sqlerrm; end;
  -- Seeded events (schema/136): on even calendar months, fire one random seeded world event
  -- from the admin's pool. Isolated so a bad definition can't abort the rest of the tick.
  begin perform public._fire_seeded_world_event(v_tick);
  exception when others then raise warning 'tick %: seeded event failed — %', v_tick, sqlerrm; end;
  -- Corporations (schema/47): release queued firms when their nation's climate is healthy
  -- (applies the sector bonus), compound each placed firm's cash by its growth, and fold
  -- insolvent private firms (reversing their bonus). Runs on this tick's settled economy.
  begin perform public._apply_corp_tick();
  exception when others then raise warning 'tick %: corporations failed — %', v_tick, sqlerrm; end;
  -- Debt→inflation backlog close-out: every $5B of debt ADDED this tick commits 0.2% inflation
  -- to the nation's pending pool (economy.inflation_pending); the pool then releases at most
  -- 0.2%/tick into actual inflation (clamped 0..100). 100B added → 4% that bleeds in over ~20
  -- ticks. Paying debt DOWN doesn't un-commit the pool — only net additions feed it. Runs last,
  -- after every debt-moving step (income, policy, crises).
  begin
    with base as (
      select n.id,
             coalesce((n.economy->>'inflation')::numeric, 0) as infl,
             round(coalesce((n.economy->>'inflation_pending')::numeric, 0)
                   + greatest(0, coalesce((n.economy->>'debt')::numeric, 0) - d.debt0) / 5 * 0.2, 2) as pend
      from public.nations n join _tick_debt0 d on d.id = n.id
    ), calc as (
      select id, infl, pend, least(0.2, pend) as rel from base   -- rel: inflation released this tick
    )
    update public.nations n
       set economy = jsonb_set(
             jsonb_set(n.economy, '{inflation}', to_jsonb(least(100, round(c.infl + c.rel, 2)))),
             '{inflation_pending}', to_jsonb(round(c.pend - c.rel, 2)))
      from calc c
     where c.id = n.id and c.pend > 0;
  exception when others then raise warning 'tick %: debt→inflation backlog failed — %', v_tick, sqlerrm; end;
  -- National-modifier bounds (schema/70): the FINAL stat step — clamp every bounded stat /
  -- resource to its active floor/ceiling, after all the moves above have settled, so a bound
  -- is the last word each tick. Isolated like every other step.
  begin perform public._apply_modifier_bounds();
  exception when others then raise warning 'tick %: modifier bounds failed — %', v_tick, sqlerrm; end;
  -- National Initiatives (schema/141): drain each active initiative's monthly cost and land the
  -- production raise on the ones that complete this tick — BEFORE the ceiling clamp below, so a
  -- completion's output gain is capped the same tick rather than overshooting for one month.
  begin perform public._advance_initiatives(v_tick);
  exception when others then raise warning 'tick %: initiatives failed — %', v_tick, sqlerrm; end;
  -- Per-nation production ceilings (schema/113): clamp energy/food/minerals output to each nation's
  -- authored ceiling, right after the modifier bounds so the tighter of the two caps holds.
  begin perform public._apply_production_ceilings();
  exception when others then raise warning 'tick %: production ceilings failed — %', v_tick, sqlerrm; end;
  -- Party popularity vs its effective ceiling (schema/130): a party that climbed to its ceiling
  -- and then had a same-archetype rival appear (crowding −2) would sit above the new ceiling —
  -- clamp it back down, so popularity never displays above the reach it actually has.
  begin perform public._reconcile_party_ceilings();
  exception when others then raise warning 'tick %: party ceiling reconcile failed — %', v_tick, sqlerrm; end;
  -- Inactivity purge (schema/97): delete parties idle past the deletion window (their politicians
  -- cascade, the nation slot frees up). Wall-clock, so it fires on whichever tick crosses 21 days.
  begin perform public._purge_inactive_parties();
  exception when others then raise warning 'tick %: inactive purge failed — %', v_tick, sqlerrm; end;
  -- Headline thresholds (schema/158): after the tick's stats settle, any nation whose stat crosses a
  -- threshold rule prints slanted headlines. Late in the tick so it reads final values; cooldown-guarded.
  begin perform public._resolve_headline_thresholds(v_tick);
  exception when others then raise warning 'tick %: headline thresholds failed — %', v_tick, sqlerrm; end;
  -- Party popularity snapshot (schema/147): the FINAL step — record each surviving party's
  -- settled popularity for this tick, so the Nation dashboard can draw a real approval trend.
  -- After the purge, so parties deleted this tick aren't snapshotted. Isolated like every step.
  begin perform public._snapshot_party_popularity(v_tick);
  exception when others then raise warning 'tick %: popularity snapshot failed — %', v_tick, sqlerrm; end;
  -- Nation stat snapshot (schema/162): record each nation's settled live Growth this tick, so the
  -- Growth page can draw a real trend. Also final (reads settled stats); isolated like every step.
  begin perform public._snapshot_nation_stats(v_tick);
  exception when others then raise warning 'tick %: nation stat snapshot failed — %', v_tick, sqlerrm; end;
  return jsonb_build_object('tick', v_tick, 'elections_resolved', v_count);
end $$;
revoke all on function public._advance_tick() from public, anon, authenticated;

-- The admin's manual lever: the same work as the cron path, behind the is_admin() gate.
create or replace function public.advance_tick()
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admin only.'; end if;
  return public._advance_tick();
end $$;
grant execute on function public.advance_tick() to authenticated;

-- ---------------------------------------------------------------------------
-- The 6-hour clock. Schedule _advance_tick() via pg_cron (00:00 / 06:00 / 12:00 / 18:00 UTC).
-- Idempotent — cron.schedule upserts by job name, so a re-apply re-arms the same job —
-- and wrapped so a project WITHOUT pg_cron (e.g. local dev) still applies the rest of
-- the schema. The job runs as the function owner, which clears the admin gate that
-- advance_tick() enforces for clients.
-- ONE SOURCE caveat: the topbar's "Next Tick" countdown (TICK_PERIOD_MS in util.js)
-- mirrors this cadence client-side. If you change the schedule here, change it there too.
-- ---------------------------------------------------------------------------
do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule('nationhood-tick', '0 */6 * * *', 'select public._advance_tick();');
exception when others then
  raise notice 'pg_cron not configured (%): enable it, then run cron.schedule(''nationhood-tick'', ''0 */6 * * *'', ''select public._advance_tick();'').', sqlerrm;
end $$;

-- RETIRED with Government Confidence — agenda delivery now restores Coalition Health (schema/165).
drop function if exists public._agenda_confidence_delta(text);

-- ---------------------------------------------------------------------------
-- agenda_enact(item): the PM (the government's formateur) carries out one pending
-- agenda item. Resolving resolves — the item is marked done and a heart of Coalition
-- Health is restored (capped at the formation max; no roll, no failure — one source:
-- _coalition_health_restore, schema/165). Costs the leading party 1 action.
-- PM-only, gated server-side. v1 does NOT apply the term's literal effect (e.g.
-- changing the regime); it marks the promise delivered and moves the public's standing.
-- ---------------------------------------------------------------------------
create or replace function public.agenda_enact(p_item uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_p public.parties%rowtype; v_item public.government_agenda%rowtype; v_gov public.governments%rowtype;
  v_hearts int; v_body text;
begin
  v_p := public._begin_action(0);   -- locks the caller's party, requires >= 1 action
  select * into v_item from public.government_agenda where id = p_item;
  if not found then raise exception 'That agenda item is gone.'; end if;
  if v_item.status = 'done' then raise exception 'That item is already delivered.'; end if;
  select * into v_gov from public.governments where id = v_item.government_id;
  if v_gov.status <> 'active' then raise exception 'That government is no longer in power.'; end if;
  if v_gov.formateur_party_id is distinct from v_p.id then
    raise exception 'Only the leading party of the government can enact its agenda.';
  end if;

  update public.government_agenda set status = 'done' where id = p_item;
  -- Delivering a promise restores a heart of Coalition Health, capped at the formation max
  -- (one source: _coalition_health_restore, schema/165). Null-health legacy govts are skipped.
  v_hearts := public._coalition_health_restore(v_gov.id, 1);

  v_body := 'The ' || v_p.name || ' government delivered on its agenda' ||
            (case when v_hearts is not null then ' — Coalition Health restored to ' || v_hearts || ' heart' || (case when v_hearts = 1 then '' else 's' end) else '' end) || '.';
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_gov.nation_id, v_p.id, 'agenda', v_body, public.current_game_date());

  return jsonb_build_object('coalition_health', v_hearts, 'actions', v_p.influence);
end $$;
grant execute on function public.agenda_enact(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- agenda_fulfill_ministry(item, politician): the ministry-specific path of enacting.
-- The PM seats a chosen politician of the promised RECIPIENT party (params.to_party,
-- set in the coalition deal) into the matching cabinet portfolio. It marks the promise
-- done and restores a heart of Coalition Health (capped at the formation max, as the
-- cabinet fills out — one source: _coalition_health_restore, schema/165). Unlike agenda_enact
-- it costs NO action — staffing the cabinet you were handed isn't a leader action. It
-- validates the pick: the politician must belong to the recipient party, must not be a
-- field operative (Mayor / Grassroots Organizer), and must not already hold another
-- portfolio in this government. The appointment is recorded on the agenda row
-- (minister_id/minister_name/party_abbr) and read back by the cabinet (Government page).
-- PM-only, gated server-side.
-- ---------------------------------------------------------------------------
create or replace function public.agenda_fulfill_ministry(p_item uuid, p_politician uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_p public.parties%rowtype; v_item public.government_agenda%rowtype; v_gov public.governments%rowtype;
  v_recipient uuid; v_pol public.politicians%rowtype; v_min text; v_name text; v_abbr text;
  v_hearts int;
begin
  v_p := public._lock_party();   -- locks the caller's party (no action cost — staffing the cabinet is free)
  select * into v_item from public.government_agenda where id = p_item;
  if not found then raise exception 'That agenda item is gone.'; end if;
  if v_item.status = 'done' then raise exception 'That ministry is already filled.'; end if;
  if v_item.type <> 'ministry' then raise exception 'That agenda item is not a ministry to fill.'; end if;
  select * into v_gov from public.governments where id = v_item.government_id;
  if v_gov.status <> 'active' then raise exception 'That government is no longer in power.'; end if;
  if v_gov.formateur_party_id is distinct from v_p.id then
    raise exception 'Only the leading party of the government can fill its cabinet.';
  end if;

  v_recipient := nullif(v_item.params->>'to_party', '')::uuid;
  if v_recipient is null then raise exception 'This promise has no recipient party — set one in the coalition deal.'; end if;

  select * into v_pol from public.politicians where id = p_politician;
  if not found then raise exception 'No such politician.'; end if;
  if v_pol.party_id <> v_recipient then raise exception 'That politician is not a member of the promised party.'; end if;
  if v_pol.status in ('Mayor', 'Grassroots Organizer') then
    raise exception 'A Mayor or Grassroots Organizer takes no cabinet seat.';
  end if;
  -- One seat per politician: not already holding another portfolio in this government.
  if exists (
    select 1 from public.government_agenda
     where government_id = v_gov.id and type = 'ministry' and status = 'done'
       and nullif(params->>'minister_id', '')::uuid = p_politician
  ) then raise exception 'That politician already holds a portfolio in this cabinet.'; end if;

  v_min  := coalesce(nullif(v_item.params->>'ministry', ''), 'Ministry');
  v_name := btrim(v_pol.first_name || ' ' || v_pol.last_name);
  select abbreviation into v_abbr from public.parties where id = v_recipient;

  update public.government_agenda
     set status = 'done',
         params = params || jsonb_build_object('minister_id', p_politician::text, 'minister_name', v_name, 'party_abbr', coalesce(v_abbr, ''))
   where id = p_item;
  -- Filling a promised cabinet seat restores a heart of Coalition Health (schema/165).
  v_hearts := public._coalition_health_restore(v_gov.id, 1);

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_gov.nation_id, v_p.id, 'agenda',
            v_name || ' was appointed Minister of ' || v_min ||
            (case when v_hearts is not null then '. Coalition Health restored to ' || v_hearts || ' heart' || (case when v_hearts = 1 then '' else 's' end) else '' end) || '.',
            public.current_game_date());

  return jsonb_build_object('coalition_health', v_hearts, 'minister', v_name);
end $$;
grant execute on function public.agenda_fulfill_ministry(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- THE FORMATION-WINDOW CHOICE. Right after an election the formateur may keep
-- the coalition the voters expected ([Enter Agreed Coalition] = do nothing) or
-- break it ([Form New Coalition]). Both RPCs are gated to the formation tick
-- (governments.formed_tick = the current tick); once the clock advances the
-- choice is locked until the next election.
--
-- coalition_renege(): the [Form New Coalition] click. Burns the bridge — the
-- agreed coalition is dropped and the formateur is re-seated alone as a MINORITY
-- (no penalty yet). There is no going back to the deal. From here they have the
-- rest of the tick to assemble a new majority; fail and they simply stay the
-- minority. Only the formateur of an active COALITION may call it.
-- ---------------------------------------------------------------------------
create or replace function public.coalition_renege()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_p public.parties%rowtype; v_gov public.governments%rowtype; v_tick int; v_health int;
begin
  v_p := public._lock_party();   -- locks the caller's party (serializes; double-fire safe)
  select current_tick into v_tick from public.game_state where id;
  select * into v_gov from public.governments
    where nation_id = v_p.nation_id and status = 'active' for update;
  if not found then raise exception 'There is no sitting government to leave.'; end if;
  if v_gov.formateur_party_id is distinct from v_p.id then
    raise exception 'Only the party that formed the government can break its coalition.';
  end if;
  if v_gov.type <> 'coalition' then raise exception 'There is no coalition agreement to walk away from.'; end if;
  if v_gov.formed_tick <> v_tick then raise exception 'The window to reshape this government has closed.'; end if;
  -- One reshuffle per term: if anything was already retired this tick (a prior
  -- renege/install), the choice has been spent.
  if exists (select 1 from public.governments
               where nation_id = v_p.nation_id and status = 'replaced' and formed_tick = v_tick) then
    raise exception 'You have already reshaped the government this term.';
  end if;

  -- Re-seat the formateur alone as a minority. _seat_government retires the
  -- coalition (→ replaced, stamped THIS tick — the proof a renege happened) and
  -- seats the minority. No penalty: the gamble itself is the cost.
  v_health := public._seat_government(v_p.nation_id, v_p.id, 'minority', null, 0);

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_p.nation_id, v_p.id, 'government',
            'The ' || v_p.name || ' walked away from its coalition agreement to seek a new majority, governing alone for now (Coalition Health ' || v_health || ' heart' || (case when v_health = 1 then '' else 's' end) || ').',
            public.current_game_date());

  return jsonb_build_object('coalition_health', v_health, 'type', 'minority');
end $$;
grant execute on function public.coalition_renege() to authenticated;

-- ---------------------------------------------------------------------------
-- coalition_install(neg): seal the replacement. Callable only by a formateur who
-- reneged THIS tick (now governing as a minority) and hosts a committed
-- agreement that reaches a majority. Seats the new coalition and docks the
-- formateur 5% of its Popularity — the cost of handing the public a government it
-- didn't vote for. Succeed and the −5% lands; never call this and you just remain
-- the minority (no penalty).
-- ---------------------------------------------------------------------------
create or replace function public.coalition_install(p_neg uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_p public.parties%rowtype; v_gov public.governments%rowtype; v_n public.negotiations%rowtype;
  v_tick int; v_health int; v_newpop numeric; v_pophit numeric;
begin
  v_p := public._lock_party();
  select current_tick into v_tick from public.game_state where id;

  select * into v_gov from public.governments
    where nation_id = v_p.nation_id and status = 'active' for update;
  if not found then raise exception 'There is no sitting government to replace.'; end if;
  if v_gov.formateur_party_id is distinct from v_p.id then raise exception 'Only the formateur can install a new coalition.'; end if;
  if v_gov.type <> 'minority' or v_gov.formed_tick <> v_tick then
    raise exception 'You can only install a new coalition right after walking away from one.';
  end if;
  -- Proof a coalition was actually reneged this tick (excludes an election minority).
  if not exists (select 1 from public.governments
                   where nation_id = v_p.nation_id and status = 'replaced'
                     and type = 'coalition' and formed_tick = v_tick) then
    raise exception 'You can only install a new coalition right after walking away from one.';
  end if;

  -- The replacement: a committed agreement you host. Its committed status IS the
  -- majority guarantee — coalition_commit enforced that against this tick's seats,
  -- and nothing shifts mid-tick, so there's nothing to re-check here.
  select * into v_n from public.negotiations where id = p_neg;
  if not found then raise exception 'That agreement is gone.'; end if;
  if v_n.host_party_id is distinct from v_p.id then raise exception 'You can only install your own agreement.'; end if;
  if v_n.status <> 'committed' then raise exception 'Form the agreement before installing it.'; end if;

  -- Seat the new coalition; dock 5% of the formateur's Popularity (proportionate —
  -- stings without ever zeroing a small party), report what actually landed.
  -- _seat_government inherits the new agenda before we close the agreement below.
  v_health := public._seat_government(v_p.nation_id, v_p.id, 'coalition', p_neg, 5);
  v_newpop := round(v_p.popularity * 0.95, 1);
  v_pophit := v_p.popularity - v_newpop;
  update public.parties set popularity = v_newpop where id = v_p.id;
  update public.negotiations set status = 'closed' where id = p_neg;

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_p.nation_id, v_p.id, 'government',
            'The ' || v_p.name || ' formed a new coalition, abandoning the agreement voters expected. Coalition Health '
            || v_health || ' heart' || (case when v_health = 1 then '' else 's' end) || ', Popularity −' || trim(to_char(v_pophit, 'FM990.0')) || '%.',
            public.current_game_date());

  return jsonb_build_object('coalition_health', v_health, 'popularity', v_newpop, 'pop_delta', v_pophit, 'type', 'coalition');
end $$;
grant execute on function public.coalition_install(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- coalition_form_government(neg): the mid-term [Form Government] click. A sitting
-- MINORITY government's PM (the formateur) seats a committed majority coalition
-- between elections — no election needed. Unlike the renege→install window this
-- isn't gated to the formation tick; it's the natural move for a minority that has
-- finally assembled a majority at the table. The new coalition is seated at its
-- formation Coalition Health (2 + 1 per 2 governing parties); the agreed terms
-- become its pending agenda.
--
-- Guard: if a coalition was reneged THIS tick, the penalised install path governs
-- instead (don't undercut the −5/−5 "defied the voters" cost in that window).
-- ---------------------------------------------------------------------------
create or replace function public.coalition_form_government(p_neg uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_p public.parties%rowtype; v_gov public.governments%rowtype; v_n public.negotiations%rowtype;
  v_tick int; v_health int;
begin
  v_p := public._lock_party();   -- locks the caller's party (serializes; double-fire safe)
  select current_tick into v_tick from public.game_state where id;

  select * into v_gov from public.governments
    where nation_id = v_p.nation_id and status = 'active' for update;
  if not found then raise exception 'There is no sitting government.'; end if;
  if v_gov.type <> 'minority' then raise exception 'Only a minority government can form a coalition between elections.'; end if;
  if v_gov.formateur_party_id is distinct from v_p.id then
    raise exception 'Only the party leading the minority government can form a coalition.';
  end if;
  -- Don't undercut the post-election renege→install window (its own −5/−5 cost).
  if exists (select 1 from public.governments
               where nation_id = v_p.nation_id and status = 'replaced'
                 and type = 'coalition' and formed_tick = v_tick) then
    raise exception 'You walked away from a coalition this turn — use Install New Coalition to seal the replacement.';
  end if;

  -- The replacement: a committed agreement you host. Its committed status IS the
  -- majority guarantee — coalition_commit enforced it against the current seats, and
  -- seats only move at elections (which close every agreement), so nothing to re-check.
  select * into v_n from public.negotiations where id = p_neg;
  if not found then raise exception 'That agreement is gone.'; end if;
  if v_n.host_party_id is distinct from v_p.id then raise exception 'You can only form your own agreement.'; end if;
  if v_n.status <> 'committed' then raise exception 'Form the coalition agreement before seating it.'; end if;

  -- Seat the coalition mid-term. _seat_government retires the minority, inherits the
  -- agreed agenda, then we close the consumed agreement.
  v_health := public._seat_government(v_p.nation_id, v_p.id, 'coalition', p_neg, 0, true);
  update public.negotiations set status = 'closed' where id = p_neg;

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_p.nation_id, v_p.id, 'government',
            'The ' || v_p.name || ' formed a majority coalition government (Coalition Health ' || v_health || ' heart' || (case when v_health = 1 then '' else 's' end) || ').',
            public.current_game_date());

  return jsonb_build_object('coalition_health', v_health, 'type', 'coalition');
end $$;
grant execute on function public.coalition_form_government(uuid) to authenticated;

-- ===========================================================================
-- Cabinet appointments — the head of government names ministers directly. One explicit
-- appointment per (government, portfolio); the Government-page cabinet shows these first and
-- falls back to the derived defaults (a coalition's fulfilled ministry promises, a minority's
-- own roster) for any seat left un-appointed. The whole cabinet is set in one action.
-- ===========================================================================
create table if not exists public.cabinet_appointments (
  government_id uuid not null references public.governments (id) on delete cascade,
  ministry      text not null,
  politician_id uuid not null references public.politicians (id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (government_id, ministry)
);
alter table public.cabinet_appointments enable row level security;
-- World-readable (the cabinet is public); writes are RPC-only.
drop policy if exists "cabinet_appt_select_all" on public.cabinet_appointments;
create policy "cabinet_appt_select_all" on public.cabinet_appointments for select using (true);

-- _apply_cabinet_slate(gov, nation, set): validate a jsonb slate of { ministry, politician_id }
-- and replace this government's cabinet with it (a ministry absent from the array is left vacant).
-- ONE source for HOW a cabinet slate is written — both cabinet_appoint (formation, below) and
-- cabinet_reshuffle (schema/120) call it, so the portfolio/nation validation and the
-- clear-and-insert live in exactly one place. Consequence layers (prestige Image grants,
-- popularity deltas) stay in the callers, computed from the OLD cabinet before this runs. INTERNAL.
create or replace function public._apply_cabinet_slate(p_gov uuid, p_nation text, p_set jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare
  r record; v_pol_nation text;
begin
  -- Validate: each entry is a real portfolio + a politician from THIS nation. Portfolios come
  -- from the one server source _ministries() (schema/138), so a crafted client can't seed junk
  -- rows / blow past the 11 real seats, and the slate + the vacant-cabinet penalty always agree.
  for r in select value->>'ministry' as ministry, nullif(value->>'politician_id','')::uuid as pol
             from jsonb_array_elements(coalesce(p_set, '[]'::jsonb)) loop
    if r.ministry is null or r.pol is null then continue; end if;
    if not (r.ministry = any(public._ministries())) then raise exception 'Unknown ministry: %', r.ministry; end if;
    select p.nation_id into v_pol_nation from public.politicians pol join public.parties p on p.id = pol.party_id where pol.id = r.pol;
    if v_pol_nation is distinct from p_nation then raise exception 'A chosen politician is not from your nation.'; end if;
  end loop;

  -- Replace the slate: clear, then insert the provided (non-null) appointments. Distinct on
  -- ministry so a stray duplicate can't violate the per-portfolio primary key.
  delete from public.cabinet_appointments where government_id = p_gov;
  insert into public.cabinet_appointments (government_id, ministry, politician_id)
    select distinct on (ministry) p_gov, ministry, pol from (
      select value->>'ministry' as ministry, nullif(value->>'politician_id','')::uuid as pol
        from jsonb_array_elements(coalesce(p_set, '[]'::jsonb))
    ) s where ministry is not null and pol is not null;
end $$;
revoke all on function public._apply_cabinet_slate(uuid, text, jsonb) from public, anon, authenticated;

-- cabinet_appoint(set): the HoG sets the whole cabinet in ONE action. `set` is a jsonb array
-- of { ministry, politician_id } — the new full slate (a ministry absent from the array is
-- left vacant). Appointing a politician to a PRESTIGE portfolio (Economic Development /
-- Interior / Foreign Affairs / Trade) they didn't already hold there grants them +1 Image
-- (com), clamped at 10 so re-appointing can't pump it. PM-only, 1 action, gated server-side.
create or replace function public.cabinet_appoint(p_set jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_party public.parties%rowtype; v_gov public.governments%rowtype; r record; v_grants int := 0;
  c_prestige constant text[] := array['Economic Development', 'Interior', 'Foreign Affairs', 'Trade'];
begin
  v_party := public._begin_action(0);   -- requires >= 1 action
  select * into v_gov from public.governments where nation_id = v_party.nation_id and status = 'active';
  if not found then raise exception 'There is no sitting government.'; end if;
  if v_gov.formateur_party_id is distinct from v_party.id then raise exception 'Only the head of government appoints the cabinet.'; end if;

  -- +1 Image for a genuine NEW appointment to a prestige portfolio (read BEFORE the replace).
  for r in select value->>'ministry' as ministry, nullif(value->>'politician_id','')::uuid as pol
             from jsonb_array_elements(coalesce(p_set, '[]'::jsonb)) loop
    if r.ministry is null or r.pol is null or not (r.ministry = any(c_prestige)) then continue; end if;
    if r.pol is distinct from (select politician_id from public.cabinet_appointments where government_id = v_gov.id and ministry = r.ministry) then
      update public.politicians set com = least(10, coalesce(com, 0) + 1) where id = r.pol;
      v_grants := v_grants + 1;
    end if;
  end loop;

  perform public._apply_cabinet_slate(v_gov.id, v_party.nation_id, p_set);   -- one source for the slate write

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_party.nation_id, v_party.id, 'government', v_party.name || ' named its cabinet.', public.current_game_date());

  return jsonb_build_object('actions', v_party.influence, 'image_grants', v_grants);
end $$;
grant execute on function public.cabinet_appoint(jsonb) to authenticated;

notify pgrst, 'reload schema';
