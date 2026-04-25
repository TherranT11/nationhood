/**
 * government-types.js — Government type helpers (democracy, presidential, semi-presidential)
 * Extracted from game-common.js
 */

/**
 * Government type helpers.
 * Call with a nation object (must have government_type field).
 */
export const CANONICAL_GOVERNMENT_TYPES = Object.freeze({
    PARLIAMENTARY_DEMOCRACY: 'Democracy',
    PRESIDENTIAL_REPUBLIC: 'Presidential',
    SEMI_PRESIDENTIAL: 'Semi-Presidential',
    ABSOLUTE_MONARCHY: 'Absolute Monarchy'
});

export const GOVERNMENT_TYPE_ALIASES = Object.freeze({
    democracy: CANONICAL_GOVERNMENT_TYPES.PARLIAMENTARY_DEMOCRACY,
    democratic: CANONICAL_GOVERNMENT_TYPES.PARLIAMENTARY_DEMOCRACY,
    parliamentary: CANONICAL_GOVERNMENT_TYPES.PARLIAMENTARY_DEMOCRACY,
    parliamentarian: CANONICAL_GOVERNMENT_TYPES.PARLIAMENTARY_DEMOCRACY,
    'parliamentary democracy': CANONICAL_GOVERNMENT_TYPES.PARLIAMENTARY_DEMOCRACY,
    presidential: CANONICAL_GOVERNMENT_TYPES.PRESIDENTIAL_REPUBLIC,
    'presidential republic': CANONICAL_GOVERNMENT_TYPES.PRESIDENTIAL_REPUBLIC,
    'executive presidency': CANONICAL_GOVERNMENT_TYPES.PRESIDENTIAL_REPUBLIC,
    'semi-presidential': CANONICAL_GOVERNMENT_TYPES.SEMI_PRESIDENTIAL,
    'semi presidential': CANONICAL_GOVERNMENT_TYPES.SEMI_PRESIDENTIAL,
    semipresidential: CANONICAL_GOVERNMENT_TYPES.SEMI_PRESIDENTIAL,
    'absolute monarchy': CANONICAL_GOVERNMENT_TYPES.ABSOLUTE_MONARCHY,
    'absolute_monarchy': CANONICAL_GOVERNMENT_TYPES.ABSOLUTE_MONARCHY,
    monarchy: CANONICAL_GOVERNMENT_TYPES.ABSOLUTE_MONARCHY,
});

export function getCanonicalGovernmentType(input, fallbackType = CANONICAL_GOVERNMENT_TYPES.PARLIAMENTARY_DEMOCRACY) {
    const govType = typeof input === 'string' ? input : input?.government_type;
    if (typeof govType !== 'string') return fallbackType;
    return GOVERNMENT_TYPE_ALIASES[govType.trim().toLowerCase()] || fallbackType;
}

export function isParliamentaryDemocracy(input) { return getCanonicalGovernmentType(input) === CANONICAL_GOVERNMENT_TYPES.PARLIAMENTARY_DEMOCRACY; }
export function isPresidentialRepublic(input) { return getCanonicalGovernmentType(input) === CANONICAL_GOVERNMENT_TYPES.PRESIDENTIAL_REPUBLIC; }
export function isSemiPresidential(input) { return getCanonicalGovernmentType(input) === CANONICAL_GOVERNMENT_TYPES.SEMI_PRESIDENTIAL; }

export function isAbsoluteMonarchy(input) { return getCanonicalGovernmentType(input) === CANONICAL_GOVERNMENT_TYPES.ABSOLUTE_MONARCHY; }
// KNOWN GAP: Monarchy nations have no elections. Seats are currently static.
// Future Phase 4: Add "Grant Seats" royal action for monarch to appoint seats to noble houses.

/** Capability helpers — use these instead of type checks where possible.
 *  Semi-presidential has BOTH an elected president AND a parliamentary PM. */
export function hasElectedPresident(input) { return isPresidentialRepublic(input) || isSemiPresidential(input); }
export function hasParliamentaryPM(input) { return isParliamentaryDemocracy(input) || isSemiPresidential(input) || isAbsoluteMonarchy(input); }
export function hasMonarch(input) { return isAbsoluteMonarchy(input); }

/** Get the head of state title for display */
export function getHeadOfStateTitle(nation) {
    if (isAbsoluteMonarchy(nation)) return nation.monarch_title || 'King';
    if (hasElectedPresident(nation)) return 'President';
    return nation.hos_title || 'Head of State';
}

export function isGovernmentPresidential(nation) { return hasElectedPresident(nation); }

// ==================== SEMI-PRESIDENTIAL DOMAIN SPLIT ====================

/** Ministry domain: 'presidential' ministries are under the President's policy area,
 *  'domestic' ministries are under the PM's policy area.
 *  In semi-presidential cohabitation, the PM appoints all ministers but
 *  presidential-domain slots MUST be filled from the President's party. */
export const MINISTRY_DOMAINS = Object.freeze({
    foreign:        'presidential',
    defense:        'presidential',
    trade:          'presidential',
    prime_minister: 'domestic',
    interior:       'domestic',
    finance:        'domestic',
    education:      'domestic',
    healthcare:     'domestic',
    labor:          'domestic',
    justice:        'domestic',
    energy:         'domestic',
    transportation: 'domestic',
    security:       'domestic'
});

export const PRESIDENTIAL_DOMAIN_MINISTRIES = Object.freeze(['foreign', 'defense', 'trade']);

/** Canonical list of cabinet ministry keys (PM seat first, then domestic +
 *  presidential-domain seats). Single source of truth for "what counts as a
 *  cabinet slot" — both formation UI and tick code iterate this. */
export const CABINET_MINISTRY_KEYS = Object.freeze([
    'prime_minister',
    'interior', 'foreign', 'defense', 'finance',
    'education', 'healthcare', 'labor', 'justice',
    'trade', 'energy', 'transportation',
    // 'security' is referenced in MINISTRY_DOMAINS but not yet a default cabinet seat.
]);

/** Office display name (e.g. "Ministry of the Interior").
 *  Used for the ministries.ministry_name column and any UI labelling the
 *  *office* (not the person). */
export const MINISTRY_OFFICE_NAMES = Object.freeze({
    prime_minister: 'Prime Minister',
    interior:       'Ministry of the Interior',
    foreign:        'Foreign Ministry',
    defense:        'Ministry of Defense',
    finance:        'Ministry of Finance',
    education:      'Ministry of Education',
    healthcare:     'Ministry of Healthcare',
    labor:          'Ministry of Labor',
    justice:        'Ministry of Justice',
    trade:          'Ministry of Trade',
    energy:         'Ministry of Energy',
    transportation: 'Ministry of Transportation',
    security:       'Ministry of Security',
});

/** Person's title (e.g. "Minister of the Interior"). Used for nominee
 *  display, confirmation bill names, modal headings. */
export const MINISTER_TITLES = Object.freeze({
    prime_minister: 'Prime Minister',
    interior:       'Minister of the Interior',
    foreign:        'Minister of Foreign Affairs',
    defense:        'Minister of Defense',
    finance:        'Minister of Finance',
    education:      'Minister of Education',
    healthcare:     'Minister of Healthcare',
    labor:          'Minister of Labor',
    justice:        'Minister of Justice',
    trade:          'Minister of Trade',
    energy:         'Minister of Energy',
    transportation: 'Minister of Transportation',
    security:       'Minister of Security',
});

/** Executive order domain: which branch controls each EO type in semi-presidential.
 *  'president' = only the president's party can issue.
 *  'pm' = only the PM's party can issue.
 *  'acting_minister' is special — domain depends on the target ministry. */
export const EO_DOMAIN = Object.freeze({
    national_emergency: 'president',
    acting_minister:    'split',      // depends on target ministry domain
    tax_adjustment:     'pm',
    price_controls:     'pm',
    censure:            'pm',
    stimulate_economy:  'pm'
});

/** Returns true if the president and PM are from different parties (cohabitation). */
export function isCohabitation(nation, presidentFactionId, pmFactionId) {
    if (!isSemiPresidential(nation)) return false;
    if (!presidentFactionId || !pmFactionId) return false;
    return presidentFactionId !== pmFactionId;
}

/** Returns the domain of a ministry key ('presidential' or 'domestic'). */
export function getMinistryDomain(ministryKey) {
    return MINISTRY_DOMAINS[ministryKey] || 'domestic';
}

/** Returns true if the given ministry must be filled from the president's party
 *  in a semi-presidential system. */
export function isPresidentialDomainMinistry(ministryKey) {
    return PRESIDENTIAL_DOMAIN_MINISTRIES.includes(ministryKey);
}

// Canonical government types used by nations and ministry event templates.
export const canonicalNationGovTypes = ['Parliamentary Republic', 'Presidential', 'Semi-Presidential'];

// Temporary aliases to support migration from legacy gov-type strings.
// TODO(next migration stub): remove aliases and require strict canonical-only values.
export const legacyAliasMap = {
    Democracy: 'Parliamentary Republic'
};

export function canonicalizeNationGovType(govType) {
    if (!govType) return null;
    return legacyAliasMap[govType] || govType;
}

/**
 * Returns a human-friendly government type label for display.
 * Distinguishes Constitutional Monarchy (parliamentary + hereditary HoS) from
 * Absolute Monarchy (government_type explicitly set to Absolute Monarchy).
 */
export function getGovDisplayLabel(nation) {
    if (isSemiPresidential(nation)) return 'Semi-Presidential Republic';
    if (isPresidentialRepublic(nation)) return 'Presidential Republic';
    if (isAbsoluteMonarchy(nation)) return 'Absolute Monarchy';
    if (nation?.hos_election_method === 'hereditary') return 'Constitutional Monarchy';
    return 'Parliamentary Democracy';
}

/**
 * Constitutional Reform system identifiers.
 * Maps to the proposed_constitutional_reform column values on the bills table.
 */
export const CONSTITUTIONAL_SYSTEMS = Object.freeze({
    PARLIAMENTARY: 'parliamentary',
    CONSTITUTIONAL_MONARCHY: 'constitutional_monarchy',
    PRESIDENTIAL: 'presidential',
    SEMI_PRESIDENTIAL: 'semi_presidential'
});

/**
 * Returns the current constitutional system identifier for a nation.
 * Used to determine which reform options are available (can't reform to current system).
 *
 * @param {object} nation - Nation row (needs government_type, hos_election_method)
 * @returns {'parliamentary'|'constitutional_monarchy'|'presidential'|'semi_presidential'}
 */
export function getCurrentConstitutionalSystem(nation) {
    if (isSemiPresidential(nation)) return CONSTITUTIONAL_SYSTEMS.SEMI_PRESIDENTIAL;
    if (isPresidentialRepublic(nation)) return CONSTITUTIONAL_SYSTEMS.PRESIDENTIAL;
    if (nation?.hos_election_method === 'hereditary') return CONSTITUTIONAL_SYSTEMS.CONSTITUTIONAL_MONARCHY;
    return CONSTITUTIONAL_SYSTEMS.PARLIAMENTARY;
}

/**
 * Returns the display label for a constitutional system identifier.
 * @param {string} system - One of CONSTITUTIONAL_SYSTEMS values
 * @returns {string} Human-readable label
 */
export function getConstitutionalSystemLabel(system) {
    switch (system) {
        case CONSTITUTIONAL_SYSTEMS.PARLIAMENTARY: return 'Parliamentary Democracy';
        case CONSTITUTIONAL_SYSTEMS.CONSTITUTIONAL_MONARCHY: return 'Constitutional Monarchy';
        case CONSTITUTIONAL_SYSTEMS.PRESIDENTIAL: return 'Presidential Republic';
        case CONSTITUTIONAL_SYSTEMS.SEMI_PRESIDENTIAL: return 'Semi-Presidential Republic';
        default: return 'Unknown';
    }
}

/**
 * Returns a short description of what each constitutional system entails.
 * @param {string} system - One of CONSTITUTIONAL_SYSTEMS values
 * @returns {string}
 */
export function getConstitutionalSystemDescription(system) {
    switch (system) {
        case CONSTITUTIONAL_SYSTEMS.PARLIAMENTARY: return 'Head of State appointed by parliament. Prime Minister holds executive power.';
        case CONSTITUTIONAL_SYSTEMS.CONSTITUTIONAL_MONARCHY: return 'Hereditary monarch as Head of State. Prime Minister holds executive power.';
        case CONSTITUTIONAL_SYSTEMS.PRESIDENTIAL: return 'Directly elected President as sole executive. No Prime Minister.';
        case CONSTITUTIONAL_SYSTEMS.SEMI_PRESIDENTIAL: return 'Directly elected President shares power with a Prime Minister appointed by parliament.';
        default: return '';
    }
}
