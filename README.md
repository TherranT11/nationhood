# nationhood

## Contributor notes

- Inline scripts must be wrapped in an IIFE or moved to module files; do not add top-level lexical globals.
- Run `npm run lint:inline-scripts` to catch risky top-level declarations (`let`/`const`) in classic inline scripts.
- **Edge functions don't auto-deploy.** A change to anything under `supabase/functions/<name>/**` is *not* complete until you run `supabase functions deploy <name>` (or deploy from the Supabase dashboard). The local source and the running bundle drift independently; an un-deployed change runs nowhere. A workforce-stripping bug ran in production for weeks because removed code was never re-deployed — the fix was a one-line redeploy. Treat any edit to `advance-tick` or `advance-corp-tick` as half-done until deploy is confirmed.
- **Production DB migrations are sourced from `supabase/migrations`.** Treat `sql/migrations` as legacy/manual scripts unless a deployment runbook explicitly says otherwise. Run `supabase db push` before deploying edge-function logic that depends on schema changes.
- **Workforce audit trigger is permanent.** `sql/migrations/20260424_audit_corp_workforce_changes.sql` installs `trg_log_workforce_change`, which captures every UPDATE that changes `corp_general_workforce` / `corp_skilled_workforce` / `corp_innovative_workforce`. Originally diagnostic; kept on permanently as a canary — any future regression that strips workforce names itself within one tick. Cost is negligible (the `WHEN` clause filters no-op updates). Don't drop it.
