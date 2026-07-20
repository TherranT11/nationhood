-- ===========================================================================
-- 291 · Mark a narrative run finished (first slice of the player-facing runtime).
--
-- A launched narrative run (289) shows in the player's Requires Your Attention. When they finish playing
-- it, the client calls this to set the run 'done' so it leaves their list. Caller can only complete a run
-- assigned to their own claimed character. Depends on: 289 (narrative_runs, nationverse_my_personality).
-- Idempotent. Apply after 290.
-- ===========================================================================

create or replace function public.nationverse_complete_run(p_run uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_me uuid;
begin
  v_me := public.nationverse_my_personality();
  if v_me is null then raise exception 'no_character'; end if;
  update public.nationverse_narrative_runs set status = 'done'
   where id = p_run and personality_id = v_me and status = 'assigned';
  if not found then raise exception 'not_your_run'; end if;
end;
$$;
revoke all on function public.nationverse_complete_run(uuid) from public, anon;
grant execute on function public.nationverse_complete_run(uuid) to authenticated;

notify pgrst, 'reload schema';
