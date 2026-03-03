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
 * Used by: processStatEffects, processCrises, processEvents,
 *          processMinistryActions, processPMTraitEffects, auditStatKeys,
 *          snapshotNationHistory, administration snapshots.
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
 *   population_growth          Rate of population change
 *   birth_rate                 Births per 1,000 people
 *   death_rate                 Deaths per 1,000 people
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
 *   religious                  Religiosity index
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
 *   trade_agreements           Number of trade agreements        (NOT "trade")
 *   sanctions                  Active sanctions against nation
 */
export const NATION_STAT_COLUMNS = [
    'gdp', 'gdp_growth', 'debt', 'debt_growth', 'inflation', 'interest_rates',
    'trade_balance', 'currency_strength', 'foreign_investment', 'credit',
    'income_tax', 'corporate_tax', 'sales_tax', 'tariffs',
    'unemployment', 'labor_force_participation', 'minimum_wage', 'union_strength',
    'poverty_rate', 'income_inequality',
    'population', 'population_growth', 'birth_rate', 'death_rate', 'median_age', 'eligible_voters', 'ethnic_diversity',
    'healthcare_quality', 'healthcare_accessibility', 'beds_per_100k', 'lifespan', 'drug_use',
    'literacy', 'higher_education', 'education_accessibility', 'academic_immigration',
    'physical_infrastructure', 'digital_infrastructure', 'rail_network', 'urbanization', 'energy_generation', 'renewable_energy_percentage',
    'arable_land', 'rare_minerals', 'oil_and_gas', 'fuel_prices',
    'pollution', 'carbon_emissions',
    'standard_of_living', 'happiness', 'social_mobility', 'benefits', 'crime_rate', 'incarceration_rate',
    'religious',
    'stability', 'legitimacy', 'efficiency', 'corruption', 'press_freedom', 'judicial_independence',
    'freedom_index', 'polarization',
    'civil_unrest', 'terrorism', 'political_violence',
    'immigration', 'illegal_immigration', 'emigration',
    'international_reputation', 'trade_agreements', 'sanctions'
];

export const NATION_STAT_COLUMN_SET = new Set(NATION_STAT_COLUMNS);

export const STAT_KEY_ALIASES = {
    intl_reputation: 'international_reputation',
    diplomatic_standing: 'international_reputation',
    credit_rating: 'credit',
    credit_score: 'credit',
    trade: 'trade_balance',
    trade_volume: 'trade_balance',
    education: 'higher_education',
    education_quality: 'higher_education',
    military_strength: 'stability',
    literacy_rate: 'literacy',
    hospital_beds: 'beds_per_100k',
    technology: 'digital_infrastructure',
    infrastructure: 'physical_infrastructure',
    tourism: 'international_reputation'
};

export function normalizeNationStatKey(statKey) {
    if (!statKey || typeof statKey !== 'string') return null;
    return STAT_KEY_ALIASES[statKey] || statKey;
}

/**
 * Stats where HIGHER values are better (increase = achievement).
 */
export const STATS_HIGHER_IS_BETTER = [
    'gdp', 'gdp_growth', 'currency_strength', 'foreign_investment', 'credit',
    'labor_force_participation', 'minimum_wage', 'union_strength',
    'population_growth', 'eligible_voters', 'ethnic_diversity',
    'healthcare_quality', 'healthcare_accessibility', 'beds_per_100k', 'lifespan',
    'literacy', 'higher_education', 'education_accessibility', 'academic_immigration',
    'physical_infrastructure', 'digital_infrastructure', 'rail_network', 'energy_generation', 'renewable_energy_percentage',
    'arable_land', 'rare_minerals',
    'standard_of_living', 'happiness', 'social_mobility', 'benefits',
    'stability', 'legitimacy', 'efficiency', 'press_freedom', 'judicial_independence', 'freedom_index',
    'immigration', 'international_reputation', 'trade_agreements'
];

/**
 * Stats where LOWER values are better (decrease = achievement).
 */
export const STATS_LOWER_IS_BETTER = [
    'debt', 'debt_growth', 'inflation', 'interest_rates',
    'unemployment', 'poverty_rate', 'income_inequality', 'death_rate',
    'drug_use', 'fuel_prices', 'pollution', 'carbon_emissions',
    'crime_rate', 'incarceration_rate', 'corruption', 'polarization',
    'civil_unrest', 'terrorism', 'political_violence',
    'illegal_immigration', 'emigration', 'sanctions'
];

// ==================== STAT DECAY CONFIGURATION ====================

const DECAY_SPEED = { CRAWL: 0.25, VERY_SLOW: 0.5, SLOW: 1, MEDIUM: 2, FAST: 3 };

/**
 * Stats that decay each tick. Two types:
 *   - 'equilibrium': drifts toward a midpoint (requires constant governing effort)
 *   - 'erosion': degrades toward a bad floor (punishes neglect)
 * Stats not listed are persistent — they hold value indefinitely.
 */
export const STAT_DECAY_CONFIG = {
    // ── Equilibrium (drift back to midpoint) ──
    inflation:           { type: 'equilibrium', target: 28, speed: DECAY_SPEED.CRAWL },
    interest_rates:      { type: 'equilibrium', target: 50, speed: DECAY_SPEED.CRAWL },
    currency_strength:   { type: 'equilibrium', target: 50, speed: DECAY_SPEED.CRAWL },
    civil_unrest:        { type: 'equilibrium', target: 20, speed: DECAY_SPEED.CRAWL },
    polarization:        { type: 'equilibrium', target: 30, speed: DECAY_SPEED.CRAWL },
    terrorism:           { type: 'equilibrium', target: 10, speed: DECAY_SPEED.CRAWL },
    political_violence:  { type: 'equilibrium', target: 10, speed: DECAY_SPEED.CRAWL },
    happiness:           { type: 'equilibrium', target: 50, speed: DECAY_SPEED.CRAWL },
    foreign_investment:  { type: 'equilibrium', target: 50, speed: DECAY_SPEED.CRAWL },
    trade_balance:       { type: 'equilibrium', target: 50, speed: DECAY_SPEED.CRAWL },
    gdp_growth:          { type: 'equilibrium', target: 50, speed: DECAY_SPEED.CRAWL },
    immigration:         { type: 'equilibrium', target: 50, speed: DECAY_SPEED.CRAWL },
    illegal_immigration: { type: 'equilibrium', target: 30, speed: DECAY_SPEED.CRAWL },
    emigration:          { type: 'equilibrium', target: 30, speed: DECAY_SPEED.CRAWL },
    fuel_prices:         { type: 'equilibrium', target: 50, speed: DECAY_SPEED.CRAWL },
    debt_growth:         { type: 'equilibrium', target: 50, speed: DECAY_SPEED.CRAWL },

    // ── Erosion (degrade toward bad floor if neglected) ──
    physical_infrastructure:  { type: 'erosion', target: 0,  speed: DECAY_SPEED.CRAWL },
    digital_infrastructure:   { type: 'erosion', target: 0,  speed: DECAY_SPEED.CRAWL },
    rail_network:             { type: 'erosion', target: 0,  speed: DECAY_SPEED.CRAWL },
    energy_generation:        { type: 'erosion', target: 0,  speed: DECAY_SPEED.CRAWL },
    efficiency:               { type: 'erosion', target: 30, speed: DECAY_SPEED.CRAWL },
    corruption:               { type: 'erosion', target: 70, speed: DECAY_SPEED.CRAWL },
    healthcare_quality:       { type: 'erosion', target: 30, speed: DECAY_SPEED.CRAWL },
    healthcare_accessibility: { type: 'erosion', target: 30, speed: DECAY_SPEED.CRAWL },
    beds_per_100k:            { type: 'erosion', target: 20, speed: DECAY_SPEED.CRAWL },
    education_accessibility:  { type: 'erosion', target: 30, speed: DECAY_SPEED.CRAWL },
    press_freedom:            { type: 'erosion', target: 40, speed: DECAY_SPEED.CRAWL },
    judicial_independence:    { type: 'erosion', target: 40, speed: DECAY_SPEED.CRAWL },
    freedom_index:            { type: 'erosion', target: 40, speed: DECAY_SPEED.CRAWL },
    standard_of_living:       { type: 'erosion', target: 40, speed: DECAY_SPEED.CRAWL },
    social_mobility:          { type: 'erosion', target: 30, speed: DECAY_SPEED.CRAWL },
    benefits:                 { type: 'erosion', target: 0,  speed: DECAY_SPEED.CRAWL },
};

// Validate decay config keys at module load
for (const key of Object.keys(STAT_DECAY_CONFIG)) {
    if (!NATION_STAT_COLUMN_SET.has(key)) {
        console.error(`[STAT_DECAY_CONFIG] Invalid stat key: "${key}" — not in NATION_STAT_COLUMNS`);
    }
}

// ==================== STAT → VOTER BLOC REACTIONS ====================
// When a stat changes during a tick, apply momentum to a specific voter bloc.
// rate_up:   momentum per 1-point increase (negative = bad for bloc)
// rate_down: momentum per 1-point decrease (positive = good for bloc)
export const STAT_BLOC_REACTIONS = [
    { stat: 'corporate_tax', bloc_name: 'Business Owners', rate_up: -2.5, rate_down: 1.0 },
];

// ==================== INSTITUTION FUNDING DECAY TIERS ====================
// Institutions counteract natural stat decay. At 100% funding, decay is fully
// blocked. Below 100%, the rates below REPLACE the natural decay rate for stats
// covered by that institution. When multiple institutions cover the same stat,
// their rates are averaged.

export const INSTITUTION_DECAY_TIERS = [
    { minPct: 100, primary: 0,    secondary: 0    },  // Fully Funded
    { minPct: 90,  primary: 0.3,  secondary: 0    },  // Stretched
    { minPct: 75,  primary: 0.5,  secondary: 0.2  },  // Strained
    { minPct: 50,  primary: 0.9,  secondary: 0.5  },  // Underfunded
    { minPct: 25,  primary: 1.7,  secondary: 0.9  },  // Critical
    { minPct: 0,   primary: 2.7,  secondary: 1.7  },  // Collapsed
];

/**
 * Look up the institution decay rate for a given funding percentage.
 * @param {number} fundingPct - 0-100 funding percentage
 * @param {'primary'|'secondary'} role - whether this stat is the institution's primary or secondary
 * @returns {number} decay rate per tick (0 = no decay)
 */
export function getInstitutionDecayRate(fundingPct, role) {
    for (const tier of INSTITUTION_DECAY_TIERS) {
        if (fundingPct >= tier.minPct) return tier[role];
    }
    return INSTITUTION_DECAY_TIERS[INSTITUTION_DECAY_TIERS.length - 1][role];
}

/**
 * Build a map of statKey → array of { institutionId, role, fundingPct } from
 * institution config rows and budget_item_allocations for the active budget.
 *
 * @param {Array} instConfig - rows from ministry_institution_config
 * @param {Array} itemAllocations - rows from budget_item_allocations for the active bill
 * @returns {Object} e.g. { healthcare_quality: [{ id: 'workforce', role: 'primary', fundingPct: 85 }, ...] }
 */
export function buildStatInstitutionMap(instConfig, itemAllocations) {
    const allocMap = {};
    for (const row of (itemAllocations || [])) {
        if (row.item_type === 'institution') {
            allocMap[row.item_id] = {
                allocated: Number(row.allocation_amount || 0),
                needed: Number(row.needed_amount || 0)
            };
        }
    }

    const statMap = {};
    for (const inst of (instConfig || [])) {
        const alloc = allocMap[inst.id];
        const fundingPct = alloc && alloc.needed > 0
            ? Math.min(100, Math.round((alloc.allocated / alloc.needed) * 100))
            : 0;  // no allocation row = unfunded

        for (const role of ['primary', 'secondary']) {
            const statKey = inst[`${role}_stat`];
            if (!statKey) continue;
            if (!statMap[statKey]) statMap[statKey] = [];
            statMap[statKey].push({ id: inst.id, role, fundingPct });
        }
    }
    return statMap;
}

/**
 * For a given stat, compute the effective institution decay rate by averaging
 * all institutions that cover it (as primary or secondary).
 *
 * @param {Array} institutions - entries from buildStatInstitutionMap()[statKey]
 * @returns {number|null} averaged decay rate, or null if no institutions cover this stat
 */
export function getAveragedInstitutionDecay(institutions) {
    if (!institutions || institutions.length === 0) return null;
    let total = 0;
    for (const inst of institutions) {
        total += getInstitutionDecayRate(inst.fundingPct, inst.role);
    }
    return total / institutions.length;
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
    death_rate: 'healthcare',
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
    trade_balance: 'trade', trade_agreements: 'trade',
    tariffs: 'trade', foreign_investment: 'trade',
    // Foreign
    international_reputation: 'foreign',
    sanctions: 'foreign', emigration: 'foreign',
    // Prime Minister (general governance & quality of life)
    legitimacy: 'prime_minister', efficiency: 'prime_minister', polarization: 'prime_minister',
    happiness: 'prime_minister', standard_of_living: 'prime_minister',
    social_mobility: 'prime_minister', benefits: 'prime_minister',
    fuel_prices: 'prime_minister'
};

/**
 * Maps voter-bloc priority issue categories to the nation stats they care about.
 * Each bloc has 1-2 priority_issues (e.g., ['Economics', 'Labor']).
 */
export const ISSUE_CATEGORY_STATS = {
    Agriculture:     ['arable_land', 'fuel_prices', 'trade_balance', 'poverty_rate'],
    Economics:       ['gdp', 'gdp_growth', 'inflation', 'unemployment', 'currency_strength', 'trade_balance', 'debt'],
    Education:       ['literacy', 'higher_education', 'education_accessibility', 'academic_immigration'],
    Governance:      ['stability', 'legitimacy', 'efficiency', 'corruption', 'freedom_index'],
    Healthcare:      ['healthcare_quality', 'healthcare_accessibility', 'beds_per_100k', 'lifespan', 'drug_use'],
    Immigration:     ['immigration', 'illegal_immigration', 'emigration', 'ethnic_diversity'],
    Infrastructure:  ['physical_infrastructure', 'digital_infrastructure', 'rail_network', 'energy_generation', 'renewable_energy_percentage'],
    International:   ['international_reputation', 'trade_agreements', 'sanctions', 'foreign_investment'],
    Labor:           ['unemployment', 'labor_force_participation', 'minimum_wage', 'union_strength', 'poverty_rate', 'income_inequality'],
    Military:        ['terrorism', 'political_violence', 'civil_unrest', 'stability'],
    Social:          ['standard_of_living', 'happiness', 'social_mobility', 'crime_rate', 'pollution', 'benefits']
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
 * Inflation scale: 20 = 0% (stable), 0 = -10% (deflation), 100 = +40% (hyperinflation).
 * Rate formula: (value - 20) * 0.5
 */
const INFLATION_ZERO_POINT = 20;

export function formatInflationRate(inflationStat) {
    const val = Number(inflationStat ?? INFLATION_ZERO_POINT);
    const rate = (val - INFLATION_ZERO_POINT) * 0.5;
    const rounded = Math.round(rate * 10) / 10;
    if (rounded === 0) return '0%';
    return (rounded > 0 ? '+' : '') + rounded + '%';
}

export function getInflationLabel(inflationStat) {
    const val = Number(inflationStat ?? INFLATION_ZERO_POINT);
    if (val <= 5)  return 'Severe Deflation';
    if (val <= 14) return 'Deflation';
    if (val <= 19) return 'Mild Deflation';
    if (val <= 25) return 'Stable';
    if (val <= 40) return 'Low Inflation';
    if (val <= 60) return 'Moderate Inflation';
    if (val <= 80) return 'High Inflation';
    return 'Hyperinflation';
}

export function inflationColorClass(inflationStat) {
    const val = Number(inflationStat ?? INFLATION_ZERO_POINT);
    if (val <= 5)  return 'bad';
    if (val <= 14) return 'medium';
    if (val <= 40) return 'good';
    if (val <= 60) return 'medium';
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
 * Simplified approval system configuration.
 *
 * Minister approval drifts toward the average "performance" of their owned stats
 * each tick. Performance for a stat is its raw value (higher-is-better) or
 * 100 - value (lower-is-better). Neutral stats are skipped.
 *
 * Government approval = avg(filled minister approvals) + vacancy penalty + event modifier.
 */
export const MINISTER_APPROVAL_CONFIG = {
    // Per-tick drift rate: minister approval moves 15% of the gap toward target
    DRIFT_RATE: 0.15,

    // New minister starts at 50% approval and drifts to match their stats
    NEW_MINISTER_APPROVAL: 50,

    // Firing a minister costs 1 AP and gives +3 to the event modifier
    FIRE_MINISTER_AP_COST: 1,
    FIRE_GOV_APPROVAL_BONUS: 3,

    // Government approval: -3 per vacant ministry seat
    VACANCY_PENALTY: -3,

    // Event modifier decay: 10% per tick (transient shocks fade naturally)
    EVENTS_DECAY_RATE: 0.10,

    // Government shutdown: -6/tick direct penalty on minister approval
    SHUTDOWN_MINISTER_PENALTY: -6,
    // Government shutdown: -25 flat penalty on government approval
    SHUTDOWN_GOV_PENALTY: -25,

    // Legislative activity: bonus to gov_approval_events when a bill passes
    BILL_PASSAGE_EVENT_BONUS: 3,

    // Legislative inactivity: -1/tick to gov_approval_events after grace period
    LEGISLATIVE_INACTIVITY_GRACE_TICKS: 6,
    LEGISLATIVE_INACTIVITY_PENALTY: -1,
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
