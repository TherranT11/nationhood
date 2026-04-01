/**
 * government-types.js — Government type helpers (democracy, presidential)
 * Extracted from game-common.js
 */

/**
 * Government type helpers.
 * Call with a nation object (must have government_type field).
 */
export const CANONICAL_GOVERNMENT_TYPES = Object.freeze({
    PARLIAMENTARY_DEMOCRACY: 'Democracy',
    PRESIDENTIAL_REPUBLIC: 'Presidential'
});

export const GOVERNMENT_TYPE_ALIASES = Object.freeze({
    democracy: CANONICAL_GOVERNMENT_TYPES.PARLIAMENTARY_DEMOCRACY,
    democratic: CANONICAL_GOVERNMENT_TYPES.PARLIAMENTARY_DEMOCRACY,
    parliamentary: CANONICAL_GOVERNMENT_TYPES.PARLIAMENTARY_DEMOCRACY,
    parliamentarian: CANONICAL_GOVERNMENT_TYPES.PARLIAMENTARY_DEMOCRACY,
    'parliamentary democracy': CANONICAL_GOVERNMENT_TYPES.PARLIAMENTARY_DEMOCRACY,
    presidential: CANONICAL_GOVERNMENT_TYPES.PRESIDENTIAL_REPUBLIC,
    'presidential republic': CANONICAL_GOVERNMENT_TYPES.PRESIDENTIAL_REPUBLIC,
    'executive presidency': CANONICAL_GOVERNMENT_TYPES.PRESIDENTIAL_REPUBLIC
});

export function getCanonicalGovernmentType(input, fallbackType = CANONICAL_GOVERNMENT_TYPES.PARLIAMENTARY_DEMOCRACY) {
    const govType = typeof input === 'string' ? input : input?.government_type;
    if (typeof govType !== 'string') return fallbackType;
    return GOVERNMENT_TYPE_ALIASES[govType.trim().toLowerCase()] || fallbackType;
}

export function isParliamentaryDemocracy(input) { return getCanonicalGovernmentType(input) === CANONICAL_GOVERNMENT_TYPES.PARLIAMENTARY_DEMOCRACY; }
export function isPresidentialRepublic(input) { return getCanonicalGovernmentType(input) === CANONICAL_GOVERNMENT_TYPES.PRESIDENTIAL_REPUBLIC; }

export function isGovernmentPresidential(nation) { return isPresidentialRepublic(nation); }

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
 * Accounts for Constitutional Monarchy (hereditary HOS in a parliamentary system).
 *
 * @param {object} nation - Nation row (needs government_type, hos_election_method)
 * @returns {string} e.g. "Parliamentary Democracy", "Constitutional Monarchy", "Presidential Republic"
 */
export function getGovDisplayLabel(nation) {
    if (isPresidentialRepublic(nation)) return 'Presidential Republic';
    if (nation?.hos_election_method === 'hereditary') return 'Constitutional Monarchy';
    return 'Parliamentary Democracy';
}
