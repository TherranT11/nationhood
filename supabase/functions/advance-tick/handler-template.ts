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
    // base 3 AP, +2 if in government coalition or strongman. Capped at MAX_AP (10).
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
            let apGain = 3;
            if (isInGovernment) apGain += 2;

            // Family member successor penalty: ruling faction loses 1 AP/tick
            if (nation.successor_is_family_member && faction.id === nation.ruling_faction_id) {
                apGain = Math.max(1, apGain - 1);
            }

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
        let statInstMap = null;
        const policyDecayAdj = await buildPolicyDecayAdjustments(supabase, nation.id);
        const decayResults = await processStatDecay(supabase, nation, statInstMap, policyDecayAdj);
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

                    // President's party takes -10 approval
                    await adjustMomentumAll(supabase, nation.id, president.faction_id, -10, 'impeachment:convicted');

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
                    const vpFirst = PM_FIRST_NAMES[Math.floor(Math.random() * PM_FIRST_NAMES.length)];
                    const vpLast = PM_LAST_NAMES[Math.floor(Math.random() * PM_LAST_NAMES.length)];

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
        await processPresidentCandidateTimeout(supabase, nation, newTick);
        await processParliamentaryPMTimeout(supabase, nation, newTick);

        // Incumbent campaign bonuses (+2 approval/tick during pre-election window)
        await processIncumbentCampaignBonuses(supabase, nation, newTick);

        // Ideology shifts from resolved bills
        try {
            await processIdeologyShifts(supabase, nation.id, resolutions, newTick);
        } catch (ideoErr) {
            console.error(`[advanceTick] Ideology shifts failed for ${nation.name} (non-fatal):`, ideoErr);
        }

        // Purge approval decay (autocracy scapegoat mechanic)
        try {
            if (isAutocracy(nation)) {
                await processPurgeDecay(supabase, nation.id, newTick);
            }
        } catch (purgeErr) {
            console.error(`[advanceTick] Purge decay failed for ${nation.name} (non-fatal):`, purgeErr);
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
        let crisisResults = [];
        try {
            crisisResults = await processCrises(supabase, nation, newTick);
            if (crisisResults.length > 0) {
                summary.crises = summary.crises || [];
                summary.crises.push({ nation: nation.name, crises: crisisResults });
            }
        } catch (crisisErr) {
            console.error(`[advanceTick] Crisis processing failed for ${nation.name} (non-fatal):`, crisisErr);
        }

        // Population growth: recompute from birth_rate - death_rate base,
        // preserving any policy/crisis deltas, then apply population change.
        try {
            const popGrowthResult = await processPopulationGrowth(supabase, nation, popGrowthBeforeEffects);
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
            const govApproval = await calculateGovernmentApprovalTick(supabase, nation, newTick);
        } catch (govAppErr) {
            console.error(`[advanceTick] Gov approval calc failed for ${nation.name} (non-fatal):`, govAppErr);
        }

        // Three-pillar voter preference recalculation
        try {
            await calculateThreePillarPreferences(supabase, nation, newTick);
        } catch (pillarErr) {
            console.error(`[advanceTick] Three-pillar prefs failed for ${nation.name} (non-fatal):`, pillarErr);
        }

        // Autocracy-specific per-tick processing (loyalty, pillars, stewards, standing, regime health, etc.)
        if (isAutocracy(nation)) {
            // Expire pending loyalty demands
            try { await processLoyaltyDemandExpiry(supabase, nation, newTick); }
            catch (e) { console.error(`[advanceTick] Loyalty demand expiry failed for ${nation.name} (non-fatal):`, e); }

            // Faction loyalty
            try { await processLoyaltyTick(supabase, nation); }
            catch (e) { console.error(`[advanceTick] Loyalty tick failed for ${nation.name} (non-fatal):`, e); }

            // Regime pillars decay & bonus
            try { await processRegimePillars(supabase, nation); }
            catch (e) { console.error(`[advanceTick] Regime pillars failed for ${nation.name} (non-fatal):`, e); }

            // Steward stats tick
            try { await processStewardTick(supabase, nation); }
            catch (e) { console.error(`[advanceTick] Steward tick failed for ${nation.name} (non-fatal):`, e); }

            // Standing relevance decay
            try { await processStandingTick(supabase, nation, newTick); }
            catch (e) { console.error(`[advanceTick] Standing tick failed for ${nation.name} (non-fatal):`, e); }

            // Regime health tick
            try { await processRegimeHealthTick(supabase, nation, newTick); }
            catch (e) { console.error(`[advanceTick] Regime health failed for ${nation.name} (non-fatal):`, e); }

            // Unaligned seat pool regeneration
            try { await processUnalignedPoolTick(supabase, nation, newTick); }
            catch (e) { console.error(`[advanceTick] Unaligned pool failed for ${nation.name} (non-fatal):`, e); }

            // Secret coalition detection
            try { await processCoalitionDetection(supabase, nation, newTick); }
            catch (e) { console.error(`[advanceTick] Coalition detection failed for ${nation.name} (non-fatal):`, e); }
        }

        // Auto-resolve shakeups that are 1+ ticks old
        try {
            if (isAutocracy(nation)) {
                await autoResolveStaleShakeups(supabase, nation.id, newTick);
            }
        } catch (shakeupErr) {
            console.error(`[advanceTick] Shakeup auto-resolve failed for ${nation.name} (non-fatal):`, shakeupErr);
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
        async function handleStrongmanSuccession(
            supabase: any, nation: any, hosName: string, hosAge: number, newTick: number
        ) {
            const FIRST = ['Alejandro','Camila','Diego','Valentina','Mateo','Isabela','Sebastián','Luca','Andrés','Gabriel','Joaquín','Mariana','Carlos','Tomas','Rafael','Edwin','Emilio','Catalina','Fernando','Renata'];
            const LAST = ['Velasco','Mendoza','Guerrero','Salazar','Castillo','Herrera','Morales','Ríos','Delgado','Espinoza','Guzmán','Navarro','Córdoba','Echeverría','Pacheco','Montero','Aguilar','Valenzuela','Carrasco','Ibarra'];
            const randFirst = () => FIRST[Math.floor(Math.random() * FIRST.length)];
            const randLast = () => LAST[Math.floor(Math.random() * LAST.length)];

            // Check for chosen successor
            const { data: chosenSuccessor } = await supabase.from('stewards')
                .select('id, faction_id, first_name, last_name, age, pillar_key, steward_type, succession_strength')
                .eq('nation_id', nation.id).eq('is_chosen_successor', true).eq('is_alive', true)
                .maybeSingle();

            if (chosenSuccessor) {
                // === CLEAN SUCCESSION ===
                const successorName = `${chosenSuccessor.first_name} ${chosenSuccessor.last_name}`;
                console.log(`[LeaderAging] Clean succession: ${successorName} takes power`);

                await supabase.from('nations').update({
                    head_of_state_first_name: chosenSuccessor.first_name,
                    head_of_state_last_name: chosenSuccessor.last_name,
                    head_of_state_age: chosenSuccessor.age,
                    ruling_faction_id: chosenSuccessor.faction_id,
                    successor_cooldown_end_tick: null, successor_is_family_member: false,
                }).eq('id', nation.id);
                nation.head_of_state_first_name = chosenSuccessor.first_name;
                nation.head_of_state_last_name = chosenSuccessor.last_name;
                nation.head_of_state_age = chosenSuccessor.age;
                nation.ruling_faction_id = chosenSuccessor.faction_id;

                // Retire old steward, reset coup readiness
                await supabase.from('stewards').update({
                    is_chosen_successor: false, succession_strength: 0,
                    successor_appointed_tick: null, is_alive: false, died_at_tick: newTick,
                }).eq('id', chosenSuccessor.id);
                await supabase.from('stewards').update({ coup_readiness: 0 })
                    .eq('nation_id', nation.id).eq('is_alive', true);

                // Loyalty: new ruler -5, others -15
                const { data: factions } = await supabase.from('factions')
                    .select('id, loyalty').eq('nation_id', nation.id).eq('faction_type', 'party');
                for (const fac of (factions || [])) {
                    const drop = fac.id === chosenSuccessor.faction_id ? 5 : 15;
                    await supabase.from('factions').update({
                        loyalty: Math.max(0, (fac.loyalty ?? 50) - drop)
                    }).eq('id', fac.id);
                }

                // Generate replacement steward
                const stewardType = PILLAR_TO_STEWARD_TYPE[chosenSuccessor.pillar_key] || 'technocrat';
                await supabase.from('stewards').insert({
                    nation_id: nation.id, faction_id: chosenSuccessor.faction_id,
                    pillar_key: chosenSuccessor.pillar_key, steward_type: stewardType,
                    first_name: randFirst(), last_name: randLast(),
                    age: 40 + Math.floor(Math.random() * 16),
                    standing: 40, power_base: 30, true_loyalty: 50, estimated_loyalty: 55,
                    personal_wealth: 0, exit_readiness: 0, coup_readiness: 0,
                    is_alive: true, is_chosen_successor: false, succession_strength: 0,
                    created_at_tick: newTick,
                });

                await supabase.from('campaign_actions').insert({
                    party_id: chosenSuccessor.faction_id, nation_id: nation.id,
                    action_type: 'clean_succession', tick_performed: newTick,
                    result: { deceased_name: hosName, deceased_age: hosAge,
                        successor_name: successorName, successor_faction_id: chosenSuccessor.faction_id,
                        succession_strength: chosenSuccessor.succession_strength ?? 0, cause: 'natural_causes' },
                });
                return { type: 'clean_succession', deceased: hosName, deceasedAge: hosAge,
                    successor: successorName, successorAge: chosenSuccessor.age };

            } else if (nation.successor_is_family_member) {
                // === FAMILY MEMBER SUCCESSION ===
                console.log(`[LeaderAging] Family succession in ${nation.name}`);
                const famFirst = randFirst();
                const famLast = nation.head_of_state_last_name || 'Unknown';
                const famAge = 30 + Math.floor(Math.random() * 16);
                const famName = `${famFirst} ${famLast}`;

                await supabase.from('nations').update({
                    head_of_state_first_name: famFirst, head_of_state_last_name: famLast,
                    head_of_state_age: famAge,
                    successor_cooldown_end_tick: null, successor_is_family_member: false,
                }).eq('id', nation.id);
                nation.head_of_state_first_name = famFirst;
                nation.head_of_state_last_name = famLast;
                nation.head_of_state_age = famAge;

                await supabase.from('stewards').update({ coup_readiness: 0 })
                    .eq('nation_id', nation.id).eq('is_alive', true);

                const { data: factions } = await supabase.from('factions')
                    .select('id, loyalty').eq('nation_id', nation.id).eq('faction_type', 'party');
                for (const fac of (factions || [])) {
                    await supabase.from('factions').update({
                        loyalty: Math.max(0, (fac.loyalty ?? 50) - 5)
                    }).eq('id', fac.id);
                }

                await supabase.from('campaign_actions').insert({
                    party_id: nation.ruling_faction_id, nation_id: nation.id,
                    action_type: 'family_succession', tick_performed: newTick,
                    result: { deceased_name: hosName, deceased_age: hosAge,
                        successor_name: famName, is_family_member: true, cause: 'natural_causes' },
                });
                return { type: 'family_succession', deceased: hosName, deceasedAge: hosAge,
                    successor: famName, successorAge: famAge };

            } else {
                // === NO SUCCESSOR — random replacement ===
                const newFirst = randFirst();
                const newLast = randLast();
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
        }

        // ── Leader aging (every January — tick % 12 === 0) ──
        // All party leaders, stewards, and the strongman age 1 year.
        // The strongman also rolls health checks starting at age 70.
        console.log(`[LeaderAging] ${nation.name}: tick=${newTick}, tick%12=${newTick % 12}, isJanuary=${newTick % 12 === 0}`);
        if (newTick % 12 === 0) {
            try {
                const agingResults = [];

                // 1. Age all party faction leaders +1
                const { data: partyFactions } = await supabase
                    .from('factions')
                    .select('id, leader_age, leader_first_name, leader_last_name')
                    .eq('nation_id', nation.id)
                    .eq('faction_type', 'party')
                    .not('leader_age', 'is', null);

                if (partyFactions && partyFactions.length > 0) {
                    for (const f of partyFactions) {
                        const newAge = (f.leader_age || 40) + 1;
                        await supabase.from('factions')
                            .update({ leader_age: newAge })
                            .eq('id', f.id);
                        agingResults.push({
                            type: 'party_leader',
                            name: `${f.leader_first_name || '?'} ${f.leader_last_name || '?'}`,
                            factionId: f.id,
                            newAge
                        });
                    }
                }

                // 2. Age all living stewards +1 (autocracy)
                if (isAutocracy(nation)) {
                    const { data: livingStews } = await supabase
                        .from('stewards')
                        .select('id, age, first_name, last_name, faction_id')
                        .eq('nation_id', nation.id)
                        .eq('is_alive', true);

                    if (livingStews && livingStews.length > 0) {
                        for (const s of livingStews) {
                            const newAge = (s.age || 40) + 1;
                            await supabase.from('stewards')
                                .update({ age: newAge })
                                .eq('id', s.id);
                            agingResults.push({
                                type: 'steward',
                                name: `${s.first_name} ${s.last_name}`,
                                stewardId: s.id,
                                factionId: s.faction_id,
                                newAge
                            });
                        }
                    }

                    // 3. Age the strongman (head of state) +1 and roll health checks
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
