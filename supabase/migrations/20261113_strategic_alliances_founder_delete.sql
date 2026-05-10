-- Mirror of sql/migrations/20261113_strategic_alliances_founder_delete.sql.
-- See that file's header for full context. Lets corp bankruptcy proceed
-- when the corp founded any strategic alliance.

BEGIN;

-- ── 1. Schema relaxation ───────────────────────────────────────
ALTER TABLE public.strategic_alliances
    ALTER COLUMN founder_faction_id DROP NOT NULL;

ALTER TABLE public.strategic_alliances
    DROP CONSTRAINT IF EXISTS strategic_alliances_founder_faction_id_fkey;

ALTER TABLE public.strategic_alliances
    ADD CONSTRAINT strategic_alliances_founder_faction_id_fkey
        FOREIGN KEY (founder_faction_id) REFERENCES public.factions(id)
        ON DELETE SET NULL;


-- ── 2. BEFORE DELETE trigger on factions ───────────────────────
CREATE OR REPLACE FUNCTION public.dissolve_alliances_on_founder_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tick INT;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE strategic_alliances
       SET status            = 'dissolved',
           dissolved_at_tick = v_tick,
           dissolved_reason  = 'all_left'
     WHERE founder_faction_id = OLD.id
       AND status <> 'dissolved';

    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_dissolve_alliances_on_founder_delete ON public.factions;
CREATE TRIGGER trg_dissolve_alliances_on_founder_delete
    BEFORE DELETE ON public.factions
    FOR EACH ROW
    EXECUTE FUNCTION dissolve_alliances_on_founder_delete();

COMMIT;

NOTIFY pgrst, 'reload schema';
