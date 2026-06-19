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
-- Public read; written only by the resolver.
-- ---------------------------------------------------------------------------
create table if not exists public.governments (
  id                    uuid primary key default gen_random_uuid(),
  nation_id             text not null references public.nations (id),
  formateur_party_id    uuid references public.parties (id) on delete set null,  -- the party that formed + leads it
  type                  text not null,                 -- majority | coalition | minority
  confidence            int  not null,                 -- 0..100, public approval of this government
  formed_tick           int  not null,
  source_negotiation_id uuid references public.negotiations (id) on delete set null, -- the committed agreement, if a coalition
  status                text not null default 'active', -- active | replaced
  created_at            timestamptz not null default now()
);
create unique index if not exists governments_one_active_per_nation
  on public.governments (nation_id) where status = 'active';

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
-- resolve_election(nation): the full pipeline for ONE nation. INTERNAL — execute
-- is revoked from clients; only advance_tick() (admin-gated, same owner) calls it.
-- ---------------------------------------------------------------------------
create or replace function public.resolve_election(p_nation text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seats int; v_threshold numeric; v_freq int; v_tick int; v_majority int;
  v_old_conf int; v_incumbents uuid[];
  v_formateur_id uuid; v_form_arch text; v_form_seats int;
  v_coal_host uuid; v_coal_arch text;
  v_type text; v_source uuid; v_members uuid[];
  v_govt_seats int; v_contra int; v_bonus numeric; v_crises int := 0; v_conf int;
  v_gid uuid;
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
  select id, archetype, seats into v_formateur_id, v_form_arch, v_form_seats
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
    select q.neg_id, q.host_id, q.host_arch into v_source, v_coal_host, v_coal_arch
    from (
      select n.id as neg_id, hp.id as host_id, hp.archetype as host_arch,
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
      v_type := 'coalition'; v_formateur_id := v_coal_host; v_form_arch := v_coal_arch;
    else
      v_type := 'minority';                            -- largest party governs alone, sans majority
    end if;
  end if;

  -- Members: a coalition is the host + its accepted partners; otherwise just the
  -- formateur.
  if v_type = 'coalition' then
    select array_agg(pid) into v_members from (
      select v_formateur_id as pid
      union
      select party_id from public.negotiation_parties where negotiation_id = v_source and status = 'accepted'
    ) m;
  else
    v_members := array[v_formateur_id];
  end if;

  update public.parties set in_government = (id = any(v_members)) where nation_id = p_nation;

  -- ---- GOVERNMENT CONFIDENCE ---------------------------------------------
  -- 50 − 2·(active crises) − 4·(opposite-pole partners) + majority-size bonus.
  -- Crises aren't tracked yet (no National Modifiers system) → 0 for now.
  select coalesce(sum(seats), 0) into v_govt_seats from public.parties where id = any(v_members);
  select count(*) into v_contra
    from public.parties p
    join public.archetype_oppositions o on o.archetype = v_form_arch and o.opposes = p.archetype
   where p.id = any(v_members) and p.id <> v_formateur_id;
  v_bonus := case when v_seats > 0 and (v_govt_seats::numeric / v_seats * 100) > 50
                  then (v_govt_seats::numeric / v_seats * 100 - 50) / 2 else 0 end;
  v_conf := greatest(0, least(100, round(50 - 2 * v_crises - 4 * v_contra + v_bonus)::int));

  -- ---- GOVERNMENT OBJECT + AGENDA ----------------------------------------
  update public.governments set status = 'replaced' where nation_id = p_nation and status = 'active';
  insert into public.governments (nation_id, formateur_party_id, type, confidence, formed_tick, source_negotiation_id)
    values (p_nation, v_formateur_id, v_type, v_conf, v_tick, v_source)
    returning id into v_gid;
  -- A coalition inherits its agreed terms as a pending agenda (not auto-applied).
  if v_source is not null then
    insert into public.government_agenda (government_id, type, params, status)
      select v_gid, type, params, 'pending' from public.negotiation_terms where negotiation_id = v_source;
  end if;

  -- ---- RESCHEDULE + DISSOLVE SAVED AGREEMENTS -----------------------------
  update public.nations set next_election_tick = v_tick + v_freq where id = p_nation;
  update public.negotiations set status = 'closed'
   where nation_id = p_nation and status in ('active', 'committed');

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (p_nation, v_formateur_id, 'election',
            'A general election was held. The ' || (select name from public.parties where id = v_formateur_id)
            || ' forms a ' || v_type || ' government (Government Confidence ' || v_conf || '%).',
            public.current_game_date());
end $$;
-- Internal only: clients can never call the resolver directly (advance_tick,
-- owned by the same role, still can). Revoke the default PUBLIC grant explicitly.
revoke all on function public.resolve_election(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- advance_tick(): the admin's single lever. Bumps the shared clock one tick and
-- resolves every nation whose election has come due. Admin-gated; no automation.
-- ---------------------------------------------------------------------------
create or replace function public.advance_tick()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_tick int; v_n text; v_count int := 0;
begin
  if not public.is_admin() then raise exception 'Admin only.'; end if;
  update public.game_state set current_tick = current_tick + 1 where id returning current_tick into v_tick;
  for v_n in
    select id from public.nations
     where next_election_tick is not null and next_election_tick <= v_tick
  loop
    perform public.resolve_election(v_n);
    v_count := v_count + 1;
  end loop;
  return jsonb_build_object('tick', v_tick, 'elections_resolved', v_count);
end $$;
grant execute on function public.advance_tick() to authenticated;

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

  v_newconf := least(100, v_gov.confidence + v_delta);
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
