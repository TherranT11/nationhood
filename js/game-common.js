/**
 * game-common.js — Shared game logic for Nationhood Alpha
 *
 * Single source of truth for:
 *   - Seat loading (autocracy vs democracy)
 *   - Head faction detection
 *   - Coalition fetching (government_formations → active_coalitions)
 *   - Policy compatibility filtering
 *   - Bill support calculation
 *   - Vote tally syncing
 *   - Enactment approval impact
 *   - Game constants & utility formatters
 *
 * Used by: laws.html, bill.html, government.html, parties.html
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
    { key: 'WELFARE',       label: 'Welfare',             icon: '🏥' },
    { key: 'MILITARY',      label: 'Military & Security', icon: '🛡️' },
    { key: 'GOVERNANCE',    label: 'Governance',          icon: '🏛️' },
    { key: 'IMMIGRATION',   label: 'Immigration',         icon: '🌍' },
    { key: 'INTERNATIONAL', label: 'International',       icon: '🌐' }
];

// Stats where LOWER is better (inverted approval logic)
const INVERTED_STATS = [
    'unemployment', 'poverty_rate', 'income_inequality', 'death_rate',
    'pollution', 'carbon_emissions', 'crime_rate', 'incarceration_rate',
    'drug_use', 'corruption', 'polarization', 'civil_unrest', 'terrorism',
    'political_violence', 'emigration', 'sanctions', 'debt', 'debt_growth',
    'inflation', 'illegal_immigration', 'fuel_prices'
];


// ==================== SEAT LOADING ====================

/**
 * Load seat data for all parties in a nation.
 * - Autocracies: read factions.seats directly
 * - Democracies: latest election results, falling back to factions.seats
 */
async function loadSeats(supabase, nationId, isAutocracy, allParties, currentFactionId) {
    const allPartySeats = {};

    if (isAutocracy) {
        allParties.forEach(p => {
            allPartySeats[p.id] = p.seats || 0;
        });
    } else {
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
            election.results.seats.forEach(s => {
                allPartySeats[s.party_id] = s.seats;
            });
        }

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
 */
async function detectHeadFaction(supabase, nationId, allParties, allPartySeats, currentFactionId) {
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


// ==================== COALITION FETCHING ====================

/**
 * Fetch the active coalition/government for a nation.
 */
async function fetchActiveCoalition(supabase, nationId) {
    const { data: newGov } = await supabase
        .from('government_formations')
        .select('*')
        .eq('nation_id', nationId)
        .eq('status', 'formed')
        .order('formed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (newGov) {
        const pmPartyId = newGov.ministry_assignments?.prime_minister || newGov.proposed_by;
        return {
            id: newGov.id,
            nation_id: newGov.nation_id,
            election_id: newGov.election_id,
            party_ids: newGov.party_ids || [],
            lead_party_id: pmPartyId,
            ministry_allocations: newGov.ministry_assignments || {},
            formed_at: newGov.formed_at,
            _source: 'government_formations'
        };
    }

    const { data } = await supabase
        .from('active_coalitions')
        .select('*')
        .eq('nation_id', nationId)
        .order('formed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    return data;
}


// ==================== POLICY COMPATIBILITY ====================

/**
 * Get policies compatible with a faction's ideology for a given sector.
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
 * back to the bills table.
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


// ==================== ENACTMENT APPROVAL IMPACT ====================

/**
 * Calculate approval deltas for all parties when a bill is enacted.
 *
 * How it works:
 *   For each policy article with stat_effects, we look at the nation's
 *   current value for that stat and calculate how "urgent" the change is.
 *
 *   Normal stats (higher = better):
 *     - Stat at 20, policy raises it → high positive urgency (people desperate)
 *     - Stat at 80, policy raises it → low positive urgency (diminishing returns)
 *     - Stat at 80, policy lowers it → high negative urgency (taking away something good)
 *     - Stat at 20, policy lowers it → low negative urgency (wasn't great anyway)
 *
 *   Inverted stats (lower = better, e.g. corruption):
 *     - Flipped logic: lowering corruption at 80 = high positive urgency
 *
 *   Parties that voted YES get the full approval delta.
 *   Parties that voted NO get the inverse at 50% strength.
 *   Sponsor always counts as YES.
 *
 * @param {object}  nation       - Full nation row (with current stat values)
 * @param {Array}   articles     - Bill articles with policies (including stat_effects)
 * @param {Array}   billSupport  - Array of { faction_id, stance } from floor vote
 * @param {string}  sponsorId    - Faction UUID that proposed the bill
 * @returns {Object} Map of factionId → approval delta (can be positive or negative)
 *
 * Example return: { 'uuid-abc': +4.2, 'uuid-def': -2.1, 'uuid-ghi': +1.8 }
 */
function calculateEnactmentApproval(nation, articles, billSupport, sponsorId) {
    const BASE_IMPACT = 3;          // Max approval points per stat effect
    const NO_VOTE_PENALTY = 0.5;    // Inverse multiplier for NO voters

    // 1. Aggregate all stat effects across all articles in the bill
    const allEffects = [];
    for (const art of articles) {
        const p = art.policies || art;
        if (!p) continue;

        // Support new stat_effects array
        if (p.stat_effects && Array.isArray(p.stat_effects)) {
            for (const eff of p.stat_effects) {
                allEffects.push({
                    stat_key: eff.stat_key,
                    direction: eff.direction  // 'up' or 'down'
                });
            }
        }
        // Legacy single stat fallback
        else if (p.target_stat) {
            allEffects.push({
                stat_key: p.target_stat,
                direction: (p.stat_direction || '').toLowerCase() === 'up' ? 'up' : 'down'
            });
        }
    }

    if (allEffects.length === 0) return {};

    // 2. Calculate net public sentiment from all effects
    let totalSentiment = 0;

    for (const eff of allEffects) {
        const statKey = eff.stat_key;
        const currentValue = nation[statKey];
        if (currentValue === null || currentValue === undefined) continue;

        const isInverted = INVERTED_STATS.includes(statKey);
        const val = Number(currentValue);

        // Urgency: how much do people care about a change in this stat?
        // Range 0.0 to 1.0 based on how "bad" the stat currently is
        let urgency;
        if (isInverted) {
            // Inverted: high value = bad situation, people want it lowered
            urgency = val / 100;  // corruption at 80 → urgency 0.8
        } else {
            // Normal: low value = bad situation, people want it raised
            urgency = (100 - val) / 100;  // healthcare at 20 → urgency 0.8
        }

        // Clamp urgency to 0.1–1.0 (always some impact, never zero)
        urgency = Math.max(0.1, Math.min(1.0, urgency));

        // Does this effect help or hurt?
        let isHelpful;
        if (isInverted) {
            // Lowering an inverted stat is good, raising it is bad
            isHelpful = eff.direction === 'down';
        } else {
            // Raising a normal stat is good, lowering it is bad
            isHelpful = eff.direction === 'up';
        }

        // Sentiment: positive if helpful, negative if harmful
        // Scaled by urgency — desperate situations amplify the reaction
        const sentiment = isHelpful
            ? BASE_IMPACT * urgency           // helpful: +0.3 to +3.0
            : -BASE_IMPACT * (1 - urgency + 0.2);  // harmful: always stings, worse when stat was good

        totalSentiment += sentiment;
    }

    // Average across effects so bills with many articles don't explode
    const avgSentiment = totalSentiment / allEffects.length;

    // Cap at ±5 approval per bill
    const cappedSentiment = Math.max(-5, Math.min(5, avgSentiment));

    // 3. Assign to each party based on their vote
    const approvalDeltas = {};

    // Sponsor always counts as YES
    const votes = {};
    votes[sponsorId] = 'yes';
    for (const s of (billSupport || [])) {
        if (s.faction_id !== sponsorId) {
            votes[s.faction_id] = s.stance;
        }
    }

    for (const [factionId, stance] of Object.entries(votes)) {
        if (stance === 'yes') {
            // Voted YES: get full sentiment (positive if bill was popular, negative if not)
            approvalDeltas[factionId] = Math.round(cappedSentiment * 10) / 10;
        } else if (stance === 'no') {
            // Voted NO: get inverse at reduced strength
            // If bill was popular (sentiment > 0), NO voters lose approval
            // If bill was unpopular (sentiment < 0), NO voters gain approval (they opposed it!)
            approvalDeltas[factionId] = Math.round(-cappedSentiment * NO_VOTE_PENALTY * 10) / 10;
        }
        // Abstain: no effect
    }

    return approvalDeltas;
}

/**
 * Apply enactment approval deltas to factions in the database.
 *
 * Call this when a bill moves to 'passed' status.
 *
 * @param {object} supabase       - Supabase client
 * @param {Object} approvalDeltas - Map of factionId → delta from calculateEnactmentApproval
 * @returns {Promise<void>}
 */
async function applyEnactmentApproval(supabase, approvalDeltas) {
    for (const [factionId, delta] of Object.entries(approvalDeltas)) {
        if (delta === 0) continue;

        // Read current approval
        const { data: faction } = await supabase
            .from('factions')
            .select('approval_rating')
            .eq('id', factionId)
            .single();

        if (!faction) continue;

        const current = faction.approval_rating ?? 50;
        const updated = Math.max(0, Math.min(100, current + delta));

        await supabase
            .from('factions')
            .update({ approval_rating: updated })
            .eq('id', factionId);
    }
}


// ==================== UTILITY FORMATTERS ====================

function formatStatName(stat) {
    return stat.charAt(0).toUpperCase() + stat.slice(1).replace(/_/g, ' ');
}

function formatMinorSector(key) {
    return key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
