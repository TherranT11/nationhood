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
// population_growth is a standalone 0-100 stat driven by policy effects and decay.
//
// The final population_growth (0-100) drives actual population change:
//   0   → -1% per tick (max decline)
//   50  → 0% per tick (equilibrium)
//   100 → +1% per tick (max growth)

async function processPopulationGrowth(supabase: any, nation: any) {
    // population_growth is now standalone — just use the current value directly
    const currentPG = Number(nation.population_growth ?? 50);
    const finalPG = Math.round(Math.max(0, Math.min(100, currentPG)) * 10) / 10;

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
        console.log(`[processPopulationGrowth] ${nation.name}: pg=${finalPG} pop_change=${popChange > 0 ? '+' : ''}${popChange}`);
    }

    return { finalPG, popChange, newPopulation, newEligibleVoters };
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

    await nudgeApproval(supabase, president.faction_id, nation.id, 1);

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
 * Grant AP rewards for long-form writing published this tick.
 * - Op-eds with 1000+ words: +2 AP to author faction
 * - Player articles with 500+ words: +1 AP to author faction
 * Marks rows as rewarded so they aren't double-counted.
 */
async function processWritingRewards(supabase, nationId, currentTick) {
    const rewards = [];

    // Op-ed rewards: reward_ap > 0 and published_tick = currentTick
    const { data: opeds } = await supabase
        .from('op_eds')
        .select('id, author_faction_id, reward_ap')
        .eq('nation_id', nationId)
        .eq('published_tick', currentTick)
        .gt('reward_ap', 0)
        .eq('reward_granted', false);

    for (const oped of (opeds || [])) {
        if (!oped.author_faction_id || !oped.reward_ap) continue;
        const { error } = await supabase.rpc('deduct_ap', {
            p_faction_id: oped.author_faction_id,
            p_cost: -oped.reward_ap  // Negative cost = add AP
        });
        if (!error) {
            await supabase.from('op_eds').update({ reward_granted: true }).eq('id', oped.id);
            rewards.push({ type: 'oped', factionId: oped.author_faction_id, ap: oped.reward_ap });
            console.log(`[processWritingRewards] Op-ed reward: +${oped.reward_ap} AP to faction ${oped.author_faction_id}`);
        }
    }

    // Player article rewards
    const { data: articles } = await supabase
        .from('player_articles')
        .select('id, author_faction_id, reward_ap')
        .eq('nation_id', nationId)
        .eq('published_tick', currentTick)
        .gt('reward_ap', 0)
        .eq('reward_granted', false);

    for (const article of (articles || [])) {
        if (!article.author_faction_id || !article.reward_ap) continue;
        const { error } = await supabase.rpc('deduct_ap', {
            p_faction_id: article.author_faction_id,
            p_cost: -article.reward_ap  // Negative cost = add AP
        });
        if (!error) {
            await supabase.from('player_articles').update({ reward_granted: true }).eq('id', article.id);
            rewards.push({ type: 'article', factionId: article.author_faction_id, ap: article.reward_ap });
            console.log(`[processWritingRewards] Article reward: +${article.reward_ap} AP to faction ${article.author_faction_id}`);
        }
    }

    return rewards;
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
        await nudgeApproval(supabase, action.party_id, nationId, -round2(decayRate * 0.3));

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

/**
 * Per-tick budget deficit → debt accumulation.
 * Computes the full national budget (revenue vs expenditure), then:
 *   - Deficit: adds |deficit| / 12 to debt
 *   - Surplus: subtracts surplus / 12 from debt (floor at 0)
 */
async function processBudgetDeficit(supabase, nation, currentTick, institutionConfig) {
    // 1. Fetch active laws with policy data
    const { data: activeLaws } = await supabase
        .from('active_laws')
        .select('*, policies(*)')
        .eq('nation_id', nation.id);

    // 2. Fetch trade tariff revenue from the trade engine (written earlier this tick)
    const { data: tradeSummary } = await supabase.from('trade_summary')
        .select('tariff_revenue')
        .eq('nation_id', nation.id)
        .eq('tick', currentTick)
        .maybeSingle();
    const tradeTariffRevenue = tradeSummary?.tariff_revenue ?? null;

    // 3. Fetch aid data
    const aidData = await getActiveAidForNation(supabase, nation.id);

    // 4. Build full budget (all values are ANNUAL raw dollars)
    const budgetData = buildBudgetData(nation, activeLaws || [], tradeTariffRevenue, institutionConfig, aidData);

    // 5. Compute annual balance
    //    grossRevenue already includes aidReceived.
    //    Mandatory costs (debtService + aidGiven) are already subtracted in 'available'.
    //    Discretionary costs: totalExpenditure (ministry policies + institutions).
    const annualBalance = budgetData.available - budgetData.totalExpenditure;

    // 6. Per-tick balance
    const perTickBalance = annualBalance / GAME_CONFIG.TICKS_PER_YEAR;

    // 7. Update debt
    const currentDebt = Number(nation.debt ?? 0);
    let newDebt;
    if (perTickBalance < 0) {
        // Deficit: accumulate debt
        newDebt = currentDebt + Math.abs(perTickBalance);
    } else {
        // Surplus: pay down debt (cannot go below 0)
        newDebt = Math.max(0, currentDebt - perTickBalance);
    }
    newDebt = Math.round(newDebt);

    const debtDelta = newDebt - currentDebt;

    // 8. Write to DB only if changed
    if (debtDelta !== 0) {
        const { error } = await supabase.from('nations').update({ debt: newDebt }).eq('id', nation.id);
        if (error) {
            console.error(`[BudgetDeficit] DB update failed for ${nation.name}:`, error.message);
            return { nationId: nation.id, debtDelta: 0 };
        }
        nation.debt = newDebt;
    }

    // 9. Log
    const fmtM = (v) => `$${(v / 1_000_000).toFixed(1)}M`;
    if (debtDelta !== 0) {
        console.log(`[BudgetDeficit] ${nation.name}: revenue=${fmtM(budgetData.grossRevenue)}/yr expenditure=${fmtM(budgetData.totalExpenditure + budgetData.debtService + budgetData.aidGiven)}/yr balance=${fmtM(annualBalance)}/yr (${fmtM(perTickBalance)}/tick) debt: ${fmtM(currentDebt)} → ${fmtM(newDebt)}`);
    }

    return {
        nationId: nation.id,
        annualRevenue: budgetData.grossRevenue,
        annualExpenditure: budgetData.totalExpenditure + budgetData.debtService + budgetData.aidGiven,
        annualBalance,
        perTickBalance,
        debtBefore: currentDebt,
        debtAfter: newDebt,
        debtDelta
    };
}

// ==================== IPO VOTE EFFECT HELPER ====================

/**
 * Apply side-effects when an IPO vote passes (called from tick processor).
 */
async function applyIPOVoteEffect(supabase, org, vote, fullMembers, tick) {
    const meta = vote.meta || {};
    const IPO_CHAT_COLORS = ['#5cb85c','#c8a64e','#5aafa5','#d9534f','#8b7ec8','#5b9bd5'];

    switch (vote.vote_type) {
        case 'membership': {
            if (!meta.target_faction_id) break;

            // If invite-based, mark the invitation as accepted
            if (meta.invite_id) {
                await supabase.from('ipo_invitations')
                    .update({ status: 'accepted', responded_at_tick: tick })
                    .eq('id', meta.invite_id);
            }

            const admitRole = meta.requested_role || 'member';

            // Check if target is an autocratic strongman — admit all factions of that autocracy
            let factionsToAdmit = [{ id: meta.target_faction_id, name: meta.target_faction_name }];
            try {
                const { data: pillarState } = await supabase
                    .from('faction_pillar_state')
                    .select('faction_id, is_strongman, nation_id')
                    .eq('faction_id', meta.target_faction_id)
                    .eq('is_strongman', true)
                    .maybeSingle();
                if (pillarState) {
                    const { data: allPillarFactions } = await supabase
                        .from('faction_pillar_state')
                        .select('faction_id, factions:faction_id ( faction_name )')
                        .eq('nation_id', pillarState.nation_id);
                    if (allPillarFactions && allPillarFactions.length > 0) {
                        factionsToAdmit = allPillarFactions.map(pf => ({
                            id: pf.faction_id,
                            name: pf.factions?.faction_name || 'Unknown'
                        }));
                    }
                }
            } catch (e) { console.error('[IPO] Autocracy admission check failed:', e.message); }

            // Assign chat colors and insert members
            const { data: existingMembers } = await supabase
                .from('ipo_members')
                .select('chat_color')
                .eq('org_id', org.id)
                .eq('is_active', true);
            const usedColors = new Set((existingMembers || []).map(m => m.chat_color).filter(Boolean));

            for (const f of factionsToAdmit) {
                const chatColor = IPO_CHAT_COLORS.find(c => !usedColors.has(c)) || IPO_CHAT_COLORS[0];
                usedColors.add(chatColor);
                await supabase.from('ipo_members').insert({
                    org_id: org.id,
                    faction_id: f.id,
                    role: admitRole,
                    joined_at_tick: tick,
                    chat_color: chatColor
                });
            }

            const admitMsg = factionsToAdmit.length > 1
                ? `${meta.target_faction_name || 'An autocratic regime'} and its ${factionsToAdmit.length - 1} faction(s) have been admitted.`
                : `${meta.target_faction_name || 'A new party'} has been admitted as ${admitRole === 'observer' ? 'an observer' : 'a member'}.`;
            await supabase.from('ipo_chat').insert({
                org_id: org.id, faction_id: null, is_system: true,
                message_text: admitMsg,
                tick_posted: tick
            });
            break;
        }
        case 'expulsion': {
            if (meta.target_faction_id) {
                await supabase.from('ipo_members')
                    .update({ is_active: false, left_at_tick: tick })
                    .eq('org_id', org.id)
                    .eq('faction_id', meta.target_faction_id)
                    .eq('is_active', true);

                await supabase.from('ipo_chat').insert({
                    org_id: org.id, faction_id: null, is_system: true,
                    message_text: `${meta.target_faction_name || 'A member'} has been expelled from the organisation.`,
                    tick_posted: tick
                });
            }
            break;
        }
        case 'fund_draw': {
            if (meta.amount_requested && meta.amount_requested > 0) {
                const newBalance = Math.max(0, (org.solidarity_fund_balance || 0) - meta.amount_requested);
                await supabase.from('international_orgs')
                    .update({ solidarity_fund_balance: newBalance })
                    .eq('id', org.id);

                await supabase.from('ipo_fund_transactions').insert({
                    org_id: org.id,
                    faction_id: vote.proposed_by,
                    transaction_type: 'draw',
                    amount: -meta.amount_requested,
                    description: meta.purpose || 'Fund draw (vote passed)',
                    tick: tick
                });

                await supabase.from('ipo_chat').insert({
                    org_id: org.id, faction_id: null, is_system: true,
                    message_text: `Fund draw approved: ${meta.amount_requested} AP withdrawn. ${meta.purpose ? 'Purpose: ' + meta.purpose : ''}`,
                    tick_posted: tick
                });
            }
            break;
        }
        case 'change_headquarters': {
            if (meta.proposed_nation_id) {
                await supabase.from('international_orgs')
                    .update({ headquarters_nation_id: meta.proposed_nation_id })
                    .eq('id', org.id);
            }
            break;
        }
        case 'joint_statement': {
            if (meta.statement_text) {
                const visibility = meta.visibility === 'private' ? ' (private)' : '';
                await supabase.from('ipo_chat').insert({
                    org_id: org.id, faction_id: null, is_system: true,
                    message_text: `JOINT STATEMENT${visibility}: "${meta.statement_text}"`,
                    tick_posted: tick
                });
                await supabase.from('ipo_action_log').insert({
                    org_id: org.id, faction_id: vote.proposed_by,
                    action_type: 'joint_statement',
                    action_data: { statement_text: meta.statement_text, visibility: meta.visibility || 'public' },
                    ap_cost: 0, performed_at_tick: tick
                });
            }
            break;
        }
        case 'charter_amendment': {
            await supabase.from('ipo_chat').insert({
                org_id: org.id, faction_id: null, is_system: true,
                message_text: `Charter amendment approved: ${meta.article_type || 'charter'} — "${(meta.description || '').substring(0, 200)}". The president should apply changes via Amend Charter.`,
                tick_posted: tick
            });
            await supabase.from('ipo_action_log').insert({
                org_id: org.id, faction_id: vote.proposed_by,
                action_type: 'charter_amendment',
                action_data: { article_type: meta.article_type, description: meta.description },
                ap_cost: 0, performed_at_tick: tick
            });
            break;
        }
        case 'symposium': {
            const SYMPOSIUM_DELAY = 4;
            const SYMPOSIUM_COOLDOWN = 20;
            const SYMPOSIUM_SHIFT = 3;

            const pendingSymposium = {
                targetNation: meta.target_nation_id,
                axis: meta.axis || 'economic',
                direction: meta.direction || 'left',
                ideologyShift: SYMPOSIUM_SHIFT,
                firesOnTick: tick + SYMPOSIUM_DELAY
            };

            await supabase.from('international_orgs')
                .update({
                    pending_symposium: pendingSymposium,
                    symposium_cooldown_remaining: SYMPOSIUM_COOLDOWN
                })
                .eq('id', org.id);

            await supabase.from('ipo_chat').insert({
                org_id: org.id, faction_id: null, is_system: true,
                message_text: `Symposium approved! Targeting ${meta.target_nation_name || 'a nation'} (${meta.axis} ${meta.direction}). Effect fires in ${SYMPOSIUM_DELAY} ticks.`,
                tick_posted: tick
            });
            await supabase.from('ipo_action_log').insert({
                org_id: org.id, faction_id: vote.proposed_by,
                action_type: 'symposium',
                action_data: pendingSymposium,
                ap_cost: 0, performed_at_tick: tick
            });
            break;
        }
    }
}

// ==================== ADVANCE TICK ====================

async function advanceTick(supabase, { force = false, reprocess = false } = {}) {
    // 1. Pre-compute next tick metadata
    const { data: shard } = await supabase
        .from('shard')
        .select('current_tick, tick_interval_hours, current_date, next_tick_at')
        .eq('name', 'Alpha Shard')
        .single();
    if (!shard) throw new Error('Shard not found');

    // Reprocess mode: re-run game effects for the CURRENT tick without advancing
    const newTick = reprocess ? (shard.current_tick || 0) : (shard.current_tick || 0) + 1;
    if (reprocess) console.log(`[advanceTick] REPROCESS mode — re-running effects for tick ${newTick} (no advance)`);
    const intervalMs = (shard.tick_interval_hours || 12) * 60 * 60 * 1000;
    const now = Date.now();
    // Always anchor next tick from NOW + interval.
    // The cron fires every minute so drift is negligible, and this avoids
    // compounding issues when manual advances or interval changes shift next_tick_at.
    const nextTickAt = new Date(now + intervalMs);
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
    // base 5 AP, +2 if in government coalition or strongman. Capped at MAX_AP (20).
    // Uses atomic RPC to prevent race conditions with concurrent player deductions.
    // Skip AP accumulation in reprocess mode — AP was already granted on the original tick.
    let apDistributed = 0;
    let apFailed = 0;
    if (reprocess) {
        console.log(`[advanceTick] REPROCESS mode — skipping AP accumulation`);
    }
    for (const nation of (reprocess ? [] : nationList)) {
      try {
        const { data: factions } = await supabase
            .from('factions')
            .select('id, faction_type, leader_positive_traits, leader_negative_traits')
            .eq('nation_id', nation.id)
            .eq('faction_type', 'party');

        if (factions && factions.length > 0) {
        // Guard: skip AP if already distributed this tick (prevents double AP on retry/overlap)
        const { data: existingLedger } = await supabase
            .from('ap_ledger')
            .select('id')
            .eq('faction_id', factions[0].id)
            .eq('tick', newTick)
            .eq('reason', 'tick_gain')
            .limit(1);
        if (existingLedger && existingLedger.length > 0) {
            console.warn(`[advanceTick] AP already distributed for nation ${nation.name} tick ${newTick} — skipping`);
            continue;
        }
        // Autocracy V5: +5 AP per tick, capped at 20. No coalition bonus.
        if (isAutocracy(nation)) {
            for (const faction of factions) {
                const result = await accumulateAP(supabase, faction.id, 5, GAME_CONFIG.MAX_AP);
                if (result.success) {
                    console.log(`[advanceTick] AP: faction ${faction.id} → ${result.newAp} (+5, autocracy)`);
                    apDistributed++;
                    await supabase.from('ap_ledger').insert({ faction_id: faction.id, tick: newTick, delta: 5, reason: 'tick_gain', detail: 'Base AP per tick' }).then(() => {}, () => {/* ignore duplicate */});
                } else {
                    console.error(`[advanceTick] Autocracy AP FAILED for faction ${faction.id}: ${result.error}`);
                    apFailed++;
                }
            }
        } else {
        // Democracy AP logic
        const coalition = await fetchActiveCoalition(supabase, nation.id);
        const governmentPartyIds = new Set([
            ...(coalition?.party_ids || []),
            nation.ruling_faction_id
        ].filter(Boolean));

        for (const faction of factions) {
            const isInGovernment = governmentPartyIds.has(faction.id);
            let apGain = 5;
            if (isInGovernment) apGain += 2;

            // Leader trait: tireless_campaigner → +1 AP per tick
            const posTraits = faction.leader_positive_traits || [];
            const negTraits = faction.leader_negative_traits || [];
            if (posTraits.includes('tireless_campaigner')) apGain += 1;
            // Leader trait: indecisive → -1 AP per tick
            if (negTraits.includes('indecisive')) apGain = Math.max(1, apGain - 1);

            // Family member successor penalty: ruling faction loses 1 AP/tick
            if (nation.successor_is_family_member && faction.id === nation.ruling_faction_id) {
                apGain = Math.max(1, apGain - 1);
            }

            const result = await accumulateAP(supabase, faction.id, apGain);
            if (result.success) {
                console.log(`[advanceTick] AP: faction ${faction.id} → ${result.newAp} (+${apGain})`);
                apDistributed++;
                const parts = ['Base +5'];
                if (isInGovernment) parts.push('Coalition +2');
                if (posTraits.includes('tireless_campaigner')) parts.push('Tireless Campaigner +1');
                if (negTraits.includes('indecisive')) parts.push('Indecisive -1');
                if (nation.successor_is_family_member && faction.id === nation.ruling_faction_id) parts.push('Family successor -1');
                await supabase.from('ap_ledger').insert({ faction_id: faction.id, tick: newTick, delta: apGain, reason: 'tick_gain', detail: parts.join(', ') }).then(() => {});
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
        } // end democracy AP
        } // end factions.length > 0
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
        // Log AP failures but DO NOT abort the tick.
        // AP is non-critical — stats, elections, history snapshots, and the
        // entire simulation must continue even if AP distribution fails.
        // Aborting here previously caused the shard tick to never advance,
        // freezing all stat updates, arrows, and game progression.
        console.error(`[advanceTick] AP distribution had ${apFailed} failure(s) — continuing tick processing`);
        summary.apWarnings = {
            failedNationIds: Array.from(failedNationIds),
            failedFactionIds: Array.from(failedFactionIds),
            message: `AP distribution failed for ${apFailed} faction(s); tick processing continued.`
        };
    }

    // NOTE: Shard tick/date commit moved to AFTER nation processing (see below).
    // This prevents the tick number from advancing if the function times out
    // during nation processing, which would cause skipped game effects.

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

    // 3.7 Expire pending state visit proposals past their accept window
    try {
        const { data: expiredVisits, error: svErr } = await supabase
            .from('diplomatic_proposals')
            .update({ status: 'expired' })
            .eq('proposal_type', 'state_visit')
            .eq('status', 'proposed')
            .lte('fm_review_expires_tick', newTick)
            .select('id');
        if (!svErr && expiredVisits && expiredVisits.length > 0) {
            summary.expiredStateVisits = expiredVisits.length;
            console.log(`[advanceTick] Expired ${expiredVisits.length} state visit proposal(s)`);
        }
    } catch (svExpErr) {
        console.error('[advanceTick] State visit expiration check failed (non-fatal):', svExpErr);
    }

    // 3.8 Diplomatic relations decay — all relation scores drift toward 0 (neutral)
    try {
        const RELATION_DECAY_BASE = 0.1;
        const RELATION_DECAY_ISOLATIONIST = 0.15;

        const isolationistNationIds = new Set<string>();
        const { data: coalitions } = await supabase.from('coalitions')
            .select('nation_id, lead_party_id')
            .eq('is_active', true);
        if (coalitions && coalitions.length > 0) {
            const leadIds = coalitions.map(c => c.lead_party_id);
            const { data: leadFactions } = await supabase.from('factions')
                .select('id, nation_id, leader_negative_traits')
                .in('id', leadIds);
            if (leadFactions) {
                for (const lf of leadFactions) {
                    const neg: string[] = lf.leader_negative_traits || [];
                    if (neg.includes('isolationist')) {
                        isolationistNationIds.add(lf.nation_id);
                    }
                }
            }
        }

        const { data: allRelations } = await supabase.from('diplomatic_relations')
            .select('id, nation_a_id, nation_b_id, relation_score');
        if (allRelations && allRelations.length > 0) {
            let decayUpdates = 0;
            for (const rel of allRelations) {
                const score = Number(rel.relation_score || 0);
                if (score === 0) continue;

                const hasIsolationist = isolationistNationIds.has(rel.nation_a_id) || isolationistNationIds.has(rel.nation_b_id);
                const decayRate = hasIsolationist ? RELATION_DECAY_ISOLATIONIST : RELATION_DECAY_BASE;

                let newScore: number;
                if (score > 0) {
                    newScore = Math.max(0, score - decayRate);
                } else {
                    newScore = Math.min(0, score + decayRate);
                }
                newScore = Math.round(newScore * 100) / 100;

                if (newScore !== score) {
                    await supabase.from('diplomatic_relations')
                        .update({ relation_score: newScore })
                        .eq('id', rel.id);
                    decayUpdates++;
                }
            }
            if (decayUpdates > 0) {
                console.log(`[advanceTick] Diplomatic relations decay: updated ${decayUpdates} relations`);
            }
        }
    } catch (relDecayErr) {
        console.error('[advanceTick] Diplomatic relations decay failed (non-fatal):', relDecayErr);
    }

    // 4. Process each nation
    for (const nation of nationList) {
      try {
        // Set correct seat count for this nation (affects supermajority thresholds, etc.)
        initGameConfigForNation(nation);

        // Stat effects (from passed bills/active laws)
        try {
            const effectResults = await processStatEffects(supabase, nation, newTick);
            if (effectResults.length > 0) summary.effects.push({ nation: nation.name, effects: effectResults });
        } catch (statEffErr) {
            console.error(`[advanceTick] Stat effects failed for ${nation.name} (non-fatal):`, statEffErr);
        }

        // Ministry action effects
        try {
            const ministryResults = await processMinistryActions(supabase, nation, newTick);
            if (ministryResults.length > 0) {
                summary.ministryActions = summary.ministryActions || [];
                summary.ministryActions.push({ nation: nation.name, effects: ministryResults });
            }
        } catch (minActErr) {
            console.error(`[advanceTick] Ministry actions failed for ${nation.name} (non-fatal):`, minActErr);
        }

        // Apply GDP growth rate
        try {
            await applyGdpGrowth(supabase, nation, newTick);
        } catch (gdpErr) {
            console.error(`[advanceTick] GDP growth failed for ${nation.name} (non-fatal):`, gdpErr);
        }

        // Stat decay (equilibrium drift + erosion, modified by institution funding)
        try {
            if (!_institutionConfig) {
                const { data: icRows } = await supabase.from('ministry_institution_config').select('*');
                _institutionConfig = icRows || [];
            }
            const { data: _fundingRows } = await supabase.from('budget_item_allocations')
                .select('item_id, item_type, allocation_amount, needed_amount')
                .eq('nation_id', nation.id)
                .eq('item_type', 'institution')
                .order('created_at', { ascending: true });
            const statInstMap = buildStatInstitutionMap(_institutionConfig, _fundingRows);
            const policyDecayAdj = await buildPolicyDecayAdjustments(supabase, nation.id);
            const decayResults = await processStatDecay(supabase, nation, statInstMap, policyDecayAdj);
            if (decayResults.length > 0) {
                summary.decay = summary.decay || [];
                summary.decay.push({ nation: nation.name, effects: decayResults });
            }
        } catch (decayErr) {
            console.error(`[advanceTick] Stat decay failed for ${nation.name} (non-fatal):`, decayErr);
        }

        // Stat connections (threshold-triggered ripple effects)
        try {
            if (!_statConnections) {
                const { data: scRows } = await supabase.from('stat_connections').select('*').eq('enabled', true);
                _statConnections = scRows || [];
            }
            const connResults = await processStatConnections(supabase, nation, newTick, _statConnections);
            if (connResults.length > 0) {
                summary.statConnections = summary.statConnections || [];
                summary.statConnections.push({ nation: nation.name, effects: connResults });
            }
        } catch (connErr) {
            console.error(`[advanceTick] Stat connections failed for ${nation.name} (non-fatal):`, connErr);
        }

        // Ongoing costs (tracking only — accumulated per-policy, does not modify debt)
        try {
            const costResult = await processOngoingCosts(supabase, nation, newTick);
            if (costResult.totalCost !== 0) summary.costs.push({ nation: nation.name, ...costResult });
        } catch (costErr) {
            console.error(`[advanceTick] Ongoing costs failed for ${nation.name} (non-fatal):`, costErr);
        }

        // Budget deficit → debt accumulation (surplus pays down debt, deficit adds to it)
        try {
            const deficitResult = await processBudgetDeficit(supabase, nation, newTick, _institutionConfig);
            if (deficitResult && deficitResult.debtDelta !== 0) {
                summary.budgetDeficit = summary.budgetDeficit || [];
                summary.budgetDeficit.push({ nation: nation.name, ...deficitResult });
            }
        } catch (deficitErr) {
            console.error(`[advanceTick] Budget deficit processing failed for ${nation.name} (non-fatal):`, deficitErr);
        }

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
        try {
            await processPMTraitEffects(supabase, nation, newTick);
        } catch (pmTraitErr) {
            console.error(`[advanceTick] PM trait effects failed for ${nation.name} (non-fatal):`, pmTraitErr);
        }

        // Protest resolution (resolve protests that have been in 'resolving' for 1+ ticks)
        try {
            const { data: resolvingProtests } = await supabase
                .from('protest_log')
                .select('*')
                .eq('nation_id', nation.id)
                .eq('status', 'resolving')
                .lt('tick_called', newTick);
            if (resolvingProtests && resolvingProtests.length > 0) {
                summary.protests = summary.protests || [];
                for (const protest of resolvingProtests) {
                    try {
                        const result = await resolveProtest(supabase, protest, nation, newTick);
                        summary.protests.push({ nation: nation.name, protestId: protest.id, ...result });
                    } catch (prErr) {
                        console.error(`[advanceTick] resolveProtest failed for protest ${protest.id} in ${nation.name} (non-fatal):`, prErr);
                    }
                }
            }
        } catch (protestErr) {
            console.error(`[advanceTick] Protest resolution failed for ${nation.name} (non-fatal):`, protestErr);
        }

        // Elections (democracy only)
        try {
            const electionResults = await processElections(supabase, nation, newTick);
            if (electionResults.length > 0) {
                summary.elections = summary.elections || [];
                summary.elections.push({ nation: nation.name, elections: electionResults });
            }
        } catch (electionErr) {
            console.error(`[advanceTick] Elections failed for ${nation.name} (non-fatal):`, electionErr);
        }

        // Government vacancy penalties (democracy only)
        try {
            const vacancyResult = await processGovernmentVacancy(supabase, nation, newTick);
            if (vacancyResult) {
                summary.vacancies = summary.vacancies || [];
                summary.vacancies.push(vacancyResult);
            }
        } catch (vacancyErr) {
            console.error(`[advanceTick] Government vacancy failed for ${nation.name} (non-fatal):`, vacancyErr);
        }

        // Safety net: ensure every nation with a government has an active administration record
        try {
            if (!isAutocracy(nation)) {
                const { data: activeAdmin } = await supabase.from('administrations')
                    .select('id').eq('nation_id', nation.id).is('ended_at_tick', null).limit(1).maybeSingle();
                if (!activeAdmin) {
                    const { data: hog } = await supabase.from('head_of_government')
                        .select('first_name, last_name, faction_id, appointed_tick')
                        .eq('nation_id', nation.id).eq('active', true).maybeSingle();
                    if (hog) {
                        const { data: shardDate } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
                        await supabase.from('administrations').insert({
                            nation_id: nation.id,
                            admin_name: (hog.last_name || 'Interim') + ' Administration',
                            head_of_state: (hog.first_name || '') + ' ' + (hog.last_name || ''),
                            government_type: nation.government_type || 'Parliamentary Democracy',
                            started_at_tick: hog.appointed_tick || newTick,
                            started_at_date: shardDate?.current_date || '',
                            approval_at_start: Number(nation.gov_approval ?? 50),
                            pm_party_id: hog.faction_id
                        });
                        console.log(`[advanceTick] Safety net: created missing administration for ${nation.name} (${hog.last_name} Administration)`);
                    }
                }
            }
        } catch (adminSafetyErr) {
            console.error(`[advanceTick] Admin safety net failed for ${nation.name} (non-fatal):`, adminSafetyErr);
        }

        // Caucus system: activate/deactivate internal factions based on seat share
        try {
            await evaluateCaucusActivation(supabase, nation.id, GAME_CONFIG.TOTAL_SEATS);
            await decayCaucusRelationships(supabase, nation.id, newTick);
        } catch (caucusErr) {
            console.error(`[advanceTick] Caucus processing failed for ${nation.name} (non-fatal):`, caucusErr);
        }

        // Check for early majority on active floor bills (lock outcome + set grace tick)
        try {
            const earlyResults = await checkEarlyMajority(supabase, nation.id);
            if (earlyResults.length > 0) {
                summary.earlyMajority = summary.earlyMajority || [];
                summary.earlyMajority.push({ nation: nation.name, bills: earlyResults });
            }
        } catch (earlyErr) {
            console.error(`[advanceTick] checkEarlyMajority failed for ${nation.name} (non-fatal):`, earlyErr);
        }

        // Resolve expired votes (includes early-locked bills whose grace tick ended)
        let resolutions = [];
        try {
            resolutions = await resolveExpiredVotes(supabase, nation.id);
            if (resolutions.length > 0) summary.resolutions.push({ nation: nation.name, bills: resolutions });
        } catch (resolveErr) {
            console.error(`[advanceTick] resolveExpiredVotes failed for ${nation.name} (non-fatal):`, resolveErr);
        }

        // Safety net: catch any floor bills that resolveExpiredVotes missed
        // (e.g. due to complex query failure or thrown error). Uses simple queries per-bill.
        try {
            const stuckResults = await resolveStuckFloorBills(supabase, nation.id);
            if (stuckResults.length > 0) {
                summary.resolutions.push({ nation: nation.name, bills: stuckResults, safetyNet: true });
            }
        } catch (stuckErr) {
            console.error(`[advanceTick] resolveStuckFloorBills failed for ${nation.name} (non-fatal):`, stuckErr);
        }

        // Safety net: activate trade agreements where both ratification bills passed
        // but the negotiation is still stuck at 'ratification' (same-tick race condition)
        try {
            await resolveStuckRatifications(supabase, nation.id);
        } catch (ratErr) {
            console.error(`[advanceTick] resolveStuckRatifications failed for ${nation.name} (non-fatal):`, ratErr);
        }

        // ── Impeachment processing (Presidential systems) ──
        if (isPresidentialRepublic(nation)) {
            try {
                // 1. Auto-transition committee impeachment bills to floor
                const { data: committeeImpeach } = await supabase
                    .from('bills')
                    .select('id, proposed_tick, impeachment_id')
                    .eq('nation_id', nation.id)
                    .eq('bill_type', 'impeachment_motion')
                    .eq('status', 'committee')
                    .lte('proposed_tick', newTick - GAME_CONFIG.IMPEACHMENT_COMMITTEE_TICKS);

                for (const cb of (committeeImpeach || [])) {
                    await supabase.from('bills').update({
                        status: 'floor',
                        floor_tick: newTick,
                        voting_ends_tick: newTick + GAME_CONFIG.IMPEACHMENT_MOTION_VOTING_TICKS
                    }).eq('id', cb.id);
                    if (cb.impeachment_id) {
                        await supabase.from('impeachment_proceedings').update({ phase: 'motion_floor' }).eq('id', cb.impeachment_id);
                    }
                    // Calculate caucus dispositions at floor entry so players can see/whip during voting
                    try {
                        const { data: arts } = await supabase.from('bill_articles').select('*, policies(*)').eq('bill_id', cb.id);
                        await calculateCaucusDispositions(supabase, cb.id, nation.id, arts || []);
                        await calculateCaucusVoteAdjustment(supabase, cb.id);
                    } catch (caucusErr) {
                        console.error(`[Impeachment] Caucus disposition calc failed for ${cb.id} (non-fatal):`, caucusErr);
                    }
                    console.log(`[Impeachment] Motion ${cb.id} auto-transitioned from committee to floor`);
                }

                // 2. Per-tick trial effects (while conviction vote is on the floor)
                const { data: activeTrials } = await supabase
                    .from('impeachment_proceedings')
                    .select('id, president_id')
                    .eq('nation_id', nation.id)
                    .eq('phase', 'trial');

                if (activeTrials && activeTrials.length > 0) {
                    // Stability -1, gov_approval_events -1, civil_unrest +2 per tick during trial
                    const stab = Math.max(0, Math.round(Number(nation.stability || 50) - 1));
                    const unrest = Math.min(100, Math.round(Number(nation.civil_unrest || 0) + 2));
                    const govApproval = Number(nation.gov_approval_events ?? 0) - 1;
                    await supabase.from('nations').update({
                        stability: stab,
                        civil_unrest: unrest,
                        gov_approval_events: govApproval
                    }).eq('id', nation.id);
                    nation.stability = stab;
                    nation.civil_unrest = unrest;
                    nation.gov_approval_events = govApproval;
                    console.log(`[Impeachment] Trial effects applied for ${nation.name}: stability=${stab}, unrest=${unrest}`);
                }

                // 3. Process conviction (president removal) — runs after resolveExpiredVotes set conviction_result
                const { data: convictions } = await supabase
                    .from('impeachment_proceedings')
                    .select('id, president_id, initiated_by_faction_id, charges')
                    .eq('nation_id', nation.id)
                    .eq('phase', 'resolved')
                    .eq('conviction_result', 'convicted')
                    .eq('resolved_at_tick', newTick);  // only process on the tick it was resolved

                for (const proc of (convictions || [])) {
                    // Get president data
                    const { data: president } = await supabase.from('presidents')
                        .select('*').eq('id', proc.president_id).single();
                    if (!president || !president.is_active) continue;

                    // Deactivate president
                    await supabase.from('presidents').update({
                        is_active: false,
                        removal_reason: 'impeached'
                    }).eq('id', proc.president_id);

                    // President's party takes massive approval & credibility hit
                    await nudgeApproval(supabase, president.faction_id, nation.id, -5);
                    await adjustCredibility(supabase, president.faction_id, nation.id, -0.2, 24, currentTick);

                    // Stability -3, international_reputation -3
                    const newStab = Math.max(0, Math.round(Number(nation.stability || 50) - 3));
                    const newRep = Math.max(0, Math.round(Number(nation.international_reputation || 50) - 3));
                    await supabase.from('nations').update({
                        stability: newStab,
                        international_reputation: newRep
                    }).eq('id', nation.id);
                    nation.stability = newStab;
                    nation.international_reputation = newRep;

                    // Close current administration
                    try {
                        const { data: shard } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
                        await closeAdministration(supabase, nation.id, nation, 'impeachment', newTick, shard?.current_date || '', null);
                    } catch (adminErr) { console.warn('Could not close administration on impeachment:', adminErr); }

                    // Generate new VP name as acting president
                    const { firstNames: vpFirstPool, lastNames: vpLastPool } = getNationNames(nation.name);
                    const vpFirst = vpFirstPool[Math.floor(Math.random() * vpFirstPool.length)];
                    const vpLast = vpLastPool[Math.floor(Math.random() * vpLastPool.length)];

                    // Create new president record (VP succession — same party, serves out remainder)
                    const remainingTicks = Math.max(1, (president.term_ends_tick || newTick) - newTick);
                    await supabase.from('presidents').insert({
                        nation_id: nation.id,
                        faction_id: president.faction_id,
                        first_name: vpFirst,
                        last_name: vpLast,
                        age: 45 + Math.floor(Math.random() * 20),
                        ideology: president.ideology,
                        elected_tick: newTick,
                        term_ends_tick: president.term_ends_tick || (newTick + remainingTicks),
                        is_active: true,
                        terms_served: 0
                    });

                    // Schedule emergency presidential election
                    const emergencyElectionTick = newTick + GAME_CONFIG.IMPEACHMENT_EMERGENCY_ELECTION_TICKS;
                    // Cancel existing scheduled presidential elections
                    await supabase.from('elections').delete()
                        .eq('nation_id', nation.id)
                        .eq('election_type', 'presidential')
                        .eq('status', 'scheduled');
                    await supabase.from('elections').insert({
                        nation_id: nation.id,
                        election_tick: emergencyElectionTick,
                        election_type: 'presidential',
                        status: 'scheduled'
                    });

                    // Cancel any pending bills on president's desk
                    await supabase.from('bills').update({ status: 'failed' })
                        .eq('nation_id', nation.id)
                        .eq('status', 'president_desk');

                    // Fire conviction event
                    await supabase.from('event_log').insert({
                        nation_id: nation.id,
                        event_name: 'PRESIDENT REMOVED FROM OFFICE',
                        event_type: 'impeachment',
                        category: 'government',
                        description_chosen: `President ${president.first_name} ${president.last_name} has been convicted and removed from office. Vice President ${vpFirst} ${vpLast} assumes the presidency. An emergency presidential election is scheduled.`,
                        fired_at_tick: newTick,
                        effects_applied: {
                            removed_president: `${president.first_name} ${president.last_name}`,
                            acting_president: `${vpFirst} ${vpLast}`,
                            emergency_election_tick: emergencyElectionTick,
                            stability_hit: -3,
                            reputation_hit: -3,
                            party_approval_hit: -10
                        }
                    });

                    console.log(`[Impeachment] President ${president.first_name} ${president.last_name} removed. VP ${vpFirst} ${vpLast} takes over. Emergency election at tick ${emergencyElectionTick}`);
                }

                // 4. Dismiss impeachment if president's term ended during proceedings
                const { data: staleProceedings } = await supabase
                    .from('impeachment_proceedings')
                    .select('id, president_id, motion_bill_id, conviction_bill_id')
                    .eq('nation_id', nation.id)
                    .neq('phase', 'resolved');

                for (const sp of (staleProceedings || [])) {
                    const { data: pres } = await supabase.from('presidents')
                        .select('is_active').eq('id', sp.president_id).single();
                    if (pres && !pres.is_active) {
                        // President left office — dismiss proceedings
                        await supabase.from('impeachment_proceedings').update({
                            phase: 'resolved',
                            resolved_at_tick: newTick
                        }).eq('id', sp.id);
                        // Fail any pending impeachment bills
                        if (sp.motion_bill_id) {
                            await supabase.from('bills').update({ status: 'failed' })
                                .eq('id', sp.motion_bill_id).in('status', ['committee', 'floor']);
                        }
                        if (sp.conviction_bill_id) {
                            await supabase.from('bills').update({ status: 'failed' })
                                .eq('id', sp.conviction_bill_id).in('status', ['committee', 'floor']);
                        }
                        console.log(`[Impeachment] Proceedings ${sp.id} dismissed — president no longer in office`);
                    }
                }
            } catch (impErr) {
                console.error(`[Impeachment] Processing failed for ${nation.name} (non-fatal):`, impErr);
            }
        }

        // Auto-sign expired president's desk bills (Presidential systems)
        const deskResults = await processPresidentDesk(supabase, nation, newTick);
        if (deskResults.length > 0) {
            summary.presidentDesk = summary.presidentDesk || [];
            summary.presidentDesk.push({ nation: nation.name, bills: deskResults });
        }

        // Presidential pre-election candidate generation, term end safety net, + selection timeout
        await triggerPresidentialCandidateSelection(supabase, nation, newTick);
        await processPresidentialTermEnd(supabase, nation, newTick);
        await processParliamentaryPMTimeout(supabase, nation, newTick);

        // Incumbent campaign bonuses (+2 approval/tick during pre-election window)
        await processIncumbentCampaignBonuses(supabase, nation, newTick);

        // Ideology shifts from resolved bills
        try {
            await processIdeologyShifts(supabase, nation.id, resolutions, newTick);
        } catch (ideoErr) {
            console.error(`[advanceTick] Ideology shifts failed for ${nation.name} (non-fatal):`, ideoErr);
        }

        // Natural ideology decay toward center (extremism erodes over time)
        try {
            await processIdeologyDecay(supabase, nation.id, newTick);
        } catch (decayErr) {
            console.error(`[advanceTick] Ideology decay failed for ${nation.name} (non-fatal):`, decayErr);
        }

        // Purge approval decay (autocracy scapegoat mechanic)
        try {
            if (isAutocracy(nation)) {
                await processPurgeDecay(supabase, nation.id, newTick);
            }
        } catch (purgeErr) {
            console.error(`[advanceTick] Purge decay failed for ${nation.name} (non-fatal):`, purgeErr);
        }

        // Autocracy V5: pillar passive drift, wildcard decay, neglect, longevity
        try {
            if (isAutocracy(nation)) {
                const pillarResult = await processAutocracyPillarTick(supabase, nation, newTick);
                if (pillarResult) {
                    summary.autocracyPillars = summary.autocracyPillars || [];
                    summary.autocracyPillars.push(pillarResult);
                }
            }
        } catch (pillarErr) {
            console.error(`[advanceTick] Autocracy pillar tick failed for ${nation.name} (non-fatal):`, pillarErr);
        }

        // Autocracy V5: timed effects (Rally/Agitate/Patronage buffs), deploy decay, congress resolution
        try {
            if (isAutocracy(nation)) {
                await processAutocracyTimedEffects(supabase, nation, newTick);
                await processDeployEscalationDecay(supabase, nation.id, newTick);
                await resolvePartyCongressPending(supabase, nation.id, newTick);
            }
        } catch (timedErr) {
            console.error(`[advanceTick] Autocracy timed effects failed for ${nation.name} (non-fatal):`, timedErr);
        }

        // Autocracy V5: vulnerability windows (Strongman backing = 0 → 3-tick window)
        try {
            if (isAutocracy(nation)) {
                const vulnResult = await processVulnerabilityWindows(supabase, nation, newTick);
                if (vulnResult) {
                    summary.autocracyVulnerability = summary.autocracyVulnerability || [];
                    summary.autocracyVulnerability.push({ nation: nation.name, events: vulnResult });
                }
            }
        } catch (vulnErr) {
            console.error(`[advanceTick] Vulnerability window processing failed for ${nation.name} (non-fatal):`, vulnErr);
        }

        // Autocracy V5: putsch resolution (after response window expires)
        try {
            if (isAutocracy(nation)) {
                const putschResult = await processPutschResolution(supabase, nation, newTick);
                if (putschResult) {
                    summary.autocracyPutsch = summary.autocracyPutsch || [];
                    summary.autocracyPutsch.push({ nation: nation.name, result: putschResult });
                }
            }
        } catch (putschErr) {
            console.error(`[advanceTick] Putsch resolution failed for ${nation.name} (non-fatal):`, putschErr);
        }

        // Autocracy V5: pyrrhic window expiry (3-tick window closes, regime stabilizes)
        try {
            if (isAutocracy(nation)) {
                const pyrrhicResult = await processPyrrhicWindows(supabase, nation, newTick);
                if (pyrrhicResult) {
                    summary.autocracyPyrrhic = summary.autocracyPyrrhic || [];
                    summary.autocracyPyrrhic.push({ nation: nation.name, events: pyrrhicResult });
                }
            }
        } catch (pyrrhicErr) {
            console.error(`[advanceTick] Pyrrhic window processing failed for ${nation.name} (non-fatal):`, pyrrhicErr);
        }

        // Autocracy V5: silent coup resolution (deal/vote phase)
        try {
            if (isAutocracy(nation)) {
                const silentResult = await processSilentCoupResolution(supabase, nation, newTick);
                if (silentResult) {
                    summary.autocracySilentCoup = summary.autocracySilentCoup || [];
                    summary.autocracySilentCoup.push({ nation: nation.name, result: silentResult });
                }
            }
        } catch (silentErr) {
            console.error(`[advanceTick] Silent coup resolution failed for ${nation.name} (non-fatal):`, silentErr);
        }

        // Autocracy V5: pillar leader aging (+1 year per 12 ticks, death at death_age)
        try {
            if (isAutocracy(nation)) {
                const pillarAgingResult = await processAutocracyLeaderAging(supabase, nation, newTick);
                if (pillarAgingResult) {
                    summary.autocracyLeaderAging = summary.autocracyLeaderAging || [];
                    summary.autocracyLeaderAging.push({ nation: nation.name, results: pillarAgingResult });
                }
            }
        } catch (pillarAgingErr) {
            console.error(`[advanceTick] Autocracy pillar leader aging failed for ${nation.name} (non-fatal):`, pillarAgingErr);
        }

        // Seat rebalancing: if factions were disbanded and seats are vacant,
        // proportionally redistribute the empty seats across remaining factions.
        try {
            const seatResult = await rebalanceVacantSeats(supabase, nation);
            if (seatResult) {
                summary.seatRebalancing = summary.seatRebalancing || [];
                summary.seatRebalancing.push(seatResult);
            }
        } catch (seatErr) {
            console.error(`[advanceTick] Seat rebalancing failed for ${nation.name} (non-fatal):`, seatErr);
        }

        // Crises (persistent negative events that apply effects every tick)
        // Runs BEFORE approval calculations so crisis stat/event effects propagate in the same tick.
        try {
            const crisisResults = await processCrises(supabase, nation, newTick);
            if (crisisResults.length > 0) {
                summary.crises = summary.crises || [];
                summary.crises.push({ nation: nation.name, crises: crisisResults });
            }
        } catch (crisisErr) {
            console.error(`[advanceTick] Crisis processing failed for ${nation.name} (non-fatal):`, crisisErr);
        }

        // Population growth: apply population change based on current population_growth stat.
        try {
            const popGrowthResult = await processPopulationGrowth(supabase, nation);
            if (popGrowthResult) {
                summary.populationGrowth = summary.populationGrowth || [];
                summary.populationGrowth.push({ nation: nation.name, ...popGrowthResult });
            }
        } catch (popErr) {
            console.error(`[advanceTick] Population growth failed for ${nation.name} (non-fatal):`, popErr);
        }

        // Re-fetch nation to get post-crisis stat values for minister approval
        const { data: preApprovalNation } = await supabase.from('nations').select('*').eq('id', nation.id).single();
        if (preApprovalNation) Object.assign(nation, preApprovalNation);

        // Layer 1: Update minister approvals (drift-to-performance model)
        try {
            const ministerApprovalResults = await updateMinisterApprovals(supabase, nation, newTick);
            if (ministerApprovalResults.length > 0) {
                summary.ministerApprovals = summary.ministerApprovals || [];
                summary.ministerApprovals.push({ nation: nation.name, results: ministerApprovalResults });
            }
        } catch (minAppErr) {
            console.error(`[advanceTick] Minister approvals failed for ${nation.name} (non-fatal):`, minAppErr);
        }

        // Decay gov_approval_events by 10% per tick (transient shocks fade naturally)
        try {
            const oldEvents = Number(nation.gov_approval_events ?? 0);
            if (Math.abs(oldEvents) > 0.01) {
                const decayed = Math.round(oldEvents * (1 - MINISTER_APPROVAL_CONFIG.EVENTS_DECAY_RATE) * 100) / 100;
                await supabase.from('nations')
                    .update({ gov_approval_events: decayed })
                    .eq('id', nation.id);
                nation.gov_approval_events = decayed;
            }
        } catch (decayErr) {
            console.error(`[advanceTick] Approval event decay failed for ${nation.name} (non-fatal):`, decayErr);
        }

        // Layer 2: Calculate government approval (avg minister + vacancy penalty + event modifier)
        try {
            await calculateGovernmentApprovalTick(supabase, nation, newTick);
        } catch (govAppErr) {
            console.error(`[advanceTick] Gov approval calc failed for ${nation.name} (non-fatal):`, govAppErr);
        }

        // Layer 2b: Government collapse check (≤5% approval → cascading penalties, 0% → dissolve + snap election)
        try {
            const collapseResult = await processGovernmentCollapseCheck(supabase, nation, newTick);
            if (collapseResult) {
                summary.collapses = summary.collapses || [];
                summary.collapses.push({ nation: nation.name, ...collapseResult });
                if (collapseResult.collapsed) {
                    console.log(`[advanceTick] Government COLLAPSED in ${nation.name} — snap election called`);
                }
            }
        } catch (collapseErr) {
            console.error(`[advanceTick] Gov collapse check failed for ${nation.name} (non-fatal):`, collapseErr);
        }

        // Electorate engine
        try {
            await tickElectorate(supabase, nation, newTick);
        } catch (electorateErr) {
            console.error(`[advanceTick] Electorate engine failed for ${nation.name} (non-fatal):`, electorateErr);
        }

        // (Autocracy action systems removed — Phase 0. Actions will be added in Phase 4+.)

        // Autocracy V5: tracker natural decay toward 30 (runs after actions resolve)
        try {
            if (isAutocracy(nation)) {
                const trackerDecayResult = await processAutocracyTrackerDecay(supabase, nation, newTick);
                if (trackerDecayResult) {
                    summary.autocracyTrackerDecay = summary.autocracyTrackerDecay || [];
                    summary.autocracyTrackerDecay.push(trackerDecayResult);
                }
            }
        } catch (trackerDecayErr) {
            console.error(`[advanceTick] Autocracy tracker decay failed for ${nation.name} (non-fatal):`, trackerDecayErr);
        }

        // Re-fetch nation with post-effect values for remaining processors
        const { data: freshNation } = await supabase.from('nations').select('*').eq('id', nation.id).single();
        if (freshNation) Object.assign(nation, freshNation);

        // Democratic revolution (autocracy only)
        try {
            const revolutionResult = await processRevolution(supabase, nation, newTick);
            if (revolutionResult) {
                summary.revolutions = summary.revolutions || [];
                summary.revolutions.push(revolutionResult);
            }
        } catch (revErr) {
            console.error(`[advanceTick] Revolution processing failed for ${nation.name} (non-fatal):`, revErr);
        }

        // Random events
        try {
            const eventResults = await processEvents(supabase, nation, newTick);
            if (eventResults.length > 0) summary.events.push({ nation: nation.name, events: eventResults });
        } catch (eventErr) {
            console.error(`[advanceTick] Random events failed for ${nation.name} (non-fatal):`, eventErr);
        }

        // Process active fundraiser promises
        try {
            const promiseResults = await processPromiseTick(supabase, nation, newTick);
            if (promiseResults.length > 0) {
                summary.promises = summary.promises || [];
                summary.promises.push({ nation: nation.name, promises: promiseResults });
            }
        } catch (promiseErr) {
            console.error(`[advanceTick] Promise processing failed for ${nation.name} (non-fatal):`, promiseErr);
        }


        // Writing AP rewards: grant bonus AP for long op-eds and articles published this tick
        try {
            const rewardResults = await processWritingRewards(supabase, nation.id, newTick);
            if (rewardResults.length > 0) {
                summary.writingRewards = summary.writingRewards || [];
                summary.writingRewards.push({ nation: nation.name, rewards: rewardResults });
            }
        } catch (rewardErr) {
            console.error(`[advanceTick] Writing rewards failed for ${nation.name} (non-fatal):`, rewardErr);
        }

        // Economic aid condition reviews (annual, at year boundaries)
        try {
            const aidReviewResults = await processAidConditionReview(supabase, freshNation || nation, newTick);
            if (aidReviewResults.length > 0) {
                summary.aidReviews = summary.aidReviews || [];
                summary.aidReviews.push({ nation: nation.name, reviews: aidReviewResults });
            }
        } catch (aidErr) {
            console.error(`[advanceTick] Aid condition review failed for ${nation.name} (non-fatal):`, aidErr);
        }

        // Ambassador term limits (retirements + warnings)
        try {
            const retirementResults = await processAmbassadorRetirements(supabase, freshNation || nation, newTick);
            if (retirementResults.length > 0) {
                summary.ambassadorRetirements = summary.ambassadorRetirements || [];
                summary.ambassadorRetirements.push({ nation: nation.name, retirements: retirementResults });
            }
        } catch (retireErr) {
            console.error(`[advanceTick] Ambassador retirements failed for ${nation.name} (non-fatal):`, retireErr);
        }

        // ── Succession helper: updates HOS, syncs nation object, logs action ──
        // Autocracies use V5 resolveSuccession (designated successor or auto-coup).
        // Non-autocracies use random replacement (legacy behavior).
        async function handleStrongmanSuccession(
            supabase: any, nation: any, hosName: string, hosAge: number, newTick: number
        ) {
            // V5 succession for autocracies
            if (isAutocracy(nation)) {
                await supabase.from('campaign_actions').insert({
                    party_id: nation.ruling_faction_id, nation_id: nation.id,
                    action_type: 'strongman_death', tick_performed: newTick,
                    result: { deceased_name: hosName, deceased_age: hosAge, cause: 'natural_causes' },
                });

                const successionResult = await resolveSuccession(supabase, nation, newTick);

                // Generate new HOS identity for the new regime
                const FIRST = ['Alejandro','Camila','Diego','Valentina','Mateo','Isabela','Sebastián','Luca','Andrés','Gabriel','Joaquín','Mariana','Carlos','Tomas','Rafael','Edwin','Emilio','Catalina','Fernando','Renata'];
                const LAST = ['Velasco','Mendoza','Guerrero','Salazar','Castillo','Herrera','Morales','Ríos','Delgado','Espinoza','Guzmán','Navarro','Córdoba','Echeverría','Pacheco','Montero','Aguilar','Valenzuela','Carrasco','Ibarra'];
                const newFirst = FIRST[Math.floor(Math.random() * FIRST.length)];
                const newLast = LAST[Math.floor(Math.random() * LAST.length)];
                const newAge = 45 + Math.floor(Math.random() * 16);

                await supabase.from('nations').update({
                    head_of_state_first_name: newFirst, head_of_state_last_name: newLast,
                    head_of_state_age: newAge,
                    designated_successor_faction_id: null,
                }).eq('id', nation.id);
                nation.head_of_state_first_name = newFirst;
                nation.head_of_state_last_name = newLast;
                nation.head_of_state_age = newAge;

                return { type: 'strongman_death', deceased: hosName, deceasedAge: hosAge,
                    successor: `${newFirst} ${newLast}`, successorAge: newAge, ...successionResult };
            }

            // Legacy random replacement for non-autocracies
            const FIRST = ['Alejandro','Camila','Diego','Valentina','Mateo','Isabela','Sebastián','Luca','Andrés','Gabriel','Joaquín','Mariana','Carlos','Tomas','Rafael','Edwin','Emilio','Catalina','Fernando','Renata'];
            const LAST = ['Velasco','Mendoza','Guerrero','Salazar','Castillo','Herrera','Morales','Ríos','Delgado','Espinoza','Guzmán','Navarro','Córdoba','Echeverría','Pacheco','Montero','Aguilar','Valenzuela','Carrasco','Ibarra'];
            const newFirst = FIRST[Math.floor(Math.random() * FIRST.length)];
            const newLast = LAST[Math.floor(Math.random() * LAST.length)];
            const newAge = 45 + Math.floor(Math.random() * 16);
            const newName = `${newFirst} ${newLast}`;

            await supabase.from('nations').update({
                head_of_state_first_name: newFirst, head_of_state_last_name: newLast,
                head_of_state_age: newAge,
                successor_cooldown_end_tick: null, successor_is_family_member: false,
            }).eq('id', nation.id);
            nation.head_of_state_first_name = newFirst;
            nation.head_of_state_last_name = newLast;
            nation.head_of_state_age = newAge;

            await supabase.from('campaign_actions').insert({
                party_id: nation.ruling_faction_id, nation_id: nation.id,
                action_type: 'strongman_death', tick_performed: newTick,
                result: { deceased_name: hosName, deceased_age: hosAge,
                    successor_name: newName, successor_age: newAge, cause: 'natural_causes' },
            });
            return { type: 'strongman_death', deceased: hosName, deceasedAge: hosAge,
                successor: newName, successorAge: newAge };
        }

        // ── Leader aging (every January — tick % 12 === 0) ──
        // All party leaders and the strongman age 1 year.
        // The strongman also rolls health checks starting at age 70.
        if (newTick % 12 === 0) {
            try {
                console.log(`[LeaderAging] ${nation.name}: tick=${newTick} (January — aging leaders)`);
                const agingResults = [];

                // 1. Age all party faction leaders +1
                const { data: partyFactions } = await supabase
                    .from('factions')
                    .select('id, faction_name, leader_age, leader_first_name, leader_last_name')
                    .eq('nation_id', nation.id)
                    .eq('faction_type', 'party')
                    .not('leader_age', 'is', null);

                if (partyFactions && partyFactions.length > 0) {
                    const factionIdToAge = {};
                    for (const f of partyFactions) {
                        const newAge = (f.leader_age || 40) + 1;
                        factionIdToAge[f.id] = newAge;
                        await supabase.from('factions')
                            .update({ leader_age: newAge })
                            .eq('id', f.id);
                        agingResults.push({
                            type: 'party_leader',
                            name: `${f.leader_first_name || '?'} ${f.leader_last_name || '?'}`,
                            factionId: f.id,
                            newAge
                        });

                        // Retirement check: leaders over 65 roll 1d100 each year.
                        // If the roll is lower than their age, they retire.
                        if (newAge > 65) {
                            const roll = Math.floor(Math.random() * 100) + 1; // 1-100
                            const leaderName = `${f.leader_first_name || '?'} ${f.leader_last_name || '?'}`;
                            console.log(`[LeaderAging] Retirement check for ${leaderName} (${f.faction_name}): age=${newAge}, roll=${roll}`);

                            if (roll < newAge) {
                                console.log(`[LeaderAging] ${leaderName} of ${f.faction_name} retires at age ${newAge} (rolled ${roll} < ${newAge})`);

                                // Clear leader from faction
                                const { error: retireErr } = await supabase.from('factions')
                                    .update({ leader_first_name: null, leader_last_name: null, leader_age: null, electability: 50 })
                                    .eq('id', f.id);
                                if (retireErr) {
                                    console.warn(`[LeaderAging] Failed to clear retired leader ${leaderName}:`, retireErr.message);
                                }

                                // Log retirement event
                                const { error: retireEventErr } = await supabase.from('event_log').insert({
                                    nation_id: nation.id,
                                    event_name: 'Party Leader Retires',
                                    description_chosen: `${leaderName}, leader of ${f.faction_name || 'the party'}, has retired from politics at age ${newAge}.`,
                                    category: 'POLITICAL',
                                    fired_at_tick: newTick,
                                });
                                if (retireEventErr) {
                                    console.warn(`[LeaderAging] Failed to log retirement event:`, retireEventErr.message);
                                }

                                agingResults.push({
                                    type: 'party_leader_retirement',
                                    name: leaderName,
                                    factionId: f.id,
                                    factionName: f.faction_name,
                                    age: newAge,
                                    roll
                                });
                            }
                        }
                    }

                    // 1b. Sync PM with party leader in head_of_government (democracy)
                    // Keeps age, name, and downstream records in sync when a new leader is appointed.
                    const { data: activeHog } = await supabase
                        .from('head_of_government')
                        .select('id, faction_id, first_name, last_name')
                        .eq('nation_id', nation.id)
                        .eq('active', true)
                        .maybeSingle();
                    if (activeHog) {
                        const pmFaction = partyFactions.find(f => f.id === activeHog.faction_id);
                        if (pmFaction) {
                            const hogUpdate = {};
                            if (factionIdToAge[activeHog.faction_id]) {
                                hogUpdate.age = factionIdToAge[activeHog.faction_id];
                            }
                            if (pmFaction.leader_first_name && pmFaction.leader_last_name &&
                                (pmFaction.leader_first_name !== activeHog.first_name || pmFaction.leader_last_name !== activeHog.last_name)) {
                                hogUpdate.first_name = pmFaction.leader_first_name;
                                hogUpdate.last_name = pmFaction.leader_last_name;
                                console.log(`[PMSync] Updating PM name: ${activeHog.first_name} ${activeHog.last_name} → ${pmFaction.leader_first_name} ${pmFaction.leader_last_name}`);

                                const pmFullName = `${pmFaction.leader_first_name} ${pmFaction.leader_last_name}`;
                                const { error: adminErr } = await supabase.from('administrations').update({
                                    prime_minister: pmFullName,
                                    admin_name: `${pmFaction.leader_last_name} Administration`,
                                    updated_at: new Date().toISOString()
                                }).eq('nation_id', nation.id).is('ended_at_tick', null);
                                if (adminErr) console.warn('[PMSync] administrations update failed:', adminErr.message);

                                const { error: minErr } = await supabase.from('ministries').update({
                                    minister_first_name: pmFaction.leader_first_name,
                                    minister_last_name: pmFaction.leader_last_name,
                                    minister_age: hogUpdate.age || pmFaction.leader_age
                                }).eq('nation_id', nation.id)
                                  .eq('ministry_key', 'prime_minister')
                                  .eq('is_active', true);
                                if (minErr) console.warn('[PMSync] ministries update failed:', minErr.message);
                            }
                            if (Object.keys(hogUpdate).length > 0) {
                                const { error: hogErr } = await supabase.from('head_of_government')
                                    .update(hogUpdate)
                                    .eq('id', activeHog.id);
                                if (hogErr) console.warn('[PMSync] head_of_government update failed:', hogErr.message);
                            }
                        }
                    }

                    // 1c. Age all active ministers +1
                    const { data: activeMinistries } = await supabase
                        .from('ministries')
                        .select('id, minister_age')
                        .eq('nation_id', nation.id)
                        .not('minister_age', 'is', null);
                    if (activeMinistries && activeMinistries.length > 0) {
                        for (const m of activeMinistries) {
                            const newMinAge = (m.minister_age || 40) + 1;
                            await supabase.from('ministries')
                                .update({ minister_age: newMinAge })
                                .eq('id', m.id);
                        }
                        agingResults.push({
                            type: 'ministers',
                            count: activeMinistries.length,
                            nation: nation.name
                        });
                    }
                }

                // 2. Age the strongman (head of state) +1 and roll health checks (autocracy)
                if (isAutocracy(nation)) {
                    // (Steward aging removed — Phase 0)
                    const hosAge = Number(nation.head_of_state_age ?? 0);
                    if (hosAge > 0) {
                        const newHosAge = hosAge + 1;
                        await supabase.from('nations')
                            .update({ head_of_state_age: newHosAge })
                            .eq('id', nation.id);
                        nation.head_of_state_age = newHosAge;
                        agingResults.push({
                            type: 'strongman',
                            name: `${nation.head_of_state_first_name || '?'} ${nation.head_of_state_last_name || '?'}`,
                            newAge: newHosAge
                        });

                        // Strongman health check: escalating death chance from age 70 to 85.
                        // Probability: 5% at 70, rising linearly to 100% at 85.
                        // Formula: deathChance = 0.05 + (age - 70) * (0.95 / 15)
                        if (newHosAge >= 70) {
                            const deathChance = Math.min(1.0, 0.05 + (newHosAge - 70) * (0.95 / 15));
                            const roll = Math.random();
                            console.log(`[LeaderAging] Strongman health check for ${nation.name}: age=${newHosAge}, deathChance=${(deathChance * 100).toFixed(1)}%, roll=${roll.toFixed(3)}`);

                            if (roll < deathChance) {
                                const hosName = `${nation.head_of_state_first_name || 'The Strongman'} ${nation.head_of_state_last_name || ''}`.trim();
                                console.log(`[LeaderAging] Strongman ${hosName} of ${nation.name} has died at age ${newHosAge}`);
                                const result = await handleStrongmanSuccession(supabase, nation, hosName, newHosAge, newTick);
                                agingResults.push(result);
                            }
                        }
                    }
                }

                if (agingResults.length > 0) {
                    summary.leaderAging = summary.leaderAging || [];
                    summary.leaderAging.push({ nation: nation.name, results: agingResults });
                    console.log(`[LeaderAging] ${nation.name}: aged ${agingResults.length} leader(s)`);
                }
            } catch (agingErr) {
                console.error(`[advanceTick] Leader aging failed for ${nation.name} (non-fatal):`, agingErr);
            }
        }

      } catch (nationErr) {
        console.error(`[advanceTick] FAILED processing nation ${nation.id} (${nation.name}):`, nationErr);
        summary.errors = summary.errors || [];
        summary.errors.push({ nation: nation.name, nationId: nation.id, error: String(nationErr) });
      } finally {
        // Always record history snapshot, even if processing failed partway through.
        // Without this, a crash in any processing step (elections, crises, etc.)
        // causes stat_history / nations_history to have gaps, which makes trend
        // deltas show stale cumulative changes instead of per-tick changes.
        try {
            const { data: finalNation } = await supabase.from('nations').select('*').eq('id', nation.id).single();
            await recordStatHistory(supabase, finalNation || nation, newTick);
            await snapshotNationHistory(supabase, finalNation || nation, newTick);
        } catch (snapErr) {
            console.error(`[advanceTick] History snapshot FAILED for ${nation.id} (${nation.name}):`, snapErr);
        }
      }
    }

    // ══════════════════════════════════════════════════════════════════
    // 4b. INTERNATIONAL PARTY ORGANISATIONS — cross-nation processing
    // ══════════════════════════════════════════════════════════════════
    try {
        const { data: activeOrgs } = await supabase
            .from('international_orgs')
            .select('*')
            .eq('is_active', true);

        const ipoOrgs = activeOrgs || [];
        if (ipoOrgs.length > 0) {
            console.log(`[advanceTick] IPO: Processing ${ipoOrgs.length} active organisation(s)...`);
        }

        for (const org of ipoOrgs) {
            try {
                const charter = org.charter || {};
                const leadership = charter.leadership || {};
                const resources = charter.resources || {};

                // Fetch active members (full members only, not observers)
                const { data: members } = await supabase
                    .from('ipo_members')
                    .select('faction_id, role, factions:faction_id ( id, faction_name, nation_id, action_points, seats )')
                    .eq('org_id', org.id)
                    .eq('is_active', true);
                const fullMembers = (members || []).filter(m => m.role === 'member');

                // ── 1. VOTE AUTO-RESOLUTION ──
                // Resolve open votes that have reached their closes_at_tick
                const { data: expiredVotes } = await supabase
                    .from('ipo_votes')
                    .select('*')
                    .eq('org_id', org.id)
                    .eq('status', 'open')
                    .lte('closes_at_tick', newTick);

                for (const vote of (expiredVotes || [])) {
                    try {
                        // Fetch ballots for this vote
                        const { data: ballots } = await supabase
                            .from('ipo_ballots')
                            .select('*')
                            .eq('vote_id', vote.id);

                        const yes = (ballots || []).filter(b => b.ballot === 'yes').length;
                        const no = (ballots || []).filter(b => b.ballot === 'no').length;
                        const abstain = (ballots || []).filter(b => b.ballot === 'abstain').length;
                        const totalEligible = fullMembers.length;
                        const votePass = leadership.votePass || 'majority';

                        let passed = false;
                        if (totalEligible === 0) {
                            passed = false; // No members = cannot pass
                        } else if (votePass === 'unanimous') {
                            passed = yes === totalEligible && no === 0;
                        } else {
                            passed = yes > no && (yes / totalEligible) > 0.5;
                        }

                        // Veto check
                        const governance = charter.governance || {};
                        if (passed && governance.vetoRight) {
                            let vetoHolderId = null;
                            if (governance.vetoRight === 'president') vetoHolderId = org.president_id;
                            else if (governance.vetoRight === 'founding') vetoHolderId = org.founding_party_id;
                            else if (governance.vetoRight === 'hq' && org.headquarters_nation_id) {
                                const hqMember = fullMembers.find(m => m.factions?.nation_id === org.headquarters_nation_id);
                                vetoHolderId = hqMember?.faction_id || null;
                            }
                            if (vetoHolderId) {
                                const vetoBallot = (ballots || []).find(b => b.faction_id === vetoHolderId);
                                if (vetoBallot && vetoBallot.ballot === 'no') passed = false;
                            }
                        }

                        // Expulsion clause override
                        if (vote.vote_type === 'expulsion' && totalEligible > 0 && charter.membership?.expulsionClause === 'unanimous') {
                            passed = yes === totalEligible && no === 0;
                        }

                        const result = { yes, no, abstain, passed };
                        const newStatus = passed ? 'passed' : 'failed';

                        await supabase.from('ipo_votes')
                            .update({ status: newStatus, result, resolved_at_tick: newTick })
                            .eq('id', vote.id);

                        // Apply effects for passed votes
                        if (passed) {
                            await applyIPOVoteEffect(supabase, org, vote, fullMembers, newTick);
                        }

                        // Reject membership invite if vote failed
                        if (!passed && vote.vote_type === 'membership' && vote.meta?.invite_id) {
                            await supabase.from('ipo_invitations')
                                .update({ status: 'declined', responded_at_tick: newTick })
                                .eq('id', vote.meta.invite_id);
                        }

                        const outcomeText = passed ? 'PASSED' : 'FAILED';
                        await supabase.from('ipo_chat').insert({
                            org_id: org.id, faction_id: null, is_system: true,
                            message_text: `Vote "${vote.title}" auto-resolved: ${outcomeText} (${yes}Y / ${no}N / ${abstain}A).`,
                            tick_posted: newTick
                        });

                        console.log(`[advanceTick] IPO vote "${vote.title}" auto-resolved: ${outcomeText}`);
                    } catch (voteErr) {
                        console.error(`[advanceTick] IPO vote resolution failed for vote ${vote.id}:`, voteErr);
                    }
                }

                // ── 2. LEADERSHIP SUCCESSION ──
                // Check if president's term has expired
                const termTicks = (leadership.termYears || 2) * 12; // 12 ticks per year
                const termEnd = (org.president_term_start_tick || 0) + termTicks;

                if (newTick >= termEnd && fullMembers.length > 0) {
                    let newPresidentId = null;
                    const successionType = leadership.type || 'rotation';

                    if (successionType === 'rotation') {
                        // Rotate to next member (by join order / faction_id sort)
                        const sortedMembers = [...fullMembers].sort((a, b) => a.faction_id.localeCompare(b.faction_id));
                        const currentIdx = sortedMembers.findIndex(m => m.faction_id === org.president_id);
                        const nextIdx = (currentIdx + 1) % sortedMembers.length;
                        newPresidentId = sortedMembers[nextIdx].faction_id;
                    } else if (successionType === 'most_seats') {
                        // Member with the most parliamentary seats
                        let maxSeats = -1;
                        for (const m of fullMembers) {
                            const seats = m.factions?.seats || 0;
                            if (seats > maxSeats) {
                                maxSeats = seats;
                                newPresidentId = m.faction_id;
                            }
                        }
                    } else if (successionType === 'random') {
                        const idx = Math.floor(Math.random() * fullMembers.length);
                        newPresidentId = fullMembers[idx].faction_id;
                    }

                    if (newPresidentId && newPresidentId !== org.president_id) {
                        await supabase.from('international_orgs')
                            .update({ president_id: newPresidentId, president_term_start_tick: newTick })
                            .eq('id', org.id);

                        const newPres = fullMembers.find(m => m.faction_id === newPresidentId);
                        const presName = newPres?.factions?.faction_name || 'Unknown';
                        await supabase.from('ipo_chat').insert({
                            org_id: org.id, faction_id: null, is_system: true,
                            message_text: `Leadership succession: ${presName} is now president (${successionType}).`,
                            tick_posted: newTick
                        });
                        console.log(`[advanceTick] IPO ${org.name}: leadership succession → ${presName} (${successionType})`);
                    } else if (newPresidentId === org.president_id) {
                        // Same president re-elected / re-selected — reset term
                        await supabase.from('international_orgs')
                            .update({ president_term_start_tick: newTick })
                            .eq('id', org.id);
                    }
                }

                // ── 3. SOLIDARITY FUND QUARTERLY COLLECTION ──
                // Every 3 ticks (quarterly), collect contributions from members
                if (resources.solidarityFund?.enabled && newTick % 3 === 0) {
                    const contribution = resources.solidarityFund.contributionPerQuarter || 1;
                    let totalCollected = 0;

                    // Identify autocratic non-strongman factions (they don't contribute — only strongman pays for the whole regime)
                    const memberFactionIds = fullMembers.map(m => m.faction_id);
                    let autocraticNonStrongmanIds = new Set();
                    if (memberFactionIds.length > 0) {
                        try {
                            const { data: pillarStates } = await supabase
                                .from('faction_pillar_state')
                                .select('faction_id, is_strongman')
                                .in('faction_id', memberFactionIds);
                            for (const ps of (pillarStates || [])) {
                                if (!ps.is_strongman) autocraticNonStrongmanIds.add(ps.faction_id);
                            }
                        } catch (e) { /* non-fatal */ }
                    }

                    for (const m of fullMembers) {
                        // Skip non-strongman autocratic factions (strongman pays for the whole regime)
                        if (autocraticNonStrongmanIds.has(m.faction_id)) continue;

                        // Deduct AP from faction
                        const { data: deducted } = await supabase.rpc('deduct_ap', {
                            p_faction_id: m.faction_id,
                            p_cost: contribution
                        });

                        if (deducted !== null && deducted >= 0) {
                            totalCollected += contribution;
                            await supabase.from('ipo_fund_transactions').insert({
                                org_id: org.id,
                                faction_id: m.faction_id,
                                transaction_type: 'contribution',
                                amount: contribution,
                                description: 'Quarterly solidarity fund contribution',
                                tick: newTick
                            });
                            await supabase.from('ap_ledger').insert({ faction_id: m.faction_id, tick: newTick, delta: -contribution, reason: 'ipo_contribution', detail: org.name + ' solidarity fund' }).then(() => {});
                        }
                        // If deduction fails (insufficient AP), skip silently
                    }

                    if (totalCollected > 0) {
                        await supabase.from('international_orgs')
                            .update({ solidarity_fund_balance: (org.solidarity_fund_balance || 0) + totalCollected })
                            .eq('id', org.id);

                        await supabase.from('ipo_chat').insert({
                            org_id: org.id, faction_id: null, is_system: true,
                            message_text: `Quarterly fund collection: ${totalCollected} AP collected from ${fullMembers.length} member(s).`,
                            tick_posted: newTick
                        });
                    }
                }

                // ── 4. HQ AP COST ──
                // If HQ is set, deduct 1 AP per tick from solidarity fund as upkeep
                if (org.headquarters_nation_id && resources.solidarityFund?.enabled) {
                    const hqCost = 1;
                    const currentBalance = org.solidarity_fund_balance || 0;
                    if (currentBalance >= hqCost) {
                        await supabase.from('international_orgs')
                            .update({ solidarity_fund_balance: currentBalance - hqCost })
                            .eq('id', org.id);

                        await supabase.from('ipo_fund_transactions').insert({
                            org_id: org.id,
                            faction_id: null,
                            transaction_type: 'hq_cost',
                            amount: -hqCost,
                            description: 'Headquarters upkeep',
                            tick: newTick
                        });
                    }
                }

                // ── 5. SYMPOSIUM RESOLUTION + COOLDOWN ──
                // Decrement cooldown
                if ((org.symposium_cooldown_remaining || 0) > 0) {
                    await supabase.from('international_orgs')
                        .update({ symposium_cooldown_remaining: org.symposium_cooldown_remaining - 1 })
                        .eq('id', org.id);
                }

                // Check pending symposium
                if (org.pending_symposium && org.pending_symposium.firesOnTick <= newTick) {
                    const symp = org.pending_symposium;
                    try {
                        // Apply ideology shift to target nation
                        const { data: targetNation } = await supabase
                            .from('nations')
                            .select('id, name, ideology')
                            .eq('id', symp.targetNation)
                            .single();

                        if (targetNation) {
                            const ideology = targetNation.ideology || {};
                            const axis = symp.axis || 'economic';
                            const direction = symp.direction || 'left';
                            const shift = symp.ideologyShift || 3;

                            // Map axis to ideology field
                            const axisMap = {
                                economic: 'economic',
                                social: 'social',
                                foreign: 'foreign_policy'
                            };
                            const field = axisMap[axis] || axis;
                            const current = Number(ideology[field] ?? 50);
                            const delta = direction === 'left' ? -shift : shift;
                            ideology[field] = Math.max(0, Math.min(100, current + delta));

                            await supabase.from('nations')
                                .update({ ideology })
                                .eq('id', targetNation.id);

                            // Clear pending
                            await supabase.from('international_orgs')
                                .update({ pending_symposium: null })
                                .eq('id', org.id);

                            await supabase.from('ipo_chat').insert({
                                org_id: org.id, faction_id: null, is_system: true,
                                message_text: `Symposium effect applied: ${targetNation.name} ${axis} shifted ${direction} by ${shift}.`,
                                tick_posted: newTick
                            });

                            console.log(`[advanceTick] IPO ${org.name}: symposium fired — ${targetNation.name} ${axis} ${direction} ${shift}`);
                        } else {
                            // Target nation not found — clear pending
                            await supabase.from('international_orgs')
                                .update({ pending_symposium: null })
                                .eq('id', org.id);
                        }
                    } catch (sympErr) {
                        console.error(`[advanceTick] IPO symposium failed for ${org.name}:`, sympErr);
                    }
                }

                // ── 6. MEMBERSHIP INVITE EXPIRY ──
                // Expire vote_pending invitations where the vote has already failed/been resolved
                const { data: pendingInvites } = await supabase
                    .from('ipo_invitations')
                    .select('id, invited_faction_id')
                    .eq('org_id', org.id)
                    .eq('status', 'vote_pending');

                for (const inv of (pendingInvites || [])) {
                    // Check if there's a completed (non-open) membership vote for this invite
                    const { data: relatedVotes } = await supabase
                        .from('ipo_votes')
                        .select('id, status')
                        .eq('org_id', org.id)
                        .eq('vote_type', 'membership')
                        .neq('status', 'open')
                        .contains('meta', { invite_id: inv.id });

                    if (relatedVotes && relatedVotes.length > 0) {
                        const vote = relatedVotes[0];
                        if (vote.status === 'failed') {
                            await supabase.from('ipo_invitations')
                                .update({ status: 'declined', responded_at_tick: newTick })
                                .eq('id', inv.id);
                        }
                        // 'passed' case already handled by applyIPOVoteEffect
                    }
                }

            } catch (orgErr) {
                console.error(`[advanceTick] IPO processing failed for org ${org.id} (${org.name}):`, orgErr);
            }
        }

    } catch (ipoErr) {
        console.error('[advanceTick] IPO processing failed (non-fatal):', ipoErr);
    }

    // 5. Commit shard tick/date AFTER all nation processing completes.
    // This is the last step — if the function timed out earlier, the tick
    // number stays unchanged and the cron will re-process on the next run.
    // Commit shard update — skip entirely in reprocess mode
    if (reprocess) {
        console.log(`[advanceTick] REPROCESS complete for tick ${newTick}. Shard NOT updated (no advance).`);
    } else {
        console.log(`[advanceTick] All nations processed. Committing tick ${newTick}...`);
        await supabase.from('shard').update({
            current_tick: newTick,
            next_tick_at: nextTickAt.toISOString(),
            current_date: newDate
        }).eq('name', 'Alpha Shard');
        console.log(`[advanceTick] Tick ${newTick} committed. Next tick at ${nextTickAt.toISOString()}`);
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
        console.log("[advance-tick] Step 0: Running preflight...");
        await ensureApRpcAvailability(supabase);
        console.log("[advance-tick] Step 0: Preflight complete.");

        // 1. Check for force/reprocess parameters (admin manual trigger)
        let force = false;
        let reprocess = false;
        try {
            const body = await Promise.race([
                req.json(),
                new Promise((_, reject) => setTimeout(() => reject(new Error("body read timeout")), 3000)),
            ]);
            force = body?.force === true;
            reprocess = body?.reprocess === true;
        } catch (_) {
            // No body, invalid JSON, or timeout — not forced
        }
        console.log(`[advance-tick] Step 1: force=${force}, reprocess=${reprocess}`);

        // 2. Check if tick is due (skip check if force=true)
        console.log("[advance-tick] Step 2: Querying shard...");
        const { data: shard, error: shardError } = await supabase
            .from("shard")
            .select("next_tick_at, current_tick, tick_processing")
            .eq("name", "Alpha Shard")
            .single();
        console.log(`[advance-tick] Step 2: Shard query done. error=${shardError?.message ?? 'none'}, tick=${shard?.current_tick}`);

        if (shardError || !shard) {
            console.error(`[advance-tick] Shard not found: ${shardError?.message}`);
            return new Response(
                JSON.stringify({ error: "Shard not found", detail: shardError?.message }),
                { status: 404, headers: corsHeaders }
            );
        }

        if (!force && !reprocess) {
            const now = new Date();
            const nextTickAt = new Date(shard.next_tick_at);

            if (now < nextTickAt) {
                const remainMs = nextTickAt.getTime() - now.getTime();
                console.log(`[advance-tick] Not due — tick ${shard.current_tick}, next_tick_at=${shard.next_tick_at}, remaining=${Math.round(remainMs / 1000)}s`);
                return new Response(
                    JSON.stringify({
                        status: "not_due",
                        current_tick: shard.current_tick,
                        next_tick_at: shard.next_tick_at,
                        time_remaining_ms: remainMs,
                    }),
                    { headers: corsHeaders }
                );
            }
        }

        // 3. Tick is due (or forced) — acquire lock
        console.log(`[advance-tick] ✓ Tick IS due (or forced/reprocess). Acquiring lock for tick ${shard.current_tick}...`);
        const lockAcquired = await acquireTickLock(supabase);
        if (!lockAcquired) {
            console.warn(`[advance-tick] Lock held — tick ${shard.current_tick}, tick_processing=${shard.tick_processing}`);
            return new Response(
                JSON.stringify({
                    status: "locked",
                    message: "Another process is already processing the tick",
                }),
                { headers: corsHeaders }
            );
        }

        // 4. Process the tick
        console.log(`[advance-tick] Lock acquired, processing tick ${shard.current_tick}...`);
        try {
            const summary = await advanceTick(supabase, { force, reprocess });
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
