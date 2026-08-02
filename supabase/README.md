# Supabase setup — Nationhood: Prophecy & Plague

All SQL lives here, split by domain. Everything is **idempotent** — safe to
re-run. Paste each file into the Supabase SQL Editor (Dashboard → SQL Editor →
New query) and run it.

## Run order

```
schema/00_auth.sql     profiles (id, email, nickname), RLS, sign-up trigger,
                       email_for_nickname() RPC, unique-nickname index
schema/10_nations.sql  pp_nations (one founded nation per account: people, side,
                       realm, house) + pp_found_nation() RPC (side derived
                       server-side), RLS
```

A fresh database: run `schema/00_auth.sql`, then `schema/10_nations.sql`.
That is the whole backend so far — authentication, the profile a sign-up
creates, and the nation a player founds.

**Reused-project note:** this Supabase project also holds legacy tables from
earlier games. This game's tables are namespaced (`pp_nations`) to avoid
colliding with a pre-existing `nations` table. A fresh project would avoid the
legacy cruft entirely, if you ever want a clean backend.

## Auth notes

- The publishable key in `supabase.js` is public by design; access is governed
  by Row Level Security, not by hiding the key. The secret key never ships in
  client code.
- **Login by email or nickname.** A nickname is resolved to its email by the
  `email_for_nickname()` RPC (granted to `anon`, since login runs before the
  caller is authenticated). This is a nickname→email enumeration surface —
  acceptable for now; move to an edge function or restrict if that matters.
- **Unique nicknames** are enforced by a case-insensitive index. If the index
  line errors on first run, legacy rows hold duplicate nicknames — clean them,
  then re-run.
- **Email confirmation** (Authentication → Providers → Email): if ON, a new
  sign-up has no session until the emailed link is clicked — the UI shows
  "check your email"; the player logs in afterward. If OFF, sign-up drops the
  player straight into founding.
