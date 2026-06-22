-- 97 · Party inactivity (admin review).
-- Depends on: 00 (profiles.email), 10 (is_admin), 20 (parties.last_active_at). Run after 20.
--
-- Inactivity is wall-clock since parties.last_active_at, which _lock_party() (schema/40)
-- stamps on every player action / vote / conviction adoption / proposal. It's DERIVED,
-- never stored — no flag to drift, and any action revives a party automatically. The
-- design: an in-game dormancy warning at 6 days (client-side), eligible for removal at
-- 7. Deletion is ADMIN-REVIEWED here — nothing is removed on a timer.

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

notify pgrst, 'reload schema';
