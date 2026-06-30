-- ===========================================================================
-- 111 · Parliamentary runs — Run for Parliament becomes a SCHEDULED contest.
-- Depends on: 20 (parties + clamp helpers), 30 (politicians), 40 (_begin_action,
-- _effective_ceiling/_mod_cap_raise/_mod_floor_drop, _bare_party, events), 60
-- (_advance_tick), 110 (mayoral_candidacies — for the "busy" check). Run after 110.
--
-- Directing a member to Run for Parliament no longer resolves on the spot: it schedules
-- an election 1D3 ticks out (best case next tick, worst case 3 later). The rival party + a
-- generated backbencher's name are LOCKED at announcement (never the rival's leader — a leader's
-- own seat is never contested). _resolve_parliamentary_runs (called from the tick)
-- rolls 1D6 + the candidate's Image + campaign spend vs the rival's 1D10, applies the seat
-- steal + popularity swing, and puts the candidate on a 12-tick MP cooldown.
--
-- A politician who is mid-run (Parliament OR Mayor) is "busy" and can't be directed to
-- anything else until it resolves — see _politician_busy, enforced by every direct_* RPC.
-- ===========================================================================

-- Per-politician cooldown: the tick before which they can't stand for Parliament again.
alter table public.politicians add column if not exists mp_until_tick int;

create table if not exists public.mp_candidacies (
  id                uuid primary key default gen_random_uuid(),
  party_id          uuid not null references public.parties (id) on delete cascade,
  politician_id     uuid not null references public.politicians (id) on delete cascade,
  candidate_name    text not null,
  candidate_image   int  not null default 0,        -- snapshot of the candidate's Image at announce
  opponent_party_id uuid references public.parties (id) on delete set null,  -- locked at announce
  opponent_name     text,                           -- a generated backbencher of the rival party (never its leader)
  spend             int  not null default 0,         -- campaign-spend increments (+1 to the roll each)
  resolve_tick      int  not null,                   -- current tick + 1D3
  created_at        timestamptz not null default now()
);
create index if not exists mp_candidacies_resolve_idx on public.mp_candidacies (resolve_tick);

-- World-readable (the field of runs is public — the Direct modal reads it to mark who's
-- standing); writes are RPC-only. The SECURITY DEFINER RPC + resolver are the only writers.
alter table public.mp_candidacies enable row level security;
drop policy if exists "mpc_select_all" on public.mp_candidacies;
create policy "mpc_select_all" on public.mp_candidacies for select using (true);

-- Is this politician mid-run (Parliament or Mayor)? ONE source for the "can't be directed
-- while standing for office" rule, used by every direct_* RPC. References both run tables.
create or replace function public._politician_busy(p_member uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.mp_candidacies     where politician_id = p_member)
      or exists (select 1 from public.mayoral_candidacies where politician_id = p_member);
$$;
revoke all on function public._politician_busy(uuid) from public, anon, authenticated;

-- Does this politician currently hold a cabinet ministry in their nation's active government?
-- Either an explicit cabinet appointment (cabinet_appointments, schema/60) or a fulfilled
-- ministry promise (a DONE government_agenda 'ministry' row) whose portfolio hasn't since been
-- reassigned to someone else by an explicit appointment — mirrors how the Government page
-- resolves "who holds this seat" (explicit wins, else the fulfilled promise). A sitting minister
-- can't be directed to run for office, raise a paramilitary wing, or expand the youth wing
-- (they may still be made Deputy Leader — a party role, not a cabinet seat). ONE source for the
-- rule, enforced by those direct_* RPCs and mirrored client-side only to grey the buttons out.
create or replace function public._politician_is_minister(p_member uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.cabinet_appointments ca
      join public.governments g on g.id = ca.government_id and g.status = 'active'
     where ca.politician_id = p_member
  ) or exists (
    select 1 from public.government_agenda ga
      join public.governments g on g.id = ga.government_id and g.status = 'active'
     where ga.type = 'ministry' and ga.status = 'done'
       and nullif(ga.params->>'minister_id', '')::uuid = p_member
       and not exists (
         select 1 from public.cabinet_appointments ca2
          where ca2.government_id = g.id and ca2.ministry = ga.params->>'ministry'
       )
  );
$$;
revoke all on function public._politician_is_minister(uuid) from public, anon, authenticated;

-- Resolve every parliamentary run that has come due (resolve_tick <= p_tick). The candidate
-- rolls 1D6 + their snapshot Image + campaign spend vs the locked rival's 1D10; a win steals
-- one seat (you +1, them −1 — chamber total fixed) and swings 1% popularity each way (clamped
-- to the floor/ceiling invariant). The candidate then goes on a 12-tick MP cooldown either way.
create or replace function public._resolve_parliamentary_runs(p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare v_r record; v_p record; v_you int; v_field int; v_win boolean; v_newpop numeric; v_bare text; v_obare text;
begin
  for v_r in select * from public.mp_candidacies where resolve_tick <= p_tick loop
    select id, name, archetype, popularity, pop_floor, pop_ceiling, nation_id into v_p from public.parties where id = v_r.party_id;
    if found then
      v_you   := floor(random() * 6)::int + 1 + coalesce(v_r.candidate_image, 0) + coalesce(v_r.spend, 0);
      v_field := floor(random() * 10)::int + 1;
      v_win   := v_you > v_field;
      v_bare  := public._bare_party(v_p.name);
      v_obare := public._bare_party(coalesce((select name from public.parties where id = v_r.opponent_party_id), 'a rival party'));

      if v_win then
        v_newpop := least(v_p.popularity + 1, public._effective_ceiling(v_p.nation_id, v_p.archetype, v_p.pop_ceiling, v_p.pop_floor));
        v_newpop := public._mod_cap_raise(v_p.nation_id, v_p.archetype, v_p.popularity, v_newpop);
        update public.parties set seats = seats + 1, popularity = v_newpop where id = v_p.id;
        if v_r.opponent_party_id is not null then
          update public.parties
             set seats = greatest(0, seats - 1),
                 popularity = public._mod_floor_drop(nation_id, archetype, popularity, greatest(popularity - 1, pop_floor))
           where id = v_r.opponent_party_id;
        end if;
        insert into public.events (nation_id, party_id, kind, body, game_date)
          values (v_p.nation_id, v_p.id, 'party',
                  v_r.candidate_name || ' of the ' || v_bare || ' won the seat against ' || coalesce(v_r.opponent_name, 'their rival')
                  || ' of the ' || v_obare || ' (rolled ' || v_you || ' vs ' || v_field || '). +1 seat, +1% popularity.',
                  public.current_game_date());
      else
        insert into public.events (nation_id, party_id, kind, body, game_date)
          values (v_p.nation_id, v_p.id, 'party',
                  v_r.candidate_name || ' of the ' || v_bare || ' lost the seat to ' || coalesce(v_r.opponent_name, 'their rival')
                  || ' of the ' || v_obare || ' (rolled ' || v_you || ' vs ' || v_field || ').',
                  public.current_game_date());
      end if;

      update public.politicians set mp_until_tick = p_tick + 12 where id = v_r.politician_id;   -- 12-tick MP cooldown
    end if;
    delete from public.mp_candidacies where id = v_r.id;
  end loop;
end $$;
revoke all on function public._resolve_parliamentary_runs(int) from public, anon, authenticated;

notify pgrst, 'reload schema';
