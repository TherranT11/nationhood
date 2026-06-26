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

-- ===========================================================================
-- World Event RUNTIME — Phase 1: firing + Turning Point + Decision (no automation).
-- An admin FIRES a saved event: it snapshots the definition into an instance and drops a
-- notice into each target nation's event box. A Turning Point applies its effects to every
-- nation at once and resolves immediately. A Decision stays open for each target nation's
-- leader to choose one of two options, whose effects then apply to that nation. Mutual
-- Agreement + Competitive are NOT playable yet — their contribution / secret-bid mechanics
-- and the 3-tick auto-resolve (which would hook advance_tick) are a later, opt-in pass.
-- Effects ride _apply_policy_effect (schema/91) — the one clamp source, same as crises.
-- ===========================================================================

-- A fired world event. The definition is SNAPSHOT at fire time, so editing the source
-- world_events row later never changes a live instance (same stance as proposals).
create table if not exists public.world_event_instances (
  id             uuid primary key default gen_random_uuid(),
  world_event_id uuid references public.world_events (id) on delete set null,
  definition     jsonb not null,
  status         text  not null default 'active',   -- active | resolved
  fired_tick     int,
  created_at     timestamptz not null default now()
);
create index if not exists world_event_instances_status_idx on public.world_event_instances (status);

-- One row per (instance, nation) that has answered a Decision. The option's effects were
-- applied when the row was written; this just records the pick and bars a second answer.
create table if not exists public.world_event_choices (
  instance_id uuid not null references public.world_event_instances (id) on delete cascade,
  nation_id   text not null references public.nations (id) on delete cascade,
  option_idx  int  not null,
  party_id    uuid references public.parties (id) on delete set null,   -- who chose
  created_at  timestamptz not null default now(),
  primary key (instance_id, nation_id)
);

alter table public.world_event_instances enable row level security;
alter table public.world_event_choices   enable row level security;
-- World-readable (the world stage is public); NO client writes — only the RPCs below touch them.
drop policy if exists "wei_select_all" on public.world_event_instances;
create policy "wei_select_all" on public.world_event_instances for select using (true);
drop policy if exists "wec_select_all" on public.world_event_choices;
create policy "wec_select_all" on public.world_event_choices for select using (true);

-- Apply an array of authored {t,v} effects to a nation through the one clamp source.
create or replace function public._apply_we_effects(p_nation text, p_effects jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare v_eff jsonb;
begin
  for v_eff in select value from jsonb_array_elements(coalesce(p_effects, '[]'::jsonb)) loop
    perform public._apply_policy_effect(p_nation, jsonb_build_object('t', v_eff->>'t', 'v', v_eff->'v'));
  end loop;
end $$;
revoke all on function public._apply_we_effects(text, jsonb) from public, anon, authenticated;

-- The LIVE target nations of an instance — ONE source, used by both firing and resolution:
-- a global event or a Turning Point hits every live nation; otherwise the authored involved
-- set, live only (dormant nations are out of play).
create or replace function public._we_targets(p_def jsonb)
returns text[] language sql stable security definer set search_path = public as $$
  select case when p_def->>'type' = 'turning_point' or p_def->>'scope' = 'global'
              then (select array_agg(id) from public.nations where coalesce(dormant,false) = false)
              else (select array_agg(e.value) from jsonb_array_elements_text(coalesce(p_def->'nations','[]'::jsonb)) as e(value)
                      join public.nations n on n.id = e.value and coalesce(n.dormant,false) = false) end;
$$;

-- Resolve a Decision instance once every live target nation has answered.
create or replace function public._maybe_resolve_we(p_instance uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_def jsonb; v_targets int; v_answered int;
begin
  select definition into v_def from public.world_event_instances where id = p_instance;
  if v_def is null then return; end if;
  v_targets := coalesce(array_length(public._we_targets(v_def), 1), 0);
  select count(*) into v_answered from public.world_event_choices where instance_id = p_instance;
  if v_targets > 0 and v_answered >= v_targets then
    update public.world_event_instances set status = 'resolved' where id = p_instance;
  end if;
end $$;
revoke all on function public._maybe_resolve_we(uuid) from public, anon, authenticated;

-- Admin: fire a saved world event now. Snapshots the definition, drops a notice into each
-- live target nation's box; a Turning Point also applies its effects everywhere and resolves
-- at once. Decision/Turning Point only in Phase 1.
create or replace function public.world_event_fire(p_event uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_def jsonb; v_type text; v_name text; v_iid uuid; v_tick int;
  v_targets text[]; v_nat text; v_body text;
begin
  if not public.is_admin() then raise exception 'Admin only.'; end if;
  select definition into v_def from public.world_events where id = p_event;
  if v_def is null then raise exception 'No such world event.'; end if;
  v_type := v_def->>'type'; v_name := coalesce(nullif(v_def->>'name',''), 'A world event');
  if v_type not in ('decision', 'turning_point', 'mutual') then
    raise exception 'Competitive events aren’t playable yet — they come in a later pass.';
  end if;
  select current_tick into v_tick from public.game_state where id;

  v_targets := public._we_targets(v_def);
  if v_targets is null or array_length(v_targets, 1) is null then raise exception 'No live target nations for this event.'; end if;

  insert into public.world_event_instances (world_event_id, definition, status, fired_tick)
    values (p_event, v_def, case when v_type = 'turning_point' then 'resolved' else 'active' end, v_tick)
    returning id into v_iid;

  v_body := v_name || (case when coalesce(v_def->>'desc','') <> '' then ' — ' || (v_def->>'desc') else '' end);
  foreach v_nat in array v_targets loop
    if v_type = 'turning_point' then
      perform public._apply_we_effects(v_nat, v_def->'turning'->'effects');
      insert into public.events (nation_id, kind, body, game_date) values (v_nat, 'world_event', v_body, public.current_game_date());
    else
      insert into public.events (nation_id, kind, body, game_date)
        values (v_nat, 'world_event',
                v_body || (case when v_type = 'mutual' then ' — an agreement awaits in World Events.' else ' — a decision awaits in World Events.' end),
                public.current_game_date());
    end if;
  end loop;

  return jsonb_build_object('instance', v_iid, 'type', v_type, 'targets', array_length(v_targets, 1));
end $$;
grant execute on function public.world_event_fire(uuid) to authenticated;

-- Player: a nation's leader answers a Decision. No action cost (it's a one-off world prompt,
-- not a leader action). Applies the chosen option's effects to the caller's nation, records
-- the pick (one per nation), and resolves the instance once all targets have answered.
create or replace function public.world_event_choose(p_instance uuid, p_option int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_party public.parties%rowtype; v_inst public.world_event_instances%rowtype;
  v_def jsonb; v_opt jsonb; v_label text; v_nname text;
begin
  v_party := public._lock_party();   -- caller's party + nation (no action cost)
  select * into v_inst from public.world_event_instances where id = p_instance for update;
  if not found then raise exception 'That event is gone.'; end if;
  if v_inst.status <> 'active' then raise exception 'That event has closed.'; end if;
  v_def := v_inst.definition;
  if v_def->>'type' <> 'decision' then raise exception 'That event is not a decision.'; end if;

  -- The caller's nation must be in scope (global → everyone; else the involved set).
  if (v_def->>'scope') <> 'global' and not ((v_def->'nations') ? v_party.nation_id) then
    raise exception 'This decision does not involve your nation.';
  end if;
  if exists (select 1 from public.world_event_choices where instance_id = p_instance and nation_id = v_party.nation_id) then
    raise exception 'Your nation has already decided.';
  end if;

  v_opt := v_def->'options'->p_option;
  if v_opt is null then raise exception 'No such option.'; end if;
  v_label := coalesce(nullif(v_opt->>'label',''), 'an option');

  insert into public.world_event_choices (instance_id, nation_id, option_idx, party_id)
    values (p_instance, v_party.nation_id, p_option, v_party.id);
  perform public._apply_we_effects(v_party.nation_id, v_opt->'effects');

  select name into v_nname from public.nations where id = v_party.nation_id;
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_party.nation_id, v_party.id, 'world_event',
            coalesce(nullif(v_def->>'name',''),'A world event') || ' — ' || coalesce(v_nname, v_party.nation_id) || ' chose: ' || v_label || '.',
            public.current_game_date());

  perform public._maybe_resolve_we(p_instance);
  return jsonb_build_object('ok', true, 'chose', v_label);
end $$;
grant execute on function public.world_event_choose(uuid, int) to authenticated;

-- ---------------------------------------------------------------------------
-- Mutual Agreement: every involved nation must agree before the deal goes through. Agreeing
-- commits a nation to the CONTRIBUTION (its cost) — "a player cannot claim to agree without
-- contributing"; the BENEFIT (mutual gain) and the contribution are applied to ALL involved
-- nations together only when the last one agrees. An agreement nobody completes costs nobody
-- (the spec's "it is assumed they do not act upon it"). No automation, no action cost.
--   definition.mutual = { contribution:[{t,v}] (each side pays), effects:[{t,v}] (each side gains) }
-- ---------------------------------------------------------------------------
create table if not exists public.world_event_agreements (
  instance_id uuid not null references public.world_event_instances (id) on delete cascade,
  nation_id   text not null references public.nations (id) on delete cascade,
  party_id    uuid references public.parties (id) on delete set null,   -- who agreed
  created_at  timestamptz not null default now(),
  primary key (instance_id, nation_id)
);
alter table public.world_event_agreements enable row level security;
drop policy if exists "wea_select_all" on public.world_event_agreements;
create policy "wea_select_all" on public.world_event_agreements for select using (true);

create or replace function public.world_event_agree(p_instance uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_party public.parties%rowtype; v_inst public.world_event_instances%rowtype; v_def jsonb;
  v_targets text[]; v_agreed int; v_need int; v_nat text; v_nname text;
begin
  v_party := public._lock_party();   -- caller's party + nation (no action cost)
  select * into v_inst from public.world_event_instances where id = p_instance for update;
  if not found then raise exception 'That event is gone.'; end if;
  if v_inst.status <> 'active' then raise exception 'That agreement has closed.'; end if;
  v_def := v_inst.definition;
  if v_def->>'type' <> 'mutual' then raise exception 'That event is not an agreement.'; end if;
  if (v_def->>'scope') <> 'global' and not ((v_def->'nations') ? v_party.nation_id) then
    raise exception 'This agreement does not involve your nation.';
  end if;
  if exists (select 1 from public.world_event_agreements where instance_id = p_instance and nation_id = v_party.nation_id) then
    raise exception 'Your nation has already agreed.';
  end if;

  insert into public.world_event_agreements (instance_id, nation_id, party_id)
    values (p_instance, v_party.nation_id, v_party.id);
  select name into v_nname from public.nations where id = v_party.nation_id;
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_party.nation_id, v_party.id, 'world_event',
            coalesce(nullif(v_def->>'name',''),'A world event') || ' — ' || coalesce(v_nname, v_party.nation_id) || ' agreed to the terms.',
            public.current_game_date());

  -- The deal seals only when EVERY involved nation has agreed: each pays the contribution
  -- and gains the benefit, then the instance resolves.
  v_targets := public._we_targets(v_def);
  v_need := coalesce(array_length(v_targets, 1), 0);
  select count(*) into v_agreed from public.world_event_agreements where instance_id = p_instance;
  if v_need > 0 and v_agreed >= v_need then
    foreach v_nat in array v_targets loop
      perform public._apply_we_effects(v_nat, v_def->'mutual'->'contribution');
      perform public._apply_we_effects(v_nat, v_def->'mutual'->'effects');
      insert into public.events (nation_id, kind, body, game_date)
        values (v_nat, 'world_event', coalesce(nullif(v_def->>'name',''),'A world event') || ' — the agreement is sealed; all sides contribute and gain.', public.current_game_date());
    end loop;
    update public.world_event_instances set status = 'resolved' where id = p_instance;
    return jsonb_build_object('ok', true, 'sealed', true);
  end if;
  return jsonb_build_object('ok', true, 'sealed', false, 'agreed', v_agreed, 'need', v_need);
end $$;
grant execute on function public.world_event_agree(uuid) to authenticated;

notify pgrst, 'reload schema';
