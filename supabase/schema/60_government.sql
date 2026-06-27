-- 60 · Government formation + the election resolver
-- Depends on: 05 (game_state), 10 (nations), 20 (parties), 40 (events,
-- current_game_date), 45 (negotiations). Run after 45.
--
-- This is the turn/election engine. It is driven MANUALLY by the admin via
-- public.advance_tick() — there is NO cron job or trigger. advance_tick() bumps
-- the shared clock by one tick and resolves any nation whose election is due.
-- resolve_election() does the work: allocate seats from popularity, run the
-- formation cascade, write the government + its inherited agenda, compute
-- Government Confidence, reschedule the next election, and dissolve the nation's
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
-- kind of government, and the public's standing in it (Government Confidence).
-- Public read; written only through _seat_government (one seating path).
-- ---------------------------------------------------------------------------
create table if not exists public.governments (
  id                    uuid primary key default gen_random_uuid(),
  nation_id             text not null references public.nations (id),
  formateur_party_id    uuid references public.parties (id) on delete set null,  -- the party that formed + leads it
  type                  text not null,                 -- majority | coalition | minority
  confidence            numeric not null,               -- 0..100, public approval of this government (numeric so fractional per-tick effects accumulate)
  conf_breakdown        jsonb,                          -- the Confidence formula's parts at formation (base/crises/contradictions/majority/renege/modifier/formed); the panel reads this, never recomputes
  formed_tick           int  not null,                 -- the tick it formed; the formation window (renege) reads this
  source_negotiation_id uuid references public.negotiations (id) on delete set null, -- the committed agreement, if a coalition
  status                text not null default 'active', -- active | replaced
  created_at            timestamptz not null default now()
);
create unique index if not exists governments_one_active_per_nation
  on public.governments (nation_id) where status = 'active';
alter table public.governments add column if not exists conf_breakdown jsonb;  -- additive: existing deployments get it on re-apply
-- Widen int → numeric so a fractional per-tick effect (e.g. a policy's −0.3 Government
-- Confidence) accumulates instead of rounding straight back to the same integer each tick.
alter table public.governments alter column confidence type numeric using confidence::numeric;

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
-- _seat_government(...): the ONE place a government is seated. Works out the
-- membership (a coalition = host + accepted partners; otherwise the formateur
-- alone), computes Government Confidence (50 − 2·crises − 4·opposite-pole
-- partners + majority-size bonus, minus an optional penalty), retires the
-- sitting government, inserts the new one stamped with the current tick, and
-- inherits the source coalition's agreed terms as a pending agenda. Returns the
-- resulting Confidence. INTERNAL — called by resolve_election (a fresh election,
-- penalty 0), the renege/install RPCs (penalty 5 for breaking the deal), and
-- coalition_form_government (p_midterm: a minority PM building a majority mid-term).
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
  v_seats int; v_form_arch text; v_members uuid[];
  v_govt_seats int; v_contra int; v_maj int; v_crises int := 0; v_conf int; v_gid uuid; v_mod_form numeric; v_ceil numeric;
  v_base int := case when p_type = 'minority' then 30 else 50 end;  -- minority govts start lower
begin
  select coalesce(legislature_seats, 0) into v_seats from public.nations where id = p_nation;
  select archetype into v_form_arch from public.parties where id = p_formateur;

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

  -- Confidence: 50 − 2·(active crises) − 4·(opposite-pole partners) + majority-size
  -- bonus, then minus the caller's penalty. Crises aren't tracked yet → 0 for now.
  select coalesce(sum(seats), 0) into v_govt_seats from public.parties where id = any(v_members);
  select count(*) into v_contra
    from public.parties p
    join public.archetype_oppositions o on o.archetype = v_form_arch and o.opposes = p.archetype
   where p.id = any(v_members) and p.id <> p_formateur;
  -- Integer parts so the stored breakdown sums exactly to the result: every term
  -- but the bonus is already an integer, so rounding the bonus alone is identical
  -- to rounding the whole sum.
  v_maj := case when v_seats > 0 and (v_govt_seats::numeric / v_seats * 100) > 50
                then round((v_govt_seats::numeric / v_seats * 100 - 50) / 2)::int else 0 end;
  -- National modifiers on the nation: a signed formation penalty/bonus, and the
  -- most-restrictive confidence ceiling (100 if none).
  v_mod_form := round(public._mod_confidence_formation(p_nation));
  v_ceil     := public._mod_confidence_ceiling(p_nation);
  -- Mid-term coalition (a minority PM building a majority between elections): always
  -- starts at 30, contradiction penalties only — no majority bonus, no national
  -- formation modifier, no penalty. "Starts at 30% + penalties, no bonuses."
  if p_midterm then v_base := 30; v_maj := 0; v_mod_form := 0; end if;
  v_conf := greatest(0, least(v_ceil, v_base - 2 * v_crises - 4 * v_contra + v_maj - p_conf_penalty + v_mod_form))::int;

  -- Retire the sitting government, seat the new one (stamped with the tick it
  -- formed, plus the Confidence parts for the panel to read back).
  update public.governments set status = 'replaced' where nation_id = p_nation and status = 'active';
  insert into public.governments (nation_id, formateur_party_id, type, confidence, formed_tick, source_negotiation_id, conf_breakdown)
    values (p_nation, p_formateur, p_type, v_conf, (select current_tick from public.game_state where id), p_source,
            jsonb_build_object('base', v_base, 'crises', -2 * v_crises, 'contradictions', -4 * v_contra,
                               'majority', v_maj, 'renege', -p_conf_penalty, 'modifier', v_mod_form::int, 'formed', v_conf))
    returning id into v_gid;
  -- A coalition inherits its agreed terms as a pending agenda (not auto-applied).
  if p_source is not null then
    insert into public.government_agenda (government_id, type, params, status)
      select v_gid, type, params, 'pending' from public.negotiation_terms where negotiation_id = p_source;
  end if;

  return v_conf;
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
-- lead-in on the results event — the confidence-collapse path passes the forced-
-- resignation framing so the snap election still reuses this one seat-allocation source.
drop function if exists public.resolve_election(text);
create or replace function public.resolve_election(p_nation text, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seats int; v_threshold numeric; v_freq int; v_tick int; v_majority int;
  v_old_conf int; v_incumbents uuid[];
  v_formateur_id uuid; v_form_seats int; v_coal_host uuid;
  v_type text; v_source uuid; v_conf int;
  v_nname text; v_year int; v_results text := ''; v_idx int := 0; v_cnt int; rec record;
  v_ruling text; v_fname text;
begin
  select legislature_seats, coalesce(electoral_threshold, 0), coalesce(election_frequency_months, 60)
    into v_seats, v_threshold, v_freq from public.nations where id = p_nation;
  if v_seats is null then raise exception 'Unknown nation %.', p_nation; end if;
  select current_tick into v_tick from public.game_state where id;
  v_majority := public._majority(v_seats);  -- one source (schema/45)

  -- Outgoing government → the incumbents who get the Confidence seat modifier.
  select confidence into v_old_conf from public.governments where nation_id = p_nation and status = 'active';
  select coalesce(array_agg(id), '{}') into v_incumbents from public.parties where nation_id = p_nation and in_government;

  -- ---- SEAT ALLOCATION ----------------------------------------------------
  -- Reset, then allocate to parties at/above the threshold by popularity × a
  -- ±15% jitter × the incumbents' Confidence modifier. Largest-remainder fills
  -- exactly the legislature, so seats always sum to v_seats.
  update public.parties set seats = 0 where nation_id = p_nation;
  with elig as materialized (   -- materialized so each party's random() jitter is computed once
    select id,
      popularity::numeric * (0.85 + random() * 0.30) *
        (case when id = any(v_incumbents) then
           case when v_old_conf < 40 then 0.85 when v_old_conf > 50 then 1.15 else 1.0 end
         else 1.0 end) as w
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
  -- Members, Confidence, the government row + its inherited agenda all happen in
  -- the single seating helper the renege/install path also calls. No penalty —
  -- an honest election doesn't dock the public's standing.
  v_conf := public._seat_government(p_nation, v_formateur_id, v_type, v_source, 0);

  -- ---- POST-ELECTION STANDINGS --------------------------------------------
  -- Every party sheds 30% of its standing popularity (never below its floor) — a
  -- fresh mandate resets the field. Runs after seat allocation, so it doesn't skew
  -- the result that was just computed from the pre-election popularity.
  update public.parties
     set popularity = greatest(pop_floor, round(popularity * 0.7, 1))
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
                  then 'The ' || v_fname || ' now leads ' || v_ruling || ' (Government Confidence ' || v_conf || '%).'
                  else 'The ' || v_fname || ' forms a ' || v_type || ' government (Government Confidence ' || v_conf || '%).' end),
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
  select coalesce(nullif(public.nation_declaration(p_nation, 'head_of_government_title'), ''), 'Prime Minister')
         || ' '
         || coalesce(
              (select nullif(btrim(first_name || ' ' || last_name), '') from public.politicians
                 where party_id = p_party and status = 'Party Leader'
                 order by created_at limit 1),
              (select name from public.parties where id = p_party),
              'the incumbent');
$$;
revoke all on function public._head_of_government_label(text, uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- _confidence_collapse(nation): when an active government's Confidence falls to
-- <=10 the head of government is forced to resign. The governing parties take a
-- popularity hit (the premier's party −5, other coalition members −3, through the
-- same floor-respecting helper policy effects use), then a snap election runs via
-- the normal resolver — so seat allocation has ONE source. Called ONLY from the two
-- paths that LOWER confidence (admin event, policy effect); never from formation,
-- so a government seated at <=10 doesn't instantly fall and there is no election
-- loop (the resolver never re-enters those lowering paths). Self-guards: no-ops
-- unless there is an active government actually at <=10. INTERNAL.
-- ---------------------------------------------------------------------------
create or replace function public._confidence_collapse(p_nation text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gov public.governments%rowtype;
  v_reason text;
begin
  select * into v_gov from public.governments where nation_id = p_nation and status = 'active';
  if not found or coalesce(v_gov.confidence, 100) > 10 then return; end if;

  -- Popularity penalty on the governing parties: premier −5, partners −3. Floor-
  -- respecting (same path as policy effects), then clamp 0..100. Runs BEFORE the
  -- election so the punished parties carry it into the snap result.
  update public.parties p
     set popularity = greatest(0, least(100, public._mod_floor_drop(
           p_nation, p.archetype, p.popularity,
           p.popularity - (case when p.id = v_gov.formateur_party_id then 5 else 3 end))))
   where p.nation_id = p_nation and p.in_government;

  -- Premier named before the election reseats everything (one source: the helper above).
  v_reason := 'Following a forced resignation from '
              || public._head_of_government_label(p_nation, v_gov.formateur_party_id)
              || ', new elections have been held. ';

  perform public.resolve_election(p_nation, v_reason);
end $$;
revoke all on function public._confidence_collapse(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- The tick. _advance_tick() is the BODY with NO admin gate, so the pg_cron job
-- (every 8h, scheduled at the foot of this file) can run it as the function owner;
-- the manual admin button calls advance_tick() — the gated wrapper below. Every
-- per-nation / per-item step runs in its own sub-block: a single failure is logged
-- (raise warning) and skipped, so one bad nation can never freeze the world clock.
-- Bumps the clock, refreshes every party's action budget to 12, applies monthly
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
  -- Every party gets a fresh turn: action budget reset to 12 each tick — plus 1 while a
  -- Deputy Leader serves (the Direct appointment, schema/109). The per-party target varies,
  -- so this resets all parties (still satisfies the require-a-WHERE-clause guard via id is not null).
  update public.parties p set actions_remaining = 12 + (case when exists (
           select 1 from public.politicians pl where pl.party_id = p.id and pl.status = 'Deputy Leader'
         ) then 1 else 0 end)
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
  -- January (the new month is January when (tick − 1) is a multiple of 12): apply
  -- each nation's annual income to its budget. A surplus fills the bank; a deficit
  -- (negative income) drains a positive budget, and any shortfall past zero rolls
  -- into the debt:  budget' = max(0, budget+income);  debt' = debt + max(0,
  -- -(budget+income)). Flat admin-set figure; only non-zero incomes. Event surfaces it.
  begin
  if (v_tick - 1) % 12 = 0 then
    -- raw = budget + income, computed once; budget floors at 0, the rest overflows to debt.
    update public.nations n
       set economy = jsonb_set(
             jsonb_set(n.economy, '{budget}', to_jsonb(round(greatest(0, s.raw), 1))),
             '{debt}', to_jsonb(round(coalesce((n.economy->>'debt')::numeric, 0) + greatest(0, -s.raw), 1)))
      from (
        select id, coalesce((economy->>'budget')::numeric, 0) + coalesce((economy->>'income')::numeric, 0) as raw
          from public.nations
         where coalesce((economy->>'income')::numeric, 0) <> 0 and not coalesce(dormant, false)
      ) s
     where n.id = s.id;
    insert into public.events (nation_id, party_id, kind, body, game_date)
    select n.id, null, 'income',
           'Annual income of ' || (case when (n.economy->>'income')::numeric < 0 then '−' else '+' end) ||
           coalesce(n.economy->>'currency', '$') || ltrim(n.economy->>'income', '-') ||
           'B applied — budget ' || coalesce(n.economy->>'currency', '$') || (n.economy->>'budget') ||
           'B, debt ' || coalesce(n.economy->>'currency', '$') || (n.economy->>'debt') || 'B.',
           public.current_game_date()
      from public.nations n
     where coalesce((n.economy->>'income')::numeric, 0) <> 0 and not coalesce(n.dormant, false);
  end if;
  exception when others then raise warning 'tick %: annual income failed — %', v_tick, sqlerrm; end;
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
  -- Lift any assigned National Modifier whose end conditions are all met (schema/70).
  delete from public.nation_modifiers nm
   where public._modifier_end_met(nm.modifier_id, nm.nation_id, nm.since_tick, v_tick);
  -- Agenda items whose scheduled month has arrived reach the floor automatically
  -- (schema/81). opened_tick starts their 6-tick window; scheduled_tick is cleared.
  with promoted as (
    update public.proposals set status = 'voting', opened_tick = v_tick, scheduled_tick = null
     where status = 'agenda' and scheduled_tick is not null and scheduled_tick <= v_tick
    returning nation_id, party_id, title
  )
  insert into public.events (nation_id, party_id, kind, body, game_date)
    select nation_id, party_id, 'declaration',
           'A measure reached the floor: ' || title || '.', public.current_game_date()
    from promoted;
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
  -- Adopted convictions' "while active" effects: standing modifiers + movement-based
  -- triggers, measured against last tick's snapshot (schema/94). Runs last, after this
  -- tick's stat changes, so it rewards the month's net movement.
  begin perform public._apply_conviction_triggers(v_tick);
  exception when others then raise warning 'tick %: conviction triggers failed — %', v_tick, sqlerrm; end;
  -- Crises (schema/99): fire any whose triggers are now all true, then climb each active
  -- crisis's meter and escalate stages. Runs last, on this tick's settled stats; its own
  -- per-nation / per-crisis isolation lives inside _apply_crisis_tick.
  begin perform public._apply_crisis_tick(v_tick);
  exception when others then raise warning 'tick %: crises failed — %', v_tick, sqlerrm; end;
  -- Minority-government instability (schema/104): each active minority government bleeds −0.3
  -- Government Confidence this tick, and falls to a snap election (with a standing penalty on the
  -- head of government's party) if that erosion takes it below 20%. Runs on this tick's settled
  -- confidence; its own per-nation isolation lives inside _apply_minority_confidence.
  begin perform public._apply_minority_confidence(v_tick);
  exception when others then raise warning 'tick %: minority confidence failed — %', v_tick, sqlerrm; end;
  -- World Events (schema/100): resolve any Competitive contest whose 3-tick sealed-bid window
  -- has closed (those where everyone bid early already resolved on the final bid). Isolated.
  begin perform public._resolve_overdue_world_events(v_tick);
  exception when others then raise warning 'tick %: world events failed — %', v_tick, sqlerrm; end;
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
  -- Inactivity purge (schema/97): delete parties idle past the deletion window (their politicians
  -- cascade, the nation slot frees up). Wall-clock, so it fires on whichever tick crosses 21 days.
  begin perform public._purge_inactive_parties();
  exception when others then raise warning 'tick %: inactive purge failed — %', v_tick, sqlerrm; end;
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
-- The 8-hour clock. Schedule _advance_tick() via pg_cron (00:00 / 08:00 / 16:00 UTC).
-- Idempotent — cron.schedule upserts by job name, so a re-apply re-arms the same job —
-- and wrapped so a project WITHOUT pg_cron (e.g. local dev) still applies the rest of
-- the schema. The job runs as the function owner, which clears the admin gate that
-- advance_tick() enforces for clients.
-- ONE SOURCE caveat: the topbar's "Next Tick" countdown (TICK_PERIOD_MS in topbar.js)
-- mirrors this cadence client-side. If you change the schedule here, change it there too.
-- ---------------------------------------------------------------------------
do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule('nationhood-tick', '0 */8 * * *', 'select public._advance_tick();');
exception when others then
  raise notice 'pg_cron not configured (%): enable it, then run cron.schedule(''nationhood-tick'', ''0 */8 * * *'', ''select public._advance_tick();'').', sqlerrm;
end $$;

-- ---------------------------------------------------------------------------
-- agenda_enact(item): the PM (the government's formateur) carries out one pending
-- agenda item. Resolving resolves — the item is marked done and Government
-- Confidence rises a flat +3 (clamped at 100; no roll, no failure). Costs the
-- leading party 1 action. PM-only, gated server-side. v1 does NOT apply the
-- term's literal effect (e.g. changing the regime); it marks the promise
-- delivered and moves the public's standing.
-- ---------------------------------------------------------------------------
create or replace function public.agenda_enact(p_item uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_p public.parties%rowtype; v_item public.government_agenda%rowtype; v_gov public.governments%rowtype;
  v_delta int := 3; v_newconf int; v_body text;
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

  v_newconf := least(public._mod_confidence_ceiling(v_gov.nation_id), v_gov.confidence + v_delta);
  v_delta := v_newconf - v_gov.confidence;   -- the gain actually applied (so the 100% cap never overstates)

  update public.government_agenda set status = 'done' where id = p_item;
  update public.governments set confidence = v_newconf where id = v_gov.id;
  update public.parties set actions_remaining = actions_remaining - 1 where id = v_p.id;

  v_body := 'The ' || v_p.name || ' government delivered on its agenda. Government Confidence +'
            || v_delta || '% (now ' || v_newconf || '%).';
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_gov.nation_id, v_p.id, 'agenda', v_body, public.current_game_date());

  return jsonb_build_object('delta', v_delta, 'confidence', v_newconf, 'actions', v_p.actions_remaining - 1);
end $$;
grant execute on function public.agenda_enact(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- agenda_fulfill_ministry(item, politician): the ministry-specific path of enacting.
-- The PM seats a chosen politician of the promised RECIPIENT party (params.to_party,
-- set in the coalition deal) into the matching cabinet portfolio. It marks the promise
-- done and raises Government Confidence +0.5 (a small, repeatable nudge as the cabinet
-- fills out — confidence is numeric, so the half-points accumulate). Unlike agenda_enact
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
  v_delta numeric := 0.5; v_newconf numeric;
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

  v_newconf := least(public._mod_confidence_ceiling(v_gov.nation_id), v_gov.confidence + v_delta);
  v_delta := v_newconf - v_gov.confidence;   -- the gain actually applied (so the cap never overstates)

  update public.government_agenda
     set status = 'done',
         params = params || jsonb_build_object('minister_id', p_politician::text, 'minister_name', v_name, 'party_abbr', coalesce(v_abbr, ''))
   where id = p_item;
  update public.governments set confidence = v_newconf where id = v_gov.id;

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_gov.nation_id, v_p.id, 'agenda',
            v_name || ' was appointed Minister of ' || v_min || '. Government Confidence +'
            || v_delta || '% (now ' || round(v_newconf, 1) || '%).',
            public.current_game_date());

  return jsonb_build_object('delta', v_delta, 'confidence', v_newconf, 'minister', v_name);
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
  v_p public.parties%rowtype; v_gov public.governments%rowtype; v_tick int; v_conf int;
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
  v_conf := public._seat_government(v_p.nation_id, v_p.id, 'minority', null, 0);

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_p.nation_id, v_p.id, 'government',
            'The ' || v_p.name || ' walked away from its coalition agreement to seek a new majority, governing alone for now (Government Confidence ' || v_conf || '%).',
            public.current_game_date());

  return jsonb_build_object('confidence', v_conf, 'type', 'minority');
end $$;
grant execute on function public.coalition_renege() to authenticated;

-- ---------------------------------------------------------------------------
-- coalition_install(neg): seal the replacement. Callable only by a formateur who
-- reneged THIS tick (now governing as a minority) and hosts a committed
-- agreement that reaches a majority. Seats the new coalition with a 5-point
-- Confidence penalty and docks the formateur 5 points of Popularity — the cost
-- of handing the public a government it didn't vote for. Succeed and the −5/−5
-- lands; never call this and you just remain the minority (no penalty).
-- ---------------------------------------------------------------------------
create or replace function public.coalition_install(p_neg uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_p public.parties%rowtype; v_gov public.governments%rowtype; v_n public.negotiations%rowtype;
  v_tick int; v_conf int; v_newpop numeric; v_pophit numeric;
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

  -- Seat the new coalition with the −5 Confidence penalty; dock 5% of the
  -- formateur's Popularity (proportionate — stings without ever zeroing a small
  -- party), report what actually landed. _seat_government inherits the new agenda
  -- before we close the agreement below.
  v_conf   := public._seat_government(v_p.nation_id, v_p.id, 'coalition', p_neg, 5);
  v_newpop := round(v_p.popularity * 0.95, 1);
  v_pophit := v_p.popularity - v_newpop;
  update public.parties set popularity = v_newpop where id = v_p.id;
  update public.negotiations set status = 'closed' where id = p_neg;

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_p.nation_id, v_p.id, 'government',
            'The ' || v_p.name || ' formed a new coalition, abandoning the agreement voters expected. Government Confidence '
            || v_conf || '%, Popularity −' || trim(to_char(v_pophit, 'FM990.0')) || '%.',
            public.current_game_date());

  return jsonb_build_object('confidence', v_conf, 'popularity', v_newpop, 'pop_delta', v_pophit, 'type', 'coalition');
end $$;
grant execute on function public.coalition_install(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- coalition_form_government(neg): the mid-term [Form Government] click. A sitting
-- MINORITY government's PM (the formateur) seats a committed majority coalition
-- between elections — no election needed. Unlike the renege→install window this
-- isn't gated to the formation tick; it's the natural move for a minority that has
-- finally assembled a majority at the table. The new coalition starts at 30%
-- Confidence less 4 per contradictory partner (no majority bonus, no modifier — see
-- _seat_government's p_midterm path); the agreed terms become its pending agenda.
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
  v_tick int; v_conf int;
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

  -- Seat the coalition mid-term (p_midterm → starts at 30, contradiction penalties
  -- only). _seat_government retires the minority, inherits the agreed agenda, then we
  -- close the consumed agreement.
  v_conf := public._seat_government(v_p.nation_id, v_p.id, 'coalition', p_neg, 0, true);
  update public.negotiations set status = 'closed' where id = p_neg;

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_p.nation_id, v_p.id, 'government',
            'The ' || v_p.name || ' formed a majority coalition government (Government Confidence ' || v_conf || '%).',
            public.current_game_date());

  return jsonb_build_object('confidence', v_conf, 'type', 'coalition');
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

-- cabinet_appoint(set): the HoG sets the whole cabinet in ONE action. `set` is a jsonb array
-- of { ministry, politician_id } — the new full slate (a ministry absent from the array is
-- left vacant). Appointing a politician to a PRESTIGE portfolio (Economic Development /
-- Interior / Foreign Affairs / Trade) they didn't already hold there grants them +1 Image
-- (com), clamped at 10 so re-appointing can't pump it. PM-only, 1 action, gated server-side.
create or replace function public.cabinet_appoint(p_set jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_party public.parties%rowtype; v_gov public.governments%rowtype; r record; v_pol_nation text; v_grants int := 0;
  c_prestige constant text[] := array['Economic Development', 'Interior', 'Foreign Affairs', 'Trade'];
  -- Canonical portfolios (mirrors MINISTRIES in ministries.js). The server validates
  -- independently so a crafted client can't seed junk rows / blow past the 11 real seats.
  c_ministries constant text[] := array['Defence', 'Treasury', 'Interior', 'Foreign Affairs',
    'Trade', 'Labour', 'Justice', 'Health', 'Education', 'Energy', 'Economic Development'];
begin
  v_party := public._begin_action(0);   -- requires >= 1 action
  select * into v_gov from public.governments where nation_id = v_party.nation_id and status = 'active';
  if not found then raise exception 'There is no sitting government.'; end if;
  if v_gov.formateur_party_id is distinct from v_party.id then raise exception 'Only the head of government appoints the cabinet.'; end if;

  -- Validate: each entry is a real portfolio + a politician from THIS nation.
  for r in select value->>'ministry' as ministry, nullif(value->>'politician_id','')::uuid as pol
             from jsonb_array_elements(coalesce(p_set, '[]'::jsonb)) loop
    if r.ministry is null or r.pol is null then continue; end if;
    if not (r.ministry = any(c_ministries)) then raise exception 'Unknown ministry: %', r.ministry; end if;
    select p.nation_id into v_pol_nation from public.politicians pol join public.parties p on p.id = pol.party_id where pol.id = r.pol;
    if v_pol_nation is distinct from v_party.nation_id then raise exception 'A chosen politician is not from your nation.'; end if;
  end loop;

  -- +1 Image for a genuine NEW appointment to a prestige portfolio (read BEFORE the replace).
  for r in select value->>'ministry' as ministry, nullif(value->>'politician_id','')::uuid as pol
             from jsonb_array_elements(coalesce(p_set, '[]'::jsonb)) loop
    if r.ministry is null or r.pol is null or not (r.ministry = any(c_prestige)) then continue; end if;
    if r.pol is distinct from (select politician_id from public.cabinet_appointments where government_id = v_gov.id and ministry = r.ministry) then
      update public.politicians set com = least(10, coalesce(com, 0) + 1) where id = r.pol;
      v_grants := v_grants + 1;
    end if;
  end loop;

  -- Replace the slate: clear, then insert the provided (non-null) appointments. Distinct on
  -- ministry so a stray duplicate can't violate the per-portfolio primary key.
  delete from public.cabinet_appointments where government_id = v_gov.id;
  insert into public.cabinet_appointments (government_id, ministry, politician_id)
    select distinct on (ministry) v_gov.id, ministry, pol from (
      select value->>'ministry' as ministry, nullif(value->>'politician_id','')::uuid as pol
        from jsonb_array_elements(coalesce(p_set, '[]'::jsonb))
    ) s where ministry is not null and pol is not null;

  update public.parties set actions_remaining = actions_remaining - 1 where id = v_party.id;
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_party.nation_id, v_party.id, 'government', v_party.name || ' named its cabinet.', public.current_game_date());

  return jsonb_build_object('actions', v_party.actions_remaining - 1, 'image_grants', v_grants);
end $$;
grant execute on function public.cabinet_appoint(jsonb) to authenticated;

notify pgrst, 'reload schema';
