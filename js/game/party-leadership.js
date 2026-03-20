/**
 * party-leadership.js — Party Leadership: Leader
 * Trait-based candidate generation, electability, AP cost calculation
 */

// ═══════════════════════════════════════
//  Positive Traits (20)
// ═══════════════════════════════════════
export const POSITIVE_TRAITS = [
    // AP & Action Economy
    { key: 'tireless_campaigner', name: 'Tireless Campaigner', cost: 4.0, category: 'AP', effect: '+1 AP generated per tick.' },
    { key: 'efficient_operator', name: 'Efficient Operator', cost: 3.5, category: 'AP', effect: 'All campaign actions cost -1 AP (minimum 1).' },
    { key: 'quick_study', name: 'Quick Study', cost: 1.5, category: 'AP', effect: 'First action each tick costs -1 AP (minimum 1).' },
    { key: 'delegation', name: 'Delegation', cost: 1.0, category: 'AP', effect: 'Outreach and Rally actions cost -1 AP each.' },
    // Electoral & Electability
    { key: 'born_leader', name: 'Born Leader', cost: 3.5, category: 'Electoral', effect: 'Electability gains are doubled.' },
    { key: 'comeback_kid', name: 'Comeback Kid', cost: 3.5, category: 'Electoral', effect: 'Electability losses are halved.' },
    { key: 'crowd_pleaser', name: 'Crowd Pleaser', cost: 1.5, category: 'Electoral', effect: 'Rally turnout +8%. Mobilize campaign reaches +1 additional bloc.' },
    { key: 'telegenic', name: 'Telegenic', cost: 1.5, category: 'Electoral', effect: 'Campaign: Message effectiveness +30%. Media coverage events favor your party.' },
    // Legislative & Parliamentary
    { key: 'arm_twister', name: 'Arm Twister', cost: 1.5, category: 'Legislative', effect: 'Bills your party sponsors have +15% passage rate.' },
    { key: 'deal_maker', name: 'Deal Maker', cost: 1.5, category: 'Legislative', effect: 'Coalition negotiations complete 50% faster. Coalition partners demand 1 fewer ministry.' },
    { key: 'policy_wonk', name: 'Policy Wonk', cost: 1.0, category: 'Legislative', effect: 'Bills you sponsor cost -1 AP to draft. Voters credit your party +5 approval for each enacted bill.' },
    { key: 'constitutional_scholar', name: 'Constitutional Scholar', cost: 1.0, category: 'Legislative', effect: 'Impeachment and no-confidence attempts against your leader cost opponents +3 AP.' },
    // Governance
    { key: 'cabinet_builder', name: 'Cabinet Builder', cost: 3.5, category: 'Governance', effect: 'Your party gets +2 ministry slots in any coalition. Ministers you appoint start with +10 approval.' },
    { key: 'executive_authority', name: 'Executive Authority', cost: 4.0, category: 'Governance', effect: 'Pres: Executive Orders cost -2 AP. PM: Governor-General actions cost -1 AP.' },
    { key: 'crisis_manager', name: 'Crisis Manager', cost: 1.5, category: 'Governance', effect: 'Stability loss during crises halved. Crisis duration -2 ticks.' },
    { key: 'economic_steward', name: 'Economic Steward', cost: 1.5, category: 'Governance', effect: 'GDP growth +0.5% while governing. Budget surplus generates +3 approval per tick.' },
    // Diplomatic
    { key: 'statesman', name: 'Statesman', cost: 3.5, category: 'Diplomatic', effect: 'State visits cost -2 AP and grant double relations boost.' },
    { key: 'international_presence', name: 'International Presence', cost: 1.0, category: 'Diplomatic', effect: 'International reputation +5 while leader. Foreign leaders accept diplomatic proposals 1 tick faster.' },
    // Voter Blocs
    { key: 'populist_touch', name: 'Populist Touch', cost: 3.5, category: 'Voter Blocs', effect: 'SKEPTICAL blocs are treated as SWING for all action targeting.' },
    { key: 'base_energizer', name: 'Base Energizer', cost: 1.5, category: 'Voter Blocs', effect: 'BASE bloc turnout permanently +5%. Champion demands arrive 1 tick later.' },
];

// ═══════════════════════════════════════
//  Negative Traits (20)
// ═══════════════════════════════════════
export const NEGATIVE_TRAITS = [
    // AP & Action Economy
    { key: 'indecisive', name: 'Indecisive', relief: 2.0, category: 'AP', effect: '-1 AP generated per tick.' },
    { key: 'micromanager', name: 'Micromanager', relief: 1.5, category: 'AP', effect: 'All actions cost +1 AP.' },
    { key: 'slow_to_act', name: 'Slow to Act', relief: 1.0, category: 'AP', effect: 'First action each tick costs +1 AP.' },
    { key: 'high_maintenance', name: 'High Maintenance', relief: 0.5, category: 'AP', effect: 'Outreach and Rally actions cost +1 AP each.' },
    // Electoral
    { key: 'unelectable', name: 'Unelectable', relief: 1.5, category: 'Electoral', effect: 'Electability gains are halved.' },
    { key: 'sore_loser', name: 'Sore Loser', relief: 1.5, category: 'Electoral', effect: 'Electability losses are doubled. Losing an election triggers -5 approval across all blocs.' },
    { key: 'gaffe_prone', name: 'Gaffe Prone', relief: 1.0, category: 'Electoral', effect: '20% chance per tick of a gaffe event: -3 approval with a random bloc.' },
    { key: 'wooden_speaker', name: 'Wooden Speaker', relief: 1.0, category: 'Electoral', effect: 'Campaign: Message effectiveness -30%. Rally turnout -5%.' },
    // Legislative
    { key: 'poor_whip', name: 'Poor Whip', relief: 1.0, category: 'Legislative', effect: 'Bills your party sponsors have -15% passage rate.' },
    { key: 'stubborn_negotiator', name: 'Stubborn Negotiator', relief: 1.0, category: 'Legislative', effect: 'Coalition negotiations take +3 ticks. Partners demand 1 additional ministry.' },
    { key: 'single_issue', name: 'Single-Issue', relief: 0.5, category: 'Legislative', effect: 'Bills outside leader\'s ideology axis cost +2 AP to sponsor.' },
    { key: 'paper_thin_mandate', name: 'Paper Thin Mandate', relief: 0.5, category: 'Legislative', effect: 'Impeachment and no-confidence attempts against your leader cost opponents -2 AP.' },
    // Governance
    { key: 'cabinet_hog', name: 'Cabinet Hog', relief: 1.5, category: 'Governance', effect: 'Your party MUST take at least 4 ministries in any coalition. Refusing collapses the government.' },
    { key: 'overreach', name: 'Overreach', relief: 2.0, category: 'Governance', effect: 'Pres: Executive Orders cost +2 AP. PM: All governance actions cost +1 AP.' },
    { key: 'panic_under_pressure', name: 'Panic Under Pressure', relief: 1.0, category: 'Governance', effect: 'Stability loss during crises doubled. Crisis duration +2 ticks.' },
    { key: 'economically_illiterate', name: 'Economically Illiterate', relief: 1.0, category: 'Governance', effect: 'GDP growth -0.3% while governing. Budget deficits cause double approval loss.' },
    // Diplomatic
    { key: 'isolationist', name: 'Isolationist', relief: 1.5, category: 'Diplomatic', effect: 'Cannot initiate state visits. Relations decay +50% faster with all nations.' },
    { key: 'international_pariah', name: 'International Pariah', relief: 0.5, category: 'Diplomatic', effect: 'International reputation -5 while leader. Foreign proposals take +1 tick to process.' },
    // Voter Blocs
    { key: 'elitist', name: 'Elitist', relief: 1.5, category: 'Voter Blocs', effect: 'SKEPTICAL blocs are treated as HOSTILE for all action targeting.' },
    { key: 'divisive_figure', name: 'Divisive Figure', relief: 1.0, category: 'Voter Blocs', effect: 'Outreach actions cost +1 AP. Outreach approval gains with non-BASE blocs halved.' },
];

// ═══════════════════════════════════════
//  Contradiction Pairs
// ═══════════════════════════════════════
const CONTRADICTION_PAIRS = [
    ['tireless_campaigner', 'indecisive'],
    ['efficient_operator', 'micromanager'],
    ['quick_study', 'slow_to_act'],
    ['delegation', 'high_maintenance'],
    ['born_leader', 'unelectable'],
    ['comeback_kid', 'sore_loser'],
    ['crowd_pleaser', 'wooden_speaker'],
    ['telegenic', 'wooden_speaker'],
    ['arm_twister', 'poor_whip'],
    ['deal_maker', 'stubborn_negotiator'],
    ['policy_wonk', 'single_issue'],
    ['constitutional_scholar', 'paper_thin_mandate'],
    ['cabinet_builder', 'cabinet_hog'],
    ['executive_authority', 'overreach'],
    ['crisis_manager', 'panic_under_pressure'],
    ['economic_steward', 'economically_illiterate'],
    ['statesman', 'isolationist'],
    ['international_presence', 'international_pariah'],
    ['populist_touch', 'elitist'],
    ['base_energizer', 'divisive_figure'],
];

// Build lookup maps
const POSITIVE_MAP = {};
POSITIVE_TRAITS.forEach(t => { POSITIVE_MAP[t.key] = t; });

const NEGATIVE_MAP = {};
NEGATIVE_TRAITS.forEach(t => { NEGATIVE_MAP[t.key] = t; });

// Build contradiction lookup (bidirectional)
const CONTRADICTS = {};
CONTRADICTION_PAIRS.forEach(([a, b]) => {
    if (!CONTRADICTS[a]) CONTRADICTS[a] = new Set();
    if (!CONTRADICTS[b]) CONTRADICTS[b] = new Set();
    CONTRADICTS[a].add(b);
    CONTRADICTS[b].add(a);
});

export { POSITIVE_MAP, NEGATIVE_MAP };

// ═══════════════════════════════════════
//  Trait Helper Functions
// ═══════════════════════════════════════

/**
 * Compute the net AP cost modifier for a campaign action based on leader traits.
 *
 * @param {string} actionType - 'rally' | 'outreach' | 'attack' | 'promise' | 'draft_bill' | 'executive_order'
 * @param {object} faction - Faction row with leader_positive_traits, leader_negative_traits, last_action_tick
 * @param {number} currentTick - Current game tick
 * @returns {number} Net AP adjustment (negative = cheaper, positive = more expensive). Final cost should be Math.max(1, base + modifier).
 */
export function getTraitAPModifier(actionType, faction, currentTick) {
    const pos = faction.leader_positive_traits || [];
    const neg = faction.leader_negative_traits || [];
    let mod = 0;

    // efficient_operator: All campaign actions cost -1 AP
    if (pos.includes('efficient_operator') && ['rally', 'outreach', 'attack', 'promise'].includes(actionType)) {
        mod -= 1;
    }

    // micromanager: All actions cost +1 AP
    if (neg.includes('micromanager')) {
        mod += 1;
    }

    // quick_study: First action each tick costs -1 AP
    if (pos.includes('quick_study') && (faction.last_action_tick || 0) < currentTick) {
        mod -= 1;
    }

    // slow_to_act: First action each tick costs +1 AP
    if (neg.includes('slow_to_act') && (faction.last_action_tick || 0) < currentTick) {
        mod += 1;
    }

    // delegation: Outreach and Rally cost -1 AP each
    if (pos.includes('delegation') && ['rally', 'outreach'].includes(actionType)) {
        mod -= 1;
    }

    // high_maintenance: Outreach and Rally cost +1 AP each
    if (neg.includes('high_maintenance') && ['rally', 'outreach'].includes(actionType)) {
        mod += 1;
    }

    // divisive_figure: Outreach costs +1 AP
    if (neg.includes('divisive_figure') && actionType === 'outreach') {
        mod += 1;
    }

    // policy_wonk: Draft bill costs -1 AP
    if (pos.includes('policy_wonk') && actionType === 'draft_bill') {
        mod -= 1;
    }

    // executive_authority: Executive Orders cost -2 AP (presidential)
    if (pos.includes('executive_authority') && actionType === 'executive_order') {
        mod -= 2;
    }

    // overreach (trait): Executive Orders cost +2 AP
    if (neg.includes('overreach') && actionType === 'executive_order') {
        mod += 2;
    }

    return mod;
}

/**
 * Modify rally outcome weights based on leader traits.
 * Mutates the weights object in place.
 * @param {object} weights - { rousing, solid, low, gaffe, divisive, counter }
 * @param {object} faction - Faction row with leader_positive_traits, leader_negative_traits
 */
export function applyRallyTraitModifiers(weights, faction) {
    const pos = faction.leader_positive_traits || [];
    const neg = faction.leader_negative_traits || [];

    // crowd_pleaser: Rally turnout +8% → boost rousing and solid weights
    if (pos.includes('crowd_pleaser')) {
        weights.rousing += 8;
        weights.solid += 4;
    }

    // wooden_speaker: Rally turnout -5%, message -30% → worse outcomes
    if (neg.includes('wooden_speaker')) {
        weights.gaffe += 5;
        weights.rousing -= 8;
        weights.low += 5;
    }
}

/**
 * Compute the approval multiplier for outreach/rally gains based on leader traits.
 * @param {object} faction - Faction row with leader_positive_traits, leader_negative_traits
 * @param {string} actionType - 'rally' | 'outreach'
 * @param {string} blocDisposition - 'BASE' | 'LEAN' | 'SWING' | 'SKEPTICAL' | 'HOSTILE'
 * @returns {number} Multiplier to apply to approval gain (e.g. 1.3 for telegenic, 0.5 for divisive_figure non-BASE)
 */
export function getTraitApprovalMultiplier(faction, actionType, blocDisposition) {
    const pos = faction.leader_positive_traits || [];
    const neg = faction.leader_negative_traits || [];
    let mult = 1.0;

    // telegenic: Campaign message effectiveness +30%
    if (pos.includes('telegenic') && ['rally', 'outreach'].includes(actionType)) {
        mult *= 1.3;
    }

    // divisive_figure: Outreach approval gains with non-BASE blocs halved
    if (neg.includes('divisive_figure') && actionType === 'outreach' && blocDisposition !== 'BASE') {
        mult *= 0.5;
    }

    return mult;
}

/**
 * Get the effective bloc disposition after applying leader traits.
 * populist_touch: SKEPTICAL → SWING
 * elitist: SKEPTICAL → HOSTILE
 * @param {string} disposition - Original disposition
 * @param {object} faction - Faction row with leader_positive_traits, leader_negative_traits
 * @returns {string} Effective disposition
 */
export function getEffectiveBlocDisposition(disposition, faction) {
    const pos = faction.leader_positive_traits || [];
    const neg = faction.leader_negative_traits || [];

    if (disposition === 'SKEPTICAL') {
        if (pos.includes('populist_touch')) return 'SWING';
        if (neg.includes('elitist')) return 'HOSTILE';
    }
    return disposition;
}

// ═══════════════════════════════════════
//  Ideology Colors
// ═══════════════════════════════════════
export const IDEOLOGY_COLORS = {
    INDIVIDUALISM: '#22d3ee',
    COLLECTIVISM: '#d48a3c',
    GLOBALISM: '#22d3ee',
    NATIONALISM: '#d48a3c',
    PROGRESS: '#5cb85c',
    TRADITION: '#c8a64e',
    SECURITY: '#d9534f',
    FREEDOM: '#5cb85c',
    LIBERTY: '#8b7ec8',
    EQUALITY: '#5b9bd5',
};

// ═══════════════════════════════════════
//  Category Colors
// ═══════════════════════════════════════
export const CATEGORY_COLORS = {
    'AP': { color: '#c8a64e', bg: 'rgba(200,166,78,0.10)', border: 'rgba(200,166,78,0.25)' },
    'Electoral': { color: '#5b9bd5', bg: 'rgba(91,155,213,0.10)', border: 'rgba(91,155,213,0.25)' },
    'Legislative': { color: '#8b7ec8', bg: 'rgba(139,126,200,0.10)', border: 'rgba(139,126,200,0.25)' },
    'Governance': { color: '#5cb85c', bg: 'rgba(92,184,92,0.10)', border: 'rgba(92,184,92,0.25)' },
    'Diplomatic': { color: '#5aafa5', bg: 'rgba(90,175,165,0.10)', border: 'rgba(90,175,165,0.25)' },
    'Voter Blocs': { color: '#d48a3c', bg: 'rgba(212,138,60,0.10)', border: 'rgba(212,138,60,0.25)' },
};

// ═══════════════════════════════════════
//  Electability
// ═══════════════════════════════════════
export const ELECTABILITY_TIERS = [
    { min: 0, max: 20, label: 'Very Low', color: '#d9534f' },
    { min: 21, max: 40, label: 'Low', color: '#d48a3c' },
    { min: 41, max: 60, label: 'Moderate', color: '#c8a64e' },
    { min: 61, max: 80, label: 'High', color: '#5aafa5' },
    { min: 81, max: 100, label: 'Very High', color: '#5cb85c' },
];

export function getElectabilityTier(score) {
    for (const tier of ELECTABILITY_TIERS) {
        if (score >= tier.min && score <= tier.max) return tier;
    }
    return ELECTABILITY_TIERS[0];
}

/**
 * Adjust electability based on election results.
 * @param {number} current - Current electability (0-100)
 * @param {'seat_gain'|'seat_loss'|'presidential_loss'|'denied_pm'|'vonc_loss'|'snap_election_loss'} type
 * @param {number} magnitude - Number of seats gained/lost (for seat events)
 * @param {object} positiveTraits - Array of positive trait keys on the leader
 * @param {object} negativeTraits - Array of negative trait keys on the leader
 * @returns {number} New electability value
 */
export function adjustElectability(current, type, magnitude = 0, positiveTraits = [], negativeTraits = []) {
    let delta = 0;

    switch (type) {
        case 'seat_gain':
            delta = 2 * magnitude;
            // Born Leader: gains doubled
            if (positiveTraits.includes('born_leader')) delta *= 2;
            // Unelectable: gains halved
            if (negativeTraits.includes('unelectable')) delta = Math.floor(delta / 2);
            break;
        case 'seat_loss':
            delta = -3 * magnitude;
            // Comeback Kid: losses halved
            if (positiveTraits.includes('comeback_kid')) delta = Math.ceil(delta / 2);
            // Sore Loser: losses doubled
            if (negativeTraits.includes('sore_loser')) delta *= 2;
            break;
        case 'presidential_loss':
            delta = -20;
            if (positiveTraits.includes('comeback_kid')) delta = Math.ceil(delta / 2);
            if (negativeTraits.includes('sore_loser')) delta *= 2;
            break;
        case 'denied_pm':
            delta = -10;
            if (positiveTraits.includes('comeback_kid')) delta = Math.ceil(delta / 2);
            if (negativeTraits.includes('sore_loser')) delta *= 2;
            break;
        case 'vonc_loss':
            delta = -25;
            if (positiveTraits.includes('comeback_kid')) delta = Math.ceil(delta / 2);
            if (negativeTraits.includes('sore_loser')) delta *= 2;
            break;
        case 'snap_election_loss':
            delta = -15;
            if (positiveTraits.includes('comeback_kid')) delta = Math.ceil(delta / 2);
            if (negativeTraits.includes('sore_loser')) delta *= 2;
            break;
    }

    return Math.max(0, Math.min(100, current + delta));
}

// ═══════════════════════════════════════
//  AP Cost Calculation
// ═══════════════════════════════════════
export function calculateAPCost(positiveTraitKeys, negativeTraitKeys) {
    let posTotal = 0;
    let negTotal = 0;

    positiveTraitKeys.forEach(key => {
        const t = POSITIVE_MAP[key];
        if (t) posTotal += t.cost;
    });

    negativeTraitKeys.forEach(key => {
        const t = NEGATIVE_MAP[key];
        if (t) negTotal += t.relief;
    });

    const raw = posTotal - negTotal;
    return {
        positiveTotal: posTotal,
        negativeTotal: negTotal,
        rawCost: raw,
        apCost: Math.max(0, Math.min(8, Math.round(raw)))
    };
}

export function getAPCostColor(ap) {
    if (ap === 0) return '#5cb85c';
    if (ap <= 3) return '#c8a64e';
    if (ap <= 5) return '#d48a3c';
    return '#d9534f';
}

export function getAPCostLabel(ap) {
    if (ap === 0) return 'FREE';
    return ap + ' AP';
}

// ═══════════════════════════════════════
//  Candidate Generation
// ═══════════════════════════════════════

/**
 * Generate a single candidate with traits per the design spec.
 * @param {string} nationName - For name pool selection
 * @param {Function} getNationNamesFn - The getNationNames function
 * @param {Set} usedFirstNames - Already used first names
 * @param {Set} usedLastNames - Already used last names
 * @param {'leader'} role - Role this candidate is for
 * @returns {object} Candidate data
 */
export function generateCandidate(nationName, getNationNamesFn, usedFirstNames = new Set(), usedLastNames = new Set(), role = 'leader') {
    const { firstNames, lastNames } = getNationNamesFn(nationName);

    // Pick unique name
    let firstName, lastName;
    let attempts = 0;
    do {
        firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        attempts++;
    } while (usedFirstNames.has(firstName) && attempts < 50);
    usedFirstNames.add(firstName);

    attempts = 0;
    do {
        lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        attempts++;
    } while (usedLastNames.has(lastName) && attempts < 50);
    usedLastNames.add(lastName);

    // Age: 28-65
    const age = 28 + Math.floor(Math.random() * 38);

    // Electability: 20-70 at generation
    const electability = 20 + Math.floor(Math.random() * 51);

    // Ideology: pick one of the 10
    const ideologies = ['INDIVIDUALISM', 'COLLECTIVISM', 'GLOBALISM', 'NATIONALISM', 'PROGRESS', 'TRADITION', 'SECURITY', 'FREEDOM', 'LIBERTY', 'EQUALITY'];
    const ideology = ideologies[Math.floor(Math.random() * ideologies.length)];

    // Generate positive traits: 2-4, at least 2 categories
    const numPositive = 2 + Math.floor(Math.random() * 3); // 2, 3, or 4
    const positiveTraits = pickTraits(POSITIVE_TRAITS, numPositive, [], true);

    // Generate negative traits: 1-3, no contradictions with positives
    // Category diversity also enforced for negatives when 2+ traits
    const numNegative = 1 + Math.floor(Math.random() * 3); // 1, 2, or 3
    const positiveKeys = positiveTraits.map(t => t.key);
    const negativeTraits = pickTraits(NEGATIVE_TRAITS, numNegative, positiveKeys, numNegative >= 2);

    const positiveTraitKeys = positiveTraits.map(t => t.key);
    const negativeTraitKeys = negativeTraits.map(t => t.key);
    const costInfo = calculateAPCost(positiveTraitKeys, negativeTraitKeys);

    const candidate = {
        firstName,
        lastName,
        age,
        ideology,
        positiveTraits: positiveTraitKeys,
        negativeTraits: negativeTraitKeys,
        apCost: costInfo.apCost,
        costBreakdown: costInfo,
    };
    candidate.electability = electability;
    return candidate;
}

/**
 * Pick N traits from the given pool, respecting constraints.
 */
function pickTraits(pool, count, existingKeys, requireCategoryDiversity) {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const picked = [];
    const pickedKeys = new Set();
    const pickedCategories = new Set();

    for (const trait of shuffled) {
        if (picked.length >= count) break;
        if (pickedKeys.has(trait.key)) continue;

        // Check contradictions with existing keys
        const contradictions = CONTRADICTS[trait.key];
        if (contradictions) {
            let blocked = false;
            for (const ek of existingKeys) {
                if (contradictions.has(ek)) { blocked = true; break; }
            }
            if (blocked) continue;
            for (const pk of pickedKeys) {
                if (contradictions.has(pk)) { blocked = true; break; }
            }
            if (blocked) continue;
        }

        picked.push(trait);
        pickedKeys.add(trait.key);
        pickedCategories.add(trait.category);
    }

    // If we need category diversity and don't have it, swap last trait
    if (requireCategoryDiversity && pickedCategories.size < 2 && picked.length >= 2) {
        const currentCat = picked[0].category;
        const diffCatTrait = shuffled.find(t =>
            t.category !== currentCat &&
            !pickedKeys.has(t.key) &&
            !existingKeys.some(ek => CONTRADICTS[t.key]?.has(ek))
        );
        if (diffCatTrait) {
            picked[picked.length - 1] = diffCatTrait;
        }
    }

    return picked;
}

/**
 * Generate a set of leadership candidates (3 candidates for a role).
 * @param {'leader'} role - Role these candidates are for
 */
export function generateLeadershipCandidates(nationName, getNationNamesFn, count = 3, role = 'leader') {
    const usedFirst = new Set();
    const usedLast = new Set();
    const candidates = [];

    for (let i = 0; i < count; i++) {
        candidates.push(generateCandidate(nationName, getNationNamesFn, usedFirst, usedLast, role));
    }

    return candidates;
}

// ═══════════════════════════════════════
//  Leader Step-Down Rules
// ═══════════════════════════════════════

/**
 * Check if a party leader must step down due to PM/President denial rules.
 *
 * PM rule: If leader doesn't become PM after winning largest seats 2 times, step down.
 * President rule: If leader doesn't become President after 2 presidential elections, step down.
 *
 * @param {object} supabase - Supabase client
 * @param {string} nationId
 * @param {string} factionId
 * @param {number} currentTick
 * @param {string} checkType - 'pm' or 'president'
 * @returns {object|null} Step-down event data if leader must step down, null otherwise
 */
export async function checkLeaderStepDown(supabase, nationId, factionId, currentTick, checkType) {
    const { data: faction, error: factionErr } = await supabase
        .from('factions')
        .select('id, faction_name, leader_first_name, leader_last_name, leader_age')
        .eq('id', factionId)
        .single();

    if (factionErr || !faction || !faction.leader_first_name) return null;

    const leaderName = `${faction.leader_first_name} ${faction.leader_last_name}`;

    if (checkType === 'pm') {
        const { data: denials, error: dErr } = await supabase
            .from('event_log')
            .select('id')
            .eq('nation_id', nationId)
            .eq('category', 'POLITICAL')
            .ilike('description_chosen', `%${faction.faction_name}%denied%Prime Minister%`)
            .order('fired_at_tick', { ascending: false })
            .limit(10);

        if (dErr) return null;

        if (denials && denials.length >= 2) {
            return {
                mustStepDown: true,
                leaderName,
                reason: `${leaderName} steps down as ${faction.faction_name} leader after being denied the Prime Minister post twice.`,
                factionId,
            };
        }
    } else if (checkType === 'president') {
        const { data: losses, error: lErr } = await supabase
            .from('event_log')
            .select('id')
            .eq('nation_id', nationId)
            .eq('category', 'POLITICAL')
            .ilike('description_chosen', `%${faction.faction_name}%lost%presidential%`)
            .order('fired_at_tick', { ascending: false })
            .limit(10);

        if (lErr) return null;

        if (losses && losses.length >= 2) {
            return {
                mustStepDown: true,
                leaderName,
                reason: `${leaderName} steps down as ${faction.faction_name} leader after losing 2 presidential elections.`,
                factionId,
            };
        }
    }

    return null;
}

/**
 * Execute a leader step-down: clear the leader fields and log an event.
 */
export async function executeLeaderStepDown(supabase, nationId, factionId, currentTick, reason) {
    // Clear leader from faction
    const { error: updateErr } = await supabase.from('factions').update({
        leader_first_name: null,
        leader_last_name: null,
        leader_age: null,
        electability: 50,
        leader_ideology: null,
        leader_positive_traits: [],
        leader_negative_traits: [],
    }).eq('id', factionId);

    if (updateErr) throw new Error('Failed to clear leader: ' + updateErr.message);

    // Log event
    const { error: eventErr } = await supabase.from('event_log').insert({
        nation_id: nationId,
        event_name: 'Party Leader Steps Down',
        trigger_key: 'party_leader_replaced',
        description_chosen: reason,
        category: 'POLITICAL',
        fired_at_tick: currentTick,
    });

    if (eventErr) throw new Error('Failed to log step-down event: ' + eventErr.message);
}
