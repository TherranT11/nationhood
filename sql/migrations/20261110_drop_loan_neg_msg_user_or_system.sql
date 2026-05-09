-- ════════════════════════════════════════════════════════════════
-- Drop loan_neg_msg_user_or_system CHECK constraint
--
-- The CHECK requires either system_msg=true OR author_faction_id
-- IS NOT NULL. The author_faction_id FK is ON DELETE SET NULL.
-- When a corp is deleted (declare_corp_bankruptcy → DELETE FROM
-- factions), Postgres fires SET NULL on every player-typed message
-- that corp ever wrote in surviving negotiations. After SET NULL
-- the row has system_msg=false AND author_faction_id=NULL, the
-- CHECK fails, and the entire bankruptcy transaction aborts with:
--   new row for relation "loan_negotiation_messages" violates
--   check constraint "loan_neg_msg_user_or_system"
--
-- The CHECK was defensive — every INSERT path in the codebase
-- already explicitly sets one or the other. Dropping it lets
-- orphaned-author rows exist naturally after FK SET NULL. The
-- loan-negotiation modal already renders these as "Unknown" via
-- the `author?.faction_name || 'Unknown'` fallback (see
-- js/loan-negotiation-modal.js:779).
-- ════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.loan_negotiation_messages
    DROP CONSTRAINT IF EXISTS loan_neg_msg_user_or_system;

COMMIT;

NOTIFY pgrst, 'reload schema';
