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
    MAX_AP: 20,  // maximum action points a party can accumulate
    TICKS_PER_YEAR: 12,
    // (Budget bill system removed)
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

    // ── Autocracy v2 Faction Actions ──
    PLEDGE_ALLEGIANCE_AP: 2,
    PLEDGE_ALLEGIANCE_LOYALTY: 8,
    PLEDGE_ALLEGIANCE_STANDING: -2,
    PLEDGE_ALLEGIANCE_COMPLY_LOYALTY: 13,     // when under Demand Loyalty order
    PLEDGE_ALLEGIANCE_COMPLY_STANDING: -3,
    PLEDGE_ALLEGIANCE_STANDING_FLOOR: 5,      // standing cannot drop below this from pledging

    CONSOLIDATE_POWER_AP: 2,
    CONSOLIDATE_POWER_STANDING: 6,
    CONSOLIDATE_POWER_LOYALTY: -3,

    DEMONSTRATE_COMPETENCE_AP: 3,
    DEMONSTRATE_COMPETENCE_STANDING: 4,
    DEMONSTRATE_COMPETENCE_LOYALTY: 3,
    DEMONSTRATE_COMPETENCE_COST: 2,           // $2M from embezzled funds
    DEMONSTRATE_COMPETENCE_NATION_STAT: 0.3,
    DEMONSTRATE_COMPETENCE_REDUCED_STANDING: 2, // when can't afford cost

    EMBEZZLE_FUNDS_AP: 1,
    EMBEZZLE_FUNDS_LOYALTY: -5,
    EMBEZZLE_FUNDS_BASE_INCOME: 5,            // $5M base
    EMBEZZLE_FUNDS_INCOME_FLOOR: 3,           // $3M minimum
    EMBEZZLE_FUNDS_BASE_DETECTION: 0.10,      // 10% base
    EMBEZZLE_FUNDS_CONSECUTIVE_BONUS: 0.05,   // +5% per consecutive tick
    EMBEZZLE_FUNDS_DETECTION_FLOOR: 0.03,     // 3% minimum
    EMBEZZLE_FUNDS_DETECTION_CAP: 0.50,       // 50% maximum
    EMBEZZLE_FUNDS_DETECTED_LOYALTY: -15,
    EMBEZZLE_FUNDS_DETECTED_STANDING: -10,
    EMBEZZLE_FUNDS_DETECTED_FUNDS_SEIZURE: 0.30, // 30% seized

    BUY_INFLUENCE_AP: 3,
    BUY_INFLUENCE_STANDING: -1,
    BUY_INFLUENCE_BASE_COST: 3,               // $3M per seat base
    BUY_INFLUENCE_UNALIGNED_COST: 2,          // $2M per seat from unaligned pool
    BUY_INFLUENCE_VULNERABILITY_DISCOUNT: 0.20, // 20% cheaper vs demonstrating faction
    BUY_INFLUENCE_STRONGMAN_BASE_COST: 5,      // $5M per seat base when targeting ruling faction
    BUY_INFLUENCE_STRONGMAN_HEALTH_SCALE: 0.02, // multiplier per regime_health point (0-100)

    INTIMIDATE_AP: 2,
    INTIMIDATE_COST: 1,                        // $1M flat
    INTIMIDATE_LOYALTY: -4,
    INTIMIDATE_STANDING: 2,
    INTIMIDATE_STABILITY: -0.2,
    INTIMIDATE_BASE_EFFECTIVENESS: 4,
    INTIMIDATE_MIN_SEATS: 5,
    INTIMIDATE_VULNERABILITY_BONUS: 0.25,      // 25% more effective vs demonstrating
    INTIMIDATE_FAIL_STANDING: -3,
    INTIMIDATE_REPORT_LOYALTY: -8,
    INTIMIDATE_REPORT_STANDING: -3,
    INTIMIDATE_REPORTER_LOYALTY: 3,
    INTIMIDATE_RETALIATE_COST: 1,              // $1M
    INTIMIDATE_RETALIATE_STANDING: -2,
    INTIMIDATE_RETALIATE_SEATS: -2,
    INTIMIDATE_RETALIATOR_LOYALTY: -2,

    PURGE_AP: 3,
    PURGE_LOYALTY_THRESHOLD: 20,
    PURGE_TARGET_STANDING: -20,
    PURGE_TARGET_SEAT_LOSS: 0.30,             // 30% lost
    PURGE_TARGET_NEW_LOYALTY: 50,
    PURGE_OTHERS_LOYALTY: 5,
    PURGE_REGIME_HEALTH: -3,
    PURGE_STABILITY: -1,
    PURGE_COUP_LOCKOUT_TICKS: 6,

    REDISTRIBUTE_SEATS_AP: 2,
    REDISTRIBUTE_SEATS_COOLDOWN: 4,
    REDISTRIBUTE_SEATS_MAX_RATIO: 0.30,       // max 30% of loser's seats
    REDISTRIBUTE_SEATS_LOSER_STANDING: -3,
    REDISTRIBUTE_SEATS_LOSER_LOYALTY: -5,
    REDISTRIBUTE_SEATS_GAINER_LOYALTY: 5,

    COUP_MIN_STANDING: 15,
    COUP_MIN_SEAT_RATIO: 0.10,               // 10% of legislature
    COUP_FUNDS_THRESHOLD: 30,                  // $30M
    COUP_LOCKOUT_TICKS: 6,

    STANDING_CAP: 90,
    LOYALTY_CAP: 95,
    STANDING_RELEVANCE_DECAY_TICKS: 3,
    UNALIGNED_POOL_REGEN_TICKS: 4,            // +1 seat per 4 ticks
    UNALIGNED_POOL_MAX_RATIO: 0.10,           // max 10% of legislature
    NEW_FACTION_MIN_SEATS: 8,

    // ── Caucus System ──
    CAUCUS_THRESHOLD: 0.50,               // seat share to activate caucuses
    CAUCUS_WHIP_AP_COST: 1,               // base AP cost to whip a nervous faction

    // ── Head of State Title (Foundational) ──
    HOS_TITLE_OPTIONS: ['President', 'Chancellor', 'Premier', 'Consul', 'First Consul', 'Director', 'General Secretary', 'Chairman', 'Protector', 'Tribune'],
    HOS_TITLE_COOLDOWN_TICKS: 240,

    // ── Presidential Term Length (Foundational) ──
    TERM_LENGTH_OPTIONS: [24, 36, 48, 60, 72, 84],  // ticks: 2yr, 3yr, 4yr, 5yr, 6yr, 7yr
    TERM_LENGTH_COOLDOWN_TICKS: 120,
    TERM_LENGTH_DEFER_WINDOW: 10,  // if election is within this many ticks, defer to next cycle

    // ── Presidential Term Limits (Foundational) ──
    TERM_LIMIT_OPTIONS: [0, 1, 2, 3, 4],  // 0 = no limits
    TERM_LIMIT_COOLDOWN_TICKS: 240,
};

export const ENDORSEMENT_SWITCH_WINDOW_TICKS = 6;
export const ENDORSEMENT_SWITCH_WINDOW_ERROR = `Endorsements can only be changed in the last ${ENDORSEMENT_SWITCH_WINDOW_TICKS} ticks before a presidential election.`;

export function isEndorsementSwitchWindowOpen(currentTick, nextPresidentialTick) {
    if (!Number.isFinite(currentTick) || !Number.isFinite(nextPresidentialTick)) return false;
    const ticksUntilElection = nextPresidentialTick - currentTick;
    return ticksUntilElection >= 1 && ticksUntilElection <= ENDORSEMENT_SWITCH_WINDOW_TICKS;
}
/**
 * Update GAME_CONFIG with nation-specific seat values.
 * Call after loading the nation on each page.
 *
 * Always resets to defaults (120) when nation data is missing, so that
 * sequential multi-nation tick processing never leaks one nation's seat
 * count into the next nation's calculations.
 */
/**
 * Get the effective presidential term length (in ticks) for a nation.
 * Uses nation-specific override if set, otherwise falls back to GAME_CONFIG default.
 */
export function getPresidentialTermTicks(nation) {
    if (nation && nation.presidential_term_ticks != null && nation.presidential_term_ticks > 0) {
        return nation.presidential_term_ticks;
    }
    return GAME_CONFIG.PRESIDENTIAL_TERM_TICKS;
}

/**
 * Get the effective presidential term limit for a nation.
 * Uses nation-specific override if set (including 0 for no limits),
 * otherwise falls back to GAME_CONFIG default.
 * Returns null if no limits (0 stored or explicitly set to unlimited).
 */
export function getPresidentialTermLimit(nation) {
    if (nation && nation.presidential_term_limit !== null && nation.presidential_term_limit !== undefined) {
        return nation.presidential_term_limit === 0 ? null : nation.presidential_term_limit;
    }
    return GAME_CONFIG.PRESIDENTIAL_TERM_LIMIT;
}

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

/**
 * Atomically switch a party endorsement target.
 *
 * Server-side RPC behavior:
 * - Reads the existing endorsement preference
 * - Deducts 1 AP only if switching from an existing different target
 * - Upserts the preference row
 *
 * Returns { success: true, newAp, endorsedPartyId } on success.
 */
export async function switchPartyEndorsement(supabase, endorsingPartyId, newEndorsedPartyId, currentTick) {
    const { data, error } = await supabase.rpc('switch_party_endorsement', {
        endorsing_party_id: endorsingPartyId,
        new_endorsed_party_id: newEndorsedPartyId,
        current_tick: currentTick
    });

    if (error) {
        console.error('[switchPartyEndorsement] RPC failed:', error.message);
        const rpcMessage = String(error.message || '');
        if (rpcMessage.includes('last 6 ticks before a presidential election')) {
            return { success: false, error: ENDORSEMENT_SWITCH_WINDOW_ERROR };
        }
        return { success: false, error: error.message };
    }

    const row = Array.isArray(data) ? data[0] : data;
    return {
        success: true,
        newAp: row?.updated_ap,
        endorsedPartyId: row?.endorsed_party_id
    };
}
