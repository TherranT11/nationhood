// js/game/tax-articles.js — Tax Article constants + helpers (SSoT)
//
// One source for:
//   * per-step side effects (approval, credit, gdp_growth, inflation)
//   * step size (3pp cuts, 2pp hikes)
//   * rate bounds (0–50%)
//   * valid-new-rate enumeration used by the draft modal dropdown
//   * step/effect computation used by the enactment handler
//
// Imported by bill.html (draft modal preview + article-card renderer)
// and js/game/bills.js (enactment). Any tuning of numbers happens here.

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
// (corporate, sales, property) add their own entry here — the rest of
// the pipeline is tax-key-agnostic.
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
});

export const TAX_KEY_LABELS = Object.freeze({
    income_tax:    'Income Tax',
    corporate_tax: 'Corporate Tax',
    sales_tax:     'Sales Tax',
});

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
// two callers. Returns { gov_approval, credit, gdp_growth, inflation }.
export function computeTaxArticleEffects(taxKey, direction, steps) {
    const perStep = TAX_ARTICLE_EFFECTS[taxKey]?.[direction];
    const n = Number(steps) || 0;
    if (!perStep || n <= 0) {
        return { gov_approval: 0, credit: 0, gdp_growth: 0, inflation: 0 };
    }
    return {
        gov_approval: perStep.gov_approval * n,
        credit:       perStep.credit       * n,
        gdp_growth:   perStep.gdp_growth   * n,
        inflation:    perStep.inflation    * n,
    };
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
