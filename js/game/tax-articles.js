// js/game/tax-articles.js — Tax Article SSoT (RETIRED by alpha refactor)
//
// PHASE 7e (alpha stats refactor):
//   The four tax columns (income_tax, corporate_tax, sales_tax,
//   property_tax) are deleted by the alpha refactor with no replacement
//   — the alpha-19 schema treats `nation.budget` as the canonical
//   revenue stream rather than per-bracket rates. This module's whole
//   purpose (drafting tax-rate-change articles, computing per-step
//   effects on credit / inflation / gdp_growth, projecting revenue
//   delta) loses its underlying mechanism.
//
//   The module is preserved as a stub so that callers in
//   bill.html, laws.html, and js/game/bills.js keep importing without
//   ReferenceError. Every function returns a safe no-op:
//
//     getValidNewRates           → []  (no rate changes available)
//     computeTaxArticleEffects   → {}  (no side effects)
//     computeTaxArticleOngoingCost → 0  (no revenue delta)
//     validateTaxArticlePayload  → { valid: false, ... }
//
//   Reintroducing tax brackets against alpha-19 columns is a future
//   fiscal-redesign phase; if/when that lands, restore TAX_RATE_MIN/MAX,
//   TAX_STEP_PP, TAX_ARTICLE_EFFECTS with the new column names and put
//   the live computeTaxArticleEffects back.

export const TAX_RATE_MIN = 0;
export const TAX_RATE_MAX = 50;

export const TAX_STEP_PP = Object.freeze({ cut: 3, hike: 2 });

// All effect-tables empty — no tax keys are supported in alpha schema.
export const TAX_ARTICLE_EFFECTS = Object.freeze({});

export const SUPPORTED_TAX_KEYS = Object.freeze([]);

export const TAX_KEY_LABELS = Object.freeze({});

export const TAX_EFFECT_LABELS = Object.freeze({});

// Empty list — no tax-effect keys map to nation columns post-alpha.
export const TAX_EFFECT_NATION_COLUMNS = Object.freeze([]);

export function getValidNewRates(_currentRate, _direction) {
    return [];
}

export function computeTaxArticleEffects(_taxKey, _direction, _steps) {
    return {};
}

export function computeTaxArticleOngoingCost(_taxKey, _newRate, _nation) {
    return 0;
}

export function validateTaxArticlePayload(_taxKey, _oldRate, _newRate) {
    return {
        valid: false,
        reason: 'Tax-bracket adjustments are retired in the alpha schema; reintroduce when a tax-revenue model is rebuilt against alpha columns.'
    };
}
