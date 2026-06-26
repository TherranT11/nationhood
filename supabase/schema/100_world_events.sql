-- 100 · World Events (admin-authored). World-readable, admin-only writes via is_admin()
-- — the same pattern as crises (schema/99). The whole event is one JSONB definition per
-- row: the canonical object the admin World Events builder edits.
--
-- AUTHORING ONLY for now. Firing world events to nations' event boxes and the per-type
-- player RESOLUTION — a Decision's two choices, a Mutual Agreement's mutual consent +
-- contribution, a Competitive event's secret bidding over three ticks, a Turning Point's
-- instant broadcast to every nation — are a later phase. This file just stores the
-- definitions (and the image bucket the builder uploads art to).
--
-- Depends on: 10 (is_admin). Numbered 100 so it applies after the two-digit files; its
-- only dependency (is_admin, schema/10) is created long before, so the order is safe.
--
--   definition = {
--     name, image (public URL in the world-event-images bucket, or ''), desc,
--     type:  'decision' | 'mutual' | 'competitive' | 'turning_point',
--     scope: 'global' | 'nations',          -- Global hits everyone; nations = an involved set
--     nations: [ nation_id ... ],           -- involved nations (when scope = 'nations')
--     -- type-specific (only the active type's block is meaningful):
--     options:     [ { label, effects:[{t,v}] }, { label, effects:[{t,v}] } ],  -- decision: 2 choices
--     mutual:      { effects:[{t,v}] },                       -- both sides must agree + contribute
--     competitive: { stat, sideA:[nation_id...], sideB:[nation_id...] },  -- secret bids on `stat`
--     turning:     { effects:[{t,v}] }                        -- fires at once, hits every nation
--   }
--   eff = { t (target stat, e.g. 'Order' / 'Budget' / 'Diplomacy'), v (signed value) }

create table if not exists public.world_events (
  id         uuid primary key default gen_random_uuid(),
  definition jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.world_events enable row level security;

drop policy if exists "world_events_select_all"   on public.world_events;
create policy "world_events_select_all"   on public.world_events for select using (true);
drop policy if exists "world_events_insert_admin" on public.world_events;
create policy "world_events_insert_admin" on public.world_events for insert with check (public.is_admin());
drop policy if exists "world_events_update_admin" on public.world_events;
create policy "world_events_update_admin" on public.world_events for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "world_events_delete_admin" on public.world_events;
create policy "world_events_delete_admin" on public.world_events for delete using (public.is_admin());

-- A public bucket for the admin-authored event art. Public read (the image shows to every
-- player when the event fires); writes are admin-only (is_admin, schema/10). Same 2 MB cap
-- and image-only mime list as the other buckets (party-logos / forum-images), enforced by
-- the bucket so a crafted client can't store something larger or non-image.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('world-event-images', 'world-event-images', true, 2097152,
        array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do update
  set public = true, file_size_limit = 2097152,
      allowed_mime_types = array['image/png','image/jpeg','image/webp','image/gif'];

drop policy if exists "world_event_images_read" on storage.objects;
create policy "world_event_images_read" on storage.objects for select
  using (bucket_id = 'world-event-images');
drop policy if exists "world_event_images_insert" on storage.objects;
create policy "world_event_images_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'world-event-images' and public.is_admin());
drop policy if exists "world_event_images_update" on storage.objects;
create policy "world_event_images_update" on storage.objects for update to authenticated
  using      (bucket_id = 'world-event-images' and public.is_admin())
  with check (bucket_id = 'world-event-images' and public.is_admin());
drop policy if exists "world_event_images_delete" on storage.objects;
create policy "world_event_images_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'world-event-images' and public.is_admin());

notify pgrst, 'reload schema';
