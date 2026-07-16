-- ===========================================================================
-- 253 · Re-layer the FDI Growth + breadth terms onto the clamped _nation_live_stat.
--
-- During the stat outage triage, 252 rebuilt _nation_live_stat from the correct 229
-- ancestor (Growth base 0, clamped [0,100]) but deliberately left OUT the FDI terms
-- to avoid a missing-dependency throw. This adds them back — the RIGHT way this time,
-- built on 252's body, not the stale 221/243 lineage:
--   • Growth branch: base 0 + _nation_fdi_growth  (asset-bound FDI Growth, schema/243/246/249)
--   • generic branch: + _nation_fdi_stat          (asset-bound FDI effects / jobs, schema/249)
-- The [0,100] clamp is preserved and now also bounds the FDI-inclusive result.
--
-- PRE-FLIGHT: only apply this after the reconciliation check confirms these all exist
-- in the target DB — _nation_fdi_growth, _nation_fdi_stat (both functions), fdi_deals,
-- buildings (both tables). If any is missing, do NOT run this; the missing piece must
-- land first (that omission is exactly what caused the outage this file guards against).
--
-- Idempotent. Apply after 252 (and after the reconciliation is green).
-- ===========================================================================

set check_function_bodies = off;

create or replace function public._nation_live_stat(p_nation text, p_stat text)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare v_base numeric; v_delta numeric; v_leg text;
begin
  select coalesce(public._to_num(stat_deltas->>p_stat), 0) into v_delta from public.nations where id = p_nation;
  if p_stat = 'Growth' then
    v_base := coalesce(public._nation_fdi_growth(p_nation), 0);   -- base 0 (229) + asset-bound FDI Growth
  else
    v_leg := case p_stat when 'Prosperity' then 'prosperity' when 'Rule of Law' then 'order' end;
    select coalesce(public._to_num(ministry_stats->>p_stat),
                    case when v_leg is not null then public._to_num(stats->>v_leg) end, 0)
      into v_base from public.nations where id = p_nation;
    v_base := coalesce(v_base, 0) + coalesce(public._nation_fdi_stat(p_nation, p_stat), 0);   -- asset-bound FDI effects
  end if;
  -- Clamp to [0, 100]: floor (222) + ceiling, now bounding the FDI-inclusive sum too.
  return greatest(0, least(100,
         coalesce(v_base, 0)
       + coalesce(public._nation_policy_stat(p_nation, p_stat), 0)
       + coalesce(v_delta, 0)
       + coalesce(public._regime_reform_stat(p_nation, p_stat), 0)));
end $$;
revoke all on function public._nation_live_stat(text, text) from public, anon, authenticated;

notify pgrst, 'reload schema';
