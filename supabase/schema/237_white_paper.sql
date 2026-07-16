-- ===========================================================================
-- 237 · White Paper — the Ref1 Technocrat active ability (stat shift; budget-cut deferred).
--
-- A Technocrat (stance index 4, schema/234) can publish a White Paper: pick a policy, pick one of
-- the stats that policy affects, and shift the nation's value of that stat by ±2, for 2 Action
-- Points. Two uses total (parties.white_papers_left). Server-validated: autocracy + Technocrat,
-- the stat must genuinely be one of the policy's effects, and derived/money stats (Budget Balance,
-- Tax Burden) are not shiftable this way.
--
-- SCOPE NOTE: the spec also cuts the policy's budget cost 20%. That needs a per-nation/per-policy
-- budget-offset term that _nation_budget_balance does not have today (policy cost is computed
-- globally). Deferred to a dedicated follow-up; this ships the stat shift + the 2-use economy.
--
-- The stat shift routes through _apply_card_stat (schema/176) — the same primitive card stat_up/down
-- uses — so real-backed (Growth/Prosperity/Rule of Law) and display stats both land correctly.
--
-- Depends on: 234 (parties.stance), 90 (policies), 176 (_apply_card_stat), 40 (_lock_party /
--   _spend_action_point / events). Idempotent. Apply after 236.
-- ===========================================================================

set check_function_bodies = off;

alter table public.parties add column if not exists white_papers_left int not null default 2;

create or replace function public.white_paper(p_policy uuid, p_stat text, p_dir int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_party public.parties%rowtype; v_regime text; v_stat text; v_i int;
begin
  v_party := public._lock_party();
  select coalesce(n.economy->>'regime_type', '') into v_regime from public.nations n where n.id = v_party.nation_id;
  if v_regime <> 'autocracy' then raise exception 'The White Paper is a Technocrat move, available only under an autocracy.'; end if;
  if coalesce(v_party.stance, 3) <> 4 then raise exception 'Only a Technocrat (Ref1) can publish a White Paper.'; end if;
  if coalesce(v_party.white_papers_left, 0) < 1 then raise exception 'You have no White Papers left.'; end if;
  if p_dir not in (-1, 1) then raise exception 'Pick increase or decrease.'; end if;

  v_stat := btrim(coalesce(p_stat, ''));
  if v_stat in ('Budget Balance', 'Tax Burden') then
    raise exception 'A White Paper can''t reshape a policy''s budget cost yet.'; end if;
  -- the stat must be one this policy actually affects (any option's effects)
  if not exists (
    select 1 from public.policies pol,
      lateral jsonb_array_elements(coalesce(pol.definition->coalesce(pol.definition->>'type', 'spectrum'), '[]'::jsonb)) opt,
      lateral jsonb_array_elements(coalesce(opt->'effects', '[]'::jsonb)) eff
    where pol.id = p_policy and eff->>'t' = v_stat
  ) then raise exception 'That stat is not one of this policy''s effects.'; end if;

  for v_i in 1 .. 2 loop perform public._spend_action_point(v_party.id); end loop;   -- 2 AP
  perform public._apply_card_stat(v_party.nation_id, v_stat, 2 * p_dir);             -- ±2 to the nation's stat
  update public.parties set white_papers_left = white_papers_left - 1 where id = v_party.id;

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_party.nation_id, v_party.id, 'party',
            v_party.name || ' published a White Paper — ' || v_stat || (case when p_dir > 0 then ' +2.' else ' −2.' end),
            public.current_game_date());
  return jsonb_build_object('ok', true, 'left', v_party.white_papers_left - 1);
end $$;
grant execute on function public.white_paper(uuid, text, int) to authenticated;

notify pgrst, 'reload schema';
