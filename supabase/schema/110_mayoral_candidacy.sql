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

-- ---------------------------------------------------------------------------
-- Resolution — the deferred half, now built. Called from _advance_tick (schema/60) every
-- tick for every city whose election has come due (mayor_election_tick <= the new tick).
--
-- Each declared candidate scores 1D10 + campaign spend + the candidate's Charisma; the sitting
-- NPC mayor defends with 1D10 + an incumbency bonus, so a challenger must BEAT it (a tie holds
-- the incumbent — "no change"). Only the strongest challenger faces the incumbent (the rest
-- can't do better), so this is the same winner a full multi-way max would pick. A winning
-- party's candidate takes the chair and the party's popularity FLOOR rises by the city's prize
-- — 0.4% per 1M inhabitants — clamped to the invariant: floor never exceeds ceiling, and
-- popularity is pulled up to (never above) the new floor. The term then runs 12 ticks. Only a
-- CONTESTED race announces; an unopposed incumbent re-election is silent (no feed spam).
-- ---------------------------------------------------------------------------
create or replace function public._resolve_mayoral_elections(p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare v_city record; v_best record; v_inc int; v_prize numeric;
begin
  for v_city in
    select c.id, c.name, c.nation_id, c.mayor_name, coalesce(c.pop_pct, 0) as pop_pct, coalesce(n.population, 0) as population
      from public.cities c join public.nations n on n.id = c.nation_id
     where c.mayor_election_tick is not null and c.mayor_election_tick <= p_tick
  loop
    -- Strongest challenger (null if nobody declared). Independent random per candidate.
    select mc.party_id, mc.candidate_name,
           (floor(random() * 10)::int + 1 + mc.spend + coalesce(p.cha, 0)) as score
      into v_best
      from public.mayoral_candidacies mc
      left join public.politicians p on p.id = mc.politician_id
     where mc.city_id = v_city.id
     order by score desc, random() limit 1;

    v_inc := floor(random() * 10)::int + 1 + 4;   -- incumbent: 1D10 + 4 incumbency advantage

    if v_best.party_id is not null and v_best.score > v_inc then
      v_prize := round(0.4 * (v_city.population * v_city.pop_pct / 100.0), 1);   -- population is already in millions
      update public.cities set mayor_name = v_best.candidate_name, mayor_election_tick = p_tick + 12 where id = v_city.id;
      if v_prize > 0 then
        update public.parties                                            -- floor prize (invariant-safe)
           set pop_floor  = least(pop_ceiling, pop_floor + v_prize),
               popularity = greatest(popularity, least(pop_ceiling, pop_floor + v_prize))
         where id = v_best.party_id;
      end if;
      insert into public.events (nation_id, party_id, kind, body, game_date)
        values (v_city.nation_id, v_best.party_id, 'party',
                v_best.candidate_name || ' has been elected Mayor of ' || v_city.name
                || case when v_prize > 0 then ' — popularity floor +' || trim(to_char(v_prize, 'FM990.0')) || '%.' else '.' end,
                public.current_game_date());
    else
      update public.cities set mayor_election_tick = p_tick + 12 where id = v_city.id;
      if v_best.party_id is not null then   -- contested but the incumbent held
        insert into public.events (nation_id, party_id, kind, body, game_date)
          values (v_city.nation_id, null, 'party',
                  coalesce(nullif(v_city.mayor_name, ''), 'The incumbent') || ' held the mayoralty of ' || v_city.name || ' against the challenge.',
                  public.current_game_date());
      end if;
    end if;

    delete from public.mayoral_candidacies where city_id = v_city.id;   -- clear the resolved field
  end loop;
end $$;
revoke all on function public._resolve_mayoral_elections(int) from public, anon, authenticated;

notify pgrst, 'reload schema';
