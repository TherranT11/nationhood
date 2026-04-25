# advance-corp-tick operational verification

This checklist/script verifies the full operator flow:

1. `pg_cron` has an active `advance-corp-tick` job and it targets `/functions/v1/advance-corp-tick`.
2. If missing/misconfigured, it applies `supabase/setup-corp-cron.sql`.
3. It deploys the current `advance-corp-tick` function bundle.
4. It validates that new `corp_cash_history` rows appear after a forced tick.

## Script

```bash
node scripts/support/verify-advance-corp-tick.mjs
```

## Required environment variables

- `SUPABASE_ACCESS_TOKEN`: Supabase personal access token (used for SQL checks/repairs and deploy).
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for invoking edge function and querying table data.
- Optional: `SUPABASE_URL` (defaults to `https://pbumjalxclmegzckhqqr.supabase.co`).
- Optional: `SUPABASE_PROJECT_REF` (auto-derived from `SUPABASE_URL`).

## Notes

- This script uses the Supabase Management API endpoint:
  `POST /v1/projects/{project_ref}/database/query`.
- The script intentionally fails fast if required credentials are missing.
