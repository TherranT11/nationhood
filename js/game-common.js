/**
 * game-common.js — Shared game logic for Nationhood Alpha
 *
 * Single source of truth for:
 *   - Seat loading (autocracy vs democracy)
 *   - Head faction detection
 *   - Coalition fetching (government_formations → active_coalitions)
 *   - Policy compatibility filtering
 *   - Bill support calculation
 *   - Vote tally syncing
 *   - Enactment approval impact
 *   - Dynamic Ideology System (axes, labels, shifts, drift, penalties)
 *   - Government vacancy penalties & snap elections
 *   - Random event processing
 *   - Game constants & utility formatters
 *
 * Used by: laws.html, bill.html, government.html, parties.html
 */

// ==================== CONSTANTS ====================

const GAME_CONFIG = {
    TOTAL_SEATS: 120,
    MAJORITY_SEATS: 61,
    VOTING_WINDOW_TICKS: 3,
    DRAFT_BILL_AP_COST: 2,
    VETO_APPROVAL_COST: 3,
    NO_CONFIDENCE_AP_COST: 5,
    NO_CONFIDENCE_VOTING_TICKS: 2,
    NO_CONFIDENCE_COOLDOWN_TICKS: 6,
    FOUNDATIONAL_AP_COST: 3,
    FOUNDATIONAL_VOTING_TICKS: 3,
    SUPERMAJORITY_THRESHOLD: 2/3,
    EARLY_ELECTION_TICKS: 2,
    EARLY_ELECTION_PM_APPROVAL_COST: 5,
    EARLY_ELECTION_COALITION_APPROVAL_COST: 3,
    // Presidential Democracy
    PRESIDENTIAL_TERM_TICKS: 48,
    PARLIAMENTARY_TERM_TICKS: 24,
    VETO_OVERRIDE_THRESHOLD: 2/3,
    PRESIDENT_DESK_TICKS: 2,
    MINISTER_CONFIRMATION_VOTING_TICKS: 2,
    PRESIDENTIAL_CANDIDATE_LEAD_TICKS: 6, // ticks before presidential election to generate candidates
    MAX_AP: 20  // maximum action points a party can accumulate
};

/**
 * Update GAME_CONFIG with nation-specific seat values.
 * Call after loading the nation on each page.
 */
function initGameConfigForNation(nation) {
    if (nation && nation.total_seats) {
        GAME_CONFIG.TOTAL_SEATS = nation.total_seats;
        GAME_CONFIG.MAJORITY_SEATS = Math.floor(nation.total_seats / 2) + 1;
    }
}

const FORMATION_DEADLINE_TICKS = 6; // ticks before snap election when no government

/**
 * Atomic AP deduction via database RPC.
 * Returns { success: true, newAp } on success, or { success: false, error } on failure.
 * The DB function checks balance and deducts in a single UPDATE, preventing race conditions.
 */
async function deductAP(supabase, factionId, cost) {
    const { data, error } = await supabase.rpc('deduct_ap', {
        p_faction_id: factionId,
        p_cost: cost
    });
    if (error) {
        console.error(`[deductAP] RPC failed for faction ${factionId}, cost ${cost}:`, error.message);
        return { success: false, error: error.message };
    }
    if (data === -1) {
        return { success: false, error: 'Insufficient AP' };
    }
    return { success: true, newAp: data };
}

/**
 * Atomic AP accumulation via database RPC.
 * Returns { success: true, newAp } on success, or { success: false, error } on failure.
 * The DB function atomically increments AP capped at max, preventing race conditions
 * with concurrent deductions.
 */
async function accumulateAP(supabase, factionId, gain, maxAp = GAME_CONFIG.MAX_AP) {
    const { data, error } = await supabase.rpc('accumulate_ap', {
        p_faction_id: factionId,
        p_gain: gain,
        p_max_ap: maxAp
    });
    if (error) {
        console.error(`[accumulateAP] RPC failed for faction ${factionId}, gain ${gain}:`, error.message);
        return { success: false, error: error.message };
    }
    if (data === -1) {
        return { success: false, error: 'Faction not found' };
    }
    return { success: true, newAp: data };
}

/**
 * Government type helpers.
 * Call with a nation object (must have government_type field).
 */
function isGovernmentAutocracy(nation) { return nation?.government_type === 'Autocracy'; }
function isGovernmentPresidential(nation) { return nation?.government_type === 'Presidential'; }

// ==================== DIPLOMACY CONSTANTS ====================

const DIPLOMACY_CONFIG = {
    // Ambassador actions
    FORMAL_PROTEST_AP: 2,
    PROPOSE_INITIATIVE_AP: 3,
    COVERT_OP_AP: 4,

    // Foreign Minister actions
    RECALL_AMBASSADOR_AP: 2,
    IMPOSE_EMBARGO_AP: 5,
    FOREIGN_AID_AP: 4,
    ISSUE_ULTIMATUM_AP: 3,

    // Head of Government actions
    DECLARE_WAR_AP: 8,
    SUE_FOR_PEACE_AP: 4,
    SIGN_ALLIANCE_AP: 6,

    // Timing
    FM_REVIEW_EXPIRY_TICKS: 3,
    ULTIMATUM_DEADLINE_TICKS: 3,
    STATE_VISIT_ACCEPT_WINDOW: 2,
    STATE_VISIT_COOLDOWN: 6,
    TREATY_RATIFICATION_VOTING_TICKS: 3,
    AMBASSADOR_CONFIRMATION_VOTING_TICKS: 2,

    // War stat penalties (per tick)
    WAR_STABILITY_DRAIN: 2,
    WAR_CIVIL_UNREST_GAIN: 3,
    WAR_TRADE_DRAIN: 2,
    WAR_REPUTATION_DRAIN: 1,

    // Reputation costs
    WAR_WITH_JUSTIFICATION_REP_COST: 3,
    WAR_WITHOUT_JUSTIFICATION_REP_COST: 10,
    FORMAL_PROTEST_TARGET_REP_COST: 1,

    // Covert operation success thresholds (0-1, higher = harder)
    COVERT_INTEL_THRESHOLD: 0.45,
    COVERT_PROPAGANDA_THRESHOLD: 0.55,
    COVERT_BRIBE_THRESHOLD: 0.60
};

/**
 * Diplomatic proposal types with tier classification.
 * Tier 1 = Minor (ambassador approves directly)
 * Tier 2 = FM approval needed (no bill)
 * Tier 3 = Requires Parliament ratification bill
 */
const PROPOSAL_TYPES = {
    // === Tier 1: Minor — Ambassador approves directly ===
    cultural_exchange: {
        tier: 1,
        label: 'Cultural Exchange',
        description: 'Establish cultural exchange programs between nations.',
        stat_effects: [
            { stat_key: 'international_reputation', direction: 'up', rate: 1, delay_ticks: 0, duration_ticks: 1 }
        ]
    },
    visa_agreement: {
        tier: 1,
        label: 'Visa Agreement',
        description: 'Simplify visa requirements for travel between nations.',
        stat_effects: [
            { stat_key: 'international_reputation', direction: 'up', rate: 1, delay_ticks: 0, duration_ticks: 1 },
            { stat_key: 'immigration', direction: 'up', rate: 1, delay_ticks: 0, duration_ticks: 1 }
        ]
    },
    joint_statement: {
        tier: 1,
        label: 'Joint Statement',
        description: 'Issue a joint diplomatic statement signaling cooperation.',
        stat_effects: []  // Purely cosmetic — shows in event feeds
    },
    student_exchange: {
        tier: 1,
        label: 'Student Exchange',
        description: 'Create student exchange programs to boost education.',
        stat_effects: [
            { stat_key: 'higher_education', direction: 'up', rate: 1, delay_ticks: 0, duration_ticks: 1 }
        ]
    },

    // === Tier 3: Major — Escalates to FM, then Parliament ratification bill ===
    trade_agreement: {
        tier: 3,
        label: 'Trade Agreement',
        description: 'Establish a formal trade agreement affecting GDP and trade volume.',
        stat_effects: [
            { stat_key: 'gdp', direction: 'up', rate: 1, delay_ticks: 1, duration_ticks: 0 },
            { stat_key: 'trade_balance', direction: 'up', rate: 2, delay_ticks: 0, duration_ticks: 0 }
        ]
    },
    non_aggression_pact: {
        tier: 3,
        label: 'Non-Aggression Pact',
        description: 'Binding commitment not to declare war for a set period.',
        stat_effects: [
            { stat_key: 'stability', direction: 'up', rate: 1, delay_ticks: 0, duration_ticks: 1 },
            { stat_key: 'international_reputation', direction: 'up', rate: 1, delay_ticks: 0, duration_ticks: 1 }
        ]
    },
    military_alliance: {
        tier: 3,
        label: 'Military Alliance',
        description: 'Mutual defense pact — if one is attacked, the other must respond.',
        stat_effects: [
            { stat_key: 'stability', direction: 'up', rate: 2, delay_ticks: 0, duration_ticks: 0 },
            { stat_key: 'international_reputation', direction: 'up', rate: 1, delay_ticks: 0, duration_ticks: 1 }
        ]
    },
    embargo: {
        tier: 3,
        label: 'Embargo/Sanctions',
        description: 'Economic warfare — tanks target trade stats, also hurts your own.',
        stat_effects: [
            { stat_key: 'trade_balance', direction: 'down', rate: 3, delay_ticks: 0, duration_ticks: 0 },
            { stat_key: 'sanctions', direction: 'up', rate: 3, delay_ticks: 0, duration_ticks: 0 }
        ]
    },
    ceasefire: {
        tier: 3,
        label: 'Ceasefire',
        description: 'Stop active conflict between warring nations.',
        requires_war: true,
        stat_effects: [
            { stat_key: 'stability', direction: 'up', rate: 2, delay_ticks: 0, duration_ticks: 1 },
            { stat_key: 'civil_unrest', direction: 'down', rate: 2, delay_ticks: 0, duration_ticks: 1 }
        ]
    },
    open_borders: {
        tier: 3,
        label: 'Open Borders',
        description: 'Major immigration and security implications — open borders between nations.',
        stat_effects: [
            { stat_key: 'immigration', direction: 'up', rate: 3, delay_ticks: 0, duration_ticks: 0 },
            { stat_key: 'trade_balance', direction: 'up', rate: 1, delay_ticks: 0, duration_ticks: 0 }
        ]
    },
    close_embassy: {
        tier: 3,
        label: 'Close Embassy',
        description: 'Shut down diplomatic presence in the target nation.',
        stat_effects: [
            { stat_key: 'international_reputation', direction: 'down', rate: 2, delay_ticks: 0, duration_ticks: 1 }
        ]
    }
};

// War justification types — required for declaring war without massive reputation penalty
const WAR_JUSTIFICATIONS = {
    ultimatum_ignored:    { label: 'Ignored Ultimatum',     description: 'A formal ultimatum was ignored by the target nation.' },
    caught_spy:           { label: 'Caught Spy',            description: 'A covert agent from the target nation was caught operating in your territory.' },
    broken_treaty:        { label: 'Broken Treaty',         description: 'The target nation violated an existing treaty or agreement.' },
    attacked:             { label: 'Attacked',              description: 'Your nation was attacked by the target nation.' },
    alliance_obligation:  { label: 'Alliance Obligation',   description: 'An allied nation was attacked, triggering mutual defense obligations.' }
};

const MAJOR_SECTORS = [
    { key: 'ECONOMICS',     label: 'Economics',           icon: '💰' },
    { key: 'LABOR',         label: 'Labor',               icon: '👷' },
    { key: 'EDUCATION',     label: 'Education',           icon: '📚' },
    { key: 'ENERGY',        label: 'Energy',              icon: '⚡' },
    { key: 'WELFARE',       label: 'Welfare',             icon: '🏥' },
    { key: 'SOCIAL',        label: 'Social',              icon: '🤝' },
    { key: 'MILITARY',      label: 'Military & Security', icon: '🛡️' },
    { key: 'GOVERNANCE',    label: 'Governance',          icon: '🏛️' },
    { key: 'IMMIGRATION',   label: 'Immigration',         icon: '🌍' },
    { key: 'INTERNATIONAL', label: 'International',       icon: '🌐' },
    { key: 'TRADE',         label: 'Trade',               icon: '📦' }
];

// Policy Platform stances — each sector has 4 stances, each leaning toward 2 ideology poles.
// Used by the "Policy Platform" campaign action (3 AP).
const POLICY_STANCES = {
    ECONOMICS: [
        { key: 'free_market_reform',  name: 'Free Market Reform',  desc: 'Deregulate industries and lower trade barriers.',          poles: ['LIBERTY', 'INDIVIDUALISM'] },
        { key: 'workers_first',       name: 'Workers First',       desc: 'Strengthen labor protections and raise minimum wages.',    poles: ['EQUALITY', 'COLLECTIVISM'] },
        { key: 'protectionist_trade', name: 'Protectionist Trade', desc: 'Shield domestic industries with tariffs and subsidies.',   poles: ['INDIVIDUALISM', 'TRADITION'] },
        { key: 'green_economy',       name: 'Green Economy',       desc: 'Invest in sustainable industries and green jobs.',         poles: ['PROGRESS', 'COLLECTIVISM'] }
    ],
    LABOR: [
        { key: 'business_friendly', name: 'Business Friendly', desc: 'Reduce regulations and empower employers.',             poles: ['LIBERTY', 'INDIVIDUALISM'] },
        { key: 'union_power',       name: 'Union Power',       desc: 'Strengthen unions and collective bargaining.',           poles: ['EQUALITY', 'COLLECTIVISM'] },
        { key: 'full_employment',   name: 'Full Employment',   desc: 'Government programs to guarantee jobs for all.',         poles: ['COLLECTIVISM', 'SECURITY'] },
        { key: 'gig_economy',       name: 'Gig Economy',       desc: 'Embrace flexible work arrangements and innovation.',    poles: ['LIBERTY', 'PROGRESS'] }
    ],
    EDUCATION: [
        { key: 'religious_schooling', name: 'Religious Schooling', desc: 'Expand faith-based education and traditional curricula.', poles: ['TRADITION', 'INDIVIDUALISM'] },
        { key: 'universal_access',    name: 'Universal Access',    desc: 'Guarantee free education for all citizens.',              poles: ['EQUALITY', 'COLLECTIVISM'] },
        { key: 'stem_investment',     name: 'STEM Investment',     desc: 'Prioritize science and technology programs.',             poles: ['PROGRESS', 'LIBERTY'] },
        { key: 'vocational_focus',    name: 'Vocational Focus',    desc: 'Expand trade schools and apprenticeship programs.',       poles: ['TRADITION', 'COLLECTIVISM'] }
    ],
    ENERGY: [
        { key: 'nuclear_power',        name: 'Nuclear Power',        desc: 'Invest in nuclear energy for reliable power.',              poles: ['PROGRESS', 'SECURITY'] },
        { key: 'fossil_fuels',         name: 'Fossil Fuels',         desc: 'Maintain traditional energy sources for stability.',        poles: ['TRADITION', 'INDIVIDUALISM'] },
        { key: 'green_transition',     name: 'Green Transition',     desc: 'Rapidly shift to renewable energy sources.',                poles: ['PROGRESS', 'COLLECTIVISM'] },
        { key: 'energy_independence',  name: 'Energy Independence',  desc: 'Develop domestic energy to reduce foreign dependence.',     poles: ['SECURITY', 'INDIVIDUALISM'] }
    ],
    WELFARE: [
        { key: 'universal_benefits', name: 'Universal Benefits', desc: 'Provide welfare programs for all citizens.',                     poles: ['EQUALITY', 'COLLECTIVISM'] },
        { key: 'targeted_aid',       name: 'Targeted Aid',       desc: 'Focus welfare on those who need it most.',                       poles: ['EQUALITY', 'INDIVIDUALISM'] },
        { key: 'self_reliance',      name: 'Self-Reliance',      desc: 'Reduce welfare dependency and promote personal responsibility.', poles: ['INDIVIDUALISM', 'LIBERTY'] },
        { key: 'community_care',     name: 'Community Care',     desc: 'Channel welfare through community and religious organizations.', poles: ['TRADITION', 'COLLECTIVISM'] }
    ],
    SOCIAL: [
        { key: 'traditional_values',  name: 'Traditional Values',  desc: 'Uphold cultural heritage and social norms.',            poles: ['TRADITION', 'INDIVIDUALISM'] },
        { key: 'social_safety_net',   name: 'Social Safety Net',   desc: 'Expand social programs and public services.',           poles: ['EQUALITY', 'COLLECTIVISM'] },
        { key: 'individual_freedoms', name: 'Individual Freedoms', desc: 'Protect civil liberties and personal choices.',          poles: ['FREEDOM', 'LIBERTY'] },
        { key: 'community_standards', name: 'Community Standards', desc: 'Strengthen community-level governance and norms.',       poles: ['TRADITION', 'COLLECTIVISM'] }
    ],
    MILITARY: [
        { key: 'expand_military',  name: 'Expand the Military', desc: 'Increase defense spending and military capabilities.',     poles: ['SECURITY', 'INDIVIDUALISM'] },
        { key: 'peace_dividend',   name: 'Peace Dividend',      desc: 'Reduce military spending and invest in social programs.',  poles: ['FREEDOM', 'EQUALITY'] },
        { key: 'national_service', name: 'National Service',    desc: 'Implement mandatory national service for citizens.',       poles: ['COLLECTIVISM', 'TRADITION'] },
        { key: 'smart_defense',    name: 'Smart Defense',        desc: 'Invest in advanced technology and cyber capabilities.',   poles: ['PROGRESS', 'LIBERTY'] }
    ],
    GOVERNANCE: [
        { key: 'law_and_order',     name: 'Law and Order',         desc: 'Strengthen law enforcement and judicial authority.',        poles: ['SECURITY', 'TRADITION'] },
        { key: 'anti_corruption',   name: 'Anti-Corruption Drive', desc: 'Increase transparency and root out corruption.',           poles: ['LIBERTY', 'PROGRESS'] },
        { key: 'strong_executive',  name: 'Strong Executive',      desc: 'Concentrate executive power for decisive governance.',     poles: ['SECURITY', 'INDIVIDUALISM'] },
        { key: 'decentralization',  name: 'Decentralization',      desc: 'Distribute power to local communities and regions.',       poles: ['FREEDOM', 'EQUALITY'] }
    ],
    IMMIGRATION: [
        { key: 'closed_borders',       name: 'Closed Borders',       desc: 'Restrict immigration and strengthen border security.',  poles: ['NATIONALISM', 'SECURITY'] },
        { key: 'skilled_migration',    name: 'Skilled Migration',    desc: 'Attract highly skilled immigrants selectively.',         poles: ['LIBERTY', 'INDIVIDUALISM'] },
        { key: 'open_arms',           name: 'Open Arms',            desc: 'Welcome refugees and increase immigration quotas.',      poles: ['GLOBALISM', 'FREEDOM'] },
        { key: 'cultural_integration', name: 'Cultural Integration', desc: 'Require cultural assimilation for new arrivals.',       poles: ['NATIONALISM', 'TRADITION'] }
    ],
    INTERNATIONAL: [
        { key: 'non_interventionist',  name: 'Non-Interventionist',  desc: 'Avoid foreign entanglements and focus on domestic affairs.', poles: ['NATIONALISM', 'FREEDOM'] },
        { key: 'global_leadership',    name: 'Global Leadership',    desc: 'Lead international institutions and alliances.',             poles: ['GLOBALISM', 'PROGRESS'] },
        { key: 'military_deterrence',  name: 'Military Deterrence',  desc: 'Project strength to deter foreign aggression.',              poles: ['SECURITY', 'NATIONALISM'] },
        { key: 'humanitarian_focus',   name: 'Humanitarian Focus',   desc: 'Prioritize foreign aid and human rights advocacy.',           poles: ['GLOBALISM', 'EQUALITY'] }
    ],
    TRADE: [
        { key: 'free_trade',          name: 'Free Trade',            desc: 'Eliminate tariffs and open markets to global commerce.',      poles: ['GLOBALISM', 'LIBERTY'] },
        { key: 'buy_domestic',         name: 'Buy Domestic',          desc: 'Promote domestic products and restrict foreign goods.',      poles: ['NATIONALISM', 'TRADITION'] },
        { key: 'fair_trade',           name: 'Fair Trade',            desc: 'Enforce ethical standards and workers\' rights in trade.',   poles: ['GLOBALISM', 'COLLECTIVISM'] },
        { key: 'economic_sovereignty', name: 'Economic Sovereignty',  desc: 'Protect national industries from foreign ownership.',       poles: ['NATIONALISM', 'INDIVIDUALISM'] }
    ]
};

const POLICY_PLATFORM_AP_COST = 3;
const POLICY_PLATFORM_COOLDOWN_TICKS = 2;

// Stats where LOWER is better (inverted approval logic)
const INVERTED_STATS = [
    'unemployment', 'poverty_rate', 'income_inequality', 'death_rate',
    'pollution', 'carbon_emissions', 'crime_rate', 'incarceration_rate',
    'drug_use', 'corruption', 'polarization', 'civil_unrest', 'terrorism',
    'political_violence', 'emigration', 'sanctions', 'debt', 'debt_growth',
    'inflation', 'illegal_immigration', 'fuel_prices'
];

// Stats stored as raw numbers (not 0-100 indices).
const RAW_SCALING_DIVISORS = {
    population: 1_000_000,
    gdp: 1_000_000_000,
    debt: 1_000_000_000
};

// ==================== NATIONAL BUDGET CALCULATION ====================

function calculateNationalBudget(nation) {
    // GDP and Debt are stored as raw dollars
    const gdp = Number(nation.gdp ?? nation.GDP ?? 0);
    const debt = Number(nation.debt ?? 0);

    // Tax rates: 0-100 percentages
    const incomeTaxRate  = Number(nation.income_tax ?? 0);
    const corpTaxRate    = Number(nation.corporate_tax ?? 0);
    const salesTaxRate   = Number(nation.sales_tax ?? 0);
    const tariffsRate    = Number(nation.tariffs ?? 0);

    // Other 0-100 stats
    const efficiency     = Number(nation.efficiency ?? 50);
    const corruption     = Number(nation.corruption ?? 50);
    const oilGas         = Number(nation.oil_and_gas ?? 0);
    const creditRating   = Number(nation.credit ?? 50);

    // Collection Rate = (Efficiency + (100 - Corruption)) / 200  →  0.0 to 1.0
    const collectionRate = (efficiency + (100 - corruption)) / 200;

    // Tax Revenue (raw dollars, since GDP is raw dollars)
    const incomeRevenue  = gdp * (incomeTaxRate / 100) * 0.40 * collectionRate;
    const corpRevenue    = gdp * (corpTaxRate / 100)   * 0.10 * collectionRate;
    const salesRevenue   = gdp * (salesTaxRate / 100)  * 0.30 * collectionRate;
    const tariffRevenue  = gdp * (tariffsRate / 100)   * 0.05 * collectionRate;

    // Oil & Gas Revenue (only if oil_and_gas stat > 30)
    const oilRevenue = oilGas > 30 ? gdp * (oilGas / 100) * 0.06 : 0;

    const grossRevenue = incomeRevenue + corpRevenue + salesRevenue + tariffRevenue + oilRevenue;

    // Debt Service: Effective Interest = 15% - (Credit × 0.13%), clamped 2%-18%
    const effectiveInterest = Math.min(0.18, Math.max(0.02, 0.15 - (creditRating * 0.0013)));
    const debtService = debt * effectiveInterest;

    // Available Budget = Revenue - Debt Service
    const availableBudget = grossRevenue - debtService;

    return { grossRevenue, debtService, availableBudget, collectionRate };
}

// Apply GDP growth rate: gdp_growth (0-100) centered at 50 maps to -5% to +5% per tick
async function applyGdpGrowth(supabase, nation) {
    const gdpGrowth = Number(nation.gdp_growth ?? 50);
    const currentGdp = Number(nation.gdp ?? 0);
    if (currentGdp <= 0) return;

    const gdpRate = (gdpGrowth - 50) / 1000;
    const newGdp = Math.max(0, currentGdp * (1 + gdpRate));
    nation.gdp = newGdp;

    await supabase.from('nations').update({ gdp: newGdp }).eq('id', nation.id);
}

// Ideology spectrum opposites
const IDEOLOGY_OPPOSITES = {
    'LIBERTY': 'EQUALITY',           'EQUALITY': 'LIBERTY',
    'FREEDOM': 'SECURITY',           'SECURITY': 'FREEDOM',
    'TRADITION': 'PROGRESS',         'PROGRESS': 'TRADITION',
    'GLOBALISM': 'NATIONALISM',      'NATIONALISM': 'GLOBALISM',
    'INDIVIDUALISM': 'COLLECTIVISM', 'COLLECTIVISM': 'INDIVIDUALISM'
};

// Audit: detect stances with opposed poles on the same axis
for (const [sector, stances] of Object.entries(POLICY_STANCES)) {
    for (const stance of stances) {
        if (stance.poles.length === 2 && IDEOLOGY_OPPOSITES[stance.poles[0]] === stance.poles[1]) {
            console.error(`STANCE CONFLICT: ${sector}.${stance.key} has opposed poles: ${stance.poles.join(' vs ')}`);
        }
    }
}

// ==================== DYNAMIC IDEOLOGY SYSTEM ====================

const IDEOLOGY_AXES = [
    {
        key: 'liberty_equality',
        left: 'LIBERTY',       right: 'EQUALITY',
        leftLabel: 'Liberty',  rightLabel: 'Equality',
        leftColor: '#3b82f6',  rightColor: '#ef4444',
        description: 'Individual rights vs. collective fairness'
    },
    {
        key: 'tradition_progress',
        left: 'TRADITION',      right: 'PROGRESS',
        leftLabel: 'Tradition', rightLabel: 'Progress',
        leftColor: '#a855f7',   rightColor: '#22c55e',
        description: 'Cultural conservatism vs. social reform'
    },
    {
        key: 'security_freedom',
        left: 'SECURITY',      right: 'FREEDOM',
        leftLabel: 'Security', rightLabel: 'Freedom',
        leftColor: '#f59e0b',  rightColor: '#06b6d4',
        description: 'State protection vs. personal autonomy'
    },
    {
        key: 'globalism_nationalism',
        left: 'GLOBALISM',       right: 'NATIONALISM',
        leftLabel: 'Globalism',  rightLabel: 'Nationalism',
        leftColor: '#14b8a6',    rightColor: '#f97316',
        description: 'International integration vs. national sovereignty'
    },
    {
        key: 'individualism_collectivism',
        left: 'INDIVIDUALISM',       right: 'COLLECTIVISM',
        leftLabel: 'Individualism',  rightLabel: 'Collectivism',
        leftColor: '#eab308',        rightColor: '#ec4899',
        description: 'Personal self-reliance vs. communal structures'
    }
];

const IDEOLOGY_TO_AXIS = {};
for (const axis of IDEOLOGY_AXES) {
    IDEOLOGY_TO_AXIS[axis.left]  = { axisKey: axis.key, direction: -1 };
    IDEOLOGY_TO_AXIS[axis.right] = { axisKey: axis.key, direction: +1 };
}


// ==================== IDEOLOGY LABELS ====================

const IDEOLOGY_LABEL_THRESHOLDS = [
    { min: 0,  max: 10,  label: 'Centrist' },
    { min: 11, max: 30,  label: 'Leaning' },
    { min: 31, max: 60,  label: 'Strong' },
    { min: 61, max: 100, label: 'Radical' }
];

function getIdeologyLabel(score, axisDef) {
    const abs = Math.abs(score);
    const threshold = IDEOLOGY_LABEL_THRESHOLDS.find(t => abs >= t.min && abs <= t.max);
    const intensityLabel = threshold ? threshold.label : 'Centrist';

    if (intensityLabel === 'Centrist') return 'Centrist';

    const sideName = score < 0 ? axisDef.leftLabel : axisDef.rightLabel;
    return `${intensityLabel} ${sideName}`;
}

function getFullIdeologyProfile(ideologyRow) {
    return IDEOLOGY_AXES.map(axis => {
        const score = ideologyRow[axis.key] || 0;
        return {
            axisKey: axis.key,
            axisDef: axis,
            score: score,
            label: getIdeologyLabel(score, axis)
        };
    });
}

function getIdeologySummary(ideologyRow) {
    const profile = getFullIdeologyProfile(ideologyRow);
    return profile.map(p => {
        if (p.label === 'Centrist') {
            return `Centrist (${p.axisDef.leftLabel}/${p.axisDef.rightLabel})`;
        }
        return p.label;
    }).join(' • ');
}


// ==================== DYNAMIC OPPOSITION PENALTY ====================

function calculateDynamicOppositionPenalty(factionIdeology, policyIdeologyTag, basePenalty = 2) {
    const tag = policyIdeologyTag.toUpperCase();
    const mapping = IDEOLOGY_TO_AXIS[tag];
    if (!mapping) return 0;

    const factionScore = factionIdeology[mapping.axisKey] || 0;
    const policyDirection = mapping.direction;
    const oppositionScore = -policyDirection * factionScore;

    if (oppositionScore <= 0) return 0;

    const penaltyScale = oppositionScore / 100;
    return -Math.round(basePenalty * penaltyScale * 10) / 10;
}

function calculateBillDynamicPenalty(factionIdeology, articles, basePenalty = 2) {
    let totalPenalty = 0;

    for (const art of articles) {
        const p = art.policies || art;
        if (!p) continue;

        const ideos = (p.ideologies && Array.isArray(p.ideologies) && p.ideologies.length > 0)
            ? p.ideologies.map(i => i.toUpperCase())
            : (p.ideology ? [p.ideology.toUpperCase()] : []);

        for (const tag of ideos) {
            totalPenalty += calculateDynamicOppositionPenalty(factionIdeology, tag, basePenalty);
        }
    }

    return totalPenalty;
}


// ==================== IDEOLOGY DATABASE HELPERS ====================

async function loadFactionIdeology(supabase, factionId) {
    const cacheKey = 'faction_ideo_' + factionId;
    if (typeof qCache === 'function') {
        const cached = qCache(cacheKey);
        if (cached) return cached;
    }
    const { data, error } = await supabase
        .from('faction_ideology')
        .select('*')
        .eq('faction_id', factionId)
        .maybeSingle();

    if (error) {
        console.error('Error loading faction ideology:', error);
        return null;
    }
    if (data && typeof qCacheSet === 'function') qCacheSet(cacheKey, data, 2 * 60 * 1000);
    return data;
}

async function loadNationIdeologies(supabase, nationId) {
    const cacheKey = 'nation_ideos_' + nationId;
    if (typeof qCache === 'function') {
        const cached = qCache(cacheKey);
        if (cached) return cached;
    }
    const { data: factions } = await supabase
        .from('factions')
        .select('id')
        .eq('nation_id', nationId)
        .eq('faction_type', 'party');

    if (!factions || factions.length === 0) return [];

    const factionIds = factions.map(f => f.id);
    const { data, error } = await supabase
        .from('faction_ideology')
        .select('*, factions(id, faction_name, faction_type, is_npc, nation_id)')
        .in('faction_id', factionIds);

    if (error) {
        console.error('Error loading nation ideologies:', error);
        return [];
    }
    const result = data || [];
    if (result.length && typeof qCacheSet === 'function') qCacheSet(cacheKey, result, 2 * 60 * 1000);
    return result;
}

function extractAxisScores(ideologyRow) {
    const scores = {};
    for (const axis of IDEOLOGY_AXES) {
        scores[axis.key] = ideologyRow[axis.key] || 0;
    }
    return scores;
}


// ==================== SEAT LOADING ====================

async function loadSeats(supabase, nationId, isAutocracy, allParties, currentFactionId) {
    const allPartySeats = {};

    if (isAutocracy) {
        allParties.forEach(p => {
            allPartySeats[p.id] = p.seats || 0;
        });
    } else {
        const cacheKey = 'seats_' + nationId;
        let election = null;
        if (typeof qCache === 'function') {
            const cached = qCache(cacheKey);
            if (cached) { election = cached; }
        }
        if (!election) {
            const res = await supabase
                .from('elections')
                .select('results')
                .eq('nation_id', nationId)
                .eq('status', 'completed')
                .eq('election_type', 'parliamentary')
                .order('election_tick', { ascending: false })
                .limit(1)
                .maybeSingle();
            election = res.data;
            if (election && typeof qCacheSet === 'function') qCacheSet(cacheKey, election, 2 * 60 * 1000);
        }

        if (election?.results?.votes) {
            election.results.votes.forEach(s => {
                allPartySeats[s.party_id] = s.seats;
            });
        } else if (election?.results?.seats) {
            election.results.seats.forEach(s => {
                allPartySeats[s.party_id] = s.seats;
            });
        }

        allParties.forEach(p => {
            if (allPartySeats[p.id] === undefined) {
                allPartySeats[p.id] = p.seats || 0;
            }
        });
    }

    const currentSeats = allPartySeats[currentFactionId] ??
        allParties.find(p => p.id === currentFactionId)?.seats ?? 0;

    return { allPartySeats, currentSeats };
}


// ==================== HEAD FACTION ====================

async function detectHeadFaction(supabase, nationId, allParties, allPartySeats, currentFactionId) {
    const { data: nation } = await supabase
        .from('nations')
        .select('ruling_faction_id')
        .eq('id', nationId)
        .single();

    if (nation?.ruling_faction_id) {
        return {
            headFactionId: nation.ruling_faction_id,
            isHeadFaction: currentFactionId === nation.ruling_faction_id
        };
    }

    const { data: gov } = await supabase
        .from('nation_governments')
        .select('head_of_state_party')
        .eq('nation_id', nationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (gov?.head_of_state_party) {
        return {
            headFactionId: gov.head_of_state_party,
            isHeadFaction: currentFactionId === gov.head_of_state_party
        };
    }

    return { headFactionId: null, isHeadFaction: false };
}


// ==================== COALITION FETCHING ====================

async function fetchActiveCoalition(supabase, nationId) {
    const cacheKey = 'coalition_' + nationId;
    if (typeof qCache === 'function') {
        const cached = qCache(cacheKey);
        if (cached) return cached;
    }

    // === PRESIDENTIAL SYSTEMS: return virtual coalition from active president ===
    const { data: nationRow } = await supabase
        .from('nations')
        .select('government_type')
        .eq('id', nationId)
        .single();

    if (nationRow?.government_type === 'Presidential') {
        const { data: president } = await supabase
            .from('presidents')
            .select('id, nation_id, faction_id, first_name, last_name, elected_tick, is_active')
            .eq('nation_id', nationId)
            .eq('is_active', true)
            .order('elected_tick', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (!president) return null; // No active president yet (candidate selection pending)

        // Build ministry_allocations from active ministries
        const { data: ministries } = await supabase
            .from('ministries')
            .select('ministry_key, party_id')
            .eq('nation_id', nationId)
            .eq('is_active', true);

        const ministryAllocations = {};
        const cabinetPartyIds = new Set([president.faction_id]);
        for (const m of (ministries || [])) {
            if (m.party_id) {
                ministryAllocations[m.ministry_key] = m.party_id;
                cabinetPartyIds.add(m.party_id);
            }
        }

        const result = {
            id: president.id,
            nation_id: nationId,
            party_ids: Array.from(cabinetPartyIds),
            lead_party_id: president.faction_id,
            ministry_allocations: ministryAllocations,
            formed_at: null,
            status: 'formed',  // Always 'formed' while president is active
            _source: 'presidential'
        };
        if (typeof qCacheSet === 'function') qCacheSet(cacheKey, result, 15 * 1000);
        return result;
    }

    // === PARLIAMENTARY DEMOCRACY / AUTOCRACY: existing logic ===

    // Helper: if status looks active but frozen bills exist, it's actually caretaker
    async function inferCaretakerStatus(result) {
        if (result && (!result.status || result.status === 'formed')) {
            const { count } = await supabase
                .from('bills')
                .select('id', { count: 'exact', head: true })
                .eq('nation_id', nationId)
                .eq('status', 'frozen');
            if (count && count > 0) {
                result.status = 'caretaker';
            }
        }
        return result;
    }

    const { data: newGov } = await supabase
        .from('government_formations')
        .select('*')
        .eq('nation_id', nationId)
        .in('status', ['formed', 'caretaker'])
        .order('formed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (newGov) {
        const pmPartyId = newGov.ministry_assignments?.prime_minister || newGov.proposed_by;
        const result = {
            id: newGov.id,
            nation_id: newGov.nation_id,
            election_id: newGov.election_id,
            party_ids: newGov.party_ids || [],
            lead_party_id: pmPartyId,
            ministry_allocations: newGov.ministry_assignments || {},
            formed_at: newGov.formed_at,
            status: newGov.status,
            _source: 'government_formations'
        };
        await inferCaretakerStatus(result);

        // Reconcile: if government_formations has a definitive status, ensure active_coalitions matches
        if (result.status === 'dissolved' || result.status === 'caretaker') {
            supabase.from('active_coalitions')
                .update(result.status === 'dissolved'
                    ? { status: 'dissolved', dissolved_at: new Date().toISOString() }
                    : { status: 'caretaker' })
                .eq('nation_id', nationId)
                .is('dissolved_at', null)
                .then(() => {}) // fire-and-forget reconciliation
                .catch(e => console.warn('Coalition table reconciliation failed:', e));
        }

        if (typeof qCacheSet === 'function') qCacheSet(cacheKey, result, 15 * 1000);
        return result;
    }

    const { data } = await supabase
        .from('active_coalitions')
        .select('*')
        .eq('nation_id', nationId)
        .is('dissolved_at', null)
        .order('formed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (data) {
        await inferCaretakerStatus(data);
        if (typeof qCacheSet === 'function') qCacheSet(cacheKey, data, 15 * 1000);
    }
    return data;
}


// ==================== POLICY COMPATIBILITY ====================

function getCompatiblePolicies(sector, allPolicies, faction, isAutocracy, excludePolicyIds = [], activePolicyIds = null) {
    const ideo1 = (faction?.ideology_value_1 || '').toUpperCase();
    const ideo2 = (faction?.ideology_value_2 || '').toUpperCase();
    const factionIdeos = [ideo1, ideo2].filter(Boolean);

    const factionOpposites = new Set(
        factionIdeos.map(fi => IDEOLOGY_OPPOSITES[fi]).filter(Boolean)
    );

    return allPolicies
        .filter(p => p.major_sector === sector && !excludePolicyIds.includes(p.id))
        .map(p => {
            const policyIdeos = (p.ideologies && Array.isArray(p.ideologies) && p.ideologies.length > 0)
                ? p.ideologies.map(i => i.toUpperCase())
                : (p.ideology ? [p.ideology.toUpperCase()] : []);

            const isOpposed = factionIdeos.length > 0 &&
                policyIdeos.length > 0 &&
                policyIdeos.some(pi => factionOpposites.has(pi));

            let prerequisiteMissing = false;
            let prerequisiteName = null;
            if (p.requires_policy_id && activePolicyIds) {
                if (!activePolicyIds.has(p.requires_policy_id)) {
                    prerequisiteMissing = true;
                    const prereq = allPolicies.find(pp => pp.id === p.requires_policy_id);
                    prerequisiteName = prereq?.policy_name || 'Unknown Policy';
                }
            }

            // Structural policies that are already active laws cannot be enacted again
            const alreadyEnacted = activePolicyIds && activePolicyIds.has(p.id) && p.policy_type === 'structural';

            return { ...p, isOpposed, prerequisiteMissing, prerequisiteName, alreadyEnacted };
        });
}


// ==================== BILL SUPPORT ====================

function calculateBillSupport(billSupport, sponsorPartyId, allPartySeats) {
    const sponsorSeats = allPartySeats[sponsorPartyId] || 0;
    const acceptedSeats = (billSupport || [])
        .filter(s => s.stance === 'accept' && s.faction_id !== sponsorPartyId)
        .reduce((sum, s) => sum + (allPartySeats[s.faction_id] || s.seat_count || 0), 0);
    const totalSupport = sponsorSeats + acceptedSeats;
    const percent = Math.round((totalSupport / GAME_CONFIG.TOTAL_SEATS) * 100);
    return { sponsorSeats, acceptedSeats, totalSupport, percent };
}


// ==================== VOTE TALLY SYNC ====================

async function syncVoteTallies(supabase, billId) {
    const { data: allVotes } = await supabase
        .from('bill_support')
        .select('stance, seat_count')
        .eq('bill_id', billId);

    let votesFor = 0, votesAgainst = 0;
    (allVotes || []).forEach(v => {
        if (v.stance === 'yes')       votesFor += v.seat_count;
        else if (v.stance === 'no')   votesAgainst += v.seat_count;
    });

    await supabase.from('bills').update({
        votes_for: votesFor,
        votes_against: votesAgainst
    }).eq('id', billId);

    return { votesFor, votesAgainst };
}


// ==================== ENACTMENT APPROVAL IMPACT ====================

function calculateEnactmentApproval(articles, billSupport, sponsorId, factionIdeologies) {
    const APPROVAL_CAP_POSITIVE = 2;
    const APPROVAL_CAP_NEGATIVE = -5;
    const OPPOSITION_KICKER = -1;

    // Collect all ideology tags from bill articles
    const allTags = [];
    for (const art of articles) {
        const p = art.policies || art;
        if (!p) continue;
        const ideos = (p.ideologies && Array.isArray(p.ideologies) && p.ideologies.length > 0)
            ? p.ideologies.map(i => i.toUpperCase())
            : (p.ideology ? [p.ideology.toUpperCase()] : []);
        allTags.push(...ideos);
    }

    if (allTags.length === 0) return {};

    // Calculate net direction per axis from all article tags
    const axisNetScores = {};
    for (const tag of allTags) {
        const mapping = IDEOLOGY_TO_AXIS[tag];
        if (!mapping) continue;
        axisNetScores[mapping.axisKey] = (axisNetScores[mapping.axisKey] || 0) + mapping.direction;
    }

    if (Object.keys(axisNetScores).length === 0) return {};

    // Build voter map: factionId -> stance
    const votes = {};
    votes[sponsorId] = 'yes';
    for (const s of (billSupport || [])) {
        if (s.faction_id !== sponsorId) {
            votes[s.faction_id] = s.stance;
        }
    }

    const approvalDeltas = {};

    for (const [factionId, stance] of Object.entries(votes)) {
        if (stance !== 'yes' && stance !== 'no') continue;

        const factionAxes = factionIdeologies[factionId];
        if (!factionAxes) continue;

        // Sum net alignment: positive = bill aligns with faction, negative = opposes
        let netAlignment = 0;
        for (const [axisKey, netDirection] of Object.entries(axisNetScores)) {
            const factionScore = factionAxes[axisKey] || 0;
            // factionScore > 0 means faction leans "right" on this axis
            // netDirection > 0 means bill pushes "right" on this axis
            // Same sign = aligned
            if (factionScore !== 0 && netDirection !== 0) {
                netAlignment += Math.sign(factionScore) === Math.sign(netDirection)
                    ? Math.abs(netDirection)
                    : -Math.abs(netDirection);
            }
        }

        // YES vote: aligned bill = positive, opposed bill = negative
        // NO vote: inverted — opposed bill = positive, aligned bill = negative
        let delta = stance === 'yes' ? netAlignment : -netAlignment;

        // Apply opposition kicker: extra -1 when the result is negative
        if (delta < 0) {
            delta += OPPOSITION_KICKER;
        }

        // Cap the final value
        delta = Math.max(APPROVAL_CAP_NEGATIVE, Math.min(APPROVAL_CAP_POSITIVE, delta));
        approvalDeltas[factionId] = Math.round(delta * 10) / 10;
    }

    return approvalDeltas;
}

async function applyEnactmentApproval(supabase, approvalDeltas) {
    for (const [factionId, delta] of Object.entries(approvalDeltas)) {
        if (delta === 0) continue;
        await adjustBlocApproval(supabase, factionId, delta);
    }
}


// ==================== STATIC IDEOLOGY PENALTY (LEGACY) ====================

function countOpposedArticles(articles, sponsor) {
    const ideo1 = (sponsor?.ideology_value_1 || '').toUpperCase();
    const ideo2 = (sponsor?.ideology_value_2 || '').toUpperCase();
    const factionIdeos = [ideo1, ideo2].filter(Boolean);

    if (factionIdeos.length === 0) return 0;

    const factionOpposites = new Set(
        factionIdeos.map(fi => IDEOLOGY_OPPOSITES[fi]).filter(Boolean)
    );

    let opposed = 0;
    for (const art of articles) {
        const p = art.policies || art;
        if (!p || !p.policy_name) continue;

        const policyIdeos = (p.ideologies && Array.isArray(p.ideologies) && p.ideologies.length > 0)
            ? p.ideologies.map(i => i.toUpperCase())
            : (p.ideology ? [p.ideology.toUpperCase()] : []);

        if (policyIdeos.length === 0) continue;

        const hasOpposite = policyIdeos.some(pi => factionOpposites.has(pi));
        if (hasOpposite) opposed++;
    }
    return opposed;
}

function calculateIdeologyPenalty(stage, opposedCount, polarization) {
    if (opposedCount === 0) return 0;

    const pol = polarization || 0;
    let penalty = 0;

    if (stage === 'floor') {
        if (pol >= 50) {
            penalty = -1 * opposedCount;
        } else {
            penalty = -1 * Math.floor(opposedCount / 2);
        }
    } else if (stage === 'passed') {
        penalty = -1 * opposedCount;
        if (pol >= 75) {
            penalty += -2 * opposedCount;
        }
    }

    return penalty;
}

async function applyIdeologyPenalty(supabase, sponsorId, penalty) {
    if (penalty === 0 || !sponsorId) return;
    await adjustBlocApproval(supabase, sponsorId, penalty);
}


// ==================== BLOC APPROVAL HELPERS ====================

/**
 * Recalculate derived overall approval_rating for a faction from
 * faction_bloc_approval rows weighted by voter_blocs population_weight.
 * Updates the factions table and returns the new value.
 */
async function recalcDerivedApproval(supabase, factionId, blocRows) {
    if (!blocRows) {
        const { data } = await supabase
            .from('faction_bloc_approval')
            .select('bloc_id, approval')
            .eq('faction_id', factionId);
        blocRows = data || [];
    }
    if (blocRows.length === 0) return null;

    const blocIds = blocRows.map(r => r.bloc_id);
    const { data: blocs } = await supabase
        .from('voter_blocs')
        .select('id, population_weight')
        .in('id', blocIds);
    if (!blocs || blocs.length === 0) return null;

    const weightMap = {};
    for (const b of blocs) weightMap[b.id] = parseFloat(b.population_weight) || 0;

    let weightedSum = 0;
    for (const row of blocRows) {
        weightedSum += row.approval * (weightMap[row.bloc_id] || 0);
    }
    const derived = Math.round(weightedSum / 100);

    await supabase.from('factions')
        .update({ approval_rating: derived })
        .eq('id', factionId);

    return derived;
}

/**
 * Adjust approval for a single faction across all voter blocs uniformly.
 * Updates faction_bloc_approval rows, then recalculates derived approval_rating.
 * Falls back to direct approval_rating update if no bloc rows exist.
 * Returns the new derived overall approval.
 */
async function adjustBlocApproval(supabase, factionId, delta) {
    if (delta === 0) return;

    const { data: blocRows } = await supabase
        .from('faction_bloc_approval')
        .select('id, bloc_id, approval')
        .eq('faction_id', factionId);

    // Fallback: no bloc rows — use legacy direct update
    if (!blocRows || blocRows.length === 0) {
        const { data: faction } = await supabase
            .from('factions')
            .select('approval_rating')
            .eq('id', factionId)
            .single();
        if (!faction) return null;
        const current = faction.approval_rating ?? 50;
        const updated = Math.round(Math.max(0, Math.min(100, current + delta)));
        const { error: legacyErr } = await supabase.from('factions')
            .update({ approval_rating: updated })
            .eq('id', factionId);
        if (legacyErr) console.error(`[adjustBlocApproval] Legacy update failed for faction ${factionId}:`, legacyErr.message);
        return updated;
    }

    // Apply delta to each bloc row, clamped 0-100 and rounded to integer
    for (const row of blocRows) {
        row.approval = Math.round(Math.max(0, Math.min(100, row.approval + delta)));
    }

    // Update all rows
    for (const row of blocRows) {
        const { error: updErr } = await supabase.from('faction_bloc_approval')
            .update({ approval: row.approval })
            .eq('id', row.id);
        if (updErr) console.error(`[adjustBlocApproval] Failed to update bloc ${row.id}:`, updErr.message);
    }

    // Recalculate and update derived approval
    return await recalcDerivedApproval(supabase, factionId, blocRows);
}

/**
 * Ensures faction_bloc_approval rows exist for a given faction.
 * If none exist, seeds them with default approval of 40 for all active blocs.
 * Returns the (possibly newly created) bloc approval rows, or null on failure.
 */
async function ensureBlocApprovals(supabase, factionId, nationId) {
    const { data: existing, error: checkErr } = await supabase
        .from('faction_bloc_approval')
        .select('id, bloc_id, approval')
        .eq('faction_id', factionId);

    if (checkErr) {
        console.error('[ensureBlocApprovals] Check failed:', checkErr.message);
        return null;
    }

    if (existing && existing.length > 0) {
        return existing;
    }

    const { data: blocs, error: blocErr } = await supabase
        .from('voter_blocs')
        .select('id')
        .eq('nation_id', nationId)
        .eq('is_active', true);

    if (blocErr || !blocs || blocs.length === 0) {
        console.warn('[ensureBlocApprovals] No active voter blocs found for nation', nationId);
        return null;
    }

    const rows = blocs.map(bloc => ({
        faction_id: factionId,
        bloc_id: bloc.id,
        approval: 40
    }));

    const { error: upsertErr } = await supabase
        .from('faction_bloc_approval')
        .upsert(rows, { onConflict: 'faction_id,bloc_id', ignoreDuplicates: true });

    if (upsertErr) {
        console.error('[ensureBlocApprovals] Upsert failed:', upsertErr.message);
        return null;
    }

    const { data: newRows } = await supabase
        .from('faction_bloc_approval')
        .select('id, bloc_id, approval')
        .eq('faction_id', factionId);

    console.log(`[ensureBlocApprovals] Seeded ${rows.length} bloc approval rows for faction ${factionId}`);
    return newRows;
}


// ==================== IDEOLOGY SHIFT PROCESSOR ====================

async function processIdeologyShifts(supabase, nationId, resolutions) {
    if (!resolutions || resolutions.length === 0) return;

    const billIds = resolutions.map(r => r.billId);

    const { data: bills } = await supabase
        .from('bills')
        .select('id, proposed_by, bill_type, bill_articles(*, policies(*)), bill_support(faction_id, stance)')
        .in('id', billIds);

    if (!bills || bills.length === 0) return;

    // Only legislative bills affect ideology
    const legislativeBills = bills.filter(b =>
        !['no_confidence', 'confirmation', 'minister_confirmation', 'foundational', 'veto_override'].includes(b.bill_type)
    );
    if (legislativeBills.length === 0) return;

    const passedBillIds = new Set(resolutions.filter(r => r.result === 'passed').map(r => r.billId));

    // Accumulate shifts: { factionId: { axisKey: totalShift } }
    const factionShifts = {};

    function addShift(factionId, axisKey, amount) {
        if (!factionShifts[factionId]) factionShifts[factionId] = {};
        factionShifts[factionId][axisKey] = (factionShifts[factionId][axisKey] || 0) + amount;
    }

    for (const bill of legislativeBills) {
        // Collect ideology tags from articles (per-article, with duplicates)
        const tags = [];
        for (const art of (bill.bill_articles || [])) {
            const p = art.policies || art;
            if (!p) continue;
            const ideos = (p.ideologies && Array.isArray(p.ideologies) && p.ideologies.length > 0)
                ? p.ideologies.map(i => i.toUpperCase())
                : (p.ideology ? [p.ideology.toUpperCase()] : []);
            tags.push(...ideos);
        }
        if (tags.length === 0) continue;

        const isPassed = passedBillIds.has(bill.id);

        // Build YES voter set (normalize committee stances)
        const yesVoters = new Set();
        for (const s of (bill.bill_support || [])) {
            const stance = s.stance === 'accept' ? 'yes' : s.stance === 'reject' ? 'no' : s.stance;
            if (stance === 'yes') yesVoters.add(s.faction_id);
        }
        // Sponsor always counts as YES
        if (bill.proposed_by) yesVoters.add(bill.proposed_by);

        for (const tag of tags) {
            const mapping = IDEOLOGY_TO_AXIS[tag];
            if (!mapping) continue;

            // +2 for proposing (sponsor only)
            if (bill.proposed_by) {
                addShift(bill.proposed_by, mapping.axisKey, 2 * mapping.direction);
            }

            // +3 for voting YES (all YES voters including sponsor)
            for (const factionId of yesVoters) {
                addShift(factionId, mapping.axisKey, 3 * mapping.direction);
            }

            // +1 if bill passed (YES voters only)
            if (isPassed) {
                for (const factionId of yesVoters) {
                    addShift(factionId, mapping.axisKey, 1 * mapping.direction);
                }
            }
        }
    }

    // Apply accumulated shifts to faction_ideology
    for (const [factionId, axisShifts] of Object.entries(factionShifts)) {
        const ideologyRow = await loadFactionIdeology(supabase, factionId);
        if (!ideologyRow) continue;

        const currentScores = extractAxisScores(ideologyRow);
        const updateObj = {};
        let hasChanges = false;

        for (const [axisKey, shift] of Object.entries(axisShifts)) {
            const oldScore = currentScores[axisKey] || 0;
            const newScore = Math.max(-100, Math.min(100, oldScore + shift));
            if (newScore !== oldScore) {
                updateObj[axisKey] = newScore;
                hasChanges = true;
            }
        }

        if (hasChanges) {
            await supabase.from('faction_ideology').update(updateObj).eq('faction_id', factionId);
        }
    }
}


// ==================== BILL RESOLUTION ENGINE ====================

async function resolveExpiredVotes(supabase, nationId) {
    const { data: shard } = await supabase
        .from('shard')
        .select('current_tick')
        .eq('name', 'Alpha Shard')
        .single();
    if (!shard) return [];
    const currentTick = shard.current_tick;

    const { data: expiredBills, error } = await supabase
        .from('bills')
        .select('*, factions(faction_name, ideology_value_1, ideology_value_2), bill_articles(*, policies(*)), bill_support(*, factions(faction_name))')
        .eq('nation_id', nationId)
        .eq('status', 'floor')
        .lte('voting_ends_tick', currentTick);

    if (error || !expiredBills || expiredBills.length === 0) return [];

    const results = [];

    for (const bill of expiredBills) {
        const { data: nation } = await supabase
            .from('nations')
            .select('name, government_type')
            .eq('id', bill.nation_id)
            .single();
        let votesFor = 0, votesAgainst = 0;

        (bill.bill_support || []).forEach(s => {
            // Normalize committee stances: 'accept' → 'yes', 'reject' → 'no'
            const stance = s.stance === 'accept' ? 'yes' : s.stance === 'reject' ? 'no' : s.stance;
            if (stance === 'yes') votesFor += s.seat_count;
            else if (stance === 'no') votesAgainst += s.seat_count;
        });

        const totalVoted = votesFor + votesAgainst;

        // No-confidence uses simple majority (votesFor > votesAgainst)
        // Foundational bills and veto overrides require 2/3 supermajority
        // Normal bills require simple majority (50% + 1)
        const isNoConfidence = bill.bill_type === 'no_confidence';
        const isFoundational = bill.bill_type === 'foundational';
        const isVetoOverride = bill.bill_type === 'veto_override';
        const supermajorityThreshold = isFoundational ? GAME_CONFIG.SUPERMAJORITY_THRESHOLD
            : isVetoOverride ? GAME_CONFIG.VETO_OVERRIDE_THRESHOLD : null;
        const passed = isNoConfidence
            ? (totalVoted > 0 && votesFor > votesAgainst)
            : supermajorityThreshold
                ? (totalVoted > 0 && votesFor >= Math.ceil(GAME_CONFIG.TOTAL_SEATS * supermajorityThreshold))
                : (totalVoted > 0 && votesFor >= GAME_CONFIG.MAJORITY_SEATS);

        if (isNoConfidence) {
            // Handle no-confidence resolution (pass or fail)
            if (passed) {
                await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
            } else {
                await failBill(supabase, bill);
            }
            await resolveNoConfidence(supabase, bill, passed, votesFor, votesAgainst, currentTick);
            results.push({ billId: bill.id, billName: bill.bill_name, result: passed ? 'passed' : 'failed', votesFor, votesAgainst, type: 'no_confidence' });
        } else if (isFoundational) {
            // Handle foundational bill resolution (electoral makeup, etc.)
            let enacted = false;
            if (passed) {
                enacted = await enactFoundationalBill(supabase, bill, currentTick);
            }
            if (!passed || !enacted) {
                if (!enacted && passed) {
                    // enactFoundationalBill already marked it 'failed' internally
                    console.warn(`[resolveExpiredVotes] Foundational bill ${bill.id} had enough votes but enactment failed (invalid proposed_seats).`);
                } else {
                    await failBill(supabase, bill);
                }
            }
            const eventKey = enacted ? 'bill_passed' : 'bill_failed';
            await supabase.rpc('fire_system_event', {
                p_trigger_key: eventKey,
                p_nation_id: bill.nation_id,
                p_tick: currentTick,
                p_placeholders: {
                    nation: nation?.name || 'Unknown',
                    bill_name: bill.bill_name,
                    sponsor: bill.factions?.faction_name || 'Unknown',
                    votes_for: String(votesFor),
                    votes_against: String(votesAgainst),
                    article_count: '0'
                }
            });
            results.push({ billId: bill.id, billName: bill.bill_name, result: enacted ? 'passed' : 'failed', votesFor, votesAgainst, type: 'foundational' });
        } else if (bill.bill_type === 'confirmation' && bill.ambassador_id) {
            // Ambassador confirmation bill
            if (passed) {
                await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
                // Activate the ambassador
                await supabase.from('ambassadors').update({
                    status: 'active',
                    is_active: true
                }).eq('id', bill.ambassador_id);
                await supabase.rpc('fire_system_event', {
                    p_trigger_key: 'bill_passed',
                    p_nation_id: bill.nation_id,
                    p_tick: currentTick,
                    p_placeholders: {
                        nation: nation?.name || 'Unknown',
                        bill_name: bill.bill_name,
                        sponsor: bill.factions?.faction_name || 'Unknown',
                        votes_for: String(votesFor),
                        votes_against: String(votesAgainst),
                        article_count: '0'
                    }
                });
            } else {
                await failBill(supabase, bill);
                // Reject the ambassador
                await supabase.from('ambassadors').update({
                    status: 'rejected',
                    is_active: false
                }).eq('id', bill.ambassador_id);
                await supabase.rpc('fire_system_event', {
                    p_trigger_key: 'bill_failed',
                    p_nation_id: bill.nation_id,
                    p_tick: currentTick,
                    p_placeholders: {
                        nation: nation?.name || 'Unknown',
                        bill_name: bill.bill_name,
                        sponsor: bill.factions?.faction_name || 'Unknown',
                        votes_for: String(votesFor),
                        votes_against: String(votesAgainst)
                    }
                });
            }
            results.push({ billId: bill.id, billName: bill.bill_name, result: passed ? 'passed' : 'failed', votesFor, votesAgainst, type: 'confirmation' });
        } else if (bill.bill_type === 'minister_confirmation' && bill.ministry_key) {
            // Minister confirmation bill (Presidential systems)
            const mKey = bill.ministry_key;
            const { data: ministry } = await supabase.from('ministries')
                .select('id, pending_minister, rejected_parties')
                .eq('nation_id', bill.nation_id).eq('ministry_key', mKey).eq('is_active', true)
                .maybeSingle();

            if (passed) {
                await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);

                if (!ministry) {
                    // Ministry row doesn't exist — create it so the confirmation can proceed
                    console.warn(`Minister confirmation passed but ministry row missing for ${mKey} in nation ${bill.nation_id}. Creating it.`);
                    const { data: createdMinistry } = await supabase.from('ministries').insert({
                        nation_id: bill.nation_id,
                        ministry_key: mKey,
                        ministry_name: mKey,
                        is_active: true,
                        confirmation_status: 'pending',
                        pending_minister: null,
                        rejected_parties: []
                    }).select('id, pending_minister, rejected_parties').single();
                    // Use the bill's metadata as fallback for pending_minister
                    if (createdMinistry && bill.metadata?.pending_minister) {
                        await supabase.from('ministries').update({
                            pending_minister: bill.metadata.pending_minister
                        }).eq('id', createdMinistry.id);
                    }
                }

                if (ministry?.pending_minister) {
                    const pm = ministry.pending_minister;
                    const ministryNames = {
                        prime_minister: 'Prime Minister', interior: 'Ministry of the Interior',
                        foreign: 'Foreign Ministry', defense: 'Ministry of Defense',
                        finance: 'Ministry of Finance', education: 'Ministry of Education',
                        healthcare: 'Ministry of Healthcare', labor: 'Ministry of Labor',
                        justice: 'Ministry of Justice', transportation: 'Ministry of Transportation',
                        security: 'Ministry of Security'
                    };
                    await supabase.from('ministries').update({
                        party_id: pm.party_id,
                        minister_first_name: pm.first_name,
                        minister_last_name: pm.last_name,
                        minister_age: pm.age,
                        minister_approval: 50,
                        ministry_name: ministryNames[mKey] || mKey,
                        confirmation_status: 'confirmed',
                        pending_minister: null
                    }).eq('id', ministry.id);
                }

                try {
                    await supabase.rpc('fire_system_event', {
                        p_trigger_key: 'bill_passed',
                        p_nation_id: bill.nation_id,
                        p_tick: currentTick,
                        p_placeholders: {
                            nation: nation?.name || 'Unknown',
                            bill_name: bill.bill_name,
                            sponsor: bill.factions?.faction_name || 'Unknown',
                            votes_for: String(votesFor),
                            votes_against: String(votesAgainst),
                            article_count: '0'
                        }
                    });
                } catch (e) { /* non-blocking */ }
            } else {
                await failBill(supabase, bill);

                // Record rejected party so President can't re-nominate same party for this slot
                if (ministry?.pending_minister) {
                    const rejectedPartyId = ministry.pending_minister.party_id;
                    const existingRejected = ministry.rejected_parties || [];
                    if (!existingRejected.includes(rejectedPartyId)) {
                        existingRejected.push(rejectedPartyId);
                    }
                    await supabase.from('ministries').update({
                        confirmation_status: 'rejected',
                        pending_minister: null,
                        rejected_parties: existingRejected
                    }).eq('id', ministry.id);
                }

                try {
                    await supabase.rpc('fire_system_event', {
                        p_trigger_key: 'bill_failed',
                        p_nation_id: bill.nation_id,
                        p_tick: currentTick,
                        p_placeholders: {
                            nation: nation?.name || 'Unknown',
                            bill_name: bill.bill_name,
                            sponsor: bill.factions?.faction_name || 'Unknown',
                            votes_for: String(votesFor),
                            votes_against: String(votesAgainst)
                        }
                    });
                } catch (e) { /* non-blocking */ }
            }
            results.push({ billId: bill.id, billName: bill.bill_name, result: passed ? 'passed' : 'failed', votesFor, votesAgainst, type: 'minister_confirmation' });
        } else if (bill.bill_type === 'veto_override' && bill.original_bill_id) {
            // Veto override bill (Presidential systems)
            if (passed) {
                await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
                // Enact the ORIGINAL vetoed bill
                const { data: originalBill } = await supabase.from('bills')
                    .select('*, factions(faction_name, ideology_value_1, ideology_value_2), bill_articles(*, policies(*)), bill_support(*, factions(faction_name))')
                    .eq('id', bill.original_bill_id).single();
                if (originalBill) {
                    await supabase.from('bills').update({ president_action: 'overridden' }).eq('id', originalBill.id);
                    await enactBill(supabase, originalBill, currentTick);
                }
                try {
                    await supabase.rpc('fire_system_event', {
                        p_trigger_key: 'bill_passed',
                        p_nation_id: bill.nation_id,
                        p_tick: currentTick,
                        p_placeholders: { nation: nation?.name || 'Unknown', bill_name: bill.bill_name, sponsor: bill.factions?.faction_name || 'Unknown', votes_for: String(votesFor), votes_against: String(votesAgainst), article_count: '0' }
                    });
                } catch (e) { /* non-blocking */ }
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'passed', votesFor, votesAgainst, type: 'veto_override' });
            } else {
                await failBill(supabase, bill);
                try {
                    await supabase.rpc('fire_system_event', {
                        p_trigger_key: 'bill_failed',
                        p_nation_id: bill.nation_id,
                        p_tick: currentTick,
                        p_placeholders: { nation: nation?.name || 'Unknown', bill_name: bill.bill_name, sponsor: bill.factions?.faction_name || 'Unknown', votes_for: String(votesFor), votes_against: String(votesAgainst) }
                    });
                } catch (e) { /* non-blocking */ }
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed', votesFor, votesAgainst, type: 'veto_override' });
            }
        } else if (passed) {
            // Presidential systems: route regular/repeal bills to president's desk
            if (nation?.government_type === 'Presidential') {
                await supabase.from('bills').update({
                    status: 'president_desk',
                    passed_tick: currentTick,
                    president_desk_deadline: currentTick + GAME_CONFIG.PRESIDENT_DESK_TICKS
                }).eq('id', bill.id);
                await supabase.rpc('fire_system_event', {
                    p_trigger_key: 'bill_passed',
                    p_nation_id: bill.nation_id,
                    p_tick: currentTick,
                    p_placeholders: {
                        nation: nation?.name || 'Unknown',
                        bill_name: bill.bill_name + ' (sent to President\'s desk)',
                        sponsor: bill.factions?.faction_name || 'Unknown',
                        votes_for: String(votesFor),
                        votes_against: String(votesAgainst),
                        article_count: String((bill.bill_articles || []).length)
                    }
                });
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'president_desk', votesFor, votesAgainst });
            } else {
                await enactBill(supabase, bill, currentTick);
                await supabase.rpc('fire_system_event', {
                    p_trigger_key: 'bill_passed',
                    p_nation_id: bill.nation_id,
                    p_tick: currentTick,
                    p_placeholders: {
                        nation: nation?.name || 'Unknown',
                        bill_name: bill.bill_name,
                        sponsor: bill.factions?.faction_name || 'Unknown',
                        votes_for: String(votesFor),
                        votes_against: String(votesAgainst),
                        article_count: String((bill.bill_articles || []).length)
                    }
                });
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'passed', votesFor, votesAgainst });
            }
        } else {
            await failBill(supabase, bill);
            await supabase.rpc('fire_system_event', {
                p_trigger_key: 'bill_failed',
                p_nation_id: bill.nation_id,
                p_tick: currentTick,
                p_placeholders: {
                    nation: nation?.name || 'Unknown',
                    bill_name: bill.bill_name,
                    sponsor: bill.factions?.faction_name || 'Unknown',
                    votes_for: String(votesFor),
                    votes_against: String(votesAgainst)
                }
            });
            results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed', votesFor, votesAgainst });
        }
    }

    return results;
}

async function enactBill(supabase, bill, currentTick) {
    await supabase.from('bills').update({
        status: 'passed',
        passed_tick: currentTick
    }).eq('id', bill.id);

    const { data: nation } = await supabase
        .from('nations')
        .select('*')
        .eq('id', bill.nation_id)
        .single();
    if (!nation) return;

    const { data: currentActiveLaws } = await supabase
        .from('active_laws')
        .select('*, policies(*)')
        .eq('nation_id', bill.nation_id);

    if (bill.bill_type === 'repeal' && bill.repeal_active_law_id) {
        const targetLaw = (currentActiveLaws || []).find(l => l.id === bill.repeal_active_law_id);
        if (targetLaw && targetLaw.policies) {
            await reversePolicy(supabase, nation, targetLaw.policies, targetLaw.passed_tick, currentTick);
            await supabase.from('active_laws').delete().eq('id', bill.repeal_active_law_id);
        }
    } else {
        const articles = (bill.bill_articles || []).filter(a => a.policy_id);

        for (const art of articles) {
            const policy = art.policies;
            if (!policy) continue;

            if (policy.opposed_policy_ids && Array.isArray(policy.opposed_policy_ids)) {
                for (const opposedId of policy.opposed_policy_ids) {
                    const opposedLaw = (currentActiveLaws || []).find(l => l.policy_id === opposedId);
                    if (opposedLaw && opposedLaw.policies) {
                        await reversePolicy(supabase, nation, opposedLaw.policies, opposedLaw.passed_tick, currentTick);
                        await supabase.from('active_laws').delete().eq('id', opposedLaw.id);
                    }
                }
            }

            const { error: activeLawError } = await supabase.from('active_laws').insert({
                nation_id: bill.nation_id,
                policy_id: policy.id,
                passed_tick: currentTick,
                proposed_by: bill.proposed_by,
                effects_applied_through_tick: currentTick - 1
            });
            if (activeLawError) {
                console.error(`[enactBill] Failed to insert active_law for policy ${policy.id} (${policy.policy_name}):`, activeLawError.message);
            }
        }
    }

    const sponsorFaction = bill.factions;
    if (sponsorFaction) {
        const opposed = countOpposedArticles(bill.bill_articles || [], sponsorFaction);
        if (opposed > 0) {
            const penalty = calculateIdeologyPenalty('passed', opposed, nation.polarization || 0);
            await applyIdeologyPenalty(supabase, bill.proposed_by, penalty);
        }
    }

    // Load ideology axes for all voting factions (sponsor + voters)
    const voterFactionIds = [bill.proposed_by, ...(bill.bill_support || []).map(s => s.faction_id)];
    const uniqueFactionIds = [...new Set(voterFactionIds.filter(Boolean))];
    const { data: ideoRows } = await supabase
        .from('faction_ideology')
        .select('faction_id, liberty_equality, tradition_progress, security_freedom, globalism_nationalism, individualism_collectivism')
        .in('faction_id', uniqueFactionIds);

    const factionIdeologies = {};
    for (const row of (ideoRows || [])) {
        factionIdeologies[row.faction_id] = row;
    }

    const approvalDeltas = calculateEnactmentApproval(
        bill.bill_articles || [],
        bill.bill_support || [],
        bill.proposed_by,
        factionIdeologies
    );
    await applyEnactmentApproval(supabase, approvalDeltas);
}

async function reversePolicy(supabase, nation, policy, passedTick, currentTick) {
    const ticksActive = currentTick - (passedTick || 0);
    if (ticksActive <= 0) return;

    const sourceEffects = [];
    if (policy.stat_effects && Array.isArray(policy.stat_effects) && policy.stat_effects.length > 0) {
        sourceEffects.push(...policy.stat_effects);
    } else if (policy.target_stat) {
        sourceEffects.push({
            stat_key: policy.target_stat,
            direction: (policy.stat_direction || 'UP').toLowerCase(),
            rate: policy.stat_change_per_tick || 1,
            delay_ticks: 0,
            duration_ticks: policy.duration_months || 12
        });
    }

    if (sourceEffects.length === 0) return;

    const reversalEffects = [];

    for (const eff of sourceEffects) {
        const delay = eff.delay_ticks || 0;
        const duration = eff.duration_ticks || 12;

        let effectiveTicks = 0;
        if (ticksActive > delay) {
            effectiveTicks = Math.min(ticksActive - delay, duration);
        }

        if (effectiveTicks <= 0) continue;

        reversalEffects.push({
            stat_key: eff.stat_key,
            direction: eff.direction === 'up' ? 'down' : 'up',
            rate: eff.rate || 1,
            delay_ticks: 0,
            duration_ticks: effectiveTicks
        });
    }

    if (reversalEffects.length === 0) return;

    const { error: reversalInsertError } = await supabase.from('active_laws').insert({
        nation_id: nation.id,
        policy_id: policy.id,
        passed_tick: currentTick,
        proposed_by: null,
        effects_applied_through_tick: currentTick - 1,
        is_reversal: true,
        reversal_effects: reversalEffects
    });
    if (reversalInsertError) {
        console.error(`[reversePolicy] Failed to insert reversal active_law for policy ${policy.id}:`, reversalInsertError.message);
    }
}

// ==================== FOUNDATIONAL BILL ENACTMENT ====================

async function enactFoundationalBill(supabase, bill, currentTick) {
    // Validate proposed_seats BEFORE marking the bill as passed
    let newTotalSeats = bill.proposed_seats;

    // Fallback: if proposed_seats is null (column missing or data lost), parse from preamble
    if (!newTotalSeats && bill.preamble) {
        const match = bill.preamble.match(/from\s+\d+\s+to\s+(\d+)/i);
        if (match) {
            newTotalSeats = parseInt(match[1], 10);
            console.warn(`[enactFoundationalBill] proposed_seats was null, recovered ${newTotalSeats} from preamble`);
        }
    }

    if (!newTotalSeats || newTotalSeats < 50 || newTotalSeats > 500) {
        console.warn(`[enactFoundationalBill] Bill ${bill.id} has invalid proposed_seats: ${newTotalSeats}. Marking as failed.`);
        await supabase.from('bills').update({
            status: 'failed',
            passed_tick: currentTick
        }).eq('id', bill.id);
        return false;
    }

    // Validation passed — mark bill as passed
    console.log(`[enactFoundationalBill] Bill ${bill.id}: proposed_seats=${newTotalSeats}. Marking as passed.`);
    await supabase.from('bills').update({
        status: 'passed',
        passed_tick: currentTick
    }).eq('id', bill.id);

    // Get current total seats to compute delta
    const { data: nationData } = await supabase
        .from('nations')
        .select('total_seats')
        .eq('id', bill.nation_id)
        .single();
    const currentTotalSeats = nationData?.total_seats || GAME_CONFIG.TOTAL_SEATS;
    const delta = newTotalSeats - currentTotalSeats;

    // 1. Update nation's total_seats
    await supabase.from('nations').update({
        total_seats: newTotalSeats
    }).eq('id', bill.nation_id);

    if (delta !== 0) {
        // SEATS CHANGE — proportionally rescale all party seats to the new total
        const { data: election } = await supabase
            .from('elections')
            .select('id, results')
            .eq('nation_id', bill.nation_id)
            .eq('status', 'completed')
            .eq('election_type', 'parliamentary')
            .order('election_tick', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (election?.results?.votes) {
            const voteTotals = {};
            for (const v of election.results.votes) {
                voteTotals[v.party_id] = v.votes || 0;
            }
            const newSeats = allocateSeatsByVotes(voteTotals, newTotalSeats);

            for (const [partyId, seats] of Object.entries(newSeats)) {
                await supabase.from('factions').update({ seats }).eq('id', partyId);
            }
        }
        console.log(`[enactFoundationalBill] ${currentTotalSeats} -> ${newTotalSeats} (${delta > 0 ? '+' : ''}${delta}). Seats rescaled.`);
    } else {
        console.log(`[enactFoundationalBill] No seat change (already ${newTotalSeats}).`);
    }

    // Update GAME_CONFIG for current session
    GAME_CONFIG.TOTAL_SEATS = newTotalSeats;
    GAME_CONFIG.MAJORITY_SEATS = Math.floor(newTotalSeats / 2) + 1;
    return true;
}

async function failBill(supabase, bill) {
    await supabase.from('bills').update({
        status: 'failed'
    }).eq('id', bill.id);
}


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
const NATION_STAT_COLUMNS = [
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

const NATION_STAT_COLUMN_SET = new Set(NATION_STAT_COLUMNS);

const STAT_KEY_ALIASES = {
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

function normalizeNationStatKey(statKey) {
    if (!statKey || typeof statKey !== 'string') return null;
    return STAT_KEY_ALIASES[statKey] || statKey;
}

/**
 * Stats where HIGHER values are better (increase = achievement).
 */
const STATS_HIGHER_IS_BETTER = [
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
const STATS_LOWER_IS_BETTER = [
    'debt', 'debt_growth', 'inflation', 'interest_rates',
    'unemployment', 'poverty_rate', 'income_inequality', 'death_rate',
    'drug_use', 'fuel_prices', 'pollution', 'carbon_emissions',
    'crime_rate', 'incarceration_rate', 'corruption', 'polarization',
    'civil_unrest', 'terrorism', 'political_violence',
    'illegal_immigration', 'emigration', 'sanctions'
];

/**
 * Snapshot all nation stats into a flat JSONB object.
 */
function snapshotNationStats(nation) {
    const snapshot = {};
    for (const key of NATION_STAT_COLUMNS) {
        if (nation[key] !== undefined && nation[key] !== null) {
            snapshot[key] = nation[key];
        }
    }
    return snapshot;
}

/**
 * Close the current administration for a nation.
 * Snapshots end stats, queries bills/crises during the admin's tenure, sets end fields.
 *
 * @param {object} supabase - Supabase client
 * @param {string} nationId - Nation UUID
 * @param {object} nation - Full nation row (for stat snapshot)
 * @param {string} endReason - Why the admin ended: 'election_loss', 'new_coalition', 'coalition_collapse', 'coup'
 * @param {number} currentTick - Current shard tick
 * @param {string} currentDate - Current game date string (e.g., "March, 2001")
 * @param {number|null} governmentApproval - Current government approval percentage
 */
async function closeAdministration(supabase, nationId, nation, endReason, currentTick, currentDate, governmentApproval) {
    try {
        // Find all currently open administrations (defensive against legacy duplicates)
        const { data: openAdmins, error: openAdminsErr } = await supabase
            .from('administrations')
            .select('*')
            .eq('nation_id', nationId)
            .is('ended_at_tick', null)
            .order('started_at_tick', { ascending: false })
            .order('created_at', { ascending: false });

        if (openAdminsErr) throw openAdminsErr;

        if (!openAdmins || openAdmins.length === 0) {
            console.warn('closeAdministration: No open administration found for nation', nationId);
            return;
        }

        if (openAdmins.length > 1) {
            console.warn('closeAdministration: duplicate open administrations detected', {
                event: 'duplicate_open_administrations',
                nation_id: nationId,
                open_count: openAdmins.length,
                open_admin_ids: openAdmins.map(a => a.id),
                resolution: 'closing_all_open_rows_with_consistent_end_fields',
                end_reason: endReason,
                end_tick: currentTick
            });
        }

        const statsAtEnd = snapshotNationStats(nation);

        for (const currentAdmin of openAdmins) {
            // Query bills passed during this administration
            const { data: passedBills, error: passedBillsErr } = await supabase
                .from('bills')
                .select('id, bill_name, passed_tick')
                .eq('nation_id', nationId)
                .eq('status', 'passed')
                .gte('passed_tick', currentAdmin.started_at_tick)
                .lte('passed_tick', currentTick);
            if (passedBillsErr) throw passedBillsErr;

            const billsPassed = (passedBills || []).map(b => ({
                bill_id: b.id,
                bill_name: b.bill_name,
                passed_tick: b.passed_tick
            }));

            // Query crises (events with category 'crisis' or matching crisis event names)
            const { data: eventsDuring, error: eventsErr } = await supabase
                .from('event_log')
                .select('event_id, event_name, category, fired_at_tick')
                .eq('nation_id', nationId)
                .gte('fired_at_tick', currentAdmin.started_at_tick)
                .lte('fired_at_tick', currentTick);
            if (eventsErr) throw eventsErr;

            const crisisEvents = (eventsDuring || []).filter(e =>
                e.category === 'crisis' || e.category === 'disaster' || e.category === 'conflict'
            );

            const crisesStarted = crisisEvents
                .filter(e => !e.event_name || !e.event_name.startsWith('CRISIS_RESOLVED:'))
                .map(e => ({
                    event_id: e.event_id,
                    title: e.event_name,
                    started_tick: e.fired_at_tick
                }));

            const crisesSolved = (eventsDuring || [])
                .filter(e => e.event_name && e.event_name.startsWith('CRISIS_RESOLVED:'))
                .map(e => ({
                    title: e.event_name.replace('CRISIS_RESOLVED: ', ''),
                    solved_tick: e.fired_at_tick
                }));

            // Count elections survived (elections that occurred during this admin where the coalition continued)
            const { data: electionsDuring, error: electionsErr } = await supabase
                .from('elections')
                .select('id, election_tick')
                .eq('nation_id', nationId)
                .eq('status', 'completed')
                .gte('election_tick', currentAdmin.started_at_tick)
                .lt('election_tick', currentTick);
            if (electionsErr) throw electionsErr;

            // Update the administration record
            const { error: updateErr } = await supabase
                .from('administrations')
                .update({
                    stats_at_end: statsAtEnd,
                    approval_at_end: governmentApproval,
                    ended_at_tick: currentTick,
                    ended_at_date: currentDate,
                    end_reason: endReason,
                    bills_passed: billsPassed,
                    laws_repealed: [],
                    crises_started: crisesStarted,
                    crises_solved: crisesSolved,
                    elections_survived: (electionsDuring || []).length,
                    updated_at: new Date().toISOString()
                })
                .eq('id', currentAdmin.id);
            if (updateErr) throw updateErr;

            console.log(`Administration closed: "${currentAdmin.admin_name}" — reason: ${endReason}`);
        }
    } catch (err) {
        console.error('closeAdministration error:', err);
        throw err;
    }
}

/**
 * Create a new administration record when a coalition forms.
 *
 * @param {object} supabase - Supabase client
 * @param {string} nationId - Nation UUID
 * @param {object} nation - Full nation row (for stat snapshot + HOS)
 * @param {object} coalition - Active coalition object (party_ids, lead_party_id)
 * @param {Array} allParties - Array of faction objects with id, faction_name, seats
 * @param {number} currentTick - Current shard tick
 * @param {string} currentDate - Current game date string
 * @param {number|null} governmentApproval - Current government approval percentage
 */
async function createAdministration(supabase, nationId, nation, coalition, allParties, currentTick, currentDate, governmentApproval) {
    try {
        // Safety net: close any orphaned open administrations before creating a new one
        const { data: orphaned } = await supabase
            .from('administrations')
            .select('id')
            .eq('nation_id', nationId)
            .is('ended_at_tick', null);
        if (orphaned && orphaned.length > 0) {
            console.warn(`createAdministration: closing ${orphaned.length} orphaned open administration(s) for nation ${nationId}`);
            await supabase
                .from('administrations')
                .update({ ended_at_tick: currentTick, ended_at_date: currentDate, end_reason: 'new_coalition' })
                .eq('nation_id', nationId)
                .is('ended_at_tick', null);
        }

        const statsAtStart = snapshotNationStats(nation);

        // Build coalition party info
        const coalitionPartyIds = coalition?.party_ids || [];
        const coalitionParties = coalitionPartyIds.map(pid => {
            const party = allParties.find(p => p.id === pid);
            return {
                party_id: pid,
                party_name: party?.faction_name || 'Unknown',
                seats: party?.seats || 0
            };
        });
        const totalSeats = coalitionParties.reduce((sum, p) => sum + p.seats, 0);

        // Get PM party info
        const leadPartyId = coalition?.lead_party_id;
        const leadParty = allParties.find(p => p.id === leadPartyId);
        const pmPartyName = leadParty?.faction_name || 'Unknown';

        // Get active PM name
        const { data: activeHOG } = await supabase
            .from('head_of_government')
            .select('first_name, last_name')
            .eq('nation_id', nationId)
            .eq('active', true)
            .maybeSingle();

        const pmName = activeHOG ? `${activeHOG.first_name} ${activeHOG.last_name}` : null;

        // Head of state name
        const hosName = (nation.head_of_state_first_name && nation.head_of_state_last_name)
            ? `${nation.head_of_state_first_name} ${nation.head_of_state_last_name}`
            : null;

        // Generate admin name from PM last name, falling back to HOS
        const adminName = activeHOG?.last_name
            ? `${activeHOG.last_name} Administration`
            : (nation.head_of_state_last_name
                ? `${nation.head_of_state_last_name} Administration`
                : `${pmPartyName} Administration`);

        const { error: insertErr } = await supabase
            .from('administrations')
            .insert({
                nation_id: nationId,
                admin_name: adminName,
                head_of_state: hosName,
                prime_minister: pmName,
                pm_party_name: pmPartyName,
                pm_party_id: leadPartyId,
                coalition_parties: coalitionParties,
                total_seats: totalSeats,
                government_type: nation.government_type || 'Democracy',
                started_at_tick: currentTick,
                started_at_date: currentDate,
                stats_at_start: statsAtStart,
                approval_at_start: governmentApproval
            });
        if (insertErr) throw insertErr;

        console.log(`Administration created: "${adminName}" at tick ${currentTick}`);
    } catch (err) {
        console.error('createAdministration error:', err);
        throw err;
    }
}

/**
 * Atomically close existing open administrations and create a new one.
 * Falls back to sequential close + create if RPC is unavailable.
 */
async function rolloverAdministration(supabase, nationId, nation, endReason, coalition, allParties, currentTick, currentDate, governmentApproval) {
    const statsAtStart = snapshotNationStats(nation);

    const coalitionPartyIds = coalition?.party_ids || [];
    const coalitionParties = coalitionPartyIds.map(pid => {
        const party = allParties.find(p => p.id === pid);
        return {
            party_id: pid,
            party_name: party?.faction_name || 'Unknown',
            seats: party?.seats || 0
        };
    });
    const totalSeats = coalitionParties.reduce((sum, p) => sum + p.seats, 0);

    const leadPartyId = coalition?.lead_party_id;
    const leadParty = allParties.find(p => p.id === leadPartyId);
    const pmPartyName = leadParty?.faction_name || 'Unknown';

    const { data: activeHOG, error: hogErr } = await supabase
        .from('head_of_government')
        .select('first_name, last_name')
        .eq('nation_id', nationId)
        .eq('active', true)
        .maybeSingle();
    if (hogErr) throw hogErr;

    const pmName = activeHOG ? `${activeHOG.first_name} ${activeHOG.last_name}` : null;
    const hosName = (nation.head_of_state_first_name && nation.head_of_state_last_name)
        ? `${nation.head_of_state_first_name} ${nation.head_of_state_last_name}`
        : null;
    const adminName = activeHOG?.last_name
        ? `${activeHOG.last_name} Administration`
        : (nation.head_of_state_last_name
            ? `${nation.head_of_state_last_name} Administration`
            : `${pmPartyName} Administration`);

    const payload = {
        nation_id: nationId,
        admin_name: adminName,
        head_of_state: hosName,
        prime_minister: pmName,
        pm_party_name: pmPartyName,
        pm_party_id: leadPartyId,
        coalition_parties: coalitionParties,
        total_seats: totalSeats,
        government_type: nation.government_type || 'Democracy',
        started_at_tick: currentTick,
        started_at_date: currentDate,
        stats_at_start: statsAtStart,
        approval_at_start: governmentApproval
    };

    const { error: rpcErr } = await supabase.rpc('rollover_administration', {
        p_nation_id: nationId,
        p_end_reason: endReason,
        p_end_tick: currentTick,
        p_end_date: currentDate,
        p_end_approval: governmentApproval,
        p_new_administration: payload
    });

    if (!rpcErr) {
        console.log(`Administration rolled over atomically: "${adminName}" at tick ${currentTick}`);
        return;
    }

    // Graceful fallback if DB function has not been deployed yet
    const rpcUnavailable = /rollover_administration/i.test(rpcErr.message || '') || rpcErr.code === 'PGRST202';
    if (!rpcUnavailable) throw rpcErr;

    console.warn('rolloverAdministration RPC unavailable; falling back to sequential close + create');
    await closeAdministration(supabase, nationId, nation, endReason, currentTick, currentDate, governmentApproval);
    await createAdministration(supabase, nationId, nation, coalition, allParties, currentTick, currentDate, governmentApproval);
}


// ==================== COALITION DISSOLUTION ====================

/**
 * Dissolve the current coalition government.
 * - Sets government_formations status to 'dissolved'
 * - Deactivates PM in head_of_government
 * - Vacates all ministries
 * Nation enters formation period (processGovernmentVacancy handles penalties).
 */
async function dissolveCoalition(supabase, nationId, excludeFormationId) {
    // Bust coalition cache so pages immediately see the dissolved state
    if (typeof qCacheBust === 'function') qCacheBust('coalition_' + nationId);

    // Dissolve government_formations (skip the new formation if one is being created)
    let dissolveQuery = supabase
        .from('government_formations')
        .update({ status: 'dissolved' })
        .eq('nation_id', nationId)
        .in('status', ['formed', 'caretaker']);
    if (excludeFormationId) dissolveQuery = dissolveQuery.neq('id', excludeFormationId);
    const { error: formErr } = await dissolveQuery;
    if (formErr) console.warn('dissolveCoalition: formations update failed:', formErr);

    // Also dissolve legacy active_coalitions
    const { error: acErr } = await supabase
        .from('active_coalitions')
        .update({ status: 'dissolved', dissolved_at: new Date().toISOString() })
        .eq('nation_id', nationId)
        .is('dissolved_at', null);
    if (acErr) console.warn('dissolveCoalition: active_coalitions update failed:', acErr);

    // Deactivate PM
    const { error: pmErr } = await supabase
        .from('head_of_government')
        .update({ active: false })
        .eq('nation_id', nationId)
        .eq('active', true);
    if (pmErr) console.warn('dissolveCoalition: PM deactivation failed:', pmErr);

    // Vacate all ministries
    const { error: minErr } = await supabase
        .from('ministries')
        .update({
            minister_first_name: null,
            minister_last_name: null,
            minister_age: null,
            party_id: null
        })
        .eq('nation_id', nationId)
        .eq('is_active', true);
    if (minErr) console.warn('dissolveCoalition: ministry vacating failed:', minErr);
}


// ==================== NO-CONFIDENCE RESOLUTION ====================

/**
 * Resolve a passed or failed vote of no confidence.
 *
 * PASSED:
 *   - Coalition immediately dissolved (all ministries vacated, PM removed)
 *   - Calling party gets +3 approval
 *   - All coalition parties get -5 approval
 *   - Event logged
 *
 * FAILED:
 *   - Calling party gets -5 approval
 *   - PM's party gets +3 approval
 *   - 6-tick cooldown recorded
 *   - Event logged
 */
async function resolveNoConfidence(supabase, bill, passed, votesFor, votesAgainst, currentTick) {
    const callingPartyId = bill.proposed_by;
    const nationId = bill.nation_id;

    const { data: nation } = await supabase
        .from('nations')
        .select('name, government_type')
        .eq('id', nationId)
        .single();

    // Presidential systems do not have votes of no confidence
    if (nation?.government_type === 'Presidential') return;

    // Get PM's last name for event text
    const { data: hog } = await supabase
        .from('head_of_government')
        .select('last_name, faction_id')
        .eq('nation_id', nationId)
        .eq('active', true)
        .maybeSingle();

    const pmLastName = hog?.last_name || 'Unknown';
    const pmFactionId = hog?.faction_id || null;

    if (passed) {
        // Get coalition party IDs before dissolving
        const coalition = await fetchActiveCoalition(supabase, nationId);
        const coalitionPartyIds = coalition?.party_ids || [];

        // Guard: skip dissolution if coalition was already dissolved (e.g. by election on same tick)
        if (!coalition || coalition.status === 'dissolved') {
            console.warn('resolveNoConfidence: coalition already dissolved, skipping dissolution penalties');
        } else {
            // Close the current administration before dissolving
            try {
                const { data: fullNation } = await supabase.from('nations').select('*').eq('id', nationId).single();
                const { data: shard } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
                if (fullNation) {
                    await closeAdministration(supabase, nationId, fullNation, 'coalition_collapse', currentTick, shard?.current_date || '', null);
                }
            } catch (adminErr) { console.warn('Could not close administration on no-confidence:', adminErr); }

            // Dissolve coalition
            await dissolveCoalition(supabase, nationId);

            // Calling party gets +3 approval
            await adjustBlocApproval(supabase, callingPartyId, 3);

            // All coalition parties get -5 approval
            for (const partyId of coalitionPartyIds) {
                await adjustBlocApproval(supabase, partyId, -5);
            }

            // Schedule snap election (same pattern as early elections)
            await supabase.from('elections').delete()
                .eq('nation_id', nationId).eq('status', 'scheduled');
            await supabase.from('elections').insert({
                nation_id: nationId,
                election_tick: currentTick + GAME_CONFIG.EARLY_ELECTION_TICKS,
                status: 'scheduled',
                election_type: 'parliamentary'
            });

            // Freeze active bills (same as early elections)
            await supabase.from('bills')
                .update({ status: 'frozen' })
                .eq('nation_id', nationId)
                .in('status', ['committee', 'floor']);

            // Log event
            await supabase.from('event_log').insert({
                nation_id: nationId,
                event_name: 'No Confidence — Government Falls',
                fired_at_tick: currentTick,
                category: 'government',
                description_chosen: `The ${pmLastName} Government has fallen. A motion of no confidence passed ${votesFor} to ${votesAgainst}. Snap elections scheduled.`,
                effects_applied: { coalition_dissolved: true, caller_approval: +3, coalition_approval: -5, election_tick: currentTick + GAME_CONFIG.EARLY_ELECTION_TICKS, bills_frozen: true }
            });
        } // end else (coalition not already dissolved)

    } else {
        // FAILED: calling party gets -5 approval
        await adjustBlocApproval(supabase, callingPartyId, -5);

        // PM's party gets +3 approval
        if (pmFactionId) {
            await adjustBlocApproval(supabase, pmFactionId, 3);
        }

        // Record cooldown: store the tick when the no-confidence failed
        await supabase.from('campaign_actions').insert({
            party_id: callingPartyId,
            nation_id: nationId,
            action_type: 'no_confidence_failed',
            tick_performed: currentTick,
            result: { votes_for: votesFor, votes_against: votesAgainst, pm_last_name: pmLastName }
        });

        // Log event
        await supabase.from('event_log').insert({
            nation_id: nationId,
            event_name: 'No Confidence — Motion Fails',
            fired_at_tick: currentTick,
            category: 'government',
            description_chosen: `Motion of no confidence against the ${pmLastName} Government failed ${votesFor} to ${votesAgainst}.`,
            effects_applied: { caller_approval: -5, pm_approval: +3 }
        });
    }
}


// ==================== EARLY ELECTIONS ====================

/**
 * Call for early elections (PM action).
 * Transitions government to caretaker, freezes legislation, schedules election in 2 ticks.
 *
 * @param {object} supabase    - Supabase client
 * @param {string} nationId    - Nation UUID
 * @param {string} pmFactionId - PM's faction UUID
 * @param {Array}  coalitionPartyIds - All coalition party IDs
 */
async function callEarlyElectionsAction(supabase, nationId, pmFactionId, coalitionPartyIds) {
    // Presidential systems cannot call early elections
    const { data: nationCheck } = await supabase.from('nations').select('government_type').eq('id', nationId).single();
    if (nationCheck?.government_type === 'Presidential') return { success: false, error: 'Presidential systems cannot call early elections' };

    // 0. Server-side guard: only proceed if coalition is still 'formed' (check both tables)
    let govStatus = null;
    const { data: activeGov } = await supabase
        .from('government_formations')
        .select('id, status')
        .eq('nation_id', nationId)
        .in('status', ['formed', 'caretaker'])
        .order('formed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    if (activeGov) {
        govStatus = activeGov.status;
    } else {
        // Fallback: check legacy active_coalitions
        const { data: legacyGov } = await supabase
            .from('active_coalitions')
            .select('id, status')
            .eq('nation_id', nationId)
            .is('dissolved_at', null)
            .order('formed_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        govStatus = legacyGov?.status || 'formed'; // legacy rows without status default to formed
    }

    if (govStatus === 'caretaker') {
        throw new Error('The government is already in caretaker mode.');
    }

    // 1. Get current tick
    const { data: shard } = await supabase
        .from('shard')
        .select('current_tick')
        .eq('name', 'Alpha Shard')
        .single();
    const currentTick = shard?.current_tick || 0;

    // 2. Set government to caretaker (both tables — legacy active_coalitions may be source)
    // Use status='formed' filter as optimistic lock — only one caller can transition formed→caretaker
    const { data: updatedGov, count: updatedCount } = await supabase
        .from('government_formations')
        .update({ status: 'caretaker' })
        .eq('nation_id', nationId)
        .in('status', ['formed'])
        .select('id');
    if (!updatedGov || updatedGov.length === 0) {
        throw new Error('Government was already changed by another action. Please refresh.');
    }
    await supabase
        .from('active_coalitions')
        .update({ status: 'caretaker' })
        .eq('nation_id', nationId)
        .is('dissolved_at', null);

    // 3. Apply approval penalties — PM party: -5, other coalition parties: -3
    // (After status transition so penalties aren't lost if transition fails)
    for (const partyId of coalitionPartyIds) {
        const penalty = partyId === pmFactionId
            ? GAME_CONFIG.EARLY_ELECTION_PM_APPROVAL_COST
            : GAME_CONFIG.EARLY_ELECTION_COALITION_APPROVAL_COST;
        await adjustBlocApproval(supabase, partyId, -penalty);
    }

    // Bust coalition cache after caretaker transition
    if (typeof qCacheBust === 'function') qCacheBust('coalition_' + nationId);

    // 4. Cancel any existing scheduled elections
    await supabase
        .from('elections')
        .delete()
        .eq('nation_id', nationId)
        .eq('status', 'scheduled');

    // 5. Schedule early election
    await supabase.from('elections').insert({
        nation_id: nationId,
        election_tick: currentTick + GAME_CONFIG.EARLY_ELECTION_TICKS,
        status: 'scheduled',
        election_type: 'parliamentary'
    });

    // 6. Freeze all active bills (committee and floor)
    await supabase
        .from('bills')
        .update({ status: 'frozen' })
        .eq('nation_id', nationId)
        .in('status', ['committee', 'floor']);

    // 7. Get PM name for event text
    const { data: hog } = await supabase
        .from('head_of_government')
        .select('first_name, last_name')
        .eq('nation_id', nationId)
        .eq('active', true)
        .maybeSingle();
    const pmName = hog ? `${hog.first_name} ${hog.last_name}` : 'The Prime Minister';

    // 8. Fire system event
    await supabase.from('event_log').insert({
        nation_id: nationId,
        event_name: 'Legislature Dissolved — Early Elections Called',
        fired_at_tick: currentTick,
        category: 'government',
        description_chosen: `Prime Minister ${pmName} has dissolved the Legislature. Caretaker government in place until elections.`,
        effects_applied: {
            caretaker: true,
            election_tick: currentTick + GAME_CONFIG.EARLY_ELECTION_TICKS,
            pm_approval: -GAME_CONFIG.EARLY_ELECTION_PM_APPROVAL_COST,
            coalition_approval: -GAME_CONFIG.EARLY_ELECTION_COALITION_APPROVAL_COST,
            bills_frozen: true
        }
    });

    return { success: true, electionTick: currentTick + GAME_CONFIG.EARLY_ELECTION_TICKS };
}


// ==================== GOVERNMENT VACANCY PENALTIES ====================

/**
 * Process government vacancy penalties for democracies.
 *
 * When a democracy has no active coalition after an election:
 *   - Every tick: -2 approval to ALL parties, -1 stability to nation
 *   - At FORMATION_DEADLINE_TICKS: snap election triggered
 *     - Largest party: -10% approval before snap vote
 *     - Second largest: -5% approval before snap vote
 *     - New election scheduled for next tick
 *
 * @param {object} supabase    - Supabase client
 * @param {object} nation      - Full nation row
 * @param {number} currentTick - Current tick number
 * @returns {Promise<object|null>} Summary of actions taken, or null if not applicable
 */
async function processGovernmentVacancy(supabase, nation, currentTick) {
    // Only applies to parliamentary democracies
    if (nation.government_type === 'Autocracy') return null;
    if (nation.government_type === 'Presidential') return null; // No coalition formation needed

    // Check for active coalition
    const coalition = await fetchActiveCoalition(supabase, nation.id);

    // Safety net: detect stale caretaker government with overdue election
    if (coalition && coalition.status === 'caretaker') {
        const { data: overdueElection } = await supabase
            .from('elections')
            .select('id, election_tick')
            .eq('nation_id', nation.id)
            .eq('status', 'scheduled')
            .lte('election_tick', currentTick)
            .order('election_tick', { ascending: true })
            .limit(1)
            .maybeSingle();

        if (overdueElection) {
            const overdueBy = currentTick - overdueElection.election_tick;
            if (overdueBy >= 2) {
                // Election has been stuck for 2+ ticks — reschedule to next tick
                await supabase.from('elections')
                    .update({ election_tick: currentTick + 1 })
                    .eq('id', overdueElection.id);
                console.log(`Safety net: rescheduled stale caretaker election ${overdueElection.id} to tick ${currentTick + 1} (was overdue by ${overdueBy} ticks)`);
            }
        }
        return null; // Caretaker is a valid government state
    }

    if (coalition) return null;

    // Get latest completed election (filter out records without results to avoid
    // picking up scheduled-turned-completed records that lack election data)
    const { data: election } = await supabase
        .from('elections')
        .select('id, election_tick, results')
        .eq('nation_id', nation.id)
        .eq('status', 'completed')
        .not('results', 'is', null)
        .order('election_tick', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (!election) return null;

    // Check if any party has outright majority (no coalition needed)
    // Use nation-specific total_seats for correct majority threshold
    const majoritySeatThreshold = Math.floor((nation.total_seats || GAME_CONFIG.TOTAL_SEATS) / 2) + 1;
    const votes = election.results?.votes || [];
    const majorityParty = votes.find(p => p.seats >= majoritySeatThreshold);
    if (majorityParty) return null;

    // Calculate ticks since election
    const ticksElapsed = currentTick - election.election_tick;
    if (ticksElapsed <= 0) return null;

    const result = {
        nation: nation.name,
        ticksElapsed,
        penaltiesApplied: true,
        approvalLoss: -2,
        stabilityLoss: -1
    };

    // ===== SNAP ELECTION CHECK =====
    if (ticksElapsed >= FORMATION_DEADLINE_TICKS) {
        console.log(`SNAP ELECTION triggered for ${nation.name} — ${ticksElapsed} ticks without government`);

        // Get all parties sorted by seats for penalty targeting
        const { data: parties } = await supabase
            .from('factions')
            .select('id, faction_name, approval_rating, seats')
            .eq('nation_id', nation.id)
            .eq('faction_type', 'party')
            .order('seats', { ascending: false });

        if (parties && parties.length > 0) {
            // Largest party: -10% approval
            const largest = parties[0];
            await adjustBlocApproval(supabase, largest.id, -10);
            console.log(`  Snap penalty: ${largest.faction_name} -10% approval`);

            // Second largest: -5% approval
            if (parties.length > 1) {
                const second = parties[1];
                await adjustBlocApproval(supabase, second.id, -5);
                console.log(`  Snap penalty: ${second.faction_name} -5% approval`);
            }
        }

        // Schedule snap election for next tick
        const { data: existingScheduled } = await supabase
            .from('elections')
            .select('id')
            .eq('nation_id', nation.id)
            .eq('status', 'scheduled')
            .limit(1)
            .maybeSingle();

        if (existingScheduled) {
            await supabase.from('elections')
                .update({ election_tick: currentTick + 1 })
                .eq('id', existingScheduled.id);
            console.log(`  Moved existing scheduled election to tick ${currentTick + 1}`);
        } else {
            await supabase.from('elections').insert({
                nation_id: nation.id,
                election_tick: currentTick + 1,
                status: 'scheduled'
            });
            console.log(`  Scheduled snap election for tick ${currentTick + 1}`);
        }

        // Log the snap election event
        await supabase.from('event_log').insert({
            nation_id: nation.id,
            event_name: 'SNAP_ELECTION',
            description_used: `Snap election called in ${nation.name} after ${ticksElapsed} ticks without a government.`,
            category: 'POLITICAL',
            effects_applied: {
                largest_party: parties?.[0]?.faction_name,
                largest_penalty: -10,
                second_party: parties?.[1]?.faction_name,
                second_penalty: -5,
                ticks_without_gov: ticksElapsed
            },
            fired_at_tick: currentTick
        }).then(({ error }) => {
            if (error) console.warn('Snap election event log failed:', error.message);
        });

        result.snapElection = true;
        result.snapTick = currentTick + 1;
        return result;
    }

    // ===== ONGOING PENALTIES =====
    // -2 approval to ALL parties
    const { data: parties } = await supabase
        .from('factions')
        .select('id, faction_name')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');

    for (const party of (parties || [])) {
        await adjustBlocApproval(supabase, party.id, -2);
    }

    // -1 stability to nation
    const newStability = Math.max(0, (nation.stability ?? 50) - 1);
    await supabase.from('nations')
        .update({ stability: newStability })
        .eq('id', nation.id);

    // Update in-memory nation object for downstream processors
    nation.stability = newStability;

    console.log(`Government vacancy: ${nation.name} tick ${ticksElapsed}/${FORMATION_DEADLINE_TICKS} — all parties -2 approval, nation -1 stability (→ ${newStability})`);

    return result;
}


// ==================== TICK PROCESSOR ====================

// ==================== PARTIAL ELECTION (FOUNDATIONAL BILL) ====================

async function processPartialElection(supabase, nation, election, currentTick) {
    const deltaSeats = election.partial_seats;
    console.log(`Processing partial election for ${nation.name}: +${deltaSeats} new seats`);

    // 1. Load voter blocs
    const { data: blocs } = await supabase
        .from('voter_blocs').select('*')
        .eq('nation_id', nation.id).eq('is_active', true);

    if (!blocs || blocs.length === 0) {
        console.warn('No voter blocs found for partial election');
        await supabase.from('elections').update({ status: 'completed', results: { partial: true, error: 'no_blocs', bloc_details: [] } }).eq('id', election.id);
        return;
    }

    // 2. Scale bloc voter_counts to eligible_voters (same pattern as runElectionPreview)
    const eligibleVoters = nation.eligible_voters || 0;
    const totalBlocVoters = blocs.reduce((s, b) => s + (b.voter_count || 0), 0);
    if (totalBlocVoters > 0 && eligibleVoters > 0) {
        const scale = eligibleVoters / totalBlocVoters;
        let scaledSum = 0;
        for (const b of blocs) {
            b.voter_count = Math.round((b.voter_count || 0) * scale);
            scaledSum += b.voter_count;
        }
        const diff = eligibleVoters - scaledSum;
        if (diff !== 0) {
            const largest = blocs.reduce((a, b) => (b.voter_count > a.voter_count ? b : a), blocs[0]);
            largest.voter_count += diff;
        }
    }

    // 3. Load parties with ideology axes
    const { data: factions } = await supabase
        .from('factions').select('id, faction_name, seats')
        .eq('nation_id', nation.id).eq('faction_type', 'party');

    if (!factions || factions.length === 0) {
        console.warn('No parties found for partial election');
        await supabase.from('elections').update({ status: 'completed', results: { partial: true, error: 'no_parties', bloc_details: [] } }).eq('id', election.id);
        return;
    }

    const factionIds = factions.map(f => f.id);
    const { data: ideologies } = await supabase
        .from('faction_ideology').select('*').in('faction_id', factionIds);
    const ideoMap = {};
    for (const row of (ideologies || [])) ideoMap[row.faction_id] = row;

    const parties = factions.map(f => ({
        id: f.id, faction_name: f.faction_name,
        axes: ideoMap[f.id] || {
            liberty_equality: 0, tradition_progress: 0, security_freedom: 0,
            globalism_nationalism: 0, individualism_collectivism: 0
        }
    }));

    // 3b. Load per-bloc approval data
    const { data: fbaRows } = await supabase
        .from('faction_bloc_approval').select('faction_id, bloc_id, approval')
        .in('faction_id', factionIds);
    const allBlocApprovals = {};
    for (const row of (fbaRows || [])) {
        if (!allBlocApprovals[row.bloc_id]) allBlocApprovals[row.bloc_id] = {};
        allBlocApprovals[row.bloc_id][row.faction_id] = row.approval;
    }

    // 4. Run election simulation for ONLY the delta seats
    const result = runElectionSimulation(blocs, parties, deltaSeats, allBlocApprovals);

    // 5. ADD delta seats to each party's existing seats
    for (const faction of factions) {
        const deltaForParty = result.seats[faction.id] || 0;
        const newTotal = (faction.seats || 0) + deltaForParty;
        await supabase.from('factions').update({ seats: newTotal }).eq('id', faction.id);
    }

    // 6. Build results and mark election as completed
    const seatResults = factions.map(f => ({
        party_id: f.id,
        party_name: f.faction_name,
        existing_seats: f.seats || 0,
        new_seats: result.seats[f.id] || 0,
        total_seats: (f.seats || 0) + (result.seats[f.id] || 0),
        votes: result.votes[f.id] || 0
    }));

    await supabase.from('elections').update({
        status: 'completed',
        results: {
            partial: true,
            delta_seats: deltaSeats,
            votes: seatResults,
            seats: seatResults,
            bloc_details: result.details,
            total_votes_cast: result.totalVotesCast,
            total_abstentions: result.totalAbstentions
        }
    }).eq('id', election.id);

    console.log(`Partial election completed: ${deltaSeats} new seats allocated across ${factions.length} parties`);
}

async function resolveManualElectionContext(supabase, nation, currentTick, requestedElectionType = null) {
    const governmentType = nation?.government_type || 'Democracy';
    if (governmentType !== 'Presidential') {
        return {
            governmentType,
            electionType: 'parliamentary',
            forcedOutsideSchedule: false,
            nextScheduledTick: null
        };
    }

    let electionType = requestedElectionType;
    if (!electionType) {
        const { data: dueScheduledElection } = await supabase
            .from('elections')
            .select('id, election_type')
            .eq('nation_id', nation.id)
            .eq('status', 'scheduled')
            .lte('election_tick', currentTick)
            .order('election_tick', { ascending: true })
            .limit(1)
            .maybeSingle();
        electionType = dueScheduledElection?.election_type || 'presidential';
    }

    const { data: nextScheduled } = await supabase
        .from('elections')
        .select('election_tick')
        .eq('nation_id', nation.id)
        .eq('status', 'scheduled')
        .eq('election_type', electionType)
        .order('election_tick', { ascending: true })
        .limit(1)
        .maybeSingle();

    const nextScheduledTick = nextScheduled?.election_tick ?? null;
    return {
        governmentType,
        electionType,
        forcedOutsideSchedule: !!(nextScheduledTick && nextScheduledTick > currentTick),
        nextScheduledTick
    };
}

async function runManualElectionByGovernmentType(supabase, nation, options = {}) {
    if (!nation?.id) throw new Error('Nation is required');

    let currentTick;
    if (Number.isInteger(options.currentTick)) {
        currentTick = options.currentTick;
    } else {
        const { data: _shard } = await supabase.from('shard').select('current_tick').eq('name', 'Alpha Shard').single();
        currentTick = _shard?.current_tick || 0;
    }

    const context = await resolveManualElectionContext(supabase, nation, currentTick, options.electionType);
    const isPresidential = context.governmentType === 'Presidential';
    const normalizedElectionType = context.electionType || 'parliamentary';

    // Use candidate-based voting for presidential elections, party-based for parliamentary
    if (isPresidential && normalizedElectionType === 'presidential') {
        // Ensure candidates exist — generate for parties that have none
        const { data: allParties } = await supabase
            .from('factions')
            .select('id')
            .eq('nation_id', nation.id)
            .eq('faction_type', 'party');

        if (allParties) {
            for (const party of allParties) {
                const { count } = await supabase
                    .from('pm_candidates')
                    .select('*', { count: 'exact', head: true })
                    .eq('nation_id', nation.id)
                    .eq('faction_id', party.id)
                    .eq('candidate_type', 'presidential');
                if (!count || count === 0) {
                    console.log(`Generating presidential candidates for faction ${party.id} (manual election)`);
                    await generatePresidentCandidates(supabase, nation.id, party.id, currentTick, 'presidential');
                }
            }
        }

        // Auto-select candidates for any party that hasn't chosen
        await autoSelectPresidentialCandidates(supabase, nation, currentTick);
        const { error: runError } = await supabase.rpc('run_presidential_election', { p_nation_id: nation.id });
        if (runError) throw runError;
    } else {
        const { error: runError } = await supabase.rpc('run_election', { p_nation_id: nation.id, p_election_type: normalizedElectionType });
        if (runError) throw runError;
    }

    const { data: completedElection, error: electionError } = await supabase
        .from('elections')
        .select('id, election_tick, election_type, results, created_at')
        .eq('nation_id', nation.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    if (electionError) throw electionError;

    // Sync seats for parliamentary elections only (presidential results have no seats)
    const seatResults = completedElection?.results?.seats || [];
    for (const r of seatResults) {
        await supabase
            .from('factions')
            .update({ seats: r.seats })
            .eq('id', r.party_id);
    }

    if (isPresidential && normalizedElectionType === 'presidential') {
        await processPresidentialElectionResult(supabase, nation, completedElection, currentTick);
    }

    return {
        success: true,
        nationId: nation.id,
        governmentType: context.governmentType,
        electionType: normalizedElectionType,
        forcedOutsideSchedule: context.forcedOutsideSchedule,
        nextScheduledTick: context.nextScheduledTick,
        currentTick,
        completedElection,
        seatResults
    };
}

async function processElections(supabase, nation, currentTick) {
    if (nation.government_type === 'Autocracy') return [];

    const isPresidential = nation.government_type === 'Presidential';
    const results = [];

    const { data: dueElections } = await supabase
        .from('elections')
        .select('*')
        .eq('nation_id', nation.id)
        .eq('status', 'scheduled')
        .lte('election_tick', currentTick);

    // For presidential systems, process parliamentary elections before presidential ones
    // so seats are allocated before we determine the popular vote winner
    const sorted = (dueElections || []).sort((a, b) => {
        const aType = a.election_type || 'parliamentary';
        const bType = b.election_type || 'parliamentary';
        if (aType === 'parliamentary' && bType === 'presidential') return -1;
        if (aType === 'presidential' && bType === 'parliamentary') return 1;
        return 0;
    });

    for (const election of sorted) {
        const electionType = election.election_type || 'parliamentary';
        console.log(`Processing ${electionType} election for ${nation.name} (tick ${currentTick})`);

        // Partial election — only allocate delta seats (from foundational bill)
        if (election.partial_seats && election.partial_seats > 0) {
            await processPartialElection(supabase, nation, election, currentTick);
            results.push({ electionId: election.id, nation: nation.name, partial: true, deltaSeats: election.partial_seats });
            continue;
        }

        // Auto-select presidential candidates for any party that hasn't chosen yet
        if (electionType === 'presidential') {
            await autoSelectPresidentialCandidates(supabase, nation, currentTick);
        }

        // Use candidate-based voting for presidential elections, party-based for parliamentary
        let data, error;
        if (electionType === 'presidential') {
            ({ data, error } = await supabase.rpc('run_presidential_election', { p_nation_id: nation.id }));
        } else {
            ({ data, error } = await supabase.rpc('run_election', { p_nation_id: nation.id, p_election_type: electionType }));
        }

        if (error) {
            console.error(`Election RPC failed (attempt 1) for ${nation.name}:`, error);
            // Retry once
            if (electionType === 'presidential') {
                ({ data, error } = await supabase.rpc('run_presidential_election', { p_nation_id: nation.id }));
            } else {
                ({ data, error } = await supabase.rpc('run_election', { p_nation_id: nation.id, p_election_type: electionType }));
            }

            if (error) {
                console.error(`Election RPC failed (attempt 2) for ${nation.name}:`, error);
                // If overdue, reschedule to next tick to prevent permanent stuck state
                if (election.election_tick < currentTick) {
                    await supabase.from('elections')
                        .update({ election_tick: currentTick + 1 })
                        .eq('id', election.id);
                    console.log(`Rescheduled overdue election ${election.id} to tick ${currentTick + 1}`);
                }
                continue;
            }
            console.log(`Election RPC succeeded on retry for ${nation.name}`);
        }

        // Mark the scheduled election record as completed with full results
        await supabase.from('elections')
            .update({ status: 'completed', results: data })
            .eq('id', election.id);

        // Sync seats back to factions table (run_election creates a new record, so
        // look up the latest completed election for this nation to get results)
        const { data: completedElection } = await supabase
            .from('elections').select('results')
            .eq('nation_id', nation.id)
            .eq('status', 'completed')
            .not('results', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (completedElection?.results?.seats) {
            for (const r of completedElection.results.seats) {
                await supabase
                    .from('factions')
                    .update({ seats: r.seats })
                    .eq('id', r.party_id);
            }
            console.log(`Seats synced to factions for ${nation.name}`);
        }

        // Dissolve legislature — fail all pending bills (new parliament must re-propose)
        const { data: dissolvedBills } = await supabase.from('bills')
            .update({ status: 'failed' })
            .eq('nation_id', nation.id)
            .in('status', ['committee', 'floor'])
            .select('id');

        if (dissolvedBills?.length > 0) {
            console.log(`Dissolved ${dissolvedBills.length} pending bill(s) after election for ${nation.name}`);
        }

        // === PRESIDENTIAL SYSTEM: handle presidential vs parliamentary elections ===
        if (isPresidential && electionType === 'presidential') {
            // Fail any bills sitting on the outgoing president's desk
            const { data: deskBills } = await supabase.from('bills')
                .update({ status: 'failed' })
                .eq('nation_id', nation.id)
                .eq('status', 'president_desk')
                .select('id');
            if (deskBills?.length > 0) {
                console.log(`Failed ${deskBills.length} bill(s) on president's desk after presidential election for ${nation.name}`);
            }

            await processPresidentialElectionResult(supabase, nation, completedElection, currentTick);
        } else if (isPresidential && electionType === 'parliamentary') {
            // Midterm parliamentary election — seats reshuffled, president stays, desk bills remain
            console.log(`Midterm parliamentary election for ${nation.name} — president stays in office`);
        } else {
            // === PARLIAMENTARY DEMOCRACY: dissolve existing government after election ===
            // After any election, the old government (whether 'formed' or 'caretaker')
            // must be dissolved so that processGovernmentVacancy can apply -2 approval
            // penalties until a new coalition is formed.
            let existingGov = null;
            let existingGovSource = null;
            const { data: govFormation } = await supabase
                .from('government_formations')
                .select('id, status')
                .eq('nation_id', nation.id)
                .in('status', ['formed', 'caretaker'])
                .maybeSingle();
            if (govFormation) {
                existingGov = govFormation;
                existingGovSource = 'government_formations';
            } else {
                const { data: legacyGov } = await supabase
                    .from('active_coalitions')
                    .select('id, status')
                    .eq('nation_id', nation.id)
                    .is('dissolved_at', null)
                    .maybeSingle();
                if (legacyGov) {
                    existingGov = legacyGov;
                    existingGovSource = 'active_coalitions';
                }
            }

            // Fail all frozen bills (from caretaker period) regardless of whether
            // an existing government row was found — bills may have been frozen by
            // early elections even if the government row was already cleaned up.
            await supabase.from('bills')
                .update({ status: 'failed' })
                .eq('nation_id', nation.id)
                .eq('status', 'frozen');

            if (existingGov) {
                console.log(`Dissolving ${existingGov.status} government after election for ${nation.name} (source: ${existingGovSource})`);

                // Close the administration
                try {
                    const { data: fullNation } = await supabase.from('nations').select('*').eq('id', nation.id).single();
                    const { data: shardData } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
                    if (fullNation) {
                        await closeAdministration(supabase, nation.id, fullNation, 'dissolved', currentTick, shardData?.current_date || '', null);
                    }
                } catch (adminErr) { console.warn('Could not close administration on election:', adminErr); }

                // Dissolve government in BOTH tables
                await supabase
                    .from('government_formations')
                    .update({ status: 'dissolved' })
                    .eq('nation_id', nation.id)
                    .in('status', ['formed', 'caretaker']);

                await supabase
                    .from('active_coalitions')
                    .update({ status: 'dissolved', dissolved_at: new Date().toISOString() })
                    .eq('nation_id', nation.id)
                    .is('dissolved_at', null);

                // Deactivate PM
                await supabase
                    .from('head_of_government')
                    .update({ active: false })
                    .eq('nation_id', nation.id)
                    .eq('active', true);

                // Vacate all ministries
                await supabase
                    .from('ministries')
                    .update({
                        minister_first_name: null,
                        minister_last_name: null,
                        minister_age: null,
                        party_id: null
                    })
                    .eq('nation_id', nation.id)
                    .eq('is_active', true);
            }
        }

        results.push({
            electionId: election.id,
            nation: nation.name,
            electionType,
            result: data
        });
    }

    // === SCHEDULE NEXT ELECTIONS ===
    if (isPresidential) {
        await scheduleNextPresidentialElections(supabase, nation, currentTick);
    } else {
        const { data: futureElection } = await supabase
            .from('elections')
            .select('id')
            .eq('nation_id', nation.id)
            .eq('status', 'scheduled')
            .gt('election_tick', currentTick)
            .limit(1)
            .maybeSingle();

        if (!futureElection) {
            const frequency = nation.election_frequency || 48;
            const nextTick = currentTick + frequency;

            await supabase.from('elections').insert({
                nation_id: nation.id,
                election_tick: nextTick,
                status: 'scheduled'
            });

            console.log(`Scheduled next election for ${nation.name} at tick ${nextTick}`);
        }
    }

    return results;
}

/**
 * Presidential election result: read candidate-level popular vote results
 * and inaugurate the winning candidate.
 */
async function processPresidentialElectionResult(supabase, nation, completedElection, currentTick) {
    const candidateResults = completedElection?.results?.presidential_candidates || [];
    if (candidateResults.length === 0) {
        console.warn(`No candidate vote data for presidential election in ${nation.name}`);
        return;
    }

    // Winner = candidate marked as winner by SQL, or highest votes as fallback
    const winner = candidateResults.find(c => c.winner)
        || candidateResults.reduce((best, c) => (c.votes > best.votes) ? c : best, candidateResults[0]);
    console.log(`Presidential election winner: ${winner.candidate_name} (${winner.party_name}) with ${winner.votes} votes (${nation.name})`);

    // Deactivate previous president
    await supabase
        .from('presidents')
        .update({ is_active: false })
        .eq('nation_id', nation.id)
        .eq('is_active', true);

    // Close previous administration
    try {
        const { data: fullNation } = await supabase.from('nations').select('*').eq('id', nation.id).single();
        const { data: shardData } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
        if (fullNation) {
            await closeAdministration(supabase, nation.id, fullNation, 'election_loss', currentTick, shardData?.current_date || '', null);
        }
    } catch (adminErr) { console.warn('Could not close administration on presidential election:', adminErr); }

    // Set ruling faction to the winner's party
    await supabase.from('nations')
        .update({ ruling_faction_id: winner.faction_id })
        .eq('id', nation.id);

    // Look up the winning candidate from pm_candidates by candidate_id
    const { data: winningCandidate } = await supabase
        .from('pm_candidates')
        .select('*')
        .eq('id', winner.candidate_id)
        .maybeSingle();

    if (winningCandidate) {
        await inauguratePresident(supabase, winningCandidate, nation.id, winner.faction_id, currentTick);
        console.log(`President inaugurated: ${winner.candidate_name} (${winner.party_name})`);
    } else {
        // Fallback: candidate may have been cleaned up, try by faction
        const { data: fallbackCandidate } = await supabase
            .from('pm_candidates')
            .select('*')
            .eq('nation_id', nation.id)
            .eq('faction_id', winner.faction_id)
            .eq('candidate_type', 'presidential')
            .eq('selected', true)
            .limit(1)
            .maybeSingle();

        if (fallbackCandidate) {
            await inauguratePresident(supabase, fallbackCandidate, nation.id, winner.faction_id, currentTick);
            console.log(`President inaugurated (fallback): ${fallbackCandidate.first_name} ${fallbackCandidate.last_name} (${winner.party_name})`);
        } else {
            // No candidates at all — generate one and inaugurate immediately
            console.warn(`No presidential candidate found for winner ${winner.candidate_name} in ${nation.name} — generating emergency candidate`);
            const emergencyCandidates = await generatePresidentCandidates(supabase, nation.id, winner.faction_id, currentTick, 'presidential');
            if (emergencyCandidates && emergencyCandidates.length > 0) {
                await inauguratePresident(supabase, emergencyCandidates[0], nation.id, winner.faction_id, currentTick);
                console.log(`Emergency president inaugurated: ${emergencyCandidates[0].first_name} ${emergencyCandidates[0].last_name}`);
            }
        }
    }

    // Clean up all presidential candidates after election
    await supabase.from('pm_candidates').delete()
        .eq('nation_id', nation.id)
        .eq('candidate_type', 'presidential');

    // Sort for runner-up info in event
    const sorted = [...candidateResults].sort((a, b) => b.votes - a.votes);

    // Fire system event
    try {
        await supabase.rpc('fire_system_event', {
            p_trigger_key: 'presidential_election',
            p_nation_id: nation.id,
            p_tick: currentTick,
            p_placeholders: {
                nation: nation.name,
                winning_party: winner.party_name,
                winning_candidate: winner.candidate_name,
                votes: winner.votes,
                vote_percentage: winner.vote_percentage || '?',
                runner_up: sorted[1]?.candidate_name || 'N/A',
                runner_up_party: sorted[1]?.party_name || 'N/A'
            }
        });
    } catch (e) { console.warn('Presidential election event fire failed (non-blocking):', e); }

    // Proactively schedule next elections (instead of relying on processPresidentialTermEnd safety net)
    try {
        await scheduleNextPresidentialElections(supabase, nation, currentTick);
    } catch (e) { console.warn('Could not schedule next presidential elections:', e); }
}

/**
 * Inaugurate a president from a candidate record. Creates the president row,
 * applies ideology shift, applies trait effects, and creates an administration.
 * Used by both processPresidentialElectionResult (auto-inauguration) and
 * selectPresidentCandidate (manual/legacy selection).
 */
async function inauguratePresident(supabase, candidate, nationId, factionId, currentTick) {
    // Deactivate any previous president
    await supabase.from('presidents')
        .update({ is_active: false })
        .eq('nation_id', nationId)
        .eq('is_active', true);

    // Look up trait data for trait_upside / trait_downside
    const { data: trait } = await supabase.from('leader_traits').select('*').eq('trait_key', candidate.trait_key).maybeSingle();

    // Insert president record (with trait_upside / trait_downside populated)
    const { error: presErr } = await supabase.from('presidents').insert({
        nation_id: nationId,
        faction_id: factionId,
        first_name: candidate.first_name,
        last_name: candidate.last_name,
        age: candidate.age,
        ideology: candidate.ideology,
        trait: candidate.trait_key,
        trait_upside: trait?.upside || null,
        trait_downside: trait?.downside || null,
        elected_tick: currentTick,
        term_ends_tick: currentTick + GAME_CONFIG.PRESIDENTIAL_TERM_TICKS,
        is_active: true
    });
    if (presErr) throw presErr;

    // Apply ideology shift (+15 on candidate's axis)
    const axisKey = candidate.ideology_axis;
    const direction = candidate.ideology_direction;
    if (axisKey && typeof direction === 'number') {
        const shift = 15 * direction;
        let factionIdeology = await loadFactionIdeology(supabase, factionId);
        if (!factionIdeology) {
            const newRow = { faction_id: factionId, liberty_equality: 0, tradition_progress: 0, security_freedom: 0, globalism_nationalism: 0, individualism_collectivism: 0 };
            await supabase.from('faction_ideology').upsert(newRow, { onConflict: 'faction_id' });
            factionIdeology = newRow;
            console.warn(`Created missing faction_ideology row for faction ${factionId}`);
        }
        const currentVal = factionIdeology[axisKey] || 0;
        const newVal = Math.max(-100, Math.min(100, currentVal + shift));
        await supabase.from('faction_ideology').update({ [axisKey]: newVal }).eq('faction_id', factionId);
        console.log(`President ideology shift: ${axisKey} ${currentVal} → ${newVal} (${shift > 0 ? '+' : ''}${shift})`);
    }

    // Apply trait effects (same logic as PM)
    if (trait?.effects) {
        if (trait.effects.on_appoint_stability) {
            const { data: nationRow } = await supabase.from('nations').select('stability').eq('id', nationId).single();
            if (nationRow) {
                const newStability = Math.max(0, Math.min(100, (nationRow.stability || 50) + trait.effects.on_appoint_stability));
                await supabase.from('nations').update({ stability: newStability }).eq('id', nationId);
            }
        }
    }

    // Get faction info for administration record
    const { data: faction } = await supabase.from('factions').select('faction_name, seats, approval_rating').eq('id', factionId).single();
    const { data: shardData } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
    const { data: fullNation } = await supabase.from('nations').select('*').eq('id', nationId).single();

    // Parse year safely from current_date (handles formats like "Month Day, Year" or just "Year")
    const dateStr = shardData?.current_date || '';
    const yearMatch = dateStr.match(/\d{4}/);
    const year = yearMatch ? yearMatch[0] : '';

    // Create new administration
    await supabase.from('administrations').insert({
        nation_id: nationId,
        admin_name: `${candidate.last_name} Administration${year ? ', ' + year : ''}`,
        head_of_state: `${candidate.first_name} ${candidate.last_name}`,
        president_name: `${candidate.first_name} ${candidate.last_name}`,
        president_party_id: factionId,
        president_party_name: faction?.faction_name || '',
        coalition_parties: [{ party_id: factionId, party_name: faction?.faction_name || '', seats: faction?.seats || 0 }],
        total_seats: faction?.seats || 0,
        government_type: 'Presidential',
        started_at_tick: currentTick,
        started_at_date: dateStr,
        stats_at_start: fullNation ? snapshotNationStats(fullNation) : {},
        approval_at_start: faction?.approval_rating ?? 50
    });

    return candidate;
}

/**
 * Schedule next presidential + parliamentary elections independently.
 * Presidential every PRESIDENTIAL_TERM_TICKS, parliamentary every PARLIAMENTARY_TERM_TICKS.
 */
async function scheduleNextPresidentialElections(supabase, nation, currentTick) {
    // Check for future parliamentary election
    const { data: futureParl } = await supabase
        .from('elections')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('status', 'scheduled')
        .eq('election_type', 'parliamentary')
        .gt('election_tick', currentTick)
        .limit(1)
        .maybeSingle();

    if (!futureParl) {
        const nextParl = currentTick + GAME_CONFIG.PARLIAMENTARY_TERM_TICKS;
        await supabase.from('elections').insert({
            nation_id: nation.id,
            election_tick: nextParl,
            election_type: 'parliamentary',
            status: 'scheduled'
        });
        console.log(`Scheduled next parliamentary election for ${nation.name} at tick ${nextParl}`);
    }

    // Check for future presidential election
    const { data: futurePres } = await supabase
        .from('elections')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('status', 'scheduled')
        .eq('election_type', 'presidential')
        .gt('election_tick', currentTick)
        .limit(1)
        .maybeSingle();

    if (!futurePres) {
        const nextPres = currentTick + GAME_CONFIG.PRESIDENTIAL_TERM_TICKS;
        await supabase.from('elections').insert({
            nation_id: nation.id,
            election_tick: nextPres,
            election_type: 'presidential',
            status: 'scheduled'
        });
        console.log(`Scheduled next presidential election for ${nation.name} at tick ${nextPres}`);
    }
}

/**
 * Generate 3 president candidates for a party (reuses PM candidate generation pattern).
 * Candidates are stored in pm_candidates table with candidate_type = 'presidential';
 * select-president.html reads them.
 *
 * @param {string} candidateType - 'presidential' (default)
 */
async function generatePresidentCandidates(supabase, nationId, factionId, currentTick, candidateType = 'presidential') {
    const factionIdeology = await loadFactionIdeology(supabase, factionId);

    // Clear any existing unselected presidential candidates for this faction
    await supabase
        .from('pm_candidates')
        .delete()
        .eq('nation_id', nationId)
        .eq('faction_id', factionId)
        .eq('candidate_type', 'presidential')
        .eq('selected', false);

    const weightedIdeologies = getWeightedIdeologies(factionIdeology);

    const chosenIdeologies = [];
    const availableIdeologies = [...weightedIdeologies];
    for (let i = 0; i < 3; i++) {
        const pick = weightedRandomPick(availableIdeologies);
        chosenIdeologies.push(pick.item);
        const sameAxis = availableIdeologies.filter(
            wi => wi.item.axisKey === pick.item.axisKey
        );
        sameAxis.forEach(sa => {
            const idx = availableIdeologies.indexOf(sa);
            if (idx >= 0) availableIdeologies.splice(idx, 1);
        });
    }

    const shuffledTraits = [...PM_TRAIT_KEYS].sort(() => Math.random() - 0.5);
    const chosenTraits = shuffledTraits.slice(0, 3);

    const usedFirstNames = new Set();
    const usedLastNames = new Set();
    const candidates = [];

    for (let i = 0; i < 3; i++) {
        let firstName, lastName;

        do { firstName = PM_FIRST_NAMES[Math.floor(Math.random() * PM_FIRST_NAMES.length)]; }
        while (usedFirstNames.has(firstName));
        usedFirstNames.add(firstName);

        do { lastName = PM_LAST_NAMES[Math.floor(Math.random() * PM_LAST_NAMES.length)]; }
        while (usedLastNames.has(lastName));
        usedLastNames.add(lastName);

        const age = 35 + Math.floor(Math.random() * 16); // Presidents: age 35-50
        const ideology = chosenIdeologies[i];

        candidates.push({
            nation_id: nationId,
            faction_id: factionId,
            first_name: firstName,
            last_name: lastName,
            age: age,
            ideology: ideology.tag,
            ideology_axis: ideology.axisKey,
            ideology_direction: ideology.direction,
            trait_key: chosenTraits[i],
            created_at_tick: currentTick,
            candidate_type: candidateType,
            selected: false
        });
    }

    const { data, error } = await supabase
        .from('pm_candidates')
        .insert(candidates)
        .select();

    if (error) {
        console.error('Error generating president candidates:', error);
        throw error;
    }

    console.log(`Generated 3 president candidates for faction ${factionId}`);
    return data;
}

/**
 * Select a presidential nominee BEFORE the election. Marks the candidate as selected
 * and deletes the other options. The actual inauguration happens automatically when
 * the election resolves via processPresidentialElectionResult → inauguratePresident.
 */
async function selectPresidentCandidate(supabase, candidateId, nationId, factionId, currentTick) {
    const { data: candidate, error: fetchErr } = await supabase
        .from('pm_candidates')
        .select('*')
        .eq('id', candidateId)
        .single();

    if (fetchErr || !candidate) throw new Error('Candidate not found');
    if (candidate.faction_id !== factionId) throw new Error('Not your candidate');

    // Mark selected, delete others for this faction
    await supabase.from('pm_candidates').update({ selected: true }).eq('id', candidateId);
    await supabase.from('pm_candidates').delete()
        .eq('nation_id', nationId)
        .eq('faction_id', factionId)
        .eq('candidate_type', 'presidential')
        .eq('selected', false);

    console.log(`Presidential nominee selected: ${candidate.first_name} ${candidate.last_name} (${candidate.trait_key}) for faction ${factionId}`);
    return candidate;
}


// ==================== PRESIDENTIAL MINISTER NOMINATION ====================

/**
 * President nominates a minister for a cabinet slot.
 * Writes pending data to the ministries table and creates a confirmation bill.
 * Parliament votes simple majority; if rejected, the party is blocked for that slot.
 *
 * @param {object} supabase
 * @param {string} nationId
 * @param {string} presidentFactionId - The president's faction (must match active president)
 * @param {string} ministryKey - Which ministry slot (e.g. 'defense', 'finance')
 * @param {object} nominee - { partyId, partyName, firstName, lastName, age }
 */
async function nominateMinister(supabase, nationId, presidentFactionId, ministryKey, nominee) {
    // Validate: must be Presidential system
    const { data: nation } = await supabase.from('nations').select('name, government_type').eq('id', nationId).single();
    if (nation?.government_type !== 'Presidential') throw new Error('Minister nominations only apply to Presidential systems');

    // Validate: caller must be president's party
    const { data: president } = await supabase.from('presidents')
        .select('id, faction_id')
        .eq('nation_id', nationId).eq('is_active', true)
        .limit(1).maybeSingle();
    if (!president || president.faction_id !== presidentFactionId) throw new Error('Only the President\'s party can nominate ministers');

    // Validate: no existing pending confirmation for this slot
    const { data: existingMinistry } = await supabase.from('ministries')
        .select('id, confirmation_status, rejected_parties')
        .eq('nation_id', nationId).eq('ministry_key', ministryKey).eq('is_active', true)
        .maybeSingle();

    if (existingMinistry?.confirmation_status === 'pending') {
        throw new Error('A confirmation vote is already pending for this ministry');
    }

    // Validate: nominee's party was not already rejected for this slot
    const rejectedParties = existingMinistry?.rejected_parties || [];
    if (rejectedParties.includes(nominee.partyId)) {
        throw new Error('This party\'s nominee was already rejected for this ministry slot');
    }

    // Get current tick
    const { data: shard } = await supabase.from('shard').select('current_tick').eq('name', 'Alpha Shard').single();
    const currentTick = shard?.current_tick || 0;

    // Write pending minister data to the ministry row
    const pendingData = {
        party_id: nominee.partyId,
        first_name: nominee.firstName,
        last_name: nominee.lastName,
        age: nominee.age
    };

    const ministryDisplayName = {
        prime_minister: 'Prime Minister', interior: 'Ministry of the Interior',
        foreign: 'Foreign Ministry', defense: 'Ministry of Defense',
        finance: 'Ministry of Finance', education: 'Ministry of Education',
        healthcare: 'Ministry of Healthcare', labor: 'Ministry of Labor',
        justice: 'Ministry of Justice', transportation: 'Ministry of Transportation',
        security: 'Ministry of Security'
    }[ministryKey] || ministryKey;

    if (existingMinistry) {
        const { error: updErr } = await supabase.from('ministries').update({
            confirmation_status: 'pending',
            pending_minister: pendingData
        }).eq('id', existingMinistry.id);
        if (updErr) throw new Error('Failed to update ministry: ' + updErr.message);
    } else {
        const { error: insErr } = await supabase.from('ministries').insert({
            nation_id: nationId,
            ministry_key: ministryKey,
            ministry_name: ministryDisplayName,
            is_active: true,
            confirmation_status: 'pending',
            pending_minister: pendingData,
            rejected_parties: []
        });
        if (insErr) throw new Error('Failed to create ministry row: ' + insErr.message);
    }

    // Create confirmation bill (goes straight to floor vote)

    const billName = `Confirmation of ${nominee.firstName} ${nominee.lastName} as ${ministryDisplayName}`;
    const preamble = `The President nominates ${nominee.firstName} ${nominee.lastName} (${nominee.partyName}) to serve as head of the ${ministryDisplayName}. A simple majority (${GAME_CONFIG.MAJORITY_SEATS} of ${GAME_CONFIG.TOTAL_SEATS} seats) is required for confirmation.`;

    const { data: bill, error: billErr } = await supabase.from('bills').insert({
        nation_id: nationId,
        proposed_by: presidentFactionId,
        proposed_tick: currentTick,
        bill_name: billName,
        bill_type: 'minister_confirmation',
        status: 'floor',
        voting_ends_tick: currentTick + GAME_CONFIG.MINISTER_CONFIRMATION_VOTING_TICKS,
        ministry_key: ministryKey,
        preamble
    }).select().single();

    if (billErr) throw billErr;

    console.log(`Minister nomination: ${nominee.firstName} ${nominee.lastName} for ${ministryKey} (bill ${bill.id})`);
    return { bill, nominee };
}


// ==================== PRESIDENTIAL VETO SYSTEM ====================

/**
 * President signs a bill into law.
 * Called from the UI when the President's party clicks "Sign Into Law".
 */
async function signPresidentialBill(supabase, billId, presidentFactionId) {
    const { data: bill } = await supabase.from('bills')
        .select('*, factions(faction_name, ideology_value_1, ideology_value_2), bill_articles(*, policies(*)), bill_support(*, factions(faction_name))')
        .eq('id', billId).single();
    if (!bill || bill.status !== 'president_desk') throw new Error('Bill is not on the president\'s desk');

    // Validate caller is president's party
    const { data: president } = await supabase.from('presidents')
        .select('faction_id').eq('nation_id', bill.nation_id).eq('is_active', true).limit(1).maybeSingle();
    if (!president || president.faction_id !== presidentFactionId) throw new Error('Only the President\'s party can sign bills');

    const { data: shard } = await supabase.from('shard').select('current_tick').eq('name', 'Alpha Shard').single();
    const currentTick = shard?.current_tick || 0;

    await supabase.from('bills').update({
        president_action: 'signed',
        president_action_tick: currentTick
    }).eq('id', bill.id);

    await enactBill(supabase, bill, currentTick);

    try {
        await supabase.rpc('fire_system_event', {
            p_trigger_key: 'bill_passed',
            p_nation_id: bill.nation_id,
            p_tick: currentTick,
            p_placeholders: {
                nation: 'Unknown',
                bill_name: bill.bill_name + ' (signed by President)',
                sponsor: bill.factions?.faction_name || 'Unknown',
                votes_for: '0', votes_against: '0',
                article_count: String((bill.bill_articles || []).length)
            }
        });
    } catch (e) { /* non-blocking */ }
}

/**
 * President vetoes a bill.
 * Auto-creates a veto_override bill requiring 2/3 supermajority.
 */
async function vetoPresidentialBill(supabase, billId, presidentFactionId) {
    const { data: bill } = await supabase.from('bills')
        .select('*, factions(faction_name)')
        .eq('id', billId).single();
    if (!bill || bill.status !== 'president_desk') throw new Error('Bill is not on the president\'s desk');

    const { data: president } = await supabase.from('presidents')
        .select('faction_id').eq('nation_id', bill.nation_id).eq('is_active', true).limit(1).maybeSingle();
    if (!president || president.faction_id !== presidentFactionId) throw new Error('Only the President\'s party can veto bills');

    const { data: shard } = await supabase.from('shard').select('current_tick').eq('name', 'Alpha Shard').single();
    const currentTick = shard?.current_tick || 0;

    // Mark bill as vetoed
    await supabase.from('bills').update({
        status: 'vetoed',
        president_action: 'vetoed',
        president_action_tick: currentTick
    }).eq('id', bill.id);

    // Auto-create veto override bill (goes straight to floor)
    const overrideSeats = Math.ceil(GAME_CONFIG.TOTAL_SEATS * GAME_CONFIG.VETO_OVERRIDE_THRESHOLD);
    const { data: overrideBill } = await supabase.from('bills').insert({
        nation_id: bill.nation_id,
        proposed_by: bill.proposed_by,
        proposed_tick: currentTick,
        bill_name: 'Veto Override: ' + bill.bill_name,
        bill_type: 'veto_override',
        status: 'floor',
        voting_ends_tick: currentTick + GAME_CONFIG.VOTING_WINDOW_TICKS,
        original_bill_id: bill.id,
        is_veto_override: true,
        preamble: `The President has vetoed "${bill.bill_name}". The legislature may override this veto with a two-thirds supermajority (${overrideSeats} of ${GAME_CONFIG.TOTAL_SEATS} seats).`
    }).select().single();

    try {
        await supabase.rpc('fire_system_event', {
            p_trigger_key: 'bill_failed',
            p_nation_id: bill.nation_id,
            p_tick: currentTick,
            p_placeholders: {
                nation: 'Unknown',
                bill_name: bill.bill_name + ' (VETOED by President)',
                sponsor: bill.factions?.faction_name || 'Unknown',
                votes_for: '0', votes_against: '0'
            }
        });
    } catch (e) { /* non-blocking */ }

    return overrideBill;
}

/**
 * Auto-sign bills that have been on the president's desk past the deadline.
 * Called during advanceTick().
 */
async function processPresidentDesk(supabase, nation, currentTick) {
    if (nation.government_type !== 'Presidential') return [];

    const { data: expiredDesks } = await supabase.from('bills')
        .select('*, factions(faction_name, ideology_value_1, ideology_value_2), bill_articles(*, policies(*)), bill_support(*, factions(faction_name))')
        .eq('nation_id', nation.id)
        .eq('status', 'president_desk')
        .lte('president_desk_deadline', currentTick);

    if (!expiredDesks || expiredDesks.length === 0) return [];

    const results = [];
    for (const bill of expiredDesks) {
        // Auto-sign: president didn't act in time
        await supabase.from('bills').update({
            president_action: 'auto_signed',
            president_action_tick: currentTick
        }).eq('id', bill.id);

        await enactBill(supabase, bill, currentTick);

        try {
            await supabase.rpc('fire_system_event', {
                p_trigger_key: 'bill_passed',
                p_nation_id: nation.id,
                p_tick: currentTick,
                p_placeholders: {
                    nation: nation.name,
                    bill_name: bill.bill_name + ' (auto-signed by President)',
                    sponsor: bill.factions?.faction_name || 'Unknown',
                    votes_for: '0', votes_against: '0',
                    article_count: String((bill.bill_articles || []).length)
                }
            });
        } catch (e) { /* non-blocking */ }

        results.push({ billId: bill.id, billName: bill.bill_name, action: 'auto_signed' });
    }
    return results;
}

/**
 * Pre-election candidate generation: PRESIDENTIAL_CANDIDATE_LEAD_TICKS (6) ticks
 * before a scheduled presidential election, generate 3 presidential candidates for
 * EVERY party in the nation. The player's party picks their nominee; NPC parties
 * auto-select their first candidate immediately.
 *
 * Candidates are stored in pm_candidates with candidate_type = 'presidential'.
 */
async function triggerPresidentialCandidateSelection(supabase, nation, currentTick) {
    if (nation.government_type !== 'Presidential') return;

    const leadTicks = GAME_CONFIG.PRESIDENTIAL_CANDIDATE_LEAD_TICKS;

    // Find scheduled presidential elections that are exactly leadTicks away
    const targetTick = currentTick + leadTicks;
    const { data: upcomingElection } = await supabase
        .from('elections')
        .select('id, election_tick')
        .eq('nation_id', nation.id)
        .eq('status', 'scheduled')
        .eq('election_type', 'presidential')
        .eq('election_tick', targetTick)
        .limit(1)
        .maybeSingle();

    if (!upcomingElection) return;

    // Check if candidates were already generated for this election
    const { count: existingCount } = await supabase
        .from('pm_candidates')
        .select('*', { count: 'exact', head: true })
        .eq('nation_id', nation.id)
        .eq('candidate_type', 'presidential');

    if (existingCount > 0) return; // already generated

    console.log(`Generating presidential candidates for all parties in ${nation.name} (election at tick ${targetTick})`);

    // Get all parties in this nation
    const { data: allParties } = await supabase
        .from('factions')
        .select('id, faction_name')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');

    if (!allParties || allParties.length === 0) return;

    for (const party of allParties) {
        await generatePresidentCandidates(supabase, nation.id, party.id, currentTick, 'presidential');

    }
}

/**
 * Safety net: if an active president's term has expired and no presidential election
 * is scheduled, schedule one immediately. Also deactivates the president if term
 * has expired and a new president was already elected (shouldn't happen, but guards).
 */
async function processPresidentialTermEnd(supabase, nation, currentTick) {
    if (nation.government_type !== 'Presidential') return;

    const { data: president } = await supabase
        .from('presidents')
        .select('id, faction_id, term_ends_tick')
        .eq('nation_id', nation.id)
        .eq('is_active', true)
        .order('elected_tick', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (!president) return;

    // Term hasn't expired yet
    if (president.term_ends_tick > currentTick) return;

    // Term has expired — check if a presidential election is already scheduled
    const { data: scheduledElection } = await supabase
        .from('elections')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('status', 'scheduled')
        .eq('election_type', 'presidential')
        .limit(1)
        .maybeSingle();

    if (!scheduledElection) {
        // No election scheduled — schedule one for next tick
        await supabase.from('elections').insert({
            nation_id: nation.id,
            election_tick: currentTick + 1,
            election_type: 'presidential',
            status: 'scheduled'
        });
        console.log(`Emergency presidential election scheduled for ${nation.name} at tick ${currentTick + 1} (term expired)`);
    }
}

/**
 * Auto-select a presidential candidate for every party that has unselected
 * candidates but no selected one. Called immediately before a presidential
 * election fires so every party participates in the candidate popular vote.
 */
async function autoSelectPresidentialCandidates(supabase, nation, currentTick) {
    // Find all unselected presidential candidates for this nation
    const { data: unselected } = await supabase
        .from('pm_candidates')
        .select('id, faction_id, first_name, last_name')
        .eq('nation_id', nation.id)
        .eq('candidate_type', 'presidential')
        .eq('selected', false)
        .order('created_at', { ascending: true });

    if (!unselected || unselected.length === 0) return;

    // Find which factions already have a selected candidate
    const { data: alreadySelected } = await supabase
        .from('pm_candidates')
        .select('faction_id')
        .eq('nation_id', nation.id)
        .eq('candidate_type', 'presidential')
        .eq('selected', true);

    const selectedFactions = new Set((alreadySelected || []).map(r => r.faction_id));

    // Group unselected by faction, auto-select the first for factions with no selection
    const factionGroups = {};
    for (const c of unselected) {
        if (selectedFactions.has(c.faction_id)) continue;
        if (!factionGroups[c.faction_id]) factionGroups[c.faction_id] = c;
    }

    for (const [factionId, pick] of Object.entries(factionGroups)) {
        console.log(`Auto-selecting presidential candidate for election: ${pick.first_name} ${pick.last_name} (faction ${factionId}) in ${nation.name}`);
        try {
            await selectPresidentCandidate(supabase, pick.id, nation.id, factionId, currentTick);
        } catch (e) {
            console.error(`Error auto-selecting presidential candidate for ${nation.name}:`, e);
        }
    }
}

/**
 * Auto-select presidential nominee if a party hasn't chosen within 3 ticks.
 * In the new pre-election flow, this just marks selected=true so the candidate
 * is ready for election day. Does NOT inaugurate — that happens when the
 * election resolves in processPresidentialElectionResult.
 */
async function processPresidentCandidateTimeout(supabase, nation, currentTick) {
    if (nation.government_type !== 'Presidential') return;

    // Find unselected presidential candidates older than 3 ticks
    const timeoutTicks = 3;
    const { data: staleCandidates } = await supabase
        .from('pm_candidates')
        .select('*')
        .eq('nation_id', nation.id)
        .eq('candidate_type', 'presidential')
        .eq('selected', false)
        .lte('created_at_tick', currentTick - timeoutTicks)
        .order('created_at_tick', { ascending: true });

    if (!staleCandidates || staleCandidates.length === 0) return;

    // Group by faction to auto-select one per party
    const factionGroups = {};
    for (const c of staleCandidates) {
        if (!factionGroups[c.faction_id]) factionGroups[c.faction_id] = [];
        factionGroups[c.faction_id].push(c);
    }

    for (const [factionId, candidates] of Object.entries(factionGroups)) {
        const pick = candidates[0]; // select first candidate
        console.log(`Auto-selecting presidential nominee for ${nation.name}: ${pick.first_name} ${pick.last_name} — selection timed out after ${timeoutTicks} ticks`);

        try {
            await selectPresidentCandidate(supabase, pick.id, nation.id, factionId, currentTick);
        } catch (e) {
            console.error(`Error auto-selecting presidential nominee for ${nation.name}:`, e);
        }
    }
}

/**
 * Auto-select parliamentary PM candidates that have timed out (3 ticks).
 * Mirrors processPresidentCandidateTimeout but for parliamentary systems.
 */
async function processParliamentaryPMTimeout(supabase, nation, currentTick) {
    if (nation.government_type !== 'Democracy') return;

    const timeoutTicks = 3;
    const { data: staleCandidates } = await supabase
        .from('pm_candidates')
        .select('*')
        .eq('nation_id', nation.id)
        .eq('candidate_type', 'parliamentary')
        .eq('selected', false)
        .lte('created_at_tick', currentTick - timeoutTicks)
        .order('created_at_tick', { ascending: true });

    if (!staleCandidates || staleCandidates.length === 0) return;

    // Group by faction to auto-select one per party
    const factionGroups = {};
    for (const c of staleCandidates) {
        if (!factionGroups[c.faction_id]) factionGroups[c.faction_id] = [];
        factionGroups[c.faction_id].push(c);
    }

    for (const [factionId, candidates] of Object.entries(factionGroups)) {
        // Check if this faction already has a selected candidate
        const { data: alreadySelected } = await supabase
            .from('pm_candidates')
            .select('id')
            .eq('nation_id', nation.id)
            .eq('faction_id', factionId)
            .eq('candidate_type', 'parliamentary')
            .eq('selected', true)
            .limit(1)
            .maybeSingle();
        if (alreadySelected) continue;

        const pick = candidates[0];
        console.log(`Auto-selecting parliamentary PM for ${nation.name}: ${pick.first_name} ${pick.last_name} — selection timed out after ${timeoutTicks} ticks`);

        try {
            await selectPMCandidate(supabase, pick.id, nation.id, factionId, currentTick);
        } catch (e) {
            console.error(`Error auto-selecting parliamentary PM for ${nation.name}:`, e);
        }
    }
}

// ==================== TICK HELPERS ====================

function advanceMonth(currentDate) {
    const parts = currentDate.split(',');
    const month = parts[0].trim();
    const year = parseInt(parts[1].trim());

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const idx = months.indexOf(month);
    if (idx === -1) { console.error('Invalid month:', month); return currentDate; }

    const nextIdx = (idx + 1) % 12;
    const nextYear = nextIdx === 0 ? year + 1 : year;
    return `${months[nextIdx]}, ${nextYear}`;
}

async function acquireTickLock(supabase) {
    const STALE_LOCK_MS = 5 * 60 * 1000; // 5 minutes
    const now = new Date().toISOString();

    // Attempt: acquire lock when tick_processing is false
    const { data: acquired, error: err1 } = await supabase
        .from('shard')
        .update({ tick_processing: true, tick_processing_started_at: now })
        .eq('name', 'Alpha Shard')
        .eq('tick_processing', false)
        .select('name');

    if (!err1 && acquired && acquired.length > 0) return true;

    // Check for stale lock (crashed tab)
    const { data: shard } = await supabase
        .from('shard')
        .select('tick_processing, tick_processing_started_at')
        .eq('name', 'Alpha Shard')
        .single();

    if (shard && shard.tick_processing && shard.tick_processing_started_at) {
        const lockAge = Date.now() - new Date(shard.tick_processing_started_at).getTime();
        if (lockAge > STALE_LOCK_MS) {
            console.warn('Stale tick lock detected (' + Math.round(lockAge / 1000) + 's old), forcing acquire');
            const { data: forced, error: err2 } = await supabase
                .from('shard')
                .update({ tick_processing: true, tick_processing_started_at: now })
                .eq('name', 'Alpha Shard')
                .eq('tick_processing', true)
                .select('name');
            return !err2 && forced && forced.length > 0;
        }
    }

    return false;
}

async function releaseTickLock(supabase) {
    await supabase
        .from('shard')
        .update({ tick_processing: false, tick_processing_started_at: null })
        .eq('name', 'Alpha Shard');
}

// ==================== STAT KEY AUDIT ====================

/**
 * Scan all effect records in the database for invalid stat keys.
 * Logs errors for any stat_key that doesn't match NATION_STAT_COLUMNS
 * (after alias resolution). Runs periodically as a safety net.
 */
async function auditStatKeys(supabase) {
    const invalid = [];

    // 1. Policy stat_effects
    const { data: policies } = await supabase.from('policies').select('id, policy_name, stat_effects');
    for (const p of (policies || [])) {
        for (const eff of (p.stat_effects || [])) {
            const resolved = normalizeNationStatKey(eff.stat_key);
            if (!resolved || !NATION_STAT_COLUMN_SET.has(resolved)) {
                invalid.push({ source: 'policy', name: p.policy_name, id: p.id, bad_key: eff.stat_key });
            }
        }
    }

    // 2. Crisis effects
    const { data: crisisEffects } = await supabase.from('crisis_effects').select('id, crisis_template_id, stat_key, target');
    for (const ce of (crisisEffects || [])) {
        if (ce.target !== 'nation') continue;
        const resolved = normalizeNationStatKey(ce.stat_key);
        if (!resolved || !NATION_STAT_COLUMN_SET.has(resolved)) {
            invalid.push({ source: 'crisis_effect', id: ce.id, template_id: ce.crisis_template_id, bad_key: ce.stat_key });
        }
    }

    // 3. Crisis triggers
    const { data: crisisTriggers } = await supabase.from('crisis_triggers').select('id, crisis_template_id, stat_key');
    for (const ct of (crisisTriggers || [])) {
        const resolved = normalizeNationStatKey(ct.stat_key);
        if (!resolved || !NATION_STAT_COLUMN_SET.has(resolved)) {
            invalid.push({ source: 'crisis_trigger', id: ct.id, template_id: ct.crisis_template_id, bad_key: ct.stat_key });
        }
    }

    // 4. Crisis end triggers
    const { data: crisisEndTriggers } = await supabase.from('crisis_end_triggers').select('id, crisis_template_id, stat_key');
    for (const cet of (crisisEndTriggers || [])) {
        const resolved = normalizeNationStatKey(cet.stat_key);
        if (!resolved || !NATION_STAT_COLUMN_SET.has(resolved)) {
            invalid.push({ source: 'crisis_end_trigger', id: cet.id, template_id: cet.crisis_template_id, bad_key: cet.stat_key });
        }
    }

    // 5. Event effects
    const { data: eventEffects } = await supabase.from('event_effects').select('id, event_id, stat_key, target');
    for (const ee of (eventEffects || [])) {
        if (ee.target !== 'nation') continue;
        const resolved = normalizeNationStatKey(ee.stat_key);
        if (!resolved || !NATION_STAT_COLUMN_SET.has(resolved)) {
            invalid.push({ source: 'event_effect', id: ee.id, event_id: ee.event_id, bad_key: ee.stat_key });
        }
    }

    // 6. Event triggers
    const { data: eventTriggers } = await supabase.from('event_triggers').select('id, event_id, stat_key');
    for (const et of (eventTriggers || [])) {
        if (!et.stat_key) continue; // system triggers have no stat_key
        const resolved = normalizeNationStatKey(et.stat_key);
        if (!resolved || !NATION_STAT_COLUMN_SET.has(resolved)) {
            invalid.push({ source: 'event_trigger', id: et.id, event_id: et.event_id, bad_key: et.stat_key });
        }
    }

    if (invalid.length > 0) {
        console.error(`[auditStatKeys] Found ${invalid.length} invalid stat key(s) in the database:`);
        for (const entry of invalid) {
            console.error(`  - ${entry.source}: "${entry.bad_key}" (id=${entry.id}${entry.name ? ', name=' + entry.name : ''})`);
        }
    } else {
        console.log('[auditStatKeys] All stat keys valid.');
    }

    return invalid;
}

// ==================== ADVANCE TICK ====================

async function advanceTick(supabase) {
    // 1. Increment tick and advance game date
    const { data: shard } = await supabase
        .from('shard')
        .select('current_tick, tick_interval_hours, current_date, next_tick_at')
        .eq('name', 'Alpha Shard')
        .single();
    if (!shard) throw new Error('Shard not found');

    const newTick = (shard.current_tick || 0) + 1;
    // Anchor next_tick_at to the previous schedule to prevent drift
    // Uses UTC-safe millisecond arithmetic instead of setHours() which is timezone-dependent
    const intervalMs = (shard.tick_interval_hours || 12) * 60 * 60 * 1000;
    const prevTickAt = new Date(shard.next_tick_at || new Date());
    let nextTickAt = new Date(prevTickAt.getTime() + intervalMs);
    // Safety: if calculated next tick is in the past (e.g. server was down), advance to future
    const now = Date.now();
    while (nextTickAt.getTime() <= now) {
        nextTickAt = new Date(nextTickAt.getTime() + intervalMs);
    }
    const newDate = advanceMonth(shard.current_date || 'January, 2000');

    await supabase.from('shard').update({
        current_tick: newTick,
        next_tick_at: nextTickAt.toISOString(),
        current_date: newDate
    }).eq('name', 'Alpha Shard');

    // Clear expired coup cooldowns
    await supabase.from('factions')
        .update({ action_lockout_until_tick: null })
        .not('action_lockout_until_tick', 'is', null)
        .lte('action_lockout_until_tick', newTick);

    // 1b. Startup scan: report any invalid stat keys in effect records (first tick only or periodically)
    if (newTick % 10 === 1) { // Run every 10 ticks to avoid perf cost every tick
        try {
            await auditStatKeys(supabase);
        } catch (auditErr) {
            console.error('[advanceTick] auditStatKeys failed (non-fatal):', auditErr);
        }
    }

    // 2. Load all nations
    const { data: nations } = await supabase.from('nations').select('*');
    if (!nations || nations.length === 0) return { tick: newTick, nations: 0 };

    const summary = { tick: newTick, nations: nations.length, effects: [], costs: [], resolutions: [], events: [] };

    // Accumulate AP for party factions each tick:
    // base 5 AP, +1 if in government, +1 if approval > 60. Capped at MAX_AP.
    // Uses atomic RPC to prevent race conditions with concurrent player deductions.
    let apDistributed = 0;
    let apFailed = 0;
    for (const nation of nations) {
      try {
        const { data: factions } = await supabase
            .from('factions')
            .select('id, approval_rating, faction_type')
            .eq('nation_id', nation.id)
            .eq('faction_type', 'party');

        if (!factions || factions.length === 0) continue;

        const coalition = await fetchActiveCoalition(supabase, nation.id);
        const governmentPartyIds = new Set([
            ...(coalition?.party_ids || []),
            nation.ruling_faction_id
        ].filter(Boolean));

        for (const faction of factions) {
            const isInGovernment = governmentPartyIds.has(faction.id);
            let apGain = 5;
            if (isInGovernment) apGain += 1;
            if ((faction.approval_rating ?? 50) > 60) apGain += 1;

            const result = await accumulateAP(supabase, faction.id, apGain);
            if (result.success) {
                console.log(`[advanceTick] AP: faction ${faction.id} → ${result.newAp} (+${apGain})`);
                apDistributed++;
            } else {
                console.error(`[advanceTick] AP accumulation FAILED for faction ${faction.id}: ${result.error}`);
                apFailed++;
            }
        }
      } catch (apErr) {
        console.error(`[advanceTick] AP distribution FAILED for nation ${nation.id} (${nation.name}):`, apErr);
        summary.errors = summary.errors || [];
        summary.errors.push({ nation: nation.name, nationId: nation.id, phase: 'ap_distribution', error: String(apErr) });
      }
    }
    summary.apDistributed = apDistributed;
    summary.apFailed = apFailed;

    for (const nation of nations) {
      try {
        // Set correct seat count for this nation (affects supermajority thresholds, etc.)
        initGameConfigForNation(nation);

        // 3. Process stat effects (from passed bills/active laws)
        const effectResults = await processStatEffects(supabase, nation, newTick);
        if (effectResults.length > 0) summary.effects.push({ nation: nation.name, effects: effectResults });

        // 3b. Process ministry action effects
        const ministryResults = await processMinistryActions(supabase, nation, newTick);
        if (ministryResults.length > 0) {
            summary.ministryActions = summary.ministryActions || [];
            summary.ministryActions.push({ nation: nation.name, effects: ministryResults });
        }

        // 3c. Apply GDP growth rate
        await applyGdpGrowth(supabase, nation);

        // 4. Process ongoing costs
        const costResult = await processOngoingCosts(supabase, nation, newTick);
        if (costResult.totalCost !== 0) summary.costs.push({ nation: nation.name, ...costResult });

        // 4a. Process PM trait effects
        await processPMTraitEffects(supabase, nation, newTick);

        // 4b. Process elections (democracy only)
        const electionResults = await processElections(supabase, nation, newTick);
        if (electionResults.length > 0) {
            summary.elections = summary.elections || [];
            summary.elections.push({ nation: nation.name, elections: electionResults });
        }

        // 4c. Process government vacancy penalties (democracy only)
        const vacancyResult = await processGovernmentVacancy(supabase, nation, newTick);
        if (vacancyResult) {
            summary.vacancies = summary.vacancies || [];
            summary.vacancies.push(vacancyResult);
        }

        // 5. Resolve expired votes for this nation
        const resolutions = await resolveExpiredVotes(supabase, nation.id);
        if (resolutions.length > 0) summary.resolutions.push({ nation: nation.name, bills: resolutions });

        // 5b. Auto-sign expired president's desk bills (Presidential systems)
        const deskResults = await processPresidentDesk(supabase, nation, newTick);
        if (deskResults.length > 0) {
            summary.presidentDesk = summary.presidentDesk || [];
            summary.presidentDesk.push({ nation: nation.name, bills: deskResults });
        }

        // 5c. Presidential pre-election candidate generation, term end safety net, + selection timeout
        await triggerPresidentialCandidateSelection(supabase, nation, newTick);
        await processPresidentialTermEnd(supabase, nation, newTick);
        await processPresidentCandidateTimeout(supabase, nation, newTick);
        await processParliamentaryPMTimeout(supabase, nation, newTick);

        // 6. Apply ideology shifts from resolved bills
        await processIdeologyShifts(supabase, nation.id, resolutions);

        // 7. Process purge approval decay (autocracy scapegoat mechanic)
        if (nation.government_type === 'Autocracy') {
            await processPurgeDecay(supabase, nation.id, newTick);
        }

        // 7b. Process bloc approval decay toward ideology-based targets
        await processBlocApprovalDecay(supabase, nation);

        // 7d. Apply random ±1D3% jitter to party standings (democracies only)
        await processPartyStandingsJitter(supabase, nation);

        // 8. Process faction loyalty (autocracy)
        if (nation.government_type === 'Autocracy') {
            await processLoyaltyTick(supabase, nation);
        }

        // 9. Auto-resolve shakeups that are 1+ ticks old
        if (nation.government_type === 'Autocracy') {
            await autoResolveStaleShakeups(supabase, nation.id, newTick);
        }

        // 10. Re-fetch nation with post-effect values, then snapshot to history
        //     Also update in-memory nation so downstream steps (crises, revolution, events)
        //     see post-processStatEffects values for trigger checks.
        const { data: freshNation } = await supabase.from('nations').select('*').eq('id', nation.id).single();
        if (freshNation) Object.assign(nation, freshNation);
        await snapshotNationHistory(supabase, freshNation || nation, newTick);

        // 11b. Process crises (persistent negative events that apply effects every tick)
        const crisisResults = await processCrises(supabase, nation, newTick);
        if (crisisResults.length > 0) {
            summary.crises = summary.crises || [];
            summary.crises.push({ nation: nation.name, crises: crisisResults });
        }

        // 11c. Process democratic revolution (autocracy only)
        const revolutionResult = await processRevolution(supabase, nation, newTick);
        if (revolutionResult) {
            summary.revolutions = summary.revolutions || [];
            summary.revolutions.push(revolutionResult);
        }

        // 12. Process random events
        const eventResults = await processEvents(supabase, nation, newTick);
        if (eventResults.length > 0) summary.events.push({ nation: nation.name, events: eventResults });

        // 13. Process ministry inbox events (fire from templates + expire overdue)
        const ministryEventResults = await processMinistryInboxEvents(supabase, freshNation || nation, newTick);
        if (ministryEventResults.length > 0) {
            summary.ministryEvents = summary.ministryEvents || [];
            summary.ministryEvents.push({ nation: nation.name, events: ministryEventResults });
        }
      } catch (nationErr) {
        console.error(`[advanceTick] FAILED processing nation ${nation.id} (${nation.name}):`, nationErr);
        summary.errors = summary.errors || [];
        summary.errors.push({ nation: nation.name, nationId: nation.id, error: String(nationErr) });
      }
    }

    return summary;
}

async function processPurgeDecay(supabase, nationId, currentTick) {
    const { data: purgeActions } = await supabase
        .from('campaign_actions')
        .select('id, party_id, result')
        .eq('nation_id', nationId)
        .eq('action_type', 'purge_minister');

    if (!purgeActions || purgeActions.length === 0) return;

    for (const action of purgeActions) {
        const result = action.result;
        if (!result || !result.decay_ticks_remaining || result.decay_ticks_remaining <= 0) continue;

        const decayRate = result.decay_rate || 1;
        await adjustBlocApproval(supabase, action.party_id, -decayRate);

        const newRemaining = result.decay_ticks_remaining - 1;
        await supabase.from('campaign_actions')
            .update({ result: { ...result, decay_ticks_remaining: newRemaining } })
            .eq('id', action.id);
    }
}


// ==================== BLOC APPROVAL DECAY ====================

/**
 * Drift each faction x bloc approval toward an ideology-based target.
 * Base target: 40. If a voter bloc opposes the party's declared
 * ideology, the target drops (minimum 20). Drift rate: 0.5 per tick.
 */
async function processBlocApprovalDecay(supabase, nation) {
    const BASE_TARGET = 40;
    const MIN_TARGET = 20;
    const MAX_PENALTY_PER_AXIS = 10;
    const DRIFT_RATE = 0.5;

    // 1. Load all party factions
    const { data: factions } = await supabase
        .from('factions')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');
    if (!factions || factions.length === 0) return;

    const factionIds = factions.map(f => f.id);

    // 2. Load all faction_bloc_approval rows
    const { data: allBlocRows } = await supabase
        .from('faction_bloc_approval')
        .select('id, faction_id, bloc_id, approval')
        .in('faction_id', factionIds);
    if (!allBlocRows || allBlocRows.length === 0) return;

    // 3. Load voter blocs with ideology axes
    const { data: voterBlocs } = await supabase
        .from('voter_blocs')
        .select('id, population_weight, axis_liberty_equality, axis_tradition_progress, axis_security_freedom, axis_globalism_nationalism, axis_individualism_collectivism')
        .eq('nation_id', nation.id)
        .eq('is_active', true);
    if (!voterBlocs || voterBlocs.length === 0) return;

    const blocMap = {};
    for (const b of voterBlocs) blocMap[b.id] = b;

    // 4. Load faction ideologies (declared axes)
    const { data: ideologies } = await supabase
        .from('faction_ideology')
        .select('faction_id, declared_axis_1, declared_direction_1, declared_axis_2, declared_direction_2')
        .in('faction_id', factionIds);

    const ideoMap = {};
    for (const row of (ideologies || [])) ideoMap[row.faction_id] = row;

    // 5. Process each faction x bloc pair
    const updates = [];

    for (const row of allBlocRows) {
        const bloc = blocMap[row.bloc_id];
        if (!bloc) continue;

        const ideo = ideoMap[row.faction_id];
        let totalPenalty = 0;

        if (ideo) {
            for (const [axisKey, dirKey] of [
                ['declared_axis_1', 'declared_direction_1'],
                ['declared_axis_2', 'declared_direction_2']
            ]) {
                const axis = ideo[axisKey];
                const dir = ideo[dirKey];
                if (!axis || dir === null || dir === undefined) continue;

                const blocAxisCol = 'axis_' + axis;
                const blocScore = bloc[blocAxisCol] ?? 50;

                // Opposition: party favors one pole, bloc leans opposite
                let oppositionStrength = 0;
                if (dir === -1) {
                    // Party favors Pole A (low values); bloc opposes if > 50
                    oppositionStrength = Math.max(0, (blocScore - 50) / 50);
                } else {
                    // Party favors Pole B (high values); bloc opposes if < 50
                    oppositionStrength = Math.max(0, (50 - blocScore) / 50);
                }

                totalPenalty += Math.floor(oppositionStrength * MAX_PENALTY_PER_AXIS);
            }
        }

        const target = Math.max(MIN_TARGET, BASE_TARGET - totalPenalty);

        // Drift toward target
        let newApproval = row.approval;
        if (row.approval > target) {
            newApproval = Math.round(Math.max(target, row.approval - DRIFT_RATE));
        } else if (row.approval < target) {
            newApproval = Math.round(Math.min(target, row.approval + DRIFT_RATE));
        }

        if (newApproval !== row.approval) {
            row.approval = newApproval;
            updates.push({ id: row.id, approval: newApproval });
        }
    }

    // 6. Batch update changed rows
    for (const u of updates) {
        await supabase.from('faction_bloc_approval')
            .update({ approval: u.approval })
            .eq('id', u.id);
    }

    // 7. Recalculate derived approval for affected factions
    if (updates.length > 0) {
        const affectedFactions = [...new Set(
            allBlocRows
                .filter(r => updates.some(u => u.id === r.id))
                .map(r => r.faction_id)
        )];
        for (const fId of affectedFactions) {
            const factionBlocRows = allBlocRows.filter(r => r.faction_id === fId);
            await recalcDerivedApproval(supabase, fId, factionBlocRows);
        }
    }
}


// ==================== PARTY STANDINGS JITTER ====================

/**
 * Each tick, every party's bloc approvals shift by a random ±1D3%.
 * This creates natural public-opinion fluctuation on top of the ideology-based drift.
 * The ideology decay system anchors values so jitter doesn't accumulate.
 */
async function processPartyStandingsJitter(supabase, nation) {
    // Only for democracies
    if (nation.government_type === 'Autocracy') return;

    const { data: factions } = await supabase
        .from('factions')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');
    if (!factions || factions.length === 0) return;

    const factionIds = factions.map(f => f.id);

    const { data: allBlocRows } = await supabase
        .from('faction_bloc_approval')
        .select('id, faction_id, bloc_id, approval')
        .in('faction_id', factionIds);
    if (!allBlocRows || allBlocRows.length === 0) return;

    // Group by faction
    const factionGroups = {};
    for (const row of allBlocRows) {
        if (!factionGroups[row.faction_id]) factionGroups[row.faction_id] = [];
        factionGroups[row.faction_id].push(row);
    }

    const updates = [];

    for (const factionId of Object.keys(factionGroups)) {
        const rows = factionGroups[factionId];
        // Roll 1D3: random 1-3, then randomly positive or negative
        const delta = (Math.floor(Math.random() * 3) + 1) * (Math.random() < 0.5 ? -1 : 1);

        for (const row of rows) {
            const newApproval = Math.max(0, Math.min(100, row.approval + delta));
            if (newApproval !== row.approval) {
                row.approval = newApproval;
                updates.push({ id: row.id, approval: newApproval });
            }
        }
    }

    // Batch update changed rows
    for (const u of updates) {
        await supabase.from('faction_bloc_approval')
            .update({ approval: u.approval })
            .eq('id', u.id);
    }

    // Recalculate derived approval for all factions
    for (const factionId of Object.keys(factionGroups)) {
        const factionBlocRows = factionGroups[factionId];
        await recalcDerivedApproval(supabase, factionId, factionBlocRows);
    }

    console.log(`[Standings Jitter] Applied random ±1-3% jitter to ${Object.keys(factionGroups).length} parties, ${updates.length} rows updated`);
}


// ==================== LOYALTY TICK PROCESSING ====================

async function processLoyaltyTick(supabase, nation) {
    const rulingId = nation.ruling_faction_id;
    if (!rulingId) return;

    const isAutocracy = (nation.government_type === 'Autocracy');

    const { data: factions } = await supabase
        .from('factions')
        .select('id, loyalty, seats')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');

    if (!factions || factions.length === 0) return;

    const { data: ministries } = await supabase
        .from('ministries')
        .select('party_id')
        .eq('nation_id', nation.id)
        .not('party_id', 'is', null);

    const ministryCounts = {};
    if (ministries) {
        for (const m of ministries) {
            ministryCounts[m.party_id] = (ministryCounts[m.party_id] || 0) + 1;
        }
    }

    for (const faction of factions) {
        let loyalty = faction.loyalty ?? 50;
        let seats = faction.seats || 0;

        if (faction.id === rulingId) {
            if (isAutocracy) {
                // Autocracy ruling faction: dynamic loyalty drifting toward 80
                const ministryCount = ministryCounts[faction.id] || 0;
                if (loyalty > 80) loyalty -= 1;
                else if (loyalty < 80) loyalty += 1;
                loyalty += ministryCount * 0.5;
                loyalty = Math.max(0, Math.min(100, Math.round(loyalty * 10) / 10));
                await supabase.from('factions')
                    .update({ loyalty })
                    .eq('id', faction.id);
            } else {
                if (loyalty !== 100) {
                    await supabase.from('factions')
                        .update({ loyalty: 100 })
                        .eq('id', faction.id);
                }
            }
            continue;
        }

        const ministryCount = ministryCounts[faction.id] || 0;

        if (ministryCount > 0) {
            loyalty += ministryCount * 0.5;
        } else {
            loyalty -= 2;
        }

        if (loyalty > 50) {
            loyalty -= 1;
        } else if (loyalty < 50) {
            loyalty += 1;
        }

        loyalty = Math.max(0, Math.min(100, Math.round(loyalty * 10) / 10));

        // Loyalty is now informational only for autocracies (no AP/seat drain or auto-purges).

        await supabase.from('factions')
            .update({ loyalty, seats })
            .eq('id', faction.id);
    }
}


// ==================== SHAKEUP AUTO-RESOLVE ====================

async function autoResolveStaleShakeups(supabase, nationId, currentTick) {
    const { data: votingShakeups } = await supabase
        .from('shakeups')
        .select('id, created_at')
        .eq('nation_id', nationId)
        .eq('status', 'voting');

    if (!votingShakeups || votingShakeups.length === 0) return;

    const AUTO_RESOLVE_TICKS = 2;

    for (const shakeup of votingShakeups) {
        let tickAge = AUTO_RESOLVE_TICKS;

        if (shakeup.created_tick != null) {
            tickAge = currentTick - shakeup.created_tick;
        } else if (shakeup.created_at) {
            const ageMs = Date.now() - new Date(shakeup.created_at).getTime();
            const ageDays = ageMs / (1000 * 60 * 60 * 24);
            tickAge = ageDays >= 1 ? AUTO_RESOLVE_TICKS : 0;
        }

        if (tickAge >= AUTO_RESOLVE_TICKS) {
            console.log(`Auto-resolving stale shakeup ${shakeup.id} (age: ${tickAge} ticks, now tick ${currentTick})`);
            try {
                const { data, error } = await supabase.rpc('resolve_shakeup', { p_shakeup_id: shakeup.id });
                if (error) console.error('Auto-resolve shakeup error:', error);
                else console.log('Auto-resolve result:', data);
            } catch (e) {
                console.error('Auto-resolve shakeup exception:', e);
            }
        }
    }
}


// ==================== STAT EFFECTS PROCESSING ====================

async function processStatEffects(supabase, nation, currentTick) {
    let activeLaws;

    // Try join query first; fall back to separate lookup if FK is missing
    const { data, error: joinError } = await supabase
        .from('active_laws')
        .select('*, policies(*)')
        .eq('nation_id', nation.id);

    if (joinError) {
        console.warn('[processStatEffects] Join query failed, falling back to separate policy lookup:', joinError.message);
        const { data: lawsOnly, error: fallbackError } = await supabase
            .from('active_laws')
            .select('*')
            .eq('nation_id', nation.id);

        if (fallbackError || !lawsOnly || lawsOnly.length === 0) {
            if (fallbackError) console.error('[processStatEffects] Fallback query also failed:', fallbackError.message);
            return [];
        }

        // Fetch policies separately and attach them
        const policyIds = [...new Set(lawsOnly.filter(l => l.policy_id).map(l => l.policy_id))];
        if (policyIds.length > 0) {
            const { data: policies } = await supabase
                .from('policies')
                .select('*')
                .in('id', policyIds);
            const policyMap = {};
            for (const p of (policies || [])) policyMap[p.id] = p;
            for (const law of lawsOnly) {
                law.policies = policyMap[law.policy_id] || null;
            }
        }
        activeLaws = lawsOnly;
    } else {
        activeLaws = data;
        // If join succeeded but policies are null for every law, try separate lookup
        if (activeLaws && activeLaws.length > 0 && activeLaws.every(l => !l.policies && l.policy_id)) {
            console.warn('[processStatEffects] Join returned null policies for all laws — fetching separately');
            const policyIds = [...new Set(activeLaws.filter(l => l.policy_id).map(l => l.policy_id))];
            if (policyIds.length > 0) {
                const { data: policies } = await supabase
                    .from('policies')
                    .select('*')
                    .in('id', policyIds);
                const policyMap = {};
                for (const p of (policies || [])) policyMap[p.id] = p;
                for (const law of activeLaws) {
                    if (!law.policies && law.policy_id) law.policies = policyMap[law.policy_id] || null;
                }
            }
        }
    }

    if (!activeLaws || activeLaws.length === 0) {
        console.log(`[processStatEffects] No active laws for ${nation.name}`);
        return [];
    }

    console.log(`[processStatEffects] Processing ${activeLaws.length} active law(s) for ${nation.name}`);

    const appliedEffects = [];
    const nationUpdates = {};
    const lawsToAdvance = [];
    const lawsToDelete = [];

    for (const law of activeLaws) {
        const policy = law.policies;
        const effectSource = `active_law=${law.id}, bill=${law.bill_id || 'unknown'}, policy=${policy?.id || 'unknown'} (${policy?.policy_name || 'Unknown'})`;
        const lastApplied = law.effects_applied_through_tick || 0;
        if (lastApplied >= currentTick) continue;

        const passedTick = law.passed_tick || 0;

        let effects = [];
        const isReversal = law.is_reversal || false;

        if (isReversal && law.reversal_effects && Array.isArray(law.reversal_effects)) {
            effects = law.reversal_effects;
        } else if (policy) {
            if (policy.stat_effects && Array.isArray(policy.stat_effects) && policy.stat_effects.length > 0) {
                effects.push(...policy.stat_effects);
            } else if (policy.target_stat) {
                effects.push({
                    stat_key: policy.target_stat,
                    direction: (policy.stat_direction || 'UP').toLowerCase(),
                    rate: policy.stat_change_per_tick || 1,
                    delay_ticks: 0,
                    duration_ticks: policy.duration_months || 12
                });
            }
        }

        if (effects.length === 0) {
            lawsToAdvance.push(law.id);
            continue;
        }

        let anyEffectApplied = false;
        let allEffectsComplete = true;

        for (let tick = lastApplied + 1; tick <= currentTick; tick++) {
            const ticksSincePassed = tick - passedTick;

            for (const eff of effects) {
                const delay = Number(eff.delay_ticks) || 0;
                const duration = Number(eff.duration_ticks) || 12;
                const rate = Number(eff.rate) || 1;
                const dir = String(eff.direction || '').toLowerCase();
                const rawStatKey = eff.stat_key;
                const statKey = normalizeNationStatKey(rawStatKey);

                if (!statKey || !NATION_STAT_COLUMN_SET.has(statKey)) {
                    if (tick === lastApplied + 1) {
                        console.warn(
                            `[processStatEffects] Skipping invalid stat_key "${rawStatKey}" for ${effectSource}`
                        );
                    }
                    continue;
                }

                if (dir !== 'up' && dir !== 'down') {
                    if (tick === lastApplied + 1) {
                        console.warn(
                            `[processStatEffects] Skipping invalid direction "${eff.direction}" for stat_key="${rawStatKey}" from ${effectSource}`
                        );
                    }
                    continue;
                }

                if (ticksSincePassed <= delay + duration) {
                    allEffectsComplete = false;
                }

                if (ticksSincePassed > delay && ticksSincePassed <= delay + duration) {
                    const currentVal = nationUpdates[statKey] !== undefined
                        ? nationUpdates[statKey]
                        : (nation[statKey] !== undefined && nation[statKey] !== null ? Number(nation[statKey]) : 50);

                    // For raw-value stats (GDP, debt, population), scale rate by divisor
                    // so rate: 1 means +$1B for GDP/debt, +1M for population
                    const scaledRate = RAW_SCALING_DIVISORS[statKey] ? rate * RAW_SCALING_DIVISORS[statKey] : rate;

                    let newVal;
                    if (dir === 'up') {
                        newVal = currentVal + scaledRate;
                    } else {
                        newVal = currentVal - scaledRate;
                    }

                    // Raw-value stats — don't clamp to 0-100
                    if (RAW_SCALING_DIVISORS[statKey]) {
                        newVal = Math.max(0, newVal);
                    } else {
                        newVal = Math.round(Math.max(0, Math.min(100, newVal)) * 10) / 10;
                    }
                    nationUpdates[statKey] = newVal;
                    anyEffectApplied = true;

                    appliedEffects.push({
                        policy: isReversal ? '↩ Reversal: ' + (policy?.policy_name || 'Unknown') : (policy?.policy_name || 'Unknown'),
                        stat: statKey,
                        direction: dir,
                        rate: rate,
                        tick: tick,
                        newValue: newVal
                    });
                }
            }
        }

        lawsToAdvance.push(law.id);

        if (isReversal && allEffectsComplete) {
            lawsToDelete.push(law.id);
        }
    }

    let nationUpdateError = null;
    if (Object.keys(nationUpdates).length > 0) {
        const { error } = await supabase
            .from('nations')
            .update(nationUpdates)
            .eq('id', nation.id);
        nationUpdateError = error;
    }

    if (nationUpdateError) {
        console.error(
            '[processStatEffects] Nation stat update FAILED',
            { nationId: nation.id, payload: nationUpdates, error: nationUpdateError.message }
        );
        return [];
    }

    if (Object.keys(nationUpdates).length > 0) {
        console.log(`[processStatEffects] Nation stats updated for ${nation.name}:`, JSON.stringify(nationUpdates));
        // Propagate DB-written values to in-memory nation for downstream tick steps (3b-9)
        Object.assign(nation, nationUpdates);
    }

    for (const id of lawsToAdvance) {
        const { error: trackErr } = await supabase
            .from('active_laws')
            .update({ effects_applied_through_tick: currentTick })
            .eq('id', id);
        if (trackErr) {
            console.error(`[processStatEffects] Tracking update FAILED for active_law ${id}:`, trackErr.message);
        }
    }

    for (const id of lawsToDelete) {
        await supabase.from('active_laws').delete().eq('id', id);
    }

    return appliedEffects;
}

/**
 * Process ministry action stat effects during tick advancement.
 * Mirrors processStatEffects but reads from ministry_action_log.
 */
async function processMinistryActions(supabase, nation, currentTick) {
    const { data: actions, error: fetchError } = await supabase
        .from('ministry_action_log')
        .select('*')
        .eq('nation_id', nation.id)
        .eq('processed', false);

    if (fetchError) {
        console.error('[processMinistryActions] Failed to fetch actions:', fetchError.message);
        return [];
    }
    if (!actions || actions.length === 0) return [];

    const appliedEffects = [];
    const nationUpdates = {};
    // Track minister approval changes keyed by ministry_key + faction_id
    const ministerUpdates = {};
    // Track initial minister approval values for cascade delta calculation
    const ministerBaseline = {};
    // Track faction approval changes keyed by faction_id
    const factionUpdates = {};
    const factionBaseline = {};
    // Defer tracking updates until after nation stats are persisted
    const trackingUpdates = [];

    for (const action of actions) {
        const effects = action.stat_effects;
        if (!effects || !Array.isArray(effects) || effects.length === 0) {
            // No effects — mark as processed
            await supabase.from('ministry_action_log').update({ processed: true }).eq('id', action.id);
            continue;
        }

        const lastApplied = action.effects_applied_through_tick || 0;
        if (lastApplied >= currentTick) continue;

        const appliedTick = action.applied_at_tick || 0;

        let allEffectsComplete = true;

        for (let tick = lastApplied + 1; tick <= currentTick; tick++) {
            const ticksSinceAction = tick - appliedTick;

            for (const eff of effects) {
                const delay = Number(eff.delay_ticks) || 0;
                const duration = Number(eff.duration_ticks) || 4;
                const rate = Number(eff.rate) || 1;
                const target = eff.target || 'nation';
                const rawStatKey = eff.stat_key;
                const statKey = (target === 'nation') ? normalizeNationStatKey(rawStatKey) : rawStatKey;
                if (target === 'nation' && (!statKey || !NATION_STAT_COLUMN_SET.has(statKey))) {
                    console.warn(`[processMinistryActions] Skipping invalid stat_key "${rawStatKey}" for action "${action.action_key}" in ${nation.name}`);
                    continue;
                }

                if (ticksSinceAction <= delay + duration) {
                    allEffectsComplete = false;
                }

                if (ticksSinceAction > delay && ticksSinceAction <= delay + duration) {
                    let currentVal, newVal;

                    if (target === 'minister') {
                        const mKey = action.ministry_key + ':' + action.faction_id;
                        if (ministerUpdates[mKey] === undefined) {
                            // Fetch current minister_approval from the ministries table
                            const { data: ministry } = await supabase
                                .from('ministries')
                                .select('minister_approval')
                                .eq('nation_id', nation.id)
                                .eq('ministry_key', action.ministry_key)
                                .eq('party_id', action.faction_id)
                                .single();
                            ministerUpdates[mKey] = (ministry?.minister_approval ?? 50);
                            ministerBaseline[mKey] = ministerUpdates[mKey];
                        }
                        currentVal = ministerUpdates[mKey];
                        newVal = eff.direction === 'up' ? currentVal + rate : currentVal - rate;
                        newVal = Math.round(Math.max(0, Math.min(100, newVal)) * 10) / 10;
                        ministerUpdates[mKey] = newVal;
                    } else if (target === 'faction') {
                        const fKey = action.faction_id;
                        if (factionUpdates[fKey] === undefined) {
                            const { data: faction } = await supabase
                                .from('factions')
                                .select('approval_rating')
                                .eq('id', action.faction_id)
                                .single();
                            factionUpdates[fKey] = (faction?.approval_rating ?? 50);
                            factionBaseline[fKey] = factionUpdates[fKey];
                        }
                        currentVal = factionUpdates[fKey];
                        newVal = eff.direction === 'up' ? currentVal + rate : currentVal - rate;
                        newVal = Math.round(Math.max(0, Math.min(100, newVal)) * 10) / 10;
                        factionUpdates[fKey] = newVal;
                    } else {
                        // Default: nation stat
                        currentVal = nationUpdates[statKey] !== undefined
                            ? nationUpdates[statKey]
                            : (nation[statKey] !== undefined && nation[statKey] !== null ? Number(nation[statKey]) : 50);
                        newVal = eff.direction === 'up' ? currentVal + rate : currentVal - rate;
                        newVal = Math.round(Math.max(0, Math.min(100, newVal)) * 10) / 10;
                        nationUpdates[statKey] = newVal;
                    }

                    appliedEffects.push({
                        action: action.action_key,
                        ministry: action.ministry_key,
                        stat: statKey,
                        target: target,
                        direction: eff.direction,
                        rate: rate,
                        tick: tick,
                        newValue: newVal
                    });
                }
            }
        }

        // Defer tracking update — only apply after nation stats are persisted
        trackingUpdates.push({ id: action.id, allEffectsComplete });
    }

    // Bulk update nation stats FIRST — before advancing tracking
    let nationUpdateFailed = false;
    if (Object.keys(nationUpdates).length > 0) {
        const { error: nationError } = await supabase.from('nations').update(nationUpdates).eq('id', nation.id);
        if (nationError) {
            console.error('[processMinistryActions] Nation stat update FAILED — effects will be retried next tick',
                { nationId: nation.id, payload: nationUpdates, error: nationError.message });
            nationUpdateFailed = true;
        } else {
            console.log('[processMinistryActions] Nation stats updated:', JSON.stringify(nationUpdates));
        }
    }

    // Only advance tracking if nation update succeeded (or had nothing to update)
    if (!nationUpdateFailed) {
        for (const tu of trackingUpdates) {
            await supabase.from('ministry_action_log').update({
                effects_applied_through_tick: currentTick,
                processed: tu.allEffectsComplete
            }).eq('id', tu.id);
        }
    }

    // Bulk update minister approval
    for (const mKey of Object.keys(ministerUpdates)) {
        const [ministryKey, factionId] = mKey.split(':');
        await supabase.from('ministries')
            .update({ minister_approval: ministerUpdates[mKey] })
            .eq('nation_id', nation.id)
            .eq('ministry_key', ministryKey)
            .eq('party_id', factionId);
    }

    // Cascade minister approval LOSSES to party approval (PM losses at 2x)
    for (const mKey of Object.keys(ministerUpdates)) {
        const baseline = ministerBaseline[mKey];
        const current = ministerUpdates[mKey];
        if (baseline === undefined || current >= baseline) continue; // only losses cascade
        const [ministryKey, factionId] = mKey.split(':');
        const loss = baseline - current;
        const multiplier = ministryKey === 'prime_minister' ? 2 : 1;
        // Load faction approval into factionUpdates if not already tracked
        if (factionUpdates[factionId] === undefined) {
            const { data: faction } = await supabase
                .from('factions')
                .select('approval_rating')
                .eq('id', factionId)
                .single();
            factionUpdates[factionId] = (faction?.approval_rating ?? 50);
            factionBaseline[factionId] = factionUpdates[factionId];
        }
        factionUpdates[factionId] = Math.max(0, factionUpdates[factionId] - (loss * multiplier));
    }

    // Bulk update faction approval via bloc system
    for (const fKey of Object.keys(factionUpdates)) {
        const delta = Math.round((factionUpdates[fKey] - (factionBaseline[fKey] ?? 50)) * 10) / 10;
        if (delta !== 0) {
            await adjustBlocApproval(supabase, fKey, delta);
        }
    }

    return appliedEffects;
}

async function processOngoingCosts(supabase, nation, currentTick) {
    const { data: activeLaws } = await supabase
        .from('active_laws')
        .select('*, policies(*)')
        .eq('nation_id', nation.id);

    if (!activeLaws || activeLaws.length === 0) return { totalCost: 0, details: [] };

    let totalCost = 0;
    const details = [];

    for (const law of activeLaws) {
        const policy = law.policies;
        if (!policy) continue;

        const baseCost = policy.ongoing_base_cost || policy.ongoing_cost_per_tick || 0;
        if (baseCost === 0) continue;

        let tickCost = baseCost;

        if (policy.ongoing_scaling_stat && nation[policy.ongoing_scaling_stat] !== undefined) {
            const scalingVal = Number(nation[policy.ongoing_scaling_stat]) || 1;
            const divisor = RAW_SCALING_DIVISORS[policy.ongoing_scaling_stat] || 50;
            tickCost = baseCost * (scalingVal / divisor);
        }

        totalCost += tickCost;

        const newAccum = (law.ongoing_accumulated || 0) + tickCost;
        await supabase.from('active_laws').update({
            ongoing_accumulated: newAccum
        }).eq('id', law.id);

        details.push({ policy: policy.policy_name, cost: tickCost });
    }

    // Policy costs are tracked in active_laws.ongoing_accumulated.

    return { totalCost, details };
}

// All columns that nations_history tracks (must match the DB table schema)
const HISTORY_SNAPSHOT_COLUMNS = [
    ...NATION_STAT_COLUMNS,
    'national_approval',
    'competition_voters', 'liberty_voters', 'security_voters', 'globalism_voters',
    'progressive_voters', 'liberal_voters', 'moderate_voters', 'conservative_voters', 'nationalist_voters'
];

async function snapshotNationHistory(supabase, nation, currentTick) {
    const snapshot = { nation_id: nation.id, tick: currentTick };

    for (const key of HISTORY_SNAPSHOT_COLUMNS) {
        if (nation[key] !== undefined && nation[key] !== null) {
            snapshot[key] = Number(nation[key]);
        }
    }

    const { error: snapError } = await supabase.from('nations_history').upsert(snapshot, {
        onConflict: 'nation_id,tick'
    });
    if (snapError) {
        console.error('[snapshotNationHistory] FAILED for nation', nation.id, 'tick', currentTick, ':', snapError.message);
    } else {
        console.log(`[snapshotNationHistory] Stored ${Object.keys(snapshot).length - 2} stats for nation ${nation.id} at tick ${currentTick}`);
    }
}


// ==================== EVENT TICK PROCESSOR ====================

async function processEvents(supabase, nation, currentTick) {
    const { data: events } = await supabase
        .from('event_templates')
        .select('*, event_descriptions(*), event_triggers(*), event_effects(*)')
        .eq('is_active', true);

    if (!events || events.length === 0) return [];

    const { data: recentLog } = await supabase
        .from('event_log')
        .select('event_id, fired_at_tick')
        .eq('nation_id', nation.id)
        .order('fired_at_tick', { ascending: false })
        .limit(200);

    const lastFiredMap = {};
    for (const entry of (recentLog || [])) {
        if (!lastFiredMap[entry.event_id]) {
            lastFiredMap[entry.event_id] = entry.fired_at_tick;
        }
    }

    const firedEvents = [];

    for (const event of events) {
        const lastFired = lastFiredMap[event.id];
        if (lastFired !== undefined) {
            const ticksSince = currentTick - lastFired;
            if (ticksSince < event.cooldown_ticks) continue;
        }

        const triggers = event.event_triggers || [];
        if (triggers.length === 0) continue;

        let allTriggersPass = true;
        for (const trigger of triggers) {
            const statValue = nation[trigger.stat_key];
            if (statValue === null || statValue === undefined) {
                allTriggersPass = false;
                break;
            }
            const val = Number(statValue);
            if (trigger.min_value !== null && trigger.min_value !== undefined && val < trigger.min_value) {
                allTriggersPass = false;
                break;
            }
            if (trigger.max_value !== null && trigger.max_value !== undefined && val > trigger.max_value) {
                allTriggersPass = false;
                break;
            }
        }
        if (!allTriggersPass) continue;

        const roll = Math.random() * 100;
        if (roll >= event.probability) continue;

        const descriptions = event.event_descriptions || [];
        let description = descriptions.length > 0
            ? descriptions[Math.floor(Math.random() * descriptions.length)].description_text
            : event.name;

        // Resolve placeholders in event description
        description = description.replace(/\{nation\}/g, nation.name || 'Unknown');

        const effects = event.event_effects || [];
        const appliedEffects = [];
        const nationUpdates = {};

        for (const effect of effects) {
            // Normalize + validate stat_key for nation targets
            const rawEvtStatKey = effect.stat_key;
            const evtStatKey = (effect.target === 'nation') ? normalizeNationStatKey(rawEvtStatKey) : rawEvtStatKey;
            if (effect.target === 'nation' && (!evtStatKey || !NATION_STAT_COLUMN_SET.has(evtStatKey))) {
                console.warn(`[processEvents] Skipping invalid stat_key "${rawEvtStatKey}" in event "${event.name}" for ${nation.name}`);
                continue;
            }

            if (effect.target === 'nation') {
                const currentVal = nation[evtStatKey] !== undefined
                    ? Number(nation[evtStatKey]) : 50;
                const newVal = Math.max(0, Math.min(100, currentVal + effect.change_value));
                nationUpdates[evtStatKey] = newVal;
                nation[evtStatKey] = newVal;

                appliedEffects.push({
                    stat: evtStatKey, change: effect.change_value,
                    target: 'nation', old: currentVal, new: newVal
                });

            } else if (effect.target === 'ruling_party') {
                const rulingId = nation.ruling_faction_id;
                if (!rulingId) continue;

                const { data: faction } = await supabase
                    .from('factions')
                    .select(effect.stat_key)
                    .eq('id', rulingId)
                    .single();

                if (faction) {
                    const currentVal = faction[effect.stat_key] ?? 50;
                    const newVal = Math.max(0, Math.min(100, currentVal + effect.change_value));
                    await supabase.from('factions')
                        .update({ [effect.stat_key]: newVal })
                        .eq('id', rulingId);

                    appliedEffects.push({
                        stat: effect.stat_key, change: effect.change_value,
                        target: 'ruling_party', faction_id: rulingId,
                        old: currentVal, new: newVal
                    });
                }

            } else if (effect.target === 'random_faction') {
                const { data: factions } = await supabase
                    .from('factions')
                    .select('id, ' + effect.stat_key)
                    .eq('nation_id', nation.id)
                    .eq('faction_type', 'party')
                    .eq('is_npc', false);

                if (factions && factions.length > 0) {
                    const target = factions[Math.floor(Math.random() * factions.length)];
                    const currentVal = target[effect.stat_key] ?? 50;
                    const newVal = Math.max(0, Math.min(100, currentVal + effect.change_value));
                    await supabase.from('factions')
                        .update({ [effect.stat_key]: newVal })
                        .eq('id', target.id);

                    appliedEffects.push({
                        stat: effect.stat_key, change: effect.change_value,
                        target: 'random_faction', faction_id: target.id,
                        old: currentVal, new: newVal
                    });
                }
            }
        }

        if (Object.keys(nationUpdates).length > 0) {
            await supabase.from('nations').update(nationUpdates).eq('id', nation.id);
        }

        const targetFactionId = appliedEffects.find(e => e.faction_id)?.faction_id || null;
        await supabase.from('event_log').insert({
            event_id: event.id,
            nation_id: nation.id,
            event_name: event.name,
            faction_id: targetFactionId,
            description_used: description,
            effects_applied: appliedEffects,
            category: event.category,
            fired_at_tick: currentTick
        });

        firedEvents.push({
            eventName: event.name,
            category: event.category,
            description: description,
            effects: appliedEffects
        });

        console.log(`Event fired: "${event.name}" in ${nation.name} (tick ${currentTick})`);
    }

    return firedEvents;
}


// ==================== CRISIS TICK PROCESSOR ====================

/**
 * Process persistent crises for a nation.
 * - Activates crises when ALL trigger conditions are met
 * - Applies effects every tick while active
 * - Deactivates crises when ALL recovery conditions are met
 * - Effects cascade: nation stats, government/coalition approval, minister approval
 */
async function processCrises(supabase, nation, currentTick) {
    // 1. Load all active crisis templates
    const { data: crisisTemplates } = await supabase
        .from('crisis_templates')
        .select('*, crisis_triggers(*), crisis_effects(*), crisis_end_triggers(*)')
        .eq('is_active', true);

    if (!crisisTemplates || crisisTemplates.length === 0) return [];

    // 2. Load currently active crises for this nation
    const { data: activeCrisisRecords } = await supabase
        .from('active_crises')
        .select('*')
        .eq('nation_id', nation.id);

    const activeMap = {};
    for (const ac of (activeCrisisRecords || [])) {
        activeMap[ac.crisis_id] = ac;
    }

    const crisisEvents = [];
    const nationUpdates = {};
    const statBounds = {}; // { stat_key: { floor: highestFloor, ceiling: lowestCeiling } }

    // 3. Check inactive crises for activation
    for (const template of crisisTemplates) {
        if (activeMap[template.id]) continue; // already active

        const triggers = template.crisis_triggers || [];
        if (triggers.length === 0) continue;

        let allTriggersMet = true;
        for (const trigger of triggers) {
            const statValue = nation[trigger.stat_key];
            if (statValue === null || statValue === undefined) {
                allTriggersMet = false;
                break;
            }
            const val = Number(statValue);
            if (trigger.operator === 'gte' && val < Number(trigger.threshold)) {
                allTriggersMet = false;
                break;
            }
            if (trigger.operator === 'lte' && val > Number(trigger.threshold)) {
                allTriggersMet = false;
                break;
            }
        }

        if (!allTriggersMet) continue;

        // Activate the crisis
        const { data: newActive, error: insertErr } = await supabase
            .from('active_crises')
            .insert({
                crisis_id: template.id,
                nation_id: nation.id,
                started_at_tick: currentTick,
                effects_applied_log: []
            })
            .select()
            .single();

        if (insertErr) {
            console.warn('Crisis activation insert failed:', insertErr.message);
            continue;
        }

        activeMap[template.id] = newActive;

        // Log to event_log
        await supabase.from('event_log').insert({
            nation_id: nation.id,
            event_name: 'CRISIS_STARTED: ' + template.name,
            description_used: template.description || template.name,
            category: 'crisis',
            effects_applied: [],
            fired_at_tick: currentTick
        });

        crisisEvents.push({
            type: 'crisis_started',
            crisisName: template.name,
            description: template.description,
            tick: currentTick
        });

        console.log(`Crisis activated: "${template.name}" in ${nation.name} (tick ${currentTick})`);
    }

    // 4. Process active crises: apply effects first, then check end triggers
    //    (Applying effects before deactivation check prevents crisis flicker when
    //     a crisis's own effects push a stat to exactly the deactivation threshold.)
    for (const template of crisisTemplates) {
        const activeRecord = activeMap[template.id];
        if (!activeRecord) continue;

        // 4a. Idempotency guard: skip if effects already applied for this tick
        const priorLog = activeRecord.effects_applied_log || [];
        if (priorLog.some(entry => entry.tick === currentTick)) {
            console.log(`[processCrises] Skipping "${template.name}" for ${nation.name} — already applied at tick ${currentTick}`);
            continue;
        }

        // 4b. Apply effects every tick
        const effects = template.crisis_effects || [];
        const appliedEffects = [];

        for (const effect of effects) {
            const changePT = Number(effect.change_per_tick);
            if (!Number.isFinite(changePT)) {
                console.warn(`[processCrises] Skipping effect with non-numeric change_per_tick: "${effect.change_per_tick}" in crisis "${template.name}" for ${nation.name}`);
                continue;
            }
            const hasFloor = effect.stat_floor !== null && effect.stat_floor !== undefined;
            const floorVal = hasFloor ? Number(effect.stat_floor) : null;

            // Helper: clamp value respecting the per-effect floor/ceiling (for non-nation targets)
            // Round to 1dp to match processStatEffects and prevent floating-point drift.
            function clampWithFloor(current, raw) {
                if (isNaN(raw) || isNaN(current)) return current ?? 50;
                let v = Math.round(Math.max(0, Math.min(100, raw)) * 10) / 10;
                if (hasFloor) {
                    if (changePT < 0) v = Math.max(floorVal, v);   // floor
                    else if (changePT > 0) v = Math.min(floorVal, v); // ceiling
                }
                return v;
            }

            // Normalize + validate stat_key for nation targets
            const rawStatKey = effect.stat_key;
            const statKey = (effect.target === 'nation') ? normalizeNationStatKey(rawStatKey) : rawStatKey;
            if (effect.target === 'nation' && (!statKey || !NATION_STAT_COLUMN_SET.has(statKey))) {
                console.warn(`[processCrises] Skipping invalid stat_key "${rawStatKey}" in crisis "${template.name}" for ${nation.name}`);
                continue;
            }

            if (effect.target === 'nation') {
                const currentVal = nationUpdates[statKey] !== undefined
                    ? nationUpdates[statKey]
                    : (nation[statKey] !== undefined && nation[statKey] !== null
                        ? Number(nation[statKey]) : 50);

                // Basic 0-100 clamp + 1dp rounding; floor/ceiling enforcement deferred to final pass
                let newVal = Math.round(Math.max(0, Math.min(100, currentVal + changePT)) * 10) / 10;
                nationUpdates[statKey] = newVal;
                nation[statKey] = newVal;

                // Accumulate most-restrictive floor/ceiling bounds for final enforcement
                if (hasFloor) {
                    if (!statBounds[statKey]) statBounds[statKey] = {};
                    if (changePT < 0) {
                        const prev = statBounds[statKey].floor;
                        statBounds[statKey].floor = (prev !== undefined) ? Math.max(prev, floorVal) : floorVal;
                    } else if (changePT > 0) {
                        const prev = statBounds[statKey].ceiling;
                        statBounds[statKey].ceiling = (prev !== undefined) ? Math.min(prev, floorVal) : floorVal;
                    }
                }

                appliedEffects.push({
                    stat: statKey, change: changePT,
                    target: 'nation', old: currentVal, new: newVal
                });

            } else if (effect.target === 'government_approval' || effect.target === 'coalition_approval') {
                const coalition = await fetchActiveCoalition(supabase, nation.id);
                const partyIds = coalition?.party_ids || [];
                for (const partyId of partyIds) {
                    await adjustBlocApproval(supabase, partyId, changePT);
                    appliedEffects.push({
                        stat: 'approval_rating', change: changePT,
                        target: effect.target, faction_id: partyId
                    });
                }

            } else if (effect.target === 'pm_approval') {
                const { data: pmMinistry } = await supabase
                    .from('ministries')
                    .select('minister_approval, party_id')
                    .eq('nation_id', nation.id)
                    .eq('ministry_key', 'prime_minister')
                    .eq('is_active', true)
                    .maybeSingle();

                if (pmMinistry) {
                    const currentVal = pmMinistry.minister_approval ?? 50;
                    const newVal = clampWithFloor(currentVal, currentVal + changePT);
                    const { error: pmUpdErr } = await supabase.from('ministries')
                        .update({ minister_approval: newVal })
                        .eq('nation_id', nation.id)
                        .eq('ministry_key', 'prime_minister')
                        .eq('is_active', true);
                    if (pmUpdErr) console.error(`[processCrises] Failed to update PM approval for ${nation.name}:`, pmUpdErr.message);

                    appliedEffects.push({
                        stat: 'minister_approval', change: changePT,
                        target: 'pm_approval', minister_key: 'prime_minister',
                        old: currentVal, new: newVal
                    });

                    // Cascade PM approval loss to party approval (2x multiplier)
                    if (changePT < 0 && pmMinistry.party_id) {
                        const cascadeDelta = -(Math.abs(changePT) * 2);
                        await adjustBlocApproval(supabase, pmMinistry.party_id, cascadeDelta);

                        appliedEffects.push({
                            stat: 'approval_rating', change: cascadeDelta,
                            target: 'minister_cascade', faction_id: pmMinistry.party_id,
                            minister_key: 'prime_minister'
                        });
                    }
                }

            } else if (effect.target === 'minister_approval') {
                const { data: ministry } = await supabase
                    .from('ministries')
                    .select('minister_approval, party_id')
                    .eq('nation_id', nation.id)
                    .eq('ministry_key', effect.minister_key)
                    .eq('is_active', true)
                    .maybeSingle();

                if (ministry) {
                    const currentVal = ministry.minister_approval ?? 50;
                    const newVal = clampWithFloor(currentVal, currentVal + changePT);
                    const { error: minUpdErr } = await supabase.from('ministries')
                        .update({ minister_approval: newVal })
                        .eq('nation_id', nation.id)
                        .eq('ministry_key', effect.minister_key)
                        .eq('is_active', true);
                    if (minUpdErr) console.error(`[processCrises] Failed to update ${effect.minister_key} approval for ${nation.name}:`, minUpdErr.message);

                    appliedEffects.push({
                        stat: 'minister_approval', change: changePT,
                        target: 'minister_approval', minister_key: effect.minister_key,
                        old: currentVal, new: newVal
                    });

                    // Cascade minister approval loss to party approval (2x for PM, 1x for others)
                    if (changePT < 0 && ministry.party_id) {
                        const loss = Math.abs(changePT);
                        const multiplier = effect.minister_key === 'prime_minister' ? 2 : 1;
                        const cascadeDelta = -(loss * multiplier);
                        await adjustBlocApproval(supabase, ministry.party_id, cascadeDelta);

                        appliedEffects.push({
                            stat: 'approval_rating', change: cascadeDelta,
                            target: 'minister_cascade', faction_id: ministry.party_id,
                            minister_key: effect.minister_key
                        });
                    }
                }
            }
        }

        // Update effects log on the active crisis record
        const logEntry = { tick: currentTick, effects: appliedEffects };
        const existingLog = activeRecord.effects_applied_log || [];
        // Keep last 50 entries to prevent unbounded growth
        if (existingLog.length >= 50) existingLog.shift();
        existingLog.push(logEntry);
        await supabase.from('active_crises')
            .update({ effects_applied_log: existingLog })
            .eq('id', activeRecord.id);

        if (appliedEffects.length > 0) {
            crisisEvents.push({
                type: 'crisis_effects',
                crisisName: template.name,
                effects: appliedEffects,
                tick: currentTick
            });
        }

        // 4c. Check end / recovery triggers AFTER effects applied (prevents flicker)
        const endTriggers = template.crisis_end_triggers || [];
        let allEndConditionsMet = endTriggers.length > 0;

        for (const endTrigger of endTriggers) {
            const statValue = nation[endTrigger.stat_key];
            if (statValue === null || statValue === undefined) {
                allEndConditionsMet = false;
                break;
            }
            const val = Number(statValue);
            if (endTrigger.operator === 'gte' && val < Number(endTrigger.threshold)) {
                allEndConditionsMet = false;
                break;
            }
            if (endTrigger.operator === 'lte' && val > Number(endTrigger.threshold)) {
                allEndConditionsMet = false;
                break;
            }
        }

        if (allEndConditionsMet) {
            // Deactivate the crisis (effects already applied this final tick)
            await supabase.from('active_crises').delete().eq('id', activeRecord.id);
            delete activeMap[template.id];

            await supabase.from('event_log').insert({
                nation_id: nation.id,
                event_name: 'CRISIS_RESOLVED: ' + template.name,
                description_used: 'The crisis "' + template.name + '" has been resolved.',
                category: 'crisis',
                effects_applied: [],
                fired_at_tick: currentTick
            });

            crisisEvents.push({
                type: 'crisis_resolved',
                crisisName: template.name,
                duration: currentTick - activeRecord.started_at_tick,
                tick: currentTick
            });

            console.log(`Crisis resolved: "${template.name}" in ${nation.name} (tick ${currentTick}, duration: ${currentTick - activeRecord.started_at_tick} ticks)`);
        }
    }

    // 4d. Enforce most-restrictive floor/ceiling bounds across all crises
    for (const [stat, bounds] of Object.entries(statBounds)) {
        let val = nationUpdates[stat];
        if (val === undefined) continue;
        if (bounds.floor !== undefined) val = Math.max(bounds.floor, val);
        if (bounds.ceiling !== undefined) val = Math.min(bounds.ceiling, val);
        val = Math.round(val * 10) / 10;
        nationUpdates[stat] = val;
        nation[stat] = val;
    }

    // 5. Bulk update nation stats
    if (Object.keys(nationUpdates).length > 0) {
        await supabase.from('nations').update(nationUpdates).eq('id', nation.id);
    }

    return crisisEvents;
}


// ==================== DEMOCRATIC REVOLUTION ====================

/**
 * Process democratic revolution for autocracies.
 * Triggers when: stability < 15, freedom_index > 50, civil_unrest > 70 (Autocracy only).
 * Random 13-22 tick duration. Per-tick: stability -1, civil_unrest +1, intl_reputation -1.
 * Avertable if ANY trigger condition breaks. Fires regime change if duration expires.
 */
async function processRevolution(supabase, nation, currentTick) {
    // Only autocracies can have democratic revolutions
    if (nation.government_type !== 'Autocracy') {
        if (nation.revolution_started_tick != null) {
            await supabase.from('nations').update({ revolution_started_tick: null, revolution_duration: null }).eq('id', nation.id);
            nation.revolution_started_tick = null;
            nation.revolution_duration = null;
        }
        return null;
    }

    // Re-fetch nation to get post-effect stat values (processStatEffects etc. update DB but not in-memory)
    const { data: freshNation } = await supabase.from('nations').select('*').eq('id', nation.id).single();
    if (freshNation) Object.assign(nation, freshNation);

    // Check all trigger conditions
    const conditionsMet =
        Number(nation.stability) < 15 &&
        Number(nation.freedom_index) > 50 &&
        Number(nation.civil_unrest) > 70;

    const crisisActive = nation.revolution_started_tick != null;

    // Conditions NOT met — avert if active
    if (!conditionsMet) {
        if (crisisActive) {
            await supabase.from('nations').update({ revolution_started_tick: null, revolution_duration: null }).eq('id', nation.id);
            nation.revolution_started_tick = null;
            nation.revolution_duration = null;

            await supabase.from('event_log').insert({
                nation_id: nation.id,
                event_name: 'REVOLUTION_AVERTED',
                description_used: 'The revolutionary movement has lost momentum. The regime has stabilized — for now.',
                category: 'crisis',
                effects_applied: [],
                fired_at_tick: currentTick
            });
            console.log(`[Revolution] AVERTED for ${nation.name} at tick ${currentTick}`);
        }
        return null;
    }

    // --- Conditions ARE met ---

    // Apply per-tick effects (stability -1, civil_unrest +1, intl_reputation -1)
    const newStability = Math.max(0, Math.round((Number(nation.stability) - 1) * 10) / 10);
    const newUnrest = Math.min(100, Math.round((Number(nation.civil_unrest) + 1) * 10) / 10);
    const newReputation = Math.max(0, Math.round((Number(nation.international_reputation) - 1) * 10) / 10);

    await supabase.from('nations').update({
        stability: newStability,
        civil_unrest: newUnrest,
        international_reputation: newReputation
    }).eq('id', nation.id);
    Object.assign(nation, { stability: newStability, civil_unrest: newUnrest, international_reputation: newReputation });

    // START new crisis
    if (!crisisActive) {
        const duration = Math.floor(Math.random() * 10) + 13; // 13-22 ticks
        await supabase.from('nations').update({
            revolution_started_tick: currentTick,
            revolution_duration: duration
        }).eq('id', nation.id);
        nation.revolution_started_tick = currentTick;
        nation.revolution_duration = duration;

        await supabase.from('event_log').insert({
            nation_id: nation.id,
            event_name: 'REVOLUTION_WARNING',
            description_used: 'Pro-democracy demonstrations have erupted across multiple cities. Opposition groups are calling for free elections. The regime must act to restore order — or face revolution.',
            category: 'crisis',
            effects_applied: [
                { stat: 'stability', change: -1, target: 'nation' },
                { stat: 'civil_unrest', change: 1, target: 'nation' },
                { stat: 'international_reputation', change: -1, target: 'nation' }
            ],
            fired_at_tick: currentTick
        });
        console.log(`[Revolution] WARNING — crisis started for ${nation.name}, duration ${duration} ticks`);
        return { phase: 'warning', nation: nation.name, tick: currentTick, duration };
    }

    // ONGOING crisis — check if duration expired
    const ticksElapsed = currentTick - nation.revolution_started_tick;
    const duration = Number(nation.revolution_duration);

    if (ticksElapsed < duration) {
        // Not yet expired — log escalation
        const remaining = duration - ticksElapsed;
        await supabase.from('event_log').insert({
            nation_id: nation.id,
            event_name: 'REVOLUTION_ESCALATION',
            description_used: `The revolutionary movement grows stronger. General strikes have paralyzed the capital. International observers are calling for dialogue. ${remaining} tick${remaining !== 1 ? 's' : ''} remain before the regime falls.`,
            category: 'crisis',
            effects_applied: [
                { stat: 'stability', change: -1, target: 'nation' },
                { stat: 'civil_unrest', change: 1, target: 'nation' },
                { stat: 'international_reputation', change: -1, target: 'nation' }
            ],
            fired_at_tick: currentTick
        });
        console.log(`[Revolution] ESCALATION — ${nation.name}, ${remaining} ticks remaining`);
        return { phase: 'escalation', nation: nation.name, tick: currentTick, remaining };
    }

    // === REVOLUTION FIRES ===
    console.log(`[Revolution] REVOLUTION FIRES for ${nation.name} at tick ${currentTick}`);

    // 1. Pick new government type randomly
    const newGovType = Math.random() < 0.5 ? 'Democracy' : 'Presidential';
    const govLabel = newGovType === 'Presidential' ? 'Presidential Democracy' : 'Parliamentary Democracy';

    // 2. Close current administration and dissolve government/ministries
    try {
        const { data: shardData } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
        await closeAdministration(supabase, nation.id, nation, 'revolution', currentTick, shardData?.current_date || '', null);
    } catch (err) {
        console.warn('[Revolution] Could not close administration:', err);
    }
    try {
        await dissolveCoalition(supabase, nation.id);
    } catch (err) {
        console.warn('[Revolution] Could not dissolve coalition:', err);
    }

    // 3. Update nation stats
    const newFreedomIndex = Math.min(100, Math.round((Number(nation.freedom_index) + 15) * 10) / 10);
    const newIntlRep = Math.min(100, Math.round((Number(nation.international_reputation) + 5) * 10) / 10);
    const nationUpdates = {
        government_type: newGovType,
        ruling_faction_id: null,
        stability: 30,
        freedom_index: newFreedomIndex,
        civil_unrest: 40,
        international_reputation: newIntlRep,
        revolution_started_tick: null,
        revolution_duration: null
    };
    await supabase.from('nations').update(nationUpdates).eq('id', nation.id);
    Object.assign(nation, nationUpdates);

    // 3b. Clear all active crises — revolution resets the political landscape
    await supabase.from('active_crises').delete().eq('nation_id', nation.id);

    // 4. Reset all faction bloc approvals to 50
    const { data: allFactions } = await supabase
        .from('factions')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');

    if (allFactions && allFactions.length > 0) {
        for (const faction of allFactions) {
            await supabase.from('faction_bloc_approval')
                .update({ approval: 50 })
                .eq('faction_id', faction.id);
            await recalcDerivedApproval(supabase, faction.id);
        }
    }

    // 4b. Reset all faction loyalty to 50
    await supabase.from('factions')
        .update({ loyalty: 50 })
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');

    // 5. Flag factions for rebuild
    await supabase.from('factions')
        .update({ needs_rebuild: true })
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');

    // 5b. Freeze all active bills — government has fallen
    await supabase.from('bills')
        .update({ status: 'frozen' })
        .eq('nation_id', nation.id)
        .in('status', ['committee', 'floor']);

    // 6. Schedule emergency election in 3 ticks
    await supabase.from('elections').delete()
        .eq('nation_id', nation.id).eq('status', 'scheduled');

    const electionType = newGovType === 'Presidential' ? 'presidential' : 'parliamentary';
    const { error: electionErr } = await supabase.from('elections').insert({
        nation_id: nation.id,
        election_tick: currentTick + 3,
        status: 'scheduled',
        election_type: electionType
    });
    if (electionErr) {
        console.error('[Revolution] Election insert failed, retrying:', electionErr);
        await supabase.from('elections').insert({
            nation_id: nation.id,
            election_tick: currentTick + 3,
            status: 'scheduled',
            election_type: electionType
        });
    }

    // 7. Log the revolution event
    await supabase.from('event_log').insert({
        nation_id: nation.id,
        event_name: 'DEMOCRATIC_REVOLUTION',
        description_used: `The people have risen. The autocratic regime has fallen. A ${govLabel} has been established — emergency elections will determine the first freely elected government.`,
        category: 'crisis',
        effects_applied: [
            { stat: 'government_type', change: `Autocracy → ${govLabel}`, target: 'nation' },
            { stat: 'stability', change: '→ 30', target: 'nation' },
            { stat: 'freedom_index', change: '+15', target: 'nation' },
            { stat: 'civil_unrest', change: '→ 40', target: 'nation' },
            { stat: 'international_reputation', change: '+5', target: 'nation' }
        ],
        fired_at_tick: currentTick
    });

    console.log(`[Revolution] COMPLETE — ${nation.name} is now a ${govLabel}. Emergency ${electionType} election at tick ${currentTick + 3}`);
    return { phase: 'revolution', nation: nation.name, tick: currentTick, newGovType: govLabel, electionTick: currentTick + 3 };
}


// ==================== MINISTRY INBOX EVENTS ====================

/**
 * Process ministry inbox events from templates.
 * For each nation:
 *  - Loads active ministry_event_templates
 *  - Filters by government type and active ministries
 *  - Checks cooldowns against previously fired inbox events
 *  - Evaluates weight conditions against nation stats
 *  - Rolls probability (boosted when weight conditions are met)
 *  - Creates ministry_events rows with randomly selected variants
 *  - Also expires overdue active ministry events
 */
async function processMinistryInboxEvents(supabase, nation, currentTick) {
    const firedEvents = [];
    const dbg = (msg) => console.log(`[MinistryEvents][${nation.name}][tick ${currentTick}] ${msg}`);

    // --- 1. Expire overdue active ministry events ---
    const { data: overdueEvents } = await supabase
        .from('ministry_events')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('status', 'active')
        .lt('expires_at_tick', currentTick);

    if (overdueEvents && overdueEvents.length > 0) {
        const overdueIds = overdueEvents.map(e => e.id);
        await supabase.from('ministry_events')
            .update({ status: 'expired' })
            .in('id', overdueIds);
    }

    // --- 2. Load all active templates ---
    const { data: templates, error: templateError } = await supabase
        .from('ministry_event_templates')
        .select('*')
        .eq('is_active', true);

    if (templateError) {
        dbg(`BLOCKED: failed to load ministry_event_templates: ${templateError.message}`);
        return firedEvents;
    }

    if (!templates || templates.length === 0) {
        dbg('BLOCKED: No active ministry_event_templates found in DB.');
        return firedEvents;
    }
    dbg(`Loaded ${templates.length} active template(s): [${templates.map(t => t.event_key).join(', ')}]`);

    // --- 3. Filter by government type ---
    const govType = nation.government_type || 'Democracy';
    const eligible = templates.filter(t => (t.gov_types || []).includes(govType));
    if (eligible.length === 0) {
        dbg(`BLOCKED: 0/${templates.length} templates match gov_type "${govType}". Template gov_types: ${templates.map(t => `${t.event_key}=${JSON.stringify(t.gov_types)}`).join(', ')}`);
        return firedEvents;
    }
    dbg(`${eligible.length}/${templates.length} template(s) match gov_type "${govType}": [${eligible.map(t => t.event_key).join(', ')}]`);

    // --- 4. Load active ministries for this nation ---
    const { data: ministries } = await supabase
        .from('ministries')
        .select('ministry_key, party_id')
        .eq('nation_id', nation.id)
        .eq('is_active', true);

    if (!ministries || ministries.length === 0) {
        dbg('BLOCKED: No active ministries found for this nation.');
        return firedEvents;
    }
    dbg(`Active ministries: [${ministries.map(m => `${m.ministry_key}(party=${m.party_id})`).join(', ')}]`);

    // For Presidential nations with pending-confirmation ministers, party_id may be null.
    // Fall back to the PM/President's faction so events can still fire.
    let fallbackFactionId = null;
    if (govType === 'Presidential') {
        const { data: president } = await supabase
            .from('presidents')
            .select('party_id')
            .eq('nation_id', nation.id)
            .eq('is_active', true)
            .maybeSingle();
        fallbackFactionId = president?.party_id || null;
    }

    const ministryMap = {};
    for (const m of ministries) {
        ministryMap[m.ministry_key] = m.party_id || fallbackFactionId;
    }
    dbg(`Ministry map: ${JSON.stringify(ministryMap)}`);

    // --- 5. Check cooldowns: find last fired tick for each template ---
    const templateIds = eligible.map(t => t.id);
    const { data: recentEvents } = await supabase
        .from('ministry_events')
        .select('template_id, created_at_tick')
        .eq('nation_id', nation.id)
        .in('template_id', templateIds)
        .order('created_at_tick', { ascending: false });

    const lastFiredMap = {};
    for (const entry of (recentEvents || [])) {
        if (entry.template_id && !lastFiredMap[entry.template_id]) {
            lastFiredMap[entry.template_id] = entry.created_at_tick;
        }
    }

    // --- 6. Also check how many active (unresolved) events already exist per ministry ---
    const { data: activeEvents } = await supabase
        .from('ministry_events')
        .select('ministry_key')
        .eq('nation_id', nation.id)
        .eq('status', 'active');

    const activeCountByMinistry = {};
    for (const ae of (activeEvents || [])) {
        activeCountByMinistry[ae.ministry_key] = (activeCountByMinistry[ae.ministry_key] || 0) + 1;
    }

    // --- 7. Process each eligible template ---
    dbg(`Processing ${eligible.length} eligible template(s)…`);
    for (const tmpl of eligible) {
        const tKey = tmpl.event_key;

        // Skip if this ministry doesn't exist or isn't staffed
        const controllingFactionId = ministryMap[tmpl.ministry_key];
        if (!controllingFactionId) {
            dbg(`  [${tKey}] SKIP: ministry "${tmpl.ministry_key}" not in ministryMap or has null faction. Map keys: [${Object.keys(ministryMap).join(', ')}]`);
            continue;
        }

        // Skip if ministry already has 3+ active events (prevent inbox flood)
        const activeCount = activeCountByMinistry[tmpl.ministry_key] || 0;
        if (activeCount >= 3) {
            dbg(`  [${tKey}] SKIP: ministry "${tmpl.ministry_key}" already has ${activeCount} active events (max 3).`);
            continue;
        }

        // Check cooldown
        const lastFired = lastFiredMap[tmpl.id];
        if (lastFired !== undefined) {
            const ticksSince = currentTick - lastFired;
            if (ticksSince < (tmpl.cooldown_ticks || 6)) {
                dbg(`  [${tKey}] SKIP: cooldown — last fired tick ${lastFired}, ${ticksSince} ticks ago, need ${tmpl.cooldown_ticks || 6}.`);
                continue;
            }
        }

        // --- 8. Evaluate weight conditions ---
        const variants = tmpl.variants || {};
        const weightConditions = variants.weight_conditions || [];

        // Fall back to old flat columns if no array conditions
        if (weightConditions.length === 0 && tmpl.weight_stat) {
            weightConditions.push({
                stat: tmpl.weight_stat,
                op: tmpl.weight_operator || '>',
                value: tmpl.weight_value
            });
        }

        let allConditionsMet = true;
        if (weightConditions.length > 0) {
            for (const cond of weightConditions) {
                const statVal = nation[cond.stat];
                if (statVal === null || statVal === undefined) {
                    dbg(`  [${tKey}] Weight cond: nation.${cond.stat} is ${statVal} (missing!) — condition FAILED`);
                    allConditionsMet = false;
                    break;
                }
                const val = Number(statVal);
                const threshold = Number(cond.value);
                const passed = (cond.op === '>' && val > threshold) ||
                               (cond.op === '<' && val < threshold) ||
                               (cond.op === '>=' && val >= threshold) ||
                               (cond.op === '<=' && val <= threshold);
                dbg(`  [${tKey}] Weight cond: nation.${cond.stat}=${val} ${cond.op} ${threshold} → ${passed ? 'PASS' : 'FAIL'}`);
                if (!passed) { allConditionsMet = false; break; }
            }
        }

        // --- 9. Probability roll ---
        // Base chance: 25% per tick if conditions met, 5% if not
        // (Events with no conditions always use base 25%)
        let fireProbability;
        if (weightConditions.length === 0) {
            fireProbability = 25;
        } else if (allConditionsMet) {
            fireProbability = 40;
        } else {
            fireProbability = 5;
        }

        const roll = Math.random() * 100;
        dbg(`  [${tKey}] Probability: ${fireProbability}% (conditions=${weightConditions.length}, met=${allConditionsMet}), roll=${roll.toFixed(1)} → ${roll < fireProbability ? 'FIRE!' : 'SKIP (bad roll)'}`);
        if (roll >= fireProbability) continue;

        // --- 10. Pick random variants ---
        const titles = variants.titles || [tmpl.title];
        const chosenTitle = titles[Math.floor(Math.random() * titles.length)] || tmpl.title;

        const govVariant = variants[govType] || {};
        const bodies = govVariant.bodies || [];
        const chosenBody = bodies.length > 0
            ? bodies[Math.floor(Math.random() * bodies.length)]
            : '';

        const options = govVariant.options || [];

        // --- 11. Insert into ministry_events ---
        const expiresAtTick = currentTick + (tmpl.deadline_ticks || 3);

        const { error } = await supabase.from('ministry_events').insert({
            nation_id: nation.id,
            ministry_key: tmpl.ministry_key,
            controlling_faction_id: controllingFactionId,
            template_id: tmpl.id,
            event_key: tmpl.event_key,
            title: chosenTitle,
            sender: tmpl.sender || 'Ministry Office',
            body: chosenBody,
            priority: tmpl.priority || 'routine',
            status: 'active',
            created_at_tick: currentTick,
            expires_at_tick: expiresAtTick,
            options: options,
            chosen_option: null,
            resolved_effects: null,
            resolved_at_tick: null
        });

        if (error) {
            dbg(`  [${tKey}] ERROR inserting ministry_event: ${error.message}`);
        } else {
            // Update active count to prevent flooding within same tick
            activeCountByMinistry[tmpl.ministry_key] = (activeCountByMinistry[tmpl.ministry_key] || 0) + 1;

            firedEvents.push({
                templateKey: tmpl.event_key,
                title: chosenTitle,
                ministry: tmpl.ministry_key,
                conditionsMet: allConditionsMet
            });

            dbg(`  [${tKey}] ✓ FIRED: "${chosenTitle}" → ${tmpl.ministry_key}`);
        }
    }

    dbg(`Done. Fired ${firedEvents.length} event(s) this tick.`);
    return firedEvents;
}


// ==================== INACTIVITY CLOCK ====================

async function markFactionActive(supabase, factionId, currentTick) {
    if (!factionId) return;
    if (!currentTick) {
        const { data: shard } = await supabase
            .from('shard').select('current_tick').eq('name', 'Alpha Shard').single();
        currentTick = shard?.current_tick || 0;
    }
    await supabase.from('factions')
        .update({ last_ap_spent_tick: currentTick })
        .eq('id', factionId);
}


// ==================== UTILITY FORMATTERS ====================

function formatStatName(stat) {
    return stat.charAt(0).toUpperCase() + stat.slice(1).replace(/_/g, ' ');
}

function formatMinorSector(key) {
    return key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}


// ==================== PM CANDIDATE SYSTEM ====================

const PM_FIRST_NAMES = [
    'Alejandro', 'Camila', 'Diego', 'Valentina', 'Mateo', 'Isabela', 'Sebastián', 'Luca',
    'Andrés', 'Gabriel', 'Joaquín', 'Mariana', 'Carlos', 'Tomas', 'Rafael', 'Edwin',
    'Emilio', 'Catalina', 'Fernando', 'Renata'
];

const PM_LAST_NAMES = [
    'Velasco', 'Mendoza', 'Guerrero', 'Salazar', 'Castillo', 'Herrera', 'Morales', 'Ríos',
    'Delgado', 'Espinoza', 'Guzmán', 'Navarro', 'Córdoba', 'Echeverría', 'Pacheco', 'Montero',
    'Aguilar', 'Valenzuela', 'Carrasco', 'Ibarra'
];

const IDEOLOGY_OPTIONS = [
    { tag: 'LIBERTY',         axisKey: 'liberty_equality',             direction: -1 },
    { tag: 'EQUALITY',        axisKey: 'liberty_equality',             direction: 1 },
    { tag: 'TRADITION',       axisKey: 'tradition_progress',           direction: -1 },
    { tag: 'PROGRESS',        axisKey: 'tradition_progress',           direction: 1 },
    { tag: 'SECURITY',        axisKey: 'security_freedom',             direction: -1 },
    { tag: 'FREEDOM',         axisKey: 'security_freedom',             direction: 1 },
    { tag: 'NATIONALISM',     axisKey: 'globalism_nationalism',        direction: -1 },
    { tag: 'GLOBALISM',       axisKey: 'globalism_nationalism',        direction: 1 },
    { tag: 'INDIVIDUALISM',   axisKey: 'individualism_collectivism',   direction: -1 },
    { tag: 'COLLECTIVISM',    axisKey: 'individualism_collectivism',   direction: 1 }
];

const PM_TRAIT_KEYS = [
    'dealmaker', 'showman', 'ideologue', 'economist', 'reformer',
    'iron_will', 'popular_champion', 'militarist', 'diplomat',
    'media_darling', 'hardliner', 'technocrat', 'survivor', 'firebrand'
];

async function generatePMCandidates(supabase, nationId, factionId, currentTick) {
    const factionIdeology = await loadFactionIdeology(supabase, factionId);

    await supabase
        .from('pm_candidates')
        .delete()
        .eq('nation_id', nationId)
        .eq('faction_id', factionId)
        .eq('selected', false);

    const weightedIdeologies = getWeightedIdeologies(factionIdeology);

    const chosenIdeologies = [];
    const availableIdeologies = [...weightedIdeologies];
    for (let i = 0; i < 3; i++) {
        const pick = weightedRandomPick(availableIdeologies);
        chosenIdeologies.push(pick.item);
        const sameAxis = availableIdeologies.filter(
            wi => wi.item.axisKey === pick.item.axisKey
        );
        sameAxis.forEach(sa => {
            const idx = availableIdeologies.indexOf(sa);
            if (idx >= 0) availableIdeologies.splice(idx, 1);
        });
    }

    const shuffledTraits = [...PM_TRAIT_KEYS].sort(() => Math.random() - 0.5);
    const chosenTraits = shuffledTraits.slice(0, 3);

    const usedFirstNames = new Set();
    const usedLastNames = new Set();
    const candidates = [];

    for (let i = 0; i < 3; i++) {
        let firstName, lastName;

        do { firstName = PM_FIRST_NAMES[Math.floor(Math.random() * PM_FIRST_NAMES.length)]; }
        while (usedFirstNames.has(firstName));
        usedFirstNames.add(firstName);

        do { lastName = PM_LAST_NAMES[Math.floor(Math.random() * PM_LAST_NAMES.length)]; }
        while (usedLastNames.has(lastName));
        usedLastNames.add(lastName);

        const age = 35 + Math.floor(Math.random() * 16);
        const ideology = chosenIdeologies[i];

        candidates.push({
            nation_id: nationId,
            faction_id: factionId,
            first_name: firstName,
            last_name: lastName,
            age: age,
            ideology: ideology.tag,
            ideology_axis: ideology.axisKey,
            ideology_direction: ideology.direction,
            trait_key: chosenTraits[i],
            created_at_tick: currentTick,
            selected: false
        });
    }

    const { data, error } = await supabase
        .from('pm_candidates')
        .insert(candidates)
        .select();

    if (error) {
        console.error('Error generating PM candidates:', error);
        throw error;
    }

    console.log(`Generated 3 PM candidates for faction ${factionId}`);
    return data;
}

function getWeightedIdeologies(factionIdeology) {
    if (!factionIdeology) {
        return IDEOLOGY_OPTIONS.map(opt => ({ item: opt, weight: 10 }));
    }

    return IDEOLOGY_OPTIONS.map(opt => {
        const score = factionIdeology[opt.axisKey] || 0;
        const alignment = score * opt.direction;

        let weight;
        if (alignment > 40) {
            weight = 2;
        } else if (alignment > 15) {
            weight = 5;
        } else if (alignment > -15) {
            weight = 12;
        } else if (alignment > -40) {
            weight = 10;
        } else {
            weight = 8;
        }

        return { item: opt, weight };
    });
}

function weightedRandomPick(weightedItems) {
    const totalWeight = weightedItems.reduce((sum, wi) => sum + wi.weight, 0);
    let random = Math.random() * totalWeight;

    for (const wi of weightedItems) {
        random -= wi.weight;
        if (random <= 0) return wi;
    }
    return weightedItems[weightedItems.length - 1];
}

async function selectPMCandidate(supabase, candidateId, nationId, factionId, currentTick) {
    const { data: candidate, error: fetchErr } = await supabase
        .from('pm_candidates')
        .select('*')
        .eq('id', candidateId)
        .single();

    if (fetchErr || !candidate) throw new Error('Candidate not found');
    if (candidate.faction_id !== factionId) throw new Error('Not your candidate');

    await supabase
        .from('pm_candidates')
        .update({ selected: true })
        .eq('id', candidateId);

    await supabase
        .from('pm_candidates')
        .delete()
        .eq('nation_id', nationId)
        .eq('faction_id', factionId)
        .eq('selected', false);

    await supabase
        .from('head_of_government')
        .update({ active: false })
        .eq('nation_id', nationId)
        .eq('active', true);

    const { error: hogErr } = await supabase
        .from('head_of_government')
        .upsert({
            nation_id: nationId,
            faction_id: factionId,
            candidate_id: candidateId,
            first_name: candidate.first_name,
            last_name: candidate.last_name,
            age: candidate.age,
            ideology: candidate.ideology,
            trait_key: candidate.trait_key,
            appointed_tick: currentTick,
            active: true
        }, { onConflict: 'nation_id' });

    if (hogErr) throw hogErr;

    // Update the open administration record with the newly appointed PM
    const pmFullName = `${candidate.first_name} ${candidate.last_name}`;
    const { error: adminUpdErr } = await supabase
        .from('administrations')
        .update({
            prime_minister: pmFullName,
            admin_name: `${candidate.last_name} Administration`,
            updated_at: new Date().toISOString()
        })
        .eq('nation_id', nationId)
        .is('ended_at_tick', null);
    if (adminUpdErr) console.warn('selectPMCandidate: could not update administration record:', adminUpdErr);

    // Update the prime_minister ministry row so ministry-actions picks it up
    const { data: pmMinistry } = await supabase.from('ministries')
        .select('id').eq('nation_id', nationId)
        .eq('ministry_key', 'prime_minister').eq('is_active', true)
        .maybeSingle();

    if (pmMinistry) {
        await supabase.from('ministries').update({
            party_id: factionId,
            minister_first_name: candidate.first_name,
            minister_last_name: candidate.last_name,
            minister_age: candidate.age,
            minister_approval: 50
        }).eq('id', pmMinistry.id);
    } else {
        await supabase.from('ministries').insert({
            nation_id: nationId,
            ministry_key: 'prime_minister',
            ministry_name: 'Prime Minister',
            is_active: true,
            party_id: factionId,
            minister_first_name: candidate.first_name,
            minister_last_name: candidate.last_name,
            minister_age: candidate.age,
            minister_approval: 50
        });
    }

    const axisKey = candidate.ideology_axis;
    const shift = 15 * candidate.ideology_direction;

    let factionIdeology = await loadFactionIdeology(supabase, factionId);
    if (!factionIdeology) {
        const newRow = { faction_id: factionId, liberty_equality: 0, tradition_progress: 0, security_freedom: 0, globalism_nationalism: 0, individualism_collectivism: 0 };
        await supabase.from('faction_ideology').upsert(newRow, { onConflict: 'faction_id' });
        factionIdeology = newRow;
        console.warn(`Created missing faction_ideology row for faction ${factionId}`);
    }
    const currentVal = factionIdeology[axisKey] || 0;
    const newVal = Math.max(-100, Math.min(100, currentVal + shift));

    await supabase
        .from('faction_ideology')
        .update({ [axisKey]: newVal })
        .eq('faction_id', factionId);

    console.log(`Ideology shift: ${axisKey} ${currentVal} → ${newVal} (${shift > 0 ? '+' : ''}${shift})`);


    const { data: trait } = await supabase
        .from('leader_traits')
        .select('*')
        .eq('trait_key', candidate.trait_key)
        .single();

    if (trait?.effects) {
        const effects = trait.effects;

        if (effects.on_appoint_stability) {
            const { data: nation } = await supabase
                .from('nations')
                .select('stability')
                .eq('id', nationId)
                .single();

            if (nation) {
                const newStability = Math.max(0, Math.min(100, (nation.stability || 50) + effects.on_appoint_stability));
                await supabase
                    .from('nations')
                    .update({ stability: newStability })
                    .eq('id', nationId);

                console.log(`On-appoint stability: +${effects.on_appoint_stability} → ${newStability}`);
            }
        }

    }

    console.log(`PM selected: ${candidate.first_name} ${candidate.last_name} (${candidate.trait_key})`);
    return candidate;
}

async function processPMTraitEffects(supabase, nation, currentTick) {
    let effects, factionId;

    if (nation.government_type === 'Presidential') {
        // For presidential systems, use the active president's trait
        const { data: president } = await supabase
            .from('presidents')
            .select('faction_id, trait')
            .eq('nation_id', nation.id)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();

        if (!president?.trait) return;

        const { data: traitData } = await supabase
            .from('leader_traits')
            .select('effects')
            .eq('trait_key', president.trait)
            .single();

        if (!traitData?.effects) return;
        effects = traitData.effects;
        factionId = president.faction_id;
    } else {
        const { data: hog } = await supabase
            .from('head_of_government')
            .select('*, leader_traits(*)')
            .eq('nation_id', nation.id)
            .eq('active', true)
            .single();

        if (!hog || !hog.leader_traits?.effects) return;
        effects = hog.leader_traits.effects;
        factionId = hog.faction_id;
    }

    if (effects.party_approval_per_tick) {
        await adjustBlocApproval(supabase, factionId, effects.party_approval_per_tick);
    }

    if (effects.nation_stat_per_tick) {
        const updates = {};
        for (const [rawStat, delta] of Object.entries(effects.nation_stat_per_tick)) {
            const stat = normalizeNationStatKey(rawStat);
            if (!stat || !NATION_STAT_COLUMN_SET.has(stat)) {
                console.warn(`[processPMTraitEffects] Skipping invalid stat_key "${rawStat}" in PM trait for ${nation.name}`);
                continue;
            }
            const currentVal = nation[stat];
            if (currentVal !== undefined && currentVal !== null) {
                updates[stat] = Math.round(Math.max(0, Math.min(100, currentVal + delta)) * 10) / 10;
            }
        }
        if (Object.keys(updates).length > 0) {
            await supabase.from('nations').update(updates).eq('id', nation.id);
        }
    }

    if (effects.approval_below_50_bonus || effects.approval_above_60_penalty) {
        const { data: faction } = await supabase
            .from('factions')
            .select('approval_rating')
            .eq('id', factionId)
            .single();

        if (faction) {
            let delta = 0;
            if (faction.approval_rating < 50 && effects.approval_below_50_bonus) {
                delta = effects.approval_below_50_bonus;
            } else if (faction.approval_rating > 60 && effects.approval_above_60_penalty) {
                delta = effects.approval_above_60_penalty;
            }
            if (delta !== 0) {
                await adjustBlocApproval(supabase, factionId, delta);
            }
        }
    }

    if (effects.opposition_approval_per_tick) {
        const { data: oppParties } = await supabase
            .from('factions')
            .select('id')
            .eq('nation_id', nation.id)
            .eq('faction_type', 'party')
            .neq('id', factionId);

        for (const opp of (oppParties || [])) {
            await adjustBlocApproval(supabase, opp.id, effects.opposition_approval_per_tick);
        }
    }

    if (effects.no_bill_penalty_per_tick) {
        const { count } = await supabase
            .from('bills')
            .select('*', { count: 'exact', head: true })
            .eq('nation_id', nation.id)
            .eq('proposed_by', factionId)
            .eq('status', 'passed')
            .eq('passed_tick', currentTick - 1);

        if (!count || count === 0) {
            await adjustBlocApproval(supabase, factionId, effects.no_bill_penalty_per_tick);
        }
    }
}


// ==================== RESIGN PM ====================

async function resignPM(supabase, nationId, factionId, currentTick) {
    const { data: hog } = await supabase
        .from('head_of_government')
        .select('*')
        .eq('nation_id', nationId)
        .eq('faction_id', factionId)
        .eq('active', true)
        .single();

    if (!hog) throw new Error('No active PM to resign');

    if (hog.trait_key === 'survivor') {
        throw new Error('A Survivor cannot resign. They cling to power.');
    }

    await supabase
        .from('head_of_government')
        .update({ active: false })
        .eq('id', hog.id);

    await adjustBlocApproval(supabase, factionId, -5);

    const { data: nation } = await supabase
        .from('nations')
        .select('stability')
        .eq('id', nationId)
        .single();

    if (nation) {
        const newStability = Math.max(0, (nation.stability ?? 50) - 3);
        await supabase
            .from('nations')
            .update({ stability: newStability })
            .eq('id', nationId);
    }

    await supabase
        .from('factions')
        .update({ pm_cooldown_until: currentTick + 12 })
        .eq('id', factionId);

    if (hog.trait_key === 'iron_will') {
        console.log('Iron Will resignation — coalition collapses');
        try {
            const { data: fullNation } = await supabase.from('nations').select('*').eq('id', nationId).single();
            const { data: shard } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
            if (fullNation) {
                await closeAdministration(supabase, nationId, fullNation, 'coalition_collapse', currentTick, shard?.current_date || '', null);
            }
        } catch (adminErr) { console.warn('Could not close administration on iron_will collapse:', adminErr); }
        await dissolveCoalition(supabase, nationId);
        return { result: 'coalition_collapsed', reason: 'iron_will' };
    }

    const { data: govFormation } = await supabase
        .from('government_formations')
        .select('party_ids')
        .eq('nation_id', nationId)
        .eq('status', 'formed')
        .single();

    if (govFormation) {
        const partnerIds = (govFormation.party_ids || [])
            .filter(pid => pid !== factionId);

        const { data: partners } = await supabase
            .from('factions')
            .select('id, faction_name, seats, pm_cooldown_until')
            .in('id', partnerIds)
            .order('seats', { ascending: false });

        const eligible = (partners || []).find(p =>
            !p.pm_cooldown_until || p.pm_cooldown_until <= currentTick
        );

        if (eligible) {
            await generatePMCandidates(supabase, nationId, eligible.id, currentTick);
            console.log(`PM offered to ${eligible.faction_name}`);
            return {
                result: 'pm_offered',
                newPmPartyId: eligible.id,
                newPmPartyName: eligible.faction_name
            };
        }
    }

    console.log('No eligible partner — coalition collapsed');
    try {
        const { data: fullNation } = await supabase.from('nations').select('*').eq('id', nationId).single();
        const { data: shard } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
        if (fullNation) {
            await closeAdministration(supabase, nationId, fullNation, 'coalition_collapse', currentTick, shard?.current_date || '', null);
        }
    } catch (adminErr) { console.warn('Could not close administration on coalition collapse:', adminErr); }
    await dissolveCoalition(supabase, nationId);
    return { result: 'coalition_collapsed', reason: 'no_eligible_partner' };
}


// ==================== DISBAND PARTY ====================

async function disbandParty(supabase, nationId, factionId, currentTick) {
    // 1. Cooldown check
    const { data: faction } = await supabase
        .from('factions')
        .select('disband_cooldown_until_tick, faction_name')
        .eq('id', factionId)
        .single();

    if (faction?.disband_cooldown_until_tick && faction.disband_cooldown_until_tick > currentTick) {
        const remaining = faction.disband_cooldown_until_tick - currentTick;
        throw new Error(`Disband is on cooldown for ${remaining} more tick${remaining !== 1 ? 's' : ''}.`);
    }

    // 2. Autocracy ruling faction guard
    const { data: nation } = await supabase
        .from('nations')
        .select('ruling_faction_id, government_type')
        .eq('id', nationId)
        .single();

    if (nation?.government_type === 'Autocracy' && nation.ruling_faction_id === factionId) {
        throw new Error('The ruling faction cannot disband.');
    }

    // 3. PM check — if this faction is the active PM, resign first
    const { data: hog } = await supabase
        .from('head_of_government')
        .select('id, trait_key')
        .eq('nation_id', nationId)
        .eq('faction_id', factionId)
        .eq('active', true)
        .maybeSingle();

    let pmResigned = false;
    if (hog) {
        if (hog.trait_key === 'survivor') {
            throw new Error('Cannot disband while your PM has the Survivor trait. They cling to power.');
        }
        await resignPM(supabase, nationId, factionId, currentTick);
        pmResigned = true;
    }

    // 4. Coalition check — handle if in coalition but not PM (or PM resignation didn't dissolve)
    if (!pmResigned) {
        const { data: formations } = await supabase
            .from('government_formations')
            .select('id, lead_party_id, party_ids')
            .eq('nation_id', nationId)
            .in('status', ['formed', 'caretaker']);

        const myFormation = (formations || []).find(f =>
            (f.party_ids || []).includes(factionId)
        );

        if (myFormation) {
            if (myFormation.lead_party_id === factionId) {
                // Lead party disbanding — dissolve entire coalition
                await dissolveCoalition(supabase, nationId);
            } else {
                // Junior partner — remove from party_ids and vacate ministries
                const newPartyIds = (myFormation.party_ids || []).filter(id => id !== factionId);
                const { error: formErr } = await supabase
                    .from('government_formations')
                    .update({ party_ids: newPartyIds })
                    .eq('id', myFormation.id);
                if (formErr) console.warn('disbandParty: could not update formation party_ids:', formErr);

                const { error: minErr } = await supabase
                    .from('ministries')
                    .update({ party_id: null, minister_first_name: null, minister_last_name: null, minister_age: null })
                    .eq('nation_id', nationId)
                    .eq('party_id', factionId)
                    .eq('is_active', true);
                if (minErr) console.warn('disbandParty: could not vacate ministries:', minErr);
            }
        }
    }

    // 5. Core disband — null out nation membership, set cooldown
    const { error: disbandErr } = await supabase
        .from('factions')
        .update({
            nation_id: null,
            abandoned_at: new Date().toISOString(),
            disband_cooldown_until_tick: currentTick + 24
        })
        .eq('id', factionId);

    if (disbandErr) throw new Error('Failed to disband party: ' + disbandErr.message);

    // 6. Audit log
    const { error: logErr } = await supabase
        .from('campaign_actions')
        .insert({
            party_id: factionId,
            nation_id: nationId,
            action_type: 'party_disbanded',
            tick_performed: currentTick,
            result: { faction_name: faction?.faction_name || 'Unknown' }
        });
    if (logErr) console.warn('disbandParty: could not log action:', logErr);

    return { result: 'disbanded' };
}


// ==================== ELECTION SIMULATION ====================

/**
 * Get a party's alignment score toward a specific ideology tag.
 *
 * @param {object} partyAxes  - Row from faction_ideology (keys: liberty_equality, tradition_progress, etc.)
 * @param {string} tag        - Ideology tag (e.g. "PROGRESS", "Liberty") — case-insensitive
 * @returns {number} Alignment value: positive = supports, negative = opposes
 */
function getPartyAlignment(partyAxes, tag) {
    const info = IDEOLOGY_TO_AXIS[tag.toUpperCase()];
    if (!info) return 0;
    const axisValue = partyAxes[info.axisKey] ?? 0;
    return axisValue * info.direction;
}

// findEligibleParties removed — replaced by weighted competition model
// where ALL parties compete simultaneously for each bloc's voters.

/**
 * Distribute a voter bloc's votes among ALL parties using the Weighted Competition Model.
 *
 * weight = bloc_approval × ideology_multiplier
 * ideology_multiplier = clamp(1.0 + avg_alignment × 0.02, 0.2, 2.0)
 *
 * No cascade steps. No leakage. All parties compete simultaneously.
 *
 * @param {object[]} parties           - All parties with axes
 * @param {string[]} tags              - Bloc ideology tags (may be empty for Unaligned)
 * @param {number}   blocCount         - Voters in this bloc
 * @param {object}   tally             - Mutable { [partyId]: voteCount } accumulator
 * @param {object}   [blocApprovals]   - { partyId: approval } per-bloc approval map
 * @param {object}   [ideologySaturation] - { tag: partyCount } saturation data
 * @param {number}   [avgSaturation]   - Average saturation across active tags
 * @returns {number} Number of abstentions produced
 */
function distributeVotes(parties, tags, blocCount, tally, blocApprovals, ideologySaturation, avgSaturation) {
    if (blocCount <= 0) return 0;

    const IDEOLOGY_RATE = 0.02;
    const MULT_MIN = 0.2;
    const MULT_MAX = 2.0;

    // Helper: get per-bloc approval for a party (default 40)
    const getApproval = (partyId) => (blocApprovals && blocApprovals[partyId] != null) ? blocApprovals[partyId] : 40;

    const upperTags = tags.map(t => t.toUpperCase());

    // ---- Abstention ----
    let abstainRate = upperTags.length === 0 ? 0.35 : 0.22;

    // Ideology Saturation modifier
    if (upperTags.length > 0 && ideologySaturation && avgSaturation > 0) {
        const blocSaturation = upperTags.reduce((s, t) => s + (ideologySaturation[t] || 0), 0) / upperTags.length;
        const SATURATION_RATE = 0.04;
        const SATURATION_CAP  = 0.12;
        let satMod = (blocSaturation - avgSaturation) * SATURATION_RATE;
        satMod = Math.max(-SATURATION_CAP, Math.min(SATURATION_CAP, satMod));
        abstainRate = Math.max(0.05, Math.min(0.85, abstainRate + satMod));
    }

    const abstentions = Math.floor(blocCount * abstainRate);
    const voters = blocCount - abstentions;
    if (voters <= 0) return blocCount;

    // ---- Calculate weights for ALL parties ----
    const weights = [];
    let totalWeight = 0;

    for (const party of parties) {
        const approval = getApproval(party.id);
        let multiplier = 1.0;

        if (upperTags.length > 0) {
            // Average alignment across bloc tags
            const alignSum = upperTags.reduce((s, t) => s + getPartyAlignment(party.axes, t), 0);
            const alignAvg = alignSum / upperTags.length;
            multiplier = Math.max(MULT_MIN, Math.min(MULT_MAX, 1.0 + alignAvg * IDEOLOGY_RATE));
        }

        const w = Math.max(0, approval * multiplier);
        weights.push({ id: party.id, weight: w });
        totalWeight += w;
    }

    // Edge case: all weights are 0 — distribute evenly
    if (totalWeight === 0) {
        const evenShare = Math.floor(voters / parties.length);
        for (const party of parties) {
            tally[party.id] = (tally[party.id] || 0) + evenShare;
        }
        const rem = voters - evenShare * parties.length;
        if (rem > 0) {
            tally[parties[0].id] = (tally[parties[0].id] || 0) + rem;
        }
        return abstentions;
    }

    // ---- Distribute proportionally with Largest Remainder ----
    let allocated = 0;
    const partyVotes = [];
    for (const { id, weight } of weights) {
        const exact = (voters * weight) / totalWeight;
        const floored = Math.floor(exact);
        tally[id] = (tally[id] || 0) + floored;
        allocated += floored;
        partyVotes.push({ id, fractional: exact - floored });
    }

    const remainder = voters - allocated;
    partyVotes.sort((a, b) => b.fractional - a.fractional);
    for (let i = 0; i < remainder; i++) {
        tally[partyVotes[i].id] = (tally[partyVotes[i].id] || 0) + 1;
    }

    return abstentions;
}

/**
 * Allocate parliamentary seats from vote totals using
 * Largest Remainder / Hare Quota method.
 *
 * @param {object} voteTotals  - { partyId: totalVotes, ... }
 * @param {number} totalSeats  - Seats to allocate (default 120)
 * @returns {object} { partyId: seats, ... }
 */
function allocateSeatsByVotes(voteTotals, totalSeats = GAME_CONFIG.TOTAL_SEATS) {
    const totalVotes = Object.values(voteTotals).reduce((s, v) => s + v, 0);
    if (totalVotes === 0) {
        const seats = {};
        for (const id of Object.keys(voteTotals)) seats[id] = 0;
        return seats;
    }

    const quota = totalVotes / totalSeats;
    const seats = {};
    const fractionals = [];
    let allocatedSeats = 0;

    for (const [id, votes] of Object.entries(voteTotals)) {
        if (votes === 0) { seats[id] = 0; continue; }
        const raw = votes / quota;
        const guaranteed = Math.floor(raw);
        seats[id] = guaranteed;
        allocatedSeats += guaranteed;
        fractionals.push({ id, fractional: raw - guaranteed });
    }

    const remaining = totalSeats - allocatedSeats;
    fractionals.sort((a, b) => b.fractional - a.fractional);
    for (let i = 0; i < remaining; i++) {
        seats[fractionals[i].id] = (seats[fractionals[i].id] || 0) + 1;
    }

    return seats;
}

/**
 * Run a full election simulation using the Weighted Competition Model.
 *
 * All parties compete simultaneously for each bloc's voters:
 *   weight = bloc_approval × ideology_multiplier
 *   ideology_multiplier = clamp(1.0 + avg_alignment × 0.02, 0.2, 2.0)
 *
 * @param {object[]} blocs    - Rows from voter_blocs: { id, bloc_name, voter_count, ideology_1..5, is_active }
 * @param {object[]} parties  - Array of { id, faction_name, axes: { liberty_equality, ... } }
 * @param {number}   [totalSeats=120]
 * @param {object}   [allBlocApprovals] - { blocId: { partyId: approval } } from faction_bloc_approval
 * @returns {{ votes: object, seats: object, totalAbstentions: number, totalVotesCast: number, details: object[] }}
 */
function runElectionSimulation(blocs, parties, totalSeats = GAME_CONFIG.TOTAL_SEATS, allBlocApprovals = null) {
    const tally = {};
    for (const p of parties) tally[p.id] = 0;

    let totalAbstentions = 0;
    const details = [];

    // ---- Ideology Saturation: penalise over-served ideologies with higher abstention ----
    const ALL_IDEOLOGY_TAGS = ['LIBERTY','EQUALITY','TRADITION','PROGRESS','SECURITY','FREEDOM',
                               'GLOBALISM','NATIONALISM','INDIVIDUALISM','COLLECTIVISM'];
    const ideologySaturation = {};
    for (const tag of ALL_IDEOLOGY_TAGS) {
        ideologySaturation[tag] = parties.filter(p => getPartyAlignment(p.axes, tag) > 0).length;
    }
    const activeSatTags = ALL_IDEOLOGY_TAGS.filter(t => ideologySaturation[t] > 0);
    const avgSaturation = activeSatTags.length > 0
        ? activeSatTags.reduce((s, t) => s + ideologySaturation[t], 0) / activeSatTags.length
        : 1;

    for (const bloc of blocs) {
        if (!bloc.is_active) continue;
        const count = bloc.voter_count || 0;
        if (count === 0) continue;

        // Collect ideology tags from the bloc
        const tags = [bloc.ideology_1, bloc.ideology_2, bloc.ideology_3, bloc.ideology_4, bloc.ideology_5]
            .filter(t => t && t !== 'Unaligned');

        // Per-bloc approval map for this specific bloc
        const blocApprovals = allBlocApprovals ? allBlocApprovals[bloc.id] || null : null;

        // Snapshot tally before distribution to compute per-bloc party votes
        const snapshot = {};
        for (const p of parties) snapshot[p.id] = tally[p.id];

        // All parties compete simultaneously — no cascade
        const abstentions = distributeVotes(parties, tags, count, tally, blocApprovals, ideologySaturation, avgSaturation);

        // Compute per-party votes from this bloc
        const blocVotes = {};
        const partyVotes = [];
        for (const p of parties) {
            const gained = tally[p.id] - snapshot[p.id];
            if (gained > 0) blocVotes[p.id] = gained;
            partyVotes.push({
                party_id: p.id,
                party_name: p.faction_name,
                votes: Math.max(0, gained)
            });
        }

        totalAbstentions += abstentions;
        details.push({
            bloc_id: bloc.id,
            bloc_name: bloc.bloc_name,
            voter_count: count,
            tags,
            abstentions,
            party_votes: partyVotes,
            blocVotes
        });
    }

    const totalVotesCast = Object.values(tally).reduce((s, v) => s + v, 0);
    const seats = allocateSeatsByVotes(tally, totalSeats);

    return { votes: tally, seats, totalAbstentions, totalVotesCast, details };
}

/**
 * High-level helper: load all data from Supabase and run the election preview.
 *
 * @param {object} supabase   - Supabase client
 * @param {string} nationId   - Nation UUID
 * @returns {Promise<object>} Full election result with party names, votes, seats, turnout
 */
async function runElectionPreview(supabase, nationId) {
    // 1. Load nation
    const { data: nation } = await supabase
        .from('nations')
        .select('id, name, total_seats, eligible_voters')
        .eq('id', nationId)
        .single();
    if (!nation) throw new Error('Nation not found');

    const totalSeats = nation.total_seats || 120;

    // 2. Load voter blocs
    const { data: blocs } = await supabase
        .from('voter_blocs')
        .select('*')
        .eq('nation_id', nationId)
        .eq('is_active', true);
    if (!blocs || blocs.length === 0) throw new Error('No voter blocs found for this nation');

    // 2b. Scale bloc voter_counts so total matches eligible_voters (blocs are generated from population)
    const eligibleVoters = nation.eligible_voters || 0;
    const totalBlocVoters = blocs.reduce((s, b) => s + (b.voter_count || 0), 0);
    if (totalBlocVoters > 0 && eligibleVoters > 0) {
        const scale = eligibleVoters / totalBlocVoters;
        let scaledSum = 0;
        for (const b of blocs) {
            b.voter_count = Math.round((b.voter_count || 0) * scale);
            scaledSum += b.voter_count;
        }
        // Fix rounding drift on the largest bloc
        const diff = eligibleVoters - scaledSum;
        if (diff !== 0) {
            const largest = blocs.reduce((a, b) => (b.voter_count > a.voter_count ? b : a), blocs[0]);
            largest.voter_count += diff;
        }
    }

    // 3. Load parties + their ideology axes
    const { data: factions } = await supabase
        .from('factions')
        .select('id, faction_name, seats')
        .eq('nation_id', nationId)
        .eq('faction_type', 'party');
    if (!factions || factions.length === 0) throw new Error('No parties found for this nation');

    const factionIds = factions.map(f => f.id);
    const { data: ideologies } = await supabase
        .from('faction_ideology')
        .select('*')
        .in('faction_id', factionIds);

    const ideoMap = {};
    for (const row of (ideologies || [])) ideoMap[row.faction_id] = row;

    // Build party objects with axes (no approval_rating or ideology_modifiers needed)
    const parties = factions.map(f => ({
        id: f.id,
        faction_name: f.faction_name,
        axes: ideoMap[f.id] || {
            liberty_equality: 0, tradition_progress: 0, security_freedom: 0,
            globalism_nationalism: 0, individualism_collectivism: 0
        }
    }));

    // 3b. Load per-bloc approval data from faction_bloc_approval
    const { data: fbaRows } = await supabase
        .from('faction_bloc_approval')
        .select('faction_id, bloc_id, approval')
        .in('faction_id', factionIds);

    // Build allBlocApprovals map: { blocId: { partyId: approval } }
    const allBlocApprovals = {};
    for (const row of (fbaRows || [])) {
        if (!allBlocApprovals[row.bloc_id]) allBlocApprovals[row.bloc_id] = {};
        allBlocApprovals[row.bloc_id][row.faction_id] = row.approval;
    }

    // 4. Run simulation with per-bloc approvals
    const result = runElectionSimulation(blocs, parties, totalSeats, allBlocApprovals);

    // 5. Build friendly results with weighted average approval per party
    const totalBlocWeight = blocs.reduce((s, b) => s + (b.voter_count || 0), 0);
    const partyResults = parties.map(p => {
        let weightedApproval = 40;
        if (totalBlocWeight > 0) {
            let wSum = 0;
            for (const bloc of blocs) {
                const ba = allBlocApprovals[bloc.id];
                const approval = (ba && ba[p.id] != null) ? ba[p.id] : 40;
                wSum += approval * (bloc.voter_count || 0);
            }
            weightedApproval = Math.round(wSum / totalBlocWeight * 100) / 100;
        }
        return {
            party_id: p.id,
            party_name: p.faction_name,
            approval: weightedApproval,
            votes: result.votes[p.id] || 0,
            vote_percentage: result.totalVotesCast > 0
                ? Math.round(((result.votes[p.id] || 0) / result.totalVotesCast) * 10000) / 100
                : 0,
            seats: result.seats[p.id] || 0
        };
    }).sort((a, b) => b.seats - a.seats);

    // Build party name lookup for UI
    const partyNames = {};
    for (const p of parties) partyNames[p.id] = p.faction_name;

    return {
        nation: nation.name,
        total_seats: totalSeats,
        eligible_voters: nation.eligible_voters || 0,
        total_votes_cast: result.totalVotesCast,
        total_abstentions: result.totalAbstentions,
        turnout_pct: nation.eligible_voters
            ? Math.round((result.totalVotesCast / nation.eligible_voters) * 10000) / 100
            : 0,
        results: partyResults,
        bloc_details: result.details,
        partyNames
    };
}
