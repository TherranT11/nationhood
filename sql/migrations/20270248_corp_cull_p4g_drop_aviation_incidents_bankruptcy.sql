-- ════════════════════════════════════════════════════════════════════
-- Corp-cull Phase 4g — drop the legacy aviation-incident + safety-pact
-- system and the legacy faction-corp bankruptcy RPC
-- ════════════════════════════════════════════════════════════════════
-- The aviation-incident system is legacy faction-corp:
--   aviation_incidents.corp_id REFERENCES factions, fired by
--   process_airline_route_tick, which was only reached via the per-corp
--   process_airline_corp_tick loop dropped in Phase 4c (20270243). With that
--   gone, the whole chain is dead:
--     • process_airline_route_tick      — legacy per-route resolver (callerless
--                                          since process_airline_corp_tick went)
--     • _fire_aviation_incident         — fires incidents (only caller was ^)
--     • _apply_op_safety_pact           — op-safety pact helper (only caller ^)
--     • respond_to_aviation_incident    — player action (corp pages deleted)
--     • auto_resolve_stale_incidents    — the per-tick stale sweeper; its call
--                                          was removed from advance-corp-tick in
--                                          this commit (it was mis-kept in 4e)
--   declare_corp_bankruptcy             — legacy faction-corp bankruptcy; its
--                                          only caller was _fire_aviation_incident.
--
-- The ENTREPRENEUR airline system is untouched: process_entrepreneur_airline_routes
-- does not use the incident system, and the entrepreneur declare_bankruptcy
-- (different function, corp-id based) is KEEP.
--
-- Verified zero remaining callers (client/edge/SQL/trigger) for each.
--
-- DEPLOY ORDER: deploy advance-corp-tick (build marker 2026-05-24-b) BEFORE
-- applying this migration so the tick no longer calls auto_resolve_stale_incidents.
--
-- Tables aviation_incidents / aviation_incident_types drop in Phase 5.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DROP FUNCTION IF EXISTS public.process_airline_route_tick(uuid, integer);
DROP FUNCTION IF EXISTS public._fire_aviation_incident(uuid, uuid, text, numeric, integer);
DROP FUNCTION IF EXISTS public._apply_op_safety_pact(uuid, text, numeric, numeric, integer);
DROP FUNCTION IF EXISTS public.respond_to_aviation_incident(uuid, text);
DROP FUNCTION IF EXISTS public.auto_resolve_stale_incidents(integer);
DROP FUNCTION IF EXISTS public.declare_corp_bankruptcy(uuid);

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ── Re-apply from git history: 20260726 (phase7 aviation
-- incidents: _fire_aviation_incident / respond_to_aviation_incident /
-- auto_resolve_stale_incidents / process_airline_route_tick), 20261019 +
-- 20270109 (process_airline_route_tick / _fire_aviation_incident successors),
-- 20270110 (_apply_op_safety_pact + _fire_aviation_incident), and 20260816
-- (declare_corp_bankruptcy, latest body). Restore the auto_resolve_stale_incidents
-- call in advance-corp-tick.
