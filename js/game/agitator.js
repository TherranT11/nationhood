/**
 * agitator.js — Agitator (Opposition Coordinator) system.
 *
 * Handles:
 *   - Agitator pool generation (5-7 candidates per nation)
 *   - Hire cost calculation from skill
 *   - Opposition status check
 *   - Agitator data fetching
 */

import { getNationNames } from './political-actions.js';

// ═══════════════════════════════════════════════════
// AGITATOR BACKGROUNDS (flavor text)
// ═══════════════════════════════════════════════════

const BACKGROUNDS = [
    'Former union organizer. Knows how to mobilize a crowd.',
    'Disbarred attorney. Understands the legal system from the inside.',
    'Investigative journalist. Uncovered three government scandals before going private.',
    'Ex-military intelligence. Trained in information warfare.',
    'Community activist. Built grassroots networks across two provinces.',
    'Former government auditor. Knows where the money hides.',
    'Political science professor. Publishes on institutional corruption.',
    'NGO director. Ran anti-corruption campaigns across the continent.',
    'Former prosecutor. Left the justice ministry over political interference.',
    'Labor rights campaigner. Organized the dockworkers\' strike of 2014.',
    'Freelance political consultant. Has worked for opposition parties in three nations.',
    'Student movement leader. Led the university protests. Young and fearless.',
    'Retired diplomat. Leverages international connections for domestic pressure.',
    'Whistleblower advocate. Runs a secure tip line used by civil servants.',
    'Former police detective. Turned against the system after a cover-up.',
];

// ═══════════════════════════════════════════════════
// SKILL ASSESSMENT LABELS
// ═══════════════════════════════════════════════════

export function getSkillLabel(skill) {
    if (skill >= 75) return { label: 'Exceptional', color: '#5cc55c', desc: 'Elite operative. Lawsuits are devastating, intelligence is razor-sharp.' };
    if (skill >= 60) return { label: 'Strong', color: '#a3b07e', desc: 'Experienced and reliable. Can handle most opposition tasks effectively.' };
    if (skill >= 45) return { label: 'Competent', color: '#ca5', desc: 'Gets the job done. Occasional missteps under pressure.' };
    if (skill >= 30) return { label: 'Developing', color: '#c84', desc: 'Green but eager. Results are inconsistent. Cheap to hire.' };
    return { label: 'Weak', color: '#c55', desc: 'Liability risk. May botch sensitive operations. Rock-bottom price for a reason.' };
}

// ═══════════════════════════════════════════════════
// HIRE COST FORMULA
// ═══════════════════════════════════════════════════

/**
 * Calculate one-time hire cost from skill level.
 * Range: ~$200k (skill 20) to ~$5M (skill 85).
 * Quadratic curve: top talent is disproportionately expensive.
 */
export function calculateAgitatorCost(skill) {
    var t = Math.max(0, (skill - 20)) / 65; // 0 to 1
    var curved = t * t * 0.5 + t * 0.5;     // quadratic bias
    var cost = 200000 + curved * 4800000;    // $200k to $5M
    return Math.round(cost / 50000) * 50000; // round to nearest $50k
}

// ═══════════════════════════════════════════════════
// POOL GENERATION
// ═══════════════════════════════════════════════════

function randInt(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
}

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate 5-7 agitator candidates for a nation.
 * Names come from the nation's cultural name pool.
 *
 * @param {string} nationId
 * @param {string} nationName
 * @returns {Array} rows ready for Supabase insert into agitator_pool
 */
export function generateAgitatorPool(nationId, nationName) {
    var pool = [];
    var usedNames = new Set();
    var count = randInt(5, 7);

    var names = getNationNames(nationName);
    var firstNames = names.firstNames;
    var lastNames = names.lastNames;

    for (var i = 0; i < count; i++) {
        var firstName, lastName, fullName;

        // Avoid duplicate names
        var attempts = 0;
        do {
            firstName = pickRandom(firstNames);
            lastName = pickRandom(lastNames);
            fullName = firstName + ' ' + lastName;
            attempts++;
        } while (usedNames.has(fullName) && attempts < 20);
        usedNames.add(fullName);

        var skill = randInt(20, 85);
        var age = randInt(25, 60);
        var background = pickRandom(BACKGROUNDS);
        var hireCost = calculateAgitatorCost(skill);

        pool.push({
            nation_id: nationId,
            first_name: firstName,
            last_name: lastName,
            age: age,
            skill: skill,
            background: background,
            hire_cost: hireCost,
            status: 'available',
        });
    }

    // Sort by skill descending
    pool.sort(function(a, b) { return b.skill - a.skill; });

    return pool;
}

// ═══════════════════════════════════════════════════
// OPPOSITION CHECK
// ═══════════════════════════════════════════════════

/**
 * Determine if a faction is in opposition (not in the current governing coalition).
 * Queries the active administration's coalition_parties array.
 *
 * @param {object} supabase
 * @param {string} nationId
 * @param {string} factionId
 * @returns {Promise<{isOpposition: boolean, administration: object|null}>}
 */
export async function checkOppositionStatus(supabase, nationId, factionId) {
    var { data: admin, error } = await supabase
        .from('administrations')
        .select('id, coalition_parties, stats_at_start, started_at_tick, pm_party_id')
        .eq('nation_id', nationId)
        .is('ended_at_tick', null)
        .order('started_at_tick', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error('[Agitator] Failed to check opposition status:', error.message);
        return { isOpposition: false, administration: null };
    }

    if (!admin) {
        // No active administration — caretaker/transitional state, treat as opposition
        return { isOpposition: true, administration: null };
    }

    // Check if faction is in the coalition
    var coalitionParties = admin.coalition_parties || [];
    var inCoalition = coalitionParties.some(function(p) {
        return p.party_id === factionId;
    });

    return { isOpposition: !inCoalition, administration: admin };
}

// ═══════════════════════════════════════════════════
// DATA FETCHING
// ═══════════════════════════════════════════════════

/**
 * Fetch the faction's active agitator (if any).
 *
 * @param {object} supabase
 * @param {string} factionId
 * @returns {Promise<object|null>}
 */
export async function fetchActiveAgitator(supabase, factionId) {
    var { data, error } = await supabase
        .from('faction_agitators')
        .select('*')
        .eq('faction_id', factionId)
        .eq('status', 'active')
        .maybeSingle();

    if (error) {
        console.error('[Agitator] Failed to fetch agitator:', error.message);
        return null;
    }
    return data;
}

/**
 * Fetch or generate the agitator pool for a nation.
 * If no pool exists, generates 5-7 candidates and inserts them.
 *
 * @param {object} supabase
 * @param {string} nationId
 * @param {string} nationName
 * @returns {Promise<Array>} available candidates
 */
export async function fetchOrGeneratePool(supabase, nationId, nationName) {
    // Check for existing available candidates
    var { data: existing, error } = await supabase
        .from('agitator_pool')
        .select('*')
        .eq('nation_id', nationId)
        .eq('status', 'available')
        .order('skill', { ascending: false });

    if (error) {
        console.error('[Agitator] Failed to fetch pool:', error.message);
        return [];
    }

    if (existing && existing.length > 0) return existing;

    // Generate new pool
    var pool = generateAgitatorPool(nationId, nationName);
    var { data: inserted, error: insertErr } = await supabase
        .from('agitator_pool')
        .insert(pool)
        .select('*');

    if (insertErr) {
        console.error('[Agitator] Failed to insert pool:', insertErr.message);
        return [];
    }

    return (inserted || []).sort(function(a, b) { return b.skill - a.skill; });
}

/**
 * Hire an agitator from the pool.
 *
 * @param {object} supabase
 * @param {string} factionId
 * @param {object} candidate — agitator_pool row
 * @param {number} currentTick
 * @returns {Promise<{success: boolean, agitator: object|null, error: string|null}>}
 */
export async function hireAgitator(supabase, factionId, candidate, currentTick) {
    // Check if faction already has an active agitator
    var existing = await fetchActiveAgitator(supabase, factionId);
    if (existing) {
        return { success: false, agitator: null, error: 'You already have an active agitator.' };
    }

    // Insert into faction_agitators
    var { data: agitator, error: insertErr } = await supabase
        .from('faction_agitators')
        .insert({
            faction_id: factionId,
            first_name: candidate.first_name,
            last_name: candidate.last_name,
            age: candidate.age,
            skill: candidate.skill,
            background: candidate.background,
            status: 'active',
            hired_at_tick: currentTick,
        })
        .select('*')
        .single();

    if (insertErr) {
        console.error('[Agitator] Failed to hire:', insertErr.message);
        return { success: false, agitator: null, error: insertErr.message };
    }

    // Mark pool candidate as hired
    await supabase
        .from('agitator_pool')
        .update({ status: 'hired', hired_by_faction_id: factionId })
        .eq('id', candidate.id);

    return { success: true, agitator: agitator, error: null };
}
