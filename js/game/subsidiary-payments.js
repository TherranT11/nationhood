/**
 * subsidiary-payments.js — Tick processor for auto-rate policy payments.
 *
 * Processes all active subsidiary_auto_policies each tick:
 *   - Insurance: collect monthly premium from borrower → subsidiary sub_cash
 *   - Loans: collect monthly payment, reduce remaining_principal
 *   - Handle missed payments (insufficient funds) → increment payments_missed
 *   - Handle defaults (3+ missed → status = 'defaulted')
 *   - Handle expiry (insurance policies past expires_tick → status = 'lapsed')
 *   - Handle full repayment (loan remaining_principal <= 0 → status = 'repaid')
 */

var MISSED_PAYMENT_THRESHOLD = 3; // consecutive misses before default

function getLoanOriginalPrincipal(policy) {
    return Math.max(0, Number(policy.original_principal ?? policy.principal ?? 0));
}

/**
 * Process all active auto-rate policies for a nation.
 * Called once per tick per nation from the corp tick processor.
 *
 * @param {object} supabase
 * @param {string} nationId
 * @param {number} currentTick
 * @returns {Promise<{ processed: number, collected: number, missed: number, defaulted: number, expired: number, repaid: number }>}
 */
export async function processAutoRatePolicies(supabase, nationId, currentTick) {
    var { data: policies, error } = await supabase
        .from('subsidiary_auto_policies')
        .select('*')
        .eq('nation_id', nationId)
        .eq('status', 'active');

    if (error || !policies || policies.length === 0) {
        return { processed: 0, collected: 0, missed: 0, defaulted: 0, expired: 0, repaid: 0 };
    }

    var stats = { processed: 0, collected: 0, missed: 0, defaulted: 0, expired: 0, repaid: 0 };

    for (var i = 0; i < policies.length; i++) {
        var p = policies[i];
        stats.processed++;

        // Check expiry (insurance)
        if (p.expires_tick && currentTick >= p.expires_tick) {
            await supabase.from('subsidiary_auto_policies').update({ status: 'lapsed' }).eq('id', p.id);
            stats.expired++;
            continue;
        }

        // Check if already paid this tick (skip if last_payment_tick == currentTick)
        if (p.last_payment_tick === currentTick) continue;

        var payment = Number(p.monthly_payment) || 0;
        if (payment <= 0) continue;

        // Fetch borrower's cash
        var { data: borrower, error: bErr } = await supabase
            .from('factions')
            .select('corp_cash_reserves')
            .eq('id', p.borrower_faction_id)
            .single();

        if (bErr || !borrower) {
            console.error('[SubPayments] Failed to fetch borrower cash:', bErr?.message);
            continue;
        }

        var borrowerCash = Number(borrower.corp_cash_reserves ?? 0);

        if (borrowerCash >= payment) {
            // Successful payment
            var newBorrowerCash = borrowerCash - payment;

            // Deduct from borrower
            var { error: deductErr } = await supabase
                .from('factions')
                .update({ corp_cash_reserves: newBorrowerCash })
                .eq('id', p.borrower_faction_id);

            if (deductErr) {
                console.error('[SubPayments] Failed to deduct payment:', deductErr.message);
                continue;
            }

            // Credit to subsidiary's sub_cash
            var { data: subProp } = await supabase
                .from('corp_properties')
                .select('sub_cash')
                .eq('id', p.subsidiary_id)
                .single();

            if (subProp) {
                var newSubCash = Number(subProp.sub_cash ?? 0) + payment;
                await supabase
                    .from('corp_properties')
                    .update({ sub_cash: newSubCash })
                    .eq('id', p.subsidiary_id);
            }

            // Update policy
            var policyUpdate = {
                total_paid: Number(p.total_paid ?? 0) + payment,
                payments_made: (p.payments_made || 0) + 1,
                payments_missed: 0, // reset consecutive misses on successful payment
                last_payment_tick: currentTick,
            };

            // For loans: reduce remaining principal and track corp_debt
            if (p.service_type === 'loan') {
                var originalPrincipal = getLoanOriginalPrincipal(p);
                var interestPortion = Math.round(originalPrincipal * (Number(p.rate_at_issue ?? 0) / 100 / 12));
                var principalPortion = Math.max(0, payment - interestPortion);
                var oldPrincipal = Number(p.remaining_principal ?? 0);
                policyUpdate.remaining_principal = Math.max(0, oldPrincipal - principalPortion);
                if (p.original_principal == null && originalPrincipal > 0) {
                    policyUpdate.original_principal = originalPrincipal;
                }

                // Reduce borrower's corp_debt by principal paid down
                if (principalPortion > 0) {
                    var { data: debtRow, error: debtErr } = await supabase.from('factions')
                        .select('corp_debt').eq('id', p.borrower_faction_id).single();
                    if (!debtErr && debtRow) {
                        var { error: debtUpErr } = await supabase.from('factions').update({
                            corp_debt: Math.max(0, Number(debtRow.corp_debt ?? 0) - principalPortion),
                        }).eq('id', p.borrower_faction_id);
                        if (debtUpErr) console.warn('[SubPayments] Failed to reduce corp_debt:', debtUpErr.message);
                    }
                }

                // Check if fully repaid
                if (policyUpdate.remaining_principal <= 0) {
                    policyUpdate.status = 'repaid';
                    stats.repaid++;
                }
            }

            // Update rate revenue tracking
            await supabase.from('subsidiary_auto_rates')
                .update({ total_revenue: Number(p.total_paid ?? 0) + payment })
                .eq('id', p.rate_id);

            await supabase.from('subsidiary_auto_policies').update(policyUpdate).eq('id', p.id);
            stats.collected += payment;

        } else {
            // Missed payment — insufficient funds
            var newMissed = (p.payments_missed || 0) + 1;

            if (newMissed >= MISSED_PAYMENT_THRESHOLD) {
                // Default
                await supabase.from('subsidiary_auto_policies').update({
                    status: 'defaulted',
                    payments_missed: newMissed,
                    last_payment_tick: currentTick,
                }).eq('id', p.id);
                stats.defaulted++;
            } else {
                // Record miss
                await supabase.from('subsidiary_auto_policies').update({
                    payments_missed: newMissed,
                    last_payment_tick: currentTick,
                }).eq('id', p.id);
                stats.missed++;
            }
        }
    }

    return stats;
}

/**
 * Process insurance claims for auto-rate policies.
 * Called when a claimable event occurs (vessel loss, contract collapse, etc.)
 *
 * @param {object} supabase
 * @param {string} policyId — subsidiary_auto_policies.id
 * @param {number} claimAmount — requested claim amount
 * @param {string} claimReason — description
 * @param {number} currentTick
 * @returns {Promise<{ success: boolean, payout: number, error: string|null }>}
 */
export async function processInsuranceClaim(supabase, policyId, claimAmount, claimReason, currentTick) {
    var { data: policy, error } = await supabase
        .from('subsidiary_auto_policies')
        .select('*')
        .eq('id', policyId)
        .eq('service_type', 'insurance')
        .eq('status', 'active')
        .single();

    if (error || !policy) {
        return { success: false, payout: 0, error: 'Policy not found or not active.' };
    }

    // Calculate payout after deductible
    var deductible = Number(policy.deductible_pct ?? 10) / 100;
    var maxPayout = Number(policy.principal ?? 0); // insured value
    var requestedPayout = Math.min(claimAmount, maxPayout);
    var payout = Math.round(requestedPayout * (1 - deductible));

    // Fetch subsidiary cash to pay claim
    var { data: subProp } = await supabase
        .from('corp_properties')
        .select('sub_cash')
        .eq('id', policy.subsidiary_id)
        .single();

    var subCash = Number(subProp?.sub_cash ?? 0);

    if (subCash < payout) {
        // Subsidiary can't fully cover — pay what's available
        payout = Math.max(0, subCash);
    }

    if (payout <= 0) {
        return { success: false, payout: 0, error: 'Subsidiary has insufficient funds to pay claim.' };
    }

    // Deduct from subsidiary
    var { error: subErr } = await supabase
        .from('corp_properties')
        .update({ sub_cash: subCash - payout })
        .eq('id', policy.subsidiary_id);

    if (subErr) {
        return { success: false, payout: 0, error: 'Failed to deduct from subsidiary.' };
    }

    // Credit to claimant (borrower)
    var { data: claimant } = await supabase
        .from('factions')
        .select('corp_cash_reserves')
        .eq('id', policy.borrower_faction_id)
        .single();

    if (claimant) {
        await supabase
            .from('factions')
            .update({ corp_cash_reserves: Number(claimant.corp_cash_reserves ?? 0) + payout })
            .eq('id', policy.borrower_faction_id);
    }

    // Update policy
    await supabase.from('subsidiary_auto_policies').update({
        claims_count: (policy.claims_count || 0) + 1,
        total_claims_paid: Number(policy.total_claims_paid ?? 0) + payout,
        status: 'claimed',
    }).eq('id', policy.id);

    // Update rate's total claims
    await supabase.from('subsidiary_auto_rates')
        .update({ total_claims: Number(policy.total_claims_paid ?? 0) + payout })
        .eq('id', policy.rate_id);

    return { success: true, payout: payout, error: null };
}
