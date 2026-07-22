-- ===========================================================================
-- 304 · Kingdoms — a player's leader/house, linked to their account (first slice).
--
-- The /kingdoms pivot: founding a house creates a kingdoms_leaders row tied to the auth user, capturing the
-- chosen heritage (only 'Aldren' is available for now), the house name, and the ranked starting priorities.
-- Reads are public (leaders are shared game presence, like nations); creation goes through
-- kingdoms_found_house so the Aldren-only rule and the six-priority ranking are enforced server-side, not
-- just in the client. Depends on: auth.users. Idempotent. Apply after 303.
-- ===========================================================================

create table if not exists public.kingdoms_leaders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  heritage    text not null,                          -- 'Aldren' (others locked for now)
  house_name  text not null,
  priorities  jsonb not null default '[]'::jsonb,     -- ordered 6: Wealth/Land/People/Ambition/Administration/Prowess
  created_at  timestamptz not null default now()
);
create index if not exists kingdoms_leaders_user_idx on public.kingdoms_leaders(user_id);

alter table public.kingdoms_leaders enable row level security;

-- Read: public (a leader is public game presence). Write: only via the RPC below (no insert/update/delete
-- policy → RLS denies direct client writes; the security-definer RPC is the one door in).
grant select on public.kingdoms_leaders to anon, authenticated;

drop policy if exists "kingdoms_leaders_select_all" on public.kingdoms_leaders;
create policy "kingdoms_leaders_select_all" on public.kingdoms_leaders for select using (true);

-- Found a house for the signed-in user. Validates heritage (Aldren only), a non-empty name, and that
-- priorities is exactly the six attributes, each once, in some order.
create or replace function public.kingdoms_found_house(p_heritage text, p_house_name text, p_priorities jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid; v_name text; v_prio text[];
  v_valid text[] := array['Wealth', 'Land', 'People', 'Ambition', 'Administration', 'Prowess'];
begin
  if auth.uid() is null then raise exception 'unauthenticated'; end if;
  if p_heritage is distinct from 'Aldren' then raise exception 'heritage_unavailable'; end if;   -- only Aldren for now
  v_name := btrim(coalesce(p_house_name, ''));
  if v_name = '' then raise exception 'house_name_required'; end if;

  select array_agg(value) into v_prio from jsonb_array_elements_text(coalesce(p_priorities, '[]'::jsonb));
  if v_prio is null
     or array_length(v_prio, 1) <> 6
     or exists (select 1 from unnest(v_prio) x where x <> all(v_valid))
     or (select count(distinct x) from unnest(v_prio) x) <> 6 then
    raise exception 'invalid_priorities';
  end if;

  insert into public.kingdoms_leaders (user_id, heritage, house_name, priorities)
    values (auth.uid(), 'Aldren', v_name, p_priorities)
  returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.kingdoms_found_house(text, text, jsonb) from public, anon;
grant execute on function public.kingdoms_found_house(text, text, jsonb) to authenticated;

notify pgrst, 'reload schema';
