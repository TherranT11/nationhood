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
import { isAbsoluteMonarchy, hasElectedPresident } from './government-types.js';

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
    var cost = 120000 + t * 280000;          // $120k to $400k, linear
    return Math.round(cost / 25000) * 25000; // round to nearest $25k
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
    var firstNames = names.firstNames || [];
    var lastNames = names.lastNames || [];
    if (firstNames.length === 0 || lastNames.length === 0) return [];

    // Shuffle backgrounds for no-replacement sampling
    var shuffledBgs = BACKGROUNDS.slice().sort(function() { return Math.random() - 0.5; });

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
        var background = shuffledBgs[i % shuffledBgs.length];
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
/**
 * Determines a party's political role relative to the current government.
 * Single source of truth for GOVERNING / OPPOSITION / LOYAL / DISSIDENT
 * labels across every UI that shows party status.
 *
 * Rules:
 *   Parliamentary Democracy : in coalition OR PM party → GOVERNING
 *   Presidential Republic   : president's party OR holds an active
 *                             cabinet ministry → GOVERNING
 *   Semi-Presidential       : any of the above → GOVERNING
 *   Absolute Monarchy       : party seats >= 1 → LOYAL, else DISSIDENT
 *
 * Return shape preserves `isOpposition` and `administration` for
 * backward compatibility with existing callers; adds `isGoverning`
 * and `label`.
 */
export async function getGoverningStatus(supabase, nationId, factionId) {
    var { data: nation } = await supabase
        .from('nations')
        .select('government_type')
        .eq('id', nationId)
        .maybeSingle();

    // Absolute Monarchy: seats-only gate, no admin row required.
    if (isAbsoluteMonarchy(nation)) {
        var { data: faction } = await supabase
            .from('factions')
            .select('seats')
            .eq('id', factionId)
            .maybeSingle();
        return computeGoverningFromInputs({
            partyId: factionId,
            partySeats: faction?.seats,
            admin: null,
            ministryHolder: false,
            nation,
        });
    }

    // Active administration — single source for coalition / PM / president.
    var { data: admin, error } = await supabase
        .from('administrations')
        .select('id, coalition_parties, stats_at_start, started_at_tick, pm_party_id, president_party_id')
        .eq('nation_id', nationId)
        .is('ended_at_tick', null)
        .order('started_at_tick', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error('[Agitator] Failed to check governing status:', error.message);
        return { isGoverning: false, isOpposition: true, label: 'OPPOSITION', administration: null };
    }

    // Presidential / Semi-Presidential also need a cabinet-held check.
    var ministryHolder = false;
    if (hasElectedPresident(nation)) {
        var { count } = await supabase
            .from('ministries')
            .select('*', { count: 'exact', head: true })
            .eq('nation_id', nationId)
            .eq('party_id', factionId)
            .eq('is_active', true);
        ministryHolder = (count || 0) > 0;
    }

    return computeGoverningFromInputs({
        partyId: factionId,
        partySeats: null,
        admin,
        ministryHolder,
        nation,
    });
}

/**
 * Synchronous variant for render loops that already have admin + ministry
 * data loaded. Shares `computeGoverningFromInputs` with the async version
 * so the rules only live in one place.
 *
 * @param {object} party             must have id, seats
 * @param {object|null} admin        active administrations row (or null)
 * @param {Set<string>} ministryPartyIds  party ids holding an active ministry
 * @param {object} nation            must have government_type
 */
export function getGoverningStatusFor(party, admin, ministryPartyIds, nation) {
    return computeGoverningFromInputs({
        partyId: party?.id,
        partySeats: party?.seats,
        admin,
        ministryHolder: ministryPartyIds ? ministryPartyIds.has(party?.id) : false,
        nation,
    });
}

// Rule implementation shared by both getGoverningStatus (async DB fetch)
// and getGoverningStatusFor (sync pre-loaded data). Single source of truth
// for who counts as "governing" — do not duplicate this logic elsewhere.
function computeGoverningFromInputs({ partyId, partySeats, admin, ministryHolder, nation }) {
    if (isAbsoluteMonarchy(nation)) {
        var monarchyGoverning = Number(partySeats || 0) >= 1;
        return {
            isGoverning: monarchyGoverning,
            isOpposition: !monarchyGoverning,
            label: monarchyGoverning ? 'LOYAL' : 'DISSIDENT',
            administration: null,
        };
    }
    if (!admin) {
        return { isGoverning: false, isOpposition: true, label: 'OPPOSITION', administration: null };
    }
    var coalitionParties = Array.isArray(admin.coalition_parties) ? admin.coalition_parties : [];
    var inCoalition = coalitionParties.some(function(entry) {
        if (!entry) return false;
        if (typeof entry === 'string') return entry === partyId;
        if (typeof entry === 'object') return (entry.party_id || entry.id) === partyId;
        return false;
    });
    var isPM = admin.pm_party_id === partyId;
    var isPresidentsParty = admin.president_party_id === partyId;
    var isGoverning = isPM || inCoalition || isPresidentsParty
        || (hasElectedPresident(nation) && !!ministryHolder);
    return {
        isGoverning,
        isOpposition: !isGoverning,
        label: isGoverning ? 'GOVERNING' : 'OPPOSITION',
        administration: admin,
    };
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
    var { error: poolErr } = await supabase
        .from('agitator_pool')
        .update({ status: 'hired', hired_by_faction_id: factionId })
        .eq('id', candidate.id);

    if (poolErr) console.error('[Agitator] Failed to mark pool candidate as hired:', poolErr.message);

    return { success: true, agitator: agitator, error: null };
}
