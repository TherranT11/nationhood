-- ===========================================================================
-- 296 · Two more decision-option effects a narrative choice can apply on resolve.
--
-- Redefines nationverse_resolve_run (from 294) — same atomic claim + requirement enforcement, same National
-- Statistic and Unlock Narrative handling, plus TWO new applied categories so a player's choice can:
--
--   Interest-Group Opinion → move the player's OWN party's approval within a named demographic group
--       (target = group name; value = delta; approval clamped 0–100). The player's party slot is resolved
--       from their party name (or legacy 'Politician of Party N' role) against the nation's party list. If
--       the player belongs to no party, or the named group / slot isn't found, the effect is skipped.
--   Modifier → Activate/Deactivate a modifier on the player's nation (target = modifier id). Activate adds
--       the id to nationverse_nations.active_modifiers; Deactivate removes it. The per-tick applier (295)
--       then realizes the modifier's ongoing stat pressure while it's active.
--
-- Stat/approval maths go through nationverse_apply_op (295) so they can't drift from the modifier applier.
-- Depends on: 294 (resolve_run), 295 (active_modifiers, apply_op). Idempotent. Apply after 295.
-- ===========================================================================

create or replace function public.nationverse_resolve_run(p_run uuid, p_option int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid; v_narr uuid; v_nation uuid; v_dec jsonb; e jsonb;
  v_cat text; v_op text; v_key text; v_num numeric; v_cur numeric; v_new numeric; v_stats jsonb;
  v_target text; v_unlock uuid; rq jsonb; v_wealth numeric; v_influence numeric; v_have numeric;
  v_pname text; v_prole text; v_slot int; v_demo jsonb; v_gidx int;
begin
  v_me := public.nationverse_my_personality();
  if v_me is null then raise exception 'no_character'; end if;
  -- Claim the run atomically (exactly-once), then act.
  update public.nationverse_narrative_runs set status = 'done'
   where id = p_run and personality_id = v_me and status = 'assigned'
  returning narrative_id into v_narr;
  if v_narr is null then raise exception 'not_your_run'; end if;
  select nation_id into v_nation from public.nationverse_personalities where id = v_me;

  if p_option is not null then
    select decision into v_dec from public.nationverse_narratives where id = v_narr;

    -- Enforce the chosen option's requirements (a failure rolls back the whole txn, incl. the claim).
    select wealth, influence into v_wealth, v_influence from public.nationverse_personalities where id = v_me;
    select stats into v_stats from public.nationverse_nations where id = v_nation;
    for rq in select value from jsonb_array_elements(coalesce(v_dec->'options'->p_option->'requires', '[]'::jsonb)) loop
      v_have := case rq->>'type'
        when 'influence' then coalesce(v_influence, 0)
        when 'stat' then (v_stats->>(rq->>'stat'))::numeric
        else coalesce(v_wealth, 0) end;
      if v_have is null
         or ((rq->>'dir') = 'lower' and not (v_have <= (rq->>'value')::numeric))
         or ((rq->>'dir') <> 'lower' and not (v_have >= (rq->>'value')::numeric)) then
        raise exception 'requirement_not_met';
      end if;
    end loop;

    -- Apply the option's effects.
    for e in select value from jsonb_array_elements(coalesce(v_dec->'options'->p_option->'effects', '[]'::jsonb)) loop
      v_cat := e->>'category'; v_op := e->>'operation'; v_target := e->>'target';

      if v_cat = 'National Statistic' and v_nation is not null then
        v_key := v_target;
        v_num := nullif(regexp_replace(coalesce(e->>'value', ''), '[^0-9.\-]', '', 'g'), '')::numeric;
        if v_key is not null and v_num is not null then
          select stats into v_stats from public.nationverse_nations where id = v_nation;
          v_cur := coalesce((v_stats->>v_key)::numeric, 0);
          v_new := public.nationverse_apply_op(v_op, v_cur, v_num);
          if v_new is not null then
            v_new := greatest(0, least(20, round(v_new)));
            update public.nationverse_nations
               set stats = jsonb_set(coalesce(stats, '{}'::jsonb), array[v_key], to_jsonb(v_new::int), true)
             where id = v_nation;
          end if;
        end if;

      elsif v_cat = 'Interest-Group Opinion' and v_nation is not null then
        -- Move the player's OWN party's approval within the named demographic group.
        v_num := nullif(regexp_replace(coalesce(e->>'value', ''), '[^0-9.\-]', '', 'g'), '')::numeric;
        select party, role into v_pname, v_prole from public.nationverse_personalities where id = v_me;
        if v_pname is null then
          v_slot := nullif(substring(coalesce(v_prole, '') from 'Politician of Party (\d+)'), '')::int;
        else
          select ord into v_slot
            from public.nationverse_nations nn,
                 lateral jsonb_array_elements(nn.parties) with ordinality as t(elem, ord)
           where nn.id = v_nation and elem->>'name' = v_pname limit 1;
        end if;
        if v_num is not null and v_slot is not null and v_target is not null then
          select demographics into v_demo from public.nationverse_nations where id = v_nation;
          select ord - 1 into v_gidx
            from jsonb_array_elements(coalesce(v_demo, '[]'::jsonb)) with ordinality as t(elem, ord)
           where elem->>'name' = v_target limit 1;
          if v_gidx is not null then
            v_cur := coalesce((v_demo->v_gidx->'approval'->>(v_slot - 1))::numeric, 50);
            v_new := public.nationverse_apply_op(v_op, v_cur, v_num);
            if v_new is not null then
              v_new := greatest(0, least(100, round(v_new)));
              update public.nationverse_nations
                 set demographics = jsonb_set(demographics,
                       array[v_gidx::text, 'approval', (v_slot - 1)::text], to_jsonb(v_new::int), true)
               where id = v_nation;
            end if;
          end if;
        end if;

      elsif v_cat = 'Modifier' and v_nation is not null and v_target is not null then
        -- Activate/Deactivate the named modifier on the player's nation (target = modifier id).
        if v_op in ('Activate', 'Enable', 'Unlock') then
          update public.nationverse_nations
             set active_modifiers = case
               when active_modifiers @> to_jsonb(v_target) then active_modifiers
               else coalesce(active_modifiers, '[]'::jsonb) || to_jsonb(v_target) end
           where id = v_nation;
        else
          update public.nationverse_nations
             set active_modifiers = coalesce(
               (select jsonb_agg(x) from jsonb_array_elements(coalesce(active_modifiers, '[]'::jsonb)) x
                 where x <> to_jsonb(v_target)), '[]'::jsonb)
           where id = v_nation;
        end if;

      elsif v_cat = 'Unlock Narrative' then
        select id into v_unlock from public.nationverse_narratives
         where internal_id = v_target or name = v_target limit 1;
        if v_unlock is not null and not exists (
          select 1 from public.nationverse_narrative_runs where narrative_id = v_unlock and personality_id = v_me
        ) then
          insert into public.nationverse_narrative_runs (narrative_id, personality_id, created_tick)
            values (v_unlock, v_me, (select current_tick from public.game_state limit 1));
        end if;
      end if;
    end loop;
  end if;
end;
$$;
revoke all on function public.nationverse_resolve_run(uuid, int) from public, anon;
grant execute on function public.nationverse_resolve_run(uuid, int) to authenticated;

notify pgrst, 'reload schema';
