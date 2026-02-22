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

    await adjustBlocApproval(supabase, president.faction_id, 2);

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
        await adjustBlocApproval(supabase, action.party_id, -decayRate);

        const newRemaining = result.decay_ticks_remaining - 1;
        await supabase.from('campaign_actions')
            .update({ result: { ...result, decay_ticks_remaining: newRemaining } })
            .eq('id', action.id);
    }
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
    const newDate = advanceMonth(shard.current_date || 'January, 2000');

    // 2. Load all nations
    const { data: nations } = await supabase.from('nations').select('*');
    const nationList = nations || [];

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

    // 4. Process each nation
    for (const nation of nationList) {
      try {
        // Set correct seat count for this nation (affects supermajority thresholds, etc.)
        initGameConfigForNation(nation);

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

        // Stat decay (equilibrium drift + erosion)
        const decayResults = await processStatDecay(supabase, nation);
        if (decayResults.length > 0) {
            summary.decay = summary.decay || [];
            summary.decay.push({ nation: nation.name, effects: decayResults });
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

        // Three-pillar voter preference recalculation
        await calculateThreePillarPreferences(supabase, nation, newTick);

        // Faction loyalty (autocracy)
        if (isAutocracy(nation)) {
            await processLoyaltyTick(supabase, nation);
        }

        // Auto-resolve shakeups that are 1+ ticks old
        if (isAutocracy(nation)) {
            await autoResolveStaleShakeups(supabase, nation.id, newTick);
        }

        // Re-fetch nation with post-effect values for remaining processors
        const { data: freshNation } = await supabase.from('nations').select('*').eq('id', nation.id).single();
        if (freshNation) Object.assign(nation, freshNation);

        // Crises (persistent negative events that apply effects every tick)
        const crisisResults = await processCrises(supabase, nation, newTick);
        if (crisisResults.length > 0) {
            summary.crises = summary.crises || [];
            summary.crises.push({ nation: nation.name, crises: crisisResults });
        }

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

        // Ministry inbox events (fire from templates + expire overdue)
        const ministryEventResults = await processMinistryInboxEvents(supabase, freshNation || nation, newTick);
        if (ministryEventResults.length > 0) {
            summary.ministryEvents = summary.ministryEvents || [];
            summary.ministryEvents.push({ nation: nation.name, events: ministryEventResults });
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

// ===== INTEGRITY CHECKS =====

const CANONICAL_TEMPLATE_GOV_TYPES = ['Democracy', 'Autocracy', 'Presidential'];
const TEMPLATE_GOV_TYPE_ALIASES = {
    democracy: 'Democracy',
    democratic: 'Democracy',
    parliamentary: 'Democracy',
    parliamentarian: 'Democracy',
    'parliamentary democracy': 'Democracy',
    autocracy: 'Autocracy',
    authoritarian: 'Autocracy',
    authoritarianism: 'Autocracy',
    dictatorship: 'Autocracy',
    dictatorial: 'Autocracy',
    'military junta': 'Autocracy',
    presidential: 'Presidential',
    'presidential republic': 'Presidential',
    'executive presidency': 'Presidential'
};

async function runMinistryEventTemplateGovTypeIntegrityCheck(supabase) {
    try {
        const { data: templates, error } = await supabase
            .from('ministry_event_templates')
            .select('id, event_key, gov_types, is_active');

        if (error) {
            console.error('[Integrity][ministry_event_templates] Failed to load template gov types:', error.message);
            return;
        }

        const unknownByTemplate = [];
        const distinctGovTypes = new Set();

        for (const tmpl of (templates || [])) {
            const values = Array.isArray(tmpl.gov_types) ? tmpl.gov_types : [];
            const unknown = [];
            for (const raw of values) {
                const trimmed = String(raw || '').trim();
                if (!trimmed) continue;
                distinctGovTypes.add(trimmed);
                const isCanonical = CANONICAL_TEMPLATE_GOV_TYPES.includes(trimmed);
                const isAlias = Object.prototype.hasOwnProperty.call(TEMPLATE_GOV_TYPE_ALIASES, trimmed.toLowerCase());
                if (!isCanonical && !isAlias) unknown.push(trimmed);
            }
            if (unknown.length > 0) {
                unknownByTemplate.push({
                    id: tmpl.id,
                    event_key: tmpl.event_key,
                    is_active: tmpl.is_active,
                    unknown_gov_types: [...new Set(unknown)].sort()
                });
            }
        }

        const distinctList = [...distinctGovTypes].sort();
        console.log('[Integrity][ministry_event_templates] Distinct template gov_types:', JSON.stringify(distinctList));
        console.log('[Integrity][ministry_event_templates] Canonical gov_types:', JSON.stringify(CANONICAL_TEMPLATE_GOV_TYPES));

        if (unknownByTemplate.length > 0) {
            console.error(
                `[Integrity][ministry_event_templates] UNKNOWN gov_types detected in ${unknownByTemplate.length} template(s). ` +
                `Canonical values: ${CANONICAL_TEMPLATE_GOV_TYPES.join(', ')}. ` +
                'Offenders:',
                JSON.stringify(unknownByTemplate)
            );
        }
    } catch (e) {
        console.error('[Integrity][ministry_event_templates] Integrity check failed unexpectedly:', e?.message || e);
    }
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
        await runMinistryEventTemplateGovTypeIntegrityCheck(supabase);

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
