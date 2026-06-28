-- ===========================================================================
-- 123 · Military standing — the data behind the Conflict page. Each nation holds a
-- number of military bases and sits on a continent; the page groups nations by
-- continent and shows their bases. There is no war/conflict mechanic yet — every
-- continent reads "no active conflicts" — so this is columns + a seed, nothing more.
-- Depends on: 10 (nations). nations is already world-readable, so no new policies.
-- ===========================================================================

alter table public.nations add column if not exists military_bases int not null default 1;  -- every nation starts with one
alter table public.nations add column if not exists continent      text;                     -- which continent it sits on (Conflict page)

-- Seed the current world by name. Adjust the names here if your nations are spelled differently
-- (e.g. "Wesmore & Calcordia"); a name that matches nothing simply leaves that nation unchanged.
update public.nations set military_bases = 3 where name in ('Severia', 'Vesperia');
update public.nations set continent = 'NEXAR'            where name in ('Laurentia', 'Vesperia');
update public.nations set continent = 'Crucera'          where name in ('Montequilla');
update public.nations set continent = 'Western Meridian' where name in ('Sessau', 'Wesmore', 'Wesmore & Calcordia');
update public.nations set continent = 'Eastern Meridian' where name in ('Severia');

notify pgrst, 'reload schema';
