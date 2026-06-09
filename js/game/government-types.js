/**
 * government-types.js — Government type helpers (democracy, presidential, monarchy)
 *
 * Semi-presidential was culled in 20270748. No nation in use ran it
 * and the cohabitation / domain-split machinery (MINISTRY_DOMAINS,
 * EO_DOMAIN, isCohabitation, isPresidentialDomainMinistry,
 * getMinistryDomain, isSemiPresidential) was dead weight. Anything
 * that used to branch on isSemiPresidential is now either the
 * presidential branch or the parliamentary branch.
 */

/**
 * Government type helpers.
 * Call with a nation object (must have government_type field).
 */
export const CANONICAL_GOVERNMENT_TYPES = Object.freeze({
    PARLIAMENTARY_DEMOCRACY: 'Democracy',
    PRESIDENTIAL_REPUBLIC: 'Presidential',
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
export function isAbsoluteMonarchy(input) { return getCanonicalGovernmentType(input) === CANONICAL_GOVERNMENT_TYPES.ABSOLUTE_MONARCHY; }
// KNOWN GAP: Monarchy nations have no elections. Seats are currently static.
// Future Phase 4: Add "Grant Seats" royal action for monarch to appoint seats to noble houses.

/** Capability helpers — thin aliases over the type predicates. Kept
 *  because callers read more cleanly as "does this nation have an
 *  elected president?" / "does this nation have a parliamentary PM?"
 *  than as direct type checks. */
export function hasElectedPresident(input) { return isPresidentialRepublic(input); }
export function hasParliamentaryPM(input) { return isParliamentaryDemocracy(input) || isAbsoluteMonarchy(input); }
export function hasMonarch(input) { return isAbsoluteMonarchy(input); }

/** Get the head of state title for display */
export function getHeadOfStateTitle(nation) {
    if (isAbsoluteMonarchy(nation)) return nation.monarch_title || 'King';
    if (hasElectedPresident(nation)) return 'President';
    return nation.hos_title || 'Head of State';
}

export function isGovernmentPresidential(nation) { return hasElectedPresident(nation); }

/** Canonical list of cabinet ministry keys (PM seat first, then all
 *  other portfolios). Single source of truth for "what counts as a
 *  cabinet slot" — both formation UI and tick code iterate this. */
export const CABINET_MINISTRY_KEYS = Object.freeze([
    'prime_minister',
    'interior', 'foreign', 'defense', 'finance',
    'education', 'healthcare', 'labor', 'justice',
    'trade', 'energy', 'transportation', 'sports',
    // 'security' has display names below but isn't a default seat yet.
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
    sports:         'Ministry of Sports',
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
    sports:         'Minister of Sports',
    security:       'Minister of Security',
});

// Canonical government types used by nations and ministry event templates.
export const canonicalNationGovTypes = ['Parliamentary Republic', 'Presidential'];

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
});

/**
 * Returns the current constitutional system identifier for a nation.
 * Used to determine which reform options are available (can't reform to current system).
 *
 * @param {object} nation - Nation row (needs government_type, hos_election_method)
 * @returns {'parliamentary'|'constitutional_monarchy'|'presidential'}
 */
export function getCurrentConstitutionalSystem(nation) {
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
        default: return '';
    }
}
