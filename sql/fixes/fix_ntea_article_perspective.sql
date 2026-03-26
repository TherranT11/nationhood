-- Fix trade article perspective for the NTEA and all other agreements/proposals.
--
-- Articles store direction (we_sell/we_buy) from the drafter's perspective,
-- tracked by author_nation_id. Older articles are missing this field, so the
-- receiving nation incorrectly sees "We sell to them" instead of "We buy from them".
--
-- This script patches author_nation_id into:
--   1. trade_agreements.articles        (active/enacted agreements)
--   2. diplomatic_proposals.proposal_data.articles  (pending proposals)
--   3. trade_negotiations.draft_articles (open negotiations)

-- ============================================================
-- PART A: Fix trade_agreements
-- ============================================================

-- A1: Fix the NTEA specifically (Melizea was the proposer)
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

-- A2: Generic fix — trace through negotiation_id to find proposer
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
FROM trade_negotiations tn
JOIN diplomatic_proposals dp ON dp.id = tn.initiating_proposal_id
WHERE ta.negotiation_id = tn.id
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(ta.articles) AS a
    WHERE (a->>'type' IN ('supply_commitment', 'tariff_reduction', 'subsidized_sector'))
      AND (a->'data'->>'author_nation_id') IS NULL
  );

-- ============================================================
-- PART B: Fix diplomatic_proposals (pending proposals in inbox)
-- ============================================================

-- For trade_agreement proposals, the proposer drafted all original articles.
-- Patch author_nation_id = proposing_nation_id on directional articles.
UPDATE diplomatic_proposals
SET proposal_data = jsonb_set(
    proposal_data,
    '{articles}',
    (
        SELECT jsonb_agg(
            CASE
                WHEN (art->>'type' IN ('supply_commitment', 'tariff_reduction', 'subsidized_sector'))
                     AND (art->'data'->>'author_nation_id') IS NULL
                THEN jsonb_set(
                    art,
                    '{data,author_nation_id}',
                    to_jsonb(proposing_nation_id::text)
                )
                ELSE art
            END
        )
        FROM jsonb_array_elements(proposal_data->'articles') AS art
    )
)
WHERE proposal_type = 'trade_agreement'
  AND proposal_data->'articles' IS NOT NULL
  AND jsonb_array_length(proposal_data->'articles') > 0
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(proposal_data->'articles') AS a
    WHERE (a->>'type' IN ('supply_commitment', 'tariff_reduction', 'subsidized_sector'))
      AND (a->'data'->>'author_nation_id') IS NULL
  );

-- ============================================================
-- PART C: Fix trade_negotiations (open/active negotiations)
-- ============================================================

-- For negotiations, the first participant opened it — use their nation_id.
UPDATE trade_negotiations
SET draft_articles = (
    SELECT jsonb_agg(
        CASE
            WHEN (art->>'type' IN ('supply_commitment', 'tariff_reduction', 'subsidized_sector'))
                 AND (art->'data'->>'author_nation_id') IS NULL
            THEN jsonb_set(
                art,
                '{data,author_nation_id}',
                to_jsonb((participants->0->>'nation_id')::text)
            )
            ELSE art
        END
    )
    FROM jsonb_array_elements(draft_articles) AS art
)
WHERE jsonb_array_length(draft_articles) > 0
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(draft_articles) AS a
    WHERE (a->>'type' IN ('supply_commitment', 'tariff_reduction', 'subsidized_sector'))
      AND (a->'data'->>'author_nation_id') IS NULL
  );
