-- ===========================================================================
-- 234 · Party stance — the faction position on the regime ladder, and the move action.
--
-- The stance ladder on the Party page was display-only (a hardcoded centre). This stores a
-- party's actual position and lets it move one step for 5 Action Points. Positions are an INDEX
-- into the 7-notch ladder (schema-agnostic across the democracy/autocracy tracks):
--   0..2 = the three "left/hardline" rungs, 3 = centre (Apparatchik/Opportunist), 4..6 = "reform".
-- For now only the two adjacent rungs are reachable — index 2 (A1 Hardliner) and index 4 (Ref1
-- Technocrat) — so stance is clamped to [2,4]; the outer rungs stay locked until their abilities exist.
--
-- Autocracy only for now: the A1/Ref1 abilities (schema/235-236) are autocracy-track; democracy
-- nations keep the read-only ladder. move_stance gates on regime_type server-side.
--
-- Depends on: 20 (parties), 40 (_lock_party / _spend_action_point / events), 10 (nations.economy).
-- Idempotent. Apply after 233.
-- ===========================================================================

set check_function_bodies = off;

-- Ladder index; 3 = centre. Reachable range is [2,4] for now (see move_stance).
alter table public.parties add column if not exists stance int not null default 3;

-- Move the caller's party one rung along the ladder for 5 Action Points. p_dir is 'hardline'
-- (toward index 2) or 'reform' (toward index 4). Server-authoritative: autocracy-gated, bounded
-- to the two reachable rungs, and the 5-AP cost is charged atomically (a raise rolls the whole
-- move back, so a failed/blocked move never spends AP).
create or replace function public.move_stance(p_dir text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_party public.parties%rowtype; v_regime text; v_cur int; v_target int; v_name text; v_i int;
begin
  v_party := public._lock_party();
  select coalesce(n.economy->>'regime_type', '') into v_regime from public.nations n where n.id = v_party.nation_id;
  if v_regime <> 'autocracy' then raise exception 'Party stance moves are only available under an autocracy.'; end if;

  v_cur := coalesce(v_party.stance, 3);
  v_target := case when p_dir = 'reform' then v_cur + 1 when p_dir = 'hardline' then v_cur - 1 else null end;
  if v_target is null then raise exception 'Pick a direction.'; end if;
  if v_target < 2 or v_target > 4 then
    raise exception 'That rung is locked — you can only reach the Hardliner or Technocrat stance for now.';
  end if;

  if coalesce(v_party.action_points, 0) < 5 then raise exception 'Moving your stance costs 5 Action Points.'; end if;
  for v_i in 1 .. 5 loop perform public._spend_action_point(v_party.id); end loop;

  update public.parties set stance = v_target where id = v_party.id;
  v_name := case v_target when 2 then 'Hardliner' when 4 then 'Technocrat' else 'Apparatchik' end;
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_party.nation_id, v_party.id, 'party',
            v_party.name || ' shifted its line — now ' || v_name || '.', public.current_game_date());
  return jsonb_build_object('ok', true, 'stance', v_target, 'name', v_name);
end $$;
grant execute on function public.move_stance(text) to authenticated;

notify pgrst, 'reload schema';
