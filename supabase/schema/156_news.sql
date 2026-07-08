-- ===========================================================================
-- 156 · News — outlets (papers) and the headlines they publish.
-- Depends on: 10 (nations), 05 (game_state.current_tick), 40 (events + current_game_date,
-- is_admin lives in 10). Run after 40.
--
-- The player News page (/play/news/) reads two things from here: the nation's own headlines
-- and a "World Press" section — the latest from OTHER nations' papers. Headlines are GENERATED
-- from the events feed (schema/40) by an after-insert trigger, so "what happened" keeps ONE
-- source (events) and a headline is just its press framing, attributed to one of the nation's
-- outlets. Both tables are public-read (the press is public); writes are locked down.
-- ===========================================================================

-- Papers. Authored in adminsetup (News tab). Public-read; admin-write only.
create table if not exists public.news_outlets (
  id         uuid primary key default gen_random_uuid(),
  nation_id  text not null references public.nations (id) on delete cascade,
  name       text not null,
  slant      text not null default 'centre',   -- record|state|left|radleft|centre|right|farright|tabloid
  color      text not null default '#6b5cff',
  created_at timestamptz not null default now()
);
alter table public.news_outlets enable row level security;
drop policy if exists "news_outlets_select_all" on public.news_outlets;
create policy "news_outlets_select_all" on public.news_outlets for select using (true);
drop policy if exists "news_outlets_write_admin" on public.news_outlets;
create policy "news_outlets_write_admin" on public.news_outlets for all
  using (public.is_admin()) with check (public.is_admin());
-- Outlet identity shown in the admin editor: a slogan and a logo (a monogram over the colour above,
-- or an uploaded image). `img` holds a small data URL for now — if outlet logos ever render
-- player-facing, move them to a Storage bucket (like party-logos, schema/90) instead of a text column.
-- Headlines denormalise only name/slant/colour, so these three live only on the outlet.
alter table public.news_outlets add column if not exists slogan text;
alter table public.news_outlets add column if not exists mono   text;
alter table public.news_outlets add column if not exists img    text;   -- public URL of the logo in the news-logos bucket

-- Public bucket for outlet logos (rendered player-facing on the News page). Mirrors party-logos
-- (schema/90): everyone can read; only an admin can upload/replace/delete (outlets are admin-authored,
-- unlike party crests which are per-player). 2 MB cap + image-only mimes enforced by the bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('news-logos', 'news-logos', true, 2097152, array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do update
  set public = true, file_size_limit = 2097152,
      allowed_mime_types = array['image/png','image/jpeg','image/webp','image/gif'];
drop policy if exists "news_logos_read" on storage.objects;
create policy "news_logos_read" on storage.objects for select using (bucket_id = 'news-logos');
drop policy if exists "news_logos_insert" on storage.objects;
create policy "news_logos_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'news-logos' and public.is_admin());
drop policy if exists "news_logos_update" on storage.objects;
create policy "news_logos_update" on storage.objects for update to authenticated
  using (bucket_id = 'news-logos' and public.is_admin()) with check (bucket_id = 'news-logos' and public.is_admin());
drop policy if exists "news_logos_delete" on storage.objects;
create policy "news_logos_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'news-logos' and public.is_admin());

-- Published headlines. Written ONLY by _publish_headline (security definer) — never from the client,
-- so no INSERT/UPDATE/DELETE policy exists. The outlet's identity (paper/slant/color/mono/logo) is
-- denormalised so a headline still renders correctly if its outlet is later renamed or removed.
create table if not exists public.news_headlines (
  id         uuid primary key default gen_random_uuid(),
  nation_id  text not null references public.nations (id) on delete cascade,
  outlet_id  uuid references public.news_outlets (id) on delete set null,
  paper      text not null,
  slant      text not null default 'centre',
  color      text not null default '#6b5cff',
  headline   text not null,
  game_date  text,
  tick       int,
  created_at timestamptz not null default now()
);
alter table public.news_headlines add column if not exists mono text;   -- denormalised outlet monogram
alter table public.news_headlines add column if not exists logo text;   -- denormalised outlet logo URL
alter table public.news_headlines enable row level security;
drop policy if exists "news_headlines_select_all" on public.news_headlines;
create policy "news_headlines_select_all" on public.news_headlines for select using (true);
create index if not exists news_headlines_recent on public.news_headlines (created_at desc);

-- Publish one plain, OBJECTIVE headline (an event body: a bill endorsed in committee, demand
-- settled, goods bought…) for a nation — carried by its Paper of Record only. Objective facts
-- belong to the record; the slanted papers weigh in only when a headline rule gives them a take
-- (_publish_rule_headlines, all outlets). So the same factual line never repeats across every paper.
-- Falls back to one deterministic outlet if a nation has no record-slant paper. No-op if it has none.
create or replace function public._publish_headline(p_nation text, p_headline text)
returns void language plpgsql security definer set search_path = public as $$
declare v_o public.news_outlets%rowtype; v_tick int;
begin
  if p_headline is null or btrim(p_headline) = '' then return; end if;
  select * into v_o from public.news_outlets
   where nation_id = p_nation
   order by (slant = 'record') desc, md5(p_headline || id::text) limit 1;
  if not found then return; end if;   -- no papers in this nation → nothing to print
  select current_tick into v_tick from public.game_state where id;
  insert into public.news_headlines (nation_id, outlet_id, paper, slant, color, mono, logo, headline, game_date, tick)
    values (p_nation, v_o.id, v_o.name, v_o.slant, v_o.color, v_o.mono, v_o.img, p_headline, public.current_game_date(), v_tick);
end $$;

-- The event kinds worth a headline — the public, reader-facing ones. Party-internal moves (rallies,
-- fundraising, recruiting, attacks, ad blitzes) never make the press. ONE source for the list, shared
-- by the trigger and the one-time backfill below.
create or replace function public._is_newsworthy(p_kind text)
returns boolean language sql immutable as $$
  select p_kind in ('law','no_confidence','declaration','government','agenda','ministry','regime',
                    'election','world_event','world_broadcast','economy','crisis');
$$;

-- Turn every newsworthy event into a headline. The event body IS the headline text — events
-- (schema/40) stay the ONE source of "what happened"; this is just its press framing.
create or replace function public._event_to_headline()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public._is_newsworthy(NEW.kind) then
    perform public._publish_headline(NEW.nation_id, NEW.body);
  end if;
  return NEW;
end $$;
drop trigger if exists trg_event_to_headline on public.events;
create trigger trg_event_to_headline after insert on public.events
  for each row execute function public._event_to_headline();

-- Seed a small press per nation (record / left / right) so headlines have papers to print. Nations with
-- a cultural flavour get invented, tangential mastheads (NOT their real-world papers) — evoking the
-- feel without naming a real title or place; every other nation (e.g. Severia) keeps the generic
-- "<Nation> Times / Chronicle / Post". ONE source for outlet seeding, and AUTHORITATIVE for these three
-- canonical papers' names: on apply it (re)names each mapped nation's record/left/right paper to the
-- name below (from generic, a prior mapping, whatever) and inserts any that's missing — keyed by
-- (nation, slant), so re-running never duplicates. Extra papers an admin adds on OTHER slants are left
-- alone. Edit names here (the source), not in the News tab, or the next apply overwrites them.
with names (nation_name, slant, paper) as (values
  ('Sessau','record','Le Courrier'),           ('Sessau','left','La Sentinelle'),         ('Sessau','right','Le Patriote'),               -- French flavour
  ('Al-Qadir','record','The Qadir Crescent'),  ('Al-Qadir','left','The People''s Dawn'),   ('Al-Qadir','right','The Cedar Standard'),      -- Levantine flavour
  ('Laurentia','record','The Laurentian'),     ('Laurentia','left','The Maple Tribune'),  ('Laurentia','right','The Northern Post'),      -- Canadian flavour
  ('Wesmore','record','The Wesmore Standard'), ('Wesmore','left','The Loxbridge Caller'), ('Wesmore','right','The Crown Herald'),         -- Anglo flavour
  ('Calcordia','record','The Calcordia Gazette'), ('Calcordia','left','The Borough Voice'), ('Calcordia','right','The Albion Sentinel'),  -- Anglo flavour
  ('Vesperia','record','The Vesperia Tribune'),('Vesperia','left','The Liberty Beacon'),  ('Vesperia','right','The Eagle Standard'),      -- Americana flavour
  ('Montequilla','record','El Faro'),          ('Montequilla','left','La Voz del Pueblo'),('Montequilla','right','El Cóndor')             -- Andean flavour
),
canon (slant, suffix, color) as (values ('record','Times','#c9c9d4'), ('left','Chronicle','#e0575a'), ('right','Post','#3f9fe0')),
-- (Re)name each mapped nation's record/left/right paper to the masthead above, whatever it's called now
-- (data-modifying CTE: runs even though the INSERT below doesn't reference it). Authoritative for these
-- three slants; papers on other slants aren't matched, so admin extras are untouched.
renamed as (
  update public.news_outlets o set name = nm.paper
    from public.nations n
    join names nm on lower(nm.nation_name) = lower(n.name)
   where o.nation_id = n.id and o.slant = nm.slant and o.name <> nm.paper
  returning o.id
)
insert into public.news_outlets (nation_id, name, slant, color)
select n.id, coalesce(nm.paper, n.name || ' ' || c.suffix), c.slant, c.color
  from public.nations n
  cross join canon c
  left join names nm on lower(nm.nation_name) = lower(n.name) and nm.slant = c.slant
 where not exists (select 1 from public.news_outlets o where o.nation_id = n.id and o.slant = c.slant);

-- One-time backfill: seed headlines from recent existing events so the desk has content on first
-- load. Runs only while the table is empty, so re-applying the schema never re-seeds or duplicates.
do $$
begin
  if not exists (select 1 from public.news_headlines) then
    perform public._publish_headline(e.nation_id, e.body)
    from (select * from public.events where public._is_newsworthy(kind)
          order by created_at desc limit 60) e;
  end if;
end $$;
