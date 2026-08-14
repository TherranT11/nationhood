# Supabase setup — Nationhood: Rise and Fall

All SQL lives here, split by domain. Everything is **idempotent** — safe to
re-run. Paste each file into the Supabase SQL Editor (Dashboard → SQL Editor →
New query) and run it.

## Run order

```
schema/00_auth.sql         rf_profiles (username per account, populated by a
                            trigger on auth.users at sign-up), RLS
schema/10_world_maps.sql   rf_world_maps (one saved map per name, upserted by
                            the World Map Editor's Save button), RLS
```

A fresh database: run `schema/00_auth.sql`, then `schema/10_world_maps.sql`.
That is the whole backend so far — accounts created via `/signup`, and the
`/maptool` editor's saved maps.

**Reused-project note:** this Supabase project may also hold tables from
earlier games. This game's tables are namespaced (`rf_profiles`,
`rf_world_maps`) to avoid colliding with anything pre-existing.

**Email confirmation** (Authentication → Providers → Email in the dashboard):
if ON, a new sign-up has no session until the emailed link is clicked — the
/signup page shows "check your email"; the player logs in afterward once a
login page exists. If OFF, sign-up returns a session immediately.

## Auth notes

- The anon key in `supabase.js` is public by design; access is governed by
  Row Level Security, not by hiding the key. The secret key never ships in
  client code.
- **Usernames are public by design** (the sign-up form says so) — anyone can
  read `rf_profiles` via the anon key, which is what lets `/signup` check
  availability before a session exists. Email, password, and everything else
  about the account stays in `auth.users`, which that policy doesn't touch.
- **No login page exists yet.** `/signup` creates a real Supabase Auth
  account (and, once confirmed if confirmation is on, a live session) — there
  just isn't a page to sign back in with it yet.
- `rf_world_maps` is still readable and writable by anyone holding the anon
  key — the same posture as the `/maptool` page itself, which has no login
  gate to check against. Tighten the policies in `schema/10_world_maps.sql`
  once `/maptool` should be restricted to admins specifically (rather than
  just "signed up," which real accounts now make possible to check).
