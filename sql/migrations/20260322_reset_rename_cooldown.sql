-- Reset party rename cooldown for all factions.
-- Cooldown will re-engage (360 ticks) when a player next renames their party.

UPDATE factions SET last_rename_tick = NULL WHERE last_rename_tick IS NOT NULL;
