-- 90 · Policies (authoring storage)
--
-- Admin-authored policies. The whole policy is one JSONB definition per row — the
-- canonical object the admin tool edits. Two kinds, both authored against the
-- ministry-stat vocabulary (POLICY_STATS in policies.js):
--   On/Off (binary): a flat influence cost to switch, each state's own effects —
--     { name, desc, type:'binary', influence, binDefault (0=Off,1=On),
--       binary:[ {name:'Off',effects[]}, {name:'On',effects[]} ] }
--   Spectrum: an ordered ladder of levels A,B,C… —
--     { name, desc, type:'spectrum', influence (BASE to change), impl (BASE months),
--       defaultIdx, spectrum:[ {name,desc,effects[]} … ] }
-- where each effect is a plain { t (stat), v (signed amount) }. A Budget Balance effect may
-- also carry unit:'gdp' to author the amount as a PERCENT OF GDP (else it's a flat amount),
-- so one policy's fiscal cost scales to nation size.
--
-- popRaise (number) is the vote-popularity reaction: a party's popularity swing PER RUNG for
-- voting to RAISE the policy (signed; negative = raising is unpopular). It scales by the rungs
-- moved and flips sign for a drop; voting against is the mirror. Computed on the propose page /
-- bill view (policyVotePopularity in policies.js), not authored per level.
--
-- AUTHOR + STORE ONLY for now: the ministry-stat backend and the level-change engine
-- don't exist yet, so definitions are stored but NOT applied. The effects engine
-- (schema/91) harmlessly ignores POLICY_STATS targets (its case list doesn't match
-- them). Deferred runtime rules, recorded here so they land consistently:
--   · Moving between spectrum levels SUMS each crossed level's effects (A→C = A→B + B→C).
--   · Influence to cross N levels = N × (base + N − 1)  [A→B=base, A→C=2×(base+1)].
--   · Implementation time = base + ceil(Bureaucracy / 10) months.
-- Trade Policy (definition.special = 'trade') is a separate model in its own tab and
-- is unaffected by the above.
--
-- Legacy note: older rows used type 'binary'|'spectrum' with option support[]/oppose[]/
-- identity tags / doorway transitions and {t,v,cad,dur,scale} effects. The new authoring
-- tool no longer writes those fields; any surviving legacy rows still apply through
-- schema/91 until re-authored.
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

-- When the nation's current option for each policy was put in force by a passed law
-- (schema/92 _apply_law): { "<policy_id>": <tick> }. Powers finite-duration tick
-- effects (dur > 0) — applied only for their first dur months after enactment. A
-- policy absent here (default / admin-set baseline) has no active clock, so its timed
-- effects don't fire; "while enacted" effects (dur 0) apply regardless.
alter table public.nations add column if not exists policy_since jsonb not null default '{}'::jsonb;

-- ONE source for a policy definition's option array — the 'spectrum' or 'binary'
-- list, keyed by the policy's own type. Read by the law validator (schema/92) and
-- the effects engine (schema/91); mirrors polOptList() in the admin tool.
create or replace function public._policy_options(p_def jsonb)
returns jsonb language sql immutable as $$
  select p_def->(coalesce(p_def->>'type', 'spectrum'));
$$;

