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
import { adjustGovernmentApprovalEvent } from './momentum.js';

// ── Diplomatic consequences helper ──────────────────────────────────────────
// Adjusts relation_score with ALL other nations by `delta`.
// If `govApprovalDelta` is non-zero, also hits gov approval for the ruling
// party of every nation that has an active trade agreement with this nation.
async function applyDiplomaticConsequences(supabase, nationId, relationDelta, govApprovalDelta, source) {
    // 1. Adjust relations with all other nations
    const { data: relations } = await supabase.from('diplomatic_relations')
        .select('id, relation_score, nation_a_id, nation_b_id')
        .or(`nation_a_id.eq.${nationId},nation_b_id.eq.${nationId}`);

    if (relations && relations.length > 0) {
        for (const rel of relations) {
            const newScore = Math.max(-100, Math.min(100, (rel.relation_score || 0) + relationDelta));
            await supabase.from('diplomatic_relations')
                .update({ relation_score: newScore, updated_at: new Date().toISOString() })
                .eq('id', rel.id);
        }
    }

    // 2. Gov approval hit for nations with active trade agreements
    if (govApprovalDelta !== 0) {
        const { data: agreements } = await supabase.from('trade_agreements')
            .select('nation_a_id, nation_b_id')
            .or(`nation_a_id.eq.${nationId},nation_b_id.eq.${nationId}`)
            .eq('status', 'active');

        if (agreements && agreements.length > 0) {
            const partnerNationIds = new Set(
                agreements.map(a => a.nation_a_id === nationId ? a.nation_b_id : a.nation_a_id)
            );
            for (const partnerNationId of partnerNationIds) {
                await adjustGovernmentApprovalEvent(supabase, partnerNationId, govApprovalDelta, source);
            }
        }
    }
}

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
            // Lose 2 AP — use atomic RPC to prevent race conditions
            const { data: deductedAp } = await supabase.rpc('deduct_ap', {
                p_faction_id: targetFactionId, p_cost: 2
            });
            outcome = (deductedAp !== null && deductedAp >= 0)
                ? { type: 'ap_loss', amount: 2 }
                : { type: 'ap_loss_failed' };
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
    hasDualMode: false,
    halfPowerForRegime: false,
    isStrongmanExclusive: true,
    mutualExclusions: [],
    async validate(supabase, ctx) {
        const { nation, factionState, extra } = ctx;
        if (!extra?.targetFactionId) return 'Must specify targetFactionId';
        if (extra.targetFactionId === factionState.faction_id) return 'Cannot arrest your own leader';
        const { data: t } = await supabase.from('faction_pillar_state').select('is_strongman, arrested_leader')
            .eq('faction_id', extra.targetFactionId).eq('nation_id', nation.id).single();
        if (!t) return 'Target not found';
        if (t.is_strongman) return 'Cannot arrest yourself';
        if (t.arrested_leader) return 'Target already arrested';
        return null;
    },
    async execute(supabase, ctx) {
        const { nation, factionState, extra, currentTick } = ctx;
        const targetFactionId = extra?.targetFactionId;
        if (targetFactionId === factionState.faction_id) return { success: false, error: 'Cannot arrest your own leader' };

        // Load target (already validated)
        const { data: targetFps } = await supabase.from('faction_pillar_state')
            .select('*')
            .eq('faction_id', targetFactionId).eq('nation_id', nation.id).single();

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

        // Diplomatic consequences: -3 relations with all nations,
        // -3 gov approval for trade partner ruling parties
        await applyDiplomaticConsequences(supabase, nation.id, -3, -3, 'autocracy:arrest_leader');

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
    baseCost: 0,
    escalatingCostField: null,
    escalationSteps: null,
    cooldownField: null,
    cooldownTicks: null,
    hasDualMode: false,
    halfPowerForRegime: false,
    isStrongmanExclusive: true,
    mutualExclusions: [],
    async validate(supabase, ctx) {
        const { nation, factionState, extra } = ctx;
        if (!extra?.targetFactionId) return 'Must specify targetFactionId';
        const { data: t } = await supabase.from('faction_pillar_state').select('is_strongman, arrested_leader')
            .eq('faction_id', extra.targetFactionId).eq('nation_id', nation.id).single();
        if (!t) return 'Target not found';
        if (t.is_strongman) return 'Cannot execute a strongman';
        if (!t.arrested_leader) return 'Target leader is not arrested';
        return null;
    },
    async execute(supabase, ctx) {
        const { nation, factionState, extra, currentTick } = ctx;
        const targetFactionId = extra?.targetFactionId;

        // Load target (already validated)
        const { data: targetFps } = await supabase.from('faction_pillar_state')
            .select('*')
            .eq('faction_id', targetFactionId).eq('nation_id', nation.id).single();

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

        // Diplomatic consequences: -5 relations with all nations,
        // -7 gov approval for trade partner ruling parties
        await applyDiplomaticConsequences(supabase, nation.id, -5, -7, 'autocracy:execute_leader');

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
    async validate(supabase, ctx) {
        const { nation, extra } = ctx;
        if (!extra?.targetFactionId) return 'Must specify targetFactionId';
        const { data: t } = await supabase.from('faction_pillar_state').select('arrested_leader')
            .eq('faction_id', extra.targetFactionId).eq('nation_id', nation.id).single();
        if (!t) return 'Target not found';
        if (!t.arrested_leader) return 'Target leader is not arrested';
        return null;
    },
    async execute(supabase, ctx) {
        const { nation, extra, currentTick } = ctx;
        const targetFactionId = extra?.targetFactionId;

        // Load target (already validated)
        const { data: targetFps } = await supabase.from('faction_pillar_state')
            .select('*')
            .eq('faction_id', targetFactionId).eq('nation_id', nation.id).single();

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

        // Diplomatic consequences: +1 relations with all nations (no gov approval effect)
        await applyDiplomaticConsequences(supabase, nation.id, +1, 0, 'autocracy:release_leader');

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
