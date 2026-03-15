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
export const NATION_STAT_COLUMNS = [
    'gdp', 'gdp_growth', 'debt', 'debt_growth', 'inflation', 'interest_rates',
    'trade_balance', 'currency_strength', 'foreign_investment', 'credit',
    'income_tax', 'corporate_tax', 'sales_tax', 'tariffs',
    'unemployment', 'labor_force_participation', 'minimum_wage', 'union_strength',
    'poverty_rate', 'income_inequality',
    'population', 'population_growth', 'median_age', 'eligible_voters', 'ethnic_diversity',
    'healthcare_quality', 'healthcare_accessibility', 'beds_per_100k', 'lifespan', 'drug_use',
    'literacy', 'higher_education', 'education_accessibility', 'academic_immigration',
    'physical_infrastructure', 'digital_infrastructure', 'rail_network', 'urbanization', 'energy_generation', 'renewable_energy_percentage',
    'arable_land', 'rare_minerals', 'oil_and_gas', 'fuel_prices',
    'pollution', 'carbon_emissions',
    'standard_of_living', 'happiness', 'social_mobility', 'benefits', 'crime_rate', 'incarceration_rate',
    'religiosity',
    'stability', 'legitimacy', 'efficiency', 'corruption', 'press_freedom', 'judicial_independence',
    'freedom_index', 'polarization',
    'civil_unrest', 'terrorism', 'political_violence',
    'immigration', 'illegal_immigration', 'emigration',
    'international_reputation',
    'cost_of_living', 'manufacturing_output', 'service_output', 'housing_affordability'
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
    tourism: 'international_reputation',
    // Legacy aliases for removed/renamed stats
    religious: 'religiosity',
    birth_rate: 'population_growth',
    death_rate: 'population_growth',
    trade_agreements: 'international_reputation',
    sanctions: 'international_reputation'
};

export function normalizeNationStatKey(statKey) {
    if (!statKey || typeof statKey !== 'string') return null;
    return STAT_KEY_ALIASES[statKey] || statKey;
}

/**
 * Stats where HIGHER values are better (increase = achievement).
 */
export const STATS_HIGHER_IS_BETTER = [
    'gdp_growth', 'currency_strength', 'foreign_investment', 'credit',
    'labor_force_participation', 'minimum_wage', 'union_strength',
    'population_growth', 'eligible_voters', 'ethnic_diversity',
    'healthcare_quality', 'healthcare_accessibility', 'beds_per_100k', 'lifespan',
    'literacy', 'higher_education', 'education_accessibility', 'academic_immigration',
    'physical_infrastructure', 'digital_infrastructure', 'rail_network', 'energy_generation', 'renewable_energy_percentage',
    'arable_land', 'rare_minerals',
    'standard_of_living', 'happiness', 'social_mobility', 'benefits',
    'stability', 'legitimacy', 'efficiency', 'press_freedom', 'judicial_independence', 'freedom_index',
    'immigration', 'international_reputation',
    'manufacturing_output', 'service_output', 'housing_affordability'
];

/**
 * Stats where LOWER values are better (decrease = achievement).
 */
export const STATS_LOWER_IS_BETTER = [
    'debt_growth', 'inflation', 'interest_rates',
    'unemployment', 'poverty_rate', 'income_inequality',
    'drug_use', 'fuel_prices', 'pollution', 'carbon_emissions',
    'crime_rate', 'incarceration_rate', 'corruption', 'polarization',
    'civil_unrest', 'terrorism', 'political_violence',
    'illegal_immigration', 'emigration',
    'cost_of_living'
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
    manufacturing_output:     { type: 'erosion', target: 0,  speed: DECAY_SPEED.CRAWL },
    service_output:           { type: 'erosion', target: 0,  speed: DECAY_SPEED.CRAWL },
    cost_of_living:           { type: 'erosion', target: 70, speed: DECAY_SPEED.CRAWL },
    housing_affordability:    { type: 'erosion', target: 30, speed: DECAY_SPEED.CRAWL },
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
 * Build a map of institutionId → fundingPct from budget_item_allocations rows.
 * This is the single source of truth for computing funding percentages.
 *
 * @param {Array} itemAllocations - rows from budget_item_allocations (must have item_id, item_type, allocation_amount, needed_amount)
 * @returns {Object} e.g. { tax_admin: 85, police_force: 100 }  — default 100 for missing institutions
 */
export function buildFundingPctMap(itemAllocations) {
    const map = {};
    for (const row of (itemAllocations || [])) {
        if (row.item_type === 'institution') {
            const needed = Number(row.needed_amount || 0);
            map[row.item_id] = needed > 0
                ? Math.min(200, Math.round((Number(row.allocation_amount || 0) / needed) * 100))
                : 100;
        }
    }
    return map;
}

/**
 * Get the funding percentage for a single institution from a pre-built map.
 * Returns 100 (fully funded) if no allocation exists.
 */
export function getInstFundingPct(fundingPctMap, instId) {
    return (fundingPctMap && fundingPctMap[instId] !== undefined) ? fundingPctMap[instId] : 100;
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
    const fundingPctMap = buildFundingPctMap(itemAllocations);

    const statMap = {};
    for (const inst of (instConfig || [])) {
        const fundingPct = getInstFundingPct(fundingPctMap, inst.id);

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
    Agriculture:     ['arable_land', 'fuel_prices', 'trade_balance', 'poverty_rate'],
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
    const val = Math.max(0, Number(inflationStat ?? 0));
    return Math.pow(val, 1.5) / 100;
}

export function formatInflationRate(inflationStat) {
    const rate = inflationRate(inflationStat);
    if (rate < 0.01) return '0%';
    if (rate < 1) return '+' + rate.toFixed(2) + '%';
    return '+' + rate.toFixed(1) + '%';
}

export function getInflationLabel(inflationStat) {
    const rate = inflationRate(inflationStat);
    if (rate < 0.1)  return 'Negligible';
    if (rate < 0.5)  return 'Minimal';
    if (rate < 1.5)  return 'Stable';
    if (rate < 3)    return 'Low Inflation';
    if (rate < 5)    return 'Moderate Inflation';
    if (rate < 8)    return 'High Inflation';
    return 'Hyperinflation';
}

export function inflationColorClass(inflationStat) {
    const rate = inflationRate(inflationStat);
    if (rate < 1.5)  return 'good';
    if (rate < 5)    return 'medium';
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
    DELTA_SENSITIVITY: 0.6,

    // Slow stagnation decay: if stats are flat, approval drifts down slightly per tick
    STAGNATION_DECAY: -0.3,

    // New minister starts at 40% approval
    NEW_MINISTER_APPROVAL: 40,

    // Firing a minister costs 1 AP and gives +3 to the event modifier
    FIRE_MINISTER_AP_COST: 1,
    FIRE_GOV_APPROVAL_BONUS: 3,

    // Government approval: -3 per vacant ministry seat
    VACANCY_PENALTY: -3,

    // Event modifier decay: 10% per tick (transient shocks fade naturally)
    EVENTS_DECAY_RATE: 0.10,

    // Legislative activity: bonus to gov_approval_events when a bill passes
    BILL_PASSAGE_EVENT_BONUS: 3,

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
