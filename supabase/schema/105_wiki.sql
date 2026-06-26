-- 105 · Nationhopedia (the in-game wiki). Admin-authored articles, world-readable, admin-only
-- writes via is_admin() — the same pattern as world events (100) and crises (99). Each row is
-- one article: title + kind as columns (for listing, search, and cross-link resolution by title),
-- with the rich body in a single JSONB `definition` so adding article fields never needs a
-- migration. Depends on: 10 (is_admin).
--
--   definition = {
--     hat:   '<i>hatnote html</i>',           -- optional disambiguation line above the article
--     box:   {                                -- the infobox (its title is the row's title)
--       sub:   'subtitle',                    -- optional, under the title
--       image: { kind:'image'|'square'|'circle', url, color, text, cap },
--       groups:[ { h?:'group heading', rows:[ ['key','value html'] ... ] } ]
--     },
--     lead:     '<p>…</p>',                    -- intro html
--     sections: [ { h:'heading', html:'…' } ],
--     see:      [ 'Other Article Title' ... ], -- cross-links, resolved by title
--     refs:     [ 'reference line' ... ],
--     cats:     [ 'Category' ... ]
--   }
-- Links inside lead/section html use: <span class="wk-link" data-link="Article Title">label</span>
-- — the reader resolves them by title (live if the article exists, muted otherwise). Body html is
-- admin-authored and therefore trusted (every write is is_admin-gated), so the reader renders it
-- directly; nothing here is writable from a normal player session.

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

notify pgrst, 'reload schema';
