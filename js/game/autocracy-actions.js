/**
 * autocracy-actions.js — V5 Autocracy action dispatch framework.
 * Generic validation, dual-mode (FOR REGIME / FOR YOURSELF), AP costs,
 * escalating costs, cooldowns, action logging, and leader death resets.
 *
 * V5 Autocracy System — Phase 4
 */

import { GAME_CONFIG, deductAP } from './config.js';
import { isAutocracy } from './government-types.js';
import { computeFactionPower, getPowerDelta, applyTrackerContribution, PILLAR_KEYS } from './autocracy-pillars.js';

// ─── Action definitions registry ─────────────────────────────────────────────

/**
 * Master action registry. Each action defines its properties.
 * Specific action implementations (Phase 5/6) register here.
 *
 * Shape: {
 *   pillar: string,           // 'military'|'party'|'oligarchs'|'media'|'security'|'strongman'
 *   baseCost: number,         // base AP cost
 *   escalatingCostField: string|null,  // faction_pillar_state column for escalation (null = no escalation)
 *   escalationSteps: number[]|null,    // AP cost sequence, e.g. [2,4,6]
 *   cooldownField: string|null,        // faction_pillar_state column for cooldown tracking
 *   cooldownTicks: number|null,        // minimum ticks between uses
 *   hasDualMode: boolean,     // true = FOR REGIME / FOR YOURSELF toggle
 *   halfPowerForRegime: boolean, // true = delta halved in FOR_REGIME mode
 *   isStrongmanExclusive: boolean, // true = only Strongman can use
 *   mutualExclusions: string[], // action types that block this one same tick
 *   execute: async function,   // implementation (added in Phase 5/6)
 * }
 */
export const AUTOCRACY_ACTIONS = {};

/**
 * Register an action in the registry.
 */
export function registerAutocracyAction(actionType, definition) {
    AUTOCRACY_ACTIONS[actionType] = definition;
}

// ─── Escalating cost helpers ─────────────────────────────────────────────────

/**
 * Get the current AP cost for an escalating action.
 * @param {Object} factionState - faction_pillar_state row
 * @param {Object} actionDef - action definition from registry
 * @returns {number} current AP cost
 */
export function getEscalatingCost(factionState, actionDef) {
    if (!actionDef.escalatingCostField || !actionDef.escalationSteps) {
        return actionDef.baseCost;
    }
    const currentLevel = factionState[actionDef.escalatingCostField] || actionDef.escalationSteps[0];
    return currentLevel;
}

/**
 * Get the next escalation level after using an action.
 * @param {Object} factionState
 * @param {Object} actionDef
 * @returns {number} next cost level
 */
export function getNextEscalationLevel(factionState, actionDef) {
    if (!actionDef.escalatingCostField || !actionDef.escalationSteps) return null;
    const current = factionState[actionDef.escalatingCostField] || actionDef.escalationSteps[0];
    const idx = actionDef.escalationSteps.indexOf(current);
    if (idx === -1 || idx >= actionDef.escalationSteps.length - 1) {
        return actionDef.escalationSteps[actionDef.escalationSteps.length - 1]; // cap at max
    }
    return actionDef.escalationSteps[idx + 1];
}

// ─── Cooldown helpers ────────────────────────────────────────────────────────

/**
 * Check if an action is on cooldown.
 * @param {Object} factionState
 * @param {Object} actionDef
 * @param {number} currentTick
 * @returns {{ onCooldown: boolean, remainingTicks: number }}
 */
export function checkCooldown(factionState, actionDef, currentTick) {
    if (!actionDef.cooldownField || !actionDef.cooldownTicks) {
        return { onCooldown: false, remainingTicks: 0 };
    }
    const lastUseTick = factionState[actionDef.cooldownField] || 0;
    const elapsed = currentTick - lastUseTick;
    if (elapsed < actionDef.cooldownTicks) {
        return { onCooldown: true, remainingTicks: actionDef.cooldownTicks - elapsed };
    }
    return { onCooldown: false, remainingTicks: 0 };
}

// ─── Mutual exclusion check ─────────────────────────────────────────────────

/**
 * Check if any mutually exclusive action was used this tick.
 * @param {Object} supabase
 * @param {string} factionId
 * @param {string} nationId
 * @param {number} currentTick
 * @param {string[]} exclusions - action types to check
 * @returns {Promise<string|null>} conflicting action type, or null
 */
async function checkMutualExclusion(supabase, factionId, nationId, currentTick, exclusions) {
    if (!exclusions || exclusions.length === 0) return null;

    const { data: logs } = await supabase
        .from('autocracy_action_log')
        .select('action_type')
        .eq('faction_id', factionId)
        .eq('nation_id', nationId)
        .eq('tick', currentTick)
        .in('action_type', exclusions);

    if (logs && logs.length > 0) return logs[0].action_type;
    return null;
}

// ─── Action dispatch ─────────────────────────────────────────────────────────

/**
 * Dispatch an autocracy action. This is the single entry point for all actions.
 *
 * Validates: government type, action existence, pillar access, AP cost,
 * cooldown, mutual exclusion, then deducts AP, applies tracker contribution,
 * logs the action, and calls the action's execute function.
 *
 * @param {Object} supabase
 * @param {Object} params
 * @param {string} params.factionId
 * @param {string} params.nationId
 * @param {string} params.actionType - key in AUTOCRACY_ACTIONS
 * @param {string} params.mode - 'regime' or 'self' (ignored for stand_down)
 * @param {number} params.currentTick
 * @param {Object} params.extra - action-specific parameters (e.g. targetFactionId)
 * @returns {Promise<Object>} { success, error?, result?, newAp? }
 */
export async function dispatchAutocracyAction(supabase, params) {
    const { factionId, nationId, actionType, mode, currentTick, extra = {} } = params;

    // ── Validate action exists ──────────────────────────────────────────
    const actionDef = AUTOCRACY_ACTIONS[actionType];
    if (!actionDef) {
        return { success: false, error: `Unknown action: ${actionType}` };
    }

    // ── Load nation ─────────────────────────────────────────────────────
    const { data: nation } = await supabase
        .from('nations')
        .select('id, name, government_type')
        .eq('id', nationId)
        .single();

    if (!nation || !isAutocracy(nation)) {
        return { success: false, error: 'Not an autocracy nation' };
    }

    // ── Load faction pillar state ───────────────────────────────────────
    const { data: factionState } = await supabase
        .from('faction_pillar_state')
        .select('*')
        .eq('faction_id', factionId)
        .eq('nation_id', nationId)
        .single();

    if (!factionState) {
        return { success: false, error: 'No pillar state for this faction' };
    }

    // ── Validate pillar access ──────────────────────────────────────────
    if (actionDef.isStrongmanExclusive) {
        if (!factionState.is_strongman) {
            return { success: false, error: 'Only the Strongman can use this action' };
        }
    } else if (actionDef.pillar !== 'any') {
        // Non-strongman factions can only use their own pillar actions
        // Strongman can use their foundation pillar actions (governance only, no tracker)
        if (factionState.pillar !== actionDef.pillar && !factionState.is_strongman) {
            return { success: false, error: `This action requires the ${actionDef.pillar} pillar` };
        }
        if (factionState.is_strongman && factionState.pillar !== actionDef.pillar) {
            return { success: false, error: 'Strongman can only use their foundation pillar actions' };
        }
    }

    // ── Validate mode ───────────────────────────────────────────────────
    const effectiveMode = actionDef.hasDualMode === false ? 'self' : (mode || 'regime');
    if (actionDef.hasDualMode && !['regime', 'self'].includes(effectiveMode)) {
        return { success: false, error: 'Mode must be "regime" or "self"' };
    }

    // ── Check cooldown ──────────────────────────────────────────────────
    const { onCooldown, remainingTicks } = checkCooldown(factionState, actionDef, currentTick);
    if (onCooldown) {
        return { success: false, error: `Action on cooldown (${remainingTicks} ticks remaining)` };
    }

    // ── Check mutual exclusions ─────────────────────────────────────────
    if (actionDef.mutualExclusions && actionDef.mutualExclusions.length > 0) {
        const conflict = await checkMutualExclusion(supabase, factionId, nationId, currentTick, actionDef.mutualExclusions);
        if (conflict) {
            return { success: false, error: `Cannot use with ${conflict} in the same tick` };
        }
    }

    // ── Check arrested ──────────────────────────────────────────────────
    if (factionState.arrested_leader && !actionDef.isStrongmanExclusive) {
        return { success: false, error: 'Your leader is arrested and cannot act' };
    }

    // ── Compute AP cost ─────────────────────────────────────────────────
    const apCost = getEscalatingCost(factionState, actionDef);

    // ── Deduct AP ───────────────────────────────────────────────────────
    const apResult = await deductAP(supabase, factionId, apCost);
    if (!apResult.success) {
        return { success: false, error: apResult.error || 'Insufficient AP', currentAp: apResult.currentAp };
    }

    // ── Apply tracker contribution ──────────────────────────────────────
    let trackerDelta = null;
    // Load strongman's foundation pillar for the skip check
    const { data: strongmanState } = await supabase
        .from('faction_pillar_state')
        .select('pillar')
        .eq('nation_id', nationId)
        .eq('is_strongman', true)
        .single();

    const strongmanPillar = strongmanState?.pillar || null;

    // Load current tracker
    const { data: tracker } = await supabase
        .from('autocracy_tracker')
        .select('tracker_value')
        .eq('nation_id', nationId)
        .single();

    if (tracker) {
        const oldTracker = tracker.tracker_value;
        const newTracker = applyTrackerContribution(
            oldTracker, factionState, actionType, effectiveMode, strongmanPillar
        );
        trackerDelta = newTracker - oldTracker;

        if (trackerDelta !== 0) {
            await supabase
                .from('autocracy_tracker')
                .update({ tracker_value: newTracker, last_updated_tick: currentTick })
                .eq('nation_id', nationId);

            // 1d3 roll: on a 3, sync public_tracker_value so players see updated estimate
            const pubRoll = Math.floor(Math.random() * 3) + 1;
            if (pubRoll === 3) {
                await supabase.from('autocracy_tracker').update({
                    public_tracker_value: newTracker,
                    public_tracker_last_tick: currentTick,
                }).eq('nation_id', nationId);
            }
        }
    }

    // ── Update escalation level ─────────────────────────────────────────
    const nextLevel = getNextEscalationLevel(factionState, actionDef);
    const escalationUpdate = {};
    if (nextLevel !== null && actionDef.escalatingCostField) {
        escalationUpdate[actionDef.escalatingCostField] = nextLevel;
    }

    // ── Update cooldown ─────────────────────────────────────────────────
    if (actionDef.cooldownField) {
        escalationUpdate[actionDef.cooldownField] = currentTick;
    }

    if (Object.keys(escalationUpdate).length > 0) {
        escalationUpdate.updated_at = new Date().toISOString();
        await supabase
            .from('faction_pillar_state')
            .update(escalationUpdate)
            .eq('id', factionState.id);
    }

    // ── Log the action ──────────────────────────────────────────────────
    const logDetails = { ...extra, tracker_delta: trackerDelta };

    // For leader-targeting actions, capture the target leader & faction name
    const LEADER_TARGET_ACTIONS = ['arrest_leader', 'execute_leader', 'release_leader'];
    if (LEADER_TARGET_ACTIONS.includes(actionType) && extra?.targetFactionId) {
        const { data: targetParty } = await supabase.from('factions')
            .select('faction_name, leader_first_name, leader_last_name')
            .eq('id', extra.targetFactionId).single();
        if (targetParty) {
            logDetails.target_leader_name = (targetParty.leader_first_name && targetParty.leader_last_name)
                ? `${targetParty.leader_first_name} ${targetParty.leader_last_name}`
                : null;
            logDetails.target_faction_name = targetParty.faction_name;
        }
    }

    await supabase.from('autocracy_action_log').insert({
        nation_id: nationId,
        faction_id: factionId,
        tick: currentTick,
        action_type: actionType,
        action_mode: actionDef.hasDualMode === false ? null : effectiveMode,
        ap_spent: apCost,
        details: logDetails,
    });

    // ── Execute action-specific logic ───────────────────────────────────
    let actionResult = null;
    if (actionDef.execute) {
        actionResult = await actionDef.execute(supabase, {
            nation,
            factionState,
            actionType,
            mode: effectiveMode,
            currentTick,
            extra,
            apCost,
            trackerDelta,
            strongmanPillar,
        });
        // If execute returned an error, propagate it (AP was already spent)
        if (actionResult?.error) {
            return { error: actionResult.error, apSpent: apCost, newAp: apResult.newAp };
        }
    }

    return {
        success: true,
        newAp: apResult.newAp,
        trackerDelta,
        apCost,
        result: actionResult,
    };
}

// ─── Leader death reset ──────────────────────────────────────────────────────

/**
 * Reset all escalating costs and cooldowns when a faction leader dies.
 * Called from succession / aging / execution / coup logic.
 *
 * @param {Object} supabase
 * @param {string} factionId
 * @returns {Promise<boolean>} true if updated
 */
export async function resetLeaderEscalations(supabase, factionId) {
    const { error } = await supabase
        .from('faction_pillar_state')
        .update({
            deploy_ap_level: 2,
            bribe_ap_level: 2,
            blackmail_ap_level: 1,
            party_congress_last_tick: 0,
            favor_last_tick: 0,
            blackout_last_tick: 0,
            longevity_ticks: 0,
            surveillance_targets: '[]',
            updated_at: new Date().toISOString(),
        })
        .eq('faction_id', factionId);

    if (error) {
        console.error(`[resetLeaderEscalations] Failed for faction ${factionId}:`, error.message);
        return false;
    }
    console.log(`[resetLeaderEscalations] Reset escalations for faction ${factionId}`);
    return true;
}

// ─── Available actions query ─────────────────────────────────────────────────

/**
 * Get the list of actions available to a faction, with current costs and cooldowns.
 * Used by the UI to render the action panel.
 *
 * @param {Object} factionState - faction_pillar_state row
 * @param {number} currentTick
 * @returns {Object[]} array of { actionType, pillar, apCost, onCooldown, remainingTicks, hasDualMode }
 */
export function getAvailableActions(factionState, currentTick) {
    const actions = [];

    for (const [actionType, def] of Object.entries(AUTOCRACY_ACTIONS)) {
        // Skip strongman-exclusive actions for non-strongman
        if (def.isStrongmanExclusive && !factionState.is_strongman) continue;

        // Strongman can only use their foundation pillar + exclusive actions
        if (factionState.is_strongman) {
            if (!def.isStrongmanExclusive && def.pillar !== factionState.pillar && def.pillar !== 'any') continue;
        } else {
            // Non-strongman: only their claimed pillar actions
            if (def.pillar !== factionState.pillar && def.pillar !== 'any') continue;
        }

        const apCost = getEscalatingCost(factionState, def);
        const { onCooldown, remainingTicks } = checkCooldown(factionState, def, currentTick);

        actions.push({
            actionType,
            pillar: def.pillar,
            apCost,
            onCooldown,
            remainingTicks,
            hasDualMode: def.hasDualMode !== false,
            isStrongmanExclusive: !!def.isStrongmanExclusive,
        });
    }

    return actions;
}
