-- Seed data: the Sessau corporation register (Market ▸ Corporations).
--
-- Run in the Supabase SQL Editor AFTER schema/99_corporations.sql. Keyed to the nation
-- by NAME match (ilike '%sessau%') so it lines up with whatever id the admin form
-- assigned. Idempotent: unique (nation_id, name) + on-conflict-do-nothing, so re-running
-- never duplicates or clobbers live values. director_party is null for Non-player firms.

insert into public.corporations
  (nation_id, name, sector, type, cash, debt, drift, director_name, director_party, director_acu, director_age)
select n.id, v.name, v.sector, v.type, v.cash, v.debt, v.drift, v.director_name, v.director_party, v.director_acu, v.director_age
from public.nations n,
(values
  ('Sessau Rail Nationale', 'Rail',           'so', 3.0, 0.0, -1, 'Armand Roux',      'Front de Sessau',  3, 58),
  ('Compagnie MCF',         'Energy',         'pr', 6.0, 0.0,  5, 'Hélène Vasseur',   'Liberal Alliance', 4, 51),
  ('Banque de Sessau',      'Finance',        'so', 4.0, 0.0,  2, 'Margot Sève',      'Front de Sessau',  4, 49),
  ('Aérospatiale Seyonne',  'Aerospace',      'so', 1.5, 0.0,  1, 'P. Verdon',        null,               2, 44),
  ('Télécom Sessau',        'Telecom',        'so', 2.0, 0.0,  2, 'Claire Bonnet',    'Front de Sessau',  3, 41),
  ('Vignobles du Sud',      'Agriculture',    'pr', 0.6, 0.0, -2, 'Bastien Carrère',  'National Rally',   3, 63),
  ('Aciéries du Nord',      'Heavy Industry', 'so', 0.2, 0.3, -5, 'L. Caron',         null,               2, 55),
  ('Port de Marivaux',      'Ports',          'so', 2.5, 0.0,  2, 'Aurélie Brun',     'Front de Sessau',  2, 37),
  ('Centrale Atomique Vire','Nuclear',        'so', 5.0, 0.0,  0, 'Didier Lampe',     'Centre Union',     4, 60),
  ('Crédit Populaire',      'Finance',        'pr', 3.5, 0.0,  4, 'J. Maurel',        null,               3, 47)
) as v(name, sector, type, cash, debt, drift, director_name, director_party, director_acu, director_age)
where n.name ilike '%sessau%'
on conflict (nation_id, name) do nothing;
