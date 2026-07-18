-- ===========================================================================
-- 271 · Nationverse nations — the NEW-universe nation roster (admin-authored).
--
-- The new universe uses a fresh 13-stat model (each 0..20) that is unrelated to the live game's
-- nations.stats (prosperity/welfare/order/image/growth). Storing these in the existing `nations` table
-- would leak new-universe rows into every live-game query (nation-select, the tick, elections, …), so
-- they live in their OWN table. Populated by the /backend admin panel's "Nation Creator"; nothing reads
-- it yet on the player side (the /nations chooser will, when that's wired up).
--
-- Auth reuses is_admin() (schema/10): anyone may read the roster (public game data, like nations); only
-- the admin may create/edit/remove. Flag images are uploaded to the existing 'world-event-images'
-- storage bucket (folder 'flags') from the client — same path adminsetup already uses — so no repo
-- commit and no new bucket. Depends on: 10 (is_admin). Idempotent. Apply after 270.
-- ===========================================================================

create table if not exists public.nationverse_nations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  analogous   text,                                 -- real-world analogue, e.g. 'France'
  capital     text,
  flag        text,                                 -- uploaded flag public URL (Supabase storage), or null
  stats       jsonb not null default '{}'::jsonb,   -- the 13 Nationverse stats, each an integer 0..20
  created_at  timestamptz not null default now()
);

alter table public.nationverse_nations enable row level security;

-- Read: public (new-universe roster is game data). Write: admin only — the base grants are harmless on
-- their own; the WITH CHECK / USING is_admin() gate is what actually rejects a non-admin request.
grant select on public.nationverse_nations to anon, authenticated;
grant insert, update, delete on public.nationverse_nations to authenticated;

drop policy if exists "nv_nations_select_all" on public.nationverse_nations;
create policy "nv_nations_select_all" on public.nationverse_nations for select using (true);

drop policy if exists "nv_nations_insert_admin" on public.nationverse_nations;
create policy "nv_nations_insert_admin" on public.nationverse_nations for insert with check (public.is_admin());

drop policy if exists "nv_nations_update_admin" on public.nationverse_nations;
create policy "nv_nations_update_admin" on public.nationverse_nations for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "nv_nations_delete_admin" on public.nationverse_nations;
create policy "nv_nations_delete_admin" on public.nationverse_nations for delete using (public.is_admin());

notify pgrst, 'reload schema';
