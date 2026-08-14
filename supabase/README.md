# Supabase setup — Nationhood: Rise and Fall

All SQL lives here, split by domain. Everything is **idempotent** — safe to
re-run. Paste each file into the Supabase SQL Editor (Dashboard → SQL Editor →
New query) and run it.

## Run order

```
schema/10_world_maps.sql   rf_world_maps (one saved map per name, upserted by
                            the World Map Editor's Save button), RLS
```

A fresh database: run `schema/10_world_maps.sql`. That is the whole backend so
far — the /maptool editor's saved maps.

**Reused-project note:** this Supabase project may also hold tables from
earlier games. This game's tables are namespaced (`rf_world_maps`) to avoid
colliding with anything pre-existing.

## Auth notes

- The anon key in `supabase.js` is public by design; access is governed by
  Row Level Security, not by hiding the key. The secret key never ships in
  client code.
- **No login system exists yet.** `rf_world_maps` is readable and writable by
  anyone holding the anon key — the same posture as the `/maptool` page
  itself, which has no login gate to check against. Tighten the policies in
  `schema/10_world_maps.sql` once real authentication exists and the editor
  should be restricted to admins.
