-- ===========================================================================
-- 169 · Party-delete cooldown — anti-spam on repeatedly deleting and re-founding.
-- Deleting your party the FIRST time is free. The SECOND (and any later) voluntary
-- deletion locks you out of founding a new party for 6 ticks. Admin deletions and
-- the inactivity purge (schema/97) do NOT count — only a player's own delete_party().
--
-- Storage lives on profiles (one row per user, survives the party it counts): a
-- running deletion count and the tick a new party may be founded again.
--
-- Depends on: 00 (profiles), 05 (game_state.current_tick), 20 (parties + its RLS).
-- Apply in the Supabase SQL Editor. Idempotent.
-- ===========================================================================

alter table public.profiles add column if not exists party_deletions      int not null default 0;
alter table public.profiles add column if not exists party_new_until_tick  int;   -- null = no cooldown

-- Delete the caller's own party (cascade removes its politicians / recruit drive / events)
-- and record the deletion. The 2nd voluntary deletion onward stamps a 6-tick cooldown on
-- founding again. Security definer so the row delete + profile bump happen atomically as one
-- authored action; RLS still scopes it to the caller (user_id = auth.uid()). Replaces the
-- client's direct DELETE. Returns { deleted, deletions, until } — until is the cooldown tick
-- when one is now in force, else null.
create or replace function public.delete_party()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid; v_pid uuid; v_tick int; v_count int; v_until int;
begin
  v_uid := auth.uid();
  if v_uid is null then raise exception 'Not signed in.'; end if;

  select id into v_pid from public.parties where user_id = v_uid;
  if v_pid is null then return jsonb_build_object('deleted', false); end if;   -- nothing to delete

  delete from public.parties where id = v_pid;   -- FKs cascade the rest

  select current_tick into v_tick from public.game_state where id;
  update public.profiles
     set party_deletions = coalesce(party_deletions, 0) + 1,
         -- 2nd deletion onward: lock new-party creation for 6 ticks (a fresh window each time).
         party_new_until_tick = case when coalesce(party_deletions, 0) + 1 >= 2
                                     then v_tick + 6 else party_new_until_tick end
   where id = v_uid
   returning party_deletions, party_new_until_tick into v_count, v_until;

  return jsonb_build_object('deleted', true, 'deletions', v_count,
                            'until', case when v_until > v_tick then v_until else null end);
end $$;
grant execute on function public.delete_party() to authenticated;

-- May the caller found a new party right now? True unless a delete cooldown is still in the
-- future. Security definer so the RLS INSERT check can read game_state + the caller's profile
-- without granting the client direct select on them. ONE source for the gate — the party-creation
-- page reads the same figures to show the countdown, but this is the enforced guard.
create or replace function public._party_create_allowed()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select party_new_until_tick from public.profiles where id = auth.uid()), 0)
       <= coalesce((select current_tick from public.game_state where id), 0);
$$;
grant execute on function public._party_create_allowed() to authenticated, anon;

-- Gate party creation on the cooldown. Re-create the INSERT policy from schema/20 with the extra
-- check (it lives here, not in 20, because party_new_until_tick is added above — after 20 runs).
drop policy if exists "parties_insert_own" on public.parties;
create policy "parties_insert_own" on public.parties for insert
  with check (auth.uid() = user_id and public._party_create_allowed());

notify pgrst, 'reload schema';
