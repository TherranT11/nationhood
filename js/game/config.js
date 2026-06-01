/**
 * config.js — Game configuration constants
 * Extracted from game-common.js
 */

// ==================== CONSTANTS ====================

export const GAME_CONFIG = {
    TOTAL_SEATS: 120,
    MAJORITY_SEATS: 61,
    VOTING_WINDOW_TICKS: 6,
    QUORUM_THRESHOLD: 0.5,           // 50% of seats must participate (yes+no+abstain) for quorum
    COMMITTEE_EXPIRY_TICKS: 6,
    VETO_APPROVAL_COST: 3,
    NO_CONFIDENCE_VOTING_TICKS: 6,
    NO_CONFIDENCE_COOLDOWN_TICKS: 12,         // 12-tick cooldown per TARGETED PM party (was 6 on caller)
    FOUNDATIONAL_VOTING_TICKS: 6,
    SUPERMAJORITY_THRESHOLD: 2/3,
    EARLY_ELECTION_TICKS: 0,
    EARLY_ELECTION_PM_APPROVAL_COST: 5,
    EARLY_ELECTION_COALITION_APPROVAL_COST: 3,
    // Presidential Democracy
    PRESIDENTIAL_TERM_TICKS: 48,
    PARLIAMENTARY_TERM_TICKS: 24,
    VETO_OVERRIDE_THRESHOLD: 2/3,
    PRESIDENT_DESK_TICKS: 6,
    ROYAL_ASSENT_TICKS: 6,                // mirrors PRESIDENT_DESK_TICKS — auto-enact on timeout
    MINISTER_CONFIRMATION_VOTING_TICKS: 6,
    PRESIDENTIAL_TERM_LIMIT: 2,           // max terms before incumbent must step aside
    PRESIDENTIAL_CANDIDATE_LEAD_TICKS: 6, // ticks before presidential election to generate candidates
    TICKS_PER_YEAR: 12,
    // (Budget bill system removed)
    // Impeachment (Presidential systems only)
    IMPEACHMENT_COMMITTEE_TICKS: 2,        // debate period before floor vote
    IMPEACHMENT_MOTION_VOTING_TICKS: 6,    // floor vote window for impeachment motion
    IMPEACHMENT_TRIAL_TICKS: 3,            // trial period (conviction vote window)
    IMPEACHMENT_MOTION_COOLDOWN_TICKS: 10, // cooldown after failed motion
    IMPEACHMENT_ACQUITTAL_COOLDOWN_TICKS: 20, // cooldown after acquittal
    // IMPEACHMENT_EMERGENCY_ELECTION_TICKS removed 20261203 — the
    // snap-election delay is now a hardcoded +1 in advance-tick
    // (impeachment conviction handler) because the value cannot be
    // tuned: registration's lookahead requires election_tick to be
    // strictly greater than currentTick, so the minimum legal value
    // is 1 and any larger value contradicts the "instant" spec.
    // Charge precondition thresholds.
    // Alpha refactor: IMPEACHMENT_CORRUPTION_THRESHOLD and the two
    // IMPEACHMENT_CRIMINAL_* thresholds were removed by Phase 3a's
    // impeachment audit — corruption + judicial_independence columns
    // are deleted, and buildImpeachmentCharges no longer emits
    // 'corruption' or 'criminal_conduct' charges. Leaving the
    // remaining (still-live) thresholds in place.
    IMPEACHMENT_INCOMPETENCE_THRESHOLD: 25,   // gov_approval <= this for incompetence charge
    IMPEACHMENT_INCOMPETENCE_TICKS: 6,        // consecutive ticks below threshold
    IMPEACHMENT_VETO_ABUSE_COUNT: 2,          // vetoed bills with >66% support
    IMPEACHMENT_ABUSE_OVERREACH_THRESHOLD: 4, // overreach_count >= this for abuse of power

    // (Autocracy v2 action constants removed — Phase 0)
    NEW_FACTION_MIN_SEATS: 8,

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

    // ── Legislative Term Length (Foundational) ──
    PARLIAMENTARY_TERM_LENGTH_OPTIONS: [24, 36, 48, 60, 72],  // ticks: 2yr, 3yr, 4yr, 5yr, 6yr
    PARLIAMENTARY_TERM_LENGTH_COOLDOWN_TICKS: 120,

    // ── Head of State Election Method (Foundational) ──
    HOS_ELECTION_COOLDOWN_TICKS: 360,

    // ── Constitutional Reform (Foundational) ──
    CONSTITUTIONAL_REFORM_COOLDOWN_TICKS: 240,
    CONSTITUTIONAL_REFORM_ELECTION_PROXIMITY_TICKS: 6,

    // ── Entrenchment Clauses ──
    PROTECTED_THRESHOLD: 0.60,          // 60% of seats (72 of 120)
    ENTRENCHED_COOLDOWN_TICKS: 60,      // ticks before repeal can be filed
};

// Single source of truth for repealing a Group A foundational law:
// subtype → the `nations` column it set and the hardcoded default a
// repeal reverts it to. Consumed by bills.js (enactFoundationalRepeal)
// and laws.html (established-state detection + repeal UI). Group B
// (constitutional_reform / monarchy / government-type transitions) is
// deliberately absent — those aren't a bare column reset.
// column     — the `nations` column this subtype set (server revert target)
// value      — the hardcoded default a repeal reverts it to
// label      — UI label for the repeal affordance
// cooldown   — per-type cooldown ticks a repeal respects/resets (0 = none,
//              matching subtypes whose proposals also have no cooldown)
// proposedCol— the bills.proposed_* column, so the cooldown query can find
//              the last *proposal* of this subtype too (null = flag subtype)
export const FOUNDATIONAL_REPEAL_DEFAULTS = Object.freeze({
    term_length:                          { column: 'presidential_term_ticks',              value: GAME_CONFIG.PRESIDENTIAL_TERM_TICKS,  label: 'Presidential Term Length',     cooldown: GAME_CONFIG.TERM_LENGTH_COOLDOWN_TICKS,                 proposedCol: 'proposed_term_length' },
    parliamentary_term_length:            { column: 'parliamentary_term_ticks',             value: GAME_CONFIG.PARLIAMENTARY_TERM_TICKS, label: 'Legislative Term Length',      cooldown: GAME_CONFIG.PARLIAMENTARY_TERM_LENGTH_COOLDOWN_TICKS,   proposedCol: 'proposed_parliamentary_term_length' },
    term_limit:                           { column: 'presidential_term_limit',              value: GAME_CONFIG.PRESIDENTIAL_TERM_LIMIT,  label: 'Presidential Term Limits',     cooldown: GAME_CONFIG.TERM_LIMIT_COOLDOWN_TICKS,                  proposedCol: 'proposed_term_limit' },
    hos_title:                            { column: 'head_of_state_title',                  value: GAME_CONFIG.HOS_TITLE_OPTIONS[0],     label: 'Head of State Title',          cooldown: GAME_CONFIG.HOS_TITLE_COOLDOWN_TICKS,                   proposedCol: 'proposed_hos_title' },
    hos_election:                         { column: 'hos_election_method',                  value: 'direct_vote',                        label: 'Head of State Election Method',cooldown: GAME_CONFIG.HOS_ELECTION_COOLDOWN_TICKS,                proposedCol: 'proposed_hos_election_method' },
    electoral_makeup:                     { column: 'total_seats',                          value: GAME_CONFIG.TOTAL_SEATS,              label: 'Electoral Makeup (Seats)',     cooldown: 0,                                                     proposedCol: 'proposed_seats' },
    judicial_appointment_politicization:  { column: 'judicial_appointment_politicization',  value: false,                                label: 'Judicial Politicization',      cooldown: 0,                                                     proposedCol: null },
    electoral_commission_reform:          { column: 'electoral_commission_reform',          value: false,                                label: 'Electoral Commission Reform',  cooldown: 0,                                                     proposedCol: null },
    party_registration_act:               { column: 'party_registration_threshold',         value: 0,                                    label: 'Party Registration Act',       cooldown: 0,                                                     proposedCol: null },
    legislative_quorum_reform:            { column: 'legislative_quorum_override',          value: 0,                                    label: 'Legislative Quorum Reform',    cooldown: 0,                                                     proposedCol: null },
    constitutional_amendment_streamlining:{ column: 'constitutional_amendment_streamlining', value: false,                               label: 'Amendment Streamlining',       cooldown: 0,                                                     proposedCol: null },
});

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

/**
 * Get the effective parliamentary term length (in ticks) for a nation.
 * Uses nation-specific override if set, otherwise falls back to GAME_CONFIG default.
 */
export function getParliamentaryTermTicks(nation) {
    if (nation && nation.parliamentary_term_ticks != null && nation.parliamentary_term_ticks > 0) {
        return nation.parliamentary_term_ticks;
    }
    return GAME_CONFIG.PARLIAMENTARY_TERM_TICKS;
}

export function initGameConfigForNation(nation) {
    const seats = (nation && nation.total_seats) ? nation.total_seats : 120;
    GAME_CONFIG.TOTAL_SEATS = seats;
    GAME_CONFIG.MAJORITY_SEATS = Math.floor(seats / 2) + 1;
}

export const FORMATION_DEADLINE_TICKS = 3; // ticks per formation window — applied both pre- and post-snap

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
