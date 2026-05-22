-- ════════════════════════════════════════════════════════════════════
-- ENTREPRENEUR AIRLINES — per-aircraft rows (commit 1/2: schema + backfill)
-- ════════════════════════════════════════════════════════════════════
-- v1 (20270186) modelled the entrepreneur fleet as three integer
-- counters on entrepreneur_corps with no per-plane identity, condition,
-- or aging — explicitly deferred. This brings the LEGACY airline
-- mechanics (corp_aircraft rows + condition decay + overhaul/retire,
-- already powering airline-operations.html) to entrepreneur corps by
-- reusing the SAME corp_aircraft table rather than building a parallel
-- one. Each owned aircraft becomes one corp_aircraft row carrying its
-- own condition, overhaul history, and route assignment.
--
-- ── Why reuse corp_aircraft (not a new table) ────────────────────
-- corp_aircraft.route_id already FKs to airline_routes — the SAME table
-- entrepreneur routes live in (20270186 added airline_routes.airline_corp_id
-- alongside the legacy airline_faction_id). So an entrepreneur aircraft
-- assigned to an entrepreneur route is just a corp_aircraft row whose
-- route_id points at that route. Condition decay, overhaul, and retire
-- become the same rows and the same joins the legacy system already uses.
--
-- ── Ownership: a second owner column, mutually exclusive ─────────
-- corp_aircraft.corp_id REFERENCES factions(id) (legacy faction-corps).
-- Entrepreneur corps live in entrepreneur_corps. We add a nullable
-- entrepreneur_corp_id and relax corp_id's NOT NULL, with a one-owner
-- CHECK — exactly the pattern 20270186 used for airline_routes
-- (airline_faction_id vs airline_corp_id + airline_routes_one_owner_chk).
--
-- ── corp-level owned counts are RETIRED (single source = the rows) ─
-- entrepreneur_corps.aircraft_*_owned were a per-corp counter cache.
-- With per-aircraft rows, open_route counts idle from rows and the corp
-- page derives owned/idle from rows, so the counters have no reader —
-- 20270204 (commit 2/2) DROPs them after redefining every RPC to stop
-- writing them. This migration still READS them (below) to materialize
-- the right number of rows and to verify the backfill before they go.
-- airline_routes.aircraft_* per-ROUTE counts STAY: the per-tick
-- allocator reads them for seats/ops, exactly as the legacy system does.
--
-- One-time backfill: materialize one row (condition 100) per currently
-- owned aircraft, then assign route_id to match each active route's
-- denorm counts. Guarded so re-running is a no-op.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema: entrepreneur ownership on corp_aircraft ───────────
ALTER TABLE public.corp_aircraft
    ADD COLUMN IF NOT EXISTS entrepreneur_corp_id uuid
        REFERENCES entrepreneur_corps(id) ON DELETE CASCADE;

-- corp_id becomes the legacy-owner column (paralleling how 20270186
-- made airline_routes.airline_faction_id nullable). Entrepreneur rows
-- leave it NULL and set entrepreneur_corp_id instead.
ALTER TABLE public.corp_aircraft ALTER COLUMN corp_id DROP NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
         WHERE table_name = 'corp_aircraft'
           AND constraint_name = 'corp_aircraft_one_owner_chk'
    ) THEN
        ALTER TABLE public.corp_aircraft
            ADD CONSTRAINT corp_aircraft_one_owner_chk
            CHECK ((corp_id IS NULL) <> (entrepreneur_corp_id IS NULL));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_corp_aircraft_ent_corp
    ON public.corp_aircraft (entrepreneur_corp_id) WHERE entrepreneur_corp_id IS NOT NULL;

COMMENT ON COLUMN public.corp_aircraft.entrepreneur_corp_id IS
    'Entrepreneur-corp owner of this aircraft. Mutually exclusive with the legacy corp_id (faction owner), enforced by corp_aircraft_one_owner_chk. Set by entrepreneur_buy_aircraft / found_entrepreneur_corp; route_id assignment + condition decay + overhaul/retire reuse the legacy corp_aircraft mechanics.';

-- ── 2. Guard sync_corp_fleet_slots against entrepreneur rows ─────
-- The AFTER trigger maintains factions.corp_fleet (a legacy-airline hero
-- stat). Entrepreneur rows have corp_id = NULL, so the existing UPDATE
-- would scan WHERE id = NULL (a harmless no-op) — but make the intent
-- explicit and skip the pointless statement. factions.corp_fleet must
-- NOT move for entrepreneur aircraft.
CREATE OR REPLACE FUNCTION sync_corp_fleet_slots()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.corp_id IS NOT NULL THEN
        UPDATE factions
           SET corp_fleet = COALESCE((
               SELECT SUM(fleet_slots)::INT
                 FROM corp_aircraft
                WHERE corp_id = NEW.corp_id
           ), 0)
         WHERE id = NEW.corp_id;
    END IF;

    IF (TG_OP = 'DELETE'
        OR (TG_OP = 'UPDATE' AND OLD.corp_id IS DISTINCT FROM NEW.corp_id))
       AND OLD.corp_id IS NOT NULL THEN
        UPDATE factions
           SET corp_fleet = COALESCE((
               SELECT SUM(fleet_slots)::INT
                 FROM corp_aircraft
                WHERE corp_id = OLD.corp_id
           ), 0)
         WHERE id = OLD.corp_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION sync_corp_fleet_slots() IS
    'AFTER trigger on corp_aircraft INSERT/DELETE/UPDATE-of-corp_id. Keeps factions.corp_fleet = SUM(fleet_slots) for LEGACY (faction-owned) aircraft. Skips entrepreneur rows (corp_id IS NULL) — those track ownership via entrepreneur_corp_id and never touch factions.corp_fleet.';

-- ── 3. One-time backfill (idempotent: skip if any ent rows exist) ─
DO $$
DECLARE
    v_route RECORD;
    v_cls   RECORD;
    v_ids   uuid[];
    v_bad_owned int;
    v_bad_route int;
BEGIN
    -- Guard makes the whole one-time migration idempotent AND keeps the
    -- count-reading statements below from ever planning against the
    -- aircraft_*_owned columns once 20270204 has dropped them (on a
    -- re-run the early RETURN fires before any such statement is reached).
    IF EXISTS (SELECT 1 FROM corp_aircraft WHERE entrepreneur_corp_id IS NOT NULL) THEN
        RAISE NOTICE 'entrepreneur corp_aircraft rows already exist — skipping backfill';
        RETURN;
    END IF;

    -- 3a. Owned counts → individual rows (condition 100).
    INSERT INTO corp_aircraft (entrepreneur_corp_id, aircraft_class, condition, acquired_at_tick)
    SELECT ec.id, cls.aircraft_class, 100, ec.founded_tick
      FROM entrepreneur_corps ec
      CROSS JOIN LATERAL (VALUES
          ('regional',   ec.aircraft_regional_owned),
          ('narrowbody', ec.aircraft_narrowbody_owned),
          ('widebody',   ec.aircraft_widebody_owned)
      ) AS cls(aircraft_class, n)
      CROSS JOIN LATERAL generate_series(1, GREATEST(COALESCE(cls.n, 0), 0)) g
     WHERE ec.industry = 'airline';

    -- 3b. Assign route_id to match each active route's denorm counts.
    -- Per (route, class) pick that many still-idle rows for the route's
    -- owning corp, mirroring set_up_route's assignment loop.
    FOR v_route IN
        SELECT id, airline_corp_id, aircraft_regional, aircraft_narrowbody, aircraft_widebody
          FROM airline_routes
         WHERE status = 'active' AND airline_corp_id IS NOT NULL
    LOOP
        FOR v_cls IN
            SELECT klass, need FROM (VALUES
                ('regional'::text,   v_route.aircraft_regional),
                ('narrowbody'::text, v_route.aircraft_narrowbody),
                ('widebody'::text,   v_route.aircraft_widebody)
            ) AS t(klass, need)
        LOOP
            IF COALESCE(v_cls.need, 0) <= 0 THEN CONTINUE; END IF;

            SELECT array_agg(id) INTO v_ids FROM (
                SELECT id FROM corp_aircraft
                 WHERE entrepreneur_corp_id = v_route.airline_corp_id
                   AND aircraft_class = v_cls.klass
                   AND route_id IS NULL
                 ORDER BY created_at ASC
                 LIMIT v_cls.need
            ) picks;

            IF v_ids IS NOT NULL THEN
                UPDATE corp_aircraft SET route_id = v_route.id WHERE id = ANY(v_ids);
            END IF;
        END LOOP;
    END LOOP;

    -- ── 4. Verification: rows must match the caches they mirror, before
    -- 20270204 drops the count caches and makes the rows authoritative.
    -- Per corp per class: row count == owned count.
    SELECT COUNT(*) INTO v_bad_owned FROM (
        SELECT ec.id
          FROM entrepreneur_corps ec
         WHERE ec.industry = 'airline'
           AND (
               (SELECT COUNT(*) FROM corp_aircraft WHERE entrepreneur_corp_id = ec.id AND aircraft_class = 'regional')   <> ec.aircraft_regional_owned
            OR (SELECT COUNT(*) FROM corp_aircraft WHERE entrepreneur_corp_id = ec.id AND aircraft_class = 'narrowbody') <> ec.aircraft_narrowbody_owned
            OR (SELECT COUNT(*) FROM corp_aircraft WHERE entrepreneur_corp_id = ec.id AND aircraft_class = 'widebody')   <> ec.aircraft_widebody_owned
           )
    ) bad;

    -- Per active route per class: assigned-row count == route denorm count.
    SELECT COUNT(*) INTO v_bad_route FROM (
        SELECT r.id
          FROM airline_routes r
         WHERE r.status = 'active' AND r.airline_corp_id IS NOT NULL
           AND (
               (SELECT COUNT(*) FROM corp_aircraft WHERE route_id = r.id AND aircraft_class = 'regional')   <> r.aircraft_regional
            OR (SELECT COUNT(*) FROM corp_aircraft WHERE route_id = r.id AND aircraft_class = 'narrowbody') <> r.aircraft_narrowbody
            OR (SELECT COUNT(*) FROM corp_aircraft WHERE route_id = r.id AND aircraft_class = 'widebody')   <> r.aircraft_widebody
           )
    ) bad;

    IF v_bad_owned > 0 THEN
        RAISE WARNING 'entrepreneur_aircraft backfill: % corp(s) have row counts that disagree with aircraft_*_owned', v_bad_owned;
    END IF;
    IF v_bad_route > 0 THEN
        RAISE WARNING 'entrepreneur_aircraft backfill: % active route(s) have assigned-row counts that disagree with denorm counts', v_bad_route;
    END IF;
    RAISE NOTICE 'entrepreneur_aircraft backfill verified (owned mismatches: %, route mismatches: %)', v_bad_owned, v_bad_route;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- BEGIN;
-- DELETE FROM corp_aircraft WHERE entrepreneur_corp_id IS NOT NULL;
-- ALTER TABLE public.corp_aircraft DROP CONSTRAINT IF EXISTS corp_aircraft_one_owner_chk;
-- ALTER TABLE public.corp_aircraft DROP COLUMN IF EXISTS entrepreneur_corp_id;
-- -- corp_id NOT NULL can be restored only once no entrepreneur rows remain:
-- ALTER TABLE public.corp_aircraft ALTER COLUMN corp_id SET NOT NULL;
-- -- sync_corp_fleet_slots reverts by re-running 20261020's body.
-- COMMIT;
