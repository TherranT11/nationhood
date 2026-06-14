-- ════════════════════════════════════════════════════════════════════
-- 20270909 — Remove the war backend (Phase D, part C)
--
-- The war mechanic is being removed entirely. The client UI (Declare War
-- / Request Ceasefire actions, the war banner, the Go-to-War dispute
-- door) and the synced tick logic (setNationsAtWar, the declare_war bill
-- type + resolver, the territorial dispute→war escalation) were removed
-- in the preceding commits. This reclaims the backend.
--
-- War never produced anything but a relation flag + an unused front map
-- after the army-unit cull (20270905) — no combat, no supply, nothing
-- read these objects on a live tick (verified: no edge/tick/client
-- reader of war_fronts / war_sectors / combat_events / war_score* /
-- ceasefire_offer / war_declared* remains).
--
-- DROPPED:
--   • RPCs: declare_war, go_to_war, request_ceasefire, respond_ceasefire,
--     generate_war_fronts, upsert_war_sector, set_front_action,
--     assign_army_to_front (the last two already inert — they targeted
--     the army tables dropped in 20270905).
--   • Tables: war_fronts, war_sectors, combat_events (CASCADE clears the
--     diplomatic-map RLS policies + any remaining FKs).
--   • diplomatic_relations war columns: war_declared_at_tick,
--     war_justification, war_score_a, war_score_b, ceasefire_offer_nation_id.
--
-- DATA: any lingering relation_type='war' row is reset to 'neutral'
-- (relation_type has no CHECK; 'war' is just a now-unused value), and any
-- in-flight declare_war bill is failed since its resolver is gone.
--
-- The armies.assigned_front_id / current_sector_id / supply_balance
-- columns need no drop — the armies table itself went in 20270905.
--
-- IF EXISTS / CASCADE throughout so this applies cleanly regardless of
-- which objects a given database carries.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Drain lingering war state / in-flight bills ────────────────
UPDATE public.bills
   SET status = 'failed'
 WHERE bill_type = 'declare_war'
   AND status NOT IN ('passed', 'failed', 'vetoed');

UPDATE public.diplomatic_relations
   SET relation_type = 'neutral'
 WHERE relation_type = 'war';

-- ── 2. War / combat / ceasefire RPCs ──────────────────────────────
DROP FUNCTION IF EXISTS public.declare_war(uuid);
DROP FUNCTION IF EXISTS public.go_to_war(uuid);
DROP FUNCTION IF EXISTS public.request_ceasefire(uuid);
DROP FUNCTION IF EXISTS public.respond_ceasefire(uuid, boolean);
DROP FUNCTION IF EXISTS public.generate_war_fronts();
DROP FUNCTION IF EXISTS public.upsert_war_sector(uuid, text, text, int, text);
DROP FUNCTION IF EXISTS public.set_front_action(uuid, text);
DROP FUNCTION IF EXISTS public.assign_army_to_front(uuid, uuid);

-- ── 3. War-front / combat tables (dependents first; CASCADE) ──────
DROP TABLE IF EXISTS public.combat_events CASCADE;
DROP TABLE IF EXISTS public.war_sectors   CASCADE;
DROP TABLE IF EXISTS public.war_fronts     CASCADE;

-- ── 4. War columns on diplomatic_relations (no live reader) ───────
ALTER TABLE public.diplomatic_relations
    DROP COLUMN IF EXISTS war_declared_at_tick,
    DROP COLUMN IF EXISTS war_justification,
    DROP COLUMN IF EXISTS war_score_a,
    DROP COLUMN IF EXISTS war_score_b,
    DROP COLUMN IF EXISTS ceasefire_offer_nation_id;

NOTIFY pgrst, 'reload schema';

COMMIT;
