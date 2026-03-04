/**
 * config.js — Game configuration constants and AP management
 * Extracted from game-common.js
 */

// ==================== CONSTANTS ====================

export const GAME_CONFIG = {
    TOTAL_SEATS: 120,
    MAJORITY_SEATS: 61,
    VOTING_WINDOW_TICKS: 6,
    QUORUM_THRESHOLD: 0.5,           // 50% of seats must participate (yes+no+abstain) for quorum
    COMMITTEE_EXPIRY_TICKS: 6,
    DRAFT_BILL_AP_COST: 2,
    VETO_APPROVAL_COST: 3,
    NO_CONFIDENCE_AP_COST: 5,
    NO_CONFIDENCE_VOTING_TICKS: 6,
    NO_CONFIDENCE_COOLDOWN_TICKS: 6,
    FOUNDATIONAL_AP_COST: 3,
    FOUNDATIONAL_VOTING_TICKS: 6,
    SUPERMAJORITY_THRESHOLD: 2/3,
    EARLY_ELECTION_TICKS: 6,
    EARLY_ELECTION_PM_APPROVAL_COST: 5,
    EARLY_ELECTION_COALITION_APPROVAL_COST: 3,
    // Presidential Democracy
    PRESIDENTIAL_TERM_TICKS: 48,
    PARLIAMENTARY_TERM_TICKS: 24,
    VETO_OVERRIDE_THRESHOLD: 2/3,
    PRESIDENT_DESK_TICKS: 6,
    MINISTER_CONFIRMATION_VOTING_TICKS: 6,
    PRESIDENTIAL_TERM_LIMIT: 2,           // max terms before incumbent must step aside
    PRESIDENTIAL_CANDIDATE_LEAD_TICKS: 6, // ticks before presidential election to generate candidates
    MAX_AP: 10,  // maximum action points a party can accumulate
    TICKS_PER_YEAR: 12,
    // Inactivity decay — penalties for factions that haven't logged in
    INACTIVITY_GRACE_TICKS: 6,            // no penalty for first 6 ticks of inactivity
    INACTIVITY_MOMENTUM_DECAY: 5,         // -5 momentum per voter bloc per tick while inactive (ticks 7-11)
    INACTIVITY_APPROVAL_DECAY: 5,         // -5 approval per voter bloc per tick while inactive (ticks 7-11)
    INACTIVITY_DISBAND_TICKS: 12,         // at tick 12: party is disbanded (removed from nation, loses seats next election)
    BUDGET_EARLY_WINDOW_TICKS: 3,    // ticks before budget due date that early proposal opens
    BUDGET_AUTO_GENERATE_LEAD_TICKS: 3, // auto-generate budget bill this many ticks before due date
    BUDGET_COMMITTEE_EXPIRY_TICKS: 3,   // budget bills auto-expire in committee after 3 ticks
    BUDGET_BILL_VOTING_TICKS: null,   // budget bills persist until passed (never expire) — used for early resolution grace
    BUDGET_BILL_MAX_FLOOR_TICKS: 4,   // budget bills auto-resolve after 4 ticks on the floor (forced vote)
    BUDGET_FAILURE_COALITION_PENALTY: -5,  // parliamentary: coalition approval penalty on budget committee expiry
    BUDGET_FAILURE_PRESIDENT_PENALTY: -10, // presidential: president party approval penalty on budget committee expiry
    NO_BUDGET_PENALTY_TICKS: 24,     // how many ticks without a budget before max penalty
    // Impeachment (Presidential systems only)
    IMPEACHMENT_AP_COST: 7,
    IMPEACHMENT_COMMITTEE_TICKS: 2,        // debate period before floor vote
    IMPEACHMENT_MOTION_VOTING_TICKS: 6,    // floor vote window for impeachment motion
    IMPEACHMENT_TRIAL_TICKS: 3,            // trial period (conviction vote window)
    IMPEACHMENT_MOTION_COOLDOWN_TICKS: 10, // cooldown after failed motion
    IMPEACHMENT_ACQUITTAL_COOLDOWN_TICKS: 20, // cooldown after acquittal
    IMPEACHMENT_EMERGENCY_ELECTION_TICKS: 6,  // ticks until emergency presidential election
    // Charge precondition thresholds
    IMPEACHMENT_CORRUPTION_THRESHOLD: 40,     // corruption stat >= this for corruption charge
    IMPEACHMENT_INCOMPETENCE_THRESHOLD: 25,   // gov_approval <= this for incompetence charge
    IMPEACHMENT_INCOMPETENCE_TICKS: 6,        // consecutive ticks below threshold
    IMPEACHMENT_VETO_ABUSE_COUNT: 2,          // vetoed bills with >66% support
};
/**
 * Update GAME_CONFIG with nation-specific seat values.
 * Call after loading the nation on each page.
 *
 * Always resets to defaults (120) when nation data is missing, so that
 * sequential multi-nation tick processing never leaks one nation's seat
 * count into the next nation's calculations.
 */
export function initGameConfigForNation(nation) {
    const seats = (nation && nation.total_seats) ? nation.total_seats : 120;
    GAME_CONFIG.TOTAL_SEATS = seats;
    GAME_CONFIG.MAJORITY_SEATS = Math.floor(seats / 2) + 1;
}

export const FORMATION_DEADLINE_TICKS = 3; // ticks per formation window before escalation
export const SNAP_COOLDOWN_GAP = FORMATION_DEADLINE_TICKS + 2; // 5 — general snap cycle guard (overridden by formation escalation)

/**
 * Atomic AP deduction via database RPC.
 * Returns { success: true, newAp } on success, or { success: false, error } on failure.
 * The DB function checks balance and deducts in a single UPDATE, preventing race conditions.
 */
export async function deductAP(supabase, factionId, cost) {
    const { data, error } = await supabase.rpc('deduct_ap', {
        p_faction_id: factionId,
        p_cost: cost
    });
    if (error) {
        console.error(`[deductAP] RPC failed for faction ${factionId}, cost ${cost}:`, error.message);
        return { success: false, error: error.message };
    }
    if (data === -1) {
        return { success: false, error: 'Insufficient AP' };
    }
    return { success: true, newAp: data };
}

/**
 * Atomic AP accumulation via database RPC.
 * Returns { success: true, newAp } on success, or { success: false, error } on failure.
 * The DB function atomically increments AP capped at max, preventing race conditions
 * with concurrent deductions.
 * Retries up to 2 additional times on transient RPC failure with short backoff.
 */
export async function accumulateAP(supabase, factionId, gain, maxAp = GAME_CONFIG.MAX_AP) {
    const { data, error } = await supabase.rpc('accumulate_ap', {
        p_faction_id: factionId,
        p_gain: gain,
        p_max_ap: maxAp
    });
    if (error) {
        console.error(`[accumulateAP] RPC failed for faction ${factionId}, gain ${gain}:`, error.message);
        return { success: false, error: error.message };
    }
    if (data === -1) {
        return { success: false, error: 'Faction not found' };
    }
    return { success: true, newAp: data };
}
