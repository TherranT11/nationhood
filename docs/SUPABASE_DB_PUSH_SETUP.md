# Supabase Migrations CI — Setup

The `.github/workflows/db-push.yml` workflow runs `supabase db push` on
every commit to `main` that changes anything under `supabase/migrations/`.
After the one-time setup below, every new migration reaches the live
database on the same deploy that ships the frontend.

This closes the "migration sits in the repo but never reaches Supabase"
gap that's bitten this project repeatedly (politician_career column
drop crashing bootstrap, modifier_templates RLS blocking saves,
corp_trade running 5% per share instead of 1%, etc.).

---

## ⚠ READ FIRST — Baseline check before enabling

The Supabase CLI tracks applied migrations in a system table:
`supabase_migrations.schema_migrations`. On first push, the CLI will
try to apply EVERY file in `supabase/migrations/` that isn't already
recorded there. There are 145+ files in that folder, most of which
have been applied to production over time via the SQL Editor manually
(not via the CLI). If `schema_migrations` is empty or partial, the
first `db push` will try to re-run them — and many aren't idempotent
(ALTER TABLE ADD COLUMN, INSERT INTO seed data, etc.) and will
error or corrupt state.

**Run this query in the Supabase SQL Editor BEFORE adding the
secrets that enable the workflow:**

```sql
SELECT version
  FROM supabase_migrations.schema_migrations
 ORDER BY version DESC
 LIMIT 10;
```

Three possible outcomes:

### Outcome A — `schema_migrations` is empty or doesn't exist

The CLI has never run against this project. Open
`docs/baseline-schema-migrations.sql` in the repo, paste the entire
contents into the Supabase SQL Editor, and Run. Skip
`docs/baseline-duplicate-prefix-fixup.sql` (superseded — see its
header for why); the duplicate-prefix problem was resolved by
renaming the 12 colliding files to unique prefixes, so a fresh
baseline run no longer needs the follow-up insert.

The file creates the `supabase_migrations.schema_migrations` table
and inserts 133 rows — one per unique pre-session migration version
(every file in `supabase/migrations/` dated before `20270392`). The
24 migrations added in the most recent dev session (`20270392` →
`20270415`) are INTENTIONALLY left unmarked so the next CI `db push`
will actually apply them.

All 24 are idempotent (CREATE OR REPLACE / IF NOT EXISTS / WHERE-
filtered UPDATE), so any that have already been pasted into the SQL
Editor manually will be a no-op on re-apply — not a conflict.

Verify with the two SELECTs at the bottom of the baseline file:
the first should return 133, the second should return 0.

If the baseline file is missing or you want to regenerate it, the
shell command at the top of the file (`ls supabase/migrations/*.sql
| awk ... | sort`) reconstructs it from the current directory state.

### Outcome B — `schema_migrations` has SOME entries but not all 145

Mixed state. List which ones are missing:

```bash
# Local diff:
supabase link --project-ref <project-ref>
supabase migration list --linked
```

This prints which migrations the CLI thinks are still pending. For
each pending file that you KNOW has actually been applied (most of
them, probably), run `supabase migration repair --status applied <ts>`
to mark it without re-running. For any that genuinely haven't been
applied, leave them — the next `db push` will apply them.

### Outcome C — `schema_migrations` has all 145+ entries

Already baselined. Add the secrets, push to main, the workflow runs
clean.

---

## GitHub secrets to add

Repo Settings → Secrets and variables → Actions → New repository secret:

| Secret name | Where to find it |
|---|---|
| `SUPABASE_PROJECT_REF` | Supabase Dashboard → Project Settings → General → "Reference ID". Currently `pbumjalxclmegzckhqqr` per `supabase/config.toml`. |
| `SUPABASE_ACCESS_TOKEN` | Supabase Dashboard → Account → Access Tokens → "Generate new token". Scope it to one project if the option is offered. Treat like a password. |
| `SUPABASE_DB_PASSWORD` | Supabase Dashboard → Project Settings → Database → "Database password". Same one used in the connection string. If you've never set or rotated it, do so here. |

Once those three are saved, the workflow is live. The next push to
`main` that touches `supabase/migrations/**` will trigger it.

---

## Day-to-day workflow

1. **Write a new migration** as `supabase/migrations/YYYYMMDD_description.sql`
   (timestamp format mirrors what's already there — increments by date,
   doesn't have to match the system clock, just has to sort after the
   last one).

2. **Commit + push to main** (or merge a PR to main).

3. **Watch the Actions tab.** The "Apply Supabase migrations" workflow
   runs in 30–90 seconds. The `migration list` step shows what's
   pending; the `db push` step applies them.

4. **No more manual SQL Editor pasting.** If you do still need to
   apply something by hand (hotfix, one-off seed), use
   `supabase migration repair --status applied <ts>` afterwards so the
   CLI knows it ran.

---

## When something goes wrong

- **`Migration X has already been applied`** — the CLI thinks it ran
  but the file is missing. Add the file back, OR mark as reverted:
  `supabase migration repair --status reverted <ts>`.

- **`Connection refused / authentication failed`** — `SUPABASE_DB_PASSWORD`
  is wrong or `SUPABASE_PROJECT_REF` mismatches. Re-check both.

- **`Error applying migration <ts>: <SQL error>`** — the migration's SQL
  has a real bug or hits live-data state that doesn't match. CLI aborts
  the run. Fix the migration, commit, push again. Subsequent migrations
  that didn't get applied yet stay pending and will run after.

- **Need to apply manually** — open Actions tab → "Apply Supabase
  migrations" → "Run workflow" button. Same effect as a push.

---

## The legacy `sql/migrations/` folder

There are 800+ migrations in `sql/migrations/` that predate the
move to `supabase/migrations/` as canonical. Per the existing
README note: those are "legacy/manual scripts." The CLI doesn't see
them; the workflow doesn't run them. Don't add new files there —
new migrations always go to `supabase/migrations/`. Leftover files
in `sql/migrations/` stay for historical reference (and the grep-
friendly diagnostic SQL many of them contain).
