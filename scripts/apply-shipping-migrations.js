#!/usr/bin/env node

/**
 * Apply shipping-related migrations in a fixed order, verify table/RLS/policies,
 * notify PostgREST to reload schema cache, and optionally smoke test REST endpoints.
 *
 * Usage:
 *   DATABASE_URL=postgresql://... node scripts/apply-shipping-migrations.js
 *
 * Optional for REST smoke test:
 *   SUPABASE_URL=https://<project>.supabase.co
 *   SUPABASE_ANON_KEY=<anon key>
 */

const fs = require('fs');
const path = require('path');

const MIGRATIONS = [
  'sql/migrations/20260412_shipping_routes.sql',
  'sql/migrations/20260412_shipping_claims_fleet.sql',
  'sql/migrations/20260414_shipping_applications.sql'
];

const REQUIRED_TABLES = [
  'shipping_routes',
  'shipping_claims',
  'shipping_applications'
];

function parseDotEnv(content) {
  const out = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx <= 0) continue;
    out[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return out;
}

function loadEnv() {
  const env = { ...process.env };
  const envFile = path.resolve(__dirname, '..', '.env.work');
  if (fs.existsSync(envFile)) {
    const fileVars = parseDotEnv(fs.readFileSync(envFile, 'utf8'));
    for (const [k, v] of Object.entries(fileVars)) {
      if (!env[k]) env[k] = v;
    }
  }
  return env;
}

function collectExpectedPolicies(sqlText) {
  const policies = [];

  const createPolicyRegex = /CREATE\s+POLICY\s+(?:"([^"]+)"|([A-Za-z0-9_]+))\s+ON\s+(?:public\.)?([A-Za-z0-9_]+)/gi;
  for (const match of sqlText.matchAll(createPolicyRegex)) {
    const policyName = match[1] || match[2];
    const tableName = match[3];
    if (policyName && tableName) {
      policies.push({ tableName, policyName });
    }
  }

  return policies;
}

async function smokeTestRest(env) {
  const fetchImpl = globalThis.fetch || (await import('node-fetch')).default;
  const baseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const anonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

  if (!baseUrl || !anonKey) {
    console.log('[REST] Skipped (SUPABASE_URL/SUPABASE_ANON_KEY not set).');
    return;
  }

  console.log('[REST] Smoke testing /rest/v1 endpoints...');
  for (const table of REQUIRED_TABLES) {
    const url = `${baseUrl.replace(/\/$/, '')}/rest/v1/${table}?select=*&limit=1`;
    const res = await fetchImpl(url, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`
      }
    });

    if (res.status === 404) {
      const body = await res.text();
      throw new Error(`[REST] ${table} -> 404 (schema cache likely stale): ${body}`);
    }

    if (!res.ok && res.status !== 401 && res.status !== 403) {
      const body = await res.text();
      throw new Error(`[REST] ${table} -> unexpected ${res.status}: ${body}`);
    }

    console.log(`  OK: ${table} -> HTTP ${res.status}`);
  }
}

async function main() {
  const env = loadEnv();
  const databaseUrl = env.DATABASE_URL || env.WORK_DATABASE_URL;
  if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL (or WORK_DATABASE_URL) is required.');
    process.exit(1);
  }

  let Client;
  try {
    ({ Client } = require('pg'));
  } catch (err) {
    console.error('ERROR: Missing dependency "pg". Install with: npm install --save-dev pg');
    process.exit(1);
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected to database.');

  const expectedPolicies = [];

  try {
    for (const migrationRelPath of MIGRATIONS) {
      const migrationPath = path.resolve(__dirname, '..', migrationRelPath);
      if (!fs.existsSync(migrationPath)) {
        throw new Error(`Missing migration file: ${migrationRelPath}`);
      }

      const sql = fs.readFileSync(migrationPath, 'utf8');
      expectedPolicies.push(...collectExpectedPolicies(sql));

      console.log(`Applying ${migrationRelPath}...`);
      await client.query(sql);
      console.log(`  OK: ${migrationRelPath}`);
    }

    console.log('\nVerifying required tables in public...');
    const tableResult = await client.query(
      `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY($1::text[])
      ORDER BY table_name
      `,
      [REQUIRED_TABLES]
    );
    const foundTables = new Set(tableResult.rows.map(r => r.table_name));
    const missingTables = REQUIRED_TABLES.filter(t => !foundTables.has(t));
    if (missingTables.length > 0) {
      throw new Error(`Missing tables: ${missingTables.join(', ')}`);
    }
    console.log(`  OK: ${REQUIRED_TABLES.join(', ')}`);

    console.log('\nVerifying RLS enabled...');
    const rlsResult = await client.query(
      `
      SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = ANY($1::text[])
      ORDER BY c.relname
      `,
      [REQUIRED_TABLES]
    );

    const rlsDisabled = rlsResult.rows
      .filter(r => !r.rls_enabled)
      .map(r => r.table_name);

    if (rlsDisabled.length > 0) {
      throw new Error(`RLS disabled for: ${rlsDisabled.join(', ')}`);
    }
    console.log('  OK: RLS enabled for all required tables.');

    console.log('\nVerifying policies created from migration files...');
    const policiesResult = await client.query(
      `
      SELECT tablename AS table_name, policyname AS policy_name
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = ANY($1::text[])
      `,
      [Array.from(new Set(expectedPolicies.map(p => p.tableName)))]
    );

    const policySet = new Set(
      policiesResult.rows.map(r => `${r.table_name}::${r.policy_name}`)
    );

    const missingPolicies = expectedPolicies.filter(
      p => !policySet.has(`${p.tableName}::${p.policyName}`)
    );

    if (missingPolicies.length > 0) {
      throw new Error(
        `Missing policies: ${missingPolicies
          .map(p => `${p.policyName} on ${p.tableName}`)
          .join(', ')}`
      );
    }
    console.log(`  OK: ${expectedPolicies.length} policy definitions verified.`);

    console.log('\nReloading PostgREST schema cache...');
    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log('  OK: NOTIFY pgrst issued.');

    console.log('');
    await smokeTestRest(env);

    console.log('\nAll requested migration and verification steps completed successfully.');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
