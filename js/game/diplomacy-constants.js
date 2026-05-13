/**
 * diplomacy-constants.js — Diplomacy constants, trade types, and scaling divisors.
 * Extracted from game-common.js.
 */

export const DIPLOMACY_CONFIG = {
    // Economic Aid (consumed by budget.js + bills.js aid-ratification path).
    AID_MAX_GDP_PCT: 25,
    AID_ANNUAL_REVIEW_INTERVAL: 12,
    AID_RELATION_BONUS: 8
};

/**
 * Resolve sender, receiver, and amount for a trade-agreement `transfer` article.
 * Centralizes the author + direction → from/to logic that previously lived
 * inline in the ratification handler, the per-tick recurring processor, and
 * the budget UI aggregator (and was prone to drift across them).
 *
 * Article schema (constructed in the diplomacy negotiation modal):
 *   - article.author_nation_id: the drafter
 *   - article.data.amount: dollars (per-tick if recurring, lump-sum otherwise)
 *   - article.data.direction: 'a_to_b' = drafter pays counterparty,
 *                             'b_to_a' = counterparty pays drafter
 *   - article.data.transfer_type: 'recurring' | undefined (one-time)
 *
 * Agreement schema: nation_a_id / nation_b_id (canonical sorted order, a < b).
 *
 * Returns { fromNation, toNation, amount } on success, or null when the
 * article is malformed (wrong type, bad amount, invalid author). Callers
 * should treat null as "skip this article". Does NOT filter by transfer_type
 * or executed/paid markers — those are caller-side concerns since each
 * callsite has different idempotency rules.
 */
export function resolveTransferEndpoints(article, agreement) {
    if (!article) return null;
    var artType = article.type || article.article_type;
    if (artType !== 'transfer') return null;
    if (!agreement || !agreement.nation_a_id || !agreement.nation_b_id) return null;

    var data = article.data || {};
    var amount = Number(data.amount || 0);
    if (!Number.isFinite(amount) || amount <= 0) return null;

    var author = article.author_nation_id;
    if (!author || (author !== agreement.nation_a_id && author !== agreement.nation_b_id)) return null;

    var counterparty = author === agreement.nation_a_id
        ? agreement.nation_b_id
        : agreement.nation_a_id;
    var fromNation = data.direction === 'a_to_b' ? author : counterparty;
    var toNation   = data.direction === 'a_to_b' ? counterparty : author;

    return { fromNation: fromNation, toNation: toNation, amount: amount };
}

/**
 * Trade Agreement types that can be negotiated as Diplomatic Initiatives.
 */
export const TRADE_AGREEMENT_TYPES = {
    goods_trade: {
        key: 'goods_trade',
        label: 'Goods & Services Trade Agreement',
        shortLabel: 'GTA',
        description: 'Product-specific trade contracts between two nations. Each article defines its own commodity flow, volume, price terms, and duration. Does not grant blanket tariff elimination — only the terms written into each article apply.',
        bilateral: true,
        required_articles: [],
        optional_articles: ['trade_flow', 'transfer', 'market_access', 'tariff_reduction', 'exit_terms', 'text_article'],
        icon: 'truck'
    },
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
        requires_mot: false
    },
    stockpile_purchase: {
        key: 'stockpile_purchase',
        label: 'Stockpile Purchase',
        shortLabel: 'SP',
        description: 'One-time bulk purchase or sale of stockpiled goods (grains, cash crops) from strategic reserves. Transfers happen immediately on enactment.',
        bilateral: true,
        required_articles: ['stockpile_transfer'],
        optional_articles: ['text_article'],
        icon: 'truck'
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
    { key: 'grains_staples',     label: 'Grains & Staples',          raw_resource: true  },
    { key: 'livestock_dairy',    label: 'Livestock & Dairy',         raw_resource: true  },
    { key: 'fruits_vegetables',  label: 'Fruits & Vegetables',       raw_resource: true  },
    { key: 'cash_crops',         label: 'Cash Crops & Plantation',   raw_resource: true  },
    { key: 'manufactured_goods', label: 'Manufactured Goods',       raw_resource: false },
    { key: 'technology',         label: 'Technology & Electronics', raw_resource: false },
    { key: 'arms',               label: 'Arms & Military Equipment', raw_resource: false }
];

// Lookup map for tradeable sectors
export var TRADEABLE_SECTOR_MAP = {};
for (var _tasi = 0; _tasi < TRADEABLE_SECTORS.length; _tasi++) {
    TRADEABLE_SECTOR_MAP[TRADEABLE_SECTORS[_tasi].key] = TRADEABLE_SECTORS[_tasi];
}
// Backward compatibility: old trade agreements may reference 'food_agriculture'
TRADEABLE_SECTOR_MAP['food_agriculture'] = { key: 'food_agriculture', label: 'Food & Agriculture', raw_resource: true };

/**
 * Article type definitions for trade agreements.
 * Each defines the schema of what data the article captures.
 */
export const TRADE_ARTICLE_TYPES = {
    duration: {
        key: 'duration',
        label: 'Duration',
        description: 'How long the agreement lasts.',
        repeatable: false,
        schema: {
            duration_type: 'permanent|fixed',
            duration_ticks: 'number',
            auto_renew: 'boolean',
            withdrawal_notice_ticks: 'number'
        }
    },

    sector_exemption: {
        key: 'sector_exemption',
        label: 'Sector Exemption',
        description: 'Exempt specific sectors from the FTA.',
        repeatable: true,
        applies_to: ['fta'],
        schema: {
            sector: 'string',
            reason: 'string'
        }
    },

    tariff_reduction: {
        key: 'tariff_reduction',
        label: 'Tariff Reduction',
        description: 'Reduce tariffs on a specific sector.',
        repeatable: true,
        applies_to: ['pta'],
        schema: {
            sector: 'string',
            direction: 'mutual|your_exports|their_exports',
            reduction_pct: 'number'
        }
    },

    supply_commitment: {
        key: 'supply_commitment',
        label: 'Supply Commitment',
        description: 'Guaranteed purchase commitment for a raw resource.',
        repeatable: true,
        applies_to: ['resource_supply'],
        schema: {
            sector: 'string',
            direction: 'we_buy|we_sell',
            commitment_pct: 'number'
        }
    },

    price_terms: {
        key: 'price_terms',
        label: 'Price Terms',
        description: 'How the resource price is determined.',
        repeatable: true,
        applies_to: ['resource_supply'],
        schema: {
            price_type: 'market|fixed|discounted|premium',
            modifier_pct: 'number'
        }
    },

    breach_penalty: {
        key: 'breach_penalty',
        label: 'Breach Penalty',
        description: 'Penalties if either party breaks the contract early.',
        repeatable: false,
        applies_to: ['resource_supply'],
        schema: {
            relations_penalty: 'number',
            reputation_penalty: 'number',
            financial_penalty: 'number'
        }
    },

    subsidized_sector: {
        key: 'subsidized_sector',
        label: 'Export Subsidy',
        description: 'Subsidize exports in a specific sector.',
        repeatable: false,
        applies_to: ['export_subsidy'],
        schema: {
            sector: 'string',
            subsidy_pct: 'number'
        }
    },

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

    aid_terms: {
        key: 'aid_terms',
        label: 'Aid Terms',
        description: 'The core financial terms: who gives, who receives, how much.',
        repeatable: false,
        applies_to: ['economic_aid'],
        schema: {
            donor_nation_id: 'uuid',
            annual_amount: 'number',
            gdp_cap_pct: 'number'
        }
    },

    aid_condition: {
        key: 'aid_condition',
        label: 'Condition',
        description: 'A stat-based condition the recipient must maintain for aid to continue.',
        repeatable: true,
        applies_to: ['economic_aid'],
        schema: {
            stat_key: 'string',
            operator: 'gte|lte',
            threshold: 'number',
            on_failure: 'suspend|terminate|reduce',
            grace_periods: 'number'
        }
    },

    tariff_surcharge: {
        key: 'tariff_surcharge',
        label: 'Tariff Surcharge',
        description: 'Impose an additional tariff on imports from the target nation in a specific sector.',
        repeatable: true,
        applies_to: ['retaliatory_tariff'],
        schema: {
            sector: 'string',
            surcharge_pct: 'number'
        }
    },

    stockpile_transfer: {
        key: 'stockpile_transfer',
        label: 'Stockpile Transfer',
        description: 'One-time bulk purchase/sale of stockpiled goods from strategic reserves.',
        repeatable: false,
        applies_to: ['stockpile_purchase'],
        schema: {
            sector: 'string',
            direction: 'we_buy|we_sell',
            quantity_value: 'number',
            price_per_tonne: 'number'
        }
    },

    text_article: {
        key: 'text_article',
        label: 'Text Article',
        description: 'Free-text article for flavor/RP. No mechanical effect.',
        repeatable: true,
        applies_to: ['fta', 'pta', 'resource_supply', 'export_subsidy', 'economic_aid', 'retaliatory_tariff', 'stockpile_purchase'],
        schema: {
            title: 'string',
            body: 'string'
        }
    }
};

// Keep keys + labels in sync with policyadmin.html's #b-sector dropdown.
// The bill modal's sector picker filters this list by which keys have at
// least one policy, so any sector the policy admin can save under has to
// be listed here or its policies are invisible to bill drafters.
export const MAJOR_SECTORS = [
    { key: 'FOUNDATIONAL',   label: 'Foundational',         icon: '📜'  },
    { key: 'ECONOMICS',      label: 'Economics',            icon: '💰' },
    { key: 'LABOR',          label: 'Labor',                icon: '👷' },
    { key: 'EDUCATION',      label: 'Education',            icon: '📚' },
    { key: 'ENERGY',         label: 'Energy',               icon: '⚡' },
    { key: 'HEALTHCARE',     label: 'Healthcare',           icon: '🏥' },
    { key: 'SOCIAL',         label: 'Social',               icon: '🤝' },
    { key: 'JUSTICE',        label: 'Justice',              icon: '⚖️' },
    { key: 'DEFENSE',        label: 'Defense',              icon: '🛡️' },
    { key: 'MILITARY',       label: 'Military & Security',  icon: '⚔️' },
    { key: 'TRANSPORTATION', label: 'Transportation',       icon: '🚄' },
    { key: 'GOVERNANCE',     label: 'Governance',           icon: '🏛️' },
    { key: 'IMMIGRATION',    label: 'Immigration',          icon: '🌍' },
    { key: 'INTERNATIONAL',  label: 'International',        icon: '🌐' },
    { key: 'TRADE',          label: 'Trade',                icon: '📦' },
    { key: 'PERMITS',        label: 'Construction Permits', icon: '🔨' }
];

// Stats stored as raw numbers (not 0-100 indices).
// debt is stored as raw dollars (88B = 88,000,000,000).
// All other stats (0-100 indices) use the default divisor of 50.
export const RAW_SCALING_DIVISORS = {
    population: 1_000_000,
    eligible_voters: 1_000_000,
    debt: 1_000_000_000
};

// Stats that must NEVER be modified by generic tick processors.
// Debt is driven exclusively by the budget system (surplus/deficit).
export const STAT_PROCESSOR_SKIP = new Set(['debt']);

// Nation stat columns with a CHECK constraint narrower than the
// generic 0–100 stat scale. Defaults to 100 when no entry exists.
export const NATION_STAT_CAP = {};
export function nationStatCap(key) { return NATION_STAT_CAP[key] ?? 100; }
