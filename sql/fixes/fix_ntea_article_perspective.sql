-- Fix NTEA (National Trade Expansion Agreement) between Melizea and Palvera
-- The supply_commitment articles are missing author_nation_id, which means
-- the receiving nation (Palvera) sees "We sell to them" instead of "We buy from them".
-- Melizea was the proposer, so we set author_nation_id = Melizea's UUID on all
-- directional articles.
--
-- This also patches ALL trade agreements where articles lack author_nation_id,
-- using the linked diplomatic_proposal to determine the proposer.

-- Step 1: Fix the NTEA specifically (Melizea → Palvera)
UPDATE trade_agreements
SET articles = (
    SELECT jsonb_agg(
        CASE
            WHEN (art->>'type' IN ('supply_commitment', 'tariff_reduction', 'subsidized_sector'))
                 AND (art->'data'->>'author_nation_id') IS NULL
            THEN jsonb_set(
                art,
                '{data,author_nation_id}',
                to_jsonb((SELECT id::text FROM nations WHERE LOWER(name) = 'melizea'))
            )
            ELSE art
        END
    )
    FROM jsonb_array_elements(articles) AS art
)
WHERE agreement_name ILIKE '%NTEA%'
   OR agreement_name ILIKE '%National Trade Expansion%';

-- Step 2: Generic fix for any other trade agreements missing author_nation_id.
-- Uses the diplomatic_proposal_id to look up the proposer nation.
-- Only updates directional article types (supply_commitment, tariff_reduction, subsidized_sector).
UPDATE trade_agreements ta
SET articles = (
    SELECT jsonb_agg(
        CASE
            WHEN (art->>'type' IN ('supply_commitment', 'tariff_reduction', 'subsidized_sector'))
                 AND (art->'data'->>'author_nation_id') IS NULL
            THEN jsonb_set(
                art,
                '{data,author_nation_id}',
                to_jsonb(dp.proposing_nation_id::text)
            )
            ELSE art
        END
    )
    FROM jsonb_array_elements(ta.articles) AS art
)
FROM diplomatic_proposals dp
WHERE ta.diplomatic_proposal_id = dp.id
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(ta.articles) AS a
    WHERE (a->>'type' IN ('supply_commitment', 'tariff_reduction', 'subsidized_sector'))
      AND (a->'data'->>'author_nation_id') IS NULL
  );
