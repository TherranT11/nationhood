-- 162 · Nation stat history — a per-tick snapshot of a nation's live stat value, so a stat's detail
-- page (the Growth page today) can draw a real trend. Mirrors party_popularity_history (schema/147):
-- written at the END of _advance_tick (schema/60) after every stat move has settled, read
-- (world-readable) by the dashboard.
-- Depends on: 05 (game_state clock), 10 (nations), 47 (_nation_live_stat — the ONE live-stat source),
-- 152 (_nation_policy_stat, which _nation_live_stat calls). Run after 152 and 160.

-- One row per nation, per stat, per tick. Keyed generic (stat text) so more stats can gain a trend
-- later without a new table, but the snapshot below records only 'Growth' for now — no row explosion.
-- PK (nation_id, stat, tick) makes it idempotent: a manual advance_tick re-run over the same tick
-- updates in place rather than duplicating. Rows cascade away with their nation. No timestamp: tick
-- IS the time axis.
create table if not exists public.nation_stat_history (
  nation_id text    not null references public.nations (id) on delete cascade,
  stat      text    not null,
  tick      integer not null,
  value     numeric not null,
  primary key (nation_id, stat, tick)
);

-- World-readable (the trend shows on any nation's page, like popularity/crises). No client write
-- policy: rows are written only by the security-definer snapshot below, never from the client.
alter table public.nation_stat_history enable row level security;
drop policy if exists "nsh_select_all" on public.nation_stat_history;
create policy "nsh_select_all" on public.nation_stat_history for select using (true);

-- Snapshot every live nation's Growth at the given tick. Value = _nation_live_stat (schema/47) — the
-- ONE source that also feeds the Government page and the Growth page (authored base + in-force policy
-- effects), so the sparkline agrees with the headline figure. Idempotent via the PK upsert. Dormant
-- (unactivated) nations are skipped, matching the rest of the tick's per-nation sweeps.
create or replace function public._snapshot_nation_stats(p_tick integer)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.nation_stat_history (nation_id, stat, tick, value)
  select id, 'Growth', p_tick, round(coalesce(public._nation_live_stat(id, 'Growth'), 0)::numeric, 2)
  from public.nations where not coalesce(dormant, false)
  on conflict (nation_id, stat, tick) do update set value = excluded.value;
$$;
revoke all on function public._snapshot_nation_stats(integer) from public, anon, authenticated;

-- Seed the current tick immediately on apply, so the Growth chart has a first real point the moment
-- this migration lands (rather than waiting a full tick for the cron path to write one).
select public._snapshot_nation_stats(greatest(coalesce((select current_tick from public.game_state where id), 1), 1));

notify pgrst, 'reload schema';
