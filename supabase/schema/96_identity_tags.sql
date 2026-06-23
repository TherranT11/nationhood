-- 96 · Identity tags (admin-managed list).
-- Depends on: 10 (is_admin). Run after 10 (anytime — no other table references it).
--
-- The identity tags a policy option can carry ("what this law IS") and a conviction's
-- "when a tagged law passes" effect keys off. The tag NAME is the key; options and
-- convictions store it as a plain string in their definition jsonb. Admin-managed so
-- the list can grow straight from the authoring UI (adminsetup) — one source for the
-- policy tag chips and the conviction tag picker. Public read; admin-only write.

create table if not exists public.identity_tags (
  name       text primary key,
  created_at timestamptz not null default now()
);

alter table public.identity_tags enable row level security;
-- Public read (authoring tools); admin-only insert. No delete policy — there's no
-- remove UI, and an admin clearing a stray tag does it in the SQL editor (service
-- role, which bypasses RLS). Add a delete policy here if a remove feature lands.
drop policy if exists "itag_select_all" on public.identity_tags;
create policy "itag_select_all"   on public.identity_tags for select using (true);
drop policy if exists "itag_insert_admin" on public.identity_tags;
create policy "itag_insert_admin" on public.identity_tags for insert with check (public.is_admin());

-- Seed the topical tags (idempotent). An admin adds more from the policy / conviction
-- authoring UI; created_at orders them so the originals stay first.
-- NOTE: directional concepts (a tax CUT vs RISE) are NOT tags — they depend on the
-- transition, which a destination tag can't express. Convictions react to those by the
-- DIRECTION a structured effect target moves on enactment (onLaw {axis,dir,t,v}; see
-- _apply_law in schema/92). So 'Tax cut'/'Tax rise' are retired as tags below.
insert into public.identity_tags (name) values
  ('Values law'), ('Farm / Land law'), ('Trade law'),
  ('Green law'), ('Nationalisation'), ('Security law'), ('Civil-rights law')
on conflict do nothing;
-- Retire the two directional pseudo-tags from earlier installs (runs as the SQL-editor
-- owner, which bypasses RLS — there's no client delete policy). Any option/conviction
-- that still stores them is simply inert; the axis model replaces them.
delete from public.identity_tags where name in ('Tax cut', 'Tax rise');

notify pgrst, 'reload schema';
