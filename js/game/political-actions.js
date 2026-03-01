/**
 * political-actions.js — Political actions, tick processors, crises, events, resign PM, disband party
 * Extracted from game-common.js
 */

import { deductAP, GAME_CONFIG } from './config.js';
import { CANONICAL_GOVERNMENT_TYPES, isAutocracy, isPresidentialRepublic } from './government-types.js';
import { RAW_SCALING_DIVISORS } from './diplomacy-constants.js';
import { IDEOLOGY_OPPOSITES, IDEOLOGY_TO_AXIS, loadFactionIdeology } from './ideology.js';
import { GOV_APPROVAL_CONFIG, ISSUE_CATEGORY_STATS, MINISTRY_TO_STATS, NATION_STAT_COLUMNS, NATION_STAT_COLUMN_SET, STAT_DECAY_CONFIG, STAT_TO_MINISTRY, getAveragedInstitutionDecay, normalizeNationStatKey, statApprovalContribution, statDirectionSign, statTrendBatch } from './stats.js';
import { adjustGovernmentApprovalEvent, adjustMomentumAll } from './momentum.js';
import { GOVERNMENT_SHUTDOWN_CRISIS_ID } from './budget.js';
import { fetchActiveCoalition } from './government-structure.js';
import { recalcDerivedApproval } from './bills.js';
import { closeAdministration, dissolveCoalition } from './elections.js';

// ==================== STAT DECAY PROCESSING ====================

/**
 * Apply natural stat decay for a nation. Each tick, configured stats drift
 * toward their target (equilibrium or erosion).
 *
 * Institution funding modifies decay: fully-funded institutions block decay on
 * their primary/secondary stats entirely. Underfunded institutions let decay
 * through (or worsen it). When multiple institutions cover the same stat, their
 * rates are averaged. Stats not covered by any institution decay at natural rates.
 *
 * @param {object} supabase - Supabase client
 * @param {object} nation   - Full nation row (in-memory, mutated on success)
 * @param {Object|null} statInstitutionMap - from buildStatInstitutionMap(), or null to use natural rates
 * @returns {Array<object>}  Applied decay descriptors for tick summary
 */
export async function processStatDecay(supabase, nation, statInstitutionMap, isShutdown = false) {
    const appliedDecay = [];
    const nationUpdates = {};

    for (const [statKey, config] of Object.entries(STAT_DECAY_CONFIG)) {
        if (!NATION_STAT_COLUMN_SET.has(statKey)) continue;

        const currentVal = nation[statKey] !== undefined && nation[statKey] !== null
            ? Number(nation[statKey]) : 50;
        let target = config.target;

        // During a government shutdown, institution-covered stats decay toward
        // worst-case values instead of their normal equilibrium targets.
        // This ensures the shutdown has a catastrophic, tangible impact on stats
        // even when they've already settled near their natural equilibrium.
        if (isShutdown && statInstitutionMap && statInstitutionMap[statKey]) {
            const sign = statDirectionSign(statKey);
            if (sign === 1)       target = Math.min(target, 10);  // higher-is-better → tank toward 10
            else if (sign === -1) target = Math.max(target, 90);  // lower-is-better → spike toward 90
        }

        if (currentVal === target) continue;

        // Determine effective decay speed: institution-modified or natural
        const instDecay = statInstitutionMap
            ? getAveragedInstitutionDecay(statInstitutionMap[statKey])
            : null;
        const speed = instDecay !== null ? instDecay : config.speed;

        if (speed === 0) continue;  // fully funded institutions block all decay

        let newVal;
        if (currentVal > target) {
            newVal = Math.max(target, currentVal - speed);
        } else {
            newVal = Math.min(target, currentVal + speed);
        }

        newVal = Math.round(Math.max(0, Math.min(100, newVal)) * 10) / 10;

        if (newVal !== Math.round(currentVal * 10) / 10) {
            nationUpdates[statKey] = newVal;
            appliedDecay.push({
                stat: statKey,
                type: config.type,
                previousValue: Math.round(currentVal * 10) / 10,
                newValue: newVal,
                target,
                speed,
                institutionModified: instDecay !== null
            });
        }
    }

    if (Object.keys(nationUpdates).length > 0) {
        const { error } = await supabase
            .from('nations')
            .update(nationUpdates)
            .eq('id', nation.id);

        if (error) {
            console.error('[processStatDecay] Nation stat update FAILED',
                { nationId: nation.id, payload: nationUpdates, error: error.message });
            return [];
        }

        const instCount = appliedDecay.filter(d => d.institutionModified).length;
        console.log(`[processStatDecay] Decay applied for ${nation.name}: ${appliedDecay.length} stat(s)${instCount > 0 ? ` (${instCount} institution-modified)` : ''}`);
        Object.assign(nation, nationUpdates);
    }

    return appliedDecay;
}

// ==================== STAT CONNECTIONS (threshold-triggered ripple effects) ====================

/**
 * Process stat connections for a nation. Each enabled connection checks whether
 * a source stat has crossed a threshold and, if so, nudges the target stat.
 *
 * Supports:
 *   - Delay: connection only fires after the source has been past the threshold
 *     for `delay_ticks` consecutive ticks (tracked by checking the live value each tick).
 *   - Dampening: effect weakens as the target approaches its natural limit (0 or 100).
 *
 * @param {object} supabase - Supabase client
 * @param {object} nation   - Full nation row (in-memory, mutated on success)
 * @param {number} currentTick - Current game tick
 * @param {Array}  connections - Pre-fetched stat_connections rows (enabled only)
 * @returns {Array<object>} Applied connection descriptors for tick summary
 */
export async function processStatConnections(supabase, nation, currentTick, connections) {
    if (!connections || connections.length === 0) return [];

    const applied = [];
    const nationUpdates = {};

    for (const conn of connections) {
        if (!NATION_STAT_COLUMN_SET.has(conn.source_stat) ||
            !NATION_STAT_COLUMN_SET.has(conn.target_stat)) continue;

        const sourceVal = Number(nation[conn.source_stat] ?? 50);
        const targetVal = Number(nation[conn.target_stat] ?? 50);

        // Check whether the source stat has crossed the threshold
        const triggered = conn.source_dir === 'above'
            ? sourceVal > conn.threshold
            : sourceVal < conn.threshold;

        if (!triggered) continue;

        // Delay: skip if delay_ticks > 0 (simplified — fires only when threshold
        // is currently crossed; for precise "N consecutive ticks" tracking you'd
        // need a separate state table, but this captures the design intent: delayed
        // connections only fire on ticks that are >= delay_ticks past the start)
        // For now, delay acts as a minimum tick offset from game start (tick 0)
        // where the connection becomes active. A more sophisticated version can
        // track per-nation crossing state later.
        if (conn.delay_ticks > 0 && currentTick < conn.delay_ticks) continue;

        // Compute magnitude with optional dampening
        let effectiveMag = Number(conn.magnitude);
        if (conn.dampening) {
            if (conn.target_dir === 'up') {
                // Weakens as target approaches 100
                effectiveMag *= (1 - targetVal / 100);
            } else {
                // Weakens as target approaches 0
                effectiveMag *= (targetVal / 100);
            }
        }

        if (Math.abs(effectiveMag) < 0.001) continue;

        let newVal = conn.target_dir === 'up'
            ? targetVal + effectiveMag
            : targetVal - effectiveMag;

        newVal = Math.round(Math.max(0, Math.min(100, newVal)) * 10) / 10;

        if (newVal !== Math.round(targetVal * 10) / 10) {
            // Accumulate — multiple connections can affect the same target
            if (nationUpdates[conn.target_stat] !== undefined) {
                // Add delta on top of already-accumulated value
                const prevDelta = nationUpdates[conn.target_stat] - targetVal;
                const thisDelta = newVal - targetVal;
                nationUpdates[conn.target_stat] = Math.round(
                    Math.max(0, Math.min(100, targetVal + prevDelta + thisDelta)) * 10
                ) / 10;
            } else {
                nationUpdates[conn.target_stat] = newVal;
            }

            applied.push({
                source: conn.source_stat,
                sourceValue: sourceVal,
                threshold: Number(conn.threshold),
                target: conn.target_stat,
                direction: conn.target_dir,
                previousValue: Math.round(targetVal * 10) / 10,
                newValue: nationUpdates[conn.target_stat],
                magnitude: Number(conn.magnitude),
                effectiveMagnitude: Math.round(effectiveMag * 1000) / 1000,
                dampened: conn.dampening
            });
        }
    }

    if (Object.keys(nationUpdates).length > 0) {
        const { error } = await supabase
            .from('nations')
            .update(nationUpdates)
            .eq('id', nation.id);

        if (error) {
            console.error('[processStatConnections] Nation stat update FAILED',
                { nationId: nation.id, payload: nationUpdates, error: error.message });
            return [];
        }

        console.log(`[processStatConnections] Connections applied for ${nation.name}: ${applied.length} effect(s)`);
        Object.assign(nation, nationUpdates);
    }

    return applied;
}


// ==================== RALLY SYSTEM ====================

export const RALLY_CONFIG = {
    AP_COST: 3,
    COOLDOWN_WINDOW: 5,   // ticks to look back for rallied_recently count
};

export const RALLY_OUTCOMES = [
    {
        id: 'rousing', name: 'Rousing Success',
        targetMin: 6, targetMax: 8, spillover: 2, spilloverScope: 'adjacent',
        polarization: 1,
        headline: bloc => `Massive turnout at ${bloc} rally — supporters overflow venue`,
    },
    {
        id: 'solid', name: 'Solid Turnout',
        targetMin: 3, targetMax: 5, spillover: 0, spilloverScope: 'none',
        polarization: 0,
        headline: bloc => `Party rally draws steady crowd in ${bloc} district — a strong showing`,
    },
    {
        id: 'low', name: 'Low Turnout',
        targetMin: 1, targetMax: 2, spillover: 0, spilloverScope: 'none',
        polarization: 0,
        headline: bloc => `Sparse attendance at ${bloc} rally raises questions about grassroots support`,
    },
    {
        id: 'gaffe', name: 'Gaffe',
        targetMin: -3, targetMax: -2, spillover: -1, spilloverScope: 'random_adjacent',
        polarization: 1,
        headline: bloc => `Party leader's remarks draw swift backlash at ${bloc} event`,
    },
    {
        id: 'divisive', name: 'Divisive Speech',
        targetMin: 5, targetMax: 7, spillover: -2, spilloverScope: 'all_others',
        polarization: 2,
        headline: bloc => `Fiery rally speech energizes ${bloc} base but draws condemnation from opposition`,
    },
    {
        id: 'counter', name: 'Counter-Protest',
        targetMin: -1, targetMax: -1, spillover: -2, spilloverScope: 'all',
        polarization: 2,
        headline: bloc => `${bloc} rally disrupted by counter-protesters — police intervene as tensions escalate`,
    },
];

/**
 * Compute outcome weights for a rally targeting a voter bloc.
 * Weights shift based on approval, crises, polarization, civil unrest, and recent rallies.
 */
export function getRallyOutcomeWeights(blocApproval, ralliedRecently, nationState) {
    const weights = { rousing: 20, solid: 38, low: 15, gaffe: 12, divisive: 8, counter: 5 };

    // High approval → more rousing
    if (blocApproval > 60) {
        weights.rousing += 12; weights.low -= 5; weights.gaffe -= 4;
    } else if (blocApproval < 30) {
        weights.rousing -= 10; weights.low += 10; weights.gaffe += 8;
    }

    // Active crises
    if (nationState.crisisCount > 0) {
        weights.gaffe += 6; weights.divisive += 4; weights.counter += 10;
        weights.rousing -= 8; weights.solid -= 6;
    }

    // High polarization
    if (nationState.polarization > 60) {
        weights.divisive += 6; weights.counter += 4; weights.solid -= 4;
    }

    // Rallied recently → stale material
    if (ralliedRecently >= 1) {
        weights.gaffe += 5 * ralliedRecently;
        weights.rousing -= 3 * ralliedRecently;
        weights.low += 3 * ralliedRecently;
    }

    // High civil unrest
    if (nationState.civilUnrest > 40) {
        weights.counter += 8; weights.rousing -= 4;
    }

    // Clamp to minimum 1
    for (const k of Object.keys(weights)) weights[k] = Math.max(1, weights[k]);

    // Normalize to percentages
    const total = Object.values(weights).reduce((s, v) => s + v, 0);
    for (const k of Object.keys(weights)) weights[k] = Math.round((weights[k] / total) * 100);

    return weights;
}

/**
 * Get a risk assessment label from outcome weights.
 */
export function getRallyRiskLevel(weights) {
    const badPct = (weights.gaffe || 0) + (weights.divisive || 0) + (weights.counter || 0);
    if (badPct >= 40) return 'dangerous';
    if (badPct >= 25) return 'risky';
    if (badPct >= 15) return 'moderate';
    return 'safe';
}

/**
 * Pick an outcome from weighted distribution.
 */
function rollRallyOutcome(weights) {
    const ids = ['rousing', 'solid', 'low', 'gaffe', 'divisive', 'counter'];
    let sum = 0;
    const cumulative = [];
    for (const id of ids) {
        sum += (weights[id] || 0);
        cumulative.push({ id, threshold: sum });
    }
    const roll = Math.random() * sum;
    return (cumulative.find(c => roll <= c.threshold) || cumulative[cumulative.length - 1]).id;
}

/**
 * Execute a rally targeting a specific voter bloc.
 * Returns { success, outcomeId, outcomeName, headline, effects, newAp }
 */
export async function executeRally(supabase, factionId, nationId, blocId, currentTick) {
    // ── 1. Validate AP ──
    const { data: faction } = await supabase
        .from('factions').select('action_points').eq('id', factionId).single();
    if (!faction) return { success: false, error: 'Faction not found.' };
    if ((faction.action_points || 0) < RALLY_CONFIG.AP_COST)
        return { success: false, error: `Not enough AP. Need ${RALLY_CONFIG.AP_COST}.` };

    // ── 2. Check cooldown (one rally per tick) ──
    const { data: recentRallies } = await supabase
        .from('campaign_actions')
        .select('tick_performed, result')
        .eq('party_id', factionId)
        .eq('action_type', 'rally')
        .gte('tick_performed', currentTick - RALLY_CONFIG.COOLDOWN_WINDOW)
        .order('tick_performed', { ascending: false });

    if ((recentRallies || []).some(r => r.tick_performed === currentTick))
        return { success: false, error: 'Already held a rally this tick.' };

    // Count how many times this specific bloc was rallied recently
    const ralliedRecently = (recentRallies || []).filter(r => r.result?.blocId === blocId).length;

    // ── 3. Load target bloc + nation stats ──
    const { data: targetBloc } = await supabase
        .from('voter_blocs')
        .select('id, bloc_name, population_weight, axis_liberty_equality, axis_tradition_progress, axis_security_freedom, axis_globalism_nationalism, axis_individualism_collectivism')
        .eq('id', blocId).single();
    if (!targetBloc) return { success: false, error: 'Voter bloc not found.' };

    const { data: nation } = await supabase
        .from('nations').select('polarization, civil_unrest, stability').eq('id', nationId).single();
    const { count: crisisCount } = await supabase
        .from('active_crises').select('id', { count: 'exact', head: true }).eq('nation_id', nationId);

    // ── 4. Load all blocs + approval rows ──
    const { data: allBlocs } = await supabase
        .from('voter_blocs')
        .select('id, bloc_name, population_weight, axis_liberty_equality, axis_tradition_progress, axis_security_freedom, axis_globalism_nationalism, axis_individualism_collectivism')
        .eq('nation_id', nationId).eq('is_active', true);

    const { data: approvalRows } = await supabase
        .from('faction_bloc_approval')
        .select('id, bloc_id, preference_score, momentum')
        .eq('faction_id', factionId);
    const approvalByBloc = {};
    for (const row of (approvalRows || [])) approvalByBloc[row.bloc_id] = row;

    const targetApproval = approvalByBloc[blocId]?.preference_score || 50;

    // ── 5. Compute weights and roll outcome ──
    const nationState = {
        polarization: nation?.polarization || 0,
        civilUnrest: nation?.civil_unrest || 0,
        stability: nation?.stability || 50,
        crisisCount: crisisCount || 0,
    };
    const weights = getRallyOutcomeWeights(targetApproval, ralliedRecently, nationState);
    const outcomeId = rollRallyOutcome(weights);
    const outcome = RALLY_OUTCOMES.find(o => o.id === outcomeId);

    // ── 6. Roll specific target effect ──
    const targetDelta = outcome.targetMin + Math.floor(Math.random() * (outcome.targetMax - outcome.targetMin + 1));

    // ── 7. Apply effects ──
    const effects = [];
    const targetRow = approvalByBloc[blocId];
    if (targetRow) {
        const oldPref = Math.round(targetRow.preference_score || 0);
        const newPref = Math.max(0, Math.min(100, oldPref + targetDelta));
        const newMom = Math.round(((targetRow.momentum || 0) + targetDelta) * 100) / 100;
        await supabase.from('faction_bloc_approval')
            .update({ preference_score: newPref, momentum: newMom }).eq('id', targetRow.id);
        effects.push({ bloc: targetBloc.bloc_name, blocId, value: targetDelta, oldPref, newPref });
    }

    // Spillover effects
    if (outcome.spillover !== 0 && outcome.spilloverScope !== 'none') {
        const otherBlocs = (allBlocs || []).filter(b => b.id !== blocId);

        let spillTargets = [];
        if (outcome.spilloverScope === 'all_others' || outcome.spilloverScope === 'all') {
            spillTargets = outcome.spilloverScope === 'all'
                ? (allBlocs || [])  // includes target bloc for counter-protest
                : otherBlocs;
        } else if (outcome.spilloverScope === 'adjacent' || outcome.spilloverScope === 'random_adjacent') {
            // "Adjacent" = blocs sharing at least one strong ideology axis with the target
            const targetAxes = [];
            for (const key of ['axis_liberty_equality', 'axis_tradition_progress', 'axis_security_freedom', 'axis_globalism_nationalism', 'axis_individualism_collectivism']) {
                if (Math.abs((targetBloc[key] ?? 50) - 50) >= 10) targetAxes.push(key);
            }
            const adjacent = otherBlocs.filter(b => {
                return targetAxes.some(key => {
                    const bVal = b[key] ?? 50;
                    const tVal = targetBloc[key] ?? 50;
                    return Math.abs(bVal - 50) >= 10 && ((bVal < 50) === (tVal < 50));
                });
            });
            if (outcome.spilloverScope === 'random_adjacent' && adjacent.length > 0) {
                spillTargets = [adjacent[Math.floor(Math.random() * adjacent.length)]];
            } else {
                spillTargets = adjacent;
            }
        }

        for (const sb of spillTargets) {
            const row = approvalByBloc[sb.id];
            if (!row) continue;
            // For non-'all' scopes, skip target bloc (already handled above)
            if (sb.id === blocId && outcome.spilloverScope !== 'all') continue;
            const oldPref = Math.round(row.preference_score || 0);
            const newPref = Math.max(0, Math.min(100, oldPref + outcome.spillover));
            const newMom = Math.round(((row.momentum || 0) + outcome.spillover) * 100) / 100;
            await supabase.from('faction_bloc_approval')
                .update({ preference_score: newPref, momentum: newMom }).eq('id', row.id);
            effects.push({ bloc: sb.bloc_name, blocId: sb.id, value: outcome.spillover, oldPref, newPref });
        }
    }

    // Polarization effect
    if (outcome.polarization > 0 && nation) {
        const newPol = Math.min(100, (nation.polarization || 0) + outcome.polarization);
        await supabase.from('nations').update({ polarization: newPol }).eq('id', nationId);
        effects.push({ stat: 'Polarization', value: outcome.polarization });
    }

    // ── 8. Deduct AP ──
    const apResult = await deductAP(supabase, factionId, RALLY_CONFIG.AP_COST);

    // ── 9. Log ──
    const headline = outcome.headline(targetBloc.bloc_name);
    await supabase.from('campaign_actions').insert({
        party_id: factionId,
        nation_id: nationId,
        action_type: 'rally',
        ap_cost: RALLY_CONFIG.AP_COST,
        money_cost: 0,
        tick_performed: currentTick,
        result: {
            blocId, blocName: targetBloc.bloc_name,
            outcomeId, outcomeName: outcome.name,
            headline, effects, weights, ralliedRecently,
            // Keep tags for promise compatibility — derive from bloc axes
            tags: _deriveBlocTags(targetBloc),
        }
    });

    return {
        success: true,
        outcomeId,
        outcomeName: outcome.name,
        headline,
        effects,
        weights,
        newAp: apResult.newAp ?? ((faction.action_points || 0) - RALLY_CONFIG.AP_COST),
    };
}

/** Derive ideology tags from a bloc's axis leanings (for promise compatibility). */
function _deriveBlocTags(bloc) {
    const AXIS_MAP = [
        { key: 'axis_liberty_equality', left: 'LIBERTY', right: 'EQUALITY' },
        { key: 'axis_tradition_progress', left: 'TRADITION', right: 'PROGRESS' },
        { key: 'axis_security_freedom', left: 'SECURITY', right: 'FREEDOM' },
        { key: 'axis_globalism_nationalism', left: 'GLOBALISM', right: 'NATIONALISM' },
        { key: 'axis_individualism_collectivism', left: 'INDIVIDUALISM', right: 'COLLECTIVISM' },
    ];
    const tags = [];
    for (const ax of AXIS_MAP) {
        const val = bloc[ax.key] ?? 50;
        if (val < 40) tags.push(ax.left);
        else if (val > 60) tags.push(ax.right);
    }
    return tags;
}


// ==================== VOTER OUTREACH ====================

export const OUTREACH_CONFIG = {
    AP_COST: 4,
    COOLDOWN_WINDOW: 4, // look back 4 ticks for diminishing returns
};

const OUTREACH_AXIS_KEYS = [
    'liberty_equality', 'tradition_progress', 'security_freedom',
    'globalism_nationalism', 'individualism_collectivism'
];

/**
 * Compute ideology alignment between a faction and a voter bloc (0-100).
 * Uses the same logic as the server-side computeIdeologyAlignment in advance-tick.
 */
export function computeOutreachAlignment(factionIdeology, bloc) {
    let weightedAlignment = 0;
    let totalWeight = 0;

    for (const axisKey of OUTREACH_AXIS_KEYS) {
        const partyScore = factionIdeology[axisKey] || 0; // -100 to +100
        const blocScore = bloc['axis_' + axisKey] ?? 50;  // 0-100

        const partyStrength = Math.abs(partyScore) / 100;
        if (partyStrength < 0.01) continue;

        const partyNorm = (partyScore + 100) / 2; // -100→0, 0→50, +100→100
        const alignment = 1 - Math.abs(partyNorm - blocScore) / 100;

        weightedAlignment += alignment * partyStrength;
        totalWeight += partyStrength;
    }

    if (totalWeight === 0) return 50;
    return Math.round((weightedAlignment / totalWeight) * 100);
}

/**
 * Compute the base outreach effect and diminishing returns.
 * @returns {{ alignment, base, diminished, penalty }}
 */
export function calcOutreachEffect(alignment, recentOutreachCount) {
    // base: 3 at alignment 0, up to 5 at alignment 100
    const base = Math.round(3 + (alignment / 100) * 2);
    const diminished = Math.max(1, base - recentOutreachCount);
    return { alignment, base, diminished, penalty: base - diminished };
}

/**
 * Compute friction — opposed blocs that lose approval when you outreach to a target bloc.
 * Two blocs are "opposed" if they sit on opposite sides (one <40, other >60) of any axis
 * where the target bloc holds a strong opinion (< 35 or > 65).
 */
export function calcOutreachFriction(targetBloc, allBlocs, factionIdeology) {
    const frictions = [];
    const targetAxes = [];

    // Find axes where target bloc has a strong leaning
    for (const axisKey of OUTREACH_AXIS_KEYS) {
        const val = targetBloc['axis_' + axisKey] ?? 50;
        if (val < 35 || val > 65) targetAxes.push({ key: axisKey, val });
    }

    for (const other of allBlocs) {
        if (other.id === targetBloc.id) continue;

        // Check if this bloc is ideologically opposed on any of the target's strong axes
        let isOpposed = false;
        for (const { key, val: tVal } of targetAxes) {
            const oVal = other['axis_' + key] ?? 50;
            // Opposed: one is < 35 and the other is > 65 (opposite sides)
            if ((tVal < 35 && oVal > 65) || (tVal > 65 && oVal < 35)) {
                isOpposed = true;
                break;
            }
        }

        if (!isOpposed) continue;

        // Friction penalty scales with how aligned YOUR party is with the opposed bloc
        const yourAlignment = factionIdeology
            ? computeOutreachAlignment(factionIdeology, other)
            : 50;

        // High alignment with opposed bloc = more friction
        const penalty = yourAlignment > 60 ? -2 : yourAlignment > 40 ? -1 : 0;
        if (penalty < 0) {
            frictions.push({ blocId: other.id, blocName: other.bloc_name, penalty, alignment: yourAlignment });
        }
    }

    return frictions;
}

/**
 * Execute voter outreach targeting a specific voter bloc.
 * Guaranteed result — no randomness, no polarization, no headline.
 * Returns { success, effects, newAp }
 */
export async function executeOutreach(supabase, factionId, nationId, blocId, currentTick) {
    // ── 1. Validate AP ──
    const { data: faction } = await supabase
        .from('factions').select('action_points').eq('id', factionId).single();
    if (!faction) return { success: false, error: 'Faction not found.' };
    if ((faction.action_points || 0) < OUTREACH_CONFIG.AP_COST)
        return { success: false, error: `Not enough AP. Need ${OUTREACH_CONFIG.AP_COST}.` };

    // ── 2. Load recent outreach actions for diminishing returns ──
    const { data: recentOutreach } = await supabase
        .from('campaign_actions')
        .select('tick_performed, result')
        .eq('party_id', factionId)
        .eq('action_type', 'outreach')
        .gte('tick_performed', currentTick - OUTREACH_CONFIG.COOLDOWN_WINDOW)
        .order('tick_performed', { ascending: false });

    const outreachedThisTick = (recentOutreach || []).some(r => r.tick_performed === currentTick);
    if (outreachedThisTick)
        return { success: false, error: 'Already conducted outreach this tick.' };

    const recentToBloc = (recentOutreach || []).filter(r => r.result?.blocId === blocId).length;

    // ── 3. Load faction ideology ──
    const { data: factionIdeo } = await supabase
        .from('faction_ideology')
        .select('liberty_equality, tradition_progress, security_freedom, globalism_nationalism, individualism_collectivism')
        .eq('faction_id', factionId)
        .maybeSingle();

    // ── 4. Load all blocs ──
    const { data: allBlocs } = await supabase
        .from('voter_blocs')
        .select('id, bloc_name, population_weight, axis_liberty_equality, axis_tradition_progress, axis_security_freedom, axis_globalism_nationalism, axis_individualism_collectivism')
        .eq('nation_id', nationId).eq('is_active', true);

    const targetBloc = (allBlocs || []).find(b => b.id === blocId);
    if (!targetBloc) return { success: false, error: 'Voter bloc not found.' };

    // ── 5. Load approval rows ──
    const { data: approvalRows } = await supabase
        .from('faction_bloc_approval')
        .select('id, bloc_id, preference_score, momentum')
        .eq('faction_id', factionId);
    const approvalByBloc = {};
    for (const row of (approvalRows || [])) approvalByBloc[row.bloc_id] = row;

    // ── 6. Compute alignment and effect ──
    const alignment = factionIdeo ? computeOutreachAlignment(factionIdeo, targetBloc) : 50;
    const { diminished } = calcOutreachEffect(alignment, recentToBloc);

    // ── 7. Apply target bloc effect ──
    const effects = [];
    const targetRow = approvalByBloc[blocId];
    if (targetRow) {
        const oldPref = Math.round(targetRow.preference_score || 0);
        const newPref = Math.max(0, Math.min(100, oldPref + diminished));
        const newMom = Math.round(((targetRow.momentum || 0) + diminished) * 100) / 100;
        await supabase.from('faction_bloc_approval')
            .update({ preference_score: newPref, momentum: newMom }).eq('id', targetRow.id);
        effects.push({ bloc: targetBloc.bloc_name, blocId, value: diminished, oldPref, newPref });
    }

    // ── 8. Apply friction to opposed blocs ──
    const frictions = calcOutreachFriction(targetBloc, allBlocs || [], factionIdeo);
    for (const fri of frictions) {
        const row = approvalByBloc[fri.blocId];
        if (!row) continue;
        const oldPref = Math.round(row.preference_score || 0);
        const newPref = Math.max(0, Math.min(100, oldPref + fri.penalty));
        const newMom = Math.round(((row.momentum || 0) + fri.penalty) * 100) / 100;
        await supabase.from('faction_bloc_approval')
            .update({ preference_score: newPref, momentum: newMom }).eq('id', row.id);
        effects.push({ bloc: fri.blocName, blocId: fri.blocId, value: fri.penalty, oldPref, newPref });
    }

    // ── 9. Deduct AP ──
    const apResult = await deductAP(supabase, factionId, OUTREACH_CONFIG.AP_COST);

    // ── 10. Log ──
    await supabase.from('campaign_actions').insert({
        party_id: factionId,
        nation_id: nationId,
        action_type: 'outreach',
        ap_cost: OUTREACH_CONFIG.AP_COST,
        money_cost: 0,
        tick_performed: currentTick,
        result: {
            blocId, blocName: targetBloc.bloc_name,
            alignment, diminished,
            effects,
            recentToBloc,
            tags: _deriveBlocTags(targetBloc),
        }
    });

    return {
        success: true,
        effects,
        alignment,
        diminished,
        newAp: apResult.newAp ?? ((faction.action_points || 0) - OUTREACH_CONFIG.AP_COST),
    };
}


// ==================== MAKE PROMISE ====================

export const MAKE_PROMISE_CONFIG = {
    AP_COST: 2,
    MONEY_COST: 0,
    STAT_DELTA: 10,                    // Promise to change stat by ±10
    DEADLINE_DICE: 24,                 // 1D24 + base
    DEADLINE_BASE: 6,                  // base ticks added to roll
    APPROVAL_ON_PROMISE_STAT: 4,       // immediate bump with affected blocs (stat type)
    APPROVAL_ON_PROMISE_CRISIS: 2,     // immediate bump with all blocs (crisis type)
    APPROVAL_IF_KEPT: 12,              // permanent legacy reward
    PENALTY_PER_TICK_MIN: 1,           // -1D3 per tick while governing & unfulfilled
    PENALTY_PER_TICK_MAX: 3,
    PENALTY_IF_BROKEN: 8,              // permanent legacy penalty on deadline expiry
    MAX_ACTIVE_PROMISES: 5,            // limit active promises per faction
    // Promise resolution rewards/penalties (used by resolvePromise)
    KEPT_PREF_BONUS: 5,               // +preference with donor/affected bloc
    KEPT_MOMENTUM: 4,                  // +momentum when promise kept
    BROKEN_DONOR_PREF: -8,            // -preference with donor/affected bloc
    BROKEN_ALL_PREF: -2,              // -preference with ALL blocs
    BROKEN_MOMENTUM: -12,             // momentum hit when promise broken
    BROKEN_NERVOUS_PREF: -1,          // other active promise holders get nervous
};

/**
 * Execute "Make Promise" — faction publicly commits to a stat target or crisis resolution.
 *
 * @param {string} promiseType  'stat' | 'crisis'
 * @param {object} params       { statKey, direction } for stat; { crisisId } for crisis
 * @returns result object with promise details
 */
export async function executeMakePromise(supabase, factionId, nationId, currentTick, promiseType, params) {
    const cfg = MAKE_PROMISE_CONFIG;

    // ── 1. Validate faction ──
    const { data: faction } = await supabase
        .from('factions').select('party_funds, action_points, abbreviation, faction_name')
        .eq('id', factionId).single();
    if (!faction) return { success: false, error: 'Faction not found.' };

    if (cfg.AP_COST > 0 && (faction.action_points || 0) < cfg.AP_COST)
        return { success: false, error: `Not enough AP. Need ${cfg.AP_COST}.` };

    // ── 2. Check active promise limit ──
    const { data: activePromises } = await supabase
        .from('fundraiser_promises')
        .select('id, demand_type, conditions')
        .eq('party_id', factionId)
        .eq('status', 'active');

    if ((activePromises || []).length >= cfg.MAX_ACTIVE_PROMISES)
        return { success: false, error: `Maximum ${cfg.MAX_ACTIVE_PROMISES} active promises reached.` };

    // ── 3. Load nation + blocs ──
    const { data: nation } = await supabase
        .from('nations').select('*').eq('id', nationId).single();
    if (!nation) return { success: false, error: 'Nation not found.' };

    const { data: allBlocs } = await supabase
        .from('voter_blocs')
        .select('id, bloc_name, population_weight, priority_issues')
        .eq('nation_id', nationId).eq('is_active', true);

    const { data: approvalRows } = await supabase
        .from('faction_bloc_approval')
        .select('id, bloc_id, preference_score')
        .eq('faction_id', factionId);
    const approvalByBloc = {};
    for (const row of (approvalRows || [])) approvalByBloc[row.bloc_id] = row;

    // ── 4. Roll deadline: 1D24 + 6 ──
    const deadlineRoll = Math.floor(Math.random() * cfg.DEADLINE_DICE) + 1;
    const deadlineTicks = deadlineRoll + cfg.DEADLINE_BASE;
    const tickDeadline = currentTick + deadlineTicks;

    // ── 5. Build promise based on type ──
    let demandText, demandType, conditions, affectedBlocIds, affectedBlocNames;

    if (promiseType === 'stat') {
        const { statKey } = params;
        if (!statKey) return { success: false, error: 'No stat selected.' };
        if (EXCLUDED_PROMISE_STATS.has(statKey)) return { success: false, error: 'Cannot promise on this stat.' };
        const sign = statDirectionSign(statKey);
        if (sign === 0) return { success: false, error: 'Stat has no clear direction.' };

        // Prevent duplicate stat promises
        const hasDuplicate = (activePromises || []).some(p =>
            p.conditions?.stat_key === statKey && p.demand_type === 'stat_target');
        if (hasDuplicate)
            return { success: false, error: 'You already have an active promise for this stat.' };

        const currentVal = Number(nation[statKey] ?? 50);
        // Auto-determine direction: good stats → increase, bad stats → decrease
        const dir = sign === 1 ? 'above' : 'below';
        const targetValue = dir === 'above'
            ? Math.min(100, Math.round(currentVal + cfg.STAT_DELTA))
            : Math.max(0, Math.round(currentVal - cfg.STAT_DELTA));

        const statLabel = statKey.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        demandText = dir === 'above'
            ? `Increase ${statLabel} to ${targetValue}`
            : `Reduce ${statLabel} to ${targetValue}`;
        demandType = 'stat_target';
        conditions = {
            stat_key: statKey,
            direction: dir,
            baseline_value: currentVal,
            target_value: targetValue,
            delta: cfg.STAT_DELTA,
        };

        // Find affected blocs: those whose priority_issues map to this stat
        affectedBlocIds = [];
        affectedBlocNames = [];
        for (const b of (allBlocs || [])) {
            const issues = b.priority_issues || [];
            for (const issue of issues) {
                const catStats = ISSUE_CATEGORY_STATS[issue] || [];
                if (catStats.includes(statKey)) {
                    affectedBlocIds.push(b.id);
                    affectedBlocNames.push(b.bloc_name);
                    break;
                }
            }
        }
    } else if (promiseType === 'crisis') {
        const { crisisId } = params;
        if (!crisisId) return { success: false, error: 'No crisis selected.' };

        // Validate the crisis is active
        const { data: crisisRecord } = await supabase
            .from('active_crises')
            .select('id, crisis_id, started_at_tick')
            .eq('id', crisisId)
            .eq('nation_id', nationId)
            .single();
        if (!crisisRecord) return { success: false, error: 'Crisis not found or not active.' };

        // Get crisis name
        const { data: crisisTemplate } = await supabase
            .from('crisis_templates')
            .select('name, description')
            .eq('id', crisisRecord.crisis_id)
            .single();

        const crisisName = crisisTemplate?.name || 'Unknown Crisis';

        // Prevent duplicate crisis promises
        const hasDuplicate = (activePromises || []).some(p =>
            p.conditions?.crisis_id === crisisId && p.demand_type === 'crisis_resolution');
        if (hasDuplicate)
            return { success: false, error: 'You already have an active promise for this crisis.' };

        demandText = `Resolve ${crisisName}`;
        demandType = 'crisis_resolution';
        conditions = {
            crisis_id: crisisId,
            crisis_template_id: crisisRecord.crisis_id,
            crisis_name: crisisName,
        };

        // Crisis promises affect all blocs
        affectedBlocIds = (allBlocs || []).map(b => b.id);
        affectedBlocNames = (allBlocs || []).map(b => b.bloc_name);
    } else {
        return { success: false, error: 'Invalid promise type.' };
    }

    // ── 6. Apply immediate approval bump ──
    const approvalBump = promiseType === 'crisis'
        ? cfg.APPROVAL_ON_PROMISE_CRISIS
        : cfg.APPROVAL_ON_PROMISE_STAT;

    const blocEffects = [];
    for (const blocId of affectedBlocIds) {
        const row = approvalByBloc[blocId];
        if (!row) continue;
        const oldPref = Math.round(row.preference_score || 0);
        const newPref = Math.min(100, oldPref + approvalBump);
        await supabase.from('faction_bloc_approval')
            .update({ preference_score: newPref }).eq('id', row.id);
        const bloc = (allBlocs || []).find(b => b.id === blocId);
        blocEffects.push({ blocId, blocName: bloc?.bloc_name, oldPref, newPref, delta: approvalBump });
    }

    // ── 7. Deduct AP if needed ──
    let newAp = faction.action_points || 0;
    if (cfg.AP_COST > 0) {
        const apResult = await deductAP(supabase, factionId, cfg.AP_COST);
        newAp = apResult.newAp ?? (newAp - cfg.AP_COST);
    }

    // ── 8. Create promise record ──
    const { data: promise, error: promiseErr } = await supabase
        .from('fundraiser_promises')
        .insert({
            party_id: factionId,
            nation_id: nationId,
            bloc_id: affectedBlocIds[0] || null,
            bloc_name: affectedBlocNames.join(', '),
            demand_index: 0,
            demand_text: demandText,
            demand_type: demandType,
            donation_amount: 0,
            small_amount: 0,
            tick_created: currentTick,
            deadline_ticks: deadlineTicks,
            tick_deadline: tickDeadline,
            conditions,
            progress: { source: 'make_promise', promise_type: promiseType },
            status: 'active',
        })
        .select()
        .single();

    if (promiseErr) {
        console.error('[MakePromise] Promise insert failed:', promiseErr.message);
        return { success: false, error: 'Failed to create promise record.' };
    }

    // ── 9. Log campaign action ──
    const playerAbbr = faction.abbreviation || faction.faction_name;
    const headline = promiseType === 'crisis'
        ? `${playerAbbr} Promises to ${demandText}`
        : `${playerAbbr} Pledges: "${demandText}"`;

    await supabase.from('campaign_actions').insert({
        party_id: factionId,
        nation_id: nationId,
        action_type: 'make_promise',
        ap_cost: cfg.AP_COST,
        money_cost: 0,
        tick_performed: currentTick,
        result: {
            promiseId: promise.id,
            promiseType,
            demandText,
            demandType,
            conditions,
            deadlineTicks,
            tickDeadline,
            affectedBlocNames,
            approvalBump,
            blocEffects,
            headline,
        }
    });

    return {
        success: true,
        promiseId: promise.id,
        promiseType,
        demandText,
        conditions,
        deadlineTicks,
        tickDeadline,
        affectedBlocNames,
        approvalBump,
        blocEffects,
        headline,
        newAp,
    };
}

/**
 * Get list of stats available for promise-making with current values.
 * Only returns stats with a clear direction (higher/lower is better).
 */
const EXCLUDED_PROMISE_STATS = new Set(['population', 'gdp']);

export function getPromiseableStats(nation) {
    const results = [];
    for (const statKey of NATION_STAT_COLUMNS) {
        if (EXCLUDED_PROMISE_STATS.has(statKey)) continue;
        const sign = statDirectionSign(statKey);
        if (sign === 0) continue;
        const currentVal = nation[statKey];
        if (currentVal == null) continue;
        const ministry = STAT_TO_MINISTRY[statKey] || null;
        // Good stats (sign=1) → promise to increase; bad stats (sign=-1) → promise to decrease
        const promiseDirection = sign === 1 ? 'increase' : 'decrease';
        results.push({
            statKey,
            label: statKey.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            value: Number(currentVal),
            direction: sign === 1 ? 'higher_is_better' : 'lower_is_better',
            promiseDirection,
            ministry,
        });
    }
    return results;
}



// ==================== MOBILIZE (PARTY CHAIRMAN) ====================

export const MOBILIZE_CONFIG = {
    AP_COST: 3,
    MODES: {
        rally_regime: {
            name: 'Rally for the Regime',
            description: 'Organize demonstrations of public support. Flags, banners, crowds chanting the Strongman\'s name.',
            legitimacy_boost: 3,
            standing_boost: 3,
        },
        rally_self: {
            name: 'Rally for Yourself',
            description: 'The crowds are still there, but your portrait is getting bigger. Provincial committees start seeing you as the future.',
            coup_readiness_boost: 5,
            party_pillar_penalty: 2,
            detection_chance: 0.15,
            standing_penalty_if_detected: 10,
        },
    },
};

/**
 * Execute Mobilize: Party Chairman only, non-ruling faction only.
 * Two modes:
 *  - "rally_regime": +3 legitimacy, +3 standing
 *  - "rally_self": +5 coup readiness, -2 party pillar support, 15% detection → -10 standing
 */
export async function executeMobilize(supabase, factionId, nationId, mode, currentTick) {
    const modeConfig = MOBILIZE_CONFIG.MODES[mode];
    if (!modeConfig) return { success: false, error: 'Invalid mobilize mode.' };

    // ── 1. Validate faction + AP ──
    const { data: faction } = await supabase
        .from('factions').select('action_points, faction_name')
        .eq('id', factionId).single();
    if (!faction) return { success: false, error: 'Faction not found.' };
    if ((faction.action_points || 0) < MOBILIZE_CONFIG.AP_COST)
        return { success: false, error: `Not enough AP. Need ${MOBILIZE_CONFIG.AP_COST}.` };

    // ── 2. Validate steward is party_chairman ──
    const { data: steward } = await supabase
        .from('stewards')
        .select('id, steward_type, standing, coup_readiness, first_name, last_name')
        .eq('faction_id', factionId)
        .eq('nation_id', nationId)
        .eq('is_alive', true)
        .single();
    if (!steward || steward.steward_type !== 'party_chairman')
        return { success: false, error: 'Only the Party Chairman can mobilize.' };

    // ── 3. Validate non-ruling faction ──
    const { data: nation } = await supabase
        .from('nations').select('ruling_faction_id, legitimacy')
        .eq('id', nationId).single();
    if (!nation) return { success: false, error: 'Nation not found.' };
    if (nation.ruling_faction_id === factionId)
        return { success: false, error: 'The ruling faction cannot mobilize.' };

    // ── 4. Deduct AP ──
    const apResult = await deductAP(supabase, factionId, MOBILIZE_CONFIG.AP_COST);
    if (!apResult.success) return { success: false, error: 'Failed to deduct AP.' };

    const result = {
        success: true,
        mode,
        modeName: modeConfig.name,
        steward_name: `${steward.first_name} ${steward.last_name}`,
        newAp: apResult.newAp,
        detected: false,
    };

    if (mode === 'rally_regime') {
        // +3 legitimacy (nation stat)
        const newLegitimacy = Math.min(100, Number(nation.legitimacy ?? 50) + modeConfig.legitimacy_boost);
        await supabase.from('nations').update({ legitimacy: newLegitimacy }).eq('id', nationId);

        // +3 standing (steward stat)
        const newStanding = Math.min(100, (steward.standing ?? 50) + modeConfig.standing_boost);
        await supabase.from('stewards').update({ standing: newStanding }).eq('id', steward.id);

        result.legitimacy_change = modeConfig.legitimacy_boost;
        result.standing_change = modeConfig.standing_boost;
        result.newLegitimacy = newLegitimacy;
        result.newStanding = newStanding;

    } else if (mode === 'rally_self') {
        // +5 coup readiness
        const newCR = Math.min(100, (steward.coup_readiness ?? 0) + modeConfig.coup_readiness_boost);
        await supabase.from('stewards').update({ coup_readiness: newCR }).eq('id', steward.id);

        // -2 party pillar support (Grip on Power erosion)
        const { data: partyPillar } = await supabase
            .from('regime_pillars')
            .select('id, support')
            .eq('nation_id', nationId)
            .eq('pillar_key', 'party')
            .single();
        if (partyPillar) {
            const newSupport = Math.max(0, (partyPillar.support ?? 50) - modeConfig.party_pillar_penalty);
            await supabase.from('regime_pillars')
                .update({ support: newSupport, updated_at: new Date().toISOString() })
                .eq('id', partyPillar.id);
            result.party_pillar_change = -modeConfig.party_pillar_penalty;
        }

        result.coup_readiness_change = modeConfig.coup_readiness_boost;
        result.newCoupReadiness = newCR;

        // 15% detection chance
        const detected = Math.random() < modeConfig.detection_chance;
        result.detected = detected;
        if (detected) {
            const newStanding = Math.max(0, (steward.standing ?? 50) - modeConfig.standing_penalty_if_detected);
            await supabase.from('stewards').update({ standing: newStanding }).eq('id', steward.id);
            result.standing_penalty = -modeConfig.standing_penalty_if_detected;
            result.newStanding = newStanding;

            // Log detection event separately
            await supabase.from('campaign_actions').insert({
                party_id: factionId, nation_id: nationId,
                action_type: 'steward_detected_mobilize',
                tick_performed: currentTick,
                result: {
                    steward_name: result.steward_name,
                    faction_name: faction.faction_name,
                    standing_penalty: -modeConfig.standing_penalty_if_detected,
                }
            });
        }
    }

    // ── 5. Log action ──
    await supabase.from('campaign_actions').insert({
        party_id: factionId, nation_id: nationId,
        action_type: 'steward_mobilize',
        tick_performed: currentTick,
        result,
    });

    return result;
}


// ==================== PROMISE TICK PROCESSING ====================

/**
 * Evaluate promise fulfillment status for a single promise.
 * Returns { status: 'fulfilled' | 'in_progress' | 'at_risk' | 'broken', progress }
 *
 * This checks stat-based promises. Other types (pass_bill, rally_count, etc.)
 * are tracked via campaign_actions logs and updated externally.
 */
export function evaluatePromiseStatus(promise, nationStats, currentTick, ministries, coalitionPartyIds, campaignActions) {
    const cond = promise.conditions;
    const elapsed = currentTick - promise.tick_created;
    const remaining = promise.tick_deadline - currentTick;
    const progress = { ...promise.progress };

    // Helper: check if party holds a specific ministry
    const holdsMinistry = (key) => {
        return (ministries || []).some(m => m.ministry_key === key && m.party_id === promise.party_id);
    };

    switch (promise.demand_type) {
        case 'stat_target': {
            const currentVal = Number(nationStats[cond.stat_key] ?? 50);
            const target = cond.target_value ?? cond.absolute_target;
            progress.current_value = currentVal;
            progress.target_value = target;

            if (cond.direction === 'below' && currentVal <= target) {
                return { status: 'fulfilled', progress };
            }
            if (cond.direction === 'above' && currentVal >= target) {
                return { status: 'fulfilled', progress };
            }

            // At risk if less than 25% time remaining
            if (remaining <= Math.ceil(promise.deadline_ticks * 0.25)) {
                return { status: 'at_risk', progress };
            }
            return { status: 'in_progress', progress };
        }

        case 'ministry_and_stat': {
            const hasMinistry = holdsMinistry(cond.ministry_key);
            const currentVal = Number(nationStats[cond.stat_key] ?? 50);
            const target = cond.target_value ?? cond.absolute_target;
            progress.has_ministry = hasMinistry;
            progress.ministry_key = cond.ministry_key;
            progress.current_value = currentVal;
            progress.target_value = target;

            const statMet = cond.direction === 'below'
                ? currentVal <= target
                : currentVal >= target;

            if (hasMinistry && statMet) {
                return { status: 'fulfilled', progress };
            }
            if (remaining <= Math.ceil(promise.deadline_ticks * 0.25)) {
                return { status: 'at_risk', progress };
            }
            return { status: 'in_progress', progress };
        }

        case 'ministry_and_dual_stat': {
            const hasMinistry = holdsMinistry(cond.ministry_key);
            progress.has_ministry = hasMinistry;
            progress.stats = [];
            let allMet = hasMinistry;

            for (const s of (cond.stats || [])) {
                const currentVal = Number(nationStats[s.stat_key] ?? 50);
                const met = s.direction === 'above'
                    ? currentVal >= s.target_value
                    : currentVal <= s.target_value;
                progress.stats.push({ stat_key: s.stat_key, current: currentVal, target: s.target_value, met });
                if (!met) allMet = false;
            }

            if (allMet) return { status: 'fulfilled', progress };
            if (remaining <= Math.ceil(promise.deadline_ticks * 0.25)) return { status: 'at_risk', progress };
            return { status: 'in_progress', progress };
        }

        case 'stat_floor': {
            const currentVal = Number(nationStats[cond.stat_key] ?? 50);
            const floor = cond.floor;
            progress.current_value = currentVal;
            progress.floor = floor;

            if (currentVal < floor) {
                return { status: 'broken', progress }; // Instant break if floor violated
            }
            return { status: 'in_progress', progress };
        }

        case 'stat_sustained': {
            const currentVal = Number(nationStats[cond.stat_key] ?? 50);
            const threshold = cond.threshold;
            progress.current_value = currentVal;
            progress.threshold = threshold;
            progress.sustained_count = progress.sustained_count || 0;
            progress.required = cond.sustained_ticks;

            if (currentVal >= threshold) {
                progress.sustained_count++;
            } else {
                progress.sustained_count = 0; // Reset on dip
            }

            if (progress.sustained_count >= cond.sustained_ticks) {
                return { status: 'fulfilled', progress };
            }
            if (remaining <= Math.ceil(promise.deadline_ticks * 0.25)) return { status: 'at_risk', progress };
            return { status: 'in_progress', progress };
        }

        case 'block_stat_decrease':
        case 'block_stat_increase': {
            const currentVal = Number(nationStats[cond.protected_stat] ?? 50);
            const baseline = cond.baseline_value ?? currentVal;
            progress.current_value = currentVal;
            progress.baseline = baseline;

            if (cond.direction === 'no_decrease' && currentVal < baseline - 0.5) {
                return { status: 'broken', progress };
            }
            if (cond.direction === 'no_increase' && currentVal > baseline + 0.5) {
                return { status: 'broken', progress };
            }
            return { status: 'in_progress', progress };
        }

        case 'rally_count': {
            const requiredTags = cond.required_tags || [];
            const matchingRallies = (campaignActions || []).filter(a => {
                if (a.action_type !== 'rally') return false;
                if (a.party_id !== promise.party_id) return false;
                if (a.tick_performed < promise.tick_created) return false;
                if (a.tick_performed > promise.tick_deadline) return false;
                const tags = a.result?.tags || [];
                return requiredTags.some(rt => tags.includes(rt));
            });
            progress.completed = matchingRallies.length;
            progress.required = cond.count;

            if (matchingRallies.length >= cond.count) return { status: 'fulfilled', progress };
            if (remaining <= Math.ceil(promise.deadline_ticks * 0.25)) return { status: 'at_risk', progress };
            return { status: 'in_progress', progress };
        }

        case 'press_conference_count': {
            const matchingPCs = (campaignActions || []).filter(a => {
                if (a.action_type !== 'press_conference') return false;
                if (a.party_id !== promise.party_id) return false;
                if (a.tick_performed < promise.tick_created) return false;
                if (a.tick_performed > promise.tick_deadline) return false;
                return true; // All press conferences count for this
            });
            progress.completed = matchingPCs.length;
            progress.required = cond.count;

            if (matchingPCs.length >= cond.count) return { status: 'fulfilled', progress };
            if (remaining <= Math.ceil(promise.deadline_ticks * 0.25)) return { status: 'at_risk', progress };
            return { status: 'in_progress', progress };
        }

        case 'ministry_appointment': {
            const hasMinistry = holdsMinistry(cond.ministry_key);
            progress.has_ministry = hasMinistry;
            progress.ministry_key = cond.ministry_key;

            if (hasMinistry) return { status: 'fulfilled', progress };
            if (remaining <= Math.ceil(promise.deadline_ticks * 0.25)) return { status: 'at_risk', progress };
            return { status: 'in_progress', progress };
        }

        case 'pass_bill': {
            // Check if a matching bill was passed during the promise window
            const passed = progress.bill_passed || false;
            progress.bill_name = cond.bill_name || 'Required bill';
            if (passed) return { status: 'fulfilled', progress };
            if (remaining <= Math.ceil(promise.deadline_ticks * 0.25)) return { status: 'at_risk', progress };
            return { status: 'in_progress', progress };
        }

        case 'pass_bill_count': {
            const count = progress.bills_passed || 0;
            progress.required = cond.count;
            progress.completed = count;
            if (count >= cond.count) return { status: 'fulfilled', progress };
            if (remaining <= Math.ceil(promise.deadline_ticks * 0.25)) return { status: 'at_risk', progress };
            return { status: 'in_progress', progress };
        }

        case 'crisis_resolution': {
            // Fulfilled when the referenced crisis is no longer active
            // The crisis_id in conditions refers to the active_crises row id
            // Checked externally via processPromiseTick which loads active crises
            if (progress.crisis_resolved) return { status: 'fulfilled', progress };
            if (remaining <= Math.ceil(promise.deadline_ticks * 0.25)) return { status: 'at_risk', progress };
            return { status: 'in_progress', progress };
        }

        case 'repeal_bill':
        case 'block_bill':
        case 'block_bill_tag':
        case 'vote_pattern':
        case 'coalition_restriction':
        case 'no_confidence':
        case 'no_confidence_conditional':
        case 'constitutional_amendment': {
            // These are tracked by external events updating the progress field
            if (progress.completed) return { status: 'fulfilled', progress };
            if (progress.violated) return { status: 'broken', progress };
            if (remaining <= Math.ceil(promise.deadline_ticks * 0.25)) return { status: 'at_risk', progress };
            return { status: 'in_progress', progress };
        }

        default:
            return { status: 'in_progress', progress };
    }
}

/**
 * Process all active promises for a nation during tick advancement.
 * Checks fulfillment, applies rewards/penalties for expired promises.
 */
export async function processPromiseTick(supabase, nation, currentTick) {
    const { data: activePromises } = await supabase
        .from('fundraiser_promises')
        .select('*')
        .eq('nation_id', nation.id)
        .eq('status', 'active');

    if (!activePromises || activePromises.length === 0) return [];

    const results = [];

    // Load shared data once
    const { data: ministries } = await supabase
        .from('ministries')
        .select('ministry_key, party_id')
        .eq('nation_id', nation.id)
        .eq('is_active', true);

    const coalition = await fetchActiveCoalition(supabase, nation.id);
    const coalitionPartyIds = coalition?.party_ids || [];

    // Load campaign actions for rally/press_conference counting
    const partyIds = [...new Set(activePromises.map(p => p.party_id))];
    const minTick = Math.min(...activePromises.map(p => p.tick_created));
    const { data: campaignActions } = await supabase
        .from('campaign_actions')
        .select('party_id, action_type, tick_performed, result')
        .in('party_id', partyIds)
        .gte('tick_performed', minTick);

    // Fresh nation stats
    const { data: freshNation } = await supabase
        .from('nations').select('*').eq('id', nation.id).single();
    const nationStats = freshNation || nation;

    // Load active crises for crisis_resolution promise checking
    const { data: activeCrises } = await supabase
        .from('active_crises').select('id, crisis_id').eq('nation_id', nation.id);
    const activeCrisisIds = new Set((activeCrises || []).map(ac => ac.id));

    for (const promise of activePromises) {
        // For crisis_resolution promises, check if the crisis is still active
        if (promise.demand_type === 'crisis_resolution' && promise.conditions?.crisis_id) {
            if (!activeCrisisIds.has(promise.conditions.crisis_id)) {
                promise.progress = { ...promise.progress, crisis_resolved: true };
            }
        }

        const evaluation = evaluatePromiseStatus(promise, nationStats, currentTick, ministries, coalitionPartyIds, campaignActions);

        // Update progress
        await supabase.from('fundraiser_promises')
            .update({ progress: evaluation.progress, updated_at: new Date().toISOString() })
            .eq('id', promise.id);

        // Check if fulfilled
        if (evaluation.status === 'fulfilled') {
            await resolvePromise(supabase, promise, 'fulfilled', currentTick, nationStats);
            results.push({ promise, resolution: 'fulfilled' });
            continue;
        }

        // Check if broken (stat floor violated, or deadline passed)
        if (evaluation.status === 'broken' || currentTick >= promise.tick_deadline) {
            await resolvePromise(supabase, promise, 'broken', currentTick, nationStats);
            results.push({ promise, resolution: 'broken' });
            continue;
        }
    }

    return results;
}

/**
 * Apply rewards or penalties when a promise is resolved.
 */
async function resolvePromise(supabase, promise, resolution, currentTick, nationStats) {
    const cfg = MAKE_PROMISE_CONFIG;

    if (resolution === 'fulfilled') {
        // ── REWARDS ──
        // +preference with affected bloc
        const { data: blocRow } = await supabase
            .from('faction_bloc_approval')
            .select('id, preference_score')
            .eq('faction_id', promise.party_id)
            .eq('bloc_id', promise.bloc_id)
            .single();

        if (blocRow) {
            const newPref = Math.min(100, Math.round(blocRow.preference_score + cfg.KEPT_PREF_BONUS));
            await supabase.from('faction_bloc_approval')
                .update({ preference_score: newPref })
                .eq('id', blocRow.id);
        }

        // +momentum
        await adjustMomentumAll(supabase, promise.nation_id, promise.party_id, cfg.KEPT_MOMENTUM, 'promise:kept');

        // Mark promise as fulfilled
        await supabase.from('fundraiser_promises')
            .update({ status: 'fulfilled', tick_resolved: currentTick, updated_at: new Date().toISOString() })
            .eq('id', promise.id);

    } else if (resolution === 'broken') {
        // ── PENALTIES ──
        // -preference with affected bloc
        const { data: blocRow } = await supabase
            .from('faction_bloc_approval')
            .select('id, preference_score')
            .eq('faction_id', promise.party_id)
            .eq('bloc_id', promise.bloc_id)
            .single();

        if (blocRow) {
            const newPref = Math.max(0, Math.round(blocRow.preference_score + cfg.BROKEN_DONOR_PREF));
            await supabase.from('faction_bloc_approval')
                .update({ preference_score: newPref })
                .eq('id', blocRow.id);
        }

        // -preference with ALL blocs
        await adjustMomentumAll(supabase, promise.nation_id, promise.party_id, cfg.BROKEN_ALL_PREF, 'promise:broken_penalty');

        // -momentum
        await adjustMomentumAll(supabase, promise.nation_id, promise.party_id, cfg.BROKEN_MOMENTUM, 'promise:broken');

        // Nervous other promise holders: -1 pref with each
        const { data: otherPromises } = await supabase
            .from('fundraiser_promises')
            .select('bloc_id')
            .eq('party_id', promise.party_id)
            .eq('status', 'active')
            .neq('id', promise.id);

        if (otherPromises && otherPromises.length > 0) {
            const nervousBlocIds = [...new Set(otherPromises.map(p => p.bloc_id))];
            for (const nervousBlocId of nervousBlocIds) {
                const { data: nervousRow } = await supabase
                    .from('faction_bloc_approval')
                    .select('id, preference_score')
                    .eq('faction_id', promise.party_id)
                    .eq('bloc_id', nervousBlocId)
                    .single();

                if (nervousRow) {
                    const newPref = Math.max(0, Math.round(nervousRow.preference_score + cfg.BROKEN_NERVOUS_PREF));
                    await supabase.from('faction_bloc_approval')
                        .update({ preference_score: newPref })
                        .eq('id', nervousRow.id);
                }
            }
        }

        // Mark promise as broken
        await supabase.from('fundraiser_promises')
            .update({ status: 'broken', tick_resolved: currentTick, updated_at: new Date().toISOString() })
            .eq('id', promise.id);
    }
}


// ==================== LOYALTY TICK PROCESSING ====================

export async function processLoyaltyTick(supabase, nation) {
    const rulingId = nation.ruling_faction_id;
    if (!rulingId) return;

    const nationIsAutocracy = isAutocracy(nation);

    const { data: factions } = await supabase
        .from('factions')
        .select('id, loyalty, seats')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');

    if (!factions || factions.length === 0) return;

    const { data: ministries } = await supabase
        .from('ministries')
        .select('party_id')
        .eq('nation_id', nation.id)
        .not('party_id', 'is', null);

    const ministryCounts = {};
    if (ministries) {
        for (const m of ministries) {
            ministryCounts[m.party_id] = (ministryCounts[m.party_id] || 0) + 1;
        }
    }

    for (const faction of factions) {
        let loyalty = faction.loyalty ?? 50;
        let seats = faction.seats || 0;

        if (faction.id === rulingId) {
            if (nationIsAutocracy) {
                // Autocracy ruling faction: dynamic loyalty drifting toward 80
                const ministryCount = ministryCounts[faction.id] || 0;
                if (loyalty > 80) loyalty -= 1;
                else if (loyalty < 80) loyalty += 1;
                loyalty += ministryCount * 0.5;
                loyalty = Math.max(0, Math.min(100, Math.round(loyalty * 10) / 10));
                await supabase.from('factions')
                    .update({ loyalty })
                    .eq('id', faction.id);
            } else {
                if (loyalty !== 100) {
                    await supabase.from('factions')
                        .update({ loyalty: 100 })
                        .eq('id', faction.id);
                }
            }
            continue;
        }

        const ministryCount = ministryCounts[faction.id] || 0;

        if (ministryCount > 0) {
            loyalty += ministryCount * 0.5;
        } else {
            loyalty -= 2;
        }

        if (loyalty > 50) {
            loyalty -= 1;
        } else if (loyalty < 50) {
            loyalty += 1;
        }

        loyalty = Math.max(0, Math.min(100, Math.round(loyalty * 10) / 10));

        // Loyalty is now informational only for autocracies (no AP/seat drain or auto-purges).

        await supabase.from('factions')
            .update({ loyalty, seats })
            .eq('id', faction.id);
    }
}


// ==================== REGIME PILLARS TICK ====================

/**
 * The six pillars of an autocratic regime. Each pillar decays by 1d2 per tick
 * and receives a 1d2 bonus per satisfied "want" condition.
 * The average of all pillar support values = Grip on Power.
 */
const REGIME_PILLAR_DEFS = [
    { key: 'military',    name: 'The Military',      wants: [
        { stat: 'stability', threshold: 50, direction: 'above' },
        { stat: '_armed_forces_funding', threshold: 90, direction: 'above' },
    ]},
    { key: 'security',    name: 'Security Services',  wants: [
        { stat: 'crime_rate', threshold: 40, direction: 'below' },
        { stat: 'corruption', threshold: 50, direction: 'above' },
    ]},
    { key: 'party',       name: 'The Party',          wants: [
        { stat: 'legitimacy', threshold: 50, direction: 'above' },
        { stat: 'standard_of_living', threshold: 50, direction: 'above' },
    ]},
    { key: 'oligarchs',   name: 'Oligarchs',          wants: [
        { stat: 'gdp_growth', threshold: 50, direction: 'above' },
        { stat: 'corporate_tax', threshold: 30, direction: 'below' },
    ]},
    { key: 'bureaucracy', name: 'Bureaucracy',        wants: [
        { stat: 'efficiency', threshold: 50, direction: 'above' },
        { stat: '_debt_ratio', threshold: 50, direction: 'below' },
    ]},
    { key: 'media',       name: 'State Media',        wants: [
        { stat: 'freedom_index', threshold: 40, direction: 'below' },
        { stat: 'legitimacy', threshold: 50, direction: 'above' },
    ]},
    { key: 'foreign_patrons', name: 'Foreign Patrons',  wants: [
        { stat: 'international_reputation', threshold: 50, direction: 'above' },
        { stat: 'foreign_investment', threshold: 50, direction: 'above' },
    ]},
    { key: 'religious',  name: 'Religious Establishment', wants: [
        { stat: 'religious', threshold: 50, direction: 'above' },
        { stat: 'freedom_index', threshold: 40, direction: 'below' },
    ]},
];

function d2() { return 1 + Math.floor(Math.random() * 2); } // 1 or 2

export async function processRegimePillars(supabase, nation) {
    if (!isAutocracy(nation)) return;

    // Fetch existing pillars
    const { data: pillars } = await supabase
        .from('regime_pillars')
        .select('id, pillar_key, support')
        .eq('nation_id', nation.id);

    // If no pillars yet (new autocracy), seed them
    if (!pillars || pillars.length === 0) {
        const rows = REGIME_PILLAR_DEFS.map(def => ({
            nation_id: nation.id,
            pillar_key: def.key,
            pillar_name: def.name,
            support: 55 + Math.floor(Math.random() * 31), // 55-85
        }));
        await supabase.from('regime_pillars').insert(rows);
        return;
    }

    // Build a lookup of pillar_key → row
    const pillarMap = {};
    for (const p of pillars) pillarMap[p.pillar_key] = p;

    // Compute special synthetic stats:
    // _armed_forces_funding: % funding of the 'military' institution from the active budget
    let armedForcesFunding = 0;
    if (nation.last_budget_bill_id) {
        const { data: milAlloc } = await supabase
            .from('budget_item_allocations')
            .select('allocation_amount, needed_amount')
            .eq('bill_id', nation.last_budget_bill_id)
            .eq('item_type', 'institution')
            .eq('item_id', 'military')
            .maybeSingle();
        if (milAlloc && Number(milAlloc.needed_amount) > 0) {
            armedForcesFunding = Math.min(100, Math.round(
                (Number(milAlloc.allocation_amount) / Number(milAlloc.needed_amount)) * 100
            ));
        }
    }

    // _debt_ratio: simple 0-100 where lower is better
    // Use debt relative to GDP: debt/gdp * 100, clamped 0-100
    const gdp = Number(nation.gdp || 1);
    const debt = Number(nation.debt || 0);
    const debtRatio = Math.min(100, Math.max(0, Math.round((debt / Math.max(gdp, 1)) * 100)));

    const syntheticStats = {
        _armed_forces_funding: armedForcesFunding,
        _debt_ratio: debtRatio,
    };

    // Process each pillar
    for (const def of REGIME_PILLAR_DEFS) {
        const row = pillarMap[def.key];
        if (!row) continue;

        let support = row.support;

        // Natural decay: -1d2 per tick
        support -= d2();

        // Check each want: if satisfied, +1d2 bonus
        for (const want of def.wants) {
            const val = want.stat.startsWith('_')
                ? (syntheticStats[want.stat] ?? 0)
                : Number(nation[want.stat] ?? 50);

            const satisfied = want.direction === 'above'
                ? val >= want.threshold
                : val <= want.threshold;

            if (satisfied) {
                support += d2();
            }
        }

        support = Math.max(0, Math.min(100, support));

        await supabase.from('regime_pillars')
            .update({ support, updated_at: new Date().toISOString() })
            .eq('id', row.id);
    }
}

// ==================== STEWARD TICK ====================

/**
 * Map pillar_key → steward archetype.
 */
export const PILLAR_TO_STEWARD_TYPE = {
    bureaucracy:     'technocrat',
    military:        'general',
    party:           'party_chairman',
    oligarchs:       'oligarch',
    security:        'security_chief',
    media:           'propaganda_chief',
    foreign_patrons: 'intelligence_director',
    religious:       'religious_authority',
};

export const STEWARD_TYPE_LABELS = {
    technocrat:           'Technocrat',
    general:              'General',
    party_chairman:       'Party Chairman',
    oligarch:             'Oligarch',
    security_chief:       'Security Chief',
    propaganda_chief:     'Propaganda Chief',
    intelligence_director:'Intelligence Director',
    religious_authority:  'Religious Authority',
};

export const STEWARD_TYPE_DESCRIPTIONS = {
    technocrat:           'Administrative machinery of the state',
    general:              'Armed forces and national defense',
    party_chairman:       'Civilian party apparatus and regime legitimacy',
    oligarch:             'Private capital and economic leverage',
    security_chief:       'Internal security and surveillance apparatus',
    propaganda_chief:     'State media and narrative control',
    intelligence_director:'Foreign intelligence and covert operations',
    religious_authority:  'Religious authority and moral legitimacy',
};

/**
 * Process steward stats each tick for all living stewards in an autocracy nation.
 *
 * Standing: political influence within the regime
 * Power Base: institutional support and resources
 * True Loyalty: actual allegiance (hidden from strongman) — decays at -2/tick naturally
 * Estimated Loyalty: the Strongman's imperfect read — drifts toward true loyalty
 * Personal Wealth: embezzled funds ($M)
 * Exit Readiness: preparedness to flee (0-100)
 * Coup Readiness: preparedness to seize power (only grows when conditions align)
 */
export async function processStewardTick(supabase, nation) {
    if (!isAutocracy(nation)) return;

    const { data: stewards } = await supabase
        .from('stewards')
        .select('id, faction_id, pillar_key, steward_type, standing, power_base, true_loyalty, estimated_loyalty, personal_wealth, exit_readiness, coup_readiness')
        .eq('nation_id', nation.id)
        .eq('is_alive', true);

    if (!stewards || stewards.length === 0) return;

    // Fetch faction data for loyalty + seats
    const { data: factions } = await supabase
        .from('factions')
        .select('id, loyalty, seats')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');

    const factionMap = {};
    let totalSeats = 0;
    for (const f of (factions || [])) {
        factionMap[f.id] = f;
        totalSeats += (f.seats || 0);
    }
    const avgSeats = factions && factions.length > 0 ? totalSeats / factions.length : 0;

    // Fetch ministry counts per faction
    const { data: ministries } = await supabase
        .from('ministries')
        .select('party_id')
        .eq('nation_id', nation.id)
        .not('party_id', 'is', null);

    const ministryCounts = {};
    for (const m of (ministries || [])) {
        ministryCounts[m.party_id] = (ministryCounts[m.party_id] || 0) + 1;
    }

    // Fetch pillar support values
    const { data: pillars } = await supabase
        .from('regime_pillars')
        .select('pillar_key, support')
        .eq('nation_id', nation.id);

    const pillarSupportMap = {};
    for (const p of (pillars || [])) {
        pillarSupportMap[p.pillar_key] = p.support ?? 50;
    }

    // Check if any pillar is below 20 (regime weakness signal)
    const anyPillarBelow20 = Object.values(pillarSupportMap).some(v => v < 20);

    for (const steward of stewards) {
        const faction = factionMap[steward.faction_id];
        if (!faction) continue;

        const factionLoyalty = faction.loyalty ?? 50;
        const factionSeats = faction.seats || 0;
        const ministryCount = ministryCounts[steward.faction_id] || 0;
        const pillarSupport = pillarSupportMap[steward.pillar_key] ?? 50;

        // ── Standing ──
        let standing = steward.standing;
        // Drift toward 50
        if (standing > 50) standing -= 1;
        else if (standing < 50) standing += 1;
        // Pillar backing
        if (pillarSupport > 50) standing += d2();
        // Ministry influence
        standing += ministryCount;
        // Disloyal factions lose influence
        if (factionLoyalty < 30) standing -= 2;

        // ── Power Base ──
        let powerBase = steward.power_base;
        // Natural decay
        powerBase -= d2();
        // Institutional backing
        if (pillarSupport > 60) powerBase += d2();
        // Ministry presence
        powerBase += ministryCount;
        // Legislative power
        if (factionSeats > avgSeats) powerBase += 1;

        // ── True Loyalty ──
        let trueLoyalty = steward.true_loyalty;
        // Natural decay: -2/tick (loyalty erodes without active maintenance)
        trueLoyalty -= 2;
        // Regime crumbling → steward may turn disloyal faster
        if (pillarSupport < 35) trueLoyalty -= d2();

        // ── Estimated Loyalty (Strongman's imperfect view) ──
        let estimatedLoyalty = steward.estimated_loyalty ?? 55;
        // 80% chance of drifting toward true loyalty each tick
        if (Math.random() < 0.8) {
            if (estimatedLoyalty > trueLoyalty) estimatedLoyalty -= 1;
            else if (estimatedLoyalty < trueLoyalty) estimatedLoyalty += 1;
        }

        // ── Personal Wealth (embezzlement) ──
        let personalWealth = Number(steward.personal_wealth) || 0;
        // Ministry holders can embezzle
        if (ministryCount > 0) {
            personalWealth += 1 + Math.floor(Math.random() * 5); // +$1M-5M/tick
        }
        // Oligarchs have business income
        if (steward.steward_type === 'oligarch') {
            personalWealth += 5 + Math.floor(Math.random() * 11); // +$5M-15M/tick
        }

        // ── Exit Readiness ──
        let exitReadiness = steward.exit_readiness ?? 0;
        // Grows when steward has means and motive to flee
        if (trueLoyalty < 30 && personalWealth > 50) exitReadiness += 1;
        // Planning contingencies alongside coup
        if (steward.coup_readiness > 30) exitReadiness += 1;
        // Loyal stewards don't plan exits
        if (trueLoyalty > 60 && exitReadiness > 0) exitReadiness -= 1;

        // ── Coup Readiness ──
        let coupReadiness = steward.coup_readiness;
        let coupGrowing = false;
        // Only grows when the steward is strong, resourced, and disloyal
        if (standing > 60 && powerBase > 50 && trueLoyalty < 30) {
            coupReadiness += 1;
            coupGrowing = true;
        }
        // Regime weakness accelerates
        if (anyPillarBelow20) {
            coupReadiness += 1;
            coupGrowing = true;
        }
        // Decays when conditions aren't met
        if (!coupGrowing && coupReadiness > 0) {
            coupReadiness -= 1;
        }

        // Clamp all values
        standing = Math.max(0, Math.min(100, standing));
        powerBase = Math.max(0, Math.min(100, powerBase));
        trueLoyalty = Math.max(0, Math.min(100, trueLoyalty));
        estimatedLoyalty = Math.max(0, Math.min(100, estimatedLoyalty));
        exitReadiness = Math.max(0, Math.min(100, exitReadiness));
        coupReadiness = Math.max(0, Math.min(100, coupReadiness));

        await supabase.from('stewards')
            .update({
                standing,
                power_base: powerBase,
                true_loyalty: trueLoyalty,
                estimated_loyalty: estimatedLoyalty,
                personal_wealth: personalWealth,
                exit_readiness: exitReadiness,
                coup_readiness: coupReadiness,
                updated_at: new Date().toISOString()
            })
            .eq('id', steward.id);
    }
}

// ==================== COALITION DETECTION ====================

/**
 * Process secret coalition detection each tick.
 * Each active secret coalition has a 5% passive chance of being discovered.
 * When detected, status changes to 'detected' and a campaign_actions entry is logged.
 */
export async function processCoalitionDetection(supabase, nation, currentTick) {
    if (!isAutocracy(nation)) return;

    const { data: secretCoalitions } = await supabase
        .from('faction_coalitions')
        .select('id, faction_a_id, faction_b_id')
        .eq('nation_id', nation.id)
        .eq('coalition_type', 'secret')
        .eq('status', 'active');

    if (!secretCoalitions || secretCoalitions.length === 0) return;

    // Fetch faction names for logging
    const { data: factions } = await supabase
        .from('factions')
        .select('id, faction_name')
        .eq('nation_id', nation.id);

    const nameMap = {};
    for (const fc of (factions || [])) nameMap[fc.id] = fc.faction_name;

    for (const coalition of secretCoalitions) {
        // 5% passive detection
        if (Math.random() < 0.05) {
            await supabase.from('faction_coalitions').update({
                status: 'detected',
                detected_at_tick: currentTick
            }).eq('id', coalition.id);

            // Log detection for the Strongman to see in regime log
            await supabase.from('campaign_actions').insert({
                party_id: nation.ruling_faction_id,
                nation_id: nation.id,
                action_type: 'coalition_detected',
                tick_performed: currentTick,
                result: {
                    coalition_id: coalition.id,
                    faction_a_name: nameMap[coalition.faction_a_id] || '???',
                    faction_b_name: nameMap[coalition.faction_b_id] || '???',
                    faction_a_id: coalition.faction_a_id,
                    faction_b_id: coalition.faction_b_id
                }
            });
        }
    }
}

// ==================== SHAKEUP AUTO-RESOLVE ====================

export async function autoResolveStaleShakeups(supabase, nationId, currentTick) {
    const { data: votingShakeups } = await supabase
        .from('shakeups')
        .select('id, created_at, created_tick')
        .eq('nation_id', nationId)
        .eq('status', 'voting');

    if (!votingShakeups || votingShakeups.length === 0) return;

    const AUTO_RESOLVE_TICKS = 2;

    for (const shakeup of votingShakeups) {
        let tickAge = AUTO_RESOLVE_TICKS;

        if (shakeup.created_tick != null) {
            tickAge = currentTick - shakeup.created_tick;
        } else if (shakeup.created_at) {
            const ageMs = Date.now() - new Date(shakeup.created_at).getTime();
            const ageDays = ageMs / (1000 * 60 * 60 * 24);
            tickAge = ageDays >= 1 ? AUTO_RESOLVE_TICKS : 0;
        }

        if (tickAge >= AUTO_RESOLVE_TICKS) {
            console.log(`Auto-resolving stale shakeup ${shakeup.id} (age: ${tickAge} ticks, now tick ${currentTick})`);
            try {
                const { data, error } = await supabase.rpc('resolve_shakeup', { p_shakeup_id: shakeup.id });
                if (error) console.error('Auto-resolve shakeup error:', error);
                else console.log('Auto-resolve result:', data);
            } catch (e) {
                console.error('Auto-resolve shakeup exception:', e);
            }
        }
    }
}


// ==================== STAT EFFECTS PROCESSING ====================

export async function processStatEffects(supabase, nation, currentTick) {
    let activeLaws;

    // Try join query first; fall back to separate lookup if FK is missing
    const { data, error: joinError } = await supabase
        .from('active_laws')
        .select('*, policies(*)')
        .eq('nation_id', nation.id);

    if (joinError) {
        console.warn('[processStatEffects] Join query failed, falling back to separate policy lookup:', joinError.message);
        const { data: lawsOnly, error: fallbackError } = await supabase
            .from('active_laws')
            .select('*')
            .eq('nation_id', nation.id);

        if (fallbackError || !lawsOnly || lawsOnly.length === 0) {
            if (fallbackError) console.error('[processStatEffects] Fallback query also failed:', fallbackError.message);
            return [];
        }

        // Fetch policies separately and attach them
        const policyIds = [...new Set(lawsOnly.filter(l => l.policy_id).map(l => l.policy_id))];
        if (policyIds.length > 0) {
            const { data: policies } = await supabase
                .from('policies')
                .select('*')
                .in('id', policyIds);
            const policyMap = {};
            for (const p of (policies || [])) policyMap[p.id] = p;
            for (const law of lawsOnly) {
                law.policies = policyMap[law.policy_id] || null;
            }
        }
        activeLaws = lawsOnly;
    } else {
        activeLaws = data;
        // If join succeeded but policies are null for every law, try separate lookup
        if (activeLaws && activeLaws.length > 0 && activeLaws.every(l => !l.policies && l.policy_id)) {
            console.warn('[processStatEffects] Join returned null policies for all laws — fetching separately');
            const policyIds = [...new Set(activeLaws.filter(l => l.policy_id).map(l => l.policy_id))];
            if (policyIds.length > 0) {
                const { data: policies } = await supabase
                    .from('policies')
                    .select('*')
                    .in('id', policyIds);
                const policyMap = {};
                for (const p of (policies || [])) policyMap[p.id] = p;
                for (const law of activeLaws) {
                    if (!law.policies && law.policy_id) law.policies = policyMap[law.policy_id] || null;
                }
            }
        }
    }

    if (!activeLaws || activeLaws.length === 0) {
        console.log(`[processStatEffects] No active laws for ${nation.name}`);
        return [];
    }

    console.log(`[processStatEffects] Processing ${activeLaws.length} active law(s) for ${nation.name}`);

    const appliedEffects = [];
    const nationUpdates = {};
    const lawsToAdvance = [];
    const lawsToDelete = [];

    for (const law of activeLaws) {
        const policy = law.policies;
        const effectSource = `active_law=${law.id}, bill=${law.bill_id || 'unknown'}, policy=${policy?.id || 'unknown'} (${policy?.policy_name || 'Unknown'})`;
        const lastApplied = law.effects_applied_through_tick || 0;
        if (lastApplied >= currentTick) continue;

        const passedTick = law.passed_tick || 0;

        let effects = [];
        const isReversal = law.is_reversal || false;

        if (isReversal && law.reversal_effects && Array.isArray(law.reversal_effects)) {
            effects = law.reversal_effects;
        } else if (policy) {
            if (policy.stat_effects && Array.isArray(policy.stat_effects) && policy.stat_effects.length > 0) {
                effects.push(...policy.stat_effects);
            } else if (policy.target_stat) {
                effects.push({
                    stat_key: policy.target_stat,
                    direction: (policy.stat_direction || 'UP').toLowerCase(),
                    rate: policy.stat_change_per_tick || 1,
                    delay_ticks: 0,
                    duration_ticks: policy.duration_months || 12
                });
            }
        } else if (!isReversal) {
            console.warn(`[processStatEffects] Active law ${law.id} (bill=${law.bill_id}) has NULL policy (policy_id=${law.policy_id}) — no stat effects will be applied`);
        }

        if (effects.length === 0) {
            lawsToAdvance.push(law.id);
            continue;
        }

        let anyEffectApplied = false;
        let allEffectsComplete = true;

        for (let tick = lastApplied + 1; tick <= currentTick; tick++) {
            const ticksSincePassed = tick - passedTick;

            for (const eff of effects) {
                const delay = Number(eff.delay_ticks) || 0;
                const duration = Number(eff.duration_ticks) || 12;
                const rate = Number(eff.rate) || 1;
                const dir = String(eff.direction || '').toLowerCase();
                const rawStatKey = eff.stat_key;
                const statKey = normalizeNationStatKey(rawStatKey);

                if (!statKey || !NATION_STAT_COLUMN_SET.has(statKey)) {
                    if (tick === lastApplied + 1) {
                        console.warn(
                            `[processStatEffects] Skipping invalid stat_key "${rawStatKey}" for ${effectSource}`
                        );
                    }
                    continue;
                }

                if (dir !== 'up' && dir !== 'down') {
                    if (tick === lastApplied + 1) {
                        console.warn(
                            `[processStatEffects] Skipping invalid direction "${eff.direction}" for stat_key="${rawStatKey}" from ${effectSource}`
                        );
                    }
                    continue;
                }

                if (ticksSincePassed <= delay + duration) {
                    allEffectsComplete = false;
                }

                if (ticksSincePassed > delay && ticksSincePassed <= delay + duration) {
                    // GDP is only changed by gdp_growth via applyGdpGrowth — skip stat effects
                    if (statKey === 'gdp') continue;

                    const currentVal = nationUpdates[statKey] !== undefined
                        ? nationUpdates[statKey]
                        : (nation[statKey] !== undefined && nation[statKey] !== null ? Number(nation[statKey]) : 50);

                    // For raw-value stats (population), scale rate by divisor
                    // so rate: 1 means +1M for population
                    let scaledRate = RAW_SCALING_DIVISORS[statKey] ? rate * RAW_SCALING_DIVISORS[statKey] : rate;

                    // Debt service burden: reduce government-spending-dependent stat effects
                    if (SPENDING_AFFECTED_STATS.has(statKey)) {
                        scaledRate *= getSpendingEffectivenessMultiplier(nation);
                    }

                    let newVal;
                    if (dir === 'up') {
                        newVal = currentVal + scaledRate;
                    } else {
                        newVal = currentVal - scaledRate;
                    }

                    // Raw-value stats — don't clamp to 0-100
                    if (RAW_SCALING_DIVISORS[statKey]) {
                        newVal = Math.max(0, newVal);
                    } else {
                        newVal = Math.round(Math.max(0, Math.min(100, newVal)) * 10) / 10;
                    }
                    nationUpdates[statKey] = newVal;
                    anyEffectApplied = true;

                    appliedEffects.push({
                        policy: isReversal ? '↩ Reversal: ' + (policy?.policy_name || 'Unknown') : (policy?.policy_name || 'Unknown'),
                        stat: statKey,
                        direction: dir,
                        rate: rate,
                        tick: tick,
                        newValue: newVal
                    });
                }
            }
        }

        lawsToAdvance.push(law.id);

        if (isReversal && allEffectsComplete) {
            lawsToDelete.push(law.id);
        }
    }

    let nationUpdateError = null;
    if (Object.keys(nationUpdates).length > 0) {
        const { error } = await supabase
            .from('nations')
            .update(nationUpdates)
            .eq('id', nation.id);
        nationUpdateError = error;
    }

    if (nationUpdateError) {
        console.error(
            '[processStatEffects] Nation stat update FAILED',
            { nationId: nation.id, payload: nationUpdates, error: nationUpdateError.message }
        );
        return [];
    }

    if (Object.keys(nationUpdates).length > 0) {
        console.log(`[processStatEffects] Nation stats updated for ${nation.name}:`, JSON.stringify(nationUpdates));
        // Propagate DB-written values to in-memory nation for downstream tick steps (3b-9)
        Object.assign(nation, nationUpdates);
    }

    for (const id of lawsToAdvance) {
        const { error: trackErr } = await supabase
            .from('active_laws')
            .update({ effects_applied_through_tick: currentTick })
            .eq('id', id);
        if (trackErr) {
            console.error(`[processStatEffects] Tracking update FAILED for active_law ${id}:`, trackErr.message);
        }
    }

    for (const id of lawsToDelete) {
        await supabase.from('active_laws').delete().eq('id', id);
    }

    return appliedEffects;
}

/**
 * Process ministry action stat effects during tick advancement.
 * Mirrors processStatEffects but reads from ministry_action_log.
 */
export async function processMinistryActions(supabase, nation, currentTick) {
    const { data: actions, error: fetchError } = await supabase
        .from('ministry_action_log')
        .select('*')
        .eq('nation_id', nation.id)
        .eq('processed', false);

    if (fetchError) {
        console.error('[processMinistryActions] Failed to fetch actions:', fetchError.message);
        return [];
    }
    if (!actions || actions.length === 0) return [];

    const appliedEffects = [];
    const nationUpdates = {};
    // Track minister approval changes keyed by ministry_key + faction_id
    const ministerUpdates = {};
    // Track initial minister approval values for cascade delta calculation
    const ministerBaseline = {};
    // Track faction approval changes keyed by faction_id
    const factionUpdates = {};
    const factionBaseline = {};
    // Defer tracking updates until after nation stats are persisted
    const trackingUpdates = [];

    for (const action of actions) {
        const effects = action.stat_effects;
        if (!effects || !Array.isArray(effects) || effects.length === 0) {
            // No effects — mark as processed
            await supabase.from('ministry_action_log').update({ processed: true }).eq('id', action.id);
            continue;
        }

        const lastApplied = action.effects_applied_through_tick || 0;
        if (lastApplied >= currentTick) continue;

        const appliedTick = action.applied_at_tick || 0;

        let allEffectsComplete = true;

        for (let tick = lastApplied + 1; tick <= currentTick; tick++) {
            const ticksSinceAction = tick - appliedTick;

            for (const eff of effects) {
                const delay = Number(eff.delay_ticks) || 0;
                const duration = Number(eff.duration_ticks) || 4;
                const rate = Number(eff.rate) || 1;
                const target = eff.target || 'nation';
                const rawStatKey = eff.stat_key;
                const statKey = (target === 'nation') ? normalizeNationStatKey(rawStatKey) : rawStatKey;
                if (target === 'nation' && (!statKey || !NATION_STAT_COLUMN_SET.has(statKey))) {
                    console.warn(`[processMinistryActions] Skipping invalid stat_key "${rawStatKey}" for action "${action.action_key}" in ${nation.name}`);
                    continue;
                }

                if (ticksSinceAction <= delay + duration) {
                    allEffectsComplete = false;
                }

                if (ticksSinceAction > delay && ticksSinceAction <= delay + duration) {
                    let currentVal, newVal;

                    if (target === 'minister') {
                        const mKey = action.ministry_key + ':' + action.faction_id;
                        if (ministerUpdates[mKey] === undefined) {
                            // Fetch current minister_approval from the ministries table
                            const { data: ministry } = await supabase
                                .from('ministries')
                                .select('minister_approval')
                                .eq('nation_id', nation.id)
                                .eq('ministry_key', action.ministry_key)
                                .eq('party_id', action.faction_id)
                                .single();
                            ministerUpdates[mKey] = (ministry?.minister_approval ?? 50);
                            ministerBaseline[mKey] = ministerUpdates[mKey];
                        }
                        currentVal = ministerUpdates[mKey];
                        newVal = eff.direction === 'up' ? currentVal + rate : currentVal - rate;
                        newVal = Math.round(Math.max(0, Math.min(100, newVal)) * 10) / 10;
                        ministerUpdates[mKey] = newVal;
                    } else if (target === 'faction') {
                        const fKey = action.faction_id;
                        if (factionUpdates[fKey] === undefined) {
                            const { data: faction } = await supabase
                                .from('factions')
                                .select('approval_rating')
                                .eq('id', action.faction_id)
                                .single();
                            factionUpdates[fKey] = (faction?.approval_rating ?? 50);
                            factionBaseline[fKey] = factionUpdates[fKey];
                        }
                        currentVal = factionUpdates[fKey];
                        newVal = eff.direction === 'up' ? currentVal + rate : currentVal - rate;
                        newVal = Math.round(Math.max(0, Math.min(100, newVal)) * 10) / 10;
                        factionUpdates[fKey] = newVal;
                    } else {
                        // Default: nation stat
                        currentVal = nationUpdates[statKey] !== undefined
                            ? nationUpdates[statKey]
                            : (nation[statKey] !== undefined && nation[statKey] !== null ? Number(nation[statKey]) : 50);
                        newVal = eff.direction === 'up' ? currentVal + rate : currentVal - rate;
                        newVal = Math.round(Math.max(0, Math.min(100, newVal)) * 10) / 10;
                        nationUpdates[statKey] = newVal;
                    }

                    appliedEffects.push({
                        action: action.action_key,
                        ministry: action.ministry_key,
                        stat: statKey,
                        target: target,
                        direction: eff.direction,
                        rate: rate,
                        tick: tick,
                        newValue: newVal
                    });
                }
            }
        }

        // Defer tracking update — only apply after nation stats are persisted
        trackingUpdates.push({ id: action.id, allEffectsComplete });
    }

    // Bulk update nation stats FIRST — before advancing tracking
    let nationUpdateFailed = false;
    if (Object.keys(nationUpdates).length > 0) {
        const { error: nationError } = await supabase.from('nations').update(nationUpdates).eq('id', nation.id);
        if (nationError) {
            console.error('[processMinistryActions] Nation stat update FAILED — effects will be retried next tick',
                { nationId: nation.id, payload: nationUpdates, error: nationError.message });
            nationUpdateFailed = true;
        } else {
            console.log('[processMinistryActions] Nation stats updated:', JSON.stringify(nationUpdates));
        }
    }

    // Only advance tracking if nation update succeeded (or had nothing to update)
    if (!nationUpdateFailed) {
        for (const tu of trackingUpdates) {
            await supabase.from('ministry_action_log').update({
                effects_applied_through_tick: currentTick,
                processed: tu.allEffectsComplete
            }).eq('id', tu.id);
        }
    }

    // Bulk update minister approval
    for (const mKey of Object.keys(ministerUpdates)) {
        const [ministryKey, factionId] = mKey.split(':');
        await supabase.from('ministries')
            .update({ minister_approval: ministerUpdates[mKey] })
            .eq('nation_id', nation.id)
            .eq('ministry_key', ministryKey)
            .eq('party_id', factionId);
    }

    // Cascade minister approval LOSSES to party approval (PM losses at 2x)
    for (const mKey of Object.keys(ministerUpdates)) {
        const baseline = ministerBaseline[mKey];
        const current = ministerUpdates[mKey];
        if (baseline === undefined || current >= baseline) continue; // only losses cascade
        const [ministryKey, factionId] = mKey.split(':');
        const loss = baseline - current;
        const multiplier = ministryKey === 'prime_minister' ? 2 : 1;
        // Load faction approval into factionUpdates if not already tracked
        if (factionUpdates[factionId] === undefined) {
            const { data: faction } = await supabase
                .from('factions')
                .select('approval_rating')
                .eq('id', factionId)
                .single();
            factionUpdates[factionId] = (faction?.approval_rating ?? 50);
            factionBaseline[factionId] = factionUpdates[factionId];
        }
        factionUpdates[factionId] = Math.max(0, factionUpdates[factionId] - (loss * multiplier));
    }

    // Bulk update faction momentum via event cascades
    for (const fKey of Object.keys(factionUpdates)) {
        const delta = Math.round((factionUpdates[fKey] - (factionBaseline[fKey] ?? 50)) * 10) / 10;
        if (delta !== 0) {
            await adjustMomentumAll(supabase, nation.id, fKey, delta, 'event:cascade');
        }
    }

    return appliedEffects;
}

// ==================== LAYER 1: PER-TICK MINISTER APPROVAL ====================

/**
 * Update each minister's approval based on the current state of their owned stats.
 * Uses threshold-based scoring: the public doesn't care about marginal changes,
 * they care whether stats are at acceptable levels or in crisis.
 *
 * Excludes prime_minister (PM approval comes from the composite government approval).
 *
 * Also tracks embattled status: if a minister stays below 30 approval for 5+ ticks,
 * they become "embattled" and impose penalties on government approval.
 *
 * @param {object} supabase
 * @param {object} nation - nation row with current stat values
 * @param {number} currentTick
 * @returns {Array} results for logging
 */
export async function updateMinisterApprovals(supabase, nation, currentTick, isShutdown = false) {
    const { data: ministries } = await supabase
        .from('ministries')
        .select('id, ministry_key, minister_approval, minister_first_name, embattled_since_tick, party_id')
        .eq('nation_id', nation.id)
        .eq('is_active', true);

    if (!ministries || ministries.length === 0) return [];

    // During government shutdown, every minister takes a direct -6/tick approval hit
    // on top of their normal stat-based scoring. A shutdown is a catastrophic failure
    // of governance — public outrage should rapidly destroy minister approval.
    const SHUTDOWN_MINISTER_PENALTY = -6;

    const results = [];

    for (const ministry of ministries) {
        // Skip PM — their approval is derived from the composite government score
        if (ministry.ministry_key === 'prime_minister') continue;
        // Skip vacant ministries (no minister appointed)
        if (!ministry.minister_first_name) continue;

        const ownedStats = MINISTRY_TO_STATS[ministry.ministry_key];
        if (!ownedStats || ownedStats.length === 0) continue;

        // Score each owned stat
        let contributionSum = 0;
        let statCount = 0;
        for (const statKey of ownedStats) {
            const value = Number(nation[statKey] ?? 0);
            const contribution = statApprovalContribution(statKey, value);
            if (contribution !== 0 || statDirectionSign(statKey) !== 0) {
                contributionSum += contribution;
                statCount++;
            }
        }

        // Skip ministers with no stat contributions UNLESS shutdown is active
        // (shutdown penalty must apply to all ministers regardless of stat data)
        if (statCount === 0 && !isShutdown) continue;

        let avgDelta = statCount > 0 ? contributionSum / statCount : 0;

        // Government shutdown: stack a direct penalty on top of stat-based scoring
        if (isShutdown) {
            avgDelta += SHUTDOWN_MINISTER_PENALTY;
        }

        const oldApproval = ministry.minister_approval ?? 50;
        const newApproval = Math.round(Math.max(0, Math.min(100, oldApproval + avgDelta)) * 10) / 10;

        // Track embattled status
        let embattledSinceTick = ministry.embattled_since_tick;
        if (newApproval < GOV_APPROVAL_CONFIG.EMBATTLED_THRESHOLD) {
            if (embattledSinceTick === null || embattledSinceTick === undefined) {
                embattledSinceTick = currentTick;
            }
        } else {
            embattledSinceTick = null;
        }

        // Update minister approval + embattled tracking
        // Use error-checked update with fallback: if embattled_since_tick column
        // doesn't exist yet (migration not applied), retry with just minister_approval
        const { error: updateErr } = await supabase.from('ministries')
            .update({
                minister_approval: newApproval,
                embattled_since_tick: embattledSinceTick
            })
            .eq('id', ministry.id);

        if (updateErr) {
            // Fallback: update just minister_approval (embattled column may not exist)
            await supabase.from('ministries')
                .update({ minister_approval: newApproval })
                .eq('id', ministry.id);
        }

        results.push({
            ministry_key: ministry.ministry_key,
            old: oldApproval,
            new: newApproval,
            delta: Math.round(avgDelta * 10) / 10,
            embattled: embattledSinceTick !== null
        });
    }

    if (results.length > 0) {
        const shutdownTag = isShutdown ? ' [SHUTDOWN -3/tick penalty active]' : '';
        console.log(`[updateMinisterApprovals] ${nation.name}:${shutdownTag} ${results.map(r => `${r.ministry_key} ${r.old}→${r.new} (${r.delta >= 0 ? '+' : ''}${r.delta})`).join(', ')}`);
    }

    return results;
}

// ==================== LAYER 2: GOVERNMENT APPROVAL (COMPOSITE) ====================


/**
 * Calculate composite government approval from three components:
 *   45% — Institutional: minister approval avg + embattled penalties + vacancy penalty
 *   35% — Outcomes: weighted trend+absolute blend across key nation stats
 *   20% — Events: transient modifier (decays 12%/tick), fed by adjustGovernmentApprovalEvent()
 *
 * Stores the result in nations.gov_approval.
 * Caches component values in gov_approval_institutional, gov_approval_outcomes, gov_approval_events.
 * Triggers momentum feedback when gov approval shifts significantly.
 *
 * @param {object} supabase
 * @param {object} nation - nation row with current stat values
 * @param {number} currentTick
 * @param {boolean} [isShutdown=false] - whether the government is currently in shutdown
 * @returns {number|null} the computed government approval (0-100), or null if no government
 */
export async function calculateGovernmentApprovalTick(supabase, nation, currentTick, isShutdown = false) {
    const cfg = GOV_APPROVAL_CONFIG;

    const { data: ministries } = await supabase
        .from('ministries')
        .select('ministry_key, minister_approval, minister_first_name, embattled_since_tick')
        .eq('nation_id', nation.id)
        .eq('is_active', true);

    if (!ministries || ministries.length === 0) return null;

    const filledMinistries = ministries.filter(m => m.minister_first_name);
    const vacantCount = ministries.length - filledMinistries.length;

    // ─── Component A (45%): Institutional — minister avg + embattled + vacancy ───
    let ministerSum = 0;
    let embattledPenalty = 0;

    for (const m of filledMinistries) {
        const approval = m.minister_approval ?? 50;
        ministerSum += approval;

        if (m.embattled_since_tick !== null && m.embattled_since_tick !== undefined && m.ministry_key !== 'prime_minister') {
            const ticksEmbattled = currentTick - m.embattled_since_tick;
            if (ticksEmbattled >= cfg.EMBATTLED_TICKS_REQUIRED) {
                if (approval < cfg.CRISIS_THRESHOLD) {
                    embattledPenalty += cfg.CRISIS_GOV_PENALTY;
                } else {
                    embattledPenalty += cfg.EMBATTLED_GOV_PENALTY;
                }
            }
        }
    }

    const ministerAvg = filledMinistries.length > 0 ? ministerSum / filledMinistries.length : 50;
    const vacancyPenalty = vacantCount * (cfg.VACANCY_PENALTY || -5);
    const institutional = Math.max(0, Math.min(100, ministerAvg + embattledPenalty + vacancyPenalty));

    // ─── Component B (35%): Outcomes — weighted trend+absolute blend ───
    const outcomeStatNames = cfg.OUTCOME_STATS.map(s => s.stat);
    const trends = await statTrendBatch(supabase, nation.id, outcomeStatNames, cfg.OUTCOME_TREND_LOOKBACK);

    let outcomesScore = 50; // neutral default
    let weightSum = 0;
    let blendedSum = 0;

    for (const entry of cfg.OUTCOME_STATS) {
        const rawVal = Number(nation[entry.stat] ?? 50);
        // Normalize absolute value to 0-100 quality scale (inverted stats: lower is better)
        const absQuality = entry.inverted ? (100 - rawVal) : rawVal;
        // Normalize trend: positive trend = good. For inverted stats, a negative raw trend is good.
        const rawTrend = trends[entry.stat] || 0;
        const trendSign = entry.inverted ? -rawTrend : rawTrend;
        // Map trend to 0-100 scale: clamp trend to [-5, +5] range then scale
        const trendQuality = Math.max(0, Math.min(100, 50 + trendSign * 10));

        const blended = absQuality * cfg.OUTCOME_ABSOLUTE_WEIGHT + trendQuality * cfg.OUTCOME_TREND_WEIGHT;
        blendedSum += blended * entry.weight;
        weightSum += entry.weight;
    }

    if (weightSum > 0) {
        outcomesScore = Math.max(0, Math.min(100, blendedSum / weightSum));
    }

    // ─── Component C (20%): Events — transient modifier, decayed before this call ───
    const eventsRaw = Number(nation.gov_approval_events ?? 0); // range: -50 to +50
    // Map [-50, +50] → [0, 100]
    const eventsComponent = Math.max(0, Math.min(100, 50 + eventsRaw));

    // ─── Composite ───
    let rawApproval = institutional * cfg.INSTITUTIONAL_WEIGHT
        + outcomesScore * cfg.OUTCOMES_WEIGHT
        + eventsComponent * cfg.EVENTS_WEIGHT;

    // Government shutdown: slam a flat -25 penalty on the composite score.
    // A shutdown is a catastrophic governance failure — the public doesn't
    // forgive a non-functioning government regardless of minister averages.
    if (isShutdown) {
        rawApproval -= 25;
    }

    const govApproval = Math.round(Math.max(0, Math.min(100, rawApproval)));
    const prevGovApproval = Number(nation.gov_approval ?? 50);

    // Store all components + composite on the nation
    // Use error-checked update with fallback: if component columns don't exist yet
    // (migration not applied), fall back to updating just gov_approval
    const { error: govUpdErr } = await supabase.from('nations')
        .update({
            gov_approval: govApproval,
            gov_approval_institutional: Math.round(institutional * 10) / 10,
            gov_approval_outcomes: Math.round(outcomesScore * 10) / 10,
            gov_approval_events: eventsRaw   // preserve raw value (already decayed)
        })
        .eq('id', nation.id);

    if (govUpdErr) {
        // Fallback: component columns may not exist yet
        await supabase.from('nations')
            .update({ gov_approval: govApproval })
            .eq('id', nation.id);
    }

    // Update in-memory nation object
    nation.gov_approval = govApproval;
    nation.gov_approval_institutional = institutional;
    nation.gov_approval_outcomes = outcomesScore;

    // ─── Momentum feedback: significant gov approval shifts affect party momentum ───
    const delta = govApproval - prevGovApproval;
    if (Math.abs(delta) > cfg.FEEDBACK_THRESHOLD) {
        const coalition = await fetchActiveCoalition(supabase, nation.id);
        const coalitionPartyIds = coalition?.party_ids || [];

        // Coalition parties gain/lose momentum proportional to approval shift
        for (const partyId of coalitionPartyIds) {
            const momDelta = Math.round(delta * cfg.FEEDBACK_COALITION_COEFF * 100) / 100;
            if (momDelta !== 0) {
                await adjustMomentumAll(supabase, nation.id, partyId, momDelta, 'gov_approval_shift');
            }
        }

        // Opposition benefits inversely (at reduced rate)
        const { data: oppParties } = await supabase
            .from('factions')
            .select('id')
            .eq('nation_id', nation.id)
            .eq('faction_type', 'party')
            .eq('is_npc', false);
        for (const opp of (oppParties || [])) {
            if (coalitionPartyIds.includes(opp.id)) continue;
            const momDelta = Math.round(-delta * cfg.FEEDBACK_OPPOSITION_COEFF * 100) / 100;
            if (momDelta !== 0) {
                await adjustMomentumAll(supabase, nation.id, opp.id, momDelta, 'gov_approval_shift');
            }
        }
    }

    console.log(`[GovApproval] ${nation.name}: ${govApproval} (inst=${Math.round(institutional)}, outcomes=${Math.round(outcomesScore)}, events=${Math.round(eventsComponent)}, vacancies=${vacantCount}, embattled=${embattledPenalty})`);

    return govApproval;
}

export async function processOngoingCosts(supabase, nation, currentTick) {
    const { data: activeLaws } = await supabase
        .from('active_laws')
        .select('*, policies(*)')
        .eq('nation_id', nation.id);

    if (!activeLaws || activeLaws.length === 0) return { totalCost: 0, details: [] };

    let totalCost = 0;
    const details = [];

    for (const law of activeLaws) {
        const policy = law.policies;
        if (!policy) continue;

        const baseCost = policy.ongoing_base_cost || policy.ongoing_cost_per_tick || 0;
        if (baseCost === 0) continue;

        let tickCost = baseCost;

        if (policy.ongoing_scaling_stat && nation[policy.ongoing_scaling_stat] !== undefined) {
            const scalingVal = Number(nation[policy.ongoing_scaling_stat]) || 1;
            const divisor = RAW_SCALING_DIVISORS[policy.ongoing_scaling_stat] || 50;
            tickCost = baseCost * (scalingVal / divisor);
        }

        totalCost += tickCost;

        const newAccum = (law.ongoing_accumulated || 0) + tickCost;
        await supabase.from('active_laws').update({
            ongoing_accumulated: newAccum
        }).eq('id', law.id);

        details.push({ policy: policy.policy_name, cost: tickCost });
    }

    // Policy costs are tracked in active_laws.ongoing_accumulated.

    return { totalCost, details };
}

// All columns that nations_history tracks (must match the DB table schema)
export const HISTORY_SNAPSHOT_COLUMNS = [
    ...NATION_STAT_COLUMNS,
    'gov_approval',
    'competition_voters', 'liberty_voters', 'security_voters', 'globalism_voters',
    'progressive_voters', 'liberal_voters', 'moderate_voters', 'conservative_voters', 'nationalist_voters'
];

export async function snapshotNationHistory(supabase, nation, currentTick) {
    const snapshot = { nation_id: nation.id, tick: currentTick };

    for (const key of HISTORY_SNAPSHOT_COLUMNS) {
        if (nation[key] !== undefined && nation[key] !== null) {
            snapshot[key] = Number(nation[key]);
        }
    }

    const { error: snapError } = await supabase.from('nations_history').upsert(snapshot, {
        onConflict: 'nation_id,tick'
    });
    if (snapError) {
        console.error('[snapshotNationHistory] FAILED for nation', nation.id, 'tick', currentTick, ':', snapError.message);
    } else {
        console.log(`[snapshotNationHistory] Stored ${Object.keys(snapshot).length - 2} stats for nation ${nation.id} at tick ${currentTick}`);
    }
}

/**
 * Record current nation stat values into stat_history for trend calculations.
 * Called once per tick, before minister/government approval calculations.
 * Uses upsert to prevent duplicate rows if tick is re-processed.
 */
export async function recordStatHistory(supabase, nation, currentTick) {
    const rows = [];
    for (const statKey of NATION_STAT_COLUMNS) {
        const val = nation[statKey];
        if (val !== undefined && val !== null) {
            rows.push({ nation_id: nation.id, stat_name: statKey, value: Number(val), tick: currentTick });
        }
    }
    if (rows.length === 0) return;
    const { error } = await supabase.from('stat_history').upsert(rows, { onConflict: 'nation_id,stat_name,tick' });
    if (error) {
        console.error('[recordStatHistory] FAILED for nation', nation.id, 'tick', currentTick, ':', error.message);
    }
}


// ==================== EVENT TICK PROCESSOR ====================

export async function processEvents(supabase, nation, currentTick) {
    const { data: events } = await supabase
        .from('event_templates')
        .select('*, event_descriptions(*), event_triggers(*), event_effects(*)')
        .eq('is_active', true);

    if (!events || events.length === 0) return [];

    const { data: recentLog } = await supabase
        .from('event_log')
        .select('event_id, fired_at_tick')
        .eq('nation_id', nation.id)
        .order('fired_at_tick', { ascending: false })
        .limit(200);

    const lastFiredMap = {};
    for (const entry of (recentLog || [])) {
        if (!lastFiredMap[entry.event_id]) {
            lastFiredMap[entry.event_id] = entry.fired_at_tick;
        }
    }

    const firedEvents = [];

    for (const event of events) {
        const lastFired = lastFiredMap[event.id];
        if (lastFired !== undefined) {
            const ticksSince = currentTick - lastFired;
            if (ticksSince < event.cooldown_ticks) continue;
        }

        const triggers = event.event_triggers || [];
        if (triggers.length === 0) continue;

        let allTriggersPass = true;
        for (const trigger of triggers) {
            const statValue = nation[trigger.stat_key];
            if (statValue === null || statValue === undefined) {
                allTriggersPass = false;
                break;
            }
            const val = Number(statValue);
            if (trigger.min_value !== null && trigger.min_value !== undefined && val < trigger.min_value) {
                allTriggersPass = false;
                break;
            }
            if (trigger.max_value !== null && trigger.max_value !== undefined && val > trigger.max_value) {
                allTriggersPass = false;
                break;
            }
        }
        if (!allTriggersPass) continue;

        const roll = Math.random() * 100;
        if (roll >= event.probability) continue;

        const descriptions = event.event_descriptions || [];
        let description = descriptions.length > 0
            ? descriptions[Math.floor(Math.random() * descriptions.length)].description_text
            : event.name;

        // Resolve placeholders in event description
        description = description.replace(/\{nation\}/g, nation.name || 'Unknown');

        const effects = event.event_effects || [];
        const appliedEffects = [];
        const nationUpdates = {};

        for (const effect of effects) {
            // Normalize + validate stat_key for nation targets
            const rawEvtStatKey = effect.stat_key;
            const evtStatKey = (effect.target === 'nation') ? normalizeNationStatKey(rawEvtStatKey) : rawEvtStatKey;
            if (effect.target === 'nation' && (!evtStatKey || !NATION_STAT_COLUMN_SET.has(evtStatKey))) {
                console.warn(`[processEvents] Skipping invalid stat_key "${rawEvtStatKey}" in event "${event.name}" for ${nation.name}`);
                continue;
            }

            if (effect.target === 'nation') {
                const currentVal = nation[evtStatKey] !== undefined
                    ? Number(nation[evtStatKey]) : 50;
                const newVal = Math.max(0, Math.min(100, currentVal + effect.change_value));
                nationUpdates[evtStatKey] = newVal;
                nation[evtStatKey] = newVal;

                appliedEffects.push({
                    stat: evtStatKey, change: effect.change_value,
                    target: 'nation', old: currentVal, new: newVal
                });

            } else if (effect.target === 'ruling_party') {
                const rulingId = nation.ruling_faction_id;
                if (!rulingId) continue;

                const { data: faction } = await supabase
                    .from('factions')
                    .select(effect.stat_key)
                    .eq('id', rulingId)
                    .single();

                if (faction) {
                    const currentVal = faction[effect.stat_key] ?? 50;
                    const newVal = Math.max(0, Math.min(100, currentVal + effect.change_value));
                    await supabase.from('factions')
                        .update({ [effect.stat_key]: newVal })
                        .eq('id', rulingId);

                    appliedEffects.push({
                        stat: effect.stat_key, change: effect.change_value,
                        target: 'ruling_party', faction_id: rulingId,
                        old: currentVal, new: newVal
                    });
                }

            } else if (effect.target === 'random_faction') {
                const { data: factions } = await supabase
                    .from('factions')
                    .select('id, ' + effect.stat_key)
                    .eq('nation_id', nation.id)
                    .eq('faction_type', 'party')
                    .eq('is_npc', false);

                if (factions && factions.length > 0) {
                    const target = factions[Math.floor(Math.random() * factions.length)];
                    const currentVal = target[effect.stat_key] ?? 50;
                    const newVal = Math.max(0, Math.min(100, currentVal + effect.change_value));
                    await supabase.from('factions')
                        .update({ [effect.stat_key]: newVal })
                        .eq('id', target.id);

                    appliedEffects.push({
                        stat: effect.stat_key, change: effect.change_value,
                        target: 'random_faction', faction_id: target.id,
                        old: currentVal, new: newVal
                    });
                }
            }
        }

        if (Object.keys(nationUpdates).length > 0) {
            await supabase.from('nations').update(nationUpdates).eq('id', nation.id);
        }

        const targetFactionId = appliedEffects.find(e => e.faction_id)?.faction_id || null;
        await supabase.from('event_log').insert({
            event_id: event.id,
            nation_id: nation.id,
            event_name: event.name,
            faction_id: targetFactionId,
            description_used: description,
            effects_applied: appliedEffects,
            category: event.category,
            fired_at_tick: currentTick
        });

        firedEvents.push({
            eventName: event.name,
            category: event.category,
            description: description,
            effects: appliedEffects
        });

        console.log(`Event fired: "${event.name}" in ${nation.name} (tick ${currentTick})`);
    }

    return firedEvents;
}


// ==================== CRISIS TICK PROCESSOR ====================

/**
 * Process persistent crises for a nation.
 * - Activates crises when ALL trigger conditions are met
 * - Applies effects every tick while active
 * - Deactivates crises when ALL recovery conditions are met
 * - Effects cascade: nation stats, government/coalition approval, minister approval
 */
export async function processCrises(supabase, nation, currentTick) {
    // 1. Load all active crisis templates
    const { data: crisisTemplates } = await supabase
        .from('crisis_templates')
        .select('*, crisis_triggers(*), crisis_effects(*), crisis_end_triggers(*)')
        .eq('is_active', true);

    if (!crisisTemplates || crisisTemplates.length === 0) return [];

    // 2. Load currently active crises for this nation
    const { data: activeCrisisRecords } = await supabase
        .from('active_crises')
        .select('*')
        .eq('nation_id', nation.id);

    const activeMap = {};
    for (const ac of (activeCrisisRecords || [])) {
        activeMap[ac.crisis_id] = ac;
    }

    const crisisEvents = [];
    const nationUpdates = {};
    const statBounds = {}; // { stat_key: { floor: highestFloor, ceiling: lowestCeiling } }

    // 3. Check inactive crises for activation
    for (const template of crisisTemplates) {
        if (activeMap[template.id]) continue; // already active
        if (template.id === GOVERNMENT_SHUTDOWN_CRISIS_ID) continue; // managed by dedicated shutdown code

        const triggers = template.crisis_triggers || [];
        if (triggers.length === 0) continue;

        let allTriggersMet = true;
        for (const trigger of triggers) {
            const resolvedKey = normalizeNationStatKey(trigger.stat_key) || trigger.stat_key;
            const statValue = nation[resolvedKey];
            if (statValue === null || statValue === undefined) {
                allTriggersMet = false;
                break;
            }
            const val = Number(statValue);
            if (trigger.operator === 'gte' && val < Number(trigger.threshold)) {
                allTriggersMet = false;
                break;
            }
            if (trigger.operator === 'lte' && val > Number(trigger.threshold)) {
                allTriggersMet = false;
                break;
            }
        }

        if (!allTriggersMet) continue;

        // Activate the crisis
        const { data: newActive, error: insertErr } = await supabase
            .from('active_crises')
            .insert({
                crisis_id: template.id,
                nation_id: nation.id,
                started_at_tick: currentTick,
                effects_applied_log: []
            })
            .select()
            .single();

        if (insertErr) {
            console.warn('Crisis activation insert failed:', insertErr.message);
            continue;
        }

        activeMap[template.id] = newActive;

        // Log to event_log
        await supabase.from('event_log').insert({
            nation_id: nation.id,
            event_name: 'CRISIS_STARTED: ' + template.name,
            description_used: template.description || template.name,
            category: 'crisis',
            effects_applied: [],
            fired_at_tick: currentTick
        });

        crisisEvents.push({
            type: 'crisis_started',
            crisisName: template.name,
            description: template.description,
            tick: currentTick
        });

        console.log(`Crisis activated: "${template.name}" in ${nation.name} (tick ${currentTick})`);
    }

    // 4. Process active crises: apply effects first, then check end triggers
    //    (Applying effects before deactivation check prevents crisis flicker when
    //     a crisis's own effects push a stat to exactly the deactivation threshold.)
    for (const template of crisisTemplates) {
        const activeRecord = activeMap[template.id];
        if (!activeRecord) continue;

        // 4a. Idempotency guard: skip if effects already applied for this tick
        const priorLog = activeRecord.effects_applied_log || [];
        if (priorLog.some(entry => entry.tick === currentTick)) {
            console.log(`[processCrises] Skipping "${template.name}" for ${nation.name} — already applied at tick ${currentTick}`);
            continue;
        }

        // 4b. Apply effects every tick
        const effects = template.crisis_effects || [];
        const appliedEffects = [];

        for (const effect of effects) {
            const changePT = Number(effect.change_per_tick);
            if (!Number.isFinite(changePT)) {
                console.warn(`[processCrises] Skipping effect with non-numeric change_per_tick: "${effect.change_per_tick}" in crisis "${template.name}" for ${nation.name}`);
                continue;
            }
            const hasFloor = effect.stat_floor !== null && effect.stat_floor !== undefined;
            const floorVal = hasFloor ? Number(effect.stat_floor) : null;

            // Helper: clamp value respecting the per-effect floor/ceiling (for non-nation targets)
            // Round to 1dp to match processStatEffects and prevent floating-point drift.
            function clampWithFloor(current, raw) {
                if (isNaN(raw) || isNaN(current)) return current ?? 50;
                let v = Math.round(Math.max(0, Math.min(100, raw)) * 10) / 10;
                if (hasFloor) {
                    if (changePT < 0) v = Math.max(floorVal, v);   // floor
                    else if (changePT > 0) v = Math.min(floorVal, v); // ceiling
                }
                return v;
            }

            // Normalize + validate stat_key for nation targets
            const rawStatKey = effect.stat_key;
            const statKey = (effect.target === 'nation') ? normalizeNationStatKey(rawStatKey) : rawStatKey;
            if (effect.target === 'nation' && (!statKey || !NATION_STAT_COLUMN_SET.has(statKey))) {
                console.warn(`[processCrises] Skipping invalid stat_key "${rawStatKey}" in crisis "${template.name}" for ${nation.name}`);
                continue;
            }

            if (effect.target === 'nation') {
                const currentVal = nationUpdates[statKey] !== undefined
                    ? nationUpdates[statKey]
                    : (nation[statKey] !== undefined && nation[statKey] !== null
                        ? Number(nation[statKey]) : 50);

                // Basic 0-100 clamp + 1dp rounding; floor/ceiling enforcement deferred to final pass
                let newVal = Math.round(Math.max(0, Math.min(100, currentVal + changePT)) * 10) / 10;
                nationUpdates[statKey] = newVal;
                nation[statKey] = newVal;

                // Accumulate most-restrictive floor/ceiling bounds for final enforcement
                if (hasFloor) {
                    if (!statBounds[statKey]) statBounds[statKey] = {};
                    if (changePT < 0) {
                        const prev = statBounds[statKey].floor;
                        statBounds[statKey].floor = (prev !== undefined) ? Math.max(prev, floorVal) : floorVal;
                    } else if (changePT > 0) {
                        const prev = statBounds[statKey].ceiling;
                        statBounds[statKey].ceiling = (prev !== undefined) ? Math.min(prev, floorVal) : floorVal;
                    }
                }

                appliedEffects.push({
                    stat: statKey, change: changePT,
                    target: 'nation', old: currentVal, new: newVal
                });

            } else if (effect.target === 'government_approval' || effect.target === 'coalition_approval') {
                const coalition = await fetchActiveCoalition(supabase, nation.id);
                const partyIds = coalition?.party_ids || [];
                for (const partyId of partyIds) {
                    await adjustMomentumAll(supabase, nation.id, partyId, changePT, 'crisis:' + template.name);
                    appliedEffects.push({
                        stat: 'momentum', change: changePT,
                        target: effect.target, faction_id: partyId
                    });
                }
                // Also push to gov approval events component
                await adjustGovernmentApprovalEvent(supabase, nation.id, changePT, 'crisis:' + template.name);

            } else if (effect.target === 'pm_approval') {
                const { data: pmMinistry } = await supabase
                    .from('ministries')
                    .select('minister_approval, party_id')
                    .eq('nation_id', nation.id)
                    .eq('ministry_key', 'prime_minister')
                    .eq('is_active', true)
                    .maybeSingle();

                if (pmMinistry) {
                    const currentVal = pmMinistry.minister_approval ?? 50;
                    const newVal = clampWithFloor(currentVal, currentVal + changePT);
                    const { error: pmUpdErr } = await supabase.from('ministries')
                        .update({ minister_approval: newVal })
                        .eq('nation_id', nation.id)
                        .eq('ministry_key', 'prime_minister')
                        .eq('is_active', true);
                    if (pmUpdErr) console.error(`[processCrises] Failed to update PM approval for ${nation.name}:`, pmUpdErr.message);

                    appliedEffects.push({
                        stat: 'minister_approval', change: changePT,
                        target: 'pm_approval', minister_key: 'prime_minister',
                        old: currentVal, new: newVal
                    });

                    // Cascade PM approval loss to party momentum (2x multiplier)
                    if (changePT < 0 && pmMinistry.party_id) {
                        const cascadeDelta = -(Math.abs(changePT) * 2);
                        await adjustMomentumAll(supabase, nation.id, pmMinistry.party_id, cascadeDelta, 'crisis:pm_cascade:' + template.name);

                        appliedEffects.push({
                            stat: 'momentum', change: cascadeDelta,
                            target: 'minister_cascade', faction_id: pmMinistry.party_id,
                            minister_key: 'prime_minister'
                        });
                    }
                }

            } else if (effect.target === 'minister_approval') {
                const { data: ministry } = await supabase
                    .from('ministries')
                    .select('minister_approval, party_id')
                    .eq('nation_id', nation.id)
                    .eq('ministry_key', effect.minister_key)
                    .eq('is_active', true)
                    .maybeSingle();

                if (ministry) {
                    const currentVal = ministry.minister_approval ?? 50;
                    const newVal = clampWithFloor(currentVal, currentVal + changePT);
                    const { error: minUpdErr } = await supabase.from('ministries')
                        .update({ minister_approval: newVal })
                        .eq('nation_id', nation.id)
                        .eq('ministry_key', effect.minister_key)
                        .eq('is_active', true);
                    if (minUpdErr) console.error(`[processCrises] Failed to update ${effect.minister_key} approval for ${nation.name}:`, minUpdErr.message);

                    appliedEffects.push({
                        stat: 'minister_approval', change: changePT,
                        target: 'minister_approval', minister_key: effect.minister_key,
                        old: currentVal, new: newVal
                    });

                    // Cascade minister approval loss to party momentum (2x for PM, 1x for others)
                    if (changePT < 0 && ministry.party_id) {
                        const loss = Math.abs(changePT);
                        const multiplier = effect.minister_key === 'prime_minister' ? 2 : 1;
                        const cascadeDelta = -(loss * multiplier);
                        await adjustMomentumAll(supabase, nation.id, ministry.party_id, cascadeDelta, 'crisis:minister_cascade:' + effect.minister_key);

                        appliedEffects.push({
                            stat: 'momentum', change: cascadeDelta,
                            target: 'minister_cascade', faction_id: ministry.party_id,
                            minister_key: effect.minister_key
                        });
                    }
                }
            }
        }

        // Update effects log on the active crisis record
        const logEntry = { tick: currentTick, effects: appliedEffects };
        const existingLog = activeRecord.effects_applied_log || [];
        // Keep last 50 entries to prevent unbounded growth
        if (existingLog.length >= 50) existingLog.shift();
        existingLog.push(logEntry);
        await supabase.from('active_crises')
            .update({ effects_applied_log: existingLog })
            .eq('id', activeRecord.id);

        if (appliedEffects.length > 0) {
            crisisEvents.push({
                type: 'crisis_effects',
                crisisName: template.name,
                effects: appliedEffects,
                tick: currentTick
            });
        }

        // 4c. Check end / recovery triggers AFTER effects applied (prevents flicker)
        const endTriggers = template.crisis_end_triggers || [];
        let allEndConditionsMet = endTriggers.length > 0;

        for (const endTrigger of endTriggers) {
            const resolvedEndKey = normalizeNationStatKey(endTrigger.stat_key) || endTrigger.stat_key;
            const statValue = nation[resolvedEndKey];
            if (statValue === null || statValue === undefined) {
                allEndConditionsMet = false;
                break;
            }
            const val = Number(statValue);
            if (endTrigger.operator === 'gte' && val < Number(endTrigger.threshold)) {
                allEndConditionsMet = false;
                break;
            }
            if (endTrigger.operator === 'lte' && val > Number(endTrigger.threshold)) {
                allEndConditionsMet = false;
                break;
            }
        }

        if (allEndConditionsMet) {
            // Deactivate the crisis (effects already applied this final tick)
            await supabase.from('active_crises').delete().eq('id', activeRecord.id);
            delete activeMap[template.id];

            await supabase.from('event_log').insert({
                nation_id: nation.id,
                event_name: 'CRISIS_RESOLVED: ' + template.name,
                description_used: 'The crisis "' + template.name + '" has been resolved.',
                category: 'crisis',
                effects_applied: [],
                fired_at_tick: currentTick
            });

            crisisEvents.push({
                type: 'crisis_resolved',
                crisisName: template.name,
                duration: currentTick - activeRecord.started_at_tick,
                tick: currentTick
            });

            console.log(`Crisis resolved: "${template.name}" in ${nation.name} (tick ${currentTick}, duration: ${currentTick - activeRecord.started_at_tick} ticks)`);
        }
    }

    // 4d. Enforce most-restrictive floor/ceiling bounds across all crises
    for (const [stat, bounds] of Object.entries(statBounds)) {
        let val = nationUpdates[stat];
        if (val === undefined) continue;
        if (bounds.floor !== undefined) val = Math.max(bounds.floor, val);
        if (bounds.ceiling !== undefined) val = Math.min(bounds.ceiling, val);
        val = Math.round(val * 10) / 10;
        nationUpdates[stat] = val;
        nation[stat] = val;
    }

    // 5. Bulk update nation stats
    if (Object.keys(nationUpdates).length > 0) {
        const { error: crisisUpdateErr } = await supabase.from('nations').update(nationUpdates).eq('id', nation.id);
        if (crisisUpdateErr) {
            console.error(`[processCrises] Nation stat update FAILED for ${nation.name}:`, crisisUpdateErr.message, JSON.stringify(nationUpdates));
        } else {
            console.log(`[processCrises] Nation stats updated for ${nation.name}:`, JSON.stringify(nationUpdates));
        }
    }

    return crisisEvents;
}


// ==================== DEMOCRATIC REVOLUTION ====================

/**
 * Process democratic revolution for autocracies.
 * Triggers when: stability < 15, freedom_index > 50, civil_unrest > 70 (Autocracy only).
 * Random 13-22 tick duration. Per-tick: stability -1, civil_unrest +1, intl_reputation -1.
 * Avertable if ANY trigger condition breaks. Fires regime change if duration expires.
 */
export async function processRevolution(supabase, nation, currentTick) {
    // Only autocracies can have democratic revolutions
    if (!isAutocracy(nation)) {
        if (nation.revolution_started_tick != null) {
            await supabase.from('nations').update({ revolution_started_tick: null, revolution_duration: null }).eq('id', nation.id);
            nation.revolution_started_tick = null;
            nation.revolution_duration = null;
        }
        return null;
    }

    // Re-fetch nation to get post-effect stat values (processStatEffects etc. update DB but not in-memory)
    const { data: freshNation } = await supabase.from('nations').select('*').eq('id', nation.id).single();
    if (freshNation) Object.assign(nation, freshNation);

    // Check all trigger conditions
    const conditionsMet =
        Number(nation.stability) < 15 &&
        Number(nation.freedom_index) > 50 &&
        Number(nation.civil_unrest) > 70;

    const crisisActive = nation.revolution_started_tick != null;

    // Conditions NOT met — avert if active
    if (!conditionsMet) {
        if (crisisActive) {
            await supabase.from('nations').update({ revolution_started_tick: null, revolution_duration: null }).eq('id', nation.id);
            nation.revolution_started_tick = null;
            nation.revolution_duration = null;

            await supabase.from('event_log').insert({
                nation_id: nation.id,
                event_name: 'REVOLUTION_AVERTED',
                description_used: 'The revolutionary movement has lost momentum. The regime has stabilized — for now.',
                category: 'crisis',
                effects_applied: [],
                fired_at_tick: currentTick
            });
            console.log(`[Revolution] AVERTED for ${nation.name} at tick ${currentTick}`);
        }
        return null;
    }

    // --- Conditions ARE met ---

    // Apply per-tick effects (stability -1, civil_unrest +1, intl_reputation -1)
    const newStability = Math.max(0, Math.round((Number(nation.stability) - 1) * 10) / 10);
    const newUnrest = Math.min(100, Math.round((Number(nation.civil_unrest) + 1) * 10) / 10);
    const newReputation = Math.max(0, Math.round((Number(nation.international_reputation) - 1) * 10) / 10);

    await supabase.from('nations').update({
        stability: newStability,
        civil_unrest: newUnrest,
        international_reputation: newReputation
    }).eq('id', nation.id);
    Object.assign(nation, { stability: newStability, civil_unrest: newUnrest, international_reputation: newReputation });

    // START new crisis
    if (!crisisActive) {
        const duration = Math.floor(Math.random() * 10) + 13; // 13-22 ticks
        await supabase.from('nations').update({
            revolution_started_tick: currentTick,
            revolution_duration: duration
        }).eq('id', nation.id);
        nation.revolution_started_tick = currentTick;
        nation.revolution_duration = duration;

        await supabase.from('event_log').insert({
            nation_id: nation.id,
            event_name: 'REVOLUTION_WARNING',
            description_used: 'Pro-democracy demonstrations have erupted across multiple cities. Opposition groups are calling for free elections. The regime must act to restore order — or face revolution.',
            category: 'crisis',
            effects_applied: [
                { stat: 'stability', change: -1, target: 'nation' },
                { stat: 'civil_unrest', change: 1, target: 'nation' },
                { stat: 'international_reputation', change: -1, target: 'nation' }
            ],
            fired_at_tick: currentTick
        });
        console.log(`[Revolution] WARNING — crisis started for ${nation.name}, duration ${duration} ticks`);
        return { phase: 'warning', nation: nation.name, tick: currentTick, duration };
    }

    // ONGOING crisis — check if duration expired
    const ticksElapsed = currentTick - nation.revolution_started_tick;
    const duration = Number(nation.revolution_duration);

    if (ticksElapsed < duration) {
        // Not yet expired — log escalation
        const remaining = duration - ticksElapsed;
        await supabase.from('event_log').insert({
            nation_id: nation.id,
            event_name: 'REVOLUTION_ESCALATION',
            description_used: `The revolutionary movement grows stronger. General strikes have paralyzed the capital. International observers are calling for dialogue. ${remaining} tick${remaining !== 1 ? 's' : ''} remain before the regime falls.`,
            category: 'crisis',
            effects_applied: [
                { stat: 'stability', change: -1, target: 'nation' },
                { stat: 'civil_unrest', change: 1, target: 'nation' },
                { stat: 'international_reputation', change: -1, target: 'nation' }
            ],
            fired_at_tick: currentTick
        });
        console.log(`[Revolution] ESCALATION — ${nation.name}, ${remaining} ticks remaining`);
        return { phase: 'escalation', nation: nation.name, tick: currentTick, remaining };
    }

    // === REVOLUTION FIRES ===
    console.log(`[Revolution] REVOLUTION FIRES for ${nation.name} at tick ${currentTick}`);

    // 1. Pick new government type randomly
    const newGovType = Math.random() < 0.5 ? CANONICAL_GOVERNMENT_TYPES.PARLIAMENTARY_DEMOCRACY : CANONICAL_GOVERNMENT_TYPES.PRESIDENTIAL_REPUBLIC;
    const govLabel = newGovType === CANONICAL_GOVERNMENT_TYPES.PRESIDENTIAL_REPUBLIC ? 'Presidential Democracy' : 'Parliamentary Democracy';

    // 2. Close current administration and dissolve government/ministries
    try {
        const { data: shardData } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
        await closeAdministration(supabase, nation.id, nation, 'revolution', currentTick, shardData?.current_date || '', null);
    } catch (err) {
        console.warn('[Revolution] Could not close administration:', err);
    }
    try {
        await dissolveCoalition(supabase, nation.id);
    } catch (err) {
        console.warn('[Revolution] Could not dissolve coalition:', err);
    }

    // 3. Update nation stats
    const newFreedomIndex = Math.min(100, Math.round((Number(nation.freedom_index) + 15) * 10) / 10);
    const newIntlRep = Math.min(100, Math.round((Number(nation.international_reputation) + 5) * 10) / 10);
    const nationUpdates = {
        government_type: newGovType,
        ruling_faction_id: null,
        stability: 30,
        freedom_index: newFreedomIndex,
        civil_unrest: 40,
        international_reputation: newIntlRep,
        revolution_started_tick: null,
        revolution_duration: null
    };
    await supabase.from('nations').update(nationUpdates).eq('id', nation.id);
    Object.assign(nation, nationUpdates);

    // 3b. Clear all active crises — revolution resets the political landscape
    await supabase.from('active_crises').delete().eq('nation_id', nation.id);

    // 4. Reset all faction bloc approvals to 50
    const { data: allFactions } = await supabase
        .from('factions')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');

    if (allFactions && allFactions.length > 0) {
        for (const faction of allFactions) {
            await supabase.from('faction_bloc_approval')
                .update({ preference_score: 50, momentum: 0 })
                .eq('faction_id', faction.id);
            await recalcDerivedApproval(supabase, faction.id);
        }
    }

    // 4b. Reset all faction loyalty to 50
    await supabase.from('factions')
        .update({ loyalty: 50 })
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');

    // 5. Flag factions for rebuild
    await supabase.from('factions')
        .update({ needs_rebuild: true })
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');

    // 5b. Freeze all active bills — government has fallen
    await supabase.from('bills')
        .update({ status: 'frozen' })
        .eq('nation_id', nation.id)
        .in('status', ['committee', 'floor']);

    // 6. Schedule emergency election in 3 ticks
    await supabase.from('elections').delete()
        .eq('nation_id', nation.id).eq('status', 'scheduled');

    const electionType = newGovType === CANONICAL_GOVERNMENT_TYPES.PRESIDENTIAL_REPUBLIC ? 'presidential' : 'parliamentary';
    const { error: electionErr } = await supabase.from('elections').insert({
        nation_id: nation.id,
        election_tick: currentTick + 3,
        status: 'scheduled',
        election_type: electionType
    });
    if (electionErr) {
        console.error('[Revolution] Election insert failed, retrying:', electionErr);
        await supabase.from('elections').insert({
            nation_id: nation.id,
            election_tick: currentTick + 3,
            status: 'scheduled',
            election_type: electionType
        });
    }

    // 7. Log the revolution event
    await supabase.from('event_log').insert({
        nation_id: nation.id,
        event_name: 'DEMOCRATIC_REVOLUTION',
        description_used: `The people have risen. The autocratic regime has fallen. A ${govLabel} has been established — emergency elections will determine the first freely elected government.`,
        category: 'crisis',
        effects_applied: [
            { stat: 'government_type', change: `Autocracy → ${govLabel}`, target: 'nation' },
            { stat: 'stability', change: '→ 30', target: 'nation' },
            { stat: 'freedom_index', change: '+15', target: 'nation' },
            { stat: 'civil_unrest', change: '→ 40', target: 'nation' },
            { stat: 'international_reputation', change: '+5', target: 'nation' }
        ],
        fired_at_tick: currentTick
    });

    console.log(`[Revolution] COMPLETE — ${nation.name} is now a ${govLabel}. Emergency ${electionType} election at tick ${currentTick + 3}`);
    return { phase: 'revolution', nation: nation.name, tick: currentTick, newGovType: govLabel, electionTick: currentTick + 3 };
}



// ==================== UTILITY FORMATTERS ====================

export function formatStatName(stat) {
    return stat.charAt(0).toUpperCase() + stat.slice(1).replace(/_/g, ' ');
}

export function formatMinorSector(key) {
    return key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}


// ==================== PM CANDIDATE SYSTEM ====================

export const PM_FIRST_NAMES = [
    'Alejandro', 'Camila', 'Diego', 'Valentina', 'Mateo', 'Isabela', 'Sebastián', 'Luca',
    'Andrés', 'Gabriel', 'Joaquín', 'Mariana', 'Carlos', 'Tomas', 'Rafael', 'Edwin',
    'Emilio', 'Catalina', 'Fernando', 'Renata'
];

export const PM_LAST_NAMES = [
    'Velasco', 'Mendoza', 'Guerrero', 'Salazar', 'Castillo', 'Herrera', 'Morales', 'Ríos',
    'Delgado', 'Espinoza', 'Guzmán', 'Navarro', 'Córdoba', 'Echeverría', 'Pacheco', 'Montero',
    'Aguilar', 'Valenzuela', 'Carrasco', 'Ibarra'
];

export const IDEOLOGY_OPTIONS = [
    { tag: 'LIBERTY',         axisKey: 'liberty_equality',             direction: -1 },
    { tag: 'EQUALITY',        axisKey: 'liberty_equality',             direction: 1 },
    { tag: 'TRADITION',       axisKey: 'tradition_progress',           direction: -1 },
    { tag: 'PROGRESS',        axisKey: 'tradition_progress',           direction: 1 },
    { tag: 'SECURITY',        axisKey: 'security_freedom',             direction: -1 },
    { tag: 'FREEDOM',         axisKey: 'security_freedom',             direction: 1 },
    { tag: 'NATIONALISM',     axisKey: 'globalism_nationalism',        direction: -1 },
    { tag: 'GLOBALISM',       axisKey: 'globalism_nationalism',        direction: 1 },
    { tag: 'INDIVIDUALISM',   axisKey: 'individualism_collectivism',   direction: -1 },
    { tag: 'COLLECTIVISM',    axisKey: 'individualism_collectivism',   direction: 1 }
];

export const PM_TRAIT_KEYS = [
    'dealmaker', 'showman', 'ideologue', 'economist', 'reformer',
    'iron_will', 'popular_champion', 'militarist', 'diplomat',
    'media_darling', 'hardliner', 'technocrat', 'survivor', 'firebrand'
];

export async function generatePMCandidates(supabase, nationId, factionId, currentTick) {
    const factionIdeology = await loadFactionIdeology(supabase, factionId);

    await supabase
        .from('pm_candidates')
        .delete()
        .eq('nation_id', nationId)
        .eq('faction_id', factionId)
        .eq('selected', false);

    const weightedIdeologies = getWeightedIdeologies(factionIdeology);

    const chosenIdeologies = [];
    const availableIdeologies = [...weightedIdeologies];
    for (let i = 0; i < 3; i++) {
        const pick = weightedRandomPick(availableIdeologies);
        chosenIdeologies.push(pick.item);
        const sameAxis = availableIdeologies.filter(
            wi => wi.item.axisKey === pick.item.axisKey
        );
        sameAxis.forEach(sa => {
            const idx = availableIdeologies.indexOf(sa);
            if (idx >= 0) availableIdeologies.splice(idx, 1);
        });
    }

    const shuffledTraits = [...PM_TRAIT_KEYS].sort(() => Math.random() - 0.5);
    const chosenTraits = shuffledTraits.slice(0, 3);

    const usedFirstNames = new Set();
    const usedLastNames = new Set();
    const candidates = [];

    for (let i = 0; i < 3; i++) {
        let firstName, lastName;

        do { firstName = PM_FIRST_NAMES[Math.floor(Math.random() * PM_FIRST_NAMES.length)]; }
        while (usedFirstNames.has(firstName));
        usedFirstNames.add(firstName);

        do { lastName = PM_LAST_NAMES[Math.floor(Math.random() * PM_LAST_NAMES.length)]; }
        while (usedLastNames.has(lastName));
        usedLastNames.add(lastName);

        const age = 35 + Math.floor(Math.random() * 16);
        const ideology = chosenIdeologies[i];

        candidates.push({
            nation_id: nationId,
            faction_id: factionId,
            first_name: firstName,
            last_name: lastName,
            age: age,
            ideology: ideology.tag,
            ideology_axis: ideology.axisKey,
            ideology_direction: ideology.direction,
            trait_key: chosenTraits[i],
            created_at_tick: currentTick,
            selected: false
        });
    }

    const { data, error } = await supabase
        .from('pm_candidates')
        .insert(candidates)
        .select();

    if (error) {
        console.error('Error generating PM candidates:', error);
        throw error;
    }

    console.log(`Generated 3 PM candidates for faction ${factionId}`);
    return data;
}

export function getWeightedIdeologies(factionIdeology) {
    if (!factionIdeology) {
        return IDEOLOGY_OPTIONS.map(opt => ({ item: opt, weight: 10 }));
    }

    return IDEOLOGY_OPTIONS.map(opt => {
        const score = factionIdeology[opt.axisKey] || 0;
        const alignment = score * opt.direction;

        let weight;
        if (alignment > 40) {
            weight = 2;
        } else if (alignment > 15) {
            weight = 5;
        } else if (alignment > -15) {
            weight = 12;
        } else if (alignment > -40) {
            weight = 10;
        } else {
            weight = 8;
        }

        return { item: opt, weight };
    });
}

export function weightedRandomPick(weightedItems) {
    const totalWeight = weightedItems.reduce((sum, wi) => sum + wi.weight, 0);
    let random = Math.random() * totalWeight;

    for (const wi of weightedItems) {
        random -= wi.weight;
        if (random <= 0) return wi;
    }
    return weightedItems[weightedItems.length - 1];
}

export async function selectPMCandidate(supabase, candidateId, nationId, factionId, currentTick) {
    // Guard: coalition must be finalized ('formed') before a PM can be appointed
    const coalition = await fetchActiveCoalition(supabase, nationId);
    if (!coalition || (coalition.status !== 'formed' && coalition.status !== 'caretaker' && coalition._source !== 'presidential')) {
        throw new Error('Cannot appoint a Prime Minister until a coalition has been formed.');
    }

    const { data: candidate, error: fetchErr } = await supabase
        .from('pm_candidates')
        .select('*')
        .eq('id', candidateId)
        .single();

    if (fetchErr || !candidate) throw new Error('Candidate not found');
    if (candidate.faction_id !== factionId) throw new Error('Not your candidate');

    await supabase
        .from('pm_candidates')
        .update({ selected: true })
        .eq('id', candidateId);

    await supabase
        .from('pm_candidates')
        .delete()
        .eq('nation_id', nationId)
        .eq('faction_id', factionId)
        .eq('selected', false);

    await supabase
        .from('head_of_government')
        .update({ active: false })
        .eq('nation_id', nationId)
        .eq('active', true);

    const { error: hogErr } = await supabase
        .from('head_of_government')
        .upsert({
            nation_id: nationId,
            faction_id: factionId,
            candidate_id: candidateId,
            first_name: candidate.first_name,
            last_name: candidate.last_name,
            age: candidate.age,
            ideology: candidate.ideology,
            trait_key: candidate.trait_key,
            appointed_tick: currentTick,
            active: true
        }, { onConflict: 'nation_id' });

    if (hogErr) throw hogErr;

    // Update the open administration record with the newly appointed PM
    const pmFullName = `${candidate.first_name} ${candidate.last_name}`;
    const { error: adminUpdErr } = await supabase
        .from('administrations')
        .update({
            prime_minister: pmFullName,
            admin_name: `${candidate.last_name} Administration`,
            updated_at: new Date().toISOString()
        })
        .eq('nation_id', nationId)
        .is('ended_at_tick', null);
    if (adminUpdErr) console.warn('selectPMCandidate: could not update administration record:', adminUpdErr);

    // Update the prime_minister ministry row so ministry-actions picks it up
    const { data: pmMinistry } = await supabase.from('ministries')
        .select('id').eq('nation_id', nationId)
        .eq('ministry_key', 'prime_minister').eq('is_active', true)
        .maybeSingle();

    if (pmMinistry) {
        await supabase.from('ministries').update({
            party_id: factionId,
            minister_first_name: candidate.first_name,
            minister_last_name: candidate.last_name,
            minister_age: candidate.age,
            minister_approval: 50
        }).eq('id', pmMinistry.id);
    } else {
        await supabase.from('ministries').insert({
            nation_id: nationId,
            ministry_key: 'prime_minister',
            ministry_name: 'Prime Minister',
            is_active: true,
            party_id: factionId,
            minister_first_name: candidate.first_name,
            minister_last_name: candidate.last_name,
            minister_age: candidate.age,
            minister_approval: 50
        });
    }

    const axisKey = candidate.ideology_axis;
    const shift = 15 * candidate.ideology_direction;

    let factionIdeology = await loadFactionIdeology(supabase, factionId);
    if (!factionIdeology) {
        const newRow = { faction_id: factionId, liberty_equality: 0, tradition_progress: 0, security_freedom: 0, globalism_nationalism: 0, individualism_collectivism: 0 };
        await supabase.from('faction_ideology').upsert(newRow, { onConflict: 'faction_id' });
        factionIdeology = newRow;
        console.warn(`Created missing faction_ideology row for faction ${factionId}`);
    }
    const currentVal = factionIdeology[axisKey] || 0;
    const newVal = Math.max(-100, Math.min(100, currentVal + shift));

    await supabase
        .from('faction_ideology')
        .update({ [axisKey]: newVal })
        .eq('faction_id', factionId);

    console.log(`Ideology shift: ${axisKey} ${currentVal} → ${newVal} (${shift > 0 ? '+' : ''}${shift})`);


    const { data: trait } = await supabase
        .from('leader_traits')
        .select('*')
        .eq('trait_key', candidate.trait_key)
        .single();

    if (trait?.effects) {
        const effects = trait.effects;

        if (effects.on_appoint_stability) {
            const { data: nation } = await supabase
                .from('nations')
                .select('stability')
                .eq('id', nationId)
                .single();

            if (nation) {
                const newStability = Math.max(0, Math.min(100, (nation.stability || 50) + effects.on_appoint_stability));
                await supabase
                    .from('nations')
                    .update({ stability: newStability })
                    .eq('id', nationId);

                console.log(`On-appoint stability: +${effects.on_appoint_stability} → ${newStability}`);
            }
        }

    }

    console.log(`PM selected: ${candidate.first_name} ${candidate.last_name} (${candidate.trait_key})`);
    return candidate;
}

export async function processPMTraitEffects(supabase, nation, currentTick) {
    let effects, factionId;

    if (isPresidentialRepublic(nation)) {
        // For presidential systems, use the active president's trait
        const { data: president } = await supabase
            .from('presidents')
            .select('faction_id, trait')
            .eq('nation_id', nation.id)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();

        if (!president?.trait) return;

        const { data: traitData } = await supabase
            .from('leader_traits')
            .select('effects')
            .eq('trait_key', president.trait)
            .single();

        if (!traitData?.effects) return;
        effects = traitData.effects;
        factionId = president.faction_id;
    } else {
        const { data: hog } = await supabase
            .from('head_of_government')
            .select('*, leader_traits(*)')
            .eq('nation_id', nation.id)
            .eq('active', true)
            .single();

        if (!hog || !hog.leader_traits?.effects) return;
        effects = hog.leader_traits.effects;
        factionId = hog.faction_id;
    }

    if (effects.party_approval_per_tick) {
        await adjustMomentumAll(supabase, nation.id, factionId, effects.party_approval_per_tick, 'pm_trait:party_approval');
    }

    if (effects.nation_stat_per_tick) {
        const updates = {};
        for (const [rawStat, delta] of Object.entries(effects.nation_stat_per_tick)) {
            const stat = normalizeNationStatKey(rawStat);
            if (!stat || !NATION_STAT_COLUMN_SET.has(stat)) {
                console.warn(`[processPMTraitEffects] Skipping invalid stat_key "${rawStat}" in PM trait for ${nation.name}`);
                continue;
            }
            const currentVal = nation[stat];
            if (currentVal !== undefined && currentVal !== null) {
                updates[stat] = Math.round(Math.max(0, Math.min(100, currentVal + delta)) * 10) / 10;
            }
        }
        if (Object.keys(updates).length > 0) {
            await supabase.from('nations').update(updates).eq('id', nation.id);
        }
    }

    if (effects.approval_below_50_bonus || effects.approval_above_60_penalty) {
        const { data: faction } = await supabase
            .from('factions')
            .select('approval_rating')
            .eq('id', factionId)
            .single();

        if (faction) {
            let delta = 0;
            if (faction.approval_rating < 50 && effects.approval_below_50_bonus) {
                delta = effects.approval_below_50_bonus;
            } else if (faction.approval_rating > 60 && effects.approval_above_60_penalty) {
                delta = effects.approval_above_60_penalty;
            }
            if (delta !== 0) {
                await adjustMomentumAll(supabase, nation.id, factionId, delta, 'pm_trait:conditional');
            }
        }
    }

    if (effects.opposition_approval_per_tick) {
        const { data: oppParties } = await supabase
            .from('factions')
            .select('id')
            .eq('nation_id', nation.id)
            .eq('faction_type', 'party')
            .neq('id', factionId);

        for (const opp of (oppParties || [])) {
            await adjustMomentumAll(supabase, nation.id, opp.id, effects.opposition_approval_per_tick, 'pm_trait:opposition');
        }
    }

    if (effects.no_bill_penalty_per_tick) {
        const { count } = await supabase
            .from('bills')
            .select('*', { count: 'exact', head: true })
            .eq('nation_id', nation.id)
            .eq('proposed_by', factionId)
            .eq('status', 'passed')
            .eq('passed_tick', currentTick - 1);

        if (!count || count === 0) {
            await adjustMomentumAll(supabase, nation.id, factionId, effects.no_bill_penalty_per_tick, 'pm_trait:no_bill_penalty');
        }
    }
}


// ==================== RESIGN PM ====================

export async function resignPM(supabase, nationId, factionId, currentTick) {
    const { data: hog } = await supabase
        .from('head_of_government')
        .select('*')
        .eq('nation_id', nationId)
        .eq('faction_id', factionId)
        .eq('active', true)
        .single();

    if (!hog) throw new Error('No active PM to resign');

    if (hog.trait_key === 'survivor') {
        throw new Error('A Survivor cannot resign. They cling to power.');
    }

    await supabase
        .from('head_of_government')
        .update({ active: false })
        .eq('id', hog.id);

    await adjustMomentumAll(supabase, nationId, factionId, -5, 'pm:resignation');

    const { data: nation } = await supabase
        .from('nations')
        .select('stability')
        .eq('id', nationId)
        .single();

    if (nation) {
        const newStability = Math.max(0, (nation.stability ?? 50) - 3);
        await supabase
            .from('nations')
            .update({ stability: newStability })
            .eq('id', nationId);
    }

    await supabase
        .from('factions')
        .update({ pm_cooldown_until: currentTick + 12 })
        .eq('id', factionId);

    if (hog.trait_key === 'iron_will') {
        console.log('Iron Will resignation — coalition collapses');
        try {
            const { data: fullNation } = await supabase.from('nations').select('*').eq('id', nationId).single();
            const { data: shard } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
            if (fullNation) {
                await closeAdministration(supabase, nationId, fullNation, 'coalition_collapse', currentTick, shard?.current_date || '', null);
            }
        } catch (adminErr) { console.warn('Could not close administration on iron_will collapse:', adminErr); }
        await dissolveCoalition(supabase, nationId);
        return { result: 'coalition_collapsed', reason: 'iron_will' };
    }

    const { data: govFormation } = await supabase
        .from('government_formations')
        .select('party_ids')
        .eq('nation_id', nationId)
        .eq('status', 'formed')
        .single();

    if (govFormation) {
        const partnerIds = (govFormation.party_ids || [])
            .filter(pid => pid !== factionId);

        const { data: partners } = await supabase
            .from('factions')
            .select('id, faction_name, seats, pm_cooldown_until')
            .in('id', partnerIds)
            .order('seats', { ascending: false });

        const eligible = (partners || []).find(p =>
            !p.pm_cooldown_until || p.pm_cooldown_until <= currentTick
        );

        if (eligible) {
            await generatePMCandidates(supabase, nationId, eligible.id, currentTick);
            console.log(`PM offered to ${eligible.faction_name}`);
            return {
                result: 'pm_offered',
                newPmPartyId: eligible.id,
                newPmPartyName: eligible.faction_name
            };
        }
    }

    console.log('No eligible partner — coalition collapsed');
    try {
        const { data: fullNation } = await supabase.from('nations').select('*').eq('id', nationId).single();
        const { data: shard } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
        if (fullNation) {
            await closeAdministration(supabase, nationId, fullNation, 'coalition_collapse', currentTick, shard?.current_date || '', null);
        }
    } catch (adminErr) { console.warn('Could not close administration on coalition collapse:', adminErr); }
    await dissolveCoalition(supabase, nationId);
    return { result: 'coalition_collapsed', reason: 'no_eligible_partner' };
}


// ==================== DISBAND PARTY ====================

export async function disbandParty(supabase, nationId, factionId, currentTick) {
    // 1. Cooldown check
    const { data: faction } = await supabase
        .from('factions')
        .select('disband_cooldown_until_tick, faction_name')
        .eq('id', factionId)
        .single();

    if (faction?.disband_cooldown_until_tick && faction.disband_cooldown_until_tick > currentTick) {
        const remaining = faction.disband_cooldown_until_tick - currentTick;
        throw new Error(`Disband is on cooldown for ${remaining} more tick${remaining !== 1 ? 's' : ''}.`);
    }

    // 2. Fetch nation for autocracy/ruling checks
    const { data: nation } = await supabase
        .from('nations')
        .select('ruling_faction_id, government_type')
        .eq('id', nationId)
        .single();

    // 2b. Autocracy ruling faction succession — transfer power to next most loyal faction
    if (isAutocracy(nation) && nation.ruling_faction_id === factionId) {
        const { data: otherFactions } = await supabase
            .from('factions')
            .select('id, loyalty')
            .eq('nation_id', nationId)
            .eq('faction_type', 'party')
            .neq('id', factionId)
            .order('loyalty', { ascending: false })
            .limit(1);

        const successor = otherFactions?.[0];
        if (successor) {
            await supabase.from('nations')
                .update({ ruling_faction_id: successor.id })
                .eq('id', nationId);
        } else {
            // No other factions — clear ruling faction
            await supabase.from('nations')
                .update({ ruling_faction_id: null })
                .eq('id', nationId);
        }

        // Remove departing faction's steward
        await supabase.from('stewards')
            .update({ is_alive: false })
            .eq('nation_id', nationId)
            .eq('faction_id', factionId);
    }

    // 3. PM check — if this faction is the active PM, resign first
    const { data: hog } = await supabase
        .from('head_of_government')
        .select('id, trait_key')
        .eq('nation_id', nationId)
        .eq('faction_id', factionId)
        .eq('active', true)
        .maybeSingle();

    let pmResigned = false;
    if (hog) {
        if (hog.trait_key === 'survivor') {
            throw new Error('Cannot disband while your PM has the Survivor trait. They cling to power.');
        }
        await resignPM(supabase, nationId, factionId, currentTick);
        pmResigned = true;
    }

    // 4. Coalition check — handle if in coalition but not PM (or PM resignation didn't dissolve)
    if (!pmResigned) {
        const { data: formations } = await supabase
            .from('government_formations')
            .select('id, lead_party_id, party_ids')
            .eq('nation_id', nationId)
            .in('status', ['formed', 'caretaker']);

        const myFormation = (formations || []).find(f =>
            (f.party_ids || []).includes(factionId)
        );

        if (myFormation) {
            if (myFormation.lead_party_id === factionId) {
                // Lead party disbanding — dissolve entire coalition
                await dissolveCoalition(supabase, nationId);
            } else {
                // Junior partner — remove from party_ids and vacate ministries
                const newPartyIds = (myFormation.party_ids || []).filter(id => id !== factionId);
                const { error: formErr } = await supabase
                    .from('government_formations')
                    .update({ party_ids: newPartyIds })
                    .eq('id', myFormation.id);
                if (formErr) console.warn('disbandParty: could not update formation party_ids:', formErr);

                const { error: minErr } = await supabase
                    .from('ministries')
                    .update({ party_id: null, minister_first_name: null, minister_last_name: null, minister_age: null })
                    .eq('nation_id', nationId)
                    .eq('party_id', factionId)
                    .eq('is_active', true);
                if (minErr) console.warn('disbandParty: could not vacate ministries:', minErr);
            }
        }
    }

    // 5. Core disband — null out nation_id, reset all stats to fresh defaults
    //    Do this BEFORE deletes so if it fails, no data is lost.
    const { error: disbandErr } = await supabase
        .from('factions')
        .update({
            nation_id: null,
            abandoned_at: new Date().toISOString(),
            disband_cooldown_until_tick: currentTick + 24,
            action_points: 0,
            seats: 0,
            approval_rating: null,
            last_seen_tick: null,
            founded_tick: null
        })
        .eq('id', factionId);

    if (disbandErr) throw new Error('Failed to disband party: ' + disbandErr.message);

    // 6. Clean up all faction-related data from the old nation
    //    Delete voter bloc approval/momentum rows, promises, donor trust, etc.
    await supabase.from('faction_bloc_approval').delete().eq('faction_id', factionId);
    await supabase.from('faction_ideology').delete().eq('faction_id', factionId);
    await supabase.from('ideology_history').delete().eq('faction_id', factionId);
    await supabase.from('momentum_log').delete().eq('faction_id', factionId);
    await supabase.from('fundraiser_promises').delete().eq('party_id', factionId);
    await supabase.from('donor_trust').delete().eq('party_id', factionId);
    await supabase.from('bill_support').delete().eq('faction_id', factionId);
    await supabase.from('campaign_actions').delete().eq('party_id', factionId);

    // 7. Audit log
    const { error: logErr } = await supabase
        .from('campaign_actions')
        .insert({
            party_id: factionId,
            nation_id: nationId,
            action_type: 'party_disbanded',
            tick_performed: currentTick,
            result: { faction_name: faction?.faction_name || 'Unknown' }
        });
    if (logErr) console.warn('disbandParty: could not log action:', logErr);

    return { result: 'disbanded' };
}


// ==================== INACTIVITY DECAY ====================

/**
 * Process inactivity penalties for idle factions in a nation.
 *
 * Rules (per tick, for each non-NPC faction with nation_id set):
 *   • ticksInactive = currentTick - (faction.last_seen_tick ?? faction.founded_tick ?? 0)
 *   • If ticksInactive > INACTIVITY_GRACE_TICKS (6) and < INACTIVITY_DISBAND_TICKS (12):
 *       – Lose INACTIVITY_MOMENTUM_DECAY (5) momentum with every voter bloc
 *       – Lose INACTIVITY_APPROVAL_DECAY (5) approval with every voter bloc
 *   • If ticksInactive >= INACTIVITY_DISBAND_TICKS (12):
 *       – Party is DISBANDED: removed from nation, seats zeroed, spot opened for new players
 *       – Ambassadors remain until their term expires
 *       – Ministries remain until the next election
 *
 * @returns {Array<{factionId, factionName, ticksInactive, momentumLost, approvalLost, disbanded?}>}
 */
export async function processInactivityDecay(supabase, nationId, currentTick) {
    const results = [];

    // Fetch all non-NPC factions in this nation
    const { data: factions } = await supabase
        .from('factions')
        .select('id, faction_name, last_seen_tick, founded_tick, faction_type')
        .eq('nation_id', nationId)
        .eq('faction_type', 'party')
        .eq('is_npc', false);

    if (!factions || factions.length === 0) return results;

    for (const faction of factions) {
        const lastActive = faction.last_seen_tick ?? faction.founded_tick ?? 0;
        const ticksInactive = currentTick - lastActive;

        if (ticksInactive <= GAME_CONFIG.INACTIVITY_GRACE_TICKS) continue;

        // At tick 12+, disband the party entirely
        if (ticksInactive >= GAME_CONFIG.INACTIVITY_DISBAND_TICKS) {
            console.log(`[InactivityDisband] "${faction.faction_name}" (${ticksInactive} ticks idle): DISBANDED from nation ${nationId}`);

            // Clean up faction-related data (but NOT ambassadors or ministries)
            await supabase.from('faction_bloc_approval').delete().eq('faction_id', faction.id);
            await supabase.from('faction_ideology').delete().eq('faction_id', faction.id);
            await supabase.from('ideology_history').delete().eq('faction_id', faction.id);
            await supabase.from('momentum_log').delete().eq('faction_id', faction.id);
            await supabase.from('fundraiser_promises').delete().eq('party_id', faction.id);
            await supabase.from('donor_trust').delete().eq('party_id', faction.id);
            await supabase.from('bill_support').delete().eq('faction_id', faction.id);
            await supabase.from('campaign_actions').delete().eq('party_id', faction.id);

            // Remove from nation, zero seats, set cooldown
            await supabase.from('factions')
                .update({
                    nation_id: null,
                    nation: null,
                    abandoned_at: new Date().toISOString(),
                    disband_cooldown_until_tick: currentTick + 24,
                    action_points: 0,
                    seats: 0,
                    approval_rating: null,
                    last_seen_tick: null,
                    founded_tick: null
                })
                .eq('id', faction.id);

            // Event log
            await supabase.from('event_log').insert({
                nation_id: nationId,
                event_name: 'PARTY_DISBANDED_INACTIVITY',
                description_used: `${faction.faction_name} has been dissolved due to prolonged inactivity (${ticksInactive} ticks idle). Their seats will be vacated at the next election. Ambassadors remain at their posts until their terms expire.`,
                category: 'POLITICAL',
                effects_applied: {
                    faction_id: faction.id,
                    faction_name: faction.faction_name,
                    ticks_inactive: ticksInactive,
                    seats_zeroed: true,
                    ambassadors_kept: true,
                    ministries_kept_until_election: true
                }
            });

            // Audit log
            await supabase.from('campaign_actions').insert({
                party_id: faction.id,
                nation_id: nationId,
                action_type: 'party_disbanded',
                tick_performed: currentTick,
                result: { faction_name: faction.faction_name, reason: 'inactivity', ticks_inactive: ticksInactive }
            });

            results.push({
                factionId: faction.id,
                factionName: faction.faction_name,
                ticksInactive,
                momentumLost: 0,
                approvalLost: 0,
                disbanded: true
            });
            continue;
        }

        // Ticks 7-11: gradual decay (-5 momentum, -5 approval per bloc per tick)
        const momentumPenalty = GAME_CONFIG.INACTIVITY_MOMENTUM_DECAY;
        const approvalPenalty = GAME_CONFIG.INACTIVITY_APPROVAL_DECAY;

        const entry = {
            factionId: faction.id,
            factionName: faction.faction_name,
            ticksInactive,
            momentumLost: 0,
            approvalLost: 0
        };

        // Apply momentum and approval penalties to every voter bloc
        const { data: blocRows } = await supabase
            .from('faction_bloc_approval')
            .select('id, momentum, approval')
            .eq('faction_id', faction.id);

        if (blocRows && blocRows.length > 0) {
            for (const row of blocRows) {
                const oldMomentum = Number(row.momentum ?? 0);
                const newMomentum = Math.max(-50, Math.round((oldMomentum - momentumPenalty) * 100) / 100);

                const oldApproval = Number(row.approval ?? 40);
                const newApproval = Math.max(0, oldApproval - approvalPenalty);

                await supabase.from('faction_bloc_approval')
                    .update({ momentum: newMomentum, approval: newApproval })
                    .eq('id', row.id);
            }

            entry.momentumLost = momentumPenalty;
            entry.approvalLost = approvalPenalty;

            // Audit log for momentum loss
            await supabase.from('momentum_log').insert({
                nation_id: nationId,
                faction_id: faction.id,
                bloc_id: null,
                amount: -momentumPenalty,
                source: 'inactivity_decay',
                tick: currentTick
            });

            console.log(`[InactivityDecay] "${faction.faction_name}" (${ticksInactive} ticks idle): -${momentumPenalty} momentum, -${approvalPenalty} approval across ${blocRows.length} blocs`);
        }

        results.push(entry);
    }

    return results;
}

