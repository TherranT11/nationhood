// forum-thread-discord
//
// Receives a forum-thread payload from create_forum_thread (via
// pg_net.http_post inside the SECURITY DEFINER RPC) and forwards a
// compact embed to a configured Discord webhook.
//
// Auth: shared bearer secret. The RPC sends the secret in the
// Authorization header; we compare it against FORUM_DISCORD_EDGE_SECRET.
// The function is deployed with --no-verify-jwt because the RPC isn't
// holding a Supabase user JWT — it's the database calling out — so
// the shared secret is the only auth layer. If a bad actor learns the
// edge URL they still can't post without the secret, and rotating the
// secret is a one-line UPDATE on system_config + a redeploy of the
// edge function with the new env var.
//
// Required Supabase secrets:
//   FORUM_DISCORD_EDGE_SECRET     — must match system_config row
//                                    'forum_discord_edge_secret'
//   DISCORD_FORUM_WEBHOOK_URL     — Discord channel webhook URL
//
// Expected JSON body:
//   {
//     "title":         "<thread title>",
//     "author_name":   "<resolved display name>",
//     "category_name": "<e.g. Press & Publications>",
//     "thread_url":    "https://nationhoodgame.com/politician-forum-thread.html?id=<uuid>"
//   }
//
// Reply: { ok: true } on success, or { ok: false, reason } with a
// 4xx/5xx status on failure. The calling RPC is fire-and-forget via
// pg_net, so failures don't block thread creation — they're visible
// in net.http_response.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function respond(status: number, body: Record<string, unknown>): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...CORS, 'Content-Type': 'application/json' },
    });
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
    if (req.method !== 'POST') {
        return respond(405, { ok: false, reason: 'method_not_allowed' });
    }

    const secret      = Deno.env.get('FORUM_DISCORD_EDGE_SECRET') || '';
    const webhookUrl  = Deno.env.get('DISCORD_FORUM_WEBHOOK_URL') || '';
    if (!secret || !webhookUrl) {
        return respond(500, { ok: false, reason: 'env_not_configured' });
    }

    const auth = req.headers.get('authorization') || '';
    if (!auth.startsWith('Bearer ') || auth.slice(7) !== secret) {
        return respond(401, { ok: false, reason: 'unauthorized' });
    }

    let payload: { title?: string; author_name?: string; category_name?: string; thread_url?: string };
    try {
        payload = await req.json();
    } catch {
        return respond(400, { ok: false, reason: 'invalid_json' });
    }
    const title    = (payload.title    || '').toString().trim();
    const author   = (payload.author_name   || 'Anonymous').toString().trim();
    const category = (payload.category_name || '').toString().trim();
    const url      = (payload.thread_url    || '').toString().trim();
    if (!title || !url) {
        return respond(400, { ok: false, reason: 'missing_fields' });
    }

    // Compact one-line Discord message: title + author + link. Wrapped
    // in an embed so the URL renders as a clickable card with the
    // category as the embed's footer.
    const discordBody = {
        embeds: [{
            title:       title.slice(0, 256),
            url:         url,
            description: `by **${author.slice(0, 200)}**`,
            color:       0x5aafa5,  // politician brand teal — matches the in-app pills
            footer:      category ? { text: category.slice(0, 2048) } : undefined,
            timestamp:   new Date().toISOString(),
        }],
    };

    try {
        const resp = await fetch(webhookUrl, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(discordBody),
        });
        if (!resp.ok) {
            const text = await resp.text().catch(() => '');
            return respond(502, { ok: false, reason: 'discord_rejected', status: resp.status, body: text.slice(0, 500) });
        }
    } catch (e) {
        return respond(502, { ok: false, reason: 'discord_unreachable', error: (e as Error).message });
    }

    return respond(200, { ok: true });
});
