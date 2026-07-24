-- ===========================================================================
-- 316 · Kingdoms — a head of house may claim the empty throne and become Sovereign.
--
-- At the start of the game a realm (heritage) has no Sovereign. The first head of house to Claim the Throne
-- becomes King of the Kingdom of Aldren and gains +7 House Prestige; they keep their existing feudal title
-- and holding. Only one sovereign per realm — a partial unique index enforces it even under a race, and the
-- RPC raises a clean 'throne_taken' when a sovereign already sits. Sovereign standing is public game state
-- (who is king is public); the only writer is the RPC. Depends on: 304, 315. Idempotent. Apply after 315.
-- ===========================================================================

alter table public.kingdoms_leaders
  add column if not exists is_sovereign boolean not null default false;

-- At most one sovereign per realm (heritage).
create unique index if not exists kingdoms_one_sovereign_per_realm
  on public.kingdoms_leaders (heritage) where is_sovereign;

-- Claim the empty throne for the caller's house: become Sovereign (+7 Prestige). Fails if one already sits.
create or replace function public.kingdoms_claim_throne()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid; v_heritage text;
begin
  if auth.uid() is null then raise exception 'unauthenticated'; end if;

  select id, heritage into v_id, v_heritage from public.kingdoms_leaders
    where user_id = auth.uid() order by created_at desc limit 1;
  if v_id is null then raise exception 'no_house'; end if;

  if exists (select 1 from public.kingdoms_leaders where heritage = v_heritage and is_sovereign) then
    raise exception 'throne_taken';
  end if;

  update public.kingdoms_leaders
     set is_sovereign = true,
         resources = jsonb_set(resources, '{prestige}', to_jsonb(coalesce((resources->>'prestige')::int, 0) + 7))
   where id = v_id;
end;
$$;
revoke all on function public.kingdoms_claim_throne() from public, anon;
grant execute on function public.kingdoms_claim_throne() to authenticated;

notify pgrst, 'reload schema';
