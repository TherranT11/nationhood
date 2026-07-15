-- ===========================================================================
-- 226 · Also snapshot Interest Rates each tick, so its detail page can draw a real trend.
--
-- _snapshot_nation_stats (schema/162) recorded only 'Growth'. The table was built to hold more stats
-- ("record more later without a new table"), so add a second row per live nation for 'Interest Rates'
-- (value = _nation_interest_rate, schema/225 — the ONE source the tile + detail page also read, so the
-- sparkline agrees with the headline). Same tick job, no new automation. Idempotent via the PK upsert;
-- re-seeds the current tick on apply so the chart has a first point immediately.
--
-- Depends on: 162 (nation_stat_history, _snapshot_nation_stats), 225 (_nation_interest_rate). Apply after 225.
-- ===========================================================================

set check_function_bodies = off;

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

  insert into public.nation_stat_history (nation_id, stat, tick, value)
  select id, 'Interest Rates', p_tick, round(coalesce(public._nation_interest_rate(id), 0)::numeric, 2)
  from public.nations where not coalesce(dormant, false)
  on conflict (nation_id, stat, tick) do update set value = excluded.value;
$$;
revoke all on function public._snapshot_nation_stats(integer) from public, anon, authenticated;

-- Seed the current tick now, so the Interest Rates chart has a first real point the moment this lands.
select public._snapshot_nation_stats(greatest(coalesce((select current_tick from public.game_state where id), 1), 1));

notify pgrst, 'reload schema';
