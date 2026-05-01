-- ══════════════════════════════════════════════════════════════
-- Reset every Shipping corp's three sector stats to founding values:
--   corp_freighters   = 3
--   corp_fleet_health = 5
--   corp_route_risk   = 0   (INVERTED stat — high = bad, 0 = clean)
--
-- Mirrors the 20260609 founding seed but applied as a re-seed.
-- Defensive against partial migration history — gated by an
-- information_schema EXISTS check on corp_freighters so it runs
-- cleanly whether 20260609 has been applied yet or not.
-- ══════════════════════════════════════════════════════════════

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'factions'
           AND column_name = 'corp_freighters'
    ) THEN
        UPDATE factions
           SET corp_freighters   = 3,
               corp_fleet_health = 5,
               corp_route_risk   = 0
         WHERE faction_type = 'corporation'
           AND corp_sector  = 'Shipping';
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
