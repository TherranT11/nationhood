-- ===========================================================================
-- 292 · Automatic, trigger-driven narrative launch.
--
-- nationverse_autolaunch_narratives() evaluates every narrative's `trigger` (290) and creates a run (289)
-- for its Assigned Personality when the trigger fires — replacing the manual launcher for authored triggers.
-- Fires ONCE per (narrative, personality): guarded on an existing run. Rules:
--   immediate → fire now
--   date      → fire once the game tick reaches (year-1980)*12 + month
--   stats     → fire when ALL stat conditions hold for the target's nation (stat key vs value, higher/lower)
-- Only targets a CLAIMED personality (a real player). Scheduled hourly via pg_cron so 'immediate' narratives
-- appear promptly; safe to run repeatedly (idempotent). Depends on: 289, 290, 60 (game_state, pg_cron).
-- Apply after 291. NOTE: stat triggers must store the stat KEY (see backend change shipped with this).
-- ===========================================================================

create or replace function public.nationverse_autolaunch_narratives()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tick int; n record; v_target uuid; v_nation uuid; v_stats jsonb;
  v_fire boolean; c jsonb; v_val numeric; v_due int; v_created int := 0;
begin
  select current_tick into v_tick from public.game_state limit 1;
  for n in select id, personality_id, trigger from public.nationverse_narratives where personality_id is not null loop
    v_target := n.personality_id;
    if not exists (select 1 from public.nationverse_personalities where id = v_target and claimed_by is not null) then continue; end if;
    if exists (select 1 from public.nationverse_narrative_runs where narrative_id = n.id and personality_id = v_target) then continue; end if;

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

-- Hourly clock (mirrors the tick-cron pattern in schema/60). Idempotent — cron.schedule upserts by name;
-- wrapped so a project without pg_cron still applies the rest of the schema.
do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule('nationverse-autolaunch', '0 * * * *', 'select public.nationverse_autolaunch_narratives();');
exception when others then
  raise notice 'pg_cron not configured (%): enable it, then run cron.schedule(''nationverse-autolaunch'', ''0 * * * *'', ''select public.nationverse_autolaunch_narratives();'').', sqlerrm;
end $$;

notify pgrst, 'reload schema';
