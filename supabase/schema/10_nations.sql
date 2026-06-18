-- 10 · Nations (the joinable game worlds) + the Sessau seed
-- Depends on: nothing. Run after 00.

-- ---------------------------------------------------------------------------
-- Nations: the public game-world states a player can join. Read-only to clients
-- (no write policy → RLS denies all client writes); the nation roster is seeded
-- here. The five ladder stats are the single source of the starting numbers; the
-- word labels are derived on the client from /ladders.js (statLabel), never stored.
-- ---------------------------------------------------------------------------
create table if not exists public.nations (
  id             text primary key,
  name           text not null,
  description    text,
  analogous      text,            -- real-world analogue, shown in italics under the description
  flag           text,            -- asset path, e.g. /assets/Sessau.png
  population     bigint,          -- raw count; formatted on the client
  gdp            bigint,          -- raw value; formatted on the client
  legislature_seats int not null default 0, -- total seats in the nation's legislature
  election_frequency_months int not null default 60, -- months between general elections
  electoral_threshold numeric not null default 0,    -- min vote % to win seats (0 = none)
  stats          jsonb not null default '{}'::jsonb, -- {prosperity, welfare, order, image, growth}
  economy        jsonb not null default '{}'::jsonb, -- {regime, inflation, unemployment, budget, debt, currency}
  production     jsonb not null default '{}'::jsonb, -- {energy, food, minerals, goods, services, diplomacy}
  created_at     timestamptz not null default now()
);
-- For installs created before these columns existed.
alter table public.nations add column if not exists economy jsonb not null default '{}'::jsonb;
alter table public.nations add column if not exists legislature_seats int not null default 0;
alter table public.nations add column if not exists election_frequency_months int not null default 60;
alter table public.nations add column if not exists electoral_threshold numeric not null default 0;
alter table public.nations add column if not exists analogous text;
alter table public.nations add column if not exists production jsonb not null default '{}'::jsonb;
-- The active-party count is derived live from public.parties (one source), not
-- stored — drop the old counter column if an earlier install still has it.
alter table public.nations drop column if exists active_parties;

alter table public.nations enable row level security;

-- Anyone may read the nation roster (public game data).
drop policy if exists "nations_select_all" on public.nations;
create policy "nations_select_all" on public.nations for select using (true);

-- Is the signed-in user the site admin? Used to gate nation creation from the
-- /adminsetup page. The admin is identified server-side by email (read from
-- auth.users via a definer function) — never by anything the client can spoof.
-- Change the address here to move the admin account.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from auth.users
    where id = auth.uid() and lower(email) = 'therrant@gmail.com'
  );
$$;
grant execute on function public.is_admin() to authenticated;

-- Only the admin may add a nation. The base INSERT grant is harmless on its own —
-- this WITH CHECK is the real gate, so a non-admin's insert is rejected even with
-- a crafted request.
grant insert on public.nations to authenticated;
drop policy if exists "nations_insert_admin" on public.nations;
create policy "nations_insert_admin" on public.nations for insert with check (public.is_admin());

-- Seed the first nation with its starting numbers (idempotent; won't clobber a
-- live row's values on re-run).
insert into public.nations (id, name, description, flag, population, gdp, legislature_seats, stats, economy)
values (
  'sessau',
  'Sessau',
  'A nation in Meridian, steeped in culture and history.',
  '/assets/Sessau.png',
  69000000,
  678000000000,
  280,
  '{"prosperity":14,"welfare":13,"order":13,"image":16,"growth":9}'::jsonb,
  '{"regime":"Electoral Democracy. 45% Ceiling.","inflation":13,"unemployment":9,"budget":12.4,"debt":31,"currency":"₶"}'::jsonb
)
on conflict (id) do nothing;

-- Backfill on an already-seeded Sessau row (the insert above is a no-op once the
-- row exists). Each only touches a row that hasn't got the value yet.
update public.nations
   set economy = '{"regime":"Electoral Democracy. 45% Ceiling.","inflation":13,"unemployment":9,"budget":12.4,"debt":31,"currency":"₶"}'::jsonb
 where id = 'sessau' and (economy is null or economy = '{}'::jsonb);
update public.nations set economy = economy || '{"currency":"₶"}'::jsonb
 where id = 'sessau' and not (economy ? 'currency');
update public.nations set legislature_seats = 280
 where id = 'sessau' and legislature_seats = 0;
