-- ===========================================================================
-- 301 · Narrative "conditions" trigger can also require a modifier be Active / Not Active.
--
-- Redefines nationverse_autolaunch_narratives (300) so the 'stats' (conditions) mode evaluates BOTH stat
-- thresholds and modifier conditions — trigger.modifiers = [{modifier:<id>, state:'active'|'inactive'}] —
-- against the nation's active_modifiers (295). ALL conditions must hold. A modifier is "active" when its id
-- is present in nationverse_nations.active_modifiers. Composes with the "after" prerequisite (300) and the
-- stat conditions, so e.g. after = Board Meeting AND Capital ≤ 10 AND Banking Crisis active.
--
-- The "no conditions never fires" guard now counts stats + modifiers together. Everything else is unchanged
-- from 300. Depends on: 295 (active_modifiers), 300. Idempotent. Apply after 300.
-- ===========================================================================

create or replace function public.nationverse_autolaunch_narratives()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tick int; n record; v_target uuid; v_nation uuid; v_stats jsonb; v_actmods jsonb;
  v_fire boolean; c jsonb; v_val numeric; v_due int; v_created int := 0; v_after text; v_has boolean;
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
      if jsonb_array_length(coalesce(n.trigger->'stats', '[]'::jsonb)) = 0
         and jsonb_array_length(coalesce(n.trigger->'modifiers', '[]'::jsonb)) = 0 then
        v_fire := false;   -- no conditions at all → never fires
      else
        select nation_id into v_nation from public.nationverse_personalities where id = v_target;
        select stats, active_modifiers into v_stats, v_actmods from public.nationverse_nations where id = v_nation;
        v_fire := true;
        -- Stat thresholds.
        for c in select value from jsonb_array_elements(coalesce(n.trigger->'stats', '[]'::jsonb)) loop
          v_val := (v_stats->>(c->>'stat'))::numeric;   -- null if the stat is absent
          if v_val is null
             or ((c->>'dir') = 'lower' and not (v_val <= (c->>'value')::numeric))
             or ((c->>'dir') <> 'lower' and not (v_val >= (c->>'value')::numeric)) then
            v_fire := false; exit;
          end if;
        end loop;
        -- Modifier conditions (active = id present in the nation's active_modifiers).
        if v_fire then
          for c in select value from jsonb_array_elements(coalesce(n.trigger->'modifiers', '[]'::jsonb)) loop
            v_has := coalesce(v_actmods, '[]'::jsonb) @> to_jsonb(c->>'modifier');
            if ((c->>'state') = 'inactive' and v_has) or ((c->>'state') <> 'inactive' and not v_has) then
              v_fire := false; exit;
            end if;
          end loop;
        end if;
      end if;
    end if;

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
