-- Auto-seed factions.ent_origin_nation on entrepreneur creation.
--
-- Until now the only seeding paths were:
--   1. The one-time 20270490 backfill (WHERE ent_origin_nation IS NULL)
--   2. The entrepreneur_travel RPC (COALESCE-on-first-call seed)
--
-- Neither covers a brand-new entrepreneur created via the client
-- INSERT in entrepreneur-archetype.html. Same-commit client now
-- writes ent_origin_nation explicitly, but a trigger gives us
-- defense-in-depth for any other creation path (admin tooling, future
-- RPCs, hand-written SQL): if an entrepreneur row arrives with NULL
-- ent_origin_nation, the trigger snapshots NEW.nation into it.
--
-- BEFORE INSERT trigger, restricted to faction_type='entrepreneur' to
-- avoid touching politicians / parties / corps / military. NULL-only
-- guard so the client's explicit value isn't overwritten.

BEGIN;

CREATE OR REPLACE FUNCTION public._trg_seed_ent_origin_nation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.faction_type = 'entrepreneur'
       AND NEW.ent_origin_nation IS NULL
       AND NEW.nation IS NOT NULL
    THEN
        NEW.ent_origin_nation := NEW.nation;
    END IF;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_seed_ent_origin_nation ON public.factions;
CREATE TRIGGER trg_seed_ent_origin_nation
    BEFORE INSERT ON public.factions
    FOR EACH ROW EXECUTE FUNCTION public._trg_seed_ent_origin_nation();

COMMENT ON FUNCTION public._trg_seed_ent_origin_nation() IS
    'Auto-snapshots factions.ent_origin_nation = nation on entrepreneur INSERT when origin is NULL. Defense-in-depth for the home-nation gate (20270490) — the client also sets it explicitly, but this catches admin / RPC / hand-written paths.';

COMMIT;
