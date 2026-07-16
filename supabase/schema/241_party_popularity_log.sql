-- ===========================================================================
-- 241 · Party popularity CHANGE LOG — every move to parties.popularity, itemized with a reason.
--
-- party_popularity_history (schema/147) stores the per-tick SNAPSHOT (the number). This adds the
-- itemized CHANGES behind that number, so the Party page can show WHY approval moved, not just how
-- much — and, because the log captures every write, the reasons for a tick always sum to that tick's
-- net move (the log records the ACTUAL applied delta, i.e. post-clamp new − old).
--
-- ONE SOURCE, structural — mirrors the influence-clamp trigger (schema/193): instead of asking all 36
-- scattered popularity writers to remember to log, a single AFTER UPDATE trigger on parties logs every
-- change automatically (present writers and any future one). The trigger can't know the semantic CAUSE,
-- so a writer announces it in a transaction-local GUC `app.pop_reason` right before its UPDATE and
-- clears it right after (set → update → clear); the trigger reads it, defaulting to 'National
-- conditions' for any writer that hasn't been instrumented yet. Reasons are layered in over follow-up
-- migrations; reconciliation holds from day one regardless.
--
-- Depends on: 20 (parties), 05 (game_state clock). Idempotent.
-- ===========================================================================

-- One row per popularity change. `tick` is the game clock at the moment of the change (the log's own
-- time axis, like the snapshot's); `delta` is the ACTUAL applied move (post-clamp). Rows cascade with
-- their party. An identity PK keeps insert cheap and ordering stable within a tick.
create table if not exists public.party_popularity_log (
  id         bigint generated always as identity primary key,
  party_id   uuid    not null references public.parties (id) on delete cascade,
  tick       integer not null,
  delta      numeric not null,
  reason     text    not null default 'National conditions',
  created_at timestamptz not null default now()
);
create index if not exists ppl_party_tick_idx on public.party_popularity_log (party_id, tick);

-- Read-only from the client (like the snapshot feed). Rows are written ONLY by the security-definer
-- trigger below — never from the client — so there is no insert/update/delete policy.
alter table public.party_popularity_log enable row level security;
drop policy if exists "ppl_select_all" on public.party_popularity_log;
create policy "ppl_select_all" on public.party_popularity_log for select using (true);

-- The logger: fires after any UPDATE that actually moves popularity. Reads the game clock and the
-- one-shot reason GUC (empty/unset → 'National conditions'). Security definer so its insert is exempt
-- from the table's RLS. Never raises: a logging failure must not roll back the popularity move itself.
create or replace function public._log_popularity_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_tick int; v_reason text;
begin
  begin
    select current_tick into v_tick from public.game_state where id;
    v_reason := coalesce(nullif(current_setting('app.pop_reason', true), ''), 'National conditions');
    insert into public.party_popularity_log (party_id, tick, delta, reason)
      values (new.id, coalesce(v_tick, 0), new.popularity - old.popularity, v_reason);
  exception when others then
    null;   -- logging is best-effort; never break a popularity write
  end;
  return new;
end $$;
revoke all on function public._log_popularity_change() from public, anon, authenticated;

drop trigger if exists log_party_popularity on public.parties;
create trigger log_party_popularity
  after update of popularity on public.parties
  for each row
  when (new.popularity is not null and old.popularity is not null and new.popularity <> old.popularity)
  execute function public._log_popularity_change();

notify pgrst, 'reload schema';
