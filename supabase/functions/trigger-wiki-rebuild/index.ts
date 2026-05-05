// trigger-wiki-rebuild
//
// Calls GitHub's workflow_dispatch API to kick off the Pages deploy
// workflow, which re-runs scripts/generate-wiki-pages.js and
// republishes the static wiki-SLUG.html files. Invoked by
// wiki-edit.html's save handler after a successful page edit so
// public URLs refresh within ~2 minutes of an in-app edit instead of
// only at the next code push.
//
// Auth: requires a valid Supabase JWT (default --verify-jwt). Anyone
// who can edit the wiki via the in-app editor can call this; the
// underlying wiki_pages RLS policy already gates that. We don't need
// finer-grained checks here — the worst a malicious authenticated
// user can do is spam Actions runs, and the deploy.yml workflow
// already has `concurrency: { group: "pages", cancel-in-progress:
// false }` which queues redundant fires.
//
// Required Supabase secrets:
//   GITHUB_PAT          fine-grained PAT scoped to the repo with
//                       actions:write
//   GITHUB_REPO         "TherranT11/nationhood" (owner/repo)
//   GITHUB_WORKFLOW     filename of the workflow to dispatch, e.g.
//                       "deploy.yml"
//   GITHUB_REF          branch to dispatch against, defaults to "main"

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: CORS_HEADERS });
    }
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'POST only' }), {
            status: 405,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
    }

    const pat = Deno.env.get('GITHUB_PAT');
    const repo = Deno.env.get('GITHUB_REPO');
    const workflow = Deno.env.get('GITHUB_WORKFLOW') || 'deploy.yml';
    const ref = Deno.env.get('GITHUB_REF') || 'main';

    if (!pat || !repo) {
        return new Response(JSON.stringify({
            error: 'Server misconfigured: GITHUB_PAT and GITHUB_REPO secrets are required.',
        }), {
            status: 500,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
    }

    const url = `https://api.github.com/repos/${repo}/actions/workflows/${workflow}/dispatches`;
    let ghRes: Response;
    try {
        ghRes = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${pat}`,
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28',
                'Content-Type': 'application/json',
                'User-Agent': 'nationhood-wiki-rebuild/1.0',
            },
            body: JSON.stringify({ ref }),
        });
    } catch (err) {
        return new Response(JSON.stringify({
            error: 'Network error calling GitHub: ' + (err instanceof Error ? err.message : String(err)),
        }), {
            status: 502,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
    }

    // GitHub returns 204 No Content on a successful dispatch. Anything
    // else is an error worth surfacing — most commonly 401 (bad PAT),
    // 404 (workflow filename wrong), 422 (ref doesn't exist).
    if (ghRes.status !== 204) {
        const body = await ghRes.text().catch(() => '');
        return new Response(JSON.stringify({
            error: `GitHub dispatch failed: ${ghRes.status} ${ghRes.statusText}`,
            detail: body.slice(0, 500),
        }), {
            status: 502,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify({ ok: true, dispatched_to: ref }), {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
});
