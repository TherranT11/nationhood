#!/usr/bin/env node

/**
 * migrate-work.js
 *
 * Runs all SQL migration files against the Work Supabase database.
 * Migrations use IF NOT EXISTS / IF EXISTS patterns, so safe to re-run.
 *
 * Prerequisites:
 *   1. .env.work must exist with VITE_SUPABASE_URL and VITE_WORK_SERVICE_ROLE_KEY
 *   2. The exec_migration() RPC must be installed in the Work DB.
 *      Run sql/create_exec_migration.sql in the Work SQL Editor first.
 *
 * Usage: npm run migrate:work
 */

const fs = require('fs');
const path = require('path');

// ── Load .env.work ─────────────────────────────────────────────────
const envPath = path.resolve(__dirname, '..', '.env.work');
if (!fs.existsSync(envPath)) {
    console.error('ERROR: .env.work not found. Create it first with your Work Supabase credentials.');
    process.exit(1);
}
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
        env[trimmed.substring(0, eqIdx)] = trimmed.substring(eqIdx + 1);
    }
}

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.VITE_WORK_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || SUPABASE_URL.startsWith('<')) {
    console.error('ERROR: VITE_SUPABASE_URL not set in .env.work.');
    process.exit(1);
}
if (!SERVICE_ROLE_KEY || SERVICE_ROLE_KEY.startsWith('<')) {
    console.error('ERROR: VITE_WORK_SERVICE_ROLE_KEY not set in .env.work.');
    process.exit(1);
}

// ── Main ───────────────────────────────────────────────────────────
async function main() {
    let createClient;
    try {
        ({ createClient } = require('@supabase/supabase-js'));
    } catch {
        console.error('ERROR: @supabase/supabase-js not found. Run: npm install @supabase/supabase-js');
        process.exit(1);
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    console.log('Connecting to Work Supabase:', SUPABASE_URL);

    // ── Step 0: Install helper RPCs ────────────────────────────────
    // First install exec_migration, admin_reset_tables, and seed_work_data RPCs
    const rpcFiles = [
        'sql/create_exec_migration.sql',
        'sql/create_admin_reset_tables.sql',
        'sql/seed_work_data.sql'
    ];

    console.log('\n[0] Installing helper RPCs...');
    for (const rpcFile of rpcFiles) {
        const filePath = path.resolve(__dirname, '..', rpcFile);
        if (!fs.existsSync(filePath)) {
            console.warn(`  SKIP: ${rpcFile} not found`);
            continue;
        }
        const sql = fs.readFileSync(filePath, 'utf8');
        // For the very first RPC (exec_migration itself), we need to use
        // the REST API directly since the function doesn't exist yet.
        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_migration`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({ sql_text: sql })
        });
        if (!res.ok) {
            const text = await res.text();
            if (rpcFile === 'sql/create_exec_migration.sql') {
                // exec_migration doesn't exist yet — install it via raw SQL endpoint
                console.log(`  Installing exec_migration via raw SQL...`);
                const rawRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_migration`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SERVICE_ROLE_KEY,
                        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
                    },
                    body: JSON.stringify({ sql_text: sql })
                });
                if (!rawRes.ok) {
                    console.error(`  MANUAL STEP REQUIRED: exec_migration() RPC not found.`);
                    console.error(`  Please run sql/create_exec_migration.sql in the Work SQL Editor first.`);
                    process.exit(1);
                }
            } else {
                console.error(`  Failed to install ${rpcFile}: ${text}`);
            }
        } else {
            console.log(`  Installed: ${rpcFile}`);
        }
    }

    // ── Step 1: Collect and sort migration files ───────────────────
    const migrationsDir = path.resolve(__dirname, '..', 'sql', 'migrations');
    if (!fs.existsSync(migrationsDir)) {
        console.error('ERROR: sql/migrations/ directory not found.');
        process.exit(1);
    }

    const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort(); // Lexicographic sort works because filenames are date-prefixed

    console.log(`\n[1] Found ${files.length} migration files.\n`);

    // ── Step 2: Execute each migration ─────────────────────────────
    let applied = 0;
    let skipped = 0;
    let failed = 0;
    const failures = [];

    for (const file of files) {
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');

        const { error } = await supabase.rpc('exec_migration', { sql_text: sql });

        if (error) {
            // Common benign errors: "already exists", "duplicate key", etc.
            const msg = error.message || '';
            const isBenign = msg.includes('already exists')
                || msg.includes('duplicate key')
                || msg.includes('does not exist') // DROP IF EXISTS on missing
                || msg.includes('multiple default values')
                || msg.includes('cannot alter type of a column used by a view');

            if (isBenign) {
                skipped++;
                // Don't log benign skips to reduce noise
            } else {
                failed++;
                failures.push({ file, error: msg });
                console.error(`  FAIL: ${file}`);
                console.error(`        ${msg}`);
            }
        } else {
            applied++;
            console.log(`  OK: ${file}`);
        }
    }

    // ── Summary ────────────────────────────────────────────────────
    console.log('\n════════════════════════════════════════');
    console.log(`  Migration complete!`);
    console.log(`  Applied: ${applied}  |  Skipped (already applied): ${skipped}  |  Failed: ${failed}`);
    console.log('════════════════════════════════════════');

    if (failures.length > 0) {
        console.log('\nFailed migrations:');
        for (const f of failures) {
            console.log(`  - ${f.file}: ${f.error}`);
        }
        console.log('\nYou may need to run these manually in the SQL Editor.');
    }

    console.log('\nNext steps:');
    console.log('  1. If this is a fresh setup, run: npm run seed:work');
    console.log('  2. Start dev server: npm run dev:work');
    console.log('  3. Open http://localhost:3001');
}

main().catch(err => {
    console.error('Migration script failed:', err);
    process.exit(1);
});
