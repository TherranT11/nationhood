-- ════════════════════════════════════════════════════════════════════
-- ONE-OFF: delete every politician faction (admin reset, end of testing).
-- ════════════════════════════════════════════════════════════════════
-- Purpose: hard wipe of test-era politician characters so the next test
-- cycle starts with a clean board. Targets factions.faction_type =
-- 'politician' only — entrepreneur and party factions are untouched.
--
-- WHY HARD DELETE
-- ───────────────
-- The existing soft-delete path (factions.abandoned_at via
-- politician_leave_party + friends, 20270372) keeps the row around so
-- election rolls, career events, AP ledger, and the rest of the
-- historical record still resolve. That's the right call during the
-- game; it's the wrong call after testing because the noise persists.
-- A real DELETE clears the entire dependency tree via the CASCADE +
-- SET NULL FK web that's already in place.
--
-- WHAT THIS DOES
-- ──────────────
-- One DELETE on factions WHERE faction_type = 'politician'. The 153
-- foreign-key chains pointing at factions(id) carry the cleanup:
--
--   CASCADE (~140 FKs): politician_career_events, AP ledger,
--     executive_orders, forum messages, corp_executives.faction_id,
--     endorsement snapshots, ap_ledger, party_chat, the works.
--     Rows referencing a deleted politician get removed.
--
--   SET NULL (~100 FKs): shipping_contract_winner_faction_id,
--     election candidate slots, etc. Row stays; the FK column nulls.
--
--   RESTRICT (~13 FKs): bank_loan_offers, equity_offers, finance
--     loan pipeline, shipping bid placements, strategic_alliances
--     founder, alliance_interest_votes initiator. The first four are
--     entrepreneur / party finance — politicians shouldn't appear in
--     those. The last two CAN catch politicians if a head of state
--     founded an alliance or initiated an interest vote during
--     testing; if so, the transaction rolls back with a clear PG
--     constraint error identifying the blocking row, and you can
--     pre-clean it (or use a soft delete instead — see below).
--
-- IF YOU HIT A RESTRICT BLOCK
-- ───────────────────────────
-- Quick triage:
--
--   SELECT id, name FROM strategic_alliances
--    WHERE founder_faction_id IN
--          (SELECT id FROM factions WHERE faction_type = 'politician');
--
--   SELECT id FROM alliance_interest_votes
--    WHERE initiator_faction_id IN
--          (SELECT id FROM factions WHERE faction_type = 'politician');
--
-- Delete those rows (or whichever else PG flagged) and re-run this
-- script. The whole thing is idempotent — a second run finds zero
-- politicians and updates zero rows.
--
-- ALTERNATIVE — SOFT DELETE
-- ─────────────────────────
-- If you'd rather mark them as abandoned and leave the history wired
-- up (no FK risk, but row noise stays):
--
--   UPDATE factions SET abandoned_at = now()
--    WHERE faction_type = 'politician' AND abandoned_at IS NULL;
--
-- USAGE
-- ─────
-- Run as a privileged role. Preview the row count before running:
--
--   SELECT COUNT(*) FROM factions WHERE faction_type = 'politician';
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DO $$
DECLARE
    v_count INT;
BEGIN
    DELETE FROM factions WHERE faction_type = 'politician';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE
        '[delete_all_politicians] removed % politician faction(s). CASCADE FKs cleaned dependents automatically; SET NULL FKs nulled their politician references.',
        v_count;
END $$;

COMMIT;
