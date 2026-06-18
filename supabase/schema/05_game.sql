-- 05 · Game clock (the shared turn counter)
-- Depends on: nothing. Run after 00.

-- ---------------------------------------------------------------------------
-- One global tick for the whole instance — the single source of "now". Seeded to
-- 1 (January, 1980; one tick = one month). There is no advancement yet; the tick
-- is read by election scheduling + display. Public read. No client write policy:
-- the tick will be advanced server-side once the turn system exists.
-- ---------------------------------------------------------------------------
create table if not exists public.game_state (
  id           boolean primary key default true,
  current_tick int not null default 1,
  constraint game_state_singleton check (id)   -- only ever one row
);

insert into public.game_state (id, current_tick) values (true, 1) on conflict (id) do nothing;

alter table public.game_state enable row level security;

drop policy if exists "game_state_select_all" on public.game_state;
create policy "game_state_select_all" on public.game_state for select using (true);
