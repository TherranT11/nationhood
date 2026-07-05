-- 147 · Party popularity history — a per-tick snapshot of every party's popularity, so the
-- Nation dashboard can draw a real approval trend (Phase C). The row is written at the END of
-- _advance_tick (schema/60), after every popularity move has settled, and read (world-readable)
-- by the dashboard's approval sparkline.
-- Depends on: 05 (game_state clock), 20 (parties). Run after 20.

-- One row per party per tick. PK (party_id, tick) makes the snapshot idempotent, so a manual
-- advance_tick re-run over the same tick updates in place rather than duplicating or erroring.
-- Rows cascade away with their party.
create table if not exists public.party_popularity_history (
  party_id   uuid    not null references public.parties (id) on delete cascade,
  tick       integer not null,
  popularity numeric not null,
  created_at timestamptz not null default now(),
  primary key (party_id, tick)
);

-- Read the trend on any party's page (the feed is shared, like events). No client write policy:
-- rows are written only by the security-definer snapshot below, never from the client.
alter table public.party_popularity_history enable row level security;
drop policy if exists "pph_select_all" on public.party_popularity_history;
create policy "pph_select_all" on public.party_popularity_history for select using (true);

-- Snapshot every party's current popularity at the given tick. Idempotent via the PK upsert —
-- re-running a tick refreshes the stored value instead of failing. Popularity is stored to two
-- decimals (it moves in tenths), matching how the parties row carries it.
create or replace function public._snapshot_party_popularity(p_tick integer)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.party_popularity_history (party_id, tick, popularity)
  select id, p_tick, round(coalesce(popularity, 0)::numeric, 2) from public.parties
  on conflict (party_id, tick) do update
    set popularity = excluded.popularity, created_at = now();
$$;
revoke all on function public._snapshot_party_popularity(integer) from public, anon, authenticated;

-- Seed the current tick immediately on apply, so the chart has a first real point the moment
-- this migration lands (rather than waiting a full tick for the cron path to write one).
select public._snapshot_party_popularity(greatest(coalesce((select current_tick from public.game_state where id), 1), 1));
