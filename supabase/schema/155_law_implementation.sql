-- 155 · Law implementation — a passed law takes effect AFTER its implementation time.
-- Depends on: 05 (game_state), 81 (_resolve_proposal), 90 (policies), 92 (_apply_law /
-- _nation_policy_option), 152 (_nation_policy_stat), 60 (advance_tick hook). Run after 152.
--
-- A law no longer flips the nation's policy the moment it passes. On pass the proposer takes the
-- political win (+2 popularity, schema/81) and the change is QUEUED here as "being implemented".
-- When the shared clock reaches implement_tick — pass_tick + the policy's implementation months +
-- ⌈Bureaucracy ÷ 10⌉ — the tick flips the policy (_apply_law: option flip + doorway/once effects) and
-- from that moment every computed ministry stat (Budget Balance, Bureaucracy, Crime, Health, …)
-- reflects the new rung. Nothing changes during the window: the nation reads the old rung until then.

create table if not exists public.nation_law_implementations (
  id             uuid primary key default gen_random_uuid(),
  nation_id      text not null references public.nations (id)  on delete cascade,
  policy_id      uuid not null references public.policies (id) on delete cascade,
  from_option    int  not null,     -- the rung in force when it passed (for the "X → Y" display)
  to_option      int  not null,     -- the rung it becomes when implemented
  passed_tick    int  not null,
  implement_tick int  not null,     -- passed_tick + impl months + ⌈Bureaucracy ÷ 10⌉
  title          text not null,
  created_at     timestamptz not null default now()
);
create index if not exists nli_nation_idx on public.nation_law_implementations (nation_id);
create index if not exists nli_policy_idx on public.nation_law_implementations (policy_id);

alter table public.nation_law_implementations enable row level security;
drop policy if exists "nli_select_all" on public.nation_law_implementations;
create policy "nli_select_all" on public.nation_law_implementations for select using (true);
-- No client writes: only _resolve_proposal (on pass) and the tick (on implement) touch it.

-- Queue a passed law for implementation. implement_tick = now + the policy's implementation months
-- + ⌈Bureaucracy ÷ 10⌉ (the more bureaucratic the state, the slower it lands), at least one tick out.
-- Called from _resolve_proposal (schema/81) when a law measure passes.
create or replace function public._queue_law_implementation(p_nation text, p_policy uuid, p_to int, p_title text)
returns void language plpgsql security definer set search_path = public as $$
declare v_tick int; v_from int; v_impl int; v_bur numeric; v_when int; v_def jsonb;
begin
  select current_tick into v_tick from public.game_state where id;
  v_from := public._nation_policy_option(p_nation, p_policy);
  select definition into v_def from public.policies where id = p_policy;
  v_impl := greatest(0, coalesce((v_def->>'impl')::int, 0));
  v_bur  := public._nation_policy_stat(p_nation, 'Bureaucracy');
  v_when := v_tick + greatest(1, v_impl + ceil(greatest(0, v_bur) / 10.0)::int);
  insert into public.nation_law_implementations (nation_id, policy_id, from_option, to_option, passed_tick, implement_tick, title)
    values (p_nation, p_policy, v_from, p_to, v_tick, v_when, p_title);
end $$;
revoke all on function public._queue_law_implementation(text, uuid, int, text) from public, anon, authenticated;

-- Per-tick: implement every queued law whose clock has come. _apply_law flips the option and applies
-- the one-time doorway/enactment effects; from here the computed stats read the new rung. Each row is
-- isolated so one bad implementation can't abort the rest. Called from _advance_tick (schema/60).
create or replace function public._implement_laws(p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in select id, nation_id, policy_id, to_option, title
             from public.nation_law_implementations where implement_tick <= p_tick loop
    begin
      perform public._apply_law(r.nation_id, r.policy_id, r.to_option);
      insert into public.events (nation_id, party_id, kind, body, game_date)
        values (r.nation_id, null, 'declaration', 'Now in force: ' || r.title || '.', public.current_game_date());
      delete from public.nation_law_implementations where id = r.id;
    exception when others then
      raise warning 'tick %: law implementation % failed — %', p_tick, r.id, sqlerrm;
    end;
  end loop;
end $$;
revoke all on function public._implement_laws(int) from public, anon, authenticated;

notify pgrst, 'reload schema';
