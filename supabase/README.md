# Supabase setup — Nationhood: Prophecy & Plague

All SQL lives here, split by domain. Everything is **idempotent** — safe to
re-run. Paste each file into the Supabase SQL Editor (Dashboard → SQL Editor →
New query) and run it.

## Run order

```
schema/00_auth.sql     profiles (id, email, nickname), RLS, sign-up trigger,
                       email_for_nickname() RPC, unique-nickname index
schema/10_nations.sql  pp_nations (one founded nation per account: people, side,
                       realm, house, capital, capital_slot) + pp_found_nation()
                       RPC (side derived server-side; also claims an empty capital
                       of the ruler's people from the world map and records its
                       settlement id in capital_slot), RLS
schema/20_world_map.sql pp_world_map (single JSON map document, read by any
                       signed-in player) + pp_save_world_map() RPC gated to the
                       owner's email server-side
```

A fresh database: run `schema/00_auth.sql`, then `10_nations.sql`, then
`20_world_map.sql`. That is the whole backend so far — authentication, the
profile a sign-up creates, the nation a player founds, and the admin-authored
world map.

**Founding claims a map slot.** `pp_found_nation()` reads `pp_world_map` at call
time to grab an empty village of the ruler's people (`humanVillage` for humans,
`orcVillage` for orcs — draw those in the Cartographer) and stores its settlement
id in `pp_nations.capital_slot`. The order above already satisfies this: the world
map table exists before anyone founds. If no empty village of that people remains,
founding fails with a clear message — draw more villages in the Cartographer.

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
