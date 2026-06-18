-- One-off (idempotent) backfill: give every Sessau party that has NO politicians
-- its starting Party Leader. Parties founded before the client-side generator
-- existed (e.g. Centrist Union) start empty; run this once to seed them.
--
-- Safe to re-run: it only touches parties that currently have zero politicians,
-- so a second run is a no-op. New parties are seeded by party-creation instead.
--
-- Requires: supabase/schema/ (in particular 30_politicians.sql) and
-- supabase/seed/sessau_names.sql (the name pool) already applied.
--
-- Matches the client generator exactly: a random Sessau first/last name, age
-- 25–55, experience = floor(age / 10), and that many stat points spread randomly
-- across the five competencies (cha/acu/gui/res/com).

insert into public.politicians (party_id, first_name, last_name, age, experience, status, cha, acu, gui, res, com)
with seed as materialized (
  -- one row per Sessau party that has no politician yet, with a rolled age
  select p.id as party_id,
         (25 + floor(random() * 31))::int as age
  from public.parties p
  where p.nation_id = 'sessau'
    and not exists (select 1 from public.politicians pol where pol.party_id = p.id)
),
named as materialized (
  -- attach experience + an independent random name per party (LATERAL re-rolls
  -- per row, so two parties don't get the same name)
  select s.party_id,
         s.age,
         floor(s.age / 10)::int as exp,
         fn.name as first_name,
         ln.name as last_name
  from seed s
  cross join lateral (select name from public.sessau_names where kind in ('male','female') order by random() limit 1) fn
  cross join lateral (select name from public.sessau_names where kind = 'surname'         order by random() limit 1) ln
),
points as materialized (
  -- exp random stat picks per party (one row per point)
  select n.party_id, (floor(random() * 5))::int as stat
  from named n, generate_series(1, n.exp)
),
tally as (
  -- fold the picks into per-stat counts
  select party_id,
         count(*) filter (where stat = 0) as cha,
         count(*) filter (where stat = 1) as acu,
         count(*) filter (where stat = 2) as gui,
         count(*) filter (where stat = 3) as res,
         count(*) filter (where stat = 4) as com
  from points
  group by party_id
)
select n.party_id, n.first_name, n.last_name, n.age, n.exp, 'Party Leader',
       coalesce(t.cha, 0), coalesce(t.acu, 0), coalesce(t.gui, 0), coalesce(t.res, 0), coalesce(t.com, 0)
from named n
left join tally t on t.party_id = n.party_id;
