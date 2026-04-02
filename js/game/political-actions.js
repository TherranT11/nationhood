/**
 * political-actions.js — Political actions, tick processors, crises, events, resign PM, disband party
 * Extracted from game-common.js
 */

import { deductAP, GAME_CONFIG, FORMATION_DEADLINE_TICKS } from './config.js';
import { CANONICAL_GOVERNMENT_TYPES, isPresidentialRepublic } from './government-types.js';
import { RAW_SCALING_DIVISORS, STAT_PROCESSOR_SKIP } from './diplomacy-constants.js';
import { IDEOLOGY_OPPOSITES, IDEOLOGY_TO_AXIS, loadFactionIdeology } from './ideology.js';
import { MINISTER_APPROVAL_CONFIG, ISSUE_CATEGORY_STATS, MINISTRY_TO_STATS, NATION_STAT_COLUMNS, NATION_STAT_COLUMN_SET, STAT_DECAY_CONFIG, STAT_TO_MINISTRY, buildMinistryBaselines, getAveragedInstitutionDecay, normalizeNationStatKey, statDirectionSign, buildFundingPctMap, getInstFundingPct } from './stats.js';
import { adjustGovernmentApprovalEvent } from './momentum.js';
import { fetchActiveCoalition } from './government-structure.js';
import { closeAdministration, createAdministration, dissolveCoalition } from './elections.js';
import { getTraitAPModifier, applyRallyTraitModifiers, getTraitApprovalMultiplier, getEffectiveBlocDisposition, POSITIVE_TRAITS } from './party-leadership.js';
import { onRally, onOutreach, onAttack, nudgeEnthusiasm, nudgeApproval, ELECTORATE_CONFIG as E_CFG } from './electorate.js';

const _PA_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
function _tickToDate(tick) {
    return `${_PA_MONTHS[tick % 12]}, ${2000 + Math.floor(tick / 12)}`;
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

        const rawDecayVal = nation[statKey];
        // Skip if stat is null/undefined — never default to 50
        if (rawDecayVal === undefined || rawDecayVal === null) continue;
        const currentVal = Number(rawDecayVal);
        if (Number.isNaN(currentVal)) continue;
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

        newVal = Math.round(Math.max(2, Math.min(98, newVal)) * 10) / 10;

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

    // Enforce foundational law caps on stats
    // Judicial Appointment Politicization Act: cap judicial_independence at 30
    if (nation.judicial_appointment_politicization) {
        const ji = nationUpdates.judicial_independence ?? Number(nation.judicial_independence ?? 50);
        if (ji > 30) nationUpdates.judicial_independence = 30;
    }
    // State Media Control Act: cap press_freedom at 40
    if (nation.state_media_control) {
        const pf = nationUpdates.press_freedom ?? Number(nation.press_freedom ?? 50);
        if (pf > 40) nationUpdates.press_freedom = 40;
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

        const rawSource = nation[conn.source_stat];
        const rawTarget = nation[conn.target_stat];
        // Skip if source or target stat is null/undefined — never default to 50
        if (rawSource === undefined || rawSource === null || rawTarget === undefined || rawTarget === null) continue;
        const sourceVal = Number(rawSource);
        const targetVal = Number(rawTarget);
        if (Number.isNaN(sourceVal) || Number.isNaN(targetVal)) continue;

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
            newVal = Math.round(Math.max(2, Math.min(98, newVal)) * 10) / 10;
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
        headline: bloc => `Massive turnout at ${bloc} rally — supporters overflow venue`,
    },
    {
        id: 'solid', name: 'Solid Turnout',
        targetMin: 3, targetMax: 5, spillover: 0, spilloverScope: 'none',
        headline: bloc => `Party rally draws steady crowd in ${bloc} district — a strong showing`,
    },
    {
        id: 'low', name: 'Low Turnout',
        targetMin: 1, targetMax: 2, spillover: 0, spilloverScope: 'none',
        headline: bloc => `Sparse attendance at ${bloc} rally raises questions about grassroots support`,
    },
    {
        id: 'gaffe', name: 'Gaffe',
        targetMin: -3, targetMax: -2, spillover: -1, spilloverScope: 'random_adjacent',
        headline: bloc => `Party leader's remarks draw swift backlash at ${bloc} event`,
    },
    {
        id: 'divisive', name: 'Divisive Speech',
        targetMin: 5, targetMax: 7, spillover: -2, spilloverScope: 'all_others',
        headline: bloc => `Fiery rally speech energizes ${bloc} base but draws condemnation from opposition`,
    },
    {
        id: 'counter', name: 'Counter-Protest',
        targetMin: -1, targetMax: -1, spillover: -2, spilloverScope: 'all',
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

    // ── 3. Load target bloc (optional) + nation stats ──
    // (voter_blocs table removed; default to General Public)
    let targetBloc = { id: null, bloc_name: 'General Public', population_weight: 100 };

    const { data: nation } = await supabase
        .from('nations').select('polarization, civil_unrest, stability').eq('id', nationId).single();
    const { count: crisisCount } = await supabase
        .from('active_crises').select('id', { count: 'exact', head: true }).eq('nation_id', nationId);

    // ── 4. Target approval (legacy bloc-approval removed; default to 50) ──
    const targetApproval = 50;

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

    // ── 7. Apply momentum from rally outcome ──
    const effects = [];
    const momSign = targetDelta >= 0 ? '+' : '';
    const { error: momErr } = await supabase.rpc('adjust_momentum', {
        p_faction_id: factionId, p_delta: targetDelta,
        p_label: `Rally: ${outcome.name} (${momSign}${targetDelta})`, p_tick: currentTick
    });
    if (momErr) console.warn('[Rally] Momentum RPC failed:', momErr.message);
    effects.push({ stat: 'Momentum', value: targetDelta });

    // ── 8. Deduct AP + track last_action_tick ──
    // KNOWN ISSUE: AP deducted after effects applied. Early check (step 1) prevents common case.
    // Atomic RPC prevents DB over-spending. Race condition is acceptable for alpha.
    const apResult = await deductAP(supabase, factionId, effectiveRallyCost, { reason: 'rally', detail: 'Hold a Rally', tick: currentTick });
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

    // Electorate engine: update visibility + activity log
    try {
        const rallyResult = await onRally(supabase, factionId, nationId, outcomeId, currentTick);
        if (rallyResult?.visBoost !== 0) {
            effects.push({ stat: 'Visibility', value: rallyResult.visBoost });
        }
        if (rallyResult?.approvalHit != null && rallyResult.approvalHit !== 0) {
            effects.push({ stat: 'Party Approval', value: rallyResult.approvalHit });
        }
    } catch (e) {
        console.error('[Rally] Electorate hook failed (non-fatal):', e.message);
    }

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
 * Legacy stub — returns 50 (neutral) since bloc-targeting was removed.
 */
export function computeOutreachAlignment(factionIdeology, bloc) {
    return 50;
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

    // ── 4. Load all blocs (voter_blocs table removed; default to empty) ──
    const allBlocs = [];

    const targetBloc = allBlocs.find(b => b.id === blocId);
    if (!targetBloc) return { success: false, error: 'Voter bloc not found.' };

    // ── 5. Compute alignment and effect ──
    const alignment = factionIdeo ? computeOutreachAlignment(factionIdeo, targetBloc) : 50;
    let { diminished } = calcOutreachEffect(alignment, recentToBloc);

    // Apply leader trait multipliers: telegenic (+30%), divisive_figure (halved for non-BASE)
    // Default to SWING disposition (electorate system handles approval now)
    const blocDisp = 'SWING';
    const effectiveDisp = getEffectiveBlocDisposition(blocDisp, faction);
    let outreachMult = getTraitApprovalMultiplier(faction, 'outreach', effectiveDisp);
    if (outreachMult !== 1.0) {
        diminished = Math.max(1, Math.round(diminished * outreachMult));
    }

    // ── 6. Effects (legacy bloc-approval writes removed; electorate hook handles approval now) ──
    const effects = [];

    // ── 9. Deduct AP + track last_action_tick ──
    const apResult = await deductAP(supabase, factionId, effectiveOutreachCost, { reason: 'outreach', detail: 'Community Outreach', tick: currentTick });
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

    // Electorate engine: update visibility + approval + activity log
    try { await onOutreach(supabase, factionId, nationId, alignment, diminished, currentTick); } catch (e) {
        console.error('[Outreach] Electorate hook failed (non-fatal):', e.message);
    }

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
    // faction_endorsements table has been removed; endorsements are not currently available.
    return { success: false, error: 'Endorsements are not available.' };
}


// ==================== ATTACK CAMPAIGN ====================

export const ATTACK_CONFIG = {
    AP_COST: 3,                 // base cost (used when polarization < 50)
    CREDIBILITY_COST: 20,       // credibility drops 20 per attack
    COOLDOWN_WINDOW: 6,         // look back 6 ticks for recent attacks
    COUNTER_ATTACK_WINDOW: 3,   // target can counter-attack within 3 ticks
    COUNTER_ATTACK_AP_COST: 1,  // counter-attack costs only 1 AP
    COUNTER_ATTACK_BONUS: 2,    // +2 effectiveness bonus for counter-attacks
    // Escalating AP cost thresholds — attacks cost more when polarization is high
    AP_TIERS: [
        { minPol: 85, cost: 6 },
        { minPol: 70, cost: 5 },
        { minPol: 50, cost: 4 },
        { minPol: 0,  cost: 3 },
    ],
};

/**
 * Get the AP cost for a Campaign Attack based on current polarization.
 * Higher polarization → higher cost to discourage polarization farming.
 */
export function getAttackAPCost(polarization) {
    const pol = polarization || 0;
    for (const tier of ATTACK_CONFIG.AP_TIERS) {
        if (pol >= tier.minPol) return tier.cost;
    }
    return ATTACK_CONFIG.AP_COST;
}

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
    // ── 1. Validate AP (with leader trait modifiers + polarization scaling) ──
    const { data: faction } = await supabase
        .from('factions').select('action_points, faction_name, leader_positive_traits, leader_negative_traits, last_action_tick').eq('id', factionId).single();
    if (!faction) return { success: false, error: 'Faction not found.' };
    const { data: nationForCost } = await supabase
        .from('nations').select('polarization').eq('id', nationId).single();
    const baseAttackCost = getAttackAPCost(nationForCost?.polarization);
    const attackApMod = getTraitAPModifier('attack', faction, currentTick);
    const effectiveAttackCost = Math.max(1, baseAttackCost + attackApMod);
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

    // ── 7. Apply effects via electorate engine ──
    const effects = [];

    // Target party: approval hit + credibility damage
    if (targetDelta !== 0) {
        const approvalDelta = _round2(targetDelta * 0.3);
        const credDelta = _round3(targetDelta * 0.01);
        await _nudgeApproval(supabase, targetFactionId, nationId, approvalDelta, 'attack');
        await _adjustCredibility(supabase, targetFactionId, nationId, credDelta, 0, currentTick, { source: 'attack:received' });
        effects.push({ label: targetFaction.faction_name, value: targetDelta });
    }

    // Self: credibility change (attacks can backfire or boost credibility)
    if (selfDelta !== 0) {
        const selfLabel = selfDelta > 0 ? 'Your party (credibility gain)' : 'Your party (credibility loss)';
        const selfCredDelta = _round3(selfDelta * 0.01);
        await _adjustCredibility(supabase, factionId, nationId, selfCredDelta, 0, currentTick, { source: 'attack:self' });
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
    const apResult = await deductAP(supabase, factionId, effectiveAttackCost, { reason: 'attack', detail: 'Campaign Attack', tick: currentTick });
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

    // Electorate engine: credibility damage + visibility + activity log
    try { await onAttack(supabase, factionId, targetFactionId, nationId, outcomeId, vector.strength, currentTick); } catch (e) {
        console.error('[Attack] Electorate hook failed (non-fatal):', e.message);
    }

    return {
        success: true,
        outcomeId,
        outcomeName: outcome.name,
        headline,
        effects,
        weights,
        opensCounter,
        newAp: apResult.newAp ?? ((faction.action_points || 0) - effectiveAttackCost),
    };
}


// ==================== MAKE PROMISE ====================

export const MAKE_PROMISE_CONFIG = {
    AP_COST: 2,
    STAT_DELTA: 10,                    // Promise to change stat by ±10
    STAT_DELTA_GOVERNING: 20,          // Governing factions must promise ±20 (harder target)
    DEADLINE_DICE: 24,                 // 1D24 + base
    DEADLINE_BASE: 6,                  // base ticks added to roll (range: 7-30)
    MAX_ACTIVE_PROMISES: 5,            // limit active promises per faction

    // ── Electorate engine effects (party_approval only — credibility removed, 3-pillar system) ──
    APPROVAL_ON_PROMISE: 2,            // immediate +party_approval when promise is made
    PENALTY_PER_TICK_MIN: 0.5,         // -0.5 to -1.5 party_approval/tick while governing & unfulfilled
    PENALTY_PER_TICK_MAX: 1.5,

    // Promise kept rewards
    KEPT_APPROVAL: 2,                  // +party_approval when promise fulfilled
    KEPT_CREDIBILITY: 0.07,            // no-op: credibility removed (3-pillar election system)

    // Promise broken penalties
    BROKEN_APPROVAL: -2,               // -party_approval when promise broken
    BROKEN_CREDIBILITY: -0.10,         // no-op: credibility removed (3-pillar election system)
    BROKEN_CREDIBILITY_SUSPEND: 12,    // no-op: credibility removed (3-pillar election system)
    BROKEN_NERVOUS_CREDIBILITY: -0.03, // no-op: credibility removed (3-pillar election system)
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

    // Validate currentTick is a finite number (NaN serializes to null in JSON, violating NOT NULL)
    if (currentTick == null || !Number.isFinite(currentTick)) {
        console.error('[MakePromise] Invalid currentTick:', currentTick);
        return { success: false, error: 'Cannot make a promise right now — tick data unavailable. Please refresh.' };
    }

    // ── 1. Validate faction (with leader trait modifiers) ──
    const { data: faction } = await supabase
        .from('factions').select('party_funds, action_points, abbreviation, faction_name, leader_positive_traits, leader_negative_traits, last_action_tick')
        .eq('id', factionId).single();
    if (!faction) return { success: false, error: 'Faction not found.' };

    const promiseApMod = getTraitAPModifier('promise', faction, currentTick);
    const effectivePromiseCost = Math.max(1, cfg.AP_COST + promiseApMod);
    if (effectivePromiseCost > 0 && (faction.action_points || 0) < effectivePromiseCost)
        return { success: false, error: `Not enough AP. Need ${effectivePromiseCost}.` };

    // ── 2. Check active promise limit (includes pending_election promises) ──
    const { data: activePromises } = await supabase
        .from('fundraiser_promises')
        .select('id, demand_type, conditions')
        .eq('party_id', factionId)
        .in('status', ['active', 'pending_election']);

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

    // voter_blocs table removed; default to empty array
    const allBlocs = [];

    // ── 4. Roll deadline: 1D24 + 6 (countdown deferred until next election + in government) ──
    const deadlineRoll = Math.floor(Math.random() * cfg.DEADLINE_DICE) + 1;
    const deadlineTicks = deadlineRoll + cfg.DEADLINE_BASE;
    const tickDeadline = currentTick + deadlineTicks; // Placeholder — real deadline set when promise activates after election

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

    // ── 6. Apply immediate party_approval bump via electorate engine ──
    const approvalBump = cfg.APPROVAL_ON_PROMISE;
    await _nudgeApproval(supabase, factionId, nationId, approvalBump, 'promise:made');
    console.log(`[Promise] +${approvalBump} party_approval for ${factionId} on making ${promiseType} promise`);
    const blocEffects = [];

    // ── 7. Deduct AP if needed + track last_action_tick ──
    let newAp = faction.action_points || 0;
    if (effectivePromiseCost > 0) {
        const apResult = await deductAP(supabase, factionId, effectivePromiseCost, { reason: 'promise', detail: 'Make a Promise', tick: currentTick });
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
            tick_deadline: currentTick + deadlineTicks, // Placeholder — real deadline set on activation after election
            conditions,
            progress: { source: 'make_promise', promise_type: promiseType },
            status: 'pending_election',
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

    // Boost nation-wide enthusiasm
    await nudgeEnthusiasm(supabase, nationId, E_CFG.ENTHUSIASM_PROMISE_BOOST);

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



// (Mobilize, Successor Config removed — Phase 0: autocracy actions dismantled)

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

    // Fetch both active and pending_election promises
    const { data: allPromises } = await supabase
        .from('fundraiser_promises')
        .select('*')
        .eq('nation_id', nation.id)
        .in('status', ['active', 'pending_election']);

    if (!allPromises || allPromises.length === 0) return [];

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
    const partyIds = [...new Set(allPromises.map(p => p.party_id))];
    const minTick = Math.min(...allPromises.map(p => p.tick_created));
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

    // Check if any election completed since promise creation (for pending_election activation)
    const { data: completedElections } = await supabase
        .from('elections')
        .select('id, election_tick')
        .eq('nation_id', nation.id)
        .eq('status', 'completed')
        .order('election_tick', { ascending: false })
        .limit(1);
    const lastElectionTick = completedElections?.[0]?.election_tick || 0;

    for (const promise of allPromises) {
        const isGoverning = governingFactionIds.has(promise.party_id);

        // ── Handle pending_election promises: waiting for next election ──
        if (promise.status === 'pending_election') {
            // Has an election completed since this promise was created?
            if (lastElectionTick > promise.tick_created) {
                if (isGoverning) {
                    // Faction won — activate countdown
                    const tickDeadline = currentTick + promise.deadline_ticks;
                    await supabase.from('fundraiser_promises')
                        .update({ status: 'active', tick_deadline: tickDeadline, updated_at: new Date().toISOString() })
                        .eq('id', promise.id);
                    console.log(`[Promise] Activated pending promise ${promise.id} — countdown starts, deadline tick ${tickDeadline}`);
                    results.push({ promise, resolution: 'activated' });
                } else {
                    // Faction in opposition — extinguish silently
                    await supabase.from('fundraiser_promises')
                        .update({ status: 'expired', tick_resolved: currentTick, updated_at: new Date().toISOString() })
                        .eq('id', promise.id);
                    console.log(`[Promise] Extinguished pending promise ${promise.id} — faction not in government after election`);
                    results.push({ promise, resolution: 'expired' });
                }
            }
            // No election yet — promise stays dormant
            continue;
        }

        // ── Handle active promises (countdown running) ──

        // If no longer governing: expire silently (faction lost power mid-countdown)
        if (!isGoverning) {
            if (currentTick >= promise.tick_deadline) {
                await supabase.from('fundraiser_promises')
                    .update({ status: 'expired', tick_resolved: currentTick, updated_at: new Date().toISOString() })
                    .eq('id', promise.id);
                results.push({ promise, resolution: 'expired' });
            }
            continue;
        }

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

        // Per-tick penalty: governing party with unfulfilled promise loses party_approval
        if (isGoverning) {
            const penaltyAmount = -(Math.random() * (cfg.PENALTY_PER_TICK_MAX - cfg.PENALTY_PER_TICK_MIN) + cfg.PENALTY_PER_TICK_MIN);
            const rounded = Math.round(penaltyAmount * 100) / 100;
            await _nudgeApproval(supabase, promise.party_id, promise.nation_id, rounded, 'promise:unfulfilled_penalty');
            results.push({ promise, resolution: 'tick_penalty', penaltyAmount: rounded });
        }
    }

    return results;
}

// ── Rounding helpers (mirrors advance-tick) ──
function _round2(v) { return Math.round(v * 100) / 100; }
function _round3(v) { return Math.round(v * 1000) / 1000; }

/**
 * Nudge a faction's party_approval in faction_electoral_standing.
 * Local helper for promise resolution (mirrors nudgeApproval in advance-tick).
 */
async function _nudgeApproval(supabase, factionId, nationId, delta, source) {
    await nudgeApproval(supabase, factionId, nationId, delta, { source: source || 'unknown' });
}

/**
 * Adjust a faction's credibility_modifier in faction_electoral_standing.
 * Local helper for promise resolution (mirrors adjustCredibility in advance-tick).
 */
// No-op: credibility_modifier column repurposed for momentum (3-pillar election system).
// Server-side advance-tick is authoritative; client-side writes are dead.
async function _adjustCredibility() { return; }

/**
 * Apply rewards or penalties when a promise is resolved.
 */
async function resolvePromise(supabase, promise, resolution, currentTick, nationStats) {
    const cfg = MAKE_PROMISE_CONFIG;

    if (resolution === 'fulfilled') {
        // ── REWARDS via electorate engine (party_approval + credibility) ──
        const keptSource = `promise:kept:${promise.demand_text || 'Unknown'}`;
        await _nudgeApproval(supabase, promise.party_id, promise.nation_id, cfg.KEPT_APPROVAL, 'promise:kept');
        await _adjustCredibility(supabase, promise.party_id, promise.nation_id, cfg.KEPT_CREDIBILITY, 0, currentTick, { source: keptSource });
        console.log(`[Promise] Fulfilled: +${cfg.KEPT_APPROVAL} approval, +${cfg.KEPT_CREDIBILITY} credibility for ${promise.party_id}`);

        // Mark promise as fulfilled
        await supabase.from('fundraiser_promises')
            .update({ status: 'fulfilled', tick_resolved: currentTick, updated_at: new Date().toISOString() })
            .eq('id', promise.id);

    } else if (resolution === 'broken') {
        // ── PENALTIES via electorate engine (party_approval + credibility) ──
        const brokenSource = `promise:broken:${promise.demand_text || 'Unknown'}`;
        await _nudgeApproval(supabase, promise.party_id, promise.nation_id, cfg.BROKEN_APPROVAL, 'promise:broken');
        await _adjustCredibility(supabase, promise.party_id, promise.nation_id, cfg.BROKEN_CREDIBILITY, cfg.BROKEN_CREDIBILITY_SUSPEND, currentTick, { source: brokenSource });
        console.log(`[Promise] Broken: ${cfg.BROKEN_APPROVAL} approval, ${cfg.BROKEN_CREDIBILITY} credibility for ${promise.party_id}`);

        // Nervous effect: other active promises compound credibility damage
        const { data: otherPromises } = await supabase
            .from('fundraiser_promises')
            .select('id')
            .eq('party_id', promise.party_id)
            .eq('status', 'active')
            .neq('id', promise.id);

        if (otherPromises && otherPromises.length > 0) {
            const nervousDelta = cfg.BROKEN_NERVOUS_CREDIBILITY * otherPromises.length;
            await _adjustCredibility(supabase, promise.party_id, promise.nation_id, nervousDelta, 0, currentTick, { source: `promise:nervous:${promise.demand_text || 'Unknown'}` });
            console.log(`[Promise] Nervous effect: ${nervousDelta} credibility (${otherPromises.length} other active promises)`);
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
    const totalSeats = nation.total_seats || GAME_CONFIG.TOTAL_SEATS;

    const { data: factions, error } = await supabase
        .from('factions')
        .select('id, faction_name, seats')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');

    if (error || !factions || factions.length === 0) return null;

    // Proportional redistribution of vacant seats
    const currentSum = factions.reduce((s, f) => s + (f.seats || 0), 0);
    const vacantSeats = totalSeats - currentSum;

    if (vacantSeats <= 0) return null; // No vacant seats

    console.log(`[rebalanceVacantSeats] ${nation.name}: ${vacantSeats} vacant seat(s) detected (${currentSum}/${totalSeats}). Redistributing.`);

    // All factions at 0 seats — distribute evenly
    if (currentSum === 0) {
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
    const quota = currentSum / totalSeats;
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

// (Loyalty tick, Standing tick, Regime pillars tick removed — Phase 0)

// (Steward tick, Autocracy v2 faction actions, Coalition detection, Shakeup auto-resolve removed — Phase 0)

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

                    const rawVal = nationUpdates[statKey] !== undefined
                        ? nationUpdates[statKey]
                        : (nation[statKey] !== undefined && nation[statKey] !== null ? Number(nation[statKey]) : null);
                    // Guard: if stat is null/undefined in DB, log warning and skip — never default to 50
                    if (rawVal === null || Number.isNaN(rawVal)) {
                        console.warn(`[processStatEffects] Stat "${statKey}" is null/NaN for ${nation.name} — skipping effect to prevent corruption`);
                        continue;
                    }
                    const currentVal = rawVal;

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
                        // Clamp 0-100 scale stats to 2-98 floor/ceiling to prevent edge-case corruption
                        newVal = Math.round(Math.max(2, Math.min(98, newVal)) * 10) / 10;
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
                            const { data: standing } = await supabase
                                .from('faction_electoral_standing')
                                .select('party_approval')
                                .eq('faction_id', action.faction_id)
                                .eq('nation_id', nation.id)
                                .maybeSingle();
                            factionUpdates[fKey] = (standing?.party_approval ?? 50);
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
                        const rawMinVal = nationUpdates[statKey] !== undefined
                            ? nationUpdates[statKey]
                            : (nation[statKey] !== undefined && nation[statKey] !== null ? Number(nation[statKey]) : null);
                        // Guard: skip if stat is null/NaN — never default to 50
                        if (rawMinVal === null || Number.isNaN(rawMinVal)) {
                            console.warn(`[processMinistryActions] Stat "${statKey}" is null/NaN for ${nation.name} — skipping`);
                            continue;
                        }
                        currentVal = rawMinVal;
                        let scaledMinistryRate = RAW_SCALING_DIVISORS[statKey] ? rate * RAW_SCALING_DIVISORS[statKey] : rate;
                        newVal = eff.direction === 'up' ? currentVal + scaledMinistryRate : currentVal - scaledMinistryRate;
                        // Raw-value stats (debt, population) must not be clamped to 0-100
                        if (RAW_SCALING_DIVISORS[statKey]) {
                            newVal = Math.max(0, newVal);
                        } else {
                            newVal = Math.round(Math.max(2, Math.min(98, newVal)) * 10) / 10;
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
            const { data: standing } = await supabase
                .from('faction_electoral_standing')
                .select('party_approval')
                .eq('faction_id', factionId)
                .eq('nation_id', nation.id)
                .maybeSingle();
            factionUpdates[factionId] = (standing?.party_approval ?? 50);
            factionBaseline[factionId] = factionUpdates[factionId];
        }
        factionUpdates[factionId] = Math.max(0, factionUpdates[factionId] - (loss * multiplier));
    }

    // Bulk update faction party_approval via event cascades
    for (const fKey of Object.keys(factionUpdates)) {
        const delta = Math.round((factionUpdates[fKey] - (factionBaseline[fKey] ?? 50)) * 10) / 10;
        if (delta !== 0) {
            await _nudgeApproval(supabase, fKey, nation.id, _round2(delta * 0.3), 'rally');
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
        // Apply delta-based movement on top of baseline decay.
        // Baselines are permanent (appointment snapshot), so cap the cumulative delta
        // to prevent runaway approval. ±5 cap means max ±3/tick from stat performance.
        const clampedDelta = Math.max(-5, Math.min(5, avgDelta));
        if (Math.abs(clampedDelta) >= 0.5) {
            newApproval += clampedDelta * cfg.DELTA_SENSITIVITY;
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

        // Keep stat_baselines as the original appointment snapshot (never overwrite).
        // The UI uses baselines to show cumulative change since appointment.
        const { error: updateErr } = await supabase.from('ministries')
            .update({ minister_approval: newApproval })
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

/**
 * Check for government collapse when approval is critically low.
 * At ≤5%: coalition parties lose -5 party approval/tick, opposition gains +2.
 * At 0%: government dissolves and snap election is called.
 * Returns { collapsed, penalized } or null if no government or not in danger zone.
 */
export async function processGovernmentCollapseCheck(supabase, nation, currentTick) {
    if (isPresidentialRepublic(nation)) return null;
    const govApproval = Number(nation.gov_approval ?? 50);
    if (govApproval > 5) return null;

    // Skip if a near-term election is already scheduled (PM called early elections, or snap already pending).
    // Only skip for elections within 5 ticks — far-future regular elections should not prevent collapse.
    const { data: pendingElections } = await supabase.from('elections')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('status', 'scheduled')
        .lte('election_tick', currentTick + 5)
        .limit(1);
    if (pendingElections && pendingElections.length > 0) {
        console.log(`[GovCollapse] ${nation.name}: skipping — near-term elections already scheduled`);
        return null;
    }

    const coalition = await fetchActiveCoalition(supabase, nation.id);
    if (!coalition || !coalition.party_ids || coalition.party_ids.length === 0) return null;

    // Skip if coalition is already caretaker (dissolution already happened)
    if (coalition.status === 'caretaker') {
        console.log(`[GovCollapse] ${nation.name}: skipping — already caretaker government`);
        return null;
    }

    const coalitionIds = new Set(coalition.party_ids);

    // At 0%: auto-dissolve and trigger snap election
    if (govApproval <= 0) {
        console.log(`[GovCollapse] ${nation.name}: approval at ${govApproval}% — dissolving government and calling snap election`);

        // Close administration
        try {
            const { data: shard } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
            await closeAdministration(supabase, nation.id, nation, 'collapsed', currentTick, shard?.current_date || '', null);
        } catch (e) { console.warn('[GovCollapse] closeAdministration failed:', e); }

        await dissolveCoalition(supabase, nation.id);

        // Freeze active bills
        await supabase.from('bills')
            .update({ status: 'frozen' })
            .eq('nation_id', nation.id)
            .in('status', ['committee', 'floor']);

        // Cancel any far-future scheduled parliamentary elections before scheduling snap
        // (preserve presidential elections — president stays in office through collapse)
        await supabase.from('elections')
            .delete()
            .eq('nation_id', nation.id)
            .eq('status', 'scheduled')
            .or('election_type.is.null,election_type.eq.parliamentary');

        // Schedule snap election
        const snapTick = currentTick + FORMATION_DEADLINE_TICKS;
        await supabase.from('elections').insert({
            nation_id: nation.id,
            election_tick: snapTick,
            election_type: 'parliamentary',
            status: 'scheduled'
        });

        // Fire world-visible event
        await supabase.from('event_log').insert({
            nation_id: nation.id,
            event_name: 'Government Collapses',
            trigger_key: 'government_collapsed',
            description_chosen: `The government of ${nation.name} has collapsed after approval hit 0%. Snap elections have been called.`,
            category: 'government',
            fired_at_tick: currentTick
        });

        return { collapsed: true, penalized: false };
    }

    // At 1-5%: cascading penalties
    console.log(`[GovCollapse] ${nation.name}: approval at ${govApproval}% — applying collapse penalties`);

    const { data: allFactions } = await supabase
        .from('factions')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');

    let penalizedCount = 0;
    for (const f of (allFactions || [])) {
        const isCoalition = coalitionIds.has(f.id);
        if (isCoalition) {
            // Coalition parties lose -5 party approval per tick
            await nudgeApproval(supabase, f.id, nation.id, -5, { source: 'gov_collapse_penalty' });
            penalizedCount++;
        } else {
            // Opposition parties gain +2 party approval per tick
            await nudgeApproval(supabase, f.id, nation.id, 2, { source: 'gov_collapse_opposition_boost' });
        }
    }

    // Fire event (nation-visible)
    await supabase.from('event_log').insert({
        nation_id: nation.id,
        event_name: 'Government on Verge of Collapse',
        trigger_key: 'government_collapse_warning',
        description_chosen: `Government approval in ${nation.name} has fallen to ${govApproval}%. Coalition parties are hemorrhaging support.`,
        category: 'government',
        fired_at_tick: currentTick
    });

    return { collapsed: false, penalized: penalizedCount };
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
        if (law.is_reversal) continue; // Reversals undo stat effects, not ongoing costs
        const policy = law.policies;
        if (!policy) continue;
        if (policy.policy_type === 'lever') continue; // Levers are one-time — no ongoing cost

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
                        const scaledDelta = _round2(effectiveGovChange * 0.3);
                        await _nudgeApproval(supabase, partyId, nation.id, scaledDelta, 'crisis:' + template.name);
                        appliedEffects.push({
                            stat: 'party_approval', change: scaledDelta,
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

                    // Cascade PM approval loss to party_approval (scaled)
                    if (changePT < 0 && pmMinistry.party_id) {
                        const cascadeDelta = _round2(-(Math.abs(changePT) * 0.5));
                        await _nudgeApproval(supabase, pmMinistry.party_id, nation.id, cascadeDelta, 'crisis:cascade:pm');

                        appliedEffects.push({
                            stat: 'party_approval', change: cascadeDelta,
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

                    // Cascade minister approval loss to party_approval (scaled; PM 0.5x, others 0.25x)
                    if (changePT < 0 && ministry.party_id) {
                        const loss = Math.abs(changePT);
                        const multiplier = effect.minister_key === 'prime_minister' ? 0.5 : 0.25;
                        const cascadeDelta = _round2(-(loss * multiplier));
                        await _nudgeApproval(supabase, ministry.party_id, nation.id, cascadeDelta, 'crisis:cascade:ministry');

                        appliedEffects.push({
                            stat: 'party_approval', change: cascadeDelta,
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

        // Protest crisis fizzle: T6/T7 crises auto-resolve when their
        // duration expires (1d6 ticks for T6, 1d12 for T7).
        if (!allEndConditionsMet && (template.id === PROTEST_CONFIG.TIER6_CRISIS_ID || template.id === PROTEST_CONFIG.TIER7_CRISIS_ID)) {
            try {
                const { data: protestRow } = await supabase.from('protest_log')
                    .select('id, crisis_started_tick, crisis_duration, faction_id')
                    .eq('nation_id', nation.id)
                    .eq('status', 'crisis_active')
                    .order('crisis_started_tick', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                if (protestRow && protestRow.crisis_started_tick != null && protestRow.crisis_duration != null) {
                    const ticksElapsed = currentTick - protestRow.crisis_started_tick;
                    if (ticksElapsed >= protestRow.crisis_duration) {
                        allEndConditionsMet = true;
                        // Mark protest as fizzled
                        await supabase.from('protest_log').update({
                            status: 'resolved',
                            tick_resolved: currentTick,
                        }).eq('id', protestRow.id);
                        // Clear lockouts
                        if (protestRow.faction_id) {
                            await supabase.from('factions')
                                .update({ action_lockout_until_tick: null })
                                .eq('id', protestRow.faction_id);
                        }
                        const tierLabel = template.id === PROTEST_CONFIG.TIER7_CRISIS_ID ? 'Tier 7' : 'Tier 6';
                        console.log(`[processCrises] Protest ${tierLabel} crisis fizzled in ${nation.name} after ${ticksElapsed} ticks`);
                        // Fire world-visible fizzle event
                        await supabase.from('event_log').insert({
                            nation_id: nation.id,
                            event_name: `Protest Crisis Fizzles`,
                            trigger_key: 'protest:crisis_fizzled',
                            description_chosen: `The ${tierLabel} protest crisis in ${nation.name} has fizzled out after ${ticksElapsed} ticks. Stability returning.`,
                            category: 'protest',
                            fired_at_tick: currentTick
                        });
                    }
                }
            } catch (fizzleErr) {
                console.warn('[processCrises] Protest fizzle check failed (non-fatal):', fizzleErr);
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

            // 1d6 government approval boost for resolving a crisis
            const crisisResolveBoost = Math.ceil(Math.random() * 6);
            await adjustGovernmentApprovalEvent(supabase, nation.id, crisisResolveBoost, `crisis:resolved:${template.name}`);

            crisisEvents.push({
                type: 'crisis_resolved',
                crisisName: template.name,
                duration: currentTick - activeRecord.started_at_tick,
                tick: currentTick
            });

            console.log(`Crisis resolved: "${template.name}" in ${nation.name} (tick ${currentTick}, duration: ${currentTick - activeRecord.started_at_tick} ticks, gov approval +${crisisResolveBoost})`);
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


// ==================== UTILITY FORMATTERS ====================
// (Democratic revolution and seize-autocratic-power systems removed — autocracy scrapped)

export function _removedProcessRevolution() { return null; }
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

// Calveth names (Danish)
export const CALVETH_FIRST_NAMES = [
    'Lukas', 'Noah', 'Victor', 'Oliver', 'Oscar', 'William', 'Emil', 'Alfred',
    'Magnus', 'Mads', 'Frederik', 'Christian', 'Mikkel', 'Anders', 'Lars',
    'Søren', 'Rasmus', 'Kristian', 'Morten', 'Jesper', 'Henrik', 'Thomas',
    'Jacob', 'Sebastian', 'Mathias', 'Valdemar', 'Karl', 'Arthur', 'Otto',
    'August', 'Erik', 'Jens', 'Niels', 'Hans', 'Poul', 'Viggo', 'Aksel',
    'Felix', 'Malthe', 'Gustav', 'Alma', 'Ida', 'Clara', 'Ella', 'Olivia',
    'Freja', 'Sofie', 'Astrid', 'Maja', 'Agnes'
];

export const CALVETH_LAST_NAMES = [
    'Jensen', 'Nielsen', 'Hansen', 'Pedersen', 'Andersen', 'Christensen',
    'Larsen', 'Sørensen', 'Rasmussen', 'Jørgensen', 'Petersen', 'Madsen',
    'Kristensen', 'Olsen', 'Thomsen', 'Christiansen', 'Poulsen', 'Johansen',
    'Knudsen', 'Mortensen', 'Møller', 'Jacobsen', 'Jakobsen', 'Olesen',
    'Frederiksen', 'Mikkelsen', 'Henriksen', 'Laursen', 'Lund', 'Schmidt',
    'Eriksen', 'Holm', 'Clausen', 'Svendsen', 'Andreasen', 'Iversen',
    'Jeppesen', 'Vestergaard', 'Bertelsen', 'Nissen', 'Kjær', 'Gregersen',
    'Jepsen', 'Hermansen', 'Bayer', 'Buch', 'Dahl', 'Dam', 'Haugaard',
    'Høeg', 'Jespersen', 'Kjeldsen', 'Kofod', 'Kragh', 'Krogh', 'Lassen',
    'Lind', 'Lorentzen', 'Ludvigsen', 'Mathiasen', 'Mogensen', 'Munk',
    'Nedergaard', 'Nygaard', 'Nørgaard', 'Ottosen', 'Overgaard', 'Pallesen',
    'Schiøtz', 'Simonsen', 'Skov', 'Søndergaard', 'Villadsen', 'Winther'
];

const CALVETH_NATIONS = ['Calveth'];

// Flandis names (Dutch)
export const FLANDIS_FIRST_NAMES = [
    'Anneliese', 'Bregje', 'Clasien', 'Dymphna', 'Elske', 'Fenna', 'Grietje', 'Hanneke',
    'Ilse', 'Jobke', 'Karlijn', 'Lieselotte', 'Maaike', 'Nienke', 'Roos',
    'Adriaan', 'Bastiaan', 'Casper', 'Damiaan', 'Evert', 'Floris', 'Gerben', 'Harmen',
    'Ivo', 'Jasper', 'Klaas', 'Laurens', 'Maarten', 'Niels', 'Olaf', 'Pieter',
    'Quinten', 'Reinier', 'Sander', 'Thijs', 'Uwe', 'Valentijn', 'Wessel', 'Xander',
    'Yorick', 'Zeger', 'Arjen', 'Bram', 'Cor', 'Daan', 'Egbert', 'Folkert',
    'Gijs', 'Hedzer', 'Imro'
];

export const FLANDIS_LAST_NAMES = [
    'Bakker', 'Bos', 'Bosman', 'Brouwer', 'De Graaf', 'De Jong', 'De Vries', 'De Wit',
    'Dekker', 'Dijkstra', 'Dijk', 'Driessen', 'Gerritsen', 'Hendriks', 'Hermans',
    'Hoekstra', 'Huisman', 'Jacobs', 'Janssen', 'Koster', 'Kuiper', 'Lammers', 'Maas',
    'Meijer', 'Mulder', 'Peters', 'Pieters', 'Pijpers', 'Post', 'Prins', 'Smit',
    'Smits', 'Snel', 'Snoek', 'Timmers', 'Van Dam', 'Van den Berg', 'Van den Bosch',
    'Van der Laan', 'Van der Meer', 'Van Dijk', 'Van Houten', 'Van Leeuwen', 'Van Rijn',
    'Vermeer', 'Visser', 'Willems', 'Wolff', 'Zijlstra', 'Zwart'
];

const FLANDIS_NATIONS = ['Flandis'];

// Female first names from both name pools (used for gendered title selection)
const FEMALE_NAMES = new Set([
    // Crucera
    'Camila', 'Valentina', 'Isabela', 'Mariana', 'Catalina', 'Renata',
    // Avelia
    'Luciana', 'Sofía', 'Elena', 'Rosario', 'Carolina', 'Paloma', 'Inés',
    'Marisol', 'Florencia', 'Celeste',
    // Calveth
    'Alma', 'Ida', 'Clara', 'Ella', 'Olivia', 'Freja', 'Sofie', 'Astrid',
    'Maja', 'Agnes',
    // Flandis
    'Anneliese', 'Bregje', 'Clasien', 'Dymphna', 'Elske', 'Fenna', 'Grietje',
    'Hanneke', 'Ilse', 'Jobke', 'Karlijn', 'Lieselotte', 'Maaike', 'Nienke', 'Roos'
]);

export function isFemaleName(firstName) {
    return FEMALE_NAMES.has(firstName);
}

export function getNationNames(nationName) {
    if (AVELIA_NATIONS.includes(nationName)) {
        return { firstNames: AVELIA_FIRST_NAMES, lastNames: AVELIA_LAST_NAMES };
    }
    if (CALVETH_NATIONS.includes(nationName)) {
        return { firstNames: CALVETH_FIRST_NAMES, lastNames: CALVETH_LAST_NAMES };
    }
    if (FLANDIS_NATIONS.includes(nationName)) {
        return { firstNames: FLANDIS_FIRST_NAMES, lastNames: FLANDIS_LAST_NAMES };
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

// PM_TRAIT_KEYS removed — PM/President trait now comes from party leader's first positive trait


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

    // Load faction with leader data (including leader_ideology as single source of truth)
    const { data: faction, error: factionErr } = await supabase
        .from('factions')
        .select('id, faction_name, leader_first_name, leader_last_name, leader_age, leader_ideology, leader_positive_traits')
        .eq('id', factionId)
        .single();
    if (factionErr || !faction) throw new Error('Faction not found');
    if (!faction.leader_first_name || !faction.leader_last_name) {
        throw new Error('Party leader data is incomplete — cannot auto-appoint PM.');
    }

    // Use the leader's existing ideology as single source of truth.
    // Only fall back to a weighted random pick if leader_ideology is unset.
    let factionIdeology = await loadFactionIdeology(supabase, factionId);
    if (factionIdeology?._error) {
        console.error(`[autoAppointPartyLeaderAsPM] DB error loading ideology for ${factionId}, using neutral weights`);
        factionIdeology = null;
    }

    let ideology;
    if (faction.leader_ideology) {
        ideology = IDEOLOGY_OPTIONS.find(o => o.tag === faction.leader_ideology.toUpperCase())
            || IDEOLOGY_OPTIONS[0];
    } else {
        const weightedIdeologies = getWeightedIdeologies(factionIdeology);
        ideology = weightedRandomPick(weightedIdeologies).item;
    }

    // Use the leader's first positive trait (from party leadership system)
    const traitKey = (faction.leader_positive_traits && faction.leader_positive_traits.length > 0)
        ? faction.leader_positive_traits[0]
        : null;

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

    // Fire system event
    const traitDef = traitKey ? POSITIVE_TRAITS.find(t => t.key === traitKey) : null;
    try {
        await supabase.rpc('fire_system_event', {
            p_trigger_key: 'pm_appointed',
            p_nation_id: nationId,
            p_tick: currentTick,
            p_placeholders: {
                nation: nationForBaseline?.name || '',
                pm_name: pmFullName,
                party: faction.faction_name,
                trait: traitDef?.name || traitKey || 'None'
            }
        });
    } catch (e) { console.warn('PM appointed event fire failed (non-blocking):', e); }

    console.log(`Auto-appointed party leader as PM: ${pmFullName} (${traitKey}) for faction ${factionId}`);
    return { first_name: faction.leader_first_name, last_name: faction.leader_last_name, age: leaderAge, ideology: ideology.tag, trait_key: traitKey };
}

export async function processPMTraitEffects(supabase, nation, currentTick) {
    // Old leader_traits effect system removed — PM/President trait is now purely display
    // (shows the party leader's first positive trait from the candidate trait system).
    // Future: implement mechanical effects from POSITIVE_TRAITS if desired.
    return;

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
        await _nudgeApproval(supabase, factionId, nation.id, _round2(effects.party_approval_per_tick * 0.3), 'trait:pm_approval_per_tick');
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
        const { data: standing } = await supabase
            .from('faction_electoral_standing')
            .select('party_approval')
            .eq('faction_id', factionId)
            .eq('nation_id', nation.id)
            .maybeSingle();

        if (standing) {
            let delta = 0;
            if (standing.party_approval < 40 && effects.approval_below_50_bonus) {
                delta = effects.approval_below_50_bonus;
            } else if (standing.party_approval > 50 && effects.approval_above_60_penalty) {
                delta = effects.approval_above_60_penalty;
            }
            if (delta !== 0) {
                await _nudgeApproval(supabase, factionId, nation.id, _round2(delta * 0.3), 'trait:pm_approval_conditional');
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
            await _nudgeApproval(supabase, opp.id, nation.id, _round2(effects.opposition_approval_per_tick * 0.3), 'trait:opposition_approval_per_tick');
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
            await _nudgeApproval(supabase, factionId, nation.id, _round2(effects.no_bill_penalty_per_tick * 0.3), 'trait:no_bill_penalty');
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

    // 2. Approval, credibility & stability penalties
    await _nudgeApproval(supabase, factionId, nationId, -3, 'resign_pm');
    await _adjustCredibility(supabase, factionId, nationId, -0.05, 0, currentTick, { source: 'resign_pm' });

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

    // 2. Fetch nation for ruling checks + seat redistribution
    const { data: nation } = await supabase
        .from('nations')
        .select('id, name, ruling_faction_id, government_type, total_seats')
        .eq('id', nationId)
        .single();

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
                    .update({
                        party_id: null, minister_first_name: null, minister_last_name: null,
                        minister_age: null, pending_minister: null,
                        confirmation_status: null
                    })
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
        .update({
            party_id: null, minister_first_name: null, minister_last_name: null,
            minister_age: null, pending_minister: null,
            confirmation_status: null
        })
        .eq('nation_id', nationId)
        .eq('party_id', factionId)
        .eq('is_active', true);
    if (catchAllMinErr) console.warn('disbandParty: catch-all ministry vacate failed:', catchAllMinErr);

    // 4c. Clear any pending nominations in this nation where the pending_minister
    //     references the disbanded faction (the nomination bill is already gone)
    const { data: pendingMins } = await supabase
        .from('ministries')
        .select('id, pending_minister')
        .eq('nation_id', nationId)
        .eq('is_active', true)
        .not('pending_minister', 'is', null);
    if (pendingMins) {
        for (const m of pendingMins) {
            const pm = m.pending_minister;
            if (pm && (pm.party_id === factionId || pm.nominated_by === factionId)) {
                await supabase.from('ministries').update({
                    pending_minister: null,
                    confirmation_status: null,
                    minister_first_name: null, minister_last_name: null, minister_age: null
                }).eq('id', m.id);
            }
        }
    }

    // 5. Zero seats and redistribute to remaining parties
    const { data: dyingFaction } = await supabase
        .from('factions').select('seats').eq('id', factionId).single();
    const vacatedSeats = dyingFaction?.seats || 0;

    await supabase.from('factions')
        .update({ seats: 0 })
        .eq('id', factionId);

    // 6. Immediately redistribute vacated seats to remaining parties
    if (nation && vacatedSeats > 0) {
        await rebalanceVacantSeats(supabase, nation);
    }

    // 6b. Nullify FK references that would block future hard-deletes of the faction
    const fkResults = await Promise.allSettled([
        supabase.from('active_laws').update({ proposed_by: null }).eq('proposed_by', factionId),
        supabase.from('administrations').update({ pm_party_id: null }).eq('pm_party_id', factionId),
        supabase.from('election_candidates').delete().eq('faction_id', factionId),
        supabase.from('presidential_candidates').delete().eq('faction_id', factionId),
        supabase.from('protests').update({ faction_id: null }).eq('faction_id', factionId),
        // Transfer IPO founder status to president — prevents new faction with same UUID from inheriting veto
        supabase.from('international_orgs').select('id, president_id').eq('founding_party_id', factionId).then(async ({ data: orgs }) => {
            for (const org of (orgs || [])) {
                if (org.president_id) await supabase.from('international_orgs').update({ founding_party_id: org.president_id }).eq('id', org.id);
            }
        }),
    ]);
    for (const r of fkResults) {
        if (r.status === 'rejected') console.warn('disbandParty: FK cleanup error:', r.reason);
        else if (r.value?.error) console.warn('disbandParty: FK cleanup error:', r.value.error.message);
    }

    // 7. Core disband — null out nation_id, reset all stats to fresh defaults
    const { error: disbandErr } = await supabase
        .from('factions')
        .update({
            nation_id: null,
            abandoned_at: new Date().toISOString(),
            disband_cooldown_until_tick: currentTick + 24,
            action_points: 0,
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
    await supabase.from('faction_ideology').delete().eq('faction_id', factionId);
    await supabase.from('ideology_history').delete().eq('faction_id', factionId);
    // momentum_log table dropped — no cleanup needed
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


// (Appoint successor, Dynasty actions, Coup/Regime health systems removed — Phase 0)
