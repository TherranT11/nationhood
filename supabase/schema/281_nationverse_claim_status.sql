-- ===========================================================================
-- 281 · nationverse_claim_role returns a STATUS string so the UI can explain why a claim failed.
--
-- Previously it returned a bare boolean, so the client couldn't tell "role already taken" from
-- "you already have a character" (a player is locked to one). Now it returns one of:
--   'claimed'          — success, the caller now holds this role
--   'has_character'    — the caller already holds a role (locked to it)
--   'taken'            — this role was already claimed by someone else
--   'unauthenticated'  — no signed-in user
-- Same first-come, one-character-per-player rules as 279/280. Return type changes, so the old function
-- is dropped first. Depends on: 279, 280. Idempotent. Apply after 280.
-- ===========================================================================

drop function if exists public.nationverse_claim_role(uuid);

create function public.nationverse_claim_role(p_personality uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare v_ok boolean;
begin
  if auth.uid() is null then return 'unauthenticated'; end if;
  if exists (select 1 from public.nationverse_personalities where claimed_by = auth.uid()) then
    return 'has_character';
  end if;
  update public.nationverse_personalities
     set claimed_by = auth.uid()
   where id = p_personality and claimed_by is null
  returning true into v_ok;
  return case when coalesce(v_ok, false) then 'claimed' else 'taken' end;
end;
$$;

grant execute on function public.nationverse_claim_role(uuid) to authenticated;

notify pgrst, 'reload schema';
