-- 99 · National corporations (the Market ▸ Corporations register).
-- Depends on: 10 (nations). Run after 10. The rows are flavour/seed data and live in
-- supabase/seed/<nation>_corporations.sql (run those after this file).
--
-- One row per firm in a nation. READ-ONLY in v1: the Corporations tab shows each firm's
-- type (state-owned / private), cash, debt and a DERIVED growth (computed on the client
-- from the nation's live business climate + the firm's own trajectory — see corporations.js;
-- nothing here is simulated or stored as "growth"). Government actions (privatise /
-- nationalise / bail-out) open once a Minister of Industry exists, so no client write
-- policy is granted — RLS denies all client writes and the rows are admin/seed-only.

create table if not exists public.corporations (
  id             uuid primary key default gen_random_uuid(),
  nation_id      text not null references public.nations (id) on delete cascade,
  name           text not null,
  sector         text not null,
  type           text not null check (type in ('so', 'pr')),  -- so = state-owned, pr = private
  cash           numeric not null default 0,   -- on-hand capital, $B
  debt           numeric not null default 0,   -- outstanding debt, $B (drags growth on the client)
  drift          numeric not null default 0,   -- the firm's own trajectory, added to the climate
  director_name  text,                          -- NPC director (flavour); not a politician FK in v1
  director_party text,                          -- party the director leans to, or null (Non-player)
  director_acu   int,                           -- director acumen (flavour stat)
  director_age   int,
  created_at     timestamptz not null default now(),
  unique (nation_id, name)                       -- no two firms share a name within a nation
);

alter table public.corporations enable row level security;
-- World-readable (the register is public game data). No insert/update/delete policy and
-- no column grants → clients cannot write; rows are seeded by the admin (service role in
-- the SQL editor, which bypasses RLS). Action RPCs will replace this when actions land.
drop policy if exists "corporations_select_all" on public.corporations;
create policy "corporations_select_all" on public.corporations for select using (true);
