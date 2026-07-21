-- ===========================================================================
-- 299 · Self-service account deletion (whole account, all games).
--
-- delete_my_account() deletes the caller's auth.users row. Everything the account owns is removed by the
-- schema's existing ON DELETE rules — no per-table bookkeeping here (one source: the FK graph):
--   profiles (00), parties (20) → cascade, taking their own cascade children with them;
--   wiki_articles.author_id (105), nationverse_personalities.claimed_by (279) → set null.
-- Audited: every FK that fires during a user delete is CASCADE or SET NULL; the only FKs without an
-- ON DELETE clause point at world tables (nations, forum_boards) that a user delete never removes, so
-- nothing blocks the cascade. The whole thing runs in one transaction — a failure rolls back cleanly, so
-- there is never a partially-deleted account.
--
-- Security definer so it can reach auth.users (owned by the privileged migration role); scoped to
-- auth.uid() so a caller can only delete THEIR OWN account. Irreversible — the client gates it behind a
-- typed confirmation. Depends on: 00, 20 (the cascade FKs). Idempotent. Apply after 298.
-- ===========================================================================

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'unauthenticated'; end if;
  delete from auth.users where id = auth.uid();   -- cascades across the account's data (see header)
end;
$$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

notify pgrst, 'reload schema';
