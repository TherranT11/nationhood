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
 *   - Government vacancy penalties & snap elections
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
    VETO_APPROVAL_COST: 3,
    NO_CONFIDENCE_AP_COST: 5,
    NO_CONFIDENCE_VOTING_TICKS: 2,
    NO_CONFIDENCE_COOLDOWN_TICKS: 6,
    FOUNDATIONAL_AP_COST: 3,
    FOUNDATIONAL_VOTING_TICKS: 3,
    SUPERMAJORITY_THRESHOLD: 2/3,
    EARLY_ELECTION_TICKS: 2,
    EARLY_ELECTION_PM_APPROVAL_COST: 5,
    EARLY_ELECTION_COALITION_APPROVAL_COST: 3,
    // Presidential Democracy
    PRESIDENTIAL_TERM_TICKS: 24,
    PARLIAMENTARY_TERM_TICKS: 12,
    VETO_OVERRIDE_THRESHOLD: 2/3,
    PRESIDENT_DESK_TICKS: 2,
    MINISTER_CONFIRMATION_VOTING_TICKS: 2,
    PRESIDENTIAL_CANDIDATE_LEAD_TICKS: 6  // ticks before presidential election to generate candidates
};

/**
 * Update GAME_CONFIG with nation-specific seat values.
 * Call after loading the nation on each page.
 */
function initGameConfigForNation(nation) {
    if (nation && nation.total_seats) {
        GAME_CONFIG.TOTAL_SEATS = nation.total_seats;
        GAME_CONFIG.MAJORITY_SEATS = Math.ceil(nation.total_seats * GAME_CONFIG.MAJORITY_THRESHOLD);
    }
}

const FORMATION_DEADLINE_TICKS = 6; // ticks before snap election when no government

/**
 * Government type helpers.
 * Call with a nation object (must have government_type field).
 */
function isGovernmentAutocracy(nation) { return nation?.government_type === 'Autocracy'; }
function isGovernmentPresidential(nation) { return nation?.government_type === 'Presidential'; }

// ==================== DIPLOMACY CONSTANTS ====================

const DIPLOMACY_CONFIG = {
    // Ambassador actions
    FORMAL_PROTEST_AP: 2,
    PROPOSE_INITIATIVE_AP: 3,
    COVERT_OP_AP: 4,

    // Foreign Minister actions
    RECALL_AMBASSADOR_AP: 2,
    IMPOSE_EMBARGO_AP: 5,
    FOREIGN_AID_AP: 4,
    ISSUE_ULTIMATUM_AP: 3,

    // Head of Government actions
    DECLARE_WAR_AP: 8,
    SUE_FOR_PEACE_AP: 4,
    SIGN_ALLIANCE_AP: 6,

    // Timing
    FM_REVIEW_EXPIRY_TICKS: 3,
    ULTIMATUM_DEADLINE_TICKS: 3,
    STATE_VISIT_ACCEPT_WINDOW: 2,
    STATE_VISIT_COOLDOWN: 6,
    TREATY_RATIFICATION_VOTING_TICKS: 3,
    AMBASSADOR_CONFIRMATION_VOTING_TICKS: 2,

    // War stat penalties (per tick)
    WAR_STABILITY_DRAIN: 2,
    WAR_CIVIL_UNREST_GAIN: 3,
    WAR_TRADE_DRAIN: 2,
    WAR_REPUTATION_DRAIN: 1,

    // Reputation costs
    WAR_WITH_JUSTIFICATION_REP_COST: 3,
    WAR_WITHOUT_JUSTIFICATION_REP_COST: 10,
    FORMAL_PROTEST_TARGET_REP_COST: 1,

    // Covert operation success thresholds (0-1, higher = harder)
    COVERT_INTEL_THRESHOLD: 0.45,
    COVERT_PROPAGANDA_THRESHOLD: 0.55,
    COVERT_BRIBE_THRESHOLD: 0.60
};

/**
 * Diplomatic proposal types with tier classification.
 * Tier 1 = Minor (ambassador approves directly)
 * Tier 2 = FM approval needed (no bill)
 * Tier 3 = Requires Parliament ratification bill
 */
const PROPOSAL_TYPES = {
    // === Tier 1: Minor — Ambassador approves directly ===
    cultural_exchange: {
        tier: 1,
        label: 'Cultural Exchange',
        description: 'Establish cultural exchange programs between nations.',
        stat_effects: [
            { stat_key: 'international_reputation', direction: 'up', rate: 1, delay_ticks: 0, duration_ticks: 1 }
        ]
    },
    visa_agreement: {
        tier: 1,
        label: 'Visa Agreement',
        description: 'Simplify visa requirements for travel between nations.',
        stat_effects: [
            { stat_key: 'tourism', direction: 'up', rate: 1, delay_ticks: 0, duration_ticks: 1 },
            { stat_key: 'immigration', direction: 'up', rate: 1, delay_ticks: 0, duration_ticks: 1 }
        ]
    },
    joint_statement: {
        tier: 1,
        label: 'Joint Statement',
        description: 'Issue a joint diplomatic statement signaling cooperation.',
        stat_effects: []  // Purely cosmetic — shows in event feeds
    },
    student_exchange: {
        tier: 1,
        label: 'Student Exchange',
        description: 'Create student exchange programs to boost education.',
        stat_effects: [
            { stat_key: 'education_quality', direction: 'up', rate: 1, delay_ticks: 0, duration_ticks: 1 }
        ]
    },

    // === Tier 3: Major — Escalates to FM, then Parliament ratification bill ===
    trade_agreement: {
        tier: 3,
        label: 'Trade Agreement',
        description: 'Establish a formal trade agreement affecting GDP and trade volume.',
        stat_effects: [
            { stat_key: 'gdp', direction: 'up', rate: 1, delay_ticks: 1, duration_ticks: 0 },
            { stat_key: 'trade', direction: 'up', rate: 2, delay_ticks: 0, duration_ticks: 0 }
        ]
    },
    non_aggression_pact: {
        tier: 3,
        label: 'Non-Aggression Pact',
        description: 'Binding commitment not to declare war for a set period.',
        stat_effects: [
            { stat_key: 'stability', direction: 'up', rate: 1, delay_ticks: 0, duration_ticks: 1 },
            { stat_key: 'international_reputation', direction: 'up', rate: 1, delay_ticks: 0, duration_ticks: 1 }
        ]
    },
    military_alliance: {
        tier: 3,
        label: 'Military Alliance',
        description: 'Mutual defense pact — if one is attacked, the other must respond.',
        stat_effects: [
            { stat_key: 'military_strength', direction: 'up', rate: 2, delay_ticks: 0, duration_ticks: 0 },
            { stat_key: 'international_reputation', direction: 'up', rate: 1, delay_ticks: 0, duration_ticks: 1 }
        ]
    },
    embargo: {
        tier: 3,
        label: 'Embargo/Sanctions',
        description: 'Economic warfare — tanks target trade stats, also hurts your own.',
        stat_effects: [
            { stat_key: 'trade', direction: 'down', rate: 3, delay_ticks: 0, duration_ticks: 0 },
            { stat_key: 'sanctions', direction: 'up', rate: 3, delay_ticks: 0, duration_ticks: 0 }
        ]
    },
    ceasefire: {
        tier: 3,
        label: 'Ceasefire',
        description: 'Stop active conflict between warring nations.',
        requires_war: true,
        stat_effects: [
            { stat_key: 'stability', direction: 'up', rate: 2, delay_ticks: 0, duration_ticks: 1 },
            { stat_key: 'civil_unrest', direction: 'down', rate: 2, delay_ticks: 0, duration_ticks: 1 }
        ]
    },
    open_borders: {
        tier: 3,
        label: 'Open Borders',
        description: 'Major immigration and security implications — open borders between nations.',
        stat_effects: [
            { stat_key: 'immigration', direction: 'up', rate: 3, delay_ticks: 0, duration_ticks: 0 },
            { stat_key: 'trade', direction: 'up', rate: 1, delay_ticks: 0, duration_ticks: 0 }
        ]
    },
    close_embassy: {
        tier: 3,
        label: 'Close Embassy',
        description: 'Shut down diplomatic presence in the target nation.',
        stat_effects: [
            { stat_key: 'international_reputation', direction: 'down', rate: 2, delay_ticks: 0, duration_ticks: 1 }
        ]
    }
};

// War justification types — required for declaring war without massive reputation penalty
const WAR_JUSTIFICATIONS = {
    ultimatum_ignored:    { label: 'Ignored Ultimatum',     description: 'A formal ultimatum was ignored by the target nation.' },
    caught_spy:           { label: 'Caught Spy',            description: 'A covert agent from the target nation was caught operating in your territory.' },
    broken_treaty:        { label: 'Broken Treaty',         description: 'The target nation violated an existing treaty or agreement.' },
    attacked:             { label: 'Attacked',              description: 'Your nation was attacked by the target nation.' },
    alliance_obligation:  { label: 'Alliance Obligation',   description: 'An allied nation was attacked, triggering mutual defense obligations.' }
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
const RAW_SCALING_DIVISORS = {
    population: 1_000_000,
    gdp: 1_000_000_000,
    debt: 1_000_000_000
};

// Ideology spectrum opposites
const IDEOLOGY_OPPOSITES = {
    'LIBERTY': 'EQUALITY',           'EQUALITY': 'LIBERTY',
    'FREEDOM': 'SECURITY',           'SECURITY': 'FREEDOM',
    'TRADITION': 'PROGRESS',         'PROGRESS': 'TRADITION',
    'GLOBALISM': 'NATIONALISM',      'NATIONALISM': 'GLOBALISM',
    'INDIVIDUALISM': 'COLLECTIVISM', 'COLLECTIVISM': 'INDIVIDUALISM'
};


// ==================== DYNAMIC IDEOLOGY SYSTEM ====================

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

const IDEOLOGY_TO_AXIS = {};
for (const axis of IDEOLOGY_AXES) {
    IDEOLOGY_TO_AXIS[axis.left]  = { axisKey: axis.key, direction: -1 };
    IDEOLOGY_TO_AXIS[axis.right] = { axisKey: axis.key, direction: +1 };
}


// ==================== IDEOLOGY LABELS ====================

const IDEOLOGY_LABEL_THRESHOLDS = [
    { min: 0,  max: 10,  label: 'Centrist' },
    { min: 11, max: 30,  label: 'Leaning' },
    { min: 31, max: 60,  label: 'Strong' },
    { min: 61, max: 100, label: 'Radical' }
];

function getIdeologyLabel(score, axisDef) {
    const abs = Math.abs(score);
    const threshold = IDEOLOGY_LABEL_THRESHOLDS.find(t => abs >= t.min && abs <= t.max);
    const intensityLabel = threshold ? threshold.label : 'Centrist';

    if (intensityLabel === 'Centrist') return 'Centrist';

    const sideName = score < 0 ? axisDef.leftLabel : axisDef.rightLabel;
    return `${intensityLabel} ${sideName}`;
}

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

const IDEOLOGY_POINT_VALUES = {
    VOTE_YES:     3,
    PROPOSED:     3,
    BILL_PASSED:  4
};

function calculateIdeologyShifts({ votedYesBills = [], proposedBills = [], passedBills = [] }) {
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

    for (const bill of votedYesBills) {
        const tags = getArticleIdeologies(bill);
        for (const tag of tags) {
            const mapping = IDEOLOGY_TO_AXIS[tag];
            if (mapping) addShift(mapping.axisKey, mapping.direction * IDEOLOGY_POINT_VALUES.VOTE_YES);
        }
    }

    for (const bill of proposedBills) {
        const tags = getArticleIdeologies(bill);
        for (const tag of tags) {
            const mapping = IDEOLOGY_TO_AXIS[tag];
            if (mapping) addShift(mapping.axisKey, mapping.direction * IDEOLOGY_POINT_VALUES.PROPOSED);
        }
    }

    for (const bill of passedBills) {
        const tags = getArticleIdeologies(bill);
        for (const tag of tags) {
            const mapping = IDEOLOGY_TO_AXIS[tag];
            if (mapping) addShift(mapping.axisKey, mapping.direction * IDEOLOGY_POINT_VALUES.BILL_PASSED);
        }
    }

    return shifts;
}

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

const DRIFT_THRESHOLDS = {
    MINOR:  3,
    MAJOR:  6,
    EXTREME: 10
};

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

    // Hypocrisy detection
    const declaredAxes = [];
    if (ideologyRow.declared_axis_1) {
        declaredAxes.push({ axisKey: ideologyRow.declared_axis_1, declaredDirection: ideologyRow.declared_direction_1 });
    }
    if (ideologyRow.declared_axis_2) {
        declaredAxes.push({ axisKey: ideologyRow.declared_axis_2, declaredDirection: ideologyRow.declared_direction_2 });
    }

    for (const decl of declaredAxes) {
        const current = currentScores[decl.axisKey] || 0;
        const previous = previousScores[decl.axisKey] || 0;
        const declaredSign = decl.declaredDirection > 0 ? 1 : -1;

        const currentSign = current === 0 ? 0 : (current > 0 ? 1 : -1);
        const previousSign = previous === 0 ? 0 : (previous > 0 ? 1 : -1);

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


// ==================== DYNAMIC OPPOSITION PENALTY ====================

function calculateDynamicOppositionPenalty(factionIdeology, policyIdeologyTag, basePenalty = 2) {
    const tag = policyIdeologyTag.toUpperCase();
    const mapping = IDEOLOGY_TO_AXIS[tag];
    if (!mapping) return 0;

    const factionScore = factionIdeology[mapping.axisKey] || 0;
    const policyDirection = mapping.direction;
    const oppositionScore = -policyDirection * factionScore;

    if (oppositionScore <= 0) return 0;

    const penaltyScale = oppositionScore / 100;
    return -Math.round(basePenalty * penaltyScale * 10) / 10;
}

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

async function loadFactionIdeology(supabase, factionId) {
    const cacheKey = 'faction_ideo_' + factionId;
    if (typeof qCache === 'function') {
        const cached = qCache(cacheKey);
        if (cached) return cached;
    }
    const { data, error } = await supabase
        .from('faction_ideology')
        .select('*')
        .eq('faction_id', factionId)
        .maybeSingle();

    if (error) {
        console.error('Error loading faction ideology:', error);
        return null;
    }
    if (data && typeof qCacheSet === 'function') qCacheSet(cacheKey, data, 2 * 60 * 1000);
    return data;
}

async function loadNationIdeologies(supabase, nationId) {
    const cacheKey = 'nation_ideos_' + nationId;
    if (typeof qCache === 'function') {
        const cached = qCache(cacheKey);
        if (cached) return cached;
    }
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
    const result = data || [];
    if (result.length && typeof qCacheSet === 'function') qCacheSet(cacheKey, result, 2 * 60 * 1000);
    return result;
}

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

function extractAxisScores(ideologyRow) {
    const scores = {};
    for (const axis of IDEOLOGY_AXES) {
        scores[axis.key] = ideologyRow[axis.key] || 0;
    }
    return scores;
}


// ==================== SEAT LOADING ====================

async function loadSeats(supabase, nationId, isAutocracy, allParties, currentFactionId) {
    const allPartySeats = {};

    if (isAutocracy) {
        allParties.forEach(p => {
            allPartySeats[p.id] = p.seats || 0;
        });
    } else {
        const cacheKey = 'seats_' + nationId;
        let election = null;
        if (typeof qCache === 'function') {
            const cached = qCache(cacheKey);
            if (cached) { election = cached; }
        }
        if (!election) {
            const res = await supabase
                .from('elections')
                .select('results')
                .eq('nation_id', nationId)
                .eq('status', 'completed')
                .order('election_tick', { ascending: false })
                .limit(1)
                .maybeSingle();
            election = res.data;
            if (election && typeof qCacheSet === 'function') qCacheSet(cacheKey, election, 2 * 60 * 1000);
        }

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

async function detectHeadFaction(supabase, nationId, allParties, allPartySeats, currentFactionId) {
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

    return { headFactionId: null, isHeadFaction: false };
}


// ==================== COALITION FETCHING ====================

async function fetchActiveCoalition(supabase, nationId) {
    const cacheKey = 'coalition_' + nationId;
    if (typeof qCache === 'function') {
        const cached = qCache(cacheKey);
        if (cached) return cached;
    }

    // === PRESIDENTIAL SYSTEMS: return virtual coalition from active president ===
    const { data: nationRow } = await supabase
        .from('nations')
        .select('government_type')
        .eq('id', nationId)
        .single();

    if (nationRow?.government_type === 'Presidential') {
        const { data: president } = await supabase
            .from('presidents')
            .select('id, nation_id, faction_id, first_name, last_name, elected_tick, is_active')
            .eq('nation_id', nationId)
            .eq('is_active', true)
            .order('elected_tick', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (!president) return null; // No active president yet (candidate selection pending)

        // Build ministry_allocations from active ministries
        const { data: ministries } = await supabase
            .from('ministries')
            .select('ministry_key, party_id')
            .eq('nation_id', nationId)
            .eq('is_active', true);

        const ministryAllocations = {};
        for (const m of (ministries || [])) {
            if (m.party_id) ministryAllocations[m.ministry_key] = m.party_id;
        }

        const result = {
            id: president.id,
            nation_id: nationId,
            party_ids: [president.faction_id],
            lead_party_id: president.faction_id,
            ministry_allocations: ministryAllocations,
            formed_at: null,
            status: 'formed',  // Always 'formed' while president is active
            _source: 'presidential'
        };
        if (typeof qCacheSet === 'function') qCacheSet(cacheKey, result, 2 * 60 * 1000);
        return result;
    }

    // === PARLIAMENTARY DEMOCRACY / AUTOCRACY: existing logic ===

    // Helper: if status looks active but frozen bills exist, it's actually caretaker
    async function inferCaretakerStatus(result) {
        if (result && (!result.status || result.status === 'formed')) {
            const { count } = await supabase
                .from('bills')
                .select('id', { count: 'exact', head: true })
                .eq('nation_id', nationId)
                .eq('status', 'frozen');
            if (count && count > 0) {
                result.status = 'caretaker';
            }
        }
        return result;
    }

    const { data: newGov } = await supabase
        .from('government_formations')
        .select('*')
        .eq('nation_id', nationId)
        .in('status', ['formed', 'caretaker'])
        .order('formed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (newGov) {
        const pmPartyId = newGov.ministry_assignments?.prime_minister || newGov.proposed_by;
        const result = {
            id: newGov.id,
            nation_id: newGov.nation_id,
            election_id: newGov.election_id,
            party_ids: newGov.party_ids || [],
            lead_party_id: pmPartyId,
            ministry_allocations: newGov.ministry_assignments || {},
            formed_at: newGov.formed_at,
            status: newGov.status,
            _source: 'government_formations'
        };
        await inferCaretakerStatus(result);
        if (typeof qCacheSet === 'function') qCacheSet(cacheKey, result, 2 * 60 * 1000);
        return result;
    }

    const { data } = await supabase
        .from('active_coalitions')
        .select('*')
        .eq('nation_id', nationId)
        .order('formed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (data) {
        await inferCaretakerStatus(data);
        if (typeof qCacheSet === 'function') qCacheSet(cacheKey, data, 2 * 60 * 1000);
    }
    return data;
}


// ==================== POLICY COMPATIBILITY ====================

function getCompatiblePolicies(sector, allPolicies, faction, isAutocracy, excludePolicyIds = [], activePolicyIds = null) {
    const ideo1 = (faction?.ideology_value_1 || '').toUpperCase();
    const ideo2 = (faction?.ideology_value_2 || '').toUpperCase();
    const factionIdeos = [ideo1, ideo2].filter(Boolean);

    const factionOpposites = new Set(
        factionIdeos.map(fi => IDEOLOGY_OPPOSITES[fi]).filter(Boolean)
    );

    return allPolicies
        .filter(p => p.major_sector === sector && !excludePolicyIds.includes(p.id))
        .map(p => {
            const policyIdeos = (p.ideologies && Array.isArray(p.ideologies) && p.ideologies.length > 0)
                ? p.ideologies.map(i => i.toUpperCase())
                : (p.ideology ? [p.ideology.toUpperCase()] : []);

            const isOpposed = factionIdeos.length > 0 &&
                policyIdeos.length > 0 &&
                policyIdeos.some(pi => factionOpposites.has(pi));

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

function calculateBillSupport(billSupport, sponsorPartyId, allPartySeats) {
    const sponsorSeats = allPartySeats[sponsorPartyId] || 0;
    const acceptedSeats = (billSupport || [])
        .filter(s => s.stance === 'accept' && s.faction_id !== sponsorPartyId)
        .reduce((sum, s) => sum + (allPartySeats[s.faction_id] || s.seat_count || 0), 0);
    const totalSupport = sponsorSeats + acceptedSeats;
    const percent = Math.round((totalSupport / GAME_CONFIG.TOTAL_SEATS) * 100);
    return { sponsorSeats, acceptedSeats, totalSupport, percent };
}


// ==================== VOTE TALLY SYNC ====================

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

function calculateEnactmentApproval(articles, billSupport, sponsorId, factionIdeologies) {
    const APPROVAL_CAP_POSITIVE = 2;
    const APPROVAL_CAP_NEGATIVE = -5;
    const OPPOSITION_KICKER = -1;

    // Collect all ideology tags from bill articles
    const allTags = [];
    for (const art of articles) {
        const p = art.policies || art;
        if (!p) continue;
        const ideos = (p.ideologies && Array.isArray(p.ideologies) && p.ideologies.length > 0)
            ? p.ideologies.map(i => i.toUpperCase())
            : (p.ideology ? [p.ideology.toUpperCase()] : []);
        allTags.push(...ideos);
    }

    if (allTags.length === 0) return {};

    // Calculate net direction per axis from all article tags
    const axisNetScores = {};
    for (const tag of allTags) {
        const mapping = IDEOLOGY_TO_AXIS[tag];
        if (!mapping) continue;
        axisNetScores[mapping.axisKey] = (axisNetScores[mapping.axisKey] || 0) + mapping.direction;
    }

    if (Object.keys(axisNetScores).length === 0) return {};

    // Build voter map: factionId -> stance
    const votes = {};
    votes[sponsorId] = 'yes';
    for (const s of (billSupport || [])) {
        if (s.faction_id !== sponsorId) {
            votes[s.faction_id] = s.stance;
        }
    }

    const approvalDeltas = {};

    for (const [factionId, stance] of Object.entries(votes)) {
        if (stance !== 'yes' && stance !== 'no') continue;

        const factionAxes = factionIdeologies[factionId];
        if (!factionAxes) continue;

        // Sum net alignment: positive = bill aligns with faction, negative = opposes
        let netAlignment = 0;
        for (const [axisKey, netDirection] of Object.entries(axisNetScores)) {
            const factionScore = factionAxes[axisKey] || 0;
            // factionScore > 0 means faction leans "right" on this axis
            // netDirection > 0 means bill pushes "right" on this axis
            // Same sign = aligned
            if (factionScore !== 0 && netDirection !== 0) {
                netAlignment += Math.sign(factionScore) === Math.sign(netDirection)
                    ? Math.abs(netDirection)
                    : -Math.abs(netDirection);
            }
        }

        // YES vote: aligned bill = positive, opposed bill = negative
        // NO vote: inverted — opposed bill = positive, aligned bill = negative
        let delta = stance === 'yes' ? netAlignment : -netAlignment;

        // Apply opposition kicker: extra -1 when the result is negative
        if (delta < 0) {
            delta += OPPOSITION_KICKER;
        }

        // Cap the final value
        delta = Math.max(APPROVAL_CAP_NEGATIVE, Math.min(APPROVAL_CAP_POSITIVE, delta));
        approvalDeltas[factionId] = Math.round(delta * 10) / 10;
    }

    return approvalDeltas;
}

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


// ==================== ENACTMENT IDEOLOGY MODIFIERS ====================

const IDEOLOGY_MODIFIER_CLAMP = 30;

function calculateEnactmentIdeologyModifiers(articles, billSupport, sponsorId, factionIdeologies) {
    const MODIFIER_CAP_POSITIVE = 2;
    const MODIFIER_CAP_NEGATIVE = -5;
    const MODIFIER_OPPOSITION_KICKER = -1;

    // Collect all ideology tags from bill articles (same logic as calculateEnactmentApproval)
    const allTags = [];
    for (const art of articles) {
        const p = art.policies || art;
        if (!p) continue;
        const ideos = (p.ideologies && Array.isArray(p.ideologies) && p.ideologies.length > 0)
            ? p.ideologies.map(i => i.toUpperCase())
            : (p.ideology ? [p.ideology.toUpperCase()] : []);
        allTags.push(...ideos);
    }

    if (allTags.length === 0) return {};

    const uniqueTags = [...new Set(allTags)];

    // Build voter map: factionId -> stance
    const votes = {};
    votes[sponsorId] = 'yes';
    for (const s of (billSupport || [])) {
        if (s.faction_id !== sponsorId) {
            votes[s.faction_id] = s.stance;
        }
    }

    // Result: { factionId: { TAG: delta, ... }, ... }
    const modifierDeltas = {};

    for (const [factionId, stance] of Object.entries(votes)) {
        if (stance !== 'yes' && stance !== 'no') continue;

        const factionAxes = factionIdeologies[factionId];
        if (!factionAxes) continue;

        const tagDeltas = {};

        for (const tag of uniqueTags) {
            const mapping = IDEOLOGY_TO_AXIS[tag];
            if (!mapping) continue;

            const factionScore = factionAxes[mapping.axisKey] || 0;
            if (factionScore === 0) continue;

            // +1 if faction leans same direction as the tag, -1 if opposed
            const alignment = Math.sign(factionScore) === Math.sign(mapping.direction) ? 1 : -1;

            // YES vote on aligned bill = positive; NO vote inverts
            let delta = stance === 'yes' ? alignment : -alignment;

            // Opposition kicker: extra -1 when negative
            if (delta < 0) {
                delta += MODIFIER_OPPOSITION_KICKER;
            }

            delta = Math.max(MODIFIER_CAP_NEGATIVE, Math.min(MODIFIER_CAP_POSITIVE, delta));
            tagDeltas[tag] = Math.round(delta * 10) / 10;
        }

        if (Object.keys(tagDeltas).length > 0) {
            modifierDeltas[factionId] = tagDeltas;
        }
    }

    return modifierDeltas;
}

async function applyEnactmentIdeologyModifiers(supabase, modifierDeltas) {
    for (const [factionId, tagDeltas] of Object.entries(modifierDeltas)) {
        const { data: faction } = await supabase
            .from('factions')
            .select('ideology_modifiers')
            .eq('id', factionId)
            .single();

        if (!faction) continue;

        const current = faction.ideology_modifiers || {};
        const updated = { ...current };

        for (const [tag, delta] of Object.entries(tagDeltas)) {
            if (delta === 0) continue;
            const oldVal = updated[tag] || 0;
            const newVal = Math.max(-IDEOLOGY_MODIFIER_CLAMP,
                           Math.min(IDEOLOGY_MODIFIER_CLAMP, oldVal + delta));
            if (newVal === 0) {
                delete updated[tag];
            } else {
                updated[tag] = newVal;
            }
        }

        await supabase
            .from('factions')
            .update({ ideology_modifiers: updated })
            .eq('id', factionId);
    }
}


// ==================== STATIC IDEOLOGY PENALTY (LEGACY) ====================

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


// ==================== IDEOLOGY TICK PROCESSOR ====================

async function processIdeologyTick(supabase, nation, currentTick, resolutions) {
    const { data: factions } = await supabase
        .from('factions')
        .select('id, faction_name, ideology_value_1, ideology_value_2')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party')
        .eq('is_npc', false);

    if (!factions || factions.length === 0) return [];

    const resolvedBillIds = (resolutions || []).map(r => r.billId);
    const passedBillIds = new Set((resolutions || []).filter(r => r.result === 'passed').map(r => r.billId));

    if (resolvedBillIds.length === 0) {
        for (const faction of factions) {
            await snapshotIdeology(supabase, faction.id, currentTick);
        }
        return [];
    }

    const { data: rawResolvedBills } = await supabase
        .from('bills')
        .select('*, bill_articles(*, policies(*))')
        .in('id', resolvedBillIds);

    // Only legislative bills affect ideology — exclude ambassador confirmations, no-confidence, foundational
    const allResolvedBills = (rawResolvedBills || []).filter(b =>
        !['no_confidence', 'confirmation', 'minister_confirmation', 'foundational', 'veto_override'].includes(b.bill_type)
    );

    if (allResolvedBills.length === 0) {
        for (const faction of factions) {
            await snapshotIdeology(supabase, faction.id, currentTick);
        }
        return [];
    }

    const { data: allVotes } = await supabase
        .from('bill_support')
        .select('bill_id, faction_id, stance')
        .in('bill_id', resolvedBillIds);
    const allEvents = [];

    for (const faction of factions) {
        const factionVotes = (allVotes || []).filter(v => v.faction_id === faction.id);

        const votedYesBills = [];
        const proposedBills = [];
        const passedBillsYesVote = [];

        for (const bill of allResolvedBills) {
            const vote = factionVotes.find(v => v.bill_id === bill.id);

            if (bill.proposed_by === faction.id) {
                proposedBills.push(bill);
            }

            if (vote?.stance === 'yes') {
                votedYesBills.push(bill);
                if (passedBillIds.has(bill.id)) {
                    passedBillsYesVote.push(bill);
                }
            }
        }

        if (votedYesBills.length === 0 && proposedBills.length === 0) {
            await snapshotIdeology(supabase, faction.id, currentTick);
            continue;
        }

        const ideologyRow = await loadFactionIdeology(supabase, faction.id);
        if (!ideologyRow) {
            console.warn(`No ideology row for ${faction.faction_name} (${faction.id}) — skipping`);
            continue;
        }

        const currentScores = extractAxisScores(ideologyRow);

        const shifts = calculateIdeologyShifts({
            votedYesBills,
            proposedBills,
            passedBills: passedBillsYesVote
        });

        const newScores = applyIdeologyShifts(currentScores, shifts);

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

        await snapshotIdeology(supabase, faction.id, currentTick, newScores);

        const previousSnapshot = await loadPreviousIdeologySnapshot(supabase, faction.id, currentTick);
        if (previousSnapshot) {
            const previousScores = extractAxisScores(previousSnapshot);
            const driftEvents = detectIdeologyDrift(newScores, previousScores, ideologyRow, faction.faction_name);

            for (const evt of driftEvents) {
                allEvents.push({ ...evt, factionId: faction.id, factionName: faction.faction_name });

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
            .select('name, government_type')
            .eq('id', bill.nation_id)
            .single();
        let votesFor = 0, votesAgainst = 0;

        (bill.bill_support || []).forEach(s => {
            if (s.stance === 'yes') votesFor += s.seat_count;
            else if (s.stance === 'no') votesAgainst += s.seat_count;
        });

        const totalVoted = votesFor + votesAgainst;

        // No-confidence uses simple majority (votesFor > votesAgainst)
        // Foundational bills and veto overrides require 2/3 supermajority
        // Normal bills require 51% of total seats
        const isNoConfidence = bill.bill_type === 'no_confidence';
        const isFoundational = bill.bill_type === 'foundational';
        const isVetoOverride = bill.bill_type === 'veto_override';
        const supermajorityThreshold = isFoundational ? GAME_CONFIG.SUPERMAJORITY_THRESHOLD
            : isVetoOverride ? GAME_CONFIG.VETO_OVERRIDE_THRESHOLD : null;
        const passed = isNoConfidence
            ? (totalVoted > 0 && votesFor > votesAgainst)
            : supermajorityThreshold
                ? (totalVoted > 0 && votesFor >= Math.ceil(GAME_CONFIG.TOTAL_SEATS * supermajorityThreshold))
                : (totalVoted > 0 && votesFor >= Math.ceil(GAME_CONFIG.TOTAL_SEATS * GAME_CONFIG.MAJORITY_THRESHOLD));

        if (isNoConfidence) {
            // Handle no-confidence resolution (pass or fail)
            if (passed) {
                await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
            } else {
                await failBill(supabase, bill);
            }
            await resolveNoConfidence(supabase, bill, passed, votesFor, votesAgainst, currentTick);
            results.push({ billId: bill.id, billName: bill.bill_name, result: passed ? 'passed' : 'failed', votesFor, votesAgainst, type: 'no_confidence' });
        } else if (isFoundational) {
            // Handle foundational bill resolution (electoral makeup, etc.)
            if (passed) {
                await enactFoundationalBill(supabase, bill, currentTick);
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
                        article_count: '0'
                    }
                });
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
            }
            results.push({ billId: bill.id, billName: bill.bill_name, result: passed ? 'passed' : 'failed', votesFor, votesAgainst, type: 'foundational' });
        } else if (bill.bill_type === 'confirmation' && bill.ambassador_id) {
            // Ambassador confirmation bill
            if (passed) {
                await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
                // Activate the ambassador
                await supabase.from('ambassadors').update({
                    status: 'active',
                    is_active: true
                }).eq('id', bill.ambassador_id);
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
                        article_count: '0'
                    }
                });
            } else {
                await failBill(supabase, bill);
                // Reject the ambassador
                await supabase.from('ambassadors').update({
                    status: 'rejected',
                    is_active: false
                }).eq('id', bill.ambassador_id);
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
            }
            results.push({ billId: bill.id, billName: bill.bill_name, result: passed ? 'passed' : 'failed', votesFor, votesAgainst, type: 'confirmation' });
        } else if (bill.bill_type === 'minister_confirmation' && bill.ministry_key) {
            // Minister confirmation bill (Presidential systems)
            const mKey = bill.ministry_key;
            const { data: ministry } = await supabase.from('ministries')
                .select('id, pending_minister, rejected_parties')
                .eq('nation_id', bill.nation_id).eq('ministry_key', mKey).eq('is_active', true)
                .maybeSingle();

            if (passed) {
                await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);

                if (ministry?.pending_minister) {
                    const pm = ministry.pending_minister;
                    const ministryNames = {
                        prime_minister: 'Prime Minister', interior: 'Ministry of the Interior',
                        foreign: 'Foreign Ministry', defense: 'Ministry of Defense',
                        finance: 'Ministry of Finance', education: 'Ministry of Education',
                        healthcare: 'Ministry of Healthcare', labor: 'Ministry of Labor',
                        justice: 'Ministry of Justice', transportation: 'Ministry of Transportation',
                        security: 'Ministry of Security'
                    };
                    await supabase.from('ministries').update({
                        party_id: pm.party_id,
                        minister_first_name: pm.first_name,
                        minister_last_name: pm.last_name,
                        minister_age: pm.age,
                        minister_approval: 50,
                        ministry_name: ministryNames[mKey] || mKey,
                        confirmation_status: 'confirmed',
                        pending_minister: null
                    }).eq('id', ministry.id);
                }

                try {
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
                            article_count: '0'
                        }
                    });
                } catch (e) { /* non-blocking */ }
            } else {
                await failBill(supabase, bill);

                // Record rejected party so President can't re-nominate same party for this slot
                if (ministry?.pending_minister) {
                    const rejectedPartyId = ministry.pending_minister.party_id;
                    const existingRejected = ministry.rejected_parties || [];
                    if (!existingRejected.includes(rejectedPartyId)) {
                        existingRejected.push(rejectedPartyId);
                    }
                    await supabase.from('ministries').update({
                        confirmation_status: 'rejected',
                        pending_minister: null,
                        rejected_parties: existingRejected
                    }).eq('id', ministry.id);
                }

                try {
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
                } catch (e) { /* non-blocking */ }
            }
            results.push({ billId: bill.id, billName: bill.bill_name, result: passed ? 'passed' : 'failed', votesFor, votesAgainst, type: 'minister_confirmation' });
        } else if (bill.bill_type === 'veto_override' && bill.original_bill_id) {
            // Veto override bill (Presidential systems)
            if (passed) {
                await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
                // Enact the ORIGINAL vetoed bill
                const { data: originalBill } = await supabase.from('bills')
                    .select('*, factions(faction_name, ideology_value_1, ideology_value_2), bill_articles(*, policies(*)), bill_support(*, factions(faction_name))')
                    .eq('id', bill.original_bill_id).single();
                if (originalBill) {
                    await supabase.from('bills').update({ president_action: 'overridden' }).eq('id', originalBill.id);
                    await enactBill(supabase, originalBill, currentTick);
                }
                try {
                    await supabase.rpc('fire_system_event', {
                        p_trigger_key: 'bill_passed',
                        p_nation_id: bill.nation_id,
                        p_tick: currentTick,
                        p_placeholders: { nation: nation?.name || 'Unknown', bill_name: bill.bill_name, sponsor: bill.factions?.faction_name || 'Unknown', votes_for: String(votesFor), votes_against: String(votesAgainst), article_count: '0' }
                    });
                } catch (e) { /* non-blocking */ }
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'passed', votesFor, votesAgainst, type: 'veto_override' });
            } else {
                await failBill(supabase, bill);
                try {
                    await supabase.rpc('fire_system_event', {
                        p_trigger_key: 'bill_failed',
                        p_nation_id: bill.nation_id,
                        p_tick: currentTick,
                        p_placeholders: { nation: nation?.name || 'Unknown', bill_name: bill.bill_name, sponsor: bill.factions?.faction_name || 'Unknown', votes_for: String(votesFor), votes_against: String(votesAgainst) }
                    });
                } catch (e) { /* non-blocking */ }
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed', votesFor, votesAgainst, type: 'veto_override' });
            }
        } else if (passed) {
            // Presidential systems: route regular/repeal bills to president's desk
            if (nation?.government_type === 'Presidential') {
                await supabase.from('bills').update({
                    status: 'president_desk',
                    passed_tick: currentTick,
                    president_desk_deadline: currentTick + GAME_CONFIG.PRESIDENT_DESK_TICKS
                }).eq('id', bill.id);
                await supabase.rpc('fire_system_event', {
                    p_trigger_key: 'bill_passed',
                    p_nation_id: bill.nation_id,
                    p_tick: currentTick,
                    p_placeholders: {
                        nation: nation?.name || 'Unknown',
                        bill_name: bill.bill_name + ' (sent to President\'s desk)',
                        sponsor: bill.factions?.faction_name || 'Unknown',
                        votes_for: String(votesFor),
                        votes_against: String(votesAgainst),
                        article_count: String((bill.bill_articles || []).length)
                    }
                });
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'president_desk', votesFor, votesAgainst });
            } else {
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
            }
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

async function enactBill(supabase, bill, currentTick) {
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

    if (bill.bill_type === 'repeal' && bill.repeal_active_law_id) {
        const targetLaw = (currentActiveLaws || []).find(l => l.id === bill.repeal_active_law_id);
        if (targetLaw && targetLaw.policies) {
            await reversePolicy(supabase, nation, targetLaw.policies, targetLaw.passed_tick, currentTick);
            await supabase.from('active_laws').delete().eq('id', bill.repeal_active_law_id);
        }
    } else {
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

    const sponsorFaction = bill.factions;
    if (sponsorFaction) {
        const opposed = countOpposedArticles(bill.bill_articles || [], sponsorFaction);
        if (opposed > 0) {
            const penalty = calculateIdeologyPenalty('passed', opposed, nation.polarization || 0);
            await applyIdeologyPenalty(supabase, bill.proposed_by, penalty);
        }
    }

    // Load ideology axes for all voting factions (sponsor + voters)
    const voterFactionIds = [bill.proposed_by, ...(bill.bill_support || []).map(s => s.faction_id)];
    const uniqueFactionIds = [...new Set(voterFactionIds.filter(Boolean))];
    const { data: ideoRows } = await supabase
        .from('faction_ideology')
        .select('faction_id, liberty_equality, tradition_progress, security_freedom, globalism_nationalism, individualism_collectivism')
        .in('faction_id', uniqueFactionIds);

    const factionIdeologies = {};
    for (const row of (ideoRows || [])) {
        factionIdeologies[row.faction_id] = row;
    }

    const approvalDeltas = calculateEnactmentApproval(
        bill.bill_articles || [],
        bill.bill_support || [],
        bill.proposed_by,
        factionIdeologies
    );
    await applyEnactmentApproval(supabase, approvalDeltas);

    // Per-ideology-tag modifiers (targeted voter group impact)
    const ideologyModDeltas = calculateEnactmentIdeologyModifiers(
        bill.bill_articles || [],
        bill.bill_support || [],
        bill.proposed_by,
        factionIdeologies
    );
    await applyEnactmentIdeologyModifiers(supabase, ideologyModDeltas);
}

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

// ==================== FOUNDATIONAL BILL ENACTMENT ====================

async function enactFoundationalBill(supabase, bill, currentTick) {
    // Mark bill as passed
    await supabase.from('bills').update({
        status: 'passed',
        passed_tick: currentTick
    }).eq('id', bill.id);

    const newTotalSeats = bill.proposed_seats;
    if (!newTotalSeats || newTotalSeats < 50 || newTotalSeats > 500) return;

    // Get current total seats to compute delta
    const { data: nationData } = await supabase
        .from('nations')
        .select('total_seats')
        .eq('id', bill.nation_id)
        .single();
    const currentTotalSeats = nationData?.total_seats || GAME_CONFIG.TOTAL_SEATS;
    const delta = newTotalSeats - currentTotalSeats;

    // 1. Update nation's total_seats
    await supabase.from('nations').update({
        total_seats: newTotalSeats
    }).eq('id', bill.nation_id);

    if (delta !== 0) {
        // SEATS CHANGE — proportionally rescale all party seats to the new total
        const { data: election } = await supabase
            .from('elections')
            .select('id, results')
            .eq('nation_id', bill.nation_id)
            .eq('status', 'completed')
            .order('election_tick', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (election?.results?.votes) {
            const voteTotals = {};
            for (const v of election.results.votes) {
                voteTotals[v.party_id] = v.votes || 0;
            }
            const newSeats = allocateSeatsByVotes(voteTotals, newTotalSeats);

            for (const [partyId, seats] of Object.entries(newSeats)) {
                await supabase.from('factions').update({ seats }).eq('id', partyId);
            }
        }
        console.log(`Foundational bill passed: ${currentTotalSeats} → ${newTotalSeats} (${delta > 0 ? '+' : ''}${delta}). Seats rescaled proportionally.`);
    }

    // Update GAME_CONFIG for current session
    GAME_CONFIG.TOTAL_SEATS = newTotalSeats;
    GAME_CONFIG.MAJORITY_SEATS = Math.ceil(newTotalSeats * GAME_CONFIG.MAJORITY_THRESHOLD);
}

async function failBill(supabase, bill) {
    await supabase.from('bills').update({
        status: 'failed'
    }).eq('id', bill.id);
}


// ==================== ADMINISTRATION LIFECYCLE ====================

/**
 * Canonical nation stat columns.
 *
 * Used for administration snapshots, policy effect validation,
 * and any other direct nations-table stat mutations.
 */
const NATION_STAT_COLUMNS = [
    'gdp', 'gdp_growth', 'debt', 'debt_growth', 'budget', 'inflation', 'interest_rates',
    'trade_balance', 'currency_strength', 'foreign_investment', 'credit',
    'income_tax', 'corporate_tax', 'sales_tax', 'tariffs',
    'unemployment', 'labor_force_participation', 'minimum_wage', 'union_strength',
    'poverty_rate', 'income_inequality',
    'population', 'population_growth', 'birth_rate', 'death_rate', 'median_age', 'eligible_voters', 'ethnic_diversity',
    'healthcare_quality', 'healthcare_accessibility', 'beds_per_100k', 'lifespan', 'drug_use',
    'literacy', 'higher_education', 'education_accessibility', 'academic_immigration',
    'digital_infrastructure', 'rail_network', 'urbanization', 'energy_generation', 'renewable_energy_percentage',
    'arable_land', 'rare_minerals', 'oil_and_gas', 'fuel_prices',
    'pollution', 'carbon_emissions',
    'standard_of_living', 'happiness', 'social_mobility', 'benefits', 'crime_rate', 'incarceration_rate',
    'religious',
    'stability', 'legitimacy', 'efficiency', 'corruption', 'press_freedom', 'judicial_independence',
    'freedom_index', 'polarization',
    'civil_unrest', 'terrorism', 'political_violence',
    'immigration', 'illegal_immigration', 'emigration',
    'international_reputation', 'trade_agreements', 'sanctions'
];

const NATION_STAT_COLUMN_SET = new Set(NATION_STAT_COLUMNS);

const STAT_KEY_ALIASES = {
    intl_reputation: 'international_reputation',
    credit_rating: 'credit',
    credit_score: 'credit',
    trade: 'trade_balance',
    trade_volume: 'trade_balance',
    education: 'higher_education',
    education_quality: 'higher_education',
    military_strength: 'stability'
};

function normalizeNationStatKey(statKey) {
    if (!statKey || typeof statKey !== 'string') return null;
    return STAT_KEY_ALIASES[statKey] || statKey;
}

/**
 * Stats where HIGHER values are better (increase = achievement).
 */
const STATS_HIGHER_IS_BETTER = [
    'gdp', 'gdp_growth', 'budget', 'currency_strength', 'foreign_investment', 'credit',
    'labor_force_participation', 'minimum_wage', 'union_strength',
    'population_growth', 'eligible_voters', 'ethnic_diversity',
    'healthcare_quality', 'healthcare_accessibility', 'beds_per_100k', 'lifespan',
    'literacy', 'higher_education', 'education_accessibility', 'academic_immigration',
    'digital_infrastructure', 'rail_network', 'energy_generation', 'renewable_energy_percentage',
    'arable_land', 'rare_minerals',
    'standard_of_living', 'happiness', 'social_mobility', 'benefits',
    'stability', 'legitimacy', 'efficiency', 'press_freedom', 'judicial_independence', 'freedom_index',
    'immigration', 'international_reputation', 'trade_agreements'
];

/**
 * Stats where LOWER values are better (decrease = achievement).
 */
const STATS_LOWER_IS_BETTER = [
    'debt', 'debt_growth', 'inflation', 'interest_rates',
    'unemployment', 'poverty_rate', 'income_inequality', 'death_rate',
    'drug_use', 'fuel_prices', 'pollution', 'carbon_emissions',
    'crime_rate', 'incarceration_rate', 'corruption', 'polarization',
    'civil_unrest', 'terrorism', 'political_violence',
    'illegal_immigration', 'emigration', 'sanctions'
];

/**
 * Snapshot all nation stats into a flat JSONB object.
 */
function snapshotNationStats(nation) {
    const snapshot = {};
    for (const key of NATION_STAT_COLUMNS) {
        if (nation[key] !== undefined && nation[key] !== null) {
            snapshot[key] = nation[key];
        }
    }
    return snapshot;
}

/**
 * Close the current administration for a nation.
 * Snapshots end stats, queries bills/crises during the admin's tenure, sets end fields.
 *
 * @param {object} supabase - Supabase client
 * @param {string} nationId - Nation UUID
 * @param {object} nation - Full nation row (for stat snapshot)
 * @param {string} endReason - Why the admin ended: 'election_loss', 'new_coalition', 'coalition_collapse', 'coup'
 * @param {number} currentTick - Current shard tick
 * @param {string} currentDate - Current game date string (e.g., "March, 2001")
 * @param {number|null} governmentApproval - Current government approval percentage
 */
async function closeAdministration(supabase, nationId, nation, endReason, currentTick, currentDate, governmentApproval) {
    try {
        // Find all currently open administrations (defensive against legacy duplicates)
        const { data: openAdmins, error: openAdminsErr } = await supabase
            .from('administrations')
            .select('*')
            .eq('nation_id', nationId)
            .is('ended_at_tick', null)
            .order('started_at_tick', { ascending: false })
            .order('created_at', { ascending: false });

        if (openAdminsErr) throw openAdminsErr;

        if (!openAdmins || openAdmins.length === 0) {
            console.warn('closeAdministration: No open administration found for nation', nationId);
            return;
        }

        if (openAdmins.length > 1) {
            console.warn('closeAdministration: duplicate open administrations detected', {
                event: 'duplicate_open_administrations',
                nation_id: nationId,
                open_count: openAdmins.length,
                open_admin_ids: openAdmins.map(a => a.id),
                resolution: 'closing_all_open_rows_with_consistent_end_fields',
                end_reason: endReason,
                end_tick: currentTick
            });
        }

        const statsAtEnd = snapshotNationStats(nation);

        for (const currentAdmin of openAdmins) {
            // Query bills passed during this administration
            const { data: passedBills, error: passedBillsErr } = await supabase
                .from('bills')
                .select('id, bill_name, passed_tick')
                .eq('nation_id', nationId)
                .eq('status', 'passed')
                .gte('passed_tick', currentAdmin.started_at_tick)
                .lte('passed_tick', currentTick);
            if (passedBillsErr) throw passedBillsErr;

            const billsPassed = (passedBills || []).map(b => ({
                bill_id: b.id,
                bill_name: b.bill_name,
                passed_tick: b.passed_tick
            }));

            // Query crises (events with category 'crisis' or matching crisis event names)
            const { data: eventsDuring, error: eventsErr } = await supabase
                .from('event_log')
                .select('event_id, event_name, category, fired_at_tick')
                .eq('nation_id', nationId)
                .gte('fired_at_tick', currentAdmin.started_at_tick)
                .lte('fired_at_tick', currentTick);
            if (eventsErr) throw eventsErr;

            const crisisEvents = (eventsDuring || []).filter(e =>
                e.category === 'crisis' || e.category === 'disaster' || e.category === 'conflict'
            );

            const crisesStarted = crisisEvents
                .filter(e => !e.event_name || !e.event_name.startsWith('CRISIS_RESOLVED:'))
                .map(e => ({
                    event_id: e.event_id,
                    title: e.event_name,
                    started_tick: e.fired_at_tick
                }));

            const crisesSolved = (eventsDuring || [])
                .filter(e => e.event_name && e.event_name.startsWith('CRISIS_RESOLVED:'))
                .map(e => ({
                    title: e.event_name.replace('CRISIS_RESOLVED: ', ''),
                    solved_tick: e.fired_at_tick
                }));

            // Count elections survived (elections that occurred during this admin where the coalition continued)
            const { data: electionsDuring, error: electionsErr } = await supabase
                .from('elections')
                .select('id, election_tick')
                .eq('nation_id', nationId)
                .eq('status', 'completed')
                .gte('election_tick', currentAdmin.started_at_tick)
                .lt('election_tick', currentTick);
            if (electionsErr) throw electionsErr;

            // Update the administration record
            const { error: updateErr } = await supabase
                .from('administrations')
                .update({
                    stats_at_end: statsAtEnd,
                    approval_at_end: governmentApproval,
                    ended_at_tick: currentTick,
                    ended_at_date: currentDate,
                    end_reason: endReason,
                    bills_passed: billsPassed,
                    laws_repealed: [],
                    crises_started: crisesStarted,
                    crises_solved: crisesSolved,
                    elections_survived: (electionsDuring || []).length,
                    updated_at: new Date().toISOString()
                })
                .eq('id', currentAdmin.id);
            if (updateErr) throw updateErr;

            console.log(`Administration closed: "${currentAdmin.admin_name}" — reason: ${endReason}`);
        }
    } catch (err) {
        console.error('closeAdministration error:', err);
        throw err;
    }
}

/**
 * Create a new administration record when a coalition forms.
 *
 * @param {object} supabase - Supabase client
 * @param {string} nationId - Nation UUID
 * @param {object} nation - Full nation row (for stat snapshot + HOS)
 * @param {object} coalition - Active coalition object (party_ids, lead_party_id)
 * @param {Array} allParties - Array of faction objects with id, faction_name, seats
 * @param {number} currentTick - Current shard tick
 * @param {string} currentDate - Current game date string
 * @param {number|null} governmentApproval - Current government approval percentage
 */
async function createAdministration(supabase, nationId, nation, coalition, allParties, currentTick, currentDate, governmentApproval) {
    try {
        const statsAtStart = snapshotNationStats(nation);

        // Build coalition party info
        const coalitionPartyIds = coalition?.party_ids || [];
        const coalitionParties = coalitionPartyIds.map(pid => {
            const party = allParties.find(p => p.id === pid);
            return {
                party_id: pid,
                party_name: party?.faction_name || 'Unknown',
                seats: party?.seats || 0
            };
        });
        const totalSeats = coalitionParties.reduce((sum, p) => sum + p.seats, 0);

        // Get PM party info
        const leadPartyId = coalition?.lead_party_id;
        const leadParty = allParties.find(p => p.id === leadPartyId);
        const pmPartyName = leadParty?.faction_name || 'Unknown';

        // Get active PM name
        const { data: activeHOG } = await supabase
            .from('head_of_government')
            .select('first_name, last_name')
            .eq('nation_id', nationId)
            .eq('active', true)
            .maybeSingle();

        const pmName = activeHOG ? `${activeHOG.first_name} ${activeHOG.last_name}` : null;

        // Head of state name
        const hosName = (nation.head_of_state_first_name && nation.head_of_state_last_name)
            ? `${nation.head_of_state_first_name} ${nation.head_of_state_last_name}`
            : null;

        // Generate admin name from PM last name, falling back to HOS
        const adminName = activeHOG?.last_name
            ? `${activeHOG.last_name} Administration`
            : (nation.head_of_state_last_name
                ? `${nation.head_of_state_last_name} Administration`
                : `${pmPartyName} Administration`);

        const { error: insertErr } = await supabase
            .from('administrations')
            .insert({
                nation_id: nationId,
                admin_name: adminName,
                head_of_state: hosName,
                prime_minister: pmName,
                pm_party_name: pmPartyName,
                pm_party_id: leadPartyId,
                coalition_parties: coalitionParties,
                total_seats: totalSeats,
                government_type: nation.government_type || 'Democracy',
                started_at_tick: currentTick,
                started_at_date: currentDate,
                stats_at_start: statsAtStart,
                approval_at_start: governmentApproval
            });
        if (insertErr) throw insertErr;

        console.log(`Administration created: "${adminName}" at tick ${currentTick}`);
    } catch (err) {
        console.error('createAdministration error:', err);
        throw err;
    }
}

/**
 * Atomically close existing open administrations and create a new one.
 * Falls back to sequential close + create if RPC is unavailable.
 */
async function rolloverAdministration(supabase, nationId, nation, endReason, coalition, allParties, currentTick, currentDate, governmentApproval) {
    const statsAtStart = snapshotNationStats(nation);

    const coalitionPartyIds = coalition?.party_ids || [];
    const coalitionParties = coalitionPartyIds.map(pid => {
        const party = allParties.find(p => p.id === pid);
        return {
            party_id: pid,
            party_name: party?.faction_name || 'Unknown',
            seats: party?.seats || 0
        };
    });
    const totalSeats = coalitionParties.reduce((sum, p) => sum + p.seats, 0);

    const leadPartyId = coalition?.lead_party_id;
    const leadParty = allParties.find(p => p.id === leadPartyId);
    const pmPartyName = leadParty?.faction_name || 'Unknown';

    const { data: activeHOG, error: hogErr } = await supabase
        .from('head_of_government')
        .select('first_name, last_name')
        .eq('nation_id', nationId)
        .eq('active', true)
        .maybeSingle();
    if (hogErr) throw hogErr;

    const pmName = activeHOG ? `${activeHOG.first_name} ${activeHOG.last_name}` : null;
    const hosName = (nation.head_of_state_first_name && nation.head_of_state_last_name)
        ? `${nation.head_of_state_first_name} ${nation.head_of_state_last_name}`
        : null;
    const adminName = activeHOG?.last_name
        ? `${activeHOG.last_name} Administration`
        : (nation.head_of_state_last_name
            ? `${nation.head_of_state_last_name} Administration`
            : `${pmPartyName} Administration`);

    const payload = {
        nation_id: nationId,
        admin_name: adminName,
        head_of_state: hosName,
        prime_minister: pmName,
        pm_party_name: pmPartyName,
        pm_party_id: leadPartyId,
        coalition_parties: coalitionParties,
        total_seats: totalSeats,
        government_type: nation.government_type || 'Democracy',
        started_at_tick: currentTick,
        started_at_date: currentDate,
        stats_at_start: statsAtStart,
        approval_at_start: governmentApproval
    };

    const { error: rpcErr } = await supabase.rpc('rollover_administration', {
        p_nation_id: nationId,
        p_end_reason: endReason,
        p_end_tick: currentTick,
        p_end_date: currentDate,
        p_end_approval: governmentApproval,
        p_new_administration: payload
    });

    if (!rpcErr) {
        console.log(`Administration rolled over atomically: "${adminName}" at tick ${currentTick}`);
        return;
    }

    // Graceful fallback if DB function has not been deployed yet
    const rpcUnavailable = /rollover_administration/i.test(rpcErr.message || '') || rpcErr.code === 'PGRST202';
    if (!rpcUnavailable) throw rpcErr;

    console.warn('rolloverAdministration RPC unavailable; falling back to sequential close + create');
    await closeAdministration(supabase, nationId, nation, endReason, currentTick, currentDate, governmentApproval);
    await createAdministration(supabase, nationId, nation, coalition, allParties, currentTick, currentDate, governmentApproval);
}


// ==================== COALITION DISSOLUTION ====================

/**
 * Dissolve the current coalition government.
 * - Sets government_formations status to 'dissolved'
 * - Deactivates PM in head_of_government
 * - Vacates all ministries
 * Nation enters formation period (processGovernmentVacancy handles penalties).
 */
async function dissolveCoalition(supabase, nationId) {
    // Dissolve government_formations
    await supabase
        .from('government_formations')
        .update({ status: 'dissolved' })
        .eq('nation_id', nationId)
        .in('status', ['formed', 'caretaker']);

    // Also dissolve legacy active_coalitions
    await supabase
        .from('active_coalitions')
        .update({ status: 'dissolved', dissolved_at: new Date().toISOString() })
        .eq('nation_id', nationId)
        .is('dissolved_at', null);

    // Deactivate PM
    await supabase
        .from('head_of_government')
        .update({ active: false })
        .eq('nation_id', nationId)
        .eq('active', true);

    // Vacate all ministries
    await supabase
        .from('ministries')
        .update({
            minister_first_name: null,
            minister_last_name: null,
            minister_age: null,
            party_id: null
        })
        .eq('nation_id', nationId)
        .eq('is_active', true);
}


// ==================== NO-CONFIDENCE RESOLUTION ====================

/**
 * Resolve a passed or failed vote of no confidence.
 *
 * PASSED:
 *   - Coalition immediately dissolved (all ministries vacated, PM removed)
 *   - Calling party gets +3 approval
 *   - All coalition parties get -5 approval
 *   - Event logged
 *
 * FAILED:
 *   - Calling party gets -5 approval
 *   - PM's party gets +3 approval
 *   - 6-tick cooldown recorded
 *   - Event logged
 */
async function resolveNoConfidence(supabase, bill, passed, votesFor, votesAgainst, currentTick) {
    const callingPartyId = bill.proposed_by;
    const nationId = bill.nation_id;

    const { data: nation } = await supabase
        .from('nations')
        .select('name, government_type')
        .eq('id', nationId)
        .single();

    // Presidential systems do not have votes of no confidence
    if (nation?.government_type === 'Presidential') return;

    // Get PM's last name for event text
    const { data: hog } = await supabase
        .from('head_of_government')
        .select('last_name, faction_id')
        .eq('nation_id', nationId)
        .eq('active', true)
        .maybeSingle();

    const pmLastName = hog?.last_name || 'Unknown';
    const pmFactionId = hog?.faction_id || null;

    if (passed) {
        // Get coalition party IDs before dissolving
        const coalition = await fetchActiveCoalition(supabase, nationId);
        const coalitionPartyIds = coalition?.party_ids || [];

        // Close the current administration before dissolving
        try {
            const { data: fullNation } = await supabase.from('nations').select('*').eq('id', nationId).single();
            const { data: shard } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
            if (fullNation) {
                await closeAdministration(supabase, nationId, fullNation, 'coalition_collapse', currentTick, shard?.current_date || '', null);
            }
        } catch (adminErr) { console.warn('Could not close administration on no-confidence:', adminErr); }

        // Dissolve coalition
        await dissolveCoalition(supabase, nationId);

        // Calling party gets +3 approval
        const { data: callerFaction } = await supabase
            .from('factions')
            .select('approval_rating')
            .eq('id', callingPartyId)
            .single();
        if (callerFaction) {
            await supabase.from('factions')
                .update({ approval_rating: Math.min(100, (callerFaction.approval_rating ?? 50) + 3) })
                .eq('id', callingPartyId);
        }

        // All coalition parties get -5 approval
        for (const partyId of coalitionPartyIds) {
            const { data: faction } = await supabase
                .from('factions')
                .select('approval_rating')
                .eq('id', partyId)
                .single();
            if (faction) {
                await supabase.from('factions')
                    .update({ approval_rating: Math.max(0, (faction.approval_rating ?? 50) - 5) })
                    .eq('id', partyId);
            }
        }

        // Log event
        await supabase.from('event_log').insert({
            nation_id: nationId,
            event_name: 'No Confidence — Government Falls',
            fired_at_tick: currentTick,
            category: 'government',
            description_chosen: `The ${pmLastName} Government has fallen. A motion of no confidence passed ${votesFor} to ${votesAgainst}.`,
            effects_applied: { coalition_dissolved: true, caller_approval: +3, coalition_approval: -5 }
        });

    } else {
        // FAILED: calling party gets -5 approval
        const { data: callerFaction } = await supabase
            .from('factions')
            .select('approval_rating')
            .eq('id', callingPartyId)
            .single();
        if (callerFaction) {
            await supabase.from('factions')
                .update({ approval_rating: Math.max(0, (callerFaction.approval_rating ?? 50) - 5) })
                .eq('id', callingPartyId);
        }

        // PM's party gets +3 approval
        if (pmFactionId) {
            const { data: pmFaction } = await supabase
                .from('factions')
                .select('approval_rating')
                .eq('id', pmFactionId)
                .single();
            if (pmFaction) {
                await supabase.from('factions')
                    .update({ approval_rating: Math.min(100, (pmFaction.approval_rating ?? 50) + 3) })
                    .eq('id', pmFactionId);
            }
        }

        // Record cooldown: store the tick when the no-confidence failed
        await supabase.from('campaign_actions').insert({
            party_id: callingPartyId,
            nation_id: nationId,
            action_type: 'no_confidence_failed',
            tick_performed: currentTick,
            result: { votes_for: votesFor, votes_against: votesAgainst, pm_last_name: pmLastName }
        });

        // Log event
        await supabase.from('event_log').insert({
            nation_id: nationId,
            event_name: 'No Confidence — Motion Fails',
            fired_at_tick: currentTick,
            category: 'government',
            description_chosen: `Motion of no confidence against the ${pmLastName} Government failed ${votesFor} to ${votesAgainst}.`,
            effects_applied: { caller_approval: -5, pm_approval: +3 }
        });
    }
}


// ==================== EARLY ELECTIONS ====================

/**
 * Call for early elections (PM action).
 * Transitions government to caretaker, freezes legislation, schedules election in 2 ticks.
 *
 * @param {object} supabase    - Supabase client
 * @param {string} nationId    - Nation UUID
 * @param {string} pmFactionId - PM's faction UUID
 * @param {Array}  coalitionPartyIds - All coalition party IDs
 */
async function callEarlyElectionsAction(supabase, nationId, pmFactionId, coalitionPartyIds) {
    // Presidential systems cannot call early elections
    const { data: nationCheck } = await supabase.from('nations').select('government_type').eq('id', nationId).single();
    if (nationCheck?.government_type === 'Presidential') return { success: false, error: 'Presidential systems cannot call early elections' };

    // 0. Server-side guard: only proceed if coalition is still 'formed' (check both tables)
    let govStatus = null;
    const { data: activeGov } = await supabase
        .from('government_formations')
        .select('id, status')
        .eq('nation_id', nationId)
        .in('status', ['formed', 'caretaker'])
        .order('formed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    if (activeGov) {
        govStatus = activeGov.status;
    } else {
        // Fallback: check legacy active_coalitions
        const { data: legacyGov } = await supabase
            .from('active_coalitions')
            .select('id, status')
            .eq('nation_id', nationId)
            .is('dissolved_at', null)
            .order('formed_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        govStatus = legacyGov?.status || 'formed'; // legacy rows without status default to formed
    }

    if (govStatus === 'caretaker') {
        throw new Error('The government is already in caretaker mode.');
    }

    // 1. Get current tick
    const { data: shard } = await supabase
        .from('shard')
        .select('current_tick')
        .eq('name', 'Alpha Shard')
        .single();
    const currentTick = shard?.current_tick || 0;

    // 2. Apply approval penalties — PM party: -5, other coalition parties: -3
    for (const partyId of coalitionPartyIds) {
        const { data: faction } = await supabase
            .from('factions')
            .select('approval_rating')
            .eq('id', partyId)
            .single();
        if (!faction) continue;

        const penalty = partyId === pmFactionId
            ? GAME_CONFIG.EARLY_ELECTION_PM_APPROVAL_COST
            : GAME_CONFIG.EARLY_ELECTION_COALITION_APPROVAL_COST;
        await supabase.from('factions')
            .update({ approval_rating: Math.max(0, (faction.approval_rating ?? 50) - penalty) })
            .eq('id', partyId);
    }

    // 3. Set government to caretaker (both tables — legacy active_coalitions may be source)
    await supabase
        .from('government_formations')
        .update({ status: 'caretaker' })
        .eq('nation_id', nationId)
        .in('status', ['formed']);
    await supabase
        .from('active_coalitions')
        .update({ status: 'caretaker' })
        .eq('nation_id', nationId)
        .is('dissolved_at', null);

    // 4. Cancel any existing scheduled elections
    await supabase
        .from('elections')
        .delete()
        .eq('nation_id', nationId)
        .eq('status', 'scheduled');

    // 5. Schedule early election
    await supabase.from('elections').insert({
        nation_id: nationId,
        election_tick: currentTick + GAME_CONFIG.EARLY_ELECTION_TICKS,
        status: 'scheduled'
    });

    // 6. Freeze all active bills (committee and floor)
    await supabase
        .from('bills')
        .update({ status: 'frozen' })
        .eq('nation_id', nationId)
        .in('status', ['committee', 'floor']);

    // 7. Get PM name for event text
    const { data: hog } = await supabase
        .from('head_of_government')
        .select('first_name, last_name')
        .eq('nation_id', nationId)
        .eq('active', true)
        .maybeSingle();
    const pmName = hog ? `${hog.first_name} ${hog.last_name}` : 'The Prime Minister';

    // 8. Fire system event
    await supabase.from('event_log').insert({
        nation_id: nationId,
        event_name: 'Legislature Dissolved — Early Elections Called',
        fired_at_tick: currentTick,
        category: 'government',
        description_chosen: `Prime Minister ${pmName} has dissolved the Legislature. Caretaker government in place until elections.`,
        effects_applied: {
            caretaker: true,
            election_tick: currentTick + GAME_CONFIG.EARLY_ELECTION_TICKS,
            pm_approval: -GAME_CONFIG.EARLY_ELECTION_PM_APPROVAL_COST,
            coalition_approval: -GAME_CONFIG.EARLY_ELECTION_COALITION_APPROVAL_COST,
            bills_frozen: true
        }
    });

    return { success: true, electionTick: currentTick + GAME_CONFIG.EARLY_ELECTION_TICKS };
}


// ==================== GOVERNMENT VACANCY PENALTIES ====================

/**
 * Process government vacancy penalties for democracies.
 *
 * When a democracy has no active coalition after an election:
 *   - Every tick: -2 approval to ALL parties, -1 stability to nation
 *   - At FORMATION_DEADLINE_TICKS: snap election triggered
 *     - Largest party: -10% approval before snap vote
 *     - Second largest: -5% approval before snap vote
 *     - New election scheduled for next tick
 *
 * @param {object} supabase    - Supabase client
 * @param {object} nation      - Full nation row
 * @param {number} currentTick - Current tick number
 * @returns {Promise<object|null>} Summary of actions taken, or null if not applicable
 */
async function processGovernmentVacancy(supabase, nation, currentTick) {
    // Only applies to parliamentary democracies
    if (nation.government_type === 'Autocracy') return null;
    if (nation.government_type === 'Presidential') return null; // No coalition formation needed

    // Check for active coalition
    const coalition = await fetchActiveCoalition(supabase, nation.id);
    if (coalition) return null;

    // Get latest completed election
    const { data: election } = await supabase
        .from('elections')
        .select('id, election_tick, results')
        .eq('nation_id', nation.id)
        .eq('status', 'completed')
        .order('election_tick', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (!election) return null;

    // Check if any party has outright majority (no coalition needed)
    // Use nation-specific total_seats for correct majority threshold
    const majoritySeatThreshold = Math.ceil((nation.total_seats || GAME_CONFIG.TOTAL_SEATS) * GAME_CONFIG.MAJORITY_THRESHOLD);
    const votes = election.results?.votes || [];
    const majorityParty = votes.find(p => p.seats >= majoritySeatThreshold);
    if (majorityParty) return null;

    // Calculate ticks since election
    const ticksElapsed = currentTick - election.election_tick;
    if (ticksElapsed <= 0) return null;

    const result = {
        nation: nation.name,
        ticksElapsed,
        penaltiesApplied: true,
        approvalLoss: -2,
        stabilityLoss: -1
    };

    // ===== SNAP ELECTION CHECK =====
    if (ticksElapsed >= FORMATION_DEADLINE_TICKS) {
        console.log(`SNAP ELECTION triggered for ${nation.name} — ${ticksElapsed} ticks without government`);

        // Get all parties sorted by seats for penalty targeting
        const { data: parties } = await supabase
            .from('factions')
            .select('id, faction_name, approval_rating, seats')
            .eq('nation_id', nation.id)
            .eq('faction_type', 'party')
            .order('seats', { ascending: false });

        if (parties && parties.length > 0) {
            // Largest party: -10% approval
            const largest = parties[0];
            const newApprovalLargest = Math.max(0, (largest.approval_rating ?? 50) - 10);
            await supabase.from('factions')
                .update({ approval_rating: newApprovalLargest })
                .eq('id', largest.id);
            console.log(`  Snap penalty: ${largest.faction_name} -10% approval (${largest.approval_rating} → ${newApprovalLargest})`);

            // Second largest: -5% approval
            if (parties.length > 1) {
                const second = parties[1];
                const newApprovalSecond = Math.max(0, (second.approval_rating ?? 50) - 5);
                await supabase.from('factions')
                    .update({ approval_rating: newApprovalSecond })
                    .eq('id', second.id);
                console.log(`  Snap penalty: ${second.faction_name} -5% approval (${second.approval_rating} → ${newApprovalSecond})`);
            }
        }

        // Schedule snap election for next tick
        const { data: existingScheduled } = await supabase
            .from('elections')
            .select('id')
            .eq('nation_id', nation.id)
            .eq('status', 'scheduled')
            .limit(1)
            .maybeSingle();

        if (existingScheduled) {
            await supabase.from('elections')
                .update({ election_tick: currentTick + 1 })
                .eq('id', existingScheduled.id);
            console.log(`  Moved existing scheduled election to tick ${currentTick + 1}`);
        } else {
            await supabase.from('elections').insert({
                nation_id: nation.id,
                election_tick: currentTick + 1,
                status: 'scheduled'
            });
            console.log(`  Scheduled snap election for tick ${currentTick + 1}`);
        }

        // Log the snap election event
        await supabase.from('event_log').insert({
            nation_id: nation.id,
            event_name: 'SNAP_ELECTION',
            description_used: `Snap election called in ${nation.name} after ${ticksElapsed} ticks without a government.`,
            category: 'POLITICAL',
            effects_applied: {
                largest_party: parties?.[0]?.faction_name,
                largest_penalty: -10,
                second_party: parties?.[1]?.faction_name,
                second_penalty: -5,
                ticks_without_gov: ticksElapsed
            },
            fired_at_tick: currentTick
        }).then(({ error }) => {
            if (error) console.warn('Snap election event log failed:', error.message);
        });

        result.snapElection = true;
        result.snapTick = currentTick + 1;
        return result;
    }

    // ===== ONGOING PENALTIES =====
    // -2 approval to ALL parties
    const { data: parties } = await supabase
        .from('factions')
        .select('id, faction_name, approval_rating')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');

    for (const party of (parties || [])) {
        const newApproval = Math.max(0, (party.approval_rating ?? 50) - 2);
        await supabase.from('factions')
            .update({ approval_rating: newApproval })
            .eq('id', party.id);
    }

    // -1 stability to nation
    const newStability = Math.max(0, (nation.stability ?? 50) - 1);
    await supabase.from('nations')
        .update({ stability: newStability })
        .eq('id', nation.id);

    // Update in-memory nation object for downstream processors
    nation.stability = newStability;

    console.log(`Government vacancy: ${nation.name} tick ${ticksElapsed}/${FORMATION_DEADLINE_TICKS} — all parties -2 approval, nation -1 stability (→ ${newStability})`);

    return result;
}


// ==================== TICK PROCESSOR ====================

// ==================== PARTIAL ELECTION (FOUNDATIONAL BILL) ====================

async function processPartialElection(supabase, nation, election, currentTick) {
    const deltaSeats = election.partial_seats;
    console.log(`Processing partial election for ${nation.name}: +${deltaSeats} new seats`);

    // 1. Load voter blocs
    const { data: blocs } = await supabase
        .from('voter_blocs').select('*')
        .eq('nation_id', nation.id).eq('is_active', true);

    if (!blocs || blocs.length === 0) {
        console.warn('No voter blocs found for partial election');
        await supabase.from('elections').update({ status: 'completed', results: { partial: true, error: 'no_blocs' } }).eq('id', election.id);
        return;
    }

    // 2. Scale bloc voter_counts to eligible_voters (same pattern as runElectionPreview)
    const eligibleVoters = nation.eligible_voters || 0;
    const totalBlocVoters = blocs.reduce((s, b) => s + (b.voter_count || 0), 0);
    if (totalBlocVoters > 0 && eligibleVoters > 0) {
        const scale = eligibleVoters / totalBlocVoters;
        let scaledSum = 0;
        for (const b of blocs) {
            b.voter_count = Math.round((b.voter_count || 0) * scale);
            scaledSum += b.voter_count;
        }
        const diff = eligibleVoters - scaledSum;
        if (diff !== 0) {
            const largest = blocs.reduce((a, b) => (b.voter_count > a.voter_count ? b : a), blocs[0]);
            largest.voter_count += diff;
        }
    }

    // 3. Load parties with ideology axes (same pattern as runElectionPreview)
    const { data: factions } = await supabase
        .from('factions').select('id, faction_name, approval_rating, ideology_modifiers, seats')
        .eq('nation_id', nation.id).eq('faction_type', 'party');

    if (!factions || factions.length === 0) {
        console.warn('No parties found for partial election');
        await supabase.from('elections').update({ status: 'completed', results: { partial: true, error: 'no_parties' } }).eq('id', election.id);
        return;
    }

    const factionIds = factions.map(f => f.id);
    const { data: ideologies } = await supabase
        .from('faction_ideology').select('*').in('faction_id', factionIds);
    const ideoMap = {};
    for (const row of (ideologies || [])) ideoMap[row.faction_id] = row;

    const parties = factions.map(f => ({
        id: f.id, faction_name: f.faction_name,
        approval_rating: f.approval_rating ?? 0,
        ideology_modifiers: f.ideology_modifiers || {},
        axes: ideoMap[f.id] || {
            liberty_equality: 0, tradition_progress: 0, security_freedom: 0,
            globalism_nationalism: 0, individualism_collectivism: 0
        }
    }));

    // 4. Run election simulation for ONLY the delta seats
    const result = runElectionSimulation(blocs, parties, deltaSeats);

    // 5. ADD delta seats to each party's existing seats
    for (const faction of factions) {
        const deltaForParty = result.seats[faction.id] || 0;
        const newTotal = (faction.seats || 0) + deltaForParty;
        await supabase.from('factions').update({ seats: newTotal }).eq('id', faction.id);
    }

    // 6. Build results and mark election as completed
    const seatResults = factions.map(f => ({
        party_id: f.id,
        party_name: f.faction_name,
        existing_seats: f.seats || 0,
        new_seats: result.seats[f.id] || 0,
        total_seats: (f.seats || 0) + (result.seats[f.id] || 0),
        votes: result.votes[f.id] || 0
    }));

    await supabase.from('elections').update({
        status: 'completed',
        results: {
            partial: true,
            delta_seats: deltaSeats,
            votes: seatResults,
            seats: seatResults,
            total_votes_cast: result.totalVotesCast,
            total_abstentions: result.totalAbstentions
        }
    }).eq('id', election.id);

    console.log(`Partial election completed: ${deltaSeats} new seats allocated across ${factions.length} parties`);
}

async function resolveManualElectionContext(supabase, nation, currentTick, requestedElectionType = null) {
    const governmentType = nation?.government_type || 'Democracy';
    if (governmentType !== 'Presidential') {
        return {
            governmentType,
            electionType: 'parliamentary',
            forcedOutsideSchedule: false,
            nextScheduledTick: null
        };
    }

    let electionType = requestedElectionType;
    if (!electionType) {
        const { data: dueScheduledElection } = await supabase
            .from('elections')
            .select('id, election_type')
            .eq('nation_id', nation.id)
            .eq('status', 'scheduled')
            .lte('election_tick', currentTick)
            .order('election_tick', { ascending: true })
            .limit(1)
            .maybeSingle();
        electionType = dueScheduledElection?.election_type || 'presidential';
    }

    const { data: nextScheduled } = await supabase
        .from('elections')
        .select('election_tick')
        .eq('nation_id', nation.id)
        .eq('status', 'scheduled')
        .eq('election_type', electionType)
        .order('election_tick', { ascending: true })
        .limit(1)
        .maybeSingle();

    const nextScheduledTick = nextScheduled?.election_tick ?? null;
    return {
        governmentType,
        electionType,
        forcedOutsideSchedule: !!(nextScheduledTick && nextScheduledTick > currentTick),
        nextScheduledTick
    };
}

async function runManualElectionByGovernmentType(supabase, nation, options = {}) {
    if (!nation?.id) throw new Error('Nation is required');

    const currentTick = Number.isInteger(options.currentTick)
        ? options.currentTick
        : (await getCurrentTick(supabase));

    const context = await resolveManualElectionContext(supabase, nation, currentTick, options.electionType);
    const isPresidential = context.governmentType === 'Presidential';

    const { error: runError } = await supabase.rpc('run_election', { p_nation_id: nation.id });
    if (runError) throw runError;

    const { data: completedElection, error: electionError } = await supabase
        .from('elections')
        .select('id, election_tick, election_type, results, created_at')
        .eq('nation_id', nation.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    if (electionError) throw electionError;

    const normalizedElectionType = context.electionType || completedElection.election_type || 'parliamentary';

    await supabase
        .from('elections')
        .update({ election_type: normalizedElectionType })
        .eq('id', completedElection.id);

    const seatResults = completedElection?.results?.seats || [];
    for (const r of seatResults) {
        await supabase
            .from('factions')
            .update({ seats: r.seats })
            .eq('id', r.party_id);
    }

    if (isPresidential && normalizedElectionType === 'presidential') {
        await processPresidentialElectionResult(supabase, nation, completedElection, currentTick);
    }

    return {
        success: true,
        nationId: nation.id,
        governmentType: context.governmentType,
        electionType: normalizedElectionType,
        forcedOutsideSchedule: context.forcedOutsideSchedule,
        nextScheduledTick: context.nextScheduledTick,
        currentTick,
        completedElection,
        seatResults
    };
}

async function processElections(supabase, nation, currentTick) {
    if (nation.government_type === 'Autocracy') return [];

    const isPresidential = nation.government_type === 'Presidential';
    const results = [];

    const { data: dueElections } = await supabase
        .from('elections')
        .select('*')
        .eq('nation_id', nation.id)
        .eq('status', 'scheduled')
        .lte('election_tick', currentTick);

    // For presidential systems, process parliamentary elections before presidential ones
    // so seats are allocated before we determine the popular vote winner
    const sorted = (dueElections || []).sort((a, b) => {
        if (a.election_type === 'parliamentary' && b.election_type === 'presidential') return -1;
        if (a.election_type === 'presidential' && b.election_type === 'parliamentary') return 1;
        return 0;
    });

    for (const election of sorted) {
        const electionType = election.election_type || 'parliamentary';
        console.log(`Processing ${electionType} election for ${nation.name} (tick ${currentTick})`);

        // Partial election — only allocate delta seats (from foundational bill)
        if (election.partial_seats && election.partial_seats > 0) {
            await processPartialElection(supabase, nation, election, currentTick);
            results.push({ electionId: election.id, nation: nation.name, partial: true, deltaSeats: election.partial_seats });
            continue;
        }

        const { data, error } = await supabase.rpc('run_election', {
            p_nation_id: nation.id
        });

        if (error) {
            console.error('Election processing error:', error);
            continue;
        }

        // Mark the scheduled election record as completed so it doesn't re-fire
        await supabase.from('elections')
            .update({ status: 'completed' })
            .eq('id', election.id);

        // Sync seats back to factions table (run_election creates a new record, so
        // look up the latest completed election for this nation to get results)
        const { data: completedElection } = await supabase
            .from('elections').select('results')
            .eq('nation_id', nation.id)
            .eq('status', 'completed')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (completedElection?.results?.seats) {
            for (const r of completedElection.results.seats) {
                await supabase
                    .from('factions')
                    .update({ seats: r.seats })
                    .eq('id', r.party_id);
            }
            console.log(`Seats synced to factions for ${nation.name}`);
        }

        // Dissolve legislature — fail all pending bills (new parliament must re-propose)
        const { data: dissolvedBills } = await supabase.from('bills')
            .update({ status: 'failed' })
            .eq('nation_id', nation.id)
            .in('status', ['committee', 'floor'])
            .select('id');

        if (dissolvedBills?.length > 0) {
            console.log(`Dissolved ${dissolvedBills.length} pending bill(s) after election for ${nation.name}`);
        }

        // === PRESIDENTIAL SYSTEM: handle presidential vs parliamentary elections ===
        if (isPresidential && electionType === 'presidential') {
            // Fail any bills sitting on the outgoing president's desk
            const { data: deskBills } = await supabase.from('bills')
                .update({ status: 'failed' })
                .eq('nation_id', nation.id)
                .eq('status', 'president_desk')
                .select('id');
            if (deskBills?.length > 0) {
                console.log(`Failed ${deskBills.length} bill(s) on president's desk after presidential election for ${nation.name}`);
            }

            await processPresidentialElectionResult(supabase, nation, completedElection, currentTick);
        } else if (isPresidential && electionType === 'parliamentary') {
            // Midterm parliamentary election — seats reshuffled, president stays, desk bills remain
            console.log(`Midterm parliamentary election for ${nation.name} — president stays in office`);
        } else {
            // === PARLIAMENTARY DEMOCRACY: dissolve existing government after election ===
            // After any election, the old government (whether 'formed' or 'caretaker')
            // must be dissolved so that processGovernmentVacancy can apply -2 approval
            // penalties until a new coalition is formed.
            let existingGov = null;
            let existingGovSource = null;
            const { data: govFormation } = await supabase
                .from('government_formations')
                .select('id, status')
                .eq('nation_id', nation.id)
                .in('status', ['formed', 'caretaker'])
                .maybeSingle();
            if (govFormation) {
                existingGov = govFormation;
                existingGovSource = 'government_formations';
            } else {
                const { data: legacyGov } = await supabase
                    .from('active_coalitions')
                    .select('id, status')
                    .eq('nation_id', nation.id)
                    .is('dissolved_at', null)
                    .maybeSingle();
                if (legacyGov) {
                    existingGov = legacyGov;
                    existingGovSource = 'active_coalitions';
                }
            }

            if (existingGov) {
                console.log(`Dissolving ${existingGov.status} government after election for ${nation.name} (source: ${existingGovSource})`);

                // Fail all frozen bills (from caretaker period)
                await supabase.from('bills')
                    .update({ status: 'failed' })
                    .eq('nation_id', nation.id)
                    .eq('status', 'frozen');

                // Close the administration
                try {
                    const { data: fullNation } = await supabase.from('nations').select('*').eq('id', nation.id).single();
                    const { data: shardData } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
                    if (fullNation) {
                        await closeAdministration(supabase, nation.id, fullNation, 'dissolved', currentTick, shardData?.current_date || '', null);
                    }
                } catch (adminErr) { console.warn('Could not close administration on election:', adminErr); }

                // Dissolve government in BOTH tables
                await supabase
                    .from('government_formations')
                    .update({ status: 'dissolved' })
                    .eq('nation_id', nation.id)
                    .in('status', ['formed', 'caretaker']);

                await supabase
                    .from('active_coalitions')
                    .update({ dissolved_at: new Date().toISOString() })
                    .eq('nation_id', nation.id)
                    .is('dissolved_at', null);

                // Deactivate PM
                await supabase
                    .from('head_of_government')
                    .update({ active: false })
                    .eq('nation_id', nation.id)
                    .eq('active', true);

                // Vacate all ministries
                await supabase
                    .from('ministries')
                    .update({
                        minister_first_name: null,
                        minister_last_name: null,
                        minister_age: null,
                        party_id: null
                    })
                    .eq('nation_id', nation.id)
                    .eq('is_active', true);
            }
        }

        results.push({
            electionId: election.id,
            nation: nation.name,
            electionType,
            result: data
        });
    }

    // === SCHEDULE NEXT ELECTIONS ===
    if (isPresidential) {
        await scheduleNextPresidentialElections(supabase, nation, currentTick);
    } else {
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
    }

    return results;
}

/**
 * Presidential election result: determine popular vote winner and generate president candidates.
 */
async function processPresidentialElectionResult(supabase, nation, completedElection, currentTick) {
    const voteResults = completedElection?.results?.votes || completedElection?.results?.seats || [];
    if (voteResults.length === 0) {
        console.warn(`No vote data for presidential election in ${nation.name}`);
        return;
    }

    // Winner = party with the most total popular votes
    const winner = voteResults.reduce((best, p) => (p.votes > best.votes) ? p : best, voteResults[0]);
    console.log(`Presidential election winner: ${winner.party_name} with ${winner.votes} votes (${nation.name})`);

    // Deactivate previous president
    await supabase
        .from('presidents')
        .update({ is_active: false })
        .eq('nation_id', nation.id)
        .eq('is_active', true);

    // Close previous administration
    try {
        const { data: fullNation } = await supabase.from('nations').select('*').eq('id', nation.id).single();
        const { data: shardData } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
        if (fullNation) {
            await closeAdministration(supabase, nation.id, fullNation, 'election_loss', currentTick, shardData?.current_date || '', null);
        }
    } catch (adminErr) { console.warn('Could not close administration on presidential election:', adminErr); }

    // Set ruling faction to the winner
    await supabase.from('nations')
        .update({ ruling_faction_id: winner.party_id })
        .eq('id', nation.id);

    // Look up the winning party's pre-selected presidential candidate
    const { data: winningCandidate } = await supabase
        .from('pm_candidates')
        .select('*')
        .eq('nation_id', nation.id)
        .eq('faction_id', winner.party_id)
        .eq('candidate_type', 'presidential')
        .eq('selected', true)
        .limit(1)
        .maybeSingle();

    if (winningCandidate) {
        // Auto-inaugurate the winning candidate
        await inauguratePresident(supabase, winningCandidate, nation.id, winner.party_id, currentTick);
        console.log(`President inaugurated: ${winningCandidate.first_name} ${winningCandidate.last_name} (${winner.party_name})`);
    } else {
        // Fallback: if no pre-selected candidate (e.g. player didn't pick in time),
        // grab any presidential candidate for the winning party
        const { data: fallbackCandidate } = await supabase
            .from('pm_candidates')
            .select('*')
            .eq('nation_id', nation.id)
            .eq('faction_id', winner.party_id)
            .eq('candidate_type', 'presidential')
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();

        if (fallbackCandidate) {
            await inauguratePresident(supabase, fallbackCandidate, nation.id, winner.party_id, currentTick);
            console.log(`President inaugurated (fallback): ${fallbackCandidate.first_name} ${fallbackCandidate.last_name} (${winner.party_name})`);
        } else {
            // No candidates at all — generate one and inaugurate immediately
            console.warn(`No presidential candidate found for winning party ${winner.party_name} in ${nation.name} — generating emergency candidate`);
            const emergencyCandidates = await generatePresidentCandidates(supabase, nation.id, winner.party_id, currentTick, 'presidential');
            if (emergencyCandidates && emergencyCandidates.length > 0) {
                await inauguratePresident(supabase, emergencyCandidates[0], nation.id, winner.party_id, currentTick);
                console.log(`Emergency president inaugurated: ${emergencyCandidates[0].first_name} ${emergencyCandidates[0].last_name}`);
            }
        }
    }

    // Clean up all presidential candidates after election
    await supabase.from('pm_candidates').delete()
        .eq('nation_id', nation.id)
        .eq('candidate_type', 'presidential');

    // Fire system event
    try {
        await supabase.rpc('fire_system_event', {
            p_trigger_key: 'presidential_election',
            p_nation_id: nation.id,
            p_tick: currentTick,
            p_placeholders: {
                nation: nation.name,
                winning_party: winner.party_name,
                winning_candidate: winningCandidate ? `${winningCandidate.first_name} ${winningCandidate.last_name}` : 'TBD',
                votes: winner.votes,
                vote_percentage: winner.vote_percentage || '?'
            }
        });
    } catch (e) { console.warn('Presidential election event fire failed (non-blocking):', e); }
}

/**
 * Inaugurate a president from a candidate record. Creates the president row,
 * applies ideology shift, applies trait effects, and creates an administration.
 * Used by both processPresidentialElectionResult (auto-inauguration) and
 * selectPresidentCandidate (manual/legacy selection).
 */
async function inauguratePresident(supabase, candidate, nationId, factionId, currentTick) {
    // Deactivate any previous president
    await supabase.from('presidents')
        .update({ is_active: false })
        .eq('nation_id', nationId)
        .eq('is_active', true);

    // Look up trait data for trait_upside / trait_downside
    const { data: trait } = await supabase.from('leader_traits').select('*').eq('trait_key', candidate.trait_key).maybeSingle();

    // Insert president record (with trait_upside / trait_downside populated)
    const { error: presErr } = await supabase.from('presidents').insert({
        nation_id: nationId,
        faction_id: factionId,
        first_name: candidate.first_name,
        last_name: candidate.last_name,
        age: candidate.age,
        ideology: candidate.ideology,
        trait: candidate.trait_key,
        trait_upside: trait?.upside || null,
        trait_downside: trait?.downside || null,
        elected_tick: currentTick,
        term_ends_tick: currentTick + GAME_CONFIG.PRESIDENTIAL_TERM_TICKS,
        is_active: true
    });
    if (presErr) throw presErr;

    // Apply ideology shift (+5 on candidate's axis) — with null guard
    const axisKey = candidate.ideology_axis;
    const direction = candidate.ideology_direction;
    if (axisKey && typeof direction === 'number') {
        const shift = 5 * direction;
        const factionIdeology = await loadFactionIdeology(supabase, factionId);
        if (factionIdeology) {
            const currentVal = factionIdeology[axisKey] || 0;
            const newVal = Math.max(-100, Math.min(100, currentVal + shift));
            await supabase.from('faction_ideology').update({ [axisKey]: newVal }).eq('faction_id', factionId);
            console.log(`President ideology shift: ${axisKey} ${currentVal} → ${newVal} (${shift > 0 ? '+' : ''}${shift})`);
        }
    }

    // Apply trait effects (same logic as PM)
    if (trait?.effects) {
        if (trait.effects.on_appoint_stability) {
            const { data: nationRow } = await supabase.from('nations').select('stability').eq('id', nationId).single();
            if (nationRow) {
                const newStability = Math.min(100, (nationRow.stability || 50) + trait.effects.on_appoint_stability);
                await supabase.from('nations').update({ stability: newStability }).eq('id', nationId);
            }
        }
        if (trait.effects.npc_approval_shift) {
            const { data: npcParties } = await supabase.from('factions').select('id, approval_rating')
                .eq('nation_id', nationId).eq('is_npc', true).eq('faction_type', 'party');
            for (const npc of (npcParties || [])) {
                const newApproval = Math.max(0, Math.min(100, (npc.approval_rating ?? 50) + trait.effects.npc_approval_shift));
                await supabase.from('factions').update({ approval_rating: newApproval }).eq('id', npc.id);
            }
        }
    }

    // Get faction info for administration record
    const { data: faction } = await supabase.from('factions').select('faction_name, seats, approval_rating').eq('id', factionId).single();
    const { data: shardData } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
    const { data: fullNation } = await supabase.from('nations').select('*').eq('id', nationId).single();

    // Parse year safely from current_date (handles formats like "Month Day, Year" or just "Year")
    const dateStr = shardData?.current_date || '';
    const yearMatch = dateStr.match(/\d{4}/);
    const year = yearMatch ? yearMatch[0] : '';

    // Create new administration
    await supabase.from('administrations').insert({
        nation_id: nationId,
        admin_name: `${candidate.last_name} Administration${year ? ', ' + year : ''}`,
        head_of_state: `${candidate.first_name} ${candidate.last_name}`,
        president_name: `${candidate.first_name} ${candidate.last_name}`,
        president_party_id: factionId,
        president_party_name: faction?.faction_name || '',
        coalition_parties: [{ party_id: factionId, party_name: faction?.faction_name || '', seats: faction?.seats || 0 }],
        total_seats: faction?.seats || 0,
        government_type: 'Presidential',
        started_at_tick: currentTick,
        started_at_date: dateStr,
        stats_at_start: fullNation ? snapshotNationStats(fullNation) : {},
        approval_at_start: faction?.approval_rating ?? 50
    });

    return candidate;
}

/**
 * Schedule next presidential + parliamentary elections independently.
 * Presidential every PRESIDENTIAL_TERM_TICKS, parliamentary every PARLIAMENTARY_TERM_TICKS.
 */
async function scheduleNextPresidentialElections(supabase, nation, currentTick) {
    // Check for future parliamentary election
    const { data: futureParl } = await supabase
        .from('elections')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('status', 'scheduled')
        .eq('election_type', 'parliamentary')
        .gt('election_tick', currentTick)
        .limit(1)
        .maybeSingle();

    if (!futureParl) {
        const nextParl = currentTick + GAME_CONFIG.PARLIAMENTARY_TERM_TICKS;
        await supabase.from('elections').insert({
            nation_id: nation.id,
            election_tick: nextParl,
            election_type: 'parliamentary',
            status: 'scheduled'
        });
        console.log(`Scheduled next parliamentary election for ${nation.name} at tick ${nextParl}`);
    }

    // Check for future presidential election
    const { data: futurePres } = await supabase
        .from('elections')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('status', 'scheduled')
        .eq('election_type', 'presidential')
        .gt('election_tick', currentTick)
        .limit(1)
        .maybeSingle();

    if (!futurePres) {
        const nextPres = currentTick + GAME_CONFIG.PRESIDENTIAL_TERM_TICKS;
        await supabase.from('elections').insert({
            nation_id: nation.id,
            election_tick: nextPres,
            election_type: 'presidential',
            status: 'scheduled'
        });
        console.log(`Scheduled next presidential election for ${nation.name} at tick ${nextPres}`);
    }
}

/**
 * Generate 3 president candidates for a party (reuses PM candidate generation pattern).
 * Candidates are stored in pm_candidates table with candidate_type = 'presidential';
 * select-president.html reads them.
 *
 * @param {string} candidateType - 'presidential' (default)
 */
async function generatePresidentCandidates(supabase, nationId, factionId, currentTick, candidateType = 'presidential') {
    const factionIdeology = await loadFactionIdeology(supabase, factionId);

    // Clear any existing unselected presidential candidates for this faction
    await supabase
        .from('pm_candidates')
        .delete()
        .eq('nation_id', nationId)
        .eq('faction_id', factionId)
        .eq('candidate_type', 'presidential')
        .eq('selected', false);

    const weightedIdeologies = getWeightedIdeologies(factionIdeology);

    const chosenIdeologies = [];
    const availableIdeologies = [...weightedIdeologies];
    for (let i = 0; i < 3; i++) {
        const pick = weightedRandomPick(availableIdeologies);
        chosenIdeologies.push(pick.item);
        const sameAxis = availableIdeologies.filter(
            wi => wi.item.axisKey === pick.item.axisKey
        );
        sameAxis.forEach(sa => {
            const idx = availableIdeologies.indexOf(sa);
            if (idx >= 0) availableIdeologies.splice(idx, 1);
        });
    }

    const shuffledTraits = [...PM_TRAIT_KEYS].sort(() => Math.random() - 0.5);
    const chosenTraits = shuffledTraits.slice(0, 3);

    const usedFirstNames = new Set();
    const usedLastNames = new Set();
    const candidates = [];

    for (let i = 0; i < 3; i++) {
        let firstName, lastName;

        do { firstName = PM_FIRST_NAMES[Math.floor(Math.random() * PM_FIRST_NAMES.length)]; }
        while (usedFirstNames.has(firstName));
        usedFirstNames.add(firstName);

        do { lastName = PM_LAST_NAMES[Math.floor(Math.random() * PM_LAST_NAMES.length)]; }
        while (usedLastNames.has(lastName));
        usedLastNames.add(lastName);

        const age = 40 + Math.floor(Math.random() * 21); // Presidents: age 40-60
        const ideology = chosenIdeologies[i];

        candidates.push({
            nation_id: nationId,
            faction_id: factionId,
            first_name: firstName,
            last_name: lastName,
            age: age,
            ideology: ideology.tag,
            ideology_axis: ideology.axisKey,
            ideology_direction: ideology.direction,
            trait_key: chosenTraits[i],
            created_at_tick: currentTick,
            candidate_type: candidateType,
            selected: false
        });
    }

    const { data, error } = await supabase
        .from('pm_candidates')
        .insert(candidates)
        .select();

    if (error) {
        console.error('Error generating president candidates:', error);
        throw error;
    }

    console.log(`Generated 3 president candidates for faction ${factionId}`);
    return data;
}

/**
 * Select a presidential nominee BEFORE the election. Marks the candidate as selected
 * and deletes the other options. The actual inauguration happens automatically when
 * the election resolves via processPresidentialElectionResult → inauguratePresident.
 */
async function selectPresidentCandidate(supabase, candidateId, nationId, factionId, currentTick) {
    const { data: candidate, error: fetchErr } = await supabase
        .from('pm_candidates')
        .select('*')
        .eq('id', candidateId)
        .single();

    if (fetchErr || !candidate) throw new Error('Candidate not found');
    if (candidate.faction_id !== factionId) throw new Error('Not your candidate');

    // Mark selected, delete others for this faction
    await supabase.from('pm_candidates').update({ selected: true }).eq('id', candidateId);
    await supabase.from('pm_candidates').delete()
        .eq('nation_id', nationId)
        .eq('faction_id', factionId)
        .eq('candidate_type', 'presidential')
        .eq('selected', false);

    console.log(`Presidential nominee selected: ${candidate.first_name} ${candidate.last_name} (${candidate.trait_key}) for faction ${factionId}`);
    return candidate;
}


// ==================== PRESIDENTIAL MINISTER NOMINATION ====================

/**
 * President nominates a minister for a cabinet slot.
 * Writes pending data to the ministries table and creates a confirmation bill.
 * Parliament votes simple majority; if rejected, the party is blocked for that slot.
 *
 * @param {object} supabase
 * @param {string} nationId
 * @param {string} presidentFactionId - The president's faction (must match active president)
 * @param {string} ministryKey - Which ministry slot (e.g. 'defense', 'finance')
 * @param {object} nominee - { partyId, partyName, firstName, lastName, age }
 */
async function nominateMinister(supabase, nationId, presidentFactionId, ministryKey, nominee) {
    // Validate: must be Presidential system
    const { data: nation } = await supabase.from('nations').select('name, government_type').eq('id', nationId).single();
    if (nation?.government_type !== 'Presidential') throw new Error('Minister nominations only apply to Presidential systems');

    // Validate: caller must be president's party
    const { data: president } = await supabase.from('presidents')
        .select('id, faction_id')
        .eq('nation_id', nationId).eq('is_active', true)
        .limit(1).maybeSingle();
    if (!president || president.faction_id !== presidentFactionId) throw new Error('Only the President\'s party can nominate ministers');

    // Validate: no existing pending confirmation for this slot
    const { data: existingMinistry } = await supabase.from('ministries')
        .select('id, confirmation_status, rejected_parties')
        .eq('nation_id', nationId).eq('ministry_key', ministryKey).eq('is_active', true)
        .maybeSingle();

    if (existingMinistry?.confirmation_status === 'pending') {
        throw new Error('A confirmation vote is already pending for this ministry');
    }

    // Validate: nominee's party was not already rejected for this slot
    const rejectedParties = existingMinistry?.rejected_parties || [];
    if (rejectedParties.includes(nominee.partyId)) {
        throw new Error('This party\'s nominee was already rejected for this ministry slot');
    }

    // Get current tick
    const { data: shard } = await supabase.from('shard').select('current_tick').eq('name', 'Alpha Shard').single();
    const currentTick = shard?.current_tick || 0;

    // Write pending minister data to the ministry row
    const pendingData = {
        party_id: nominee.partyId,
        first_name: nominee.firstName,
        last_name: nominee.lastName,
        age: nominee.age
    };

    if (existingMinistry) {
        await supabase.from('ministries').update({
            confirmation_status: 'pending',
            pending_minister: pendingData
        }).eq('id', existingMinistry.id);
    } else {
        await supabase.from('ministries').insert({
            nation_id: nationId,
            ministry_key: ministryKey,
            ministry_name: null, // Will be filled on confirmation
            is_active: true,
            confirmation_status: 'pending',
            pending_minister: pendingData,
            rejected_parties: []
        });
    }

    // Create confirmation bill (goes straight to floor vote)
    const ministryDisplayName = {
        prime_minister: 'Prime Minister', interior: 'Ministry of the Interior',
        foreign: 'Foreign Ministry', defense: 'Ministry of Defense',
        finance: 'Ministry of Finance', education: 'Ministry of Education',
        healthcare: 'Ministry of Healthcare', labor: 'Ministry of Labor',
        justice: 'Ministry of Justice', transportation: 'Ministry of Transportation',
        security: 'Ministry of Security'
    }[ministryKey] || ministryKey;

    const billName = `Confirmation of ${nominee.firstName} ${nominee.lastName} as ${ministryDisplayName}`;
    const preamble = `The President nominates ${nominee.firstName} ${nominee.lastName} (${nominee.partyName}) to serve as head of the ${ministryDisplayName}. A simple majority (51%) of the legislature is required for confirmation.`;

    const { data: bill, error: billErr } = await supabase.from('bills').insert({
        nation_id: nationId,
        proposed_by: presidentFactionId,
        proposed_tick: currentTick,
        bill_name: billName,
        bill_type: 'minister_confirmation',
        status: 'floor',
        voting_ends_tick: currentTick + GAME_CONFIG.MINISTER_CONFIRMATION_VOTING_TICKS,
        ministry_key: ministryKey,
        preamble
    }).select().single();

    if (billErr) throw billErr;

    console.log(`Minister nomination: ${nominee.firstName} ${nominee.lastName} for ${ministryKey} (bill ${bill.id})`);
    return { bill, nominee };
}


// ==================== PRESIDENTIAL VETO SYSTEM ====================

/**
 * President signs a bill into law.
 * Called from the UI when the President's party clicks "Sign Into Law".
 */
async function signPresidentialBill(supabase, billId, presidentFactionId) {
    const { data: bill } = await supabase.from('bills')
        .select('*, factions(faction_name, ideology_value_1, ideology_value_2), bill_articles(*, policies(*)), bill_support(*, factions(faction_name))')
        .eq('id', billId).single();
    if (!bill || bill.status !== 'president_desk') throw new Error('Bill is not on the president\'s desk');

    // Validate caller is president's party
    const { data: president } = await supabase.from('presidents')
        .select('faction_id').eq('nation_id', bill.nation_id).eq('is_active', true).limit(1).maybeSingle();
    if (!president || president.faction_id !== presidentFactionId) throw new Error('Only the President\'s party can sign bills');

    const { data: shard } = await supabase.from('shard').select('current_tick').eq('name', 'Alpha Shard').single();
    const currentTick = shard?.current_tick || 0;

    await supabase.from('bills').update({
        president_action: 'signed',
        president_action_tick: currentTick
    }).eq('id', bill.id);

    await enactBill(supabase, bill, currentTick);

    try {
        await supabase.rpc('fire_system_event', {
            p_trigger_key: 'bill_passed',
            p_nation_id: bill.nation_id,
            p_tick: currentTick,
            p_placeholders: {
                nation: 'Unknown',
                bill_name: bill.bill_name + ' (signed by President)',
                sponsor: bill.factions?.faction_name || 'Unknown',
                votes_for: '0', votes_against: '0',
                article_count: String((bill.bill_articles || []).length)
            }
        });
    } catch (e) { /* non-blocking */ }
}

/**
 * President vetoes a bill.
 * Auto-creates a veto_override bill requiring 2/3 supermajority.
 */
async function vetoPresidentialBill(supabase, billId, presidentFactionId) {
    const { data: bill } = await supabase.from('bills')
        .select('*, factions(faction_name)')
        .eq('id', billId).single();
    if (!bill || bill.status !== 'president_desk') throw new Error('Bill is not on the president\'s desk');

    const { data: president } = await supabase.from('presidents')
        .select('faction_id').eq('nation_id', bill.nation_id).eq('is_active', true).limit(1).maybeSingle();
    if (!president || president.faction_id !== presidentFactionId) throw new Error('Only the President\'s party can veto bills');

    const { data: shard } = await supabase.from('shard').select('current_tick').eq('name', 'Alpha Shard').single();
    const currentTick = shard?.current_tick || 0;

    // Mark bill as vetoed
    await supabase.from('bills').update({
        status: 'vetoed',
        president_action: 'vetoed',
        president_action_tick: currentTick
    }).eq('id', bill.id);

    // Auto-create veto override bill (goes straight to floor)
    const overrideSeats = Math.ceil(GAME_CONFIG.TOTAL_SEATS * GAME_CONFIG.VETO_OVERRIDE_THRESHOLD);
    const { data: overrideBill } = await supabase.from('bills').insert({
        nation_id: bill.nation_id,
        proposed_by: bill.proposed_by,
        proposed_tick: currentTick,
        bill_name: 'Veto Override: ' + bill.bill_name,
        bill_type: 'veto_override',
        status: 'floor',
        voting_ends_tick: currentTick + GAME_CONFIG.VOTING_WINDOW_TICKS,
        original_bill_id: bill.id,
        is_veto_override: true,
        preamble: `The President has vetoed "${bill.bill_name}". The legislature may override this veto with a two-thirds supermajority (${overrideSeats} of ${GAME_CONFIG.TOTAL_SEATS} seats).`
    }).select().single();

    try {
        await supabase.rpc('fire_system_event', {
            p_trigger_key: 'bill_failed',
            p_nation_id: bill.nation_id,
            p_tick: currentTick,
            p_placeholders: {
                nation: 'Unknown',
                bill_name: bill.bill_name + ' (VETOED by President)',
                sponsor: bill.factions?.faction_name || 'Unknown',
                votes_for: '0', votes_against: '0'
            }
        });
    } catch (e) { /* non-blocking */ }

    return overrideBill;
}

/**
 * Auto-sign bills that have been on the president's desk past the deadline.
 * Called during advanceTick().
 */
async function processPresidentDesk(supabase, nation, currentTick) {
    if (nation.government_type !== 'Presidential') return [];

    const { data: expiredDesks } = await supabase.from('bills')
        .select('*, factions(faction_name, ideology_value_1, ideology_value_2), bill_articles(*, policies(*)), bill_support(*, factions(faction_name))')
        .eq('nation_id', nation.id)
        .eq('status', 'president_desk')
        .lte('president_desk_deadline', currentTick);

    if (!expiredDesks || expiredDesks.length === 0) return [];

    const results = [];
    for (const bill of expiredDesks) {
        // Auto-sign: president didn't act in time
        await supabase.from('bills').update({
            president_action: 'auto_signed',
            president_action_tick: currentTick
        }).eq('id', bill.id);

        await enactBill(supabase, bill, currentTick);

        try {
            await supabase.rpc('fire_system_event', {
                p_trigger_key: 'bill_passed',
                p_nation_id: nation.id,
                p_tick: currentTick,
                p_placeholders: {
                    nation: nation.name,
                    bill_name: bill.bill_name + ' (auto-signed by President)',
                    sponsor: bill.factions?.faction_name || 'Unknown',
                    votes_for: '0', votes_against: '0',
                    article_count: String((bill.bill_articles || []).length)
                }
            });
        } catch (e) { /* non-blocking */ }

        results.push({ billId: bill.id, billName: bill.bill_name, action: 'auto_signed' });
    }
    return results;
}

/**
 * Pre-election candidate generation: PRESIDENTIAL_CANDIDATE_LEAD_TICKS (6) ticks
 * before a scheduled presidential election, generate 3 presidential candidates for
 * EVERY party in the nation. The player's party picks their nominee; NPC parties
 * auto-select their first candidate immediately.
 *
 * Candidates are stored in pm_candidates with candidate_type = 'presidential'.
 */
async function triggerPresidentialCandidateSelection(supabase, nation, currentTick) {
    if (nation.government_type !== 'Presidential') return;

    const leadTicks = GAME_CONFIG.PRESIDENTIAL_CANDIDATE_LEAD_TICKS;

    // Find scheduled presidential elections that are exactly leadTicks away
    const targetTick = currentTick + leadTicks;
    const { data: upcomingElection } = await supabase
        .from('elections')
        .select('id, election_tick')
        .eq('nation_id', nation.id)
        .eq('status', 'scheduled')
        .eq('election_type', 'presidential')
        .eq('election_tick', targetTick)
        .limit(1)
        .maybeSingle();

    if (!upcomingElection) return;

    // Check if candidates were already generated for this election
    const { count: existingCount } = await supabase
        .from('pm_candidates')
        .select('*', { count: 'exact', head: true })
        .eq('nation_id', nation.id)
        .eq('candidate_type', 'presidential');

    if (existingCount > 0) return; // already generated

    console.log(`Generating presidential candidates for all parties in ${nation.name} (election at tick ${targetTick})`);

    // Get all parties in this nation
    const { data: allParties } = await supabase
        .from('factions')
        .select('id, faction_name, is_npc')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');

    if (!allParties || allParties.length === 0) return;

    for (const party of allParties) {
        await generatePresidentCandidates(supabase, nation.id, party.id, currentTick, 'presidential');

        // NPC parties auto-select their first candidate immediately
        if (party.is_npc) {
            const { data: npcCandidates } = await supabase
                .from('pm_candidates')
                .select('id')
                .eq('nation_id', nation.id)
                .eq('faction_id', party.id)
                .eq('candidate_type', 'presidential')
                .eq('selected', false)
                .order('created_at', { ascending: true })
                .limit(1)
                .maybeSingle();

            if (npcCandidates) {
                await supabase.from('pm_candidates').update({ selected: true }).eq('id', npcCandidates.id);
                // Delete the other unselected candidates for this NPC party
                await supabase.from('pm_candidates').delete()
                    .eq('nation_id', nation.id)
                    .eq('faction_id', party.id)
                    .eq('candidate_type', 'presidential')
                    .eq('selected', false);
                console.log(`NPC party ${party.faction_name} auto-selected presidential candidate`);
            }
        }
    }
}

/**
 * Safety net: if an active president's term has expired and no presidential election
 * is scheduled, schedule one immediately. Also deactivates the president if term
 * has expired and a new president was already elected (shouldn't happen, but guards).
 */
async function processPresidentialTermEnd(supabase, nation, currentTick) {
    if (nation.government_type !== 'Presidential') return;

    const { data: president } = await supabase
        .from('presidents')
        .select('id, faction_id, term_ends_tick')
        .eq('nation_id', nation.id)
        .eq('is_active', true)
        .order('elected_tick', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (!president) return;

    // Term hasn't expired yet
    if (president.term_ends_tick > currentTick) return;

    // Term has expired — check if a presidential election is already scheduled
    const { data: scheduledElection } = await supabase
        .from('elections')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('status', 'scheduled')
        .eq('election_type', 'presidential')
        .limit(1)
        .maybeSingle();

    if (!scheduledElection) {
        // No election scheduled — schedule one for next tick
        await supabase.from('elections').insert({
            nation_id: nation.id,
            election_tick: currentTick + 1,
            election_type: 'presidential',
            status: 'scheduled'
        });
        console.log(`Emergency presidential election scheduled for ${nation.name} at tick ${currentTick + 1} (term expired)`);
    }
}

/**
 * Auto-select presidential nominee if a party hasn't chosen within 3 ticks.
 * In the new pre-election flow, this just marks selected=true so the candidate
 * is ready for election day. Does NOT inaugurate — that happens when the
 * election resolves in processPresidentialElectionResult.
 */
async function processPresidentCandidateTimeout(supabase, nation, currentTick) {
    if (nation.government_type !== 'Presidential') return;

    // Find unselected presidential candidates older than 3 ticks
    const timeoutTicks = 3;
    const { data: staleCandidates } = await supabase
        .from('pm_candidates')
        .select('*')
        .eq('nation_id', nation.id)
        .eq('candidate_type', 'presidential')
        .eq('selected', false)
        .lte('created_at_tick', currentTick - timeoutTicks)
        .order('created_at_tick', { ascending: true });

    if (!staleCandidates || staleCandidates.length === 0) return;

    // Group by faction to auto-select one per party
    const factionGroups = {};
    for (const c of staleCandidates) {
        if (!factionGroups[c.faction_id]) factionGroups[c.faction_id] = [];
        factionGroups[c.faction_id].push(c);
    }

    for (const [factionId, candidates] of Object.entries(factionGroups)) {
        const pick = candidates[0]; // select first candidate
        console.log(`Auto-selecting presidential nominee for ${nation.name}: ${pick.first_name} ${pick.last_name} — selection timed out after ${timeoutTicks} ticks`);

        try {
            await selectPresidentCandidate(supabase, pick.id, nation.id, factionId, currentTick);
        } catch (e) {
            console.error(`Error auto-selecting presidential nominee for ${nation.name}:`, e);
        }
    }
}

// ==================== TICK HELPERS ====================

function advanceMonth(currentDate) {
    const parts = currentDate.split(',');
    const month = parts[0].trim();
    const year = parseInt(parts[1].trim());

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const idx = months.indexOf(month);
    if (idx === -1) { console.error('Invalid month:', month); return currentDate; }

    const nextIdx = (idx + 1) % 12;
    const nextYear = nextIdx === 0 ? year + 1 : year;
    return `${months[nextIdx]}, ${nextYear}`;
}

async function acquireTickLock(supabase) {
    const STALE_LOCK_MS = 5 * 60 * 1000; // 5 minutes
    const now = new Date().toISOString();

    // Attempt: acquire lock when tick_processing is false
    const { data: acquired, error: err1 } = await supabase
        .from('shard')
        .update({ tick_processing: true, tick_processing_started_at: now })
        .eq('name', 'Alpha Shard')
        .eq('tick_processing', false)
        .select('name');

    if (!err1 && acquired && acquired.length > 0) return true;

    // Check for stale lock (crashed tab)
    const { data: shard } = await supabase
        .from('shard')
        .select('tick_processing, tick_processing_started_at')
        .eq('name', 'Alpha Shard')
        .single();

    if (shard && shard.tick_processing && shard.tick_processing_started_at) {
        const lockAge = Date.now() - new Date(shard.tick_processing_started_at).getTime();
        if (lockAge > STALE_LOCK_MS) {
            console.warn('Stale tick lock detected (' + Math.round(lockAge / 1000) + 's old), forcing acquire');
            const { data: forced, error: err2 } = await supabase
                .from('shard')
                .update({ tick_processing: true, tick_processing_started_at: now })
                .eq('name', 'Alpha Shard')
                .eq('tick_processing', true)
                .select('name');
            return !err2 && forced && forced.length > 0;
        }
    }

    return false;
}

async function releaseTickLock(supabase) {
    await supabase
        .from('shard')
        .update({ tick_processing: false, tick_processing_started_at: null })
        .eq('name', 'Alpha Shard');
}

// ==================== ADVANCE TICK ====================

async function advanceTick(supabase) {
    // 1. Increment tick and advance game date
    const { data: shard } = await supabase
        .from('shard')
        .select('current_tick, tick_interval_hours, current_date')
        .eq('name', 'Alpha Shard')
        .single();
    if (!shard) throw new Error('Shard not found');

    const newTick = (shard.current_tick || 0) + 1;
    const nextTickAt = new Date();
    nextTickAt.setHours(nextTickAt.getHours() + (shard.tick_interval_hours || 12));
    const newDate = advanceMonth(shard.current_date || 'January, 2000');

    await supabase.from('shard').update({
        current_tick: newTick,
        next_tick_at: nextTickAt.toISOString(),
        current_date: newDate
    }).eq('name', 'Alpha Shard');

    // Clear expired coup cooldowns
    await supabase.from('factions')
        .update({ action_lockout_until_tick: null })
        .not('action_lockout_until_tick', 'is', null)
        .lte('action_lockout_until_tick', newTick);

    // Refill action points for all factions (loyalty-based AP reduction happens in processLoyaltyTick)
    await supabase.from('factions').update({ action_points: 10 }).lt('action_points', 10);

    // 2. Load all nations
    const { data: nations } = await supabase.from('nations').select('*');
    if (!nations || nations.length === 0) return { tick: newTick, nations: 0 };

    const summary = { tick: newTick, nations: nations.length, effects: [], costs: [], resolutions: [], events: [] };

    for (const nation of nations) {
        // 3. Process stat effects (from passed bills/active laws)
        const effectResults = await processStatEffects(supabase, nation, newTick);
        if (effectResults.length > 0) summary.effects.push({ nation: nation.name, effects: effectResults });

        // 3b. Process ministry action effects
        const ministryResults = await processMinistryActions(supabase, nation, newTick);
        if (ministryResults.length > 0) {
            summary.ministryActions = summary.ministryActions || [];
            summary.ministryActions.push({ nation: nation.name, effects: ministryResults });
        }

        // 4. Process ongoing costs
        const costResult = await processOngoingCosts(supabase, nation, newTick);
        if (costResult.totalCost !== 0) summary.costs.push({ nation: nation.name, ...costResult });

        // 4a. Process PM trait effects
        await processPMTraitEffects(supabase, nation, newTick);

        // 4b. Process elections (democracy only)
        const electionResults = await processElections(supabase, nation, newTick);
        if (electionResults.length > 0) {
            summary.elections = summary.elections || [];
            summary.elections.push({ nation: nation.name, elections: electionResults });
        }

        // 4c. Process government vacancy penalties (democracy only)
        const vacancyResult = await processGovernmentVacancy(supabase, nation, newTick);
        if (vacancyResult) {
            summary.vacancies = summary.vacancies || [];
            summary.vacancies.push(vacancyResult);
        }

        // 5. Resolve expired votes for this nation
        const resolutions = await resolveExpiredVotes(supabase, nation.id);
        if (resolutions.length > 0) summary.resolutions.push({ nation: nation.name, bills: resolutions });

        // 5b. Auto-sign expired president's desk bills (Presidential systems)
        const deskResults = await processPresidentDesk(supabase, nation, newTick);
        if (deskResults.length > 0) {
            summary.presidentDesk = summary.presidentDesk || [];
            summary.presidentDesk.push({ nation: nation.name, bills: deskResults });
        }

        // 5c. Presidential pre-election candidate generation, term end safety net, + selection timeout
        await triggerPresidentialCandidateSelection(supabase, nation, newTick);
        await processPresidentialTermEnd(supabase, nation, newTick);
        await processPresidentCandidateTimeout(supabase, nation, newTick);

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

        // 7b. Process ideology modifier decay (all government types)
        await processIdeologyModifierDecay(supabase, nation.id);

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

        // 11. Re-fetch nation with post-effect values, then snapshot to history
        const { data: freshNation } = await supabase.from('nations').select('*').eq('id', nation.id).single();
        await snapshotNationHistory(supabase, freshNation || nation, newTick);

        // 11b. Process crises (persistent negative events that apply effects every tick)
        const crisisResults = await processCrises(supabase, nation, newTick);
        if (crisisResults.length > 0) {
            summary.crises = summary.crises || [];
            summary.crises.push({ nation: nation.name, crises: crisisResults });
        }

        // 12. Process random events
        const eventResults = await processEvents(supabase, nation, newTick);
        if (eventResults.length > 0) summary.events.push({ nation: nation.name, events: eventResults });

        // 13. Process ministry inbox events (fire from templates + expire overdue)
        const ministryEventResults = await processMinistryInboxEvents(supabase, nation, newTick);
        if (ministryEventResults.length > 0) {
            summary.ministryEvents = summary.ministryEvents || [];
            summary.ministryEvents.push({ nation: nation.name, events: ministryEventResults });
        }
    }

    return summary;
}

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


// ==================== IDEOLOGY MODIFIER DECAY ====================

async function processIdeologyModifierDecay(supabase, nationId) {
    const { data: factions } = await supabase
        .from('factions')
        .select('id, ideology_modifiers')
        .eq('nation_id', nationId)
        .eq('faction_type', 'party');

    if (!factions || factions.length === 0) return;

    for (const faction of factions) {
        const mods = faction.ideology_modifiers;
        if (!mods || typeof mods !== 'object' || Object.keys(mods).length === 0) continue;

        const updated = {};
        let hasChanges = false;

        for (const [tag, value] of Object.entries(mods)) {
            if (typeof value !== 'number' || value === 0) continue;

            // Decay 1 point toward 0
            const newVal = value > 0 ? value - 1 : value + 1;
            hasChanges = true;

            if (newVal !== 0) {
                updated[tag] = newVal;
            }
        }

        if (hasChanges) {
            await supabase
                .from('factions')
                .update({ ideology_modifiers: updated })
                .eq('id', faction.id);
        }
    }
}


// ==================== LOYALTY TICK PROCESSING ====================

async function processLoyaltyTick(supabase, nation) {
    const rulingId = nation.ruling_faction_id;
    if (!rulingId) return;

    const isAutocracy = (nation.government_type === 'Autocracy');

    const { data: factions } = await supabase
        .from('factions')
        .select('id, loyalty, seats, action_points')
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
        let seats = faction.seats || 0;
        let ap = faction.action_points || 0;

        if (faction.id === rulingId) {
            if (isAutocracy) {
                // Autocracy ruling faction: dynamic loyalty drifting toward 80
                const ministryCount = ministryCounts[faction.id] || 0;
                if (loyalty > 80) loyalty -= 1;
                else if (loyalty < 80) loyalty += 1;
                loyalty += ministryCount * 0.5;
                loyalty = Math.max(0, Math.min(100, Math.round(loyalty * 10) / 10));
                await supabase.from('factions')
                    .update({ loyalty })
                    .eq('id', faction.id);
            } else {
                if (loyalty !== 100) {
                    await supabase.from('factions')
                        .update({ loyalty: 100 })
                        .eq('id', faction.id);
                }
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

        // Autocracy loyalty threshold consequences
        if (isAutocracy) {
            if (loyalty < 15) {
                // SUPPRESSED: -2 seats/tick, 0 AP
                seats = Math.max(0, seats - 2);
                ap = 0;
                // Auto-purge from all ministries
                await supabase.from('ministries')
                    .update({ party_id: null, minister_first_name: null, minister_last_name: null, minister_age: null })
                    .eq('nation_id', nation.id)
                    .eq('party_id', faction.id);
            } else if (loyalty < 30) {
                // DISLOYAL: -1 seat/tick, -1 AP/tick
                seats = Math.max(0, seats - 1);
                ap = Math.max(0, ap - 1);
                // Auto-purge from all ministries
                await supabase.from('ministries')
                    .update({ party_id: null, minister_first_name: null, minister_last_name: null, minister_age: null })
                    .eq('nation_id', nation.id)
                    .eq('party_id', faction.id);
            }
        }

        await supabase.from('factions')
            .update({ loyalty, seats, action_points: ap })
            .eq('id', faction.id);
    }
}


// ==================== SHAKEUP AUTO-RESOLVE ====================

async function autoResolveStaleShakeups(supabase, nationId, currentTick) {
    const { data: votingShakeups } = await supabase
        .from('shakeups')
        .select('id, created_at')
        .eq('nation_id', nationId)
        .eq('status', 'voting');

    if (!votingShakeups || votingShakeups.length === 0) return;

    const AUTO_RESOLVE_TICKS = 2;

    for (const shakeup of votingShakeups) {
        let tickAge = AUTO_RESOLVE_TICKS;

        if (shakeup.created_tick != null) {
            tickAge = currentTick - shakeup.created_tick;
        } else if (shakeup.created_at) {
            const ageMs = Date.now() - new Date(shakeup.created_at).getTime();
            const ageDays = ageMs / (1000 * 60 * 60 * 24);
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
            results.push({ action: 'deleted', party: party.faction_name, partyId: party.id, ticksInactive });
        } else if (ticksInactive >= INACTIVE_WARNING_TICKS) {
            if (party.approval_rating > 1) {
                await supabase.from('factions')
                    .update({ approval_rating: 1 })
                    .eq('id', party.id);
                results.push({ action: 'warned', party: party.faction_name, partyId: party.id, ticksInactive, oldApproval: party.approval_rating });
            }
        }
    }

    for (const party of partiesToDelete) {
        await deleteInactiveParty(supabase, nation, party, parties, currentTick);
    }

    return results;
}

async function deleteInactiveParty(supabase, nation, party, allParties, currentTick) {
    const partyId = party.id;
    const seatsToRedistribute = party.seats || 0;
    const isAutocracy = nation.government_type === 'Autocracy';

    const survivors = allParties.filter(p => p.id !== partyId && !p.is_npc);

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

    await supabase.from('ministries')
        .update({ minister_first_name: null, minister_last_name: null, minister_age: null, party_id: null })
        .eq('nation_id', nation.id)
        .eq('party_id', partyId);

    await supabase.from('bills')
        .update({ status: 'abandoned' })
        .eq('proposed_by', partyId)
        .in('status', ['draft', 'committee', 'floor']);

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

    await supabase.from('ministry_requests')
        .delete()
        .eq('faction_id', partyId);

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
                    .update({ party_ids: newPartyIds, ministry_assignments: newAssignments })
                    .eq('id', coal.id);
            }
        }
    }

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

    await supabase.from('campaign_actions')
        .delete()
        .eq('party_id', partyId);

    await supabase.from('faction_ideology')
        .delete()
        .eq('faction_id', partyId);
    await supabase.from('ideology_history')
        .delete()
        .eq('faction_id', partyId);

    await supabase.from('factions')
        .delete()
        .eq('id', partyId);

    console.log(`Deleted inactive party: ${party.faction_name} (${partyId}) from ${nation.name}`);
}


// ==================== STAT EFFECTS PROCESSING ====================

async function processStatEffects(supabase, nation, currentTick) {
    const { data: activeLaws } = await supabase
        .from('active_laws')
        .select('*, policies(*)')
        .eq('nation_id', nation.id);

    if (!activeLaws || activeLaws.length === 0) return [];

    const appliedEffects = [];
    const nationUpdates = {};
    const lawsToAdvance = [];
    const lawsToDelete = [];

    for (const law of activeLaws) {
        const policy = law.policies;
        const effectSource = `active_law=${law.id}, bill=${law.bill_id || 'unknown'}, policy=${policy?.id || 'unknown'} (${policy?.policy_name || 'Unknown'})`;
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
            lawsToAdvance.push(law.id);
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
                const dir = String(eff.direction || '').toLowerCase();
                const rawStatKey = eff.stat_key;
                const statKey = normalizeNationStatKey(rawStatKey);

                if (!statKey || !NATION_STAT_COLUMN_SET.has(statKey)) {
                    if (tick === lastApplied + 1) {
                        console.warn(
                            `[processStatEffects] Skipping invalid stat_key "${rawStatKey}" for ${effectSource}`
                        );
                    }
                    continue;
                }

                if (dir !== 'up' && dir !== 'down') {
                    if (tick === lastApplied + 1) {
                        console.warn(
                            `[processStatEffects] Skipping invalid direction "${eff.direction}" for stat_key="${rawStatKey}" from ${effectSource}`
                        );
                    }
                    continue;
                }

                if (ticksSincePassed <= delay + duration) {
                    allEffectsComplete = false;
                }

                if (ticksSincePassed > delay && ticksSincePassed <= delay + duration) {
                    const currentVal = nationUpdates[statKey] !== undefined
                        ? nationUpdates[statKey]
                        : (nation[statKey] !== undefined && nation[statKey] !== null ? Number(nation[statKey]) : 50);

                    let newVal;
                    if (dir === 'up') {
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
                        direction: dir,
                        rate: rate,
                        tick: tick,
                        newValue: newVal
                    });
                }
            }
        }

        lawsToAdvance.push(law.id);

        if (isReversal && allEffectsComplete) {
            lawsToDelete.push(law.id);
        }
    }

    let nationUpdateError = null;
    if (Object.keys(nationUpdates).length > 0) {
        const { error } = await supabase
            .from('nations')
            .update(nationUpdates)
            .eq('id', nation.id);
        nationUpdateError = error;
    }

    if (nationUpdateError) {
        console.error(
            '[processStatEffects] Failed to persist nation stat updates',
            {
                nationId: nation.id,
                payload: nationUpdates,
                error: nationUpdateError
            }
        );
        return [];
    }

    for (const id of lawsToAdvance) {
        await supabase
            .from('active_laws')
            .update({ effects_applied_through_tick: currentTick })
            .eq('id', id);
    }

    for (const id of lawsToDelete) {
        await supabase.from('active_laws').delete().eq('id', id);
    }

    return appliedEffects;
}

/**
 * Process ministry action stat effects during tick advancement.
 * Mirrors processStatEffects but reads from ministry_action_log.
 */
async function processMinistryActions(supabase, nation, currentTick) {
    const { data: actions } = await supabase
        .from('ministry_action_log')
        .select('*')
        .eq('nation_id', nation.id)
        .eq('processed', false);

    if (!actions || actions.length === 0) return [];

    const appliedEffects = [];
    const nationUpdates = {};
    // Track minister approval changes keyed by ministry_key + faction_id
    const ministerUpdates = {};
    // Track initial minister approval values for cascade delta calculation
    const ministerBaseline = {};
    // Track faction approval changes keyed by faction_id
    const factionUpdates = {};

    for (const action of actions) {
        const effects = action.stat_effects;
        if (!effects || !Array.isArray(effects) || effects.length === 0) {
            // No effects — mark as processed
            await supabase.from('ministry_action_log').update({ processed: true }).eq('id', action.id);
            continue;
        }

        const lastApplied = action.effects_applied_through_tick || 0;
        if (lastApplied >= currentTick) continue;

        const appliedTick = action.applied_at_tick || 0;

        let allEffectsComplete = true;

        for (let tick = lastApplied + 1; tick <= currentTick; tick++) {
            const ticksSinceAction = tick - appliedTick;

            for (const eff of effects) {
                const delay = eff.delay_ticks || 0;
                const duration = eff.duration_ticks || 4;
                const rate = eff.rate || 1;
                const statKey = eff.stat_key;
                const target = eff.target || 'nation';

                if (ticksSinceAction <= delay + duration) {
                    allEffectsComplete = false;
                }

                if (ticksSinceAction > delay && ticksSinceAction <= delay + duration) {
                    let currentVal, newVal;

                    if (target === 'minister') {
                        const mKey = action.ministry_key + ':' + action.faction_id;
                        if (ministerUpdates[mKey] === undefined) {
                            // Fetch current minister_approval from the ministries table
                            const { data: ministry } = await supabase
                                .from('ministries')
                                .select('minister_approval')
                                .eq('nation_id', nation.id)
                                .eq('ministry_key', action.ministry_key)
                                .eq('party_id', action.faction_id)
                                .single();
                            ministerUpdates[mKey] = (ministry?.minister_approval ?? 50);
                            ministerBaseline[mKey] = ministerUpdates[mKey];
                        }
                        currentVal = ministerUpdates[mKey];
                        newVal = eff.direction === 'up' ? currentVal + rate : currentVal - rate;
                        newVal = Math.max(0, Math.min(100, newVal));
                        ministerUpdates[mKey] = newVal;
                    } else if (target === 'faction') {
                        const fKey = action.faction_id;
                        if (factionUpdates[fKey] === undefined) {
                            const { data: faction } = await supabase
                                .from('factions')
                                .select('approval_rating')
                                .eq('id', action.faction_id)
                                .single();
                            factionUpdates[fKey] = (faction?.approval_rating ?? 50);
                        }
                        currentVal = factionUpdates[fKey];
                        newVal = eff.direction === 'up' ? currentVal + rate : currentVal - rate;
                        newVal = Math.max(0, Math.min(100, newVal));
                        factionUpdates[fKey] = newVal;
                    } else {
                        // Default: nation stat
                        currentVal = nationUpdates[statKey] !== undefined
                            ? nationUpdates[statKey]
                            : (nation[statKey] !== undefined && nation[statKey] !== null ? Number(nation[statKey]) : 50);
                        newVal = eff.direction === 'up' ? currentVal + rate : currentVal - rate;
                        newVal = Math.max(0, Math.min(100, newVal));
                        nationUpdates[statKey] = newVal;
                    }

                    appliedEffects.push({
                        action: action.action_key,
                        ministry: action.ministry_key,
                        stat: statKey,
                        target: target,
                        direction: eff.direction,
                        rate: rate,
                        tick: tick,
                        newValue: newVal
                    });
                }
            }
        }

        // Update tracking
        await supabase.from('ministry_action_log').update({
            effects_applied_through_tick: currentTick,
            processed: allEffectsComplete
        }).eq('id', action.id);
    }

    // Bulk update nation stats
    if (Object.keys(nationUpdates).length > 0) {
        await supabase.from('nations').update(nationUpdates).eq('id', nation.id);
    }

    // Bulk update minister approval
    for (const mKey of Object.keys(ministerUpdates)) {
        const [ministryKey, factionId] = mKey.split(':');
        await supabase.from('ministries')
            .update({ minister_approval: ministerUpdates[mKey] })
            .eq('nation_id', nation.id)
            .eq('ministry_key', ministryKey)
            .eq('party_id', factionId);
    }

    // Cascade minister approval LOSSES to party approval (PM losses at 2x)
    for (const mKey of Object.keys(ministerUpdates)) {
        const baseline = ministerBaseline[mKey];
        const current = ministerUpdates[mKey];
        if (baseline === undefined || current >= baseline) continue; // only losses cascade
        const [ministryKey, factionId] = mKey.split(':');
        const loss = baseline - current;
        const multiplier = ministryKey === 'prime_minister' ? 2 : 1;
        // Load faction approval into factionUpdates if not already tracked
        if (factionUpdates[factionId] === undefined) {
            const { data: faction } = await supabase
                .from('factions')
                .select('approval_rating')
                .eq('id', factionId)
                .single();
            factionUpdates[factionId] = (faction?.approval_rating ?? 50);
        }
        factionUpdates[factionId] = Math.max(0, factionUpdates[factionId] - (loss * multiplier));
    }

    // Bulk update faction approval
    for (const fKey of Object.keys(factionUpdates)) {
        await supabase.from('factions')
            .update({ approval_rating: factionUpdates[fKey] })
            .eq('id', fKey);
    }

    return appliedEffects;
}

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
        const lastFired = lastFiredMap[event.id];
        if (lastFired !== undefined) {
            const ticksSince = currentTick - lastFired;
            if (ticksSince < event.cooldown_ticks) continue;
        }

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

        const roll = Math.random() * 100;
        if (roll >= event.probability) continue;

        const descriptions = event.event_descriptions || [];
        const description = descriptions.length > 0
            ? descriptions[Math.floor(Math.random() * descriptions.length)].description_text
            : event.name;

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
                    stat: effect.stat_key, change: effect.change_value,
                    target: 'nation', old: currentVal, new: newVal
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
                        stat: effect.stat_key, change: effect.change_value,
                        target: 'ruling_party', faction_id: rulingId,
                        old: currentVal, new: newVal
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
                        stat: effect.stat_key, change: effect.change_value,
                        target: 'random_faction', faction_id: target.id,
                        old: currentVal, new: newVal
                    });
                }
            }
        }

        if (Object.keys(nationUpdates).length > 0) {
            await supabase.from('nations').update(nationUpdates).eq('id', nation.id);
        }

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


// ==================== CRISIS TICK PROCESSOR ====================

/**
 * Process persistent crises for a nation.
 * - Activates crises when ALL trigger conditions are met
 * - Applies effects every tick while active
 * - Deactivates crises when ALL recovery conditions are met
 * - Effects cascade: nation stats, government/coalition approval, minister approval
 */
async function processCrises(supabase, nation, currentTick) {
    // 1. Load all active crisis templates
    const { data: crisisTemplates } = await supabase
        .from('crisis_templates')
        .select('*, crisis_triggers(*), crisis_effects(*), crisis_end_triggers(*)')
        .eq('is_active', true);

    if (!crisisTemplates || crisisTemplates.length === 0) return [];

    // 2. Load currently active crises for this nation
    const { data: activeCrisisRecords } = await supabase
        .from('active_crises')
        .select('*')
        .eq('nation_id', nation.id);

    const activeMap = {};
    for (const ac of (activeCrisisRecords || [])) {
        activeMap[ac.crisis_id] = ac;
    }

    const crisisEvents = [];
    const nationUpdates = {};

    // 3. Check inactive crises for activation
    for (const template of crisisTemplates) {
        if (activeMap[template.id]) continue; // already active

        const triggers = template.crisis_triggers || [];
        if (triggers.length === 0) continue;

        let allTriggersMet = true;
        for (const trigger of triggers) {
            const statValue = nation[trigger.stat_key];
            if (statValue === null || statValue === undefined) {
                allTriggersMet = false;
                break;
            }
            const val = Number(statValue);
            if (trigger.operator === 'gte' && val < Number(trigger.threshold)) {
                allTriggersMet = false;
                break;
            }
            if (trigger.operator === 'lte' && val > Number(trigger.threshold)) {
                allTriggersMet = false;
                break;
            }
        }

        if (!allTriggersMet) continue;

        // Activate the crisis
        const { data: newActive, error: insertErr } = await supabase
            .from('active_crises')
            .insert({
                crisis_id: template.id,
                nation_id: nation.id,
                started_at_tick: currentTick,
                effects_applied_log: []
            })
            .select()
            .single();

        if (insertErr) {
            console.warn('Crisis activation insert failed:', insertErr.message);
            continue;
        }

        activeMap[template.id] = newActive;

        // Log to event_log
        await supabase.from('event_log').insert({
            nation_id: nation.id,
            event_name: 'CRISIS_STARTED: ' + template.name,
            description_used: template.description || template.name,
            category: 'crisis',
            effects_applied: [],
            fired_at_tick: currentTick
        });

        crisisEvents.push({
            type: 'crisis_started',
            crisisName: template.name,
            description: template.description,
            tick: currentTick
        });

        console.log(`Crisis activated: "${template.name}" in ${nation.name} (tick ${currentTick})`);
    }

    // 4. Process active crises: check end triggers, apply effects
    for (const template of crisisTemplates) {
        const activeRecord = activeMap[template.id];
        if (!activeRecord) continue;

        // 4a. Check end / recovery triggers
        const endTriggers = template.crisis_end_triggers || [];
        let allEndConditionsMet = endTriggers.length > 0;

        for (const endTrigger of endTriggers) {
            const statValue = nation[endTrigger.stat_key];
            if (statValue === null || statValue === undefined) {
                allEndConditionsMet = false;
                break;
            }
            const val = Number(statValue);
            if (endTrigger.operator === 'gte' && val < Number(endTrigger.threshold)) {
                allEndConditionsMet = false;
                break;
            }
            if (endTrigger.operator === 'lte' && val > Number(endTrigger.threshold)) {
                allEndConditionsMet = false;
                break;
            }
        }

        if (allEndConditionsMet) {
            // Deactivate the crisis
            await supabase.from('active_crises').delete().eq('id', activeRecord.id);
            delete activeMap[template.id];

            await supabase.from('event_log').insert({
                nation_id: nation.id,
                event_name: 'CRISIS_RESOLVED: ' + template.name,
                description_used: 'The crisis "' + template.name + '" has been resolved.',
                category: 'crisis',
                effects_applied: [],
                fired_at_tick: currentTick
            });

            crisisEvents.push({
                type: 'crisis_resolved',
                crisisName: template.name,
                duration: currentTick - activeRecord.started_at_tick,
                tick: currentTick
            });

            console.log(`Crisis resolved: "${template.name}" in ${nation.name} (tick ${currentTick}, duration: ${currentTick - activeRecord.started_at_tick} ticks)`);
            continue; // skip effects on the tick the crisis resolves
        }

        // 4b. Still active — apply effects every tick
        const effects = template.crisis_effects || [];
        const appliedEffects = [];

        for (const effect of effects) {
            const changePT = Number(effect.change_per_tick);
            const hasFloor = effect.stat_floor !== null && effect.stat_floor !== undefined;
            const floorVal = hasFloor ? Number(effect.stat_floor) : null;

            // Helper: clamp value respecting the per-effect floor/ceiling
            // If change is negative, stat_floor is a floor (can't go below).
            // If change is positive, stat_floor is a ceiling (can't go above).
            function clampWithFloor(current, raw) {
                let v = Math.max(0, Math.min(100, raw));
                if (hasFloor) {
                    if (changePT < 0) v = Math.max(floorVal, v);   // floor
                    else if (changePT > 0) v = Math.min(floorVal, v); // ceiling
                }
                return v;
            }

            if (effect.target === 'nation') {
                const currentVal = nationUpdates[effect.stat_key] !== undefined
                    ? nationUpdates[effect.stat_key]
                    : (nation[effect.stat_key] !== undefined && nation[effect.stat_key] !== null
                        ? Number(nation[effect.stat_key]) : 50);
                const newVal = clampWithFloor(currentVal, currentVal + changePT);
                nationUpdates[effect.stat_key] = newVal;
                nation[effect.stat_key] = newVal;

                appliedEffects.push({
                    stat: effect.stat_key, change: changePT,
                    target: 'nation', old: currentVal, new: newVal
                });

            } else if (effect.target === 'government_approval' || effect.target === 'coalition_approval') {
                const coalition = await fetchActiveCoalition(supabase, nation.id);
                const partyIds = coalition?.party_ids || [];
                for (const partyId of partyIds) {
                    const { data: faction } = await supabase
                        .from('factions')
                        .select('approval_rating')
                        .eq('id', partyId)
                        .single();
                    if (faction) {
                        const currentVal = faction.approval_rating ?? 50;
                        const newVal = clampWithFloor(currentVal, currentVal + changePT);
                        await supabase.from('factions')
                            .update({ approval_rating: newVal })
                            .eq('id', partyId);

                        appliedEffects.push({
                            stat: 'approval_rating', change: changePT,
                            target: effect.target, faction_id: partyId,
                            old: currentVal, new: newVal
                        });
                    }
                }

            } else if (effect.target === 'minister_approval') {
                const { data: ministry } = await supabase
                    .from('ministries')
                    .select('minister_approval, party_id')
                    .eq('nation_id', nation.id)
                    .eq('ministry_key', effect.minister_key)
                    .eq('is_active', true)
                    .maybeSingle();

                if (ministry) {
                    const currentVal = ministry.minister_approval ?? 50;
                    const newVal = clampWithFloor(currentVal, currentVal + changePT);
                    await supabase.from('ministries')
                        .update({ minister_approval: newVal })
                        .eq('nation_id', nation.id)
                        .eq('ministry_key', effect.minister_key)
                        .eq('is_active', true);

                    appliedEffects.push({
                        stat: 'minister_approval', change: changePT,
                        target: 'minister_approval', minister_key: effect.minister_key,
                        old: currentVal, new: newVal
                    });

                    // Cascade minister approval loss to party approval (2x for PM, 1x for others)
                    if (changePT < 0 && ministry.party_id) {
                        const loss = Math.abs(changePT);
                        const multiplier = effect.minister_key === 'prime_minister' ? 2 : 1;
                        const { data: faction } = await supabase
                            .from('factions')
                            .select('approval_rating')
                            .eq('id', ministry.party_id)
                            .single();
                        if (faction) {
                            const factionVal = faction.approval_rating ?? 50;
                            const cascadeRaw = factionVal - (loss * multiplier);
                            const newFactionVal = clampWithFloor(factionVal, cascadeRaw);
                            await supabase.from('factions')
                                .update({ approval_rating: newFactionVal })
                                .eq('id', ministry.party_id);

                            appliedEffects.push({
                                stat: 'approval_rating', change: -(loss * multiplier),
                                target: 'minister_cascade', faction_id: ministry.party_id,
                                minister_key: effect.minister_key,
                                old: factionVal, new: newFactionVal
                            });
                        }
                    }
                }
            }
        }

        // Update effects log on the active crisis record
        const logEntry = { tick: currentTick, effects: appliedEffects };
        const existingLog = activeRecord.effects_applied_log || [];
        // Keep last 50 entries to prevent unbounded growth
        if (existingLog.length >= 50) existingLog.shift();
        existingLog.push(logEntry);
        await supabase.from('active_crises')
            .update({ effects_applied_log: existingLog })
            .eq('id', activeRecord.id);

        if (appliedEffects.length > 0) {
            crisisEvents.push({
                type: 'crisis_effects',
                crisisName: template.name,
                effects: appliedEffects,
                tick: currentTick
            });
        }
    }

    // 5. Bulk update nation stats
    if (Object.keys(nationUpdates).length > 0) {
        await supabase.from('nations').update(nationUpdates).eq('id', nation.id);
    }

    return crisisEvents;
}


// ==================== MINISTRY INBOX EVENTS ====================

/**
 * Process ministry inbox events from templates.
 * For each nation:
 *  - Loads active ministry_event_templates
 *  - Filters by government type and active ministries
 *  - Checks cooldowns against previously fired inbox events
 *  - Evaluates weight conditions against nation stats
 *  - Rolls probability (boosted when weight conditions are met)
 *  - Creates ministry_events rows with randomly selected variants
 *  - Also expires overdue active ministry events
 */
async function processMinistryInboxEvents(supabase, nation, currentTick) {
    const firedEvents = [];

    // --- 1. Expire overdue active ministry events ---
    const { data: overdueEvents } = await supabase
        .from('ministry_events')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('status', 'active')
        .lt('expires_at_tick', currentTick);

    if (overdueEvents && overdueEvents.length > 0) {
        const overdueIds = overdueEvents.map(e => e.id);
        await supabase.from('ministry_events')
            .update({ status: 'expired' })
            .in('id', overdueIds);
    }

    // --- 2. Load all active templates ---
    const { data: templates } = await supabase
        .from('ministry_event_templates')
        .select('*')
        .eq('is_active', true);

    if (!templates || templates.length === 0) return firedEvents;

    // --- 3. Filter by government type ---
    const govType = nation.government_type || 'Democracy';
    const eligible = templates.filter(t => (t.gov_types || []).includes(govType));
    if (eligible.length === 0) return firedEvents;

    // --- 4. Load active ministries for this nation ---
    const { data: ministries } = await supabase
        .from('ministries')
        .select('ministry_key, party_id')
        .eq('nation_id', nation.id)
        .eq('is_active', true);

    if (!ministries || ministries.length === 0) return firedEvents;

    const ministryMap = {};
    for (const m of ministries) {
        ministryMap[m.ministry_key] = m.party_id;
    }

    // --- 5. Check cooldowns: find last fired tick for each template ---
    const templateIds = eligible.map(t => t.id);
    const { data: recentEvents } = await supabase
        .from('ministry_events')
        .select('template_id, created_at_tick')
        .eq('nation_id', nation.id)
        .in('template_id', templateIds)
        .order('created_at_tick', { ascending: false });

    const lastFiredMap = {};
    for (const entry of (recentEvents || [])) {
        if (entry.template_id && !lastFiredMap[entry.template_id]) {
            lastFiredMap[entry.template_id] = entry.created_at_tick;
        }
    }

    // --- 6. Also check how many active (unresolved) events already exist per ministry ---
    const { data: activeEvents } = await supabase
        .from('ministry_events')
        .select('ministry_key')
        .eq('nation_id', nation.id)
        .eq('status', 'active');

    const activeCountByMinistry = {};
    for (const ae of (activeEvents || [])) {
        activeCountByMinistry[ae.ministry_key] = (activeCountByMinistry[ae.ministry_key] || 0) + 1;
    }

    // --- 7. Process each eligible template ---
    for (const tmpl of eligible) {
        // Skip if this ministry doesn't exist or isn't staffed
        const controllingFactionId = ministryMap[tmpl.ministry_key];
        if (!controllingFactionId) continue;

        // Skip if ministry already has 3+ active events (prevent inbox flood)
        if ((activeCountByMinistry[tmpl.ministry_key] || 0) >= 3) continue;

        // Check cooldown
        const lastFired = lastFiredMap[tmpl.id];
        if (lastFired !== undefined) {
            const ticksSince = currentTick - lastFired;
            if (ticksSince < (tmpl.cooldown_ticks || 6)) continue;
        }

        // --- 8. Evaluate weight conditions ---
        const variants = tmpl.variants || {};
        const weightConditions = variants.weight_conditions || [];

        // Fall back to old flat columns if no array conditions
        if (weightConditions.length === 0 && tmpl.weight_stat) {
            weightConditions.push({
                stat: tmpl.weight_stat,
                op: tmpl.weight_operator || '>',
                value: tmpl.weight_value
            });
        }

        let allConditionsMet = true;
        if (weightConditions.length > 0) {
            for (const cond of weightConditions) {
                const statVal = nation[cond.stat];
                if (statVal === null || statVal === undefined) {
                    allConditionsMet = false;
                    break;
                }
                const val = Number(statVal);
                const threshold = Number(cond.value);
                if (cond.op === '>' && !(val > threshold)) { allConditionsMet = false; break; }
                if (cond.op === '<' && !(val < threshold)) { allConditionsMet = false; break; }
                if (cond.op === '>=' && !(val >= threshold)) { allConditionsMet = false; break; }
                if (cond.op === '<=' && !(val <= threshold)) { allConditionsMet = false; break; }
            }
        }

        // --- 9. Probability roll ---
        // Base chance: 25% per tick if conditions met, 5% if not
        // (Events with no conditions always use base 25%)
        let fireProbability;
        if (weightConditions.length === 0) {
            fireProbability = 25;
        } else if (allConditionsMet) {
            fireProbability = 40;
        } else {
            fireProbability = 5;
        }

        const roll = Math.random() * 100;
        if (roll >= fireProbability) continue;

        // --- 10. Pick random variants ---
        const titles = variants.titles || [tmpl.title];
        const chosenTitle = titles[Math.floor(Math.random() * titles.length)] || tmpl.title;

        const govVariant = variants[govType] || {};
        const bodies = govVariant.bodies || [];
        const chosenBody = bodies.length > 0
            ? bodies[Math.floor(Math.random() * bodies.length)]
            : '';

        const options = govVariant.options || [];

        // --- 11. Insert into ministry_events ---
        const expiresAtTick = currentTick + (tmpl.deadline_ticks || 3);

        const { error } = await supabase.from('ministry_events').insert({
            nation_id: nation.id,
            ministry_key: tmpl.ministry_key,
            controlling_faction_id: controllingFactionId,
            template_id: tmpl.id,
            title: chosenTitle,
            sender: tmpl.sender || 'Ministry Office',
            body: chosenBody,
            priority: tmpl.priority || 'routine',
            status: 'active',
            created_at_tick: currentTick,
            expires_at_tick: expiresAtTick,
            options: options,
            chosen_option: null,
            resolved_effects: null,
            resolved_at_tick: null
        });

        if (!error) {
            // Update active count to prevent flooding within same tick
            activeCountByMinistry[tmpl.ministry_key] = (activeCountByMinistry[tmpl.ministry_key] || 0) + 1;

            firedEvents.push({
                templateKey: tmpl.event_key,
                title: chosenTitle,
                ministry: tmpl.ministry_key,
                conditionsMet: allConditionsMet
            });

            console.log(`Ministry event fired: "${chosenTitle}" → ${tmpl.ministry_key} in ${nation.name} (tick ${currentTick})`);
        }
    }

    return firedEvents;
}


// ==================== INACTIVITY CLOCK ====================

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


// ==================== PM CANDIDATE SYSTEM ====================

const PM_FIRST_NAMES = [
    'Alejandro', 'Camila', 'Diego', 'Valentina', 'Mateo', 'Isabela', 'Sebastián', 'Luca',
    'Andrés', 'Gabriel', 'Joaquín', 'Mariana', 'Carlos', 'Tomas', 'Rafael', 'Edwin',
    'Emilio', 'Catalina', 'Fernando', 'Renata'
];

const PM_LAST_NAMES = [
    'Velasco', 'Mendoza', 'Guerrero', 'Salazar', 'Castillo', 'Herrera', 'Morales', 'Ríos',
    'Delgado', 'Espinoza', 'Guzmán', 'Navarro', 'Córdoba', 'Echeverría', 'Pacheco', 'Montero',
    'Aguilar', 'Valenzuela', 'Carrasco', 'Ibarra'
];

const IDEOLOGY_OPTIONS = [
    { tag: 'LIBERTY',         axisKey: 'liberty_equality',             direction: -1 },
    { tag: 'EQUALITY',        axisKey: 'liberty_equality',             direction: 1 },
    { tag: 'TRADITION',       axisKey: 'tradition_progress',           direction: -1 },
    { tag: 'PROGRESS',        axisKey: 'tradition_progress',           direction: 1 },
    { tag: 'SECURITY',        axisKey: 'security_freedom',             direction: -1 },
    { tag: 'FREEDOM',         axisKey: 'security_freedom',             direction: 1 },
    { tag: 'NATIONALISM',     axisKey: 'globalism_nationalism',        direction: -1 },
    { tag: 'GLOBALISM',       axisKey: 'globalism_nationalism',        direction: 1 },
    { tag: 'INDIVIDUALISM',   axisKey: 'individualism_collectivism',   direction: -1 },
    { tag: 'COLLECTIVISM',    axisKey: 'individualism_collectivism',   direction: 1 }
];

const PM_TRAIT_KEYS = [
    'dealmaker', 'showman', 'ideologue', 'economist', 'reformer',
    'iron_will', 'popular_champion', 'militarist', 'diplomat',
    'media_darling', 'hardliner', 'technocrat', 'survivor', 'firebrand'
];

async function generatePMCandidates(supabase, nationId, factionId, currentTick) {
    const factionIdeology = await loadFactionIdeology(supabase, factionId);

    await supabase
        .from('pm_candidates')
        .delete()
        .eq('nation_id', nationId)
        .eq('faction_id', factionId)
        .eq('selected', false);

    const weightedIdeologies = getWeightedIdeologies(factionIdeology);

    const chosenIdeologies = [];
    const availableIdeologies = [...weightedIdeologies];
    for (let i = 0; i < 3; i++) {
        const pick = weightedRandomPick(availableIdeologies);
        chosenIdeologies.push(pick.item);
        const sameAxis = availableIdeologies.filter(
            wi => wi.item.axisKey === pick.item.axisKey
        );
        sameAxis.forEach(sa => {
            const idx = availableIdeologies.indexOf(sa);
            if (idx >= 0) availableIdeologies.splice(idx, 1);
        });
    }

    const shuffledTraits = [...PM_TRAIT_KEYS].sort(() => Math.random() - 0.5);
    const chosenTraits = shuffledTraits.slice(0, 3);

    const usedFirstNames = new Set();
    const usedLastNames = new Set();
    const candidates = [];

    for (let i = 0; i < 3; i++) {
        let firstName, lastName;

        do { firstName = PM_FIRST_NAMES[Math.floor(Math.random() * PM_FIRST_NAMES.length)]; }
        while (usedFirstNames.has(firstName));
        usedFirstNames.add(firstName);

        do { lastName = PM_LAST_NAMES[Math.floor(Math.random() * PM_LAST_NAMES.length)]; }
        while (usedLastNames.has(lastName));
        usedLastNames.add(lastName);

        const age = 35 + Math.floor(Math.random() * 16);
        const ideology = chosenIdeologies[i];

        candidates.push({
            nation_id: nationId,
            faction_id: factionId,
            first_name: firstName,
            last_name: lastName,
            age: age,
            ideology: ideology.tag,
            ideology_axis: ideology.axisKey,
            ideology_direction: ideology.direction,
            trait_key: chosenTraits[i],
            created_at_tick: currentTick,
            selected: false
        });
    }

    const { data, error } = await supabase
        .from('pm_candidates')
        .insert(candidates)
        .select();

    if (error) {
        console.error('Error generating PM candidates:', error);
        throw error;
    }

    console.log(`Generated 3 PM candidates for faction ${factionId}`);
    return data;
}

function getWeightedIdeologies(factionIdeology) {
    if (!factionIdeology) {
        return IDEOLOGY_OPTIONS.map(opt => ({ item: opt, weight: 10 }));
    }

    return IDEOLOGY_OPTIONS.map(opt => {
        const score = factionIdeology[opt.axisKey] || 0;
        const alignment = score * opt.direction;

        let weight;
        if (alignment > 40) {
            weight = 2;
        } else if (alignment > 15) {
            weight = 5;
        } else if (alignment > -15) {
            weight = 12;
        } else if (alignment > -40) {
            weight = 10;
        } else {
            weight = 8;
        }

        return { item: opt, weight };
    });
}

function weightedRandomPick(weightedItems) {
    const totalWeight = weightedItems.reduce((sum, wi) => sum + wi.weight, 0);
    let random = Math.random() * totalWeight;

    for (const wi of weightedItems) {
        random -= wi.weight;
        if (random <= 0) return wi;
    }
    return weightedItems[weightedItems.length - 1];
}

async function selectPMCandidate(supabase, candidateId, nationId, factionId, currentTick) {
    const { data: candidate, error: fetchErr } = await supabase
        .from('pm_candidates')
        .select('*')
        .eq('id', candidateId)
        .single();

    if (fetchErr || !candidate) throw new Error('Candidate not found');
    if (candidate.faction_id !== factionId) throw new Error('Not your candidate');

    await supabase
        .from('pm_candidates')
        .update({ selected: true })
        .eq('id', candidateId);

    await supabase
        .from('pm_candidates')
        .delete()
        .eq('nation_id', nationId)
        .eq('faction_id', factionId)
        .eq('selected', false);

    await supabase
        .from('head_of_government')
        .update({ active: false })
        .eq('nation_id', nationId)
        .eq('active', true);

    const { error: hogErr } = await supabase
        .from('head_of_government')
        .upsert({
            nation_id: nationId,
            faction_id: factionId,
            candidate_id: candidateId,
            first_name: candidate.first_name,
            last_name: candidate.last_name,
            age: candidate.age,
            ideology: candidate.ideology,
            trait_key: candidate.trait_key,
            appointed_tick: currentTick,
            active: true
        }, { onConflict: 'nation_id' });

    if (hogErr) throw hogErr;

    const axisKey = candidate.ideology_axis;
    const shift = 5 * candidate.ideology_direction;

    const factionIdeology = await loadFactionIdeology(supabase, factionId);
    if (factionIdeology) {
        const currentVal = factionIdeology[axisKey] || 0;
        const newVal = Math.max(-100, Math.min(100, currentVal + shift));

        await supabase
            .from('faction_ideology')
            .update({ [axisKey]: newVal })
            .eq('faction_id', factionId);

        console.log(`Ideology shift: ${axisKey} ${currentVal} → ${newVal} (${shift > 0 ? '+' : ''}${shift})`);
    }

    const { data: trait } = await supabase
        .from('leader_traits')
        .select('*')
        .eq('trait_key', candidate.trait_key)
        .single();

    if (trait?.effects) {
        const effects = trait.effects;

        if (effects.on_appoint_stability) {
            const { data: nation } = await supabase
                .from('nations')
                .select('stability')
                .eq('id', nationId)
                .single();

            if (nation) {
                const newStability = Math.min(100, (nation.stability || 50) + effects.on_appoint_stability);
                await supabase
                    .from('nations')
                    .update({ stability: newStability })
                    .eq('id', nationId);

                console.log(`On-appoint stability: +${effects.on_appoint_stability} → ${newStability}`);
            }
        }

        if (effects.npc_approval_shift) {
            const { data: npcParties } = await supabase
                .from('factions')
                .select('id, approval_rating')
                .eq('nation_id', nationId)
                .eq('is_npc', true)
                .eq('faction_type', 'party');

            for (const npc of (npcParties || [])) {
                const newApproval = Math.max(0, Math.min(100,
                    (npc.approval_rating ?? 50) + effects.npc_approval_shift
                ));
                await supabase
                    .from('factions')
                    .update({ approval_rating: newApproval })
                    .eq('id', npc.id);
            }
            console.log(`Firebrand: NPC parties shifted by ${effects.npc_approval_shift}`);
        }
    }

    console.log(`PM selected: ${candidate.first_name} ${candidate.last_name} (${candidate.trait_key})`);
    return candidate;
}

async function processPMTraitEffects(supabase, nation, currentTick) {
    let effects, factionId;

    if (nation.government_type === 'Presidential') {
        // For presidential systems, use the active president's trait
        const { data: president } = await supabase
            .from('presidents')
            .select('faction_id, trait')
            .eq('nation_id', nation.id)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();

        if (!president?.trait) return;

        const { data: traitData } = await supabase
            .from('leader_traits')
            .select('effects')
            .eq('trait_key', president.trait)
            .single();

        if (!traitData?.effects) return;
        effects = traitData.effects;
        factionId = president.faction_id;
    } else {
        const { data: hog } = await supabase
            .from('head_of_government')
            .select('*, leader_traits(*)')
            .eq('nation_id', nation.id)
            .eq('active', true)
            .single();

        if (!hog || !hog.leader_traits?.effects) return;
        effects = hog.leader_traits.effects;
        factionId = hog.faction_id;
    }

    if (effects.party_approval_per_tick) {
        const { data: faction } = await supabase
            .from('factions')
            .select('approval_rating')
            .eq('id', factionId)
            .single();

        if (faction) {
            const newApproval = Math.max(0, Math.min(100,
                (faction.approval_rating ?? 50) + effects.party_approval_per_tick
            ));
            await supabase
                .from('factions')
                .update({ approval_rating: newApproval })
                .eq('id', factionId);
        }
    }

    if (effects.nation_stat_per_tick) {
        const updates = {};
        for (const [stat, delta] of Object.entries(effects.nation_stat_per_tick)) {
            const currentVal = nation[stat];
            if (currentVal !== undefined && currentVal !== null) {
                updates[stat] = Math.max(0, Math.min(100, currentVal + delta));
            }
        }
        if (Object.keys(updates).length > 0) {
            await supabase.from('nations').update(updates).eq('id', nation.id);
        }
    }

    if (effects.approval_below_50_bonus || effects.approval_above_60_penalty) {
        const { data: faction } = await supabase
            .from('factions')
            .select('approval_rating')
            .eq('id', factionId)
            .single();

        if (faction) {
            let delta = 0;
            if (faction.approval_rating < 50 && effects.approval_below_50_bonus) {
                delta = effects.approval_below_50_bonus;
            } else if (faction.approval_rating > 60 && effects.approval_above_60_penalty) {
                delta = effects.approval_above_60_penalty;
            }
            if (delta !== 0) {
                const newApproval = Math.max(0, Math.min(100, faction.approval_rating + delta));
                await supabase
                    .from('factions')
                    .update({ approval_rating: newApproval })
                    .eq('id', factionId);
            }
        }
    }

    if (effects.opposition_approval_per_tick) {
        const { data: oppParties } = await supabase
            .from('factions')
            .select('id, approval_rating')
            .eq('nation_id', nation.id)
            .eq('faction_type', 'party')
            .neq('id', factionId);

        for (const opp of (oppParties || [])) {
            const newApproval = Math.max(0, Math.min(100,
                (opp.approval_rating ?? 50) + effects.opposition_approval_per_tick
            ));
            await supabase
                .from('factions')
                .update({ approval_rating: newApproval })
                .eq('id', opp.id);
        }
    }

    if (effects.no_bill_penalty_per_tick) {
        const { count } = await supabase
            .from('bills')
            .select('*', { count: 'exact', head: true })
            .eq('nation_id', nation.id)
            .eq('proposed_by', factionId)
            .eq('status', 'passed')
            .eq('passed_tick', currentTick - 1);

        if (!count || count === 0) {
            const { data: faction } = await supabase
                .from('factions')
                .select('approval_rating')
                .eq('id', factionId)
                .single();

            if (faction) {
                const newApproval = Math.max(0, Math.min(100,
                    (faction.approval_rating ?? 50) + effects.no_bill_penalty_per_tick
                ));
                await supabase
                    .from('factions')
                    .update({ approval_rating: newApproval })
                    .eq('id', factionId);
            }
        }
    }
}


// ==================== RESIGN PM ====================

async function resignPM(supabase, nationId, factionId, currentTick) {
    const { data: hog } = await supabase
        .from('head_of_government')
        .select('*')
        .eq('nation_id', nationId)
        .eq('faction_id', factionId)
        .eq('active', true)
        .single();

    if (!hog) throw new Error('No active PM to resign');

    if (hog.trait_key === 'survivor') {
        throw new Error('A Survivor cannot resign. They cling to power.');
    }

    await supabase
        .from('head_of_government')
        .update({ active: false })
        .eq('id', hog.id);

    const { data: faction } = await supabase
        .from('factions')
        .select('approval_rating')
        .eq('id', factionId)
        .single();

    if (faction) {
        const newApproval = Math.max(0, (faction.approval_rating ?? 50) - 5);
        await supabase
            .from('factions')
            .update({ approval_rating: newApproval })
            .eq('id', factionId);
    }

    const { data: nation } = await supabase
        .from('nations')
        .select('stability')
        .eq('id', nationId)
        .single();

    if (nation) {
        const newStability = Math.max(0, (nation.stability ?? 50) - 3);
        await supabase
            .from('nations')
            .update({ stability: newStability })
            .eq('id', nationId);
    }

    await supabase
        .from('factions')
        .update({ pm_cooldown_until: currentTick + 12 })
        .eq('id', factionId);

    if (hog.trait_key === 'iron_will') {
        console.log('Iron Will resignation — coalition collapses');
        return { result: 'coalition_collapsed', reason: 'iron_will' };
    }

    const { data: govFormation } = await supabase
        .from('government_formations')
        .select('party_ids')
        .eq('nation_id', nationId)
        .eq('status', 'formed')
        .single();

    if (govFormation) {
        const partnerIds = (govFormation.party_ids || [])
            .filter(pid => pid !== factionId);

        const { data: partners } = await supabase
            .from('factions')
            .select('id, faction_name, seats, pm_cooldown_until')
            .in('id', partnerIds)
            .order('seats', { ascending: false });

        const eligible = (partners || []).find(p =>
            !p.pm_cooldown_until || p.pm_cooldown_until <= currentTick
        );

        if (eligible) {
            await generatePMCandidates(supabase, nationId, eligible.id, currentTick);
            console.log(`PM offered to ${eligible.faction_name}`);
            return {
                result: 'pm_offered',
                newPmPartyId: eligible.id,
                newPmPartyName: eligible.faction_name
            };
        }
    }

    console.log('No eligible partner — coalition collapsed');
    return { result: 'coalition_collapsed', reason: 'no_eligible_partner' };
}


// ==================== ELECTION SIMULATION ====================

/**
 * Get a party's alignment score toward a specific ideology tag.
 *
 * @param {object} partyAxes  - Row from faction_ideology (keys: liberty_equality, tradition_progress, etc.)
 * @param {string} tag        - Ideology tag (e.g. "PROGRESS", "Liberty") — case-insensitive
 * @returns {number} Alignment value: positive = supports, negative = opposes
 */
function getPartyAlignment(partyAxes, tag) {
    const info = IDEOLOGY_TO_AXIS[tag.toUpperCase()];
    if (!info) return 0;
    const axisValue = partyAxes[info.axisKey] ?? 0;
    return axisValue * info.direction;
}

/**
 * Run the 4-step voting cascade for a single voter bloc.
 * Returns { eligible: [...partyObjects], step: 1|2|3|4 }.
 *
 * @param {string[]} tags              - Bloc ideology tags (e.g. ["Progress","Freedom"]), upper or mixed case
 * @param {object[]} parties           - Array of { id, approval_rating, axes: { liberty_equality, ... } }
 * @returns {{ eligible: object[], step: number }}
 */
function findEligibleParties(tags, parties) {
    const upperTags = tags.map(t => t.toUpperCase());

    // Pre-compute alignments for each party toward each tag
    const partyAlignments = new Map();
    for (const party of parties) {
        partyAlignments.set(party.id, upperTags.map(t => getPartyAlignment(party.axes, t)));
    }

    // ---- Step 1: Full Ideology Match ----
    const step1 = parties.filter(p => {
        const aligns = partyAlignments.get(p.id);
        const positiveCount = aligns.filter(a => a > 0).length;
        if (upperTags.length <= 2) return positiveCount >= upperTags.length; // all must match
        return positiveCount >= 2; // 3-tag blocs: 2-of-3
    });
    if (step1.length > 0) return { eligible: step1, step: 1 };

    // ---- Step 2: Partial Ideology Match ----
    const step2 = parties.filter(p => {
        const aligns = partyAlignments.get(p.id);
        return aligns.some(a => a > 0);
    });
    if (step2.length > 0) return { eligible: step2, step: 2 };

    // ---- Step 3: No Active Opposition (no alignment ≤ -20) ----
    const step3 = parties.filter(p => {
        const aligns = partyAlignments.get(p.id);
        return aligns.every(a => a > -20);
    });
    if (step3.length > 0) return { eligible: step3, step: 3 };

    // ---- Step 4: All Oppose — forced choice / abstention ----
    return { eligible: parties, step: 4 };
}

/**
 * Calculate effective approval for a party given a voter bloc's ideology tags.
 * effective_approval = base_approval + avg(modifier for each matching tag)
 */
function getEffectiveApproval(party, tags) {
    const base = party.approval_rating ?? 0;
    const mods = party.ideology_modifiers || {};
    if (!tags || tags.length === 0) return base;
    let sum = 0;
    for (const tag of tags) sum += (mods[tag.toUpperCase()] || 0);
    return Math.max(0, Math.min(100, base + sum / tags.length));
}

/**
 * Distribute a voter bloc's votes among eligible parties using
 * approval × alignment weighting with largest-remainder rounding.
 *
 * @param {object[]} eligible          - Parties that passed the cascade
 * @param {string[]} tags              - Bloc ideology tags (upper-case)
 * @param {number}   blocCount         - Voters in this bloc to distribute
 * @param {object[]} allParties        - All parties (needed for step-4 highest approval)
 * @param {number}   step              - Which cascade step produced these eligible parties
 * @param {object}   tally             - Mutable { [partyId]: voteCount } accumulator
 * @returns {number} Number of abstentions produced (only >0 for step 4)
 */
function distributeVotes(eligible, tags, blocCount, allParties, step, tally) {
    if (blocCount <= 0) return 0;

    // ---- Base abstention: realistic turnout varies by cascade step ----
    // Step 0 (Unaligned): ~35% abstain — least motivated voters
    // Step 1 (Full Match): ~20% abstain — most motivated, strong alignment
    // Step 2 (Partial Match): ~28% abstain — moderate motivation
    // Step 3 (No Opposition): ~33% abstain — lukewarm support
    // Step 4 (Forced/Abstain): ~75% abstain — deeply disaffected
    const abstainRates = { 0: 0.35, 1: 0.20, 2: 0.28, 3: 0.33, 4: 0.75 };
    const abstainRate = abstainRates[step] ?? 0.30;
    const abstentions = Math.floor(blocCount * abstainRate);
    const voters = blocCount - abstentions;

    if (voters <= 0) return blocCount;

    // ---- Step 4: remainder goes to highest-approval party ----
    if (step === 4) {
        const best = allParties.reduce((a, b) =>
            getEffectiveApproval(b, tags) > getEffectiveApproval(a, tags) ? b : a, allParties[0]);
        tally[best.id] = (tally[best.id] || 0) + voters;
        return abstentions;
    }

    const upperTags = tags.map(t => t.toUpperCase());

    // ---- Calculate weights ----
    const weights = [];
    let totalWeight = 0;
    for (const party of eligible) {
        let alignmentScore;
        if (upperTags.length === 0) {
            // Unaligned bloc — pure approval
            alignmentScore = 1;
        } else {
            const aligns = upperTags.map(t => Math.max(getPartyAlignment(party.axes, t), 1));
            alignmentScore = aligns.reduce((s, v) => s + v, 0) / aligns.length;
        }
        const w = getEffectiveApproval(party, upperTags) * alignmentScore;
        weights.push({ id: party.id, weight: w });
        totalWeight += w;
    }

    // ---- Edge case: all weights are 0 (everyone has 0% approval) ----
    if (totalWeight === 0) {
        const evenShare = Math.floor(voters / eligible.length);
        for (const party of eligible) {
            tally[party.id] = (tally[party.id] || 0) + evenShare;
        }
        // Give remainder to first party by id (deterministic)
        const remainder = voters - evenShare * eligible.length;
        if (remainder > 0) {
            tally[eligible[0].id] = (tally[eligible[0].id] || 0) + remainder;
        }
        return abstentions;
    }

    // ---- Distribute proportionally with largest-remainder rounding ----
    let allocated = 0;
    const partyVotes = [];
    for (const { id, weight } of weights) {
        const exact = (voters * weight) / totalWeight;
        const floored = Math.floor(exact);
        tally[id] = (tally[id] || 0) + floored;
        allocated += floored;
        partyVotes.push({ id, fractional: exact - floored });
    }

    const remainder = voters - allocated;
    partyVotes.sort((a, b) => b.fractional - a.fractional);
    for (let i = 0; i < remainder; i++) {
        tally[partyVotes[i].id] = (tally[partyVotes[i].id] || 0) + 1;
    }

    return abstentions;
}

/**
 * Allocate parliamentary seats from vote totals using
 * Largest Remainder / Hare Quota method.
 *
 * @param {object} voteTotals  - { partyId: totalVotes, ... }
 * @param {number} totalSeats  - Seats to allocate (default 120)
 * @returns {object} { partyId: seats, ... }
 */
function allocateSeatsByVotes(voteTotals, totalSeats = GAME_CONFIG.TOTAL_SEATS) {
    const totalVotes = Object.values(voteTotals).reduce((s, v) => s + v, 0);
    if (totalVotes === 0) {
        const seats = {};
        for (const id of Object.keys(voteTotals)) seats[id] = 0;
        return seats;
    }

    const quota = totalVotes / totalSeats;
    const seats = {};
    const fractionals = [];
    let allocatedSeats = 0;

    for (const [id, votes] of Object.entries(voteTotals)) {
        if (votes === 0) { seats[id] = 0; continue; }
        const raw = votes / quota;
        const guaranteed = Math.floor(raw);
        seats[id] = guaranteed;
        allocatedSeats += guaranteed;
        fractionals.push({ id, fractional: raw - guaranteed });
    }

    const remaining = totalSeats - allocatedSeats;
    fractionals.sort((a, b) => b.fractional - a.fractional);
    for (let i = 0; i < remaining; i++) {
        seats[fractionals[i].id] = (seats[fractionals[i].id] || 0) + 1;
    }

    return seats;
}

/**
 * Run a full election simulation for a nation.
 *
 * @param {object[]} blocs    - Rows from voter_blocs: { id, bloc_name, voter_count, ideology_1..5, is_active }
 * @param {object[]} parties  - Array of { id, faction_name, approval_rating, axes: { liberty_equality, ... } }
 * @param {number}   [totalSeats=120]
 * @returns {{ votes: object, seats: object, totalAbstentions: number, totalVotesCast: number, details: object[] }}
 */
function runElectionSimulation(blocs, parties, totalSeats = GAME_CONFIG.TOTAL_SEATS) {
    const tally = {};
    for (const p of parties) tally[p.id] = 0;

    let totalAbstentions = 0;
    const details = []; // per-bloc breakdown for debugging

    for (const bloc of blocs) {
        if (!bloc.is_active) continue;
        const count = bloc.voter_count || 0;
        if (count === 0) continue;

        // Collect ideology tags from the bloc
        const tags = [bloc.ideology_1, bloc.ideology_2, bloc.ideology_3, bloc.ideology_4, bloc.ideology_5]
            .filter(t => t && t !== 'Unaligned');

        let step, eligible, abstentions;

        // Snapshot tally before distribution to compute per-bloc party votes
        const snapshot = {};
        for (const p of parties) snapshot[p.id] = tally[p.id];

        if (tags.length === 0) {
            // Unaligned bloc — distribute purely by approval across all parties
            eligible = parties;
            step = 0;
            abstentions = distributeVotes(eligible, [], count, parties, 0, tally);
        } else {
            const result = findEligibleParties(tags, parties);
            eligible = result.eligible;
            step = result.step;
            abstentions = distributeVotes(eligible, tags, count, parties, step, tally);
        }

        // Compute per-party votes from this bloc
        const blocVotes = {};
        for (const p of parties) {
            const gained = tally[p.id] - snapshot[p.id];
            if (gained > 0) blocVotes[p.id] = gained;
        }

        totalAbstentions += abstentions;
        details.push({
            bloc_name: bloc.bloc_name,
            voter_count: count,
            tags,
            step,
            eligible_count: eligible.length,
            abstentions,
            blocVotes
        });
    }

    const totalVotesCast = Object.values(tally).reduce((s, v) => s + v, 0);
    const seats = allocateSeatsByVotes(tally, totalSeats);

    return { votes: tally, seats, totalAbstentions, totalVotesCast, details };
}

/**
 * High-level helper: load all data from Supabase and run the election preview.
 *
 * @param {object} supabase   - Supabase client
 * @param {string} nationId   - Nation UUID
 * @returns {Promise<object>} Full election result with party names, votes, seats, turnout
 */
async function runElectionPreview(supabase, nationId) {
    // 1. Load nation
    const { data: nation } = await supabase
        .from('nations')
        .select('id, name, total_seats, eligible_voters')
        .eq('id', nationId)
        .single();
    if (!nation) throw new Error('Nation not found');

    const totalSeats = nation.total_seats || 120;

    // 2. Load voter blocs
    const { data: blocs } = await supabase
        .from('voter_blocs')
        .select('*')
        .eq('nation_id', nationId)
        .eq('is_active', true);
    if (!blocs || blocs.length === 0) throw new Error('No voter blocs found for this nation');

    // 2b. Scale bloc voter_counts so total matches eligible_voters (blocs are generated from population)
    const eligibleVoters = nation.eligible_voters || 0;
    const totalBlocVoters = blocs.reduce((s, b) => s + (b.voter_count || 0), 0);
    if (totalBlocVoters > 0 && eligibleVoters > 0) {
        const scale = eligibleVoters / totalBlocVoters;
        let scaledSum = 0;
        for (const b of blocs) {
            b.voter_count = Math.round((b.voter_count || 0) * scale);
            scaledSum += b.voter_count;
        }
        // Fix rounding drift on the largest bloc
        const diff = eligibleVoters - scaledSum;
        if (diff !== 0) {
            const largest = blocs.reduce((a, b) => (b.voter_count > a.voter_count ? b : a), blocs[0]);
            largest.voter_count += diff;
        }
    }

    // 3. Load parties + their ideology axes
    const { data: factions } = await supabase
        .from('factions')
        .select('id, faction_name, approval_rating, ideology_modifiers, seats')
        .eq('nation_id', nationId)
        .eq('faction_type', 'party');
    if (!factions || factions.length === 0) throw new Error('No parties found for this nation');

    const factionIds = factions.map(f => f.id);
    const { data: ideologies } = await supabase
        .from('faction_ideology')
        .select('*')
        .in('faction_id', factionIds);

    const ideoMap = {};
    for (const row of (ideologies || [])) ideoMap[row.faction_id] = row;

    // Build party objects with axes
    const parties = factions.map(f => ({
        id: f.id,
        faction_name: f.faction_name,
        approval_rating: f.approval_rating ?? 0,
        ideology_modifiers: f.ideology_modifiers || {},
        axes: ideoMap[f.id] || {
            liberty_equality: 0, tradition_progress: 0, security_freedom: 0,
            globalism_nationalism: 0, individualism_collectivism: 0
        }
    }));

    // 4. Run simulation
    const result = runElectionSimulation(blocs, parties, totalSeats);

    // 5. Build friendly results
    const partyResults = parties.map(p => ({
        party_id: p.id,
        party_name: p.faction_name,
        approval: p.approval_rating,
        votes: result.votes[p.id] || 0,
        vote_percentage: result.totalVotesCast > 0
            ? Math.round(((result.votes[p.id] || 0) / result.totalVotesCast) * 10000) / 100
            : 0,
        seats: result.seats[p.id] || 0
    })).sort((a, b) => b.seats - a.seats);

    // Build party name lookup for UI
    const partyNames = {};
    for (const p of parties) partyNames[p.id] = p.faction_name;

    return {
        nation: nation.name,
        total_seats: totalSeats,
        eligible_voters: nation.eligible_voters || 0,
        total_votes_cast: result.totalVotesCast,
        total_abstentions: result.totalAbstentions,
        turnout_pct: nation.eligible_voters
            ? Math.round((result.totalVotesCast / nation.eligible_voters) * 10000) / 100
            : 0,
        results: partyResults,
        bloc_details: result.details,
        partyNames
    };
}
