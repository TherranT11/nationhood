-- One-off (run once): reset every political party's ideology and conviction balance
-- for the conviction-driven model. A party now starts with NO ideology — its archetype
-- is set when it adopts its first conviction — and one Conviction point to spend.
--
-- NOT part of the auto-applied schema: re-running it would wipe ideologies parties have
-- since taken on and reset their points, so apply it deliberately, once.

-- Self-contained: ensure archetype is nullable first (no-op if schema/20 already did),
-- so this runs even on a database that predates that migration.
alter table public.parties alter column archetype drop not null;
update public.parties set archetype = null, conviction = 1;
