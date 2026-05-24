// @ts-nocheck
/**
 * Supabase Edge Function: advance-corp-tick
 *
 * Server-side corporation tick processor for Nationhood Alpha.
 * Called by pg_cron every minute — reads current_tick from the shard,
 * skips if already processed or not yet due. Runs once per tick at
 * the midpoint of the tick interval (e.g. 4 hours after advance-tick
 * for an 8-hour interval), then processes all corporation systems.
 *
 * This function does NOT advance the tick or acquire the tick lock.
 * advance-tick owns tick advancement; this function piggybacks on
 * the current tick number and processes corp effects for it.
 *
 * After the legacy faction-corporation cull, this tick runs only the
 * surviving money systems: bank-loan expiry/payments, central-bank loan
 * repayments, equity dividends, trade-agreement shipping, and the
 * entrepreneur airline-route allocator. The per-nation legacy corp
 * economy loop (construction, vessels, executives, finance loans,
 * lawsuits) was removed.
 */

import { createClient } from "npm:@supabase/supabase-js@2";

// ════════════════════════════════════════════════════════════════════════════════
//  LOAN MATH — verbatim copy of js/game/loan-math.js
//
//  This file is hand-maintained (no bundler), so amortizedMonthlyPayment is
//  inlined here. If you change either copy, update the other in the same
//  commit. The canonical home is js/game/loan-math.js.
// ════════════════════════════════════════════════════════════════════════════════

function amortizedMonthlyPayment(principal, apr, termTicks) {
    const safePrincipal = Math.max(0, Number(principal) || 0);
    const safeApr = Math.max(0, Number(apr) || 0);
    const safeTerm = Math.max(1, Number(termTicks) || 1);
    const r = (safeApr / 100) / 12;
    if (r === 0) return Math.round(safePrincipal / safeTerm);
    const factor = Math.pow(1 + r, safeTerm);
    return Math.round(safePrincipal * (r * factor) / (factor - 1));
}

// ════════════════════════════════════════════════════════════════════════════════
//  Option 4 — corp_cash_events SSoT (Phase 4: dual-write retired).
//
//  logCashEvent is the single entry point for per-corp P&L cash movements.
//  Events buffer in memory and flush in one batch at tick end so the
//  insert doesn't fan out into one round-trip per accrual. _currentTick is
//  captured at the top of advanceCorpTick so call sites don't have to thread
//  it through.
//
//  KNOWN SCOPE GAP — cash events that still bypass the event log:
//    - advance-tick/index.ts gov_bailout path (non-P&L equity infusion — correct to skip)
//    - js/corp-refurbish.js client-side refurbish cost (player-initiated expense)
// ════════════════════════════════════════════════════════════════════════════════

let _currentTick = 0;
const _pendingCashEvents = [];

// corp_id → home nation_id, populated once per advanceCorpTick run so
// logCashEvent can default to the corp's home nation when callers
// don't pass an explicit jurisdiction. A caller tied to a foreign
// nation overrides this default by passing nationId.
let _corpHomeNation = new Map();

async function loadCorpHomeNations(supabase) {
    const { data, error } = await supabase
        .from('factions')
        .select('id, nation_id')
        .eq('faction_type', 'corporation');
    if (error) {
        console.warn('[advance-corp-tick] corp home nation cache load failed:', error.message);
        _corpHomeNation = new Map();
        return;
    }
    _corpHomeNation = new Map((data || []).map(r => [r.id, r.nation_id]));
}

function logCashEvent(corpId, category, label, delta, nationId) {
    if (!corpId || !Number.isFinite(delta) || delta === 0) return;
    const tagNationId = nationId ?? _corpHomeNation.get(corpId) ?? null;
    _pendingCashEvents.push({
        corp_id:   corpId,
        tick:      _currentTick,
        category,
        label:     String(label || category),
        delta,
        nation_id: tagNationId,
    });
}

async function flushCashEvents(supabase) {
    if (_pendingCashEvents.length === 0) return;
    // Splice first so a thrown insert can't double-write on retry.
    const batch = _pendingCashEvents.splice(0, _pendingCashEvents.length);
    try {
        const { error } = await supabase.from('corp_cash_events').insert(batch);
        if (error) {
            console.warn(`[advance-corp-tick] corp_cash_events insert failed (${batch.length} events):`, error.message);
        }
    } catch (err) {
        // Catch thrown exceptions (network, schema-cache, etc.) so they
        // don't abort tick completion — the tick already moved real cash
        // via corp_cash_reserves writes; losing the event log for one
        // tick is recoverable, re-running the whole tick is not.
        console.error('[advance-corp-tick] corp_cash_events insert threw:', err?.message || err);
    }
}

// ════════════════════════════════════════════════════════════════════════════════
//  FINANCE SECTOR — Loan Processing
// ════════════════════════════════════════════════════════════════════════════════

// L5: Bank loan request + offer expiry. Shard-wide (not per-nation) since
// any borrower from any nation can have a pending request, and the work
// is cheap enough that a single sweep is simpler than a per-nation loop.
//
// Lifecycle:
//   bank_loan_requests.status='pending' AND expires_at_tick <= currentTick
//     → flip request to 'expired'
//     → cascade: every still-pending offer on those requests → 'expired'
//   bank_loan_offers.status='pending' AND expires_at_tick <= currentTick
//     → catch-all flip to 'expired' for orphaned offers (offer's
//       expires_at_tick is set to mirror its parent request's at submit
//       time, so this branch should usually be empty; runs anyway as a
//       defensive sweep so an out-of-band drift can't strand offers)
//
// Idempotent: re-running on the same tick is a no-op because the
// .eq('status', 'pending') filter excludes rows that already terminated.
async function processBankLoanExpiry(supabase, currentTick) {
    const results = { expiredRequests: 0, expiredOffersCascade: 0, expiredOffersOrphan: 0 };
    // Single payload reused across both tables — every expiry update sets
    // the same three columns identically.
    const expirePayload = {
        status: 'expired',
        resolved_at_tick: currentTick,
        updated_at: new Date().toISOString(),
    };

    // 1. Flip pending requests past their expiry to 'expired'.
    const { data: expiredReqs, error: reqErr } = await supabase
        .from('bank_loan_requests')
        .update(expirePayload)
        .eq('status', 'pending')
        .lte('expires_at_tick', currentTick)
        .select('id');
    if (reqErr) {
        console.warn('[BankLoanExpiry] request expiry update failed:', reqErr.message);
        return results;
    }
    results.expiredRequests = expiredReqs?.length || 0;

    // 2. Cascade — every still-pending offer on the expired requests
    //    flips to 'expired' too.
    if (results.expiredRequests > 0) {
        const expiredIds = expiredReqs.map(r => r.id);
        const { data: cascadeOffers, error: cascadeErr } = await supabase
            .from('bank_loan_offers')
            .update(expirePayload)
            .in('request_id', expiredIds)
            .eq('status', 'pending')
            .select('id');
        if (cascadeErr) {
            console.warn('[BankLoanExpiry] offer cascade update failed:', cascadeErr.message);
        } else {
            results.expiredOffersCascade = cascadeOffers?.length || 0;
        }
    }

    // 3. Defensive catch-all for orphan offers whose own expires_at_tick
    //    has passed but whose parent request hasn't (shouldn't happen
    //    given the schema invariant; runs anyway). Also recovers any
    //    rows missed if Step 2 hit a transient failure — those offers
    //    have inherited their parent's now-passed expires_at_tick and
    //    will be caught here.
    const { data: orphanOffers, error: orphanErr } = await supabase
        .from('bank_loan_offers')
        .update(expirePayload)
        .eq('status', 'pending')
        .lte('expires_at_tick', currentTick)
        .select('id');
    if (orphanErr) {
        console.warn('[BankLoanExpiry] orphan offer sweep failed:', orphanErr.message);
    } else {
        results.expiredOffersOrphan = orphanOffers?.length || 0;
    }

    return results;
}

// LRP2: per-tick payment processor for bank_loans (the counter-offer
// pipeline). Reads bank_loans, computes amortized payments from the
// schema's principal/apr/term_ticks (no monthly_payment column on the
// table), and uses the LRP1 close_bank_loan helper for terminal
// transitions.
//
// Per-tick math (simple amortization at 12 ticks/year):
//   r       = (apr / 100) / 12               -- per-tick interest rate
//   payment = P × r × (1+r)^N / ((1+r)^N − 1)  level payment, r > 0
//   payment = P / N                            zero-interest fallback
// The final payment is capped at outstanding + interest_due so a
// rounding remainder doesn't keep the loan alive past maturity.
//
// Status escalation:
//   1 missed → 'late'      (warning state, payment retried next tick)
//   2 missed → 'delinquent'
//   3 missed → 'defaulted' (close_bank_loan('defaulted'))
// Successful payments don't decrement payments_missed — the counter
// is monotonic so escalation is a one-way ratchet.
//
// Borrower-side accounting: payment is logged via logCashEvent (debt
// service category) so it shows in the dashboard's expense breakdown.
// principal portion of the payment also decrements corp_debt so the
// dashboard's Outstanding Debt card amortizes alongside.
async function processBankLoanPayments(supabase, currentTick) {
    const results = {
        processed: 0, paid: 0, missed: 0, defaulted: 0,
        late_escalations: 0, delinquent_escalations: 0,
    };
    const TICKS_PER_YEAR = 12;

    const { data: loans, error: loansErr } = await supabase
        .from('bank_loans')
        .select('id, lender_faction_id, borrower_faction_id, principal, apr, term_ticks, outstanding, payments_missed, status, last_payment_tick')
        .in('status', ['active', 'late', 'delinquent'])
        .or(`last_payment_tick.is.null,last_payment_tick.neq.${currentTick}`);

    if (loansErr) {
        console.warn('[BankLoanPayments] fetch failed:', loansErr.message);
        return results;
    }
    if (!loans || loans.length === 0) return results;

    for (const loan of loans) {
        // Idempotency belt-and-suspenders.
        if (Number(loan.last_payment_tick) === Number(currentTick)) continue;

        const principal  = Number(loan.principal) || 0;
        const apr        = Number(loan.apr) || 0;
        const termTicks  = Number(loan.term_ticks) || 1;
        const outstanding = Number(loan.outstanding) || 0;
        let paymentsMissed = Number(loan.payments_missed) || 0;
        const r = (apr / 100) / TICKS_PER_YEAR;

        let payment = amortizedMonthlyPayment(principal, apr, termTicks);
        // Cap final payment at outstanding + interest due so a rounding
        // remainder closes the loan cleanly instead of leaving cents.
        const interestDue = Math.round(outstanding * r);
        if (payment > outstanding + interestDue) payment = outstanding + interestDue;
        const principalPortion = Math.max(0, payment - interestDue);

        const { data: borrower, error: bErr } = await supabase.from('factions')
            .select('corp_cash_reserves, corp_debt')
            .eq('id', loan.borrower_faction_id).single();
        if (bErr || !borrower) {
            console.warn(`[BankLoanPayments] borrower fetch failed for loan ${loan.id}:`, bErr?.message);
            continue;
        }
        const borrowerCash = Number(borrower.corp_cash_reserves) || 0;

        if (borrowerCash >= payment) {
            const newOutstanding = Math.max(0, outstanding - principalPortion);

            // Borrower: deduct cash, decrement debt by principal portion.
            const { error: bUpdErr } = await supabase.from('factions').update({
                corp_cash_reserves: borrowerCash - payment,
                corp_debt:          Math.max(0, (Number(borrower.corp_debt) || 0) - principalPortion),
            }).eq('id', loan.borrower_faction_id);
            if (bUpdErr) {
                console.warn(`[BankLoanPayments] borrower debit failed for loan ${loan.id}:`, bUpdErr.message);
                continue;
            }

            // Lender: credit cash. Read-modify-write same race as the
            // rest of the corp tick loop; service-role bypass keeps the
            // ordering tight. Errors here surface as warnings — the
            // borrower has already been debited, so a failed lender
            // credit means the payment effectively disappears for this
            // tick. Pre-existing money-flow pattern; closing it cleanly
            // would require a SECURITY DEFINER RPC for the whole
            // transaction.
            const { data: lender, error: lenderSelErr } = await supabase.from('factions')
                .select('corp_cash_reserves').eq('id', loan.lender_faction_id).single();
            if (lenderSelErr || !lender) {
                console.warn(`[BankLoanPayments] lender fetch failed for loan ${loan.id}:`, lenderSelErr?.message);
            } else {
                const { error: lenderUpdErr } = await supabase.from('factions').update({
                    corp_cash_reserves: (Number(lender.corp_cash_reserves) || 0) + payment,
                }).eq('id', loan.lender_faction_id);
                if (lenderUpdErr) {
                    console.warn(`[BankLoanPayments] lender credit failed for loan ${loan.id}:`, lenderUpdErr.message);
                }
            }

            // Ledger entries — split interest from principal so each side's
            // dashboard shows them as distinct categories. logCashEvent is a
            // no-op for delta=0, so zero-interest or interest-only edges
            // safely skip the irrelevant line.
            const interestPortion = payment - principalPortion;
            logCashEvent(loan.borrower_faction_id, 'debt_interest',  'Loan interest paid',      -interestPortion);
            logCashEvent(loan.borrower_faction_id, 'capital_out',    'Loan principal payment',  -principalPortion);
            logCashEvent(loan.lender_faction_id,   'revenue_finance', 'Loan interest received',  interestPortion);
            logCashEvent(loan.lender_faction_id,   'capital_in',     'Loan principal received',  principalPortion);

            if (newOutstanding <= 0) {
                // Final payment — close as 'paid'. close_bank_loan also
                // zeroes the (already-zero) outstanding, decrements the
                // borrower's corp_debt by 0, and recomputes the lender's
                // hero stats so headroom returns.
                await supabase.rpc('close_bank_loan', {
                    p_loan_id:      loan.id,
                    p_close_status: 'paid',
                });
                results.paid++;
            } else {
                await supabase.from('bank_loans').update({
                    outstanding:        newOutstanding,
                    last_payment_tick:  currentTick,
                    updated_at:         new Date().toISOString(),
                }).eq('id', loan.id);
                // Outstanding shrunk → recompute lender stats (overleverage
                // relaxes, lending headroom improves slightly).
                await supabase.rpc('recompute_finance_stats', { p_faction_id: loan.lender_faction_id });
            }
            results.processed++;
        } else {
            // Missed payment. Increment counter; escalate status.
            paymentsMissed++;
            results.missed++;

            if (paymentsMissed >= 3) {
                await supabase.rpc('close_bank_loan', {
                    p_loan_id:      loan.id,
                    p_close_status: 'defaulted',
                });
                results.defaulted++;
                continue;
            }

            const newStatus = paymentsMissed >= 2 ? 'delinquent' : 'late';
            if (newStatus === 'delinquent' && loan.status !== 'delinquent') results.delinquent_escalations++;
            if (newStatus === 'late'       && loan.status !== 'late')       results.late_escalations++;

            await supabase.from('bank_loans').update({
                payments_missed:    paymentsMissed,
                status:             newStatus,
                last_payment_tick:  currentTick,
                updated_at:         new Date().toISOString(),
            }).eq('id', loan.id);
        }
    }

    return results;
}

// Per-tick repayment for central_bank_loans (corp ↔ home-nation Central Bank).
// Borrower corp pays an amortized payment from treasury_cash. Principal shrinks
// `outstanding` (freeing CB lending capacity, since capacity counts only
// active-loan outstanding). Interest flows back into the pool: added to
// nations.central_bank_discretionary as interest/100, so capacity (= discretionary
// × 100) grows by the interest amount 1:1. 3 missed payments → defaulted (which
// also frees the capacity, since defaulted rows leave the active outstanding sum).
async function processCentralBankLoanPayments(supabase, currentTick) {
    const results = { processed: 0, paid: 0, missed: 0, defaulted: 0 };
    const TICKS_PER_YEAR = 12;

    const { data: loans, error } = await supabase
        .from('central_bank_loans')
        .select('id, nation_id, borrower_corp_id, principal, outstanding, interest_rate, term_ticks, payments_missed, status, last_payment_tick')
        .eq('status', 'active')
        .or(`last_payment_tick.is.null,last_payment_tick.neq.${currentTick}`);
    if (error) { console.warn('[CBLoanPayments] fetch failed:', error.message); return results; }
    if (!loans || loans.length === 0) return results;

    for (const loan of loans) {
        if (Number(loan.last_payment_tick) === Number(currentTick)) continue;
        const outstanding = Number(loan.outstanding) || 0;
        const rate = Number(loan.interest_rate) || 0;
        const r = (rate / 100) / TICKS_PER_YEAR;
        let payment = amortizedMonthlyPayment(Number(loan.principal) || 0, rate, Number(loan.term_ticks) || 1);
        const interestDue = Math.round(outstanding * r);
        if (payment > outstanding + interestDue) payment = outstanding + interestDue;
        const principalPortion = Math.max(0, payment - interestDue);
        const interestPortion = payment - principalPortion;

        const { data: corp, error: cErr } = await supabase.from('entrepreneur_corps')
            .select('treasury_cash').eq('id', loan.borrower_corp_id).single();
        if (cErr || !corp) { console.warn(`[CBLoanPayments] corp fetch failed for ${loan.id}:`, cErr?.message); continue; }
        const cash = Number(corp.treasury_cash) || 0;

        if (cash >= payment) {
            const newOutstanding = Math.max(0, outstanding - principalPortion);
            const { error: cUpd } = await supabase.from('entrepreneur_corps')
                .update({ treasury_cash: cash - payment }).eq('id', loan.borrower_corp_id);
            if (cUpd) { console.warn(`[CBLoanPayments] debit failed for ${loan.id}:`, cUpd.message); continue; }

            // Interest grows the CB pool (interest/100 → capacity +interest, 1:1).
            if (interestPortion > 0) {
                const { data: nat } = await supabase.from('nations')
                    .select('central_bank_discretionary').eq('id', loan.nation_id).single();
                if (nat) {
                    await supabase.from('nations').update({
                        central_bank_discretionary: (Number(nat.central_bank_discretionary) || 0) + Math.round(interestPortion / 100),
                    }).eq('id', loan.nation_id);
                }
            }
            // No corp_cash_events ledger entry — that helper keys on
            // factions.id (the faction-corp model), not entrepreneur_corps.
            // The treasury_cash debit above is the money movement; the loan
            // row tracks the schedule.

            if (newOutstanding <= 0) {
                await supabase.from('central_bank_loans')
                    .update({ outstanding: 0, status: 'repaid', last_payment_tick: currentTick }).eq('id', loan.id);
                results.paid++;
            } else {
                await supabase.from('central_bank_loans')
                    .update({ outstanding: newOutstanding, last_payment_tick: currentTick }).eq('id', loan.id);
            }
            results.processed++;
        } else {
            const missed = (Number(loan.payments_missed) || 0) + 1;
            results.missed++;
            if (missed >= 3) {
                await supabase.from('central_bank_loans')
                    .update({ status: 'defaulted', last_payment_tick: currentTick, payments_missed: missed }).eq('id', loan.id);
                // Penalty parity with declare_bankruptcy / corp-loan default:
                // the borrower's CEO takes −3 ent_reputation.
                const { data: ownerCorp } = await supabase.from('entrepreneur_corps')
                    .select('owner_faction_id').eq('id', loan.borrower_corp_id).single();
                if (ownerCorp?.owner_faction_id) {
                    const { data: fac } = await supabase.from('factions')
                        .select('ent_reputation').eq('id', ownerCorp.owner_faction_id).single();
                    if (fac) {
                        await supabase.from('factions')
                            .update({ ent_reputation: (Number(fac.ent_reputation) || 0) - 3 })
                            .eq('id', ownerCorp.owner_faction_id);
                    }
                }
                results.defaulted++;
            } else {
                await supabase.from('central_bank_loans')
                    .update({ payments_missed: missed, last_payment_tick: currentTick }).eq('id', loan.id);
            }
        }
    }
    return results;
}


// ════════════════════════════════════════════════════════════════
// Phase 4 — Trade-Agreement Shipping processor
//
// Handles shipping_contracts spawned by the AFTER INSERT trigger on
// trade_agreements (Phase 2). (The legacy SOP shipping_routes processor
// has been removed in the corp cull.)
//
//   - Auto-award by delivery_priority (fastest/safest/cheapest):
//       fastest  → MAX(energy_per_tick)
//       safest   → MIN(route_risk_delta)
//       cheapest → MIN(offered_revenue_per_tick)
//     Universal tiebreaker: cheapest, then earliest applied_at_tick.
//
//   - Zero bids when window closes ⇒ extend window by +1 tick (poll
//     until at least one offer arrives). Phase 1 spec: "It will sit
//     until at least 1 offer is made."
//
//   - Per-tick payment debits the buyer nation's treasury and
//     credits the corp's cash + emits a revenue_trade event. (SOP
//     path prints revenue ambiently — wrong model for trade agreements.)
//
//   - Route risk delta from the winning offer's modifiers is applied
//     to the corp's corp_route_risk on award (clamped 0..10) and
//     reverted on contract completion / maturity.

// ════════════════════════════════════════════════════════════════
async function processTradeAgreementShipping(supabase, currentTick) {
    // Multi-winner allocator (migration 20270181). One Postgres RPC
    // walks every status='open' trade-agreement contract, sorts
    // pending bids by per-unit rate ASC, fills volume_required slots
    // cheapest-first, debits the importing nation's budget, credits
    // each winning bidder (entrepreneur → corp treasury, legacy →
    // faction.corp_cash_reserves). Bids stay 'pending' across ticks.
    const results = {
        routesActive: 0, routesMissed: 0, slotsFilled: 0,
        slotsDemanded: 0, totalPaid: 0,
    };
    try {
        const { data: mw, error: mwErr } = await supabase.rpc(
            'process_trade_agreement_shipping_multiwinner',
            { p_tick: currentTick }
        );
        if (mwErr) {
            console.warn('[TradeAgreementShipping] multi-winner RPC failed:', mwErr.message);
            return results;
        }
        if (mw && mw.success) {
            results.routesActive  = Number(mw.routes_active)  || 0;
            results.routesMissed  = Number(mw.routes_missed)  || 0;
            results.slotsFilled   = Number(mw.slots_filled)   || 0;
            results.slotsDemanded = Number(mw.slots_demanded) || 0;
            results.totalPaid     = Number(mw.total_paid)     || 0;
        }
    } catch (e) {
        console.warn('[TradeAgreementShipping] multi-winner allocator threw:', e?.message || e);
    }
    return results;
}

// ════════════════════════════════════════════════════════════════════════════════
//  MAIN ORCHESTRATOR
// ════════════════════════════════════════════════════════════════════════════════

async function advanceCorpTick(supabase, { force = false, runNow = false } = {}) {
    // ── Build fingerprint canary ──
    // Tells us whether a deploy actually replaced the running bundle.
    // After `supabase functions deploy advance-corp-tick`, the next
    // cron invocation should log this exact string. If it doesn't,
    // the deploy didn't take effect (Supabase dashboard cache /
    // wrong project / silent failure). Bump the date suffix on each
    // intentional redeploy so we can distinguish stale invocations
    // from new ones in the function logs.
    console.log('[advance-corp-tick] BUILD_MARKER 2026-05-13-c (strip-insurance-full)');

    // 1+2+3. Read + idempotency + time-gating + atomic claim, all in
    //        one RPC. SECURITY DEFINER pl/pgsql bypasses PostgREST's
    //        per-column schema cache — which was the recurring root
    //        cause of the "column shard.corp_last_processed_tick does
    //        not exist" failure even after the column was confirmed
    //        present in PostgreSQL. The RPC also serializes concurrent
    //        cron fires via its conditional UPDATE: only one tick
    //        instance can move the marker forward; every other returns
    //        already_claimed and exits cleanly.
    const { data: claim, error: claimErr } = await supabase.rpc('claim_corp_tick', {
        p_force: force,
        p_run_now: runNow,
    });

    if (claimErr) {
        console.error('[advance-corp-tick] claim_corp_tick RPC failed:', claimErr.message);
        return { status: 'claim_error', error: claimErr.message };
    }
    if (!claim) {
        throw new Error('claim_corp_tick returned no payload');
    }
    if (claim.status === 'shard_not_found') {
        throw new Error('Shard not found');
    }
    if (claim.status === 'already_processed') {
        return { status: 'already_processed', tick: claim.tick };
    }
    if (claim.status === 'not_due') {
        const remainMs = claim.corp_due_in_ms ?? 0;
        console.log(`[advance-corp-tick] Not due — tick ${claim.tick}, corp due in ${Math.round(remainMs / 1000)}s`);
        return { status: 'not_due', tick: claim.tick, corp_due_in_ms: remainMs };
    }
    if (claim.status === 'already_claimed') {
        console.log(`[advance-corp-tick] Tick ${claim.tick} already claimed by a concurrent run — exiting.`);
        return { status: 'already_claimed', tick: claim.tick };
    }
    // claim.status === 'claimed' — proceed with tick processing.

    const currentTick = claim.tick;
    const shard = {
        current_tick: currentTick,
        current_date: claim.current_date,
    };

    console.log(`[advance-corp-tick] Processing tick ${currentTick} (${shard.current_date})`);

    // Capture the tick number for logCashEvent and reset its buffer.
    // The buffer holds every cash event accrued so far this tick; it
    // flushes to corp_cash_events at tick end.
    _currentTick = currentTick;
    _pendingCashEvents.length = 0;

    // Populate the corp → home nation cache so logCashEvent can tag
    // events with the corp's jurisdiction without callers threading it
    // through every site.
    await loadCorpHomeNations(supabase);

    // 4. Load all nations
    const { data: nations, error: nationErr } = await supabase
        .from('nations')
        .select('*');

    if (nationErr) {
        throw new Error(`Failed to load nations: ${nationErr.message}`);
    }

    const nationList = nations || [];

    const summary = {
        tick: currentTick,
        nations: nationList.length,
        errors: [],
    };

    // 4b. Loan-negotiation stale sweep (once per tick, global). Abandons
    // any negotiation idle > 24 hours, refunds held escrow, system-
    // messages the row. Cheap: typically 0 sweeps per tick.
    try {
        const { data: sweepRes, error: sweepErr } = await supabase
            .rpc('auto_abandon_stale_negotiations', { p_tick: currentTick });
        if (sweepErr) {
            console.error('[advance-corp-tick] loan-negotiation sweep failed:', sweepErr.message);
            summary.errors.push({ scope: 'loan_negotiation_sweep', error: sweepErr.message });
        } else if (sweepRes?.swept > 0) {
            console.log(`[advance-corp-tick] Auto-abandoned ${sweepRes.swept} stale loan negotiation(s)`);
        }
    } catch (sweepEx) {
        console.error('[advance-corp-tick] loan-negotiation sweep threw (non-fatal):', sweepEx);
        summary.errors.push({ scope: 'loan_negotiation_sweep', error: String(sweepEx) });
    }

    // 4c. Aviation-incident auto-refuse sweep (Phase 7). Pending
    // incidents past expires_at_tick get the 'auto_refused' penalty
    // (op_safety -0.5, reputation -1.5) — same effects as the
    // 'refused' response a player would have picked.
    try {
        const { data: incRes, error: incErr } = await supabase
            .rpc('auto_resolve_stale_incidents', { p_tick: currentTick });
        if (incErr) {
            console.error('[advance-corp-tick] aviation-incident sweep failed:', incErr.message);
            summary.errors.push({ scope: 'aviation_incident_sweep', error: incErr.message });
        } else if (incRes?.swept > 0) {
            console.log(`[advance-corp-tick] Auto-refused ${incRes.swept} stale aviation incident(s)`);
        }
    } catch (incEx) {
        console.error('[advance-corp-tick] aviation-incident sweep threw (non-fatal):', incEx);
        summary.errors.push({ scope: 'aviation_incident_sweep', error: String(incEx) });
    }

    // L5: Bank loan request + offer expiry sweep (shard-wide, idempotent).
    // Shard-wide rather than per-nation because the cascade may touch rows
    // whose lender + borrower live in different nations.
    try {
        const expiryResults = await processBankLoanExpiry(supabase, currentTick);
        if (expiryResults.expiredRequests > 0
            || expiryResults.expiredOffersCascade > 0
            || expiryResults.expiredOffersOrphan > 0) {
            summary.bankLoanExpiry = expiryResults;
            console.log(`[BankLoanExpiry] tick ${currentTick}: ${expiryResults.expiredRequests} request(s) expired, ${expiryResults.expiredOffersCascade} offer(s) cascade-expired, ${expiryResults.expiredOffersOrphan} orphan offer(s) swept`);
        }
    } catch (expiryErr) {
        console.error('[advance-corp-tick] FAILED bank loan expiry sweep:', expiryErr);
        summary.errors.push({ scope: 'bank_loan_expiry', error: String(expiryErr) });
    }

    // LRP2: Bank loan payment processor (shard-wide, idempotent via
    // last_payment_tick guard). Runs after expiry so already-expired
    // requests don't race with payment runs on still-active loans.
    try {
        const paymentResults = await processBankLoanPayments(supabase, currentTick);
        if (paymentResults.processed > 0
            || paymentResults.missed > 0
            || paymentResults.paid > 0
            || paymentResults.defaulted > 0) {
            summary.bankLoanPayments = paymentResults;
            console.log(`[BankLoanPayments] tick ${currentTick}: ${paymentResults.processed} paid, ${paymentResults.missed} missed (${paymentResults.late_escalations} → late, ${paymentResults.delinquent_escalations} → delinquent, ${paymentResults.defaulted} → defaulted), ${paymentResults.paid} loans completed`);
        }
    } catch (payErr) {
        console.error('[advance-corp-tick] FAILED bank loan payments:', payErr);
        summary.errors.push({ scope: 'bank_loan_payments', error: String(payErr) });
    }

    // Central Bank loan repayments (corp ↔ home-nation CB). Mirrors the bank
    // loan run: amortized payment from corp_cash_reserves, principal frees CB
    // capacity, interest grows the CB pool.
    try {
        const cbPay = await processCentralBankLoanPayments(supabase, currentTick);
        if (cbPay.processed > 0 || cbPay.missed > 0 || cbPay.paid > 0 || cbPay.defaulted > 0) {
            summary.centralBankLoanPayments = cbPay;
            console.log(`[CBLoanPayments] tick ${currentTick}: ${cbPay.processed} paid, ${cbPay.missed} missed, ${cbPay.paid} completed, ${cbPay.defaulted} defaulted`);
        }
    } catch (cbErr) {
        console.error('[advance-corp-tick] FAILED central bank loan payments:', cbErr);
        summary.errors.push({ scope: 'central_bank_loan_payments', error: String(cbErr) });
    }

    // EDP: Equity dividend processor (shard-wide, anniversary-driven).
    // Iterates active equity_positions whose 12-tick anniversary has come
    // up. Pays 2% × borrower.corp_cash_reserves × equity_pct, floored at $0.
    // Borrower side: dividend_paid (Cost). Holder side: revenue_finance
    // (Revenue). Both go through emit_corp_cash_event — dashboards update
    // automatically. RPC owns iteration + locking; this just invokes once
    // per tick. See sql/migrations/20261008_process_equity_dividends_rpc.sql.
    try {
        const { data: divResult, error: divErr } = await supabase.rpc(
            'process_equity_dividends',
            { p_current_tick: currentTick }
        );
        if (divErr) {
            console.error('[advance-corp-tick] equity dividends RPC error:', divErr);
            summary.errors.push({ scope: 'equity_dividends', error: divErr.message });
        } else if (divResult && (divResult.paid > 0 || divResult.skipped > 0)) {
            summary.equityDividends = divResult;
            console.log(`[EquityDividends] tick ${currentTick}: ${divResult.paid} paid, ${divResult.skipped} skipped`);
        }
    } catch (divErr) {
        console.error('[advance-corp-tick] FAILED equity dividends:', divErr);
        summary.errors.push({ scope: 'equity_dividends', error: String(divErr) });
    }

    try {

        // Trade-agreement shipping — multi-winner per-tick allocator
        // (migration 20270181). Importing nation pays; entrepreneur
        // bidders credited to corp treasury, legacy faction bidders
        // to corp_cash_reserves. See process_trade_agreement_shipping_multiwinner.
        const tradeShipResults = await processTradeAgreementShipping(supabase, currentTick);
        if (tradeShipResults.routesActive > 0 || tradeShipResults.routesMissed > 0) {
            summary.tradeAgreementShipping = tradeShipResults;
            console.log(`[TradeAgreementShipping] tick ${currentTick}: ${tradeShipResults.routesActive} routes paid, ${tradeShipResults.slotsFilled}/${tradeShipResults.slotsDemanded} slots filled, $${tradeShipResults.totalPaid} total, ${tradeShipResults.routesMissed} missed`);
        }

        // Entrepreneur airline routes — per-tick allocator (migration
        // 20270187). One global call: resolves every active entrepreneur
        // route (demand → competitor split → pax → revenue − ops →
        // corp treasury). Idempotent within a tick via last_processed_tick.
        try {
            const { data: airRes, error: airErr } = await supabase.rpc(
                'process_entrepreneur_airline_routes', { p_tick: currentTick });
            if (airErr) {
                console.warn('[EntrepreneurAirlines] allocator RPC failed:', airErr.message);
            } else if (airRes && airRes.success && Number(airRes.routes_run) > 0) {
                summary.entrepreneurAirlines = airRes;
                console.log(`[EntrepreneurAirlines] tick ${currentTick}: ${airRes.routes_run} routes, ${airRes.total_pax} pax, $${airRes.total_revenue} rev, $${airRes.total_ops} ops`);
            }
        } catch (airThrow) {
            console.warn('[EntrepreneurAirlines] allocator threw:', airThrow?.message || airThrow);
        }

    } catch (shipErr) {
        console.error('[advance-corp-tick] FAILED shipping route processor:', shipErr);
        summary.errors.push({ scope: 'shipping_routes', error: String(shipErr) });
    }

    // Flush buffered cash events to corp_cash_events. Single writer for
    // every per-corp P&L delta this tick, regardless of which nation
    // triggered it. The corp_last_processed_tick guard was already
    // written atomically at the start of the tick (see 3a above), so
    // a failure or timeout here loses at most this tick's events
    // ledger — corp_cash_reserves stays consistent and the next cron
    // fire is correctly skipped instead of re-running the whole tick.
    await flushCashEvents(supabase);

    console.log(`[advance-corp-tick] Tick ${currentTick} complete across ${nationList.length} nations.`);
    return summary;
}

// ════════════════════════════════════════════════════════════════════════════════
//  EDGE FUNCTION HANDLER
// ════════════════════════════════════════════════════════════════════════════════

Deno.serve(async (req) => {
    const corsHeaders = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    };

    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
        return new Response(
            JSON.stringify({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }),
            { status: 500, headers: corsHeaders }
        );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        // Check for force parameter (admin manual trigger) and run_now
        // (called by advance-tick after committing a new shard tick).
        let force = false;
        let runNow = false;
        try {
            const body = await Promise.race([
                req.json(),
                new Promise((_, reject) => setTimeout(() => reject(new Error("body read timeout")), 3000)),
            ]);
            force = body?.force === true;
            runNow = body?.run_now === true || body?.runNow === true;
        } catch (_) {
            // No body, invalid JSON, or timeout — not forced
        }

        const url = new URL(req.url);
        force = force || url.searchParams.get('force') === 'true' || req.headers.get('x-force') === 'true';
        runNow = runNow
            || url.searchParams.get('run_now') === 'true'
            || url.searchParams.get('runNow') === 'true'
            || req.headers.get('x-run-now') === 'true';

        console.log(`[advance-corp-tick] Invoked (force=${force}, run_now=${runNow})`);

        // For run_now / force calls, this function is being invoked as a
        // synchronous dependency (usually by advance-tick or an admin repair).
        // Await it so the caller sees the real result instead of a false
        // positive "started" response while failures disappear into logs.
        if (runNow || force) {
            const result = await advanceCorpTick(supabase, { force, runNow });
            return new Response(
                JSON.stringify({ status: result?.status || "processed", result }),
                { headers: corsHeaders }
            );
        }

        // Normal cron invocations stay backgrounded: the cron fires every
        // minute and advanceCorpTick has its own persisted idempotency guard.
        // EdgeRuntime.waitUntil keeps the worker alive after the HTTP response
        // returns, but any background failure is logged and can be retried by
        // the next cron fire if corp_last_processed_tick was not claimed.
        const work = advanceCorpTick(supabase, { force, runNow })
            .catch((err) => {
                console.error("[advance-corp-tick] Background work failed:", err);
            });

        if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
            EdgeRuntime.waitUntil(work);
        }

        return new Response(
            JSON.stringify({ status: "started" }),
            { headers: corsHeaders }
        );
    } catch (error) {
        console.error("[advance-corp-tick] Edge function error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: corsHeaders }
        );
    }
});
