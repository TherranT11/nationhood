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
import { fetchActiveCoalition } from './government-structure.js';

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
// GOVERNING STATUS
// ═══════════════════════════════════════════════════

/**
 * Determines a party's political role relative to the current government.
 * Single source of truth for GOVERNING / OPPOSITION labels across
 * every UI that shows party status.
 *
 * Rules:
 *   Parliamentary Democracy : in coalition OR PM party → GOVERNING
 *   Presidential Republic   : president's party OR holds an active
 *                             cabinet ministry → GOVERNING
 *   Absolute Monarchy       : party owns the throne
 *                             (nations.monarch_faction_id === partyId)
 *                             → GOVERNING; everyone else → OPPOSITION.
 *                             The earlier "seats >= 1 ⇒ LOYAL" rule
 *                             classed every assembly party as part of
 *                             the government, which blocked agitator
 *                             actions for the very parties that need
 *                             them (Petition for Reform, etc.).
 *
 * Return shape preserves `isOpposition` and `administration` for
 * backward compatibility with existing callers; adds `isGoverning`
 * and `label`.
 */
export async function getGoverningStatus(supabase, nationId, factionId) {
    var { data: nation } = await supabase
        .from('nations')
        .select('government_type, monarch_faction_id')
        .eq('id', nationId)
        .maybeSingle();

    // Absolute Monarchy: monarch-only gate. The monarch's party is the
    // government; every other party (with or without seats) is opposition.
    // Seats are no longer consulted here — the previous "seats >= 1 ⇒
    // LOYAL" rule wrongly classified assembly parties as government and
    // blocked the agitator role they need to use.
    if (isAbsoluteMonarchy(nation)) {
        return computeGoverningFromInputs({
            partyId: factionId,
            admin: null,
            ministryHolder: false,
            nation,
        });
    }

    // Dual fetch: fetchActiveCoalition is the cycle-anchored canonical source
    // for "what is the current government" (reads government_formations /
    // presidents / ministries per government type). The administrations row
    // is a historical mirror that *should* agree with the coalition but in
    // practice has diverged — Dravka's active admin row had NULL pm_party_id
    // and empty coalition_parties while government_formations correctly
    // recorded TAC as PM of a 5-party coalition. If we trust the admin row
    // alone, the PM reads as opposition.
    //
    // Rather than duplicate the fetchActiveCoalition logic here or switch
    // every downstream reader (_administration.pm_party_id is referenced in
    // ~15 places), hydrate the admin row in-place from the coalition before
    // the governing check runs. Every caller of getGoverningStatus (and
    // every reader of its .administration) then sees a consistent view.
    var [coalitionResult, adminResult, hogResult, presResult] = await Promise.all([
        fetchActiveCoalition(supabase, nationId).catch(function(e) {
            console.warn('[Agitator] fetchActiveCoalition failed:', e?.message || e);
            return null;
        }),
        supabase
            .from('administrations')
            .select('id, coalition_parties, stats_at_start, started_at_tick')
            .eq('nation_id', nationId)
            .is('ended_at_tick', null)
            .order('started_at_tick', { ascending: false })
            .limit(1)
            .maybeSingle(),
        supabase
            .from('head_of_government')
            .select('faction_id')
            .eq('nation_id', nationId)
            .eq('active', true)
            .maybeSingle(),
        supabase
            .from('presidents')
            .select('faction_id')
            .eq('nation_id', nationId)
            .eq('is_active', true)
            .maybeSingle()
    ]);

    if (adminResult.error) {
        console.error('[Agitator] Failed to check governing status:', adminResult.error.message);
        return { isGoverning: false, isOpposition: true, label: 'OPPOSITION', administration: null };
    }

    var admin = adminResult.data;
    var coalition = coalitionResult;
    var presidential = hasElectedPresident(nation);
    var hogPartyId = hogResult?.data?.faction_id || null;
    var presPartyId = presResult?.data?.faction_id || null;
    var coalitionPartyObjs = Array.isArray(coalition?.party_ids)
        ? coalition.party_ids.map(function(id) { return { party_id: id }; })
        : [];

    // Identity fields come from primary tables (presidents.is_active,
    // head_of_government.active). The administrations row is a historical
    // snapshot whose pm_party_id / president_party_id columns can drift
    // from live state — we no longer SELECT them above. Coalition member
    // parties come from government_formations (canonical post-parliamentary
    // refactor) when the admin's stored snapshot is empty or stale.
    if (admin) {
        admin.pm_party_id = hogPartyId;
        admin.president_party_id = presPartyId;
        var adminCoalition = Array.isArray(admin.coalition_parties) ? admin.coalition_parties : [];
        if (adminCoalition.length === 0 && coalitionPartyObjs.length > 0) {
            admin.coalition_parties = coalitionPartyObjs;
        }
    } else if (coalition || hogPartyId || presPartyId) {
        // No admin row but live state exists — synthesize a minimal
        // admin so the governing check below sees the live truth.
        admin = {
            pm_party_id: hogPartyId,
            president_party_id: presPartyId,
            coalition_parties: coalitionPartyObjs,
        };
    }

    // Presidential also needs a cabinet-held check.
    var ministryHolder = false;
    if (presidential) {
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
 * @param {object} party             must have id
 * @param {object|null} admin        active administrations row (or null)
 * @param {Set<string>} ministryPartyIds  party ids holding an active ministry
 * @param {object} nation            must have government_type;
 *                                   for monarchies must also include
 *                                   monarch_faction_id
 */
export function getGoverningStatusFor(party, admin, ministryPartyIds, nation) {
    return computeGoverningFromInputs({
        partyId: party?.id,
        admin,
        ministryHolder: ministryPartyIds ? ministryPartyIds.has(party?.id) : false,
        nation,
    });
}

// Rule implementation shared by both getGoverningStatus (async DB fetch)
// and getGoverningStatusFor (sync pre-loaded data). Single source of truth
// for who counts as "governing" — do not duplicate this logic elsewhere.
function computeGoverningFromInputs({ partyId, admin, ministryHolder, nation }) {
    if (isAbsoluteMonarchy(nation)) {
        var monarchFactionId = nation?.monarch_faction_id || null;
        var monarchyGoverning = !!(monarchFactionId && partyId && monarchFactionId === partyId);
        return {
            isGoverning: monarchyGoverning,
            isOpposition: !monarchyGoverning,
            label: monarchyGoverning ? 'GOVERNING' : 'OPPOSITION',
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
