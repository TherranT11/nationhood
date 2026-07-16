-- ===========================================================================
-- 243 · Foreign Direct Investment — Phase 1: the deal object + asset-bound Growth.
--
-- FDI is a relationship, not a buff: every deal is a persistent row linking a corporation, a host
-- nation, and the corp's home (owner) nation, carrying the Growth it adds to each while ACTIVE. The
-- golden invariant — the FDI Growth a nation feels always equals the sum over its ACTIVE deals — is
-- satisfied BY CONSTRUCTION here: Growth is a DERIVED term (_nation_fdi_growth) summed live over
-- ACTIVE deals, not a modifier row that could leak. Ending a deal removes its Growth the same tick,
-- because it's no longer ACTIVE — there is nothing to claw back.
--
-- Phase 1 scope: the table, the tier helper, and the Growth term wired into _nation_live_stat. The
-- Court action (244), board resolution + the four ends (245), and the frontend come next. Renegotiation,
-- mergers, footloose departure, deck injection, and unemployment/wages effects are deferred to later
-- phases. Tier is DERIVED from corp size (one source: corporations.size) — no corp-table columns added.
--
-- Depends on: 47 (corporations), 10 (nations), 221 (_nation_live_stat / _nation_stock_growth). Idempotent.
-- ===========================================================================

set check_function_bodies = off;

-- One row per investment relationship. state is the lifecycle; host/owner_growth is the Growth each
-- nation feels while ACTIVE (asset-bound). hex_q/r tag the chosen map asset (no buildings system yet).
-- decision_tick is when a PENDING board vote resolves; ends_tick (nullable) is an EXPIRED sunset.
create table if not exists public.fdi_deals (
  id              uuid primary key default gen_random_uuid(),
  state           text not null default 'PENDING' check (state in ('PENDING', 'ACTIVE', 'ENDED')),
  end_reason      text check (end_reason in ('EXPIRED', 'DEPARTED', 'NATIONALIZED', 'CLOSED', 'REJECTED')),
  corp_id         uuid not null references public.corporations (id) on delete cascade,
  host_nation_id  text not null references public.nations (id) on delete cascade,   -- where the plant sits
  owner_nation_id text not null references public.nations (id) on delete cascade,   -- the corp's home nation
  incentives      text[] not null default '{}',
  temperature     int    not null default 0,        -- sweeteners − protections; drives tier access + odds
  host_growth     numeric not null default 0,       -- +Growth to the host while ACTIVE
  owner_growth    numeric not null default 0,       -- +Growth to the owner while ACTIVE
  hex_q           int,
  hex_r           int,
  decision_tick   int,                              -- PENDING resolves here (board decision)
  signed_tick     int,                              -- set on activation
  ends_tick       int,                              -- EXPIRED sunset (nullable = open-ended)
  created_at      timestamptz not null default now()
);
create index if not exists fdi_host_active_idx  on public.fdi_deals (host_nation_id)  where state = 'ACTIVE';
create index if not exists fdi_owner_active_idx on public.fdi_deals (owner_nation_id) where state = 'ACTIVE';
create index if not exists fdi_pending_idx      on public.fdi_deals (decision_tick)   where state = 'PENDING';

-- Public read — a deal is visible economic activity (it moves Growth, which is public, and shows on the
-- map). No client write policy: the Court / Nationalize RPCs (security definer, 244/245) are the sole
-- writers, so the lifecycle and clawbacks can't be bypassed from a crafted client.
alter table public.fdi_deals enable row level security;
drop policy if exists "fdi_select_all" on public.fdi_deals;
create policy "fdi_select_all" on public.fdi_deals for select using (true);

-- FDI tier from firm size (1 = extractive/footloose … 3 = prime). One source: corporations.size.
create or replace function public._corp_fdi_tier(p_size text)
returns int language sql immutable as $$
  select case p_size
           when 'Startup' then 1
           when 'Moderate' then 1
           when 'Enterprise' then 2
           when 'National Corporation' then 2
           when 'International Conglomerate' then 3
           else 2 end;
$$;

-- The FDI Growth a nation feels: the sum of host_growth over ACTIVE deals it hosts, plus owner_growth
-- over ACTIVE deals its corps own abroad. Reads fdi_deals only (never Growth), so no recursion when
-- _nation_live_stat calls it. This IS the invariant — the sum is over ACTIVE deals by definition.
create or replace function public._nation_fdi_growth(p_nation text)
returns numeric language sql stable security definer set search_path = public as $$
  select coalesce(sum(g), 0) from (
    select host_growth  as g from public.fdi_deals where state = 'ACTIVE' and host_nation_id  = p_nation
    union all
    select owner_growth as g from public.fdi_deals where state = 'ACTIVE' and owner_nation_id = p_nation
  ) x;
$$;
revoke all on function public._nation_fdi_growth(text) from public, anon, authenticated;

-- Add the FDI term to Growth's derived base. Body reproduced verbatim from schema/221 with the single
-- + _nation_fdi_growth added to the Growth branch; every other stat is unchanged.
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
  end if;
  return coalesce(v_base, 0)
       + coalesce(public._nation_policy_stat(p_nation, p_stat), 0)
       + coalesce(v_delta, 0)
       + coalesce(public._regime_reform_stat(p_nation, p_stat), 0);
end $$;
revoke all on function public._nation_live_stat(text, text) from public, anon, authenticated;

notify pgrst, 'reload schema';
