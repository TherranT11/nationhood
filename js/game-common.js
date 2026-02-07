/**
 * game-common.js — Shared game logic for Nationhood Alpha
 *
 * Single source of truth for:
 *   - Seat loading (autocracy vs democracy)
 *   - Head faction detection
 *   - Policy compatibility filtering
 *   - Bill support calculation
 *   - Vote tally syncing
 *   - Game constants & utility formatters
 *
 * Used by: laws.html, bill.html (and any future legislative pages)
 */

// ==================== CONSTANTS ====================

const GAME_CONFIG = {
    TOTAL_SEATS: 120,
    MAJORITY_THRESHOLD: 0.51,
    MAJORITY_SEATS: 61,
    VOTING_WINDOW_TICKS: 3,
    DRAFT_BILL_AP_COST: 2,
    VETO_APPROVAL_COST: 3
};

const MAJOR_SECTORS = [
    { key: 'ECONOMICS',     label: 'Economics',           icon: '💰' },
    { key: 'LABOR',         label: 'Labor',               icon: '👷' },
    { key: 'EDUCATION',     label: 'Education',           icon: '📚' },
    { key: 'ENERGY',        label: 'Energy',              icon: '⚡' },
    { key: 'SOCIAL',        label: 'Social',              icon: '🏥' },
    { key: 'MILITARY',      label: 'Military & Security', icon: '🛡️' },
    { key: 'GOVERNANCE',    label: 'Governance',          icon: '🏛️' },
    { key: 'IMMIGRATION',   label: 'Immigration',         icon: '🌍' },
    { key: 'INTERNATIONAL', label: 'International',       icon: '🌐' }
];


// ==================== SEAT LOADING ====================

/**
 * Load seat data for all parties in a nation.
 * - Autocracies: read factions.seats directly
 * - Democracies: latest election results, falling back to factions.seats
 *
 * @param {object}  supabase         - Supabase client
 * @param {string}  nationId         - Nation UUID
 * @param {boolean} isAutocracy
 * @param {Array}   allParties       - Array of { id, seats, ... }
 * @param {string}  currentFactionId - Current player's faction UUID
 * @returns {Promise<{ allPartySeats: Object, currentSeats: number }>}
 */
async function loadSeats(supabase, nationId, isAutocracy, allParties, currentFactionId) {
    const allPartySeats = {};

    if (isAutocracy) {
        allParties.forEach(p => {
            allPartySeats[p.id] = p.seats || 0;
        });
    } else {
        // Try latest completed election first
        const { data: election } = await supabase
            .from('elections')
            .select('results')
            .eq('nation_id', nationId)
            .eq('status', 'completed')
            .order('election_tick', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (election?.results?.votes) {
            election.results.votes.forEach(s => {
                allPartySeats[s.party_id] = s.seats;
            });
        } else if (election?.results?.seats) {
            // Legacy format
            election.results.seats.forEach(s => {
                allPartySeats[s.party_id] = s.seats;
            });
        }

        // Fall back to factions table for any party missing from election data
        allParties.forEach(p => {
            if (!allPartySeats[p.id]) {
                allPartySeats[p.id] = p.seats || 0;
            }
        });
    }

    const currentSeats = allPartySeats[currentFactionId] ||
        allParties.find(p => p.id === currentFactionId)?.seats || 0;

    return { allPartySeats, currentSeats };
}


// ==================== HEAD FACTION ====================

/**
 * Detect the head (ruling) faction for autocracy veto/enact powers.
 *
 * Head faction = the faction whose party holds the Head of State,
 * stored in nation_governments.head_of_state_party.
 *
 * This only changes when:
 *   - The Head of State dies and the faction with the most seats appoints a new one
 *   - A faction successfully uses the Seize Power action
 *
 * Falls back to most-seats if no nation_governments row exists (legacy data).
 *
 * @param {object} supabase         - Supabase client
 * @param {string} nationId         - Nation UUID
 * @param {Array}  allParties       - Array of party objects
 * @param {Object} allPartySeats    - Map of partyId -> seats
 * @param {string} currentFactionId - Current player's faction UUID
 * @returns {Promise<{ headFactionId: string|null, isHeadFaction: boolean }>}
 */
async function detectHeadFaction(supabase, nationId, allParties, allPartySeats, currentFactionId) {
    // Primary: look up head_of_state_party from nation_governments
    const { data: gov } = await supabase
        .from('nation_governments')
        .select('head_of_state_party')
        .eq('nation_id', nationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (gov?.head_of_state_party) {
        return {
            headFactionId: gov.head_of_state_party,
            isHeadFaction: currentFactionId === gov.head_of_state_party
        };
    }

    // Fallback: most seats (legacy / unset data)
    const sorted = allParties.slice().sort((a, b) =>
        (allPartySeats[b.id] || 0) - (allPartySeats[a.id] || 0)
    );
    const top = sorted[0];
    if (!top) return { headFactionId: null, isHeadFaction: false };
    return {
        headFactionId: top.id,
        isHeadFaction: currentFactionId === top.id
    };
}


// ==================== POLICY COMPATIBILITY ====================

/**
 * Get policies compatible with a faction's ideology for a given sector.
 * Autocracy factions with no ideology can propose any policy.
 *
 * @param {string}  sector           - Major sector key (e.g. 'ECONOMICS')
 * @param {Array}   allPolicies      - All active policies
 * @param {Object}  faction          - Faction with ideology_value_1/2
 * @param {boolean} isAutocracy
 * @param {Array}   excludePolicyIds - Policy IDs already in draft/bill
 * @returns {Array} Filtered policies
 */
function getCompatiblePolicies(sector, allPolicies, faction, isAutocracy, excludePolicyIds = []) {
    const ideo1 = (faction?.ideology_value_1 || '').toUpperCase();
    const ideo2 = (faction?.ideology_value_2 || '').toUpperCase();

    if (isAutocracy && !ideo1 && !ideo2) {
        return allPolicies.filter(p =>
            p.major_sector === sector &&
            !excludePolicyIds.includes(p.id)
        );
    }

    return allPolicies.filter(p =>
        p.major_sector === sector &&
        (p.ideology.toUpperCase() === ideo1 || p.ideology.toUpperCase() === ideo2) &&
        !excludePolicyIds.includes(p.id)
    );
}


// ==================== BILL SUPPORT ====================

/**
 * Calculate support percentage for a bill in committee.
 *
 * @param {Array}  billSupport    - Array of { stance, seat_count }
 * @param {string} sponsorPartyId - UUID of the sponsoring party
 * @param {Object} allPartySeats  - Map of partyId -> seats
 * @returns {{ sponsorSeats, acceptedSeats, totalSupport, percent }}
 */
function calculateBillSupport(billSupport, sponsorPartyId, allPartySeats) {
    const sponsorSeats = allPartySeats[sponsorPartyId] || 0;
    const acceptedSeats = (billSupport || [])
        .filter(s => s.stance === 'accept')
        .reduce((sum, s) => sum + s.seat_count, 0);
    const totalSupport = sponsorSeats + acceptedSeats;
    const percent = Math.round((totalSupport / GAME_CONFIG.TOTAL_SEATS) * 100);
    return { sponsorSeats, acceptedSeats, totalSupport, percent };
}


// ==================== VOTE TALLY SYNC ====================

/**
 * Re-read all votes for a bill from bill_support and write totals
 * back to the bills table. This keeps laws.html's floor display in sync.
 *
 * @param {object} supabase - Supabase client
 * @param {string} billId   - Bill UUID
 * @returns {Promise<{ votesFor: number, votesAgainst: number }>}
 */
async function syncVoteTallies(supabase, billId) {
    const { data: allVotes } = await supabase
        .from('bill_support')
        .select('stance, seat_count')
        .eq('bill_id', billId);

    let votesFor = 0, votesAgainst = 0;
    (allVotes || []).forEach(v => {
        if (v.stance === 'yes')       votesFor += v.seat_count;
        else if (v.stance === 'no')   votesAgainst += v.seat_count;
    });

    await supabase.from('bills').update({
        votes_for: votesFor,
        votes_against: votesAgainst
    }).eq('id', billId);

    return { votesFor, votesAgainst };
}


// ==================== UTILITY FORMATTERS ====================

function formatStatName(stat) {
    return stat.charAt(0).toUpperCase() + stat.slice(1).replace(/_/g, ' ');
}

function formatMinorSector(key) {
    return key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
