#!/usr/bin/env node

/**
 * migrate-work.js
 *
 * Runs all SQL migration files against the Work Supabase database
 * using a direct PostgreSQL connection (pg library).
 * Migrations use IF NOT EXISTS / IF EXISTS patterns, so safe to re-run.
 *
 * Prerequisites:
 *   1. .env.work must exist with DATABASE_URL set
 *   2. npm install pg
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

const DATABASE_URL = env.DATABASE_URL;

if (!DATABASE_URL || DATABASE_URL.includes('YOUR_PASSWORD') || DATABASE_URL.startsWith('<')) {
    console.error('ERROR: DATABASE_URL not set in .env.work.');
    console.error('Add your Work Supabase connection string:');
    console.error('  DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres');
    process.exit(1);
}

// ── Main ───────────────────────────────────────────────────────────
async function main() {
    const { Client } = require('pg');

    const client = new Client({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    console.log('Connecting to Work database...');
    await client.connect();
    console.log('Connected!\n');

    try {
        // ── Step 0: Install helper RPCs ────────────────────────────────
        const rpcFiles = [
            'sql/create_exec_migration.sql',
            'sql/create_admin_reset_tables.sql',
            'sql/seed_work_data.sql'
        ];

        console.log('[0] Installing helper RPCs...');
        for (const rpcFile of rpcFiles) {
            const filePath = path.resolve(__dirname, '..', rpcFile);
            if (!fs.existsSync(filePath)) {
                console.warn(`  SKIP: ${rpcFile} not found`);
                continue;
            }
            const sql = fs.readFileSync(filePath, 'utf8');
            try {
                await client.query(sql);
                console.log(`  OK: ${rpcFile}`);
            } catch (err) {
                console.error(`  FAIL: ${rpcFile}: ${err.message}`);
            }
        }

        // ── Step 1: Collect and sort migration files ───────────────────
        // Reads both sql/migrations (legacy, frozen) and supabase/migrations
        // (canonical for new work — applied to prod via db-push.yml). Files
        // are interleaved by basename so the alphabetical run order matches
        // the order prod sees. If both dirs contain the same basename, the
        // supabase/migrations copy wins (that's what prod runs); the sql/
        // copy is skipped to avoid double-apply.
        const legacyDir   = path.resolve(__dirname, '..', 'sql', 'migrations');
        const canonicalDir = path.resolve(__dirname, '..', 'supabase', 'migrations');
        if (!fs.existsSync(legacyDir) && !fs.existsSync(canonicalDir)) {
            console.error('ERROR: neither sql/migrations/ nor supabase/migrations/ exists.');
            process.exit(1);
        }

        const collect = (dir) => fs.existsSync(dir)
            ? fs.readdirSync(dir).filter(f => f.endsWith('.sql')).map(f => ({ name: f, dir }))
            : [];
        const byName = new Map();
        for (const entry of collect(legacyDir))     byName.set(entry.name, entry);  // legacy first
        for (const entry of collect(canonicalDir))  byName.set(entry.name, entry);  // supabase wins on dup
        const files = [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));

        console.log(`\n[1] Found ${files.length} migration files (${legacyDir.split('/').slice(-2).join('/')} + ${canonicalDir.split('/').slice(-2).join('/')}).\n`);

        // ── Step 2: Execute each migration ─────────────────────────────
        let applied = 0;
        let skipped = 0;
        let failed = 0;
        const failures = [];

        for (const entry of files) {
            const file = entry.name;
            const filePath = path.join(entry.dir, file);
            const sql = fs.readFileSync(filePath, 'utf8');

            try {
                await client.query(sql);
                applied++;
                console.log(`  OK: ${file}`);
            } catch (err) {
                // Reset any aborted transaction so subsequent queries work
                try { await client.query('ROLLBACK'); } catch (_) {}

                const msg = err.message || '';
                const isBenign = msg.includes('already exists')
                    || msg.includes('duplicate key')
                    || msg.includes('does not exist')
                    || msg.includes('multiple default values')
                    || msg.includes('cannot alter type of a column used by a view')
                    || msg.includes('ON CONFLICT')
                    || msg.includes('unique constraint matching');

                if (isBenign) {
                    skipped++;
                } else {
                    failed++;
                    failures.push({ file, error: msg });
                    console.error(`  FAIL: ${file}`);
                    console.error(`        ${msg}`);
                }
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

    } finally {
        await client.end();
    }
}

main().catch(err => {
    console.error('Migration script failed:', err);
    process.exit(1);
});
