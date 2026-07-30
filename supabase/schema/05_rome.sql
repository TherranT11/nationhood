-- 05 · Rome — shared, single-row world state  (ROME: Rise and Fall)
-- Idempotent — safe to paste into the Supabase SQL Editor and re-run.
-- One row, shared by every player: the city's population, treasury, grain, and
-- unrest. Read-only to clients; these values change only through server-side
-- game logic (a future tick / actions), never a direct client write.

create table if not exists public.rome (
  id         int    primary key default 1,
  population bigint not null,
  treasury   bigint not null,
  grain      bigint not null,
  unrest     int    not null,
  constraint rome_singleton check (id = 1)   -- exactly one row of world state
);

-- Seed the starting state once; re-running never clobbers a changed value.
insert into public.rome (id, population, treasury, grain, unrest)
values (1, 180000, 290000, 500000, 0)
on conflict (id) do nothing;

alter table public.rome enable row level security;

-- Any signed-in citizen may read the shared city state.
drop policy if exists "rome_select" on public.rome;
create policy "rome_select" on public.rome for select
  using (auth.uid() is not null);

-- No client write policies: Rome's stats change only through server-side logic.
