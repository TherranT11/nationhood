/**
 * autocracy-pillars.js — Five Pillars system: Backing, zero-sum enforcement,
 * passive drift, wildcard decay, longevity tracking, Power calculation,
 * tracker contributions, and tracker natural decay.
 *
 * V5 Autocracy System — Phases 2 & 3
 */

import { isAutocracy } from './government-types.js';

// ─── Pillar definitions ──────────────────────────────────────────────────────

export const PILLAR_KEYS = ['military', 'party', 'oligarchs', 'media', 'security'];

/**
 * Passive drift conditions: each pillar checks two national stats.
 * If the condition is met, that pillar gains +1 Backing.
 * Thresholds: LOW = ≤ 20, HIGH = ≥ 70.
 */
export const PASSIVE_DRIFT_CONDITIONS = {
    military: [
        { stat: 'civil_unrest', op: '<=', threshold: 20 },
        { stat: 'crime_rate',   op: '<=', threshold: 20 },
    ],
    oligarchs: [
        { stat: 'gdp_growth',  op: '>=', threshold: 70 },
        { stat: 'corruption',  op: '>=', threshold: 70 },
    ],
    party: [
        { stat: 'stability',    op: '>=', threshold: 70 },
        { stat: 'polarization', op: '>=', threshold: 70 },
    ],
    media: [
        { stat: 'press_freedom', op: '<=', threshold: 20 },
        { stat: 'legitimacy',    op: '>=', threshold: 70 },
    ],
    security: [
        { stat: 'crime_rate',    op: '<=', threshold: 20 },
        { stat: 'freedom_index', op: '<=', threshold: 20 },
    ],
};

const WILDCARD_DECAY_RATE = 0.1;
const NEGLECT_THRESHOLD = 3;      // backing ≤ 3
const NEGLECT_TICKS_REQUIRED = 5; // consecutive ticks before extra decay
const NEGLECT_EXTRA_DECAY = 1;    // additional backing lost per tick once neglected

// ─── Zero-sum enforcement ────────────────────────────────────────────────────

/**
 * Apply a backing delta to a single pillar, then redistribute the inverse
 * proportionally across all other non-wildcard pillars.
 *
 * @param {Object[]} pillarStates - array of { pillar, backing } for all 4 claimed pillars
 * @param {Object} wildcardState  - { backing } for the wildcard pillar
 * @param {string} targetPillar   - pillar key receiving the delta
 * @param {number} delta          - positive or negative change
 * @param {boolean} isWildcard    - true if target is the wildcard pillar
 * @returns {{ pillarStates: Object[], wildcardState: Object }} — mutated in place and returned
 */
export function applyBackingDelta(pillarStates, wildcardState, targetPillar, delta, isWildcard = false) {
    if (delta === 0) return { pillarStates, wildcardState };

    if (isWildcard) {
        // Direct wildcard change — no redistribution needed for decay
        const oldBacking = wildcardState.backing;
        wildcardState.backing = clampBacking(oldBacking + delta);
        return { pillarStates, wildcardState };
    }

    // Find the target pillar
    const target = pillarStates.find(p => p.pillar === targetPillar);
    if (!target) return { pillarStates, wildcardState };

    // Apply delta to target
    const oldTarget = target.backing;
    target.backing = clampBacking(oldTarget + delta);
    const actualDelta = target.backing - oldTarget;

    if (actualDelta === 0) return { pillarStates, wildcardState };

    // Distribute inverse delta proportionally across other claimed pillars
    const others = pillarStates.filter(p => p.pillar !== targetPillar);
    const totalOtherBacking = others.reduce((sum, p) => sum + p.backing, 0);

    if (totalOtherBacking > 0) {
        const inverseDelta = -actualDelta;
        let remaining = inverseDelta;

        for (let i = 0; i < others.length; i++) {
            const p = others[i];
            if (i === others.length - 1) {
                // Last one absorbs rounding remainder
                const oldVal = p.backing;
                p.backing = clampBacking(oldVal + remaining);
                remaining -= (p.backing - oldVal);
            } else {
                const share = (p.backing / totalOtherBacking) * inverseDelta;
                const rounded = Math.round(share * 100) / 100;
                const oldVal = p.backing;
                p.backing = clampBacking(oldVal + rounded);
                remaining -= (p.backing - oldVal);
            }
        }
    }

    return { pillarStates, wildcardState };
}

function clampBacking(val) {
    return Math.max(0, Math.min(20, Math.round(val * 100) / 100));
}

// ─── Passive drift ───────────────────────────────────────────────────────────

/**
 * Compute which pillars gain +1 backing from national stat conditions.
 * Returns an array of pillar keys that should receive +1.
 */
export function computePassiveDrift(nation) {
    const drifts = [];

    for (const [pillar, conditions] of Object.entries(PASSIVE_DRIFT_CONDITIONS)) {
        for (const cond of conditions) {
            const statVal = Number(nation[cond.stat] ?? 50);
            const met = cond.op === '<=' ? statVal <= cond.threshold : statVal >= cond.threshold;
            if (met) {
                drifts.push(pillar);
            }
        }
    }

    return drifts;
}

// ─── Main tick processor ─────────────────────────────────────────────────────

/**
 * Process autocracy pillar/backing for a single nation each tick.
 * Tick order step 1: Passive drift → Wildcard decay → Neglect check.
 *
 * @param {Object} supabase - Supabase client
 * @param {Object} nation   - nation row (must have stat columns)
 * @param {number} currentTick
 * @returns {Object|null} summary of changes, or null if no autocracy state
 */
export async function processAutocracyPillarTick(supabase, nation, currentTick) {
    if (!isAutocracy(nation)) return null;

    // ── Load state ──────────────────────────────────────────────────────
    const { data: tracker, error: trackerErr } = await supabase
        .from('autocracy_tracker')
        .select('*')
        .eq('nation_id', nation.id)
        .single();

    if (trackerErr || !tracker) {
        console.warn(`[pillarTick] No autocracy_tracker for ${nation.name}, skipping.`);
        return null;
    }

    const { data: factionStates, error: fpsErr } = await supabase
        .from('faction_pillar_state')
        .select('*')
        .eq('nation_id', nation.id);

    if (fpsErr || !factionStates || factionStates.length === 0) {
        console.warn(`[pillarTick] No faction_pillar_state for ${nation.name}, skipping.`);
        return null;
    }

    // Build working copies (numeric backing)
    const pillarStates = factionStates.map(fps => ({
        id: fps.id,
        faction_id: fps.faction_id,
        pillar: fps.pillar,
        backing: Number(fps.backing),
        is_strongman: fps.is_strongman,
        neglect_ticks: fps.neglect_ticks || 0,
        longevity_ticks: fps.longevity_ticks || 0,
    }));

    const wildcardState = {
        pillar: tracker.wildcard_pillar,
        backing: Number(tracker.wildcard_backing),
        neglect_ticks: tracker.wildcard_neglect_ticks || 0,
    };

    const changes = [];

    // ── Step 1a: Passive drift ──────────────────────────────────────────
    const drifts = computePassiveDrift(nation);
    for (const driftPillar of drifts) {
        const isWildcard = driftPillar === wildcardState.pillar;
        applyBackingDelta(pillarStates, wildcardState, driftPillar, 1, isWildcard);
        changes.push({ type: 'drift', pillar: driftPillar, delta: 1 });
    }

    // ── Step 1b: Wildcard decay (-0.1 per tick, floor 0) ────────────────
    if (wildcardState.pillar && wildcardState.backing > 0) {
        const oldWc = wildcardState.backing;
        wildcardState.backing = Math.max(0, Math.round((oldWc - WILDCARD_DECAY_RATE) * 100) / 100);
        if (wildcardState.backing !== oldWc) {
            changes.push({ type: 'wildcard_decay', pillar: wildcardState.pillar, oldBacking: oldWc, newBacking: wildcardState.backing });
        }
    }

    // ── Step 1c: Neglect check (backing ≤ 3 for 5+ consecutive ticks) ──
    for (const ps of pillarStates) {
        if (ps.backing <= NEGLECT_THRESHOLD) {
            ps.neglect_ticks += 1;
            if (ps.neglect_ticks >= NEGLECT_TICKS_REQUIRED) {
                applyBackingDelta(pillarStates, wildcardState, ps.pillar, -NEGLECT_EXTRA_DECAY, false);
                changes.push({ type: 'neglect', pillar: ps.pillar, neglect_ticks: ps.neglect_ticks });
            }
        } else {
            ps.neglect_ticks = 0;
        }
    }

    // Wildcard neglect
    if (wildcardState.backing <= NEGLECT_THRESHOLD) {
        wildcardState.neglect_ticks += 1;
        if (wildcardState.neglect_ticks >= NEGLECT_TICKS_REQUIRED) {
            wildcardState.backing = Math.max(0, Math.round((wildcardState.backing - NEGLECT_EXTRA_DECAY) * 100) / 100);
            changes.push({ type: 'neglect', pillar: wildcardState.pillar, neglect_ticks: wildcardState.neglect_ticks });
        }
    } else {
        wildcardState.neglect_ticks = 0;
    }

    // ── Step 1d: Longevity increment ────────────────────────────────────
    for (const ps of pillarStates) {
        ps.longevity_ticks += 1;
    }

    // ── Persist ─────────────────────────────────────────────────────────

    // Update each faction_pillar_state row
    for (const ps of pillarStates) {
        const { error: updateErr } = await supabase
            .from('faction_pillar_state')
            .update({
                backing: ps.backing,
                neglect_ticks: ps.neglect_ticks,
                longevity_ticks: ps.longevity_ticks,
                updated_at: new Date().toISOString(),
            })
            .eq('id', ps.id);

        if (updateErr) {
            console.error(`[pillarTick] Failed to update faction_pillar_state ${ps.id}:`, updateErr.message);
        }
    }

    // Update autocracy_tracker (wildcard + tick)
    const { error: trackerUpdateErr } = await supabase
        .from('autocracy_tracker')
        .update({
            wildcard_backing: wildcardState.backing,
            wildcard_neglect_ticks: wildcardState.neglect_ticks,
            last_updated_tick: currentTick,
        })
        .eq('nation_id', nation.id);

    if (trackerUpdateErr) {
        console.error(`[pillarTick] Failed to update autocracy_tracker for ${nation.name}:`, trackerUpdateErr.message);
    }

    if (changes.length > 0) {
        console.log(`[pillarTick] ${nation.name}: ${changes.length} changes — ${JSON.stringify(changes)}`);
    }

    return changes.length > 0 ? { nation: nation.name, tick: currentTick, changes } : null;
}

// ─── Power calculation (server-side only) ────────────────────────────────────

/**
 * Power → Tracker delta magnitude map.
 * Power 1 → ±2, Power 2 → ±3, Power 3 → ±4, Power 4 → ±5, Power 5 → ±7.
 */
export const POWER_DELTA_MAP = { 1: 2, 2: 3, 3: 4, 4: 5, 5: 7 };

/**
 * Compute a faction's Power level (1–5). Never exposed to client.
 *
 * Formula:
 *   base = CEIL(backing / 4)
 *   if is_prime_minister: base += 1
 *   base += FLOOR(minister_count / 2)
 *   if longevity_ticks >= 36: base += 1
 *   power = CLAMP(base, 1, 5)
 *
 * @param {Object} factionState - faction_pillar_state row (or working copy)
 * @returns {number} power level 1–5
 */
export function computeFactionPower(factionState) {
    let base = Math.ceil(Number(factionState.backing) / 4);
    if (factionState.is_prime_minister) base += 1;
    base += Math.floor((factionState.minister_count || 0) / 2);
    if ((factionState.longevity_ticks || 0) >= 36) base += 1;
    return Math.max(1, Math.min(5, base));
}

/**
 * Get the tracker delta magnitude for a given power level.
 * @param {number} power - 1 to 5
 * @returns {number} delta magnitude
 */
export function getPowerDelta(power) {
    return POWER_DELTA_MAP[power] || 0;
}

// ─── Tracker contributions ───────────────────────────────────────────────────

/**
 * Actions that contribute at half power when used FOR_REGIME.
 */
const HALF_POWER_ACTIONS = ['agitate', 'capital_flight'];

/**
 * Apply a tracker contribution from a faction action.
 *
 * Rules:
 *   - Strongman using foundation pillar actions: skip entirely (no tracker movement)
 *   - FOR_REGIME: tracker -= delta
 *   - FOR_YOURSELF: tracker += delta
 *   - AGITATE / CAPITAL_FLIGHT in FOR_REGIME mode: delta = floor(delta / 2)
 *   - Stand Down: always FOR_YOURSELF (no mode toggle)
 *
 * @param {number} currentTracker - current tracker_value (0–100)
 * @param {Object} factionState   - faction_pillar_state row
 * @param {string} actionType     - action key (e.g. 'deploy', 'rally')
 * @param {string} mode           - 'regime' or 'self'
 * @param {string|null} strongmanPillar - the strongman's foundation pillar (to detect no-op)
 * @returns {number} new tracker value (clamped 0–100)
 */
export function applyTrackerContribution(currentTracker, factionState, actionType, mode, strongmanPillar) {
    // Strongman using their own foundation pillar actions → no tracker movement
    if (factionState.is_strongman && factionState.pillar === strongmanPillar) {
        return currentTracker;
    }

    const power = computeFactionPower(factionState);
    let delta = getPowerDelta(power);

    // Half power for specific actions in FOR_REGIME mode
    if (mode === 'regime' && HALF_POWER_ACTIONS.includes(actionType)) {
        delta = Math.floor(delta / 2);
    }

    // Apply direction
    if (mode === 'regime') {
        currentTracker -= delta;
    } else {
        // 'self' — includes stand_down which is always for yourself
        currentTracker += delta;
    }

    return Math.max(0, Math.min(100, currentTracker));
}

// ─── Tracker natural decay ───────────────────────────────────────────────────

/**
 * Apply natural tracker decay toward 30.
 * Runs after all actions resolve each tick.
 *
 *   if tracker > 30: tracker -= 1 (floor 30)
 *   if tracker < 30: tracker += 1 (ceiling 30)
 *
 * @param {number} trackerValue - current tracker (0–100)
 * @returns {number} decayed tracker value
 */
export function applyTrackerDecay(trackerValue) {
    if (trackerValue > 30) return Math.max(30, trackerValue - 1);
    if (trackerValue < 30) return Math.min(30, trackerValue + 1);
    return 30;
}

// ─── Tracker word (Strongman-only display) ───────────────────────────────────

/**
 * Map tracker value to the word the Strongman sees.
 *   0–20  → IRON
 *   21–40 → FIRM
 *   41–60 → RESTLESS
 *   61–80 → VOLATILE
 *   81–100→ CRITICAL
 *
 * @param {number} trackerValue
 * @returns {string}
 */
export function getTrackerWord(trackerValue) {
    if (trackerValue <= 20) return 'IRON';
    if (trackerValue <= 40) return 'FIRM';
    if (trackerValue <= 60) return 'RESTLESS';
    if (trackerValue <= 80) return 'VOLATILE';
    return 'CRITICAL';
}

// ─── Tracker reset values ────────────────────────────────────────────────────

export const TRACKER_RESET = Object.freeze({
    AFTER_FAILED_COUP: 10,     // catastrophic or failure
    AFTER_SUCCESSFUL_COUP: 30, // pyrrhic, clean, or dominant
});

// ─── Tracker tick processor ──────────────────────────────────────────────────

/**
 * Process tracker natural decay for a single autocracy nation.
 * Tick order step 3: runs after all actions resolve.
 *
 * @param {Object} supabase
 * @param {Object} nation
 * @param {number} currentTick
 * @returns {Object|null} change summary or null
 */
export async function processAutocracyTrackerDecay(supabase, nation, currentTick) {
    if (!isAutocracy(nation)) return null;

    const { data: tracker, error: trackerErr } = await supabase
        .from('autocracy_tracker')
        .select('tracker_value, nation_id')
        .eq('nation_id', nation.id)
        .single();

    if (trackerErr || !tracker) return null;

    const oldValue = tracker.tracker_value;
    const newValue = applyTrackerDecay(oldValue);

    if (newValue === oldValue) return null;

    const { error: updateErr } = await supabase
        .from('autocracy_tracker')
        .update({
            tracker_value: newValue,
            last_updated_tick: currentTick,
        })
        .eq('nation_id', nation.id);

    if (updateErr) {
        console.error(`[trackerDecay] Failed to update tracker for ${nation.name}:`, updateErr.message);
        return null;
    }

    console.log(`[trackerDecay] ${nation.name}: ${oldValue} → ${newValue}`);

    // 1d3 roll: on a 3, sync public_tracker_value to actual tracker_value
    const roll = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3
    if (roll === 3) {
        await supabase.from('autocracy_tracker').update({
            public_tracker_value: newValue,
        }).eq('nation_id', nation.id);
        console.log(`[trackerDecay] ${nation.name}: public tracker synced → ${newValue} (rolled ${roll})`);
    } else {
        console.log(`[trackerDecay] ${nation.name}: public tracker unchanged (rolled ${roll})`);
    }

    return { nation: nation.name, tick: currentTick, oldTracker: oldValue, newTracker: newValue };
}
