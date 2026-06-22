-- One-off repair: ensure every party (in every nation) has a named Party Leader,
-- and name any blank-named politician. Names are drawn from each nation's own pool
-- in public.nation_names — the same pick the client uses.
--
-- PREREQUISITE: seed each nation's pool first (the <nation>_names.sql files). A
-- nation whose pool is empty is simply skipped — the LATERAL picks yield no row,
-- so nothing is inserted/updated for it (never a NULL/blank name).
--
-- Safe + re-runnable: the insert only fires for parties with no Party Leader, and
-- the update only touches blank names — nothing is duplicated or overwritten.

-- 1. Give every leaderless party a named Party Leader (age + plausible stats,
--    mirroring how a player party is seeded with its leader at creation).
insert into public.politicians (party_id, first_name, last_name, age, experience, status, cha, acu, gui, res, com)
select pa.id, fn.name, sn.name, a.age, floor(a.age / 10.0)::int, 'Party Leader',
       floor(random() * 3)::int + 1, floor(random() * 3)::int + 1, floor(random() * 3)::int + 1,
       floor(random() * 3)::int + 1, floor(random() * 3)::int + 1
from public.parties pa
cross join lateral (select (38 + floor(random() * 23))::int as age) a            -- 38–60
cross join lateral (select name from public.nation_names
                    where nation_id = pa.nation_id and kind in ('male', 'female')
                    order by random() limit 1) fn
cross join lateral (select name from public.nation_names
                    where nation_id = pa.nation_id and kind = 'surname'
                    order by random() limit 1) sn
where not exists (select 1 from public.politicians p2
                  where p2.party_id = pa.id and p2.status = 'Party Leader');

-- 2. Name any remaining blank-named politicians.
update public.politicians pol
set first_name = fn.name,
    last_name  = sn.name
from public.parties pa,
lateral (select name from public.nation_names
         where nation_id = pa.nation_id and kind in ('male', 'female')
         order by random() limit 1) fn,
lateral (select name from public.nation_names
         where nation_id = pa.nation_id and kind = 'surname'
         order by random() limit 1) sn
where pol.party_id = pa.id
  and (btrim(coalesce(pol.first_name, '')) = '' or btrim(coalesce(pol.last_name, '')) = '');
