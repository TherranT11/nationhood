-- ===========================================================================
-- 110 · Mayoral candidacy — the Direct "Announce Candidacy for Mayor" action.
-- Depends on: 107/108 (cities + mayor_election_tick), 109 (Direct), 40 (_begin_action,
-- _bare_party, events). Run after 109.
--
-- ANNOUNCE ONLY: a party fields a candidate in a city's mayoral race — it records the
-- candidacy, charges the campaign cost, and fires the announcement event. The RESOLUTION
-- (who wins at the city's next election, and the +0.4%/1M popularity-floor prize) is
-- deferred along with the rest of the mayoral-election automation. Candidacies sit here
-- until that resolver exists.
-- ===========================================================================

create table if not exists public.mayoral_candidacies (
  id            uuid primary key default gen_random_uuid(),
  city_id       uuid not null references public.cities (id) on delete cascade,
  party_id      uuid not null references public.parties (id) on delete cascade,
  politician_id uuid references public.politicians (id) on delete set null,
  candidate_name text not null,
  spend         int  not null default 0,          -- campaign-spend increments ($25K each) → +1 each at the election
  election_tick int,                              -- the city's mayor_election_tick when the run was declared
  created_at    timestamptz not null default now(),
  unique (city_id, party_id)                       -- one candidacy per party per city
);
create index if not exists mayoral_candidacies_city_idx on public.mayoral_candidacies (city_id);

-- RLS: world-readable (the field of candidates is public, shown in the Direct modal); writes
-- are RPC-only — no client insert/update/delete policies, so the cost + one-per-party rule
-- can't be bypassed. The SECURITY DEFINER RPC below is the only writer.
alter table public.mayoral_candidacies enable row level security;
drop policy if exists "mc_select_all" on public.mayoral_candidacies;
create policy "mc_select_all" on public.mayoral_candidacies for select using (true);

-- Announce a candidacy: the directed member runs for mayor of a city in the party's nation.
-- $100K base + the optional campaign spend ($25K each), and 1 action (the Direct cost model).
-- One candidacy per party per city. Resolution is deferred — this only records + announces.
create or replace function public.direct_mayor_announce(p_member uuid, p_city uuid, p_spend int default 0)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_p public.parties%rowtype; v_mname text; v_spend int := greatest(0, coalesce(p_spend, 0));
  v_cost bigint; v_city record;
begin
  v_cost := 100000 + v_spend::bigint * 25000;
  v_p := public._begin_action(v_cost);   -- locks party, requires ≥1 action + funds ≥ cost
  select btrim(first_name || ' ' || last_name) into v_mname from public.politicians where id = p_member and party_id = v_p.id;
  if not found then raise exception 'That isn''t one of your members.'; end if;
  select id, name, nation_id, mayor_election_tick into v_city from public.cities where id = p_city;
  if not found then raise exception 'No such city.'; end if;
  if v_city.nation_id <> v_p.nation_id then raise exception 'That city isn''t in your nation.'; end if;
  if exists (select 1 from public.mayoral_candidacies where city_id = p_city and party_id = v_p.id) then
    raise exception '%', 'Your party already has a candidate in ' || v_city.name || '.';
  end if;

  insert into public.mayoral_candidacies (city_id, party_id, politician_id, candidate_name, spend, election_tick)
    values (p_city, v_p.id, p_member, v_mname, v_spend, v_city.mayor_election_tick);
  update public.parties set funds = funds - v_cost, actions_remaining = actions_remaining - 1 where id = v_p.id;

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_p.nation_id, v_p.id, 'party',
            v_mname || ' of the ' || public._bare_party(v_p.name) || ' has announced their candidacy for mayor of ' || v_city.name || '.',
            public.current_game_date());

  return jsonb_build_object('city', v_city.name, 'candidate', v_mname, 'actions', v_p.actions_remaining - 1, 'funds', v_p.funds - v_cost);
end $$;
grant execute on function public.direct_mayor_announce(uuid, uuid, int) to authenticated;

notify pgrst, 'reload schema';
