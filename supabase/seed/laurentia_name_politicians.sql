-- One-off repair for Laurentia's prominent politicians. Does two things:
--   1. Creates a named Party Leader for any Laurentia party that has none (e.g.
--      the formateur "Liberal Democratic Party of Laurentia", which had zero
--      politicians — so the World page showed "—" for its head of government).
--   2. Names any existing Laurentia politician whose first/last name is blank.
-- Both draw names from public.nation_names — the same pool the client uses.
--
-- PREREQUISITE: the Laurentia name pool must exist. Run seed/laurentia_names.sql
-- FIRST. If the pool is empty there are no names to draw from, so both statements
-- are safe no-ops — the guard raises a NOTICE so that case is loud, not silent.
--
-- Safe + re-runnable: the insert only fires for parties with no Party Leader, and
-- the update only touches blank names — so nothing is duplicated or overwritten.
-- Laurentia is matched the same loose way as seed/laurentia_names.sql.

do $$
begin
  if not exists (
    select 1 from public.nation_names nn
    join public.nations n on n.id = nn.nation_id
    where n.name ilike '%laurentia%'
  ) then
    raise notice 'Laurentia name pool is EMPTY — run seed/laurentia_names.sql first, then re-run this file.';
  end if;
end $$;

-- 1. Give every leaderless Laurentia party a named Party Leader (age + plausible
--    competencies, mirroring how a player party is seeded with its leader).
insert into public.politicians (party_id, first_name, last_name, age, experience, status, cha, acu, gui, res, com)
select pa.id, fn.name, sn.name, a.age, floor(a.age / 10.0)::int, 'Party Leader',
       floor(random() * 3)::int + 1, floor(random() * 3)::int + 1, floor(random() * 3)::int + 1,
       floor(random() * 3)::int + 1, floor(random() * 3)::int + 1
from public.parties pa
join public.nations n on n.id = pa.nation_id
cross join lateral (select (38 + floor(random() * 23))::int as age) a            -- 38–60
cross join lateral (select name from public.nation_names
                    where nation_id = n.id and kind in ('male', 'female')
                    order by random() limit 1) fn
cross join lateral (select name from public.nation_names
                    where nation_id = n.id and kind = 'surname'
                    order by random() limit 1) sn
where n.name ilike '%laurentia%'
  and not exists (select 1 from public.politicians p2
                  where p2.party_id = pa.id and p2.status = 'Party Leader');

-- 2. Name any remaining blank-named Laurentia politicians.
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
