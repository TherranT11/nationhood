# Supabase setup — ROME: Rise and Fall

All SQL lives here, split by domain so no one file grows unwieldy. Everything is
**idempotent** — safe to re-run. Paste each file into the Supabase SQL Editor
(Dashboard → SQL Editor → New query) and run it.

## Run order

Structure first (`schema/`, in numeric order — the numbers encode dependencies),
then any seed data (`seed/`):

```
schema/00_auth.sql         profiles (id, email, nickname), RLS, sign-up trigger
schema/05_rome.sql         rome — shared single-row world state, read-only to clients
schema/10_characters.sql   characters (name, priorities, birthplace, stats, location)
                           + found_gens() RPC + gens_stat() formula, RLS
```

A fresh database: run `schema/00_auth.sql`, then `05_rome.sql`, then
`10_characters.sql`. That is the whole backend so far — authentication, the
profile a sign-up creates, the shared state of Rome, and the character a player
founds (whose stats are seeded server-side from the priority ranking).

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
