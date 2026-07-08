-- 105 · Nationpedia (the in-game wiki). World-readable articles that players author and edit:
-- a player may CREATE articles and EDIT their own; admins may edit or delete anything; deletes are
-- admin-only. Each row is one article: title + kind as columns (for listing, search, and cross-link
-- resolution by title), the rich body in a single JSONB `definition` so adding article fields never
-- needs a migration, and author_id (the creator) so RLS can scope edits. Depends on: 10 (is_admin).
--
--   definition = {
--     hat:  'markup',                               -- optional disambiguation line
--     box:  { heading:'', image:{ url:'' }|null, cap:'', rows:[ ['key','value markup'] ... ] },
--     lead: 'markup',
--     sections: [ { lvl:2|3, h:'heading', b:'markup body' } ],
--     refs: [ 'citation' ... ],
--     see:  [ 'Other Article Title' ... ],          -- cross-links, resolved by title
--     cats: [ 'Category' ... ]
--   }
-- Text fields use a light markup parsed in /wiki.js (the ONE renderer, shared by the editor preview
-- and the player page): [[Title]] / [[Title|label]] cross-links, **bold**, [n] reference markers,
-- and blank lines for paragraphs. Body html is escaped in the renderer, so author markup is safe to
-- render. Infobox images live in the wiki-images bucket below (public read; any signed-in player may
-- upload).

create table if not exists public.wiki_articles (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  kind       text not null default 'Article',
  definition jsonb not null default '{}'::jsonb,
  author_id  uuid references auth.users (id) on delete set null,  -- the creator; null for legacy/admin rows
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
-- Backfill for an existing table that predates author_id.
alter table public.wiki_articles add column if not exists author_id uuid references auth.users (id) on delete set null;
-- Titles are the cross-link key, so they're unique case-insensitively.
create unique index if not exists wiki_articles_title_unique on public.wiki_articles (lower(title));

alter table public.wiki_articles enable row level security;
-- Anyone may read.
drop policy if exists "wiki_select_all" on public.wiki_articles;
create policy "wiki_select_all" on public.wiki_articles for select using (true);
-- A signed-in player may create an article they own; admins may create on anyone's behalf.
drop policy if exists "wiki_insert_admin" on public.wiki_articles;       -- old name (admin-only era)
drop policy if exists "wiki_insert_own"   on public.wiki_articles;
create policy "wiki_insert_own" on public.wiki_articles for insert to authenticated
  with check (public.is_admin() or author_id = auth.uid());
-- A player may edit their own article (and can't reassign authorship away); admins may edit any.
drop policy if exists "wiki_update_admin" on public.wiki_articles;       -- old name (admin-only era)
drop policy if exists "wiki_update_own"   on public.wiki_articles;
create policy "wiki_update_own" on public.wiki_articles for update to authenticated
  using      (public.is_admin() or author_id = auth.uid())
  with check (public.is_admin() or author_id = auth.uid());
-- Deletes stay admin-only (no client mass-deletion of the shared encyclopedia).
-- Delete: the author can remove their own article (or an admin any) — the same scope as update/insert,
-- so the article view can offer a Delete button next to Edit for your own entries.
drop policy if exists "wiki_delete_admin" on public.wiki_articles;       -- old name (admin-only era)
drop policy if exists "wiki_delete_own"   on public.wiki_articles;
create policy "wiki_delete_own" on public.wiki_articles for delete to authenticated
  using (public.is_admin() or author_id = auth.uid());

-- Infobox art. Public read (articles show to every player); any signed-in player may upload (so they
-- can illustrate their own articles). 2 MB image-only cap, like the other buckets. Updates/deletes
-- stay admin-only — uploads use unique paths, so editors never need to overwrite or remove.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('wiki-images', 'wiki-images', true, 2097152,
        array['image/png','image/jpeg','image/webp','image/gif','image/svg+xml'])
on conflict (id) do update
  set public = true, file_size_limit = 2097152,
      allowed_mime_types = array['image/png','image/jpeg','image/webp','image/gif','image/svg+xml'];

drop policy if exists "wiki_images_read" on storage.objects;
create policy "wiki_images_read" on storage.objects for select
  using (bucket_id = 'wiki-images');
drop policy if exists "wiki_images_insert" on storage.objects;
create policy "wiki_images_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'wiki-images');
drop policy if exists "wiki_images_update" on storage.objects;
create policy "wiki_images_update" on storage.objects for update to authenticated
  using      (bucket_id = 'wiki-images' and public.is_admin())
  with check (bucket_id = 'wiki-images' and public.is_admin());
drop policy if exists "wiki_images_delete" on storage.objects;
create policy "wiki_images_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'wiki-images' and public.is_admin());

notify pgrst, 'reload schema';
