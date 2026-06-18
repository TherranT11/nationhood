-- Seed data: the Sessau name pool.
--
-- Bulk reference data kept out of schema.sql so the schema stays structure-only.
-- Run this once in the Supabase SQL Editor AFTER supabase/schema.sql has created
-- public.sessau_names. Idempotent: unique (kind, name) + on-conflict-do-nothing
-- make re-runs (and edits to these lists) safe to apply again.

insert into public.sessau_names (kind, name)
select 'male', n from unnest(array[
  'Adrien','Alexandre','Alexis','Antoine','Arthur','Baptiste','Benjamin','Benoît',
  'Charles','Clément','Damien','David','Dorian','Édouard','Élias','Étienne','Fabien',
  'Florian','François','Gabriel','Gaspard','Gauthier','Guillaume','Hugo','Jean',
  'Jérémy','Jonathan','Julien','Laurent','Louis','Lucas','Marc','Matthieu','Maxime',
  'Nicolas','Olivier','Quentin','Raphaël','Romain','Samuel','Sébastien','Simon',
  'Stéphane','Tanguy','Thomas','Thibault','Valentin','Victor','Xavier'
]) as n
on conflict (kind, name) do nothing;

insert into public.sessau_names (kind, name)
select 'female', n from unnest(array[
  'Amélie','Anaïs','Audrey','Camille','Caroline','Chloé','Claire','Élodie','Émilie',
  'Emma','Estelle','Fanny','Hélène','Julie','Justine','Laura','Léa','Manon','Marine','Sophie'
]) as n
on conflict (kind, name) do nothing;

insert into public.sessau_names (kind, name)
select 'surname', n from unnest(array[
  'Bernard','Thomas','Petit','Robert','Richard','Durand','Dubois','Moreau','Laurent',
  'Simon','Michel','Lefebvre','Leroy','Roux','David','Bertrand','Morel','Fournier',
  'Girard','Bonnet','Fontaine','Rousseau','Vincent','Muller','Faure','Lambert',
  'Gauthier','Mercier','Blanc','Guerin','Boyer','Garnier','Chevan','Rossi','Ferrand',
  'Picard','Roger','Fabre','Dumont','Andre','Martin','Bonnett','Lemaire','Martel',
  'Cohen','Payet','Pelletier','Lucas','Henry','Martinez','Vidal','Gautier','Mouton',
  'Lacroix','Denis','Carlier','Marchand','Aubert','Perrot','Boucher'
]) as n
on conflict (kind, name) do nothing;
