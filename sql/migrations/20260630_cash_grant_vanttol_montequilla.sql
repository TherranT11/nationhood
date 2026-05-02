-- ══════════════════════════════════════════════════════════════
-- One-time cash grant: +$50M to two corps that ran insolvent
-- (Vanttol Group, Montequilla Constructions) so we can diagnose
-- the bleed without their dashboards stuck at $0.
--
-- One-shot migration; safe to skip if either corp already has
-- positive cash. NUMERIC arithmetic in $1 units.
-- ══════════════════════════════════════════════════════════════

UPDATE factions
   SET corp_cash_reserves = corp_cash_reserves + 50000000
 WHERE faction_type = 'corporation'
   AND faction_name IN ('Vanttol Group', 'Montequilla Constructions');

NOTIFY pgrst, 'reload schema';
