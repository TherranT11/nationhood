/**
 * corp-executives.js — Executive pool generation and CEO seeding
 *
 * Generates a persistent pool of 15-20 hireable executives per nation,
 * with names drawn from all nation name pools. Each candidate has a
 * skill tier (1..5), required compensation, and contract length.
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

var HIREABLE_ROLES = ['CFO', 'COO', 'CTO', 'CMO', 'CLO', 'Lobbyist'];

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
// SKILL TIERS + COMPENSATION TABLES
// ═══════════════════════════════════════════════════

/**
 * Normalize any historical skill representation to tier 1..5.
 * - New model: values 1..5 are preserved.
 * - Legacy 0..100 values are bucketed into 1..5 for compatibility.
 *
 * @param {number} rawSkill
 * @returns {number} tier 1..5
 */
export function normalizeSkillTier(rawSkill) {
    var n = Number(rawSkill);
    if (!Number.isFinite(n)) return 1;
    if (n >= 1 && n <= 5) return Math.round(n);
    // Legacy 0..100 skill → 5 buckets
    var clamped = Math.max(0, Math.min(100, n));
    return Math.min(5, Math.max(1, Math.ceil(clamped / 20)));
}

var SKILL_TIER_MULTIPLIER = {
    1: 1.35,
    2: 1.15,
    3: 1.00,
    4: 0.85,
    5: 0.72,
};

var COMPENSATION_BY_TIER = {
    initial: {
        1: { annualSalary: 1600000, contractYears: [2, 3] },
        2: { annualSalary: 2600000, contractYears: [2, 4] },
        3: { annualSalary: 4300000, contractYears: [3, 5] },
        4: { annualSalary: 6800000, contractYears: [4, 6] },
        5: { annualSalary: 10200000, contractYears: [5, 7] },
    },
    renewal: {
        1: { annualSalary: 1900000, contractYears: [1, 2] },
        2: { annualSalary: 3100000, contractYears: [2, 3] },
        3: { annualSalary: 5000000, contractYears: [2, 4] },
        4: { annualSalary: 7900000, contractYears: [3, 5] },
        5: { annualSalary: 11800000, contractYears: [3, 6] },
    },
};

/**
 * Converts skill tier to action cost/effect multiplier.
 * Lower is better (reduced cost / reduced downside).
 *
 * @param {number} skillTier - 1..5
 * @returns {number}
 */
export function skillTierToMultiplier(skillTier) {
    var tier = normalizeSkillTier(skillTier);
    return SKILL_TIER_MULTIPLIER[tier] || 1;
}

/**
 * Contract terms keyed by tier and market type (initial/renewal).
 *
 * @param {number} skillTier - 1..5
 * @param {'initial'|'renewal'} kind
 * @returns {{annualSalary:number, contractYears:number, totalCompensation:number}}
 */
export function calculateCompensation(skillTier, kind) {
    var tier = normalizeSkillTier(skillTier);
    var mode = kind === 'renewal' ? 'renewal' : 'initial';
    var def = COMPENSATION_BY_TIER[mode][tier] || COMPENSATION_BY_TIER.initial[3];
    var years = randInt(def.contractYears[0], def.contractYears[1]);
    var salary = def.annualSalary;
    return {
        annualSalary: salary,
        contractYears: years,
        totalCompensation: salary * years,
    };
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
 * Creates 18 candidates with diverse origins, tiered skills, and roles.
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

        var skill = randInt(1, 5);
        var age = randInt(28, 62);
        var comp = calculateCompensation(skill, 'initial');
        var specializations = pickRandom(ROLE_GROUPS);

        pool.push({
            nation_id: nationId,
            first_name: firstName,
            last_name: lastName,
            age: age,
            origin_nation: origin.origin,
            skill: skill,
            specializations: specializations,
            required_salary: comp.annualSalary,
            required_years: comp.contractYears,
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
    var skill = randInt(2, 3); // conservative founder profile by default
    var comp = calculateCompensation(skill, 'initial');

    return {
        faction_id: factionId,
        role: 'CEO',
        first_name: firstName,
        last_name: lastName,
        age: age,
        origin_nation: nationName,
        skill: skill,
        salary_per_year: comp.annualSalary,
        contract_years: comp.contractYears,
        contract_start_tick: currentTick,
        contract_end_tick: currentTick + (comp.contractYears * 12), // ~12 ticks per year
        status: 'active',
    };
}
