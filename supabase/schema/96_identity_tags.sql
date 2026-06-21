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
drop policy if exists "itag_select_all" on public.identity_tags;
create policy "itag_select_all"   on public.identity_tags for select using (true);
drop policy if exists "itag_insert_admin" on public.identity_tags;
create policy "itag_insert_admin" on public.identity_tags for insert with check (public.is_admin());
drop policy if exists "itag_delete_admin" on public.identity_tags;
create policy "itag_delete_admin" on public.identity_tags for delete using (public.is_admin());

-- Seed the original nine (idempotent). An admin adds more from the policy / conviction
-- authoring UI; created_at orders them so the originals stay first.
insert into public.identity_tags (name) values
  ('Tax cut'), ('Tax rise'), ('Values law'), ('Farm / Land law'), ('Trade law'),
  ('Green law'), ('Nationalisation'), ('Security law'), ('Civil-rights law')
on conflict do nothing;

notify pgrst, 'reload schema';
