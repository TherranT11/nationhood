# Supabase setup

All SQL lives here, split by domain so no one file grows unwieldy. Everything is
**idempotent** — safe to re-run. Paste each file into the Supabase SQL Editor
(Dashboard → SQL Editor → New query) and run it.

## Run order

Structure first (`schema/`, in numeric order — the numbers encode dependencies),
then the seed data (`seed/`):

```
schema/00_profiles.sql      profiles, tutorial_state, tutorial_merge(), auth trigger
schema/05_game.sql          game_state (the shared tick counter, seeded to 1)
schema/10_nations.sql       nations table + Sessau seed (+ election scheduling)
schema/20_parties.sql       parties table, RLS, column-level write lock
schema/30_politicians.sql   politicians + recruit_drives tables + RLS
schema/40_events.sql        events feed + leader-action functions (rally, recruit, …)
schema/50_names.sql         nation_names table (structure only; per-nation pools)

seed/sessau_names.sql           Sessau's name pool (run once, after 50)
seed/vesperia_names.sql         Vesperia's name pool (run after the nation exists)
seed/backfill_party_leaders.sql one-off: give existing partyless parties a leader
```

A fresh database: run `schema/00 → 50`, then `seed/sessau_names.sql`. The backfill
is only needed for parties created before the leader generator existed.

## Conventions

- **Structure vs data.** `schema/` holds tables, policies, functions. Bulk rows
  (name pools, future lists) go in `seed/` so the structure stays readable.
- **One file per domain.** New domain → new numbered file (e.g. `60_legislation.sql`),
  numbered after whatever it depends on.
- **Idempotent.** `create table if not exists`, `drop policy if exists` then
  `create`, `on conflict do nothing`, guarded backfills — re-running is always safe.
- **Game-controlled columns** (standings, stats) are not client-writable: they're
  changed only by `security definer` functions, never granted to `authenticated`.
