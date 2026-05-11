-- ════════════════════════════════════════════════════════════════
-- Airline Engine 1 — thrust revision so it can actually fly
--
-- The original stats (thrust 2, weight 2) couldn't sustain a
-- Narrowbody on 2 engines or a Widebody on 4 (12 thrust vs 10 +
-- engine weight; 8 vs 18 respectively). The starter engine's
-- entire purpose is to let a fresh manufacturer build SOMETHING,
-- so it has to clear the thrust:weight gate on every airframe
-- class the game lets them attempt.
--
-- New stats: thrust 6, weight 2 (cost / efficiency / reliability /
-- quality unchanged). Margin table at 1× engine:
--     Business   2 eng: 12 vs 6  (margin 6)
--     Regional   2 eng: 12 vs 7  (margin 5)
--     Narrowbody 2 eng: 12 vs 10 (margin 2)
--     Widebody   4 eng: 24 vs 18 (margin 6)
--
-- Note: thrust 6 is above the best player-designed Tier-1 engine
-- (5.5 = high-pressure + magnesium + early-electronic). The 30-
-- unit inventory cap is the only thing keeping this from being
-- permanently optimal — once a manufacturer burns through 30
-- engines they're forced into real R&D.
-- ════════════════════════════════════════════════════════════════

BEGIN;

-- ── Backfill: update existing starter engine rows ──────────────
UPDATE public.corp_aircraft_designs
   SET thrust = 6.0
 WHERE design_type = 'engine'
   AND name = 'Airline Engine 1'
   AND modules ? 'starter'
   AND (modules->>'starter')::boolean = TRUE;

-- ── Replace the trigger function with the new stats ────────────
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
        6.0, 2.0, 30, 30, 25.0, 2000000,
        30,
        'available',
        0, 0,
        0, 0,
        TRUE
    );

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION aviation_starter_engine_auto_seed() IS
    'AFTER INSERT trigger on factions: seeds an "Airline Engine 1" row in corp_aircraft_designs (thrust 6, weight 2, inventory 30, status available) so new Aviation Manufacturing corps can immediately design + produce aircraft across all four airframe classes. Idempotent.';

COMMIT;

NOTIFY pgrst, 'reload schema';
