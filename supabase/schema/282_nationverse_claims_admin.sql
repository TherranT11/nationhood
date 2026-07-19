-- ===========================================================================
-- 282 · Admin: view Nationverse role claims (with holder email) from /backend.
--
-- nationverse_list_claims() returns every claimed personality with the holder's email. It is
-- security-definer and gated on is_admin() because auth.users emails are sensitive — non-admins get
-- nothing. RELEASING a claim needs no new function: the existing admin write policy on
-- nationverse_personalities (schema/272) already lets an admin set claimed_by = null directly.
-- Depends on: 10 (is_admin), 271, 272, 279. Idempotent. Apply after 281.
-- ===========================================================================

create or replace function public.nationverse_list_claims()
returns table (id uuid, name text, nation_id uuid, nation_name text, email text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then return; end if;   -- emails are sensitive: admins only
  return query
    select p.id, p.name, p.nation_id, nn.name, u.email::text
    from public.nationverse_personalities p
    join auth.users u on u.id = p.claimed_by
    left join public.nationverse_nations nn on nn.id = p.nation_id
    where p.claimed_by is not null
    order by nn.name nulls last, p.name;
end;
$$;

revoke all on function public.nationverse_list_claims() from public, anon;
grant execute on function public.nationverse_list_claims() to authenticated;

notify pgrst, 'reload schema';
