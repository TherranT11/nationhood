-- ===========================================================================
-- 312 · Kingdoms — the building catalog + county terrain (Holdings).
--
-- kingdoms_building_specs is the ONE source for what can be built: each row carries the gold cost, land
-- (plots) it occupies, upkeep, any terrain requirement, and its effect lines. The Holdings UI fetches this
-- for display and the build RPC (313) reads cost/land/needs from it for validation, so display and rules
-- never drift. Seeded with the 20 starting buildings; `on conflict do update` keeps the seed authoritative.
-- Also adds terrain + a hills flag to counties (some buildings, e.g. the Mine, require Hills/Mountains).
-- Depends on: 309, 310. Idempotent. Apply after 311.
-- ===========================================================================

create table if not exists public.kingdoms_building_specs (
  num       int  primary key,
  name      text not null,
  category  text not null,                      -- Food | Economy | Military | Administration | Religion | Prestige
  cost      int  not null,                      -- gold to build
  land      int  not null default 1,            -- plots occupied
  upkeep    int  not null default 0,            -- gold per upkeep (display only for now)
  needs     text,                               -- terrain requirement key ('hills') or null
  eff       jsonb not null default '[]'::jsonb, -- effect lines (display)
  need_text text                                -- human-readable requirement
);

alter table public.kingdoms_building_specs enable row level security;
grant select on public.kingdoms_building_specs to anon, authenticated;   -- catalog is public game data
drop policy if exists "kingdoms_building_specs_select_all" on public.kingdoms_building_specs;
create policy "kingdoms_building_specs_select_all" on public.kingdoms_building_specs for select using (true);

insert into public.kingdoms_building_specs (num, name, category, cost, land, upkeep, needs, eff, need_text) values
  (1,  'Farmland',          'Food',           2,  1, 0, null,    '["Requires 1 Farmer","Produces 3 Food"]', null),
  (2,  'Pasture',           'Food',           3,  1, 1, null,    '["Requires 1 Farmer","Produces 4 Food","Produces 1 Wool or Livestock"]', null),
  (3,  'Orchard',           'Food',           4,  1, 0, null,    '["Requires 1 Farmer","Produces 2 Food","Produces 2 Gold"]', null),
  (4,  'Mill',              'Food',           4,  1, 0, null,    '["+2 Food to every Farmland in this Domain"]', null),
  (5,  'Market',            'Economy',        5,  1, 0, null,    '["+3 Gold each Taxation"]', null),
  (6,  'Merchant Guild',    'Economy',        8,  1, 0, null,    '["+5 Gold","+1 Administration Capacity"]', null),
  (7,  'Brewery',           'Economy',        5,  1, 0, null,    '["+2 Gold","+1 Happiness","Consumes 1 Food"]', null),
  (8,  'Mine',              'Economy',        7,  1, 0, 'hills', '["+6 Gold"]', 'Requires Hills or Mountains'),
  (9,  'Barracks',          'Military',       5,  1, 0, null,    '["+2 Levy Capacity","Train Soldiers here"]', null),
  (10, 'Stables',           'Military',       6,  1, 0, null,    '["Unlock Cavalry","Mounted units gain +1 Prowess"]', null),
  (11, 'Watchtower',        'Military',       4,  1, 0, null,    '["+2 Defense","-2 enemy Assassination","-2 Banditry"]', null),
  (12, 'Stone Keep',        'Military',       12, 2, 0, null,    '["Large defensive bonus","Protects all buildings in the Domain","Required for County Capital"]', null),
  (13, 'Manor Hall',        'Administration', 6,  1, 0, null,    '["+1 Administration","+2 Tax income"]', null),
  (14, 'Courthouse',        'Administration', 7,  1, 0, null,    '["Reduces unrest","Improves tax collection","Reduces corruption events"]', null),
  (15, 'Tax Office',        'Administration', 5,  1, 0, null,    '["+4 Gold during Taxation","Increases chance of peasant unrest if overused"]', null),
  (16, 'Abbey',             'Religion',       7,  1, 0, null,    '["+2 Prestige","Reduces unrest","Small chance of generating a learned character"]', null),
  (17, 'Shrine',            'Religion',       3,  1, 0, null,    '["+1 Prestige","Small happiness bonus"]', null),
  (18, 'Tournament Grounds','Prestige',       8,  2, 0, null,    '["Knights gain experience faster","Hosts tournaments","+Prestige"]', null),
  (19, 'Noble Estate',      'Prestige',       8,  1, 0, null,    '["+3 Gold","+Prestige","Required for certain political actions"]', null),
  (20, 'University',        'Prestige',       10, 2, 0, null,    '["+Administration","Improves children educated here","May generate scholars or stewards"]', null)
on conflict (num) do update set
  name = excluded.name, category = excluded.category, cost = excluded.cost, land = excluded.land,
  upkeep = excluded.upkeep, needs = excluded.needs, eff = excluded.eff, need_text = excluded.need_text;

-- Terrain for counties (a hills flag gates buildings like the Mine).
alter table public.kingdoms_counties
  add column if not exists terrain text,
  add column if not exists hills   boolean not null default false;

-- Backfill terrain on counties that have none: pick one of a small set, and mark hills accordingly.
update public.kingdoms_counties
   set terrain = t.pick,
       hills   = (t.pick like '%Hills%' or t.pick like '%Mountains%')
  from (
    select id, (array[
      'Hills · River','Woodland','Plains','Coastal Lowlands','Hills',
      'Mountains · Valley','Marshland','Forest · Hills','Rolling Downs','Fenlands'
    ])[1 + floor(random() * 10)::int] as pick
    from public.kingdoms_counties where terrain is null
  ) t
 where public.kingdoms_counties.id = t.id;

notify pgrst, 'reload schema';
