/**
 * political-actions.js — Political actions, tick processors, crises, events, resign PM, disband party
 * Extracted from game-common.js
 */

import { deductAP, GAME_CONFIG } from './config.js';
import { CANONICAL_GOVERNMENT_TYPES, isAutocracy, isPresidentialRepublic } from './government-types.js';
import { RAW_SCALING_DIVISORS, STAT_PROCESSOR_SKIP } from './diplomacy-constants.js';
import { IDEOLOGY_OPPOSITES, IDEOLOGY_TO_AXIS, loadFactionIdeology, computeIdeologyAlignment } from './ideology.js';
import { MINISTER_APPROVAL_CONFIG, ISSUE_CATEGORY_STATS, MINISTRY_TO_STATS, NATION_STAT_COLUMNS, NATION_STAT_COLUMN_SET, STAT_DECAY_CONFIG, STAT_TO_MINISTRY, buildMinistryBaselines, getAveragedInstitutionDecay, normalizeNationStatKey, statDirectionSign, buildFundingPctMap, getInstFundingPct } from './stats.js';
import { adjustGovernmentApprovalEvent, adjustMomentum, adjustMomentumAll } from './momentum.js';
import { fetchActiveCoalition } from './government-structure.js';
import { recalcDerivedApproval } from './bills.js';
import { closeAdministration, createAdministration, dissolveCoalition } from './elections.js';
import { getTraitAPModifier, applyRallyTraitModifiers, getTraitApprovalMultiplier, getEffectiveBlocDisposition } from './party-leadership.js';

const _MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
function _tickToDate(tick) {
    return `${_MONTHS[tick % 12]}, ${2000 + Math.floor(tick / 12)}`;
}

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
/**
 * Build a map of policy-driven decay floor/ceiling adjustments for a nation.
 * Queries active_laws → policies and aggregates adjust_type/adjust_value
 * from stat_effects. Adjustments stack additively across multiple policies.
 *
 * @returns {{ [statKey: string]: { floor: number, ceiling: number } }}
 */
export async function buildPolicyDecayAdjustments(supabase, nationId) {
    const adjustments = {};

    const { data: activeLaws, error } = await supabase
        .from('active_laws')
        .select('policy_id, policies(stat_effects)')
        .eq('nation_id', nationId);

    if (error || !activeLaws) return adjustments;

    for (const law of activeLaws) {
        const effects = law.policies?.stat_effects;
        if (!Array.isArray(effects)) continue;

        for (const eff of effects) {
            if (!eff.adjust_type || !eff.adjust_value) continue;
            const statKey = normalizeNationStatKey(eff.stat_key);
            if (!statKey || !NATION_STAT_COLUMN_SET.has(statKey)) continue;

            if (!adjustments[statKey]) adjustments[statKey] = { floor: 0, ceiling: 0 };

            const val = Math.abs(Number(eff.adjust_value) || 0);
            if (eff.adjust_type === 'floor') {
                adjustments[statKey].floor += val;
            } else if (eff.adjust_type === 'ceiling') {
                adjustments[statKey].ceiling += val;
            }
        }
    }

    return adjustments;
}

export async function processStatDecay(supabase, nation, statInstitutionMap, policyDecayAdjustments = null) {
    const appliedDecay = [];
    const nationUpdates = {};

    for (const [statKey, config] of Object.entries(STAT_DECAY_CONFIG)) {
        if (!NATION_STAT_COLUMN_SET.has(statKey)) continue;

        const currentVal = nation[statKey] !== undefined && nation[statKey] !== null
            ? Number(nation[statKey]) : 50;
        let target = config.target;

        // Apply policy-driven floor/ceiling adjustments to the decay target
        const adj = policyDecayAdjustments?.[statKey];
        if (adj) {
            if (adj.floor > 0) {
                // Floor: raise the target so the stat won't decay below it
                target = Math.min(100, target + adj.floor);
            }
            if (adj.ceiling > 0) {
                // Ceiling: lower the target so the stat decays down toward it
                target = Math.max(0, target - adj.ceiling);
            }
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
        // GDP and debt are driven by dedicated systems — skip
        if (STAT_PROCESSOR_SKIP.has(conn.target_stat)) continue;

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

        // Raw-value stats (gdp, debt, population) must not be clamped to 0-100
        if (RAW_SCALING_DIVISORS[conn.target_stat]) {
            newVal = Math.max(0, newVal);
        } else {
            newVal = Math.round(Math.max(0, Math.min(100, newVal)) * 10) / 10;
        }

        if (newVal !== Math.round(targetVal * 10) / 10) {
            // Accumulate — multiple connections can affect the same target
            if (nationUpdates[conn.target_stat] !== undefined) {
                // Add delta on top of already-accumulated value
                const prevDelta = nationUpdates[conn.target_stat] - targetVal;
                const thisDelta = newVal - targetVal;
                const accumulated = targetVal + prevDelta + thisDelta;
                nationUpdates[conn.target_stat] = RAW_SCALING_DIVISORS[conn.target_stat]
                    ? Math.max(0, accumulated)
                    : Math.round(Math.max(0, Math.min(100, accumulated)) * 10) / 10;
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

    // High approval → more rousing (thresholds calibrated for 45/55 pillar weights)
    if (blocApproval > 45) {
        weights.rousing += 12; weights.low -= 5; weights.gaffe -= 4;
    } else if (blocApproval < 20) {
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
    // ── 1. Validate AP (with leader trait modifiers) ──
    const { data: faction } = await supabase
        .from('factions').select('action_points, leader_positive_traits, leader_negative_traits, last_action_tick').eq('id', factionId).single();
    if (!faction) return { success: false, error: 'Faction not found.' };
    const rallyApMod = getTraitAPModifier('rally', faction, currentTick);
    const effectiveRallyCost = Math.max(1, RALLY_CONFIG.AP_COST + rallyApMod);
    if ((faction.action_points || 0) < effectiveRallyCost)
        return { success: false, error: `Not enough AP. Need ${effectiveRallyCost}.` };

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
    // Apply leader trait modifiers to rally weights (crowd_pleaser, wooden_speaker)
    applyRallyTraitModifiers(weights, faction);
    // Re-clamp after trait modifiers
    for (const k of Object.keys(weights)) weights[k] = Math.max(1, weights[k]);
    const total = Object.values(weights).reduce((s, v) => s + v, 0);
    for (const k of Object.keys(weights)) weights[k] = Math.round((weights[k] / total) * 100);

    const outcomeId = rollRallyOutcome(weights);
    const outcome = RALLY_OUTCOMES.find(o => o.id === outcomeId);

    // ── 6. Roll specific target effect (with telegenic multiplier) ──
    let targetDelta = outcome.targetMin + Math.floor(Math.random() * (outcome.targetMax - outcome.targetMin + 1));
    if (targetDelta > 0) {
        const mult = getTraitApprovalMultiplier(faction, 'rally', 'SWING'); // generic multiplier for rally
        targetDelta = Math.round(targetDelta * mult);
    }

    // ── 7. Apply effects ──
    // ── 7. Apply effects (momentum only — preference_score recalculated by three-pillar calc) ──
    const effects = [];
    const targetRow = approvalByBloc[blocId];
    if (targetRow) {
        const oldMom = Number(targetRow.momentum || 0);
        const newMom = Math.max(-50, Math.min(50, Math.round((oldMom + targetDelta) * 100) / 100));
        await supabase.from('faction_bloc_approval')
            .update({ momentum: newMom }).eq('id', targetRow.id);
        effects.push({ bloc: targetBloc.bloc_name, blocId, value: targetDelta, oldMom, newMom });
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
            const oldMom = Number(row.momentum || 0);
            const newMom = Math.max(-50, Math.min(50, Math.round((oldMom + outcome.spillover) * 100) / 100));
            await supabase.from('faction_bloc_approval')
                .update({ momentum: newMom }).eq('id', row.id);
            effects.push({ bloc: sb.bloc_name, blocId: sb.id, value: outcome.spillover, oldMom, newMom });
        }
    }

    // Polarization effect
    if (outcome.polarization > 0 && nation) {
        const newPol = Math.min(100, (nation.polarization || 0) + outcome.polarization);
        await supabase.from('nations').update({ polarization: newPol }).eq('id', nationId);
        effects.push({ stat: 'Polarization', value: outcome.polarization });
    }

    // ── 8. Deduct AP + track last_action_tick ──
    const apResult = await deductAP(supabase, factionId, effectiveRallyCost);
    await supabase.from('factions').update({ last_action_tick: currentTick }).eq('id', factionId).then(({ error }) => { if (error) console.warn('[Rally] last_action_tick update failed:', error.message); });

    // ── 9. Log ──
    const headline = outcome.headline(targetBloc.bloc_name);
    await supabase.from('campaign_actions').insert({
        party_id: factionId,
        nation_id: nationId,
        action_type: 'rally',
        ap_cost: effectiveRallyCost,
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
        newAp: apResult.newAp ?? ((faction.action_points || 0) - effectiveRallyCost),
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
 * Delegates to the canonical computeIdeologyAlignment in ideology.js.
 */
export function computeOutreachAlignment(factionIdeology, bloc) {
    return computeIdeologyAlignment(factionIdeology, bloc);
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
    // ── 1. Validate AP (with leader trait modifiers) ──
    const { data: faction } = await supabase
        .from('factions').select('action_points, leader_positive_traits, leader_negative_traits, last_action_tick').eq('id', factionId).single();
    if (!faction) return { success: false, error: 'Faction not found.' };
    const outreachApMod = getTraitAPModifier('outreach', faction, currentTick);
    const effectiveOutreachCost = Math.max(1, OUTREACH_CONFIG.AP_COST + outreachApMod);
    if ((faction.action_points || 0) < effectiveOutreachCost)
        return { success: false, error: `Not enough AP. Need ${effectiveOutreachCost}.` };

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
    let { diminished } = calcOutreachEffect(alignment, recentToBloc);

    // Apply leader trait multipliers: telegenic (+30%), divisive_figure (halved for non-BASE)
    const targetPrefScore = approvalByBloc[blocId]?.preference_score || 0;
    const blocDisp = targetPrefScore >= 55 ? 'BASE' : targetPrefScore >= 42 ? 'LEAN' : targetPrefScore >= 30 ? 'SWING' : targetPrefScore >= 18 ? 'SKEPTICAL' : 'HOSTILE';
    const effectiveDisp = getEffectiveBlocDisposition(blocDisp, faction);
    // Use effective disposition for trait modifiers (populist_touch makes SKEPTICAL act as SWING)
    let outreachMult = getTraitApprovalMultiplier(faction, 'outreach', effectiveDisp);
    // populist_touch/elitist: disposition reclassification affects outreach effectiveness
    if (effectiveDisp !== blocDisp) {
        if (effectiveDisp === 'SWING' && blocDisp === 'SKEPTICAL') outreachMult *= 1.25; // easier to reach
        if (effectiveDisp === 'HOSTILE' && blocDisp === 'SKEPTICAL') outreachMult *= 0.5;  // harder to reach
    }
    if (outreachMult !== 1.0) {
        diminished = Math.max(1, Math.round(diminished * outreachMult));
    }

    // ── 7. Apply target bloc effect (momentum only — preference_score recalculated by three-pillar calc) ──
    const effects = [];
    const targetRow = approvalByBloc[blocId];
    if (targetRow) {
        const oldMom = Number(targetRow.momentum || 0);
        const newMom = Math.max(-50, Math.min(50, Math.round((oldMom + diminished) * 100) / 100));
        await supabase.from('faction_bloc_approval')
            .update({ momentum: newMom }).eq('id', targetRow.id);
        effects.push({ bloc: targetBloc.bloc_name, blocId, value: diminished, oldMom, newMom });
    }

    // ── 8. Apply friction to opposed blocs ──
    const frictions = calcOutreachFriction(targetBloc, allBlocs || [], factionIdeo);
    for (const fri of frictions) {
        const row = approvalByBloc[fri.blocId];
        if (!row) continue;
        const oldMom = Number(row.momentum || 0);
        const newMom = Math.max(-50, Math.min(50, Math.round((oldMom + fri.penalty) * 100) / 100));
        await supabase.from('faction_bloc_approval')
            .update({ momentum: newMom }).eq('id', row.id);
        effects.push({ bloc: fri.blocName, blocId: fri.blocId, value: fri.penalty, oldMom, newMom });
    }

    // ── 9. Deduct AP + track last_action_tick ──
    const apResult = await deductAP(supabase, factionId, effectiveOutreachCost);
    await supabase.from('factions').update({ last_action_tick: currentTick }).eq('id', factionId).then(({ error }) => { if (error) console.warn('[Outreach] last_action_tick update failed:', error.message); });

    // ── 10. Log ──
    await supabase.from('campaign_actions').insert({
        party_id: factionId,
        nation_id: nationId,
        action_type: 'outreach',
        ap_cost: effectiveOutreachCost,
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
        newAp: apResult.newAp ?? ((faction.action_points || 0) - effectiveOutreachCost),
    };
}

/**
 * Set or change a party endorsement preference.
 *
 * Rules:
 * - First endorsement preference for a faction is free.
 * - Changing to a different endorsed faction costs 1 AP (atomic deduct_ap RPC).
 * - Re-selecting the same endorsed faction is a no-op (no AP cost).
 * - Always writes a campaign_actions audit row with a reason string.
 */
export async function executeEndorsementPreference(supabase, factionId, nationId, endorsedFactionId, currentTick, reason = 'endorsement_preference_update') {
    if (!factionId || !nationId || !endorsedFactionId) {
        return { success: false, error: 'Missing endorsement parameters.' };
    }

    const normalizedReason = String(reason || 'endorsement_preference_update').trim() || 'endorsement_preference_update';

    const { data: existingPref, error: prefErr } = await supabase
        .from('faction_endorsements')
        .select('id, endorsed_faction_id')
        .eq('faction_id', factionId)
        .maybeSingle();
    if (prefErr) {
        return { success: false, error: prefErr.message || 'Failed to load endorsement preference.' };
    }

    let newAp = null;
    let apCharged = 0;
    const existingTarget = existingPref?.endorsed_faction_id || null;

    // First preference: create for free
    if (!existingPref) {
        const { error: insertErr } = await supabase.from('faction_endorsements').insert({
            faction_id: factionId,
            nation_id: nationId,
            endorsed_faction_id: endorsedFactionId,
            updated_at_tick: currentTick
        });
        if (insertErr) {
            return { success: false, error: insertErr.message || 'Failed to create endorsement preference.' };
        }
    }
    // Same target: no AP charge, but refresh timestamp for history visibility
    else if (existingTarget === endorsedFactionId) {
        const { error: sameErr } = await supabase
            .from('faction_endorsements')
            .update({ updated_at_tick: currentTick })
            .eq('id', existingPref.id);
        if (sameErr) {
            return { success: false, error: sameErr.message || 'Failed to keep endorsement preference.' };
        }
    }
    // Preference change: charge 1 AP through atomic RPC
    else {
        const apResult = await deductAP(supabase, factionId, 1);
        if (!apResult.success) {
            return { success: false, error: apResult.error || 'Not enough AP to change endorsement.' };
        }
        newAp = apResult.newAp;
        apCharged = 1;

        const { error: updateErr } = await supabase
            .from('faction_endorsements')
            .update({
                endorsed_faction_id: endorsedFactionId,
                updated_at_tick: currentTick
            })
            .eq('id', existingPref.id);
        if (updateErr) {
            return { success: false, error: updateErr.message || 'Failed to update endorsement preference.' };
        }
    }

    await supabase.from('campaign_actions').insert({
        party_id: factionId,
        nation_id: nationId,
        action_type: 'endorsement_preference',
        tick_performed: currentTick,
        ap_cost: apCharged,
        result: {
            reason: normalizedReason,
            previous_endorsed_faction_id: existingTarget,
            endorsed_faction_id: endorsedFactionId,
            ap_charged: apCharged
        }
    });

    return {
        success: true,
        newAp,
        apCharged,
        changed: existingTarget !== endorsedFactionId,
        alreadySelected: existingTarget === endorsedFactionId
    };
}


// ==================== ATTACK CAMPAIGN ====================

export const ATTACK_CONFIG = {
    AP_COST: 3,
    CREDIBILITY_COST: 20,       // credibility drops 20 per attack
    COOLDOWN_WINDOW: 6,         // look back 6 ticks for recent attacks
    COUNTER_ATTACK_WINDOW: 3,   // target can counter-attack within 3 ticks
    COUNTER_ATTACK_AP_COST: 1,  // counter-attack costs only 1 AP
    COUNTER_ATTACK_BONUS: 2,    // +2 effectiveness bonus for counter-attacks
};

export const ATTACK_VECTORS = [
    {
        id: 'broken_promises',
        name: 'Broken Promises',
        icon: '\u2605',
        description: 'Attack their failure to deliver on commitments',
        evidence_required: true,
        effectiveness: 'high',
    },
    {
        id: 'voting_record',
        name: 'Voting Record',
        icon: '\u00A7',
        description: 'Highlight unpopular or controversial votes',
        evidence_required: true,
        effectiveness: 'high',
    },
    {
        id: 'governance',
        name: 'Governance Record',
        icon: '\u25BC',
        description: 'Attack stat deterioration on their watch',
        evidence_required: true,
        effectiveness: 'high',
    },
    {
        id: 'ideology',
        name: 'Ideology',
        icon: '\u25C6',
        description: 'Frame their positions as extreme or out of touch',
        evidence_required: false,
        effectiveness: 'moderate',
    },
    {
        id: 'smear',
        name: 'General Smear',
        icon: '\u25CF',
        description: 'No specific ammunition \u2014 just negative framing',
        evidence_required: false,
        effectiveness: 'low',
    },
];

export const ATTACK_OUTCOMES = [
    { id: 'devastating', name: 'Devastating Hit', icon: '\u2726', targetMin: -7, targetMax: -5, selfMin: 3, selfMax: 3, polarization: 0.25 },
    { id: 'effective', name: 'Effective Attack', icon: '\u25CF', targetMin: -4, targetMax: -3, selfMin: 1, selfMax: 2, polarization: 0.25 },
    { id: 'glancing', name: 'Glancing Blow', icon: '\u25E6', targetMin: -1, targetMax: -1, selfMin: 0, selfMax: 0, polarization: 0.25 },
    { id: 'backfire', name: 'Backfire', icon: '\u26A0', targetMin: 1, targetMax: 2, selfMin: -4, selfMax: -2, polarization: 0.25 },
    { id: 'mutual', name: 'Mutual Destruction', icon: '\u2715', targetMin: -3, targetMax: -3, selfMin: -2, selfMax: -2, polarization: 0.25 },
];

/**
 * Get outcome probability weights based on evidence strength.
 */
export function getAttackOutcomeWeights(strength) {
    if (strength === 'strong') {
        return { devastating: 22, effective: 38, glancing: 22, backfire: 8, mutual: 10 };
    } else if (strength === 'moderate') {
        return { devastating: 10, effective: 28, glancing: 30, backfire: 18, mutual: 14 };
    } else {
        return { devastating: 4, effective: 18, glancing: 30, backfire: 30, mutual: 18 };
    }
}

/**
 * Roll an attack outcome from weighted probabilities.
 */
function rollAttackOutcome(weights) {
    const order = ['devastating', 'effective', 'glancing', 'backfire', 'mutual'];
    let sum = 0;
    const cumulative = [];
    for (const key of order) {
        sum += weights[key] || 0;
        cumulative.push({ id: key, threshold: sum });
    }
    const roll = Math.random() * sum;
    for (const c of cumulative) {
        if (roll <= c.threshold) return c.id;
    }
    return 'glancing';
}

/**
 * Generate a contextual headline for the attack outcome.
 */
function _attackHeadline(outcomeId, targetName, vectorId) {
    const headlines = {
        devastating: {
            broken_promises: `Damning evidence of ${targetName}'s broken promises dominates news cycle`,
            voting_record: `${targetName}'s voting record exposed \u2014 public outrage mounts`,
            governance: `${targetName}'s governance failures laid bare in devastating critique`,
            ideology: `${targetName} branded as extremists in viral opposition campaign`,
            smear: `Relentless attacks leave ${targetName} scrambling to respond`,
        },
        effective: {
            broken_promises: `Opposition research into ${targetName}'s failed promises gains traction`,
            voting_record: `${targetName}'s controversial votes draw media scrutiny`,
            governance: `Questions mount over ${targetName}'s record on key indicators`,
            ideology: `Voters question ${targetName}'s ideological direction after critique`,
            smear: `Negative campaign against ${targetName} lands some punches`,
        },
        glancing: {
            broken_promises: `Attack on ${targetName}'s promises fails to resonate with voters`,
            voting_record: `Criticism of ${targetName}'s votes dismissed as political theatre`,
            governance: `Governance critique against ${targetName} falls flat`,
            ideology: `Ideological attack on ${targetName} largely ignored by public`,
            smear: `Smear campaign against ${targetName} fizzles \u2014 voters indifferent`,
        },
        backfire: {
            broken_promises: `Promise attack on ${targetName} backfires \u2014 sympathy for target surges`,
            voting_record: `Voters rally behind ${targetName} after what they see as unfair attack`,
            governance: `Governance critique seen as hypocritical \u2014 attacker's credibility drops`,
            ideology: `Ideological attack makes attackers look petty \u2014 ${targetName} gains sympathy`,
            smear: `Baseless smear against ${targetName} draws media rebuke`,
        },
        mutual: {
            broken_promises: `Ugly exchange over broken promises leaves both parties damaged`,
            voting_record: `Mudslinging over voting records erodes public trust in politics`,
            governance: `Governance blame game leaves all sides worse off`,
            ideology: `Ideological warfare between parties leaves voters disgusted`,
            smear: `Negative spiral damages both parties \u2014 polarization spikes`,
        },
    };
    return (headlines[outcomeId] && headlines[outcomeId][vectorId])
        || `Attack campaign against ${targetName} produces ${outcomeId} result`;
}

/**
 * Gather attack evidence (broken promises, controversial votes, stat deterioration)
 * for a target party. Used by the UI to show available attack vectors.
 */
export async function gatherAttackEvidence(supabase, targetFactionId, nationId, currentTick) {
    const evidence = {
        broken_promises: [],
        controversial_votes: [],
        governance_record: [],
        is_governing: false,
    };

    // 1. Broken promises (last 30 ticks)
    const { data: brokenPromises } = await supabase
        .from('fundraiser_promises')
        .select('id, demand_text, bloc_name, tick_resolved, tick_created')
        .eq('party_id', targetFactionId)
        .eq('status', 'broken')
        .gte('tick_resolved', currentTick - 30)
        .order('tick_resolved', { ascending: false })
        .limit(5);

    evidence.broken_promises = (brokenPromises || []).map(p => ({
        text: p.demand_text,
        bloc: p.bloc_name,
        tick: p.tick_resolved,
    }));

    // 2. Controversial votes — bills where this party voted opposite to majority outcome
    const { data: recentBills } = await supabase
        .from('bills')
        .select('id, bill_name, status, bill_support(faction_id, stance), bill_articles(policy_id, policies(policy_name))')
        .eq('nation_id', nationId)
        .in('status', ['passed', 'failed', 'enacted'])
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(30);

    for (const bill of (recentBills || [])) {
        const support = bill.bill_support || [];
        const targetVote = support.find(s => s.faction_id === targetFactionId);
        if (!targetVote) continue;

        // Controversial = voted against a bill that passed, or voted for a bill that failed
        const controversial =
            (bill.status === 'passed' || bill.status === 'enacted') && targetVote.stance === 'reject' ||
            bill.status === 'failed' && targetVote.stance === 'accept';

        if (controversial) {
            evidence.controversial_votes.push({
                bill: bill.bill_name,
                stance: targetVote.stance,
                outcome: bill.status,
            });
        }
    }
    evidence.controversial_votes = evidence.controversial_votes.slice(0, 5);

    // 3. Governance record — check if target is in governing coalition
    const coalition = await fetchActiveCoalition(supabase, nationId);
    const coalitionPartyIds = new Set(coalition?.party_ids || []);
    evidence.is_governing = coalitionPartyIds.has(targetFactionId);

    if (evidence.is_governing) {
        // Find ministries held by this party
        const { data: ministries } = await supabase
            .from('ministries')
            .select('ministry_key')
            .eq('nation_id', nationId)
            .eq('party_id', targetFactionId)
            .eq('is_active', true);

        if (ministries && ministries.length > 0) {
            // Check stat trends for stats under their ministries
            for (const m of ministries) {
                const stats = MINISTRY_TO_STATS[m.ministry_key] || [];
                for (const statKey of stats) {
                    const { data: history } = await supabase
                        .from('stat_history')
                        .select('value, tick')
                        .eq('nation_id', nationId)
                        .eq('stat_name', statKey)
                        .order('tick', { ascending: false })
                        .limit(6);

                    if (history && history.length >= 2) {
                        const newest = history[0].value;
                        const oldest = history[history.length - 1].value;
                        const change = newest - oldest;
                        const sign = statDirectionSign(statKey);
                        // Stat worsened if it moved opposite to its "good" direction
                        if ((sign === 1 && change < -3) || (sign === -1 && change > 3)) {
                            const changeStr = change > 0 ? `+${Math.round(change)}` : `${Math.round(change)}`;
                            evidence.governance_record.push({
                                stat: statKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                                change: changeStr,
                                ministry: m.ministry_key,
                            });
                        }
                    }
                }
            }
        }
        evidence.governance_record = evidence.governance_record.slice(0, 5);
    }

    return evidence;
}

/**
 * Build available attack vectors for a target based on gathered evidence.
 */
export function buildAttackVectors(evidence) {
    const vectors = [];

    if (evidence.broken_promises.length > 0) {
        vectors.push({
            ...ATTACK_VECTORS[0],
            evidence: evidence.broken_promises,
            strength: 'strong',
        });
    }

    if (evidence.controversial_votes.length > 0) {
        vectors.push({
            ...ATTACK_VECTORS[1],
            evidence: evidence.controversial_votes,
            strength: 'strong',
        });
    }

    if (evidence.governance_record.length > 0 && evidence.is_governing) {
        vectors.push({
            ...ATTACK_VECTORS[2],
            evidence: evidence.governance_record,
            strength: 'strong',
        });
    }

    // Ideology is always available (moderate strength)
    vectors.push({
        ...ATTACK_VECTORS[3],
        evidence: null,
        strength: 'moderate',
    });

    // General smear is always available (weak strength)
    vectors.push({
        ...ATTACK_VECTORS[4],
        evidence: null,
        strength: 'weak',
    });

    return vectors;
}

/**
 * Execute an attack campaign against a target party.
 * Returns { success, outcomeId, outcomeName, headline, effects, weights, opensCounter, newAp }
 */
export async function executeAttack(supabase, factionId, nationId, targetFactionId, vectorId, currentTick) {
    // ── 1. Validate AP (with leader trait modifiers) ──
    const { data: faction } = await supabase
        .from('factions').select('action_points, faction_name, leader_positive_traits, leader_negative_traits, last_action_tick').eq('id', factionId).single();
    if (!faction) return { success: false, error: 'Faction not found.' };
    const attackApMod = getTraitAPModifier('attack', faction, currentTick);
    const effectiveAttackCost = Math.max(1, ATTACK_CONFIG.AP_COST + attackApMod);
    if ((faction.action_points || 0) < effectiveAttackCost)
        return { success: false, error: `Not enough AP. Need ${effectiveAttackCost}.` };

    // ── 2. Load target ──
    const { data: targetFaction } = await supabase
        .from('factions').select('faction_name, abbreviation').eq('id', targetFactionId).single();
    if (!targetFaction) return { success: false, error: 'Target party not found.' };

    // ── 3. Check recent attacks (cooldown) ──
    const { data: recentAttacks } = await supabase
        .from('campaign_actions')
        .select('tick_performed, result')
        .eq('party_id', factionId)
        .eq('action_type', 'attack')
        .gte('tick_performed', currentTick - ATTACK_CONFIG.COOLDOWN_WINDOW)
        .order('tick_performed', { ascending: false });

    const attackedThisTick = (recentAttacks || []).some(r => r.tick_performed === currentTick);
    if (attackedThisTick)
        return { success: false, error: 'Already launched an attack this tick.' };

    // ── 4. Gather evidence and validate vector ──
    const evidence = await gatherAttackEvidence(supabase, targetFactionId, nationId, currentTick);
    const vectors = buildAttackVectors(evidence);
    const vector = vectors.find(v => v.id === vectorId);
    if (!vector) return { success: false, error: 'Invalid attack vector.' };
    if (vector.evidence_required && (!vector.evidence || vector.evidence.length === 0))
        return { success: false, error: `No evidence available for ${vector.name}.` };

    // ── 5. Roll outcome ──
    const weights = getAttackOutcomeWeights(vector.strength);
    const outcomeId = rollAttackOutcome(weights);
    const outcome = ATTACK_OUTCOMES.find(o => o.id === outcomeId);

    // ── 6. Calculate effects ──
    const targetDelta = outcome.targetMin + Math.floor(Math.random() * (outcome.targetMax - outcome.targetMin + 1));
    const selfDelta = outcome.selfMin + Math.floor(Math.random() * (outcome.selfMax - outcome.selfMin + 1));

    // ── 7. Apply effects to all blocs via momentum ──
    const effects = [];

    // Target party: apply momentum to all blocs
    if (targetDelta !== 0) {
        await adjustMomentumAll(supabase, nationId, targetFactionId, targetDelta, 'campaign:attack_target');
        effects.push({ label: targetFaction.faction_name, value: targetDelta });
    }

    // Self: apply momentum to all blocs
    if (selfDelta !== 0) {
        const selfLabel = selfDelta > 0 ? 'Your party (credibility gain)' : 'Your party (credibility loss)';
        await adjustMomentumAll(supabase, nationId, factionId, selfDelta, 'campaign:attack_self');
        effects.push({ label: selfLabel, value: selfDelta });
    }

    // Polarization
    if (outcome.polarization > 0) {
        const { data: nation } = await supabase
            .from('nations').select('polarization').eq('id', nationId).single();
        if (nation) {
            const newPol = Math.min(100, (nation.polarization || 0) + outcome.polarization);
            await supabase.from('nations').update({ polarization: newPol }).eq('id', nationId);
        }
        effects.push({ label: 'Polarization', value: outcome.polarization });
    }

    // ── 8. Deduct AP + track last_action_tick ──
    const apResult = await deductAP(supabase, factionId, effectiveAttackCost);
    await supabase.from('factions').update({ last_action_tick: currentTick }).eq('id', factionId).then(({ error }) => { if (error) console.warn('[Attack] last_action_tick update failed:', error.message); });

    // ── 9. Generate headline ──
    const headline = _attackHeadline(outcomeId, targetFaction.faction_name, vectorId);

    // ── 10. Log action ──
    const opensCounter = ['devastating', 'effective'].includes(outcomeId);
    await supabase.from('campaign_actions').insert({
        party_id: factionId,
        nation_id: nationId,
        action_type: 'attack',
        ap_cost: effectiveAttackCost,
        money_cost: 0,
        tick_performed: currentTick,
        result: {
            targetFactionId,
            targetName: targetFaction.faction_name,
            targetAbbrev: targetFaction.abbreviation,
            vectorId,
            vectorName: vector.name,
            strength: vector.strength,
            outcomeId,
            outcomeName: outcome.name,
            headline,
            effects,
            weights,
            opensCounter,
            counterWindowEnd: opensCounter ? currentTick + ATTACK_CONFIG.COUNTER_ATTACK_WINDOW : null,
        }
    });

    return {
        success: true,
        outcomeId,
        outcomeName: outcome.name,
        headline,
        effects,
        weights,
        opensCounter,
        newAp: apResult.newAp ?? ((faction.action_points || 0) - ATTACK_CONFIG.AP_COST),
    };
}


// ==================== MAKE PROMISE ====================

export const MAKE_PROMISE_CONFIG = {
    AP_COST: 2,
    STAT_DELTA: 10,                    // Promise to change stat by ±10
    STAT_DELTA_GOVERNING: 20,          // Governing factions must promise ±20 (harder target)
    DEADLINE_DICE: 12,                 // 1D12 + base
    DEADLINE_BASE: 12,                 // base ticks added to roll (range: 13-24)
    APPROVAL_ON_PROMISE_STAT: 4,       // immediate bump with affected blocs (stat type)
    APPROVAL_ON_PROMISE_CRISIS: 2,     // immediate bump with all blocs (crisis type)
    APPROVAL_IF_KEPT: 12,              // permanent legacy reward
    PENALTY_PER_TICK_MIN: 1,           // -1D3 per tick while governing & unfulfilled
    PENALTY_PER_TICK_MAX: 3,
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

    // ── 1. Validate faction (with leader trait modifiers) ──
    const { data: faction } = await supabase
        .from('factions').select('party_funds, action_points, abbreviation, faction_name, leader_positive_traits, leader_negative_traits, last_action_tick')
        .eq('id', factionId).single();
    if (!faction) return { success: false, error: 'Faction not found.' };

    const promiseApMod = getTraitAPModifier('promise', faction, currentTick);
    const effectivePromiseCost = Math.max(1, cfg.AP_COST + promiseApMod);
    if (effectivePromiseCost > 0 && (faction.action_points || 0) < effectivePromiseCost)
        return { success: false, error: `Not enough AP. Need ${effectivePromiseCost}.` };

    // ── 2. Check active promise limit ──
    const { data: activePromises } = await supabase
        .from('fundraiser_promises')
        .select('id, demand_type, conditions')
        .eq('party_id', factionId)
        .eq('status', 'active');

    if ((activePromises || []).length >= cfg.MAX_ACTIVE_PROMISES)
        return { success: false, error: `Maximum ${cfg.MAX_ACTIVE_PROMISES} active promises reached.` };

    // ── 2b. Check per-tick rate limit (max 1 promise per tick) ──
    const { data: promisesThisTick } = await supabase
        .from('fundraiser_promises')
        .select('id')
        .eq('party_id', factionId)
        .eq('tick_created', currentTick);
    if ((promisesThisTick || []).length >= 1)
        return { success: false, error: 'You can only make 1 promise per tick.' };

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

    // ── 4. Roll deadline: 1D12 + 12 ──
    const deadlineRoll = Math.floor(Math.random() * cfg.DEADLINE_DICE) + 1;
    const deadlineTicks = deadlineRoll + cfg.DEADLINE_BASE;
    const tickDeadline = currentTick + deadlineTicks;

    // ── 5. Build promise based on type ──
    let demandText, demandType, conditions, affectedBlocIds, affectedBlocNames;

    // ── 5a. Check if faction is in government (ruling faction or coalition member) ──
    const coalition = await fetchActiveCoalition(supabase, nationId);
    const coalitionPartyIds = new Set(coalition?.party_ids || []);
    const isGoverning = factionId === nation.ruling_faction_id || coalitionPartyIds.has(factionId);

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
        // Governing factions must promise a bigger change (they have legislative power)
        const delta = isGoverning ? cfg.STAT_DELTA_GOVERNING : cfg.STAT_DELTA;
        // Auto-determine direction: good stats → increase, bad stats → decrease
        const dir = sign === 1 ? 'above' : 'below';
        const targetValue = dir === 'above'
            ? Math.min(100, Math.round(currentVal + delta))
            : Math.max(0, Math.round(currentVal - delta));

        const statLabel = statKey.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

        // Reject promises that are already fulfilled (e.g. inflation at 0, promising to reduce to 0)
        if (dir === 'above' && currentVal >= targetValue)
            return { success: false, error: `${statLabel} is already at ${currentVal} — nothing to promise.` };
        if (dir === 'below' && currentVal <= targetValue)
            return { success: false, error: `${statLabel} is already at ${currentVal} — nothing to promise.` };
        demandText = dir === 'above'
            ? `Increase ${statLabel} to ${targetValue}`
            : `Reduce ${statLabel} to ${targetValue}`;
        demandType = 'stat_target';
        conditions = {
            stat_key: statKey,
            direction: dir,
            baseline_value: currentVal,
            target_value: targetValue,
            delta: delta,
            is_governing: isGoverning,
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

    // ── 6. Apply immediate momentum bump (preference_score recalculated by three-pillar calc) ──
    const blocEffects = [];
    for (const blocId of affectedBlocIds) {
        await adjustMomentum(supabase, nationId, factionId, blocId, approvalBump, `promise:made_${promiseType}`);
        const bloc = (allBlocs || []).find(b => b.id === blocId);
        blocEffects.push({ blocId, blocName: bloc?.bloc_name, delta: approvalBump });
    }

    // ── 7. Deduct AP if needed + track last_action_tick ──
    let newAp = faction.action_points || 0;
    if (effectivePromiseCost > 0) {
        const apResult = await deductAP(supabase, factionId, effectivePromiseCost);
        newAp = apResult.newAp ?? (newAp - effectivePromiseCost);
    }
    await supabase.from('factions').update({ last_action_tick: currentTick }).eq('id', factionId).then(({ error }) => { if (error) console.warn('[Promise] last_action_tick update failed:', error.message); });

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
const EXCLUDED_PROMISE_STATS = new Set(['population', 'gdp', 'debt']);

export function getPromiseableStats(nation, isGoverning = false) {
    const delta = isGoverning ? MAKE_PROMISE_CONFIG.STAT_DELTA_GOVERNING : MAKE_PROMISE_CONFIG.STAT_DELTA;
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
        // Skip stats already at their limit — no meaningful promise possible
        const val = Number(currentVal);
        const target = sign === 1
            ? Math.min(100, Math.round(val + delta))
            : Math.max(0, Math.round(val - delta));
        if (sign === 1 && val >= target) continue;
        if (sign === -1 && val <= target) continue;
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

export const SUCCESSOR_CONFIG = {
    AP_COST: 9,
    COOLDOWN_TICKS: 60,
    PILLAR_BOOST: 30,
    STABILITY_BOOST: 7,
    OTHER_COUP_READINESS: 5,
    OTHER_LOYALTY_DROP: 10,
    REVOKE_STABILITY_DROP: 5,
    REVOKE_COUP_READINESS: 3,
    REVOKE_LOYALTY_DROP: 20,
    POST_SUCCESSION_FORMER_LOYALTY: -15,
    POST_SUCCESSION_OTHER_LOYALTY: -5,
    DYNASTY_AP_COST: 1,
    DYNASTY_SHADOW_SUCCESSION_STRENGTH: 3,
    DYNASTY_CULTIVATE_LEGITIMACY: 1,
    DYNASTY_CULTIVATE_SUCCESSION_STRENGTH: 5,
    DYNASTY_CULTIVATE_STANDING_PENALTY: 1,
    DYNASTY_PREPARE_SUCCESSION_STRENGTH: 8,
    DYNASTY_PREPARE_EXIT_READINESS: 10,
    DYNASTY_PREPARE_DETECTION_CHANCE: 0.10,
    // Family member successor (appointing own faction)
    FAMILY_STABILITY_BOOST: 1,
    FAMILY_COUP_READINESS: 7,
    FAMILY_PILLAR_PENALTY: 5,
    FAMILY_AP_PENALTY: 1,  // -1 AP/tick while active
};

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
    const cfg = MAKE_PROMISE_CONFIG;
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

    // Build set of governing faction IDs (ruling faction + coalition members)
    const governingFactionIds = new Set([
        nation.ruling_faction_id,
        ...coalitionPartyIds,
    ].filter(Boolean));

    for (const promise of activePromises) {
        const isGoverning = governingFactionIds.has(promise.party_id);

        // If not governing and deadline passed: expire silently, no downside
        if (!isGoverning && currentTick >= promise.tick_deadline) {
            await supabase.from('fundraiser_promises')
                .update({ status: 'expired', tick_resolved: currentTick, updated_at: new Date().toISOString() })
                .eq('id', promise.id);
            results.push({ promise, resolution: 'expired' });
            continue;
        }

        // If not governing: promise is dormant — skip evaluation entirely
        if (!isGoverning) continue;

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

        // Per-tick penalty: governing party with unfulfilled promise loses momentum with the promised bloc
        // -1D3 momentum per tick (PENALTY_PER_TICK_MIN to PENALTY_PER_TICK_MAX)
        if (isGoverning && promise.bloc_id) {
            const penaltyAmount = -(Math.floor(Math.random() * (cfg.PENALTY_PER_TICK_MAX - cfg.PENALTY_PER_TICK_MIN + 1)) + cfg.PENALTY_PER_TICK_MIN);
            await adjustMomentum(supabase, promise.nation_id, promise.party_id, promise.bloc_id, penaltyAmount, 'promise:unfulfilled_tick');
            results.push({ promise, resolution: 'tick_penalty', penaltyAmount });
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
        // ── REWARDS (all via momentum — preference_score recalculated by three-pillar calc) ──
        if (promise.bloc_id) {
            await adjustMomentum(supabase, promise.nation_id, promise.party_id, promise.bloc_id, cfg.KEPT_PREF_BONUS, 'promise:kept_bloc');
        }

        // +momentum with ALL blocs (APPROVAL_IF_KEPT — the main +12 reward)
        await adjustMomentumAll(supabase, promise.nation_id, promise.party_id, cfg.APPROVAL_IF_KEPT, 'promise:kept');

        // +momentum (additional general boost)
        await adjustMomentumAll(supabase, promise.nation_id, promise.party_id, cfg.KEPT_MOMENTUM, 'promise:kept_bonus');

        // Mark promise as fulfilled
        await supabase.from('fundraiser_promises')
            .update({ status: 'fulfilled', tick_resolved: currentTick, updated_at: new Date().toISOString() })
            .eq('id', promise.id);

    } else if (resolution === 'broken') {
        // ── PENALTIES (all via momentum — preference_score recalculated by three-pillar calc) ──
        if (promise.bloc_id) {
            await adjustMomentum(supabase, promise.nation_id, promise.party_id, promise.bloc_id, cfg.BROKEN_DONOR_PREF, 'promise:broken_bloc');
        }

        // -momentum with ALL blocs
        await adjustMomentumAll(supabase, promise.nation_id, promise.party_id, cfg.BROKEN_ALL_PREF, 'promise:broken');

        // -momentum (additional penalty)
        await adjustMomentumAll(supabase, promise.nation_id, promise.party_id, cfg.BROKEN_MOMENTUM, 'promise:broken_penalty');

        // Nervous other promise holders: -1 momentum with each bloc
        const { data: otherPromises } = await supabase
            .from('fundraiser_promises')
            .select('bloc_id')
            .eq('party_id', promise.party_id)
            .eq('status', 'active')
            .neq('id', promise.id);

        if (otherPromises && otherPromises.length > 0) {
            const nervousBlocIds = [...new Set(otherPromises.map(p => p.bloc_id).filter(Boolean))];
            for (const nervousBlocId of nervousBlocIds) {
                await adjustMomentum(supabase, promise.nation_id, promise.party_id, nervousBlocId, cfg.BROKEN_NERVOUS_PREF, 'promise:broken_nervous');
            }
        }

        // Mark promise as broken
        await supabase.from('fundraiser_promises')
            .update({ status: 'broken', tick_resolved: currentTick, updated_at: new Date().toISOString() })
            .eq('id', promise.id);
    }
}


// ==================== AUTOCRACY SEAT REBALANCING ====================

/**
 * If a faction is disbanded (or for any reason the sum of all
 * faction seats is less than the nation's total_seats), proportionally
 * redistribute the vacant seats across the remaining factions.
 *
 * Uses the Largest Remainder method (same as allocateSeatsByVotes in
 * election-simulation.js) with existing seat counts as weights.
 */
export async function rebalanceVacantSeats(supabase, nation) {
    // Autocracies never auto-redistribute seats — factions must earn them.
    if (isAutocracy(nation)) return null;

    const totalSeats = nation.total_seats || GAME_CONFIG.TOTAL_SEATS;

    const { data: factions, error } = await supabase
        .from('factions')
        .select('id, faction_name, seats')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');

    if (error || !factions || factions.length === 0) return null;

    const currentSum = factions.reduce((s, f) => s + (f.seats || 0), 0);
    const vacantSeats = totalSeats - currentSum;

    if (vacantSeats <= 0) return null; // No vacant seats

    console.log(`[rebalanceVacantSeats] ${nation.name}: ${vacantSeats} vacant seat(s) detected (${currentSum}/${totalSeats}). Redistributing.`);

    // Proportional redistribution using Largest Remainder (Hamilton) method
    // Weight = each faction's current seats
    if (currentSum === 0) {
        // Edge case: all factions at 0 seats — distribute evenly
        const perParty = Math.floor(totalSeats / factions.length);
        let remainder = totalSeats - perParty * factions.length;
        const updates = [];
        for (const f of factions) {
            const newSeats = perParty + (remainder > 0 ? 1 : 0);
            if (remainder > 0) remainder--;
            updates.push({ id: f.id, name: f.faction_name, oldSeats: f.seats || 0, newSeats });
        }
        for (const u of updates) {
            await supabase.from('factions').update({ seats: u.newSeats }).eq('id', u.id);
        }
        return { nation: nation.name, vacantSeats, updates };
    }

    // Standard Largest Remainder: allocate totalSeats proportionally by current seat share
    const quota = currentSum / totalSeats; // votes-per-seat equivalent
    const fractionals = [];
    const newSeats = {};
    let allocated = 0;

    for (const f of factions) {
        const raw = (f.seats || 0) / quota;
        const guaranteed = Math.floor(raw);
        newSeats[f.id] = guaranteed;
        allocated += guaranteed;
        fractionals.push({ id: f.id, fractional: raw - guaranteed });
    }

    let remaining = totalSeats - allocated;
    fractionals.sort((a, b) => b.fractional - a.fractional);
    for (let i = 0; i < remaining && i < fractionals.length; i++) {
        newSeats[fractionals[i].id] = (newSeats[fractionals[i].id] || 0) + 1;
    }

    const updates = [];
    for (const f of factions) {
        const ns = newSeats[f.id] || 0;
        if (ns !== (f.seats || 0)) {
            updates.push({ id: f.id, name: f.faction_name, oldSeats: f.seats || 0, newSeats: ns });
            await supabase.from('factions').update({ seats: ns }).eq('id', f.id);
        }
    }

    if (updates.length > 0) {
        console.log(`[rebalanceVacantSeats] ${nation.name}: Seats rebalanced:`,
            updates.map(u => `${u.name}: ${u.oldSeats}→${u.newSeats}`).join(', '));
    }

    return { nation: nation.name, vacantSeats, updates };
}

// ==================== LOYALTY TICK PROCESSING ====================

/**
 * Determine autocracy loyalty decay rate based on Regime Health thresholds.
 * HEALTHY (60-100): -2/tick
 * WEAKENING (40-59): -2.5/tick
 * DECLINING (20-39): -3/tick
 * CRITICAL (1-19): -4/tick
 */
export function getAutocracyLoyaltyDecay(regimeHealth) {
    if (regimeHealth >= 60) return -2;
    if (regimeHealth >= 40) return -2.5;
    if (regimeHealth >= 20) return -3;
    if (regimeHealth >= 1) return -4;
    return -5; // COLLAPSED tier — matches getRegimeHealthTier
}

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
                // Autocracy ruling faction (Strongman): loyalty drifts toward 80
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

        if (nationIsAutocracy) {
            // ── v2 Autocracy Loyalty Decay ──
            // Flat decay based on Regime Health thresholds. No ministry bonus.
            // Loyalty cap: 95 (inherent paranoia of autocratic rule).
            const regimeHealth = Number(nation.regime_health ?? 80);
            const decayRate = getAutocracyLoyaltyDecay(regimeHealth);
            loyalty += decayRate;
            loyalty = Math.max(0, Math.min(GAME_CONFIG.LOYALTY_CAP, Math.round(loyalty * 10) / 10));

            await supabase.from('factions')
                .update({ loyalty })
                .eq('id', faction.id);
        } else {
            // ── Democracy/Presidential loyalty ──
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

            await supabase.from('factions')
                .update({ loyalty, seats })
                .eq('id', faction.id);
        }
    }
}

// ==================== STANDING TICK PROCESSING (v2) ====================

/**
 * Process faction standing relevance decay for autocracy nations.
 * Standing has no natural decay, BUT if a faction takes no standing-building
 * action (Consolidate Power or Demonstrate Competence) for 3+ consecutive ticks,
 * standing decays at -1/tick until a standing-building action is taken.
 * Standing cap: 90.
 */
/**
 * Expire pending loyalty demands past their deadline (server-side).
 * Treats expiry as a refusal: reveals true loyalty, standing -10.
 */
export async function processLoyaltyDemandExpiry(supabase, nation, currentTick) {
    if (!isAutocracy(nation)) return;

    const { data: expired } = await supabase
        .from('loyalty_demands')
        .select('id, target_faction_id, strongman_faction_id')
        .eq('nation_id', nation.id)
        .eq('status', 'pending')
        .lte('deadline_tick', currentTick);

    if (!expired || expired.length === 0) return;

    for (const d of expired) {
        await supabase.from('loyalty_demands').update({
            status: 'expired', resolved_at_tick: currentTick,
        }).eq('id', d.id);

        // Standing penalty for refusal
        const { data: targetFaction } = await supabase
            .from('factions').select('id, standing, faction_name')
            .eq('id', d.target_faction_id).single();
        if (targetFaction) {
            await supabase.from('factions').update({
                standing: Math.max(0, (targetFaction.standing ?? 30) - 10),
            }).eq('id', d.target_faction_id);
        }

        await supabase.from('campaign_actions').insert({
            party_id: d.target_faction_id, nation_id: nation.id,
            action_type: 'loyalty_demand_expired',
            tick_performed: currentTick,
            result: { faction_name: targetFaction?.faction_name || 'Unknown' },
        });
    }
}

export async function processStandingTick(supabase, nation, currentTick) {
    if (!isAutocracy(nation)) return;

    const { data: factions } = await supabase
        .from('factions')
        .select('id, standing, last_standing_action_tick')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');

    if (!factions || factions.length === 0) return;

    for (const faction of factions) {
        let standing = faction.standing ?? 30;
        const lastStandingTick = faction.last_standing_action_tick;

        // Relevance decay: if 3+ ticks since last standing-building action
        if (lastStandingTick != null && (currentTick - lastStandingTick) >= 3) {
            standing -= 1;
        } else if (lastStandingTick == null && currentTick >= 3) {
            // Never taken a standing action — decay after tick 3
            standing -= 1;
        }

        // Clamp to [0, 90]
        standing = Math.max(0, Math.min(90, standing));

        if (standing !== (faction.standing ?? 30)) {
            await supabase.from('factions')
                .update({ standing })
                .eq('id', faction.id);
        }
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
        { stat: 'religiosity', threshold: 50, direction: 'above' },
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

    // _armed_forces_funding: auto-funded at 100% (no budget bill system)
    let armedForcesFunding = 100;

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

/** Adjust coup_readiness for all living stewards in a nation by a delta. */
async function adjustStewardsCoupReadiness(supabase, nationId, delta) {
    const { data: stewards } = await supabase
        .from('stewards').select('id, coup_readiness')
        .eq('nation_id', nationId).eq('is_alive', true);
    for (const s of (stewards || [])) {
        const newCR = Math.min(100, Math.max(0, (s.coup_readiness ?? 0) + delta));
        await supabase.from('stewards').update({ coup_readiness: newCR }).eq('id', s.id);
    }
}

// ==================== AUTOCRACY v2 FACTION ACTIONS ====================

/**
 * Pledge Allegiance: publicly reaffirm loyalty. Groveling is free.
 * Loyalty +8, Standing -2. If under Demand Loyalty: Loyalty +13, Standing -3.
 * Standing cannot drop below 5 from this action.
 * AP Cost: 2
 */
export async function executePledgeAllegiance(supabase, factionId, nationId, currentTick) {
    // 1. Validate faction + AP
    const { data: faction } = await supabase
        .from('factions').select('id, action_points, loyalty, standing, faction_name')
        .eq('id', factionId).single();
    if (!faction) return { success: false, error: 'Faction not found.' };
    if ((faction.action_points || 0) < GAME_CONFIG.PLEDGE_ALLEGIANCE_AP)
        return { success: false, error: `Not enough AP. Need ${GAME_CONFIG.PLEDGE_ALLEGIANCE_AP}.` };

    // 2. Check for active Demand Loyalty order
    const { data: pendingDemand } = await supabase
        .from('loyalty_demands')
        .select('id, strongman_faction_id')
        .eq('nation_id', nationId)
        .eq('target_faction_id', factionId)
        .eq('status', 'pending')
        .maybeSingle();

    const isComplying = !!pendingDemand;

    // 3. Deduct AP
    const apResult = await deductAP(supabase, factionId, GAME_CONFIG.PLEDGE_ALLEGIANCE_AP);
    if (!apResult.success) return { success: false, error: 'Failed to deduct AP.' };

    // 4. Apply effects
    const loyaltyGain = isComplying ? GAME_CONFIG.PLEDGE_ALLEGIANCE_COMPLY_LOYALTY : GAME_CONFIG.PLEDGE_ALLEGIANCE_LOYALTY;
    const standingPenalty = isComplying ? GAME_CONFIG.PLEDGE_ALLEGIANCE_COMPLY_STANDING : GAME_CONFIG.PLEDGE_ALLEGIANCE_STANDING;

    let newLoyalty = Math.min(GAME_CONFIG.LOYALTY_CAP, (faction.loyalty ?? 50) + loyaltyGain);
    let newStanding = Math.max(GAME_CONFIG.PLEDGE_ALLEGIANCE_STANDING_FLOOR, (faction.standing ?? 30) + standingPenalty);
    newStanding = Math.min(GAME_CONFIG.STANDING_CAP, newStanding);

    await supabase.from('factions').update({
        loyalty: newLoyalty,
        standing: newStanding,
        last_action_type: 'pledge_allegiance',
        consecutive_embezzle_ticks: 0,
    }).eq('id', factionId);

    // 5. Resolve demand if complying
    if (isComplying) {
        await supabase.from('loyalty_demands').update({
            status: 'complied', resolved_at_tick: currentTick
        }).eq('id', pendingDemand.id);
    }

    // 6. Log action
    await supabase.from('campaign_actions').insert({
        party_id: factionId, nation_id: nationId,
        action_type: 'faction_pledge_allegiance',
        tick_performed: currentTick,
        result: {
            loyalty_change: loyaltyGain, standing_change: standingPenalty,
            new_loyalty: newLoyalty, new_standing: newStanding,
            complied_with_demand: isComplying,
            faction_name: faction.faction_name,
        }
    });

    return {
        success: true,
        newAp: apResult.newAp,
        loyaltyChange: loyaltyGain,
        standingChange: standingPenalty,
        newLoyalty, newStanding,
        compliedWithDemand: isComplying,
    };
}

/**
 * Consolidate Power: build institutional influence. Quiet power accumulation.
 * Standing +6, Loyalty -3. Resets relevance decay counter.
 * AP Cost: 2
 */
export async function executeConsolidatePower(supabase, factionId, nationId, currentTick) {
    // 1. Validate faction + AP
    const { data: faction } = await supabase
        .from('factions').select('id, action_points, loyalty, standing, faction_name')
        .eq('id', factionId).single();
    if (!faction) return { success: false, error: 'Faction not found.' };
    if ((faction.action_points || 0) < GAME_CONFIG.CONSOLIDATE_POWER_AP)
        return { success: false, error: `Not enough AP. Need ${GAME_CONFIG.CONSOLIDATE_POWER_AP}.` };

    // 2. Deduct AP
    const apResult = await deductAP(supabase, factionId, GAME_CONFIG.CONSOLIDATE_POWER_AP);
    if (!apResult.success) return { success: false, error: 'Failed to deduct AP.' };

    // 3. Apply effects
    let newStanding = Math.min(GAME_CONFIG.STANDING_CAP, (faction.standing ?? 30) + GAME_CONFIG.CONSOLIDATE_POWER_STANDING);
    let newLoyalty = Math.max(0, (faction.loyalty ?? 50) + GAME_CONFIG.CONSOLIDATE_POWER_LOYALTY);
    newLoyalty = Math.min(GAME_CONFIG.LOYALTY_CAP, newLoyalty);

    await supabase.from('factions').update({
        loyalty: newLoyalty,
        standing: newStanding,
        last_action_type: 'consolidate_power',
        last_standing_action_tick: currentTick,
        consecutive_embezzle_ticks: 0,
    }).eq('id', factionId);

    // 4. Log action
    await supabase.from('campaign_actions').insert({
        party_id: factionId, nation_id: nationId,
        action_type: 'faction_consolidate_power',
        tick_performed: currentTick,
        result: {
            standing_change: GAME_CONFIG.CONSOLIDATE_POWER_STANDING,
            loyalty_change: GAME_CONFIG.CONSOLIDATE_POWER_LOYALTY,
            new_standing: newStanding, new_loyalty: newLoyalty,
            faction_name: faction.faction_name,
        }
    });

    return {
        success: true,
        newAp: apResult.newAp,
        standingChange: GAME_CONFIG.CONSOLIDATE_POWER_STANDING,
        loyaltyChange: GAME_CONFIG.CONSOLIDATE_POWER_LOYALTY,
        newStanding, newLoyalty,
    };
}

/**
 * Demonstrate Competence: actually govern. Produce visible policy outcomes.
 * Standing +4, Loyalty +3, Nation stat +0.3. Costs $2M from embezzled funds.
 * If can't afford: Standing +2 (reduced), no nation stat effect.
 * Sets vulnerability window (other factions can poach seats cheaper).
 * AP Cost: 3
 */
export async function executeDemonstrateCompetence(supabase, factionId, nationId, currentTick) {
    // 1. Validate faction + AP
    const { data: faction } = await supabase
        .from('factions').select('id, action_points, loyalty, standing, embezzled_funds, faction_name')
        .eq('id', factionId).single();
    if (!faction) return { success: false, error: 'Faction not found.' };
    if ((faction.action_points || 0) < GAME_CONFIG.DEMONSTRATE_COMPETENCE_AP)
        return { success: false, error: `Not enough AP. Need ${GAME_CONFIG.DEMONSTRATE_COMPETENCE_AP}.` };

    // 2. Deduct AP
    const apResult = await deductAP(supabase, factionId, GAME_CONFIG.DEMONSTRATE_COMPETENCE_AP);
    if (!apResult.success) return { success: false, error: 'Failed to deduct AP.' };

    // 3. Check if faction can afford the cost
    const funds = Number(faction.embezzled_funds ?? 0);
    const canAfford = funds >= GAME_CONFIG.DEMONSTRATE_COMPETENCE_COST;

    const standingGain = canAfford ? GAME_CONFIG.DEMONSTRATE_COMPETENCE_STANDING : GAME_CONFIG.DEMONSTRATE_COMPETENCE_REDUCED_STANDING;
    const loyaltyGain = GAME_CONFIG.DEMONSTRATE_COMPETENCE_LOYALTY;

    let newStanding = Math.min(GAME_CONFIG.STANDING_CAP, (faction.standing ?? 30) + standingGain);
    let newLoyalty = Math.min(GAME_CONFIG.LOYALTY_CAP, (faction.loyalty ?? 50) + loyaltyGain);
    let newFunds = canAfford ? funds - GAME_CONFIG.DEMONSTRATE_COMPETENCE_COST : funds;

    await supabase.from('factions').update({
        loyalty: newLoyalty,
        standing: newStanding,
        embezzled_funds: newFunds,
        last_action_type: 'demonstrate_competence',
        last_standing_action_tick: currentTick,
        consecutive_embezzle_ticks: 0,
    }).eq('id', factionId);

    // 4. Apply nation stat bonus if funded
    let nationStatChange = null;
    if (canAfford) {
        // Determine which nation stat to boost based on faction's steward type / pillar
        const { data: steward } = await supabase
            .from('stewards').select('pillar_key, steward_type')
            .eq('faction_id', factionId).eq('nation_id', nationId).eq('is_alive', true)
            .maybeSingle();

        const pillarStatMap = {
            military: 'stability', security: 'stability', bureaucracy: 'government_efficiency',
            party: 'legitimacy', oligarchs: 'gdp_growth', media: 'press_freedom',
            foreign_patrons: 'international_reputation', religious: 'legitimacy',
        };
        const statKey = pillarStatMap[steward?.pillar_key] || 'stability';

        const { data: nation } = await supabase.from('nations').select(statKey).eq('id', nationId).single();
        if (nation) {
            const current = Number(nation[statKey] ?? 50);
            const newVal = Math.min(100, current + GAME_CONFIG.DEMONSTRATE_COMPETENCE_NATION_STAT);
            await supabase.from('nations').update({ [statKey]: newVal }).eq('id', nationId);
            nationStatChange = { stat: statKey, change: GAME_CONFIG.DEMONSTRATE_COMPETENCE_NATION_STAT };
        }
    }

    // 5. Log action
    await supabase.from('campaign_actions').insert({
        party_id: factionId, nation_id: nationId,
        action_type: 'faction_demonstrate_competence',
        tick_performed: currentTick,
        result: {
            standing_change: standingGain, loyalty_change: loyaltyGain,
            new_standing: newStanding, new_loyalty: newLoyalty,
            funds_spent: canAfford ? GAME_CONFIG.DEMONSTRATE_COMPETENCE_COST : 0,
            nation_stat_change: nationStatChange,
            could_afford: canAfford,
            faction_name: faction.faction_name,
        }
    });

    return {
        success: true,
        newAp: apResult.newAp,
        standingChange: standingGain,
        loyaltyChange: loyaltyGain,
        newStanding, newLoyalty,
        fundsSpent: canAfford ? GAME_CONFIG.DEMONSTRATE_COMPETENCE_COST : 0,
        nationStatChange,
        couldAfford: canAfford,
    };
}

/**
 * Embezzle Funds: divert state resources into hidden war chest.
 * Loyalty -5, Funds +$X (formula-based), Detection risk.
 * Income formula: base × (1 + standing/100) × (1 + seats/legislature_max)
 * Base: $5M, Floor: $3M.
 * Detection: 10% base + 5% per consecutive tick + corruption modifier.
 * AP Cost: 1
 */
export async function executeEmbezzleFunds(supabase, factionId, nationId, currentTick) {
    // 1. Validate faction + AP
    const { data: faction } = await supabase
        .from('factions').select('id, action_points, loyalty, standing, seats, embezzled_funds, consecutive_embezzle_ticks, faction_name')
        .eq('id', factionId).single();
    if (!faction) return { success: false, error: 'Faction not found.' };
    if ((faction.action_points || 0) < GAME_CONFIG.EMBEZZLE_FUNDS_AP)
        return { success: false, error: `Not enough AP. Need ${GAME_CONFIG.EMBEZZLE_FUNDS_AP}.` };

    // 2. Fetch nation for corruption and legislature size
    const { data: nation } = await supabase
        .from('nations').select('corruption, total_seats, ruling_faction_id, regime_health')
        .eq('id', nationId).single();
    if (!nation) return { success: false, error: 'Nation not found.' };

    const legislatureMax = nation.total_seats || 120;

    // 3. Deduct AP
    const apResult = await deductAP(supabase, factionId, GAME_CONFIG.EMBEZZLE_FUNDS_AP);
    if (!apResult.success) return { success: false, error: 'Failed to deduct AP.' };

    // 4. Calculate income
    const standing = faction.standing ?? 30;
    const seats = faction.seats || 0;
    let income = GAME_CONFIG.EMBEZZLE_FUNDS_BASE_INCOME * (1 + standing / 100) * (1 + seats / legislatureMax);
    income = Math.max(GAME_CONFIG.EMBEZZLE_FUNDS_INCOME_FLOOR, Math.round(income * 100) / 100);

    // 5. Calculate detection probability
    const consecutiveTicks = (faction.consecutive_embezzle_ticks ?? 0);
    const corruption = Number(nation.corruption ?? 50);
    const corruptionMod = (corruption - 50) * -0.005; // -0.5% per point above 50, +0.5% below

    // Security faction detection bonus
    let securityBonus = 0;
    const { data: secFactions } = await supabase
        .from('factions').select('id, seats')
        .eq('nation_id', nationId)
        .eq('faction_type', 'party')
        .neq('id', factionId);
    // We'd need to identify the "security" faction — for now use steward type
    const { data: secStewards } = await supabase
        .from('stewards').select('faction_id')
        .eq('nation_id', nationId)
        .eq('steward_type', 'security_chief')
        .eq('is_alive', true);
    if (secStewards && secStewards.length > 0) {
        for (const ss of secStewards) {
            const secFaction = (secFactions || []).find(f => f.id === ss.faction_id);
            if (secFaction) {
                securityBonus += ((secFaction.seats || 0) / legislatureMax) * 0.10;
            }
        }
    }

    let detectionProb = GAME_CONFIG.EMBEZZLE_FUNDS_BASE_DETECTION
        + consecutiveTicks * GAME_CONFIG.EMBEZZLE_FUNDS_CONSECUTIVE_BONUS
        + corruptionMod
        + securityBonus;
    detectionProb = Math.max(GAME_CONFIG.EMBEZZLE_FUNDS_DETECTION_FLOOR,
        Math.min(GAME_CONFIG.EMBEZZLE_FUNDS_DETECTION_CAP, detectionProb));

    // 6. Roll for detection
    const detected = Math.random() < detectionProb;

    // 7. Apply effects
    let newLoyalty = Math.max(0, (faction.loyalty ?? 50) + GAME_CONFIG.EMBEZZLE_FUNDS_LOYALTY);
    let newFunds = Number(faction.embezzled_funds ?? 0) + income;
    let newStanding = faction.standing ?? 30;
    let fundsSeized = 0;

    if (detected) {
        newLoyalty = Math.max(0, newLoyalty + GAME_CONFIG.EMBEZZLE_FUNDS_DETECTED_LOYALTY);
        newStanding = Math.max(0, newStanding + GAME_CONFIG.EMBEZZLE_FUNDS_DETECTED_STANDING);
        fundsSeized = Math.round(newFunds * GAME_CONFIG.EMBEZZLE_FUNDS_DETECTED_FUNDS_SEIZURE * 100) / 100;
        newFunds -= fundsSeized;

        // Regime health -1 for detected embezzlement
        const newRegimeHealth = Math.max(0, Number(nation.regime_health ?? 80) - 1);
        await supabase.from('nations').update({ regime_health: newRegimeHealth }).eq('id', nationId);
    }

    newLoyalty = Math.min(GAME_CONFIG.LOYALTY_CAP, newLoyalty);
    newStanding = Math.min(GAME_CONFIG.STANDING_CAP, newStanding);

    await supabase.from('factions').update({
        loyalty: newLoyalty,
        standing: newStanding,
        embezzled_funds: Math.max(0, newFunds),
        consecutive_embezzle_ticks: consecutiveTicks + 1,
        last_action_type: 'embezzle_funds',
    }).eq('id', factionId);

    // 8. Log action
    await supabase.from('campaign_actions').insert({
        party_id: factionId, nation_id: nationId,
        action_type: detected ? 'faction_embezzle_detected' : 'faction_embezzle',
        tick_performed: currentTick,
        result: {
            income, detected, funds_seized: fundsSeized,
            detection_probability: Math.round(detectionProb * 100),
            loyalty_change: GAME_CONFIG.EMBEZZLE_FUNDS_LOYALTY + (detected ? GAME_CONFIG.EMBEZZLE_FUNDS_DETECTED_LOYALTY : 0),
            standing_change: detected ? GAME_CONFIG.EMBEZZLE_FUNDS_DETECTED_STANDING : 0,
            faction_name: faction.faction_name,
        }
    });

    // 9. Detection risk label
    const riskLabel = detectionProb <= 0.12 ? 'LOW' : detectionProb <= 0.25 ? 'MODERATE' : detectionProb <= 0.35 ? 'ELEVATED' : 'HIGH';

    return {
        success: true,
        newAp: apResult.newAp,
        income, detected, fundsSeized,
        detectionProbability: Math.round(detectionProb * 100),
        riskLabel,
        newLoyalty, newStanding,
        newFunds: Math.max(0, newFunds),
        loyaltyChange: GAME_CONFIG.EMBEZZLE_FUNDS_LOYALTY + (detected ? GAME_CONFIG.EMBEZZLE_FUNDS_DETECTED_LOYALTY : 0),
        standingChange: detected ? GAME_CONFIG.EMBEZZLE_FUNDS_DETECTED_STANDING : 0,
    };
}

/**
 * Get qualitative detection risk label for embezzlement.
 */
/**
 * Buy Influence: spend embezzled funds to recruit members from other factions or unaligned pool.
 * Standing -1, Seats +X based on funds spent.
 * Cost per seat: $3M × (target_standing / max(your_standing, 1)) × (1 + target_seats / legislature_max)
 * Unaligned pool: $2M flat per seat.
 * AP Cost: 3
 */
export async function executeBuyInfluence(supabase, factionId, nationId, targetId, fundsToSpend, currentTick) {
    // targetId can be a faction ID or 'unaligned' for the unaligned pool
    const isUnaligned = targetId === 'unaligned';

    // 1. Validate faction + AP
    const { data: faction } = await supabase
        .from('factions').select('id, action_points, standing, seats, embezzled_funds, faction_name, last_action_type')
        .eq('id', factionId).single();
    if (!faction) return { success: false, error: 'Faction not found.' };
    if ((faction.action_points || 0) < GAME_CONFIG.BUY_INFLUENCE_AP)
        return { success: false, error: `Not enough AP. Need ${GAME_CONFIG.BUY_INFLUENCE_AP}.` };

    const funds = Number(faction.embezzled_funds ?? 0);
    if (fundsToSpend > funds) return { success: false, error: 'Not enough funds.' };
    if (fundsToSpend <= 0) return { success: false, error: 'Must spend some funds.' };

    const { data: nation } = await supabase
        .from('nations').select('total_seats, unaligned_seats, regime_health, ruling_faction_id')
        .eq('id', nationId).single();
    if (!nation) return { success: false, error: 'Nation not found.' };
    const legislatureMax = nation.total_seats || 120;

    let seatsGained = 0;
    let targetName = 'Unaligned Pool';
    let costPerSeat;
    let actualCost;

    if (isUnaligned) {
        // Buy from unaligned pool — $2M flat per seat
        costPerSeat = GAME_CONFIG.BUY_INFLUENCE_UNALIGNED_COST;
        seatsGained = Math.min(
            Math.floor(fundsToSpend / costPerSeat),
            nation.unaligned_seats || 0
        );
        if (seatsGained <= 0) {
            const reason = (nation.unaligned_seats || 0) <= 0 ? 'Unaligned pool is empty.' : `Need at least $${costPerSeat}M to buy 1 seat.`;
            return { success: false, error: reason };
        }
        actualCost = seatsGained * costPerSeat;
    } else {
        // 3. Buy from rival faction
        const { data: target } = await supabase
            .from('factions').select('id, standing, seats, faction_name, last_action_type')
            .eq('id', targetId).single();
        if (!target) return { success: false, error: 'Target faction not found.' };
        if (target.id === factionId) return { success: false, error: 'Cannot target yourself.' };
        targetName = target.faction_name;

        // Cost per seat formula
        const yourStanding = Math.max(1, faction.standing ?? 30);
        const targetStanding = target.standing ?? 30;
        const targetSeats = target.seats || 0;
        const isTargetingStrongman = targetId === nation.ruling_faction_id;

        if (isTargetingStrongman) {
            const rh = Math.max(0, Math.min(100, Number(nation.regime_health ?? 80)));
            costPerSeat = GAME_CONFIG.BUY_INFLUENCE_STRONGMAN_BASE_COST * (1 + rh * GAME_CONFIG.BUY_INFLUENCE_STRONGMAN_HEALTH_SCALE);
        } else {
            costPerSeat = GAME_CONFIG.BUY_INFLUENCE_BASE_COST * (targetStanding / yourStanding) * (1 + targetSeats / legislatureMax);
        }

        // Vulnerability discount: if target is demonstrating competence this tick
        if (target.last_action_type === 'demonstrate_competence') {
            costPerSeat *= (1 - GAME_CONFIG.BUY_INFLUENCE_VULNERABILITY_DISCOUNT);
        }

        seatsGained = Math.min(
            Math.floor(fundsToSpend / costPerSeat),
            targetSeats
        );
        if (seatsGained <= 0) {
            const reason = targetSeats <= 0 ? `${targetName} has no seats.` : `Need at least $${Math.ceil(costPerSeat)}M to buy 1 seat from ${targetName}.`;
            return { success: false, error: reason };
        }
        actualCost = Math.round(seatsGained * costPerSeat * 100) / 100;
    }

    // 2. Deduct AP only after confirming seats can be gained
    const apResult = await deductAP(supabase, factionId, GAME_CONFIG.BUY_INFLUENCE_AP);
    if (!apResult.success) return { success: false, error: 'Failed to deduct AP.' };

    if (isUnaligned) {
        await supabase.from('factions').update({
            seats: (faction.seats || 0) + seatsGained,
            embezzled_funds: funds - actualCost,
            standing: Math.max(0, (faction.standing ?? 30) + GAME_CONFIG.BUY_INFLUENCE_STANDING),
            last_action_type: 'buy_influence',
            consecutive_embezzle_ticks: 0,
        }).eq('id', factionId);

        await supabase.from('nations').update({
            unaligned_seats: Math.max(0, (nation.unaligned_seats || 0) - seatsGained)
        }).eq('id', nationId);

        await supabase.from('campaign_actions').insert({
            party_id: factionId, nation_id: nationId,
            action_type: 'buy_influence',
            tick_performed: currentTick,
            result: { seats_gained: seatsGained, funds_spent: actualCost, target: 'unaligned', faction_name: faction.faction_name }
        });

        return { success: true, newAp: apResult.newAp, seatsGained, fundsSpent: actualCost, targetName };
    }

    // Rival faction — re-fetch target for seat transfer
    const { data: target } = await supabase
        .from('factions').select('id, seats')
        .eq('id', targetId).single();
    const targetSeats = target?.seats || 0;

    await supabase.from('factions').update({
        seats: (faction.seats || 0) + seatsGained,
        embezzled_funds: funds - actualCost,
        standing: Math.max(0, (faction.standing ?? 30) + GAME_CONFIG.BUY_INFLUENCE_STANDING),
        last_action_type: 'buy_influence',
        consecutive_embezzle_ticks: 0,
    }).eq('id', factionId);

    await supabase.from('factions').update({
        seats: Math.max(0, targetSeats - seatsGained)
    }).eq('id', targetId);

    await supabase.from('campaign_actions').insert({
        party_id: factionId, nation_id: nationId,
        action_type: 'buy_influence',
        tick_performed: currentTick,
        result: {
            seats_gained: seatsGained, funds_spent: actualCost,
            target_faction_id: targetId, target_name: targetName,
            cost_per_seat: Math.round(costPerSeat * 100) / 100,
            faction_name: faction.faction_name,
        }
    });

    return { success: true, newAp: apResult.newAp, seatsGained, fundsSpent: actualCost, targetName, costPerSeat: Math.round(costPerSeat * 100) / 100 };
}

/**
 * Intimidate: use fear/threats to force members of other factions to switch.
 * Loyalty -4, Standing +2, Stability -0.2. $1M cost.
 * Seats gained = 4 × (your_standing / max(target_standing, 1)) × (your_seats / 20)
 * Requires 5+ seats.
 * Failed intimidation (0 seats): Standing -3, Target standing +1.
 * AP Cost: 2
 */
export async function executeIntimidate(supabase, factionId, nationId, targetId, currentTick) {
    // 1. Validate faction + AP + seats
    const { data: faction } = await supabase
        .from('factions').select('id, action_points, loyalty, standing, seats, embezzled_funds, faction_name')
        .eq('id', factionId).single();
    if (!faction) return { success: false, error: 'Faction not found.' };
    if ((faction.action_points || 0) < GAME_CONFIG.INTIMIDATE_AP)
        return { success: false, error: `Not enough AP. Need ${GAME_CONFIG.INTIMIDATE_AP}.` };
    if ((faction.seats || 0) < GAME_CONFIG.INTIMIDATE_MIN_SEATS)
        return { success: false, error: `Need at least ${GAME_CONFIG.INTIMIDATE_MIN_SEATS} seats to intimidate.` };

    const funds = Number(faction.embezzled_funds ?? 0);
    if (funds < GAME_CONFIG.INTIMIDATE_COST)
        return { success: false, error: `Need $${GAME_CONFIG.INTIMIDATE_COST}M for intimidation.` };

    // 2. Validate target
    const { data: target } = await supabase
        .from('factions').select('id, standing, seats, faction_name, last_action_type')
        .eq('id', targetId).single();
    if (!target) return { success: false, error: 'Target faction not found.' };
    if (target.id === factionId) return { success: false, error: 'Cannot target yourself.' };

    // 3. Deduct AP
    const apResult = await deductAP(supabase, factionId, GAME_CONFIG.INTIMIDATE_AP);
    if (!apResult.success) return { success: false, error: 'Failed to deduct AP.' };

    // 4. Calculate seats gained
    const yourStanding = Math.max(1, faction.standing ?? 30);
    const targetStanding = Math.max(1, target.standing ?? 30);
    const yourSeats = faction.seats || 0;
    let effectiveness = GAME_CONFIG.INTIMIDATE_BASE_EFFECTIVENESS * (yourStanding / targetStanding) * (yourSeats / 20);

    // Vulnerability bonus
    if (target.last_action_type === 'demonstrate_competence') {
        effectiveness *= (1 + GAME_CONFIG.INTIMIDATE_VULNERABILITY_BONUS);
    }

    let seatsGained = Math.min(Math.floor(effectiveness), target.seats || 0);
    const failed = seatsGained <= 0;

    // 5. Apply effects
    let newLoyalty = Math.max(0, (faction.loyalty ?? 50) + GAME_CONFIG.INTIMIDATE_LOYALTY);
    let newStanding = faction.standing ?? 30;
    let newFunds = funds - GAME_CONFIG.INTIMIDATE_COST;

    if (failed) {
        // Failed intimidation — humiliation
        newStanding = Math.max(0, newStanding + GAME_CONFIG.INTIMIDATE_FAIL_STANDING);
        await supabase.from('factions').update({
            standing: Math.min(GAME_CONFIG.STANDING_CAP, (target.standing ?? 30) + 1)
        }).eq('id', targetId);
    } else {
        // Successful intimidation
        newStanding = Math.min(GAME_CONFIG.STANDING_CAP, newStanding + GAME_CONFIG.INTIMIDATE_STANDING);

        // Transfer seats
        await supabase.from('factions').update({
            seats: Math.max(0, (target.seats || 0) - seatsGained)
        }).eq('id', targetId);
    }

    newLoyalty = Math.min(GAME_CONFIG.LOYALTY_CAP, newLoyalty);

    await supabase.from('factions').update({
        loyalty: newLoyalty,
        standing: newStanding,
        seats: (faction.seats || 0) + seatsGained,
        embezzled_funds: Math.max(0, newFunds),
        last_action_type: 'intimidate',
        consecutive_embezzle_ticks: 0,
    }).eq('id', factionId);

    // Nation stability hit
    const { data: nationData } = await supabase
        .from('nations').select('stability').eq('id', nationId).single();
    if (nationData) {
        const newStability = Math.max(0, Number(nationData.stability ?? 50) + GAME_CONFIG.INTIMIDATE_STABILITY);
        await supabase.from('nations').update({ stability: newStability }).eq('id', nationId);
    }

    // 6. Log action + create intimidation event for retaliation
    const eventId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    await supabase.from('campaign_actions').insert({
        party_id: factionId, nation_id: nationId,
        action_type: failed ? 'intimidate_failed' : 'intimidate',
        tick_performed: currentTick,
        result: {
            seats_gained: seatsGained, failed,
            target_faction_id: targetId, target_name: target.faction_name,
            loyalty_change: GAME_CONFIG.INTIMIDATE_LOYALTY,
            standing_change: failed ? GAME_CONFIG.INTIMIDATE_FAIL_STANDING : GAME_CONFIG.INTIMIDATE_STANDING,
            target_standing_change: failed ? 1 : 0,
            event_id: eventId,
            faction_name: faction.faction_name,
        }
    });

    // Create a pending intimidation event for the target to respond to
    if (!failed) {
        await supabase.from('campaign_actions').insert({
            party_id: targetId, nation_id: nationId,
            action_type: 'intimidation_pending',
            tick_performed: currentTick,
            result: {
                event_id: eventId,
                intimidator_faction_id: factionId,
                intimidator_name: faction.faction_name,
                seats_lost: seatsGained,
                status: 'pending',
            }
        });
    }

    return {
        success: true,
        newAp: apResult.newAp,
        seatsGained, failed,
        targetName: target.faction_name,
        loyaltyChange: GAME_CONFIG.INTIMIDATE_LOYALTY,
        standingChange: failed ? GAME_CONFIG.INTIMIDATE_FAIL_STANDING : GAME_CONFIG.INTIMIDATE_STANDING,
        newLoyalty, newStanding,
        eventId: failed ? null : eventId,
    };
}

/**
 * Respond to an intimidation event (Accept / Report / Retaliate).
 */
export async function executeIntimidationResponse(supabase, factionId, nationId, eventId, response, currentTick) {
    // Find the pending intimidation event
    const { data: events } = await supabase
        .from('campaign_actions')
        .select('id, result')
        .eq('party_id', factionId)
        .eq('nation_id', nationId)
        .eq('action_type', 'intimidation_pending');

    const event = (events || []).find(e => e.result?.event_id === eventId && e.result?.status === 'pending');
    if (!event) return { success: false, error: 'Intimidation event not found or already resolved.' };

    const intimidatorId = event.result.intimidator_faction_id;

    // Mark event as resolved
    const updatedResult = { ...event.result, status: response, resolved_at_tick: currentTick };
    await supabase.from('campaign_actions').update({ result: updatedResult }).eq('id', event.id);

    if (response === 'accept') {
        return { success: true, response: 'accept', message: 'Losses accepted.' };
    }

    if (response === 'report') {
        // Intimidator: loyalty -8, standing -3
        const { data: intimidator } = await supabase
            .from('factions').select('id, loyalty, standing').eq('id', intimidatorId).single();
        if (intimidator) {
            await supabase.from('factions').update({
                loyalty: Math.max(0, (intimidator.loyalty ?? 50) + GAME_CONFIG.INTIMIDATE_REPORT_LOYALTY),
                standing: Math.max(0, (intimidator.standing ?? 30) + GAME_CONFIG.INTIMIDATE_REPORT_STANDING),
            }).eq('id', intimidatorId);
        }
        // Reporter: loyalty +3
        const { data: reporter } = await supabase
            .from('factions').select('id, loyalty').eq('id', factionId).single();
        if (reporter) {
            await supabase.from('factions').update({
                loyalty: Math.min(GAME_CONFIG.LOYALTY_CAP, (reporter.loyalty ?? 50) + GAME_CONFIG.INTIMIDATE_REPORTER_LOYALTY),
            }).eq('id', factionId);
        }

        await supabase.from('campaign_actions').insert({
            party_id: factionId, nation_id: nationId,
            action_type: 'intimidation_reported',
            tick_performed: currentTick,
            result: { event_id: eventId, intimidator_id: intimidatorId }
        });

        return { success: true, response: 'report', message: 'Reported to the Strongman.' };
    }

    if (response === 'retaliate') {
        // Check funds
        const { data: retaliator } = await supabase
            .from('factions').select('id, loyalty, seats, embezzled_funds').eq('id', factionId).single();
        if (!retaliator || Number(retaliator.embezzled_funds ?? 0) < GAME_CONFIG.INTIMIDATE_RETALIATE_COST)
            return { success: false, error: `Need $${GAME_CONFIG.INTIMIDATE_RETALIATE_COST}M to retaliate.` };

        // Retaliator: loyalty -2, funds -$1M
        await supabase.from('factions').update({
            loyalty: Math.max(0, (retaliator.loyalty ?? 50) + GAME_CONFIG.INTIMIDATE_RETALIATOR_LOYALTY),
            embezzled_funds: Math.max(0, Number(retaliator.embezzled_funds ?? 0) - GAME_CONFIG.INTIMIDATE_RETALIATE_COST),
        }).eq('id', factionId);

        // Intimidator: standing -2, seats -2 (transferred to retaliator)
        const { data: intimidator } = await supabase
            .from('factions').select('id, standing, seats').eq('id', intimidatorId).single();
        if (intimidator) {
            const seatLoss = Math.min(intimidator.seats || 0, Math.abs(GAME_CONFIG.INTIMIDATE_RETALIATE_SEATS));
            await supabase.from('factions').update({
                standing: Math.max(0, (intimidator.standing ?? 30) + GAME_CONFIG.INTIMIDATE_RETALIATE_STANDING),
                seats: Math.max(0, (intimidator.seats || 0) - seatLoss),
            }).eq('id', intimidatorId);
            if (seatLoss > 0) {
                await supabase.from('factions').update({
                    seats: (retaliator.seats || 0) + seatLoss,
                }).eq('id', factionId);
            }
        }

        await supabase.from('campaign_actions').insert({
            party_id: factionId, nation_id: nationId,
            action_type: 'intimidation_retaliated',
            tick_performed: currentTick,
            result: { event_id: eventId, intimidator_id: intimidatorId }
        });

        return { success: true, response: 'retaliate', message: 'Retaliation successful.' };
    }

    return { success: false, error: 'Invalid response.' };
}

/**
 * Purge: Strongman removes a faction's steward. Nuclear option.
 * Requires target loyalty < 20.
 * Target: steward removed, loyalty reset 50, standing -20, seats -30%, funds seized.
 * Others: loyalty +5. Nation: stability -1. Regime Health -3.
 * AP Cost: 3
 */
export async function executePurge(supabase, factionId, nationId, targetFactionId, currentTick) {
    // 1. Validate caller is Strongman
    const { data: nation } = await supabase
        .from('nations').select('id, ruling_faction_id, stability, civil_unrest, regime_health, international_reputation, total_seats, successor_is_family_member')
        .eq('id', nationId).single();
    if (!nation) return { success: false, error: 'Nation not found.' };
    if (nation.ruling_faction_id !== factionId) return { success: false, error: 'Only the Strongman can purge.' };

    // 2. Validate target (must belong to same nation)
    const { data: target } = await supabase
        .from('factions').select('id, loyalty, standing, seats, embezzled_funds, faction_name')
        .eq('id', targetFactionId).eq('nation_id', nationId).single();
    if (!target) return { success: false, error: 'Target faction not found.' };
    if ((target.loyalty ?? 50) >= GAME_CONFIG.PURGE_LOYALTY_THRESHOLD)
        return { success: false, error: `Target loyalty must be below ${GAME_CONFIG.PURGE_LOYALTY_THRESHOLD}. Current: ${target.loyalty ?? 50}.` };

    // 3. Validate AP
    const { data: strongman } = await supabase
        .from('factions').select('action_points').eq('id', factionId).single();
    if ((strongman?.action_points || 0) < GAME_CONFIG.PURGE_AP)
        return { success: false, error: `Not enough AP. Need ${GAME_CONFIG.PURGE_AP}.` };

    const apResult = await deductAP(supabase, factionId, GAME_CONFIG.PURGE_AP);
    if (!apResult.success) return { success: false, error: 'Failed to deduct AP.' };

    // 4. Remove steward
    const { data: targetSteward } = await supabase
        .from('stewards').select('id, first_name, last_name, is_chosen_successor')
        .eq('faction_id', targetFactionId).eq('nation_id', nationId).eq('is_alive', true)
        .maybeSingle();

    if (targetSteward) {
        await supabase.from('stewards').update({
            is_alive: false, died_at_tick: currentTick,
            is_chosen_successor: false,
        }).eq('id', targetSteward.id);

        // If the purged steward was chosen successor, clear the family flag to restore AP generation
        if (targetSteward.is_chosen_successor && nation.successor_is_family_member) {
            await supabase.from('nations').update({ successor_is_family_member: false }).eq('id', nationId);
        }
    }

    // 5. Create new steward (weaker stats)
    const firstNames = ['Viktor', 'Andrei', 'Dmitri', 'Sergei', 'Nikolai', 'Alexei', 'Pavel', 'Oleg', 'Yuri', 'Ivan'];
    const lastNames = ['Petrov', 'Volkov', 'Novikov', 'Kozlov', 'Morozov', 'Popov', 'Lebedev', 'Sokolov', 'Kuznetsov', 'Pavlov'];
    const newFirst = firstNames[Math.floor(Math.random() * firstNames.length)];
    const newLast = lastNames[Math.floor(Math.random() * lastNames.length)];

    const { data: oldSteward } = await supabase
        .from('stewards').select('pillar_key, steward_type')
        .eq('faction_id', targetFactionId).eq('nation_id', nationId)
        .order('created_at', { ascending: false }).limit(1).maybeSingle();

    await supabase.from('stewards').insert({
        nation_id: nationId,
        faction_id: targetFactionId,
        pillar_key: oldSteward?.pillar_key || 'party',
        steward_type: oldSteward?.steward_type || 'technocrat',
        first_name: newFirst,
        last_name: newLast,
        age: 35 + Math.floor(Math.random() * 20),
        standing: 15,
        power_base: 10,
        true_loyalty: 50,
        estimated_loyalty: 50,
        personal_wealth: 0,
        exit_readiness: 0,
        coup_readiness: 0,
        is_alive: true,
        is_chosen_successor: false,
        created_at_tick: currentTick,
    });

    // 6. Apply target faction effects
    const seatsLost = Math.ceil((target.seats || 0) * GAME_CONFIG.PURGE_TARGET_SEAT_LOSS);
    const newTargetSeats = Math.max(0, (target.seats || 0) - seatsLost);

    await supabase.from('factions').update({
        loyalty: GAME_CONFIG.PURGE_TARGET_NEW_LOYALTY,
        standing: Math.max(0, (target.standing ?? 30) + GAME_CONFIG.PURGE_TARGET_STANDING),
        seats: newTargetSeats,
        embezzled_funds: 0,
        coup_lockout_until_tick: currentTick + GAME_CONFIG.PURGE_COUP_LOCKOUT_TICKS,
    }).eq('id', targetFactionId);

    // 7. Scatter lost seats proportionally to other factions
    const { data: otherFactions } = await supabase
        .from('factions').select('id, seats')
        .eq('nation_id', nationId).eq('faction_type', 'party')
        .neq('id', targetFactionId);

    if (otherFactions && otherFactions.length > 0 && seatsLost > 0) {
        const totalOtherSeats = otherFactions.reduce((s, f) => s + (f.seats || 0), 0) || 1;
        let remaining = seatsLost;
        for (const of2 of otherFactions) {
            const share = Math.round(seatsLost * ((of2.seats || 0) / totalOtherSeats));
            const give = Math.min(share, remaining);
            if (give > 0) {
                await supabase.from('factions').update({ seats: (of2.seats || 0) + give }).eq('id', of2.id);
                remaining -= give;
            }
        }
        // Give remainder to largest faction
        if (remaining > 0) {
            const largest = otherFactions.sort((a, b) => (b.seats || 0) - (a.seats || 0))[0];
            await supabase.from('factions').update({ seats: (largest.seats || 0) + remaining }).eq('id', largest.id);
        }
    }

    // 8. All other non-ruling factions: loyalty +5
    const { data: allFactions } = await supabase
        .from('factions').select('id, loyalty')
        .eq('nation_id', nationId).eq('faction_type', 'party')
        .neq('id', targetFactionId).neq('id', factionId);
    for (const af of (allFactions || [])) {
        await supabase.from('factions').update({
            loyalty: Math.min(GAME_CONFIG.LOYALTY_CAP, (af.loyalty ?? 50) + GAME_CONFIG.PURGE_OTHERS_LOYALTY)
        }).eq('id', af.id);
    }

    // 9. Nation effects
    const newStability = Math.max(0, Number(nation.stability ?? 50) + GAME_CONFIG.PURGE_STABILITY);
    const newRegimeHealth = Math.max(0, Number(nation.regime_health ?? 80) + GAME_CONFIG.PURGE_REGIME_HEALTH);
    const nationUpdates = { stability: newStability, regime_health: newRegimeHealth };

    // Extra penalties for purging powerful factions
    if ((target.standing ?? 30) > 50) {
        nationUpdates.civil_unrest = Math.min(100, Number(nation.civil_unrest ?? 30) + 0.5);
    }
    if ((target.seats || 0) > 40) {
        nationUpdates.civil_unrest = Math.min(100, Number(nationUpdates.civil_unrest ?? nation.civil_unrest ?? 30) + 0.5);
    }
    nationUpdates.international_reputation = Math.max(0, Number(nation.international_reputation ?? 50) - 0.5);

    await supabase.from('nations').update(nationUpdates).eq('id', nationId);

    // 10. Log action
    await supabase.from('campaign_actions').insert({
        party_id: factionId, nation_id: nationId,
        action_type: 'purge',
        tick_performed: currentTick,
        result: {
            target_faction_id: targetFactionId,
            target_name: target.faction_name,
            purged_steward: targetSteward ? `${targetSteward.first_name} ${targetSteward.last_name}` : 'Unknown',
            new_steward: `${newFirst} ${newLast}`,
            seats_lost: seatsLost,
            funds_seized: Number(target.embezzled_funds ?? 0),
        }
    });

    // Fire timeline event
    try {
        await supabase.rpc('fire_system_event', {
            p_trigger_key: 'minister_purged',
            p_nation_id: nationId,
            p_tick: currentTick,
            p_placeholders: {
                target: target.faction_name,
                purged_steward: targetSteward ? `${targetSteward.first_name} ${targetSteward.last_name}` : 'Unknown',
                seats_lost: String(seatsLost)
            }
        });
    } catch (e) { /* non-blocking */ }

    return {
        success: true,
        newAp: apResult.newAp,
        targetName: target.faction_name,
        purgedSteward: targetSteward ? `${targetSteward.first_name} ${targetSteward.last_name}` : 'Unknown',
        newSteward: `${newFirst} ${newLast}`,
        seatsLost,
        fundsSeized: Number(target.embezzled_funds ?? 0),
    };
}

/**
 * Redistribute Seats: Strongman transfers seats between factions.
 * Loser: standing -3, loyalty -5. Gainer: loyalty +5.
 * Max 30% of loser's seats. 4-tick cooldown.
 * AP Cost: 2
 */
export async function executeRedistributeSeats(supabase, factionId, nationId, loserId, gainerId, seatCount, currentTick) {
    // 1. Validate caller is Strongman
    const { data: nation } = await supabase
        .from('nations').select('id, ruling_faction_id, last_redistribute_tick')
        .eq('id', nationId).single();
    if (!nation) return { success: false, error: 'Nation not found.' };
    if (nation.ruling_faction_id !== factionId) return { success: false, error: 'Only the Strongman can redistribute seats.' };

    // 2. Check cooldown
    if (nation.last_redistribute_tick != null && (currentTick - nation.last_redistribute_tick) < GAME_CONFIG.REDISTRIBUTE_SEATS_COOLDOWN)
        return { success: false, error: `Cooldown: ${GAME_CONFIG.REDISTRIBUTE_SEATS_COOLDOWN - (currentTick - nation.last_redistribute_tick)} ticks remaining.` };

    // 3. Validate AP
    const { data: strongman } = await supabase
        .from('factions').select('action_points').eq('id', factionId).single();
    if ((strongman?.action_points || 0) < GAME_CONFIG.REDISTRIBUTE_SEATS_AP)
        return { success: false, error: `Not enough AP. Need ${GAME_CONFIG.REDISTRIBUTE_SEATS_AP}.` };

    // 4. Validate loser and gainer (must belong to same nation)
    const { data: loser } = await supabase
        .from('factions').select('id, seats, standing, loyalty, faction_name')
        .eq('id', loserId).eq('nation_id', nationId).single();
    const { data: gainer } = await supabase
        .from('factions').select('id, seats, loyalty, faction_name')
        .eq('id', gainerId).eq('nation_id', nationId).single();
    if (!loser || !gainer) return { success: false, error: 'Faction not found.' };
    if (loserId === gainerId) return { success: false, error: 'Loser and gainer must be different.' };

    const maxSeats = Math.ceil((loser.seats || 0) * GAME_CONFIG.REDISTRIBUTE_SEATS_MAX_RATIO);
    if (seatCount > maxSeats) return { success: false, error: `Max ${maxSeats} seats (30% of ${loser.seats || 0}).` };
    if (seatCount <= 0) return { success: false, error: 'Must transfer at least 1 seat.' };
    if (seatCount > (loser.seats || 0)) return { success: false, error: 'Loser doesn\'t have enough seats.' };

    // 5. Deduct AP
    const apResult = await deductAP(supabase, factionId, GAME_CONFIG.REDISTRIBUTE_SEATS_AP);
    if (!apResult.success) return { success: false, error: 'Failed to deduct AP.' };

    // 6. Apply transfer
    await supabase.from('factions').update({
        seats: (loser.seats || 0) - seatCount,
        standing: Math.max(0, (loser.standing ?? 30) + GAME_CONFIG.REDISTRIBUTE_SEATS_LOSER_STANDING),
        loyalty: Math.max(0, (loser.loyalty ?? 50) + GAME_CONFIG.REDISTRIBUTE_SEATS_LOSER_LOYALTY),
    }).eq('id', loserId);

    await supabase.from('factions').update({
        seats: (gainer.seats || 0) + seatCount,
        loyalty: Math.min(GAME_CONFIG.LOYALTY_CAP, (gainer.loyalty ?? 50) + GAME_CONFIG.REDISTRIBUTE_SEATS_GAINER_LOYALTY),
    }).eq('id', gainerId);

    // 7. Update cooldown
    await supabase.from('nations').update({ last_redistribute_tick: currentTick }).eq('id', nationId);

    // 8. Log
    await supabase.from('campaign_actions').insert({
        party_id: factionId, nation_id: nationId,
        action_type: 'redistribute_seats',
        tick_performed: currentTick,
        result: {
            loser_id: loserId, loser_name: loser.faction_name,
            gainer_id: gainerId, gainer_name: gainer.faction_name,
            seats_transferred: seatCount,
        }
    });

    return {
        success: true,
        newAp: apResult.newAp,
        loserName: loser.faction_name,
        gainerName: gainer.faction_name,
        seatsTransferred: seatCount,
    };
}

export function getEmbezzleRiskLabel(faction, nation) {
    const consecutiveTicks = (faction.consecutive_embezzle_ticks ?? 0);
    const corruption = Number(nation?.corruption ?? 50);
    const corruptionMod = (corruption - 50) * -0.005;
    let prob = GAME_CONFIG.EMBEZZLE_FUNDS_BASE_DETECTION
        + consecutiveTicks * GAME_CONFIG.EMBEZZLE_FUNDS_CONSECUTIVE_BONUS
        + corruptionMod;
    prob = Math.max(GAME_CONFIG.EMBEZZLE_FUNDS_DETECTION_FLOOR,
        Math.min(GAME_CONFIG.EMBEZZLE_FUNDS_DETECTION_CAP, prob));
    if (prob <= 0.12) return 'LOW';
    if (prob <= 0.25) return 'MODERATE';
    if (prob <= 0.35) return 'ELEVATED';
    return 'HIGH';
}

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
        .select('id, faction_id, pillar_key, steward_type, standing, power_base, true_loyalty, estimated_loyalty, personal_wealth, exit_readiness, coup_readiness, is_chosen_successor')
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
        // Chosen Successor has halved decay (-1/tick)
        trueLoyalty -= steward.is_chosen_successor ? 1 : 2;
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

        // Sync steward standing → faction standing (v2: standing is faction-level)
        await supabase.from('factions')
            .update({ standing: Math.max(0, Math.min(90, standing)) })
            .eq('id', steward.faction_id);
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
                    // GDP and debt are driven by dedicated systems — skip
                    if (STAT_PROCESSOR_SKIP.has(statKey)) continue;

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
                            ministerUpdates[mKey] = (ministry?.minister_approval ?? MINISTER_APPROVAL_CONFIG.NEW_MINISTER_APPROVAL);
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
                        // GDP and debt are driven by dedicated systems — skip
                        if (STAT_PROCESSOR_SKIP.has(statKey)) continue;
                        currentVal = nationUpdates[statKey] !== undefined
                            ? nationUpdates[statKey]
                            : (nation[statKey] !== undefined && nation[statKey] !== null ? Number(nation[statKey]) : 50);
                        let scaledMinistryRate = RAW_SCALING_DIVISORS[statKey] ? rate * RAW_SCALING_DIVISORS[statKey] : rate;
                        newVal = eff.direction === 'up' ? currentVal + scaledMinistryRate : currentVal - scaledMinistryRate;
                        // Raw-value stats (debt, population) must not be clamped to 0-100
                        if (RAW_SCALING_DIVISORS[statKey]) {
                            newVal = Math.max(0, newVal);
                        } else {
                            newVal = Math.round(Math.max(0, Math.min(100, newVal)) * 10) / 10;
                        }
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
 * Delta-based minister approval model.
 *
 * Each minister's approval moves based on how their owned stats have changed
 * relative to their baseline (snapshot at appointment time). Ministers are
 * judged on improvement/deterioration, not inherited state.
 *
 * For each stat: delta = (current - baseline) × directionSign
 *   (positive delta = good direction, negative = bad direction)
 * avgDelta = average of all deltas
 * approval += BASELINE_DECAY + (avgDelta × DELTA_SENSITIVITY if |avgDelta| >= 0.5)
 * BASELINE_DECAY always applies; delta-based movement is added on top.
 *
 * Ministers without baselines get them auto-set to current values (migration path).
 *
 * @param {object} supabase
 * @param {object} nation - full nation row with current stat values
 * @param {number} currentTick
 * @returns {Array<object>} per-minister results for tick summary
 */
export async function updateMinisterApprovals(supabase, nation, currentTick) {
    const cfg = MINISTER_APPROVAL_CONFIG;

    const { data: ministries, error: fetchErr } = await supabase
        .from('ministries')
        .select('id, ministry_key, minister_approval, minister_first_name, party_id, stat_baselines')
        .eq('nation_id', nation.id)
        .eq('is_active', true);

    if (fetchErr) {
        console.error(`[updateMinisterApprovals] Failed to fetch ministries for ${nation.name}:`, fetchErr.message);
        return [];
    }
    if (!ministries || ministries.length === 0) return [];

    // Count active crises — ministers decay faster when the nation is in crisis
    const { count: activeCrisisCount } = await supabase
        .from('active_crises')
        .select('id', { count: 'exact', head: true })
        .eq('nation_id', nation.id);
    const crisisMultiplier = 1 + (activeCrisisCount || 0);

    const results = [];

    for (const ministry of ministries) {
        // Skip vacant ministries (no minister appointed)
        if (!ministry.minister_first_name) continue;

        const ownedStats = MINISTRY_TO_STATS[ministry.ministry_key];
        if (!ownedStats || ownedStats.length === 0) continue;

        // Auto-set baselines for ministers that don't have them yet (migration path)
        let baselines = ministry.stat_baselines;
        if (!baselines || Object.keys(baselines).length === 0) {
            baselines = buildMinistryBaselines(ministry.ministry_key, nation);
            const { error: blErr } = await supabase.from('ministries')
                .update({ stat_baselines: baselines })
                .eq('id', ministry.id);
            if (blErr) console.error(`[updateMinisterApprovals] Baseline init failed for ${ministry.ministry_key}:`, blErr.message);
        }

        // Calculate average delta: how much each stat moved in the "good" direction
        let deltaSum = 0;
        let deltaCount = 0;
        for (const statKey of ownedStats) {
            const sign = statDirectionSign(statKey);
            if (sign === 0) continue; // skip neutral stats (taxes, etc.)
            const current = Number(nation[statKey] ?? 50);
            const baseline = Number(baselines[statKey] ?? current);
            // sign=1 (higher-is-better): improvement = current - baseline (positive = good)
            // sign=-1 (lower-is-better): improvement = baseline - current (positive = good)
            const delta = (current - baseline) * sign;
            deltaSum += delta;
            deltaCount++;
        }

        if (deltaCount === 0) continue;
        const avgDelta = deltaSum / deltaCount;

        const oldApproval = ministry.minister_approval ?? cfg.NEW_MINISTER_APPROVAL;
        let newApproval = oldApproval;

        // Baseline decay always applies — approval erodes unless stats improve.
        // During crises, decay is multiplied: 1 crisis = 2×, 2 crises = 3×, etc.
        newApproval += cfg.BASELINE_DECAY * crisisMultiplier;
        // Apply delta-based movement on top of baseline decay
        if (Math.abs(avgDelta) >= 0.5) {
            newApproval += avgDelta * cfg.DELTA_SENSITIVITY;
        }

        // Foreign Minister penalty: -0.25/tick per nation without an outgoing ambassador
        let missingAmbassadorCount = 0;
        if (ministry.ministry_key === 'foreign') {
            const { count: totalNations } = await supabase
                .from('nations')
                .select('id', { count: 'exact', head: true })
                .neq('id', nation.id);
            const { count: activeAmbassadors } = await supabase
                .from('ambassadors')
                .select('id', { count: 'exact', head: true })
                .eq('nation_id', nation.id)
                .eq('is_active', true)
                .eq('status', 'active');
            missingAmbassadorCount = (totalNations || 0) - (activeAmbassadors || 0);
            if (missingAmbassadorCount > 0) {
                newApproval += missingAmbassadorCount * cfg.MISSING_AMBASSADOR_PENALTY;
            }
        }

        // minister_approval is an integer column — round to whole number
        newApproval = Math.round(Math.max(0, Math.min(100, newApproval)));

        // Update baselines to current values so next tick only sees incremental change
        const updatedBaselines = {};
        for (const statKey of ownedStats) {
            if (statDirectionSign(statKey) === 0) continue;
            updatedBaselines[statKey] = Number(nation[statKey] ?? 50);
        }

        const { error: updateErr } = await supabase.from('ministries')
            .update({ minister_approval: newApproval, stat_baselines: updatedBaselines })
            .eq('id', ministry.id);

        if (updateErr) {
            console.error(`[updateMinisterApprovals] Write failed for ${ministry.ministry_key} in ${nation.name}:`, updateErr.message);
        }

        results.push({
            ministry_key: ministry.ministry_key,
            old: oldApproval,
            new: newApproval,
            avgDelta: Math.round(avgDelta * 10) / 10,
            delta: Math.round((newApproval - oldApproval) * 10) / 10
        });
    }

    if (results.length > 0) {
        console.log(`[updateMinisterApprovals] ${nation.name}: ${results.map(r =>
            `${r.ministry_key} ${r.old}→${r.new} (avgDelta=${r.avgDelta})`
        ).join(', ')}`);
    }

    return results;
}

// ==================== LAYER 2: GOVERNMENT APPROVAL (SIMPLIFIED) ====================

/**
 * Simplified government approval calculation.
 *
 * govApproval = avg(filled minister approvals) + vacancyPenalty + eventModifier
 *
 * No composite pillars, no trend lookback, no embattled tracking,
 * no momentum feedback loop. Simple, transparent, and predictable.
 *
 * @param {object} supabase
 * @param {object} nation - nation row with current stat values
 * @param {number} currentTick
 * @returns {number|null} the computed government approval (0-100), or null if no government
 */
export async function calculateGovernmentApprovalTick(supabase, nation, currentTick) {
    const cfg = MINISTER_APPROVAL_CONFIG;

    const { data: ministries } = await supabase
        .from('ministries')
        .select('ministry_key, minister_approval, minister_first_name')
        .eq('nation_id', nation.id)
        .eq('is_active', true);

    if (!ministries || ministries.length === 0) return null;

    const filledMinistries = ministries.filter(m => m.minister_first_name);
    const vacantCount = ministries.length - filledMinistries.length;

    // Average of all filled minister approvals
    let ministerSum = 0;
    for (const m of filledMinistries) {
        ministerSum += (m.minister_approval ?? cfg.NEW_MINISTER_APPROVAL);
    }
    const ministerAvg = filledMinistries.length > 0 ? ministerSum / filledMinistries.length : cfg.NEW_MINISTER_APPROVAL;

    // Vacancy penalty: -3 per unfilled ministry seat
    const vacancyPenalty = vacantCount * cfg.VACANCY_PENALTY;

    // Event modifier (decayed before this call by the tick processor)
    const eventModifier = Number(nation.gov_approval_events ?? 0);

    // Composite target from minister averages + penalties + events
    let rawApproval = ministerAvg + vacancyPenalty + eventModifier;
    rawApproval = Math.max(0, Math.min(100, rawApproval));

    // Dynamic per-tick cap: base ±3, but scales with the gap so approval can
    // crash quickly during crises rather than crawling down 3 pts/tick.
    // Formula: max(3, |gap| × 0.25) — e.g. 36-point gap → cap of 9.
    const BASE_TICK_CHANGE = 3;
    const previousApproval = Number(nation.gov_approval ?? 40);
    const delta = rawApproval - previousApproval;
    const gap = Math.abs(delta);
    const maxChange = Math.max(BASE_TICK_CHANGE, Math.round(gap * 0.25));
    const clampedDelta = Math.max(-maxChange, Math.min(maxChange, delta));
    const govApproval = Math.round(Math.max(0, Math.min(100, previousApproval + clampedDelta)));

    // Store on nation
    await supabase.from('nations')
        .update({ gov_approval: govApproval })
        .eq('id', nation.id);

    // Update in-memory nation object
    nation.gov_approval = govApproval;

    console.log(`[GovApproval] ${nation.name}: ${govApproval} (target=${Math.round(rawApproval)}, delta=${Math.round(clampedDelta)}, prev=${previousApproval}, avg=${Math.round(ministerAvg)}, vacancies=${vacantCount}×${cfg.VACANCY_PENALTY}=${vacancyPenalty}, events=${eventModifier})`);

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
                // GDP and debt are driven by dedicated systems — skip
                if (STAT_PROCESSOR_SKIP.has(evtStatKey)) continue;
                const currentVal = nation[evtStatKey] !== undefined
                    ? Number(nation[evtStatKey]) : 50;
                const scaledChange = RAW_SCALING_DIVISORS[evtStatKey]
                    ? effect.change_value * RAW_SCALING_DIVISORS[evtStatKey]
                    : effect.change_value;
                // Raw-value stats (debt, population) must not be clamped to 0-100
                const newVal = RAW_SCALING_DIVISORS[evtStatKey]
                    ? Math.max(0, currentVal + scaledChange)
                    : Math.max(0, Math.min(100, currentVal + scaledChange));
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
                    .eq('faction_type', 'party');

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
    // 1. Load all crisis templates (including is_active=false for programmatic crises like Sovereign Debt/Default)
    const { data: crisisTemplates } = await supabase
        .from('crisis_templates')
        .select('*, crisis_triggers(*), crisis_effects(*), crisis_end_triggers(*)');

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

    // Load per-institution funding allocations (written by enactBill funding articles)
    const { data: _fundingAllocRows } = await supabase.from('budget_item_allocations')
        .select('item_id, item_type, allocation_amount, needed_amount')
        .eq('nation_id', nation.id)
        .eq('item_type', 'institution')
        .order('created_at', { ascending: true });
    const _fundingMap = buildFundingPctMap(_fundingAllocRows);
    function getInstitutionFundingPct(instId) {
        return getInstFundingPct(_fundingMap, instId);
    }

    // 3. Check inactive crises for activation (skip programmatic crises with is_active=false)
    for (const template of crisisTemplates) {
        if (activeMap[template.id]) continue; // already active
        if (!template.is_active) continue; // programmatic crises are activated elsewhere, not by stat triggers

        let allTriggersMet = false;

        if (template.crisis_type === 'ministry') {
            // Ministry crisis: check institution funding levels
            const institutionIds = template.institution_ids || [];
            const threshold = Number(template.funding_threshold_pct) || 0;
            if (institutionIds.length === 0) continue;

            allTriggersMet = true;
            for (const instId of institutionIds) {
                const pct = getInstitutionFundingPct(instId);
                if (pct >= threshold) {
                    allTriggersMet = false;
                    break;
                }
            }
        } else {
            // Stat-based crisis: check crisis_triggers
            const triggers = template.crisis_triggers || [];
            if (triggers.length === 0) continue;

            allTriggersMet = true;
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
            trigger_key: 'crisis_started',
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
                // GDP and debt are driven by dedicated systems — skip
                if (STAT_PROCESSOR_SKIP.has(statKey)) continue;
                const currentVal = nationUpdates[statKey] !== undefined
                    ? nationUpdates[statKey]
                    : (nation[statKey] !== undefined && nation[statKey] !== null
                        ? Number(nation[statKey]) : 50);

                // Raw-value stats (population) must not be clamped to 0-100
                let newVal;
                if (RAW_SCALING_DIVISORS[statKey]) {
                    const scaledCrisisChange = changePT * RAW_SCALING_DIVISORS[statKey];
                    newVal = Math.max(0, currentVal + scaledCrisisChange);
                } else {
                    newVal = Math.round(Math.max(0, Math.min(100, currentVal + changePT)) * 10) / 10;
                }
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
                // Floor/ceiling enforcement for gov approval events modifier.
                // Note: only floor (negative changePT) is enforced; ceiling for positive changePT not implemented.
                let effectiveGovChange = changePT;
                if (hasFloor && changePT < 0) {
                    const { data: govNat, error: govErr } = await supabase.from('nations').select('gov_approval_events').eq('id', nation.id).single();
                    if (govErr) {
                        console.warn(`[processCrises] Failed to read gov_approval_events for floor check: ${govErr.message}`);
                    } else {
                        const curEvents = Number(govNat?.gov_approval_events ?? 0);
                        const eventsFloor = -(floorVal);
                        if (curEvents <= eventsFloor) {
                            effectiveGovChange = 0;
                        } else if (curEvents + changePT < eventsFloor) {
                            effectiveGovChange = eventsFloor - curEvents;
                        }
                    }
                }
                if (effectiveGovChange !== 0) {
                    const coalition = await fetchActiveCoalition(supabase, nation.id);
                    const partyIds = coalition?.party_ids || [];
                    for (const partyId of partyIds) {
                        await adjustMomentumAll(supabase, nation.id, partyId, effectiveGovChange, 'crisis:' + template.name);
                        appliedEffects.push({
                            stat: 'momentum', change: effectiveGovChange,
                            target: effect.target, faction_id: partyId
                        });
                    }
                    // Also push to gov approval events component
                    await adjustGovernmentApprovalEvent(supabase, nation.id, effectiveGovChange, 'crisis:' + template.name);
                }

            } else if (effect.target === 'pm_approval') {
                const { data: pmMinistry } = await supabase
                    .from('ministries')
                    .select('minister_approval, party_id')
                    .eq('nation_id', nation.id)
                    .eq('ministry_key', 'prime_minister')
                    .eq('is_active', true)
                    .maybeSingle();

                if (pmMinistry) {
                    const currentVal = pmMinistry.minister_approval ?? MINISTER_APPROVAL_CONFIG.NEW_MINISTER_APPROVAL;
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
                    const currentVal = ministry.minister_approval ?? MINISTER_APPROVAL_CONFIG.NEW_MINISTER_APPROVAL;
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
        let allEndConditionsMet = false;

        if (template.crisis_type === 'ministry') {
            // Ministry crisis: resolve when ALL institutions are at/above recovery_threshold_pct
            const institutionIds = template.institution_ids || [];
            const recoveryPct = Number(template.recovery_threshold_pct) || (Number(template.funding_threshold_pct) + 20);
            if (institutionIds.length > 0) {
                allEndConditionsMet = true;
                for (const instId of institutionIds) {
                    const pct = getInstitutionFundingPct(instId);
                    if (pct < recoveryPct) {
                        allEndConditionsMet = false;
                        break;
                    }
                }
            }
        } else {
            // Stat-based crisis: check crisis_end_triggers
            const endTriggers = template.crisis_end_triggers || [];
            allEndConditionsMet = endTriggers.length > 0;

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
        }

        if (allEndConditionsMet) {
            // Deactivate the crisis (effects already applied this final tick)
            await supabase.from('active_crises').delete().eq('id', activeRecord.id);
            delete activeMap[template.id];

            await supabase.from('event_log').insert({
                nation_id: nation.id,
                event_name: 'CRISIS_RESOLVED: ' + template.name,
                trigger_key: 'crisis_ended',
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
 * Triggers when: stability < 20, civil_unrest > 50 (Autocracy only).
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

    // Check trigger conditions
    const conditionsMet =
        Number(nation.stability) < 20 &&
        Number(nation.civil_unrest) > 50;

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
                trigger_key: 'crisis_ended',
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

    // START new crisis (no per-tick effects on the starting tick)
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
            trigger_key: 'crisis_started',
            description_used: 'Pro-democracy demonstrations have erupted across multiple cities. Opposition groups are calling for free elections. The regime must act to restore order — or face revolution.',
            category: 'crisis',
            effects_applied: [],
            fired_at_tick: currentTick
        });
        console.log(`[Revolution] WARNING — crisis started for ${nation.name}, duration ${duration} ticks`);
        return { phase: 'warning', nation: nation.name, tick: currentTick, duration };
    }

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
                .update({ momentum: 0 })
                .eq('faction_id', faction.id);
            await recalcDerivedApproval(supabase, faction.id);
        }
    }

    // 4b. Reset all faction loyalty to 50 and flag for rebuild
    await supabase.from('factions')
        .update({ loyalty: 50, needs_rebuild: true })
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');

    // 5. Freeze all active bills — government has fallen
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
        trigger_key: 'crisis_ended',
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

// Crucera names (Sangreza, Melizea, Montequilla, Palvera, San Estrella)
export const PM_FIRST_NAMES = [
    'Alejandro', 'Camila', 'Diego', 'Valentina', 'Mateo', 'Isabela', 'Sebastián', 'Luca',
    'Andrés', 'Gabriel', 'Joaquín', 'Mariana', 'Carlos', 'Tomas', 'Rafael', 'Edwin',
    'Emilio', 'Catalina', 'Fernando', 'Renata',
    'Ricardo', 'Héctor', 'Ignacio', 'Santiago', 'Esteban', 'Nicolás', 'Ramón', 'Arturo',
    'Álvaro', 'Gonzalo', 'Javier', 'Mauricio', 'Enrique', 'Sergio', 'Adrián', 'Hugo',
    'Cristián', 'Rubén', 'Germán', 'Felipe'
];

export const PM_LAST_NAMES = [
    'Velasco', 'Mendoza', 'Guerrero', 'Salazar', 'Castillo', 'Herrera', 'Morales', 'Ríos',
    'Delgado', 'Espinoza', 'Guzmán', 'Navarro', 'Córdoba', 'Echeverría', 'Pacheco', 'Montero',
    'Aguilar', 'Valenzuela', 'Carrasco', 'Ibarra',
    'Fuentes', 'Quiroga', 'Sepúlveda', 'Villalobos', 'Paredes', 'Arellano', 'Sandoval', 'Medina',
    'Estrada', 'Cervantes', 'Figueroa', 'Maldonado', 'Cisneros', 'Zúñiga', 'Bustamante', 'Roldán',
    'Camacho', 'Gallardo', 'Barrera', 'Saavedra'
];

// Avelian names (Spanish with Italian influence)
export const AVELIA_FIRST_NAMES = [
    'Marcelo', 'Luciana', 'Dante', 'Sofía', 'Lorenzo', 'Elena', 'Tomás', 'Rosario',
    'Fabrizio', 'Carolina', 'Leandro', 'Paloma', 'Giancarlo', 'Inés', 'Renato', 'Marisol',
    'Nico', 'Florencia', 'Aurelio', 'Celeste',
    'Valentín', 'Matías', 'Silvio', 'Bernardo', 'Cristóbal', 'Lazzaro', 'Osvaldo', 'Enzo',
    'Pascual', 'Damián'
];

export const AVELIA_LAST_NAMES = [
    'Montalbán', 'Ferretti', 'Salcedo', 'Conti', 'Valverde', 'Lucero', 'Maretti', 'Orellana',
    'Bellini', 'Calderón', 'Santoro', 'Vásquez', 'Lombardi', 'Peñaloza', 'Rinaldi', 'Escobar',
    'Castellani', 'Madrigal', 'Giacomo', 'Solano',
    'Traverso', 'Coronado', 'Benedetti', 'Villarreal', 'Rosetti', 'Mondragón', 'Falcone', 'Quirós',
    'Molinari', 'Saldaña'
];

const AVELIA_NATIONS = ['Avelia'];

export function getNationNames(nationName) {
    if (AVELIA_NATIONS.includes(nationName)) {
        return { firstNames: AVELIA_FIRST_NAMES, lastNames: AVELIA_LAST_NAMES };
    }
    return { firstNames: PM_FIRST_NAMES, lastNames: PM_LAST_NAMES };
}

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


/**
 * Auto-appoint the party leader as Prime Minister without candidate selection.
 * Used for parliamentary systems — the party leader becomes PM immediately
 * when their party receives the PM role during coalition formation.
 */
export async function autoAppointPartyLeaderAsPM(supabase, nationId, factionId, currentTick) {
    const coalition = await fetchActiveCoalition(supabase, nationId);
    if (!coalition || (coalition.status !== 'formed' && coalition.status !== 'caretaker')) {
        throw new Error('Cannot appoint a Prime Minister until a coalition has been formed.');
    }

    // Load faction with leader data
    const { data: faction, error: factionErr } = await supabase
        .from('factions')
        .select('id, faction_name, leader_first_name, leader_last_name, leader_age')
        .eq('id', factionId)
        .single();
    if (factionErr || !faction) throw new Error('Faction not found');
    if (!faction.leader_first_name || !faction.leader_last_name) {
        throw new Error('Party leader data is incomplete — cannot auto-appoint PM.');
    }

    // Pick a weighted ideology based on faction's ideology profile
    let factionIdeology = await loadFactionIdeology(supabase, factionId);
    if (factionIdeology?._error) {
        console.error(`[autoAppointPartyLeaderAsPM] DB error loading ideology for ${factionId}, using neutral weights`);
        factionIdeology = null;
    }
    const weightedIdeologies = getWeightedIdeologies(factionIdeology);
    const ideologyPick = weightedRandomPick(weightedIdeologies);
    const ideology = ideologyPick.item;

    // Pick a random trait
    const traitKey = PM_TRAIT_KEYS[Math.floor(Math.random() * PM_TRAIT_KEYS.length)];

    const leaderAge = faction.leader_age || (35 + Math.floor(Math.random() * 16));

    // Deactivate any current HOG
    await supabase.from('head_of_government')
        .update({ active: false })
        .eq('nation_id', nationId).eq('active', true);

    // Create HOG record
    const { error: hogErr } = await supabase
        .from('head_of_government')
        .upsert({
            nation_id: nationId,
            faction_id: factionId,
            candidate_id: null,
            first_name: faction.leader_first_name,
            last_name: faction.leader_last_name,
            age: leaderAge,
            ideology: ideology.tag,
            trait_key: traitKey,
            appointed_tick: currentTick,
            active: true
        }, { onConflict: 'nation_id' });
    if (hogErr) throw hogErr;

    // Update administration record
    const pmFullName = `${faction.leader_first_name} ${faction.leader_last_name}`;
    await supabase.from('administrations').update({
        prime_minister: pmFullName,
        admin_name: `${faction.leader_last_name} Administration`,
        updated_at: new Date().toISOString()
    }).eq('nation_id', nationId).is('ended_at_tick', null);

    // Update/create PM ministry row
    const { data: pmMinistry } = await supabase.from('ministries')
        .select('id').eq('nation_id', nationId)
        .eq('ministry_key', 'prime_minister').eq('is_active', true)
        .maybeSingle();

    const { data: nationForBaseline } = await supabase.from('nations').select('*').eq('id', nationId).single();
    const pmBaselines = nationForBaseline ? buildMinistryBaselines('prime_minister', nationForBaseline) : {};

    if (pmMinistry) {
        await supabase.from('ministries').update({
            party_id: factionId,
            minister_first_name: faction.leader_first_name,
            minister_last_name: faction.leader_last_name,
            minister_age: leaderAge,
            minister_approval: MINISTER_APPROVAL_CONFIG.NEW_MINISTER_APPROVAL,
            stat_baselines: pmBaselines
        }).eq('id', pmMinistry.id);
    } else {
        await supabase.from('ministries').insert({
            nation_id: nationId,
            ministry_key: 'prime_minister',
            ministry_name: 'Prime Minister',
            is_active: true,
            party_id: factionId,
            minister_first_name: faction.leader_first_name,
            minister_last_name: faction.leader_last_name,
            minister_age: leaderAge,
            minister_approval: MINISTER_APPROVAL_CONFIG.NEW_MINISTER_APPROVAL,
            stat_baselines: pmBaselines
        });
    }

    // Apply ideology shift (+5 for PM)
    const axisKey = ideology.axisKey;
    const shift = 5 * ideology.direction;

    if (factionIdeology) {
        const currentVal = factionIdeology[axisKey] || 0;
        const newVal = Math.max(-100, Math.min(100, currentVal + shift));
        await supabase.from('faction_ideology').update({ [axisKey]: newVal }).eq('faction_id', factionId);
    }

    // Apply trait effects
    const { data: trait } = await supabase.from('leader_traits').select('*').eq('trait_key', traitKey).single();
    if (trait?.effects?.on_appoint_stability && nationForBaseline) {
        const newStability = Math.max(0, Math.min(100, (nationForBaseline.stability || 50) + trait.effects.on_appoint_stability));
        await supabase.from('nations').update({ stability: newStability }).eq('id', nationId);
    }

    // Fire system event
    try {
        await supabase.rpc('fire_system_event', {
            p_trigger_key: 'pm_appointed',
            p_nation_id: nationId,
            p_tick: currentTick,
            p_placeholders: {
                nation: nationForBaseline?.name || '',
                pm_name: pmFullName,
                party: faction.faction_name,
                trait: trait?.trait_name || traitKey
            }
        });
    } catch (e) { console.warn('PM appointed event fire failed (non-blocking):', e); }

    console.log(`Auto-appointed party leader as PM: ${pmFullName} (${traitKey}) for faction ${factionId}`);
    return { first_name: faction.leader_first_name, last_name: faction.leader_last_name, age: leaderAge, ideology: ideology.tag, trait_key: traitKey };
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
            // GDP and debt are driven by dedicated systems — skip
            if (STAT_PROCESSOR_SKIP.has(stat)) continue;
            const currentVal = nation[stat];
            if (currentVal !== undefined && currentVal !== null) {
                if (RAW_SCALING_DIVISORS[stat]) {
                    // Raw-value stats (population): scale rate and don't clamp to 0-100
                    updates[stat] = Math.max(0, Number(currentVal) + delta * RAW_SCALING_DIVISORS[stat]);
                } else {
                    updates[stat] = Math.round(Math.max(0, Math.min(100, Number(currentVal) + delta)) * 10) / 10;
                }
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
            if (faction.approval_rating < 40 && effects.approval_below_50_bonus) {
                delta = effects.approval_below_50_bonus;
            } else if (faction.approval_rating > 50 && effects.approval_above_60_penalty) {
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

    // 1. Deactivate PM
    await supabase
        .from('head_of_government')
        .update({ active: false })
        .eq('id', hog.id);

    // 2. Approval & stability penalties
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

    // 3. 12-tick PM cooldown on resigning faction
    await supabase
        .from('factions')
        .update({ pm_cooldown_until: currentTick + 12 })
        .eq('id', factionId);

    // 4. Always dissolve the coalition — PM resignation triggers immediate elections
    console.log('PM resignation — dissolving coalition and scheduling immediate election');
    try {
        const { data: fullNation } = await supabase.from('nations').select('*').eq('id', nationId).single();
        const { data: shard } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
        if (fullNation) {
            await closeAdministration(supabase, nationId, fullNation, 'pm_resignation', currentTick, shard?.current_date || '', null);
        }
    } catch (adminErr) { console.warn('Could not close administration on PM resignation:', adminErr); }
    await dissolveCoalition(supabase, nationId);

    // 5. Freeze all active bills
    await supabase
        .from('bills')
        .update({ status: 'frozen' })
        .eq('nation_id', nationId)
        .in('status', ['committee', 'floor']);

    // 6. Cancel any existing scheduled elections and schedule immediate one
    await supabase
        .from('elections')
        .delete()
        .eq('nation_id', nationId)
        .eq('status', 'scheduled');

    await supabase.from('elections').insert({
        nation_id: nationId,
        election_tick: currentTick,
        status: 'scheduled',
        election_type: 'parliamentary'
    });

    console.log(`  Scheduled immediate election for tick ${currentTick}`);

    // Fire timeline event
    try {
        await supabase.rpc('fire_system_event', {
            p_trigger_key: 'minister_resigned',
            p_nation_id: nationId,
            p_tick: currentTick,
            p_placeholders: { role: 'Prime Minister', name: `${hog.first_name} ${hog.last_name}` }
        });
    } catch (e) { /* non-blocking */ }

    return { result: 'election_called', reason: hog.trait_key === 'iron_will' ? 'iron_will' : 'pm_resignation' };
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

    // 2. Fetch nation for autocracy/ruling checks + seat redistribution
    const { data: nation } = await supabase
        .from('nations')
        .select('id, name, ruling_faction_id, government_type, total_seats')
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
    }

    // 2c. Autocracy: clean up departing faction's steward and pillar (ruling or non-ruling)
    if (isAutocracy(nation)) {
        await supabase.from('stewards')
            .update({ is_alive: false })
            .eq('nation_id', nationId)
            .eq('faction_id', factionId);
        await supabase.from('regime_pillars')
            .update({ steward_faction_id: null })
            .eq('nation_id', nationId)
            .eq('steward_faction_id', factionId);
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

    // 4b. Catch-all: vacate any remaining ministries held by this faction
    //     (covers edge cases where party holds ministries but isn't in an active coalition)
    const { error: catchAllMinErr } = await supabase
        .from('ministries')
        .update({ party_id: null, minister_first_name: null, minister_last_name: null, minister_age: null })
        .eq('nation_id', nationId)
        .eq('party_id', factionId)
        .eq('is_active', true);
    if (catchAllMinErr) console.warn('disbandParty: catch-all ministry vacate failed:', catchAllMinErr);

    // 5. Zero seats and redistribute to remaining parties
    const { data: dyingFaction } = await supabase
        .from('factions').select('seats').eq('id', factionId).single();
    const vacatedSeats = dyingFaction?.seats || 0;

    await supabase.from('factions')
        .update({ seats: 0 })
        .eq('id', factionId);

    // 6. Immediately redistribute vacated seats to remaining parties
    if (nation && vacatedSeats > 0) {
        if (isAutocracy(nation)) {
            // Autocracy: give all vacated seats to ruling faction
            const rulingId = nation.ruling_faction_id;
            if (rulingId && rulingId !== factionId) {
                const { data: ruler } = await supabase
                    .from('factions').select('seats').eq('id', rulingId).single();
                await supabase.from('factions')
                    .update({ seats: (ruler?.seats || 0) + vacatedSeats })
                    .eq('id', rulingId);
            }
        } else {
            await rebalanceVacantSeats(supabase, nation);
        }
    }

    // 7. Core disband — null out nation_id, reset all stats to fresh defaults
    const { error: disbandErr } = await supabase
        .from('factions')
        .update({
            nation_id: null,
            abandoned_at: new Date().toISOString(),
            disband_cooldown_until_tick: currentTick + 24,
            action_points: 0,
            approval_rating: null,
            last_seen_tick: null,
            founded_tick: null
        })
        .eq('id', factionId);

    if (disbandErr) throw new Error('Failed to disband party: ' + disbandErr.message);

    // 8. Fail any open bills proposed by this faction (they lose their sponsor)
    const { data: orphanedBills } = await supabase
        .from('bills')
        .select('id, bill_name, bill_type, ambassador_id')
        .eq('nation_id', nationId)
        .eq('proposed_by', factionId)
        .in('status', ['committee', 'floor']);
    if (orphanedBills && orphanedBills.length > 0) {
        for (const bill of orphanedBills) {
            await supabase.from('bills').update({ status: 'failed' }).eq('id', bill.id);
            // Reject any pending ambassadors from failed confirmation bills
            if (bill.bill_type === 'confirmation' && bill.ambassador_id) {
                await supabase.from('ambassadors').update({ status: 'rejected', is_active: false }).eq('id', bill.ambassador_id);
            }
            console.log(`[disbandParty] Failed orphaned bill "${bill.bill_name}" (proposed by disbanded faction)`);
        }
    }

    // 9. Audit log (before cleanup so the insert isn't immediately deleted)
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

    // 10. Clean up all faction-related data from the old nation
    await supabase.from('faction_bloc_approval').delete().eq('faction_id', factionId);
    await supabase.from('faction_ideology').delete().eq('faction_id', factionId);
    await supabase.from('ideology_history').delete().eq('faction_id', factionId);
    await supabase.from('momentum_log').delete().eq('faction_id', factionId);
    await supabase.from('fundraiser_promises').delete().eq('party_id', factionId);
    await supabase.from('donor_trust').delete().eq('party_id', factionId);
    await supabase.from('bill_support').delete().eq('faction_id', factionId);
    await supabase.from('campaign_actions').delete().eq('party_id', factionId).neq('action_type', 'party_disbanded');
    await supabase.from('faction_coalitions').delete().eq('faction_a_id', factionId);
    await supabase.from('faction_coalitions').delete().eq('faction_b_id', factionId);
    await supabase.from('loyalty_demands').delete().eq('strongman_faction_id', factionId);
    await supabase.from('loyalty_demands').delete().eq('target_faction_id', factionId);

    return { result: 'disbanded' };
}


// ==================== APPOINT SUCCESSOR ====================

/**
 * Appoint a successor. Strongman-only, 9 AP.
 *
 * Two modes:
 *  - targetFactionId !== strongmanFactionId: Appoint a steward as Chosen Successor.
 *    Effects: target pillar +30, stability +7, rivals loyalty -10 / coup_readiness +5.
 *  - targetFactionId === strongmanFactionId: Appoint a Close Family Member.
 *    Effects: stability +1, all stewards coup_readiness +7, all pillars -5, -1 AP/tick ongoing.
 *
 * Both modes set a 60-tick cooldown on further appointments.
 */
export async function executeAppointSuccessor(supabase, nationId, strongmanFactionId, targetFactionId, currentTick) {
    // 1. Validate: caller is ruling faction
    const { data: nation, error: nationErr } = await supabase
        .from('nations').select('*')
        .eq('id', nationId).single();
    if (nationErr || !nation) return { success: false, error: nationErr?.message || 'Nation not found.' };
    if (nation.ruling_faction_id !== strongmanFactionId) return { success: false, error: 'Only the Strongman can appoint a successor.' };

    // 2. Check cooldown
    if (nation.successor_cooldown_end_tick && currentTick < nation.successor_cooldown_end_tick) {
        return { success: false, error: `Appointment on cooldown. ${nation.successor_cooldown_end_tick - currentTick} ticks remaining.` };
    }

    const isFamilyMember = targetFactionId === strongmanFactionId;

    // 3. For steward appointment: validate target has a living steward
    let targetSteward = null;
    if (!isFamilyMember) {
        const { data: ts } = await supabase
            .from('stewards')
            .select('id, first_name, last_name, pillar_key, steward_type, is_chosen_successor')
            .eq('faction_id', targetFactionId)
            .eq('nation_id', nationId)
            .eq('is_alive', true)
            .single();
        if (!ts) return { success: false, error: 'Target faction has no living steward.' };
        targetSteward = ts;
    }

    // 4. Deduct AP
    const apResult = await deductAP(supabase, strongmanFactionId, SUCCESSOR_CONFIG.AP_COST);
    if (!apResult.success) return { success: false, error: 'Not enough AP.' };

    // 5. Clear any existing successor (steward-based)
    await supabase.from('stewards').update({
        is_chosen_successor: false,
        succession_strength: 0,
        successor_appointed_tick: null,
    }).eq('nation_id', nationId).eq('is_chosen_successor', true);

    if (isFamilyMember) {
        // === FAMILY MEMBER PATH ===
        // 6a. Set nation flags
        const newStability = Math.min(100, Number(nation.stability ?? 50) + SUCCESSOR_CONFIG.FAMILY_STABILITY_BOOST);
        await supabase.from('nations').update({
            stability: newStability,
            successor_cooldown_end_tick: currentTick + SUCCESSOR_CONFIG.COOLDOWN_TICKS,
            successor_is_family_member: true,
        }).eq('id', nationId);

        // 7a. All stewards: coup_readiness +7
        await adjustStewardsCoupReadiness(supabase, nationId, SUCCESSOR_CONFIG.FAMILY_COUP_READINESS);

        // 8a. All regime pillars: -5 support
        const { data: pillars } = await supabase
            .from('regime_pillars').select('id, support')
            .eq('nation_id', nationId);
        for (const p of (pillars || [])) {
            const newSupport = Math.max(0, (p.support ?? 50) - SUCCESSOR_CONFIG.FAMILY_PILLAR_PENALTY);
            await supabase.from('regime_pillars').update({ support: newSupport }).eq('id', p.id);
        }

        // 9a. Log
        await supabase.from('campaign_actions').insert({
            party_id: strongmanFactionId,
            nation_id: nationId,
            action_type: 'appoint_successor',
            tick_performed: currentTick,
            result: {
                successor_name: 'Close Family Member',
                is_family_member: true,
                stability_gain: SUCCESSOR_CONFIG.FAMILY_STABILITY_BOOST,
                pillar_penalty: SUCCESSOR_CONFIG.FAMILY_PILLAR_PENALTY,
                coup_readiness_gain: SUCCESSOR_CONFIG.FAMILY_COUP_READINESS,
            },
        });

        return { success: true, newAp: apResult.newAp, successorName: 'Close Family Member', isFamilyMember: true };
    }

    // === STEWARD PATH ===
    // 6b. Set target steward as chosen successor
    await supabase.from('stewards').update({
        is_chosen_successor: true,
        successor_appointed_tick: currentTick,
        succession_strength: 0,
    }).eq('id', targetSteward.id);

    // Clear family member flag if it was set
    await supabase.from('nations').update({ successor_is_family_member: false }).eq('id', nationId);

    // 7b. Boost target's pillar support +30 (capped at 100)
    const { data: targetPillar } = await supabase
        .from('regime_pillars')
        .select('id, support')
        .eq('nation_id', nationId)
        .eq('pillar_key', targetSteward.pillar_key)
        .single();
    if (targetPillar) {
        const newSupport = Math.min(100, (targetPillar.support ?? 50) + SUCCESSOR_CONFIG.PILLAR_BOOST);
        await supabase.from('regime_pillars').update({ support: newSupport }).eq('id', targetPillar.id);
    }

    // 8b. Stability +7 (capped at 100)
    const newStability = Math.min(100, Number(nation.stability ?? 50) + SUCCESSOR_CONFIG.STABILITY_BOOST);
    await supabase.from('nations').update({
        stability: newStability,
        successor_cooldown_end_tick: currentTick + SUCCESSOR_CONFIG.COOLDOWN_TICKS,
    }).eq('id', nationId);

    // 9b. All OTHER factions (not target, not strongman): loyalty -10, steward coup_readiness +5
    const { data: otherFactions } = await supabase
        .from('factions')
        .select('id, loyalty')
        .eq('nation_id', nationId)
        .eq('faction_type', 'party')
        .neq('id', strongmanFactionId)
        .neq('id', targetFactionId);

    for (const f of (otherFactions || [])) {
        const newLoy = Math.max(0, (f.loyalty ?? 50) - SUCCESSOR_CONFIG.OTHER_LOYALTY_DROP);
        await supabase.from('factions').update({ loyalty: newLoy }).eq('id', f.id);

        // Boost their steward's coup_readiness
        const { data: otherSteward } = await supabase
            .from('stewards').select('id, coup_readiness')
            .eq('faction_id', f.id).eq('nation_id', nationId).eq('is_alive', true).single();
        if (otherSteward) {
            const newCR = Math.min(100, (otherSteward.coup_readiness ?? 0) + SUCCESSOR_CONFIG.OTHER_COUP_READINESS);
            await supabase.from('stewards').update({ coup_readiness: newCR }).eq('id', otherSteward.id);
        }
    }

    // 10b. Log
    const successorName = `${targetSteward.first_name} ${targetSteward.last_name}`;
    await supabase.from('campaign_actions').insert({
        party_id: strongmanFactionId,
        nation_id: nationId,
        action_type: 'appoint_successor',
        tick_performed: currentTick,
        result: {
            successor_name: successorName,
            successor_steward_id: targetSteward.id,
            successor_faction_id: targetFactionId,
            stability_gain: SUCCESSOR_CONFIG.STABILITY_BOOST,
            pillar_boost: SUCCESSOR_CONFIG.PILLAR_BOOST,
        },
    });

    return { success: true, newAp: apResult.newAp, successorName };
}

/**
 * Revoke the current Chosen Successor (steward or family member). Strongman-only, free (no AP cost).
 * Effects: stability -5, former successor faction loyalty -20, all stewards coup_readiness +3.
 * For family member: just stability -5, coup_readiness +3, and clears the flag (restores AP).
 * Cooldown from original appointment persists.
 */
export async function executeRevokeSuccessor(supabase, nationId, strongmanFactionId, currentTick) {
    const { data: nation, error: nationErr } = await supabase
        .from('nations').select('*')
        .eq('id', nationId).single();
    if (nationErr || !nation) return { success: false, error: nationErr?.message || 'Nation not found.' };
    if (nation.ruling_faction_id !== strongmanFactionId) return { success: false, error: 'Only the Strongman can revoke.' };

    const isFamilyRevoke = nation.successor_is_family_member;

    if (!isFamilyRevoke) {
        // Find the current steward successor
        const { data: currentSuccessor } = await supabase
            .from('stewards')
            .select('id, faction_id, first_name, last_name')
            .eq('nation_id', nationId)
            .eq('is_chosen_successor', true)
            .eq('is_alive', true)
            .maybeSingle();
        if (!currentSuccessor) return { success: false, error: 'No successor to revoke.' };

        // Clear successor tag
        await supabase.from('stewards').update({
            is_chosen_successor: false,
            succession_strength: 0,
            successor_appointed_tick: null,
        }).eq('id', currentSuccessor.id);

        // Former successor's faction: loyalty -20
        const { data: formerFaction } = await supabase.from('factions').select('id, loyalty').eq('id', currentSuccessor.faction_id).single();
        if (formerFaction) {
            const newLoy = Math.max(0, (formerFaction.loyalty ?? 50) - SUCCESSOR_CONFIG.REVOKE_LOYALTY_DROP);
            await supabase.from('factions').update({ loyalty: newLoy }).eq('id', formerFaction.id);
        }

        // Log
        const revokedName = `${currentSuccessor.first_name} ${currentSuccessor.last_name}`;
        await supabase.from('campaign_actions').insert({
            party_id: strongmanFactionId,
            nation_id: nationId,
            action_type: 'revoke_successor',
            tick_performed: currentTick,
            result: {
                revoked_name: revokedName,
                revoked_faction_id: currentSuccessor.faction_id,
            },
        });
    } else {
        // Family member revocation — clear the flag (this also restores AP generation)
        await supabase.from('nations').update({ successor_is_family_member: false }).eq('id', nationId);

        await supabase.from('campaign_actions').insert({
            party_id: strongmanFactionId,
            nation_id: nationId,
            action_type: 'revoke_successor',
            tick_performed: currentTick,
            result: {
                revoked_name: 'Close Family Member',
                is_family_member: true,
            },
        });
    }

    // Stability -5
    const newStability = Math.max(0, Number(nation.stability ?? 50) - SUCCESSOR_CONFIG.REVOKE_STABILITY_DROP);
    await supabase.from('nations').update({ stability: newStability }).eq('id', nationId);

    // All stewards: coup_readiness +3
    await adjustStewardsCoupReadiness(supabase, nationId, SUCCESSOR_CONFIG.REVOKE_COUP_READINESS);

    return { success: true, revokedName: isFamilyRevoke ? 'Close Family Member' : undefined };
}

// ==================== DYNASTY ACTIONS ====================

/**
 * Execute a Dynasty action. Available only to factions whose steward is the Chosen Successor.
 * Three modes: 'shadow', 'cultivate_image', 'prepare_succession'. Each costs 1 AP.
 */
export async function executeDynastyAction(supabase, nationId, factionId, mode, targetFactionId, currentTick) {
    // 1. Validate: caller's steward is the chosen successor
    const { data: mySteward } = await supabase
        .from('stewards')
        .select('id, first_name, last_name, is_chosen_successor, succession_strength, exit_readiness, standing')
        .eq('faction_id', factionId)
        .eq('nation_id', nationId)
        .eq('is_alive', true)
        .single();
    if (!mySteward || !mySteward.is_chosen_successor) {
        return { success: false, error: 'Only the Chosen Successor can use Dynasty actions.' };
    }

    // 2. Validate mode
    if (!['shadow', 'cultivate_image', 'prepare_succession'].includes(mode)) {
        return { success: false, error: 'Invalid dynasty mode.' };
    }

    // 3. Deduct AP
    const apResult = await deductAP(supabase, factionId, SUCCESSOR_CONFIG.DYNASTY_AP_COST);
    if (!apResult.success) return { success: false, error: 'Not enough AP.' };

    const result = { mode, newAp: apResult.newAp };

    if (mode === 'shadow') {
        // Requires a target faction
        if (!targetFactionId) return { success: false, error: 'Shadow requires a target faction.' };

        const { data: targetSteward } = await supabase
            .from('stewards')
            .select('id, first_name, last_name, true_loyalty, faction_id')
            .eq('faction_id', targetFactionId)
            .eq('nation_id', nationId)
            .eq('is_alive', true)
            .single();
        if (!targetSteward) return { success: false, error: 'Target faction has no living steward.' };

        // Reveal true loyalty
        result.targetName = `${targetSteward.first_name} ${targetSteward.last_name}`;
        result.trueLoyalty = targetSteward.true_loyalty;

        // Succession strength +3
        const newSS = (mySteward.succession_strength ?? 0) + SUCCESSOR_CONFIG.DYNASTY_SHADOW_SUCCESSION_STRENGTH;
        await supabase.from('stewards').update({ succession_strength: newSS }).eq('id', mySteward.id);
        result.successionStrengthGain = SUCCESSOR_CONFIG.DYNASTY_SHADOW_SUCCESSION_STRENGTH;

        await supabase.from('campaign_actions').insert({
            party_id: factionId,
            nation_id: nationId,
            action_type: 'dynasty_shadow',
            tick_performed: currentTick,
            result: {
                target_faction_id: targetFactionId,
                target_name: result.targetName,
                true_loyalty: result.trueLoyalty,
                succession_strength_gain: SUCCESSOR_CONFIG.DYNASTY_SHADOW_SUCCESSION_STRENGTH,
            },
        });

    } else if (mode === 'cultivate_image') {
        // Nation legitimacy +1
        const { data: nationRow } = await supabase.from('nations').select('legitimacy').eq('id', nationId).single();
        const newLeg = Math.min(100, Number(nationRow?.legitimacy ?? 50) + SUCCESSOR_CONFIG.DYNASTY_CULTIVATE_LEGITIMACY);
        await supabase.from('nations').update({ legitimacy: newLeg }).eq('id', nationId);

        // Succession strength +5
        const newSS = (mySteward.succession_strength ?? 0) + SUCCESSOR_CONFIG.DYNASTY_CULTIVATE_SUCCESSION_STRENGTH;
        await supabase.from('stewards').update({ succession_strength: newSS }).eq('id', mySteward.id);

        // All OTHER stewards: standing -1
        const { data: otherStewards } = await supabase
            .from('stewards')
            .select('id, standing')
            .eq('nation_id', nationId)
            .eq('is_alive', true)
            .neq('id', mySteward.id);
        for (const s of (otherStewards || [])) {
            const newStanding = Math.max(0, (s.standing ?? 50) - SUCCESSOR_CONFIG.DYNASTY_CULTIVATE_STANDING_PENALTY);
            await supabase.from('stewards').update({ standing: newStanding }).eq('id', s.id);
        }

        result.legitimacyGain = SUCCESSOR_CONFIG.DYNASTY_CULTIVATE_LEGITIMACY;
        result.successionStrengthGain = SUCCESSOR_CONFIG.DYNASTY_CULTIVATE_SUCCESSION_STRENGTH;

        await supabase.from('campaign_actions').insert({
            party_id: factionId,
            nation_id: nationId,
            action_type: 'dynasty_cultivate',
            tick_performed: currentTick,
            result: {
                legitimacy_gain: SUCCESSOR_CONFIG.DYNASTY_CULTIVATE_LEGITIMACY,
                succession_strength_gain: SUCCESSOR_CONFIG.DYNASTY_CULTIVATE_SUCCESSION_STRENGTH,
                standing_penalty: SUCCESSOR_CONFIG.DYNASTY_CULTIVATE_STANDING_PENALTY,
            },
        });

    } else if (mode === 'prepare_succession') {
        // Succession strength +8, exit_readiness +10
        const newSS = (mySteward.succession_strength ?? 0) + SUCCESSOR_CONFIG.DYNASTY_PREPARE_SUCCESSION_STRENGTH;
        const newER = Math.min(100, (mySteward.exit_readiness ?? 0) + SUCCESSOR_CONFIG.DYNASTY_PREPARE_EXIT_READINESS);
        await supabase.from('stewards').update({
            succession_strength: newSS,
            exit_readiness: newER,
        }).eq('id', mySteward.id);

        // 10% detection chance
        const detected = Math.random() < SUCCESSOR_CONFIG.DYNASTY_PREPARE_DETECTION_CHANCE;
        result.successionStrengthGain = SUCCESSOR_CONFIG.DYNASTY_PREPARE_SUCCESSION_STRENGTH;
        result.exitReadinessGain = SUCCESSOR_CONFIG.DYNASTY_PREPARE_EXIT_READINESS;
        result.detected = detected;

        if (detected) {
            // Log a detection entry visible to the strongman (ruling faction)
            const { data: nationRow } = await supabase.from('nations').select('ruling_faction_id').eq('id', nationId).single();
            await supabase.from('campaign_actions').insert({
                party_id: nationRow?.ruling_faction_id || factionId,
                nation_id: nationId,
                action_type: 'dynasty_detected_prepare',
                tick_performed: currentTick,
                result: {
                    steward_name: `${mySteward.first_name} ${mySteward.last_name}`,
                    faction_id: factionId,
                },
            });
        }

        // Log the prepare action to the acting faction
        await supabase.from('campaign_actions').insert({
            party_id: factionId,
            nation_id: nationId,
            action_type: 'dynasty_prepare',
            tick_performed: currentTick,
            result: {
                succession_strength_gain: SUCCESSOR_CONFIG.DYNASTY_PREPARE_SUCCESSION_STRENGTH,
                exit_readiness_gain: SUCCESSOR_CONFIG.DYNASTY_PREPARE_EXIT_READINESS,
                detected,
            },
        });
    }

    return { success: true, ...result };
}

// ==================== PHASE 8: COUP OVERHAUL & REGIME HEALTH ====================

/**
 * Get regime health threshold label and effects.
 */
export function getRegimeHealthTier(regimeHealth) {
    if (regimeHealth >= 60) return { label: 'HEALTHY', color: '#5cb85c', coupBonus: 0, loyaltyDecay: -2 };
    if (regimeHealth >= 40) return { label: 'WEAKENING', color: '#FFC107', coupBonus: 5, loyaltyDecay: -2.5 };
    if (regimeHealth >= 20) return { label: 'DECLINING', color: '#FF9800', coupBonus: 10, loyaltyDecay: -3 };
    if (regimeHealth >= 1) return { label: 'CRITICAL', color: '#F44336', coupBonus: 20, loyaltyDecay: -4 };
    return { label: 'COLLAPSED', color: '#B71C1C', coupBonus: 30, loyaltyDecay: -5 };
}

/**
 * Process regime health tick: natural decay, modifiers, recovery.
 * Called once per tick for each autocracy nation.
 */
export async function processRegimeHealthTick(supabase, nation, currentTick) {
    if (!isAutocracy(nation)) return;

    let rh = Number(nation.regime_health ?? 80);
    const startingRH = 80; // recovery cap

    // Natural decay: -0.5/tick
    rh -= 0.5;

    // Fetch factions for modifier calculations
    const { data: factions } = await supabase
        .from('factions')
        .select('id, loyalty, standing, seats')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');

    if (factions && factions.length > 0) {
        // Recovery: high average loyalty across non-ruling factions
        const nonRuling = factions.filter(f => f.id !== nation.ruling_faction_id);
        if (nonRuling.length > 0) {
            const avgLoyalty = nonRuling.reduce((s, f) => s + (f.loyalty ?? 50), 0) / nonRuling.length;
            if (avgLoyalty >= 60) rh += 0.3;
        }
    }

    // Recovery: high stability
    if ((nation.stability ?? 50) >= 60) rh += 0.3;

    // Recovery: has a chosen successor
    const { data: successorCheck } = await supabase
        .from('stewards')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('is_chosen_successor', true)
        .eq('is_alive', true)
        .limit(1);
    if (successorCheck && successorCheck.length > 0) rh += 0.1;

    // Recovery: no active crises (check for recent negative events)
    // Simple heuristic: if stability > 50 and no recent purges/coups, small bonus
    const { data: recentBadEvents } = await supabase
        .from('campaign_actions')
        .select('id')
        .eq('nation_id', nation.id)
        .in('action_type', ['purge', 'coup_failed', 'faction_intimidate'])
        .gte('tick_performed', currentTick - 3)
        .limit(1);
    if (!recentBadEvents || recentBadEvents.length === 0) rh += 0.5;

    // Cap: never exceeds starting value
    rh = Math.min(startingRH, Math.max(0, rh));

    // Update nation
    await supabase.from('nations').update({ regime_health: rh }).eq('id', nation.id);

    // Check for collapse (rh === 0)
    if (rh <= 0) {
        await handleRegimeCollapse(supabase, nation, currentTick);
    }

    return rh;
}

/**
 * Handle regime collapse when regime_health reaches 0.
 * If successor exists, they take over. Otherwise, power vacuum.
 */
async function handleRegimeCollapse(supabase, nation, currentTick) {
    const currentDate = _tickToDate(currentTick);

    // Close the outgoing administration before transferring power
    try {
        await closeAdministration(supabase, nation.id, nation, 'regime_collapse', currentTick, currentDate, null);
    } catch (err) {
        console.warn('handleRegimeCollapse: could not close administration:', err);
    }

    // Check for chosen successor
    const { data: successor } = await supabase
        .from('stewards')
        .select('id, faction_id, first_name, last_name')
        .eq('nation_id', nation.id)
        .eq('is_chosen_successor', true)
        .eq('is_alive', true)
        .limit(1)
        .maybeSingle();

    if (successor) {
        // Successor takes over
        await supabase.from('nations').update({
            ruling_faction_id: successor.faction_id,
            regime_health: 40, // partial recovery on succession
            successor_cooldown_end_tick: null,
            successor_is_family_member: false,
        }).eq('id', nation.id);

        // Clear successor status
        await supabase.from('stewards').update({
            is_chosen_successor: false,
            succession_strength: 0,
            successor_appointed_tick: null,
        }).eq('nation_id', nation.id);

        // Reset all loyalties to 40
        await supabase.from('factions').update({ loyalty: 40 })
            .eq('nation_id', nation.id)
            .neq('id', successor.faction_id);

        await supabase.from('campaign_actions').insert({
            party_id: successor.faction_id,
            nation_id: nation.id,
            action_type: 'regime_succession',
            tick_performed: currentTick,
            result: {
                successor_name: `${successor.first_name} ${successor.last_name}`,
                faction_id: successor.faction_id,
                reason: 'regime_collapse',
            },
        });

        // Create new administration for the successor
        try {
            const { data: newFaction } = await supabase
                .from('factions').select('id, faction_name, seats')
                .eq('id', successor.faction_id).single();
            if (newFaction) {
                const syntheticCoalition = { party_ids: [newFaction.id], lead_party_id: newFaction.id };
                await createAdministration(supabase, nation.id, nation, syntheticCoalition, [newFaction], currentTick, currentDate, null);
            }
        } catch (err) {
            console.warn('handleRegimeCollapse: could not create successor administration:', err);
        }
    } else {
        // Power vacuum — highest standing faction takes over with penalties
        const { data: factions } = await supabase
            .from('factions')
            .select('id, standing, faction_name, seats')
            .eq('nation_id', nation.id)
            .eq('faction_type', 'party')
            .neq('id', nation.ruling_faction_id)
            .order('standing', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (factions) {
            await supabase.from('nations').update({
                ruling_faction_id: factions.id,
                regime_health: 30, // low recovery on power vacuum
                stability: Math.max(0, (nation.stability ?? 50) - 10),
            }).eq('id', nation.id);

            // All loyalties reset to 30 (chaotic transition)
            await supabase.from('factions').update({ loyalty: 30 })
                .eq('nation_id', nation.id)
                .neq('id', factions.id);

            await supabase.from('campaign_actions').insert({
                party_id: factions.id,
                nation_id: nation.id,
                action_type: 'power_vacuum',
                tick_performed: currentTick,
                result: {
                    new_ruler: factions.faction_name,
                    faction_id: factions.id,
                    reason: 'regime_collapse',
                },
            });

            // Create new administration for the power vacuum winner
            try {
                const syntheticCoalition = { party_ids: [factions.id], lead_party_id: factions.id };
                await createAdministration(supabase, nation.id, nation, syntheticCoalition, [factions], currentTick, currentDate, null);
            } catch (err) {
                console.warn('handleRegimeCollapse: could not create power vacuum administration:', err);
            }
        }
    }
}

/**
 * Process unaligned seat pool regeneration: +1 seat per 4 ticks.
 * Draws proportionally from largest factions.
 */
export async function processUnalignedPoolTick(supabase, nation, currentTick) {
    if (!isAutocracy(nation)) return;
    if (currentTick % GAME_CONFIG.UNALIGNED_POOL_REGEN_TICKS !== 0) return;

    const totalSeats = nation.total_seats || GAME_CONFIG.TOTAL_SEATS;
    const maxPool = Math.floor(totalSeats * GAME_CONFIG.UNALIGNED_POOL_MAX_RATIO);
    const currentPool = nation.unaligned_seats || 0;

    if (currentPool >= maxPool) return;

    // Find the largest faction to draw from
    const { data: factions } = await supabase
        .from('factions')
        .select('id, seats')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party')
        .order('seats', { ascending: false })
        .limit(1);

    if (!factions || factions.length === 0 || factions[0].seats <= GAME_CONFIG.NEW_FACTION_MIN_SEATS) return;

    // Draw 1 seat from largest faction
    await supabase.from('factions').update({ seats: factions[0].seats - 1 }).eq('id', factions[0].id);
    await supabase.from('nations').update({ unaligned_seats: currentPool + 1 }).eq('id', nation.id);
}

/**
 * Calculate coup success probability.
 * Based on standing, seats, funds, regime health, and allies.
 */
export function calculateCoupProbability(faction, nation, allies = []) {
    const standing = faction.standing ?? 30;
    const seats = faction.seats ?? 0;
    const totalSeats = nation.total_seats || GAME_CONFIG.TOTAL_SEATS;
    const funds = Number(faction.embezzled_funds ?? 0);
    const rh = Number(nation.regime_health ?? 80);

    // Base probability from standing (0-30%)
    const standingComponent = (standing / 90) * 30;

    // Seat ratio component (0-25%)
    const seatRatio = seats / totalSeats;
    const seatComponent = Math.min(25, seatRatio * 100);

    // Funds component (0-20%)
    const fundsComponent = Math.min(20, (funds / 100) * 20);

    // Regime health weakness bonus (0-20%)
    const tier = getRegimeHealthTier(rh);
    const rhComponent = tier.coupBonus;

    // Ally bonus (up to 15%)
    let allyBonus = 0;
    for (const ally of allies) {
        allyBonus += ((ally.seats ?? 0) / totalSeats) * 15;
    }
    allyBonus = Math.min(15, allyBonus);

    const raw = standingComponent + seatComponent + fundsComponent + rhComponent + allyBonus;
    return Math.max(5, Math.min(95, Math.round(raw)));
}

/**
 * Get qualitative coup estimate with noise for player display.
 */
export function getCoupEstimate(faction, nation, allies = []) {
    const trueProbability = calculateCoupProbability(faction, nation, allies);

    // Apply noise: ±((100 - standing) / 100 × 15%)
    const standing = faction.standing ?? 30;
    const noiseRange = ((100 - standing) / 100) * 15;
    const noise = (Math.random() * 2 - 1) * noiseRange;
    const displayed = Math.max(5, Math.min(95, Math.round(trueProbability + noise)));

    // Map to tier
    let tier, color;
    if (displayed < 25) { tier = 'DESPERATE'; color = '#F44336'; }
    else if (displayed < 40) { tier = 'RISKY'; color = '#FF9800'; }
    else if (displayed < 55) { tier = 'UNCERTAIN'; color = '#FFC107'; }
    else if (displayed < 70) { tier = 'FAVORABLE'; color = '#8BC34A'; }
    else { tier = 'STRONG'; color = '#5cb85c'; }

    return { tier, color, displayed, trueProbability };
}

/**
 * Check if a faction meets the new v2 coup requirements.
 */
export function canAttemptCoup(faction, nation, currentTick) {
    const standing = faction.standing ?? 30;
    const seats = faction.seats ?? 0;
    const totalSeats = nation.total_seats || GAME_CONFIG.TOTAL_SEATS;
    const funds = Number(faction.embezzled_funds ?? 0);
    const lockoutUntil = faction.coup_lockout_until_tick;

    const reasons = [];
    if (standing < GAME_CONFIG.COUP_MIN_STANDING) {
        reasons.push(`Standing ${standing} < ${GAME_CONFIG.COUP_MIN_STANDING}`);
    }
    if (seats / totalSeats < GAME_CONFIG.COUP_MIN_SEAT_RATIO) {
        reasons.push(`Seats ${seats} < ${Math.ceil(totalSeats * GAME_CONFIG.COUP_MIN_SEAT_RATIO)} (${Math.round(GAME_CONFIG.COUP_MIN_SEAT_RATIO * 100)}%)`);
    }
    if (funds < GAME_CONFIG.COUP_FUNDS_THRESHOLD) {
        reasons.push(`Funds $${Math.round(funds)}M < $${GAME_CONFIG.COUP_FUNDS_THRESHOLD}M`);
    }
    if (lockoutUntil && currentTick < lockoutUntil) {
        reasons.push(`Lockout until tick ${lockoutUntil} (${lockoutUntil - currentTick} ticks)`);
    }
    // Check if faction is the ruling faction
    if (faction.id === nation.ruling_faction_id) {
        reasons.push('Cannot coup yourself');
    }

    return { canCoup: reasons.length === 0, reasons };
}

/**
 * Send a coup invitation to another faction.
 * Stores as a campaign_action with status 'pending_coup_invite'.
 */
export async function sendCoupInvitation(supabase, factionId, nationId, targetFactionId, currentTick) {
    // Validate sender meets coup requirements
    const { data: faction } = await supabase
        .from('factions')
        .select('id, standing, seats, embezzled_funds, coup_lockout_until_tick, faction_name')
        .eq('id', factionId)
        .single();
    if (!faction) return { success: false, error: 'Faction not found' };

    const { data: nation } = await supabase
        .from('nations')
        .select('id, ruling_faction_id, total_seats, regime_health')
        .eq('id', nationId)
        .single();
    if (!nation) return { success: false, error: 'Nation not found' };

    const eligibility = canAttemptCoup(faction, nation, currentTick);
    if (!eligibility.canCoup) return { success: false, error: `Not eligible: ${eligibility.reasons.join(', ')}` };

    // Check if already invited this faction
    const { data: existing } = await supabase
        .from('campaign_actions')
        .select('id')
        .eq('party_id', factionId)
        .eq('nation_id', nationId)
        .eq('action_type', 'coup_invitation')
        .gte('tick_performed', currentTick - 2)
        .limit(1);
    if (existing && existing.length > 0) return { success: false, error: 'Already sent an invitation recently' };

    // Check max 2 invitations
    const { data: allInvites } = await supabase
        .from('campaign_actions')
        .select('id')
        .eq('party_id', factionId)
        .eq('nation_id', nationId)
        .eq('action_type', 'coup_invitation')
        .gte('tick_performed', currentTick - 2);
    if (allInvites && allInvites.length >= 2) return { success: false, error: 'Maximum 2 invitations per coup attempt' };

    // Get estimate for display to invitee
    const estimate = getCoupEstimate(faction, nation);

    await supabase.from('campaign_actions').insert({
        party_id: factionId,
        nation_id: nationId,
        action_type: 'coup_invitation',
        tick_performed: currentTick,
        result: {
            target_faction_id: targetFactionId,
            inviter_name: faction.faction_name,
            estimate_tier: estimate.tier,
            status: 'pending',
        },
    });

    return { success: true, estimateTier: estimate.tier };
}

/**
 * Respond to a coup invitation.
 * Options: 'accept', 'decline', 'report'
 */
export async function respondToCoupInvitation(supabase, factionId, nationId, invitationId, response, currentTick) {
    // Load the invitation
    const { data: invite } = await supabase
        .from('campaign_actions')
        .select('id, party_id, result')
        .eq('id', invitationId)
        .single();
    if (!invite) return { success: false, error: 'Invitation not found' };
    if (invite.result?.target_faction_id !== factionId) return { success: false, error: 'Not your invitation' };
    if (invite.result?.status !== 'pending') return { success: false, error: 'Already responded' };

    const inviterId = invite.party_id;
    const updatedResult = { ...invite.result, status: response, responded_tick: currentTick };

    await supabase.from('campaign_actions')
        .update({ result: updatedResult })
        .eq('id', invitationId);

    if (response === 'report') {
        // Reporter: loyalty +15
        const { data: reporter } = await supabase
            .from('factions').select('id, loyalty').eq('id', factionId).single();
        if (reporter) {
            const newLoyalty = Math.min(GAME_CONFIG.LOYALTY_CAP, (reporter.loyalty ?? 50) + 15);
            await supabase.from('factions').update({ loyalty: newLoyalty }).eq('id', factionId);
        }

        // Plotter: loyalty -20, standing -5
        const { data: plotter } = await supabase
            .from('factions').select('id, loyalty, standing').eq('id', inviterId).single();
        if (plotter) {
            const newLoyalty = Math.max(0, (plotter.loyalty ?? 50) - 20);
            const newStanding = Math.max(0, (plotter.standing ?? 30) - 5);
            await supabase.from('factions').update({ loyalty: newLoyalty, standing: newStanding }).eq('id', inviterId);
        }

        // Notify strongman
        const { data: nation } = await supabase.from('nations').select('ruling_faction_id').eq('id', nationId).single();
        await supabase.from('campaign_actions').insert({
            party_id: nation?.ruling_faction_id || factionId,
            nation_id: nationId,
            action_type: 'coup_plot_reported',
            tick_performed: currentTick,
            result: {
                reporter_faction_id: factionId,
                plotter_faction_id: inviterId,
            },
        });
    }

    return { success: true, response };
}

/**
 * Execute a coup attempt (v2 overhaul).
 * New requirements: standing >= 15, seats >= 10%, funds >= $30M.
 */
export async function executeCoupAttempt(supabase, factionId, nationId, fundsCommitted, currentTick, nationName = '') {
    // Load faction data
    const { data: faction } = await supabase
        .from('factions')
        .select('id, standing, seats, embezzled_funds, coup_lockout_until_tick, faction_name, loyalty')
        .eq('id', factionId)
        .single();
    if (!faction) return { success: false, error: 'Faction not found' };

    const { data: nation } = await supabase
        .from('nations')
        .select('id, ruling_faction_id, total_seats, regime_health, stability')
        .eq('id', nationId)
        .single();
    if (!nation) return { success: false, error: 'Nation not found' };

    // Validate requirements
    const eligibility = canAttemptCoup(faction, nation, currentTick);
    if (!eligibility.canCoup) return { success: false, error: `Not eligible: ${eligibility.reasons.join(', ')}` };

    // Validate funds commitment (must commit at least $30M, can't exceed holdings)
    const funds = Number(faction.embezzled_funds ?? 0);
    const committed = Math.min(funds, fundsCommitted);
    if (committed < GAME_CONFIG.COUP_FUNDS_THRESHOLD) {
        return { success: false, error: `Must commit at least $${GAME_CONFIG.COUP_FUNDS_THRESHOLD}M` };
    }

    // Find accepted allies
    const { data: acceptedInvites } = await supabase
        .from('campaign_actions')
        .select('id, result')
        .eq('party_id', factionId)
        .eq('nation_id', nationId)
        .eq('action_type', 'coup_invitation')
        .gte('tick_performed', currentTick - 2);

    const allyIds = [];
    if (acceptedInvites) {
        for (const inv of acceptedInvites) {
            if (inv.result?.status === 'accepted') {
                allyIds.push(inv.result.target_faction_id);
            }
        }
    }

    // Load ally data
    let allies = [];
    if (allyIds.length > 0) {
        const { data: allyData } = await supabase
            .from('factions')
            .select('id, standing, seats, faction_name')
            .in('id', allyIds);
        allies = allyData || [];
    }

    // Calculate true probability
    const trueProbability = calculateCoupProbability(faction, nation, allies);
    const success = Math.random() * 100 < trueProbability;

    // Deduct committed funds regardless
    await supabase.from('factions').update({
        embezzled_funds: Math.max(0, funds - committed),
    }).eq('id', factionId);

    const totalSeats = nation.total_seats || GAME_CONFIG.TOTAL_SEATS;

    if (success) {
        // === COUP SUCCESS ===
        // Old strongman's faction: reset
        const oldRulingId = nation.ruling_faction_id;

        // New ruler
        await supabase.from('nations').update({
            ruling_faction_id: factionId,
            regime_health: Math.max(20, Number(nation.regime_health ?? 80) - 10),
            stability: Math.max(0, (nation.stability ?? 50) - 5),
            successor_cooldown_end_tick: null,
            successor_is_family_member: false,
        }).eq('id', nationId);

        // Clear any chosen successors
        await supabase.from('stewards').update({
            is_chosen_successor: false, succession_strength: 0, successor_appointed_tick: null,
        }).eq('nation_id', nationId).eq('is_chosen_successor', true);

        // Coup leader: standing +10, loyalty set to 70
        await supabase.from('factions').update({
            standing: Math.min(GAME_CONFIG.STANDING_CAP, (faction.standing ?? 30) + 10),
            loyalty: 70,
            coup_lockout_until_tick: null,
        }).eq('id', factionId);

        // Allies: standing +10, loyalty set to 70
        for (const ally of allies) {
            await supabase.from('factions').update({
                standing: Math.min(GAME_CONFIG.STANDING_CAP, (ally.standing ?? 30) + 10),
                loyalty: 70,
            }).eq('id', ally.id);
        }

        // Non-involved factions: loyalty reset to 40
        const involvedIds = [factionId, ...allyIds, oldRulingId].filter(Boolean);
        await supabase.from('factions').update({ loyalty: 40 })
            .eq('nation_id', nationId)
            .eq('faction_type', 'party')
            .not('id', 'in', `(${involvedIds.join(',')})`);

        await supabase.from('campaign_actions').insert({
            party_id: factionId,
            nation_id: nationId,
            action_type: 'coup_success',
            tick_performed: currentTick,
            result: {
                faction_name: faction.faction_name,
                allies: allies.map(a => a.faction_name),
                probability: trueProbability,
                funds_committed: committed,
            },
        });

        // Fire timeline event
        try {
            await supabase.rpc('fire_system_event', {
                p_trigger_key: 'coup_attempt',
                p_nation_id: nationId,
                p_tick: currentTick,
                p_placeholders: { result: 'success', faction: faction.faction_name, allies: allies.map(a => a.faction_name).join(', ') }
            });
        } catch (e) { /* non-blocking */ }

        // Close the old administration and create a new one for the coup leader
        try {
            const currentDate = _tickToDate(currentTick);
            const { data: fullNation } = await supabase.from('nations').select('*').eq('id', nationId).single();
            if (fullNation) {
                await closeAdministration(supabase, nationId, fullNation, 'coup', currentTick, currentDate, null);
                const syntheticCoalition = { party_ids: [factionId], lead_party_id: factionId };
                await createAdministration(supabase, nationId, fullNation, syntheticCoalition, [faction], currentTick, currentDate, null);
            }
        } catch (err) {
            console.warn('executeCoupAttempt: could not rollover administration:', err);
        }

        return {
            success: true,
            coupSuccess: true,
            probability: trueProbability,
            allies: allies.map(a => a.faction_name),
        };
    } else {
        // === COUP FAILURE ===
        // Leader: steward dies, standing -25, loyalty 10, lose 40% seats, 6-tick lockout
        const { data: leaderSteward } = await supabase
            .from('stewards')
            .select('id, first_name, last_name, steward_type, pillar_key')
            .eq('faction_id', factionId)
            .eq('nation_id', nationId)
            .eq('is_alive', true)
            .limit(1)
            .maybeSingle();

        if (leaderSteward) {
            await supabase.from('stewards').update({ is_alive: false }).eq('id', leaderSteward.id);

            // Generate new steward
            const { firstNames: coupFirstPool, lastNames: coupLastPool } = getNationNames(nationName);
            const newFirstName = coupFirstPool[Math.floor(Math.random() * coupFirstPool.length)];
            const newLastName = coupLastPool[Math.floor(Math.random() * coupLastPool.length)];
            await supabase.from('stewards').insert({
                faction_id: factionId,
                nation_id: nationId,
                first_name: newFirstName,
                last_name: newLastName,
                age: 35 + Math.floor(Math.random() * 20),
                steward_type: leaderSteward.steward_type || 'party_chairman',
                pillar_key: leaderSteward.pillar_key,
                standing: 10,
                power_base: 15,
                true_loyalty: 50,
                estimated_loyalty: 50,
                personal_wealth: 0,
                exit_readiness: 0,
                coup_readiness: 0,
                is_alive: true,
            });
        }

        // Leader faction penalties
        const seatLoss = Math.floor((faction.seats ?? 0) * 0.40);
        await supabase.from('factions').update({
            standing: Math.max(0, (faction.standing ?? 30) - 25),
            loyalty: 10,
            embezzled_funds: 0,
            seats: Math.max(1, (faction.seats ?? 0) - seatLoss),
            coup_lockout_until_tick: currentTick + GAME_CONFIG.COUP_LOCKOUT_TICKS,
        }).eq('id', factionId);

        // Distribute lost seats to ruling faction
        if (seatLoss > 0 && nation.ruling_faction_id) {
            const { data: ruler } = await supabase
                .from('factions').select('id, seats').eq('id', nation.ruling_faction_id).single();
            if (ruler) {
                await supabase.from('factions').update({
                    seats: (ruler.seats ?? 0) + seatLoss,
                }).eq('id', ruler.id);
            }
        }

        // Allies: standing -15, loyalty -20, lose 20% seats (transferred to ruling faction)
        let totalAllySeatLoss = 0;
        for (const ally of allies) {
            const allySeatLoss = Math.floor((ally.seats ?? 0) * 0.20);
            const { data: allyFaction } = await supabase
                .from('factions').select('id, loyalty, standing, seats')
                .eq('id', ally.id).single();
            if (allyFaction) {
                const actualLoss = Math.min(allySeatLoss, (allyFaction.seats ?? 0) - 1); // keep at least 1
                await supabase.from('factions').update({
                    standing: Math.max(0, (allyFaction.standing ?? 30) - 15),
                    loyalty: Math.max(0, (allyFaction.loyalty ?? 50) - 20),
                    seats: (allyFaction.seats ?? 0) - actualLoss,
                }).eq('id', ally.id);
                totalAllySeatLoss += actualLoss;
            }
        }
        // Transfer ally lost seats to ruling faction
        if (totalAllySeatLoss > 0 && nation.ruling_faction_id) {
            const { data: ruler2 } = await supabase
                .from('factions').select('id, seats').eq('id', nation.ruling_faction_id).single();
            if (ruler2) {
                await supabase.from('factions').update({
                    seats: (ruler2.seats ?? 0) + totalAllySeatLoss,
                }).eq('id', ruler2.id);
            }
        }

        // Regime health penalty
        await supabase.from('nations').update({
            regime_health: Math.max(0, Number(nation.regime_health ?? 80) - 5),
            stability: Math.max(0, (nation.stability ?? 50) - 3),
        }).eq('id', nationId);

        await supabase.from('campaign_actions').insert({
            party_id: factionId,
            nation_id: nationId,
            action_type: 'coup_failed',
            tick_performed: currentTick,
            result: {
                faction_name: faction.faction_name,
                steward_name: leaderSteward ? `${leaderSteward.first_name} ${leaderSteward.last_name}` : 'Unknown',
                allies: allies.map(a => a.faction_name),
                probability: trueProbability,
                funds_committed: committed,
                seats_lost: seatLoss,
            },
        });

        // Fire timeline event
        try {
            await supabase.rpc('fire_system_event', {
                p_trigger_key: 'coup_attempt',
                p_nation_id: nationId,
                p_tick: currentTick,
                p_placeholders: { result: 'failed', faction: faction.faction_name, steward_killed: leaderSteward ? `${leaderSteward.first_name} ${leaderSteward.last_name}` : 'Unknown', seats_lost: String(seatLoss) }
            });
        } catch (e) { /* non-blocking */ }

        return {
            success: true,
            coupSuccess: false,
            probability: trueProbability,
            seatsLost: seatLoss,
            stewardDied: !!leaderSteward,
        };
    }
}
