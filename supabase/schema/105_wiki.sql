-- 105 · Nationpedia (the in-game wiki). Admin-authored articles, world-readable, admin-only
-- writes via is_admin() — the same pattern as world events (100) and crises (99). Each row is
-- one article: title + kind as columns (for listing, search, and cross-link resolution by title),
-- with the rich body in a single JSONB `definition` so adding article fields never needs a
-- migration. Depends on: 10 (is_admin).
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
-- and blank lines for paragraphs. Content is admin-authored and therefore trusted (every write is
-- is_admin-gated); nothing here is writable from a normal player session. Infobox images live in
-- the wiki-images bucket below (public read, admin write).

create table if not exists public.wiki_articles (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  kind       text not null default 'Article',
  definition jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
-- Titles are the cross-link key, so they're unique case-insensitively.
create unique index if not exists wiki_articles_title_unique on public.wiki_articles (lower(title));

alter table public.wiki_articles enable row level security;
drop policy if exists "wiki_select_all"   on public.wiki_articles;
create policy "wiki_select_all"   on public.wiki_articles for select using (true);
drop policy if exists "wiki_insert_admin" on public.wiki_articles;
create policy "wiki_insert_admin" on public.wiki_articles for insert with check (public.is_admin());
drop policy if exists "wiki_update_admin" on public.wiki_articles;
create policy "wiki_update_admin" on public.wiki_articles for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "wiki_delete_admin" on public.wiki_articles;
create policy "wiki_delete_admin" on public.wiki_articles for delete using (public.is_admin());

-- Infobox art. Public read (articles show to every player); writes admin-only — the same shape
-- and 2 MB image-only cap as the other buckets (world-event-images, party-logos).
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
  with check (bucket_id = 'wiki-images' and public.is_admin());
drop policy if exists "wiki_images_update" on storage.objects;
create policy "wiki_images_update" on storage.objects for update to authenticated
  using      (bucket_id = 'wiki-images' and public.is_admin())
  with check (bucket_id = 'wiki-images' and public.is_admin());
drop policy if exists "wiki_images_delete" on storage.objects;
create policy "wiki_images_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'wiki-images' and public.is_admin());

notify pgrst, 'reload schema';
