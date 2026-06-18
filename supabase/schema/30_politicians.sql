-- 30 · Politicians (a party's prominent members)
-- Depends on: 20 (parties). Run after 20.

-- ---------------------------------------------------------------------------
-- Politicians: a party's prominent politicians. Public read (shared instance —
-- everyone sees a party's roster); a player may add a politician only to a party
-- they own. The five stats are competencies (cha/acu/gui/res/com). A new party
-- is seeded client-side with exactly one politician, its Party Leader. The same
-- write-scope caveat as parties applies to the stat/age/experience columns here
-- (set on the client at creation) — lock them down when politician growth goes
-- server-side.
-- ---------------------------------------------------------------------------
create table if not exists public.politicians (
  id         uuid primary key default gen_random_uuid(),
  party_id   uuid not null references public.parties (id) on delete cascade,
  first_name text not null,
  last_name  text not null,
  age        int  not null,
  experience int  not null default 0,
  status     text not null default 'Party Member',
  cha int not null default 0,   -- Charisma
  acu int not null default 0,   -- Acumen
  gui int not null default 0,   -- Guile
  res int not null default 0,   -- Resolve
  com int not null default 0,   -- Command
  created_at timestamptz not null default now()
);

alter table public.politicians enable row level security;

drop policy if exists "politicians_select_all" on public.politicians;
create policy "politicians_select_all" on public.politicians for select using (true);

drop policy if exists "politicians_insert_own" on public.politicians;
create policy "politicians_insert_own" on public.politicians for insert
  with check (exists (select 1 from public.parties p where p.id = party_id and p.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- Recruitment-drive staging: the two candidates a party is currently choosing
-- between (RECRUIT action). One row per party, overwritten each drive. Written
-- ONLY by the security-definer recruit RPCs in 40 — so the candidate the player
-- sees (and its server-rolled stats) is exactly the one that gets hired, and
-- can't be forged from the client. The drive's $ cost is charged when it's
-- opened (party_recruit_scout); the action cost is charged on hire
-- (party_recruit_hire), which also deletes the row.
-- ---------------------------------------------------------------------------
create table if not exists public.recruit_drives (
  party_id   uuid primary key references public.parties (id) on delete cascade,
  candidates jsonb not null,                 -- { "newcomer": {…}, "seasoned": {…} }
  created_at timestamptz not null default now()
);

alter table public.recruit_drives enable row level security;

-- A player may read their own pending drive; nobody writes it from the client.
drop policy if exists "recruit_drives_select_own" on public.recruit_drives;
create policy "recruit_drives_select_own" on public.recruit_drives for select
  using (exists (select 1 from public.parties p where p.id = party_id and p.user_id = auth.uid()));
