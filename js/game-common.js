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
    NO_CONFIDENCE_COOLDOWN_TICKS: 6
};

const FORMATION_DEADLINE_TICKS = 6; // ticks before snap election when no government

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
    VOTE_YES:     1,
    VOTE_NO:      1,
    SPONSOR:      2,
    BILL_PASSED:  1
};

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

    for (const bill of votedYesBills) {
        const tags = getArticleIdeologies(bill);
        for (const tag of tags) {
            const mapping = IDEOLOGY_TO_AXIS[tag];
            if (mapping) addShift(mapping.axisKey, mapping.direction * IDEOLOGY_POINT_VALUES.VOTE_YES);
        }
    }

    for (const bill of votedNoBills) {
        const tags = getArticleIdeologies(bill);
        for (const tag of tags) {
            const mapping = IDEOLOGY_TO_AXIS[tag];
            if (mapping) addShift(mapping.axisKey, -mapping.direction * IDEOLOGY_POINT_VALUES.VOTE_NO);
        }
    }

    for (const bill of sponsoredBills) {
        const tags = getArticleIdeologies(bill);
        for (const tag of tags) {
            const mapping = IDEOLOGY_TO_AXIS[tag];
            if (mapping) addShift(mapping.axisKey, mapping.direction * IDEOLOGY_POINT_VALUES.SPONSOR);
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

function calculateEnactmentApproval(nation, articles, billSupport, sponsorId) {
    const BASE_IMPACT = 3;
    const NO_VOTE_PENALTY = 0.5;

    const allEffects = [];
    for (const art of articles) {
        const p = art.policies || art;
        if (!p) continue;

        if (p.stat_effects && Array.isArray(p.stat_effects)) {
            for (const eff of p.stat_effects) {
                allEffects.push({ stat_key: eff.stat_key, direction: eff.direction });
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

    const { data: allVotes } = await supabase
        .from('bill_support')
        .select('bill_id, faction_id, stance')
        .in('bill_id', resolvedBillIds);
    const allEvents = [];

    for (const faction of factions) {
        const factionVotes = (allVotes || []).filter(v => v.faction_id === faction.id);

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

        if (votedYesBills.length === 0 && votedNoBills.length === 0 && sponsoredBills.length === 0) {
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
            votedNoBills,
            sponsoredBills,
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
            .select('name')
            .eq('id', bill.nation_id)
            .single();
        let votesFor = 0, votesAgainst = 0;

        (bill.bill_support || []).forEach(s => {
            if (s.stance === 'yes') votesFor += s.seat_count;
            else if (s.stance === 'no') votesAgainst += s.seat_count;
        });

        const totalVoted = votesFor + votesAgainst;

        // No-confidence uses simple majority (votesFor > votesAgainst)
        // Normal bills require 51% of total seats
        const isNoConfidence = bill.bill_type === 'no_confidence';
        const passed = isNoConfidence
            ? (totalVoted > 0 && votesFor > votesAgainst)
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
        } else if (passed) {
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

    const approvalDeltas = calculateEnactmentApproval(
        nation,
        bill.bill_articles || [],
        bill.bill_support || [],
        bill.proposed_by
    );
    await applyEnactmentApproval(supabase, approvalDeltas);
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

async function failBill(supabase, bill) {
    await supabase.from('bills').update({
        status: 'failed'
    }).eq('id', bill.id);
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
        .eq('status', 'formed');

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
        .select('name')
        .eq('id', nationId)
        .single();

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
    // Only applies to democracies
    if (nation.government_type === 'Autocracy') return null;

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
    const votes = election.results?.votes || [];
    const majorityParty = votes.find(p => p.seats >= GAME_CONFIG.MAJORITY_SEATS);
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

async function processElections(supabase, nation, currentTick) {
    if (nation.government_type === 'Autocracy') return [];

    const results = [];

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

        // Sync seats back to factions table
        const { data: completedElection } = await supabase
            .from('elections').select('results')
            .eq('id', election.id).single();

        if (completedElection?.results?.seats) {
            for (const r of completedElection.results.seats) {
                await supabase
                    .from('factions')
                    .update({ seats: r.seats })
                    .eq('id', r.party_id);
            }
            console.log(`Seats synced to factions for ${nation.name}`);
        }

        results.push({
            electionId: election.id,
            nation: nation.name,
            result: data
        });
    }

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
        .insert({
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
        });

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
    const { data: hog } = await supabase
        .from('head_of_government')
        .select('*, leader_traits(*)')
        .eq('nation_id', nation.id)
        .eq('active', true)
        .single();

    if (!hog || !hog.leader_traits?.effects) return;

    const effects = hog.leader_traits.effects;
    const factionId = hog.faction_id;

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

    // ---- Step 4: 66.7% abstain, remainder goes to highest-approval party ----
    if (step === 4) {
        const abstain = Math.floor(blocCount * 0.667);
        const forced = blocCount - abstain;
        if (forced > 0) {
            const best = allParties.reduce((a, b) =>
                (b.approval_rating ?? 0) > (a.approval_rating ?? 0) ? b : a, allParties[0]);
            tally[best.id] = (tally[best.id] || 0) + forced;
        }
        return abstain;
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
        const w = (party.approval_rating ?? 0) * alignmentScore;
        weights.push({ id: party.id, weight: w });
        totalWeight += w;
    }

    // ---- Edge case: all weights are 0 (everyone has 0% approval) ----
    if (totalWeight === 0) {
        const evenShare = Math.floor(blocCount / eligible.length);
        for (const party of eligible) {
            tally[party.id] = (tally[party.id] || 0) + evenShare;
        }
        // Give remainder to first party by id (deterministic)
        const remainder = blocCount - evenShare * eligible.length;
        if (remainder > 0) {
            tally[eligible[0].id] = (tally[eligible[0].id] || 0) + remainder;
        }
        return 0;
    }

    // ---- Distribute proportionally with largest-remainder rounding ----
    let allocated = 0;
    const partyVotes = [];
    for (const { id, weight } of weights) {
        const exact = (blocCount * weight) / totalWeight;
        const floored = Math.floor(exact);
        tally[id] = (tally[id] || 0) + floored;
        allocated += floored;
        partyVotes.push({ id, fractional: exact - floored });
    }

    const remainder = blocCount - allocated;
    partyVotes.sort((a, b) => b.fractional - a.fractional);
    for (let i = 0; i < remainder; i++) {
        tally[partyVotes[i].id] = (tally[partyVotes[i].id] || 0) + 1;
    }

    return 0;
}

/**
 * Allocate parliamentary seats from vote totals using
 * Largest Remainder / Hare Quota method.
 *
 * @param {object} voteTotals  - { partyId: totalVotes, ... }
 * @param {number} totalSeats  - Seats to allocate (default 120)
 * @returns {object} { partyId: seats, ... }
 */
function allocateSeatsByVotes(voteTotals, totalSeats = 120) {
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
function runElectionSimulation(blocs, parties, totalSeats = 120) {
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
        .select('id, faction_name, approval_rating, seats')
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
