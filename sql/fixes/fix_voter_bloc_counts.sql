-- Fix: Rescale voter_bloc voter_count values from percentage-based to population-based
-- Previously eligible_voters (a 0-100 stat) was used as the absolute voter count,
-- producing tiny bloc counts (5-15 per bloc). This rescales them so they represent
-- actual voter populations derived from population × (eligible_voters / 100).
--
-- The SQL election RPCs now derive the actual eligible count internally,
-- so bloc voter_counts just need to be proportionally correct (their absolute
-- values are rescaled at election time). But regenerating blocs from admin.html
-- will now produce correct counts.
--
-- For existing blocs, this rescales them to match the new formula.

WITH bloc_totals AS (
    SELECT nation_id, SUM(voter_count) AS total_voters
    FROM voter_blocs
    WHERE is_active = TRUE
    GROUP BY nation_id
)
UPDATE voter_blocs vb
SET voter_count = ROUND(
    (vb.voter_count::numeric / NULLIF(bt.total_voters, 0))
    * (n.population::numeric * COALESCE(n.eligible_voters, 65) / 100.0)
)::int
FROM nations n
JOIN bloc_totals bt ON bt.nation_id = n.id
WHERE n.id = vb.nation_id
  AND vb.is_active = TRUE
  AND bt.total_voters > 0
  AND n.population > 0;
