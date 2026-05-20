// Shared corporation-valuation and property-cost math. Single source of
// truth for three distinct surfaces:
//
//   1. Valuation pipeline — computePropertyValue / computeEquipmentValue
//      / computeFinanceReceivableValue / computeCorpValuationBreakdown
//      / computeCorpValuation. Used by bankruptcy (corp-operations.html,
//      corp-operations-shipping.html), Government Bailout authoring
//      (laws.html), bill enactment (bills.js), and the tick processor.
//      The tick processor cannot import this module (Deno edge runtime
//      doesn't share the browser graph), so the valuation chain is
//      mirrored inline in supabase/functions/advance-tick/index.ts —
//      keep that copy in sync if the formulas below change.
//
//   2. Property-cost helpers — nationalHqValue / nationalHqQuality and
//      the four assembly-plant value functions (lightAssemblyPlantValue
//      / engineAssemblyPlantValue / aircraftAssemblyFacilityValue /
//      heavyManufacturingPlantValue) plus boundedCostMultiplier. These
//      are client-only paths: corp-nation-select.html reads them at
//      corp founding, expansion.html reads them for the Build tables.
//      The tick processor never recomputes these (purchase_price is
//      persisted on the corp_properties row at creation), so no
//      server-side mirror is required.
//
//   3. Entrepreneur-facing valuation — computeEntrepreneurValuation.
//      The seed/market figure shown on entrepreneur-dashboard.html,
//      entrepreneur-corporations.html and entrepreneur-corp.html.
//      Deliberately NOT the section-1 engine valuation ("the founding
//      cash was already spent; we don't invent a valuation"); it is
//      display-only and never feeds net worth or the tick processor.

// National HQ value/quality formulas. The HQ is now persisted as a
// real corp_properties row at corp founding (see corp-nation-select.html)
// and backfilled for existing corps via
// sql/migrations/20260711_persist_national_hq.sql. These formulas remain
// exported so the founding flow + the backfill migration can share the
// same numbers; valuation/maintenance/bankruptcy/etc. read the row
// directly and don't need a synthetic helper anymore.
export function nationalHqValue(sol) {
    const s = Math.max(0, Math.min(100, Number(sol) || 0));
    return Math.round(50_000_000 + 25_000_000 * (s / 100));
}
export function nationalHqQuality(control) {
    const c = Math.max(0, Math.min(100, Number(control) || 50));
    return Math.round(70 + c * 0.3);
}

// Light Assembly Plant — the founding building for an Aviation
// Manufacturing corp, and the cheapest tier purchasable on
// Expansion. Cost scales on the host nation's cost_of_living via
// boundedCostMultiplier (same shape used by Regional HQ + the other
// three assembly tiers). Single source of truth: corp-nation-select.html
// uses it at corp founding, expansion.html uses it for the Build
// Light Assembly table cost column.
export const LIGHT_ASSEMBLY_BASE_COST      = 175_000_000;
export const ENGINE_ASSEMBLY_BASE_COST     = 225_000_000;
export const AIRCRAFT_ASSEMBLY_BASE_COST   = 225_000_000;
export const HEAVY_MANUFACTURING_BASE_COST = 375_000_000;

// base × clamp(stat/50, 0.5, 2.0). At stat 50 multiplier is exactly 1.0;
// below stat 25 the floor (×0.5) kicks in, above stat 100 the ceiling
// (×2.0) caps it. Used by every "buildable property" cost helper.
export function boundedCostMultiplier(stat) {
    const s = Math.max(0, Math.min(100, Number(stat) || 0));
    return Math.max(0.5, Math.min(2.0, s / 50));
}

export function lightAssemblyPlantValue(costOfLiving) {
    return Math.round(LIGHT_ASSEMBLY_BASE_COST * boundedCostMultiplier(costOfLiving));
}
export function engineAssemblyPlantValue(costOfLiving) {
    return Math.round(ENGINE_ASSEMBLY_BASE_COST * boundedCostMultiplier(costOfLiving));
}
export function aircraftAssemblyFacilityValue(costOfLiving) {
    return Math.round(AIRCRAFT_ASSEMBLY_BASE_COST * boundedCostMultiplier(costOfLiving));
}
export function heavyManufacturingPlantValue(costOfLiving) {
    return Math.round(HEAVY_MANUFACTURING_BASE_COST * boundedCostMultiplier(costOfLiving));
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
    const breakdown = { loans: 0, insurance: 0, total: 0 };
    for (const p of (positions || [])) {
        const reqType = (p?.finance_loan_requests?.request_type || p?.request_type || 'loan').toLowerCase();
        const principal = Math.max(0, Number(p?.principal || 0));
        const remainingPrincipal = Math.max(0, Number(p?.remaining_principal || 0));
        if (reqType === 'insurance') {
            // Insurance "coverage" is contingent risk, not a receivable asset.
            breakdown.insurance += principal;
            continue;
        }
        // Default to loan logic: outstanding principal is the receivable.
        breakdown.loans += remainingPrincipal;
    }
    breakdown.total = breakdown.loans;
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

// See header §3. Display-only seed/market valuation for the
// entrepreneur surface — public → MARKET CAP (share_price ×
// shares_outstanding); private → SEED CAPITAL (immutable
// starting_capital); otherwise none. Returns the raw figure + kind so
// each surface formats/labels itself; the rule lives only here.
export function computeEntrepreneurValuation(corp) {
    const c = corp || {};
    if (c.listing === 'public' && c.share_price != null && c.shares_outstanding != null) {
        return { kind: 'market', amount: Number(c.share_price) * Number(c.shares_outstanding) };
    }
    if (c.listing !== 'public' && c.starting_capital != null) {
        return { kind: 'seed', amount: Number(c.starting_capital) };
    }
    return { kind: 'none', amount: null };
}

// Live cash-on-hand for an entrepreneur corp. treasury_cash is the
// authoritative pool for both listings post-20270182; legacy rows
// (NULL treasury_cash) fall back to starting_capital so the UI is
// never blank. Single source of truth — every "cash on hand" display
// across entrepreneur-* pages reads from here.
export function getEntrepreneurCorpCash(corp) {
    const c = corp || {};
    const t = Number(c.treasury_cash);
    if (Number.isFinite(t)) return t;
    const s = Number(c.starting_capital);
    return Number.isFinite(s) ? s : 0;
}
