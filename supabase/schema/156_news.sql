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
alter table public.news_outlets add column if not exists img    text;

-- Published headlines. Written ONLY by _publish_headline (security definer) — never from the
-- client, so no INSERT/UPDATE/DELETE policy exists. `paper`/`slant`/`color` are denormalised from
-- the outlet so a headline still reads correctly if its outlet is later renamed or removed.
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
alter table public.news_headlines enable row level security;
drop policy if exists "news_headlines_select_all" on public.news_headlines;
create policy "news_headlines_select_all" on public.news_headlines for select using (true);
create index if not exists news_headlines_recent on public.news_headlines (created_at desc);

-- Publish one headline for a nation, attributed to ONE of its outlets (rotated by the headline
-- text so different stories surface different papers). No-op if the nation has no outlets yet.
create or replace function public._publish_headline(p_nation text, p_headline text)
returns void language plpgsql security definer set search_path = public as $$
declare v_o public.news_outlets%rowtype; v_tick int;
begin
  if p_headline is null or btrim(p_headline) = '' then return; end if;
  select * into v_o from public.news_outlets
   where nation_id = p_nation
   order by md5(p_headline || id::text) limit 1;
  if not found then return; end if;   -- no papers in this nation → nothing to print
  select current_tick into v_tick from public.game_state where id;
  insert into public.news_headlines (nation_id, outlet_id, paper, slant, color, headline, game_date, tick)
    values (p_nation, v_o.id, v_o.name, v_o.slant, v_o.color, p_headline, public.current_game_date(), v_tick);
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

-- Seed a small press per nation so headlines have papers to print and the World Press isn't bare.
-- Guarded per (nation, name) so re-running never duplicates. Admin can add/edit more in the News tab.
insert into public.news_outlets (nation_id, name, slant, color)
select n.id, n.name || ' ' || v.suffix, v.slant, v.color
from public.nations n
cross join (values ('Times','record','#c9c9d4'), ('Chronicle','left','#e0575a'), ('Post','right','#3f9fe0')) as v(suffix, slant, color)
where not exists (select 1 from public.news_outlets o where o.nation_id = n.id and o.name = n.name || ' ' || v.suffix);

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
