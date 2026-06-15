/**
 * stats.js — Nation stat columns, decay config, trends, and approval setup
 * Extracted from game-common.js
 */

// ==================== ADMINISTRATION LIFECYCLE ====================

/**
 * Canonical nation stat columns — the SINGLE SOURCE OF TRUTH.
 *
 * Every stat key in every effect table (policies, crises, events, ministry
 * actions, PM traits, diplomacy) MUST match one of these keys exactly.
 * If a legacy key exists in the database, add it to STAT_KEY_ALIASES below
 * so normalizeNationStatKey() can resolve it.
 *
 * Used by: processStatEffects, processEvents, processMinistryActions,
 *          processPMTraitEffects, auditStatKeys, snapshotNationHistory,
 *          administration snapshots.
 *
 * CANONICAL STAT KEY REFERENCE:
 *   --- Economic ---
 *   gdp                        GDP ($B)
 *   gdp_growth                 Annual economic growth rate
 *   debt                       Government debt obligations ($B)
 *   debt_growth                Rate of debt accumulation
 *   inflation                  Rate of price increases
 *   interest_rates             Central bank lending rate
 *   trade_balance              Exports minus imports
 *   currency_strength          Value of national currency
 *   foreign_investment         International capital inflow
 *   credit                     National creditworthiness
 *   --- Taxation ---
 *   income_tax                 Tax rate on personal income
 *   corporate_tax              Tax rate on business profits
 *   sales_tax                  Tax on goods and services
 *   tariffs                    Import/export duties
 *   --- Labor & Employment ---
 *   unemployment               Percentage without work
 *   labor_force_participation  Working-age adults employed
 *   minimum_wage               Lowest legal hourly wage
 *   union_strength             Power of labor unions
 *   poverty_rate               Population below poverty line
 *   income_inequality          Gap between rich and poor
 *   --- Demographics ---
 *   population                 Total population (raw number)
 *   population_growth          Rate of population change (standalone stat)
 *   median_age                 Average age of population
 *   eligible_voters            Citizens able to vote
 *   ethnic_diversity           Cultural heterogeneity
 *   --- Healthcare ---
 *   healthcare_quality         Overall medical care standard
 *   healthcare_accessibility   Access to medical services
 *   beds_per_100k              Hospital beds per 100,000 people  (NOT "hospital_beds")
 *   lifespan                   Average lifespan in years         (NOT "life_expectancy")
 *   drug_use                   Substance abuse prevalence
 *   --- Education ---
 *   literacy                   Population able to read/write     (NOT "literacy_rate")
 *   higher_education           University graduation rate        (NOT "education_quality")
 *   education_accessibility    Access to schooling
 *   academic_immigration       Scholars attracted to nation
 *   --- Infrastructure ---
 *   physical_infrastructure    Roads, bridges, ports, public works (NOT "infrastructure")
 *   digital_infrastructure     Internet and tech networks        (NOT "technology")
 *   rail_network               Train connectivity
 *   urbanization               Population in cities
 *   energy_generation          Power production capacity
 *   renewable_energy_percentage Clean energy percentage
 *   --- Resources ---
 *   arable_land                Farmable land area
 *   rare_minerals              Strategic mineral reserves
 *   oil_and_gas                Fossil fuel reserves
 *   fuel_prices                Consumer fuel costs
 *   --- Environment ---
 *   pollution                  Environmental contamination
 *   carbon_emissions           CO2 output
 *   --- Social ---
 *   standard_of_living         Quality of life index
 *   happiness                  Population wellbeing
 *   social_mobility            Ability to change economic class
 *   benefits                   Government welfare programs
 *   crime_rate                 Criminal activity level           (NOT "crime")
 *   incarceration_rate         Prison population per capita
 *   --- Religion ---
 *   religiosity                Religiosity index
 *   --- Governance ---
 *   stability                  Political stability               (also used for "military_strength")
 *   legitimacy                 Government legitimacy
 *   efficiency                 Bureaucratic efficiency
 *   corruption                 Government corruption
 *   press_freedom              Media independence
 *   judicial_independence      Court system independence
 *   freedom_index              Civil liberties composite
 *   polarization               Political division
 *   --- Security ---
 *   civil_unrest               Public disorder
 *   terrorism                  Terrorist threat level
 *   political_violence         Political violence
 *   --- Immigration ---
 *   immigration                Legal immigration rate
 *   illegal_immigration        Unauthorized entry rate
 *   emigration                 Citizens leaving
 *   --- International ---
 *   international_reputation   Global standing                   (NOT "diplomatic_standing")
 *   --- Economy (new) ---
 *   cost_of_living             Consumer cost burden (0-100, lower is better)
 *   manufacturing_output       Industrial production capacity (0-100)
 *   service_output             Services & finance sector output (0-100)
 *   housing_affordability      Housing accessibility (0-100, higher is better)
 */
// Alpha stats refactor — Phase 9 dropped the legacy stat columns; the
// canonical-stats Phase 2 (this commit) renamed `power` → `global_image`
// and split `workforce` → `unskilled_workers` + `skilled_workers`, plus
// added `wages` as a first-class stat (replacing the dropped legacy
// `minimum_wage`). Net: 23 + 4 − 2 = 25 alpha stats.
//
// Legacy stat keys (`power`, `workforce`, `minimum_wage`, etc.) still
// appear in event/policy stat_effects JSON across the codebase;
// STAT_KEY_ALIASES routes or null-filters them at apply time so the
// effect pipeline keeps working until Phase 3 rewrites every call site.
export const NATION_STAT_COLUMNS = [
    'gdp', 'gdp_growth', 'debt', 'immigration', 'standard_of_living', 'cost_of_living',
    'budget',
    'state_apparatus', 'unrest', 'public_approval', 'crown_authority',
    'energy', 'health', 'education', 'global_image',
    'infrastructure', 'industry', 'farmland',
    'service_sector', 'unskilled_workers', 'skilled_workers', 'wages',
    'income_tax', 'corporate_tax', 'crime', 'corruption',
    'inequality', 'minerals',
    // New System stats added in migration 20270393. Pure state — the
    // tick processor does not move them yet; whoever wires policies /
    // events / ministry actions decides their dynamics. The modifier
    // evaluator (js/game/modifiers.js) reads nation[key] generically,
    // so triggers anchored on these columns will start firing the
    // moment any future system writes to them.
    'civil_liberties', 'energy_generation',
    'food', 'food_generation',
    'minerals_generation',
    'consumer_goods', 'goods_generation',
    'luxury_goods', 'luxury_generation',
    'population_growth',
    // 20270944 — restored as real columns so Politicianverse policies can
    // target them. Pure state (nothing but policies moves them yet).
    'inflation', 'unemployment',
];

export const NATION_STAT_COLUMN_SET = new Set(NATION_STAT_COLUMNS);

// Phase 4 translation shim — maps old stat keys to the canonical 25-stat
// schema at apply time. Two value types:
//   * String: rename only (passes through to a live column)
//   * null:   stat is deleted in the alpha refactor with no replacement;
//             callers must skip the effect rather than fall through
//
// Direction-inverting aliases are tracked separately in
// INVERTED_ALIAS_KEYS — for those, the apply path also flips
// up↔down / negates delta so the semantics survive the rename.
//
// Canonical-stats Phase 5: source code (js/game/, *.html) has been
// converted to use canonical names directly. The aliases below are
// RETAINED to keep legacy stat_effects JSON working — events table
// rows, policy_options.stat_effects, bill_articles, executive_orders
// payloads, etc. all carry historical stat_key strings like
// 'international_reputation' / 'unemployment' / 'minimum_wage'. The
// aliases route them to the canonical columns at apply time so
// pre-Phase-5 saves keep behaving identically.
export const STAT_KEY_ALIASES = {
    // ── Direct renames into the alpha-25 schema ──
    civil_unrest:               'unrest',
    terrorism:                  'unrest',
    political_violence:         'unrest',
    healthcare_accessibility:   'health',
    healthcare_quality:         'health',
    lifespan:                   'health',
    beds_per_100k:              'health',
    physical_infrastructure:    'infrastructure',
    digital_infrastructure:     'infrastructure',
    rail_network:               'infrastructure',
    higher_education:           'education',
    education_quality:          'education',
    arable_land:                'farmland',
    manufacturing_output:       'industry',
    control:                    'state_apparatus',
    stability:                  'state_apparatus',
    military_strength:          'state_apparatus',
    hospital_beds:              'health',

    // ── Canonical-stats Phase 2: power → global_image ──
    // The six legacy underlying columns + the canonical `power` alias
    // all collapse into the new `global_image` column.
    power:                      'global_image',
    international_reputation:   'global_image',
    intl_reputation:            'global_image',
    diplomatic_standing:        'global_image',
    tourism:                    'global_image',
    trade_agreements:           'global_image',
    sanctions:                  'global_image',

    // ── Canonical-stats Phase 2: workforce split ──
    // Single workforce concept is split into two tiers. The mapping
    // policy (per design): urban legacy stat → skilled tier;
    // labor-force participation / unemployment → unskilled tier;
    // bare `workforce` legacy alias → unskilled (matches lfp/unemp
    // routing so historical bills don't change which tier they hit).
    workforce:                  'unskilled_workers',
    labor_force_participation:  'unskilled_workers',
    urbanization:               'skilled_workers',

    // ── Canonical-stats Phase 2: minimum_wage → wages ──
    minimum_wage:               'wages',

    // ── Phase 8.5.1 renames ──
    authority:                  'public_approval',
    legitimacy:                 'public_approval',  // legitimacy already aliased to authority pre-8.5; cascade to new name
    judicial_independence:      'public_approval',  // collapsed into public_approval per Phase 7H bills.js block
    goods:                      'service_sector',
    crime_rate:                 'crime',

    // ── DELETED stats — Phase 9 drops the column. Apply path skips. ──
    // Phase 8.5.2 restored income_tax / corporate_tax / corruption /
    // crime to the live alpha menu, so they're no longer in this list.
    religious:                  null,
    religiosity:                null,
    efficiency:                 null,
    happiness:                  null,
    polarization:               null,
    freedom_index:              null,
    GDP:                        'gdp',   // legacy uppercase key → canonical gdp column
    // inflation & unemployment — restored as real columns (20270944); their
    // alias entries are removed so the keys resolve to themselves.
    foreign_investment:         null,
    tariffs:                    null,
    credit:                     null,
    credit_rating:              null,
    credit_score:               null,
    literacy:                   null,
    literacy_rate:              null,
    academic_immigration:       null,
    oil_and_gas:                null,
    rare_minerals:              null,
    // energy_generation and population_growth — column now exists
    // (20270393). Alias entries removed so the key resolves to itself
    // and legacy stat-effect rows targeting them apply directly.
    fuel_prices:                null,
    pollution:                  null,
    social_mobility:            null,
    benefits:                   null,
    debt_growth:                null,
    union_strength:             null,
    illegal_immigration:        null,
    emigration:                 null,
    sales_tax:                  null,
    interest_rates:             null,
    poverty_rate:               null,
    income_inequality:          null,
    trade_balance:              null,
    trade:                      null,
    trade_volume:               null,
    currency_strength:          null,
    birth_rate:                 null,
    death_rate:                 null,
    median_age:                 null,
    carbon_emissions:           null,
    renewable_energy_percentage: null,
    press_freedom:              null,
    incarceration_rate:         null,
    drug_use:                   null,
    ethnic_diversity:           null,
    education_accessibility:    null,
    technology:                 null,
    service_output:             null,
    housing_affordability:      null,
};

// Old stat keys whose semantic direction is opposite of the new column
// they map to. e.g. unemployment → workforce: a bill that pushes
// unemployment UP is pushing workforce DOWN. The Phase 4 apply path
// flips `direction` (up↔down) and negates `delta` for these keys.
// Empty since 20270944 restored `unemployment` to a real (uninverted)
// column. Kept as the single hook for any future rename that needs the
// apply path to flip up↔down / negate delta.
export const INVERTED_ALIAS_KEYS = new Set([]);

export function normalizeNationStatKey(statKey) {
    if (!statKey || typeof statKey !== 'string') return null;
    // Use Object.hasOwn (not the `in` operator) so inherited Object.prototype
    // members like 'toString' / 'hasOwnProperty' / '__proto__' don't match
    // and leak the inherited method back to the caller. hasOwn also still
    // returns true for explicit null sentinels (DELETED-stat), unlike the
    // original `||` lookup which would have fallen through to the raw key.
    if (Object.hasOwn(STAT_KEY_ALIASES, statKey)) return STAT_KEY_ALIASES[statKey];
    return statKey;
}

/**
 * Phase 4 translation shim — re-maps a stat-effect entry from the legacy
 * key set onto the canonical 25-stat schema at apply time.
 *
 *   in:  { stat_key: 'civil_unrest', direction: 'up', rate: 0.5, ... }
 *   out: { stat_key: 'unrest',       direction: 'up', rate: 0.5, ... }
 *
 *   in:  { stat_key: 'unemployment',       direction: 'up', delta: 5 }
 *   out: { stat_key: 'unskilled_workers',  direction: 'down', delta: -5 }
 *
 *   in:  { stat_key: 'happiness', ... }   (DELETED)
 *   out: null
 *
 * Accepts both `stat_key` and `stat` shapes (the codebase uses both).
 * Returns null when the underlying stat was deleted by the alpha refactor
 * with no replacement — callers must skip these entries entirely.
 */
export function translateStatEffect(eff) {
    if (!eff || typeof eff !== 'object') return null;
    const oldKey = eff.stat_key || eff.stat || '';
    if (!oldKey) return null;

    const newKey = normalizeNationStatKey(oldKey);
    if (!newKey || !NATION_STAT_COLUMN_SET.has(newKey)) return null;

    const out = { ...eff, stat_key: newKey };
    if (out.stat) out.stat = newKey;

    if (INVERTED_ALIAS_KEYS.has(oldKey)) {
        if (out.direction === 'up') out.direction = 'down';
        else if (out.direction === 'down') out.direction = 'up';
        if (typeof out.delta === 'number') out.delta = -out.delta;
    }
    return out;
}

/**
 * Stats where HIGHER values are better (increase = achievement).
 * Canonical 25-stat schema. Excludes budget (flow, not 0-100), debt
 * (LOWER_IS_BETTER), and the two tax stats (income_tax, corporate_tax)
 * which are neutral player-controlled levers (high = revenue but
 * dampens growth — UI/momentum logic shouldn't auto-flag either
 * direction as good).
 */
export const STATS_HIGHER_IS_BETTER = [
    'gdp_growth', 'immigration', 'standard_of_living',
    'state_apparatus', 'public_approval', 'crown_authority',
    'energy', 'health', 'education', 'global_image',
    'infrastructure', 'industry', 'farmland', 'service_sector',
    'unskilled_workers', 'skilled_workers', 'wages',
];

/**
 * Stats where LOWER values are better (decrease = achievement).
 */
export const STATS_LOWER_IS_BETTER = [
    'debt', 'unrest', 'cost_of_living', 'crime', 'corruption',
    'inflation', 'unemployment',
];

// ==================== STAT DECAY CONFIGURATION ====================

const DECAY_SPEED = { CRAWL: 0.15, VERY_SLOW: 0.5, SLOW: 1, MEDIUM: 2, FAST: 3 };

/**
 * Stats that decay each tick. Two types:
 *   - 'equilibrium': drifts toward a midpoint (requires constant governing effort)
 *   - 'erosion': degrades toward a bad floor (punishes neglect)
 * Stats not listed are persistent — they hold value indefinitely.
 *
 * Canonical 25-stat schema. budget + debt are flow-based and not in here
 * (managed by budget.js / debt.js). crown_authority decays only when
 * the column is non-NULL — processStatDecay's null-guard at
 * political-actions.js:110 skips non-monarchies cleanly.
 *
 * Canonical-stats Phase 2: power and workforce removed (replaced by
 * global_image and unskilled_workers + skilled_workers). The four new
 * canonical stats (global_image, unskilled_workers, skilled_workers,
 * wages) intentionally have NO decay entries per design direction —
 * they hold the value policies / events set them to until decay rules
 * are introduced in a later phase.
 */
export const STAT_DECAY_CONFIG = {
    // ── Equilibrium (drift back to midpoint) ──
    gdp_growth:        { type: 'equilibrium', target: 50, speed: DECAY_SPEED.CRAWL },
    immigration:       { type: 'equilibrium', target: 50, speed: DECAY_SPEED.CRAWL },
    state_apparatus:   { type: 'equilibrium', target: 45, speed: DECAY_SPEED.CRAWL },
    unrest:            { type: 'equilibrium', target: 20, speed: DECAY_SPEED.CRAWL },
    public_approval:   { type: 'equilibrium', target: 40, speed: DECAY_SPEED.CRAWL },
    crown_authority:   { type: 'equilibrium', target: 50, speed: DECAY_SPEED.CRAWL },
    service_sector:    { type: 'equilibrium', target: 50, speed: DECAY_SPEED.CRAWL },

    // ── Erosion (degrade toward bad floor if neglected) ──
    standard_of_living: { type: 'erosion', target: 40, speed: DECAY_SPEED.CRAWL },
    cost_of_living:     { type: 'erosion', target: 70, speed: DECAY_SPEED.CRAWL },
    health:             { type: 'erosion', target: 30, speed: DECAY_SPEED.CRAWL },
    education:          { type: 'erosion', target: 30, speed: DECAY_SPEED.CRAWL },
    infrastructure:     { type: 'erosion', target: 0,  speed: DECAY_SPEED.CRAWL },
    industry:           { type: 'erosion', target: 0,  speed: DECAY_SPEED.CRAWL },
    energy:             { type: 'erosion', target: 0,  speed: DECAY_SPEED.CRAWL },
    farmland:           { type: 'erosion', target: 30, speed: DECAY_SPEED.CRAWL },
    crime:              { type: 'erosion', target: 70, speed: DECAY_SPEED.CRAWL },
    corruption:         { type: 'erosion', target: 70, speed: DECAY_SPEED.CRAWL },

    // income_tax + corporate_tax intentionally NOT in the decay table —
    // they're player-set levers (0-10 scale) that should hold the value
    // the player chose until a new bill or admin change moves them.
};

// Validate decay config keys at module load
for (const key of Object.keys(STAT_DECAY_CONFIG)) {
    if (!NATION_STAT_COLUMN_SET.has(key)) {
        console.error(`[STAT_DECAY_CONFIG] Invalid stat key: "${key}" — not in NATION_STAT_COLUMNS`);
    }
}

// ==================== THREE-PILLAR VOTING SYSTEM MAPPINGS ====================

/**
 * Maps each nation stat to the ministry responsible for it.
 * Used by performance perception to credit/blame ministry-holding parties.
 */
export const STAT_TO_MINISTRY = {
    // Finance
    gdp_growth: 'finance', inflation: 'finance', interest_rates: 'finance',
    currency_strength: 'finance', credit: 'finance',
    income_tax: 'finance', corporate_tax: 'finance', sales_tax: 'finance',
    // Healthcare
    healthcare_quality: 'healthcare', healthcare_accessibility: 'healthcare',
    beds_per_100k: 'healthcare', lifespan: 'healthcare', drug_use: 'healthcare',
    // Education
    literacy: 'education', higher_education: 'education',
    education_accessibility: 'education', academic_immigration: 'education',
    // Labor
    unemployment: 'labor', labor_force_participation: 'labor',
    minimum_wage: 'labor', union_strength: 'labor',
    poverty_rate: 'labor', income_inequality: 'labor',
    // Interior
    stability: 'interior',
    crime_rate: 'interior', incarceration_rate: 'interior',
    immigration: 'interior', illegal_immigration: 'interior',
    // Justice
    corruption: 'justice', judicial_independence: 'justice',
    press_freedom: 'justice', freedom_index: 'justice',
    // Energy
    energy_generation: 'energy', renewable_energy_percentage: 'energy',
    pollution: 'energy', carbon_emissions: 'energy',
    // Transportation
    physical_infrastructure: 'transportation', digital_infrastructure: 'transportation',
    rail_network: 'transportation', urbanization: 'transportation',
    // Defense
    terrorism: 'defense',
    // Security
    civil_unrest: 'security', political_violence: 'security',
    // Trade
    trade_balance: 'trade', manufacturing_output: 'trade', service_output: 'trade',
    tariffs: 'trade', foreign_investment: 'trade',
    // Foreign
    international_reputation: 'foreign', emigration: 'foreign',
    // Prime Minister (general governance & quality of life)
    legitimacy: 'prime_minister', efficiency: 'prime_minister', polarization: 'prime_minister',
    happiness: 'prime_minister', standard_of_living: 'prime_minister',
    social_mobility: 'prime_minister', benefits: 'prime_minister',
    fuel_prices: 'prime_minister', housing_affordability: 'prime_minister',
    // Finance
    cost_of_living: 'finance'
};

/**
 * Maps voter-bloc priority issue categories to the nation stats they care about.
 * Each bloc has 1-2 priority_issues (e.g., ['Economics', 'Labor']).
 */
export const ISSUE_CATEGORY_STATS = {
    Agriculture:     ['arable_land', 'fuel_prices', 'trade_balance', 'poverty_rate', 'cost_of_living', 'standard_of_living', 'happiness', 'pollution', 'carbon_emissions'],
    Economics:       ['gdp', 'gdp_growth', 'inflation', 'unemployment', 'currency_strength', 'trade_balance', 'debt', 'manufacturing_output', 'service_output'],
    Education:       ['literacy', 'higher_education', 'education_accessibility', 'academic_immigration'],
    Governance:      ['stability', 'legitimacy', 'efficiency', 'corruption', 'freedom_index'],
    Healthcare:      ['healthcare_quality', 'healthcare_accessibility', 'beds_per_100k', 'lifespan', 'drug_use'],
    Immigration:     ['immigration', 'illegal_immigration', 'emigration', 'ethnic_diversity'],
    Infrastructure:  ['physical_infrastructure', 'digital_infrastructure', 'rail_network', 'energy_generation', 'renewable_energy_percentage'],
    International:   ['international_reputation', 'foreign_investment'],
    Labor:           ['unemployment', 'labor_force_participation', 'minimum_wage', 'union_strength', 'poverty_rate', 'income_inequality', 'cost_of_living'],
    Military:        ['terrorism', 'political_violence', 'civil_unrest', 'stability'],
    Social:          ['standard_of_living', 'happiness', 'social_mobility', 'crime_rate', 'pollution', 'benefits', 'housing_affordability']
};

const _HIGHER_IS_BETTER_SET = new Set(STATS_HIGHER_IS_BETTER);
const _LOWER_IS_BETTER_SET  = new Set(STATS_LOWER_IS_BETTER);

/**
 * Returns +1 if a positive delta is "good", -1 if negative delta is "good", 0 if neutral.
 */
export function statDirectionSign(statKey) {
    if (_HIGHER_IS_BETTER_SET.has(statKey)) return 1;
    if (_LOWER_IS_BETTER_SET.has(statKey)) return -1;
    return 0;
}

// ==================== INFLATION FORMATTING ====================

/**
 * Inflation scale: 0-100 stat, no deflation (prices always go up).
 * Rate formula: stat^1.5 / 100  →  stat 1 = 0.01%, stat 100 = 10.0%
 */

export function inflationRate(inflationStat) {
    // Maps 0-100 stat to roughly -2% to +10%, with ~0% at stat 15
    // and the healthy 2% target around stat 38 (equilibrium)
    const val = Math.max(0, Math.min(100, Number(inflationStat ?? 0)));
    if (val <= 15) return -((15 - val) / 15) * 2;   // 0 → -2%, 15 → 0%
    return Math.pow(val - 15, 1.5) / 100;            // 15 → 0%, 38 → ~2.1%, 100 → ~7.8%
}

export function formatInflationRate(inflationStat) {
    const rate = inflationRate(inflationStat);
    if (Math.abs(rate) < 0.01) return '0%';
    const sign = rate >= 0 ? '+' : '';
    if (Math.abs(rate) < 1) return sign + rate.toFixed(2) + '%';
    return sign + rate.toFixed(1) + '%';
}

export function getInflationLabel(inflationStat) {
    const val = Number(inflationStat ?? 0);
    if (val <= 5)   return 'Severe Deflation';
    if (val <= 15)  return 'Deflation';
    if (val <= 25)  return 'Low Inflation';
    if (val <= 45)  return 'Stable';
    if (val <= 65)  return 'Moderate Inflation';
    if (val <= 85)  return 'High Inflation';
    return 'Hyperinflation';
}

export function inflationColorClass(inflationStat) {
    const val = Number(inflationStat ?? 0);
    if (val <= 15)  return 'bad';    // Deflation is harmful
    if (val <= 25)  return 'medium'; // Low but not dangerous
    if (val <= 45)  return 'good';   // Healthy range (equilibrium at 38)
    if (val <= 65)  return 'medium'; // Getting warm
    return 'bad';                    // High/hyperinflation
}

// ==================== FUEL PRICE DISPLAY ====================

/**
 * Convert the 0-100 fuel_prices stat to a dollars-per-gallon price,
 * adjusted by currency strength and inflation.
 * @param {number} fuelStat      - fuel_prices 0-100
 * @param {number} currencyStat  - currency_strength 0-100
 * @param {number} inflationStat - inflation 0-100
 * @returns {number} price in $/gallon
 */
export function fuelPricePerGallon(fuelStat, currencyStat, inflationStat) {
    const fuel = Math.max(0, Math.min(100, Number(fuelStat ?? 50)));
    const basePrice = 1.0 + (fuel / 100) * 7.0;  // $1.00 at 0, $8.00 at 100
    const currencyMult = 1.5 - (Math.max(0, Math.min(100, Number(currencyStat ?? 50))) / 100);
    const inflMult = Math.max(0.98, 1 + (inflationRate(inflationStat) / 100));
    return Math.round(basePrice * currencyMult * inflMult * 100) / 100;
}

export function formatFuelPrice(fuelStat, currencyStat, inflationStat) {
    const price = fuelPricePerGallon(fuelStat, currencyStat, inflationStat);
    return '$' + price.toFixed(2) + '/gal';
}

export function getFuelPriceLabel(fuelStat, currencyStat, inflationStat) {
    const price = fuelPricePerGallon(fuelStat, currencyStat, inflationStat);
    if (price < 2.00) return 'Cheap';
    if (price < 4.00) return 'Normal';
    if (price < 5.50) return 'Elevated';
    if (price < 7.00) return 'Expensive';
    return 'Crisis';
}

export function fuelPriceColorClass(fuelStat, currencyStat, inflationStat) {
    const price = fuelPricePerGallon(fuelStat, currencyStat, inflationStat);
    if (price < 4.00) return 'good';
    if (price < 5.50) return 'medium';
    return 'bad';
}

// ==================== STAT TREND CALCULATION ====================

/** Weights for weighted-average trend: most recent delta gets 0.40, oldest gets 0.05 */
const TREND_WEIGHTS = [0.05, 0.05, 0.10, 0.15, 0.25, 0.40];

/**
 * Weighted trend for a single stat over the last `lookback` ticks.
 * Returns a signed value: positive = rising, negative = falling.
 * Requires stat_history rows populated by recordStatHistory().
 *
 * @param {object} supabase
 * @param {string} nationId
 * @param {string} statName  - nation stat key (e.g. 'unemployment')
 * @param {number} [lookback=6] - how many tick-deltas to consider
 * @returns {Promise<number>} weighted trend value
 */
export async function statTrend(supabase, nationId, statName, lookback = 6) {
    const { data: rows } = await supabase
        .from('stat_history')
        .select('value, tick')
        .eq('nation_id', nationId)
        .eq('stat_name', statName)
        .order('tick', { ascending: true })
        .limit(lookback + 1);

    if (!rows || rows.length < 2) return 0;

    let weightedSum = 0;
    const deltas = rows.length - 1;
    for (let i = 1; i < rows.length; i++) {
        const delta = rows[i].value - rows[i - 1].value;
        const weightIdx = Math.max(0, TREND_WEIGHTS.length - deltas + i - 1);
        weightedSum += delta * (TREND_WEIGHTS[weightIdx] || 0.10);
    }
    return weightedSum;
}

/**
 * Batch version: compute weighted trends for multiple stats in a single query.
 * Returns { statName: trendValue, ... }.
 *
 * @param {object} supabase
 * @param {string} nationId
 * @param {string[]} statNames - array of stat keys
 * @param {number} [lookback=6]
 * @returns {Promise<Object.<string, number>>}
 */
export async function statTrendBatch(supabase, nationId, statNames, lookback = 6) {
    if (!statNames || statNames.length === 0) return {};

    const { data: rows } = await supabase
        .from('stat_history')
        .select('stat_name, value, tick')
        .eq('nation_id', nationId)
        .in('stat_name', statNames)
        .order('tick', { ascending: true });

    if (!rows || rows.length === 0) return {};

    // Group by stat_name
    const byName = {};
    for (const r of rows) {
        if (!byName[r.stat_name]) byName[r.stat_name] = [];
        byName[r.stat_name].push(r);
    }

    const trends = {};
    for (const [name, vals] of Object.entries(byName)) {
        const recent = vals.slice(-(lookback + 1));
        if (recent.length < 2) { trends[name] = 0; continue; }
        let weightedSum = 0;
        const deltas = recent.length - 1;
        for (let i = 1; i < recent.length; i++) {
            const delta = recent[i].value - recent[i - 1].value;
            const weightIdx = Math.max(0, TREND_WEIGHTS.length - deltas + i - 1);
            weightedSum += delta * (TREND_WEIGHTS[weightIdx] || 0.10);
        }
        trends[name] = weightedSum;
    }
    return trends;
}

// ==================== MINISTER & GOVERNMENT APPROVAL SYSTEM ====================
// Simplified "Drift-to-Performance" model:
//   - Minister approval drifts toward the average performance of their owned stats
//   - Government approval = average minister approval + vacancy penalty + event modifier

/**
 * Reverse map: ministry_key → [stat_keys] derived from STAT_TO_MINISTRY.
 * Used by the per-tick minister approval calculation to find which stats
 * each minister "owns".
 */
export const MINISTRY_TO_STATS = {};
for (const [statKey, ministryKey] of Object.entries(STAT_TO_MINISTRY)) {
    if (!MINISTRY_TO_STATS[ministryKey]) MINISTRY_TO_STATS[ministryKey] = [];
    MINISTRY_TO_STATS[ministryKey].push(statKey);
}

/**
 * Build a stat_baselines object for a ministry: { statKey: currentValue, ... }
 * Only includes stats with a non-zero direction sign (skips neutral stats like taxes).
 *
 * @param {string} ministryKey - e.g. 'finance', 'labor'
 * @param {object} nation - nation row with current stat values
 * @returns {object} baseline snapshot for the ministry's owned stats
 */
export function buildMinistryBaselines(ministryKey, nation) {
    const stats = MINISTRY_TO_STATS[ministryKey];
    if (!stats) return {};
    const baselines = {};
    for (const statKey of stats) {
        if (statDirectionSign(statKey) === 0) continue;
        baselines[statKey] = Number(nation[statKey] ?? 50);
    }
    return baselines;
}

/**
 * Delta-based approval system configuration.
 *
 * Minister approval starts at 50 and moves based on how their owned stats
 * change relative to their baseline (snapshot at appointment time).
 * Pure delta model: ministers are judged on improvement, not inherited state.
 *
 * Government approval = avg(filled minister approvals) + vacancy penalty + event modifier.
 */
export const MINISTER_APPROVAL_CONFIG = {
    // Per-tick sensitivity: how much each point of average delta moves approval
    DELTA_SENSITIVITY: 0.4,

    // Baseline decay: approval always erodes by this amount per tick unless stats improve
    BASELINE_DECAY: -0.5,

    // New minister starts at 50% approval (clean slate on appointment)
    NEW_MINISTER_APPROVAL: 50,

    // Firing a minister costs 1 AP and gives +3 to the event modifier
    FIRE_MINISTER_AP_COST: 1,
    FIRE_GOV_APPROVAL_BONUS: 3,

    // Government approval: -0.1 per vacant ministry per tick
    VACANCY_PENALTY: -0.1,

    // Government approval floor: even the worst government retains some support
    APPROVAL_FLOOR: 15,

    // Event modifier decay: 10% per tick (transient shocks fade naturally)
    EVENTS_DECAY_RATE: 0.10,

    // Legislative activity: bonus to gov_approval_events when a bill passes
    BILL_PASSAGE_EVENT_BONUS: 1,

};

/**
 * Snapshot all nation stats into a flat JSONB object.
 */
export function snapshotNationStats(nation) {
    const snapshot = {};
    for (const key of NATION_STAT_COLUMNS) {
        if (nation[key] !== undefined && nation[key] !== null) {
            snapshot[key] = nation[key];
        }
    }
    return snapshot;
}
