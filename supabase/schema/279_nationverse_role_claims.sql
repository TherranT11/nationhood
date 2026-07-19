-- ===========================================================================
-- 279 · Nationverse role claims — a player claims a personality/role on the character page.
--
-- A personality gains `claimed_by` (the auth user who took the role, null = open). The claim happens
-- through a security-definer RPC so the admin-only write policy on nationverse_personalities stays
-- intact: a player can claim an OPEN role (first-come) but cannot overwrite someone else's. claimed_by
-- is publicly readable (existing public-select policy) so the role list can grey out taken roles.
-- Depends on: 272. Idempotent. Apply after 278.
-- ===========================================================================

alter table public.nationverse_personalities
  add column if not exists claimed_by uuid references auth.users(id) on delete set null;

-- Claim an open role for the calling user. Returns true if claimed now, false if it was already taken
-- (or the caller isn't signed in). First-come: only updates when claimed_by is currently null.
create or replace function public.nationverse_claim_role(p_personality uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare v_ok boolean;
begin
  if auth.uid() is null then return false; end if;
  update public.nationverse_personalities
     set claimed_by = auth.uid()
   where id = p_personality and claimed_by is null
  returning true into v_ok;
  return coalesce(v_ok, false);
end;
$$;

grant execute on function public.nationverse_claim_role(uuid) to authenticated;

notify pgrst, 'reload schema';
