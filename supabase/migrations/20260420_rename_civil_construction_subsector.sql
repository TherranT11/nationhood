-- Rename 'Civil Construction' → 'Civil Engineering' across corp data.
--
-- Background: corp-setup.html historically stored the civil-construction
-- subsector display name as 'Civil Construction', but every downstream
-- check (SUBSECTOR_TO_SECTOR map, sectorLabels, SUB_SUBSECTORS, bid text)
-- uses 'Civil Engineering'. Mismatch caused every civil-construction corp
-- to be LOCKED out of civil_engineering contracts in their HQ nation —
-- `SUBSECTOR_TO_SECTOR["Civil Construction"]` is undefined, so the
-- parent-corp qualification check at corp-operations.html:2934 always
-- returned false.
--
-- This migration aligns stored values with the canonical 'Civil Engineering'
-- label. Safe to re-run (idempotent via WHERE).

UPDATE public.factions
SET corp_subsector = 'Civil Engineering'
WHERE corp_subsector = 'Civil Construction';

UPDATE public.corp_properties
SET subsector = 'Civil Engineering'
WHERE subsector = 'Civil Construction';
