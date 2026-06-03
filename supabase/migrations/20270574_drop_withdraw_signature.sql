-- ════════════════════════════════════════════════════════════════════
-- 20270574 — Drop withdraw_corp_negotiation_signature (Phase D rollback)
--
-- Audit follow-up on 20270573. Phase D's scope was "Just signing"
-- (per the user's pick on the scope question) plus a month-picker
-- expiry. I added withdraw_corp_negotiation_signature on momentum
-- as a "natural complement", but the design is now confirmed:
-- binding contracts only ever exit via expiry. No terminate, no
-- withdraw — once both sigs land, the contract is bound until
-- expires_at_tick.
--
-- Withdraw_signature would have been a back-door termination
-- mechanic without the design work (cooldowns, reputation hits,
-- breach penalties — none of which apply here because the design
-- says "only expires"). Stripping it now keeps binding a one-way
-- door.
--
-- The recovery affordance for "I signed but the counterparty is
-- stalling" remains the existing cancel_corp_negotiation call,
-- which still works in 'awaiting_signatures' regardless of how
-- many signatures have landed.
--
-- _recalc_corp_negotiation_status is unchanged. Its CASE was
-- written to handle a backwards transition (binding →
-- awaiting_signatures when sig count drops), but without
-- withdraw_signature the only way for sig count to drop is contract
-- or corp deletion (both of which CASCADE the whole row away). The
-- backwards branch becomes dead but not wrong — leaving as-is per
-- "smallest correct change". A future migration can simplify if
-- that branch genuinely sits unused for long enough.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DROP FUNCTION IF EXISTS public.withdraw_corp_negotiation_signature(uuid, uuid);

NOTIFY pgrst, 'reload schema';

COMMIT;
