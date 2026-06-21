-- 90 · Policies (authoring storage)
--
-- Admin-authored policies. Stage 1 stores the whole policy as one JSONB
-- definition per row — the canonical object the admin tool edits:
--   { name, desc, type ('binary'|'spectrum'), defaultIdx, binDefault,
--     binary:[ {name,desc,support[],oppose[],effects[]} x2 ],
--     spectrum:[ {name,desc,support[],oppose[],effects[]} ... ] }
-- where each effect is { t (target), v (value), cad ('once'|'tick'), dur, scale }.
--
-- Public read; admin-only write — same is_admin() pattern as the modifier tables
-- (schema/70). Per-nation policy state and the effects engine arrive in later
-- stages; this file only adds the authoring store.
create table if not exists public.policies (
  id         uuid primary key default gen_random_uuid(),
  definition jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.policies enable row level security;

drop policy if exists "pol_select_all"   on public.policies;
create policy "pol_select_all"   on public.policies for select using (true);
drop policy if exists "pol_insert_admin" on public.policies;
create policy "pol_insert_admin" on public.policies for insert with check (public.is_admin());
drop policy if exists "pol_update_admin" on public.policies;
create policy "pol_update_admin" on public.policies for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "pol_delete_admin" on public.policies;
create policy "pol_delete_admin" on public.policies for delete using (public.is_admin());

-- Per-nation policy state (stage 2). The admin sets each nation's starting
-- option here; players change it later via proposals. Stored as a jsonb map on
-- the nation row — same shape/precedent as nations.declarations:
--   { "<policy_id>": <option_idx> }
-- A policy absent from the map falls back to its own default (spectrum.defaultIdx
-- / binDefault), so a newly-created policy applies its default to every nation
-- with no backfill. nations RLS already covers this column (public read,
-- admin-only write — schema/10).
alter table public.nations add column if not exists policies jsonb not null default '{}'::jsonb;

