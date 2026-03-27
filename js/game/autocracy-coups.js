/**
 * autocracy-coups.js — Phase 7: Standard Coup + Putsch
 * Implements coup formula, outcome resolution, vulnerability windows,
 * pyrrhic windows, and the Military Putsch two-stage system.
 *
 * V5 Autocracy System — Phase 7
 *
 * Helpers loadPillarContext, persistBackingChanges, clampStat, roll
 * are imported from autocracy-actions-military-party-oligarch.js.
 */

import { registerAutocracyAction, resetLeaderEscalations } from './autocracy-actions.js';
import { applyBackingDelta, computeFactionPower, POWER_DELTA_MAP } from './autocracy-pillars.js';
import { roll, loadPillarContext, persistBackingChanges, clampStat } from './autocracy-actions-military-party-oligarch.js';

// ═════════════════════════════════════════════════════════════════════════════
// COUP FORMULA & RESOLUTION
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Core coup resolution. Rolls 1d100 + (tracker - 50), applies outcome.
 *
 * @param {object} supabase
 * @param {object} opts
 * @param {string} opts.nationId
 * @param {string} opts.factionId       - Faction attempting the coup
 * @param {string} opts.factionPillar   - Pillar of the attempting faction
 * @param {number} opts.currentTick
 * @param {number} opts.rollBonus       - Flat bonus to roll (e.g. +20 for vulnerability/pyrrhic)
 * @param {string} opts.coupType        - 'standard' | 'putsch' | 'silent' | 'auto'
 * @returns {object} { outcome, roll, trackerAtAttempt, effects }
 */
export async function resolveStandardCoup(supabase, opts) {
    const { nationId, factionId, factionPillar, currentTick, rollBonus = 0, coupType = 'standard' } = opts;

    // Load tracker
    const { data: tracker } = await supabase.from('autocracy_tracker')
        .select('*').eq('nation_id', nationId).single();
    if (!tracker) return { error: 'No autocracy tracker' };

    const trackerAtAttempt = tracker.tracker_value;

    // Roll = 1d100 + (tracker - 50) + bonus
    const diceRoll = roll(1, 100);
    const finalRoll = diceRoll + (trackerAtAttempt - 50) + rollBonus;

    // Determine outcome
    let outcome;
    if (finalRoll < 0) outcome = 'catastrophic';
    else if (finalRoll <= 39) outcome = 'failure';
    else if (finalRoll <= 69) outcome = 'pyrrhic';
    else if (finalRoll <= 99) outcome = 'clean';
    else outcome = 'dominant';

    // Load nation stats
    const { data: nation } = await supabase.from('nations')
        .select('id, stability, civil_unrest, legitimacy, polarization')
        .eq('id', nationId).single();
    if (!nation) return { error: 'Nation not found' };

    const pCtx = await loadPillarContext(supabase, nationId);
    if (!pCtx) return { error: 'No pillar context' };

    const effects = { outcome, diceRoll, finalRoll, trackerAtAttempt, rollBonus, coupType };

    // ── Apply outcome consequences ──
    if (outcome === 'catastrophic') {
        // Leader executed, pillar → wildcard, backing -5, tracker → 10
        // -1d3 Stability, +1d3 Civil Unrest
        applyBackingDelta(pCtx.pillarStates, pCtx.wildcardState, factionPillar, -5, false);
        await persistBackingChanges(supabase, nationId, pCtx.pillarStates, pCtx.wildcardState);

        // Pillar becomes wildcard
        await supabase.from('autocracy_tracker').update({
            wildcard_pillar: factionPillar,
            wildcard_backing: Math.max(0, Number(pCtx.pillarStates.find(p => p.pillar === factionPillar)?.backing || 0)),
            wildcard_neglect_ticks: 0,
            tracker_value: 10, public_tracker_value: 30,
            last_updated_tick: currentTick,
        }).eq('nation_id', nationId);

        // Mark leader as dead — reset escalations
        const fpsRow = pCtx.fpsRows.find(r => r.pillar === factionPillar);
        if (fpsRow) {
            await supabase.from('faction_pillar_state').update({
                leader_name: null, leader_age: null, death_age: null,
                arrested_leader: false, updated_at: new Date().toISOString(),
            }).eq('id', fpsRow.id);
        }
        await resetLeaderEscalations(supabase, factionId);

        const stabLoss = roll(1, 3);
        const cuLoss = roll(1, 3);
        await supabase.from('nations').update({
            stability: clampStat(Number(nation.stability || 50) - stabLoss),
            civil_unrest: clampStat(Number(nation.civil_unrest || 0) + cuLoss),
        }).eq('id', nationId);

        effects.stability_loss = stabLoss;
        effects.civil_unrest_gain = cuLoss;
        effects.leader_executed = true;

    } else if (outcome === 'failure') {
        // Leader arrested, backing -5, tracker → 10
        // -1d3 Stability, +1d3 Civil Unrest
        applyBackingDelta(pCtx.pillarStates, pCtx.wildcardState, factionPillar, -5, false);
        await persistBackingChanges(supabase, nationId, pCtx.pillarStates, pCtx.wildcardState);

        const fpsRow = pCtx.fpsRows.find(r => r.pillar === factionPillar);
        if (fpsRow) {
            await supabase.from('faction_pillar_state').update({
                arrested_leader: true, updated_at: new Date().toISOString(),
            }).eq('id', fpsRow.id);
        }

        await supabase.from('autocracy_tracker').update({
            tracker_value: 10, last_updated_tick: currentTick,
        }).eq('nation_id', nationId);

        const stabLoss = roll(1, 3);
        const cuLoss = roll(1, 3);
        await supabase.from('nations').update({
            stability: clampStat(Number(nation.stability || 50) - stabLoss),
            civil_unrest: clampStat(Number(nation.civil_unrest || 0) + cuLoss),
        }).eq('id', nationId);

        effects.stability_loss = stabLoss;
        effects.civil_unrest_gain = cuLoss;
        effects.leader_arrested = true;

    } else if (outcome === 'pyrrhic') {
        // New strongman but structurally unsound
        // Legitimacy → 15, Polarization +20, tracker → 30
        // -1d6 Stability, +1d6 Civil Unrest
        // 3-tick pyrrhic window for other factions
        await transferPower(supabase, nationId, factionId, factionPillar, pCtx, currentTick);

        await supabase.from('nations').update({
            legitimacy: 15,
            polarization: clampStat(Number(nation.polarization || 0) + 20),
        }).eq('id', nationId);

        await supabase.from('autocracy_tracker').update({
            tracker_value: 30, public_tracker_value: 30, last_updated_tick: currentTick,
        }).eq('nation_id', nationId);

        // Open pyrrhic window
        await supabase.from('pyrrhic_window').insert({
            nation_id: nationId,
            start_tick: currentTick,
            end_tick: currentTick + 3,
            new_strongman_id: factionId,
        });

        const stabLoss = roll(1, 6);
        const cuLoss = roll(1, 6);
        await supabase.from('nations').update({
            stability: clampStat(Number(nation.stability || 50) - stabLoss),
            civil_unrest: clampStat(Number(nation.civil_unrest || 0) + cuLoss),
        }).eq('id', nationId);

        effects.stability_loss = stabLoss;
        effects.civil_unrest_gain = cuLoss;
        effects.pyrrhic_window = { start: currentTick, end: currentTick + 3 };

    } else if (outcome === 'clean') {
        // In power. Legitimacy → 35, tracker → 30
        // -1d6 Stability, +1d6 Civil Unrest
        await transferPower(supabase, nationId, factionId, factionPillar, pCtx, currentTick);

        await supabase.from('nations').update({ legitimacy: 35 }).eq('id', nationId);

        await supabase.from('autocracy_tracker').update({
            tracker_value: 30, public_tracker_value: 30, last_updated_tick: currentTick,
        }).eq('nation_id', nationId);

        const stabLoss = roll(1, 6);
        const cuLoss = roll(1, 6);
        await supabase.from('nations').update({
            stability: clampStat(Number(nation.stability || 50) - stabLoss),
            civil_unrest: clampStat(Number(nation.civil_unrest || 0) + cuLoss),
        }).eq('id', nationId);

        effects.stability_loss = stabLoss;
        effects.civil_unrest_gain = cuLoss;

    } else {
        // dominant (100+)
        // In power. Legitimacy → 50, tracker → 30
        // -1d6 Stability, +1d6 Civil Unrest
        await transferPower(supabase, nationId, factionId, factionPillar, pCtx, currentTick);

        await supabase.from('nations').update({ legitimacy: 50 }).eq('id', nationId);

        await supabase.from('autocracy_tracker').update({
            tracker_value: 30, public_tracker_value: 30, last_updated_tick: currentTick,
        }).eq('nation_id', nationId);

        const stabLoss = roll(1, 6);
        const cuLoss = roll(1, 6);
        await supabase.from('nations').update({
            stability: clampStat(Number(nation.stability || 50) - stabLoss),
            civil_unrest: clampStat(Number(nation.civil_unrest || 0) + cuLoss),
        }).eq('id', nationId);

        effects.stability_loss = stabLoss;
        effects.civil_unrest_gain = cuLoss;
    }

    // Log the attempt
    await supabase.from('coup_attempt_log').insert({
        nation_id: nationId,
        faction_id: factionId,
        tick: currentTick,
        tracker_at_attempt: trackerAtAttempt,
        roll_result: finalRoll,
        outcome,
        coup_type: coupType,
        details: effects,
    });

    // Log to event_log for visibility
    const outcomeLabels = {
        catastrophic: 'Catastrophic Failure',
        failure: 'Failed Coup',
        pyrrhic: 'Pyrrhic Victory',
        clean: 'Successful Coup',
        dominant: 'Dominant Takeover',
    };
    await supabase.from('event_log').insert({
        nation_id: nationId,
        event_name: outcomeLabels[outcome] || 'Coup Attempt',
        description_chosen: `A ${coupType} coup attempt resulted in: ${outcomeLabels[outcome]}.`,
        category: 'POLITICAL',
        fired_at_tick: currentTick,
    });

    return effects;
}

/**
 * Transfer Strongman status to the coup leader.
 * Old Strongman becomes a regular faction; new Strongman claims their pillar as foundation.
 */
async function transferPower(supabase, nationId, newStrongmanFactionId, newStrongmanPillar, pCtx, currentTick) {
    // Find old strongman
    const oldStrongman = pCtx.fpsRows.find(r => r.is_strongman);
    if (oldStrongman) {
        await supabase.from('faction_pillar_state').update({
            is_strongman: false, updated_at: new Date().toISOString(),
        }).eq('id', oldStrongman.id);
    }

    // Set new strongman
    const newStrongman = pCtx.fpsRows.find(r => r.faction_id === newStrongmanFactionId);
    if (newStrongman) {
        await supabase.from('faction_pillar_state').update({
            is_strongman: true, updated_at: new Date().toISOString(),
        }).eq('id', newStrongman.id);
    }

    // Update nation's ruling faction + head of state to new strongman's leader
    const nationUpdate = { ruling_faction_id: newStrongmanFactionId };
    if (newStrongman?.leader_name) {
        const parts = newStrongman.leader_name.split(' ');
        nationUpdate.head_of_state_first_name = parts[0] || 'Unknown';
        nationUpdate.head_of_state_last_name = parts.slice(1).join(' ') || 'Leader';
    }
    if (newStrongman?.leader_age) {
        nationUpdate.head_of_state_age = newStrongman.leader_age;
    }
    await supabase.from('nations').update(nationUpdate).eq('id', nationId);

    // Close old administration, create new one
    try {
        const { data: shardData } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
        const dateStr = shardData?.current_date || '';
        await supabase.from('administrations')
            .update({ ended_at_tick: currentTick, ended_at_date: dateStr, end_reason: 'coup' })
            .eq('nation_id', nationId).is('ended_at_tick', null);

        const { data: newFaction } = await supabase.from('factions')
            .select('faction_name').eq('id', newStrongmanFactionId).single();
        const leaderName = newStrongman?.leader_name || 'Unknown';
        await supabase.from('administrations').insert({
            nation_id: nationId,
            admin_name: `${leaderName.split(' ').pop() || 'Military'} Regime`,
            head_of_state: leaderName,
            government_type: 'Autocracy',
            started_at_tick: currentTick,
            started_at_date: dateStr,
            approval_at_start: 50,
        });

        // Reset government approval for new regime
        await supabase.from('nations').update({ gov_approval: 50, gov_approval_events: 0 }).eq('id', nationId);
    } catch (e) {
        console.error('[transferPower] Admin transition failed (non-fatal):', e);
    }

    // Log the power transfer
    await supabase.from('campaign_actions').insert({
        party_id: newStrongmanFactionId, nation_id: nationId,
        action_type: 'coup_power_transfer', tick_performed: currentTick,
        result: {
            old_strongman_faction_id: oldStrongman?.faction_id,
            new_strongman_faction_id: newStrongmanFactionId,
            new_strongman_pillar: newStrongmanPillar,
        },
    });
}

// ═════════════════════════════════════════════════════════════════════════════
// COUP ACTIONS
// ═════════════════════════════════════════════════════════════════════════════

// ── Standard Coup Attempt ────────────────────────────────────────────────────
// 2 AP. Any non-Strongman faction. Uses standard coup formula.
// Gets +20 bonus during vulnerability or pyrrhic windows.

registerAutocracyAction('coup_attempt', {
    pillar: 'any',
    baseCost: 2,
    escalatingCostField: null,
    escalationSteps: null,
    cooldownField: null,
    cooldownTicks: null,
    hasDualMode: false,
    halfPowerForRegime: false,
    isStrongmanExclusive: false,
    mutualExclusions: [],
    async execute(supabase, ctx) {
        const { nation, factionState, currentTick } = ctx;

        if (factionState.is_strongman) return { error: 'Strongman cannot attempt a coup' };

        // Check for active vulnerability window (+20 bonus)
        const { data: vulnWindow } = await supabase.from('vulnerability_window')
            .select('*').eq('nation_id', nation.id).eq('resolved', false)
            .lte('start_tick', currentTick).gte('end_tick', currentTick)
            .maybeSingle();

        // Check for active pyrrhic window (+20 bonus)
        const { data: pyrrhicWindow } = await supabase.from('pyrrhic_window')
            .select('*').eq('nation_id', nation.id).eq('resolved', false)
            .lte('start_tick', currentTick).gte('end_tick', currentTick)
            .maybeSingle();

        let rollBonus = 0;
        if (vulnWindow) rollBonus += 20;
        if (pyrrhicWindow) rollBonus += 20;

        const result = await resolveStandardCoup(supabase, {
            nationId: nation.id,
            factionId: factionState.faction_id,
            factionPillar: factionState.pillar,
            currentTick,
            rollBonus,
            coupType: 'standard',
        });

        return { effects: result };
    },
});

// ═════════════════════════════════════════════════════════════════════════════
// PUTSCH — MILITARY SPECIAL COUP
// ═════════════════════════════════════════════════════════════════════════════

// ── Declare Putsch (Military only) ───────────────────────────────────────────
// 2 AP. Declares martial law. Strongman gets 1 tick to respond.

registerAutocracyAction('declare_putsch', {
    pillar: 'military',
    baseCost: 2,
    escalatingCostField: null,
    escalationSteps: null,
    cooldownField: null,
    cooldownTicks: null,
    hasDualMode: false,
    halfPowerForRegime: false,
    isStrongmanExclusive: false,
    mutualExclusions: [],
    async execute(supabase, ctx) {
        const { nation, factionState, currentTick } = ctx;

        if (factionState.is_strongman) return { error: 'Strongman cannot declare a putsch' };
        if (factionState.pillar !== 'military') return { error: 'Only the Military faction can declare a putsch' };

        // Check for existing unresolved putsch
        const { data: existing } = await supabase.from('putsch_state')
            .select('id').eq('nation_id', nation.id).eq('resolved', false)
            .maybeSingle();
        if (existing) return { error: 'A putsch is already in progress' };

        // Create putsch state — Strongman has 1 tick to respond
        await supabase.from('putsch_state').insert({
            nation_id: nation.id,
            military_faction_id: factionState.faction_id,
            declared_tick: currentTick,
        });

        // Log event
        await supabase.from('event_log').insert({
            nation_id: nation.id,
            event_name: 'Military Putsch Declared',
            description_chosen: 'The Military has declared martial law. The regime must respond.',
            category: 'POLITICAL',
            fired_at_tick: currentTick,
        });

        return { effects: { putsch_declared: true, response_deadline: currentTick + 1 } };
    },
});

// ── Emergency Decree (Strongman response to Putsch) ──────────────────────────
// 3 AP. Subtracts 1d6×3 from tracker (stabilizes regime before putsch roll).

registerAutocracyAction('emergency_decree', {
    pillar: 'any',
    baseCost: 3,
    escalatingCostField: null,
    escalationSteps: null,
    cooldownField: null,
    cooldownTicks: null,
    hasDualMode: false,
    halfPowerForRegime: false,
    isStrongmanExclusive: true,
    mutualExclusions: [],
    async execute(supabase, ctx) {
        const { nation, factionState, currentTick } = ctx;

        // Must have an active putsch awaiting response
        const { data: putsch } = await supabase.from('putsch_state')
            .select('*').eq('nation_id', nation.id).eq('resolved', false)
            .is('strongman_response', null).maybeSingle();
        if (!putsch) return { error: 'No active putsch awaiting response' };

        // Must respond on the tick after declaration
        if (currentTick !== putsch.declared_tick + 1) {
            return { error: 'Response window has passed' };
        }

        // 1d6 × 3 subtracted from tracker (helps regime)
        const d6 = roll(1, 6);
        const trackerReduction = d6 * 3;

        const { data: tracker } = await supabase.from('autocracy_tracker')
            .select('tracker_value').eq('nation_id', nation.id).single();
        if (tracker) {
            await supabase.from('autocracy_tracker').update({
                tracker_value: Math.max(0, tracker.tracker_value - trackerReduction),
                last_updated_tick: currentTick,
            }).eq('nation_id', nation.id);
        }

        // Record response
        await supabase.from('putsch_state').update({
            strongman_response: 'emergency_decree',
        }).eq('id', putsch.id);

        return { effects: { d6_roll: d6, tracker_reduction: trackerReduction } };
    },
});

// ── Appeal to Security Services (Strongman response to Putsch) ───────────────
// 0 AP. Security Services secretly chooses regime or self.

registerAutocracyAction('appeal_security', {
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
        const { nation, factionState, currentTick } = ctx;

        // Must have an active putsch awaiting response
        const { data: putsch } = await supabase.from('putsch_state')
            .select('*').eq('nation_id', nation.id).eq('resolved', false)
            .is('strongman_response', null).maybeSingle();
        if (!putsch) return { error: 'No active putsch awaiting response' };

        if (currentTick !== putsch.declared_tick + 1) {
            return { error: 'Response window has passed' };
        }

        // Security Services must be an active separate faction (not Strongman's foundation)
        const { data: ssFps } = await supabase.from('faction_pillar_state')
            .select('faction_id, is_strongman')
            .eq('nation_id', nation.id).eq('pillar', 'security').maybeSingle();
        if (!ssFps) return { error: 'No Security Services faction exists' };
        if (ssFps.is_strongman) return { error: 'Cannot appeal to yourself' };

        // Record response — SS choice is pending
        await supabase.from('putsch_state').update({
            strongman_response: 'appeal_security',
        }).eq('id', putsch.id);

        return { effects: { appeal_sent: true, security_faction_id: ssFps.faction_id } };
    },
});

// ── Security Services responds to appeal ─────────────────────────────────────
// SS faction chooses regime or self. 0 AP.

registerAutocracyAction('security_putsch_response', {
    pillar: 'security',
    baseCost: 0,
    escalatingCostField: null,
    escalationSteps: null,
    cooldownField: null,
    cooldownTicks: null,
    hasDualMode: false,
    halfPowerForRegime: false,
    isStrongmanExclusive: false,
    mutualExclusions: [],
    async execute(supabase, ctx) {
        const { nation, factionState, extra, currentTick } = ctx;

        if (factionState.pillar !== 'security') return { error: 'Only Security Services can respond' };

        const choice = extra?.choice; // 'regime' or 'yourself'
        if (!choice || (choice !== 'regime' && choice !== 'yourself')) {
            return { error: 'Must specify choice: regime or yourself' };
        }

        // Must have active putsch with appeal_security response pending SS choice
        const { data: putsch } = await supabase.from('putsch_state')
            .select('*').eq('nation_id', nation.id).eq('resolved', false)
            .eq('strongman_response', 'appeal_security')
            .is('security_response', null).maybeSingle();
        if (!putsch) return { error: 'No active putsch awaiting Security Services response' };

        await supabase.from('putsch_state').update({
            security_response: choice,
        }).eq('id', putsch.id);

        if (choice === 'regime') {
            // Helps regime: 1d6 × 2 subtracted from tracker, SS +3 Backing
            const d6 = roll(1, 6);
            const trackerReduction = d6 * 2;

            const { data: tracker } = await supabase.from('autocracy_tracker')
                .select('tracker_value').eq('nation_id', nation.id).single();
            if (tracker) {
                await supabase.from('autocracy_tracker').update({
                    tracker_value: Math.max(0, tracker.tracker_value - trackerReduction),
                    last_updated_tick: currentTick,
                }).eq('nation_id', nation.id);
            }

            // SS +3 Backing
            const pCtx = await loadPillarContext(supabase, nation.id);
            if (pCtx) {
                applyBackingDelta(pCtx.pillarStates, pCtx.wildcardState, 'security', 3, false);
                await persistBackingChanges(supabase, nation.id, pCtx.pillarStates, pCtx.wildcardState);
            }

            return { effects: { choice: 'regime', d6_roll: d6, tracker_reduction: trackerReduction, backing_gain: 3 } };
        } else {
            // Does nothing — putsch proceeds unimpeded
            return { effects: { choice: 'yourself', did_nothing: true } };
        }
    },
});

// ── Putsch Do Nothing (Strongman explicit non-response) ──────────────────────
// 0 AP. Strongman explicitly chooses not to respond.

registerAutocracyAction('putsch_do_nothing', {
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
        const { nation, currentTick } = ctx;

        const { data: putsch } = await supabase.from('putsch_state')
            .select('*').eq('nation_id', nation.id).eq('resolved', false)
            .is('strongman_response', null).maybeSingle();
        if (!putsch) return { error: 'No active putsch awaiting response' };

        if (currentTick !== putsch.declared_tick + 1) {
            return { error: 'Response window has passed' };
        }

        await supabase.from('putsch_state').update({
            strongman_response: 'do_nothing',
        }).eq('id', putsch.id);

        return { effects: { did_nothing: true } };
    },
});

// ═════════════════════════════════════════════════════════════════════════════
// TICK PROCESSORS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Check if Strongman's foundation backing has hit 0.
 * If so, open a 3-tick vulnerability window.
 * If an active window expired and no coup occurred, reset backing to 5.
 */
export async function processVulnerabilityWindows(supabase, nation, currentTick) {
    const { data: fpsRows } = await supabase.from('faction_pillar_state')
        .select('*').eq('nation_id', nation.id);
    if (!fpsRows) return null;

    const strongman = fpsRows.find(r => r.is_strongman);
    if (!strongman) return null;

    // Check for expired windows — resolve them
    const { data: activeWindows } = await supabase.from('vulnerability_window')
        .select('*').eq('nation_id', nation.id).eq('resolved', false);

    const results = [];

    if (activeWindows) {
        for (const win of activeWindows) {
            if (currentTick > win.end_tick) {
                // Window expired — Strongman survived, reset backing to 5
                await supabase.from('vulnerability_window').update({
                    resolved: true,
                }).eq('id', win.id);

                const pCtx = await loadPillarContext(supabase, nation.id);
                if (pCtx) {
                    const smPs = pCtx.pillarStates.find(p => p.pillar === strongman.pillar);
                    if (smPs && smPs.backing < 5) {
                        applyBackingDelta(pCtx.pillarStates, pCtx.wildcardState, strongman.pillar, 5 - smPs.backing, false);
                        await persistBackingChanges(supabase, nation.id, pCtx.pillarStates, pCtx.wildcardState);
                    }
                }

                results.push({ type: 'vulnerability_survived', window_id: win.id });
            }
        }
    }

    // Check if Strongman backing is 0 and no active window exists
    const hasActiveWindow = activeWindows && activeWindows.some(w => !w.resolved && currentTick <= w.end_tick);
    if (Number(strongman.backing) <= 0 && !hasActiveWindow) {
        // Open new vulnerability window
        await supabase.from('vulnerability_window').insert({
            nation_id: nation.id,
            start_tick: currentTick,
            end_tick: currentTick + 3,
        });

        await supabase.from('event_log').insert({
            nation_id: nation.id,
            event_name: 'Regime Vulnerability',
            description_chosen: 'The Strongman\'s power base has collapsed. The regime is vulnerable to a coup.',
            category: 'POLITICAL',
            fired_at_tick: currentTick,
        });

        results.push({ type: 'vulnerability_opened', start: currentTick, end: currentTick + 3 });
    }

    return results.length > 0 ? results : null;
}

/**
 * Resolve expired pyrrhic windows.
 * If 3 ticks pass with no successful challenger, the new regime stabilizes.
 */
export async function processPyrrhicWindows(supabase, nation, currentTick) {
    const { data: activeWindows } = await supabase.from('pyrrhic_window')
        .select('*').eq('nation_id', nation.id).eq('resolved', false);

    if (!activeWindows || activeWindows.length === 0) return null;

    const results = [];
    for (const win of activeWindows) {
        if (currentTick > win.end_tick) {
            await supabase.from('pyrrhic_window').update({
                resolved: true,
            }).eq('id', win.id);

            results.push({ type: 'pyrrhic_window_closed', new_strongman_id: win.new_strongman_id });
        }
    }

    return results.length > 0 ? results : null;
}

/**
 * Resolve putsch events after the response window.
 * Called each tick. If a putsch was declared last tick and is unresolved, resolve it.
 *
 * Flow:
 * - If Strongman responded with emergency_decree → tracker already modified, resolve via formula
 * - If Strongman responded with appeal_security and SS hasn't responded → SS defaults to 'yourself'
 * - If Strongman responded with appeal_security and SS responded → apply SS choice, resolve via formula
 * - If Strongman did nothing or didn't respond → resolve via formula unmodified
 */
export async function processPutschResolution(supabase, nation, currentTick) {
    const { data: putsch } = await supabase.from('putsch_state')
        .select('*').eq('nation_id', nation.id).eq('resolved', false)
        .maybeSingle();
    if (!putsch) return null;

    // Only resolve if response window has passed (declared_tick + 1 < currentTick)
    // i.e., at least 1 full tick after declaration for response
    if (currentTick <= putsch.declared_tick + 1) return null;

    // If appeal_security with no SS response yet, SS defaults to 'yourself' (did nothing)
    if (putsch.strongman_response === 'appeal_security' && !putsch.security_response) {
        await supabase.from('putsch_state').update({
            security_response: 'yourself',
        }).eq('id', putsch.id);
    }

    // If Strongman never responded, treat as do_nothing
    if (!putsch.strongman_response) {
        await supabase.from('putsch_state').update({
            strongman_response: 'do_nothing',
        }).eq('id', putsch.id);
    }

    // Load military faction info for coup resolution
    const { data: milFps } = await supabase.from('faction_pillar_state')
        .select('*').eq('faction_id', putsch.military_faction_id)
        .eq('nation_id', nation.id).single();
    if (!milFps) {
        // Military faction gone — cancel putsch
        await supabase.from('putsch_state').update({ resolved: true, outcome: 'cancelled' }).eq('id', putsch.id);
        return { type: 'putsch_cancelled' };
    }

    // Resolve via standard coup formula
    const result = await resolveStandardCoup(supabase, {
        nationId: nation.id,
        factionId: putsch.military_faction_id,
        factionPillar: milFps.pillar,
        currentTick,
        rollBonus: 0,
        coupType: 'putsch',
    });

    // Mark putsch as resolved
    await supabase.from('putsch_state').update({
        resolved: true,
        outcome: result.outcome || 'resolved',
    }).eq('id', putsch.id);

    return { type: 'putsch_resolved', ...result };
}
