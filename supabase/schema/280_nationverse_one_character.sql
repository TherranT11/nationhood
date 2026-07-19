-- ===========================================================================
-- 280 · Nationverse: one character per player, permanently.
--
-- Selecting a character locks the player to it: a user may hold at most ONE claimed personality, and
-- claiming is one-way (no unclaim path). Enforced two ways: the claim RPC refuses if the caller already
-- holds a role, and a partial unique index makes it impossible at the DB level even under a race.
-- Depends on: 279 (claimed_by + nationverse_claim_role). Idempotent. Apply after 279.
-- ===========================================================================

-- Hard guard: each user can appear as claimed_by on at most one personality.
create unique index if not exists nationverse_personalities_claimed_by_uidx
  on public.nationverse_personalities (claimed_by) where claimed_by is not null;

-- Redefine the claim RPC to enforce one character per user (first-come, still no overwrite).
create or replace function public.nationverse_claim_role(p_personality uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare v_ok boolean;
begin
  if auth.uid() is null then return false; end if;
  -- Locked to one character: if the caller already holds a role, refuse.
  if exists (select 1 from public.nationverse_personalities where claimed_by = auth.uid()) then
    return false;
  end if;
  update public.nationverse_personalities
     set claimed_by = auth.uid()
   where id = p_personality and claimed_by is null
  returning true into v_ok;
  return coalesce(v_ok, false);
end;
$$;

grant execute on function public.nationverse_claim_role(uuid) to authenticated;

notify pgrst, 'reload schema';
