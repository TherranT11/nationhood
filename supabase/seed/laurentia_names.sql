-- Seed data: the Laurentia name pool.
--
-- Run in the Supabase SQL Editor AFTER schema/50_names.sql, and after the
-- Laurentia nation exists (created via /adminsetup). The names are keyed to the
-- nation's actual id by matching its NAME below, so they line up with whatever
-- slug the admin form assigned (matched loosely so "Laurentia", "The Republic
-- of Laurentia", etc. all resolve). If Laurentia doesn't exist yet, this inserts
-- nothing (no error) — just re-run it once the nation is there.
-- Idempotent: unique (nation_id, kind, name) + on-conflict-do-nothing.

insert into public.nation_names (nation_id, kind, name)
select n.id, 'male', x from public.nations n, unnest(array[
  'Liam','Noah','Oliver','Lucas','William','Benjamin','Leo','Jack','Theodore','Owen',
  'Jackson','Henry','Thomas','Jacob','James','Ethan','Wyatt','Nathan','Samuel','Alexander',
  'Gabriel','Logan','Daniel','Arthur','Édouard','Félix','Alexis','Ryan','Connor','Caleb',
  'Maverick','Charles','Isaac','Mason','Dylan','Hunter','Carter','Lincoln','Hudson','Luke',
  'Grayson','Matthew','Levi','Austin','Colton','Nolan','Gavin','Brody','Jaxson','Michael'
]) as x
where n.name ilike '%laurentia%'
on conflict (nation_id, kind, name) do nothing;

insert into public.nation_names (nation_id, kind, name)
select n.id, 'female', x from public.nations n, unnest(array[
  'Olivia','Emma','Charlotte','Amelia','Sophia','Chloe','Mia','Mila','Harper','Lily'
]) as x
where n.name ilike '%laurentia%'
on conflict (nation_id, kind, name) do nothing;

insert into public.nation_names (nation_id, kind, name)
select n.id, 'surname', x from public.nations n, unnest(array[
  'Smith','Brown','Tremblay','Martin','Roy','Gagnon','Lee','Wilson','Bouchard','Taylor',
  'Campbell','Macdonald','Gauthier','Morin','Lavoie','Fortin','Miller','Williams','Jones','Davis',
  'Anderson','Pelletier','Belanger','Lévesque','White','Thompson','Johnston','Stewart','Johnson','Wong',
  'Singh','Chen','Scott','Murray','Robinson','Clarke','Ross','Thomas','Walker','Young',
  'King','Evans','Fraser','Green','Graham','Hall','Harris','Jackson','Lewis','Marshall',
  'Mitchell','Moore','Morrison','Murphy','Nelson','O''Brien','Parker','Reid','Reynolds','Roberts',
  'Robertson','Russell','Shaw','Simpson','Ward','Watson','Wood','Wright','Boudreau','Cyr',
  'Leblanc','Richard','Landry','Cormier','Hebert','Nadeau','Bernard','Michaud','Caron','Desjardins',
  'Dubé','Fontaine','Fournier','Girard','Lambert','Lemieux','Mercier','Ouellet','Paquette','Poirier',
  'Poulin','Renaud','Rousseau','Villeneuve','Kim','Li','Patel','Nguyen','Gill','Chan'
]) as x
where n.name ilike '%laurentia%'
on conflict (nation_id, kind, name) do nothing;
