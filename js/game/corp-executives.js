/**
 * corp-executives.js — Executive pool generation and CEO seeding
 *
 * Generates a persistent pool of 15-20 hireable executives per nation,
 * with names drawn from all nation name pools. Each candidate has a
 * skill rating, required compensation, and contract length.
 *
 * CEO is auto-seeded from existing faction leader data at corp creation.
 */

import {
    PM_FIRST_NAMES, PM_LAST_NAMES,
    AVELIA_FIRST_NAMES, AVELIA_LAST_NAMES,
    CALVETH_FIRST_NAMES, CALVETH_LAST_NAMES,
    FLANDIS_FIRST_NAMES, FLANDIS_LAST_NAMES,
    VOSTIA_FIRST_NAMES, VOSTIA_LAST_NAMES,
} from './political-actions.js';

// ═══════════════════════════════════════════════════
// NAME POOLS BY ORIGIN NATION
// ═══════════════════════════════════════════════════

var NAME_POOLS = [
    { origin: 'Melizea',      weight: 2, firstNames: PM_FIRST_NAMES,      lastNames: PM_LAST_NAMES },
    { origin: 'Sangreza',     weight: 1, firstNames: PM_FIRST_NAMES,      lastNames: PM_LAST_NAMES },
    { origin: 'Sierramar',    weight: 1, firstNames: PM_FIRST_NAMES,      lastNames: PM_LAST_NAMES },
    { origin: 'San Estrella', weight: 1, firstNames: PM_FIRST_NAMES,      lastNames: PM_LAST_NAMES },
    { origin: 'Palvera',      weight: 1, firstNames: PM_FIRST_NAMES,      lastNames: PM_LAST_NAMES },
    { origin: 'Montequilla',  weight: 1, firstNames: PM_FIRST_NAMES,      lastNames: PM_LAST_NAMES },
    { origin: 'Avelia',       weight: 2, firstNames: AVELIA_FIRST_NAMES,  lastNames: AVELIA_LAST_NAMES },
    { origin: 'Calveth',      weight: 2, firstNames: CALVETH_FIRST_NAMES, lastNames: CALVETH_LAST_NAMES },
    { origin: 'Flandis',      weight: 2, firstNames: FLANDIS_FIRST_NAMES, lastNames: FLANDIS_LAST_NAMES },
    { origin: 'Vostia',       weight: 2, firstNames: VOSTIA_FIRST_NAMES,  lastNames: VOSTIA_LAST_NAMES },
];

// ═══════════════════════════════════════════════════
// ROLE DEFINITIONS
// ═══════════════════════════════════════════════════

var EXEC_ROLES = ['CFO', 'COO', 'CTO', 'CMO', 'CLO', 'Lobbyist'];

// Which roles each candidate can fill (randomly assigned 1-3 specializations)
var ROLE_GROUPS = [
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
 * Calculate total contract value based on skill.
 * Skill 25 → ~$12M total, Skill 90 → ~$100M total.
 * Scaled exponentially so elite executives cost significantly more.
 *
 * @param {number} skill - 25 to 90
 * @returns {number} total contract value in dollars
 */
function calculateCompensation(skill) {
    // Linear interpolation from $12M (skill 25) to $100M (skill 90)
    // with slight exponential curve for top talent
    var t = (skill - 25) / 65; // 0 to 1
    var curved = t * t * 0.4 + t * 0.6; // slight exponential bias
    var total = 12000000 + curved * 88000000;
    // Round to nearest $500k
    return Math.round(total / 500000) * 500000;
}

// ═══════════════════════════════════════════════════
// POOL GENERATION
// ═══════════════════════════════════════════════════

/**
 * Pick a random origin nation using weighted selection.
 * Local nation gets a higher weight for domestic candidates.
 */
function pickOrigin(localNationName) {
    var pools = NAME_POOLS.map(function(p) {
        return { pool: p, weight: p.origin === localNationName ? p.weight * 3 : p.weight };
    });
    var totalWeight = pools.reduce(function(s, p) { return s + p.weight; }, 0);
    var r = Math.random() * totalWeight;
    for (var i = 0; i < pools.length; i++) {
        r -= pools[i].weight;
        if (r <= 0) return pools[i].pool;
    }
    return pools[pools.length - 1].pool;
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

        // Avoid duplicate names
        var attempts = 0;
        do {
            firstName = pickRandom(origin.firstNames);
            lastName = pickRandom(origin.lastNames);
            fullName = firstName + ' ' + lastName;
            attempts++;
        } while (usedNames.has(fullName) && attempts < 20);
        usedNames.add(fullName);

        var skill = randInt(25, 90);
        var age = randInt(28, 62);
        var contractYears = randInt(2, 7);
        var totalComp = calculateCompensation(skill);
        var annualSalary = Math.round(totalComp / contractYears);
        var specializations = pickRandom(ROLE_GROUPS);

        pool.push({
            nation_id: nationId,
            first_name: firstName,
            last_name: lastName,
            age: age,
            origin_nation: origin.origin,
            skill: skill,
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
    var skill = randInt(25, 45);
    var contractYears = randInt(2, 5);
    var totalComp = 25000000 + (skill - 25) * 1500000; // $25M to $55M range
    var annualSalary = Math.round(totalComp / contractYears);

    return {
        faction_id: factionId,
        role: 'CEO',
        first_name: firstName,
        last_name: lastName,
        age: age,
        origin_nation: nationName,
        skill: skill,
        salary_per_year: annualSalary,
        contract_years: contractYears,
        contract_start_tick: currentTick,
        contract_end_tick: currentTick + (contractYears * 12), // ~12 ticks per year
        status: 'active',
    };
}
