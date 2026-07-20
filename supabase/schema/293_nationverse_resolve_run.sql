-- ===========================================================================
-- 293 · Apply a narrative's decision effects on completion.
--
-- Supersedes nationverse_complete_run (291): nationverse_resolve_run(run, option) marks the run done AND
-- applies the chosen decision option's effects, server-side (a player can only resolve their OWN assigned
-- run, and only the authored effects — no client-supplied changes).
--
-- Applied effect categories (the ones with a real Nationverse mechanic today):
--   National Statistic → change the target's nation stat (target = stat KEY; clamped 0–20)
--   Unlock Narrative   → create a run of the named narrative for this player (so it appears for them now)
-- Other categories (Corporate Stat, Party Approval, Create Story Bill, Situation/Event, …) are recorded in
-- the authoring but NOT applied yet — those systems have no Nationverse runtime. Unknown ops are skipped.
-- Depends on: 289 (runs), 277 (narratives.decision). Idempotent. Apply after 292.
-- ===========================================================================

drop function if exists public.nationverse_complete_run(uuid);

create or replace function public.nationverse_resolve_run(p_run uuid, p_option int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid; v_narr uuid; v_nation uuid; v_dec jsonb; e jsonb;
  v_cat text; v_op text; v_key text; v_num numeric; v_cur numeric; v_new numeric; v_stats jsonb;
  v_target text; v_unlock uuid;
begin
  v_me := public.nationverse_my_personality();
  if v_me is null then raise exception 'no_character'; end if;
  select narrative_id into v_narr from public.nationverse_narrative_runs
   where id = p_run and personality_id = v_me and status = 'assigned';
  if v_narr is null then raise exception 'not_your_run'; end if;
  select nation_id into v_nation from public.nationverse_personalities where id = v_me;

  if p_option is not null then
    select decision into v_dec from public.nationverse_narratives where id = v_narr;
    for e in select value from jsonb_array_elements(coalesce(v_dec->'options'->p_option->'effects', '[]'::jsonb)) loop
      v_cat := e->>'category'; v_op := e->>'operation'; v_target := e->>'target';

      if v_cat = 'National Statistic' and v_nation is not null then
        v_key := v_target;   -- stored as the stat KEY (see backend change shipped with this)
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
            else null end;   -- non-numeric ops (Unlock/Trigger/…) don't apply to a stat
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
      -- other categories are authored but not applied yet (no Nationverse runtime).
    end loop;
  end if;

  update public.nationverse_narrative_runs set status = 'done' where id = p_run;
end;
$$;
revoke all on function public.nationverse_resolve_run(uuid, int) from public, anon;
grant execute on function public.nationverse_resolve_run(uuid, int) to authenticated;

notify pgrst, 'reload schema';
