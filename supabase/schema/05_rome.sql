-- 05 · Rome — shared, single-row world state  (ROME: Rise and Fall)
-- Idempotent — safe to paste into the Supabase SQL Editor and re-run.
-- One row, shared by every player: the city's population, treasury, grain, and
-- unrest, plus the composition of the Senate. Read-only to clients; these values
-- change only through server-side game logic, never a direct client write.

create table if not exists public.rome (
  id                int    primary key default 1,
  population        bigint not null,
  treasury          bigint not null,
  grain             bigint not null,
  unrest            int    not null,
  senate_patricians int    not null default 195,
  senate_plebeians  int    not null default 105,
  constraint rome_singleton check (id = 1)   -- exactly one row of world state
);

-- Senate columns added for a rome table created before they existed (idempotent):
-- add nullable, backfill, then lock NOT NULL + default.
alter table public.rome add column if not exists senate_patricians int;
alter table public.rome add column if not exists senate_plebeians  int;
update public.rome
   set senate_patricians = coalesce(senate_patricians, 195),
       senate_plebeians  = coalesce(senate_plebeians, 105)
 where senate_patricians is null or senate_plebeians is null;
alter table public.rome alter column senate_patricians set not null;
alter table public.rome alter column senate_plebeians  set not null;
alter table public.rome alter column senate_patricians set default 195;
alter table public.rome alter column senate_plebeians  set default 105;

-- The Senate is always 300 strong: the two orders sum to 300. Enforcing this
-- keeps the counts from drifting apart.
alter table public.rome drop constraint if exists rome_senate_total;
alter table public.rome add constraint rome_senate_total
  check (senate_patricians + senate_plebeians = 300);

-- Seed the starting state once; re-running never clobbers a changed value.
insert into public.rome (id, population, treasury, grain, unrest, senate_patricians, senate_plebeians)
values (1, 180000, 290000, 500000, 0, 195, 105)
on conflict (id) do nothing;

alter table public.rome enable row level security;

-- Any signed-in citizen may read the shared city state.
drop policy if exists "rome_select" on public.rome;
create policy "rome_select" on public.rome for select
  using (auth.uid() is not null);

-- No client write policies: Rome's stats change only through server-side logic.
