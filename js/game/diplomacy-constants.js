/**
 * diplomacy-constants.js — Diplomacy constants, policy stances, and scaling divisors
 * Extracted from game-common.js
 */

// ==================== DIPLOMACY CONSTANTS ====================

export const DIPLOMACY_CONFIG = {
    // Ambassador actions
    FORMAL_PROTEST_AP: 2,
    PROPOSE_INITIATIVE_AP: 2,
    COVERT_OP_AP: 4,

    // Foreign Minister actions
    RECALL_AMBASSADOR_AP: 1,
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
    STATE_VISIT_AP: 4,
    STATE_VISIT_ACCEPT_WINDOW: 3,
    STATE_VISIT_COOLDOWN: 30,
    STATE_VISIT_REP_BOOST: 3,
    STATE_VISIT_STABILITY_BOOST: 2,
    STATE_VISIT_RELATION_BOOST: 7,
    STATE_VISIT_TRADE_BONUS: 5,         // +5 trade_balance if active trade agreement
    STATE_VISIT_IO_REP_BONUS: 3,        // +3 int'l rep if shared IO membership (future)
    STATE_VISIT_HIGH_REL_GDP_BONUS: 5,  // +5 gdp_growth if relations > 70
    STATE_VISIT_FIRST_STABILITY: 1,     // +1 stability for first-ever visit
    STATE_VISIT_AUTOCRACY_DIE: 12,      // 1D12 roll for autocracy risk
    STATE_VISIT_AUTOCRACY_THRESHOLD: 6, // roll <= threshold = negative outcome
    STATE_VISIT_AUTOCRACY_CHANGE: 3,    // ±gov_approval change
    STATE_VISIT_AUTOCRACY_REGIME_DIE: 10, // 1D10 regime_health loss when autocracy visits
    TREATY_RATIFICATION_VOTING_TICKS: 6,
    AMBASSADOR_CONFIRMATION_VOTING_TICKS: 6,
    AMBASSADOR_TERM_LENGTH: 60,         // ticks (60 ticks = 5 years)
    AMBASSADOR_RETIREMENT_WARNING: 3,   // warn this many ticks before retirement

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
    COVERT_BRIBE_THRESHOLD: 0.60,

    // Trade negotiation AP costs
    PROPOSE_TRADE_NEGOTIATION_AP: 2,      // MoT, FM, or Ambassador proposes trade negotiations
    ACCEPT_TRADE_NEGOTIATION_AP: 1,       // Other side's MoT, FM, Ambassador, or HoG accepts
    JOIN_NEGOTIATION_PM_AP: 2,            // PM/HoG/President joins negotiation
    JOIN_NEGOTIATION_FM_AP: 1,            // FM joins negotiation
    JOIN_NEGOTIATION_MOT_AP: 2,           // Minister of Trade joins
    HOG_DRAFT_INITIATIVE_AP: 3,           // HoG drafting when no MoT/FM/Ambassador (penalty)
    MOT_JOIN_DEADLINE_TICKS: 4,           // Ticks before negotiations cancel if MoT hasn't joined

    // Trade negotiation timing
    NEGOTIATION_DEFAULT_DURATION: 4,      // ticks until negotiation expires
    NEGOTIATION_EXTENSION_TICKS: 12,      // ticks added per extension (1 month)
    NEGOTIATION_MAX_EXTENSIONS: 3,        // max times negotiations can be extended
    TRADE_RATIFICATION_VOTING_TICKS: 6,   // ticks for parliament to vote on trade bill

    // Credit requirements for trade agreements (proposing nation must meet these)
    CREDIT_MIN_FOR_FTA: 25,               // FTA requires credit >= 25
    CREDIT_MIN_FOR_RSC: 15,               // RSC requires credit >= 15
    CREDIT_MIN_FOR_PTA: 10,               // PTA requires credit >= 10
    CREDIT_MIN_FOR_AID_DONOR: 20,         // Donating aid requires credit >= 20 (receiving always ok)

    // Economic Aid
    AID_MAX_GDP_PCT: 25,                  // max annual aid as % of donor's GDP
    AID_MIN_AMOUNT: 1000000000,           // min $1B annual aid (to prevent trivial agreements)
    AID_DURATION_MIN_TICKS: 12,           // min 1 year
    AID_DURATION_MAX_TICKS: 120,          // max 10 years
    AID_MAX_CONDITIONS: 5,                // max condition articles per agreement
    AID_ANNUAL_REVIEW_INTERVAL: 12,       // check conditions every 12 ticks (1 year)
    AID_RELATION_BONUS: 8                 // relation boost when aid agreement is ratified
};

/**
 * Check if a nation's credit rating allows proposing a specific trade agreement type.
 * Returns { allowed: true } or { allowed: false, required: number, reason: string }.
 */
export function checkCreditForTradeAgreement(nationCredit, agreementType, isAidDonor) {
    var credit = Number(nationCredit ?? 50);
    var thresholds = {
        fta: DIPLOMACY_CONFIG.CREDIT_MIN_FOR_FTA,
        pta: DIPLOMACY_CONFIG.CREDIT_MIN_FOR_PTA,
        resource_supply: DIPLOMACY_CONFIG.CREDIT_MIN_FOR_RSC,
        economic_aid: isAidDonor ? DIPLOMACY_CONFIG.CREDIT_MIN_FOR_AID_DONOR : 0
    };
    var required = thresholds[agreementType];
    if (required === undefined) return { allowed: true };
    if (credit >= required) return { allowed: true };
    return {
        allowed: false,
        required: required,
        current: credit,
        reason: 'Credit rating too low (' + credit + '/' + required + '). Other nations won\'t negotiate this deal with a nation that can\'t pay its bills.'
    };
}

/**
 * Curated list of nation stats that can be used as conditions in Economic Aid agreements.
 * Grouped by category for the UI. default_operator indicates the "natural" direction
 * (gte = stat should be high, lte = stat should be low).
 */
export const AID_CONDITION_STATS = [
    // Governance
    { key: 'corruption', label: 'Corruption', default_operator: 'lte', category: 'Governance' },
    { key: 'press_freedom', label: 'Press Freedom', default_operator: 'gte', category: 'Governance' },
    { key: 'freedom_index', label: 'Freedom Index', default_operator: 'gte', category: 'Governance' },
    { key: 'judicial_independence', label: 'Judicial Independence', default_operator: 'gte', category: 'Governance' },
    { key: 'efficiency', label: 'Bureaucratic Efficiency', default_operator: 'gte', category: 'Governance' },
    // Economic
    { key: 'inflation', label: 'Inflation', default_operator: 'lte', category: 'Economic' },
    { key: 'tariffs', label: 'Tariff Rate', default_operator: 'lte', category: 'Economic' },
    { key: 'unemployment', label: 'Unemployment', default_operator: 'lte', category: 'Economic' },
    { key: 'poverty_rate', label: 'Poverty Rate', default_operator: 'lte', category: 'Economic' },
    { key: 'income_inequality', label: 'Income Inequality', default_operator: 'lte', category: 'Economic' },
    // Social
    { key: 'literacy', label: 'Literacy', default_operator: 'gte', category: 'Social' },
    { key: 'healthcare_accessibility', label: 'Healthcare Access', default_operator: 'gte', category: 'Social' },
    { key: 'education_accessibility', label: 'Education Access', default_operator: 'gte', category: 'Social' },
    { key: 'standard_of_living', label: 'Standard of Living', default_operator: 'gte', category: 'Social' },
    { key: 'happiness', label: 'Happiness', default_operator: 'gte', category: 'Social' },
    // Environmental
    { key: 'renewable_energy_percentage', label: 'Renewable Energy %', default_operator: 'gte', category: 'Environmental' },
    { key: 'pollution', label: 'Pollution', default_operator: 'lte', category: 'Environmental' },
    { key: 'carbon_emissions', label: 'Carbon Emissions', default_operator: 'lte', category: 'Environmental' },
    // Security
    { key: 'stability', label: 'Stability', default_operator: 'gte', category: 'Security' },
    { key: 'civil_unrest', label: 'Civil Unrest', default_operator: 'lte', category: 'Security' },
    { key: 'terrorism', label: 'Terrorism', default_operator: 'lte', category: 'Security' },
    // International
    { key: 'international_reputation', label: 'International Reputation', default_operator: 'gte', category: 'International' }
];

/**
 * Trade Agreement types that can be negotiated as Diplomatic Initiatives.
 *
 * 6 types:
 *   FTA  — Free Trade Agreement: comprehensive tariff elimination
 *   PTA  — Preferential Tariff Agreement: sector-specific tariff reduction
 *   RSC  — Resource Supply Contract: guaranteed purchase commitment
 *   ES   — Export Subsidy: unilateral, no partner needed
 *   AID  — Economic Aid Agreement: financial assistance with optional conditions
 *   RT   — Retaliatory Tariff: unilateral surcharge on specific nation/sectors
 */
export const TRADE_AGREEMENT_TYPES = {
    fta: {
        key: 'fta',
        label: 'Free Trade Agreement',
        shortLabel: 'FTA',
        description: 'Comprehensive tariff elimination between two nations. Removes all tariffs across all sectors unless specific exemptions are carved out.',
        bilateral: true,
        required_articles: ['duration'],
        optional_articles: ['sector_exemption', 'text_article'],
        icon: 'handshake'
    },
    pta: {
        key: 'pta',
        label: 'Preferential Tariff Agreement',
        shortLabel: 'PTA',
        description: 'Sector-specific tariff reduction. Each side can negotiate different reductions for different sectors and directions.',
        bilateral: true,
        required_articles: ['tariff_reduction', 'duration'],
        optional_articles: ['text_article'],
        icon: 'chart'
    },
    resource_supply: {
        key: 'resource_supply',
        label: 'Resource Supply Contract',
        shortLabel: 'RSC',
        description: 'Guaranteed purchase commitment for raw resources. The buyer commits to purchasing a minimum percentage from the seller.',
        bilateral: true,
        required_articles: ['supply_commitment', 'price_terms', 'duration'],
        optional_articles: ['breach_penalty', 'text_article'],
        icon: 'truck'
    },
    export_subsidy: {
        key: 'export_subsidy',
        label: 'Export Subsidy',
        shortLabel: 'ES',
        description: 'Unilateral policy — subsidize your own exporters to make goods cheaper on the international market. No partner nation needed.',
        bilateral: false,
        required_articles: ['subsidized_sector', 'duration', 'funding_source'],
        optional_articles: ['text_article'],
        icon: 'money'
    },
    economic_aid: {
        key: 'economic_aid',
        label: 'Economic Aid Agreement',
        shortLabel: 'AID',
        description: 'Financial assistance from one nation to another. The donor commits annual funding that appears as revenue in the recipient\'s budget. Optional conditions can require the recipient to maintain governance, economic, or social benchmarks.',
        bilateral: true,
        required_articles: ['aid_terms', 'duration'],
        optional_articles: ['aid_condition', 'text_article'],
        icon: 'aid',
        requires_mot: false  // FM/PM/Ambassador negotiate — no Minister of Trade needed
    },
    retaliatory_tariff: {
        key: 'retaliatory_tariff',
        label: 'Retaliatory Tariff',
        shortLabel: 'RT',
        description: 'Unilateral tariff surcharge on imports from a specific nation. Pick one or more sectors and set a surcharge rate. Damages diplomatic relations.',
        bilateral: false,
        unilateral_action: true,
        required_articles: ['tariff_surcharge', 'duration'],
        optional_articles: ['text_article'],
        icon: 'shield',
        category: 'unilateral'
    }
};

/**
 * The 6 tradeable sectors for trade agreements.
 * Subset of the full 8 TRADE_SECTORS (excludes tourism and services_finance).
 */
export const TRADEABLE_SECTORS = [
    { key: 'fuel_energy',        label: 'Fuel & Energy',            raw_resource: true  },
    { key: 'minerals',           label: 'Minerals & Raw Materials', raw_resource: true  },
    { key: 'food_agriculture',   label: 'Food & Agriculture',       raw_resource: true  },
    { key: 'manufactured_goods', label: 'Manufactured Goods',       raw_resource: false },
    { key: 'technology',         label: 'Technology & Electronics', raw_resource: false },
    { key: 'arms',               label: 'Arms & Military Equipment', raw_resource: false }
];

// Lookup map for tradeable sectors
export var TRADEABLE_SECTOR_MAP = {};
for (var _tasi = 0; _tasi < TRADEABLE_SECTORS.length; _tasi++) {
    TRADEABLE_SECTOR_MAP[TRADEABLE_SECTORS[_tasi].key] = TRADEABLE_SECTORS[_tasi];
}

/**
 * Article type definitions for trade agreements.
 * Each defines the schema of what data the article captures.
 */
export const TRADE_ARTICLE_TYPES = {
    // ── Duration (required for all types) ──
    duration: {
        key: 'duration',
        label: 'Duration',
        description: 'How long the agreement lasts.',
        repeatable: false,
        schema: {
            duration_type: 'permanent|fixed',   // permanent or fixed term
            duration_ticks: 'number',           // min 8, max 48 for FTA/PTA; min 8, max 36 for RSC; min 4, max 24 for ES
            auto_renew: 'boolean',              // only for fixed term
            withdrawal_notice_ticks: 'number'   // 1-6 ticks notice to withdraw
        }
    },

    // ── Sector Exemption (FTA only, optional) ──
    sector_exemption: {
        key: 'sector_exemption',
        label: 'Sector Exemption',
        description: 'Exempt specific sectors from the FTA.',
        repeatable: true,
        applies_to: ['fta'],
        schema: {
            sector: 'string',                   // tradeable sector key
            reason: 'string'                    // optional flavor text
        }
    },

    // ── Tariff Reduction (PTA, required, repeatable per sector) ──
    tariff_reduction: {
        key: 'tariff_reduction',
        label: 'Tariff Reduction',
        description: 'Reduce tariffs on a specific sector.',
        repeatable: true,
        applies_to: ['pta'],
        schema: {
            sector: 'string',                   // tradeable sector key
            direction: 'mutual|your_exports|their_exports',
            reduction_pct: 'number'             // 0-100 (100 = full elimination)
        }
    },

    // ── Supply Commitment (RSC, required) ──
    supply_commitment: {
        key: 'supply_commitment',
        label: 'Supply Commitment',
        description: 'Guaranteed purchase commitment for a raw resource.',
        repeatable: false,
        applies_to: ['resource_supply'],
        schema: {
            sector: 'string',                   // must be raw_resource sector
            direction: 'we_buy|we_sell',        // who is buyer vs seller
            commitment_pct: 'number'            // 10-90%
        }
    },

    // ── Price Terms (RSC, required) ──
    price_terms: {
        key: 'price_terms',
        label: 'Price Terms',
        description: 'How the resource price is determined.',
        repeatable: false,
        applies_to: ['resource_supply'],
        schema: {
            price_type: 'market|fixed|discounted|premium',
            modifier_pct: 'number'              // discount/premium percentage (0-25)
        }
    },

    // ── Breach Penalty (RSC, optional) ──
    breach_penalty: {
        key: 'breach_penalty',
        label: 'Breach Penalty',
        description: 'Penalties if either party breaks the contract early.',
        repeatable: false,
        applies_to: ['resource_supply'],
        schema: {
            relations_penalty: 'number',        // 1-8
            reputation_penalty: 'number',       // 0-4
            financial_penalty: 'number'         // 0-500 (in millions)
        }
    },

    // ── Subsidized Sector (Export Subsidy, required) ──
    subsidized_sector: {
        key: 'subsidized_sector',
        label: 'Export Subsidy',
        description: 'Subsidize exports in a specific sector.',
        repeatable: false,
        applies_to: ['export_subsidy'],
        schema: {
            sector: 'string',                   // any tradeable sector
            subsidy_pct: 'number'               // 5-30%
        }
    },

    // ── Funding Source (Export Subsidy, required) ──
    funding_source: {
        key: 'funding_source',
        label: 'Funding Source',
        description: 'Where the subsidy money comes from.',
        repeatable: false,
        applies_to: ['export_subsidy'],
        schema: {
            source: 'general_treasury|ministry_budget'
        }
    },

    // ── Aid Terms (Economic Aid, required) ──
    aid_terms: {
        key: 'aid_terms',
        label: 'Aid Terms',
        description: 'The core financial terms: who gives, who receives, how much.',
        repeatable: false,
        applies_to: ['economic_aid'],
        schema: {
            donor_nation_id: 'uuid',            // which nation is giving the aid
            annual_amount: 'number',             // annual aid in raw dollars (e.g. 25e9 = $25B)
            gdp_cap_pct: 'number'               // max % of donor GDP (1-25), re-evaluated yearly
        }
    },

    // ── Aid Condition (Economic Aid, optional, repeatable) ──
    aid_condition: {
        key: 'aid_condition',
        label: 'Condition',
        description: 'A stat-based condition the recipient must maintain for aid to continue.',
        repeatable: true,
        applies_to: ['economic_aid'],
        schema: {
            stat_key: 'string',                 // any nation stat key from NATION_STAT_COLUMNS
            operator: 'gte|lte',                // ≥ threshold or ≤ threshold
            threshold: 'number',                // 0-100 stat value
            on_failure: 'suspend|terminate|reduce',  // consequence when condition fails at annual review
            grace_periods: 'number'             // 0-2: how many annual reviews can fail before enforcement
        }
    },

    // ── Tariff Surcharge (Retaliatory Tariff, required, repeatable per sector) ──
    tariff_surcharge: {
        key: 'tariff_surcharge',
        label: 'Tariff Surcharge',
        description: 'Impose an additional tariff on imports from the target nation in a specific sector.',
        repeatable: true,
        applies_to: ['retaliatory_tariff'],
        schema: {
            sector: 'string',                   // tradeable sector key
            surcharge_pct: 'number'             // 5-50%
        }
    },

    // ── Text Article (optional for all types) ──
    text_article: {
        key: 'text_article',
        label: 'Text Article',
        description: 'Free-text article for flavor/RP. No mechanical effect.',
        repeatable: true,
        applies_to: ['fta', 'pta', 'resource_supply', 'export_subsidy', 'economic_aid', 'retaliatory_tariff'],
        schema: {
            title: 'string',
            body: 'string'
        }
    }
};

/**
 * Diplomatic proposal types with tier classification.
 * Tier 1 = Minor (ambassador approves directly)
 * Tier 2 = FM approval needed (no bill)
 * Tier 3 = Requires Parliament ratification bill
 */
export const PROPOSAL_TYPES = {
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
            { stat_key: 'international_reputation', direction: 'down', rate: 3, delay_ticks: 0, duration_ticks: 0 }
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
export const WAR_JUSTIFICATIONS = {
    ultimatum_ignored:    { label: 'Ignored Ultimatum',     description: 'A formal ultimatum was ignored by the target nation.' },
    caught_spy:           { label: 'Caught Spy',            description: 'A covert agent from the target nation was caught operating in your territory.' },
    broken_treaty:        { label: 'Broken Treaty',         description: 'The target nation violated an existing treaty or agreement.' },
    attacked:             { label: 'Attacked',              description: 'Your nation was attacked by the target nation.' },
    alliance_obligation:  { label: 'Alliance Obligation',   description: 'An allied nation was attacked, triggering mutual defense obligations.' }
};

export const MAJOR_SECTORS = [
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
export const POLICY_STANCES = {
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

// Stats where LOWER is better (inverted approval logic)
export const INVERTED_STATS = [
    'unemployment', 'poverty_rate', 'income_inequality',
    'pollution', 'carbon_emissions', 'crime_rate', 'incarceration_rate',
    'drug_use', 'corruption', 'polarization', 'civil_unrest', 'terrorism',
    'political_violence', 'emigration', 'debt', 'debt_growth',
    'inflation', 'interest_rates', 'illegal_immigration', 'fuel_prices',
    'cost_of_living'
];

// Stats stored as raw numbers (not 0-100 indices).
// GDP and debt are stored as raw dollars (88B = 88,000,000,000).
// All other stats (0-100 indices) use the default divisor of 50.
export const RAW_SCALING_DIVISORS = {
    population: 1_000_000,
    eligible_voters: 1_000_000,
    gdp: 1_000_000_000,
    debt: 1_000_000_000
};

// Stats that must NEVER be modified by generic tick processors (processStatEffects,
// processMinistryActions, processEvents, processCrises, processStatConnections).
// GDP is driven exclusively by gdp_growth via applyGdpGrowth.
// Debt is driven exclusively by the budget system (surplus/deficit).
// Any policy/event/crisis/connection targeting these keys will be silently skipped.
export const STAT_PROCESSOR_SKIP = new Set(['gdp', 'debt']);

// ==================== MINOR DIPLOMATIC INITIATIVE ====================

/**
 * Minor Diplomatic Initiative — Tier 1 negotiated diplomatic action.
 * Bundled articles proposed by an Ambassador to a target nation.
 * Accepted directly by target's Ambassador, FM, or HoG (no parliamentary ratification).
 */
export const MINOR_INITIATIVE_CONFIG = {
    AP_COST: 2,
    TIER: 1,
    TYPE: 'minor_diplomatic_initiative',
    BUDGET_SOURCE: 'embassies',              // institution id in budget_item_allocations
    HOSTILE_RELATION_THRESHOLD: -50,         // cannot propose below this
    MAX_VISA_AGREEMENTS_PER_INITIATIVE: 1,   // only one visa agreement per initiative
};

/**
 * Duration scaling multipliers for visa agreements.
 */
export const VISA_DURATION_OPTIONS = [
    { key: 30,  label: '30 Days',  modifier: 0.6 },
    { key: 90,  label: '90 Days',  modifier: 1.0 },
    { key: 180, label: '180 Days', modifier: 1.3 }
];

/**
 * Scope scaling multipliers for visa agreements.
 */
export const VISA_SCOPE_OPTIONS = [
    { key: 'tourism',          label: 'Tourism Only',       modifier: 1.0, penalties: false },
    { key: 'tourism_business', label: 'Tourism + Business', modifier: 1.2, penalties: false },
    { key: 'all',              label: 'All Purposes',       modifier: 1.5, penalties: true }
];

/**
 * Direction options for visa agreements.
 */
export const VISA_DIRECTION_OPTIONS = [
    { key: 'reciprocal',        label: 'Reciprocal' },
    { key: 'proposer_to_target', label: 'One-way (Our Citizens)' },
    { key: 'target_to_proposer', label: 'One-way (Their Citizens)' }
];

/**
 * Excludes (carve-outs) for visa agreements. Checked = excluded from waiver.
 */
export const VISA_EXCLUDES = [
    { key: 'work_permits',     label: 'Work Permits',     defaultChecked: true },
    { key: 'residency',        label: 'Residency',        defaultChecked: false },
    { key: 'diplomatic_staff', label: 'Diplomatic Staff',  defaultChecked: true }
];

/**
 * Base effects for visa agreement (at 90 Days / Tourism Only / Reciprocal / Default Excludes).
 */
export const VISA_BASE_EFFECTS = {
    relations: 6,
    revenue: 12_000_000,
    intl_reputation: 1,
    immigration: 1,
    polarization: 0,
    terrorism_risk: 0
};

/**
 * Cultural Exchange programme options (cosmetic — no mechanical difference).
 */
export const CULTURAL_PROGRAMMES = [
    { key: 'artist_exchange',      label: 'Artist Exchange' },
    { key: 'museum_exhibits',      label: 'Museum Exhibits' },
    { key: 'film_festival',        label: 'Film Festival' },
    { key: 'performance_tours',    label: 'Performance Tours' },
    { key: 'heritage_cooperation', label: 'Heritage Cooperation' }
];

/**
 * Cultural Exchange duration options with cost scaling.
 */
export const CULTURAL_DURATION_OPTIONS = [
    { key: 12, label: '12 Ticks (1 Year)', cost: 20_000_000, permanent: false },
    { key: 24, label: '24 Ticks (2 Years)', cost: 35_000_000, permanent: false },
    { key: 0,  label: 'Permanent',          cost: 50_000_000, permanent: true, ongoing_per_tick: 5_000_000 }
];

/**
 * Cultural Exchange funding split options.
 */
export const CULTURAL_FUNDING_OPTIONS = [
    { key: '50_50',        label: '50/50',           proposer_share: 0.5, target_share: 0.5 },
    { key: 'we_pay_more',  label: '60/40 (We Pay More)', proposer_share: 0.6, target_share: 0.4 },
    { key: 'they_pay_more', label: '60/40 (They Pay More)', proposer_share: 0.4, target_share: 0.6 }
];

/**
 * Cultural Exchange base effects (at 24 Ticks / 50/50).
 */
export const CULTURAL_BASE_EFFECTS = {
    relations: 4,
    intl_reputation: 1,
    soft_power: 3
};

/**
 * Student Exchange level options.
 */
export const STUDENT_LEVEL_OPTIONS = [
    { key: 'undergraduate', label: 'Undergraduate', higher_ed_bonus: 0 },
    { key: 'graduate',      label: 'Graduate',      higher_ed_bonus: 0.5 },
    { key: 'both',          label: 'Both',          higher_ed_bonus: 1.0 }
];

/**
 * Student Exchange duration options.
 */
export const STUDENT_DURATION_OPTIONS = [
    { key: 'semester',    label: '1 Semester (6 Ticks)', ticks: 6, permanent_bonus: false },
    { key: 'full_year',   label: 'Full Year (12 Ticks)', ticks: 12, permanent_bonus: false },
    { key: 'full_degree', label: 'Full Degree (36+ Ticks)', ticks: 36, permanent_bonus: true }
];

/**
 * Student Exchange funding options.
 */
export const STUDENT_FUNDING_OPTIONS = [
    { key: 'host_pays',   label: 'Host Pays',    proposer_share: 0, target_share: 1.0 },
    { key: 'split',        label: 'Split',        proposer_share: 0.5, target_share: 0.5 },
    { key: 'sender_pays',  label: 'Sender Pays',  proposer_share: 1.0, target_share: 0 }
];

/**
 * Student Exchange field options (cosmetic except Sciences/Engineering + Graduate = +0.5 Technology).
 */
export const STUDENT_FIELDS = [
    { key: 'sciences',    label: 'Sciences',    tech_eligible: true },
    { key: 'engineering', label: 'Engineering', tech_eligible: true },
    { key: 'medicine',    label: 'Medicine',    tech_eligible: false },
    { key: 'humanities',  label: 'Humanities',  tech_eligible: false },
    { key: 'law',         label: 'Law',         tech_eligible: false },
    { key: 'economics',   label: 'Economics',   tech_eligible: false }
];

/**
 * Student Exchange base effects (at 200 seats / Undergraduate / Full Year / Split).
 */
export const STUDENT_BASE_EFFECTS = {
    relations: 3,
    cost_total: 6_000_000,
    higher_education: 1,
    soft_power_per_year: 1
};

/**
 * Seats scaling for student exchange (diminishing returns above 200).
 */
export function getStudentSeatsModifier(seats) {
    seats = Math.max(50, Math.min(500, seats));
    if (seats <= 200) return seats / 200;
    // Diminishing returns: 200→1.0, 500→1.8
    return 1.0 + ((seats - 200) / 300) * 0.8;
}

/**
 * Joint Statement visibility options.
 */
export const STATEMENT_VISIBILITY_OPTIONS = [
    { key: 'public',  label: 'Public' },
    { key: 'private', label: 'Private' }
];

/**
 * Calculate all effects for a visa agreement article given its config.
 * Returns an effects object with computed values.
 */
export function calculateVisaEffects(config) {
    const durationOpt = VISA_DURATION_OPTIONS.find(d => d.key === config.duration) || VISA_DURATION_OPTIONS[1];
    const scopeOpt = VISA_SCOPE_OPTIONS.find(s => s.key === config.scope) || VISA_SCOPE_OPTIONS[0];
    const dMod = durationOpt.modifier;
    const sMod = scopeOpt.modifier;
    const isReciprocal = config.direction === 'reciprocal';
    const isOneWayProposer = config.direction === 'proposer_to_target';
    // const isOneWayTarget = config.direction === 'target_to_proposer';

    const excludes = config.excludes || ['work_permits', 'diplomatic_staff'];
    const workIncluded = !excludes.includes('work_permits');

    let relations = Math.round(VISA_BASE_EFFECTS.relations * dMod * sMod);
    let revenue = Math.round(VISA_BASE_EFFECTS.revenue * dMod * sMod);
    let intl_reputation = VISA_BASE_EFFECTS.intl_reputation;
    let immigration = workIncluded ? 2 : 1;

    // One-way: halve relations for the non-receiving nation, revenue only to receiver
    let proposer_relations = relations;
    let target_relations = relations;
    let proposer_revenue = revenue;
    let target_revenue = revenue;

    if (!isReciprocal) {
        if (isOneWayProposer) {
            // Proposer's citizens go to target → target receives tourists/revenue
            proposer_relations = Math.round(relations / 2);
            proposer_revenue = 0;
        } else {
            // Target's citizens go to proposer → proposer receives tourists/revenue
            target_relations = Math.round(relations / 2);
            target_revenue = 0;
        }
    }

    // Polarization + Terrorism from "All Purposes" scope
    let proposer_polarization = 0, target_polarization = 0;
    let proposer_terrorism = 0, target_terrorism = 0;
    if (scopeOpt.penalties) {
        if (isReciprocal) {
            proposer_polarization = 1; target_polarization = 1;
            proposer_terrorism = 0.5; target_terrorism = 0.5;
        } else if (isOneWayProposer) {
            // Target receives visitors → penalties on target only
            target_polarization = 1; target_terrorism = 0.5;
        } else {
            // Proposer receives visitors → penalties on proposer only
            proposer_polarization = 1; proposer_terrorism = 0.5;
        }
    }

    return {
        proposer: {
            relations: proposer_relations,
            revenue: proposer_revenue,
            intl_reputation,
            immigration: isReciprocal || !isOneWayProposer ? immigration : 0,
            polarization: proposer_polarization,
            terrorism_risk: proposer_terrorism
        },
        target: {
            relations: target_relations,
            revenue: target_revenue,
            intl_reputation,
            immigration: isReciprocal || isOneWayProposer ? immigration : 0,
            polarization: target_polarization,
            terrorism_risk: target_terrorism
        },
        // Summary (for display in proposer's UI — shows total combined)
        summary: {
            relations,
            revenue,
            intl_reputation,
            immigration,
            polarization: proposer_polarization || target_polarization ? 1 : 0,
            terrorism_risk: proposer_terrorism || target_terrorism ? 0.5 : 0
        }
    };
}

/**
 * Calculate effects for a cultural exchange article.
 */
export function calculateCulturalEffects(config) {
    const durationOpt = CULTURAL_DURATION_OPTIONS.find(d => d.key === config.duration) || CULTURAL_DURATION_OPTIONS[1];
    const fundingOpt = CULTURAL_FUNDING_OPTIONS.find(f => f.key === config.funding) || CULTURAL_FUNDING_OPTIONS[0];
    const totalCost = durationOpt.cost;

    return {
        relations: CULTURAL_BASE_EFFECTS.relations,
        intl_reputation: CULTURAL_BASE_EFFECTS.intl_reputation,
        soft_power: CULTURAL_BASE_EFFECTS.soft_power,
        soft_power_duration: durationOpt.permanent ? null : durationOpt.key,
        cost_proposer: Math.round(totalCost * fundingOpt.proposer_share),
        cost_target: Math.round(totalCost * fundingOpt.target_share),
        ongoing_per_tick: durationOpt.permanent ? durationOpt.ongoing_per_tick : 0
    };
}

/**
 * Calculate effects for a student exchange article.
 */
export function calculateStudentEffects(config) {
    const seats = config.seats || 200;
    const seatsMod = getStudentSeatsModifier(seats);
    const levelOpt = STUDENT_LEVEL_OPTIONS.find(l => l.key === config.level) || STUDENT_LEVEL_OPTIONS[0];
    const fundingOpt = STUDENT_FUNDING_OPTIONS.find(f => f.key === config.funding) || STUDENT_FUNDING_OPTIONS[1];

    const totalCost = Math.round(STUDENT_BASE_EFFECTS.cost_total * seatsMod);
    const fields = config.fields || [];
    const hasTechFields = fields.some(f => {
        const fi = STUDENT_FIELDS.find(sf => sf.key === f);
        return fi && fi.tech_eligible;
    });
    const techBonus = (hasTechFields && (config.level === 'graduate' || config.level === 'both')) ? 0.5 : 0;

    const durationOpt = STUDENT_DURATION_OPTIONS.find(d => d.key === config.duration) || STUDENT_DURATION_OPTIONS[1];

    return {
        relations: STUDENT_BASE_EFFECTS.relations,
        higher_education: STUDENT_BASE_EFFECTS.higher_education + levelOpt.higher_ed_bonus,
        soft_power_per_year: STUDENT_BASE_EFFECTS.soft_power_per_year,
        permanent_soft_power: durationOpt.permanent_bonus ? 1 : 0,
        technology_bonus: techBonus,
        cost_proposer: Math.round(totalCost * fundingOpt.proposer_share),
        cost_target: Math.round(totalCost * fundingOpt.target_share),
        duration_ticks: durationOpt.ticks
    };
}

/**
 * Article type definitions for Minor Diplomatic Initiative.
 */
export const INITIATIVE_ARTICLE_TYPES = {
    visa_agreement: {
        key: 'visa_agreement',
        label: 'Visa Agreement',
        description: 'Establishes visa-free travel between nations.',
        max_per_initiative: 1,
        has_config: true,
        calculateEffects: calculateVisaEffects,
        default_config: {
            duration: 90,
            scope: 'tourism',
            direction: 'reciprocal',
            excludes: ['work_permits', 'diplomatic_staff']
        }
    },
    cultural_exchange: {
        key: 'cultural_exchange',
        label: 'Cultural Exchange',
        description: 'Establishes cultural programmes between nations. Builds soft power over time.',
        max_per_initiative: null,
        has_config: true,
        calculateEffects: calculateCulturalEffects,
        default_config: {
            programmes: ['artist_exchange'],
            duration: 24,
            funding: '50_50'
        }
    },
    student_exchange: {
        key: 'student_exchange',
        label: 'Student Exchange Program',
        description: 'University exchange programme. Cheap, builds long-term soft power and education.',
        max_per_initiative: null,
        has_config: true,
        calculateEffects: calculateStudentEffects,
        default_config: {
            seats: 200,
            level: 'undergraduate',
            duration: 'full_year',
            funding: 'split',
            fields: ['sciences']
        }
    },
    joint_statement: {
        key: 'joint_statement',
        label: 'Joint Statement',
        description: 'Public or private declaration. No mechanical effect.',
        max_per_initiative: null,
        has_config: true,
        calculateEffects: () => ({}),
        default_config: {
            text: '',
            visibility: 'public'
        }
    }
};

// ── STATE VISIT CONFIGURATION ──

export const STATE_VISIT_AGENDA_ITEMS = [
    {
        key: 'formal_reception', day: 1, slot: 'Arrival',
        title: 'Formal Reception Ceremony',
        desc: 'Honour guard, national anthems, and official welcome at the host capital. Sets the tone for the visit and generates press coverage in both nations.',
        effects: { relations: 3, public_awareness: 5 },
        tags: ['Press Event'], costs: {}, risks: {}
    },
    {
        key: 'joint_press', day: 1, slot: 'Afternoon',
        title: 'Joint Press Conference',
        desc: 'Public statement by both ambassadors on shared goals and bilateral cooperation. Allows framing of the diplomatic narrative. Boosts Government Approval in both nations if relations are positive.',
        effects: { gov_approval: 2, relations: 2 },
        tags: [], costs: {}, risks: { gaffe: 0.08 }
    },
    {
        key: 'economic_forum', day: 2, slot: 'Morning',
        title: 'Economic Forum',
        desc: 'Business delegations from both nations meet to discuss trade opportunities, investment climate, and commercial partnerships. May trigger trade deal prerequisite.',
        effects: { trade_relations: 4 },
        tags: ['Unlocks Trade Deal'], costs: { debt: 1200000 }, risks: {}
    },
    {
        key: 'university_address', day: 2, slot: 'Afternoon',
        title: 'University Address',
        desc: "Ambassador delivers a public lecture at the host nation's national university. Builds cultural capital and soft power. Topic can be chosen for targeted effect.",
        effects: { soft_power: 3, education_approval: 2 },
        tags: [], costs: {}, risks: {}
    },
    {
        key: 'bilateral_talks', day: 2, slot: 'Evening',
        title: 'Private Bilateral Talks',
        desc: 'Closed-door meeting between senior officials. No press, no public record. Can discuss sensitive topics and build trust for future negotiations. The content remains private.',
        effects: { relations: 5 },
        tags: ['Trust Threshold', 'Enables Initiatives'], costs: {}, risks: {}
    },
    {
        key: 'military_review', day: 3, slot: 'Morning',
        title: 'Military Review',
        desc: "Joint inspection of host nation's armed forces. Signals strength and mutual trust but may alarm hostile neighbours.",
        effects: { military_trust: 4 },
        tags: [], costs: {}, risks: { hostiles_alarmed: true }
    },
    {
        key: 'cultural_exchange', day: 3, slot: 'Afternoon',
        title: 'Cultural Exchange Programme',
        desc: 'Exchange of artistic delegations, museum exhibits, and performance troupes. Long-term soft power investment.',
        effects: { soft_power: 4, relations: 2 },
        tags: [], costs: { debt: 800000 }, risks: {}
    },
    {
        key: 'monument_visit', day: 3, slot: 'Evening',
        title: 'Monument Visit',
        desc: 'Symbolic visit to a national memorial or heritage site. Strong public signal of respect. Low cost, moderate opinion boost.',
        effects: { public_opinion: 3 },
        tags: ['Symbolic'], costs: {}, risks: {}
    },
    {
        key: 'treaty_signing', day: 3, slot: 'Closing',
        title: 'Treaty Signing Ceremony',
        desc: 'Formal ratification of a pending agreement during the visit. Requires an accepted proposal awaiting signature.',
        effects: {},
        tags: [], costs: {}, risks: {},
        requires: 'pending_treaty'
    }
];

export const STATE_VISIT_TYPES = {
    official_state_visit: { label: 'Official State Visit', apMod: 0, multiplier: 1.0, relMult: 1.0, tradeMult: 1.0, softPowerMult: 1.0 },
    working_visit:        { label: 'Working Visit',        apMod: -1, multiplier: 1.0, relMult: 0.8, tradeMult: 1.2, softPowerMult: 1.0 },
    goodwill_visit:       { label: 'Goodwill Visit',       apMod: -2, multiplier: 1.0, relMult: 1.0, tradeMult: 0.6, softPowerMult: 1.3 }
};

export const STATE_VISIT_DURATIONS = {
    short:    { label: 'Short',    apCost: 1, multiplier: 0.7, maxAgenda: 3 },
    moderate: { label: 'Moderate', apCost: 2, multiplier: 1.0, maxAgenda: 5 },
    lengthy:  { label: 'Lengthy',  apCost: 3, multiplier: 1.3, maxAgenda: 7 }
};

export const STATE_VISIT_DELEGATIONS = {
    small_4:    { label: 'Small (4)',    debt: 1200000, effectBonus: 0 },
    standard_8: { label: 'Standard (8)', debt: 2400000, effectBonus: 0 },
    large_14:   { label: 'Large (14)',   debt: 4800000, effectBonus: 0.1 }
};

// ==================== MAJOR DIPLOMATIC INITIATIVE ====================

/**
 * Major Diplomatic Initiative — Tier 3 negotiated diplomatic action.
 * Bundled articles proposed by the Foreign Minister to a target nation.
 * Requires bilateral parliamentary ratification (both nations must pass).
 */
export const MAJOR_INITIATIVE_CONFIG = {
    AP_COST: 2,
    TIER: 3,
    TYPE: 'major_diplomatic_initiative',
    BUDGET_SOURCE: 'foreign',               // institution id in budget_item_allocations
    HOSTILE_RELATION_THRESHOLD: -50,         // cannot propose below this
    HOG_FALLBACK_AP_PENALTY: 3,             // extra AP if HoG proposes without FM
    RATIFICATION_VOTING_TICKS: 6,           // both parliaments vote for 6 ticks
    REPROPOSE_COOLDOWN_TICKS: 8,            // cannot re-propose same initiative for 8 ticks after failure
};

// ── OPEN BORDERS AGREEMENT ──

export const OPEN_BORDERS_SCOPE_OPTIONS = [
    { key: 'full',            label: 'Full Freedom of Movement', modifier: 1.5, desc: 'Entry, work, residency, and settlement.' },
    { key: 'work_residency',  label: 'Work & Residency Only',   modifier: 1.0, desc: 'Can work and live, but citizenship stays with home nation.' },
    { key: 'labor_mobility',  label: 'Labor Mobility Only',     modifier: 0.6, desc: 'Can work across the border but must maintain home residence.' }
];

export const OPEN_BORDERS_DIRECTION_OPTIONS = [
    { key: 'reciprocal',    label: 'Reciprocal',                    desc: 'Both nations open to each other.' },
    { key: 'our_to_them',   label: 'One-Way (Our Citizens to Them)', desc: 'Only proposer\'s citizens gain access.' },
    { key: 'their_to_us',   label: 'One-Way (Their Citizens to Us)', desc: 'Only target\'s citizens gain access.' }
];

export const OPEN_BORDERS_WORKER_PROTECTIONS = [
    { key: 'enhanced', label: 'Enhanced Protections',  cost_per_year: 8000000, exploitation_mult: 0.2, desc: 'Minimum wage, anti-exploitation enforcement, pension portability.' },
    { key: 'standard', label: 'Standard Labor Law',    cost_per_year: 0,       exploitation_mult: 1.0, desc: 'Migrant workers subject to host nation\'s existing labor law.' },
    { key: 'none',     label: 'No Special Provisions', cost_per_year: 0,       exploitation_mult: 1.5, desc: 'General law applies with no additional protections.' }
];

export const OPEN_BORDERS_TRANSITION_OPTIONS = [
    { key: 'immediate', label: 'Immediate',          ramp_ticks: 0,  unrest_spike: 3,  desc: 'Borders open on ratification.' },
    { key: '6_tick',    label: '6-Tick Transition',   ramp_ticks: 6,  unrest_spike: 1,  desc: 'Phased opening over 6 ticks.' },
    { key: '12_tick',   label: '12-Tick Transition',  ramp_ticks: 12, unrest_spike: 0,  desc: 'Gradual opening, least disruptive.' }
];

const OPEN_BORDERS_BASE_EFFECTS = {
    relations: 8,
    immigration: 4,
    gdp_growth: 1,
    labor_force_participation: 2,
    civil_unrest: 3,
    polarization: 2,
    terrorism: 0.5,
    housing_affordability: -1,
    cost_of_living: 0.5,
    cost_proposer: 15000000,
    cost_target: 15000000,
    ongoing_cost: 5000000
};

/**
 * Calculate effects for an Open Borders Agreement article.
 * @param {Object} config - { scope, direction, worker_protections, transition }
 * @returns {{ proposer: Object, target: Object, summary: Object }}
 */
export function calculateOpenBordersEffects(config) {
    const scopeOpt = OPEN_BORDERS_SCOPE_OPTIONS.find(s => s.key === config.scope) || OPEN_BORDERS_SCOPE_OPTIONS[1];
    const transOpt = OPEN_BORDERS_TRANSITION_OPTIONS.find(t => t.key === config.transition) || OPEN_BORDERS_TRANSITION_OPTIONS[0];
    const protOpt = OPEN_BORDERS_WORKER_PROTECTIONS.find(p => p.key === config.worker_protections) || OPEN_BORDERS_WORKER_PROTECTIONS[1];
    const isReciprocal = config.direction === 'reciprocal';
    const isOurToThem = config.direction === 'our_to_them';

    const sMod = scopeOpt.modifier;
    const base = OPEN_BORDERS_BASE_EFFECTS;

    const relations = Math.round(base.relations * sMod);
    const immigration = Math.round(base.immigration * sMod);
    const gdp_growth = +(base.gdp_growth * sMod).toFixed(2);
    const labor_force = Math.round(base.labor_force_participation * sMod);
    const civil_unrest = Math.round(transOpt.unrest_spike * sMod);
    const polarization = Math.round(base.polarization * sMod);
    const terrorism = +(base.terrorism * sMod).toFixed(2);
    const housing = Math.round(base.housing_affordability * sMod);
    const col = +(base.cost_of_living * sMod).toFixed(2);

    const ratification_cost = Math.round(base.cost_proposer * sMod);
    const ongoing_cost = base.ongoing_cost + protOpt.cost_per_year;

    // Direction-based asymmetry: the nation receiving migrants gets the full economic + social effects
    // The sending nation gets relations and labor effects but less immigration pressure
    let proposer = {}, target = {};

    if (isReciprocal) {
        proposer = {
            relations, immigration, gdp_growth, labor_force_participation: labor_force,
            civil_unrest, polarization, terrorism, housing_affordability: housing, cost_of_living: col
        };
        target = { ...proposer };
    } else if (isOurToThem) {
        // Our citizens go to them — target receives migrants
        proposer = {
            relations: Math.round(relations * 0.6), immigration: 0, gdp_growth: 0,
            labor_force_participation: 0, civil_unrest: 0, polarization: Math.round(polarization * 0.5),
            terrorism: 0, housing_affordability: 0, cost_of_living: 0
        };
        target = {
            relations, immigration, gdp_growth, labor_force_participation: labor_force,
            civil_unrest, polarization, terrorism, housing_affordability: housing, cost_of_living: col
        };
    } else {
        // Their citizens come to us — proposer receives migrants
        proposer = {
            relations, immigration, gdp_growth, labor_force_participation: labor_force,
            civil_unrest, polarization, terrorism, housing_affordability: housing, cost_of_living: col
        };
        target = {
            relations: Math.round(relations * 0.6), immigration: 0, gdp_growth: 0,
            labor_force_participation: 0, civil_unrest: 0, polarization: Math.round(polarization * 0.5),
            terrorism: 0, housing_affordability: 0, cost_of_living: 0
        };
    }

    return {
        proposer,
        target,
        summary: {
            relations, immigration, gdp_growth, labor_force_participation: labor_force,
            civil_unrest, polarization, terrorism, housing_affordability: housing, cost_of_living: col
        },
        costs: {
            ratification_proposer: ratification_cost,
            ratification_target: ratification_cost,
            ongoing_per_year: ongoing_cost
        },
        transition_ticks: transOpt.ramp_ticks,
        worker_protection_mult: protOpt.exploitation_mult
    };
}

// ── MUTUAL EXTRADITION TREATY ──

export const EXTRADITION_SCOPE_OPTIONS = [
    { key: 'organized_crime',  label: 'Organized Crime',  controversial: false, crime_weight: 1.0,  desc: 'Drug traffickers, smugglers, gang leaders.' },
    { key: 'financial_crime',  label: 'Financial Crime',  controversial: false, crime_weight: 0.8,  desc: 'Money laundering, tax evasion, fraud.' },
    { key: 'terrorism',        label: 'Terrorism Suspects', controversial: false, crime_weight: 0.7, desc: 'Individuals linked to terrorist organizations.' },
    { key: 'war_crimes',       label: 'War Crimes',       controversial: false, crime_weight: 0.5,  desc: 'War crimes and crimes against humanity.' },
    { key: 'political_offenses', label: 'Political Offenses', controversial: true, crime_weight: 0.3, desc: 'Political dissidents, opposition figures, journalists. Highly controversial.' }
];

export const EXTRADITION_DUAL_CRIMINALITY_OPTIONS = [
    { key: 'required', label: 'Dual Criminality Required', desc: 'Can only extradite if the offense is a crime in both nations.' },
    { key: 'waived',   label: 'Dual Criminality Waived',   desc: 'Can extradite even if the offense isn\'t a crime in the receiving nation. Dangerous.' }
];

export const EXTRADITION_APPEAL_OPTIONS = [
    { key: 'full_judicial', label: 'Full Judicial Review',  process_ticks: 4, freedom_penalty: 0,  judicial_penalty: 0,  crime_mult: 1.0, desc: 'Courts review, subject can appeal. Slow but fair.' },
    { key: 'expedited',     label: 'Expedited Review',      process_ticks: 2, freedom_penalty: 0,  judicial_penalty: 0,  crime_mult: 1.3, desc: 'Faster, limited appeal. More effective.' },
    { key: 'executive',     label: 'Executive Authority',   process_ticks: 1, freedom_penalty: -2, judicial_penalty: -1, crime_mult: 2.0, desc: 'HoG can approve directly. Fastest but authoritarian.' }
];

export const EXTRADITION_EXCEPTION_OPTIONS = [
    { key: 'own_citizens',   label: 'Own Citizens Exempt',     effectiveness_mult: 0.7, desc: 'Nation does not extradite its own citizens.' },
    { key: 'death_penalty',  label: 'Death Penalty Exempt',    effectiveness_mult: 1.0, desc: 'Will not extradite if death penalty may be imposed.' },
    { key: 'military',       label: 'Military Personnel Exempt', effectiveness_mult: 0.9, desc: 'Active military not subject to extradition.' }
];

const EXTRADITION_BASE_EFFECTS = {
    relations: 5,
    crime_rate: -3,
    terrorism: -1,
    corruption: -1,
    international_reputation: 1,
    judicial_independence: 0.5,
    cost_proposer: 8000000,
    cost_target: 8000000,
    ongoing_cost: 3000000
};

/**
 * Calculate effects for a Mutual Extradition Treaty article.
 * @param {Object} config - { scope: string[], dual_criminality, appeal_process, exceptions: string[] }
 * @returns {{ proposer: Object, target: Object, summary: Object }}
 */
export function calculateExtraditionEffects(config) {
    const scopes = config.scope || ['organized_crime', 'financial_crime', 'terrorism'];
    const appealOpt = EXTRADITION_APPEAL_OPTIONS.find(a => a.key === config.appeal_process) || EXTRADITION_APPEAL_OPTIONS[0];
    const exceptions = config.exceptions || [];
    const base = EXTRADITION_BASE_EFFECTS;

    // Effectiveness scales with number and weight of scopes
    const totalWeight = scopes.reduce((sum, s) => {
        const opt = EXTRADITION_SCOPE_OPTIONS.find(o => o.key === s);
        return sum + (opt ? opt.crime_weight : 0);
    }, 0);
    const scopeMod = Math.min(1.5, totalWeight / 2.5); // normalize around standard 3-scope config

    // Exception effectiveness reduction
    const exceptionMult = exceptions.reduce((mult, e) => {
        const opt = EXTRADITION_EXCEPTION_OPTIONS.find(o => o.key === e);
        return mult * (opt ? opt.effectiveness_mult : 1.0);
    }, 1.0);

    const crimeMult = appealOpt.crime_mult * exceptionMult;

    const crime_rate = +(base.crime_rate * scopeMod * crimeMult).toFixed(1);
    const terrorism = scopes.includes('terrorism') ? +(base.terrorism * crimeMult).toFixed(1) : 0;
    const corruption = +(base.corruption * scopeMod).toFixed(1);
    const relations = base.relations;
    const intl_reputation = base.international_reputation;
    const judicial_independence = +(base.judicial_independence + appealOpt.judicial_penalty).toFixed(1);

    // Political offenses penalties
    const hasPoliticalOffenses = scopes.includes('political_offenses');
    const freedom_index = hasPoliticalOffenses ? -2 + appealOpt.freedom_penalty : appealOpt.freedom_penalty;
    const press_freedom = hasPoliticalOffenses ? -1 : 0;
    const reputation_penalty = hasPoliticalOffenses ? -2 : 0;
    const polarization = hasPoliticalOffenses ? 1 : 0;

    // Dual criminality waived penalty
    const dualWaived = config.dual_criminality === 'waived';
    const freedom_extra = dualWaived ? -1 : 0;

    const effects = {
        relations,
        crime_rate,
        terrorism,
        corruption,
        international_reputation: intl_reputation + reputation_penalty,
        judicial_independence,
        freedom_index: freedom_index + freedom_extra,
        press_freedom,
        polarization
    };

    return {
        proposer: { ...effects },
        target: { ...effects },
        summary: { ...effects },
        costs: {
            ratification_proposer: base.cost_proposer,
            ratification_target: base.cost_target,
            ongoing_per_year: base.ongoing_cost
        },
        warnings: [
            ...(hasPoliticalOffenses ? ['Including Political Offenses significantly reduces Freedom Index and Press Freedom.'] : []),
            ...(dualWaived ? ['Waiving Dual Criminality allows extradition for acts that aren\'t crimes in your nation.'] : []),
            ...(appealOpt.key === 'executive' ? ['Executive Authority doubles crime reduction but costs Freedom Index and Judicial Independence.'] : [])
        ]
    };
}

// ── ENVIRONMENTAL ACCORD ──

export const ENVIRONMENT_EMISSION_TARGET_OPTIONS = [
    { key: 'modest',      label: 'Modest Reduction (5%)',      reduction_pct: 5,  reputation_bonus: 1, gdp_penalty: 0,    desc: 'Achievable for most nations.' },
    { key: 'significant', label: 'Significant Reduction (15%)', reduction_pct: 15, reputation_bonus: 2, gdp_penalty: 0,    desc: 'Requires active policy changes.' },
    { key: 'aggressive',  label: 'Aggressive Reduction (25%)',  reduction_pct: 25, reputation_bonus: 3, gdp_penalty: -0.5, desc: 'Requires major economic restructuring.' }
];

export const ENVIRONMENT_RENEWABLE_TARGET_OPTIONS = [
    { key: 0,  label: 'No Commitment',  target_pct: 0  },
    { key: 30, label: '30% Target',     target_pct: 30 },
    { key: 50, label: '50% Target',     target_pct: 50 },
    { key: 70, label: '70% Target',     target_pct: 70 }
];

export const ENVIRONMENT_POLLUTION_STANDARDS = [
    { key: 'non_binding', label: 'Non-Binding Guidelines',  pollution_bonus: -0.5, manufacturing_penalty: 0,    cap_offset: 0,   desc: 'Recommend limits, no enforcement.' },
    { key: 'binding',     label: 'Binding Standards',       pollution_bonus: -1,   manufacturing_penalty: 0,    cap_offset: -5,  desc: 'Both nations must maintain pollution below agreed threshold.' },
    { key: 'strict',      label: 'Strict Standards',        pollution_bonus: -2,   manufacturing_penalty: -0.5, cap_offset: -10, desc: 'Lower threshold, harsher penalties for breach.' }
];

export const ENVIRONMENT_CONSERVATION_OPTIONS = [
    { key: 'forest',       label: 'Forest Protection',      bonus_reputation: 0.5, bonus_pollution: -0.5, desc: 'Commit to maintaining arable land.' },
    { key: 'marine',       label: 'Marine Protection',      bonus_reputation: 0.5, bonus_pollution: -0.5, desc: 'Reduce fishing quotas, marine reserves.' },
    { key: 'biodiversity', label: 'Biodiversity Commitment', bonus_reputation: 0.5, bonus_pollution: -0.5, desc: 'Protect endangered species, restrict land development.' }
];

export const ENVIRONMENT_REVIEW_INTERVAL_OPTIONS = [
    { key: 12, label: 'Annual Review (12 ticks)',        desc: 'Check compliance every 12 ticks. Gentle.' },
    { key: 6,  label: 'Biannual Review (6 ticks)',       desc: 'More frequent checks. Standard.' },
    { key: 1,  label: 'Continuous Monitoring (every tick)', desc: 'Real-time compliance every tick. Strict.' }
];

export const ENVIRONMENT_PENALTY_OPTIONS = [
    { key: 'warning',     label: 'Warning Only',       desc: 'First violation is a warning, second triggers Relations -2.' },
    { key: 'financial',   label: 'Financial Penalty',   desc: 'Violation triggers $20M fine added to violator\'s debt.' },
    { key: 'suspension',  label: 'Suspension',          desc: 'Violated articles suspended, benefits lost until compliance restored.' },
    { key: 'termination', label: 'Treaty Termination',  desc: 'Persistent violation (3+ consecutive reviews) auto-terminates the treaty.' }
];

const ENVIRONMENT_BASE_EFFECTS = {
    relations: 6,
    international_reputation: 2,
    pollution: -2,
    cost_proposer: 12000000,
    cost_target: 12000000,
    ongoing_cost: 4000000
};

/**
 * Calculate effects for an Environmental Accord article.
 * @param {Object} config - { emission_target, renewable_target, pollution_standards, conservation: string[], review_interval, penalty }
 * @returns {{ proposer: Object, target: Object, summary: Object }}
 */
export function calculateEnvironmentalEffects(config) {
    const emissionOpt = ENVIRONMENT_EMISSION_TARGET_OPTIONS.find(e => e.key === config.emission_target) || ENVIRONMENT_EMISSION_TARGET_OPTIONS[1];
    const renewableOpt = ENVIRONMENT_RENEWABLE_TARGET_OPTIONS.find(r => r.key === config.renewable_target) || ENVIRONMENT_RENEWABLE_TARGET_OPTIONS[0];
    const pollutionOpt = ENVIRONMENT_POLLUTION_STANDARDS.find(p => p.key === config.pollution_standards) || ENVIRONMENT_POLLUTION_STANDARDS[0];
    const conservation = config.conservation || [];
    const base = ENVIRONMENT_BASE_EFFECTS;

    const relations = base.relations;
    const intl_reputation = base.international_reputation + emissionOpt.reputation_bonus
        + conservation.reduce((sum, c) => {
            const opt = ENVIRONMENT_CONSERVATION_OPTIONS.find(o => o.key === c);
            return sum + (opt ? opt.bonus_reputation : 0);
        }, 0);

    const pollution = base.pollution + pollutionOpt.pollution_bonus
        + conservation.reduce((sum, c) => {
            const opt = ENVIRONMENT_CONSERVATION_OPTIONS.find(o => o.key === c);
            return sum + (opt ? opt.bonus_pollution : 0);
        }, 0);

    const manufacturing_output = pollutionOpt.manufacturing_penalty;
    const gdp_growth = emissionOpt.gdp_penalty;

    const effects = {
        relations,
        international_reputation: intl_reputation,
        pollution,
        manufacturing_output,
        gdp_growth
    };

    return {
        proposer: { ...effects },
        target: { ...effects },
        summary: { ...effects },
        costs: {
            ratification_proposer: base.cost_proposer,
            ratification_target: base.cost_target,
            ongoing_per_year: base.ongoing_cost
        },
        compliance: {
            emission_reduction_pct: emissionOpt.reduction_pct,
            renewable_target_pct: renewableOpt.target_pct,
            pollution_cap_offset: pollutionOpt.cap_offset,
            conservation_clauses: conservation,
            review_interval_ticks: config.review_interval || 6,
            penalty_type: config.penalty || 'warning',
            compliance_window_ticks: 24
        }
    };
}

// ── MAJOR INITIATIVE ARTICLE TYPES ──

/**
 * Article type definitions for Major Diplomatic Initiative.
 * Same shape as INITIATIVE_ARTICLE_TYPES for Minor Initiatives.
 */
export const MAJOR_INITIATIVE_ARTICLE_TYPES = {
    open_borders: {
        key: 'open_borders',
        label: 'Open Borders Agreement',
        description: 'Full freedom of movement between two nations. Carries sovereignty costs and integration pressure.',
        max_per_initiative: 1,
        has_config: true,
        calculateEffects: calculateOpenBordersEffects,
        default_config: {
            scope: 'work_residency',
            direction: 'reciprocal',
            worker_protections: 'standard',
            transition: 'immediate'
        }
    },
    mutual_extradition: {
        key: 'mutual_extradition',
        label: 'Mutual Extradition Treaty',
        description: 'Both nations agree to extradite criminals and suspects. Reduces crime and terrorism but raises human rights concerns.',
        max_per_initiative: 1,
        has_config: true,
        calculateEffects: calculateExtraditionEffects,
        default_config: {
            scope: ['organized_crime', 'financial_crime', 'terrorism'],
            dual_criminality: 'required',
            appeal_process: 'full_judicial',
            exceptions: ['own_citizens']
        }
    },
    environmental_accord: {
        key: 'environmental_accord',
        label: 'Bilateral Environmental Accord',
        description: 'Binding bilateral commitments on environmental targets. Non-compliance triggers penalties.',
        max_per_initiative: 1,
        has_config: true,
        calculateEffects: calculateEnvironmentalEffects,
        default_config: {
            emission_target: 'significant',
            renewable_target: 30,
            pollution_standards: 'binding',
            conservation: ['forest'],
            review_interval: 6,
            penalty: 'financial'
        }
    }
};

// ── SOVEREIGNTY CONSTRAINTS ──

/**
 * Maps active Major Initiative article types + configs to domestic policy sectors
 * that become restricted while the treaty is active.
 * Key = article_type, value = array of { condition, blocked_sectors, message }
 */
export const SOVEREIGNTY_CONSTRAINTS = {
    open_borders: [
        {
            condition: (config) => config.scope === 'full',
            blocked_sectors: ['IMMIGRATION', 'LABOR'],
            message: 'Full Open Borders agreement prohibits unilateral immigration and labor policy changes'
        },
        {
            condition: (config) => config.scope === 'work_residency' || config.scope === 'labor_mobility',
            blocked_sectors: ['LABOR'],
            message: 'Open Borders labor provisions restrict unilateral labor policy changes'
        }
    ],
    mutual_extradition: [
        {
            condition: (config) => config.scope && config.scope.includes('political_offenses'),
            blocked_sectors: ['GOVERNANCE'],
            message: 'Mutual Extradition treaty covering political offenses restricts governance policy changes'
        }
    ],
    environmental_accord: [
        {
            condition: (config) => config.pollution_standards === 'strict' || config.pollution_standards === 'binding',
            blocked_sectors: ['ENERGY'],
            message: 'Environmental Accord binding standards restrict unilateral energy policy changes'
        }
    ]
};

/**
 * Check if a policy's major_sector conflicts with any active Major Initiative sovereignty constraints.
 * @param {Array} activeProposals - Active tier-3 proposals involving this nation
 * @param {string} policySector - The major_sector of the policy being proposed
 * @returns {{ blocked: boolean, message: string|null, initiative_name: string|null }}
 */
export function checkSovereigntyConstraints(activeProposals, policySector) {
    if (!activeProposals || !policySector) return { blocked: false, message: null, initiative_name: null };

    for (const proposal of activeProposals) {
        const pd = proposal.proposal_data || {};
        const articles = pd.articles || [];

        for (const art of articles) {
            if (art.status === 'struck' || art.suspended) continue;

            const constraints = SOVEREIGNTY_CONSTRAINTS[art.type];
            if (!constraints) continue;

            for (const constraint of constraints) {
                if (constraint.blocked_sectors.includes(policySector) && constraint.condition(art.config || {})) {
                    return {
                        blocked: true,
                        message: constraint.message,
                        initiative_name: pd.name || 'Major Diplomatic Initiative'
                    };
                }
            }
        }
    }

    return { blocked: false, message: null, initiative_name: null };
}


