/**
 * platforms.js — Party platform definitions.
 * 16 platforms a party can adopt (up to 3 simultaneously, 6-tick cooldown between).
 * Each defines promised stat improvements, likely side effects, and a political tradeoff.
 */

export const PLATFORMS = [
    {
        id: 'economic_reform',
        name: 'Economic Reform',
        icon: '\uD83D\uDCC8',
        tagline: 'Growth-first neoliberal agenda',
        desc: 'Prioritize GDP, attract foreign capital, lower corporate taxes. The rising tide theory \u2014 grow the pie and worry about slicing it later.',
        improve: ['gdp_growth', 'foreign_investment', 'currency_strength', 'credit', 'service_output', 'manufacturing_output'],
        worsen: ['income_inequality', 'poverty_rate', 'union_strength', 'income_tax'],
        tradeoff: 'Income inequality tends to rise. Working class sees GDP numbers go up while their wages don\'t.',
    },
    {
        id: 'social_justice',
        name: 'Social Justice',
        icon: '\u2696\uFE0F',
        tagline: 'Redistribution and equity',
        desc: 'Raise minimum wage, expand welfare, progressive taxation. Close the gap between rich and poor through direct intervention.',
        improve: ['minimum_wage', 'poverty_rate', 'income_inequality', 'social_mobility', 'healthcare_accessibility', 'education_accessibility'],
        worsen: ['foreign_investment', 'gdp_growth', 'corporate_tax'],
        tradeoff: 'Capital flight risk. Foreign investors avoid high-tax environments. Growth may slow.',
    },
    {
        id: 'national_security',
        name: 'National Security',
        icon: '\uD83D\uDEE1\uFE0F',
        tagline: 'Borders, military, order',
        desc: 'Strengthen defense, tighten borders, expand police powers. Safety through strength.',
        improve: ['stability', 'crime_rate', 'terrorism', 'political_violence', 'illegal_immigration'],
        worsen: ['freedom_index', 'press_freedom', 'civil_unrest', 'polarization'],
        tradeoff: 'Freedom index drops. Minority communities disproportionately affected. International criticism.',
    },
    {
        id: 'anti_corruption',
        name: 'Anti-Corruption',
        icon: '\uD83D\uDD0D',
        tagline: 'Clean government, institutional reform',
        desc: 'Independent judiciary, transparent budgets, prosecute the connected. Popular with voters but powerful people fight back hard.',
        improve: ['corruption', 'judicial_independence', 'press_freedom', 'legitimacy', 'efficiency'],
        worsen: ['stability'],
        tradeoff: 'Short-term chaos as exposing corruption shakes institutions. Your own party\'s skeletons may surface.',
    },
    {
        id: 'green_transition',
        name: 'Green Transition',
        icon: '\uD83C\uDF31',
        tagline: 'Climate and environment',
        desc: 'Renewable energy investment, carbon taxes, emissions targets. Save the planet \u2014 but the bill comes due now, not later.',
        improve: ['renewable_energy_pct', 'pollution', 'carbon_emissions', 'energy_generation'],
        worsen: ['fuel_prices', 'manufacturing_output', 'gdp_growth', 'cost_of_living'],
        tradeoff: 'Energy costs spike during transition. Rural and industrial voters feel abandoned.',
    },
    {
        id: 'industrialization',
        name: 'Industrialization',
        icon: '\uD83C\uDFED',
        tagline: 'Factories, exports, production',
        desc: 'Build manufacturing capacity, create blue-collar jobs, develop physical infrastructure. The backbone of a real economy.',
        improve: ['manufacturing_output', 'labor_force_participation', 'unemployment', 'physical_infrastructure', 'gdp_growth'],
        worsen: ['pollution', 'carbon_emissions', 'arable_land', 'healthcare_quality'],
        tradeoff: 'Environment gets destroyed. Long-term health costs from industrial pollution.',
    },
    {
        id: 'digital_modernization',
        name: 'Digital Modernization',
        icon: '\uD83D\uDCBB',
        tagline: 'Tech economy, connectivity',
        desc: 'Fiber everywhere, tech sector incentives, digital government services. Leap into the future \u2014 but not everyone makes the jump.',
        improve: ['digital_infrastructure', 'service_output', 'higher_education', 'academic_immigration', 'efficiency'],
        worsen: ['manufacturing_output', 'labor_force_participation', 'income_inequality', 'urbanization'],
        tradeoff: 'Automation displaces workers. Rural communities left behind. Tech wealth concentrates in cities.',
    },
    {
        id: 'welfare_state',
        name: 'Welfare State',
        icon: '\uD83C\uDFE5',
        tagline: 'Universal services, safety net',
        desc: 'Free healthcare, free education, generous pensions, unemployment insurance. Cradle to grave \u2014 funded by steep taxes on everyone.',
        improve: ['healthcare_quality', 'healthcare_accessibility', 'education_accessibility', 'poverty_rate', 'standard_of_living', 'happiness'],
        worsen: ['income_tax', 'corporate_tax', 'gdp_growth', 'foreign_investment'],
        tradeoff: 'Massive fiscal cost. Tax burden on middle class, not just the rich. Sustainability questioned.',
    },
    {
        id: 'populist_nationalism',
        name: 'Populist Nationalism',
        icon: '\uD83C\uDDF2',
        tagline: 'The people vs. elites and outsiders',
        desc: 'Restrict immigration, protect domestic industry, reject globalism. Our people first. Our jobs first. Our culture first.',
        improve: ['immigration', 'illegal_immigration', 'manufacturing_output', 'minimum_wage', 'union_strength'],
        worsen: ['foreign_investment', 'academic_immigration', 'freedom_index', 'press_freedom', 'polarization', 'ethnic_diversity'],
        tradeoff: 'International isolation. Brain drain as educated professionals emigrate. Deep social polarization.',
    },
    {
        id: 'free_market',
        name: 'Free Market Liberalism',
        icon: '\uD83C\uDFDB\uFE0F',
        tagline: 'Deregulate everything',
        desc: 'Cut taxes, cut red tape, let the market decide winners and losers. Government is the problem, not the solution.',
        improve: ['gdp_growth', 'foreign_investment', 'credit', 'service_output', 'currency_strength'],
        worsen: ['union_strength', 'minimum_wage', 'healthcare_accessibility', 'income_inequality', 'poverty_rate'],
        tradeoff: 'Growth at the cost of the working class. Social safety net erodes. Boom-bust volatility.',
    },
    {
        id: 'law_and_order',
        name: 'Law & Order',
        icon: '\u2694\uFE0F',
        tagline: 'Tough on crime, strong institutions',
        desc: 'More police, harsher sentences, zero tolerance. Restore order to the streets. Criminals fear the state.',
        improve: ['crime_rate', 'stability', 'political_violence', 'terrorism', 'drug_use'],
        worsen: ['incarceration_rate', 'freedom_index', 'civil_unrest'],
        tradeoff: 'Prison population explodes. Minority communities targeted. Policing costs balloon.',
    },
    {
        id: 'education_first',
        name: 'Education First',
        icon: '\uD83C\uDF93',
        tagline: 'Human capital as the long game',
        desc: 'Fund schools, universities, research institutions, teacher salaries. The 20-year bet that the next generation will be smarter and richer.',
        improve: ['literacy', 'higher_education', 'education_accessibility', 'academic_immigration', 'social_mobility', 'labor_force_participation'],
        worsen: ['income_tax', 'gdp_growth'],
        tradeoff: 'Voters don\'t see results before next election. Brain drain if jobs don\'t exist for graduates.',
    },
    {
        id: 'healthcare_reform',
        name: 'Healthcare Reform',
        icon: '\uD83D\uDC8A',
        tagline: 'Fix the hospitals',
        desc: 'More beds, more doctors, better drugs, universal coverage. Nobody dies because they can\'t afford treatment.',
        improve: ['healthcare_quality', 'healthcare_accessibility', 'beds_per_100k', 'lifespan', 'drug_use'],
        worsen: ['income_tax', 'gdp_growth', 'cost_of_living'],
        tradeoff: 'Pharmaceutical lobby fights back. Extremely expensive. Takes multiple cycles to show results.',
    },
    {
        id: 'housing_cost',
        name: 'Housing & Cost of Living',
        icon: '\uD83C\uDFE0',
        tagline: 'The kitchen-table platform',
        desc: 'Rent controls, public housing, affordable food, price caps on essentials. People can\'t eat GDP growth.',
        improve: ['housing_affordability', 'cost_of_living', 'standard_of_living', 'physical_infrastructure', 'urbanization'],
        worsen: ['foreign_investment', 'gdp_growth'],
        tradeoff: 'Property owners and developers become your enemies. Market distortions create shortages.',
    },
    {
        id: 'energy_independence',
        name: 'Energy Independence',
        icon: '\u26FD',
        tagline: 'Control your own power supply',
        desc: 'Exploit domestic oil, gas, and minerals. No more dependency on foreign energy. Cheap fuel, strong economy, sovereign power.',
        improve: ['energy_generation', 'oil_and_gas', 'rare_minerals', 'fuel_prices', 'manufacturing_output', 'gdp_growth'],
        worsen: ['pollution', 'carbon_emissions', 'renewable_energy_pct', 'arable_land'],
        tradeoff: 'Climate commitments broken. Green voters abandon you. Environmental debt for future generations.',
    },
    {
        id: 'open_society',
        name: 'Open Society',
        icon: '\uD83D\uDD4A\uFE0F',
        tagline: 'Liberal democracy, civil liberties',
        desc: 'Free press, open borders, multicultural embrace, strong civil rights. A beacon of freedom \u2014 and a target for those who fear it.',
        improve: ['freedom_index', 'press_freedom', 'immigration', 'academic_immigration', 'ethnic_diversity', 'happiness', 'judicial_independence'],
        worsen: ['stability', 'illegal_immigration', 'polarization', 'terrorism'],
        tradeoff: 'Nationalist backlash. Rural-urban divide deepens. Security vulnerabilities from openness.',
    },
];

// Stat display names for platform UI
export const STAT_NAMES = {
    gdp_growth: 'GDP Growth', inflation: 'Inflation', interest_rates: 'Interest Rates',
    currency_strength: 'Currency Strength', foreign_investment: 'Foreign Investment',
    credit: 'Credit', income_tax: 'Income Tax', corporate_tax: 'Corporate Tax',
    sales_tax: 'Sales Tax', unemployment: 'Unemployment',
    labor_force_participation: 'Labor Force Participation', minimum_wage: 'Minimum Wage',
    union_strength: 'Union Strength', poverty_rate: 'Poverty Rate',
    income_inequality: 'Income Inequality', healthcare_quality: 'Healthcare Quality',
    healthcare_accessibility: 'Healthcare Accessibility', beds_per_100k: 'Beds per 100k',
    lifespan: 'Lifespan', drug_use: 'Drug Use', literacy: 'Literacy',
    higher_education: 'Higher Education', education_accessibility: 'Education Accessibility',
    academic_immigration: 'Academic Immigration', physical_infrastructure: 'Physical Infrastructure',
    digital_infrastructure: 'Digital Infrastructure', urbanization: 'Urbanization',
    energy_generation: 'Energy Generation', renewable_energy_pct: 'Renewable Energy %',
    arable_land: 'Arable Land', rare_minerals: 'Rare Minerals', oil_and_gas: 'Oil & Gas',
    fuel_prices: 'Fuel Prices', pollution: 'Pollution', carbon_emissions: 'Carbon Emissions',
    standard_of_living: 'Standard of Living', happiness: 'Happiness',
    social_mobility: 'Social Mobility', crime_rate: 'Crime Rate',
    incarceration_rate: 'Incarceration Rate', religiosity: 'Religiosity',
    stability: 'Stability', legitimacy: 'Legitimacy', efficiency: 'Efficiency',
    corruption: 'Corruption', press_freedom: 'Press Freedom',
    judicial_independence: 'Judicial Independence', freedom_index: 'Freedom Index',
    polarization: 'Polarization', civil_unrest: 'Civil Unrest', terrorism: 'Terrorism',
    political_violence: 'Political Violence', immigration: 'Immigration',
    illegal_immigration: 'Illegal Immigration', emigration: 'Emigration',
    ethnic_diversity: 'Ethnic Diversity',
    cost_of_living: 'Cost of Living', housing_affordability: 'Housing Affordability',
    manufacturing_output: 'Manufacturing Output', service_output: 'Service Output',
};

// Stats where "improve" means reducing the value (alpha-23 bad stats).
// Phase 9 dropped the legacy bad stats (inflation, unemployment, drug_use,
// pollution, carbon_emissions, polarization, illegal_immigration, etc.) —
// any platform-issue config still keyed to a legacy name flows through
// STAT_KEY_ALIASES at apply time.
export const BAD_STATS = new Set([
    'unrest', 'crime', 'corruption', 'cost_of_living', 'debt',
]);

// Tax-rate stats: raising the rate = "improve" only in the populist sense
// (more revenue, more popular with the left, less with the right). Treated
// as a mixed signal in platform-issue resolution.
export const TAX_STATS = new Set(['income_tax', 'corporate_tax']);

/**
 * Get the direction arrow and color for a stat in a platform context.
 * @param {string} stat - stat key
 * @param {'improve'|'worsen'} direction - whether platform promises to improve or worsen this
 * @returns {{ arrow: string, color: string }}
 */
export function statDirection(stat, direction) {
    const isBad = BAD_STATS.has(stat);
    const isTax = TAX_STATS.has(stat);

    if (direction === 'improve') {
        if (isBad) return { arrow: '\u2193', color: '#5cc55c' };   // lowering a bad stat = green down
        if (isTax) return { arrow: '\u2191', color: '#c84' };      // raising taxes = orange up
        return { arrow: '\u2191', color: '#5cc55c' };               // raising a good stat = green up
    } else {
        if (isBad) return { arrow: '\u2191', color: '#c55' };      // raising a bad stat = red up
        if (isTax) return { arrow: '\u2193', color: '#5cc55c' };   // lowering taxes = green down
        return { arrow: '\u2193', color: '#c55' };                   // lowering a good stat = red down
    }
}

/**
 * Calculate momentum gain for adopting a platform based on existing claim count.
 * @param {number} existingCount - how many other parties in the nation have this platform
 * @returns {{ momentum: number, penalty: number, label: string, color: string, note: string }}
 */
export function platformMomentumInfo(existingCount) {
    switch (existingCount) {
        case 0: return { momentum: 12, penalty: 0, label: '+12', color: '#5cc55c', note: 'Unclaimed \u2014 full momentum' };
        case 1: return { momentum: 6, penalty: 6, label: '+6', color: '#ca5', note: 'Contested by 1 rival \u2014 reduced momentum' };
        case 2: return { momentum: 4, penalty: 4, label: '+4', color: '#c84', note: 'Crowded (2 rivals) \u2014 minimal momentum' };
        default: return { momentum: 2, penalty: 2, label: '+2', color: '#c84', note: `Crowded (${existingCount} rivals) \u2014 minimal momentum` };
    }
}
