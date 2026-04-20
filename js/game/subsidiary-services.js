/**
 * subsidiary-services.js — Automated Insurance & Loan rate engine.
 *
 * Finance subsidiaries (Insurance/Banking subsectors) auto-generate
 * service rates derived from the host nation's interest_rates stat.
 * Corps operating in the same nation can accept coverage/loans at
 * these rates without player-to-player negotiation.
 *
 * Rate formula:
 *   base_rate = nation.interest_rates / 10  (typical: 3.5% - 4.2%)
 *   effective_rate = base_rate + owner_markup (0-5%)
 *
 * Insurance: effective_rate = annual premium as % of insured value
 * Loans: effective_rate = annual loan rate (applies by the loan's interest model: amortized vs flat).
 */

// ═══════════════════════════════════════════════════
// SUBSECTOR → SERVICE TYPE MAPPING
// ═══════════════════════════════════════════════════

// Subsector names as stored in corp_properties.subsector
var SERVICE_SUBSECTORS = {
    'Insurance': 'insurance',
    'Banking': 'loan',
};

/**
 * Determine if a subsidiary provides an auto-rate service.
 * @param {string} subsector — corp_properties.subsector value
 * @returns {string|null} service_type or null
 */
export function getServiceType(subsector) {
    return SERVICE_SUBSECTORS[subsector] || null;
}

// ═══════════════════════════════════════════════════
// RATE CALCULATION
// ═══════════════════════════════════════════════════

/**
 * Calculate the base rate from a nation's interest_rates stat.
 * interest_rates is 0-100 scale, typical 35-42.
 * base_rate = interest_rates / 10 → typical 3.5% - 4.2%
 *
 * @param {number} interestRates — nation.interest_rates (0-100)
 * @returns {number} base rate as percentage (e.g., 3.8)
 */
export function calculateBaseRate(interestRates) {
    var rate = Number(interestRates ?? 50) / 10;
    // Floor at 1.0%, cap at 15.0%
    return Math.max(1.0, Math.min(15.0, Math.round(rate * 100) / 100));
}

/**
 * Calculate insurance-specific rate adjustments.
 * Higher-risk nations (low stability, high civil_unrest) get premium surcharge.
 *
 * @param {object} nation — nation row
 * @returns {number} additional premium percentage (0-3%)
 */
export function calculateInsuranceRiskSurcharge(nation) {
    var stability = Number(nation.stability ?? 50);
    var civilUnrest = Number(nation.civil_unrest ?? 20);
    var surcharge = 0;

    // Stability below 40: +0.5% per 10 points below 40
    if (stability < 40) {
        surcharge += (40 - stability) / 10 * 0.5;
    }

    // Civil unrest above 30: +0.3% per 10 points above 30
    if (civilUnrest > 30) {
        surcharge += (civilUnrest - 30) / 10 * 0.3;
    }

    return Math.round(Math.min(3.0, surcharge) * 100) / 100;
}

/**
 * Calculate loan-specific rate adjustments.
 * Higher inflation and lower credit score increase the spread.
 *
 * @param {object} nation — nation row
 * @returns {number} additional spread percentage (0-2%)
 */
export function calculateLoanCreditSpread(nation) {
    var inflation = Number(nation.inflation ?? 38);
    var credit = Number(nation.credit ?? 50);
    var spread = 0;

    // Inflation above 50: +0.3% per 10 points above 50
    if (inflation > 50) {
        spread += (inflation - 50) / 10 * 0.3;
    }

    // Credit below 40: +0.4% per 10 points below 40
    if (credit < 40) {
        spread += (40 - credit) / 10 * 0.4;
    }

    return Math.round(Math.min(2.0, spread) * 100) / 100;
}

/**
 * Calculate the full effective rate for a subsidiary service.
 *
 * @param {object} nation — nation row with interest_rates, stability, etc.
 * @param {string} serviceType — 'insurance' or 'loan'
 * @param {number} markup — owner-set markup (0-5%)
 * @returns {{ baseRate: number, riskAdjustment: number, markup: number, effectiveRate: number }}
 */
export function calculateEffectiveRate(nation, serviceType, markup) {
    var baseRate = calculateBaseRate(nation.interest_rates);
    var riskAdj = 0;

    if (serviceType === 'insurance') {
        riskAdj = calculateInsuranceRiskSurcharge(nation);
    } else if (serviceType === 'loan') {
        riskAdj = calculateLoanCreditSpread(nation);
    }

    var ownerMarkup = Math.max(0, Math.min(5.0, Number(markup) || 0));
    var effective = Math.round((baseRate + riskAdj + ownerMarkup) * 100) / 100;

    return {
        baseRate: baseRate,
        riskAdjustment: riskAdj,
        markup: ownerMarkup,
        effectiveRate: effective,
    };
}

// ═══════════════════════════════════════════════════
// DEFAULT COVERAGE LIMITS
// ═══════════════════════════════════════════════════

/**
 * Calculate default coverage limit based on nation GDP.
 * Insurance: max coverage per policy = 0.1% of nation GDP
 * Loans: max loan amount = 0.05% of nation GDP
 */
export function calculateCoverageLimit(nation, serviceType) {
    var gdp = Number(nation.gdp) || 100000000000; // default 100B
    if (serviceType === 'insurance') {
        return Math.round(gdp * 0.001); // 0.1% of GDP
    }
    return Math.round(gdp * 0.0005); // 0.05% of GDP
}

// ═══════════════════════════════════════════════════
// AUTO-RATE GENERATION
// ═══════════════════════════════════════════════════

/**
 * Generate or update the auto-rate for a subsidiary.
 * Called when a subsidiary is created and each tick to reflect
 * changing nation interest_rates.
 *
 * @param {object} supabase
 * @param {object} subsidiary — corp_properties row (regional_hq)
 * @param {object} nation — full nation row
 * @param {number} currentTick
 * @returns {Promise<object|null>} the upserted rate row
 */
export async function generateAutoRate(supabase, subsidiary, nation, currentTick) {
    var serviceType = getServiceType(subsidiary.subsector);
    if (!serviceType) return null;

    // Fetch existing rate to preserve owner markup
    var { data: existing } = await supabase
        .from('subsidiary_auto_rates')
        .select('id, markup')
        .eq('subsidiary_id', subsidiary.id)
        .eq('service_type', serviceType)
        .maybeSingle();

    var ownerMarkup = existing ? Number(existing.markup) : 0;
    var rateInfo = calculateEffectiveRate(nation, serviceType, ownerMarkup);
    var coverageLimit = calculateCoverageLimit(nation, serviceType);

    var row = {
        subsidiary_id: subsidiary.id,
        faction_id: subsidiary.faction_id,
        nation_id: subsidiary.nation_id,
        service_type: serviceType,
        base_rate: rateInfo.baseRate,
        markup: rateInfo.markup,
        effective_rate: rateInfo.effectiveRate,
        coverage_limit: coverageLimit,
        is_active: subsidiary.is_active !== false,
        last_updated_tick: currentTick,
        updated_at: new Date().toISOString(),
    };

    if (existing) {
        // Update existing rate
        var { data, error } = await supabase
            .from('subsidiary_auto_rates')
            .update(row)
            .eq('id', existing.id)
            .select('*')
            .single();

        if (error) {
            console.error('[SubServices] Failed to update auto-rate:', error.message);
            return null;
        }
        return data;
    } else {
        // Insert new rate with defaults
        row.min_term_months = serviceType === 'insurance' ? 6 : 12;
        row.max_term_months = serviceType === 'insurance' ? 24 : 60;
        row.deductible_pct = serviceType === 'insurance' ? 10 : 0;

        var { data: inserted, error: insertErr } = await supabase
            .from('subsidiary_auto_rates')
            .insert(row)
            .select('*')
            .single();

        if (insertErr) {
            console.error('[SubServices] Failed to create auto-rate:', insertErr.message);
            return null;
        }
        return inserted;
    }
}

// ═══════════════════════════════════════════════════
// TICK PROCESSOR: UPDATE ALL RATES PER NATION
// ═══════════════════════════════════════════════════

/**
 * Update all auto-rates for Finance subsidiaries in a nation.
 * Called once per tick per nation from the tick processor.
 *
 * Finds all active Insurance/Banking regional_hq subsidiaries in the
 * nation and recalculates their rates based on current interest_rates.
 *
 * @param {object} supabase
 * @param {object} nation — full nation row
 * @param {number} currentTick
 * @returns {Promise<number>} count of rates updated
 */
export async function updateNationAutoRates(supabase, nation, currentTick) {
    // Find all Finance subsidiaries in this nation with Insurance or Banking subsector
    var { data: subsidiaries, error } = await supabase
        .from('corp_properties')
        .select('id, faction_id, nation_id, subsector, is_active')
        .eq('nation_id', nation.id)
        .eq('type', 'regional_hq')
        .eq('is_active', true)
        .in('subsector', ['Insurance', 'Banking']);

    if (error || !subsidiaries || subsidiaries.length === 0) return 0;

    var updated = 0;
    for (var i = 0; i < subsidiaries.length; i++) {
        var result = await generateAutoRate(supabase, subsidiaries[i], nation, currentTick);
        if (result) updated++;
    }

    return updated;
}

// ═══════════════════════════════════════════════════
// FETCH AVAILABLE RATES FOR A NATION
// ═══════════════════════════════════════════════════

/**
 * Fetch all active auto-rates available in a nation.
 * Used by the UI to show corps what insurance/loan options exist.
 *
 * @param {object} supabase
 * @param {string} nationId
 * @param {string} [serviceType] — optional filter: 'insurance' or 'loan'
 * @returns {Promise<Array>}
 */
export async function fetchAvailableRates(supabase, nationId, serviceType) {
    var query = supabase
        .from('subsidiary_auto_rates')
        .select('*, corp_properties!inner(name, subsector, faction_id)')
        .eq('nation_id', nationId)
        .eq('is_active', true);

    if (serviceType) {
        query = query.eq('service_type', serviceType);
    }

    var { data, error } = await query.order('effective_rate', { ascending: true });

    if (error) {
        console.error('[SubServices] Failed to fetch rates:', error.message);
        return [];
    }
    return data || [];
}

/**
 * Fetch active policies for a borrower/insured corp.
 *
 * @param {object} supabase
 * @param {string} factionId — the borrower/insured faction
 * @returns {Promise<Array>}
 */
export async function fetchMyPolicies(supabase, factionId) {
    var { data, error } = await supabase
        .from('subsidiary_auto_policies')
        .select('*')
        .eq('borrower_faction_id', factionId)
        .in('status', ['active', 'lapsed'])
        .order('started_tick', { ascending: false });

    if (error) {
        console.error('[SubServices] Failed to fetch policies:', error.message);
        return [];
    }
    return data || [];
}
