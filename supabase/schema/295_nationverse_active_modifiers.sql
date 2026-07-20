-- ===========================================================================
-- 295 · Active modifiers on a nation + the per-tick applier that realizes them.
--
-- Until now nationverse_modifiers (273) held only DEFINITIONS — a named bundle of effects with no way to
-- attach one to a nation. This adds that attachment: nationverse_nations.active_modifiers is a jsonb array
-- of modifier ids currently in force on the nation. A narrative decision option can Activate/Deactivate a
-- modifier (wired in 296), and this migration's applier turns an active modifier's ongoing National-Statistic
-- effects into a real per-tick pressure on the nation's stats.
--
-- Also adds two ONE-source helpers shared with nationverse_resolve_run (296) so their maths can't drift:
--   nationverse_apply_op(op, cur, num)  — the effect operation math (Add/Subtract/Set/…)
--   nationverse_parse_num(text)         — pull a signed number out of an authored value string ("+2", "25%")
--
-- Scope (V1): the applier evaluates only category = 'National Statistic' effects whose timing is
-- 'While Modifier Is Active' (the modifier's ongoing force). Other categories/timings are inert here — they
-- have no nation-wide runtime. Depends on: 271 (nations), 273 (modifiers), 60 (game_state, pg_cron).
-- Idempotent. Apply after 294.
-- ===========================================================================

alter table public.nationverse_nations
  add column if not exists active_modifiers jsonb not null default '[]'::jsonb;   -- [modifier_id, …]

-- One source for the effect operation math (see the big CASE that used to live inline in resolve_run).
-- Returns null for non-numeric ops (Unlock/Activate/…), so callers know the effect doesn't touch a number.
create or replace function public.nationverse_apply_op(p_op text, p_cur numeric, p_num numeric)
returns numeric
language sql
immutable
as $$
  select case p_op
    when 'Add'          then p_cur + p_num
    when 'Subtract'     then p_cur - p_num
    when 'Set'          then p_num
    when 'Multiply'     then p_cur * p_num
    when 'Divide'       then case when p_num = 0 then p_cur else p_cur / p_num end
    when 'Increase by %' then p_cur * (1 + p_num / 100)
    when 'Decrease by %' then p_cur * (1 - p_num / 100)
    when 'Set minimum'  then greatest(p_cur, p_num)
    when 'Set maximum'  then least(p_cur, p_num)
    else null end;
$$;

-- One source for reading an authored value string ("+2", "25%", "-1") as a number. Null when it holds no
-- digits (so the caller skips the effect rather than treating it as zero).
create or replace function public.nationverse_parse_num(p_val text)
returns numeric
language sql
immutable
as $$
  select nullif(regexp_replace(coalesce(p_val, ''), '[^0-9.\-]', '', 'g'), '')::numeric;
$$;

-- Apply every active modifier's ongoing National-Statistic effects to its nation's stats (clamped 0–20).
-- Runs each tick, so a "While Modifier Is Active" effect is an ongoing force, not a one-shot. Safe to run
-- repeatedly (each run is one tick's worth of pressure).
create or replace function public.nationverse_apply_active_modifiers()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  nn record; v_mid text; e jsonb; v_stats jsonb; v_key text; v_op text; v_num numeric;
  v_cur numeric; v_new numeric; v_touched int := 0;
begin
  for nn in select id, stats, active_modifiers from public.nationverse_nations
            where jsonb_array_length(coalesce(active_modifiers, '[]'::jsonb)) > 0 loop
    v_stats := coalesce(nn.stats, '{}'::jsonb);
    for v_mid in select value from jsonb_array_elements_text(nn.active_modifiers) loop
      continue when v_mid !~ '^[0-9a-fA-F-]{36}$';   -- skip anything that isn't a modifier uuid (never abort the sweep)
      for e in select value from jsonb_array_elements(
                 coalesce((select effects from public.nationverse_modifiers where id = v_mid::uuid), '[]'::jsonb)) loop
        continue when e->>'category' is distinct from 'National Statistic';
        continue when coalesce(e->>'timing', 'While Modifier Is Active') <> 'While Modifier Is Active';
        v_key := e->>'target';
        v_op  := e->>'operation';
        v_num := public.nationverse_parse_num(e->>'value');
        if v_key is null or v_num is null then continue; end if;
        v_cur := coalesce((v_stats->>v_key)::numeric, 0);
        v_new := public.nationverse_apply_op(v_op, v_cur, v_num);
        if v_new is null then continue; end if;
        v_new := greatest(0, least(20, round(v_new)));
        v_stats := jsonb_set(v_stats, array[v_key], to_jsonb(v_new::int), true);
      end loop;
    end loop;
    update public.nationverse_nations set stats = v_stats where id = nn.id;
    v_touched := v_touched + 1;
  end loop;
  return v_touched;
end;
$$;
revoke all on function public.nationverse_apply_active_modifiers() from public, anon, authenticated;   -- cron/admin only

-- 6-hour clock, mirroring the game tick (schema/60) so modifier pressure lands once per tick. Idempotent —
-- cron.schedule upserts by name; wrapped so a project without pg_cron still applies the rest of the schema.
do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule('nationverse-modifiers', '0 */6 * * *', 'select public.nationverse_apply_active_modifiers();');
exception when others then
  raise notice 'pg_cron not configured (%): enable it, then run cron.schedule(''nationverse-modifiers'', ''0 */6 * * *'', ''select public.nationverse_apply_active_modifiers();'').', sqlerrm;
end $$;

notify pgrst, 'reload schema';
