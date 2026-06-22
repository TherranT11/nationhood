-- One-off: name Laurentia's currently-unnamed politicians from the Laurentia pool.
--
-- Some Laurentia politicians were created with blank first/last names (they show
-- as "— —"). This fills each blank one with a random first name (male or female)
-- and a surname from public.nation_names — the same pick the client uses when it
-- generates a politician.
--
-- PREREQUISITE: run seed/laurentia_names.sql first so the pool exists. If the pool
-- is empty this is a safe no-op (the LATERAL picks yield no row, so the politician
-- is simply left unchanged — never set to NULL).
--
-- Safe + re-runnable: only touches rows whose first OR last name is blank, so it
-- never overwrites a politician that already has a real name. Laurentia is matched
-- the same loose way as seed/laurentia_names.sql.

update public.politicians pol
set first_name = fn.name,
    last_name  = sn.name
from public.parties pa
join public.nations n on n.id = pa.nation_id,
lateral (select name from public.nation_names
         where nation_id = n.id and kind in ('male', 'female')
         order by random() limit 1) fn,
lateral (select name from public.nation_names
         where nation_id = n.id and kind = 'surname'
         order by random() limit 1) sn
where pol.party_id = pa.id
  and n.name ilike '%laurentia%'
  and (btrim(coalesce(pol.first_name, '')) = '' or btrim(coalesce(pol.last_name, '')) = '');
