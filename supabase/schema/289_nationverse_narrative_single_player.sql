-- ===========================================================================
-- 289 · Narratives become single-player stories. Retires the bilateral (two-player) conversation model.
--
-- A narrative now carries an ordered `sequence` of steps (Action = italic narration, Speech = a named
-- speaker in quotes, each with optional flavor replies) — authored in /backend. It is launched to ONE
-- player, recorded as a run. The old two-player machinery (Ready-to-Begin gate, opening lines posted into
-- a shared chat) is removed: nationverse_launch_narrative(uuid,uuid,uuid) and nationverse_mark_ready are
-- dropped. The player-facing runtime that plays the sequence is a separate future step.
-- Depends on: 277 (narratives), 286 (old launch/mark_ready). Idempotent. Apply after 288.
-- ===========================================================================

alter table public.nationverse_narratives add column if not exists sequence jsonb not null default '[]'::jsonb;

-- Retire the bilateral RPCs (narrative conversations are no longer two-player).
drop function if exists public.nationverse_launch_narrative(uuid, uuid, uuid);
drop function if exists public.nationverse_mark_ready(uuid);

-- One row per narrative launched to a player. The player-facing runtime reads/advances these later.
create table if not exists public.nationverse_narrative_runs (
  id             uuid primary key default gen_random_uuid(),
  narrative_id   uuid not null references public.nationverse_narratives(id) on delete cascade,
  personality_id uuid not null references public.nationverse_personalities(id) on delete cascade,
  status         text not null default 'assigned',   -- assigned | done (runtime fills this in later)
  created_tick   int,
  created_at     timestamptz not null default now()
);
create index if not exists nationverse_narrative_runs_pers_idx on public.nationverse_narrative_runs(personality_id);

alter table public.nationverse_narrative_runs enable row level security;
grant select on public.nationverse_narrative_runs to authenticated;   -- private: a player sees their own; writes are RPC-only

-- A player may read a run assigned to their own claimed character; the admin sees all (to review launches).
drop policy if exists "nv_runs_select_own" on public.nationverse_narrative_runs;
create policy "nv_runs_select_own" on public.nationverse_narrative_runs for select
  using (public.is_admin() or personality_id in (
    select id from public.nationverse_personalities where claimed_by = auth.uid()));

-- Admin assigns a narrative to one (claimed) player. The eventual automatic launch will reuse this insert.
create or replace function public.nationverse_launch_narrative(p_narrative uuid, p_player uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid; v_tick int;
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  if p_narrative is null then raise exception 'no_narrative'; end if;
  if not exists (select 1 from public.nationverse_narratives where id = p_narrative) then raise exception 'no_narrative'; end if;
  if not exists (select 1 from public.nationverse_personalities where id = p_player and claimed_by is not null) then
    raise exception 'player_must_be_claimed';
  end if;
  select current_tick into v_tick from public.game_state limit 1;
  insert into public.nationverse_narrative_runs (narrative_id, personality_id, created_tick)
    values (p_narrative, p_player, v_tick) returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.nationverse_launch_narrative(uuid, uuid) from public, anon;
grant execute on function public.nationverse_launch_narrative(uuid, uuid) to authenticated;   -- is_admin() gate inside

notify pgrst, 'reload schema';
