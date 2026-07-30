# Supabase setup — ROME: Rise and Fall

All SQL lives here, split by domain so no one file grows unwieldy. Everything is
**idempotent** — safe to re-run. Paste each file into the Supabase SQL Editor
(Dashboard → SQL Editor → New query) and run it.

## Run order

Structure first (`schema/`, in numeric order — the numbers encode dependencies),
then any seed data (`seed/`):

```
schema/00_auth.sql         profiles (id, email, nickname), RLS, sign-up trigger
schema/10_characters.sql   characters (one gens per account: name, priorities, birthplace), RLS
```

A fresh database: run `schema/00_auth.sql`, then `schema/10_characters.sql`.
That is the whole backend so far — authentication, the profile a sign-up
creates, and the character a player founds.

## Conventions

- **Structure vs data.** `schema/` holds tables, policies, functions. Bulk rows
  (name pools, lists) go in `seed/` so the structure stays readable.
- **One file per domain.** New domain → new numbered file (e.g. `10_world.sql`),
  numbered after whatever it depends on.
- **Idempotent.** `create table if not exists`, `drop policy if exists` then
  `create`, `add column if not exists`, `on conflict do nothing` — re-running is
  always safe.
- **Game-controlled columns** are not client-writable: they change only through
  `security definer` functions, never granted directly to `authenticated`.

## Auth notes

- The publishable key in `supabase.js` is public by design; access is governed by
  Row Level Security, not by hiding the key. The secret key never goes in client
  code.
- **Email confirmation** is controlled in the Supabase dashboard
  (Authentication → Providers → Email). If it is ON, a new sign-up has no session
  until the emailed link is clicked — the UI shows "check your email" and the
  player logs in afterward. If OFF, sign-up logs the player straight in.
