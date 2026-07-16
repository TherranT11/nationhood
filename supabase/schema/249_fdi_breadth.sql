-- ===========================================================================
-- 249 · FDI Phase 2 — economic breadth. A plant is jobs, not just output.
--
-- Phase 1/2A bound Growth (output) to the plant. A real factory also EMPLOYS people, so a plant now
-- carries a generic effects map (buildings.effects :: {stat: delta}) for its NON-Growth economic
-- footprint. v1 seeds one effect — Unemployment ↓ (jobs) — derived from tier, with the local_hire
-- PROTECTION buying the host extra jobs (the value-transfer lever made concrete: a host that bargains
-- for local hiring keeps more of the deal's benefit at home).
--
-- The effect is asset-bound exactly like Growth: one derived term (_nation_fdi_stat) sums effects->>stat
-- over the plants a nation actually counts (foreign plant only while its deal is ACTIVE; state-owned
-- always — the same orphan guard as _nation_fdi_growth), folded into _nation_live_stat's generic branch.
-- So jobs appear the tick a plant activates and vanish the tick it leaves, by construction — no modifier
-- row to leak, invariant intact. Growth keeps its own audited path (_nation_fdi_growth) untouched.
--
-- Free ripple (no extra code): Unemployment feeds Crime/Poverty/Equity via the derived-stat cascade
-- (schema/200), and those read live — so plant jobs also ease Crime and Poverty. That IS the breadth.
--
-- No automation added: the whole thing rides the existing per-tick FDI resolver. expansion_appetite
-- (a plant proposing a follow-on deal on its own) is a TRIGGERED behaviour and is deliberately NOT
-- built here — it needs explicit sign-off before anything fires on its own.
--
-- Depends on: 243-246, 248 (fdi_deals, buildings, _place_building, _resolve_fdi_deals, _nation_live_stat,
-- _nation_fdi_growth, _corp_fdi_tier), 200 (derived-stat cascade). Idempotent. Apply after 248.
-- ===========================================================================

set check_function_bodies = off;

-- Non-Growth economic footprint of a plant, keyed by stat name. Growth stays on its own column/path.
alter table public.buildings add column if not exists effects jsonb not null default '{}'::jsonb;

-- Jobs a tier delivers (Unemployment points removed). One source, mirrors _fdi_growth_for's shape.
create or replace function public._fdi_jobs_for(p_tier int)
returns int language sql immutable as $$
  select case p_tier when 1 then 1 when 3 then 3 else 2 end;
$$;

-- ONE SOURCE for the invariant: does a plant still contribute to its host? A state-owned
-- (nationalised) plant always counts; a FOREIGN plant counts only while its deal is ACTIVE — so an
-- orphaned plant (owner nation deleted → deal gone) stops contributing and the sum stays honest.
-- Both _nation_fdi_growth and _nation_fdi_stat read this so the rule lives in exactly one place.
create or replace function public._fdi_plant_counts(p_owner_nation_id text, p_source_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p_owner_nation_id is null
      or exists (select 1 from public.fdi_deals d where d.id = p_source_id and d.state = 'ACTIVE');
$$;
revoke all on function public._fdi_plant_counts(text, uuid) from public, anon, authenticated;

-- The FDI contribution to a NON-Growth stat a nation feels: sum of effects->>stat over the plants it
-- counts (per _fdi_plant_counts). Reads buildings + fdi_deals only (never _nation_live_stat) → no
-- recursion. Cheap: buildings is tiny and nation-indexed, and the `? p_stat` filter skips plants with
-- no such effect.
create or replace function public._nation_fdi_stat(p_nation text, p_stat text)
returns numeric language sql stable security definer set search_path = public as $$
  select coalesce(sum(public._to_num(b.effects->>p_stat)), 0)
    from public.buildings b
   where b.source = 'fdi' and b.nation_id = p_nation and b.effects ? p_stat
     and public._fdi_plant_counts(b.owner_nation_id, b.source_id);
$$;
revoke all on function public._nation_fdi_stat(text, text) from public, anon, authenticated;

-- Redefine _nation_fdi_growth (body from schema/246) to read the shared predicate — so the "does this
-- plant still count?" rule has ONE home (_fdi_plant_counts) instead of being copied here.
create or replace function public._nation_fdi_growth(p_nation text)
returns numeric language sql stable security definer set search_path = public as $$
  select coalesce(sum(g), 0) from (
    select b.growth as g from public.buildings b
     where b.source = 'fdi' and b.nation_id = p_nation
       and public._fdi_plant_counts(b.owner_nation_id, b.source_id)
    union all
    select owner_growth as g from public.fdi_deals where state = 'ACTIVE' and owner_nation_id = p_nation
  ) x;
$$;
revoke all on function public._nation_fdi_growth(text) from public, anon, authenticated;

-- ⚠ SUPERSEDED BY 252. This body was reproduced from schema/243, which was itself built on the OLD 221
-- lineage — it calls _nation_stock_growth (dropped in 229) and omits the [0,100] clamp (222/229). That
-- combination caused the all-"--" stat outage. 252 is the authoritative _nation_live_stat now; do NOT
-- reproduce this version. When the FDI Growth/breadth terms are re-added, build on 252's body.
-- Fold the FDI stat term into _nation_live_stat's generic (non-Growth) branch. Body reproduced from
-- schema/243 with the single + _nation_fdi_stat added to the else path; Growth is unchanged (it already
-- carries _nation_fdi_growth and never takes this branch, so no double count).
create or replace function public._nation_live_stat(p_nation text, p_stat text)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare v_base numeric; v_delta numeric; v_leg text;
begin
  select coalesce(public._to_num(stat_deltas->>p_stat), 0) into v_delta from public.nations where id = p_nation;
  if p_stat = 'Growth' then
    v_base := coalesce(public._nation_stock_growth(p_nation), 0)
            + coalesce(public._nation_fdi_growth(p_nation), 0);   -- asset-bound FDI Growth (schema/243)
  else
    v_leg := case p_stat when 'Prosperity' then 'prosperity' when 'Rule of Law' then 'order' end;
    select coalesce(public._to_num(ministry_stats->>p_stat),
                    case when v_leg is not null then public._to_num(stats->>v_leg) end, 0)
      into v_base from public.nations where id = p_nation;
    v_base := coalesce(v_base, 0) + coalesce(public._nation_fdi_stat(p_nation, p_stat), 0);  -- asset-bound FDI effects (249)
  end if;
  return coalesce(v_base, 0)
       + coalesce(public._nation_policy_stat(p_nation, p_stat), 0)
       + coalesce(v_delta, 0)
       + coalesce(public._regime_reform_stat(p_nation, p_stat), 0);
end $$;
revoke all on function public._nation_live_stat(text, text) from public, anon, authenticated;

-- _place_building gains an effects argument. Drop the old 9-arg form (only _resolve_fdi_deals calls it,
-- redefined below to pass effects) so there's no overload ambiguity.
drop function if exists public._place_building(text, int, int, text, text, text, uuid, numeric, text);
create or replace function public._place_building(p_nation text, p_q int, p_r int, p_kind text, p_owner text,
                                                  p_source text, p_source_id uuid, p_growth numeric, p_label text,
                                                  p_effects jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare v_q int := p_q; v_r int := p_r;
begin
  if v_q is null or v_r is null then
    select q, r into v_q, v_r from public.world_hexes
     where nation_id = p_nation and terrain = 'land' order by coalesce(population, 0) desc, q, r limit 1;
  end if;
  insert into public.buildings (nation_id, q, r, kind, owner_nation_id, source, source_id, growth, label, effects)
    values (p_nation, v_q, v_r, coalesce(p_kind, 'plant'), p_owner, coalesce(p_source, 'fdi'), p_source_id,
            coalesce(p_growth, 0), p_label, coalesce(p_effects, '{}'::jsonb));
end $$;
revoke all on function public._place_building(text, int, int, text, text, text, uuid, numeric, text, jsonb) from public, anon, authenticated;

-- Redefine the resolver (body from schema/248) to compute the plant's jobs effect at activation and
-- pass it through _place_building. Jobs = _fdi_jobs_for(tier) + 1 if the package bargained local_hire.
create or replace function public._resolve_fdi_deals(p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare v_d record; v_tier int; v_base numeric; v_p numeric; v_roll numeric; v_rel int; v_clim numeric;
        v_wage numeric; v_jobs int; v_effects jsonb;
begin
  for v_d in
    select d.*, c.size as corp_size, c.name as corp_name from public.fdi_deals d
      join public.corporations c on c.id = d.corp_id
     where d.state = 'PENDING' and coalesce(d.decision_tick, 0) <= p_tick
  loop
    v_tier := public._corp_fdi_tier(v_d.corp_size);
    v_base := case v_tier when 1 then 0.85 when 3 then 0.35 else 0.60 end;
    select value into v_rel from public.nation_relations
     where nation_a = least(v_d.host_nation_id, v_d.owner_nation_id)
       and nation_b = greatest(v_d.host_nation_id, v_d.owner_nation_id);
    v_clim := public._fdi_climate(v_d.host_nation_id);
    v_p := v_base + 0.05 * coalesce(v_d.temperature, 0)
         + 0.02 * (coalesce(v_rel, 5) - 5)
         + greatest(-0.15, least(0.15, (coalesce(v_clim, 50) - 50) / 100.0 * 0.3));
    v_p := greatest(0.02, least(0.98, v_p));
    v_roll := (('x' || substr(md5(v_d.id::text || p_tick::text), 1, 4))::bit(16)::int)::numeric / 65535.0;
    if v_roll < v_p then
      -- tier-1 plants are footloose: tolerate wages up to (Wages-at-signing + 15), then get restless.
      v_wage := case when v_tier = 1 then round(coalesce(public._nation_live_stat(v_d.host_nation_id, 'Wages'), 0)) + 15 end;
      -- jobs: tier base, +1 if the host bargained local hiring (value transfer toward the host).
      v_jobs := public._fdi_jobs_for(v_tier)
              + case when 'local_hire' = any (coalesce(v_d.incentives, '{}')) then 1 else 0 end;
      v_effects := jsonb_build_object('Unemployment', -v_jobs);
      update public.fdi_deals set state = 'ACTIVE', signed_tick = p_tick, wage_threshold = v_wage where id = v_d.id;
      perform public._place_building(v_d.host_nation_id, v_d.hex_q, v_d.hex_r, 'plant',
                                     v_d.owner_nation_id, 'fdi', v_d.id, v_d.host_growth, v_d.corp_name, v_effects);
      perform public._fdi_event(v_d.id, 'SIGNED');
    else
      perform public._end_fdi_deal(v_d.id, 'REJECTED');
    end if;
  end loop;

  for v_d in select id from public.fdi_deals
              where state = 'ACTIVE' and ends_tick is not null and ends_tick <= p_tick loop
    perform public._end_fdi_deal(v_d.id, 'EXPIRED');
  end loop;

  -- Footloose departures: a flagged plant that reached its depart tick leaves (host didn't match).
  for v_d in select id from public.fdi_deals
              where state = 'ACTIVE' and depart_tick is not null and depart_tick <= p_tick loop
    perform public._end_fdi_deal(v_d.id, 'DEPARTED');
  end loop;

  -- Yearly (January): flag a tier-1 plant whose host Wages outgrew its tolerance. One tick to match.
  if (p_tick - 1) % 12 = 0 then
    for v_d in select * from public.fdi_deals
                where state = 'ACTIVE' and wage_threshold is not null and depart_tick is null loop
      if coalesce(public._nation_live_stat(v_d.host_nation_id, 'Wages'), 0) > v_d.wage_threshold then
        update public.fdi_deals set depart_tick = p_tick + 1 where id = v_d.id;
        insert into public.events (nation_id, kind, body, game_date)
          values (v_d.host_nation_id, 'economy',
            (select name from public.corporations where id = v_d.corp_id) ||
            ' is threatening to relocate its plant — local wages have outgrown the deal. Match their terms within the tick or lose it.',
            public.current_game_date());
      end if;
    end loop;
  end if;
end $$;
revoke all on function public._resolve_fdi_deals(int) from public, anon, authenticated;

-- Show the projected jobs alongside Growth in the suitor pool (body from schema/244 + the one 'jobs'
-- field) so the Minister sees the plant's full economic footprint before extending an invitation.
create or replace function public.fdi_suitor_pool(p_nation text)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(s order by s->>'tier' desc, s->>'name'), '[]'::jsonb) from (
    select jsonb_build_object(
             'corp_id', c.id, 'name', c.name, 'sector', c.category,
             'home_nation', c.nation_id, 'home_name', n.name,
             'tier', public._corp_fdi_tier(c.size),
             'growth', public._fdi_growth_for(public._corp_fdi_tier(c.size)),
             'jobs', public._fdi_jobs_for(public._corp_fdi_tier(c.size))
           ) as s
      from public.corporations c
      join public.nations n on n.id = c.nation_id
     where c.status = 'placed'
       and c.nation_id <> p_nation
       and not coalesce(n.dormant, false)
       and not exists (
         select 1 from public.sanctions sa where coalesce(sa.active, false)
          and ((sa.by_nation = c.nation_id and sa.target_nation = p_nation)
            or (sa.by_nation = p_nation and sa.target_nation = c.nation_id)))
       and not exists (
         select 1 from public.fdi_deals d
          where d.corp_id = c.id and d.host_nation_id = p_nation and d.state in ('PENDING', 'ACTIVE'))
     order by public._corp_fdi_tier(c.size) desc, c.name
     limit 12
  ) pool;
$$;
grant execute on function public.fdi_suitor_pool(text) to authenticated;

notify pgrst, 'reload schema';
