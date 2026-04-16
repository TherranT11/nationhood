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
// COMPENSATION FORMULA
// ═══════════════════════════════════════════════════

/**
 * Calculate annual salary based on skill.
 * Uses a 2000-bubble calibration curve:
 *   Pay (in $M) = 0.5 + 21.5 × (Skill / 95)^1.7
 *
 * Skill  5 → ~$0.6M    Skill 50 → ~$7.7M    Skill 90 → ~$20.1M
 * Skill 30 → ~$3.6M    Skill 70 → ~$12.8M   Skill 95 → ~$22.0M
 *
 * @param {number} skill - executive skill rating (typically 5–95)
 * @returns {number} annual salary in dollars
 */
export function calculateCompensation(skill) {
    var payMillions = 0.5 + 21.5 * Math.pow(skill / 95, 1.7);
    // Round to nearest $10k
    return Math.round(payMillions * 1000000 / 10000) * 10000;
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
        var annualSalary = calculateCompensation(skill);
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
    var annualSalary = calculateCompensation(skill);

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

// ═══════════════════════════════════════════════════
// INITIAL ROSTER SEEDING
// ═══════════════════════════════════════════════════

var INITIAL_NON_LOBBYIST_ROLES = ['CEO', 'CFO', 'COO', 'CTO', 'CMO', 'CLO'];

function hashString(input) {
    var hash = 0;
    var str = String(input || '');
    for (var i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

function deterministicInt(seed, min, max) {
    if (max <= min) return min;
    return min + (hashString(seed) % (max - min + 1));
}

function buildNameCatalog() {
    var first = [];
    var last = [];
    for (var i = 0; i < NAME_POOLS.length; i++) {
        var pool = NAME_POOLS[i];
        first = first.concat(pool.firstNames || []);
        last = last.concat(pool.lastNames || []);
    }
    return { first: first, last: last };
}

function selectPoolCandidateForRole(role, factionId, poolCandidates, usedNames) {
    if (!Array.isArray(poolCandidates) || !poolCandidates.length) return null;
    var eligible = poolCandidates.filter(function(candidate) {
        var specs = candidate.specializations || [];
        var fullName = (candidate.first_name || '') + ' ' + (candidate.last_name || '');
        return specs.indexOf(role) >= 0 && !usedNames.has(fullName.trim());
    });
    if (!eligible.length) return null;
    eligible.sort(function(a, b) {
        if ((b.skill || 0) !== (a.skill || 0)) return (b.skill || 0) - (a.skill || 0);
        var an = ((a.first_name || '') + ' ' + (a.last_name || '')).trim();
        var bn = ((b.first_name || '') + ' ' + (b.last_name || '')).trim();
        return an.localeCompare(bn);
    });
    var idx = deterministicInt(factionId + '|' + role + '|pool', 0, eligible.length - 1);
    return eligible[idx];
}

function generateDeterministicName(role, factionId, usedNames, catalog) {
    var attempts = 0;
    var firstName = '';
    var lastName = '';
    do {
        firstName = catalog.first[deterministicInt(factionId + '|' + role + '|first|' + attempts, 0, catalog.first.length - 1)];
        lastName = catalog.last[deterministicInt(factionId + '|' + role + '|last|' + attempts, 0, catalog.last.length - 1)];
        attempts++;
    } while (usedNames.has((firstName + ' ' + lastName).trim()) && attempts < 20);
    return { first_name: firstName, last_name: lastName };
}

/**
 * Ensure first-load executives include all core non-lobbyist roles.
 * Missing roles are deterministically seeded in one batch insert.
 *
 * @param {Object} params
 * @param {Object} params.supabase - Supabase client instance
 * @param {Object} params.faction - current corporation/faction row
 * @param {number} params.currentTick - current world tick
 * @param {Array} [params.poolCandidates] - optional executive_pool rows for role-aware names
 * @returns {Promise<{seeded:boolean, executives:Array, error?:Object}>}
 */
export async function createInitialExecutiveRoster(params) {
    var supabase = params && params.supabase;
    var faction = params && params.faction;
    var currentTick = (params && params.currentTick) || 0;
    var poolCandidates = (params && params.poolCandidates) || [];

    if (!supabase || !faction || !faction.id) {
        return { seeded: false, executives: [], error: new Error('Missing required seeding params') };
    }

    var existingRes = await supabase.from('corp_executives')
        .select('*')
        .eq('faction_id', faction.id)
        .eq('status', 'active');
    if (existingRes.error) {
        return { seeded: false, executives: [], error: existingRes.error };
    }

    var existing = existingRes.data || [];
    var existingRoles = new Set(existing.map(function(exec) { return exec.role; }));
    var missingRoles = INITIAL_NON_LOBBYIST_ROLES.filter(function(role) { return !existingRoles.has(role); });

    if (!missingRoles.length) {
        return { seeded: false, executives: existing };
    }

    var usedNames = new Set(existing.map(function(exec) {
        return ((exec.first_name || '') + ' ' + (exec.last_name || '')).trim();
    }));
    var rows = [];
    var catalog = buildNameCatalog();

    for (var i = 0; i < missingRoles.length; i++) {
        var role = missingRoles[i];
        var seedPrefix = faction.id + '|' + role;
        var contractYears = deterministicInt(seedPrefix + '|years', 2, 5);
        var skill = (role === 'CEO')
            ? deterministicInt(seedPrefix + '|skill', 25, 45)
            : deterministicInt(seedPrefix + '|skill', 25, 40);
        var annualSalary = calculateCompensation(skill);

        var firstName;
        var lastName;
        var age;
        var originNation = faction.nation || null;

        if (role === 'CEO' && faction.leader_first_name && faction.leader_last_name) {
            firstName = faction.leader_first_name;
            lastName = faction.leader_last_name;
            age = faction.leader_age || deterministicInt(seedPrefix + '|age', 42, 58);
        } else {
            var candidate = selectPoolCandidateForRole(role, faction.id, poolCandidates, usedNames);
            if (candidate) {
                firstName = candidate.first_name;
                lastName = candidate.last_name;
                age = candidate.age || deterministicInt(seedPrefix + '|age', 33, 57);
                originNation = candidate.origin_nation || originNation;
            } else {
                var generatedName = generateDeterministicName(role, faction.id, usedNames, catalog);
                firstName = generatedName.first_name;
                lastName = generatedName.last_name;
                age = deterministicInt(seedPrefix + '|age', 33, 57);
            }
        }

        usedNames.add((firstName + ' ' + lastName).trim());

        rows.push({
            faction_id: faction.id,
            role: role,
            first_name: firstName,
            last_name: lastName,
            age: age,
            origin_nation: originNation,
            skill: skill,
            salary_per_year: annualSalary,
            contract_years: contractYears,
            contract_start_tick: currentTick,
            contract_end_tick: currentTick + (contractYears * 12),
            status: 'active',
        });
    }

    var insertRes = await supabase.from('corp_executives').insert(rows);
    if (insertRes.error) {
        return { seeded: false, executives: existing, error: insertRes.error };
    }

    var refreshedRes = await supabase.from('corp_executives')
        .select('*')
        .eq('faction_id', faction.id)
        .eq('status', 'active');
    if (refreshedRes.error) {
        return { seeded: true, executives: existing.concat(rows), error: refreshedRes.error };
    }

    return { seeded: true, executives: refreshedRes.data || [] };
}
