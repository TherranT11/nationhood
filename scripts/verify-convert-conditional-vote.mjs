#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { Client } from 'pg';

const ROOT = process.cwd();
const MIGRATIONS = [
  'sql/migrations/20260302_fix_rls_ownership.sql',
  'sql/migrations/20260303_strike_acceptance_locked_support.sql',
];

function usage() {
  console.log(`Usage:
  DATABASE_URL=postgres://... node scripts/verify-convert-conditional-vote.mjs [--apply-missing]

Optional RPC probe vars:
  SUPABASE_URL=https://<project>.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
`);
}

function parseArgs(argv) {
  return {
    applyMissing: argv.includes('--apply-missing'),
    help: argv.includes('-h') || argv.includes('--help'),
  };
}

async function rpcProbe() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRole) {
    console.log('ℹ️  RPC probe skipped (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set).');
    return;
  }

  const url = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/rpc/convert_conditional_vote`;
  const probePayload = {
    p_bill_id: '00000000-0000-0000-0000-000000000000',
    p_faction_id: '00000000-0000-0000-0000-000000000000',
    p_seat_count: 0,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: serviceRole,
      Authorization: `Bearer ${serviceRole}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(probePayload),
  });

  const body = await res.text();
  if (res.status === 404) {
    throw new Error(`RPC endpoint returned 404: ${body}`);
  }

  console.log(`✅ RPC endpoint reachable (HTTP ${res.status}).`);
}

async function migrationExists(client, migrationName) {
  const { rows } = await client.query(
    `
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'supabase_migrations'
        AND table_name = 'schema_migrations'
    ) AS has_table
    `,
  );

  if (!rows[0]?.has_table) {
    throw new Error('supabase_migrations.schema_migrations not found; cannot verify migration history.');
  }

  const result = await client.query(
    `SELECT EXISTS (
      SELECT 1 FROM supabase_migrations.schema_migrations
      WHERE name = $1 OR name LIKE $2
    ) AS applied`,
    [migrationName, `${migrationName}.sql`],
  );

  return result.rows[0]?.applied === true;
}

async function verifyFunctionAndGrants(client) {
  const { rows } = await client.query(`
    SELECT
      p.oid,
      n.nspname AS schema_name,
      p.proname,
      pg_catalog.pg_get_function_identity_arguments(p.oid) AS identity_args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'convert_conditional_vote'
      AND pg_catalog.pg_get_function_identity_arguments(p.oid) = 'uuid, uuid, integer'
  `);

  if (!rows.length) {
    throw new Error('Missing function public.convert_conditional_vote(UUID, UUID, INT).');
  }

  const { rows: grantRows } = await client.query(
    `
    SELECT grantee
    FROM information_schema.role_routine_grants
    WHERE routine_schema = 'public'
      AND routine_name = 'convert_conditional_vote'
      AND privilege_type = 'EXECUTE'
      AND specific_name IN (
        SELECT p.proname || '_' || p.oid::text
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname = 'convert_conditional_vote'
          AND pg_catalog.pg_get_function_identity_arguments(p.oid) = 'uuid, uuid, integer'
      )
    `,
  );

  const grantees = new Set(grantRows.map((r) => r.grantee));
  const missing = ['authenticated', 'service_role'].filter((g) => !grantees.has(g));

  if (missing.length) {
    throw new Error(`Missing EXECUTE grants for: ${missing.join(', ')}`);
  }

  console.log('✅ Function signature and grants verified: convert_conditional_vote(UUID, UUID, INT).');
}

async function applyMigration(client, filePath) {
  const abs = path.join(ROOT, filePath);
  const sql = fs.readFileSync(abs, 'utf8');
  console.log(`▶ Applying migration: ${filePath}`);
  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return;
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    usage();
    throw new Error('DATABASE_URL is required.');
  }

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    console.log('Connected. Verifying migration state...');
    const missing = [];

    for (const migrationFile of MIGRATIONS) {
      const migrationName = path.basename(migrationFile, '.sql');
      const applied = await migrationExists(client, migrationName);
      console.log(`${applied ? '✅' : '❌'} ${migrationName}`);
      if (!applied) missing.push(migrationFile);
    }

    if (missing.length && args.applyMissing) {
      for (const filePath of missing) {
        await applyMigration(client, filePath);
      }
      console.log('Re-checking migration state...');
      for (const migrationFile of MIGRATIONS) {
        const migrationName = path.basename(migrationFile, '.sql');
        const applied = await migrationExists(client, migrationName);
        console.log(`${applied ? '✅' : '❌'} ${migrationName}`);
      }
    } else if (missing.length) {
      console.log('ℹ️  Missing migrations detected. Re-run with --apply-missing to apply in-order.');
    }

    await verifyFunctionAndGrants(client);
    await rpcProbe();
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error(`❌ ${err.message}`);
  process.exit(1);
});
