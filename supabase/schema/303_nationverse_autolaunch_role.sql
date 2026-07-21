-- ===========================================================================
-- 303 · Auto-launch resolves a narrative's ROLE to the personalities that hold it.
--
-- Redefines nationverse_autolaunch_narratives (301) to target by (nation_id, role) instead of a single
-- personality_id. For each narrative it fires for EVERY claimed personality in the nation whose role label
-- matches — so "Head of Government of Sordogne" reaches whoever currently holds that office, and a shared
-- role (e.g. Backbencher) reaches each holder. The role label mirrors the app's roleLabelOf(): office when
-- one is held, else 'Politician' for a party politician, else the plain role.
--
-- Legacy: a narrative with no role but a personality_id (283) still targets that one personality. Everything
-- else (once per narrative+player, the "after" prerequisite, immediate/date/stats+modifier conditions) is
-- unchanged from 301. Depends on: 301, 302 (role). Idempotent. Apply after 302.
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
  for n in select id, nation_id, personality_id, role, trigger from public.nationverse_narratives
           where role is not null or personality_id is not null loop

    -- Resolve the narrative's target players: by role in its nation, or the legacy single personality.
    for v_target in
      select p.id from public.nationverse_personalities p
       where p.claimed_by is not null and (
         (n.role is not null and p.nation_id = n.nation_id and n.nation_id is not null and
            (case
               when coalesce(p.office, 'No Specific Office') <> 'No Specific Office' then p.office
               when (p.party is not null or p.role = 'Politician' or p.role ~ '^Politician of Party [0-9]+$') then 'Politician'
               else p.role
             end) = n.role)
         or (n.role is null and n.personality_id is not null and p.id = n.personality_id)
       )
    loop
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
          for c in select value from jsonb_array_elements(coalesce(n.trigger->'stats', '[]'::jsonb)) loop
            v_val := (v_stats->>(c->>'stat'))::numeric;
            if v_val is null
               or ((c->>'dir') = 'lower' and not (v_val <= (c->>'value')::numeric))
               or ((c->>'dir') <> 'lower' and not (v_val >= (c->>'value')::numeric)) then
              v_fire := false; exit;
            end if;
          end loop;
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
  end loop;
  return v_created;
end;
$$;
revoke all on function public.nationverse_autolaunch_narratives() from public, anon, authenticated;   -- cron/admin only

notify pgrst, 'reload schema';
