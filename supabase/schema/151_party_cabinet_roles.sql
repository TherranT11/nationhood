-- 151 · Party cabinet roles (read helper for the messaging recipient picker)
--
-- The set-returning sibling of _party_holds_ministry (schema/114): for every party that
-- holds a cabinet portfolio in its nation's ACTIVE government, one (party_id, ministry)
-- row. Same rule as that helper — an explicit appointment (cabinet_appointments) wins,
-- else a fulfilled ministry promise (a DONE government_agenda 'ministry' row) whose
-- portfolio hasn't since been given an explicit appointment. ONE source for "who holds
-- ministry X", mirrored here so the Inbox compose picker can tag a whole list of parties
-- in one read (each party shows its ministry, or "Opposition" when it isn't in government).
--
-- Returns only party_id + ministry, both already public (the cabinet is shown on the
-- Government page), so a plain authenticated grant is safe.
create or replace function public.party_cabinet_roles()
returns table(party_id uuid, ministry text)
language sql stable security definer set search_path = public as $$
  select p.party_id, ca.ministry
    from public.cabinet_appointments ca
    join public.governments g on g.id = ca.government_id and g.status = 'active'
    join public.politicians p on p.id = ca.politician_id
  union
  select p.party_id, ga.params->>'ministry'
    from public.government_agenda ga
    join public.governments g on g.id = ga.government_id and g.status = 'active'
    join public.politicians p on p.id = nullif(ga.params->>'minister_id', '')::uuid
   where ga.type = 'ministry' and ga.status = 'done'
     and ga.params->>'ministry' is not null
     and not exists (select 1 from public.cabinet_appointments ca2
                       where ca2.government_id = g.id and ca2.ministry = ga.params->>'ministry');
$$;
revoke all on function public.party_cabinet_roles() from public, anon;
grant execute on function public.party_cabinet_roles() to authenticated;

notify pgrst, 'reload schema';
