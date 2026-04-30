// js/game/debt.js — Debt & Deficit System (v1-MANUAL)
//
// Per-tick government borrowing loop. Splits each nation's deficit into
// a bond portion (offered to Investment Corps via Deal Flow) and a
// printed portion (added to inflation). Bonds that don't sell within
// 3 ticks auto-print at expiry.
//
// Stat ownership recap (post alpha refactor):
//   * nations.debt    — kept in sync with SUM(active_holdings.principal) by
//                       buy_bond RPC and processBondMaturitiesTick below
//   * nations.budget_reserves — credited by printPortion + forcedPrinted
//                       paths. Reduced by coupon payouts.
//
// Retired by alpha refactor:
//   * inflation cascade (column deleted)
//   * credit deterioration / recovery (column deleted)
//   * gdp-based print-to-inflation ratio (column deleted)
//
// Order matters when these are called per nation each tick:
//   1. processBondMaturitiesTick   — pay back maturing principals
//   2. processBondCouponsTick      — pay per-tick coupons to holders
//   3. processBondOfferExpiryTick  — convert unfilled offers to printing
//   4. processDebtTick             — calculate deficit, post new offer, print remainder

// ════════════════════════════════════════════════════════════════════════════
//  CONFIG
// ════════════════════════════════════════════════════════════════════════════

export const DEBT_CONFIG = Object.freeze({
    INFLATION_PER_PRINT_PCT: 25,    // start safe; bump to 30-40 if too slow
    CREDIT_RECOVERY_RATE:    0.1,
    BOND_TERM_TICKS:         36,
    BOND_OFFER_EXPIRY_TICKS: 3,
});

// Tiered bond ratio + letter grade. First tier whose min_credit is
// satisfied wins. Same SSoT shape used by the Deal Flow UI to display
// "what fraction of a deficit can this nation expect to borrow vs.
// print" and by the Ministry of Finance budget overview to render the
// sovereign credit rating card.
export const BOND_RATIO_TIERS = Object.freeze([
    { min_credit: 70, ratio: 0.95, letter: 'AAA' },
    { min_credit: 40, ratio: 0.60, letter: 'AA'  },
    { min_credit: 20, ratio: 0.20, letter: 'BBB' },
    { min_credit:  5, ratio: 0.05, letter: 'B'   },
    { min_credit:  0, ratio: 0.00, letter: 'D'   },
]);

// ════════════════════════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════════════════════════

// Alpha stats refactor (Phase 7e): the credit column is deleted with no
// replacement, so the bond-tier system flattens to a single default
// tier ('BBB' — 60/40 bond/print split, ~8.5% annual coupon). The tier
// table above is preserved for when the bond-credit system is
// redesigned against alpha-19 stats (likely keyed off debt-to-budget).
// Functions retain their (credit) parameter for back-compat; the value
// is ignored.
const ALPHA_DEFAULT_TIER = { letter: 'BBB', ratio: 0.60, min_credit: 0 };
const ALPHA_DEFAULT_COUPON_PER_TICK = 0.00708; // (8.5% annual) / 12, 5dp

export function getBondRatio(_creditUnused) {
    return ALPHA_DEFAULT_TIER.ratio;
}

export function getCreditRating(_creditUnused) {
    return {
        letter: ALPHA_DEFAULT_TIER.letter,
        bondRatio: ALPHA_DEFAULT_TIER.ratio,
        printRatio: 1 - ALPHA_DEFAULT_TIER.ratio
    };
}

export function creditToCouponRate(_creditUnused) {
    return ALPHA_DEFAULT_COUPON_PER_TICK;
}

// ════════════════════════════════════════════════════════════════════════════
//  PER-TICK PROCESSORS — call in order from the tick processor.
// ════════════════════════════════════════════════════════════════════════════

// (1) Maturities: pay back principal in full on holdings reaching matures_at_tick.
// Routed through the mature_bond_holding RPC (Phase 2 atomicity fix) so the
// pay + mark operations run in one DB transaction — no more double-payback
// risk if the mark-matured UPDATE fails after principal was already paid.
// Local nation.budget_reserves / nation.debt are mirrored after each RPC so
// subsequent iterations (and subsequent per-tick processors) see fresh values.
export async function processBondMaturitiesTick(supabase, nation, currentTick) {
    const { data: due, error } = await supabase
        .from('bond_holdings')
        .select('id, principal')
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

        const { data: result, error: rpcErr } = await supabase.rpc('mature_bond_holding', {
            p_holding_id:   h.id,
            p_current_tick: currentTick,
        });
        if (rpcErr) {
            console.error(`[Debt] mature_bond_holding RPC failed for holding ${h.id}:`, rpcErr.message);
            continue;
        }
        if (result && result.already_matured) continue;

        // Atomic success: mirror locally so subsequent iterations in this tick
        // see fresh budget_reserves / debt values.
        nation.budget_reserves = Math.max(0, Number(nation.budget_reserves || 0) - principal);
        nation.debt            = Math.max(0, Number(nation.debt || 0) - principal);
        totalPrincipal += principal;
    }
    return { paid: due.length, totalPrincipal };
}

// (2) Coupons: pay per-tick interest on every active holding.
// Routed through the pay_bond_coupons RPC (Phase 2) so the nation debit,
// holder credits, and coupon-shortfall inflation hit all run atomically.
// If the nation can't cover the total coupon, the RPC prints the
// shortfall AND applies the inflation cost — holders still get paid in
// full, but inflation reflects the cost of covering the gap.
export async function processBondCouponsTick(supabase, nation, currentTick) {
    const { data: result, error: rpcErr } = await supabase.rpc('pay_bond_coupons', {
        p_nation_id:    nation.id,
        p_current_tick: currentTick,
    });
    if (rpcErr) {
        console.error(`[Debt] pay_bond_coupons RPC failed for ${nation.name}:`, rpcErr.message);
        return { totalCoupon: 0, shortfall: 0 };
    }
    const totalCoupon = Number(result?.total_coupon || 0);
    const shortfall   = Number(result?.shortfall    || 0);
    if (totalCoupon === 0) return { totalCoupon: 0, shortfall: 0 };

    // Mirror the DB state locally so downstream per-tick processors see
    // the post-coupon value of budget_reserves. Inflation accumulation
    // path retired by alpha refactor (column deleted); the underlying
    // RPC may still emit inflation_delta but we no longer apply it.
    nation.budget_reserves = Math.max(0, Number(nation.budget_reserves || 0) - (totalCoupon - shortfall));
    return { totalCoupon, shortfall };
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

    let forcedPrinted = 0;
    for (const o of expired) {
        // principal_remaining is the unfilled amount (NULL fallback to amount
        // for any rows from before this column was populated).
        const unfilled = Number(o.principal_remaining ?? o.amount) || 0;
        // Flip status FIRST — if this UPDATE fails we skip the print so the
        // same offer can't be picked up by the next tick and counted twice.
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

    // Alpha refactor: inflation column is deleted, so the printing →
    // inflation cascade is retired. Forced-printed money still credits
    // budget_reserves so the deficit is covered fiscally; the
    // monetary-debasement penalty no longer applies.
    if (forcedPrinted > 0) {
        const newReserves = Number(nation.budget_reserves || 0) + forcedPrinted;
        await supabase.from('nations').update({
            budget_reserves: newReserves,
        }).eq('id', nation.id);
        nation.budget_reserves = newReserves;
    }

    return { expired: expired.length, forcedPrinted };
}

// (4) Deficit/surplus: calculate this tick's gap, decide funding split,
// post bond offer for borrow portion, "print" the rest into reserves.
//
// Alpha stats refactor (Phase 7e): credit and inflation columns are
// deleted by the alpha refactor. The credit-recovery-on-surplus and
// credit-deterioration-on-deficit dynamics are retired (no signal to
// modulate). The "print → inflation accumulation" model is also
// retired (gdp gone, inflation gone) — printPortion still credits
// budget_reserves but no longer cascades through inflation. A future
// fiscal-redesign phase can reintroduce a credit-equivalent signal
// keyed off debt-to-budget.
export async function processDebtTick(supabase, nation, expenditures, revenue, currentTick) {
    const exp = Number(expenditures) || 0;
    const rev = Number(revenue) || 0;
    const deficit = exp - rev;

    // Surplus path — pay down debt.
    if (deficit <= 0) {
        const surplus = -deficit;
        const newDebt = Math.max(0, Number(nation.debt || 0) - surplus);
        const { error } = await supabase.from('nations')
            .update({ debt: newDebt }).eq('id', nation.id);
        if (error) {
            console.warn(`[Debt] surplus update failed for ${nation.name}:`, error.message);
            return { mode: 'surplus', surplus, error: error.message };
        }
        nation.debt = newDebt;
        return { mode: 'surplus', surplus, newDebt };
    }

    // Deficit path. Bond ratio + coupon rate are flat defaults (alpha
    // refactor) until a credit-equivalent system is rebuilt.
    const bondRatio    = getBondRatio();
    const bondPortion  = Math.floor(deficit * bondRatio);
    const printPortion = deficit - bondPortion;

    // Post a bond offer in finance_loan_requests (request_type='bond')
    // so the existing Deal Flow UI renders it. Coupon rate flat-defaulted.
    let offerId = null;
    if (bondPortion > 0) {
        const couponRate = creditToCouponRate();
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
        } else {
            offerId = offer?.id || null;
        }
    }

    // Credit budget_reserves with the printed portion. Pre-alpha this
    // also accrued inflation via printPortion / gdp; that cascade is
    // retired with the gdp + inflation columns.
    if (printPortion > 0) {
        const newReserves = Number(nation.budget_reserves || 0) + printPortion;
        const { error: pErr } = await supabase.from('nations')
            .update({ budget_reserves: newReserves }).eq('id', nation.id);
        if (pErr) {
            console.warn(`[Debt] print update failed for ${nation.name}:`, pErr.message);
        } else {
            nation.budget_reserves = newReserves;
        }
    }

    return {
        mode: 'deficit',
        deficit, bondPortion, printPortion, offerId,
        creditDeterioration: 0,
    };
}
