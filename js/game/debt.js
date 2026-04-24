// js/game/debt.js — Debt & Deficit System (v1-MANUAL)
//
// Per-tick government borrowing loop. Splits each nation's deficit into
// a bond portion (offered to Investment Corps via Deal Flow) and a
// printed portion (added to inflation). Bonds that don't sell within
// 3 ticks auto-print at expiry.
//
// Stat ownership recap:
//   * inflation       — additive writer here (printed_portion / GDP × multiplier)
//   * credit          — per-tick writer here via calculateCreditDeterioration
//   * currency_strength — NOT written here (cascades from inflation via existing
//                         trade subsystem and stat connections)
//   * nations.debt    — kept in sync with SUM(active_holdings.principal) by
//                       buy_bond RPC and processBondMaturitiesTick below
//
// Order matters when these are called per nation each tick:
//   1. processBondMaturitiesTick   — pay back maturing principals
//   2. processBondCouponsTick      — pay per-tick coupons to holders
//   3. processBondOfferExpiryTick  — convert unfilled offers to printing
//   4. processDebtTick             — calculate deficit, post new offer, print remainder

import { calculateCreditDeterioration } from './sovereign-default.js';

// ════════════════════════════════════════════════════════════════════════════
//  CONFIG
// ════════════════════════════════════════════════════════════════════════════

export const DEBT_CONFIG = Object.freeze({
    INFLATION_PER_PRINT_PCT: 25,    // start safe; bump to 30-40 if too slow
    CREDIT_RECOVERY_RATE:    0.1,
    BOND_TERM_TICKS:         36,
    BOND_OFFER_EXPIRY_TICKS: 3,
});

// Tiered bond ratio. First tier whose min_credit is satisfied wins.
// Same SSoT shape used by the Deal Flow UI to display "what fraction
// of a deficit can this nation expect to borrow vs. print."
export const BOND_RATIO_TIERS = Object.freeze([
    { min_credit: 70, ratio: 0.95 },
    { min_credit: 40, ratio: 0.60 },
    { min_credit: 20, ratio: 0.20 },
    { min_credit:  5, ratio: 0.05 },
    { min_credit:  0, ratio: 0.00 },
]);

// ════════════════════════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════════════════════════

export function getBondRatio(credit) {
    const c = Number(credit) || 0;
    for (const tier of BOND_RATIO_TIERS) {
        if (c >= tier.min_credit) return tier.ratio;
    }
    return 0;
}

// Per-tick coupon rate locked at issuance based on issuer's credit.
// Mirrors budget.js:51's annual interest formula divided by 12 ticks/year:
//   annual = clamp(0.15 - credit × 0.0013, 0.02, 0.18)
//   per_tick = annual / 12
// Range: credit 100 → ~0.0014/tick (≈1.7% annual)
//        credit 50  → ~0.0070/tick (≈8.5% annual)
//        credit 0   → ~0.0125/tick (≈15%  annual)
export function creditToCouponRate(credit) {
    const c = Number(credit) || 0;
    const annual = Math.min(0.18, Math.max(0.02, 0.15 - c * 0.0013));
    // Round to 5 dp to match the finance_loan_requests.coupon_rate column precision.
    return Math.round((annual / 12) * 100000) / 100000;
}

// ════════════════════════════════════════════════════════════════════════════
//  PER-TICK PROCESSORS — call in order from the tick processor.
// ════════════════════════════════════════════════════════════════════════════

// (1) Maturities: pay back principal in full on holdings reaching matures_at_tick.
// Issuer pays principal out of budget_reserves; holder receives it as cash.
// nations.debt is decremented atomically to stay in sync with active holdings.
export async function processBondMaturitiesTick(supabase, nation, currentTick) {
    const { data: due, error } = await supabase
        .from('bond_holdings')
        .select('id, holder_faction_id, principal')
        .eq('issuer_nation_id', nation.id)
        .eq('matured', false)
        .lte('matures_at_tick', currentTick);
    if (error) {
        console.error(`[Debt] maturity fetch failed for ${nation.name}:`, error.message);
        return { paid: 0, totalPrincipal: 0 };
    }
    if (!due || due.length === 0) return { paid: 0, totalPrincipal: 0 };

    let totalPrincipal = 0;
    for (const h of due) {
        const principal = Number(h.principal) || 0;
        if (principal <= 0) continue;

        const { error: nErr } = await supabase.from('nations').update({
            budget_reserves: Math.max(0, Number(nation.budget_reserves || 0) - principal),
            debt:            Math.max(0, Number(nation.debt || 0) - principal),
        }).eq('id', nation.id);
        if (nErr) {
            console.warn(`[Debt] nation cash debit on maturity failed for ${nation.name}:`, nErr.message);
            continue;
        }
        // Mirror locally so subsequent iterations in this tick see fresh values.
        nation.budget_reserves = Math.max(0, Number(nation.budget_reserves || 0) - principal);
        nation.debt            = Math.max(0, Number(nation.debt || 0) - principal);

        const { data: holderRow } = await supabase.from('factions')
            .select('corp_cash_reserves').eq('id', h.holder_faction_id).maybeSingle();
        const newHolderCash = Math.max(0, Number(holderRow?.corp_cash_reserves || 0) + principal);
        const { error: hErr } = await supabase.from('factions')
            .update({ corp_cash_reserves: newHolderCash })
            .eq('id', h.holder_faction_id);
        if (hErr) {
            console.warn(`[Debt] holder credit on maturity failed:`, hErr.message);
            continue;
        }

        await supabase.from('bond_holdings').update({
            matured: true, matured_at_tick: currentTick,
        }).eq('id', h.id).then(({ error: mErr }) => {
            // Loud on failure: if this UPDATE fails after the principal was
            // paid, the row still has matured=false and matures_at_tick<=now,
            // so next tick's query re-matches and double-pays the holder.
            // No automatic unwind — log and surface for manual intervention.
            if (mErr) {
                console.error(
                    `[Debt] CRITICAL: bond_holdings mark-matured FAILED for holding ${h.id} ` +
                    `after paying $${principal} principal — next tick will re-pay. ` +
                    `Manually update this row. Err: ${mErr.message}`
                );
            }
        });

        totalPrincipal += principal;
    }
    return { paid: due.length, totalPrincipal };
}

// (2) Coupons: pay per-tick interest on every active holding.
// One UPDATE per holder per tick (coalesced to handler-level batch logging).
export async function processBondCouponsTick(supabase, nation, currentTick) {
    const { data: holdings, error } = await supabase
        .from('bond_holdings')
        .select('holder_faction_id, principal, coupon_rate')
        .eq('issuer_nation_id', nation.id)
        .eq('matured', false);
    if (error) {
        console.error(`[Debt] coupon fetch failed for ${nation.name}:`, error.message);
        return { totalCoupon: 0 };
    }
    if (!holdings || holdings.length === 0) return { totalCoupon: 0 };

    // Aggregate per-holder so a corp with N holdings receives one credit.
    const perHolder = new Map();
    let totalCoupon = 0;
    for (const h of holdings) {
        const coupon = Math.round((Number(h.principal) || 0) * (Number(h.coupon_rate) || 0));
        if (coupon <= 0) continue;
        perHolder.set(h.holder_faction_id, (perHolder.get(h.holder_faction_id) || 0) + coupon);
        totalCoupon += coupon;
    }
    if (totalCoupon === 0) return { totalCoupon: 0 };

    // Debit issuer once for the aggregate.
    //
    // v2 GAP (documented, not fixed): when budget_reserves < totalCoupon
    // the Math.max floors at 0 while holders still get paid in full. The
    // nation effectively prints money to cover the shortfall without the
    // inflation hit. Correct treatment is either (a) print the shortfall
    // AND apply the corresponding inflation, or (b) trigger the sovereign-
    // default path. Both are v2 — v1 flags fiscal pressure only via the
    // deficit loop and credit deterioration, not via coupon default.
    const newReserves = Math.max(0, Number(nation.budget_reserves || 0) - totalCoupon);
    const { error: nErr } = await supabase.from('nations')
        .update({ budget_reserves: newReserves }).eq('id', nation.id);
    if (nErr) {
        console.warn(`[Debt] coupon debit on issuer failed for ${nation.name}:`, nErr.message);
        return { totalCoupon: 0 };
    }
    nation.budget_reserves = newReserves;

    // Credit each holder.
    for (const [holderId, coupon] of perHolder.entries()) {
        const { data: holderRow } = await supabase.from('factions')
            .select('corp_cash_reserves').eq('id', holderId).maybeSingle();
        const newCash = Number(holderRow?.corp_cash_reserves || 0) + coupon;
        const { error: hErr } = await supabase.from('factions')
            .update({ corp_cash_reserves: newCash }).eq('id', holderId);
        if (hErr) console.warn(`[Debt] coupon credit failed for holder ${holderId}:`, hErr.message);
    }

    return { totalCoupon };
}

// (3) Offer expiry: any open bond request past its expires_tick has its
// unfilled principal converted to printing. Inflation hit is applied
// here (not at issuance) — this is the "we couldn't sell the bonds, so
// we had to print the rest" path. Bond requests live in
// finance_loan_requests with request_type='bond' so the existing Deal
// Flow UI renders them without modification.
export async function processBondOfferExpiryTick(supabase, nation, currentTick) {
    const { data: expired, error } = await supabase
        .from('finance_loan_requests')
        .select('id, principal_remaining, amount')
        .eq('issuer_nation_id', nation.id)
        .eq('request_type', 'bond')
        .eq('status', 'open')
        .lte('expires_tick', currentTick);
    if (error) {
        console.error(`[Debt] offer expiry fetch failed for ${nation.name}:`, error.message);
        return { expired: 0, forcedPrinted: 0 };
    }
    if (!expired || expired.length === 0) return { expired: 0, forcedPrinted: 0 };

    const gdp = Number(nation.gdp ?? nation.GDP) || 0;
    let forcedPrinted = 0;
    for (const o of expired) {
        // principal_remaining is the unfilled amount (NULL fallback to amount
        // for any rows from before this column was populated).
        const unfilled = Number(o.principal_remaining ?? o.amount) || 0;
        // Flip status FIRST — if this UPDATE fails we skip the print so the
        // same offer can't be picked up by the next tick and counted twice.
        // (Alternative: mark-after-print doubles the inflation hit if the
        // UPDATE fails mid-loop. Mark-first means a failure just loses the
        // print for this tick; next tick retries cleanly.)
        const { error: uErr } = await supabase.from('finance_loan_requests')
            .update({ status: 'expired' }).eq('id', o.id);
        if (uErr) {
            console.warn(
                `[Debt] offer mark-expired failed for ${o.id}; skipping print this tick: ${uErr.message}`
            );
            continue;
        }
        forcedPrinted += unfilled;
    }

    if (forcedPrinted > 0 && gdp > 0) {
        const printRatio = forcedPrinted / gdp;
        const inflationDelta = printRatio * DEBT_CONFIG.INFLATION_PER_PRINT_PCT;
        const newInflation = Math.min(100, Math.max(0, Number(nation.inflation || 0) + inflationDelta));
        const newReserves = Number(nation.budget_reserves || 0) + forcedPrinted;
        await supabase.from('nations').update({
            inflation: newInflation,
            budget_reserves: newReserves,
        }).eq('id', nation.id);
        nation.inflation = newInflation;
        nation.budget_reserves = newReserves;
    }

    return { expired: expired.length, forcedPrinted };
}

// (4) Deficit/surplus: calculate this tick's gap, decide funding split,
// post bond offer for borrow portion, print the rest, deteriorate credit.
export async function processDebtTick(supabase, nation, expenditures, revenue, currentTick) {
    const exp = Number(expenditures) || 0;
    const rev = Number(revenue) || 0;
    const deficit = exp - rev;

    // Surplus path — pay down debt, recover credit.
    if (deficit <= 0) {
        const surplus = -deficit;
        const newDebt   = Math.max(0, Number(nation.debt || 0) - surplus);
        const newCredit = Math.min(100, Math.max(0, Number(nation.credit || 0) + DEBT_CONFIG.CREDIT_RECOVERY_RATE));
        const { error } = await supabase.from('nations')
            .update({ debt: newDebt, credit: newCredit }).eq('id', nation.id);
        if (error) {
            console.warn(`[Debt] surplus update failed for ${nation.name}:`, error.message);
            return { mode: 'surplus', surplus, error: error.message };
        }
        nation.debt   = newDebt;
        nation.credit = newCredit;
        return { mode: 'surplus', surplus, newDebt, newCredit };
    }

    // Deficit path.
    const credit       = Number(nation.credit) || 0;
    const gdp          = Number(nation.gdp ?? nation.GDP) || 0;
    const bondRatio    = getBondRatio(credit);
    const bondPortion  = Math.floor(deficit * bondRatio);
    const printPortion = deficit - bondPortion;

    // Post a bond offer in finance_loan_requests (request_type='bond')
    // so the existing Deal Flow UI renders it. Coupon rate locked at
    // issuance from current credit; principal_remaining starts equal to
    // amount and decrements as Investment Corps buy slices. If
    // bondPortion is 0 (Tier 5), skip the insert entirely.
    let offerId = null;
    if (bondPortion > 0) {
        const couponRate = creditToCouponRate(credit);
        const { data: offer, error: oErr } = await supabase.from('finance_loan_requests').insert({
            requesting_faction_id: null,
            nation_id:             nation.id,
            issuer_nation_id:      nation.id,
            request_type:          'bond',
            amount:                bondPortion,
            principal_remaining:   bondPortion,
            coupon_rate:           couponRate,
            term_months:           DEBT_CONFIG.BOND_TERM_TICKS,
            purpose:               `Sovereign bond: ${nation.name || 'nation'} fiscal year`,
            status:                'open',
            created_tick:          currentTick,
            expires_tick:          currentTick + DEBT_CONFIG.BOND_OFFER_EXPIRY_TICKS,
        }).select('id').single();
        if (oErr) {
            console.warn(`[Debt] bond offer insert failed for ${nation.name}:`, oErr.message);
            // Fall through — printPortion still applies; bondPortion just
            // never makes it to market and the nation runs short until
            // next tick. Better than throwing the whole deficit away.
        } else {
            offerId = offer?.id || null;
        }
    }

    // Print the printed portion: credit budget_reserves to fund expenditures,
    // and add the inflation hit. Inflation is the canonical signal — every
    // downstream stat (currency_strength, foreign_investment, SoL, etc.)
    // cascades from here through the existing stat-connection web.
    if (printPortion > 0 && gdp > 0) {
        const printRatio = printPortion / gdp;
        const inflationDelta = printRatio * DEBT_CONFIG.INFLATION_PER_PRINT_PCT;
        const newInflation = Math.min(100, Math.max(0, Number(nation.inflation || 0) + inflationDelta));
        const newReserves  = Number(nation.budget_reserves || 0) + printPortion;
        const { error: pErr } = await supabase.from('nations')
            .update({ inflation: newInflation, budget_reserves: newReserves }).eq('id', nation.id);
        if (pErr) {
            console.warn(`[Debt] print update failed for ${nation.name}:`, pErr.message);
        } else {
            nation.inflation       = newInflation;
            nation.budget_reserves = newReserves;
        }
    }

    // Credit deterioration — uses the existing function in sovereign-default.js
    // so the bracket math has one source of truth. Returns 0 when debt-to-gdp
    // is below 100%, so low-debt high-deficit nations won't lose credit here.
    const credPenalty = calculateCreditDeterioration(nation);
    if (credPenalty > 0) {
        const newCredit = Math.min(100, Math.max(0, Number(nation.credit || 0) - credPenalty));
        const { error: cErr } = await supabase.from('nations')
            .update({ credit: newCredit }).eq('id', nation.id);
        if (cErr) {
            console.warn(`[Debt] credit deterioration update failed for ${nation.name}:`, cErr.message);
        } else {
            nation.credit = newCredit;
        }
    }

    return {
        mode: 'deficit',
        deficit, bondPortion, printPortion, offerId,
        creditDeterioration: credPenalty,
    };
}
