-- ════════════════════════════════════════════════════════════════════
-- BACKFILL nations.total_seats FROM SEATED PARTIES
-- ════════════════════════════════════════════════════════════════════
-- Now that Absolute Monarchies surface a parliament (the gate is "no
-- parties" rather than gov_type, per the politician-nation.html
-- change), the nations.total_seats column needs to reflect the seats
-- that already exist on the factions table. Hajjara is the prompt: it
-- has HRF (75 seats) + Reform Party (25 seats) but nations.total_seats
-- = 0, so the chamber arc renders empty, no party crosses majority,
-- and the PM card stays vacant.
--
-- For every nation whose total_seats is 0/NULL and that has at least
-- one seated movement_party (faction_type='movement_party',
-- abandoned_at IS NULL, seats > 0), set total_seats = SUM(seats). The
-- canonical "size of this parliament" stays one column on nations —
-- this migration just brings the column in line with reality on
-- chambers we hadn't been displaying.
--
-- Idempotent: once total_seats > 0 the row drops out of the WHERE
-- clause on re-runs. Nations with intentionally 0-seat chambers (none
-- yet, but possible) aren't touched as long as no parties are seated
-- on them.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

UPDATE nations n
   SET total_seats = sub.total_party_seats
  FROM (
    SELECT nation_id, SUM(seats)::int AS total_party_seats
      FROM factions
     WHERE faction_type = 'movement_party'
       AND abandoned_at IS NULL
       AND seats > 0
     GROUP BY nation_id
  ) sub
 WHERE n.id = sub.nation_id
   AND COALESCE(n.total_seats, 0) = 0
   AND sub.total_party_seats > 0;

COMMIT;
