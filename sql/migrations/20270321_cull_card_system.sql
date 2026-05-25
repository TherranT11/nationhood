-- ============================================================================
-- CULL THE CARD / DECK SYSTEM
--
-- Removes the entire bilateral-issue card deck: the dispute cards, the legacy
-- card definitions / plays, and every hand/deck/turn/diplomatic-card column on
-- bilateral_issues. Leaves the issue itself + the press_claim action intact
-- (initiative, leverage, claim, dissidents, contested region, seen/action ticks
-- all stay). The issue UI becomes an empty shell pending a new mechanic.
-- ============================================================================

BEGIN;

-- ── RPCs ────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.resolve_dispute_card(UUID, TEXT);

-- ── Tables ──────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS public.issue_dispute_cards   CASCADE;
DROP TABLE IF EXISTS public.issue_card_plays       CASCADE;
DROP TABLE IF EXISTS public.issue_card_definitions CASCADE;

-- ── Card / deck columns on bilateral_issues ─────────────────────────────────
ALTER TABLE bilateral_issues
    DROP COLUMN IF EXISTS deck_remaining,
    DROP COLUMN IF EXISTS hand_a,
    DROP COLUMN IF EXISTS hand_b,
    DROP COLUMN IF EXISTS played_cards,
    DROP COLUMN IF EXISTS active_card,
    DROP COLUMN IF EXISTS active_card_played_by,
    DROP COLUMN IF EXISTS active_card_played_tick,
    DROP COLUMN IF EXISTS whose_turn,
    DROP COLUMN IF EXISTS last_card_played_tick,
    DROP COLUMN IF EXISTS deck_initialized,
    DROP COLUMN IF EXISTS diplomatic_lock_until_tick,
    DROP COLUMN IF EXISTS pending_diplomatic_card,
    DROP COLUMN IF EXISTS pending_diplomatic_deadline_tick,
    DROP COLUMN IF EXISTS pending_diplomatic_proposer,
    DROP COLUMN IF EXISTS current_card_number;

NOTIFY pgrst, 'reload schema';

COMMIT;
