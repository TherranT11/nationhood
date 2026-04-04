/**
 * incidents.js — Incident trigger, creation, and lifecycle engine
 * Extracted from game-common.js
 */

import { GAME_CONFIG } from './config.js';
import { getCanonicalGovernmentType } from './government-types.js';

// ==================== CONSTANTS ====================

const INCIDENT_CONFIG = {
    fishing_dispute: {
        base_chance: 15,
        required_border: 'maritime',
        required_proximity: 0,          // must be bordering (0 = bordering, 100 = far)
        roles: { a: 'aggrieved', b: 'enforcer' },
        aggressor_role: 'enforcer',
        immediate_effects: { Relations: -5, Civil_Unrest_a: 1, Intl_Reputation_b: -0.5 },
        trigger_modifiers: [
            { stat: 'relation_score', op: 'lt', value: 40, multiplier: 1.5, nation: 'pair' },
            { stat: 'food_security', op: 'lt', value: 40, multiplier: 1.8, nation: 'a' },
            // Trade_Balance negative for nation A
            { stat: 'trade_balance', op: 'lt', value: 0, multiplier: 1.3, nation: 'a' }
        ],
        suppress_modifiers: [
            { condition: 'active_trade_agreement', multiplier: 0.3 },
            { stat: 'relation_score', op: 'gt', value: 65, multiplier: 0.2, nation: 'pair' }
        ]
    },
    border_incursion: {
        base_chance: 0,            // disabled — no event pool seeded, would crash on trigger
        required_border: 'land',
        required_proximity: 0,          // must be bordering (0 = bordering, 100 = far)
        roles: { a: 'invader', b: 'defender' },
        aggressor_role: 'invader',
        starting_leverage_a: 2,
        immediate_effects: { Relations: -12, Stability_b: -4, Civil_Unrest_b: 3, Military_Readiness_b: 2, Intl_Reputation_a: -2, Military_Readiness_both: 1 },
        crisis_fields: { occupation_depth_km: 12, war_risk_pct: 0 },
        trigger_modifiers: [
            { stat: 'relation_score', op: 'lt', value: 25, multiplier: 3.0, nation: 'pair' },
            { stat: 'gov_approval', op: 'lt', value: 30, multiplier: 2.5, nation: 'a' },
            { stat: 'military_readiness', op: 'gt', value: 70, multiplier: 1.5, nation: 'a' },
            { stat: 'stability', op: 'lt', value: 30, multiplier: 1.5, nation: 'b' },
            { stat: 'military_readiness', op: 'lt', value: 40, multiplier: 2.0, nation: 'b' }
        ],
        suppress_modifiers: [
            { stat: 'relation_score', op: 'gt', value: 55, multiplier: 0.1, nation: 'pair' },
            { condition: 'non_aggression_pact', multiplier: 0.2 },
            { stat: 'military_readiness', op: 'lt', value: 50, multiplier: 0.3, nation: 'a' }
        ]
    },
    dam_water: {
        base_chance: 0,            // disabled — no event pool seeded, would crash on trigger
        required_border: 'river',
        required_proximity: 0,          // must be bordering (0 = bordering, 100 = far)
        roles: { a: 'upstream', b: 'downstream' },
        aggressor_role: 'upstream',
        immediate_effects: { Relations: -8, Stability_b: -2 },
        crisis_fields: { water_flow_pct: 35 }
    },
    trade_war: {
        base_chance: 0,                 // action-triggered only (50% on retaliatory tariff)
        required_border: null,          // no border requirement
        required_proximity: null,       // any distance (0-100)
        roles: { a: 'initiator', b: 'retaliator' },
        aggressor_role: 'initiator'
    }
    // spy_arrest deferred — requires Covert Operations action
};

const GLOBAL_INCIDENT_CAP = 12;
const PER_NATION_INCIDENT_CAP = 3;

// ==================== TRIGGER CHECK ====================

/**
 * Main entry point: check all tick-based crisis types for triggers.
 * Called once per tick from advanceTick(), AFTER per-nation processing.
 *
 * Flow per crisis type:
 *   1. Check 18-tick cooldown + initial delay
 *   2. Check global cap (12 active incidents)
 *   3. Roll base trigger chance
 *   4. If triggered: pick random nation (1d7), find valid partner
 *   5. Check per-nation cap (3), per-pair-per-type uniqueness
 *   6. Assign roles
 *   7. Create incident with start event
 */
export async function processIncidentTriggers(supabase, nationList, currentTick) {
    const results = [];

    // Load cooldowns
    const { data: cooldowns } = await supabase
        .from('incident_cooldowns')
        .select('*');
    if (!cooldowns) return results;

    // Count global active incidents
    const { count: globalActive } = await supabase
        .from('incidents')
        .select('id', { count: 'exact', head: true })
        .in('status', ['active', 'mediating']);
    if ((globalActive || 0) >= GLOBAL_INCIDENT_CAP) {
        console.log(`[Incidents] Global cap reached (${globalActive}/${GLOBAL_INCIDENT_CAP}). Skipping triggers.`);
        return results;
    }

    // Load diplomatic relations (for proximity, border types, relation scores)
    const { data: allRelations } = await supabase
        .from('diplomatic_relations')
        .select('nation_a_id, nation_b_id, proximity, border_types, relation_score');

    // Build lookup map: "idA::idB" -> relation
    const relMap = {};
    for (const r of (allRelations || [])) {
        relMap[`${r.nation_a_id}::${r.nation_b_id}`] = r;
        relMap[`${r.nation_b_id}::${r.nation_a_id}`] = r;
    }

    // Load active incidents for cap checking
    const { data: activeIncidents } = await supabase
        .from('incidents')
        .select('nation_a_id, nation_b_id, incident_type, status')
        .in('status', ['active', 'mediating']);

    // Count per-nation active incidents
    const nationIncidentCounts = {};
    for (const inc of (activeIncidents || [])) {
        nationIncidentCounts[inc.nation_a_id] = (nationIncidentCounts[inc.nation_a_id] || 0) + 1;
        nationIncidentCounts[inc.nation_b_id] = (nationIncidentCounts[inc.nation_b_id] || 0) + 1;
    }

    // Check each tick-triggered crisis type
    const tickTriggeredTypes = ['fishing_dispute', 'border_incursion', 'dam_water'];

    for (const crisisType of tickTriggeredTypes) {
        const config = INCIDENT_CONFIG[crisisType];
        if (!config || config.base_chance <= 0) continue;

        const cooldown = cooldowns.find(c => c.incident_type === crisisType);
        if (!cooldown) continue;

        // Check initial delay (staggered start)
        if (currentTick < cooldown.initial_delay_until) {
            continue;
        }

        // Check 18-tick cooldown
        if (currentTick - cooldown.last_fired_tick < cooldown.cooldown_ticks) {
            continue;
        }

        console.log(`[Incidents] ${crisisType} passed cooldown check. Attempting to find nations...`);

        // Pick a random nation (1d7)
        const shuffled = [...nationList].sort(() => Math.random() - 0.5);
        let created = false;

        for (const nationA of shuffled) {
            if (created) break;

            // Check nation A cap
            if ((nationIncidentCounts[nationA.id] || 0) >= PER_NATION_INCIDENT_CAP) continue;

            // Find a valid partner
            const partners = nationList.filter(n => n.id !== nationA.id);
            const shuffledPartners = partners.sort(() => Math.random() - 0.5);

            for (const nationB of shuffledPartners) {
                // Check nation B cap
                if ((nationIncidentCounts[nationB.id] || 0) >= PER_NATION_INCIDENT_CAP) continue;

                // Check diplomatic relation exists
                const rel = relMap[`${nationA.id}::${nationB.id}`];
                if (!rel) continue;

                // Check proximity (0 = bordering, 100 = far; skip if too far apart)
                if (config.required_proximity != null && rel.proximity > config.required_proximity) continue;

                // Check border type
                if (config.required_border) {
                    const borders = rel.border_types || [];
                    if (!borders.includes(config.required_border)) continue;
                }

                // Check no duplicate type for this pair
                const pairHasType = (activeIncidents || []).some(inc =>
                    inc.incident_type === crisisType &&
                    ((inc.nation_a_id === nationA.id && inc.nation_b_id === nationB.id) ||
                     (inc.nation_a_id === nationB.id && inc.nation_b_id === nationA.id))
                );
                if (pairHasType) continue;

                // Apply trigger modifiers
                let chance = config.base_chance;
                for (const mod of (config.trigger_modifiers || [])) {
                    const statVal = getStatForModifier(mod, nationA, nationB, rel);
                    if (statVal != null && checkCondition(statVal, mod.op, mod.value)) {
                        chance *= mod.multiplier;
                    }
                }

                // Apply suppress modifiers
                for (const mod of (config.suppress_modifiers || [])) {
                    if (mod.condition) {
                        // TODO: check active treaties/pacts when implemented
                        continue;
                    }
                    const statVal = getStatForModifier(mod, nationA, nationB, rel);
                    if (statVal != null && checkCondition(statVal, mod.op, mod.value)) {
                        chance *= mod.multiplier;
                    }
                }

                // Final roll against modified chance
                const finalRoll = Math.random() * 100;
                if (finalRoll >= chance) continue;

                console.log(`[Incidents] ${crisisType} TRIGGERED between ${nationA.name} and ${nationB.name} (chance ${chance.toFixed(2)}%, roll ${finalRoll.toFixed(2)})`);

                // Assign roles
                const { roleA, roleB, assignedA, assignedB } = assignRoles(config, nationA, nationB);

                // Create the incident
                const result = await createIncident(supabase, {
                    type: crisisType,
                    config,
                    nationA: assignedA,
                    nationB: assignedB,
                    roleA,
                    roleB,
                    currentTick,
                    relation: rel
                });

                if (result) {
                    results.push(result);
                    created = true;

                    // Update cooldown
                    await supabase
                        .from('incident_cooldowns')
                        .update({ last_fired_tick: currentTick })
                        .eq('incident_type', crisisType);

                    // Update in-memory counts
                    nationIncidentCounts[assignedA.id] = (nationIncidentCounts[assignedA.id] || 0) + 1;
                    nationIncidentCounts[assignedB.id] = (nationIncidentCounts[assignedB.id] || 0) + 1;
                }
                break;
            }
        }
    }

    return results;
}


// ==================== ROLE ASSIGNMENT ====================

/**
 * Assign roles based on crisis rules.
 * Nation A keeps its role (random assignment from shuffle).
 */
function assignRoles(config, nationA, nationB) {
    let assignedA = nationA;
    let assignedB = nationB;
    let roleA = config.roles.a;
    let roleB = config.roles.b;

    return { roleA, roleB, assignedA, assignedB };
}


// ==================== INCIDENT CREATION ====================

/**
 * Create a new incident with start event, stat effects, and system messages.
 */
async function createIncident(supabase, { type, config, nationA, nationB, roleA, roleB, currentTick, relation }) {
    const govTypeA = 'democracy';
    const govTypeB = 'democracy';

    // Roll start event (1d5)
    const { data: startEvents } = await supabase
        .from('incident_event_pool')
        .select('*')
        .eq('incident_type', type)
        .eq('category', 'start');

    if (!startEvents || startEvents.length === 0) {
        console.error(`[Incidents] No start events found for ${type}`);
        return null;
    }

    const startEvent = startEvents[Math.floor(Math.random() * startEvents.length)];

    // Calculate starting leverage
    let leverageA = (config.starting_leverage_a || 0) + (startEvent.leverage_shift_a || 0);
    let leverageB = (config.starting_leverage_b || 0) + (startEvent.leverage_shift_b || 0);

    // Build incident row
    const incidentData = {
        incident_type: type,
        status: 'active',
        nation_a_id: nationA.id,
        nation_b_id: nationB.id,
        nation_a_role: roleA,
        nation_b_role: roleB,
        nation_a_gov_type: govTypeA,
        nation_b_gov_type: govTypeB,
        leverage_a: leverageA,
        leverage_b: leverageB,
        started_tick: currentTick,
        start_event_id: startEvent.event_key,
        ...(config.crisis_fields || {})
    };

    const { data: incident, error: insertErr } = await supabase
        .from('incidents')
        .insert(incidentData)
        .select('id')
        .single();

    if (insertErr || !incident) {
        console.error(`[Incidents] Failed to create ${type}:`, insertErr);
        return null;
    }

    // Substitute placeholders in event text
    const eventText = startEvent.event_text_template
        .replace(/\{nation_a\}/g, nationA.name)
        .replace(/\{nation_b\}/g, nationB.name);

    // Insert start event into timeline
    await supabase.from('incident_events').insert({
        incident_id: incident.id,
        tick: currentTick,
        event_type: 'start_event',
        event_key: startEvent.event_key,
        leverage_shift_a: startEvent.leverage_shift_a || 0,
        leverage_shift_b: startEvent.leverage_shift_b || 0,
        event_text: eventText,
        event_source_label: `${formatCrisisName(type)} — Incident Start`,
        stat_effects: startEvent.stat_effects_template,
        metadata: startEvent.metadata_template,
        visibility: 'both'
    });

    // Apply immediate stat effects to both nations
    const effects = config.immediate_effects || {};
    await applyIncidentStatEffects(supabase, nationA, nationB, effects);

    // Insert system chat message for both nations
    const crisisName = `${nationA.name}-${nationB.name} ${formatCrisisName(type)}`;
    for (const nation of [nationA, nationB]) {
        await supabase.from('incident_chat_messages').insert({
            incident_id: incident.id,
            nation_id: nation.id,
            sender_role: 'system',
            message_text: `-- ${crisisName} opened Tick ${currentTick} --`,
            tick: currentTick,
            is_system: true,
            chat_context: 'internal'
        });
        await supabase.from('incident_chat_messages').insert({
            incident_id: incident.id,
            nation_id: nation.id,
            sender_role: 'system',
            message_text: '-- Participants: HoG, Foreign Minister, Minister of Defense --',
            tick: currentTick,
            is_system: true,
            chat_context: 'internal'
        });
    }

    // Insert event_log entries (Nation tab + World tab)
    // Uses structured summary text (not the narrative event pool text)
    const eventLogSummary = getIncidentEventLogSummary(type, nationA, nationB, roleA);
    await supabase.from('event_log').insert({
        nation_id: nationA.id,
        event_name: formatCrisisName(type),
        trigger_key: `incident_started_${type}`,
        description_chosen: eventLogSummary,
        category: 'crisis',
        fired_at_tick: currentTick
    });
    await supabase.from('event_log').insert({
        nation_id: nationB.id,
        event_name: formatCrisisName(type),
        trigger_key: `incident_started_${type}`,
        description_chosen: eventLogSummary,
        category: 'crisis',
        fired_at_tick: currentTick
    });

    console.log(`[Incidents] Created ${type}: ${nationA.name} (${roleA}) vs ${nationB.name} (${roleB}). Leverage: ${leverageA}-${leverageB}. Start event: ${startEvent.event_key}`);

    return {
        incidentId: incident.id,
        type,
        nationA: nationA.name,
        nationB: nationB.name,
        roleA,
        roleB,
        leverageA,
        leverageB,
        startEvent: startEvent.event_key
    };
}


// ==================== HELPERS ====================

function getStatForModifier(mod, nationA, nationB, relation) {
    if (mod.nation === 'pair') {
        return relation?.[mod.stat] ?? null;
    }
    const nation = mod.nation === 'a' ? nationA : nationB;
    return nation?.[mod.stat] ?? null;
}

function checkCondition(value, op, threshold) {
    switch (op) {
        case 'lt': return value < threshold;
        case 'gt': return value > threshold;
        case 'lte': return value <= threshold;
        case 'gte': return value >= threshold;
        case 'eq': return value === threshold;
        default: return false;
    }
}

function formatCrisisName(type) {
    switch (type) {
        case 'fishing_dispute': return 'Maritime Fishing Dispute';
        case 'border_incursion': return 'Border Military Incursion';
        case 'dam_water': return 'Dam / Water Diversion Crisis';
        case 'trade_war': return 'Trade War Escalation';
        case 'spy_arrest': return 'Spy Arrest Crisis';
        default: return type;
    }
}

/**
 * Generate a summary description for the event_log (dashboard World/Nation feeds).
 * Uses clean, structured text instead of the narrative event pool text.
 */
const FISHING_EVENT_SUMMARIES = [
    'A Maritime Fishing Dispute was triggered when {enforcer} seized a {aggrieved} fishing vessel in disputed waters.',
    'A Maritime Fishing Dispute erupted after {enforcer} coast guard detained {aggrieved} fishermen in contested territory.',
    'A Maritime Fishing Dispute has begun — {enforcer} intercepted and impounded a {aggrieved} vessel in disputed waters.'
];

function getIncidentEventLogSummary(type, nationA, nationB, roleA) {
    if (type === 'fishing_dispute') {
        const enforcer = roleA === 'enforcer' ? nationA.name : nationB.name;
        const aggrieved = roleA === 'aggrieved' ? nationA.name : nationB.name;
        const template = FISHING_EVENT_SUMMARIES[Math.floor(Math.random() * FISHING_EVENT_SUMMARIES.length)];
        return template.replace(/\{enforcer\}/g, enforcer).replace(/\{aggrieved\}/g, aggrieved);
    }
    return `A ${formatCrisisName(type)} incident has been triggered between ${nationA.name} and ${nationB.name}.`;
}

/**
 * Apply stat effects from an incident to both nations.
 * Keys ending in _a apply to nation A only, _b to nation B only,
 * _both to both. Plain keys apply as Relations (bilateral).
 */
async function applyIncidentStatEffects(supabase, nationA, nationB, effects) {
    for (const [key, value] of Object.entries(effects)) {
        if (key === 'Relations') {
            // Update bilateral relation score
            const aId = nationA.id < nationB.id ? nationA.id : nationB.id;
            const bId = nationA.id < nationB.id ? nationB.id : nationA.id;
            await supabase.rpc('nudge_relation_score', {
                p_nation_a_id: aId,
                p_nation_b_id: bId,
                p_delta: value
            }).then(() => {}, async () => {
                // Fallback: direct update if RPC doesn't exist
                const { data: rel } = await supabase.from('diplomatic_relations')
                    .select('relation_score')
                    .eq('nation_a_id', aId)
                    .eq('nation_b_id', bId)
                    .maybeSingle();
                const current = rel?.relation_score ?? 30;
                await supabase.from('diplomatic_relations')
                    .update({ relation_score: Math.max(0, Math.min(100, current + value)) })
                    .eq('nation_a_id', aId)
                    .eq('nation_b_id', bId);
            });
            continue;
        }

        // Determine target nation(s) and stat name
        let targets = [];
        let statName = key;

        if (key.endsWith('_a')) {
            targets = [nationA];
            statName = key.slice(0, -2).toLowerCase();
        } else if (key.endsWith('_b')) {
            targets = [nationB];
            statName = key.slice(0, -2).toLowerCase();
        } else if (key.endsWith('_both')) {
            targets = [nationA, nationB];
            statName = key.slice(0, -5).toLowerCase();
        } else {
            continue;
        }

        for (const nation of targets) {
            const currentVal = Number(nation[statName] ?? 50);
            const newVal = Math.max(0, Math.min(100, currentVal + value));
            await supabase
                .from('nations')
                .update({ [statName]: newVal })
                .eq('id', nation.id);
        }
    }
}


// ==================== PHASE 4: TICK EVENTS & INACTION ====================

/**
 * Process all active incidents: fire random tick events and check inaction.
 * Called once per tick from advanceTick(), after trigger checks.
 */
export async function processActiveIncidents(supabase, nationList, currentTick) {
    const results = { tickEvents: [], inactionPenalties: [] };

    const { data: activeIncidents } = await supabase
        .from('incidents')
        .select('*')
        .in('status', ['active']);  // NOT 'mediating' — mediating incidents skip tick events

    if (!activeIncidents || activeIncidents.length === 0) return results;

    // Build nation lookup
    const nationMap = {};
    for (const n of nationList) nationMap[n.id] = n;

    for (const incident of activeIncidents) {
        try {
            // Fire random tick event
            const tickResult = await processIncidentTickEvent(supabase, incident, nationMap, currentTick);
            if (tickResult) results.tickEvents.push(tickResult);

            // Check inaction for both sides
            const inactionResult = await processIncidentInaction(supabase, incident, nationMap, currentTick);
            if (inactionResult) results.inactionPenalties.push(...inactionResult);
        } catch (err) {
            console.error(`[Incidents] Error processing incident ${incident.id}:`, err);
        }
    }

    return results;
}


// ==================== RANDOM TICK EVENTS ====================

/**
 * Select and fire one random tick event for an active incident.
 *
 * Weighting by combined leverage:
 *   0-5:   70% low, 25% moderate, 5% high
 *   6-10:  30% low, 50% moderate, 20% high
 *   11-15: 10% low, 40% moderate, 50% high
 *   16+:   5% low, 25% moderate, 70% high
 *
 * Events that already fired in this incident are excluded (no repeats).
 */
async function processIncidentTickEvent(supabase, incident, nationMap, currentTick) {
    const combined = (incident.leverage_a || 0) + (incident.leverage_b || 0);

    // Determine category weights
    let weights;
    if (combined <= 5)       weights = { low: 70, moderate: 25, high: 5 };
    else if (combined <= 10) weights = { low: 30, moderate: 50, high: 20 };
    else if (combined <= 15) weights = { low: 10, moderate: 40, high: 50 };
    else                     weights = { low: 5,  moderate: 25, high: 70 };

    // If either side has 5+ ticks inaction, high-intensity pool always available
    if (incident.inaction_a_ticks >= 5 || incident.inaction_b_ticks >= 5) {
        weights = { low: 5, moderate: 25, high: 70 };
    }

    // Get already-fired event keys for this incident (no repeats)
    const { data: firedEvents } = await supabase
        .from('incident_events')
        .select('event_key')
        .eq('incident_id', incident.id)
        .not('event_key', 'is', null);
    const firedKeys = new Set((firedEvents || []).map(e => e.event_key));

    // Load available tick events from pool
    const { data: allEvents } = await supabase
        .from('incident_event_pool')
        .select('*')
        .eq('incident_type', incident.incident_type)
        .in('category', ['low', 'moderate', 'high']);

    if (!allEvents || allEvents.length === 0) return null;

    // Filter out already-fired events
    const available = allEvents.filter(e => !firedKeys.has(e.event_key));
    if (available.length === 0) {
        console.log(`[Incidents] ${incident.id}: All tick events exhausted for ${incident.incident_type}`);
        return null;
    }

    // Group by category
    const pools = { low: [], moderate: [], high: [] };
    for (const e of available) {
        if (pools[e.category]) pools[e.category].push(e);
    }

    // Weighted random category selection
    const selected = selectFromWeightedPools(pools, weights);
    if (!selected) return null;

    // Resolve nation names
    const nationA = nationMap[incident.nation_a_id];
    const nationB = nationMap[incident.nation_b_id];
    if (!nationA || !nationB) return null;

    // Substitute placeholders
    const eventText = selected.event_text_template
        .replace(/\{nation_a\}/g, nationA.name)
        .replace(/\{nation_b\}/g, nationB.name);

    const shiftA = selected.leverage_shift_a || 0;
    const shiftB = selected.leverage_shift_b || 0;

    // Update incident leverage
    const newLevA = Math.max(0, (incident.leverage_a || 0) + shiftA);
    const newLevB = Math.max(0, (incident.leverage_b || 0) + shiftB);

    await supabase
        .from('incidents')
        .update({ leverage_a: newLevA, leverage_b: newLevB })
        .eq('id', incident.id);

    // Insert timeline event
    await supabase.from('incident_events').insert({
        incident_id: incident.id,
        tick: currentTick,
        event_type: 'random_tick',
        event_key: selected.event_key,
        leverage_shift_a: shiftA,
        leverage_shift_b: shiftB,
        event_text: eventText,
        event_source_label: selected.source_label_template || null,
        stat_effects: selected.stat_effects_template,
        metadata: selected.metadata_template,
        visibility: 'both'
    });

    // Apply stat effects if present
    if (selected.stat_effects_template) {
        await applyIncidentStatEffects(supabase, nationA, nationB, selected.stat_effects_template);
    }

    // Handle special metadata (e.g., war_risk_pct from TICK_30)
    if (selected.metadata_template?.war_risk_pct) {
        const currentRisk = incident.war_risk_pct || 0;
        const newRisk = Math.max(currentRisk, selected.metadata_template.war_risk_pct);
        await supabase
            .from('incidents')
            .update({ war_risk_pct: newRisk })
            .eq('id', incident.id);
    }

    console.log(`[Incidents] ${incident.id}: Tick event ${selected.event_key} (${selected.category}). Leverage: ${newLevA}-${newLevB}`);

    return {
        incidentId: incident.id,
        eventKey: selected.event_key,
        category: selected.category,
        leverageA: newLevA,
        leverageB: newLevB,
        shiftA,
        shiftB
    };
}

/**
 * Pick one event from weighted category pools.
 * If the chosen category is empty, fall back to adjacent categories.
 */
function selectFromWeightedPools(pools, weights) {
    const totalWeight = weights.low + weights.moderate + weights.high;
    let roll = Math.random() * totalWeight;

    // Determine primary category
    let primaryCategory;
    if (roll < weights.low) primaryCategory = 'low';
    else if (roll < weights.low + weights.moderate) primaryCategory = 'moderate';
    else primaryCategory = 'high';

    // Try primary, then adjacent fallbacks
    const fallbackOrder = {
        low: ['low', 'moderate', 'high'],
        moderate: ['moderate', 'low', 'high'],
        high: ['high', 'moderate', 'low']
    };

    for (const cat of fallbackOrder[primaryCategory]) {
        if (pools[cat] && pools[cat].length > 0) {
            return pools[cat][Math.floor(Math.random() * pools[cat].length)];
        }
    }

    return null;
}


// ==================== INACTION CHECK ====================

/**
 * Check and penalize nations that haven't taken actions.
 *
 * Inaction counter increments each tick if no non-Wait action was taken.
 * At 3 ticks: Democracy Gov_Approval -1, Autocracy Coup +1
 * At 5+ ticks: additional Democracy Gov_Approval -2, Autocracy Coup +2
 */
async function processIncidentInaction(supabase, incident, nationMap, currentTick) {
    const penalties = [];

    // Check if any non-Wait actions were taken THIS tick by each nation
    const { data: actionsThisTick } = await supabase
        .from('incident_actions_taken')
        .select('nation_id, action_key')
        .eq('incident_id', incident.id)
        .eq('tick', currentTick);

    const nationAActed = (actionsThisTick || []).some(
        a => a.nation_id === incident.nation_a_id && a.action_key !== 'wait'
    );
    const nationBActed = (actionsThisTick || []).some(
        a => a.nation_id === incident.nation_b_id && a.action_key !== 'wait'
    );

    // Update inaction counters
    const newInactionA = nationAActed ? 0 : (incident.inaction_a_ticks || 0) + 1;
    const newInactionB = nationBActed ? 0 : (incident.inaction_b_ticks || 0) + 1;

    await supabase
        .from('incidents')
        .update({ inaction_a_ticks: newInactionA, inaction_b_ticks: newInactionB })
        .eq('id', incident.id);

    // Apply penalties
    const nationA = nationMap[incident.nation_a_id];
    const nationB = nationMap[incident.nation_b_id];

    for (const { nation, inactionTicks, side } of [
        { nation: nationA, inactionTicks: newInactionA, side: 'a' },
        { nation: nationB, inactionTicks: newInactionB, side: 'b' }
    ]) {
        if (!nation || inactionTicks < 3) continue;

        let penaltyAmount = 0;
        let penaltyStat = 'gov_approval';
        let penaltyDir = -1; // approval goes down

        if (inactionTicks >= 5) {
            penaltyAmount = 3; // -1 base + -2 additional
        } else if (inactionTicks >= 3) {
            penaltyAmount = 1;
        }

        if (penaltyAmount > 0) {
            const delta = penaltyAmount * penaltyDir;
            const currentVal = Number(nation[penaltyStat] ?? 50);
            const newVal = Math.max(0, Math.min(100, currentVal + delta));
            await supabase
                .from('nations')
                .update({ [penaltyStat]: newVal })
                .eq('id', nation.id);

            // Insert inaction event in timeline
            const crisisName = formatCrisisName(incident.incident_type);
            const eventText = `${nation.name}'s government has not acted on the ${crisisName} in ${inactionTicks} ticks. Public confidence is declining.`;

            await supabase.from('incident_events').insert({
                incident_id: incident.id,
                tick: currentTick,
                event_type: 'inaction_penalty',
                source_nation_id: nation.id,
                leverage_shift_a: 0,
                leverage_shift_b: 0,
                event_text: eventText,
                visibility: side === 'a' ? 'nation_a' : 'nation_b'
            });

            penalties.push({
                incidentId: incident.id,
                nationId: nation.id,
                nationName: nation.name,
                inactionTicks,
                stat: penaltyStat,
                delta
            });

            console.log(`[Incidents] Inaction penalty: ${nation.name} (${inactionTicks} ticks) → ${penaltyStat} ${delta > 0 ? '+' : ''}${delta}`);
        }
    }

    return penalties.length > 0 ? penalties : null;
}


// ==================== PHASE 5: ESCALATION, MEDIATION, BLOWBACK, RESOLUTION ====================

/**
 * Process escalation thresholds, mediation, blowback, and resolution for all active incidents.
 * Called once per tick from advanceTick(), after tick events.
 */
export async function processIncidentResolutionPhase(supabase, nationList, currentTick) {
    const results = { escalations: [], mediations: [], blowbacks: [], resolutions: [] };

    const { data: incidents } = await supabase
        .from('incidents')
        .select('*')
        .in('status', ['active', 'mediating']);

    if (!incidents || incidents.length === 0) return results;

    const nationMap = {};
    for (const n of nationList) nationMap[n.id] = n;

    for (const incident of incidents) {
        try {
            // Step 1: Escalation thresholds (active only, not mediating)
            if (incident.status === 'active') {
                const escResults = await processIncidentEscalation(supabase, incident, nationMap, currentTick);
                if (escResults.length > 0) results.escalations.push(...escResults);
            }

            // Step 2: Mediation resolution
            const medResult = await processIncidentMediation(supabase, incident, nationMap, currentTick);
            if (medResult) results.mediations.push(medResult);

            // Step 3: Blowback check
            const blowbackResult = await processIncidentBlowback(supabase, incident, nationMap, currentTick);
            if (blowbackResult) results.blowbacks.push(blowbackResult);

            // Step 4: Resolution check (reload incident — leverage may have changed)
            const { data: freshIncident } = await supabase
                .from('incidents')
                .select('*')
                .eq('id', incident.id)
                .single();
            if (freshIncident && freshIncident.status !== 'resolved') {
                const resResult = await processIncidentResolution(supabase, freshIncident, nationMap, currentTick);
                if (resResult) results.resolutions.push(resResult);
            }
        } catch (err) {
            console.error(`[Incidents] Resolution phase error for ${incident.id}:`, err);
        }
    }

    return results;
}


// ==================== ESCALATION THRESHOLDS ====================

/**
 * Check leverage against thresholds 5 and 8 for both sides.
 * Roll one escalation event from the pool. Log to escalation_log.
 * Leverage 10 is handled by resolution, not here.
 */
async function processIncidentEscalation(supabase, incident, nationMap, currentTick) {
    const results = [];
    const thresholds = [5, 8];

    for (const side of ['a', 'b']) {
        const leverage = side === 'a' ? incident.leverage_a : incident.leverage_b;

        for (const threshold of thresholds) {
            if (leverage < threshold) continue;

            // Check if this threshold already fired
            const { data: existing } = await supabase
                .from('incident_escalation_log')
                .select('id')
                .eq('incident_id', incident.id)
                .eq('threshold', threshold)
                .eq('nation_side', side)
                .maybeSingle();

            if (existing) continue;

            // Roll escalation event from pool
            const category = `escalation_${side}${threshold}`;
            const { data: events } = await supabase
                .from('incident_event_pool')
                .select('*')
                .eq('incident_type', incident.incident_type)
                .eq('category', category);

            if (!events || events.length === 0) continue;

            const selected = events[Math.floor(Math.random() * events.length)];
            const nationA = nationMap[incident.nation_a_id];
            const nationB = nationMap[incident.nation_b_id];
            if (!nationA || !nationB) continue;

            const eventText = selected.event_text_template
                .replace(/\{nation_a\}/g, nationA.name)
                .replace(/\{nation_b\}/g, nationB.name);

            // Log to escalation_log
            await supabase.from('incident_escalation_log').insert({
                incident_id: incident.id,
                threshold,
                nation_side: side,
                event_key: selected.event_key,
                tick: currentTick,
                effects_applied: selected.stat_effects_template || {}
            });

            // Insert timeline event
            await supabase.from('incident_events').insert({
                incident_id: incident.id,
                tick: currentTick,
                event_type: 'escalation_threshold',
                event_key: selected.event_key,
                leverage_shift_a: selected.leverage_shift_a || 0,
                leverage_shift_b: selected.leverage_shift_b || 0,
                event_text: `ESCALATION (Leverage ${threshold}): ${eventText}`,
                event_source_label: `Threshold ${threshold} — ${side === 'a' ? nationA.name : nationB.name}`,
                stat_effects: selected.stat_effects_template,
                metadata: selected.metadata_template,
                visibility: 'both'
            });

            // Apply stat effects
            if (selected.stat_effects_template) {
                await applyIncidentStatEffects(supabase, nationA, nationB, selected.stat_effects_template);
            }

            // Insert system chat message
            for (const nation of [nationA, nationB]) {
                await supabase.from('incident_chat_messages').insert({
                    incident_id: incident.id,
                    nation_id: nation.id,
                    sender_role: 'system',
                    message_text: `THRESHOLD: Leverage ${threshold} crossed (${side === 'a' ? nationA.name : nationB.name}). Escalation event fired.`,
                    tick: currentTick,
                    is_system: true,
                    chat_context: 'internal'
                });
            }

            // Event log for escalation (both nations + world)
            for (const nId of [incident.nation_a_id, incident.nation_b_id]) {
                await supabase.from('event_log').insert({
                    nation_id: nId,
                    event_name: `${formatCrisisName(incident.incident_type)} Escalation`,
                    trigger_key: `incident_escalation_${threshold}`,
                    description_chosen: eventText,
                    category: 'crisis',
                    fired_at_tick: currentTick
                });
            }

            console.log(`[Incidents] Escalation: ${incident.id} side=${side} threshold=${threshold} event=${selected.event_key}`);
            results.push({ incidentId: incident.id, side, threshold, eventKey: selected.event_key });
        }
    }

    return results;
}


// ==================== MEDIATION ====================

/**
 * Process the prisoner's dilemma mediation check.
 *
 * At tick resolution, check incident_mediation for this tick:
 *   BOTH proposed → enter mediation (4-tick freeze) or resolve if mediation_end_tick reached
 *   A only → A loses 2 leverage, B gains 1
 *   B only → B loses 2 leverage, A gains 1
 *   Neither → no effect
 *
 * Also handles mediation completion (mediation_end_tick reached).
 */
async function processIncidentMediation(supabase, incident, nationMap, currentTick) {
    const nationA = nationMap[incident.nation_a_id];
    const nationB = nationMap[incident.nation_b_id];
    if (!nationA || !nationB) return null;

    // Handle mediation completion (status = 'mediating', end tick reached)
    if (incident.status === 'mediating' && incident.mediation_end_tick && currentTick >= incident.mediation_end_tick) {
        return await completeMediationResolution(supabase, incident, nationA, nationB, currentTick);
    }

    // Check for new mediation proposals this tick (only for active incidents)
    if (incident.status !== 'active') return null;

    const { data: mediation } = await supabase
        .from('incident_mediation')
        .select('*')
        .eq('incident_id', incident.id)
        .eq('tick', currentTick)
        .maybeSingle();

    if (!mediation) return null;
    if (mediation.outcome) return null; // already processed

    const aProposed = mediation.nation_a_proposed;
    const bProposed = mediation.nation_b_proposed;
    let outcome, eventText;

    if (aProposed && bProposed) {
        // BOTH PROPOSED — enter mediation
        outcome = 'both_proposed';
        eventText = `Both ${nationA.name} and ${nationB.name} agree to mediation. Leverage frozen for 4 ticks.`;

        await supabase
            .from('incidents')
            .update({
                status: 'mediating',
                mediation_active: true,
                mediation_start_tick: currentTick,
                mediation_end_tick: currentTick + 4
            })
            .eq('id', incident.id);

        // World event
        await supabase.from('event_log').insert({
            nation_id: nationA.id,
            event_name: 'Mediation Accepted',
            trigger_key: 'incident_mediation_accepted',
            description_chosen: `${nationA.name} and ${nationB.name} enter mediation over ${formatCrisisName(incident.incident_type)}.`,
            category: 'crisis',
            fired_at_tick: currentTick
        });

    } else if (aProposed && !bProposed) {
        // A ONLY — A penalized
        outcome = 'a_only';
        const levA = Math.max(0, (incident.leverage_a || 0) - 2);
        const levB = (incident.leverage_b || 0) + 1;
        eventText = `${nationA.name} proposes mediation. ${nationB.name} refuses.`;

        await supabase.from('incidents')
            .update({ leverage_a: levA, leverage_b: levB })
            .eq('id', incident.id);

        // Reputation bump for proposer
        await applyIncidentStatEffects(supabase, nationA, nationB, { Intl_Reputation_a: 0.5 });

    } else if (!aProposed && bProposed) {
        // B ONLY — B penalized
        outcome = 'b_only';
        const levA = (incident.leverage_a || 0) + 1;
        const levB = Math.max(0, (incident.leverage_b || 0) - 2);
        eventText = `${nationB.name} proposes mediation. ${nationA.name} refuses.`;

        await supabase.from('incidents')
            .update({ leverage_a: levA, leverage_b: levB })
            .eq('id', incident.id);

        await applyIncidentStatEffects(supabase, nationA, nationB, { Intl_Reputation_b: 0.5 });

    } else {
        // NEITHER — silent, no event
        outcome = 'neither';
        await supabase.from('incident_mediation')
            .update({ outcome })
            .eq('id', mediation.id);
        return null;
    }

    // Update mediation record
    await supabase.from('incident_mediation')
        .update({ outcome })
        .eq('id', mediation.id);

    // Insert timeline event
    if (eventText) {
        await supabase.from('incident_events').insert({
            incident_id: incident.id,
            tick: currentTick,
            event_type: outcome === 'both_proposed' ? 'mediation_result' : 'mediation_proposal',
            event_text: eventText,
            visibility: 'both'
        });
    }

    console.log(`[Incidents] Mediation: ${incident.id} outcome=${outcome}`);
    return { incidentId: incident.id, outcome };
}

/**
 * Complete a mediation that has reached its end tick.
 * Formula: compromise = MAX(leverage_a, leverage_b) / 2, then +/- 1d3
 */
async function completeMediationResolution(supabase, incident, nationA, nationB, currentTick) {
    const winningLeverage = Math.max(incident.leverage_a || 0, incident.leverage_b || 0);
    const compromise = Math.floor(winningLeverage / 2);
    const roll1d3 = Math.floor(Math.random() * 3) - 1; // -1, 0, or +1
    const finalPosition = compromise + roll1d3;

    // Determine which side had higher leverage
    const aWinning = (incident.leverage_a || 0) >= (incident.leverage_b || 0);
    const finalLevA = aWinning ? Math.max(0, finalPosition) : 0;
    const finalLevB = aWinning ? 0 : Math.max(0, finalPosition);

    // Resolve the incident
    await supabase.from('incidents').update({
        status: 'resolved',
        resolved_tick: currentTick,
        resolution_type: 'mediation',
        leverage_a: finalLevA,
        leverage_b: finalLevB,
        mediation_active: false
    }).eq('id', incident.id);

    // Update mediation record
    await supabase.from('incident_mediation')
        .update({
            mediation_roll: roll1d3,
            compromise_position: finalPosition,
            resolved: true
        })
        .eq('incident_id', incident.id)
        .eq('tick', incident.mediation_start_tick);

    // Apply resolution effects
    await applyIncidentStatEffects(supabase, nationA, nationB, {
        Relations: 5,
        Intl_Reputation_a: 1,
        Intl_Reputation_b: 1
    });

    const crisisName = formatCrisisName(incident.incident_type);
    const eventText = `Mediation complete. ${crisisName} resolved through compromise. Final position: ${aWinning ? nationA.name : nationB.name} +${finalPosition}.`;

    // Timeline event
    await supabase.from('incident_events').insert({
        incident_id: incident.id,
        tick: currentTick,
        event_type: 'resolution',
        event_text: eventText,
        leverage_shift_a: finalLevA - (incident.leverage_a || 0),
        leverage_shift_b: finalLevB - (incident.leverage_b || 0),
        visibility: 'both'
    });

    // System chat
    for (const nation of [nationA, nationB]) {
        await supabase.from('incident_chat_messages').insert({
            incident_id: incident.id,
            nation_id: nation.id,
            sender_role: 'system',
            message_text: `CRISIS RESOLVED: Mediation compromise. Final leverage: ${finalLevA}-${finalLevB}.`,
            tick: currentTick,
            is_system: true,
            chat_context: 'internal'
        });
    }

    // Event log
    await supabase.from('event_log').insert({
        nation_id: nationA.id,
        event_name: `${crisisName} Resolved`,
        trigger_key: 'incident_resolved_mediation',
        description_chosen: eventText,
        category: 'crisis',
        fired_at_tick: currentTick
    });
    await supabase.from('event_log').insert({
        nation_id: nationB.id,
        event_name: `${crisisName} Resolved`,
        trigger_key: 'incident_resolved_mediation',
        description_chosen: eventText,
        category: 'crisis',
        fired_at_tick: currentTick
    });

    console.log(`[Incidents] Mediation resolved: ${incident.id}. Compromise=${compromise}, roll=${roll1d3}, final=${finalPosition}`);
    return { incidentId: incident.id, type: 'mediation', finalPosition, roll: roll1d3 };
}


// ==================== BLOWBACK ====================

/**
 * If leverage exceeds 10, cap at 10 and apply blowback penalties.
 * Per excess point: winner Int'l_Rep -1, Relations -2 with all others.
 * Loser: Int'l_Rep +0.5, Relations +1 with all others.
 */
async function processIncidentBlowback(supabase, incident, nationMap, currentTick) {
    const levA = incident.leverage_a || 0;
    const levB = incident.leverage_b || 0;

    if (levA <= 10 && levB <= 10) return null;

    const nationA = nationMap[incident.nation_a_id];
    const nationB = nationMap[incident.nation_b_id];
    if (!nationA || !nationB) return null;

    let excess = 0;
    let winner, loser, winnerSide;

    if (levA > 10) {
        excess = levA - 10;
        winner = nationA;
        loser = nationB;
        winnerSide = 'a';
        await supabase.from('incidents').update({ leverage_a: 10 }).eq('id', incident.id);
    } else if (levB > 10) {
        excess = levB - 10;
        winner = nationB;
        loser = nationA;
        winnerSide = 'b';
        await supabase.from('incidents').update({ leverage_b: 10 }).eq('id', incident.id);
    }

    if (excess <= 0) return null;

    // Winner penalties
    const winnerRepPenalty = -1 * excess;
    const winnerRelPenalty = -2 * excess;
    // Loser sympathy
    const loserRepBonus = 0.5 * excess;
    const loserRelBonus = 1 * excess;

    // Apply Int'l_Reputation
    const winnerRep = Math.max(0, Number(winner.intl_reputation ?? 50) + winnerRepPenalty);
    const loserRep = Math.min(100, Number(loser.intl_reputation ?? 50) + loserRepBonus);
    await supabase.from('nations').update({ intl_reputation: winnerRep }).eq('id', winner.id);
    await supabase.from('nations').update({ intl_reputation: loserRep }).eq('id', loser.id);

    // Apply Relations penalties/bonuses with non-involved nations
    const nonInvolved = Object.values(nationMap).filter(
        n => n.id !== nationA.id && n.id !== nationB.id
    );
    for (const other of nonInvolved) {
        // Winner relations penalty
        const wA = winner.id < other.id ? winner.id : other.id;
        const wB = winner.id < other.id ? other.id : winner.id;
        await supabase.rpc('nudge_relation_score', {
            p_nation_a_id: wA, p_nation_b_id: wB, p_delta: winnerRelPenalty
        }).then(() => {}, () => {
            // Fallback: skip if RPC doesn't exist
        });

        // Loser relations bonus
        const lA = loser.id < other.id ? loser.id : other.id;
        const lB = loser.id < other.id ? other.id : loser.id;
        await supabase.rpc('nudge_relation_score', {
            p_nation_a_id: lA, p_nation_b_id: lB, p_delta: loserRelBonus
        }).then(() => {}, () => {});
    }

    const crisisName = formatCrisisName(incident.incident_type);
    const eventText = `${winner.name} faces international backlash for aggressive handling of ${crisisName}. ${excess} point(s) excess leverage. Reputation: ${winnerRepPenalty}, Relations: ${winnerRelPenalty} with all nations.`;

    await supabase.from('incident_events').insert({
        incident_id: incident.id,
        tick: currentTick,
        event_type: 'blowback',
        event_text: eventText,
        metadata: { excess, winner: winner.name, loser: loser.name },
        visibility: 'both'
    });

    // Event log for blowback (both nations + world)
    for (const nId of [incident.nation_a_id, incident.nation_b_id]) {
        await supabase.from('event_log').insert({
            nation_id: nId,
            event_name: `${crisisName} — International Backlash`,
            trigger_key: 'incident_blowback',
            description_chosen: eventText,
            category: 'crisis',
            fired_at_tick: currentTick
        });
    }

    console.log(`[Incidents] Blowback: ${incident.id} ${winner.name} excess=${excess}`);
    return { incidentId: incident.id, winner: winner.name, excess, repPenalty: winnerRepPenalty };
}


// ==================== RESOLUTION CHECK ====================

/**
 * Check all resolution conditions:
 *   1. Leverage >= 10 → forced resolution
 *   2. Natural decay (fishing: 20 ticks with |lev_a - lev_b| <= 2)
 *
 * Concession is handled by the action execution flow (Phase 8), not here.
 * Mediation completion is handled by processIncidentMediation above.
 */
async function processIncidentResolution(supabase, incident, nationMap, currentTick) {
    if (incident.status !== 'active') return null;

    const nationA = nationMap[incident.nation_a_id];
    const nationB = nationMap[incident.nation_b_id];
    if (!nationA || !nationB) return null;

    const levA = incident.leverage_a || 0;
    const levB = incident.leverage_b || 0;

    // 1. Forced resolution at leverage 10
    if (levA >= 10) {
        return await resolveIncident(supabase, incident, nationA, nationB, currentTick, 'forced_a', levA, levB);
    }
    if (levB >= 10) {
        return await resolveIncident(supabase, incident, nationA, nationB, currentTick, 'forced_b', levA, levB);
    }

    // 2. Natural decay check
    const ticksActive = currentTick - incident.started_tick;
    const levDiff = Math.abs(levA - levB);

    const decayConfig = {
        fishing_dispute: { ticks: 20, maxDiff: 2 },
        border_incursion: { ticks: 15, maxDiff: 1 },
        trade_war: { ticks: 20, maxDiff: 2 },
        spy_arrest: { ticks: 15, maxDiff: 2 },
        dam_water: null // never decays
    };

    const decay = decayConfig[incident.incident_type];
    if (decay && ticksActive >= decay.ticks && levDiff <= decay.maxDiff) {
        return await resolveIncident(supabase, incident, nationA, nationB, currentTick, 'decay', levA, levB);
    }

    return null;
}

/**
 * Resolve an incident with the given resolution type.
 * Applies stat effects based on who won and by how much.
 */
async function resolveIncident(supabase, incident, nationA, nationB, currentTick, resolutionType, levA, levB) {
    const crisisName = formatCrisisName(incident.incident_type);
    let eventText = '';
    const statEffects = {};

    if (resolutionType === 'forced_a') {
        // Nation A wins by leverage 10
        eventText = `${crisisName} resolved — ${nationA.name} prevails. ${nationB.name} faces severe consequences.`;
        Object.assign(statEffects, {
            Intl_Reputation_b: -4,
            Stability_b: -3,
            Intl_Reputation_a: 2,
            Relations: 5
        });
        // Gov_Approval cost for loser
        statEffects.Gov_Approval_b = -10;
        // Winner bonus
        statEffects.Gov_Approval_a = 3;

    } else if (resolutionType === 'forced_b') {
        // Nation B wins by leverage 10
        eventText = `${crisisName} resolved — ${nationB.name} prevails. ${nationA.name} faces severe consequences.`;
        Object.assign(statEffects, {
            Intl_Reputation_a: -3,
            Stability_a: -3,
            Intl_Reputation_b: 1,
            Relations: 3
        });
        statEffects.Gov_Approval_a = -10;
        statEffects.Gov_Approval_b = 4;

    } else if (resolutionType === 'decay') {
        eventText = `${crisisName} fades without formal resolution. Tensions ease. Crew quietly released.`;
        Object.assign(statEffects, { Relations: 2 });

    } else if (resolutionType === 'concession_a') {
        // A concedes — B wins
        const cost = levB;
        eventText = `${nationA.name} concedes the ${crisisName}. ${nationB.name}'s position upheld.`;
        statEffects.Relations = 3;
        statEffects.Intl_Reputation_a = -1;
        statEffects.Gov_Approval_a = -cost;

    } else if (resolutionType === 'concession_b') {
        const cost = levA;
        eventText = `${nationB.name} concedes the ${crisisName}. ${nationA.name}'s position upheld.`;
        statEffects.Relations = 3;
        statEffects.Intl_Reputation_b = -1;
        statEffects.Gov_Approval_b = -cost;
    }

    // Update incident
    await supabase.from('incidents').update({
        status: 'resolved',
        resolved_tick: currentTick,
        resolution_type: resolutionType
    }).eq('id', incident.id);

    // Apply stat effects
    await applyIncidentStatEffects(supabase, nationA, nationB, statEffects);

    // Timeline event
    await supabase.from('incident_events').insert({
        incident_id: incident.id,
        tick: currentTick,
        event_type: 'resolution',
        event_text: eventText,
        metadata: { resolution_type: resolutionType, leverage_a: levA, leverage_b: levB },
        visibility: 'both'
    });

    // System chat for both nations
    for (const nation of [nationA, nationB]) {
        await supabase.from('incident_chat_messages').insert({
            incident_id: incident.id,
            nation_id: nation.id,
            sender_role: 'system',
            message_text: `CRISIS RESOLVED: ${eventText}`,
            tick: currentTick,
            is_system: true,
            chat_context: 'internal'
        });
    }

    // Event log for both + world
    for (const nation of [nationA, nationB]) {
        await supabase.from('event_log').insert({
            nation_id: nation.id,
            event_name: `${crisisName} Resolved`,
            trigger_key: `incident_resolved_${resolutionType}`,
            description_chosen: eventText,
            category: 'crisis',
            fired_at_tick: currentTick
        });
    }

    console.log(`[Incidents] RESOLVED: ${incident.id} type=${resolutionType} leverage=${levA}-${levB}`);
    return { incidentId: incident.id, resolutionType, leverageA: levA, leverageB: levB };
}
