-- ===========================================================================
-- 144 · Teardown 2a — drop the party-building leader actions.
-- Campaign (Rally / Ad Blitz), Fundraise, Attack and Recruit were removed from
-- the client (grid + handlers). These six RPCs were only ever invoked from the
-- client — a schema-wide search finds no internal callers (only doc comments),
-- so dropping them is self-contained.
--
-- KEPT: the shared helpers _begin_action() and _standing_cost() — ~two dozen
-- other actions (Produce, Reshuffle, sanctions, trade, military, …) use them.
--
-- Depends on: 40_events.sql (defines these). Apply in the Supabase SQL Editor.
-- ===========================================================================
drop function if exists public.party_rally();
drop function if exists public.party_ad_blitz();
drop function if exists public.party_fundraise();
drop function if exists public.party_attack(uuid);
drop function if exists public.party_recruit_scout();
drop function if exists public.party_recruit_hire(text);

notify pgrst, 'reload schema';
