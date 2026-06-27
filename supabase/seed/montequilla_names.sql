-- Seed data: the Montequilla name pool (an Ecuadorian/Andean-Spanish set — Spanish
-- given names alongside Kichwa and Afro-Ecuadorian surnames).
--
-- Run in the Supabase SQL Editor AFTER schema/50_names.sql, and after the Montequilla
-- nation exists (created via /adminsetup). The names are keyed to the nation's actual id
-- by matching its NAME below (any nation whose name contains "Montequilla"). If no such
-- nation exists yet, this inserts nothing (no error) — just re-run it once it's there.
--
-- Idempotent: unique (nation_id, kind, name) + on-conflict-do-nothing, so re-running
-- (or running it alongside other nations' seeds) only ever tops up what's missing.

insert into public.nation_names (nation_id, kind, name)
select n.id, 'male', x from public.nations n, unnest(array[
  'José','Juan','Carlos','Luis','Miguel','Jorge','Pedro','Diego','Andrés','Daniel',
  'David','Alejandro','Christian','Cristian','Fernando','Francisco','Javier','Manuel',
  'Marco','Marcos','Mauricio','Nicolás','Patricio','Pablo','Ricardo','Roberto',
  'Santiago','Sebastián','Ángel','Edison','Byron','Lenin','Wilson','Washington','Edwin',
  'Geovanny','Giovanny','Kevin','Jonathan','Bryan','Jefferson','Jhon','Iván','César',
  'Víctor','Óscar','Ramiro','Raúl','Rubén','Héctor','Fabián','Franklin','Galo','Gonzalo',
  'Hugo','Ismael','Jaime','Julio','Leonardo','Marcelo','Nelson','Orlando','Renato',
  'Rodrigo','Saúl','Simón','Tomás','Xavier','Yánder','Efraín','Esteban','Enrique',
  'Armando','Vicente','Álvaro'
]) as x
where n.name ilike '%montequilla%'
on conflict (nation_id, kind, name) do nothing;

insert into public.nation_names (nation_id, kind, name)
select n.id, 'female', x from public.nations n, unnest(array[
  'María','Ana','Carmen','Rosa','Patricia','Gabriela','Andrea','Daniela','Fernanda','Isabel'
]) as x
where n.name ilike '%montequilla%'
on conflict (nation_id, kind, name) do nothing;

insert into public.nation_names (nation_id, kind, name)
select n.id, 'surname', x from public.nations n, unnest(array[
  'García','Rodríguez','González','Pérez','Sánchez','Martínez','López','Torres',
  'Ramírez','Flores','Herrera','Castillo','Cruz','Romero','Moreno','Cevallos','Vera',
  'Zambrano','Mendoza','Espinoza','Paredes','Guerrero','Vaca','Jaramillo','Salazar',
  'Bravo','Acosta','Valencia','Andrade','Rojas','Chávez','Carrasco','Hidalgo','Alvarado',
  'Yánez','Narváez','Reinoso','Ponce','Mera','Carrión','Villacís','Naranjo','Granda',
  'Quezada','Tapia','León','Cordero','Benítez','Riofrío','Ordoñez','Cedeño','Caicedo',
  'Guaman','Chicaiza','Pilco','Toapanta','Quishpe','Lema','Simbaña','Guaraca','Guamán',
  'Condor','Tenorio','Mina','Angulo','Cabezas','Perlaza','Nazareno','Arroyo','Burbano',
  'Cabrera','Delgado','Villamar','Villafuerte','Moncayo','Ochoa','Villalba','Viteri',
  'Proaño','Chiriboga','Egas','Jijón','Larrea','Dávalos','Guarderas','Cornejo','Mosquera',
  'Cuesta','Cando','Chiluisa','Tene','Cachimuel','Chango','Imbaquingo','Quinde','Soria',
  'Vinueza','Cango','Guachamín'
]) as x
where n.name ilike '%montequilla%'
on conflict (nation_id, kind, name) do nothing;
