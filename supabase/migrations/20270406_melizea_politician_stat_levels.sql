-- ════════════════════════════════════════════════════════════════════
-- MELIZEA — Politician-system stat levels (design pass)
-- ════════════════════════════════════════════════════════════════════
-- Sets the 28 nation-stat columns that drive the modifier-trigger
-- evaluator (NATION_STAT_COLUMNS in js/game/stats.js, surfaced in
-- modifieradmin.html's NATION_STATS list) to the design-locked Alpha
-- Melizea values: a stressed-but-functioning petrostate with brain
-- drain, endemic corruption, eroded public services, low domestic
-- industry, and strong energy generation. The reasoning the design
-- ships next to each value:
--
--   STABILITY/POLITICS
--     state_apparatus      52   functional but on guard
--     civil_liberties      48   restricted-but-livable
--     crime                62   notably elevated
--     corruption           72   endemic, past the 65 Endemic-Corruption line
--
--   ECONOMY (0-100 scores, NOT dollars — politician_gdp/budget/debt
--   carry the dollar amounts on the hero card; left untouched here.)
--     gdp                  48   resources present, management absent
--     gdp_growth           38   slow recession, not depression
--     income_tax           32   light, petro-revenue does much of the work
--     corporate_tax        35   slightly higher, ideological framing
--
--   SECTORS
--     industry             22   triggers Resource Dependent
--     service_sector       38   informal-heavy, formal small
--     skilled_workers      24   brain drain
--
--   PUBLIC SERVICES
--     health               42   crowded, undersupplied — failing tier low
--     education            48   slipping, private schools growing
--     infrastructure       44   crumbling, maintenance deferred
--
--   WAGES & LIVING COSTS
--     wages                38   real wages eroded for years
--     cost_of_living       66   imports expensive, subsidies leak
--     standard_of_living   31   activates A Country in Hardship
--
--   RESOURCES — ENERGY
--     energy_generation    82   activates Energy Self-Sufficient
--     energy               70   strategic reserves comfortable
--
--   RESOURCES — FOOD
--     food_generation      36   triggers Food Imported From Abroad
--     food                 42   stockpiles stressed, periodic shortages
--
--   RESOURCES — MINERALS
--     minerals_generation  58   moderate, inefficient extraction
--     minerals             52   not strategically threatened
--
--   GOODS
--     consumer_goods       38   uneven shelves, black market thrives
--     goods_generation     28   weak domestic, imports dominate
--     luxury_goods         44   available to those who can afford them
--     luxury_generation    22   imported by the political class
--
--   DEMOGRAPHIC
--     population_growth    42   stagnant; emigration offsets births
--
-- ── Politician hero realignment ─────────────────────────────────────
-- The politician_stability + politician_civil_freedoms columns power
-- the hero bars on politician-nation.html. 20270404 seeded those at
-- 78 / 71 (the earlier design pass). This pass refines Stability →
-- 52 and Civil Liberties → 48; the hero columns are realigned to
-- match so the hero card and the modifier surface read the same
-- characterization. politician_gdp / politician_budget /
-- politician_debt stay at the 20270404 dollar values ($117.3B / $46B
-- / $196B) — those are the hero's money columns and this pass didn't
-- revise the dollar amounts.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

UPDATE nations
   SET state_apparatus      = 52,
       civil_liberties      = 48,
       crime                = 62,
       corruption           = 72,
       gdp                  = 48,
       gdp_growth           = 38,
       income_tax           = 32,
       corporate_tax        = 35,
       industry             = 22,
       service_sector       = 38,
       skilled_workers      = 24,
       health               = 42,
       education            = 48,
       infrastructure       = 44,
       wages                = 38,
       cost_of_living       = 66,
       standard_of_living   = 31,
       energy_generation    = 82,
       energy               = 70,
       food_generation      = 36,
       food                 = 42,
       minerals_generation  = 58,
       minerals             = 52,
       consumer_goods       = 38,
       goods_generation     = 28,
       luxury_goods         = 44,
       luxury_generation    = 22,
       population_growth    = 42,
       -- Realign hero columns with the modifier-trigger values so the
       -- politician hero card and the modifier surface tell the same
       -- story; supersedes the 78 / 71 in 20270404.
       politician_stability      = 52,
       politician_civil_freedoms = 48
 WHERE name = 'Melizea';

COMMIT;
