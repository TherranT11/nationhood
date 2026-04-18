// Shared corporation-valuation math.
// Single source of truth for: bankruptcy (corp-operations.html,
// corp-operations-shipping.html), Government Bailout authoring
// (laws.html), and bill enactment (bills.js).
//
// The matching server-side copy lives in supabase/functions/advance-tick/
// index.ts — kept inline there because the Deno edge runtime does not
// share the browser module graph. Keep that copy in sync if the formula
// changes here.

export function computePropertyValue(properties) {
    let total = 0;
    for (const p of (properties || [])) {
        total += Math.round(Number(p.purchase_price || 0) * (Number(p.condition || 0) / 100));
    }
    return total;
}

export function computeCorpValuation({ cash, loans, properties, propertyValue }) {
    const propVal = propertyValue != null ? Number(propertyValue) : computePropertyValue(properties);
    return Math.round((Number(cash || 0) + propVal - Number(loans || 0)) * 1.30);
}
