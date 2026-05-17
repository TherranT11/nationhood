/**
 * corp-executives.js — Executive pool generation and CEO seeding
 *
 * Generates a persistent pool of 18 hireable executives per nation,
 * with names drawn from all nation name pools. Each candidate has a
 * required compensation and contract length. The skill rating is no
 * longer part of gameplay — its column on corp_executives /
 * executive_pool stays in place as an inert artifact (will be
 * replaced by a new mechanic later); every insert writes a neutral
 * placeholder of 50 to satisfy the NOT NULL constraint.
 *
 * CEO is auto-seeded from existing faction leader data at corp
 * creation. All other roles start vacant; the player fills them
 * exclusively via Executive Search (no auto-rehire).
 */

import { getNationNames } from './political-actions.js';

// ═══════════════════════════════════════════════════
// EXECUTIVE ORIGIN NATIONS
// ═══════════════════════════════════════════════════
//
// Origin nations available to supply executives, with relative weights.
// Local nation is upweighted 3× inside pickOrigin so domestic candidates
// dominate. Names for each origin are resolved through getNationNames()
// in political-actions.js — that is the single source of truth, so adding
// a new nation here only requires (1) adding it to getNationNames and
// (2) appending one row below. No more drift between nation pools.

var EXEC_ORIGIN_NATIONS = [
    { origin: 'Melizea',      weight: 2 },
    { origin: 'Sangreza',     weight: 1 },
    { origin: 'Sierramar',    weight: 1 },
    { origin: 'San Estrella', weight: 1 },
    { origin: 'Palvera',      weight: 1 },
    { origin: 'Montequilla',  weight: 1 },
    { origin: 'Avelia',       weight: 2 },
    { origin: 'Calveth',      weight: 2 },
    { origin: 'Flandis',      weight: 2 },
    { origin: 'Vostia',       weight: 2 },
    { origin: 'Hajjara',      weight: 2 },
    { origin: 'Dravka',       weight: 2 },
    { origin: 'Danwei',       weight: 2 },
];

// ═══════════════════════════════════════════════════
// ROLE DEFINITIONS
// ═══════════════════════════════════════════════════

export var EXEC_ROLES = ['CEO', 'CFO', 'COO', 'CTO', 'CMO', 'CLO', 'Lobbyist'];

export var EXEC_ROLE_META = {
    CEO:      { fullTitle: 'Chief Executive Officer',  color: '#c8a832' },
    CFO:      { fullTitle: 'Chief Financial Officer',  color: '#5cb85c' },
    COO:      { fullTitle: 'Chief Operating Officer',  color: '#8b9a6b' },
    CTO:      { fullTitle: 'Chief Technology Officer', color: '#5a8aaa' },
    CMO:      { fullTitle: 'Chief Marketing Officer',  color: '#c84'    },
    CLO:      { fullTitle: 'Chief Legal Officer',      color: '#c55'    },
    Lobbyist: { fullTitle: 'Corporate Lobbyist',       color: '#8a6aaa' },
};

// Which roles each candidate can fill (randomly assigned 1-3 specializations)
var ROLE_GROUPS = [
    ['CEO'],
    ['CFO'],
    ['COO'],
    ['CTO'],
    ['CMO'],
    ['CLO'],
    ['Lobbyist'],
    ['CFO', 'COO'],
    ['CMO', 'CLO'],
    ['COO', 'CTO'],
    ['CFO', 'CLO'],
    ['CMO', 'Lobbyist'],
];

// ═══════════════════════════════════════════════════
// COMPENSATION FORMULA
// ═══════════════════════════════════════════════════

/**
 * Pick a random annual salary in the canonical band. The old
 * skill-based curve is gone — every exec draws from the same
 * $2M..$8M/yr band, rounded to $10k. The skill column on
 * corp_executives stays in place as an inert artifact (a future
 * mechanic will replace it). The `_skill` parameter is accepted
 * and ignored so legacy callers don't need to change.
 */
export function calculateCompensation(_skill) {
    var payDollars = 2000000 + Math.random() * 6000000;
    return Math.round(payDollars / 10000) * 10000;
}

// ═══════════════════════════════════════════════════
// POOL GENERATION
// ═══════════════════════════════════════════════════

/**
 * Pick a random origin nation using weighted selection.
 * Local nation gets a higher weight for domestic candidates.
 * Names are resolved through getNationNames (the SSoT in
 * political-actions.js), so every nation registered there
 * automatically participates here.
 */
function pickOrigin(localNationName) {
    var weighted = EXEC_ORIGIN_NATIONS.map(function(p) {
        return { origin: p.origin, weight: p.origin === localNationName ? p.weight * 3 : p.weight };
    });
    var totalWeight = weighted.reduce(function(s, p) { return s + p.weight; }, 0);
    var r = Math.random() * totalWeight;
    var picked = weighted[weighted.length - 1];
    for (var i = 0; i < weighted.length; i++) {
        r -= weighted[i].weight;
        if (r <= 0) { picked = weighted[i]; break; }
    }
    var names = getNationNames(picked.origin);
    return { origin: picked.origin, firstNames: names.firstNames, lastNames: names.lastNames };
}

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
}

/**
 * Generate the executive pool for a nation.
 * Creates 18 candidates with diverse origins, skills, and roles.
 *
 * @param {string} nationId - UUID of the nation
 * @param {string} nationName - name of the nation (for weighting local candidates)
 * @returns {Array} rows ready for Supabase insert into executive_pool
 */
export function generateExecutivePool(nationId, nationName) {
    var pool = [];
    var usedNames = new Set();
    var count = 18;

    for (var i = 0; i < count; i++) {
        var origin = pickOrigin(nationName);
        var firstName, lastName, fullName;

        // Avoid duplicate names. If 20 attempts all collide, skip this slot
        // entirely rather than insert a silent duplicate. With 50+ names per
        // pool and only 18 candidates, the skip path is effectively unreachable
        // — but if a future pool shrinks, we'd rather return < 18 than dup.
        var attempts = 0;
        do {
            firstName = pickRandom(origin.firstNames);
            lastName = pickRandom(origin.lastNames);
            fullName = firstName + ' ' + lastName;
            attempts++;
        } while (usedNames.has(fullName) && attempts < 20);
        if (usedNames.has(fullName)) continue;
        usedNames.add(fullName);

        // Skill removed from gameplay (will be replaced later). The
        // column is NOT NULL on executive_pool, so we still write a
        // neutral placeholder of 50 to satisfy the constraint. No
        // game code reads this value anymore.
        var age = randInt(28, 62);
        var contractYears = randInt(2, 7);
        var annualSalary = calculateCompensation();
        var specializations = pickRandom(ROLE_GROUPS);

        pool.push({
            nation_id: nationId,
            first_name: firstName,
            last_name: lastName,
            age: age,
            origin_nation: origin.origin,
            skill: 50,
            specializations: specializations,
            required_salary: annualSalary,
            required_years: contractYears,
            status: 'available',
        });
    }

    return pool;
}

// ═══════════════════════════════════════════════════
// CEO SEEDING
// ═══════════════════════════════════════════════════

/**
 * Create the CEO executive record from existing faction leader data.
 * Called at corp creation time.
 *
 * @param {string} factionId - the corporation's faction ID
 * @param {string} firstName - leader_first_name from factions table
 * @param {string} lastName - leader_last_name from factions table
 * @param {number} age - leader_age from factions table
 * @param {string} nationName - nation name for origin label
 * @param {number} currentTick - tick when the corp was created
 * @returns {Object} row ready for Supabase insert into corp_executives
 */
export function createCEORecord(factionId, firstName, lastName, age, nationName, currentTick) {
    var contractYears = randInt(2, 5);
    var annualSalary = calculateCompensation();

    return {
        faction_id: factionId,
        role: 'CEO',
        first_name: firstName,
        last_name: lastName,
        age: age,
        origin_nation: nationName,
        skill: 50, // Neutral placeholder — column is NOT NULL but unused.
        salary_per_year: annualSalary,
        contract_years: contractYears,
        contract_start_tick: currentTick,
        contract_end_tick: currentTick + (contractYears * 12), // ~12 ticks per year
        status: 'active',
    };
}

