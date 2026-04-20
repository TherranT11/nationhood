// Shared client-side mirror of advance-corp-tick subsidiary revenue math.
// Keep this in sync with supabase/functions/advance-corp-tick/index.ts.

export const SUB_REVENUE_BASE = 0.02;
export const SUB_GDP_NEUTRAL = 30;
export const SUB_DEFAULT_REPUTATION = 25;
export const SUB_MAX_LOSS_RATE = 0.05;
export const SUB_OPERATING_OVERHEAD = 200_000;
export const SUB_PARENT_REP_NEUTRAL = 50;
export const SUB_PARENT_REP_MIN = 0.3;
export const SUB_PARENT_REP_MAX = 1.7;

export function getParentRepMultiplier(parentReputation = SUB_PARENT_REP_NEUTRAL) {
    const parentRep = Number(parentReputation ?? SUB_PARENT_REP_NEUTRAL);
    return Math.max(
        SUB_PARENT_REP_MIN,
        Math.min(SUB_PARENT_REP_MAX, (parentRep - SUB_PARENT_REP_NEUTRAL) / 100 + 1)
    );
}

export function computeSubsidiaryTickDelta({
    subCash = 0,
    gdpGrowth = 50,
    parentReputation = SUB_PARENT_REP_NEUTRAL,
} = {}) {
    const cash = Number(subCash || 0);
    const gdp = Number(gdpGrowth ?? 50);

    const baseRepMult = SUB_DEFAULT_REPUTATION / 100;
    const parentRepMult = getParentRepMultiplier(parentReputation);

    const investCash = Math.max(0, cash);
    const gdpMod = (gdp - SUB_GDP_NEUTRAL) / 100;
    const investmentReturn = Math.round(
        investCash * SUB_REVENUE_BASE * (1 + gdpMod) * baseRepMult * parentRepMult
    );

    const overheadMult = Math.max(0.1, 1 + (50 - gdp) / 100);
    const overhead = Math.round(SUB_OPERATING_OVERHEAD * overheadMult);

    let netDelta = investmentReturn - overhead;
    const maxLoss = Math.max(SUB_OPERATING_OVERHEAD, Math.round(Math.abs(cash) * SUB_MAX_LOSS_RATE));
    if (netDelta < 0) netDelta = Math.max(netDelta, -maxLoss);

    return {
        investmentReturn,
        overhead,
        maxLoss,
        netDelta,
        gdp,
        gdpMod,
        overheadMult,
        parentRepMult,
        parentReputation: Number(parentReputation ?? SUB_PARENT_REP_NEUTRAL),
    };
}
