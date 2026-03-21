/**
 * autocracy-actions-security-media-strongman.js — Phase 6 action implementations.
 * Security Services (Surveillance, Blackmail, Disappear),
 * State Media (Broadcast, Smear, Blackout),
 * Strongman Exclusives (Arrest Leader, Execute Leader, Release Leader, Favor).
 *
 * V5 Autocracy System — Phase 6
 *
 * Helpers loadPillarContext, persistBackingChanges, clampStat, roll
 * are imported from autocracy-actions-military-party-oligarch.js.
 */

import { registerAutocracyAction, resetLeaderEscalations } from './autocracy-actions.js';
import { applyBackingDelta } from './autocracy-pillars.js';
import { roll, loadPillarContext, persistBackingChanges, clampStat } from './autocracy-actions-military-party-oligarch.js';

// ═════════════════════════════════════════════════════════════════════════════
// SECURITY SERVICES ACTIONS
// ═════════════════════════════════════════════════════════════════════════════

// ── Surveillance ─────────────────────────────────────────────────────────────
// 2 AP. Reveals target's Backing, AP, and last action.
// Tracks surveilled targets in JSON array. Required for Silent Coup.

registerAutocracyAction('surveillance', {
    pillar: 'security',
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
        const { nation, factionState, extra } = ctx;
        const targetFactionId = extra?.targetFactionId;
        if (!targetFactionId) return { error: 'Must specify targetFactionId' };
        if (targetFactionId === factionState.faction_id) return { error: 'Cannot surveil yourself' };

        // Load target info
        const { data: targetFps } = await supabase.from('faction_pillar_state')
            .select('pillar, backing')
            .eq('faction_id', targetFactionId).eq('nation_id', nation.id).single();
        const { data: targetFaction } = await supabase.from('factions')
            .select('action_points')
            .eq('id', targetFactionId).single();

        if (!targetFps || !targetFaction) return { error: 'Target faction not found' };

        // Get target's last action
        const { data: lastAction } = await supabase.from('autocracy_action_log')
            .select('action_type, tick')
            .eq('faction_id', targetFactionId).eq('nation_id', nation.id)
            .order('tick', { ascending: false }).limit(1);

        // Update surveillance_targets: add target if not already tracked, count occurrences
        const currentTargets = Array.isArray(factionState.surveillance_targets)
            ? factionState.surveillance_targets
            : JSON.parse(factionState.surveillance_targets || '[]');
        const updatedTargets = [...currentTargets, targetFactionId];

        await supabase.from('faction_pillar_state')
            .update({ surveillance_targets: JSON.stringify(updatedTargets), updated_at: new Date().toISOString() })
            .eq('id', factionState.id);

        return {
            effects: {
                revealed: {
                    target_faction_id: targetFactionId,
                    backing: Number(targetFps.backing),
                    ap: targetFaction.action_points,
                    last_action: lastAction?.[0]?.action_type || null,
                },
            },
        };
    },
});

// ── Blackmail ────────────────────────────────────────────────────────────────
// 1/2/3 AP (escalating). Target loses 1d3 Backing OR 2 AP (their choice).
// Requires Surveillance on target at least twice. Respects Blackmail Immunity.

registerAutocracyAction('blackmail', {
    pillar: 'security',
    baseCost: 1,
    escalatingCostField: 'blackmail_ap_level',
    escalationSteps: [1, 2, 3],
    cooldownField: null,
    cooldownTicks: null,
    hasDualMode: true,
    halfPowerForRegime: false,
    isStrongmanExclusive: false,
    mutualExclusions: [],
    async execute(supabase, ctx) {
        const { nation, factionState, extra, currentTick } = ctx;
        const targetFactionId = extra?.targetFactionId;
        if (!targetFactionId) return { error: 'Must specify targetFactionId' };

        // Check surveillance count on target (need >= 2)
        const targets = Array.isArray(factionState.surveillance_targets)
            ? factionState.surveillance_targets
            : JSON.parse(factionState.surveillance_targets || '[]');
        const survCount = targets.filter(t => t === targetFactionId).length;
        if (survCount < 2) {
            return { error: 'Requires Surveillance on target at least twice' };
        }

        // Check blackmail immunity
        const { data: targetFps } = await supabase.from('faction_pillar_state')
            .select('blackmail_immune_until, pillar, backing')
            .eq('faction_id', targetFactionId).eq('nation_id', nation.id).single();
        if (!targetFps) return { error: 'Target not found' };
        if (targetFps.blackmail_immune_until && currentTick < targetFps.blackmail_immune_until) {
            return { error: 'Target has Blackmail Immunity' };
        }

        // Target choice: lose 1d3 Backing OR 2 AP
        // For now, server auto-resolves: if target has >= 2 AP, lose AP; else lose Backing
        const { data: targetFaction } = await supabase.from('factions')
            .select('action_points')
            .eq('id', targetFactionId).single();

        let outcome;
        if (targetFaction && targetFaction.action_points >= 2) {
            // Lose 2 AP
            await supabase.from('factions')
                .update({ action_points: targetFaction.action_points - 2 })
                .eq('id', targetFactionId);
            outcome = { type: 'ap_loss', amount: 2 };
        } else {
            // Lose 1d3 Backing
            const backingLoss = roll(1, 3);
            const pCtx = await loadPillarContext(supabase, nation.id);
            if (pCtx) {
                applyBackingDelta(pCtx.pillarStates, pCtx.wildcardState, targetFps.pillar, -backingLoss, false);
                await persistBackingChanges(supabase, nation.id, pCtx.pillarStates, pCtx.wildcardState);
            }
            outcome = { type: 'backing_loss', amount: backingLoss };
        }

        return { effects: { target_faction_id: targetFactionId, outcome } };
    },
});

// ── Disappear ────────────────────────────────────────────────────────────────
// 3 AP. Target -1 Backing. Untraceable.
// Against Strongman: -2 Backing to foundation, -1 Legitimacy.

registerAutocracyAction('disappear', {
    pillar: 'security',
    baseCost: 3,
    escalatingCostField: null,
    escalationSteps: null,
    cooldownField: null,
    cooldownTicks: null,
    hasDualMode: true,
    halfPowerForRegime: false,
    isStrongmanExclusive: false,
    mutualExclusions: [],
    async execute(supabase, ctx) {
        const { nation, factionState, extra } = ctx;
        const targetFactionId = extra?.targetFactionId;
        if (!targetFactionId) return { error: 'Must specify targetFactionId' };
        if (targetFactionId === factionState.faction_id) return { error: 'Cannot disappear yourself' };

        const { data: targetFps } = await supabase.from('faction_pillar_state')
            .select('pillar, is_strongman')
            .eq('faction_id', targetFactionId).eq('nation_id', nation.id).single();
        if (!targetFps) return { error: 'Target not found' };

        const pCtx = await loadPillarContext(supabase, nation.id);
        if (!pCtx) return { error: 'No pillar context' };

        if (targetFps.is_strongman) {
            // Against Strongman: -2 Backing to foundation, -1 Legitimacy
            applyBackingDelta(pCtx.pillarStates, pCtx.wildcardState, targetFps.pillar, -2, false);
            await persistBackingChanges(supabase, nation.id, pCtx.pillarStates, pCtx.wildcardState);

            const { data: n } = await supabase.from('nations')
                .select('legitimacy').eq('id', nation.id).single();
            if (n) {
                await supabase.from('nations').update({
                    legitimacy: clampStat(Number(n.legitimacy || 50) - 1),
                }).eq('id', nation.id);
            }
            return { effects: { target_strongman: true, backing_loss: 2, legitimacy_loss: 1 } };
        } else {
            // Normal: -1 Backing
            applyBackingDelta(pCtx.pillarStates, pCtx.wildcardState, targetFps.pillar, -1, false);
            await persistBackingChanges(supabase, nation.id, pCtx.pillarStates, pCtx.wildcardState);
            return { effects: { target_faction_id: targetFactionId, backing_loss: 1 } };
        }
    },
});

// ═════════════════════════════════════════════════════════════════════════════
// STATE MEDIA ACTIONS
// ═════════════════════════════════════════════════════════════════════════════

// ── Broadcast ────────────────────────────────────────────────────────────────
// 2 AP. +0.3 Legitimacy for 5 ticks. -1 Polarization. -0.1 Press Freedom. +1 Backing.

registerAutocracyAction('broadcast', {
    pillar: 'media',
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
            .select('polarization, press_freedom, legitimacy')
            .eq('id', nation.id).single();
        if (!n) return { error: 'Failed to load nation stats' };

        const newPolarization = clampStat(Number(n.polarization || 0) - 1);
        const newPressFreedom = clampStat(Number(n.press_freedom || 50) - 0.1);
        const newLegitimacy = clampStat(Number(n.legitimacy || 50) + 0.3);

        await supabase.from('nations').update({
            polarization: newPolarization,
            press_freedom: newPressFreedom,
            legitimacy: newLegitimacy,
        }).eq('id', nation.id);

        // +1 Backing
        const pCtx = await loadPillarContext(supabase, nation.id);
        if (pCtx) {
            applyBackingDelta(pCtx.pillarStates, pCtx.wildcardState, factionState.pillar, 1, false);
            await persistBackingChanges(supabase, nation.id, pCtx.pillarStates, pCtx.wildcardState);
        }

        // Timed legitimacy buff (4 more ticks)
        await supabase.from('autocracy_action_log').insert({
            nation_id: nation.id, faction_id: factionState.faction_id,
            tick: currentTick, action_type: 'rally_buff', action_mode: null, ap_spent: 0,
            details: { stat: 'legitimacy', delta: 0.3, remaining_ticks: 4 },
        });

        return { effects: { polarization: newPolarization, press_freedom: newPressFreedom, legitimacy: newLegitimacy, backing_gain: 1 } };
    },
});

// ── Smear ────────────────────────────────────────────────────────────────────
// 2 AP. Target -2 Backing. +1 Polarization. -0.1 Press Freedom. Can target Strongman.

registerAutocracyAction('smear', {
    pillar: 'media',
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
        const { nation, factionState, extra } = ctx;
        const targetFactionId = extra?.targetFactionId;
        if (!targetFactionId) return { error: 'Must specify targetFactionId' };
        if (targetFactionId === factionState.faction_id) return { error: 'Cannot smear yourself' };

        const { data: targetFps } = await supabase.from('faction_pillar_state')
            .select('pillar')
            .eq('faction_id', targetFactionId).eq('nation_id', nation.id).single();
        if (!targetFps) return { error: 'Target not found' };

        // -2 Backing to target
        const pCtx = await loadPillarContext(supabase, nation.id);
        if (pCtx) {
            applyBackingDelta(pCtx.pillarStates, pCtx.wildcardState, targetFps.pillar, -2, false);
            await persistBackingChanges(supabase, nation.id, pCtx.pillarStates, pCtx.wildcardState);
        }

        // +1 Polarization, -0.1 Press Freedom
        const { data: n } = await supabase.from('nations')
            .select('polarization, press_freedom')
            .eq('id', nation.id).single();
        if (n) {
            await supabase.from('nations').update({
                polarization: clampStat(Number(n.polarization || 0) + 1),
                press_freedom: clampStat(Number(n.press_freedom || 50) - 0.1),
            }).eq('id', nation.id);
        }

        return { effects: { target_backing_loss: 2, polarization: 1, press_freedom: -0.1 } };
    },
});

// ── Blackout ─────────────────────────────────────────────────────────────────
// 1 AP. Freezes Legitimacy and Polarization for one tick. 5-tick cooldown.

registerAutocracyAction('blackout', {
    pillar: 'media',
    baseCost: 1,
    escalatingCostField: null,
    escalationSteps: null,
    cooldownField: 'blackout_last_tick',
    cooldownTicks: 5,
    hasDualMode: true,
    halfPowerForRegime: false,
    isStrongmanExclusive: false,
    mutualExclusions: [],
    async execute(supabase, ctx) {
        const { nation, currentTick } = ctx;

        // Store a blackout marker — the tick processor will check for this
        // and skip legitimacy/polarization changes this tick.
        await supabase.from('autocracy_action_log').insert({
            nation_id: nation.id, faction_id: ctx.factionState.faction_id,
            tick: currentTick, action_type: 'blackout_active', action_mode: null, ap_spent: 0,
            details: { freeze_stats: ['legitimacy', 'polarization'] },
        });

        return { effects: { blackout: true, frozen: ['legitimacy', 'polarization'] } };
    },
});

// ═════════════════════════════════════════════════════════════════════════════
// STRONGMAN EXCLUSIVE ACTIONS
// ═════════════════════════════════════════════════════════════════════════════

// ── Arrest Leader ────────────────────────────────────────────────────────────
// 2 AP. Roll 1d20 + modifiers vs target Backing.
// Success: arrest, pillar → wildcard, tracker -5.
// Tie: flee, -3 Backing. Fail: Strongman foundation -2 Backing.
// All outcomes: -3 Legitimacy, +3 Polarization.

registerAutocracyAction('arrest_leader', {
    pillar: 'any',
    baseCost: 2,
    escalatingCostField: null,
    escalationSteps: null,
    cooldownField: null,
    cooldownTicks: null,
    hasDualMode: false,  // Strongman action — no dual mode, specific tracker effects
    halfPowerForRegime: false,
    isStrongmanExclusive: true,
    mutualExclusions: [],
    async execute(supabase, ctx) {
        const { nation, factionState, extra, currentTick } = ctx;
        const targetFactionId = extra?.targetFactionId;
        if (!targetFactionId) return { error: 'Must specify targetFactionId' };

        // Load target
        const { data: targetFps } = await supabase.from('faction_pillar_state')
            .select('*')
            .eq('faction_id', targetFactionId).eq('nation_id', nation.id).single();
        if (!targetFps) return { error: 'Target not found' };
        if (targetFps.is_strongman) return { error: 'Cannot arrest yourself' };
        if (targetFps.arrested_leader) return { error: 'Target already arrested' };

        // Roll 1d20 + modifiers
        let rollVal = roll(1, 20);
        // Modifiers
        if (factionState.pillar === 'security') rollVal += 10;
        if (factionState.pillar === 'military') rollVal += 5;
        if (Number(targetFps.backing) <= 5) rollVal += 5;
        // Arrest bonus from previous Release
        rollVal += (targetFps.arrest_bonus || 0);

        const targetBacking = Math.round(Number(targetFps.backing));
        let outcome;

        const pCtx = await loadPillarContext(supabase, nation.id);
        if (!pCtx) return { error: 'No pillar context' };

        if (rollVal > targetBacking) {
            // SUCCESS — arrest, pillar becomes wildcard
            outcome = 'success';
            await supabase.from('faction_pillar_state')
                .update({ arrested_leader: true, updated_at: new Date().toISOString() })
                .eq('id', targetFps.id);

            // Tracker -5
            const { data: tracker } = await supabase.from('autocracy_tracker')
                .select('tracker_value').eq('nation_id', nation.id).single();
            if (tracker) {
                await supabase.from('autocracy_tracker').update({
                    tracker_value: Math.max(0, tracker.tracker_value - 5),
                    last_updated_tick: currentTick,
                }).eq('nation_id', nation.id);
            }
        } else if (rollVal === targetBacking) {
            // TIE — leader flees, -3 Backing
            outcome = 'tie';
            applyBackingDelta(pCtx.pillarStates, pCtx.wildcardState, targetFps.pillar, -3, false);
            await persistBackingChanges(supabase, nation.id, pCtx.pillarStates, pCtx.wildcardState);
        } else {
            // FAIL — Strongman foundation -2 Backing
            outcome = 'fail';
            applyBackingDelta(pCtx.pillarStates, pCtx.wildcardState, factionState.pillar, -2, false);
            await persistBackingChanges(supabase, nation.id, pCtx.pillarStates, pCtx.wildcardState);
        }

        // All outcomes: -3 Legitimacy, +3 Polarization
        const { data: n } = await supabase.from('nations')
            .select('legitimacy, polarization').eq('id', nation.id).single();
        if (n) {
            await supabase.from('nations').update({
                legitimacy: clampStat(Number(n.legitimacy || 50) - 3),
                polarization: clampStat(Number(n.polarization || 0) + 3),
            }).eq('id', nation.id);
        }

        return {
            effects: {
                outcome,
                roll: rollVal,
                target_backing: targetBacking,
                target_faction_id: targetFactionId,
            },
        };
    },
});

// ── Execute Leader ───────────────────────────────────────────────────────────
// Only after successful Arrest. Permanently removes leader.
// Roll 1d10: 1-5 → regime tracker, 6-10 → coup tracker.
// -5 Legitimacy. +5 Polarization. +5 Backing to Strongman. All others -1 Backing.

registerAutocracyAction('execute_leader', {
    pillar: 'any',
    baseCost: 0,  // no AP cost
    escalatingCostField: null,
    escalationSteps: null,
    cooldownField: null,
    cooldownTicks: null,
    hasDualMode: false,
    halfPowerForRegime: false,
    isStrongmanExclusive: true,
    mutualExclusions: [],
    async execute(supabase, ctx) {
        const { nation, factionState, extra, currentTick } = ctx;
        const targetFactionId = extra?.targetFactionId;
        if (!targetFactionId) return { error: 'Must specify targetFactionId' };

        // Verify target is arrested
        const { data: targetFps } = await supabase.from('faction_pillar_state')
            .select('*')
            .eq('faction_id', targetFactionId).eq('nation_id', nation.id).single();
        if (!targetFps) return { error: 'Target not found' };
        if (!targetFps.arrested_leader) return { error: 'Target leader is not arrested' };

        // Roll 1d10 for tracker effect
        const d10 = roll(1, 10);
        const { data: tracker } = await supabase.from('autocracy_tracker')
            .select('tracker_value').eq('nation_id', nation.id).single();

        if (tracker) {
            let trackerDelta;
            if (d10 <= 5) {
                // Regime tracker: values map 1→+5, 2→+4, 3→+3, 4→+2, 5→+1
                trackerDelta = 6 - d10;  // regime = stabilizing, but V5 says "+N Regime tracker"
                // V5: "1→+5 Regime tracker" means tracker goes UP by 5 (destabilizing from regime perspective)
                // Wait — re-reading: "Regime tracker" going up means more instability
                // Actually 1-5 push tracker UP (bad for regime), 6-10 also push UP (coup)
                // The distinction is narrative, not mechanical — both add to tracker
                trackerDelta = 6 - d10;  // 1→5, 2→4, 3→3, 4→2, 5→1
            } else {
                // Coup tracker: 6→+1, 7→+2, 8→+3, 9→+4, 10→+5
                trackerDelta = d10 - 5;
            }
            const newTracker = Math.max(0, Math.min(100, tracker.tracker_value + trackerDelta));
            await supabase.from('autocracy_tracker').update({
                tracker_value: newTracker,
                last_updated_tick: currentTick,
            }).eq('nation_id', nation.id);
        }

        // Make the arrested leader's pillar the new wildcard
        const oldWildcard = (await supabase.from('autocracy_tracker')
            .select('wildcard_pillar, wildcard_backing')
            .eq('nation_id', nation.id).single()).data;

        await supabase.from('autocracy_tracker').update({
            wildcard_pillar: targetFps.pillar,
            wildcard_backing: Number(targetFps.backing),
            wildcard_neglect_ticks: 0,
        }).eq('nation_id', nation.id);

        // Remove the faction's pillar state (leader executed)
        // Reset their escalations and mark as no longer having a leader
        await supabase.from('faction_pillar_state')
            .update({
                arrested_leader: false,
                leader_name: null,
                leader_age: null,
                death_age: null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', targetFps.id);

        await resetLeaderEscalations(supabase, targetFactionId);

        // +5 Backing to Strongman, -1 Backing to all other factions
        const pCtx = await loadPillarContext(supabase, nation.id);
        if (pCtx) {
            applyBackingDelta(pCtx.pillarStates, pCtx.wildcardState, factionState.pillar, 5, false);
            for (const ps of pCtx.pillarStates) {
                if (ps.faction_id !== factionState.faction_id && ps.faction_id !== targetFactionId) {
                    applyBackingDelta(pCtx.pillarStates, pCtx.wildcardState, ps.pillar, -1, false);
                }
            }
            await persistBackingChanges(supabase, nation.id, pCtx.pillarStates, pCtx.wildcardState);
        }

        // -5 Legitimacy, +5 Polarization
        const { data: n } = await supabase.from('nations')
            .select('legitimacy, polarization').eq('id', nation.id).single();
        if (n) {
            await supabase.from('nations').update({
                legitimacy: clampStat(Number(n.legitimacy || 50) - 5),
                polarization: clampStat(Number(n.polarization || 0) + 5),
            }).eq('id', nation.id);
        }

        return { effects: { d10_roll: d10, target_faction_id: targetFactionId, executed: true } };
    },
});

// ── Release Leader ───────────────────────────────────────────────────────────
// Only after successful Arrest. Returns leader humiliated.
// +1d6 Regime tracker. +3 Legitimacy. -2 Polarization.
// Target Backing halved. Future Arrest rolls against this leader: +5.

registerAutocracyAction('release_leader', {
    pillar: 'any',
    baseCost: 0,
    escalatingCostField: null,
    escalationSteps: null,
    cooldownField: null,
    cooldownTicks: null,
    hasDualMode: false,
    halfPowerForRegime: false,
    isStrongmanExclusive: true,
    mutualExclusions: [],
    async execute(supabase, ctx) {
        const { nation, extra, currentTick } = ctx;
        const targetFactionId = extra?.targetFactionId;
        if (!targetFactionId) return { error: 'Must specify targetFactionId' };

        const { data: targetFps } = await supabase.from('faction_pillar_state')
            .select('*')
            .eq('faction_id', targetFactionId).eq('nation_id', nation.id).single();
        if (!targetFps) return { error: 'Target not found' };
        if (!targetFps.arrested_leader) return { error: 'Target leader is not arrested' };

        // Release: un-arrest
        await supabase.from('faction_pillar_state').update({
            arrested_leader: false,
            arrest_bonus: (targetFps.arrest_bonus || 0) + 5,  // future arrests easier
            updated_at: new Date().toISOString(),
        }).eq('id', targetFps.id);

        // +1d6 Regime tracker
        const trackerAdd = roll(1, 6);
        const { data: tracker } = await supabase.from('autocracy_tracker')
            .select('tracker_value').eq('nation_id', nation.id).single();
        if (tracker) {
            await supabase.from('autocracy_tracker').update({
                tracker_value: Math.min(100, tracker.tracker_value + trackerAdd),
                last_updated_tick: currentTick,
            }).eq('nation_id', nation.id);
        }

        // Target Backing halved
        const pCtx = await loadPillarContext(supabase, nation.id);
        if (pCtx) {
            const targetPs = pCtx.pillarStates.find(p => p.faction_id === targetFactionId);
            if (targetPs) {
                const halfLoss = -(Math.floor(targetPs.backing / 2 * 100) / 100);
                applyBackingDelta(pCtx.pillarStates, pCtx.wildcardState, targetPs.pillar, halfLoss, false);
                await persistBackingChanges(supabase, nation.id, pCtx.pillarStates, pCtx.wildcardState);
            }
        }

        // +3 Legitimacy, -2 Polarization
        const { data: n } = await supabase.from('nations')
            .select('legitimacy, polarization').eq('id', nation.id).single();
        if (n) {
            await supabase.from('nations').update({
                legitimacy: clampStat(Number(n.legitimacy || 50) + 3),
                polarization: clampStat(Number(n.polarization || 0) - 2),
            }).eq('id', nation.id);
        }

        return { effects: { released: true, tracker_add: trackerAdd, target_faction_id: targetFactionId } };
    },
});

// ── Favor ────────────────────────────────────────────────────────────────────
// 2 AP. Choose two factions. Favored: +4 Backing. Disfavored: -4 Backing.
// Visible to all. 3-tick cooldown.

registerAutocracyAction('favor', {
    pillar: 'any',
    baseCost: 2,
    escalatingCostField: null,
    escalationSteps: null,
    cooldownField: 'favor_last_tick',
    cooldownTicks: 3,
    hasDualMode: false,
    halfPowerForRegime: false,
    isStrongmanExclusive: true,
    mutualExclusions: [],
    async execute(supabase, ctx) {
        const { nation, factionState, extra } = ctx;
        const favoredId = extra?.favoredFactionId;
        const disfavoredId = extra?.disfavoredFactionId;

        if (!favoredId || !disfavoredId) return { error: 'Must specify favoredFactionId and disfavoredFactionId' };
        if (favoredId === disfavoredId) return { error: 'Favored and disfavored must be different' };
        if (favoredId === factionState.faction_id || disfavoredId === factionState.faction_id) {
            return { error: 'Cannot favor/disfavor yourself' };
        }

        // Get target pillars
        const { data: targets } = await supabase.from('faction_pillar_state')
            .select('faction_id, pillar')
            .eq('nation_id', nation.id)
            .in('faction_id', [favoredId, disfavoredId]);

        if (!targets || targets.length < 2) return { error: 'Target factions not found' };

        const favored = targets.find(t => t.faction_id === favoredId);
        const disfavored = targets.find(t => t.faction_id === disfavoredId);
        if (!favored || !disfavored) return { error: 'Target factions not found' };

        const pCtx = await loadPillarContext(supabase, nation.id);
        if (!pCtx) return { error: 'No pillar context' };

        applyBackingDelta(pCtx.pillarStates, pCtx.wildcardState, favored.pillar, 4, false);
        applyBackingDelta(pCtx.pillarStates, pCtx.wildcardState, disfavored.pillar, -4, false);
        await persistBackingChanges(supabase, nation.id, pCtx.pillarStates, pCtx.wildcardState);

        return {
            effects: {
                favored: { faction_id: favoredId, backing_change: 4 },
                disfavored: { faction_id: disfavoredId, backing_change: -4 },
            },
        };
    },
});
