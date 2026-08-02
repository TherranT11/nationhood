# Supabase setup — Nationhood: Prophecy & Plague

All SQL lives here, split by domain. Everything is **idempotent** — safe to
re-run. Paste each file into the Supabase SQL Editor (Dashboard → SQL Editor →
New query) and run it.

## Run order

```
schema/00_auth.sql   profiles (id, email, nickname), RLS, sign-up trigger,
                     email_for_nickname() RPC, unique-nickname index
```

A fresh database: run `schema/00_auth.sql`. That is the whole backend so far —
authentication and the profile a sign-up creates.

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
