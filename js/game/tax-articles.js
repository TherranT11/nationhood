// js/game/tax-articles.js — Tax Article constants + helpers (SSoT)
//
// One source for:
//   * per-step side effects (approval, credit, gdp_growth, inflation)
//   * step size (3pp cuts, 2pp hikes)
//   * rate bounds (0–50%)
//   * valid-new-rate enumeration used by the draft modal dropdown
//   * step/effect computation used by the enactment handler
//   * projected ongoing budget impact (revenue gained/lost per month)
//
// Imported by bill.html (draft modal preview + article-card renderer),
// laws.html (draft preview), and js/game/bills.js (enactment +
// computeBillCostTotals). Any tuning of numbers happens here.

import { calculateNationalBudget } from './budget.js';

export const TAX_RATE_MIN = 0;
export const TAX_RATE_MAX = 50;

// Step sizes are asymmetric on purpose: cuts are popular but costly, hikes
// are unpopular but revenue-positive. The asymmetry (3pp vs 2pp) makes the
// cumulative revenue math work out more symmetrically per step.
export const TAX_STEP_PP = Object.freeze({
    cut:  3,
    hike: 2,
});

// Per-step effects by tax key + direction. When more tax types land
// (sales, property) add their own entry here — the rest of the pipeline
// is tax-key-agnostic.
export const TAX_ARTICLE_EFFECTS = Object.freeze({
    income_tax: Object.freeze({
        cut: Object.freeze({
            gov_approval: +2,
            credit:       -2,
            gdp_growth:   +0.5,
            inflation:    +0.3,
        }),
        hike: Object.freeze({
            gov_approval: -3,
            credit:       +1,
            gdp_growth:   -0.5,
            inflation:    -0.3,
        }),
    }),
    corporate_tax: Object.freeze({
        cut: Object.freeze({
            gov_approval: +1,
            credit:       -2,
            gdp_growth:   +1.0,
            inflation:    0,
        }),
        hike: Object.freeze({
            gov_approval: -1,
            credit:       +1,
            gdp_growth:   -1.0,
            inflation:    0,
        }),
    }),
    // Sales tax is the only tax whose inflation direction is INVERTED
    // versus income/corporate. Cutting sales tax literally removes pp
    // from sticker prices → CPI falls; hiking it raises prices → CPI
    // rises. Magnitude (±0.5) larger than income's ±0.3 because the
    // effect is mechanical (on the receipt), not transmitted via demand.
    // Highest gov_approval magnitude (±4) since the tax is regressive
    // and visible at every transaction.
    sales_tax: Object.freeze({
        cut: Object.freeze({
            gov_approval: +4,
            credit:       -2,
            gdp_growth:   +0.3,
            inflation:    -0.5,
        }),
        hike: Object.freeze({
            gov_approval: -4,
            credit:       +1,
            gdp_growth:   -0.3,
            inflation:    +0.5,
        }),
    }),
    // Property tax taxes asset ownership (land + buildings). Direct effect
    // on housing_affordability — cuts make housing cheaper to hold/rent,
    // hikes pass through to renters and add to mortgage costs. The voter
    // bloc system (electorate.js: urban_suburban) already cascades from
    // housing_affordability into approval, so the flat ±2 gov_approval
    // here understates total political impact for housing-sensitive
    // nations. No inflation effect — property tax doesn't ride on
    // consumer prices.
    property_tax: Object.freeze({
        cut: Object.freeze({
            gov_approval:          +2,
            credit:                -2,
            gdp_growth:            +0.5,
            inflation:             0,
            housing_affordability: +1,
        }),
        hike: Object.freeze({
            gov_approval:          -2,
            credit:                +1,
            gdp_growth:            -0.5,
            inflation:             0,
            housing_affordability: -1,
        }),
    }),
});

// Tax keys that have effects defined — feeds the draft modal's tax-type
// selector.
export const SUPPORTED_TAX_KEYS = Object.freeze(['income_tax', 'corporate_tax', 'sales_tax', 'property_tax']);

export const TAX_KEY_LABELS = Object.freeze({
    income_tax:    'Income Tax',
    corporate_tax: 'Corporate Tax',
    sales_tax:     'Sales Tax',
    property_tax:  'Property Tax',
});

// Effect-key → display label, used by the article-card / preview UI to
// render each effect row. Keys here must match the keys used in the
// per-step entries above. Adding a new effect dimension (e.g.,
// urbanization for a future tax) only requires adding it here + to a
// tax's per-step block.
export const TAX_EFFECT_LABELS = Object.freeze({
    gov_approval:          'Gov Approval',
    credit:                'Credit',
    gdp_growth:            'GDP Growth',
    inflation:             'Inflation',
    housing_affordability: 'Housing Affordability',
});

// Effect keys that map directly to a nations.<column>. Used by the
// enactment handler to know which keys to read+write to the nations
// table (vs. gov_approval, which routes through adjust_momentum →
// gov_approval_events). New numeric stat effects join this list.
export const TAX_EFFECT_NATION_COLUMNS = Object.freeze([
    'credit',
    'gdp_growth',
    'inflation',
    'housing_affordability',
]);

// Enumerate the valid new rates a player can pick given their current rate
// and chosen direction. Cuts step down in 3pp increments until hitting 0;
// hikes step up in 2pp increments until hitting TAX_RATE_MAX.
export function getValidNewRates(currentRate, direction) {
    const cur = Number(currentRate) || 0;
    const step = TAX_STEP_PP[direction];
    if (!step) return [];
    const rates = [];
    if (direction === 'cut') {
        for (let r = cur - step; r >= TAX_RATE_MIN; r -= step) rates.push(r);
    } else {
        for (let r = cur + step; r <= TAX_RATE_MAX; r += step) rates.push(r);
    }
    return rates;
}

// Compute total side effects for a (taxKey, direction, steps) triple.
// Used by the preview panel AND the enactment handler — one calculation,
// two callers. Returns an object keyed by whatever effect dimensions
// the tax defines (gov_approval, credit, gdp_growth, inflation, plus
// any tax-specific extras like housing_affordability). Callers must
// not assume a fixed shape — iterate Object.entries(fx).
export function computeTaxArticleEffects(taxKey, direction, steps) {
    const perStep = TAX_ARTICLE_EFFECTS[taxKey]?.[direction];
    const n = Number(steps) || 0;
    if (!perStep || n <= 0) return {};
    const result = {};
    for (const [key, val] of Object.entries(perStep)) {
        result[key] = val * n;
    }
    return result;
}

// Compute the bill's ongoing budget impact from a tax rate change, in
// MILLIONS of dollars per month ($M/mo) — matching the convention used
// by computeBillCostTotals and funding-article base_cost. Positive =
// ongoing cost (revenue lost from a cut); negative = ongoing relief
// (revenue gained from a hike).
//
// Implementation calls calculateNationalBudget twice — once with current
// rates, once with the new rate substituted — so this helper stays in
// sync with whatever multipliers / collection-rate logic budget.js uses.
// SSoT: budget.js owns the formula; we just take the delta and convert
// raw dollars → $M in one place so every caller gets consistent units.
//
// Returns 0 if nation is missing (caller should treat as "not yet
// computable" — e.g., during initial render before nation loads).
export function computeTaxArticleOngoingCost(taxKey, newRate, nation) {
    if (!nation || !taxKey) return 0;
    const cur    = calculateNationalBudget(nation);
    const future = calculateNationalBudget({ ...nation, [taxKey]: Number(newRate) });
    // grossRevenue is raw dollars/year. Divide by 12 for monthly, by 1e6 for $M.
    const monthlyRevenueDeltaMillions = (future.grossRevenue - cur.grossRevenue) / 12 / 1e6;
    // Bill-cost convention: positive = budget gets worse. Revenue lost
    // (cut) makes the budget worse, so flip the sign of the revenue delta.
    return -monthlyRevenueDeltaMillions;
}

// Validate an effect_data payload before insert / on enactment.
// Returns { valid: boolean, reason?: string, direction?, steps? }.
export function validateTaxArticlePayload(taxKey, oldRate, newRate) {
    if (!TAX_ARTICLE_EFFECTS[taxKey]) {
        return { valid: false, reason: 'Unknown tax key: ' + taxKey };
    }
    const o = Number(oldRate), n = Number(newRate);
    if (!Number.isFinite(o) || !Number.isFinite(n)) {
        return { valid: false, reason: 'Rates must be numbers' };
    }
    if (n < TAX_RATE_MIN || n > TAX_RATE_MAX) {
        return { valid: false, reason: 'New rate out of range' };
    }
    const delta = n - o;
    if (delta === 0) return { valid: false, reason: 'No change' };
    const direction = delta < 0 ? 'cut' : 'hike';
    const step = TAX_STEP_PP[direction];
    if (Math.abs(delta) % step !== 0) {
        return { valid: false, reason: `Must be a multiple of ${step}pp` };
    }
    const steps = Math.abs(delta) / step;
    return { valid: true, direction, steps };
}
