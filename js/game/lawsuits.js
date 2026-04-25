/**
 * lawsuits.js — File Lawsuit logic.
 *
 * Handles:
 *   - Corruption growth calculation
 *   - Tier determination
 *   - Milestone event generation (pre-generated at filing time)
 *   - Resolution effects lookup
 */

// ═══════════════════════════════════════════════════
// TARGETS (ministries)
// ═══════════════════════════════════════════════════

export const LAWSUIT_TARGETS = [
    { key: 'finance', label: 'Finance', icon: '\uD83D\uDCB0' },
    { key: 'defense', label: 'Defense', icon: '\uD83D\uDEE1\uFE0F' },
    { key: 'education', label: 'Education', icon: '\uD83C\uDF93' },
    { key: 'healthcare', label: 'Health', icon: '\uD83C\uDFE5' },
    { key: 'interior', label: 'Interior', icon: '\uD83C\uDFDB\uFE0F' },
    { key: 'foreign', label: 'Foreign', icon: '\uD83C\uDF10' },
    { key: 'justice', label: 'Justice', icon: '\u2696\uFE0F' },
    { key: 'labor', label: 'Labor', icon: '\uD83D\uDD28' },
    { key: 'trade', label: 'Trade', icon: '\uD83D\uDCE6' },
    { key: 'energy', label: 'Energy', icon: '\u26A1' },
    { key: 'transportation', label: 'Transport', icon: '\uD83D\uDE82' },
    { key: 'agriculture', label: 'Agriculture', icon: '\uD83C\uDF3E' },
];

// ═══════════════════════════════════════════════════
// BASIS OPTIONS (flavor only — no mechanical effect)
// ═══════════════════════════════════════════════════

export const LAWSUIT_BASES = [
    { key: 'misuse_of_funds', label: 'Misuse of Public Funds', desc: 'Alleging budget went somewhere it shouldn\'t.' },
    { key: 'civil_rights', label: 'Violation of Civil Rights', desc: 'Alleging government overreach or suppression.' },
    { key: 'negligence', label: 'Breach of Duty / Negligence', desc: 'Alleging a ministry failed its mandate.' },
    { key: 'corruption', label: 'Corruption / Self-Dealing', desc: 'Alleging officials enriched themselves.' },
];

// ═══════════════════════════════════════════════════
// TIER CALCULATION
// ═══════════════════════════════════════════════════

/**
 * Calculate corruption growth tier from delta.
 * @param {number} growth — corruption at filing minus corruption at inauguration
 * @returns {{ tier: number, label: string, color: string }}
 */
export function calculateTier(growth) {
    if (growth <= 5)  return { tier: 1, label: 'Clean Government', color: '#c55' };
    if (growth <= 10) return { tier: 2, label: 'Minor Corruption', color: '#ca5' };
    if (growth <= 20) return { tier: 3, label: 'Significant Corruption', color: '#c84' };
    return                     { tier: 4, label: 'Systemic Corruption', color: '#5cc55c' };
}

// ═══════════════════════════════════════════════════
// RESOLUTION EFFECTS
// ═══════════════════════════════════════════════════

export const TIER_EFFECTS = {
    1: {
        resolution: 'FRIVOLOUS SUIT',
        filer: { momentum: -5, governance: -2 },
        gov: { momentum: 3, governance: 1 },
    },
    2: {
        resolution: 'PARTIAL WIN',
        filer: { momentum: 3, governance: 0 },
        gov: { momentum: -2, governance: -2 },
    },
    3: {
        resolution: 'MAJOR WIN',
        filer: { momentum: 7, governance: 2 },
        gov: { momentum: -5, governance: -5 },
    },
    4: {
        resolution: 'DEVASTATING WIN',
        filer: { momentum: 12, governance: 5 },
        gov: { momentum: -10, governance: -8 },
    },
};

// ═══════════════════════════════════════════════════
// MILESTONE HEADLINES (per tier × per event type)
// ═══════════════════════════════════════════════════

const HEADLINES = {
    1: {
        filing:    '{party} files lawsuit against {ministry} alleging {basis}.',
        discovery: 'Lawsuit discovery phase produces routine documents. No irregularities found in {ministry}.',
        evidence:  'Legal team reviews {ministry} records. Auditors confirm standard procedures.',
        pre_trial: 'Judge signals skepticism toward {party}\'s claims. Case appears thin.',
        resolution: '{ministry} lawsuit dismissed. Courts find no evidence of wrongdoing. {party} criticized for wasting court resources.',
    },
    2: {
        filing:    '{party} files lawsuit against {ministry} alleging {basis}.',
        discovery: '{party}\'s lawsuit uncovers irregular procurement contracts in {ministry}.',
        evidence:  'Documents reveal {ministry} awarded no-bid contracts to connected firms.',
        pre_trial: 'Judge allows case to proceed. {ministry} officials ordered to testify.',
        resolution: '{ministry} lawsuit concludes with partial ruling. Irregular contracts confirmed but no criminal charges filed.',
    },
    3: {
        filing:    '{party} files lawsuit against {ministry} alleging {basis}.',
        discovery: '{party}\'s lawsuit exposes hidden accounts linked to {ministry} officials.',
        evidence:  'Leaked documents show systematic overbilling in {ministry}. Millions unaccounted for.',
        pre_trial: 'Multiple {ministry} officials refuse to testify. Judge threatens contempt.',
        resolution: '{ministry} scandal confirmed. Court finds evidence of systematic corruption. {party} vindicated.',
    },
    4: {
        filing:    '{party} files lawsuit against {ministry} alleging {basis}.',
        discovery: '{party}\'s lawsuit reveals {ministry} ran parallel budget invisible to parliament.',
        evidence:  'Court-ordered audit exposes network of shell companies receiving {ministry} funds.',
        pre_trial: 'Prosecutors request criminal referral. Multiple {ministry} officials implicated.',
        resolution: 'Devastating verdict: {ministry} operated criminal enterprise. Officials face prosecution. Government in crisis.',
    },
};

/**
 * Generate a headline string with template substitution.
 */
function fillTemplate(template, vars) {
    var result = template;
    for (var key in vars) {
        result = result.split('{' + key + '}').join(vars[key]);
    }
    return result;
}

// ═══════════════════════════════════════════════════
// FILE LAWSUIT — MAIN FUNCTION
// ═══════════════════════════════════════════════════

/**
 * File a lawsuit. Calculates tier, creates lawsuit row, pre-generates milestone events.
 *
 * @param {object} supabase
 * @param {object} params — { factionId, nationId, agitatorId, targetMinistry, basis, currentTick, partyName, administration }
 * @returns {Promise<{success: boolean, lawsuit: object|null, tier: number, error: string|null}>}
 */
export async function fileLawsuit(supabase, params) {
    var { factionId, nationId, agitatorId, targetMinistry, basis, currentTick, partyName, administration } = params;

    // Calculate metric growth based on legal basis
    // civil_rights: uses freedom_index DECLINE (lower freedom = stronger case)
    // all others: uses corruption GROWTH (higher corruption = stronger case)
    var metricAtStart, metricNow, growth;

    if (basis === 'civil_rights') {
        // Freedom index: decline is bad for government, good for lawsuit
        var freedomAtStart = Number(administration?.stats_at_start?.freedom_index ?? 50);
        var { data: nationRow, error: nationErr } = await supabase
            .from('nations')
            .select('freedom_index')
            .eq('id', nationId)
            .single();
        if (nationErr) {
            return { success: false, lawsuit: null, tier: 0, error: 'Failed to fetch freedom index data.' };
        }
        metricNow = Number(nationRow?.freedom_index ?? 50);
        metricAtStart = freedomAtStart;
        // Growth = how much freedom DECLINED (positive = freedom dropped = stronger case)
        growth = Math.max(0, metricAtStart - metricNow);
    } else {
        // Corruption: growth is bad for government, good for lawsuit
        var corruptionAtStart = Number(administration?.stats_at_start?.corruption ?? 50);
        var { data: nationRow, error: nationErr } = await supabase
            .from('nations')
            .select('corruption')
            .eq('id', nationId)
            .single();
        if (nationErr) {
            return { success: false, lawsuit: null, tier: 0, error: 'Failed to fetch corruption data.' };
        }
        metricNow = Number(nationRow?.corruption ?? 50);
        metricAtStart = corruptionAtStart;
        growth = Math.max(0, metricNow - metricAtStart);
    }

    var corruptionAtStart = metricAtStart; // for DB storage compatibility
    var corruptionNow = metricNow;
    var tierInfo = calculateTier(growth);
    var effects = TIER_EFFECTS[tierInfo.tier];
    var resolvesAt = currentTick + 8;

    // Find target label
    var targetDef = LAWSUIT_TARGETS.find(function(t) { return t.key === targetMinistry; });
    var ministryLabel = targetDef ? 'Ministry of ' + targetDef.label : targetMinistry;
    var basisDef = LAWSUIT_BASES.find(function(b) { return b.key === basis; });
    var basisLabel = basisDef ? basisDef.label : basis;

    // Insert lawsuit
    var { data: lawsuit, error: insertErr } = await supabase
        .from('lawsuits')
        .insert({
            faction_id: factionId,
            nation_id: nationId,
            agitator_id: agitatorId,
            target_ministry: targetMinistry,
            basis: basis,
            filed_at_tick: currentTick,
            resolves_at_tick: resolvesAt,
            corruption_at_start: corruptionAtStart,
            corruption_at_filing: corruptionNow,
            corruption_growth: growth,
            tier: tierInfo.tier,
            status: 'active',
            resolution: null,
            momentum_effect: effects.filer.momentum,
            governance_effect: effects.filer.governance,
            gov_momentum_effect: effects.gov.momentum,
            gov_governance_effect: effects.gov.governance,
        })
        .select('*')
        .single();

    if (insertErr) {
        return { success: false, lawsuit: null, tier: 0, error: insertErr.message };
    }

    // Pre-generate milestone events
    var templates = HEADLINES[tierInfo.tier] || HEADLINES[1];
    var vars = { party: partyName || 'Opposition', ministry: ministryLabel, basis: basisLabel };
    var events = [
        { event_tick: currentTick,     event_type: 'filing',     headline: fillTemplate(templates.filing, vars) },
        { event_tick: currentTick + 2, event_type: 'discovery',  headline: fillTemplate(templates.discovery, vars) },
        { event_tick: currentTick + 5, event_type: 'evidence',   headline: fillTemplate(templates.evidence, vars) },
        { event_tick: currentTick + 7, event_type: 'pre_trial',  headline: fillTemplate(templates.pre_trial, vars) },
        { event_tick: resolvesAt,      event_type: 'resolution', headline: fillTemplate(templates.resolution, vars) },
    ];

    var eventRows = events.map(function(e) {
        return {
            lawsuit_id: lawsuit.id,
            nation_id: nationId,
            event_tick: e.event_tick,
            event_type: e.event_type,
            headline: e.headline,
            is_fired: e.event_tick === currentTick, // filing event fires immediately
        };
    });

    var { error: eventsErr } = await supabase.from('lawsuit_events').insert(eventRows);
    if (eventsErr) {
        console.error('[Lawsuits] Failed to insert milestone events:', eventsErr.message);
    }

    // Surface the filing into event_log so it hits the Political / Nation
    // feeds immediately. Later milestones (discovery, evidence, pre_trial,
    // resolution) are flushed by resolveLawsuits each tick as they mature.
    var { error: logErr } = await supabase.from('event_log').insert({
        nation_id: nationId,
        event_name: 'LAWSUIT FILED',
        event_type: 'lawsuit',
        category: 'political',
        description_chosen: events[0].headline,
        fired_at_tick: currentTick,
        faction_id: factionId || null,
        effects_applied: { lawsuit_id: lawsuit.id, tier: tierInfo.tier, target_ministry: ministryLabel, basis: basisLabel, milestone: 'filing' },
    });
    if (logErr) console.warn('[Lawsuits] event_log insert (filing) failed:', logErr.message);

    return { success: true, lawsuit: lawsuit, tier: tierInfo.tier, error: null };
}

/**
 * Fetch active lawsuits for a faction.
 */
export async function fetchActiveLawsuits(supabase, factionId) {
    var { data, error } = await supabase
        .from('lawsuits')
        .select('*')
        .eq('faction_id', factionId)
        .order('filed_at_tick', { ascending: false })
        .limit(10);

    if (error) {
        console.error('[Lawsuits] Failed to fetch lawsuits:', error.message);
        return [];
    }
    return data || [];
}

// ═══════════════════════════════════════════════════
// LAWSUIT RESOLUTION (tick processor)
// ═══════════════════════════════════════════════════

/**
 * Resolve lawsuits that have reached their resolution tick.
 * Called per-nation from the tick processor.
 *
 * Applies momentum effects via adjust_momentum RPC.
 * Marks lawsuit as resolved.
 *
 * @param {object} supabase
 * @param {string} nationId
 * @param {number} currentTick
 * @param {string|null} govPmPartyId — PM's party faction ID (for applying gov effects)
 * @returns {Promise<Array>} resolved lawsuits
 */
export async function resolveLawsuits(supabase, nationId, currentTick, govPmPartyId) {
    // Flush any matured lawsuit milestones (discovery, evidence, pre_trial,
    // resolution) into event_log so the Political / Nation feeds see them.
    // The filing event is written directly by fileLawsuit; everything after
    // rides this single per-nation-per-tick pass.
    var { data: dueEvents, error: dueErr } = await supabase
        .from('lawsuit_events')
        .select('id, lawsuit_id, event_type, headline, event_tick')
        .eq('nation_id', nationId)
        .eq('is_fired', false)
        .lte('event_tick', currentTick);
    if (dueErr) console.warn('[Lawsuits] milestone flush read failed:', dueErr.message);

    for (var d = 0; d < (dueEvents || []).length; d++) {
        var ev = dueEvents[d];
        // Flip is_fired FIRST. If the event_log insert then fails, we lose
        // one event (warn-logged) but can't double-post on the next tick's
        // retry. A flipped-but-not-posted event is strictly better than a
        // posted-but-not-flipped one.
        var { error: flipErr } = await supabase.from('lawsuit_events')
            .update({ is_fired: true })
            .eq('id', ev.id);
        if (flipErr) {
            console.warn('[Lawsuits] is_fired flip failed for ' + ev.event_type + ':', flipErr.message);
            continue;
        }
        var { error: logErr } = await supabase.from('event_log').insert({
            nation_id: nationId,
            event_name: 'LAWSUIT — ' + ev.event_type.replace(/_/g, ' ').toUpperCase(),
            event_type: 'lawsuit',
            category: 'political',
            description_chosen: ev.headline,
            fired_at_tick: ev.event_tick,
            effects_applied: { lawsuit_id: ev.lawsuit_id, milestone: ev.event_type },
        });
        if (logErr) console.warn('[Lawsuits] event_log insert (' + ev.event_type + ') failed:', logErr.message);
    }

    var { data: pending, error } = await supabase
        .from('lawsuits')
        .select('*')
        .eq('nation_id', nationId)
        .eq('status', 'active')
        .lte('resolves_at_tick', currentTick);

    if (error || !pending || pending.length === 0) return [];

    var results = [];

    for (var i = 0; i < pending.length; i++) {
        var ls = pending[i];
        var effects = TIER_EFFECTS[ls.tier] || TIER_EFFECTS[1];
        var resLabel = ls.tier === 1 ? 'frivolous' : ls.tier === 2 ? 'partial_win' : ls.tier === 3 ? 'major_win' : 'devastating_win';

        // Mark resolved FIRST (prevents double-fire if subsequent operations fail)
        var { error: resolveErr } = await supabase.from('lawsuits').update({
            status: 'resolved',
            resolution: resLabel,
        }).eq('id', ls.id);

        if (resolveErr) {
            console.error('[Lawsuits] Failed to mark resolved:', resolveErr.message);
            continue; // Skip momentum if we can't mark resolved — prevents double-fire
        }

        // Apply filer momentum
        if (ls.faction_id && effects.filer.momentum !== 0) {
            var { error: filerErr } = await supabase.rpc('adjust_momentum', {
                p_faction_id: ls.faction_id,
                p_delta: effects.filer.momentum,
                p_label: 'Lawsuit ' + resLabel + ': ' + ls.target_ministry,
                p_tick: currentTick,
            });
            if (filerErr) console.error('[Lawsuits] Filer momentum failed:', filerErr.message);
        }

        // Apply government momentum (to PM's party)
        if (govPmPartyId && effects.gov.momentum !== 0) {
            var { error: govErr } = await supabase.rpc('adjust_momentum', {
                p_faction_id: govPmPartyId,
                p_delta: effects.gov.momentum,
                p_label: 'Lawsuit ' + resLabel + ' (defendant): ' + ls.target_ministry,
                p_tick: currentTick,
            });
            if (govErr) console.error('[Lawsuits] Gov momentum failed:', govErr.message);
        }

        // Resolution event is flushed by the pending-milestones pass at the
        // top of this function — no explicit is_fired flip needed here.

        results.push({ id: ls.id, tier: ls.tier, resolution: resLabel, factionId: ls.faction_id });
    }

    return results;
}
