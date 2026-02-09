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
 *   - Dynamic Ideology System (axes, labels, shifts, drift, penalties)
 *   - Random event processing
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
    { key: 'SOCIAL',        label: 'Social',              icon: '🤝' },
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

// Stats stored as raw numbers (not 0-100 indices).
// Divisor converts to a sensible multiplier for cost scaling.
//   population: stored in raw (e.g. 10,000,000) → divide by 1M → cost "per million people"
//   gdp:        stored in raw (e.g. 500B)        → divide by 1B → cost "per billion GDP"
//   debt:       stored in raw (e.g. 200B)         → divide by 1B → cost "per billion debt"
// All other stats are 0-100 and use divisor 50 (stat=50 → 1x multiplier).
const RAW_SCALING_DIVISORS = {
    population: 1_000_000,
    gdp: 1_000_000_000,
    debt: 1_000_000_000
};

// Ideology spectrum opposites — only true opposites trigger the "opposed" penalty.
// Policies with unrelated ideologies are neutral, not opposed.
const IDEOLOGY_OPPOSITES = {
    'LIBERTY': 'EQUALITY',           'EQUALITY': 'LIBERTY',
    'FREEDOM': 'SECURITY',           'SECURITY': 'FREEDOM',
    'TRADITION': 'PROGRESS',         'PROGRESS': 'TRADITION',
    'GLOBALISM': 'NATIONALISM',      'NATIONALISM': 'GLOBALISM',
    'INDIVIDUALISM': 'COLLECTIVISM', 'COLLECTIVISM': 'INDIVIDUALISM'
};


// ==================== DYNAMIC IDEOLOGY SYSTEM ====================

/**
 * The five ideological axes. Each is a spectrum from -100 to +100.
 * The "left" label sits at -100, the "right" label sits at +100.
 *
 * Convention: the DB column name is "leftlabel_rightlabel" (lowercase).
 */
const IDEOLOGY_AXES = [
    {
        key: 'liberty_equality',
        left: 'LIBERTY',       right: 'EQUALITY',
        leftLabel: 'Liberty',  rightLabel: 'Equality',
        leftColor: '#3b82f6',  rightColor: '#ef4444',
        description: 'Individual rights vs. collective fairness'
    },
    {
        key: 'tradition_progress',
        left: 'TRADITION',      right: 'PROGRESS',
        leftLabel: 'Tradition', rightLabel: 'Progress',
        leftColor: '#a855f7',   rightColor: '#22c55e',
        description: 'Cultural conservatism vs. social reform'
    },
    {
        key: 'security_freedom',
        left: 'SECURITY',      right: 'FREEDOM',
        leftLabel: 'Security', rightLabel: 'Freedom',
        leftColor: '#f59e0b',  rightColor: '#06b6d4',
        description: 'State protection vs. personal autonomy'
    },
    {
        key: 'globalism_nationalism',
        left: 'GLOBALISM',       right: 'NATIONALISM',
        leftLabel: 'Globalism',  rightLabel: 'Nationalism',
        leftColor: '#14b8a6',    rightColor: '#f97316',
        description: 'International integration vs. national sovereignty'
    },
    {
        key: 'individualism_collectivism',
        left: 'INDIVIDUALISM',       right: 'COLLECTIVISM',
        leftLabel: 'Individualism',  rightLabel: 'Collectivism',
        leftColor: '#eab308',        rightColor: '#ec4899',
        description: 'Personal self-reliance vs. communal structures'
    }
];

/**
 * Maps an ideology name (e.g. "LIBERTY") to its axis key and shift direction.
 *
 * direction: -1 means the ideology sits on the LEFT (negative) end of the axis
 *            +1 means the ideology sits on the RIGHT (positive) end of the axis
 *
 * Example:
 *   IDEOLOGY_TO_AXIS['LIBERTY']  → { axisKey: 'liberty_equality', direction: -1 }
 *   IDEOLOGY_TO_AXIS['EQUALITY'] → { axisKey: 'liberty_equality', direction: +1 }
 */
const IDEOLOGY_TO_AXIS = {};
for (const axis of IDEOLOGY_AXES) {
    IDEOLOGY_TO_AXIS[axis.left]  = { axisKey: axis.key, direction: -1 };
    IDEOLOGY_TO_AXIS[axis.right] = { axisKey: axis.key, direction: +1 };
}


// ==================== IDEOLOGY LABELS ====================

/**
 * Label thresholds from the design guide.
 * Applied to the ABSOLUTE value of a score on any axis.
 */
const IDEOLOGY_LABEL_THRESHOLDS = [
    { min: 0,  max: 10,  label: 'Centrist' },
    { min: 11, max: 30,  label: 'Leaning' },
    { min: 31, max: 60,  label: 'Strong' },
    { min: 61, max: 100, label: 'Radical' }
];

/**
 * Get the human-readable label for a single axis score.
 *
 * @param {number} score    - Axis score (-100 to +100)
 * @param {object} axisDef  - Entry from IDEOLOGY_AXES
 * @returns {string} e.g. "Strong Liberty", "Leaning Progress", "Centrist"
 */
function getIdeologyLabel(score, axisDef) {
    const abs = Math.abs(score);
    const threshold = IDEOLOGY_LABEL_THRESHOLDS.find(t => abs >= t.min && abs <= t.max);
    const intensityLabel = threshold ? threshold.label : 'Centrist';

    if (intensityLabel === 'Centrist') return 'Centrist';

    const sideName = score < 0 ? axisDef.leftLabel : axisDef.rightLabel;
    return `${intensityLabel} ${sideName}`;
}

/**
 * Get the full ideology profile for a faction (all 5 axes).
 *
 * @param {object} ideologyRow - Row from faction_ideology table
 * @returns {Array} Array of { axisKey, axisDef, score, label }
 */
function getFullIdeologyProfile(ideologyRow) {
    return IDEOLOGY_AXES.map(axis => {
        const score = ideologyRow[axis.key] || 0;
        return {
            axisKey: axis.key,
            axisDef: axis,
            score: score,
            label: getIdeologyLabel(score, axis)
        };
    });
}

/**
 * Get a compact label summary string.
 * e.g. "Strong Liberty • Leaning Progress • Centrist (Security/Freedom) • ..."
 *
 * @param {object} ideologyRow - Row from faction_ideology table
 * @returns {string}
 */
function getIdeologySummary(ideologyRow) {
    const profile = getFullIdeologyProfile(ideologyRow);
    return profile.map(p => {
        if (p.label === 'Centrist') {
            return `Centrist (${p.axisDef.leftLabel}/${p.axisDef.rightLabel})`;
        }
        return p.label;
    }).join(' • ');
}


// ==================== IDEOLOGY POINT CALCULATION ====================

/**
 * Point values for different political actions.
 * These multiply per ideology tag per article.
 *
 * Design guide §4.1:
 *   - Vote YES on a bill:    +1 per ideology tag per article
 *   - Vote NO on a bill:     +1 per ideology tag per article (in OPPOSITE direction)
 *   - Sponsor a bill:        +2 per ideology tag per article
 *   - Bill PASSES (if yes):  +1 bonus per ideology tag per article
 */
const IDEOLOGY_POINT_VALUES = {
    VOTE_YES:     1,
    VOTE_NO:      1,
    SPONSOR:      2,
    BILL_PASSED:  1
};

/**
 * Calculate ideology axis shifts for a single faction based on their
 * political actions this tick.
 *
 * @param {object} params
 * @param {Array}  params.votedYesBills   - Bills this faction voted YES on (with bill_articles.policies)
 * @param {Array}  params.votedNoBills    - Bills this faction voted NO on (with bill_articles.policies)
 * @param {Array}  params.sponsoredBills  - Bills this faction sponsored this tick (with bill_articles.policies)
 * @param {Array}  params.passedBills     - Bills that passed this tick where faction voted YES
 *
 * @returns {object} Map of axisKey → total shift amount (can be + or -)
 *   e.g. { liberty_equality: -3, security_freedom: +2 }
 */
function calculateIdeologyShifts({ votedYesBills = [], votedNoBills = [], sponsoredBills = [], passedBills = [] }) {
    const shifts = {};

    function addShift(axisKey, amount) {
        shifts[axisKey] = (shifts[axisKey] || 0) + amount;
    }

    function getArticleIdeologies(bill) {
        const tags = [];
        for (const art of (bill.bill_articles || [])) {
            const p = art.policies || art;
            if (!p) continue;
            const ideos = (p.ideologies && Array.isArray(p.ideologies) && p.ideologies.length > 0)
                ? p.ideologies.map(i => i.toUpperCase())
                : (p.ideology ? [p.ideology.toUpperCase()] : []);
            tags.push(...ideos);
        }
        return tags;
    }

    // 1. VOTE YES — shift TOWARD each policy ideology
    for (const bill of votedYesBills) {
        const tags = getArticleIdeologies(bill);
        for (const tag of tags) {
            const mapping = IDEOLOGY_TO_AXIS[tag];
            if (mapping) {
                addShift(mapping.axisKey, mapping.direction * IDEOLOGY_POINT_VALUES.VOTE_YES);
            }
        }
    }

    // 2. VOTE NO — shift AWAY from each policy ideology (opposite direction)
    for (const bill of votedNoBills) {
        const tags = getArticleIdeologies(bill);
        for (const tag of tags) {
            const mapping = IDEOLOGY_TO_AXIS[tag];
            if (mapping) {
                addShift(mapping.axisKey, -mapping.direction * IDEOLOGY_POINT_VALUES.VOTE_NO);
            }
        }
    }

    // 3. SPONSOR — stronger shift toward the ideology
    for (const bill of sponsoredBills) {
        const tags = getArticleIdeologies(bill);
        for (const tag of tags) {
            const mapping = IDEOLOGY_TO_AXIS[tag];
            if (mapping) {
                addShift(mapping.axisKey, mapping.direction * IDEOLOGY_POINT_VALUES.SPONSOR);
            }
        }
    }

    // 4. BILL PASSED (bonus for YES voters) — additional shift toward
    for (const bill of passedBills) {
        const tags = getArticleIdeologies(bill);
        for (const tag of tags) {
            const mapping = IDEOLOGY_TO_AXIS[tag];
            if (mapping) {
                addShift(mapping.axisKey, mapping.direction * IDEOLOGY_POINT_VALUES.BILL_PASSED);
            }
        }
    }

    return shifts;
}

/**
 * Apply ideology shifts to a faction's current scores, clamping to -100..+100.
 *
 * @param {object} currentScores - Current axis scores { liberty_equality: -30, ... }
 * @param {object} shifts        - Shifts to apply { liberty_equality: -2, ... }
 * @returns {object} New scores after applying shifts and clamping
 */
function applyIdeologyShifts(currentScores, shifts) {
    const newScores = { ...currentScores };
    for (const axis of IDEOLOGY_AXES) {
        const shift = shifts[axis.key] || 0;
        if (shift === 0) continue;
        const current = newScores[axis.key] || 0;
        newScores[axis.key] = Math.max(-100, Math.min(100, current + shift));
    }
    return newScores;
}


// ==================== DRIFT DETECTION ====================

/**
 * Drift thresholds from design guide §7.1.
 * Compared against the absolute change on an axis in a single tick.
 */
const DRIFT_THRESHOLDS = {
    MINOR:  3,
    MAJOR:  6,
    EXTREME: 10
};

/**
 * Detect drift events by comparing current and previous tick scores.
 *
 * @param {object} currentScores  - This tick's scores
 * @param {object} previousScores - Last tick's scores
 * @param {object} ideologyRow    - Full faction_ideology row (for declared values)
 * @param {string} factionName    - For event messages
 *
 * @returns {Array} Array of drift event objects:
 *   { type: 'drift'|'hypocrisy', severity: 'minor'|'major'|'extreme',
 *     axis: axisDef, delta, message }
 */
function detectIdeologyDrift(currentScores, previousScores, ideologyRow, factionName) {
    const events = [];

    for (const axis of IDEOLOGY_AXES) {
        const current = currentScores[axis.key] || 0;
        const previous = previousScores[axis.key] || 0;
        const delta = current - previous;
        const absDelta = Math.abs(delta);

        if (absDelta < DRIFT_THRESHOLDS.MINOR) continue;

        let severity, verb;
        if (absDelta >= DRIFT_THRESHOLDS.EXTREME) {
            severity = 'extreme';
            verb = 'dramatically reversed course on';
        } else if (absDelta >= DRIFT_THRESHOLDS.MAJOR) {
            severity = 'major';
            verb = 'is lurching toward';
        } else {
            severity = 'minor';
            verb = 'is shifting toward';
        }

        const direction = delta < 0 ? axis.leftLabel : axis.rightLabel;
        const message = `${factionName} ${verb} ${direction}`;

        events.push({
            type: 'drift',
            severity,
            axisKey: axis.key,
            axisDef: axis,
            delta,
            score: current,
            message
        });
    }

    // Hypocrisy detection: check declared axes for side-switching
    const declaredAxes = [];
    if (ideologyRow.declared_axis_1) {
        declaredAxes.push({
            axisKey: ideologyRow.declared_axis_1,
            declaredDirection: ideologyRow.declared_direction_1
        });
    }
    if (ideologyRow.declared_axis_2) {
        declaredAxes.push({
            axisKey: ideologyRow.declared_axis_2,
            declaredDirection: ideologyRow.declared_direction_2
        });
    }

    for (const decl of declaredAxes) {
        const current = currentScores[decl.axisKey] || 0;
        const previous = previousScores[decl.axisKey] || 0;
        const declaredSign = decl.declaredDirection > 0 ? 1 : -1;

        const currentSign = current === 0 ? 0 : (current > 0 ? 1 : -1);
        const previousSign = previous === 0 ? 0 : (previous > 0 ? 1 : -1);

        // Only fire if they JUST crossed (weren't already on the opposite side)
        if (currentSign !== 0 && currentSign !== declaredSign && previousSign !== currentSign) {
            const axisDef = IDEOLOGY_AXES.find(a => a.key === decl.axisKey);
            if (!axisDef) continue;

            const declaredSide = declaredSign < 0 ? axisDef.leftLabel : axisDef.rightLabel;
            const currentSide = currentSign < 0 ? axisDef.leftLabel : axisDef.rightLabel;

            events.push({
                type: 'hypocrisy',
                severity: 'extreme',
                axisKey: decl.axisKey,
                axisDef,
                delta: current - previous,
                score: current,
                declaredSide,
                currentSide,
                message: `HYPOCRISY ALERT: ${factionName} declared ${declaredSide} but has drifted to ${currentSide}!`
            });
        }
    }

    return events;
}


// ==================== DYNAMIC OPPOSITION PENALTY (SPECTRUM-BASED) ====================

/**
 * Calculate the dynamic opposition penalty for a faction voting on a policy,
 * based on their CURRENT spectrum position (not static declarations).
 *
 * Design guide §6.1:
 *   The penalty is proportional to how far the faction is on the OPPOSITE
 *   side of the axis from what the policy represents.
 *
 *   - If the policy pushes toward + and the faction is at -80 → severe penalty
 *   - If the policy pushes toward + and the faction is at +40 → NO penalty (aligned)
 *   - If the policy pushes toward + and the faction is at -5  → negligible penalty
 *
 * @param {object} factionIdeology   - Row from faction_ideology table
 * @param {string} policyIdeologyTag - e.g. 'LIBERTY', 'EQUALITY', 'FREEDOM'
 * @param {number} basePenalty       - Base penalty value (default 2)
 * @returns {number} Penalty amount (0 or negative). 0 = aligned, negative = opposed.
 */
function calculateDynamicOppositionPenalty(factionIdeology, policyIdeologyTag, basePenalty = 2) {
    const tag = policyIdeologyTag.toUpperCase();
    const mapping = IDEOLOGY_TO_AXIS[tag];
    if (!mapping) return 0;

    const factionScore = factionIdeology[mapping.axisKey] || 0;
    const policyDirection = mapping.direction; // +1 or -1

    // How opposed is the faction?
    // If policy pushes +1 (right), opposition = how negative the faction is
    // If policy pushes -1 (left), opposition = how positive the faction is
    const oppositionScore = -policyDirection * factionScore;

    // Only penalize if faction is on the opposite side (oppositionScore > 0)
    if (oppositionScore <= 0) return 0;

    // Scale: 0 at center, full penalty at ±100
    const penaltyScale = oppositionScore / 100;
    return -Math.round(basePenalty * penaltyScale * 10) / 10;
}

/**
 * Calculate total dynamic opposition penalty for all ideology tags in a bill.
 *
 * @param {object} factionIdeology - Row from faction_ideology table
 * @param {Array}  articles        - Bill articles with policies
 * @param {number} basePenalty     - Base penalty per tag (default 2)
 * @returns {number} Total penalty (0 or negative)
 */
function calculateBillDynamicPenalty(factionIdeology, articles, basePenalty = 2) {
    let totalPenalty = 0;

    for (const art of articles) {
        const p = art.policies || art;
        if (!p) continue;

        const ideos = (p.ideologies && Array.isArray(p.ideologies) && p.ideologies.length > 0)
            ? p.ideologies.map(i => i.toUpperCase())
            : (p.ideology ? [p.ideology.toUpperCase()] : []);

        for (const tag of ideos) {
            totalPenalty += calculateDynamicOppositionPenalty(factionIdeology, tag, basePenalty);
        }
    }

    return totalPenalty;
}


// ==================== HYPOCRISY APPROVAL PENALTY ====================

/**
 * Calculate approval penalty for hypocrisy (declared vs actual drift).
 * Called when a hypocrisy event is detected.
 *
 * The penalty scales with how far the faction has drifted past zero
 * on their declared axis.
 *
 * @param {number} currentScore      - Current score on the axis
 * @param {number} declaredDirection  - Original declared direction (-30 or +30)
 * @returns {number} Negative approval penalty
 */
function calculateHypocrisyPenalty(currentScore, declaredDirection) {
    const declaredSign = declaredDirection > 0 ? 1 : -1;
    const currentSign = currentScore > 0 ? 1 : -1;

    if (currentSign === declaredSign || currentScore === 0) return 0;

    const distPastZero = Math.abs(currentScore);
    if (distPastZero > 30) return -3;
    if (distPastZero > 10) return -2;
    return -1;
}


// ==================== IDEOLOGY DATABASE HELPERS ====================

/**
 * Load ideology data for a single faction.
 *
 * @param {object} supabase  - Supabase client
 * @param {string} factionId - Faction UUID
 * @returns {Promise<object|null>} faction_ideology row or null
 */
async function loadFactionIdeology(supabase, factionId) {
    const { data, error } = await supabase
        .from('faction_ideology')
        .select('*')
        .eq('faction_id', factionId)
        .maybeSingle();

    if (error) {
        console.error('Error loading faction ideology:', error);
        return null;
    }
    return data;
}

/**
 * Load ideology data for ALL factions in a nation.
 *
 * @param {object} supabase - Supabase client
 * @param {string} nationId - Nation UUID
 * @returns {Promise<Array>} Array of faction_ideology rows joined with faction info
 */
async function loadNationIdeologies(supabase, nationId) {
    const { data: factions } = await supabase
        .from('factions')
        .select('id')
        .eq('nation_id', nationId)
        .eq('faction_type', 'party');

    if (!factions || factions.length === 0) return [];

    const factionIds = factions.map(f => f.id);
    const { data, error } = await supabase
        .from('faction_ideology')
        .select('*, factions(id, faction_name, faction_type, is_npc, nation_id)')
        .in('faction_id', factionIds);

    if (error) {
        console.error('Error loading nation ideologies:', error);
        return [];
    }
    return data || [];
}

/**
 * Load the most recent ideology history snapshot for a faction.
 * Used for drift detection (compare current vs previous).
 *
 * @param {object} supabase  - Supabase client
 * @param {string} factionId - Faction UUID
 * @param {number} tick      - Get the snapshot BEFORE this tick
 * @returns {Promise<object|null>}
 */
async function loadPreviousIdeologySnapshot(supabase, factionId, tick) {
    const { data, error } = await supabase
        .from('ideology_history')
        .select('*')
        .eq('faction_id', factionId)
        .lt('tick', tick)
        .order('tick', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error('Error loading ideology snapshot:', error);
        return null;
    }
    return data;
}

/**
 * Extract current axis scores from an ideology row into a plain object.
 * Useful for passing to shift/drift functions.
 *
 * @param {object} ideologyRow - Row from faction_ideology or ideology_history
 * @returns {object} { liberty_equality: N, tradition_progress: N, ... }
 */
function extractAxisScores(ideologyRow) {
    const scores = {};
    for (const axis of IDEOLOGY_AXES) {
        scores[axis.key] = ideologyRow[axis.key] || 0;
    }
    return scores;
}


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
 *
 * Priority:
 *   1. nations.ruling_faction_id (authoritative source for autocracies)
 *   2. nation_governments.head_of_state_party (legacy/democracy fallback)
 *   3. null (no ruling faction detected)
 *
 * NOTE: We no longer fall back to "most seats = ruling" — that was the bug.
 * The ruling faction is explicitly set and only changes via Shakeup resolution
 * or when the strongman dies.
 */
async function detectHeadFaction(supabase, nationId, allParties, allPartySeats, currentFactionId) {
    // 1. Check nations.ruling_faction_id (primary source for autocracies)
    const { data: nation } = await supabase
        .from('nations')
        .select('ruling_faction_id')
        .eq('id', nationId)
        .single();

    if (nation?.ruling_faction_id) {
        return {
            headFactionId: nation.ruling_faction_id,
            isHeadFaction: currentFactionId === nation.ruling_faction_id
        };
    }

    // 2. Legacy fallback: nation_governments table
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

    // 3. No ruling faction found — do NOT fall back to seat sorting
    return { headFactionId: null, isHeadFaction: false };
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
 * Get policies for a given sector. All policies are now available regardless
 * of faction ideology — but opposed policies carry approval penalties.
 * Each policy gets flags so the UI can warn the player:
 *   .isOpposed         — true if policy contains a true ideological opposite
 *   .prerequisiteMissing — true if requires_policy_id isn't in activePolicyIds
 *   .prerequisiteName  — name of the required policy (for UI display)
 */
function getCompatiblePolicies(sector, allPolicies, faction, isAutocracy, excludePolicyIds = [], activePolicyIds = null) {
    const ideo1 = (faction?.ideology_value_1 || '').toUpperCase();
    const ideo2 = (faction?.ideology_value_2 || '').toUpperCase();
    const factionIdeos = [ideo1, ideo2].filter(Boolean);

    // Build set of ideologies that are hostile to this faction
    const factionOpposites = new Set(
        factionIdeos.map(fi => IDEOLOGY_OPPOSITES[fi]).filter(Boolean)
    );

    return allPolicies
        .filter(p => p.major_sector === sector && !excludePolicyIds.includes(p.id))
        .map(p => {
            const policyIdeos = (p.ideologies && Array.isArray(p.ideologies) && p.ideologies.length > 0)
                ? p.ideologies.map(i => i.toUpperCase())
                : (p.ideology ? [p.ideology.toUpperCase()] : []);

            // A policy is opposed ONLY if it contains a true ideological opposite.
            const isOpposed = factionIdeos.length > 0 &&
                policyIdeos.length > 0 &&
                policyIdeos.some(pi => factionOpposites.has(pi));

            // Prerequisite check
            let prerequisiteMissing = false;
            let prerequisiteName = null;
            if (p.requires_policy_id && activePolicyIds) {
                if (!activePolicyIds.has(p.requires_policy_id)) {
                    prerequisiteMissing = true;
                    const prereq = allPolicies.find(pp => pp.id === p.requires_policy_id);
                    prerequisiteName = prereq?.policy_name || 'Unknown Policy';
                }
            }

            return { ...p, isOpposed, prerequisiteMissing, prerequisiteName };
        });
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
 */
function calculateEnactmentApproval(nation, articles, billSupport, sponsorId) {
    const BASE_IMPACT = 3;
    const NO_VOTE_PENALTY = 0.5;

    // 1. Aggregate all stat effects across all articles in the bill
    const allEffects = [];
    for (const art of articles) {
        const p = art.policies || art;
        if (!p) continue;

        if (p.stat_effects && Array.isArray(p.stat_effects)) {
            for (const eff of p.stat_effects) {
                allEffects.push({
                    stat_key: eff.stat_key,
                    direction: eff.direction
                });
            }
        }
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

        let urgency;
        if (isInverted) {
            urgency = val / 100;
        } else {
            urgency = (100 - val) / 100;
        }

        urgency = Math.max(0.1, Math.min(1.0, urgency));

        let isHelpful;
        if (isInverted) {
            isHelpful = eff.direction === 'down';
        } else {
            isHelpful = eff.direction === 'up';
        }

        const sentiment = isHelpful
            ? BASE_IMPACT * urgency
            : -BASE_IMPACT * (1 - urgency + 0.2);

        totalSentiment += sentiment;
    }

    const avgSentiment = totalSentiment / allEffects.length;
    const cappedSentiment = Math.max(-5, Math.min(5, avgSentiment));

    // 3. Assign to each party based on their vote
    const approvalDeltas = {};

    const votes = {};
    votes[sponsorId] = 'yes';
    for (const s of (billSupport || [])) {
        if (s.faction_id !== sponsorId) {
            votes[s.faction_id] = s.stance;
        }
    }

    for (const [factionId, stance] of Object.entries(votes)) {
        if (stance === 'yes') {
            approvalDeltas[factionId] = Math.round(cappedSentiment * 10) / 10;
        } else if (stance === 'no') {
            approvalDeltas[factionId] = Math.round(-cappedSentiment * NO_VOTE_PENALTY * 10) / 10;
        }
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


// ==================== STATIC IDEOLOGY PENALTY (LEGACY) ====================

/**
 * Count how many articles in a bill are ideologically opposed to the sponsor.
 *
 * A policy article is "opposed" if it contains a true ideological opposite
 * of the sponsor's declared ideology values. Text-only articles are never opposed.
 *
 * @param {Array}  articles - Bill articles with policies
 * @param {Object} sponsor  - Faction with ideology_value_1/2
 * @returns {number} Count of opposed articles
 */
function countOpposedArticles(articles, sponsor) {
    const ideo1 = (sponsor?.ideology_value_1 || '').toUpperCase();
    const ideo2 = (sponsor?.ideology_value_2 || '').toUpperCase();
    const factionIdeos = [ideo1, ideo2].filter(Boolean);

    if (factionIdeos.length === 0) return 0;

    const factionOpposites = new Set(
        factionIdeos.map(fi => IDEOLOGY_OPPOSITES[fi]).filter(Boolean)
    );

    let opposed = 0;
    for (const art of articles) {
        const p = art.policies || art;
        if (!p || !p.policy_name) continue;

        const policyIdeos = (p.ideologies && Array.isArray(p.ideologies) && p.ideologies.length > 0)
            ? p.ideologies.map(i => i.toUpperCase())
            : (p.ideology ? [p.ideology.toUpperCase()] : []);

        if (policyIdeos.length === 0) continue;

        const hasOpposite = policyIdeos.some(pi => factionOpposites.has(pi));
        if (hasOpposite) opposed++;
    }
    return opposed;
}

/**
 * Calculate ideology penalty for the sponsor when a bill reaches a milestone.
 *
 * Called at two points:
 *   1. Bill reaches FLOOR  → -1 per 2 opposed articles (doubled if polarization ≥ 50)
 *   2. Bill PASSES          → -1 per opposed article, plus -2 per article if polarization ≥ 75
 *
 * Polarization thresholds:
 *   < 50:  floor = -1 per 2,  pass = -1 per 1
 *   50-74: floor = -1 per 1,  pass = -1 per 1
 *   75+:   floor = -1 per 1,  pass = -3 per 1 (-1 base + -2 extra)
 *
 * @param {string}  stage        - 'floor' or 'passed'
 * @param {number}  opposedCount - From countOpposedArticles()
 * @param {number}  polarization - Nation's current polarization stat (0-100)
 * @returns {number} Negative approval delta for the sponsor (always ≤ 0)
 */
function calculateIdeologyPenalty(stage, opposedCount, polarization) {
    if (opposedCount === 0) return 0;

    const pol = polarization || 0;
    let penalty = 0;

    if (stage === 'floor') {
        if (pol >= 50) {
            penalty = -1 * opposedCount;
        } else {
            penalty = -1 * Math.floor(opposedCount / 2);
        }
    } else if (stage === 'passed') {
        penalty = -1 * opposedCount;
        if (pol >= 75) {
            penalty += -2 * opposedCount;
        }
    }

    return penalty;
}

/**
 * Apply ideology penalty to the sponsor faction in the database.
 *
 * @param {object} supabase   - Supabase client
 * @param {string} sponsorId  - Faction UUID
 * @param {number} penalty    - Negative number from calculateIdeologyPenalty()
 * @returns {Promise<void>}
 */
async function applyIdeologyPenalty(supabase, sponsorId, penalty) {
    if (penalty === 0 || !sponsorId) return;

    const { data: faction } = await supabase
        .from('factions')
        .select('approval_rating')
        .eq('id', sponsorId)
        .single();

    if (!faction) return;

    const current = faction.approval_rating ?? 50;
    const updated = Math.max(0, Math.min(100, current + penalty));

    await supabase
        .from('factions')
        .update({ approval_rating: updated })
        .eq('id', sponsorId);
}


// ==================== IDEOLOGY TICK PROCESSOR (PHASE 2) ====================

/**
 * Process ideology shifts for all factions in a nation based on this tick's
 * legislative activity (votes, sponsorship, bill passage).
 *
 * Called once per nation per tick, AFTER vote resolution (resolveExpiredVotes)
 * and BEFORE approval calculations.
 *
 * Flow per faction:
 *   1. Query all bills resolved this tick
 *   2. Categorize each faction's votes (yes/no/sponsor/passed)
 *   3. Calculate ideology axis shifts
 *   4. Apply shifts to faction_ideology table
 *   5. Snapshot to ideology_history
 *   6. Run drift detection (compare to previous tick)
 *   7. Fire hypocrisy events + approval penalties
 *
 * @param {object} supabase       - Supabase client
 * @param {object} nation         - Full nation row
 * @param {number} currentTick    - The new tick number
 * @param {Array}  resolutions    - Results from resolveExpiredVotes [{billId, result:'passed'|'failed', ...}]
 * @returns {Promise<Array>}      Array of drift/hypocrisy event objects
 */
async function processIdeologyTick(supabase, nation, currentTick, resolutions) {
    // 1. Get all player factions in this nation (NPCs don't have ideology rows)
    const { data: factions } = await supabase
        .from('factions')
        .select('id, faction_name, ideology_value_1, ideology_value_2')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party')
        .eq('is_npc', false);

    if (!factions || factions.length === 0) return [];

    // 2. Use bill IDs from resolutions (already resolved this tick)
    const resolvedBillIds = (resolutions || []).map(r => r.billId);
    const passedBillIds = new Set((resolutions || []).filter(r => r.result === 'passed').map(r => r.billId));

    // If no bills were resolved, still snapshot current scores for history
    if (resolvedBillIds.length === 0) {
        for (const faction of factions) {
            await snapshotIdeology(supabase, faction.id, currentTick);
        }
        return [];
    }

    // 3. Fetch full bill data (with articles + policies) for resolved bills
    const { data: allResolvedBills } = await supabase
        .from('bills')
        .select('*, bill_articles(*, policies(*))')
        .in('id', resolvedBillIds);

    if (!allResolvedBills || allResolvedBills.length === 0) {
        for (const faction of factions) {
            await snapshotIdeology(supabase, faction.id, currentTick);
        }
        return [];
    }

    // 4. Get all votes on resolved bills
    const { data: allVotes } = await supabase
        .from('bill_support')
        .select('bill_id, faction_id, stance')
        .in('bill_id', resolvedBillIds);
    const allEvents = [];

    // 4. Process each faction
    for (const faction of factions) {
        const factionVotes = (allVotes || []).filter(v => v.faction_id === faction.id);

        // Categorize bills by this faction's relationship
        const votedYesBills = [];
        const votedNoBills = [];
        const sponsoredBills = [];
        const passedBillsYesVote = [];

        for (const bill of allResolvedBills) {
            const vote = factionVotes.find(v => v.bill_id === bill.id);

            if (bill.proposed_by === faction.id) {
                sponsoredBills.push(bill);
            }

            if (vote?.stance === 'yes') {
                votedYesBills.push(bill);
                if (passedBillIds.has(bill.id)) {
                    passedBillsYesVote.push(bill);
                }
            } else if (vote?.stance === 'no') {
                votedNoBills.push(bill);
            }
        }

        // Skip if faction had zero involvement — still snapshot
        if (votedYesBills.length === 0 && votedNoBills.length === 0 && sponsoredBills.length === 0) {
            await snapshotIdeology(supabase, faction.id, currentTick);
            continue;
        }

        // 5. Load current ideology scores
        const ideologyRow = await loadFactionIdeology(supabase, faction.id);
        if (!ideologyRow) {
            console.warn(`No ideology row for ${faction.faction_name} (${faction.id}) — skipping`);
            continue;
        }

        const currentScores = extractAxisScores(ideologyRow);

        // 6. Calculate and apply shifts
        const shifts = calculateIdeologyShifts({
            votedYesBills,
            votedNoBills,
            sponsoredBills,
            passedBills: passedBillsYesVote
        });

        const newScores = applyIdeologyShifts(currentScores, shifts);

        // 7. Write updated scores to faction_ideology
        const updateObj = {};
        let hasChanges = false;
        for (const axis of IDEOLOGY_AXES) {
            if (newScores[axis.key] !== currentScores[axis.key]) {
                updateObj[axis.key] = newScores[axis.key];
                hasChanges = true;
            }
        }

        if (hasChanges) {
            const { error: updateError } = await supabase
                .from('faction_ideology')
                .update(updateObj)
                .eq('faction_id', faction.id);
            if (updateError) console.error(`Ideology update failed for ${faction.faction_name}:`, updateError.message);
        }

        // 8. Snapshot to ideology_history
        await snapshotIdeology(supabase, faction.id, currentTick, newScores);

        // 9. Drift detection
        const previousSnapshot = await loadPreviousIdeologySnapshot(supabase, faction.id, currentTick);
        if (previousSnapshot) {
            const previousScores = extractAxisScores(previousSnapshot);
            const driftEvents = detectIdeologyDrift(newScores, previousScores, ideologyRow, faction.faction_name);

            for (const evt of driftEvents) {
                allEvents.push({ ...evt, factionId: faction.id, factionName: faction.faction_name });

                // Log as civic event (non-blocking — event_log may have FK constraints)
                await supabase.from('event_log').insert({
                    nation_id: nation.id,
                    faction_id: faction.id,
                    event_name: evt.type === 'hypocrisy' ? 'IDEOLOGY_HYPOCRISY' : 'IDEOLOGY_DRIFT',
                    description_used: evt.message,
                    category: 'CIVIC',
                    effects_applied: {
                        type: evt.type, severity: evt.severity,
                        axis: evt.axisKey, delta: evt.delta, score: evt.score
                    },
                    fired_at_tick: currentTick
                }).then(({ error }) => {
                    if (error) console.warn('Ideology event log failed (non-blocking):', error.message);
                });

                // 10. Apply hypocrisy approval penalty
                if (evt.type === 'hypocrisy') {
                    let declaredDir = null;
                    if (ideologyRow.declared_axis_1 === evt.axisKey) declaredDir = ideologyRow.declared_direction_1;
                    else if (ideologyRow.declared_axis_2 === evt.axisKey) declaredDir = ideologyRow.declared_direction_2;

                    if (declaredDir !== null) {
                        const penalty = calculateHypocrisyPenalty(evt.score, declaredDir);
                        if (penalty < 0) {
                            const { data: fData } = await supabase
                                .from('factions').select('approval_rating').eq('id', faction.id).single();
                            if (fData) {
                                const newApproval = Math.max(0, (fData.approval_rating ?? 50) + penalty);
                                await supabase.from('factions')
                                    .update({ approval_rating: newApproval }).eq('id', faction.id);
                                console.log(`HYPOCRISY: ${faction.faction_name} approval ${fData.approval_rating} → ${newApproval} (${penalty})`);
                            }
                        }
                    }
                }
            }
        }

        // Log shift summary to console
        const shiftEntries = Object.entries(shifts).filter(([, v]) => v !== 0);
        if (shiftEntries.length > 0) {
            const shiftStr = shiftEntries.map(([axis, delta]) => {
                const axisDef = IDEOLOGY_AXES.find(a => a.key === axis);
                const label = delta < 0 ? axisDef?.leftLabel : axisDef?.rightLabel;
                return `${axis}: ${delta > 0 ? '+' : ''}${delta} → ${newScores[axis]} (${label})`;
            }).join(', ');
            console.log(`Ideology shifts for ${faction.faction_name}: ${shiftStr}`);
        }
    }

    return allEvents;
}

/**
 * Helper: snapshot a faction's current ideology scores to history.
 * If scores are not provided, loads them from faction_ideology.
 */
async function snapshotIdeology(supabase, factionId, tick, scores) {
    if (!scores) {
        const row = await loadFactionIdeology(supabase, factionId);
        if (!row) return;
        scores = extractAxisScores(row);
    }
    const historyRow = { faction_id: factionId, tick };
    for (const axis of IDEOLOGY_AXES) { historyRow[axis.key] = scores[axis.key]; }
    await supabase.from('ideology_history')
        .upsert(historyRow, { onConflict: 'faction_id,tick' })
        .then(({ error }) => { if (error) console.warn('Ideology snapshot error:', error.message); });
}


// ==================== BILL RESOLUTION ENGINE ====================

/**
 * Check all floor bills whose voting window has expired and resolve them.
 * Call this on laws.html load (or from a tick processor).
 *
 * @param {object} supabase  - Supabase client
 * @param {string} nationId  - Nation UUID
 * @returns {Promise<Array>} Array of { billId, result: 'passed'|'failed', ... }
 */
async function resolveExpiredVotes(supabase, nationId) {
    const { data: shard } = await supabase
        .from('shard')
        .select('current_tick')
        .eq('name', 'Alpha Shard')
        .single();
    if (!shard) return [];
    const currentTick = shard.current_tick;

    const { data: expiredBills, error } = await supabase
        .from('bills')
        .select('*, factions(faction_name, ideology_value_1, ideology_value_2), bill_articles(*, policies(*)), bill_support(*, factions(faction_name))')
        .eq('nation_id', nationId)
        .eq('status', 'floor')
        .lte('voting_ends_tick', currentTick);

    if (error || !expiredBills || expiredBills.length === 0) return [];

    const results = [];

    for (const bill of expiredBills) {
    const { data: nation } = await supabase
        .from('nations')
        .select('name')
        .eq('id', bill.nation_id)
        .single();
    let votesFor = 0, votesAgainst = 0;

        (bill.bill_support || []).forEach(s => {
            if (s.stance === 'yes') votesFor += s.seat_count;
            else if (s.stance === 'no') votesAgainst += s.seat_count;
        });

        const totalVoted = votesFor + votesAgainst;
        const passed = totalVoted > 0 && votesFor >= Math.ceil(GAME_CONFIG.TOTAL_SEATS * GAME_CONFIG.MAJORITY_THRESHOLD);

       if (passed) {
    await enactBill(supabase, bill, currentTick);
    await supabase.rpc('fire_system_event', {
        p_trigger_key: 'bill_passed',
        p_nation_id: bill.nation_id,
        p_tick: currentTick,
        p_placeholders: {
            nation: nation?.name || 'Unknown',
            bill_name: bill.bill_name,
            sponsor: bill.factions?.faction_name || 'Unknown',
            votes_for: String(votesFor),
            votes_against: String(votesAgainst),
            article_count: String((bill.bill_articles || []).length)
        }
    });
    results.push({ billId: bill.id, billName: bill.bill_name, result: 'passed', votesFor, votesAgainst });
} else {
    await failBill(supabase, bill);
    await supabase.rpc('fire_system_event', {
        p_trigger_key: 'bill_failed',
        p_nation_id: bill.nation_id,
        p_tick: currentTick,
        p_placeholders: {
            nation: nation?.name || 'Unknown',
            bill_name: bill.bill_name,
            sponsor: bill.factions?.faction_name || 'Unknown',
            votes_for: String(votesFor),
            votes_against: String(votesAgainst)
        }
    });
    results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed', votesFor, votesAgainst });
}
    }

    return results;
}

/**
 * Enact a passed bill:
 *  1. Mark bill as 'passed'
 *  2. For repeal bills: remove the targeted active law and reverse its stats
 *  3. For regular bills: add each policy article to active_laws
 *     - Auto-rescind opposed active policies (reverse their stats)
 *  4. Apply ideology penalties to sponsor
 *  5. Apply enactment approval to all voting parties
 *
 * @param {object} supabase    - Supabase client
 * @param {object} bill        - Full bill object with bill_articles, bill_support, factions
 * @param {number} currentTick - Current game tick
 */
async function enactBill(supabase, bill, currentTick) {
    // 1. Mark bill as passed
    await supabase.from('bills').update({
        status: 'passed',
        passed_tick: currentTick
    }).eq('id', bill.id);

    const { data: nation } = await supabase
        .from('nations')
        .select('*')
        .eq('id', bill.nation_id)
        .single();
    if (!nation) return;

    const { data: currentActiveLaws } = await supabase
        .from('active_laws')
        .select('*, policies(*)')
        .eq('nation_id', bill.nation_id);

    // 2. Handle REPEAL bills
    if (bill.bill_type === 'repeal' && bill.repeal_active_law_id) {
        const targetLaw = (currentActiveLaws || []).find(l => l.id === bill.repeal_active_law_id);
        if (targetLaw && targetLaw.policies) {
            await reversePolicy(supabase, nation, targetLaw.policies, targetLaw.passed_tick, currentTick);
            await supabase.from('active_laws').delete().eq('id', bill.repeal_active_law_id);
        }
    }
    // 3. Handle regular ENACT bills
    else {
        const articles = (bill.bill_articles || []).filter(a => a.policy_id);

        for (const art of articles) {
            const policy = art.policies;
            if (!policy) continue;

            if (policy.opposed_policy_ids && Array.isArray(policy.opposed_policy_ids)) {
                for (const opposedId of policy.opposed_policy_ids) {
                    const opposedLaw = (currentActiveLaws || []).find(l => l.policy_id === opposedId);
                    if (opposedLaw && opposedLaw.policies) {
                        await reversePolicy(supabase, nation, opposedLaw.policies, opposedLaw.passed_tick, currentTick);
                        await supabase.from('active_laws').delete().eq('id', opposedLaw.id);
                    }
                }
            }

            await supabase.from('active_laws').insert({
                nation_id: bill.nation_id,
                policy_id: policy.id,
                passed_tick: currentTick,
                proposed_by: bill.proposed_by,
                effects_applied_through_tick: currentTick
            });
        }
    }

    // 4. Ideology penalties for sponsor
    const sponsorFaction = bill.factions;
    if (sponsorFaction) {
        const opposed = countOpposedArticles(bill.bill_articles || [], sponsorFaction);
        if (opposed > 0) {
            const penalty = calculateIdeologyPenalty('passed', opposed, nation.polarization || 0);
            await applyIdeologyPenalty(supabase, bill.proposed_by, penalty);
        }
    }

    // 5. Enactment approval for all voting parties
    const approvalDeltas = calculateEnactmentApproval(
        nation,
        bill.bill_articles || [],
        bill.bill_support || [],
        bill.proposed_by
    );
    await applyEnactmentApproval(supabase, approvalDeltas);
}

/**
 * Schedule a gradual reversal of a policy's accumulated stat effects.
 * Called when a policy is rescinded (opposed auto-removal or repeal bill).
 *
 * @param {object} supabase    - Supabase client
 * @param {object} nation      - Full nation row
 * @param {object} policy      - Policy with stat_effects
 * @param {number} passedTick  - Tick when the policy was activated
 * @param {number} currentTick - Current tick
 */
async function reversePolicy(supabase, nation, policy, passedTick, currentTick) {
    const ticksActive = currentTick - (passedTick || 0);
    if (ticksActive <= 0) return;

    const sourceEffects = [];
    if (policy.stat_effects && Array.isArray(policy.stat_effects) && policy.stat_effects.length > 0) {
        sourceEffects.push(...policy.stat_effects);
    } else if (policy.target_stat) {
        sourceEffects.push({
            stat_key: policy.target_stat,
            direction: (policy.stat_direction || 'UP').toLowerCase(),
            rate: policy.stat_change_per_tick || 1,
            delay_ticks: 0,
            duration_ticks: policy.duration_months || 12
        });
    }

    if (sourceEffects.length === 0) return;

    const reversalEffects = [];

    for (const eff of sourceEffects) {
        const delay = eff.delay_ticks || 0;
        const duration = eff.duration_ticks || 12;

        let effectiveTicks = 0;
        if (ticksActive > delay) {
            effectiveTicks = Math.min(ticksActive - delay, duration);
        }

        if (effectiveTicks <= 0) continue;

        reversalEffects.push({
            stat_key: eff.stat_key,
            direction: eff.direction === 'up' ? 'down' : 'up',
            rate: eff.rate || 1,
            delay_ticks: 0,
            duration_ticks: effectiveTicks
        });
    }

    if (reversalEffects.length === 0) return;

    await supabase.from('active_laws').insert({
        nation_id: nation.id,
        policy_id: policy.id,
        passed_tick: currentTick,
        proposed_by: null,
        effects_applied_through_tick: currentTick,
        is_reversal: true,
        reversal_effects: reversalEffects
    });
}

/**
 * Mark a bill as failed.
 *
 * @param {object} supabase - Supabase client
 * @param {object} bill     - Full bill object
 */
async function failBill(supabase, bill) {
    await supabase.from('bills').update({
        status: 'failed'
    }).eq('id', bill.id);
}


// ==================== TICK PROCESSOR ====================

/**
 * Advance the game by one tick and process all effects.
 *
 * Call this from admin panel or automated scheduler.
 *
 * Flow:
 *   1.  Increment shard.current_tick
 *   2.  For each nation: process stat effects from active laws
 *   3.  For each nation: process ongoing costs from active laws
 *   4.  Resolve any expired floor votes
 *   5.  Process purge approval decay (autocracy)
 *   6.  Process faction loyalty (autocracy)
 *   7.  Auto-resolve stale shakeups (autocracy)
 *   8.  Process inactive parties
 *   9.  Snapshot nation stats to history
 *   10. Process random events
 *
 * @param {object} supabase - Supabase client
 * @returns {Promise<object>} Summary of what happened this tick
 */

/**
 * Process elections for a democracy nation during a tick.
 * - If an election is scheduled for this tick, run process_election RPC
 * - After completing, schedule the next election
 * - If no future election exists, create one
 */
async function processElections(supabase, nation, currentTick) {
    if (nation.government_type === 'Autocracy') return [];

    const results = [];

    // 1. Check for elections due this tick
    const { data: dueElections } = await supabase
        .from('elections')
        .select('*')
        .eq('nation_id', nation.id)
        .eq('status', 'scheduled')
        .lte('election_tick', currentTick);

    for (const election of (dueElections || [])) {
        console.log(`Processing election for ${nation.name} (tick ${currentTick})`);

        const { data, error } = await supabase.rpc('process_election', {
            election_nation_id: nation.id,
            election_id: election.id
        });

        if (error) {
            console.error('Election processing error:', error);
            continue;
        }

        results.push({
            electionId: election.id,
            nation: nation.name,
            result: data
        });
    }

    // 2. Ensure a future election is always scheduled
    const { data: futureElection } = await supabase
        .from('elections')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('status', 'scheduled')
        .gt('election_tick', currentTick)
        .limit(1)
        .maybeSingle();

    if (!futureElection) {
        const frequency = nation.election_frequency || 48;
        const nextTick = currentTick + frequency;

        await supabase.from('elections').insert({
            nation_id: nation.id,
            election_tick: nextTick,
            status: 'scheduled'
        });

        console.log(`Scheduled next election for ${nation.name} at tick ${nextTick}`);
    }

    return results;
}

async function advanceTick(supabase) {
    // 1. Increment tick
    const { data: shard } = await supabase
        .from('shard')
        .select('current_tick')
        .eq('name', 'Alpha Shard')
        .single();
    if (!shard) throw new Error('Shard not found');

    const newTick = (shard.current_tick || 0) + 1;
    await supabase.from('shard').update({ current_tick: newTick }).eq('name', 'Alpha Shard');

    // 2. Load all nations
    const { data: nations } = await supabase.from('nations').select('*');
    if (!nations || nations.length === 0) return { tick: newTick, nations: 0 };

    const summary = { tick: newTick, nations: nations.length, effects: [], costs: [], resolutions: [], events: [] };

    for (const nation of nations) {
        // 3. Process stat effects
        const effectResults = await processStatEffects(supabase, nation, newTick);
        if (effectResults.length > 0) summary.effects.push({ nation: nation.name, effects: effectResults });

        // 4. Process ongoing costs
        const costResult = await processOngoingCosts(supabase, nation, newTick);
        if (costResult.totalCost !== 0) summary.costs.push({ nation: nation.name, ...costResult });

        // 4b. Process elections (democracy only)
        const electionResults = await processElections(supabase, nation, newTick);
        if (electionResults.length > 0) {
            summary.elections = summary.elections || [];
            summary.elections.push({ nation: nation.name, elections: electionResults });
        }
        
        // 5. Resolve expired votes for this nation
        const resolutions = await resolveExpiredVotes(supabase, nation.id);
        if (resolutions.length > 0) summary.resolutions.push({ nation: nation.name, bills: resolutions });

        // 6. Process ideology shifts from this tick's votes/bills
        const ideologyEvents = await processIdeologyTick(supabase, nation, newTick, resolutions);
        if (ideologyEvents.length > 0) {
            summary.ideology = summary.ideology || [];
            summary.ideology.push({ nation: nation.name, events: ideologyEvents });
        }

        // 7. Process purge approval decay (autocracy scapegoat mechanic)
        if (nation.government_type === 'Autocracy') {
            await processPurgeDecay(supabase, nation.id, newTick);
        }

        // 8. Process faction loyalty (autocracy)
        if (nation.government_type === 'Autocracy') {
            await processLoyaltyTick(supabase, nation);
        }

        // 9. Auto-resolve shakeups that are 1+ ticks old
        if (nation.government_type === 'Autocracy') {
            await autoResolveStaleShakeups(supabase, nation.id, newTick);
        }

        // 10. Process inactive parties (12-tick warning, 24-tick deletion)
        const inactiveResults = await processInactiveParties(supabase, nation, newTick);
        if (inactiveResults.length > 0) summary.inactive = (summary.inactive || []).concat(inactiveResults);

        // 11. Snapshot nation stats to history (for trend arrows)
        await snapshotNationHistory(supabase, nation, newTick);

        // 12. Process random events
        const eventResults = await processEvents(supabase, nation, newTick);
        if (eventResults.length > 0) summary.events.push({ nation: nation.name, events: eventResults });
    }

    return summary;
}

/**
 * Process purge approval decay for autocracies.
 *
 * When a ruling faction purges a minister, they get a temporary approval boost.
 * This function applies -1 approval per tick until the decay is exhausted.
 *
 * @param {object} supabase    - Supabase client
 * @param {string} nationId    - Nation UUID
 * @param {number} currentTick - Current tick
 */
async function processPurgeDecay(supabase, nationId, currentTick) {
    const { data: purgeActions } = await supabase
        .from('campaign_actions')
        .select('id, party_id, result')
        .eq('nation_id', nationId)
        .eq('action_type', 'purge_minister');

    if (!purgeActions || purgeActions.length === 0) return;

    for (const action of purgeActions) {
        const result = action.result;
        if (!result || !result.decay_ticks_remaining || result.decay_ticks_remaining <= 0) continue;

        const decayRate = result.decay_rate || 1;

        const { data: faction } = await supabase
            .from('factions')
            .select('approval_rating')
            .eq('id', action.party_id)
            .single();

        if (faction) {
            const newApproval = Math.max(0, (faction.approval_rating ?? 50) - decayRate);
            await supabase.from('factions')
                .update({ approval_rating: newApproval })
                .eq('id', action.party_id);
        }

        const newRemaining = result.decay_ticks_remaining - 1;
        await supabase.from('campaign_actions')
            .update({ result: { ...result, decay_ticks_remaining: newRemaining } })
            .eq('id', action.id);
    }
}


// ==================== LOYALTY TICK PROCESSING ====================

/**
 * Process faction loyalty each tick for autocracies.
 *
 * Rules:
 * - Ruling faction: locked at 100
 * - Per ministry held: +0.5 loyalty per tick
 * - No ministries held: -2 loyalty per tick
 * - Natural drift: 1 point toward 50 per tick (above 50 = -1, below 50 = +1)
 * - Loyalty clamped 0–100
 *
 * @param {object} supabase - Supabase client
 * @param {object} nation   - Nation record (needs id, ruling_faction_id)
 */
async function processLoyaltyTick(supabase, nation) {
    const rulingId = nation.ruling_faction_id;
    if (!rulingId) return;

    const { data: factions } = await supabase
        .from('factions')
        .select('id, loyalty, seats')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');

    if (!factions || factions.length === 0) return;

    const { data: ministries } = await supabase
        .from('ministries')
        .select('party_id')
        .eq('nation_id', nation.id)
        .not('party_id', 'is', null);

    const ministryCounts = {};
    if (ministries) {
        for (const m of ministries) {
            ministryCounts[m.party_id] = (ministryCounts[m.party_id] || 0) + 1;
        }
    }

    for (const faction of factions) {
        let loyalty = faction.loyalty ?? 50;

        if (faction.id === rulingId) {
            if (loyalty !== 100) {
                await supabase.from('factions')
                    .update({ loyalty: 100 })
                    .eq('id', faction.id);
            }
            continue;
        }

        const ministryCount = ministryCounts[faction.id] || 0;

        if (ministryCount > 0) {
            loyalty += ministryCount * 0.5;
        } else {
            loyalty -= 2;
        }

        if (loyalty > 50) {
            loyalty -= 1;
        } else if (loyalty < 50) {
            loyalty += 1;
        }

        loyalty = Math.max(0, Math.min(100, Math.round(loyalty * 10) / 10));

        await supabase.from('factions')
            .update({ loyalty })
            .eq('id', faction.id);
    }
}


// ==================== SHAKEUP AUTO-RESOLVE ====================

/**
 * Auto-resolve shakeups that have been in 'voting' status for 1+ ticks.
 *
 * @param {object} supabase    - Supabase client
 * @param {string} nationId    - Nation UUID
 * @param {number} currentTick - Current tick
 */
async function autoResolveStaleShakeups(supabase, nationId, currentTick) {
    // Fetch all voting shakeups — filter by age in JS since we store created_at (timestamp), not created_tick
    const { data: votingShakeups } = await supabase
        .from('shakeups')
        .select('id, created_at')
        .eq('nation_id', nationId)
        .eq('status', 'voting');

    if (!votingShakeups || votingShakeups.length === 0) return;

    // Also grab the shard date info to estimate tick age
    // Shakeups older than 2 ticks get auto-resolved
    const AUTO_RESOLVE_TICKS = 2;

    for (const shakeup of votingShakeups) {
        // Try created_tick first (if column exists), fall back to created_at age estimate
        let tickAge = AUTO_RESOLVE_TICKS; // default: resolve if we can't determine age

        if (shakeup.created_tick != null) {
            tickAge = currentTick - shakeup.created_tick;
        } else if (shakeup.created_at) {
            // Estimate: each tick ≈ 1 month ≈ 30 days. If created_at is older than 2 "ticks" worth, resolve.
            const ageMs = Date.now() - new Date(shakeup.created_at).getTime();
            const ageDays = ageMs / (1000 * 60 * 60 * 24);
            // Be generous: if it's been more than 1 real day, it's definitely stale
            tickAge = ageDays >= 1 ? AUTO_RESOLVE_TICKS : 0;
        }

        if (tickAge >= AUTO_RESOLVE_TICKS) {
            console.log(`Auto-resolving stale shakeup ${shakeup.id} (age: ${tickAge} ticks, now tick ${currentTick})`);
            try {
                const { data, error } = await supabase.rpc('resolve_shakeup', { p_shakeup_id: shakeup.id });
                if (error) console.error('Auto-resolve shakeup error:', error);
                else console.log('Auto-resolve result:', data);
            } catch (e) {
                console.error('Auto-resolve shakeup exception:', e);
            }
        }
    }
}


// ==================== INACTIVE PARTY PROCESSING ====================

const INACTIVE_WARNING_TICKS = 12;
const INACTIVE_DELETION_TICKS = 24;

/**
 * Process inactive parties for a nation.
 *
 * - 12 ticks with no AP spent → approval set to 1% (one-time warning)
 * - 24 ticks with no AP spent → party deleted with full cascade
 *
 * @param {object} supabase    - Supabase client
 * @param {object} nation      - Full nation row
 * @param {number} currentTick - Current tick
 * @returns {Promise<Array>}   List of actions taken
 */
async function processInactiveParties(supabase, nation, currentTick) {
    const { data: parties } = await supabase
        .from('factions')
        .select('id, faction_name, seats, approval_rating, last_ap_spent_tick, is_npc')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');

    if (!parties || parties.length === 0) return [];

    const results = [];
    const partiesToDelete = [];

    for (const party of parties) {
        if (party.is_npc) continue;

        const lastActive = party.last_ap_spent_tick || 0;
        const ticksInactive = currentTick - lastActive;

        if (ticksInactive >= INACTIVE_DELETION_TICKS) {
            partiesToDelete.push(party);
            results.push({
                action: 'deleted',
                party: party.faction_name,
                partyId: party.id,
                ticksInactive
            });
        } else if (ticksInactive >= INACTIVE_WARNING_TICKS) {
            if (party.approval_rating > 1) {
                await supabase.from('factions')
                    .update({ approval_rating: 1 })
                    .eq('id', party.id);
                results.push({
                    action: 'warned',
                    party: party.faction_name,
                    partyId: party.id,
                    ticksInactive,
                    oldApproval: party.approval_rating
                });
            }
        }
    }

    for (const party of partiesToDelete) {
        await deleteInactiveParty(supabase, nation, party, parties, currentTick);
    }

    return results;
}

/**
 * Delete an inactive party and handle all cascading effects.
 *
 * @param {object} supabase    - Supabase client
 * @param {object} nation      - Full nation row
 * @param {object} party       - The party being deleted
 * @param {Array}  allParties  - All parties in the nation (for redistribution)
 * @param {number} currentTick - Current tick
 */
async function deleteInactiveParty(supabase, nation, party, allParties, currentTick) {
    const partyId = party.id;
    const seatsToRedistribute = party.seats || 0;
    const isAutocracy = nation.government_type === 'Autocracy';

    const survivors = allParties.filter(p => p.id !== partyId && !p.is_npc);

    // 1. REDISTRIBUTE SEATS proportionally to remaining parties
    if (seatsToRedistribute > 0 && survivors.length > 0) {
        const totalSurvivorSeats = survivors.reduce((sum, p) => sum + (p.seats || 0), 0);

        let seatsGiven = 0;
        for (let i = 0; i < survivors.length; i++) {
            const s = survivors[i];
            let share;

            if (i === survivors.length - 1) {
                share = seatsToRedistribute - seatsGiven;
            } else if (totalSurvivorSeats > 0) {
                share = Math.floor(seatsToRedistribute * ((s.seats || 0) / totalSurvivorSeats));
            } else {
                share = Math.floor(seatsToRedistribute / survivors.length);
            }

            if (share > 0) {
                await supabase.from('factions')
                    .update({ seats: (s.seats || 0) + share })
                    .eq('id', s.id);
                seatsGiven += share;
            }
        }
    }

    // 2. VACATE MINISTERS held by this party
    await supabase.from('ministries')
        .update({
            minister_first_name: null,
            minister_last_name: null,
            minister_age: null,
            party_id: null
        })
        .eq('nation_id', nation.id)
        .eq('party_id', partyId);

    // 3. WITHDRAW ACTIVE BILLS
    await supabase.from('bills')
        .update({ status: 'abandoned' })
        .eq('proposed_by', partyId)
        .in('status', ['draft', 'committee', 'floor']);

    // 4. REMOVE BILL SUPPORT VOTES and recalculate tallies
    const { data: supportVotes } = await supabase
        .from('bill_support')
        .select('bill_id')
        .eq('faction_id', partyId);

    const affectedBillIds = [...new Set((supportVotes || []).map(v => v.bill_id))];

    await supabase.from('bill_support')
        .delete()
        .eq('faction_id', partyId);

    for (const billId of affectedBillIds) {
        await syncVoteTallies(supabase, billId);
    }

    // 5. DELETE MINISTRY REQUESTS
    await supabase.from('ministry_requests')
        .delete()
        .eq('faction_id', partyId);

    // 6. REMOVE FROM COALITION
    const { data: coalitions } = await supabase
        .from('government_formations')
        .select('id, party_ids, ministry_assignments')
        .eq('nation_id', nation.id)
        .eq('status', 'formed');

    for (const coal of (coalitions || [])) {
        if (coal.party_ids && coal.party_ids.includes(partyId)) {
            const newPartyIds = coal.party_ids.filter(id => id !== partyId);

            const newAssignments = { ...(coal.ministry_assignments || {}) };
            for (const [key, val] of Object.entries(newAssignments)) {
                if (val === partyId) delete newAssignments[key];
            }

            if (newPartyIds.length === 0) {
                await supabase.from('government_formations')
                    .update({ status: 'collapsed' })
                    .eq('id', coal.id);
            } else {
                await supabase.from('government_formations')
                    .update({
                        party_ids: newPartyIds,
                        ministry_assignments: newAssignments
                    })
                    .eq('id', coal.id);
            }
        }
    }

    // 7. HANDLE RULING FACTION in autocracy
    if (isAutocracy && nation.ruling_faction_id === partyId) {
        const nextRuler = survivors
            .sort((a, b) => (b.seats || 0) - (a.seats || 0))[0];

        if (nextRuler) {
            await supabase.from('nations')
                .update({ ruling_faction_id: nextRuler.id })
                .eq('id', nation.id);
        } else {
            await supabase.from('nations')
                .update({ ruling_faction_id: null })
                .eq('id', nation.id);
        }
    }

    // 8. DELETE CAMPAIGN ACTIONS history
    await supabase.from('campaign_actions')
        .delete()
        .eq('party_id', partyId);

    // 9. CLEAN UP IDEOLOGY DATA
    await supabase.from('faction_ideology')
        .delete()
        .eq('faction_id', partyId);
    await supabase.from('ideology_history')
        .delete()
        .eq('faction_id', partyId);

    // 10. DELETE THE PARTY
    await supabase.from('factions')
        .delete()
        .eq('id', partyId);

    console.log(`Deleted inactive party: ${party.faction_name} (${partyId}) from ${nation.name}`);
}


/**
 * Process stat effects for all active laws in a nation for the current tick.
 *
 * @param {object} supabase    - Supabase client
 * @param {object} nation      - Full nation row
 * @param {number} currentTick - The new tick number
 * @returns {Promise<Array>}   List of effects applied
 */
async function processStatEffects(supabase, nation, currentTick) {
    const { data: activeLaws } = await supabase
        .from('active_laws')
        .select('*, policies(*)')
        .eq('nation_id', nation.id);

    if (!activeLaws || activeLaws.length === 0) return [];

    const appliedEffects = [];
    const nationUpdates = {};
    const lawsToDelete = [];

    for (const law of activeLaws) {
        const policy = law.policies;
        const lastApplied = law.effects_applied_through_tick || 0;
        if (lastApplied >= currentTick) continue;

        const passedTick = law.passed_tick || 0;

        let effects = [];
        const isReversal = law.is_reversal || false;

        if (isReversal && law.reversal_effects && Array.isArray(law.reversal_effects)) {
            effects = law.reversal_effects;
        } else if (policy) {
            if (policy.stat_effects && Array.isArray(policy.stat_effects) && policy.stat_effects.length > 0) {
                effects.push(...policy.stat_effects);
            } else if (policy.target_stat) {
                effects.push({
                    stat_key: policy.target_stat,
                    direction: (policy.stat_direction || 'UP').toLowerCase(),
                    rate: policy.stat_change_per_tick || 1,
                    delay_ticks: 0,
                    duration_ticks: policy.duration_months || 12
                });
            }
        }

        if (effects.length === 0) {
            await supabase.from('active_laws').update({ effects_applied_through_tick: currentTick }).eq('id', law.id);
            continue;
        }

        let anyEffectApplied = false;
        let allEffectsComplete = true;

        for (let tick = lastApplied + 1; tick <= currentTick; tick++) {
            const ticksSincePassed = tick - passedTick;

            for (const eff of effects) {
                const delay = eff.delay_ticks || 0;
                const duration = eff.duration_ticks || 12;
                const rate = eff.rate || 1;
                const statKey = eff.stat_key;

                if (ticksSincePassed <= delay + duration) {
                    allEffectsComplete = false;
                }

                if (ticksSincePassed > delay && ticksSincePassed <= delay + duration) {
                    const currentVal = nationUpdates[statKey] !== undefined
                        ? nationUpdates[statKey]
                        : (nation[statKey] !== undefined && nation[statKey] !== null ? Number(nation[statKey]) : 50);

                    let newVal;
                    if (eff.direction === 'up') {
                        newVal = currentVal + rate;
                    } else {
                        newVal = currentVal - rate;
                    }

                    newVal = Math.max(0, Math.min(100, newVal));
                    nationUpdates[statKey] = newVal;
                    anyEffectApplied = true;

                    appliedEffects.push({
                        policy: isReversal ? '↩ Reversal: ' + (policy?.policy_name || 'Unknown') : (policy?.policy_name || 'Unknown'),
                        stat: statKey,
                        direction: eff.direction,
                        rate: rate,
                        tick: tick,
                        newValue: newVal
                    });
                }
            }
        }

        await supabase.from('active_laws').update({
            effects_applied_through_tick: currentTick
        }).eq('id', law.id);

        if (isReversal && allEffectsComplete) {
            lawsToDelete.push(law.id);
        }
    }

    if (Object.keys(nationUpdates).length > 0) {
        await supabase.from('nations').update(nationUpdates).eq('id', nation.id);
    }

    for (const id of lawsToDelete) {
        await supabase.from('active_laws').delete().eq('id', id);
    }

    return appliedEffects;
}

/**
 * Process ongoing costs for all active laws in a nation.
 *
 * @param {object} supabase    - Supabase client
 * @param {object} nation      - Full nation row
 * @param {number} currentTick - Current tick
 * @returns {Promise<object>}  { totalCost, details }
 */
async function processOngoingCosts(supabase, nation, currentTick) {
    const { data: activeLaws } = await supabase
        .from('active_laws')
        .select('*, policies(*)')
        .eq('nation_id', nation.id);

    if (!activeLaws || activeLaws.length === 0) return { totalCost: 0, details: [] };

    let totalCost = 0;
    const details = [];

    for (const law of activeLaws) {
        const policy = law.policies;
        if (!policy) continue;

        const baseCost = policy.ongoing_base_cost || policy.ongoing_cost_per_tick || 0;
        if (baseCost === 0) continue;

        let tickCost = baseCost;

        if (policy.ongoing_scaling_stat && nation[policy.ongoing_scaling_stat] !== undefined) {
            const scalingVal = Number(nation[policy.ongoing_scaling_stat]) || 1;
            const divisor = RAW_SCALING_DIVISORS[policy.ongoing_scaling_stat] || 50;
            tickCost = baseCost * (scalingVal / divisor);
        }

        totalCost += tickCost;

        const newAccum = (law.ongoing_accumulated || 0) + tickCost;
        await supabase.from('active_laws').update({
            ongoing_accumulated: newAccum
        }).eq('id', law.id);

        details.push({ policy: policy.policy_name, cost: tickCost });
    }

    if (totalCost !== 0) {
        const currentBudget = nation.budget || 0;
        const newBudget = currentBudget - totalCost;
        await supabase.from('nations').update({ budget: newBudget }).eq('id', nation.id);
    }

    return { totalCost, details };
}

/**
 * Save a snapshot of nation stats for trend tracking.
 *
 * @param {object} supabase    - Supabase client
 * @param {object} nation      - Full nation row
 * @param {number} currentTick - Current tick
 */
async function snapshotNationHistory(supabase, nation, currentTick) {
    const snapshot = { nation_id: nation.id, tick: currentTick };

    const exclude = ['id', 'name', 'capital', 'government_type', 'created_at', 'updated_at', 'shard_id'];
    for (const [key, val] of Object.entries(nation)) {
        if (!exclude.includes(key) && typeof val === 'number') {
            snapshot[key] = val;
        }
    }

    await supabase.from('nations_history').upsert(snapshot, {
        onConflict: 'nation_id,tick'
    }).catch(err => {
        console.warn('History snapshot warning:', err.message);
    });
}


// ==================== EVENT TICK PROCESSOR ====================

/**
 * Process random events for a nation during a tick.
 *
 * @param {object} supabase    - Supabase client
 * @param {object} nation      - Full nation row (with current stat values)
 * @param {number} currentTick - Current tick number
 * @returns {Promise<Array>}   List of events that fired
 */
async function processEvents(supabase, nation, currentTick) {
    const { data: events } = await supabase
        .from('event_templates')
        .select('*, event_descriptions(*), event_triggers(*), event_effects(*)')
        .eq('is_active', true);

    if (!events || events.length === 0) return [];

    const { data: recentLog } = await supabase
        .from('event_log')
        .select('event_id, fired_at_tick')
        .eq('nation_id', nation.id)
        .order('fired_at_tick', { ascending: false })
        .limit(200);

    const lastFiredMap = {};
    for (const entry of (recentLog || [])) {
        if (!lastFiredMap[entry.event_id]) {
            lastFiredMap[entry.event_id] = entry.fired_at_tick;
        }
    }

    const firedEvents = [];

    for (const event of events) {
        // Cooldown check
        const lastFired = lastFiredMap[event.id];
        if (lastFired !== undefined) {
            const ticksSince = currentTick - lastFired;
            if (ticksSince < event.cooldown_ticks) continue;
        }

        // Trigger check — ALL must be met
        const triggers = event.event_triggers || [];
        if (triggers.length === 0) continue;

        let allTriggersPass = true;
        for (const trigger of triggers) {
            const statValue = nation[trigger.stat_key];
            if (statValue === null || statValue === undefined) {
                allTriggersPass = false;
                break;
            }
            const val = Number(statValue);
            if (trigger.min_value !== null && trigger.min_value !== undefined && val < trigger.min_value) {
                allTriggersPass = false;
                break;
            }
            if (trigger.max_value !== null && trigger.max_value !== undefined && val > trigger.max_value) {
                allTriggersPass = false;
                break;
            }
        }
        if (!allTriggersPass) continue;

        // Probability roll
        const roll = Math.random() * 100;
        if (roll >= event.probability) continue;

        // === EVENT FIRES ===

        // Pick random description
        const descriptions = event.event_descriptions || [];
        const description = descriptions.length > 0
            ? descriptions[Math.floor(Math.random() * descriptions.length)].description_text
            : event.name;

        // Apply effects
        const effects = event.event_effects || [];
        const appliedEffects = [];
        const nationUpdates = {};

        for (const effect of effects) {
            if (effect.target === 'nation') {
                const currentVal = nation[effect.stat_key] !== undefined
                    ? Number(nation[effect.stat_key]) : 50;
                const newVal = Math.max(0, Math.min(100, currentVal + effect.change_value));
                nationUpdates[effect.stat_key] = newVal;
                nation[effect.stat_key] = newVal;

                appliedEffects.push({
                    stat: effect.stat_key,
                    change: effect.change_value,
                    target: 'nation',
                    old: currentVal,
                    new: newVal
                });

            } else if (effect.target === 'ruling_party') {
                const rulingId = nation.ruling_faction_id;
                if (!rulingId) continue;

                const { data: faction } = await supabase
                    .from('factions')
                    .select(effect.stat_key)
                    .eq('id', rulingId)
                    .single();

                if (faction) {
                    const currentVal = faction[effect.stat_key] ?? 50;
                    const newVal = Math.max(0, Math.min(100, currentVal + effect.change_value));
                    await supabase.from('factions')
                        .update({ [effect.stat_key]: newVal })
                        .eq('id', rulingId);

                    appliedEffects.push({
                        stat: effect.stat_key,
                        change: effect.change_value,
                        target: 'ruling_party',
                        faction_id: rulingId,
                        old: currentVal,
                        new: newVal
                    });
                }

            } else if (effect.target === 'random_faction') {
                const { data: factions } = await supabase
                    .from('factions')
                    .select('id, ' + effect.stat_key)
                    .eq('nation_id', nation.id)
                    .eq('faction_type', 'party')
                    .eq('is_npc', false);

                if (factions && factions.length > 0) {
                    const target = factions[Math.floor(Math.random() * factions.length)];
                    const currentVal = target[effect.stat_key] ?? 50;
                    const newVal = Math.max(0, Math.min(100, currentVal + effect.change_value));
                    await supabase.from('factions')
                        .update({ [effect.stat_key]: newVal })
                        .eq('id', target.id);

                    appliedEffects.push({
                        stat: effect.stat_key,
                        change: effect.change_value,
                        target: 'random_faction',
                        faction_id: target.id,
                        old: currentVal,
                        new: newVal
                    });
                }
            }
        }

        if (Object.keys(nationUpdates).length > 0) {
            await supabase.from('nations').update(nationUpdates).eq('id', nation.id);
        }

        // Log the event
        const targetFactionId = appliedEffects.find(e => e.faction_id)?.faction_id || null;
        await supabase.from('event_log').insert({
            event_id: event.id,
            nation_id: nation.id,
            event_name: event.name,
            faction_id: targetFactionId,
            description_used: description,
            effects_applied: appliedEffects,
            category: event.category,
            fired_at_tick: currentTick
        });

        firedEvents.push({
            eventName: event.name,
            category: event.category,
            description: description,
            effects: appliedEffects
        });

        console.log(`Event fired: "${event.name}" in ${nation.name} (tick ${currentTick})`);
    }

    return firedEvents;
}


// ==================== INACTIVITY CLOCK ====================

/**
 * Mark a faction as active by updating last_ap_spent_tick.
 * Call this whenever a faction spends AP on any action.
 *
 * @param {object} supabase      - Supabase client
 * @param {string} factionId     - Faction UUID
 * @param {number} [currentTick] - Current game tick (auto-fetched if omitted)
 */
async function markFactionActive(supabase, factionId, currentTick) {
    if (!factionId) return;
    if (!currentTick) {
        const { data: shard } = await supabase
            .from('shard').select('current_tick').eq('name', 'Alpha Shard').single();
        currentTick = shard?.current_tick || 0;
    }
    await supabase.from('factions')
        .update({ last_ap_spent_tick: currentTick })
        .eq('id', factionId);
}


// ==================== UTILITY FORMATTERS ====================

function formatStatName(stat) {
    return stat.charAt(0).toUpperCase() + stat.slice(1).replace(/_/g, ' ');
}

function formatMinorSector(key) {
    return key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
