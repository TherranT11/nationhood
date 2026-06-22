-- One-off repair: ensure every party (in every nation) has a Party Leader, and
-- give every politician a sensible DISTINCT name from its nation's pool.
--   1. Creates a named Party Leader for any party that has none.
--   2. (Re)names any politician whose name is blank OR is a duplicate shared with
--      another politician in the same nation.
--
-- Step 2 heals an earlier bug: a `order by random() limit 1` in a LATERAL was
-- correlated only to nation_id (constant within a nation), so PostgreSQL evaluated
-- it ONCE and every politician in a nation got the same name (e.g. every Laurentia
-- leader "Charles Marshall"). The pick here is ordered by md5(<row id> || name) —
-- correlated to each row's UNIQUE id, so it's genuinely per-row (and deterministic,
-- hence idempotent). age/stats are hashed off the party id for the same reason.
--
-- Names come from public.nation_names; a nation with no pool is skipped (never a
-- NULL/blank name). Safe + re-runnable: re-running finds no blanks/dupes → no-op.

-- 1. Create a Party Leader for any leaderless party.
insert into public.politicians (party_id, first_name, last_name, age, experience, status, cha, acu, gui, res, com)
select pa.id,
  (select nn.name from public.nation_names nn
   where nn.nation_id = pa.nation_id and nn.kind in ('male', 'female')
   order by md5(pa.id::text || nn.name) limit 1),
  (select nn.name from public.nation_names nn
   where nn.nation_id = pa.nation_id and nn.kind = 'surname'
   order by md5(pa.id::text || 'sn:' || nn.name) limit 1),
  38 + ((hashtext(pa.id::text) & 2147483647) % 23),                         -- age 38–60
  floor((38 + ((hashtext(pa.id::text) & 2147483647) % 23)) / 10.0)::int,    -- experience
  'Party Leader',
  1 + ((hashtext(pa.id::text || 'cha') & 2147483647) % 3),
  1 + ((hashtext(pa.id::text || 'acu') & 2147483647) % 3),
  1 + ((hashtext(pa.id::text || 'gui') & 2147483647) % 3),
  1 + ((hashtext(pa.id::text || 'res') & 2147483647) % 3),
  1 + ((hashtext(pa.id::text || 'com') & 2147483647) % 3)
from public.parties pa
where not exists (select 1 from public.politicians p2 where p2.party_id = pa.id and p2.status = 'Party Leader')
  and exists (select 1 from public.nation_names where nation_id = pa.nation_id and kind in ('male', 'female'))
  and exists (select 1 from public.nation_names where nation_id = pa.nation_id and kind = 'surname');

-- 2. (Re)name blank or duplicate-named politicians, distinctly per row.
update public.politicians pol
set first_name = (select nn.name from public.nation_names nn
                  where nn.nation_id = pa.nation_id and nn.kind in ('male', 'female')
                  order by md5(pol.id::text || nn.name) limit 1),
    last_name  = (select nn.name from public.nation_names nn
                  where nn.nation_id = pa.nation_id and nn.kind = 'surname'
                  order by md5(pol.id::text || 'sn:' || nn.name) limit 1)
from public.parties pa
where pol.party_id = pa.id
  and exists (select 1 from public.nation_names where nation_id = pa.nation_id and kind in ('male', 'female'))
  and exists (select 1 from public.nation_names where nation_id = pa.nation_id and kind = 'surname')
  and ( btrim(coalesce(pol.first_name, '')) = ''
        or btrim(coalesce(pol.last_name, '')) = ''
        or exists (select 1 from public.politicians dup
                   join public.parties dpa on dpa.id = dup.party_id
                   where dpa.nation_id = pa.nation_id and dup.id <> pol.id
                     and dup.first_name = pol.first_name and dup.last_name = pol.last_name) );
