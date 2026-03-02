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
    PROPOSE_TRADE_NEGOTIATION_AP: 2,      // Ambassador or MoT proposes trade negotiations
    ACCEPT_TRADE_NEGOTIATION_AP: 1,       // Other ambassador or MoT accepts
    JOIN_NEGOTIATION_PM_AP: 2,            // PM/HoG party joins negotiation
    JOIN_NEGOTIATION_FM_AP: 1,            // FM party joins
    JOIN_NEGOTIATION_MOT_AP: 2,           // Minister of Trade joins (required)
    HOG_DRAFT_INITIATIVE_AP: 3,           // HoG drafting when no ambassador (penalty)
    MOT_JOIN_DEADLINE_TICKS: 4,           // Ticks before negotiations cancel if MoT hasn't joined

    // Trade negotiation timing
    NEGOTIATION_DEFAULT_DURATION: 4,      // ticks until negotiation expires
    NEGOTIATION_EXTENSION_TICKS: 12,      // ticks added per extension (1 month)
    NEGOTIATION_MAX_EXTENSIONS: 3,        // max times negotiations can be extended
    TRADE_RATIFICATION_VOTING_TICKS: 6,   // ticks for parliament to vote on trade bill

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
 * 5 types:
 *   FTA  — Free Trade Agreement: comprehensive tariff elimination
 *   PTA  — Preferential Tariff Agreement: sector-specific tariff reduction
 *   RSC  — Resource Supply Contract: guaranteed purchase commitment
 *   ES   — Export Subsidy: unilateral, no partner needed
 *   AID  — Economic Aid Agreement: financial assistance with optional conditions
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

    // ── Text Article (optional for all types) ──
    text_article: {
        key: 'text_article',
        label: 'Text Article',
        description: 'Free-text article for flavor/RP. No mechanical effect.',
        repeatable: true,
        applies_to: ['fta', 'pta', 'resource_supply', 'export_subsidy', 'economic_aid'],
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
    'unemployment', 'poverty_rate', 'income_inequality', 'death_rate',
    'pollution', 'carbon_emissions', 'crime_rate', 'incarceration_rate',
    'drug_use', 'corruption', 'polarization', 'civil_unrest', 'terrorism',
    'political_violence', 'emigration', 'sanctions', 'debt', 'debt_growth',
    'inflation', 'illegal_immigration', 'fuel_prices'
];

// Stats stored as raw numbers (not 0-100 indices).
// GDP and debt are stored as raw dollars (88B = 88,000,000,000).
// All other stats (0-100 indices) use the default divisor of 50.
export const RAW_SCALING_DIVISORS = {
    population: 1_000_000,
    gdp: 1_000_000_000,
    debt: 1_000_000_000
};

