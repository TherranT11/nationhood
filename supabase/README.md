# Supabase setup — Nationhood: Rise and Fall

All SQL lives here, split by domain. Everything is **idempotent** — safe to
re-run. Paste each file into the Supabase SQL Editor (Dashboard → SQL Editor →
New query) and run it.

## Run order

```
schema/00_auth.sql         rf_profiles (username + lifetime stats per
                            account, populated by a trigger on auth.users
                            at sign-up), RLS
schema/10_world_maps.sql   rf_world_maps (one saved map per name, upserted by
                            the World Map Editor's Save button), RLS
schema/20_nations.sql      rf_nations (one active civilization per account,
                            founded via /found + /found/seat), RLS
```

A fresh database: run `schema/00_auth.sql`, then `schema/10_world_maps.sql`,
then `schema/20_nations.sql`. That is the whole backend so far — accounts
created via `/signup`, sign-in via `/login`, the civilization founded via
`/found` + `/found/seat`, and the `/maptool` editor's saved maps.

**Reused-project note:** this Supabase project may also hold tables from
earlier games. This game's tables are namespaced (`rf_profiles`,
`rf_world_maps`, `rf_nations`) to avoid colliding with anything pre-existing.

**Email confirmation** (Authentication → Providers → Email in the dashboard):
if ON, a new sign-up has no session until the emailed link is clicked — the
/signup page shows "check your email," and the "Continue" link sends them to
/login. If OFF, sign-up returns a session immediately and routes straight to
/found (a brand new account has no civilization yet).

## Where a signed-in account goes

`post-auth.js` (`routeAfterAuth()`) is the one place that decides where an
authenticated visitor belongs — /login, /signup (on a session-issuing
sign-up), and /found's and /found/seat's own load-time guards all call it
instead of each re-implementing "do they have a nation yet?":

- No session → `/login`
- Session, no row in `rf_nations` → `/found`
- Session, has a row in `rf_nations` → `/` (there's no in-game dashboard yet
  — this is a known gap, not an oversight; home is the safe landing page
  until one exists)

## Founding is two steps

`/found` collects the civilization name, capital name, and nature, then
hands them to `/found/seat` via sessionStorage (`pending-founding.js`) rather
than inserting right away — a capital without a place on the world isn't a
real nation yet. `/found/seat` loads the most recently saved `rf_world_maps`
row (whichever map an admin last published via `/maptool`) plus every
existing `rf_nations` row, renders the real terrain/goods/other-players'
capitals, and only inserts into `rf_nations` once a hex is chosen and
confirmed — that insert is what actually creates the account's nation.

Landing on `/found/seat` directly without having gone through `/found` (no
pending name/capital/trait in sessionStorage) bounces back to `/found`.
Landing there with no map yet saved shows "The world hasn't been created
yet" instead of a broken map.

## Auth notes

- The anon key in `supabase.js` is public by design; access is governed by
  Row Level Security, not by hiding the key. The secret key never ships in
  client code.
- **Usernames are public by design** (the sign-up form says so) — anyone can
  read `rf_profiles` via the anon key, which is what lets `/signup` check
  availability before a session exists. Email, password, and everything else
  about the account stays in `auth.users`, which that policy doesn't touch.
- **`rf_nations` is readable by any signed-in account**, not just the owner
  — that's what lets `/found/seat` show where other players' capitals
  already are, and is meant to open further once there's an actual
  shared-map view. It's still gated `to authenticated`, so the anon key
  can't read it. Insert stays owner-only (`auth.uid() = user_id`). No
  update/delete policy exists yet — nothing in the game can rename or
  decline a civilization (Decline isn't built).
- **Capitals can't share a hex** — a unique index on `(hex_col, hex_row)`
  is the real guard, since the map's client-side "too close" check only
  sees whatever snapshot of `rf_nations` was loaded when the page opened.
  The broader "stay 5 hexes clear of any capital" rule (`MIN_GAP` in
  `/found/seat`) is **not** enforced at the database level — two players
  founding nearby hexes in the same moment could both pass the client
  check and both succeed, landing closer than intended. Closing that fully
  needs a trigger computing hex distance against existing rows; not adding
  one without asking first (see `schema/20_nations.sql`'s comment).
- **Only 3 of the 10 traits on /found are actually selectable** (Mercantile,
  Philosophical, Warlike) — the rest are disabled tiles in the UI. That's
  also enforced by a `check` constraint on `rf_nations.trait`, not just the
  `disabled` attribute, since a disabled input doesn't stop a direct REST
  call. Widen the constraint (and the form) together when a trait is ready.
- `rf_world_maps` is still readable and writable by anyone holding the anon
  key — the same posture as the `/maptool` page itself, which has no login
  gate to check against. Tighten the policies in `schema/10_world_maps.sql`
  once `/maptool` should be restricted to admins specifically (rather than
  just "signed up," which real accounts now make possible to check).
