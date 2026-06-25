-- ===========================================================================
-- 47 · Corporations — firms that ride each nation's business climate.
--
-- Admin-authored via /adminsetup (is_admin RLS, same pattern as nations/modifiers).
-- The climate math lives in corporations.js (client) for display; Phase 2 will mirror it
-- in SQL for the tick automation (generation-list release, per-firm growth, sector bonuses)
-- so the formula has ONE server-side source the tick reads. Every nation starts empty.
--
-- status:
--   'placed' — live in the nation's register now.
--   'queued' — on the Growing Economy Generation List; enters as a Startup (seeded with
--              roll_m) once the nation's climate is healthy (Phase 2 auto-release).
-- ===========================================================================
create table if not exists public.corporations (
  id          uuid primary key default gen_random_uuid(),
  nation_id   text not null references public.nations (id) on delete cascade,
  name        text not null,
  category    text not null,                    -- sector (Energy, Finance, …) — drives the sector bonus
  type        text not null default 'pr',       -- 'pr' private | 'so' state-owned
  size        text not null default 'Moderate', -- Startup | Moderate | Enterprise | National Corporation | International Conglomerate
  cash        numeric not null default 0,       -- $B
  debt        numeric not null default 0,       -- $B  (>= 0)
  drift       int     not null default 0,       -- the firm's own trajectory; corpGrowth() in corporations.js reads this. Phase 2 applies it per tick
  status      text    not null default 'placed',-- 'placed' | 'queued'
  roll_m      int,                              -- queued: rolled startup cash in $M (1D60+20); null once placed
  created_at  timestamptz not null default now()
);
create index if not exists corporations_nation_idx on public.corporations (nation_id);

-- RLS: everyone reads (the World/Corporations register is public); only admins write
-- directly. The Phase 2 tick functions run security definer, so they bypass these.
alter table public.corporations enable row level security;
drop policy if exists "corp_select_all"   on public.corporations;
create policy "corp_select_all"   on public.corporations for select using (true);
drop policy if exists "corp_insert_admin" on public.corporations;
create policy "corp_insert_admin" on public.corporations for insert with check (public.is_admin());
drop policy if exists "corp_update_admin" on public.corporations;
create policy "corp_update_admin" on public.corporations for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "corp_delete_admin" on public.corporations;
create policy "corp_delete_admin" on public.corporations for delete using (public.is_admin());
