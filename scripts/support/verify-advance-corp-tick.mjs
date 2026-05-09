#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pbumjalxclmegzckhqqr.supabase.co';
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || new URL(SUPABASE_URL).hostname.split('.')[0];
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

function info(msg) { console.log(`ℹ️  ${msg}`); }
function ok(msg) { console.log(`✅ ${msg}`); }

async function request(url, { method = 'GET', headers = {}, body } = {}) {
  const res = await fetch(url, { method, headers, body });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  if (!res.ok) {
    throw new Error(`${method} ${url} -> ${res.status}: ${typeof json === 'string' ? json : JSON.stringify(json)}`);
  }
  return json;
}

function resultRows(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.result)) return result.result;
  if (Array.isArray(result?.rows)) return result.rows;
  return [];
}

function assertSqlText(sql) {
  const firstLine = sql.trimStart().split('\n')[0];
  if (/^(?:diff --git|@@|@ -\d+,\d+ \+\d+,\d+ @@)/.test(firstLine)) {
    fail('SQL payload appears to be a git diff hunk, not a SQL statement. Run only the select statements or script, without diff header lines.');
  }
}

async function sqlQuery(sql) {
  if (!ACCESS_TOKEN) fail('SUPABASE_ACCESS_TOKEN is required for SQL checks via Supabase Management API.');
  assertSqlText(sql);
  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;
  return request(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
}

async function getCronJob() {
  const rows = resultRows(await sqlQuery(`
    select jobid, jobname, active, command
    from cron.job
    where jobname = 'advance-corp-tick'
    limit 1;
  `));
  return rows[0];
}

function commandLooksCorrect(commandText) {
  return typeof commandText === 'string' && commandText.includes('/functions/v1/advance-corp-tick');
}

async function preflightCorpTickMarker() {
  info('Checking corp_last_processed_tick schema preflight...');
  const columnRows = resultRows(await sqlQuery(`
    select column_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'shard'
      and column_name = 'corp_last_processed_tick';
  `));

  if (columnRows.length === 0) {
    fail('Missing public.shard.corp_last_processed_tick. Apply supabase/migrations/20260402_corp_last_processed_tick.sql before running this verification.');
  }

  ok('public.shard.corp_last_processed_tick column exists.');

  const shardRows = resultRows(await sqlQuery(`
    select name, current_tick, corp_last_processed_tick
    from public.shard
    where name = 'Alpha Shard';
  `));
  const alphaShard = shardRows[0];

  if (!alphaShard) {
    fail('Alpha Shard was not found in public.shard; cannot confirm corp_last_processed_tick marker.');
  }

  info(`Alpha Shard current_tick=${alphaShard.current_tick}; corp_last_processed_tick=${alphaShard.corp_last_processed_tick ?? 'null'}`);
  info('Confirm the marker value before continuing: if corp_last_processed_tick already matches the next target tick, the next corp tick may skip processing.');
}

async function ensureCronJob() {
  info('Checking pg_cron job advance-corp-tick...');
  let job = await getCronJob();
  const valid = !!job && job.active === true && commandLooksCorrect(job.command);

  if (valid) {
    ok('pg_cron job is active and targets /functions/v1/advance-corp-tick.');
    return;
  }

  if (!SERVICE_ROLE_KEY) {
    fail('Cron job missing/misconfigured and SUPABASE_SERVICE_ROLE_KEY is not set to repair with supabase/setup-corp-cron.sql.');
  }

  info('Job missing/misconfigured. Applying supabase/setup-corp-cron.sql...');
  const raw = fs.readFileSync('supabase/setup-corp-cron.sql', 'utf8');
  const escaped = SERVICE_ROLE_KEY.replaceAll("'", "''");
  const sql = raw.replaceAll('YOUR_SERVICE_ROLE_KEY_HERE', escaped);
  await sqlQuery(sql);

  job = await getCronJob();
  if (!!job && job.active === true && commandLooksCorrect(job.command)) {
    ok('Repaired: advance-corp-tick cron job now active and correctly targeted.');
  } else {
    fail('Attempted repair, but cron job still missing/misconfigured.');
  }
}

function deployFunction() {
  if (!ACCESS_TOKEN) fail('SUPABASE_ACCESS_TOKEN is required to deploy functions.');
  info('Deploying function: advance-corp-tick...');
  execSync(
    `npx supabase functions deploy advance-corp-tick --project-ref ${PROJECT_REF}`,
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        SUPABASE_ACCESS_TOKEN: ACCESS_TOKEN,
      },
    },
  );
  ok('supabase functions deploy advance-corp-tick completed.');
}

async function latestCashHistoryStamp() {
  if (!SERVICE_ROLE_KEY) fail('SUPABASE_SERVICE_ROLE_KEY is required to query corp_cash_history reliably.');
  const url = `${SUPABASE_URL}/rest/v1/corp_cash_history?select=id,created_at,tick&order=created_at.desc&limit=1`;
  const rows = await request(url, {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
  });
  return rows?.[0] || null;
}

async function forceTick() {
  if (!SERVICE_ROLE_KEY) fail('SUPABASE_SERVICE_ROLE_KEY is required to force invoke advance-corp-tick.');
  const url = `${SUPABASE_URL}/functions/v1/advance-corp-tick`;
  return request(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ force: true }),
  });
}

async function validateCashHistoryGrowth() {
  info('Checking corp_cash_history before next forced tick...');
  const before = await latestCashHistoryStamp();
  info(`Last cash history row before: ${before ? `${before.id} @ ${before.created_at} (tick ${before.tick})` : 'none'}`);

  info('Forcing advance-corp-tick to produce the next tick write...');
  const response = await forceTick();
  info(`Function response: ${JSON.stringify(response)}`);

  await new Promise((r) => setTimeout(r, 5000));
  const after = await latestCashHistoryStamp();
  info(`Last cash history row after: ${after ? `${after.id} @ ${after.created_at} (tick ${after.tick})` : 'none'}`);

  if (!before && after) {
    ok('Validation passed: corp_cash_history now has rows.');
    return;
  }
  if (before && after && (after.created_at > before.created_at || after.id !== before.id)) {
    ok('Validation passed: new corp_cash_history rows appeared after the tick.');
    return;
  }

  fail('Validation failed: no new corp_cash_history rows detected after forcing a tick.');
}

(async function main() {
  info(`Project ref: ${PROJECT_REF}`);
  await preflightCorpTickMarker();
  await ensureCronJob();
  deployFunction();
  await validateCashHistoryGrowth();
  ok('All requested checks completed.');
})().catch((err) => {
  fail(err?.message || String(err));
});
