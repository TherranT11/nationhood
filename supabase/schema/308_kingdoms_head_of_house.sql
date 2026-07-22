-- ===========================================================================
-- 308 · Kingdoms — Head of House: a title, and a house banner image.
--
-- The Home hall shows the head of house. This adds:
--   leader_title  — the lord's title (defaults to 'Count'; existing houses backfilled by the column default)
--   banner_url    — the house banner image (public URL in the kingdoms-banners bucket; null = none)
-- plus a kingdoms-banners storage bucket (public read, any authenticated user may upload — 2 MB image cap,
-- modeled on wiki-images/105) and kingdoms_set_banner() so a player sets the banner only on their OWN house.
-- Depends on: 304, 307. Idempotent. Apply after 307.
-- ===========================================================================

alter table public.kingdoms_leaders
  add column if not exists leader_title text not null default 'Count',
  add column if not exists banner_url   text;

-- Banner image bucket: public to read, any signed-in player may upload (unique paths under their user id,
-- so no overwrite/delete needed — same shape as wiki-images).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('kingdoms-banners', 'kingdoms-banners', true, 2097152,
        array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do update
  set public = true, file_size_limit = 2097152,
      allowed_mime_types = array['image/png','image/jpeg','image/webp','image/gif'];

drop policy if exists "kingdoms_banners_read" on storage.objects;
create policy "kingdoms_banners_read" on storage.objects for select
  using (bucket_id = 'kingdoms-banners');
drop policy if exists "kingdoms_banners_insert" on storage.objects;
create policy "kingdoms_banners_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'kingdoms-banners');

-- Set the banner on the caller's OWN house (scoped by user_id; null/blank clears it).
create or replace function public.kingdoms_set_banner(p_house uuid, p_url text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'unauthenticated'; end if;
  update public.kingdoms_leaders
     set banner_url = nullif(btrim(coalesce(p_url, '')), '')
   where id = p_house and user_id = auth.uid();
end;
$$;
revoke all on function public.kingdoms_set_banner(uuid, text) from public, anon;
grant execute on function public.kingdoms_set_banner(uuid, text) to authenticated;

notify pgrst, 'reload schema';
