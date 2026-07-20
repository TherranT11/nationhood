-- ===========================================================================
-- 288 · Nationverse agendas — an authored progression tree for the /backend Agenda Creator.
--
-- Each agenda is one node. The tree is built from parent_id alone (a node knows its parent; children are
-- derived) — one source, no separate edge list. Requirements / hidden_requirements / failures reuse the
-- shared condition (trigger) format; rewards reuse the shared effect format; both stored as jsonb so the
-- future runtime interprets them. Everything else (eligibility, completion rule, unlock condition,
-- visibility, expiration, AI weight) are scalar/jsonb authored fields. Authoring only — no runtime here.
-- Auth reuses is_admin() (schema/10): public read, admin-only write. Depends on: 10, 271. Idempotent.
-- Apply after 287.
-- ===========================================================================

create table if not exists public.nationverse_agendas (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  internal_id         text,
  nation_id           uuid references public.nationverse_nations(id) on delete cascade,   -- null = global
  eligible_roles      jsonb not null default '[]'::jsonb,     -- ["Head of Government", …]
  eligible_parties    jsonb not null default '[]'::jsonb,     -- ["Left", "Center", …]
  description         text,
  parent_id           uuid references public.nationverse_agendas(id) on delete set null,  -- tree edge (children derived)
  tier                int not null default 1,                 -- layout only
  display_order       int not null default 0,                 -- left→right layout
  requirements        jsonb not null default '[]'::jsonb,     -- shared condition format
  completion_rule     text not null default 'ALL',            -- ALL | ANY
  completion_count    int,                                    -- when ANY: how many needed
  rewards             jsonb not null default '[]'::jsonb,     -- shared effect format
  failures            jsonb not null default '[]'::jsonb,     -- shared condition format (any → fail)
  hidden_requirements jsonb not null default '[]'::jsonb,     -- shared condition format (unseen by player)
  unlock_condition    jsonb not null default '{}'::jsonb,     -- {type, target}
  visible_immediately boolean not null default true,
  expiration_months   int,                                    -- null = no limit
  ai_weight           int not null default 50,                -- 0–100
  created_at          timestamptz not null default now()
);
create index if not exists nationverse_agendas_nation_idx on public.nationverse_agendas(nation_id);
create index if not exists nationverse_agendas_parent_idx on public.nationverse_agendas(parent_id);

alter table public.nationverse_agendas enable row level security;

grant select on public.nationverse_agendas to anon, authenticated;
grant insert, update, delete on public.nationverse_agendas to authenticated;

drop policy if exists "nv_agendas_select_all" on public.nationverse_agendas;
create policy "nv_agendas_select_all" on public.nationverse_agendas for select using (true);

drop policy if exists "nv_agendas_insert_admin" on public.nationverse_agendas;
create policy "nv_agendas_insert_admin" on public.nationverse_agendas for insert with check (public.is_admin());

drop policy if exists "nv_agendas_update_admin" on public.nationverse_agendas;
create policy "nv_agendas_update_admin" on public.nationverse_agendas for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "nv_agendas_delete_admin" on public.nationverse_agendas;
create policy "nv_agendas_delete_admin" on public.nationverse_agendas for delete using (public.is_admin());

notify pgrst, 'reload schema';
