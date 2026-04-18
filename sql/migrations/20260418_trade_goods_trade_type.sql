-- ══════════════════════════════════════════════════════════════════════════════
-- Migration: Introduce `goods_trade` agreement type + backfill drifted rows
-- ══════════════════════════════════════════════════════════════════════════════
--
-- Background:
-- The trade-negotiation wizard stores a single `agreement_type` on each
-- negotiation. Historically that type was set once when the wizard opened and
-- never updated, even when the user filled the negotiation with structured
-- articles (trade_flow / transfer / market_access / tariff_reduction /
-- exit_terms) that don't match the original type.
--
-- The common drift: the wizard defaulted to 'fta' ("Free Trade Agreement",
-- meaning *blanket tariff elimination across all sectors*), but the articles
-- the user actually filled in were product-specific goods contracts. The tick
-- processor (advance-tick/index.ts lines ~2081) treats agreement_type='fta' as
-- "set tariffModMap to 1.0 for every sector between these two nations",
-- which silently granted free trade far beyond what the user negotiated.
--
-- Fix applied in the client (js/game/diplomacy-constants.js +
-- diplomacy.html#inferAgreementType): new type 'goods_trade' with an empty
-- required_articles list; the client re-syncs agreement_type on every
-- draft_articles write so future negotiations can't drift.
--
-- This migration backfills existing rows so historical data matches the new
-- invariant and the tick processor stops granting the phantom blanket FTA.
-- ══════════════════════════════════════════════════════════════════════════════

-- 1) Negotiations in any status that are stored as 'fta' but whose draft
--    articles (ignoring the optional 'duration' article) are ALL structured
--    article types. These are the drifted rows.
--
--    We use jsonb_path_exists + a NOT EXISTS subquery so we only flip rows
--    where EVERY non-duration article is in the structured set.
WITH candidates AS (
    SELECT id, draft_articles
    FROM trade_negotiations
    WHERE agreement_type = 'fta'
      AND draft_articles IS NOT NULL
      AND jsonb_array_length(draft_articles) > 0
      -- Must contain at least one structured article — otherwise it's a real FTA
      AND EXISTS (
          SELECT 1
          FROM jsonb_array_elements(draft_articles) AS a
          WHERE COALESCE(a->>'article_type', a->>'type') IN
                ('trade_flow', 'transfer', 'market_access', 'tariff_reduction', 'exit_terms')
      )
      -- Must NOT contain any legacy FTA-specific article types (sector_exemption,
      -- text_article), ignoring 'duration' which is allowed in either world.
      AND NOT EXISTS (
          SELECT 1
          FROM jsonb_array_elements(draft_articles) AS a
          WHERE COALESCE(a->>'article_type', a->>'type') NOT IN
                ('trade_flow', 'transfer', 'market_access', 'tariff_reduction',
                 'exit_terms', 'duration')
      )
)
UPDATE trade_negotiations n
SET agreement_type = 'goods_trade'
FROM candidates c
WHERE n.id = c.id;

-- 2) Same treatment for the active `trade_agreements` table — rows ratified
--    from drifted negotiations inherited the stale 'fta' label and are still
--    triggering the blanket-tariff path in the tick processor every tick.
--
--    trade_agreements stores its articles on column `articles` (jsonb) rather
--    than `draft_articles`; same shape.
WITH candidates AS (
    SELECT id, articles
    FROM trade_agreements
    WHERE agreement_type = 'fta'
      AND articles IS NOT NULL
      AND jsonb_array_length(articles) > 0
      AND EXISTS (
          SELECT 1
          FROM jsonb_array_elements(articles) AS a
          WHERE COALESCE(a->>'article_type', a->>'type') IN
                ('trade_flow', 'transfer', 'market_access', 'tariff_reduction', 'exit_terms')
      )
      AND NOT EXISTS (
          SELECT 1
          FROM jsonb_array_elements(articles) AS a
          WHERE COALESCE(a->>'article_type', a->>'type') NOT IN
                ('trade_flow', 'transfer', 'market_access', 'tariff_reduction',
                 'exit_terms', 'duration')
      )
)
UPDATE trade_agreements a
SET agreement_type = 'goods_trade'
FROM candidates c
WHERE a.id = c.id;
