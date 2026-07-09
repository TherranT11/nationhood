-- 163 · Regional popularity — a per-region tilt that spreads a policy's party-popularity award
-- across a party's land hexes proportionately to population, so a nationwide policy win is felt
-- most where the most voters live (the capital jumps more than a rural hex) instead of moving
-- every region by the same flat amount.
-- Depends on: 20 (parties), 10/…(world_hexes q/r/nation_id/population, terrain). Run after 91
-- (the Party Popularity policy branch that calls _distribute_regional_popularity below) and 147.
--
-- Design — why this is a thin LAYER, not a new source of truth:
--   parties.popularity stays the ONE authoritative national number (rallies, ceiling reconcile,
--   tick evolution, mayoral prizes all keep writing it unchanged — zero blast radius). A policy
--   award still moves that national figure by the full amount. This table only stores the
--   *regional tilt*: how much each hex diverges from the flat national move. The tilt is
--   population-weighted and ZERO-SUM (Σ tilt·pop = 0), so the population-weighted average of the
--   regions still equals the national popularity — the Party page's regional figures and the
--   national headline reconcile exactly, as they did before.

-- One accumulated bias per (party, hex). Rows cascade away with their party. Absent row = 0 bias
-- (the pre-migration behaviour: region = national ± seeded swing), so no seeding is needed.
create table if not exists public.party_hex_bias (
  party_id uuid    not null references public.parties (id) on delete cascade,
  q        integer not null,
  r        integer not null,
  bias     numeric not null default 0,
  primary key (party_id, q, r)
);

-- World-readable (the regional approvals show on the Party page, like popularity/hexes). No client
-- write policy: rows are written only by the security-definer distributor below, never client-side.
alter table public.party_hex_bias enable row level security;
drop policy if exists "phb_select_all" on public.party_hex_bias;
create policy "phb_select_all" on public.party_hex_bias for select using (true);

-- Spread an applied popularity delta across one party's land hexes, weighted by population.
-- p_delta is the ACTUAL move that landed on parties.popularity (post-clamp), so the tilt matches
-- what really happened. Each hex's proportional target is  p_delta · pop · Σpop / Σ(pop²)  — this
-- makes big-population hexes move more than small ones while the population-weighted average of the
-- targets equals p_delta exactly. We store the tilt = target − p_delta (the divergence from the flat
-- national move, which parties.popularity already absorbed): Σ(tilt·pop) = 0, so the national figure
-- is untouched by the tilt and the amalgamation still reconciles. Accumulated bias is capped at ±40
-- points so a heavily concentrated nation can't let one region run away over many awards.
create or replace function public._distribute_regional_popularity(p_party uuid, p_nation text, p_delta numeric)
returns void language plpgsql security definer set search_path = public as $$
declare v_total numeric; v_sumsq numeric;
begin
  if p_party is null or coalesce(p_delta, 0) = 0 then return; end if;
  select sum(population), sum(population::numeric * population)
    into v_total, v_sumsq
    from public.world_hexes
   where nation_id = p_nation and terrain = 'land' and coalesce(population, 0) > 0;
  -- No populated territory (or a single degenerate hex) → nothing meaningful to spread.
  if v_total is null or v_total <= 0 or v_sumsq is null or v_sumsq <= 0 then return; end if;

  insert into public.party_hex_bias (party_id, q, r, bias)
  select p_party, h.q, h.r,
         greatest(-40, least(40, (p_delta * h.population * v_total / v_sumsq) - p_delta))
    from public.world_hexes h
   where h.nation_id = p_nation and h.terrain = 'land' and coalesce(h.population, 0) > 0
  on conflict (party_id, q, r) do update
     set bias = greatest(-40, least(40, public.party_hex_bias.bias + excluded.bias));
end $$;
revoke all on function public._distribute_regional_popularity(uuid, text, numeric) from public, anon, authenticated;

notify pgrst, 'reload schema';
