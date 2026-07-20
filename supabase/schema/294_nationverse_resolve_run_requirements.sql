-- ===========================================================================
-- 294 · Enforce decision-option requirements when resolving a narrative run.
--
-- Decision options can now be gated (authored in /backend): a list of requirements on the option, each
-- checking the player's Personal Wealth, Influence, or a National Stat (dir 'higher' = at least, 'lower' =
-- at most). The client shows unmet options as locked; this makes the server refuse them too, so a crafted
-- resolve can't take a gated option. Redefines nationverse_resolve_run (from 293) — same body plus the
-- requirement check between the atomic claim and applying effects. Depends on: 293. Idempotent. Apply after 293.
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
          v_new := case v_op
            when 'Add' then v_cur + v_num
            when 'Subtract' then v_cur - v_num
            when 'Set' then v_num
            when 'Multiply' then v_cur * v_num
            when 'Divide' then case when v_num = 0 then v_cur else v_cur / v_num end
            when 'Increase by %' then v_cur * (1 + v_num / 100)
            when 'Decrease by %' then v_cur * (1 - v_num / 100)
            when 'Set minimum' then greatest(v_cur, v_num)
            when 'Set maximum' then least(v_cur, v_num)
            else null end;
          if v_new is not null then
            v_new := greatest(0, least(20, round(v_new)));
            update public.nationverse_nations
               set stats = jsonb_set(coalesce(stats, '{}'::jsonb), array[v_key], to_jsonb(v_new::int), true)
             where id = v_nation;
          end if;
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
