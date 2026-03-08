#!/usr/bin/env node

/**
 * snapshot.js — Save and restore Work DB snapshots
 *
 * Uses pg_dump/psql against the Work database via the direct connection string
 * from .env.work (WORK_DATABASE_URL).
 *
 * Usage:
 *   npm run snapshot:save -- --name "pre-election-test"
 *   npm run snapshot:restore -- --name "pre-election-test"
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Parse .env.work
const envPath = path.resolve(__dirname, '..', '.env.work');
if (!fs.existsSync(envPath)) {
    console.error('ERROR: .env.work not found.');
    process.exit(1);
}
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) env[trimmed.substring(0, eqIdx)] = trimmed.substring(eqIdx + 1);
}

const DATABASE_URL = env.WORK_DATABASE_URL;
if (!DATABASE_URL || DATABASE_URL.startsWith('<')) {
    console.error('ERROR: WORK_DATABASE_URL not set in .env.work.');
    console.error('Find it at: Supabase Dashboard → Settings → Database → Connection string (URI)');
    process.exit(1);
}

// Parse args
const args = process.argv.slice(2);
const action = args[0]; // 'save' or 'restore'
const nameIdx = args.indexOf('--name');
const snapshotName = nameIdx >= 0 ? args[nameIdx + 1] : null;

if (!action || !['save', 'restore'].includes(action)) {
    console.error('Usage:');
    console.error('  npm run snapshot:save -- --name "my-snapshot"');
    console.error('  npm run snapshot:restore -- --name "my-snapshot"');
    process.exit(1);
}

if (!snapshotName) {
    console.error('ERROR: --name is required.');
    process.exit(1);
}

// Sanitize name for filename
const safeName = snapshotName.replace(/[^a-zA-Z0-9_-]/g, '_');
const snapshotsDir = path.resolve(__dirname, '..', 'snapshots');
const snapshotFile = path.join(snapshotsDir, `${safeName}.sql`);

if (action === 'save') {
    // Ensure snapshots directory exists
    if (!fs.existsSync(snapshotsDir)) {
        fs.mkdirSync(snapshotsDir, { recursive: true });
    }

    console.log(`Saving snapshot "${snapshotName}" to ${snapshotFile}...`);
    try {
        execSync(`pg_dump "${DATABASE_URL}" --data-only --no-owner --no-privileges > "${snapshotFile}"`, {
            stdio: ['pipe', 'pipe', 'inherit']
        });
        const size = fs.statSync(snapshotFile).size;
        console.log(`Snapshot saved: ${snapshotFile} (${(size / 1024).toFixed(1)} KB)`);
    } catch (err) {
        console.error('pg_dump failed. Make sure pg_dump is installed and WORK_DATABASE_URL is correct.');
        console.error('Install: sudo apt-get install postgresql-client');
        process.exit(1);
    }

} else if (action === 'restore') {
    if (!fs.existsSync(snapshotFile)) {
        console.error(`Snapshot not found: ${snapshotFile}`);
        console.error('Available snapshots:');
        if (fs.existsSync(snapshotsDir)) {
            const files = fs.readdirSync(snapshotsDir).filter(f => f.endsWith('.sql'));
            if (files.length === 0) {
                console.error('  (none)');
            } else {
                files.forEach(f => console.error(`  - ${f.replace('.sql', '')}`));
            }
        } else {
            console.error('  (snapshots directory does not exist)');
        }
        process.exit(1);
    }

    console.log(`Restoring snapshot "${snapshotName}" from ${snapshotFile}...`);
    console.log('WARNING: This will overwrite all current Work DB data.');

    try {
        // Clear existing data first via truncate
        execSync(`psql "${DATABASE_URL}" -c "SELECT admin_reset_tables();"`, {
            stdio: ['pipe', 'pipe', 'inherit']
        });
        console.log('Tables cleared.');

        // Restore snapshot
        execSync(`psql "${DATABASE_URL}" < "${snapshotFile}"`, {
            stdio: ['pipe', 'pipe', 'inherit']
        });
        console.log('Snapshot restored successfully.');
    } catch (err) {
        console.error('Restore failed. Make sure psql is installed and WORK_DATABASE_URL is correct.');
        process.exit(1);
    }
}
