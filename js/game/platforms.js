/**
 * platforms.js — Party platform definitions.
 * 16 platforms a party can adopt (up to 3 simultaneously, 6-tick cooldown between).
 * Each defines promised stat improvements, likely side effects, and a political tradeoff.
 *
 * Stat keys here MUST match live nations.* columns. The full active stat
 * universe (post-canonical-stats consolidation) is 27 columns; STAT_NAMES
 * below enumerates them.
 */

export const PLATFORMS = [
    {
        id: 'economic_reform',
        name: 'Economic Reform',
        icon: '📈',
        tagline: 'Growth-first neoliberal agenda',
        desc: 'Prioritize GDP, attract foreign capital, lower corporate taxes. The rising tide theory — grow the pie and worry about slicing it later.',
        improve: ['gdp_growth', 'gdp', 'service_sector', 'industry', 'global_image'],
        worsen: ['wages', 'standard_of_living', 'income_tax', 'corporate_tax'],
        tradeoff: 'Income inequality tends to rise. Working class sees GDP numbers go up while their wages don\'t.',
    },
    {
        id: 'social_justice',
        name: 'Social Justice',
        icon: '⚖️',
        tagline: 'Redistribution and equity',
        desc: 'Raise minimum wage, expand welfare, progressive taxation. Close the gap between rich and poor through direct intervention.',
        improve: ['wages', 'standard_of_living', 'health', 'public_approval', 'corporate_tax'],
        worsen: ['gdp_growth', 'global_image', 'budget'],
        tradeoff: 'Capital flight risk. Foreign investors avoid high-tax environments. Growth may slow.',
    },
    {
        id: 'national_security',
        name: 'National Security',
        icon: '🛡️',
        tagline: 'Borders, military, order',
        desc: 'Strengthen defense, tighten borders, expand police powers. Safety through strength.',
        improve: ['state_apparatus', 'crime', 'unrest'],
        worsen: ['immigration', 'public_approval', 'corruption'],
        tradeoff: 'Freedom drops. Minority communities disproportionately affected. International criticism.',
    },
    {
        id: 'anti_corruption',
        name: 'Anti-Corruption',
        icon: '🔍',
        tagline: 'Clean government, institutional reform',
        desc: 'Independent judiciary, transparent budgets, prosecute the connected. Popular with voters but powerful people fight back hard.',
        improve: ['corruption', 'state_apparatus', 'public_approval'],
        worsen: ['unrest', 'gdp_growth'],
        tradeoff: 'Short-term chaos as exposing corruption shakes institutions. Your own party\'s skeletons may surface.',
    },
    {
        id: 'green_transition',
        name: 'Green Transition',
        icon: '🌱',
        tagline: 'Climate and environment',
        desc: 'Renewable energy investment, carbon taxes, emissions targets. Save the planet — but the bill comes due now, not later.',
        improve: ['energy', 'health', 'education'],
        worsen: ['gdp_growth', 'industry', 'cost_of_living'],
        tradeoff: 'Energy costs spike during transition. Rural and industrial voters feel abandoned.',
    },
    {
        id: 'industrialization',
        name: 'Industrialization',
        icon: '🏭',
        tagline: 'Factories, exports, production',
        desc: 'Build manufacturing capacity, create blue-collar jobs, develop physical infrastructure. The backbone of a real economy.',
        improve: ['industry', 'unskilled_workers', 'infrastructure', 'gdp', 'gdp_growth'],
        worsen: ['health', 'farmland'],
        tradeoff: 'Environment gets destroyed. Long-term health costs from industrial pollution.',
    },
    {
        id: 'digital_modernization',
        name: 'Digital Modernization',
        icon: '💻',
        tagline: 'Tech economy, connectivity',
        desc: 'Fiber everywhere, tech sector incentives, digital government services. Leap into the future — but not everyone makes the jump.',
        improve: ['infrastructure', 'service_sector', 'skilled_workers', 'education', 'state_apparatus'],
        worsen: ['unskilled_workers', 'wages', 'cost_of_living'],
        tradeoff: 'Automation displaces workers. Rural communities left behind. Tech wealth concentrates in cities.',
    },
    {
        id: 'welfare_state',
        name: 'Welfare State',
        icon: '🏥',
        tagline: 'Universal services, safety net',
        desc: 'Free healthcare, free education, generous pensions, unemployment insurance. Cradle to grave — funded by steep taxes on everyone.',
        improve: ['health', 'education', 'standard_of_living', 'public_approval', 'income_tax', 'corporate_tax'],
        worsen: ['gdp_growth', 'debt', 'global_image'],
        tradeoff: 'Massive fiscal cost. Tax burden on middle class, not just the rich. Sustainability questioned.',
    },
    {
        id: 'populist_nationalism',
        name: 'Populist Nationalism',
        icon: '🇲',
        tagline: 'The people vs. elites and outsiders',
        desc: 'Restrict immigration, protect domestic industry, reject globalism. Our people first. Our jobs first. Our culture first.',
        improve: ['industry', 'wages', 'unskilled_workers', 'public_approval'],
        worsen: ['immigration', 'global_image', 'skilled_workers'],
        tradeoff: 'International isolation. Brain drain as educated professionals emigrate. Deep social polarization.',
    },
    {
        id: 'free_market',
        name: 'Free Market Liberalism',
        icon: '🏛️',
        tagline: 'Deregulate everything',
        desc: 'Cut taxes, cut red tape, let the market decide winners and losers. Government is the problem, not the solution.',
        improve: ['gdp_growth', 'gdp', 'service_sector', 'global_image'],
        worsen: ['wages', 'standard_of_living', 'income_tax', 'corporate_tax', 'health'],
        tradeoff: 'Growth at the cost of the working class. Social safety net erodes. Boom-bust volatility.',
    },
    {
        id: 'law_and_order',
        name: 'Law & Order',
        icon: '⚔️',
        tagline: 'Tough on crime, strong institutions',
        desc: 'More police, harsher sentences, zero tolerance. Restore order to the streets. Criminals fear the state.',
        improve: ['crime', 'state_apparatus', 'unrest'],
        worsen: ['public_approval', 'budget'],
        tradeoff: 'Prison population explodes. Minority communities targeted. Policing costs balloon.',
    },
    {
        id: 'education_first',
        name: 'Education First',
        icon: '🎓',
        tagline: 'Human capital as the long game',
        desc: 'Fund schools, universities, research institutions, teacher salaries. The 20-year bet that the next generation will be smarter and richer.',
        improve: ['education', 'skilled_workers', 'public_approval', 'income_tax'],
        worsen: ['budget', 'debt', 'gdp_growth'],
        tradeoff: 'Voters don\'t see results before next election. Brain drain if jobs don\'t exist for graduates.',
    },
    {
        id: 'healthcare_reform',
        name: 'Healthcare Reform',
        icon: '💊',
        tagline: 'Fix the hospitals',
        desc: 'More beds, more doctors, better drugs, universal coverage. Nobody dies because they can\'t afford treatment.',
        improve: ['health', 'public_approval', 'standard_of_living', 'income_tax'],
        worsen: ['budget', 'debt', 'cost_of_living'],
        tradeoff: 'Pharmaceutical lobby fights back. Extremely expensive. Takes multiple cycles to show results.',
    },
    {
        id: 'housing_cost',
        name: 'Housing & Cost of Living',
        icon: '🏠',
        tagline: 'The kitchen-table platform',
        desc: 'Rent controls, public housing, affordable food, price caps on essentials. People can\'t eat GDP growth.',
        improve: ['cost_of_living', 'standard_of_living', 'infrastructure'],
        worsen: ['gdp_growth', 'global_image', 'industry'],
        tradeoff: 'Property owners and developers become your enemies. Market distortions create shortages.',
    },
    {
        id: 'energy_independence',
        name: 'Energy Independence',
        icon: '⛽',
        tagline: 'Control your own power supply',
        desc: 'Exploit domestic oil, gas, and minerals. No more dependency on foreign energy. Cheap fuel, strong economy, sovereign power.',
        improve: ['energy', 'minerals', 'industry', 'gdp_growth'],
        worsen: ['health', 'farmland', 'global_image'],
        tradeoff: 'Climate commitments broken. Green voters abandon you. Environmental debt for future generations.',
    },
    {
        id: 'open_society',
        name: 'Open Society',
        icon: '🕊️',
        tagline: 'Liberal democracy, civil liberties',
        desc: 'Free press, open borders, multicultural embrace, strong civil rights. A beacon of freedom — and a target for those who fear it.',
        improve: ['immigration', 'global_image', 'public_approval', 'education'],
        worsen: ['unrest', 'state_apparatus', 'crime'],
        tradeoff: 'Nationalist backlash. Rural-urban divide deepens. Security vulnerabilities from openness.',
    },
];

// Display names for the 27 active stats. The platform-modal renderer looks
// up STAT_NAMES[stat_key]; falls back to the raw key if missing.
export const STAT_NAMES = {
    gdp:                  'GDP',
    state_apparatus:      'State Apparatus',
    public_approval:      'Public Approval',
    unrest:               'Unrest',
    crown_authority:      'Crown Authority',
    budget:               'Budget',
    debt:                 'Debt',
    energy:               'Energy',
    health:               'Health',
    education:            'Education',
    global_image:         'Global Image',
    infrastructure:       'Infrastructure',
    industry:             'Industry',
    farmland:             'Farmland',
    standard_of_living:   'Standard of Living',
    cost_of_living:       'Cost of Living',
    gdp_growth:           'GDP Growth',
    immigration:          'Immigration',
    service_sector:       'Service Sector',
    unskilled_workers:    'Unskilled Workers',
    skilled_workers:      'Skilled Workers',
    income_tax:           'Income Tax',
    corporate_tax:        'Corporate Tax',
    crime:                'Crime',
    corruption:           'Corruption',
    minerals:             'Minerals',
    wages:                'Wages',
};

// Stats where "improve" means LOWERING the value (high = bad).
export const BAD_STATS = new Set([
    'unrest', 'debt', 'cost_of_living', 'crime', 'corruption',
]);

// Tax-rate stats: raising the rate = "improve" (more revenue, populist
// framing); lowering = "worsen" (market/right framing). Treated as a
// mixed signal in platform-issue resolution.
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
        if (isBad) return { arrow: '↓', color: '#5cc55c' };   // lowering a bad stat = green down
        if (isTax) return { arrow: '↑', color: '#c84' };      // raising taxes = orange up
        return { arrow: '↑', color: '#5cc55c' };               // raising a good stat = green up
    } else {
        if (isBad) return { arrow: '↑', color: '#c55' };      // raising a bad stat = red up
        if (isTax) return { arrow: '↓', color: '#5cc55c' };   // lowering taxes = green down
        return { arrow: '↓', color: '#c55' };                   // lowering a good stat = red down
    }
}

/**
 * Calculate momentum gain for adopting a platform based on existing claim count.
 * @param {number} existingCount - how many other parties in the nation have this platform
 * @returns {{ momentum: number, penalty: number, label: string, color: string, note: string }}
 */
export function platformMomentumInfo(existingCount) {
    switch (existingCount) {
        case 0: return { momentum: 12, penalty: 0, label: '+12', color: '#5cc55c', note: 'Unclaimed — full momentum' };
        case 1: return { momentum: 6, penalty: 6, label: '+6', color: '#ca5', note: 'Contested by 1 rival — reduced momentum' };
        case 2: return { momentum: 4, penalty: 4, label: '+4', color: '#c84', note: 'Crowded (2 rivals) — minimal momentum' };
        default: return { momentum: 2, penalty: 2, label: '+2', color: '#c84', note: `Crowded (${existingCount} rivals) — minimal momentum` };
    }
}
