-- ════════════════════════════════════════════════════════════════════
-- 20270698 — Sierramar capital rename: Porto Serrano → Puerto Rey
--
-- The Sierramar nation card displays "Porto Serrano" as the capital
-- but the canonical name on the SierramarMap.png asset (rendered by
-- politician-nation.html since 18a543e) is "Puerto Rey". One-source-
-- of-truth sweep so every reader agrees.
--
-- Five touch points found in the tree:
--
--   1. nations.capital                                — the hero
--      data shown on the nation card. The primary fix.
--   2. nation_profiles.overview                       — prose
--      mentions "The capital, Porto Serrano, ..." in the long
--      description (20260421:104).
--   3. nation_profiles.history_timeline               — JSONB
--      timeline event: "1948 - Modern fishing fleet commissioned;
--      Porto Serrano becomes a regional shipping hub" (20260421:113).
--   4. nation_ports.port_name                         — Sierramar's
--      seeded fishing port (20260412:126); referenced by
--      shipping_routes.origin_port derivations.
--   5. shipping_routes.origin_port                    — defensive
--      sweep for any routes whose origin_port string was already
--      filled from the old capital name.
--
-- Each UPDATE is filtered on the OLD value so re-applying after a
-- successful run is a no-op. The JSONB swap goes through ::text
-- because PostgreSQL has no built-in JSONB string-replace and the
-- substring isn't a key path — re-parsing back with ::jsonb after
-- the textual replace is the standard idiom (works because both
-- "Porto Serrano" and "Puerto Rey" are valid JSON string contents
-- with no escaping concerns).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. nations.capital — the field shown on the nation card.
UPDATE nations
   SET capital = 'Puerto Rey'
 WHERE name    = 'Sierramar'
   AND capital = 'Porto Serrano';

-- 2. nation_profiles.overview — prose mention of the capital name.
UPDATE nation_profiles
   SET overview = REPLACE(overview, 'Porto Serrano', 'Puerto Rey')
 WHERE nation_id IN (SELECT id FROM nations WHERE name = 'Sierramar')
   AND overview LIKE '%Porto Serrano%';

-- 3. nation_profiles.history_timeline — JSONB timeline event.
UPDATE nation_profiles
   SET history_timeline = REPLACE(history_timeline::text,
                                  'Porto Serrano',
                                  'Puerto Rey')::jsonb
 WHERE nation_id IN (SELECT id FROM nations WHERE name = 'Sierramar')
   AND history_timeline::text LIKE '%Porto Serrano%';

-- 4. nation_ports.port_name — Sierramar's seeded fishing port.
UPDATE nation_ports
   SET port_name = 'Puerto Rey'
 WHERE port_name = 'Porto Serrano'
   AND nation_id IN (SELECT id FROM nations WHERE name = 'Sierramar');

-- 5. shipping_routes.origin_port — defensive sweep for any routes
-- whose origin string was already derived from the old capital.
-- Filter on origin_nation_id (not nation_id — different column on
-- this table).
UPDATE shipping_routes
   SET origin_port = 'Puerto Rey'
 WHERE origin_port = 'Porto Serrano'
   AND origin_nation_id IN (SELECT id FROM nations WHERE name = 'Sierramar');

NOTIFY pgrst, 'reload schema';

COMMIT;
