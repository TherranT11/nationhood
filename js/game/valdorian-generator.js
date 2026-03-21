/**
 * valdorian-generator.js — Article assembly from game events
 *
 * Consumes structured event objects, selects templates, fills variables,
 * and produces article objects for The Valdorian newspaper.
 */

import {
    SECTIONS,
    EVENT_TYPES,
    HEADLINE_TEMPLATES,
    LEDE_TEMPLATES,
    BODY_BLOCK_TEMPLATES,
    QUOTE_TEMPLATES,
    DEVELOPING_PREFIXES,
    OPINION_TRIGGERS,
    REPORTERS,
    WORD_POOLS,
    selectTemplate,
    fillTemplate,
    pickReporter,
    drawFromPool,
} from './valdorian-templates.js';

// ════════════════════════════════════════════════════════════════
// TOPIC TRACKER (developing story detection)
// ════════════════════════════════════════════════════════════════

const topicTracker = {};

/**
 * Record topic tags from an event and return developing story info if applicable.
 */
export function trackTopics(nationId, tick, topicTags) {
    if (!topicTracker[nationId]) topicTracker[nationId] = {};
    const tracker = topicTracker[nationId];

    let developingStory = null;

    for (const tag of (topicTags || [])) {
        if (!tracker[tag]) {
            tracker[tag] = { count: 1, first_tick: tick, last_tick: tick };
        } else {
            tracker[tag].count++;
            tracker[tag].last_tick = tick;
        }

        // Prune old entries (only count within 8-tick window)
        if (tick - tracker[tag].first_tick > 8) {
            tracker[tag].count = Math.max(1, tracker[tag].count - 1);
            tracker[tag].first_tick = tick - 7;
        }

        // Developing story: 3+ events in 5-tick window
        if (tracker[tag].count >= 3 && (tick - tracker[tag].first_tick) <= 5) {
            developingStory = {
                topic: tag,
                count: tracker[tag].count,
                since_tick: tracker[tag].first_tick,
            };
        }
    }

    return developingStory;
}

// ════════════════════════════════════════════════════════════════
// CRISIS EVENT BUILDERS
// ════════════════════════════════════════════════════════════════

/**
 * Build a Valdorian event object from an active_crises record + crisis_template.
 */
export function buildCrisisStartedEvent(template, nationName, pmName, currentTick) {
    const triggers = template.crisis_triggers || [];
    const triggerDesc = triggers.map(t =>
        `${t.stat_key.replace(/_/g, ' ')} ${t.operator === 'gte' ? 'rose above' : 'fell below'} ${t.threshold}`
    ).join(' and ');

    const effects = template.crisis_effects || [];
    const worstEffect = effects.reduce((worst, e) =>
        Math.abs(e.change_per_tick) > Math.abs(worst?.change_per_tick || 0) ? e : worst
    , effects[0]);

    return {
        event_type: 'crisis_started',
        section: isFiscalCrisis(template.name) ? 'economy' : 'politics',
        tier: 1,
        topic_tags: ['crisis', guessCrisisTopic(template.name)],
        nation_name: nationName,
        pm_name: pmName || 'the Prime Minister',
        crisis_name: template.name,
        crisis_type: template.crisis_type || 'stat',
        severity: guessSeverity(effects),
        trigger_description: triggerDesc || 'key indicators crossing critical thresholds',
        worst_affected_stat: worstEffect ? worstEffect.stat_key?.replace(/_/g, ' ') : 'multiple indicators',
        tick: currentTick,
    };
}

export function buildCrisisOngoingEvent(template, activeRecord, nationName, pmName, currentTick) {
    const duration = currentTick - (activeRecord.started_at_tick || currentTick);
    const effects = template.crisis_effects || [];
    const worstEffect = effects.reduce((worst, e) =>
        Math.abs(e.change_per_tick) > Math.abs(worst?.change_per_tick || 0) ? e : worst
    , effects[0]);

    return {
        event_type: 'crisis_ongoing',
        section: isFiscalCrisis(template.name) ? 'economy' : 'politics',
        tier: duration > 5 ? 1 : 2,
        topic_tags: ['crisis', guessCrisisTopic(template.name)],
        nation_name: nationName,
        pm_name: pmName || 'the Prime Minister',
        crisis_name: template.name,
        duration_ticks: duration,
        worst_affected_stat: worstEffect ? worstEffect.stat_key?.replace(/_/g, ' ') : 'multiple indicators',
        approval_delta: 0,
        tick: currentTick,
    };
}

export function buildCrisisResolvedEvent(template, activeRecord, nationName, pmName, currentTick) {
    const duration = currentTick - (activeRecord.started_at_tick || currentTick);
    const effects = template.crisis_effects || [];
    const worstEffect = effects.reduce((worst, e) =>
        Math.abs(e.change_per_tick) > Math.abs(worst?.change_per_tick || 0) ? e : worst
    , effects[0]);

    return {
        event_type: 'crisis_resolved',
        section: isFiscalCrisis(template.name) ? 'economy' : 'politics',
        tier: 2,
        topic_tags: ['crisis', guessCrisisTopic(template.name)],
        nation_name: nationName,
        pm_name: pmName || 'the Prime Minister',
        crisis_name: template.name,
        duration_ticks: duration,
        worst_affected_stat: worstEffect ? worstEffect.stat_key?.replace(/_/g, ' ') : 'multiple indicators',
        tick: currentTick,
    };
}


/**
 * Build a sovereign default event object.
 */
export function buildSovereignDefaultEvent(nationName, defaultType, repaymentRate, debtToGdp, creditPenalty, currencyPenalty, currentTick) {
    return {
        event_type: 'sovereign_default',
        section: 'economy',
        tier: 1,
        topic_tags: ['crisis', 'economy', 'default'],
        nation_name: nationName,
        default_type: defaultType,
        repayment_rate: repaymentRate,
        debt_to_gdp: debtToGdp,
        credit_penalty: creditPenalty,
        currency_penalty: currencyPenalty,
        tick: currentTick,
    };
}

// ════════════════════════════════════════════════════════════════
// DEFAULT / INACTION EVENT BUILDERS
// ════════════════════════════════════════════════════════════════

/**
 * Build a stat decay event for when a nation stat drifts with no policy action.
 */
export function buildStatDecayEvent(nationName, statName, statValue, decayAmount, currentTick) {
    return {
        event_type: 'default_stat_decay',
        section: 'economy',
        tier: 3,
        topic_tags: [guessCrisisTopic(statName)],
        nation_name: nationName,
        stat_name: statName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        stat_value: Math.round(statValue * 10) / 10,
        decay_amount: Math.round(decayAmount * 10) / 10,
        tick: currentTick,
    };
}

/**
 * Build a momentum decay event for a party that took no action.
 */
export function buildMomentumDecayEvent(partyName, nationName, currentTick) {
    return {
        event_type: 'default_momentum_decay',
        section: 'politics',
        tier: 3,
        topic_tags: ['election'],
        party_name: partyName,
        nation_name: nationName,
        rival_active: false,
        tick: currentTick,
    };
}

/**
 * Build a budget stalemate event for tick(s) without budget passage.
 */
export function buildBudgetStallEvent(nationName, pmName, stallDuration, currentTick) {
    return {
        event_type: 'default_budget_stall',
        section: 'economy',
        tier: stallDuration > 3 ? 2 : 3,
        topic_tags: ['budget'],
        nation_name: nationName,
        pm_name: pmName || 'the Prime Minister',
        stall_duration: stallDuration,
        tick: currentTick,
    };
}

/**
 * Build a general government inaction event.
 */
export function buildInactionEvent(nationName, pmName, unusedAp, issueName, currentTick) {
    return {
        event_type: 'default_inaction',
        section: 'politics',
        tier: 3,
        topic_tags: ['governance'],
        nation_name: nationName,
        pm_name: pmName || 'the Prime Minister',
        unused_ap: unusedAp,
        issue_name: issueName || 'pressing national issues',
        tick: currentTick,
    };
}

// ════════════════════════════════════════════════════════════════
// ARTICLE GENERATOR
// ════════════════════════════════════════════════════════════════

let articleCounter = 0;

/**
 * Generate a full Valdorian article object from a structured event.
 *
 * @param {object} eventData - The event object with all variables populated
 * @returns {object} Article object ready for rendering
 */
export function generateArticle(eventData) {
    const eventType = eventData.event_type;
    const meta = EVENT_TYPES[eventType];
    if (!meta) return null;

    const section = eventData.section || meta.section;
    const tier = eventData.tier || meta.tier;
    articleCounter++;

    // 1. Headline
    const headlineTemplates = HEADLINE_TEMPLATES[eventType] || [];
    const headlineTpl = selectTemplate(headlineTemplates, eventData);
    const headline = headlineTpl ? fillTemplate(headlineTpl.template, eventData) : meta.label;

    // 2. Subheadline (Tier 1 only, optional — use first lede sentence as fallback)
    let subheadline = null;

    // 3. Lede
    const ledeTemplates = LEDE_TEMPLATES[eventType] || [];
    const ledeTpl = selectTemplate(ledeTemplates, eventData);
    let lede = ledeTpl ? fillTemplate(ledeTpl.template, eventData) : null;

    // Developing story prefix
    const developing = trackTopics(
        eventData.nation_id || eventData.nation_name,
        eventData.tick || 0,
        eventData.topic_tags
    );
    if (developing && lede) {
        const prefix = DEVELOPING_PREFIXES[Math.floor(Math.random() * DEVELOPING_PREFIXES.length)];
        lede = fillTemplate(prefix, { ...eventData, topic: developing.topic }) + lede.charAt(0).toLowerCase() + lede.slice(1);
    }

    // 4. Body paragraphs (Tier 1 only)
    let bodyParagraphs = [];
    if (tier === 1) {
        const blockDefs = BODY_BLOCK_TEMPLATES[eventType];
        if (blockDefs) {
            const blockOrder = ['context', 'action', 'impact_domestic', 'reaction_support', 'reaction_oppose', 'impact_international', 'historical_context', 'escalation_warning'];
            for (const blockName of blockOrder) {
                const blocks = blockDefs[blockName];
                if (!blocks) continue;
                // Skip opposition reaction blocks if no opposition leader is available
                if (blockName === 'reaction_oppose' && !eventData.opposition_leader) continue;
                for (const block of blocks) {
                    if (block.required || Math.random() > 0.3) {
                        bodyParagraphs.push(fillTemplate(block.template, eventData));
                    }
                }
            }
        }
    }

    // 5. Quotes (Tier 1-2 for crisis events)
    let quotes = [];
    if (tier <= 2 && eventData.opposition_leader) {
        const hostileTpl = QUOTE_TEMPLATES.hostile[Math.floor(Math.random() * QUOTE_TEMPLATES.hostile.length)];
        quotes.push({
            posture: 'hostile',
            text: fillTemplate(hostileTpl, { ...eventData, spokesperson: eventData.opposition_leader }),
        });
    }

    // 6. Reporter
    const reporter = pickReporter(section);

    // 7. Build article
    return {
        article_id: `art_${articleCounter.toString().padStart(4, '0')}`,
        event_type: eventType,
        tier,
        section,
        section_label: SECTIONS[section]?.label || section,
        section_color: SECTIONS[section]?.color || '#94A3B8',
        nation: eventData.nation_name || eventData.nation_id,
        tick: eventData.tick || 0,

        headline,
        subheadline,
        byline: { reporter, time: 'Just now' },
        lede,
        body_paragraphs: bodyParagraphs,
        quotes,

        topic_tags: eventData.topic_tags || [],
        developing_story: developing,
    };
}

/**
 * Generate an opinion/editorial article from a game condition trigger.
 */
export function generateOpinion(nationName, conditionKey, eventData) {
    const trigger = OPINION_TRIGGERS.find(t => t.condition === conditionKey);
    if (!trigger) return null;

    const headline = fillTemplate(trigger.headline, eventData);
    articleCounter++;

    return {
        article_id: `art_${articleCounter.toString().padStart(4, '0')}`,
        event_type: 'opinion',
        tier: 2,
        section: 'opinion',
        section_label: 'Opinion',
        section_color: SECTIONS.opinion.color,
        nation: nationName,
        tick: eventData.tick || 0,

        headline,
        subheadline: null,
        byline: { reporter: 'The Valdorian Editorial Board', time: 'Today' },
        lede: null,
        body_paragraphs: [],
        quotes: [],

        topic_tags: [trigger.topic],
        developing_story: null,
    };
}

// ════════════════════════════════════════════════════════════════
// BATCH GENERATION (per-tick)
// ════════════════════════════════════════════════════════════════

/**
 * Generate all articles for a tick from a list of events.
 * Enforces: max 1 Tier 1 hero, max 1 opinion per nation.
 */
export function generateTickArticles(events) {
    const articles = [];
    let heroUsed = false;
    let opinionUsed = false;

    // Sort by priority (tier 1 first, then by event priority)
    const sorted = [...events].sort((a, b) => (a.tier || 4) - (b.tier || 4));

    for (const evt of sorted) {
        const article = generateArticle(evt);
        if (!article) continue;

        // Enforce hero limit
        if (article.tier === 1) {
            if (heroUsed) {
                article.tier = 2; // demote to prominent Tier 2
            } else {
                heroUsed = true;
            }
        }

        articles.push(article);
    }

    return articles;
}

// ════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════

function isFiscalCrisis(name) {
    const fiscal = ['currency', 'inflation', 'debt', 'default', 'budget', 'economic', 'recession', 'gdp'];
    const lower = (name || '').toLowerCase();
    return fiscal.some(k => lower.includes(k));
}

function guessCrisisTopic(name) {
    const lower = (name || '').toLowerCase();
    if (lower.includes('inflation') || lower.includes('currency') || lower.includes('debt') || lower.includes('gdp') || lower.includes('economic')) return 'economy';
    if (lower.includes('health')) return 'healthcare';
    if (lower.includes('education')) return 'education';
    if (lower.includes('military') || lower.includes('defense')) return 'military';
    if (lower.includes('crime') || lower.includes('unrest')) return 'crime';
    if (lower.includes('environment') || lower.includes('pollution')) return 'environment';
    return 'governance';
}

function guessSeverity(effects) {
    if (!effects || effects.length === 0) return 'moderate';
    const totalDamage = effects.reduce((s, e) => s + Math.abs(e.change_per_tick || 0), 0);
    if (totalDamage >= 8) return 'critical';
    if (totalDamage >= 5) return 'severe';
    if (totalDamage >= 2) return 'moderate';
    return 'minor';
}

// ════════════════════════════════════════════════════════════════
// PROTEST EVENT BUILDERS
// ════════════════════════════════════════════════════════════════

const TIER_LABELS = {
    1: 'Embarrassing Fizzle', 2: 'Modest Showing', 3: 'Respectable Turnout',
    4: 'Strong Protest', 5: 'Mass Demonstration', 6: 'Historic Protest', 7: 'Nationwide Protest',
};

function protestEventType(tier) {
    if (tier <= 2) return 'protest_fizzle';
    if (tier === 3) return 'protest_respectable';
    if (tier === 4) return 'protest_strong';
    if (tier === 5) return 'protest_mass';
    return 'protest_crisis_started';
}

/**
 * Build a Valdorian event for a resolved protest (tiers 1-7).
 */
export function buildProtestResolvedEvent(opts) {
    const { tier, turnoutScore, conditionScore, partyName, nationName,
        grievanceLabel, demandLabel, endorsementCount, crisisCreated, currentTick } = opts;

    const eventType = crisisCreated ? 'protest_crisis_started' : protestEventType(tier);
    const tierNum = tier || 3;
    const articleTier = tierNum >= 6 ? 1 : tierNum >= 4 ? 2 : 3;

    return {
        event_type: eventType,
        section: 'politics',
        tier: articleTier,
        topic_tags: ['protest', tierNum >= 6 ? 'crisis' : 'opposition'],
        nation_name: nationName,
        party_name: partyName,
        grievance_label: grievanceLabel || 'government policy',
        demand_label: demandLabel || '',
        demand_window: 6,
        turnout_score: Math.round(turnoutScore || 0),
        condition_score: Math.round(conditionScore || 0),
        protest_tier: tierNum,
        tier_label: TIER_LABELS[tierNum] || 'Protest',
        endorsement_count: endorsementCount || 0,
        tick: currentTick,
    };
}

/**
 * Build event for an ongoing protest crisis tick.
 */
export function buildProtestCrisisTickEvent(opts) {
    const { tier, ticksActive, partyName, nationName, currentTick } = opts;
    return {
        event_type: 'protest_crisis_tick',
        section: 'politics',
        tier: 2,
        topic_tags: ['protest', 'crisis'],
        nation_name: nationName,
        party_name: partyName,
        tier_label: TIER_LABELS[tier] || 'Protest Crisis',
        ticks_active: ticksActive,
        tick: currentTick,
    };
}

/**
 * Build event for when a protest crisis ends (natural expiry or demand met).
 */
export function buildProtestCrisisEndedEvent(opts) {
    const { tier, ticksActive, partyName, nationName, demandMet, currentTick } = opts;
    return {
        event_type: 'protest_crisis_ended',
        section: 'politics',
        tier: 2,
        topic_tags: ['protest', 'crisis'],
        nation_name: nationName,
        party_name: partyName,
        tier_label: TIER_LABELS[tier] || 'Protest',
        ticks_active: ticksActive,
        demand_met: !!demandMet,
        tick: currentTick,
    };
}

/**
 * Build event for EPO resolving a protest crisis.
 */
export function buildProtestEPOResolvedEvent(nationName, currentTick) {
    return {
        event_type: 'protest_epo_resolved',
        section: 'politics',
        tier: 1,
        topic_tags: ['protest', 'crisis', 'crackdown'],
        nation_name: nationName,
        tick: currentTick,
    };
}

/**
 * Build event for EPO escalating a protest to Tier 7.
 */
export function buildProtestEPOEscalatedEvent(nationName, demandLabel, currentTick) {
    return {
        event_type: 'protest_epo_escalated',
        section: 'politics',
        tier: 1,
        topic_tags: ['protest', 'crisis', 'crackdown', 'escalation'],
        nation_name: nationName,
        demand_label: demandLabel || '',
        tick: currentTick,
    };
}

/**
 * Build event for National Emergency ending a protest.
 */
export function buildProtestEmergencyEvent(nationName, currentTick) {
    return {
        event_type: 'protest_emergency',
        section: 'politics',
        tier: 1,
        topic_tags: ['protest', 'crisis', 'emergency'],
        nation_name: nationName,
        tick: currentTick,
    };
}

/**
 * Build event for calling off a protest.
 */
export function buildProtestCalledOffEvent(partyName, nationName, currentTick) {
    return {
        event_type: 'protest_called_off',
        section: 'politics',
        tier: 2,
        topic_tags: ['protest'],
        nation_name: nationName,
        party_name: partyName,
        tick: currentTick,
    };
}

/**
 * Build event for a Public Address during a crisis.
 */
export function buildProtestPublicAddressEvent(nationName, ticksActive, currentTick) {
    return {
        event_type: 'protest_public_address',
        section: 'politics',
        tier: 3,
        topic_tags: ['protest', 'crisis'],
        nation_name: nationName,
        ticks_active: ticksActive,
        tick: currentTick,
    };
}
