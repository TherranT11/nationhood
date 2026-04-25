-- ============================================================
-- Danwei ministries — Phase 18 of new-nation walkthrough
-- ============================================================
-- Seeds the 11 cabinet ministry slots vacant — ready to be filled
-- after the first presidential election. Matches the canonical
-- CABINET_MINISTRY_KEYS list in js/game/government-types.js:90,
-- minus prime_minister (Danwei is pure Presidential — hasParliamentaryPM
-- returns false, so the PM slot is never used).
--
-- Vacant defaults: party_id NULL, minister_first_name/_last_name/_age NULL,
-- minister_approval 50 (schema default), funding_level 1.0 (schema default),
-- is_active true. Tick code that queries ministries by nation_id will find
-- all 11 keys present and ready for the post-election cabinet fill.
--
-- Idempotent: WHERE NOT EXISTS guard per (nation_id, ministry_key) so
-- re-runs don't duplicate. The ministries table has no unique constraint
-- on (nation_id, ministry_key), so we can't rely on ON CONFLICT.
--
-- Run AFTER insert_danwei.sql (Phase 2) so the nations row exists.
-- ============================================================

INSERT INTO ministries (nation_id, ministry_key, ministry_name, is_active, party_id)
SELECT n.id, m.key, m.name, true, NULL
  FROM nations n,
       (VALUES
           ('interior',       'Ministry of the Interior'),
           ('foreign',        'Foreign Ministry'),
           ('defense',        'Ministry of Defense'),
           ('finance',        'Ministry of Finance'),
           ('education',      'Ministry of Education'),
           ('healthcare',     'Ministry of Healthcare'),
           ('labor',          'Ministry of Labor'),
           ('justice',        'Ministry of Justice'),
           ('trade',          'Ministry of Trade'),
           ('energy',         'Ministry of Energy'),
           ('transportation', 'Ministry of Transportation')
       ) AS m(key, name)
 WHERE LOWER(n.name) = 'danwei'
   AND NOT EXISTS (
       SELECT 1 FROM ministries mn
        WHERE mn.nation_id = n.id
          AND mn.ministry_key = m.key
   );

-- Verify: all 11 ministry rows present, all vacant.
SELECT n.name,
       mn.ministry_key,
       mn.ministry_name,
       mn.is_active,
       mn.party_id,
       mn.minister_first_name,
       mn.minister_last_name,
       mn.minister_approval,
       mn.funding_level
  FROM ministries mn
  JOIN nations n ON n.id = mn.nation_id
 WHERE LOWER(n.name) = 'danwei'
 ORDER BY mn.ministry_key;

-- Sanity: row count must equal 11.
SELECT COUNT(*) AS ministry_rows
  FROM ministries mn
  JOIN nations n ON n.id = mn.nation_id
 WHERE LOWER(n.name) = 'danwei';
