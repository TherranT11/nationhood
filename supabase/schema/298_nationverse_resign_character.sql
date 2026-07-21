-- ===========================================================================
-- 298 · Let a player resign their own Nationverse character.
--
-- The claim write policy on nationverse_personalities (272) is admin-only, and claiming goes through the
-- security-definer nationverse_claim_role (279–281). This adds the inverse for the player themselves:
-- nationverse_resign_character() clears claimed_by on the caller's OWN claimed personality (scoped to
-- claimed_by = auth.uid(), so nobody can release someone else's role). After it, the player has no character
-- and the /nations roster lets them (or anyone) claim a role again. Depends on: 279 (claimed_by).
-- Idempotent. Apply after 297.
-- ===========================================================================

create or replace function public.nationverse_resign_character()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'unauthenticated'; end if;
  update public.nationverse_personalities set claimed_by = null where claimed_by = auth.uid();
end;
$$;
revoke all on function public.nationverse_resign_character() from public, anon;
grant execute on function public.nationverse_resign_character() to authenticated;

notify pgrst, 'reload schema';
