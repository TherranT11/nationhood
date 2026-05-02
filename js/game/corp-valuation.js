// Shared corporation-valuation math.
// Single source of truth for: bankruptcy (corp-operations.html,
// corp-operations-shipping.html), Government Bailout authoring
// (laws.html), and bill enactment (bills.js).
//
// The matching server-side copy lives in supabase/functions/advance-tick/
// index.ts — kept inline there because the Deno edge runtime does not
// share the browser module graph. Keep that copy in sync if the formula
// changes here.

// National HQ value/quality formulas. The HQ is not persisted as a
// corp_properties row — it is synthesized from the home nation's stats
// (see expansion.html#nationalHqValue and the comment on the NATIONAL HQ
// card). Every valuation surface that wants a complete picture must mix
// this synthetic row into the properties array; without it, valuation
// undercounts by $50–$75M.
//
// Formulas mirror expansion.html exactly (single source of truth lives
// here now; expansion.html's local copies are kept for the asset-card
// display path but reduce to the same numbers).
export function nationalHqValue(sol) {
    const s = Math.max(0, Math.min(100, Number(sol) || 0));
    return Math.round(50_000_000 + 25_000_000 * (s / 100));
}
export function nationalHqQuality(control) {
    const c = Math.max(0, Math.min(100, Number(control) || 50));
    return Math.round(70 + c * 0.3);
}

// Build the synthetic National HQ row that valuation math expects in the
// properties array. Returns null when the nation row is missing or has
// no nation_id binding the corp — callers should treat that as "no HQ
// row to add" rather than failing the whole calc.
//
// The shape matches a real corp_properties row closely enough for
// computePropertyValue: { purchase_price, condition, ...metadata }.
export function synthesizeNationalHq(nation) {
    if (!nation || !nation.id) return null;
    return {
        id:             '__national_hq__',
        synthetic:      true,
        purchase_price: nationalHqValue(nation.standard_of_living),
        condition:      nationalHqQuality(nation.control),
        role:           'national_hq',
        nation_id:      nation.id,
    };
}

// Return a new array containing the synthetic National HQ + all real
// properties. Convenience wrapper so callers don't repeat the spread.
// Skips silently if the nation row isn't supplied (e.g. corp without
// a home nation, or a transient render before the fetch resolves).
export function withNationalHq(properties, nation) {
    const hq = synthesizeNationalHq(nation);
    const real = Array.isArray(properties) ? properties : [];
    return hq ? [hq, ...real] : real;
}

export function computePropertyValue(properties) {
    let total = 0;
    for (const p of (properties || [])) {
        total += Math.round(Number(p.purchase_price || 0) * (Number(p.condition || 0) / 100));
    }
    return total;
}

// Ships depreciate by age and condition. Straight-line 5%/yr, floors at 20%
// scrap value; 12 ticks = 1 year. Vessels with status 'for_sale' are excluded
// (listed for disposal, not operating equipment). Ships still under
// construction live in vessel_orders, not corp_vessels, so they are naturally
// excluded until delivery.
export function computeEquipmentValue(vessels, currentTick) {
    let total = 0;
    const tick = Number(currentTick || 0);
    for (const v of (vessels || [])) {
        if (v.status === 'for_sale') continue;
        const years = Math.max(0, Math.floor((tick - Number(v.built_at_tick || 0)) / 12));
        const ageFactor = Math.max(0.2, 1 - 0.05 * years);
        const condition = Number(v.condition || 0) / 100;
        total += Math.round(Number(v.purchase_price || 0) * ageFactor * condition);
    }
    return total;
}

export function computeFinanceReceivableValue(positions) {
    const breakdown = { loans: 0, bonds: 0, insurance: 0, total: 0 };
    for (const p of (positions || [])) {
        const reqType = (p?.finance_loan_requests?.request_type || p?.request_type || 'loan').toLowerCase();
        const principal = Math.max(0, Number(p?.principal || 0));
        const remainingPrincipal = Math.max(0, Number(p?.remaining_principal || 0));
        if (reqType === 'insurance') {
            // Insurance "coverage" is contingent risk, not a receivable asset.
            breakdown.insurance += principal;
            continue;
        }
        if (reqType === 'bond') {
            // Some bond lifecycles track remaining principal amortization; some
            // carry face principal until maturity.
            breakdown.bonds += remainingPrincipal > 0 ? remainingPrincipal : principal;
            continue;
        }
        // Default to loan logic: outstanding principal is the receivable.
        breakdown.loans += remainingPrincipal;
    }
    breakdown.total = breakdown.loans + breakdown.bonds;
    return breakdown;
}

export function computeCorpValuationBreakdown({ cash, loans, properties, propertyValue, vessels, equipmentValue, financeReceivables, currentTick }) {
    const propVal = propertyValue != null ? Number(propertyValue) : computePropertyValue(properties);
    const equipVal = equipmentValue != null ? Number(equipmentValue) : computeEquipmentValue(vessels, currentTick);
    const receivables = Math.max(0, Number(financeReceivables || 0));
    const liabilities = Number(loans || 0);
    const valuationBasis = Number(cash || 0) + propVal + equipVal + receivables - liabilities;
    return {
        cash: Number(cash || 0),
        propertyValue: propVal,
        equipmentValue: equipVal,
        financeReceivables: receivables,
        liabilities,
        valuationBasis,
        valuation: Math.round(valuationBasis * 1.30),
    };
}

export function computeCorpValuation({ cash, loans, properties, propertyValue, vessels, equipmentValue, financeReceivables, currentTick }) {
    return computeCorpValuationBreakdown({ cash, loans, properties, propertyValue, vessels, equipmentValue, financeReceivables, currentTick }).valuation;
}
