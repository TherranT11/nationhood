/**
 * autocracy-silent-coup.js — Phase 8: Silent Coup + Succession
 * Security Services Silent Coup (Path A: deal/vote, Path B: direct),
 * Appoint/Revoke Successor actions, and V5 succession resolution.
 *
 * V5 Autocracy System — Phase 8
 *
 * NOTE: Helpers loadPillarContext, persistBackingChanges, clampStat, roll
 * are declared in autocracy-actions-military-party-oligarch.js and available
 * in the same scope after bundle concatenation.
 * resolveStandardCoup and transferPower are from autocracy-coups.js.
 */

import { registerAutocracyAction, resetLeaderEscalations } from './autocracy-actions.js';
import { applyBackingDelta, computeFactionPower } from './autocracy-pillars.js';
import { resolveStandardCoup } from './autocracy-coups.js';

// ═════════════════════════════════════════════════════════════════════════════
// SILENT COUP — SECURITY SERVICES SPECIAL CASE
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Check if Security Services faction has surveilled every other faction
 * at least once. Required for both Silent Coup paths.
 */
function hasSurveilledAll(factionState, allFpsRows) {
    const targets = Array.isArray(factionState.surveillance_targets)
        ? factionState.surveillance_targets
        : JSON.parse(factionState.surveillance_targets || '[]');

    const otherFactionIds = allFpsRows
        .filter(r => r.faction_id !== factionState.faction_id)
        .map(r => r.faction_id);

    return otherFactionIds.every(id => targets.includes(id));
}

// ── Initiate Silent Coup (Security Services only) ────────────────────────────
// 2 AP. Path depends on tracker value at time of initiation.
// Path A (tracker 25–39): Deal phase → vote next tick.
// Path B (tracker ≥ 40): Direct coup via standard formula.

registerAutocracyAction('silent_coup', {
    pillar: 'security',
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
        const { nation, factionState, currentTick, extra } = ctx;

        if (factionState.is_strongman) return { error: 'Strongman cannot initiate a silent coup' };
        if (factionState.pillar !== 'security') return { error: 'Only Security Services can initiate a silent coup' };

        // Load all faction pillar states
        const { data: allFps } = await supabase.from('faction_pillar_state')
            .select('*').eq('nation_id', nation.id);
        if (!allFps) return { error: 'No faction pillar states' };

        // Check surveillance requirement
        if (!hasSurveilledAll(factionState, allFps)) {
            return { error: 'Must surveil every faction at least once before initiating Silent Coup' };
        }

        // Load tracker
        const { data: tracker } = await supabase.from('autocracy_tracker')
            .select('tracker_value').eq('nation_id', nation.id).single();
        if (!tracker) return { error: 'No tracker' };

        const trackerVal = tracker.tracker_value;

        if (trackerVal < 25) {
            return { error: 'Tracker too low for Silent Coup (minimum 25)' };
        }

        if (trackerVal >= 40) {
            // ── PATH B: Direct coup via standard formula ──
            const result = await resolveStandardCoup(supabase, {
                nationId: nation.id,
                factionId: factionState.faction_id,
                factionPillar: factionState.pillar,
                currentTick,
                rollBonus: 0,
                coupType: 'silent',
            });
            return { effects: { path: 'B', ...result } };
        }

        // ── PATH A: Deal phase (tracker 25–39) ──
        // Check no existing active silent coup
        const { data: existingOffers } = await supabase.from('silent_coup_offers')
            .select('id').eq('nation_id', nation.id).eq('voided', false)
            .is('accepted', null);
        if (existingOffers && existingOffers.length > 0) {
            return { error: 'A silent coup deal phase is already active' };
        }

        // SS sends offers to each non-Strongman, non-SS faction
        // Offers provided via extra: { offers: { factionId: 'minister'|'backing'|'immunity' } }
        const offers = extra?.offers;
        if (!offers || typeof offers !== 'object') {
            return { error: 'Must specify offers: { factionId: "minister"|"backing"|"immunity" }' };
        }

        const nonSSFactions = allFps.filter(r =>
            r.faction_id !== factionState.faction_id && !r.is_strongman
        );

        const insertedOffers = [];
        for (const targetFps of nonSSFactions) {
            const offerType = offers[targetFps.faction_id];
            if (!offerType || !['minister', 'backing', 'immunity'].includes(offerType)) {
                return { error: `Invalid or missing offer for faction ${targetFps.faction_id}. Must be minister, backing, or immunity.` };
            }

            insertedOffers.push({
                nation_id: nation.id,
                from_faction_id: factionState.faction_id,
                to_faction_id: targetFps.faction_id,
                offer_type: offerType,
                tick_offered: currentTick,
            });
        }

        await supabase.from('silent_coup_offers').insert(insertedOffers);

        return {
            effects: {
                path: 'A',
                deal_phase: true,
                offers_sent: insertedOffers.length,
                vote_tick: currentTick + 1,
            },
        };
    },
});

// ── Silent Coup Vote (non-Strongman factions) ────────────────────────────────
// 0 AP. Each faction privately chooses 'strongman' or 'coup'.

registerAutocracyAction('silent_coup_vote', {
    pillar: 'any',
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

        if (factionState.is_strongman) return { error: 'Strongman cannot vote in a silent coup' };

        const choice = extra?.choice;
        if (!choice || (choice !== 'strongman' && choice !== 'coup')) {
            return { error: 'Must specify choice: strongman or coup' };
        }

        // Check there are active offers for this tick window
        const { data: offers } = await supabase.from('silent_coup_offers')
            .select('*').eq('nation_id', nation.id).eq('voided', false)
            .is('accepted', null);
        if (!offers || offers.length === 0) {
            return { error: 'No active silent coup to vote on' };
        }

        // Verify this faction was offered (SS or a target)
        const myOffer = offers.find(o => o.to_faction_id === factionState.faction_id);
        // SS faction itself also votes (implicitly 'coup')
        const isSS = offers.some(o => o.from_faction_id === factionState.faction_id);

        if (!myOffer && !isSS) {
            return { error: 'You are not part of this silent coup vote' };
        }

        // Check not already voted
        const { data: existingVote } = await supabase.from('silent_coup_votes')
            .select('id').eq('nation_id', nation.id).eq('faction_id', factionState.faction_id)
            .eq('tick', currentTick).maybeSingle();
        if (existingVote) return { error: 'Already voted this tick' };

        await supabase.from('silent_coup_votes').insert({
            nation_id: nation.id,
            faction_id: factionState.faction_id,
            tick: currentTick,
            choice,
        });

        // Mark offer as accepted/rejected based on vote
        if (myOffer) {
            await supabase.from('silent_coup_offers').update({
                accepted: choice === 'coup',
            }).eq('id', myOffer.id);
        }

        return { effects: { voted: choice } };
    },
});

// ═════════════════════════════════════════════════════════════════════════════
// SILENT COUP TICK RESOLUTION
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Resolve silent coup vote phase. Called each tick.
 * If offers exist from last tick and all votes are in (or tick window expired),
 * resolve the outcome.
 */
export async function processSilentCoupResolution(supabase, nation, currentTick) {
    // Find unresolved offers
    const { data: offers } = await supabase.from('silent_coup_offers')
        .select('*').eq('nation_id', nation.id).eq('voided', false);

    if (!offers || offers.length === 0) return null;

    // Group by tick_offered — take the most recent batch
    const latestTick = Math.max(...offers.map(o => o.tick_offered));
    const batchOffers = offers.filter(o => o.tick_offered === latestTick);

    // Only resolve if we're past the vote tick (offer_tick + 1)
    if (currentTick <= latestTick + 1) return null;

    // Check if tracker dropped below 25 — cancel if so
    const { data: tracker } = await supabase.from('autocracy_tracker')
        .select('tracker_value').eq('nation_id', nation.id).single();
    if (tracker && tracker.tracker_value < 25) {
        // Void all offers
        for (const offer of batchOffers) {
            await supabase.from('silent_coup_offers').update({ voided: true }).eq('id', offer.id);
        }
        await supabase.from('event_log').insert({
            nation_id: nation.id,
            event_name: 'Silent Coup Cancelled',
            description_chosen: 'The regime has stabilized. Silent coup plans have been abandoned.',
            category: 'POLITICAL',
            fired_at_tick: currentTick,
        });
        return { type: 'silent_coup_cancelled', reason: 'tracker_below_25' };
    }

    // Gather votes from the vote tick
    const voteTick = latestTick + 1;
    const { data: votes } = await supabase.from('silent_coup_votes')
        .select('*').eq('nation_id', nation.id).eq('tick', voteTick);

    const ssFactionId = batchOffers[0].from_faction_id;

    // Count votes (SS always votes 'coup' implicitly)
    let coupVotes = 1; // SS
    let strongmanVotes = 0;

    if (votes) {
        for (const v of votes) {
            if (v.faction_id === ssFactionId) continue; // SS already counted
            if (v.choice === 'coup') coupVotes++;
            else strongmanVotes++;
        }
    }

    // Non-voters who had offers default to 'strongman' (abstention = no support)
    const votedFactionIds = new Set(votes?.map(v => v.faction_id) || []);
    for (const offer of batchOffers) {
        if (!votedFactionIds.has(offer.to_faction_id) && offer.to_faction_id !== ssFactionId) {
            strongmanVotes++;
        }
    }

    // Mark all offers as resolved (accepted based on vote outcome)
    const coupSucceeds = coupVotes > strongmanVotes;

    if (coupSucceeds) {
        // Silent coup succeeds — no roll needed
        // SS becomes new Strongman
        const pCtx = await loadPillarContext(supabase, nation.id);
        if (!pCtx) return { error: 'No pillar context' };

        // Transfer power
        const oldStrongman = pCtx.fpsRows.find(r => r.is_strongman);
        if (oldStrongman) {
            await supabase.from('faction_pillar_state').update({
                is_strongman: false, updated_at: new Date().toISOString(),
            }).eq('id', oldStrongman.id);
        }

        const ssFps = pCtx.fpsRows.find(r => r.faction_id === ssFactionId);
        if (ssFps) {
            await supabase.from('faction_pillar_state').update({
                is_strongman: true, updated_at: new Date().toISOString(),
            }).eq('id', ssFps.id);
        }

        await supabase.from('nations').update({
            ruling_faction_id: ssFactionId,
        }).eq('id', nation.id);

        // Reset tracker to 30
        await supabase.from('autocracy_tracker').update({
            tracker_value: 30, last_updated_tick: currentTick,
        }).eq('nation_id', nation.id);

        // Honor accepted offers with minister positions
        const acceptedOffers = batchOffers.filter(o => o.accepted === true);
        for (const offer of acceptedOffers) {
            if (offer.offer_type === 'minister') {
                // Auto-appoint: increment minister_count, mark 10-tick lock
                await supabase.from('faction_pillar_state').update({
                    minister_count: (await supabase.from('faction_pillar_state')
                        .select('minister_count').eq('faction_id', offer.to_faction_id)
                        .eq('nation_id', nation.id).single()).data?.minister_count + 1 || 1,
                    updated_at: new Date().toISOString(),
                }).eq('faction_id', offer.to_faction_id).eq('nation_id', nation.id);
            } else if (offer.offer_type === 'backing') {
                // +3 Backing immediately
                const freshCtx = await loadPillarContext(supabase, nation.id);
                if (freshCtx) {
                    const targetPs = freshCtx.fpsRows.find(r => r.faction_id === offer.to_faction_id);
                    if (targetPs) {
                        applyBackingDelta(freshCtx.pillarStates, freshCtx.wildcardState, targetPs.pillar, 3, false);
                        await persistBackingChanges(supabase, nation.id, freshCtx.pillarStates, freshCtx.wildcardState);
                    }
                }
            } else if (offer.offer_type === 'immunity') {
                // Blackmail immunity for 10 ticks
                await supabase.from('faction_pillar_state').update({
                    blackmail_immune_until: currentTick + 10,
                    updated_at: new Date().toISOString(),
                }).eq('faction_id', offer.to_faction_id).eq('nation_id', nation.id);
            }
        }

        // Stat effects: -1d6 Stability, +1d6 Civil Unrest (successful coup)
        const { data: n } = await supabase.from('nations')
            .select('stability, civil_unrest').eq('id', nation.id).single();
        if (n) {
            const stabLoss = roll(1, 6);
            const cuGain = roll(1, 6);
            await supabase.from('nations').update({
                stability: clampStat(Number(n.stability || 50) - stabLoss),
                civil_unrest: clampStat(Number(n.civil_unrest || 0) + cuGain),
            }).eq('id', nation.id);
        }

        // Log coup
        await supabase.from('coup_attempt_log').insert({
            nation_id: nation.id,
            faction_id: ssFactionId,
            tick: currentTick,
            tracker_at_attempt: tracker.tracker_value,
            roll_result: 0, // No roll for Path A
            outcome: 'clean', // Auto-success
            coup_type: 'silent',
            details: { path: 'A', votes: { coup: coupVotes, strongman: strongmanVotes }, offers_honored: acceptedOffers.length },
        });

        await supabase.from('event_log').insert({
            nation_id: nation.id,
            event_name: 'Silent Coup',
            description_chosen: 'The Security Services have quietly seized power. A new Strongman emerges.',
            category: 'POLITICAL',
            fired_at_tick: currentTick,
        });

        // Void the offers (resolved)
        for (const offer of batchOffers) {
            await supabase.from('silent_coup_offers').update({ voided: true }).eq('id', offer.id);
        }

        return {
            type: 'silent_coup_success',
            path: 'A',
            votes: { coup: coupVotes, strongman: strongmanVotes },
            new_strongman: ssFactionId,
            offers_honored: acceptedOffers.length,
        };
    } else {
        // Failed — SS Backing → 0, leader eligible for Arrest
        const pCtx = await loadPillarContext(supabase, nation.id);
        if (pCtx) {
            const ssFps = pCtx.pillarStates.find(p => p.faction_id === ssFactionId);
            if (ssFps) {
                const backingLoss = -ssFps.backing;
                applyBackingDelta(pCtx.pillarStates, pCtx.wildcardState, 'security', backingLoss, false);
                await persistBackingChanges(supabase, nation.id, pCtx.pillarStates, pCtx.wildcardState);
            }
        }

        // Void offers
        for (const offer of batchOffers) {
            await supabase.from('silent_coup_offers').update({ voided: true }).eq('id', offer.id);
        }

        await supabase.from('event_log').insert({
            nation_id: nation.id,
            event_name: 'Silent Coup Failed',
            description_chosen: 'The Security Services\' bid for power has been rejected. Their influence collapses.',
            category: 'POLITICAL',
            fired_at_tick: currentTick,
        });

        return {
            type: 'silent_coup_failed',
            path: 'A',
            votes: { coup: coupVotes, strongman: strongmanVotes },
            ss_backing_zeroed: true,
        };
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// SUCCESSION
// ═════════════════════════════════════════════════════════════════════════════

// ── Appoint Successor ────────────────────────────────────────────────────────
// Strongman designates a faction as successor. 0 AP. Can change at any time.

registerAutocracyAction('appoint_successor', {
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
        const { nation, factionState, extra } = ctx;
        const successorFactionId = extra?.successorFactionId;
        if (!successorFactionId) return { error: 'Must specify successorFactionId' };
        if (successorFactionId === factionState.faction_id) {
            return { error: 'Cannot designate yourself as successor' };
        }

        // Verify target is a valid faction in this nation
        const { data: targetFps } = await supabase.from('faction_pillar_state')
            .select('faction_id, pillar')
            .eq('faction_id', successorFactionId).eq('nation_id', nation.id).single();
        if (!targetFps) return { error: 'Target faction not found' };

        // Update nation-level designation
        await supabase.from('nations').update({
            designated_successor_faction_id: successorFactionId,
        }).eq('id', nation.id);

        // Also update on strongman's faction_pillar_state
        await supabase.from('faction_pillar_state').update({
            designated_successor_id: successorFactionId,
            updated_at: new Date().toISOString(),
        }).eq('id', factionState.id);

        return { effects: { successor_designated: successorFactionId } };
    },
});

// ── Revoke Successor ─────────────────────────────────────────────────────────
// Strongman removes the designated successor. 0 AP.

registerAutocracyAction('revoke_successor', {
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
        const { nation, factionState } = ctx;

        await supabase.from('nations').update({
            designated_successor_faction_id: null,
        }).eq('id', nation.id);

        await supabase.from('faction_pillar_state').update({
            designated_successor_id: null,
            updated_at: new Date().toISOString(),
        }).eq('id', factionState.id);

        return { effects: { successor_revoked: true } };
    },
});

// ═════════════════════════════════════════════════════════════════════════════
// SUCCESSION RESOLUTION (called from handler-template on strongman death)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Resolve Strongman death with V5 succession rules.
 *
 * WITH designated successor → successor takes power immediately.
 * WITHOUT successor → highest Backing faction auto-coup at +20 bonus.
 *   If that fails → Democratic Revolution check fires immediately.
 *
 * @returns {object} Result for summary logging.
 */
export async function resolveSuccession(supabase, nation, currentTick) {
    const nationId = nation.id;

    // Load pillar states
    const { data: allFps } = await supabase.from('faction_pillar_state')
        .select('*').eq('nation_id', nationId);
    if (!allFps || allFps.length === 0) return { type: 'succession_error', reason: 'no_factions' };

    const strongmanFps = allFps.find(r => r.is_strongman);
    const designatedSuccessorId = nation.designated_successor_faction_id;

    if (designatedSuccessorId) {
        // ── Successor takes power ──
        const successorFps = allFps.find(r => r.faction_id === designatedSuccessorId);
        if (!successorFps) {
            // Successor faction no longer exists — fall through to auto-coup
            return await resolveAutoCoup(supabase, nation, allFps, strongmanFps, currentTick);
        }

        // Transfer power
        if (strongmanFps) {
            await supabase.from('faction_pillar_state').update({
                is_strongman: false, updated_at: new Date().toISOString(),
            }).eq('id', strongmanFps.id);
        }
        await supabase.from('faction_pillar_state').update({
            is_strongman: true, updated_at: new Date().toISOString(),
        }).eq('id', successorFps.id);

        await supabase.from('nations').update({
            ruling_faction_id: designatedSuccessorId,
            designated_successor_faction_id: null,
        }).eq('id', nationId);

        await supabase.from('event_log').insert({
            nation_id: nationId,
            event_name: 'Succession — Designated Heir',
            description_chosen: 'The Strongman has died. The designated successor takes power.',
            category: 'POLITICAL',
            fired_at_tick: currentTick,
        });

        // Reset all leaders' escalations (new era)
        for (const fps of allFps) {
            await resetLeaderEscalations(supabase, fps.faction_id);
        }

        return {
            type: 'succession_designated',
            new_strongman_faction_id: designatedSuccessorId,
            new_strongman_pillar: successorFps.pillar,
        };
    }

    // ── No successor — auto-coup ──
    return await resolveAutoCoup(supabase, nation, allFps, strongmanFps, currentTick);
}

/**
 * Highest Backing non-Strongman faction attempts auto-coup at +20 bonus.
 * If fails → force Democratic Revolution check.
 */
async function resolveAutoCoup(supabase, nation, allFps, strongmanFps, currentTick) {
    const nationId = nation.id;

    // Find highest backing non-Strongman faction
    const candidates = allFps
        .filter(r => !r.is_strongman)
        .sort((a, b) => Number(b.backing) - Number(a.backing));

    if (candidates.length === 0) {
        return { type: 'succession_error', reason: 'no_candidates' };
    }

    const topCandidate = candidates[0];

    await supabase.from('event_log').insert({
        nation_id: nationId,
        event_name: 'Succession Crisis',
        description_chosen: 'The Strongman has died without a successor. The highest-ranking faction attempts to seize power.',
        category: 'POLITICAL',
        fired_at_tick: currentTick,
    });

    // Auto-coup with +20 bonus
    const result = await resolveStandardCoup(supabase, {
        nationId,
        factionId: topCandidate.faction_id,
        factionPillar: topCandidate.pillar,
        currentTick,
        rollBonus: 20,
        coupType: 'auto',
    });

    if (result.outcome === 'catastrophic' || result.outcome === 'failure') {
        // Auto-coup failed → force Democratic Revolution check
        // Set stats to trigger revolution immediately
        await supabase.from('nations').update({
            stability: Math.min(Number(nation.stability || 50), 15),
            civil_unrest: Math.max(Number(nation.civil_unrest || 0), 55),
        }).eq('id', nationId);

        await supabase.from('event_log').insert({
            nation_id: nationId,
            event_name: 'Power Vacuum',
            description_chosen: 'The succession has failed. The nation teeters on the brink of democratic revolution.',
            category: 'POLITICAL',
            fired_at_tick: currentTick,
        });

        return {
            type: 'succession_auto_coup_failed',
            coup_outcome: result.outcome,
            revolution_conditions_forced: true,
        };
    }

    return {
        type: 'succession_auto_coup_success',
        coup_outcome: result.outcome,
        new_strongman_faction_id: topCandidate.faction_id,
    };
}

/**
 * Process pillar leader aging for autocracy factions.
 * Each pillar leader ages +1 year per 12 ticks.
 * Leaders who reach their death_age die — pillar becomes wildcard,
 * escalations reset.
 */
export async function processAutocracyLeaderAging(supabase, nation, currentTick) {
    if (currentTick % 12 !== 0) return null;

    const { data: allFps } = await supabase.from('faction_pillar_state')
        .select('*').eq('nation_id', nation.id);
    if (!allFps) return null;

    const results = [];

    for (const fps of allFps) {
        if (!fps.leader_age || fps.is_strongman) continue; // Strongman ages via HOS system

        const newAge = fps.leader_age + 1;
        await supabase.from('faction_pillar_state').update({
            leader_age: newAge,
            updated_at: new Date().toISOString(),
        }).eq('id', fps.id);

        // Check if leader has reached death age
        if (fps.death_age && newAge >= fps.death_age) {
            // Leader dies of natural causes
            // Pillar becomes wildcard
            const { data: tracker } = await supabase.from('autocracy_tracker')
                .select('*').eq('nation_id', nation.id).single();

            if (tracker) {
                await supabase.from('autocracy_tracker').update({
                    wildcard_pillar: fps.pillar,
                    wildcard_backing: Number(fps.backing),
                    wildcard_neglect_ticks: 0,
                }).eq('nation_id', nation.id);
            }

            await supabase.from('faction_pillar_state').update({
                leader_name: null, leader_age: null, death_age: null,
                arrested_leader: false,
                updated_at: new Date().toISOString(),
            }).eq('id', fps.id);

            await resetLeaderEscalations(supabase, fps.faction_id);

            await supabase.from('event_log').insert({
                nation_id: nation.id,
                event_name: 'Pillar Leader Death',
                description_chosen: `${fps.leader_name || 'A faction leader'} has died at age ${newAge}. Their pillar is now unclaimed.`,
                category: 'POLITICAL',
                fired_at_tick: currentTick,
            });

            results.push({
                type: 'pillar_leader_death',
                faction_id: fps.faction_id,
                pillar: fps.pillar,
                leader_name: fps.leader_name,
                age: newAge,
            });
        } else {
            results.push({
                type: 'pillar_leader_aged',
                faction_id: fps.faction_id,
                new_age: newAge,
            });
        }
    }

    return results.length > 0 ? results : null;
}
