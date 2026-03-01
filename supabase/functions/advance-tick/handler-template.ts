// @ts-nocheck
/**
 * Supabase Edge Function: advance-tick
 *
 * Server-side tick processor for Nationhood Alpha.
 * Called by pg_cron every minute — checks if next_tick_at has passed,
 * acquires a database lock, and processes the full game tick.
 *
 * AUTO-GENERATED — do not edit index.ts directly.
 * Source: js/game-common.js + supabase/functions/advance-tick/handler-template.ts
 * Regenerate with: node scripts/sync-edge-function.js
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

let rpcPreflightCheckPromise = null;

async function ensureApRpcAvailability(supabase) {
    if (!rpcPreflightCheckPromise) {
        rpcPreflightCheckPromise = (async () => {
            const probeFactionId = "00000000-0000-0000-0000-000000000000";

            const probes = [
                {
                    name: "accumulate_ap",
                    call: () => supabase.rpc("accumulate_ap", {
                        p_faction_id: probeFactionId,
                        p_gain: 0,
                        p_max_ap: 20,
                    }),
                },
                {
                    name: "deduct_ap",
                    call: () => supabase.rpc("deduct_ap", {
                        p_faction_id: probeFactionId,
                        p_cost: 0,
                    }),
                },
            ];

            for (const probe of probes) {
                const { error } = await probe.call();
                if (error) {
                    throw new Error(
                        `Missing or inaccessible required RPC '${probe.name}'. Deploy SQL function/grants before rolling out advance-tick. Detail: ${error.message}`
                    );
                }
            }
            console.log("[advance-tick] RPC preflight passed for accumulate_ap and deduct_ap.");
        })();
    }

    return rpcPreflightCheckPromise;
}

// ===== GAME LOGIC (from js/game-common.js) =====

// __GAME_COMMON_JS__

// ===== END GAME LOGIC =====


// ===== TICK-ONLY HELPERS (edge-function-only — not in game-common.js) =====

// ==================== POPULATION GROWTH ====================
//
// Population growth is derived from birth_rate and death_rate each tick:
//   base = 50 + (birth_rate - death_rate) / 2
//
// Any policy/crisis effects that modified population_growth are preserved
// as additive deltas on top of the base.
//
// The final population_growth (0-100) drives actual population change:
//   0   → -1% per tick (max decline)
//   50  → 0% per tick (equilibrium)
//   100 → +1% per tick (max growth)

async function processPopulationGrowth(supabase: any, nation: any, popGrowthBeforeEffects: number) {
    const birthRate = Number(nation.birth_rate ?? 50);
    const deathRate = Number(nation.death_rate ?? 50);

    // Base population growth from birth rate minus death rate
    const base = 50 + (birthRate - deathRate) / 2;

    // Policy/crisis delta: how much effects shifted population_growth this tick
    const currentPG = Number(nation.population_growth ?? 50);
    const policyDelta = currentPG - popGrowthBeforeEffects;

    // Final population_growth = base + policy adjustments, clamped 0-100
    const finalPG = Math.round(Math.max(0, Math.min(100, base + policyDelta)) * 10) / 10;

    // Population change: linear mapping from 0-100 to -1%..+1% per tick
    const population = Number(nation.population ?? 0);
    const monthlyRate = ((finalPG - 50) / 50) * 0.01;
    const popChange = Math.round(population * monthlyRate);
    const newPopulation = Math.max(0, population + popChange);

    // Scale eligible_voters proportionally
    const eligibleVoters = Number(nation.eligible_voters ?? 0);
    const voterRatio = population > 0 ? (eligibleVoters / population) : 0;
    const newEligibleVoters = Math.round(newPopulation * voterRatio);

    const updates: any = {
        population_growth: finalPG,
        population: newPopulation,
        eligible_voters: newEligibleVoters
    };

    if (finalPG !== currentPG || popChange !== 0) {
        const { error } = await supabase.from('nations').update(updates).eq('id', nation.id);
        if (error) {
            console.error(`[processPopulationGrowth] Update failed for ${nation.name}:`, error.message);
            return null;
        }
        Object.assign(nation, updates);
        console.log(`[processPopulationGrowth] ${nation.name}: birth=${birthRate} death=${deathRate} base=${base.toFixed(1)} delta=${policyDelta.toFixed(1)} final=${finalPG} pop_change=${popChange > 0 ? '+' : ''}${popChange}`);
    }

    return { base, policyDelta, finalPG, popChange, newPopulation, newEligibleVoters };
}


async function processIncumbentCampaignBonuses(supabase, nation, currentTick) {
    if (!isPresidentialRepublic(nation)) return;

    const { data: president } = await supabase
        .from('presidents')
        .select('id, faction_id, first_name, last_name')
        .eq('nation_id', nation.id)
        .eq('is_active', true)
        .order('elected_tick', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (!president) return;

    const leadTicks = GAME_CONFIG.PRESIDENTIAL_CANDIDATE_LEAD_TICKS;
    const { data: upcomingElection } = await supabase
        .from('elections')
        .select('id, election_tick')
        .eq('nation_id', nation.id)
        .eq('status', 'scheduled')
        .eq('election_type', 'presidential')
        .gt('election_tick', currentTick)
        .lte('election_tick', currentTick + leadTicks)
        .limit(1)
        .maybeSingle();

    if (!upcomingElection) return;

    const ticksToElection = upcomingElection.election_tick - currentTick;
    console.log(`Campaign bonuses for incumbent ${president.first_name} ${president.last_name} in ${nation.name} (${ticksToElection} ticks to election)`);

    await adjustMomentumAll(supabase, nation.id, president.faction_id, 2, 'campaign:incumbent_bonus');

    const { data: nationStats } = await supabase
        .from('nations')
        .select('stability, happiness')
        .eq('id', nation.id)
        .single();

    if (nationStats) {
        const updates = {};
        if ((nationStats.stability || 0) >= 60) {
            updates.happiness = Math.max(0, Math.min(100, Math.round(((nationStats.happiness || 50) + 1) * 10) / 10));
        }
        if ((nationStats.happiness || 0) >= 60) {
            updates.stability = Math.max(0, Math.min(100, Math.round(((nationStats.stability || 50) + 1) * 10) / 10));
        }
        if (Object.keys(updates).length > 0) {
            await supabase.from('nations').update(updates).eq('id', nation.id);
        }
    }
}

function advanceMonth(currentDate) {
    const parts = currentDate.split(',');
    const month = parts[0].trim();
    const year = parseInt(parts[1].trim());

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const idx = months.indexOf(month);
    if (idx === -1) { console.error('Invalid month:', month); return currentDate; }

    const nextIdx = (idx + 1) % 12;
    const nextYear = nextIdx === 0 ? year + 1 : year;
    return `${months[nextIdx]}, ${nextYear}`;
}

async function acquireTickLock(supabase) {
    const STALE_LOCK_MS = 5 * 60 * 1000; // 5 minutes
    const now = new Date().toISOString();

    // Attempt: acquire lock when tick_processing is false
    const { data: acquired, error: err1 } = await supabase
        .from('shard')
        .update({ tick_processing: true, tick_processing_started_at: now })
        .eq('name', 'Alpha Shard')
        .eq('tick_processing', false)
        .select('name');

    if (!err1 && acquired && acquired.length > 0) return true;

    // Check for stale lock (crashed tab)
    const { data: shard } = await supabase
        .from('shard')
        .select('tick_processing, tick_processing_started_at')
        .eq('name', 'Alpha Shard')
        .single();

    if (shard && shard.tick_processing && shard.tick_processing_started_at) {
        const lockAge = Date.now() - new Date(shard.tick_processing_started_at).getTime();
        if (lockAge > STALE_LOCK_MS) {
            console.warn('Stale tick lock detected (' + Math.round(lockAge / 1000) + 's old), forcing acquire');
            const { data: forced, error: err2 } = await supabase
                .from('shard')
                .update({ tick_processing: true, tick_processing_started_at: now })
                .eq('name', 'Alpha Shard')
                .eq('tick_processing', true)
                .select('name');
            return !err2 && forced && forced.length > 0;
        }
    }

    return false;
}

async function releaseTickLock(supabase) {
    await supabase
        .from('shard')
        .update({ tick_processing: false, tick_processing_started_at: null })
        .eq('name', 'Alpha Shard');
}

/**
 * Scan all effect records in the database for invalid stat keys.
 * Logs errors for any stat_key that doesn't match NATION_STAT_COLUMNS
 * (after alias resolution). Runs periodically as a safety net.
 */
async function auditStatKeys(supabase) {
    const invalid = [];

    // 1. Policy stat_effects
    const { data: policies } = await supabase.from('policies').select('id, policy_name, stat_effects');
    for (const p of (policies || [])) {
        for (const eff of (p.stat_effects || [])) {
            const resolved = normalizeNationStatKey(eff.stat_key);
            if (!resolved || !NATION_STAT_COLUMN_SET.has(resolved)) {
                invalid.push({ source: 'policy', name: p.policy_name, id: p.id, bad_key: eff.stat_key });
            }
        }
    }

    // 2. Crisis effects
    const { data: crisisEffects } = await supabase.from('crisis_effects').select('id, crisis_template_id, stat_key, target');
    for (const ce of (crisisEffects || [])) {
        if (ce.target !== 'nation') continue;
        const resolved = normalizeNationStatKey(ce.stat_key);
        if (!resolved || !NATION_STAT_COLUMN_SET.has(resolved)) {
            invalid.push({ source: 'crisis_effect', id: ce.id, template_id: ce.crisis_template_id, bad_key: ce.stat_key });
        }
    }

    // 3. Crisis triggers
    const { data: crisisTriggers } = await supabase.from('crisis_triggers').select('id, crisis_template_id, stat_key');
    for (const ct of (crisisTriggers || [])) {
        const resolved = normalizeNationStatKey(ct.stat_key);
        if (!resolved || !NATION_STAT_COLUMN_SET.has(resolved)) {
            invalid.push({ source: 'crisis_trigger', id: ct.id, template_id: ct.crisis_template_id, bad_key: ct.stat_key });
        }
    }

    // 4. Crisis end triggers
    const { data: crisisEndTriggers } = await supabase.from('crisis_end_triggers').select('id, crisis_template_id, stat_key');
    for (const cet of (crisisEndTriggers || [])) {
        const resolved = normalizeNationStatKey(cet.stat_key);
        if (!resolved || !NATION_STAT_COLUMN_SET.has(resolved)) {
            invalid.push({ source: 'crisis_end_trigger', id: cet.id, template_id: cet.crisis_template_id, bad_key: cet.stat_key });
        }
    }

    // 5. Event effects
    const { data: eventEffects } = await supabase.from('event_effects').select('id, event_id, stat_key, target');
    for (const ee of (eventEffects || [])) {
        if (ee.target !== 'nation') continue;
        const resolved = normalizeNationStatKey(ee.stat_key);
        if (!resolved || !NATION_STAT_COLUMN_SET.has(resolved)) {
            invalid.push({ source: 'event_effect', id: ee.id, event_id: ee.event_id, bad_key: ee.stat_key });
        }
    }

    // 6. Event triggers
    const { data: eventTriggers } = await supabase.from('event_triggers').select('id, event_id, stat_key');
    for (const et of (eventTriggers || [])) {
        if (!et.stat_key) continue;
        const resolved = normalizeNationStatKey(et.stat_key);
        if (!resolved || !NATION_STAT_COLUMN_SET.has(resolved)) {
            invalid.push({ source: 'event_trigger', id: et.id, event_id: et.event_id, bad_key: et.stat_key });
        }
    }

    if (invalid.length > 0) {
        console.error(`[auditStatKeys] Found ${invalid.length} invalid stat key(s) in the database:`);
        for (const entry of invalid) {
            console.error(`  - ${entry.source}: "${entry.bad_key}" (id=${entry.id}${entry.name ? ', name=' + entry.name : ''})`);
        }
    } else {
        console.log('[auditStatKeys] All stat keys valid.');
    }

    return invalid;
}

/**
 * Process lingering approval decay from minister purges (autocracy mechanic).
 */
async function processPurgeDecay(supabase, nationId, currentTick) {
    const { data: purgeActions } = await supabase
        .from('campaign_actions')
        .select('id, party_id, result')
        .eq('nation_id', nationId)
        .eq('action_type', 'purge_minister');

    if (!purgeActions || purgeActions.length === 0) return;

    for (const action of purgeActions) {
        const result = action.result;
        if (!result || !result.decay_ticks_remaining || result.decay_ticks_remaining <= 0) continue;

        const decayRate = result.decay_rate || 1;
        await adjustMomentumAll(supabase, nationId, action.party_id, -decayRate, 'purge:decay');

        const newRemaining = result.decay_ticks_remaining - 1;
        await supabase.from('campaign_actions')
            .update({ result: { ...result, decay_ticks_remaining: newRemaining } })
            .eq('id', action.id);
    }
}

// ==================== SOVEREIGN DEFAULT — TICK-ONLY HELPERS ====================

/**
 * Per-tick debt mechanics: update burden, deteriorate credit, check lockout,
 * and programmatically trigger a Sovereign Debt Crisis when conditions are met.
 */
async function processSovereignDebtMechanics(supabase, nation, currentTick) {
    const ratio = getDebtToGDP(nation);
    if (!isFinite(ratio)) return null;

    const burden = calculateDebtServiceBurden(nation);
    const creditDeterioration = calculateCreditDeterioration(nation);
    const currentCredit = Number(nation.credit ?? 50);
    const cfg = SOVEREIGN_DEFAULT_CONFIG;

    const updates: any = {};
    const results: any = { nationId: nation.id, ratio, burden };

    // 1. Update debt_service_burden if changed
    const oldBurden = Number(nation.debt_service_burden ?? 0);
    if (Math.abs(burden - oldBurden) > 0.001) {
        updates.debt_service_burden = Math.round(burden * 1000) / 1000;
        results.burdenChanged = true;
    }

    // 2. Apply credit deterioration (per-tick penalty from high debt)
    if (creditDeterioration > 0 && currentCredit > 0) {
        const newCredit = Math.max(0, Math.round((currentCredit - creditDeterioration) * 10) / 10);
        updates.credit = newCredit;
        results.creditDeterioration = creditDeterioration;
        results.creditBefore = currentCredit;
        results.creditAfter = newCredit;
    }

    // 3. Check credit lockout (credit <= 5 means locked out of borrowing)
    const effectiveCredit = updates.credit !== undefined ? updates.credit : currentCredit;
    const wasLocked = Boolean(nation.credit_locked_out);
    const shouldLock = effectiveCredit <= cfg.CREDIT_LOCKOUT_THRESHOLD;
    if (shouldLock !== wasLocked) {
        updates.credit_locked_out = shouldLock;
        results.creditLockoutChanged = shouldLock;
    }

    // Write updates
    if (Object.keys(updates).length > 0) {
        const { error } = await supabase.from('nations').update(updates).eq('id', nation.id);
        if (error) {
            console.error(`[SovereignDebt] Update failed for ${nation.name}:`, error.message);
            return results;
        }
        Object.assign(nation, updates);
    }

    // 4. Programmatically trigger Sovereign Debt Crisis when:
    //    debt-to-GDP > 200% AND credit <= 15 AND no crisis already active
    if (ratio >= cfg.DEBT_CRISIS_MIN_RATIO && effectiveCredit <= cfg.DEBT_CRISIS_MAX_CREDIT) {
        const { data: existing } = await supabase
            .from('active_crises')
            .select('id')
            .eq('nation_id', nation.id)
            .eq('crisis_id', SOVEREIGN_DEBT_CRISIS_ID);

        if (!existing || existing.length === 0) {
            const { error: insertErr } = await supabase.from('active_crises').insert({
                crisis_id: SOVEREIGN_DEBT_CRISIS_ID,
                nation_id: nation.id,
                started_at_tick: currentTick,
                effects_applied_log: []
            });
            if (!insertErr) {
                results.debtCrisisTriggered = true;
                console.log(`[SovereignDebt] Debt Crisis triggered for ${nation.name} (ratio=${(ratio * 100).toFixed(0)}%, credit=${effectiveCredit})`);
                await supabase.from('event_log').insert({
                    nation_id: nation.id,
                    event_name: 'CRISIS_STARTED: Sovereign Debt Crisis',
                    description_used: `Crushing debt (${(ratio * 100).toFixed(0)}% of GDP) and low creditworthiness have triggered a sovereign debt crisis.`,
                    category: 'crisis',
                    effects_applied: [],
                    fired_at_tick: currentTick
                });
            }
        }
    }

    if (results.burdenChanged || results.creditDeterioration || results.creditLockoutChanged || results.debtCrisisTriggered) {
        console.log(`[SovereignDebt] ${nation.name}: ratio=${(ratio * 100).toFixed(0)}% burden=${burden.toFixed(3)} credit=${effectiveCredit}${shouldLock ? ' LOCKED' : ''}`);
    }

    return results;
}

/**
 * Called when a default_resolution bill passes.
 * Applies immediate penalties, reduces debt, starts Sovereign Default Crisis,
 * records history, and triggers contagion on trade partners.
 */
async function enactSovereignDefault(supabase, bill, currentTick) {
    const cfg = SOVEREIGN_DEFAULT_CONFIG;

    // 1. Look up the default_resolution record
    const { data: resolution } = await supabase
        .from('default_resolutions')
        .select('*')
        .eq('bill_id', bill.id)
        .single();

    if (!resolution) {
        console.error(`[enactSovereignDefault] No default_resolution found for bill ${bill.id}`);
        return;
    }

    // 2. Fetch fresh nation data
    const { data: nation } = await supabase
        .from('nations')
        .select('*')
        .eq('id', bill.nation_id)
        .single();
    if (!nation) return;

    // 3. Calculate multipliers
    const multiplier = getDefaultPenaltyMultiplier(resolution.default_type, resolution.repayment_rate);
    const discount = calculateAusterityDiscount(resolution.austerity_commitments || []);
    const discountedMultiplier = multiplier * (1 - discount);

    // 4. Calculate new debt
    const currentDebt = Number(nation.debt ?? 0);
    const debtAfter = resolution.default_type === 'full'
        ? 0
        : Math.round(currentDebt * (resolution.repayment_rate || 0.5));

    // 5. Apply immediate stat penalties
    const clamp = (val, delta) => Math.max(0, Math.min(100, Math.round((val + delta) * 10) / 10));

    const nationUpdates: any = {
        debt: debtAfter,
        last_default_tick: currentTick,
        credit: clamp(Number(nation.credit ?? 50), cfg.FULL_DEFAULT_CREDIT_HIT * discountedMultiplier),
        currency_strength: clamp(Number(nation.currency_strength ?? 50), cfg.FULL_DEFAULT_CURRENCY_HIT * multiplier),
        foreign_investment: clamp(Number(nation.foreign_investment ?? 50), cfg.FULL_DEFAULT_FOREIGN_INV_HIT * discountedMultiplier),
        international_reputation: clamp(Number(nation.international_reputation ?? 50), cfg.FULL_DEFAULT_INTL_REP_HIT * discountedMultiplier),
        interest_rates: clamp(Number(nation.interest_rates ?? 50), cfg.FULL_DEFAULT_INTEREST_SPIKE * multiplier),
        inflation: clamp(Number(nation.inflation ?? 50), cfg.FULL_DEFAULT_INFLATION_SPIKE * multiplier),
        trade_balance: clamp(Number(nation.trade_balance ?? 50), cfg.FULL_DEFAULT_TRADE_HIT * multiplier),
        standard_of_living: clamp(Number(nation.standard_of_living ?? 50), cfg.FULL_DEFAULT_SOL_HIT * multiplier),
        happiness: clamp(Number(nation.happiness ?? 50), cfg.FULL_DEFAULT_HAPPINESS_HIT * multiplier),
    };

    // Re-derive debt_service_burden and credit lockout from new values
    nationUpdates.debt_service_burden = (() => {
        const gdp = Number(nation.gdp ?? 0);
        if (gdp <= 0 || debtAfter <= 0) return 0;
        const newRatio = debtAfter / gdp;
        if (newRatio <= cfg.BURDEN_THRESHOLD) return 0;
        return Math.round(Math.min(cfg.BURDEN_MAX, (newRatio - cfg.BURDEN_THRESHOLD) * cfg.BURDEN_SCALE) * 1000) / 1000;
    })();
    nationUpdates.credit_locked_out = nationUpdates.credit <= cfg.CREDIT_LOCKOUT_THRESHOLD;

    const { error: updateErr } = await supabase.from('nations').update(nationUpdates).eq('id', nation.id);
    if (updateErr) {
        console.error(`[enactSovereignDefault] Nation update failed:`, updateErr.message);
        return;
    }

    console.log(`[enactSovereignDefault] ${nation.name}: ${resolution.default_type} default enacted. Debt ${currentDebt} → ${debtAfter}, multiplier=${multiplier.toFixed(2)}, discount=${discount.toFixed(2)}`);

    // 6. Government approval shock
    await adjustGovernmentApprovalEvent(supabase, nation.id, cfg.FULL_DEFAULT_GOV_APPROVAL_HIT * multiplier, 'sovereign_default:enacted');

    // 7. Record in default_history
    await supabase.from('default_history').insert({
        nation_id: nation.id,
        default_resolution_id: resolution.id,
        default_type: resolution.default_type,
        repayment_rate: resolution.repayment_rate,
        debt_before: currentDebt,
        debt_after: debtAfter,
        executed_at_tick: currentTick
    });

    // 8. Update resolution status
    await supabase.from('default_resolutions').update({
        status: 'passed',
        resolved_at_tick: currentTick
    }).eq('id', resolution.id);

    // 9. Start Sovereign Default Crisis
    const { data: existingCrisis } = await supabase
        .from('active_crises')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('crisis_id', SOVEREIGN_DEFAULT_CRISIS_ID);

    if (!existingCrisis || existingCrisis.length === 0) {
        await supabase.from('active_crises').insert({
            crisis_id: SOVEREIGN_DEFAULT_CRISIS_ID,
            nation_id: nation.id,
            started_at_tick: currentTick,
            effects_applied_log: []
        });
        console.log(`[enactSovereignDefault] Sovereign Default Crisis started for ${nation.name}`);
    }

    // 10. Event log
    await supabase.from('event_log').insert({
        nation_id: nation.id,
        event_name: 'CRISIS_STARTED: Sovereign Default',
        description_used: `${nation.name} has ${resolution.default_type === 'full' ? 'fully defaulted on' : 'partially restructured'} its sovereign debt. International markets react with alarm.`,
        category: 'crisis',
        effects_applied: [],
        fired_at_tick: currentTick
    });

    // 11. Contagion — hit trade partners' credit
    try {
        // Find nations that trade with this nation (from most recent tick data)
        const { data: partners } = await supabase
            .from('trade_partners')
            .select('importer_nation_id, trade_volume')
            .eq('exporter_nation_id', nation.id)
            .order('tick', { ascending: false })
            .limit(50);

        const { data: partners2 } = await supabase
            .from('trade_partners')
            .select('exporter_nation_id, trade_volume')
            .eq('importer_nation_id', nation.id)
            .order('tick', { ascending: false })
            .limit(50);

        // Unique set of partner nation IDs
        const partnerIds = new Set<string>();
        (partners || []).forEach(p => partnerIds.add(p.importer_nation_id));
        (partners2 || []).forEach(p => partnerIds.add(p.exporter_nation_id));
        partnerIds.delete(nation.id); // exclude self

        for (const partnerId of partnerIds) {
            // Random contagion hit within range
            const hit = -(cfg.CONTAGION_CREDIT_MIN + Math.random() * (cfg.CONTAGION_CREDIT_MAX - cfg.CONTAGION_CREDIT_MIN));
            const { data: partnerNation } = await supabase
                .from('nations')
                .select('credit, name')
                .eq('id', partnerId)
                .single();

            if (partnerNation) {
                const newCredit = Math.max(0, Math.round((Number(partnerNation.credit ?? 50) + hit) * 10) / 10);
                await supabase.from('nations').update({ credit: newCredit }).eq('id', partnerId);
                console.log(`[Contagion] ${partnerNation.name}: credit ${hit.toFixed(1)} (${nation.name} default)`);

                await supabase.from('event_log').insert({
                    nation_id: partnerId,
                    event_name: 'Sovereign Default Contagion',
                    description_used: `${nation.name}'s sovereign default has shaken investor confidence in the region.`,
                    category: 'economy',
                    effects_applied: [{ stat: 'credit', change: Math.round(hit * 10) / 10 }],
                    fired_at_tick: currentTick
                });
            }
        }
        console.log(`[Contagion] ${partnerIds.size} trade partners affected by ${nation.name}'s default`);
    } catch (contagionErr) {
        console.error(`[Contagion] Failed:`, contagionErr);
    }
}

/**
 * Called when a default_resolution bill fails.
 * Applies failure consequences: partial market recovery, PM approval hit.
 */
async function handleFailedDefaultResolution(supabase, bill, currentTick) {
    const cfg = SOVEREIGN_DEFAULT_CONFIG;

    // 1. Look up the default_resolution record
    const { data: resolution } = await supabase
        .from('default_resolutions')
        .select('*')
        .eq('bill_id', bill.id)
        .single();

    if (!resolution) {
        console.error(`[handleFailedDefaultResolution] No default_resolution found for bill ${bill.id}`);
        return;
    }

    // 2. Fetch nation
    const { data: nation } = await supabase
        .from('nations')
        .select('id, name, currency_strength, foreign_investment, international_reputation')
        .eq('id', bill.nation_id)
        .single();
    if (!nation) return;

    // 3. Apply failure consequences: partial market recovery from filing shock,
    //    but PM takes an approval hit for the failed political gambit
    const clamp = (val, delta) => Math.max(0, Math.min(100, Math.round((val + delta) * 10) / 10));

    const updates: any = {
        currency_strength: clamp(Number(nation.currency_strength ?? 50), cfg.FAILURE_CURRENCY_RECOVERY),
        foreign_investment: clamp(Number(nation.foreign_investment ?? 50), cfg.FAILURE_FOREIGN_INV_RECOVERY),
        international_reputation: clamp(Number(nation.international_reputation ?? 50), cfg.FAILURE_INTL_REP_HIT),
    };

    await supabase.from('nations').update(updates).eq('id', nation.id);
    await adjustGovernmentApprovalEvent(supabase, nation.id, cfg.FAILURE_PM_APPROVAL_HIT, 'sovereign_default:failed');

    // 4. Update resolution status
    await supabase.from('default_resolutions').update({
        status: 'failed',
        resolved_at_tick: currentTick
    }).eq('id', resolution.id);

    // 5. Event log
    await supabase.from('event_log').insert({
        nation_id: nation.id,
        event_name: 'Default Resolution Failed',
        description_used: `Parliament rejected the sovereign default resolution. Markets show cautious relief, but the government's credibility has taken a hit.`,
        category: 'economy',
        effects_applied: [
            { stat: 'currency_strength', change: cfg.FAILURE_CURRENCY_RECOVERY },
            { stat: 'foreign_investment', change: cfg.FAILURE_FOREIGN_INV_RECOVERY },
            { stat: 'international_reputation', change: cfg.FAILURE_INTL_REP_HIT }
        ],
        fired_at_tick: currentTick
    });

    console.log(`[handleFailedDefaultResolution] ${nation.name}: resolution failed, market partial recovery applied`);
}

/**
 * Per-tick processing of active austerity commitments from enacted defaults.
 * Applies gradual stat reductions as promised in the default resolution.
 */
async function processAusterityCommitments(supabase, nation, currentTick) {
    // Find default_resolutions with active austerity commitments for this nation
    const { data: resolutions } = await supabase
        .from('default_resolutions')
        .select('id, austerity_commitments, resolved_at_tick')
        .eq('nation_id', nation.id)
        .eq('status', 'passed')
        .not('austerity_commitments', 'eq', '[]');

    if (!resolutions || resolutions.length === 0) return [];

    const results = [];
    const nationUpdates: any = {};

    for (const res of resolutions) {
        const commitments = res.austerity_commitments || [];
        if (!Array.isArray(commitments) || commitments.length === 0) continue;

        const resolvedTick = res.resolved_at_tick || 0;
        const ticksElapsed = currentTick - resolvedTick;
        let allComplete = true;

        for (const commitment of commitments) {
            if (!commitment.stat || !commitment.reduction || !commitment.over_ticks) continue;

            // Skip if already complete
            if (ticksElapsed > commitment.over_ticks) continue;
            if (ticksElapsed <= 0) { allComplete = false; continue; }

            allComplete = false;

            // Apply per-tick reduction: total_reduction / duration_ticks
            const perTickReduction = commitment.reduction / commitment.over_ticks;
            const resolvedKey = normalizeNationStatKey(commitment.stat);
            if (!resolvedKey || !NATION_STAT_COLUMN_SET.has(resolvedKey)) continue;

            const currentVal = Number(nation[resolvedKey] ?? 50);
            const newVal = Math.max(0, Math.round((currentVal - perTickReduction) * 10) / 10);

            if (newVal !== currentVal) {
                nationUpdates[resolvedKey] = newVal;
                nation[resolvedKey] = newVal;
                results.push({ stat: resolvedKey, change: -perTickReduction, ticksRemaining: commitment.over_ticks - ticksElapsed });
            }
        }
    }

    if (Object.keys(nationUpdates).length > 0) {
        await supabase.from('nations').update(nationUpdates).eq('id', nation.id);
        console.log(`[Austerity] ${nation.name}: applied ${results.length} commitment adjustment(s)`);
    }

    return results;
}

// ==================== ADVANCE TICK ====================

async function advanceTick(supabase) {
    // 1. Pre-compute next tick metadata
    const { data: shard } = await supabase
        .from('shard')
        .select('current_tick, tick_interval_hours, current_date, next_tick_at')
        .eq('name', 'Alpha Shard')
        .single();
    if (!shard) throw new Error('Shard not found');

    const newTick = (shard.current_tick || 0) + 1;
    // Anchor next_tick_at to the previous schedule to prevent drift
    // Uses UTC-safe millisecond arithmetic instead of setHours() which is timezone-dependent
    const intervalMs = (shard.tick_interval_hours || 12) * 60 * 60 * 1000;
    const prevTickAt = new Date(shard.next_tick_at || new Date());
    let nextTickAt = new Date(prevTickAt.getTime() + intervalMs);
    // Safety: if calculated next tick is in the past (e.g. server was down), advance to future
    const now = Date.now();
    while (nextTickAt.getTime() <= now) {
        nextTickAt = new Date(nextTickAt.getTime() + intervalMs);
    }
    // Compute date directly from tick number to prevent drift between
    // shard.current_date (string-based) and tickToDate() (tick-based).
    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const newDate = `${MONTHS[newTick % 12]}, ${2000 + Math.floor(newTick / 12)}`;

    // 2. Load all nations
    const { data: nations } = await supabase.from('nations').select('*');
    const nationList = nations || [];

    // Lazy-loaded once per tick for all nations
    let _statConnections = null;
    let _institutionConfig = null;

    const summary = {
        tick: newTick,
        nations: nationList.length,
        effects: [],
        costs: [],
        resolutions: [],
        events: [],
        apFailures: []
    };
    const failedNationIds = new Set();
    const failedFactionIds = new Set();

    // Accumulate AP for party factions each tick:
    // base 5 AP, +1 if in government, +1 if approval > 60. Capped at MAX_AP.
    // Uses atomic RPC to prevent race conditions with concurrent player deductions.
    let apDistributed = 0;
    let apFailed = 0;
    for (const nation of nationList) {
      try {
        const { data: factions } = await supabase
            .from('factions')
            .select('id, approval_rating, faction_type')
            .eq('nation_id', nation.id)
            .eq('faction_type', 'party');

        if (!factions || factions.length === 0) continue;

        const coalition = await fetchActiveCoalition(supabase, nation.id);
        const governmentPartyIds = new Set([
            ...(coalition?.party_ids || []),
            nation.ruling_faction_id
        ].filter(Boolean));

        for (const faction of factions) {
            const isInGovernment = governmentPartyIds.has(faction.id);
            let apGain = 5;
            if (isInGovernment) apGain += 1;
            if ((faction.approval_rating ?? 50) > 60) apGain += 1;

            const result = await accumulateAP(supabase, faction.id, apGain);
            if (result.success) {
                console.log(`[advanceTick] AP: faction ${faction.id} → ${result.newAp} (+${apGain})`);
                apDistributed++;
            } else {
                console.error(`[advanceTick] AP accumulation FAILED for faction ${faction.id}: ${result.error}`);
                apFailed++;
                summary.apFailures.push({
                    nationId: nation.id,
                    nation: nation.name,
                    factionId: faction.id,
                    error: result.error
                });
                failedNationIds.add(nation.id);
                failedFactionIds.add(faction.id);
            }
        }
      } catch (apErr) {
        console.error(`[advanceTick] AP distribution FAILED for nation ${nation.id} (${nation.name}):`, apErr);
        summary.errors = summary.errors || [];
        summary.errors.push({ nation: nation.name, nationId: nation.id, phase: 'ap_distribution', error: String(apErr) });
        apFailed++;
        summary.apFailures.push({
            nationId: nation.id,
            nation: nation.name,
            factionId: null,
            error: String(apErr)
        });
        failedNationIds.add(nation.id);
      }
    }
    summary.apDistributed = apDistributed;
    summary.apFailed = apFailed;

    if (apFailed > 0) {
        summary.partial = true;
        summary.failureReason = 'ap_distribution_failed';
        summary.failedNationIds = Array.from(failedNationIds);
        summary.failedFactionIds = Array.from(failedFactionIds);
        summary.message = 'Tick marked partial: AP distribution failed for one or more factions; shard tick was not advanced.';
        return summary;
    }

    // 3. Commit shard tick/date after critical AP phase succeeds
    await supabase.from('shard').update({
        current_tick: newTick,
        next_tick_at: nextTickAt.toISOString(),
        current_date: newDate
    }).eq('name', 'Alpha Shard');

    // Clear expired coup cooldowns
    await supabase.from('factions')
        .update({ action_lockout_until_tick: null })
        .not('action_lockout_until_tick', 'is', null)
        .lte('action_lockout_until_tick', newTick);

    // Periodic integrity scan for invalid stat keys
    if (newTick % 10 === 1) {
        try {
            await auditStatKeys(supabase);
        } catch (auditErr) {
            console.error('[advanceTick] auditStatKeys failed (non-fatal):', auditErr);
        }
    }

    // 3.5 Trade engine — runs across ALL nations simultaneously
    try {
        const tradeResult = await processTradeFlows(supabase, nationList, newTick);
        if (tradeResult.processed > 0) {
            summary.trade = tradeResult;
            console.log(`[advanceTick] Trade: ${tradeResult.processed} nations, $${Math.round(tradeResult.totalVolume).toLocaleString()} volume`);
        }
    } catch (tradeErr) {
        console.error('[advanceTick] Trade processing failed (non-fatal):', tradeErr);
    }

    // 3.6 Expire trade agreements (including economic aid) that have passed their expires_at_tick
    try {
        const expiredAgreements = await processExpiredTradeAgreements(supabase, newTick);
        if (expiredAgreements.length > 0) {
            summary.expiredAgreements = expiredAgreements;
            console.log(`[advanceTick] Expired ${expiredAgreements.length} trade agreement(s)`);
        }
    } catch (expErr) {
        console.error('[advanceTick] Agreement expiration check failed (non-fatal):', expErr);
    }

    // 4. Process each nation
    for (const nation of nationList) {
      try {
        // Set correct seat count for this nation (affects supermajority thresholds, etc.)
        initGameConfigForNation(nation);

        // Snapshot population_growth BEFORE any effects, so we can isolate
        // policy deltas and rebase on birth_rate - death_rate afterwards.
        const popGrowthBeforeEffects = Number(nation.population_growth ?? 50);

        // Stat effects (from passed bills/active laws)
        const effectResults = await processStatEffects(supabase, nation, newTick);
        if (effectResults.length > 0) summary.effects.push({ nation: nation.name, effects: effectResults });

        // Ministry action effects
        const ministryResults = await processMinistryActions(supabase, nation, newTick);
        if (ministryResults.length > 0) {
            summary.ministryActions = summary.ministryActions || [];
            summary.ministryActions.push({ nation: nation.name, effects: ministryResults });
        }

        // Apply GDP growth rate
        await applyGdpGrowth(supabase, nation);

        // Stat decay (equilibrium drift + erosion, modified by institution funding)
        if (!_institutionConfig) {
            const { data: icRows } = await supabase.from('ministry_institution_config').select('*');
            _institutionConfig = icRows || [];
        }
        const shutdownCheck = await isGovernmentShutdown(supabase, nation, newTick);
        const shutdown = shutdownCheck.active;
        let statInstMap = null;
        let budgetItemAllocs = null;   // hoisted for minister approval funding check
        if (shutdown && _institutionConfig.length > 0) {
            // Government shutdown: force ALL institutions to 0% funding → Collapsed decay rates
            statInstMap = buildShutdownStatInstMap(_institutionConfig);
            console.log(`[GovernmentShutdown] Forcing Collapsed institution decay for ${nation.name}`);
        } else if (nation.last_budget_bill_id && _institutionConfig.length > 0) {
            const { data: itemAllocs } = await supabase.from('budget_item_allocations')
                .select('item_type, item_id, allocation_amount, needed_amount')
                .eq('bill_id', nation.last_budget_bill_id)
                .eq('item_type', 'institution');
            budgetItemAllocs = itemAllocs;
            statInstMap = buildStatInstitutionMap(_institutionConfig, itemAllocs);
        }
        const policyDecayAdj = await buildPolicyDecayAdjustments(supabase, nation.id);
        const decayResults = await processStatDecay(supabase, nation, statInstMap, shutdown, policyDecayAdj);
        if (decayResults.length > 0) {
            summary.decay = summary.decay || [];
            summary.decay.push({ nation: nation.name, effects: decayResults });
        }

        // Stat connections (threshold-triggered ripple effects)
        if (!_statConnections) {
            const { data: scRows } = await supabase.from('stat_connections').select('*').eq('enabled', true);
            _statConnections = scRows || [];
        }
        const connResults = await processStatConnections(supabase, nation, newTick, _statConnections);
        if (connResults.length > 0) {
            summary.statConnections = summary.statConnections || [];
            summary.statConnections.push({ nation: nation.name, effects: connResults });
        }

        // No-budget penalty (if nation hasn't passed a budget in over a year)
        const noBudgetResult = await processNoBudgetPenalty(supabase, nation, newTick);
        if (noBudgetResult) {
            summary.noBudgetPenalties = summary.noBudgetPenalties || [];
            summary.noBudgetPenalties.push({ nation: nation.name, ...noBudgetResult });
        }

        // Ongoing costs
        const costResult = await processOngoingCosts(supabase, nation, newTick);
        if (costResult.totalCost !== 0) summary.costs.push({ nation: nation.name, ...costResult });

        // Sovereign debt mechanics (burden, credit deterioration, lockout, debt crisis trigger)
        try {
            const debtResult = await processSovereignDebtMechanics(supabase, nation, newTick);
            if (debtResult && (debtResult.burdenChanged || debtResult.creditDeterioration || debtResult.debtCrisisTriggered)) {
                summary.sovereignDebt = summary.sovereignDebt || [];
                summary.sovereignDebt.push({ nation: nation.name, ...debtResult });
            }
        } catch (debtErr) {
            console.error(`[advanceTick] Sovereign debt mechanics failed for ${nation.name} (non-fatal):`, debtErr);
        }

        // Austerity commitments from enacted sovereign defaults
        try {
            const austerityResults = await processAusterityCommitments(supabase, nation, newTick);
            if (austerityResults.length > 0) {
                summary.austerity = summary.austerity || [];
                summary.austerity.push({ nation: nation.name, commitments: austerityResults });
            }
        } catch (austErr) {
            console.error(`[advanceTick] Austerity processing failed for ${nation.name} (non-fatal):`, austErr);
        }

        // PM trait effects
        await processPMTraitEffects(supabase, nation, newTick);

        // Inactivity decay — penalise idle factions; at tick 12 disband the party entirely
        // Runs RIGHT BEFORE elections so auto-disbanded parties lose seats in the upcoming election
        const inactivityResults = await processInactivityDecay(supabase, nation.id, newTick);
        if (inactivityResults.length > 0) {
            summary.inactivityDecay = summary.inactivityDecay || [];
            summary.inactivityDecay.push({ nation: nation.name, factions: inactivityResults });
        }

        // Elections (democracy only)
        const electionResults = await processElections(supabase, nation, newTick);
        if (electionResults.length > 0) {
            summary.elections = summary.elections || [];
            summary.elections.push({ nation: nation.name, elections: electionResults });
        }

        // Government vacancy penalties (democracy only)
        const vacancyResult = await processGovernmentVacancy(supabase, nation, newTick);
        if (vacancyResult) {
            summary.vacancies = summary.vacancies || [];
            summary.vacancies.push(vacancyResult);
        }

        // Check for early majority on active floor bills (lock outcome + set grace tick)
        const earlyResults = await checkEarlyMajority(supabase, nation.id);
        if (earlyResults.length > 0) {
            summary.earlyMajority = summary.earlyMajority || [];
            summary.earlyMajority.push({ nation: nation.name, bills: earlyResults });
        }

        // Resolve expired votes (includes early-locked bills whose grace tick ended)
        const resolutions = await resolveExpiredVotes(supabase, nation.id);
        if (resolutions.length > 0) summary.resolutions.push({ nation: nation.name, bills: resolutions });

        // Auto-sign expired president's desk bills (Presidential systems)
        const deskResults = await processPresidentDesk(supabase, nation, newTick);
        if (deskResults.length > 0) {
            summary.presidentDesk = summary.presidentDesk || [];
            summary.presidentDesk.push({ nation: nation.name, bills: deskResults });
        }

        // Presidential pre-election candidate generation, term end safety net, + selection timeout
        await triggerPresidentialCandidateSelection(supabase, nation, newTick);
        await processPresidentialTermEnd(supabase, nation, newTick);
        await processPresidentCandidateTimeout(supabase, nation, newTick);
        await processParliamentaryPMTimeout(supabase, nation, newTick);

        // Incumbent campaign bonuses (+2 approval/tick during pre-election window)
        await processIncumbentCampaignBonuses(supabase, nation, newTick);

        // Ideology shifts from resolved bills
        await processIdeologyShifts(supabase, nation.id, resolutions, newTick);

        // Purge approval decay (autocracy scapegoat mechanic)
        if (isAutocracy(nation)) {
            await processPurgeDecay(supabase, nation.id, newTick);
        }

        // Autocracy seat rebalancing: if factions were deleted and seats are vacant,
        // proportionally redistribute the empty seats across remaining factions.
        if (isAutocracy(nation)) {
            const seatResult = await rebalanceAutocracySeats(supabase, nation);
            if (seatResult) {
                summary.seatRebalancing = summary.seatRebalancing || [];
                summary.seatRebalancing.push(seatResult);
            }
        }

        // Re-evaluate shutdown status after resolveExpiredVotes may have passed a budget bill
        // (the original `shutdown` boolean was computed before bill resolution)
        const shutdownCheckNow = await isGovernmentShutdown(supabase, nation, newTick);
        const shutdownNow = shutdownCheckNow.active;

        // Government shutdown penalties (approval + stability + unfunded ministry collapsing)
        // Runs BEFORE approval calculations so stat/event effects propagate in the same tick.
        if (shutdownNow) {
            const shutdownResult = await processGovernmentShutdown(supabase, nation, newTick, shutdownCheckNow);
            if (shutdownResult) {
                summary.governmentShutdowns = summary.governmentShutdowns || [];
                summary.governmentShutdowns.push({ nation: nation.name, ...shutdownResult });
            }
        } else {
            // If shutdown ended (budget passed), remove the active_crises row
            await resolveGovernmentShutdown(supabase, nation, newTick);
        }

        // Crises (persistent negative events that apply effects every tick)
        // Runs BEFORE approval calculations so crisis stat/event effects propagate in the same tick.
        const crisisResults = await processCrises(supabase, nation, newTick);
        if (crisisResults.length > 0) {
            summary.crises = summary.crises || [];
            summary.crises.push({ nation: nation.name, crises: crisisResults });
        }

        // Population growth: recompute from birth_rate - death_rate base,
        // preserving any policy/crisis deltas, then apply population change.
        const popGrowthResult = await processPopulationGrowth(supabase, nation, popGrowthBeforeEffects);
        if (popGrowthResult) {
            summary.populationGrowth = summary.populationGrowth || [];
            summary.populationGrowth.push({ nation: nation.name, ...popGrowthResult });
        }

        // Re-fetch nation to get post-crisis/shutdown stat values for minister approval
        const { data: preApprovalNation } = await supabase.from('nations').select('*').eq('id', nation.id).single();
        if (preApprovalNation) Object.assign(nation, preApprovalNation);

        // Record stat history for trend calculations (Phase 2)
        await recordStatHistory(supabase, nation, newTick);

        // Layer 1: Update minister approvals from stat thresholds + ministry funding
        // During government shutdown, all ministers take a direct -6/tick approval penalty
        const ministerApprovalResults = await updateMinisterApprovals(supabase, nation, newTick, shutdownNow, _institutionConfig, budgetItemAllocs);
        if (ministerApprovalResults.length > 0) {
            summary.ministerApprovals = summary.ministerApprovals || [];
            summary.ministerApprovals.push({ nation: nation.name, results: ministerApprovalResults });
        }

        // Decay gov_approval_events by 12% per tick (transient shocks fade naturally)
        const oldEvents = Number(nation.gov_approval_events ?? 0);
        if (Math.abs(oldEvents) > 0.01) {
            const decayed = Math.round(oldEvents * (1 - GOV_APPROVAL_CONFIG.EVENTS_DECAY_RATE) * 100) / 100;
            await supabase.from('nations')
                .update({ gov_approval_events: decayed })
                .eq('id', nation.id);
            nation.gov_approval_events = decayed;
        }

        // Layer 2: Calculate composite government approval
        const govApproval = await calculateGovernmentApprovalTick(supabase, nation, newTick);

        // Three-pillar voter preference recalculation
        await calculateThreePillarPreferences(supabase, nation, newTick);

        // Faction loyalty (autocracy)
        if (isAutocracy(nation)) {
            await processLoyaltyTick(supabase, nation);
        }

        // Regime pillars decay & bonus (autocracy)
        if (isAutocracy(nation)) {
            await processRegimePillars(supabase, nation);
        }

        // Steward stats tick (autocracy)
        if (isAutocracy(nation)) {
            await processStewardTick(supabase, nation);
        }

        // Secret coalition detection (autocracy)
        if (isAutocracy(nation)) {
            await processCoalitionDetection(supabase, nation, newTick);
        }

        // Auto-resolve shakeups that are 1+ ticks old
        if (isAutocracy(nation)) {
            await autoResolveStaleShakeups(supabase, nation.id, newTick);
        }

        // Re-fetch nation with post-effect values for remaining processors
        const { data: freshNation } = await supabase.from('nations').select('*').eq('id', nation.id).single();
        if (freshNation) Object.assign(nation, freshNation);

        // Democratic revolution (autocracy only)
        const revolutionResult = await processRevolution(supabase, nation, newTick);
        if (revolutionResult) {
            summary.revolutions = summary.revolutions || [];
            summary.revolutions.push(revolutionResult);
        }

        // Random events
        const eventResults = await processEvents(supabase, nation, newTick);
        if (eventResults.length > 0) summary.events.push({ nation: nation.name, events: eventResults });

        // Process active fundraiser promises
        const promiseResults = await processPromiseTick(supabase, nation, newTick);
        if (promiseResults.length > 0) {
            summary.promises = summary.promises || [];
            summary.promises.push({ nation: nation.name, promises: promiseResults });
        }


        // Economic aid condition reviews (annual, at year boundaries)
        const aidReviewResults = await processAidConditionReview(supabase, freshNation || nation, newTick);
        if (aidReviewResults.length > 0) {
            summary.aidReviews = summary.aidReviews || [];
            summary.aidReviews.push({ nation: nation.name, reviews: aidReviewResults });
        }

        // Ambassador term limits (retirements + warnings)
        const retirementResults = await processAmbassadorRetirements(supabase, freshNation || nation, newTick);
        if (retirementResults.length > 0) {
            summary.ambassadorRetirements = summary.ambassadorRetirements || [];
            summary.ambassadorRetirements.push({ nation: nation.name, retirements: retirementResults });
        }

        // Final snapshot — capture everything that happened this tick
        const { data: finalNation } = await supabase.from('nations').select('*').eq('id', nation.id).single();
        await snapshotNationHistory(supabase, finalNation || nation, newTick);
      } catch (nationErr) {
        console.error(`[advanceTick] FAILED processing nation ${nation.id} (${nation.name}):`, nationErr);
        summary.errors = summary.errors || [];
        summary.errors.push({ nation: nation.name, nationId: nation.id, error: String(nationErr) });
      }
    }

    return summary;
}


// ===== EDGE FUNCTION HANDLER =====

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
        // 0. Startup checks
        await ensureApRpcAvailability(supabase);

        // 1. Check for force parameter (admin manual trigger)
        let force = false;
        try {
            const body = await req.json();
            force = body?.force === true;
        } catch (_) {
            // No body or invalid JSON — not forced
        }

        // 2. Check if tick is due (skip check if force=true)
        const { data: shard, error: shardError } = await supabase
            .from("shard")
            .select("next_tick_at, current_tick, tick_processing")
            .eq("name", "Alpha Shard")
            .single();

        if (shardError || !shard) {
            return new Response(
                JSON.stringify({ error: "Shard not found", detail: shardError?.message }),
                { status: 404, headers: corsHeaders }
            );
        }

        if (!force) {
            const now = new Date();
            const nextTickAt = new Date(shard.next_tick_at);

            if (now < nextTickAt) {
                return new Response(
                    JSON.stringify({
                        status: "not_due",
                        current_tick: shard.current_tick,
                        next_tick_at: shard.next_tick_at,
                        time_remaining_ms: nextTickAt.getTime() - now.getTime(),
                    }),
                    { headers: corsHeaders }
                );
            }
        }

        // 3. Tick is due (or forced) — acquire lock
        const lockAcquired = await acquireTickLock(supabase);
        if (!lockAcquired) {
            return new Response(
                JSON.stringify({
                    status: "locked",
                    message: "Another process is already processing the tick",
                }),
                { headers: corsHeaders }
            );
        }

        // 4. Process the tick
        try {
            const summary = await advanceTick(supabase);
            const responseStatus = summary.partial ? "partial" : "success";
            console.log(
                `[advance-tick] Tick ${summary.tick} ${summary.partial ? 'partially processed' : 'processed'} (${summary.nations} nations)`
            );
            return new Response(
                JSON.stringify({ status: responseStatus, summary }),
                { headers: corsHeaders }
            );
        } catch (e) {
            console.error("[advance-tick] Tick processing failed:", e);
            return new Response(
                JSON.stringify({ error: e.message }),
                { status: 500, headers: corsHeaders }
            );
        } finally {
            await releaseTickLock(supabase);
        }
    } catch (error) {
        console.error("[advance-tick] Edge function error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: corsHeaders }
        );
    }
});
