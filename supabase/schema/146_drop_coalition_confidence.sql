-- ===========================================================================
-- 146 · Teardown 2c — drop the coalition & no-confidence action RPCs.
-- Negotiate, Leave Coalition and No Confidence (and the Government-page
-- formation flow) were removed from the client. This drops every RPC that could
-- create or act on a coalition or table a no-confidence motion, so the whole
-- layer is unreachable even from a crafted client. All 18 are verified to have
-- no internal callers.
--
-- DELIBERATELY KEPT (dormant), NOT dropped — and why:
--   • The negotiations / negotiation_parties / negotiation_terms /
--     negotiation_messages tables. resolve_election and _seat_government
--     (schema/60) QUERY these directly and governments.source_negotiation_id is
--     a FK to them. With every insert-path RPC gone the tables stay empty, so
--     the formation cascade's `status = 'committed'` lookup always finds nothing
--     and falls through to single-party government — unchanged, no rewrite.
--   • Helpers _majority() (used by the election resolver AND all proposal
--     voting, schema/60 + 81) and is_negotiation_participant() (backs the
--     negotiations-table RLS). Dropping either would break kept systems.
--   • _my_seated_party / _negotiation_seats / _assert_negotiation_open — now
--     unused but harmless; left with the tables they belong to.
--
-- Fully removing the tables + the coalition path inside resolve_election /
-- _seat_government is a separate, higher-risk engine change that needs DB
-- testing (it can't be verified statically) — deferred, not done here.
--
-- Depends on: 45, 60, 81, 126, 139. Apply in the Supabase SQL Editor.
-- ===========================================================================

-- Coalition negotiation actions (schema/45)
drop function if exists public.coalition_open(uuid);
drop function if exists public.coalition_invite(uuid, uuid);
drop function if exists public.coalition_respond(uuid, boolean);
drop function if exists public.coalition_add_term(uuid, text);
drop function if exists public.coalition_update_term(uuid, text, jsonb, boolean);
drop function if exists public.coalition_remove_term(uuid);
drop function if exists public.coalition_set_agree(uuid, boolean);
drop function if exists public.coalition_remove_party(uuid, uuid);
drop function if exists public.coalition_leave(uuid);
drop function if exists public.coalition_commit(uuid);
drop function if exists public.coalition_withdraw(uuid);
drop function if exists public.coalition_invites_for_me();
drop function if exists public.coalition_post_message(uuid, text);

-- Negotiation → objective link (schema/139)
drop function if exists public.coalition_set_objective(uuid, uuid);

-- Seating / dissolving a coalition government (schema/60) and leaving it (126)
drop function if exists public.coalition_install(uuid);
drop function if exists public.coalition_renege();
drop function if exists public.leave_coalition();

-- No-confidence motion (schema/81)
drop function if exists public.propose_no_confidence();

notify pgrst, 'reload schema';
