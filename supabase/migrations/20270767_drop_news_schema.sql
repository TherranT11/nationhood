-- ════════════════════════════════════════════════════════════════════
-- 20270767 — Drop the news system schema
--
-- The newspaper UI (news.html / js/news.js / css/news.css) and the
-- dashboard.html shell that embedded it have been culled in the same
-- commit. This migration removes the back-end schema that supported
-- them so the database stops carrying dead tables.
--
-- Surfaces being removed:
--   • Tables:
--       player_articles  — author-submitted articles + headlines
--       article_likes    — per-faction like toggles
--   • RPCs:
--       toggle_article_like(uuid, uuid, int)
--       article_sector_popularity(uuid, uuid)
--
-- Safety verified before this drop:
--   • No code outside the deleted news files references these tables
--     or RPCs (confirmed by a repo-wide grep that excluded news.js,
--     the sql/migrations/ history, and dist/).
--   • The only call site outside the news bundle was bills.js, which
--     fired an `insert_news_event` stub RPC that never landed on the
--     server. That call site is removed in the same commit.
--   • adjust_momentum() is NOT dropped — it's also consumed by the
--     bills system per its 20260331 origin migration.
--
-- DROP TABLE ... CASCADE catches any straggler foreign keys (e.g.
-- article_likes.article_id → player_articles.id). DROP FUNCTION
-- IF EXISTS keeps the migration idempotent on re-run.
--
-- This is destructive — the row data in player_articles and
-- article_likes is permanently removed. Per user confirmation
-- ("cull all the news site code … it is redundant and will never
-- be used again"), the data archive is not preserved.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DROP FUNCTION IF EXISTS public.toggle_article_like(uuid, uuid, int);
DROP FUNCTION IF EXISTS public.article_sector_popularity(uuid, uuid);

DROP TABLE IF EXISTS public.article_likes    CASCADE;
DROP TABLE IF EXISTS public.player_articles  CASCADE;

NOTIFY pgrst, 'reload schema';

COMMIT;
