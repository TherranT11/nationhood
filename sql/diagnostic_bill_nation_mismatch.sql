-- Diagnostic: Find bills whose nation_id doesn't match their proposer's faction nation_id.
-- This catches bills that were accidentally created with the wrong nation_id,
-- e.g. a Palveran faction's bill showing up under Melizea.
--
-- Usage: Run in Supabase SQL editor. Any rows returned are mismatched.

SELECT
    b.id AS bill_id,
    b.bill_name,
    b.bill_type,
    b.status,
    b.nation_id AS bill_nation_id,
    bn.name AS bill_nation_name,
    f.nation_id AS faction_nation_id,
    fn.name AS faction_nation_name,
    f.faction_name AS proposed_by_faction,
    b.proposed_tick,
    b.passed_tick
FROM bills b
JOIN factions f ON f.id = b.proposed_by
JOIN nations bn ON bn.id = b.nation_id
JOIN nations fn ON fn.id = f.nation_id
WHERE b.nation_id != f.nation_id
ORDER BY b.proposed_tick DESC;
