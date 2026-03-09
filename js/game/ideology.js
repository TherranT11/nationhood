/**
 * ideology.js — Dynamic ideology system (axes, labels, alignment, DB helpers)
 * Extracted from game-common.js
 */

import { POLICY_STANCES } from './diplomacy-constants.js';

// Ideology spectrum opposites
export const IDEOLOGY_OPPOSITES = {
    'LIBERTY': 'EQUALITY',           'EQUALITY': 'LIBERTY',
    'FREEDOM': 'SECURITY',           'SECURITY': 'FREEDOM',
    'TRADITION': 'PROGRESS',         'PROGRESS': 'TRADITION',
    'GLOBALISM': 'NATIONALISM',      'NATIONALISM': 'GLOBALISM',
    'INDIVIDUALISM': 'COLLECTIVISM', 'COLLECTIVISM': 'INDIVIDUALISM'
};

// Audit: detect stances with opposed poles on the same axis
for (const [sector, stances] of Object.entries(POLICY_STANCES)) {
    for (const stance of stances) {
        if (stance.poles.length === 2 && IDEOLOGY_OPPOSITES[stance.poles[0]] === stance.poles[1]) {
            console.error(`STANCE CONFLICT: ${sector}.${stance.key} has opposed poles: ${stance.poles.join(' vs ')}`);
        }
    }
}

// ==================== DYNAMIC IDEOLOGY SYSTEM ====================

export const IDEOLOGY_AXES = [
    {
        key: 'liberty_equality',
        left: 'LIBERTY',       right: 'EQUALITY',
        leftLabel: 'Liberty',  rightLabel: 'Equality',
        leftColor: '#3b82f6',  rightColor: '#ef4444',
        description: 'Individual rights vs. collective fairness'
    },
    {
        key: 'tradition_progress',
        left: 'TRADITION',      right: 'PROGRESS',
        leftLabel: 'Tradition', rightLabel: 'Progress',
        leftColor: '#a855f7',   rightColor: '#22c55e',
        description: 'Cultural conservatism vs. social reform'
    },
    {
        key: 'security_freedom',
        left: 'SECURITY',      right: 'FREEDOM',
        leftLabel: 'Security', rightLabel: 'Freedom',
        leftColor: '#f59e0b',  rightColor: '#06b6d4',
        description: 'State protection vs. personal autonomy'
    },
    {
        key: 'globalism_nationalism',
        left: 'GLOBALISM',       right: 'NATIONALISM',
        leftLabel: 'Globalism',  rightLabel: 'Nationalism',
        leftColor: '#14b8a6',    rightColor: '#f97316',
        description: 'International integration vs. national sovereignty'
    },
    {
        key: 'individualism_collectivism',
        left: 'INDIVIDUALISM',       right: 'COLLECTIVISM',
        leftLabel: 'Individualism',  rightLabel: 'Collectivism',
        leftColor: '#eab308',        rightColor: '#ec4899',
        description: 'Personal self-reliance vs. communal structures'
    }
];

export const IDEOLOGY_TO_AXIS = {};
for (const axis of IDEOLOGY_AXES) {
    IDEOLOGY_TO_AXIS[axis.left]  = { axisKey: axis.key, direction: -1 };
    IDEOLOGY_TO_AXIS[axis.right] = { axisKey: axis.key, direction: +1 };
}


/**
 * Return an alignment CSS class ('aligned', 'opposed', 'neutral') for
 * an ideology tag relative to a faction's ideology scores.
 */
export function getIdeologyChipClass(ideologyTag, factionIdeology) {
    if (!factionIdeology) return 'neutral';
    const tag = (ideologyTag || '').toUpperCase();
    const mapping = IDEOLOGY_TO_AXIS[tag];
    if (!mapping) return 'neutral';
    const score = factionIdeology[mapping.axisKey] || 0;
    const alignment = score * mapping.direction;
    if (alignment > 10) return 'aligned';
    if (alignment < -10) return 'opposed';
    return 'neutral';
}

// ==================== IDEOLOGY LABELS ====================

export const IDEOLOGY_LABEL_THRESHOLDS = [
    { min: 0,  max: 10,  label: 'Centrist' },
    { min: 11, max: 30,  label: 'Leaning' },
    { min: 31, max: 60,  label: 'Strong' },
    { min: 61, max: 100, label: 'Radical' }
];

export function getIdeologyLabel(score, axisDef) {
    const abs = Math.abs(score);
    const threshold = IDEOLOGY_LABEL_THRESHOLDS.find(t => abs >= t.min && abs <= t.max);
    const intensityLabel = threshold ? threshold.label : 'Centrist';

    if (intensityLabel === 'Centrist') return 'Centrist';

    const sideName = score < 0 ? axisDef.leftLabel : axisDef.rightLabel;
    return `${intensityLabel} ${sideName}`;
}

export function getFullIdeologyProfile(ideologyRow) {
    return IDEOLOGY_AXES.map(axis => {
        const score = ideologyRow[axis.key] || 0;
        return {
            axisKey: axis.key,
            axisDef: axis,
            score: score,
            label: getIdeologyLabel(score, axis)
        };
    });
}


// ==================== DYNAMIC OPPOSITION PENALTY ====================

export function calculateDynamicOppositionPenalty(factionIdeology, policyIdeologyTag, basePenalty = 2) {
    const tag = policyIdeologyTag.toUpperCase();
    const mapping = IDEOLOGY_TO_AXIS[tag];
    if (!mapping) return 0;

    const factionScore = factionIdeology[mapping.axisKey] || 0;
    const policyDirection = mapping.direction;
    const oppositionScore = -policyDirection * factionScore;

    if (oppositionScore <= 0) return 0;

    const penaltyScale = oppositionScore / 100;
    return -Math.round(basePenalty * penaltyScale * 10) / 10;
}

export function calculateBillDynamicPenalty(factionIdeology, articles, basePenalty = 2) {
    let totalPenalty = 0;

    for (const art of articles) {
        const p = art.policies || art;
        if (!p) continue;

        const ideos = (p.ideologies && Array.isArray(p.ideologies) && p.ideologies.length > 0)
            ? p.ideologies.map(i => i.toUpperCase())
            : (p.ideology ? [p.ideology.toUpperCase()] : []);

        for (const tag of ideos) {
            totalPenalty += calculateDynamicOppositionPenalty(factionIdeology, tag, basePenalty);
        }
    }

    return totalPenalty;
}


// ==================== IDEOLOGY ALIGNMENT (DYNAMIC SCORES) ====================

/**
 * Compute ideology alignment (0-100) between a faction and a voter bloc
 * using the faction's dynamic axis scores.
 *
 * Returns 50 for a fully centrist party (neutral), >50 for alignment,
 * <50 for opposition. Axes are weighted by how strongly the party
 * leans on each axis, so centrist axes are naturally ignored.
 *
 * @param {object} factionIdeology - Row from faction_ideology (keys: liberty_equality, etc.)
 * @param {object} bloc - Voter bloc row with axis_* columns (0-100 scale, 50 = neutral)
 * @returns {number} 0-100 alignment score
 */
export function computeIdeologyAlignment(factionIdeology, bloc) {
    const AXIS_KEYS = [
        'liberty_equality', 'tradition_progress', 'security_freedom',
        'globalism_nationalism', 'individualism_collectivism'
    ];

    let weightedAlignment = 0;
    let totalWeight = 0;

    for (const axisKey of AXIS_KEYS) {
        const partyScore = factionIdeology[axisKey] || 0; // -100 to +100
        const blocScore = bloc['axis_' + axisKey] ?? 50;  // 0-100

        // How strongly the party leans on this axis (0 = centrist, 1 = extreme)
        const partyStrength = Math.abs(partyScore) / 100;
        if (partyStrength < 0.01) continue; // Skip negligible positions

        // Convert party score to 0-100 scale to match bloc
        const partyNorm = (partyScore + 100) / 2; // -100→0, 0→50, +100→100

        // Alignment = 1 when identical, 0 when at opposite ends
        const alignment = 1 - Math.abs(partyNorm - blocScore) / 100;

        weightedAlignment += alignment * partyStrength;
        totalWeight += partyStrength;
    }

    // If party has no strong positions, compute centrist affinity:
    // centrist parties naturally align better with moderate blocs
    // and worse with extreme blocs on any axis.
    if (totalWeight === 0) {
        let centristAlignment = 0;
        for (const axisKey of AXIS_KEYS) {
            const blocScore = bloc['axis_' + axisKey] ?? 50;
            // Distance from center (50): extreme blocs score lower
            const distFromCenter = Math.abs(blocScore - 50) / 50; // 0 to 1
            centristAlignment += (1 - distFromCenter);
        }
        // Average across axes, scale to 30-70 range (centrist shouldn't be extreme)
        return 30 + (centristAlignment / AXIS_KEYS.length) * 40;
    }
    return (weightedAlignment / totalWeight) * 100;
}


// ==================== IDEOLOGY OPPOSITION PENALTY ====================

/**
 * Count ideology oppositions and alignments between a faction and a voter bloc.
 *
 * For each axis, if the party leans strongly enough (|score| >= 20) AND the
 * bloc also leans strongly enough (|score − 50| >= 10), they are compared:
 *   - Same side → aligned
 *   - Opposite sides → opposed
 *
 * @param {object} factionIdeology - Row from faction_ideology (axis keys: -100 to +100)
 * @param {object} bloc - Voter bloc row with axis_* columns (0-100 scale, 50 = neutral)
 * @returns {{ opposed: number, aligned: number }}
 */
export function countIdeologyRelationship(factionIdeology, bloc) {
    const PARTY_THRESHOLD = 20;  // Party must lean at least ±20 to count
    const BLOC_THRESHOLD  = 10;  // Bloc must deviate at least 10 from neutral (50)

    let opposed = 0;
    let aligned = 0;

    for (const axis of IDEOLOGY_AXES) {
        const partyScore = factionIdeology[axis.key] || 0;   // -100 to +100
        const blocScore  = bloc['axis_' + axis.key] ?? 50;   // 0-100

        if (Math.abs(partyScore) < PARTY_THRESHOLD) continue;
        if (Math.abs(blocScore - 50) < BLOC_THRESHOLD) continue;

        const partySide = partyScore < 0 ? 'left' : 'right';
        const blocSide  = blocScore  < 50 ? 'left' : 'right';

        if (partySide === blocSide) {
            aligned++;
        } else {
            opposed++;
        }
    }

    return { opposed, aligned };
}

/**
 * Ideology opposition penalty multiplier for preference_score.
 *
 * - 2+ opposing ideologies → 0.70 (-30%)
 * - 1 opposing ideology    → 0.80 (-20%)
 * - 0 opposing, 0 aligned  → 0.90 (-10%)
 * - At least 1 aligned, 0 opposing → 1.0 (no penalty)
 *
 * @param {object} factionIdeology - Row from faction_ideology
 * @param {object} bloc - Voter bloc row with axis_* columns
 * @returns {number} Multiplier (0.70–1.0)
 */
export function ideologyOppositionMultiplier(factionIdeology, bloc) {
    const { opposed, aligned } = countIdeologyRelationship(factionIdeology, bloc);

    if (opposed >= 2) return 0.70;
    if (opposed === 1) return 0.80;
    // Only penalize if the party actually has positions but none align.
    // A fully centrist party (no strong positions) should not be penalized —
    // they just don't benefit from alignment bonuses.
    if (aligned === 0) {
        // Check if the party has ANY strong position (|score| >= 20)
        const hasPosition = IDEOLOGY_AXES.some(ax =>
            Math.abs(factionIdeology[ax.key] || 0) >= 20
        );
        return hasPosition ? 0.90 : 1.0;
    }
    return 1.0;
}


// ==================== IDEOLOGY DATABASE HELPERS ====================

export async function loadFactionIdeology(supabase, factionId) {
    const cacheKey = 'faction_ideo_' + factionId;
    if (typeof qCache === 'function') {
        const cached = qCache(cacheKey);
        if (cached) return cached;
    }
    const { data, error } = await supabase
        .from('faction_ideology')
        .select('*')
        .eq('faction_id', factionId)
        .maybeSingle();

    if (error) {
        console.error('Error loading faction ideology:', error);
        return null;
    }
    if (data && typeof qCacheSet === 'function') qCacheSet(cacheKey, data, 2 * 60 * 1000);
    return data;
}

export async function loadNationIdeologies(supabase, nationId) {
    const cacheKey = 'nation_ideos_' + nationId;
    if (typeof qCache === 'function') {
        const cached = qCache(cacheKey);
        if (cached) return cached;
    }
    const { data: factions } = await supabase
        .from('factions')
        .select('id')
        .eq('nation_id', nationId)
        .eq('faction_type', 'party');

    if (!factions || factions.length === 0) return [];

    const factionIds = factions.map(f => f.id);
    const { data, error } = await supabase
        .from('faction_ideology')
        .select('*, factions(id, faction_name, faction_type, is_npc, nation_id)')
        .in('faction_id', factionIds);

    if (error) {
        console.error('Error loading nation ideologies:', error);
        return [];
    }
    const result = data || [];
    if (result.length && typeof qCacheSet === 'function') qCacheSet(cacheKey, result, 2 * 60 * 1000);
    return result;
}

export function extractAxisScores(ideologyRow) {
    const scores = {};
    for (const axis of IDEOLOGY_AXES) {
        scores[axis.key] = ideologyRow[axis.key] || 0;
    }
    return scores;
}
