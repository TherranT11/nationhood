-- ══════════════════════════════════════════════════════════════
-- Backfill cabinet ministries + monarch head_of_government rows
--
-- Two related production gaps surfaced from Hajjara's government
-- screen:
--
--   1. Cabinet only renders ministries that have rows in the
--      `ministries` table. Hajjara (and likely every nation seeded
--      before the canonical 11-key list was finalized — see
--      js/game/government-types.js:90 CABINET_MINISTRY_KEYS) is
--      missing several rows: Defense, Healthcare, Labor, and
--      Transportation. The slots literally don't show up because
--      no row exists. insert_danwei_phase18_ministries.sql is the
--      template — generalize it across all nations here.
--
--   2. The "appoint ministers" gate at government.html:1495
--      requires either a head_of_government row OR a filled
--      ministries.prime_minister row. Absolute monarchies skip
--      the parliamentary formation flow that writes
--      head_of_government, so the Monarch's faction never appears
--      as Head of Government — which silently disables the
--      appoint/dismiss buttons even though the Monarch is the
--      legitimate executive head. Default the Monarch to be their
--      own Head of Government; they can later appoint a separate
--      party via the Appoint Prime Minister royal action
--      (js/party-actions.js:269), which uses installHOG with
--      onConflict: 'nation_id' and overwrites this row cleanly.
--
-- Idempotent: NOT EXISTS guards on both inserts. Safe to re-run.
-- ══════════════════════════════════════════════════════════════


-- ── 1. Backfill missing cabinet ministry rows for every nation ──
-- Pure presidential systems skip the prime_minister slot (matches
-- the rationale in insert_danwei_phase18_ministries.sql). Every
-- other government type gets the full 12-key canonical set.
WITH canonical_keys(key, name, requires_pm_slot) AS (
    VALUES
        ('prime_minister', 'Prime Minister',           true ),
        ('interior',       'Ministry of the Interior', false),
        ('foreign',        'Foreign Ministry',         false),
        ('defense',        'Ministry of Defense',      false),
        ('finance',        'Ministry of Finance',      false),
        ('education',      'Ministry of Education',    false),
        ('healthcare',     'Ministry of Healthcare',   false),
        ('labor',          'Ministry of Labor',        false),
        ('justice',        'Ministry of Justice',      false),
        ('trade',          'Ministry of Trade',        false),
        ('energy',         'Ministry of Energy',       false),
        ('transportation', 'Ministry of Transportation', false)
)
INSERT INTO ministries (nation_id, ministry_key, ministry_name, is_active, party_id)
SELECT n.id, ck.key, ck.name, true, NULL
  FROM nations n
  CROSS JOIN canonical_keys ck
 WHERE NOT EXISTS (
        SELECT 1 FROM ministries mn
         WHERE mn.nation_id = n.id
           AND mn.ministry_key = ck.key
   )
   AND (
        -- Pure Presidential systems don't have a PM slot. Every other
        -- government type (parliamentary, semi-presidential, absolute
        -- monarchy) does. Aliases mirror GOVERNMENT_TYPE_ALIASES in
        -- js/game/government-types.js for PRESIDENTIAL_REPUBLIC.
        ck.key <> 'prime_minister'
        OR LOWER(COALESCE(n.government_type, '')) NOT IN ('presidential', 'presidential republic', 'executive presidency')
   );


-- ── 2. Default Monarch as Head of Government for absolute monarchies ──
-- Only applies to nations whose government_type canonicalizes to
-- Absolute Monarchy. Skipped for any nation that already has an
-- active head_of_government row (avoids clobbering a Monarch's
-- prior appointment of a separate PM party).
--
-- Pulls the person from the nations row's head_of_state_* fields
-- (the Monarch's identity is already stored there for display).
-- ideology defaults to '' if the faction has no ideology_value_1.
INSERT INTO head_of_government (
    nation_id, faction_id, first_name, last_name, age, ideology,
    appointed_tick, active
)
SELECT
    n.id,
    n.monarch_faction_id,
    COALESCE(n.head_of_state_first_name, 'Monarch'),
    COALESCE(n.head_of_state_last_name,  ''),
    COALESCE(n.head_of_state_age,        50),
    COALESCE(f.ideology_value_1,         ''),
    COALESCE((SELECT current_tick FROM shard WHERE name = 'Alpha Shard'), 0),
    true
  FROM nations n
  LEFT JOIN factions f ON f.id = n.monarch_faction_id
 WHERE LOWER(COALESCE(n.government_type, '')) IN ('absolute monarchy', 'absolute_monarchy', 'monarchy')
   AND n.monarch_faction_id IS NOT NULL
   AND NOT EXISTS (
        SELECT 1 FROM head_of_government hog
         WHERE hog.nation_id = n.id
           AND hog.active = true
   );


-- ── Sanity counts ──
SELECT n.name,
       COUNT(*) AS ministry_rows,
       SUM(CASE WHEN mn.party_id IS NULL THEN 1 ELSE 0 END) AS vacant_rows
  FROM ministries mn
  JOIN nations n ON n.id = mn.nation_id
 GROUP BY n.name
 ORDER BY n.name;

SELECT n.name AS nation, hog.first_name, hog.last_name, hog.faction_id
  FROM head_of_government hog
  JOIN nations n ON n.id = hog.nation_id
 WHERE LOWER(COALESCE(n.government_type, '')) IN ('absolute monarchy', 'absolute_monarchy', 'monarchy')
   AND hog.active = true;

NOTIFY pgrst, 'reload schema';
