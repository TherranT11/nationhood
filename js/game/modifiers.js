// National Modifiers — characterization layer for nations.
//
// Each modifier_template defines a named situation a nation can be
// in (e.g. "Booming Economy"). The runtime here flips that template
// on/off for a nation by maintaining an active_modifiers row:
//
//   ACTIVATE   when ALL of the template's modifier_triggers      hold
//   DEACTIVATE when ALL of the template's modifier_end_triggers  hold
//
// End triggers use DIFFERENT thresholds from activation triggers
// (hysteresis — trigger at GDP >= 6, end at GDP <= 3) so a nation
// sitting right on the boundary doesn't flicker on/off every tick.
//
// What this module does NOT do
// ────────────────────────────
// No per-tick stat changes. Modifiers are pure characterization —
// the `effects` column on modifier_templates is a free-text array
// of prose labels rendered on the user-facing page, NOT structured
// stat deltas.
//
// Stat key resolution
// ───────────────────
// Trigger stat_keys are routed through normalizeNationStatKey so
// legacy aliases (e.g. workforce → unskilled_workers) keep working
// if an admin ever types one. Unknown / DELETED stat keys (where
// the alias maps to null) cause the modifier to NEVER trigger —
// the trigger check fails and the modifier stays inactive. We don't
// silently activate on a missing-stat lookup.
//
// Call site
// ─────────
// Invoked once per nation per tick from the advance-tick edge
// function handler (scripts/advance-tick-handler-template.ts).
// Bundled into the edge function via scripts/sync-edge-function.js.

import { normalizeNationStatKey } from './stats.js';

// Internal: ALL rows must evaluate true. Returns false on the first
// failure, or if there are zero rows (so freshly-created modifiers
// without configured triggers don't auto-activate or auto-deactivate).
function allConditionsHold(rows, nation) {
    if (!Array.isArray(rows) || rows.length === 0) return false;
    for (const row of rows) {
        const resolved = normalizeNationStatKey(row.stat_key) || row.stat_key;
        const raw = nation[resolved];
        if (raw === null || raw === undefined) return false;
        const val = Number(raw);
        if (!Number.isFinite(val)) return false;
        const thr = Number(row.threshold);
        if (row.operator === 'gte' && val < thr) return false;
        if (row.operator === 'lte' && val > thr) return false;
    }
    return true;
}

// Process one nation's modifier state for the current tick.
//
//   - Loads all active modifier_templates with their triggers + end_triggers
//   - Loads currently-active modifier rows for this nation
//   - For each inactive template: insert active_modifiers row if
//     activation triggers hold
//   - For each active row: delete it if end triggers hold
//
// Display-side severity vocabulary. The DB stores 'green' / 'yellow' /
// 'red' on modifier_templates.severity (CHECK constraint); player
// surfaces render the framing as positive / neutral / negative. Single
// source for that mapping — imported by politician-modifiers.html and
// cabinet-office.html so a rename here lands everywhere at once. An
// unknown key falls through to the raw string so a schema addition
// surfaces visibly rather than blank.
export const SEVERITY_LABELS = {
    green:  'Positive',
    yellow: 'Neutral',
    red:    'Negative',
};

// Returns an array of {type, modifierName, severity, category, tick}
// events for the tick summary. The caller (tick handler) collects
// these into summary.modifiers; they don't get written to event_log
// (modifiers are passive characterization, not in-world events).
export async function processNationalModifiers(supabase, nation, currentTick) {
    const events = [];

    // 1. Load all enabled templates with their conditions
    const { data: templates, error: tmplErr } = await supabase
        .from('modifier_templates')
        .select('id, name, category, severity, is_active, modifier_triggers(*), modifier_end_triggers(*)')
        .eq('is_active', true);

    if (tmplErr) {
        console.warn(`[processNationalModifiers] template load failed for ${nation.name}: ${tmplErr.message}`);
        return events;
    }
    if (!templates || templates.length === 0) return events;

    // 2. Load currently-active modifier rows for this nation
    const { data: activeRows, error: activeErr } = await supabase
        .from('active_modifiers')
        .select('id, modifier_id')
        .eq('nation_id', nation.id);

    if (activeErr) {
        console.warn(`[processNationalModifiers] active_modifiers load failed for ${nation.name}: ${activeErr.message}`);
        return events;
    }

    const activeMap = {};
    for (const row of (activeRows || [])) {
        activeMap[row.modifier_id] = row;
    }

    // 3. Walk every template. Activate inactive ones whose triggers
    //    hold; deactivate active ones whose end-triggers hold.
    for (const tmpl of templates) {
        const isActive    = !!activeMap[tmpl.id];
        const triggers    = tmpl.modifier_triggers     || [];
        const endTriggers = tmpl.modifier_end_triggers || [];

        if (!isActive) {
            // Activation check
            if (!allConditionsHold(triggers, nation)) continue;

            const { error: insErr } = await supabase
                .from('active_modifiers')
                .insert({
                    modifier_id:     tmpl.id,
                    nation_id:       nation.id,
                    started_at_tick: currentTick,
                });

            if (insErr) {
                // Most likely the unique constraint — another concurrent
                // tick beat us. Log and move on.
                console.warn(`[processNationalModifiers] activate "${tmpl.name}" failed for ${nation.name}: ${insErr.message}`);
                continue;
            }

            events.push({
                type:         'modifier_activated',
                modifierName: tmpl.name,
                severity:     tmpl.severity,
                category:     tmpl.category,
                tick:         currentTick,
            });
            console.log(`[processNationalModifiers] Activated "${tmpl.name}" on ${nation.name} (tick ${currentTick})`);
        } else {
            // Deactivation check — only if end-triggers exist AND all hold.
            // A template with zero end-triggers is "sticky" and will only
            // come off via admin delete. That's intentional (matches the
            // semantics of allConditionsHold for empty arrays).
            if (!allConditionsHold(endTriggers, nation)) continue;

            const { error: delErr } = await supabase
                .from('active_modifiers')
                .delete()
                .eq('id', activeMap[tmpl.id].id);

            if (delErr) {
                console.warn(`[processNationalModifiers] deactivate "${tmpl.name}" failed for ${nation.name}: ${delErr.message}`);
                continue;
            }

            events.push({
                type:         'modifier_deactivated',
                modifierName: tmpl.name,
                severity:     tmpl.severity,
                category:     tmpl.category,
                tick:         currentTick,
            });
            console.log(`[processNationalModifiers] Deactivated "${tmpl.name}" on ${nation.name} (tick ${currentTick})`);
        }
    }

    return events;
}
