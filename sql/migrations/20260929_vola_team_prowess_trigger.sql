-- 20260929_vola_team_prowess_trigger.sql
--
-- Make Team Prowess ALWAYS equal the sum of the 3 active player
-- ratings.
--
-- Until now, nations.national_team_prowess was recomputed in three
-- separate places — the SQL backfill, the recruit_vola_player_replacement
-- RPC, and the processVolaTeamLifecycle JS sweep. Any future code
-- path that touched vola_team_players without remembering to
-- recompute would silently drift.
--
-- Replace that arrangement with an AFTER-trigger on
-- vola_team_players: every INSERT / UPDATE / DELETE re-derives
-- the affected nation's prowess from the table itself, so the
-- column is a materialized view of SUM(rating) per nation_id.
-- Existing manual-recompute statements still work — they're just
-- no longer load-bearing.

BEGIN;

CREATE OR REPLACE FUNCTION _recompute_team_prowess(p_nation_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    UPDATE nations
    SET national_team_prowess = COALESCE((
        SELECT SUM(rating) FROM vola_team_players WHERE nation_id = p_nation_id
    ), 0)
    WHERE id = p_nation_id;
$$;

CREATE OR REPLACE FUNCTION _vola_team_players_prowess_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Recompute for whichever nation was affected. On UPDATE the
    -- nation_id can technically change; cover both old and new.
    IF TG_OP = 'DELETE' THEN
        PERFORM _recompute_team_prowess(OLD.nation_id);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.nation_id IS DISTINCT FROM OLD.nation_id THEN
            PERFORM _recompute_team_prowess(OLD.nation_id);
        END IF;
        PERFORM _recompute_team_prowess(NEW.nation_id);
        RETURN NEW;
    ELSE  -- INSERT
        PERFORM _recompute_team_prowess(NEW.nation_id);
        RETURN NEW;
    END IF;
END;
$$;

DROP TRIGGER IF EXISTS vola_team_players_prowess_sync ON public.vola_team_players;
CREATE TRIGGER vola_team_players_prowess_sync
    AFTER INSERT OR UPDATE OR DELETE ON public.vola_team_players
    FOR EACH ROW
    EXECUTE FUNCTION _vola_team_players_prowess_sync();

-- One-shot reconciliation in case the column drifted before the
-- trigger existed.
UPDATE nations n SET national_team_prowess = COALESCE((
    SELECT SUM(rating) FROM vola_team_players WHERE nation_id = n.id
), 0);

COMMIT;
