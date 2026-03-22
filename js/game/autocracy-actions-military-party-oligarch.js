/**
 * autocracy-actions-military-party-oligarch.js — Phase 5 action implementations.
 * Military (Deploy, Stand Down, Military Exercises),
 * Party (Rally, Agitate, Party Congress),
 * Oligarch (Patronage, Capital Flight, Bribe).
 *
 * V5 Autocracy System — Phase 5
 */

import { registerAutocracyAction } from './autocracy-actions.js';
import { applyBackingDelta } from './autocracy-pillars.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Load all faction_pillar_state rows + wildcard state for a nation.
 * Returns { pillarStates, wildcardState, tracker } or null.
 */
export async function loadPillarContext(supabase, nationId) {
    const [{ data: fpsRows }, { data: tracker }] = await Promise.all([
        supabase.from('faction_pillar_state').select('*').eq('nation_id', nationId),
        supabase.from('autocracy_tracker').select('*').eq('nation_id', nationId).single(),
    ]);
    if (!fpsRows || !tracker) return null;

    const pillarStates = fpsRows.map(r => ({
        id: r.id, faction_id: r.faction_id, pillar: r.pillar,
        backing: Number(r.backing), is_strongman: r.is_strongman,
    }));
    const wildcardState = {
        pillar: tracker.wildcard_pillar,
        backing: Number(tracker.wildcard_backing),
    };
    return { pillarStates, wildcardState, tracker, fpsRows };
}

/**
 * Persist backing changes for all pillar states + wildcard.
 */
export async function persistBackingChanges(supabase, nationId, pillarStates, wildcardState) {
    for (const ps of pillarStates) {
        await supabase.from('faction_pillar_state')
            .update({ backing: ps.backing, updated_at: new Date().toISOString() })
            .eq('id', ps.id);
    }
    await supabase.from('autocracy_tracker')
        .update({ wildcard_backing: wildcardState.backing })
        .eq('nation_id', nationId);
}

/**
 * Clamp a stat value between 0 and 100 with one decimal precision.
 */
export function clampStat(val) {
    return Math.max(0, Math.min(100, Math.round(val * 10) / 10));
}

/**
 * Roll a dice: random integer from min to max inclusive.
 */
export function roll(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
}

// ═════════════════════════════════════════════════════════════════════════════
// MILITARY ACTIONS
// ═════════════════════════════════════════════════════════════════════════════

// ── Deploy ───────────────────────────────────────────────────────────────────
// 2/4/6 AP (escalating). Reduces Civil Unrest and Political Violence. -1 Legitimacy.
// Cannot use if Military Exercises used this tick.
// Escalation resets -1 AP per tick unused (floor 2) — handled in tick processor.

registerAutocracyAction('deploy', {
    pillar: 'military',
    baseCost: 2,
    escalatingCostField: 'deploy_ap_level',
    escalationSteps: [2, 4, 6],
    cooldownField: null,
    cooldownTicks: null,
    hasDualMode: true,
    halfPowerForRegime: false,
    isStrongmanExclusive: false,
    mutualExclusions: ['military_exercises'],
    async execute(supabase, ctx) {
        const { nation, currentTick } = ctx;

        // Fetch current stats
        const { data: n } = await supabase.from('nations')
            .select('civil_unrest, political_violence, legitimacy')
            .eq('id', nation.id).single();
        if (!n) return { error: 'Failed to load nation stats' };

        const newUnrest = clampStat(Number(n.civil_unrest || 0) - roll(3, 6));
        const newViolence = clampStat(Number(n.political_violence || 0) - roll(2, 4));
        const newLegitimacy = clampStat(Number(n.legitimacy || 50) - 1);

        await supabase.from('nations').update({
            civil_unrest: newUnrest,
            political_violence: newViolence,
            legitimacy: newLegitimacy,
        }).eq('id', nation.id);

        return {
            effects: { civil_unrest: newUnrest, political_violence: newViolence, legitimacy: newLegitimacy },
        };
    },
});

// ── Stand Down ───────────────────────────────────────────────────────────────
// 1 AP. Civil Unrest and Political Violence drift upward.
// NO dual mode — always For Yourself (+coup tracker).
// Cannot use if Deployed this tick.

registerAutocracyAction('stand_down', {
    pillar: 'military',
    baseCost: 1,
    escalatingCostField: null,
    escalationSteps: null,
    cooldownField: null,
    cooldownTicks: null,
    hasDualMode: false,  // always FOR_YOURSELF
    halfPowerForRegime: false,
    isStrongmanExclusive: false,
    mutualExclusions: ['deploy'],
    async execute(supabase, ctx) {
        const { nation } = ctx;

        const { data: n } = await supabase.from('nations')
            .select('civil_unrest, political_violence')
            .eq('id', nation.id).single();
        if (!n) return { error: 'Failed to load nation stats' };

        // Passive upward drift
        const newUnrest = clampStat(Number(n.civil_unrest || 0) + roll(1, 3));
        const newViolence = clampStat(Number(n.political_violence || 0) + roll(1, 2));

        await supabase.from('nations').update({
            civil_unrest: newUnrest,
            political_violence: newViolence,
        }).eq('id', nation.id);

        return {
            effects: { civil_unrest: newUnrest, political_violence: newViolence },
        };
    },
});

// ── Military Exercises ───────────────────────────────────────────────────────
// 2 AP. +1d3 Backing. Cannot use if Deployed this tick.

registerAutocracyAction('military_exercises', {
    pillar: 'military',
    baseCost: 2,
    escalatingCostField: null,
    escalationSteps: null,
    cooldownField: null,
    cooldownTicks: null,
    hasDualMode: true,
    halfPowerForRegime: false,
    isStrongmanExclusive: false,
    mutualExclusions: ['deploy'],
    async execute(supabase, ctx) {
        const { factionState, nation } = ctx;

        const backingGain = roll(1, 3);
        const pCtx = await loadPillarContext(supabase, nation.id);
        if (!pCtx) return { error: 'No pillar context' };

        applyBackingDelta(pCtx.pillarStates, pCtx.wildcardState, factionState.pillar, backingGain, false);
        await persistBackingChanges(supabase, nation.id, pCtx.pillarStates, pCtx.wildcardState);

        return { effects: { backing_gain: backingGain } };
    },
});

// ═════════════════════════════════════════════════════════════════════════════
// PARTY ACTIONS
// ═════════════════════════════════════════════════════════════════════════════

// ── Rally ────────────────────────────────────────────────────────────────────
// 2 AP. +0.3 Legitimacy for 5 ticks. -1 Polarization. +1 Backing.

registerAutocracyAction('rally', {
    pillar: 'party',
    baseCost: 2,
    escalatingCostField: null,
    escalationSteps: null,
    cooldownField: null,
    cooldownTicks: null,
    hasDualMode: true,
    halfPowerForRegime: false,
    isStrongmanExclusive: false,
    mutualExclusions: [],
    async execute(supabase, ctx) {
        const { factionState, nation, currentTick } = ctx;

        const { data: n } = await supabase.from('nations')
            .select('polarization, legitimacy')
            .eq('id', nation.id).single();
        if (!n) return { error: 'Failed to load nation stats' };

        const newPolarization = clampStat(Number(n.polarization || 0) - 1);

        // Legitimacy buff: +0.3 for 5 ticks stored as a timed effect
        // For simplicity, apply +0.3 immediately; ongoing effect tracked via action log
        const newLegitimacy = clampStat(Number(n.legitimacy || 50) + 0.3);

        await supabase.from('nations').update({
            polarization: newPolarization,
            legitimacy: newLegitimacy,
        }).eq('id', nation.id);

        // +1 Backing
        const pCtx = await loadPillarContext(supabase, nation.id);
        if (pCtx) {
            applyBackingDelta(pCtx.pillarStates, pCtx.wildcardState, factionState.pillar, 1, false);
            await persistBackingChanges(supabase, nation.id, pCtx.pillarStates, pCtx.wildcardState);
        }

        // Store timed legitimacy buff (remaining ticks tracked for tick processor)
        await supabase.from('autocracy_action_log').insert({
            nation_id: nation.id,
            faction_id: factionState.faction_id,
            tick: currentTick,
            action_type: 'rally_buff',
            action_mode: null,
            ap_spent: 0,
            details: { stat: 'legitimacy', delta: 0.3, remaining_ticks: 4 },  // 4 more after this tick
        });

        return { effects: { polarization: newPolarization, legitimacy: newLegitimacy, backing_gain: 1 } };
    },
});

// ── Agitate ──────────────────────────────────────────────────────────────────
// 2 AP. -0.3 Legitimacy for 5 ticks. +1 Polarization.
// FOR_REGIME: half power tracker contribution.

registerAutocracyAction('agitate', {
    pillar: 'party',
    baseCost: 2,
    escalatingCostField: null,
    escalationSteps: null,
    cooldownField: null,
    cooldownTicks: null,
    hasDualMode: true,
    halfPowerForRegime: true,
    isStrongmanExclusive: false,
    mutualExclusions: [],
    async execute(supabase, ctx) {
        const { factionState, nation, currentTick } = ctx;

        const { data: n } = await supabase.from('nations')
            .select('polarization, legitimacy')
            .eq('id', nation.id).single();
        if (!n) return { error: 'Failed to load nation stats' };

        const newPolarization = clampStat(Number(n.polarization || 0) + 1);
        const newLegitimacy = clampStat(Number(n.legitimacy || 50) - 0.3);

        await supabase.from('nations').update({
            polarization: newPolarization,
            legitimacy: newLegitimacy,
        }).eq('id', nation.id);

        // Store timed legitimacy debuff
        await supabase.from('autocracy_action_log').insert({
            nation_id: nation.id,
            faction_id: factionState.faction_id,
            tick: currentTick,
            action_type: 'agitate_debuff',
            action_mode: null,
            ap_spent: 0,
            details: { stat: 'legitimacy', delta: -0.3, remaining_ticks: 4 },
        });

        return { effects: { polarization: newPolarization, legitimacy: newLegitimacy } };
    },
});

// ── Party Congress ───────────────────────────────────────────────────────────
// 2 AP. Forces Strongman to attend (+1 Legitimacy, costs Strongman 1 AP)
// or refuse (-1 Legitimacy, +2 Polarization automatically).
// 4-tick cooldown. Resets on leader death.

registerAutocracyAction('party_congress', {
    pillar: 'party',
    baseCost: 2,
    escalatingCostField: null,
    escalationSteps: null,
    cooldownField: 'party_congress_last_tick',
    cooldownTicks: 4,
    hasDualMode: true,
    halfPowerForRegime: false,
    isStrongmanExclusive: false,
    mutualExclusions: [],
    async execute(supabase, ctx) {
        const { nation, factionState, currentTick } = ctx;

        // Create a pending congress event for the Strongman to respond to.
        // The Strongman will have until end of tick to attend (1 AP) or refuse.
        // If no response by next tick, auto-refuse.
        await supabase.from('autocracy_action_log').insert({
            nation_id: nation.id,
            faction_id: factionState.faction_id,
            tick: currentTick,
            action_type: 'party_congress_pending',
            action_mode: null,
            ap_spent: 0,
            details: { status: 'pending', called_by: factionState.faction_id },
        });

        return { effects: { congress_called: true } };
    },
});

// ═════════════════════════════════════════════════════════════════════════════
// OLIGARCH ACTIONS
// ═════════════════════════════════════════════════════════════════════════════

// ── Patronage ────────────────────────────────────────────────────────────────
// 2 AP. -0.3 Cost of Living for 5 ticks. +0.1 Standard of Living for 5 ticks.
// No GDP effect.

registerAutocracyAction('patronage', {
    pillar: 'oligarchs',
    baseCost: 2,
    escalatingCostField: null,
    escalationSteps: null,
    cooldownField: null,
    cooldownTicks: null,
    hasDualMode: true,
    halfPowerForRegime: false,
    isStrongmanExclusive: false,
    mutualExclusions: [],
    async execute(supabase, ctx) {
        const { nation, factionState, currentTick } = ctx;

        const { data: n } = await supabase.from('nations')
            .select('cost_of_living, standard_of_living')
            .eq('id', nation.id).single();
        if (!n) return { error: 'Failed to load nation stats' };

        const newCoL = clampStat(Number(n.cost_of_living || 50) - 0.3);
        const newSoL = clampStat(Number(n.standard_of_living || 50) + 0.1);

        await supabase.from('nations').update({
            cost_of_living: newCoL,
            standard_of_living: newSoL,
        }).eq('id', nation.id);

        // Store timed effects (4 more ticks)
        await supabase.from('autocracy_action_log').insert({
            nation_id: nation.id,
            faction_id: factionState.faction_id,
            tick: currentTick,
            action_type: 'patronage_buff',
            action_mode: null,
            ap_spent: 0,
            details: {
                effects: [
                    { stat: 'cost_of_living', delta: -0.3, remaining_ticks: 4 },
                    { stat: 'standard_of_living', delta: 0.1, remaining_ticks: 4 },
                ],
            },
        });

        return { effects: { cost_of_living: newCoL, standard_of_living: newSoL } };
    },
});

// ── Capital Flight ───────────────────────────────────────────────────────────
// 2 AP. GDP Growth drops. Corruption increases.
// FOR_REGIME: half power tracker contribution.

registerAutocracyAction('capital_flight', {
    pillar: 'oligarchs',
    baseCost: 2,
    escalatingCostField: null,
    escalationSteps: null,
    cooldownField: null,
    cooldownTicks: null,
    hasDualMode: true,
    halfPowerForRegime: true,
    isStrongmanExclusive: false,
    mutualExclusions: [],
    async execute(supabase, ctx) {
        const { nation } = ctx;

        const { data: n } = await supabase.from('nations')
            .select('gdp_growth, corruption')
            .eq('id', nation.id).single();
        if (!n) return { error: 'Failed to load nation stats' };

        const newGdp = clampStat(Number(n.gdp_growth || 50) - roll(2, 5));
        const newCorruption = clampStat(Number(n.corruption || 50) + roll(1, 3));

        await supabase.from('nations').update({
            gdp_growth: newGdp,
            corruption: newCorruption,
        }).eq('id', nation.id);

        return { effects: { gdp_growth: newGdp, corruption: newCorruption } };
    },
});

// ── Bribe ────────────────────────────────────────────────────────────────────
// 2/3/4/5 AP (escalating). +2 Backing to target faction.
// Visible only to recipient. Cannot target self or Strongman.

registerAutocracyAction('bribe', {
    pillar: 'oligarchs',
    baseCost: 2,
    escalatingCostField: 'bribe_ap_level',
    escalationSteps: [2, 3, 4, 5],
    cooldownField: null,
    cooldownTicks: null,
    hasDualMode: true,
    halfPowerForRegime: false,
    isStrongmanExclusive: false,
    mutualExclusions: [],
    async execute(supabase, ctx) {
        const { nation, factionState, extra } = ctx;
        const targetFactionId = extra?.targetFactionId;

        if (!targetFactionId) {
            return { error: 'Must specify targetFactionId' };
        }
        if (targetFactionId === factionState.faction_id) {
            return { error: 'Cannot bribe yourself' };
        }

        // Check target is not Strongman
        const { data: targetState } = await supabase.from('faction_pillar_state')
            .select('pillar, is_strongman')
            .eq('faction_id', targetFactionId)
            .eq('nation_id', nation.id)
            .single();

        if (!targetState) return { error: 'Target faction not found' };
        if (targetState.is_strongman) return { error: 'Cannot bribe the Strongman' };

        // +2 Backing to target
        const pCtx = await loadPillarContext(supabase, nation.id);
        if (!pCtx) return { error: 'No pillar context' };

        applyBackingDelta(pCtx.pillarStates, pCtx.wildcardState, targetState.pillar, 2, false);
        await persistBackingChanges(supabase, nation.id, pCtx.pillarStates, pCtx.wildcardState);

        return { effects: { target_backing_gain: 2, target_faction_id: targetFactionId } };
    },
});

// ═════════════════════════════════════════════════════════════════════════════
// TIMED EFFECTS PROCESSOR
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Process timed effects from Rally, Agitate, Patronage buffs/debuffs.
 * Called each tick to apply ongoing stat changes and decrement remaining ticks.
 *
 * @param {Object} supabase
 * @param {Object} nation
 * @param {number} currentTick
 * @returns {Object[]} applied effects
 */
export async function processAutocracyTimedEffects(supabase, nation, currentTick) {
    const timedActionTypes = ['rally_buff', 'agitate_debuff', 'patronage_buff'];

    const { data: buffRows } = await supabase
        .from('autocracy_action_log')
        .select('id, action_type, details')
        .eq('nation_id', nation.id)
        .in('action_type', timedActionTypes);

    if (!buffRows || buffRows.length === 0) return [];

    const applied = [];
    const toDelete = [];
    const nationUpdates = {};

    // Load current nation stats
    const { data: n } = await supabase.from('nations')
        .select('legitimacy, cost_of_living, standard_of_living')
        .eq('id', nation.id).single();
    if (!n) return [];

    for (const row of buffRows) {
        const details = row.details || {};
        const remaining = details.remaining_ticks;

        if (remaining == null || remaining <= 0) {
            toDelete.push(row.id);
            continue;
        }

        // Apply the stat effect(s)
        if (row.action_type === 'rally_buff' || row.action_type === 'agitate_debuff') {
            const stat = details.stat;
            const delta = details.delta;
            if (stat && delta != null) {
                const current = Number(nationUpdates[stat] ?? n[stat] ?? 50);
                nationUpdates[stat] = clampStat(current + delta);
                applied.push({ type: row.action_type, stat, delta });
            }
        } else if (row.action_type === 'patronage_buff' && Array.isArray(details.effects)) {
            for (const eff of details.effects) {
                const current = Number(nationUpdates[eff.stat] ?? n[eff.stat] ?? 50);
                nationUpdates[eff.stat] = clampStat(current + eff.delta);
                applied.push({ type: row.action_type, stat: eff.stat, delta: eff.delta });
            }
        }

        // Decrement remaining ticks
        const newRemaining = remaining - 1;
        if (newRemaining <= 0) {
            toDelete.push(row.id);
        } else {
            const updatedDetails = { ...details, remaining_ticks: newRemaining };
            if (row.action_type === 'patronage_buff' && Array.isArray(details.effects)) {
                updatedDetails.effects = details.effects.map(e => ({ ...e, remaining_ticks: newRemaining }));
            }
            await supabase.from('autocracy_action_log')
                .update({ details: updatedDetails })
                .eq('id', row.id);
        }
    }

    // Apply accumulated stat changes
    if (Object.keys(nationUpdates).length > 0) {
        await supabase.from('nations').update(nationUpdates).eq('id', nation.id);
    }

    // Clean up expired buffs
    for (const id of toDelete) {
        await supabase.from('autocracy_action_log').delete().eq('id', id);
    }

    return applied;
}

// ═════════════════════════════════════════════════════════════════════════════
// DEPLOY ESCALATION DECAY
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Deploy AP cost resets -1 per tick unused (floor 2).
 * Called each tick for military pillar factions.
 *
 * @param {Object} supabase
 * @param {string} nationId
 * @param {number} currentTick
 */
export async function processDeployEscalationDecay(supabase, nationId, currentTick) {
    // Find military pillar factions
    const { data: militaryFactions } = await supabase
        .from('faction_pillar_state')
        .select('id, faction_id, deploy_ap_level')
        .eq('nation_id', nationId)
        .eq('pillar', 'military');

    if (!militaryFactions) return;

    for (const fps of militaryFactions) {
        const currentLevel = fps.deploy_ap_level || 2;
        if (currentLevel <= 2) continue; // already at minimum

        // Check if deploy was used this tick
        const { data: usedThisTick } = await supabase
            .from('autocracy_action_log')
            .select('id')
            .eq('faction_id', fps.faction_id)
            .eq('nation_id', nationId)
            .eq('tick', currentTick)
            .eq('action_type', 'deploy')
            .limit(1);

        if (usedThisTick && usedThisTick.length > 0) continue; // used this tick, no decay

        // Decay by the escalation step size (2→4→6 means step = 2)
        const newLevel = Math.max(2, currentLevel - 2);
        if (newLevel !== currentLevel) {
            await supabase.from('faction_pillar_state')
                .update({ deploy_ap_level: newLevel, updated_at: new Date().toISOString() })
                .eq('id', fps.id);
        }
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// PARTY CONGRESS RESOLUTION
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Auto-resolve any pending Party Congress that the Strongman hasn't responded to.
 * If Strongman didn't attend, auto-refuse: -1 Legitimacy, +2 Polarization.
 *
 * @param {Object} supabase
 * @param {string} nationId
 * @param {number} currentTick
 */
export async function resolvePartyCongressPending(supabase, nationId, currentTick) {
    // Find pending congress from previous tick
    const { data: pendingRows } = await supabase
        .from('autocracy_action_log')
        .select('id, tick, details')
        .eq('nation_id', nationId)
        .eq('action_type', 'party_congress_pending')
        .lt('tick', currentTick);

    if (!pendingRows || pendingRows.length === 0) return;

    for (const row of pendingRows) {
        const details = row.details || {};
        if (details.status !== 'pending') continue;

        // Auto-refuse: -1 Legitimacy, +2 Polarization
        const { data: n } = await supabase.from('nations')
            .select('legitimacy, polarization')
            .eq('id', nationId).single();

        if (n) {
            await supabase.from('nations').update({
                legitimacy: clampStat(Number(n.legitimacy || 50) - 1),
                polarization: clampStat(Number(n.polarization || 0) + 2),
            }).eq('id', nationId);
        }

        // Mark as resolved (refused)
        await supabase.from('autocracy_action_log')
            .update({ details: { ...details, status: 'refused' } })
            .eq('id', row.id);
    }
}

// #region server-exclude
/**
 * Strongman attends Party Congress (player action).
 * +1 Legitimacy, costs 1 AP.
 *
 * @param {Object} supabase
 * @param {string} strongmanFactionId
 * @param {string} nationId
 * @param {number} currentTick
 */
export async function attendPartyCongress(supabase, strongmanFactionId, nationId, currentTick) {
    // Find pending congress for this tick
    const { data: pendingRows } = await supabase
        .from('autocracy_action_log')
        .select('id, details')
        .eq('nation_id', nationId)
        .eq('action_type', 'party_congress_pending')
        .eq('tick', currentTick);

    if (!pendingRows || pendingRows.length === 0) {
        return { success: false, error: 'No pending Party Congress to attend' };
    }

    // Deduct 1 AP from Strongman
    const { data: faction } = await supabase.from('factions')
        .select('action_points')
        .eq('id', strongmanFactionId).single();

    if (!faction || faction.action_points < 1) {
        return { success: false, error: 'Insufficient AP to attend' };
    }

    await supabase.from('factions')
        .update({ action_points: faction.action_points - 1 })
        .eq('id', strongmanFactionId);

    // +1 Legitimacy
    const { data: n } = await supabase.from('nations')
        .select('legitimacy')
        .eq('id', nationId).single();

    if (n) {
        await supabase.from('nations').update({
            legitimacy: clampStat(Number(n.legitimacy || 50) + 1),
        }).eq('id', nationId);
    }

    // Mark as attended
    const row = pendingRows[0];
    await supabase.from('autocracy_action_log')
        .update({ details: { ...row.details, status: 'attended' } })
        .eq('id', row.id);

    return { success: true, effects: { legitimacy_gain: 1, ap_cost: 1 } };
}
// #endregion server-exclude
