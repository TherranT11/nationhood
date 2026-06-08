-- ════════════════════════════════════════════════════════════════════
-- ADMIN / MODERATION: Remove $80M from Alejandro Aguilar (entrepreneur)
-- ════════════════════════════════════════════════════════════════════
-- Companion to release_aguilar_from_arrest.sql — that one released
-- Aguilar and unfroze his assets; this one debits $80M off the top.
-- The deduction targets factions.party_funds, which per the
-- 20270412 arrest migration is "the money chokepoint behind every
-- paid action" for entrepreneur factions.
--
-- Will NOT trip the arrest-machinery triggers:
--   • block_arrested_entrepreneur_funds only fires when
--     OLD.status = 'arrested'. Aguilar's status was flipped back
--     to 'active' before this SQL runs, so the trigger is inert.
--   • Even if the status were still 'arrested', the trigger
--     bypasses when auth.uid() IS NULL (admin SQL has no JWT) —
--     the bypass branch is explicitly documented in 20270412.
--
-- Safety:
--   • INTO STRICT raises if the lookup returns 0 or >1 rows, so a
--     missing or ambiguous Aguilar fails loudly inside the
--     transaction rather than silently no-op'ing or hitting two
--     factions.
--   • NOTICE prints before / after balances + the deduction so the
--     admin running it can sanity-check the result.
--   • NOT idempotent on purpose. This is a relative debit; re-running
--     would remove another $80M. If the script is accidentally
--     re-run the NOTICE makes that obvious immediately.
--   • Transactional. ROLLBACK reverses cleanly if the NOTICE looks
--     wrong before the COMMIT.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DO $$
DECLARE
    v_deduction constant numeric := 80000000;   -- $80M
    v_ent_id    uuid;
    v_before    numeric;
    v_after     numeric;
BEGIN
    SELECT id, party_funds INTO STRICT v_ent_id, v_before
      FROM public.factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND leader_first_name ILIKE 'Alejandro'
       AND leader_last_name  ILIKE 'Aguilar';

    UPDATE public.factions
       SET party_funds = party_funds - v_deduction
     WHERE id = v_ent_id
    RETURNING party_funds INTO v_after;

    RAISE NOTICE 'Removed $% from Alejandro Aguilar. Balance: $% → $% (id=%).',
        v_deduction, v_before, v_after, v_ent_id;

    IF v_after < 0 THEN
        RAISE WARNING
            'Aguilar''s party_funds is now NEGATIVE ($%). Verify this is intended before COMMIT.',
            v_after;
    END IF;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE EXCEPTION 'Alejandro Aguilar entrepreneur faction not found.';
    WHEN TOO_MANY_ROWS THEN
        RAISE EXCEPTION 'Multiple entrepreneur factions match "Alejandro Aguilar." Disambiguate before re-running.';
END $$;

COMMIT;
