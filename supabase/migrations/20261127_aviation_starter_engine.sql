-- ════════════════════════════════════════════════════════════════
-- Aviation Manufacturing — starter engine "Airline Engine 1"
--
-- Every Aviation Manufacturing corp gets one pre-completed engine
-- design with a small starter inventory so manufacturers can design
-- + produce aircraft from day one without going through engine R&D
-- first. Caps the bootstrap problem where the RFP marketplace is
-- dead because no one has aircraft inventory yet.
--
-- Why per-corp instead of universal: produce_design_run gates with
-- `IF v_engine.corp_id <> p_corp_id THEN error 'cross-corp engine
-- sourcing not yet supported'`. Cross-corp engine use is blocked
-- server-side, so each corp needs their own row. Same name + same
-- stats across all corps — only the corp_id (and id) differs.
--
-- Inventory of 30 = a finite starter pool. With single-engine
-- airframes the corp can produce 30 aircraft before depleting it,
-- forcing eventual R&D into a real engine of their own (or sourcing
-- from another corp once cross-corp engine sourcing ships).
--
-- Idempotent: backfill skips corps that already have a row named
-- 'Airline Engine 1'; trigger has the same NOT EXISTS guard so
-- re-running this migration is safe.
-- ════════════════════════════════════════════════════════════════

BEGIN;

-- ── Backfill: existing AM corps ────────────────────────────────
INSERT INTO public.corp_aircraft_designs (
    corp_id, design_type, name, modules,
    thrust, weight, efficiency, reliability, quality, cost_per_unit,
    inventory_on_hand,
    status,
    research_ticks_total, research_ticks_remaining,
    created_at_tick, completed_at_tick,
    is_active
)
SELECT
    f.id, 'engine', 'Airline Engine 1',
    '{"starter": true, "combustion": "single-stage", "frame": "steel-casting", "control": "mechanical-governor"}'::jsonb,
    2.0, 2.0, 30, 30, 25.0, 2000000,
    30,
    'available',
    0, 0,
    0, 0,
    TRUE
FROM public.factions f
WHERE f.faction_type = 'corporation'
  AND f.corp_sector  = 'Aviation Manufacturing'
  AND f.abandoned_at IS NULL
  AND NOT EXISTS (
      SELECT 1 FROM public.corp_aircraft_designs d
       WHERE d.corp_id = f.id AND d.name = 'Airline Engine 1'
  );

-- ── Trigger: seed for newly-founded AM corps ───────────────────
-- Mirrors the trg_corp_ownership_auto_seed pattern in
-- 20260508_corp_ownership_auto_seed.sql so every UI/RPC insert
-- path picks it up without code changes.
CREATE OR REPLACE FUNCTION aviation_starter_engine_auto_seed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.faction_type IS DISTINCT FROM 'corporation'
       OR NEW.corp_sector IS DISTINCT FROM 'Aviation Manufacturing' THEN
        RETURN NEW;
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.corp_aircraft_designs
         WHERE corp_id = NEW.id AND name = 'Airline Engine 1'
    ) THEN
        RETURN NEW;
    END IF;

    INSERT INTO public.corp_aircraft_designs (
        corp_id, design_type, name, modules,
        thrust, weight, efficiency, reliability, quality, cost_per_unit,
        inventory_on_hand,
        status,
        research_ticks_total, research_ticks_remaining,
        created_at_tick, completed_at_tick,
        is_active
    ) VALUES (
        NEW.id, 'engine', 'Airline Engine 1',
        '{"starter": true, "combustion": "single-stage", "frame": "steel-casting", "control": "mechanical-governor"}'::jsonb,
        2.0, 2.0, 30, 30, 25.0, 2000000,
        30,
        'available',
        0, 0,
        0, 0,
        TRUE
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_aviation_starter_engine_auto_seed ON public.factions;
CREATE TRIGGER trg_aviation_starter_engine_auto_seed
    AFTER INSERT ON public.factions
    FOR EACH ROW
    EXECUTE FUNCTION aviation_starter_engine_auto_seed();

COMMENT ON FUNCTION aviation_starter_engine_auto_seed() IS
    'AFTER INSERT trigger on factions: seeds an "Airline Engine 1" row in corp_aircraft_designs (inventory 30, status available) so new Aviation Manufacturing corps can immediately design + produce aircraft. Idempotent. Skips non-corporation rows and corps in other sectors.';

COMMIT;

NOTIFY pgrst, 'reload schema';
