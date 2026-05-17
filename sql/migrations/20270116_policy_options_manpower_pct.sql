-- Army Composition: per-option manpower mobilization rate.
--
-- policy_options.manpower_pct = the % of the nation's population this
-- option mobilizes as Manpower. The tick engine
-- (processArmyManpower, js/game/political-actions.js) sums manpower_pct
-- across a nation's active laws, mobilizes that % of population, and
-- materializes the army's 70% share onto the nation's army faction
-- (factions.army_manpower — the one army stat that is a raw headcount,
-- not 0-100). The navy 20% + air force 10% are intentionally discarded
-- until those faction branches exist.
--
-- 0 for every option of every other policy (the default), so only the
-- Army Composition policy's five options carry a non-zero value:
--   No Standing Army 0 · Volunteer 1 · Limited 3 · Universal 10 ·
--   Mass Mobilization 25  (percent of population).
--
-- Idempotent (ADD COLUMN IF NOT EXISTS). No backfill needed — DEFAULT 0
-- makes every existing option a no-op.

BEGIN;

ALTER TABLE public.policy_options
  ADD COLUMN IF NOT EXISTS manpower_pct NUMERIC NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.policy_options.manpower_pct IS
  'Army Composition: %% of nation population this option mobilizes as Manpower. processArmyManpower sums it across a nation''s active laws, takes population * pct / 100, and writes 70%% of that to the army faction (factions.army_manpower); navy/air 30%% discarded until those branches exist. 0 = no manpower effect (all non-Army-Composition options).';

COMMIT;

NOTIFY pgrst, 'reload schema';
