#!/usr/bin/env node
// Apply the three equity-feature RPC migrations via the pg package.
// Bypasses the Supabase SQL Editor for environments where it misparses
// plpgsql function bodies (surfaces as "relation v_request does not exist").
//
// Usage:
//   DATABASE_URL="postgres://postgres.<ref>:<pw>@<host>:5432/postgres" \
//       node scripts/apply-equity-rpcs.mjs
//
// Safe to re-run — every file uses CREATE OR REPLACE FUNCTION and
// DROP CONSTRAINT IF EXISTS / ADD CONSTRAINT patterns, so re-applying
// is a no-op.

import pg from 'pg';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '..');

const FILES = [
    'sql/migrations/20260419_equity_buy_in_rpc.sql',
    'sql/migrations/20260419_equity_secondary_market.sql',
    'sql/migrations/20260419_equity_phase10_hardening.sql',
];

async function main() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error('Missing DATABASE_URL. Get the Direct connection string from');
        console.error('Supabase → Project → Connect → Direct and run:');
        console.error('  DATABASE_URL="<conn-string>" node scripts/apply-equity-rpcs.mjs');
        process.exit(1);
    }

    const client = new pg.Client({ connectionString: url });
    try {
        await client.connect();
    } catch (err) {
        console.error('Connection failed:', err.message);
        console.error('Double-check the connection string (password, host, port).');
        process.exit(1);
    }

    let ok = 0;
    let fail = 0;

    for (const rel of FILES) {
        const abs = resolve(repoRoot, rel);
        let sql;
        try {
            sql = readFileSync(abs, 'utf8');
        } catch (err) {
            console.error(`[skip]  ${rel} — file not found: ${err.message}`);
            fail++;
            continue;
        }

        process.stdout.write(`[run]   ${rel} ... `);
        try {
            await client.query(sql);
            console.log('OK');
            ok++;
        } catch (err) {
            console.log('FAIL');
            console.error(`        ${err.message}`);
            fail++;
        }
    }

    await client.end();

    console.log('');
    console.log(`${ok} succeeded, ${fail} failed`);

    if (fail === 0) {
        console.log('');
        console.log('Verify:');
        console.log('  SELECT proname, pronargs, prosecdef FROM pg_proc');
        console.log("  WHERE proname IN ('buy_equity_stake', 'buy_listed_equity_stake');");
        console.log('Expected: two rows, both prosecdef=true.');
    }

    process.exit(fail > 0 ? 1 : 0);
}

main().catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
});
