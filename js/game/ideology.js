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
    if (alignment >= 20) return 'aligned';
    if (alignment <= -20) return 'opposed';
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

export function calculateBillDynamicPenalty(factionIdeology, articles, basePenalty = 2, isRepealBill = false) {
    let totalPenalty = 0;

    for (const art of articles) {
        const p = art.policies || art;
        if (!p) continue;

        const ideos = (p.ideologies && Array.isArray(p.ideologies) && p.ideologies.length > 0)
            ? p.ideologies.map(i => i.toUpperCase())
            : (p.ideology ? [p.ideology.toUpperCase()] : []);

        // Repealing a policy inverts the ideology effect:
        // repealing an opposed policy is a BONUS, repealing an aligned policy is a PENALTY
        const artIsRepeal = isRepealBill || !!art.repeal_active_law_id;

        for (const tag of ideos) {
            const penalty = calculateDynamicOppositionPenalty(factionIdeology, tag, basePenalty);
            // Invert for repeals: penalty becomes bonus, bonus becomes penalty
            totalPenalty += artIsRepeal ? -penalty : penalty;
        }
    }

    return totalPenalty;
}


// REMOVED: computeIdeologyAlignment, countIdeologyRelationship, ideologyOppositionMultiplier
// (old voter bloc alignment functions — electorate engine replaces them)


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
        return { _error: true, message: error.message };
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
        .select('*, factions(id, faction_name, faction_type, nation_id)')
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
