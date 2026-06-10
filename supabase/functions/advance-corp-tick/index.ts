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
 * surviving entrepreneur/shared money systems: central-bank loan
 * repayments, equity dividends, trade-agreement shipping, and the
 * entrepreneur airline-route allocator. The per-nation legacy corp
 * economy loop and the legacy bank-loan / finance-loan processors
 * (and their corp_cash_events ledger) were removed.
 */

import { createClient } from "npm:@supabase/supabase-js@2";

// Central Bank loans — manual servicing (20270258, parity with corp loans):
// NO auto-payment. Interest COMPOUNDS on `outstanding` each tick (rate/12); a
// loan still owed at term (started_tick + term_ticks) defaults (CEO −3 rep). The
// borrower pays manually via pay_central_bank_debt. Accrual runs at most once per
// tick (last_payment_tick guard). Growing outstanding reserves CB lending
// capacity; payoff/default frees it (capacity = discretionary×100 − Σ active
// outstanding) — no discretionary bookkeeping here.
async function processCentralBankLoanPayments(supabase, currentTick) {
    const results = { processed: 0, accrued: 0, defaulted: 0, repaid: 0 };
    const TICKS_PER_YEAR = 12;

    const { data: loans, error } = await supabase
        .from('central_bank_loans')
        .select('id, borrower_corp_id, outstanding, interest_rate, term_ticks, started_tick, status, last_payment_tick')
        .eq('status', 'active')
        .or(`last_payment_tick.is.null,last_payment_tick.neq.${currentTick}`);
    if (error) { console.warn('[CBLoanPayments] fetch failed:', error.message); return results; }
    if (!loans || loans.length === 0) return results;

    for (const loan of loans) {
        if (Number(loan.last_payment_tick) === Number(currentTick)) continue;
        const outstanding = Number(loan.outstanding) || 0;

        // Paid off (manually) → mark repaid.
        if (outstanding < 1) {
            await supabase.from('central_bank_loans')
                .update({ outstanding: 0, status: 'repaid', last_payment_tick: currentTick }).eq('id', loan.id);
            results.repaid++; results.processed++;
            continue;
        }

        // Term reached, still owed → default (parity with corp loans / bankruptcy).
        if (currentTick >= (Number(loan.started_tick) || 0) + (Number(loan.term_ticks) || 0)) {
            await supabase.from('central_bank_loans')
                .update({ status: 'defaulted', last_payment_tick: currentTick }).eq('id', loan.id);
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
            results.defaulted++; results.processed++;
            continue;
        }

        // Accrue compound interest (rate/12 per tick).
        const r = (Number(loan.interest_rate) || 0) / 100 / TICKS_PER_YEAR;
        await supabase.from('central_bank_loans')
            .update({ outstanding: Math.round(outstanding * (1 + r)), last_payment_tick: currentTick }).eq('id', loan.id);
        results.accrued++; results.processed++;
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
    console.log('[advance-corp-tick] BUILD_MARKER 2026-06-10-a (corp-payroll)');

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

    // Central Bank loan repayments (entrepreneur corp ↔ home-nation CB):
    // amortized payment from treasury_cash, principal frees CB capacity,
    // interest grows the CB pool.
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

    // Corp payroll (20270802): every corp pays employee_count × $1k +
    // hired salaries ÷ 12 from treasury_cash (floored at $0; full cost
    // accumulates into payroll_ytd). Hired players collect salary ÷ 12
    // on fully-covered ticks. Idempotent via last_payroll_tick.
    try {
        const { data: payRes, error: payErr } = await supabase.rpc(
            'process_corp_payroll', { p_tick: currentTick });
        if (payErr) {
            console.warn('[CorpPayroll] RPC failed:', payErr.message);
            summary.errors.push({ scope: 'corp_payroll', error: payErr.message });
        } else if (payRes && Number(payRes.corps_processed) > 0) {
            summary.corpPayroll = payRes;
            console.log(`[CorpPayroll] tick ${currentTick}: ${payRes.corps_processed} corps charged $${payRes.total_charged}, ${payRes.players_paid} player wages, ${payRes.shortfalls} shortfalls`);
        }
    } catch (payErr) {
        console.error('[advance-corp-tick] FAILED corp payroll:', payErr);
        summary.errors.push({ scope: 'corp_payroll', error: String(payErr) });
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

        // Apartment Complex rents — per-tick rent allocator (migration
        // 20270438). One global call: computes gross × occupancy −
        // maintenance per owned apartment, credits owner treasury,
        // stamps corp_buildings.last_processed_tick. Idempotent within
        // a tick. Net can go negative when nation stats sour — that's
        // the landlord-risk lever the Phase 2 design ships.
        try {
            const { data: aptRes, error: aptErr } = await supabase.rpc(
                'process_apartment_rents', { p_tick: currentTick });
            if (aptErr) {
                console.warn('[ApartmentRents] allocator RPC failed:', aptErr.message);
            } else if (aptRes && aptRes.success && Number(aptRes.apartments_run) > 0) {
                summary.apartmentRents = aptRes;
                console.log(`[ApartmentRents] tick ${currentTick}: ${aptRes.apartments_run} apartments, $${aptRes.total_net_rent} net rent`);
            }
        } catch (aptThrow) {
            console.warn('[ApartmentRents] allocator threw:', aptThrow?.message || aptThrow);
        }

        // Oil & Gas production loop — per-tick equipment runner
        // (migration 20270443). Pumps → crude_reserve, refineries
        // crude → refined, gas stations refined → treasury at retail.
        // No automatic spot sales — player fires sell_crude_to_spot /
        // sell_refined_to_spot manually. Idempotent within a tick via
        // entrepreneur_corps.oil_last_processed_tick.
        try {
            const { data: ogRes, error: ogErr } = await supabase.rpc(
                'process_oil_and_gas', { p_tick: currentTick });
            if (ogErr) {
                console.warn('[OilAndGas] production RPC failed:', ogErr.message);
            } else if (ogRes && ogRes.success && Number(ogRes.corps_processed) > 0) {
                summary.oilAndGas = ogRes;
                console.log(`[OilAndGas] tick ${currentTick}: ${ogRes.corps_processed} corps, ${ogRes.crude_produced} crude produced, ${ogRes.refined_produced} refined produced, $${ogRes.retail_revenue} retail`);
            }
        } catch (ogThrow) {
            console.warn('[OilAndGas] production threw:', ogThrow?.message || ogThrow);
        }

    } catch (shipErr) {
        console.error('[advance-corp-tick] FAILED shipping route processor:', shipErr);
        summary.errors.push({ scope: 'shipping_routes', error: String(shipErr) });
    }

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
