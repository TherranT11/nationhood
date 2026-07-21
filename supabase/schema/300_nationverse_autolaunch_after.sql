-- ===========================================================================
-- 300 · Narrative auto-launch honors an "after this narrative" prerequisite.
--
-- Redefines nationverse_autolaunch_narratives (292) so a narrative can declare trigger.after = <narrative id>
-- ("After [event] has fired" in the Narrative Creator). The dependent narrative won't launch for a player
-- until THAT player has a COMPLETED (status='done') run of the prerequisite — so an authored sequence stays
-- in order and events don't overlap. The prerequisite composes with the mode: e.g. after = Board Meeting AND
-- mode = stats (Capital ≤ 10) fires only once Board Meeting is done and the stat holds.
--
-- Everything else is unchanged from 292 (immediate / date / stats, claimed-only, once per narrative+player).
-- Depends on: 289 (runs), 290 (trigger), 292. Idempotent. Apply after 299.
-- ===========================================================================

create or replace function public.nationverse_autolaunch_narratives()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tick int; n record; v_target uuid; v_nation uuid; v_stats jsonb;
  v_fire boolean; c jsonb; v_val numeric; v_due int; v_created int := 0; v_after text;
begin
  select current_tick into v_tick from public.game_state limit 1;
  for n in select id, personality_id, trigger from public.nationverse_narratives where personality_id is not null loop
    v_target := n.personality_id;
    if not exists (select 1 from public.nationverse_personalities where id = v_target and claimed_by is not null) then continue; end if;
    if exists (select 1 from public.nationverse_narrative_runs where narrative_id = n.id and personality_id = v_target) then continue; end if;

    -- Prerequisite: don't fire until the "after" narrative has a completed run for this player (keeps order).
    v_after := nullif(n.trigger->>'after', '');
    if v_after is not null and v_after ~ '^[0-9a-fA-F-]{36}$' then
      if not exists (select 1 from public.nationverse_narrative_runs
                     where narrative_id = v_after::uuid and personality_id = v_target and status = 'done') then
        continue;
      end if;
    end if;

    v_fire := false;
    if coalesce(n.trigger->>'mode', 'immediate') = 'immediate' then
      v_fire := true;
    elsif n.trigger->>'mode' = 'date' then
      v_due := (coalesce((n.trigger->>'year')::int, 1980) - 1980) * 12 + coalesce((n.trigger->>'month')::int, 1);
      v_fire := v_tick >= v_due;
    elsif n.trigger->>'mode' = 'stats' then
      if jsonb_array_length(coalesce(n.trigger->'stats', '[]'::jsonb)) = 0 then
        v_fire := false;   -- 'stats' mode with no conditions never fires
      else
        select nation_id into v_nation from public.nationverse_personalities where id = v_target;
        select stats into v_stats from public.nationverse_nations where id = v_nation;
        v_fire := true;
        for c in select value from jsonb_array_elements(n.trigger->'stats') loop
          v_val := (v_stats->>(c->>'stat'))::numeric;   -- null if the stat is absent
          if v_val is null
             or ((c->>'dir') = 'lower' and not (v_val <= (c->>'value')::numeric))
             or ((c->>'dir') <> 'lower' and not (v_val >= (c->>'value')::numeric)) then
            v_fire := false; exit;
          end if;
        end loop;
      end if;
    end if;

    -- 'immediate' with only an "after" prerequisite is the common sequencing case: fire as soon as the
    -- prerequisite is done (the guard above already enforced it).
    if v_fire then
      insert into public.nationverse_narrative_runs (narrative_id, personality_id, created_tick)
        values (n.id, v_target, v_tick);
      v_created := v_created + 1;
    end if;
  end loop;
  return v_created;
end;
$$;
revoke all on function public.nationverse_autolaunch_narratives() from public, anon, authenticated;   -- cron/admin only

notify pgrst, 'reload schema';
