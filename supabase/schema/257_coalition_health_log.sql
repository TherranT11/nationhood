-- ===========================================================================
-- 257 · Coalition Health — log every heart loss (month/year + reason).
--
-- _coalition_health_drop (schema/165) already receives a p_reason for every heart it takes, but a
-- non-fatal loss was silent ("the meter shows it, no separate event"). Record each loss — fatal and
-- non-fatal — in coalition_health_log so the Coalition Health card can list them:
--   "Heart Lost — March, 1986 — a played card".
--
-- One row per heart taken: the game date it happened, the reason, and the hearts remaining after.
-- World-readable (coalition standing is public, like seats/health); written only by the security-definer
-- drop helper. Body of _coalition_health_drop reproduced verbatim from 165 + the two log inserts.
-- Depends on: 165 (_coalition_health_drop), 10 (nations), 60 (governments), 40 (current_game_date).
-- Idempotent. Apply after 165.
-- ===========================================================================

set check_function_bodies = off;

create table if not exists public.coalition_health_log (
  id            uuid primary key default gen_random_uuid(),
  nation_id     text not null references public.nations (id) on delete cascade,
  government_id uuid references public.governments (id) on delete cascade,
  game_date     text not null,           -- the month/year the heart was lost (current_game_date)
  reason        text not null,           -- why (the drop helper's p_reason, e.g. 'a played card')
  hearts_after  int  not null,           -- Coalition Health remaining after this loss (0 = collapse)
  created_tick  int,
  created_at    timestamptz not null default now()
);
create index if not exists coalition_health_log_nation_idx on public.coalition_health_log (nation_id, created_at desc);

alter table public.coalition_health_log enable row level security;
drop policy if exists "coalition_health_log_select_all" on public.coalition_health_log;
create policy "coalition_health_log_select_all" on public.coalition_health_log for select using (true);
-- No client write: only _coalition_health_drop (security definer) inserts.

-- Redefine the drop helper (body from schema/165) to log each heart lost.
create or replace function public._coalition_health_drop(p_nation text, p_n int, p_penalty numeric, p_reason text, p_tick int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_gov public.governments%rowtype; v_new int;
begin
  select * into v_gov from public.governments where nation_id = p_nation and status = 'active';
  if not found or v_gov.coalition_health is null or v_gov.coalition_health <= 0 then return; end if;

  v_new := v_gov.coalition_health - greatest(1, p_n);
  if v_new > 0 then
    update public.governments set coalition_health = v_new where id = v_gov.id;   -- a heart lost; the meter shows it
    insert into public.coalition_health_log (nation_id, government_id, game_date, reason, hearts_after, created_tick)
      values (p_nation, v_gov.id, public.current_game_date(), p_reason, v_new, p_tick);
    return;
  end if;

  -- Last heart gone → the government falls apart.
  update public.governments set coalition_health = 0 where id = v_gov.id;
  insert into public.coalition_health_log (nation_id, government_id, game_date, reason, hearts_after, created_tick)
    values (p_nation, v_gov.id, public.current_game_date(), p_reason, 0, p_tick);
  update public.parties p
     set popularity = public._clamp_pop(public._mod_floor_drop(p_nation, p.archetype, p.popularity, p.popularity - p_penalty))
   where p.nation_id = p_nation and p.in_government;
  update public.nations set next_election_tick = p_tick + 1 where id = p_nation;

  insert into public.events (nation_id, party_id, kind, body, game_date, tone)
    values (p_nation, v_gov.formateur_party_id, 'government',
      p_reason || '. With its last heart of Coalition Health gone, the government of '
      || public._head_of_government_label(p_nation, v_gov.formateur_party_id)
      || ' has fallen apart — every governing party lost ' || trim_scale(p_penalty)
      || '% Party Popularity, and a fresh election will be held next tick.',
      public.current_game_date(), 'neg');
end $$;
revoke all on function public._coalition_health_drop(text, int, numeric, text, int) from public, anon, authenticated;

notify pgrst, 'reload schema';
