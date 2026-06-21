-- 93 · Convictions (admin authoring storage)
--
-- Admin-authored convictions, one JSONB definition per row — the canonical object
-- the admin tool edits:
--   { name, archetype, level (1-5), cost, desc,
--     onAdopt:     [ {t (target), v (value)} ... ],            -- one-time, on adoption
--     whileActive: [ {kind:'trigger', stat, dir, per, rt, rv, sym}  -- reward when a stat moves
--                  | {kind:'standing', t, v} ... ] }                 -- constant modifier while held
-- where targets are the same stat/economy/resource/governance set as policy effects
-- (schema/90). A conviction attaches to an archetype at a Level and surfaces in that
-- archetype's manifesto on the party page.
--
-- Public read; admin-only write — same is_admin() pattern as the policy/modifier
-- tables (schema/70, 90). Per-party adoption state + the effects/trigger engine arrive
-- in later stages; this file only adds the authoring store.
create table if not exists public.convictions (
  id         uuid primary key default gen_random_uuid(),
  definition jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.convictions enable row level security;

drop policy if exists "conv_select_all"   on public.convictions;
create policy "conv_select_all"   on public.convictions for select using (true);
drop policy if exists "conv_insert_admin" on public.convictions;
create policy "conv_insert_admin" on public.convictions for insert with check (public.is_admin());
drop policy if exists "conv_update_admin" on public.convictions;
create policy "conv_update_admin" on public.convictions for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "conv_delete_admin" on public.convictions;
create policy "conv_delete_admin" on public.convictions for delete using (public.is_admin());

notify pgrst, 'reload schema';
