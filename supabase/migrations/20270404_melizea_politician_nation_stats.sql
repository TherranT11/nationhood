-- ════════════════════════════════════════════════════════════════════
-- MELIZEA — set politician-tab nation stats
-- ════════════════════════════════════════════════════════════════════
-- The politician_* columns (added in 20270363) seed at the schema
-- defaults — $500B GDP, $100B budget, $100B debt, 50/50 stability /
-- civil freedoms — for any nation that hasn't been authored. Melizea
-- was sitting on the (zeroed-out) initial values for GDP/budget/debt
-- and the unscored 50 default for the two indices, which read as a
-- blank slate in the politician nation hero.
--
-- These values come straight from the design pass on Melizea's
-- starting fiscal posture: oil-rents economy in the low hundreds of
-- billions, a mid-sized public budget, debt running well above
-- annual revenue, stability and civil freedoms a hair above neutral
-- to reflect a constrained-but-functioning state. Same shape the
-- design doc already implies; no formula derivation here, just the
-- one-time seed.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

UPDATE nations
   SET politician_gdp            = 117300000000,   -- $117.3B
       politician_budget         =  46000000000,   --  $46.0B
       politician_debt           = 196000000000,   -- $196.0B
       politician_stability      = 78,
       politician_civil_freedoms = 71
 WHERE name = 'Melizea';

COMMIT;
