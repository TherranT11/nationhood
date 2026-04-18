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

export function computeCorpValuation({ cash, loans, properties, propertyValue, vessels, equipmentValue, currentTick }) {
    const propVal = propertyValue != null ? Number(propertyValue) : computePropertyValue(properties);
    const equipVal = equipmentValue != null ? Number(equipmentValue) : computeEquipmentValue(vessels, currentTick);
    return Math.round((Number(cash || 0) + propVal + equipVal - Number(loans || 0)) * 1.30);
}
