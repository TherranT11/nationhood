// @ts-nocheck
/**
 * Supabase Edge Function: advance-tick
 *
 * Server-side tick processor for Nationhood Alpha.
 * Called by pg_cron every minute — checks if next_tick_at has passed,
 * acquires a database lock, and processes the full game tick.
 *
 * AUTO-GENERATED — do not edit index.ts directly.
 * Game-logic source of truth lives in js/game/*.js (especially political-actions.js).
 * Source: js/game/*.js + supabase/functions/advance-tick/handler-template.ts
 * Regenerate with: node scripts/sync-edge-function.js
 */

import { createClient } from "npm:@supabase/supabase-js@2";

// AP DEPRECATED (Phase A): the accumulate_ap / deduct_ap preflight
// check has been removed. Both RPCs still exist in the database as
// SQL no-ops so any external caller stays green; nothing the tick
// processor does depends on them anymore.

// ===== GAME LOGIC (from js/game/*.js modules) =====

// __GAME_COMMON_JS__

// ===== END GAME LOGIC =====


// ===== TICK-ONLY HELPERS (edge-function-only — not in js/game/*.js modules) =====

// ==================== FACTION MOMENTUM HELPER ====================
// Thin wrapper around adjust_momentum RPC for use in tick-only code.
async function adjustFactionMomentum(supabase: any, factionId: string, nationId: string, delta: number, opts: any = {}) {
    if (!factionId || delta === 0) return;
    try {
        await supabase.rpc('adjust_momentum', {
            p_faction_id: factionId,
            p_delta: delta,
            p_label: opts.source || 'tick_effect',
            p_tick: opts.tick || 0
        });
    } catch (e: any) {
        console.warn(`[adjustFactionMomentum] Failed for ${factionId}: ${e.message}`);
    }
}

// SURPLUS/DEFICIT CONNECTORS — retired 2026-05.
// Original purpose: cascade budget surplus into nations.inflation +
// nations.currency_strength. Both target columns were dropped from
// the schema; the bond/print system was replaced by
// processNationDebtTick, and currency cascades through the trade
// subsystem now (fuel cost → import cost → trade balance →
// currency nudge). Function + call site removed in 20261202; see
// git history for the previous implementation.

// ==================== TARIFF → RELATIONS PENALTY ====================
// Nations with tariffs > 25% lose -0.5 relations/tick with ALL other nations (floor 10)

async function processTariffRelationsPenalty(supabase, nation) {
    const tariffRate = Number(nation.tariffs ?? 0);
    if (tariffRate <= 25) return;

    // Load all diplomatic relations for this nation
    const { data: relations } = await supabase
        .from('diplomatic_relations')
        .select('id, nation_a_id, nation_b_id, relation_score')
        .or(`nation_a_id.eq.${nation.id},nation_b_id.eq.${nation.id}`);

    if (!relations || relations.length === 0) return;

    const FLOOR = 10;
    const PENALTY = 0.5;

    for (const rel of relations) {
        const currentScore = Number(rel.relation_score ?? 50);
        if (currentScore <= FLOOR) continue;
        const newScore = Math.max(FLOOR, Math.round(currentScore - PENALTY));
        if (newScore !== currentScore) {
            const { error } = await supabase.from('diplomatic_relations')
                .update({ relation_score: newScore })
                .eq('id', rel.id);
            if (error) console.warn(`[TariffPenalty] Failed to update relation ${rel.id}:`, error.message);
        }
    }
}

// ==================== POPULATION GROWTH ====================
//
// Phase 9 dropped population_growth, emigration, academic_immigration,
// illegal_immigration, and eligible_voters from the schema. Population
// change is now driven directly off the alpha-23 `immigration` stat
// (0-100, baseline 50):
//
//   immigration = 0   →  −0.5% population per tick
//   immigration = 50  →  no change
//   immigration = 100 →  +0.5% population per tick
//
// Eligible voters is no longer stored — derived as population × 0.65
// at read time (elections.js getEligibleVoters).

async function processPopulationGrowth(supabase: any, nation: any) {
    const imm = Number(nation.immigration ?? 50);
    const monthlyRate = ((imm - 50) / 50) * 0.005;
    const population = Number(nation.population ?? 0);
    const popChange = Math.round(population * monthlyRate);
    if (popChange === 0) return null;

    const newPopulation = Math.max(0, population + popChange);
    const { error } = await supabase.from('nations')
        .update({ population: newPopulation })
        .eq('id', nation.id);
    if (error) {
        console.error(`[processPopulationGrowth] Update failed for ${nation.name}:`, error.message);
        return null;
    }
    nation.population = newPopulation;
    console.log(`[processPopulationGrowth] ${nation.name}: imm=${imm} pop_change=${popChange > 0 ? '+' : ''}${popChange}`);

    return { popChange, newPopulation };
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

    // Incumbent bias removed — incumbents already benefit from executive powers.
    // Previously: await adjustFactionMomentum(supabase, president.faction_id, nation.id, 1, { source: 'campaign:incumbent', tick: currentTick });

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

    // Crisis sunset (Phase 2): crisis_effects / crisis_triggers /
    // crisis_end_triggers audit passes removed. The modifier system
    // (modifier_effects / modifier_triggers / modifier_end_triggers)
    // already has its own stat-key validation pipeline.

    // Event effects
    const { data: eventEffects } = await supabase.from('event_effects').select('id, event_id, stat_key, target');
    for (const ee of (eventEffects || [])) {
        if (ee.target !== 'nation') continue;
        const resolved = normalizeNationStatKey(ee.stat_key);
        if (!resolved || !NATION_STAT_COLUMN_SET.has(resolved)) {
            invalid.push({ source: 'event_effect', id: ee.id, event_id: ee.event_id, bad_key: ee.stat_key });
        }
    }

    // Event triggers
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
        await adjustFactionMomentum(supabase, action.party_id, nationId, -round2(decayRate * 0.3), { source: 'purge:decay', tick: currentTick });

        const newRemaining = result.decay_ticks_remaining - 1;
        await supabase.from('campaign_actions')
            .update({ result: { ...result, decay_ticks_remaining: newRemaining } })
            .eq('id', action.id);
    }
}

// ==================== SOVEREIGN DEFAULT — TICK-ONLY HELPERS ====================

/**
 * Per-tick debt mechanics: update debt_service_burden based on the
 * debt-to-budget ratio. Credit-based gating was removed when the
 * `nations.credit` column was dropped in the alpha refactor, and the
 * Sovereign Debt Crisis trigger was sunsetted in Phase 2 (modifier
 * system replaces it).
 */
async function processSovereignDebtMechanics(supabase, nation, currentTick) {
    const ratio = getDebtToGDP(nation);
    if (!isFinite(ratio)) return null;

    const burden = calculateDebtServiceBurden(nation);

    const updates: any = {};
    const results: any = { nationId: nation.id, ratio, burden };

    // 1. Update debt_service_burden if changed
    const oldBurden = Number(nation.debt_service_burden ?? 0);
    if (Math.abs(burden - oldBurden) > 0.001) {
        updates.debt_service_burden = Math.round(burden * 1000) / 1000;
        results.burdenChanged = true;
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

    // Crisis sunset (Phase 2): programmatic Sovereign Debt Crisis
    // trigger removed. The debt-to-budget ratio still drives debt
    // service burden above. If you want the old "ratio >=
    // DEBT_CRISIS_MIN_RATIO → red flag" behavior back, configure a
    // modifier_template with a debt_service_burden / debt-ratio
    // trigger via modifieradmin.html.

    if (results.burdenChanged) {
        console.log(`[SovereignDebt] ${nation.name}: ratio=${(ratio * 100).toFixed(0)}% burden=${burden.toFixed(3)}`);
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

    // 5. Apply immediate stat penalties.
    // Integer rounding (was Math.round(x*10)/10 which produced .5
    // values that smallint columns reject — same trap d500f7b fixed
    // in processTargetBasedPolicies + the connection accumulator).
    const clamp = (val, delta) => Math.max(0, Math.min(100, Math.round(val + delta)));

    // Alpha Phase 9 dropped credit / currency_strength / foreign_investment /
    // international_reputation / interest_rates / inflation / trade_balance /
    // happiness columns from `nations`. SOVEREIGN_DEFAULT_CONFIG (see
    // js/game/sovereign-default.js:50-61) consolidates the legacy economic +
    // reputational damage onto the surviving canonical stats:
    //   FULL_DEFAULT_POWER_HIT             → global_image
    //   FULL_DEFAULT_INDUSTRY_HIT          → industry
    //   FULL_DEFAULT_COST_OF_LIVING_SPIKE  → cost_of_living
    //   FULL_DEFAULT_SOL_HIT               → standard_of_living
    //   FULL_DEFAULT_UNREST_SPIKE          → unrest
    //   FULL_DEFAULT_GOV_APPROVAL_HIT      → public_approval
    // Bloc-level approval hits (worker / nationalist) are applied elsewhere,
    // not in nationUpdates.
    const nationUpdates: any = {
        debt: debtAfter,
        last_default_tick: currentTick,
        global_image:       clamp(Number(nation.global_image       ?? 50), cfg.FULL_DEFAULT_POWER_HIT            * discountedMultiplier),
        industry:           clamp(Number(nation.industry           ?? 50), cfg.FULL_DEFAULT_INDUSTRY_HIT         * multiplier),
        cost_of_living:     clamp(Number(nation.cost_of_living     ?? 50), cfg.FULL_DEFAULT_COST_OF_LIVING_SPIKE * multiplier),
        standard_of_living: clamp(Number(nation.standard_of_living ?? 50), cfg.FULL_DEFAULT_SOL_HIT              * multiplier),
        unrest:             clamp(Number(nation.unrest             ?? 50), cfg.FULL_DEFAULT_UNREST_SPIKE         * multiplier),
        public_approval:    clamp(Number(nation.public_approval    ?? 50), cfg.FULL_DEFAULT_GOV_APPROVAL_HIT     * multiplier),
    };

    // Re-derive debt_service_burden from the new debt value. Credit
    // lockout was tied to the dropped credit column — removed.
    nationUpdates.debt_service_burden = (() => {
        const gdp = Number(nation.gdp ?? 0);
        if (gdp <= 0 || debtAfter <= 0) return 0;
        const newRatio = debtAfter / gdp;
        if (newRatio <= cfg.BURDEN_THRESHOLD) return 0;
        return Math.round(Math.min(cfg.BURDEN_MAX, (newRatio - cfg.BURDEN_THRESHOLD) * cfg.BURDEN_SCALE) * 1000) / 1000;
    })();

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

    // Crisis sunset (Phase 2): Sovereign Default Crisis insert into
    // active_crises removed. The default itself is still recorded in
    // default_history and last_default_tick, and the event log entry
    // below still fires. For the recurring "this nation just defaulted"
    // characterization, create a modifier_template keyed off
    // last_default_tick via modifieradmin.html.

    // Event log
    await supabase.from('event_log').insert({
        nation_id: nation.id,
        event_name: 'CRISIS_STARTED: Sovereign Default',
        description_used: `${nation.name} has ${resolution.default_type === 'full' ? 'fully defaulted on' : 'partially restructured'} its sovereign debt. International markets react with alarm.`,
        category: 'crisis',
        effects_applied: [],
        fired_at_tick: currentTick
    });

    // Phase 10A: sovereign-default contagion removed. The trade_partners
    // table is dropped, and the `credit` column (Phase 9) is gone too.
    // Reintroduce when the goods-trade rebuild lands and a credit-like
    // signal exists again.
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
        .select('id, name')
        .eq('id', bill.nation_id)
        .single();
    if (!nation) return;

    // 3. Apply failure consequences. The market-shock columns
    //    (currency_strength, foreign_investment, international_reputation)
    //    were retired in alpha-19 — currency_strength + international_reputation
    //    consolidated into `power`, foreign_investment dropped. The PM
    //    approval hit + audit log are still meaningful and stay.
    //    TODO: re-introduce a market-shock effect via `power` once the
    //    sovereign-default penalty curve is redesigned for the new
    //    schema.
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
        description_used: `Parliament rejected the sovereign default resolution. The government's credibility has taken a hit.`,
        category: 'economy',
        effects_applied: [
            { stat: 'gov_approval', change: cfg.FAILURE_PM_APPROVAL_HIT }
        ],
        fired_at_tick: currentTick
    });

    console.log(`[handleFailedDefaultResolution] ${nation.name}: resolution failed`);
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


// ==================== IPO VOTE EFFECT HELPER ====================

// IPO economy is denominated in cash (faction.party_funds). 1 AP = $50,000.
const IPO_AP_TO_CASH = 50000;

/**
 * Format a dollar amount the same way the topbar does ($X.YM / $Xk / $X).
 * Used in IPO chat messages so members see consistent currency formatting.
 */
function fmtIPOCash(val: number): string {
    val = Number(val) || 0;
    if (val >= 1000000) return '$' + (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000)    return '$' + Math.round(val / 1000) + 'k';
    return '$' + val;
}

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

            const factionsToAdmit = [{ id: meta.target_faction_id, name: meta.target_faction_name }];

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
                const currentBalance = Number(org.solidarity_fund_balance) || 0;
                const actualDraw = Math.min(meta.amount_requested, currentBalance);
                if (actualDraw <= 0) break;

                const newBalance = currentBalance - actualDraw;
                await supabase.from('international_orgs')
                    .update({ solidarity_fund_balance: newBalance })
                    .eq('id', org.id);

                // Credit cash to the proposing faction
                if (vote.proposed_by) {
                    const { data: proposer } = await supabase
                        .from('factions').select('party_funds').eq('id', vote.proposed_by).maybeSingle();
                    if (proposer) {
                        await supabase.from('factions')
                            .update({ party_funds: (Number(proposer.party_funds) || 0) + actualDraw })
                            .eq('id', vote.proposed_by);
                    }
                }

                await supabase.from('ipo_fund_transactions').insert({
                    org_id: org.id,
                    faction_id: vote.proposed_by,
                    transaction_type: 'draw',
                    amount: -actualDraw,
                    description: meta.purpose || 'Fund draw (vote passed)',
                    tick: tick
                });

                await supabase.from('ipo_chat').insert({
                    org_id: org.id, faction_id: null, is_system: true,
                    message_text: `Fund draw approved: ${fmtIPOCash(actualDraw)} withdrawn. ${meta.purpose ? 'Purpose: ' + meta.purpose : ''}`,
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
        case 'change_logo': {
            const proposedLogo = meta.proposed_logo;
            if (proposedLogo) {
                const logoUpdate: Record<string, unknown> = {};
                if (proposedLogo.symbol !== undefined) logoUpdate.logo_symbol = proposedLogo.symbol;
                if (proposedLogo.text !== undefined) logoUpdate.logo_text = proposedLogo.text;
                if (proposedLogo.image_url !== undefined) logoUpdate.logo_image_url = proposedLogo.image_url;
                if (Object.keys(logoUpdate).length > 0) {
                    await supabase.from('international_orgs').update(logoUpdate).eq('id', org.id);
                }
            }
            await supabase.from('ipo_chat').insert({
                org_id: org.id, faction_id: null, is_system: true,
                message_text: 'Logo change approved and applied.',
                tick_posted: tick
            });
            await supabase.from('ipo_action_log').insert({
                org_id: org.id, faction_id: vote.proposed_by,
                action_type: 'change_logo',
                action_data: { proposed_logo: proposedLogo },
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

    const summary = {
        tick: newTick,
        nations: nationList.length,
        effects: [],
        costs: [],
        resolutions: [],
        events: [],
        apFailures: []
    };

    // AP DEPRECATED (Phase A of removal): the per-tick AP accumulation
    // pass is disabled. The fields stay on `summary` so any downstream
    // log readers still see the shape they expect; both counts are
    // permanently zero.
    summary.apDistributed = 0;
    summary.apFailed = 0;

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

    // 3.5f Recurring transfer execution — pay every `transfer` article where
    // data.transfer_type === 'recurring' once per tick. One-time transfers are
    // executed at ratification (see resolveTradeRatificationBill); this loop
    // only fires the recurring kind. Idempotent within a tick via
    // data.last_paid_at_tick so re-runs (or partial-progress retries) don't
    // double-pay.
    try {
        const { data: activeAgreements } = await supabase
            .from('trade_agreements')
            .select('id, nation_a_id, nation_b_id, articles, expires_at_tick')
            .eq('status', 'active');

        for (const agreement of (activeAgreements || [])) {
            // Skip already-expired (3.6 below will mark them; don't pre-pay them this tick).
            if (agreement.expires_at_tick != null && agreement.expires_at_tick <= newTick) continue;

            const arts = agreement.articles || [];
            let mutated = false;

            for (const art of arts) {
                const d = art?.data || {};
                // Caller-side filters: only recurring, only not-yet-paid this tick.
                if (d.transfer_type !== 'recurring') continue;
                if (d.last_paid_at_tick === newTick) continue;
                // Endpoint resolution is shared across callsites
                // (see js/game/diplomacy-constants.js → resolveTransferEndpoints).
                const endpoints = resolveTransferEndpoints(art, agreement);
                if (!endpoints) {
                    if (art?.type === 'transfer' || art?.article_type === 'transfer') {
                        console.error('[recurring transfer] transfer article malformed on agreement', agreement.id);
                    }
                    continue;
                }
                const { fromNation, toNation, amount } = endpoints;

                // Atomic per-pair: read budget+debt, debit treasury (floor 0)
                // with shortfall absorbed as debt, credit receiver in full.
                // Skip on read failure — without correct baselines the UPDATEs
                // below would overwrite values with garbage.
                //
                // Unit boundary: nation.budget and nation.debt are abstract
                // integers (1 = $1M raw). `amount` is raw dollars. Bridge
                // via RAW_PER_ABSTRACT (declared in budget.js earlier in
                // the bundle) so comparisons land in raw and the shortfall
                // lands in the abstract debt column.
                const { data: rows, error: readErr } = await supabase.from('nations')
                    .select('id, budget, debt')
                    .in('id', [fromNation, toNation]);
                if (readErr || !rows || rows.length < 2) {
                    console.error('[recurring transfer] treasury read failed/incomplete; skipping agreement',
                        agreement.id, readErr?.message || `got ${rows?.length || 0}/2 rows`);
                    continue;
                }
                const budgets: Record<string, number> = {};   // abstract
                const debts: Record<string, number> = {};     // abstract
                for (const r of rows) {
                    budgets[r.id] = Number(r.budget || 0);
                    debts[r.id]   = Number(r.debt   || 0);
                }
                const fromBudgetRaw = (budgets[fromNation] ?? 0) * RAW_PER_ABSTRACT;
                const fromAfter     = Math.max(0, fromBudgetRaw - amount) / RAW_PER_ABSTRACT;
                const shortfall     = Math.max(0, amount - fromBudgetRaw);
                const toAfter       = (budgets[toNation] ?? 0) + (amount / RAW_PER_ABSTRACT);
                const fromDebtAfter = (debts[fromNation] ?? 0) + (shortfall / RAW_PER_ABSTRACT);

                const { error: fromErr } = await supabase.from('nations')
                    .update({ budget: fromAfter, debt: fromDebtAfter }).eq('id', fromNation);
                if (fromErr) {
                    console.error('[recurring transfer] debit failed for', fromNation, fromErr.message);
                    continue;
                }
                const { error: toErr } = await supabase.from('nations')
                    .update({ budget: toAfter }).eq('id', toNation);
                if (toErr) {
                    console.error('[recurring transfer] credit failed for', toNation, toErr.message);
                    // Best-effort rollback so sender doesn't eat the debt without receiver getting paid.
                    await supabase.from('nations').update({
                        budget: budgets[fromNation] ?? 0,
                        debt:   debts[fromNation]   ?? 0
                    }).eq('id', fromNation);
                    continue;
                }

                art.data = { ...d, last_paid_at_tick: newTick };
                mutated = true;
                console.log(`[recurring transfer] paid: ${fromNation} → ${toNation}, $${(amount/1e9).toFixed(2)}B (debt portion: $${(shortfall/1e9).toFixed(2)}B, agreement ${agreement.id})`);
            }

            if (mutated) {
                // If this update fails AFTER money moved, last_paid_at_tick won't
                // land and next tick will re-process the same articles → DOUBLE-PAY.
                // Surface loudly so it's visible in logs.
                const { error: markErr } = await supabase.from('trade_agreements')
                    .update({ articles: arts }).eq('id', agreement.id);
                if (markErr) {
                    console.error('[recurring transfer] FAILED to mark articles paid for agreement',
                        agreement.id, markErr.message,
                        "— money moved but mark didn't; next tick may double-pay");
                }
            }
        }
    } catch (rtErr) {
        console.error('[advanceTick] Recurring transfer execution failed (non-fatal):', rtErr);
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

    // 3.6c Auto-accept any Petition for Reform whose 3-tick deadline has
    // elapsed without a monarch decision. Runs every tick — the RPC is a
    // no-op when there's nothing due, and SKIP LOCKED keeps it safe
    // against concurrent monarch responses.
    try {
        const { data: petitionResult, error: petitionErr } =
            await supabase.rpc('process_expired_petitions', { p_tick: newTick });
        if (petitionErr) {
            console.error('[advanceTick] process_expired_petitions failed:', petitionErr.message);
        } else if (petitionResult?.processed > 0) {
            summary.autoAcceptedPetitions = petitionResult.processed;
            console.log(`[advanceTick] Auto-accepted ${petitionResult.processed} petition(s)`);
        }
    } catch (petErr) {
        console.error('[advanceTick] Petition auto-accept failed (non-fatal):', petErr);
    }

    // 3.6d Auto-reject any entrepreneur Board-Join request whose 3-tick
    // deadline has elapsed (20270160 corp_board_voting). The RPC is a
    // no-op when nothing is due and writes per-row with FOR UPDATE, so
    // it's safe against concurrent corp_board_vote calls.
    try {
        const { data: boardExpiry, error: boardErr } =
            await supabase.rpc('finalize_expired_board_requests', { p_tick: newTick });
        if (boardErr) {
            console.error('[advanceTick] finalize_expired_board_requests failed:', boardErr.message);
        } else if (boardExpiry?.rejected > 0) {
            summary.autoRejectedBoardRequests = boardExpiry.rejected;
            console.log(`[advanceTick] Auto-rejected ${boardExpiry.rejected} board-join request(s)`);
        }
    } catch (brErr) {
        console.error('[advanceTick] Board-request auto-reject failed (non-fatal):', brErr);
    }

    // 3.6e Complete any Construction-corp building project whose
    // completes_at_tick has elapsed (20270165 corp_buildings). Flips
    // status to 'completed' and applies +0.2 GDP_Growth to the host
    // nation one-time per row. Idempotent (gdp_growth_applied flag),
    // safe against concurrent begin_construction calls (per-row
    // FOR UPDATE in the RPC).
    try {
        const { data: bldgComplete, error: bldgErr } =
            await supabase.rpc('complete_finished_buildings', { p_tick: newTick });
        if (bldgErr) {
            console.error('[advanceTick] complete_finished_buildings failed:', bldgErr.message);
        } else if (bldgComplete?.completed > 0) {
            summary.completedBuildings = bldgComplete.completed;
            console.log(`[advanceTick] Completed ${bldgComplete.completed} building project(s)`);
        }
    } catch (bcErr) {
        console.error('[advanceTick] Building completion failed (non-fatal):', bcErr);
    }

    // 3.6f Service corp loans (20270174). Expires pending loan
    // requests past their deadline; debits per-tick payment from
    // every active loan's borrower faction and credits the lender.
    // Single missed payment defaults the loan (locked v0 design).
    // Idempotent — last_payment_tick gate prevents double-billing.
    try {
        const { data: loanResult, error: loanErr } =
            await supabase.rpc('process_corp_loans', { p_tick: newTick });
        if (loanErr) {
            console.error('[advanceTick] process_corp_loans failed:', loanErr.message);
        } else if (loanResult && (loanResult.paid > 0 || loanResult.expired > 0 || loanResult.repaid > 0 || loanResult.defaulted > 0)) {
            summary.corpLoansPaid      = loanResult.paid;
            summary.corpLoansRepaid    = loanResult.repaid;
            summary.corpLoansDefaulted = loanResult.defaulted;
            summary.corpLoanRequestsExpired = loanResult.expired;
            console.log(`[advanceTick] Corp loans: ${loanResult.paid} paid, ${loanResult.repaid} repaid, ${loanResult.defaulted} defaulted, ${loanResult.expired} expired`);
        }
    } catch (clErr) {
        console.error('[advanceTick] Corp loans service failed (non-fatal):', clErr);
    }

    // Entrepreneur aviation R&D: advance each researching design one tick,
    // $1M/tick from the corp treasury; flips to 'available' on completion,
    // pauses (no charge/progress) if the corp can't pay (20270221).
    try {
        const { data: rdResult, error: rdErr } =
            await supabase.rpc('process_ent_aircraft_designs', { p_tick: newTick });
        if (rdErr) {
            console.error('[advanceTick] process_ent_aircraft_designs failed:', rdErr.message);
        } else if (rdResult && (rdResult.advanced > 0 || rdResult.completed > 0)) {
            summary.aircraftDesignsAdvanced  = rdResult.advanced;
            summary.aircraftDesignsCompleted = rdResult.completed;
            console.log(`[advanceTick] Aviation R&D: ${rdResult.advanced} advanced, ${rdResult.completed} completed, ${rdResult.paused} paused`);
        }
    } catch (rdErr) {
        console.error('[advanceTick] Aviation R&D service failed (non-fatal):', rdErr);
    }

    // Entrepreneur construction contracts (20270216 + 20270225): award the
    // lowest in-capacity bid at the deadline, advance active builds, and on
    // completion deliver the finished building to the requester (settling the
    // bid + cost atomically). Idempotent via per-contract status.
    try {
        const { data: ccResult, error: ccErr } =
            await supabase.rpc('process_ent_construction_contracts', { p_tick: newTick });
        if (ccErr) {
            console.error('[advanceTick] process_ent_construction_contracts failed:', ccErr.message);
        } else if (ccResult && (ccResult.awarded > 0 || ccResult.completed > 0 || ccResult.cancelled > 0 || ccResult.failed > 0)) {
            summary.constructionContracts = ccResult;
            console.log(`[advanceTick] Construction contracts: ${ccResult.awarded} awarded, ${ccResult.completed} completed, ${ccResult.cancelled} cancelled, ${ccResult.failed} failed`);
        }
    } catch (ccErr) {
        console.error('[advanceTick] Construction contracts service failed (non-fatal):', ccErr);
    }

    // Aircraft production runs (20270234): each active run burns cost_per_tick
    // and delivers finished units into the design's inventory_on_hand. Runs
    // BEFORE the RFP processor so stock produced this tick can fulfil an RFP
    // the same tick.
    try {
        const { data: prResult, error: prErr } =
            await supabase.rpc('process_ent_production_runs', { p_tick: newTick });
        if (prErr) {
            console.error('[advanceTick] process_ent_production_runs failed:', prErr.message);
        } else if (prResult && (prResult.delivered > 0 || prResult.completed > 0 || prResult.advanced > 0 || prResult.paused > 0)) {
            summary.aircraftProduction = prResult;
            console.log(`[advanceTick] Aircraft production: ${prResult.delivered} units delivered, ${prResult.advanced} advanced, ${prResult.completed} completed, ${prResult.paused} paused`);
        }
    } catch (prErr) {
        console.error('[advanceTick] Aircraft production service failed (non-fatal):', prErr);
    }

    // Trial turn timeouts (20270589): auto-flip current_turn on
    // in-progress trials where the side on the clock has been idle for
    // ≥ 4 ticks. Mirrors end_turn's flip logic; round-4 defendant
    // timeout closes the trial via _close_trial_at_round_four. Excludes
    // objection-pending and awaiting-verdict trials (the modal locks
    // the clock there anyway).
    try {
        const { data: ttResult, error: ttErr } =
            await supabase.rpc('process_trial_turn_timeouts', { p_tick: newTick });
        if (ttErr) {
            console.error('[advanceTick] process_trial_turn_timeouts failed:', ttErr.message);
        } else if (ttResult && (ttResult.flipped > 0 || ttResult.closed > 0)) {
            summary.trialTurnTimeouts = ttResult;
            console.log(`[advanceTick] Trial turn timeouts: ${ttResult.flipped} flipped, ${ttResult.closed} closed`);
        }
    } catch (ttErr) {
        console.error('[advanceTick] Trial turn timeouts service failed (non-fatal):', ttErr);
    }

    // Aircraft RFPs (20270229): award the lowest-price bid at the deadline,
    // advance build-to-order, and on completion deliver the aircraft to the
    // airline (settling the order + production cost atomically).
    try {
        const { data: arResult, error: arErr } =
            await supabase.rpc('process_ent_aircraft_rfps', { p_tick: newTick });
        if (arErr) {
            console.error('[advanceTick] process_ent_aircraft_rfps failed:', arErr.message);
        } else if (arResult && (arResult.awarded > 0 || arResult.completed > 0 || arResult.cancelled > 0 || arResult.failed > 0)) {
            summary.aircraftRfps = arResult;
            console.log(`[advanceTick] Aircraft RFPs: ${arResult.awarded} awarded, ${arResult.completed} completed, ${arResult.cancelled} cancelled, ${arResult.failed} failed`);
        }
    } catch (arErr) {
        console.error('[advanceTick] Aircraft RFP service failed (non-fatal):', arErr);
    }

    // 3.6g Corp share-price history anchors (20270179). Inserts one
    // no-op row per public corp into corp_share_price_history with
    // source='tick' so the sparkline always has time-axis datapoints
    // between trades. No money moves. Idempotent within a tick.
    try {
        const { data: anchorResult, error: anchorErr } =
            await supabase.rpc('process_corp_price_anchors', { p_tick: newTick });
        if (anchorErr) {
            console.error('[advanceTick] process_corp_price_anchors failed:', anchorErr.message);
        } else if (anchorResult && anchorResult.written > 0) {
            console.log(`[advanceTick] Corp price anchors: ${anchorResult.written} public corps anchored at T${anchorResult.tick}`);
        }
    } catch (anchorErr) {
        console.error('[advanceTick] Corp price anchors service failed (non-fatal):', anchorErr);
    }

    // 3.6h Politician age-year Experience awards (20270672). +1 Skill
    // (displayed as Experience) for every active-career/affiliation
    // politician whose age ticked over a year on this tick. SQL
    // function handles the eligibility filter + idempotency via
    // politician_career_events; we just kick it off here.
    try {
        const { data: ageAwardResult, error: ageAwardErr } =
            await supabase.rpc('process_politician_age_year_experience', { p_tick: newTick });
        if (ageAwardErr) {
            console.error('[advanceTick] process_politician_age_year_experience failed:', ageAwardErr.message);
        } else if (ageAwardResult && ageAwardResult.awarded > 0) {
            console.log(`[advanceTick] Politician age-year Experience: ${ageAwardResult.awarded} awards at T${ageAwardResult.tick}`);
        }
    } catch (ageAwardErr) {
        console.error('[advanceTick] Politician age-year Experience service failed (non-fatal):', ageAwardErr);
    }

    // 3.6i Committee NPC-chair agenda promotion (20270682). For every
    // committee whose chair seat is NPC-held AND has no active
    // proposal, promote the oldest queued proposal to active. Player
    // chairs control their own agenda via committee_set_active_
    // proposal; this is the auto-advance for NPC-chaired committees.
    try {
        const { data: agendaResult, error: agendaErr } =
            await supabase.rpc('process_committee_npc_chair_agenda', { p_tick: newTick });
        if (agendaErr) {
            console.error('[advanceTick] process_committee_npc_chair_agenda failed:', agendaErr.message);
        } else if (agendaResult && agendaResult.promoted > 0) {
            console.log(`[advanceTick] Committee NPC-chair agenda: ${agendaResult.promoted} proposals promoted at T${agendaResult.tick}`);
        }
    } catch (agendaErr) {
        console.error('[advanceTick] Committee NPC-chair agenda service failed (non-fatal):', agendaErr);
    }

    // 3.6b Safety net: catch economic aid agreements missing their aid_agreement_state row
    // Runs every 5 ticks to reduce CPU load — orphaned rows are rare, no urgency
    if (newTick % 5 === 0) try {
        const { data: orphanedAid } = await supabase
            .from('trade_agreements')
            .select('id, nation_a_id, nation_b_id, articles, enacted_at_tick')
            .eq('agreement_type', 'economic_aid')
            .eq('status', 'active');

        if (orphanedAid && orphanedAid.length > 0) {
            for (const ta of orphanedAid) {
                // Check if aid_agreement_state exists for this agreement
                const { data: existing } = await supabase
                    .from('aid_agreement_state')
                    .select('agreement_id')
                    .eq('agreement_id', ta.id)
                    .maybeSingle();

                if (!existing) {
                    // Missing — reconstruct from articles
                    const aidArt = (ta.articles || []).find((a: any) => a.type === 'aid_terms');
                    if (aidArt?.data?.donor_nation_id && aidArt?.data?.annual_amount) {
                        const donorId = aidArt.data.donor_nation_id;
                        const recipientId = donorId === ta.nation_a_id ? ta.nation_b_id : ta.nation_a_id;
                        const annualAmount = Number(aidArt.data.annual_amount);
                        const { error: fixErr } = await supabase.from('aid_agreement_state').insert({
                            agreement_id: ta.id,
                            donor_nation_id: donorId,
                            recipient_nation_id: recipientId,
                            current_annual_amount: annualAmount,
                            original_annual_amount: annualAmount,
                            next_review_tick: newTick + 12,
                            condition_failures: {}
                        });
                        if (fixErr) {
                            console.error(`[advanceTick] Failed to create orphaned aid_agreement_state for ${ta.id}:`, fixErr.message);
                        } else {
                            console.log(`[advanceTick] Safety net: created missing aid_agreement_state for agreement ${ta.id} (donor=${donorId}, $${(annualAmount/1e9).toFixed(1)}B/yr)`);
                        }
                    }
                }
            }
        }
    } catch (aidFixErr) {
        console.error('[advanceTick] Aid agreement safety net failed (non-fatal):', aidFixErr);
    }

    // 3.7 Diplomatic relations decay — all relation scores drift toward 0 (neutral)
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
                newScore = Math.round(newScore);

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

    // Per-commodity trading volumes — computed once per tick so the
    // per-nation processCommodityDemandEffects call doesn't refetch
    // shipping_contracts + bids + agreements per nation. Map<nation_id,
    // {energy, minerals, food, consumer_goods, luxury_goods}> where each
    // value is signed units/tick (+ = net imports, − = net exports).
    let _commodityTradingByNation = new Map();
    try {
        _commodityTradingByNation = await computeCommodityTradingByNation(supabase);
    } catch (etErr) {
        console.error('[advanceTick] Commodity trading prefetch failed (non-fatal):', etErr);
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

        // Army Composition: materialize the army's manpower share onto the
        // army faction (Σ active-law manpower_pct × population × 70%).
        try {
            await processArmyManpower(supabase, nation);
        } catch (manpowerErr) {
            console.error(`[advanceTick] Army manpower failed for ${nation.name} (non-fatal):`, manpowerErr);
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

        // Energy ministry: process oil reserve build cycles
        try {
            const energyResult = await processEnergyOilBuildCycles(supabase, nation, newTick);
            if (energyResult.processed > 0) {
                summary.energyOil = summary.energyOil || [];
                summary.energyOil.push({ nation: nation.name, ...energyResult });
            }
        } catch (energyErr) {
            console.error(`[advanceTick] Energy oil build failed for ${nation.name} (non-fatal):`, energyErr);
        }

        // Apply GDP growth rate
        try {
            await applyGdpGrowth(supabase, nation, newTick);
        } catch (gdpErr) {
            console.error(`[advanceTick] GDP growth failed for ${nation.name} (non-fatal):`, gdpErr);
        }

        // Stat decay (equilibrium drift + erosion). Policies can raise/lower
        // the per-stat decay target via stat_effects floor/ceiling.
        try {
            const policyDecayAdj = await buildPolicyDecayAdjustments(supabase, nation.id);
            const decayResults = await processStatDecay(supabase, nation, policyDecayAdj, newTick);
            if (decayResults.length > 0) {
                summary.decay = summary.decay || [];
                summary.decay.push({ nation: nation.name, effects: decayResults });
            }
        } catch (decayErr) {
            console.error(`[advanceTick] Stat decay failed for ${nation.name} (non-fatal):`, decayErr);
        }

        // National Vola Culture: 3% multiplicative decay toward 0 (Sports subtab)
        try {
            await processVolaCultureDecay(supabase, nation);
        } catch (volaErr) {
            console.error(`[advanceTick] Vola culture decay failed for ${nation.name} (non-fatal):`, volaErr);
        }

        // Commodity demand-met effects (per-tick stat deltas across
        // every stat-derived commodity — Energy + Minerals today).
        // Single merged update per nation so two commodities nudging
        // the same column (e.g. industry under Energy + Minerals)
        // sum cleanly rather than overwriting.
        try {
            const commodityDemandRes = await processCommodityDemandEffects(supabase, nation, _commodityTradingByNation);
            if (commodityDemandRes) {
                summary.commodityDemand = summary.commodityDemand || [];
                summary.commodityDemand.push({ nation: nation.name, ...commodityDemandRes });
            }
        } catch (cdErr) {
            console.error(`[advanceTick] Commodity demand effects failed for ${nation.name} (non-fatal):`, cdErr);
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

        // Target-based policies — per-tick weighted-equilibrium pull on
        // stats + additive sector rapport on the proposing faction. Runs
        // AFTER decay / commodities / connections so the convergence
        // step uses the post-settled stat as its starting point. Skipped
        // silently if no active_laws on this nation are target-based.
        // Implementation lives in js/game/policies.js.
        try {
            const tbResult = await processTargetBasedPolicies(supabase, nation);
            if (tbResult.stats.length > 0) {
                summary.targetBasedPolicies = summary.targetBasedPolicies || [];
                summary.targetBasedPolicies.push({ nation: nation.name, ...tbResult });
            }
        } catch (tbErr) {
            console.error(`[advanceTick] Target-based policies failed for ${nation.name} (non-fatal):`, tbErr);
        }

        // Ongoing costs (tracking only — accumulated per-policy, does not modify debt)
        try {
            const costResult = await processOngoingCosts(supabase, nation, newTick);
            if (costResult.totalCost !== 0) summary.costs.push({ nation: nation.name, ...costResult });
        } catch (costErr) {
            console.error(`[advanceTick] Ongoing costs failed for ${nation.name} (non-fatal):`, costErr);
        }

        // Budget deficit handler retired (commit 04d91e3) — replaced by
        // processNationDebtTick further down. Kept this comment so the
        // deletion is discoverable in git blame instead of looking like
        // a missing call site.

        // Sovereign debt mechanics (debt service burden updates only —
        // crisis trigger sunsetted in Phase 2; credit deterioration was
        // dropped earlier when the credit column was deleted).
        try {
            const debtResult = await processSovereignDebtMechanics(supabase, nation, newTick);
            if (debtResult && debtResult.burdenChanged) {
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

        // Base momentum decay — 8% per tick, applied to all party factions.
        // Parties with a custom_logo_url receive a +1/tick bonus (advertised in
        // the Set Party Logo modal as "Current logo active — +1 Momentum/tick").
        // Net per tick = -(8% of current) + (1 if logo else 0), then floored at 1
        // and capped at 100.
        //
        // Single direct update per faction (no RPC overhead, no momentum_log append).
        // Decay entries would flood the 50-entry log — players see 'base_decay' in
        // the tooltip anyway. This saves N RPC calls (each RPC = 2 queries internally).
        try {
            const { data: decayFactions } = await supabase
                .from('factions')
                .select('id, momentum, custom_logo_url')
                .eq('nation_id', nation.id)
                .eq('faction_type', 'party')
                .gt('momentum', 0);

            for (const f of (decayFactions || [])) {
                const oldMom = Number(f.momentum) || 0;
                const decay = Math.max(0.5, Math.round(oldMom * 0.08 * 100) / 100);
                const logoBonus = f.custom_logo_url ? 1 : 0;
                const newMom = Math.min(100, Math.max(1, Math.round((oldMom - decay + logoBonus) * 100) / 100));
                await supabase.from('factions')
                    .update({ momentum: newMom })
                    .eq('id', f.id);
            }
        } catch (momDecayErr) {
            console.error(`[advanceTick] Momentum decay failed for ${nation.name} (non-fatal):`, momDecayErr);
        }

        // Passive income: $1k per seat per tick for all parties
        try {
            const { data: incomeFactions } = await supabase
                .from('factions')
                .select('id, seats, party_funds')
                .eq('nation_id', nation.id)
                .eq('faction_type', 'party')
                .gt('seats', 0);

            for (const f of (incomeFactions || [])) {
                const seats = Number(f.seats) || 0;
                const income = seats * 1000; // $1k per seat
                const newFunds = (Number(f.party_funds) || 0) + income;
                await supabase.from('factions')
                    .update({ party_funds: newFunds })
                    .eq('id', f.id);
            }
        } catch (incomeErr) {
            console.error(`[advanceTick] Passive income failed for ${nation.name} (non-fatal):`, incomeErr);
        }

        // Absolute Monarchy: legitimacy decay/growth based on seat concentration
        if ((nation.government_type || '').toLowerCase().includes('monarchy') && nation.monarch_faction_id) {
            try {
                const { data: monarchFaction } = await supabase.from('factions').select('seats').eq('id', nation.monarch_faction_id).single();
                const monarchSeats = monarchFaction?.seats || 0;
                const totalNationSeats = nation.total_seats || 100;
                const seatPct = totalNationSeats > 0 ? monarchSeats / totalNationSeats : 1;
                const currentLeg = Number(nation.legitimacy) || 50;
                let legChange = 0;

                if (seatPct > 0.7) {
                    legChange = -1; // Tyranny decay
                } else if (seatPct < 0.5) {
                    legChange = 0.5; // Balanced governance bonus
                }

                if (legChange !== 0) {
                    const newLeg = Math.max(0, Math.min(100, currentLeg + legChange));
                    await supabase.from('nations').update({ legitimacy: newLeg }).eq('id', nation.id);
                }
            } catch (legErr) {
                console.error(`[advanceTick] Monarchy legitimacy check failed for ${nation.name} (non-fatal):`, legErr);
            }
        }

        // Timed momentum effects (e.g. State Media Control +2 momentum/tick for governing parties)
        try {
            const effects = Array.isArray(nation.timed_momentum_effects) ? nation.timed_momentum_effects : [];
            if (effects.length > 0) {
                // Decrement remaining_ticks FIRST to prevent double-fire if RPC calls fail
                const updated = effects
                    .map(e => ({ ...e, remaining_ticks: e.remaining_ticks - 1 }))
                    .filter(e => e.remaining_ticks >= 0);
                const afterCleanup = updated.filter(e => e.remaining_ticks > 0);
                await supabase.from('nations').update({ timed_momentum_effects: afterCleanup }).eq('id', nation.id);
                nation.timed_momentum_effects = afterCleanup;

                // Now apply momentum boosts for this tick (using pre-decrement values)
                for (const eff of effects) {
                    if (eff.remaining_ticks > 0 && Array.isArray(eff.party_ids)) {
                        for (const partyId of eff.party_ids) {
                            await supabase.rpc('adjust_momentum', {
                                p_faction_id: partyId,
                                p_delta: eff.delta_per_tick,
                                p_label: eff.source || 'timed_effect',
                                p_tick: newTick
                            });
                        }
                    }
                }
            }
        } catch (timedMomErr) {
            console.error(`[advanceTick] Timed momentum effects failed for ${nation.name} (non-fatal):`, timedMomErr);
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
                const { data: activeAdmin } = await supabase.from('administrations')
                    .select('id').eq('nation_id', nation.id).is('ended_at_tick', null).limit(1).maybeSingle();
                if (!activeAdmin) {
                    const { data: hog } = await supabase.from('head_of_government')
                        .select('first_name, last_name, faction_id, appointed_tick')
                        .eq('nation_id', nation.id).eq('active', true).maybeSingle();
                    if (hog) {
                        const { data: shardDate } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
                        // Snapshot current nation stats so governance score has a baseline
                        // (previously missing — caused stats_at_start to be null/empty, making
                        // governance deltas calculate against 0 instead of actual starting values)
                        const safetyNetStats = snapshotNationStats(nation);
                        await supabase.from('administrations').insert({
                            nation_id: nation.id,
                            admin_name: (hog.last_name || 'Interim') + ' Administration',
                            head_of_state: (hog.first_name || '') + ' ' + (hog.last_name || ''),
                            government_type: nation.government_type || 'Parliamentary Democracy',
                            started_at_tick: hog.appointed_tick || newTick,
                            started_at_date: shardDate?.current_date || '',
                            approval_at_start: Number(nation.gov_approval ?? 50),
                            pm_party_id: hog.faction_id,
                            stats_at_start: safetyNetStats
                        });
                        console.log(`[advanceTick] Safety net: created missing administration for ${nation.name} (${hog.last_name} Administration)`);
                    }
                }
        } catch (adminSafetyErr) {
            console.error(`[advanceTick] Admin safety net failed for ${nation.name} (non-fatal):`, adminSafetyErr);
        }

        // Phase 5b: caucus system removed.

        // Fail committee bills that have sat without being sent to the floor
        // for COMMITTEE_EXPIRY_TICKS (6) ticks. The function was defined but
        // never called, leaving bills stuck in committee indefinitely.
        try {
            const expiredResults = await expireCommitteeBills(supabase, nation.id, newTick);
            if (expiredResults.length > 0) {
                summary.expiredCommittee = summary.expiredCommittee || [];
                summary.expiredCommittee.push({ nation: nation.name, bills: expiredResults });
            }
        } catch (expireErr) {
            console.error(`[advanceTick] expireCommitteeBills failed for ${nation.name} (non-fatal):`, expireErr);
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

        // Resolve constitutional referendums (1+ tick after referendum_start_tick)
        try {
            const referendumResults = await resolveReferendums(supabase, nation, newTick);
            if (referendumResults.length > 0) {
                summary.referendums = summary.referendums || [];
                summary.referendums.push({ nation: nation.name, results: referendumResults });
            }
        } catch (refErr) {
            console.error(`[advanceTick] resolveReferendums failed for ${nation.name} (non-fatal):`, refErr);
        }

        // Safety net: catch any floor bills that resolveExpiredVotes missed
        // (e.g. due to complex query failure or thrown error). Uses simple queries per-bill.
        // Hoisted so the resolutions it produces are merged into the sector-shift
        // input below — same reasoning as deskResults / royalResults. A bill that
        // only ever resolves via this path (resolveExpiredVotes threw for the
        // nation) still enacts, so without this its sector popularity silently
        // never moves.
        let stuckResults = [];
        try {
            stuckResults = await resolveStuckFloorBills(supabase, nation.id);
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

        // ── Impeachment processing (Presidential + Semi-Presidential) ──
        // Gate is hasElectedPresident, not isPresidentialRepublic — Semi-
        // Presidential nations also have an elected president and the
        // impeachment action's own eligibility rule (party-actions.js:2230)
        // already includes them. Before this fix the entire block —
        // committee→floor auto-transition, per-tick trial effects, the
        // conviction-removes-president-and-schedules-snap-election handler,
        // and the stale-proceedings cleanup — silently skipped every
        // Semi-Presidential nation, so passed impeachment bills sat in the
        // DB marked 'convicted' but never removed the president or fired
        // an election.
        if (hasElectedPresident(nation)) {
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

                // 3. Process conviction (president removal). Runs after
                // resolveExpiredVotes set conviction_result.
                //
                // We sweep ALL convicted-but-not-yet-removed presidents,
                // not just ones resolved on newTick. The old filter
                // (.eq('resolved_at_tick', newTick)) was an off-by-one
                // trap: resolveExpiredVotes reads shard.current_tick from
                // the DB, which during the per-nation loop is still the
                // OLD tick (shard.current_tick is committed at line ~3222,
                // long after this block runs). So the resolver writes
                // resolved_at_tick = oldTick = newTick - 1, but this block
                // queried resolved_at_tick = newTick. They never matched,
                // so no convicted president was ever removed and no snap
                // election was ever scheduled — convictions accumulated
                // in the DB with phase=resolved, conviction_result=convicted,
                // but the president stayed in office indefinitely.
                //
                // Dropping the tick filter makes the block idempotent
                // (the !president.is_active guard below short-circuits
                // any conviction whose president has already been removed)
                // and catches stale convictions that have been stuck
                // through the bug above.
                const { data: convictions } = await supabase
                    .from('impeachment_proceedings')
                    .select('id, president_id, initiated_by_faction_id, charges')
                    .eq('nation_id', nation.id)
                    .eq('phase', 'resolved')
                    .eq('conviction_result', 'convicted');

                for (const proc of (convictions || [])) {
                    // Get president data
                    const { data: president } = await supabase.from('presidents')
                        .select('*').eq('id', proc.president_id).single();
                    if (!president || !president.is_active) continue;

                    // Deactivate president — the seat goes vacant.
                    // No VP succession: per the impeachment spec, the
                    // presidency is empty until the snap election resolves.
                    await supabase.from('presidents').update({
                        is_active: false,
                        removal_reason: 'impeached'
                    }).eq('id', proc.president_id);

                    // Mirror the now-vacant seat onto the nation row.
                    const { error: hosSyncErr } = await supabase.rpc('sync_nation_head_of_state', { p_nation_id: nation.id });
                    if (hosSyncErr) console.error(`[Impeachment] HOS sync failed for ${nation.name}:`, hosSyncErr.message);

                    // President's party takes massive momentum hit
                    await adjustFactionMomentum(supabase, president.faction_id, nation.id, -5, { source: 'impeachment:convicted', tick: newTick });

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

                    // Schedule the snap presidential election for the next
                    // tick — effectively "instant" but offset by 1 so the
                    // existing triggerPresidentialCandidateSelection lookahead
                    // (gt('election_tick', currentTick)) sees it on the
                    // following tick and registers the per-party candidates.
                    //
                    // excluded_faction_id locks the impeached president's
                    // party out of fielding a candidate for THIS election
                    // only. The candidate-registration loop in
                    // presidential.js skips the excluded faction. The column
                    // dies with the election row when it resolves, so the
                    // party returns to normal eligibility for the next
                    // regular cycle automatically.
                    const emergencyElectionTick = newTick + 1;
                    await supabase.from('elections').delete()
                        .eq('nation_id', nation.id)
                        .eq('election_type', 'presidential')
                        .eq('status', 'scheduled');
                    await supabase.from('elections').insert({
                        nation_id: nation.id,
                        election_tick: emergencyElectionTick,
                        election_type: 'presidential',
                        status: 'scheduled',
                        excluded_faction_id: president.faction_id
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
                        description_chosen: `President ${president.first_name} ${president.last_name} has been convicted and removed from office. The presidency is vacant pending an immediate snap election. The impeached party is barred from fielding a candidate in this election.`,
                        fired_at_tick: newTick,
                        effects_applied: {
                            removed_president: `${president.first_name} ${president.last_name}`,
                            acting_president: null,
                            emergency_election_tick: emergencyElectionTick,
                            excluded_faction_id: president.faction_id,
                            stability_hit: -3,
                            reputation_hit: -3,
                            party_approval_hit: -10
                        }
                    });

                    console.log(`[Impeachment] President ${president.first_name} ${president.last_name} removed; seat vacant. Snap election at tick ${emergencyElectionTick}, party ${president.faction_id} excluded.`);
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

        // Auto-enact bills past the Royal Assent deadline (Absolute Monarchy).
        // Mirrors the presidential auto-sign path so an inactive Monarch
        // doesn't freeze every passed ordinary bill in the nation.
        const royalResults = await processRoyalAssent(supabase, nation, newTick);
        if (royalResults.length > 0) {
            summary.royalAssent = summary.royalAssent || [];
            summary.royalAssent.push({ nation: nation.name, bills: royalResults });
        }

        // Presidential pre-election candidate generation + term end safety net.
        // (processParliamentaryPMTimeout removed — PM is never auto-installed.)
        await triggerPresidentialCandidateSelection(supabase, nation, newTick);
        await processPresidentialTermEnd(supabase, nation, newTick);

        // Incumbent campaign bonuses (+2 approval/tick during pre-election window)
        await processIncumbentCampaignBonuses(supabase, nation, newTick);

        // Phase 5: sector popularity shifts from resolved bills (vote-aligned).
        // The ideology shift / decay pipelines were removed in Phase 5b along
        // with the rest of the ideology system.
        //
        // Merge auto-sign / auto-enact resolutions in. Bills that pass voting
        // in presidential systems first go to president_desk (resolveExpiredVotes
        // emits result: 'president_desk', filtered out by normalizeResult) and
        // are auto-signed N ticks later by processPresidentDesk. Same flow for
        // monarchies via processRoyalAssent. Same for stuckResults: a bill the
        // main resolver missed (its complex query threw for the nation) is still
        // enacted by the safety net, so its shifts must fold back in too.
        // Without folding these results back in, every auto-passed / safety-net
        // bill silently skipped its sector shifts. One filter for all sources:
        // processSectorShifts re-filters internally, so this only needs to drop
        // null/shapeless entries before it maps over them.
        const mergedResolutions = [
            ...resolutions,
            ...(deskResults || []),
            ...(royalResults || []),
            ...(stuckResults || []),
        ].filter(r => r && r.billId && r.result);
        try {
            await processSectorShifts(supabase, nation.id, mergedResolutions);
        } catch (sectorErr) {
            console.error(`[advanceTick] Sector shifts failed for ${nation.name} (non-fatal):`, sectorErr);
        }

        // Purge approval decay (autocracy scapegoat mechanic)
        try {
            await processPurgeDecay(supabase, nation.id, newTick);
        } catch (purgeErr) {
            console.error(`[advanceTick] Purge decay failed for ${nation.name} (non-fatal):`, purgeErr);
        }

        // Inactivity seat drain + auto-disband.
        //
        // INACTIVITY_DRAIN_THRESHOLD .. INACTIVITY_DISBAND_THRESHOLD-1
        //     → lose 20% of seats per tick (min 1)
        // ≥ INACTIVITY_DISBAND_THRESHOLD
        //     → auto-disband (monarchies trigger succession instead)
        //
        // Vacated seats stay EMPTY — rebalanceVacantSeats is skipped this
        // tick if any inactivity event fired (tracked by inactivityChanged),
        // and disbandParty is invoked with redistribute=false so its
        // internal rebalance call is also bypassed.
        //
        // INACTIVITY_DRAIN_THRESHOLD / INACTIVITY_DISBAND_THRESHOLD are
        // exported from js/game/electorate.js; the sync script
        // concatenates that module ahead of this footer so the constants
        // are in scope here without re-declaration.
        let inactivityChanged = false;
        try {
            const { data: allParties } = await supabase
                .from('factions')
                .select('id, faction_name, seats, last_seen_tick, founded_tick, abandoned_at')
                .eq('nation_id', nation.id)
                .eq('faction_type', 'party')
                .is('abandoned_at', null);

            for (const party of (allParties || [])) {
                const ref = party.last_seen_tick ?? party.founded_tick ?? 0;
                const ticksInactive = newTick - ref;

                // Any party past the drain threshold blocks the post-loop
                // seat rebalance — even if THIS tick is a no-op (party at
                // floor seats=1, or already at 0 from prior drain). Without
                // this signal, a party stuck at the floor would let
                // rebalanceVacantSeats redistribute their prior-drained
                // vacancies back to active parties, violating the spec
                // that drained seats stay vacant until the next election.
                if (ticksInactive >= INACTIVITY_DRAIN_THRESHOLD) {
                    inactivityChanged = true;
                }

                if (ticksInactive >= INACTIVITY_DISBAND_THRESHOLD) {
                    // Absolute Monarchy: if this is the monarch's faction, trigger succession instead of disband
                    const isMonarchFaction = nation.monarch_faction_id === party.id
                        && (nation.government_type || '').toLowerCase().includes('monarchy');

                    if (isMonarchFaction) {
                        try {
                            // The monarch has died / been deposed due to inactivity
                            const monarchName = nation.monarch_name || 'The Monarch';
                            const heirName = nation.heir_name || 'The Heir';
                            const dynastyName = nation.dynasty_name || 'Unknown';
                            const monarchTitle = nation.monarch_title || 'King';

                            // Generate a new heir name. getNationNames is
                            // bundled directly from political-actions.js by
                            // sync-edge-function.js, so it's already in scope.
                            // (Earlier code used a dynamic import of the
                            // source path — Supabase CLI flagged that with
                            // a deploy WARN and Deno would have thrown at
                            // runtime since the bundle is self-contained.)
                            const names = getNationNames(nation.name);
                            const newHeirFirst = (names.firstNames || ['Alexander'])[Math.floor(Math.random() * (names.firstNames || ['Alexander']).length)];
                            const newHeirAge = 14 + Math.floor(Math.random() * 8); // 14-21

                            // Update nation: heir becomes monarch, generate new heir
                            await supabase.from('nations').update({
                                monarch_name: heirName,
                                heir_name: newHeirFirst + ' ' + dynastyName,
                                heir_age: newHeirAge,
                                monarch_crowned_tick: newTick,
                                legitimacy: Math.max(20, (Number(nation.legitimacy) || 50) - 10), // succession costs -10 legitimacy
                            }).eq('id', nation.id);

                            // Fire succession event
                            await supabase.from('event_log').insert({
                                nation_id: nation.id,
                                event_name: `${monarchTitle} ${monarchName} has died`,
                                category: 'government',
                                description_chosen: `${monarchTitle} ${monarchName} of the ${dynastyName} dynasty has died after a period of inactivity. ${heirName} ascends to the throne as the new ${monarchTitle}. Long live the ${monarchTitle}!`,
                                fired_at_tick: newTick,
                            });

                            // Add to admin timeline
                            await supabase.from('admin_timeline_events').insert({
                                nation_id: nation.id,
                                tick: newTick,
                                type: 'formation',
                                title: `${monarchTitle} ${monarchName} Has Died`,
                                description: `${heirName} of House ${dynastyName} ascends to the throne. Legitimacy falls to ${Math.max(20, (Number(nation.legitimacy) || 50) - 10)}%.`,
                            });

                            // Reset the faction's last_seen_tick so it doesn't immediately disband again
                            await supabase.from('factions').update({ last_seen_tick: newTick }).eq('id', party.id);

                            console.log(`[Succession] ${monarchTitle} ${monarchName} died in ${nation.name}. ${heirName} takes the throne.`);
                        } catch (succErr) {
                            console.error(`[Succession] Failed for ${nation.name}: ${succErr.message}`);
                        }
                    } else {
                    // Auto-disband: full cleanup via existing disbandParty(),
                    // hardDelete=true physically removes the row + FK cascades
                    // wipe related state. redistribute=false so seats stay
                    // vacant rather than getting rebalanced to other parties.
                    try {
                        await disbandParty(supabase, nation.id, party.id, newTick, { redistribute: false, hardDelete: true });
                        inactivityChanged = true;
                        console.log(`[Inactivity] Hard-deleted ${party.faction_name} in ${nation.name} (${ticksInactive} ticks inactive, seats left vacant)`);
                    } catch (disbandErr) {
                        console.error(`[Inactivity] Hard-delete failed for ${party.faction_name}: ${disbandErr.message}`);
                    }
                    }
                } else if (ticksInactive >= INACTIVITY_DRAIN_THRESHOLD && (party.seats || 0) > 0) {
                    // Seat drain: lose INACTIVITY_DRAIN_RATE of current seats
                    // per tick (min 1 lost), floored at INACTIVITY_DRAIN_FLOOR.
                    // Drained seats stay vacant — the post-loop rebalance is
                    // skipped when inactivityChanged is true. A party already
                    // sitting at the floor produces no UPDATE (no-op skip).
                    const currentSeats = party.seats || 0;
                    const seatsLost = Math.max(1, Math.floor(currentSeats * INACTIVITY_DRAIN_RATE));
                    const newSeats = Math.max(INACTIVITY_DRAIN_FLOOR, currentSeats - seatsLost);
                    if (newSeats === currentSeats) {
                        // Already at floor; nothing to do this tick.
                    } else {
                        const { error: drainErr } = await supabase.from('factions').update({ seats: newSeats }).eq('id', party.id);
                        if (drainErr) {
                            console.error(`[Inactivity] Seat drain failed for ${party.faction_name}: ${drainErr.message}`);
                        } else {
                            inactivityChanged = true;
                            console.log(`[Inactivity] ${party.faction_name} in ${nation.name}: ${currentSeats} → ${newSeats} seats (${ticksInactive} ticks inactive, -${currentSeats - newSeats} vacant)`);
                        }
                    }
                }
            }
        } catch (inactErr) {
            console.error(`[advanceTick] Inactivity processing failed for ${nation.name} (non-fatal):`, inactErr);
        }

        // Seat rebalancing: skipped when inactivity drained or disbanded a
        // party this tick — those vacated seats are meant to stay empty
        // until the next election re-allocates the chamber. Still runs for
        // non-inactivity vacancies (e.g., post-election sync, manual admin
        // adjustments) so other paths keep their pre-existing behavior.
        if (!inactivityChanged) {
            try {
                const seatResult = await rebalanceVacantSeats(supabase, nation);
                if (seatResult) {
                    summary.seatRebalancing = summary.seatRebalancing || [];
                    summary.seatRebalancing.push(seatResult);
                }
            } catch (seatErr) {
                console.error(`[advanceTick] Seat rebalancing failed for ${nation.name} (non-fatal):`, seatErr);
            }
        }

        // National Modifiers (characterization layer — no per-tick stat changes).
        // Flips active_modifiers rows on/off based on triggers / end-triggers.
        // Sole occupant of the "characterizing systems" slot after the
        // crisis-system sunset (Phase 1, source-only — no migration number):
        // processDebtToGdpBands and processCrises were dropped from
        // js/game/political-actions.js. modifier_triggers handles the
        // equivalent firing logic.
        try {
            const modifierResults = await processNationalModifiers(supabase, nation, newTick);
            if (modifierResults.length > 0) {
                summary.modifiers = summary.modifiers || [];
                summary.modifiers.push({ nation: nation.name, modifiers: modifierResults });
            }
        } catch (modifierErr) {
            console.error(`[advanceTick] National modifier processing failed for ${nation.name} (non-fatal):`, modifierErr);
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

        // Active corp count for the per-corp footprint adder in
        // computeCorporateTaxRevenue ($1/tick per active corp HQ'd
        // here). Lifted out of the tax-revenue try so the debt tick
        // further down can also pass it into processNationDebtTick.
        // Mirrors government.html's loadBudgetData fetch: every entrepreneur
        // corp HQ'd here (a corp is active by having a row).
        let activeCorpCount = 0;
        try {
            const { count } = await supabase.from('entrepreneur_corps')
                .select('id', { count: 'exact', head: true })
                .eq('hq_nation_id', nation.id);
            activeCorpCount = count || 0;
        } catch (_) { /* fall back to 0 → no per-corp adder this tick */ }

        // Tax revenue is applied to the treasury by processNationDebtTick
        // (below) as part of its net Balance (revenue − expenditures) — it is
        // NOT added separately here. A separate add double-counted revenue,
        // inflating every nation's treasury by a full revenue each tick.
        // processNationDebtTick is the single source for the tax→treasury flow.

        // Per-tick GDP drift. Applies ((gdp_growth − 50) / 50) × 1% to
        // nation.gdp each tick. SoT: applyGdpGrowthDrift in budget.js
        // (formula and floor live there).
        try {
            await applyGdpGrowthDrift(supabase, nation);
        } catch (gdpErr) {
            console.error(`[advanceTick] GDP drift failed for ${nation.name} (non-fatal):`, gdpErr);
        }

        // Tariff → relations penalty (tariffs > 25% degrade relations with all nations)
        try {
            await processTariffRelationsPenalty(supabase, nation);
        } catch (tariffErr) {
            console.error(`[advanceTick] Tariff relations penalty failed for ${nation.name} (non-fatal):`, tariffErr);
        }

        // National debt — single rule. Bonds retired (2026-05).
        //   balance = tax revenue − expenditures (/12 per tick)
        //   surplus → treasury up (debt is paid down only via explicit pay-down)
        //   deficit → debt up by the full shortfall; treasury is NOT a buffer.
        //             Trade/aid cash still lands in the treasury via their own
        //             processors (section 3.5f). No bonds, no coupons, no printing.
        try {
            const result = await processNationDebtTick(supabase, nation, activeCorpCount);
            if (result) {
                console.log(
                    `[Debt] ${nation.name}: mode=${result.mode}` +
                    ` perTick=${result.perTickBalance.toFixed(2)}` +
                    ` newDebtRaw=${Math.round(result.newDebtRaw)}`
                );
            }
        } catch (debtErr) {
            console.error(`[advanceTick] Debt system failed for ${nation.name} (non-fatal):`, debtErr);
        }

        // Military Loyalty Act: force-sync defense minister to the sitting
        // Head of Government each tick while MLA is active. No-op when not.
        try {
            await syncMilitaryLoyaltyDefenseMinister(supabase, nation, newTick);
        } catch (mlaErr) {
            console.error(`[advanceTick] MLA sync failed for ${nation.name} (non-fatal):`, mlaErr);
        }

        // Re-fetch nation with post-effect values for remaining processors
        const { data: freshNation } = await supabase.from('nations').select('*').eq('id', nation.id).single();
        if (freshNation) Object.assign(nation, freshNation);

        // Electoral standing calculator: 3-pillar (Governance + Momentum + Ideology)
        // Runs every 3rd tick to reduce compute load — standings don't need per-tick precision
        // Also runs if standings are stale (last_updated_tick is more than 3 ticks old)
        // Electorate: runs every 3rd tick to save CPU, but always runs for nations
        // that don't have an electorate_profile yet (genesis must not be delayed)
        const { data: hasProfile } = await supabase.from('electorate_profile')
            .select('id').eq('nation_id', nation.id).maybeSingle();
        if (newTick % 3 === 0 || !hasProfile) {
            try {
                await tickElectorate(supabase, nation, newTick);
            } catch (electorateErr) {
                console.error(`[advanceTick] Electoral standing calc failed for ${nation.name} (non-fatal):`, electorateErr);
            }
        }

        // Random events
        try {
            const eventResults = await processEvents(supabase, nation, newTick);
            if (eventResults.length > 0) summary.events.push({ nation: nation.name, events: eventResults });
        } catch (eventErr) {
            console.error(`[advanceTick] Random events failed for ${nation.name} (non-fatal):`, eventErr);
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

        // ── Monarch succession by natural death ──
        // Fires when the current tick hits the secret reign-end roll set at
        // coronation. Rolls a new monarch from the nation's name pool and a
        // fresh 1d25-year reign. Hidden from UI — the only surface is the
        // event_log entry on transition.
        try {
            const reignEndsTick = Number(nation.monarch_reign_ends_tick);
            const hasDynasty = !!nation.dynasty_name;
            if (hasDynasty && Number.isFinite(reignEndsTick) && newTick >= reignEndsTick) {
                const { firstNames: fPool, lastNames: lPool } = getNationNames(nation.name);
                const newFirst = fPool[Math.floor(Math.random() * fPool.length)];
                const newLast = lPool[Math.floor(Math.random() * lPool.length)];
                const newAge = 25 + Math.floor(Math.random() * 26); // 25–50
                const newTitle = isFemaleName(newFirst) ? 'Queen' : 'King';
                const reignYears = 1 + Math.floor(Math.random() * 25); // 1d25
                const newReignEndsTick = newTick + (reignYears * 12);

                const oldTitle = nation.head_of_state_title || 'King';
                const oldName = `${nation.head_of_state_first_name || ''} ${nation.head_of_state_last_name || ''}`.trim() || 'The Monarch';
                const newName = `${newFirst} ${newLast}`;
                const dynasty = nation.dynasty_name;

                await supabase.from('nations').update({
                    head_of_state_first_name: newFirst,
                    head_of_state_last_name: newLast,
                    head_of_state_age: newAge,
                    head_of_state_title: newTitle,
                    monarch_crowned_tick: newTick,
                    monarch_reign_ends_tick: newReignEndsTick,
                }).eq('id', nation.id);

                nation.head_of_state_first_name = newFirst;
                nation.head_of_state_last_name = newLast;
                nation.head_of_state_age = newAge;
                nation.head_of_state_title = newTitle;
                nation.monarch_crowned_tick = newTick;
                nation.monarch_reign_ends_tick = newReignEndsTick;

                await supabase.from('event_log').insert({
                    nation_id: nation.id,
                    event_name: `${oldTitle} ${oldName} has died`,
                    category: 'government',
                    description_chosen: `${oldTitle} ${oldName} of ${dynasty} has passed away. ${newTitle} ${newName} of ${dynasty} ascends the throne. Long live the ${newTitle}.`,
                    fired_at_tick: newTick,
                });

                console.log(`[Succession] ${oldTitle} ${oldName} of ${nation.name} has died. ${newTitle} ${newName} takes the throne.`);
            }
        } catch (succErr) {
            console.error(`[advanceTick] Monarch succession failed for ${nation.name} (non-fatal):`, succErr);
        }

        // ── Succession helper: updates HOS, syncs nation object, logs action ──
        // Random replacement for head of state succession.
        async function handleStrongmanSuccession(
            supabase: any, nation: any, hosName: string, hosAge: number, newTick: number
        ) {
            // Random replacement for head of state death — use nation-specific name pool
            const { firstNames: FIRST, lastNames: LAST } = getNationNames(nation.name);
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

                // RULE: Party leaders must NEVER be auto-generated. Leaders only change via:
                //   1. Player action on party-leadership.html (manual appointment)
                //   2. Retirement (cleared to NULL here) — player picks replacement
                // Do NOT auto-fill vacant leader slots. The player must choose.

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

                                // Do NOT mutate administrations here.
                                // Administration rows are historical snapshots that must
                                // only change during explicit rollover/close flows.

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
    // 4a-ter. NATIONAL VOLA TEAM LIFECYCLE — global pass.
    // Retires players whose retires_at_tick has arrived, drafts a
    // replacement at current culture, recomputes national_team_prowess.
    // ══════════════════════════════════════════════════════════════════
    try {
        const teamRes = await processVolaTeamLifecycle(supabase, newTick);
        if (teamRes?.replaced) {
            console.log(`[VolaTeam] replaced ${teamRes.replaced} player(s) across ${teamRes.nationsAffected} nation(s)`);
        }
    } catch (teamErr) {
        console.error('[advanceTick] Vola team lifecycle failed (non-fatal):', teamErr);
    }

    // ══════════════════════════════════════════════════════════════════
    // 4a-quater. VOLA STADIUM COMPLETIONS — global pass.
    // Marks active stadium contracts whose expected_finish_tick has
    // arrived as completed; bumps vola_stadiums + vola_culture_floor on
    // the host nation; fires the "Stadium opened" event.
    // ══════════════════════════════════════════════════════════════════
    try {
        const stadResult = await processVolaStadiumCompletions(supabase, newTick);
        if (stadResult?.completed) {
            console.log(`[VolaStadiumCompletion] ${stadResult.completed} stadium(s) opened`);
        }
    } catch (stadErr) {
        console.error('[advanceTick] Vola stadium completion sweep failed (non-fatal):', stadErr);
    }

    // ══════════════════════════════════════════════════════════════════
    // 4a-quater-bis. INTERIOR INFRASTRUCTURE COMPLETIONS — global pass.
    // Marks active Interior Infrastructure contracts whose
    // expected_finish_tick has arrived as completed; applies tier-
    // specific stat bumps to the issuing nation; fires the "Interior
    // Infrastructure Completed" event.
    // ══════════════════════════════════════════════════════════════════
    try {
        const intResult = await processInteriorInfrastructureCompletions(supabase, newTick);
        if (intResult?.completed) {
            console.log(`[InteriorInfrastructure] ${intResult.completed} project(s) completed`);
        }
    } catch (intErr) {
        console.error('[advanceTick] Interior infrastructure completion sweep failed (non-fatal):', intErr);
    }

    try {
        const casResult = await processCombinedArmsSchoolCompletions(supabase, newTick);
        if (casResult?.completed) {
            console.log(`[CombinedArmsSchool] ${casResult.completed} school(s) completed`);
        }
    } catch (casErr) {
        console.error('[advanceTick] Combined Arms School completion sweep failed (non-fatal):', casErr);
    }

    // ══════════════════════════════════════════════════════════════════
    // 4a-quater-ter. ARMY UNITS — FORMING → ACTIVE — global pass.
    // Flips army_units whose 2-tick forming window has elapsed
    // (forming_until_tick <= current tick) from 'Forming' to 'Active'.
    // Single set-based update; idempotent.
    // ══════════════════════════════════════════════════════════════════
    try {
        const formRes = await processFormingUnits(supabase, newTick);
        if (formRes?.activated) {
            console.log(`[ArmyUnits] ${formRes.activated} unit(s) activated`);
        }
    } catch (formErr) {
        console.error('[advanceTick] Army units forming sweep failed (non-fatal):', formErr);
    }

    // ══════════════════════════════════════════════════════════════════
    // 4a-ter. ARMY SUPPLY — global pass.
    // Armies of nations at war consume supply each tick (manpower + brigade
    // costs, less the logistics tail), delivered from the capital with −1 per
    // sector of transit and capped by the faction's logistics stat. Shortfall
    // drains army_cohesion. Places newly-at-war armies at their start sector.
    // ══════════════════════════════════════════════════════════════════
    try {
        const supRes = await processArmySupply(supabase, newTick);
        if (supRes?.underSupplied) {
            console.log(`[ArmySupply] ${supRes.underSupplied} faction(s) under-supplied this tick`);
        }
    } catch (supErr) {
        console.error('[advanceTick] Army supply sweep failed (non-fatal):', supErr);
    }

    // ══════════════════════════════════════════════════════════════════
    // 4a-quater. COMBAT — global pass.
    // Resolves land battles on every front between nations at war: pooled
    // ECP per side, mutual casualties + cohesion drain, line moves toward a
    // broken side's capital when its foe assaulted. Runs after supply so the
    // supply_balance feeding ECP is current.
    // ══════════════════════════════════════════════════════════════════
    try {
        const combatRes = await processCombat(supabase, newTick);
        if (combatRes?.battles) {
            console.log(`[Combat] resolved ${combatRes.battles} front battle(s)`);
        }
    } catch (combatErr) {
        console.error('[advanceTick] Combat sweep failed (non-fatal):', combatErr);
    }

    // ══════════════════════════════════════════════════════════════════
    // 4a-quinque. VWC HOST BID RESOLUTION — global pass.
    // For every cup whose qualifier tick is current_tick (= cup_start
    // - 12), pick a host via the bid-score formula. Winner gets the
    // host slot + budget/global_image/PA/culture bumps; losers take
    // a small PA penalty.
    // ══════════════════════════════════════════════════════════════════
    try {
        const hostResult = await resolveVolaCupBids(supabase, newTick);
        if (hostResult?.resolved) {
            console.log(`[VWCHost] resolved ${hostResult.resolved}/${hostResult.cups} cup host bid(s)`);
        }
    } catch (hostErr) {
        console.error('[advanceTick] VWC host bid resolution failed (non-fatal):', hostErr);
    }

    // ══════════════════════════════════════════════════════════════════
    // 4a-sex. VWC PLACEMENT SCHEDULE GENERATION — global pass.
    // If newTick is the qualifier tick for an upcoming cup that
    // doesn't yet have placement matches scheduled, build the bottom-3
    // round-robin (3 matches over 3 ticks starting now). Cup_start =
    // qualifier_tick + 12, so the cup table tells us which cup is
    // approaching.
    // ══════════════════════════════════════════════════════════════════
    try {
        // qualifier tick → cup_start = newTick + 12, cup_number from
        // (newTick + 12 - 84) / 24 + 1 (clean on-cadence ticks only).
        const candidateCupStart = newTick + 12;
        if (candidateCupStart >= 84 && (candidateCupStart - 84) % 24 === 0) {
            const cupNumber = ((candidateCupStart - 84) / 24) + 1;
            await generateVolaPlacementSchedule(supabase, cupNumber, newTick);
        }
    } catch (placeGenErr) {
        console.error('[advanceTick] Vola placement schedule failed (non-fatal):', placeGenErr);
    }

    // ══════════════════════════════════════════════════════════════════
    // 4a-septem. VWC PLACEMENT MATCH RESOLUTION — global pass.
    // Plays out any placement matches scheduled for newTick. After
    // a cup's Match 3 resolves, settles standings + applies the -1
    // global_image penalty to the bottom 1 + flips is_vola_aspirant.
    // ══════════════════════════════════════════════════════════════════
    try {
        const placeRes = await processVolaPlacementMatches(supabase, newTick);
        if (placeRes?.resolved) {
            console.log(`[VolaPlacement] resolved ${placeRes.resolved} match(es); settled ${placeRes.cupsSettled} cup(s)`);
        }
    } catch (placeErr) {
        console.error('[advanceTick] Vola placement match resolution failed (non-fatal):', placeErr);
    }

    // ══════════════════════════════════════════════════════════════════
    // 4a-octo. VWC GROUP STAGE MATCH RESOLUTION — global pass.
    // Plays out any group-stage matches scheduled for newTick
    // (cup_start + 0/1/2). 6 matches per round × 3 groups = 18 per
    // cup, spread across 3 ticks. Independent from placement so
    // cups in different stages can co-exist if cycles overlap.
    // ══════════════════════════════════════════════════════════════════
    try {
        const groupRes = await processVolaCupGroupMatches(supabase, newTick);
        if (groupRes?.resolved) {
            console.log(`[VolaCupGroup] resolved ${groupRes.resolved} match(es) at tick ${newTick}`);
        }
    } catch (groupErr) {
        console.error('[advanceTick] Vola group match resolution failed (non-fatal):', groupErr);
    }

    // ══════════════════════════════════════════════════════════════════
    // 4a-novem. VWC KNOCKOUT MATCH RESOLUTION — global pass.
    // Plays QF (cup_start+3), SF (cup_start+4), F (cup_start+5). For
    // SF/F rows, fills team_a/b_nation_id from the upstream feeder
    // match's winner before playing. Same scoring system as placement
    // and group stage. Champion crowning + ranking rewards land in
    // Phase 5.
    // ══════════════════════════════════════════════════════════════════
    try {
        const koRes = await processVolaCupKnockoutMatches(supabase, newTick);
        if (koRes?.resolved) {
            console.log(`[VolaKnockout] resolved ${koRes.resolved} match(es) at tick ${newTick}`);
        }
    } catch (koErr) {
        console.error('[advanceTick] Vola knockout match resolution failed (non-fatal):', koErr);
    }

    // ══════════════════════════════════════════════════════════════════
    // 4a-tris. LEADERSHIP CHALLENGES — global pass.
    // Resolves every leadership_challenges row with claimed_at_tick <
    // newTick that hasn't been marked yet. Per nation: re-checks
    // vacancy + coalition + faction validity, picks highest-seats /
    // earliest-claim winner, installs them as PM, applies popularity
    // boost (with 12-tick same-party PM cooldown).
    // ══════════════════════════════════════════════════════════════════
    try {
        const lcResult = await resolveLeadershipChallenges(supabase, newTick);
        if (lcResult?.installedCount) {
            console.log(`[LeadershipChallenge] installed ${lcResult.installedCount} PM(s) across ${lcResult.totalNations} nation(s)`);
        }
    } catch (lcErr) {
        console.error('[advanceTick] Leadership challenge resolution failed (non-fatal):', lcErr);
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

                        // Leadership elections use candidate-based voting (ballot = faction_id)
                        if (vote.vote_type === 'leadership_election') {
                            const voteTally = {};
                            for (const b of (ballots || [])) {
                                if (b.ballot && b.ballot !== 'abstain') {
                                    voteTally[b.ballot] = (voteTally[b.ballot] || 0) + 1;
                                }
                            }
                            // Find candidate with most votes (tie-break: current president wins ties)
                            let winnerId = null;
                            let maxVotes = 0;
                            for (const [candidateId, count] of Object.entries(voteTally)) {
                                if (count > maxVotes || (count === maxVotes && candidateId === org.president_id)) {
                                    maxVotes = count;
                                    winnerId = candidateId;
                                }
                            }
                            // Fallback: if no votes cast, current president stays
                            if (!winnerId) winnerId = org.president_id;

                            const { error: presUpdateErr } = await supabase.from('international_orgs')
                                .update({ president_id: winnerId, president_term_start_tick: newTick })
                                .eq('id', org.id);
                            if (presUpdateErr) console.error(`[advanceTick] IPO president update failed:`, presUpdateErr);

                            const winnerMember = fullMembers.find(m => m.faction_id === winnerId);
                            const winnerName = winnerMember?.factions?.faction_name || 'Unknown';
                            const totalVotes = (ballots || []).length;

                            await supabase.from('ipo_votes')
                                .update({ status: 'passed', result: { tally: voteTally, winner: winnerId, total_ballots: totalVotes }, resolved_at_tick: newTick })
                                .eq('id', vote.id);

                            await supabase.from('ipo_chat').insert({
                                org_id: org.id, faction_id: null, is_system: true,
                                message_text: `Leadership Election Result: ${winnerName} elected president with ${maxVotes} vote${maxVotes !== 1 ? 's' : ''} (${totalVotes} total ballots cast).`,
                                tick_posted: newTick
                            });
                            console.log(`[advanceTick] IPO ${org.name}: ${winnerName} elected president (${maxVotes}/${totalVotes} votes)`);
                            continue; // skip standard yes/no resolution
                        }

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

                    if (successionType === 'vote') {
                        // Check if a leadership election vote is already open
                        const { data: existingElection } = await supabase
                            .from('ipo_votes')
                            .select('id')
                            .eq('org_id', org.id)
                            .eq('vote_type', 'leadership_election')
                            .eq('status', 'open')
                            .limit(1);

                        if (!existingElection || existingElection.length === 0) {
                            // Create a leadership election vote — 3 ticks to vote
                            const candidates = fullMembers.map(m => ({
                                faction_id: m.faction_id,
                                faction_name: m.factions?.faction_name || 'Unknown',
                            }));
                            const { error: electionInsertErr } = await supabase.from('ipo_votes').insert({
                                org_id: org.id,
                                title: 'Leadership Election — Choose Next President',
                                vote_type: 'leadership_election',
                                meta: { candidates },
                                status: 'open',
                                opened_at_tick: newTick,
                                closes_at_tick: newTick + 3,
                                proposed_by: org.president_id,
                            });
                            if (electionInsertErr) {
                                console.error(`[advanceTick] IPO ${org.name}: failed to create election vote:`, electionInsertErr);
                            } else {
                                await supabase.from('ipo_chat').insert({
                                    org_id: org.id, faction_id: null, is_system: true,
                                    message_text: 'Presidential term has ended. A leadership election has been called — vote within 3 ticks.',
                                    tick_posted: newTick,
                                });
                                console.log(`[advanceTick] IPO ${org.name}: leadership election opened`);
                            }

                            // Extend current president's term until election resolves
                            await supabase.from('international_orgs')
                                .update({ president_term_start_tick: newTick })
                                .eq('id', org.id);
                        }
                        // Skip immediate succession — election will resolve via vote auto-resolution
                    } else if (successionType === 'rotation') {
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
                // Every 3 ticks (quarterly), collect cash contributions from members.
                // contributionPerQuarter is stored as integer "AP units"; 1 unit = $50,000.
                if (resources.solidarityFund?.enabled && newTick % 3 === 0) {
                    const contributionUnits = Number(resources.solidarityFund.contributionPerQuarter) || 1;
                    const contributionCash = contributionUnits * IPO_AP_TO_CASH;
                    let totalCollected = 0;

                    for (const m of fullMembers) {
                        // Read faction cash and deduct atomically via update guard
                        const { data: f } = await supabase
                            .from('factions')
                            .select('party_funds')
                            .eq('id', m.faction_id)
                            .maybeSingle();
                        const funds = Number(f?.party_funds) || 0;
                        if (funds < contributionCash) continue; // skip silently if insufficient cash

                        const { error: updErr } = await supabase
                            .from('factions')
                            .update({ party_funds: funds - contributionCash })
                            .eq('id', m.faction_id);
                        if (updErr) continue;

                        totalCollected += contributionCash;
                        const { error: txErr } = await supabase.from('ipo_fund_transactions').insert({
                            org_id: org.id,
                            faction_id: m.faction_id,
                            transaction_type: 'contribution',
                            amount: contributionCash,
                            description: 'Quarterly solidarity fund contribution',
                            tick: newTick
                        });
                        if (txErr) console.error(`[advanceTick] IPO ${org.name}: contribution log insert failed for ${m.faction_id}:`, txErr);
                    }

                    if (totalCollected > 0) {
                        const newBalance = (Number(org.solidarity_fund_balance) || 0) + totalCollected;
                        const { error: balErr } = await supabase.from('international_orgs')
                            .update({ solidarity_fund_balance: newBalance })
                            .eq('id', org.id);
                        if (balErr) {
                            console.error(`[advanceTick] IPO ${org.name}: fund balance update failed (members were debited!):`, balErr);
                        }
                        // Update local copy so HQ cost (section 4) reads the post-collection balance
                        org.solidarity_fund_balance = newBalance;

                        await supabase.from('ipo_chat').insert({
                            org_id: org.id, faction_id: null, is_system: true,
                            message_text: `Quarterly fund collection: ${fmtIPOCash(totalCollected)} collected from ${fullMembers.length} member(s).`,
                            tick_posted: newTick
                        });
                    }
                }

                // ── 4. HQ CASH UPKEEP ──
                // If HQ is set, deduct $50,000 per tick from solidarity fund as upkeep
                if (org.headquarters_nation_id && resources.solidarityFund?.enabled) {
                    const hqCost = IPO_AP_TO_CASH; // $50K / tick
                    const currentBalance = Number(org.solidarity_fund_balance) || 0;
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

    // ══════════════════════════════════════════════════════════════════
    // 4c. BILATERAL ISSUES — modifier engine (runs before incidents)
    // ══════════════════════════════════════════════════════════════════
    try {
        const issueResults = await processIssueTick(supabase, nationList, newTick);
        if (issueResults.modifiersApplied > 0) {
            console.log(`[advanceTick] Issues: ${issueResults.modifiersApplied} modifier effect(s) applied`);
        }
        if (issueResults.modifiersSpawned.length > 0) {
            console.log(`[advanceTick] Issues: ${issueResults.modifiersSpawned.length} modifier(s) spawned`);
        }
        if (issueResults.modifiersExpired.length > 0) {
            console.log(`[advanceTick] Issues: ${issueResults.modifiersExpired.length} modifier(s) expired`);
        }
        if (issueResults.escalations.length > 0) {
            summary.issueEscalations = issueResults.escalations;
            console.log(`[advanceTick] Issues: ${issueResults.escalations.length} issue(s) escalated to incidents`);
        }
        summary.issueResults = issueResults;
    } catch (issueErr) {
        console.error('[advanceTick] Issue processing failed (non-fatal):', issueErr);
    }

    // ══════════════════════════════════════════════════════════════════
    // 4d. INCIDENTS — global trigger check (runs once per tick, not per-nation)
    // ══════════════════════════════════════════════════════════════════
    try {
        const incidentResults = await processIncidentTriggers(supabase, nationList, newTick);
        if (incidentResults.length > 0) {
            summary.incidents = incidentResults;
            console.log(`[advanceTick] Incidents: ${incidentResults.length} new incident(s) triggered`);
        }

        // Process active incidents: tick events + inaction penalties
        const activeResults = await processActiveIncidents(supabase, nationList, newTick);
        if (activeResults.tickEvents.length > 0 || activeResults.inactionPenalties.length > 0) {
            summary.incidentTickEvents = activeResults.tickEvents;
            summary.incidentInaction = activeResults.inactionPenalties;
            console.log(`[advanceTick] Incidents: ${activeResults.tickEvents.length} tick event(s), ${activeResults.inactionPenalties.length} inaction penalty(ies)`);
        }

        // Process escalation, mediation, blowback, and resolution
        const resolutionResults = await processIncidentResolutionPhase(supabase, nationList, newTick);
        if (resolutionResults.escalations.length > 0) {
            summary.incidentEscalations = resolutionResults.escalations;
        }
        if (resolutionResults.mediations.length > 0) {
            summary.incidentMediations = resolutionResults.mediations;
        }
        if (resolutionResults.blowbacks.length > 0) {
            summary.incidentBlowbacks = resolutionResults.blowbacks;
        }
        if (resolutionResults.resolutions.length > 0) {
            summary.incidentResolutions = resolutionResults.resolutions;
            console.log(`[advanceTick] Incidents: ${resolutionResults.resolutions.length} resolved`);
        }
    } catch (incidentErr) {
        console.error('[advanceTick] Incident processing failed (non-fatal):', incidentErr);
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
        // 0. Startup checks (AP preflight removed — Phase A of AP deprecation)

        // 1. Check for force/reprocess parameters + per-nation election fire
        let force = false;
        let reprocess = false;
        let fireElectionsForNation: string | null = null;
        try {
            const body = await Promise.race([
                req.json(),
                new Promise((_, reject) => setTimeout(() => reject(new Error("body read timeout")), 3000)),
            ]);
            force = body?.force === true;
            reprocess = body?.reprocess === true;
            // Snap-election immediate-fire path. The schedule_snap_election RPC
            // already validated that the caller is the PM of this nation, so by
            // the time we get here the scheduled row in `elections` exists at
            // current_tick. Run processElections for just this nation so the
            // player sees results in seconds instead of waiting on pg_cron.
            if (body?.fire_elections_for_nation && typeof body.fire_elections_for_nation === 'string') {
                fireElectionsForNation = body.fire_elections_for_nation;
            }
        } catch (_) {
            // No body, invalid JSON, or timeout — not forced
        }
        console.log(`[advance-tick] Step 1: force=${force}, reprocess=${reprocess}, fireElectionsForNation=${fireElectionsForNation ?? 'none'}`);

        // Per-nation election fire — bypass full tick processing entirely.
        // Returns immediately after running processElections + the post-election
        // formation auto-attempt is handled by the regular tick cycle that
        // follows. Auth: the scheduled election row required a PM-authorized
        // schedule_snap_election call, so this endpoint only fires elections
        // that were already legitimately queued.
        if (fireElectionsForNation) {
            try {
                const { data: nation, error: nErr } = await supabase
                    .from('nations')
                    .select('*')
                    .eq('id', fireElectionsForNation)
                    .single();
                if (nErr || !nation) {
                    return new Response(JSON.stringify({ success: false, error: 'nation_not_found' }), { status: 404, headers: corsHeaders });
                }
                const { data: shardRow } = await supabase.from('shard').select('current_tick').eq('name', 'Alpha Shard').single();
                const tick = Number(shardRow?.current_tick ?? 0);
                const results = await processElections(supabase, nation, tick);
                return new Response(JSON.stringify({ success: true, tick, nation: nation.name, results }), { headers: corsHeaders });
            } catch (err) {
                console.error('[advance-tick] fire_elections_for_nation failed:', err);
                return new Response(JSON.stringify({ success: false, error: String((err as Error)?.message || err) }), { status: 500, headers: corsHeaders });
            }
        }

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
            // advance-corp-tick runs independently via pg_cron (see
            // supabase/setup-corp-cron.sql); the corp_last_processed_tick
            // atomic claim ensures it catches up to whatever tick the main
            // shard just committed to, so no in-band HTTP trigger is
            // needed. Inline trigger was removed after the platform-level
            // apikey-format check started rejecting the new opaque
            // SUPABASE_SERVICE_ROLE_KEY format with UNAUTHORIZED_INVALID_JWT_FORMAT.
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
