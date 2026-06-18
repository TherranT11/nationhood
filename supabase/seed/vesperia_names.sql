-- Seed data: the Federated States of Vesperia name pool.
--
-- Run in the Supabase SQL Editor AFTER schema/50_names.sql, and after the
-- Vesperia nation exists (created via /adminsetup). The names are keyed to the
-- nation's actual id by matching its NAME below, so they line up with whatever
-- slug the admin form assigned. If Vesperia doesn't exist yet, this inserts
-- nothing (no error) — just re-run it once the nation is there.
-- Idempotent: unique (nation_id, kind, name) + on-conflict-do-nothing.

insert into public.nation_names (nation_id, kind, name)
select n.id, 'male', x from public.nations n, unnest(array[
  'Michael','Christopher','Jason','David','James','John','Robert','Brian','William',
  'Joseph','Matthew','Mark','Daniel','Richard','Thomas','Steven','Kevin','Jeffrey',
  'Timothy','Scott','Eric','Kenneth','Paul','Andrew','Anthony','Charles','Stephen',
  'Ronald','Gregory','Patrick','Gary','Edward','Douglas','Dennis','Todd','Ryan',
  'Keith','Larry','Craig','Jonathan','Shawn','Bradley','Justin','Adam','Jeremy',
  'Sean','Nathan','Christian','Benjamin','Aaron'
]) as x
where n.name = 'Federated States of Vesperia'
on conflict (nation_id, kind, name) do nothing;

insert into public.nation_names (nation_id, kind, name)
select n.id, 'female', x from public.nations n, unnest(array[
  'Jennifer','Jessica','Amanda','Melissa','Sarah','Heather','Nicole','Amy','Elizabeth',
  'Michelle','Kimberly','Angela','Stephanie','Rebecca','Christina','Laura','Crystal',
  'Julie','Erin','Kelly'
]) as x
where n.name = 'Federated States of Vesperia'
on conflict (nation_id, kind, name) do nothing;

insert into public.nation_names (nation_id, kind, name)
select n.id, 'surname', x from public.nations n, unnest(array[
  'Smith','Johnson','Williams','Brown','Jones','Miller','Davis','Garcia','Rodriguez',
  'Wilson','Martinez','Anderson','Taylor','Thomas','Hernandez','Moore','Martin',
  'Jackson','Thompson','White','Lopez','Lee','Gonzalez','Harris','Clark','Lewis',
  'Robinson','Walker','Perez','Hall','Young','Allen','Sanchez','Wright','King','Scott',
  'Green','Baker','Adams','Nelson','Hill','Ramirez','Campbell','Mitchell','Roberts',
  'Carter','Phillips','Evans','Turner','Torres','Parker','Collins','Edwards','Stewart',
  'Flores','Morris','Nguyen','Murphy','Rivera','Cook','Rogers','Morgan','Peterson',
  'Cooper','Reed','Bailey','Bell','Gomez','Kelly','Howard','Ward','Cox','Diaz',
  'Richardson','Wood','Watson','Brooks','Bennett','Gray','James','Reyes','Cruz',
  'Hughes','Price','Myers','Long','Foster','Sanders','Ross','Morales','Powell',
  'Sullivan','Russell','Ortiz','Jenkins','Gutierrez','Perry','Butler','Barnes','Fisher'
]) as x
where n.name = 'Federated States of Vesperia'
on conflict (nation_id, kind, name) do nothing;
