// @ts-nocheck
/**
 * Supabase Edge Function: advance-tick
 *
 * Server-side tick processor for Nationhood Alpha.
 * Called by pg_cron every minute — checks if next_tick_at has passed,
 * acquires a database lock, and processes the full game tick.
 *
 * AUTO-GENERATED — do not edit index.ts directly.
 * Source: js/game-common.js + supabase/functions/advance-tick/handler-template.ts
 * Regenerate with: node scripts/sync-edge-function.js
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ===== GAME LOGIC (from js/game-common.js) =====

// __GAME_COMMON_JS__

// ===== END GAME LOGIC =====


// ===== INTEGRITY CHECKS =====

const CANONICAL_TEMPLATE_GOV_TYPES = ['Democracy', 'Autocracy', 'Presidential'];
const TEMPLATE_GOV_TYPE_ALIASES = {
    democracy: 'Democracy',
    democratic: 'Democracy',
    parliamentary: 'Democracy',
    parliamentarian: 'Democracy',
    'parliamentary democracy': 'Democracy',
    autocracy: 'Autocracy',
    authoritarian: 'Autocracy',
    authoritarianism: 'Autocracy',
    dictatorship: 'Autocracy',
    dictatorial: 'Autocracy',
    'military junta': 'Autocracy',
    presidential: 'Presidential',
    'presidential republic': 'Presidential',
    'executive presidency': 'Presidential'
};

async function runMinistryEventTemplateGovTypeIntegrityCheck(supabase) {
    try {
        const { data: templates, error } = await supabase
            .from('ministry_event_templates')
            .select('id, event_key, gov_types, is_active');

        if (error) {
            console.error('[Integrity][ministry_event_templates] Failed to load template gov types:', error.message);
            return;
        }

        const unknownByTemplate = [];
        const distinctGovTypes = new Set();

        for (const tmpl of (templates || [])) {
            const values = Array.isArray(tmpl.gov_types) ? tmpl.gov_types : [];
            const unknown = [];
            for (const raw of values) {
                const trimmed = String(raw || '').trim();
                if (!trimmed) continue;
                distinctGovTypes.add(trimmed);
                const isCanonical = CANONICAL_TEMPLATE_GOV_TYPES.includes(trimmed);
                const isAlias = Object.prototype.hasOwnProperty.call(TEMPLATE_GOV_TYPE_ALIASES, trimmed.toLowerCase());
                if (!isCanonical && !isAlias) unknown.push(trimmed);
            }
            if (unknown.length > 0) {
                unknownByTemplate.push({
                    id: tmpl.id,
                    event_key: tmpl.event_key,
                    is_active: tmpl.is_active,
                    unknown_gov_types: [...new Set(unknown)].sort()
                });
            }
        }

        const distinctList = [...distinctGovTypes].sort();
        console.log('[Integrity][ministry_event_templates] Distinct template gov_types:', JSON.stringify(distinctList));
        console.log('[Integrity][ministry_event_templates] Canonical gov_types:', JSON.stringify(CANONICAL_TEMPLATE_GOV_TYPES));

        if (unknownByTemplate.length > 0) {
            console.error(
                `[Integrity][ministry_event_templates] UNKNOWN gov_types detected in ${unknownByTemplate.length} template(s). ` +
                `Canonical values: ${CANONICAL_TEMPLATE_GOV_TYPES.join(', ')}. ` +
                'Offenders:',
                JSON.stringify(unknownByTemplate)
            );
        }
    } catch (e) {
        console.error('[Integrity][ministry_event_templates] Integrity check failed unexpectedly:', e?.message || e);
    }
}

// ===== EDGE FUNCTION HANDLER =====

Deno.serve(async (req) => {
    const corsHeaders = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    };

    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
        return new Response(
            JSON.stringify({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }),
            { status: 500, headers: corsHeaders }
        );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        // 0. Startup integrity check for ministry template gov_types
        await runMinistryEventTemplateGovTypeIntegrityCheck(supabase);

        // 1. Check for force parameter (admin manual trigger)
        let force = false;
        try {
            const body = await req.json();
            force = body?.force === true;
        } catch (_) {
            // No body or invalid JSON — not forced
        }

        // 2. Check if tick is due (skip check if force=true)
        const { data: shard, error: shardError } = await supabase
            .from("shard")
            .select("next_tick_at, current_tick, tick_processing")
            .eq("name", "Alpha Shard")
            .single();

        if (shardError || !shard) {
            return new Response(
                JSON.stringify({ error: "Shard not found", detail: shardError?.message }),
                { status: 404, headers: corsHeaders }
            );
        }

        if (!force) {
            const now = new Date();
            const nextTickAt = new Date(shard.next_tick_at);

            if (now < nextTickAt) {
                return new Response(
                    JSON.stringify({
                        status: "not_due",
                        current_tick: shard.current_tick,
                        next_tick_at: shard.next_tick_at,
                        time_remaining_ms: nextTickAt.getTime() - now.getTime(),
                    }),
                    { headers: corsHeaders }
                );
            }
        }

        // 3. Tick is due (or forced) — acquire lock
        const lockAcquired = await acquireTickLock(supabase);
        if (!lockAcquired) {
            return new Response(
                JSON.stringify({
                    status: "locked",
                    message: "Another process is already processing the tick",
                }),
                { headers: corsHeaders }
            );
        }

        // 4. Process the tick
        try {
            const summary = await advanceTick(supabase);
            console.log(
                `[advance-tick] Tick ${summary.tick} processed (${summary.nations} nations)`
            );
            return new Response(
                JSON.stringify({ status: "success", summary }),
                { headers: corsHeaders }
            );
        } catch (e) {
            console.error("[advance-tick] Tick processing failed:", e);
            return new Response(
                JSON.stringify({ error: e.message }),
                { status: 500, headers: corsHeaders }
            );
        } finally {
            await releaseTickLock(supabase);
        }
    } catch (error) {
        console.error("[advance-tick] Edge function error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: corsHeaders }
        );
    }
});
