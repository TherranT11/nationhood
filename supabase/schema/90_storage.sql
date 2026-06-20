-- 90 · Storage: party logo uploads.
-- A public bucket for party crest images. A player may upload/replace/delete only
-- files under a folder named after their own auth uid ('<uid>/...'); everyone can
-- read (the crest is public game data). The 2 MB cap + image-only mime list are
-- enforced by the bucket itself, so a crafted client can't store something larger
-- or non-image. Run after 20 (parties). Depends on: storage schema (built-in).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('party-logos', 'party-logos', true, 2097152,
        array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do update
  set public = true,
      file_size_limit = 2097152,
      allowed_mime_types = array['image/png','image/jpeg','image/webp','image/gif'];

-- storage.objects already has RLS enabled by Supabase. Scope this bucket:
-- read is open; writes are limited to the caller's own '<uid>/' folder.
drop policy if exists "party_logos_read" on storage.objects;
create policy "party_logos_read" on storage.objects for select
  using (bucket_id = 'party-logos');

drop policy if exists "party_logos_insert" on storage.objects;
create policy "party_logos_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'party-logos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "party_logos_update" on storage.objects;
create policy "party_logos_update" on storage.objects for update to authenticated
  using      (bucket_id = 'party-logos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'party-logos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "party_logos_delete" on storage.objects;
create policy "party_logos_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'party-logos' and (storage.foldername(name))[1] = auth.uid()::text);
