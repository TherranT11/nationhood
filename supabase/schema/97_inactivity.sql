-- 97 · Party inactivity (admin review).
-- Depends on: 00 (profiles.email), 10 (is_admin), 20 (parties.last_active_at). Run after 20.
--
-- Inactivity is wall-clock since parties.last_active_at, which _lock_party() (schema/40)
-- stamps on every player action / vote / conviction adoption / proposal. It's DERIVED,
-- never stored — no flag to drift, and any action revives a party automatically. The
-- ladder (mirrors util.js): an early nudge at 6 days (client), INACTIVE at 7 (sits out
-- elections — resolve_election, schema/60), and DELETED at 21 — the tick calls
-- _purge_inactive_parties() below, which removes the party and its politicians and frees
-- the nation slot. The admin list/delete remain for manual review at any point.

-- The review list: every party with its owner's email and last-active time, oldest
-- first. Reads profiles (own-read RLS) via security definer, so the email is exposed
-- ONLY to the admin — the is_admin() gate returns an empty set to anyone else.
create or replace function public.admin_inactivity_list()
returns table(party_id uuid, party_name text, owner_email text, last_active_at timestamptz)
language sql security definer set search_path = public stable as $$
  select p.id, p.name, pr.email, p.last_active_at
  from public.parties p
  left join public.profiles pr on pr.id = p.user_id
  where public.is_admin()
  order by p.last_active_at asc;
$$;
grant execute on function public.admin_inactivity_list() to authenticated;

-- Admin-only hard delete of a party. FKs cascade (politicians, convictions, events,
-- proposals, votes, negotiations) and the government's formateur is set null; the seats
-- empty to Vacant and any government re-resolves at the next election (existing
-- behaviour). Not granted broadly — gated by is_admin() inside.
create or replace function public.admin_delete_party(p_party uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admin only.'; end if;
  delete from public.parties where id = p_party;
end $$;
grant execute on function public.admin_delete_party(uuid) to authenticated;

-- Auto-purge: delete every party idle past the deletion window (21 days — mirrors
-- INACTIVE_DELETE_DAYS, util.js). The party's politicians/votes/convictions/etc. cascade and the
-- government's formateur drops to null (same as admin_delete_party); seats empty to Vacant and the
-- government re-resolves at the next election. A feed line in each freed nation marks the opening.
-- Called once per tick from _advance_tick (schema/60). Internal — never a client entry point.
create or replace function public._purge_inactive_parties()
returns int language plpgsql security definer set search_path = public as $$
declare v_p record; v_n int := 0;
begin
  for v_p in select id, name, nation_id from public.parties where last_active_at < now() - interval '21 days' loop
    delete from public.parties where id = v_p.id;
    insert into public.events (nation_id, party_id, kind, body, game_date, tone)
      values (v_p.nation_id, null, 'party',
              'The ' || v_p.name || ' has dissolved through inactivity — a place opens in the assembly.',
              public.current_game_date(), 'warn');
    v_n := v_n + 1;
  end loop;
  return v_n;
end $$;
revoke all on function public._purge_inactive_parties() from public, anon, authenticated;

notify pgrst, 'reload schema';
