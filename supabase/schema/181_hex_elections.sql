-- ===========================================================================
-- 181 · Hex elections — regional seats. A 'hex_el' card runs an election in ONE chosen hex,
-- reapportioning that hex's seats among parties by their REGIONAL standing there (national popularity
-- + party_hex_bias, schema/163). Each hex has a 12-tick cooldown between elections.
--
-- This is a SEPARATE regional-control layer: parties.seats — the national chamber that governments,
-- coalitions and majority math depend on — is NOT touched. A hex's seat COUNT stays population-derived
-- (round(legislature_seats · hexpop / nation land pop), exactly as the Party page projected it); the
-- election decides HOW those seats split among parties, replacing the national-share projection with a
-- real, stored result the Party page then reads.
--
-- Depends on: 10 (nations.legislature_seats), 20 (parties.popularity), 101 (world_hexes q/r/population/
-- terrain), 163 (party_hex_bias), 05 (game_state), 40 (events). Idempotent.
-- ===========================================================================

-- One row per party per elected hex: the seats it won there and the tick it was won (same tick for
-- every row of a hex, so the cooldown reads off any of them). Rows cascade away with their party.
create table if not exists public.hex_seats (
  nation_id    text not null references public.nations (id),
  q            int  not null,
  r            int  not null,
  party_id     uuid not null references public.parties (id) on delete cascade,
  seats        int  not null,
  elected_tick int  not null,
  primary key (nation_id, q, r, party_id)
);
create index if not exists hex_seats_hex_idx on public.hex_seats (nation_id, q, r);

-- World-readable (a hex's makeup is public, like seats/approval); writes only through the resolver.
alter table public.hex_seats enable row level security;
drop policy if exists "hex_seats_select_all" on public.hex_seats;
create policy "hex_seats_select_all" on public.hex_seats for select using (true);

-- Run an election in one land hex: split its population-derived seat count among parties by regional
-- standing (national popularity + party_hex_bias there), store the result (largest-remainder so the
-- split sums exactly), stamp the 12-tick cooldown. Called from a played hex_el card (schema/176);
-- security definer, revoked from clients. An atomic play rolls back if a guard raises.
create or replace function public.hex_election_resolve(p_nation text, p_q int, p_r int, p_by uuid, p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare v_hexpop numeric; v_natpop numeric; v_total int; v_seats int; v_last int;
begin
  -- hex must be land in the nation, with an electorate
  select population into v_hexpop from public.world_hexes
    where nation_id = p_nation and q = p_q and r = p_r and terrain = 'land';
  if not found or coalesce(v_hexpop, 0) <= 0 then raise exception 'That hex has no electorate.'; end if;

  -- cooldown: 12 ticks between elections in a hex
  select max(elected_tick) into v_last from public.hex_seats where nation_id = p_nation and q = p_q and r = p_r;
  if v_last is not null and p_tick < v_last + 12 then
    raise exception 'That hex just voted — % tick(s) until it can vote again.', v_last + 12 - p_tick;
  end if;

  -- this hex's seat count = its population share of the national chamber
  select coalesce(legislature_seats, 0) into v_total from public.nations where id = p_nation;
  select sum(population) into v_natpop from public.world_hexes
    where nation_id = p_nation and terrain = 'land' and coalesce(population, 0) > 0;
  if coalesce(v_natpop, 0) <= 0 or v_total <= 0 then raise exception 'This nation has no seats to contest.'; end if;
  v_seats := round(v_total * v_hexpop / v_natpop);
  if v_seats < 1 then raise exception 'This hex is too small for a seat.'; end if;

  -- clear the previous result, then apportion by largest remainder. Weight = national popularity +
  -- this hex's bias, floored at 0; if nobody has positive standing, everyone weighs equally so the hex
  -- still returns a chamber. Floors first, then the leftover seats one each to the largest fractions.
  delete from public.hex_seats where nation_id = p_nation and q = p_q and r = p_r;
  insert into public.hex_seats (nation_id, q, r, party_id, seats, elected_tick)
  with base as (
    select p.id as party_id, greatest(0, coalesce(p.popularity, 0) + coalesce(b.bias, 0)) as raw
      from public.parties p
      left join public.party_hex_bias b on b.party_id = p.id and b.q = p_q and b.r = p_r
     where p.nation_id = p_nation
  ), w as (
    select party_id, case when sum(raw) over () = 0 then 1 else raw end as w from base
  ), tot as (select sum(w) as sw from w),
  appt as (
    select party_id,
           floor(v_seats * w / sw)::int as fl,
           (v_seats * w / sw) - floor(v_seats * w / sw) as frac
      from w, tot
  ), ranked as (
    select party_id, fl, row_number() over (order by frac desc, party_id) as rk from appt
  ), leftover as (select v_seats - coalesce(sum(fl), 0) as n from appt)
  select p_nation, p_q, p_r, party_id,
         fl + case when rk <= (select n from leftover) then 1 else 0 end,
         p_tick
    from ranked
   where fl + case when rk <= (select n from leftover) then 1 else 0 end > 0;

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (p_nation, p_by, 'party', 'An election was held in a contested region.', public.current_game_date());
end $$;
revoke all on function public.hex_election_resolve(text, int, int, uuid, int) from public, anon, authenticated;

notify pgrst, 'reload schema';
