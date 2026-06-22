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
  ruling_party   text,            -- the sole legal party of a one-party state; null = normal multiparty nation. When set, players join /party-creation as a FACTION of this party.
  former_ruling_party text,        -- set when a one-party state is dissolved back to multiparty (schema/98); the name of the party that ruled. Gates the "democracy restored, file for elections" home banner and exempts the former ruler from filing. Cleared at the first election after restoration.
  flag           text,            -- asset path, e.g. /assets/Sessau.png
  population     numeric,         -- millions (fractional allowed, e.g. 24.5); formatted on the client
  gdp            bigint,          -- billions; formatted on the client
  legislature_seats int not null default 0, -- total seats in the nation's legislature
  election_frequency_months int not null default 60, -- months between general elections
  electoral_threshold numeric not null default 0,    -- min vote % to win seats (0 = none)
  next_election_tick int,                            -- game tick of this nation's next general election (null = unscheduled)
  stats          jsonb not null default '{}'::jsonb, -- {prosperity, welfare, order, image, growth}
  economy        jsonb not null default '{}'::jsonb, -- {regime, inflation, unemployment, tax, budget, debt, currency}
  production     jsonb not null default '{}'::jsonb, -- {energy, food, minerals, goods, services, diplomacy}
  created_at     timestamptz not null default now()
);
-- For installs created before these columns existed.
alter table public.nations add column if not exists economy jsonb not null default '{}'::jsonb;
alter table public.nations add column if not exists stats jsonb not null default '{}'::jsonb;
alter table public.nations add column if not exists legislature_seats int not null default 0;
alter table public.nations add column if not exists election_frequency_months int not null default 60;
alter table public.nations add column if not exists electoral_threshold numeric not null default 0;
alter table public.nations add column if not exists analogous text;
alter table public.nations add column if not exists production jsonb not null default '{}'::jsonb;
alter table public.nations add column if not exists next_election_tick int;
alter table public.nations add column if not exists ruling_party text;
alter table public.nations add column if not exists former_ruling_party text;
-- Population may be fractional (millions, e.g. 24.5) — widen the legacy bigint.
alter table public.nations alter column population type numeric using population::numeric;
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

-- Only the admin may edit a nation (the /adminsetup edit flow). Same gate as insert.
grant update on public.nations to authenticated;
drop policy if exists "nations_update_admin" on public.nations;
create policy "nations_update_admin" on public.nations for update using (public.is_admin()) with check (public.is_admin());

-- Seed the first nation with its starting numbers (idempotent; won't clobber a
-- live row's values on re-run).
insert into public.nations (id, name, description, analogous, flag, population, gdp, legislature_seats, stats, economy)
values (
  'sessau',
  'Sessau',
  'A nation in Meridian, steeped in culture and history.',
  'France',
  '/assets/Sessau.png',
  69,
  678,
  280,
  '{"prosperity":14,"welfare":13,"order":13,"image":16,"growth":9}'::jsonb,
  '{"regime":"Electoral Democracy. 45% Ceiling.","inflation":13,"unemployment":9,"tax":30,"budget":12.4,"debt":31,"currency":"$"}'::jsonb
)
on conflict (id) do nothing;

-- Backfill on an already-seeded Sessau row (the insert above is a no-op once the
-- row exists). Each only touches a row that hasn't got the value yet.
update public.nations
   set economy = '{"regime":"Electoral Democracy. 45% Ceiling.","inflation":13,"unemployment":9,"tax":30,"budget":12.4,"debt":31,"currency":"$"}'::jsonb
 where id = 'sessau' and (economy is null or economy = '{}'::jsonb);
update public.nations set economy = economy || '{"currency":"$"}'::jsonb
 where id = 'sessau' and not (economy ? 'currency');
-- Tax Burden % is a tracked economic figure (0–100) that the coming tax policies
-- (corporate / income / property) will move. Give every nation a neutral starting
-- value so the figure is real from day one; idempotent (only un-set rows).
update public.nations set economy = economy || '{"tax":30}'::jsonb
 where not (economy ? 'tax');
update public.nations set legislature_seats = 280
 where id = 'sessau' and legislature_seats = 0;
-- GDP is now stored in billions (was a raw figure). Migrate the legacy value
-- once; the guard keeps a re-run from re-triggering after it's already 678.
update public.nations set gdp = 678
 where id = 'sessau' and gdp > 1000000;
-- Population is now stored in millions (was a raw count). Same one-time migration.
update public.nations set population = 69
 where id = 'sessau' and population > 100000;
-- Sessau's real-world analogue.
update public.nations set analogous = 'France'
 where id = 'sessau' and analogous is null;
-- Sessau's currency is the dollar now (was the livre ₶). Flip the live row.
update public.nations set economy = jsonb_set(economy, '{currency}', '"$"'::jsonb)
 where id = 'sessau' and economy->>'currency' is distinct from '$';

-- Schedule a first general election for every nation that hasn't got one: 1d6
-- ticks (months) after the current tick. random() is evaluated per row, so each
-- nation rolls independently. Guarded on null so a re-run never reschedules, and
-- so it doesn't clobber the per-nation roll the admin page sets at creation.
update public.nations
   set next_election_tick = (select current_tick from public.game_state where id) + (floor(random() * 6)::int + 1)
 where next_election_tick is null;

-- On-hand stockpiles: each nation starts holding HALF its production of every
-- tradeable resource (Energy/Food/Minerals/Goods/Services; Diplomacy isn't traded).
-- Stored so the Market can move it later; seeded ONCE (guarded on empty) so a
-- re-apply never clobbers a stockpile that trading has since changed.
alter table public.nations add column if not exists on_hand jsonb not null default '{}'::jsonb;
update public.nations
   set on_hand = jsonb_build_object(
     'energy',   round(coalesce((production->>'energy')::numeric,   0) * 0.5, 1),
     'food',     round(coalesce((production->>'food')::numeric,     0) * 0.5, 1),
     'minerals', round(coalesce((production->>'minerals')::numeric, 0) * 0.5, 1),
     'goods',    round(coalesce((production->>'goods')::numeric,    0) * 0.5, 1),
     'services', round(coalesce((production->>'services')::numeric, 0) * 0.5, 1)
   )
 where on_hand = '{}'::jsonb;
