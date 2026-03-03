-- Track when the last bill (of any type) was passed, so we can penalize
-- legislative inactivity in the government-approval event modifier.
ALTER TABLE nations ADD COLUMN IF NOT EXISTS last_bill_passed_tick INT DEFAULT NULL;

-- Back-fill from the most recent passed bill per nation (if any).
UPDATE nations n
SET last_bill_passed_tick = sub.max_tick
FROM (
    SELECT nation_id, MAX(passed_tick) AS max_tick
    FROM bills
    WHERE status IN ('passed', 'enacted') AND passed_tick IS NOT NULL
    GROUP BY nation_id
) sub
WHERE n.id = sub.nation_id
  AND n.last_bill_passed_tick IS NULL;
